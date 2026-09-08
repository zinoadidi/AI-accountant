import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { suggestNoInvoiceReason } from "@/lib/invoicing";

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

  const entries = await prisma.revenueEntry.findMany({
    where: { filingPeriodId: params.filingId, businessId: params.id },
    orderBy: { transactionDate: "desc" },
  });

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

  const entry = await prisma.revenueEntry.create({
    data: {
      businessId: params.id,
      filingPeriodId: params.filingId,
      transactionDate: new Date(parsed.data.transactionDate),
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      description: parsed.data.description,
      counterpartyNameRaw: parsed.data.counterpartyNameRaw,
      suggestedNoInvoiceReason: suggestNoInvoiceReason(parsed.data),
    },
  });

  return NextResponse.json(entry);
}
