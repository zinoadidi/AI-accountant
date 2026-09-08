import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, canUploadDocuments } from "@/lib/permissions";
import { categorizeDocument } from "@/lib/categorize";

const UPLOAD_ROOT = path.join(process.cwd(), ".uploads");

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const documents = await prisma.document.findMany({
    where: { businessId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
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

  const document = await prisma.document.create({
    data: {
      businessId: params.id,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedById: userId,
    },
  });

  const businessDir = path.join(UPLOAD_ROOT, params.id);
  await mkdir(businessDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(businessDir, document.id), buffer);

  const suggestion = await categorizeDocument({ fileName: file.name, mimeType: file.type });
  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      status: "CATEGORIZED",
      suggestedCategory: suggestion.category,
      suggestedVendor: suggestion.vendor,
      suggestedAmount: suggestion.amount,
      suggestedCurrency: suggestion.currency,
      suggestedVatRate: suggestion.vatRate,
      aiConfidence: suggestion.confidence,
    },
  });

  return NextResponse.json(updated);
}
