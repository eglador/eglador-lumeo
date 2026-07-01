import type { Meta, StoryObj } from "@storybook/react";
import { ImageModal } from "../components/ImageModal/ImageModal";
import { LumeoProvider } from "../context/LumeoProvider";
import { handlers } from "../mocks/handlers";
import type { LumeoImage } from "../types";

const image: LumeoImage = {
  id: "1",
  fileName: "manset-gorseli.jpg",
  url: "https://picsum.photos/seed/modal-1/2560/1760",
  uploadedAt: new Date().toISOString(),
  type: "manset",
  mimeType: "image/jpeg",
};

const config = {
  endpoints: {
    upload: "/api/mock/upload",
    list: "/api/mock/list",
    save: "/api/mock/save",
    delete: "/api/mock/delete",
  },
};

const meta: Meta<typeof ImageModal> = {
  title: "Lumeo/ImageModal",
  component: ImageModal,
  parameters: { msw: { handlers }, layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof ImageModal>;

export const TypeSelectionAndCrop: Story = {
  name: "Tip seçimi + çoklu kırpma bölgesi",
  render: () => (
    <LumeoProvider config={config}>
      <ImageModal image={image} onClose={() => {}} onRefetch={() => {}} />
    </LumeoProvider>
  ),
};

export const UntaggedImage: Story = {
  name: "Tipsiz görsel",
  render: () => (
    <LumeoProvider config={config}>
      <ImageModal image={{ ...image, type: undefined }} onClose={() => {}} onRefetch={() => {}} />
    </LumeoProvider>
  ),
};

export const LargeImageSizeTab: Story = {
  name: "Büyük görsel (2560x1760) — 'Boyutlandır & Kırp' > Boyut Seçenekleri",
  render: () => (
    <LumeoProvider config={config}>
      <ImageModal image={image} onClose={() => {}} onRefetch={() => {}} />
    </LumeoProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Yüksek çözünürlüklü bir görsel için 'Boyutlandır & Kırp' butonuna basıp 'Boyut Seçenekleri' sekmesinde elle alan seçmeden hazır boyutlardan (1024x768, 1920x1080, 400x400 vb.) seçim yapabilirsiniz. Piksel bazında özel bir alan gerekiyorsa 'Özel Kırpma' sekmesine geçin.",
      },
    },
  },
};
