import { AlertTriangle, X } from "lucide-react";
import type { RejectedFile } from "../../types";
import type { LumeoMessages } from "../../lib/i18n";

export interface RejectedFileNoticeProps {
  items: RejectedFile[];
  onDismiss: () => void;
  messages: LumeoMessages;
}

export function RejectedFileNotice({ items, onDismiss, messages }: RejectedFileNoticeProps) {
  if (items.length === 0) return null;

  const reasonLabel: Record<RejectedFile["reason"], string> = {
    type: messages.reasonType,
    size: messages.reasonSize,
    "max-files": messages.reasonMaxFiles,
  };

  return (
    <div className="lumeo:rounded-lg lumeo:border lumeo:border-red-200 lumeo:bg-red-50 lumeo:p-3 lumeo:text-sm lumeo:text-red-700">
      <div className="lumeo:flex lumeo:items-start lumeo:justify-between lumeo:gap-2">
        <p className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:font-medium">
          <AlertTriangle size={14} /> {messages.rejectedCount(items.length)}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="lumeo:flex lumeo:h-6 lumeo:w-6 lumeo:items-center lumeo:justify-center lumeo:rounded-sm lumeo:text-red-500 lumeo:transition-colors lumeo:hover:bg-red-100 lumeo:hover:text-red-700"
          aria-label={messages.close}
        >
          <X size={13} />
        </button>
      </div>
      <ul className="lumeo:mt-1 lumeo:list-inside lumeo:list-disc">
        {items.map((item, index) => (
          <li key={`${item.file.name}-${index}`}>
            {item.file.name} — {reasonLabel[item.reason]}
          </li>
        ))}
      </ul>
    </div>
  );
}
