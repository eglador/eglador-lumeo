import type { SizePresetOption, LumeoLocale } from "../types";
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
  return preset.label ?? `${preset.width}×${preset.height}`;
}
