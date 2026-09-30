"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ComingSoonButton } from "@/components/ComingSoon";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Statement = {
  id: string;
  fileName: string;
  source?: string | null;
  txCount?: number | null;
  createdAt: string;
};

type Filing = { id: string; label: string };

type ReconcileResult = {
  matched?: number;
  created?: number;
  unmatchedDebits?: unknown[] | number;
  needsAttention?: unknown[] | number;
  [k: string]: unknown;
};

function countOf(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.length;
  return null;
}

function listOf(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) =>
    typeof x === "string" ? x : JSON.stringify(x).slice(0, 160)
  );
}

export default function StatementsPage() {
  const params = useParams<{ id: string }>();
  const [statements, setStatements] = useState<Statement[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ReconcileResult>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [sRes, fRes] = await Promise.all([
      fetch(`/api/businesses/${params.id}/statements`),
      fetch(`/api/businesses/${params.id}/filings`),
    ]);
    if (sRes.ok) {
      const data = await sRes.json();
      setStatements(Array.isArray(data) ? data : data.statements ?? []);
    }
    if (fRes.ok) {
      const data = await fRes.json();
      setFilings(Array.isArray(data) ? data : data.filings ?? []);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/businesses/${params.id}/statements`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      setError("Statement upload failed");
      return;
    }
    load();
  }

  async function reconcile(statementId: string) {
    const filingPeriodId = selected[statementId];
    if (!filingPeriodId) return;
    setBusy(statementId);
    const res = await fetch(
      `/api/businesses/${params.id}/statements/${statementId}/reconcile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingPeriodId }),
      }
    );
    setBusy(null);
    if (!res.ok) {
      setResults((r) => ({ ...r, [statementId]: { error: "Reconcile failed" } }));
      return;
    }
    const data = await res.json();
    setResults((r) => ({ ...r, [statementId]: data }));
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Typography variant="h4" component="h1">
        Bank statements
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Upload a bank CSV, pick a filing period, and reconcile it against your
        documents and revenue.
      </Typography>

      <Box sx={{ mb: 2 }}>
        <ComingSoonButton
          label="Connect bank automatically (live sync)"
          title="Live bank connection"
          description="Automatic transaction sync via an open-banking aggregator (e.g. GoCardless/Nordigen, LHV first) isn't connected yet. Until then, uploading a CSV statement below is the working path — see PROPOSAL.md Phase 1."
        />
      </Box>

      <Button
        variant="outlined"
        component="label"
        fullWidth
        disabled={uploading}
        sx={{ minHeight: 56, fontSize: "1rem", borderStyle: "dashed" }}
      >
        {uploading ? "Uploading..." : "Upload CSV statement"}
        <input type="file" accept=".csv" hidden onChange={handleUpload} disabled={uploading} />
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {statements.length === 0 ? (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No statements yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mt: 3, display: "grid", gap: 1.5 }}>
          {statements.map((s) => {
            const r = results[s.id];
            return (
              <Card key={s.id} variant="outlined">
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
                      {s.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[s.source, s.txCount != null ? `${s.txCount} txns` : null, new Date(s.createdAt).toLocaleDateString()]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      mt: 1.5,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                    }}
                  >
                    <Select
                      fullWidth
                      displayEmpty
                      value={selected[s.id] ?? ""}
                      onChange={(e) => setSelected((m) => ({ ...m, [s.id]: e.target.value }))}
                    >
                      <MenuItem value="">Select filing period</MenuItem>
                      {filings.map((f) => (
                        <MenuItem key={f.id} value={f.id}>
                          {f.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      onClick={() => reconcile(s.id)}
                      disabled={!selected[s.id] || busy === s.id}
                      sx={{ minHeight: 48, minWidth: { sm: 140 } }}
                    >
                      {busy === s.id ? "Reconciling..." : "Reconcile"}
                    </Button>
                  </Box>
                  {r && (
                    <Card variant="outlined" sx={{ mt: 1.5, bgcolor: "grey.50" }}>
                      <CardContent>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {countOf(r.matched) != null && (
                            <Chip size="small" color="success" label={`matched: ${countOf(r.matched)}`} />
                          )}
                          {countOf(r.created) != null && (
                            <Chip size="small" color="info" label={`created: ${countOf(r.created)}`} />
                          )}
                          {countOf(r.unmatchedDebits) != null && (
                            <Chip size="small" color="warning" label={`unmatched debits: ${countOf(r.unmatchedDebits)}`} />
                          )}
                          {countOf(r.needsAttention) != null && (
                            <Chip size="small" color="error" label={`needs attention: ${countOf(r.needsAttention)}`} />
                          )}
                        </Box>
                        {listOf(r.unmatchedDebits).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Unmatched debits
                            </Typography>
                            <Box component="ul" sx={{ ml: 2, color: "text.secondary" }}>
                              {listOf(r.unmatchedDebits).map((x, i) => (
                                <li key={i}>
                                  <Typography variant="body2">{x}</Typography>
                                </li>
                              ))}
                            </Box>
                          </Box>
                        )}
                        {listOf(r.needsAttention).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              Needs attention
                            </Typography>
                            <Box component="ul" sx={{ ml: 2, color: "text.secondary" }}>
                              {listOf(r.needsAttention).map((x, i) => (
                                <li key={i}>
                                  <Typography variant="body2">{x}</Typography>
                                </li>
                              ))}
                            </Box>
                          </Box>
                        )}
                        {selected[s.id] && (
                          <Link href={`/filings/${selected[s.id]}`}>
                            <Typography variant="body2" sx={{ mt: 1, textDecoration: "underline" }}>
                              Open filing revenue
                            </Typography>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Container>
  );
}
