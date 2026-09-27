"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";

type Doc = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  type?: string | null;
  status?: string | null;
  suggestedCategory: string | null;
  confirmedCategory?: string | null;
  aiConfidence: number | null;
  fileId?: string | null;
  createdAt: string;
};

const FILTERS = ["ALL", "RECEIPT", "BANK_STATEMENT", "INVOICE", "CONTRACT", "OTHER"];

function isImage(d: Doc) {
  return (d.mimeType ?? "").startsWith("image/");
}

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/documents`);
    if (res.ok) setDocuments(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/businesses/${params.id}/documents`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    load();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function confirmCategory(documentId: string, category: string) {
    await fetch(`/api/businesses/${params.id}/documents/${documentId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    load();
  }

  const visible = documents.filter((d) =>
    filter === "ALL" ? true : (d.type ?? "OTHER") === filter
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <h1 className="mb-2 text-2xl font-semibold">Documents</h1>
      <p className="mb-4 text-sm text-slate-600">
        Upload receipts, bank statements, or invoices. Each one gets an
        AI-suggested category — correcting it helps accuracy, but it&apos;s
        not required before moving on.
      </p>

      <Disclaimer />

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,.pdf,.csv"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="min-h-[56px] rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Take photo
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="min-h-[56px] rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium hover:bg-slate-100 disabled:opacity-50"
        >
          Upload file
        </button>
      </div>
      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading and categorizing...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by type">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === f
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-6 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          No documents yet{filter !== "ALL" ? " for this filter" : ""}
        </p>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {visible.map((d) => (
          <li key={d.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {d.fileId && isImage(d) ? (
              <img
                src={`/api/files/${d.fileId}`}
                alt={d.fileName}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-20 items-center justify-center bg-slate-100 text-xs uppercase tracking-wide text-slate-400">
                {d.type ?? d.mimeType ?? "file"}
              </div>
            )}
            <div className="p-3">
              <p className="truncate text-sm font-medium" title={d.fileName}>{d.fileName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                {d.type && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{d.type}</span>
                )}
                {d.status && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{d.status}</span>
                )}
                {d.confirmedCategory ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    Confirmed: {d.confirmedCategory}
                  </span>
                ) : d.suggestedCategory ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                    AI: {d.suggestedCategory} ({Math.round((d.aiConfidence ?? 0) * 100)}%)
                  </span>
                ) : (
                  <span className="text-slate-500">Categorizing...</span>
                )}
              </div>
              {!d.confirmedCategory && d.suggestedCategory && (
                <button
                  onClick={() => confirmCategory(d.id, d.suggestedCategory as string)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
                  title="Optional — not required to proceed"
                >
                  Confirm (optional)
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
