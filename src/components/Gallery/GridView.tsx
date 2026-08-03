import { Crop } from "lucide-react";
import type { LumeoImage, LumeoImageTypeOption } from "../../types";
import { TypeBadge } from "./TypeBadge";
import { resolveCropLabels } from "../../lib/imageTypes";
import { tagOutline } from "../../styles/editorial";

export interface GridViewProps {
  images: LumeoImage[];
  imageTypes: LumeoImageTypeOption[];
  onSelectImage: (image: LumeoImage) => void;
}

export function GridView({ images, imageTypes, onSelectImage }: GridViewProps) {
  return (
    <div className="lumeo:grid lumeo:grid-cols-2 lumeo:gap-3 lumeo:sm:grid-cols-3 lumeo:md:grid-cols-4 lumeo:lg:grid-cols-5">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelectImage(image)}
          className="lumeo:group lumeo:p-0 lumeo:relative lumeo:aspect-square lumeo:overflow-hidden lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-50 lumeo:shadow-xs lumeo:transition-shadow lumeo:hover:shadow-sm"
        >
          <img
            src={image.url}
            alt={image.fileName}
            className="lumeo:h-full lumeo:w-full lumeo:object-cover lumeo:transition-transform lumeo:group-hover:scale-105"
          />
          <div className="lumeo:absolute lumeo:bottom-1.5 lumeo:left-1.5 lumeo:flex lumeo:flex-wrap lumeo:gap-1">
            <TypeBadge type={image.type} imageTypes={imageTypes} />
            {resolveCropLabels(image).map((label, index) => (
              <span
                key={`${label}-${index}`}
                className={`${tagOutline} lumeo:flex lumeo:items-center lumeo:gap-0.5 lumeo:bg-white/90`}
              >
                <Crop size={9} /> {label}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
