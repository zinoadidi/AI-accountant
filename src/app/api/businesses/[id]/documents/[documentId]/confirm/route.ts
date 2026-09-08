import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, canUploadDocuments } from "@/lib/permissions";

const schema = z.object({ category: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: { id: string; documentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canUploadDocuments(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const document = await prisma.document.update({
    where: { id: params.documentId },
    data: { confirmedCategory: parsed.data.category, status: "REVIEWED" },
  });

  return NextResponse.json(document);
}
