<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";
import { format } from "date-fns";
import { useToast } from "vue-toastification";

// --- Interfaces ---
interface DetailItem {
  sku: string;
  namaBarang: string;
  qty: number;
  satuan: string;
  Panjang: number;
  Lebar: number;
  keterangan: string;
  spk: string;
  namaSPK: string;
  isAcc: boolean;
}

interface MasterBahan {
  Kode: string;
  Nama: string;
  Satuan: string;
  Panjang: number;
  Lebar: number;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  gudangKode: string;
  gudangNama: string;
  jenis?: string;
  pabrikKode: string;
  pabrikNama: string;
  keteranganHeader: string;
  priority: string;
  kepada: string;
  cabang: string;
  accSpv: string;
  accManager: string;
  detail: DetailItem[];
}

// --- Setup & State ---
const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/pengajuan-permintaan";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isPabrikModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const isApproving = ref(false);
const currentUserKode = ref("");

// Logika Lock: Hanya mengunci field utama jika data lama dan sudah di-ACC Manager
const isLocked = computed(() => {
  if (formData.nomor === "AUTO") return false;
  return (
    formData.accManager &&
    formData.accManager !== "-" &&
    formData.accManager !== ""
  );
});

// Fungsi untuk mengambil user dari localStorage
const getCurrentUser = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const item = localStorage.getItem(key);
        const parsed = JSON.parse(item || "");
        if (parsed && parsed.kdUser) {
          currentUserKode.value = parsed.kdUser;
          return;
        }
      } catch (e) {
        /* bukan JSON */
      }
    }
  }
  currentUserKode.value = localStorage.getItem("kdUser") || "";
};

const createEmptyDetail = (): DetailItem => ({
  sku: "",
  namaBarang: "",
  qty: 0,
  satuan: "",
  Panjang: 0,
  Lebar: 0,
  keterangan: "",
  spk: "",
  namaSPK: "",
  isAcc: true,
});

const formData = reactive<FormDataState>({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  pabrikKode: "",
  pabrikNama: "",
  keteranganHeader: "",
  priority: "Urgent",
  kepada: "",
  cabang: "",
  accSpv: "",
  accManager: "",
  detail: [createEmptyDetail()],
});

const detailHeaders = [
  {
    title: "No",
    key: "index",
    width: "40px",
    sortable: false,
    align: "center" as const,
  },
  {
    title: "ACC",
    key: "isAcc",
    width: "60px",
    sortable: false,
    align: "center" as const,
  },
  { title: "Nomor SPK", key: "spk", width: "150px" },
  { title: "Nama SPK", key: "namaSPK", width: "200px" },
  { title: "Kode Bahan", key: "sku", width: "120px" },
  { title: "Nama Bahan", key: "namaBarang", sortable: false, width: "250px" },
  { title: "Jumlah", key: "qty", width: "100px", align: "end" as const },
  { title: "Lebar", key: "Lebar", width: "80px", align: "end" as const },
  { title: "Panjang", key: "Panjang", width: "80px", align: "end" as const },
  { title: "Satuan", key: "satuan", width: "80px" },
  { title: "Keterangan", key: "keterangan", sortable: false },
  {
    title: "Aksi",
    key: "actions",
    width: "50px",
    sortable: false,
    align: "center" as const,
  },
] as const;

const calculatedTotal = computed(() => {
  return formData.detail
    .reduce((sum, d) => sum + (Number(d.qty) || 0), 0)
    .toFixed(2);
});

const isFormValid = computed(() => {
  const headerOk = !!formData.gudangKode && !!formData.jenis;
  const detailOk = formData.detail.some((d) => d.sku && Number(d.qty) > 0);
  return headerOk && detailOk;
});

const approvePengajuan = async () => {
  isApproving.value = true;
  try {
    const payload = {
      nomor: formData.nomor,
    };

    await api.post(`/mmt/pengajuan-permintaan/approve`, payload);

    toast.success(`Berhasil melakukan ACC Pengajuan`);
    await loaddataall(formData.nomor);
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal ACC Pengajuan");
  } finally {
    isApproving.value = false;
  }
};

const saveForm = async (saveAndNew: boolean) => {
  if (!isFormValid.value) return;
  isSaving.value = true;
  try {
    const payload = {
      NomorToEdit: isEditMode.value ? formData.nomor : null,
      Tanggal: formData.tanggal,
      GudangKode: formData.gudangKode,
      GudangNama: formData.gudangNama,
      Jenis: formData.jenis,
      Keterangan: formData.keteranganHeader,
      Kepada: formData.kepada,
      Priority: formData.priority,

      Detail: formData.detail
        .filter((d) => d.sku && d.qty > 0)
        .map((d) => ({
          Nomor_SPK: d.spk,
          Kode_Bahan: d.sku,
          Jumlah: d.qty,
          Satuan: d.satuan,
          Keterangan: d.keterangan,
        })),
    };

    if (isEditMode.value) {
      await api.put(`${API_URL}/${formData.nomor}`, payload);
    } else {
      await api.post(API_URL, payload);
    }

    toast.success("Pengajuan berhasil disimpan!");
    if (saveAndNew) {
      refreshData();
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan pengajuan.");
  } finally {
    isSaving.value = false;
  }
};

const addDetail = () => {
  if (isLocked.value) return;
  formData.detail.push(createEmptyDetail());
};

const removeDetail = (index: number) => {
  if (isLocked.value) return;
  if (formData.detail.length > 1) {
    formData.detail.splice(index, 1);
  } else {
    formData.detail[0] = createEmptyDetail();
  }
};

const loaddataall = async (nomor: string) => {
  isSaving.value = true;
  try {
    const response = await api.get(`${API_URL}/${nomor}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const d = response.data;

    formData.nomor = d.Nomor;
    formData.tanggal = d.Tanggal
      ? d.Tanggal.substring(0, 10)
      : format(new Date(), "yyyy-MM-dd");
    formData.gudangKode = d.Gudang || "";
    formData.gudangNama = d.Nama || "";
    formData.jenis = d.Jenis || "";
    formData.kepada = d.Ditujukan_Ke || "";
    formData.keteranganHeader = d.Keterangan || "";

    if (d.Status_Acc === "Y" || (d.Acc_SPV && d.Acc_SPV !== "")) {
      formData.accSpv = d.Acc_SPV || "ACC";
    } else {
      formData.accSpv = "-";
    }

    formData.accManager = "-";

    if (d.Detail && Array.isArray(d.Detail)) {
      formData.detail = d.Detail.map((item: any) => ({
        sku: item.Kode_Bahan || item.Kode,
        namaBarang: item.Nama_Bahan,
        qty: Number(item.Jumlah),
        satuan: item.Satuan,
        Panjang: item.Panjang || 0,
        Lebar: item.Lebar || 0,
        keterangan: item.Keterangan || "",
        spk: item.Nomor_SPK || "",
        namaSPK: item.spk_nama || "",
        isAcc: true,
      }));
    } else {
      formData.detail = [];
    }

    if (
      formData.detail.length === 0 ||
      formData.detail[formData.detail.length - 1].sku
    ) {
      addDetail();
    }
  } catch (error) {
    console.error("Error Load Data:", error);
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isSaving.value = false;
  }
};

const bahanModalMode = computed(() => {
  const kode = formData.gudangKode?.toUpperCase() || "";
  const nama = formData.gudangNama?.toLowerCase() || "";

  if (kode === "WH-20" || nama.includes("tinta") || nama.includes("obat")) {
    return "obat";
  }

  if (kode === "GPM" || nama.includes("produksi")) {
    return "produksi";
  }

  return "mmt";
});

const handleBahanSelect = (bahan: MasterBahan) => {
  if (currentDetailIndex.value === null) return;
  const isDuplicate = formData.detail.some(
    (d, i) => d.sku === bahan.Kode && i !== currentDetailIndex.value,
  );
  if (isDuplicate) {
    toast.warning(`Bahan ${bahan.Kode} sudah ada.`);
    return;
  }
  const target = formData.detail[currentDetailIndex.value];
  target.sku = bahan.Kode;
  target.namaBarang = bahan.Nama;
  target.satuan = bahan.Satuan;
  target.Panjang = bahan.Panjang || 0;
  target.Lebar = bahan.Lebar || 0;
  target.qty = 1;
  if (currentDetailIndex.value === formData.detail.length - 1) addDetail();
  isBahanModalVisible.value = false;
};

const handlePabrikSelect = (pabrik: { Kode: string; Nama: string }) => {
  formData.pabrikKode = pabrik.Kode;
  formData.pabrikNama = pabrik.Nama;
  formData.cabang = pabrik.Nama;
  isPabrikModalVisible.value = false;
};

const handleGudangAsalSelect = (gudang: { Kode: string; Nama: string }) => {
  const hasItems = formData.detail.some((d) => d.sku !== "");

  if (hasItems && formData.gudangKode !== gudang.Kode) {
    if (
      !confirm(
        "Gudang diubah, daftar barang sebelumnya mungkin tidak sesuai. Kosongkan daftar barang?",
      )
    ) {
      isGudangModalVisible.value = false;
      return;
    }
    formData.detail = [createEmptyDetail()];
  }

  formData.gudangKode = gudang.Kode;
  formData.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const handleSPKSelect = (spk: { Spk: string; Nama: string }) => {
  if (currentDetailIndex.value !== null) {
    formData.detail[currentDetailIndex.value].spk = spk.Spk;
    formData.detail[currentDetailIndex.value].namaSPK = spk.Nama;
  }
  isSPKModalVisible.value = false;
};

onMounted(() => {
  getCurrentUser();
  if (isEditMode.value && route.params.nomor)
    loaddataall(route.params.nomor as string);
});
</script>

<template>
  <PageLayout title="Form Pengajuan Permintaan" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        v-if="
          isEditMode &&
          (currentUserKode === 'EKAMMT' || currentUserKode === 'PARJO')
        "
        size="x-small"
        color="orange-darken-2"
        @click="approvePengajuan"
        :loading="isApproving"
        class="mr-1"
      >
        <v-icon start>mdi-account-check</v-icon> Acc Supervisor
      </v-btn>

      <v-divider
        vertical
        class="mx-2"
        v-if="
          isEditMode &&
          (currentUserKode === 'EKAMMT' || currentUserKode === 'PARJO')
        "
      ></v-divider>

      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm(false)"
        :loading="isSaving"
        :disabled="!isFormValid || isLocked"
      >
        <v-icon start>mdi-check-circle</v-icon> Simpan
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        class="ml-1"
        @click="saveForm(true)"
        :disabled="isSaving || !isFormValid || isLocked"
      >
        <v-icon start>mdi-content-save-all</v-icon> Simpan & Baru
      </v-btn>

      <v-btn size="x-small" @click="router.back()">
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
                  :readonly="isLocked"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Untuk Gudang"
                  v-model="formData.gudangKode"
                  @click="!isLocked && (isGudangModalVisible = true)"
                  :append-inner-icon="isLocked ? '' : 'mdi-magnify'"
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
                <v-select
                  label="Jenis"
                  v-model="formData.jenis"
                  :items="['Bahan Baku', 'Bahan Penolong', 'Sparepart', 'ATK']"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :readonly="isLocked"
                />
              </v-col>

              <v-col cols="12">
                <v-select
                  label="Priority"
                  v-model="formData.priority"
                  :items="['Urgent', 'Top Urgent']"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
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
                  :readonly="isLocked"
                />
              </v-col>

              <v-col cols="12" class="mt-4 pt-4 border-t">
                <div class="text-caption font-weight-bold text-grey mb-2">
                  STATUS APPROVAL
                </div>
                <v-row dense>
                  <v-col cols="6"
                    ><v-text-field
                      label="Acc SPV"
                      v-model="formData.accSpv"
                      readonly
                      density="compact"
                      variant="filled"
                      hide-details
                      class="text-caption"
                  /></v-col>
                  <v-col cols="6"
                    ><v-text-field
                      label="Acc Manager"
                      v-model="formData.accManager"
                      readonly
                      density="compact"
                      variant="filled"
                      hide-details
                      class="text-caption"
                  /></v-col>
                </v-row>
              </v-col>

              <v-col cols="12" class="mt-4">
                <v-card color="blue-lighten-5" flat class="pa-2">
                  <div class="text-caption font-weight-bold text-blue-darken-3">
                    TOTAL QTY MINTA
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
          >
            <template #[`item.index`]="{ index }">
              <span class="text-grey text-caption">{{ index + 1 }}</span>
            </template>

            <template #[`item.isAcc`]="{ item }">
              <v-checkbox
                v-model="item.isAcc"
                density="compact"
                hide-details
                color="purple"
                :readonly="currentUserKode !== 'FADLY'"
                :disabled="!isEditMode"
              />
            </template>

            <template #[`item.spk`]="{ item, index }">
              <v-text-field
                v-model="item.spk"
                @click="
                  !isLocked &&
                  ((currentDetailIndex = index), (isSPKModalVisible = true))
                "
                append-inner-icon="mdi-magnify"
                readonly
                density="compact"
                variant="plain"
                hide-details
              />
            </template>

            <template #[`item.sku`]="{ item, index }">
              <v-text-field
                v-model="item.sku"
                :class="{
                  'text-decoration-line-through text-red': !item.isAcc,
                }"
                @click="
                  !isLocked &&
                  ((currentDetailIndex = index), (isBahanModalVisible = true))
                "
                append-inner-icon="mdi-magnify"
                readonly
                density="compact"
                variant="plain"
                hide-details
              />
            </template>

            <template #[`item.namaBarang`]="{ item }">
              <div
                :class="{
                  'text-decoration-line-through text-grey': !item.isAcc,
                }"
                class="text-truncate"
              >
                {{ item.namaBarang }}
              </div>
            </template>

            <template #[`item.qty`]="{ item }">
              <v-text-field
                v-model.number="item.qty"
                type="number"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model.number="item.keterangan"
                type="text"
                density="compact"
                variant="plain"
                hide-details
                class="text-right-input"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                v-if="!isLocked"
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeDetail(index)"
              />
            </template>

            <template #bottom>
              <div class="pa-2 border-t" v-if="!isLocked">
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
      </div>
    </div>

    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangAsalSelect"
    />
    <PabrikLookupModal
      :isVisible="isPabrikModalVisible"
      @close="isPabrikModalVisible = false"
      @select="handlePabrikSelect"
    />
    <MasterBahanModal
      :isVisible="isBahanModalVisible"
      :mode="bahanModalMode"
      @close="isBahanModalVisible = false"
      @select="handleBahanSelect"
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
.right-column :deep(*) {
  font-size: 11px !important;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
:deep(.v-data-table__td) {
  height: 32px !important;
}
.bg-grey-lighten-5 {
  background-color: #f9f9f9 !important;
}
</style>
