import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const entries = await prisma.revenueEntry.findMany({
    where: { filingPeriodId: params.filingId, businessId: params.id },
    orderBy: { transactionDate: "desc" },
  });

  const rows: string[][] = [
    [...COLUMNS],
    ...entries.map((e) =>
      COLUMNS.map((col) => {
        const value = e[col as keyof typeof e];
        if (value instanceof Date) return value.toISOString();
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
