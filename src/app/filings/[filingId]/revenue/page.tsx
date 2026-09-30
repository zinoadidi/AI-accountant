"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

type Entry = {
  id: string;
  transactionDate: string;
  amount: number;
  currency: string;
  description: string | null;
  counterpartyNameRaw: string | null;
  status: string;
  suggestedNoInvoiceReason: string | null;
  noInvoiceReason: string | null;
  customerName: string | null;
  customerRegistryCode: string | null;
  customerVatNumber: string | null;
  customerAddress: string | null;
  customerEmail: string | null;
  invoiceNumber: string | null;
  invoiceHtml: string | null;
};

type Template = { id: string; name: string };

export default function RevenueEntriesPage() {
  const params = useParams<{ filingId: string }>();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [txDate, setTxDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [counterparty, setCounterparty] = useState("");

  const load = useCallback(async () => {
    const filingRes = await fetch(`/api/filings/${params.filingId}`);
    if (!filingRes.ok) return;
    const filing = await filingRes.json();
    setBusinessId(filing.businessId);

    const [entriesRes, templatesRes] = await Promise.all([
      fetch(`/api/businesses/${filing.businessId}/filings/${params.filingId}/revenue`),
      fetch(`/api/businesses/${filing.businessId}/templates?filingId=${params.filingId}`),
    ]);
    if (entriesRes.ok) setEntries(await entriesRes.json());
    if (templatesRes.ok) setTemplates(await templatesRes.json());
  }, [params.filingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setError(null);
    const res = await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionDate: new Date(txDate).toISOString(),
        amount: Number(amount),
        description,
        counterpartyNameRaw: counterparty,
      }),
    });
    if (!res.ok) {
      setError("Could not add entry");
      return;
    }
    setTxDate("");
    setAmount("");
    setDescription("");
    setCounterparty("");
    load();
  }

  async function updateEntry(id: string, data: Record<string, unknown>) {
    if (!businessId) return;
    await fetch(`/api/businesses/${businessId}/filings/${params.filingId}/revenue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function generateInvoice(id: string, templateId: string) {
    if (!businessId || !templateId) return;
    const res = await fetch(
      `/api/businesses/${businessId}/filings/${params.filingId}/revenue/${id}/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not generate invoice");
      return;
    }
    load();
  }

  function viewInvoice(entry: Entry) {
    if (!entry.invoiceHtml) return;
    const w = window.open("", "_blank");
    w?.document.write(entry.invoiceHtml);
    w?.document.close();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(
      `/api/businesses/${businessId}/filings/${params.filingId}/revenue/import`,
      { method: "POST", body: formData }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError("Import failed");
      return;
    }
    setImportSummary(
      `Imported: ${data.created} created, ${data.updated} updated${
        data.errors?.length ? `, ${data.errors.length} row(s) skipped with errors` : ""
      }`
    );
    if (importInputRef.current) importInputRef.current.value = "";
    load();
  }

  if (!businessId) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        <Link href={`/filings/${params.filingId}`}>← Back to filing</Link>
      </Typography>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Revenue entries &amp; missing invoices
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Each entry is a payment that may need an outgoing sales invoice.
        Bank sync isn&apos;t built yet, so entries are added here or imported
        from a CSV export of the statement in the meantime.
      </Typography>

      <Disclaimer>
        Not every entry needs an invoice — marking one as not needing one is
        always a human decision with a stated reason, never an automatic
        legal determination by this system.
      </Disclaimer>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, my: 3 }}>
        <Button variant="outlined" component="a" href={`/api/businesses/${businessId}/filings/${params.filingId}/revenue/export`}>
          Download CSV
        </Button>
        <Button variant="outlined" component="label" sx={{ minHeight: 48 }}>
          Re-upload CSV
          <input ref={importInputRef} type="file" accept=".csv" hidden onChange={handleImport} />
        </Button>
        <ComingSoonButton
          label="Send via external invoice system"
          title="External invoice-system sync"
          description="Sending generated invoices through an external invoicing system isn't wired up yet. Download or copy the generated invoice from the table below and send it yourself in the meantime."
        />
        {importSummary && (
          <Typography variant="body2" color="text.secondary">
            {importSummary}
          </Typography>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ overflowX: "auto", mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Counterparty / memo</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    No entries yet
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                templates={templates}
                onUpdate={(data) => updateEntry(entry.id, data)}
                onGenerate={(templateId) => generateInvoice(entry.id, templateId)}
                onViewInvoice={() => viewInvoice(entry)}
              />
            ))}
          </TableBody>
        </Table>
      </Box>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        Add an entry manually
      </Typography>
      <Box component="form" onSubmit={handleAddEntry} sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <TextField
          type="date"
          value={txDate}
          onChange={(e) => setTxDate(e.target.value)}
          required
        />
        <TextField
          type="number"
          slotProps={{ htmlInput: { step: "0.01" } }}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          sx={{ width: 128 }}
        />
        <TextField
          placeholder="Counterparty (payer name)"
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
        />
        <TextField
          placeholder="Memo / description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button type="submit" variant="contained" sx={{ minHeight: 48 }}>
          Add
        </Button>
      </Box>
    </Container>
  );
}

function EntryRow({
  entry,
  templates,
  onUpdate,
  onGenerate,
  onViewInvoice,
}: {
  entry: Entry;
  templates: Template[];
  onUpdate: (data: Record<string, unknown>) => void;
  onGenerate: (templateId: string) => void;
  onViewInvoice: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [customerName, setCustomerName] = useState(entry.customerName ?? "");
  const [customerRegistryCode, setCustomerRegistryCode] = useState(entry.customerRegistryCode ?? "");
  const [customerVatNumber, setCustomerVatNumber] = useState(entry.customerVatNumber ?? "");
  const [customerAddress, setCustomerAddress] = useState(entry.customerAddress ?? "");
  const [customerEmail, setCustomerEmail] = useState(entry.customerEmail ?? "");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [noInvoiceReason, setNoInvoiceReason] = useState("");

  function saveCustomer() {
    onUpdate({ customerName, customerRegistryCode, customerVatNumber, customerAddress, customerEmail });
    setEditing(false);
  }

  return (
    <TableRow sx={{ verticalAlign: "top" }}>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {new Date(entry.transactionDate).toLocaleDateString()}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {entry.amount.toFixed(2)} {entry.currency}
      </TableCell>
      <TableCell>
        <Typography variant="body2">{entry.counterpartyNameRaw}</Typography>
        <Typography variant="caption" color="text.secondary">
          {entry.description}
        </Typography>
        {entry.suggestedNoInvoiceReason && entry.status === "NEEDS_INVOICE" && (
          <Typography variant="caption" color="warning.dark" sx={{ mt: 0.5, display: "block" }}>
            AI suggests: {entry.suggestedNoInvoiceReason} — unconfirmed
          </Typography>
        )}
      </TableCell>
      <TableCell sx={{ minWidth: 220 }}>
        {editing ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <TextField
              size="small"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <TextField
              size="small"
              placeholder="Registry code"
              value={customerRegistryCode}
              onChange={(e) => setCustomerRegistryCode(e.target.value)}
            />
            <TextField
              size="small"
              placeholder="VAT number"
              value={customerVatNumber}
              onChange={(e) => setCustomerVatNumber(e.target.value)}
            />
            <TextField
              size="small"
              placeholder="Address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
            <TextField
              size="small"
              placeholder="Email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" onClick={saveCustomer}>
                Save
              </Button>
              <Button size="small" color="inherit" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : entry.customerName ? (
          <Box>
            <Typography variant="body2">{entry.customerName}</Typography>
            <Button size="small" color="inherit" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </Box>
        ) : (
          <Button size="small" onClick={() => setEditing(true)}>
            + Add customer details
          </Button>
        )}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {entry.status === "INVOICE_GENERATED" ? (
          <Chip size="small" color="success" label={entry.invoiceNumber} />
        ) : entry.status === "NO_INVOICE_NEEDED" ? (
          <Chip size="small" label="No invoice needed" title={entry.noInvoiceReason ?? ""} />
        ) : (
          <Chip size="small" color="warning" label="Needs invoice" />
        )}
      </TableCell>
      <TableCell sx={{ whiteSpace: "nowrap" }}>
        {entry.status === "INVOICE_GENERATED" && (
          <Button size="small" onClick={onViewInvoice}>
            View invoice
          </Button>
        )}
        {entry.status === "NEEDS_INVOICE" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Select
                size="small"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.length === 0 && <MenuItem value="">No templates</MenuItem>}
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
              <Button
                size="small"
                variant="contained"
                onClick={() => onGenerate(templateId)}
                disabled={!entry.customerName || !templateId}
              >
                Generate
              </Button>
            </Box>
            {entry.suggestedNoInvoiceReason && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() =>
                  onUpdate({ status: "NO_INVOICE_NEEDED", noInvoiceReason: entry.suggestedNoInvoiceReason })
                }
                title="Accept the AI's suggested reason as-is"
                sx={{ justifyContent: "flex-start", textAlign: "left" }}
              >
                ✓ Accept AI suggestion: {entry.suggestedNoInvoiceReason}
              </Button>
            )}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <TextField
                size="small"
                placeholder={
                  entry.suggestedNoInvoiceReason ? "...or a different reason" : "Reason (e.g. own transfer)"
                }
                value={noInvoiceReason}
                onChange={(e) => setNoInvoiceReason(e.target.value)}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => onUpdate({ status: "NO_INVOICE_NEEDED", noInvoiceReason })}
                disabled={!noInvoiceReason}
              >
                No invoice needed
              </Button>
            </Box>
          </Box>
        )}
        {entry.status === "NO_INVOICE_NEEDED" && (
          <Button size="small" color="inherit" onClick={() => onUpdate({ status: "NEEDS_INVOICE" })}>
            Reopen
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
