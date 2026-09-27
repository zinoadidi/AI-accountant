"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ComingSoonButton } from "@/components/ComingSoon";
import { PRICING_MODES, type PricingMode } from "@/lib/types";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

const PLAN_COPY: Record<PricingMode, { title: string; description: string }> = {
  PAY_PER_REPORT: {
    title: "Pay per report",
    description: "No commitment — pay each time a report or filing is generated.",
  },
  PROFESSIONAL_FEE: {
    title: "Order a professional",
    description:
      "Order a vetted accountant for a specific filing through the marketplace; pay their fee per engagement.",
  },
  SUBSCRIPTION: {
    title: "Subscription",
    description: "One monthly plan, tiered by volume, covering everything.",
  },
};

export default function BillingPage() {
  const params = useParams<{ id: string }>();
  const [pricingMode, setPricingMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses`);
    if (res.ok) {
      const businesses = await res.json();
      const business = businesses.find((b: { id: string; pricingMode: string | null }) => b.id === params.id);
      setPricingMode(business?.pricingMode ?? null);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function choosePlan(mode: PricingMode) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/pricing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricingMode: mode }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not update plan");
      return;
    }
    setPricingMode(mode);
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Billing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Choose how this business pays. You can switch modes any time — this
        picks the mode, it doesn&apos;t charge a card yet (see below).
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        {PRICING_MODES.map((mode) => {
          const copy = PLAN_COPY[mode];
          const selected = pricingMode === mode;
          return (
            <Card
              key={mode}
              component="button"
              type="button"
              onClick={() => choosePlan(mode)}
              disabled={saving}
              sx={{
                textAlign: "left",
                cursor: "pointer",
                borderColor: selected ? "primary.main" : undefined,
                borderWidth: selected ? 2 : undefined,
                opacity: saving ? 0.6 : 1,
                font: "inherit",
                p: 0,
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography variant="h6" component="h2">
                    {copy.title}
                  </Typography>
                  {selected && <Chip label="Selected" size="small" color="primary" />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {copy.description}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ComingSoonButton
        label="Pay & activate"
        title="Payment processing"
        description="Card/bank payment processing for whichever plan you've selected isn't wired up yet — the plan choice above is saved so billing can be enabled without asking again."
      />
    </Container>
  );
}
