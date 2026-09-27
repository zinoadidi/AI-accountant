# AI Accountant

AI-assisted bookkeeping and tax filing for small businesses, starting in
Estonia. See [`PROPOSAL.md`](./PROPOSAL.md) for the full product/technical
proposal, confirmed decisions, and roadmap.

Persistence, file storage, and AI all run through the
**generic-crud backend** (`../generic-crud-backend`): its JSON store holds
every record, its file endpoints hold receipt photos/statements/invoice
files, and its server-side relay calls Meta Spark
(`muse-spark-1.3-contributor`) — the API key never leaves that backend.
This repo (Next.js App Router + Tailwind) is the web/PWA frontend plus thin
auth-checked API routes.

## Getting started (local)

Terminal 1 — backend (holds the Meta key server-side):

```bash
cd ../generic-crud-backend
META_API_KEY="$(cat ~/.config/dorra/meta-api.key)" PORT=3531 HOST=127.0.0.1 npm start
```

Terminal 2 — app:

```bash
cp .env.example .env   # set NEXTAUTH_SECRET and CRUD_APP_ID
npm install
npm run dev
```

Then open http://localhost:3000. Without `META_API_KEY` the app still works
end to end — AI suggestions fall back to keyword heuristics.

## What it does

- Sign up, create or join multiple businesses (switcher), invite team by
  role (owner, accountant, bookkeeper, employee, viewer)
- Receipt capture: phone camera (`capture="environment"`) or manual upload,
  AI-extracted vendor/amount/VAT with optional human confirm
- Bank statements: import LHV / Stripe / generic CSV (verified against real
  statements in `example_company_data_zinospot/`, git-ignored), reconcile
  against receipts and revenue entries — unmatched credits auto-become
  `NEEDS_INVOICE` entries with an AI no-invoice hint, debits without a
  matching receipt are flagged, large unattended credits need attention
- Missing-invoice generation from the company template (every business is
  seeded with a placeholder adapted from the real Zinospot layout until the
  actual company template arrives): rectify customer details one-by-one or
  via CSV export → edit → re-import, then generate
- Filing periods with per-filing accountant engagements, disclaimer
  checkpoints, pricing-mode selection, "Coming soon" pattern for automated
  EMTA submission and payment processing

## Project layout

- `src/lib/crud.ts` — low-level generic-crud client (store, files, AI).
  Server-side only.
- `src/lib/db.ts` — domain store: users, businesses, memberships,
  invitations, documents, filings, engagements, templates, revenue entries,
  statements (typed `kind` docs in the backend store)
- `src/lib/ai.ts` — Meta Spark calls with heuristic fallback (categorize,
  no-invoice suggestion); `src/lib/categorize.ts` is the single seam
- `src/lib/statements.ts` — LHV/Stripe/generic CSV parsing
- `src/lib/invoicing.ts` — `{{token}}` rendering, numbering,
  `suggestNoInvoiceReason`; `src/lib/default-template.ts` — placeholder
  company template seeded per business
- `src/lib/csv.ts`, `src/lib/permissions.ts` — CSV utils, access checks
- `src/app/api/**` — auth-checked routes (businesses, invitations,
  documents, statements + reconcile, files proxy, filings, engagements,
  templates, revenue + CSV export/import + invoice generation)
- `src/app/**` — landing page, auth, business switcher, dashboard, team,
  documents (camera capture), statements, filings, revenue, templates,
  billing, PWA manifest
- `example_company_data_zinospot/` — LOCAL ONLY (git-ignored): real LHV /
  Stripe statements and invoice layouts used to verify the parser

## What's next

Per `PROPOSAL.md` phases 1–5 and `HANDOFF.md`: real KMD drafting from the
reconciled ledger, accountant marketplace/review workspace, e-signature
(Dokobit) integration, EMTA/X-tee live submission, annual reports.
