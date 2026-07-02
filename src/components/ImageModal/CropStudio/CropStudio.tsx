import { useEffect, useRef, useState } from "react";
import { CropOverlay } from "./CropOverlay";
import { AspectRatioPicker, type AspectPreset } from "./AspectRatioPicker";
import { CropRegionChips } from "./CropRegionChips";
import { pickRegionColor } from "./colors";
import { centeredRectForAspect, centeredRectForSize } from "../../../lib/geometry";
import type { Bounds } from "../../../lib/geometry";
import type { UseCropRegionsResult } from "../../../hooks/useCropRegions";
import type { LumeoImage } from "../../../types";
import type { LumeoMessages } from "../../../lib/i18n";

export interface CropStudioProps {
  image: LumeoImage;
  /** Default aspect suggested by the currently selected usage type, used to seed the first region. */
  defaultAspect?: number;
  regionsApi: UseCropRegionsResult;
  messages: LumeoMessages;
}

export function CropStudio({ image, defaultAspect, regionsApi, messages }: CropStudioProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [displayBounds, setDisplayBounds] = useState<Bounds>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<Bounds>({ width: 0, height: 0 });

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDisplayBounds({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const addRegion = (preset: AspectPreset) => {
    const naturalBounds = naturalSize.width > 0 ? naturalSize : { width: 1000, height: 1000 };
    const rect =
      preset.width && preset.height
        ? centeredRectForSize(naturalBounds, preset.width, preset.height)
        : centeredRectForAspect(naturalBounds, preset.aspect);
    regionsApi.addRegion({
      id: crypto.randomUUID(),
      name: messages.cropRegionName(regionsApi.regions.length + 1),
      aspectLabel: preset.label,
      aspect: preset.aspect,
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
            setDisplayBounds({ width: target.clientWidth, height: target.clientHeight });
            if (regionsApi.regions.length === 0) {
              const rect = centeredRectForAspect(
                { width: target.naturalWidth, height: target.naturalHeight },
                defaultAspect
              );
              regionsApi.addRegion({
                id: crypto.randomUUID(),
                name: messages.cropRegionName(1),
                aspectLabel: defaultAspect ? messages.recommendedRatio : messages.free,
                aspect: defaultAspect,
                color: pickRegionColor([]),
                ...rect,
              });
            }
          }}
          className="lumeo:box-border lumeo:block lumeo:max-h-[380px] lumeo:max-w-full lumeo:select-none lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:object-contain"
        />
        {naturalSize.width > 0 &&
          // Draw the active region last so it's always on top of overlapping inactive ones.
          [...regionsApi.regions]
            .sort((a) => (a.id === regionsApi.activeRegionId ? 1 : -1))
            .map((region) => (
              <CropOverlay
                key={region.id}
                region={region}
                aspect={region.aspect}
                isActive={region.id === regionsApi.activeRegionId}
                color={region.color}
                displayBounds={displayBounds}
                naturalSize={naturalSize}
                onChange={(rect) => regionsApi.updateRegion(region.id, rect)}
              />
            ))}
      </div>

      <div className="lumeo:grid lumeo:grid-cols-1 lumeo:gap-3 lumeo:sm:grid-cols-2">
        <div>
          <p className="lumeo:mb-1 lumeo:text-xs lumeo:font-medium lumeo:uppercase lumeo:tracking-wide lumeo:text-zinc-500">
            {messages.newCropRegion}
          </p>
          <AspectRatioPicker onAdd={addRegion} messages={messages} />
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
