<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import QRCode from "qrcode";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

// --- Interfaces ---
interface DetailKoreksi {
  Nomor: string;
  Kode: string;
  Nama_Bahan: string;
  Panjang: number;
  Lebar: number;
  Satuan: string;
  Stock: number;
  Fisik: number;
  Koreksi: number;
  List_Barcode?: string;
}

interface KoreksiStok {
  Nomor: string;
  Tanggal: string;
  Gudang: string;
  Tipe: number;
  Nama: string;
  Keterangan: string;
  Detail: DetailKoreksi[];
}

interface PrintItem {
  Nama_Bahan: string;
  qrValue: string;
  qrImage: string;
  Panjang: number;
  Lebar: number;
}

// --- Constants ---
const API_KOREKSI_STOK = "/mmt/koreksi-stok";

// --- State ---
const router = useRouter();
const masterData = ref<KoreksiStok[]>([]);
const loading = ref(false);
const selected = ref<KoreksiStok[]>([]);
const expanded = ref<string[]>([]);
const showQRDialog = ref(false);
const itemsToPrint = ref<PrintItem[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Table Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "130px" },
  { title: "Gudang", key: "Gudang", minWidth: "200px" },
  { title: "Tipe", key: "Tipe_Nama", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode", key: "Kode" },
  { title: "Nama Barang", key: "Nama_Bahan" },
  { title: "Pjg", key: "Panjang", align: "end" as const },
  { title: "Lbr", key: "Lebar", align: "end" as const },
  { title: "Satuan", key: "Satuan" },
  { title: "Sistem", key: "Stock", align: "end" as const },
  { title: "Fisik", key: "Fisik", align: "end" as const },
  { title: "Selisih", key: "Koreksi", align: "end" as const },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const { data } = await api.get(API_KOREKSI_STOK, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = data.data || data || [];
  } catch (error) {
    console.error("Gagal memuat data koreksi:", error);
  } finally {
    loading.value = false;
  }
};

const loadDetailData = async (nomor: string) => {
  const item = masterData.value.find((m) => m.Nomor === nomor);
  if (!item || (item.Detail && item.Detail.length > 0)) return;

  try {
    const { data } = await api.get(`${API_KOREKSI_STOK}/detail/${nomor}`);
    item.Detail = data.data || data;
  } catch (error) {
    console.error("Gagal memuat detail:", error);
  }
};

// Auto load detail when expanded
watch(expanded, (newExpanded) => {
  if (newExpanded.length > 0) {
    loadDetailData(newExpanded[newExpanded.length - 1]);
  }
});

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handlePrintBarcode = async () => {
  if (!isSingleSelected.value) return;
  const master = selected.value[0];

  loading.value = true;
  try {
    // 1. Pastikan detail dimuat terlebih dahulu
    await loadDetailData(master.Nomor);

    const currentItem = masterData.value.find((m) => m.Nomor === master.Nomor);
    const details = currentItem?.Detail || [];

    if (details.length === 0) {
      alert("Data detail barang tidak ditemukan.");
      return;
    }

    const tempPrintList: PrintItem[] = [];

    // 2. Proses iterasi barang
    for (const item of details) {
      if (!item.List_Barcode) continue;

      // Pecah barcode berdasarkan koma
      const barcodes = item.List_Barcode.split(",")
        .map((b) => b.trim())
        .filter(Boolean);

      for (const val of barcodes) {
        // Generate QR Code sekali saja per nilai barcode
        const qrImage = await QRCode.toDataURL(val, {
          width: 300,
          margin: 0,
          errorCorrectionLevel: "H",
        });

        // --- MODIFIKASI DI SINI: CETAK 2 KALI PER BARCODE ---
        for (let i = 0; i < 2; i++) {
          tempPrintList.push({
            Nama_Bahan: item.Nama_Bahan,
            qrValue: val,
            qrImage,
            Panjang: item.Panjang,
            Lebar: item.Lebar,
          });
        }
      }
    }

    if (tempPrintList.length === 0) {
      alert("Gagal mencetak: Barcode tidak ditemukan di database.");
      return;
    }

    itemsToPrint.value = tempPrintList;
    showQRDialog.value = true;
  } catch (e) {
    console.error("Error Cetak Barcode:", e);
    alert("Terjadi kesalahan sistem saat menyiapkan barcode.");
  } finally {
    loading.value = false;
  }
};

const printContent = () => {
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

  const labelHtml = itemsToPrint.value
    .map(
      (item) => `
    <div class="label-box">
      <div class="border-inner">
        <div class="top-row">
          <img src="${item.qrImage}" class="qr-img" />
          <div class="info-column">
            <div class="qr-text">${item.qrValue}</div>
            <div class="dimens-text">${item.Panjang} x ${item.Lebar}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="product-name">${item.Nama_Bahan}</div>
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
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
          align-items: center;      /* Mengetengahkan secara horizontal */
            justify-content: center;   /* Mengetengahkan secara vertikal */
            min-height: 100vh; }
          .label-box { width: 70mm; height: 50mm; padding: 3mm; box-sizing: border-box; }
          .label-box:nth-child(2n) { page-break-after: always; }
          .border-inner { border: 1pt solid black; height: 100%; width: 100%; padding: 2mm; display: flex; flex-direction: column; box-sizing: border-box; }
          .top-row { display: flex; gap: 10px; margin-bottom: 4px;  }
          .qr-img { width: 1.5cm; height: 1.5cm; }
          .qr-text { font-weight: bold; font-size: 8pt; word-break: break-all; }
          .dimens-text { font-size: 11pt; font-weight: bold; margin-top: 5px; }
          .divider { border-top: 1pt solid black; width: 100%; margin: 4px 0; }
          .product-name { font-size: 13pt; font-weight: bold; text-align: center; flex-grow: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
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

const handlePrintSlip = () => {
  if (!isSingleSelected.value) return;
  window.open(`/print/koreksi-stok/${selected.value[0].Nomor}`, "_blank");
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Yakin ingin menghapus data koreksi ${nomor}?`)) return;

  loading.value = true;
  try {
    await api.delete(`${API_KOREKSI_STOK}/${nomor}`);
    alert("Hapus data Sukses.");
    fetchData();
  } catch (error: any) {
    alert(
      "Hapus data Gagal: " + (error.response?.data?.message || "Server Error"),
    );
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Browse Koreksi Stok MMT" icon="mdi-package-variant-closed">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        variant="elevated"
        @click="router.push({ name: 'KoreksiStokNew' })"
      >
        <v-icon start size="small">mdi-plus</v-icon> Tambah Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="teal"
        variant="elevated"
        :disabled="!isSingleSelected"
        :loading="loading"
        @click="handlePrintBarcode"
        class="mr-2"
      >
        <v-icon start size="small">mdi-barcode-scan</v-icon> Cetak Barcode
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        variant="elevated"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start size="small">mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        variant="elevated"
        :disabled="!isSingleSelected"
        @click="handleDelete"
        class="ml-2"
      >
        <v-icon start size="small">mdi-delete</v-icon> Hapus
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-2 border">
        <v-card-text class="pa-3 d-flex align-center flex-wrap ga-3">
          <DateRangeFilter
            v-model:start-date="startDate"
            v-model:end-date="endDate"
          />
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            @click="fetchData"
            :loading="loading"
            prepend-icon="mdi-refresh"
            >Refresh</v-btn
          >
        </v-card-text>
      </v-card>

      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading"
        item-value="Nomor"
        density="compact"
        show-select
        select-strategy="single"
        show-expand
        hover
        @click:row="handleRowClick"
        class="elevation-1 border custom-grid"
      >
        <template #item.Tanggal="{ item }">
          <div class="text-no-wrap">{{ item.Tanggal }}</div>
        </template>
        <template #item.Nomor="{ item }">
          <span class="text-primary font-weight-bold">{{ item.Nomor }}</span>
        </template>

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card variant="outlined" class="bg-white">
                <v-card-title class="text-subtitle-2 py-2 bg-grey-lighten-5">
                  <v-icon size="small" color="primary" class="mr-2"
                    >mdi-format-list-bulleted</v-icon
                  >
                  Rincian Barang ({{ item.Nomor }})
                </v-card-title>
                <v-divider />
                <v-data-table
                  :headers="detailHeaders"
                  :items="item.Detail || []"
                  density="compact"
                  hide-default-footer
                >
                  <template #item.Koreksi="{ item: detail }">
                    <v-chip
                      size="x-small"
                      :color="detail.Koreksi < 0 ? 'error' : 'success'"
                      label
                      class="font-weight-bold"
                    >
                      {{
                        detail.Koreksi > 0
                          ? "+" + detail.Koreksi
                          : detail.Koreksi
                      }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>

    <v-dialog
      v-model="showQRDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card color="grey-lighten-4">
        <v-toolbar color="primary" density="compact">
          <v-btn icon @click="showQRDialog = false"
            ><v-icon>mdi-close</v-icon></v-btn
          >
          <v-toolbar-title
            >Preview Cetak ({{ itemsToPrint.length }} Label)</v-toolbar-title
          >
          <v-spacer />
          <v-btn
            color="white"
            variant="elevated"
            prepend-icon="mdi-printer"
            @click="printContent"
            >PRINT SEKARANG</v-btn
          >
        </v-toolbar>
        <v-card-text class="d-flex flex-column align-center pa-4">
          <div class="preview-wrapper">
            <div
              v-for="(item, index) in itemsToPrint"
              :key="index"
              class="label-box bg-white mb-4"
            >
              <div class="border-inner">
                <div class="top-row">
                  <img :src="item.qrImage" class="qr-img" />
                  <div class="info-column">
                    <div class="qr-text">{{ item.qrValue }}</div>
                    <div class="dimens-text">
                      Dimensi: {{ item.Panjang }}x{{ item.Lebar }}
                    </div>
                  </div>
                </div>
                <div class="divider"></div>
                <div class="product-name">{{ item.Nama_Bahan }}</div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<style scoped>
.preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.label-box {
  width: 7cm;
  height: 5cm;
  padding: 2mm;
  box-sizing: border-box;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.border-inner {
  border: 1px solid black;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2mm;
}
.top-row {
  display: flex;
  gap: 10px;
}
.qr-img {
  width: 1.5cm;
  height: 1.5cm;
}
.qr-text {
  font-weight: bold;
  font-size: 8pt;
  word-break: break-all;
}
.dimens-text {
  font-size: 9pt;
  font-weight: bold;
  margin-top: 5px;
}
.divider {
  border-top: 1px dashed #000;
  margin: 2mm 0;
}
.product-name {
  font-size: 11pt;
  font-weight: bold;
  text-align: center;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  line-height: 1.2;
}
</style>
