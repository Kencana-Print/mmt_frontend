<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";

// Cermin Delphi ufrmhasilkerjaquiring (simpandata + loaddata):
// header tlhk_quiring_hdr (nomor/tanggal/pab_kode) +
// detail tlhk_quiring_dtl per SPK (koli/oven/jemuran/potong).
const API_LHK_QUIRING = "/spanduk/lhk-quiring";
const BROWSE_ROUTE_NAME = "LHK Quiring Spanduk";

interface QuiringRow {
  spk_nomor: string;
  spk_nama: string;
  jumlah_order: number;
  panjang: number;
  lebar: number;
  koli: number;
  oven: number;
  jemuran: number;
  potong: number;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEditMode = computed(() => !!route.params.nomor);
const isLoading = ref(false);
const isSaving = ref(false);
const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);
const showSpkModal = ref(false);
const showPabrikModal = ref(false);
const activeRowIndex = ref(-1);

const header = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
});

const rows = ref<QuiringRow[]>([]);

const createEmptyRow = (): QuiringRow => ({
  spk_nomor: "",
  spk_nama: "",
  jumlah_order: 0,
  panjang: 0,
  lebar: 0,
  koli: 0,
  oven: 0,
  jemuran: 0,
  potong: 0,
});

const pick = (obj: any, keys: string[], fallback: any = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
};

// --- Lookup SPK (cermin cxspk_nomorPropertiesButtonClick: tolak duplikat) ---
const openSpkLookup = (idx: number) => {
  activeRowIndex.value = idx;
  showSpkModal.value = true;
};

const onSpkSelected = (raw: any) => {
  const idx = activeRowIndex.value;
  showSpkModal.value = false;
  if (idx < 0 || !rows.value[idx]) return;
  const d = Array.isArray(raw) ? raw[0] : raw?.raw || raw?.item || raw || {};
  const nomor = String(
    pick(d, ["SPK", "Spk", "spk_nomor", "Nomor_SPK", "Nomor", "nomor", "Kode", "kode"], ""),
  ).trim();
  if (!nomor) {
    toast.error("Gagal membaca Nomor SPK dari data terpilih.");
    return;
  }
  const dupe = rows.value.some((r, i) => i !== idx && r.spk_nomor === nomor);
  if (dupe) {
    toast.warning(`No. SPK ${nomor} sudah ada di baris lain.`);
    return;
  }
  rows.value[idx].spk_nomor = nomor;
  rows.value[idx].spk_nama = String(
    pick(d, ["Nama", "nama", "spk_nama", "Nama_SPK", "nama_spk"], ""),
  );
  rows.value[idx].jumlah_order = Number(pick(d, ["Jumlah", "jumlah", "spk_jumlah", "Jumlah_Order", "jumlah_order"], 0)) || 0;
  rows.value[idx].panjang = Number(pick(d, ["Panjang", "panjang", "spk_panjang"], 0)) || 0;
  rows.value[idx].lebar = Number(pick(d, ["Lebar", "lebar", "spk_lebar"], 0)) || 0;
  activeRowIndex.value = -1;
};

const clearSpkRow = (idx: number) => {
  rows.value[idx] = createEmptyRow();
};

// --- Lookup pabrik (cermin edtpabrikClickBtn: tpabrik) ---
const onPabrikSelected = (raw: any) => {
  const d = Array.isArray(raw) ? raw[0] : raw?.raw || raw?.item || raw || {};
  header.pab_kode = String(pick(d, ["Kode", "kode", "pab_kode", "Pab_Kode"], "")).trim();
  header.pab_nama = String(pick(d, ["Nama", "nama", "pab_nama", "Pab_Nama"], ""));
  showPabrikModal.value = false;
};

// --- Load edit (cermin loaddata) ---
const loadForm = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(`${API_LHK_QUIRING}/form/${encodeURIComponent(nomor)}`);
    const data = res.data?.data || res.data || {};
    const h = data.header || {};
    const d = data.details || [];
    header.nomor = h.Nomor || nomor;
    header.tanggal = (h.Tanggal || "").substring(0, 10) || format(new Date(), "yyyy-MM-dd");
    header.pab_kode = h.Pab_Kode || "";
    header.pab_nama = h.Pab_Nama || "";
    rows.value = d.map((item: any) => ({
      spk_nomor: item.Nomor_SPK || "",
      spk_nama: item.Nama_SPK || "",
      jumlah_order: Number(item.Jumlah_Order) || 0,
      panjang: Number(item.Panjang) || 0,
      lebar: Number(item.Lebar) || 0,
      koli: Number(item.J_Koli) || 0,
      oven: Number(item.J_Oven) || 0,
      jemuran: Number(item.J_Jemuran) || 0,
      potong: Number(item.J_Potong) || 0,
    }));
    if (!rows.value.length) rows.value = [createEmptyRow()];
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal memuat data LHK Quiring.");
    rows.value = [createEmptyRow()];
  } finally {
    isLoading.value = false;
  }
};

// --- Simpan (cermin simpandata: POST baru / PUT edit) ---
const validateBeforeSave = () => {
  if (!header.tanggal) return toast.warning("Tanggal wajib diisi.");
  if (!header.pab_kode.trim()) return toast.warning("Pabrik wajib diisi.");
  const filled = rows.value.filter((r) => r.spk_nomor.trim() !== "");
  if (!filled.length) return toast.warning("Detail SPK minimal 1 baris (isi No. SPK).");
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  const filled = rows.value.filter((r) => r.spk_nomor.trim() !== "");
  isSaving.value = true;
  try {
    const payload = {
      tanggal: header.tanggal,
      pab_kode: header.pab_kode.trim(),
      details: filled.map((r) => ({
        spk_nomor: r.spk_nomor.trim(),
        koli: Number(r.koli) || 0,
        oven: Number(r.oven) || 0,
        jemuran: Number(r.jemuran) || 0,
        potong: Number(r.potong) || 0,
      })),
    };
    let res;
    if (isEditMode.value) {
      res = await api.put(
        `${API_LHK_QUIRING}/${encodeURIComponent(String(route.params.nomor))}`,
        payload,
      );
    } else {
      res = await api.post(`${API_LHK_QUIRING}/`, payload);
    }
    toast.success(res.data?.message || "Simpan data berhasil.");
    goBack();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal simpan data.");
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => router.push({ name: BROWSE_ROUTE_NAME });

const totalOf = (key: keyof QuiringRow) =>
  rows.value.reduce((a, r) => a + (Number(r[key]) || 0), 0);

onMounted(async () => {
  if (isEditMode.value) {
    await loadForm(String(route.params.nomor));
  } else {
    rows.value = [createEmptyRow()];
  }
});
</script>

<template>
  <BaseForm
    :title="isEditMode ? `Ubah LHK Quiring: ${header.nomor}` : 'Tambah LHK Quiring'"
    menu-id="1224"
    icon="mdi-content-cut"
    :is-loading="isLoading"
    :is-saving="isSaving"
    v-model:showSaveDialog="showSaveDialog"
    v-model:showCancelDialog="showCancelDialog"
    v-model:showCloseDialog="showCloseDialog"
    @validate-save="validateBeforeSave"
    @confirm-save="executeSave"
    @confirm-cancel="goBack"
    @confirm-close="goBack"
  >
    <!-- HEADER -->
    <template #left-column>
      <div class="desktop-form-section header-section">
        <div class="text-caption font-weight-bold mb-3 text-primary">
          INFORMASI HEADER LHK QUIRING
        </div>

        <v-text-field
          v-model="header.nomor"
          label="No. LHK Quiring"
          readonly
          density="compact"
          variant="outlined"
          hide-details
          placeholder="Otomatis (LHK-Q.YYMM.NNNN)"
          class="mb-2 bg-grey-lighten-3"
        />
        <v-text-field
          v-model="header.tanggal"
          type="date"
          label="Tanggal"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        />
        <v-text-field
          v-model="header.pab_kode"
          label="Kode Pabrik"
          readonly
          density="compact"
          variant="outlined"
          append-inner-icon="mdi-magnify"
          hide-details
          style="cursor: pointer"
          class="mb-2"
          @click="showPabrikModal = true"
        />
        <v-text-field
          v-model="header.pab_nama"
          label="Nama Pabrik"
          readonly
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2 bg-grey-lighten-3"
        />
      </div>
    </template>

    <!-- DETAIL -->
    <template #right-column>
      <v-card flat border class="d-flex flex-column fill-height">
        <v-toolbar density="compact" color="blue-darken-2" flat>
          <v-toolbar-title class="text-subtitle-2 text-white">
            Detail SPK (Koli / Oven / Jemuran / Potong)
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            variant="elevated"
            prepend-icon="mdi-plus"
            class="mr-2"
            @click="rows.push(createEmptyRow())"
          >
            Tambah Baris
          </v-btn>
        </v-toolbar>

        <v-data-table
          :headers="[
            { title: 'No', key: 'no', width: '50px', sortable: false },
            { title: 'No. SPK', key: 'spk_nomor', width: '170px', sortable: false },
            { title: 'Nama SPK', key: 'spk_nama', minWidth: '200px', sortable: false },
            { title: 'Jml Order', key: 'jumlah_order', width: '100px', align: 'end', sortable: false },
            { title: 'Panjang', key: 'panjang', width: '90px', align: 'end', sortable: false },
            { title: 'Lebar', key: 'lebar', width: '90px', align: 'end', sortable: false },
            { title: 'Koli', key: 'koli', width: '90px', align: 'end', sortable: false },
            { title: 'Oven', key: 'oven', width: '90px', align: 'end', sortable: false },
            { title: 'Jemuran', key: 'jemuran', width: '90px', align: 'end', sortable: false },
            { title: 'Potong', key: 'potong', width: '90px', align: 'end', sortable: false },
            { title: '', key: 'actions', width: '50px', sortable: false },
          ]"
          :items="rows"
          :items-per-page="-1"
          density="compact"
          hide-default-footer
          fixed-header
        >
          <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

          <template #[`item.spk_nomor`]="{ item, index }">
            <v-text-field
              v-model="item.spk_nomor"
              readonly
              density="compact"
              variant="underlined"
              append-inner-icon="mdi-magnify"
              hide-details
              style="cursor: pointer"
              placeholder="Pilih SPK..."
              @click="openSpkLookup(index)"
            />
          </template>

          <template #[`item.spk_nama`]="{ item }">
            <span class="text-caption">{{ item.spk_nama || "-" }}</span>
          </template>

          <template #[`item.jumlah_order`]="{ item }">
            <div class="text-right">{{ Number(item.jumlah_order || 0).toLocaleString("id-ID") }}</div>
          </template>
          <template #[`item.panjang`]="{ item }">
            <div class="text-right">{{ Number(item.panjang || 0).toLocaleString("id-ID") }}</div>
          </template>
          <template #[`item.lebar`]="{ item }">
            <div class="text-right">{{ Number(item.lebar || 0).toLocaleString("id-ID") }}</div>
          </template>

          <template #[`item.koli`]="{ item }">
            <v-text-field
              v-model.number="item.koli"
              type="number"
              min="0"
              density="compact"
              variant="underlined"
              hide-details
              class="text-right"
              :disabled="!item.spk_nomor"
            />
          </template>
          <template #[`item.oven`]="{ item }">
            <v-text-field
              v-model.number="item.oven"
              type="number"
              min="0"
              density="compact"
              variant="underlined"
              hide-details
              class="text-right"
              :disabled="!item.spk_nomor"
            />
          </template>
          <template #[`item.jemuran`]="{ item }">
            <v-text-field
              v-model.number="item.jemuran"
              type="number"
              min="0"
              density="compact"
              variant="underlined"
              hide-details
              class="text-right"
              :disabled="!item.spk_nomor"
            />
          </template>
          <template #[`item.potong`]="{ item }">
            <v-text-field
              v-model.number="item.potong"
              type="number"
              min="0"
              density="compact"
              variant="underlined"
              hide-details
              class="text-right"
              :disabled="!item.spk_nomor"
            />
          </template>

          <template #[`item.actions`]="{ index }">
            <v-btn
              icon="mdi-delete"
              size="x-small"
              color="error"
              variant="text"
              :disabled="rows.length <= 1"
              @click="rows.length > 1 ? rows.splice(index, 1) : clearSpkRow(index)"
            />
          </template>

          <template #body.append v-if="rows.length > 0">
            <tr class="bg-blue-lighten-5 font-weight-bold">
              <td colspan="6" class="text-end text-uppercase text-caption">Total :</td>
              <td class="text-end">{{ totalOf('koli').toLocaleString("id-ID") }}</td>
              <td class="text-end">{{ totalOf('oven').toLocaleString("id-ID") }}</td>
              <td class="text-end">{{ totalOf('jemuran').toLocaleString("id-ID") }}</td>
              <td class="text-end">{{ totalOf('potong').toLocaleString("id-ID") }}</td>
              <td></td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </BaseForm>

  <SpkLookupModal
    :isVisible="showSpkModal"
    @close="showSpkModal = false"
    @select="onSpkSelected"
  />
  <PabrikLookupModal
    :isVisible="showPabrikModal"
    @close="showPabrikModal = false"
    @select="onPabrikSelected"
  />
</template>

<style scoped>
:deep(thead th) {
  background-color: #1976d2 !important;
  color: white !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
}
:deep(tbody td) {
  font-size: 11px !important;
}
:deep(input) {
  font-size: 12px;
}
</style>
