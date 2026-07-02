import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ImageModal } from "../components/ImageModal/ImageModal";
import { ImageGallery } from "../components/Gallery/ImageGallery";
import { LumeoProvider } from "../context/LumeoProvider";
import { useLumeoImages } from "../hooks/useLumeoImages";
import { DEFAULT_IMAGE_TYPES } from "../lib/imageTypes";
import { handlers, slowHandlers } from "../mocks/handlers";
import type { LumeoImage, LumeoViewMode } from "../types";

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

const saveFlowConfig = { ...config, waitForSuccess: true };

/** Wires ImageModal to a real (mocked) list so saving a crop/size is visible immediately after. */
function SaveFlowHarness() {
  const { images, loading, refetch } = useLumeoImages(saveFlowConfig);
  const [viewMode, setViewMode] = useState<LumeoViewMode>("detail");
  const [selected, setSelected] = useState<LumeoImage | null>(null);

  return (
    <div style={{ padding: 24 }}>
      <ImageGallery
        images={images}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        imageTypes={DEFAULT_IMAGE_TYPES}
        onSelectImage={setSelected}
        onRefresh={refetch}
      />
      {selected && (
        <ImageModal image={selected} onClose={() => setSelected(null)} onRefetch={refetch} />
      )}
    </div>
  );
}

export const SaveUpdatesTheList: Story = {
  name: "Kırpma/boyut seçip kaydedince listeye yansır",
  render: () => (
    <LumeoProvider config={saveFlowConfig}>
      <SaveFlowHarness />
    </LumeoProvider>
  ),
  parameters: {
    msw: { handlers: slowHandlers },
    docs: {
      description: {
        story:
          "Listeden bir görsel açın, 'Boyutlandır & Kırp' ile bir alan kırpın veya hazır bir boyut seçin, ardından Kaydet'e basın. Mock sunucu (src/mocks/handlers.ts) seçilen ölçüleri gerçekten uygulayıp listedeki görselin boyutunu/görselini günceller — waitForSuccess: true olduğu için kayıt tamamlanana kadar üstte yükleme çubuğu görünür.",
      },
    },
  },
};
