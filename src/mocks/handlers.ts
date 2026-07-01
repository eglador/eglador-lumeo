import { http, HttpResponse, delay } from "msw";
import type { LumeoImage } from "../types";

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

function buildHandlers(uploadDelayMs: number) {
  return [
    http.get("/api/mock/list", () => {
      return HttpResponse.json({ images: mockImages });
    }),

    http.post("/api/mock/upload", async ({ request }) => {
      if (uploadDelayMs > 0) await delay(uploadDelayMs);
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

    http.post("/api/mock/save", async ({ request }) => {
      const body = (await request.json()) as { id: string; type?: string };
      mockImages = mockImages.map((image) =>
        image.id === body.id ? { ...image, type: body.type } : image
      );
      return HttpResponse.json({ success: true });
    }),

    http.delete("/api/mock/delete", async ({ request }) => {
      const body = (await request.json()) as { id: string };
      mockImages = mockImages.filter((image) => image.id !== body.id);
      return HttpResponse.json({ success: true });
    }),
  ];
}

export const handlers = buildHandlers(0);
export const slowHandlers = buildHandlers(1500);
