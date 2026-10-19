<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { format } from "date-fns";
import BaseForm from "@/components/BaseForm.vue";
import api from "@/services/api";

// Cermin Delphi ufrmHasilKerjaJahit (FORM, bukan browse).
// Backend: GET /spanduk/lhk-jahit/form/:nomor, POST /spanduk/lhk-jahit,
//          PUT /spanduk/lhk-jahit/:nomor
const API_LHK_JAHIT = "/spanduk/lhk-jahit";

interface JahitDetailItem {
  spkNomor: string;
  spkNama: string;
  jumlahOrder: number;
  panjang: number;
  lebar: number;
  qtyJahit: number;
  tambahJahit: number;
  tambahTali: number;
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

const nomor = ref("");
const tanggal = ref(format(new Date(), "yyyy-MM-dd"));
const pabKode = ref("");
const pabNama = ref("");
const pabrikList = ref<any[]>([]);
const details = ref<JahitDetailItem[]>([]);

const createEmptyRow = (): JahitDetailItem => ({
  spkNomor: "",
  spkNama: "",
  jumlahOrder: 0,
  panjang: 0,
  lebar: 0,
  qtyJahit: 0,
  tambahJahit: 0,
  tambahTali: 0,
});

const totalJahit = computed(() =>
  details.value.reduce((a, b) => a + (Number(b.qtyJahit) || 0), 0),
);

const fetchPabrikList = async () => {
  try {
    const res = await api.get("/mmt/lookup-pabrik");
    pabrikList.value = res.data?.data || res.data || [];
  } catch {
    pabrikList.value = [];
  }
};

const onPabrikChange = () => {
  const match = pabrikList.value.find((p: any) => p.Kode === pabKode.value);
  pabNama.value = match?.Nama || "";
};

// Resolve SPK: GET /mmt/spk/:nomor (pola FormLhkFinishingView) —
// mencakup tspk + tmemospk (cermin UNION di Delphi loaddata).
const resolveSpk = async (idx: number) => {
  const row = details.value[idx];
  if (!row) return;
  const kode = (row.spkNomor || "").trim().toUpperCase();
  if (!kode) return;
  if (row.spkNama) return;
  // Duplikat SPK ditolak (cermin cxspk_nomorPropertiesButtonClick Delphi).
  const dup = details.value.some(
    (d, i) => i !== idx && (d.spkNomor || "").trim().toUpperCase() === kode,
  );
  if (dup) {
    toast.error(`SPK ${kode} sudah ada pada baris lain.`);
    row.spkNomor = "";
    return;
  }
  try {
    const res = await api.get(`/mmt/spk/${encodeURIComponent(kode)}`);
    let d = res.data?.data || res.data;
    if (Array.isArray(d)) d = d[0];
    if (!d || !(d.SPK || d.Spk || d.spk_nomor || d.NoSpk)) {
      toast.error(`SPK ${kode} tidak ditemukan.`);
      row.spkNomor = "";
      return;
    }
    row.spkNomor = String(d.SPK || d.Spk || d.spk_nomor || d.NoSpk);
    row.spkNama = String(d.Nama || d.spk_nama || d.NamaBarang || "");
    row.jumlahOrder = Number(d.Jumlah || d.Qty || d.qty_order || d.Jumlah_Order || 0);
    row.panjang = Number(d.Panjang || d.panjang || 0);
    row.lebar = Number(d.Lebar || d.lebar || 0);
    ensureTrailingRow();
  } catch (e: any) {
    toast.error(e.response?.data?.message || `SPK ${kode} tidak ditemukan.`);
    row.spkNomor = "";
  }
};

const clearSpkRow = (idx: number) => {
  details.value[idx] = createEmptyRow();
};

const ensureTrailingRow = () => {
  const last = details.value[details.value.length - 1];
  if (!last || last.spkNomor.trim() !== "") details.value.push(createEmptyRow());
};

const removeRow = (idx: number) => {
  details.value.splice(idx, 1);
  if (!details.value.length) details.value.push(createEmptyRow());
};

const loadFormData = async (targetNomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_JAHIT}/form/${encodeURIComponent(targetNomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data.header || {};
    const d = data.details || [];
    isEditMode.value = true;
    nomor.value = h.Nomor || targetNomor;
    tanggal.value = h.Tanggal
      ? format(new Date(h.Tanggal), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    pabKode.value = h.Kode_Pabrik || "";
    pabNama.value = h.Nama_Pabrik || "";
    details.value = d.map((item: any) => ({
      spkNomor: item.Nomor_SPK || "",
      spkNama: item.Nama_SPK || "",
      jumlahOrder: Number(item.Jumlah_Order || 0),
      panjang: Number(item.Panjang || 0),
      lebar: Number(item.Lebar || 0),
      qtyJahit: Number(item.Qty_Jahit || 0),
      tambahJahit: Number(item.Tambah_Jahit || 0),
      tambahTali: Number(item.Tambah_Tali || 0),
    }));
    ensureTrailingRow();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal memuat data LHK jahit.");
    router.push("/mmt/spanduk/lhk-jahit");
  } finally {
    isLoading.value = false;
  }
};

const validateBeforeSave = () => {
  if (!tanggal.value) return toast.warning("Tanggal wajib diisi.");
  if (!pabKode.value) return toast.warning("Pabrik wajib dipilih.");
  const filled = details.value.filter((d) => d.spkNomor.trim() !== "");
  if (!filled.length)
    return toast.warning("Detail SPK minimal 1 baris (cermin Delphi).");
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  isSaving.value = true;
  try {
    const payload = {
      nomor: isEditMode.value ? nomor.value : "",
      tanggal: tanggal.value,
      pabKode: pabKode.value,
      details: details.value.filter((d) => d.spkNomor.trim() !== ""),
    };
    let res;
    if (isEditMode.value) {
      res = await api.put(
        `${API_LHK_JAHIT}/${encodeURIComponent(nomor.value)}`,
        payload,
      );
    } else {
      res = await api.post(API_LHK_JAHIT, payload);
    }
    const savedNomor = res.data?.data?.nomor || nomor.value;
    toast.success(`LHK Jahit ${savedNomor} berhasil disimpan.`);
    router.push("/mmt/spanduk/lhk-jahit");
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan LHK jahit.");
  } finally {
    isSaving.value = false;
  }
};

const goBack = () => {
  router.push("/mmt/spanduk/lhk-jahit");
};

onMounted(async () => {
  await fetchPabrikList();
  const paramNomor = route.params.nomor as string;
  if (paramNomor) {
    await loadFormData(paramNomor);
  } else {
    isEditMode.value = false;
    details.value = [createEmptyRow()];
  }
});
</script>

<template>
  <BaseForm
    :title="(isEditMode ? 'Ubah' : 'Tambah') + ' LHK Jahit Spanduk'"
    menu-id="1222"
    icon="mdi-needle"
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
          HEADER LHK JAHIT
        </div>

        <v-text-field
          v-model="nomor"
          label="Nomor LHK"
          density="compact"
          variant="outlined"
          readonly
          placeholder="Otomatis (LHK-J.YYMM.NNNN)"
          hide-details
          class="mb-2 bg-grey-lighten-4"
        />

        <v-text-field
          v-model="tanggal"
          type="date"
          label="Tanggal"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
        />

        <v-select
          v-model="pabKode"
          :items="pabrikList"
          item-title="Kode"
          item-value="Kode"
          label="Kode Pabrik"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2"
          @update:model-value="onPabrikChange"
        />

        <v-text-field
          v-model="pabNama"
          label="Nama Pabrik"
          density="compact"
          variant="outlined"
          readonly
          hide-details
          class="mb-2 bg-grey-lighten-4"
        />

        <div class="bg-grey-lighten-4 pa-3 rounded mt-2">
          <div class="text-caption text-grey-darken-2">
            Total Qty Jahit:
            <strong>{{ totalJahit.toLocaleString("id-ID") }}</strong>
          </div>
          <div class="text-caption text-grey-darken-2 mt-1">
            Rincian karyawan/borongan per SPK (Delphi grid bawah) belum
            diimplementasi — lihat GAP laporan.
          </div>
        </div>
      </div>
    </template>

    <!-- DETAIL GRID EDITABLE -->
    <template #right-column>
      <v-card border flat class="d-flex flex-column fill-height">
        <div class="table-container flex-grow-1">
          <table class="manksi-table">
            <thead>
              <tr>
                <th width="40">No</th>
                <th width="150">No. SPK</th>
                <th>Nama SPK</th>
                <th width="90" class="text-end">Jml Order</th>
                <th width="70" class="text-end">Pjg</th>
                <th width="70" class="text-end">Lbr</th>
                <th width="90" class="text-end">Qty Jahit</th>
                <th width="90" class="text-end">Tamb. Jahit</th>
                <th width="90" class="text-end">Tamb. Tali</th>
                <th width="40" class="text-center"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in details" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td class="p0">
                  <input
                    v-model="item.spkNomor"
                    class="cell-input spk-input"
                    style="text-transform: uppercase"
                    placeholder="Ketik SPK + Enter..."
                    :readonly="!!item.spkNama"
                    autocomplete="off"
                    @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
                    @blur="resolveSpk(index)"
                    @click="!item.spkNama && ((($event.target as HTMLInputElement).select()))"
                  />
                </td>
                <td>
                  <input
                    v-model="item.spkNama"
                    class="cell-input"
                    readonly
                    placeholder="Nama SPK..."
                  />
                </td>
                <td class="text-right">{{ Number(item.jumlahOrder || 0).toLocaleString("id-ID") }}</td>
                <td class="text-right">{{ item.panjang }}</td>
                <td class="text-right">{{ item.lebar }}</td>
                <td class="bg-yellow-lighten-5">
                  <input
                    type="number"
                    v-model.number="item.qtyJahit"
                    class="cell-input tr fw-bold"
                    :disabled="!item.spkNama"
                    min="0"
                  />
                </td>
                <td class="bg-yellow-lighten-5">
                  <input
                    type="number"
                    v-model.number="item.tambahJahit"
                    class="cell-input tr"
                    :disabled="!item.spkNama"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td class="bg-yellow-lighten-5">
                  <input
                    type="number"
                    v-model.number="item.tambahTali"
                    class="cell-input tr"
                    :disabled="!item.spkNama"
                    min="0"
                  />
                </td>
                <td class="text-center">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="item.spkNama ? removeRow(index) : clearSpkRow(index)"
                  >
                    ✕
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <v-divider />

        <div class="pa-2 d-flex bg-grey-lighten-4 align-center">
          <v-btn
            size="x-small"
            color="primary"
            variant="flat"
            @click="details.push(createEmptyRow())"
          >
            + Tambah Baris
          </v-btn>
          <v-spacer />
          <div class="text-caption font-weight-bold mr-4 text-primary">
            Total Qty Jahit: {{ totalJahit.toLocaleString("id-ID") }}
          </div>
        </div>
      </v-card>
    </template>
  </BaseForm>
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
  padding: 0 6px;
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
  min-height: 28px;
}
.cell-input:focus {
  background: #e3f2fd;
}
.spk-input {
  font-weight: 600;
  color: #1565c0;
}
.table-container {
  overflow: auto;
  height: 100%;
}
.tr {
  text-align: right;
}
.fw-bold {
  font-weight: bold;
}
</style>
