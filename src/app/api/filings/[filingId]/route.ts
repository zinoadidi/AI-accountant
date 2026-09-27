import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { filings, users, engagements } from "@/lib/db";
import { getFilingAccess } from "@/lib/permissions";

// Business-agnostic lookup: the filing detail page only has a filingId from
// the URL, so this resolves the owning business internally before applying
// the same membership-or-engagement access check as the business-scoped route.
export async function GET(request: Request, { params }: { params: { filingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filingPeriod = await filings.get(params.filingId);
  if (!filingPeriod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, filingPeriod.businessId, filingPeriod.id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const business = await (await import("@/lib/db")).businesses.get(filingPeriod.businessId);
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
