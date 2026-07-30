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

/**
 * Scales a rect with independent X/Y factors. Unlike `scaleRect`, this doesn't assume the two
 * axes share a single ratio — needed when converting between an image's natural pixel space and
 * its displayed box, where `naturalWidth/naturalHeight` and the rendered `clientWidth/clientHeight`
 * can each round independently and drift apart by a sub-pixel amount.
 */
export function scaleRectAxes(rect: Rect, scaleX: number, scaleY: number): Rect {
  return {
    x: rect.x * scaleX,
    y: rect.y * scaleY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
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
 * Builds the largest centered rect of a given aspect ratio that fits entirely within bounds
 * (i.e. "object-contain" sizing). Used to seed a usage type's crop region at its biggest
 * possible size, rather than the smaller default `centeredRectForAspect` uses.
 */
export function maxRectForAspect(bounds: Bounds, aspect: number): Rect {
  let width = bounds.width;
  let height = width / aspect;
  if (height > bounds.height) {
    height = bounds.height;
    width = height * aspect;
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
    // Clamping width/height independently (as the final clampRect below does) would distort the
    // locked ratio the moment either dimension alone exceeds bounds — shrink both together first.
    if (width > bounds.width) {
      width = bounds.width;
      height = width / aspect;
    }
    if (height > bounds.height) {
      height = bounds.height;
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

/**
 * Rounds an aspect ratio to 4 decimal places — plenty of precision for the resize/lock math
 * (a 4/3 image is off by well under a pixel even at 8K), but keeps `CropRegion.aspect` out of
 * save payloads as an unreadable `1.3333333333333333`.
 */
export function roundAspect(aspect: number): number;
export function roundAspect(aspect: number | undefined): number | undefined;
export function roundAspect(aspect: number | undefined): number | undefined {
  if (aspect === undefined) return undefined;
  return Math.round(aspect * 10000) / 10000;
}

/** The exact point (in the same coordinate space as `rect`) where a given handle sits. */
export function handlePoint(rect: Rect, handle: HandleId): { x: number; y: number } {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const midX = rect.x + rect.width / 2;
  const midY = rect.y + rect.height / 2;
  switch (handle) {
    case "nw":
      return { x: left, y: top };
    case "n":
      return { x: midX, y: top };
    case "ne":
      return { x: right, y: top };
    case "e":
      return { x: right, y: midY };
    case "se":
      return { x: right, y: bottom };
    case "s":
      return { x: midX, y: bottom };
    case "sw":
      return { x: left, y: bottom };
    case "w":
      return { x: left, y: midY };
  }
}

/** Whether a point falls within a rect (inclusive of its edges). */
export function pointInRect(point: { x: number; y: number }, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

const DEFAULT_CORNER_HIT_SIZE = 28;
const DEFAULT_EDGE_HIT_SIZE = 28;

/**
 * Finds which handle (if any) a point is within hit-test range of. Corners are checked before
 * edges so overlapping hit boxes on a small rect favor the corner. The hit-test box is
 * deliberately larger than the drawn handle size — unlike a real DOM element, a canvas gets no
 * touch-target inflation for free, so this has to be generous on purpose.
 */
export function hitTestHandle(
  point: { x: number; y: number },
  rect: Rect,
  handles: HandleId[],
  options?: { cornerHitSize?: number; edgeHitSize?: number }
): HandleId | null {
  const cornerHitSize = options?.cornerHitSize ?? DEFAULT_CORNER_HIT_SIZE;
  const edgeHitSize = options?.edgeHitSize ?? DEFAULT_EDGE_HIT_SIZE;
  const ordered = [
    ...CORNER_HANDLES.filter((handle) => handles.includes(handle)),
    ...EDGE_HANDLES.filter((handle) => handles.includes(handle)),
  ];
  for (const handle of ordered) {
    const center = handlePoint(rect, handle);
    const half = (CORNER_HANDLES.includes(handle) ? cornerHitSize : edgeHitSize) / 2;
    if (Math.abs(point.x - center.x) <= half && Math.abs(point.y - center.y) <= half) {
      return handle;
    }
  }
  return null;
}
