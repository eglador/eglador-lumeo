import type { LumeoImageTypeOption, LumeoLocale } from "../types";
import { resolveLocale } from "./i18n";

export const DEFAULT_IMAGE_TYPES_EN: LumeoImageTypeOption[] = [
  { value: "manset", label: "Headline", aspect: 16 / 9, width: 1920, height: 1080 },
  { value: "kapak", label: "Cover", aspect: 4 / 3, width: 1200, height: 900 },
  { value: "banner", label: "Banner", aspect: 21 / 9, width: 2100, height: 900 },
  { value: "schema", label: "Schema", aspect: 1, width: 1080, height: 1080 },
  { value: "thumbnail", label: "Thumbnail", aspect: 1, width: 300, height: 300 },
  { value: "galeri", label: "Gallery" },
];

export const DEFAULT_IMAGE_TYPES_TR: LumeoImageTypeOption[] = [
  { value: "manset", label: "Manşet", aspect: 16 / 9, width: 1920, height: 1080 },
  { value: "kapak", label: "Kapak", aspect: 4 / 3, width: 1200, height: 900 },
  { value: "banner", label: "Banner", aspect: 21 / 9, width: 2100, height: 900 },
  { value: "schema", label: "Schema", aspect: 1, width: 1080, height: 1080 },
  { value: "thumbnail", label: "Küçük Görsel", aspect: 1, width: 300, height: 300 },
  { value: "galeri", label: "Galeri Görseli" },
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

export function findImageTypeLabel(
  value: string | undefined,
  options: LumeoImageTypeOption[]
): string | undefined {
  if (!value) return undefined;
  return options.find((option) => option.value === value)?.label;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Reduces exact pixel dimensions to a simple ratio label, e.g. 1920×1080 -> "16:9". */
function ratioLabelFromDimensions(width: number, height: number): string {
  const divisor = gcd(width, height) || 1;
  return `${width / divisor}:${height / divisor}`;
}

/** Approximates a decimal aspect ratio as the closest small-integer fraction, e.g. 1.777... -> "16:9". */
function ratioLabelFromAspect(aspect: number): string {
  let best = { num: 1, den: 1, error: Infinity };
  for (let den = 1; den <= 32; den++) {
    const num = Math.round(aspect * den);
    if (num <= 0) continue;
    const error = Math.abs(num / den - aspect);
    if (error < best.error - 1e-9) best = { num, den, error };
  }
  const divisor = gcd(best.num, best.den) || 1;
  return `${best.num / divisor}:${best.den / divisor}`;
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
