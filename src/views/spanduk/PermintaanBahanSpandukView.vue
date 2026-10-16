<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

const router = useRouter();
const toast = useToast();

// Endpoint backend (terdaftar di mmt_backend/index.js):
// GET /api/spanduk/permintaan-bahan/browse?startDate&endDate&jenis&cab
const API_PERMINTAAN_BAHAN_SPANDUK = "/spanduk/permintaan-bahan";

// --- State Management ---
const masterData = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const isLoading = ref(false);
const loadingDetails = ref(new Set<string>());
const selected = ref<any[]>([]);
const expanded = ref<any[]>([]);

// Filter tanggal: default 30 hari terakhir (state lokal, watch -> fetchData)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// Filter jenis & cabang: backend mendukung param `jenis` & `cab`
const jenisFilter = ref("ACCESORIES");
const jenisOptions = ["ACCESORIES", "OBAT", "SPAREPART", "ATK/RTK"];
const cabFilter = ref("ALL");
const cabOptions = ["ALL", "P01", "P02", "P03", "P04", "P05"];

const isSingleSelected = computed(() => selected.value.length === 1);
const selectedNomor = computed(() =>
  isSingleSelected.value ? selected.value[0].Nomor : null,
);

// --- Headers Master (mengikuti field response backend; kolom kondisional ikut backend) ---
const headers = computed(() => {
  const base: any[] = [
    {
      title: "Detail",
      key: "data-table-expand",
      minWidth: "60px",
      align: "center" as const,
      fixed: true,
    },
    { title: "Nomor", key: "Nomor", minWidth: "160px", fixed: true },
    { title: "Tanggal", key: "Tanggal", minWidth: "110px" },
    { title: "Jam", key: "Jam", minWidth: "90px", align: "center" as const },
    { title: "Jenis", key: "Jenis", minWidth: "110px" },
    { title: "Cab", key: "Cab", minWidth: "70px", align: "center" as const },
    { title: "Gudang Peminta", key: "GdgPeminta", minWidth: "170px" },
  ];

  // Backend hanya mengembalikan kolom Divisi/SPK utk jenis ACCESORIES,
  // dan kolom Bagian utk jenis SPAREPART (lihat permintaanBahan.service.js).
  if (jenisFilter.value === "ACCESORIES") {
    base.push(
      { title: "Divisi", key: "Divisi", minWidth: "130px" },
      { title: "No. SPK", key: "SPK", minWidth: "130px" },
      { title: "Nama SPK", key: "NamaSpk", minWidth: "200px" },
      {
        title: "Jml SPK",
        key: "JmlSpk",
        minWidth: "90px",
        align: "end" as const,
      },
    );
  } else if (jenisFilter.value === "SPAREPART") {
    base.push({ title: "Bagian", key: "Bagian", minWidth: "130px" });
  }

  base.push(
    { title: "Keterangan", key: "Keterangan", minWidth: "220px" },
    {
      title: "Status",
      key: "Status",
      minWidth: "100px",
      align: "center" as const,
    },
    {
      title: "Approve",
      key: "Approve",
      minWidth: "90px",
      align: "center" as const,
    },
    { title: "User", key: "Usr", minWidth: "120px" },
  );

  return base;
});

// --- Headers Detail (mengikuti field Detail response backend) ---
const detailHeaders = [
  { title: "Kode Bahan", key: "Kode", minWidth: "120px" },
  { title: "Nama Bahan", key: "Nama", minWidth: "250px" },
  {
    title: "Satuan",
    key: "Satuan",
    minWidth: "80px",
    align: "center" as const,
  },
  {
    title: "Jml Diminta",
    key: "Jumlah",
    minWidth: "110px",
    align: "end" as const,
  },
  {
    title: "Realisasi",
    key: "Realisasi",
    minWidth: "110px",
    align: "end" as const,
  },
  { title: "Keterangan", key: "Keterangan", minWidth: "200px" },
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
    const res = await api.get(`${API_PERMINTAAN_BAHAN_SPANDUK}/browse`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        jenis: jenisFilter.value,
        cab: cabFilter.value,
      },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Gagal mengambil data permintaan bahan spanduk.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Expand: backend sudah mengembalikan Detail satu paket dengan master ---
const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomor = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomor || details.value[nomor]) return;

  loadingDetails.value.add(nomor);
  try {
    const foundMaster = masterData.value.find((m) => m.Nomor === nomor);
    details.value[nomor] = foundMaster?.Detail || [];
  } catch {
    details.value[nomor] = [];
  } finally {
    loadingDetails.value.delete(nomor);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

// --- Row Click & Selection Style (ala Delphi: OPEN merah, PROSES biru) ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData?.Nomor) return;
  selected.value = selected.value.some((s) => s.Nomor === itemData.Nomor)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const data = item?.raw || item;
  let customClass = "cursor-pointer ";
  if (selected.value.some((s: any) => s.Nomor === data?.Nomor)) {
    customClass += "row-selected";
  } else if (data?.Status === "OPEN") {
    customClass += "text-red-custom font-weight-bold";
  } else if (data?.Status === "PROSES") {
    customClass += "text-blue-custom";
  }
  return { class: customClass };
};

// --- Aksi Navigasi ---
const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    router.push({ name: "PermintaanBahanSpandukNew" });
  } else if (selectedNomor.value) {
    // Router belum mendaftarkan route edit (hanya .../new); jangan navigasi buta.
    toast.warning(
      `Ubah ${selectedNomor.value} belum tersedia — route edit belum terdaftar di router.`,
    );
  }
};

const handleDelete = () => {
  if (!selectedNomor.value) {
    toast.warning("Pilih permintaan bahan yang akan dihapus.");
    return;
  }
  // Backend spanduk/permintaan-bahan hanya menyediakan GET /browse.
  toast.warning("Hapus belum didukung backend (endpoint DELETE belum ada).");
};

// --- Watcher reaktif otomatis untuk filter ---
watch([startDate, endDate, jenisFilter, cabFilter], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="minta-bahan-spanduk-wrapper">
    <BaseBrowse
      title="Permintaan Bahan Spanduk"
      icon="mdi-clipboard-list-outline"
      :headers="headers"
      :items="masterData"
      item-value="Nomor"
      :loading="isLoading"
      fixed-header
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      v-model:expanded="expanded"
      @refresh="fetchData"
      @action:new="handleNewEdit('new')"
      @action:edit="handleNewEdit('edit')"
      @action:delete="handleDelete"
      @row-click="handleRowClick"
      :row-props="getRowProps"
      @update:expanded="handleExpandUpdate(expanded)"
    >
      <!-- Filter Fields di Toolbar: jenis & cabang (didukung param backend) -->
      <template #filter-fields>
        <v-select
          v-model="jenisFilter"
          :items="jenisOptions"
          label="Jenis"
          density="compact"
          hide-details
          variant="outlined"
          class="mx-1"
          style="max-width: 160px"
        />
        <v-select
          v-model="cabFilter"
          :items="cabOptions"
          label="Cabang"
          density="compact"
          hide-details
          variant="outlined"
          class="mx-1"
          style="max-width: 130px"
        />
      </template>

      <!-- Custom Column Formatters -->
      <template #item.Tanggal="{ item }">
        {{ safeFormatDate(item.Tanggal) }}
      </template>

      <template #item.JmlSpk="{ item }">
        <div class="text-right">
          {{ Number(item.JmlSpk || 0).toLocaleString("id-ID") }}
        </div>
      </template>

      <template #item.Status="{ item }">
        <v-chip
          size="x-small"
          label
          class="font-weight-bold"
          :color="
            item.Status === 'OPEN'
              ? 'error'
              : item.Status === 'PROSES'
                ? 'info'
                : item.Status === 'CLOSE' || item.Status === 'DICLOSE'
                  ? 'grey'
                  : 'default'
          "
        >
          {{ item.Status }}
        </v-chip>
      </template>

      <template #item.Approve="{ item }">
        <v-chip
          v-if="item.Approve === 'Y'"
          color="success"
          size="x-small"
          label
          class="font-weight-bold"
        >
          Y
        </v-chip>
        <v-chip
          v-else-if="item.Approve === 'N'"
          color="warning"
          size="x-small"
          label
          class="font-weight-bold"
        >
          N
        </v-chip>
        <span v-else class="text-grey">-</span>
      </template>

      <!-- Sub-Grid Expanded Row Details -->
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
              <span class="text-caption">Memuat detail bahan...</span>
            </div>

            <div
              v-else-if="!details[item.Nomor] || details[item.Nomor].length === 0"
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
              <template #item.Realisasi="{ item: d }">
                <div class="text-right">
                  {{ Number(d.Realisasi || 0).toLocaleString("id-ID") }}
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
.minta-bahan-spanduk-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
.text-red-custom,
.text-red-custom td {
  color: #d32f2f !important;
}
.text-blue-custom,
.text-blue-custom td {
  color: #1976d2 !important;
}
</style>
