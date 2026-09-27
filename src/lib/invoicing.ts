import { revenues } from "@/lib/db";

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
  const count = await revenues.countInvoiced(businessId);
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

// Non-binding hint that an entry might not need an outgoing invoice.
// Re-exported here so existing callers keep working; the AI-backed version
// lives in src/lib/ai.ts and always falls back to the keyword heuristic.
export { heuristicNoInvoiceReason as suggestNoInvoiceReason } from "@/lib/ai";
export { suggestNoInvoiceWithAI } from "@/lib/ai";
