import type { LumeoConfig, LumeoImage, SaveImagePayload } from "../types";

function withClientIdQuery(url: string, clientId?: string): string {
  if (!clientId) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}clientId=${encodeURIComponent(clientId)}`;
}

export async function fetchImageList(config: LumeoConfig, signal?: AbortSignal): Promise<LumeoImage[]> {
  const url = withClientIdQuery(config.endpoints.list, config.clientId);
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch image list (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.images ?? []);
}

export function uploadImages(config: LumeoConfig, files: File[]): Promise<Response> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (config.clientId) formData.append("clientId", config.clientId);
  return fetch(config.endpoints.upload, { method: "POST", body: formData });
}

export function saveImageMeta(config: LumeoConfig, payload: SaveImagePayload): Promise<Response> {
  return fetch(config.endpoints.save, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.clientId ? { ...payload, clientId: config.clientId } : payload),
  });
}

export function deleteImage(config: LumeoConfig, id: string): Promise<Response> {
  return fetch(config.endpoints.delete, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.clientId ? { id, clientId: config.clientId } : { id }),
  });
}
