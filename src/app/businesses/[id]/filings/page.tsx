"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FILING_PERIOD_TYPES } from "@/lib/types";
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

type FilingPeriod = {
  id: string;
  label: string;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
};

export default function FilingsPage() {
  const params = useParams<{ id: string }>();
  const [filings, setFilings] = useState<FilingPeriod[]>([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<string>(FILING_PERIOD_TYPES[0]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/filings`);
    if (res.ok) setFilings(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/filings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        type,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
      }),
    });
    if (!res.ok) {
      setError("Could not create filing period");
      return;
    }
    setLabel("");
    setPeriodStart("");
    setPeriodEnd("");
    load();
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Filings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each filing period (a VAT return, an annual report) is where bank
        reconciliation, report drafting, and accountant review/sign-off get
        scoped and tracked.
      </Typography>

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {filings.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
              No filing periods yet
            </Typography>
          )}
          {filings.map((f) => (
            <Box
              key={f.id}
              component={Link}
              href={`/filings/${f.id}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                textDecoration: "none",
                color: "inherit",
                borderTop: filings.indexOf(f) === 0 ? "none" : "1px solid",
                borderColor: "divider",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {f.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {f.type} · {new Date(f.periodStart).toLocaleDateString()} –{" "}
                  {new Date(f.periodEnd).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip size="small" label={f.status} />
            </Box>
          ))}
        </CardContent>
      </Card>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        New filing period
      </Typography>
      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Label, e.g. January 2026 VAT return"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <Select fullWidth value={type} onChange={(e) => setType(e.target.value)}>
          {FILING_PERIOD_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            fullWidth
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" sx={{ minHeight: 48 }}>
          Create filing period
        </Button>
      </Box>
    </Container>
  );
}
