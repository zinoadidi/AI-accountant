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
  if (!membership) redirect("/businesses");

  const business = await prisma.business.findUnique({ where: { id: params.id } });
  if (!business) redirect("/businesses");

  const [documentCount, filingCount] = await Promise.all([
    prisma.document.count({ where: { businessId: params.id } }),
    prisma.filingPeriod.count({ where: { businessId: params.id } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-2xl font-semibold">Dashboard</h1>

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
        <Link
          href={`/businesses/${business.id}/filings`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Filings</h2>
          <p className="text-sm text-slate-600">{filingCount} filing period(s)</p>
        </Link>
        <Link
          href={`/businesses/${business.id}/billing`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Billing</h2>
          <p className="text-sm text-slate-600">
            {business.pricingMode ? `Plan: ${business.pricingMode.replace(/_/g, " ")}` : "No plan selected yet"}
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        Bank statement analysis and invoice generation become available once
        bank sync and the invoice template connector ship — see{" "}
        <code>PROPOSAL.md</code> for the roadmap.
      </div>
    </main>
  );
}
