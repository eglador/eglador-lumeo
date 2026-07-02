export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  width: number;
  height: number;
}

export type HandleId = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export const CORNER_HANDLES: HandleId[] = ["nw", "ne", "sw", "se"];
export const EDGE_HANDLES: HandleId[] = ["n", "s", "e", "w"];

const MIN_SIZE = 20;

/** Scales every field of a rect by a factor. Used to convert between natural <-> displayed pixel space. */
export function scaleRect(rect: Rect, scale: number): Rect {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/** Clamps a rect so it stays fully within [0, bounds]. */
export function clampRect(rect: Rect, bounds: Bounds): Rect {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  const x = Math.min(Math.max(rect.x, 0), Math.max(bounds.width - width, 0));
  const y = Math.min(Math.max(rect.y, 0), Math.max(bounds.height - height, 0));
  return { x, y, width, height };
}

/** Builds a centered rect for a given aspect ratio (or a sensible default square) within bounds. */
export function centeredRectForAspect(bounds: Bounds, aspect?: number): Rect {
  const targetAspect = aspect ?? 1;
  let width = bounds.width * 0.6;
  let height = width / targetAspect;
  if (height > bounds.height * 0.6) {
    height = bounds.height * 0.6;
    width = height * targetAspect;
  }
  return {
    x: (bounds.width - width) / 2,
    y: (bounds.height - height) / 2,
    width,
    height,
  };
}

/**
 * Builds a centered rect matching an exact pixel size, scaled down (preserving
 * aspect) if it doesn't fit within bounds. Used for custom width/height input
 * so the crop box actually reflects the size the user typed.
 */
export function centeredRectForSize(bounds: Bounds, width: number, height: number): Rect {
  let w = width;
  let h = height;
  const scale = Math.min(bounds.width / w, bounds.height / h, 1);
  w *= scale;
  h *= scale;
  return {
    x: (bounds.width - w) / 2,
    y: (bounds.height - h) / 2,
    width: w,
    height: h,
  };
}

/**
 * Computes the next rect while dragging a handle by (dx, dy) display pixels.
 * Corner handles anchor the opposite corner and, when an aspect ratio is
 * locked, derive the secondary dimension from whichever axis moved more.
 * Edge handles resize a single dimension and are only meant to be used
 * when no aspect ratio is locked (enforced by the UI layer).
 */
export function resizeRect(params: {
  start: Rect;
  handle: HandleId;
  dx: number;
  dy: number;
  aspect?: number;
  bounds: Bounds;
}): Rect {
  const { start, handle, dx, dy, aspect, bounds } = params;
  const left = start.x;
  const top = start.y;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  let newLeft = handle.includes("w") ? left + dx : left;
  let newRight = handle.includes("e") ? right + dx : right;
  let newTop = handle.includes("n") ? top + dy : top;
  let newBottom = handle.includes("s") ? bottom + dy : bottom;

  newLeft = Math.min(newLeft, newRight - MIN_SIZE);
  newTop = Math.min(newTop, newBottom - MIN_SIZE);

  let width = newRight - newLeft;
  let height = newBottom - newTop;

  if (aspect && CORNER_HANDLES.includes(handle)) {
    const widthDriven = Math.abs(dx) >= Math.abs(dy * aspect);
    if (widthDriven) {
      height = width / aspect;
    } else {
      width = height * aspect;
    }
    if (handle.includes("w")) newLeft = newRight - width;
    else newRight = newLeft + width;
    if (handle.includes("n")) newTop = newBottom - height;
    else newBottom = newTop + height;
  }

  return clampRect({ x: newLeft, y: newTop, width, height }, bounds);
}

/** Moves a rect by (dx, dy) display pixels while keeping it within bounds. */
export function moveRect(start: Rect, dx: number, dy: number, bounds: Bounds): Rect {
  return clampRect({ x: start.x + dx, y: start.y + dy, width: start.width, height: start.height }, bounds);
}

export function roundRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}
