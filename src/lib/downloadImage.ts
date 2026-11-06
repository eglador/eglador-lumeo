import type { LumeoImage } from "../types";

function clickLink(href: string, fileName: string, newTab = false) {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  if (newTab) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Downloads the full-resolution original (`image.url`, never `thumbUrl`) under its `fileName`.
 * Fetched as a blob first because browsers ignore the `download` attribute on cross-origin links
 * (e.g. a CDN) and would just navigate to the image instead. If that fetch fails — typically a
 * CDN without CORS headers — it falls back to opening the original in a new tab so the user can
 * still save it from there.
 */
export async function downloadOriginalImage(image: LumeoImage): Promise<void> {
  try {
    const response = await fetch(image.url);
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const objectUrl = URL.createObjectURL(await response.blob());
    clickLink(objectUrl, image.fileName);
    // Revoked a moment later rather than immediately — some browsers start the download
    // asynchronously after the click and would otherwise find the URL already gone.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    clickLink(image.url, image.fileName, true);
  }
}
