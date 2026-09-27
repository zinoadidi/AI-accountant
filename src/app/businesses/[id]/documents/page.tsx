"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Doc = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  type?: string | null;
  status?: string | null;
  suggestedCategory: string | null;
  confirmedCategory?: string | null;
  aiConfidence: number | null;
  fileId?: string | null;
  createdAt: string;
};

const FILTERS = ["ALL", "RECEIPT", "BANK_STATEMENT", "INVOICE", "CONTRACT", "OTHER"];

function isImage(d: Doc) {
  return (d.mimeType ?? "").startsWith("image/");
}

export default function DocumentsPage() {
  const params = useParams<{ id: string }>();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/documents`);
    if (res.ok) setDocuments(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/businesses/${params.id}/documents`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    load();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  async function confirmCategory(documentId: string, category: string) {
    await fetch(`/api/businesses/${params.id}/documents/${documentId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    load();
  }

  const visible = documents.filter((d) =>
    filter === "ALL" ? true : (d.type ?? "OTHER") === filter
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload receipts, bank statements, or invoices. Each one gets an
        AI-suggested category — correcting it helps accuracy, but it&apos;s
        not required before moving on.
      </Typography>

      <Disclaimer />

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleChange}
        disabled={uploading}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,.pdf,.csv"
        hidden
        onChange={handleChange}
        disabled={uploading}
      />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          sx={{ minHeight: 56, fontSize: "1rem" }}
        >
          Take photo
        </Button>
        <Button
          variant="outlined"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          sx={{ minHeight: 56, fontSize: "1rem" }}
        >
          Upload file
        </Button>
      </Box>
      {uploading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Uploading and categorizing...
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 3 }}
        role="tablist"
        aria-label="Filter by type"
      >
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            clickable
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            onClick={() => setFilter(f)}
          />
        ))}
      </Box>

      {visible.length === 0 && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No documents yet{filter !== "ALL" ? " for this filter" : ""}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {visible.map((d) => (
          <Card key={d.id} variant="outlined">
            {d.fileId && isImage(d) ? (
              <CardMedia
                component="img"
                image={`/api/files/${d.fileId}`}
                alt={d.fileName}
                loading="lazy"
                sx={{ height: 160, objectFit: "cover" }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 80,
                  bgcolor: "grey.100",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                >
                  {d.type ?? d.mimeType ?? "file"}
                </Typography>
              </Box>
            )}
            <CardContent>
              <Typography variant="body2" noWrap title={d.fileName} sx={{ fontWeight: 500 }}>
                {d.fileName}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 1 }}>
                {d.type && <Chip size="small" label={d.type} />}
                {d.status && <Chip size="small" label={d.status} />}
                {d.confirmedCategory ? (
                  <Chip size="small" color="success" label={`Confirmed: ${d.confirmedCategory}`} />
                ) : d.suggestedCategory ? (
                  <Chip
                    size="small"
                    color="warning"
                    label={`AI: ${d.suggestedCategory} (${Math.round((d.aiConfidence ?? 0) * 100)}%)`}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Categorizing...
                  </Typography>
                )}
              </Box>
              {!d.confirmedCategory && d.suggestedCategory && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => confirmCategory(d.id, d.suggestedCategory as string)}
                  title="Optional — not required to proceed"
                  sx={{ mt: 1 }}
                >
                  Confirm (optional)
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
