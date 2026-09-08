"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

type Template = { id: string; name: string; html: string; createdAt: string };

export default function TemplatesPage() {
  const params = useParams<{ id: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/templates`);
    if (res.ok) setTemplates(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setHtml(text);
    if (!name) setName(file.name.replace(/\.html?$/i, ""));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, html }),
    });
    if (!res.ok) {
      setError("Could not save template");
      return;
    }
    setName("");
    setHtml("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Invoice templates</h1>
      <p className="mb-6 text-sm text-slate-600">
        Upload your existing invoice design as HTML. Use{" "}
        <code>{"{{customerName}}"}</code>, <code>{"{{amount}}"}</code>,{" "}
        <code>{"{{invoiceNumber}}"}</code>, etc. as placeholders — the system
        fills those in when generating an invoice for a revenue entry. Any
        other markup/styling in the file is kept as-is.
      </p>

      <ul className="mb-8 divide-y divide-slate-200 rounded-md border border-slate-200">
        {templates.length === 0 && (
          <li className="px-4 py-3 text-sm text-slate-500">No templates yet</li>
        )}
        {templates.map((t) => (
          <li key={t.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium">{t.name}</span>
            <button
              onClick={() => setPreview(t.html)}
              className="text-sm text-slate-600 underline hover:text-slate-900"
            >
              Preview
            </button>
          </li>
        ))}
      </ul>

      {preview && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Template preview (raw tokens, unfilled)</h2>
            <button onClick={() => setPreview(null)} className="text-sm text-slate-500 underline">
              Close
            </button>
          </div>
          <iframe
            className="h-64 w-full rounded-md border border-slate-200 bg-white"
            srcDoc={preview}
            sandbox=""
          />
        </div>
      )}

      <h2 className="mb-2 font-medium">Add a template</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Template name, e.g. Standard sales invoice"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileChange} />
        <textarea
          className="min-h-[160px] rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
          placeholder="...or paste HTML directly"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="self-start rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Save template
        </button>
      </form>
    </main>
  );
}
