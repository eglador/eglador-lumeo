import { findImageTypeLabel } from "../../lib/imageTypes";
import { tag } from "../../styles/editorial";
import type { LumeoImageTypeOption } from "../../types";

export interface TypeBadgeProps {
  type?: string;
  imageTypes: LumeoImageTypeOption[];
}

export function TypeBadge({ type, imageTypes }: TypeBadgeProps) {
  if (!type) return null;
  const label = findImageTypeLabel(type, imageTypes) ?? type;
  return <span className={tag}>{label}</span>;
}
