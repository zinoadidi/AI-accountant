// Liability sits with the signing accountant, not with per-item AI review.
// This banner is the informational checkpoint used at strategic moments
// (documents list, before preview/download/submit) instead of gating the
// workflow on confirming every AI-suggested figure one at a time.

export function Disclaimer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-medium">AI-assisted, not accountant-reviewed by default</p>
      <p className="mt-1 text-amber-800">
        {children ?? (
          <>
            Figures and categories suggested by AI are drafts. They don&apos;t
            need to be confirmed one by one to proceed — statutory
            responsibility for what&apos;s filed rests with the accountant who
            reviews and signs it.
          </>
        )}
      </p>
    </div>
  );
}
