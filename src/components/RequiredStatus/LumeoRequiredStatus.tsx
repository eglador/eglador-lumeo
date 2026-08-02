import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useLumeoImages } from "../../hooks/useLumeoImages";
import { useRequiredImageTypes } from "../../hooks/useRequiredImageTypes";
import { getMessages } from "../../lib/i18n";
import { panel, sectionLabel } from "../../styles/editorial";
import type { RequiredTypeStatus } from "../../types";

export interface LumeoRequiredStatusProps {
  className?: string;
}

function StatusDot({ satisfied }: { satisfied: boolean }) {
  return (
    <span
      className={`lumeo:h-1.5 lumeo:w-1.5 lumeo:shrink-0 lumeo:rounded-full ${
        satisfied ? "lumeo:bg-emerald-500" : "lumeo:bg-red-500"
      }`}
    />
  );
}

function StatusLabel({ satisfied, label }: { satisfied: boolean; label: string }) {
  return (
    <span
      className={`lumeo:inline-flex lumeo:items-center lumeo:gap-1 ${
        satisfied ? "lumeo:text-emerald-700" : "lumeo:text-red-700"
      }`}
    >
      <StatusDot satisfied={satisfied} />
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: RequiredTypeStatus }) {
  // A group's own name/label prefixes its children; an individually-required leaf still nested
  // inside a group borrows that group's name instead, so every pill's origin is clear either way.
  const prefix = status.children
    ? (status.option.name ?? status.option.label)
    : status.parent && (status.parent.name ?? status.parent.label);

  return (
    <span
      className={`lumeo:inline-flex lumeo:items-center lumeo:gap-2 lumeo:rounded-full lumeo:border lumeo:px-2.5 lumeo:py-1 lumeo:text-xs ${
        status.satisfied ? "lumeo:border-emerald-300" : "lumeo:border-zinc-200"
      }`}
    >
      {prefix && <span className="lumeo:font-medium lumeo:text-zinc-500">{prefix}:</span>}
      {status.children ? (
        status.children.map((child) => (
          <StatusLabel key={String(child.option.value)} satisfied={child.satisfied} label={child.option.label} />
        ))
      ) : (
        <StatusLabel satisfied={status.satisfied} label={status.option.label} />
      )}
    </span>
  );
}

/**
 * Minimal, self-contained checklist for every usage type marked `required` in `imageTypes` (see
 * `LumeoImageTypeOption.required`) — renders nothing at all when nothing is marked required.
 * A group entry (has `crops`) shows as one pill with every child individually colored by its own
 * satisfied state; a leaf required on its own but still nested inside a group borrows that
 * group's name as a prefix (e.g. "Haberler: Kapak") so its origin stays clear too.
 *
 * Reads the same shared image-list cache as `LumeoUploader`/`ImageModal` (see `useLumeoImages`),
 * so it updates automatically the moment a crop is saved anywhere in your app — no manual
 * refresh. Place it anywhere inside a `LumeoProvider`; it doesn't need to be near `LumeoUploader`.
 */
export function LumeoRequiredStatus({ className }: LumeoRequiredStatusProps) {
  const config = useLumeoConfig();
  const messages = getMessages(config.locale);
  const { allImages } = useLumeoImages(config);
  const { statuses } = useRequiredImageTypes(allImages, config);

  if (statuses.length === 0) return null;

  return (
    <div className={`lumeo-root lumeo:p-2.5 ${panel} ${className ?? ""}`}>
      <p className={`lumeo:mb-1.5 ${sectionLabel}`}>{messages.requiredCropsTitle}</p>
      <div className="lumeo:flex lumeo:flex-wrap lumeo:gap-2">
        {statuses.map((status) => (
          <StatusPill key={String(status.option.value)} status={status} />
        ))}
      </div>
    </div>
  );
}
