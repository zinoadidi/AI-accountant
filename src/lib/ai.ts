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

function parseJsonArray(text: string): Record<string, unknown>[] | null {
  try {
    const clean = text.replace(/```json|```/g, "");
    const parsed: unknown = JSON.parse(
      clean.slice(clean.indexOf("["), clean.lastIndexOf("]") + 1)
    );
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null);
  } catch {
    return null;
  }
}

export type AICategory = {
  category: string;
  vendor?: string;
  date?: string;
  amount?: number;
  currency?: string;
  vatRate?: number;
  confidence: number;
  viaAI: boolean;
};

/** Raw file bytes for vision/attachment categorization (base64). */
export type DocumentAttachment = {
  dataBase64: string;
  mimeType?: string;
  fileName?: string;
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

const KNOWN_CATEGORIES = [...Object.keys(CATEGORY_KEYWORDS), "Uncategorized"];

// Same keyword seam, but over transaction text instead of a filename — the
// per-transaction fallback for batched statement analysis.
export function heuristicTxCategory(
  description?: string | null,
  counterpartyNameRaw?: string | null
): { category: string; confidence: number } {
  const hay = `${description ?? ""} ${counterpartyNameRaw ?? ""}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => hay.includes(kw))) return { category, confidence: 0.6 };
  }
  return { category: "Uncategorized", confidence: 0.1 };
}

// Relay limits (see generic-crud-backend/API.md "Server-side AI"): images[]
// accept png/jpeg/webp/gif (max 5) as input_image, files[] (e.g. PDFs, max 5)
// as input_file, whole body capped at 15MB. We send at most one attachment
// and stay well under the cap so the vision call is never rejected for size.
export function isVisionImageMime(mimeType: string): boolean {
  return /^image\/(png|jpe?g|webp|gif)$/i.test(mimeType.trim());
}

export function isPdfMime(mimeType: string): boolean {
  return /pdf/i.test(mimeType);
}

// Decoded-byte ceiling for vision attachments: base64 inflates ~4/3, so 10MB
// of bytes keeps the relay body (prompt + attachment JSON) under 15MB.
export const MAX_VISION_BYTES = 10_000_000;

function toAICategory(obj: Record<string, unknown>, fallback: AICategory): AICategory | null {
  if (!obj || typeof obj.category !== "string" || !obj.category.trim()) return null;
  const date =
    typeof obj.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(obj.date.trim())
      ? obj.date.trim().slice(0, 10)
      : undefined;
  return {
    category: obj.category.trim(),
    vendor: typeof obj.vendor === "string" && obj.vendor.trim() ? obj.vendor.trim() : fallback.vendor,
    date,
    amount: typeof obj.amount === "number" ? obj.amount : undefined,
    currency: typeof obj.currency === "string" && obj.currency.trim() ? obj.currency.trim() : undefined,
    vatRate: typeof obj.vatRate === "number" ? obj.vatRate : undefined,
    confidence: typeof obj.confidence === "number" ? Math.min(1, Math.max(0, obj.confidence)) : 0.5,
    viaAI: true,
  };
}

const CATEGORY_SYSTEM =
  "You are a bookkeeping assistant. You always reply with a single JSON object and no other text.";

export async function categorizeWithAI(input: {
  fileName: string;
  mimeType: string;
  hint?: string;
  attachment?: DocumentAttachment;
}): Promise<AICategory> {
  const fallback = heuristicCategory(input.fileName, input.hint ?? "");
  const basePrompt =
    `Categorize this business document for Estonian SME bookkeeping. ` +
    `Reply with ONLY a JSON object {"category","vendor","date","amount","currency","vatRate","confidence"} ` +
    `(category one of: ${KNOWN_CATEGORIES.join(", ")}; date YYYY-MM-DD or null; ` +
    `amount as number or null; currency 3-letter code or null; vatRate as percent number or null; confidence 0..1). ` +
    `File: name="${input.fileName}" mime="${input.mimeType}"` +
    (input.hint ? ` context="${input.hint.slice(0, 500)}"` : "");

  // Vision path: receipt/invoice image or PDF bytes go to the model so it
  // reads the actual vendor/date/amount/VAT instead of guessing from the
  // filename. Anything else (CSV/text/oversize) stays on the cheaper text
  // path below. Any failure → keyword heuristic, never throws.
  const b64 = input.attachment?.dataBase64;
  if (b64 && b64.length > 0) {
    const approxBytes = Math.floor((b64.length * 3) / 4);
    const mime = (input.attachment?.mimeType ?? input.mimeType ?? "").trim();
    const fileName = input.attachment?.fileName ?? input.fileName;
    if (approxBytes <= MAX_VISION_BYTES && (isVisionImageMime(mime) || isPdfMime(mime))) {
      const prompt =
        basePrompt +
        ` Read the attached document and extract the actual vendor, date, amount, currency, and VAT rate from its contents.`;
      const text = isVisionImageMime(mime)
        ? await aiComplete(prompt, CATEGORY_SYSTEM, {
            images: [{ mimeType: mime.toLowerCase(), dataBase64: b64 }],
          })
        : await aiComplete(prompt, CATEGORY_SYSTEM, {
            files: [{ fileName, mimeType: mime, dataBase64: b64 }],
          });
      if (!text) return fallback; // relay 503/502/offline
      return toAICategory(parseJsonObject(text) ?? {}, fallback) ?? fallback; // bad JSON
    }
    // Non-vision mime or oversize attachment: fall through to the text path.
  }

  const text = await aiComplete(basePrompt, CATEGORY_SYSTEM);
  if (!text) return fallback;
  return toAICategory(parseJsonObject(text) ?? {}, fallback) ?? fallback;
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

// ---- Batched bank-statement analysis -------------------------------------
// One aiComplete text call per ~15k chars of serialized transactions (merged
// afterwards), instead of one call per transaction. Per-transaction heuristic
// fallback covers relay failures, bad JSON, and missing/invalid items.

export type StatementTxInput = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  direction: "C" | "D";
  description?: string | null;
  counterpartyName?: string | null;
};

export type StatementTxAnalysis = {
  id: string;
  category: string;
  needsInvoice: boolean;
  noInvoiceReason: string | null;
  viaAI: boolean;
};

export const STATEMENT_CHUNK_CHARS = 15_000;

function statementTxFallback(tx: StatementTxInput): StatementTxAnalysis {
  const cat = heuristicTxCategory(tx.description, tx.counterpartyName);
  const reason = heuristicNoInvoiceReason(tx.description, tx.counterpartyName);
  return {
    id: tx.id,
    category: cat.category,
    needsInvoice: reason === null,
    noInvoiceReason: reason,
    viaAI: false,
  };
}

const cleanCell = (value: string | null | undefined, max: number) =>
  (value ?? "").replace(/[\r\n|]+/g, " ").trim().slice(0, max);

function serializeStatementTx(index: number, tx: StatementTxInput): string {
  return (
    `${index}|${tx.date.slice(0, 10)}|${tx.direction}|${tx.amount} ${(tx.currency || "EUR").slice(0, 8)}` +
    `|${cleanCell(tx.counterpartyName, 80)}|${cleanCell(tx.description, 120)}`
  );
}

const STATEMENT_SYSTEM =
  "You are a bookkeeping assistant. You always reply with a single JSON array and no other text. " +
  "You never make legal determinations; you only suggest.";

export async function analyzeStatementWithAI(
  transactions: StatementTxInput[]
): Promise<StatementTxAnalysis[]> {
  if (transactions.length === 0) return [];

  // Chunk serialized lines so each prompt stays well under the relay's 20k
  // prompt cap (15k of transactions + ~600 chars of instruction).
  const batches: { index: number; line: string }[][] = [[]];
  let current = 0;
  transactions.forEach((tx, index) => {
    const line = serializeStatementTx(index, tx);
    if (current + line.length + 1 > STATEMENT_CHUNK_CHARS && batches[batches.length - 1].length > 0) {
      batches.push([]);
      current = 0;
    }
    batches[batches.length - 1].push({ index, line });
    current += line.length + 1;
  });

  const merged: StatementTxAnalysis[] = transactions.map(statementTxFallback);

  // Sequential batches: predictable relay load, same total cost as parallel.
  for (const batch of batches) {
    const text = await aiComplete(
      `Categorize each bank transaction for Estonian SME bookkeeping and say whether it needs an outgoing sales invoice. ` +
        `Reply with ONLY a JSON array, one object per transaction: ` +
        `[{"i":<index>,"category":"...","needsInvoice":true|false,"noInvoiceReason":"..."}] ` +
        `(category one of: ${KNOWN_CATEGORIES.join(", ")}; noInvoiceReason is a short plain-English hint ` +
        `when needsInvoice is false — e.g. internal transfer, refund, bank fee, tax payment, expense payout — else "". ` +
        `When in doubt, set needsInvoice true. Transactions (i|date|dir|amount ccy|counterparty|description):\n` +
        batch.map((b) => b.line).join("\n"),
      STATEMENT_SYSTEM
    );
    if (!text) continue; // whole batch keeps heuristic fallback
    const arr = parseJsonArray(text);
    if (!arr) continue;
    const byIndex = new Map<number, Record<string, unknown>>();
    for (const item of arr) {
      if (typeof item.i === "number" && Number.isInteger(item.i)) byIndex.set(item.i, item);
    }
    for (const { index } of batch) {
      const tx = transactions[index];
      const item = byIndex.get(index);
      if (!item || typeof item.needsInvoice !== "boolean") continue; // fallback
      const category =
        typeof item.category === "string" && item.category.trim()
          ? item.category.trim()
          : merged[index].category;
      const heuristicReason = heuristicNoInvoiceReason(tx.description, tx.counterpartyName);
      const rawReason = typeof item.noInvoiceReason === "string" ? item.noInvoiceReason.trim() : "";
      merged[index] = {
        id: tx.id,
        category,
        needsInvoice: item.needsInvoice,
        noInvoiceReason: item.needsInvoice ? null : rawReason || heuristicReason,
        viaAI: true,
      };
    }
  }

  return merged;
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
