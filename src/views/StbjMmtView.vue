<template>
  <div class="browse-container">
    <!-- Menggunakan class 'panel' global dari theme.css -->
    <div class="header-panel panel">
      <h2 class="panel-title">Laporan Stok Barang Jadi MMT</h2>
      <div class="header-controls">
        <DateRangeFilter
          v-model:start-date="startDate"
          v-model:end-date="endDate"
        />
        <button
          @click="fetchReport"
          class="btn btn-primary"
          :disabled="loading"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
            />
            <path
              d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"
            />
          </svg>
          {{ loading ? "Memuat..." : "Refresh" }}
        </button>
        <div class="divider"></div>
        <button
          @click="handleExport"
          class="btn btn-success"
          :disabled="reportData.length === 0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path
              d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"
            />
            <path
              d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"
            />
          </svg>
          Export
        </button>
      </div>
    </div>

    <!-- Menggunakan class 'panel-white' global -->
    <div class="grid-container panel-white">
      <div class="table-wrapper">
        <table>
          <!-- Menggunakan class 'table-header' global -->
          <thead class="table-header">
            <tr>
              <th>No SPK</th>
              <th>Tgl SPK</th>
              <th>Deadline</th>
              <th>Customer</th>
              <th>Nama Customer</th>
              <th>Nama Produk</th>
              <th>J. Order</th>
              <th>Status</th>
              <th>Ukuran</th>
              <th>Order</th>
              <th>Tgl Masuk</th>
              <th>P2</th>
              <th>MMT</th>
              <th>Jml Jadi</th>
              <th>Jml Kirim</th>
              <th>Jml Stok</th>
              <th>Last Kirim</th>
            </tr>
          </thead>
          <!-- Menggunakan class 'table-body' global -->
          <tbody class="table-body" v-if="loading">
            <tr>
              <td :colspan="17" class="empty-state">Memuat data laporan...</td>
            </tr>
          </tbody>
          <tbody class="table-body" v-else-if="paginatedData.length === 0">
            <tr>
              <td :colspan="17" class="empty-state">
                Tidak ada data untuk halaman ini.
              </td>
            </tr>
          </tbody>
          <tbody class="table-body" v-else>
            <tr v-for="row in paginatedData" :key="row.SPK_NOMOR">
              <td>{{ row.SPK_NOMOR }}</td>
              <td>{{ row.TANGGAL }}</td>
              <td>{{ row.DEADLINE }}</td>
              <td>{{ row.CUSTOMER }}</td>
              <td>{{ row.NAMA_CUSTOMER }}</td>
              <td>{{ row.NAMA }}</td>
              <td>{{ row.NAMA_J_ORDER }}</td>
              <td>{{ row.STATUS }}</td>
              <td>{{ row.UKURAN }}</td>
              <td class="text-right">{{ formatNumber(row.JUMLAH_ORDER) }}</td>
              <td>{{ row.TANGGAL_MASUK }}</td>
              <td class="text-right">{{ formatNumber(row.P2) }}</td>
              <td class="text-right">{{ formatNumber(row.MMT) }}</td>
              <td class="text-right">{{ formatNumber(row.J_JADI) }}</td>
              <td class="text-right">{{ formatNumber(row.J_KIRIM) }}</td>
              <td class="text-right">{{ formatNumber(row.J_STOCK) }}</td>
              <td>{{ row.LAST_KIRIM }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Menggunakan class 'pagination-controls' global -->
      <div class="pagination-controls">
        <select v-model.number="itemsPerPage" @change="currentPage = 1">
          <option value="15">15 baris</option>
          <option value="25">25 baris</option>
          <option value="50">50 baris</option>
          <option value="100">100 baris</option>
        </select>

        <div class="pagination-nav">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="btn-page"
          >
            &laquo; Prev
          </button>
          <span class="pagination-info">
            Halaman {{ currentPage }} dari {{ totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="btn-page"
          >
            Next &raquo;
          </button>
        </div>

        <span class="pagination-total">
          Total {{ reportData.length }} data
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { format, subDays } from "date-fns";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

const API_URL = "http://localhost:8003/api/mmt/laporan-stbj";

const endDate = ref(format(new Date(), "yyyy-MM-dd"));
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const reportData = ref([]);
const loading = ref(false);

const currentPage = ref(1);
const itemsPerPage = ref(15);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return reportData.value.slice(start, end);
});

const totalPages = computed(() => {
  if (reportData.value.length === 0) return 1;
  return Math.ceil(reportData.value.length / itemsPerPage.value);
});

const fetchReport = async () => {
  loading.value = true;
  currentPage.value = 1;
  try {
    const res = await axios.get(API_URL, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    reportData.value = res.data;
  } catch (error) {
    console.error("Gagal fetch laporan:", error);
    alert("Gagal mengambil data laporan.");
  } finally {
    loading.value = false;
  }
};

const handleExport = () => {
  alert("TODO: Implementasi export ke CSV atau Excel.");
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const formatNumber = (val) => {
  return new Intl.NumberFormat("id-ID").format(val || 0);
};

onMounted(fetchReport);
</script>

<style scoped>
/* CSS di sini HANYA berisi tata letak (layout), 
  semua warna dan tombol diambil dari theme.css global.
*/

.browse-container {
  display: flex;
  flex-direction: column;
  height: calc(
    100vh - 120px
  ); /* Sesuaikan tinggi sesuai padding dashboard Anda */
  gap: 1rem;
}

/* Panel Header */
.header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  flex-shrink: 0; /* Mencegah panel header menyusut */
}
.header-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

/* Kontainer Grid */
.grid-container {
  flex-grow: 1; /* Mengisi sisa ruang */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Penting untuk scroll internal */
}

/* Pembungkus Tabel (untuk scrolling) */
.table-wrapper {
  flex-grow: 1;
  overflow: auto; /* Scroll horizontal dan vertikal */
  /* Border diambil dari .panel-white */
}
table {
  width: 100%;
  border-collapse: collapse;
}

/* Kita hanya perlu CSS layout untuk 'th' dan 'td' di sini */
th,
td {
  /* Styling (warna, padding) diambil dari .table-header dan .table-body */
  border-bottom: 1px solid var(--color-border);
}
</style>
