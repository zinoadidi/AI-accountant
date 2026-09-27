"use client";

import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DescriptionIcon from "@mui/icons-material/Description";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import DrawIcon from "@mui/icons-material/Draw";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";

// PFD derivation: L0 one decision (Start free); L1 a real KMD draft as the
// hero artifact, not a metaphor; L2 concrete product numbers; L3 Estonian
// specifics (LHV, KMD rows, registry code); L4 CTA resolves the shown story.

const KMD_PREVIEW: [string, string, string][] = [
  ["1", "Standard-rate supply (24%)", "€ 1,204.16"],
  ["2", "Reduced-rate supply", "€ 0.00"],
  ["3", "0% / intra-EU supply", "€ 42.00"],
  ["5", "Deductible input VAT", "€ 118.40"],
  ["8", "Exempt supply", "€ 0.00"],
];

const CLOSING_STEPS = [
  {
    icon: <FileUploadIcon color="primary" />,
    title: "Drop in the month",
    text: "LHV or Stripe CSV plus receipt photos — from your phone camera or your laptop. 35 statement lines import in seconds.",
  },
  {
    icon: <FactCheckIcon color="primary" />,
    title: "Gaps surface themselves",
    text: "Credits without an invoice become NEEDS_INVOICE entries with an AI hint. Debits without a receipt get flagged. Nothing hides.",
  },
  {
    icon: <DescriptionIcon color="primary" />,
    title: "Invoices write themselves",
    text: "Fill in the customer once — or by CSV — and generate INV-2026-0001 from your own company template.",
  },
  {
    icon: <DrawIcon color="primary" />,
    title: "Your accountant signs",
    text: "KMD and annual worksheets pre-filled, INF partners listed, filing sheet downloaded. Filed in EMTA by a human.",
  },
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
            {[
              ["How a month closes", "#month"],
              ["Estonia", "#estonia"],
              ["Pricing", "#pricing"],
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

      <Container maxWidth="lg">
        {/* Hero: thesis left, product artifact right */}
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
              label="Built for Estonian micro-businesses · EMTA manual path"
              color="primary"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 52 }, lineHeight: 1.08 }}>
              Your January KMD, drafted before February starts.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2, maxWidth: 480, fontWeight: 400 }}>
              Receipts, bank statements, and missing invoices reconciled into a
              VAT return your accountant actually signs. No direct EMTA
              connection required.
            </Typography>
            <Box sx={{ mt: 4, display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <Button component={Link} href={primary} variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                {primaryLabel}
              </Button>
              <Button component={Link} href="#month" variant="outlined" size="large">
                See how a month closes
              </Button>
            </Box>
            <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
              {["Accountant signs, not the model", "Mobile-ID ready", "7-year audit trail"].map((t) => (
                <Box key={t} sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                  <CheckIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {t}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* The artifact: a real KMD draft, not a metaphor */}
          <Card elevation={0}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 3, pt: 2.5, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  KMD DRAFT · JANUARY 2026 · OÜ EXAMPLE (16066981)
                </Typography>
                <Chip label="Draft" size="small" color="primary" />
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={48}>Row</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {KMD_PREVIEW.map(([row, desc, amt]) => (
                    <TableRow key={row}>
                      <TableCell sx={{ fontWeight: 700 }}>{row}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {amt}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  From 8 reconciled credits · INF partners ≥ €1,000 listed · download the filing sheet for EMTA
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>

      <Box sx={{ bgcolor: "background.paper", borderY: 1, borderColor: "divider" }}>
        <Container maxWidth="lg" sx={{ py: 7 }} id="month">
          <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
            How a month closes
          </Typography>
          <Typography variant="h2" sx={{ fontSize: 30, mt: 1, mb: 4, maxWidth: 560 }}>
            Four steps. The third one is where months usually die.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            {CLOSING_STEPS.map((s, i) => (
              <Card key={s.title} elevation={0}>
                <CardContent sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ mt: 0.5 }}>{s.icon}</Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {i + 1}. {s.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {s.text}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 7 }} id="estonia">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 5, alignItems: "center" }}>
          <Box>
            <AccountBalanceIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h2" sx={{ fontSize: 30, mt: 1 }}>
              Estonian rails, not a translated template.
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              LHV and Stripe statement formats parsed natively. KMD rows 1–11
              with the 24% standard rate. Per-partner INF totals. Annual report
              shaped for Ariregister. Mobile-ID and Smart-ID sign-off where the
              accountant&apos;s pen lands.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[
              ["LHV / Stripe CSV import", "Real formats, verified on real statements"],
              ["KMD worksheet, rows 1–11", "Pre-filled, accountant-editable, printable"],
              ["Annual report worksheet", "Revenue, bank flow, profit hints"],
              ["Per-filing accountant access", "Invite for one filing or the whole team"],
            ].map(([t, d]) => (
              <Box key={t}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {d}
                </Typography>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: "#0B2E1C", color: "#fff" }}>
        <Container maxWidth="lg" sx={{ py: 7 }} id="pricing">
          <Typography variant="h2" sx={{ fontSize: 30, color: "#fff" }}>
            Pay for what you file.
          </Typography>
          <Typography sx={{ mt: 1, color: "#C9D6CE", maxWidth: 560 }}>
            Three modes, picked per business. No seat licences, no accountant
            marketplace cut hidden in the price.
          </Typography>
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
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="caption" color="text.secondary">
          AI-assisted drafts — the signing accountant carries statutory responsibility. Manual EMTA/Ariregister
          submission; automated X-tee filing is on the roadmap.
        </Typography>
      </Container>
    </Box>
  );
}
