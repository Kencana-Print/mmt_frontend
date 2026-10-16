<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import { IconFileSpreadsheet } from "@tabler/icons-vue";
import api from "@/services/api";
import { exportExcelSingle, type ExcelColumn } from "@/utils/excelExport";

const toast = useToast();
// Route backend: index.js → app.use("/api/spanduk/mutasi-bahan", mutasiBahanRoutes)
// + routes GET /browse → endpoint penuh: GET /api/spanduk/mutasi-bahan/browse
const API_MUTASI_BAHAN = "/spanduk/mutasi-bahan";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);
const search = ref("");

// Filter tanggal default 30 hari terakhir (DateRangeFilter bawaan BaseBrowse)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers Master (kolom Delphi btnRefreshClick.SQLMaster: Nomor/Tanggal/Keterangan/Asal/Tujuan/Realisasi) ---
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
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "Asal", key: "Asal", minWidth: "150px" },
  { title: "Tujuan", key: "Tujuan", minWidth: "150px" },
  {
    title: "Realisasi",
    key: "Realisasi",
    minWidth: "100px",
    align: "center" as const,
  },
]);

// --- Headers Detail (kolom Delphi SQLDetail: Kode/Nama/Satuan/Jenis/Jumlah) ---
const detailHeaders = [
  { title: "Kode", key: "Kode", minWidth: "110px" },
  { title: "Nama", key: "Nama", minWidth: "250px" },
  { title: "Satuan", key: "Satuan", minWidth: "80px", align: "center" as const },
  { title: "Jenis", key: "Jenis", minWidth: "140px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "100px", align: "end" as const },
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

// --- Data Fetching ---
const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const res = await api.get(`${API_MUTASI_BAHAN}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data mutasi bahan.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand Detail: backend sudah meng-embed Detail[] di tiap master ---
const handleExpandUpdate = (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  const found = masterData.value.find((m) => m.Nomor === nomor);
  details.value[nomor] =
    found && Array.isArray(found.Detail) ? found.Detail : [];
};

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

// Browse ini read-only: tidak ada form New/Edit/Delete (Delphi aslinya juga
// hanya browse + refresh; tombol Tambah/Ubah/Hapus bawaan BaseBrowse
// dinonaktifkan lewat toast agar tidak navigasi ke route yang tidak ada).
const handleCrud = () => {
  toast.warning("Browse mutasi bahan hanya untuk melihat data.");
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
      { header: "Keterangan", key: "Keterangan", width: 30 },
      { header: "Asal", key: "Asal", width: 20 },
      { header: "Tujuan", key: "Tujuan", width: 20 },
      { header: "Realisasi", key: "Realisasi", width: 12, align: "center" },
    ];
    const formattedData = masterData.value.map((item) => ({
      ...item,
      Tanggal: safeFormatDate(item.Tanggal),
    }));
    await exportExcelSingle(
      `MutasiBahan_Header_${startDate.value}_to_${endDate.value}.xlsx`,
      "Mutasi Bahan",
      columns,
      formattedData,
      `MUTASI BAHAN SPANDUK (HEADER) | Periode: ${safeFormatDate(startDate.value)} s.d ${safeFormatDate(endDate.value)}`,
    );
    toast.success("Berhasil export header mutasi bahan.");
  } catch {
    toast.error("Gagal export header.");
  } finally {
    isExportingHeader.value = false;
  }
};

const isExportingDetail = ref(false);
const onExportDetail = async () => {
  if (!masterData.value.length)
    return toast.warning("Tidak ada data untuk diexport.");
  isExportingDetail.value = true;
  try {
    const combinedRows: any[] = [];
    masterData.value.forEach((master) => {
      const masterCells = {
        Nomor: master.Nomor,
        Tanggal: safeFormatDate(master.Tanggal),
        Keterangan: master.Keterangan,
        Asal: master.Asal,
        Tujuan: master.Tujuan,
        Realisasi: master.Realisasi,
      };
      const blankMaster = Object.fromEntries(
        Object.keys(masterCells).map((k) => [k, ""]),
      );
      const dtl: any[] = Array.isArray(master.Detail) ? master.Detail : [];
      if (dtl.length > 0) {
        dtl.forEach((d: any, idx: number) => {
          combinedRows.push({
            ...(idx === 0 ? masterCells : blankMaster),
            Kode: d.Kode,
            Nama: d.Nama,
            Satuan: d.Satuan,
            Jenis: d.Jenis,
            Jumlah: Number(d.Jumlah) || 0,
          });
        });
      } else {
        combinedRows.push({
          ...masterCells,
          Kode: "",
          Nama: "",
          Satuan: "",
          Jenis: "",
          Jumlah: "",
        });
      }
    });

    const columns: ExcelColumn[] = [
      { header: "Nomor", key: "Nomor", width: 18 },
      { header: "Tanggal", key: "Tanggal", width: 12, align: "center" },
      { header: "Keterangan", key: "Keterangan", width: 30 },
      { header: "Asal", key: "Asal", width: 18 },
      { header: "Tujuan", key: "Tujuan", width: 18 },
      { header: "Realisasi", key: "Realisasi", width: 12, align: "center" },
      { header: "Kode", key: "Kode", width: 14 },
      { header: "Nama", key: "Nama", width: 28 },
      { header: "Satuan", key: "Satuan", width: 10, align: "center" },
      { header: "Jenis", key: "Jenis", width: 18 },
      {
        header: "Jumlah",
        key: "Jumlah",
        width: 12,
        align: "right",
        numFmt: "#,##0.00",
      },
    ];

    await exportExcelSingle(
      `MutasiBahan_Detail_${startDate.value}_to_${endDate.value}.xlsx`,
      "Detail Mutasi Bahan",
      columns,
      combinedRows,
      `RINCIAN MUTASI BAHAN SPANDUK | Periode: ${safeFormatDate(startDate.value)} s.d ${safeFormatDate(endDate.value)}`,
    );
    toast.success("Berhasil export detail mutasi bahan.");
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
  <div class="mutasi-bahan-wrapper">
    <BaseBrowse
      title="Mutasi Bahan"
      icon="mdi-swap-horizontal"
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
          label="Cari Nomor / Keterangan / Gudang"
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

      <!-- Badge status realisasi -->
      <template #item.Realisasi="{ item }">
        <v-chip
          :color="item.Realisasi === 'Sudah' ? 'success' : 'warning'"
          size="x-small"
          label
          class="font-weight-bold"
        >
          {{ item.Realisasi }}
        </v-chip>
      </template>

      <!-- Sub-grid detail -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
            <div
              v-if="!details[item.Nomor] || details[item.Nomor].length === 0"
              class="text-center pa-2 text-caption text-grey"
            >
              Tidak ada detail bahan untuk Nomor {{ item.Nomor }}
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
              <template #item.Jumlah="{ item: d }">
                <div class="text-right">
                  {{ Number(d.Jumlah || 0).toLocaleString("id-ID") }}
                </div>
              </template>
            </v-data-table>
          </td>
        </tr>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.mutasi-bahan-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
