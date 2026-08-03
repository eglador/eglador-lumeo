import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { X } from "lucide-react";
import { LumeoUploader } from "../components/LumeoUploader/LumeoUploader";
import { LumeoProvider } from "../context/LumeoProvider";
import { useLumeoConfig } from "../hooks/useLumeoConfig";
import { useLumeoImages } from "../hooks/useLumeoImages";
import { deleteImage } from "../lib/api";
import { refreshOnce } from "../lib/refreshOnce";
import { slowHandlers } from "../mocks/handlers";
import type { LumeoConfig, LumeoImage } from "../types";

// A second, independent config — different clientId/siteId, no imageTypes/cropByUsageType — to
// show a plain LumeoUploader (just upload + browse) can coexist on the same page as other,
// differently-configured Lumeo instances, each with its own shared list cache.
const externalDemoConfig: LumeoConfig = {
  endpoints: {
    upload: "/api/mock/upload",
    list: "/api/mock/list",
    save: "/api/mock/save",
    delete: "/api/mock/delete",
  },
  maxFileSizeMB: 10,
  accept: ["image/*"],
  clientId: "external-demo-client",
  siteId: 99,
  locale: "tr",
  // Wait for each request to actually succeed before refreshing the shared list — otherwise a
  // delete (or upload) refetches immediately and the mock's artificial delay means the refreshed
  // list still shows the pre-delete state for a moment.
  waitForSuccess: true,
  // Not that it matters here since `hideGallery` keeps the modal (where these would show) from
  // ever rendering, but explicit per the ask: no usage types, no size presets for this demo.
  imageTypes: [],
  sizePresets: [],
};

/**
 * NOT part of the eglador-lumeo package — a small example-only component showing how a host app
 * can build its own "single selection" list on top of the public `useLumeoImages` hook: reads the
 * same shared image list `LumeoUploader` writes to (auto-updates after an upload, no wiring
 * needed), and enforces a single active pick — once one is selected, every other thumbnail fades
 * and stops responding to clicks; clicking the selected one again clears the selection. Also
 * demonstrates deleting straight from a custom list using the public `deleteImage`/`refreshOnce`
 * functions — no `ImageModal` required.
 */
function SelectableLumeoList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (image: LumeoImage | null) => void;
}) {
  const config = useLumeoConfig();
  const { allImages, loading, refetch } = useLumeoImages(config);

  const handleDelete = (event: React.MouseEvent, image: LumeoImage) => {
    event.stopPropagation();
    if (!window.confirm(`"${image.fileName}" silinsin mi?`)) return;
    refreshOnce(config, "delete", deleteImage(config, image.id), refetch);
    if (image.id === selectedId) onSelect(null);
  };

  if (loading && allImages.length === 0) {
    return <p style={{ fontSize: 13, color: "#71717a" }}>Yükleniyor…</p>;
  }
  if (allImages.length === 0) {
    return <p style={{ fontSize: 13, color: "#71717a" }}>Henüz görsel yok — yukarıdan bir görsel yükleyin.</p>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
      {allImages.map((image) => {
        const isSelected = image.id === selectedId;
        const isLocked = selectedId !== null && !isSelected;
        return (
          <div key={image.id} style={{ position: "relative", aspectRatio: "1 / 1" }}>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onSelect(isSelected ? null : image)}
              title={image.fileName}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                padding: 0,
                border: isSelected ? "2px solid #16a34a" : "1px solid #e4e4e7",
                borderRadius: 8,
                overflow: "hidden",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.4 : 1,
                pointerEvents: isLocked ? "none" : "auto",
                transition: "opacity 150ms, border-color 150ms",
              }}
            >
              <img
                src={image.url}
                alt={image.fileName}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
            <button
              type="button"
              onClick={(event) => handleDelete(event, image)}
              title="Görseli sil"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                lineHeight: 0,
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface FotoHaberItem {
  id: string;
  url: string;
  title: string;
  description: string;
}

/** Also not part of the package — a made-up "photo news" card list unrelated to Lumeo's own data model, just to demonstrate consuming the picked image's `url` from an entirely separate form. */
function FotoHaberKart({
  item,
  selectedImage,
  onChange,
  onRemove,
  onSelectedUsed,
}: {
  item: FotoHaberItem;
  selectedImage: LumeoImage | null;
  onChange: (id: string, patch: Partial<FotoHaberItem>) => void;
  onRemove: (id: string) => void;
  /** Called after this card consumes the currently selected image, so the picker clears — ready to pick a fresh image for the next card. */
  onSelectedUsed: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e4e4e7",
        borderRadius: 8,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>Foto Haber</strong>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}
        >
          Kaldır
        </button>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 96,
            height: 96,
            flexShrink: 0,
            borderRadius: 6,
            border: "1px solid #e4e4e7",
            background: "#fafafa",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.url ? (
            <img
              src={item.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span style={{ fontSize: 11, color: "#a1a1aa", textAlign: "center", padding: 4 }}>Önizleme</span>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            type="button"
            disabled={!selectedImage}
            onClick={() => {
              if (!selectedImage) return;
              onChange(item.id, { url: selectedImage.url });
              onSelectedUsed();
            }}
            style={{
              alignSelf: "flex-start",
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #18181b",
              background: selectedImage ? "#18181b" : "#e4e4e7",
              color: selectedImage ? "#fff" : "#a1a1aa",
              cursor: selectedImage ? "pointer" : "not-allowed",
            }}
          >
            Seçili İmajı Ekle
          </button>
          <input
            type="text"
            placeholder="Görsel URL"
            value={item.url}
            onChange={(event) => onChange(item.id, { url: event.target.value })}
            style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid #e4e4e7" }}
          />
        </div>
      </div>

      <input
        type="text"
        placeholder="Başlık"
        value={item.title}
        onChange={(event) => onChange(item.id, { title: event.target.value })}
        style={{ fontSize: 13, padding: "6px 8px", borderRadius: 6, border: "1px solid #e4e4e7" }}
      />
      <textarea
        placeholder="Açıklama"
        value={item.description}
        onChange={(event) => onChange(item.id, { description: event.target.value })}
        rows={2}
        style={{
          fontSize: 13,
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #e4e4e7",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

function ExternalUsageHarness() {
  const [selectedImage, setSelectedImage] = useState<LumeoImage | null>(null);
  const [items, setItems] = useState<FotoHaberItem[]>([]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), url: "", title: "", description: "" }]);
  };
  const updateItem = (id: string, patch: Partial<FotoHaberItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Lumeo Uploader (bağımsız config)</h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>
          Yüklenen görseller aşağıdaki "Görsel Seç" bölümünde zaten listeleniyor, bu yüzden
          `hideGallery` ile paketin kendi galerisi burada gizlendi — sadece yükleme alanı kalıyor.
        </p>
        <LumeoUploader hideGallery />
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Görsel Seç</h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>
          Listeden bir görsele tıklayın — seçildiğinde diğerleri pasifleşir (dokunulmaz olur),
          tekrar tıklarsanız seçim kalkar.
        </p>
        <SelectableLumeoList selectedId={selectedImage?.id ?? null} onSelect={setSelectedImage} />
        {selectedImage && (
          <p style={{ fontSize: 12, color: "#16a34a", marginTop: 8 }}>
            Seçili: <strong>{selectedImage.fileName}</strong> ({selectedImage.id})
          </p>
        )}
      </section>

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>
            Foto Haber Listesi{" "}
            <span style={{ fontWeight: 400, color: "#a1a1aa", fontSize: 13 }}>
              (Lumeo'ya dahil değil, harici örnek)
            </span>
          </h2>
          <button
            type="button"
            onClick={addItem}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #18181b",
              background: "#18181b",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            + Kare Ekle
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.length === 0 && (
            <p style={{ fontSize: 13, color: "#a1a1aa" }}>Henüz foto haber kartı eklenmedi.</p>
          )}
          {items.map((item) => (
            <FotoHaberKart
              key={item.id}
              item={item}
              selectedImage={selectedImage}
              onChange={updateItem}
              onRemove={removeItem}
              onSelectedUsed={() => setSelectedImage(null)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta: Meta = {
  title: "Örnekler/Harici Kullanım Senaryosu",
};

export default meta;
type Story = StoryObj;

export const FotoHaberEntegrasyonu: Story = {
  name: "Lumeo'dan seçilen görseli harici bir foto haber formuna aktarma",
  render: () => (
    <LumeoProvider config={externalDemoConfig}>
      <ExternalUsageHarness />
    </LumeoProvider>
  ),
  parameters: {
    layout: "fullscreen",
    msw: { handlers: slowHandlers },
    docs: {
      description: {
        story:
          "Bu sayfa tamamen bağımsız bir örnektir ve `eglador-lumeo` paketine dahil değildir — sadece paketin public API'siyle nasıl dışarıdan entegrasyon yapılabileceğini gösterir. Üstteki `LumeoUploader`, kendi bağımsız config'iyle (farklı `clientId`/`siteId`, `imageTypes`/`cropByUsageType` yok — sade upload + liste) çalışır; aynı sayfada başka konfigürasyonlarla birden fazla Lumeo bileşeni bulunabileceğini gösterir. 'Görsel Seç' bölümü, paketin public `useLumeoImages` hook'unu kullanarak aynı listeyi okur (yüklenen her görsel otomatik burada da görünür, paylaşımlı önbellek sayesinde) ve kendi 'tek seçim' mantığını uygular: bir görsele tıklayınca o seçili kalır, diğerleri soluklaşıp tıklanamaz hale gelir (bu seçim/kilitleme davranışı paketin bir parçası değildir, sadece dışarıdan nasıl inşa edilebileceğinin örneğidir). En alttaki 'Foto Haber' kartları da tamamen harici, Lumeo ile hiçbir ilgisi olmayan örnek bir form listesidir — '+ Kare Ekle' ile yeni bir kart eklenir, her kartın 'Seçili İmajı Ekle' butonu üstte seçili olan Lumeo görselinin `url`'ini o karta kopyalar ve önizlemede gösterir; `url`, başlık ve açıklama alanları da elle düzenlenebilir.",
      },
    },
  },
};
