// AI-assisted document categorization.
//
// `categorizeDocument` is the single seam: it tries Meta Spark
// (muse-spark-1.3-contributor via the backend relay) and falls back to
// filename/mimetype heuristics so the product works end-to-end without an
// LLM dependency. Callers never need to change.

import { categorizeWithAI, type AICategory } from "@/lib/ai";

export type CategorySuggestion = {
  category: string;
  vendor?: string;
  date?: string;
  amount?: number;
  currency?: string;
  vatRate?: number;
  confidence: number;
};

export async function categorizeDocument(input: {
  fileName: string;
  mimeType: string;
  hint?: string;
  /** Raw file bytes (base64). Sent to the model for images/PDFs (vision);
   *  other mimes stay on the cheaper filename/hint text path. */
  dataBase64?: string;
}): Promise<CategorySuggestion> {
  const result: AICategory = await categorizeWithAI({
    fileName: input.fileName,
    mimeType: input.mimeType,
    hint: input.hint,
    ...(input.dataBase64
      ? {
          attachment: {
            dataBase64: input.dataBase64,
            mimeType: input.mimeType,
            fileName: input.fileName,
          },
        }
      : {}),
  });
  const { viaAI: _viaAI, ...suggestion } = result;
  return suggestion;
}
