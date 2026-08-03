import { Calendar, Crop } from "lucide-react";
import type { LumeoImage, LumeoImageTypeOption, LumeoLocale } from "../../types";
import { TypeBadge } from "./TypeBadge";
import { resolveCropLabels } from "../../lib/imageTypes";
import { panel } from "../../styles/editorial";
import { dateLocaleTag } from "../../lib/i18n";

export interface DetailViewProps {
  images: LumeoImage[];
  imageTypes: LumeoImageTypeOption[];
  onSelectImage: (image: LumeoImage) => void;
  locale?: LumeoLocale;
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function DetailView({ images, imageTypes, onSelectImage, locale }: DetailViewProps) {
  const dateLocale = dateLocaleTag(locale);

  return (
    <div className="lumeo:flex lumeo:flex-col lumeo:gap-2">
      {images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onSelectImage(image)}
          className={`lumeo:flex lumeo:items-center lumeo:gap-4 lumeo:p-3 lumeo:text-left lumeo:transition-colors lumeo:hover:bg-zinc-50 ${panel}`}
        >
          <img
            src={image.url}
            alt={image.fileName}
            className="lumeo:h-16 lumeo:w-16 lumeo:shrink-0 lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:object-cover"
          />
          <div className="lumeo:min-w-0 lumeo:flex-1">
            <p className="lumeo:truncate lumeo:text-sm lumeo:font-medium lumeo:text-zinc-900">{image.fileName}</p>
            <div className="lumeo:mt-0.5 lumeo:flex lumeo:flex-wrap lumeo:items-center lumeo:gap-x-3 lumeo:gap-y-0.5 lumeo:text-xs lumeo:text-zinc-500">
              <span className="lumeo:flex lumeo:items-center lumeo:gap-1">
                <Calendar size={11} /> {formatDate(image.uploadedAt, dateLocale)}
              </span>
              {resolveCropLabels(image).map((label, index) => (
                <span key={`${label}-${index}`} className="lumeo:flex lumeo:items-center lumeo:gap-1">
                  <Crop size={11} /> {label}
                </span>
              ))}
            </div>
          </div>
          <TypeBadge type={image.type} imageTypes={imageTypes} />
        </button>
      ))}
    </div>
  );
}
