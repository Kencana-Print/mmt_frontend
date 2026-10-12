<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "@/stores/authStore";
import { useForm } from "@/composables/useForm";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import {
  IconBox,
  IconSearch,
  IconTrash,
  IconPlus,
  IconCircleCheck,
  IconX,
} from "@tabler/icons-vue";

// --- Interfaces ---
interface DetailItem {
  barcode: string;
  sku: string;
  Nama_Bahan: string;
  qty: number;
  satuan: string;
  panjang: number;
  lebar: number;
  keterangan: string;
  spk: string;
  stok: number;
  expired: string;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();
const authStore = useAuthStore();

// Modals Visibility State
const isGudangModalVisible = ref(false);
const showPrintConfirm = ref(false);
const savedNomor = ref("");

const formatDateLocal = (value?: string | Date) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 1. Initial State Form
const initialData = {
  nomor: "AUTO",
  tanggal: formatDateLocal(new Date()),
  gudangKode: "WH-16",
  gudangNama: "Gudang Bahan MMT",
  supplierKode: "",
  noPermintaan: "",
  keteranganHeader: "",
  detail: [] as DetailItem[],
};

// 2. Setup useForm Composable
const {
  formData,
  isEditMode,
  isLoading,
  isSaving,
  showSaveDialog,
  showCancelDialog,
  showCloseDialog,
  executeSave,
  executeCancel,
  executeClose,
  fetchData,
} = useForm({
  menuId: "128", // Sesuaikan ID menu jika berbeda
  initialData,
  fetchApi: async () => {
    const res = await api.get(`/mmt/retur-produksi/${route.params.nomor}`);
    const responseData = res.data?.data || res.data;
    const h = responseData.header || responseData;
    const d = responseData.details || responseData.Details || [];

    return {
      nomor: h.Nomor || h.nomor || "",
      tanggal: formatDateLocal(h.Tanggal || h.tanggal),
      gudangKode: h.GudangTujuan || h.gudang_kode || "WH-16",
      gudangNama: h.NamaGudang || h.gudang_nama || "Gudang Bahan MMT",
      supplierKode: h.SupplierKode || h.ret_sup_kode || "",
      noPermintaan: h.NomorSPK || h.ret_rec_nomor || "",
      keteranganHeader: h.Keterangan || h.keterangan || "",
      detail: d.map((item: any) => ({
        barcode: item.barcode || item.Barcode || "",
        sku: item.sku || item.Sku || item.Kode || "",
        Nama_Bahan: item.Nama_Bahan || item.nama_bahan || item.Nama || "",
        qty: Number(item.qty || item.Qty) || 0,
        satuan: item.satuan || item.Satuan || "ROLL",
        panjang: Number(item.panjang || item.Panjang) || 0,
        lebar: Number(item.lebar || item.Lebar) || 0,
        keterangan: item.keterangan || item.Keterangan || "",
        spk: item.spk || "",
        stok: Number(item.stok || item.Stok) || 0,
        expired: formatDateLocal(item.expired || item.Expired),
      })),
    };
  },
  submitApi: async (data: typeof initialData): Promise<unknown> => {
    const validDetails = data.detail.filter(
      (d) => d.sku.trim() !== "" && d.qty > 0,
    );
    const payload = {
      Nomor: data.nomor,
      Tanggal: data.tanggal,
      GudangTujuan: data.gudangKode,
      GudangAsal: "GPM", // Terkunci ke GPM sesuai alur bisnis dasar Anda
      NomorSPK: data.noPermintaan,
      Keterangan: data.keteranganHeader,
      Type: 1,
      Details: validDetails.map((d) => ({
        sku: d.sku,
        qty: Number(d.qty),
        panjang: Number(d.panjang || 0),
        lebar: Number(d.lebar || 0),
        keterangan: d.keterangan,
        barcode: d.barcode || "",
        spk: d.spk || "",
        satuan: d.satuan || "",
        expired: d.expired || formatDateLocal(new Date()),
      })),
    };

    const res = isEditMode.value
      ? await api.put(`/mmt/retur-produksi/${data.nomor}`, payload)
      : await api.post("/mmt/retur-produksi", payload);

    savedNomor.value = res.data?.data?.nomor || data.nomor;
    showPrintConfirm.value = true;
    return res;
  },
});

const createEmptyDetail = (): DetailItem => ({
  barcode: "",
  sku: "",
  Nama_Bahan: "",
  qty: 0,
  satuan: "",
  panjang: 0,
  lebar: 0,
  keterangan: "",
  spk: "",
  stok: 0,
  expired: formatDateLocal(new Date()),
});

const handleBarcodeScan = async (index: number) => {
  const targetItem = formData.value.detail[index];
  const cleanBarcode = (targetItem.barcode || "").trim().replace(/\t/g, "");
  if (!cleanBarcode) return;
  targetItem.barcode = cleanBarcode;

  try {
    const response = await api.get(
      `/mmt/permintaan-produksi/stok-barcode/${encodeURIComponent(cleanBarcode)}?gudang=GPM`,
    );
    const bahan = response.data.data;

    if (!bahan) {
      toast.error("Barang tidak ditemukan di Gudang GPM.");
      return;
    }

    targetItem.sku = bahan.Kode || bahan.kode;
    targetItem.Nama_Bahan = bahan.Nama_Bahan || bahan.nama;
    targetItem.satuan = bahan.Satuan || bahan.satuan || "ROLL";
    targetItem.stok = bahan.Stok || 0;
    targetItem.qty = 1;
    targetItem.panjang = bahan.Panjang || 0;
    targetItem.lebar = bahan.Lebar || 0;
    targetItem.spk =
      bahan.Nomor_SPK && bahan.Nomor_SPK !== "0" ? bahan.Nomor_SPK : "";
    targetItem.expired = formatDateLocal(bahan.Expired || new Date());

    if (index === formData.value.detail.length - 1) {
      formData.value.detail.push(createEmptyDetail());
    }

    await nextTick();
    const nextInput = document.getElementById(`barcode-${index + 1}`);
    if (nextInput) (nextInput as HTMLInputElement).focus();
  } catch (err) {
    toast.error("Gagal scan barcode atau koneksi terputus.");
  }
};

const handleGudangSelect = (gudang: any) => {
  formData.value.gudangKode = gudang.Kode;
  formData.value.gudangNama = gudang.Nama;
  isGudangModalVisible.value = false;
};

const validateBeforeSave = () => {
  if (!formData.value.gudangKode) {
    return toast.warning("Gudang tujuan retur wajib dipilih.");
  }
  const hasValidItems = formData.value.detail.some((d) => d.sku && d.qty > 0);
  if (!hasValidItems) {
    return toast.warning(
      "Isi detail barang retur dengan benar (SKU & Qty > 0).",
    );
  }
  showSaveDialog.value = true;
};

const finishFlow = () => {
  showPrintConfirm.value = false;
  router.push("/mmt/retur-produksi"); // Mengarahkan kembali ke halaman browse utama
};

onMounted(async () => {
  if (isEditMode.value) {
    await fetchData();
  } else {
    formData.value.detail = [createEmptyDetail()];
  }
});
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Baru') + ' Retur Produksi ke Gudang'"
    menu-id="128"
    :icon="IconBox"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="validateBeforeSave"
    @confirm-save="executeSave"
    @confirm-cancel="executeCancel"
    @confirm-close="executeClose"
  >
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-2 text-primary">
          HEADER RETUR
        </div>

        <v-text-field
          v-model="formData.nomor"
          label="No. Retur"
          density="compact"
          variant="outlined"
          readonly
          placeholder="Otomatis"
          hide-details
          class="mb-1"
        />

        <v-text-field
          v-model="formData.tanggal"
          type="date"
          label="Tanggal Retur"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-1"
        />

        <v-text-field
          model-value="GPM - GUDANG PRODUKSI"
          label="Gudang Asal"
          density="compact"
          variant="outlined"
          hide-details
          readonly
          class="mb-1 bg-grey-lighten-4 text-grey-darken-1"
        />

        <v-text-field
          v-model="formData.gudangNama"
          label="Gudang Tujuan"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-1 text-primary"
          readonly
          @click="isGudangModalVisible = true"
        >
          <template #append-inner>
            <IconSearch
              :size="16"
              style="cursor: pointer"
              @click="isGudangModalVisible = true"
            />
          </template>
        </v-text-field>

        <v-text-field
          v-model="formData.noPermintaan"
          label="No. Referensi Permintaan"
          placeholder="Input No. MP jika ada"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-1"
        />

        <v-textarea
          v-model="formData.keteranganHeader"
          label="Alasan Retur / Keterangan"
          density="compact"
          variant="outlined"
          rows="2"
          hide-details
          class="mb-1"
        />
      </div>
    </template>

    <template #right-column>
      <v-card border flat class="d-flex flex-column fill-height">
        <div class="table-container flex-grow-1">
          <table class="manksi-table">
            <thead>
              <tr>
                <th width="40">No</th>
                <th width="160">Barcode / SKU</th>
                <th>Nama Bahan Baku</th>
                <th width="70">Satuan</th>
                <th width="80">Panjang (M)</th>
                <th width="80">Lebar (M)</th>
                <th width="90">Qty Retur</th>
                <th>Keterangan Detail</th>
                <th width="40"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.detail" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="pa-0">
                  <div class="d-flex align-center fill-height px-1">
                    <input
                      :id="`barcode-${index}`"
                      v-model="item.barcode"
                      class="cell-input fw-bold text-primary flex-grow-1"
                      placeholder="Scan & Enter..."
                      @keyup.enter="handleBarcodeScan(index)"
                    />
                    <v-btn
                      size="x-small"
                      variant="text"
                      density="comfortable"
                      color="primary"
                    >
                      <IconSearch :size="14" :stroke-width="1.7" />
                    </v-btn>
                  </div>
                </td>
                <td>
                  <input
                    v-model="item.Nama_Bahan"
                    class="cell-input text-grey-darken-1"
                    readonly
                  />
                </td>
                <td class="text-center text-caption">{{ item.satuan }}</td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.panjang"
                    class="cell-input tr"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    v-model.number="item.lebar"
                    class="cell-input tr"
                  />
                </td>
                <td class="bg-yellow-lighten-5">
                  <input
                    type="number"
                    v-model.number="item.qty"
                    class="cell-input tr fw-bold"
                  />
                </td>
                <td>
                  <input
                    v-model="item.keterangan"
                    class="cell-input"
                    placeholder="Tambahkan catatan..."
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="formData.detail.splice(index, 1)"
                  >
                    <IconTrash :size="14" :stroke-width="1.7" />
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <v-divider />

        <div class="pa-2 d-flex bg-grey-lighten-4 align-center">
          <v-btn
            size="x-small"
            color="primary"
            variant="flat"
            @click="formData.detail.push(createEmptyDetail())"
          >
            <template #prepend>
              <IconPlus :size="14" :stroke-width="2" />
            </template>
            Tambah Baris
          </v-btn>
          <v-spacer />
          <div class="text-caption font-weight-bold">
            Total Qty Diminta: {{ calculatedTotal }}
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>

  <GudangLookupModal
    :isVisible="isGudangModalVisible"
    @close="isGudangModalVisible = false"
    @select="handleGudangSelect"
  />

  <v-dialog v-model="showPrintConfirm" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="bg-primary text-white text-subtitle-1 font-weight-bold pa-3"
      >
        Simpan Berhasil
      </v-card-title>
      <v-card-text class="pa-4 text-center mt-2">
        <IconCircleCheck :size="48" color="green" class="mb-3" />
        <div class="text-body-1 font-weight-medium">
          Retur Produksi berhasil disimpan!
        </div>
      </v-card-text>
      <v-card-actions class="bg-grey-lighten-4 pa-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="finishFlow">
          Selesai
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.manksi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.manksi-table th {
  background: #1565c0;
  color: white;
  padding: 6px;
  position: sticky;
  top: 0;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.manksi-table td {
  border: 1px solid #e0e0e0;
  padding: 0;
  height: 28px;
}
.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 0 6px;
  outline: none;
  background: transparent;
}
.cell-input:focus {
  background: #e3f2fd;
}
.table-container {
  overflow: auto;
  height: 100%;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
</style>
