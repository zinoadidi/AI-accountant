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
  amount?: number;
  currency?: string;
  vatRate?: number;
  confidence: number;
};

export async function categorizeDocument(input: {
  fileName: string;
  mimeType: string;
  hint?: string;
}): Promise<CategorySuggestion> {
  const result: AICategory = await categorizeWithAI(input);
  const { viaAI: _viaAI, ...suggestion } = result;
  return suggestion;
}
