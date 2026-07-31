import type { Meta, StoryObj } from "@storybook/react-vite";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LumeoUploader } from "../components/LumeoUploader/LumeoUploader";
import { LumeoMiniViewer } from "../components/MiniViewer/LumeoMiniViewer";
import { LumeoProvider } from "../context/LumeoProvider";
import { handlers, slowHandlers } from "../mocks/handlers";
import { ImageNode } from "./lexical/ImageNode";
import { ImageObjectDropPlugin } from "./lexical/ImageObjectDropPlugin";
import { ToolbarPlugin } from "./lexical/ToolbarPlugin";
import { JsonOutputPlugin } from "./lexical/JsonOutputPlugin";
import type { LumeoConfig, LumeoImageTypeOption } from "../types";

const baseConfig: LumeoConfig = {
  endpoints: {
    upload: "/api/mock/upload",
    list: "/api/mock/list",
    save: "/api/mock/save",
    delete: "/api/mock/delete",
  },
  maxFileSizeMB: 10,
  accept: ["image/*"],
  clientId: "client-storybook",
  siteId: 42,
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

// Demonstrates grouping: "Haberler" and "Reklam" are display-only groups (imageTypes[].crops)
// whose children render as one heading + nested buttons; "galeri" stays a plain, ungrouped entry
// to show grouped and flat options can be mixed freely in the same list.
const nestedImageTypesDemo: LumeoImageTypeOption[] = [
  {
    name: "Haberler",
    value: "haberler",
    label: "Haberler",
    crops: [
      { value: "manset", label: "Manşet", aspect: 16 / 9, cropTypeId: 1 },
      { value: "kapak", label: "Kapak", aspect: 4 / 3, cropTypeId: 2 },
    ],
  },
  {
    name: "Reklam",
    value: "reklam",
    label: "Reklam",
    crops: [{ value: "banner", label: "Banner", aspect: 21 / 9, cropTypeId: 3 }],
  },
  { value: "galeri", label: "Galeri Görseli", cropTypeId: 6 },
];

const cropDemoLexicalConfig = {
  namespace: "CropByUsageTypeUploaderDemo",
  onError: (error: Error) => {
    throw error;
  },
  nodes: [ImageNode],
};

function CropByUsageTypeUploaderHarness() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
      <LumeoUploader cropByUsageType />

      <div>
        <p style={{ margin: "0 0 8px", color: "#71717a", fontSize: 13 }}>
          Sağ alttaki (başlangıçta küçültülmüş) mini görüntüleyiciyi açıp bir görseli aşağıdaki
          editöre sürükleyip bırakın — görselin tüm bilgileriyle (id, dosya adı, boyutlar, tip…)
          gerçek bir nesne olarak eklenir; altta editörün canlı JSON çıktısında görebilirsiniz.
        </p>
        <LexicalComposer initialConfig={cropDemoLexicalConfig}>
          <div
            style={{
              maxWidth: 640,
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <ToolbarPlugin />
            <div style={{ position: "relative", minHeight: 176, padding: 12 }}>
              <RichTextPlugin
                contentEditable={<ContentEditable style={{ outline: "none", minHeight: 176 }} />}
                placeholder={
                  <div
                    style={{ position: "absolute", top: 12, left: 12, color: "#a1a1aa", pointerEvents: "none" }}
                  >
                    Bir görseli buraya sürükleyip bırakın…
                  </div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
            <HistoryPlugin />
            <ImageObjectDropPlugin />
            <JsonOutputPlugin />
          </div>
        </LexicalComposer>
      </div>

      <LumeoMiniViewer
        corner="bottom-right"
        defaultCollapsed
        onImageClick={() => {}}
        dragData={{ pattern: "{value}", getValue: (image) => JSON.stringify(image) }}
      />
    </div>
  );
}

export const CropByUsageTypeDemo: Story = {
  name: "Uçtan uca: yükle + waitForSuccess: true + cropByUsageType modal + MiniViewer + Lexical",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, waitForSuccess: true, locale: "tr", imageTypes: nestedImageTypesDemo }}>
      <CropByUsageTypeUploaderHarness />
    </LumeoProvider>
  ),
  parameters: {
    layout: "fullscreen",
    msw: { handlers: slowHandlers },
    docs: {
      description: {
        story:
          "Bir görsel yükleyin (`waitForSuccess: true` olduğu için üstte yükleme çubuğu görünür), listeden açın: modal doğrudan `cropByUsageType` modunda açılır — kullanım tipine tıklamak o oranda bir kırpma alanı oluşturur ve üstüne gelince küçük bir önizleme gösterir, Kaydet'e basınca kırpmalar görselin kendi `crops` alanına kaydedilir (yeni bir liste satırı oluşmaz). Bu örnekte `imageTypes` gruplu verilmiş: \"Haberler\" (Manşet, Kapak) ve \"Reklam\" (Banner) birer başlık altında toplanmış görünür, \"Galeri Görseli\" ise gruplanmamış düz bir seçenek olarak yanlarında kalır — Kaydet'e basınca, kırpılan tip bir grubun içindeyse istek gövdesine `clientId` ile aynı seviyede grubun `value`'sunu taşıyan bir `typeId` alanı da eklenir. Sağ altta başlangıçta küçültülmüş (`defaultCollapsed`) ve sürüklenebilir bir `LumeoMiniViewer` de var; açıp bir görseli alttaki Lexical editörüne sürükleyip bırakırsanız görselin tüm bilgileriyle (id, dosya adı, boyutlar, tip vb. — sadece `url` değil) gerçek bir görsel nesnesi olarak eklenir (`ImageNode` + `ImageObjectDropPlugin`, `src/stories/lexical/`). Editörde kalın/italik/altı çizili/üstü çizili için bir araç çubuğu (`ToolbarPlugin`) ve altında editör durumunun canlı JSON çıktısını gösteren bir panel (`JsonOutputPlugin`) var — bıraktığınız görselin tüm alanlarını orada, düğümün kendi `image` anahtarı altında görebilirsiniz.",
      },
    },
  },
};

export const TurkishLocale: Story = {
  name: "locale: tr (default is en)",
  render: () => (
    <LumeoProvider config={{ ...baseConfig, locale: "tr" }}>
      <LumeoUploader />
    </LumeoProvider>
  ),
};
