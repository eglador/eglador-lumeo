<img src=".github/eglador-logo.svg" alt="eglador-lumeo" width="200" />

# eglador-lumeo

Drag & drop image upload, gallery, usage-type tagging, and dependency-free cropping toolkit for Next.js.

Author: [Umut Yaldız](https://github.com/umutyaldiz)

---

**Languages:** [English](#english) | [Türkçe](#türkçe) (scroll to the bottom)

---

## English

### Install

```bash
npm install eglador-lumeo
```

```tsx
// app/layout.tsx
import "eglador-lumeo/style.css";
```

### Usage

```tsx
"use client";
import { LumeoProvider, LumeoUploader, type LumeoConfig } from "eglador-lumeo";

const config: LumeoConfig = {
  endpoints: {
    upload: "/api/images/upload",
    list: "/api/images",
    save: "/api/images/save",
    delete: "/api/images/delete",
  },
  waitForSuccess: false,
  maxFileSizeMB: 10,
  accept: ["image/*"],
  // Opaque, consumer-supplied id (site/tenant/project id, etc.) — the
  // package never interprets it, it's just forwarded on every request.
  clientId: "news-site-42",
  // UI language for every built-in string. Default: "en". Set "tr" for Turkish.
  locale: "en",
};

export function MediaLibrary() {
  return (
    <LumeoProvider config={config}>
      <LumeoUploader />
    </LumeoProvider>
  );
}
```

### Customizing usage types and size presets

Both the "usage type" list (headline/cover/banner/...) and the size-preset list shown in the crop
modal are fully overridable from config — pass your own arrays and the built-in defaults are
skipped entirely:

```tsx
const config: LumeoConfig = {
  endpoints: { /* ... */ },
  imageTypes: [
    { value: "hero", label: "Hero Image", aspect: 21 / 9 },
    { value: "avatar", label: "Avatar", aspect: 1 },
  ],
  sizePresets: [
    { id: "square", width: 512, height: 512 },
    { id: "wide", width: 1600, height: 900, label: "1600×900 (Wide)" },
  ],
};
```

If omitted, `imageTypes` and `sizePresets` fall back to a locale-aware built-in default set
(English by default, Turkish when `locale: "tr"`).

### Localization (`locale`)

`config.locale` is `"en"` (default) or `"tr"`. It switches every built-in UI string (buttons,
labels, placeholders, empty states) and the default `imageTypes`/`sizePresets` labels, plus date
formatting (`en-US` vs `tr-TR`). The package ships only these two locales; anything else falls
back to English.

### API Schemas

Below are the exact request/response shapes your backend must implement for the 4 URLs in
`config.endpoints`. The package **never generates the `id` field itself** — it always expects it
from the API response.

If `config.clientId` is set, it's automatically attached to **every** request as a fully opaque
value — the package never interprets it, only forwards it:

- `upload`: added as a `clientId` field in the `multipart/form-data`
- `list`: added as a `?clientId=...` query parameter
- `save` / `delete`: added as a `clientId` field in the JSON body

#### `LumeoImage` (shared data model across every endpoint)

```ts
interface LumeoImage {
  id: string;           // assigned by the API, required
  fileName: string;
  url: string;
  uploadedAt: string;    // ISO 8601, e.g. "2026-07-01T20:15:30.000Z"
  type?: string;         // e.g. "manset" | "kapak" | "banner" | "schema" | "thumbnail" | "galeri"
  fileSize?: number;     // bytes
  mimeType?: string;     // e.g. "image/jpeg"
  width?: number;        // original pixel width, returned by the API after upload
  height?: number;       // original pixel height, returned by the API after upload
}
```

---

##### 1) `endpoints.upload` — `POST`

One or more files are sent in a **single request** as `multipart/form-data`. Every file is
appended under the same `files` field name.

**Request (multipart/form-data):**

```
POST /api/images/upload
Content-Type: multipart/form-data; boundary=...

files: (binary) headline-image.jpg
files: (binary) cover-photo.png
clientId: news-site-42        (if config.clientId is set)
```

**Expected response (200):**

```json
{
  "success": true,
  "images": [
    {
      "id": "img_9f1c2a",
      "fileName": "headline-image.jpg",
      "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "fileSize": 245000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080
    },
    {
      "id": "img_9f1c2b",
      "fileName": "cover-photo.png",
      "url": "https://cdn.example.com/uploads/img_9f1c2b.png",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "fileSize": 198000,
      "mimeType": "image/png",
      "width": 1200,
      "height": 800
    }
  ]
}
```

> Note: when `waitForSuccess: true`, the package only checks `response.ok` (HTTP 2xx) before
> refreshing the list once; it does not read `success`/`images` — those fields are your backend's
> actual source of truth, the package only decides based on the HTTP status. When
> `waitForSuccess: false`, the list is already refreshed without waiting for this response at all.

---

##### 2) `endpoints.list` — `GET`

**Request:**

```
GET /api/images
GET /api/images?clientId=news-site-42   (if config.clientId is set)
```

**Expected response (200)** — either shape is accepted:

```json
{
  "images": [
    {
      "id": "img_9f1c2a",
      "fileName": "headline-image.jpg",
      "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "type": "manset",
      "fileSize": 245000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

or directly as an array:

```json
[
  {
    "id": "img_9f1c2a",
    "fileName": "headline-image.jpg",
    "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
    "uploadedAt": "2026-07-01T20:15:30.000Z",
    "type": "manset",
    "width": 1920,
    "height": 1080
  }
]
```

---

##### 3) `endpoints.save` — `POST`

Fired when the user clicks "Save" in the image modal. The body depends on which tab the user
used; `sizes` and `crops` are **both optional and only sent if the user made a selection in that
tab**.

**a) Only a type was selected (resize/crop was never opened):**

```json
{
  "id": "img_9f1c2a",
  "type": "manset"
}
```

**b) One or more preset sizes were picked from the "Size Options" tab** (no manual area selection,
just target dimensions):

```json
{
  "id": "img_9f1c2a",
  "type": "manset",
  "sizes": [
    { "width": 1024, "height": 768, "label": "1024x768" },
    { "width": 400, "height": 400, "label": "400x400" }
  ]
}
```

**c) One or more regions were manually selected from the "Custom Crop" tab** — coordinates are in
the original image's natural pixel space, `x`/`y` from the top-left corner:

```json
{
  "id": "img_9f1c2a",
  "type": "manset",
  "crops": [
    {
      "id": "c1a2b3c4-...",
      "name": "Crop 1",
      "aspectLabel": "16:9",
      "aspect": 1.7777777777777777,
      "x": 120,
      "y": 340,
      "width": 1024,
      "height": 576
    }
  ]
}
```

**d) If both tabs were used**, `sizes` and `crops` are sent together (b + c combined).

> If `config.clientId` is set, a `"clientId": "news-site-42"` field is automatically added to all
> of the bodies above.

**Expected response (200):**

```json
{ "success": true }
```

---

##### 4) `endpoints.delete` — `DELETE`

**Request:**

```json
{ "id": "img_9f1c2a", "clientId": "news-site-42" }
```

(Sent via the `DELETE` method with a `Content-Type: application/json` body. The `clientId` field
is only added if `config.clientId` is set.)

**Expected response (200):**

```json
{ "success": true }
```

---

For all 4 endpoints, the package only checks `response.ok` (the HTTP status code); a `success`
field is not required but recommended for readability. See `src/mocks/handlers.ts` for a working
mock server example.

### Next.js helper hook

```tsx
"use client";
import { useLumeoImages } from "eglador-lumeo";

function HeadlineImages() {
  const { images, loading, refetch } = useLumeoImages(config, { type: "manset" });
  // ...
}
```

### Mini corner viewer

```tsx
<LumeoMiniViewer corner="bottom-right" onImageClick={(image) => insertIntoEditor(image)} />
```

By default the viewer is `position="fixed"`, pinned to a viewport corner via `corner`. Pass
`position="static"` to embed it as a normal in-flow element inside any container you control —
position and size it with your own CSS:

```tsx
<div className="sidebar">
  <LumeoMiniViewer position="static" onImageClick={(image) => insertIntoEditor(image)} />
</div>
```

#### Dragging thumbnails into an editor

Pass `dragData` to make thumbnails draggable. `pattern` is a template string with a placeholder
token (default `"{value}"`, override via `placeholder`) that gets replaced with whatever
`getValue` returns (default: `image.id`). The result is written to `event.dataTransfer` under
`format` (default `"text/plain"`) on `dragstart`, ready for any drop target to read.

```tsx
<LumeoMiniViewer
  onImageClick={(image) => insertIntoEditor(image)}
  dragData={{
    pattern: "#resim#[RESIMID]#",
    placeholder: "[RESIMID]",
    getValue: (image) => image.id,
  }}
/>
```

**Lexical editor:** register a plugin that reads the same `format` on drop and inserts it as
text. A copy-pasteable reference implementation lives at
[`src/stories/lexical/ImageDropPlugin.tsx`](src/stories/lexical/ImageDropPlugin.tsx) (not
published with the package — copy it into your app) and is wired up end-to-end in the
`LumeoMiniViewer / EmbeddedWithLexicalEditor` Storybook story, which drags a thumbnail into a
real `LexicalComposer` editor and drops in the configured pattern.

### Development

```bash
npm install
npm run storybook   # explore every component with mocked API responses
npm run build       # tsup + tailwind CSS build -> dist/
npm run typecheck
```

---

## Türkçe

### Kurulum

```bash
npm install eglador-lumeo
```

```tsx
// app/layout.tsx
import "eglador-lumeo/style.css";
```

### Kullanım

```tsx
"use client";
import { LumeoProvider, LumeoUploader, type LumeoConfig } from "eglador-lumeo";

const config: LumeoConfig = {
  endpoints: {
    upload: "/api/images/upload",
    list: "/api/images",
    save: "/api/images/save",
    delete: "/api/images/delete",
  },
  waitForSuccess: false,
  maxFileSizeMB: 10,
  accept: ["image/*"],
  // Opaque, sizin tanımladığınız bir kimlik (site/tenant/proje id vb.) —
  // paket bunu yorumlamaz, sadece her isteğe aynen ekler.
  clientId: "news-site-42",
  // Tüm hazır arayüz metinlerinin dili. Varsayılan: "en". Türkçe için "tr" verin.
  locale: "tr",
};

export function MediaLibrary() {
  return (
    <LumeoProvider config={config}>
      <LumeoUploader />
    </LumeoProvider>
  );
}
```

### Kullanım tipi ve boyut seçeneklerini özelleştirme

Hem "kullanım tipi" listesi (manşet/kapak/banner/...) hem de kırpma modalinde gösterilen boyut
seçenekleri listesi tamamen config üzerinden özelleştirilebilir — kendi dizinizi verirseniz
hazır varsayılanlar tamamen devre dışı kalır:

```tsx
const config: LumeoConfig = {
  endpoints: { /* ... */ },
  imageTypes: [
    { value: "hero", label: "Ana Görsel", aspect: 21 / 9 },
    { value: "avatar", label: "Avatar", aspect: 1 },
  ],
  sizePresets: [
    { id: "square", width: 512, height: 512 },
    { id: "wide", width: 1600, height: 900, label: "1600×900 (Geniş)" },
  ],
};
```

`imageTypes` ve `sizePresets` verilmezse, dile göre (locale) değişen hazır bir varsayılan sete
düşer (varsayılan olarak İngilizce, `locale: "tr"` verildiğinde Türkçe).

### Dil desteği (`locale`)

`config.locale` değeri `"en"` (varsayılan) veya `"tr"` olabilir. Bu değer, tüm hazır arayüz
metinlerini (butonlar, etiketler, placeholder'lar, boş durum mesajları), varsayılan
`imageTypes`/`sizePresets` etiketlerini ve tarih biçimini (`en-US` / `tr-TR`) değiştirir. Paket
sadece bu iki dili barındırır; başka bir değer verilirse İngilizce'ye düşer.

### API Şemaları

`config.endpoints` içindeki 4 URL için backend'in uyması gereken tam istek/yanıt şemaları
aşağıdadır. Paket, `id` alanını **asla kendisi üretmez** — her zaman API yanıtından gelmesini
bekler.

`config.clientId` verilirse (opsiyonel), tamamen opak bir değer olarak **her istekte otomatik
olarak** eklenir — paket bu değeri hiç yorumlamaz, sadece taşır:

- `upload`: `multipart/form-data` içine `clientId` alanı olarak eklenir
- `list`: URL'ye `?clientId=...` query parametresi olarak eklenir
- `save` / `delete`: JSON gövdesine `clientId` alanı olarak eklenir

#### `LumeoImage` (tüm endpoint'lerde ortak veri modeli)

```ts
interface LumeoImage {
  id: string;           // API tarafından atanır, zorunlu
  fileName: string;
  url: string;
  uploadedAt: string;   // ISO 8601, ör. "2026-07-01T20:15:30.000Z"
  type?: string;        // ör. "manset" | "kapak" | "banner" | "schema" | "thumbnail" | "galeri"
  fileSize?: number;    // byte
  mimeType?: string;    // ör. "image/jpeg"
  width?: number;       // orijinal piksel genişliği, upload sonrası API'den döner
  height?: number;      // orijinal piksel yüksekliği, upload sonrası API'den döner
}
```

---

##### 1) `endpoints.upload` — `POST`

Bir veya birden fazla dosya, `multipart/form-data` ile **tek istekte** gönderilir. Her dosya aynı
`files` alan adıyla eklenir.

**İstek (multipart/form-data):**

```
POST /api/images/upload
Content-Type: multipart/form-data; boundary=...

files: (binary) manset-gorseli.jpg
files: (binary) kapak-foto.png
clientId: news-site-42        (config.clientId tanımlıysa)
```

**Beklenen yanıt (200):**

```json
{
  "success": true,
  "images": [
    {
      "id": "img_9f1c2a",
      "fileName": "manset-gorseli.jpg",
      "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "fileSize": 245000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080
    },
    {
      "id": "img_9f1c2b",
      "fileName": "kapak-foto.png",
      "url": "https://cdn.example.com/uploads/img_9f1c2b.png",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "fileSize": 198000,
      "mimeType": "image/png",
      "width": 1200,
      "height": 800
    }
  ]
}
```

> Not: `waitForSuccess: true` olduğunda paket sadece `response.ok` (HTTP 2xx) durumuna bakıp
> listeyi bir kez yeniler; `success`/`images` alanlarını okumaz — o alanlar sizin backend'inizin
> gerçek kaynağı olur, paket sadece HTTP durumuna göre karar verir. `waitForSuccess: false`
> olduğunda bu yanıtı hiç beklemeden liste zaten yenilenir.

---

##### 2) `endpoints.list` — `GET`

**İstek:**

```
GET /api/images
GET /api/images?clientId=news-site-42   (config.clientId tanımlıysa)
```

**Beklenen yanıt (200)** — iki şekilden biri kabul edilir:

```json
{
  "images": [
    {
      "id": "img_9f1c2a",
      "fileName": "manset-gorseli.jpg",
      "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
      "uploadedAt": "2026-07-01T20:15:30.000Z",
      "type": "manset",
      "fileSize": 245000,
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080
    }
  ]
}
```

veya doğrudan dizi olarak:

```json
[
  {
    "id": "img_9f1c2a",
    "fileName": "manset-gorseli.jpg",
    "url": "https://cdn.example.com/uploads/img_9f1c2a.jpg",
    "uploadedAt": "2026-07-01T20:15:30.000Z",
    "type": "manset",
    "width": 1920,
    "height": 1080
  }
]
```

---

##### 3) `endpoints.save` — `POST`

Görsel modalinde "Kaydet" butonuna basıldığında tetiklenir. Gövde, kullanıcının hangi sekmeyi
kullandığına göre değişir; `sizes` ve `crops` alanları **her ikisi de opsiyoneldir ve sadece
kullanıcı o sekmede seçim yaptıysa gönderilir**.

**a) Sadece tip seçildiyse (kırpma/boyut sekmesi hiç açılmadıysa):**

```json
{
  "id": "img_9f1c2a",
  "type": "manset"
}
```

**b) "Boyut Seçenekleri" sekmesinden hazır boyut(lar) seçildiyse** (kullanıcı elle alan seçmez,
sadece hedef ölçüleri işaretler):

```json
{
  "id": "img_9f1c2a",
  "type": "manset",
  "sizes": [
    { "width": 1024, "height": 768, "label": "1024x768" },
    { "width": 400, "height": 400, "label": "400x400" }
  ]
}
```

**c) "Özel Kırpma" sekmesinden elle bölge(ler) seçildiyse** — koordinatlar orijinal görselin doğal
piksel boyutuna göredir, `x`/`y` sol-üst köşeden itibaren:

```json
{
  "id": "img_9f1c2a",
  "type": "manset",
  "crops": [
    {
      "id": "c1a2b3c4-...",
      "name": "Kırpma 1",
      "aspectLabel": "16:9",
      "aspect": 1.7777777777777777,
      "x": 120,
      "y": 340,
      "width": 1024,
      "height": 576
    }
  ]
}
```

**d) Aynı anda her iki sekmede de seçim yapıldıysa**, `sizes` ve `crops` birlikte gönderilir (b + c
birleşimi).

> `config.clientId` tanımlıysa yukarıdaki gövdelerin hepsine otomatik olarak
> `"clientId": "news-site-42"` alanı eklenir.

**Beklenen yanıt (200):**

```json
{ "success": true }
```

---

##### 4) `endpoints.delete` — `DELETE`

**İstek:**

```json
{ "id": "img_9f1c2a", "clientId": "news-site-42" }
```

(`DELETE` metodu ile, `Content-Type: application/json` gövdesinde gönderilir. `clientId` alanı
sadece `config.clientId` tanımlıysa eklenir.)

**Beklenen yanıt (200):**

```json
{ "success": true }
```

---

Her 4 endpoint için de paket sadece `response.ok` (HTTP durum kodu) kontrolü yapar; `success`
alanı zorunlu değildir ama okunabilirlik için önerilir. Çalışan bir mock sunucu örneği için bkz.
`src/mocks/handlers.ts`.

### Next.js yardımcı hook'u

```tsx
"use client";
import { useLumeoImages } from "eglador-lumeo";

function ManşetGorselleri() {
  const { images, loading, refetch } = useLumeoImages(config, { type: "manset" });
  // ...
}
```

### Mini köşe görüntüleyici

```tsx
<LumeoMiniViewer corner="bottom-right" onImageClick={(image) => insertIntoEditor(image)} />
```

Varsayılan olarak görüntüleyici `position="fixed"`'dir; `corner` ile viewport'un bir köşesine
sabitlenir. Kendi kontrol ettiğiniz bir container'ın içine, normal akışta bir eleman olarak
gömmek için `position="static"` verin — konumlandırmayı ve boyutu kendi CSS'inizle yapın:

```tsx
<div className="sidebar">
  <LumeoMiniViewer position="static" onImageClick={(image) => insertIntoEditor(image)} />
</div>
```

#### Küçük resimleri bir editöre sürükleyip bırakmak

Küçük resimleri sürüklenebilir yapmak için `dragData` verin. `pattern`, içinde bir yer tutucu
token barındıran bir şablon dizesidir (varsayılan `"{value}"`, `placeholder` ile değiştirilebilir)
ve bu token, `getValue`'nün döndürdüğü değerle (varsayılan: `image.id`) değiştirilir. Sonuç,
`dragstart` sırasında `format` (varsayılan `"text/plain"`) altında `event.dataTransfer`'a
yazılır; herhangi bir bırakma (drop) hedefi bunu okuyabilir.

```tsx
<LumeoMiniViewer
  onImageClick={(image) => insertIntoEditor(image)}
  dragData={{
    pattern: "#resim#[RESIMID]#",
    placeholder: "[RESIMID]",
    getValue: (image) => image.id,
  }}
/>
```

**Lexical editör:** bırakma (drop) sırasında aynı `format`'ı okuyup metin olarak ekleyen bir
plugin kaydedin. Kopyalayıp kullanabileceğiniz referans implementasyon
[`src/stories/lexical/ImageDropPlugin.tsx`](src/stories/lexical/ImageDropPlugin.tsx) dosyasında
(pakete dahil değildir — kendi uygulamanıza kopyalayın) ve `LumeoMiniViewer /
EmbeddedWithLexicalEditor` Storybook örneğinde uçtan uca bağlanmış halde bulunuyor; bu örnek bir
küçük resmi gerçek bir `LexicalComposer` editörüne sürükleyip yapılandırılmış pattern'i bırakıyor.

### Geliştirme

```bash
npm install
npm run storybook   # her bileşeni sahte API yanıtlarıyla keşfedin
npm run build       # tsup + tailwind CSS build -> dist/
npm run typecheck
```
