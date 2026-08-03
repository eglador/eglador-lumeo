import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useLumeoImages } from "../../hooks/useLumeoImages";
import { useUploadQueue } from "../../hooks/useUploadQueue";
import { resolveImageTypes } from "../../lib/imageTypes";
import { getMessages } from "../../lib/i18n";
import { DropZone } from "./DropZone";
import { PendingFileList } from "./PendingFileList";
import { RejectedFileNotice } from "./RejectedFileNotice";
import { ImageGallery } from "../Gallery/ImageGallery";
import { ImageModal } from "../ImageModal/ImageModal";
import { LoadingBar } from "../shared/LoadingBar";
import { primaryButton } from "../../styles/editorial";
import type { LumeoImage, LumeoViewMode } from "../../types";

export interface LumeoUploaderProps {
  className?: string;
  defaultViewMode?: LumeoViewMode;
  /** Forwarded to the `ImageModal` opened when an image is selected — see `ImageModalProps.cropByUsageType`. */
  cropByUsageType?: boolean;
  /**
   * Hides the built-in gallery (and, by extension, the tag/crop modal it opens) below the
   * dropzone — just the drag & drop upload area is rendered. Useful when you're already showing
   * the uploaded images your own way elsewhere (e.g. via `useLumeoImages`) and don't need them
   * duplicated here. Default: false.
   */
  hideGallery?: boolean;
}

/** Full drag & drop upload + gallery + tagging/cropping experience. Must be rendered inside a <LumeoProvider>. */
export function LumeoUploader({
  className,
  defaultViewMode = "grid",
  cropByUsageType = false,
  hideGallery = false,
}: LumeoUploaderProps) {
  const config = useLumeoConfig();
  const { images, loading, refetch } = useLumeoImages(config);
  const queue = useUploadQueue(config, refetch);
  const [viewMode, setViewMode] = useState<LumeoViewMode>(defaultViewMode);
  const [selectedImage, setSelectedImage] = useState<LumeoImage | null>(null);

  const messages = useMemo(() => getMessages(config.locale), [config.locale]);
  const imageTypes = useMemo(
    () => resolveImageTypes(config.imageTypes, config.locale),
    [config.imageTypes, config.locale]
  );
  const acceptAttr = config.accept?.join(",");

  return (
    <div
      className={`lumeo-root lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:p-6 lumeo:font-sans lumeo:shadow-xs ${className ?? ""}`}
    >
      <div className="lumeo:flex lumeo:flex-col lumeo:gap-4">
        <DropZone
          onFiles={queue.addFiles}
          accept={acceptAttr}
          multiple={config.maxFiles !== 1}
          messages={messages}
        />
        <RejectedFileNotice items={queue.rejected} onDismiss={queue.clearRejected} messages={messages} />
        <PendingFileList items={queue.pending} onRemove={queue.removePending} messages={messages} />

        {queue.pending.length > 0 && (
          <div className="lumeo:flex lumeo:flex-col lumeo:gap-2">
            {config.waitForSuccess && queue.isUploading && <LoadingBar />}
            <div className="lumeo:flex lumeo:justify-end">
              <button
                type="button"
                disabled={queue.isUploading}
                onClick={() => queue.upload()}
                className={`lumeo:flex lumeo:items-center lumeo:gap-2 lumeo:px-4 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${primaryButton}`}
              >
                <UploadCloud size={16} />
                {queue.isUploading ? messages.uploading : messages.uploadCount(queue.pending.length)}
              </button>
            </div>
          </div>
        )}

        {!hideGallery && (
          <ImageGallery
            images={images}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            imageTypes={imageTypes}
            onSelectImage={setSelectedImage}
            onRefresh={refetch}
            messages={messages}
            locale={config.locale}
          />
        )}

        {selectedImage && (
          <ImageModal
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onRefetch={refetch}
            cropByUsageType={cropByUsageType}
          />
        )}
      </div>
    </div>
  );
}
