import { useMemo } from "react";
import { checkRequiredImageTypes, resolveImageTypes } from "../lib/imageTypes";
import type { LumeoConfig, LumeoImage, RequiredImageTypesResult } from "../types";

/**
 * Reactive wrapper around `checkRequiredImageTypes()` — recomputes whenever `images` or the
 * resolved `imageTypes` change. Typically fed the `images`/`allImages` array from `useLumeoImages`
 * so a consuming app can gate its own UI (e.g. disable a save button) once every usage type
 * marked `required` has at least one matching crop somewhere in the list.
 */
export function useRequiredImageTypes(images: LumeoImage[], config: LumeoConfig): RequiredImageTypesResult {
  const imageTypes = useMemo(
    () => resolveImageTypes(config.imageTypes, config.locale),
    [config.imageTypes, config.locale]
  );
  return useMemo(() => checkRequiredImageTypes(images, imageTypes), [images, imageTypes]);
}
