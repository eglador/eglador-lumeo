import { useState } from "react";
import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LumeoMiniViewer } from "../components/MiniViewer/LumeoMiniViewer";
import { LumeoProvider } from "../context/LumeoProvider";
import { handlers } from "../mocks/handlers";
import { ImageDropPlugin } from "./lexical/ImageDropPlugin";
import type { LumeoImage } from "../types";

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

/**
 * `position="fixed"` widgets are draggable by their header: grab the title bar and drop the
 * widget anywhere on the page. Collapsing it (the chevron button) shrinks it into a small
 * floating chip — icon, image count, and the same header drag handle — so it stays out of the
 * way without losing its position.
 */
export const DraggableViewer: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ height: "70vh", position: "relative" }}>
        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
          Widget'ı başlığından tutup sayfada istediğiniz yere sürükleyebilirsiniz. Sağ üstteki ok
          ikonuyla kapatırsanız küçük bir kutuya dönüşür — o kutuyu da aynı şekilde sürükleyip
          taşıyabilirsiniz.
        </p>
        <LumeoMiniViewer
          corner="top-right"
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        />
      </div>
    </LumeoProvider>
  ),
};

const lexicalInitialConfig = {
  namespace: "LumeoMiniViewerDemo",
  onError: (error: Error) => {
    throw error;
  },
};

/**
 * `position="static"` embeds the viewer inline instead of pinning it to a viewport corner, and
 * `dragData` makes thumbnails draggable — dragging one into the editor on the right inserts the
 * configured pattern (`#resim#[RESIMID]#`) at the caret, via the reference `ImageDropPlugin`
 * (src/stories/lexical/ImageDropPlugin.tsx).
 */
export const EmbeddedWithLexicalEditor: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ display: "flex", gap: 16, padding: 16, alignItems: "flex-start" }}>
        <LumeoMiniViewer
          position="static"
          className="lumeo:shrink-0"
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
          dragData={{
            pattern: "#resim#[RESIMID]#",
            placeholder: "[RESIMID]",
            getValue: (image) => image.id,
          }}
        />
        <LexicalComposer initialConfig={lexicalInitialConfig}>
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: 200,
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <PlainTextPlugin
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
            <HistoryPlugin />
            <ImageDropPlugin />
          </div>
        </LexicalComposer>
      </div>
    </LumeoProvider>
  ),
};

const fieldStyle: CSSProperties = {
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

function PlainFieldsHarness() {
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");

  return (
    <div style={{ display: "flex", gap: 16, padding: 16, alignItems: "flex-start" }}>
      <LumeoMiniViewer
        position="static"
        className="lumeo:shrink-0"
        onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        dragData={{
          pattern: "#resim#[RESIMID]#",
          placeholder: "[RESIMID]",
          getValue: (image) => image.id,
        }}
      />
      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, color: "#71717a", fontSize: 13 }}>
          Native <code>&lt;input&gt;</code> ve <code>&lt;textarea&gt;</code> elemanları
          <code>text/plain</code> sürükle-bırakını tarayıcı düzeyinde zaten destekler — herhangi
          bir <code>onDrop</code> kodu yazmaya gerek yok, MiniViewer'ın <code>dragData.format</code>{" "}
          değeri (varsayılan <code>"text/plain"</code>) yeterli.
        </p>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#3f3f46" }}>
          Başlık (input)
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Bir görseli buraya sürükleyip bırakın…"
            style={fieldStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#3f3f46" }}>
          İçerik (textarea)
          <textarea
            value={textareaValue}
            onChange={(event) => setTextareaValue(event.target.value)}
            placeholder="Bir görseli buraya sürükleyip bırakın…"
            rows={6}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Unlike a Lexical `contentEditable`, plain `<input>`/`<textarea>` elements are native drop
 * targets for `text/plain` data — dragging a MiniViewer thumbnail onto either one inserts the
 * configured pattern at the caret with zero extra wiring on the field itself.
 */
export const EmbeddedWithPlainInputAndTextarea: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <PlainFieldsHarness />
    </LumeoProvider>
  ),
};

function SingleInputHarness() {
  const [inputValue, setInputValue] = useState("");

  return (
    <div style={{ height: "70vh", position: "relative", padding: 16 }}>
      <label style={{ display: "flex", maxWidth: 420, flexDirection: "column", gap: 4, fontSize: 12, color: "#3f3f46" }}>
        Kapak görseli (input)
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Bir görseli buraya sürükleyip bırakın ya da tıklayın…"
          style={fieldStyle}
        />
      </label>
      <LumeoMiniViewer
        corner="bottom-right"
        onImageClick={(image) => setInputValue(image.id)}
        dragData={{
          pattern: "#resim#[RESIMID]#",
          placeholder: "[RESIMID]",
          getValue: (image) => image.id,
        }}
      />
    </div>
  );
}

/**
 * Minimal single-field integration: one `<input>`, no editor or textarea. `position="fixed"`
 * (the default) pins the widget to the bottom-right corner, but — like any fixed widget — it's
 * draggable by its header afterward, and collapses into a small chip via the chevron button.
 * Clicking a thumbnail writes its id directly into the field (`onImageClick`); dragging one onto
 * the field inserts the configured pattern at the caret via native `text/plain` drop support.
 */
export const EmbeddedWithSingleInput: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <SingleInputHarness />
    </LumeoProvider>
  ),
};

/**
 * `defaultCollapsed` renders the widget as a small chip on first mount instead of fully
 * expanded — useful when you want it out of the way until the user actually needs it.
 */
export const StartsCollapsed: Story = {
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ height: "70vh", position: "relative" }}>
        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
          <code>defaultCollapsed</code> ile widget ilk açılışta küçük kutu halinde başlar; ok
          ikonuna tıklayınca genişler.
        </p>
        <LumeoMiniViewer
          corner="bottom-right"
          defaultCollapsed
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        />
      </div>
    </LumeoProvider>
  ),
};

// Mock list for the allowedTypes demo below: 4 images, only 2 of which ("None"/"InlineImage")
// should qualify — the other two ("Headline"/"Banner") prove the restriction actually filters
// something out, not just an empty no-op.
const allowedTypesImages: LumeoImage[] = [
  {
    id: "gövde-1",
    fileName: "govde-govseli-1.jpg",
    url: "https://picsum.photos/seed/allowed-none/600/400",
    uploadedAt: new Date().toISOString(),
    type: "None",
    width: 600,
    height: 400,
  },
  {
    id: "gövde-2",
    fileName: "govde-gorseli-2.jpg",
    url: "https://picsum.photos/seed/allowed-inline/600/400",
    uploadedAt: new Date().toISOString(),
    type: "InlineImage",
    width: 600,
    height: 400,
  },
  {
    id: "manset-1",
    fileName: "manset-gorseli.jpg",
    url: "https://picsum.photos/seed/allowed-headline/600/400",
    uploadedAt: new Date().toISOString(),
    type: "Headline",
    width: 600,
    height: 400,
  },
  {
    id: "banner-1",
    fileName: "banner-gorseli.jpg",
    url: "https://picsum.photos/seed/allowed-banner/600/400",
    uploadedAt: new Date().toISOString(),
    type: "Banner",
    width: 600,
    height: 400,
  },
];

const allowedTypesHandlers = [
  http.get("/api/mock/list", () => HttpResponse.json({ images: allowedTypesImages })),
];

/**
 * `allowedTypes` restricts the widget to only images whose `type` matches one of the given values
 * — here `["None", "InlineImage"]` — hiding every other tagged type (e.g. "Headline", "Banner")
 * regardless of what else exists in the list. The usage-type filter dropdown disappears too,
 * since there's nothing left to filter by — the list is already scoped. The mock list behind this
 * story has 4 images; only the 2 tagged "None"/"InlineImage" show up here.
 */
export const AllowedTypesOnly: Story = {
  name: "allowedTypes — sadece 'None'/'InlineImage' tipleri göster",
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ height: "70vh", position: "relative" }}>
        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
          Mock listede 4 görsel var — tipleri "None", "InlineImage", "Headline", "Banner".{" "}
          <code>allowedTypes=[&quot;None&quot;, &quot;InlineImage&quot;]</code> verildiği için
          sadece ilk ikisi burada görünüyor; "Headline"/"Banner" gizli kalıyor ve filtre
          dropdown'ı da kayboldu (zaten filtrelenecek bir şey kalmadığı için).
        </p>
        <LumeoMiniViewer
          corner="bottom-right"
          allowedTypes={["None", "InlineImage"]}
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        />
      </div>
    </LumeoProvider>
  ),
  parameters: {
    msw: { handlers: allowedTypesHandlers },
  },
};

// Same idea, but for a backend that sends its type tag under `imageType` instead of `type` — note
// `type` is left undefined on every image here, proving the check really reads `imageType`.
const allowedByImageTypeImages: LumeoImage[] = allowedTypesImages.map(({ type, ...rest }) => ({
  ...rest,
  imageType: type,
}));

const allowedByImageTypeHandlers = [
  http.get("/api/mock/list", () => HttpResponse.json({ images: allowedByImageTypeImages })),
];

/**
 * `allowedTypesField="imageType"` points the same restriction at `LumeoImage.imageType` instead
 * of `type` — for a backend that sends its type tag under that field name. Same mock scenario as
 * `AllowedTypesOnly` above, just with the tag moved to `imageType` (and `type` left undefined on
 * every image, to prove the check isn't secretly still reading `type`).
 */
export const AllowedTypesByImageTypeField: Story = {
  name: "allowedTypes + allowedTypesField=\"imageType\"",
  render: () => (
    <LumeoProvider config={config}>
      <div style={{ height: "70vh", position: "relative" }}>
        <p style={{ padding: 16, color: "#9ca3af", fontSize: 13 }}>
          Bu mock listede tip bilgisi <code>type</code> değil, <code>imageType</code> alanında
          taşınıyor (<code>type</code> hiçbirinde tanımlı değil).{" "}
          <code>allowedTypesField=&quot;imageType&quot;</code> verildiği için filtreleme yine
          doğru çalışıyor — sadece "None"/"InlineImage" görünüyor.
        </p>
        <LumeoMiniViewer
          corner="bottom-right"
          allowedTypes={["None", "InlineImage"]}
          allowedTypesField="imageType"
          onImageClick={(image) => alert(`Tıklandı: ${image.fileName}`)}
        />
      </div>
    </LumeoProvider>
  ),
  parameters: {
    msw: { handlers: allowedByImageTypeHandlers },
  },
};
