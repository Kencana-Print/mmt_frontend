<template>
  <PageLayout :title="formTitle" icon="mdi-printer-3d">
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        :loading="isSaving"
        :disabled="isSaving || isLoading || !isFormValid"
        @click="handleSave"
      >
        <v-icon start size="18">mdi-content-save-check</v-icon> Simpan
      </v-btn>
      <v-btn
        size="small"
        variant="outlined"
        :disabled="isSaving"
        class="ml-2"
        @click="handleBack"
      >
        <v-icon start size="18">mdi-arrow-left</v-icon> Kembali
      </v-btn>
    </template>

    <div class="form-grid-container">
      <!-- HEADER -->
      <div class="left-column">
        <v-card class="mb-3" flat border>
          <v-card-title class="text-subtitle-2 pa-2 custom-header text-white">
            Informasi LHK Plotter
          </v-card-title>
          <v-card-text class="pa-4">
            <v-text-field
              label="Nomor LHK"
              v-model="formData.nomor"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              placeholder="Otomatis (LHK-P.YYMM.NNNN)"
              class="mb-4 bg-grey-lighten-3"
            />
            <v-text-field
              label="Tanggal"
              v-model="formData.tanggal"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
            />
            <v-text-field
              label="Kode Pabrik (F1)"
              v-model="formData.pabKode"
              variant="outlined"
              density="compact"
              hide-details
              readonly
              append-inner-icon="mdi-magnify"
              class="mb-4 cursor-pointer"
              @click="lookup.pabrik = true"
              @click:append-inner="lookup.pabrik = true"
            />
            <v-text-field
              label="Nama Pabrik"
              v-model="formData.pabNama"
              readonly
              variant="outlined"
              density="compact"
              hide-details
              class="bg-grey-lighten-3"
            />
          </v-card-text>
        </v-card>
      </div>

      <!-- DETAIL GRID -->
      <div class="right-column">
        <v-card flat border class="d-flex flex-column h-100 rounded-0">
          <v-card-title class="text-subtitle-1 d-flex align-center pa-2 custom-header text-white">
            Detail SPK Plotter
            <v-spacer />
            <v-btn size="x-small" color="success" prepend-icon="mdi-plus" @click="addRow">
              Tambah Baris
            </v-btn>
          </v-card-title>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
            class="delphi-grid"
            fixed-header
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.spk_nomor`]="{ item }">
              <div class="cell-yellow h-100 d-flex align-center">
                <v-text-field
                  v-model="item.spk_nomor"
                  readonly
                  variant="plain"
                  density="compact"
                  hide-details
                  placeholder="F1 / pilih SPK..."
                  append-inner-icon="mdi-magnify"
                  class="table-input-inline font-weight-bold"
                  @click:append-inner="openSpkLookup(detailData.indexOf(item))"
                  @click="openSpkLookup(detailData.indexOf(item))"
                />
              </div>
            </template>

            <template #[`item.spk_nama`]="{ item }">
              <span class="text-caption">{{ item.spk_nama }}</span>
            </template>

            <template #[`item.order`]="{ item }">
              <span class="text-caption">{{ fmtNum(item.jumlah_order) }}</span>
            </template>

            <template #[`item.panjang`]="{ item }">
              <span class="text-caption">{{ fmtNum(item.panjang) }}</span>
            </template>

            <template #[`item.lebar`]="{ item }">
              <span class="text-caption">{{ fmtNum(item.lebar) }}</span>
            </template>

            <template #[`item.j_meter`]="{ item }">
              <v-text-field
                v-model.number="item.j_meter"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @update:model-value="recalcMeter(item)"
              />
            </template>

            <template #[`item.j_lembar`]="{ item }">
              <v-text-field
                v-model.number="item.j_lembar"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @update:model-value="recalcMeter(item)"
              />
            </template>

            <template #[`item.j_totalmeter`]="{ item }">
              <v-text-field
                v-model.number="item.j_totalmeter"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end font-weight-bold"
              />
            </template>

            <template #[`item.j_pk`]="{ item }">
              <v-text-field
                v-model.number="item.j_pk"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @update:model-value="recalcTinta(item)"
              />
            </template>

            <template #[`item.j_mk`]="{ item }">
              <v-text-field
                v-model.number="item.j_mk"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end"
                @update:model-value="recalcTinta(item)"
              />
            </template>

            <template #[`item.j_totaltinta`]="{ item }">
              <v-text-field
                v-model.number="item.j_totaltinta"
                type="number"
                min="0"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline text-end font-weight-bold"
              />
            </template>

            <template #[`item.keterangan`]="{ item }">
              <v-text-field
                v-model="item.keterangan"
                variant="plain"
                density="compact"
                hide-details
                class="table-input-inline"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn icon="mdi-delete" size="x-small" color="error" variant="text" @click="removeRow(index)" />
            </template>
          </v-data-table>
        </v-card>
      </div>
    </div>

    <SpkLookupModal
      :is-visible="lookup.spk"
      @close="lookup.spk = false"
      @select="handleSpkSelect"
    />
    <PabrikLookupModal
      :is-visible="lookup.pabrik"
      @close="lookup.pabrik = false"
      @select="handlePabrikSelect"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { format } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import PageLayout from "@/components/PageLayout.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";

const API_LHK_PLOTTER = "/spanduk/lhk-plotter";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const isLoading = ref(false);
const isSaving = ref(false);
const activeRowIdx = ref(-1);
const detailData = ref<any[]>([]);
const lookup = reactive({ spk: false, pabrik: false });

const formData = reactive({
  nomor: "",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pabKode: "",
  pabNama: "",
});

const detailHeaders = [
  { title: "No", key: "no", width: "40px", align: "center" as const },
  { title: "No. SPK (F1)", key: "spk_nomor", width: "150px" },
  { title: "Nama SPK", key: "spk_nama", width: "200px" },
  { title: "Jml Order", key: "order", width: "90px", align: "end" as const },
  { title: "Pjg", key: "panjang", width: "70px", align: "end" as const },
  { title: "Lbr", key: "lebar", width: "70px", align: "end" as const },
  { title: "J. Meter", key: "j_meter", width: "85px", align: "end" as const },
  { title: "J. Lembar", key: "j_lembar", width: "85px", align: "end" as const },
  { title: "J. Total M", key: "j_totalmeter", width: "95px", align: "end" as const },
  { title: "J. PK", key: "j_pk", width: "80px", align: "end" as const },
  { title: "J. MK", key: "j_mk", width: "80px", align: "end" as const },
  { title: "J. Tinta", key: "j_totaltinta", width: "90px", align: "end" as const },
  { title: "Keterangan", key: "keterangan", width: "180px" },
  { title: "", key: "actions", width: "50px" },
];

const isEditMode = computed(() => !!route.params.nomor);
const formTitle = computed(() =>
  isEditMode.value ? `Ubah LHK Plotter: ${route.params.nomor}` : "Tambah LHK Plotter Baru",
);
const isFormValid = computed(
  () =>
    !!formData.tanggal &&
    !!formData.pabKode &&
    detailData.value.some((d) => String(d.spk_nomor || "").trim() !== ""),
);

const fmtNum = (v: any) => Number(v || 0).toLocaleString("id-ID");

const createEmptyRow = () => ({
  spk_nomor: "",
  spk_nama: "",
  jumlah_order: 0,
  panjang: 0,
  lebar: 0,
  j_meter: 0,
  j_lembar: 0,
  j_totalmeter: 0,
  j_pk: 0,
  j_mk: 0,
  j_totaltinta: 0,
  keterangan: "",
});

// Cermin Delphi EditValueChanged: total = meter*lembar / pk*mk bila keduanya > 0.
const recalcMeter = (row: any) => {
  const m = Number(row.j_meter) || 0;
  const l = Number(row.j_lembar) || 0;
  if (m > 0 && l > 0) row.j_totalmeter = m * l;
};
const recalcTinta = (row: any) => {
  const p = Number(row.j_pk) || 0;
  const m = Number(row.j_mk) || 0;
  if (p > 0 && m > 0) row.j_totaltinta = p * m;
};

const addRow = () => detailData.value.push(createEmptyRow());
const removeRow = (idx: number) => detailData.value.splice(idx, 1);

const openSpkLookup = (idx: number) => {
  activeRowIdx.value = idx;
  lookup.spk = true;
};

const fillSpkRow = (idx: number, s: any) => {
  const row = detailData.value[idx];
  if (!row) return;
  const nomor = s.SPK || s.spk_nomor || s.Nomor_SPK || "";
  const dup = detailData.value.some((r, i) => i !== idx && r.spk_nomor === nomor);
  if (dup) {
    toast.warning(`SPK ${nomor} sudah ada di baris lain.`);
    return;
  }
  row.spk_nomor = nomor;
  row.spk_nama = s.Nama || s.spk_nama || s.Nama_SPK || "";
  row.jumlah_order = Number(s.Jumlah ?? s.spk_jumlah ?? s.Jumlah_Order ?? 0) || 0;
  row.panjang = Number(s.Panjang ?? s.spk_panjang ?? 0) || 0;
  row.lebar = Number(s.Lebar ?? s.spk_lebar ?? 0) || 0;
  lookup.spk = false;
};

const handleSpkSelect = async (selected: any) => {
  const idx = activeRowIdx.value;
  const raw = Array.isArray(selected) ? selected[0] : selected?.raw || selected;
  if (idx < 0 || !raw) {
    lookup.spk = false;
    return;
  }
  fillSpkRow(idx, raw);
  // Lengkapi panjang/lebar/jumlah dari union tspk+tmemospk bila modal tak membawa.
  if (!raw.Panjang && !raw.spk_panjang) {
    try {
      const res = await api.get(`${API_LHK_PLOTTER}/spk/${encodeURIComponent(raw.SPK || raw.spk_nomor)}`);
      const d = res.data?.data || {};
      const row = detailData.value[idx];
      if (row && d.spk_nomor) {
        row.spk_nama = row.spk_nama || d.spk_nama || "";
        row.jumlah_order = row.jumlah_order || Number(d.spk_jumlah) || 0;
        row.panjang = row.panjang || Number(d.spk_panjang) || 0;
        row.lebar = row.lebar || Number(d.spk_lebar) || 0;
      }
    } catch { /* abaikan: data modal sudah cukup */ }
  }
};

const handlePabrikSelect = (selected: any) => {
  const item = Array.isArray(selected) ? selected[0] : selected?.raw || selected || {};
  formData.pabKode = item.Kode || item.pab_kode || "";
  formData.pabNama = item.Nama || item.pab_nama || "";
  lookup.pabrik = false;
};

const handleSave = async () => {
  if (!formData.tanggal) return toast.warning("Tanggal wajib diisi.");
  if (!formData.pabKode) return toast.warning("Pabrik wajib diisi.");
  const filled = detailData.value.filter((d) => String(d.spk_nomor || "").trim() !== "");
  if (filled.length === 0) return toast.warning("Detail SPK minimal 1 baris.");
  if (!confirm(isEditMode.value ? "Simpan perubahan LHK ini?" : "Simpan LHK baru ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.tanggal,
      pab_kode: formData.pabKode,
      details: filled.map((d) => ({
        spk_nomor: d.spk_nomor,
        j_meter: Number(d.j_meter) || 0,
        j_lembar: Number(d.j_lembar) || 0,
        j_totalmeter: Number(d.j_totalmeter) || 0,
        j_pk: Number(d.j_pk) || 0,
        j_mk: Number(d.j_mk) || 0,
        j_totaltinta: Number(d.j_totaltinta) || 0,
        keterangan: d.keterangan || "",
      })),
    };
    let nomorSaved = "";
    if (isEditMode.value) {
      const nomor = route.params.nomor as string;
      const res = await api.put(`${API_LHK_PLOTTER}/${encodeURIComponent(nomor)}`, payload);
      nomorSaved = res.data?.data?.nomor || nomor;
    } else {
      const res = await api.post(API_LHK_PLOTTER, payload);
      nomorSaved = res.data?.data?.nomor || "";
    }
    toast.success(`LHK Plotter ${nomorSaved} berhasil disimpan.`);
    router.push({ name: "LHK Plotter Spanduk" });
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan LHK Plotter.");
  } finally {
    isSaving.value = false;
  }
};

const handleBack = () => router.push({ name: "LHK Plotter Spanduk" });

onMounted(async () => {
  detailData.value = [createEmptyRow()];
  const nomorParams = route.params.nomor as string;
  if (!nomorParams) return;
  isLoading.value = true;
  try {
    const res = await api.get(`${API_LHK_PLOTTER}/form/${encodeURIComponent(nomorParams)}`);
    const data = res.data?.data || {};
    const h = data.header || {};
    formData.nomor = h.Nomor || nomorParams;
    formData.tanggal = h.Tanggal ? format(new Date(h.Tanggal), "yyyy-MM-dd") : formData.tanggal;
    formData.pabKode = h.Kode_Pabrik || "";
    formData.pabNama = h.Nama_Pabrik || "";
    const d = data.details || [];
    detailData.value = d.length
      ? d.map((x: any) => ({
          spk_nomor: x.Nomor_SPK || "",
          spk_nama: x.Nama_SPK || "",
          jumlah_order: Number(x.Jumlah_Order) || 0,
          panjang: Number(x.Panjang) || 0,
          lebar: Number(x.Lebar) || 0,
          j_meter: Number(x.J_Meter) || 0,
          j_lembar: Number(x.J_Lembar) || 0,
          j_totalmeter: Number(x.J_TotalMeter) || 0,
          j_pk: Number(x.J_PK) || 0,
          j_mk: Number(x.J_MK) || 0,
          j_totaltinta: Number(x.J_Tinta) || 0,
          keterangan: x.Keterangan || "",
        }))
      : [createEmptyRow()];
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal memuat data LHK.");
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.form-grid-container {
  display: flex;
  gap: 16px;
  height: calc(100vh - 140px);
}
.left-column {
  width: 300px;
  flex-shrink: 0;
}
.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.right-column .v-card {
  display: flex;
  flex-direction: column;
  height: 100% !important;
  border-radius: 0 !important;
  overflow: hidden;
}
.delphi-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.delphi-grid :deep(.v-table__wrapper) {
  flex: 1;
  overflow-y: auto !important;
  overflow-x: auto !important;
}
.custom-header {
  background-color: #eeeeee !important;
  color: #000000 !important;
  font-weight: bold !important;
  border-bottom: 1px solid #ccc !important;
}
.cell-yellow {
  background-color: #ecf8ff !important;
}
.table-input-inline :deep(input) {
  padding: 4px 8px !important;
  min-height: 28px !important;
  font-size: 12px !important;
  color: #000000 !important;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
