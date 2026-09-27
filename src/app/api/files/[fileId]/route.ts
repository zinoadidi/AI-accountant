import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { businesses, documents, statements } from "@/lib/db";
import { fileDownload } from "@/lib/crud";

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const owned = await businesses.forUser(userId);

  let authorized = false;
  for (const business of owned) {
    const docs = await documents.byBusiness(business.id);
    if (docs.some((d) => d.fileId === params.fileId)) {
      authorized = true;
      break;
    }
    const stmts = await statements.byBusiness(business.id);
    if (stmts.some((s) => s.fileId === params.fileId)) {
      authorized = true;
      break;
    }
  }
  if (!authorized) return NextResponse.json({ error: "File not found" }, { status: 404 });

  let file: { buf: Buffer; meta: { fileName: string; mimeType: string } };
  try {
    file = await fileDownload(params.fileId);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const safeName = file.meta.fileName.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      "content-type": file.meta.mimeType || "application/octet-stream",
      "content-disposition": `inline; filename="${safeName}"`,
    },
  });
}
