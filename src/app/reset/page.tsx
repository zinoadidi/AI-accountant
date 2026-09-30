"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setSent(true);
      // No email sending anywhere yet (see HANDOFF.md) — the link below is
      // forwarded manually, same as team invitation links.
      setLink(json.token ? `${window.location.origin}/reset/confirm?token=${json.token}` : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Reset password
          </Typography>
          {sent ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              {link ? (
                <>
                  <Alert severity="success">
                    Share this one-hour link with the account owner:
                  </Alert>
                  <Alert severity="info" sx={{ wordBreak: "break-all" }}>
                    {link}
                  </Alert>
                </>
              ) : (
                <Alert severity="success">
                  If that email is registered, a reset link has been prepared — ask the
                  person who manages logins to generate it from this page.
                </Alert>
              )}
              <Link href="/login">Back to log in</Link>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              <TextField
                label="Account email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button type="submit" disabled={loading} variant="contained" fullWidth>
                {loading ? "Preparing..." : "Get reset link"}
              </Button>
              <Link href="/login">Back to log in</Link>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
