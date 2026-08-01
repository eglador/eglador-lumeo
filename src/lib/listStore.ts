import type { LumeoImage } from "../types";

type Listener = (images: LumeoImage[]) => void;

const listeners = new Map<string, Set<Listener>>();

/**
 * Subscribes to updates for a given list key (see `resolveListKey`). Every `useLumeoImages`
 * instance pointed at the same effective list subscribes here, so a single successful fetch
 * anywhere — the initial load, a refetch after upload/save/delete, a manual `refetch()` — reaches
 * every one of them without a manual refresh. Returns an unsubscribe function.
 */
export function subscribeToList(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(key);
  };
}

/** Pushes freshly fetched `images` to every subscriber sharing `key` — including the caller itself. */
export function broadcastListUpdate(key: string, images: LumeoImage[]): void {
  listeners.get(key)?.forEach((listener) => listener(images));
}
