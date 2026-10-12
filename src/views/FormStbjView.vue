<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/LookupSpkStbjView.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  spk: string;
  namaBarang: string;
  size: string;
  totalOrder: number; // Baru
  order: number; // Baru (mungkin qty yang sudah terproses sebelumnya)
  qty: number; // Di gambar kolom "Jumlah"
  koli: number;
  jadi: number; // Baru
  kurang: number; // Baru
  keterangan: string;
  packing: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  gudangProduksiKode: string;
  gudangProduksiNama: string;
  keteranganHeader: string;
  userCreate: string;
  detail: DetailItem[];
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();
const API_URL = "mmt/stbj";
const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isGudangModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);

const createEmptyDetail = (): DetailItem => ({
  spk: "",
  namaBarang: "",
  size: "",
  totalOrder: 0,
  order: 0,
  qty: 0,
  koli: 0,
  jadi: 0,
  kurang: 0,
  keterangan: "",
  packing: "",
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-010",
  gudangNama: "GUDANG JADI MMT",
  gudangProduksiKode: "GP-001", // Default Finishing
  gudangProduksiNama: "GUDANG FINISHING",
  keteranganHeader: "",
  userCreate: "",
  detail: [createEmptyDetail()],
});

const detailHeaders = [
  { title: "no", key: "index", width: "40px", align: "center" as const },
  { title: "No.SPK", key: "spk", width: "120px" },
  { title: "Nama SPK", key: "namaBarang", width: "200px" },
  { title: "Ukuran", key: "size", width: "100px" },
  {
    title: "Total Order",
    key: "totalOrder",
    width: "90px",
    align: "end" as const,
  },
  { title: "Jumlah", key: "qty", width: "110px", align: "end" as const }, // Ini kolom kuning di gambar
  { title: "Koli", key: "koli", width: "60px", align: "end" as const },
  { title: "Jadi", key: "jadi", width: "80px", align: "end" as const },
  { title: "Kurang", key: "kurang", width: "80px", align: "end" as const },
  {
    title: "Keterangan",
    key: "keterangan",
    width: "120px",
    align: "end" as const,
  },
  { title: "Aksi", key: "actions", width: "50px", align: "center" as const },
] as const;

// --- Computed ---
const calculatedTotal = computed(() => {
  return formData.detail.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
});

const isFormValid = computed(() => {
  const hasGudang = !!formData.gudangKode;
  const hasValidDetail = formData.detail.some((d) => d.spk && d.qty > 0);

  // Cek apakah ada jumlah 'jadi' yang melebihi 'totalOrder'
  const isOverOrder = formData.detail.some(
    (d) => d.spk && d.jadi > d.totalOrder,
  );

  return hasGudang && hasValidDetail && !isOverOrder;
});
// --- Methods ---
const addDetail = () => {
  formData.detail.push(createEmptyDetail());
};

const removeDetail = (index: number) => {
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const saveForm = async () => {
  if (!isFormValid.value) return;

  // 2. Validasi Tambahan (Extra Guard)
  const overOrderItems = formData.detail.filter(
    (d) => d.spk && d.jadi > d.totalOrder,
  );
  if (overOrderItems.length > 0) {
    toast.error("Tidak dapat menyimpan! Ada item yang melebihi Total Order.");
    return;
  }

  isSaving.value = true;

  try {
    // Pastikan tanggal tidak null/undefined
    const tglHeader = formData.tanggal
      ? formData.tanggal
      : format(new Date(), "yyyy-MM-dd");

    const payload = {
      header: {
        stbj_nomor: formData.nomor,
        stbj_tanggal: tglHeader, // Kirim string yyyy-MM-dd
        stbj_gdg_kode: formData.gudangKode,
        stbj_gdgp_kode: formData.gudangProduksiKode,
        stbj_keterangan: formData.keteranganHeader,
      },
      details: formData.detail.filter((d) => d.spk && d.qty > 0),
    };

    if (isEditMode.value) {
      await api.put(
        `${API_URL}/${encodeURIComponent(formData.nomor)}`,
        payload,
      );
    } else {
      await api.post(API_URL, payload);
    }

    toast.success("STBJ berhasil disimpan!");
    router.back();
  } catch (error: any) {
    // Tangkap pesan error spesifik jika ada
    console.error("Error Simpan:", error);
    toast.error(error.response?.data?.message || "Gagal menyimpan STBJ.");
  } finally {
    isSaving.value = false;
  }
};

const handleGudangSelect = (gudang: any) => {
  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const handleSPKSelect = (spk) => {
  console.log("Data SPK Terpilih:", spk);

  if (currentDetailIndex.value !== null) {
    const target = formData.detail[currentDetailIndex.value];

    // 1. Mapping Nomor & Nama (Sesuaikan dengan JSON Response)
    target.spk = spk.SPK || "";
    target.namaBarang = spk.Nama || "";

    // 2. Mapping Angka (WAJIB sesuaikan dengan Key di JSON)
    // JSON: Qty_Order, Sudah_STBJ, Kurang_STBJ
    target.totalOrder = Number(spk.Qty_Order || 0);
    target.order = Number(spk.Sudah_STBJ || 0); // Qty yang sudah di-STBJ sebelumnya

    // Default qty yang akan di-input adalah sisa yang kurang
    target.qty = Number(spk.Kurang_STBJ || 0);

    target.koli = 1;

    // 3. Mapping Ukuran/Size (Pastikan field ini ada di SELECT SQL Backend Anda)
    target.size = spk.Ukuran || spk.size || "-";

    // 4. Kalkulasi Otomatis untuk kolom Jadi dan Kurang
    // 'jadi' adalah total akumulasi (sebelumnya + input sekarang)
    target.jadi = target.order + target.qty;

    // 'kurang' adalah sisa akhir setelah input sekarang
    target.kurang = target.totalOrder - target.jadi;

    // Tambah baris baru jika memilih di baris terakhir
    if (currentDetailIndex.value === formData.detail.length - 1) {
      addDetail();
    }
  }
  isSPKModalVisible.value = false;
};

const handleSPKManualInput = async (item: DetailItem, index: number) => {
  if (!item.spk || !item.spk.trim()) return;

  const inputNomor = item.spk.trim();

  try {
    const response = await api.get(`mmt/spk/${encodeURIComponent(inputNomor)}`);

    const resData = response.data;
    const spk = resData.data || resData;

    // Ambil nomor SPK dari hasil respons backend
    const foundSpkNomor = spk?.SPK || spk?.no_spk || spk?.Nomor;

    // VALIDASI KETAT (Strict Check):
    // Pastikan data ditemukan dan nomor SPK yang dikembalikan backend harus SAMA PERSIS
    // dengan apa yang diketik oleh user (case-insensitive atau exact match).
    if (
      spk &&
      foundSpkNomor &&
      foundSpkNomor.toUpperCase() === inputNomor.toUpperCase()
    ) {
      item.spk = foundSpkNomor;
      item.namaBarang = spk.Nama || spk.nama_spk || "";

      item.totalOrder = Number(
        spk.Jumlah || spk.Qty_Order || spk.total_order || 0,
      );
      item.order = Number(spk.Jadi || spk.Sudah_STBJ || spk.sudah_stbj || 0);
      item.qty = Number(
        spk.Kurang_Jadi || spk.Kurang_STBJ || spk.kurang_stbj || 0,
      );
      item.koli = 1;
      item.size = spk.Ukuran || spk.size || "-";

      // Kalkulasi otomatis Jadi & Kurang
      item.jadi = item.order + item.qty;
      item.kurang = item.totalOrder - item.jadi;

      toast.success(`SPK ${item.spk} berhasil dimuat!`);

      // Tambah baris baru jika di baris terakhir
      if (index === formData.detail.length - 1) {
        addDetail();
      }
    } else {
      // Jika backend mengembalikan data tapi kodenya berbeda:
      // JANGAN kosongkan input (agar baris tidak hilang saat simpan),
      // cukup beri peringatan.
      toast.warning(`Nomor SPK "${inputNomor}" tidak ditemukan.`);
    }
  } catch (error: any) {
    console.error("Gagal mengambil detail SPK:", error);
    toast.error(`Nomor SPK "${inputNomor}" tidak ditemukan.`);
  }
};

const fetchDataByNomor = async (nomor: string) => {
  try {
    const response = await api.get(`${API_URL}/${encodeURIComponent(nomor)}`);
    const data = response.data;

    // 1. Mapping Header
    formData.nomor = data.Nomor;
    formData.tanggal = data.Tanggal;
    formData.gudangKode = data.Gudang_Kode;
    formData.gudangNama = data.Gudang_Nama;
    formData.gudangProduksiKode = data.Gudang_Produksi_Kode;
    formData.gudangProduksiNama = data.Gudang_Produksi_Nama;
    formData.keteranganHeader = data.Keterangan;

    // 2. Mapping Detail (Sesuaikan dengan field dari Query SQL Backend Anda)
    if (data.details && data.details.length > 0) {
      formData.detail = data.details.map((item: any) => ({
        spk: item.No_Spk || item.spk || item.SPK, // Coba beberapa kemungkinan nama field
        namaBarang: item.Nama_Spk || item.nama_spk || item.Nama,
        size: item.Ukuran || item.size || "", // Pastikan Ukuran diambil
        totalOrder: Number(item.Total_Order || item.totalOrder || 0),
        order: Number(item.Order_Cetak || item.order || 0),
        qty: Number(item.Qty || item.qty || 0),
        koli: Number(item.Koli || item.koli || 0),
        jadi: Number(item.Jadi || item.jadi || 0),
        kurang: Number(item.Kurang || item.kurang || 0),
        keterangan: item.Keterangan || item.keterangan || "",
        packing: item.No_Packing || item.packing || "",
      }));

      addDetail();
    }
  } catch (error: any) {
    console.error("Gagal load data STBJ:", error);
    toast.error("Data tidak ditemukan.");
    router.back();
  }
};

// --- Perbarui Lifecycle onMounted ---
onMounted(() => {
  if (isEditMode.value && route.params.nomor) {
    // route.params.nomor bisa berupa string atau array, pastikan ambil string
    const nomor = Array.isArray(route.params.nomor)
      ? route.params.nomor[0]
      : route.params.nomor;

    fetchDataByNomor(nomor);
  }
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? 'Edit STBJ' : 'Input Barang Jadi (STBJ)'"
    icon="mdi-archive-arrow-down"
  >
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="!isFormValid"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan (F10)
      </v-btn>
      <v-btn size="x-small" @click="router.back()" class="ml-1">
        <v-icon start>mdi-close</v-icon> Tutup
      </v-btn>
    </template>

    <div class="form-grid-container">
      <div class="left-column">
        <v-card flat border>
          <v-card-title class="text-subtitle-1 py-2 bg-grey-lighten-4"
            >Data Header</v-card-title
          >
          <v-divider />
          <v-card-text>
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor STBJ"
                  v-model="formData.nomor"
                  readonly
                  variant="filled"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Tanggal"
                  v-model="formData.tanggal"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Gudang Tujuan"
                  v-model="formData.gudangKode"
                  @click="isGudangModalVisible = true"
                  append-inner-icon="mdi-magnify"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama Gudang"
                  v-model="formData.gudangNama"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
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

              <v-col cols="12" class="mt-4">
                <v-card color="blue-lighten-5" flat class="pa-2">
                  <div class="text-caption font-weight-bold text-blue-darken-3">
                    TOTAL QTY JADI
                  </div>
                  <div
                    class="text-h5 font-weight-black text-right text-blue-darken-4"
                  >
                    {{ calculatedTotal }}
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>

      <div class="right-column">
        <v-card border flat>
          <v-data-table
            :headers="detailHeaders"
            :items="formData.detail"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            fixed-header
            height="calc(100vh - 220px)"
            class="stbj-table"
          >
            <template #[`item.index`]="{ index }">
              <span class="text-grey text-caption">{{ index + 1 }}</span>
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-text-field
                v-model="item.spk"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Ketik SPK..."
                @keyup.enter="handleSPKManualInput(item, index)"
              >
                <template #append-inner>
                  <v-icon
                    icon="mdi-magnify"
                    size="small"
                    class="cursor-pointer text-grey-darken-1"
                    @click.stop="
                      currentDetailIndex = index;
                      isSPKModalVisible = true;
                    "
                  />
                </template>
              </v-text-field>
            </template>

            <template #[`item.namaBarang`]="{ item }">
              <div class="text-truncate px-1" style="max-width: 250px">
                {{ item.namaBarang }}
              </div>
            </template>

            <template #[`item.size`]="{ item }">
              <div class="px-1">{{ item.size }}</div>
            </template>

            <template #[`item.totalOrder`]="{ item }">
              <div class="px-2 text-right">{{ item.totalOrder }}</div>
            </template>

            <template #[`item.order`]="{ item }">
              <div class="px-2 text-right">{{ item.order }}</div>
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input cell-yellow"
                :error="item.jadi > item.totalOrder"
                @input="
                  item.jadi = (item.order || 0) + (item.qty || 0);
                  item.kurang = item.totalOrder - item.jadi;
                  if (item.jadi > item.totalOrder) {
                    toast.error(
                      `Jumlah Jadi (${item.jadi}) melebihi Total Order (${item.totalOrder}) pada SPK ${item.spk}!`,
                    );
                  }
                "
              />
            </template>

            <template #[`item.koli`]="{ item }">
              <v-text-field
                v-model.number="item.koli"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.jadi`]="{ item }">
              <div class="px-2 text-right font-weight-bold">
                {{ item.jadi }}
              </div>
            </template>

            <template #[`item.kurang`]="{ item }">
              <div class="px-2 text-right text-error">{{ item.kurang }}</div>
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model="item.keterangan"
                density="compact"
                variant="plain"
                hide-details
                placeholder="..."
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <div class="pa-2 border-t d-flex align-center">
                <v-btn
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addDetail"
                >
                  Tambah Baris (F2)
                </v-btn>
                <v-spacer />
                <div class="text-caption font-weight-bold mr-4">
                  TOTAL JUMLAH: {{ calculatedTotal }}
                </div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangSelect"
    />
    <SPKLookupModal
      :isVisible="isSPKModalVisible"
      @close="isSPKModalVisible = false"
      @select="handleSPKSelect"
    />
  </PageLayout>
</template>

<style scoped>
.form-grid-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 15px;
  padding: 10px;
}

/* Mengatur ukuran font agar padat seperti contoh */

/* 1. Paksa teks di dalam input text-field mengikuti rata kanan */
.text-right-input :deep(input) {
  text-align: right !important;
  padding-right: 8px !important; /* Beri sedikit jarak di kanan agar tidak mepet garis */
}

/* 2. Bersihkan padding bawaan v-field Vuetify di dalam tabel */
.stbj-table :deep(.v-field) {
  --v-field-padding-start: 4px !important;
  --v-field-padding-end: 4px !important;
  --v-field-input-padding-top: 0px !important;
  --v-field-input-padding-bottom: 0px !important;
  min-height: 28px !important; /* Menjaga input tetap tipis */
}

.right-column :deep(*) {
  font-size: 11px !important;
}

/* 3. Ratakan vertikal (tengah-tengah) untuk header dan isi cell */
.stbj-table :deep(th),
.stbj-table :deep(td) {
  vertical-align: middle !important;
  padding: 0 8px !important; /* Selaraskan padding horizontal seluruh kolom */
}

/* Mengatur tinggi baris tabel agar compact */
:deep(.v-data-table__td) {
  height: 36px !important;
}

.bg-grey-lighten-4 {
  background-color: #f5f5f5 !important;
}
</style>
