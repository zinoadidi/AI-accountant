import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { users, resets } from "@/lib/db";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reset = await resets.findByToken(parsed.data.token);
  if (!reset || new Date(reset.expiresAt).getTime() < Date.now()) {
    if (reset) await resets.consume(reset.id).catch(() => {});
    return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 });
  }

  const updated = await users.setPassword(reset.userId, await bcrypt.hash(parsed.data.password, 10));
  if (!updated) {
    await resets.consume(reset.id).catch(() => {});
    return NextResponse.json({ error: "Account no longer exists" }, { status: 400 });
  }
  await resets.consume(reset.id);

  return NextResponse.json({ ok: true });
}
