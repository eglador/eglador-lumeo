import { useState } from "react";
import { Download } from "lucide-react";
import { downloadOriginalImage } from "../../lib/downloadImage";
import type { LumeoImage } from "../../types";

export interface DownloadButtonProps {
  image: LumeoImage;
  label: string;
  className?: string;
}

/**
 * Downloads the image's full-size original (`url`, not the gallery's `thumbUrl`). Rendered as a
 * sibling of the gallery item's own `<button>` (never nested inside it — invalid HTML), so its
 * click never opens the image popup.
 */
export function DownloadButton({ image, label, className = "" }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  return (
    <button
      type="button"
      title={label}
      aria-label={`${label}: ${image.fileName}`}
      disabled={isDownloading}
      onClick={() => {
        setIsDownloading(true);
        downloadOriginalImage(image).finally(() => setIsDownloading(false));
      }}
      className={`lumeo:inline-flex lumeo:h-8 lumeo:w-8 lumeo:items-center lumeo:justify-center lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:bg-white/90 lumeo:text-zinc-600 lumeo:shadow-xs lumeo:transition lumeo:hover:bg-white lumeo:hover:text-zinc-900 lumeo:focus-visible:outline-none lumeo:focus-visible:ring-2 lumeo:focus-visible:ring-zinc-900/20 lumeo:disabled:cursor-wait lumeo:disabled:opacity-60 ${className}`}
    >
      <Download size={15} className={isDownloading ? "lumeo:animate-pulse" : undefined} />
    </button>
  );
}
