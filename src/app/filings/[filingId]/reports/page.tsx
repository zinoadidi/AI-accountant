"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

type Boxes = Record<string, number | null>;

const KMD_ROWS: { key: string; label: string; hint: string }[] = [
  { key: "1", label: "1 · Standard-rate (24%) supply", hint: "Prefilled from generated invoices" },
  { key: "2", label: "2 · Reduced-rate (9%/5%) supply", hint: "Manual" },
  { key: "3", label: "3 · 0% / intra-EU supply", hint: "Manual" },
  { key: "4.1", label: "4.1 · Import VAT on KMD", hint: "Manual, mirrors to input VAT" },
  { key: "5", label: "5 · Deductible input VAT", hint: "Manual — see expense hint" },
  { key: "5.1", label: "5.1 · of which on imports", hint: "Manual" },
  { key: "5.3", label: "5.3 · Car VAT 100%", hint: "Manual" },
  { key: "5.4", label: "5.4 · Car VAT 50%", hint: "Manual" },
  { key: "6", label: "6 · Reverse charge, intra-EU goods+services", hint: "Manual" },
  { key: "6.1", label: "6.1 · Reverse charge, intra-EU goods", hint: "Manual" },
  { key: "7", label: "7 · Other reverse charge", hint: "Manual" },
  { key: "8", label: "8 · Exempt supply", hint: "Manual" },
  { key: "10", label: "10 · Adjustment increasing input VAT", hint: "Manual" },
  { key: "11", label: "11 · Adjustment decreasing input VAT", hint: "Manual" },
];

const ANNUAL_ROWS: { key: string; label: string; hint: string }[] = [
  { key: "revenue", label: "Revenue", hint: "Prefilled from generated invoices" },
  { key: "bankIn", label: "Bank inflow (statements)", hint: "Prefilled" },
  { key: "bankOut", label: "Bank outflow (statements)", hint: "Prefilled" },
  { key: "expenses", label: "Operating expenses", hint: "Manual" },
  { key: "cash", label: "Cash at bank, period end", hint: "Manual" },
];

export default function ReportsPage() {
  const params = useParams<{ filingId: string }>();
  const [kind, setKind] = useState<"KMD" | "ANNUAL">("KMD");
  const [businessId, setBusinessId] = useState("");
  const [label, setLabel] = useState("");
  const [computed, setComputed] = useState<Record<string, unknown>>({});
  const [boxes, setBoxes] = useState<Boxes>({});
  const [canEdit, setCanEdit] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const filingRes = await fetch(`/api/filings/${params.filingId}`);
    if (!filingRes.ok) {
      setError("Filing not found or no access.");
      return;
    }
    const filing = await filingRes.json();
    setBusinessId(filing.businessId);
    setLabel(filing.label);
    setCanEdit(["OWNER", "ACCOUNTANT", "BOOKKEEPER"].includes(filing.accessRole));
    const res = await fetch(
      `/api/businesses/${filing.businessId}/filings/${params.filingId}/reports?kind=${kind}`
    );
    if (!res.ok) {
      setError("Could not load report.");
      return;
    }
    const data = await res.json();
    setComputed(data.computed ?? {});
    const drafts = (data.drafts ?? []) as { reportKind: string; boxes: Boxes }[];
    setBoxes(drafts.find((d) => d.reportKind === kind)?.boxes ?? {});
    setSaved(false);
  }, [params.filingId, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const prefill: Record<string, number> =
    kind === "KMD"
      ? {
          "1": Number(computed.line1Base ?? 0),
          "2": Number(computed.line2Base ?? 0),
          "3": Number(computed.line3Base ?? 0),
        }
      : {
          revenue: Number(computed.revenue ?? 0),
          bankIn: Number(computed.bankIn ?? 0),
          bankOut: Number(computed.bankOut ?? 0),
        };

  const value = (key: string) => boxes[key] ?? prefill[key] ?? 0;

  async function handleSave() {
    if (!businessId) return;
    setError(null);
    const res = await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/reports`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, boxes }),
    });
    if (!res.ok) setError("Could not save.");
    else setSaved(true);
  }

  function downloadSheet() {
    if (!businessId) return;
    window.open(
      `/api/businesses/${businessId}/filings/${params.filingId}/reports/export?kind=${kind}`,
      "_blank"
    );
  }

  const rows = kind === "KMD" ? KMD_ROWS : ANNUAL_ROWS;
  const infPartners = (computed.infPartners ?? []) as { name: string; total: number }[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="mb-1 text-sm text-slate-500">
        <Link href={`/filings/${params.filingId}`} className="hover:underline">
          ← {label || "Filing"}
        </Link>
      </p>
      <h1 className="mb-1 text-2xl font-semibold">Reports — fill for EMTA</h1>
      <p className="mb-4 text-sm text-slate-600">
        Fill these in the app, then copy the figures into EMTA (KMD) or
        Ariregister (annual report) yourself. No direct connection needed.
      </p>

      <div className="mb-6 flex gap-2">
        {(["KMD", "ANNUAL"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md px-4 py-2 text-sm ${
              kind === k ? "bg-slate-900 text-white" : "border border-slate-300 hover:bg-slate-100"
            }`}
          >
            {k === "KMD" ? "Monthly · KMD (VAT)" : "Yearly · Annual report"}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 divide-y divide-slate-200 rounded-md border border-slate-200">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-slate-500">{row.hint}</p>
            </div>
            <input
              type="number"
              step="0.01"
              disabled={!canEdit}
              value={value(row.key)}
              onChange={(e) =>
                setBoxes((b) => ({ ...b, [row.key]: e.target.value === "" ? null : Number(e.target.value) }))
              }
              className="w-36 rounded-md border border-slate-300 px-3 py-2 text-right text-sm disabled:bg-slate-50"
            />
          </div>
        ))}
      </div>

      {kind === "KMD" && (
        <section className="mb-6 rounded-md border border-slate-200 p-4">
          <h2 className="mb-2 text-sm font-medium">KMD INF annex — partners ≥ €1,000</h2>
          {infPartners.length === 0 ? (
            <p className="text-sm text-slate-500">None this period.</p>
          ) : (
            <ul className="text-sm">
              {infPartners.map((p) => (
                <li key={p.name} className="flex justify-between py-1">
                  <span>{p.name}</span>
                  <span>€{p.total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          {Number(computed.expenseDocCount ?? 0) > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Input-VAT hint: {String(computed.expenseDocCount)} expense documents on file,
              suggested total €{Number(computed.expenseHintTotal ?? 0).toFixed(2)} — verify
              deductible VAT per invoice before copying to row 5.
            </p>
          )}
        </section>
      )}

      {kind === "ANNUAL" && (
        <section className="mb-6 rounded-md border border-slate-200 p-4 text-sm text-slate-600">
          <p>
            Profit hint: €{(value("revenue") - value("expenses")).toFixed(2)} (revenue −
            expenses). {String(computed.expenseDocs ?? 0)} expense documents on file ·{" "}
            {String(computed.outstandingInvoices ?? 0)} open revenue entries (receivables
            hint).
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Copy into the Ariregister annual-report environment — the micro-entity
            schema may ask for these figures split further.
          </p>
        </section>
      )}

      <Disclaimer>
        These are AI-assisted drafts. Statutory responsibility for what gets filed
        rests with the signing accountant — verify every figure against source
        documents before submitting in EMTA/Ariregister.
      </Disclaimer>

      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Save draft
          </button>
        )}
        <button
          type="button"
          onClick={downloadSheet}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Download filing sheet
        </button>
      </div>
      {saved && <p className="mt-2 text-sm text-green-700">Draft saved.</p>}
    </main>
  );
}
