<template>
  <PageLayout title="Data Pemesanan Bahan MMT" icon="mdi-basket-fill">
    <template #header-actions>
      <v-btn
        v-if="authStore.can(MENU_ID, 'insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'delete')"
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="authStore.can(MENU_ID, 'view')"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak PO
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="x-small"
        :color="selectedStatus === 'OPEN' ? 'deep-orange-lighten-1' : 'teal'"
        :disabled="!isSingleSelected || selectedStatus === 'ONPROSES'"
        @click="handleToggleClose"
      >
        <v-icon start>{{
          selectedStatus === "OPEN" ? "mdi-lock" : "mdi-lock-open"
        }}</v-icon>
        {{ selectedStatus === "OPEN" ? "Close PO" : "Open PO" }}
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <DateRangeFilter
              v-model:start-date="filters.startDate"
              v-model:end-date="filters.endDate"
            />

            <v-text-field
              v-model="filters.supplier"
              label="Filter Supplier"
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
            />

            <v-btn variant="text" size="x-small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading"
          item-value="nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetails"
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Dateline="{ item }">
            {{ safeFormatDate(item.Dateline) }}
          </template>

          <template #item.Status="{ item }">
            <v-chip :color="getStatusColor(item.Status)" label size="small">
              {{ item.Status }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4 text-caption"
                    >
                      Memuat detail...
                    </div>

                    <v-data-table
                      v-else
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #item.Qty="{ item: d }">
                        {{ Number(d.Qty).toFixed(2) }}
                      </template>
                      <template #item.QtyBPB="{ item: d }">
                        <span
                          :class="{
                            'text-red': Number(d.QtyBPB) > Number(d.Qty),
                          }"
                        >
                          {{ Number(d.QtyBPB).toFixed(2) }}
                        </span>
                      </template>
                      <template #item.Harga="{ item: d }">
                        {{ Number(d.Harga).toFixed(2) }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="
                        !details[item.Nomor] || details[item.Nomor].length === 0
                      "
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

// --- Dummy Auth Store untuk kompilasi ---
const useAuthStore = () => ({
  can: (menuId: string, action: string) => true, // Selalu true untuk demo
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

// --- Interfaces PO Bahan MMT ---

interface PoBahanDetail {
  Nomor: string;
  no: number;
  kode: string;
  nama: string;
  Satuan: string;
  Qty: number;
  QtyBPB: number;
  Harga: number;
  DiscPr: number;
  Keterangan: string;
  [key: string]: any;
}

interface PoBahanHeader {
  Nomor: string;
  Tanggal: string;
  Dateline: string;
  KodeSup: string;
  Nama: string;
  Cab: string;
  Keterangan: string;
  IsTax: number;
  Status: "OPEN" | "ONPROSES" | "CLOSE";
  Acc: "Y" | "N";

  [key: string]: any;
}

const API_PO_BAHAN_MMT = "/mmt/po-bahan-mmt";
const MENU_ID = "MMT_PO_BAHAN";

// --- Store & utils ---
const router = useRouter();
const toast = useToast();

// --- State ---
const masterData = ref<PoBahanHeader[]>([]);
const details = ref<Record<string, PoBahanDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<PoBahanHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
  supplier: "", // Filter untuk Kode/Nama Supplier
});

const handleRowClick = (event: Event, { item }: { item: PoBahanHeader }) => {
  selected.value = [item]; // <-- Ini yang membuat isSingleSelected selalu true
};

const getRowProps = ({ item }) => {
  return {
    class: {
      // Pastikan membandingkan key yang unik (Nomor)
      "row-selected": item.Nomor === selectedNomor.value,
    },
  };
};

const isSingleSelected = computed(() => selected.value.length === 1); // <-- OK
const selectedNomor = computed<string | null>(() => {
  // Gunakan selected.value[0] HANYA jika isSingleSelected benar
  return isSingleSelected.value ? selected.value[0].Nomor : null; // <-- Kunci masalah: Ini harusnya OK jika isSingleSelected benar.
});

const selectedRow = computed<PoBahanHeader | null>(() =>
  isSingleSelected.value ? (selected.value[0] as PoBahanHeader) : null,
);

const selectedStatus = computed<"OPEN" | "ONPROSES" | "CLOSE" | null>(() =>
  selectedRow.value ? selectedRow.value.Status : null,
);

// --- Helpers ---

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, "dd/MM/yyyy");
    }
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return dateString;
    }
    return "";
  } catch (e) {
    return "";
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

/**
 * Menentukan warna status PO sesuai logika Delphi (cxGrdMasterStylesGetContentStyle)
 */
const getStatusColor = (status: "OPEN" | "ONPROSES" | "CLOSE" | string) => {
  switch (status) {
    case "OPEN":
      return "success";
    case "ONPROSES":
      return "orange";
    case "CLOSE":
      return "grey";
    default:
      return "default";
  }
};

// --- Headers ---

// Menggunakan as const untuk inferensi type yang ketat
const masterHeaders = [
  { title: "Nomor PO", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal PO", key: "Tanggal", minWidth: "120px" },
  { title: "Dateline", key: "Dateline", minWidth: "60px" },
  { title: "Kode Sup", key: "KodeSup", minWidth: "60px" },
  { title: "Supplier", key: "Nama", minWidth: "200px" },
  { title: "Cab", key: "Cab", minWidth: "80px" },
  { title: "Status", key: "Status", minWidth: "100px" },
  { title: "Tax", key: "IsTax", minWidth: "60px" },
  { title: "Acc", key: "Acc", minWidth: "60px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as const;

const detailHeaders = [
  { title: "No.", key: "no", minWidth: "50px", fixed: true },
  { title: "Kode Bahan", key: "kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "nama", minWidth: "300px" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Qty PO", key: "QTY", minWidth: "80px", align: "end" as const },
  {
    title: "Qty Terima",
    key: "QtyBPB",
    minWidth: "100px",
    align: "end" as const,
  },
  { title: "Harga", key: "harga", minWidth: "120px", align: "end" as const },
  { title: "Disc(%)", key: "DiscPr", minWidth: "80px", align: "end" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
] as const;

// --- API calls ---

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  details.value = {};
  try {
    const response = await api.get<PoBahanHeader[]>(`${API_PO_BAHAN_MMT}/`, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        supplier: filters.supplier,
      },
    });

    // Mapping Status dari Backend (Asumsi Backend mengikuti query Delphi: 0=OPEN, 1=CLOSE, 2=ONPROSES)
    masterData.value =
      response.data.map((item) => ({
        ...item,
        Status: item.Status,
      })) || [];
  } catch (err) {
    toast.error("Gagal mengambil data Pemesanan Bahan MMT.");
  } finally {
    loading.value = false;
  }
};

const loadDetails = async (newlyExpandedItems: PoBahanHeader[]) => {
  const itemToLoad = newlyExpandedItems?.find(
    (it) =>
      it && !details.value[it.Nomor] && !loadingDetails.value.has(it.Nomor),
  );
  if (!itemToLoad) return;

  loadingDetails.value.add(itemToLoad.Nomor);
  try {
    // Asumsi endpoint /detail mengembalikan detail PO Bahan MMT
    const res = await api.get<PoBahanDetail[]>(`${API_PO_BAHAN_MMT}/detail/`, {
      params: { nomor: itemToLoad.Nomor },
    });

    details.value[itemToLoad.Nomor] =
      res.data.map((d) => ({
        ...d,
        no: d.no || 0,
        kode: d.kode || "",
        nama: d.nama || "",
        Satuan: d.Satuan || "",
        Qty: d.Qty || 0,
        QtyBPB: d.QtyBPB || 0,
        Harga: d.Harga || 0,
        DiscPr: d.DiscPr || 0,
      })) || [];
  } catch (err) {
    toast.error(`Gagal memuat detail untuk ${itemToLoad.Nomor}`);
    details.value[itemToLoad.Nomor] = [];
  } finally {
    loadingDetails.value.delete(itemToLoad.Nomor);
  }
};

// --- Actions ---

const handleNew = () => {
  router.push({ name: "PoBahanMmtNew" });
};

const handleEdit = () => {
  if (!selectedNomor.value) return;
  router.push({
    name: "PoBahanMmtEdit",
    params: { nomor: selectedNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedNomor.value || !selectedRow.value) return;

  if (selectedRow.value.Status === "CLOSE") {
    toast.warning("PO sudah di-Close dan tidak dapat dihapus.");
    return;
  }

  // Validasi tanggal close (sesuai logika Delphi)
  const poDate = new Date(selectedRow.value.Tanggal);
  const sixMonthsAgo = subDays(new Date(), 180);

  if (poDate < sixMonthsAgo) {
    toast.error(
      "Transaksi sudah melewati batas periode penutupan (Close Period) dan tidak bisa dihapus.",
    );
    return;
  }

  if (
    confirm(`Yakin ingin hapus Pemesanan Bahan MMT ${selectedNomor.value}?`)
  ) {
    try {
      await api.delete(`${API_PO_BAHAN_MMT}/${selectedNomor.value}`);
      toast.success("Data sudah diHapus.");
      await fetchData();
    } catch (error) {
      toast.error("Gagal Hapus.");
    }
  }
};

const handleToggleClose = async () => {
  if (!selectedNomor.value || !selectedStatus.value) return;

  let action = selectedStatus.value === "OPEN" ? "CLOSE" : "OPEN";
  let message = `Yakin akan di${action}?`;

  if (confirm(message)) {
    try {
      await api.put(`${API_PO_BAHAN_MMT}/${selectedNomor.value}/toggle-close`, {
        action: action,
        user: authStore.KDUSER,
      });
      toast.success(`PO berhasil di${action} `);
      await fetchData();
    } catch (error) {
      toast.error(`Gagal ${action} PO.`);
    }
  }
};

const handlePrint = () => {
  if (!selectedRow.value || !selectedNomor.value) {
    toast.error("Pilih satu PO terlebih dahulu.");
    return;
  }

  // --- BAGIAN YANG DIUBAH ---
  // Kita beri tahu user bahwa ini masih Draft, tapi JANGAN di-return (jangan dihentikan)
  if (selectedRow.value.Acc === "N") {
    toast.warning("PO belum di-ACC Manager. Membuka Preview Draft...");
  } else {
    toast.info(`Membuka Print Preview PO ${selectedNomor.value}`);
  }
  // --------------------------

  // Langsung pindah ke halaman print tanpa peduli status ACC
  router.push({
    name: "PoPrint",
    params: { nomor: selectedNomor.value },
  });
};

// --- Lifecycle ---
onMounted(() => {
  fetchData();
});

watch(filters, fetchData, { deep: true });
</script>

<style scoped>
/* Styling dari komponen sebelumnya */
.browse-content {
  padding-top: 10px;
}
.filter-section {
  padding: 10px 16px;
}
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 40px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
}
.v-data-table :deep(.text-end) {
  text-align: right !important;
}

:deep(.row-selected) {
  background-color: #d8efff !important; /* Biru muda lembut */
  transition: background-color 0.2s ease;
}

/* Tambahkan ini agar saat di-hover warna birunya sedikit lebih gelap */
:deep(.row-selected:hover) {
  background-color: #c0e4ff !important;
}

/* Mengatur kursor agar user tahu baris bisa diklik */
:deep(.v-data-table__tr) {
  cursor: pointer;
}

/* Warna hover untuk baris biasa (opsional) */
:deep(.v-data-table__tr:hover:not(.row-selected)) {
  background-color: #f5f5f5 !important;
}

:deep(.row-selected) {
  background-color: #d8efff !important;
}

/* KHUSUS untuk kolom yang FIXED (seperti Nomor PO) */
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

/* Jika Anda menggunakan Vuetify 3 dan kolom tetap putih saat di-hover */
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}
</style>
