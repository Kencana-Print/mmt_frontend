<template>
  <PageLayout title="Data Invoice Pembelian" icon="mdi-file-document-multiple">
    <template #header-actions>
      <v-btn
        v-if="authStore.can(MENU_ID, 'insert')"
        size="x-small"
        color="success"
        @click="handleNew"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'edit')"
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-btn
        v-if="authStore.can(MENU_ID, 'delete')"
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
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <DateRangeFilter
              v-model:start-date="filters.startDate"
              v-model:end-date="filters.endDate"
            />

            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading"
            >
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
          :headers="masterHeaders"
          :items="masterData || []"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          show-select
          show-expand
          return-object
          @click:row="handleRowClick"
          :row-props="getRowProps"
        >
          <template #item.Tanggal="{ item }">
            {{ safeFormatDate(item.Tanggal) }}
          </template>

          <template #item.Total="{ item }">
            <span class="font-weight-bold">{{
              formatCurrency(item.Total)
            }}</span>
          </template>

          <template #item.Status="{ item }">
            <v-chip :color="getStatusColor(item.Status)" size="x-small" label>
              {{ item.Status }}
            </v-chip>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length">
                <div class="detail-container">
                  <div class="detail-table-wrapper">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="item.Detail || []"
                      density="compact"
                      class="detail-table"
                      :items-per-page="-1"
                      hide-default-footer
                    >
                      <template #item.Harga="{ item: d }">
                        {{ formatCurrency(d.Harga) }}
                      </template>
                      <template #item.SubTotal="{ item: d }">
                        {{ formatCurrency(d.SubTotal) }}
                      </template>
                    </v-data-table>

                    <div
                      v-if="!(item.Detail && item.Detail.length)"
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

/* ================= DUMMY AUTH ================= */
const useAuthStore = () => ({
  can: (menuId: string, action: string) => true,
  KDUSER: "ADMIN",
});
const authStore = useAuthStore();

/* ================= INTERFACES ================= */
interface InvoiceDetail {
  NoUrut: number;
  Kode: string;
  Nama: string;
  Satuan: string;
  Jumlah: number;
  Harga: number;
  SubTotal: number;
}

interface InvoiceHeader {
  Nomor: string;
  Tanggal: string;
  Supplier?: string;
  Status?: string;
  Total: number;
  Detail?: InvoiceDetail[];
}

/* ================= CONST ================= */
const API_INVOICE = "/mmt/invoice";
const MENU_ID = "MMT_INVOICE_PEMBELIAN";

/* ================= UTILS ================= */
const router = useRouter();
const toast = useToast();

/* ================= STATE ================= */
const masterData = ref<InvoiceHeader[]>([]);
const loading = ref<boolean>(false);
const selected = ref<InvoiceHeader[]>([]);
const expanded = ref<string[]>([]);

const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
const today = format(new Date(), "yyyy-MM-dd");

const filters = reactive({
  startDate: thirtyDaysAgo,
  endDate: today,
});

/* ================= COMPUTED ================= */
const isSingleSelected = computed(() => selected.value.length === 1);

const selectedNomor = computed<string | null>(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

/* ================= HELPERS ================= */
const safeFormatDate = (dateString?: string): string => {
  if (!dateString) return "";
  // Handle format DD-MM-YYYY dari backend
  return dateString;
};

const formatCurrency = (val: any) => {
  const num = Number(val || 0);
  return new Intl.NumberFormat("id-ID").format(num);
};

const getStatusColor = (status: string) => {
  if (!status) return "info";
  switch (status.toUpperCase()) {
    case "OPEN":
      return "success";
    case "CLOSED":
      return "grey";
    default:
      return "info";
  }
};

const getRowProps = ({ item }: { item: any }) => {
  return {
    class: item?.Nomor === selectedNomor.value ? "row-selected" : "",
  };
};

/* ================= HEADERS ================= */
const masterHeaders = [
  { title: "Nomor Invoice", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Supplier", key: "Supplier", minWidth: "220px" },
  { title: "Status", key: "Status", minWidth: "100px" },
  { title: "Total", key: "Total", minWidth: "140px", align: "end" as const },
  { title: "", key: "data-table-expand" },
] as const;

const detailHeaders = [
  { title: "No", key: "NoUrut", width: "50px" },
  { title: "Kode", key: "Kode", width: "120px" },
  { title: "Nama Barang", key: "Nama", minWidth: "250px" },
  { title: "Satuan", key: "Satuan", width: "80px" },
  { title: "Jumlah", key: "Jumlah", width: "100px", align: "end" as const },
  { title: "Harga", key: "Harga", width: "120px", align: "end" as const },
  { title: "SubTotal", key: "SubTotal", width: "130px", align: "end" as const },
] as const;

/* ================= API ================= */
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_INVOICE, {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    });

    const res = response.data;
    masterData.value = Array.isArray(res) ? res : res.data || [];
  } catch (err) {
    toast.error("Gagal mengambil data Invoice Pembelian.");
  } finally {
    loading.value = false;
  }
};

/* ================= ACTIONS ================= */
const handleRowClick = (event: Event, row: any) => {
  selected.value = [row.item];
};

const handleNew = () => {
  router.push({ name: "InvoiceNew" });
};

const handleEdit = () => {
  if (!selectedNomor.value) return;
  router.push({
    name: "InvoicePembelianEdit",
    params: { nomor: selectedNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedNomor.value) return;
  if (confirm(`Hapus Invoice ${selectedNomor.value}?`)) {
    try {
      await api.delete(`${API_INVOICE}/${selectedNomor.value}`);
      toast.success("Invoice berhasil dihapus.");
      await fetchData();
    } catch (error) {
      toast.error("Gagal menghapus invoice.");
    }
  }
};

const handlePrint = () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih satu invoice terlebih dahulu");
    return;
  }

  const url = router.resolve({
    name: "InvoicePrint", // Pastikan nama ini SAMA dengan di router
    params: { nomor: selectedNomor.value },
  }).href;

  window.open(url, "_blank");
};

/* ================= LIFECYCLE ================= */
// CUKUP FETCHDATA SAJA
onMounted(fetchData);

// JANGAN masukkan logika printData di sini
watch(filters, fetchData, { deep: true });
</script>

<style scoped>
.browse-content {
  padding-top: 10px;
}
.filter-section {
  padding: 10px 16px;
}

/* Detail Expand Style */
.detail-container {
  padding: 10px 0;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}
.detail-table-wrapper {
  padding: 0 20px 0 60px;
}
.detail-table {
  background-color: white !important;
  font-size: 0.8rem;
  border: 1px solid #eee;
}

/* Highlight Selected Row */
:deep(.row-selected) {
  background-color: #d8efff !important;
}

.v-data-table :deep(tbody tr:hover) {
  cursor: pointer;
}
</style>
