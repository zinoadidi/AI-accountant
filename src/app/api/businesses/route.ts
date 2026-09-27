import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { businesses, memberships } from "@/lib/db";
import { DEFAULT_INVOICE_TEMPLATE_NAME, DEFAULT_INVOICE_TEMPLATE_HTML } from "@/lib/default-template";
import { templates } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1),
  registryCode: z.string().optional(),
  vatNumber: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const list = await businesses.forUser(userId);
  const withRoles = await Promise.all(
    list.map(async (b) => {
      const m = await memberships.get(userId, b.id);
      return { ...b, role: m?.role ?? null };
    })
  );

  return NextResponse.json(withRoles);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const business = await businesses.create({ ...parsed.data, country: "EE" });
  await memberships.create(userId, business.id, "OWNER");
  // Every business starts with the company invoice template (placeholder
  // until the real company template is provided) so missing-invoice
  // generation works immediately.
  await templates.create(business.id, DEFAULT_INVOICE_TEMPLATE_NAME, DEFAULT_INVOICE_TEMPLATE_HTML);

  return NextResponse.json(business);
}
