import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { filings } from "@/lib/db";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { computeKmd, computeAnnual } from "@/lib/reports";
import { storeList, storeCreate, storePut } from "@/lib/crud";

const saveSchema = z.object({
  kind: z.enum(["KMD", "ANNUAL"]),
  boxes: z.record(z.string(), z.number().nullable()),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filing = await filings.getBusinessScoped(params.filingId, params.id);
  if (!filing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "ANNUAL" ? "ANNUAL" : "KMD";

  const draftItems = await storeList<Record<string, unknown>>(params.filingId, 200);
  const drafts = draftItems
    .filter((i) => i.doc.kind === "report" && i.doc.filingPeriodId === params.filingId)
    .map((i) => ({ id: i.id, ...(i.doc as object) }));

  const computed =
    kind === "KMD"
      ? await computeKmd(params.id, params.filingId)
      : await computeAnnual(params.id, params.filingId, filing.periodStart, filing.periodEnd);

  return NextResponse.json({ kind, filing, computed, drafts, accessRole: access.role });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access || !canManageFilings(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filing = await filings.getBusinessScoped(params.filingId, params.id);
  if (!filing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const doc = {
    kind: "report",
    reportKind: parsed.data.kind,
    businessId: params.id,
    filingPeriodId: params.filingId,
    boxes: parsed.data.boxes,
    updatedById: userId,
    updatedAt: new Date().toISOString(),
  };

  // Replace any existing draft of the same kind for this filing.
  const all = await storeList<Record<string, unknown>>(params.filingId, 200);
  const prior = all.find(
    (i) => i.doc.kind === "report" && i.doc.filingPeriodId === params.filingId && i.doc.reportKind === parsed.data.kind
  );
  if (prior) {
    const saved = await storePut(prior.id, doc);
    return NextResponse.json({ id: prior.id, ...saved });
  }
  const created = await storeCreate(doc, undefined);
  return NextResponse.json(created);
}
