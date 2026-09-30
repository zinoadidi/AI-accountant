import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getMembership } from "@/lib/permissions";
import { extractInvoiceFromEmailWithAI } from "@/lib/intake";

const schema = z.object({ emailBody: z.string().min(1).max(20000) });

// Manual email-paste intake: the automated inbox connection is coming soon,
// so the user pastes an email body and the AI suggests candidate invoice
// fields. Assistive only — the caller confirms before creating anything.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const extracted = await extractInvoiceFromEmailWithAI(parsed.data.emailBody);
  return NextResponse.json(extracted);
}
