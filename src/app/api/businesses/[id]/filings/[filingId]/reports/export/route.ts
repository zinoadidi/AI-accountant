import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filings, businesses } from "@/lib/db";
import { getFilingAccess } from "@/lib/permissions";
import { computeKmd, computeAnnual } from "@/lib/reports";
import { storeList } from "@/lib/crud";

// Printable filing sheet: the accountant copies these figures into EMTA
// (KMD) or Ariregister (annual report) manually, then marks the filing filed.
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
  const business = await businesses.get(params.id);
  if (!filing || !business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const kind = new URL(request.url).searchParams.get("kind") === "ANNUAL" ? "ANNUAL" : "KMD";
  const all = await storeList<Record<string, unknown>>(params.filingId, 200);
  const draft = all.find(
    (i) => i.doc.kind === "report" && i.doc.filingPeriodId === params.filingId && i.doc.reportKind === kind
  );
  const boxes = (draft?.doc.boxes as Record<string, number | null>) ?? {};

  const lines = [
    `${business.name} — ${filing.label} — ${kind} filing sheet`,
    `Registry: ${business.registryCode ?? "-"} · VAT: ${business.vatNumber ?? "-"}`,
    `Period: ${filing.periodStart.slice(0, 10)} – ${filing.periodEnd.slice(0, 10)}`,
    `Exported: ${new Date().toISOString()} · AI-assisted draft — accountant verifies before filing.`,
    "",
  ];

  if (kind === "KMD") {
    const c = await computeKmd(params.id, params.filingId);
    const b = (k: string, fb: number) => (boxes[k] ?? fb ?? 0) as number;
    lines.push(
      `1 Standard-rate supply: ${b("1", c.line1Base)}`,
      `2 Reduced-rate supply: ${b("2", c.line2Base)}`,
      `3 0% / intra-EU supply: ${b("3", c.line3Base)}`,
      `4 VAT due (computed in EMTA): see rows 1-3 + 4.1 + reverse charge`,
      `4.1 Import VAT on KMD: ${b("4.1", 0)}`,
      `5 Deductible input VAT: ${b("5", 0)} (hint: ${c.expenseDocCount} expense docs, suggested total ${c.expenseHintTotal})`,
      `5.1 of which on imports: ${b("5.1", 0)}`,
      `5.3/5.4 car VAT 100%/50%: ${b("5.3", 0)} / ${b("5.4", 0)}`,
      `6/6.1/7 reverse charge: ${b("6", 0)} / ${b("6.1", 0)} / ${b("7", 0)}`,
      `8 Exempt supply: ${b("8", 0)}`,
      `10/11 adjustments: ${b("10", 0)} / ${b("11", 0)}`,
      "",
      `KMD INF annex — partners >= €1000:`,
      ...c.infPartners.map((p) => `  ${p.name}: ${p.total}`),
      ...(c.infPartners.length === 0 ? ["  (none)"] : [])
    );
  } else {
    const c = await computeAnnual(params.id, params.filingId, filing.periodStart, filing.periodEnd);
    const b = (k: string, fb: number) => (boxes[k] ?? fb ?? 0) as number;
    lines.push(
      `Revenue (generated invoices): ${b("revenue", c.revenue)}`,
      `Bank in / out (statements): ${b("bankIn", c.bankIn)} / ${b("bankOut", c.bankOut)}`,
      `Expense documents on file: ${c.expenseDocs}`,
      `Open revenue entries (receivables hint): ${c.outstandingInvoices}`,
      `Operating expenses (manual): ${b("expenses", 0)}`,
      `Profit (revenue - expenses): ${b("profit", b("revenue", c.revenue) - b("expenses", 0))}`,
      `Cash at bank (manual): ${b("cash", 0)}`,
      `Notes: copy into the Ariregister annual report environment; micro-entity schema may vary.`
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind.toLowerCase()}-${params.filingId}.txt"`,
    },
  });
}
