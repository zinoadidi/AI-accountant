import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { REVENUE_ENTRY_STATUSES } from "@/lib/types";

const schema = z.object({
  customerName: z.string().optional(),
  customerRegistryCode: z.string().optional(),
  customerVatNumber: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().optional(),
  status: z.enum(REVENUE_ENTRY_STATUSES).optional(),
  // Only ever set by an explicit human decision — never inferred from
  // suggestedNoInvoiceReason automatically.
  noInvoiceReason: z.string().optional(),
});

export async function PATCH(
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

  const entry = await prisma.revenueEntry.findFirst({
    where: { id: params.entryId, filingPeriodId: params.filingId, businessId: params.id },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Marking "no invoice needed" always requires a reason and clears any
  // stale generated-invoice fields; a status revert back to NEEDS_INVOICE
  // clears the no-invoice reason instead.
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "NO_INVOICE_NEEDED" && !parsed.data.noInvoiceReason && !entry.noInvoiceReason) {
    return NextResponse.json(
      { error: "noInvoiceReason is required when marking an entry as not needing an invoice" },
      { status: 400 }
    );
  }
  if (parsed.data.status === "NEEDS_INVOICE") {
    data.noInvoiceReason = null;
  }

  const updated = await prisma.revenueEntry.update({
    where: { id: params.entryId },
    data,
  });

  return NextResponse.json(updated);
}
