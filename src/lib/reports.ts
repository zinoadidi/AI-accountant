// In-app EMTA-fillable worksheets (manual path): KMD monthly VAT return and
// the annual report. Every figure is pre-filled from reconciled app data
// where possible and editable where it isn't; the accountant copies the
// result into EMTA / Ariregister and marks the filing filed.
//
// KMD line meanings verified against EMTA's KMD2 data composition and
// practitioner references: 1 standard-rate supply (24% since 01.07.2025),
// 2 reduced-rate (9%/5%), 3/3.1 0% + intra-EU supply, 4 VAT due (computed),
// 4.1 import VAT on KMD, 5/5.1 deductible input VAT, 5.3/5.4 car VAT,
// 6/6.1/7 reverse-charge acquisitions, 8 exempt supply, 10/11 adjustments.
// KMD INF annex needs per-partner totals over €1000 — computed as infPartners.
import { revenues, documents, statements } from "@/lib/db";

export const STANDARD_VAT_RATE = 24;
export const REDUCED_VAT_RATES = [9, 5];

export type KmdComputed = {
  line1Base: number; // standard-rate supply from generated invoices
  line2Base: number; // reduced-rate supply (not tracked separately yet → 0)
  line3Base: number; // 0%/intra-EU supply (not tracked separately yet → 0)
  expenseDocCount: number; // supporting hint for line 5
  expenseHintTotal: number; // sum of suggestedAmount on expense docs
  infPartners: { name: string; total: number }[]; // per-customer totals ≥ €1000
};

export async function computeKmd(businessId: string, filingPeriodId: string): Promise<KmdComputed> {
  const [entries, docs] = await Promise.all([
    revenues.forFiling(filingPeriodId),
    documents.byBusiness(businessId),
  ]);
  const mine = entries.filter((e) => e.businessId === businessId);
  const invoiced = mine.filter((e) => e.status === "INVOICE_GENERATED");
  const line1Base = round2(invoiced.reduce((s, e) => s + e.amount, 0));

  const expenseDocs = docs.filter((d) => d.type === "RECEIPT" || d.type === "INVOICE");
  const expenseHintTotal = round2(
    expenseDocs.reduce((s, d) => s + (d.suggestedAmount ?? 0), 0)
  );

  const byCustomer = new Map<string, number>();
  for (const e of invoiced) {
    const name = e.customerName || e.counterpartyNameRaw || "Unknown";
    byCustomer.set(name, round2((byCustomer.get(name) ?? 0) + e.amount));
  }
  const infPartners = [...byCustomer.entries()]
    .filter(([, total]) => total >= 1000)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  return {
    line1Base,
    line2Base: 0,
    line3Base: 0,
    expenseDocCount: expenseDocs.length,
    expenseHintTotal,
    infPartners,
  };
}

export type AnnualComputed = {
  revenue: number; // generated invoices
  bankIn: number; // statement credits in period
  bankOut: number; // statement debits in period
  expenseDocs: number;
  outstandingInvoices: number; // generated but assumed unpaid (receivables hint)
};

export async function computeAnnual(
  businessId: string,
  filingPeriodId: string,
  periodStart: string,
  periodEnd: string
): Promise<AnnualComputed> {
  const [entries, stmts, docs] = await Promise.all([
    revenues.forFiling(filingPeriodId),
    statements.byBusiness(businessId),
    documents.byBusiness(businessId),
  ]);
  const mine = entries.filter((e) => e.businessId === businessId);
  const revenue = round2(
    mine.filter((e) => e.status === "INVOICE_GENERATED").reduce((s, e) => s + e.amount, 0)
  );
  let bankIn = 0;
  let bankOut = 0;
  for (const st of stmts) {
    for (const tx of st.transactions) {
      if (tx.date < periodStart.slice(0, 10) || tx.date > periodEnd.slice(0, 10)) continue;
      if (tx.direction === "C") bankIn += tx.amount;
      else bankOut += tx.amount;
    }
  }
  return {
    revenue,
    bankIn: round2(bankIn),
    bankOut: round2(bankOut),
    expenseDocs: docs.filter((d) => d.type === "RECEIPT" || d.type === "INVOICE").length,
    outstandingInvoices: mine.filter((e) => e.status === "NEEDS_INVOICE").length,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// VAT on a VAT-inclusive taxable value at the given rate.
export function vatFromGross(gross: number, rate: number): number {
  return round2((gross * rate) / (100 + rate));
}
