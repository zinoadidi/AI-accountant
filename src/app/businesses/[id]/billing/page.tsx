"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ComingSoonButton } from "@/components/ComingSoon";
import { PRICING_MODES, type PricingMode } from "@/lib/types";

const PLAN_COPY: Record<PricingMode, { title: string; description: string }> = {
  PAY_PER_REPORT: {
    title: "Pay per report",
    description: "No commitment — pay each time a report or filing is generated.",
  },
  PROFESSIONAL_FEE: {
    title: "Order a professional",
    description:
      "Order a vetted accountant for a specific filing through the marketplace; pay their fee per engagement.",
  },
  SUBSCRIPTION: {
    title: "Subscription",
    description: "One monthly plan, tiered by volume, covering everything.",
  },
};

export default function BillingPage() {
  const params = useParams<{ id: string }>();
  const [pricingMode, setPricingMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses`);
    if (res.ok) {
      const businesses = await res.json();
      const business = businesses.find((b: { id: string; pricingMode: string | null }) => b.id === params.id);
      setPricingMode(business?.pricingMode ?? null);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function choosePlan(mode: PricingMode) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricingMode: mode }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not update plan");
      return;
    }
    setPricingMode(mode);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Billing</h1>
      <p className="mb-8 text-sm text-slate-600">
        Choose how this business pays. You can switch modes any time — this
        picks the mode, it doesn&apos;t charge a card yet (see below).
      </p>

      <div className="mb-8 grid gap-4">
        {PRICING_MODES.map((mode) => {
          const copy = PLAN_COPY[mode];
          const selected = pricingMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => choosePlan(mode)}
              disabled={saving}
              className={`rounded-lg border p-4 text-left hover:bg-slate-100 disabled:opacity-60 ${
                selected ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{copy.title}</h2>
                {selected && (
                  <span className="rounded bg-slate-900 px-2 py-0.5 text-xs text-white">Selected</span>
                )}
              </div>
              <p className="text-sm text-slate-600">{copy.description}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ComingSoonButton
        label="Pay & activate"
        title="Payment processing"
        description="Card/bank payment processing for whichever plan you've selected isn't wired up yet — the plan choice above is saved so billing can be enabled without asking again."
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      />
    </main>
  );
}
