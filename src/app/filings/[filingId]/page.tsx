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
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Engagement = {
  id: string;
  email: string;
  status: string;
  accountant: { name: string; email: string } | null;
};

type FilingPeriod = {
  id: string;
  businessId: string;
  business: { id: string; name: string };
  label: string;
  type: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  engagements: Engagement[];
  accessRole: string;
  viaEngagement: boolean;
};

export default function FilingDetailPage() {
  const params = useParams<{ filingId: string }>();
  const [filing, setFiling] = useState<FilingPeriod | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastEngagementLink, setLastEngagementLink] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    // filing.businessId isn't known before the first load, so this route is
    // reached via a business-scoped API path once we have it.
    const res = await fetch(`/api/filings/${params.filingId}`);
    if (res.status === 403 || res.status === 404) {
      setNotFound(true);
      return;
    }
    if (res.ok) setFiling(await res.json());
  }, [params.filingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!filing) return;
    setError(null);
    const res = await fetch(
      `/api/businesses/${filing.businessId}/filings/${filing.id}/engagements`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    if (!res.ok) {
      setError("Could not send engagement invite");
      return;
    }
    const engagement = await res.json();
    setLastEngagementLink(`${window.location.origin}/engagements/accept?token=${engagement.token}`);
    setEmail("");
    load();
  }

  function handleDownload() {
    if (!filing) return;
    const contents = [
      `${filing.business.name} — ${filing.label}`,
      `Type: ${filing.type}`,
      `Period: ${new Date(filing.periodStart).toLocaleDateString()} – ${new Date(filing.periodEnd).toLocaleDateString()}`,
      `Status: ${filing.status}`,
      "",
      "This is a placeholder export. Bank reconciliation, invoice matching,",
      "and the actual KMD/annual-report data package are not yet implemented",
      "— see PROPOSAL.md for the roadmap.",
    ].join("\n");
    const blob = new Blob([contents], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filing.label.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleStatusChange(status: string) {
    if (!filing) return;
    setStatusUpdating(true);
    await fetch(`/api/businesses/${filing.businessId}/filings/${filing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStatusUpdating(false);
    load();
  }

  if (notFound) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="body2" color="text.secondary">
          This filing doesn&apos;t exist, or you don&apos;t have access to it.
        </Typography>
      </Container>
    );
  }

  if (!filing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Container>
    );
  }

  const canManage = ["OWNER", "ACCOUNTANT", "BOOKKEEPER"].includes(filing.accessRole);
  const canInviteEngagement = filing.accessRole === "OWNER" && !filing.viaEngagement;

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        <Link href={`/businesses/${filing.businessId}/filings`}>{filing.business.name}</Link>{" "}
        · {filing.viaEngagement ? "engaged for this filing" : filing.accessRole}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        {filing.label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filing.type} · {new Date(filing.periodStart).toLocaleDateString()} –{" "}
        {new Date(filing.periodEnd).toLocaleDateString()} · Status:{" "}
        <Chip size="small" label={filing.status} component="span" />
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 4 }}>
        <Button variant="outlined" component={Link} href={`/filings/${filing.id}/revenue`}>
          Revenue entries & missing invoices →
        </Button>
        <Button variant="outlined" component={Link} href={`/filings/${filing.id}/reports`}>
          Reports — KMD & annual, fill for EMTA →
        </Button>
      </Box>

      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          Preview, download & file
        </Typography>

        <Button
          type="button"
          variant="outlined"
          onClick={() => setPreviewOpen((v) => !v)}
          sx={{ mb: 2 }}
        >
          {previewOpen ? "Hide preview" : "Preview filing"}
        </Button>

        {previewOpen && (
          <Card variant="outlined" sx={{ mb: 2, bgcolor: "grey.50" }}>
            <CardContent>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {filing.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filing.type} filing for {new Date(filing.periodStart).toLocaleDateString()} –{" "}
                {new Date(filing.periodEnd).toLocaleDateString()}.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                This is a placeholder preview. The real KMD/annual-report data
                package, drawn from reconciled bank transactions and categorized
                documents, is on the roadmap (see PROPOSAL.md) and not yet
                generated here.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Disclaimer>
          Before downloading or submitting, remember: this is an AI-assisted
          draft. It doesn&apos;t require every line to be individually
          reviewed — but statutory responsibility for what actually gets
          filed rests with the accountant who signs it.
        </Disclaimer>

        <FormControlLabel
          control={
            <Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
          }
          label="I acknowledge this and take responsibility for what's downloaded or filed from here."
          sx={{ mb: 2, mt: 1, alignItems: "flex-start" }}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleDownload}
            disabled={!acknowledged}
            sx={{ minHeight: 48 }}
          >
            Download filing package
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="contained"
              onClick={() => handleStatusChange(filing.status === "FILED" ? "OPEN" : "FILED")}
              disabled={!acknowledged || statusUpdating}
              sx={{ minHeight: 48 }}
            >
              {filing.status === "FILED" ? "Reopen filing" : "Mark as filed (manual submission in EMTA/Ariregister)"}
            </Button>
          )}
          <ComingSoonButton
            label="Auto-submit to EMTA (X-tee)"
            title="Direct EMTA/X-tee submission"
            description="Automated filing straight to EMTA via the X-tee data-exchange layer needs X-tee membership and certification. For now, use “Mark as filed” after submitting the downloaded package yourself in EMTA's portal — see PROPOSAL.md Phase 5."
          />
        </Box>
      </Box>

      <Box component="section" sx={{ mb: 4 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          Accountants engaged on this filing
        </Typography>
        <Card variant="outlined">
          <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
            {filing.engagements.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                None yet
              </Typography>
            )}
            {filing.engagements.map((e, i) => (
              <Box
                key={e.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  borderTop: i === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2">{e.accountant?.name ?? e.email}</Typography>
                <Chip size="small" label={e.status} />
              </Box>
            ))}
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          This grants access to only this filing period — not standing team
          membership. For an ongoing accountant relationship, invite them from
          the business&apos;s Team page instead.
        </Typography>
      </Box>

      {canInviteEngagement && (
        <Box component="section" sx={{ mb: 4 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Engage an accountant for this filing
          </Typography>
          <Box component="form" onSubmit={handleInvite} sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              fullWidth
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="contained" sx={{ minHeight: 48 }}>
              Send
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
          {lastEngagementLink && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, wordBreak: "break-all", display: "block" }}>
              Engagement link (share manually until email sending is wired up):{" "}
              <a href={lastEngagementLink}>{lastEngagementLink}</a>
            </Typography>
          )}
        </Box>
      )}

      {!canManage && (
        <Typography variant="body2" color="text.secondary">
          You have view access to this filing but not the role needed to
          manage it.
        </Typography>
      )}
    </Container>
  );
}
