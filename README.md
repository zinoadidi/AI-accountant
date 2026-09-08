# AI Accountant

AI-assisted bookkeeping and tax filing for small businesses, starting in
Estonia. See [`PROPOSAL.md`](./PROPOSAL.md) for the full product/technical
proposal, open questions, and roadmap.

This repo currently implements the Phase 0 vertical slice: sign up,
create or join a business, invite team members by role (owner,
accountant, bookkeeper, employee, viewer), and upload documents with
AI-assisted category suggestions.

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
  Postgres in production)
- NextAuth (credentials provider) for authentication

## Project layout

- `prisma/schema.prisma` — data model: businesses, memberships/roles,
  invitations, documents (with AI-suggested vs. human-confirmed fields
  kept distinct throughout)
- `src/lib/categorize.ts` — the single seam for document categorization;
  currently a keyword heuristic, designed to be swapped for an LLM call
- `src/app/api/**` — REST-ish route handlers for auth, businesses,
  invitations, and documents
- `src/app/**` — pages for sign up/login, business creation, team
  management, and document upload/review

## What's next

Bank statement import/reconciliation, invoice generation from uploaded
company templates, VAT return (KMD) drafting, and the
accountant-review-and-sign workflow (Mobile-ID/Smart-ID via a signing
provider) are described in `PROPOSAL.md` and are not yet implemented.
