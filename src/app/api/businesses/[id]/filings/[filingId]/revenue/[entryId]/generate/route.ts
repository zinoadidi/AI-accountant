import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { revenues, templates, businesses, updateDoc } from "@/lib/db";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { renderInvoiceTemplate, generateInvoiceNumber } from "@/lib/invoicing";

const schema = z.object({ templateId: z.string() });

export async function POST(
  request: Request,
  { params }: { params: { id: string; filingId: string; entryId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access || !canManageFilings(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [entry, template, business] = await Promise.all([
    revenues.get(params.entryId),
    templates.get(parsed.data.templateId),
    businesses.get(params.id),
  ]);
  if (
    !entry || entry.filingPeriodId !== params.filingId || entry.businessId !== params.id ||
    !template || template.businessId !== params.id ||
    !business
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!entry.customerName) {
    return NextResponse.json(
      { error: "Customer details must be filled in before generating an invoice" },
      { status: 400 }
    );
  }

  const invoiceNumber = await generateInvoiceNumber(params.id);
  const invoiceHtml = renderInvoiceTemplate(template.html, {
    invoiceNumber,
    invoiceDate: new Date().toISOString().slice(0, 10),
    businessName: business.name,
    businessRegistryCode: business.registryCode ?? "",
    businessVatNumber: business.vatNumber ?? "",
    customerName: entry.customerName ?? "",
    customerRegistryCode: entry.customerRegistryCode ?? "",
    customerVatNumber: entry.customerVatNumber ?? "",
    customerAddress: entry.customerAddress ?? "",
    customerEmail: entry.customerEmail ?? "",
    description: entry.description ?? "",
    amount: entry.amount.toFixed(2),
    currency: entry.currency,
    transactionDate: entry.transactionDate.slice(0, 10),
  });

  const updated = await updateDoc("revenue", entry.id, {
    status: "INVOICE_GENERATED",
    invoiceTemplateId: template.id,
    invoiceNumber,
    invoiceHtml,
    generatedAt: new Date().toISOString(),
  });

  return NextResponse.json(updated);
}
