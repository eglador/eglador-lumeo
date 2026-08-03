import { useCallback, useEffect, useRef, useState } from "react";
import { fetchImageList, resolveListKey } from "../lib/api";
import { subscribeToList, broadcastListUpdate } from "../lib/listStore";
import { resolveImageTypes, flattenImageTypes, imageMatchesType } from "../lib/imageTypes";
import type { LumeoConfig, LumeoImage, LumeoTypeValue } from "../types";

export interface UseLumeoImagesOptions {
  /**
   * Filter the returned `images` array to a single usage type — matches either the image's own
   * `type` field (classic single-tag flow) or, for a `cropByUsageType`-tagged image, any of its
   * `crops[]` for this type (see `imageMatchesType`). `allImages` is always unfiltered.
   */
  type?: LumeoTypeValue;
  /** Skip the automatic fetch on mount; call `refetch()` manually instead. */
  skipInitialFetch?: boolean;
}

export interface UseLumeoImagesResult {
  images: LumeoImage[];
  allImages: LumeoImage[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches the image list from the configured `list` endpoint and optionally filters it by usage
 * type. This is the primary helper for consuming uploaded/tagged images elsewhere in a Next.js
 * app.
 *
 * Every instance pointed at the same effective list (same endpoint + `clientId`/`siteId`) shares
 * one live cache: a successful fetch from *any* instance — including the package's own internal
 * uses inside `LumeoUploader`/`ImageModal` after an upload/save/delete — updates every other
 * instance too, automatically, no manual `refetch()` needed to stay in sync.
 */
export function useLumeoImages(
  config: LumeoConfig,
  options: UseLumeoImagesOptions = {}
): UseLumeoImagesResult {
  const { type, skipInitialFetch } = options;
  const listKey = resolveListKey(config);
  const [allImages, setAllImages] = useState<LumeoImage[]>([]);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    fetchImageList(config)
      .then((images) => {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          // Goes through the shared store (not a direct setAllImages) so every other instance
          // subscribed to the same list key picks up this fetch too.
          broadcastListUpdate(listKey, images);
        }
      })
      .catch((err: unknown) => {
        if (requestIdRef.current === requestId) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, listKey]);

  useEffect(() => subscribeToList(listKey, setAllImages), [listKey]);

  useEffect(() => {
    if (!skipInitialFetch) {
      refetch();
    }
    // Intentionally scoped to the list endpoint identity, not `refetch`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoints.list]);

  let images = allImages;
  if (type !== undefined) {
    // Resolve the raw filter value (a native `<select>`'s value is always a string, even when the
    // configured `value`/`type` is numeric) back to its full option, so cropByUsageType-tagged
    // images can be matched via `cropTypeId` too, not just the classic top-level `type` field.
    const leaves = flattenImageTypes(resolveImageTypes(config.imageTypes, config.locale));
    const option = leaves.find((candidate) => String(candidate.value) === String(type)) ?? {
      value: type,
      label: String(type),
    };
    images = allImages.filter((image) => imageMatchesType(image, option));
  }

  return { images, allImages, loading, error, refetch };
}
