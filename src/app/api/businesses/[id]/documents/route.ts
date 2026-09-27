import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { documents } from "@/lib/db";
import { getMembership, canUploadDocuments } from "@/lib/permissions";
import { categorizeDocument } from "@/lib/categorize";

const TYPE_BY_MIME: [RegExp, string][] = [
  [/pdf/i, "INVOICE"],
  [/image/i, "RECEIPT"],
  [/csv|spreadsheet|excel/i, "BANK_STATEMENT"],
];

function guessType(fileName: string, mimeType: string): string {
  const hay = `${fileName} ${mimeType}`.toLowerCase();
  if (/statement|statement|väljavõte|csv/.test(hay)) return "BANK_STATEMENT";
  if (/receipt|kviitung|check|tšekk/.test(hay)) return "RECEIPT";
  if (/invoice|arve/.test(hay)) return "INVOICE";
  if (/contract|leping/.test(hay)) return "CONTRACT";
  for (const [re, type] of TYPE_BY_MIME) {
    if (re.test(mimeType)) return type;
  }
  return "OTHER";
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await documents.byBusiness(params.id);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canUploadDocuments(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 15_000_000) {
    return NextResponse.json({ error: "File too large (max 15MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = (formData.get("type") as string) || guessType(file.name, file.type);

  // Bytes live in the generic-crud backend's file store; only metadata + AI
  // suggestions live in the JSON store alongside the document record.
  const document = await documents.upload({
    businessId: params.id,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    data: buffer,
    type,
    uploadedById: userId,
  });

  // Meta Spark categorization with keyword fallback — never blocks upload.
  try {
    const suggestion = await categorizeDocument({
      fileName: file.name,
      mimeType: file.type,
      hint: type,
    });
    const updated = await documents.categorize(document.id, suggestion);
    return NextResponse.json(updated ?? document);
  } catch {
    return NextResponse.json(document);
  }
}
