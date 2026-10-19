<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";
import SpkSearchModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";

// Cermin Delphi ufrmhasilkerjahapusplangkan:
// header tlhk_hapusplangkan_hdr (nomor/tanggal/pabrik) +
// grid detail tlhk_hapusplangkan_dtl incl. bahan kimia
// (rinso/porstek/m46/kaporit/caustik) per baris SPK.
const API_LHK_HAPUS_PLANGKAN = "/spanduk/lhk-hapus-plangkan";
const BROWSE_ROUTE_NAME = "LHK Hapus Plangkan Spanduk";

interface DetailRow {
  spk_nomor: string;
  spk_nama: string;
  spk_jumlahorder: number;
  spk_panjang: number;
  spk_lebar: number;
  j_plangkan: number;
  ukuran: number;
  j_rinso: number;
  j_porstek: number;
  j_m46: number;
  j_kaporit: number;
  j_caustik: number;
  keterangan: string;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isEditMode = ref(false);
const isLoading = ref(false);
const isSaving = ref(false);
const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);
const showSpkModal = ref(false);
const showPabrikModal = ref(false);
const activeDetailIndex = ref(-1);

const formHeader = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
});

const details = ref<DetailRow[]>([]);

const createEmptyRow = (): DetailRow => ({
  spk_nomor: "",
  spk_nama: "",
  spk_jumlahorder: 0,
  spk_panjang: 0,
  spk_lebar: 0,
  j_plangkan: 0,
  ukuran: 0,
  j_rinso: 0,
  j_porstek: 0,
  j_m46: 0,
  j_kaporit: 0,
  j_caustik: 0,
  keterangan: "",
});

const formTitle = computed(() =>
  isEditMode.value
    ? `Ubah LHK Hapus Plangkan: ${formHeader.nomor}`
    : "Tambah LHK Hapus Plangkan",
);

// Delphi cxjplangkanPropertiesEditValueChanged:
// jumlahmeter (disimpan) = j_plangkan * panjang SPK.
const rowJumlahMeter = (row: DetailRow) =>
  Number(((Number(row.j_plangkan) || 0) * (Number(row.spk_panjang) || 0)).toFixed(2));

// Delphi cl_ukuranPropertiesEditValueChanged (display only):
// jumlahmeter2 = j_plangkan * ukuran.
const rowJumlahMeter2 = (row: DetailRow) =>
  Number(((Number(row.j_plangkan) || 0) * (Number(row.ukuran) || 0)).toFixed(2));

const totalPlangkan = computed(() =>
  details.value.reduce((s, r) => s + (Number(r.j_plangkan) || 0), 0),
);

const extractItemData = (input: any): Record<string, any> => {
  let val = input;
  if (Array.isArray(val)) {
    if (val.length === 0) return {};
    val = val[0];
  }
  let depth = 0;
  while (val && typeof val === "object" && depth < 5) {
    if (val.raw && typeof val.raw === "object") val = val.raw;
    else if (val.item && typeof val.item === "object") val = val.item;
    else break;
    depth++;
  }
  return val && typeof val === "object" ? val : {};
};

// --- Lookup Pabrik (Delphi edtpabrikClickBtn: tpabrik) ---
const openPabrikLookup = () => {
  showPabrikModal.value = true;
};

const onPabrikSelected = (selectedItem: any) => {
  const d = extractItemData(selectedItem);
  formHeader.pab_kode = String(d.Kode || d.pab_kode || d.kode || "");
  formHeader.pab_nama = String(d.Nama || d.pab_nama || d.nama || "");
  showPabrikModal.value = false;
};

// --- Lookup SPK per baris (Delphi cxspk_nomorPropertiesButtonClick) ---
const openSpkLookup = (index: number) => {
  activeDetailIndex.value = index;
  showSpkModal.value = true;
};

const onSpkSelected = (selectedItem: any) => {
  const idx = activeDetailIndex.value;
  const d = extractItemData(selectedItem);
  showSpkModal.value = false;
  activeDetailIndex.value = -1;
  if (idx < 0 || !details.value[idx]) return;
  const nomor = String(
    d.SPK || d.spk_nomor || d.Nomor || d.nomor || d.Kode || "",
  ).trim();
  if (!nomor) {
    toast.error("Gagal membaca Nomor SPK dari data terpilih.");
    return;
  }
  const dup = details.value.some(
    (r, i) => i !== idx && r.spk_nomor.toUpperCase() === nomor.toUpperCase(),
  );
  if (dup) {
    toast.warning(`SPK ${nomor} sudah ada di baris lain.`);
    return;
  }
  const row = details.value[idx];
  row.spk_nomor = nomor;
  row.spk_nama = String(d.Nama || d.spk_nama || d.nama || row.spk_nama);
  row.spk_jumlahorder = Number(d.Jumlah ?? d.spk_jumlah ?? 0) || 0;
  // Modal SPK generik tidak membawa panjang/lebar: biarkan user isi manual
  // (lihat GAP di laporan); nilai dari mode edit dipertahankan.
  if (idx === details.value.length - 1) details.value.push(createEmptyRow());
};

const clearSpkRow = (index: number) => {
  details.value[index] = createEmptyRow();
};

const removeRow = (index: number) => {
  if (details.value.length > 1) details.value.splice(index, 1);
  else details.value[0] = createEmptyRow();
};

// --- Load edit (Delphi loaddata) ---
const loadForm = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_HAPUS_PLANGKAN}/form/${encodeURIComponent(nomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data.header || {};
    const d = Array.isArray(data.details) ? data.details : [];
    formHeader.nomor = h.lhp_nomor || nomor;
    formHeader.tanggal = h.lhp_tanggal
      ? format(new Date(h.lhp_tanggal), "yyyy-MM-dd")
      : formHeader.tanggal;
    formHeader.pab_kode = h.lhp_pab_kode || "";
    formHeader.pab_nama = h.pab_nama || "";
    details.value = d.map((item: any) => ({
      spk_nomor: item.spk_nomor || "",
      spk_nama: item.spk_nama || "",
      spk_jumlahorder: Number(item.spk_jumlahorder) || 0,
      spk_panjang: Number(item.spk_panjang) || 0,
      spk_lebar: Number(item.spk_lebar) || 0,
      j_plangkan: Number(item.j_plangkan) || 0,
      ukuran: Number(item.ukuran) || 0,
      j_rinso: Number(item.j_rinso) || 0,
      j_porstek: Number(item.j_porstek) || 0,
      j_m46: Number(item.j_m46) || 0,
      j_kaporit: Number(item.j_kaporit) || 0,
      j_caustik: Number(item.j_caustik) || 0,
      keterangan: item.keterangan || "",
    }));
    if (details.value.length === 0) details.value = [createEmptyRow()];
    else details.value.push(createEmptyRow());
    isEditMode.value = true;
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal memuat data LHK hapus plangkan.",
    );
  } finally {
    isLoading.value = false;
  }
};

// --- Simpan (Delphi simpandata: header upsert + hapus-insert details) ---
const validateBeforeSave = () => {
  if (!formHeader.pab_kode.trim()) {
    toast.warning("Pabrik harus diisi.");
    return;
  }
  const filled = details.value.filter((r) => r.spk_nomor.trim() !== "");
  if (filled.length === 0) {
    toast.warning("Detail SPK harus diisi minimal 1 baris.");
    return;
  }
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  const filled = details.value.filter((r) => r.spk_nomor.trim() !== "");
  isSaving.value = true;
  try {
    const payload = {
      tanggal: formHeader.tanggal,
      pab_kode: formHeader.pab_kode.trim(),
      details: filled.map((r) => ({
        spk_nomor: r.spk_nomor.trim(),
        j_plangkan: Number(r.j_plangkan) || 0,
        j_rinso: Number(r.j_rinso) || 0,
        j_porstek: Number(r.j_porstek) || 0,
        j_m46: Number(r.j_m46) || 0,
        j_kaporit: Number(r.j_kaporit) || 0,
        j_caustik: Number(r.j_caustik) || 0,
        keterangan: r.keterangan,
        ukuran: Number(r.ukuran) || 0,
        jumlahmeter: rowJumlahMeter(r),
      })),
    };
    let savedNomor = "";
    if (isEditMode.value) {
      const res = await api.put(
        `${API_LHK_HAPUS_PLANGKAN}/${encodeURIComponent(formHeader.nomor)}`,
        payload,
      );
      savedNomor =
        res.data?.data?.nomor || res.data?.nomor || formHeader.nomor;
    } else {
      const res = await api.post(API_LHK_HAPUS_PLANGKAN, payload);
      savedNomor = res.data?.data?.nomor || res.data?.nomor || "";
    }
    toast.success(`Simpan data berhasil (${savedNomor}).`);
    goBack();
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => router.push({ name: BROWSE_ROUTE_NAME });

onMounted(async () => {
  const nomor = route.params.nomor as string | undefined;
  if (nomor) {
    await loadForm(nomor);
  } else {
    details.value = [createEmptyRow()];
  }
});
</script>

<template>
  <BaseForm
    :title="formTitle"
    menu-id="1260"
    icon="mdi-eraser"
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
          INFORMASI HEADER LHK HAPUS PLANGKAN
        </div>

        <v-text-field
          v-model="formHeader.nomor"
          label="Nomor LHK"
          readonly
          density="compact"
          variant="outlined"
          hide-details
          placeholder="Otomatis (LHK-HP.YYMM.NNNN)"
          class="mb-2 bg-grey-lighten-3"
        />
        <v-text-field
          v-model="formHeader.tanggal"
          type="date"
          label="Tanggal"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        />
        <v-text-field
          v-model="formHeader.pab_kode"
          label="Kode Pabrik"
          readonly
          density="compact"
          variant="outlined"
          append-inner-icon="mdi-magnify"
          hide-details
          style="cursor: pointer"
          class="mb-2"
          @click="openPabrikLookup"
        />
        <v-text-field
          v-model="formHeader.pab_nama"
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
            Detail SPK + Bahan Kimia
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            variant="elevated"
            prepend-icon="mdi-plus"
            class="mr-2"
            @click="details.push(createEmptyRow())"
          >
            Tambah Baris
          </v-btn>
        </v-toolbar>

        <div class="table-container">
          <table class="manksi-table">
            <thead>
              <tr>
                <th width="40">No</th>
                <th width="140">No. SPK (F1)</th>
                <th min-width="180">Nama SPK</th>
                <th width="80" class="text-end">Jml Order</th>
                <th width="70" class="text-end">Pjg</th>
                <th width="70" class="text-end">Lbr</th>
                <th width="80" class="text-end">Jml Plangkan</th>
                <th width="70" class="text-end">Ukuran</th>
                <th width="90" class="text-end">Jml Meter*</th>
                <th width="90" class="text-end">Jml Mtr2</th>
                <th width="75" class="text-end">Rinso</th>
                <th width="75" class="text-end">Porstek</th>
                <th width="75" class="text-end">M46</th>
                <th width="75" class="text-end">Kaporit</th>
                <th width="75" class="text-end">Caustik</th>
                <th min-width="150">Keterangan</th>
                <th width="40"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in details" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="p0">
                  <div class="cell-grp">
                    <input
                      v-model="row.spk_nomor"
                      class="ci"
                      style="text-transform: uppercase; font-weight: 600; color: #1565c0"
                      placeholder="F1..."
                      :readonly="!!row.spk_nama"
                      autocomplete="off"
                      @click="!row.spk_nama && openSpkLookup(index)"
                    />
                    <button
                      v-if="row.spk_nomor"
                      type="button"
                      class="ci-btn"
                      title="Reset SPK"
                      @click.stop="clearSpkRow(index)"
                    >
                      X
                    </button>
                    <button
                      v-if="!row.spk_nama"
                      type="button"
                      class="ci-btn"
                      title="Cari SPK (F1)"
                      @mousedown.prevent="openSpkLookup(index)"
                    >
                      ?
                    </button>
                  </div>
                </td>
                <td>
                  <input v-model="row.spk_nama" class="cell-input" placeholder="Nama SPK..." />
                </td>
                <td class="tr">{{ Number(row.spk_jumlahorder || 0).toLocaleString("id-ID") }}</td>
                <td><input v-model.number="row.spk_panjang" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model.number="row.spk_lebar" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td class="bg-yellow-lighten-5">
                  <input v-model.number="row.j_plangkan" type="number" min="0" step="1" class="cell-input tr fw-bold" />
                </td>
                <td><input v-model.number="row.ukuran" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td class="tr fw-bold text-blue-darken-1">{{ rowJumlahMeter(row).toLocaleString("id-ID") }}</td>
                <td class="tr">{{ rowJumlahMeter2(row).toLocaleString("id-ID") }}</td>
                <td><input v-model.number="row.j_rinso" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model.number="row.j_porstek" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model.number="row.j_m46" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model.number="row.j_kaporit" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model.number="row.j_caustik" type="number" min="0" step="any" class="cell-input tr" /></td>
                <td><input v-model="row.keterangan" class="cell-input" /></td>
                <td class="text-center">
                  <v-btn size="x-small" variant="text" color="error" icon="mdi-delete" @click="removeRow(index)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <v-divider />
        <div class="pa-2 d-flex bg-grey-lighten-4 align-center">
          <span class="text-caption text-grey-darken-1">
            *Jml Meter = Jml Plangkan × Panjang (disimpan ke lhpd_jumlahmeter, cermin Delphi).
            Jml Mtr2 = Jml Plangkan × Ukuran (tampilan saja).
          </span>
          <v-spacer />
          <div class="text-caption font-weight-bold text-primary">
            Total Plangkan: {{ totalPlangkan.toLocaleString("id-ID") }}
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>

  <SpkSearchModal
    :isVisible="showSpkModal"
    :show="showSpkModal"
    v-model="showSpkModal"
    @close="showSpkModal = false"
    @select="onSpkSelected"
    @selected="onSpkSelected"
    @confirm="onSpkSelected"
  />
  <PabrikLookupModal
    :isVisible="showPabrikModal"
    @close="showPabrikModal = false"
    @select="onPabrikSelected"
  />
</template>

<style scoped>
.manksi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.manksi-table th {
  background: #1565c0;
  color: white;
  padding: 6px;
  position: sticky;
  top: 0;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.manksi-table td {
  border: 1px solid #e0e0e0;
  padding: 0 4px;
  height: 28px;
}
.manksi-table td.p0 {
  padding: 0;
}
.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 0 6px;
  outline: none;
  background: transparent;
  font-size: 11px;
}
.cell-input:focus {
  background: #e3f2fd;
}
.table-container {
  overflow: auto;
  max-height: 420px;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
.cell-grp {
  display: flex;
  align-items: center;
  height: 28px;
  background: white;
}
.cell-grp .ci {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 6px;
  font-size: 11px;
  min-width: 0;
}
.ci-btn {
  width: 24px;
  height: 100%;
  border: none;
  background: #e3f2fd;
  border-left: 1px solid #e0e0e0;
  cursor: pointer;
  font-size: 10px;
}
.ci-btn:hover {
  background: #bbdefb;
}
</style>
