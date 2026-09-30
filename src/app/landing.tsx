"use client";

import Link from "next/link";
import Image from "next/image";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ScheduleIcon from "@mui/icons-material/Schedule";

// Design plan (frontend-design skill, reviewed against the brief):
// - Palette: keep the repo's ledger-green system (primary #0B6B3A, dark band
//   #0B2E1C, paper #F4F6F4) — the brief accepts green/white. "Coming soon"
//   honesty is carried by outlined chips, not a second accent color.
// - Type: inherited MUI system stack with tight tracking on headings;
//   sentence-case section labels (no ALL-CAPS eyebrows, no em-dash labels).
// - Layout: left-aligned editorial; the memorable element is the "January
//   close" ledger card in the hero (a real product shape, not a metaphor).
//   Sections alternate: artifact / trio / split rows with local unDraw
//   illustrations / honest timeline / compact Estonia strip / pricing.
// - Restraint: one dark band (pricing+CTA), one orchestrated artifact;
//   no scroll-reveal choreography, no gradient washes.

const NAV: [string, string][] = [
  ["Monthly", "#monthly"],
  ["Yearly", "#yearly"],
  ["Product", "#product"],
  ["Coming soon", "#coming"],
  ["Estonia", "#estonia"],
  ["Pricing", "#pricing"],
];

const MONTH_CLOSE_ROWS: { report: string; detail: string; state: string }[] = [
  {
    report: "Salary & payroll (TSD)",
    detail: "January payouts collected, ready for the declaration",
    state: "Ready",
  },
  {
    report: "VAT return (KMD)",
    detail: "Drafted from 8 reconciled credits · input VAT €118.40",
    state: "Draft",
  },
  {
    report: "Monthly overview",
    detail: "Income, expenses, who owes whom — one page",
    state: "Ready",
  },
];

const MONTHLY_REPORTS = [
  {
    title: "Salary & payroll (TSD)",
    text: "If you pay yourself or a team, every month means a TSD declaration. Payouts, salary documents, and payroll inputs are collected into the month as they arrive, so the declaration starts from organized records instead of a shoebox.",
  },
  {
    title: "VAT return (KMD) — one of the three",
    text: "VAT is included, not the headline. The month's reconciled sales and purchases draft the KMD rows, your accountant reviews and edits, and the filing sheet downloads for EMTA.",
  },
  {
    title: "Monthly overview",
    text: "The report nobody files but everybody needs: income and expenses for the month, outstanding invoices, and who owes whom — the basis for every decision before the next month starts.",
  },
];

const SHIPPED_PLUMBING: [string, string][] = [
  [
    "Filing periods",
    "Each statutory filing (a VAT return, an annual report) is a scoped period with its own records, review, and sign-off.",
  ],
  [
    "Per-filing accountant engagements",
    "Invite an accountant for one filing only, or keep them on the standing team — both paths use the same review flow.",
  ],
  [
    "Pricing modes, per business",
    "Pay per report, order-a-professional fee, or all-inclusive subscription — picked per business, no seat licences.",
  ],
  [
    "Disclaimer-based liability",
    "Clear disclaimers at submit, download, and preview checkpoints. The signing accountant carries statutory responsibility — the workflow never gates on per-line confirmations.",
  ],
];

const COMING_STEPS: [string, string][] = [
  ["Connect your invoice system", "Sales invoices flow in on their own — no CSV round-trips."],
  ["Connect your business email", "Incoming invoices are auto-identified as they arrive."],
  ["Request missing invoices", "Ask counterparties from a control center that tracks every request."],
  ["Built-in invoicing", "Produce invoices right here when you need to, not in a second tool."],
  ["Connected bank", "Initiate payments directly, or mark them paid manually — your call."],
  ["Automatic reconciliation", "Each monthly statement upload reconciles itself against documents and invoices."],
  ["Reports, filled in", "Monthly reports and the yearly report complete themselves from the reconciled month."],
];

export function Landing({ authed }: { authed: boolean }) {
  const primary = authed ? "/businesses" : "/signup";
  const primaryLabel = authed ? "Go to your businesses" : "Start free";

  return (
    <Box>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ maxWidth: 1120, width: "100%", mx: "auto", gap: 1 }}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="subtitle1" sx={{ mr: 3, fontWeight: 750 }}>
            AI Accountant
          </Typography>
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, flexGrow: 1 }}>
            {NAV.map(([label, href]) => (
              <Link key={href} href={href} style={{ textDecoration: "none", color: "inherit" }}>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </Link>
            ))}
          </Box>
          {authed ? (
            <Button component={Link} href="/businesses" variant="contained">
              Go to businesses
            </Button>
          ) : (
            <>
              <Button component={Link} href="/login" color="inherit">
                Log in
              </Button>
              <Button component={Link} href="/signup" variant="contained">
                Sign up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        {/* Hero: thesis left, the month-close ledger card right */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            gap: 6,
            alignItems: "center",
            pt: { xs: 6, md: 10 },
            pb: 8,
          }}
        >
          <Box>
            <Chip
              label="Monthly + yearly reporting for Estonian small businesses"
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 38, md: 52 }, lineHeight: 1.08 }}>
              Close every month. File every year.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2, maxWidth: 500, fontWeight: 400 }}>
              One place for the reports a small business actually files: salary
              and payroll (TSD), VAT (KMD), and the monthly overview of income,
              expenses, and who owes whom — plus the yearly report. VAT is
              included, not the headline.
            </Typography>
            <Box sx={{ mt: 4, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <Button component={Link} href={primary} variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                {primaryLabel}
              </Button>
              <Button component={Link} href="#product" variant="outlined" size="large">
                See what works today
              </Button>
            </Box>
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {["Accountant signs, not the model", "Manual EMTA path works today", "7-year audit trail"].map((t) => (
                <Box key={t} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <CheckIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {t}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* The artifact: a January close, three reports in one card */}
          <Card elevation={0}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  January close · OÜ Example (16066981)
                </Typography>
                <Chip label="3 reports" size="small" color="primary" />
              </Box>
              <Box sx={{ px: 3, pb: 1 }}>
                {MONTH_CLOSE_ROWS.map((r) => (
                  <Box
                    key={r.report}
                    sx={{ display: "flex", gap: 2, alignItems: "baseline", py: 1.25, borderTop: 1, borderColor: "divider" }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {r.report}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.detail}
                      </Typography>
                    </Box>
                    <Chip label={r.state} size="small" variant="outlined" color="primary" />
                  </Box>
                ))}
              </Box>
              <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Twelve closed months become the yearly report — December is just month twelve.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Monthly: three reports, VAT as one of them */}
      <Box sx={{ bgcolor: "background.paper", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 7 }} id="monthly">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
              gap: 5,
              alignItems: "center",
            }}
          >
            <Box>
              <Typography component="h2" variant="h2" sx={{ fontSize: 30 }}>
                A month has three reports. All three live here.
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 420 }}>
                A business filing monthly deals with more than VAT. Payroll
                means TSD declarations, sales and purchases mean the KMD — and
                underneath both, the overview that tells you where the business
                stands.
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Image
                  src="/illustrations/month-organized.svg"
                  alt="Illustration of an organized monthly workflow"
                  width={420}
                  height={233}
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {MONTHLY_REPORTS.map((r) => (
                <Card key={r.title} elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {r.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {r.text}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Yearly */}
      <Container maxWidth="lg" sx={{ py: 7 }} id="yearly">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: 5,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography component="h2" variant="h2" sx={{ fontSize: 30 }}>
              The yearly report writes itself from twelve closed months.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 480 }}>
              Revenue, bank flow, and profit hints accumulate with every closed
              month, shaped for the e-Business Register (Ariregister). When the
              year ends there is no archaeology — your accountant reviews,
              signs, and files.
            </Typography>
            <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {["Ariregister-shaped package", "Twelve months of evidence linked", "Accountant review & sign-off"].map(
                (t) => (
                  <Box key={t} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    <CheckIcon color="primary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {t}
                    </Typography>
                  </Box>
                ),
              )}
            </Box>
          </Box>
          <Box>
            <Image
              src="/illustrations/year-report.svg"
              alt="Illustration of savings growing toward the yearly report"
              width={420}
              height={280}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Box>
      </Container>

      {/* Shipped product tour */}
      <Box sx={{ bgcolor: "background.paper", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 7 }} id="product">
          <Typography component="h2" variant="h2" sx={{ fontSize: 30, maxWidth: 620 }}>
            Working in the product today — the all-in-one behind the reports.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 640 }}>
            Reports are the output. This is the machinery that feeds them:
            documents, bank lines, invoices, people, and filing discipline.
          </Typography>

          <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box>
                <Image
                  src="/illustrations/ai-documents.svg"
                  alt="Illustration of AI-assisted document analysis"
                  width={440}
                  height={300}
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
              <Box>
                <Typography component="h3" variant="h3" sx={{ fontSize: 22 }}>
                  Documents in, categories suggested
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  Upload receipts, contracts, and prior filings — from a phone
                  camera or a laptop. AI extracts vendor, date, amount, VAT
                  rate, and suggests the accounting category. Confirming a
                  suggestion is explicitly optional: the legal weight sits in
                  disclaimer checkpoints at submit, download, and preview, not
                  in per-line busywork.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box sx={{ order: { xs: 2, md: 1 } }}>
                <Typography component="h3" variant="h3" sx={{ fontSize: 22 }}>
                  Bank statements reconciled, gaps surfaced
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  Import LHV, Stripe, or generic CSV statements and reconcile
                  each line against your documents. Credits without an invoice
                  become needs-invoice entries with an AI hint; debits without
                  a receipt get flagged. Nothing hides, nothing waits for
                  month-end archaeology.
                </Typography>
              </Box>
              <Box sx={{ order: { xs: 1, md: 2 } }}>
                <Card elevation={0}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Reconciliation · LHV January.csv · 35 lines
                      </Typography>
                    </Box>
                    <Box sx={{ px: 3, pb: 2 }}>
                      {[
                        ["+ €1,204.16 · Client OÜ", "Matched to INV-2026-0001"],
                        ["+ €42.00 · Stripe payout", "Needs invoice · AI hint ready"],
                        ["− €89.90 · Office supplies", "Receipt missing · flagged"],
                      ].map(([line, state]) => (
                        <Box
                          key={line}
                          sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "baseline",
                            py: 1,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                            {line}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {state}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box>
                <Image
                  src="/illustrations/invoicing.svg"
                  alt="Illustration of generating an invoice from a template"
                  width={440}
                  height={300}
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
              <Box>
                <Typography component="h3" variant="h3" sx={{ fontSize: 22 }}>
                  Missing invoices generated from your template
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  Upload your own invoice design once, with simple placeholders
                  for numbers, VAT treatment, and the legal footer. Fill in
                  customer details one by one — or in bulk via CSV export and
                  re-upload — and generate the invoice. Whether an entry needs
                  an invoice at all stays a human decision, with a one-click AI
                  suggestion where the pattern is obvious.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 4,
                alignItems: "center",
              }}
            >
              <Box sx={{ order: { xs: 2, md: 1 } }}>
                <Typography component="h3" variant="h3" sx={{ fontSize: 22 }}>
                  People and filings, organized per business
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                  Manage several companies from one account with the
                  business switcher. Invite owners, accountants, bookkeepers,
                  employees, and viewers — each with exactly the access they
                  need. Every filing is a scoped period: bring an accountant
                  in for a single filing, or keep them on the standing team.
                </Typography>
                <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {["Owner", "Accountant", "Bookkeeper", "Employee", "Viewer"].map((r) => (
                    <Chip key={r} label={r} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
              <Box sx={{ order: { xs: 1, md: 2 } }}>
                <Image
                  src="/illustrations/team.svg"
                  alt="Illustration of a team with defined roles and permissions"
                  width={440}
                  height={300}
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {SHIPPED_PLUMBING.map(([t, d]) => (
                <Card key={t} elevation={0}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {d}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Coming soon: the full cycle, honestly labeled */}
      <Container maxWidth="lg" sx={{ py: 7 }} id="coming">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            gap: 5,
            alignItems: "start",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ScheduleIcon color="primary" />
              <Typography component="h2" variant="h2" sx={{ fontSize: 30 }}>
                The full cycle is coming.
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 520 }}>
              Today the product organizes what you bring it. The roadmap closes
              the loop — money, invoices, and reports moving on their own, with
              a human signing at the end. Each step below is labeled honestly:
              coming soon means coming soon.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Image
                src="/illustrations/bank-flow.svg"
                alt="Illustration of money flowing between bank accounts"
                width={440}
                height={300}
                style={{ width: "100%", height: "auto" }}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {COMING_STEPS.map(([t, d], i) => (
              <Box key={t} sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: 1,
                      borderColor: "primary.main",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Box>
                  {i < COMING_STEPS.length - 1 && <Box sx={{ width: 1, flexGrow: 1, bgcolor: "divider", my: 0.5, minHeight: 14 }} />}
                </Box>
                <Box sx={{ pb: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t}
                    </Typography>
                    <Chip label="Coming soon" size="small" variant="outlined" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {d}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Estonia: compact pilot context */}
      <Box sx={{ bgcolor: "background.paper", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 6 }} id="estonia">
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <AccountBalanceIcon color="primary" sx={{ fontSize: 32, mt: 0.5 }} />
            <Box>
              <Typography component="h2" variant="h2" sx={{ fontSize: 24 }}>
                Piloted in Estonia, where the rails exist.
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 720 }}>
                E-resident owners, EMTA e-services with a working manual path
                today (automated filing later), the Estonian e-invoicing
                standard over Peppol, Mobile-ID and Smart-ID sign-off, and
                annual reports shaped for the e-Business Register. One compact
                reason: this is the market where end-to-end automation is
                realistic first.
              </Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {["E-residency", "EMTA", "E-invoicing (Peppol)", "Mobile-ID / Smart-ID", "Ariregister"].map((t) => (
                  <Chip key={t} label={t} size="small" variant="outlined" color="primary" />
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Pricing */}
      <Box sx={{ bgcolor: "#0B2E1C", color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: 7 }} id="pricing">
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <GroupsIcon sx={{ fontSize: 32, mt: 0.5, color: "#fff" }} />
            <Box>
              <Typography component="h2" variant="h2" sx={{ fontSize: 30, color: "#fff" }}>
                Pay for what you file.
              </Typography>
              <Typography sx={{ mt: 1, color: "#C9D6CE", maxWidth: 560 }}>
                Three modes, picked per business. No seat licences, no
                accountant marketplace cut hidden in the price.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 3, display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
            {[
              ["Pay per report", "One filing, one price. For quiet months."],
              ["Professional fee", "Bring your own accountant per filing."],
              ["Subscription", "All-inclusive tiers for steady volume."],
            ].map(([t, d]) => (
              <Card key={t} elevation={0} sx={{ flex: 1, bgcolor: "#103B25", borderColor: "#1D5233" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>
                    {t}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#C9D6CE" }}>
                    {d}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Button
            component={Link}
            href={primary}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: 4, bgcolor: "#fff", color: "#0B2E1C", "&:hover": { bgcolor: "#E6F3EB" } }}
          >
            {primaryLabel}
          </Button>
          <Divider sx={{ mt: 5, borderColor: "#1D5233" }} />
          <Typography variant="caption" sx={{ mt: 2, display: "block", color: "#C9D6CE" }}>
            AI-assisted drafts — the signing accountant carries statutory responsibility. Manual EMTA/Ariregister
            submission today; automated filing is on the roadmap.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
