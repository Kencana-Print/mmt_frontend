<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { format, startOfYear, endOfYear } from "date-fns";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

/** --- CONFIGURATION: TABLE HEADERS --- 
 * Replikasi cxgrdbndtblvwGrid1DBBandedTableView1 (Banded Header)
 */
const tableHeaders = [
  { title: "TAHUN", key: "tahun", width: "80px", fixed: true },
  { title: "BULAN", key: "nama_bulan", width: "120px", fixed: true },
  {
    title: "OUTPUT METER (m2)",
    align: "center",
    children: [
      { title: "MT01", key: "MT01", width: "100px", align: 'end' },
      { title: "MT02", key: "MT02", width: "100px", align: 'end' },
      { title: "MT03", key: "MT03", width: "100px", align: 'end' },
      { title: "MT04", key: "MT04", width: "100px", align: 'end' },
      { title: "MT05", key: "MT05", width: "100px", align: 'end' },
      { title: "TOTAL", key: "Total_Meter", width: "120px", align: 'end', class: 'font-weight-bold bg-grey-lighten-4' },
    ],
  },
  {
    title: "PERSENTASE (%)",
    align: "center",
    children: [
      { title: "MT01 %", key: "MT01_p", width: "90px", align: 'end' },
      { title: "MT02 %", key: "MT02_p", width: "90px", align: 'end' },
      { title: "MT03 %", key: "MT03_p", width: "90px", align: 'end' },
      { title: "MT04 %", key: "MT04_p", width: "90px", align: 'end' },
      { title: "MT05 %", key: "MT05_p", width: "90px", align: 'end' },
      { title: "TOTAL %", key: "Total_Meter_p", width: "90px", align: 'end' },
    ],
  },
];

/** --- STATE MANAGEMENT --- */
const loading = ref(false);
const allData = ref([]);
const startDate = ref(format(startOfYear(new Date()), 'yyyy-MM-dd'));
const endDate = ref(format(endOfYear(new Date()), 'yyyy-MM-dd'));
const searchQuery = ref("");

/** --- COMPUTED: TOTALS (FooterSummary Delphi Implementation) --- */
const summaryTotals = computed(() => {
  const totals = allData.value.reduce((acc, item) => {
    acc.mt01 += Number(item.MT01 || 0);
    acc.mt02 += Number(item.MT02 || 0);
    acc.mt03 += Number(item.MT03 || 0);
    acc.mt04 += Number(item.MT04 || 0);
    acc.mt05 += Number(item.MT05 || 0);
    acc.grandTotal += Number(item.Total_Meter || 0);
    return acc;
  }, { mt01: 0, mt02: 0, mt03: 0, mt04: 0, mt05: 0, grandTotal: 0 });

  // Kalkulasi Persentase Footer (Mirip TcxDataSummaryFooterSummaryItems Delphi)
  const calcP = (val: number) => totals.grandTotal > 0 ? (val / totals.grandTotal) * 100 : 0;

  return {
    ...totals,
    mt01p: calcP(totals.mt01),
    mt02p: calcP(totals.mt02),
    mt03p: calcP(totals.mt03),
    mt04p: calcP(totals.mt04),
    mt05p: calcP(totals.mt05),
    totalp: 100
  };
});

/** --- METHODS --- */
const fetchReport = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('mmt/report-output-mesin', {
      params: { startDate: startDate.value, endDate: endDate.value }
    });
    allData.value = data.data || [];
  } catch (error) {
    console.error("Gagal load data output mesin:", error);
  } finally {
    loading.value = false;
  }
};

const nFormat = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString('id-ID', { 
    minimumFractionDigits: dec, 
    maximumFractionDigits: dec 
  });
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan Output By Mesin" icon="mdi-engine">
    <v-container fluid class="pa-4 bg-background-light">
      
      <v-card flat class="mb-4 pa-4 border-sm rounded-lg shadow-sm">
        <v-row dense align="center">
          <v-col cols="12" sm="auto" class="d-flex align-center ga-3">
            <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />
            <v-btn color="indigo-darken-2" icon="mdi-refresh" size="small" @click="fetchReport" :loading="loading" />
          </v-col>
          <v-spacer />
          <v-col cols="12" sm="3">
            <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" placeholder="Cari Tahun/Bulan..." density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="auto">
            <v-btn color="green-darken-2" prepend-icon="mdi-file-excel" variant="elevated" size="small" @click="() => {}">
              EXPORT EXCEL
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <v-card flat class="border-sm rounded-lg overflow-hidden elevation-2">
        <v-data-table
          :headers="tableHeaders"
          :items="allData"
          :search="searchQuery"
          :loading="loading"
          density="compact"
          fixed-header
          height="calc(100vh - 300px)"
          class="output-mesin-table"
        >
          <template v-for="col in ['MT01','MT02','MT03','MT04','MT05','Total_Meter']" 
                    :key="col" v-slot:[`item.${col}`]="{ value }">
            <span class="font-weight-medium grey--text text--darken-3">
              {{ nFormat(value, 0) }}
            </span>
          </template>

          <template v-for="pCol in ['MT01_p','MT02_p','MT03_p','MT04_p','MT05_p','Total_Meter_p']" 
                    :key="pCol" v-slot:[`item.${pCol}`]="{ value }">
            <span class="text-caption font-italic text-blue-darken-2">
              {{ nFormat(value, 2) }}%
            </span>
          </template>

          <template #tfoot>
            <tr class="footer-summary font-weight-black bg-blue-grey-lighten-5">
              <td colspan="2" class="text-right">GRAND TOTAL</td>
              <td class="text-right">{{ nFormat(summaryTotals.mt01) }}</td>
              <td class="text-right">{{ nFormat(summaryTotals.mt02) }}</td>
              <td class="text-right">{{ nFormat(summaryTotals.mt03) }}</td>
              <td class="text-right">{{ nFormat(summaryTotals.mt04) }}</td>
              <td class="text-right">{{ nFormat(summaryTotals.mt05) }}</td>
              <td class="text-right bg-grey-lighten-2">{{ nFormat(summaryTotals.grandTotal) }}</td>
              <td class="text-right text-indigo">{{ nFormat(summaryTotals.mt01p, 2) }}%</td>
              <td class="text-right text-indigo">{{ nFormat(summaryTotals.mt02p, 2) }}%</td>
              <td class="text-right text-indigo">{{ nFormat(summaryTotals.mt03p, 2) }}%</td>
              <td class="text-right text-indigo">{{ nFormat(summaryTotals.mt04p, 2) }}%</td>
              <td class="text-right text-indigo">{{ nFormat(summaryTotals.mt05p, 2) }}%</td>
              <td class="text-right font-weight-black">{{ nFormat(summaryTotals.totalp, 2) }}%</td>
            </tr>
          </template>
        </v-data-table>
      </v-card>

      

    </v-container>
  </PageLayout>
</template>

<style scoped>
/* Replikasi UI Delphi (Dark Grey Headers & Banded Borders) */
.output-mesin-table :deep(thead th) {
  background-color: #2c3e50 !important;
  color: #ecf0f1 !important;
  font-size: 0.7rem !important;
  font-weight: 900 !important;
  border: 1px solid #34495e !important;
  text-transform: uppercase;
  height: 44px !important;
}

.output-mesin-table :deep(td) {
  font-size: 0.75rem !important;
  border-right: 1px solid #eeeeee;
  padding: 0 10px !important;
}

.output-mesin-table :deep(tbody tr:nth-child(even)) {
  background-color: #fcfcfc;
}

.output-mesin-table :deep(tbody tr:hover) {
  background-color: #e8f4fd !important;
}

.date-picker-input {
  max-width: 160px;
}

.footer-summary td {
  padding: 10px !important;
  border-top: 3px double #2c3e50 !important;
  font-size: 0.75rem;
  text-align: right;
}

.bg-background-light {
  background-color: #f4f7f6;
}
</style>