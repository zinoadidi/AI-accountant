// Low-level client for the generic-crud backend (JSON store + binary files +
// server-side Meta Spark relay). SERVER-SIDE ONLY: the CRUD base URL, app id,
// and Meta key must never reach the browser — clients talk to Next.js routes,
// which use this module.
//
// Env:
//   CRUD_BASE_URL  e.g. http://127.0.0.1:3531/generic-crud
//   CRUD_APP_ID    uuid namespacing this deployment's data (has a dev default)

const BASE = (process.env.CRUD_BASE_URL ?? "http://127.0.0.1:3531/generic-crud").replace(/\/+$/, "");
const APP_ID =
  process.env.CRUD_APP_ID ?? "00000000-0000-4000-8000-000000000001";

export function crudConfig() {
  return { base: BASE, appId: APP_ID };
}

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`crud ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

// ---- JSON store ----
export type StoreItem<T = Record<string, unknown>> = { id: string; doc: T };

export async function storeList<T = Record<string, unknown>>(q?: string, limit = 500): Promise<StoreItem<T>[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(Math.min(limit, 500)));
  const res = await req(`/api/store/${APP_ID}?${params}`);
  const json = (await res.json()) as { items: StoreItem<T>[] };
  return json.items ?? [];
}

export async function storeGet<T = Record<string, unknown>>(id: string): Promise<T | null> {
  const res = await fetch(`${BASE}/api/store/${APP_ID}/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`crud ${res.status}`);
  const json = (await res.json()) as { doc: T };
  return json.doc;
}

export async function storeCreate<T extends Record<string, unknown>>(doc: T, id?: string): Promise<StoreItem<T>> {
  const res = await req(`/api/store/${APP_ID}`, {
    method: "POST",
    body: JSON.stringify(id ? { id, doc } : { doc }),
  });
  return (await res.json()) as StoreItem<T>;
}

export async function storePut<T extends Record<string, unknown>>(id: string, doc: T): Promise<T> {
  const res = await req(`/api/store/${APP_ID}/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ doc }),
  });
  const json = (await res.json()) as { doc: T };
  return json.doc;
}

export async function storePatch<T extends Record<string, unknown>>(
  id: string,
  patch: Partial<T>
): Promise<T> {
  const res = await req(`/api/store/${APP_ID}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch }),
  });
  const json = (await res.json()) as { doc: T };
  return json.doc;
}

export async function storeDelete(id: string): Promise<void> {
  await req(`/api/store/${APP_ID}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- Binary files ----
export type FileMeta = {
  id: string;
  appId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
};

export async function fileUpload(input: {
  fileName: string;
  mimeType: string;
  kind: string;
  businessId: string;
  data: Buffer;
}): Promise<FileMeta> {
  const res = await req(`/api/files/${APP_ID}`, {
    method: "POST",
    body: JSON.stringify({
      fileName: input.fileName,
      mimeType: input.mimeType,
      kind: input.kind,
      businessId: input.businessId,
      dataBase64: input.data.toString("base64"),
    }),
  });
  if (res.status !== 201) throw new Error(`file upload ${res.status}`);
  return (await res.json()) as FileMeta;
}

export async function fileList(q?: string, limit = 100): Promise<FileMeta[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(Math.min(limit, 500)));
  const res = await req(`/api/files/${APP_ID}?${params}`);
  const json = (await res.json()) as { items: FileMeta[] };
  return json.items ?? [];
}

export async function fileDownload(fileId: string): Promise<{ buf: Buffer; meta: FileMeta }> {
  const metaRes = await fetch(`${BASE}/api/files/${APP_ID}/${encodeURIComponent(fileId)}/meta`, {
    cache: "no-store",
  });
  if (metaRes.status === 404) throw new Error("file not found");
  if (!metaRes.ok) throw new Error(`file meta ${metaRes.status}`);
  const meta = (await metaRes.json()) as FileMeta;
  const binRes = await fetch(`${BASE}/api/files/${APP_ID}/${encodeURIComponent(fileId)}`, {
    cache: "no-store",
  });
  if (!binRes.ok) throw new Error(`file download ${binRes.status}`);
  return { buf: Buffer.from(await binRes.arrayBuffer()), meta };
}

export async function fileDelete(fileId: string): Promise<void> {
  await req(`/api/files/${APP_ID}/${encodeURIComponent(fileId)}`, { method: "DELETE" });
}

// ---- Server-side AI (Meta Spark via the backend; null = unavailable) ----
export async function aiComplete(prompt: string, system?: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/api/ai/${APP_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(system ? { prompt, system } : { prompt }),
    });
    if (!res.ok) return null; // 503 no key, 502 upstream down → caller falls back
    const json = (await res.json()) as { text?: string };
    return typeof json.text === "string" && json.text.trim() ? json.text : null;
  } catch {
    return null; // backend unreachable → caller falls back
  }
}
