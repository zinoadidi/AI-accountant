// AI-assisted document categorization.
//
// MVP uses filename/mimetype heuristics so the product works end-to-end
// without an LLM dependency. `categorizeDocument` is the single seam to
// swap in a real model (e.g. an LLM call that reads the extracted text of
// the receipt/invoice) without touching any caller.

export type CategorySuggestion = {
  category: string;
  vendor?: string;
  amount?: number;
  currency?: string;
  vatRate?: number;
  confidence: number;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Travel & transport": ["taxi", "uber", "bolt", "flight", "train", "parking"],
  "Software & subscriptions": ["subscription", "saas", "license", "invoice-aws", "hosting"],
  "Office supplies": ["office", "supplies", "stationery"],
  "Meals & entertainment": ["restaurant", "cafe", "lunch", "dinner"],
  "Utilities": ["electricity", "water", "internet", "telecom"],
  "Professional services": ["legal", "consulting", "accounting", "audit"],
};

export async function categorizeDocument(input: {
  fileName: string;
  mimeType: string;
}): Promise<CategorySuggestion> {
  const name = input.fileName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => name.includes(kw))) {
      return { category, confidence: 0.6 };
    }
  }

  return { category: "Uncategorized", confidence: 0.1 };
}
