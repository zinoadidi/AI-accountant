# AI Accountant

AI-assisted bookkeeping and tax filing for small businesses, starting in
Estonia. See [`PROPOSAL.md`](./PROPOSAL.md) for the full product/technical
proposal, confirmed decisions, and roadmap.

This repo implements Phase 0 and Phase 0.5: sign up, create or join
multiple businesses (with a switcher), invite team members by role
(owner, accountant, bookkeeper, employee, viewer), upload documents
with AI-assisted (optional) category suggestions, open filing periods
and engage an accountant scoped to just one filing, pick a pricing
mode, and disclaimer checkpoints instead of a mandatory per-item
review gate.

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
  distinct), filing periods, and per-filing accountant engagements
- `src/lib/categorize.ts` — the single seam for document categorization;
  currently a keyword heuristic, designed to be swapped for an LLM call
- `src/lib/permissions.ts` — access checks, including `getFilingAccess`,
  which grants filing-scoped access via either a standing `Membership`
  or an active per-filing `Engagement`
- `src/components/Disclaimer.tsx` / `ComingSoon.tsx` — the two UI
  patterns confirmed in the proposal: liability disclaimers at
  strategic checkpoints instead of mandatory per-item review, and a
  visible "Coming soon" modal for features not built yet instead of
  hiding them
- `src/app/api/**` — REST-ish route handlers for auth, businesses,
  invitations, documents, filings, and engagements
- `src/app/**` — pages for sign up/login, the business switcher,
  business dashboard, team, documents, filings, billing, and the
  invitation/engagement accept flows

## What's next

Bank statement import/reconciliation, invoice generation from uploaded
company templates, real VAT return (KMD) drafting, and live e-signature
(Mobile-ID/Smart-ID via a signing provider) or EMTA/X-tee submission
are described in `PROPOSAL.md` (Phases 1–5) and not yet implemented —
the filing page's preview/download/"mark as filed" actions are
placeholders that establish the workflow shape.
