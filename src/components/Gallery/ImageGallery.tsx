import { useEffect, useRef, useState } from "react";
import { LayoutGrid, Rows3, RefreshCw, Check } from "lucide-react";
import type { LumeoImage, LumeoImageTypeOption, LumeoViewMode } from "../../types";
import { GridView } from "./GridView";
import { DetailView } from "./DetailView";
import { iconButton } from "../../styles/editorial";
import { getMessages, type LumeoMessages } from "../../lib/i18n";
import type { LumeoLocale } from "../../types";

export interface ImageGalleryProps {
  images: LumeoImage[];
  loading: boolean;
  viewMode: LumeoViewMode;
  onViewModeChange: (mode: LumeoViewMode) => void;
  imageTypes: LumeoImageTypeOption[];
  onSelectImage: (image: LumeoImage) => void;
  /** Lets the user manually refetch the list, e.g. to see uploads made elsewhere. */
  onRefresh?: () => void;
  /** Falls back to English (`getMessages()`) if omitted, e.g. when used standalone outside a provider. */
  messages?: LumeoMessages;
  locale?: LumeoLocale;
}

export function ImageGallery({
  images,
  loading,
  viewMode,
  onViewModeChange,
  imageTypes,
  onSelectImage,
  onRefresh,
  messages: messagesProp,
  locale,
}: ImageGalleryProps) {
  const messages = messagesProp ?? getMessages(locale);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const refreshTriggeredRef = useRef(false);

  useEffect(() => {
    if (!loading && refreshTriggeredRef.current) {
      refreshTriggeredRef.current = false;
      setJustRefreshed(true);
      const timeout = setTimeout(() => setJustRefreshed(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  const handleRefreshClick = () => {
    refreshTriggeredRef.current = true;
    setJustRefreshed(false);
    onRefresh?.();
  };

  const viewModes: { mode: LumeoViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { mode: "grid", label: messages.viewGrid, icon: LayoutGrid },
    { mode: "detail", label: messages.viewDetail, icon: Rows3 },
  ];

  return (
    <div className="lumeo:flex lumeo:flex-col lumeo:gap-3">
      <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:gap-2">
        <div className="lumeo:flex lumeo:items-center lumeo:gap-2">
          <p className="lumeo:text-xs lumeo:font-medium lumeo:uppercase lumeo:tracking-wide lumeo:text-zinc-500">
            {messages.imageCount(images.length)}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshClick}
              disabled={loading}
              title={messages.refreshList}
              aria-label={messages.refreshList}
              className={`lumeo:h-6 lumeo:w-6 ${iconButton}`}
            >
              {justRefreshed ? (
                <Check size={12} />
              ) : (
                <RefreshCw size={12} className={loading ? "lumeo:animate-spin" : ""} />
              )}
            </button>
          )}
        </div>
        <div className="lumeo:flex lumeo:gap-1 lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:bg-zinc-100 lumeo:p-0.5">
          {viewModes.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              title={label}
              aria-label={label}
              className={`lumeo:flex lumeo:h-7 lumeo:w-7 lumeo:items-center lumeo:justify-center lumeo:rounded-sm lumeo:transition-colors ${
                viewMode === mode
                  ? "lumeo:bg-white lumeo:text-zinc-900 lumeo:shadow-xs"
                  : "lumeo:text-zinc-500 lumeo:hover:text-zinc-900"
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {loading && images.length === 0 ? (
        <p className="lumeo:py-8 lumeo:text-center lumeo:text-sm lumeo:text-zinc-400">{messages.loading}</p>
      ) : images.length === 0 ? (
        <p className="lumeo:py-8 lumeo:text-center lumeo:text-sm lumeo:text-zinc-400">{messages.noImages}</p>
      ) : viewMode === "grid" ? (
        <GridView images={images} imageTypes={imageTypes} onSelectImage={onSelectImage} />
      ) : (
        <DetailView images={images} imageTypes={imageTypes} onSelectImage={onSelectImage} locale={locale} />
      )}
    </div>
  );
}
