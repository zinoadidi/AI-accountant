import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { revenues } from "@/lib/db";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { suggestNoInvoiceWithAI } from "@/lib/ai";

const schema = z.object({
  transactionDate: z.string().datetime(),
  amount: z.number(),
  currency: z.string().default("EUR"),
  description: z.string().optional(),
  counterpartyNameRaw: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await revenues.forFiling(params.filingId);
  const entries = all
    .filter((e) => e.businessId === params.id)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  return NextResponse.json(entries);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access || !canManageFilings(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // AI-backed no-invoice hint (Meta Spark, heuristic fallback) so every
  // entry arrives with a suggestion ready to accept in one click.
  const { reason } = await suggestNoInvoiceWithAI({
    description: parsed.data.description,
    counterpartyNameRaw: parsed.data.counterpartyNameRaw,
    amount: parsed.data.amount,
  });

  const entry = await revenues.create({
    businessId: params.id,
    filingPeriodId: params.filingId,
    transactionDate: parsed.data.transactionDate,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    description: parsed.data.description,
    counterpartyNameRaw: parsed.data.counterpartyNameRaw,
    suggestedNoInvoiceReason: reason,
  });

  return NextResponse.json(entry);
}
