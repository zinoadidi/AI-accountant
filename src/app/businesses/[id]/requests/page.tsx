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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Filing = { id: string; label: string };

type InvoiceRequest = {
  id: string;
  filingPeriodId: string | null;
  counterparty: string;
  amount: number | null;
  currency: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

type RevenueEntry = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: string;
  description: string | null;
  counterpartyNameRaw: string | null;
  customerName: string | null;
  status: string;
};

const NEXT_STATUS: Record<string, string | null> = {
  REQUESTED: "SENT",
  SENT: "RECEIVED",
  RECEIVED: null,
};

const STATUS_COLOR: Record<string, "warning" | "info" | "success"> = {
  REQUESTED: "warning",
  SENT: "info",
  RECEIVED: "success",
};

export default function RequestsPage() {
  const params = useParams<{ id: string }>();
  const [requests, setRequests] = useState<InvoiceRequest[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [missing, setMissing] = useState<RevenueEntry[]>([]);
  const [filingId, setFilingId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [rRes, fRes] = await Promise.all([
      fetch(`/api/businesses/${params.id}/requests`),
      fetch(`/api/businesses/${params.id}/filings`),
    ]);
    if (rRes.ok) setRequests(await rRes.json());
    if (fRes.ok) {
      const data = await fRes.json();
      setFilings(Array.isArray(data) ? data : data.filings ?? []);
    }
  }, [params.id]);

  const loadMissing = useCallback(
    async (fid: string) => {
      if (!fid) {
        setMissing([]);
        return;
      }
      const res = await fetch(`/api/businesses/${params.id}/filings/${fid}/revenue`);
      if (res.ok) {
        const entries = (await res.json()) as RevenueEntry[];
        setMissing(entries.filter((e) => e.status === "NEEDS_INVOICE"));
      }
    },
    [params.id]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadMissing(filingId);
  }, [filingId, loadMissing]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counterparty,
        amount: amount ? Number(amount) : undefined,
        filingPeriodId: filingId || undefined,
        notes: notes || undefined,
      }),
    });
    if (!res.ok) {
      setError("Could not create request");
      return;
    }
    setCounterparty("");
    setAmount("");
    setNotes("");
    load();
  }

  async function handleAdvance(item: InvoiceRequest) {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    await fetch(`/api/businesses/${params.id}/requests/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/businesses/${params.id}/requests/${id}`, { method: "DELETE" });
    load();
  }

  async function handleRequestFor(entry: RevenueEntry) {
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counterparty: entry.counterpartyNameRaw || entry.customerName || entry.description || "Unknown payer",
        amount: entry.amount,
        currency: entry.currency,
        filingPeriodId: filingId || undefined,
        notes: `Requested from the missing-invoice list (${new Date(entry.transactionDate).toLocaleDateString()} · ${entry.amount.toFixed(2)} ${entry.currency})`,
      }),
    });
    if (!res.ok) {
      setError("Could not create request");
      return;
    }
    load();
  }

  const filingLabel = (fid: string | null) =>
    fid ? filings.find((f) => f.id === fid)?.label ?? fid.slice(0, 8) : "—";

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1">
        Invoice requests
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Track invoices you are still waiting on — request them, mark when sent
        and received. Paste new invoice emails on the{" "}
        <Link href={`/businesses/${params.id}/intake`}>intake page</Link>.
      </Typography>

      <Disclaimer>
        Requesting and chasing invoices is a manual bookkeeping step here; the
        automatic follow-up path is not built yet. Nothing is sent
        automatically — every status change below is your own record.
      </Disclaimer>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1 }}>
        Missing invoices — revenue entries still needing one
      </Typography>
      <Select
        fullWidth
        displayEmpty
        value={filingId}
        onChange={(e) => setFilingId(e.target.value)}
        sx={{ mb: 1.5 }}
      >
        <MenuItem value="">Select a filing period to see its missing invoices</MenuItem>
        {filings.map((f) => (
          <MenuItem key={f.id} value={f.id}>
            {f.label}
          </MenuItem>
        ))}
      </Select>
      {filingId && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            {missing.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                Nothing missing — every entry in this filing either has an
                invoice or was marked as not needing one.
              </Typography>
            )}
            {missing.map((e, i) => (
              <Box
                key={e.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderTop: i === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">
                  {e.counterpartyNameRaw || e.customerName || e.description || "Unknown payer"} ·{" "}
                  {e.amount.toFixed(2)} {e.currency} ·{" "}
                  {new Date(e.transactionDate).toLocaleDateString()}
                </Typography>
                <Button size="small" variant="outlined" onClick={() => handleRequestFor(e)}>
                  Request invoice
                </Button>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Request list
      </Typography>
      {requests.length === 0 ? (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No requests yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5, mb: 3 }}>
          {requests.map((r) => (
            <Card key={r.id} variant="outlined">
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {r.counterparty}
                    {r.amount != null && (
                      <Typography variant="body2" component="span" color="text.secondary">
                        {" "}
                        · {r.amount.toFixed(2)} {r.currency ?? ""}
                      </Typography>
                    )}
                  </Typography>
                  <Chip size="small" color={STATUS_COLOR[r.status] ?? "default"} label={r.status} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Filing: {filingLabel(r.filingPeriodId)} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </Typography>
                {r.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {r.notes}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  {NEXT_STATUS[r.status] && (
                    <Button size="small" variant="contained" onClick={() => handleAdvance(r)}>
                      Mark as {NEXT_STATUS[r.status]!.toLowerCase()}
                    </Button>
                  )}
                  <Button size="small" color="inherit" onClick={() => handleDelete(r.id)}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        New request
      </Typography>
      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <TextField
          placeholder="Counterparty (who owes the invoice)"
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
          required
          sx={{ flexGrow: 1, minWidth: 220 }}
        />
        <TextField
          type="number"
          slotProps={{ htmlInput: { step: "0.01" } }}
          placeholder="Amount (optional)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ width: 160 }}
        />
        <TextField
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
        />
        <Button type="submit" variant="contained" sx={{ minHeight: 48 }}>
          Add request
        </Button>
      </Box>
    </Container>
  );
}
