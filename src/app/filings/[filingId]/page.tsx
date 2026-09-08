"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { ComingSoonButton } from "@/components/ComingSoon";

type Engagement = {
  id: string;
  email: string;
  status: string;
  accountant: { name: string; email: string } | null;
};

type FilingPeriod = {
  id: string;
  businessId: string;
  business: { id: string; name: string };
  label: string;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  engagements: Engagement[];
  accessRole: string;
  viaEngagement: boolean;
};

export default function FilingDetailPage() {
  const params = useParams<{ filingId: string }>();
  const [filing, setFiling] = useState<FilingPeriod | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastEngagementLink, setLastEngagementLink] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    // filing.businessId isn't known before the first load, so this route is
    // reached via a business-scoped API path once we have it.
    const res = await fetch(`/api/filings/${params.filingId}`);
    if (res.status === 403 || res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.ok) setFiling(await res.json());
  }, [params.filingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!filing) return;
    setError(null);
    const res = await fetch(
      `/api/businesses/${filing.businessId}/filings/${filing.id}/engagements`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    if (!res.ok) {
      setError("Could not send engagement invite");
      return;
    }
    const engagement = await res.json();
    setLastEngagementLink(`${window.location.origin}/engagements/accept?token=${engagement.token}`);
    setEmail("");
    load();
  }

  function handleDownload() {
    if (!filing) return;
    const contents = [
      `${filing.business.name} — ${filing.label}`,
      `Type: ${filing.type}`,
      `Period: ${new Date(filing.periodStart).toLocaleDateString()} – ${new Date(filing.periodEnd).toLocaleDateString()}`,
      `Status: ${filing.status}`,
      "",
      "This is a placeholder export. Bank reconciliation, invoice matching,",
      "and the actual KMD/annual-report data package are not yet implemented",
      "— see PROPOSAL.md for the roadmap.",
    ].join("\n");
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filing.label.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleStatusChange(status: string) {
    if (!filing) return;
    setStatusUpdating(true);
    await fetch(`/api/businesses/${filing.businessId}/filings/${filing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusUpdating(false);
    load();
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-slate-600">
          This filing doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </main>
    );
  }

  if (!filing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  const canManage = ["OWNER", "ACCOUNTANT", "BOOKKEEPER"].includes(filing.accessRole);
  const canInviteEngagement = filing.accessRole === "OWNER" && !filing.viaEngagement;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="mb-1 text-sm text-slate-500">
        <Link href={`/businesses/${filing.businessId}/filings`} className="hover:underline">
          {filing.business.name}
        </Link>{" "}
        · {filing.viaEngagement ? "engaged for this filing" : filing.accessRole}
      </p>
      <h1 className="mb-1 text-2xl font-semibold">{filing.label}</h1>
      <p className="mb-4 text-sm text-slate-600">
        {filing.type} · {new Date(filing.periodStart).toLocaleDateString()} –{" "}
        {new Date(filing.periodEnd).toLocaleDateString()} · Status: {filing.status}
      </p>

      <Link
        href={`/filings/${filing.id}/revenue`}
        className="mb-8 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
      >
        Revenue entries & missing invoices →
      </Link>

      <section className="mb-8">
        <h2 className="mb-2 font-medium">Preview, download & file</h2>

        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          className="mb-4 rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          {previewOpen ? "Hide preview" : "Preview filing"}
        </button>

        {previewOpen && (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
            <p className="font-medium">{filing.label}</p>
            <p className="text-slate-600">
              {filing.type} filing for{" "}
              {new Date(filing.periodStart).toLocaleDateString()} –{" "}
              {new Date(filing.periodEnd).toLocaleDateString()}.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              This is a placeholder preview. The real KMD/annual-report data
              package, drawn from reconciled bank transactions and categorized
              documents, is on the roadmap (see PROPOSAL.md) and not yet
              generated here.
            </p>
          </div>
        )}

        <Disclaimer>
          Before downloading or submitting, remember: this is an AI-assisted
          draft. It doesn&apos;t require every line to be individually
          reviewed — but statutory responsibility for what actually gets
          filed rests with the accountant who signs it.
        </Disclaimer>

        <label className="mb-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          I acknowledge this and take responsibility for what&apos;s
          downloaded or filed from here.
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!acknowledged}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download filing package
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => handleStatusChange(filing.status === "FILED" ? "OPEN" : "FILED")}
              disabled={!acknowledged || statusUpdating}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {filing.status === "FILED" ? "Reopen filing" : "Mark as filed (manual submission in EMTA)"}
            </button>
          )}
          <ComingSoonButton
            label="Auto-submit to EMTA (X-tee)"
            title="Direct EMTA/X-tee submission"
            description="Automated filing straight to EMTA via the X-tee data-exchange layer needs X-tee membership and certification. For now, use “Mark as filed” after submitting the downloaded package yourself in EMTA's portal — see PROPOSAL.md Phase 5."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 font-medium">Accountants engaged on this filing</h2>
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {filing.engagements.length === 0 && (
            <li className="px-4 py-2 text-sm text-slate-500">None yet</li>
          )}
          {filing.engagements.map((e) => (
            <li key={e.id} className="flex justify-between px-4 py-2 text-sm">
              <span>{e.accountant?.name ?? e.email}</span>
              <span className="text-slate-500">{e.status}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          This grants access to only this filing period — not standing team
          membership. For an ongoing accountant relationship, invite them from
          the business&apos;s Team page instead.
        </p>
      </section>

      {canInviteEngagement && (
        <section className="mb-8">
          <h2 className="mb-2 font-medium">Engage an accountant for this filing</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
            >
              Send
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {lastEngagementLink && (
            <p className="mt-3 break-all text-xs text-slate-500">
              Engagement link (share manually until email sending is wired up):{" "}
              <a className="underline" href={lastEngagementLink}>
                {lastEngagementLink}
              </a>
            </p>
          )}
        </section>
      )}

      {!canManage && (
        <p className="text-sm text-slate-500">
          You have view access to this filing but not the role needed to
          manage it.
        </p>
      )}
    </main>
  );
}
