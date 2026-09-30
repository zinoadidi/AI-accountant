import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, forbidden } from "@/lib/admin";
import { users } from "@/lib/db";

const schema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: Request) {
  if (!(await requireAdmin())) return forbidden();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const taken = await users.findByEmail(parsed.data.email);
  if (taken && taken.id !== parsed.data.userId) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }
  const updated = await users.setEmail(parsed.data.userId, parsed.data.email);
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email } });
}
