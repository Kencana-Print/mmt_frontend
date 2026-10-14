<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import BaseBrowse from "@/components/BaseBrowse.vue";
import DateRangeFilter from "@/components/DateRangeFilter.vue";
import api from "@/services/api";
import * as XLSX from "xlsx";
import {
  IconTruckDelivery,
  IconPrinter,
  IconTable,
  IconKey,
  IconLockOpen,
  IconSend,
} from "@tabler/icons-vue";
import { formatTanggal, formatTanggalJam } from "@/utils/dateFormat";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();
const API_SURAT_JALAN_MAP = "/mmt/surat-jalan-map"; // Sesuaikan dengan base endpoint router backend Anda jika berbeda

// 1. State expanded untuk sub-grid / detail row
const expanded = ref<any[]>([]);
const details = ref<Record<string, any[]>>({});
const loadingDetails = ref(new Set<string>());

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const toInputDate = (value: Date) => value.toISOString().slice(0, 10);
const num = (v: any) => new Intl.NumberFormat("id-ID").format(Number(v) || 0);

// --- SUMMARY FOOTER FORMATTERS ---
const summaryFormatters = computed<Record<string, any>>(() => {
  return {
    Keterangan: () => "TOTAL :",
    QtyKirim: (filteredItems: any[]) =>
      num(
        Math.round(
          filteredItems.reduce(
            (sum, item) => sum + (Number(item.QtyKirim) || 0),
            0,
          ),
        ),
      ),
  };
});

// --- STATE PENGAJUAN PIN 5 ---
const showPinModal = ref(false);
const isPinLoading = ref(false);
const pinData = reactive({
  nomor: "",
  tanggal: "",
  customer: "",
  alasan: "",
  urut: 1,
});

const filterState = ref({
  startDate: toInputDate(firstDay),
  endDate: toInputDate(today),
});

const items = ref<any[]>([]);
const isLoading = ref(false);
const selected = ref<any[]>([]);

const canLihatCus = computed(
  () =>
    Number(authStore.user?.flags?.lihatCus) === 1 ||
    Number(authStore.user?.lihatCus) === 1,
);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const res = await api.get(`${API_SURAT_JALAN_MAP}/`, {
      params: {
        startDate: filterState.value.startDate,
        endDate: filterState.value.endDate,
        canLihatCus: canLihatCus.value ? 1 : 0,
      },
    });
    items.value = res.data.data || res.data || [];
  } catch (error: any) {
    toast.error(
      error.response?.data?.message || "Gagal mengambil data Surat Jalan MAP",
    );
  } finally {
    isLoading.value = false;
  }
};

const handleExpandUpdate = async (expandedKeys: any[]) => {
  const lastItem = expandedKeys[expandedKeys.length - 1];
  if (!lastItem) return;

  const nomorSJ = typeof lastItem === "object" ? lastItem.Nomor : lastItem;
  if (!nomorSJ || details.value[nomorSJ]) return;

  loadingDetails.value.add(nomorSJ);
  try {
    const res = await api.get(`${API_SURAT_JALAN_MAP}/detail`, {
      params: { nomor: nomorSJ },
    });
    details.value[nomorSJ] = res.data.data || res.data || [];
  } catch (error) {
    details.value[nomorSJ] = [];
  } finally {
    loadingDetails.value.delete(nomorSJ);
  }
};

const isLoadingDetails = (nomor: string) => loadingDetails.value.has(nomor);

const headers = computed(() => {
  const h: any[] = [
    {
      title: "Detail",
      key: "data-table-expand",
      width: "60px",
      align: "center",
      fixed: true,
    },
    { title: "Nomor", key: "Nomor", width: "160px", fixed: true },
    { title: "Tanggal", key: "Tanggal", width: "110px" },
    { title: "Divisi", key: "Divisi", width: "100px" },
  ];
  if (canLihatCus.value) {
    h.push({ title: "Customer", key: "Customer", width: "200px" });
  }
  h.push(
    { title: "Keterangan", key: "Keterangan" },
    { title: "Qty Kirim", key: "QtyKirim", align: "end", width: "100px" },
    { title: "Created", key: "Created", width: "150px" },
  );
  return h;
});

const detailHeaders = [
  { title: "Nomor Memo", key: "Nomor Memo", width: "160px" },
  { title: "Nama Pekerjaan", key: "Nama", minWidth: "220px" },
  { title: "Ukuran", key: "Ukuran", width: "130px" },
  { title: "Jumlah", key: "Jumlah", width: "90px", align: "end" },
];

const onAdd = () => router.push("/penjualan/sj-map/create");
const onEdit = (row: any) => {
  if (row.Ngedit === "WAIT")
    return toast.error("Data sedang diajukan (Menunggu ACC).");
  router.push(`/penjualan/sj-map/edit/${encodeURIComponent(row.Nomor)}`);
};

const onDelete = async (row: any) => {
  if (!confirm(`Yakin ingin menghapus Surat Jalan MAP nomor ${row.Nomor}?`))
    return;
  try {
    await api.delete(`${API_SURAT_JALAN_MAP}/${encodeURIComponent(row.Nomor)}`);
    toast.success("Surat Jalan MAP berhasil dihapus");
    selected.value = [];
    fetchData();
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Gagal hapus data.");
  }
};

const actCetak = () => {
  if (selected.value.length === 0)
    return toast.warning("Pilih data yang akan dicetak.");
  const nomor = selected.value[0].Nomor;
  window.open(`/penjualan/sj-map/print/${encodeURIComponent(nomor)}`, "_blank");
};

const actExportDetail = () => {
  if ((items.value ?? []).length === 0)
    return toast.warning("Tidak ada data untuk di-export.");

  const exportData: any[] = [];

  (items.value ?? []).forEach((h) => {
    const rowDetails = details.value[h.Nomor] || h.children;
    if (rowDetails && rowDetails.length > 0) {
      rowDetails.forEach((d: any) => {
        exportData.push({
          "No Surat Jalan": h.Nomor,
          Tanggal: h.Tanggal?.substring(0, 10),
          Divisi: h.Divisi,
          ...(canLihatCus.value ? { Customer: h.Customer } : {}),
          "Keterangan SJ": h.Keterangan,
          "Nomor Memo": d["Nomor Memo"],
          "Nama Barang": d.Nama,
          Ukuran: d.Ukuran,
          "Qty Kirim": d.Jumlah,
          "User Created": h.Created,
        });
      });
    } else {
      exportData.push({
        "No Surat Jalan": h.Nomor,
        Tanggal: h.Tanggal?.substring(0, 10),
        Divisi: h.Divisi,
        ...(canLihatCus.value ? { Customer: h.Customer } : {}),
        "Keterangan SJ": h.Keterangan,
        "Nomor Memo": "-",
        "Nama Barang": "-",
        Ukuran: "-",
        "Qty Kirim": 0,
      });
    }
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SJ_MAP_DETAIL");
  XLSX.writeFile(
    wb,
    `SJ_MAP_Detail_${filterState.value.startDate}_to_${filterState.value.endDate}.xlsx`,
  );
  toast.success("Export Detail Berhasil");
};

const actPengajuan = async () => {
  if (selected.value.length === 0)
    return toast.warning("Pilih data terlebih dahulu.");
  const row = selected.value[0];

  isPinLoading.value = true;
  try {
    const res = await api.get(
      `${API_SURAT_JALAN_MAP}/pin5/${encodeURIComponent(row.Nomor)}`,
    );
    const status = res.data.data || res.data;

    pinData.nomor = row.Nomor;
    pinData.tanggal = row.Tanggal;
    pinData.customer = row.Customer || "";

    if (!status) {
      pinData.urut = 1;
      pinData.alasan = "";
    } else {
      if (!status.pin_dipakai) {
        pinData.urut = status.pin_urut;
        pinData.alasan = status.pin_alasan || "";
      } else {
        pinData.urut = status.pin_urut + 1;
        pinData.alasan = "";
      }
    }
    showPinModal.value = true;
  } catch (e: any) {
    toast.error("Gagal mengecek status pengajuan.");
  } finally {
    isPinLoading.value = false;
  }
};

const submitPengajuan = async () => {
  if (!pinData.alasan.trim()) return toast.warning("Alasan harus diisi.");

  isPinLoading.value = true;
  try {
    await api.post(`${API_SURAT_JALAN_MAP}/pengajuan`, {
      nomor: pinData.nomor,
      tanggal: pinData.tanggal,
      customer: pinData.customer,
      alasan: pinData.alasan,
      urut: pinData.urut,
    });
    toast.success("Berhasil diajukan. Silakan tunggu ACC.");
    showPinModal.value = false;
    fetchData();
  } catch (e: any) {
    toast.error(
      "Gagal melakukan pengajuan: " + (e.response?.data?.message || e.message),
    );
  } finally {
    isPinLoading.value = false;
  }
};

const handleRowProps = (data: any) => {
  const row = data.item?.raw || data.item;
  const isSelected = selected.value.some((s) => s.Nomor === row.Nomor);
  let cls = isSelected ? "row-selected " : "";
  if (row.Ngedit === "WAIT") cls += "bg-blue-lighten-5";
  else if (row.Ngedit === "TOLAK") cls += "bg-red-lighten-5";
  else if (row.Ngedit === "ACC") cls += "bg-green-lighten-5";
  return { class: cls };
};

const getNomorClass = (ngedit: string) => {
  if (ngedit === "WAIT") return "cell-wait";
  if (ngedit === "TOLAK") return "cell-tolak";
  if (ngedit === "ACC") return "cell-acc";
  return "";
};

watch(
  [() => filterState.value.startDate, () => filterState.value.endDate],
  fetchData,
);
onMounted(fetchData);
</script>

<template>
  <BaseBrowse
    title="Surat Jalan MAP"
    menu-id="163"
    :has-date-filter="false"
    :icon="IconTruckDelivery"
    :headers="headers"
    :items="items ?? []"
    :is-loading="isLoading"
    item-value="Nomor"
    :can-insert="canInsert"
    :can-edit="canEdit"
    :can-delete="canDelete"
    :can-export="canExport"
    v-model:selected="selected"
    v-model:expanded="expanded"
    v-model:filter-state="filterState"
    :show-expand="true"
    :row-props-fn="handleRowProps"
    @refresh="fetchData"
    @add="onAdd"
    @edit="onEdit"
    @delete="onDelete"
    @export="exportToExcel('SJ_MAP')"
    :summary-columns="['QtyKirim']"
    :summary-formatters="summaryFormatters"
    @update:expanded="handleExpandUpdate(expanded)"
  >
    <template #filter-left>
      <div class="f-group">
        <DateRangeFilter
          v-model:start-date="filterState.startDate"
          v-model:end-date="filterState.endDate"
        />
      </div>
    </template>

    <template #item.Nomor="{ item }">
      <div :class="['nomor-badge', getNomorClass(item.Ngedit)]">
        {{ item.Nomor }}
      </div>
    </template>

    <template #item.Tanggal="{ item }">
      {{ formatTanggal(item.Tanggal) }}
    </template>

    <template #item.Created="{ item }">
      {{ formatTanggalJam(item.Created) }}
    </template>

    <template #extra-actions="{ selected }">
      <v-btn
        size="small"
        color="grey-darken-3"
        class="text-none mr-2"
        :disabled="selected.length === 0"
        @click="actCetak"
      >
        <template #prepend
          ><IconPrinter :size="15" :stroke-width="1.7"
        /></template>
        Cetak
      </v-btn>

      <v-btn
        size="small"
        color="indigo"
        class="text-none mr-2"
        @click="actExportDetail"
      >
        <template #prepend
          ><IconTable :size="15" :stroke-width="1.7"
        /></template>
        Export Detail
      </v-btn>

      <v-btn
        size="small"
        color="purple"
        class="text-none"
        :disabled="selected.length === 0"
        @click="actPengajuan"
      >
        <template #prepend><IconKey :size="15" :stroke-width="1.7" /></template>
        Pengajuan
      </v-btn>
    </template>

    <template #expanded-content="{ item }">
      <div class="expand-wrap pa-2">
        <div class="tbl-header mb-1">Detail Memo — {{ item.Nomor }}</div>

        <div
          v-if="isLoadingDetails(item.Nomor)"
          class="text-center pa-3 bg-white"
        >
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
            class="mr-2"
          />
          <span class="text-caption">Memuat detail barang...</span>
        </div>

        <div class="tbl-wrap" v-else>
          <table class="gt">
            <thead>
              <tr>
                <th style="width: 160px">Nomor Memo</th>
                <th style="min-width: 220px">Nama Pekerjaan</th>
                <th style="width: 130px">Ukuran</th>
                <th style="width: 90px; text-align: right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="d in details[item.Nomor] || item.children || []"
                :key="d['Nomor Memo'] || d.sjd_mspk_nomor"
                class="tr-det"
              >
                <td class="fw text-primary fw-mono">
                  {{ d["Nomor Memo"] || d.sjd_mspk_nomor }}
                </td>
                <td>{{ d.Nama || d.mspk_nama }}</td>
                <td>{{ d.Ukuran || d.sjd_ukuran }}</td>
                <td class="tr fw">
                  {{ Number(d.Jumlah || d.sjd_jumlah || 0).toLocaleString() }}
                </td>
              </tr>
              <tr v-if="!(details[item.Nomor] || item.children)?.length">
                <td
                  colspan="4"
                  class="text-center text-grey py-3 text-caption font-italic bg-white"
                >
                  Data detail tidak ditemukan
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template #filter-right>
      <div class="legend-box">
        <div class="legend-row">
          <span class="legend-title">Back (No. SJ):</span>
          <div class="legend-item">
            <div class="legend-dot" style="background: #2196f3"></div>
            Nunggu Acc
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #4caf50"></div>
            Sudah Acc
          </div>
          <div class="legend-item">
            <div class="legend-dot" style="background: #f44336"></div>
            Tolak
          </div>
        </div>
      </div>
    </template>
  </BaseBrowse>

  <v-dialog v-model="showPinModal" max-width="450px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="bg-purple text-white text-subtitle-1 font-weight-bold pa-3 d-flex align-center"
      >
        <IconLockOpen
          :size="18"
          :stroke-width="1.7"
          color="white"
          class="mr-2"
        />
        Pengajuan Perubahan Data
      </v-card-title>
      <v-card-text class="pa-4">
        <div class="text-caption mb-1">
          Nomor SJ: <b>{{ pinData.nomor }}</b>
        </div>
        <div v-if="canLihatCus" class="text-caption mb-3">
          Customer: {{ pinData.customer }}
        </div>

        <v-textarea
          v-model="pinData.alasan"
          label="Tulis alasan perubahan data..."
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          hide-details
          autofocus
          class="bg-white"
        ></v-textarea>

        <div class="text-caption text-right mt-1 text-grey">
          Urutan Pengajuan: {{ pinData.urut }}
        </div>
      </v-card-text>
      <v-card-actions class="pa-3 bg-grey-lighten-4 border-t">
        <v-btn variant="text" color="error" @click="showPinModal = false"
          >Batal</v-btn
        >
        <v-spacer></v-spacer>
        <v-btn
          color="purple"
          variant="elevated"
          :loading="isPinLoading"
          @click="submitPengajuan"
        >
          <template #prepend
            ><IconSend :size="15" :stroke-width="1.7"
          /></template>
          Kirim Ajukan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.row-selected {
  background-color: #d8efff !important;
}
:deep(.row-selected td) {
  background-color: #d8efff !important;
}

/* ── Filter bar ── */
.f-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.f-label {
  font-size: 11px;
  font-weight: 700;
  color: #555;
  white-space: nowrap;
}
.f-sep {
  font-size: 11px;
  color: #777;
}
.f-date {
  height: 28px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 12px;
  background: white;
  outline: none;
}
.f-date:focus {
  border-color: #1565c0;
}

/* ── Legend ── */
.legend-box {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 8px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
}
.legend-title {
  font-size: 10px;
  font-weight: 700;
  color: #555;
  white-space: nowrap;
  flex-shrink: 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: #424242;
  white-space: nowrap;
}
.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Expand ── */
.expand-wrap {
  background: #eceff1;
}
.tbl-header {
  background: #37474f;
  color: white;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
}
.tbl-wrap {
  overflow-x: auto;
  border: 1px solid #bdbdbd;
  background: white;
  border-radius: 4px;
}
.gt {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.gt thead th {
  background: #f0f4f8;
  border: 1px solid #bdbdbd;
  padding: 5px 6px;
  font-size: 10px;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
}
.gt tbody td {
  border: 1px solid #e8e8e8;
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tr-det td {
  background: #fafafa;
}
.tr-det:hover td {
  background: #e3f2fd;
}

/* ── Nomor badge ── */
.nomor-badge {
  padding: 2px 8px;
  font-weight: 700;
  border-radius: 4px;
  display: inline-block;
  font-family: monospace;
}
.cell-wait {
  background: #2196f3;
  color: white;
}
.cell-tolak {
  background: #f44336;
  color: white;
}
.cell-acc {
  background: #4caf50;
  color: white;
}

/* ── Utility ── */
.fw {
  font-weight: 700;
}
.fw-mono {
  font-family: monospace;
  font-size: 11px;
}
.tr {
  text-align: right;
}
.text-primary {
  color: #1565c0;
}
</style>
