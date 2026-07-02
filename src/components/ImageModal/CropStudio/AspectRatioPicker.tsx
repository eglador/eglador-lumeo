import { useState } from "react";
import { Plus } from "lucide-react";
import type { LumeoMessages } from "../../../lib/i18n";

export interface AspectPreset {
  label: string;
  aspect?: number;
  /** Exact pixel size for custom width/height entries, so the crop box is sized to match instead of just its ratio. */
  width?: number;
  height?: number;
}

function buildAspectPresets(messages: LumeoMessages): AspectPreset[] {
  return [
    { label: messages.free },
    { label: "1:1", aspect: 1 },
    { label: "4:3", aspect: 4 / 3 },
    { label: "3:4", aspect: 3 / 4 },
    { label: "16:9", aspect: 16 / 9 },
    { label: "9:16", aspect: 9 / 16 },
    { label: "3:2", aspect: 3 / 2 },
    { label: "2:3", aspect: 2 / 3 },
  ];
}

export interface AspectRatioPickerProps {
  onAdd: (preset: AspectPreset) => void;
  messages: LumeoMessages;
}

export function AspectRatioPicker({ onAdd, messages }: AspectRatioPickerProps) {
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const presets = buildAspectPresets(messages);

  return (
    <div className="lumeo:flex lumeo:flex-col lumeo:gap-2">
      <div className="lumeo:flex lumeo:flex-wrap lumeo:gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onAdd(preset)}
            className="lumeo:rounded-sm lumeo:border lumeo:border-zinc-300 lumeo:bg-white lumeo:px-2.5 lumeo:py-1 lumeo:text-xs lumeo:font-medium lumeo:text-zinc-600 lumeo:transition-colors lumeo:hover:bg-zinc-50 lumeo:hover:text-zinc-900"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="lumeo:flex lumeo:items-center lumeo:gap-1.5">
        <input
          type="number"
          min={1}
          placeholder={messages.widthPlaceholder}
          value={customW}
          onChange={(event) => setCustomW(event.target.value)}
          className="lumeo:w-14 lumeo:rounded-sm lumeo:border lumeo:border-zinc-300 lumeo:bg-white lumeo:px-1.5 lumeo:py-1 lumeo:text-xs"
        />
        <span className="lumeo:text-xs lumeo:text-zinc-400">:</span>
        <input
          type="number"
          min={1}
          placeholder={messages.heightPlaceholder}
          value={customH}
          onChange={(event) => setCustomH(event.target.value)}
          className="lumeo:w-14 lumeo:rounded-sm lumeo:border lumeo:border-zinc-300 lumeo:bg-white lumeo:px-1.5 lumeo:py-1 lumeo:text-xs"
        />
        <button
          type="button"
          onClick={() => {
            const w = Number(customW);
            const h = Number(customH);
            if (w > 0 && h > 0) {
              onAdd({ label: `${w}:${h}`, aspect: w / h, width: w, height: h });
              setCustomW("");
              setCustomH("");
            }
          }}
          className="lumeo:flex lumeo:items-center lumeo:gap-1 lumeo:rounded-sm lumeo:border lumeo:border-zinc-900 lumeo:bg-zinc-900 lumeo:px-2 lumeo:py-1 lumeo:text-xs lumeo:font-medium lumeo:text-white lumeo:hover:bg-zinc-700"
        >
          <Plus size={12} /> {messages.customAdd}
        </button>
      </div>
    </div>
  );
}
