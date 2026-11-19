<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import MasterBahanModal from "@/modal/MasterBahanModal.vue";
import GudangLookupModal from "@/modal/GudangLookupView.vue";
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";
import PengajuanLookupModal from "@/modal/PengajuanPermintaanLookupModal.vue";
import MppbLookupModal from "@/modal/MppbLookupView.vue"; // ✅ Tambah Import Modal MPPB
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

const API_URL = "/mmt/permintaan-bahan";

const isEditMode = ref(!!route.params.nomor);
const isSaving = ref(false);
const isBahanModalVisible = ref(false);
const isGudangModalVisible = ref(false);
const isPabrikModalVisible = ref(false);
const isSPKModalVisible = ref(false);
const currentDetailIndex = ref<number | null>(null);
const isApproving = ref(false);
const currentUserKode = ref("");
const isPengajuanModalVisible = ref(false);
const isMppbModalVisible = ref(false); // ✅ State visibility Modal MPPB
const noPengajuan = ref("");
const noMppb = ref(""); // ✅ Menyimpan nomor referensi MPPB

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
  jenis: "Bahan Baku",
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
  const headerOk =
    !!formData.gudangKode && (!!formData.cabang || !!formData.pabrikNama);
  const detailOk = formData.detail.some((d) => d.sku && Number(d.qty) > 0);
  return headerOk && detailOk;
});

const bahanModalMode = computed(() => {
  const kode = formData.gudangKode?.toUpperCase() || "";
  const nama = formData.gudangNama?.toLowerCase() || "";
  if (kode === "WH-20" || nama.includes("tinta") || nama.includes("obat"))
    return "obat";
  if (kode === "GPM" || nama.includes("produksi")) return "produksi";
  return "mmt";
});

const approveData = async (type: "SPV" | "MANAGER") => {
  if (
    type === "MANAGER" &&
    (!formData.accSpv || formData.accSpv === "-" || formData.accSpv === "")
  ) {
    toast.warning("Manager tidak dapat melakukan ACC sebelum SPV menyetujui.");
    return;
  }

  isApproving.value = true;
  try {
    const payload = {
      nomor: formData.nomor,
      role: type,
      user: currentUserKode.value,
      details: formData.detail
        .filter((d) => d.sku)
        .map((d) => ({ sku: d.sku, isAcc: d.isAcc ? "Y" : "N" })),
    };

    await api.post(`${API_URL}/approve`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    toast.success(`Berhasil melakukan ACC ${type}`);
    await loaddataall(formData.nomor);
  } catch (error: any) {
    const msg = error.response?.data?.message || `Gagal melakukan ACC ${type}`;
    toast.error(msg);
  } finally {
    isApproving.value = false;
  }
};

// --- Methods ---
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
    formData.tanggal = format(new Date(d.Tanggal), "yyyy-MM-dd");
    formData.gudangKode = d.Gudang_Asal_Kode;
    formData.gudangNama = d.Gudang_Asal_Nama;
    formData.jenis = d.Jenis || "Bahan Baku";
    formData.keteranganHeader = d.Keterangan;
    formData.priority = d.Priority;
    formData.kepada = d.Kepada || "";
    formData.cabang = d.To_Cabang || d.Cabang || "";
    formData.pabrikNama = formData.cabang;
    formData.accSpv = d.Req_ACC_User || "-";
    formData.accManager = d.Acc_User || "-";

    formData.detail = d.Detail.map((item: any) => ({
      sku: item.Kode,
      namaBarang: item.Nama_Bahan,
      qty: item.Jumlah,
      satuan: item.Satuan,
      Panjang: item.Panjang || 0,
      Lebar: item.Lebar || 0,
      keterangan: item.KeteranganItem || "",
      spk: item.Nomor_SPK || "",
      namaSPK: item.spk_nama || "",
      isAcc: item.Is_Acc !== "N",
    }));
    if (
      formData.detail.length === 0 ||
      formData.detail[formData.detail.length - 1].sku
    )
      addDetail();
  } catch (error) {
    toast.error("Gagal memuat data transaksi.");
  } finally {
    isSaving.value = false;
  }
};

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
        "Gudang diubah, daftar barang sebelumnya mungkin tidak sesuai dengan master bahan gudang ini. Kosongkan daftar barang?",
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

const handlePengajuanSelect = async (pengajuan: any) => {
  isSaving.value = true;
  noMppb.value = ""; // Bersihkan referensi MPPB jika memilih pengajuan
  try {
    const response = await api.get(
      `/mmt/pengajuan-permintaan/${pengajuan.Nomor}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );
    const data = response.data;
    noPengajuan.value = data.Nomor;
    const isAccSpv = data.Status_Acc === "Y";

    formData.accSpv = isAccSpv
      ? data.Acc_SPV || data.Acc_Spv_User || data.Req_ACC_User || "SYSTEM"
      : "-";
    formData.accManager = data.Acc_Manager_User || "-";
    formData.keteranganHeader = `Ref Pengajuan: ${data.Nomor}. ${data.Keterangan || ""}`;
    formData.kepada = data.Ditujukan_Ke || "Purchasing";
    if (data.Jenis) formData.jenis = data.Jenis;

    formData.detail = [];
    if (Array.isArray(data.Detail)) {
      data.Detail.forEach((item: any) => {
        formData.detail.push({
          sku: item.Kode_Bahan || item.Kode || "",
          namaBarang: item.Nama_Bahan || item.Nama || "",
          qty: Number(item.Jumlah || item.Qty || 0),
          satuan: item.Satuan || "",
          Panjang: Number(item.Panjang || 0),
          Lebar: Number(item.Lebar || 0),
          keterangan: item.Keterangan || item.KeteranganItem || "",
          spk: item.Nomor_SPK || "",
          namaSPK: item.spk_nama || item.Nama_SPK || "",
          isAcc: isAccSpv,
        });
      });
    }
    addDetail();
    toast.success(
      `Berhasil menarik ${data.Detail?.length || 0} item dari pengajuan ${data.Nomor}`,
    );
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal menarik data pengajuan.",
    );
  } finally {
    isSaving.value = false;
    isPengajuanModalVisible.value = false;
  }
};

// ✅ TAMBAHAN: Fungsi untuk menarik data terpilih dari Modal MPPB
// ✅ TAMBAHAN: Fungsi untuk menarik data terpilih dari Modal MPPB + Split Ukuran AxB
const handleMppbSelect = async (mppb: any) => {
  isSaving.value = true;
  noPengajuan.value = ""; // Bersihkan referensi pengajuan jika memilih MPPB
  try {
    const response = await api.get(`/mmt/mppb/${mppb.nomor}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const data = response.data;
    noMppb.value = data.Nomor || mppb.nomor;

    const isApproved = data.Approve === "Y" || mppb.approve === "Y";
    formData.accSpv = isApproved ? data.User_Create || "SYSTEM" : "-";
    formData.accManager = "-";

    formData.keteranganHeader = `Ref MPPB: ${noMppb.value}. ${data.Keterangan || mppb.keterangan || ""}`;
    formData.kepada = "Purchasing";
    formData.jenis = "Bahan Baku";

    // ─── FUNGSI HELPER UNTUK SPLIT UKURAN (Panjang x Lebar) ───
    const parseUkuran = (ukuranStr: string | null | number) => {
      let panjang = 0;
      let lebar = 0;

      if (ukuranStr) {
        const str = String(ukuranStr).toLowerCase().trim();
        if (str.includes("x")) {
          const parts = str.split("x");
          panjang = Number(parts[0]) || 0;
          lebar = Number(parts[1]) || 0;
        } else {
          // Jika tidak ada karakter 'x', masukkan ke panjang sebagai fallback
          panjang = Number(str) || 0;
        }
      }
      return { panjang, lebar };
    };

    // Isikan data detail
    formData.detail = [];

    // Kasus 1: Jika backend mengembalikan data dalam bentuk Array Detail
    if (Array.isArray(data.Detail)) {
      data.Detail.forEach((item: any) => {
        // Ambil string ukuran dari item detail atau master
        const ukuranRaw =
          item.Lebar || item.mpb_ukuran || data.mpb_ukuran || mppb.ukuran || "";
        const dimensi = parseUkuran(ukuranRaw);

        formData.detail.push({
          sku: item.Kode || item.mpb_bahan || mppb.bahan || "",
          namaBarang:
            item.Nama_Bahan || item.mpb_nama || mppb.nama_produk || "",
          qty: Number(item.Jumlah || item.mpb_jmlorder || mppb.qty_order || 0),
          satuan: item.Satuan || "MTR",
          Panjang: dimensi.panjang, // Hasil split bagian depan
          Lebar: dimensi.lebar, // Hasil split bagian belakang
          keterangan: item.Keterangan || item.mpb_ket || mppb.keterangan || "",
          spk: item.Nomor_SPK || data.spk || mppb.spk || "",
          namaSPK: item.Nama_SPK || "",
          isAcc: isApproved,
        });
      });
    } else {
      // Kasus 2: Fallback jika langsung dari row master tunggal di list lookup
      const ukuranRaw = data.mpb_ukuran || mppb.ukuran || "";
      const dimensi = parseUkuran(ukuranRaw);

      formData.detail.push({
        sku: mppb.bahan || data.mpb_bahan || "",
        namaBarang: mppb.nama_produk || data.mpb_nama || "",
        qty: Number(mppb.qty_order || data.mpb_jmlorder || 0),
        satuan: "MTR",
        Panjang: dimensi.panjang, // Hasil split bagian depan
        Lebar: dimensi.lebar, // Hasil split bagian belakang
        keterangan: mppb.keterangan || data.Keterangan || "",
        spk: mppb.spk || data.spk || "",
        namaSPK: "",
        isAcc: isApproved,
      });
    }

    addDetail();
    toast.success(
      `Berhasil menarik data dari MPPB Nomor ${noMppb.value} dengan konversi ukuran.`,
    );
  } catch (error: any) {
    console.error("Error tarik MPPB:", error);
    toast.error(error.response?.data?.message || "Gagal menarik data MPPB.");
  } finally {
    isSaving.value = false;
    isMppbModalVisible.value = false;
  }
};

const refreshData = () => {
  Object.assign(formData, {
    nomor: "AUTO",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    jenis: "Bahan Baku",
    detail: [createEmptyDetail()],
    keteranganHeader: "",
  });
  noPengajuan.value = "";
  noMppb.value = ""; // ✅ Reset Pelacak MPPB
};

const saveForm = async (saveAndNew: boolean) => {
  if (!isFormValid.value) return;
  isSaving.value = true;
  try {
    const payload = {
      NoPengajuan: noPengajuan.value,
      NoMPPB: noMppb.value, // ✅ Sertakan NoMPPB ke dalam Payload backend
      NomorToEdit: isEditMode.value ? formData.nomor : null,
      Tanggal: formData.tanggal,
      GudangKode: formData.gudangKode,
      Jenis: formData.jenis || "Bahan Baku",
      Keterangan: formData.keteranganHeader,
      Priority: formData.priority,
      Kepada: formData.kepada,
      Cabang: formData.cabang,
      AccSpv: formData.accSpv && formData.accSpv !== "-" ? "Y" : "N",
      AccSpvUser:
        formData.accSpv && formData.accSpv !== "-" ? formData.accSpv : null,
      Detail: formData.detail
        .filter((d) => d.sku && d.qty > 0)
        .map((d) => ({
          SPK: d.spk,
          SKU: d.sku,
          QTY: d.qty,
          Satuan: d.satuan,
          KeteranganItem: d.keterangan,
          IsAcc: d.isAcc ? "Y" : "N",
        })),
    };

    if (isEditMode.value) {
      await api.put(`${API_URL}/${formData.nomor}`, payload);
    } else {
      await api.post(API_URL, payload);
    }

    toast.success("Data berhasil disimpan!");
    if (saveAndNew) {
      refreshData();
    } else {
      router.back();
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  getCurrentUser();
  if (isEditMode.value && route.params.nomor)
    loaddataall(route.params.nomor as string);
});
</script>

<template>
  <PageLayout title="Form Permintaan Barang" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        v-if="isEditMode && currentUserKode === 'EKAMMT'"
        size="x-small"
        color="orange-darken-2"
        @click="approveData('SPV')"
        :loading="isApproving"
        class="mr-1"
      >
        <v-icon start>mdi-account-check</v-icon> Acc SPV
      </v-btn>

      <v-btn
        v-if="isEditMode && currentUserKode === 'FADLY'"
        size="x-small"
        color="purple-darken-2"
        @click="approveData('MANAGER')"
        :loading="isApproving"
        class="mr-1"
      >
        <v-icon start>mdi-shield-check</v-icon> Acc Manager
      </v-btn>

      <v-divider
        vertical
        class="mx-2"
        v-if="
          isEditMode &&
          (currentUserKode === 'EKAMMT' || currentUserKode === 'FADLY')
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

              <!-- Input Pengajuan -->
              <v-col cols="12" class="mt-1">
                <v-text-field
                  label="Ambil Dari Pengajuan (Persiapan)"
                  v-model="noPengajuan"
                  placeholder="Klik untuk cari dokumen..."
                  readonly
                  persistent-placeholder
                  density="compact"
                  variant="outlined"
                  color="orange-darken-3"
                  prepend-inner-icon="mdi-file-find"
                  hide-details
                  @click="
                    !isLocked &&
                    formData.gudangKode !== 'WH-20' &&
                    !noMppb &&
                    (isPengajuanModalVisible = true)
                  "
                  :disabled="
                    isEditMode || formData.gudangKode === 'WH-20' || !!noMppb
                  "
                >
                  <template
                    v-slot:details
                    v-if="formData.gudangKode === 'WH-20'"
                  >
                    <span class="text-caption text-error"
                      >WH-20: Langsung pilih bahan di tabel</span
                    >
                  </template>
                  <template
                    v-slot:append-inner
                    v-if="noPengajuan && !isEditMode"
                  >
                    <v-icon
                      color="error"
                      size="small"
                      @click.stop="
                        noPengajuan = '';
                        formData.detail = [createEmptyDetail()];
                      "
                      >mdi-close-circle</v-icon
                    >
                  </template>
                </v-text-field>
              </v-col>

              <!-- ✅ TAMBAHAN: Kolom Input Ambil Dari MPPB -->
              <v-col cols="12" class="mt-1">
                <v-text-field
                  label="Ambil Dari MPPB (Memo Bahan)"
                  v-model="noMppb"
                  placeholder="Klik untuk cari data MPPB..."
                  readonly
                  persistent-placeholder
                  density="compact"
                  variant="outlined"
                  color="blue-darken-3"
                  prepend-inner-icon="mdi-text-box-search"
                  hide-details
                  @click="
                    !isLocked && !noPengajuan && (isMppbModalVisible = true)
                  "
                  :disabled="isEditMode || !!noPengajuan"
                >
                  <template v-slot:append-inner v-if="noMppb && !isEditMode">
                    <v-icon
                      color="error"
                      size="small"
                      @click.stop="
                        noMppb = '';
                        formData.detail = [createEmptyDetail()];
                      "
                      >mdi-close-circle</v-icon
                    >
                  </template>
                </v-text-field>
              </v-col>

              <v-col cols="12" class="pt-1">
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
                  label="Kepada"
                  v-model="formData.kepada"
                  :items="['Gudang', 'Purchasing', 'GA']"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :readonly="isLocked"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Pilih Tujuan (Pabrik)"
                  v-model="formData.pabrikNama"
                  @click="!isLocked && (isPabrikModalVisible = true)"
                  :append-inner-icon="isLocked ? '' : 'mdi-magnify'"
                  readonly
                  variant="outlined"
                  density="compact"
                  hide-details
                  color="primary"
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
                v-model="item.keterangan"
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

    <!-- Modals Container -->
    <GudangLookupModal
      :isVisible="isGudangModalVisible"
      @close="isGudangModalVisible = false"
      @select="handleGudangAsalSelect"
    />
    <PengajuanLookupModal
      :isVisible="isPengajuanModalVisible"
      @close="isPengajuanModalVisible = false"
      @select="handlePengajuanSelect"
    />
    <!-- ✅ TAMBAHAN: Instansiasi Komponen Modal MPPB -->
    <MppbLookupModal
      :isVisible="isMppbModalVisible"
      @close="isMppbModalVisible = false"
      @select="handleMppbSelect"
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
