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

## 4. Missing questions — and proposed defaults

These need a decision-maker's sign-off, but each has a recommended
default so the build isn't blocked:

1. **Who is legally the "filer" of record?** → *Default:* the client's
   accountant, who must hold a valid Estonian accounting/tax
   representation right; the platform is a tool they use, not itself a
   tax intermediary — avoids the platform needing its own EMTA
   e-service credentials per client. Confirm with an Estonian tax lawyer
   before launch.
2. **Bank connectivity: build direct PSD2 integrations per bank, or use
   an aggregator?** → *Default:* start with an aggregator (Nordigen/GoCardless
   Bank Account Data has strong Baltic coverage and a free tier) to reach
   all major Estonian banks quickly; revisit direct integration only if
   aggregator cost/reliability becomes a problem at scale.
3. **Which LLM/AI approach for document extraction and categorization?**
   → *Default:* a hybrid — deterministic OCR/parsing (e.g. structured
   bank CSV/MT940/PSD2 JSON needs no OCR) plus an LLM (Claude) for
   unstructured receipts/invoices and for categorization suggestions,
   with per-tenant rule learning from accepted/corrected categorizations
   layered on top so the LLM call frequency (and cost) drops over time.
4. **E-signature integration: direct SK ID Solutions contract, or a
   signing middleware (e.g. Dokobit, Allsign)?** → *Default:* start with
   a signing middleware (Dokobit is Baltic-focused and has a
   developer API) to avoid a direct SK certification process before
   product-market fit is proven.
5. **EMTA submission: does the product submit filings via API, or
   produce a ready file/pre-filled form for the accountant to submit
   manually in EMTA's portal?** → *Default (MVP):* generate the
   correctly formatted filing package and let the accountant do the
   final submit-click inside EMTA's own portal — removes the need for
   X-tee membership/certification for launch. Automate the API
   submission in phase 2 once volume and trust justify the
   certification effort.
6. **Pricing model?** → *Default:* per-business monthly subscription
   tiered by transaction volume, plus a per-filing fee if the platform
   also brokers the accountant relationship (marketplace model) rather
   than the business bringing their own accountant.
7. **Does the platform supply the accountant, or does the client bring
   their own?** → *Default for MVP:* client brings their own accountant
   (lower liability/regulatory surface); a "find an accountant"
   marketplace is a natural phase-2 expansion once the review workflow
   is proven.
8. **Multi-entity / multi-currency support?** → *Default:* MVP is
   single-entity, EUR-only, Estonian-resident companies; the data model
   is built multi-currency-ready from day one to avoid a rewrite.
9. **Liability and insurance** if AI mis-categorizes and an accountant
   misses it → *Default:* every AI-suggested figure is visibly flagged
   as "AI-suggested, unreviewed" until an accountant explicitly accepts
   it; the platform's terms of service place statutory filing
   responsibility on the signing accountant, consistent with how
   existing accounting software (e.g. Merit Aktiva, e-Financials) is
   positioned.

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

- **Phase 0 (this repo, current commit):** auth, business creation,
  team invitations with roles, document upload + AI-assisted
  categorization stub. Foundation for everything else.
- **Phase 1:** bank connection (aggregator) + transaction import +
  reconciliation against categorized documents; ledger view.
- **Phase 2:** invoice generation from uploaded company templates for
  unmatched revenue transactions; KMD (VAT return) draft generation.
- **Phase 3:** accountant review workspace (diff view, confidence
  flags, comment threads) + Mobile-ID/Smart-ID signing via a signing
  middleware.
- **Phase 4:** EMTA filing package export → accountant-assisted manual
  submission; annual report (Ariregister/XBRL) support.
- **Phase 5:** direct EMTA/X-tee API submission (pending
  certification); expand beyond Estonia (Latvia/Lithuania share similar
  e-invoicing/Peppol infrastructure and are natural next markets).

## 7. What this commit ships

A working vertical slice of Phase 0: sign up, create or join a business,
invite team members by role, upload documents, and get an AI-assisted
category suggestion a human can accept or correct — the substrate every
later phase (bank sync, invoicing, filing, signing) plugs into.
