<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays, parseISO, isValid } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";

// --- Interfaces Retur Beli MMT ---
interface ReturBeliDetail {
  noUrut: number;
  sku: string;
  satuan: string;
  qty: number;
  harga: number;
  diskon: number;
  keterangan: string;
}

interface ReturBeliHeader {
  Nomor: string;
  Gudang: string;
  Tanggal: string;
  SupplierKode: string;
  NoPenerimaan: string;
  Keterangan: string;
  Details?: ReturBeliDetail[];
}

const API_RETUR_BELI = "/mmt/retur-beli";
const router = useRouter();

// --- State ---
const masterData = ref<ReturBeliHeader[]>([]);
const loading = ref(false);
const loadingDetailNomor = ref<string | null>(null);
const selected = ref<ReturBeliHeader[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Helpers ---
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  try {
    // 1. Parsing ISO Format dari Node.js/MySQL (e.g. 2022-12-19T17:00:00.000Z)
    const dateObj = parseISO(dateString);
    if (isValid(dateObj)) {
      return format(dateObj, "dd/MM/yyyy");
    }

    // 2. Fallback jika string berformat DD-Month-YYYY
    const [day, monthName, year] = dateString.split("-");
    if (day && monthName && year) {
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];
      const monthIndex = months.findIndex((m) =>
        m.toLowerCase().startsWith(monthName.toLowerCase())
      );
      if (monthIndex !== -1) {
        return format(new Date(Number(year), monthIndex, Number(day)), "dd/MM/yyyy");
      }
    }

    return dateString;
  } catch (e) {
    return dateString;
  }
};

// --- Headers ---
const masterHeaders = [
  { title: "Nomor Retur", key: "Nomor", minWidth: "150px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Kode Sup", key: "SupplierKode", minWidth: "120px" },
  { title: "Gudang", key: "Gudang", minWidth: "100px" },
  { title: "No. Penerimaan", key: "NoPenerimaan", minWidth: "150px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "No. Urut", key: "noUrut", minWidth: "70px" },
  { title: "Kode SKU", key: "sku", minWidth: "130px" },
  { title: "Satuan", key: "satuan", minWidth: "80px" },
  { title: "Qty", key: "qty", minWidth: "80px", align: "end" as const },
  { title: "Harga", key: "harga", minWidth: "110px", align: "end" as const },
  { title: "Diskon (%)", key: "diskon", minWidth: "90px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", minWidth: "200px" },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  expanded.value = [];
  try {
    const response = await api.get(API_RETUR_BELI, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    // Menyesuaikan struktur data response { success: true, data: [...] }
    masterData.value = response.data?.data || [];
  } catch (error) {
    console.error("Gagal memuat data retur beli:", error);
    masterData.value = [];
  } finally {
    loading.value = false;
  }
};

// Mengambil detail transaksi secara otomatis saat row di-expand
const loadDetailOnExpand = async (newlyExpandedItems: any[]) => {
  if (!newlyExpandedItems || newlyExpandedItems.length === 0) return;

  const targetNomor = newlyExpandedItems[newlyExpandedItems.length - 1];
  const nomorStr = typeof targetNomor === "object" ? targetNomor.Nomor : targetNomor;

  const itemInMaster = masterData.value.find((m) => m.Nomor === nomorStr);
  if (itemInMaster && !itemInMaster.Details) {
    loadingDetailNomor.value = nomorStr;
    try {
      const res = await api.get(`${API_RETUR_BELI}/${nomorStr}`);
      if (res.data?.data?.Details) {
        itemInMaster.Details = res.data.data.Details;
      } else {
        itemInMaster.Details = [];
      }
    } catch (err) {
      console.error(`Gagal memuat detail ${nomorStr}`, err);
      itemInMaster.Details = [];
    } finally {
      loadingDetailNomor.value = null;
    }
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  if (!confirm(`Hapus data retur beli ${nomor}?`)) return;

  try {
    await api.delete(`${API_RETUR_BELI}/${nomor}`);
    fetchData();
  } catch (e) {
    alert("Gagal menghapus data retur beli");
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Data Retur Beli MMT" icon="mdi-truck-fast-outline">
    <template #header-actions>
      <v-btn
        size="x-small"
        color="success"
        @click="router.push({ name: 'ReturBeliNew' })"
      >
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
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
            <DateRangeFilter
              v-model:start-date="startDate"
              v-model:end-date="endDate"
            />
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
          @update:expanded="loadDetailOnExpand"
        >
          <template #item.Tanggal="{ item }">
            {{ formatDate(item.Tanggal) }}
          </template>

          <template #item.Nomor="{ item }">
            <span class="font-weight-bold text-primary">{{ item.Nomor }}</span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="pa-0 border-0">
                <div class="detail-container">
                  <div
                    v-if="loadingDetailNomor === item.Nomor"
                    class="text-center py-2 text-caption text-grey"
                  >
                    Memuat detail item...
                  </div>
                  <v-data-table
                    v-else
                    :headers="detailHeaders"
                    :items="item.Details || []"
                    density="compact"
                    hide-default-footer
                    class="border-0 bg-transparent"
                  >
                    <template #[`item.qty`]="{ item: d }">
                      {{ Number(d.qty || 0).toFixed(2) }}
                    </template>
                    <template #[`item.harga`]="{ item: d }">
                      <span class="text-blue font-weight-bold">
                        {{ Number(d.harga || 0).toLocaleString() }}
                      </span>
                    </template>
                    <template #[`item.diskon`]="{ item: d }">
                      {{ Number(d.diskon || 0).toFixed(2) }}%
                    </template>
                  </v-data-table>
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
/* 1. Atur Ukuran Font Umum Tabel */
:deep(.v-data-table) {
  font-size: 11px !important;
}

/* 2. Atur Header Tabel (Master & Detail) */
:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 32px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  text-transform: uppercase;
}

/* 3. Atur Baris Tabel */
:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

/* 4. Container Detail */
.detail-container {
  padding: 8px 12px !important;
  background-color: #f1f3f4;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.table-container {
  margin-top: 4px;
}

.filter-section {
  background-color: #ffffff;
}

/* Warna Row Hover */
:deep(.v-data-table__tr:hover) {
  background-color: #f0f4f8 !important;
  cursor: pointer;
}
</style>