<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

// Endpoint backend (sumber kebenaran bentuk data):
//   GET /api/spanduk/penerimaan-bahan/browse?q=
//   GET /api/spanduk/penerimaan-bahan/lookup/sku?q=
//   GET /api/spanduk/penerimaan-bahan/:nomor  -> { ...header, details: [] }
//   POST /api/spanduk/penerimaan-bahan/save
const API_PO_PENOLONG = "/spanduk/penerimaan-bahan";

const toast = useToast();

// --- State ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Periode default 30 hari terakhir. Backend browse HANYA menerima `q`
// (tanpa startDate/endDate), jadi filter periode diterapkan client-side.
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const search = ref("");

// --- Headers: persis kolom yang dikembalikan backend ---
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
  { title: "Kode Supplier", key: "SupKode", minWidth: "110px" },
  { title: "Supplier", key: "SupplierNama", minWidth: "220px" },
  { title: "Kode Gudang", key: "GdgKode", minWidth: "110px" },
  { title: "Gudang", key: "GudangNama", minWidth: "160px" },
  {
    title: "Pajak",
    key: "isTax",
    minWidth: "90px",
    align: "center" as const,
  },
  {
    title: "Total",
    key: "TotalAmount",
    minWidth: "130px",
    align: "end" as const,
  },
  { title: "Memo", key: "Memo", minWidth: "220px" },
  { title: "Pembuat", key: "Creator", minWidth: "120px" },
]);

// Detail per nomor: GET /:nomor -> data.details
// Kolom backend: SKU, NamaBarang, Satuan, QTY, Harga, Disc, Keterangan, NoUrut, Nilai
const detailHeaders = [
  { title: "No", key: "NoUrut", minWidth: "60px", align: "center" as const },
  { title: "SKU", key: "SKU", minWidth: "130px" },
  { title: "Nama Barang", key: "NamaBarang", minWidth: "250px" },
  { title: "Satuan", key: "Satuan", minWidth: "80px", align: "center" as const },
  { title: "Qty", key: "QTY", minWidth: "100px", align: "end" as const },
  { title: "Harga", key: "Harga", minWidth: "130px", align: "end" as const },
  { title: "Disc %", key: "Disc", minWidth: "80px", align: "end" as const },
  { title: "Nilai", key: "Nilai", minWidth: "140px", align: "end" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
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

// --- Fetch master (backend hanya dukung param `q`) ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_PO_PENOLONG}/browse`, {
      params: { q: search.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal memuat PO bahan penolong.",
    );
  } finally {
    isLoading.value = false;
  }
};

// Filter periode client-side (backend tidak menerima startDate/endDate).
const displayItems = computed(() => {
  const from = startDate.value ? new Date(startDate.value) : null;
  const to = endDate.value ? new Date(endDate.value) : null;
  if (to) to.setHours(23, 59, 59, 999);
  if ((!from || isNaN(from.getTime())) && (!to || isNaN(to.getTime())))
    return masterData.value;
  return masterData.value.filter((row) => {
    if (!row.Tanggal) return true;
    const t = new Date(row.Tanggal);
    if (isNaN(t.getTime())) return true;
    if (from && !isNaN(from.getTime()) && t < from) return false;
    if (to && !isNaN(to.getTime()) && t > to) return false;
    return true;
  });
});

// --- Expand detail per nomor ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(
      `${API_PO_PENOLONG}/${encodeURIComponent(nomor)}`,
    );
    const data = res.data.data || res.data || {};
    details.value[nomor] = data.details || [];
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

// Router hanya mendaftarkan route browse untuk modul ini
// (tanpa route new/edit/print) dan backend tidak menyediakan
// endpoint DELETE maupun report, sehingga aksi tulis dinonaktifkan.
const unavailable = (fitur: string) =>
  toast.warning(
    `${fitur} PO bahan penolong belum tersedia (tidak ada route/backend pendukung).`,
  );

// Debounce pencarian agar tidak fetch tiap ketikan.
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchData, 400);
});
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="po-penolong-browse-wrapper">
    <BaseBrowse
      title="Penerimaan Bahan Penolong (PO Penolong)"
      icon="mdi-truck-check-outline"
      :headers="headers"
      :items="displayItems"
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
      <!-- Filter pencarian (backend: param `q` = nomor / supplier / memo) -->
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor / Supplier / Memo"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 280px"
          @keyup.enter="fetchData"
        />
      </template>

      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <template #item.isTax="{ item }">
        <v-chip
          :color="Number(item.isTax) === 1 ? 'success' : 'grey'"
          size="x-small"
          label
          class="font-weight-bold"
        >
          {{ Number(item.isTax) === 1 ? "PAJAK" : "NON-PAJAK" }}
        </v-chip>
      </template>

      <template #item.TotalAmount="{ item }">
        <div class="text-right">{{ formatNumber(item.TotalAmount) }}</div>
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
              <span class="text-caption">Memuat detail item...</span>
            </div>

            <div
              v-else-if="
                !details[item.Nomor] || details[item.Nomor].length === 0
              "
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada detail item untuk Nomor {{ item.Nomor }}
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
              <template #item.QTY="{ item: d }">
                <div class="text-right">{{ formatNumber(d.QTY) }}</div>
              </template>
              <template #item.Harga="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Harga) }}</div>
              </template>
              <template #item.Disc="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Disc) }}</div>
              </template>
              <template #item.Nilai="{ item: d }">
                <div class="text-right">{{ formatNumber(d.Nilai) }}</div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.po-penolong-browse-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
