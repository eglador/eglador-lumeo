import type { LumeoImage } from "../../types";

export interface InlineImageBadgeProps {
  image: LumeoImage;
  /** From `LumeoConfig.inlineImageBadgeLabel` — badge is only rendered when both this and `image.imageType === "InlineImage"` are set. */
  label?: string;
}

/** Distinct (indigo, not the usual black/outline) badge for an image tagged `imageType: "InlineImage"` — stands apart from `TypeBadge`/crop-label badges at a glance. */
export function InlineImageBadge({ image, label }: InlineImageBadgeProps) {
  if (!label || image.imageType !== "InlineImage") return null;
  return (
    <span className="lumeo:inline-flex lumeo:items-center lumeo:rounded-sm lumeo:border lumeo:border-indigo-600 lumeo:bg-indigo-600 lumeo:px-2 lumeo:py-0.5 lumeo:text-[10px] lumeo:font-medium lumeo:text-white">
      {label}
    </span>
  );
}
