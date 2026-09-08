import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFilingAccess } from "@/lib/permissions";

// Business-agnostic lookup: the filing detail page only has a filingId from
// the URL, so this resolves the owning business internally before applying
// the same membership-or-engagement access check as the business-scoped route.
export async function GET(request: Request, { params }: { params: { filingId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const filingPeriod = await prisma.filingPeriod.findUnique({
    where: { id: params.filingId },
    include: {
      business: { select: { id: true, name: true } },
      engagements: {
        include: { accountant: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!filingPeriod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as { id: string }).id;
  const access = await getFilingAccess(userId, filingPeriod.businessId, filingPeriod.id);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ ...filingPeriod, accessRole: access.role, viaEngagement: access.viaEngagement });
}
