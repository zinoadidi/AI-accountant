import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { filings } from "@/lib/db";
import { getMembership, canManageFilings } from "@/lib/permissions";
import { FILING_PERIOD_TYPES } from "@/lib/types";

const schema = z.object({
  label: z.string().min(1),
  type: z.enum(FILING_PERIOD_TYPES),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filingPeriods = await filings.byBusiness(params.id);
  filingPeriods.sort((a, b) => b.periodStart.localeCompare(a.periodStart));

  return NextResponse.json(filingPeriods);
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

  const filingPeriod = await filings.create({ businessId: params.id, ...parsed.data });

  return NextResponse.json(filingPeriod);
}
