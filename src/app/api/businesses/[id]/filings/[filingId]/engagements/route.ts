import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { filings, engagements } from "@/lib/db";
import { getMembership, canManageTeam } from "@/lib/permissions";

const schema = z.object({ email: z.string().email() });

export async function POST(
  request: Request,
  { params }: { params: { id: string; filingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  // Granting a per-filing engagement reaches outside the standing team, same
  // trust boundary as inviting a standing member — owner-only.
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filingPeriod = await filings.getBusinessScoped(params.filingId, params.id);
  if (!filingPeriod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const engagement = await engagements.create({
    businessId: params.id,
    filingPeriodId: params.filingId,
    email: parsed.data.email,
    invitedById: userId,
  });

  // NOTE: as with team invitations, sending the actual email is out of scope
  // for this slice — the token-bearing link is returned for manual sharing.
  return NextResponse.json(engagement);
}
