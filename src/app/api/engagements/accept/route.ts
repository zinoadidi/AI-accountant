import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { engagements, users } from "@/lib/db";

const schema = z.object({ token: z.string() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const engagement = await engagements.findByToken(parsed.data.token);
  if (!engagement || engagement.status !== "PENDING" || new Date(engagement.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Engagement is invalid or expired" }, { status: 410 });
  }

  const userId = (session.user as { id: string }).id;
  const user = await users.get(userId);
  if (user?.email.toLowerCase() !== engagement.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This engagement was sent to a different email address" },
      { status: 403 }
    );
  }

  const updated = await engagements.accept(engagement.id, userId);

  return NextResponse.json({ businessId: updated?.businessId, filingPeriodId: updated?.filingPeriodId });
}
