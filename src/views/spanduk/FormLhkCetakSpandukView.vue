<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "@/components/PageLayout.vue";

const toast = useToast();
const router = useRouter();
const route = useRoute();

const API_LHK_CETAK = "/spanduk/lhk-cetak";

const isSaving = ref(false);
const isLoading = ref(false);
const isEditMode = computed(() => !!route.params.nomor);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
  jkar_borongan: 0,
  jkar_harian: 0,
});

const detailData = ref<any[]>([
  { spk_nomor: "", spk_nama: "", qty_cetak: 0, qty_plangkan: 0 },
]);

const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama SPK", key: "spk_nama", minWidth: "220px" },
  { title: "Qty Cetak", key: "qty_cetak", width: "110px", align: "end" },
  { title: "Jml Plangkan", key: "qty_plangkan", width: "120px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

const addRow = () =>
  detailData.value.push({
    spk_nomor: "",
    spk_nama: "",
    qty_cetak: 0,
    qty_plangkan: 0,
  });

const removeRow = (idx: number) => {
  if (detailData.value.length > 1) detailData.value.splice(idx, 1);
};

const totalCetak = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.qty_cetak) || 0), 0),
);

const loadEdit = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_CETAK}/form/${encodeURIComponent(nomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data?.header || {};
    formData.nomor = h.lch_nomor || nomor;
    formData.tanggal = h.lch_tanggal
      ? format(new Date(h.lch_tanggal), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    formData.pab_kode = h.lch_pab_kode || "";
    formData.pab_nama = h.pab_nama || "";
    formData.jkar_borongan = Number(h.lch_jkar_borongan) || 0;
    formData.jkar_harian = Number(h.lch_jkar_harian) || 0;
    const d = data?.details || [];
    detailData.value = d.length
      ? d.map((x: any) => ({
          spk_nomor: x.spk_nomor || "",
          spk_nama: x.spk_nama || "",
          qty_cetak: Number(x.qty_cetak) || 0,
          qty_plangkan: Number(x.qty_plangkan) || 0,
        }))
      : [{ spk_nomor: "", spk_nama: "", qty_cetak: 0, qty_plangkan: 0 }];
  } catch (e: any) {
    toast.error(
      e.response?.data?.message || `Gagal memuat data ${nomor}.`,
    );
    router.back();
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  const rows = detailData.value.filter(
    (r) => String(r.spk_nomor || "").trim() !== "",
  );
  if (rows.length === 0) {
    toast.warning("Detail SPK harus diisi minimal 1 baris.");
    return;
  }
  if (!window.confirm("Simpan data LHK cetak ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.tanggal,
      pab_kode: formData.pab_kode,
      jkar_borongan: Number(formData.jkar_borongan) || 0,
      jkar_harian: Number(formData.jkar_harian) || 0,
      details: rows.map((r) => ({
        spk_nomor: String(r.spk_nomor).trim(),
        qty_cetak: Number(r.qty_cetak) || 0,
        qty_plangkan: Number(r.qty_plangkan) || 0,
      })),
    };
    let savedNomor = "";
    if (isEditMode.value) {
      const nomor = route.params.nomor as string;
      const res = await api.put(
        `${API_LHK_CETAK}/${encodeURIComponent(nomor)}`,
        payload,
      );
      savedNomor = res.data?.data?.nomor || nomor;
    } else {
      const res = await api.post(API_LHK_CETAK, payload);
      savedNomor = res.data?.data?.nomor || "";
    }
    toast.success(`LHK cetak ${savedNomor} berhasil disimpan.`);
    router.back();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  const nomor = route.params.nomor as string | undefined;
  if (nomor) loadEdit(nomor);
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? `Edit LHK Cetak: ${route.params.nomor}` : 'Input LHK Cetak Spanduk'"
    icon="mdi-printer"
  >
    <template #header-actions>
      <v-btn
        size="small"
        color="primary"
        :loading="isSaving"
        :disabled="isLoading"
        @click="handleSave"
        class="mr-2"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan
      </v-btn>
      <v-btn size="small" variant="outlined" color="error" @click="router.back()">
        <v-icon start>mdi-arrow-left</v-icon> Kembali
      </v-btn>
    </template>

    <v-row dense>
      <v-col cols="12">
        <v-card flat border class="bg-grey-lighten-5 pa-4 mb-3">
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.nomor"
                label="Nomor LHK"
                readonly
                density="compact"
                variant="solo-filled"
                flat
                hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.tanggal"
                type="date"
                label="Tanggal"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="formData.pab_kode"
                label="Kode Pabrik"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="cth: P01"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.pab_nama"
                label="Nama Pabrik"
                readonly
                density="compact"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field
                v-model.number="formData.jkar_borongan"
                type="number"
                label="Karyawan Borongan"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="6" md="2">
              <v-text-field
                v-model.number="formData.jkar_harian"
                type="number"
                label="Karyawan Harian"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="blue-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Detail SPK Cetak
            </v-toolbar-title>
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="addRow"
              class="mr-2"
            >
              Tambah Baris
            </v-btn>
          </v-toolbar>

          <v-data-table
            :headers="detailHeaders"
            :items="detailData"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
          >
            <template #[`item.no`]="{ index }">{{ index + 1 }}</template>

            <template #[`item.spk_nomor`]="{ item }">
              <v-text-field
                v-model="item.spk_nomor"
                density="compact"
                variant="underlined"
                hide-details
                placeholder="No. SPK..."
                style="text-transform: uppercase"
                @update:model-value="item.spk_nomor = String(item.spk_nomor || '').toUpperCase()"
              />
            </template>

            <template #[`item.spk_nama`]="{ item }">
              <span class="text-caption">{{ item.spk_nama || "-" }}</span>
            </template>

            <template #[`item.qty_cetak`]="{ item }">
              <v-text-field
                v-model.number="item.qty_cetak"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
              />
            </template>

            <template #[`item.qty_plangkan`]="{ item }">
              <v-text-field
                v-model.number="item.qty_plangkan"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <v-btn
                icon="mdi-delete"
                size="x-small"
                color="error"
                variant="text"
                @click="removeRow(index)"
              />
            </template>

            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="3" class="text-end text-uppercase">
                  Total Qty Cetak :
                </td>
                <td class="text-end text-primary">
                  {{ totalCetak.toLocaleString("id-ID") }}
                </td>
                <td colspan="2"></td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>
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
:deep(.v-field input) {
  font-size: 12px;
}
</style>
