import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { documents, filings, revenues, statements } from "@/lib/db";
import type { WithId, DocumentDoc, RevenueDoc } from "@/lib/db";
import { getMembership, canManageFilings } from "@/lib/permissions";
import { suggestNoInvoiceWithAI } from "@/lib/ai";

const schema = z.object({
  filingPeriodId: z.string().min(1),
});

const DAY_MS = 86_400_000;

function dateDiffDays(a: string, b: string): number {
  return Math.abs(Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / DAY_MS;
}

function toIsoDate(dateOnly: string): string {
  const d = new Date(`${dateOnly.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// A debit is plausibly covered by an uploaded expense document when the
// suggested amount matches and the filename or upload date looks related.
function debitPlausible(tx: { amount: number; date: string; description: string | null; counterpartyName: string | null }, doc: WithId<DocumentDoc>): boolean {
  if (doc.suggestedAmount === null || Math.abs(doc.suggestedAmount) !== tx.amount) return false;
  const hay = `${tx.description ?? ""} ${tx.counterpartyName ?? ""}`.toLowerCase();
  const fileTokens = doc.fileName.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  if (fileTokens.some((t) => hay.includes(t))) return true;
  const docDate = doc.createdAt.slice(0, 10);
  const txDate = tx.date.slice(0, 10);
  if (docDate && txDate && !Number.isNaN(Date.parse(docDate)) && !Number.isNaN(Date.parse(txDate))) {
    if (Math.abs(Date.parse(docDate) - Date.parse(txDate)) / DAY_MS <= 7) return true;
  }
  return false;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; statementId: string } }
) {
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
  const { filingPeriodId } = parsed.data;

  const filing = await filings.getBusinessScoped(filingPeriodId, params.id);
  if (!filing) return NextResponse.json({ error: "Filing not found" }, { status: 404 });

  const statement = await statements.get(params.statementId);
  if (!statement || statement.businessId !== params.id) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });
  }

  const existing = (await revenues.forFiling(filingPeriodId)).filter(
    (r) => r.businessId === params.id
  );
  const docs = await documents.byBusiness(params.id);

  const usedRevenueIds = new Set<string>();
  const matched: { txId: string; revenueId: string }[] = [];
  const created: string[] = [];
  const unmatchedDebits: string[] = [];
  const revenueByTx = new Map<string, WithId<RevenueDoc>>();

  for (const tx of statement.transactions) {
    if (tx.direction === "C") {
      const hit =
        existing.find((r) => !usedRevenueIds.has(r.id) && r.statementTxId === tx.id) ??
        existing.find(
          (r) =>
            !usedRevenueIds.has(r.id) &&
            Math.abs(r.amount) === tx.amount &&
            dateDiffDays(r.transactionDate, tx.date) <= 2
        );
      if (hit) {
        usedRevenueIds.add(hit.id);
        matched.push({ txId: tx.id, revenueId: hit.id });
        revenueByTx.set(tx.id, hit);
      } else {
        // Non-binding AI hint only; noInvoiceReason stays null for a human.
        const { reason } = await suggestNoInvoiceWithAI({
          description: tx.description,
          counterpartyNameRaw: tx.counterpartyName,
          amount: tx.amount,
        });
        const entry = await revenues.create({
          businessId: params.id,
          filingPeriodId,
          transactionDate: toIsoDate(tx.date),
          amount: tx.amount,
          currency: tx.currency || "EUR",
          description: tx.description,
          counterpartyNameRaw: tx.counterpartyName,
          suggestedNoInvoiceReason: reason,
          statementTxId: tx.id,
        });
        usedRevenueIds.add(entry.id);
        created.push(entry.id);
        revenueByTx.set(tx.id, entry);
      }
    } else {
      const covered = docs.some((d) => debitPlausible(tx, d));
      if (!covered) unmatchedDebits.push(tx.id);
    }
  }

  await statements.attachFiling(statement.id, filingPeriodId);

  const needsAttention = statement.transactions
    .filter((tx) => tx.direction === "C" && tx.amount >= 1000)
    .filter((tx) => {
      const rev = revenueByTx.get(tx.id);
      return rev ? !rev.customerName : true;
    })
    .map((tx) => tx.id);

  return NextResponse.json({ matched, created, unmatchedDebits, needsAttention });
}
