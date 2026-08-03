/** "en" (default) or "tr" — switches every built-in UI string. */
export type LumeoLocale = "en" | "tr";

/** A usage-type's identifying value/type tag — a slug (`"manset"`) or a numeric backend id (`5`), your choice. */
export type LumeoTypeValue = string | number;

export interface LumeoImageTypeOption {
  /** Stable machine value sent to the API — a slug like `"manset"` or a numeric id, e.g. `5`. */
  value: LumeoTypeValue;
  /** Human readable label shown in the UI, e.g. "Manşet" */
  label: string;
  /** Preferred crop ratio (width / height) for this usage type. Omit to allow free-form cropping. */
  aspect?: number;
  /** Preferred output width in pixels for this usage type. Shown next to the label; independent of `aspect`. */
  width?: number;
  /** Preferred output height in pixels for this usage type. Shown next to the label; independent of `aspect`. */
  height?: number;
  /**
   * Optional backend identifier for this usage type (e.g. a database id), distinct from the
   * slug-like `value`. Carried onto any crop created for this type as `CropRegion.cropTypeId`.
   */
  cropTypeId?: string | number;
  /**
   * Optional display name for a group heading — only meaningful when `crops` is set below.
   * Falls back to `label` when omitted.
   */
  name?: string;
  /**
   * Nests other usage-type options under this one purely for display grouping — e.g. an "Ana Tip"
   * entry whose children all render together under one heading (`name`/`label`). When set, this
   * entry itself is NOT selectable/croppable — only the entries inside `crops` are. `value` on a
   * group entry still matters: it's sent back as the top-level `SaveImagePayload.typeId` whenever
   * a saved crop came from one of this group's children. Omit for a plain, directly selectable
   * usage type (existing, non-nested behavior — unaffected).
   */
  crops?: LumeoImageTypeOption[];
  /**
   * Marks this entry as required for a valid submission — checked across the **whole** image
   * list via `checkRequiredImageTypes()` / `useRequiredImageTypes()`, not per-image. The package
   * never blocks anything itself (no HTML `required`, no disabled buttons inside the modal); it
   * only reports status for your own app to act on, e.g. disabling your save button.
   *
   * - On a plain/leaf entry: satisfied once **at least one image, anywhere in the list**, has
   *   been cropped for this exact type.
   * - On a group entry (has `crops`): satisfied only once **every one** of the group's children
   *   has been cropped somewhere in the list — an "all of these" requirement. Mark only some
   *   individual children `required` instead if you only need that subset covered.
   *
   * A group and its children carry `required` fully independently of each other.
   */
  required?: boolean;
}

export interface LumeoImage {
  /** Always assigned by the API. Never generated client-side. */
  id: string;
  fileName: string;
  url: string;
  /** ISO 8601 timestamp as returned by the API. */
  uploadedAt: string;
  type?: LumeoTypeValue;
  fileSize?: number;
  mimeType?: string;
  /** Original pixel dimensions, as returned by the API after upload. */
  width?: number;
  height?: number;
  /**
   * Previously saved crop selections for this image, if any — symmetric with
   * `SaveImagePayload.crops`: whatever was sent on save is expected back here on the next
   * `list`/`upload` response, so reopening the image re-populates the crop tool with the same
   * regions instead of starting from scratch.
   */
  crops?: CropRegion[];
}

export interface CropRegion {
  /** Local UI key for managing the region list. Not an image id. */
  id: string;
  name: string;
  /** Human readable ratio label shown in the UI, e.g. "16:9" or "Serbest". */
  aspectLabel: string;
  /** Locked width/height ratio used while resizing. Undefined = free-form. */
  aspect?: number;
  /** `aspect` formatted as a "WxH" ratio slug, e.g. "16x9" or "1x1". Undefined for free-form crops. */
  aspectRatio?: string;
  /** Usage-type value (`LumeoImageTypeOption.value`) this crop was seeded from, when created by selecting a usage type rather than a manual/custom aspect. Undefined for manual crops. */
  type?: LumeoTypeValue;
  /** `LumeoImageTypeOption.cropTypeId` for the usage type this crop was seeded from, if one was configured. Undefined for manual crops or types without a `cropTypeId`. */
  cropTypeId?: string | number;
  /**
   * Hex color used to draw this region's outline and its list dot. Assigned once at creation and
   * sent back on save — purely a display hint, so it's fine if your backend doesn't persist it:
   * `useCropRegions` regenerates a color for any region that comes back from the API without one.
   */
  color: string;
  /** All coordinates are in the original image's natural pixel space. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Per-entry satisfied status for one `required` usage type — see `RequiredImageTypesResult.statuses`. */
export interface RequiredTypeStatus {
  option: LumeoImageTypeOption;
  /** For a leaf: whether its own `value` has a crop anywhere in the list. For a group: whether ALL of `children` are satisfied. */
  satisfied: boolean;
  /**
   * Present only when `option` is a group (has `crops`) — the individual satisfied status of
   * each of its children, so you can render per-child progress (e.g. "Banner" red, "Kare Reklam"
   * green) even though the group's own `satisfied` only turns true once every child is. Every
   * child here has `children` itself undefined (only one level deep — groups aren't nested
   * more than the `imageTypes` config itself is).
   */
  children?: RequiredTypeStatus[];
  /**
   * The enclosing group entry `option` was configured inside (e.g. "Kapak" required individually,
   * but still defined under the "Haberler" group's `crops`) — undefined when `option` sits at the
   * top level of `imageTypes`. Purely informational, for display (e.g. showing "Haberler: Kapak"
   * instead of just "Kapak") — doesn't affect `satisfied`.
   */
  parent?: LumeoImageTypeOption;
}

/** Result of `checkRequiredImageTypes()` / `useRequiredImageTypes()` — whether every `required` usage type has a matching crop somewhere in the checked image list. */
export interface RequiredImageTypesResult {
  /** `true` once every `required` entry (group or leaf) is satisfied. `true` trivially when nothing is marked `required`. */
  valid: boolean;
  /** The `required` entries (group or leaf, as configured) that don't have a matching crop yet. Empty when `valid` is `true`. */
  missing: LumeoImageTypeOption[];
  /** Every `required` entry (group or leaf) with its current satisfied status — for rendering a full checklist rather than just what's missing. */
  statuses: RequiredTypeStatus[];
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

/** Which write action a `LumeoActionResult` is reporting on. */
export type LumeoActionKind = "upload" | "save" | "delete";

/**
 * Outcome of a single upload/save/delete request, passed to `LumeoConfig.onActionResult` once the
 * request settles — wire it into your own app's notification/toast system.
 */
export interface LumeoActionResult {
  action: LumeoActionKind;
  /** `true` for a 2xx response. `false` for a non-2xx response or a request that never completed (network error, etc). */
  success: boolean;
  /**
   * Human-readable message, when one is available: on failure, the response body's `message` or
   * `error` field if present, otherwise a generic "Request failed (status)" string, or — for a
   * request that never got a response at all — the thrown error's own message. Undefined for a
   * plain success with nothing to report.
   */
  message?: string;
  /** HTTP status code, when a response was actually received. Absent for network-level failures. */
  status?: number;
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
   * list, and a `clientId` JSON field on save/delete. String or numeric, your choice. The
   * package never reads or interprets this value — it only forwards it.
   */
  clientId?: LumeoTypeValue;
  /**
   * A second opaque, consumer-supplied identifier (e.g. a site id), forwarded alongside
   * `clientId` in every outgoing request the same way — `siteId` form field on upload, query
   * param on list, JSON field on save/delete. String or numeric, your choice. The package never
   * reads or interprets this value — it only forwards it.
   */
  siteId?: LumeoTypeValue;
  /**
   * Extra headers sent on every request (list/upload/save/delete) — e.g. an `Authorization`
   * bearer token for projects that require auth. Either a static object, or a function (sync or
   * async) called fresh before each request, so a token read from storage is always current
   * rather than captured once at config-creation time.
   */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
  /**
   * Called once every time an upload/save/delete request settles — success or failure — with a
   * `LumeoActionResult` (which action, whether it succeeded, an HTTP `status` when available, and
   * a `message` parsed from the response body or the thrown error). The package never shows its
   * own error UI; pipe this into your app's existing error/toast function to surface it to users.
   */
  onActionResult?: (result: LumeoActionResult) => void;
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
  type?: LumeoTypeValue;
  /**
   * Value of the parent "ana tip" (`LumeoImageTypeOption.crops` group) that the selected/cropped
   * usage type belongs to, when it was defined inside a nested group rather than top-level. Sits
   * at the same top level as `clientId` (both added by the API layer, not nested inside `crops`).
   * Omitted when the active type isn't part of any group.
   */
  typeId?: LumeoTypeValue;
  /** Preset sizes picked in the "Boyut Seçenekleri" tab — no manual crop coordinates. */
  sizes?: SelectedSize[];
  /** Manually dragged crop regions picked in the "Özel Kırpma" tab. */
  crops?: CropRegion[];
}

export type LumeoViewMode = "grid" | "detail";
