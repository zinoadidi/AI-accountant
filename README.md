# AI Accountant

AI-assisted bookkeeping and tax filing for small businesses, starting in
Estonia. See [`PROPOSAL.md`](./PROPOSAL.md) for the full product/technical
proposal, confirmed decisions, and roadmap.

This repo implements Phase 0, Phase 0.5, and Phase 2a: sign up, create
or join multiple businesses (with a switcher), invite team members by
role (owner, accountant, bookkeeper, employee, viewer), upload
documents with AI-assisted (optional) category suggestions, open
filing periods and engage an accountant scoped to just one filing,
pick a pricing mode, disclaimer checkpoints instead of a mandatory
per-item review gate, and missing-invoice generation from an uploaded
HTML template with one-by-one or CSV-bulk customer-detail
rectification.

## Getting started

```bash
cp .env.example .env
npm install
npm run prisma:migrate -- --name init
npm run db:seed   # optional demo data: owner@example.ee / password123
npm run dev
```

Then open http://localhost:3000.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM (SQLite for local dev; swap `DATABASE_URL`/provider for
  Postgres in production — deliberately not done yet, see PROPOSAL.md)
- NextAuth (credentials provider) for authentication

## Project layout

- `prisma/schema.prisma` — data model: businesses, memberships/roles,
  invitations, documents (AI-suggested vs. human-confirmed fields kept
  distinct), filing periods, per-filing accountant engagements,
  invoice templates, and revenue entries (candidate outgoing invoices)
- `src/lib/categorize.ts` — the single seam for document categorization;
  currently a keyword heuristic, designed to be swapped for an LLM call
- `src/lib/invoicing.ts` — `{{token}}` invoice-template rendering,
  per-business invoice numbering, and `suggestNoInvoiceReason()`, an
  AI hint (never authoritative) that an entry might not need an
  invoice — real invoicing-requirement thresholds are a human/legal
  decision, not a hardcoded rule
- `src/lib/csv.ts` — quoted-field-safe CSV parse/stringify backing the
  revenue-entry bulk export/import round trip
- `src/lib/permissions.ts` — access checks, including `getFilingAccess`,
  which grants filing-scoped access via either a standing `Membership`
  or an active per-filing `Engagement`
- `src/components/Disclaimer.tsx` / `ComingSoon.tsx` — the two UI
  patterns confirmed in the proposal: liability disclaimers at
  strategic checkpoints instead of mandatory per-item review, and a
  visible "Coming soon" modal for features not built yet instead of
  hiding them
- `src/app/api/**` — REST-ish route handlers for auth, businesses,
  invitations, documents, filings, engagements, invoice templates, and
  revenue entries (including CSV export/import and invoice generation)
- `src/app/**` — pages for sign up/login, the business switcher,
  business dashboard, team, documents, filings, revenue entries,
  invoice templates, billing, and the invitation/engagement accept flows

## What's next

Live bank statement import/reconciliation (Phase 1 — revenue entries
are entered manually or via CSV until this exists), real VAT return
(KMD) drafting, and live e-signature (Mobile-ID/Smart-ID via a signing
provider) or EMTA/X-tee submission are described in `PROPOSAL.md`
(Phases 1, 2b–5) and not yet implemented — the filing page's
preview/download/"mark as filed" actions are placeholders that
establish the workflow shape.
