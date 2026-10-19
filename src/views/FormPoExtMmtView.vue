<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { format, parseISO, isBefore } from "date-fns";
import { useToast } from "vue-toastification";
import api from "@/services/api";
import BaseForm from "@/components/BaseForm.vue";

// --- Import Modals Lookup ---
import SPKLookupModal from "@/modal/SpkLookupModal.vue";
import SupplierLookupModal from "@/modal/SupplierLookupModal.vue";
import POLookupModal from "@/modal/POLookupModal.vue";

// --- Interfaces ---
interface CustomDetailItem {
  nama: string;
  panjang: number;
  lebar: number;
  jumlah: number;
  harga: number;
  total: number;
}

interface AlokasiItem {
  alokasi: boolean;
  kota: string;
  jumlah: number;
}

interface DPItem {
  tanggal: string;
  nominal: number;
  akun: string;
  namabank: string;
  link: string;
}

interface FormDataState {
  nomor: string;
  tanggal: string;
  dateline: string;
  nomorSpk: string;
  namaSpk: string;
  divisi: string;
  joKode: string;
  joNama: string;
  bahan: string;
  ukuran: string;
  panjang: number;
  lebar: number;
  jumlahSpk: number;
  finishing: string;
  keterangan: string;
  cabang: string;
  supKode: string;
  supNama: string;
  supAlamat: string;
  supKota: string;
  bahanSendiri: boolean;
  hasGambar: boolean;
  statusBpb: string;
  jmlPo: number;
  tarif: number;
  totalHeader: number;
  tipeHitung: "meter" | "pcs";
  detailCustom: CustomDetailItem[];
  detailAlokasi: AlokasiItem[];
  detailDp: DPItem[];
}

interface LookupItem {
  Kode?: string;
  Nama?: string;
  Alamat?: string;
  Kota?: string;
  [key: string]: any;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const API_URL = "/mmt/po-external-mmt";
const API_SUPPLIER_DETAIL = "/supplier/detail";

// --- UI & Modal Controls ---
const isEditMode = ref(false);
const isSaving = ref(false);
const isPoModalVisible = ref(false);
const isSpkModalVisible = ref(false);
const isSupplierModalVisible = ref(false);
const activeTab = ref(0);

// --- State Delphi Lock/Approvals Flags ---
const xminta5 = ref("");
const xurut5 = ref(0);
const zCloseDate = ref<string | null>(null);
const currentUserKode = ref("");

// --- Form State ---
const formData = reactive<FormDataState>({
  nomor: "",
  tanggal: format(new Date(), "yyyy-MM-dd"),
  dateline: format(new Date(), "yyyy-MM-dd"),
  nomorSpk: "",
  namaSpk: "",
  divisi: "",
  joKode: "",
  joNama: "",
  bahan: "",
  ukuran: "",
  panjang: 0,
  lebar: 0,
  jumlahSpk: 0,
  finishing: "",
  keterangan: "",
  cabang: "P05",
  supKode: "",
  supNama: "",
  supAlamat: "",
  supKota: "",
  bahanSendiri: true,
  hasGambar: false,
  statusBpb: "",
  jmlPo: 0,
  tarif: 0,
  totalHeader: 0,
  tipeHitung: "meter",
  detailCustom: [
    { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
  ],
  detailAlokasi: [{ alokasi: false, kota: "", jumlah: 0 }],
  detailDp: [{ tanggal: "", nominal: 0, akun: "", namabank: "", link: "" }],
});

// --- Table Headers Configuration ---
const headerCustom = [
  { title: "Nama Item", key: "nama", width: "220px" },
  { title: "Panjang", key: "panjang", width: "90px", align: "end" as const },
  { title: "Lebar", key: "lebar", width: "90px", align: "end" as const },
  { title: "Jumlah", key: "jumlah", width: "90px", align: "end" as const },
  { title: "Harga", key: "harga", width: "120px", align: "end" as const },
  { title: "Total", key: "total", width: "130px", align: "end" as const },
  { title: "Aksi", key: "actions", width: "60px", align: "center" as const },
];

const headerDp = [
  { title: "Tanggal", key: "tanggal", width: "150px" },
  { title: "Nominal", key: "nominal", width: "130px", align: "end" as const },
  { title: "Kode Akun", key: "akun", width: "100px" },
  { title: "Nama Bank", key: "namabank", width: "200px" },
  { title: "Link", key: "link", width: "120px" },
  { title: "Aksi", key: "actions", width: "60px", align: "center" as const },
];

// --- Computed Metrics ---
const totalCustomSum = computed(() => {
  return formData.detailCustom.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );
});

// ── Alokasi Kota: ringkasan pemilihan & aksi ──
const jumlahAlokasiTerpilih = computed(
  () => formData.detailAlokasi.filter((a) => a.alokasi).length,
);
// Total qty (jumlah) hanya dari baris yang dicentang alokasi.
const totalQtyAlokasiTerpilih = computed(() =>
  formData.detailAlokasi
    .filter((a) => a.alokasi)
    .reduce((sum, a) => sum + (Number(a.jumlah) || 0), 0),
);
const allAlokasiSelected = computed(
  () =>
    formData.detailAlokasi.length > 0 &&
    formData.detailAlokasi.every((a) => a.alokasi),
);
const someAlokasiSelected = computed(() =>
  formData.detailAlokasi.some((a) => a.alokasi),
);

// Centang/hapus centang semua baris; hanya baris tercentang yang disimpan
// ke backend (lihat payload alokasi di saveForm).
const toggleAllAlokasi = (val: boolean | null) => {
  const checked = Boolean(val);
  formData.detailAlokasi.forEach((a) => {
    a.alokasi = checked;
  });
};

const addRowAlokasi = () => {
  formData.detailAlokasi.push({ alokasi: true, kota: "", jumlah: 0 });
};

const removeRowAlokasi = (index: number) => {
  formData.detailAlokasi.splice(index, 1);
};

const isPeriodClosed = computed(() => {
  if (!zCloseDate.value) return false;
  return (
    isBefore(parseISO(formData.tanggal), parseISO(zCloseDate.value)) &&
    xminta5.value !== "ACC"
  );
});

// Opsi cabang pembuat: P02/P05 + cabang SPK terpilih bila di luar itu
// (agar nilai auto-fill selalu valid di dropdown).
const cabangOptions = computed(() => {
  const base = ["P02", "P05"];
  const cur = String(formData.cabang || "")
    .trim()
    .toUpperCase();
  if (cur && !base.includes(cur)) return [...base, cur];
  return base;
});

const isFormReadOnly = computed(() => {
  return (
    ["MINTA", "WAIT", "TOLAK"].includes(xminta5.value) || isPeriodClosed.value
  );
});

// --- Core Calculations ---
const hitungKalkulasiHeader = () => {
  const { joKode, divisi, panjang, lebar, jmlPo, tarif, tipeHitung } = formData;
  let tot = 0;

  if (tipeHitung === "pcs") {
    tot = jmlPo * tarif;
  } else {
    if (joKode === "LM" || joKode === "LN") {
      tot = jmlPo * tarif;
    } else if (divisi === "MMT" || divisi === "5" || divisi === 5) {
      tot = panjang * lebar * jmlPo * tarif;
    } else {
      tot = panjang * jmlPo * tarif;
    }
  }
  formData.totalHeader = tot;
};

const hitungRowCustom = (index: number) => {
  const item = formData.detailCustom[index];
  if (!item) return;

  const { joKode, divisi, tipeHitung } = formData;
  let tot = 0;

  if (tipeHitung === "pcs") {
    tot = item.jumlah * item.harga;
  } else {
    if (joKode === "LM" || joKode === "LN") {
      tot = item.jumlah * item.harga;
    } else if (divisi === "MMT" || divisi === "5" || divisi === 5) {
      tot = item.panjang * item.lebar * item.jumlah * item.harga;
    } else {
      tot = item.panjang * item.jumlah * item.harga;
    }
  }
  item.total = tot;
};

watch(
  () => [
    formData.jmlPo,
    formData.tarif,
    formData.panjang,
    formData.lebar,
    formData.joKode,
    formData.divisi,
    formData.tipeHitung,
  ],
  () => {
    hitungKalkulasiHeader();
  },
  { deep: true },
);

// --- Keyboard Shortcuts (F-Keys) Listener ---
const handleKeydownShortcuts = (e: KeyboardEvent) => {
  if (e.key === "F10") {
    e.preventDefault();
    if (!isFormReadOnly.value && !isSaving.value) saveForm();
  } else if (e.key === "F7") {
    e.preventDefault();
    refreshData();
  } else if (e.key === "F8") {
    e.preventDefault();
    router.back();
  } else if (e.key === "F1") {
    e.preventDefault();
    if (!isFormReadOnly.value) isSpkModalVisible.value = true;
  }
};

const initGridDefaults = () => {
  formData.detailCustom = [
    { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
  ];
  formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
  formData.detailDp = [
    { tanggal: "", nominal: 0, akun: "", namabank: "", link: "" },
  ];
};

const refreshData = () => {
  isEditMode.value = false;
  xminta5.value = "";
  xurut5.value = 0;

  formData.nomor = "";
  formData.tanggal = format(new Date(), "yyyy-MM-dd");
  formData.dateline = format(new Date(), "yyyy-MM-dd");
  formData.nomorSpk = "";
  formData.namaSpk = "";
  formData.divisi = "";
  formData.joKode = "";
  formData.joNama = "";
  formData.bahan = "";
  formData.ukuran = "";
  formData.panjang = 0;
  formData.lebar = 0;
  formData.jumlahSpk = 0;
  formData.finishing = "";
  formData.keterangan = "";
  formData.supKode = "";
  formData.supNama = "";
  formData.supAlamat = "";
  formData.supKota = "";
  formData.bahanSendiri = true;
  formData.hasGambar = false;
  formData.statusBpb = "";
  formData.jmlPo = 0;
  formData.tarif = 0;
  formData.totalHeader = 0;
  formData.tipeHitung = "meter";

  initGridDefaults();
};

const loadDataAll = async (nomorPo: string) => {
  if (!nomorPo) return;
  isSaving.value = true;

  try {
    const response = await api.get(`${API_URL}/${nomorPo}`);
    const res = response.data.data || response.data;

    if (res && res.header) {
      const h = res.header;
      isEditMode.value = true;

      formData.nomor = h.poe_nomor;
      formData.tanggal = h.poe_tanggal
        ? format(parseISO(h.poe_tanggal), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      formData.dateline = h.poe_dateline
        ? format(parseISO(h.poe_dateline), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd");
      formData.nomorSpk = h.poe_spk_nomor || "";
      formData.namaSpk = h.spk_nama || "";
      formData.divisi = h.divisi || "";
      formData.joKode = h.spk_jo_kode || "";
      formData.joNama = h.jo_nama || "";
      formData.bahan = h.spk_kain || "";
      formData.ukuran = h.spk_ukuran || "";
      formData.panjang = Number(h.spk_panjang) || 0;
      formData.lebar = Number(h.spk_lebar) || 0;
      formData.jumlahSpk = Number(h.spk_jumlah) || 0;
      formData.finishing = h.poe_finishing || "";
      formData.keterangan = h.poe_ket || "";
      formData.cabang = h.poe_cab || "P05";

      formData.supKode = h.poe_sup || "";
      formData.supNama = h.Sup_nama || "";
      formData.supAlamat = h.Sup_alamat || "";
      formData.supKota = h.Sup_kota || "";

      formData.bahanSendiri = h.poe_bahansendiri === "Y";
      formData.statusBpb = h.poe_status || "";
      formData.hasGambar = h.has_gambar === "Y";

      formData.jmlPo = Number(h.poe_jumlah) || 0;
      formData.tarif = Number(h.poe_tarif) || 0;
      formData.tipeHitung = h.poe_tipe_hitung === "pcs" ? "pcs" : "meter";

      try {
        const pinRes = await api.get(`${API_URL}/check-pin/${nomorPo}`);
        const pinData = pinRes.data.data || pinRes.data;
        if (pinData) {
          xurut5.value = Number(pinData.pin_urut) || 0;
          if (pinData.pin_acc === "" && pinData.pin_dipakai === "") {
            xminta5.value = "WAIT";
          } else if (pinData.pin_acc === "Y" && pinData.pin_dipakai === "") {
            xminta5.value = "ACC";
          } else if (pinData.pin_acc === "N") {
            xminta5.value = "TOLAK";
          } else if (pinData.pin_acc === "Y" && pinData.pin_dipakai === "Y") {
            xminta5.value = "";
          }
        } else {
          xminta5.value = "";
          xurut5.value = 0;
        }
      } catch (e) {
        console.error("Gagal memuat status PIN kuncian akuntansi:", e);
        xminta5.value = "";
      }

      if (Array.isArray(res.alokasi) && res.alokasi.length > 0) {
        formData.detailAlokasi = res.alokasi.map((a: any) => ({
          alokasi: true,
          kota: a.poeda_kota || a.kota || "",
          jumlah: Number(a.poeda_jumlah || a.jumlah) || 0,
        }));
      } else {
        formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
      }

      if (Array.isArray(res.custom) && res.custom.length > 0) {
        formData.detailCustom = res.custom.map((c: any) => ({
          nama: c.poed_nama || "",
          panjang: Number(c.poed_panjang) || 0,
          lebar: Number(c.poed_lebar) || 0,
          jumlah: Number(c.poed_jumlah) || 0,
          harga: Number(c.poed_harga) || 0,
          total: Number(c.poed_total) || 0,
        }));
      } else {
        formData.detailCustom = [
          { nama: "", panjang: 0, lebar: 0, jumlah: 0, harga: 0, total: 0 },
        ];
      }

      formData.detailDp = [];
      if (Array.isArray(res.dp) && res.dp.length > 0) {
        for (const d of res.dp) {
          let namaBankFromDb = d.rek_nama || "";
          if (!namaBankFromDb && d.poed2_akun) {
            try {
              const resBank = await api.get(
                `/finance/rekening/${d.poed2_akun}`,
              );
              const b = resBank.data.data || resBank.data;
              namaBankFromDb = b.rek_nama || b.NamaBank || "";
            } catch (e) {
              console.error(
                `Gagal ambil detail rekening/bank: ${d.poed2_akun}`,
              );
            }
          }

          formData.detailDp.push({
            tanggal: d.poed2_tanggal
              ? format(parseISO(d.poed2_tanggal), "yyyy-MM-dd")
              : "",
            nominal: Number(d.poed2_nominal) || 0,
            akun: d.poed2_akun || "",
            namabank: namaBankFromDb,
            link: d.poed2_link || "",
          });
        }
      }

      if (formData.detailDp.length === 0) {
        formData.detailDp = [
          { tanggal: "", nominal: 0, akun: "", namabank: "", link: "" },
        ];
      }

      hitungKalkulasiHeader();
      toast.success(`Berhasil memuat transaksi: ${nomorPo}`);
    }
  } catch (error: any) {
    console.error("Load Error PO External:", error);
    toast.error("Gagal memuat data transaksi.");
    refreshData();
  } finally {
    isSaving.value = false;
  }
};

const openSupplierSearch = () => {
  if (isFormReadOnly.value) return;
  isSupplierModalVisible.value = true;
};

const handleSupKodeExit = async () => {
  if (!formData.supKode) return;
  try {
    const response = await api.get(
      `${API_SUPPLIER_DETAIL}/${formData.supKode}`,
    );
    const detail = response.data.data || response.data;
    formData.supNama = detail.Nama || detail.nama || "";
    formData.supAlamat = detail.Alamat || detail.alamat || "";
    formData.supKota = detail.Kota || detail.kota || "";
  } catch (error) {
    toast.error("Kode Supplier tidak ditemukan.");
    formData.supKode = "";
    formData.supNama = "";
    formData.supAlamat = "";
    formData.supKota = "";
  }
};

const handleSupplierSelect = async (sup: LookupItem) => {
  if (!sup.Kode) return;
  formData.supKode = sup.Kode;
  formData.supNama = sup.Nama || "";
  formData.supAlamat = sup.Alamat || "";
  formData.supKota = sup.Kota || "";
  isSupplierModalVisible.value = false;
};

const handleSpkSelect = async (payload: any) => {
  if (!payload) return;

  const spk = payload.raw || payload.item || payload;
  const nomorSpkTerpilih = spk.Spk || spk.SPK || spk.spk || spk.spk_nomor || "";
  if (!nomorSpkTerpilih) return;

  formData.nomorSpk = nomorSpkTerpilih;
  formData.namaSpk = spk.Nama || spk.nama || "";
  formData.divisi = String(spk.Divisi || spk.divisi || "");
  formData.bahan = spk.Bahan || spk.bahan || "";
  formData.ukuran = spk.Ukuran || spk.ukuran || "";
  formData.panjang = Number(spk.Panjang) || 0;
  formData.lebar = Number(spk.Lebar) || 0;
  formData.jumlahSpk = Number(spk.Jumlah) || 0;

  formData.finishing =
    spk.Finishing || spk.finishing || spk.spk_finishing || "";

  if (formData.jmlPo === 0) {
    formData.jmlPo = Number(spk.Jumlah) || 0;
  }

  const prefix = nomorSpkTerpilih.substring(3, 5);
  formData.joKode = prefix;
  formData.joNama = prefix === "MT" ? "MMT / BANNER" : "KONVEKSI / KAOS";

  formData.hasGambar = spk.design_done === "Y" || spk.design_baru === "Y";
  formData.keterangan = spk.Kepentingan || "";

  // Cabang pembuat mengikuti cabang SPK (mis. SPK P02 → pembuat P02).
  const cabSpk = String(
    spk.Cabang || spk.cabang || spk.spk_cab || spk.mspk_cab || "",
  )
    .trim()
    .toUpperCase();
  if (cabSpk) {
    formData.cabang = cabSpk;
  }

  try {
    const resAlokasi = await api.get(`/mmt/spk/alokasi/${nomorSpkTerpilih}`);
    const alokasiList = resAlokasi.data.data || resAlokasi.data || [];

    if (Array.isArray(alokasiList) && alokasiList.length > 0) {
      formData.detailAlokasi = alokasiList.map((a: any) => ({
        alokasi: true,
        kota: a.kota || a.Kota || a.spka_kota || "",
        jumlah: Number(a.jumlah || a.Jumlah || a.spka_jumlah) || 0,
      }));
    } else {
      formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
    }
  } catch (err) {
    formData.detailAlokasi = [{ alokasi: false, kota: "", jumlah: 0 }];
  }

  isSpkModalVisible.value = false;
};

const addRowCustom = () => {
  formData.detailCustom.push({
    nama: "",
    panjang: 0,
    lebar: 0,
    jumlah: 0,
    harga: 0,
    total: 0,
  });
};

const removeRowCustom = (index: number) => {
  formData.detailCustom.splice(index, 1);
  if (formData.detailCustom.length === 0) addRowCustom();
};

const addRowDp = () => {
  formData.detailDp.push({
    tanggal: format(new Date(), "yyyy-MM-dd"),
    nominal: 0,
    akun: "",
    namabank: "",
    link: "",
  });
};

const removeRowDp = (index: number) => {
  formData.detailDp.splice(index, 1);
  if (formData.detailDp.length === 0) addRowDp();
};

// Gunakan logika scanning yang persis dengan Permintaan Bahan
const getCurrentUser = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      try {
        const item = localStorage.getItem(key);
        const parsed = JSON.parse(item || "");
        if (parsed && parsed.kdUser) {
          currentUserKode.value = parsed.kdUser;
          return;
        }
      } catch (e) {
        /* bukan JSON */
      }
    }
  }
  currentUserKode.value = localStorage.getItem("kdUser") || "";
};

const saveForm = async () => {
  if (isFormReadOnly.value) {
    toast.error("Transaksi sudah diclose / menunggu approve.");
    return;
  }
  if (isPeriodClosed.value) {
    toast.error("Periode tanggal sudah diclose oleh akuntansi.");
    return;
  }
  if (!formData.nomorSpk) return toast.warning("Nomor SPK harus diisi.");
  if (!formData.supKode) return toast.warning("Supplier belum diisi.");
  if (formData.jmlPo <= 0) return toast.warning("Jumlah PO belum diisi.");
  if (formData.tarif <= 0) return toast.warning("Tarif belum diisi.");
  if (isBefore(parseISO(formData.dateline), parseISO(formData.tanggal))) {
    return toast.error(
      "Tanggal Dateline tidak boleh mendahului tanggal order.",
    );
  }

  // Ambil user sebelum simpan
  getCurrentUser();
  const userPengguna =
    currentUserKode.value || localStorage.getItem("kdUser") || "";

  if (!confirm("Yakin ingin menyimpan data transaksi ini?")) return;

  isSaving.value = true;
  try {
    const payload = {
      isEditMode: isEditMode.value,
      poe_nomor: formData.nomor,
      poe_tanggal: formData.tanggal,
      poe_dateline: formData.dateline,
      poe_spk_nomor: formData.nomorSpk,
      poe_cab: formData.cabang,
      poe_sup: formData.supKode,
      poe_ket: formData.keterangan,
      poe_finishing: formData.finishing,
      poe_jumlah: formData.jmlPo,
      poe_tarif: formData.tarif,
      poe_total: formData.totalHeader,
      poe_tipe_hitung: formData.tipeHitung,
      poe_bahansendiri: formData.bahanSendiri ? "Y" : "N",
      currentUser: userPengguna, // Mengirim kdUser hasil scan
      xminta5: xminta5.value,
      xurut5: xurut5.value,
      alokasi: formData.detailAlokasi.filter(
        (a) => a.alokasi && a.kota.trim() !== "",
      ),
      dp: formData.detailDp.filter((d) => d.nominal > 0),
      custom: formData.detailCustom.filter((c) => c.nama.trim() !== ""),
    };

    // Tambahkan header Authorization jika backend menggunakan middleware auth
    const token = localStorage.getItem("token");
    const res = await api.post(`${API_URL}/save`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const nomorTersimpan = res.data.nomor || res.data.data?.nomor;
    toast.success(`Tersimpan dengan nomor: ${nomorTersimpan}`);

    if (confirm("Ingin cetak nota PO External?")) {
      window.open(`${API_URL}/print/${nomorTersimpan}`, "_blank");
    }

    refreshData();
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Gagal menyimpan transaksi.");
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeydownShortcuts);
  getCurrentUser();
  refreshData();

  const nomorDariParams = route.params.nomor as string;

  if (nomorDariParams) {
    await loadDataAll(nomorDariParams);
  } else {
    try {
      const res = await api.get(`${API_URL}/date-close/PO EXT MMT`);
      zCloseDate.value = res.data.closeDate || res.data.data?.closeDate || null;
    } catch (err) {
      console.error("Gagal mengambil status closing:", err);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydownShortcuts);
});
</script>

<template>
  <BaseForm
    title="Form PO External MMT"
    menu-id="144"
    icon="mdi-file-document-edit-outline"
  >
    <template #header-actions>
      <v-chip
        v-if="xminta5 === 'MINTA'"
        color="orange"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-alert-circle</v-icon> STATUS: MINTA PIN
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'WAIT'"
        color="cyan"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-clock-outline</v-icon> STATUS: WAIT ACC
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'ACC'"
        color="success"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-check-decagram</v-icon> STATUS: APPROVED
      </v-chip>
      <v-chip
        v-else-if="xminta5 === 'TOLAK'"
        color="error"
        size="small"
        class="mr-2 font-weight-bold"
        variant="elevated"
      >
        <v-icon start>mdi-close-octagon</v-icon> STATUS: REJECTED
      </v-chip>

      <v-btn
        size="x-small"
        color="primary"
        @click="saveForm"
        :loading="isSaving"
        :disabled="isFormReadOnly"
      >
        <v-icon start>mdi-content-save</v-icon> Simpan [F10]
      </v-btn>
      <v-btn size="x-small" color="warning" class="ml-1" @click="refreshData">
        <v-icon start>mdi-cancel</v-icon> Batal [F7]
      </v-btn>
      <v-btn size="x-small" color="error" class="ml-1" @click="router.back()">
        <v-icon start>mdi-logout</v-icon> Keluar [F8]
      </v-btn>
    </template>

    <template #left-column>
        <v-card flat border class="flex-shrink-0">
          <div class="po-card-title bg-grey-lighten-4">
            HEADER PO & REFERENSI SPK
          </div>
          <v-divider />
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  label="Nomor PO (Browse)"
                  v-model="formData.nomor"
                  readonly
                  append-inner-icon="mdi-magnify"
                  placeholder="<-- Kosong = Baru"
                  @click="isPoModalVisible = true"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Tanggal Order"
                  v-model="formData.tanggal"
                  type="date"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Dateline"
                  v-model="formData.dateline"
                  type="date"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-select
                  label="Cabang Pembuat"
                  v-model="formData.cabang"
                  :items="cabangOptions"
                  density="compact"
                  variant="outlined"
                  :readonly="isFormReadOnly"
                  hide-details
                />
              </v-col>

              <v-col cols="12" class="mt-2">
                <v-text-field
                  label="Nomor SPK [F1]"
                  v-model="formData.nomorSpk"
                  readonly
                  append-inner-icon="mdi-magnify"
                  @click="!isFormReadOnly && (isSpkModalVisible = true)"
                  density="compact"
                  variant="outlined"
                  color="blue"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Nama SPK"
                  v-model="formData.namaSpk"
                  readonly
                  bg-color="grey-lighten-4"
                  density="compact"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Divisi"
                  v-model="formData.divisi"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Jenis Order"
                  v-model="formData.joNama"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Bahan"
                  v-model="formData.bahan"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Ukuran"
                  v-model="formData.ukuran"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Finishing"
                  v-model="formData.finishing"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :readonly="isFormReadOnly"
                  placeholder="Contoh: Mata ayam keliling, Slongsong, Potong Pas, dll."
                  prepend-inner-icon="mdi-format-paint"
                  class="bg-white"
                />
              </v-col>

              <v-col cols="4">
                <v-text-field
                  label="Panjang"
                  v-model.number="formData.panjang"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Qty SPK"
                  v-model.number="formData.jumlahSpk"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>

              <v-col cols="12" class="d-flex align-center py-0">
                <v-checkbox
                  v-model="formData.bahanSendiri"
                  label="Bahan Sendiri"
                  density="compact"
                  hide-details
                  :readonly="isFormReadOnly"
                />
                <v-checkbox
                  v-model="formData.hasGambar"
                  label="Ada File Gambar"
                  density="compact"
                  hide-details
                  disabled
                  class="ml-2"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- SUPPLIER DATA CARD -->
        <v-card flat border class="mt-2 flex-shrink-0">
          <div class="po-card-title bg-grey-lighten-4">DATA SUPPLIER</div>
          <v-divider />
          <v-card-text class="pa-2">
            <v-row dense>
              <v-col cols="4">
                <v-text-field
                  label="Kode Sup"
                  v-model="formData.supKode"
                  :readonly="isFormReadOnly"
                  @click="openSupplierSearch"
                  @blur="handleSupKodeExit"
                  append-inner-icon="mdi-magnify"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="cursor: pointer"
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  label="Supplier"
                  v-model="formData.supNama"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Alamat"
                  v-model="formData.supAlamat"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  label="Kota"
                  v-model="formData.supKota"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                  bg-color="grey-lighten-4"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
    </template>

    <template #right-column>
        <!-- DETAIL PRICING PANEL -->
        <v-card
          flat
          border
          class="mb-2 bg-blue-grey-lighten-5 pa-3 flex-shrink-0"
        >
          <v-row dense align="center">
            <v-col cols="2">
              <v-text-field
                label="Jumlah PO"
                v-model.number="formData.jmlPo"
                type="number"
                density="compact"
                variant="outlined"
                :readonly="isFormReadOnly"
                hide-details
                class="bg-white"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                label="Tarif / Harga"
                v-model.number="formData.tarif"
                type="number"
                density="compact"
                variant="outlined"
                :readonly="isFormReadOnly"
                hide-details
                class="bg-white"
              />
            </v-col>
            <v-col cols="2">
              <v-select
                label="Hitung"
                v-model="formData.tipeHitung"
                :items="[
                  { title: 'Meter', value: 'meter' },
                  { title: 'Pcs', value: 'pcs' },
                ]"
                item-title="title"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="bg-white"
                :readonly="isFormReadOnly"
              />
            </v-col>
            <v-col cols="5">
              <v-card flat border color="primary" class="pa-1 text-right">
                <span
                  class="text-caption font-weight-bold d-block px-2 text-blue-lighten-4"
                >
                  TOTAL NOTA UTAMA ({{ formData.tipeHitung.toUpperCase() }})
                </span>
                <span class="text-h6 font-weight-black px-2 text-white">
                  Rp {{ Number(formData.totalHeader).toLocaleString() }}
                </span>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <!-- MULTI TABS FOR CLIENTDATASETS -->
        <v-tabs
          v-model="activeTab"
          density="compact"
          color="primary"
          bg-color="grey-lighten-4"
          class="flex-shrink-0"
        >
          <v-tab :value="0">
            <v-icon start size="small">mdi-table-edit</v-icon>Item Custom (CDS)
          </v-tab>
          <v-tab :value="1">
            <v-icon start size="small">mdi-map-marker-distance</v-icon>Alokasi
            Kota (CDS2)
          </v-tab>
          <v-tab :value="2">
            <v-icon start size="small">mdi-cash-multiple</v-icon>Uang Muka / DP
            (CDS3)
          </v-tab>
        </v-tabs>

        <v-window
          v-model="activeTab"
          class="border-x border-b fill-height-window bg-white pa-2 flex-shrink-0"
        >
          <!-- TAB 1: ITEM CUSTOM GRID -->
          <v-window-item :value="0">
            <v-data-table
              :headers="headerCustom"
              :items="formData.detailCustom"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
            >
              <template #[`item.nama`]="{ index }">
                <v-text-field
                  v-model="formData.detailCustom[index].nama"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.panjang`]="{ index }">
                <v-text-field
                  v-model.number="formData.detailCustom[index].panjang"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly || formData.tipeHitung === 'pcs'"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.lebar`]="{ index }">
                <v-text-field
                  v-model.number="formData.detailCustom[index].lebar"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly || formData.tipeHitung === 'pcs'"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.jumlah`]="{ index }">
                <v-text-field
                  v-model.number="formData.detailCustom[index].jumlah"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.harga`]="{ index }">
                <v-text-field
                  v-model.number="formData.detailCustom[index].harga"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                  @update:model-value="hitungRowCustom(index)"
                />
              </template>
              <template #[`item.total`]="{ index }">
                <span class="d-block text-right font-weight-bold">
                  Rp
                  {{
                    Number(formData.detailCustom[index].total).toLocaleString()
                  }}
                </span>
              </template>
              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRowCustom(index)"
                  :disabled="isFormReadOnly"
                />
              </template>
              <template #bottom>
                <div class="pa-2 border-t d-flex align-center">
                  <v-btn
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addRowCustom"
                    :disabled="isFormReadOnly"
                  >
                    Tambah Item
                  </v-btn>
                  <v-spacer />
                  <span class="text-caption font-weight-bold text-primary mr-4">
                    Total Custom: Rp {{ totalCustomSum.toLocaleString() }}
                  </span>
                </div>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TAB 2: ALOKASI KOTA -->
          <v-window-item :value="1">
            <div class="alokasi-toolbar">
              <v-checkbox-btn
                :model-value="allAlokasiSelected"
                :indeterminate="
                  someAlokasiSelected && !allAlokasiSelected
                "
                color="primary"
                density="compact"
                hide-details
                :disabled="isFormReadOnly"
                @update:model-value="toggleAllAlokasi"
              />
              <span class="text-caption font-weight-bold">Pilih Semua</span>
              <v-spacer />
              <span class="text-caption">
                Terpilih:
                <b class="text-primary">{{ jumlahAlokasiTerpilih }}</b> kota
                <span class="mx-2 text-grey">•</span>
                Total Qty:
                <b class="text-primary">
                  {{ totalQtyAlokasiTerpilih.toLocaleString("id-ID") }}
                </b>
              </span>
              <v-btn
                size="x-small"
                color="primary"
                variant="tonal"
                class="ml-3"
                prepend-icon="mdi-plus"
                :disabled="isFormReadOnly"
                @click="addRowAlokasi"
              >
                Tambah Kota
              </v-btn>
            </div>
            <div class="alokasi-scroll">
              <table class="alokasi-table">
                <thead>
                  <tr>
                    <th class="col-check">Pilih</th>
                    <th>Kota Tujuan</th>
                    <th class="col-jml">Jumlah</th>
                    <th class="col-act"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, idx) in formData.detailAlokasi"
                    :key="idx"
                    :class="{ 'row-off': !row.alokasi }"
                  >
                    <td class="col-check">
                      <v-checkbox-btn
                        v-model="row.alokasi"
                        color="primary"
                        density="compact"
                        hide-details
                        :disabled="isFormReadOnly"
                      />
                    </td>
                    <td>
                      <input
                        v-model.trim="row.kota"
                        class="cell-inp"
                        :readonly="isFormReadOnly"
                        placeholder="Nama kota tujuan"
                      />
                    </td>
                    <td class="col-jml">
                      <input
                        v-model.number="row.jumlah"
                        type="number"
                        class="cell-inp text-right"
                        :readonly="isFormReadOnly"
                      />
                    </td>
                    <td class="col-act">
                      <v-btn
                        icon="mdi-delete"
                        size="x-small"
                        color="error"
                        variant="text"
                        :disabled="isFormReadOnly"
                        @click="removeRowAlokasi(idx)"
                      />
                    </td>
                  </tr>
                  <tr v-if="formData.detailAlokasi.length === 0">
                    <td colspan="4" class="empty-row">
                      Belum ada data alokasi. Klik "Tambah Kota" untuk
                      menambah.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-window-item>

          <!-- TAB 3: DP -->
          <v-window-item :value="2">
            <v-data-table
              :headers="headerDp"
              :items="formData.detailDp"
              :items-per-page="-1"
              density="compact"
              hide-default-footer
            >
              <template #[`item.tanggal`]="{ index }">
                <v-text-field
                  v-model="formData.detailDp[index].tanggal"
                  type="date"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.nominal`]="{ index }">
                <v-text-field
                  v-model.number="formData.detailDp[index].nominal"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  class="text-right-input"
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.akun`]="{ index }">
                <v-text-field
                  v-model="formData.detailDp[index].akun"
                  density="compact"
                  variant="plain"
                  hide-details
                  placeholder="F1 Help"
                  append-inner-icon="mdi-magnify"
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.namabank`]="{ index }">
                <v-text-field
                  v-model="formData.detailDp[index].namabank"
                  density="compact"
                  variant="plain"
                  hide-details
                  readonly
                  bg-color="grey-lighten-5"
                />
              </template>
              <template #[`item.link`]="{ index }">
                <v-text-field
                  v-model="formData.detailDp[index].link"
                  density="compact"
                  variant="plain"
                  hide-details
                  :readonly="isFormReadOnly"
                />
              </template>
              <template #[`item.actions`]="{ index }">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeRowDp(index)"
                  :disabled="isFormReadOnly"
                />
              </template>
              <template #bottom>
                <div class="pa-2 border-t">
                  <v-btn
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus"
                    @click="addRowDp"
                    :disabled="isFormReadOnly"
                  >
                    Tambah DP
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>

        <!-- PANEL NOTE -->
        <v-textarea
          label="Keterangan Tambahan PO (Memo)"
          v-model="formData.keterangan"
          rows="2"
          variant="outlined"
          density="compact"
          class="mt-2 text-caption flex-shrink-0"
          hide-details
          :readonly="isFormReadOnly"
        />

      <!-- LOOKUP MODALS CHANNELS -->
      <POLookupModal
        :isVisible="isPoModalVisible"
        @close="isPoModalVisible = false"
        @select="loadDataAll"
      />
      <SPKLookupModal
        :isVisible="isSpkModalVisible"
        @close="isSpkModalVisible = false"
        @select="handleSpkSelect"
      />
      <SupplierLookupModal
        v-if="isSupplierModalVisible"
        :isVisible="isSupplierModalVisible"
        @close="isSupplierModalVisible = false"
        @select="handleSupplierSelect"
      />
    </template>
  </BaseForm>
</template>

<style scoped>
.po-card-title {
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: #37474f;
}
.text-right-input :deep(input) {
  text-align: right !important;
}
:deep(.v-data-table__td) {
  height: 32px !important;
}
.fill-height-window {
  min-height: 280px;
}

/* ── Tab Alokasi Kota ── */
.alokasi-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f7fa;
}
.alokasi-scroll {
  max-height: 340px;
  min-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
}
.alokasi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.alokasi-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #e3f2fd;
  color: #0d47a1;
  text-align: left;
  font-weight: 700;
  padding: 4px 8px;
  border-bottom: 1px solid #90caf9;
}
.alokasi-table td {
  padding: 0 8px;
  border-bottom: 1px solid #eee;
  height: 30px;
}
.alokasi-table tr.row-off {
  background: #fafafa;
}
.alokasi-table tr.row-off td:not(.col-check) {
  opacity: 0.55;
}
.alokasi-table .col-check {
  width: 40px;
  text-align: center;
}
.alokasi-table .col-jml {
  width: 120px;
}
.alokasi-table .col-act {
  width: 40px;
  text-align: center;
}
.alokasi-table .empty-row {
  text-align: center;
  color: #9e9e9e;
  padding: 16px;
}
.cell-inp {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 11px;
  height: 26px;
  padding: 0 2px;
}
.cell-inp:focus {
  background: #e3f2fd;
}
.cell-inp.text-right {
  text-align: right;
}
</style>
