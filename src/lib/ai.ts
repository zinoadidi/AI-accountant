// Meta Spark (muse-spark-1.3-contributor) via the generic-crud backend's
// server-side relay. The API key never leaves the backend — this module only
// sends prompts. Every function falls back to the local keyword heuristic
// when AI is unavailable (503 no key, 502 upstream down, backend offline),
// so the product always works end-to-end.
import { aiComplete } from "@/lib/crud";

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const clean = text.replace(/```json|```/g, "");
    return JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
}

export type AICategory = {
  category: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  vatRate?: number;
  confidence: number;
  viaAI: boolean;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Travel & transport": ["taxi", "uber", "bolt", "flight", "train", "parking", "booking.com", "hotel", "voiscooters", "olerex"],
  "Software & subscriptions": ["subscription", "saas", "license", "hosting", "stripe"],
  "Office supplies": ["office", "supplies", "stationery"],
  "Meals & entertainment": ["restaurant", "cafe", "lunch", "dinner"],
  "Utilities": ["electricity", "water", "internet", "telecom"],
  "Professional services": ["legal", "consulting", "accounting", "audit", "service delivered", "payment for service"],
  "Bank fees": ["card", "monthly fee", "conversion fee", "bank fee"],
  "Taxes": ["maksu", "tolliamet", "state taxes", "tax"],
};

function heuristicCategory(fileName: string, extraHaystack = ""): AICategory {
  const hay = `${fileName} ${extraHaystack}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => hay.includes(kw))) return { category, confidence: 0.6, viaAI: false };
  }
  return { category: "Uncategorized", confidence: 0.1, viaAI: false };
}

export async function categorizeWithAI(input: {
  fileName: string;
  mimeType: string;
  hint?: string;
}): Promise<AICategory> {
  const fallback = heuristicCategory(input.fileName, input.hint ?? "");
  const text = await aiComplete(
    `Categorize this business document for Estonian SME bookkeeping. ` +
      `Reply with ONLY a JSON object {"category","vendor","amount","currency","vatRate","confidence"} ` +
      `(confidence 0..1; amount as number or null; currency 3-letter code or null; vatRate as percent number or null). ` +
      `File: name="${input.fileName}" mime="${input.mimeType}"` +
      (input.hint ? ` context="${input.hint.slice(0, 500)}"` : ""),
    "You are a bookkeeping assistant. You always reply with a single JSON object and no other text."
  );
  if (!text) return fallback;
  const obj = parseJsonObject(text);
  if (!obj || typeof obj.category !== "string") return fallback;
  return {
    category: obj.category,
    vendor: typeof obj.vendor === "string" ? obj.vendor : fallback.vendor,
    amount: typeof obj.amount === "number" ? obj.amount : undefined,
    currency: typeof obj.currency === "string" ? obj.currency : undefined,
    vatRate: typeof obj.vatRate === "number" ? obj.vatRate : undefined,
    confidence: typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.5,
    viaAI: true,
  };
}

const NO_INVOICE_KEYWORDS: Record<string, string[]> = {
  "Likely a transfer between the business's own accounts": ["own account", "internal transfer"],
  "Likely a refund or reversal, not new revenue": ["refund", "reversal", "chargeback"],
  "Likely bank interest or a fee adjustment, not sales revenue": [
    "interest", "bank fee", "service fee", "monthly fee", "card (", "conversion fee",
  ],
  "Likely a tax payment to the authorities, not sales revenue": ["maksu", "tolliamet", "state taxes"],
  "Likely an expense payout, not incoming revenue": ["service delivered", "payment for service", "expense", "securities buy"],
};

export function heuristicNoInvoiceReason(description?: string | null, counterparty?: string | null): string | null {
  const hay = `${description ?? ""} ${counterparty ?? ""}`.toLowerCase();
  for (const [reason, keywords] of Object.entries(NO_INVOICE_KEYWORDS)) {
    if (keywords.some((kw) => hay.includes(kw))) return reason;
  }
  return null;
}

// Non-binding AI hint for the needs-invoice decision. Never authoritative:
// a human (accountant) always confirms via RevenueEntry.noInvoiceReason.
export async function suggestNoInvoiceWithAI(input: {
  description?: string | null;
  counterpartyNameRaw?: string | null;
  amount?: number;
}): Promise<{ reason: string | null; viaAI: boolean }> {
  const heuristic = heuristicNoInvoiceReason(input.description, input.counterpartyNameRaw);
  const text = await aiComplete(
    `A bank transaction may or may not need an outgoing sales invoice. ` +
      `Reply with ONLY a JSON object {"needsInvoice":true|false,"reason":"..."} where reason is a short ` +
      `plain-English hint when needsInvoice is false (e.g. internal transfer, refund, bank fee, tax payment, expense payout). ` +
      `Transaction: description="${(input.description ?? "").slice(0, 300)}" ` +
      `counterparty="${(input.counterpartyNameRaw ?? "").slice(0, 200)}" amount=${input.amount ?? "?"}. ` +
      `When in doubt, set needsInvoice true with reason "".`,
    "You are a bookkeeping assistant. You always reply with a single JSON object and no other text. " +
      "You never make legal determinations; you only suggest."
  );
  if (!text) return { reason: heuristic, viaAI: false };
  const obj = parseJsonObject(text);
  if (!obj || typeof obj.needsInvoice !== "boolean") return { reason: heuristic, viaAI: false };
  if (obj.needsInvoice) return { reason: null, viaAI: true };
  return {
    reason: typeof obj.reason === "string" && obj.reason.trim() ? obj.reason.trim() : heuristic,
    viaAI: true,
  };
}
