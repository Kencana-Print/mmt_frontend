<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { IconFileSpreadsheet } from "@tabler/icons-vue";
import api from "@/services/api";
import { exportExcelSingle, type ExcelColumn } from "@/utils/excelExport";

const toast = useToast();
// Route backend (belum di-mount di index.js):
//   app.use("/api/spanduk/lhk-jahit", clientCertAuth, lhkJahitSpandukRoutes)
// + routes GET /browse, GET /:nomor/detail
// → endpoint penuh: GET /api/spanduk/lhk-jahit/browse
const API_LHK_JAHIT = "/spanduk/lhk-jahit";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const search = ref("");

// Filter tanggal default 30 hari terakhir (DateRangeFilter bawaan BaseBrowse)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master (Delphi SQLMaster: Nomor/Tanggal/Kode_Pabrik/Nama_Pabrik/
// --- Kar_Borongan/Kar_Harian + agregat Jml_Jahit/Jml_SPK pola cetak) ---
const headers = computed(() => [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
  { title: "Kode Pabrik", key: "Kode_Pabrik", minWidth: "100px", align: "center" as const },
  { title: "Nama Pabrik", key: "Nama_Pabrik", minWidth: "160px" },
  { title: "Karyawan Borongan", key: "Kar_Borongan", minWidth: "140px", align: "end" as const },
  { title: "Karyawan Harian", key: "Kar_Harian", minWidth: "130px", align: "end" as const },
  { title: "Jumlah Jahit", key: "Jml_Jahit", minWidth: "110px", align: "end" as const },
  { title: "Jumlah SPK", key: "Jml_SPK", minWidth: "100px", align: "end" as const },
]);

// --- Headers Detail (Delphi SQLDetail: Nomor_SPK/Nama_SPK/Jumlah_Order/ ---
// --- Panjang/Lebar/Qty_Jahit/Tambah_Jahit/Tambah_Tali) ---
const detailHeaders = [
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "300px" },
  { title: "Jumlah Order", key: "Jumlah_Order", minWidth: "110px", align: "end" as const },
  { title: "Panjang", key: "Panjang", minWidth: "90px", align: "end" as const },
  { title: "Lebar", key: "Lebar", minWidth: "90px", align: "end" as const },
  { title: "Qty Jahit", key: "Qty_Jahit", minWidth: "100px", align: "end" as const },
  { title: "Tambah Jahit", key: "Tambah_Jahit", minWidth: "110px", align: "end" as const },
  { title: "Tambah Tali", key: "Tambah_Tali", minWidth: "110px", align: "end" as const },
];

const safeFormatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) return format(parsedDate, "dd/MM/yyyy");
    return "";
  } catch {
    return "";
  }
};

const fmtNum = (v: any): string => {
  const n = Number(v || 0);
  return n.toLocaleString("id-ID");
};

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_LHK_JAHIT}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data hasil kerja jahit.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand Detail: fetch per nomor (pola BastMapView) ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const res = await api.get(
      `${API_LHK_JAHIT}/${encodeURIComponent(nomor)}/detail`,
    );
    details.value[nomor] = res.data.data || res.data || [];
  } catch {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Row Click & Selection Style ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.Nomor) return;
  selected.value = selected.value.some((s) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s) => s.Nomor === itemData?.Nomor)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// Browse ini read-only: tidak ada form New/Edit/Delete
// (Delphi aslinya browse + refresh; hapus/cetak lewat form terpisah).
const handleCrud = () => {
  toast.warning("Browse hasil kerja jahit hanya untuk melihat data.");
};

// --- Export Header & Detail (pola BastMapView) ---
const isExportingHeader = ref(false);
const onExportHeader = async () => {
  if (!masterData.value.length)
    return toast.warning("Tidak ada data untuk diexport.");
  isExportingHeader.value = true;
  try {
    const columns: ExcelColumn[] = [
      { header: "Nomor", key: "Nomor", width: 18 },
      { header: "Tanggal", key: "Tanggal", width: 12, align: "center" },
      { header: "Kode Pabrik", key: "Kode_Pabrik", width: 12, align: "center" },
      { header: "Nama Pabrik", key: "Nama_Pabrik", width: 22 },
      { header: "Karyawan Borongan", key: "Kar_Borongan", width: 18, align: "right", numFmt: "#,##0" },
      { header: "Karyawan Harian", key: "Kar_Harian", width: 16, align: "right", numFmt: "#,##0" },
      { header: "Jumlah Jahit", key: "Jml_Jahit", width: 14, align: "right", numFmt: "#,##0" },
      { header: "Jumlah SPK", key: "Jml_SPK", width: 12, align: "right", numFmt: "#,##0" },
    ];
    const formattedData = masterData.value.map((item) => ({
      ...item,
      Tanggal: safeFormatDate(item.Tanggal),
      Kar_Borongan: Number(item.Kar_Borongan || 0),
      Kar_Harian: Number(item.Kar_Harian || 0),
      Jml_Jahit: Number(item.Jml_Jahit || 0),
      Jml_SPK: Number(item.Jml_SPK || 0),
    }));
    await exportExcelSingle(
      `HasilKerjaJahit_Header_${startDate.value}_to_${endDate.value}.xlsx`,
      "Hasil Kerja Jahit",
      columns,
      formattedData,
      `HASIL KERJA JAHIT SPANDUK (HEADER) | Periode: ${safeFormatDate(startDate.value)} s.d ${safeFormatDate(endDate.value)}`,
    );
    toast.success("Berhasil export header hasil kerja jahit.");
  } catch {
    toast.error("Gagal export header.");
  } finally {
    isExportingHeader.value = false;
  }
};

const isExportingDetail = ref(false);
const onExportDetail = async () => {
  if (!selected.value.length)
    return toast.warning("Pilih dulu satu Nomor untuk export detail.");
  const nomor = selected.value[0].Nomor;
  isExportingDetail.value = true;
  try {
    let dtl: any[] = details.value[nomor];
    if (!dtl) {
      const res = await api.get(
        `${API_LHK_JAHIT}/${encodeURIComponent(nomor)}/detail`,
      );
      dtl = res.data.data || res.data || [];
      details.value[nomor] = dtl;
    }
    if (!dtl.length) {
      toast.warning(`Tidak ada detail untuk Nomor ${nomor}.`);
      return;
    }
    const master = selected.value[0];
    const combinedRows: any[] = dtl.map((d: any) => ({
      Nomor: master.Nomor,
      Tanggal: safeFormatDate(master.Tanggal),
      Kode_Pabrik: master.Kode_Pabrik,
      Nama_Pabrik: master.Nama_Pabrik,
      Nomor_SPK: d.Nomor_SPK,
      Nama_SPK: d.Nama_SPK,
      Jumlah_Order: Number(d.Jumlah_Order || 0),
      Panjang: Number(d.Panjang || 0),
      Lebar: Number(d.Lebar || 0),
      Qty_Jahit: Number(d.Qty_Jahit || 0),
      Tambah_Jahit: Number(d.Tambah_Jahit || 0),
      Tambah_Tali: Number(d.Tambah_Tali || 0),
    }));
    const columns: ExcelColumn[] = [
      { header: "Nomor", key: "Nomor", width: 18 },
      { header: "Tanggal", key: "Tanggal", width: 12, align: "center" },
      { header: "Kode Pabrik", key: "Kode_Pabrik", width: 12, align: "center" },
      { header: "Nama Pabrik", key: "Nama_Pabrik", width: 20 },
      { header: "Nomor SPK", key: "Nomor_SPK", width: 18 },
      { header: "Nama SPK", key: "Nama_SPK", width: 34 },
      { header: "Jumlah Order", key: "Jumlah_Order", width: 14, align: "right", numFmt: "#,##0" },
      { header: "Panjang", key: "Panjang", width: 10, align: "right", numFmt: "#,##0.00" },
      { header: "Lebar", key: "Lebar", width: 10, align: "right", numFmt: "#,##0.00" },
      { header: "Qty Jahit", key: "Qty_Jahit", width: 12, align: "right", numFmt: "#,##0" },
      { header: "Tambah Jahit", key: "Tambah_Jahit", width: 14, align: "right", numFmt: "#,##0.00" },
      { header: "Tambah Tali", key: "Tambah_Tali", width: 12, align: "right", numFmt: "#,##0" },
    ];
    await exportExcelSingle(
      `HasilKerjaJahit_Detail_${nomor}.xlsx`,
      "Detail Hasil Kerja Jahit",
      columns,
      combinedRows,
      `RINCIAN HASIL KERJA JAHIT SPANDUK | Nomor: ${nomor}`,
    );
    toast.success("Berhasil export detail hasil kerja jahit.");
  } catch {
    toast.error("Gagal export detail.");
  } finally {
    isExportingDetail.value = false;
  }
};

// --- Watcher reaktif: ganti tanggal otomatis fetch ulang ---
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="lhk-jahit-wrapper">
    <BaseBrowse
      title="Hasil Kerja Jahit"
      icon="mdi-needle"
      :headers="headers"
      :items="masterData"
      item-value="Nomor"
      :loading="isLoading"
      :search="search"
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @action:new="handleCrud"
      @action:edit="handleCrud"
      @action:delete="handleCrud"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate"
    >
      <!-- Filter pencarian lokal -->
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor / Pabrik"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 280px"
        />
      </template>

      <!-- Tombol export -->
      <template #extra-actions>
        <v-btn
          size="small"
          variant="flat"
          color="green-darken-1"
          class="mr-2"
          :loading="isExportingHeader"
          @click="onExportHeader"
        >
          <template #prepend>
            <IconFileSpreadsheet :size="15" :stroke-width="1.7" />
          </template>
          Export Header
        </v-btn>
        <v-btn
          size="small"
          variant="flat"
          color="green-darken-1"
          :loading="isExportingDetail"
          @click="onExportDetail"
        >
          <template #prepend>
            <IconFileSpreadsheet :size="15" :stroke-width="1.7" />
          </template>
          Export Detail
        </v-btn>
      </template>

      <!-- Format tanggal -->
      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <!-- Format angka -->
      <template #item.Kar_Borongan="{ item }">
        <div class="text-right">{{ fmtNum(item.Kar_Borongan) }}</div>
      </template>
      <template #item.Kar_Harian="{ item }">
        <div class="text-right">{{ fmtNum(item.Kar_Harian) }}</div>
      </template>
      <template #item.Jml_Jahit="{ item }">
        <div class="text-right font-weight-bold">{{ fmtNum(item.Jml_Jahit) }}</div>
      </template>
      <template #item.Jml_SPK="{ item }">
        <div class="text-right">{{ fmtNum(item.Jml_SPK) }}</div>
      </template>

      <!-- Sub-grid detail -->
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
              <span class="text-caption">Memuat detail SPK jahit...</span>
            </div>

            <div
              v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
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
                <div class="text-right">{{ fmtNum(d.Jumlah_Order) }}</div>
              </template>
              <template #item.Qty_Jahit="{ item: d }">
                <div class="text-right">{{ fmtNum(d.Qty_Jahit) }}</div>
              </template>
              <template #item.Tambah_Jahit="{ item: d }">
                <div class="text-right">{{ fmtNum(d.Tambah_Jahit) }}</div>
              </template>
              <template #item.Tambah_Tali="{ item: d }">
                <div class="text-right">{{ fmtNum(d.Tambah_Tali) }}</div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.lhk-jahit-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
