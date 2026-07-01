import { useMemo, useState } from "react";
import { X, Trash2, Save, SlidersHorizontal, Tag, Calendar, FileType, Ratio } from "lucide-react";
import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useCropRegions } from "../../hooks/useCropRegions";
import { useSizeSelections } from "../../hooks/useSizeSelections";
import { resolveImageTypes } from "../../lib/imageTypes";
import { resolveSizePresets } from "../../lib/sizePresets";
import { saveImageMeta, deleteImage } from "../../lib/api";
import { refreshOnce } from "../../lib/refreshOnce";
import { getMessages, dateLocaleTag } from "../../lib/i18n";
import { primaryButton, outlineButton, dangerButton, sectionLabel, iconButton } from "../../styles/editorial";
import { TypeSelector } from "./TypeSelector";
import { CropTabs } from "./CropStudio/CropTabs";
import type { LumeoImage } from "../../types";

export interface ImageModalProps {
  image: LumeoImage;
  onClose: () => void;
  onRefetch: () => void;
}

/** Full-screen popup for per-image actions: delete, tag with a usage type, and resize/crop. */
export function ImageModal({ image, onClose, onRefetch }: ImageModalProps) {
  const config = useLumeoConfig();
  const messages = useMemo(() => getMessages(config.locale), [config.locale]);
  const dateLocale = useMemo(() => dateLocaleTag(config.locale), [config.locale]);
  const imageTypes = useMemo(
    () => resolveImageTypes(config.imageTypes, config.locale),
    [config.imageTypes, config.locale]
  );
  const sizePresets = useMemo(
    () => resolveSizePresets(config.sizePresets, config.locale),
    [config.sizePresets, config.locale]
  );
  const [selectedType, setSelectedType] = useState<string | undefined>(image.type);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cropRegions = useCropRegions();
  const sizeSelection = useSizeSelections();

  const selectedTypeOption = imageTypes.find((option) => option.value === selectedType);

  const handleSave = () => {
    setIsSaving(true);
    const selectedSizes = sizePresets.filter((preset) => sizeSelection.isSelected(preset.id));
    const payload = {
      id: image.id,
      type: selectedType,
      ...(cropEnabled && selectedSizes.length > 0
        ? { sizes: selectedSizes.map((preset) => ({ width: preset.width, height: preset.height, label: preset.label ?? `${preset.width}x${preset.height}` })) }
        : {}),
      ...(cropEnabled && cropRegions.regions.length > 0 ? { crops: cropRegions.regions } : {}),
    };
    const actionPromise = saveImageMeta(config, payload);
    refreshOnce(config.waitForSuccess, actionPromise, onRefetch);
    actionPromise.finally(() => {
      setIsSaving(false);
      onClose();
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    const actionPromise = deleteImage(config, image.id);
    refreshOnce(config.waitForSuccess, actionPromise, onRefetch);
    actionPromise.finally(() => {
      setIsDeleting(false);
      onClose();
    });
  };

  return (
    <div
      className="lumeo-root lumeo:fixed lumeo:inset-0 lumeo:z-50 lumeo:flex lumeo:items-center lumeo:justify-center lumeo:bg-zinc-900/50 lumeo:p-4 lumeo:font-sans lumeo:backdrop-blur-sm lumeo:animate-fade-in"
      onClick={onClose}
    >
      <div
        className="lumeo:flex lumeo:max-h-[92vh] lumeo:w-full lumeo:max-w-6xl lumeo:flex-col lumeo:overflow-hidden lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:shadow-lg lumeo:animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:border-b lumeo:border-zinc-100 lumeo:px-6 lumeo:py-4">
          <p className="lumeo:truncate lumeo:text-lg lumeo:font-semibold lumeo:text-zinc-900">{image.fileName}</p>
          <button
            type="button"
            onClick={onClose}
            className={`lumeo:h-8 lumeo:w-8 ${iconButton}`}
            aria-label={messages.close}
          >
            <X size={16} />
          </button>
        </div>

        <div className="lumeo:flex lumeo:flex-1 lumeo:flex-col lumeo:gap-6 lumeo:overflow-y-auto lumeo:p-6 lumeo:md:flex-row">
          <div className="lumeo:flex lumeo:min-h-[280px] lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-50 lumeo:p-4">
            {cropEnabled ? (
              <CropTabs
                image={image}
                sizePresets={sizePresets}
                sizeSelection={sizeSelection}
                defaultAspect={selectedTypeOption?.aspect}
                regionsApi={cropRegions}
                messages={messages}
              />
            ) : (
              <img
                src={image.url}
                alt={image.fileName}
                className="lumeo:max-h-[420px] lumeo:max-w-full lumeo:rounded-sm lumeo:object-contain"
              />
            )}
          </div>

          <div className="lumeo:flex lumeo:w-full lumeo:flex-col lumeo:gap-4 lumeo:md:w-72">
            <div>
              <p className={`lumeo:mb-1.5 lumeo:flex lumeo:items-center lumeo:gap-1.5 ${sectionLabel}`}>
                <Tag size={12} /> {messages.usageType}
              </p>
              <TypeSelector options={imageTypes} value={selectedType} onChange={setSelectedType} />
            </div>

            <div className="lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-50 lumeo:p-3">
              <p className={`lumeo:mb-2 ${sectionLabel}`}>{messages.info}</p>
              <dl className="lumeo:space-y-1.5 lumeo:text-xs lumeo:text-zinc-600">
                <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:gap-2">
                  <dt className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:text-zinc-400">
                    <Calendar size={12} /> {messages.uploadedAt}
                  </dt>
                  <dd>{new Date(image.uploadedAt).toLocaleString(dateLocale)}</dd>
                </div>
                {image.mimeType && (
                  <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:gap-2">
                    <dt className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:text-zinc-400">
                      <FileType size={12} /> {messages.fileType}
                    </dt>
                    <dd>{image.mimeType}</dd>
                  </div>
                )}
                {image.width && image.height && (
                  <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:gap-2">
                    <dt className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:text-zinc-400">
                      <Ratio size={12} /> {messages.dimensions}
                    </dt>
                    <dd>
                      {image.width}×{image.height}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <button
              type="button"
              onClick={() => setCropEnabled((value) => !value)}
              className={`lumeo:flex lumeo:items-center lumeo:justify-center lumeo:gap-2 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${outlineButton}`}
            >
              <SlidersHorizontal size={15} />
              {cropEnabled ? messages.closeResizeAndCrop : messages.resizeAndCrop}
            </button>

            <div className="lumeo:mt-auto lumeo:flex lumeo:gap-2 lumeo:pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className={`lumeo:flex lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:gap-1.5 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${dangerButton}`}
              >
                <Trash2 size={15} /> {messages.delete}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className={`lumeo:flex lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:gap-1.5 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${primaryButton}`}
              >
                <Save size={15} /> {messages.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
