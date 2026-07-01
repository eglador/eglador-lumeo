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
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(isSelected ? undefined : option.value)}
            className={`lumeo:rounded-sm lumeo:border lumeo:px-2.5 lumeo:py-1 lumeo:text-xs lumeo:font-medium lumeo:transition-colors ${
              isSelected
                ? "lumeo:border-zinc-900 lumeo:bg-zinc-900 lumeo:text-white"
                : "lumeo:border-zinc-300 lumeo:bg-white lumeo:text-zinc-700 lumeo:hover:bg-zinc-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
