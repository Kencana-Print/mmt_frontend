<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

const API_MUTASI = "/mmt/mutasi-gudang";

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const masterData = ref<any[]>([]);
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const search = ref("");

// --- Headers Tabel ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "170px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
  { title: "Asal", key: "Asal", minWidth: "90px", align: "center" as const },
  { title: "Tujuan", key: "Tujuan", minWidth: "90px", align: "center" as const },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "Status", key: "Status", minWidth: "100px", align: "center" as const },
]);

const detailHeaders = [
  { title: "Barcode", key: "Barcode", minWidth: "180px" },
  { title: "Kode", key: "Kode", minWidth: "130px" },
  { title: "Nama Barang", key: "Nama_Barang", minWidth: "220px" },
  {
    title: "Panjang",
    key: "Panjang",
    minWidth: "90px",
    align: "end" as const,
  },
  { title: "Lebar", key: "Lebar", minWidth: "90px", align: "end" as const },
  { title: "Qty", key: "Qty", minWidth: "80px", align: "end" as const },
  { title: "Expired", key: "Expired", minWidth: "110px" },
  { title: "Ket", key: "Ket", minWidth: "180px" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(API_MUTASI, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        search: search.value,
      },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal ambil data mutasi.");
  } finally {
    loading.value = false;
  }
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiGudangNew" });
  } else if (selectedNomor.value) {
    router.push({
      name: "MutasiGudangEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

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

const handleDelete = async () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih mutasi yang akan dihapus.");
    return;
  }
  if (!confirm(`Hapus mutasi ${selectedNomor.value}?`)) return;
  try {
    await api.delete(`${API_MUTASI}/${selectedNomor.value}`);
    toast.success("Data dihapus");
    fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal hapus");
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih mutasi yang akan dicetak.");
    return;
  }
  window.open(
    `${API_MUTASI}/print/${encodeURIComponent(selectedNomor.value)}`,
    "_blank",
  );
};

onMounted(fetchData);
watch([startDate, endDate], fetchData);
</script>

<template>
  <div class="mutasi-browse-wrapper">
    <BaseBrowse
      title="Data Mutasi Gudang MMT"
      icon="mdi-swap-horizontal"
      :headers="headers"
      :items="masterData"
      item-value="Nomor"
      :is-loading="loading"
      height="500px"
      fixed-header
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:expanded="expanded"
      has-print
      @refresh="fetchData"
      @action:new="handleNewEdit('new')"
      @action:edit="handleNewEdit('edit')"
      @action:delete="handleDelete"
      @action:print="handlePrint"
      @row-click="handleRowClick"
      :row-props="getRowProps"
    >
      <!-- Pencarian di Toolbar -->
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor / Keterangan"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 250px"
          @keyup.enter="fetchData"
        />
      </template>

      <!-- Custom Column Formatters -->
      <template #item.Tanggal="{ item }">
        {{ item.Tanggal ? format(new Date(item.Tanggal), "dd/MM/yyyy") : "-" }}
      </template>

      <template #item.Status="{ item }">
        <v-chip
          size="x-small"
          :color="item.Status === 1 ? 'success' : 'warning'"
        >
          {{ item.Status === 1 ? "Selesai" : "Draft" }}
        </v-chip>
      </template>

      <!-- Sub-Grid Expanded Row Details -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
            <div
              v-if="!item.Details || item.Details.length === 0"
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada detail untuk mutasi {{ item.Nomor }}
            </div>

            <v-data-table
              v-else
              :headers="detailHeaders"
              :items="item.Details"
              density="compact"
              class="bg-white border rounded"
              :items-per-page="-1"
              hide-default-footer
            >
              <template #[`item.Barcode`]="{ item: d }">
                <span class="font-monospace">{{ d.Barcode || "-" }}</span>
              </template>
              <template #[`item.Panjang`]="{ item: d }">
                <div class="text-right">
                  {{ d.Panjang != null ? Number(d.Panjang).toFixed(2) : "-" }}
                </div>
              </template>
              <template #[`item.Lebar`]="{ item: d }">
                <div class="text-right">
                  {{ d.Lebar != null ? Number(d.Lebar).toFixed(2) : "-" }}
                </div>
              </template>
              <template #[`item.Qty`]="{ item: d }">
                <div class="text-right font-weight-bold">
                  {{ Number(d.Qty).toFixed(2) }}
                </div>
              </template>
              <template #[`item.Expired`]="{ item: d }">
                {{
                  d.Expired
                    ? format(new Date(d.Expired), "dd/MM/yyyy")
                    : "-"
                }}
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.mutasi-browse-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
.font-monospace {
  font-family: monospace;
}
</style>
