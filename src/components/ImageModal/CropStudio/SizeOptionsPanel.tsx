import { Check } from "lucide-react";
import { formatSizeLabel } from "../../../lib/sizePresets";
import type { SizePresetOption } from "../../../types";
import type { UseSizeSelectionsResult } from "../../../hooks/useSizeSelections";
import type { LumeoMessages } from "../../../lib/i18n";

export interface SizeOptionsPanelProps {
  presets: SizePresetOption[];
  selection: UseSizeSelectionsResult;
  messages: LumeoMessages;
}

/**
 * Lets the user pick one or more fixed output sizes without dragging a crop
 * area — for images that just need a resize to a known target box.
 */
export function SizeOptionsPanel({ presets, selection, messages }: SizeOptionsPanelProps) {
  if (presets.length === 0) {
    return <p className="lumeo:text-xs lumeo:text-zinc-400">{messages.noSizePresets}</p>;
  }

  return (
    <div className="lumeo:grid lumeo:grid-cols-2 lumeo:gap-2 lumeo:sm:grid-cols-3">
      {presets.map((preset) => {
        const active = selection.isSelected(preset.id);
        const ratio = preset.width / preset.height;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => selection.toggle(preset.id)}
            className={`lumeo:flex lumeo:flex-col lumeo:items-center lumeo:gap-2 lumeo:rounded-sm lumeo:border lumeo:px-3 lumeo:py-3 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
              active
                ? "lumeo:border-zinc-900 lumeo:bg-zinc-900 lumeo:text-white"
                : "lumeo:border-zinc-300 lumeo:bg-white lumeo:text-zinc-600 lumeo:hover:bg-zinc-50"
            }`}
          >
            <span
              className={`lumeo:flex lumeo:h-8 lumeo:w-11 lumeo:items-center lumeo:justify-center lumeo:rounded-sm lumeo:border ${
                active ? "lumeo:border-white/60" : "lumeo:border-zinc-300"
              }`}
            >
              {active ? (
                <Check size={14} />
              ) : (
                <span
                  className="lumeo:block lumeo:border lumeo:border-current lumeo:opacity-70"
                  style={{
                    width: ratio >= 1 ? 22 : 22 * ratio,
                    height: ratio >= 1 ? 22 / ratio : 22,
                  }}
                />
              )}
            </span>
            {formatSizeLabel(preset)}
          </button>
        );
      })}
    </div>
  );
}
