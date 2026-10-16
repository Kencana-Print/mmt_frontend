import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "../stores/authStore";

// 1. Impor semua Halaman (Views) Anda
import LoginView from "../views/LoginView.vue";
import Navbar from "../views/NavBar.vue";
import Home from "../views/Home.vue";
import ComingSoon from "../views/ComingSoon.vue";
import LhkCetakView from "../views/LhkMesinCetakView.vue";
import LhkFinishingView from "../views/LhkFinishingView.vue";
import StbjMmtView from "../views/StbjMmtView.vue";
import LapMonCetakView from "../views/LapMonCetakView.vue";

import PermintaanBahanView from "../views/PermintaanBahanView.vue";
import penerimaanBahanView from "../views/penerimaanBahanView.vue";
import FormPenerimaanBahanView from "../views/FormPenerimaanBahanView.vue";
import FormPermintaanBahanView from "../views/FormPermintaanBahanView.vue";
import PermintaanProduksiView from "../views/PermintaanProduksiView.vue";
import FormPermintaanProduksiView from "../views/FormPermintaanProduksiView.vue";
import ReturBeliView from "@/views/ReturBeliView.vue";
import KoreksiStokMMTView from "@/views/KoreksiStokMMTView.vue";
import POPaperprintView from "@/views/POPaperprintView.vue";
import PoIntenalPrintView from "@/views/PoInternalPrintView.vue";
import OperatorView from "@/views/OperatorView.vue";
import MasterBahanView from "@/views/MasterBahanView.vue";
import FormPoBahanMmtView from "@/views/FormPoBahanMmtView.vue";
import POBahanMmtView from "@/views/POBahanMmtView.vue";
import PoPrintView from "@/views/PoPrintView.vue";
import LapLsBahanUtamaView from "../views/LapLsBahanUtamaView.vue";
import LapLsBahanPenolongView from "../views/LapLsBahanPenolongView.vue";
import FormLhkCetakZView from "@/views/FormLhkCetakView.vue";
import PermintaanBahanPrintView from "@/views/PermintaanBahanPrintView.vue";
import FormRecreateBarcode from "@/views/FormRecreateBarcode.vue";
import LapMonLmkpMmtView from "@/views/LapMonLmkpMmtView.vue";
import LapSpkMmtView from "@/views/LapSpkMmtView.vue";
import LapPlanProdView from "@/views/LapPlanProdView.vue";
import LapBarangJadiView from "@/views/LapBarangJadiView.vue";
import LapStokTintaMmtView from "@/views/LapStokTintaMmtView.vue";
import LapOutputMesinView from "@/views/LapOutputMesinView.vue";
import FormReturBeliView from "@/views/FormReturBeliView.vue";
import FormPengajuanPermintaanView from "@/views/FormPengajuanPermintaanView.vue";
import PengajuanPermintaanView from "@/views/PengajuanPermintaanView.vue";
import MutasiProduksiView from "@/views/MutasiProduksiView.vue";
import FormMutasiProduksiView from "@/views/FormMutasiProduksiView.vue";
import PengajuanPermintaanPrintView from "@/views/PengajuanPermintaanPrintView.vue";
import FormLhkFinishingView from "@/views/FormLhkFinishingView.vue";
import PenerimaanBahanPrint from "@/views/PenerimaanBahanPrint.vue";
import FormKoreksiStokView from "@/views/FormKoreksiStokView.vue";
import PengajuanKoreksiStokView from "@/views/PengajuanKoreksiStokView.vue";
import FormPengajuanKoreksiStokView from "@/views/FormPengajuanKoreksiStokView.vue";
import KomitmenKirimView from "@/views/KomitmenKirimView.vue";
import FormKomitmenKirimView from "@/views/FormKomitmenKirimView.vue";
import FormLhkMesinCetakView from "@/views/FormLhkMesinCetakView.vue";
import LhkMesinCetakView from "../views/LhkMesinCetakView.vue";
import LhkCetakMmtView from "@/views/LhkCetakMmtView.vue";
import PlanningProduksiView from "@/views/PlanningProduksiView.vue";
import CreateBarcodeView from "@/views/CreateBarcodeView.vue";
import LhkTekstilMmtView from "@/views/LhkTekstilMmtView.vue";
import SupplierView from "@/views/SupplierView.vue";
import FormSupplierView from "@/views/FormSupplierView.vue";
import FormReturProduksiView from "@/views/FormReturProduksiView.vue";
import ReturProduksiView from "@/views/ReturProduksiView.vue";
import FormMasterBahanView from "@/views/FormMasterBahanView.vue";
import FormLhkCetakMmtView from "@/views/FormLhkCetakMmtView.vue";
import StokOpnameView from "@/views/StokOpnameView.vue";
import LapLHKView from "@/views/LapLHKView.vue";
import PelunasanPembelianView from "@/views/PelunasanPembelianView.vue";
import FormPelunasanPembelianView from "@/views/FormPelunasanPembelianView.vue";
import LapHutangView from "@/views/LapHutangView.vue";
import FormLhkFinishingBuildView from "@/views/FormLhkFinishingBuildView.vue";
import PenerimaanPoExtMmtView from "@/views/PenerimaanPoExtMmtView.vue";
import FormPenerimaanPoExtMmtView from "@/views/FormPenerimaanPoExtMmtView.vue";
import FormLhkTekstilView from "@/views/FormLhkTekstilView.vue";
import StbjView from "@/views/StbjView.vue";
import SpkView from "@/views/SpkView.vue";
import LapPemakaianBahanView from "@/views/LapPemakaianBahanView.vue";
import MutasiGudangView from "@/views/MutasiGudangView.vue";
import FormMutasiGudangView from "@/views/FormMutasiGudangView.vue";
import SearchBarcodeView from "@/views/SearchBarcodeView.vue";
import KartuStokBarcodeView from "@/views/KartuStokBarcodeView.vue";
import FormStbjView from "@/views/FormStbjView.vue";
import JadwalKirimView from "@/views/JadwalKirimView.vue";
import FormJadwalKirimView from "@/views/FormJadwalKirimView.vue";
import FormFinishingAccView from "@/views/FormFinishingAccView.vue";
import LapMonFinishingView from "@/views/LapMonFinishingView.vue";
import LapMonTekstilView from "@/views/LapMonTekstilView.vue";
import FormRekapLhkTekstilView from "@/views/FormRekapLhkTekstilView.vue";
import LapMonProofView from "@/views/LapMonProofView.vue";
import LapMonPaperprintView from "@/views/LapMonPaperprintView.vue";
import LhkProofView from "@/views/LhkProofView.vue";
import FormLhkProofView from "@/views/FormLhkProofView.vue";
import LhkSublimView from "@/views/LhkSublimView.vue";
import FormLhkSublimView from "@/views/FormLhkSublimView.vue";
import LhkRtrView from "@/views/LhkRtrView.vue";
import FormLhkRtrView from "@/views/FormLhkRtrView.vue";
import LhkTekstilApproveView from "@/views/LhkTekstilApproveView.vue";
import JadwalKirimPrintView from "@/views/JadwalKirimPrintView.vue";
import LapMonJadwalKirimView from "@/views/LapMonJadwalKirimView.vue";
import LapMonSublimView from "@/views/LapMonSublimView.vue";
import FormPoExtMmtView from "@/views/FormPoExtMmtView.vue";
import POExternalMmtView from "@/views/POExternalMmtView.vue";
import PoExternalMmtPrintView from "@/views/PoExternalMmtPrint.vue";
import FormPlanningProduksiView from "@/views/FormPlanningProduksiView.vue";
import LapMonPlanVsLHKView from "@/views/LapMonPlanVsLHKView.vue";
import LhkPolaView from "@/views/LhkPolaView.vue";
import FormLhkPolaView from "@/views/FormLhkPolaView.vue";
import LhkLayoutView from "@/views/LhkLayoutView.vue";
import FormLhkLayoutView from "@/views/FormLhkLayoutView.vue";
import MutasiInternalView from "@/views/MutasiInternalView.vue";
import MutasiInternalPrintView from "@/views/MutasiInternalPrintView.vue";
import FormMutasiInternalView from "@/views/FormMutasiInternalView.vue";
import SuratJalanView from "@/views/SuratJalanView.vue";
import SuratJalanPrintView from "@/views/SuratJalanPrintView.vue";
import SuratJalanApproveView from "@/views/SuratJalanApproveView.vue";
import FormSuratJalanApvView from "@/views/FormSuratJalanApvView.vue";
import LapMonBSView from "@/views/LapMonBSView.vue";
import MutasiBahanSpanduk from "@/views/spanduk/MutasiBahanView.vue";
import PermintaanBahanSpandukView from "@/views/spanduk/PermintaanBahanSpandukView.vue";
import MasterBahanSpandukView from "@/views/spanduk/MasterBahanSpandukView.vue";
import PenerimaanBahanPenolongView from "@/views/spanduk/PenerimaanBahanPenolongView.vue";
import LhkCetakSpandukView from "@/views/spanduk/LhkCetakSpandukView.vue";
import LhkJahitSpandukView from "@/views/spanduk/LhkJahitSpandukView.vue";
import LhkLipatSpandukView from "@/views/spanduk/LhkLipatSpandukView.vue";
import LhkQuiringSpandukView from "@/views/spanduk/LhkQuiringSpandukView.vue";
import LhkProofSpandukView from "@/views/spanduk/LhkProofSpandukView.vue";
import LhkAfdrukSpandukView from "@/views/spanduk/LhkAfdrukSpandukView.vue";
import LhkHapusPlangkanSpandukView from "@/views/spanduk/LhkHapusPlangkanSpandukView.vue";
import LhkDesignProofSpandukView from "@/views/spanduk/LhkDesignProofSpandukView.vue";
import RekapLhkSpandukView from "@/views/spanduk/RekapLhkSpandukView.vue";
import LhkPlotterSpandukView from "@/views/spanduk/LhkPlotterSpandukView.vue";
import FormLhkCetakSpandukView from "@/views/spanduk/FormLhkCetakSpandukView.vue";
import FormLhkJahitSpandukView from "@/views/spanduk/FormLhkJahitSpandukView.vue";
import FormLhkLipatSpandukView from "@/views/spanduk/FormLhkLipatSpandukView.vue";
import FormLhkQuiringSpandukView from "@/views/spanduk/FormLhkQuiringSpandukView.vue";
import FormLhkProofSpandukView from "@/views/spanduk/FormLhkProofSpandukView.vue";
import FormLhkAfdrukSpandukView from "@/views/spanduk/FormLhkAfdrukSpandukView.vue";
import FormLhkHapusPlangkanSpandukView from "@/views/spanduk/FormLhkHapusPlangkanSpandukView.vue";
import FormLhkPlotterSpandukView from "@/views/spanduk/FormLhkPlotterSpandukView.vue";
import LapKartuStokMmtView from "@/views/LapKartuStokMmtView.vue";
import LapPemakaianBahanTekstil from "@/views/LapPemakaianBahanTekstil.vue";
import SoToSpkView from "@/views/SoToSpkView.vue";
import FormSoToSpkView from "@/views/FormSoToSpkView.vue";
import FormPoPaperprintView from "@/views/FormPoPaperprintView.vue";
import mapView from "@/views/mapView.vue";
import MapPrintView from "@/views/MapPrintView.vue";
import BastMapView from "@/views/BastMapView.vue";
import FormBastMmtView from "@/views/FormBastMmtView.vue";
import BastMmtPrintView from "@/views/BastMmtPrintView.vue";
import LapKirimanView from "@/views/LapKirimanView.vue";
import SuratJalanMapView from "@/views/SuratJalanMapView.vue";
import UserManagementView from "@/views/UserManagementView.vue";
import RelationshipMapView from "@/views/RelationshipMapView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },

  {
    path: "/",
    name: "Navbar",
    component: Navbar,
    meta: { requiresAuth: true },
    children: [
      // Rute Default untuk Dashboard (Home)
      { path: "", name: "Home", component: Home },

      // Rute yang sudah dibuat (PATH DIBUAT RELATIF - TANPA '/')
      // {
      //   path: "garmen/permintaan-material",
      //   name: "Permintaan Material",
      //   component: MaterialRequestForm,
      // },
      {
        path: "mmt/lhk/cetak-mmt",
        name: "LHKCetakMMT",
        component: LhkCetakMmtView,
      },
      {
        path: "mmt/lhk/cetak-mmt/new",
        name: "LhkCetakMmtNew",
        component: FormLhkCetakMmtView,
      },
      {
        path: "mmt/lhk/cetak-mmt/edit/:nomor",
        name: "LhkCetakMmtEdit",
        component: FormLhkCetakMmtView,
        props: { isEditMode: false },
      },

      {
        path: "mmt/lhk/cetak",
        name: "LHKMesinCetakView",
        component: LhkMesinCetakView,
      },
      {
        path: "mmt/lhk/cetak/new",
        name: "LhkCetakCreate",
        component: FormLhkMesinCetakView,
      },
      {
        path: "mmt/lhk/cetak/edit/:nomor",
        name: "LhkCetakEdit",
        component: FormLhkMesinCetakView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/lhk/finishing",
        name: "LHK Finishing MMT",
        component: LhkFinishingView,
      },
      {
        path: "mmt/lhk/finishing/new",
        name: "LhkFinishingNew",
        component: FormLhkFinishingView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/lhk/finishing/rekap",
        name: "LhkFinishingRekap",
        component: FormLhkFinishingBuildView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/lhk/finishing/acc/:nomor",
        name: "LhkFinishingAcc",
        component: FormFinishingAccView,
        props: true,
      },
      {
        path: "mmt/lhk/finishing/edit/:nomor",
        name: "LhkFinishingEdit",
        component: FormFinishingAccView,
        props: true,
      },
      { path: "mmt/spk", name: "BrowseSpk", component: SpkView },
      // {
      //   path: "mmt/spk/print/:nomor",
      //   name: "SpkPrint",
      //   component: SpkPrintView,
      //   props: true,
      // },
      { path: "mmt/so-spk", name: "BrowseSoToSpk", component: SoToSpkView },
      {
        path: "mmt/so-spk/new",
        name: "BrowseSoToSpkNew",
        component: FormSoToSpkView,
      },
      {
        path: "/mmt/so-spk/print/:nomor",
        name: "MmtSoSpkPrint",
        component: () => import("@/views/SoToSpkPrintView.vue"),
        meta: { title: "Cetak SPK" },
      },

      {
        path: "mmt/jadwal-kirim",
        name: "JadwalKirimBrowse",
        component: JadwalKirimView,
      },
      {
        path: "mmt/jadwal-kirim/new",
        name: "JadwalKirimNew",
        component: FormJadwalKirimView,
      },
      {
        path: "mmt/jadwal-kirim/edit/:nomor",
        name: "JadwalKirimEdit",
        component: FormJadwalKirimView,
        props: { isEditMode: true },
      },
      {
        path: "mmt/jadwal-kirim/print/:nomor",
        name: "JadwalKirimPrint",
        component: JadwalKirimPrintView,
        props: true,
      },
      {
        path: "mmt/surat-jalan",
        name: "SuratJalanBrowse",
        component: SuratJalanView,
      },
      {
        path: "mmt/surat-jalan/print/:nomor(.*)*", // <-- Tambahkan (.*)* agar menyerap karakter /
        name: "SuratJalanPrint",
        component: SuratJalanPrintView,
        props: true,
      },
      {
        path: "mmt/surat-jalan/approve",
        name: "SuratJalanApprove",
        component: SuratJalanApproveView,
      },
      {
        path: "mmt/surat-jalan/approve/new",
        name: "SuratJalanApproveNew",
        component: FormSuratJalanApvView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/surat-jalan/approve/:nomor",
        name: "SuratJalanApproveEdit",
        component: FormSuratJalanApvView,
        props: true,
      },
      {
        path: "mmt/surat-jalan-map",
        name: "SuratJalanMapBrowse",
        component: SuratJalanMapView,
      },
      {
        path: "mmt/surat-jalan-map/print/:nomor(.*)*", // <-- Tambahkan (.*)* agar menyerap karakter /
        name: "SuratJalanMapPrint",
        component: ComingSoon,
        props: true,
      },

      { path: "mmt/stbj", name: "BrowseStbj", component: StbjView },
      { path: "mmt/stbj/new", name: "StbjNew", component: FormStbjView },
      {
        path: "mmt/stbj/edit/:nomor",
        name: "StbjEdit",
        component: FormStbjView,
        props: { isEditMode: true },
      },
      { path: "mmt/daftar/stbj", name: "STBJMMT", component: StbjMmtView },
      {
        path: "mmt/pengajuan-permintaan",
        name: "PengajuanPermintaanBrowse",
        component: PengajuanPermintaanView,
      },
      {
        path: "mmt/pengajuan-permintaan/new",
        name: "PengajuanPermintaanNew",
        component: FormPengajuanPermintaanView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/pengajuan-permintaan/edit/:nomor",
        name: "PengajuanPermintaanEdit",
        component: FormPengajuanPermintaanView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/pengajuan-permintaan/print/:nomor",
        name: "PengajuanPermintaanPrint",
        component: PengajuanPermintaanPrintView,
        props: true,
        meta: {
          PrintLayout: true,
          layout: "PrintLayout",
        },
      },
      {
        path: "mmt/permintaan-bahan",
        name: "MmtPermintaanBahanBrowse",
        component: PermintaanBahanView,
        meta: {
          title: "Permintaan Bahan MMT",
          divisi: 1,
          cabang: "P05",
        },
        props: { divisi: 1, cabang: "P05" },
      },

      {
        path: "mmt/permintaan-bahan/new",
        name: "PermintaanBahanNew",
        component: FormPermintaanBahanView,
        props: { isEditMode: false },
      },

      // 3. Ubah (Edit Existing)
      {
        path: "mmt/permintaan-bahan/edit/:nomor",
        name: "PermintaanBahanEdit",
        component: FormPermintaanBahanView,
        props: true,
      },
      {
        path: "mmt/permintaan-bahan/print/:nomor",
        name: "PermintaanBahanPrint",
        component: PermintaanBahanPrintView,
        props: true,
        meta: {
          PrintLayout: true, // Tagging untuk layout
          layout: "PrintLayout", // Nama Layout yang akan digunakan
        },
      },

      {
        path: "spanduk/permintaan-bahan",
        name: "SpandukPermintaanBahanBrowse",
        component: PermintaanBahanView, // Menggunakan komponen View yang sama
        meta: {
          title: "Permintaan Bahan Spanduk",
          divisi: 1,
          cabang: "P02",
        },
        props: { divisi: 1, cabang: "P02" },
      },
      {
        path: "mmt/voucher-pembelian",
        name: "VoucherPelunasanBrowse",
        component: PelunasanPembelianView,
      },
      {
        path: "mmt/voucher-pembelian/new",
        name: "VoucherPelunasanNew",
        component: FormPelunasanPembelianView,
      },
      {
        path: "mmt/po-external-mmt",
        name: "POExternalMmtBrowse",
        component: POExternalMmtView,
      },
      {
        path: "mmt/po-external-mmt/new",
        name: "POExternalMmtNew",
        component: FormPoExtMmtView,
      },
      {
        path: "mmt/po-external-mmt/edit/:nomor",
        name: "POExternalMmtEdit",
        component: FormPoExtMmtView,
        props: { isEditMode: true },
      },
      {
        path: "mmt/po-external-mmt/print/:nomor",
        name: "POExternalMmtPrint",
        component: PoExternalMmtPrintView,
        props: true,
      },
      {
        path: "mmt/po-bahan-mmt",
        name: "POBahanMmtBrowse",
        component: POBahanMmtView,
      },
      {
        // 2. Rute untuk Halaman Input Baru
        path: "mmt/po-bahan-mmt/new",
        name: "PoBahanMmtNew",
        component: FormPoBahanMmtView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/po-bahan-mmt/edit/:nomor",
        name: "PoBahanMmtEdit", // 👈 Nama Unik: Untuk mengedit
        component: FormPoBahanMmtView,
        props: (route) => ({
          isEditMode: true,
          nomor: route.params.nomor, // Meneruskan parameter nomor
        }),
      },
      {
        path: "mmt/po-bahan-mmt/print/:nomor",
        name: "PoPrint", // <--- NAMA INI HARUS SAMA PERSIS
        component: PoPrintView,
        props: true,
        meta: {
          layout: "blank", // Atau 'empty' sesuai konfigurasi layout router project Anda
        },
      },
      {
        path: "mmt/penerimaan-bahan",
        name: "PenerimaanBahanBrowse",
        component: penerimaanBahanView,
      },

      // // 2. Tambah Baru (New Entry)
      {
        path: "mmt/penerimaan-bahan/new",
        name: "PenerimaanBahanNew",
        component: FormPenerimaanBahanView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/penerimaan-bahan/edit/:nomor",
        name: "PenerimaanBahanEdit",
        component: FormPenerimaanBahanView,
        props: true,
      },
      {
        path: "mmt/penerimaan-bahan/print/:nomor",
        name: "PenerimaanBahanPrint",
        component: PenerimaanBahanPrint,
        props: true,
      },

      {
        path: "mmt/retur-beli",
        name: "Retur Beli MMT",
        component: ReturBeliView,
      },
      {
        path: "mmt/retur-beli/new",
        name: "ReturBeliNew",
        component: FormReturBeliView,
      },

      // { path: "mmt/invoice", name: "InvoiceBrowse", component: InvoiceView },
      // {
      //   path: "mmt/invoice/new",
      //   name: "InvoiceNew",
      //   component: FormInvoiceView,
      //   props: { isEditMode: false },
      // },
      // {
      //   path: "mmt/invoice/print/:nomor",
      //   name: "InvoicePrint",
      //   component: InvoicePrintView,
      //   props: true,
      // },
      {
        path: "mmt/create-barcode",
        name: "CreateBarcode",
        component: CreateBarcodeView,
      },
      {
        path: "mmt/create-barcode/new",
        name: "CreateBarcodeNew",
        component: FormRecreateBarcode,
      },
      {
        path: "mmt/stok-opname",
        name: "StokOpnameBrowse",
        component: StokOpnameView,
      },
      {
        path: "mmt/search-barcode",
        name: "SearchBarcodeBrowse",
        component: SearchBarcodeView,
      },
      {
        path: "mmt/kartu-stok-barcode",
        name: "KartuStokBarcode",
        component: KartuStokBarcodeView,
      },
      {
        path: "mmt/koreksi-stok",
        name: "KoreksiStokBrowse",
        component: KoreksiStokMMTView,
      },
      {
        path: "mmt/koreksi-stok/new",
        name: "KoreksiStokNew",
        component: FormKoreksiStokView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/pengajuan-koreksi-stok",
        name: "PengajuanKoreksiStokBrowse",
        component: PengajuanKoreksiStokView,
      },
      {
        path: "mmt/pengajuan-koreksi-stok/new",
        name: "PengajuanKoreksiStokNew",
        component: FormPengajuanKoreksiStokView,
      },
      {
        path: "mmt/komitmen-kirim",
        name: "KomitmenKirim",
        component: KomitmenKirimView,
        meta: { title: "Komitmen Kirim" },
      },
      {
        path: "mmt/komitmen-kirim/new",
        name: "KomitmenKirimNew",
        component: FormKomitmenKirimView,
      },
      {
        path: "mmt/komitmen-kirim/:nomor",
        name: "KomitmenKirimEdit",
        component: FormKomitmenKirimView,
        props: true,
      },
      {
        path: "mmt/permintaan-produksi",
        name: "PermintaanProduksiBrowse",
        component: PermintaanProduksiView,
      },
      {
        path: "mmt/permintaan-produksi/new",
        name: "PermintaanProduksiNew",
        component: FormPermintaanProduksiView,
        props: { isEditMode: false },
      },

      {
        path: "mmt/permintaan-produksi/edit/:nomor",
        name: "PermintaanProduksiEdit",
        component: FormPermintaanProduksiView,
        props: true,
      },
      {
        path: "mmt/mutasi-gudang",
        name: "MutasiGudangBrowse",
        component: MutasiGudangView,
      },
      {
        path: "mmt/mutasi-gudang/new",
        name: "MutasiGudangNew",
        component: FormMutasiGudangView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/mutasi-gudang/edit/:nomor",
        name: "MutasiGudangEdit",
        component: FormMutasiGudangView,
        props: true,
      },

      {
        path: "mmt/realisasi-produksi",
        name: "MutasiProduksiBrowse",
        component: MutasiProduksiView,
      },
      {
        path: "mmt/realisasi-produksi/new",
        name: "MutasiProduksiNew",
        component: FormMutasiProduksiView,
        props: { isEditMode: false },
      },
      {
        path: "mmt/realisasi-produksi/edit/:nomor",
        name: "MutasiProduksiEdit",
        component: FormMutasiProduksiView,
        props: true,
      },

      {
        path: "mmt/retur-produksi",
        name: "ReturProduksiBrowse",
        component: ReturProduksiView,
      },
      {
        path: "mmt/retur-produksi/new",
        name: "ReturProduksiNew",
        component: FormReturProduksiView,
        props: { isEditMode: false },
      },
      // 3. Ubah (Edit Existing)
      {
        path: "mmt/realisasi-produksi/edit/:nomor",
        name: "ReturProduksiEdit",
        component: FormReturProduksiView,
        props: true,
      },
      {
        path: "mmt/planning-produksi",
        name: "PlanningProduksiBrowse",
        component: PlanningProduksiView,
      },
      {
        path: "mmt/planning-produksi-form",
        name: "PlanningProduksiMMTForm",
        component: FormPlanningProduksiView,
      },

      // // --- GRUP COMING SOON / UMUM (PATH DIBUAT RELATIF) ---
      { path: "mmt/manage-user", name: "User", component: UserManagementView },
      {
        path: "file/perusahaan",
        name: "Identitas Perusahaan",
        component: ComingSoon,
      },
      {
        path: "file/ganti-password",
        name: "Ganti Password",
        component: ComingSoon,
      },
      { path: "daftar/supplier", name: "Supplier", component: SupplierView },
      {
        path: "daftar/supplier/new",
        name: "SupplierNew",
        component: FormSupplierView,
      },
      {
        path: "daftar/supplier/edit/:kode",
        name: "SupplierEdit",
        component: FormSupplierView,
        props: true,
      },
      { path: "daftar/kode-bayar", name: "Kode Bayar", component: ComingSoon },
      {
        path: "daftar/jenis-barang",
        name: "Jenis Barang",
        component: ComingSoon,
      },
      { path: "daftar/gudang", name: "Gudang", component: ComingSoon },
      { path: "daftar/jasa", name: "Jasa", component: ComingSoon },
      {
        path: "daftar/gudang-produksi",
        name: "Gudang Produksi",
        component: ComingSoon,
      },
      {
        path: "daftar/komponen-spk",
        name: "Komponen SPK",
        component: ComingSoon,
      },
      { path: "daftar/customer", name: "Customer", component: ComingSoon },
      {
        path: "daftar/tanda-terima",
        name: "Tanda Terima",
        component: ComingSoon,
      },
      {
        path: "daftar/jenis-order",
        name: "Jenis Order",
        component: ComingSoon,
      },
      { path: "daftar/sales", name: "Sales", component: ComingSoon },
      { path: "daftar/barang", name: "Barang", component: ComingSoon },
      {
        path: "daftar/jenis-potongan",
        name: "Jenis Potongan",
        component: ComingSoon,
      },
      { path: "daftar/bahan", name: "Bahan", component: ComingSoon },
      { path: "pembelian/mkb", name: "MKB", component: ComingSoon },
      { path: "pembelian/po-bahan", name: "PO Bahan", component: ComingSoon },
      { path: "pembelian/input-ppn", name: "Input PPN", component: ComingSoon },
      { path: "pembelian/retur-ppn", name: "Retur PPN", component: ComingSoon },
      {
        path: "pembelian/retur-beli",
        name: "Retur Pembelian",
        component: ComingSoon,
      },
      { path: "garmen/bpb-bahan", name: "BPB Bahan", component: ComingSoon },
      { path: "garmen/po-jasa", name: "PO Jasa", component: ComingSoon },
      {
        path: "garmen/po-paper-print",
        name: "PO Paper Print",
        component: ComingSoon,
      },
      { path: "garmen/bpb-jasa", name: "BPB Jasa", component: ComingSoon },
      { path: "garmen/stbj", name: "STBJ", component: ComingSoon },
      {
        path: "garmen/mutasi-produksi",
        name: "Mutasi Produksi",
        component: ComingSoon,
      },
      {
        path: "mmt/map",
        name: "MapBrowse",
        component: mapView,
      },
      {
        path: "mmt/map/print/:nomor",
        name: "MapPrint",
        component: MapPrintView,
      },
      {
        path: "mmt/bast-map",
        name: "BastMmtBrowse",
        component: BastMapView,
      },

      {
        path: "mmt/bast-map/new",
        name: "BastMmtNew",
        component: FormBastMmtView,
      },
      {
        path: "mmt/relationship-map",
        name: "RelationshipMapView",
        component: RelationshipMapView,
      },
      {
        path: "mmt/bast-map/edit/:nomor",
        name: "BastMmtEdit",
        component: FormBastMmtView,
        props: true,
      },
      {
        path: "mmt/bast-map/print/:nomor",
        name: "BastMmtPrint",
        component: BastMmtPrintView,
      },
      {
        path: "mmt/search-barcode",
        name: "SearchBarcodeBrowse",
        component: SearchBarcodeView,
      },
      {
        path: "garmen/retur-material",
        name: "Retur Material",
        component: ComingSoon,
      },
      {
        path: "garmen/koreksi-stok-jadi",
        name: "Koreksi Stok Barang Jadi",
        component: ComingSoon,
      },
      {
        path: "garmen/koreksi-stok-bahan",
        name: "Koreksi Stok Bahan Baku",
        component: ComingSoon,
      },
      { path: "garmen/bpb-non-po", name: "BPB Non PO", component: ComingSoon },
      {
        path: "garmen/jadwal-kirim-produksi",
        name: "Jadwal Kirim Produksi",
        component: ComingSoon,
      },
      {
        path: "spanduk/terima-supplier",
        name: "Terima Supplier",
        component: ComingSoon,
      },
      {
        path: "spanduk/mutasi-bahan",
        name: "MutasiBahanSpanduk",
        component: MutasiBahanSpanduk,
      },
      {
        path: "spanduk/permintaan-bahan",
        name: "PermintaanBahanSpanduk",
        component: PermintaanBahanSpandukView,
      },
      {
        // Form input menyusul Tahap 5 (backend baru sediakan GET /browse).
        path: "spanduk/permintaan-bahan/new",
        name: "PermintaanBahanSpandukNew",
        component: ComingSoon,
      },
      {
        path: "spanduk/master-bahan",
        name: "MasterBahanSpanduk",
        component: MasterBahanSpandukView,
      },
      {
        path: "spanduk/penerimaan-bahan-penolong",
        name: "PenerimaanBahanPenolongSpanduk",
        component: PenerimaanBahanPenolongView,
      },
      { path: "spanduk/retur-beli", name: "Retur Beli", component: ComingSoon },
      {
        path: "spanduk/mutasi-gudang",
        name: "Mutasi Gudang Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/permintaan-produksi",
        name: "Permintaan Produksi Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/realisasi-produksi",
        name: "Realisasi Produksi Spanduk",
        component: ComingSoon,
      },
      { path: "spanduk/anval", name: "Anval", component: ComingSoon },
      {
        path: "spanduk/penjualan",
        name: "Penjualan Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/koreksi-stok",
        name: "Koreksi Stok v2",
        component: ComingSoon,
      },
      {
        path: "spanduk/spk-tambahan",
        name: "SPK Tambahan",
        component: ComingSoon,
      },
      {
        path: "spanduk/monitoring-proof",
        name: "Monitoring Proof",
        component: ComingSoon,
      },
      {
        path: "spanduk/lhk-cetak",
        name: "LHK Cetak Spanduk",
        component: LhkCetakSpandukView,
      },
      {
        path: "spanduk/lhk-cetak/new",
        name: "LhkCetakSpandukNew",
        component: FormLhkCetakSpandukView,
      },
      {
        path: "spanduk/lhk-cetak/edit/:nomor",
        name: "LhkCetakSpandukEdit",
        component: FormLhkCetakSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-jahit",
        name: "LHK Jahit Spanduk",
        component: LhkJahitSpandukView,
      },
      {
        path: "spanduk/lhk-jahit/new",
        name: "LhkJahitSpandukNew",
        component: FormLhkJahitSpandukView,
      },
      {
        path: "spanduk/lhk-jahit/edit/:nomor",
        name: "LhkJahitSpandukEdit",
        component: FormLhkJahitSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-lipat",
        name: "LHK Lipat Spanduk",
        component: LhkLipatSpandukView,
      },
      {
        path: "spanduk/lhk-lipat/new",
        name: "LhkLipatSpandukNew",
        component: FormLhkLipatSpandukView,
      },
      {
        path: "spanduk/lhk-lipat/edit/:nomor",
        name: "LhkLipatSpandukEdit",
        component: FormLhkLipatSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-quiring",
        name: "LHK Quiring Spanduk",
        component: LhkQuiringSpandukView,
      },
      {
        path: "spanduk/lhk-quiring/new",
        name: "LhkQuiringSpandukNew",
        component: FormLhkQuiringSpandukView,
      },
      {
        path: "spanduk/lhk-quiring/edit/:nomor",
        name: "LhkQuiringSpandukEdit",
        component: FormLhkQuiringSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-proof",
        name: "LHK Proof Spanduk",
        component: LhkProofSpandukView,
      },
      {
        path: "spanduk/lhk-proof/new",
        name: "LhkProofSpandukNew",
        component: FormLhkProofSpandukView,
      },
      {
        path: "spanduk/lhk-proof/edit/:nomor",
        name: "LhkProofSpandukEdit",
        component: FormLhkProofSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-afdruk",
        name: "LHK Afdruk Spanduk",
        component: LhkAfdrukSpandukView,
      },
      {
        path: "spanduk/lhk-afdruk/new",
        name: "LhkAfdrukSpandukNew",
        component: FormLhkAfdrukSpandukView,
      },
      {
        path: "spanduk/lhk-afdruk/edit/:nomor",
        name: "LhkAfdrukSpandukEdit",
        component: FormLhkAfdrukSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-hapus-plangkan",
        name: "LHK Hapus Plangkan Spanduk",
        component: LhkHapusPlangkanSpandukView,
      },
      {
        path: "spanduk/lhk-hapus-plangkan/new",
        name: "LhkHapusPlangkanSpandukNew",
        component: FormLhkHapusPlangkanSpandukView,
      },
      {
        path: "spanduk/lhk-hapus-plangkan/edit/:nomor",
        name: "LhkHapusPlangkanSpandukEdit",
        component: FormLhkHapusPlangkanSpandukView,
        props: true,
      },
      {
        path: "spanduk/lhk-design-proof",
        name: "LHK Design Proof Spanduk",
        component: LhkDesignProofSpandukView,
      },
      {
        path: "spanduk/rekap-lhk",
        name: "Rekap LHK Spanduk",
        component: RekapLhkSpandukView,
      },
      {
        path: "spanduk/lhk-plotter",
        name: "LHK Plotter Spanduk",
        component: LhkPlotterSpandukView,
      },
      {
        path: "spanduk/lhk-plotter/new",
        name: "LhkPlotterSpandukNew",
        component: FormLhkPlotterSpandukView,
      },
      {
        path: "spanduk/lhk-plotter/edit/:nomor",
        name: "LhkPlotterSpandukEdit",
        component: FormLhkPlotterSpandukView,
        props: true,
      },
      {
        path: "spanduk/mon-cetak",
        name: "Mon Cetak Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/mon-jahit",
        name: "Mon Jahit Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/mon-lipat",
        name: "Mon Lipat Spanduk",
        component: ComingSoon,
      },
      {
        path: "spanduk/mon-quiring",
        name: "Mon Quiring Spanduk",
        component: ComingSoon,
      },

      {
        path: "mmt/daftar/bahan",
        name: "Master Bahan",
        component: MasterBahanView,
      },
      {
        path: "mmt/daftar/bahan/new",
        name: "MasterBahanNew",
        component: FormMasterBahanView,
      },
      {
        path: "mmt/daftar/operator",
        name: "Operator",
        component: OperatorView,
      },
      {
        path: "mmt/daftar/retur-permintaan-produksi",
        name: "Retur Permintaan Produksi MMT",
        component: ComingSoon,
      },
      {
        path: "mmt/daftar/planning-produksi",
        name: "Planning Produksi MMT",
        component: ComingSoon,
      },
      { path: "mmt/daftar/stbj", name: "STBJ MMT", component: ComingSoon },
      {
        path: "mmt/lhk/tekstil",
        name: "tekstilMMT",
        component: LhkTekstilMmtView,
      },
      {
        path: "mmt/lhk/tekstil-new",
        name: "tekstilMMTNew",
        component: FormLhkTekstilView,
      },
      {
        path: "mmt/lhk/tekstil/edit/:nomor",
        name: "tekstilMMTEdit",
        component: FormLhkTekstilView,
      },
      {
        path: "mmt/lhk/tekstil/approve",
        name: "LhkTekstilApprove",
        component: LhkTekstilApproveView,
      },
      {
        path: "mmt/rekap-tekstil",
        name: "RekapTekstilMMT",
        component: FormRekapLhkTekstilView,
      },
      {
        path: "mmt/rekap-tekstil/edit/:nomor",
        name: "RekapTekstilMMTEdit",
        component: FormRekapLhkTekstilView,
      },
      {
        path: "mmt/lhk/proof",
        name: "LHKProofMMTBrowse",
        component: LhkProofView,
      },
      {
        path: "mmt/lhk/proof/new",
        name: "LHKProofMMTNew",
        component: FormLhkProofView,
      },
      {
        path: "mmt/lhk/proof/edit/:nomor",
        name: "LHKProofMMTEdit",
        component: FormLhkProofView,
      },

      { path: "mmt/lhk/pola", name: "LHKPolaMMT", component: LhkPolaView },
      {
        path: "mmt/lhk/pola/new",
        name: "LHKPolaMMTNew",
        component: FormLhkPolaView,
      },
      {
        path: "mmt/lhk/pola/edit/:nomor",
        name: "LHKPolaMMTEdit",
        component: FormLhkPolaView,
      },
      {
        path: "mmt/lhk/layout",
        name: "LHKLayoutMMT",
        component: LhkLayoutView,
      },
      {
        path: "mmt/lhk/layout/new",
        name: "LHKLayoutMMTNew",
        component: FormLhkLayoutView,
      },
      {
        path: "mmt/lhk/layout/edit/:nomor",
        name: "LHKLayoutMMTEdit",
        component: FormLhkLayoutView,
      },
      {
        path: "mmt/lhk/paperprint",
        name: "LHKSublimMMT",
        component: LhkSublimView,
      },
      {
        path: "mmt/lhk/paperprint/new",
        name: "LHKSublimMMTNew",
        component: FormLhkSublimView,
      },
      {
        path: "mmt/lhk/paperprint/edit/:nomor",
        name: "LHKSublimMMTEdit",
        component: FormLhkSublimView,
      },

      // { path: "mmt/absensi", name: "absensiNew", component: FormAbsesnView },
      { path: "mmt/lhk/sublim", name: "LhkSublim", component: LhkRtrView },
      {
        path: "mmt/lhk/sublim/new",
        name: "LhkSublimNew",
        component: FormLhkRtrView,
      },
      {
        path: "mmt/lhk/sublim/edit/:nomor",
        name: "LhkSublimEdit",
        component: FormLhkRtrView,
      },

      {
        path: "mmt/bs-digital",
        name: "BS & Sisa Digital Print",
        component: ComingSoon,
      },
      {
        path: "mmt/bs-tekstil",
        name: "BS & Sisa Tekstil",
        component: ComingSoon,
      },
      { path: "mmt/bahan-sisa", name: "Bahan Sisa MMT", component: ComingSoon },
      {
        path: "mmt/po-paperprint",
        name: "POPaperprintMMT",
        component: POPaperprintView,
      },
      {
        path: "mmt/po-paperprint/new",
        name: "POPaperprintMMTNew",
        component: FormPoPaperprintView,
      },
      {
        path: "mmt/po-paperprint/edit/:nomor",
        name: "POPaperprintMMTEdit",
        component: FormPoPaperprintView,
      },
      {
        path: "mmt/po-internal/print",
        name: "POInternalPrintMMT",
        component: PoIntenalPrintView,
      },
      {
        path: "mmt/penerimaan-po-external",
        name: "Penerimaan PO External MMT",
        component: PenerimaanPoExtMmtView,
      },
      {
        path: "mmt/penerimaan-po-external/new",
        name: "PenerimaanPOExternalMmmtNew",
        component: FormPenerimaanPoExtMmtView,
      },
      {
        path: "mmt/penerimaan-po-external/edit/:nomor",
        name: "PenerimaanPOExternalMmmtEdit",
        component: FormPenerimaanPoExtMmtView,
      },
      {
        path: "mmt/mutasi-internal",
        name: "MutasiInternalMMT",
        component: MutasiInternalView,
      },
      {
        path: "mmt/mutasi-internal/new",
        name: "MutasiInternalMMTNew",
        component: FormMutasiInternalView,
      },
      {
        path: "mmt/mutasi-internal/edit/:nomor",
        name: "MutasiInternalMMTEdit",
        component: FormMutasiInternalView,
      },
      {
        path: "mmt/mutasi-internal/print/:nomor",
        name: "MutasiInternalMMTPrint",
        component: MutasiInternalPrintView,
      },

      // // Rute untuk "Produksi MMT"
      // {
      //   path: "produksi-mmt/mon/cetak",
      //   name: "Monitoring Cetak MMT",
      //   component: ComingSoon,
      // },
      // {
      //   path: "produksi-mmt/mon/finishing",
      //   name: "Monitoring Finishing MMT",
      //   component: ComingSoon,
      // },
      // {
      //   path: "produksi-mmt/mon/proof",
      //   name: "Monitoring Proof MMT",
      //   component: ComingSoon,
      // },
      // {
      //   path: "produksi-mmt/mon/sublim",
      //   name: "Monitoring Sublim MMT",
      //   component: ComingSoon,
      // },
      // {
      //   path: "produksi-mmt/mon/rtr",
      //   name: "Monitoring RTR MMT",
      //   component: ComingSoon,
      // },
      // {
      //   path: "produksi-mmt/mon/tekstil",
      //   name: "Monitoring Tekstil MMT",
      //   component: ComingSoon,
      // },
      {
        path: "laporan/mmt/ls-bahan-utama",
        name: "LS Bahan Utama",
        component: LapLsBahanUtamaView,
      },
      {
        path: "laporan/mmt/lap-kartustok-mmt",
        name: "LapKartuStokMmt",
        component: LapKartuStokMmtView,
      },
      {
        path: "laporan/mmt/ls-bahan-penolong",
        name: "LS Bahan Penolong",
        component: LapLsBahanPenolongView,
      },
      {
        path: "laporan/mmt/lap-mon-lmkp-mmt",
        name: "lapMonLmkpMmt",
        component: LapMonLmkpMmtView,
      },

      {
        path: "laporan/mmt/lap-kiriman",
        name: "lapKiriman",
        component: LapKirimanView,
      },
      {
        path: "laporan/mmt/lap-mon-cetak",
        name: "lapMonCetak",
        component: LapMonCetakView,
      },
      {
        path: "laporan/mmt/lap-mon-finishing",
        name: "lapMonFinishing",
        component: LapMonFinishingView,
      },
      {
        path: "laporan/mmt/lap-mon-tekstil",
        name: "lapMonTekstil",
        component: LapMonTekstilView,
      },
      {
        path: "laporan/mmt/lap-mon-proof",
        name: "lapMonProof",
        component: LapMonProofView,
      },
      {
        path: "laporan/mmt/lap-mon-paperprint",
        name: "lapMonPaperprint",
        component: LapMonPaperprintView,
      },
      {
        path: "laporan/mmt/lap-mon-sublim",
        name: "lapMonSublim",
        component: LapMonSublimView,
      },
      {
        path: "laporan/mmt/lap-mon-plan-vs-lhk",
        name: "lapMonPlanVsLHK",
        component: LapMonPlanVsLHKView,
      },
      {
        path: "laporan/mmt/lap-mon-bs",
        name: "lapMonBS",
        component: LapMonBSView,
      },
      {
        path: "laporan/mmt/lap-mon-jadwalkirim",
        name: "lapMonJadwalKirim",
        component: LapMonJadwalKirimView,
      },
      {
        path: "laporan/mmt/lap-spk-mmt",
        name: "lapSpkMmt",
        component: LapSpkMmtView,
      },
      {
        path: "laporan/mmt/lap-pemakaian-bahan-tekstil",
        name: "LapPemakaianBahanTekstil",
        component: LapPemakaianBahanTekstil,
      },
      {
        path: "laporan/mmt/lap-pemakaian-bahan",
        name: "LapPemakaianBahan",
        component: LapPemakaianBahanView,
      },
      {
        path: "laporan/mmt/lap-plan-produksi",
        name: "lapPlanProduksi",
        component: LapPlanProdView,
      },
      {
        path: "laporan/mmt/lap-barang-jadi",
        name: "lapBarangJadi",
        component: LapBarangJadiView,
      },
      {
        path: "laporan/mmt/lap-stok-tinta",
        name: "lapStokTinta",
        component: LapStokTintaMmtView,
      },
      {
        path: "laporan/mmt/lap-output-mesin",
        name: "lapOutputMesin",
        component: LapOutputMesinView,
      },
      { path: "laporan/mmt/lap-lhk", name: "LapLHK", component: LapLHKView },
      {
        path: "laporan/mmt/lap-hutang",
        name: "LapHutang",
        component: LapHutangView,
      },

      {
        path: "produksi-mmt/ls-tinta",
        name: "LS Tinta",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/ls-bahan-kain",
        name: "LS Bahan Kain",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/kartu-stock-bahan",
        name: "Kartu Stock Bahan MMT",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/lap-bs-digital",
        name: "Lap BS & Sisa Digital Print",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/lap-bs-tekstil",
        name: "Lap BS & Sisa Tekstil",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/spk-stbj-sj",
        name: "SPK vs STBJ vs SJ (MMT)",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/lap-mon-brg-jadi",
        name: "Lap Monitoring Barang Jadi",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/lap-lpbu",
        name: "Laporan LPBU Digital Print",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/ls-sisa-mmt",
        name: "LS Bahan Sisa MMT",
        component: ComingSoon,
      },
      {
        path: "produksi-mmt/ls-sisa-tekstil",
        name: "LS Bahan Sisa Tekstil",
        component: ComingSoon,
      },
      {
        path: "laporan/marketing/target-vs-realisasi",
        name: "Lap Target vs Realisasi",
        component: ComingSoon,
      },
      {
        path: "laporan/marketing/proyeksi-vs-realisasi",
        name: "Lap Proyeksi vs Realisasi",
        component: ComingSoon,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: "router-link-active",
  linkExactActiveClass: "router-link-exact-active",
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const loggedIn = authStore.isAuthenticated;
  const requiresAuth = Boolean(to.meta?.requiresAuth);

  if (requiresAuth && !loggedIn) {
    if (authStore.isTokenExpired) {
      authStore.handleSessionExpired();
    }
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }

  if (to.name === "Login" && loggedIn) {
    return next({ name: "Home" });
  }

  return next();
});

export default router;
