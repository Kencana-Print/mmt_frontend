<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import api from "@/services/api";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { format, parseISO, isValid } from "date-fns";
import XLSX from "xlsx-js-style";

// --- STATE ---
const loading = ref(false);
const allData = ref([]);
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .substr(0, 10),
);
const endDate = ref(new Date().toISOString().substr(0, 10));
const searchQuery = ref("");

// --- TOTALS CALCULATION ---
const totals = computed(() => {
  return allData.value.reduce(
    (acc, item: any) => {
      acc.order += Number(item.spk_jumlah || 0);
      acc.jadi += Number(item.Jumlah_jadi || 0);
      acc.kirim += Number(item.Jumlah_kirim || 0);
      acc.stok += Number(item.stok_barang || 0);
      acc.sisa += Number(item.kurang_kirim || 0);
      acc.mJadi += Number(item.meter_jadi || 0);
      acc.mKirim += Number(item.meter_kirim || 0);
      return acc;
    },
    { order: 0, jadi: 0, kirim: 0, stok: 0, sisa: 0, mJadi: 0, mKirim: 0 },
  );
});

// --- FETCH DATA ---
const fetchReport = async () => {
  loading.value = true;
  try {
    const res = await api.get("mmt/laporan-barang-jadi", {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    allData.value = res.data.data || [];
  } finally {
    loading.value = false;
  }
};

// --- HELPERS ---
const formatNumber = (val: any, dec = 0) => {
  return Number(val || 0).toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

// --- EXPORT EXCEL ---
const exportExcel = () => {
  const fileName = `Lap_Barang_Jadi_MMT_${startDate.value}.xlsx`;
  const styleHeader = {
    fill: { fgColor: { rgb: "B3E5FC" } },
    font: { bold: true, sz: 10 },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };
  const styleCell = {
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
    font: { sz: 9 },
  };

  const wsData = [
    [{ v: "LAPORAN BARANG JADI MMT", s: { font: { bold: true, sz: 14 } } }],
    [
      {
        v: `Periode: ${formatDate(startDate.value)} - ${formatDate(endDate.value)}`,
      },
    ],
    [],
    // Row 1 Header
    [
      { v: "TANGGAL", s: styleHeader },
      { v: "NOMOR SPK", s: styleHeader },
      { v: "NAMA ORDER", s: styleHeader },
      { v: "KAIN", s: styleHeader },
      { v: "DIMENSI", s: styleHeader },
      "", // placeholder L
      { v: "JUMLAH ORDER", s: styleHeader },
      { v: "QUANTITY (PCS)", s: styleHeader },
      "", // placeholder Kirim
      "", // placeholder Stok
      "", // placeholder Sisa
      { v: "METER", s: styleHeader },
      "", // placeholder M.Kirim
    ],
    // Row 2 Header
    [
      "",
      "",
      "",
      "",
      { v: "P", s: styleHeader },
      { v: "L", s: styleHeader },
      "", // Jumlah Order (Merged vertically)
      { v: "JADI", s: styleHeader },
      { v: "KIRIM", s: styleHeader },
      { v: "STOK", s: styleHeader },
      { v: "SISA", s: styleHeader },
      { v: "M.JADI", s: styleHeader },
      { v: "M.KIRIM", s: styleHeader },
    ],
  ];

  allData.value.forEach((item: any) => {
    wsData.push([
      { v: formatDate(item.Tanggal), s: styleCell },
      { v: item.spk_nomor, s: styleCell },
      { v: item.spk_nama, s: styleCell },
      { v: item.spk_kain, s: styleCell },
      { v: item.Panjang, s: styleCell },
      { v: item.Lebar, s: styleCell },
      { v: item.spk_jumlah, s: styleCell },
      { v: item.Jumlah_jadi, s: styleCell },
      { v: item.Jumlah_kirim, s: styleCell },
      { v: item.stok_barang, s: styleCell },
      { v: item.kurang_kirim, s: styleCell },
      { v: item.meter_jadi, s: styleCell },
      { v: item.meter_kirim, s: styleCell },
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // MERGE LOGIC
  ws["!merges"] = [
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // Tanggal
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Nomor
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // Nama
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }, // Kain
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // Dimensi (Horz)
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } }, // JUMLAH ORDER (Vert)
    { s: { r: 3, c: 7 }, e: { r: 3, c: 10 } }, // Qty (Horz)
    { s: { r: 3, c: 11 }, e: { r: 3, c: 12 } }, // Meter (Horz)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Barang Jadi");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<template>
  <PageLayout title="Laporan Barang Jadi MMT" icon="mdi-package-variant">
    <v-card flat class="pa-2 border-bottom">
      <div class="d-flex align-center ga-3">
        <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />
        <v-btn color="primary" @click="fetchReport" :loading="loading"
          >Muat</v-btn
        >
        <v-btn
          color="success"
          prepend-icon="mdi-file-excel"
          @click="exportExcel"
          >Excel</v-btn
        >
        <v-spacer />
        <v-text-field
          v-model="searchQuery"
          placeholder="Cari..."
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 250px"
        />
      </div>
    </v-card>

    <div class="table-container mt-2">
      <v-data-table
        :items="allData"
        :search="searchQuery"
        :headers="[]"
        density="compact"
        class="mmt-table elevation-1"
        fixed-header
        height="calc(100vh - 250px)"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #thead>
          <thead>
            <tr class="header-main">
              <th rowspan="2">TANGGAL</th>
              <th rowspan="2">NOMOR SPK</th>
              <th rowspan="2">NAMA ORDER</th>
              <th rowspan="2">KAIN</th>
              <th colspan="2">DIMENSI</th>
              <th rowspan="2">JUMLAH ORDER</th>
              <th colspan="4">QUANTITY (PCS)</th>
              <th colspan="2">METER</th>
            </tr>
            <tr class="header-sub">
              <th style="width: 50px">P</th>
              <th style="width: 50px">L</th>
              <th style="width: 80px">JADI</th>
              <th style="width: 80px">KIRIM</th>
              <th style="width: 80px">STOK</th>
              <th style="width: 80px">SISA</th>
              <th style="width: 90px">M.JADI</th>
              <th style="width: 90px">M.KIRIM</th>
            </tr>
          </thead>
        </template>

        <template v-slot:item="{ item }">
          <tr>
            <td>{{ formatDate(item.Tanggal) }}</td>
            <td class="font-weight-bold text-center">{{ item.spk_nomor }}</td>
            <td class="text-left">{{ item.spk_nama }}</td>
            <td class="text-left">{{ item.spk_kain }}</td>
            <td class="text-right">{{ formatNumber(item.Panjang, 2) }}</td>
            <td class="text-right">{{ formatNumber(item.Lebar, 2) }}</td>
            <td class="text-right font-weight-bold">
              {{ formatNumber(item.spk_jumlah) }}
            </td>
            <td class="text-right text-blue font-weight-bold">
              {{ formatNumber(item.Jumlah_jadi) }}
            </td>
            <td class="text-right text-success font-weight-bold">
              {{ formatNumber(item.Jumlah_kirim) }}
            </td>
            <td class="text-right">{{ formatNumber(item.stok_barang) }}</td>
            <td class="text-right text-error font-weight-bold">
              {{ formatNumber(item.kurang_kirim) }}
            </td>
            <td class="text-right">{{ formatNumber(item.meter_jadi, 2) }}</td>
            <td class="text-right">{{ formatNumber(item.meter_kirim, 2) }}</td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </PageLayout>
</template>

<style scoped>
.table-container {
  border: 1px solid #7bdaff;
  border-radius: 4px;
  overflow: hidden;
}

.mmt-table :deep(thead th) {
  background-color: #b3e5fc !important;
  color: #000 !important;
  font-size: 10px !important;
  font-weight: bold !important;
  text-align: center !important;
  border: 1px solid #7bdaff !important;
  text-transform: uppercase;
}

.mmt-table :deep(.header-sub th) {
  background-color: #e1f5fe !important;
}

.mmt-table :deep(tbody td) {
  font-size: 11px !important;
  border: 0.5px solid #eee !important;
  padding: 4px 8px !important;
}

.text-blue {
  color: #1565c0;
}
.text-success {
  color: #2e7d32;
}
.text-error {
  color: #d32f2f;
}
</style>
