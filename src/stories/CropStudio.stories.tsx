import type { Meta, StoryObj } from "@storybook/react";
import { CropStudio } from "../components/ImageModal/CropStudio/CropStudio";
import { useCropRegions } from "../hooks/useCropRegions";
import { getMessages } from "../lib/i18n";
import type { LumeoImage } from "../types";

const image: LumeoImage = {
  id: "1",
  fileName: "kadraj-ornegi.jpg",
  url: "https://picsum.photos/seed/crop-1/1200/800",
  uploadedAt: new Date().toISOString(),
};

function CropStudioHarness({ defaultAspect }: { defaultAspect?: number }) {
  const regionsApi = useCropRegions();
  return (
    <CropStudio
      image={image}
      defaultAspect={defaultAspect}
      regionsApi={regionsApi}
      messages={getMessages()}
    />
  );
}

const meta: Meta<typeof CropStudioHarness> = {
  title: "Lumeo/CropStudio",
  component: CropStudioHarness,
};
export default meta;
type Story = StoryObj<typeof CropStudioHarness>;

export const FreeForm: Story = {
  name: "Serbest oranla başla",
  render: () => <CropStudioHarness />,
};

export const SixteenByNineDefault: Story = {
  name: "16:9 varsayılan oranla başla (manşet tipi)",
  render: () => <CropStudioHarness defaultAspect={16 / 9} />,
};
