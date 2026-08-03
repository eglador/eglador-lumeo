import { Check } from "lucide-react";
import { formatImageTypeMeta, imageTypeKey, segmentImageTypes, regionMatchesOption } from "../../../lib/imageTypes";
import type { Bounds } from "../../../lib/geometry";
import type { CropRegion, LumeoImageTypeOption } from "../../../types";

export interface TypeCropSelectorProps {
  options: LumeoImageTypeOption[];
  regions: CropRegion[];
  /** Source image URL, reused as a CSS background for the hover preview — no extra image load. */
  imageUrl: string;
  naturalSize: Bounds;
  onToggle: (option: LumeoImageTypeOption) => void;
}

const PREVIEW_WIDTH = 160;

function TypeCropButton({
  option,
  regions,
  imageUrl,
  naturalSize,
  onToggle,
}: {
  option: LumeoImageTypeOption;
  regions: CropRegion[];
  imageUrl: string;
  naturalSize: Bounds;
  onToggle: (option: LumeoImageTypeOption) => void;
}) {
  const region = regions.find((candidate) => regionMatchesOption(candidate, option));
  const active = Boolean(region);
  const meta = formatImageTypeMeta(option);
  const canPreview = Boolean(region) && naturalSize.width > 0 && naturalSize.height > 0;
  const scale = canPreview ? PREVIEW_WIDTH / region!.width : 0;

  return (
    <div className="lumeo:group lumeo:relative">
      <button
        type="button"
        onClick={() => onToggle(option)}
        className={`lumeo:flex lumeo:flex-col lumeo:items-start lumeo:rounded-sm lumeo:border lumeo:px-2.5 lumeo:py-1 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
          active
            ? "lumeo:border-emerald-600 lumeo:bg-emerald-600 lumeo:text-white"
            : "lumeo:border-zinc-300 lumeo:bg-white lumeo:text-zinc-700 lumeo:hover:bg-zinc-50"
        }`}
      >
        <span className="lumeo:flex lumeo:items-center lumeo:gap-1">
          {active && <Check size={12} />}
          {option.label}
        </span>
        {meta && (
          <span
            className={`lumeo:text-[10px] lumeo:font-normal lumeo:tabular-nums ${
              active ? "lumeo:text-white/70" : "lumeo:text-zinc-400"
            }`}
          >
            {meta}
          </span>
        )}
      </button>

      {canPreview && (
        <div
          className="lumeo:pointer-events-none lumeo:absolute lumeo:bottom-full lumeo:left-0 lumeo:z-10 lumeo:mb-1.5 lumeo:overflow-hidden lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:opacity-0 lumeo:shadow-lg lumeo:transition-opacity lumeo:duration-150 lumeo:group-hover:opacity-100"
          style={{
            width: PREVIEW_WIDTH,
            height: region!.height * scale,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${naturalSize.width * scale}px ${naturalSize.height * scale}px`,
            backgroundPosition: `-${region!.x * scale}px -${region!.y * scale}px`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Turns usage-type selection directly into cropping: clicking an inactive type seeds the
 * largest possible crop for its ratio (locked, only resizable/movable within that ratio) and
 * marks the type active (green check); clicking an active type removes that crop. Switching
 * which existing crop is being dragged happens via the Crop Regions list, not by re-clicking
 * here. Hovering an already-cropped type shows a minimal preview of exactly what was framed.
 * A group entry (has `crops`) renders as a heading over its nested buttons instead of a button
 * itself — only its children are selectable/croppable.
 */
export function TypeCropSelector({ options, regions, imageUrl, naturalSize, onToggle }: TypeCropSelectorProps) {
  const segments = segmentImageTypes(options);
  return (
    <div className="lumeo:flex lumeo:flex-col lumeo:gap-2">
      {segments.map((segment, index) =>
        segment.kind === "group" ? (
          <div key={imageTypeKey(segment.option)} className="lumeo:flex lumeo:flex-col lumeo:gap-1">
            <p className="lumeo:text-[10px] lumeo:font-semibold lumeo:uppercase lumeo:tracking-wide lumeo:text-zinc-400">
              {segment.option.name ?? segment.option.label}
            </p>
            <div className="lumeo:flex lumeo:flex-wrap lumeo:gap-1.5">
              {segment.option.crops!.map((child) => (
                <TypeCropButton
                  key={imageTypeKey(child)}
                  option={child}
                  regions={regions}
                  imageUrl={imageUrl}
                  naturalSize={naturalSize}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ) : (
          <div key={`row-${index}`} className="lumeo:flex lumeo:flex-wrap lumeo:gap-1.5">
            {segment.options.map((option) => (
              <TypeCropButton
                key={imageTypeKey(option)}
                option={option}
                regions={regions}
                imageUrl={imageUrl}
                naturalSize={naturalSize}
                onToggle={onToggle}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
