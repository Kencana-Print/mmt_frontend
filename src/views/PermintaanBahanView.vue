<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import * as XLSX from "xlsx-js-style";
import { format, subDays, parseISO, isValid } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";

// --- Interfaces disesuaikan persis dengan response API ---
interface PermintaanBahanDetail {
  NoUrut?: number;
  Kode: string;
  Nama_Bahan: string;
  Jumlah: number;
  Jumlah_PO: number;
  Jumlah_Datang: number;
  Nomor_PO?: string | null;
  Satuan: string;
  Nomor_SPK?: string | null;
  spk_nama?: string | null;
  KeteranganItem?: string | null;
  Panjang?: string | number;
  Lebar?: string | number;
  Is_Acc?: string;
}

interface PermintaanBahanHeader {
  Nomor: string;
  Gudang?: string;
  Gudang_Asal_Kode?: string;
  Nama?: string;
  Gudang_Asal_Nama?: string;
  Jenis?: string;
  Tanggal: string;
  Keterangan: string;
  Estimasi_Kedatangan?: string;
  Tanggal_Datang?: string;
  Status_PO?: string;
  Status_Diterima?: string;
  Status_Acc?: string;
  Detail?: PermintaanBahanDetail[];
}

const props = defineProps<{
  cabang?: string;
  divisi?: number | string;
}>();

const toast = useToast();
const router = useRouter();
const route = useRoute();

const API_PERMINTAAN_BAHAN = "/mmt/permintaan-bahan";

const currentCabang = computed(
  () => props.cabang || (route.meta.cabang as string) || "P05",
);
const currentDivisi = computed(
  () => props.divisi ?? (route.meta.divisi as number | string) ?? 1,
);

const pageTitle = computed(() => {
  const namaCabang = currentCabang.value === "P02" ? "Spanduk" : "MMT";
  return `Data Permintaan Bahan (${namaCabang})`;
});

const masterData = ref<PermintaanBahanHeader[]>([]);
const details = ref<Record<string, PermintaanBahanDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref<Set<string>>(new Set());
const selected = ref<PermintaanBahanHeader[]>([]);
const expanded = ref<any[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

const getStatusColor = (status: string) => {
  if (!status) return "default";
  switch (status.toUpperCase()) {
    case "OPEN":
      return "success";
    case "ONPROSES":
    case "PENDING":
      return "warning";
    case "CLOSE":
    case "SELESAI":
      return "grey";
    case "VOID":
    case "CANCEL":
      return "error";
    default:
      return "info";
  }
};

const masterHeaders = [
  {
    title: "Detail",
    key: "data-table-expand",
    minWidth: "60px",
    align: "center" as const,
    fixed: true,
  },
  { title: "Nomor", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "200px" },
  { title: "Jenis", key: "Jenis", minWidth: "130px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Status PO", key: "Status_PO", minWidth: "120px" },
  { title: "Status Terima", key: "Status_Diterima", minWidth: "120px" },
  {
    title: "Estimasi Datang (PO)",
    key: "Estimasi_Kedatangan",
    minWidth: "150px",
  },
  { title: "Tgl Datang (Real)", key: "Tanggal_Datang", minWidth: "150px" },
  { title: "Status ACC", key: "Status_Acc", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
];

// Header sub-tabel detail disesuaikan dengan data respons API
const detailHeaders = [
  { title: "No", key: "NoUrut", minWidth: "50px", align: "center" as const },
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "240px" },
  { title: "ACC", key: "Is_Acc", minWidth: "80px", align: "center" as const },
  {
    title: "Jml Permintaan",
    key: "Jumlah",
    minWidth: "110px",
    align: "end" as const,
  },
  {
    title: "Jml PO",
    key: "Jumlah_PO",
    minWidth: "90px",
    align: "end" as const,
  },
  {
    title: "Jml Datang",
    key: "Jumlah_Datang",
    minWidth: "100px",
    align: "end" as const,
  },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Nomor PO", key: "Nomor_PO", minWidth: "140px" },
  { title: "No. SPK / Ket", key: "Nomor_SPK", minWidth: "160px" },
  { title: "Keterangan Item", key: "KeteranganItem", minWidth: "150px" },
];

const parseCustomDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parsedISO = parseISO(dateString);
  if (isValid(parsedISO)) return parsedISO;

  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [day, monthName, year] = parts;
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = months.findIndex((m) =>
      m.toLowerCase().startsWith(monthName.toLowerCase()),
    );
    if (monthIndex !== -1)
      return new Date(Number(year), monthIndex, Number(day));
    if (!isNaN(Number(monthName)))
      return new Date(Number(year), Number(monthName) - 1, Number(day));
  }
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
};

const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const d = parseISO(dateStr);
  return isValid(d) ? format(d, "dd/MM/yyyy") : "-";
};

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const response = await api.get(API_PERMINTAAN_BAHAN, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        cabang: currentCabang.value,
        divisi: currentDivisi.value,
      },
    });
    const result = response.data?.data ?? response.data;
    masterData.value = Array.isArray(result) ? result : [];
  } catch (err) {
    toast.error("Gagal mengambil data Permintaan Bahan.");
  } finally {
    loading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const lastExpandedNomor =
    typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!lastExpandedNomor || details.value[lastExpandedNomor]) return;

  loadingDetails.value.add(lastExpandedNomor);
  try {
    const response = await api.get(
      `${API_PERMINTAAN_BAHAN}/${encodeURIComponent(lastExpandedNomor)}`,
    );
    const resData = response.data?.data ?? response.data;
    details.value[lastExpandedNomor] = resData.Detail || resData.Details || [];
  } catch (error) {
    details.value[lastExpandedNomor] = [];
  } finally {
    loadingDetails.value.delete(lastExpandedNomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PermintaanBahanNew" });
  } else if (selectedNomor.value) {
    router.push({
      name: "PermintaanBahanEdit",
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

const getDetailRowProps = ({ item }: any) => ({
  class: item?.Is_Acc === "N" ? "row-rejected font-weight-bold text-red" : "",
});

const handleDelete = async () => {
  if (
    !selectedNomor.value ||
    !confirm(`Yakin ingin hapus transaksi Nomor: ${selectedNomor.value}?`)
  )
    return;
  try {
    await api.delete(`${API_PERMINTAAN_BAHAN}/${selectedNomor.value}`);
    toast.success("Data berhasil dihapus.");
    fetchData();
  } catch (e) {
    toast.error("Gagal menghapus data.");
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    toast.warning("Silakan pilih salah satu data terlebih dahulu.");
    return;
  }
  try {
    const routeData = router.resolve({
      name: "PermintaanBahanPrint",
      params: { nomor: selectedNomor.value },
    });
    if (!routeData.href || routeData.matched.length === 0) {
      toast.error('Route "PermintaanBahanPrint" tidak ditemukan di router.');
      return;
    }
    const printWindow = window.open(routeData.href, "_blank");
    if (!printWindow) {
      toast.error("Pop-up diblokir browser. Harap izinkan pop-up.");
    }
  } catch (error) {
    console.error("Print error:", error);
    toast.error("Gagal membuka halaman cetak.");
  }
};

// Tracking modal dialog
const dialogTracking = reactive({
  show: false,
  item: null as PermintaanBahanHeader | null,
});

const trackingSteps = [
  {
    status: "ACC",
    title: "Persetujuan (ACC)",
    icon: "mdi-check-decagram",
    color: "success",
  },
  {
    status: "PO",
    title: "Pesanan Pembelian (PO)",
    icon: "mdi-cart-check",
    color: "warning",
  },
  {
    status: "DITERIMA",
    title: "Penerimaan Gudang",
    icon: "mdi-truck-check",
    color: "primary",
  },
];

const getStepStatus = (step: string, item: PermintaanBahanHeader) => {
  if (step === "ACC")
    return item.Status_Acc === "ACC" || item.Status_Acc === "Y";
  if (step === "PO")
    return item.Status_PO === "CLOSE" || item.Status_PO === "ONPROSES";
  if (step === "DITERIMA")
    return (
      item.Status_Diterima === "SELESAI" || item.Status_Diterima === "DITERIMA"
    );
  return false;
};

const openTracking = () => {
  if (!isSingleSelected.value) return;
  dialogTracking.item = selected.value[0];
  dialogTracking.show = true;
};

// Export Header Excel
const handleExportHeaderExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }
  loading.value = true;
  try {
    const fileName = `Laporan_Header_Permintaan_Bahan_${currentCabang.value}_${startDate.value}_to_${endDate.value}.xlsx`;

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "C8E6C9" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };

    const wsData = [];
    const periodeStr = `Periode : ${startDate.value} s/d ${endDate.value}`;

    wsData.push([
      {
        v: `LAPORAN RINGKASAN (HEADER) PERMINTAAN BAHAN (${currentCabang.value})`,
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    const tableHeaders = [
      { v: "NOMOR PERMINTAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "ESTIMASI DATANG", s: styleHeaderMain },
      { v: "TANGGAL DATANG (REAL)", s: styleHeaderMain },
      { v: "STATUS PO", s: styleHeaderMain },
      { v: "STATUS TERIMA", s: styleHeaderMain },
      { v: "STATUS ACC", s: styleHeaderMain },
      { v: "KETERANGAN", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    masterData.value.forEach((header) => {
      const formatDataDate = (dStr: string | undefined | null) => {
        if (!dStr) return "-";
        const d = parseISO(dStr);
        return isValid(d) ? format(d, "dd/MM/yyyy") : dStr;
      };

      const row = [
        { v: header.Nomor, s: styleDataCellCenter },
        { v: formatDataDate(header.Tanggal), s: styleDataCellCenter },
        {
          v: header.Gudang || header.Gudang_Asal_Kode || "-",
          s: styleDataCellCenter,
        },
        { v: header.Nama || header.Gudang_Asal_Nama || "-", s: styleDataCell },
        {
          v: formatDataDate(header.Estimasi_Kedatangan),
          s: styleDataCellCenter,
        },
        { v: formatDataDate(header.Tanggal_Datang), s: styleDataCellCenter },
        { v: header.Status_PO || "-", s: styleDataCellCenter },
        { v: header.Status_Diterima || "-", s: styleDataCellCenter },
        { v: header.Status_Acc || "-", s: styleDataCellCenter },
        { v: header.Keterangan || "-", s: styleDataCell },
      ];
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 18 },
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HeaderPermintaan");
    XLSX.writeFile(wb, fileName);
    toast.success("Export Header Excel Berhasil!");
  } catch (error) {
    console.error("Export Header error:", error);
    toast.error("Gagal melakukan export header excel.");
  } finally {
    loading.value = false;
  }
};

// Export Detail Excel (Diperbarui dengan Jumlah_Datang & Jumlah_PO)
const handleExportExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Permintaan_Bahan_${currentCabang.value}_${startDate.value}_to_${endDate.value}.xlsx`;

    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } },
      font: { bold: true, color: { rgb: "000000" }, sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const styleDataCell = {
      font: { sz: 10 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { vertical: "center" },
    };

    const styleDataCellCenter = {
      ...styleDataCell,
      alignment: { horizontal: "center", vertical: "center" },
    };

    const styleDataCellRight = {
      ...styleDataCell,
      alignment: { horizontal: "right", vertical: "center" },
    };

    const wsData = [];
    const periodeStr = `Periode : ${startDate.value} s/d ${endDate.value}`;

    wsData.push([
      {
        v: `LAPORAN TRANSAKSI PERMINTAAN BAHAN (${currentCabang.value})`,
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    const tableHeaders = [
      { v: "NOMOR PERMINTAAN", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "GUDANG", s: styleHeaderMain },
      { v: "ESTIMASI DATANG", s: styleHeaderMain },
      { v: "TANGGAL DATANG", s: styleHeaderMain },
      { v: "STATUS PO", s: styleHeaderMain },
      { v: "STATUS TERIMA", s: styleHeaderMain },
      { v: "STATUS ACC", s: styleHeaderMain },
      { v: "KODE BAHAN", s: styleHeaderMain },
      { v: "NAMA BAHAN", s: styleHeaderMain },
      { v: "JML ORDER", s: styleHeaderMain },
      { v: "JML PO", s: styleHeaderMain },
      { v: "JML DATANG", s: styleHeaderMain },
      { v: "SATUAN", s: styleHeaderMain },
      { v: "NOMOR PO", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    masterData.value.forEach((header) => {
      const formatDataDate = (dStr: string | undefined | null) => {
        if (!dStr) return "-";
        const d = parseISO(dStr);
        return isValid(d) ? format(d, "dd/MM/yyyy") : dStr;
      };

      const tglHeader = formatDataDate(header.Tanggal);
      const estDatang = formatDataDate(header.Estimasi_Kedatangan);
      const tglDatang = formatDataDate(header.Tanggal_Datang);
      const itemDetails = details.value[header.Nomor] || header.Detail || [];

      if (itemDetails.length > 0) {
        itemDetails.forEach((dtl, index) => {
          const row = [
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            {
              v:
                index === 0 ? header.Nama || header.Gudang_Asal_Nama || "" : "",
              s: styleDataCell,
            },
            { v: index === 0 ? estDatang : "", s: styleDataCellCenter },
            { v: index === 0 ? tglDatang : "", s: styleDataCellCenter },
            {
              v: index === 0 ? header.Status_PO || "" : "",
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Status_Diterima || "" : "",
              s: styleDataCellCenter,
            },
            {
              v: index === 0 ? header.Status_Acc || "" : "",
              s: styleDataCellCenter,
            },
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            { v: Number(dtl.Jumlah || 0), s: styleDataCellRight },
            { v: Number(dtl.Jumlah_PO || 0), s: styleDataCellRight },
            { v: Number(dtl.Jumlah_Datang || 0), s: styleDataCellRight },
            { v: dtl.Satuan || "", s: styleDataCellCenter },
            { v: dtl.Nomor_PO || "-", s: styleDataCellCenter },
          ];
          wsData.push(row);
        });
      } else {
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Nama || header.Gudang_Asal_Nama || "", s: styleDataCell },
          { v: estDatang, s: styleDataCellCenter },
          { v: tglDatang, s: styleDataCellCenter },
          { v: header.Status_PO || "", s: styleDataCellCenter },
          { v: header.Status_Diterima || "", s: styleDataCellCenter },
          { v: header.Status_Acc || "", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada detail", s: styleDataCell },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: "-", s: styleDataCellCenter },
        ];
        wsData.push(row);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }];
    ws["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PermintaanBahan");
    XLSX.writeFile(wb, fileName);
    toast.success("Export Excel Berhasil!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Gagal melakukan export excel.");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
watch([startDate, endDate, currentCabang, currentDivisi], fetchData);
</script>

<template>
  <BaseBrowse
    :title="pageTitle"
    icon="mdi-basket-fill"
    :headers="masterHeaders"
    :items="masterData"
    :loading="loading"
    v-model:startDate="startDate"
    v-model:endDate="endDate"
    v-model:selected="selected"
    v-model:expanded="expanded"
    has-print
    @refresh="fetchData"
    @action:new="handleNewEdit('new')"
    @action:edit="handleNewEdit('edit')"
    @action:delete="handleDelete"
    @action:print="handlePrint"
    @row-click="handleRowClick"
    :row-props="getRowProps"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #extra-actions="{ isSingleSelected }">
      <v-btn
        size="x-small"
        color="purple"
        :disabled="!isSingleSelected"
        @click="openTracking"
      >
        <v-icon start>mdi-map-marker-path</v-icon> Lacak Proses
      </v-btn>
      <v-btn
        size="x-small"
        color="teal"
        :disabled="masterData.length === 0"
        @click="handleExportHeaderExcel"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Header
      </v-btn>
      <v-btn
        size="x-small"
        color="info"
        :disabled="masterData.length === 0"
        @click="handleExportExcel"
      >
        <v-icon start>mdi-download</v-icon> Export Detail
      </v-btn>
    </template>

    <template #item.Tanggal="{ value }">
      {{
        value && parseCustomDate(value)
          ? format(parseCustomDate(value)!, "dd/MM/yyyy")
          : "-"
      }}
    </template>

    <template #item.Status_PO="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        variant="tonal"
        label
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <template #item.Status_Diterima="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        variant="tonal"
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <template #item.Estimasi_Kedatangan="{ value }">
      {{
        value && isValid(parseISO(value))
          ? format(parseISO(value), "dd/MM/yyyy")
          : "-"
      }}
    </template>

    <template #item.Tanggal_Datang="{ value }">
      {{
        value && isValid(parseISO(value))
          ? format(parseISO(value), "dd/MM/yyyy")
          : "-"
      }}
    </template>

    <template #item.Status_Acc="{ value }">
      <v-chip
        :color="getStatusColor(value)"
        size="x-small"
        class="font-weight-bold"
      >
        {{ value }}
      </v-chip>
    </template>

    <!-- Expanded Row Section -->
    <template #expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length" class="pa-3 bg-grey-lighten-4">
          <div
            class="expanded-container ml-0 pa-3 bg-white rounded-lg elevation-2"
            style="width: 100%; border-left: 4px solid #1976d2"
          >
            <!-- Header Judul Sub-Table -->
            <div class="d-flex align-center justify-space-between mb-2 px-1">
              <div class="d-flex align-center">
                <v-icon size="small" color="primary" class="mr-2">
                  mdi-package-variant-closed
                </v-icon>
                <span class="text-caption font-weight-bold text-grey-darken-3">
                  Detail Permintaan: {{ item.Nomor }}
                </span>
              </div>
              <span class="text-caption text-grey-darken-1">
                Keterangan: {{ item.Keterangan || "-" }}
              </span>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingDetails(item.Nomor)" class="text-center pa-4">
              <v-progress-circular
                indeterminate
                size="22"
                color="primary"
                class="mr-2"
              />
              <span class="text-caption text-grey-darken-1">
                Memuat detail barang & progress PO...
              </span>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="
                !(details[item.Nomor] || item.Detail) ||
                (details[item.Nomor] || item.Detail).length === 0
              "
              class="text-center pa-3 text-caption text-grey-darken-1 border rounded bg-grey-lighten-5"
            >
              Tidak ada data detail untuk nomor {{ item.Nomor }}
            </div>

            <!-- Tabel Detail -->
            <v-data-table
              v-else
              :headers="detailHeaders"
              :items="details[item.Nomor] || item.Detail || []"
              density="compact"
              class="sub-table border rounded"
              :items-per-page="-1"
              hide-default-footer
              :row-props="getDetailRowProps"
            >
              <!-- Status ACC -->
              <template #[`item.Is_Acc`]="{ value }">
                <v-chip
                  :color="value === 'Y' ? 'success' : 'error'"
                  size="x-small"
                  label
                  class="font-weight-bold"
                >
                  {{ value }}
                </v-chip>
              </template>

              <!-- Jumlah Permintaan -->
              <template #[`item.Jumlah`]="{ value }">
                <div class="text-right font-weight-medium">
                  {{ Number(value || 0).toLocaleString("id-ID") }}
                </div>
              </template>

              <!-- Jumlah PO -->
              <template #[`item.Jumlah_PO`]="{ value, item: d }">
                <div
                  :class="[
                    'text-right font-weight-bold',
                    Number(value) >= Number(d.Jumlah)
                      ? 'text-teal-darken-1'
                      : 'text-amber-darken-3',
                  ]"
                >
                  {{ Number(value || 0).toLocaleString("id-ID") }}
                </div>
              </template>

              <!-- Jumlah Datang / Terima -->
              <template #[`item.Jumlah_Datang`]="{ value, item: d }">
                <div
                  :class="[
                    'text-right font-weight-bold',
                    Number(value) >= Number(d.Jumlah)
                      ? 'text-success'
                      : Number(value) > 0
                        ? 'text-info'
                        : 'text-grey-darken-1',
                  ]"
                >
                  {{ Number(value || 0).toLocaleString("id-ID") }}
                </div>
              </template>

              <!-- Nomor PO Chip -->
              <template #[`item.Nomor_PO`]="{ value }">
                <v-chip
                  v-if="value"
                  size="x-small"
                  color="blue-grey"
                  variant="outlined"
                  class="font-weight-medium"
                >
                  {{ value }}
                </v-chip>
                <span v-else class="text-caption text-grey">-</span>
              </template>

              <!-- SPK / Keterangan SPK -->
              <template #[`item.Nomor_SPK`]="{ item: d }">
                <div v-if="d.Nomor_SPK" class="text-caption">
                  <span class="font-weight-bold">{{ d.Nomor_SPK }}</span>
                  <div
                    v-if="d.spk_nama"
                    class="text-caption text-grey-darken-1"
                  >
                    {{ d.spk_nama }}
                  </div>
                </div>
                <span v-else class="text-caption text-grey">-</span>
              </template>
            </v-data-table>
          </div>
        </td>
      </tr>
    </template>
  </BaseBrowse>

  <!-- Modal Dialog Tracking -->
  <v-dialog v-model="dialogTracking.show" max-width="700px">
    <v-card class="rounded-lg">
      <v-toolbar color="purple-darken-2" density="compact">
        <v-toolbar-title class="text-subtitle-1">
          Tracking Permintaan: {{ dialogTracking.item?.Nomor }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogTracking.show = false"
        ></v-btn>
      </v-toolbar>
      <v-card-text class="pa-6">
        <v-timeline direction="horizontal" align="start">
          <v-timeline-item
            dot-color="grey"
            icon="mdi-file-document-outline"
            size="small"
          >
            <template #opposite>
              <span class="text-caption">Input</span>
            </template>
            <div class="text-caption font-weight-bold">Permintaan Dibuat</div>
            <div class="text-caption">
              {{ formatDateDisplay(dialogTracking.item?.Tanggal) }}
            </div>
          </v-timeline-item>
          <v-timeline-item
            v-for="(step, i) in trackingSteps"
            :key="i"
            :dot-color="
              getStepStatus(step.status, dialogTracking.item!)
                ? step.color
                : 'grey-lighten-2'
            "
            :icon="step.icon"
            size="small"
          >
            <template #opposite>
              <span
                :class="
                  getStepStatus(step.status, dialogTracking.item!)
                    ? `text-${step.color} font-weight-bold`
                    : 'text-grey'
                "
              >
                {{ step.title }}
              </span>
            </template>
            <div
              v-if="
                step.status === 'PO' && dialogTracking.item?.Estimasi_Kedatangan
              "
              class="text-caption"
            >
              Est. Datang:
              {{ formatDateDisplay(dialogTracking.item.Estimasi_Kedatangan) }}
            </div>
            <div
              v-if="
                step.status === 'DITERIMA' &&
                dialogTracking.item?.Tanggal_Datang
              "
              class="text-caption"
            >
              Real Datang:
              {{ formatDateDisplay(dialogTracking.item.Tanggal_Datang) }}
            </div>
            <div class="mt-1">
              <v-icon
                v-if="getStepStatus(step.status, dialogTracking.item!)"
                color="success"
                size="x-small"
              >
                mdi-check-circle
              </v-icon>
              <span class="text-caption ml-1">
                {{
                  getStepStatus(step.status, dialogTracking.item!)
                    ? "Selesai"
                    : "Belum"
                }}
              </span>
            </div>
          </v-timeline-item>
        </v-timeline>
        <v-alert
          v-if="
            dialogTracking.item?.Status_Acc === 'VOID' ||
            dialogTracking.item?.Status_Acc === 'CANCEL'
          "
          type="error"
          variant="tonal"
          class="mt-4"
          density="compact"
        >
          Transaksi ini telah dibatalkan (VOID).
        </v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

.row-rejected {
  background-color: #ffebee !important;
}
:deep(.row-rejected td) {
  background-color: #ffebee !important;
}

.sub-table {
  font-size: 11px !important;
}

:deep(.sub-table .v-data-table-header th) {
  background-color: #eceff1 !important;
  color: #37474f !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  height: 30px !important;
}

:deep(.sub-table td) {
  height: 28px !important;
}

.expanded-container {
  transition: all 0.2s ease-in-out;
}
</style>
