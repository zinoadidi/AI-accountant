import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requests, updateDoc } from "@/lib/db";
import { getMembership, canManageFilings } from "@/lib/permissions";
import { REQUEST_STATUSES } from "@/lib/types";

const schema = z.object({
  status: z.enum(REQUEST_STATUSES).optional(),
  counterparty: z.string().min(1).max(200).optional(),
  amount: z.number().nullable().optional(),
  currency: z.string().max(8).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

async function scoped(businessId: string, requestId: string) {
  const item = await requests.get(requestId);
  return item && item.businessId === businessId ? item : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canManageFilings(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await scoped(params.id, params.requestId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await updateDoc("request", params.requestId, { ...parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  void request;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canManageFilings(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await scoped(params.id, params.requestId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await requests.remove(params.requestId);
  return NextResponse.json({ ok: true });
}
