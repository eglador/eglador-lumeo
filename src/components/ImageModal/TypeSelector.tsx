import { formatImageTypeMeta, imageTypeKey } from "../../lib/imageTypes";
import type { LumeoImageTypeOption } from "../../types";

export interface TypeSelectorProps {
  options: LumeoImageTypeOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function TypeSelector({ options, value, onChange }: TypeSelectorProps) {
  return (
    <div className="lumeo:flex lumeo:flex-wrap lumeo:gap-1.5">
      {options.map((option) => {
        const isSelected = option.value === value;
        const meta = formatImageTypeMeta(option);
        return (
          <button
            key={imageTypeKey(option)}
            type="button"
            onClick={() => onChange(isSelected ? undefined : option.value)}
            className={`lumeo:flex lumeo:flex-col lumeo:items-start lumeo:rounded-sm lumeo:border lumeo:px-2.5 lumeo:py-1 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
              isSelected
                ? "lumeo:border-zinc-900 lumeo:bg-zinc-900 lumeo:text-white"
                : "lumeo:border-zinc-300 lumeo:bg-white lumeo:text-zinc-700 lumeo:hover:bg-zinc-50"
            }`}
          >
            <span>{option.label}</span>
            {meta && (
              <span
                className={`lumeo:text-[10px] lumeo:font-normal lumeo:tabular-nums ${
                  isSelected ? "lumeo:text-white/70" : "lumeo:text-zinc-400"
                }`}
              >
                {meta}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
