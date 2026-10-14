<template>
  <PageLayout title="Data PO External MMT" icon="mdi-file-document-outline">
    <!-- Header Actions (Logika Tombol Delphi Terintegrasi) -->
    <template #header-actions>
      <v-btn
        v-if="canAccess('insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        v-if="canAccess('edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        v-if="canAccess('delete')"
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>

      <v-btn
        size="x-small"
        color="purple"
        :disabled="!isSingleSelected"
        @click="openPengajuanDialog"
      >
        <v-icon start>mdi-file-lock-outline</v-icon> Pengajuan Edit
      </v-btn>

      <v-btn
        variant="text"
        size="x-small"
        @click="fetchData"
        :loading="loading"
      >
        <v-icon>mdi-refresh</v-icon> Refresh
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section -->
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <DateRangeFilter
              v-model:start-date="filters.startDate"
              v-model:end-date="filters.endDate"
            />

            <v-text-field
              v-model="filters.search"
              prepend-inner-icon="mdi-magnify"
              label="Cari Nomor PO / Supplier / SPK"
              density="compact"
              hide-details
              variant="outlined"
              clearable
              style="max-width: 300px"
              @keyup.enter="fetchData"
            />
          </div>
        </v-card-text>
      </v-card>

      <!-- Table Section Master (cxGridMaster) -->
      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="computedMasterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          show-expand
          select-strategy="single"
          @click:row="handleRowClick"
          @update:expanded="loadDetailForExpanded"
          :row-props="getRowProps"
        >
          <!-- Custom Cell Styling Berdasarkan Status & Ngedit (Dari Delphi CustomDrawCell) -->
          <template #item.Nomor="{ item }">
            <span :class="getNomorCellClass(item)">{{ item.Nomor }}</span>
          </template>

          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.DateLinePO="{ item }">
            {{ safeFormatDate(item.DateLinePO) }}
          </template>

          <template #item.Status="{ item }">
            <span :class="getStatusClass(item)">{{ item.Status }}</span>
          </template>

          <template #item.Nominal="{ item }">
            {{ formatRupiah(item.Nominal) }}
          </template>
          <template #item.DP="{ item }">
            {{ formatRupiah(item.DP) }}
          </template>
          <template #item.Voucher="{ item }">
            {{ formatRupiah(item.Voucher) }}
          </template>
          <template #item.BelumBayar="{ item }">
            {{ formatRupiah(item.BelumBayar) }}
          </template>

          <!-- Expanded Row: Detail Alokasi Kota (cxGridDetail) -->
          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div v-if="item.loadingDetail" class="text-center pa-4">
                      <v-progress-circular indeterminate size="20" />
                      <span class="ml-2 text-caption"
                        >Memuat alokasi detail...</span
                      >
                    </div>

                    <v-data-table
                      v-else-if="item.Detail && item.Detail.length"
                      :headers="detailHeaders"
                      :items="item.Detail"
                      density="compact"
                      hide-default-footer
                      class="detail-table border"
                    >
                      <!-- Hitung total footer alokasi -->
                      <template #body.append>
                        <tr class="bg-grey-lighten-4 font-weight-bold">
                          <td colspan="2" class="text-right">TOTAL:</td>
                          <td class="text-right text-blue-darken-3">
                            {{ calculateTotalDetailQty(item.Detail) }}
                          </td>
                        </tr>
                      </template>
                    </v-data-table>

                    <div v-else class="text-center pa-4 text-caption">
                      Data detail alokasi tidak ditemukan.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>

    <!-- Panel Pengajuan Perubahan Data (Ganti dari panelAlasan Delphi) -->
    <v-dialog v-model="panelAlasanVisible" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-purple text-white text-subtitle-1">
          Pengajuan Perubahan Data PO [Urut: {{ pengajuanState.lblUrut }}]
        </v-card-title>
        <v-card-text class="pt-4">
          <v-textarea
            v-model="pengajuanState.edtAlasan"
            label="Alasan Perubahan Data (Wajib Diisi)"
            variant="outlined"
            density="compact"
            rows="4"
            hide-details
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            size="small"
            variant="outlined"
            @click="closePengajuanDialog"
          >
            Batal
          </v-btn>
          <v-btn
            color="purple"
            size="small"
            variant="elevated"
            @click="handleAjukanPengajuan"
          >
            Ajukan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, parseISO, isValid, addMonths, isBefore } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { useAuthStore } from "@/stores/authStore";

// --- Initialize ---
const authStore = useAuthStore();
const user = authStore.user; // Pastikan store memiliki info: kdUser, CAB, zLihatHarga, ztglclose
const router = useRouter();
const toast = useToast();

const MENU_ID = "ufrmBrowsePOextMmt";
const API_URL = "/mmt/po-external-mmt";

// --- State ---
const masterData = ref<any[]>([]);
const loading = ref(false);
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const panelAlasanVisible = ref(false);

const filters = reactive({
  startDate: format(new Date(), "yyyy-MM-01"),
  endDate: format(new Date(), "yyyy-MM-dd"),
  search: "",
});

const pengajuanState = reactive({
  lblUrut: "0",
  edtAlasan: "",
});

// --- Grid Headers Structure ---
const baseMasterHeaders = [
  { title: "Nomor PO", key: "Nomor", width: "140px", fixed: true },
  { title: "Tanggal", key: "Tanggal", width: "110px" },
  { title: "Deadline", key: "DateLinePO", width: "110px" },
  { title: "Cabang", key: "Cab", width: "80px" },
  { title: "No. SPK", key: "SPK", width: "130px" },
  { title: "Nama SPK", key: "NamaSPK", minWidth: "180px" },
  { title: "Kode Sup", key: "KdSup", width: "90px" },
  { title: "Supplier", key: "Supplier", minWidth: "180px" },
  { title: "Qty PO", key: "QtyPO", align: "end" as const },
  { title: "Qty BPB", key: "QtyBPB", align: "end" as const },
];

const priceHeaders = [
  { title: "Nominal", key: "Nominal", align: "end" as const },
  { title: "DP", key: "DP", align: "end" as const },
  { title: "Voucher", key: "Voucher", align: "end" as const },
  { title: "Belum Bayar", key: "BelumBayar", align: "end" as const },
];

const endMasterHeaders = [
  { title: "Status", key: "Status", width: "100px" },
  { title: "Ngedit", key: "Ngedit", width: "90px" },
  { title: "User", key: "Usr", width: "100px" },
  { title: "Created", key: "Created", width: "150px" },
];

// Meniru klausa: `if zLihatHarga=1 then s:=s+' x.Nominal...'`
const computedMasterHeaders = computed(() => {
  const lihatHarga = user?.zLihatHarga === 1;
  return lihatHarga
    ? [...baseMasterHeaders, ...priceHeaders, ...endMasterHeaders]
    : [...baseMasterHeaders, ...endMasterHeaders];
});

const detailHeaders = [
  { title: "Nomor PO", key: "Nomor", width: "140px" },
  { title: "Kota Alokasi", key: "kota", minWidth: "200px" },
  { title: "Jumlah", key: "Jumlah", align: "end" as const, width: "120px" },
];

// --- Computed Helper ---
// --- Computed Helper ---
const isSingleSelected = computed(() => selected.value.length > 0);

const selectedRow = computed(() => {
  if (selected.value.length === 0) return null;
  const val = selected.value[0];
  const nomorKey = typeof val === "object" && val !== null ? val.Nomor : val;
  return masterData.value.find((i) => i.Nomor === nomorKey) || null;
});

// --- Action Event Handlers ---
const handleRowClick = (event: any, { item }: any) => {
  selected.value = selected.value.includes(item.Nomor) ? [] : [item.Nomor];
};

const getRowProps = ({ item }: any) => {
  return {
    class: selected.value.includes(item.Nomor) ? "row-selected" : "",
  };
};

// --- Custom Grid Cell Draw Mirroring (Logika Pewarnaan Delphi) ---
const getStatusClass = (item: any) => {
  if (item.Status === "OPEN") return "text-open-red font-weight-bold";
  if (item.Status === "PROSES") return "text-proses-blue font-weight-bold";
  return "";
};

const getNomorCellClass = (item: any) => {
  if (item.Ngedit === "WAIT") return "badge-wait-blue";
  if (item.Ngedit === "TOLAK") return "badge-tolak-red";
  if (item.Ngedit === "ACC") return "badge-acc-green";
  return "";
};

// --- API Fetch Core ---
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(API_URL, { params: { ...filters } });
    masterData.value = res.data || [];
    selected.value = [];
    expanded.value = [];
  } catch (err) {
    toast.error("Gagal memuat data master.");
  } finally {
    loading.value = false;
  }
};

const loadDetailForExpanded = async (expandedKeys: any[]) => {
  if (expandedKeys.length === 0) return;
  const lastNomor = expandedKeys[expandedKeys.length - 1];
  const targetItem = masterData.value.find((i) => i.Nomor === lastNomor);
  if (!targetItem || targetItem.Detail) return;

  try {
    targetItem.loadingDetail = true;
    const res = await api.get(`${API_URL}/detail/${lastNomor}`);
    targetItem.Detail = res.data || [];
  } catch (err) {
    toast.error("Gagal memuat detail alokasi.");
  } finally {
    targetItem.loadingDetail = false;
  }
};

const handleNew = () => {
  if (!canAccess("insert")) return;
  router.push({ name: "POExternalMmtNew" });
};

const handleEdit = () => {
  if (!canAccess("edit") || !selectedRow.value) return;

  // Validasi Otoritas Cabang
  if (user?.CAB && selectedRow.value.Cab !== user.CAB) {
    toast.warning("Data tsb bukan cabang anda.");
    return;
  }

  // Mengirim parameter nomor PO (Sesuai key 'Nomor' dari baris data master table)
  router.push({
    name: "POExternalMmtEdit",
    params: { nomor: selectedRow.value.Nomor },
  });
};

const handleDelete = async () => {
  if (!canAccess("delete") || !selectedRow.value) return; // <-- Diubah ke canAccess
  const row = selectedRow.value;

  // 1. Logika validasi tanggal Closing
  const tglTransaksi = parseISO(row.Tanggal);
  const zDay = user?.ztglclose || 25;
  let zMonth = parseInt(format(tglTransaksi, "M"));
  let zYear = parseInt(format(tglTransaksi, "yyyy"));

  if (zMonth === 12) {
    zMonth = 1;
    zYear += 1;
  } else {
    zMonth += 1;
  }

  const limitDate = new Date(zYear, zMonth - 1, zDay);
  if (new Date() > limitDate) {
    toast.error("Transaksi tsb sudah close. Tidak bisa dihapus.");
    return;
  }

  // 2. Validasi Cabang
  if (user?.CAB && row.Cab !== user.CAB) {
    toast.warning("Data tsb bukan cabang anda.");
    return;
  }

  // 3. Validasi Kondisi Status Operasional PO
  if (row.Status !== "OPEN") {
    toast.error("PO tsb sudah di proses/close. Tidak bisa dihapus.");
    return;
  }
  if (Number(row.QtyBPB) !== 0) {
    toast.error("PO tsb sudah ada Penerimaan. Tidak bisa dihapus.");
    return;
  }
  if (Number(row.Voucher) !== 0) {
    toast.error(
      "PO tsb sudah ada dibuatkan Voucher pembayaran. Tidak bisa dihapus.",
    );
    return;
  }

  if (!confirm("Yakin ingin hapus?")) return;

  try {
    await api.delete(`${API_URL}/${row.Nomor}`);
    toast.success("Sukses menghapus data.");
    fetchData();
  } catch (err) {
    toast.error("Gagal Hapus.");
  }
};

const openPengajuanDialog = async () => {
  if (!canAccess("edit") || !selectedRow.value) return; // <-- Diubah ke canAccess
  const row = selectedRow.value;

  const tglTransaksi = parseISO(row.Tanggal);
  const zDay = user?.ztglclose || 25;
  let zMonth = parseInt(format(tglTransaksi, "M"));
  let zYear = parseInt(format(tglTransaksi, "yyyy"));
  if (zMonth === 12) {
    zMonth = 1;
    zYear += 1;
  } else {
    zMonth += 1;
  }

  const limitClosingDate = new Date(zYear, zMonth - 1, zDay);

  let zcloseDate = null;
  try {
    const configRes = await api.get(`/config/date-close/PO EXT MMT`);
    zcloseDate = configRes.data.zclose ? parseISO(configRes.data.zclose) : null;
  } catch (e) {
    console.error(e);
  }

  const isLockedByDate = new Date() > limitClosingDate && !zcloseDate;
  const isLockedByConfig = zcloseDate && isBefore(tglTransaksi, zcloseDate);

  if (isLockedByDate || isLockedByConfig) {
    try {
      const pinRes = await api.get(`${API_URL}/check-pin/${row.Nomor}`);
      const latestPin = pinRes.data;

      if (!latestPin) {
        pengajuanState.lblUrut = "1";
        pengajuanState.edtAlasan = "";
      } else {
        if (!latestPin.pin_dipakai) {
          pengajuanState.lblUrut = String(latestPin.pin_urut);
          pengajuanState.edtAlasan = latestPin.pin_alasan || "";
        } else {
          pengajuanState.lblUrut = String(Number(latestPin.pin_urut) + 1);
          pengajuanState.edtAlasan = "";
        }
      }
      panelAlasanVisible.value = true;
    } catch (err) {
      toast.error("Gagal memvalidasi status PIN internal.");
    }
  } else {
    toast.info("Tidak perlu pengajuan perubahan data (Data belum terkunci).");
  }
};

const handleAjukanPengajuan = async () => {
  if (!pengajuanState.edtAlasan.trim()) {
    toast.warning("Alasan harus di isi.");
    return;
  }

  if (!confirm("Yakin akan pengajuan?")) return;

  try {
    const payload = {
      pin_nomor: selectedRow.value.Nomor,
      pin_urut: pengajuanState.lblUrut,
      pin_tgl_trs: selectedRow.value.Tanggal,
      pin_ket: selectedRow.value.SPK,
      pin_alasan: pengajuanState.edtAlasan,
      pin_user_minta: user?.kdUser || "UNKNOWN",
    };

    // Inject data via server (On Duplicate Key Update Handled by Backend)
    await api.post(`${API_URL}/submit-pin`, payload);

    toast.success("Berhasil diajukkan. Nunggu ACC");

    // Sinkronisasi status visual baris lokal ke client state
    selectedRow.value.Ngedit = "WAIT";
    closePengajuanDialog();
  } catch (err) {
    toast.error("Gagal Pengajuan.");
  }
};

const closePengajuanDialog = () => {
  panelAlasanVisible.value = false;
  pengajuanState.edtAlasan = "";
};

const handlePrint = () => {
  if (!selectedRow.value) return;
  router.push({
    name: "POExternalMmtPrint",
    params: { nomor: selectedRow.value.Nomor },
  });
};

// --- Utilities ---
const canAccess = (action: string) => {
  if (typeof (authStore as any).can === "function") {
    const permit = (authStore as any).can(MENU_ID, action);
    if (!permit)
      toast.warning(
        `Anda tidak berhak akses tindakan [${action}] di modul ini.`,
      );
    return permit;
  }
  return true;
};

const safeFormatDate = (d: string) =>
  d && isValid(parseISO(d)) ? format(parseISO(d), "dd/MM/yyyy") : d || "-";
const formatRupiah = (v: number | string) => {
  if (!v) return "0";
  return new Intl.NumberFormat("id-ID", { style: "decimal" }).format(Number(v));
};
const calculateTotalDetailQty = (details: any[]) => {
  return details.reduce((sum, item) => sum + Number(item.Jumlah || 0), 0);
};

// --- Lifecycle & Watcher ---
onMounted(fetchData);
watch([() => filters.startDate, () => filters.endDate], fetchData);
</script>

<style scoped>
.table-container {
  height: calc(100vh - 230px);
}

/* Master Row Selection Highlight */
:deep(.row-selected) {
  background-color: rgb(216, 239, 255) !important;
}

:deep(.v-data-table tbody tr:hover) {
  background-color: #f1f8ff !important;
  cursor: pointer;
}

/* Delphi CustomDrawCell Mapping Effect */
.text-open-red {
  color: #f44336 !important;
}
.text-proses-blue {
  color: #2196f3 !important;
}

/* Badge background indicators for 'Ngedit' status field */
.badge-wait-blue {
  background-color: #2196f3 !important;
  color: white !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.badge-tolak-red {
  background-color: #e53935 !important;
  color: white !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}
.badge-acc-green {
  background-color: #4caf50 !important;
  color: white !important;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

/* Detail Expanded Layout Container */
.detail-container {
  padding: 10px 0;
  background-color: #fafafa;
  border-top: 1px solid #e0e0e0;
}
.detail-table-wrapper {
  padding: 0 16px;
  width: 100%;
}
.detail-table {
  background-color: white !important;
  font-size: 0.78rem;
  width: 100% !important;
}
:deep(.v-data-table__table) {
  font-size: 0.8rem;
}
</style>
