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

const API_LHK_PROOF = "/spanduk/lhk-proof";

const isSaving = ref(false);
const isLoading = ref(false);
const isEditMode = computed(() => !!route.params.nomor);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
});

interface ProofDetailRow {
  spk_nomor: string;
  spk_nama: string;
  spk_jumlahorder: number;
  spk_panjang: number;
  spk_lebar: number;
  j_plangkan: number;
  j_proof: number;
  j_meter: number;
  u1: string;
  u2: string;
  u3: string;
  u4: string;
  u5: string;
  u6: string;
  u7: string;
}

const createEmptyRow = (): ProofDetailRow => ({
  spk_nomor: "",
  spk_nama: "",
  spk_jumlahorder: 0,
  spk_panjang: 0,
  spk_lebar: 0,
  j_plangkan: 0,
  j_proof: 0,
  j_meter: 0,
  u1: "",
  u2: "",
  u3: "",
  u4: "",
  u5: "",
  u6: "",
  u7: "",
});

const detailData = ref<ProofDetailRow[]>([createEmptyRow()]);

const detailHeaders = [
  { title: "No", key: "no", width: "45px", sortable: false },
  { title: "No. SPK", key: "spk_nomor", width: "160px" },
  { title: "Nama SPK", key: "spk_nama", minWidth: "220px" },
  { title: "Order", key: "spk_jumlahorder", width: "80px", align: "end" },
  { title: "Pjg", key: "spk_panjang", width: "70px", align: "end" },
  { title: "Lbr", key: "spk_lebar", width: "70px", align: "end" },
  { title: "J Plangkan", key: "j_plangkan", width: "95px", align: "end" },
  { title: "J Proof", key: "j_proof", width: "85px", align: "end" },
  { title: "J Meter", key: "j_meter", width: "85px", align: "end" },
  { title: "U1", key: "u1", width: "90px" },
  { title: "U2", key: "u2", width: "90px" },
  { title: "U3", key: "u3", width: "110px" },
  { title: "U4", key: "u4", width: "90px" },
  { title: "U5", key: "u5", width: "90px" },
  { title: "U6", key: "u6", width: "90px" },
  { title: "U7", key: "u7", width: "90px" },
  { title: "", key: "actions", width: "50px", sortable: false },
];

const addRow = () => detailData.value.push(createEmptyRow());

const removeRow = (idx: number) => {
  if (detailData.value.length > 1) detailData.value.splice(idx, 1);
};

const totalPlangkan = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.j_plangkan) || 0), 0),
);

const totalProof = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.j_proof) || 0), 0),
);

const loadEdit = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_PROOF}/form/${encodeURIComponent(nomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data?.header || {};
    formData.nomor = h.lpr_nomor || nomor;
    formData.tanggal = h.lpr_tanggal
      ? format(new Date(h.lpr_tanggal), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    formData.pab_kode = h.lpr_pab_kode || "";
    formData.pab_nama = h.pab_nama || "";
    const d = data?.details || [];
    detailData.value = d.length
      ? d.map((x: any) => ({
          spk_nomor: x.spk_nomor || "",
          spk_nama: x.spk_nama || "",
          spk_jumlahorder: Number(x.spk_jumlahorder) || 0,
          spk_panjang: Number(x.spk_panjang) || 0,
          spk_lebar: Number(x.spk_lebar) || 0,
          j_plangkan: Number(x.j_plangkan) || 0,
          j_proof: Number(x.j_proof) || 0,
          j_meter: Number(x.j_meter) || 0,
          u1: x.u1 || "",
          u2: x.u2 || "",
          u3: x.u3 || "",
          u4: x.u4 || "",
          u5: x.u5 || "",
          u6: x.u6 || "",
          u7: x.u7 || "",
        }))
      : [createEmptyRow()];
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
  if (!window.confirm("Simpan data LHK proof ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.tanggal,
      pab_kode: formData.pab_kode,
      details: rows.map((r) => ({
        spk_nomor: String(r.spk_nomor).trim(),
        j_plangkan: Number(r.j_plangkan) || 0,
        j_proof: Number(r.j_proof) || 0,
        j_meter: Number(r.j_meter) || 0,
        u1: r.u1 || "",
        u2: r.u2 || "",
        u3: r.u3 || "",
        u4: r.u4 || "",
        u5: r.u5 || "",
        u6: r.u6 || "",
        u7: r.u7 || "",
      })),
    };
    let savedNomor = "";
    if (isEditMode.value) {
      const nomor = route.params.nomor as string;
      const res = await api.put(
        `${API_LHK_PROOF}/${encodeURIComponent(nomor)}`,
        payload,
      );
      savedNomor = res.data?.data?.nomor || nomor;
    } else {
      const res = await api.post(API_LHK_PROOF, payload);
      savedNomor = res.data?.data?.nomor || "";
    }
    toast.success(`LHK proof ${savedNomor} berhasil disimpan.`);
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
    :title="isEditMode ? `Edit LHK Proof: ${route.params.nomor}` : 'Input LHK Proof Spanduk'"
    icon="mdi-file-check-outline"
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
                placeholder="cth: P02"
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
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card flat border>
          <v-toolbar density="compact" color="blue-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Detail SPK Proof
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

            <template #[`item.spk_jumlahorder`]="{ item }">
              <div class="text-right">{{ item.spk_jumlahorder || 0 }}</div>
            </template>

            <template #[`item.spk_panjang`]="{ item }">
              <div class="text-right">{{ item.spk_panjang || 0 }}</div>
            </template>

            <template #[`item.spk_lebar`]="{ item }">
              <div class="text-right">{{ item.spk_lebar || 0 }}</div>
            </template>

            <template #[`item.j_plangkan`]="{ item }">
              <v-text-field
                v-model.number="item.j_plangkan"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
              />
            </template>

            <template #[`item.j_proof`]="{ item }">
              <v-text-field
                v-model.number="item.j_proof"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
              />
            </template>

            <template #[`item.j_meter`]="{ item }">
              <v-text-field
                v-model.number="item.j_meter"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
              />
            </template>

            <template v-for="n in 7" :key="n" #[`item.u${n}`]="{ item }">
              <v-text-field
                v-model="item[`u${n}`]"
                density="compact"
                hide-details
                variant="underlined"
                placeholder="-"
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
                <td colspan="6" class="text-end text-uppercase">
                  Total :
                </td>
                <td class="text-end text-primary">
                  {{ totalPlangkan.toLocaleString("id-ID") }}
                </td>
                <td class="text-end text-primary">
                  {{ totalProof.toLocaleString("id-ID") }}
                </td>
                <td colspan="9"></td>
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
