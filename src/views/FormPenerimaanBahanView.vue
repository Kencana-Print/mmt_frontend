<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Penerimaan Bahan'"
    menu-id="mmt-penerimaan-bahan"
    icon="mdi-truck-check"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="validateBeforeSave(false)"
        :loading="isSaving"
        :disabled="isSaving"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="small"
        color="success"
        @click="validateBeforeSave(true)"
        :disabled="isSaving"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn
        size="small"
        color="teal"
        @click="printSlip"
        :disabled="!formData.nomor || formData.nomor === 'AUTO'"
      >
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        class="mx-2"
        @click="showCancelDialog = true"
      >
        Batal
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        color="error"
        @click="showCloseDialog = true"
      >
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <template #left-column>
        <v-card class="desktop-form-section" flat border>
          <v-card-title class="text-subtitle-1">Data Header</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor Transaksi"
                  v-model="formData.nomor"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Gudang"
                  :model-value="`${formData.gudangKode} - ${formData.gudang}`"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  @click="openGudangLookup"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nomor PO/Minta"
                  v-model="formData.noPermintaan"
                  readonly
                  @click="openPOLookup"
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  label="Kode Supplier"
                  v-model="formData.supplierKode"
                  readonly
                  @click="openSupplierSearch"
                  variant="outlined"
                  density="compact"
                  hide-details
                  append-inner-icon="mdi-magnify"
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  label="Nama Supplier"
                  v-model="formData.supplier"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nomor Resi"
                  v-model="formData.no_resi"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="Masukkan No. Resi pengiriman"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan"
                  v-model="formData.keterangan"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
    </template>

    <template #right-column>
      <v-card border flat class="d-flex flex-column fill-height">
          <v-data-table
            :headers="detailHeaders"
            :items="formData.details"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            fixed-header
            height="calc(100vh - 220px)"
            class="form-table"
          >
            <template #[`item.namaBahan`]="{ item }">
              <div class="text-truncate" style="max-width: 300px">
                {{ item.namaBahan }}
              </div>
            </template>

            <template #[`item.kode`]="{ item, index }">
              <v-text-field
                v-model="item.kode"
                @click="openBahanSearch(index)"
                readonly
                density="compact"
                variant="plain"
                hide-details
                append-inner-icon="mdi-magnify"
              />
            </template>

            <template #[`item.qtyTerima`]="{ item }">
              <v-text-field
                v-model.number="item.qtyTerima"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.panjang`]="{ item }">
              <v-text-field
                v-model.number="item.panjang"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.lebar`]="{ item }">
              <v-text-field
                v-model.number="item.lebar"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                @click="removeDetail(index)"
                :disabled="formData.details.length === 1"
              />
            </template>

            <template #bottom>
              <div class="pa-2 border-t">
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addDetail"
                  >Tambah Baris</v-btn
                >
              </div>
            </template>
          </v-data-table>
        </v-card>
    </template>
  </BaseForm>

    <v-dialog v-model="showPrintSelection" max-width="500px" persistent
      >...</v-dialog
    >
    <v-dialog
      v-model="showBarcodePreview"
      fullscreen
      persistent
      transition="dialog-bottom-transition"
      >...</v-dialog
    >
    <SupplierLookupModal
      v-if="isModalVisible"
      :isVisible="isModalVisible"
      @close="closeModal"
      @select="handleSupplierSelect"
    />
    <GudangLookupModal
      v-if="isGudangModalVisible"
      :isVisible="isGudangModalVisible"
      @close="closeGudangLookup"
      @select="handleGudangSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanMMTModalVisible"
      mode="mmt"
      @close="closeBahanMMTModal"
      @select="handleBahanSelect"
    />
    <POLookupModal
      v-if="isPOLookupVisible"
      :isVisible="isPOLookupVisible"
      @close="closePOLookup"
      @select="handlePOSelect"
    />
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import QRCode from "qrcode";

import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import POLookupModal from "@/modal/POLookupModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import BaseForm from "@/components/BaseForm.vue";

interface DetailItem {
  kode: string;
  namaBahan: string;
  qtyPO: number;
  sudahTerima: number;
  qtyTerima: number;
  panjang: number;
  lebar: number;
  satuan: string;
  keterangan: string;

  harga?: number; // ✅ HIDDEN FIELD
}

const createEmptyDetail = (): DetailItem => ({
  kode: "",
  namaBahan: "",
  qtyPO: 0,
  sudahTerima: 0,
  qtyTerima: 0,
  panjang: 0,
  lebar: 0,
  satuan: "",
  keterangan: "",
  harga: 0,
});

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_BASE_URL = "/mmt/penerimaan-bahan";
const API_SUPPLIER_DETAIL = "/supplier";
const API_PO_LOOKUP_DETAIL = "/mmt/po-bahan-mmt/po/lookup";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isModalVisible = ref(false);
const isBahanMMTModalVisible = ref(false);
const isPOLookupVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);

const showPrintSelection = ref(false);
const showBarcodePreview = ref(false);
const savedNomor = ref("");
const printSelectionItems = ref<DetailItem[]>([]);
const selectedForBarcode = ref<string[]>([]);
const itemsToRender = ref<any[]>([]);
const lastSaveAndNew = ref(false);
const dbBarcodes = ref<any[]>([]);

const isGudangModalVisible = ref(false);

const formData = reactive({
  nomor: (route.params.nomor as string) || "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  supplier: "",
  supplierKode: "",
  alamat: "",
  telp: "",
  gudang: "GUDANG UTAMA MMT",
  gudangKode: "WH-16",
  noPermintaan: "",
  no_resi: "",
  keterangan: "",
  details: [createEmptyDetail()],
});

const detailHeaders = [
  { title: "Kode", key: "kode", width: "120px", sortable: false },
  { title: "Nama Barang", key: "namaBahan", sortable: false }, // WIDTH DIHAPUS agar fleksibel
  { title: "Qty PO", key: "qtyPO", width: "90px", align: "end" as const },
  {
    title: "Sudah Terima",
    key: "sudahTerima",
    width: "105px",
    align: "end" as const,
  },
  {
    title: "Qty Terima Sekarang",
    key: "qtyTerima",
    width: "125px",
    align: "end" as const,
  },
  { title: "Panjang", key: "panjang", width: "100px", align: "end" as const },
  { title: "Lebar", key: "lebar", width: "100px", align: "end" as const },
  {
    title: "Aksi",
    key: "actions",
    width: "50px",
    sortable: false,
    align: "center" as const,
  },
];

const validateBeforeSave = (saveAndNew: boolean) => {
  // Filter detail yang valid (memiliki kode barang dan qty terima > 0)
  const validDetails = formData.details.filter(
    (d) => d.kode && Number(d.qtyTerima) > 0,
  );

  if (!formData.supplierKode || validDetails.length === 0) {
    toast.error("Data belum lengkap.");
    return;
  }

  lastSaveAndNew.value = saveAndNew;
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  isSaving.value = true;

  // Filter detail yang valid (memiliki kode barang dan qty terima > 0)
  const validDetails = formData.details.filter(
    (d) => d.kode && Number(d.qtyTerima) > 0,
  );

  if (!formData.supplierKode || validDetails.length === 0) {
    toast.error("Data belum lengkap.");
    isSaving.value = false;
    return;
  }

  try {
    const res = await api.post(API_BASE_URL, {
      header: {
        nomor: formData.nomor,
        tanggal: formData.tanggal,
        supplier_kode: formData.supplierKode,
        gudang_kode: formData.gudangKode,
        no_permintaan: formData.noPermintaan,
        no_resi: formData.no_resi,
        keterangan: formData.keterangan,
      },
      details: validDetails.map((d) => ({
        kode: d.kode,
        satuan: d.satuan,
        qtyPO: Number(d.qtyPO || 0),
        qtyTerima: Number(d.qtyTerima || 0),

        // 🔥 PERBAIKAN UTAMA: Ambil d.harga yang sudah didapat dari state form/PO
        // Jika d.harga null/undefined, dia akan cek fallback ke field alternatif sebelum jadi 0
        harga: Number(d.harga ?? d.Harga_PO ?? d.hargaPO ?? 0),

        keterangan: d.keterangan || "",
        panjang: Number(d.panjang || 0),
        lebar: Number(d.lebar || 0),
      })),
      isEditMode: isEditMode.value,
    });

    const newNomor = res.data.data?.Nomor || formData.nomor;
    toast.success("Berhasil disimpan!");
    savedNomor.value = newNomor;

    // ================= BARCODE =================
    const resBarcode = await api.get(`${API_BASE_URL}/barcodes/${newNomor}`);

    if (resBarcode.data && resBarcode.data.data) {
      dbBarcodes.value = resBarcode.data.data;

      // 🔥 hanya item satuan ROLL
      const rollItems = validDetails.filter(
        (d) => (d.satuan || "").toUpperCase() === "ROLL",
      );

      if (rollItems.length > 0 && dbBarcodes.value.length > 0) {
        printSelectionItems.value = JSON.parse(JSON.stringify(rollItems));
        selectedForBarcode.value = rollItems.map((d) => d.kode);
        showPrintSelection.value = true;
      } else {
        // tidak ada barcode yang perlu dicetak
        handleAfterPrint();
      }
    } else {
      toast.warning("Transaksi berhasil, tapi barcode gagal diambil.");
      handleAfterPrint();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal simpan.");
  } finally {
    isSaving.value = false;
  }
};

const resetForm = () => {
  Object.assign(formData, {
    nomor: (route.params.nomor as string) || "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    supplier: "",
    supplierKode: "",
    alamat: "",
    telp: "",
    gudang: "GUDANG UTAMA MMT",
    gudangKode: "WH-16",
    noPermintaan: "",
    no_resi: "",
    keterangan: "",
    details: [createEmptyDetail()],
  });
};

const executeCancel = () => {
  showCancelDialog.value = false;
  resetForm();
  toast.info("Form direset.");
};

const executeClose = () => {
  showCloseDialog.value = false;
  closeForm();
};

const openGudangLookup = () => {
  isGudangModalVisible.value = true;
};

const closeGudangLookup = () => {
  isGudangModalVisible.value = false;
};

const handleGudangSelect = (g: any) => {
  // Mapping field sesuai response dari modal/API gudang Anda
  // Biasanya menggunakan properti 'Kode' dan 'Nama'
  formData.gudangKode = g.Kode || g.kode;
  formData.gudang = g.Nama || g.nama;
  closeGudangLookup();
};

const generateAndShowBarcodes = async () => {
  if (dbBarcodes.value.length === 0) return;
  const temp: any[] = [];
  const filtered = dbBarcodes.value.filter((b) =>
    selectedForBarcode.value.includes(b.kode),
  );

  if (filtered.length === 0) {
    toast.warning("Pilih item untuk dicetak.");
    return;
  }

  filtered.forEach((item) => {
    const detailInfo = formData.details.find((d) => d.kode === item.kode);
    for (let i = 0; i < 2; i++) {
      temp.push({
        namaBahan: item.namaBahan,
        qrValue: item.barcode,
        panjang: detailInfo?.panjang || 0,
        lebar: detailInfo?.lebar || 0,
      });
    }
  });

  itemsToRender.value = temp;
  showPrintSelection.value = false;
  showBarcodePreview.value = true;

  await nextTick();
  for (let i = 0; i < itemsToRender.value.length; i++) {
    const canvas = document.getElementById("canvas-" + i) as HTMLCanvasElement;
    if (canvas) {
      await QRCode.toCanvas(canvas, itemsToRender.value[i].qrValue, {
        width: 85,
        margin: 0,
      });
    }
  }
};

const printNow = () => {
  window.print();
  setTimeout(() => {
    showBarcodePreview.value = false;
    handleAfterPrint();
  }, 1000);
};

const printSlip = () => {
  if (!formData.nomor || formData.nomor === "AUTO") return;
  const url = router.resolve({
    name: "PenerimaanBahanPrint",
    params: { nomor: formData.nomor },
  }).href;
  window.open(url, "_blank");
};

const handleAfterPrint = () => {
  if (lastSaveAndNew.value) {
    Object.assign(formData, {
      nomor: "AUTO",
      no_resi: "",
      keterangan: "",
      details: [createEmptyDetail()],
    });
    showPrintSelection.value = false;
    showBarcodePreview.value = false;
  } else {
    router.push({ name: "PenerimaanBahanBrowse" });
  }
};

const openSupplierSearch = () => (isModalVisible.value = true);
const closeModal = () => (isModalVisible.value = false);
const handleSupplierSelect = async (s: any) => {
  const res = await api.get(`${API_SUPPLIER_DETAIL}/${s.Kode}`);
  const d = res.data.data;
  formData.supplierKode = d.Kode;
  formData.supplier = d.Nama;
  closeModal();
};

const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isBahanMMTModalVisible.value = true;
};
const closeBahanMMTModal = () => (isBahanMMTModalVisible.value = false);
const handleBahanSelect = (b: any) => {
  if (currentDetailIndex.value === null) return;
  const item = formData.details[currentDetailIndex.value];
  item.kode = b.Kode;
  item.namaBahan = b.Nama;
  item.satuan = b.Satuan;
  item.panjang = b.Panjang;
  item.lebar = b.Lebar;
  if (formData.details[formData.details.length - 1].kode) addDetail();
  closeBahanMMTModal();
};

const openPOLookup = () => (isPOLookupVisible.value = true);
const closePOLookup = () => (isPOLookupVisible.value = false);
const handlePOSelect = async (po: any) => {
  try {
    const res = await api.get(`${API_PO_LOOKUP_DETAIL}/${po.Nomor}`);
    const d = res.data.data;

    if (d && d.header) {
      // 1. Set Header Data
      formData.noPermintaan = d.header.Nomor;
      formData.supplierKode = d.header.Kode_Supplier;

      // Karena di JSON header tidak ada nama supplier, kita fetch manual
      if (d.header.Kode_Supplier) {
        await fetchSupplierName(d.header.Kode_Supplier);
      }

      // 2. Set Detail Barang (Mapping sesuai JSON response)
      if (d.details && d.details.length > 0) {
        formData.details = d.details.map((x: any) => {
          const qtyPO = Number(x.jumlah || 0);
          const sudahTerima = Math.min(
            qtyPO,
            Math.max(
              Number(x.sudah_terima ?? 0),
              Number(x.qty_terima_po ?? 0),
            ),
          );
          const sisaTerima = Math.max(0, qtyPO - sudahTerima);

          return {
            kode: x.kode, // Sesuai JSON: "kode"
            namaBahan: x.nama, // Sesuai JSON: "nama"
            qtyPO, // Sesuai JSON: "jumlah"
            sudahTerima,
            // Default qty terima sekarang = Qty PO - yang sudah diterima
            qtyTerima: Number(sisaTerima.toFixed(4)),
            panjang: Number(x.panjang || 0),
            lebar: Number(x.lebar || 0),
            satuan: x.satuan || "",
            keterangan: x.spk ? `SPK: ${x.spk}` : "", // Tambahan info SPK jika ada
            harga: Number(x.harga || x.harga_po || x.pod_harga || 0),
          };
        });
      }
    }
    closePOLookup();
  } catch (error) {
    console.error("Error PO Select:", error);
    toast.error("Gagal memuat detail PO");
  }
};

// Fungsi tambahan untuk mengambil nama supplier berdasarkan kode
const fetchSupplierName = async (kode: string) => {
  try {
    const res = await api.get(`${API_SUPPLIER_DETAIL}/${kode}`);
    if (res.data && res.data.data) {
      formData.supplier = res.data.data.Nama || res.data.data.nama;
    }
  } catch (error) {
    console.error("Gagal mengambil nama supplier:", error);
  }
};

const closeForm = () => router.push({ name: "PenerimaanBahanBrowse" });
const addDetail = () => formData.details.push(createEmptyDetail());
const removeDetail = (i: number) => formData.details.splice(i, 1);
</script>

<style scoped>
/* Memastikan input teks rata kanan untuk angka */
.text-right-input :deep(input) {
  text-align: right !important;
}

/* Mengatur tinggi baris tabel agar ramping */
.form-table :deep(.v-data-table__td) {
  height: 32px !important;
}

/* Paksa tabel mengambil 100% ruang */
.form-table :deep(.v-table) {
  width: 100%;
}

/* STYLE LABEL BARCODE SESUAI GAMBAR 2 (HORIZONTAL) */
.barcode-label-box {
  background: white;
  width: 320px;
  border: 1px solid #000;
  margin-bottom: 15px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.label-top-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.qr-container {
  width: 85px;
  height: 85px;
}

.text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.barcode-text {
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 14px;
}

.dimensi-text {
  font-size: 12px;
  margin-top: 4px;
}

.label-divider {
  border-top: 1px dashed #000;
  margin: 8px 0;
}

.label-bottom-section {
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
}

/* CSS PRINT AREA */
@media print {
  body * {
    visibility: hidden !important;
  }
  #print-area,
  #print-area * {
    visibility: visible !important;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  .barcode-label-box {
    border: 1px solid #000 !important;
    page-break-inside: avoid;
    margin: 10px auto;
  }
  .v-toolbar,
  .v-btn {
    display: none !important;
  }
}
</style>
