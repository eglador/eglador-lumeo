import { useCallback, useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { sectionLabel } from "../../styles/editorial";
import type { LumeoMessages } from "../../lib/i18n";

export interface DropZoneProps {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  messages: LumeoMessages;
}

export function DropZone({ onFiles, accept, multiple = true, messages }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (event.dataTransfer.files.length > 0) {
        onFiles(event.dataTransfer.files);
      }
    },
    [onFiles]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`lumeo:flex lumeo:cursor-pointer lumeo:select-none lumeo:flex-col lumeo:items-center lumeo:justify-center lumeo:gap-2 lumeo:rounded-lg lumeo:border-2 lumeo:border-dashed lumeo:p-10 lumeo:text-center lumeo:outline-none lumeo:transition-colors ${
        isDragging ? "lumeo:border-zinc-900 lumeo:bg-zinc-50" : "lumeo:border-zinc-300 lumeo:bg-white lumeo:hover:bg-zinc-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="lumeo:hidden"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <UploadCloud size={28} className={isDragging ? "lumeo:text-zinc-900" : "lumeo:text-zinc-400"} />
      <p className="lumeo:text-sm lumeo:font-medium lumeo:text-zinc-900">{messages.dropzoneCta}</p>
      <p className={sectionLabel}>{multiple ? messages.dropzoneMultiple : messages.dropzoneSingle}</p>
    </div>
  );
}
