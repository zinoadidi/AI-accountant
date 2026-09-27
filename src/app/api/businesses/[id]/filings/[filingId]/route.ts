import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { filings, businesses, users, engagements } from "@/lib/db";
import { getFilingAccess, canManageFilings } from "@/lib/permissions";
import { FILING_PERIOD_STATUSES } from "@/lib/types";

const schema = z.object({ status: z.enum(FILING_PERIOD_STATUSES) });

export async function GET(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, params.id, params.filingId);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filingPeriod = await filings.getBusinessScoped(params.filingId, params.id);
  if (!filingPeriod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const business = await businesses.get(filingPeriod.businessId);
  const engList = await engagements.forFiling(filingPeriod.id);
  const engagementViews = await Promise.all(
    engList.map(async (e) => {
      const accountant = e.accountantId ? await users.get(e.accountantId) : null;
      return {
        ...e,
        accountant: accountant ? { id: accountant.id, name: accountant.name, email: accountant.email } : null,
      };
    })
  );

  return NextResponse.json({
    ...filingPeriod,
    business: business ? { id: business.id, name: business.name } : null,
    engagements: engagementViews,
    accessRole: access.role,
    viaEngagement: access.viaEngagement,
  });
}

export async function PATCH(
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

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const filingPeriod = await filings.setStatus(params.filingId, parsed.data.status);
  if (!filingPeriod || filingPeriod.businessId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(filingPeriod);
}
