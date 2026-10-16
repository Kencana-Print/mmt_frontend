<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, parseISO, isValid, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";

const toast = useToast();
// Route backend (belum di-mount di index.js):
// index.js → app.use("/api/spanduk/rekap-lhk", rekapLhkSpandukRoutes)
// + routes GET /browse
const API_REKAP_LHK = "/spanduk/rekap-lhk";

// --- State Management ---
const masterData = ref<any[]>([]);
const isLoading = ref(false);
const selected = ref<any[]>([]);
const search = ref("");

// Filter tanggal default 30 hari terakhir (DateRangeFilter bawaan BaseBrowse)
const startDate = ref(format(subDays(new Date(), 30), "yyyy-MM-dd"));
const endDate = ref(format(new Date(), "yyyy-MM-dd"));

// --- Headers (kolom Delphi ufrmbrowserekaplhk.pas SQLMaster:
// Perusahaan/Tanggal SPK/Deadline/Nama SPK/Panjang/Lebar/Nomor SPK/
// Jumlah Order/Kurang Cetak/Kurang Jahit/Kurang Lipat; agregat, TANPA expand) ---
const headers = computed(() => [
  { title: "Perusahaan", key: "Perusahaan", minWidth: "100px", fixed: true },
  { title: "Tanggal SPK", key: "Tanggal_SPK", minWidth: "110px" },
  { title: "Deadline", key: "Dateline", minWidth: "110px" },
  { title: "Nama SPK", key: "Nama_SPK", minWidth: "250px" },
  { title: "Panjang", key: "Panjang", minWidth: "90px", align: "end" as const },
  { title: "Lebar", key: "Lebar", minWidth: "90px", align: "end" as const },
  { title: "Nomor SPK", key: "Nomor_SPK", minWidth: "150px" },
  { title: "Jumlah Order", key: "Jumlah_Order", minWidth: "110px", align: "end" as const },
  { title: "Kurang Cetak", key: "Kurang_Cetak", minWidth: "110px", align: "end" as const },
  { title: "Kurang Jahit", key: "Kurang_Jahit", minWidth: "110px", align: "end" as const },
  { title: "Kurang Lipat", key: "Kurang_Lipat", minWidth: "110px", align: "end" as const },
]);

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
  try {
    const res = await api.get(`${API_REKAP_LHK}/browse`, {
      params: { startDate: startDate.value, endDate: endDate.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data rekap LHK.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Row Click & Selection Style ---
const handleRowClick = (_event: any, row: any) => {
  const itemData = row.item?.raw || row.item || row;
  if (!itemData || !itemData.Nomor_SPK) return;
  selected.value = selected.value.some((s) => s.Nomor_SPK === itemData.Nomor_SPK)
    ? []
    : [itemData];
};

const getRowProps = ({ item }: any) => {
  const itemData = item?.raw || item;
  return {
    class: selected.value.some((s) => s.Nomor_SPK === itemData?.Nomor_SPK)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// Browse ini read-only: tidak ada form New/Edit/Delete.
const handleCrud = () => {
  toast.warning("Browse rekap LHK hanya untuk melihat data.");
};

const filteredData = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return masterData.value;
  return masterData.value.filter((m) =>
    [m.Nomor_SPK, m.Nama_SPK, m.Perusahaan]
      .filter(Boolean)
      .some((v: any) => String(v).toLowerCase().includes(q)),
  );
});

// --- Watcher reaktif: ganti tanggal otomatis fetch ulang ---
watch([startDate, endDate], fetchData);

onMounted(fetchData);
</script>

<template>
  <div class="rekap-lhk-spanduk-wrapper">
    <BaseBrowse
      title="Rekap LHK Spanduk"
      icon="mdi-table-large"
      :headers="headers"
      :items="filteredData"
      item-value="Nomor_SPK"
      :loading="isLoading"
      :search="search"
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      @refresh="fetchData"
      @action:new="handleCrud"
      @action:edit="handleCrud"
      @action:delete="handleCrud"
      @row-click="handleRowClick"
      :row-props="getRowProps"
    >
      <!-- Filter pencarian lokal -->
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari Nomor SPK / Nama / Perusahaan"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 320px"
        />
      </template>

      <!-- Format tanggal -->
      <template #item.Tanggal_SPK="{ item }">
        {{ safeFormatDate(item.Tanggal_SPK) }}
      </template>
      <template #item.Dateline="{ item }">
        {{ safeFormatDate(item.Dateline) }}
      </template>

      <!-- Format angka -->
      <template #item.Jumlah_Order="{ item }">
        <div class="text-right">
          {{ Number(item.Jumlah_Order || 0).toLocaleString("id-ID") }}
        </div>
      </template>
      <template #item.Kurang_Cetak="{ item }">
        <div class="text-right">
          {{ Number(item.Kurang_Cetak || 0).toLocaleString("id-ID") }}
        </div>
      </template>
      <template #item.Kurang_Jahit="{ item }">
        <div class="text-right">
          {{ Number(item.Kurang_Jahit || 0).toLocaleString("id-ID") }}
        </div>
      </template>
      <template #item.Kurang_Lipat="{ item }">
        <div class="text-right">
          {{ Number(item.Kurang_Lipat || 0).toLocaleString("id-ID") }}
        </div>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.rekap-lhk-spanduk-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
