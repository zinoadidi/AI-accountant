import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revenues } from "@/lib/db";
import { getFilingAccess } from "@/lib/permissions";
import { stringifyCsv } from "@/lib/csv";

const COLUMNS = [
  "id",
  "transactionDate",
  "amount",
  "currency",
  "description",
  "counterpartyNameRaw",
  "status",
  "customerName",
  "customerRegistryCode",
  "customerVatNumber",
  "customerAddress",
  "customerEmail",
  "noInvoiceReason",
] as const;

export async function GET(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const all = await revenues.forFiling(params.filingId);
  const entries = all
    .filter((e) => e.businessId === params.id)
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  const rows: string[][] = [
    [...COLUMNS],
    ...entries.map((e) =>
      COLUMNS.map((col) => {
        const value = (e as unknown as Record<string, unknown>)[col];
        return value == null ? "" : String(value);
      })
    ),
  ];

  const csv = stringifyCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="revenue-entries-${params.filingId}.csv"`,
    },
  });
}
