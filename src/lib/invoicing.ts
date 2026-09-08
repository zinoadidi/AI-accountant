import { prisma } from "@/lib/prisma";

// Tokens an uploaded InvoiceTemplate.html can use — substituted verbatim,
// unknown tokens are left as literal text so a bad template fails loudly
// rather than silently dropping data.
export const INVOICE_TEMPLATE_TOKENS = [
  "invoiceNumber",
  "invoiceDate",
  "businessName",
  "businessRegistryCode",
  "businessVatNumber",
  "customerName",
  "customerRegistryCode",
  "customerVatNumber",
  "customerAddress",
  "customerEmail",
  "description",
  "amount",
  "currency",
  "transactionDate",
] as const;

export function renderInvoiceTemplate(html: string, data: Partial<Record<string, string>>): string {
  return html.replace(/{{\s*(\w+)\s*}}/g, (match, token) => data[token] ?? match);
}

// Sequential per-business invoice numbering. A real production
// implementation needs a gap-free, concurrency-safe sequence (a DB counter
// row with a transaction, not a count-and-add-one race) — this MVP version
// is good enough for a single-writer dev/demo flow, not for concurrent use.
export async function generateInvoiceNumber(businessId: string): Promise<string> {
  const count = await prisma.revenueEntry.count({
    where: { businessId, invoiceNumber: { not: null } },
  });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

// AI-suggested, non-binding hint that an entry might not need an outgoing
// invoice (transfers between own accounts, refunds, bank interest/fees).
// This deliberately does not encode actual legal thresholds — whether an
// invoice is legally required is a human (accountant) decision confirmed
// via RevenueEntry.noInvoiceReason, never asserted by this heuristic.
const NO_INVOICE_KEYWORDS: Record<string, string[]> = {
  "Likely a transfer between the business's own accounts": ["own account", "internal transfer"],
  "Likely a refund or reversal, not new revenue": ["refund", "reversal", "chargeback"],
  "Likely bank interest or a fee adjustment, not sales revenue": ["interest", "bank fee", "service fee"],
};

export function suggestNoInvoiceReason(input: {
  description?: string | null;
  counterpartyNameRaw?: string | null;
}): string | null {
  const haystack = `${input.description ?? ""} ${input.counterpartyNameRaw ?? ""}`.toLowerCase();

  for (const [reason, keywords] of Object.entries(NO_INVOICE_KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) return reason;
  }

  return null;
}
