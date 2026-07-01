import type { LumeoImageTypeOption, LumeoLocale } from "../types";
import { resolveLocale } from "./i18n";

export const DEFAULT_IMAGE_TYPES_EN: LumeoImageTypeOption[] = [
  { value: "manset", label: "Headline", aspect: 16 / 9 },
  { value: "kapak", label: "Cover", aspect: 4 / 3 },
  { value: "banner", label: "Banner", aspect: 21 / 9 },
  { value: "schema", label: "Schema", aspect: 1 },
  { value: "thumbnail", label: "Thumbnail", aspect: 1 },
  { value: "galeri", label: "Gallery" },
];

export const DEFAULT_IMAGE_TYPES_TR: LumeoImageTypeOption[] = [
  { value: "manset", label: "Manşet", aspect: 16 / 9 },
  { value: "kapak", label: "Kapak", aspect: 4 / 3 },
  { value: "banner", label: "Banner", aspect: 21 / 9 },
  { value: "schema", label: "Schema", aspect: 1 },
  { value: "thumbnail", label: "Küçük Görsel", aspect: 1 },
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
