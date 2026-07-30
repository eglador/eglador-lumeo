import React, { useCallback, useEffect, useRef } from "react";
import {
  moveRect,
  resizeRect,
  scaleRectAxes,
  roundRect,
  pointInRect,
  hitTestHandle,
  CORNER_HANDLES,
  EDGE_HANDLES,
} from "../../../lib/geometry";
import type { Rect, HandleId, Bounds } from "../../../lib/geometry";
import { drawCropOverlay } from "../../../lib/canvasCropRenderer";
import type { CropRegion } from "../../../types";

export interface CropCanvasProps {
  regions: CropRegion[];
  activeRegionId: string | null;
  /** naturalWidth/naturalHeight of the underlying image. */
  naturalSize: Bounds;
  /** Called once, on pointerup, with the committed rect in natural pixel space. */
  onChange: (id: string, rect: Rect) => void;
}

interface DragState {
  kind: "move" | HandleId;
  startClient: { x: number; y: number };
  startRectCss: Rect;
}

const READOUT_OFFSET = 24;

function formatReadout(rect: Rect): string {
  return `x: ${Math.round(rect.x)}, y: ${Math.round(rect.y)} · w: ${Math.round(rect.width)}px, h: ${Math.round(rect.height)}px`;
}

function handlesForAspect(aspect: number | undefined): HandleId[] {
  return aspect ? CORNER_HANDLES : [...CORNER_HANDLES, ...EDGE_HANDLES];
}

/**
 * Single shared canvas drawing every crop region's outline, plus drag/resize interaction for
 * whichever one is active. Only the active region is ever hit-tested — switching which region is
 * active happens via the separate Crop Regions list, never by clicking here (existing rule,
 * carried over from the previous DOM-based overlay).
 *
 * The canvas sizes its own backing store from a single `getBoundingClientRect()` reading (cached
 * in `cssRectRef`) that feeds both the pixel size used to draw *and* the natural<->css scale used
 * to place every rect and hit-test pointer events. Never cross-reference a second measurement API
 * (img.clientWidth, ResizeObserver.contentRect, etc.) here — that mismatch is exactly what caused
 * the crop border to visibly miss the image edge on a "largest fit" box in the old implementation.
 */
export function CropCanvas({ regions, activeRegionId, naturalSize, onChange }: CropCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const cssRectRef = useRef<Rect>({ x: 0, y: 0, width: 0, height: 0 });
  const backingSizeRef = useRef({ width: 0, height: 0 });
  const dragRef = useRef<DragState | null>(null);
  const liveActiveRectRef = useRef<Rect | null>(null);

  const activeRegion = regions.find((region) => region.id === activeRegionId) ?? null;

  const naturalToCss = useCallback(
    (rect: Rect): Rect =>
      scaleRectAxes(
        rect,
        cssRectRef.current.width / (naturalSize.width || 1),
        cssRectRef.current.height / (naturalSize.height || 1)
      ),
    [naturalSize]
  );

  const cssToNatural = useCallback(
    (rect: Rect): Rect =>
      scaleRectAxes(
        rect,
        (naturalSize.width || 1) / (cssRectRef.current.width || 1),
        (naturalSize.height || 1) / (cssRectRef.current.height || 1)
      ),
    [naturalSize]
  );

  const positionReadout = useCallback((cssRect: Rect, naturalRect: Rect) => {
    const el = readoutRef.current;
    if (!el) return;
    el.style.left = `${cssRect.x}px`;
    el.style.top = `${cssRect.y - READOUT_OFFSET}px`;
    el.textContent = formatReadout(naturalRect);
  }, []);

  const redraw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawCropOverlay(ctx, {
      cssSize: cssRectRef.current,
      naturalSize,
      regions,
      activeRegionId,
      liveActiveRect: liveActiveRectRef.current ?? undefined,
    });
  }, [regions, activeRegionId, naturalSize]);

  const syncOverlay = useCallback(() => {
    redraw();
    if (activeRegion) {
      const naturalRect = liveActiveRectRef.current ?? activeRegion;
      positionReadout(naturalToCss(naturalRect), naturalRect);
    }
  }, [redraw, activeRegion, naturalToCss, positionReadout]);

  const resizeCanvasToDisplaySize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    cssRectRef.current = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    const dpr = window.devicePixelRatio || 1;
    const backingWidth = Math.round(rect.width * dpr);
    const backingHeight = Math.round(rect.height * dpr);
    // Reassigning canvas.width/height clears the canvas and resets its transform even when the
    // value doesn't change — only do it (and only re-apply the dpr transform) when it actually did.
    if (backingSizeRef.current.width !== backingWidth || backingSizeRef.current.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
      backingSizeRef.current = { width: backingWidth, height: backingHeight };
      canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    syncOverlay();
  }, [syncOverlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    resizeCanvasToDisplaySize();
    const observer = new ResizeObserver(() => {
      // A layout shift mid-drag invalidates the drag's start geometry — cancel rather than
      // reconcile stale coordinates; resizing the window mid-drag is a vanishingly rare case.
      if (dragRef.current) {
        dragRef.current = null;
        liveActiveRectRef.current = null;
      }
      resizeCanvasToDisplaySize();
    });
    observer.observe(canvas);
    window.addEventListener("resize", resizeCanvasToDisplaySize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resizeCanvasToDisplaySize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    syncOverlay();
  }, [syncOverlay]);

  const setCursor = (token: string) => {
    if (canvasRef.current) canvasRef.current.style.cursor = token;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !activeRegion) return;
    // Fresh read here (not the cached rect): a scroll can shift the canvas's viewport offset
    // without triggering the ResizeObserver, and getting the click's hit-test wrong is worse
    // than one extra layout read at the start of a gesture.
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const activeCssRect = naturalToCss(activeRegion);
    const handle = hitTestHandle(point, activeCssRect, handlesForAspect(activeRegion.aspect));
    const kind: DragState["kind"] | null = handle ?? (pointInRect(point, activeCssRect) ? "move" : null);
    if (!kind) return;
    event.stopPropagation();
    canvas.setPointerCapture(event.pointerId);
    dragRef.current = { kind, startClient: { x: event.clientX, y: event.clientY }, startRectCss: activeCssRect };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) {
      if (!activeRegion) return;
      const canvasRect = cssRectRef.current;
      const point = { x: event.clientX - canvasRect.x, y: event.clientY - canvasRect.y };
      const activeCssRect = naturalToCss(activeRegion);
      const handle = hitTestHandle(point, activeCssRect, handlesForAspect(activeRegion.aspect));
      setCursor(handle ? `${handle}-resize` : pointInRect(point, activeCssRect) ? "move" : "default");
      return;
    }
    if (!activeRegion) return;
    const dx = event.clientX - drag.startClient.x;
    const dy = event.clientY - drag.startClient.y;
    const bounds = { width: cssRectRef.current.width, height: cssRectRef.current.height };
    const nextCssRect =
      drag.kind === "move"
        ? moveRect(drag.startRectCss, dx, dy, bounds)
        : resizeRect({ start: drag.startRectCss, handle: drag.kind, dx, dy, aspect: activeRegion.aspect, bounds });
    const naturalRect = cssToNatural(nextCssRect);
    liveActiveRectRef.current = naturalRect;
    redraw();
    positionReadout(nextCssRect, naturalRect);
    setCursor(drag.kind === "move" ? "move" : `${drag.kind}-resize`);
  };

  const endDrag = useCallback(() => {
    dragRef.current = null;
    liveActiveRectRef.current = null;
  }, []);

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag || !activeRegionId || !activeRegion) return;
    const dx = event.clientX - drag.startClient.x;
    const dy = event.clientY - drag.startClient.y;
    const bounds = { width: cssRectRef.current.width, height: cssRectRef.current.height };
    const finalCssRect =
      drag.kind === "move"
        ? moveRect(drag.startRectCss, dx, dy, bounds)
        : resizeRect({ start: drag.startRectCss, handle: drag.kind, dx, dy, aspect: activeRegion.aspect, bounds });
    endDrag();
    onChange(activeRegionId, roundRect(cssToNatural(finalCssRect)));
  };

  const handlePointerCancel = () => {
    endDrag();
    redraw();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="lumeo:absolute lumeo:inset-0 lumeo:h-full lumeo:w-full lumeo:touch-none"
      />
      {activeRegion && (
        <div
          ref={readoutRef}
          className="lumeo:pointer-events-none lumeo:absolute lumeo:whitespace-nowrap lumeo:rounded-sm lumeo:bg-zinc-900 lumeo:px-1.5 lumeo:py-0.5 lumeo:text-[10px] lumeo:font-medium lumeo:tabular-nums lumeo:text-white lumeo:shadow"
        />
      )}
    </>
  );
}
