import { Trash2 } from "lucide-react";
import type { PendingFile } from "../../hooks/useUploadQueue";
import { formatBytes } from "../../lib/validateFiles";
import { panel, iconButton } from "../../styles/editorial";
import type { LumeoMessages } from "../../lib/i18n";

export interface PendingFileListProps {
  items: PendingFile[];
  onRemove: (id: string) => void;
  messages: LumeoMessages;
}

export function PendingFileList({ items, onRemove, messages }: PendingFileListProps) {
  if (items.length === 0) return null;
  return (
    <ul className={`lumeo:list-none lumeo:divide-y lumeo:divide-zinc-100 lumeo:overflow-hidden ${panel}`}>
      {items.map((item) => (
        <li key={item.id} className="lumeo:flex lumeo:items-center lumeo:gap-3 lumeo:px-3 lumeo:py-2.5">
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="lumeo:h-9 lumeo:w-9 lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:object-cover"
          />
          <div className="lumeo:min-w-0 lumeo:flex-1">
            <p className="lumeo:truncate lumeo:text-sm lumeo:font-medium lumeo:text-zinc-900">{item.file.name}</p>
            <p className="lumeo:text-xs lumeo:text-zinc-500">{formatBytes(item.file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className={`lumeo:h-7 lumeo:w-7 ${iconButton}`}
            aria-label={messages.removeFile(item.file.name)}
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
