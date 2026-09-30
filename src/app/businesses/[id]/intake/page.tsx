"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { ComingSoonButton } from "@/components/ComingSoon";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Filing = { id: string; label: string };

type Extracted = {
  vendor: string | null;
  date: string | null;
  amount: number | null;
  currency: string | null;
  invoiceNumber: string | null;
  viaAI: boolean;
};

export default function IntakePage() {
  const params = useParams<{ id: string }>();
  const [emailBody, setEmailBody] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [filingId, setFilingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Editable candidate fields — the human always confirms before creating.
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const loadFilings = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/filings`);
    if (res.ok) {
      const data = await res.json();
      setFilings(Array.isArray(data) ? data : data.filings ?? []);
    }
  }, [params.id]);

  useEffect(() => {
    loadFilings();
  }, [loadFilings]);

  async function handleExtract() {
    setError(null);
    setDone(null);
    setExtracting(true);
    try {
      const res = await fetch(`/api/businesses/${params.id}/intake/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailBody }),
      });
      if (!res.ok) {
        setError("Could not extract invoice fields");
        return;
      }
      const data = (await res.json()) as Extracted;
      setExtracted(data);
      setVendor(data.vendor ?? "");
      setDate(data.date ?? "");
      setAmount(data.amount != null ? String(data.amount) : "");
      setCurrency(data.currency ?? "EUR");
      setInvoiceNumber(data.invoiceNumber ?? "");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveDocument() {
    setError(null);
    setDone(null);
    setBusy("document");
    try {
      const file = new File(
        [emailBody],
        `pasted-invoice-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}.txt`,
        { type: "text/plain" }
      );
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "INVOICE");
      const res = await fetch(`/api/businesses/${params.id}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        setError("Could not save as document");
        return;
      }
      const doc = await res.json();
      setDone(`Saved as document “${doc.fileName}”. See Documents to review its AI category.`);
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateRevenue() {
    if (!filingId) {
      setError("Pick a filing period first to create a revenue entry");
      return;
    }
    if (!amount || Number.isNaN(Number(amount))) {
      setError("An amount is required to create a revenue entry");
      return;
    }
    setError(null);
    setDone(null);
    setBusy("revenue");
    try {
      const txDate = date ? new Date(`${date}T00:00:00.000Z`).toISOString() : new Date().toISOString();
      const res = await fetch(`/api/businesses/${params.id}/filings/${filingId}/revenue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionDate: txDate,
          amount: Number(amount),
          currency: currency || "EUR",
          description: [invoiceNumber ? `Invoice ${invoiceNumber}` : null, emailBody.slice(0, 200)]
            .filter(Boolean)
            .join(" — "),
          counterpartyNameRaw: vendor || undefined,
        }),
      });
      if (!res.ok) {
        setError("Could not create revenue entry");
        return;
      }
      setDone("Revenue entry created. See the filing's revenue page to generate the invoice.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddRequest() {
    if (!vendor) {
      setError("A counterparty name is required to add a request");
      return;
    }
    setError(null);
    setDone(null);
    setBusy("request");
    try {
      const res = await fetch(`/api/businesses/${params.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterparty: vendor,
          amount: amount && !Number.isNaN(Number(amount)) ? Number(amount) : undefined,
          currency: currency || undefined,
          filingPeriodId: filingId || undefined,
          notes: [invoiceNumber ? `Invoice ${invoiceNumber}` : null, emailBody.slice(0, 300)]
            .filter(Boolean)
            .join(" — "),
        }),
      });
      if (!res.ok) {
        setError("Could not add to the request list");
        return;
      }
      setDone("Added to the invoice request list. Track it on the Requests page.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1">
        Invoice intake
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Paste an invoice email below — the AI suggests the fields, you confirm
        before anything is created.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <ComingSoonButton
          label="Connect inbox automatically"
          title="Automatic email inbox connection"
          description="Connecting your inbox so invoices arrive on their own needs an email provider integration (Gmail/Outlook OAuth) that isn't built yet. Until then, paste the email body here — see PROPOSAL.md."
        />
      </Box>

      <Disclaimer>
        The extracted fields are AI suggestions, not facts. Check them before
        creating a document, revenue entry, or request — responsibility for
        what gets filed rests with the signing accountant.
      </Disclaimer>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {done && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {done}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        minRows={8}
        label="Paste the invoice email body here"
        value={emailBody}
        onChange={(e) => setEmailBody(e.target.value)}
        sx={{ mt: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleExtract}
        disabled={!emailBody.trim() || extracting}
        sx={{ mt: 1.5, minHeight: 48 }}
      >
        {extracting ? "Extracting..." : "Extract invoice fields"}
      </Button>

      {extracted && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="h6" component="h2">
                Candidate fields — confirm before creating
              </Typography>
              <Chip
                size="small"
                color={extracted.viaAI ? "success" : "default"}
                label={extracted.viaAI ? "AI-assisted" : "Heuristic fallback"}
              />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <TextField
                label="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Amount"
                type="number"
                slotProps={{ htmlInput: { step: "0.01" } }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                sx={{ width: 140 }}
              />
              <TextField
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                sx={{ width: 110 }}
              />
              <TextField
                label="Invoice number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 500, mt: 3, mb: 1 }}>
              Filing period (needed for revenue entries; optional for requests)
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={filingId}
              onChange={(e) => setFilingId(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">No filing period</MenuItem>
              {filings.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleSaveDocument}
                disabled={busy !== null}
              >
                {busy === "document" ? "Saving..." : "Create as document"}
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateRevenue}
                disabled={busy !== null}
              >
                {busy === "revenue" ? "Creating..." : "Create as revenue entry"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleAddRequest}
                disabled={busy !== null}
              >
                {busy === "request" ? "Adding..." : "Add to request list"}
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Next:{" "}
              <Link href={`/businesses/${params.id}/documents`}>Documents</Link>
              {" · "}
              <Link href={`/businesses/${params.id}/requests`}>Requests</Link>
              {filingId && (
                <>
                  {" · "}
                  <Link href={`/filings/${filingId}/revenue`}>Filing revenue</Link>
                </>
              )}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
