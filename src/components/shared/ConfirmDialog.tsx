import { primaryButton, outlineButton, dangerButton } from "../../styles/editorial";

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** "danger" styles the confirm button red, for destructive actions like delete. */
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small centered "are you sure?" overlay, layered above whatever modal triggered it. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="lumeo-root lumeo:fixed lumeo:inset-0 lumeo:z-[60] lumeo:flex lumeo:items-center lumeo:justify-center lumeo:bg-zinc-900/50 lumeo:p-4 lumeo:font-sans lumeo:backdrop-blur-sm lumeo:animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="lumeo:w-full lumeo:max-w-sm lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:p-5 lumeo:shadow-lg lumeo:animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="lumeo:text-sm lumeo:font-semibold lumeo:text-zinc-900">{title}</p>
        <p className="lumeo:mt-1.5 lumeo:text-xs lumeo:text-zinc-500">{message}</p>
        <div className="lumeo:mt-4 lumeo:flex lumeo:justify-end lumeo:gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`lumeo:px-3 lumeo:py-1.5 lumeo:text-sm lumeo:font-medium ${outlineButton}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`lumeo:px-3 lumeo:py-1.5 lumeo:text-sm lumeo:font-medium ${tone === "danger" ? dangerButton : primaryButton}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
