import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ImageGallery } from "../components/Gallery/ImageGallery";
import { DEFAULT_IMAGE_TYPES } from "../lib/imageTypes";
import type { LumeoImage, LumeoViewMode } from "../types";

const dummyImages: LumeoImage[] = [
  {
    id: "1",
    fileName: "manset-1.jpg",
    url: "https://picsum.photos/seed/g1/600/400",
    uploadedAt: new Date().toISOString(),
    type: "manset",
    width: 600,
    height: 400,
  },
  {
    id: "2",
    fileName: "kapak-1.jpg",
    url: "https://picsum.photos/seed/g2/600/400",
    uploadedAt: new Date().toISOString(),
    type: "kapak",
    width: 600,
    height: 400,
  },
  {
    id: "3",
    fileName: "banner-1.jpg",
    url: "https://picsum.photos/seed/g3/600/400",
    uploadedAt: new Date().toISOString(),
    type: "banner",
    width: 600,
    height: 400,
  },
  {
    id: "4",
    fileName: "etiketsiz.jpg",
    url: "https://picsum.photos/seed/g4/600/400",
    uploadedAt: new Date().toISOString(),
    width: 600,
    height: 400,
  },
];

const meta: Meta<typeof ImageGallery> = {
  title: "Lumeo/ImageGallery",
  component: ImageGallery,
};
export default meta;
type Story = StoryObj<typeof ImageGallery>;

function GalleryHarness({ initialMode }: { initialMode: LumeoViewMode }) {
  const [viewMode, setViewMode] = useState<LumeoViewMode>(initialMode);
  return (
    <ImageGallery
      images={dummyImages}
      loading={false}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      imageTypes={DEFAULT_IMAGE_TYPES}
      onSelectImage={(image) => alert(`Seçildi: ${image.fileName}`)}
    />
  );
}

export const Grid: Story = { render: () => <GalleryHarness initialMode="grid" /> };
export const Detail: Story = { render: () => <GalleryHarness initialMode="detail" /> };

export const Empty: Story = {
  render: () => (
    <ImageGallery
      images={[]}
      loading={false}
      viewMode="grid"
      onViewModeChange={() => {}}
      imageTypes={DEFAULT_IMAGE_TYPES}
      onSelectImage={() => {}}
    />
  ),
};
