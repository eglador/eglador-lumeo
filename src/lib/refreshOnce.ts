/**
 * Shared refresh-after-write behavior for uploads and modal saves.
 *
 * waitForSuccess = true: await the request and refetch the list exactly once,
 * only if the response indicates success.
 * waitForSuccess = false (default): refetch the list exactly once immediately,
 * without waiting for the request to settle (the backend may be unavailable).
 */
export function refreshOnce(
  waitForSuccess: boolean | undefined,
  actionPromise: Promise<Response>,
  refetch: () => void
): void {
  if (waitForSuccess) {
    actionPromise
      .then((res) => {
        if (res.ok) refetch();
      })
      .catch(() => {
        // request never resolved successfully; skip the refresh
      });
    return;
  }

  actionPromise.catch(() => {
    // backend may not be ready yet; the list refresh below still happens
  });
  refetch();
}
