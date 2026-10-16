<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

const toast = useToast();
// Route backend (belum di-mount di index.js):
// index.js → app.use("/api/spanduk/lhk-plotter", lhkPlotterSpandukRoutes)
// + routes GET /browse, GET /:nomor/detail
const API_LHK_PLOTTER = "/spanduk/lhk-plotter";

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

// --- Headers Master (kolom Delphi SQLMaster:
// Nomor/Tanggal/Kode_Pabrik/Nama_Pabrik) ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
  { title: "Kode Pabrik", key: "Kode_Pabrik", minWidth: "100px", align: "center" as const },
  { title: "Nama Pabrik", key: "Nama_Pabrik", minWidth: "200px" },
]);

// --- Headers Detail (kolom Delphi SQLDetail:
// Nomor_SPK/Nama_SPK/Jumlah_Order/Panjang/Lebar/J_Meter/J_Lembar/
// J_TotalMeter/J_PK/J_MK/J_Tinta/Keterangan) ---
const detailHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Jumlah Order", key: "Jumlah_Order", minWidth: "110px", align: "end" as const },
  { title: "Panjang", key: "Panjang", minWidth: "90px", align: "end" as const },
  { title: "Lebar", key: "Lebar", minWidth: "90px", align: "end" as const },
  { title: "J. Meter", key: "J_Meter", minWidth: "100px", align: "end" as const },
  { title: "J. Lembar", key: "J_Lembar", minWidth: "100px", align: "end" as const },
  { title: "J. Total Meter", key: "J_TotalMeter", minWidth: "120px", align: "end" as const },
  { title: "J. PK", key: "J_PK", minWidth: "90px", align: "end" as const },
  { title: "J. MK", key: "J_MK", minWidth: "90px", align: "end" as const },
  { title: "J. Tinta", key: "J_Tinta", minWidth: "100px", align: "end" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "300px" },
];

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return format(parsedDate, "dd/MM/yyyy");
    return "";
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
    const res = await api.get(`${API_LHK_PLOTTER}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data hasil kerja plotter.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand Detail: lazy-load per nomor (pola BastMapView) ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(
      `${API_LHK_PLOTTER}/${encodeURIComponent(nomor)}/detail`,
    );
    details.value[nomor] = res.data.data || res.data || [];
  } catch {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

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
  toast.warning("Browse hasil kerja plotter hanya untuk melihat data.");
};

const filteredData = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return masterData.value;
  return masterData.value.filter((m) =>
    [m.Nomor, m.Nama_Pabrik, m.Kode_Pabrik]
      .filter(Boolean)
      .some((v: any) => String(v).toLowerCase().includes(q)),
  );
});

// --- Watcher reaktif: ganti tanggal otomatis fetch ulang ---
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="lhk-plotter-spanduk-wrapper">
    <BaseBrowse
      title="Hasil Kerja Plotter Spanduk"
      icon="mdi-printer-3d"
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
          label="Cari Nomor / Pabrik"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 280px"
        />
      </template>

      <!-- Format tanggal -->
      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <!-- Sub-grid detail -->
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
              <span class="text-caption">Memuat detail SPK...</span>
            </div>

            <div
              v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada detail SPK untuk Nomor {{ item.Nomor }}
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
              <template #item.Jumlah_Order="{ item: d }">
                <div class="text-right">
                  {{ Number(d.Jumlah_Order || 0).toLocaleString("id-ID") }}
                </div>
              </template>
              <template #item.J_Meter="{ item: d }">
                <div class="text-right">
                  {{ Number(d.J_Meter || 0).toLocaleString("id-ID") }}
                </div>
              </template>
              <template #item.J_TotalMeter="{ item: d }">
                <div class="text-right">
                  {{ Number(d.J_TotalMeter || 0).toLocaleString("id-ID") }}
                </div>
              </template>
              <template #item.J_Tinta="{ item: d }">
                <div class="text-right">
                  {{ Number(d.J_Tinta || 0).toLocaleString("id-ID") }}
                </div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.lhk-plotter-spanduk-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
