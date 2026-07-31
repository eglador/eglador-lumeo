import { formatImageTypeMeta, imageTypeKey, segmentImageTypes } from "../../lib/imageTypes";
import type { LumeoImageTypeOption, LumeoTypeValue } from "../../types";

export interface TypeSelectorProps {
  options: LumeoImageTypeOption[];
  value?: LumeoTypeValue;
  onChange: (value: LumeoTypeValue | undefined) => void;
}

function TypeButton({
  option,
  isSelected,
  onChange,
}: {
  option: LumeoImageTypeOption;
  isSelected: boolean;
  onChange: (value: LumeoTypeValue | undefined) => void;
}) {
  const meta = formatImageTypeMeta(option);
  return (
    <button
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
}

/** Renders a group entry (has `crops`) as a heading over its nested buttons; plain entries wrap together in a shared row, same as before grouping existed. */
export function TypeSelector({ options, value, onChange }: TypeSelectorProps) {
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
                <TypeButton
                  key={imageTypeKey(child)}
                  option={child}
                  isSelected={child.value === value}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div key={`row-${index}`} className="lumeo:flex lumeo:flex-wrap lumeo:gap-1.5">
            {segment.options.map((option) => (
              <TypeButton key={imageTypeKey(option)} option={option} isSelected={option.value === value} onChange={onChange} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
