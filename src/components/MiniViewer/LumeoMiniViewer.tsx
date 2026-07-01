import { useEffect, useMemo, useRef, useState } from "react";
import { Images, ChevronDown, ChevronUp, RefreshCw, Check } from "lucide-react";
import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useLumeoImages } from "../../hooks/useLumeoImages";
import { resolveImageTypes } from "../../lib/imageTypes";
import { getMessages } from "../../lib/i18n";
import { panel, iconButton, inputBase } from "../../styles/editorial";
import type { LumeoImage } from "../../types";

export interface LumeoMiniViewerProps {
  /** Called when the user clicks a thumbnail; wire this into your own editor/CMS logic. */
  onImageClick: (image: LumeoImage) => void;
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

const CORNER_CLASS: Record<NonNullable<LumeoMiniViewerProps["corner"]>, string> = {
  "top-left": "lumeo:top-4 lumeo:left-4",
  "top-right": "lumeo:top-4 lumeo:right-4",
  "bottom-left": "lumeo:bottom-4 lumeo:left-4",
  "bottom-right": "lumeo:bottom-4 lumeo:right-4",
};

/** Minimal standalone corner widget that lists uploaded images, optionally filtered by usage type. */
export function LumeoMiniViewer({ onImageClick, corner = "bottom-right", className }: LumeoMiniViewerProps) {
  const config = useLumeoConfig();
  const messages = useMemo(() => getMessages(config.locale), [config.locale]);
  const imageTypes = useMemo(
    () => resolveImageTypes(config.imageTypes, config.locale),
    [config.imageTypes, config.locale]
  );
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { images, loading, refetch } = useLumeoImages(config, {
    type: typeFilter === "all" ? undefined : typeFilter,
  });
  const [collapsed, setCollapsed] = useState(false);
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
    refetch();
  };

  return (
    <div
      className={`lumeo-root lumeo:fixed lumeo:z-40 lumeo:w-72 lumeo:overflow-hidden lumeo:font-sans ${panel} ${CORNER_CLASS[corner]} ${className ?? ""}`}
    >
      <div className="lumeo:flex lumeo:items-center lumeo:justify-between lumeo:border-b lumeo:border-zinc-100 lumeo:px-3 lumeo:py-2.5">
        <p className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:text-xs lumeo:font-semibold lumeo:text-zinc-900">
          <Images size={14} className="lumeo:text-zinc-500" /> {messages.miniViewerTitle}
        </p>
        <div className="lumeo:flex lumeo:items-center lumeo:gap-1">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={loading}
            className={`lumeo:h-6 lumeo:w-6 ${iconButton}`}
            aria-label={messages.refreshList}
            title={messages.refreshList}
          >
            {justRefreshed ? (
              <Check size={12} />
            ) : (
              <RefreshCw size={12} className={loading ? "lumeo:animate-spin" : ""} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`lumeo:h-6 lumeo:w-6 ${iconButton}`}
            aria-label={collapsed ? messages.show : messages.hide}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="lumeo:flex lumeo:flex-col lumeo:gap-2 lumeo:p-3">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={inputBase}
          >
            <option value="all">{messages.all}</option>
            {imageTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="lumeo:grid lumeo:max-h-64 lumeo:grid-cols-3 lumeo:gap-1.5 lumeo:overflow-y-auto">
            {loading && images.length === 0 ? (
              <p className="lumeo:col-span-3 lumeo:py-4 lumeo:text-center lumeo:text-xs lumeo:text-zinc-400">
                {messages.loading}
              </p>
            ) : images.length === 0 ? (
              <p className="lumeo:col-span-3 lumeo:py-4 lumeo:text-center lumeo:text-xs lumeo:text-zinc-400">
                {messages.noImages}
              </p>
            ) : (
              images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onImageClick(image)}
                  className="lumeo:aspect-square lumeo:overflow-hidden lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:transition-transform lumeo:hover:scale-105"
                >
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="lumeo:h-full lumeo:w-full lumeo:object-cover"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
