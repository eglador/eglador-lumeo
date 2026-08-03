import type { LumeoActionKind, LumeoActionResult, LumeoConfig } from "../types";

/** Best-effort human-readable message for a failed response — the body's `message`/`error` field when present, otherwise a generic status-based fallback. */
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.clone().json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
  } catch {
    // body wasn't JSON (or was empty/already consumed) — fall through to the generic message
  }
  return `Request failed (${res.status})`;
}

async function resolveActionResult(
  action: LumeoActionKind,
  actionPromise: Promise<Response>
): Promise<LumeoActionResult> {
  try {
    const res = await actionPromise;
    if (res.ok) return { action, success: true, status: res.status };
    return { action, success: false, status: res.status, message: await extractErrorMessage(res) };
  } catch (err) {
    return { action, success: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Shared refresh-after-write behavior for uploads and modal saves/deletes, plus reporting the
 * outcome via `config.onActionResult` (if set) regardless of `waitForSuccess`.
 *
 * waitForSuccess = true: await the request and refetch the list exactly once,
 * only if the response indicates success.
 * waitForSuccess = false (default): refetch the list exactly once immediately,
 * without waiting for the request to settle (the backend may be unavailable).
 */
export function refreshOnce(
  config: LumeoConfig,
  action: LumeoActionKind,
  actionPromise: Promise<Response>,
  refetch: () => void
): void {
  if (config.onActionResult) {
    resolveActionResult(action, actionPromise).then(config.onActionResult);
  }

  if (config.waitForSuccess) {
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
