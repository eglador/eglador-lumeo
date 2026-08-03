import { useRef, useState } from "react";
import { CropCanvas } from "./CropCanvas";
import { AspectRatioPicker, type AspectPreset } from "./AspectRatioPicker";
import { TypeCropSelector } from "./TypeCropSelector";
import { CropRegionChips } from "./CropRegionChips";
import { pickRegionColor } from "./colors";
import { centeredRectForAspect, centeredRectForSize, maxRectForAspect, roundRect, roundAspect } from "../../../lib/geometry";
import { formatAspectRatioSlug, regionMatchesOption } from "../../../lib/imageTypes";
import type { Bounds } from "../../../lib/geometry";
import type { UseCropRegionsResult } from "../../../hooks/useCropRegions";
import type { LumeoImage, LumeoImageTypeOption } from "../../../types";
import type { LumeoMessages } from "../../../lib/i18n";

export interface CropStudioProps {
  image: LumeoImage;
  /** Default aspect suggested by the currently selected usage type, used to seed the first region. Ignored when `imageTypes` is set. */
  defaultAspect?: number;
  regionsApi: UseCropRegionsResult;
  messages: LumeoMessages;
  /**
   * When set, replaces the aspect-ratio picker with usage-type buttons: selecting a type seeds
   * a locked-aspect crop sized to the largest fit for that type's ratio, and re-selecting it
   * removes that crop. No region is auto-seeded on image load in this mode.
   */
  imageTypes?: LumeoImageTypeOption[];
}

export function CropStudio({ image, defaultAspect, regionsApi, messages, imageTypes }: CropStudioProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<Bounds>({ width: 0, height: 0 });

  const addRegion = (preset: AspectPreset) => {
    const naturalBounds = naturalSize.width > 0 ? naturalSize : { width: 1000, height: 1000 };
    const rect = roundRect(
      preset.width && preset.height
        ? centeredRectForSize(naturalBounds, preset.width, preset.height)
        : centeredRectForAspect(naturalBounds, preset.aspect)
    );
    regionsApi.addRegion({
      id: crypto.randomUUID(),
      name: messages.cropRegionName(regionsApi.regions.length + 1),
      aspectLabel: preset.label,
      aspect: roundAspect(preset.aspect),
      aspectRatio: preset.aspect ? formatAspectRatioSlug(preset.aspect) : undefined,
      color: pickRegionColor(regionsApi.regions.map((region) => region.color)),
      ...rect,
    });
  };

  const toggleTypeCrop = (option: LumeoImageTypeOption) => {
    const existing = regionsApi.regions.find((region) => regionMatchesOption(region, option));
    if (existing) {
      regionsApi.removeRegion(existing.id);
      return;
    }
    const naturalBounds = naturalSize.width > 0 ? naturalSize : { width: 1000, height: 1000 };
    const rect = roundRect(
      option.aspect
        ? maxRectForAspect(naturalBounds, option.aspect)
        : { x: 0, y: 0, width: naturalBounds.width, height: naturalBounds.height }
    );
    regionsApi.addRegion({
      id: crypto.randomUUID(),
      name: option.label,
      aspectLabel: option.label,
      aspect: roundAspect(option.aspect),
      aspectRatio: option.aspect ? formatAspectRatioSlug(option.aspect) : undefined,
      type: option.value,
      cropTypeId: option.cropTypeId,
      color: pickRegionColor(regionsApi.regions.map((region) => region.color)),
      ...rect,
    });
  };

  return (
    <div className="lumeo:flex lumeo:w-full lumeo:flex-col lumeo:gap-3">
      <div className="lumeo:relative lumeo:mx-auto lumeo:inline-block">
        <img
          ref={imgRef}
          src={image.url}
          alt={image.fileName}
          draggable={false}
          onLoad={(event) => {
            const target = event.currentTarget;
            setNaturalSize({ width: target.naturalWidth, height: target.naturalHeight });
            if (!imageTypes && regionsApi.regions.length === 0) {
              const rect = roundRect(
                centeredRectForAspect(
                  { width: target.naturalWidth, height: target.naturalHeight },
                  defaultAspect
                )
              );
              regionsApi.addRegion({
                id: crypto.randomUUID(),
                name: messages.cropRegionName(1),
                aspectLabel: defaultAspect ? messages.recommendedRatio : messages.free,
                aspect: roundAspect(defaultAspect),
                aspectRatio: defaultAspect ? formatAspectRatioSlug(defaultAspect) : undefined,
                color: pickRegionColor([]),
                ...rect,
              });
            }
          }}
          className="lumeo:box-border lumeo:block lumeo:max-h-[380px] lumeo:max-w-full lumeo:select-none lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:object-contain"
        />
        {naturalSize.width > 0 && (
          <CropCanvas
            regions={regionsApi.regions}
            activeRegionId={regionsApi.activeRegionId}
            naturalSize={naturalSize}
            onChange={(id, rect) => regionsApi.updateRegion(id, rect)}
          />
        )}
      </div>

      <div className="lumeo:grid lumeo:grid-cols-1 lumeo:gap-3 lumeo:sm:grid-cols-2">
        <div>
          <p className="lumeo:mb-1 lumeo:text-xs lumeo:font-medium lumeo:uppercase lumeo:tracking-wide lumeo:text-zinc-500">
            {imageTypes ? messages.usageType : messages.newCropRegion}
          </p>
          {imageTypes ? (
            <TypeCropSelector
              options={imageTypes}
              regions={regionsApi.regions}
              imageUrl={image.url}
              naturalSize={naturalSize}
              onToggle={toggleTypeCrop}
            />
          ) : (
            <AspectRatioPicker onAdd={addRegion} messages={messages} />
          )}
        </div>
        <div>
          <p className="lumeo:mb-1 lumeo:text-xs lumeo:font-medium lumeo:uppercase lumeo:tracking-wide lumeo:text-zinc-500">
            {messages.cropRegions}
          </p>
          <CropRegionChips regionsApi={regionsApi} messages={messages} />
        </div>
      </div>
    </div>
  );
}
