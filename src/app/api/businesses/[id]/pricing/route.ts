import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership, canManageTeam } from "@/lib/permissions";
import { PRICING_MODES } from "@/lib/types";

const schema = z.object({ pricingMode: z.enum(PRICING_MODES) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  // Choosing a billing mode is a business-level setting, same trust
  // boundary as managing the standing team — owner-only.
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const business = await prisma.business.update({
    where: { id: params.id },
    data: { pricingMode: parsed.data.pricingMode },
  });

  return NextResponse.json(business);
}
