<template>
  <PageLayout title="Rekap LHK Produksi" icon="mdi-chart-box">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="primary"
        variant="tonal"
        class="mr-2"
        @click="exportOutputDigitalPrint"
        :disabled="filteredPerMesin.length === 0"
      >
        <v-icon start>mdi-microsoft-excel</v-icon> Export Model Digital Print
      </v-btn>

      <v-btn
        size="x-small"
        color="success"
        @click="exportToExcel"
        :disabled="filteredPerMesin.length === 0"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel Biasa
      </v-btn>
    </template>

    <div class="pa-4 bg-grey-lighten-4" style="min-height: 100vh">
      <!-- BAR FILTER -->
      <v-card class="mb-4 border shadow-sm">
        <v-card-text class="d-flex align-center flex-wrap ga-4">
          <DateRangeFilter v-model:start-date="filters.start" v-model:end-date="filters.end" />

          <!-- FILTER KATEGORI (MMT / TEKSTIL / SUBLIM) -->
          <div style="width: 200px">
            <v-select
              v-model="filters.kategori"
              :items="listKategori"
              item-title="title"
              item-value="value"
              label="Kategori LHK"
              density="compact"
              variant="outlined"
              hide-details
              bg-color="white"
            />
          </div>

          <v-btn
            color="primary"
            prepend-icon="mdi-magnify"
            :loading="loading"
            @click="loadRekap"
          >
            Proses
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row>
        <!-- TABEL PRODUKTIVITAS MESIN -->
        <v-col cols="12" md="8">
          <v-card variant="outlined" class="bg-white elevation-2">
            <v-card-title
              class="bg-blue-darken-3 text-white text-subtitle-2 d-flex align-center"
            >
              <v-icon start size="small">mdi-engine</v-icon>
              Produktivitas Per Mesin
            </v-card-title>

            <v-data-table
              v-model:expanded="expanded"
              :headers="headersMesin"
              :items="filteredPerMesin"
              show-expand
              item-value="Mesin"
              density="compact"
              class="custom-table"
              @update:expanded="loadDetailSpk"
            >
              <!-- KATEGORI CHIP -->
              <template #[`item.Kategori`]="{ value }">
                <v-chip
                  size="x-small"
                  :color="getKategoriColor(value)"
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ value }}
                </v-chip>
              </template>

              <!-- TOTAL METER -->
              <template #[`item.Total_Meter`]="{ value }">
                <b class="text-primary">{{ formatNumber(value, 2) }} m²</b>
              </template>

              <!-- KAPASITAS -->
              <template #[`item.Kapasitas`]="{ item }">
                {{ formatNumber(item.Kapasitas * selectedDaysCount, 0) }} m²
              </template>

              <!-- PERSENTASE / LOAD -->
              <template #[`item.Persentase`]="{ item }">
                <v-chip
                  size="small"
                  :color="
                    calculatePercent(
                      item.Total_Meter,
                      item.Kapasitas * selectedDaysCount,
                    ) > 100
                      ? 'error'
                      : 'success'
                  "
                  variant="flat"
                >
                  {{
                    calculatePercent(
                      item.Total_Meter,
                      item.Kapasitas * selectedDaysCount,
                    )
                  }}%
                </v-chip>
              </template>

              <!-- JUMLAH SPK -->
              <template #[`item.Jml_SPK`]="{ value }">
                {{ formatNumber(value, 0) }}
              </template>

              <!-- DETAIL EXPANDED ROW -->
              <template #expanded-row="{ columns, item }">
                <tr>
                  <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
                    <v-card variant="flat" border class="elevation-1">
                      <v-card-title
                        class="text-caption font-weight-bold bg-grey-lighten-2 py-1"
                      >
                        Rincian SPK - Mesin {{ item.Mesin }} ({{
                          item.Kategori
                        }})
                      </v-card-title>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th class="text-left">NO SPK</th>
                            <th class="text-left">NAMA ORDER</th>
                            <th class="text-right">PCS</th>
                            <th class="text-right">METER (M²)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="loadingDetail">
                            <td colspan="4" class="text-center pa-4">
                              <v-progress-circular
                                indeterminate
                                size="20"
                                width="2"
                                color="primary"
                                class="mr-2"
                              />
                              Memuat detail...
                            </td>
                          </tr>
                          <tr
                            v-else-if="
                              !detailSpkPerMesin[item.Mesin] ||
                              detailSpkPerMesin[item.Mesin].length === 0
                            "
                          >
                            <td colspan="4" class="text-center pa-2 text-grey">
                              Tidak ada detail SPK
                            </td>
                          </tr>
                          <tr
                            v-else
                            v-for="spk in detailSpkPerMesin[item.Mesin]"
                            :key="spk.No_SPK"
                          >
                            <td>{{ spk.No_SPK }}</td>
                            <td>{{ spk.Nama_Order }}</td>
                            <td class="text-right">
                              {{ formatNumber(spk.Total_Pcs, 0) }}
                            </td>
                            <td
                              class="text-right font-weight-bold text-blue-darken-2"
                            >
                              {{ formatNumber(spk.Total_Meter, 2) }} m²
                            </td>
                          </tr>
                        </tbody>
                      </v-table>
                    </v-card>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card>
        </v-col>

        <!-- KARTU SUMMARY TOTAL & INFORMASI -->
        <v-col cols="12" md="4">
          <v-card
            color="indigo-darken-3"
            theme="dark"
            class="mb-4 elevation-4 overflow-hidden"
          >
            <v-card-text class="text-center py-8 relative">
              <div class="text-overline opacity-70">GRAND TOTAL PRODUKSI</div>
              <div class="text-h3 font-weight-bold mb-1">
                {{ formatNumber(totalAllMeter, 2) }}
              </div>
              <div class="text-h6 opacity-80">METER PERSEGI (M²)</div>
              <v-icon
                size="120"
                class="position-absolute"
                style="
                  right: -20px;
                  bottom: -20px;
                  opacity: 0.1;
                  transform: rotate(-15deg);
                "
                >mdi-printer-3d</v-icon
              >
            </v-card-text>
          </v-card>

          <v-card variant="outlined" class="bg-white border-blue-lighten-3">
            <v-card-title class="text-subtitle-2 d-flex align-center">
              <v-icon start color="info">mdi-information-outline</v-icon>
              Informasi Laporan
            </v-card-title>
            <v-divider />
            <v-card-text class="text-caption text-grey-darken-1">
              <ul class="ml-4">
                <li>Data gabungan dari LHK MMT, Tekstil, dan Sublim.</li>
                <li>Rumus m²: (Panjang x Lebar) x Jumlah Cetak.</li>
                <li>
                  Gunakan filter kategori untuk memfilter data per divisi.
                </li>
                <li>
                  Klik ikon panah pada baris mesin untuk melihat rincian SPK.
                </li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useToast } from "vue-toastification";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import api from "@/services/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

// --- STATE ---
const toast = useToast();
const loading = ref(false);
const expanded = ref([]);
const detailSpkPerMesin = ref({});
const loadingDetail = ref(false);

const filters = reactive({
  start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  end: format(new Date(), "yyyy-MM-dd"),
  kategori: "ALL", // Default: Semua Kategori
});

const listKategori = [
  { title: "Semua Kategori", value: "ALL" },
  { title: "Cetak (MMT)", value: "MMT" },
  { title: "Mesin Tekstil", value: "TEKSTIL" },
  { title: "Finishing", value: "FINISHING" },
  { title: "Paperprint", value: "PAPERPRINT" },
  { title: "Sublim", value: "SUBLIM" },
];

const dataRekap = ref({
  perMesin: [] as any[],
  perHari: [] as any[],
});

// --- FILTERED COMPUTED DATA ---
const filteredPerMesin = computed(() => {
  if (!dataRekap.value.perMesin) return [];
  if (filters.kategori === "ALL") return dataRekap.value.perMesin;
  return dataRekap.value.perMesin.filter(
    (item) => item.Kategori === filters.kategori,
  );
});

const filteredPerHari = computed(() => {
  if (!dataRekap.value.perHari) return [];
  if (filters.kategori === "ALL") return dataRekap.value.perHari;
  return dataRekap.value.perHari.filter(
    (item) => item.Kategori === filters.kategori,
  );
});

// --- HEADERS ---
const headersMesin = computed(() => [
  { title: "MESIN", key: "Mesin", align: "start", sortable: true },
  { title: "KATEGORI", key: "Kategori", align: "center", sortable: true },
  {
    title: `KAPASITAS (${selectedDaysCount.value} hr) (M²)`,
    key: "Kapasitas",
    align: "end",
    sortable: true,
  },
  { title: "TOTAL PCS", key: "Total_Pcs", align: "end", sortable: true },
  { title: "TOTAL M²", key: "Total_Meter", align: "end", sortable: true },
  { title: "LOAD (%)", key: "Persentase", align: "center", sortable: true },
  { title: "JML SPK", key: "Jml_SPK", align: "end", sortable: true },
  { title: "", key: "data-table-expand" },
]);

// --- HELPER COLOR ---
const getKategoriColor = (kat: string) => {
  switch (kat) {
    case "MMT":
      return "blue-darken-1";
    case "TEKSTIL":
      return "purple-darken-1";
    case "FINISHING":
      return "green-darken-1";
    case "PAPERPRINT":
      return "indigo-darken-1";
    case "SUBLIM":
      return "orange-darken-2";
    default:
      return "grey-darken-1";
  }
};

const formatNumber = (val: any, decimal = 0) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
};

const selectedDaysCount = computed(() => {
  if (!filters.start || !filters.end) return 1;

  const start = new Date(filters.start);
  const end = new Date(filters.end);
  const diff = differenceInCalendarDays(end, start) + 1;
  return diff > 0 ? diff : 1;
});

const calculatePercent = (total: number, kapasitas: number) => {
  if (!kapasitas || kapasitas === 0) return 0;
  const percent = (total / kapasitas) * 100;
  return percent.toFixed(1);
};

// --- API METHODS ---
// const loadDetailSpk = async (expandedKeys: any[]) => {
//   if (expandedKeys.length === 0) return;

//   const mesin = expandedKeys[expandedKeys.length - 1];
//   if (detailSpkPerMesin.value[mesin]) return;

//   loadingDetail.value = true;
//   try {
//     // ENDPOINT TERHUBUNG KE LAPLHK SERVICE BARU
//     const res = await api.get("/mmt/laporan-lhk/detail-mesin", {
//       params: {
//         startDate: filters.start,
//         endDate: filters.end,
//         mesin: mesin,
//       },
//     });
//     detailSpkPerMesin.value[mesin] = res.data.data;
//   } catch (err) {
//     toast.error("Gagal memuat detail SPK");
//   } finally {
//     loadingDetail.value = false;
//   }
// };

watch(expanded, async (newExpanded) => {
  if (newExpanded.length === 0) return;

  // Ambil mesin terakhir yang dibuka
  const mesin = newExpanded[newExpanded.length - 1];

  // Jika data sudah ada di state, tidak perlu fetch ulang
  if (detailSpkPerMesin.value[mesin]) return;

  loadingDetail.value = true;
  try {
    const res = await api.get("/mmt/laporan-lhk/detail-mesin", {
      params: {
        startDate: filters.start,
        endDate: filters.end,
        mesin: mesin,
      },
    });

    // Simpan data detail berdasarkan nama/kode mesin
    detailSpkPerMesin.value[mesin] = res.data.data || [];
  } catch (err) {
    toast.error(`Gagal memuat detail SPK untuk mesin ${mesin}`);
  } finally {
    loadingDetail.value = false;
  }
});

const loadRekap = async () => {
  loading.value = true;
  detailSpkPerMesin.value = {};
  expanded.value = [];

  try {
    // ENDPOINT TERHUBUNG KE LAPLHK SERVICE BARU
    const response = await api.get("/mmt/laporan-lhk/rekap", {
      params: {
        startDate: filters.start,
        endDate: filters.end,
      },
    });

    if (response.data && response.data.success) {
      dataRekap.value = {
        perMesin: response.data.data.rekapMesin || [],
        perHari: response.data.data.rekapHarian || [],
      };
      toast.success("Data rekap berhasil dimuat");
    }
  } catch (error) {
    toast.error("Gagal memuat rekap LHK");
  } finally {
    loading.value = false;
  }
};

const totalAllMeter = computed(() => {
  return filteredPerMesin.value.reduce(
    (acc, curr) => acc + Number(curr.Total_Meter || 0),
    0,
  );
});

// --- EXPORT EXCEL BIASA ---
const exportToExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rekap Produksi");

  const num = (value: any) => {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  worksheet.columns = [
    { header: "Kategori", key: "Kategori", width: 15 },
    { header: "Mesin", key: "Mesin", width: 15 },
    {
      header: `Kapasitas (${selectedDaysCount.value} hr)`,
      key: "KapasitasDinamis",
      width: 20,
    },
    { header: "Total Meter (M²)", key: "Total_Meter", width: 20 },
    { header: "Load (%)", key: "Load", width: 15 },
  ];

  filteredPerMesin.value.forEach((item) => {
    const kapTotal = num(item.Kapasitas) * num(selectedDaysCount.value);
    const persenValue = kapTotal > 0 ? num(item.Total_Meter) / kapTotal : 0;

    const row = worksheet.addRow({
      Kategori: item.Kategori,
      Mesin: item.Mesin,
      KapasitasDinamis: kapTotal,
      Total_Meter: num(item.Total_Meter),
      Load: persenValue,
    });

    row.getCell("KapasitasDinamis").numFmt = "#,##0.00";
    row.getCell("Total_Meter").numFmt = "#,##0.00";
    row.getCell("Load").numFmt = "0.0%";

    row.getCell("KapasitasDinamis").alignment = { horizontal: "right" };
    row.getCell("Total_Meter").alignment = { horizontal: "right" };
    row.getCell("Load").alignment = { horizontal: "right" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Rekap_LHK_${filters.kategori}_${filters.start}_to_${filters.end}.xlsx`,
  );
};

// --- EXPORT MODEL DIGITAL PRINT ---
const exportOutputDigitalPrint = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("OUTPUT DIGITAL PRINT");

  const num = (value: any) => {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  worksheet.addRow(["OUT PUT DIGITAL PRINT"]).font = { bold: true, size: 14 };
  worksheet.addRow(["BOYOLALI"]).font = { bold: true };
  worksheet.addRow([
    "BULAN :",
    format(new Date(filters.start), "MMMM yyyy"),
  ]).font = { bold: true };
  worksheet.addRow([
    "DIVISI :",
    filters.kategori === "ALL"
      ? "DIVISI DIGITAL PRINT (GABUNGAN)"
      : `DIVISI ${filters.kategori}`,
  ]).font = { bold: true };
  worksheet.addRow([]);

  const startObj = new Date(filters.start);
  const daysInMonth = new Date(
    startObj.getFullYear(),
    startObj.getMonth() + 1,
    0,
  ).getDate();

  const header1 = ["DIVISI", "SATUAN", "TARGET / HARI"];
  const header2 = ["", "", ""];

  for (let i = 1; i <= daysInMonth; i++) {
    header1.push("OUT PUT");
    header2.push(
      format(
        new Date(startObj.getFullYear(), startObj.getMonth(), i),
        "dd-MMM",
      ),
    );
  }
  header1.push("JUMLAH");
  header2.push("");

  worksheet.addRow(header1);
  worksheet.addRow(header2);

  worksheet.mergeCells("A6:A7");
  worksheet.mergeCells("B6:B7");
  worksheet.mergeCells("C6:C7");

  const lastOutPutCol = 3 + daysInMonth;
  worksheet.mergeCells(6, 4, 6, lastOutPutCol);

  const jumlahColIndex = 4 + daysInMonth;
  worksheet.mergeCells(6, jumlahColIndex, 7, jumlahColIndex);

  filteredPerMesin.value.forEach((item) => {
    const rowData = [item.Mesin, "meter", item.Target ? num(item.Target) : ""];

    let totalBaris = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const dailyData = filteredPerHari.value.find((h) => {
        const hDate = new Date(h.Tanggal);
        const tglData = hDate.getDate();
        return h.Mesin === item.Mesin && tglData === i;
      });

      const val = dailyData ? num(dailyData.Total_Meter) : 0;
      rowData.push(val);
      totalBaris += val;
    }
    rowData.push(totalBaris);

    const dataRow = worksheet.addRow(rowData);

    if (item.Target) {
      dataRow.getCell(3).numFmt = "#,##0.00";
      dataRow.getCell(3).alignment = { horizontal: "right" };
    }

    for (let colIdx = 4; colIdx <= jumlahColIndex; colIdx++) {
      const cell = dataRow.getCell(colIdx);
      cell.numFmt = "#,##0.00";
      cell.alignment = { horizontal: "right" };
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      if (rowNumber > 7 && colNumber >= 3) {
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (rowNumber === 6 || rowNumber === 7) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF200" },
        };
        cell.font = { bold: true, size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }

      if (colNumber === jumlahColIndex && rowNumber > 5) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF200" },
        };
        cell.font = { bold: true };
      }
    });
  });

  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 10;
  worksheet.getColumn(jumlahColIndex).width = 15;

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `Output_Digital_Print_${filters.kategori}_${format(startObj, "MMM_yyyy")}.xlsx`,
  );
};

// --- LIFECYCLE ---
onMounted(() => {
  loadRekap();
});
</script>

<style scoped>
.custom-table :deep(th) {
  font-weight: bold !important;
  color: #555 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  background-color: #f8f9fa !important;
}

.custom-table :deep(td) {
  font-size: 0.875rem !important;
}

.border-blue-lighten-3 {
  border: 1px solid #bbdefb !important;
}

.relative {
  position: relative;
}
</style>
