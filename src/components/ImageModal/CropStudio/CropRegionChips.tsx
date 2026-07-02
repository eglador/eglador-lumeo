import { useState } from "react";
import { X } from "lucide-react";
import type { UseCropRegionsResult } from "../../../hooks/useCropRegions";
import { REGION_COLORS } from "./colors";
import type { LumeoMessages } from "../../../lib/i18n";

export interface CropRegionChipsProps {
  regionsApi: UseCropRegionsResult;
  messages: LumeoMessages;
}

export function CropRegionChips({ regionsApi, messages }: CropRegionChipsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (regionsApi.regions.length === 0) {
    return <p className="lumeo:text-xs lumeo:text-zinc-400">{messages.noCropRegions}</p>;
  }

  return (
    <ul className="lumeo:list-none lumeo:flex lumeo:flex-col lumeo:gap-1.5 lumeo:p-0">
      {regionsApi.regions.map((region, index) => (
        <li
          key={region.id}
          className={`lumeo:flex lumeo:items-center lumeo:gap-2 lumeo:rounded-sm lumeo:border lumeo:px-2.5 lumeo:py-1.5 lumeo:transition-colors ${
            region.id === regionsApi.activeRegionId ? "lumeo:border-zinc-900 lumeo:bg-zinc-50" : "lumeo:border-zinc-200 lumeo:bg-white"
          }`}
        >
          <span
            className="lumeo:h-2.5 lumeo:w-2.5 lumeo:shrink-0 lumeo:rounded-full"
            style={{ backgroundColor: REGION_COLORS[index % REGION_COLORS.length] }}
          />
          {editingId === region.id ? (
            <input
              autoFocus
              defaultValue={region.name}
              onBlur={(event) => {
                regionsApi.renameRegion(region.id, event.target.value || region.name);
                setEditingId(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") (event.target as HTMLInputElement).blur();
              }}
              className="lumeo:min-w-0 lumeo:flex-1 lumeo:rounded-sm lumeo:border lumeo:border-zinc-300 lumeo:px-1 lumeo:text-xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => regionsApi.setActiveRegionId(region.id)}
              onDoubleClick={() => setEditingId(region.id)}
              className="lumeo:min-w-0 lumeo:flex-1 lumeo:truncate lumeo:text-left lumeo:text-xs lumeo:font-medium lumeo:text-zinc-700"
            >
              {region.name} <span className="lumeo:text-zinc-400">· {region.aspectLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => regionsApi.removeRegion(region.id)}
            className="lumeo:flex lumeo:h-6 lumeo:w-6 lumeo:items-center lumeo:justify-center lumeo:rounded-sm lumeo:text-zinc-400 lumeo:transition-colors lumeo:hover:bg-red-50 lumeo:hover:text-red-600"
            aria-label={messages.removeRegion(region.name)}
          >
            <X size={13} />
          </button>
        </li>
      ))}
    </ul>
  );
}
