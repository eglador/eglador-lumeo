import type { Meta, StoryObj } from "@storybook/react";
import { LumeoMiniViewer } from "../components/MiniViewer/LumeoMiniViewer";
import { LumeoProvider } from "../context/LumeoProvider";
import { handlers } from "../mocks/handlers";

const config = {
  endpoints: {
    upload: "/api/mock/upload",
    list: "/api/mock/list",
    save: "/api/mock/save",
    delete: "/api/mock/delete",
  },
};

const meta: Meta<typeof LumeoMiniViewer> = {
  title: "Lumeo/LumeoMiniViewer",
  component: LumeoMiniViewer,
  parameters: { msw: { handlers }, layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof LumeoMiniViewer>;

export const BottomRightCorner: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ height: "70vh", position: "relative" }}>
        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
          Bu, Next.js sayfanızın herhangi bir köşesine yerleştirebileceğiniz bağımsız mini görüntüleyicidir.
        </p>
        <LumeoMiniViewer
          corner="bottom-right"
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        />
      </div>
    </LumeoProvider>
  ),
};
