import { NextResponse } from "next/server";
import { requireAdmin, forbidden } from "@/lib/admin";
import { users, businesses, memberships } from "@/lib/db";

export async function GET() {
  if (!(await requireAdmin())) return forbidden();
  const [userDocs, businessDocs, membershipDocs] = await Promise.all([
    users.all(),
    businesses.all(),
    memberships.all(),
  ]);
  return NextResponse.json({
    users: userDocs.map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt })),
    businesses: businessDocs,
    memberships: membershipDocs,
  });
}
