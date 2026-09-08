# Session Handoff — Outstanding Items

Working tree is clean; everything below is committed and pushed to
`claude/ai-tax-filing-automation-mw41x9`. This file is the single
place to look before resuming — it doesn't duplicate `PROPOSAL.md`
(the product narrative/roadmap) or `README.md` (stack/layout), it
lists what's actually left, fragile, or undecided.

## What's built

Phase 0, Phase 0.5, and Phase 2a — see `PROPOSAL.md` §6-7 for detail.
In short: auth, multi-business switcher, team roles, document upload
with AI-assisted categorization, filing periods with per-filing
accountant engagements, disclaimer-based liability UX, pricing-mode
selection, and missing-invoice generation (template upload + revenue
entries + one-by-one/CSV customer-detail rectification + AI no-invoice
suggestions).

## Not yet built (by phase, per PROPOSAL.md roadmap)

- **Phase 1** — bank aggregator connection (Nordigen/GoCardless,
  LHV coverage first), transaction import, reconciliation against
  categorized documents, ledger view. Nothing built yet; revenue
  entries are manual/CSV until this exists.
- **Phase 2b** — real KMD (VAT return) draft generation from a
  reconciled ledger; first cut of the accountant marketplace (order a
  vetted accountant, reusing the existing membership/engagement model).
- **Phase 3** — accountant review workspace (diff view, confidence
  flags, comment threads); real e-signature integration (signing
  middleware, e.g. Dokobit) with manual sign/submit kept as fallback.
- **Phase 4** — EMTA filing package export refinements; annual report
  (Ariregister/XBRL) support. The manual-submission path and the
  "Coming soon" placeholder for automated submission already exist on
  the filing detail page.
- **Phase 5** — live EMTA/X-tee API submission (pending certification);
  expansion beyond Estonia (Latvia/Lithuania flagged as natural next
  markets).

## Known technical debt in what's already built

1. **Data store is SQLite, dev-only** — kept as-is per explicit
   instruction (no Postgres migration performed). Role/status/type
   columns are plain strings, not native enums, because SQLite doesn't
   support them (`prisma/schema.prisma` header comment). Moving to
   Postgres is a one-line provider change + migration regen, and would
   let those become real enums.
2. **Uploaded files live on local disk** (`.uploads/<businessId>/...`,
   see `src/app/api/businesses/[id]/documents/route.ts`) — won't
   survive a redeploy or run on more than one instance. Needs
   S3-compatible object storage before any real deployment, and matters
   more here than usual since these are source documents backing a
   legal filing (7-year Estonian retention requirement).
3. **Invoice numbering isn't concurrency-safe** — `generateInvoiceNumber`
   in `src/lib/invoicing.ts` counts existing invoices and adds one; fine
   for a single-writer dev/demo, but needs a real gap-free sequence
   (a DB counter row updated in a transaction) before concurrent use.
4. **No email sending anywhere** — team invitations
   (`src/app/api/businesses/[id]/invitations/route.ts`) and per-filing
   engagement invites
   (`src/app/api/businesses/[id]/filings/[filingId]/engagements/route.ts`)
   both return a shareable link that has to be sent manually. No
   transactional email provider is wired up.
5. **AI logic is keyword-heuristic, not a real model call** —
   `src/lib/categorize.ts` (document categorization) and
   `suggestNoInvoiceReason` in `src/lib/invoicing.ts` (invoice-need
   suggestion) are both simple keyword matchers. This is the
   deliberate seam for swapping in an LLM call per the confirmed
   hybrid approach, not yet done.
6. **No automated test suite** — no jest/vitest/playwright configured,
   no test files exist. All verification so far has been manual
   smoke-testing against a live dev server (documented in commit
   messages) — nothing repeatable in CI.
7. **Filing preview/download/"mark as filed" are placeholders** — the
   filing detail page's actions establish the workflow shape but don't
   generate a real KMD/annual-report data package yet; that needs
   Phase 1's reconciled ledger to be meaningful.

## Business/legal decisions still open (not code — need a human)

1. **App name**: "Deklaro" passed an initial web-search-based conflict
   check (no live software/fintech product or trademark found) but
   this is **not authoritative**. Still needed before committing:
   domain registrar check (deklaro.com/.ee/.io), EUIPO/TMview EU
   trademark search, Estonian Ariregister business-name search, and
   USPTO search if ever operating in the US. Four other candidates
   (Ledgerly, Cosign, Draftly, Signly) were checked and rejected due to
   real existing conflicts — don't reconsider those without a reason.
2. **Filer-of-record legal confirmation**: the product assumes Estonian
   law doesn't require a licensed accountant to file (representation
   rights in e-MTA suffice) — this was reasoned through, not confirmed
   by an actual Estonian tax lawyer. Get that confirmed before launch.
3. **Bank connectivity vendor**: decided to use a PSD2 aggregator
   (e.g. Nordigen/GoCardless) rather than direct bank integration, to
   avoid needing AISP authorization — no aggregator account or contract
   exists yet; this is a decision on file, not an integration in progress.
4. **E-signature vendor**: decided on a signing middleware (e.g.
   Dokobit) over a direct SK ID Solutions integration — nothing
   selected/contracted/integrated yet.
5. **Payment processing**: pricing-mode selection persists per business
   (`Business.pricingMode`), but there's no real payment processor —
   the billing page's "Pay & activate" is a "Coming soon" placeholder
   by design.
6. **EMTA submission**: manual-package-only by design for now; the
   automated X-tee/API path is a "Coming soon" placeholder pending
   actual X-tee membership/certification, a real external process this
   repo can't shortcut.

## Where to pick this up

- Branch: `claude/ai-tax-filing-automation-mw41x9`, fully pushed, clean
  working tree.
- Read `PROPOSAL.md` first for the full decision history and roadmap
  narrative, `README.md` for how to run it locally.
- Highest-leverage next step per the roadmap: **Phase 1** (bank
  aggregator connection) — Phase 2a (invoice generation) is already
  built and waiting for real transaction data instead of manual/CSV
  entry, so this is what unlocks the most existing work.
