import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { invitations, memberships, users } from "@/lib/db";

const schema = z.object({ token: z.string() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invitation = await invitations.findByToken(parsed.data.token);
  if (!invitation || invitation.status !== "PENDING" || new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invitation is invalid or expired" }, { status: 410 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await users.get(userId);
  if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invitation was sent to a different email address" },
      { status: 403 }
    );
  }

  const existing = await memberships.get(userId, invitation.businessId);
  if (existing) {
    const { updateDoc } = await import("@/lib/db");
    await updateDoc("membership", existing.id, { role: invitation.role });
  } else {
    await memberships.create(userId, invitation.businessId, invitation.role);
  }
  await invitations.accept(invitation.id);

  return NextResponse.json({ businessId: invitation.businessId });
}
