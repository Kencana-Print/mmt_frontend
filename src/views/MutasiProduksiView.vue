<template>
  <PageLayout title="Data Realisasi Produksi" icon="mdi-factory">
    <!-- <v-expand-transition>
      <div v-if="pendingLoans.length > 0" class="mx-4 mt-2">
        <v-alert
          type="warning"
          variant="tonal"
          density="compact"
          border="start"
          class="mb-4"
        >
          <template #title>
            <span class="text-subtitle-2 font-weight-bold"
              >🔔 Permintaan Pinjam Bahan (Hutang Stok)</span
            >
          </template>
          <div
            v-for="loan in pendingLoans"
            :key="loan.id"
            class="d-flex align-center justify-space-between mt-1"
          >
            <span class="text-caption">
              Produksi membutuhkan Barcode:
              <strong>{{ loan.barcode }}</strong> ({{ loan.nama_bahan }}) -
              Sisa: {{ loan.panjang }}M
            </span>
            <v-btn
              size="x-small"
              color="orange-darken-2"
              class="ml-4"
              @click="handleApproveLoan(loan)"
            >
              Proses Mutasi & Keluar
            </v-btn>
          </div>
        </v-alert>
      </div>
    </v-expand-transition> -->
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNewEdit('new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEditClick"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        v-if="authStore.can(MENU_ID, 'view')"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>
      <v-btn
        size="x-small"
        color="success"
        @click="handleExportExcel"
        :loading="loading"
      >
        <v-icon start>mdi-file-excel</v-icon> Export Excel
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-4">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />

            <v-btn variant="text" size="small" @click="fetchData">
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="headers"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          return-object
          show-expand
          @update:expanded="loadDetails"
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{
              item.Tanggal
                ? format(parseCustomDate(item.Tanggal), "dd/MM/yyyy")
                : ""
            }}
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <div
                      v-if="isLoadingDetails(item.Nomor)"
                      class="text-center pa-4 text-caption"
                    >
                      Memuat detail...
                    </div>

                    <v-data-table
                      v-else
                      :headers="detailHeaders"
                      :items="details[item.Nomor] || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #[`item.Jumlah`]="{ item: d }">
                        {{ Number(d.Jumlah).toFixed(2) }}
                      </template>

                      <template #[`item.Panjang`]="{ item: d }">
                        {{ Number(d.Panjang).toFixed(2) }}
                      </template>
                      <template #[`item.Lebar`]="{ item: d }">
                        {{ Number(d.Lebar).toFixed(2) }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="
                        !isLoadingDetails(item.Nomor) &&
                        !(details[item.Nomor] && details[item.Nomor].length)
                      "
                      class="text-center pa-4 text-caption"
                    >
                      Tidak ada data detail.
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, onActivated, onDeactivated, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useAuthStore } from "../stores/authStore";
import api from "@/services/api";
import type { AxiosError } from "axios";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { VDataTable } from "vuetify/components";
import * as XLSX from "xlsx-js-style";

// --- Interfaces ---

interface PermintaanProduksiDetail {
  Nomor: string;
  Kode: string;
  Nama_Bahan: string;
  Barcode: string;
  Panjang: number | null;
  Lebar: number | null;
  Satuan: string;
  Jumlah: number;
  Operator: string;
  Nomor_SPK: string;
  spk_nama: string;
  Keterangan: string;
  [key: string]: string | number | null | undefined;
}

interface PermintaanProduksiHeader {
  Nomor: string;
  Gudang: string;
  Nama: string;
  Tanggal: string;
  Keterangan: string;
  Detail?: PermintaanProduksiDetail[];
  [key: string]: string | number | null | undefined;
}

interface ApiResponse {
  message: string;
  data: PermintaanProduksiHeader[];
}

// --- State & Constants ---

const router = useRouter();
const toast = useToast();
const API_PERMINTAAN_PRODUKSI = "/mmt/permintaan-produksi";
const MENU_ID = "MMT_PERMINTAAN_PRODUKSI";

const masterData = ref<PermintaanProduksiHeader[]>([]);
const details = ref<Record<string, PermintaanProduksiDetail[]>>({});
const loading = ref<boolean>(true);
const loadingDetails = ref(new Set<string>());

const selected = ref<PermintaanProduksiHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const startDate = ref<string>(thirtyDaysAgo);
const endDate = ref<string>(today);

// --- Computed ---

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

// --- Konfigurasi Tabel (Headers) ---

const headers = [
  { title: "Nomor", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Gudang", key: "Gudang", minWidth: "80px" },
  { title: "Nama Gudang", key: "Nama", minWidth: "150px" },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
] as any[];

// FIX: Menyesuaikan urutan dan key sesuai gambar (Nomor, Kode, Nama_Bahan, Panjang, Lebar, Satuan, Jumlah...)
const detailHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Kode", key: "Kode", minWidth: "100px" },
  { title: "Nama Bahan", key: "Nama_Bahan", minWidth: "200px" },
  { title: "Barcode", key: "Barcode", minWidth: "150px" },
  { title: "Panjang", key: "Panjang", minWidth: "80px", align: "end" },
  { title: "Lebar", key: "Lebar", minWidth: "80px", align: "end" },
  { title: "Satuan", key: "Satuan", minWidth: "80px" },
  { title: "Jumlah", key: "Jumlah", minWidth: "80px", align: "end" },
  { title: "Operator", key: "Operator", minWidth: "120px" },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "120px" },
  { title: "spk_nama", key: "spk_nama", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "150px" },
] as any[];

// --- Utility Functions ---

const parseCustomDate = (dateString: string): Date | null => {
  // Logika parseCustomDate tetap sama
  if (!dateString) return null;
  try {
    const [day, monthName, year] = dateString.split("-");
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

    if (monthIndex === -1) return null;

    const date = new Date(Number(year), monthIndex, Number(day));

    if (isNaN(date.getTime()) || date.getDate() !== Number(day)) return null;

    return date;
  } catch (e) {
    return null;
  }
};

// Tambahkan argumen event di depan, lalu ambil item dari argumen kedua
const handleRowClick = (
  event: any,
  { item }: { item: PermintaanProduksiHeader },
) => {
  // item adalah objek baris yang diklik
  if (selected.value.some((s) => s.Nomor === item.Nomor)) {
    selected.value = []; // Lepas seleksi jika diklik ulang
  } else {
    selected.value = [item]; // Set sebagai item terpilih
  }
};

const getRowProps = ({ item }: { item: PermintaanProduksiHeader }) => {
  return {
    class: {
      "row-selected": selected.value.some((s) => s.Nomor === item.Nomor),
    },
  };
};

const useAuthStore = () => ({
  can: (menuId: string, action: string) => true, // Selalu true untuk demo
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  details.value = {};
  try {
    const response = await api.get<ApiResponse>(API_PERMINTAAN_PRODUKSI, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });

    const fetchedData = response.data.data || [];

    fetchedData.forEach((header) => {
      if (header.Detail) {
        // Pastikan nilai Jumlah, Panjang, Lebar adalah angka (untuk toFixed)
        details.value[header.Nomor] = header.Detail.map((d) => ({
          ...d,
          Panjang: d.Panjang || 0,
          Lebar: d.Lebar || 0,
          Jumlah: d.Jumlah || 0,
        }));
      }
    });

    masterData.value = fetchedData;
  } catch (error) {
    const err = error as AxiosError;
    toast.error(
      `Gagal memuat data: ${err.message || "Terjadi kesalahan jaringan."}`,
    );
  } finally {
    loading.value = false;
  }
};

const loadDetails = (newlyExpandedKeys: string[]) => {
  const newlyExpandedNomor = newlyExpandedKeys.find(
    (nomor) => !details.value[nomor],
  );

  if (newlyExpandedNomor) {
    console.warn(
      `Detail for ${newlyExpandedNomor} not found in cache. Simulating load...`,
    );
    loadingDetails.value.add(newlyExpandedNomor);
    setTimeout(() => {
      loadingDetails.value.delete(newlyExpandedNomor);
    }, 500);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const getRowTextColor = (item: PermintaanProduksiHeader) => {
  return "";
};

const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "MutasiProduksiNew" });
  } else if (mode === "edit" && selectedNomor.value) {
    router.push({
      name: "MutasiProduksiEdit",
      params: { nomor: selectedNomor.value },
    });
  }
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;

  if (!confirm(`Yakin ingin hapus transaksi ${selectedNomor.value}?`)) return;

  try {
    await api.delete(`${API_PERMINTAAN_PRODUKSI}/${selectedNomor.value}`);
    toast.success("Data berhasil dihapus!");
    await fetchData();
  } catch (error) {
    const err = error as AxiosError<any>;
    toast.error(
      `Gagal Hapus: ${
        err.response?.data?.message ?? err.message ?? "Terjadi kesalahan."
      }`,
    );
  }
};

const handlePrint = () => {
  if (selectedNomor.value) {
    alert(`TODO: Mencetak slip untuk ${selectedNomor.value}`);
  }
};

const pendingLoans = ref<any[]>([]);
let pollingInterval: any = null;

// Fungsi untuk mengambil data "Hutang" dari database
const fetchPendingLoans = async () => {
  try {
    // Kita panggil endpoint yang mengecek permintaan dengan status 'PINJAM'
    const response = await api.get("/mmt/request-pinjam");
    pendingLoans.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat notifikasi pinjam");
  }
};

const handleApproveLoan = async (loan: any) => {
  const confirmOk = confirm(
    `Proses Mutasi Barcode ${loan.barcode} dari WH-16 ke GPM sekarang?`,
  );

  if (confirmOk) {
    try {
      // Panggil API untuk mutasi otomatis
      await api.post("/mmt/request-pinjam/approve-pinjam", {
        barcode: loan.barcode,
        nomor_permintaan: loan.Nomor,
      });

      toast.success(
        `Stok Barcode ${loan.barcode} telah berpindah ke Produksi.`,
      );
      fetchPendingLoans(); // Refresh notif
      fetchData(); // Refresh table utama
    } catch (error) {
      toast.error("Gagal memproses mutasi.");
    }
  }
};

const handleExportExcel = () => {
  if (masterData.value.length === 0) {
    toast.warning("Tidak ada data untuk di-export.");
    return;
  }

  loading.value = true;
  try {
    const fileName = `Realisasi_Produksi_${startDate.value}_to_${endDate.value}.xlsx`;

    // ==========================================
    // 1. DEFINISI STYLE EXCEL (PERSIS MODUL LAIN)
    // ==========================================
    const styleHeaderMain = {
      fill: { fgColor: { rgb: "B3E5FC" } }, // Biru muda cerah
      font: { bold: true, color: { rgb: "000000" }, sz: 10 }, // Teks Hitam Tebal
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
        top: { style: "thin", color: { rgb: "000000" } }, // Border hitam tipis seluruh sisi
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

    // ==========================================
    // 2. SUSUN DATA (Array of Arrays / AOA)
    // ==========================================
    const wsData = [];

    // Fungsi Helper format tanggal Indonesia
    const formatTanggalIndo = (dateStr: string) => {
      if (!dateStr) return "";
      const bulanIndo = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const [year, month, day] = dateStr.split("-");
      const indexBulan = parseInt(month, 10) - 1;
      return `${parseInt(day, 10)} ${bulanIndo[indexBulan]} ${year}`;
    };

    const periodeStr = `Periode : ${formatTanggalIndo(startDate.value)} s/d ${formatTanggalIndo(endDate.value)}`;

    // Judul Atas
    wsData.push([
      {
        v: "LAPORAN TRANSAKSI REALISASI PRODUKSI",
        s: { font: { bold: true, sz: 14 } },
      },
    ]);
    wsData.push([{ v: periodeStr, s: { font: { sz: 10 } } }]);
    wsData.push([]);

    // Header Kolom Tabel Sesuai Struktur Realisasi Produksi (Total 14 Kolom)
    const tableHeaders = [
      { v: "NOMOR TRANSAKSI", s: styleHeaderMain },
      { v: "TANGGAL", s: styleHeaderMain },
      { v: "KODE GUDANG", s: styleHeaderMain },
      { v: "NAMA GUDANG", s: styleHeaderMain },
      { v: "KETERANGAN HEADER", s: styleHeaderMain },
      { v: "KODE BARANG", s: styleHeaderMain },
      { v: "NAMA BAHAN / BARANG", s: styleHeaderMain },
      { v: "BARCODE", s: styleHeaderMain },
      { v: "PANJANG", s: styleHeaderMain },
      { v: "LEBAR", s: styleHeaderMain },
      { v: "SATUAN", s: styleHeaderMain },
      { v: "JUMLAH", s: styleHeaderMain },
      { v: "OPERATOR", s: styleHeaderMain },
      { v: "NOMOR SPK", s: styleHeaderMain },
    ];
    wsData.push(tableHeaders);

    // Looping Isi Data Body Realisasi
    masterData.value.forEach((header) => {
      // Mengambil detail berdasarkan state cache `details` komponen
      const targetDetails = details.value[header.Nomor] || header.Detail || [];

      // Konversi format tanggal internal
      let tglHeader = header.Tanggal || "";
      if (
        tglHeader &&
        tglHeader.includes("-") &&
        tglHeader.split("-")[0].length === 4
      ) {
        tglHeader = tglHeader.split("-").reverse().join("/"); // 2026-04-23 -> 23/04/2026
      }

      if (targetDetails.length > 0) {
        targetDetails.forEach((dtl, index) => {
          const row = [
            // Kolom Header Utama (Hanya muncul di baris index 0/pertama detail agar visual bersih)
            { v: index === 0 ? header.Nomor : "", s: styleDataCellCenter },
            { v: index === 0 ? tglHeader : "", s: styleDataCellCenter },
            { v: index === 0 ? header.Gudang : "", s: styleDataCellCenter },
            { v: index === 0 ? header.Nama : "", s: styleDataCell },
            { v: index === 0 ? header.Keterangan || "" : "", s: styleDataCell },

            // Kolom Detail Item Realisasi Produksi
            { v: dtl.Kode, s: styleDataCellCenter },
            { v: dtl.Nama_Bahan, s: styleDataCell },
            { v: dtl.Barcode || "-", s: styleDataCellCenter },
            {
              v: dtl.Panjang !== null ? Number(dtl.Panjang) : 0,
              s: styleDataCellRight,
            },
            {
              v: dtl.Lebar !== null ? Number(dtl.Lebar) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Satuan, s: styleDataCellCenter },
            {
              v: dtl.Jumlah !== null ? Number(dtl.Jumlah) : 0,
              s: styleDataCellRight,
            },
            { v: dtl.Operator || "-", s: styleDataCell },
            { v: dtl.Nomor_SPK || "-", s: styleDataCellCenter },
          ];
          wsData.push(row);
        });
      } else {
        // Fallback jika tidak ada detail item
        const row = [
          { v: header.Nomor, s: styleDataCellCenter },
          { v: tglHeader, s: styleDataCellCenter },
          { v: header.Gudang, s: styleDataCellCenter },
          { v: header.Nama, s: styleDataCell },
          { v: header.Keterangan || "", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: "Tidak ada data detail", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
          { v: 0, s: styleDataCellRight },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCellCenter },
          { v: 0, s: styleDataCellRight },
          { v: "-", s: styleDataCell },
          { v: "-", s: styleDataCellCenter },
        ];
        wsData.push(row);
      }
    });

    // ==========================================
    // 3. PEMBUATAN WORKSHEET & PROSES DOWNLOAD
    // ==========================================
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge baris judul atas (Kolom A sampai N / total 14 kolom)
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];

    // Setting Lebar Kolom Excel otomatis pas
    ws["!cols"] = [
      { wch: 22 }, // NOMOR TRANSAKSI
      { wch: 12 }, // TANGGAL
      { wch: 15 }, // KODE GUDANG
      { wch: 25 }, // NAMA GUDANG
      { wch: 25 }, // KETERANGAN HEADER
      { wch: 15 }, // KODE BARANG
      { wch: 30 }, // NAMA BAHAN
      { wch: 18 }, // BARCODE
      { wch: 12 }, // PANJANG
      { wch: 12 }, // LEBAR
      { wch: 12 }, // SATUAN
      { wch: 12 }, // JUMLAH
      { wch: 15 }, // OPERATOR
      { wch: 18 }, // NOMOR SPK
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RealisasiProduksi");
    XLSX.writeFile(wb, fileName);

    toast.success("Export Excel Berhasil!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Gagal melakukan export excel.");
  } finally {
    loading.value = false;
  }
};

// --- Lifecycle Hook ---

onMounted(() => {
  fetchData(); // Mengambil data tabel utama
  fetchPendingLoans(); // Mengambil data notifikasi pinjaman saat pertama kali buka
  startPolling();
});

// KeepAlive: matikan polling saat tab disembunyikan (dulu onUnmounted tak
// pernah jalan saat pindah tab sehingga polling menumpuk di background),
// nyalakan lagi saat tab diaktifkan.
onActivated(() => {
  startPolling();
});

onDeactivated(() => {
  stopPolling();
});

onUnmounted(() => {
  stopPolling();
});

function startPolling() {
  if (pollingInterval) return;
  // Tambahkan interval agar sistem mengecek notifikasi setiap 30 detik secara otomatis
  pollingInterval = setInterval(() => {
    fetchPendingLoans();
  }, 30000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Watcher untuk tanggal (jika diubah, data dimuat ulang)
watch([startDate, endDate], fetchData);
</script>

<style scoped>
/* 1. KONSISTENSI FONT & UKURAN TABEL */
:deep(.v-data-table) {
  font-size: 11px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 36px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  color: #333 !important;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

/* 2. STYLE SELEKSI BARIS (BIRU MUDA) */
:deep(.row-selected) {
  background-color: #d8efff !important;
}

/* Pastikan kolom fixed (sticky) ikut berubah warna */
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

:deep(.v-data-table__tr.row-selected:hover > td) {
  background-color: #c0e4ff !important;
}

:deep(.v-data-table__tr) {
  cursor: pointer;
}

/* 3. CONTAINER DETAIL */
.detail-container {
  padding: 8px 40px !important;
  background-color: #fcfcfc;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.detail-table {
  background-color: white !important;
  border-radius: 4px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
}

/* 4. UTILITY */
.browse-content {
  padding-top: 4px;
}

.filter-section {
  padding: 4px 8px;
}

:deep(.text-end) {
  text-align: right !important;
}

.text-red {
  color: #d32f2f !important;
}
</style>
