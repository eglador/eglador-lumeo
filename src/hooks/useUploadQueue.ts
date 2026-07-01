import { useCallback, useState } from "react";
import { validateFiles } from "../lib/validateFiles";
import { uploadImages } from "../lib/api";
import { refreshOnce } from "../lib/refreshOnce";
import type { LumeoConfig, RejectedFile } from "../types";

export interface PendingFile {
  /** Local-only key for list rendering and removal. Not an image id. */
  id: string;
  file: File;
  previewUrl: string;
}

export interface UseUploadQueueResult {
  pending: PendingFile[];
  rejected: RejectedFile[];
  addFiles: (files: FileList | File[]) => void;
  removePending: (id: string) => void;
  clearRejected: () => void;
  isUploading: boolean;
  upload: () => Promise<void>;
}

export function useUploadQueue(config: LumeoConfig, refetchList: () => void): UseUploadQueueResult {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const result = validateFiles(fileArray, config, pending.length);
      setPending((prev) => [
        ...prev,
        ...result.accepted.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]);
      if (result.rejected.length > 0) {
        setRejected((prev) => [...prev, ...result.rejected]);
      }
    },
    [config, pending.length]
  );

  const removePending = useCallback((id: string) => {
    setPending((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const clearRejected = useCallback(() => setRejected([]), []);

  const upload = useCallback(async () => {
    if (pending.length === 0) return;
    setIsUploading(true);
    const files = pending.map((item) => item.file);
    const actionPromise = uploadImages(config, files);
    refreshOnce(config.waitForSuccess, actionPromise, refetchList);
    try {
      await actionPromise;
    } finally {
      pending.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setPending([]);
      setIsUploading(false);
    }
  }, [pending, config, refetchList]);

  return { pending, rejected, addFiles, removePending, clearRejected, isUploading, upload };
}
