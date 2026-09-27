"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

export default function NewBusinessPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, registryCode, vatNumber }),
    });

    setLoading(false);
    if (!res.ok) {
      setError("Could not create business");
      return;
    }
    const business = await res.json();
    router.push(`/businesses/${business.id}`);
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Create your business
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You&apos;ll be able to invite your team and accountant next.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Business name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Registry code (Ariregister) — optional"
              value={registryCode}
              onChange={(e) => setRegistryCode(e.target.value)}
              fullWidth
            />
            <TextField
              label="VAT number — optional"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" disabled={loading} variant="contained" fullWidth>
              {loading ? "Creating..." : "Create business"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
