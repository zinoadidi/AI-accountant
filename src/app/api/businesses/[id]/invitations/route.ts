import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { invitations, memberships, users } from "@/lib/db";
import { getMembership, canManageTeam } from "@/lib/permissions";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE", "VIEWER"]),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [memberDocs, inviteDocs] = await Promise.all([
    memberships.byBusiness(params.id),
    invitations.byBusiness(params.id),
  ]);
  const members = await Promise.all(
    memberDocs.map(async (m) => {
      const u = await users.get(m.userId);
      return { ...m, user: u ? { id: u.id, name: u.name, email: u.email } : null };
    })
  );

  return NextResponse.json({ members, invitations: inviteDocs.filter((i) => i.status === "PENDING") });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership || !canManageTeam(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const invitation = await invitations.create({
    email: parsed.data.email,
    role: parsed.data.role,
    businessId: params.id,
    invitedById: userId,
  });

  // NOTE: sending the invite email is out of scope for this MVP slice;
  // the invite link (using `invitation.token`) is returned here so it can
  // be shared manually or wired to an email provider later.
  return NextResponse.json(invitation);
}
