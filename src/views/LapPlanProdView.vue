<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { format, parseISO, isValid } from "date-fns";

// --- STATE ---
const loading = ref(false);
const masterData = ref([]);
const detailData = ref([]); // Penyimpanan data detail (perencanaan harian/mesin)
const startDate = ref(new Date().toISOString().substr(0, 10));
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");
const categoryIndex = ref(0); // 0: Cetak, 1: Finishing, 2: Kirim

const categories = [
  { title: 'CETAK', value: 0 },
  { title: 'FINISHING', value: 1 },
  { title: 'KIRIM', value: 2 }
];

// --- HEADERS DEFINITION ---
const masterHeaders = computed(() => {
  const baseHeaders = [
    { title: "NOMOR", key: "Nomor", width: "130px" },
    { title: "DATELINE", key: "Dateline", width: "110px" },
    { title: "NAMA SPK", key: "NamaSPK", minWidth: "200px" },
    { title: "P", key: "Panjang", width: "60px" },
    { title: "L", key: "Lebar", width: "60px" },
    { title: "BAHAN", key: "Bahan", width: "120px" },
    { title: "ORDER", key: "Jml_Order", width: "80px", align: 'end' },
  ];

  // Penyesuaian Kolom Berdasarkan Kategori (cbproduksi.ItemIndex di Delphi)
  if (categoryIndex.value === 0) {
    baseHeaders.push({ title: "PLAN CETAK", key: "Plan_cetak", width: "100px", align: 'end' });
    baseHeaders.push({ title: "KRG CETAK", key: "krg_Cetak", width: "100px", align: 'end' });
  } else if (categoryIndex.value === 1) {
    baseHeaders.push({ title: "PLAN FIN", key: "Plan_finishing", width: "100px", align: 'end' });
    baseHeaders.push({ title: "KRG FIN", key: "krg_Finishing", width: "100px", align: 'end' });
  } else {
    baseHeaders.push({ title: "PLAN KIRIM", key: "Plan_Kirim", width: "100px", align: 'end' });
    baseHeaders.push({ title: "KRG KIRIM", key: "krg_Kirim", width: "100px", align: 'end' });
  }

  baseHeaders.push({ title: "STATUS", key: "Status", width: "90px", align: 'center' });
  baseHeaders.push({ title: "", key: "data-table-expand" }); // Untuk Master-Detail

  return baseHeaders;
});

// --- FETCH DATA (Master & Detail) ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get('mmt/planning-report', {
      params: { 
        category: categoryIndex.value, 
        start: startDate.value, 
        end: endDate.value 
      }
    });
    masterData.value = res.data.master || [];
    detailData.value = res.data.detail || []; // Data detail disinkronkan berdasarkan 'Nomor'
  } finally {
    loading.value = false;
  }
};

// --- LOGIKA FILTER DETAIL ---
// Mencari data detail yang sesuai dengan nomor SPK saat baris di-expand
const getDetailByNomor = (nomor: string) => {
  return detailData.value.filter((d: any) => d.Nomor === nomor);
};

// --- STYLING (GetContentStyle Delphi) ---
const getRowClass = (item: any) => {
  // Jika Status bukan 'Close', beri warna (cxStyle1 di Delphi)
  return item.Status !== 'Close' ? 'row-open-style' : '';
};

const formatNumber = (val: any) => Number(val || 0).toLocaleString('id-ID');
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

onMounted(fetchReport);
watch(categoryIndex, fetchReport); // Refresh otomatis saat kategori ganti
</script>

<template>
  <PageLayout :title="`Lap Planning Produksi MMT [ ${categories[categoryIndex].title} ]`" icon="mdi-calendar-clock">
    <div class="planning-wrapper">
      
      <v-card flat class="mb-4 pa-4 filter-card" elevation="1">
        <v-row dense align="center">
          <v-col cols="12" md="2">
            <v-select
              v-model="categoryIndex"
              :items="categories"
              label="Proses Produksi"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center ga-2">
            <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />
            <v-btn :loading="loading" icon="mdi-refresh" color="primary" size="small" @click="fetchReport" />
          </v-col>
          <v-spacer />
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Cari Nomor/Nama SPK..."
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-btn color="success" prepend-icon="mdi-file-excel" size="small">Export</v-btn>
          </v-col>
        </v-row>
      </v-card>

      <v-card class="table-card" elevation="2">
        <v-data-table
          :headers="masterHeaders"
          :items="masterData"
          :search="searchQuery"
          :loading="loading"
          density="compact"
          item-value="Nomor"
          show-expand
          class="planning-grid"
          :row-props="(data) => ({ class: getRowClass(data.item) })"
        >
          <template #item.Dateline="{ value }">{{ formatDate(value) }}</template>
          
          <template #item.Status="{ value }">
            <v-chip
              :color="value === 'Close' ? 'success' : 'error'"
              size="x-small"
              label
              class="font-weight-bold"
            >
              {{ value }}
            </v-chip>
          </template>

          <template #item.Jml_Order="{ value }">{{ formatNumber(value) }}</template>
          <template #item.Plan_cetak="{ value }">{{ formatNumber(value) }}</template>
          <template #item.krg_Cetak="{ value }">{{ formatNumber(value) }}</template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <div class="detail-container pa-4 bg-grey-lighten-4">
                  <div class="text-subtitle-2 mb-2 font-weight-bold">Rincian Harian Planning: {{ item.Nomor }}</div>
                  <v-table density="compact" class="detail-grid elevation-1">
                    <thead>
                      <tr>
                        <th class="text-left">Tgl Plan</th>
                        <th v-if="categoryIndex === 0" class="text-right">MT01</th>
                        <th v-if="categoryIndex === 0" class="text-right">MT02</th>
                        <th v-if="categoryIndex === 0" class="text-right">MT03</th>
                        <th v-if="categoryIndex === 0" class="text-right">MT04</th>
                        <th v-if="categoryIndex === 0" class="text-right">MT05</th>
                        <th class="text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="det in getDetailByNomor(item.Nomor)" :key="det.Plan_Tanggal">
                        <td>{{ formatDate(det.Plan_Tanggal) }}</td>
                        <td v-if="categoryIndex === 0" class="text-right">{{ formatNumber(det.MT01) }}</td>
                        <td v-if="categoryIndex === 0" class="text-right">{{ formatNumber(det.MT02) }}</td>
                        <td v-if="categoryIndex === 0" class="text-right">{{ formatNumber(det.MT03) }}</td>
                        <td v-if="categoryIndex === 0" class="text-right">{{ formatNumber(det.MT04) }}</td>
                        <td v-if="categoryIndex === 0" class="text-right">{{ formatNumber(det.MT05) }}</td>
                        <td class="text-right font-weight-bold text-blue">{{ formatNumber(det.TOTAL) }}</td>
                      </tr>
                      <tr v-if="getDetailByNomor(item.Nomor).length === 0">
                        <td colspan="7" class="text-center italic text-grey">Belum ada rincian perencanaan</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

    </div>
  </PageLayout>
</template>

<style scoped>
.planning-wrapper { padding: 16px; background: #f8f9fa; min-height: 100vh; }
.filter-card { border-radius: 12px; }
.custom-date-input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  height: 40px;
}

/* Master Grid Style (cxGrid Style) */
.planning-grid :deep(thead th) {
  background-color: #455a64 !important;
  color: white !important;
  font-size: 11px !important;
  font-weight: bold !important;
  border-right: 1px solid #546e7a !important;
}

/* Warna baris Open (cxStyle1 Delphi) */
:deep(.row-open-style) {
  background-color: #fff9c4 !important; /* Kuning lembut untuk SPK yang masih Open */
}

/* Detail Grid Style */
.detail-grid thead th {
  background-color: #cfd8dc !important;
  color: #37474f !important;
  font-size: 10px !important;
}
.detail-grid td { font-size: 11px !important; }

.table-card { border-radius: 12px; overflow: hidden; }
</style>