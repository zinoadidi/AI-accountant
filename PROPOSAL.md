# AI Accountant — Product & Technical Proposal

**Market entry: Estonia** (e-Residency / e-Tax / e-Invoicing infrastructure)

## 1. Vision

An AI-driven back-office for small and medium businesses that turns raw
financial inputs (bank statements, receipts, contracts) into filed tax
returns — with a licensed accountant doing only final review, cross-check
and signature. Estonia is the pilot market because its state digital
infrastructure (e-MTA, e-Business Register, X-tee data exchange layer,
e-invoicing standard, and nationwide Mobile-ID/Smart-ID e-signature) makes
end-to-end automation realistic; other EU markets follow once the core
pipeline is proven.

## 2. Core user journey

1. **Join / create a business** — an owner signs up, creates a company
   profile (registry code, VAT number, financial year, accounting basis)
   or accepts an invite to an existing one.
2. **Invite team members** — owner invites bookkeepers, employees who
   submit receipts, and one or more **accountants** with a review/approve
   role. Role-based access: Owner, Accountant, Bookkeeper, Employee, Viewer.
3. **Connect data sources** — bank accounts (PSD2 Open Banking / AISP
   aggregator), e-mail inbox for receipts, and the company's invoice
   template(s).
4. **Upload & categorize documents** — receipts, contracts, prior filings.
   AI extracts vendor, date, amount, VAT rate, and assigns an accounting
   category / chart-of-accounts code; humans can correct, and corrections
   train per-tenant categorization rules.
5. **Bank statement analysis** — AI reconciles transactions against
   receipts/invoices, flags unmatched items, detects recurring
   expenses/income, and drafts the general ledger.
6. **Generate missing invoices** — for revenue transactions lacking a
   matching sales invoice, the system drafts one from the company's own
   invoice template (numbering sequence, VAT treatment, legal footer)
   for the owner to confirm and send.
7. **Compile the statutory report** — VAT return (KMD) and/or annual
   report data package, in Estonian, using EMTA's required terminology
   and XML/e-form schema.
8. **Accountant review package** — a single review screen with the
   proposed filing, every source document linked to every line, AI
   confidence flags, and a diff since last period. The accountant edits
   if needed, then approves.
9. **Digital signature & filing** — accountant (and owner, where
   co-signature is required) signs with Mobile-ID / Smart-ID / ID-card
   (via SK ID Solutions), and the system submits through EMTA's e-service
   API (X-tee/X-Road member).
10. **Audit trail** — every AI suggestion, human edit, and signature is
    versioned and retained for the statutory retention period (7 years
    in Estonia).

## 3. Estonia-specific integration points

| Need | Estonian mechanism |
|---|---|
| Tax authority filing | Estonian Tax and Customs Board (EMTA) e-services; X-tee (X-Road) data-exchange layer for machine-to-machine filing where available, otherwise EMTA's e-service API/forms |
| VAT return | KMD form, monthly, in Estonian |
| Annual report | Submitted via the e-Business Register (Ariregister) / RIK's annual report environment, XBRL-based |
| e-Invoicing | Estonian e-invoice standard (EVS 923 / Peppol BIS Billing 3.0 over Peppol network); mandatory B2G since 2019, increasingly expected B2B |
| Digital signature | Mobile-ID, Smart-ID, ID-card — all via SK ID Solutions' signing APIs; a signature has full legal equivalence to a handwritten one under eIDAS |
| Business registry data | Ariregister API for company lookups, validating registry code/VAT number |
| Open banking | PSD2 AISP access via Estonian banks (LHV, Swedbank, SEB, Luminor) or an aggregator (e.g. Salt Edge, Nordigen/GoCardless Bank Account Data) |
| Data residency | GDPR applies; Estonia has no extra data-localization mandate for private SaaS, but audit-log integrity standards (KSI blockchain, as used by state registries) are a credibility differentiator worth offering later |

## 4. Confirmed decisions

These were open questions in the first draft of this proposal; the
decision-maker has now confirmed each one. Where a decision materially
changes scope from the Phase 0 code already in this repo, that's called
out explicitly — those changes are not yet implemented.

1. **Who is legally the "filer" of record?** → **Confirmed:** whoever
   signs is the legal representative. It doesn't matter where the
   accountant comes from — a user invited (or matched) with the
   `ACCOUNTANT` role reviews, signs, and that constitutes filing. Both
   sourcing paths are in scope: the client invites their own accountant
   (already supported by Phase 0), or orders a vetted one through a
   platform marketplace (phase 2+). *Still worth a one-time check with
   an Estonian tax lawyer that this holds up before launch.*
2. **Accountant engagement model.** → **Confirmed — scope change:**
   support **both** a standing team membership (the current
   `Membership` model — ongoing access, any role) **and** a per-filing
   / per-period scoped engagement (an accountant granted access to one
   filing only, e.g. via the marketplace) from the start, not phased.
   This needs a new `Engagement`-style concept alongside `Membership`
   in the data model — not yet built.
3. **Bank connectivity.** → **Confirmed:** use an open banking
   aggregator (e.g. Nordigen/GoCardless) for LHV and other Estonian
   banks rather than pursuing direct PSD2/AISP integration per bank —
   avoids the licensing overhead of direct access. Manual statement
   upload (already built) always remains available as a fallback,
   independent of aggregator status.
4. **AI approach.** → **Confirmed:** hybrid — deterministic parsing for
   structured data plus an LLM for unstructured receipts/invoices and
   categorization, with per-tenant rule learning from corrections. This
   matches the seam already built in `src/lib/categorize.ts`.
5. **E-signature integration.** → **Confirmed:** integrate a signing
   middleware (e.g. Dokobit) as the primary path, but always keep a
   manual fallback (accountant signs and submits outside the platform)
   available in case the middleware integration needs more setup than
   expected or is temporarily unavailable.
6. **EMTA submission.** → **Confirmed:** ship the manual path first —
   generate the correctly formatted filing package for the accountant
   to submit inside EMTA's own portal. The automated API/X-tee
   submission path is shown in the UI as a real, clickable option, but
   behind a "Coming soon" / premium modal rather than hidden — this is
   the general pattern to apply everywhere a feature is deferred:
   ship the manual/streamlined version as the working default, and
   surface the fuller-automation version as a visible, gated
   coming-soon/premium entry point rather than omitting it.
7. **Pricing model.** → **Confirmed — scope change:** offer all three
   modes and let the customer pick: (a) pay-as-you-go per report/filing,
   (b) an order-a-professional fee (the accountant marketplace path),
   and (c) an all-inclusive subscription with tiers. Needs a pricing/plan
   selection concept in the data model and billing layer — not yet built.
8. **Multi-entity / multi-currency support.** → **Confirmed — scope
   change:** support multi-entity from the start, not deferred to a
   later phase — one user/team should be able to manage multiple
   companies (a group structure, or an accountant serving several
   clients). The current schema already scopes every record by
   `businessId` and a `User` already has a `Membership[]`, so the model
   mostly supports this already; what's missing is the UI (a
   business-switcher) and confirming that memberships/engagements
   compose correctly across entities.
9. **Liability handling.** → **Confirmed:** the signing accountant
   carries statutory responsibility, consistent with existing
   accounting software. Explicitly **not** required: blocking, per-line
   human confirmation of every AI-suggested figure before proceeding.
   Instead, place clear disclaimers at strategic checkpoints — before
   submit, before download, before preview — rather than gating the
   workflow on confirming each item individually. **This changes the
   already-built documents flow:** the current UI requires confirming
   each document's AI-suggested category one at a time before it's
   marked reviewed; per this decision that confirm step should become
   optional/informational rather than a required gate, with the
   liability disclaimer doing the actual legal work at the
   submit/download/preview points instead.

## 5. Architecture (MVP)

```
┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐
│  Next.js UI │───▶│  API (route      │───▶│ PostgreSQL         │
│  (App       │◀───│  handlers,       │◀───│ (multi-tenant,     │
│  Router)    │    │  Prisma ORM)     │    │ business_id scoped)│
└─────────────┘    └────────┬─────────┘    └───────────────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                  ▼
      ┌───────────────┐ ┌──────────────┐ ┌────────────────────┐
      │ Document AI    │ │ Bank data     │ │ Filing/e-signature  │
      │ pipeline       │ │ aggregator    │ │ connectors          │
      │ (OCR + LLM     │ │ (PSD2 via     │ │ (Dokobit / SK ID,   │
      │ categorization)│ │ Nordigen etc) │ │ EMTA package export)│
      └───────────────┘ └──────────────┘ └────────────────────┘
```

Multi-tenancy: every table is scoped by `businessId`; row-level checks
enforced in the data-access layer. Every AI output is stored as a
proposal with confidence + source-document links, never overwriting a
human-entered value silently.

## 6. Phased roadmap

- **Phase 0 (shipped):** auth, business creation, team invitations
  with roles, document upload + AI-assisted categorization stub.
  Foundation for everything else.
- **Phase 0.5 (shipped):**
  - Multi-entity: a `/businesses` switcher listing every business a user
    belongs to, with a shared nav layout across business-scoped pages.
  - `FilingPeriod` — the scoping unit for a single statutory filing (a
    VAT return, an annual report) — plus dual accountant engagement:
    a per-filing `Engagement` (invited by email, accepted like a team
    invite, grants access to only that one filing) alongside the
    existing standing `Membership`. Verified an engaged-only accountant
    (no `Membership` row) can open their filing but is blocked from the
    business's documents/team/dashboard.
  - Disclaimer-based liability UX: a reusable banner shown on the
    documents page and before preview/download/"mark as filed" on a
    filing; the AI-category confirm button is now explicitly labeled
    optional and nothing gates on it.
  - Pricing mode scaffolding (`Business.pricingMode`: pay-per-report /
    professional-fee / subscription) with a plan-picker page — no
    payment processing wired up.
  - The "Coming soon" pattern: a reusable modal used for the automated
    EMTA/X-tee submission button (filing page) and for payment
    activation (billing page) — visible, clickable, honest about what's
    not built yet, rather than hidden.
- **Phase 1:** bank connection (aggregator, LHV first) + transaction
  import + reconciliation against categorized documents; ledger view.
  Manual statement upload remains available throughout.
- **Phase 2a (shipped, ahead of Phase 1):** missing-invoice generation.
  A business uploads its own invoice design as HTML with
  `{{placeholder}}` tokens (`InvoiceTemplate`); each candidate outgoing
  invoice is a `RevenueEntry` scoped to a filing period, with
  rectifiable customer details filled in either one at a time in the UI
  or via CSV export → edit in a spreadsheet → re-upload (update-by-id or
  create-new). Whether an entry needs an invoice at all is always an
  explicit human decision with a stated reason — an AI heuristic
  (`suggestNoInvoiceReason`) only *suggests* likely exceptions (refunds,
  transfers between own accounts, bank interest/fees) for a human to
  confirm; it never asserts a legal conclusion, since real Estonian
  invoicing-requirement thresholds need a lawyer's sign-off, not a
  keyword match. Built standalone (manual/CSV entry) since it doesn't
  need live bank data to be useful — once Phase 1 ships, unmatched
  revenue transactions will create these `RevenueEntry` rows
  automatically instead of requiring manual/CSV entry.
- **Phase 2b (not yet built):** KMD (VAT return) draft generation from
  the reconciled ledger; first cut of the accountant marketplace (order
  a vetted accountant, which creates the same membership/engagement
  invite-your-own does).
- **Phase 3:** accountant review workspace (diff view, confidence
  flags, comment threads) + Mobile-ID/Smart-ID signing via a signing
  middleware, with manual sign/submit kept as a fallback path.
- **Phase 4:** EMTA filing package export → accountant-assisted manual
  submission is the working path; the direct API/X-tee submission
  appears in the UI as a "Coming soon" / premium entry point rather
  than being hidden. Annual report (Ariregister/XBRL) support.
- **Phase 5:** direct EMTA/X-tee API submission goes live (pending
  certification), replacing its coming-soon modal; expand beyond
  Estonia (Latvia/Lithuania share similar e-invoicing/Peppol
  infrastructure and are natural next markets).

## 7. What's shipped

Phase 0, Phase 0.5, and Phase 2a are implemented: sign up, create or
join a business, a multi-business switcher, team invitations by role,
document upload with AI-assisted (and explicitly optional) category
suggestions, filing periods with per-filing accountant engagements,
disclaimer checkpoints instead of a mandatory review gate, pricing-mode
selection, the "Coming soon" pattern for automated EMTA submission and
payment processing, and missing-invoice generation (upload your own
HTML invoice template, rectify customer details one-by-one or via CSV
bulk import/export, generate the invoice, with a human — never the
system — deciding when an entry doesn't need one). Phase 1 and 2b (real
bank sync, actual KMD/report drafting, e-signature, live EMTA filing)
are not yet built — see the roadmap above.
