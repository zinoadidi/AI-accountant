import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminUser } from "@/lib/auth";

// Returns the admin session user, or null (routes map to 403).
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string | null } | undefined;
  if (!user || !isAdminUser(user)) return null;
  return user;
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
