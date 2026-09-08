import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const filingPeriod = await prisma.filingPeriod.findFirst({
    where: { id: params.filingId, businessId: params.id },
    include: {
      business: { select: { id: true, name: true } },
      engagements: {
        include: { accountant: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!filingPeriod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...filingPeriod, accessRole: access.role, viaEngagement: access.viaEngagement });
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

  const filingPeriod = await prisma.filingPeriod.update({
    where: { id: params.filingId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(filingPeriod);
}
