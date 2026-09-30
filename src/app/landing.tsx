"use client";

import { useState } from "react";
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
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Slider from "@mui/material/Slider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

// Design plan (frontend-design skill, reviewed against the brief):
// - Palette: ledger-green system — primary #0B6B3A, dark band #0B2E1C,
//   paper #F4F6F4, ink #10231A. Coming-soon honesty via outlined chips.
// - Type: distinctive display serif (Fraunces → Georgia → Times fallback,
//   never Inter/Roboto) for H1/H2; system sans for body. Dramatic scale:
//   H1 clamp(2.9rem,7vw,5.2rem), H2 clamp(1.8rem,4vw,2.7rem).
// - Layout: left-aligned editorial, asymmetric hero (1.15fr / 0.85fr with
//   a tilted ledger card), staggered 3-step row, offset savings panel.
// - Restraint: ONE orchestrated page-load rise (CSS only, reduced-motion
//   off-switch), one dark band (pricing + final CTA), no scroll-reveal
//   choreography, no gradient washes, no SaaS-card grid.

const DISPLAY = '"Fraunces", Georgia, "Iowan Old Style", "Times New Roman", serif';

const FAQS: [string, string][] = [
  [
    "Do I still need an accountant?",
    "Not on payroll. An accountant reviews each filing and signs — you never chase one monthly.",
  ],
  [
    "What do I actually file?",
    "Monthly TSD payroll, KMD VAT as one line of the month, a one-page overview — plus the yearly report.",
  ],
  [
    "How do reports reach EMTA?",
    "As a ready-to-submit package you file manually today. Automated filing is coming soon.",
  ],
  [
    "What happens to my documents?",
    "Receipts, statements and invoices stay linked to every line, kept for the 7-year audit trail.",
  ],
  [
    "What does it cost?",
    "Three early-pricing modes below — pick per business. No seats, no hidden cuts.",
  ],
];

export function Landing({ authed }: { authed: boolean }) {
  const primary = authed ? "/businesses" : "/signup";
  const primaryLabel = authed ? "Go to your businesses" : "Start filing";
  const [hours, setHours] = useState(8);

  // Estimates only — labelled as such in the UI.
  const manualYear = hours * 12 * 25 + 2400;
  const aiYear = hours * 12 * 25 * 0.15 + 600;
  const saved = Math.max(0, manualYear - aiYear);

  return (
    <Box component="main">
      <style>{`
        @keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .rise { animation: rise .7s ease both; }
        .rise-2 { animation: rise .7s .12s ease both; }
        .rise-3 { animation: rise .7s .24s ease both; }
        .tilt { transform: rotate(1.6deg); }
        @media (prefers-reduced-motion: reduce) { .rise, .rise-2, .rise-3 { animation: none; } .tilt { transform: none; } }
      `}</style>

      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ maxWidth: 1120, width: "100%", mx: "auto", gap: 1 }}>
          <ReceiptLongIcon color="primary" aria-hidden />
          <Typography variant="subtitle1" sx={{ mr: 3, fontWeight: 750 }}>
            AI Accountant
          </Typography>
          <Box component="nav" aria-label="Sections" sx={{ display: { xs: "none", md: "flex" }, gap: 3, flexGrow: 1 }}>
            {[
              ["How it works", "#how"],
              ["Coverage", "#coverage"],
              ["Savings", "#savings"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
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

      {/* Hero */}
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            gap: 6,
            alignItems: "center",
            pt: { xs: 6, md: 10 },
            pb: 7,
          }}
        >
          <Box className="rise">
            <Chip label="Estonia pilot · small business owners" variant="outlined" color="primary" sx={{ mb: 2 }} />
            <Typography
              component="h1"
              sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(2.9rem,7vw,5.2rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              Every report filed. No accountant on payroll.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2, maxWidth: 560, fontWeight: 400 }}>
              The accounting back-office for small business owners who need every report filed — without an
              accountant on payroll.
            </Typography>
            <Box sx={{ mt: 4, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <Button component={Link} href={primary} variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                {primaryLabel}
              </Button>
              <Button component={Link} href="#how" variant="outlined" size="large">
                See how it works
              </Button>
            </Box>
          </Box>

          <Card elevation={0} className="rise-2 tilt" sx={{ border: 1, borderColor: "divider" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  January close · OÜ Example
                </Typography>
                <Chip label="3 reports" size="small" color="primary" />
              </Box>
              {[
                ["Payroll (TSD)", "Ready"],
                ["VAT (KMD)", "Draft"],
                ["Overview", "Ready"],
              ].map(([t, s]) => (
                <Box key={t} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t}
                  </Typography>
                  <Chip label={s} size="small" variant="outlined" color="primary" />
                </Box>
              ))}
              <Typography variant="caption" color="text.secondary">
                Twelve closed months become the yearly report.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Pain strip */}
      <Box sx={{ bgcolor: "#F4F6F4", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
            {[
              "No rhythm — deadlines arrive as panic.",
              "Payroll cost for work that repeats monthly.",
              "Receipts scattered across inbox, shoebox, spreadsheets.",
            ].map((t) => (
              <Typography key={t} sx={{ fontFamily: DISPLAY, fontSize: "1.25rem", lineHeight: 1.3 }}>
                {t}
              </Typography>
            ))}
          </Box>
        </Container>
      </Box>

      {/* How it works */}
      <Container maxWidth="lg" sx={{ py: 7 }} id="how">
        <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>
          Receipts in. Reports out.
        </Typography>
        <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
          {[
            ["1. Upload or connect", "Drop receipts, statements, invoices. Bank sync — coming soon.", null] as const,
            ["2. AI books + reconciles", "Lines matched, gaps flagged, drafts prepared.", null] as const,
            ["3. Accountant reviews, you file", "They sign. You submit the ready package.", "Works today"] as const,
          ].map(([t, d, chip], i) => (
            <Card key={t} elevation={0} className={i === 1 ? "rise-3" : undefined} sx={{ border: 1, borderColor: "divider", mt: { md: i === 1 ? 4 : 0 } }}>
              <CardContent>
                <Typography component="h3" variant="h6" sx={{ fontWeight: 700 }}>
                  {t}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {d}
                </Typography>
                {chip ? (
                  <Chip label={chip} size="small" variant="outlined" color="primary" sx={{ mt: 1.5 }} />
                ) : (
                  <Chip label="Coming soon on connects" size="small" variant="outlined" sx={{ mt: 1.5 }} />
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
        <Box sx={{ mt: 4, maxWidth: 560 }}>
          <Image
            src="/illustrations/ai-documents.svg"
            alt="AI sorting uploaded business documents"
            width={560}
            height={340}
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Container>

      {/* Coverage strip */}
      <Box sx={{ bgcolor: "#F4F6F4", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 6 }} id="coverage">
          <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>
            Monthly rhythm. Yearly done.
          </Typography>
          <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr" }, gap: 2 }}>
            {[
              ["Payroll · TSD", "Salaries collected monthly."],
              ["VAT · KMD", "One line of the month, not the headline."],
              ["Overview", "Income, expenses, who owes whom."],
              ["Annual report", "Built from twelve closed months."],
            ].map(([t, d]) => (
              <Box key={t} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {d}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 3, maxWidth: 520 }}>
            <Image
              src="/illustrations/month-organized.svg"
              alt="Organized monthly reporting workflow"
              width={520}
              height={290}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Container>
      </Box>

      {/* Savings math */}
      <Container maxWidth="lg" sx={{ py: 7 }} id="savings">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" }, gap: 5, alignItems: "center" }}>
          <Box>
            <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>
              Payroll accountants cost. Late filings cost more.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              Drag the slider. EMTA charges 0.06% per day on late tax — automation removes the panic.
            </Typography>
          </Box>
          <Card elevation={0} sx={{ border: 1, borderColor: "divider", ml: { md: 4 } }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Your bookkeeping hours per month: {hours}h
              </Typography>
              <Slider
                value={hours}
                onChange={(_, v) => setHours(v as number)}
                min={2}
                max={20}
                step={1}
                aria-label="Bookkeeping hours per month"
              />
              <Box sx={{ display: "flex", gap: 3, mt: 1, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Manual year (estimate)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    €{manualYear.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    With AI Accountant (estimate)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }} color="primary">
                    €{aiYear.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    You keep (estimate)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    €{saved.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                Estimates for illustration, Estonia pilot. Assumes €25/h + ~€2,400/yr accountant cost.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Coming soon — one compact strip */}
      <Box sx={{ bgcolor: "#0B2E1C", color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" } }}>
            <Box sx={{ minWidth: { md: 260 } }}>
              <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "1.7rem" }}>
                Full cycle, next.
              </Typography>
              <Typography variant="body2" sx={{ color: "#C9D6CE", mt: 1 }}>
                Today you bring documents. Soon the loop closes itself.
              </Typography>
              <Box sx={{ mt: 2, maxWidth: 260 }}>
                <Image
                  src="/illustrations/bank-flow.svg"
                  alt="Money flowing between connected bank accounts"
                  width={260}
                  height={170}
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", flexGrow: 1 }}>
              {[
                ["Bank sync", "Statements flow in alone."],
                ["Inbox auto-detect", "Invoices caught on arrival."],
                ["Invoice requests", "Missing docs chased for you."],
                ["One-click payments", "Pay from the reconciled month."],
              ].map(([t, d]) => (
                <Box key={t} sx={{ flex: "1 1 200px", border: 1, borderColor: "#1D5233", borderRadius: 2, p: 2, bgcolor: "#103B25" }}>
                  <Chip label="Coming soon" size="small" variant="outlined" sx={{ color: "#fff", borderColor: "#5A8A6E", mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#C9D6CE" }}>
                    {d}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Pricing */}
      <Container maxWidth="lg" sx={{ py: 7 }} id="pricing">
        <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>
          Pay for what you file.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          No seats. No hard numbers yet — early pricing.
        </Typography>
        <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          {[
            ["Pay per report", "One filing, one price. Quiet months stay quiet."],
            ["Professional fee", "Bring your accountant per filing."],
            ["Subscription", "All-inclusive for steady volume."],
          ].map(([t, d]) => (
            <Card key={t} elevation={0} sx={{ border: 1, borderColor: "divider" }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {d}
                </Typography>
                <Chip label="Early pricing" size="small" variant="outlined" color="primary" sx={{ mt: 1.5 }} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* FAQ */}
      <Box sx={{ bgcolor: "#F4F6F4", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="md" sx={{ py: 6 }} id="faq">
          <Typography component="h2" sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.7rem)" }}>
            Asked already.
          </Typography>
          <Box sx={{ mt: 3 }}>
            {FAQS.map(([q, a]) => (
              <Accordion key={q} elevation={0} sx={{ border: 1, borderColor: "divider", mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Final CTA + footer */}
      <Box sx={{ bgcolor: "#0B2E1C", color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: 7, textAlign: "left" }}>
          <Typography sx={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: "clamp(2rem,5vw,3.4rem)", lineHeight: 1.05 }}>
            File next month in minutes.
          </Typography>
          <Button
            component={Link}
            href={primary}
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{ mt: 3, bgcolor: "#fff", color: "#0B2E1C", "&:hover": { bgcolor: "#E6F3EB" } }}
          >
            {primaryLabel}
          </Button>
          <Box
            component="footer"
            sx={{ mt: 6, pt: 2, borderTop: 1, borderColor: "#1D5233", display: "flex", gap: 2, flexWrap: "wrap" }}
          >
            <Typography variant="caption" sx={{ color: "#C9D6CE" }}>
              AI Accountant · Estonia pilot
            </Typography>
            <Typography variant="caption" sx={{ color: "#C9D6CE" }}>
              AI-assisted drafts — the signing accountant carries statutory responsibility.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
