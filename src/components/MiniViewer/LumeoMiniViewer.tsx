import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Images, ChevronDown, ChevronUp, RefreshCw, Check } from "lucide-react";
import { useLumeoConfig } from "../../hooks/useLumeoConfig";
import { useLumeoImages } from "../../hooks/useLumeoImages";
import { resolveImageTypes, findImageTypeLabel } from "../../lib/imageTypes";
import { getMessages } from "../../lib/i18n";
import { panel, iconButton, inputBase } from "../../styles/editorial";
import type { LumeoImage } from "../../types";

/** Default token inside `LumeoMiniViewerDragConfig.pattern` that gets replaced with the resolved value. */
const DEFAULT_DRAG_PLACEHOLDER = "{value}";

export interface LumeoMiniViewerDragConfig {
  /** Template string containing `placeholder`, e.g. `"#resim#{value}#"`. */
  pattern: string;
  /** Token inside `pattern` to substitute. Default: `"{value}"`. */
  placeholder?: string;
  /** Resolves the value substituted for `placeholder`. Default: `(image) => image.id`. */
  getValue?: (image: LumeoImage) => string;
  /** `dataTransfer` MIME type the payload is written to. Default: `"text/plain"`. */
  format?: string;
}

export interface LumeoMiniViewerProps {
  /** Called when the user clicks a thumbnail; wire this into your own editor/CMS logic. */
  onImageClick: (image: LumeoImage) => void;
  /**
   * "fixed" (default): pinned to a viewport corner via `corner`, matching the original
   * floating-widget behavior. "static": a normal in-flow element with no positioning
   * classes — place and position it yourself inside any container.
   */
  position?: "fixed" | "static";
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
  /**
   * Enables HTML5 drag-and-drop export of thumbnails (e.g. into a rich text editor).
   * Omit to leave thumbnails non-draggable.
   */
  dragData?: LumeoMiniViewerDragConfig;
  /** Renders collapsed (small chip) on first mount instead of expanded. Default: false. */
  defaultCollapsed?: boolean;
}

const CORNER_CLASS: Record<NonNullable<LumeoMiniViewerProps["corner"]>, string> = {
  "top-left": "lumeo:top-4 lumeo:left-4",
  "top-right": "lumeo:top-4 lumeo:right-4",
  "bottom-left": "lumeo:bottom-4 lumeo:left-4",
  "bottom-right": "lumeo:bottom-4 lumeo:right-4",
};

function buildDragPayload(image: LumeoImage, config: LumeoMiniViewerDragConfig): string {
  const token = config.placeholder ?? DEFAULT_DRAG_PLACEHOLDER;
  const value = (config.getValue ?? ((img: LumeoImage) => img.id))(image);
  return config.pattern.split(token).join(value);
}

/** Minimal standalone corner widget that lists uploaded images, optionally filtered by usage type. */
export function LumeoMiniViewer({
  onImageClick,
  position = "fixed",
  corner = "bottom-right",
  className,
  dragData,
  defaultCollapsed = false,
}: LumeoMiniViewerProps) {
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
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const refreshTriggeredRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Once set, this overrides the `corner` anchoring with an explicit free-floating position.
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startPointer: { x: number; y: number };
    startPos: { x: number; y: number };
  } | null>(null);

  const handleHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (position !== "fixed") return;
    // Let header buttons (refresh, collapse) handle their own clicks instead of starting a drag.
    if ((event.target as HTMLElement).closest("button")) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      startPos: { x: rect.left, y: rect.top },
    };
  };

  const handleHeaderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const el = containerRef.current;
    if (!drag || !el) return;
    const dx = event.clientX - drag.startPointer.x;
    const dy = event.clientY - drag.startPointer.y;
    const maxX = Math.max(0, window.innerWidth - el.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - el.offsetHeight);
    setDragPos({
      x: Math.min(Math.max(drag.startPos.x + dx, 0), maxX),
      y: Math.min(Math.max(drag.startPos.y + dy, 0), maxY),
    });
  };

  const handleHeaderPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

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

  const positionClasses = position === "fixed" ? `lumeo:fixed lumeo:z-40 ${CORNER_CLASS[corner]}` : "";
  const canDrag = position === "fixed";
  // Once the user drags it, explicit top/left pixel coordinates replace the corner anchoring.
  const dragStyle = dragPos ? { top: dragPos.y, left: dragPos.x, right: "auto", bottom: "auto" } : undefined;

  return (
    <div
      ref={containerRef}
      style={dragStyle}
      className={`lumeo-root lumeo:overflow-hidden lumeo:font-sans ${panel} ${positionClasses} ${
        collapsed ? "lumeo:w-auto" : "lumeo:w-72"
      } ${className ?? ""}`}
    >
      <div
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handleHeaderPointerMove}
        onPointerUp={handleHeaderPointerUp}
        onPointerCancel={handleHeaderPointerUp}
        className={`lumeo:flex lumeo:items-center lumeo:justify-between lumeo:gap-2 lumeo:px-3 lumeo:py-2.5 ${
          collapsed ? "" : "lumeo:border-b lumeo:border-zinc-100"
        } ${canDrag ? "lumeo:cursor-grab lumeo:touch-none lumeo:select-none lumeo:active:cursor-grabbing" : ""}`}
      >
        <p className="lumeo:flex lumeo:items-center lumeo:gap-1.5 lumeo:text-xs lumeo:font-semibold lumeo:whitespace-nowrap lumeo:text-zinc-900">
          <Images size={14} className="lumeo:text-zinc-500" />
          {collapsed ? "Lumeo" : messages.miniViewerTitle}
          {collapsed && images.length > 0 && (
            <span className="lumeo:rounded-full lumeo:bg-zinc-900 lumeo:px-1.5 lumeo:text-[10px] lumeo:text-white">
              {images.length}
            </span>
          )}
        </p>
        <div className="lumeo:flex lumeo:items-center lumeo:gap-1">
          {!collapsed && (
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
          )}
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
              images.map((image) => {
                const typeLabel = image.type ? (findImageTypeLabel(image.type, imageTypes) ?? image.type) : undefined;
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => onImageClick(image)}
                    draggable={Boolean(dragData)}
                    onDragStart={
                      dragData
                        ? (event) => {
                            event.dataTransfer.setData(
                              dragData.format ?? "text/plain",
                              buildDragPayload(image, dragData)
                            );
                            event.dataTransfer.effectAllowed = "copy";
                          }
                        : undefined
                    }
                    className="lumeo:group lumeo:relative lumeo:aspect-square lumeo:p-0 lumeo:overflow-hidden lumeo:rounded-sm lumeo:border lumeo:border-zinc-200 lumeo:transition-transform"
                  >
                    <img
                      src={image.url}
                      alt={image.fileName}
                      draggable={false}
                      className="lumeo:h-full lumeo:w-full lumeo:object-cover"
                    />
                    <div className="lumeo:absolute lumeo:inset-x-0 lumeo:bottom-0 lumeo:flex lumeo:flex-col lumeo:items-start lumeo:gap-0.5 lumeo:bg-linear-to-t lumeo:from-black/80 lumeo:to-transparent lumeo:px-1 lumeo:pt-3 lumeo:pb-1">
                      {typeLabel && (
                        <span className="lumeo:max-w-full lumeo:truncate lumeo:rounded-xs lumeo:bg-zinc-900/90 lumeo:px-1 lumeo:text-[8px] lumeo:leading-3.5 lumeo:font-medium lumeo:text-white">
                          {typeLabel}
                        </span>
                      )}
                      {image.width && image.height && (
                        <span className="lumeo:text-[8px] lumeo:leading-2.5 lumeo:font-medium lumeo:text-white/90">
                          {image.width}×{image.height}
                        </span>
                      )}
                      <span
                        className="lumeo:w-full lumeo:truncate lumeo:text-[8px] lumeo:leading-2.5 lumeo:text-white/70"
                        title={image.id}
                      >
                        {image.id}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
