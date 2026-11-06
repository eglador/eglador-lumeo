import type { LumeoImage, LumeoImageTypeOption, LumeoLocale } from "../../types";
import { TypeBadge } from "./TypeBadge";
import { InlineImageBadge } from "./InlineImageBadge";
import { CropBadge } from "./CropBadge";
import { DownloadButton } from "./DownloadButton";
import { tagOutline } from "../../styles/editorial";
import { getMessages } from "../../lib/i18n";

export interface GridViewProps {
  images: LumeoImage[];
  imageTypes: LumeoImageTypeOption[];
  onSelectImage: (image: LumeoImage) => void;
  locale?: LumeoLocale;
  /** From `LumeoConfig.inlineImageBadgeLabel` — see `InlineImageBadge`. */
  inlineImageBadgeLabel?: string;
}

export function GridView({ images, imageTypes, onSelectImage, locale, inlineImageBadgeLabel }: GridViewProps) {
  const messages = getMessages(locale);

  return (
    <div className="lumeo:grid lumeo:grid-cols-2 lumeo:gap-3 lumeo:sm:grid-cols-3 lumeo:md:grid-cols-4 lumeo:lg:grid-cols-5">
      {images.map((image) => (
        <div key={image.id} className="lumeo:group lumeo:relative">
          <button
            type="button"
            onClick={() => onSelectImage(image)}
            className="lumeo:p-0 lumeo:relative lumeo:block lumeo:w-full lumeo:aspect-square lumeo:rounded-lg lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-50 lumeo:shadow-xs lumeo:transition-shadow lumeo:hover:shadow-sm"
          >
            <div className="lumeo:absolute lumeo:inset-0 lumeo:overflow-hidden lumeo:rounded-lg">
              <img
                src={image.thumbUrl ?? image.url}
                alt={image.fileName}
                className="lumeo:h-full lumeo:w-full lumeo:object-cover lumeo:transition-transform lumeo:group-hover:scale-105"
              />
            </div>
            <div className="lumeo:absolute lumeo:bottom-1.5 lumeo:left-1.5 lumeo:flex lumeo:flex-wrap lumeo:gap-1">
              <TypeBadge type={image.type} imageTypes={imageTypes} />
              <InlineImageBadge image={image} label={inlineImageBadgeLabel} />
              {(image.crops ?? []).map((crop) => (
                <CropBadge
                  key={crop.id}
                  image={image}
                  crop={crop}
                  labelClassName={`${tagOutline} lumeo:flex lumeo:items-center lumeo:gap-0.5 lumeo:bg-white/90`}
                />
              ))}
            </div>
          </button>
          {/* Revealed on hover / keyboard focus; always visible on touch screens, which have no hover. */}
          <DownloadButton
            image={image}
            label={messages.downloadOriginal}
            className="lumeo:absolute lumeo:top-1.5 lumeo:right-1.5 lumeo:opacity-0 lumeo:group-hover:opacity-100 lumeo:focus-visible:opacity-100 lumeo:pointer-coarse:opacity-100"
          />
        </div>
      ))}
    </div>
  );
}
