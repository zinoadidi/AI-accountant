"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";

type Doc = {
  id: string;
  fileName: string;
  status: string;
  suggestedCategory: string | null;
  confirmedCategory: string | null;
  aiConfidence: number | null;
  createdAt: string;
};

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/documents`);
    if (res.ok) setDocuments(await res.json());
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

    const res = await fetch(`/api/businesses/${params.id}/documents`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  async function confirmCategory(documentId: string, category: string) {
    await fetch(`/api/businesses/${params.id}/documents/${documentId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Documents</h1>
      <p className="mb-4 text-sm text-slate-600">
        Upload receipts, bank statements, or invoices. Each one gets an
        AI-suggested category — correcting it helps accuracy, but it&apos;s
        not required before moving on.
      </p>

      <Disclaimer />

      <input ref={fileInputRef} type="file" onChange={handleUpload} disabled={uploading} />
      {uploading && <p className="mt-2 text-sm text-slate-500">Uploading and categorizing...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-8 divide-y divide-slate-200 rounded-md border border-slate-200">
        {documents.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No documents yet</li>
        )}
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{d.fileName}</p>
              <p className="text-xs text-slate-500">
                {d.confirmedCategory
                  ? `Confirmed: ${d.confirmedCategory}`
                  : d.suggestedCategory
                    ? `AI suggests: ${d.suggestedCategory} (${Math.round((d.aiConfidence ?? 0) * 100)}% confidence) — unreviewed`
                    : "Categorizing..."}
              </p>
            </div>
            {!d.confirmedCategory && d.suggestedCategory && (
              <button
                onClick={() => confirmCategory(d.id, d.suggestedCategory as string)}
                className="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                title="Optional — not required to proceed"
              >
                Confirm (optional)
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
