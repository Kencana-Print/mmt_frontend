<template>
  <PageLayout
    title="Browse Hasil Kerja Sublim MMT"
    icon="mdi-printer-settings"
    class="custom-font"
  >
    <template #header-actions>
      <!-- cxButton2Click (Tambah Baru) -->
      <v-btn size="x-small" color="primary" @click="handleCreate">
        <v-icon start size="14">mdi-plus</v-icon> Baru
      </v-btn>

      <!-- cxButton1Click (Edit/Ubah) -->
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="handleEdit"
      >
        <v-icon start size="14">mdi-pencil</v-icon> Ubah
      </v-btn>

      <v-divider vertical class="mx-2" />

      <!-- cxButton4Click (Hapus) -->
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="handleDelete"
      >
        <v-icon start size="14">mdi-delete</v-icon> Hapus
      </v-btn>

      <!-- cxButton3Click (Cetak Slip) -->
      <v-btn
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="handlePrint"
      >
        <v-icon start size="14">mdi-printer</v-icon> Slip
      </v-btn>

      <!-- cxButton5Click (Input Bahan) -->
      <v-btn
        size="x-small"
        color="secondary"
        :disabled="!isSingleSelected"
        @click="handleBahan"
      >
        <v-icon start size="14">mdi-basket-outline</v-icon> Bahan
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Filter Section -->
      <v-card flat class="mb-4 border">
        <v-card-text class="pa-3">
          <div class="d-flex align-center flex-wrap ga-4">
            <DateRangeFilter
              v-model:start-date="filters.startDate"
              v-model:end-date="filters.endDate"
            />
            <v-btn
              variant="elevated"
              size="small"
              color="primary"
              @click="fetchMasterData"
              style="font-size: 11px"
            >
              <v-icon start size="14">mdi-magnify</v-icon> Refresh
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Main Data Table (Master) -->
      <v-data-table
        v-model:selected="selected"
        v-model:expanded="expanded"
        :headers="masterHeaders"
        :items="masterData"
        :loading="loading.master"
        item-value="nomor"
        density="compact"
        class="border elevation-1 main-grid custom-table"
        show-select
        select-strategy="single"
        show-expand
        fixed-header
        @click:row="handleRowClick"
      >
        <!-- Logika cxGrdMasterCustomDrawCell (Warna Merah jika Lengkap != 'Y') -->
        <template #[`item.nomor`]="{ item }">
          <span
            :class="item.Lengkap !== 'Y' ? 'text-error font-weight-bold' : ''"
          >
            {{ item.nomor }}
          </span>
        </template>

        <template #[`item.Jenis`]="{ item }">
          <v-chip
            size="x-small"
            :color="getJenisColor(item.Jenis)"
            variant="flat"
            label
          >
            {{ item.Jenis }}
          </v-chip>
        </template>

        <!-- Nested Detail Table (SQLDetail) -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
              <v-card
                variant="outlined"
                title="Detail Item Hasil Kerja Sublim"
                class="custom-font"
              >
                <v-data-table
                  :headers="detailHeaders"
                  :items="details[item.nomor] || []"
                  :loading="loadingDetails.has(item.nomor)"
                  density="compact"
                  hide-default-footer
                  class="custom-table"
                >
                  <!-- Perbaikan Slot Ukuran menggunakan PascalCase -->
                  <template #[`item.Ukuran`]="{ item }">
                    {{ item.Panjang }} x {{ item.Lebar }}
                  </template>

                  <!-- Perbaikan Slot Jumlah_Meter sesuai data JSON -->
                  <template #[`item.Jumlah_Meter`]="{ item }">
                    <span class="font-weight-bold">
                      {{ Number(item.Jumlah_Meter).toFixed(2) }}
                    </span>
                  </template>

                  <!-- Opsional: Perbaikan Slot Jumlah Hasil -->
                  <template #[`item.Jumlah`]="{ item }">
                    {{ item.Jumlah }}
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import Swal from "sweetalert2";
import PageLayout from "../components/PageLayout.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import api from "@/services/api";
import { format, subDays } from "date-fns";

const router = useRouter();
const toast = useToast();

// --- State ---
const selected = ref([]);
const expanded = ref([]);
const masterData = ref([]);
const details = ref<Record<string, any[]>>({});
const loading = reactive({ master: false });
const loadingDetails = ref(new Set());

const filters = reactive({
  startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// --- Table Headers (Mapping dari SQLMaster & SQLDetail) ---
const masterHeaders = [
  { title: "Nomor", key: "nomor", width: "150px" },
  { title: "Tanggal", key: "Tanggal", width: "120px" },
  { title: "Gudang", key: "Nama_Gudang" },
  { title: "Jenis", key: "Jenis", width: "100px" },
  { title: "Shift", key: "Shift", width: "80px" },
  { title: "Lengkap", key: "Lengkap", width: "80px" },
];

const detailHeaders = [
  { title: "No. Urut", key: "No_Urut", width: "70px" },
  { title: "No. SPK", key: "Nomor_SPK", width: "130px" },
  { title: "Nama SPK", key: "Nama_SPK" },
  { title: "Ukuran", key: "Ukuran", width: "110px" }, // Gabungan Panjang x Lebar
  { title: "J. Order", key: "J_Order", align: "end", width: "80px" },
  { title: "J. Hasil", key: "Jumlah", align: "end", width: "80px" },
  { title: "Mtr²", key: "Jumlah_Meter", align: "end", width: "90px" },
  { title: "Lokasi", key: "Lokasi", width: "100px" },
];

// --- Computed ---
const isSingleSelected = computed(() => selected.value.length === 1);
const selectedItemNomor = computed(() => selected.value[0]);

// --- Methods ---

const getJenisColor = (jenis: string) => {
  if (jenis === "MMT") return "blue-darken-2";
  if (jenis === "SUBLIM") return "purple-darken-2";
  if (jenis === "TEKSTIL") return "green-darken-2";
  return "grey";
};

const fetchMasterData = async () => {
  loading.master = true;
  try {
    // GANTI: Mengarah ke endpoint history approval sublim
    const response = await api.get("/lhk-sublim/approval-history", {
      params: filters,
    });
    masterData.value = response.data;
  } catch (error) {
    toast.error("Gagal mengambil data history approval");
  } finally {
    loading.master = false;
  }
};

// Logika Fetch Detail saat Baris di-expand
watch(expanded, async (newVal) => {
  if (newVal.length === 0) return;
  const lastExpanded = newVal[newVal.length - 1];

  if (lastExpanded && !details.value[lastExpanded]) {
    loadingDetails.value.add(lastExpanded);
    try {
      // GANTI: Mengarah ke endpoint detail approval history
      const res = await api.get(
        `/lhk-sublim/approval-history/detail/${lastExpanded}`,
      );
      details.value[lastExpanded] = res.data;
    } catch (e) {
      toast.error("Gagal memuat detail approval");
    } finally {
      loadingDetails.value.delete(lastExpanded);
    }
  }
});

const handleRowClick = (event: any, { item }: any) => {
  selected.value = [item.nomor];
};

const handleCreate = () => {
  router.push({ name: "LHKSublimMMTNew" });
};

const handleEdit = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "lhkSublimEdit",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleBahan = () => {
  if (!selectedItemNomor.value) return;
  router.push({
    name: "lhkSublimBahan",
    params: { nomor: selectedItemNomor.value },
  });
};

const handleDelete = async () => {
  if (!selectedItemNomor.value) return;

  const result = await Swal.fire({
    title: "Yakin ingin hapus?",
    text: `Data LHK Sublim Nomor: ${selectedItemNomor.value} akan dihapus beserta detailnya.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/sublim/lhk-sublim/${selectedItemNomor.value}`);
      toast.success("Berhasil dihapus.");
      fetchMasterData();
      selected.value = [];
    } catch (e) {
      toast.error("Gagal menghapus data.");
    }
  }
};

const handlePrint = () => {
  if (!selectedItemNomor.value) return;
  window.open(
    `/api/report/lhk-sublim-slip/${selectedItemNomor.value}`,
    "_blank",
  );
};

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
.custom-font {
  font-size: 11px !important;
}

:deep(.v-field__input),
:deep(input) {
  font-size: 11px !important;
  min-height: 32px !important;
}

.custom-table :deep(th),
.custom-table :deep(td) {
  font-size: 11px !important;
}

:deep(.v-btn) {
  font-size: 11px !important;
  text-transform: none;
}

.main-grid {
  height: calc(100vh - 220px);
}

:deep(.v-data-table-header th) {
  background-color: #f5f5f5 !important;
  font-weight: bold !important;
}

.text-error {
  color: #ff5252 !important;
}
</style>
