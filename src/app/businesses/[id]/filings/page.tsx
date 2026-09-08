"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FILING_PERIOD_TYPES } from "@/lib/types";

type FilingPeriod = {
  id: string;
  label: string;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
};

export default function FilingsPage() {
  const params = useParams<{ id: string }>();
  const [filings, setFilings] = useState<FilingPeriod[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<string>(FILING_PERIOD_TYPES[0]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/filings`);
    if (res.ok) setFilings(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/filings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        type,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
      }),
    });
    if (!res.ok) {
      setError("Could not create filing period");
      return;
    }
    setLabel("");
    setPeriodStart("");
    setPeriodEnd("");
    load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Filings</h1>
      <p className="mb-6 text-sm text-slate-600">
        Each filing period (a VAT return, an annual report) is where bank
        reconciliation, report drafting, and accountant review/sign-off get
        scoped and tracked.
      </p>

      <ul className="mb-8 divide-y divide-slate-200 rounded-md border border-slate-200">
        {filings.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No filing periods yet</li>
        )}
        {filings.map((f) => (
          <li key={f.id}>
            <Link
              href={`/filings/${f.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-100"
            >
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-slate-500">
                  {f.type} · {new Date(f.periodStart).toLocaleDateString()} –{" "}
                  {new Date(f.periodEnd).toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm text-slate-500">{f.status}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mb-2 font-medium">New filing period</h2>
      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Label, e.g. January 2026 VAT return"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {FILING_PERIOD_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Create filing period
        </button>
      </form>
    </main>
  );
}
