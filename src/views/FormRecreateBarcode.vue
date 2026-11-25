<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import {
  IconSearch,
  IconBarcodeScan,
  IconDeviceFloppy,
  IconPlus,
  IconX,
  IconPrinter,
  IconDatabasePlus,
  IconTrash,
  IconDatabaseSearch,
} from "@tabler/icons-vue";

// --- Interfaces ---
interface BarcodeItem {
  tanggal: string;
  kodeBahan: string;
  namaBahan: string;
  barcode: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
  isNew: boolean;
  qrImage: string;
}

interface FormDataState {
  tanggal: string;
  kodeBahan: string;
  namaBahan: string;
  panjang: number;
  lebar: number;
  gudangKode: string;
  qty: number;
  barcodeSearchInput: string;
  qrSize: string; // Pilihan ukuran QR Code dalam cm ('1.5', '3', '5')
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const showBahanModal = ref(false);
const activeTab = ref(0);
const listPending = ref<BarcodeItem[]>([]);

const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);
const isSaveAndNew = ref(false);

const form = reactive<FormDataState>({
  tanggal: format(new Date(), "yyyy-MM-dd"),
  kodeBahan: "",
  namaBahan: "",
  panjang: 0,
  lebar: 0,
  gudangKode: "WH-16",
  qty: 1,
  barcodeSearchInput: "",
  qrSize: "1.5", // Default 1.5 cm
});

const qrSizeOptions = [
  { title: "1.5 cm (Kecil)", value: "1.5" },
  { title: "3 cm (Sedang)", value: "3" },
  { title: "5 cm (Besar)", value: "5" },
];

const detailHeaders = [
  { title: "QR", key: "qr", width: "70px", align: "center" as const },
  { title: "Informasi Barcode", key: "barcodeInfo", width: "250px" },
  { title: "Ukuran", key: "ukuran", width: "120px" },
  { title: "Tipe", key: "tipe", width: "100px", align: "center" as const },
  { title: "Aksi", key: "actions", width: "50px", align: "center" as const },
] as const;

// --- Computed ---
const totalNewItems = computed(
  () => listPending.value.filter((item) => item.isNew).length,
);

// --- Methods ---
const selectBahan = (val: any) => {
  form.kodeBahan = val.Kode;
  form.namaBahan = val.Nama;
  form.panjang = val.Panjang || 0;
  form.lebar = val.Lebar || 0;
  showBahanModal.value = false;
};

const handleGenerate = async () => {
  if (!form.kodeBahan || form.qty <= 0) {
    toast.warning("Pilih bahan dan isi jumlah qty");
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/mmt/recreate-barcode/next-number`, {
      params: {
        kodeBahan: form.kodeBahan,
        tanggal: form.tanggal,
      },
    });

    if (res.data.success) {
      const ym = res.data.ym;
      let startSeq = res.data.nextSeq;

      const sameBahanInAntrean = listPending.value.filter(
        (item) => item.kodeBahan === form.kodeBahan && item.isNew,
      );

      if (sameBahanInAntrean.length > 0) {
        const lastBarcodeInList =
          sameBahanInAntrean[sameBahanInAntrean.length - 1].barcode;
        const parts = lastBarcodeInList.split("-");
        const lastSeqNumber = parseInt(parts[parts.length - 1]);
        startSeq = lastSeqNumber + 1;
      }

      for (let i = 0; i < form.qty; i++) {
        const currentSeq = startSeq + i;
        const newBarcode = `${form.kodeBahan}-${ym}-${String(currentSeq).padStart(3, "0")}`;

        const qrImage = await QRCode.toDataURL(newBarcode, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "M",
        });

        for (let d = 0; d < 2; d++) {
          listPending.value.push({
            tanggal: form.tanggal,
            kodeBahan: form.kodeBahan,
            namaBahan: form.namaBahan,
            barcode: newBarcode,
            panjang: form.panjang,
            lebar: form.lebar,
            gudangKode: form.gudangKode,
            isNew: true,
            qrImage: qrImage,
          });
        }
      }

      await nextTick();
      renderAllQRCodes();
      toast.success(
        `${form.qty} roll baru ditambahkan (Total: ${form.qty * 2} label stiker).`,
      );
    }
  } catch (error: any) {
    console.error("Error Generate:", error);
    toast.error("Gagal sinkronisasi nomor urut terakhir");
  } finally {
    loading.value = false;
  }
};

const handleFindOldBarcode = async () => {
  const code = form.barcodeSearchInput?.trim();
  if (!code) return;

  if (listPending.value.some((item) => item.barcode === code)) {
    toast.warning(`Barcode ${code} sudah ada di dalam antrean!`);
    form.barcodeSearchInput = "";
    return;
  }

  loading.value = true;
  try {
    const res = await api.get(`/mmt/stok-gudang/${code}`);
    const resData = res.data.data;

    if (resData && resData.data) {
      const infoStok = resData.data;

      const qrImage = await QRCode.toDataURL(infoStok.Barcode, {
        width: 300,
        margin: 0,
        errorCorrectionLevel: "M",
      });

      for (let d = 0; d < 2; d++) {
        listPending.value.push({
          barcode: infoStok.Barcode,
          kodeBahan: infoStok.Kode,
          namaBahan: infoStok.Nama_Bahan || "Material Terdaftar",
          panjang: parseFloat(infoStok.Sisa_Panjang || infoStok.Panjang || 0),
          lebar: parseFloat(infoStok.Lebar || 0),
          tanggal: infoStok.Tanggal || format(new Date(), "yyyy-MM-dd"),
          gudangKode: infoStok.Gudang || form.gudangKode,
          isNew: false,
          qrImage: qrImage,
        });
      }

      form.barcodeSearchInput = "";
      await nextTick();
      renderAllQRCodes();
      toast.success(`Barcode lama ${code} berhasil dimuat ke antrean.`);
    } else {
      toast.error("Barcode tidak ditemukan di master stok database!");
    }
  } catch (error) {
    toast.error("Gagal memuat data dari database");
  } finally {
    loading.value = false;
  }
};

const renderAllQRCodes = async () => {
  for (let i = 0; i < listPending.value.length; i++) {
    const canvas = document.getElementById(`canvas-${i}`) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, listPending.value[i].barcode, {
        width: 60,
        margin: 1,
      });
    }
  }
};

const removeItem = (index: number) => {
  listPending.value.splice(index, 1);
  nextTick(() => renderAllQRCodes());
};

const handleSaveAllNew = async () => {
  const uniqueNewItems: any[] = [];
  const map = new Map();

  for (const item of listPending.value) {
    if (item.isNew && !map.has(item.barcode)) {
      map.set(item.barcode, true);
      uniqueNewItems.push(item);
    }
  }

  if (uniqueNewItems.length === 0) {
    toast.warning("Tidak ada data baru yang perlu disimpan.");
    return;
  }

  saving.value = true;
  try {
    // Kirim field database saja, jangan kirim base64 qrImage agar payload ringan
    const payloadItems = uniqueNewItems.map(({ qrImage, ...rest }) => rest);
    await api.post("/mmt/recreate-barcode/save-batch", {
      items: payloadItems,
    });
    toast.success("Barcode baru berhasil didaftarkan ke database.");
    listPending.value.forEach((item) => (item.isNew = false));
  } catch (error: any) {
    toast.error("Gagal menyimpan data baru");
  } finally {
    saving.value = false;
  }
};

const handleValidateSave = (andNew = false) => {
  isSaveAndNew.value = andNew;
  if (totalNewItems.value === 0) {
    toast.warning("Semua item di antrean sudah tersimpan.");
    return;
  }
  showSaveDialog.value = true;
};

const handleConfirmSave = async () => {
  await handleSaveAllNew();
  showSaveDialog.value = false;
  if (isSaveAndNew.value) {
    listPending.value = [];
  }
};

const handleConfirmCancel = () => {
  showCancelDialog.value = false;
  listPending.value = [];
  toast.info("Antrean berhasil dikosongkan.");
};

const handleConfirmClose = () => {
  showCloseDialog.value = false;
  router.back();
};

const handleDownloadJpg = async () => {
  if (listPending.value.length === 0) {
    toast.warning("Tidak ada antrean label untuk di-download.");
    return;
  }

  loading.value = true;
  try {
    // Buat container tersembunyi di DOM untuk merender label yang akan di-capture
    const exportContainer = document.createElement("div");
    exportContainer.style.position = "absolute";
    exportContainer.style.left = "-9999px";
    exportContainer.style.top = "-9999px";
    exportContainer.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(exportContainer);

    const sizeNum = parseFloat(form.qrSize);
    const qrDimension = `${form.qrSize}cm`;

    let boxWidth = "70mm";
    let boxHeight = "50mm";
    let fontSizeDimens = "11pt";
    let fontSizeName = "13pt";
    let fontSizeBarcode = "8pt";

    if (sizeNum >= 5) {
      boxWidth = "95mm";
      boxHeight = "75mm";
      fontSizeDimens = "14pt";
      fontSizeName = "16pt";
      fontSizeBarcode = "10pt";
    } else if (sizeNum >= 3) {
      boxWidth = "85mm";
      boxHeight = "60mm";
      fontSizeDimens = "12pt";
      fontSizeName = "14pt";
      fontSizeBarcode = "9pt";
    }

    // Render semua item label ke dalam container tersembunyi
    exportContainer.innerHTML = listPending.value
      .map(
        (item, idx) => `
      <div id="capture-label-${idx}" style="width: ${boxWidth}; height: ${boxHeight}; padding: 3mm; box-sizing: border-box; background: white; margin-bottom: 10px;">
        <div style="border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box;">
          <div style="display: flex; gap: 10px; margin-bottom: 4px; align-items: center;">
            <img src="${item.qrImage}" style="width: ${qrDimension}; height: ${qrDimension}; object-fit: contain;" />
            <div style="display: flex; flex-direction: column; justify-content: center;">
              <div style="font-weight: bold; font-size: ${fontSizeBarcode}; word-break: break-all; font-family: monospace;">${item.barcode}</div>
              <div style="font-size: ${fontSizeDimens}; font-weight: bold; margin-top: 5px;">${item.panjang} x ${item.lebar}</div>
            </div>
          </div>
          <div style="border-top: 1pt solid black; width: 100%; margin: 4px 0;"></div>
          <div style="font-size: ${fontSizeName}; font-weight: bold; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; text-transform: uppercase;">${item.namaBahan}</div>
        </div>
      </div>
    `,
      )
      .join("");

    // Proses konversi setiap label menjadi JPG dan download otomatis
    for (let i = 0; i < listPending.value.length; i++) {
      const labelElement = document.getElementById(`capture-label-${i}`);
      if (labelElement) {
        const canvas = await html2canvas(labelElement, {
          scale: 3, // Skala tinggi agar hasil gambar tajam / tidak pecah
          useCORS: true,
        });

        const imageURL = canvas.toDataURL("image/jpeg", 0.95);

        // Buat elemen <a> virtual untuk memicu download di browser
        const downloadLink = document.createElement("a");
        downloadLink.href = imageURL;
        downloadLink.download = `Label-${listPending.value[i].barcode}.jpg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }

    // Bersihkan container tersembunyi
    document.body.removeChild(exportContainer);
    toast.success("Semua label berhasil di-download sebagai JPG!");
  } catch (error) {
    console.error("Error Export JPG:", error);
    toast.error("Gagal mengekspor label ke JPG.");
  } finally {
    loading.value = false;
  }
};

const handlePrintLayout = () => {
  if (listPending.value.length === 0) return;

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Ukuran QR & Dimensi Kotak Dinamis Berdasarkan pilihan form.qrSize
  const sizeNum = parseFloat(form.qrSize);
  const qrDimension = `${form.qrSize}cm`;

  // Menyesuaikan ukuran box & font secara proporsional berdasarkan ukuran QR
  let boxWidth = "70mm";
  let boxHeight = "50mm";
  let fontSizeDimens = "11pt";
  let fontSizeName = "13pt";
  let fontSizeBarcode = "8pt";

  if (sizeNum >= 5) {
    boxWidth = "95mm";
    boxHeight = "75mm";
    fontSizeDimens = "14pt";
    fontSizeName = "16pt";
    fontSizeBarcode = "10pt";
  } else if (sizeNum >= 3) {
    boxWidth = "85mm";
    boxHeight = "60mm";
    fontSizeDimens = "12pt";
    fontSizeName = "14pt";
    fontSizeBarcode = "9pt";
  }

  const labelHtml = listPending.value
    .map(
      (item) => `
    <div class="label-box">
      <div class="border-inner">
        <div class="top-row">
          <img src="${item.qrImage}" class="qr-img" />
          <div class="info-column">
            <div class="qr-text">${item.barcode}</div>
            <div class="dimens-text">${item.panjang} x ${item.lebar}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="product-name">${item.namaBahan}</div>
      </div>
    </div>
  `,
    )
    .join("");

  doc.open();
  doc.write(`
    <html>
      <head>
         <style>
          @page { size: 101.2mm 101mm portrait; margin: 0; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
          .label-box { width: ${boxWidth}; height: ${boxHeight}; padding: 3mm; box-sizing: border-box; }
          .label-box:nth-child(2n) { page-break-after: always; }
          .border-inner { border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; }
          .top-row { display: flex; gap: 10px; margin-bottom: 4px; align-items: center; }
          .qr-img { width: ${qrDimension}; height: ${qrDimension}; object-fit: contain; }
          .info-column { display: flex; flex-direction: column; justify-content: center; }
          .qr-text { font-weight: bold; font-size: ${fontSizeBarcode}; word-break: break-all; font-family: monospace; }
          .dimens-text { font-size: ${fontSizeDimens}; font-weight: bold; margin-top: 5px; }
          .divider { border-top: 1pt solid black; width: 100%; margin: 4px 0; }
          .product-name { font-size: ${fontSizeName}; font-weight: bold; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; text-transform: uppercase; }
        </style>
      </head>
      <body>${labelHtml}</body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.body.removeChild(iframe);
  }, 500);
};

onMounted(() => {});
</script>

<template>
  <div>
    <BaseForm
      title="Dual Barcode Generator & Reprint"
      menu-id="DUAL_BARCODE_GEN"
      icon="mdi-barcode-scan"
      :is-loading="loading"
      :is-saving="saving"
      item-name="Barcode Roll"
      v-model:show-save-dialog="showSaveDialog"
      v-model:show-cancel-dialog="showCancelDialog"
      v-model:show-close-dialog="showCloseDialog"
      @validate-save="handleValidateSave(false)"
      @confirm-save="handleConfirmSave"
      @confirm-cancel="handleConfirmCancel"
      @confirm-close="handleConfirmClose"
    >
      <template #header-actions>
        <v-btn
          size="small"
          color="orange-darken-2"
          class="mr-2 text-white"
          :disabled="totalNewItems === 0"
          :loading="saving"
          @click="handleValidateSave(false)"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconDatabasePlus :size="15" :stroke-width="1.7" />
            </span>
          </template>
          Simpan ke DB ({{ totalNewItems }})
        </v-btn>

        <v-btn
          size="small"
          color="primary"
          class="mr-2"
          :disabled="listPending.length === 0"
          @click="handlePrintLayout"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconPrinter :size="15" :stroke-width="1.7" />
            </span>
          </template>
          Cetak Label
        </v-btn>

        <v-btn
          size="small"
          color="success"
          class="mr-2"
          :disabled="listPending.length === 0"
          :loading="loading"
          @click="handleDownloadJpg"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <v-icon size="small">mdi-file-image</v-icon>
            </span>
          </template>
          Download JPG
        </v-btn>

        <v-btn
          size="small"
          variant="outlined"
          class="mx-1"
          @click="showCancelDialog = true"
        >
          Reset
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          color="error"
          @click="showCloseDialog = true"
        >
          <template #prepend>
            <span class="d-flex align-center">
              <IconX :size="15" :stroke-width="2" />
            </span>
          </template>
          Tutup
        </v-btn>
      </template>

      <!-- KOLOM KIRI (FORM INPUT & TABS) -->
      <template #left-column>
        <v-card flat class="desktop-form-section header-section pa-0">
          <v-tabs
            v-model="activeTab"
            bg-color="grey-lighten-4"
            grow
            density="compact"
          >
            <v-tab :value="0">
              <v-icon start size="small">mdi-plus-circle</v-icon> Baru
            </v-tab>
            <v-tab :value="1">
              <v-icon start size="small">mdi-database-search</v-icon> Ambil DB
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="pa-3">
            <!-- Pilihan Ukuran Cetak QR Code (Berlaku untuk semua tab cetak) -->
            <v-select
              v-model="form.qrSize"
              :items="qrSizeOptions"
              item-title="title"
              item-value="value"
              label="Ukuran Cetak QR Code"
              variant="outlined"
              density="compact"
              class="mb-3"
              hide-details
            />
            <v-divider class="mb-3" />

            <v-window-item :value="0">
              <v-text-field
                v-model="form.tanggal"
                label="Tanggal"
                type="date"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-text-field
                v-model="form.namaBahan"
                label="Cari Bahan Master"
                readonly
                variant="outlined"
                density="compact"
                class="mb-2 cursor-pointer"
                append-inner-icon="mdi-magnify"
                @click="showBahanModal = true"
              />
              <v-row dense class="mb-1">
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.panjang"
                    label="Panjang (M)"
                    type="number"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model.number="form.lebar"
                    label="Lebar (M)"
                    type="number"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
              </v-row>
              <v-text-field
                v-model.number="form.qty"
                label="Jumlah Roll Baru"
                type="number"
                variant="outlined"
                density="compact"
                class="mb-2"
              />
              <v-btn
                block
                color="success"
                size="small"
                :loading="loading"
                @click="handleGenerate"
              >
                Generate Baru
              </v-btn>
            </v-window-item>

            <v-window-item :value="1">
              <p class="text-caption text-grey-darken-1 mb-2">
                Scan atau masukkan kode barcode dari database stok untuk dicetak
                ulang tanpa menambah nomor urut baru.
              </p>
              <v-text-field
                v-model="form.barcodeSearchInput"
                label="Scan Barcode Terdaftar"
                placeholder="Scan di sini..."
                prepend-inner-icon="mdi-barcode-scan"
                variant="outlined"
                density="compact"
                color="indigo"
                autofocus
                class="mb-2"
                @keyup.enter="handleFindOldBarcode"
              />
              <v-btn
                block
                color="indigo"
                size="small"
                class="text-white"
                :loading="loading"
                :disabled="!form.barcodeSearchInput"
                @click="handleFindOldBarcode"
              >
                Ambil Dari Database
              </v-btn>
            </v-window-item>
          </v-window>
        </v-card>
      </template>

      <!-- KOLOM KANAN (TABEL ANTREAN CETAK) -->
      <template #right-column>
        <v-card border flat class="h-100 d-flex flex-column">
          <div class="scrollable-table-container flex-grow-1">
            <v-data-table
              :headers="detailHeaders"
              :items="listPending"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
              fixed-header
            >
              <template #[`item.qr`]="{ index }">
                <canvas :id="'canvas-' + index" class="mt-1"></canvas>
              </template>

              <template #[`item.barcodeInfo`]="{ item }">
                <div class="font-weight-bold">{{ item.barcode }}</div>
                <div
                  class="text-caption text-truncate"
                  style="max-width: 250px"
                >
                  {{ item.namaBahan }}
                </div>
              </template>

              <template #[`item.ukuran`]="{ item }">
                {{ item.panjang }} x {{ item.lebar }} M
              </template>

              <template #[`item.tipe`]="{ item }">
                <v-chip
                  size="x-small"
                  :color="item.isNew ? 'success' : 'indigo'"
                  variant="flat"
                  class="text-white"
                >
                  {{ item.isNew ? "BARU" : "REPRINT" }}
                </v-chip>
              </template>

              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeItem(index)"
                />
              </template>

              <template #bottom>
                <div class="pa-2 border-t d-flex align-center bg-white">
                  <span
                    class="text-caption font-weight-bold text-grey-darken-2"
                  >
                    Total Antrean: {{ listPending.length }} Label ({{
                      totalNewItems
                    }}
                    Data Baru)
                  </span>
                  <v-spacer />
                </div>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </template>
    </BaseForm>

    <MasterBahanModal
      v-if="showBahanModal"
      :is-visible="showBahanModal"
      @close="showBahanModal = false"
      @select="selectBahan"
    />
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer !important;
}

:deep(.v-data-table__td) {
  height: 35px !important;
}

.scrollable-table-container {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.scrollable-table-container :deep(.v-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
}
</style>
