"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";

type Boxes = Record<string, number | null>;

const KMD_ROWS: { key: string; label: string; hint: string }[] = [
  { key: "1", label: "1 · Standard-rate (24%) supply", hint: "Prefilled from generated invoices" },
  { key: "2", label: "2 · Reduced-rate (9%/5%) supply", hint: "Manual" },
  { key: "3", label: "3 · 0% / intra-EU supply", hint: "Manual" },
  { key: "4.1", label: "4.1 · Import VAT on KMD", hint: "Manual, mirrors to input VAT" },
  { key: "5", label: "5 · Deductible input VAT", hint: "Manual — see expense hint" },
  { key: "5.1", label: "5.1 · of which on imports", hint: "Manual" },
  { key: "5.3", label: "5.3 · Car VAT 100%", hint: "Manual" },
  { key: "5.4", label: "5.4 · Car VAT 50%", hint: "Manual" },
  { key: "6", label: "6 · Reverse charge, intra-EU goods+services", hint: "Manual" },
  { key: "6.1", label: "6.1 · Reverse charge, intra-EU goods", hint: "Manual" },
  { key: "7", label: "7 · Other reverse charge", hint: "Manual" },
  { key: "8", label: "8 · Exempt supply", hint: "Manual" },
  { key: "10", label: "10 · Adjustment increasing input VAT", hint: "Manual" },
  { key: "11", label: "11 · Adjustment decreasing input VAT", hint: "Manual" },
];

const ANNUAL_ROWS: { key: string; label: string; hint: string }[] = [
  { key: "revenue", label: "Revenue", hint: "Prefilled from generated invoices" },
  { key: "bankIn", label: "Bank inflow (statements)", hint: "Prefilled" },
  { key: "bankOut", label: "Bank outflow (statements)", hint: "Prefilled" },
  { key: "expenses", label: "Operating expenses", hint: "Manual" },
  { key: "cash", label: "Cash at bank, period end", hint: "Manual" },
];

export default function ReportsPage() {
  const params = useParams<{ filingId: string }>();
  const [kind, setKind] = useState<"KMD" | "ANNUAL">("KMD");
  const [businessId, setBusinessId] = useState("");
  const [label, setLabel] = useState("");
  const [computed, setComputed] = useState<Record<string, unknown>>({});
  const [boxes, setBoxes] = useState<Boxes>({});
  const [canEdit, setCanEdit] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const filingRes = await fetch(`/api/filings/${params.filingId}`);
    if (!filingRes.ok) {
      setError("Filing not found or no access.");
      return;
    }
    const filing = await filingRes.json();
    setBusinessId(filing.businessId);
    setLabel(filing.label);
    setCanEdit(["OWNER", "ACCOUNTANT", "BOOKKEEPER"].includes(filing.accessRole));
    const res = await fetch(
      `/api/businesses/${filing.businessId}/filings/${params.filingId}/reports?kind=${kind}`
    );
    if (!res.ok) {
      setError("Could not load report.");
      return;
    }
    const data = await res.json();
    setComputed(data.computed ?? {});
    const drafts = (data.drafts ?? []) as { reportKind: string; boxes: Boxes }[];
    setBoxes(drafts.find((d) => d.reportKind === kind)?.boxes ?? {});
    setSaved(false);
  }, [params.filingId, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const prefill: Record<string, number> =
    kind === "KMD"
      ? {
          "1": Number(computed.line1Base ?? 0),
          "2": Number(computed.line2Base ?? 0),
          "3": Number(computed.line3Base ?? 0),
        }
      : {
          revenue: Number(computed.revenue ?? 0),
          bankIn: Number(computed.bankIn ?? 0),
          bankOut: Number(computed.bankOut ?? 0),
        };

  const value = (key: string) => boxes[key] ?? prefill[key] ?? 0;

  async function handleSave() {
    if (!businessId) return;
    setError(null);
    const res = await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/reports`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, boxes }),
    });
    if (!res.ok) setError("Could not save.");
    else setSaved(true);
  }

  function downloadSheet() {
    if (!businessId) return;
    window.open(
      `/api/businesses/${businessId}/filings/${params.filingId}/reports/export?kind=${kind}`,
      "_blank"
    );
  }

  const rows = kind === "KMD" ? KMD_ROWS : ANNUAL_ROWS;
  const infPartners = (computed.infPartners ?? []) as { name: string; total: number }[];

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        <Link href={`/filings/${params.filingId}`}>← {label || "Filing"}</Link>
      </Typography>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        Reports — fill for EMTA
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Fill these in the app, then copy the figures into EMTA (KMD) or
        Ariregister (annual report) yourself. No direct connection needed.
      </Typography>

      <Tabs
        value={kind}
        onChange={(_, v) => setKind(v)}
        sx={{ mb: 3 }}
        aria-label="Report kind"
      >
        <Tab value="KMD" label="Monthly · KMD (VAT)" />
        <Tab value="ANNUAL" label="Yearly · Annual report" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {rows.map((row, i) => (
            <Box
              key={row.key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderTop: i === 0 ? "none" : "1px solid",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {row.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.hint}
                </Typography>
              </Box>
              <TextField
                type="number"
                slotProps={{ htmlInput: { step: "0.01" } }}
                disabled={!canEdit}
                value={value(row.key)}
                onChange={(e) =>
                  setBoxes((b) => ({ ...b, [row.key]: e.target.value === "" ? null : Number(e.target.value) }))
                }
                sx={{ width: 144, "& input": { textAlign: "right" } }}
              />
            </Box>
          ))}
        </CardContent>
      </Card>

      {kind === "KMD" && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              KMD INF annex — partners ≥ €1,000
            </Typography>
            {infPartners.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                None this period.
              </Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                {infPartners.map((p) => (
                  <Box
                    key={p.name}
                    component="li"
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.5 }}
                  >
                    <Typography variant="body2">{p.name}</Typography>
                    <Typography variant="body2">€{p.total.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {Number(computed.expenseDocCount ?? 0) > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Input-VAT hint: {String(computed.expenseDocCount)} expense documents on file,
                suggested total €{Number(computed.expenseHintTotal ?? 0).toFixed(2)} — verify
                deductible VAT per invoice before copying to row 5.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {kind === "ANNUAL" && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Profit hint: €{(value("revenue") - value("expenses")).toFixed(2)} (revenue −
              expenses). {String(computed.expenseDocs ?? 0)} expense documents on file ·{" "}
              {String(computed.outstandingInvoices ?? 0)} open revenue entries (receivables
              hint).
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Copy into the Ariregister annual-report environment — the micro-entity
              schema may ask for these figures split further.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Disclaimer>
        These are AI-assisted drafts. Statutory responsibility for what gets filed
        rests with the signing accountant — verify every figure against source
        documents before submitting in EMTA/Ariregister.
      </Disclaimer>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
        {canEdit && (
          <Button type="button" variant="contained" onClick={handleSave} sx={{ minHeight: 48 }}>
            Save draft
          </Button>
        )}
        <Button type="button" variant="outlined" onClick={downloadSheet} sx={{ minHeight: 48 }}>
          Download filing sheet
        </Button>
      </Box>
      {saved && (
        <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
          Draft saved.
        </Typography>
      )}
    </Container>
  );
}
