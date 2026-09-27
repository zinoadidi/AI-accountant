import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filings, statements } from "@/lib/db";
import { getMembership, canUploadDocuments } from "@/lib/permissions";
import { parseStatementCsv } from "@/lib/statements";
import { fileUpload } from "@/lib/crud";

const MAX_BYTES = 5_000_000;

function isCsv(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith(".csv");
  const mimeOk = /csv|text\/plain|text\/csv/i.test(file.type || "");
  return nameOk || mimeOk;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await statements.byBusiness(params.id);
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
  if (!isCsv(file)) {
    return NextResponse.json({ error: "Only CSV files are accepted" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const filingPeriodIdRaw = formData.get("filingPeriodId");
  const filingPeriodId =
    typeof filingPeriodIdRaw === "string" && filingPeriodIdRaw.trim()
      ? filingPeriodIdRaw.trim()
      : null;
  if (filingPeriodId) {
    const filing = await filings.getBusinessScoped(filingPeriodId, params.id);
    if (!filing) return NextResponse.json({ error: "Filing not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  const parsed = parseStatementCsv(buffer.toString("utf-8"));

  const meta = await fileUpload({
    fileName: file.name,
    mimeType: file.type || "text/csv",
    kind: "BANK_STATEMENT",
    businessId: params.id,
    data: buffer,
  });

  const statement = await statements.create({
    businessId: params.id,
    fileName: file.name,
    fileId: meta.id,
    source: parsed.source,
    accountNo: parsed.accountNo,
    transactions: parsed.transactions,
  });

  if (filingPeriodId) {
    const attached = await statements.attachFiling(statement.id, filingPeriodId);
    return NextResponse.json(attached ?? statement);
  }

  return NextResponse.json(statement);
}
