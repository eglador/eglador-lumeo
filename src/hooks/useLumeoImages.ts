import { useCallback, useEffect, useRef, useState } from "react";
import { fetchImageList } from "../lib/api";
import type { LumeoConfig, LumeoImage, LumeoTypeValue } from "../types";

export interface UseLumeoImagesOptions {
  /** Filter the returned `images` array to a single usage type. `allImages` is always unfiltered. */
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
 * Fetches the image list from the configured `list` endpoint and optionally
 * filters it by usage type. This is the primary helper for consuming
 * uploaded/tagged images elsewhere in a Next.js app.
 */
export function useLumeoImages(
  config: LumeoConfig,
  options: UseLumeoImagesOptions = {}
): UseLumeoImagesResult {
  const { type, skipInitialFetch } = options;
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
          setAllImages(images);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (requestIdRef.current === requestId) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
  }, [config]);

  useEffect(() => {
    if (!skipInitialFetch) {
      refetch();
    }
    // Intentionally scoped to the list endpoint identity, not `refetch`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoints.list]);

  // Compared as strings: a native `<select>`'s value is always a string even when the configured
  // `value`/`type` is numeric, so a strict `===` would otherwise never match a numeric type.
  const images =
    type !== undefined ? allImages.filter((image) => image.type !== undefined && String(image.type) === String(type)) : allImages;

  return { images, allImages, loading, error, refetch };
}
