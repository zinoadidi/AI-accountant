import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMembership } from "@/lib/permissions";

export default async function BusinessDashboard({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) redirect("/businesses/new");

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) redirect("/businesses/new");

  const documentCount = await prisma.document.count({ where: { businessId: params.id } });

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{business.name}</h1>
      <p className="mb-8 text-sm text-slate-600">
        Your role: {membership.role} · Country: {business.country}
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/businesses/${business.id}/team`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Team</h2>
          <p className="text-sm text-slate-600">Invite your bookkeeper and accountant</p>
        </Link>
        <Link
          href={`/businesses/${business.id}/documents`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Documents</h2>
          <p className="text-sm text-slate-600">{documentCount} uploaded so far</p>
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Bank statement analysis, invoice generation, and tax filing become
        available once bank sync (phase 1) and the invoice template
        connector (phase 2) ship — see <code>PROPOSAL.md</code> for the
        roadmap.
      </div>
    </main>
  );
}
