import { useCallback, useState } from "react";
import { pickRegionColor } from "../components/ImageModal/CropStudio/colors";
import type { CropRegion } from "../types";

/**
 * Backfills a color for any region missing one — e.g. crops loaded back from an API that doesn't
 * round-trip `color` (some backends only persist geometry/type, not this purely visual hint).
 * Picks against colors already assigned earlier in the same batch so hydrated regions stay as
 * distinguishable from each other as freshly created ones.
 */
function withColors(regions: CropRegion[]): CropRegion[] {
  const used: string[] = [];
  return regions.map((region) => {
    const color = region.color || pickRegionColor(used);
    used.push(color);
    return region.color ? region : { ...region, color };
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
  const [regions, setRegions] = useState<CropRegion[]>(() => withColors(initial));
  const [activeRegionId, setActiveRegionId] = useState<string | null>(initial[0]?.id ?? null);

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
