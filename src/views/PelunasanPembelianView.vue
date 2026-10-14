<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { useToast } from "vue-toastification";

/* --- Interfaces --- */
interface VoucherDetail {
  vchd_inv_nomor: string;
  vchd_nominal: number;
}

interface VoucherHeader {
  Nomor: string;
  Tanggal: string;
  Supplier: string;
  Total: number;
  Status: "OPEN" | "POSTED" | "VOID";
  Keterangan: string;
  Detail?: VoucherDetail[];
}

/* --- Constants --- */
const API_VOUCHER = "/mmt/voucher-pelunasan";
const router = useRouter();
const toast = useToast();

/* --- State --- */
const masterData = ref<VoucherHeader[]>([]);
const loading = ref(false);
const selected = ref<VoucherHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

/* --- Computed --- */
const isSingleSelected = computed(() => selected.value.length === 1);

/* --- Headers --- */
const masterHeaders = [
  { title: "No. Voucher", key: "Nomor", minWidth: "160px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Supplier", key: "Supplier", minWidth: "220px" },
  {
    title: "Total Pengajuan",
    key: "Total",
    minWidth: "140px",
    align: "end" as const,
  },
  {
    title: "Status",
    key: "Status",
    minWidth: "100px",
    align: "center" as const,
  },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Nomor Invoice", key: "vchd_inv_nomor", minWidth: "180px" },
  {
    title: "Nominal Pelunasan",
    key: "vchd_nominal",
    minWidth: "150px",
    align: "end" as const,
  },
];

/* --- Methods --- */
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(`${API_VOUCHER}/list`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    toast.error("Gagal memuat daftar voucher");
  } finally {
    loading.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return "orange";
    case "POSTED":
      return "blue";
    case "VOID":
      return "error";
    default:
      return "grey";
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleNew = () => {
  // Mengarah ke route VoucherPelunasanNew
  router.push({ name: "VoucherPelunasanNew" });
};

const handlePrint = () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  window.open(
    `${import.meta.env.VITE_API_URL}${API_VOUCHER}/print/${nomor}`,
    "_blank",
  );
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const target = selected.value[0];
  if (target.Status !== "OPEN") {
    toast.warning("Hanya voucher status OPEN yang bisa dihapus");
    return;
  }
  if (!confirm(`Hapus voucher ${target.Nomor}?`)) return;

  try {
    await api.delete(`${API_VOUCHER}/${target.Nomor}`);
    toast.success("Voucher berhasil dihapus");
    fetchData();
  } catch (e) {
    toast.error("Gagal menghapus voucher");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Voucher Pelunasan Hutang" icon="mdi-file-clock-outline">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleNew">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>

      <v-divider vertical class="mx-2" />

      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Voucher
      </v-btn>

      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-1">
        <v-card-text>
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <DateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" />
            <v-btn
              variant="text"
              size="x-small"
              @click="fetchData"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <div class="table-container">
        <v-data-table
          v-model:selected="selected"
          v-model:expanded="expanded"
          :headers="masterHeaders"
          :items="masterData"
          :loading="loading"
          item-value="Nomor"
          density="compact"
          class="desktop-table elevation-1 border"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
        >
          <template #item.Nomor="{ item }">
            <span class="font-weight-bold text-primary">{{ item.Nomor }}</span>
          </template>

          <template #item.Status="{ item }">
            <v-chip
              :color="getStatusColor(item.Status)"
              size="x-small"
              variant="tonal"
              class="font-weight-bold"
            >
              {{ item.Status }}
            </v-chip>
          </template>

          <template #item.Total="{ item }">
            <span class="font-weight-bold text-success">
              {{ formatCurrency(item.Total) }}
            </span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0 border-0">
                <div class="detail-container">
                  <v-card flat border class="bg-white">
                    <v-data-table
                      :headers="detailHeaders"
                      :items="item.Detail || []"
                      density="compact"
                      hide-default-footer
                      class="border-0 bg-transparent"
                    >
                      <template #item.vchd_nominal="{ item: d }">
                        <span class="font-weight-bold">{{
                          formatCurrency(d.vchd_nominal)
                        }}</span>
                      </template>
                    </v-data-table>
                    <v-divider />
                    <div class="pa-3 text-caption">
                      <v-icon size="small" color="grey" class="mr-1"
                        >mdi-information-outline</v-icon
                      >
                      <span class="font-weight-bold mr-1">Keterangan:</span>
                      {{ item.Keterangan || "-" }}
                    </div>
                  </v-card>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
/* Menyamakan font dan ukuran baris dengan ReturProduksi */
:deep(.v-data-table) {
  font-size: 11px !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 32px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  text-transform: uppercase;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

.detail-container {
  padding: 8px 12px !important;
  background-color: #f1f3f4;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.table-container {
  margin-top: 4px;
}

:deep(.v-data-table__tr:hover) {
  background-color: #f0f4f8 !important;
  cursor: pointer;
}

:deep(.v-data-table__selected) {
  background-color: #e3f2fd !important;
}
</style>
