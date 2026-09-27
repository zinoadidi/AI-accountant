import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revenues, updateDoc } from "@/lib/db";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { parseCsvRecords } from "@/lib/csv";
import { REVENUE_ENTRY_STATUSES } from "@/lib/types";
import { suggestNoInvoiceWithAI } from "@/lib/ai";

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

  const existingEntries = await revenues.forFiling(params.filingId);
  const existingIds = new Set(
    existingEntries.filter((e) => e.businessId === params.id).map((e) => e.id)
  );

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
      await updateDoc("revenue", id, {
        ...customerFields,
        ...(status ? { status } : {}),
        ...(row.noInvoiceReason ? { noInvoiceReason: row.noInvoiceReason } : {}),
      });
      updated++;
    } else {
      const transactionDate = row.transactionDate ? new Date(row.transactionDate) : null;
      const amount = row.amount ? Number(row.amount) : NaN;
      if (!transactionDate || Number.isNaN(transactionDate.getTime()) || Number.isNaN(amount)) {
        errors.push({ row: i + 2, message: "New rows need a valid transactionDate and amount" });
        continue;
      }
      const { reason } = await suggestNoInvoiceWithAI({
        description: customerFields.description,
        counterpartyNameRaw: customerFields.counterpartyNameRaw,
        amount,
      });
      await revenues.create({
        businessId: params.id,
        filingPeriodId: params.filingId,
        transactionDate: transactionDate.toISOString(),
        amount,
        currency: row.currency || "EUR",
        description: customerFields.description,
        counterpartyNameRaw: customerFields.counterpartyNameRaw,
        suggestedNoInvoiceReason: reason,
        customer: {
          name: customerFields.customerName,
          registryCode: customerFields.customerRegistryCode,
          vatNumber: customerFields.customerVatNumber,
          address: customerFields.customerAddress,
          email: customerFields.customerEmail,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ created, updated, errors });
}
