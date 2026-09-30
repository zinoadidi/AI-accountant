// Email-paste invoice intake (manual flow; automated inbox connection is
// coming soon). Assistive extraction only — the human always confirms/edits
// before anything is created (disclaimer UX, per PROPOSAL.md decision 9).
import { aiComplete } from "@/lib/crud";

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json|```/g, "");
    return JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
}

export type ExtractedInvoice = {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD or null
  amount: number | null;
  currency: string | null; // 3-letter code or null
  invoiceNumber: string | null;
  viaAI: boolean;
};

function heuristicExtractInvoice(emailBody: string): ExtractedInvoice {
  const text = emailBody.slice(0, 4000);
  // Vendor: prefer a From: header, else the first substantive line.
  let vendor: string | null = null;
  const fromMatch = text.match(/^from:\s*(.+)$/im);
  if (fromMatch) {
    vendor = fromMatch[1].replace(/<[^>]*>/g, "").trim().slice(0, 120) || null;
  }
  if (!vendor) {
    const firstLine = text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length >= 3 && !/^(hi|hello|dear|subject|date)\b/i.test(l));
    vendor = firstLine ? firstLine.slice(0, 120) : null;
  }
  // Amount: first currency-qualified number wins (supports "1 234,56 €", "EUR 99.00", "$12.50").
  let amount: number | null = null;
  let currency: string | null = null;
  const amountMatch = text.match(
    /(?:(EUR|€|\$|USD|GBP|£)\s?([\d\s]+[.,]\d{2})|([\d\s]+[.,]\d{2})\s?(EUR|€|\$|USD|GBP|£))/i
  );
  if (amountMatch) {
    const symbol = (amountMatch[1] ?? amountMatch[4] ?? "").toUpperCase();
    const raw = (amountMatch[2] ?? amountMatch[3] ?? "").replace(/\s/g, "").replace(",", ".");
    const n = Number(raw);
    if (Number.isFinite(n)) {
      amount = n;
      currency =
        symbol === "€" || symbol === "EUR" ? "EUR"
        : symbol === "$" || symbol === "USD" ? "USD"
        : symbol === "£" || symbol === "GBP" ? "GBP"
        : null;
    }
  }
  // Date: ISO first, then Estonian DD.MM.YYYY.
  let date: string | null = null;
  const isoMatch = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const eeMatch = text.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/);
  if (isoMatch) {
    date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  } else if (eeMatch) {
    date = `${eeMatch[3]}-${eeMatch[2].padStart(2, "0")}-${eeMatch[1].padStart(2, "0")}`;
  }
  // Invoice number: "invoice (no|#|number)? ... <token>".
  let invoiceNumber: string | null = null;
  const invMatch = text.match(/invoic\w*\s*(?:no\.?|#|number|nr\.?)?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-/]{2,40})/i);
  if (invMatch && !/^(for|from|date|total|amount)$/i.test(invMatch[1])) {
    invoiceNumber = invMatch[1].slice(0, 60);
  }
  return { vendor, date, amount, currency, invoiceNumber, viaAI: false };
}

export async function extractInvoiceFromEmailWithAI(emailBody: string): Promise<ExtractedInvoice> {
  const fallback = heuristicExtractInvoice(emailBody);
  const text = await aiComplete(
    `Extract invoice fields from this pasted email body. ` +
      `Reply with ONLY a JSON object {"vendor","date","amount","currency","invoiceNumber"} ` +
      `(vendor: sender business name or null; date: YYYY-MM-DD or null; amount: number or null; ` +
      `currency: 3-letter code or null; invoiceNumber: string or null). ` +
      `Email body:\n${emailBody.slice(0, 3000)}`,
    "You are a bookkeeping assistant. You always reply with a single JSON object and no other text. " +
      "You only suggest field values; a human confirms them."
  );
  if (!text) return fallback;
  const obj = parseJsonObject(text);
  if (!obj) return fallback;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : null);
  return {
    vendor: str(obj.vendor) ?? fallback.vendor,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(obj.date ?? "")) ? String(obj.date) : fallback.date,
    amount: typeof obj.amount === "number" && Number.isFinite(obj.amount) ? obj.amount : fallback.amount,
    currency:
      typeof obj.currency === "string" && /^[A-Z]{3}$/i.test(obj.currency.trim())
        ? obj.currency.trim().toUpperCase()
        : fallback.currency,
    invoiceNumber: str(obj.invoiceNumber) ?? fallback.invoiceNumber,
    viaAI: true,
  };
}
