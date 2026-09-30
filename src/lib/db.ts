// Domain store: all AI-accountant entities as typed docs in the generic-crud
// backend (one deployment appId, docs namespaced by `kind`). Replaces Prisma.
// Lists use the backend's substring search + in-memory kind/business filters;
// fine for SME scale (backend caps lists at 500 docs).
import {
  storeList,
  storeGet,
  storeCreate,
  storePut,
  storePatch,
  storeDelete,
  fileUpload,
  fileList,
  type FileMeta,
} from "@/lib/crud";

export type { FileMeta };

const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// ---- Entity shapes (each stored doc carries kind + createdAt) ----
export type UserDoc = {
  kind: "user";
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
};
export type BusinessDoc = {
  kind: "business";
  name: string;
  registryCode: string | null;
  vatNumber: string | null;
  country: string;
  currency: string;
  pricingMode: string | null;
  createdAt: string;
};
export type MembershipDoc = {
  kind: "membership";
  userId: string;
  businessId: string;
  role: string;
  createdAt: string;
};
export type InvitationDoc = {
  kind: "invitation";
  email: string;
  role: string;
  status: string;
  token: string;
  businessId: string;
  invitedById: string;
  createdAt: string;
  expiresAt: string;
};
export type ResetDoc = {
  kind: "reset";
  userId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
};
export type DocumentDoc = {
  kind: "document";
  businessId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  type: string;
  status: string;
  suggestedCategory: string | null;
  suggestedVendor: string | null;
  suggestedAmount: number | null;
  suggestedCurrency: string | null;
  suggestedVatRate: number | null;
  aiConfidence: number | null;
  confirmedCategory: string | null;
  uploadedById: string;
  createdAt: string;
};
export type FilingDoc = {
  kind: "filing";
  businessId: string;
  label: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  createdAt: string;
};
export type EngagementDoc = {
  kind: "engagement";
  businessId: string;
  filingPeriodId: string;
  email: string;
  status: string;
  token: string;
  invitedById: string;
  accountantId: string | null;
  createdAt: string;
  expiresAt: string;
};
export type TemplateDoc = {
  kind: "template";
  businessId: string;
  name: string;
  html: string;
  createdAt: string;
};
export type RevenueDoc = {
  kind: "revenue";
  businessId: string;
  filingPeriodId: string;
  statementTxId: string | null;
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
  invoiceTemplateId: string | null;
  invoiceNumber: string | null;
  invoiceHtml: string | null;
  generatedAt: string | null;
  createdAt: string;
};
export type StatementTx = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  direction: "C" | "D";
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  description: string | null;
  reference: string | null;
  raw: Record<string, string>;
};
export type StatementDoc = {
  kind: "statement";
  businessId: string;
  filingPeriodId: string | null;
  fileId: string;
  fileName: string;
  source: string; // LHV | STRIPE | GENERIC
  accountNo: string | null;
  txCount: number;
  transactions: StatementTx[];
  createdAt: string;
};

export type DocOf = {
  user: UserDoc;
  business: BusinessDoc;
  membership: MembershipDoc;
  invitation: InvitationDoc;
  document: DocumentDoc;
  filing: FilingDoc;
  engagement: EngagementDoc;
  template: TemplateDoc;
  revenue: RevenueDoc;
  statement: StatementDoc;
  reset: ResetDoc;
};
export type Kind = keyof DocOf;
export type WithId<T> = T & { id: string };

// ---- Generic helpers ----
async function allByKind<K extends Kind>(kind: K): Promise<WithId<DocOf[K]>[]> {
  const items = await storeList<DocOf[K]>(kind, 500);
  return items
    .filter((i) => (i.doc as { kind?: string }).kind === kind)
    .map((i) => ({ ...i.doc, id: i.id }));
}

async function allByBusiness<K extends Kind>(kind: K, businessId: string): Promise<WithId<DocOf[K]>[]> {
  const all = await allByKind(kind);
  return all.filter((d) => (d as unknown as { businessId?: string }).businessId === businessId);
}

async function get<K extends Kind>(kind: K, id: string): Promise<WithId<DocOf[K]> | null> {
  const doc = await storeGet<DocOf[K]>(id);
  if (!doc || (doc as { kind?: string }).kind !== kind) return null;
  return { ...doc, id };
}

async function put<K extends Kind>(kind: K, id: string, doc: DocOf[K]): Promise<WithId<DocOf[K]>> {
  const saved = await storePut(id, { ...doc, kind } as Record<string, unknown>);
  return { ...(saved as unknown as DocOf[K]), id };
}

// ---- Users ----
export const users = {
  async findByEmail(email: string): Promise<WithId<UserDoc> | null> {
    const items = await storeList<UserDoc>(email.toLowerCase(), 100);
    const hit = items.find((i) => i.doc.kind === "user" && i.doc.email === email.toLowerCase());
    return hit ? { ...hit.doc, id: hit.id } : null;
  },
  async create(data: { email: string; passwordHash: string; name: string }) {
    const id = uid();
    const doc: UserDoc = { kind: "user", ...data, email: data.email.toLowerCase(), createdAt: now() };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  get: (id: string) => get("user", id),
  async setPassword(id: string, passwordHash: string) {
    const u = await get("user", id);
    if (!u) return null;
    return put("user", id, { ...u, passwordHash });
  },
  async setEmail(id: string, email: string) {
    const u = await get("user", id);
    if (!u) return null;
    return put("user", id, { ...u, email: email.toLowerCase() });
  },
  async all() {
    return allByKind("user");
  },
};

// ---- Businesses ----
export const businesses = {
  async all() {
    return allByKind("business");
  },
  async create(data: { name: string; registryCode?: string; vatNumber?: string; country?: string; currency?: string }) {
    const id = uid();
    const doc: BusinessDoc = {
      kind: "business",
      name: data.name,
      registryCode: data.registryCode || null,
      vatNumber: data.vatNumber || null,
      country: data.country || "EE",
      currency: data.currency || "EUR",
      pricingMode: null,
      createdAt: now(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  get: (id: string) => get("business", id),
  async setPricing(id: string, pricingMode: string) {
    const b = await get("business", id);
    if (!b) return null;
    return put("business", id, { ...b, pricingMode });
  },
  async forUser(userId: string) {
    const memberships = await allByKind("membership");
    const mine = memberships.filter((m) => m.userId === userId);
    const out: WithId<BusinessDoc>[] = [];
    for (const m of mine) {
      const b = await get("business", m.businessId);
      if (b) out.push(b);
    }
    return out;
  },
};

// ---- Memberships ----
export const memberships = {
  async all() {
    return allByKind("membership");
  },
  async get(userId: string, businessId: string) {
    const all = await allByKind("membership");
    return all.find((m) => m.userId === userId && m.businessId === businessId) ?? null;
  },
  async create(userId: string, businessId: string, role: string) {
    const id = uid();
    const doc: MembershipDoc = { kind: "membership", userId, businessId, role, createdAt: now() };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  byBusiness: (businessId: string) => allByBusiness("membership", businessId),
};

// ---- Invitations ----
export const invitations = {
  async create(data: { email: string; role: string; businessId: string; invitedById: string }) {
    const id = uid();
    const doc: InvitationDoc = {
      kind: "invitation",
      email: data.email.toLowerCase(),
      role: data.role,
      status: "PENDING",
      token: uid().replace(/-/g, ""),
      businessId: data.businessId,
      invitedById: data.invitedById,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  byBusiness: (businessId: string) => allByBusiness("invitation", businessId),
  async findByToken(token: string) {
    const items = await storeList<InvitationDoc>(token, 50);
    const hit = items.find((i) => i.doc.kind === "invitation" && i.doc.token === token);
    return hit ? { ...hit.doc, id: hit.id } : null;
  },
  async accept(id: string) {
    const inv = await get("invitation", id);
    if (!inv) return null;
    return put("invitation", id, { ...inv, status: "ACCEPTED" });
  },
};

// ---- Password resets (manual-link, no email provider — same pattern as
// invitations: the token is returned to the requester, who forwards it) ----
export const resets = {
  async create(userId: string) {
    // Invalidate earlier outstanding tokens for this user first.
    const items = await storeList<ResetDoc>(userId, 100);
    for (const i of items) {
      if (i.doc.kind === "reset" && i.doc.userId === userId) {
        await storeDelete(i.id).catch(() => {});
      }
    }
    const id = uid();
    const doc: ResetDoc = {
      kind: "reset",
      userId,
      token: uid().replace(/-/g, ""),
      createdAt: now(),
      expiresAt: new Date(Date.now() + 3600e3).toISOString(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async findByToken(token: string) {
    const items = await storeList<ResetDoc>(token, 50);
    const hit = items.find((i) => i.doc.kind === "reset" && i.doc.token === token);
    return hit ? { ...hit.doc, id: hit.id } : null;
  },
  async consume(id: string) {
    await storeDelete(id);
  },
};

// ---- Documents (+ backend files) ----
export const documents = {
  byBusiness: (businessId: string) => allByBusiness("document", businessId),
  get: (id: string) => get("document", id),
  async upload(input: {
    businessId: string;
    fileName: string;
    mimeType: string;
    data: Buffer;
    type?: string;
    uploadedById: string;
  }) {
    const meta: FileMeta = await fileUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      kind: input.type ?? "OTHER",
      businessId: input.businessId,
      data: input.data,
    });
    const id = uid();
    const doc: DocumentDoc = {
      kind: "document",
      businessId: input.businessId,
      fileId: meta.id,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: meta.sizeBytes,
      type: input.type ?? "OTHER",
      status: "UPLOADED",
      suggestedCategory: null,
      suggestedVendor: null,
      suggestedAmount: null,
      suggestedCurrency: null,
      suggestedVatRate: null,
      aiConfidence: null,
      confirmedCategory: null,
      uploadedById: input.uploadedById,
      createdAt: now(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async categorize(id: string, suggestion: {
    category: string; vendor?: string; amount?: number; currency?: string; vatRate?: number; confidence: number;
  }) {
    const d = await get("document", id);
    if (!d) return null;
    return put("document", id, {
      ...d,
      status: "CATEGORIZED",
      suggestedCategory: suggestion.category,
      suggestedVendor: suggestion.vendor ?? null,
      suggestedAmount: suggestion.amount ?? null,
      suggestedCurrency: suggestion.currency ?? null,
      suggestedVatRate: suggestion.vatRate ?? null,
      aiConfidence: suggestion.confidence,
    });
  },
  async confirm(id: string, category: string) {
    const d = await get("document", id);
    if (!d) return null;
    return put("document", id, { ...d, status: "REVIEWED", confirmedCategory: category });
  },
  filesForBusiness: (businessId: string) => fileList(businessId, 500),
};

// ---- Filings ----
export const filings = {
  byBusiness: (businessId: string) => allByBusiness("filing", businessId),
  get: (id: string) => get("filing", id),
  async create(data: { businessId: string; label: string; type: string; periodStart: string; periodEnd: string }) {
    const id = uid();
    const doc: FilingDoc = { kind: "filing", ...data, status: "OPEN", createdAt: now() };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async setStatus(id: string, status: string) {
    const f = await get("filing", id);
    if (!f) return null;
    return put("filing", id, { ...f, status });
  },
  async getBusinessScoped(id: string, businessId: string) {
    const f = await get("filing", id);
    return f && f.businessId === businessId ? f : null;
  },
};

// ---- Engagements ----
export const engagements = {
  async create(data: { businessId: string; filingPeriodId: string; email: string; invitedById: string }) {
    const id = uid();
    const doc: EngagementDoc = {
      kind: "engagement",
      businessId: data.businessId,
      filingPeriodId: data.filingPeriodId,
      email: data.email.toLowerCase(),
      status: "PENDING",
      token: uid().replace(/-/g, ""),
      invitedById: data.invitedById,
      accountantId: null,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 14 * 864e5).toISOString(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async forFiling(filingPeriodId: string) {
    const all = await allByKind("engagement");
    return all.filter((e) => e.filingPeriodId === filingPeriodId);
  },
  async findByToken(token: string) {
    const items = await storeList<EngagementDoc>(token, 50);
    const hit = items.find((i) => i.doc.kind === "engagement" && i.doc.token === token);
    return hit ? { ...hit.doc, id: hit.id } : null;
  },
  async accept(id: string, accountantId: string) {
    const e = await get("engagement", id);
    if (!e) return null;
    return put("engagement", id, { ...e, status: "ACTIVE", accountantId });
  },
  async activeForFiling(filingPeriodId: string, businessId: string, accountantId: string) {
    const all = await allByKind("engagement");
    return (
      all.find(
        (e) =>
          e.filingPeriodId === filingPeriodId &&
          e.businessId === businessId &&
          e.accountantId === accountantId &&
          e.status === "ACTIVE"
      ) ?? null
    );
  },
};

// ---- Invoice templates ----
export const templates = {
  byBusiness: (businessId: string) => allByBusiness("template", businessId),
  get: (id: string) => get("template", id),
  async create(businessId: string, name: string, html: string) {
    const id = uid();
    const doc: TemplateDoc = { kind: "template", businessId, name, html, createdAt: now() };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
};

// ---- Revenue entries ----
export const revenues = {
  async forFiling(filingPeriodId: string) {
    const all = await allByKind("revenue");
    return all.filter((r) => r.filingPeriodId === filingPeriodId);
  },
  get: (id: string) => get("revenue", id),
  async create(data: {
    businessId: string;
    filingPeriodId: string;
    transactionDate: string;
    amount: number;
    currency?: string;
    description?: string | null;
    counterpartyNameRaw?: string | null;
    suggestedNoInvoiceReason?: string | null;
    statementTxId?: string | null;
    customer?: { name?: string; registryCode?: string; vatNumber?: string; address?: string; email?: string };
  }) {
    const id = uid();
    const doc: RevenueDoc = {
      kind: "revenue",
      businessId: data.businessId,
      filingPeriodId: data.filingPeriodId,
      statementTxId: data.statementTxId ?? null,
      transactionDate: data.transactionDate,
      amount: data.amount,
      currency: data.currency || "EUR",
      description: data.description ?? null,
      counterpartyNameRaw: data.counterpartyNameRaw ?? null,
      status: "NEEDS_INVOICE",
      suggestedNoInvoiceReason: data.suggestedNoInvoiceReason ?? null,
      noInvoiceReason: null,
      customerName: data.customer?.name ?? null,
      customerRegistryCode: data.customer?.registryCode ?? null,
      customerVatNumber: data.customer?.vatNumber ?? null,
      customerAddress: data.customer?.address ?? null,
      customerEmail: data.customer?.email ?? null,
      invoiceTemplateId: null,
      invoiceNumber: null,
      invoiceHtml: null,
      generatedAt: null,
      createdAt: now(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async update(id: string, patch: Partial<RevenueDoc>) {
    const r = await get("revenue", id);
    if (!r) return null;
    const { kind: _k, ...rest } = r;
    const next = (await import("@/lib/crud").then((m) =>
      m.storePatch(id, patch as Record<string, unknown>)
    )) as unknown as RevenueDoc;
    return { ...next, id };
  },
  async countInvoiced(businessId: string) {
    const all = await allByBusiness("revenue", businessId);
    return all.filter((r) => r.invoiceNumber).length;
  },
};

// ---- Statements ----
export const statements = {
  byBusiness: (businessId: string) => allByBusiness("statement", businessId),
  get: (id: string) => get("statement", id),
  async create(data: {
    businessId: string;
    fileName: string;
    fileId: string;
    source: string;
    accountNo: string | null;
    transactions: StatementTx[];
  }) {
    const id = uid();
    const doc: StatementDoc = {
      kind: "statement",
      businessId: data.businessId,
      filingPeriodId: null,
      fileId: data.fileId,
      fileName: data.fileName,
      source: data.source,
      accountNo: data.accountNo,
      txCount: data.transactions.length,
      transactions: data.transactions,
      createdAt: now(),
    };
    await storeCreate(doc as unknown as Record<string, unknown>, id);
    return { ...doc, id };
  },
  async attachFiling(id: string, filingPeriodId: string) {
    const s = await get("statement", id);
    if (!s) return null;
    return put("statement", id, { ...s, filingPeriodId });
  },
  patch: (id: string, patch: Partial<StatementDoc>) =>
    import("@/lib/crud").then(async (m) => {
      const next = (await m.storePatch(id, patch as Record<string, unknown>)) as unknown as StatementDoc;
      return { ...next, id };
    }),
};

export async function updateDoc<K extends Kind>(kind: K, id: string, patch: Partial<DocOf[K]>) {
  const current = await get(kind, id);
  if (!current) return null;
  const next = (await import("@/lib/crud").then((m) =>
    m.storePatch(id, patch as Record<string, unknown>)
  )) as unknown as DocOf[K];
  return { ...next, id };
}
