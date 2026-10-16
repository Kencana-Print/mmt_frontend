<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

// Endpoint backend (hanya browse, belum di-mount di index.js):
//   GET /api/spanduk/lhk-lipat/browse?startDate=&endDate=
//   GET /api/spanduk/lhk-lipat/:nomor/detail
const API_LIPAT = "/spanduk/lhk-lipat";

const toast = useToast();

// --- State (default 30 hari terakhir, pola BastMapView) ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers master: kolom browse Delphi + agregat ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
  { title: "Kode Pabrik", key: "Kode_Pabrik", minWidth: "100px", align: "center" as const },
  { title: "Nama Pabrik", key: "Nama_Pabrik", minWidth: "180px" },
  { title: "Kar. Borongan", key: "Kar_Borongan", minWidth: "110px", align: "end" as const },
  { title: "Kar. Harian", key: "Kar_Harian", minWidth: "110px", align: "end" as const },
  { title: "Jml Qty Lipat", key: "Jml_Qty_Lipat", minWidth: "110px", align: "end" as const },
  { title: "Jml Mata Ayam", key: "Jml_Mata_Ayam", minWidth: "110px", align: "end" as const },
  { title: "Jml SPK", key: "Jml_SPK", minWidth: "90px", align: "end" as const },
]);

// --- Headers detail: kolom SQLDetail Delphi ---
const detailHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "140px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Jumlah Order", key: "Jumlah_Order", minWidth: "110px", align: "end" as const },
  { title: "Panjang", key: "Panjang", minWidth: "90px", align: "end" as const },
  { title: "Lebar", key: "Lebar", minWidth: "90px", align: "end" as const },
  { title: "Qty Lipat", key: "Qty_Lipat", minWidth: "100px", align: "end" as const },
  { title: "Tambah Lipat", key: "Tambah_Lipat", minWidth: "110px", align: "end" as const },
  { title: "Mata Ayam", key: "Mata_Ayam", minWidth: "100px", align: "end" as const },
];

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsed = parseISO(String(dateString).substring(0, 10));
    if (isValid(parsed)) return format(parsed, "dd/MM/yyyy");
    return String(dateString).substring(0, 10);
  } catch {
    return "";
  }
};

const formatNumber = (val: any, fractionDigits = 0): string =>
  Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

// --- Fetch master ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_LIPAT}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal memuat LHK lipat spanduk.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand detail per nomor ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(
      `${API_LIPAT}/${encodeURIComponent(nomor)}/detail`,
    );
    details.value[nomor] = res.data.data || res.data || [];
  } catch {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Row click & selection ---
const handleRowClick = (_event: any, row: any) => {
  selected.value = selected.value.some((s) => s.Nomor === row.item.Nomor)
    ? []
    : [row.item];
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.some((s) => s.Nomor === item?.Nomor)
    ? "row-selected"
    : "",
});

// Backend hanya menyediakan endpoint browse/detail (tanpa simpan/hapus),
// sehingga aksi tulis dinonaktifkan seperti pola browse spanduk lain.
const unavailable = (fitur: string) =>
  toast.warning(
    `${fitur} LHK lipat spanduk belum tersedia (tidak ada endpoint pendukung).`,
  );

// --- Watcher reaktif: ganti periode langsung fetch ulang ---
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="lhk-lipat-browse-wrapper">
    <BaseBrowse
      title="Hasil Kerja Lipat Spanduk"
      icon="mdi-layers-outline"
      :headers="headers"
      :items="masterData"
      item-value="Nomor"
      :loading="isLoading"
      fixed-header
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @action:new="unavailable('Tambah')"
      @action:edit="unavailable('Ubah')"
      @action:delete="unavailable('Hapus')"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate(expanded)"
    >
      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <template #item.Kar_Borongan="{ item }">
        <div class="text-right">{{ formatNumber(item.Kar_Borongan) }}</div>
      </template>
      <template #item.Kar_Harian="{ item }">
        <div class="text-right">{{ formatNumber(item.Kar_Harian) }}</div>
      </template>
      <template #item.Jml_Qty_Lipat="{ item }">
        <div class="text-right">{{ formatNumber(item.Jml_Qty_Lipat) }}</div>
      </template>
      <template #item.Jml_Mata_Ayam="{ item }">
        <div class="text-right">{{ formatNumber(item.Jml_Mata_Ayam) }}</div>
      </template>
      <template #item.Jml_SPK="{ item }">
        <div class="text-right">{{ formatNumber(item.Jml_SPK) }}</div>
      </template>

      <!-- Sub-grid detail per nomor -->
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
              <span class="text-caption">Memuat detail lipat...</span>
            </div>

            <div
              v-else-if="
                !details[item.Nomor] || details[item.Nomor].length === 0
              "
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada detail lipat untuk Nomor {{ item.Nomor }}
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
                <div class="text-right">{{ formatNumber(d.Jumlah_Order) }}</div>
              </template>
              <template #item.Panjang="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Panjang, 2) }}</div>
              </template>
              <template #item.Lebar="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Lebar, 2) }}</div>
              </template>
              <template #item.Qty_Lipat="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Qty_Lipat) }}</div>
              </template>
              <template #item.Tambah_Lipat="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Tambah_Lipat, 2) }}</div>
              </template>
              <template #item.Mata_Ayam="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Mata_Ayam) }}</div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.lhk-lipat-browse-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
