<template>
  <PageLayout
    title="Laporan Komparasi Plan VS LHK Cetak"
    icon="mdi-scale-balance"
  >
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="reportData.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel Komparasi
      </v-btn>
    </template>

    <div class="pa-4 bg-grey-lighten-4" style="min-height: 100vh">
      <v-card class="mb-4 border shadow-sm">
        <v-card-text class="d-flex align-center flex-wrap ga-4">
          <DateRangeFilter v-model:start-date="filters.start" v-model:end-date="filters.end" />
          <v-btn
            color="primary"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="loadReportData"
          >
            Proses Komparasi
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row class="mb-2">
        <v-col cols="12" md="4">
          <v-card color="blue-darken-3" theme="dark" class="elevation-2">
            <v-card-text class="text-center py-4">
              <div class="text-overline opacity-70">TOTAL PLAN (M²)</div>
              <div class="text-h4 font-weight-bold">
                {{ formatNumber(summary.totalPlan, 2) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card color="green-darken-3" theme="dark" class="elevation-2">
            <v-card-text class="text-center py-4">
              <div class="text-overline opacity-70">TOTAL LHK (M²)</div>
              <div class="text-h4 font-weight-bold">
                {{ formatNumber(summary.totalLhk, 2) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card
            :color="
              summary.avgAchieved >= 100 ? 'teal-darken-3' : 'amber-darken-4'
            "
            theme="dark"
            class="elevation-2"
          >
            <v-card-text class="text-center py-4">
              <div class="text-overline opacity-70">RATA-RATA CAPAIAN</div>
              <div class="text-h4 font-weight-bold">
                {{ summary.avgAchieved }}%
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card variant="outlined" class="bg-white elevation-2">
        <v-data-table
          :headers="headers"
          :items="reportData"
          :loading="loading"
          density="compact"
          class="custom-table"
          hover
        >
          <template #[`item.Plan_M2`]="{ item }">
            <div class="text-right">
              <div>{{ formatNumber(item.Plan_M2, 2) }} m²</div>
              <div class="text-caption text-grey">{{ item.Plan_Qty }} pcs</div>
            </div>
          </template>

          <template #[`item.Lhk_M2`]="{ item }">
            <div class="text-right">
              <div class="font-weight-bold text-blue-darken-2">
                {{ formatNumber(item.Lhk_M2, 2) }} m²
              </div>
              <div class="text-caption text-grey">{{ item.Lhk_Qty }} pcs</div>
            </div>
          </template>

          <template #[`item.Deviasi_M2`]="{ value }">
            <span
              :class="
                value < 0
                  ? 'text-red font-weight-bold'
                  : 'text-green font-weight-bold'
              "
            >
              {{ value > 0 ? "+" : "" }}{{ formatNumber(value, 2) }} m²
            </span>
          </template>

          <template #[`item.Persentase`]="{ item }">
            <v-chip
              size="x-small"
              :color="getAchievedColor(item.Persentase)"
              variant="flat"
              class="font-weight-bold"
            >
              {{ item.Persentase }}%
            </v-chip>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

// --- INTERFACES ---
interface PlanVsLhkRow {
  Mesin: string;
  NomorSPK: string;
  NamaSPK: string;
  Bahan: string;
  Lebar: number;
  Panjang: number;
  Plan_Qty: number;
  Plan_M2: number;
  Lhk_Qty: number;
  Lhk_M2: number;
  Deviasi_M2: number;
  Persentase: number;
}

// --- STATE ---
const toast = useToast();
const loading = ref(false);
const reportData = ref<PlanVsLhkRow[]>([]);

const filters = reactive({
  start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  end: format(new Date(), "yyyy-MM-dd"),
});

// --- HEADERS ---
const headers = [
  { title: "MESIN", key: "Mesin", align: "start" as const, sortable: true },
  { title: "NO SPK", key: "NomorSPK", align: "start" as const },
  {
    title: "NAMA ORDER / SPK",
    key: "NamaSPK",
    align: "start" as const,
    width: "220px",
  },
  { title: "BAHAN", key: "Bahan", align: "start" as const },
  { title: "PLAN (M²)", key: "Plan_M2", align: "end" as const, sortable: true },
  {
    title: "LHK REALISASI (M²)",
    key: "Lhk_M2",
    align: "end" as const,
    sortable: true,
  },
  {
    title: "DEVIASI",
    key: "Deviasi_M2",
    align: "end" as const,
    sortable: true,
  },
  {
    title: "% CAPAIAN",
    key: "Persentase",
    align: "center" as const,
    sortable: true,
  },
];

// --- ANALYTICS SUMMARY ---
const summary = computed(() => {
  const totalPlan = reportData.value.reduce(
    (acc, curr) => acc + Number(curr.Plan_M2 || 0),
    0,
  );
  const totalLhk = reportData.value.reduce(
    (acc, curr) => acc + Number(curr.Lhk_M2 || 0),
    0,
  );
  const avgAchieved =
    totalPlan > 0 ? Number(((totalLhk / totalPlan) * 100).toFixed(1)) : 0;
  return { totalPlan, totalLhk, avgAchieved };
});

// --- METHODS ---
const formatNumber = (val: any, decimal = 0) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
};

const getAchievedColor = (val: number) => {
  if (val >= 100) return "success";
  if (val >= 85) return "warning";
  return "error";
};

const loadReportData = async () => {
  loading.value = true;
  try {
    const response = await api.get("/mmt/laporan-plan-vs-lhk", {
      params: {
        startDate: filters.start,
        endDate: filters.end,
      },
    });

    if (response.data && response.data.success) {
      reportData.value = response.data.data;
      toast.success("Laporan berhasil diperbarui");
    }
  } catch (error) {
    toast.error("Gagal memuat laporan komparasi");
  } finally {
    loading.value = false;
  }
};

const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("PLAN VS LHK");

  worksheet.addRow(["LAPORAN KOMPARASI PLAN VS LHK CETAK"]).font = {
    bold: true,
    size: 14,
  };
  worksheet.addRow([`PERIODE: ${filters.start} s/d ${filters.end}`]).font = {
    bold: true,
  };
  worksheet.addRow([]);

  worksheet.columns = [
    { header: "Mesin", key: "Mesin", width: 15 },
    { header: "No SPK", key: "No_SPK", width: 15 },
    { header: "Nama SPK / Order", key: "NamaSPK", width: 30 },
    { header: "Bahan", key: "Bahan", width: 20 },
    { header: "Plan (M²)", key: "Plan_Meter", width: 15 },
    { header: "LHK Realisasi (M²)", key: "Lhk_Meter", width: 15 },
    { header: "Deviasi (M²)", key: "Deviasi", width: 15 },
    { header: "Capaian (%)", key: "Persentase", width: 15 },
  ];

  reportData.value.forEach((item) => {
    const row = worksheet.addRow({
      Mesin: item.Mesin,
      No_SPK: item.NomorSPK,
      NamaSPK: item.NamaSPK,
      Bahan: item.Bahan,
      Plan_Meter: Number(item.Plan_M2 || 0),
      Lhk_Meter: Number(item.Lhk_M2 || 0),
      Deviasi: Number(item.Deviasi_M2 || 0),
      Persentase: Number(item.Persentase || 0) / 100,
    });

    // Format Numbering cell
    ["Plan_Meter", "Lhk_Meter", "Deviasi"].forEach((k) => {
      row.getCell(k).numFmt = "#,##0.00";
      row.getCell(k).alignment = { horizontal: "right" };
    });
    row.getCell("Persentase").numFmt = "0.0%";
    row.getCell("Persentase").alignment = { horizontal: "right" };
  });

  // Styling header tabel Excel
  worksheet.getRow(4).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E88E5" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Laporan_Plan_VS_LHK_${filters.start}.xlsx`);
};

// --- LIFECYCLE ---
onMounted(loadReportData);
</script>

<style scoped>
.custom-table :deep(th) {
  font-weight: bold !important;
  color: #333 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  background-color: #eeeeee !important;
}
.custom-table :deep(td) {
  font-size: 0.825rem !important;
}
</style>
