import type { SizePresetOption, SizePresetSize, SelectedSize, LumeoLocale } from "../types";
import { resolveLocale } from "./i18n";

export const DEFAULT_SIZE_PRESETS_EN: SizePresetOption[] = [
  { id: "400x400", width: 400, height: 400 },
  { id: "800x600", width: 800, height: 600 },
  { id: "1024x768", width: 1024, height: 768 },
  { id: "1200x630", width: 1200, height: 630, label: "1200×630 (Social Media)" },
  { id: "1920x1080", width: 1920, height: 1080 },
];

export const DEFAULT_SIZE_PRESETS_TR: SizePresetOption[] = [
  { id: "400x400", width: 400, height: 400 },
  { id: "800x600", width: 800, height: 600 },
  { id: "1024x768", width: 1024, height: 768 },
  { id: "1200x630", width: 1200, height: 630, label: "1200×630 (Sosyal Medya)" },
  { id: "1920x1080", width: 1920, height: 1080 },
];

/** English default size presets. Use `DEFAULT_SIZE_PRESETS_TR` for the Turkish set. */
export const DEFAULT_SIZE_PRESETS = DEFAULT_SIZE_PRESETS_EN;

export function resolveSizePresets(
  configured?: SizePresetOption[],
  locale?: LumeoLocale
): SizePresetOption[] {
  if (configured && configured.length > 0) return configured;
  return resolveLocale(locale) === "tr" ? DEFAULT_SIZE_PRESETS_TR : DEFAULT_SIZE_PRESETS_EN;
}

export function formatSizeLabel(preset: SizePresetOption): string {
  if (preset.label) return preset.label;
  if (preset.sizes && preset.sizes.length > 0) {
    return preset.sizes.map((size) => size.label ?? `${size.width}×${size.height}`).join(", ");
  }
  return `${preset.width}×${preset.height}`;
}

/** Expands a preset to its full list of concrete output boxes — one entry for a plain preset, several for a nested group. */
export function expandPresetSizes(preset: SizePresetOption): SizePresetSize[] {
  if (preset.sizes && preset.sizes.length > 0) {
    return preset.sizes.map((size) => ({
      width: size.width,
      height: size.height,
      label: size.label ?? `${size.width}×${size.height}`,
    }));
  }
  return [{ width: preset.width!, height: preset.height!, label: formatSizeLabel(preset) }];
}

/** Normalizes a selected preset into the shape sent to the API — same contract whether the preset is plain or nested. */
export function toSelectedSize(preset: SizePresetOption): SelectedSize {
  return { id: preset.id, label: formatSizeLabel(preset), sizes: expandPresetSizes(preset) };
}
