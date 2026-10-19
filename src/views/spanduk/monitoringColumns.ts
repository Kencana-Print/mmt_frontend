// Konfigurasi kolom & endpoint untuk halaman "Monitoring" Spanduk.
// Dipakai oleh MonitoringSpandukView.vue lewat route props.
// SQL tiap monitor dicloning dari MANKSI/spanduk/ufrmbrowsemonitor*.pas.

export interface MonitoringColumn {
  title: string;
  key: string;
  minWidth?: string;
  width?: string;
  align?: "start" | "center" | "end";
  sortable?: boolean;
}

export interface MonitoringConfig {
  title: string;
  icon: string;
  apiPath: string;
  itemValue: string;
  showPerusahaan: boolean;
  headers: MonitoringColumn[];
  numericKeys: string[];
  summaryFields: string[];
  searchKeys: string[];
}

const NO_COL: MonitoringColumn = {
  title: "No",
  key: "No",
  width: "50px",
  minWidth: "50px",
  align: "end",
  sortable: false,
};

const num = (key: string, title: string, minWidth = "90px"): MonitoringColumn => ({
  title,
  key,
  minWidth,
  align: "end",
});

// Kolom standar LHK (jahit/lipat): mirip monitoring cetak.
const LHK_PABRIK_HEADERS = (): MonitoringColumn[] => [
  NO_COL,
  { title: "Hari", key: "hari", minWidth: "80px" },
  { title: "Tanggal", key: "TANGGAL", minWidth: "100px" },
  { title: "Perusahaan", key: "PERUSAHAAN", minWidth: "100px" },
  { title: "Tgl SPK", key: "TANGGAL_SPK", minWidth: "100px" },
  { title: "Deadline", key: "DEADLINE", minWidth: "100px" },
  { title: "Kode Order", key: "J_ORDER", minWidth: "90px", align: "center" },
  { title: "Nama Order", key: "NAMA_ORDER", minWidth: "160px" },
  { title: "Nama SPK", key: "SPK_NAMA", minWidth: "220px" },
  num("PANJANG", "Panjang"),
  num("LEBAR", "Lebar"),
  { title: "Nomor SPK", key: "NOMER_SPK", minWidth: "150px" },
  num("Jml_ORDER", "Jml Order", "100px"),
  num("J_Meter", "J. Meter", "100px"),
  { title: "Kain", key: "KAIN", minWidth: "130px" },
  num("KURANG", "Kurang"),
  num("j_P01", "P01 (pcs)"),
  num("j_P02", "P02 (pcs)"),
  num("j_jumlah", "Jml Cetak", "100px"),
  num("m_P01", "Meter P01", "100px"),
  num("m_P02", "Meter P02", "100px"),
  num("m_jumlah", "Jml Meter", "100px"),
];

const LHK_PABRIK_NUMERIC = [
  "PANJANG",
  "LEBAR",
  "Jml_ORDER",
  "J_Meter",
  "KURANG",
  "j_P01",
  "j_P02",
  "j_jumlah",
  "m_P01",
  "m_P02",
  "m_jumlah",
];

const LHK_PABRIK_SUMMARY = [
  "Jml_ORDER",
  "J_Meter",
  "KURANG",
  "j_P01",
  "j_P02",
  "j_jumlah",
  "m_P01",
  "m_P02",
  "m_jumlah",
];

export const SPANDUK_MONITORING: Record<string, MonitoringConfig> = {
  // Delphi: ufrmbrowsemonitorcetak.pas
  cetak: {
    title: "Monitoring Cetak Spanduk",
    icon: "mdi-chart-timeline-variant",
    apiPath: "/spanduk/mon-cetak",
    itemValue: "NOMER_SPK",
    showPerusahaan: true,
    headers: [
      NO_COL,
      { title: "Hari", key: "hari", minWidth: "80px" },
      { title: "Tanggal", key: "TANGGAL", minWidth: "100px" },
      { title: "Perusahaan", key: "PERUSAHAAN", minWidth: "100px" },
      { title: "Tgl SPK", key: "TANGGAL_SPK", minWidth: "100px" },
      { title: "Deadline", key: "DEADLINE", minWidth: "100px" },
      { title: "Kode Order", key: "J_ORDER", minWidth: "90px", align: "center" },
      { title: "Nama Order", key: "NAMA_ORDER", minWidth: "160px" },
      { title: "Nama SPK", key: "SPK_NAMA", minWidth: "220px" },
      num("PANJANG", "Panjang"),
      num("LEBAR", "Lebar"),
      { title: "Nomor SPK", key: "NOMER_SPK", minWidth: "150px" },
      num("Jml_ORDER", "Jml Order", "100px"),
      num("J_Meter", "J. Meter", "100px"),
      { title: "Kain", key: "Kain", minWidth: "130px" },
      num("KURANG", "Kurang"),
      num("J_LUAR", "Cetak Luar", "100px"),
      num("j_P01", "P01 (pcs)"),
      num("j_P02", "P02 (pcs)"),
      num("j_jumlah", "Jml Cetak", "100px"),
      num("m_P01", "Meter P01", "100px"),
      num("m_P02", "Meter P02", "100px"),
      num("m_jumlah", "Jml Meter", "100px"),
    ],
    numericKeys: [
      "PANJANG",
      "LEBAR",
      "Jml_ORDER",
      "J_Meter",
      "KURANG",
      "J_LUAR",
      "j_P01",
      "j_P02",
      "j_jumlah",
      "m_P01",
      "m_P02",
      "m_jumlah",
    ],
    summaryFields: [
      "Jml_ORDER",
      "J_Meter",
      "KURANG",
      "J_LUAR",
      "j_P01",
      "j_P02",
      "j_jumlah",
      "m_P01",
      "m_P02",
      "m_jumlah",
    ],
    searchKeys: ["NOMER_SPK", "SPK_NAMA", "NAMA_ORDER", "PERUSAHAAN"],
  },

  // Delphi: ufrmbrowsemonitorjahit.pas
  jahit: {
    title: "Monitoring Jahit Spanduk",
    icon: "mdi-needle",
    apiPath: "/spanduk/mon-jahit",
    itemValue: "NOMER_SPK",
    showPerusahaan: true,
    headers: LHK_PABRIK_HEADERS(),
    numericKeys: LHK_PABRIK_NUMERIC,
    summaryFields: LHK_PABRIK_SUMMARY,
    searchKeys: ["NOMER_SPK", "SPK_NAMA", "NAMA_ORDER", "PERUSAHAAN"],
  },

  // Delphi: ufrmbrowsemonitorlipat.pas
  lipat: {
    title: "Monitoring Lipat Spanduk",
    icon: "mdi-arrow-collapse-vertical",
    apiPath: "/spanduk/mon-lipat",
    itemValue: "NOMER_SPK",
    showPerusahaan: true,
    headers: LHK_PABRIK_HEADERS(),
    numericKeys: LHK_PABRIK_NUMERIC,
    summaryFields: LHK_PABRIK_SUMMARY,
    searchKeys: ["NOMER_SPK", "SPK_NAMA", "NAMA_ORDER", "PERUSAHAAN"],
  },

  // Delphi: ufrmbrowsemonitorcuiring.pas
  cuiring: {
    title: "Monitoring Cuiring Spanduk",
    icon: "mdi-weather-sunny",
    apiPath: "/spanduk/mon-cuiring",
    itemValue: "NOMER_SPK",
    showPerusahaan: true,
    headers: [
      NO_COL,
      { title: "Hari", key: "hari", minWidth: "80px" },
      { title: "Tanggal", key: "tanggal", minWidth: "100px" },
      { title: "Perusahaan", key: "perusahaan", minWidth: "100px" },
      { title: "Tgl SPK", key: "TANGGAL_SPK", minWidth: "100px" },
      { title: "Deadline", key: "DEADLINE", minWidth: "100px" },
      { title: "Nama SPK", key: "SPK_NAMA", minWidth: "220px" },
      num("PANJANG", "Panjang"),
      num("LEBAR", "Lebar"),
      { title: "Nomor SPK", key: "NOMER_SPK", minWidth: "150px" },
      num("J_ORDER", "Jml Order", "100px"),
      num("j_meter", "J. Meter", "100px"),
      { title: "Kain", key: "KAIN", minWidth: "130px" },
      num("kurang_koli", "Kurang Koli"),
      num("kurang_oven", "Kurang Oven"),
      num("kurang_jemuran", "Kurang Jemuran", "110px"),
      num("kurang_potong", "Kurang Potong"),
      num("KOLI", "Koli"),
      num("OVEN", "Oven"),
      num("JEMURAN", "Jemuran"),
      num("POTONG", "Potong"),
      num("meter_koli", "Meter Koli", "100px"),
      num("meter_oven", "Meter Oven", "100px"),
    ],
    numericKeys: [
      "PANJANG",
      "LEBAR",
      "J_ORDER",
      "j_meter",
      "kurang_koli",
      "kurang_oven",
      "kurang_jemuran",
      "kurang_potong",
      "KOLI",
      "OVEN",
      "JEMURAN",
      "POTONG",
      "meter_koli",
      "meter_oven",
    ],
    summaryFields: ["J_ORDER", "KOLI", "OVEN", "JEMURAN", "POTONG"],
    searchKeys: ["NOMER_SPK", "SPK_NAMA", "perusahaan"],
  },

  // Delphi: ufrmbrowsemonitorplotter.pas
  plotter: {
    title: "Monitoring Plotter Spanduk",
    icon: "mdi-pen",
    apiPath: "/spanduk/mon-plotter",
    itemValue: "nomor_spk",
    showPerusahaan: false,
    headers: [
      NO_COL,
      { title: "Hari", key: "hari", minWidth: "80px" },
      { title: "Tanggal", key: "tanggal", minWidth: "110px" },
      { title: "Nomor SPK", key: "nomor_spk", minWidth: "150px" },
      { title: "Nama SPK", key: "spk_nama", minWidth: "240px" },
      num("panjang", "Panjang"),
      num("lebar", "Lebar"),
      num("j_meter", "J. Meter", "100px"),
      num("j_lembar", "J. Lembar", "100px"),
      num("total_meter", "Total Meter", "110px"),
    ],
    numericKeys: ["panjang", "lebar", "j_meter", "j_lembar", "total_meter"],
    summaryFields: ["j_meter", "j_lembar", "total_meter"],
    searchKeys: ["nomor_spk", "spk_nama"],
  },

  // Delphi: ufrmbrowsemonitorhapusplangkan.pas (hanya pabrik P02)
  hapusPlangkan: {
    title: "Monitoring Hapus Plangkan Spanduk",
    icon: "mdi-delete-sweep",
    apiPath: "/spanduk/mon-hapus-plangkan",
    itemValue: "spk_nomor",
    showPerusahaan: false,
    headers: [
      NO_COL,
      { title: "Hari", key: "hari", minWidth: "80px" },
      { title: "Tanggal", key: "tanggal", minWidth: "110px" },
      { title: "Nama SPK", key: "spk_nama", minWidth: "240px" },
      num("spk_panjang", "Panjang"),
      num("spk_lebar", "Lebar"),
      { title: "Nomor SPK", key: "spk_nomor", minWidth: "150px" },
      num("jplangkan", "Jml Plangkan", "110px"),
      num("ukuran", "Ukuran"),
      num("jumlahmeter", "Jumlah Meter", "110px"),
      num("jmeter", "J. Meter", "100px"),
      num("lhpd_rinso", "Rinso"),
      num("lhpd_porstek", "Porstek"),
      num("lhpd_m46", "M46"),
      num("lhpd_kaporit", "Kaporit"),
      num("lhpd_caustik", "Caustik"),
      { title: "Keterangan", key: "lhpd_keterangan", minWidth: "160px" },
    ],
    numericKeys: [
      "spk_panjang",
      "spk_lebar",
      "jplangkan",
      "ukuran",
      "jumlahmeter",
      "jmeter",
      "lhpd_rinso",
      "lhpd_porstek",
      "lhpd_m46",
      "lhpd_kaporit",
      "lhpd_caustik",
    ],
    summaryFields: ["jumlahmeter", "jmeter"],
    searchKeys: ["spk_nomor", "spk_nama"],
  },

  // Delphi: ufrmbrowsemonitorafdruk.pas (hanya pabrik P02)
  afdruk: {
    title: "Monitoring Afdruk Spanduk",
    icon: "mdi-spray",
    apiPath: "/spanduk/mon-afdruk",
    itemValue: "spk_nomor",
    showPerusahaan: false,
    headers: [
      NO_COL,
      { title: "Hari", key: "hari", minWidth: "80px" },
      { title: "Tanggal", key: "tanggal", minWidth: "110px" },
      { title: "Nama SPK", key: "spk_nama", minWidth: "240px" },
      num("spk_panjang", "Panjang"),
      num("spk_lebar", "Lebar"),
      { title: "Nomor SPK", key: "spk_nomor", minWidth: "150px" },
      num("qty_050", "0.50", "70px"),
      num("qty_100", "1.00", "70px"),
      num("qty_120", "1.20", "70px"),
      num("qty_150", "1.50", "70px"),
      num("qty_180", "1.80", "70px"),
      num("qty_230", "2.30", "70px"),
      num("qty_250", "2.50", "70px"),
      num("qty_280", "2.80", "70px"),
      num("qty_350", "3.50", "70px"),
      num("qty_400", "4.00", "70px"),
      num("qty_450", "4.50", "70px"),
      num("qty_550", "5.50", "70px"),
      num("qty_580", "5.80", "70px"),
      num("qty_650", "6.50", "70px"),
      num("qty_750", "7.50", "70px"),
      num("qty_all", "Jml Plangkan", "110px"),
      num("lad_ulano", "Ulano"),
      num("lad_screen", "Screen"),
      num("lad_lem", "Lem"),
      num("lad_katalis", "Katalis"),
      num("meter_perhari", "Meter/Hari", "110px"),
    ],
    numericKeys: [
      "spk_panjang",
      "spk_lebar",
      "qty_050",
      "qty_100",
      "qty_120",
      "qty_150",
      "qty_180",
      "qty_230",
      "qty_250",
      "qty_280",
      "qty_350",
      "qty_400",
      "qty_450",
      "qty_550",
      "qty_580",
      "qty_650",
      "qty_750",
      "qty_all",
      "lad_ulano",
      "lad_screen",
      "lad_lem",
      "lad_katalis",
      "meter_perhari",
    ],
    summaryFields: ["qty_all"],
    searchKeys: ["spk_nomor", "spk_nama"],
  },
};
