import React, { useCallback, useRef } from "react";
import {
  moveRect,
  resizeRect,
  scaleRect,
  roundRect,
  CORNER_HANDLES,
  EDGE_HANDLES,
} from "../../../lib/geometry";
import type { Rect, HandleId, Bounds } from "../../../lib/geometry";
import type { CropRegion } from "../../../types";

export interface CropOverlayProps {
  region: CropRegion;
  aspect?: number;
  isActive: boolean;
  color: string;
  /** Size of the rendered <img> in css pixels. */
  displayBounds: Bounds;
  /** naturalWidth/naturalHeight of the underlying image. */
  naturalSize: Bounds;
  onActivate: () => void;
  /** Called once, on pointerup, with the committed rect in natural pixel space. */
  onChange: (rect: Rect) => void;
}

const HANDLE_POSITION: Record<HandleId, { top: string; left: string }> = {
  nw: { top: "0%", left: "0%" },
  n: { top: "0%", left: "50%" },
  ne: { top: "0%", left: "100%" },
  e: { top: "50%", left: "100%" },
  se: { top: "100%", left: "100%" },
  s: { top: "100%", left: "50%" },
  sw: { top: "100%", left: "0%" },
  w: { top: "50%", left: "0%" },
};

/** Which two sides get a thick border to draw an L-shaped corner bracket. */
const CORNER_BORDER_CLASSES: Partial<Record<HandleId, string>> = {
  nw: "lumeo:border-t-[3px] lumeo:border-l-[3px]",
  ne: "lumeo:border-t-[3px] lumeo:border-r-[3px]",
  se: "lumeo:border-b-[3px] lumeo:border-r-[3px]",
  sw: "lumeo:border-b-[3px] lumeo:border-l-[3px]",
};

export function CropOverlay({
  region,
  aspect,
  isActive,
  color,
  displayBounds,
  naturalSize,
  onActivate,
  onChange,
}: CropOverlayProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const topMaskRef = useRef<HTMLDivElement>(null);
  const bottomMaskRef = useRef<HTMLDivElement>(null);
  const leftMaskRef = useRef<HTMLDivElement>(null);
  const rightMaskRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: "move" | HandleId;
    startPointer: { x: number; y: number };
    startDisplayRect: Rect;
  } | null>(null);

  const naturalToDisplayScale = displayBounds.width / (naturalSize.width || 1);
  const displayToNaturalScale = naturalSize.width / (displayBounds.width || 1);
  const displayRect = scaleRect(region, naturalToDisplayScale);

  const formatReadout = (rect: Rect) =>
    `${Math.round(rect.x)}, ${Math.round(rect.y)} · ${Math.round(rect.width)}×${Math.round(rect.height)}`;

  const applyDisplayRect = (rect: Rect) => {
    const box = boxRef.current;
    if (box) {
      box.style.left = `${rect.x}px`;
      box.style.top = `${rect.y}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    }
    // Keep the dim mask in sync live during drag, not just after commit —
    // otherwise the darkened area appears frozen until pointerup.
    if (topMaskRef.current) topMaskRef.current.style.height = `${rect.y}px`;
    if (bottomMaskRef.current) bottomMaskRef.current.style.top = `${rect.y + rect.height}px`;
    if (leftMaskRef.current) {
      leftMaskRef.current.style.top = `${rect.y}px`;
      leftMaskRef.current.style.width = `${rect.x}px`;
      leftMaskRef.current.style.height = `${rect.height}px`;
    }
    if (rightMaskRef.current) {
      rightMaskRef.current.style.left = `${rect.x + rect.width}px`;
      rightMaskRef.current.style.top = `${rect.y}px`;
      rightMaskRef.current.style.height = `${rect.height}px`;
    }
    // Live natural-pixel readout, kept in sync during drag the same way as the mask.
    if (readoutRef.current) {
      readoutRef.current.textContent = formatReadout(scaleRect(rect, displayToNaturalScale));
    }
  };

  const computeNext = (kind: "move" | HandleId, dx: number, dy: number, start: Rect): Rect => {
    return kind === "move"
      ? moveRect(start, dx, dy, displayBounds)
      : resizeRect({ start, handle: kind, dx, dy, aspect, bounds: displayBounds });
  };

  const startDrag = useCallback(
    (kind: "move" | HandleId) => (event: React.PointerEvent) => {
      event.stopPropagation();
      onActivate();
      (event.target as Element).setPointerCapture(event.pointerId);
      dragRef.current = {
        kind,
        startPointer: { x: event.clientX, y: event.clientY },
        startDisplayRect: scaleRect(region, naturalToDisplayScale),
      };
    },
    [region, naturalToDisplayScale, onActivate]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startPointer.x;
      const dy = event.clientY - drag.startPointer.y;
      applyDisplayRect(computeNext(drag.kind, dx, dy, drag.startDisplayRect));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayBounds, aspect]
  );

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.startPointer.x;
      const dy = event.clientY - drag.startPointer.y;
      const finalDisplayRect = computeNext(drag.kind, dx, dy, drag.startDisplayRect);
      dragRef.current = null;
      onChange(roundRect(scaleRect(finalDisplayRect, displayToNaturalScale)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayBounds, displayToNaturalScale, aspect, onChange]
  );

  const handles = aspect ? CORNER_HANDLES : [...CORNER_HANDLES, ...EDGE_HANDLES];

  if (!isActive) {
    return (
      <div
        onPointerDown={onActivate}
        className="lumeo:absolute lumeo:box-border lumeo:cursor-pointer lumeo:border-2 lumeo:border-dashed lumeo:opacity-60"
        style={{
          left: displayRect.x,
          top: displayRect.y,
          width: displayRect.width,
          height: displayRect.height,
          borderColor: color,
        }}
      />
    );
  }

  return (
    <>
      {/* dim mask outside the active crop rect — refs kept in sync live during drag */}
      <div
        ref={topMaskRef}
        className="lumeo:pointer-events-none lumeo:absolute lumeo:bg-black/50"
        style={{ left: 0, top: 0, right: 0, height: displayRect.y }}
      />
      <div
        ref={bottomMaskRef}
        className="lumeo:pointer-events-none lumeo:absolute lumeo:bg-black/50"
        style={{ left: 0, top: displayRect.y + displayRect.height, right: 0, bottom: 0 }}
      />
      <div
        ref={leftMaskRef}
        className="lumeo:pointer-events-none lumeo:absolute lumeo:bg-black/50"
        style={{ left: 0, top: displayRect.y, width: displayRect.x, height: displayRect.height }}
      />
      <div
        ref={rightMaskRef}
        className="lumeo:pointer-events-none lumeo:absolute lumeo:bg-black/50"
        style={{
          left: displayRect.x + displayRect.width,
          top: displayRect.y,
          right: 0,
          height: displayRect.height,
        }}
      />

      <div
        ref={boxRef}
        onPointerDown={startDrag("move")}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        className="lumeo:absolute lumeo:box-border lumeo:cursor-move lumeo:border-2"
        style={{
          left: displayRect.x,
          top: displayRect.y,
          width: displayRect.width,
          height: displayRect.height,
          borderColor: color,
        }}
      >
        <div
          ref={readoutRef}
          className="lumeo:pointer-events-none lumeo:absolute lumeo:-top-6 lumeo:left-0 lumeo:whitespace-nowrap lumeo:rounded-sm lumeo:bg-zinc-900 lumeo:px-1.5 lumeo:py-0.5 lumeo:text-[10px] lumeo:font-medium lumeo:tabular-nums lumeo:text-white lumeo:shadow"
        >
          {formatReadout(region)}
        </div>
        {handles.map((handle) => {
          const cornerBorder = CORNER_BORDER_CLASSES[handle];
          return (
            <div
              key={handle}
              onPointerDown={startDrag(handle)}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              className={
                cornerBorder
                  ? `lumeo:absolute lumeo:box-border lumeo:h-5 lumeo:w-5 ${cornerBorder}`
                  : "lumeo:absolute lumeo:box-border lumeo:h-4 lumeo:w-4"
              }
              style={{
                top: HANDLE_POSITION[handle].top,
                left: HANDLE_POSITION[handle].left,
                transform: "translate(-50%, -50%)",
                cursor: `${handle}-resize`,
                borderColor: cornerBorder ? color : undefined,
              }}
            />
          );
        })}
      </div>
    </>
  );
}
