<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

const toast = useToast();
// Route backend (belum di-mount di index.js):
// index.js → app.use("/api/spanduk/lhk-design-proof", lhkDesignProofSpandukRoutes)
// + routes GET /browse, GET /:nomor/detail
const API_LHK_DESIGN_PROOF = "/spanduk/lhk-design-proof";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const search = ref("");

// Filter tanggal default 30 hari terakhir (DateRangeFilter bawaan BaseBrowse)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master (kolom Delphi SQLMaster ufrmBrowLhkDesign_proof:
// Nomor/Nama/TglSPK/Dateline/TglLHK/LastStatus/user_create) ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor SPK", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Nama", key: "Nama", minWidth: "250px" },
  { title: "Tgl SPK", key: "TglSPK", minWidth: "110px" },
  { title: "Dateline", key: "Dateline", minWidth: "110px" },
  { title: "Tgl LHK", key: "TglLHK", minWidth: "110px" },
  { title: "Status Terakhir", key: "LastStatus", minWidth: "140px" },
  { title: "Finishing", key: "Finishing", minWidth: "120px" },
  {
    title: "Jml Sticth",
    key: "Jml_Sticth",
    minWidth: "100px",
    align: "end" as const,
  },
  {
    title: "Jml Jumlah",
    key: "Jml_Jumlah",
    minWidth: "100px",
    align: "end" as const,
  },
]);

// --- Headers Detail: alur status desain (kolom Delphi tlhkdesign_status:
// lds_cabang/lds_user/lds_status/lds_tgl/lds_durasi/lds_note) ---
const detailHeaders = [
  { title: "Cabang", key: "Cabang", minWidth: "80px" },
  { title: "Desainer", key: "Desainer", minWidth: "100px" },
  { title: "Status", key: "Status", minWidth: "140px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "160px" },
  { title: "Durasi", key: "Durasi", minWidth: "100px" },
  { title: "Catatan", key: "Note", minWidth: "250px" },
];

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return format(parsedDate, "dd/MM/yyyy");
    return dateString.substring(0, 10);
  } catch {
    return "";
  }
};

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_LHK_DESIGN_PROOF}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Gagal mengambil data LHK design proof.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand Detail: lazy-load alur status per nomor ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(
      `${API_LHK_DESIGN_PROOF}/${encodeURIComponent(nomor)}/detail`,
    );
    details.value[nomor] = res.data.data || res.data || [];
  } catch {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// Warna status: DONE hitam (selesai), selain itu merah (Delphi CustomDrawCell)
const statusColor = (status: string) =>
  String(status || "").toUpperCase() === "DONE"
    ? "text-black font-weight-bold"
    : "text-red font-weight-bold";

// --- Row Click & Selection Style ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.Nomor) return;
  selected.value = selected.value.some((s) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s) => s.Nomor === itemData?.Nomor)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// Browse ini read-only: tidak ada form New/Edit/Delete.
const handleCrud = () => {
  toast.warning("Browse LHK design proof hanya untuk melihat data.");
};

const filteredData = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return masterData.value;
  return masterData.value.filter((m) =>
    [m.Nomor, m.Nama, m.LastStatus]
      .filter(Boolean)
      .some((v: any) => String(v).toLowerCase().includes(q)),
  );
});

// --- Watcher reaktif: ganti tanggal otomatis fetch ulang ---
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="lhk-design-proof-spanduk-wrapper">
    <BaseBrowse
      title="LHK Design Proof Spanduk"
      icon="mdi-drawing"
      :headers="headers"
      :items="filteredData"
      item-value="Nomor"
      :loading="isLoading"
      :search="search"
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @action:new="handleCrud"
      @action:edit="handleCrud"
      @action:delete="handleCrud"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate"
    >
      <!-- Filter pencarian lokal -->
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor / Nama / Status"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 280px"
        />
      </template>

      <!-- Format tanggal -->
      <template #item.TglSPK="{ item }">
        {{ safeFormatDate(item.TglSPK) }}
      </template>
      <template #item.Dateline="{ item }">
        {{ safeFormatDate(item.Dateline) }}
      </template>
      <template #item.TglLHK="{ item }">
        {{ safeFormatDate(item.TglLHK) }}
      </template>

      <!-- Status terakhir: DONE hitam, lainnya merah -->
      <template #item.LastStatus="{ item }">
        <span :class="statusColor(item.LastStatus)">
          {{ item.LastStatus }}
        </span>
      </template>

      <!-- Format angka -->
      <template #item.Jml_Sticth="{ item }">
        <div class="text-right">
          {{ Number(item.Jml_Sticth || 0).toLocaleString("id-ID") }}
        </div>
      </template>
      <template #item.Jml_Jumlah="{ item }">
        <div class="text-right">
          {{ Number(item.Jml_Jumlah || 0).toLocaleString("id-ID") }}
        </div>
      </template>

      <!-- Sub-grid detail: alur status desain -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
            <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-2">
              <v-progress-circular
                indeterminate
                size="20"
                color="primary"
                class="mr-2"
              />
              <span class="text-caption">Memuat alur status...</span>
            </div>

            <div
              v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada riwayat status untuk Nomor {{ item.Nomor }}
            </div>

            <v-data-table
              v-else
              :headers="detailHeaders"
              :items="details[item.Nomor]"
              density="compact"
              class="bg-white border rounded"
              :items-per-page="-1"
              hide-default-footer
            >
              <template #item.Status="{ item: d }">
                <span :class="statusColor(d.Status)">{{ d.Status }}</span>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.lhk-design-proof-spanduk-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
