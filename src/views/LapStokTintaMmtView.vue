<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { format } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

/** * --- CONFIGURATION: TABLE HEADERS ---
 * Menyesuaikan persis dengan Header pada Gambar:
 * KODE | NAMA BAHAN | JENIS | SATUAN | SPESIFIKASI | STOCK AWAL | MASUK | KELUAR | RETUR | STOCK AKHIR
 */
const tableHeaders = [
  { title: "KODE", key: "kode", width: "100px", fixed: true },
  { title: "NAMA BAHAN", key: "Nama", minWidth: "220px", fixed: true },
  { title: "JENIS", key: "jb_nama", width: "100px" },
  { title: "SATUAN", key: "satuan", width: "100px" },
  { title: "SPESIFIKASI", key: "Spesifikasi", width: "100px" },
  {
    title: "STOCK AWAL",
    align: "center",
    children: [
      { title: "PCS", key: "stok_awal", width: "90px", align: "end" },
      { title: "KET", key: "stok_Awal2", width: "90px", align: "end" },
    ],
  },
  {
    title: "MASUK",
    align: "center",
    children: [
      { title: "PCS", key: "terima", width: "90px", align: "end" },
      { title: "KET", key: "terima2", width: "90px", align: "end" },
    ],
  },
  {
    title: "KELUAR",
    align: "center",
    children: [
      { title: "PCS", key: "keluar", width: "90px", align: "end" },
      { title: "KET", key: "keluar2", width: "90px", align: "end" },
    ],
  },
  {
    title: "RETUR/SISA PRODUKSI",
    align: "center",
    children: [
      { title: "PCS", key: "Retur_Prod", width: "90px", align: "end" },
      { title: "KET", key: "retur_prod2", width: "90px", align: "end" },
    ],
  },
  {
    title: "STOCK AKHIR",
    align: "center",
    children: [
      { title: "PCS", key: "Stok_Akhir", width: "100px", align: "end" },
      { title: "KET", key: "stok_akhir2", width: "100px", align: "end" },
    ],
  },
];

/** --- STATE MANAGEMENT --- */
const loading = ref(false);
const allData = ref([]);
const searchQuery = ref("");
const startDate = ref(
  format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    "yyyy-MM-dd",
  ),
);
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

/** --- COMPUTED: TOTALS (Sesuai baris bawah di gambar) --- */
const summaryTotals = computed(() => {
  return allData.value.reduce(
    (acc, item) => {
      acc.awalQ += Number(item.stok_awal || 0);
      acc.awalM += Number(item.stok_Awal2 || 0);
      acc.terimaQ += Number(item.terima || 0);
      acc.terimaM += Number(item.terima2 || 0);
      acc.keluarQ += Number(item.keluar || 0);
      acc.keluarM += Number(item.keluar2 || 0);
      acc.returQ += Number(item.Retur_Prod || 0);
      acc.returM += Number(item.retur_prod2 || 0);
      acc.akhirQ += Number(item.Stok_Akhir || 0);
      acc.akhirM += Number(item.stok_akhir2 || 0);
      return acc;
    },
    {
      awalQ: 0,
      awalM: 0,
      terimaQ: 0,
      terimaM: 0,
      keluarQ: 0,
      keluarM: 0,
      returQ: 0,
      returM: 0,
      akhirQ: 0,
      akhirM: 0,
    },
  );
});

/** --- METHODS --- */
const fetchReport = async () => {
  loading.value = true;
  try {
    const { data } = await api.get("mmt/laporan-ls-tinta", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = data.data || [];
  } catch (error) {
    console.error("Gagal load data:", error);
  } finally {
    loading.value = false;
  }
};

const nFormat = (val: any, dec = 2) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout
    title="Laporan Stok Tinta MMT"
    icon="mdi-format-list-bulleted-type"
  >
    <v-container fluid class="pa-4 bg-grey-lighten-4">
      <v-card flat class="mb-4 pa-4 border-sm rounded-lg">
        <v-row dense align="center">
          <v-col cols="12" sm="auto" class="d-flex align-center ga-3">
            <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />
            <v-btn
              color="primary"
              icon="mdi-magnify"
              size="small"
              @click="fetchReport"
              :loading="loading"
            />
          </v-col>
          <v-spacer />
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="searchQuery"
              placeholder="Cari Bahan..."
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="mdi-filter"
            />
          </v-col>
        </v-row>
      </v-card>

      <v-card flat class="border-sm rounded-lg overflow-hidden">
        <v-data-table
          :headers="tableHeaders"
          :items="allData"
          :search="searchQuery"
          :loading="loading"
          density="compact"
          fixed-header
          height="calc(100vh - 300px)"
          class="inventory-table"
        >
          <template
            v-for="col in [
              'stok_awal',
              'stok_Awal2',
              'terima',
              'terima2',
              'keluar',
              'keluar2',
              'Retur_Prod',
              'retur_prod2',
              'Stok_Akhir',
              'stok_akhir2',
            ]"
            :key="col"
            v-slot:[`item.${col}`]="{ value }"
          >
            <span
              :class="value > 0 ? 'font-weight-medium' : 'text-grey-lighten-1'"
            >
              {{ nFormat(value, 2) }}
            </span>
          </template>

          <template #tfoot>
            <tr class="footer-summary bg-grey-lighten-3">
              <td colspan="5" class="text-right font-weight-bold">TOTAL</td>

              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.awalQ) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.awalM) }}
              </td>

              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.terimaQ) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.terimaM) }}
              </td>

              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.keluarQ) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.keluarM) }}
              </td>

              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.returQ) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.returM) }}
              </td>

              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.akhirQ) }}
              </td>
              <td class="text-right font-weight-bold">
                {{ nFormat(summaryTotals.akhirM) }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </PageLayout>
</template>

<style scoped>
.inventory-table :deep(thead th) {
  background-color: #cfd8dc !important; /* Warna abu-abu metalik sesuai gambar */
  color: #263238 !important;
  font-size: 0.7rem !important;
  font-weight: 800 !important;
  border: 1px solid #90a4ae !important;
  text-transform: uppercase;
}

.inventory-table :deep(td) {
  font-size: 0.75rem !important;
  border-right: 1px solid #cfd8dc !important;
  border-bottom: 1px solid #cfd8dc !important;
}

.inventory-table :deep(tbody tr:hover) {
  background-color: #eceff1 !important;
}

.footer-summary td {
  padding: 8px !important;
  border: 1px solid #90a4ae !important;
  font-size: 0.8rem;
}

.date-input {
  max-width: 160px;
}
</style>
