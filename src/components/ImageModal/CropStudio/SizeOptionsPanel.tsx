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
    <div className="lumeo:flex lumeo:flex-col lumeo:divide-y lumeo:divide-zinc-100 lumeo:overflow-hidden lumeo:rounded-sm lumeo:border lumeo:border-zinc-200">
      {presets.map((preset) => {
        const active = selection.isSelected(preset.id);
        const ratio = preset.width / preset.height;
        return (
          <label
            key={preset.id}
            className={`lumeo:flex lumeo:cursor-pointer lumeo:items-center lumeo:gap-3 lumeo:px-3 lumeo:py-2.5 lumeo:text-xs lumeo:font-medium lumeo:transition-colors lumeo:focus-within:ring-2 lumeo:focus-within:ring-zinc-900/20 lumeo:focus-within:ring-offset-1 ${
              active ? "lumeo:bg-zinc-900 lumeo:text-white" : "lumeo:text-zinc-600 lumeo:hover:bg-zinc-50"
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => selection.toggle(preset.id)}
              className="lumeo:sr-only"
            />
            <span className="lumeo:flex lumeo:h-8 lumeo:w-11 lumeo:shrink-0 lumeo:items-center lumeo:justify-center">
              <span
                className={`lumeo:block lumeo:rounded-xs lumeo:border-2 lumeo:border-current lumeo:opacity-80 ${
                  active ? "lumeo:text-white" : "lumeo:text-zinc-400"
                }`}
                style={{
                  width: ratio >= 1 ? 26 : 26 * ratio,
                  height: ratio >= 1 ? 26 / ratio : 26,
                }}
              />
            </span>
            {formatSizeLabel(preset)}
          </label>
        );
      })}
    </div>
  );
}
