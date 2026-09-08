import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { parseCsvRecords } from "@/lib/csv";
import { REVENUE_ENTRY_STATUSES } from "@/lib/types";
import { suggestNoInvoiceReason } from "@/lib/invoicing";

// Bulk rectification: download the CSV from the export endpoint, fill in
// customer details (or amend anything else) in a spreadsheet, and re-upload
// here. A row with an `id` matching an existing entry in this filing updates
// it; a row with no `id` creates a new entry instead.
export async function POST(
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

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const text = await file.text();
  const records = parseCsvRecords(text);

  const existingEntries = await prisma.revenueEntry.findMany({
    where: { filingPeriodId: params.filingId, businessId: params.id },
    select: { id: true },
  });
  const existingIds = new Set(existingEntries.map((e) => e.id));

  let created = 0;
  let updated = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const id = row.id?.trim();

    const customerFields = {
      customerName: row.customerName || undefined,
      customerRegistryCode: row.customerRegistryCode || undefined,
      customerVatNumber: row.customerVatNumber || undefined,
      customerAddress: row.customerAddress || undefined,
      customerEmail: row.customerEmail || undefined,
      description: row.description || undefined,
      counterpartyNameRaw: row.counterpartyNameRaw || undefined,
    };

    const status = row.status && (REVENUE_ENTRY_STATUSES as readonly string[]).includes(row.status)
      ? row.status
      : undefined;

    if (id) {
      if (!existingIds.has(id)) {
        errors.push({ row: i + 2, message: `Unknown id "${id}" for this filing` });
        continue;
      }
      if (status === "NO_INVOICE_NEEDED" && !row.noInvoiceReason) {
        errors.push({ row: i + 2, message: "noInvoiceReason is required to mark NO_INVOICE_NEEDED" });
        continue;
      }
      await prisma.revenueEntry.update({
        where: { id },
        data: {
          ...customerFields,
          ...(status ? { status } : {}),
          ...(row.noInvoiceReason ? { noInvoiceReason: row.noInvoiceReason } : {}),
        },
      });
      updated++;
    } else {
      const transactionDate = row.transactionDate ? new Date(row.transactionDate) : null;
      const amount = row.amount ? Number(row.amount) : NaN;
      if (!transactionDate || Number.isNaN(transactionDate.getTime()) || Number.isNaN(amount)) {
        errors.push({ row: i + 2, message: "New rows need a valid transactionDate and amount" });
        continue;
      }
      await prisma.revenueEntry.create({
        data: {
          businessId: params.id,
          filingPeriodId: params.filingId,
          transactionDate,
          amount,
          currency: row.currency || "EUR",
          ...customerFields,
          suggestedNoInvoiceReason: suggestNoInvoiceReason(customerFields),
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated, errors });
}
