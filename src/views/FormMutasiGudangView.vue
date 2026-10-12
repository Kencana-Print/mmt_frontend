<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import PermintaanLookupModal from "@/modal/PermintaanProduksiLookupModal.vue";

interface DetailItem {
  barcode: string;
  sku: string;
  Nama_Bahan: string;
  qty: number;
  satuan: string;
  Panjang: number;
  Lebar: number;
  keterangan: string;
  operator: string;
  spk: string;
  stok: number;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
  Stok: number;
}

interface FormDataState {
  nomor: string;
  permintaanNomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  lokasiProduksiKode: string;
  lokasiProduksiNama: string;
  keteranganHeader: string;
  detail: DetailItem[];
  detailPermintaan: any[];
  detailRealisasi: DetailItem[];
}

// --- Setup ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

const API_URL_PERMINTAAN = "/mmt/permintaan-produksi-bahan";
const API_URL_REALISASI = "/mmt/permintaan-produksi";
const API_URL_MUTASI = "/mmt/mutasi-gudang";

// --- State ---
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isLokasiProdModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const isPermintaanModalVisible = ref(false);

// Template Refs untuk Auto Focus
const barcodeInputs = ref<any[]>([]);

const createEmptyDetail = (): DetailItem => ({
  barcode: "",
  sku: "",
  Nama_Bahan: "",
  qty: 0,
  satuan: "",
  Panjang: 0,
  Lebar: 0,
  keterangan: "",
  operator: "",
  spk: "",
  stok: 0,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  permintaanNomor: "",
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  lokasiProduksiKode: "GPM",
  lokasiProduksiNama: "Gudang Produksi",
  keteranganHeader: "",
  detail: [createEmptyDetail()],
  detailPermintaan: [],
  detailRealisasi: [createEmptyDetail()],
});

// --- Focus Logic ---
const setBarcodeRef = (el: any, index: number) => {
  if (el) barcodeInputs.value[index] = el;
};

const focusNextBarcode = async (currentIndex: number) => {
  await nextTick(); // Tunggu baris baru dirender jika ada
  const nextIndex = currentIndex + 1;
  if (barcodeInputs.value[nextIndex]) {
    barcodeInputs.value[nextIndex].focus();
  }
};

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail
    .reduce((sum, d) => sum + (Number(d.qty) || 0), 0)
    .toFixed(2);
});

const isFormValid = computed(() => {
  const isHeaderValid = !!formData.gudangKode && !!formData.lokasiProduksiKode;
  const isDetailValid = formData.detail.some((d) => d.sku && d.qty > 0);
  return isHeaderValid && isDetailValid;
});

const detailHeaders = [
  { title: "No.", key: "index", width: "50px", sortable: false },
  { title: "Barcode / SKU", key: "sku", width: "180px" },
  { title: "Nama Bahan", key: "Nama_Bahan", sortable: false, width: "250px" },
  { title: "Qty Minta", key: "qty", width: "100px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Panjang", key: "Panjang", width: "80px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "80px", align: "end" as const },
  { title: "No. SPK", key: "spk", width: "150px" },
  { title: "Stok", key: "stok", width: "80px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", width: "150px", sortable: false },
  { title: "", key: "actions", width: "50px", sortable: false },
] as const;

// --- Methods ---
const refreshData = async () => {
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    keteranganHeader: "",
    detail: [createEmptyDetail()],
  });
  isEditMode.value = false;
};

const addDetail = () => formData.detail.push(createEmptyDetail());

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
    barcodeInputs.value.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

// frontend - <script setup>
const openPermintaanSearch = () => {
  isPermintaanModalVisible.value = true;
};

const handlePermintaanSelect = async (permintaan: any) => {
  isPermintaanModalVisible.value = false;
  isSaving.value = true;
  try {
    // Ambil detail lengkap permintaan berdasarkan nomor
    const res = await api.get(`${API_URL_PERMINTAAN}/${permintaan.Nomor}`);
    const data = res.data.data || res.data;

    if (data) {
      // 1. Sinkronisasi Header
      formData.permintaanNomor = data.Nomor;

      // DISINI POIN UTAMANYA:
      // Mapping "GudangKode" dari API ke "gudangKode" di Form Asal
      formData.gudangKode = data.GudangKode || data.Gudang || "";

      // Update Nama Gudang secara otomatis untuk tampilan
      if (formData.gudangKode === "WH-20") {
        formData.gudangNama = "Gudang Obat/Tinta";
      } else if (formData.gudangKode === "WH-16") {
        formData.gudangNama = "Gudang Bahan MMT";
      } else {
        formData.gudangNama = data.GudangNama || "Gudang Lainnya";
      }

      // 2. Masukkan ke Tabel Referensi (Daftar Item yang Diminta)
      formData.detailPermintaan = data.Details || [];

      // 3. Reset tabel Scan Realisasi (Bawah)
      // Kita siapkan satu baris kosong untuk mulai scan
      formData.detail = [createEmptyDetail()];

      toast.success(`Berhasil menarik data dari ${formData.gudangKode}`);
    }
  } catch (error) {
    console.error("Error loading permintaan detail:", error);
    toast.error("Gagal memuat detail permintaan.");
  } finally {
    isSaving.value = false;
  }
};

const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.detail[index];
  const barcodeValue = targetItem.barcode.trim();

  if (!barcodeValue) return;

  if (!formData.gudangKode) {
    toast.error("Silahkan pilih Gudang Asal terlebih dahulu.");
    targetItem.barcode = "";
    return;
  }

  // 1. Validasi duplikasi scan di tabel
  const isDuplicate = formData.detail.some(
    (d, i) => d.barcode === barcodeValue && i !== index,
  );

  if (isDuplicate) {
    toast.warning(`Barcode ${barcodeValue} sudah di-scan.`);
    targetItem.barcode = "";
    return;
  }

  try {
    const response = await api.get(
      `${API_URL_REALISASI}/stok-barcode/${encodeURIComponent(barcodeValue)}`,
      { params: { gudang: formData.gudangKode } },
    );

    const bahan = response.data.data;

    if (!bahan) {
      toast.error(`Barcode ${barcodeValue} tidak ditemukan.`);
      targetItem.barcode = "";
      return;
    }

    const matchIndex = formData.detail.findIndex(
      (d) => d.sku === bahan.Kode && (!d.barcode || d.barcode === ""),
    );

    if (matchIndex !== -1) {
      const matchedRow = formData.detail[matchIndex];

      matchedRow.barcode = bahan.Barcode;
      matchedRow.Nama_Bahan = bahan.Nama_Bahan;
      matchedRow.satuan = bahan.Satuan;

      // DISINI PERBAIKANNYA:
      matchedRow.Panjang = Number(bahan.Panjang); // Ini akan jadi 4.5
      matchedRow.Lebar = Number(bahan.Lebar);
      matchedRow.stok = Number(bahan.Stok);

      // Qty tetap 1 sesuai permintaanmu
      matchedRow.qty = 1;

      if (index !== matchIndex) {
        targetItem.barcode = "";
      }

      toast.success(`Barcode cocok! Sisa: ${bahan.Panjang}m`);
      focusNextBarcode(index - 1);
    } else {
      // Untuk item di luar daftar permintaan
      targetItem.barcode = bahan.Barcode;
      targetItem.sku = bahan.Kode;
      targetItem.Nama_Bahan = bahan.Nama_Bahan;
      targetItem.satuan = bahan.Satuan;
      targetItem.Panjang = Number(bahan.Panjang);
      targetItem.Lebar = Number(bahan.Lebar);
      targetItem.stok = Number(bahan.Stok);

      // Qty tetap 1
      targetItem.qty = 1;

      targetItem.spk =
        bahan.Nomor_SPK && bahan.Nomor_SPK !== "0" ? bahan.Nomor_SPK : "";

      if (index === formData.detail.length - 1) {
        addDetail();
      }
      focusNextBarcode(index);
    }
  } catch (err: any) {
    toast.error("Gagal verifikasi barcode.");
    targetItem.barcode = "";
  }
};

// --- State Tambahan ---
const isMasterBahanVisible = ref(false); // Modal untuk cari bahan manual

// --- Methods Baru ---
const openBahanSearch = (index: number) => {
  currentDetailIndex.value = index;
  isMasterBahanVisible.value = true;
};

const handleBahanSelect = (bahan: any) => {
  if (currentDetailIndex.value === null) return;

  const targetItem = formData.detail[currentDetailIndex.value];

  // Set data dari modal master bahan
  targetItem.sku = bahan.Kode;
  targetItem.barcode = bahan.Barcode || bahan.Kode; // Jika tdk ada barcode, pakai Kode
  targetItem.Nama_Bahan = bahan.Nama;
  targetItem.satuan = bahan.Satuan;
  targetItem.Panjang = Number(bahan.Panjang || 0);
  targetItem.Lebar = Number(bahan.Lebar || 0);
  targetItem.stok = Number(bahan.Stok || 0);
  targetItem.qty = 1;

  isMasterBahanVisible.value = false;

  // Jika ini baris terakhir, tambahkan baris baru otomatis
  if (currentDetailIndex.value === formData.detail.length - 1) {
    addDetail();
  }
};

const saveForm = async (saveAndNew: boolean) => {
  isSaving.value = true;

  const validDetails = formData.detail.filter(
    (d) => d.barcode.trim() !== "" && d.qty > 0,
  );

  if (validDetails.length === 0) {
    toast.error("Minimal satu item barcode harus diisi dengan benar.");
    isSaving.value = false;
    return;
  }

  const barcodeSet = new Set();
  for (const item of validDetails) {
    if (barcodeSet.has(item.barcode)) {
      toast.error(`Barcode ${item.barcode} diinput dua kali.`);
      isSaving.value = false;
      return;
    }
    barcodeSet.add(item.barcode);
  }

  try {
    const payload = {
      Nomor: formData.nomor,
      Tanggal: formData.tanggal,
      GudangAsal: formData.gudangKode,
      GudangTujuan: formData.lokasiProduksiKode,
      Keterangan: formData.keteranganHeader,
      Type: 2, // Sesuaikan dengan angka tipe kemarin

      Details: validDetails.map((d) => ({
        kode_barang: d.sku,
        qty: Number(d.qty),

        // Data roll per-barcode agar tersimpan lengkap di tmasterstok_mmt
        barcode: d.barcode,
        panjang: Number(d.Panjang) || 0,
        lebar: Number(d.Lebar) || 0,
        spk: d.spk || "",
        satuan: d.satuan || "",

        // PERBAIKAN: Isi dengan format tanggal hari ini (yyyy-MM-dd)
        expired: format(new Date(), "yyyy-MM-dd"),

        keterangan: d.keterangan,
      })),
      isUpdate: isEditMode.value,
    };
    // Tembak ke endpoint /mmt/mutasi-gudang
    const response = await api.post(API_URL_MUTASI, payload);

    toast.success(response.data.message || "Data mutasi berhasil disimpan.");

    if (saveAndNew) {
      await refreshData();
    } else {
      router.push({ name: "MutasiGudangBrowse" });
    }
  } catch (error: any) {
    console.error("Save Error:", error.response?.data);
    const errorMsg =
      error.response?.data?.error || error.response?.data?.message;
    toast.error(errorMsg || "Terjadi kesalahan saat menyimpan data mutasi.");
  } finally {
    isSaving.value = false;
  }
};

// --- Lookup Handlers ---
const openGudangAsalSearch = () => {
  isGudangModalVisible.value = true;
};
const handleGudangAsalSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const openGudangProdSearch = () => {
  isLokasiProdModalVisible.value = true;
};
const handleGudangProdSelect = (gudang: any) => {
  formData.lokasiProduksiKode = gudang.Kode;
  formData.lokasiProduksiNama = gudang.Nama;
  isLokasiProdModalVisible.value = false;
};

const openSPKSearch = (index: number) => {
  currentDetailIndex.value = index;
  isSPKModalVisible.value = true;
};
const handleSPKSelect = (spk: any) => {
  if (currentDetailIndex.value !== null) {
    formData.detail[currentDetailIndex.value].spk = spk.Spk;
  }
  isSPKModalVisible.value = false;
};

onMounted(() => {
  if (!isEditMode.value) refreshData();
});
</script>

<template>
  <PageLayout title="Form Permintaan Bahan MMT" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>
      <v-btn
        size="small"
        color="success"
        @click="saveForm(true)"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>
      <v-btn size="small" color="teal" :disabled="formData.nomor === 'AUTO'">
        <v-icon start>mdi-print</v-icon> Cetak Slip
      </v-btn>
      <v-btn size="small" @click="router.back()">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card class="desktop-form-section mb-4" flat border>
          <v-card-title class="text-subtitle-1 pb-0">Data Header</v-card-title>
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
                  label="Gudang Asal"
                  v-model="formData.gudangKode"
                  @click="!formData.permintaanNomor && openGudangAsalSearch()"
                  :append-inner-icon="
                    !formData.permintaanNomor ? 'mdi-magnify' : ''
                  "
                  variant="outlined"
                  density="compact"
                  hide-details
                  :readonly="!!formData.permintaanNomor"
                  :filled="!!formData.permintaanNomor"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gudangNama"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Lokasi Produksi"
                  v-model="formData.lokasiProduksiKode"
                  @click="openGudangProdSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  readonly
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Lokasi"
                  v-model="formData.lokasiProduksiNama"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Cari Dokumen Permintaan"
                  v-model="formData.permintaanNomor"
                  placeholder="Klik untuk tarik data..."
                  readonly
                  @click="openPermintaanSearch"
                  append-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="primary"
                  persistent-placeholder
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  label="Keterangan Header"
                  v-model="formData.keteranganHeader"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Total QTY"
                  :model-value="calculatedTotal"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                  class="text-right-input"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card class="mb-4" elevation="1" rounded="lg" border>
          <v-toolbar color="blue-darken-2" density="compact" flat>
            <v-icon start class="ml-4">mdi-clipboard-list-outline</v-icon>
            <v-toolbar-title class="text-body-2 font-weight-bold">
              Daftar Item yang Diminta
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip
              size="x-small"
              color="white"
              variant="flat"
              class="mr-4 text-primary font-weight-bold"
            >
              {{ formData.detailPermintaan.length }} Item
            </v-chip>
          </v-toolbar>

          <v-data-table
            :headers="[
              {
                title: 'SKU',
                key: 'sku',
                width: '150px',
                class: 'bg-grey-lighten-4',
              },
              {
                title: 'Nama Bahan',
                key: 'namaBahan',
                class: 'bg-grey-lighten-4',
              },
              {
                title: 'Qty Minta',
                key: 'qtyMinta',
                align: 'end',
                width: '120px',
                class: 'bg-grey-lighten-4',
              },
              {
                title: 'Satuan',
                key: 'satuan',
                width: '100px',
                class: 'bg-grey-lighten-4',
              },
            ]"
            :items="formData.detailPermintaan"
            density="compact"
            hide-default-footer
            class="rounded-0"
          >
            <template #[`item.qtyMinta`]="{ value }">
              <span class="font-weight-bold text-blue-darken-4">{{
                value
              }}</span>
            </template>
          </v-data-table>
        </v-card>

        <v-card elevation="1" rounded="lg" border class="d-flex flex-column">
          <v-toolbar color="teal-darken-1" density="compact" flat>
            <v-icon start class="ml-4">mdi-barcode-scan</v-icon>
            <v-toolbar-title class="text-body-2 font-weight-bold">
              Scan Realisasi Pengambilan
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
              prepend-icon="mdi-plus"
              size="x-small"
              variant="elevated"
              color="white"
              class="mr-4 text-teal-darken-1 font-weight-bold"
              @click="addDetail"
            >
              Baris Baru
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            class="elevation-0 detail-entry-table"
            hide-default-footer
          >
            <template #[`item.index`]="{ index }">
              <div class="d-flex justify-center align-center">
                <v-avatar
                  color="grey-lighten-3"
                  size="24"
                  class="text-caption font-weight-bold"
                >
                  {{ index + 1 }}
                </v-avatar>
              </div>
            </template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                :ref="(el) => setBarcodeRef(el, index)"
                v-model="item.barcode"
                placeholder="Scan / Klik Cari..."
                prepend-inner-icon="mdi-barcode"
                append-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                class="my-1 scan-input-styled"
                @keyup.enter="handleBarcodeScan(index)"
                @click:append-inner="openBahanSearch(index)"
              />
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                variant="outlined"
                bg-color="teal-lighten-5"
                density="compact"
                hide-details
                class="text-right-input my-1 font-weight-bold"
              />
            </template>

            <template
              v-for="col in [
                'Nama_Bahan',
                'satuan',
                'Panjang',
                'Lebar',
                'stok',
              ]"
              #[`item.${col}`]="{ item }"
            >
              <div class="readonly-cell">
                {{ item[col] || "-" }}
              </div>
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-btn
                variant="tonal"
                size="small"
                block
                color="indigo-darken-1"
                class="text-none"
                prepend-icon="mdi-magnify"
                @click="openSPKSearch(index)"
              >
                {{ item.spk || "Lookup" }}
              </v-btn>
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-trash-can-outline"
                size="x-small"
                color="red-darken-1"
                variant="text"
                @click="removeDetail(index)"
                :disabled="
                  formData.detail.length === 1 && !formData.detail[0].barcode
                "
              />
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangAsalSelect"
    />
    <GudangLookupModal
      :isVisible="isLokasiProdModalVisible"
      @close="isLokasiProdModalVisible = false"
      @select="handleGudangProdSelect"
    />
    <SPKLookupModal
      :isVisible="isSPKModalVisible"
      @close="isSPKModalVisible = false"
      @select="handleSPKSelect"
    />
    <PermintaanLookupModal
      :isVisible="isPermintaanModalVisible"
      @close="isPermintaanModalVisible = false"
      @select="handlePermintaanSelect"
    />
    <MasterBahanModal
      :isVisible="isMasterBahanVisible"
      @close="isMasterBahanVisible = false"
      @select="handleBahanSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  padding: 8px;
}
.detail-table-wrapper {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
.detail-entry-table :deep(.v-data-table__td) {
  padding: 2px 4px !important;
  height: 36px !important;
}
.detail-entry-table :deep(.v-field__input) {
  padding: 4px 2px !important;
  min-height: 28px !important;
  font-size: 11px !important;
}
:deep(.v-text-field--readonly .v-field) {
  background-color: #f5f5f5 !important;
}

.readonly-cell {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 8px;
  min-height: 32px;
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #616161;
  font-weight: 500;
}

/* Styling khusus untuk input scan agar lebih menonjol */
.scan-input-styled :deep(.v-field__outline) {
  --v-field-border-opacity: 0.4;
}

.scan-input-styled :deep(.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #00796b; /* Warna teal saat fokus */
}

.text-right-input :deep(input) {
  text-align: right !important;
  color: #004d40;
}

.detail-entry-table :deep(.v-data-table__td) {
  padding: 4px 8px !important;
}

.detail-table-wrapper {
  overflow-x: auto;
}
</style>
