"use client";

import { useState } from "react";

// The pattern confirmed for every feature that needs more effort than an
// MVP slice can justify yet: ship the manual/streamlined path as the real,
// working default, and surface the fuller-automation version as a visible,
// clickable entry point gated behind this modal — never just hide it.
export function ComingSoonButton({
  label,
  title,
  description,
  className,
}: {
  label: string;
  title: string;
  description: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        }
      >
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <p className="mb-2 inline-block rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
              Coming soon
            </p>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="mb-4 text-sm text-slate-600">{description}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
