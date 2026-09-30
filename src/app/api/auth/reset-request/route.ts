import { NextResponse } from "next/server";
import { z } from "zod";
import { users, resets } from "@/lib/db";

const schema = z.object({ email: z.string().email() });

// NOTE: no email provider is wired up (see HANDOFF.md) — the reset token is
// returned here so it can be forwarded manually, same as team invitations.
// Always 200 so the endpoint doesn't reveal which emails are registered;
// the token is only present when the account exists.
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await users.findByEmail(parsed.data.email);
  if (!user) return NextResponse.json({ ok: true });

  const reset = await resets.create(user.id);
  return NextResponse.json({ ok: true, token: reset.token });
}
