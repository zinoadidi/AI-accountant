import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdmin, forbidden } from "@/lib/admin";
import { users, businesses, memberships, resets } from "@/lib/db";

const ROLES = ["OWNER", "ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE", "VIEWER"] as const;
const schema = z.object({
  email: z.string().email(),
  businessId: z.string().min(1),
  role: z.enum(ROLES),
  name: z.string().min(1).optional(),
});

// Adds an existing user to a business, or creates the account (with a
// single-use reset link the admin forwards) and then adds it.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return forbidden();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, businessId, role } = parsed.data;

  const business = await businesses.get(businessId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  let user = await users.findByEmail(email);
  let resetToken: string | null = null;
  if (!user) {
    const created = await users.create({
      name: parsed.data.name?.trim() || email.split("@")[0],
      email,
      // Random unusable password — the account is activated via reset link.
      passwordHash: await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 10),
    });
    user = created;
    resetToken = (await resets.create(created.id)).token;
  }

  const existing = await memberships.get(user.id, businessId);
  if (existing) {
    return NextResponse.json({ user: { id: user.id, email: user.email }, membership: existing, resetToken });
  }
  const membership = await memberships.create(user.id, businessId, role);
  return NextResponse.json({ user: { id: user.id, email: user.email }, membership, resetToken });
}
