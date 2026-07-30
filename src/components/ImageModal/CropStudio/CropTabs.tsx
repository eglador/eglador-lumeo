import { useState } from "react";
import { Ruler, Crop as CropIcon } from "lucide-react";
import { SizeOptionsPanel } from "./SizeOptionsPanel";
import { CropStudio } from "./CropStudio";
import type { LumeoImage, SizePresetOption } from "../../../types";
import type { UseSizeSelectionsResult } from "../../../hooks/useSizeSelections";
import type { UseCropRegionsResult } from "../../../hooks/useCropRegions";
import type { LumeoMessages } from "../../../lib/i18n";

export interface CropTabsProps {
  image: LumeoImage;
  sizePresets: SizePresetOption[];
  sizeSelection: UseSizeSelectionsResult;
  defaultAspect?: number;
  regionsApi: UseCropRegionsResult;
  messages: LumeoMessages;
}

type TabKey = "sizes" | "custom";

/**
 * Two independent ways to produce an output size for an image:
 * - Size options: pick one or more fixed target sizes, no manual crop area.
 * - Custom crop: drag a precise crop region for a genuinely custom size.
 * Both can be used together; each keeps its own state regardless of the active tab.
 */
export function CropTabs({ image, sizePresets, sizeSelection, defaultAspect, regionsApi, messages }: CropTabsProps) {
  // Jump straight to "Custom Crop" if this image already has saved regions (e.g. reopened after
  // a previous save) so the user sees their existing crops immediately instead of the size tab.
  const [tab, setTab] = useState<TabKey>(() => (regionsApi.regions.length > 0 ? "custom" : "sizes"));

  return (
    <div className="lumeo:flex lumeo:w-full lumeo:flex-col lumeo:gap-4">
      <div className="lumeo:flex lumeo:gap-1 lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-100 lumeo:p-0.5">
        <button
          type="button"
          onClick={() => setTab("sizes")}
          className={`lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:rounded-sm lumeo:px-3 lumeo:py-1.5 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
            tab === "sizes" ? "lumeo:bg-white lumeo:text-zinc-900 lumeo:shadow-xs" : "lumeo:text-zinc-500 lumeo:hover:text-zinc-900"
          }`}
        >
          <Ruler size={14} /> {messages.sizeOptionsTab}
          {sizeSelection.selectedIds.length > 0 && (
            <span className="lumeo:rounded-full lumeo:bg-zinc-900 lumeo:px-1.5 lumeo:text-[10px] lumeo:text-white">
              {sizeSelection.selectedIds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("custom")}
          className={`lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:rounded-sm lumeo:px-3 lumeo:py-1.5 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
            tab === "custom" ? "lumeo:bg-white lumeo:text-zinc-900 lumeo:shadow-xs" : "lumeo:text-zinc-500 lumeo:hover:text-zinc-900"
          }`}
        >
          <CropIcon size={14} /> {messages.customCropTab}
          {regionsApi.regions.length > 0 && (
            <span className="lumeo:rounded-full lumeo:bg-zinc-900 lumeo:px-1.5 lumeo:text-[10px] lumeo:text-white">
              {regionsApi.regions.length}
            </span>
          )}
        </button>
      </div>

      {tab === "sizes" ? (
        <div className="lumeo:flex lumeo:flex-col lumeo:gap-4 lumeo:sm:flex-row lumeo:sm:items-start">
          <img
            src={image.url}
            alt={image.fileName}
            className="lumeo:max-h-[260px] lumeo:w-full lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:object-contain lumeo:sm:w-1/2"
          />
          <div className="lumeo:flex-1">
            <p className="lumeo:mb-2 lumeo:text-xs lumeo:text-zinc-500">{messages.sizeOptionsHint}</p>
            <SizeOptionsPanel presets={sizePresets} selection={sizeSelection} messages={messages} />
          </div>
        </div>
      ) : (
        <CropStudio image={image} defaultAspect={defaultAspect} regionsApi={regionsApi} messages={messages} />
      )}
    </div>
  );
}
