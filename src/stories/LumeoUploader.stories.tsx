import type { Meta, StoryObj } from "@storybook/react-vite";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LumeoUploader } from "../components/LumeoUploader/LumeoUploader";
import { LumeoMiniViewer } from "../components/MiniViewer/LumeoMiniViewer";
import { LumeoProvider } from "../context/LumeoProvider";
import { useLumeoImages } from "../hooks/useLumeoImages";
import { useRequiredImageTypes } from "../hooks/useRequiredImageTypes";
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
//
// Also demonstrates `required` at both levels: "Kapak" is required as a specific leaf (some
// image, anywhere in the list, must be cropped exactly as "Kapak"); "Reklam" is required as a
// whole group (some image must be cropped as "Banner" OR "Kare Reklam" — either satisfies it).
const nestedImageTypesDemo: LumeoImageTypeOption[] = [
  {
    name: "Haberler",
    value: "haberler",
    label: "Haberler",
    crops: [
      { value: "manset", label: "Manşet", aspect: 16 / 9, cropTypeId: 1 },
      { value: "kapak", label: "Kapak", aspect: 4 / 3, cropTypeId: 2, required: true },
    ],
  },
  {
    name: "Reklam",
    value: "reklam",
    label: "Reklam",
    required: true,
    crops: [
      { value: "banner", label: "Banner", aspect: 21 / 9, cropTypeId: 3 },
      { value: "reklam-kare", label: "Kare Reklam", aspect: 1, cropTypeId: 4 },
    ],
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

function RequiredDot({ label, satisfied }: { label: string; satisfied: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: satisfied ? "#166534" : "#991b1b" }}>
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", background: satisfied ? "#22c55e" : "#ef4444", flexShrink: 0 }}
      />
      {label}
    </span>
  );
}

/**
 * Shows how a host app gates its own UI (e.g. a save button) on `useRequiredImageTypes`, entirely
 * outside the package's own modal/buttons — it just reads `images` from `useLumeoImages` (already
 * public API) and renders `statuses` (every `required` entry with its own satisfied flag, not
 * just an overall message) as a minimal checklist. A group entry (e.g. "Reklam") is one thin pill
 * with the group's name plus every child (`status.children`) as its own independently colored
 * dot+label. A leaf required individually but still defined inside a group (e.g. "Kapak" inside
 * "Haberler") uses `status.parent` to show that same group-name prefix, e.g. "Haberler: Kapak" —
 * so every entry's origin is visually clear, group or not. This panel's `useLumeoImages` instance
 * shares its cache with `LumeoUploader`'s own internal one (same config → same list key), so it
 * updates automatically the moment a crop is saved inside the modal — no manual refresh.
 */
function RequiredStatusPanel({ config }: { config: LumeoConfig }) {
  const { allImages } = useLumeoImages(config);
  const { statuses } = useRequiredImageTypes(allImages, config);
  return (
    <div style={{ padding: "8px 10px", borderRadius: 6, background: "#fafafa" }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", color: "#a1a1aa" }}>
        Zorunlu Kadrajlar
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {statuses.map((status) => {
          const prefix = status.children
            ? (status.option.name ?? status.option.label)
            : status.parent && (status.parent.name ?? status.parent.label);
          return (
            <span
              key={String(status.option.value)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 9px",
                borderRadius: 999,
                border: `1px solid ${status.satisfied ? "#86efac" : "#e4e4e7"}`,
              }}
            >
              {prefix && <span style={{ fontSize: 12, fontWeight: 600, color: "#71717a" }}>{prefix}:</span>}
              {status.children ? (
                status.children.map((child) => (
                  <RequiredDot key={String(child.option.value)} label={child.option.label} satisfied={child.satisfied} />
                ))
              ) : (
                <RequiredDot label={status.option.label} satisfied={status.satisfied} />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CropByUsageTypeUploaderHarness({ config }: { config: LumeoConfig }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }}>
      <RequiredStatusPanel config={config} />
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

const cropByUsageTypeConfig: LumeoConfig = {
  ...baseConfig,
  waitForSuccess: true,
  locale: "tr",
  imageTypes: nestedImageTypesDemo,
};

export const CropByUsageTypeDemo: Story = {
  name: "Uçtan uca: yükle + waitForSuccess: true + cropByUsageType modal + MiniViewer + Lexical",
  render: () => (
    <LumeoProvider config={cropByUsageTypeConfig}>
      <CropByUsageTypeUploaderHarness config={cropByUsageTypeConfig} />
    </LumeoProvider>
  ),
  parameters: {
    layout: "fullscreen",
    msw: { handlers: slowHandlers },
    docs: {
      description: {
        story:
          "Bir görsel yükleyin (`waitForSuccess: true` olduğu için üstte yükleme çubuğu görünür), listeden açın: modal doğrudan `cropByUsageType` modunda açılır — kullanım tipine tıklamak o oranda bir kırpma alanı oluşturur ve üstüne gelince küçük bir önizleme gösterir, Kaydet'e basınca kırpmalar görselin kendi `crops` alanına kaydedilir (yeni bir liste satırı oluşmaz). Bu örnekte `imageTypes` gruplu verilmiş: \"Haberler\" (Manşet, Kapak) ve \"Reklam\" (Banner, Kare Reklam) birer başlık altında toplanmış görünür, \"Galeri Görseli\" ise gruplanmamış düz bir seçenek olarak yanlarında kalır — Kaydet'e basınca, kırpılan tip bir grubun içindeyse istek gövdesine `clientId` ile aynı seviyede grubun `value`'sunu taşıyan bir `typeId` alanı da eklenir. Üstteki ayrı başlıklı \"Zorunlu Kadrajlar\" paneli, `required: true` verilen her tipi minimal rozetler olarak listeler (`useRequiredImageTypes(...).statuses`, sadece genel bir mesaj değil): \"Reklam\" grubun TÜM çocukları (Banner VE Kare Reklam) kullanılınca tamamlanmış sayılan bir gerekliliktir, rozetin içinde her çocuk (`status.children`) kendi noktasıyla ayrı ayrı renklenir — yalnızca \"Kare Reklam\" kadrajlanırsa o nokta tek başına yeşile döner, \"Banner\" kırmızı kalır. \"Kapak\" ise tek başına (ayrı ayrı) zorunlu ama yine de \"Haberler\" grubunun içinde tanımlı — `status.parent` sayesinde rozeti \"Haberler: Kapak\" şeklinde, o grubun altından geldiğini göstererek çiziyoruz. Bu tamamen pakete özel modalin dışında, host uygulamanın kendi kaydet butonunu aç/kapat etmek için kullanabileceği bir örnektir (panel kendi `useLumeoImages` kopyasını tutar ama aynı config'i kullanan her `useLumeoImages` çağrısı artık tek bir paylaşımlı listeyi izler — modalde bir kaydetme olduğu an panel otomatik güncellenir, elle yenilemeye gerek yoktur). Sağ altta başlangıçta küçültülmüş (`defaultCollapsed`) ve sürüklenebilir bir `LumeoMiniViewer` de var; açıp bir görseli alttaki Lexical editörüne sürükleyip bırakırsanız görselin tüm bilgileriyle (id, dosya adı, boyutlar, tip vb. — sadece `url` değil) gerçek bir görsel nesnesi olarak eklenir (`ImageNode` + `ImageObjectDropPlugin`, `src/stories/lexical/`). Editörde kalın/italik/altı çizili/üstü çizili için bir araç çubuğu (`ToolbarPlugin`) ve altında editör durumunun canlı JSON çıktısını gösteren bir panel (`JsonOutputPlugin`) var — bıraktığınız görselin tüm alanlarını orada, düğümün kendi `image` anahtarı altında görebilirsiniz.",
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
