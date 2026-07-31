import type { LumeoImageTypeOption, LumeoLocale, LumeoImage, LumeoTypeValue } from "../types";
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
 * Finds the enclosing group's `value` for a leaf option's `value`, when that leaf was defined
 * inside a group's `crops` rather than top-level. Returns undefined for ungrouped options — this
 * is what gets sent back as `SaveImagePayload.typeId`.
 */
export function findGroupValueForType(
  options: LumeoImageTypeOption[],
  value: LumeoTypeValue | undefined
): LumeoTypeValue | undefined {
  if (value === undefined) return undefined;
  for (const option of options) {
    if (!option.crops || option.crops.length === 0) continue;
    if (option.crops.some((child) => child.value === value)) return option.value;
    const nested = findGroupValueForType(option.crops, value);
    if (nested !== undefined) return nested;
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
 * Human readable labels for the crops already saved on an image — the usage type's label when a
 * crop carries one (`cropByUsageType` flow), otherwise the crop's own name (manual/custom crops).
 * Empty array when the image hasn't been cropped yet.
 */
export function resolveCropLabels(image: LumeoImage, imageTypes: LumeoImageTypeOption[]): string[] {
  if (!image.crops || image.crops.length === 0) return [];
  return image.crops.map((crop) =>
    crop.type !== undefined ? (findImageTypeLabel(crop.type, imageTypes) ?? String(crop.type)) : crop.name
  );
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
