/** "en" (default) or "tr" — switches every built-in UI string. */
export type LumeoLocale = "en" | "tr";

export interface LumeoImageTypeOption {
  /** Stable machine value sent to the API, e.g. "manset" */
  value: string;
  /** Human readable label shown in the UI, e.g. "Manşet" */
  label: string;
  /** Preferred crop ratio (width / height) for this usage type. Omit to allow free-form cropping. */
  aspect?: number;
  /** Preferred output width in pixels for this usage type. Shown next to the label; independent of `aspect`. */
  width?: number;
  /** Preferred output height in pixels for this usage type. Shown next to the label; independent of `aspect`. */
  height?: number;
}

export interface LumeoImage {
  /** Always assigned by the API. Never generated client-side. */
  id: string;
  fileName: string;
  url: string;
  /** ISO 8601 timestamp as returned by the API. */
  uploadedAt: string;
  type?: string;
  fileSize?: number;
  mimeType?: string;
  /** Original pixel dimensions, as returned by the API after upload. */
  width?: number;
  height?: number;
}

export interface CropRegion {
  /** Local UI key for managing the region list. Not an image id. */
  id: string;
  name: string;
  /** Human readable ratio label shown in the UI, e.g. "16:9" or "Serbest". */
  aspectLabel: string;
  /** Locked width/height ratio used while resizing. Undefined = free-form. */
  aspect?: number;
  /** Hex color used to draw this region's outline and its list dot. Assigned once at creation. */
  color: string;
  /** All coordinates are in the original image's natural pixel space. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single concrete output box, either a plain preset's size or one entry nested under a group. */
export interface SizePresetSize {
  width: number;
  height: number;
  /** Human readable label. Defaults to "{width}×{height}". */
  label?: string;
}

/** A fixed output size the user can pick without manually dragging a crop area. */
export interface SizePresetOption {
  /** Stable key, e.g. "1024x768". */
  id: string;
  /** Human readable label shown in the UI. Required when using `sizes`; defaults to "{width}×{height}" otherwise. */
  label?: string;
  /** Single-size preset. Omit both and use `sizes` instead for a group that expands to multiple output boxes. */
  width?: number;
  height?: number;
  /**
   * Nested output sizes for a single selectable preset — e.g. a "Detay" entry that expands to
   * 400×400, 500×200, and 200×200 crops. Selecting this preset selects the whole group at once;
   * saving produces every box listed here. When set, top-level `width`/`height` are ignored.
   */
  sizes?: SizePresetSize[];
}

/**
 * A size preset the user selected from the preset list, normalized to its full list of output
 * boxes — always at least one entry, even for a plain (non-nested) preset. No manual crop
 * coordinates are involved; the API crops to each box in `sizes` directly.
 */
export interface SelectedSize {
  id: string;
  label: string;
  sizes: SizePresetSize[];
}

export interface LumeoEndpoints {
  upload: string;
  list: string;
  save: string;
  delete: string;
}

export interface LumeoConfig {
  endpoints: LumeoEndpoints;
  /**
   * true: after upload/save, wait for a successful response before refreshing the list (once).
   * false (default): refresh the list once immediately after firing the request, without waiting.
   */
  waitForSuccess?: boolean;
  /** Accepted mime types/patterns, e.g. ["image/png"] or ["image/*"]. Default: ["image/*"]. */
  accept?: string[];
  /** Maximum file size per image in megabytes. Default: 10. */
  maxFileSizeMB?: number;
  /** Optional cap on number of files that may be selected/queued at once. */
  maxFiles?: number;
  /** Usage-type options offered in the type selector. Default: resolveImageTypes()'s locale-aware default. */
  imageTypes?: LumeoImageTypeOption[];
  /** Preset output sizes offered in the size-options tab. Default: resolveSizePresets()'s locale-aware default. */
  sizePresets?: SizePresetOption[];
  /** UI language for every built-in string. Default: "en". */
  locale?: LumeoLocale;
  /**
   * Opaque, consumer-supplied identifier (e.g. site/tenant/project id) attached to every
   * outgoing request: as a `clientId` form field on upload, a `clientId` query param on
   * list, and a `clientId` JSON field on save/delete. The package never reads or
   * interprets this value — it only forwards it.
   */
  clientId?: string;
}

export type RejectReason = "type" | "size" | "max-files";

export interface RejectedFile {
  file: File;
  reason: RejectReason;
}

export interface ValidateFilesResult {
  accepted: File[];
  rejected: RejectedFile[];
}

export interface SaveImagePayload {
  id: string;
  type?: string;
  /** Preset sizes picked in the "Boyut Seçenekleri" tab — no manual crop coordinates. */
  sizes?: SelectedSize[];
  /** Manually dragged crop regions picked in the "Özel Kırpma" tab. */
  crops?: CropRegion[];
}

export type LumeoViewMode = "grid" | "detail";
