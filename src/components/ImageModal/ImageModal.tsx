import { useMemo, useState } from "react";
import { X, Trash2, Save, SlidersHorizontal, Tag, Calendar, FileType, Ratio } from "lucide-react";
import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useCropRegions } from "../../hooks/useCropRegions";
import { useSizeSelections } from "../../hooks/useSizeSelections";
import { resolveImageTypes, findGroupValueForType, findGroupValueForCropRegions } from "../../lib/imageTypes";
import { resolveSizePresets, toSelectedSize } from "../../lib/sizePresets";
import { saveImageMeta, deleteImage } from "../../lib/api";
import { refreshOnce } from "../../lib/refreshOnce";
import { getMessages, dateLocaleTag } from "../../lib/i18n";
import { primaryButton, outlineButton, dangerButton, sectionLabel, iconButton } from "../../styles/editorial";
import { LoadingBar } from "../shared/LoadingBar";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { TypeSelector } from "./TypeSelector";
import { CropTabs } from "./CropStudio/CropTabs";
import { CropStudio } from "./CropStudio/CropStudio";
import type { LumeoImage, LumeoTypeValue } from "../../types";

export interface ImageModalProps {
  image: LumeoImage;
  onClose: () => void;
  onRefetch: () => void;
  /**
   * When true, usage-type selection directly drives cropping: selecting a type seeds a
   * locked-aspect crop sized to the largest fit for that type's ratio (shown right away on the
   * main image, no separate "Resize & Crop" step), and the type turns green/checked once
   * cropped. Multiple types can be active at once, each with its own crop; saving sends them
   * all as `crops` (each tagged with its `type`) instead of a single `type` field. The manual
   * "Resize & Crop" toggle and its Size Options tab are hidden in this mode. Default: false
   * (classic single usage-type tag + optional separate resize/crop flow).
   */
  cropByUsageType?: boolean;
}

/** Full-screen popup for per-image actions: delete, tag with a usage type, and resize/crop. */
export function ImageModal({ image, onClose, onRefetch, cropByUsageType = false }: ImageModalProps) {
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
  const [selectedType, setSelectedType] = useState<LumeoTypeValue | undefined>(image.type);
  // If this image already has saved crop regions (reopened after a previous save), jump straight
  // into the crop tool instead of the plain tagging view so the user sees them immediately.
  const [cropEnabled, setCropEnabled] = useState(Boolean(image.crops?.length));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "delete" | null>(null);
  const cropRegions = useCropRegions(image.crops ?? []);
  const sizeSelection = useSizeSelections();

  const selectedTypeOption = imageTypes.find((option) => option.value === selectedType);

  const handleSave = () => {
    setIsSaving(true);
    const selectedSizes = sizePresets.filter((preset) => sizeSelection.isSelected(preset.id));
    // The active type's enclosing "ana tip" group value, if it was picked from a nested group
    // (classic single-type flow) or if any saved crop matches one (cropByUsageType flow) — sent
    // back as a top-level `typeId`, alongside `clientId`, so the backend knows which group this
    // save belongs to. Undefined when the active type(s) aren't grouped.
    // cropByUsageType resolves which configured type a region matches via `cropTypeId` first (see
    // `findGroupValueForCropRegions`) rather than the region's raw `type` — otherwise just moving
    // an already-cropped region (no type re-toggled) would drop `typeId` whenever a backend
    // doesn't reliably round-trip `type`, even though the button still shows correctly active.
    const groupValue = cropByUsageType
      ? findGroupValueForCropRegions(imageTypes, cropRegions.regions)
      : findGroupValueForType(imageTypes, selectedType);
    const payload = {
      id: image.id,
      // In cropByUsageType mode, each crop already carries its own `type` — there's no single
      // overall type to tag the image with.
      ...(cropByUsageType ? {} : { type: selectedType }),
      ...(groupValue !== undefined ? { typeId: groupValue } : {}),
      ...(!cropByUsageType && cropEnabled && selectedSizes.length > 0
        ? { sizes: selectedSizes.map((preset) => toSelectedSize(preset)) }
        : {}),
      ...((cropByUsageType || cropEnabled) && cropRegions.regions.length > 0
        ? { crops: cropRegions.regions }
        : {}),
    };
    const actionPromise = saveImageMeta(config, payload);
    refreshOnce(config, "save", actionPromise, onRefetch);
    actionPromise.finally(() => {
      setIsSaving(false);
      onClose();
    });
  };

  const handleToggleCrop = () => {
    setCropEnabled((value) => {
      const next = !value;
      // Resize/crop and usage-type tagging are mutually exclusive — entering crop mode
      // clears any chosen type so a save can't carry both at once.
      if (next) setSelectedType(undefined);
      return next;
    });
  };

  const handleDelete = () => {
    setIsDeleting(true);
    const actionPromise = deleteImage(config, image.id);
    refreshOnce(config, "delete", actionPromise, onRefetch);
    actionPromise.finally(() => {
      setIsDeleting(false);
      onClose();
    });
  };

  return (
    <>
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

          {config.waitForSuccess && (isSaving || isDeleting) && <LoadingBar />}

          <div className="lumeo:flex lumeo:flex-1 lumeo:flex-col lumeo:gap-6 lumeo:overflow-y-auto lumeo:p-6 lumeo:md:flex-row">
            <div className="lumeo:flex lumeo:min-h-[280px] lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-50 lumeo:p-4">
              {cropByUsageType ? (
                <CropStudio image={image} regionsApi={cropRegions} messages={messages} imageTypes={imageTypes} />
              ) : cropEnabled ? (
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
              {!cropByUsageType && !cropEnabled && (
                <div>
                  <p className={`lumeo:mb-1.5 lumeo:flex lumeo:items-center lumeo:gap-1.5 ${sectionLabel}`}>
                    <Tag size={12} /> {messages.usageType}
                  </p>
                  <TypeSelector options={imageTypes} value={selectedType} onChange={setSelectedType} />
                </div>
              )}

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

              {!cropByUsageType && (
                <button
                  type="button"
                  onClick={handleToggleCrop}
                  className={`lumeo:flex lumeo:items-center lumeo:justify-center lumeo:gap-2 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${outlineButton}`}
                >
                  <SlidersHorizontal size={15} />
                  {cropEnabled ? messages.closeResizeAndCrop : messages.resizeAndCrop}
                </button>
              )}

              <div className="lumeo:mt-auto lumeo:flex lumeo:gap-2 lumeo:pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmAction("delete")}
                  className={`lumeo:flex lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:gap-1.5 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${dangerButton}`}
                >
                  <Trash2 size={15} /> {messages.delete}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setConfirmAction("save")}
                  className={`lumeo:flex lumeo:flex-1 lumeo:items-center lumeo:justify-center lumeo:gap-1.5 lumeo:px-3 lumeo:py-2 lumeo:text-sm lumeo:font-medium ${primaryButton}`}
                >
                  <Save size={15} /> {messages.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmAction === "delete" && (
        <ConfirmDialog
          title={messages.confirmDeleteTitle}
          message={messages.confirmDeleteMessage}
          confirmLabel={messages.delete}
          cancelLabel={messages.cancel}
          tone="danger"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            handleDelete();
          }}
        />
      )}
      {confirmAction === "save" && (
        <ConfirmDialog
          title={messages.confirmSaveTitle}
          message={messages.confirmSaveMessage}
          confirmLabel={messages.save}
          cancelLabel={messages.cancel}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            setConfirmAction(null);
            handleSave();
          }}
        />
      )}
    </>
  );
}
