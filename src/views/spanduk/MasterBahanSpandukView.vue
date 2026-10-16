<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import BaseBrowse from "@/components/BaseBrowse.vue";

const router = useRouter();
const toast = useToast();

// Backend dimount di index.js: /api/spanduk/master-bahan
// List: GET /spanduk (→ /api/spanduk/master-bahan/spanduk), params: zdivisi, q
const API_BAHAN = "/spanduk/master-bahan";
const API_LIST = `${API_BAHAN}/spanduk`;

// --- State Management ---
const masterData = ref<any[]>([]);
const loading = ref(false);
const selected = ref<any[]>([]);
const search = ref("");

// Filter divisi (server-side, satu-satunya filter list yang didukung backend
// selain q; default 1 = pola Delphi "brg_divisi in (1,5)")
const divisiFilter = ref<number>(1);

// Filter jenis & kategori (client-side — endpoint list tidak menerima
// parameter jenis/kategori; opsi diambil dari endpoint lookup backend)
const jenisFilter = ref<string>("");
const kategoriFilter = ref<string>("");
const jenisOptions = ref<any[]>([]);
const kategoriOptions = ref<any[]>([]);

// --- Headers (1:1 dengan SELECT Delphi ufrmBrowseBarang_spanduk.pas
// dan service getBahanData) ---
const headers = [
  { title: "Kode", key: "KODE", minWidth: "110px" },
  { title: "Nama Barang", key: "NAMA BARANG", minWidth: "250px" },
  { title: "Kategori", key: "KTGORI", minWidth: "140px" },
  { title: "Jenis", key: "JENIS", minWidth: "120px" },
  { title: "Gudang", key: "GUDANG", minWidth: "130px" },
  { title: "Divisi", key: "DIVISI", minWidth: "100px" },
  { title: "Supplier", key: "SUPPLIER", minWidth: "220px" },
  { title: "Konstruksi", key: "KONSTRUKSI", minWidth: "120px" },
  { title: "Panjang", key: "PANJANG", minWidth: "100px", align: "end" as const },
  { title: "Lebar", key: "LEBAR", minWidth: "100px", align: "end" as const },
  { title: "Satuan", key: "SATUAN", minWidth: "90px", align: "center" as const },
  { title: "Status", key: "STATUS", minWidth: "110px", align: "center" as const },
  { title: "Stok", key: "STOK", minWidth: "120px", align: "end" as const },
];

// --- Fetch Data ---
const fetchData = async () => {
  loading.value = true;
  selected.value = [];
  try {
    const res = await api.get(API_LIST, {
      params: { zdivisi: divisiFilter.value, q: search.value },
    });
    masterData.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal memuat master bahan spanduk.",
    );
  } finally {
    loading.value = false;
  }
};

const fetchLookups = async () => {
  try {
    const [jns, ktg] = await Promise.all([
      api.get(`${API_BAHAN}/lookup/jenis`),
      api.get(`${API_BAHAN}/lookup/kategori`),
    ]);
    jenisOptions.value = jns.data.data || jns.data || [];
    kategoriOptions.value = ktg.data.data || ktg.data || [];
  } catch {
    // Lookup gagal bukan fatal: dropdown fallback ke nilai distinct dari data
    const distinct = (key: string) =>
      [...new Set(masterData.value.map((r) => r[key]).filter(Boolean))].map(
        (n) => ({ Kode: n, Nama: n }),
      );
    if (!jenisOptions.value.length) jenisOptions.value = distinct("JENIS");
    if (!kategoriOptions.value.length)
      kategoriOptions.value = distinct("KTGORI");
  }
};

// Filter client-side untuk jenis/kategori (lookup mengembalikan Kode+Nama,
// sedangkan baris list memuat JENIS/KTGORI berupa nama → cocokkan via Nama)
const namaOf = (options: any[], kode: string) =>
  options.find((o) => String(o.Kode) === String(kode))?.Nama ?? "";

const displayItems = computed(() => {
  const jns = jenisFilter.value ? namaOf(jenisOptions.value, jenisFilter.value) : "";
  const ktg = kategoriFilter.value
    ? namaOf(kategoriOptions.value, kategoriFilter.value)
    : "";
  return masterData.value.filter((r) => {
    if (jns && String(r.JENIS ?? "") !== String(jns)) return false;
    if (ktg && String(r.KTGORI ?? "") !== String(ktg)) return false;
    return true;
  });
});

// --- Aksi Baru/Ubah: route form belum ada di router → peringatkan saja ---
const handleNewEdit = (mode: "new" | "edit") => {
  if (mode === "new") {
    if (router.hasRoute("BarangSpandukNew")) {
      router.push({ name: "BarangSpandukNew" });
    } else {
      toast.warning("Form tambah bahan spanduk belum tersedia.");
    }
    return;
  }
  const row = selected.value[0];
  if (!row?.KODE) {
    toast.warning("Pilih satu baris data terlebih dahulu.");
    return;
  }
  if (router.hasRoute("BarangSpandukEdit")) {
    router.push({ name: "BarangSpandukEdit", params: { kode: row.KODE } });
  } else {
    toast.warning("Form ubah bahan spanduk belum tersedia.");
  }
};

// Backend hanya menyediakan POST /save (verifyToken); tidak ada endpoint
// DELETE → hapus dinonaktifkan dengan pesan yang jelas.
const handleDelete = () => {
  if (!selected.value[0]?.KODE) {
    toast.warning("Pilih satu baris data terlebih dahulu.");
    return;
  }
  toast.warning(
    "Hapus belum didukung: backend tidak menyediakan endpoint DELETE master bahan.",
  );
};

// --- Row Click & Selection Style ---
const handleRowClick = (_event: any, row: any) => {
  const item = row.item?.raw || row.item || row;
  if (!item?.KODE) return;
  selected.value = selected.value.some((s: any) => s.KODE === item.KODE)
    ? []
    : [item];
};

const getRowProps = ({ item }: any) => {
  const data = item?.raw || item;
  return {
    class: selected.value.some((s: any) => s.KODE === data?.KODE)
      ? "row-selected cursor-pointer"
      : "cursor-pointer",
  };
};

// --- Watcher: search di-debounce, divisi langsung fetch ---
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchData, 400);
});
watch(divisiFilter, fetchData);
watch([jenisFilter, kategoriFilter], () => {
  selected.value = [];
});

onMounted(async () => {
  await fetchData();
  await fetchLookups();
});
</script>

<template>
  <BaseBrowse
    title="Master Bahan Spanduk"
    icon="mdi-package-variant"
    :headers="headers"
    :items="displayItems"
    item-value="KODE"
    :loading="loading"
    :has-date-filter="false"
    v-model:selected="selected"
    @refresh="fetchData"
    @action:new="handleNewEdit('new')"
    @action:edit="handleNewEdit('edit')"
    @action:delete="handleDelete"
    @row-click="handleRowClick"
    :row-props="getRowProps"
  >
    <!-- Search teks + filter dropdown (tanpa filter tanggal: master tanpa periode) -->
    <template #filter-fields>
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Cari Kode / Nama Barang"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 250px"
        @keyup.enter="fetchData"
      />
      <v-select
        v-model="divisiFilter"
        :items="[
          { title: 'Spanduk (1, 5)', value: 1 },
          { title: 'Garmen (3, 4)', value: 4 },
        ]"
        item-title="title"
        item-value="value"
        label="Kelompok Divisi"
        density="compact"
        hide-details
        variant="outlined"
        class="mx-1"
        style="max-width: 180px"
      />
      <v-select
        v-model="jenisFilter"
        :items="[{ Kode: '', Nama: 'Semua' }, ...jenisOptions]"
        item-title="Nama"
        item-value="Kode"
        label="Jenis"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        class="mx-1"
        style="max-width: 180px"
      />
      <v-select
        v-model="kategoriFilter"
        :items="[{ Kode: '', Nama: 'Semua' }, ...kategoriOptions]"
        item-title="Nama"
        item-value="Kode"
        label="Kategori"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        class="mx-1"
        style="max-width: 180px"
      />
    </template>

    <!-- Format angka -->
    <template #item.PANJANG="{ value }">
      {{ Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }) }}
    </template>

    <template #item.LEBAR="{ value }">
      {{ Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 2 }) }}
    </template>

    <template #item.STATUS="{ value }">
      <v-chip size="x-small" color="indigo" label class="font-weight-bold">
        {{ value }}
      </v-chip>
    </template>

    <template #item.STOK="{ value }">
      <div
        :class="
          Number(value) <= 0
            ? 'text-red font-weight-bold text-right'
            : 'text-green font-weight-bold text-right'
        "
      >
        {{ Number(value || 0).toLocaleString("id-ID") }}
      </div>
    </template>
  </BaseBrowse>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
