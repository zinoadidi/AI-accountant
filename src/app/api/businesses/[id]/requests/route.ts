import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requests } from "@/lib/db";
import { getMembership, canManageFilings } from "@/lib/permissions";

const schema = z.object({
  counterparty: z.string().min(1).max(200),
  amount: z.number().optional(),
  currency: z.string().max(8).optional(),
  filingPeriodId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filingId = new URL(request.url).searchParams.get("filingId");
  const list = filingId
    ? (await requests.forFiling(filingId)).filter((r) => r.businessId === params.id)
    : await requests.byBusiness(params.id);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canManageFilings(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await requests.create({
    businessId: params.id,
    filingPeriodId: parsed.data.filingPeriodId ?? null,
    counterparty: parsed.data.counterparty,
    amount: parsed.data.amount ?? null,
    currency: parsed.data.currency ?? null,
    notes: parsed.data.notes ?? null,
  });

  return NextResponse.json(created);
}
