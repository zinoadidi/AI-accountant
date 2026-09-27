import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { businesses, documents, filings, statements } from "@/lib/db";
import { getMembership } from "@/lib/permissions";

export default async function BusinessDashboard({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const membership = await getMembership(userId, params.id);
  if (!membership) redirect("/businesses");

  const business = await businesses.get(params.id);
  if (!business) redirect("/businesses");

  const [docs, filingPeriods, statementDocs] = await Promise.all([
    documents.byBusiness(params.id),
    filings.byBusiness(params.id),
    statements.byBusiness(params.id),
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
          <p className="text-sm text-slate-600">{docs.length} uploaded so far</p>
        </Link>
        <Link
          href={`/businesses/${business.id}/statements`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Statements</h2>
          <p className="text-sm text-slate-600">
            {statementDocs.length} imported — reconcile against invoices
          </p>
        </Link>
        <Link
          href={`/businesses/${business.id}/filings`}
          className="rounded-lg border border-slate-200 p-4 hover:bg-slate-100"
        >
          <h2 className="font-medium">Filings</h2>
          <p className="text-sm text-slate-600">{filingPeriods.length} filing period(s)</p>
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
    </main>
  );
}
