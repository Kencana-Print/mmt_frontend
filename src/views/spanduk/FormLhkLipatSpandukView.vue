<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import BaseForm from "@/components/BaseForm.vue";

const toast = useToast();
const router = useRouter();
const route = useRoute();

const API_LHK_LIPAT = "/spanduk/lhk-lipat";
const BROWSE_ROUTE = "LHK Lipat Spanduk";

const isSaving = ref(false);
const isLoading = ref(false);
const isEditMode = computed(() => !!route.params.nomor);

const showSaveDialog = ref(false);
const showCancelDialog = ref(false);
const showCloseDialog = ref(false);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
});

const detailData = ref<any[]>([
  { spk_nomor: "", spk_nama: "", qty_lipat: 0, tambah_lipat: 0, mata_ayam: 0 },
]);

const detailHeaders = [
  { title: "No", key: "no", width: "50px", sortable: false },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama SPK", key: "spk_nama", minWidth: "220px" },
  { title: "Jml Lipat", key: "qty_lipat", width: "100px", align: "end" },
  { title: "Tambah Lipat", key: "tambah_lipat", width: "120px", align: "end" },
  { title: "Mata Ayam", key: "mata_ayam", width: "100px", align: "end" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

const formTitle = computed(() =>
  isEditMode.value
    ? `Ubah LHK Lipat Spanduk: ${formData.nomor}`
    : "Tambah LHK Lipat Spanduk",
);

const addRow = () =>
  detailData.value.push({
    spk_nomor: "",
    spk_nama: "",
    qty_lipat: 0,
    tambah_lipat: 0,
    mata_ayam: 0,
  });

const removeRow = (idx: number) => {
  if (detailData.value.length > 1) detailData.value.splice(idx, 1);
};

const totalLipat = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.qty_lipat) || 0), 0),
);

const totalMataAyam = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.mata_ayam) || 0), 0),
);

const goBack = () => router.push({ name: BROWSE_ROUTE });

const loadEdit = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_LIPAT}/form/${encodeURIComponent(nomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data?.header || {};
    formData.nomor = h.llh_nomor || nomor;
    formData.tanggal = h.llh_tanggal
      ? format(new Date(h.llh_tanggal), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    formData.pab_kode = h.llh_pab_kode || "";
    formData.pab_nama = h.pab_nama || "";
    const d = data?.details || [];
    detailData.value = d.length
      ? d.map((x: any) => ({
          spk_nomor: x.Nomor_SPK || "",
          spk_nama: x.Nama_SPK || "",
          qty_lipat: Number(x.Qty_Lipat) || 0,
          tambah_lipat: Number(x.Tambah_Lipat) || 0,
          mata_ayam: Number(x.Mata_Ayam) || 0,
        }))
      : [
          {
            spk_nomor: "",
            spk_nama: "",
            qty_lipat: 0,
            tambah_lipat: 0,
            mata_ayam: 0,
          },
        ];
  } catch (e: any) {
    toast.error(
      e.response?.data?.message || `Gagal memuat data ${nomor}.`,
    );
    goBack();
  } finally {
    isLoading.value = false;
  }
};

const validateBeforeSave = () => {
  if (!formData.pab_kode.trim()) {
    toast.warning("Kode pabrik wajib diisi.");
    return;
  }
  const rows = detailData.value.filter(
    (r) => String(r.spk_nomor || "").trim() !== "",
  );
  if (rows.length === 0) {
    toast.warning("Detail SPK harus diisi minimal 1 baris.");
    return;
  }
  const seen = new Set<string>();
  for (const r of rows) {
    const k = String(r.spk_nomor).trim().toUpperCase();
    if (seen.has(k)) {
      toast.warning(`Nomor SPK ${k} duplikat.`);
      return;
    }
    seen.add(k);
  }
  showSaveDialog.value = true;
};

const executeSave = async () => {
  showSaveDialog.value = false;
  const rows = detailData.value.filter(
    (r) => String(r.spk_nomor || "").trim() !== "",
  );
  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.tanggal,
      pabKode: formData.pab_kode.trim().toUpperCase(),
      details: rows.map((r) => ({
        spkNomor: String(r.spk_nomor).trim().toUpperCase(),
        qtyLipat: Number(r.qty_lipat) || 0,
        tambahLipat: Number(r.tambah_lipat) || 0,
        mataAyam: Number(r.mata_ayam) || 0,
      })),
    };
    let savedNomor = "";
    if (isEditMode.value) {
      const nomor = route.params.nomor as string;
      const res = await api.put(
        `${API_LHK_LIPAT}/${encodeURIComponent(nomor)}`,
        payload,
      );
      savedNomor = res.data?.data?.nomor || nomor;
    } else {
      const res = await api.post(API_LHK_LIPAT, payload);
      savedNomor = res.data?.data?.nomor || "";
    }
    toast.success(`LHK lipat ${savedNomor} berhasil disimpan.`);
    goBack();
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
  <BaseForm
    :title="formTitle"
    menu-id="1223"
    icon="mdi-layers-outline"
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
          INFORMASI HEADER LHK LIPAT
        </div>

        <v-text-field
          v-model="formData.nomor"
          label="Nomor LHK"
          readonly
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2 bg-grey-lighten-3"
        />
        <v-text-field
          v-model="formData.tanggal"
          type="date"
          label="Tanggal"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-2"
        />
        <v-text-field
          v-model="formData.pab_kode"
          label="Kode Pabrik"
          variant="outlined"
          density="compact"
          hide-details
          placeholder="cth: P02"
          style="text-transform: uppercase"
          class="mb-2"
          @update:model-value="formData.pab_kode = String(formData.pab_kode || '').toUpperCase()"
        />
        <v-text-field
          v-model="formData.pab_nama"
          label="Nama Pabrik"
          readonly
          density="compact"
          variant="outlined"
          hide-details
          class="mb-2 bg-grey-lighten-3"
        />
      </div>
    </template>

    <!-- DETAIL GRID -->
    <template #right-column>
      <v-card flat border class="d-flex flex-column fill-height">
        <v-toolbar density="compact" color="blue-darken-2" flat>
          <v-toolbar-title class="text-subtitle-2 text-white">
            Detail SPK Lipat
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
          fixed-header
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

          <template #[`item.qty_lipat`]="{ item }">
            <v-text-field
              v-model.number="item.qty_lipat"
              type="number"
              density="compact"
              hide-details
              variant="underlined"
              class="text-right"
            />
          </template>

          <template #[`item.tambah_lipat`]="{ item }">
            <v-text-field
              v-model.number="item.tambah_lipat"
              type="number"
              step="any"
              density="compact"
              hide-details
              variant="underlined"
              class="text-right"
            />
          </template>

          <template #[`item.mata_ayam`]="{ item }">
            <v-text-field
              v-model.number="item.mata_ayam"
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
                Total :
              </td>
              <td class="text-end text-primary">
                {{ totalLipat.toLocaleString("id-ID") }}
              </td>
              <td></td>
              <td class="text-end text-primary">
                {{ totalMataAyam.toLocaleString("id-ID") }}
              </td>
              <td></td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </BaseForm>
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
