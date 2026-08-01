import type { LumeoConfig, LumeoImage, LumeoTypeValue, SaveImagePayload } from "../types";

/** `clientId` and/or `siteId` (whichever are set) as query params — same opaque pass-through pair used on every endpoint. */
function withIdQuery(url: string, config: LumeoConfig): string {
  const params: [string, LumeoTypeValue | undefined][] = [
    ["clientId", config.clientId],
    ["siteId", config.siteId],
  ];
  const query = params
    .filter((entry): entry is [string, LumeoTypeValue] => entry[1] !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
  if (!query) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${query}`;
}

/**
 * The exact `list` URL a given config resolves to (endpoint + `clientId`/`siteId` query params) —
 * used as the shared cache/subscription key in `useLumeoImages`, so every hook instance pointed
 * at the same effective list (same endpoint, same ids) stays in sync automatically.
 */
export function resolveListKey(config: LumeoConfig): string {
  return withIdQuery(config.endpoints.list, config);
}

/** `{ clientId, siteId }` (only the ones that are set) — spread onto a JSON request body. */
function idFields(config: LumeoConfig): { clientId?: LumeoTypeValue; siteId?: LumeoTypeValue } {
  return {
    ...(config.clientId !== undefined ? { clientId: config.clientId } : {}),
    ...(config.siteId !== undefined ? { siteId: config.siteId } : {}),
  };
}

/** Resolves `config.headers` (static object, sync function, or async function) into a plain header map — e.g. an `Authorization` bearer token read fresh on every request. */
async function resolveHeaders(config: LumeoConfig): Promise<Record<string, string>> {
  if (!config.headers) return {};
  return typeof config.headers === "function" ? await config.headers() : config.headers;
}

export async function fetchImageList(config: LumeoConfig, signal?: AbortSignal): Promise<LumeoImage[]> {
  const url = withIdQuery(config.endpoints.list, config);
  const res = await fetch(url, { signal, headers: await resolveHeaders(config) });
  if (!res.ok) {
    throw new Error(`Failed to fetch image list (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.images ?? []);
}

export async function uploadImages(config: LumeoConfig, files: File[]): Promise<Response> {
  const formData = new FormData();
  // "files[]" (not "files") so PHP-style backends parse repeated entries as an actual array
  // instead of silently keeping only the last one — the standard multipart/form-data array
  // convention, harmless for backends that don't require the brackets either.
  files.forEach((file) => formData.append("files[]", file));
  if (config.clientId !== undefined) formData.append("clientId", String(config.clientId));
  if (config.siteId !== undefined) formData.append("siteId", String(config.siteId));
  return fetch(config.endpoints.upload, { method: "POST", body: formData, headers: await resolveHeaders(config) });
}

export async function saveImageMeta(config: LumeoConfig, payload: SaveImagePayload): Promise<Response> {
  return fetch(config.endpoints.save, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await resolveHeaders(config)) },
    body: JSON.stringify({ ...payload, ...idFields(config) }),
  });
}

export async function deleteImage(config: LumeoConfig, id: string): Promise<Response> {
  return fetch(config.endpoints.delete, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...(await resolveHeaders(config)) },
    body: JSON.stringify({ id, ...idFields(config) }),
  });
}
