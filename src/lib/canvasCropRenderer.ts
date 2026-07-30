import { CORNER_HANDLES, scaleRectAxes, handlePoint } from "./geometry";
import type { Rect, Bounds, HandleId } from "./geometry";
import type { CropRegion } from "../types";

export interface DrawCropOverlayParams {
  /** Size of the canvas in CSS pixels (before any devicePixelRatio scaling). */
  cssSize: Bounds;
  /** naturalWidth/naturalHeight of the underlying image. */
  naturalSize: Bounds;
  regions: CropRegion[];
  activeRegionId: string | null;
  /** Natural-pixel rect overriding the active region's stored position — used while dragging. */
  liveActiveRect?: Rect;
}

const CORNER_BRACKET_ARM = 12;
const CORNER_BRACKET_THICKNESS = 3;
const BORDER_WIDTH = 2;
const DASH_PATTERN = [5, 4];
const MASK_COLOR = "rgba(0, 0, 0, 0.5)";
const INACTIVE_OPACITY = 0.6;

/** Which direction (into the rect) each corner's two bracket arms extend. */
const CORNER_ARM_DIRECTION: Partial<Record<HandleId, { dx: number; dy: number }>> = {
  nw: { dx: 1, dy: 1 },
  ne: { dx: -1, dy: 1 },
  se: { dx: -1, dy: -1 },
  sw: { dx: 1, dy: -1 },
};

function strokeInset(ctx: CanvasRenderingContext2D, rect: Rect) {
  // strokeRect centers the stroke on the path; inset by half the line width so the stroke's
  // *outer* edge lands exactly on `rect` — matching CSS border-box, where a maximal crop's
  // border-box edge must sit flush with the image edge.
  const half = ctx.lineWidth / 2;
  ctx.strokeRect(rect.x + half, rect.y + half, rect.width - ctx.lineWidth, rect.height - ctx.lineWidth);
}

function drawDimMask(ctx: CanvasRenderingContext2D, cssSize: Bounds, rect: Rect) {
  ctx.fillStyle = MASK_COLOR;
  ctx.fillRect(0, 0, cssSize.width, rect.y);
  ctx.fillRect(0, rect.y + rect.height, cssSize.width, cssSize.height - (rect.y + rect.height));
  ctx.fillRect(0, rect.y, rect.x, rect.height);
  ctx.fillRect(rect.x + rect.width, rect.y, cssSize.width - (rect.x + rect.width), rect.height);
}

function drawInactiveBorder(ctx: CanvasRenderingContext2D, rect: Rect, color: string) {
  ctx.save();
  ctx.globalAlpha = INACTIVE_OPACITY;
  ctx.strokeStyle = color;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.setLineDash(DASH_PATTERN);
  strokeInset(ctx, rect);
  ctx.restore();
}

function drawActiveBorder(ctx: CanvasRenderingContext2D, rect: Rect, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.setLineDash([]);
  strokeInset(ctx, rect);
  ctx.restore();
}

function drawCornerBrackets(ctx: CanvasRenderingContext2D, rect: Rect, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = CORNER_BRACKET_THICKNESS;
  ctx.setLineDash([]);
  for (const handle of CORNER_HANDLES) {
    const direction = CORNER_ARM_DIRECTION[handle];
    if (!direction) continue;
    const point = handlePoint(rect, handle);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + direction.dx * CORNER_BRACKET_ARM, point.y);
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y + direction.dy * CORNER_BRACKET_ARM);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws one full frame of the crop overlay: every inactive region's dashed outline, the dim
 * mask around the active region, and the active region's solid border + corner brackets — in
 * that order, so the mask darkens whatever inactive outlines fall outside the active area,
 * matching the layering the previous DOM-based overlay had.
 */
export function drawCropOverlay(ctx: CanvasRenderingContext2D, params: DrawCropOverlayParams): void {
  const { cssSize, naturalSize, regions, activeRegionId, liveActiveRect } = params;
  ctx.clearRect(0, 0, cssSize.width, cssSize.height);
  if (naturalSize.width <= 0 || naturalSize.height <= 0 || cssSize.width <= 0 || cssSize.height <= 0) return;

  const scaleX = cssSize.width / naturalSize.width;
  const scaleY = cssSize.height / naturalSize.height;
  const active = regions.find((region) => region.id === activeRegionId);

  for (const region of regions) {
    if (region.id === activeRegionId) continue;
    drawInactiveBorder(ctx, scaleRectAxes(region, scaleX, scaleY), region.color);
  }

  if (active) {
    const activeCssRect = scaleRectAxes(liveActiveRect ?? active, scaleX, scaleY);
    drawDimMask(ctx, cssSize, activeCssRect);
    drawActiveBorder(ctx, activeCssRect, active.color);
    drawCornerBrackets(ctx, activeCssRect, active.color);
  }
}
