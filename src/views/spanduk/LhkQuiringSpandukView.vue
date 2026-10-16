<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

// Endpoint backend (belum di-mount di index.js — lihat catatan mount):
//   GET /api/spanduk/lhk-quiring/browse?startDate=&endDate=
//   GET /api/spanduk/lhk-quiring/:nomor/detail
const API_LHK_QUIRING = "/spanduk/lhk-quiring";

const toast = useToast();
const router = useRouter();

// --- State (default 30 hari terakhir) ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers master: Nomor/Tanggal/Kode_Pabrik/Nama_Pabrik/
// --- Kar_Borongan/Kar_Harian + agregat Tot_* ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "180px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
  { title: "Kode Pabrik", key: "Kode_Pabrik", minWidth: "110px" },
  { title: "Nama Pabrik", key: "Nama_Pabrik", minWidth: "200px" },
  {
    title: "Kar. Borongan",
    key: "Kar_Borongan",
    minWidth: "120px",
    align: "end" as const,
  },
  {
    title: "Kar. Harian",
    key: "Kar_Harian",
    minWidth: "110px",
    align: "end" as const,
  },
  {
    title: "Total Koli",
    key: "Tot_Koli",
    minWidth: "100px",
    align: "end" as const,
  },
  {
    title: "Total Oven",
    key: "Tot_Oven",
    minWidth: "100px",
    align: "end" as const,
  },
  {
    title: "Total Jemuran",
    key: "Tot_Jemuran",
    minWidth: "120px",
    align: "end" as const,
  },
  {
    title: "Total Potong",
    key: "Tot_Potong",
    minWidth: "110px",
    align: "end" as const,
  },
]);

// Detail per nomor: Nomor_SPK/Nama_SPK/Jumlah_Order/Panjang/Lebar/
// J_Koli/J_Oven/J_Jemuran/J_Potong
const detailHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  {
    title: "Jumlah Order",
    key: "Jumlah_Order",
    minWidth: "120px",
    align: "end" as const,
  },
  { title: "Panjang", key: "Panjang", minWidth: "100px", align: "end" as const },
  { title: "Lebar", key: "Lebar", minWidth: "100px", align: "end" as const },
  { title: "Jml Koli", key: "J_Koli", minWidth: "90px", align: "end" as const },
  { title: "Jml Oven", key: "J_Oven", minWidth: "90px", align: "end" as const },
  {
    title: "Jml Jemuran",
    key: "J_Jemuran",
    minWidth: "110px",
    align: "end" as const,
  },
  {
    title: "Jml Potong",
    key: "J_Potong",
    minWidth: "100px",
    align: "end" as const,
  },
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

// --- Fetch master (filter tanggal dikirim ke backend) ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_LHK_QUIRING}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal memuat LHK Quiring.",
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
      `${API_LHK_QUIRING}/${encodeURIComponent(nomor)}/detail`,
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

// Navigasi form input (route New/Edit didaftarkan di router; JANGAN ubah index/router/NavBar di sini).
const goNew = () => router.push({ name: "LhkQuiringSpandukNew" });

const goEdit = () => {
  const nomor = selected.value?.[0]?.Nomor;
  if (!nomor) return toast.warning("Pilih satu data LHK Quiring untuk diubah.");
  router.push({ name: "LhkQuiringSpandukEdit", params: { nomor } });
};

// Backend hanya menyediakan browse + detail + form-simpan (tanpa hapus/cetak),
// sehingga aksi hapus dinonaktifkan.
const unavailable = (fitur: string) =>
  toast.warning(
    `${fitur} LHK Quiring belum tersedia (tidak ada endpoint pendukung).`,
  );

watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="lhk-quiring-browse-wrapper">
    <BaseBrowse
      title="Hasil Kerja Quiring"
      icon="mdi-content-cut"
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
      @action:new="goNew"
      @action:edit="goEdit"
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
      <template #item.Tot_Koli="{ item }">
        <div class="text-right">{{ formatNumber(item.Tot_Koli) }}</div>
      </template>
      <template #item.Tot_Oven="{ item }">
        <div class="text-right">{{ formatNumber(item.Tot_Oven) }}</div>
      </template>
      <template #item.Tot_Jemuran="{ item }">
        <div class="text-right">{{ formatNumber(item.Tot_Jemuran) }}</div>
      </template>
      <template #item.Tot_Potong="{ item }">
        <div class="text-right">{{ formatNumber(item.Tot_Potong) }}</div>
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
              <span class="text-caption">Memuat detail SPK...</span>
            </div>

            <div
              v-else-if="
                !details[item.Nomor] || details[item.Nomor].length === 0
              "
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
                <div class="text-right">{{ formatNumber(d.Jumlah_Order) }}</div>
              </template>
              <template #item.Panjang="{ item: d }">
                <div class="text-right">
                  {{ formatNumber(d.Panjang, 2) }}
                </div>
              </template>
              <template #item.Lebar="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Lebar, 2) }}</div>
              </template>
              <template #item.J_Koli="{ item: d }">
                <div class="text-right">{{ formatNumber(d.J_Koli) }}</div>
              </template>
              <template #item.J_Oven="{ item: d }">
                <div class="text-right">{{ formatNumber(d.J_Oven) }}</div>
              </template>
              <template #item.J_Jemuran="{ item: d }">
                <div class="text-right">{{ formatNumber(d.J_Jemuran) }}</div>
              </template>
              <template #item.J_Potong="{ item: d }">
                <div class="text-right">{{ formatNumber(d.J_Potong) }}</div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.lhk-quiring-browse-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
