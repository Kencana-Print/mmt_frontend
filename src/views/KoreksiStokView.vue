<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";
import { format, subDays } from "date-fns";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import { useDisplay } from "vuetify";

// --- Interfaces ---
interface DetailKoreksi {
  Nomor: string;
  Kode: string;
  Nama: string;
  Panjang: number;
  Lebar: number;
  Satuan: string;
  Stock: number;
  Fisik: number;
  Koreksi: number;
}

interface KoreksiStok {
  Nomor: string;
  Tanggal: string;
  Gudang: string;
  Tipe: string;
  Nama_Tipe: string;
  Keterangan: string;
  Detail: DetailKoreksi[];
}

const API_KOREKSI_STOK = "/mmt/koreksi-stok";
const router = useRouter();
const { mobile } = useDisplay();

// --- State ---
const masterData = ref<KoreksiStok[]>([]);
const loading = ref(false);
const selected = ref<KoreksiStok[]>([]);
const expanded = ref<string[]>([]);

const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);

// --- Headers ---
const masterHeaders = [
  { title: "Nomor", key: "Nomor", minWidth: "140px", fixed: true },
  { title: "Tanggal", key: "Tanggal", minWidth: "120px" },
  { title: "Gudang", key: "Gudang", minWidth: "180px" },
  { title: "Tipe", key: "Nama_Tipe", minWidth: "120px" },
  { title: "Keterangan", key: "Keterangan", minWidth: "250px" },
  { title: "", key: "data-table-expand", minWidth: "40px" },
];

const detailHeaders = [
  { title: "Kode", key: "Kode", minWidth: "120px" },
  { title: "Nama Barang", key: "Nama", minWidth: "250px" },
  { title: "Pjg", key: "Panjang", align: "end" as const },
  { title: "Lbr", key: "Lebar", align: "end" as const },
  { title: "Satuan", key: "Satuan" },
  { title: "Stok Sistem", key: "Stock", align: "end" as const },
  { title: "Fisik", key: "Fisik", align: "end" as const },
  { title: "Selisih", key: "Koreksi", align: "end" as const, color: "primary" },
];

// --- Methods ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const response = await api.get(API_KOREKSI_STOK, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    masterData.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal memuat data koreksi:", error);
  } finally {
    loading.value = false;
  }
};

const handleRowClick = (_event: any, row: any) => {
  selected.value = [row.item];
};

const handleAdd = () => {
  router.push({ name: "KoreksiStokNew" });
};

const handlePrintSlip = () => {
  if (!isSingleSelected.value) return;
  const nomor = selected.value[0].Nomor;
  // Logika cetak slip (bisa buka window baru atau modal)
  window.open(`/print/koreksi-stok/${nomor}`, "_blank");
};

const handleDelete = async () => {
  if (!isSingleSelected.value) return;

  const nomor = selected.value[0].Nomor;
  if (!confirm(`Yakin ingin menghapus data koreksi ${nomor}?`)) return;

  loading.value = true;
  try {
    // Sesuai logika Delphi: Hapus Detail lalu Header biasanya di-handle Backend dalam 1 transaction
    await api.delete(`${API_KOREKSI_STOK}/${nomor}`);
    alert("Hapus data Sukses.");
    fetchData(); // Refresh data
  } catch (error: any) {
    alert(
      "Hapus data Gagal: " + (error.response?.data?.message || "Server Error"),
    );
  } finally {
    loading.value = false;
  }
};

onMounted(() => fetchData());
watch([startDate, endDate], fetchData);
</script>

<template>
  <PageLayout title="Browse Koreksi Stok MMT" icon="mdi-package-variant-closed">
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="handleAdd">
        <v-icon start>mdi-plus</v-icon> Tambah Baru
      </v-btn>
      <v-divider vertical class="mx-2" />
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrintSlip"
      >
        <v-icon start>mdi-printer</v-icon> Cetak Slip
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
        class="ml-2"
      >
        <v-icon start>mdi-delete</v-icon> Hapus
      </v-btn>
    </template>

    <div class="browse-content">
      <v-card flat class="mb-2 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-3">
            <DateRangeFilter
              v-model:start-date="startDate"
              v-model:end-date="endDate"
            />
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              @click="fetchData"
              :loading="loading"
            >
              <v-icon start>mdi-magnify</v-icon> Refresh
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
          :items-per-page="-1"
          item-value="Nomor"
          density="compact"
          class="elevation-1 border"
          show-select
          select-strategy="single"
          return-object
          show-expand
          hover
          @click:row="handleRowClick"
        >
          <template #item.Tanggal="{ item }">
            <span class="font-weight-medium">{{ item.Tanggal }}</span>
          </template>

          <template #item.Nomor="{ item }">
            <span class="text-primary font-weight-bold">{{ item.Nomor }}</span>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="bg-grey-lighten-4 pa-0">
                <v-expand-transition>
                  <div class="pa-4">
                    <v-card variant="outlined" color="grey-lighten-1">
                      <v-card-title
                        class="text-subtitle-2 bg-white d-flex align-center"
                      >
                        <v-icon size="small" color="primary" class="mr-2"
                          >mdi-format-list-bulleted</v-icon
                        >
                        Rincian Koreksi Barang
                      </v-card-title>
                      <v-data-table
                        :headers="detailHeaders"
                        :items="item.Detail || []"
                        density="compact"
                        hide-default-footer
                        class="detail-table"
                      >
                        <template #item.Koreksi="{ item }">
                          <v-chip
                            size="x-small"
                            :color="item.Koreksi < 0 ? 'error' : 'success'"
                            label
                          >
                            {{ item.Koreksi }}
                          </v-chip>
                        </template>
                      </v-data-table>
                    </v-card>
                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.browse-content {
  padding: 12px;
}

.table-container {
  background: white;
}

:deep(.detail-table) {
  background: white !important;
}

:deep(.v-data-table-footer) {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

/* Styling ala Desktop App */
:deep(.v-data-table__th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
}

.detail-table :deep(.v-data-table__th) {
  background-color: #eeeeee !important;
}
</style>
