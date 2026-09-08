import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  registryCode: z.string().optional(),
  vatNumber: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { business: true },
  });

  return NextResponse.json(
    memberships.map((m) => ({ ...m.business, role: m.role }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const business = await prisma.business.create({
    data: {
      ...parsed.data,
      country: "EE",
      memberships: { create: { userId, role: "OWNER" } },
    },
  });

  return NextResponse.json(business);
}
