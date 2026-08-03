import type {
  LumeoImageTypeOption,
  LumeoLocale,
  LumeoImage,
  LumeoTypeValue,
  RequiredImageTypesResult,
  RequiredTypeStatus,
  CropRegion,
} from "../types";
import { resolveLocale } from "./i18n";

export const DEFAULT_IMAGE_TYPES_EN: LumeoImageTypeOption[] = [
  { value: "manset", label: "Headline", aspect: 16 / 9, width: 1920, height: 1080, cropTypeId: 1 },
  { value: "kapak", label: "Cover", aspect: 4 / 3, width: 1200, height: 900, cropTypeId: 2 },
  { value: "banner", label: "Banner", aspect: 21 / 9, width: 2100, height: 900, cropTypeId: 3 },
  { value: "schema", label: "Schema", aspect: 1, width: 1080, height: 1080, cropTypeId: 4 },
  { value: "thumbnail", label: "Thumbnail", aspect: 1, width: 300, height: 300, cropTypeId: 5 },
  { value: "galeri", label: "Gallery", cropTypeId: 6 },
];

export const DEFAULT_IMAGE_TYPES_TR: LumeoImageTypeOption[] = [
  { value: "manset", label: "Manşet", aspect: 16 / 9, width: 1920, height: 1080, cropTypeId: 1 },
  { value: "kapak", label: "Kapak", aspect: 4 / 3, width: 1200, height: 900, cropTypeId: 2 },
  { value: "banner", label: "Banner", aspect: 21 / 9, width: 2100, height: 900, cropTypeId: 3 },
  { value: "schema", label: "Schema", aspect: 1, width: 1080, height: 1080, cropTypeId: 4 },
  { value: "thumbnail", label: "Küçük Görsel", aspect: 1, width: 300, height: 300, cropTypeId: 5 },
  { value: "galeri", label: "Galeri Görseli", cropTypeId: 6 },
];

/** English default image-usage types. Use `DEFAULT_IMAGE_TYPES_TR` for the Turkish set. */
export const DEFAULT_IMAGE_TYPES = DEFAULT_IMAGE_TYPES_EN;

export function resolveImageTypes(
  configured?: LumeoImageTypeOption[],
  locale?: LumeoLocale
): LumeoImageTypeOption[] {
  if (configured && configured.length > 0) return configured;
  return resolveLocale(locale) === "tr" ? DEFAULT_IMAGE_TYPES_TR : DEFAULT_IMAGE_TYPES_EN;
}

/**
 * Whether a saved crop region was seeded from a given usage-type option — prefers matching by
 * `cropTypeId` (the stable backend identifier) when both sides have one configured, since a
 * backend id survives a `value`/slug rename; falls back to the slug-like `type`/`value` otherwise.
 * Used to decide whether a type button should show as already-active (green/checked) for a region.
 */
export function regionMatchesOption(region: CropRegion, option: LumeoImageTypeOption): boolean {
  if (region.cropTypeId !== undefined && option.cropTypeId !== undefined) {
    return region.cropTypeId === option.cropTypeId;
  }
  return region.type === option.value;
}

/** Stable React list key for a usage-type option — combines `value` with `cropTypeId` (when set) so options that might otherwise share the same `value` don't collide. */
export function imageTypeKey(option: LumeoImageTypeOption): string {
  return option.cropTypeId !== undefined ? `${option.value}:${option.cropTypeId}` : String(option.value);
}

/**
 * Expands grouped usage-type options (entries with `crops`) into the flat list of actually
 * selectable/croppable leaf options — a group entry itself is never selectable, only its
 * children are. Used anywhere a type needs to be looked up or listed by `value`, regardless of
 * whether the caller's configured `imageTypes` uses grouping.
 */
export function flattenImageTypes(options: LumeoImageTypeOption[]): LumeoImageTypeOption[] {
  return options.flatMap((option) =>
    option.crops && option.crops.length > 0 ? flattenImageTypes(option.crops) : [option]
  );
}

/**
 * Finds the enclosing group entry for an option's `value`, when it was defined inside a group's
 * `crops` rather than top-level (at any nesting depth). Returns undefined for ungrouped/top-level
 * options.
 */
export function findParentImageType(
  options: LumeoImageTypeOption[],
  value: LumeoTypeValue | undefined
): LumeoImageTypeOption | undefined {
  if (value === undefined) return undefined;
  for (const option of options) {
    if (!option.crops || option.crops.length === 0) continue;
    if (option.crops.some((child) => child.value === value)) return option;
    const nested = findParentImageType(option.crops, value);
    if (nested) return nested;
  }
  return undefined;
}

/**
 * Finds the enclosing group's `value` for a leaf option's `value` — this is what gets sent back
 * as `SaveImagePayload.typeId`. Returns undefined for ungrouped options.
 */
export function findGroupValueForType(
  options: LumeoImageTypeOption[],
  value: LumeoTypeValue | undefined
): LumeoTypeValue | undefined {
  return findParentImageType(options, value)?.value;
}

/**
 * Same idea as `findGroupValueForType`, but for a saved crop region instead of a raw `value` —
 * resolves which configured leaf the region matches via `regionMatchesOption` (`cropTypeId` first,
 * `type`/`value` as fallback) rather than trusting `region.type` alone. This matters because
 * `region.type` isn't always reliably round-tripped by every backend (some only persist
 * `cropTypeId`), so relying on `type` alone can silently drop `typeId` from the save payload even
 * though the modal correctly shows the type as active (via that same `cropTypeId` match). Checks
 * `regions` in order and returns as soon as one resolves to a configured leaf, whether or not that
 * leaf turns out to be grouped (mirrors `findGroupValueForType`'s "undefined for ungrouped" rule).
 */
export function findGroupValueForCropRegions(
  imageTypes: LumeoImageTypeOption[],
  regions: CropRegion[]
): LumeoTypeValue | undefined {
  const leaves = flattenImageTypes(imageTypes);
  for (const region of regions) {
    const leaf = leaves.find((option) => regionMatchesOption(region, option));
    if (leaf) return findParentImageType(imageTypes, leaf.value)?.value;
  }
  return undefined;
}

export function findImageTypeLabel(
  value: LumeoTypeValue | undefined,
  options: LumeoImageTypeOption[]
): string | undefined {
  if (value === undefined) return undefined;
  return flattenImageTypes(options).find((option) => option.value === value)?.label;
}

/**
 * Whether an image is tagged with a given usage-type option — either via its own top-level `type`
 * field (classic single-tag flow) or via any of its `crops[]` (`cropByUsageType` flow, matched the
 * same `cropTypeId`-first way as everywhere else, see `regionMatchesOption`). An image saved
 * through `cropByUsageType` never gets a top-level `type` at all — only its crops carry one — so
 * filtering by `image.type` alone misses it entirely; this checks both places.
 */
export function imageMatchesType(image: LumeoImage, option: LumeoImageTypeOption): boolean {
  if (image.type !== undefined && String(image.type) === String(option.value)) return true;
  return (image.crops ?? []).some((crop) => regionMatchesOption(crop, option));
}

/** A visual segment for rendering usage-type options: either a group (heading + nested children) or a run of consecutive plain options that should flow/wrap together as one row. */
export type ImageTypeSegment =
  | { kind: "group"; option: LumeoImageTypeOption }
  | { kind: "row"; options: LumeoImageTypeOption[] };

/**
 * Splits a configured `imageTypes` list into display segments — consecutive plain (non-grouped)
 * entries are merged into one "row" segment so they keep wrapping together as before; each group
 * entry (has `crops`) becomes its own "group" segment, rendered as a heading over its children.
 */
export function segmentImageTypes(options: LumeoImageTypeOption[]): ImageTypeSegment[] {
  const segments: ImageTypeSegment[] = [];
  for (const option of options) {
    if (option.crops && option.crops.length > 0) {
      segments.push({ kind: "group", option });
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && last.kind === "row") last.options.push(option);
    else segments.push({ kind: "row", options: [option] });
  }
  return segments;
}

/**
 * Human readable labels for the crops already saved on an image — always the crop's own `name`
 * (set once at creation time: the usage type's label for a `cropByUsageType` crop, or a generated
 * "Crop N" for a manual one). Empty array when the image hasn't been cropped yet.
 */
export function resolveCropLabels(image: LumeoImage): string[] {
  if (!image.crops || image.crops.length === 0) return [];
  return image.crops.map((crop) => crop.name);
}

/** Every crop region saved on any image in the list, flattened into one array. */
function collectAllCrops(images: LumeoImage[]): CropRegion[] {
  return images.flatMap((image) => image.crops ?? []);
}

/**
 * Builds a leaf's status by checking whether any saved crop matches it — via `regionMatchesOption`,
 * so this prefers `cropTypeId` the same way the modal's own active/checked state does, falling
 * back to the slug-like `type`/`value` when either side lacks a `cropTypeId`. For a group, builds
 * one status per child (so per-child progress can be rendered) and the group itself is `satisfied`
 * only once every child is.
 */
function buildRequiredStatus(option: LumeoImageTypeOption, crops: CropRegion[]): RequiredTypeStatus {
  if (option.crops && option.crops.length > 0) {
    const children = flattenImageTypes(option.crops).map((leaf) => ({
      option: leaf,
      satisfied: crops.some((crop) => regionMatchesOption(crop, leaf)),
    }));
    return { option, satisfied: children.every((child) => child.satisfied), children };
  }
  return { option, satisfied: crops.some((crop) => regionMatchesOption(crop, option)) };
}

/** Every entry (group or leaf, at any nesting depth) that carries its own `required: true`. */
function collectRequiredEntries(options: LumeoImageTypeOption[]): LumeoImageTypeOption[] {
  const required: LumeoImageTypeOption[] = [];
  for (const option of options) {
    if (option.required) required.push(option);
    if (option.crops && option.crops.length > 0) required.push(...collectRequiredEntries(option.crops));
  }
  return required;
}

/**
 * Checks every `required` usage type (see `LumeoImageTypeOption.required`) against the **whole**
 * `images` list at once — not per image. A plain/leaf `required` entry needs at least one matching
 * crop somewhere in the list; a group `required` entry needs a matching crop for **every one** of
 * its children somewhere in the list (an "all of these" requirement — mark individual children
 * `required` instead if you only need some subset covered). A crop "matches" an option the same
 * way the modal's own active/checked state decides it (see `regionMatchesOption`): by
 * `cropTypeId` when both sides have one, otherwise by the slug-like `type`/`value`. Intended for a
 * consuming app to gate its own UI (e.g. disable a save button) — the package itself never blocks
 * anything based on this.
 */
export function checkRequiredImageTypes(
  images: LumeoImage[],
  imageTypes: LumeoImageTypeOption[]
): RequiredImageTypesResult {
  const crops = collectAllCrops(images);
  const statuses: RequiredTypeStatus[] = collectRequiredEntries(imageTypes).map((option) => ({
    ...buildRequiredStatus(option, crops),
    parent: findParentImageType(imageTypes, option.value),
  }));
  const missing = statuses.filter((status) => !status.satisfied).map((status) => status.option);
  return { valid: missing.length === 0, missing, statuses };
}

/**
 * Plain-text label for a `required` entry (e.g. for a toast or `alert`) — a leaf's own label, or
 * for a group its label followed by every child's label in parentheses, e.g.
 * `"Reklam (Banner, Kare Reklam)"`. For a richer display that colors each child individually by
 * its own satisfied state, render `RequiredTypeStatus.children` yourself instead (see the
 * `LumeoUploader / CropByUsageTypeDemo` story or the README).
 */
export function formatRequiredEntryLabel(option: LumeoImageTypeOption): string {
  if (option.crops && option.crops.length > 0) {
    const childLabels = flattenImageTypes(option.crops).map((child) => child.label);
    return `${option.name ?? option.label} (${childLabels.join(", ")})`;
  }
  return option.label;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Reduces exact pixel dimensions to a simple ratio label, e.g. 1920×1080 -> "16:9". */
function ratioLabelFromDimensions(width: number, height: number): string {
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

/** Approximates a decimal aspect ratio as the closest small-integer fraction, e.g. 1.777... -> {num: 16, den: 9}. */
function simplifyAspectToFraction(aspect: number): { num: number; den: number } {
  let best = { num: 1, den: 1, error: Infinity };
  for (let den = 1; den <= 32; den++) {
    const num = Math.round(aspect * den);
    if (num <= 0) continue;
    const error = Math.abs(num / den - aspect);
    if (error < best.error - 1e-9) best = { num, den, error };
  }
  const divisor = gcd(best.num, best.den) || 1;
  return { num: best.num / divisor, den: best.den / divisor };
}

/** Approximates a decimal aspect ratio as the closest small-integer fraction, e.g. 1.777... -> "16:9". */
function ratioLabelFromAspect(aspect: number): string {
  const { num, den } = simplifyAspectToFraction(aspect);
  return `${num}:${den}`;
}

/** Same reduction as `ratioLabelFromAspect`, formatted as a "WxH" slug, e.g. 1.777... -> "16x9". Used on `CropRegion.aspectRatio`. */
export function formatAspectRatioSlug(aspect: number): string {
  const { num, den } = simplifyAspectToFraction(aspect);
  return `${num}x${den}`;
}

/**
 * Human readable "ratio · WxH" string for a usage type, e.g. "16:9 · 1920×1080", used to show
 * the type's preferred crop shape next to its label. Returns undefined when the option has
 * neither `aspect` nor `width`/`height`.
 */
export function formatImageTypeMeta(option: LumeoImageTypeOption): string | undefined {
  const hasDimensions = Boolean(option.width && option.height);
  // Prefer the explicit `aspect` for the label — it preserves conventional names (e.g. "21:9")
  // that a GCD reduction of the pixel dimensions could otherwise collapse (e.g. to "7:3").
  const ratio = option.aspect
    ? ratioLabelFromAspect(option.aspect)
    : hasDimensions
      ? ratioLabelFromDimensions(option.width!, option.height!)
      : undefined;
  const dims = hasDimensions ? `${option.width}×${option.height}` : undefined;
  if (ratio && dims) return `${ratio} · ${dims}`;
  return ratio ?? dims;
}
