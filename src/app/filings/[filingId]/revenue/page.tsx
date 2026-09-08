"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";

type Entry = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: string;
  description: string | null;
  counterpartyNameRaw: string | null;
  status: string;
  suggestedNoInvoiceReason: string | null;
  noInvoiceReason: string | null;
  customerName: string | null;
  customerRegistryCode: string | null;
  customerVatNumber: string | null;
  customerAddress: string | null;
  customerEmail: string | null;
  invoiceNumber: string | null;
  invoiceHtml: string | null;
};

type Template = { id: string; name: string };

export default function RevenueEntriesPage() {
  const params = useParams<{ filingId: string }>();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [txDate, setTxDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [counterparty, setCounterparty] = useState("");

  const load = useCallback(async () => {
    const filingRes = await fetch(`/api/filings/${params.filingId}`);
    if (!filingRes.ok) return;
    const filing = await filingRes.json();
    setBusinessId(filing.businessId);

    const [entriesRes, templatesRes] = await Promise.all([
      fetch(`/api/businesses/${filing.businessId}/filings/${params.filingId}/revenue`),
      fetch(`/api/businesses/${filing.businessId}/templates?filingId=${params.filingId}`),
    ]);
    if (entriesRes.ok) setEntries(await entriesRes.json());
    if (templatesRes.ok) setTemplates(await templatesRes.json());
  }, [params.filingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setError(null);
    const res = await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionDate: new Date(txDate).toISOString(),
        amount: Number(amount),
        description,
        counterpartyNameRaw: counterparty,
      }),
    });
    if (!res.ok) {
      setError("Could not add entry");
      return;
    }
    setTxDate("");
    setAmount("");
    setDescription("");
    setCounterparty("");
    load();
  }

  async function updateEntry(id: string, data: Record<string, unknown>) {
    if (!businessId) return;
    await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/revenue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function generateInvoice(id: string, templateId: string) {
    if (!businessId || !templateId) return;
    const res = await fetch(
      `/api/businesses/${businessId}/filings/${params.filingId}/revenue/${id}/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not generate invoice");
      return;
    }
    load();
  }

  function viewInvoice(entry: Entry) {
    if (!entry.invoiceHtml) return;
    const w = window.open("", "_blank");
    w?.document.write(entry.invoiceHtml);
    w?.document.close();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `/api/businesses/${businessId}/filings/${params.filingId}/revenue/import`,
      { method: "POST", body: formData }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError("Import failed");
      return;
    }
    setImportSummary(
      `Imported: ${data.created} created, ${data.updated} updated${
        data.errors?.length ? `, ${data.errors.length} row(s) skipped with errors` : ""
      }`
    );
    if (importInputRef.current) importInputRef.current.value = "";
    load();
  }

  if (!businessId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="mb-1 text-sm text-slate-500">
        <Link href={`/filings/${params.filingId}`} className="hover:underline">
          ← Back to filing
        </Link>
      </p>
      <h1 className="mb-2 text-2xl font-semibold">Revenue entries &amp; missing invoices</h1>
      <p className="mb-4 text-sm text-slate-600">
        Each entry is a payment that may need an outgoing sales invoice.
        Bank sync isn&apos;t built yet, so entries are added here or imported
        from a CSV export of the statement in the meantime.
      </p>

      <Disclaimer>
        Not every entry needs an invoice — marking one as not needing one is
        always a human decision with a stated reason, never an automatic
        legal determination by this system.
      </Disclaimer>

      <section className="mb-8 flex flex-wrap items-center gap-3">
        <a
          href={`/api/businesses/${businessId}/filings/${params.filingId}/revenue/export`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Download CSV
        </a>
        <label className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 cursor-pointer">
          Re-upload CSV
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
        </label>
        {importSummary && <span className="text-sm text-slate-600">{importSummary}</span>}
      </section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-8 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Counterparty / memo</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-slate-500">
                  No entries yet
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                templates={templates}
                onUpdate={(data) => updateEntry(entry.id, data)}
                onGenerate={(templateId) => generateInvoice(entry.id, templateId)}
                onViewInvoice={() => viewInvoice(entry)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 font-medium">Add an entry manually</h2>
      <form onSubmit={handleAddEntry} className="flex flex-wrap gap-3">
        <input
          type="date"
          className="rounded-md border border-slate-300 px-3 py-2"
          value={txDate}
          onChange={(e) => setTxDate(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          className="w-32 rounded-md border border-slate-300 px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          placeholder="Counterparty (payer name)"
          className="rounded-md border border-slate-300 px-3 py-2"
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
        />
        <input
          placeholder="Memo / description"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Add
        </button>
      </form>
    </main>
  );
}

function EntryRow({
  entry,
  templates,
  onUpdate,
  onGenerate,
  onViewInvoice,
}: {
  entry: Entry;
  templates: Template[];
  onUpdate: (data: Record<string, unknown>) => void;
  onGenerate: (templateId: string) => void;
  onViewInvoice: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [customerName, setCustomerName] = useState(entry.customerName ?? "");
  const [customerRegistryCode, setCustomerRegistryCode] = useState(entry.customerRegistryCode ?? "");
  const [customerVatNumber, setCustomerVatNumber] = useState(entry.customerVatNumber ?? "");
  const [customerAddress, setCustomerAddress] = useState(entry.customerAddress ?? "");
  const [customerEmail, setCustomerEmail] = useState(entry.customerEmail ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [noInvoiceReason, setNoInvoiceReason] = useState("");

  function saveCustomer() {
    onUpdate({ customerName, customerRegistryCode, customerVatNumber, customerAddress, customerEmail });
    setEditing(false);
  }

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2 whitespace-nowrap">
        {new Date(entry.transactionDate).toLocaleDateString()}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {entry.amount.toFixed(2)} {entry.currency}
      </td>
      <td className="px-3 py-2">
        <p>{entry.counterpartyNameRaw}</p>
        <p className="text-xs text-slate-500">{entry.description}</p>
        {entry.suggestedNoInvoiceReason && entry.status === "NEEDS_INVOICE" && (
          <p className="mt-1 text-xs text-amber-700">
            AI suggests: {entry.suggestedNoInvoiceReason} — unconfirmed
          </p>
        )}
      </td>
      <td className="px-3 py-2 min-w-[220px]">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Registry code"
              value={customerRegistryCode}
              onChange={(e) => setCustomerRegistryCode(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="VAT number"
              value={customerVatNumber}
              onChange={(e) => setCustomerVatNumber(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
            <input
              className="rounded border border-slate-300 px-2 py-1 text-xs"
              placeholder="Email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={saveCustomer} className="text-xs text-slate-900 underline">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-slate-500 underline">
                Cancel
              </button>
            </div>
          </div>
        ) : entry.customerName ? (
          <div>
            <p>{entry.customerName}</p>
            <button onClick={() => setEditing(true)} className="text-xs text-slate-500 underline">
              Edit
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs text-slate-900 underline">
            + Add customer details
          </button>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {entry.status === "INVOICE_GENERATED" ? (
          <span className="text-emerald-700">{entry.invoiceNumber}</span>
        ) : entry.status === "NO_INVOICE_NEEDED" ? (
          <span className="text-slate-500" title={entry.noInvoiceReason ?? ""}>
            No invoice needed
          </span>
        ) : (
          <span className="text-amber-700">Needs invoice</span>
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {entry.status === "INVOICE_GENERATED" && (
          <button onClick={onViewInvoice} className="text-xs text-slate-900 underline">
            View invoice
          </button>
        )}
        {entry.status === "NEEDS_INVOICE" && (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <select
                className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.length === 0 && <option value="">No templates</option>}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => onGenerate(templateId)}
                disabled={!entry.customerName || !templateId}
                className="rounded bg-slate-900 px-2 py-0.5 text-xs text-white disabled:opacity-40"
              >
                Generate
              </button>
            </div>
            <div className="flex gap-1">
              <input
                className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                placeholder="Reason (e.g. own transfer)"
                value={noInvoiceReason}
                onChange={(e) => setNoInvoiceReason(e.target.value)}
              />
              <button
                onClick={() => onUpdate({ status: "NO_INVOICE_NEEDED", noInvoiceReason })}
                disabled={!noInvoiceReason}
                className="rounded border border-slate-300 px-2 py-0.5 text-xs disabled:opacity-40"
              >
                No invoice needed
              </button>
            </div>
          </div>
        )}
        {entry.status === "NO_INVOICE_NEEDED" && (
          <button
            onClick={() => onUpdate({ status: "NEEDS_INVOICE" })}
            className="text-xs text-slate-500 underline"
          >
            Reopen
          </button>
        )}
      </td>
    </tr>
  );
}
