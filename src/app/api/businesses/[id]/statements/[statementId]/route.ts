import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { statements } from "@/lib/db";
import { getMembership } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: { id: string; statementId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const statement = await statements.get(params.statementId);
  if (!statement || statement.businessId !== params.id) {
    return NextResponse.json({ error: "Statement not found" }, { status: 404 });
  }

  return NextResponse.json(statement);
}
