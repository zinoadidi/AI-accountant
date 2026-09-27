"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

type Template = { id: string; name: string; html: string; createdAt: string };

export default function TemplatesPage() {
  const params = useParams<{ id: string }>();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/businesses/${params.id}/templates`);
    if (res.ok) setTemplates(await res.json());
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setHtml(text);
    if (!name) setName(file.name.replace(/\.html?$/i, ""));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/businesses/${params.id}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, html }),
    });
    if (!res.ok) {
      setError("Could not save template");
      return;
    }
    setName("");
    setHtml("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Invoice templates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload your existing invoice design as HTML. Use{" "}
        <code>{"{{customerName}}"}</code>, <code>{"{{amount}}"}</code>,{" "}
        <code>{"{{invoiceNumber}}"}</code>, etc. as placeholders — the system
        fills those in when generating an invoice for a revenue entry. Any
        other markup/styling in the file is kept as-is.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <List disablePadding>
          {templates.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No templates yet"
                slotProps={{ primary: { variant: "body2", color: "text.secondary" } }}
              />
            </ListItem>
          )}
          {templates.map((t) => (
            <ListItem
              key={t.id}
              divider
              secondaryAction={
                <Button size="small" variant="text" onClick={() => setPreview(t.html)}>
                  Preview
                </Button>
              }
            >
              <ListItemText primary={t.name} slotProps={{ primary: { variant: "body2", sx: { fontWeight: 500 } } }} />
            </ListItem>
          ))}
        </List>
      </Card>

      {preview && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" component="h2">
                Template preview (raw tokens, unfilled)
              </Typography>
              <Button size="small" variant="text" onClick={() => setPreview(null)}>
                Close
              </Button>
            </Box>
            <Box
              component="iframe"
              srcDoc={preview}
              sandbox=""
              title="Template preview"
              sx={{ height: 256, width: "100%", border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "#fff" }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Add a template
          </Typography>
          <Box component="form" onSubmit={handleSave} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Template name, e.g. Standard sales invoice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileChange} />
            <TextField
              label="...or paste HTML directly"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              required
              fullWidth
              multiline
              minRows={6}
              slotProps={{ htmlInput: { style: { fontFamily: "monospace", fontSize: 12 } } }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
              Save template
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
