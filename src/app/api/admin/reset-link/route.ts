import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, forbidden } from "@/lib/admin";
import { users, resets } from "@/lib/db";

const schema = z.object({ userId: z.string().min(1) });

// Mints a one-hour reset token the admin forwards manually (no email
// provider wired up — same pattern as team invitation links).
export async function POST(request: Request) {
  if (!(await requireAdmin())) return forbidden();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await users.get(parsed.data.userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const reset = await resets.create(user.id);
  return NextResponse.json({ ok: true, token: reset.token, expiresAt: reset.expiresAt });
}
