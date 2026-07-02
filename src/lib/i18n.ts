import type { LumeoLocale } from "../types";

export interface LumeoMessages {
  dropzoneCta: string;
  dropzoneMultiple: string;
  dropzoneSingle: string;
  rejectedCount: (count: number) => string;
  removeFile: (name: string) => string;
  close: string;
  reasonType: string;
  reasonSize: string;
  reasonMaxFiles: string;
  uploading: string;
  uploadCount: (count: number) => string;
  viewGrid: string;
  viewDetail: string;
  imageCount: (count: number) => string;
  refreshList: string;
  loading: string;
  noImages: string;
  usageType: string;
  imageId: string;
  info: string;
  uploadedAt: string;
  fileType: string;
  dimensions: string;
  resizeAndCrop: string;
  closeResizeAndCrop: string;
  delete: string;
  save: string;
  sizeOptionsTab: string;
  customCropTab: string;
  sizeOptionsHint: string;
  noSizePresets: string;
  free: string;
  customAdd: string;
  widthPlaceholder: string;
  heightPlaceholder: string;
  noCropRegions: string;
  removeRegion: (name: string) => string;
  newCropRegion: string;
  cropRegions: string;
  cropRegionName: (index: number) => string;
  recommendedRatio: string;
  miniViewerTitle: string;
  show: string;
  hide: string;
  all: string;
  cancel: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmSaveTitle: string;
  confirmSaveMessage: string;
}

const en: LumeoMessages = {
  dropzoneCta: "Drag & drop images here, or click to select",
  dropzoneMultiple: "You can select multiple files",
  dropzoneSingle: "You can select a single file",
  rejectedCount: (count) => `${count} file(s) were not accepted`,
  removeFile: (name) => `Remove file "${name}"`,
  close: "Close",
  reasonType: "unsupported file type",
  reasonSize: "exceeds the size limit",
  reasonMaxFiles: "exceeds the allowed number of files",
  uploading: "Uploading…",
  uploadCount: (count) => `Upload ${count} image(s)`,
  viewGrid: "Thumbnails",
  viewDetail: "Detail",
  imageCount: (count) => `${count} images`,
  refreshList: "Refresh list",
  loading: "Loading…",
  noImages: "No images yet",
  usageType: "Usage Type",
  imageId: "Image ID",
  info: "Info",
  uploadedAt: "Uploaded At",
  fileType: "File Type",
  dimensions: "Dimensions",
  resizeAndCrop: "Resize & Crop",
  closeResizeAndCrop: "Close Resize & Crop",
  delete: "Delete",
  save: "Save",
  sizeOptionsTab: "Size Options",
  customCropTab: "Custom Crop",
  sizeOptionsHint:
    "Pick one or more target sizes without selecting an area manually — the server will resize automatically.",
  noSizePresets: "No size presets defined.",
  free: "Free",
  customAdd: "Add Custom",
  widthPlaceholder: "W",
  heightPlaceholder: "H",
  noCropRegions: "No crop region added yet.",
  removeRegion: (name) => `Remove region "${name}"`,
  newCropRegion: "New Crop Region",
  cropRegions: "Crop Regions",
  cropRegionName: (index) => `Crop ${index}`,
  recommendedRatio: "Recommended Ratio",
  miniViewerTitle: "Lumeo Images",
  show: "Show",
  hide: "Hide",
  all: "All",
  cancel: "Cancel",
  confirmDeleteTitle: "Delete this image?",
  confirmDeleteMessage: "This action cannot be undone.",
  confirmSaveTitle: "Save changes?",
  confirmSaveMessage: "This will update the image right away.",
};

const tr: LumeoMessages = {
  dropzoneCta: "Görselleri sürükleyip bırakın veya seçmek için tıklayın",
  dropzoneMultiple: "BİRDEN FAZLA DOSYA SEÇEBİLİRSİNİZ",
  dropzoneSingle: "Tek dosya seçebilirsiniz",
  rejectedCount: (count) => `${count} dosya kabul edilmedi`,
  removeFile: (name) => `${name} dosyasını kaldır`,
  close: "Kapat",
  reasonType: "desteklenmeyen dosya tipi",
  reasonSize: "boyut sınırını aşıyor",
  reasonMaxFiles: "izin verilen dosya sayısını aşıyor",
  uploading: "Yükleniyor…",
  uploadCount: (count) => `${count} görseli yükle`,
  viewGrid: "Küçük Görsel",
  viewDetail: "Detay",
  imageCount: (count) => `${count} Görsel`,
  refreshList: "Listeyi yenile",
  loading: "Yükleniyor…",
  noImages: "Henüz görsel yok",
  usageType: "Kullanım Tipi",
  imageId: "Görsel ID",
  info: "Bilgiler",
  uploadedAt: "Yükleme Tarihi",
  fileType: "Dosya Tipi",
  dimensions: "Boyut",
  resizeAndCrop: "Boyutlandır & Kırp",
  closeResizeAndCrop: "Boyutlandır & Kırpmayı Kapat",
  delete: "Sil",
  save: "Kaydet",
  sizeOptionsTab: "Boyut Seçenekleri",
  customCropTab: "Özel Kırpma",
  sizeOptionsHint:
    "Alanı elle seçmeden hedef boyut(lar)ı işaretleyin — sunucu bu ölçülere göre otomatik boyutlandırır.",
  noSizePresets: "Tanımlı boyut seçeneği yok.",
  free: "Serbest",
  customAdd: "Özel Ekle",
  widthPlaceholder: "G",
  heightPlaceholder: "Y",
  noCropRegions: "Henüz bir kırpma bölgesi eklenmedi.",
  removeRegion: (name) => `${name} bölgesini sil`,
  newCropRegion: "Yeni Kırpma Bölgesi",
  cropRegions: "Kırpma Bölgeleri",
  cropRegionName: (index) => `Kırpma ${index}`,
  recommendedRatio: "Önerilen Oran",
  miniViewerTitle: "Lumeo Görselleri",
  show: "Göster",
  hide: "Gizle",
  all: "Tümü",
  cancel: "Vazgeç",
  confirmDeleteTitle: "Bu görsel silinsin mi?",
  confirmDeleteMessage: "Bu işlem geri alınamaz.",
  confirmSaveTitle: "Değişiklikler kaydedilsin mi?",
  confirmSaveMessage: "Görsel hemen güncellenecek.",
};

const MESSAGES: Record<LumeoLocale, LumeoMessages> = { en, tr };

/** Default locale is "en"; pass config.locale = "tr" to switch every built-in string to Turkish. */
export function resolveLocale(configured?: LumeoLocale): LumeoLocale {
  return configured ?? "en";
}

export function getMessages(locale?: LumeoLocale): LumeoMessages {
  return MESSAGES[resolveLocale(locale)];
}

export function dateLocaleTag(locale?: LumeoLocale): string {
  return resolveLocale(locale) === "tr" ? "tr-TR" : "en-US";
}
