import { findImageTypeLabel } from "../../lib/imageTypes";
import { tag } from "../../styles/editorial";
import type { LumeoImageTypeOption, LumeoTypeValue } from "../../types";

export interface TypeBadgeProps {
  type?: LumeoTypeValue;
  imageTypes: LumeoImageTypeOption[];
}

export function TypeBadge({ type, imageTypes }: TypeBadgeProps) {
  if (type === undefined) return null;
  const label = findImageTypeLabel(type, imageTypes) ?? String(type);
  return <span className={tag}>{label}</span>;
}
