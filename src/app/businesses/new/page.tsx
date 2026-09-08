"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, registryCode, vatNumber }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Could not create business");
      return;
    }
    const business = await res.json();
    router.push(`/businesses/${business.id}`);
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Create your business</h1>
      <p className="mb-6 text-sm text-slate-600">
        You&apos;ll be able to invite your team and accountant next.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="Registry code (Ariregister) — optional"
          value={registryCode}
          onChange={(e) => setRegistryCode(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2"
          placeholder="VAT number — optional"
          value={vatNumber}
          onChange={(e) => setVatNumber(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create business"}
        </button>
      </form>
    </main>
  );
}
