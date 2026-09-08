import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const [members, invitations] = await Promise.all([
    prisma.membership.findMany({
      where: { businessId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.invitation.findMany({ where: { businessId: params.id, status: "PENDING" } }),
  ]);

  return NextResponse.json({ members, invitations });
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

  const invitation = await prisma.invitation.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token: randomBytes(24).toString("hex"),
      businessId: params.id,
      invitedById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // NOTE: sending the invite email is out of scope for this MVP slice;
  // the invite link (using `invitation.token`) is returned here so it can
  // be shared manually or wired to an email provider later.
  return NextResponse.json(invitation);
}
