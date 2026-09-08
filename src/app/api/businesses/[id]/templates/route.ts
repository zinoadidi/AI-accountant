import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, getFilingAccess, canManageFilings } from "@/lib/permissions";

const schema = z.object({ name: z.string().min(1), html: z.string().min(1) });

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) {
    // No standing membership — allow read-only access if the caller has an
    // active engagement on a specific filing in this business (they need to
    // pick a template when generating an invoice for that filing).
    const filingId = new URL(request.url).searchParams.get("filingId");
    const access = filingId ? await getFilingAccess(userId, params.id, filingId) : null;
    if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.invoiceTemplate.findMany({
    where: { businessId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canManageFilings(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const template = await prisma.invoiceTemplate.create({
    data: { businessId: params.id, name: parsed.data.name, html: parsed.data.html },
  });

  return NextResponse.json(template);
}
