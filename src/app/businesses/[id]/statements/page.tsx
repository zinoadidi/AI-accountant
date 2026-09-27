"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Statement = {
  id: string;
  fileName: string;
  source?: string | null;
  txCount?: number | null;
  createdAt: string;
};

type Filing = { id: string; label: string };

type ReconcileResult = {
  matched?: number;
  created?: number;
  unmatchedDebits?: unknown[] | number;
  needsAttention?: unknown[] | number;
  [k: string]: unknown;
};

function countOf(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.length;
  return null;
}

function listOf(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) =>
    typeof x === "string" ? x : JSON.stringify(x).slice(0, 160)
  );
}

export default function StatementsPage() {
  const params = useParams<{ id: string }>();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ReconcileResult>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sRes, fRes] = await Promise.all([
      fetch(`/api/businesses/${params.id}/statements`),
      fetch(`/api/businesses/${params.id}/filings`),
    ]);
    if (sRes.ok) {
      const data = await sRes.json();
      setStatements(Array.isArray(data) ? data : data.statements ?? []);
    }
    if (fRes.ok) {
      const data = await fRes.json();
      setFilings(Array.isArray(data) ? data : data.filings ?? []);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/businesses/${params.id}/statements`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      setError("Statement upload failed");
      return;
    }
    load();
  }

  async function reconcile(statementId: string) {
    const filingPeriodId = selected[statementId];
    if (!filingPeriodId) return;
    setBusy(statementId);
    const res = await fetch(
      `/api/businesses/${params.id}/statements/${statementId}/reconcile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingPeriodId }),
      }
    );
    setBusy(null);
    if (!res.ok) {
      setResults((r) => ({ ...r, [statementId]: { error: "Reconcile failed" } }));
      return;
    }
    const data = await res.json();
    setResults((r) => ({ ...r, [statementId]: data }));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold">Bank statements</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600">
        Upload a bank CSV, pick a filing period, and reconcile it against your
        documents and revenue.
      </p>

      <label className="block min-h-[56px] cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-4 text-center text-base font-medium hover:bg-slate-50">
        {uploading ? "Uploading..." : "Upload CSV statement"}
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {statements.length === 0 ? (
        <p className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          No statements yet
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {statements.map((s) => {
            const r = results[s.id];
            return (
              <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">{s.fileName}</p>
                  <p className="text-xs text-slate-500">
                    {[s.source, s.txCount != null ? `${s.txCount} txns` : null, new Date(s.createdAt).toLocaleDateString()]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <select
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2.5 text-sm"
                    value={selected[s.id] ?? ""}
                    onChange={(e) => setSelected((m) => ({ ...m, [s.id]: e.target.value }))}
                  >
                    <option value="">Select filing period</option>
                    {filings.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => reconcile(s.id)}
                    disabled={!selected[s.id] || busy === s.id}
                    className="min-h-[48px] rounded-md bg-slate-900 px-5 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {busy === s.id ? "Reconciling..." : "Reconcile"}
                  </button>
                </div>
                {r && (
                  <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {countOf(r.matched) != null && (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">matched: {countOf(r.matched)}</span>
                      )}
                      {countOf(r.created) != null && (
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-800">created: {countOf(r.created)}</span>
                      )}
                      {countOf(r.unmatchedDebits) != null && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">unmatched debits: {countOf(r.unmatchedDebits)}</span>
                      )}
                      {countOf(r.needsAttention) != null && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-red-800">needs attention: {countOf(r.needsAttention)}</span>
                      )}
                    </div>
                    {listOf(r.unmatchedDebits).length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Unmatched debits</p>
                        <ul className="ml-4 list-disc text-slate-600">
                          {listOf(r.unmatchedDebits).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    )}
                    {listOf(r.needsAttention).length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Needs attention</p>
                        <ul className="ml-4 list-disc text-slate-600">
                          {listOf(r.needsAttention).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    )}
                    {selected[s.id] && (
                      <Link href={`/filings/${selected[s.id]}`} className="mt-2 inline-block text-slate-700 underline">
                        Open filing revenue
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
