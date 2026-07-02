import { http, HttpResponse, delay } from "msw";
import type { LumeoImage, SaveImagePayload } from "../types";

const initialImages: LumeoImage[] = [
  {
    id: "img-1",
    fileName: "manset-gorseli.jpg",
    url: "https://picsum.photos/seed/lumeo-1/800/500",
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    type: "manset",
    fileSize: 245000,
    mimeType: "image/jpeg",
    width: 800,
    height: 500,
  },
  {
    id: "img-2",
    fileName: "kapak-foto.jpg",
    url: "https://picsum.photos/seed/lumeo-2/800/500",
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "kapak",
    fileSize: 198000,
    mimeType: "image/jpeg",
    width: 800,
    height: 500,
  },
  {
    id: "img-3",
    fileName: "banner-reklam.png",
    url: "https://picsum.photos/seed/lumeo-3/1200/400",
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    type: "banner",
    fileSize: 512000,
    mimeType: "image/png",
    width: 1200,
    height: 400,
  },
  {
    id: "img-4",
    fileName: "etiketsiz-gorsel.jpg",
    url: "https://picsum.photos/seed/lumeo-4/800/600",
    uploadedAt: new Date().toISOString(),
    fileSize: 156000,
    mimeType: "image/jpeg",
    width: 800,
    height: 600,
  },
];

let mockImages: LumeoImage[] = [...initialImages];

function buildHandlers(writeDelayMs: number) {
  return [
    http.get("/api/mock/list", () => {
      return HttpResponse.json({ images: mockImages });
    }),

    http.post("/api/mock/upload", async ({ request }) => {
      if (writeDelayMs > 0) await delay(writeDelayMs);
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];
      const newImages: LumeoImage[] = files.map((file, index) => ({
        id: `img-${Date.now()}-${index}`,
        fileName: file.name,
        url: `https://picsum.photos/seed/${encodeURIComponent(file.name)}-${index}/800/500`,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
        width: 800,
        height: 500,
      }));
      mockImages = [...newImages, ...mockImages];
      return HttpResponse.json({ success: true, images: newImages });
    }),

    // Demo-only: a picked size preset or crop region produces a brand new derived
    // mock image (one per size/crop) instead of overwriting the source — matching
    // how a real backend would emit new resized/cropped output files. A plain
    // type-only save (no size/crop) still updates the source image in place.
    http.post("/api/mock/save", async ({ request }) => {
      if (writeDelayMs > 0) await delay(writeDelayMs);
      const body = (await request.json()) as SaveImagePayload;
      const source = mockImages.find((image) => image.id === body.id);

      const derived: LumeoImage[] = [];
      if (source) {
        body.crops?.forEach((crop, index) => {
          const width = Math.round(crop.width);
          const height = Math.round(crop.height);
          derived.push({
            ...source,
            id: `img-${Date.now()}-crop-${index}`,
            fileName: `${source.fileName} (${crop.name})`,
            url: `https://picsum.photos/seed/${source.id}-crop-${index}/${width}/${height}`,
            uploadedAt: new Date().toISOString(),
            width,
            height,
            type: undefined,
          });
        });
        body.sizes?.forEach((selected, selectedIndex) => {
          selected.sizes.forEach((box, boxIndex) => {
            const width = Math.round(box.width);
            const height = Math.round(box.height);
            derived.push({
              ...source,
              id: `img-${Date.now()}-size-${selectedIndex}-${boxIndex}`,
              fileName: `${source.fileName} (${box.label})`,
              url: `https://picsum.photos/seed/${source.id}-size-${selectedIndex}-${boxIndex}/${width}/${height}`,
              uploadedAt: new Date().toISOString(),
              width,
              height,
              type: undefined,
            });
          });
        });
      }

      mockImages =
        derived.length > 0
          ? [...derived, ...mockImages]
          : mockImages.map((image) => (image.id === body.id ? { ...image, type: body.type } : image));

      return HttpResponse.json({ success: true });
    }),

    http.delete("/api/mock/delete", async ({ request }) => {
      if (writeDelayMs > 0) await delay(writeDelayMs);
      const body = (await request.json()) as { id: string };
      mockImages = mockImages.filter((image) => image.id !== body.id);
      return HttpResponse.json({ success: true });
    }),
  ];
}

export const handlers = buildHandlers(0);
export const slowHandlers = buildHandlers(1500);
