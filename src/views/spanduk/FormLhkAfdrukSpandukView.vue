<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "vue-toastification";
import PageLayout from "@/components/PageLayout.vue";
import SpkLookupModal from "@/modal/SpkLookupModal.vue";
import PabrikLookupModal from "@/modal/PabrikLookupModal.vue";

const toast = useToast();
const router = useRouter();
const route = useRoute();

const API_LHK_AFDRUK = "/spanduk/lhk-afdruk";

const isSaving = ref(false);
const isLoading = ref(false);
const isEditMode = computed(() => !!route.params.nomor);

const showSpkModal = ref(false);
const showPabrikModal = ref(false);
const activeRowIdx = ref(-1);

const formData = reactive({
  nomor: "AUTO",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  pab_kode: "",
  pab_nama: "",
});

interface DetailRow {
  spk_nomor: string;
  spk_nama: string;
  spk_jumlah: number;
  spk_panjang: number;
  spk_lebar: number;
  j_plangkan: number;
  ulano: number;
  screen: number;
  lem: number;
  katalis: number;
}

const createEmptyRow = (): DetailRow => ({
  spk_nomor: "",
  spk_nama: "",
  spk_jumlah: 0,
  spk_panjang: 0,
  spk_lebar: 0,
  j_plangkan: 0,
  ulano: 0,
  screen: 0,
  lem: 0,
  katalis: 0,
});

const detailData = ref<DetailRow[]>([createEmptyRow()]);

// Rincian plangkan per SPK: { spk_nomor: { up_kode: qty } } (cermin CDS2 Delphi).
const rincian = ref<Record<string, Record<string, number>>>({});
// Master ukuran plangkan dari tms_plangkan_2 (up_uraian).
const plangkanMaster = ref<number[]>([]);
const focusedIdx = ref(0);

const detailHeaders = [
  { title: "No", key: "no", width: "45px", sortable: false },
  { title: "No. SPK", key: "spk_nomor", width: "170px" },
  { title: "Nama SPK", key: "spk_nama", minWidth: "220px" },
  { title: "Jml Order", key: "spk_jumlah", width: "90px", align: "end" },
  { title: "Pjg", key: "spk_panjang", width: "70px", align: "end" },
  { title: "Lbr", key: "spk_lebar", width: "70px", align: "end" },
  { title: "Jml Plangkan", key: "j_plangkan", width: "110px", align: "end" },
  { title: "Ulano", key: "ulano", width: "80px", align: "end" },
  { title: "Screen", key: "screen", width: "80px", align: "end" },
  { title: "Lem", key: "lem", width: "80px", align: "end" },
  { title: "Katalis", key: "katalis", width: "80px", align: "end" },
  { title: "", key: "actions", width: "80px", sortable: false },
];

const addRow = () => {
  detailData.value.push(createEmptyRow());
  focusedIdx.value = detailData.value.length - 1;
};

const removeRow = (idx: number) => {
  const row = detailData.value[idx];
  if (row?.spk_nomor && rincian.value[row.spk_nomor]) {
    delete rincian.value[row.spk_nomor];
  }
  if (detailData.value.length > 1) {
    detailData.value.splice(idx, 1);
    focusedIdx.value = Math.min(focusedIdx.value, detailData.value.length - 1);
  } else {
    detailData.value[0] = createEmptyRow();
  }
};

// --- Lookup pabrik (cermin edtpabrikClickBtn Delphi) ---
const onPabrikSelected = (item: any) => {
  const d = item?.raw || item || {};
  formData.pab_kode = d.Kode || d.pab_kode || "";
  formData.pab_nama = d.Nama || d.pab_nama || "";
  showPabrikModal.value = false;
};

// --- Lookup SPK (cermin cxspk_nomorPropertiesButtonClick Delphi, divisi 1,5 di modal) ---
const openSpkLookup = (idx: number) => {
  activeRowIdx.value = idx;
  showSpkModal.value = true;
};

const ensureRincian = (spkNomor: string) => {
  if (!rincian.value[spkNomor]) {
    const init: Record<string, number> = {};
    plangkanMaster.value.forEach((u) => {
      init[String(u)] = 0;
    });
    rincian.value[spkNomor] = init;
  }
};

const onSpkSelected = (item: any) => {
  const d = item?.raw || item || {};
  const idx = activeRowIdx.value;
  showSpkModal.value = false;
  if (idx < 0 || !detailData.value[idx]) return;
  const spkNomor = String(d.SPK || d.Spk || d.spk_nomor || "").trim();
  if (!spkNomor) {
    toast.error("Nomor SPK tidak terdeteksi.");
    return;
  }
  const dupe = detailData.value.findIndex(
    (r, i) => i !== idx && r.spk_nomor === spkNomor,
  );
  if (dupe >= 0) {
    toast.warning(`SPK ${spkNomor} sudah ada di baris ${dupe + 1}.`);
    return;
  }
  const row = detailData.value[idx];
  row.spk_nomor = spkNomor;
  row.spk_nama = d.Nama || d.spk_nama || "";
  row.spk_jumlah = Number(d.Jumlah ?? d.spk_jumlah ?? 0) || 0;
  row.spk_panjang = Number(d.Panjang ?? d.spk_panjang ?? 0) || 0;
  row.spk_lebar = Number(d.Lebar ?? d.spk_lebar ?? 0) || 0;
  ensureRincian(spkNomor);
  focusedIdx.value = idx;
};

const clearSpkRow = (idx: number) => {
  const row = detailData.value[idx];
  if (!row) return;
  if (row.spk_nomor && rincian.value[row.spk_nomor]) {
    delete rincian.value[row.spk_nomor];
  }
  detailData.value[idx] = createEmptyRow();
};

// --- Rincian plangkan baris fokus (cermin grid2 + footer summary Delphi) ---
const focusedRow = computed(() => detailData.value[focusedIdx.value]);

const focusedRincianRows = computed(() => {
  const spk = focusedRow.value?.spk_nomor;
  if (!spk) return [];
  ensureRincian(spk);
  return plangkanMaster.value.map((u) => ({
    up_kode: u,
    qty: rincian.value[spk]?.[String(u)] || 0,
  }));
});

const setRincianQty = (upKode: number, qty: number) => {
  const spk = focusedRow.value?.spk_nomor;
  if (!spk) return;
  ensureRincian(spk);
  rincian.value[spk][String(upKode)] = Math.max(0, parseInt(String(qty), 10) || 0);
  // Footer summary Delphi: j_plangkan = sum(qty rincian).
  focusedRow.value.j_plangkan = Object.values(rincian.value[spk]).reduce(
    (s, q) => s + (Number(q) || 0),
    0,
  );
};

const totalPlangkan = computed(() =>
  detailData.value.reduce((s, r) => s + (Number(r.j_plangkan) || 0), 0),
);

const loadEdit = async (nomor: string) => {
  isLoading.value = true;
  try {
    const res = await api.get(
      `${API_LHK_AFDRUK}/form/${encodeURIComponent(nomor)}`,
    );
    const data = res.data?.data || res.data;
    const h = data?.header || {};
    formData.nomor = h.lah_nomor || nomor;
    formData.tanggal = h.lah_tanggal
      ? format(new Date(h.lah_tanggal), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    formData.pab_kode = h.lah_pab_kode || "";
    formData.pab_nama = h.pab_nama || "";
    plangkanMaster.value = (data?.plangkan || []).map((u: any) => Number(u));
    const d = data?.details || [];
    const d2 = data?.details2 || [];
    rincian.value = {};
    detailData.value = d.length
      ? d.map((x: any) => {
          const spk = x.spk_nomor || "";
          const map: Record<string, number> = {};
          plangkanMaster.value.forEach((u) => {
            map[String(u)] = 0;
          });
          d2
            .filter((r: any) => r.spk_nomor === spk)
            .forEach((r: any) => {
              map[String(Number(r.up_kode))] = Number(r.qty) || 0;
            });
          rincian.value[spk] = map;
          return {
            spk_nomor: spk,
            spk_nama: x.spk_nama || "",
            spk_jumlah: Number(x.spk_jumlah) || 0,
            spk_panjang: Number(x.spk_panjang) || 0,
            spk_lebar: Number(x.spk_lebar) || 0,
            j_plangkan: Number(x.j_plangkan) || 0,
            ulano: Number(x.ulano) || 0,
            screen: Number(x.screen) || 0,
            lem: Number(x.lem) || 0,
            katalis: Number(x.katalis) || 0,
          };
        })
      : [createEmptyRow()];
    focusedIdx.value = 0;
  } catch (e: any) {
    toast.error(e.response?.data?.message || `Gagal memuat data ${nomor}.`);
    router.back();
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  const rows = detailData.value.filter(
    (r) => String(r.spk_nomor || "").trim() !== "",
  );
  if (!rows.length) {
    toast.warning("Detail SPK harus diisi minimal 1 baris.");
    return;
  }
  if (!formData.pab_kode) {
    toast.warning("Kode pabrik wajib diisi.");
    return;
  }
  if (!window.confirm("Simpan data LHK afdruk ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      tanggal: formData.tanggal,
      pab_kode: formData.pab_kode,
      details: rows.map((r) => ({
        spk_nomor: String(r.spk_nomor).trim(),
        j_plangkan: Number(r.j_plangkan) || 0,
        ulano: Number(r.ulano) || 0,
        screen: Number(r.screen) || 0,
        lem: Number(r.lem) || 0,
        katalis: Number(r.katalis) || 0,
        plangkan: Object.entries(rincian.value[r.spk_nomor] || {}).map(
          ([up_kode, qty]) => ({ up_kode: Number(up_kode), qty: Number(qty) || 0 }),
        ),
      })),
    };
    let savedNomor = "";
    if (isEditMode.value) {
      const nomor = route.params.nomor as string;
      const res = await api.put(
        `${API_LHK_AFDRUK}/${encodeURIComponent(nomor)}`,
        payload,
      );
      savedNomor = res.data?.data?.nomor || nomor;
    } else {
      const res = await api.post(API_LHK_AFDRUK, payload);
      savedNomor = res.data?.data?.nomor || "";
    }
    toast.success(`LHK afdruk ${savedNomor} berhasil disimpan.`);
    router.back();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal menyimpan data.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  const nomor = route.params.nomor as string | undefined;
  if (nomor) {
    loadEdit(nomor);
  } else {
    // Mode new: master plangkan diambil dari salah satu LHK terakhir bila ada,
    // fallback ke GET form tidak tersedia → pakai template statis via API form gagal?
    // Ambil via endpoint form tidak mungkin tanpa nomor, jadi isi default kosong
    // dan biarkan loadEdit mengisi saat edit. Untuk new, coba ambil master
    // dari browse terakhir: tidak tersedia → gunakan nilai standar tms_plangkan_2.
    api
      .get(`${API_LHK_AFDRUK}/browse`, { params: {} })
      .then((res) => {
        const list = res.data?.data || [];
        if (list.length > 0) {
          return api.get(
            `${API_LHK_AFDRUK}/form/${encodeURIComponent(list[0].Nomor)}`,
          );
        }
        return null;
      })
      .then((res: any) => {
        if (res?.data?.data?.plangkan) {
          plangkanMaster.value = res.data.data.plangkan.map((u: any) => Number(u));
        }
      })
      .catch(() => {});
  }
});
</script>

<template>
  <PageLayout
    :title="isEditMode ? `Edit LHK Afdruk: ${route.params.nomor}` : 'Input LHK Afdruk Spanduk'"
    icon="mdi-spray"
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
                label="Kode Pabrik (klik untuk cari)"
                variant="outlined"
                density="compact"
                hide-details
                readonly
                placeholder="cth: P02"
                @click="showPabrikModal = true"
              >
                <template #append-inner>
                  <v-icon
                    size="16"
                    style="cursor: pointer"
                    @click="showPabrikModal = true"
                  >
                    mdi-magnify
                  </v-icon>
                </template>
              </v-text-field>
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

      <v-col cols="12" md="8">
        <v-card flat border>
          <v-toolbar density="compact" color="blue-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Detail SPK Afdruk
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

            <template #[`item.spk_nomor`]="{ item, index }">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="item.spk_nomor"
                  density="compact"
                  variant="underlined"
                  hide-details
                  readonly
                  placeholder="Klik kaca pembesar..."
                  style="text-transform: uppercase"
                  @click="openSpkLookup(index)"
                />
                <v-btn
                  icon="mdi-magnify"
                  size="x-small"
                  variant="text"
                  color="primary"
                  @click="openSpkLookup(index)"
                />
                <v-btn
                  v-if="item.spk_nomor"
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="clearSpkRow(index)"
                />
              </div>
            </template>

            <template #[`item.spk_nama`]="{ item }">
              <span class="text-caption">{{ item.spk_nama || "-" }}</span>
            </template>

            <template #[`item.spk_jumlah`]="{ item }">
              <div class="text-right">{{ Number(item.spk_jumlah || 0).toLocaleString("id-ID") }}</div>
            </template>

            <template #[`item.spk_panjang`]="{ item }">
              <div class="text-right">{{ item.spk_panjang || "-" }}</div>
            </template>

            <template #[`item.spk_lebar`]="{ item }">
              <div class="text-right">{{ item.spk_lebar || "-" }}</div>
            </template>

            <template #[`item.j_plangkan`]="{ item }">
              <div class="text-right font-weight-bold text-primary">
                {{ Number(item.j_plangkan || 0).toLocaleString("id-ID") }}
              </div>
            </template>

            <template #[`item.ulano`]="{ item }">
              <v-text-field
                v-model.number="item.ulano"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                min="0"
                step="0.01"
              />
            </template>

            <template #[`item.screen`]="{ item }">
              <v-text-field
                v-model.number="item.screen"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                min="0"
                step="0.01"
              />
            </template>

            <template #[`item.lem`]="{ item }">
              <v-text-field
                v-model.number="item.lem"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                min="0"
                step="0.01"
              />
            </template>

            <template #[`item.katalis`]="{ item }">
              <v-text-field
                v-model.number="item.katalis"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                min="0"
                step="0.01"
              />
            </template>

            <template #[`item.actions`]="{ index }">
              <div class="d-flex">
                <v-btn
                  icon="mdi-format-list-bulleted"
                  size="x-small"
                  :color="focusedIdx === index ? 'primary' : 'grey'"
                  variant="text"
                  title="Tampilkan rincian plangkan"
                  @click="focusedIdx = index"
                />
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRow(index)"
                />
              </div>
            </template>

            <template #body.append v-if="detailData.length > 0">
              <tr class="bg-blue-lighten-5 font-weight-bold">
                <td colspan="6" class="text-end text-uppercase">
                  Total Jml Plangkan :
                </td>
                <td class="text-end text-primary">
                  {{ totalPlangkan.toLocaleString("id-ID") }}
                </td>
                <td colspan="5"></td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card flat border>
          <v-toolbar density="compact" color="teal-darken-2" flat>
            <v-toolbar-title class="text-subtitle-2 text-white">
              Rincian Plangkan: {{ focusedRow?.spk_nomor || "-" }}
            </v-toolbar-title>
          </v-toolbar>
          <div v-if="!focusedRow?.spk_nomor" class="pa-4 text-center text-caption text-grey">
            Pilih SPK pada grid detail untuk mengisi rincian ukuran plangkan.
          </div>
          <v-data-table
            v-else
            :headers="[
              { title: 'Ukuran', key: 'up_kode', width: '100px', align: 'end' },
              { title: 'Qty', key: 'qty', align: 'end' },
            ]"
            :items="focusedRincianRows"
            :items-per-page="-1"
            density="compact"
            hide-default-footer
          >
            <template #[`item.up_kode`]="{ item }">
              <div class="text-right">{{ item.up_kode }}</div>
            </template>
            <template #[`item.qty`]="{ item }">
              <v-text-field
                :model-value="item.qty"
                type="number"
                density="compact"
                hide-details
                variant="underlined"
                class="text-right"
                min="0"
                @update:model-value="setRincianQty(item.up_kode, $event)"
              />
            </template>
            <template #body.append>
              <tr class="bg-teal-lighten-5 font-weight-bold">
                <td class="text-end text-uppercase">Jumlah :</td>
                <td class="text-end text-primary">
                  {{ Number(focusedRow?.j_plangkan || 0).toLocaleString("id-ID") }}
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </PageLayout>

  <SpkLookupModal
    :is-visible="showSpkModal"
    @close="showSpkModal = false"
    @select="onSpkSelected"
  />

  <PabrikLookupModal
    :is-visible="showPabrikModal"
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
:deep(.v-field input) {
  font-size: 12px;
}
</style>
