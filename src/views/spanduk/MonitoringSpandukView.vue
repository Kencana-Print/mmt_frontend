<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { format, subDays } from "date-fns";
import BaseBrowse from "@/components/BaseBrowse.vue";
import api from "@/services/api";
import type { MonitoringConfig } from "./monitoringColumns";

const props = defineProps<{ config: MonitoringConfig }>();

const toast = useToast();

const masterData = ref<any[]>([]);
const isLoading = ref(false);
const selected = ref<any[]>([]);
const search = ref("");
const perusahaan = ref("");

// Default periode: awal bulan s/d hari ini (mengikuti refreshdata Delphi).
const startDate = ref(
  format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
);
const endDate = ref(format(subDays(new Date(), 0), "yyyy-MM-dd"));

const fetchData = async () => {
  isLoading.value = true;
  selected.value = [];
  try {
    const res = await api.get(`${props.config.apiPath}/browse`, {
      params: {
        startDate: startDate.value,
        endDate: endDate.value,
        perusahaan: perusahaan.value,
      },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || `Gagal mengambil data ${props.config.title}.`,
    );
  } finally {
    isLoading.value = false;
  }
};

// Nomor urut + filter pencarian lokal.
const filteredData = computed(() => {
  const q = search.value.trim().toLowerCase();
  const keys = props.config.searchKeys || [];
  const rows = q
    ? masterData.value.filter((m) =>
        keys.some((k) => String(m[k] ?? "").toLowerCase().includes(q)),
      )
    : masterData.value;
  return rows.map((row, i) => ({ ...row, No: i + 1 }));
});

const fmt = (v: any) => Number(v || 0).toLocaleString("id-ID");

const handleRowClick = (_event: any, row: any) => {
  const d = row.item?.raw || row.item || row;
  if (!d) return;
  selected.value = selected.value.includes(d) ? [] : [d];
};

const getRowProps = ({ item }: any) => ({
  class: selected.value.includes(item) ? "row-selected cursor-pointer" : "cursor-pointer",
});

const notEditable = () =>
  toast.warning("Halaman monitoring hanya untuk melihat data.");

watch([startDate, endDate], fetchData);
onMounted(fetchData);
</script>

<template>
  <div class="mon-spanduk-wrapper">
    <BaseBrowse
      :title="config.title"
      :icon="config.icon"
      :headers="config.headers"
      :items="filteredData"
      :item-value="config.itemValue"
      :loading="isLoading"
      :search="search"
      :summary-fields="config.summaryFields"
      v-model:selected="selected"
      v-model:startDate="startDate"
      v-model:endDate="endDate"
      @refresh="fetchData"
      @action:new="notEditable"
      @action:edit="notEditable"
      @action:delete="notEditable"
      @row-click="handleRowClick"
      :row-props="getRowProps"
    >
      <template #filter-fields>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Cari SPK / Order"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 240px"
        />
        <v-text-field
          v-if="config.showPerusahaan"
          v-model="perusahaan"
          prepend-inner-icon="mdi-domain"
          label="Perusahaan"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 200px"
          @keyup.enter="fetchData"
        />
      </template>

      <!-- Format angka untuk tiap kolom numerik (dinamis). -->
      <template
        v-for="key in config.numericKeys"
        :key="key"
        #[`item.${key}`]="{ item }"
      >
        <div class="text-right">{{ fmt(item[key]) }}</div>
      </template>
    </BaseBrowse>
  </div>
</template>

<style scoped>
.mon-spanduk-wrapper {
  width: 100%;
}
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
