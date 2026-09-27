// Bank-statement CSV parsing: LHV (Estonian), Stripe, and a generic fallback.
// Shapes verified against example_company_data_zinospot/:
//   LHV:    "Customer account no","Document no","Date",...,"Debit/Credit (D/C)","Amount",...,"Description",...,"Currency",...
//   Stripe: "id","Created date (UTC)","Amount",...,"Currency","Description","Fee",...,"Customer Email","Invoice ID",...
import { parseCsvRecords } from "@/lib/csv";
import type { StatementTx } from "@/lib/db";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export type ParsedStatement = {
  source: "LHV" | "STRIPE" | "GENERIC";
  accountNo: string | null;
  transactions: StatementTx[];
};

const stripBom = (text: string) => text.replace(/^\uFEFF/, "");

function num(value: string): number {
  const n = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseLhv(records: Record<string, string>[]): ParsedStatement {
  const transactions: StatementTx[] = records
    .filter((r) => r["Date"] && r["Amount"] !== "")
    .map((r) => {
      const amount = num(r["Amount"]);
      return {
        id: uid(),
        date: (r["Date"] || "").slice(0, 10),
        amount: Math.abs(amount),
        currency: r["Currency"] || "EUR",
        direction: (r["Debit/Credit (D/C)"] || "").toUpperCase().startsWith("C") ? "C" : "D",
        counterpartyName: r["Sender/receiver name"] || null,
        counterpartyAccount: r["Sender/receiver account"] || null,
        description: [r["Description"], r["Document no"] ? `doc ${r["Document no"]}` : ""]
          .filter(Boolean)
          .join(" · ") || null,
        reference: r["Transaction reference"] || r["Reference number"] || null,
        raw: r,
      };
    });
  return {
    source: "LHV",
    accountNo: records[0]?.["Customer account no"] || null,
    transactions,
  };
}

function parseStripe(records: Record<string, string>[]): ParsedStatement {
  const transactions: StatementTx[] = records
    .filter((r) => r["Created date (UTC)"] && r["Amount"] !== "")
    .map((r) => ({
      id: uid(),
      date: (r["Created date (UTC)"] || "").slice(0, 10),
      amount: Math.abs(num(r["Amount"])),
      currency: (r["Currency"] || "EUR").toUpperCase(),
      direction: "C" as const,
      counterpartyName: r["Customer Description"] || r["Customer Email"] || "Stripe payout",
      counterpartyAccount: null,
      description: [r["Description"], r["Statement Descriptor"], r["Invoice ID"] ? `invoice ${r["Invoice ID"]}` : ""]
        .filter(Boolean)
        .join(" · ") || null,
      reference: r["id"] || null,
      raw: r,
    }));
  return { source: "STRIPE", accountNo: null, transactions };
}

function parseGeneric(records: Record<string, string>[], header: string[]): ParsedStatement {
  const lower = header.map((h) => h.toLowerCase());
  const pick = (...names: string[]) => {
    const i = lower.findIndex((h) => names.some((n) => h.includes(n)));
    return i >= 0 ? header[i] : null;
  };
  const dateCol = pick("date", "value date", "booking date");
  const amountCol = pick("amount", "sum", "total", "value");
  const descCol = pick("description", "details", "memo", "narrative", "explanation");
  const cpCol = pick("counterparty", "sender", "receiver", "beneficiary", "payer", "name");
  const ccyCol = pick("currency", "ccy");
  const transactions: StatementTx[] = records
    .filter((r) => (dateCol ? r[dateCol] : false) && (amountCol ? r[amountCol] !== "" : false))
    .map((r) => {
      const amount = num(amountCol ? r[amountCol] : "0");
      return {
        id: uid(),
        date: (dateCol ? r[dateCol] : "").slice(0, 10),
        amount: Math.abs(amount),
        currency: (ccyCol ? r[ccyCol] : "EUR") || "EUR",
        direction: amount < 0 ? "D" : "C",
        counterpartyName: cpCol ? r[cpCol] || null : null,
        counterpartyAccount: null,
        description: descCol ? r[descCol] || null : null,
        reference: null,
        raw: r,
      };
    });
  return { source: "GENERIC", accountNo: null, transactions };
}

export function parseStatementCsv(text: string): ParsedStatement {
  const clean = stripBom(text);
  const records = parseCsvRecords(clean);
  if (records.length === 0) return { source: "GENERIC", accountNo: null, transactions: [] };
  const header = Object.keys(records[0]);
  if (header.includes("Debit/Credit (D/C)") || header.includes("Customer account no")) {
    return parseLhv(records);
  }
  if (header.includes("Created date (UTC)") || header.includes("Statement Descriptor")) {
    return parseStripe(records);
  }
  return parseGeneric(records, header);
}
