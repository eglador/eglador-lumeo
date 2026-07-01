import type { LumeoConfig, ValidateFilesResult } from "../types";

const DEFAULT_ACCEPT = ["image/*"];
const DEFAULT_MAX_FILE_SIZE_MB = 10;

function matchesAccept(mimeType: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith("/*")) {
      return mimeType.startsWith(pattern.slice(0, -1));
    }
    return mimeType === pattern;
  });
}

/**
 * Validates a batch of files against the configured accept list and max size.
 * Each file is judged independently: a batch of 10 files where 2 exceed the
 * size limit still accepts the other 8.
 */
export function validateFiles(
  files: File[],
  config: Pick<LumeoConfig, "accept" | "maxFileSizeMB" | "maxFiles">,
  currentCount = 0
): ValidateFilesResult {
  const accept = config.accept ?? DEFAULT_ACCEPT;
  const maxSizeBytes = (config.maxFileSizeMB ?? DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024;

  const accepted: File[] = [];
  const rejected: ValidateFilesResult["rejected"] = [];
  let remainingSlots =
    config.maxFiles !== undefined ? Math.max(config.maxFiles - currentCount, 0) : Infinity;

  for (const file of files) {
    if (!matchesAccept(file.type, accept)) {
      rejected.push({ file, reason: "type" });
      continue;
    }
    if (file.size > maxSizeBytes) {
      rejected.push({ file, reason: "size" });
      continue;
    }
    if (remainingSlots <= 0) {
      rejected.push({ file, reason: "max-files" });
      continue;
    }
    accepted.push(file);
    remainingSlots -= 1;
  }

  return { accepted, rejected };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}
