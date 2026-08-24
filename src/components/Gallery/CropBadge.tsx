import { Crop } from "lucide-react";
import type { CropRegion, LumeoImage } from "../../types";

export interface CropBadgeProps {
  image: LumeoImage;
  crop: CropRegion;
  /** Full className for the visible label pill — lets GridView/DetailView keep their own look. */
  labelClassName: string;
  iconSize?: number;
}

const PREVIEW_WIDTH = 160;

/**
 * A crop-name badge that shows the actual cropped region on hover, reusing the same
 * CSS background-position/size technique as `TypeCropSelector` — no extra image load.
 */
export function CropBadge({ image, crop, labelClassName, iconSize = 9 }: CropBadgeProps) {
  const canPreview = Boolean(image.width) && Boolean(image.height) && crop.width > 0 && crop.height > 0;
  const scale = canPreview ? PREVIEW_WIDTH / crop.width : 0;

  return (
    <span className="lumeo:group/cropbadge lumeo:relative lumeo:inline-flex">
      <span className={labelClassName}>
        <Crop size={iconSize} /> {crop.name}
      </span>

      {canPreview && (
        <span
          className="lumeo:pointer-events-none lumeo:absolute lumeo:bottom-full lumeo:left-0 lumeo:z-10 lumeo:mb-1.5 lumeo:block lumeo:overflow-hidden lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:bg-white lumeo:opacity-0 lumeo:shadow-lg lumeo:transition-opacity lumeo:duration-150 lumeo:group-hover/cropbadge:opacity-100"
          style={{
            width: PREVIEW_WIDTH,
            height: crop.height * scale,
            backgroundImage: `url(${image.url})`,
            backgroundSize: `${image.width! * scale}px ${image.height! * scale}px`,
            backgroundPosition: `-${crop.x * scale}px -${crop.y * scale}px`,
          }}
        />
      )}
    </span>
  );
}
