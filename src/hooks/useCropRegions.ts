import { useCallback, useState } from "react";
import { pickRegionColor } from "../components/ImageModal/CropStudio/colors";
import type { CropRegion } from "../types";

/**
 * Backfills a `color` and a unique `id` for any region missing one — e.g. crops loaded back from
 * an API that doesn't round-trip `color` (a pure display hint some backends don't persist), or
 * that sends `id: null`/omits it entirely. A missing or duplicate `id` is far worse than
 * cosmetic: `setActiveRegionId`/`updateRegion`/`removeRegion` are all keyed by `id`, so two or
 * more regions sharing the same (or an absent, `null`-coerced) id become impossible to select or
 * edit individually — clicking one selects/affects all of them at once. Colors are picked against
 * ones already assigned earlier in the same batch so hydrated regions stay distinguishable from
 * each other, same as freshly created ones.
 */
function normalizeRegions(regions: CropRegion[]): CropRegion[] {
  const usedColors: string[] = [];
  const usedIds = new Set<string>();
  return regions.map((region) => {
    const color = region.color || pickRegionColor(usedColors);
    usedColors.push(color);
    const id = region.id && !usedIds.has(region.id) ? region.id : crypto.randomUUID();
    usedIds.add(id);
    return region.color === color && region.id === id ? region : { ...region, color, id };
  });
}

export interface UseCropRegionsResult {
  regions: CropRegion[];
  activeRegionId: string | null;
  activeRegion: CropRegion | undefined;
  setActiveRegionId: (id: string | null) => void;
  addRegion: (region: CropRegion) => void;
  removeRegion: (id: string) => void;
  updateRegion: (id: string, patch: Partial<Omit<CropRegion, "id">>) => void;
  renameRegion: (id: string, name: string) => void;
}

/** Manages the list of named crop regions for a single image and which one is active/editable. */
export function useCropRegions(initial: CropRegion[] = []): UseCropRegionsResult {
  const [regions, setRegions] = useState<CropRegion[]>(() => normalizeRegions(initial));
  // Derived from the already-normalized `regions` (not `initial`) so it points at the same
  // (possibly regenerated) id — computing it from `initial` again would risk a mismatched,
  // independently-regenerated random id.
  const [activeRegionId, setActiveRegionId] = useState<string | null>(() => regions[0]?.id ?? null);

  const addRegion = useCallback((region: CropRegion) => {
    setRegions((prev) => [...prev, region]);
    setActiveRegionId(region.id);
  }, []);

  const removeRegion = useCallback((id: string) => {
    setRegions((prev) => prev.filter((region) => region.id !== id));
    setActiveRegionId((current) => (current === id ? null : current));
  }, []);

  const updateRegion = useCallback((id: string, patch: Partial<Omit<CropRegion, "id">>) => {
    setRegions((prev) => prev.map((region) => (region.id === id ? { ...region, ...patch } : region)));
  }, []);

  const renameRegion = useCallback(
    (id: string, name: string) => updateRegion(id, { name }),
    [updateRegion]
  );

  const activeRegion = regions.find((region) => region.id === activeRegionId);

  return {
    regions,
    activeRegionId,
    activeRegion,
    setActiveRegionId,
    addRegion,
    removeRegion,
    updateRegion,
    renameRegion,
  };
}
