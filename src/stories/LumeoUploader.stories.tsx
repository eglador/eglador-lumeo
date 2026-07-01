import type { Meta, StoryObj } from "@storybook/react";
import { LumeoUploader } from "../components/LumeoUploader/LumeoUploader";
import { LumeoProvider } from "../context/LumeoProvider";
import { handlers, slowHandlers } from "../mocks/handlers";
import type { LumeoConfig } from "../types";

const baseConfig: LumeoConfig = {
  endpoints: {
    upload: "/api/mock/upload",
    list: "/api/mock/list",
    save: "/api/mock/save",
    delete: "/api/mock/delete",
  },
  maxFileSizeMB: 10,
  accept: ["image/*"],
  clientId:"client-storybook"
};

const meta: Meta<typeof LumeoUploader> = {
  title: "Lumeo/LumeoUploader",
  component: LumeoUploader,
  parameters: { msw: { handlers } },
};

export default meta;
type Story = StoryObj<typeof LumeoUploader>;

export const WaitForSuccessDisabled: Story = {
  name: "waitForSuccess: false (refresh anında)",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, waitForSuccess: false }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
  parameters: { msw: { handlers: slowHandlers } },
};

export const WaitForSuccessEnabled: Story = {
  name: "waitForSuccess: true (success sonrası refresh)",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, waitForSuccess: true }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
  parameters: { msw: { handlers: slowHandlers } },
};

export const SinglePngOnly: Story = {
  name: "Sadece 1 adet PNG kabul et",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, accept: ["image/png"], maxFiles: 1 }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
};

export const Max10MB: Story = {
  name: "10MB üzeri dosyaları reddet",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, maxFileSizeMB: 10 }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
};

export const TurkishLocale: Story = {
  name: "locale: tr (default is en)",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, locale: "tr" }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
};
