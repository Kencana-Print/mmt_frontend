<template>
  <div class="check-stok-container">
    <div class="header-search">
      <div class="brand">
        <div class="icon-circle">📦</div>
        <div>
          <h1>Cek Detail Stok</h1>
          <p class="subtitle">
            Scan barcode atau ketik nama/kode barang untuk filter instan
          </p>
        </div>
      </div>

      <div class="search-box">
        <div class="filter-group">
          <select
            v-model="selectedGdg"
            @change="fetchInventoryList"
            class="select-modern gdg-select"
          >
            <option value="">Semua Gudang</option>
            <option value="WH-16">WH-16 (Utama)</option>
            <option value="GPM">GPM (Bahan)</option>
          </select>
        </div>

        <div class="filter-group autocomplete-wrapper">
          <div class="input-with-icon">
            <span class="input-icon">🔍</span>
            <input
              v-model="brgSearchInput"
              @focus="showSuggestions = true"
              @blur="handleBrgBlur"
              placeholder="Cari Kode / Nama Barang..."
              class="input-modern"
            />
            <button v-if="brgSearchInput" @click="clearBrgSearch" class="clear-icon" tabindex="-1">×</button>
          </div>
          <div v-if="showSuggestions && filteredSuggestions.length" class="suggestions-dropdown">
            <div
              v-for="item in filteredSuggestions"
              :key="item"
              @mousedown.prevent="selectBrgSuggestion(item)"
              class="suggestion-item"
            >
              <span class="sug-code">{{ item.split(' - ')[0] }}</span>
              <span class="sug-name">{{ item.split(' - ').slice(1).join(' - ') || item }}</span>
            </div>
          </div>
        </div>

        <div class="input-wrapper">
          <input
            v-model="scanInput"
            @keyup.enter="handleCheck"
            ref="barcodeInput"
            placeholder="Scan Barcode..."
            class="input-main"
            autofocus
          />
          <kbd>ENTER</kbd>
        </div>
        <button @click="clearDisplay" class="btn-clear">Refresh</button>
      </div>
    </div>

    <div class="content-layout">
      <div class="detail-panel">
        <div v-if="lastScanned" class="card-highlight animate-pop">
          <div class="badge-status">HASIL SCAN TERAKHIR</div>
          <h2 class="barcode-title">{{ lastScanned.Barcode }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nama Barang</label>
              <span>{{ lastScanned.Nama_Bahan }}</span>
            </div>
            <div class="info-item">
              <label>Kode Item</label>
              <span>{{ lastScanned.Kode }}</span>
            </div>
            <div class="info-item">
              <label>Stok Sistem</label>
              <span class="qty-focus">{{ lastScanned.Stok_Sistem }} m</span>
            </div>
            <div class="info-item">
              <label>Gudang</label>
              <span class="badge-gdg">{{ lastScanned.Gudang }}</span>
            </div>
          </div>
          <button
            class="btn-history"
            @click="router.push({ name: 'KartuStokBarcode', query: { barcode: lastScanned.Barcode } })"
          >
            Riwayat Pergerakan →
          </button>
        </div>
        <div v-else class="empty-detail-state">
          <p>Scan barcode untuk melihat detail instan di sini</p>
        </div>

        <button
          v-if="scannedBarcodes.size > 0"
          @click="resetAllScans"
          class="btn-reset-all"
        >
          Reset Status Scan (Mulai Ulang)
        </button>
      </div>

      <div class="history-panel">
        <div class="panel-header">
          <h3>
            Daftar Inventaris
            <span class="count-badge">{{ filteredList.length }} Barcode</span>
          </h3>
          <div class="search-list-wrapper">
            <input
              v-model="listSearchQuery"
              placeholder="Cari di list..."
              class="input-mini-search"
            />
          </div>
        </div>

        <div class="list-container">
          <div class="table-header">
            <span class="th-status">Status</span>
            <span class="th-barcode">Barcode</span>
            <span class="th-name">Nama Barang</span>
            <span class="th-qty text-right">Stok</span>
          </div>

          <div
              v-for="item in displayedList"
              :key="item.Barcode"
              class="history-card"
              :class="{
                'is-active': lastScanned?.Barcode === item.Barcode,
                'is-scanned': scannedBarcodes.has(item.Barcode),
              }"
            >
              <div class="card-status">
                <span
                  v-if="scannedBarcodes.has(item.Barcode)"
                  class="check-mark"
                  >✅</span
                >
                <span v-else class="pending-mark">⭕</span>
              </div>
              <div class="card-left">
                <span class="history-barcode">{{ item.Barcode }}</span>
                <span class="history-name">
                  <small class="txt-gdg">[{{ item.Gudang }}]</small>
                  {{ item.Kode }} - {{ item.Nama_Bahan }}
                </span>
              </div>
              <div class="card-right">
                <div class="stok-tag">{{ item.Stok_Sistem }} m</div>
              </div>
            </div>

          <div v-if="filteredList.length === 0" class="empty-state">
            <p>Tidak ada data ditemukan.</p>
          </div>
          <div v-if="displayedList.length < filteredList.length" class="load-more-wrap">
            <span class="load-more-info">Menampilkan {{ displayedList.length }} dari {{ filteredList.length }} barcode</span>
            <button @click="loadMore" class="btn-load-more">Muat 100 lagi</button>
          </div>
          <div v-else-if="filteredList.length > 100" class="load-more-info text-center">Menampilkan semua {{ filteredList.length }} barcode</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";

const router = useRouter();

const API_URL = "/mmt/search-barcode";
const scanInput = ref("");
const listSearchQuery = ref("");
const selectedBrgKode = ref(""); // tetap untuk kompatibilitas API, tapi tidak dipakai langsung oleh UI
const selectedGdg = ref("");
const brgSearchInput = ref("");
const showSuggestions = ref(false);
const lastScanned = ref(null);
const fullInventory = ref([]);
const barcodeInput = ref(null);
const debouncedBrgSearch = ref("");
const debouncedListQuery = ref("");
const displayLimit = ref(100);
let brgTimer = null;
let listTimer = null;
watch(brgSearchInput, (v) => { clearTimeout(brgTimer); brgTimer = setTimeout(()=> debouncedBrgSearch.value = v, 250); });
watch(listSearchQuery, (v) => { clearTimeout(listTimer); listTimer = setTimeout(()=> debouncedListQuery.value = v, 250); });

// Simpan daftar barcode yang sudah di-scan (Set agar unik)
const scannedBarcodes = ref(new Set());

const uniqueBrgOptions = computed(() => {
  const map = new Map();
  fullInventory.value.forEach((i) => {
    const key = `${i.Kode} - ${i.Nama_Bahan}`;
    if (!map.has(key)) map.set(key, key);
  });
  return [...map.values()].sort((a,b)=>a.localeCompare(b));
});

const filteredSuggestions = computed(() => {
  const q = debouncedBrgSearch.value.trim().toLowerCase();
  if (!q) return uniqueBrgOptions.value.slice(0, 8);
  const matched = new Set();
  const res = [];
  // batasi scan 800 item pertama untuk sugesti agar tidak freeze
  const scanLimit = Math.min(fullInventory.value.length, 800);
  for (let i=0;i<scanLimit;i++) {
    const item = fullInventory.value[i];
    const hay = `${item.Kode ?? ""} ${item.Nama_Bahan ?? ""} ${item.Barcode ?? ""} ${item.Gudang ?? ""}`.toLowerCase();
    if (hay.includes(q)) {
      const key = `${item.Kode ?? "-"} - ${item.Nama_Bahan ?? ""}`.trim();
      if (!matched.has(key)) {
        matched.add(key);
        res.push(key);
        if (res.length >= 8) break;
      }
    }
  }
  if (res.length > 0) return res;
  return uniqueBrgOptions.value.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
});

const uniqueBrgCodes = computed(() => {
  const codes = fullInventory.value.map((i) => i.Kode);
  return [...new Set(codes)].sort();
});

const filteredList = computed(() => {
  const q = debouncedListQuery.value.trim().toLowerCase();
  const bq = debouncedBrgSearch.value.trim().toLowerCase();
  // jika tidak ada filter, jangan scan semua dengan includes — langsung return
  if (!q && !bq) return fullInventory.value;
  return fullInventory.value.filter((item) => {
    if (q) {
      const hayList = `${item.Barcode ?? ""} ${item.Nama_Bahan ?? ""} ${item.Kode ?? ""} ${item.Gudang ?? ""}`.toLowerCase();
      if (!hayList.includes(q)) return false;
    }
    if (bq) {
      const hayBrg = `${item.Kode ?? ""} ${item.Nama_Bahan ?? ""} ${item.Barcode ?? ""} ${item.Gudang ?? ""} ${String(item.Stok_Sistem ?? "")}`.toLowerCase();
      if (!hayBrg.includes(bq)) return false;
    }
    return true;
  });
});
const displayedList = computed(() => filteredList.value.slice(0, displayLimit.value));
watch(filteredList, () => { displayLimit.value = 100; });
const loadMore = () => { displayLimit.value += 100; };

const handleBrgBlur = () => { setTimeout(()=> showSuggestions.value=false, 150); };
const selectBrgSuggestion = (val) => {
  brgSearchInput.value = val.split(' - ')[0]; // ambil Kode saja agar filter tetap ringan, tapi tampil full
  // jika ingin filter by Kode saja:
  const kode = val.split(' - ')[0];
  brgSearchInput.value = kode;
  showSuggestions.value = false;
};
const clearBrgSearch = () => { brgSearchInput.value=""; showSuggestions.value=false; };
const handleBrgSearchInput = () => { showSuggestions.value = true; };

const fetchInventoryList = async () => {
  try {
    const res = await api.get(`${API_URL}/list`, {
      params: {
        brg_kode: "", // load semua, filter dilakukan client-side via brgSearchInput
        gdg_kode: selectedGdg.value,
      },
    });
    fullInventory.value = res.data.data;
  } catch (e) {
    console.error("Gagal memuat list", e);
  }
};

const handleCheck = async () => {
  if (!scanInput.value) return;
  const barcode = scanInput.value.trim();

  try {
    const res = await api.get(`${API_URL}/quick-check`, {
      params: { barcode: barcode },
    });

    if (res.data.success) {
      lastScanned.value = res.data.data;

      // TAMBAHKAN: Masukkan ke daftar barcode yang sudah di-scan
      scannedBarcodes.value.add(barcode);

      const itemExists = fullInventory.value.find((i) => i.Barcode === barcode);
      if (!itemExists) {
        selectedBrgKode.value = "";
        selectedGdg.value = "";
        await fetchInventoryList();
      }
    }
  } catch (e) {
    alert(e.response?.data?.message || "Barcode tidak ditemukan");
  } finally {
    scanInput.value = "";
    if (barcodeInput.value) barcodeInput.value.focus();
  }
};

// Tombol Reset Status (BARU)
const resetAllScans = () => {
  if (confirm("Reset semua tanda scan? Riwayat centang akan hilang.")) {
    scannedBarcodes.value.clear();
    lastScanned.value = null;
  }
};

const clearDisplay = () => {
  selectedBrgKode.value = "";
  brgSearchInput.value = "";
  selectedGdg.value = "";
  listSearchQuery.value = "";
  lastScanned.value = null;
  showSuggestions.value = false;
  fetchInventoryList();
};

onMounted(() => {
  fetchInventoryList();
});
</script>

<style scoped>
/* ==========================================================================
   1. Container & Layout Utama — lebih premium, gradient halus
   ========================================================================== */
.check-stok-container {
  padding: 28px;
  background: radial-gradient(1200px 600px at 10% -10%, #e0f2fe 0%, transparent 60%),
              radial-gradient(900px 500px at 95% 0%, #fef9c3 0%, transparent 55%),
              #f4f7fb;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
}

.content-layout {
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  gap: 22px;
}

/* ==========================================================================
   2. Header & Search Area — glass + gradient, lebih menarik
   ========================================================================== */
.header-search {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 22px 26px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  box-shadow: 0 10px 30px -12px rgba(15,23,42,0.12), 0 4px 12px -4px rgba(15,23,42,0.08);
  border: 1px solid #e2e8f0;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.brand { display:flex; align-items:center; gap:14px; }
.icon-circle {
  width:52px; height:52px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  font-size:22px; background: linear-gradient(135deg,#0ea5e9 0%, #6366f1 100%);
  color:white; box-shadow: 0 8px 16px -8px rgba(99,102,241,0.5);
}
.brand h1 { font-size:18px; font-weight:800; color:#0f172a; margin:0; letter-spacing:-0.02em; }
.brand .subtitle { font-size:12.5px; color:#64748b; margin:2px 0 0; }

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.select-modern {
  padding: 11px 14px;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  font-weight: 600;
  color: #334155;
  outline: none;
  min-width: 150px;
  transition: all .2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.select-modern:focus { border-color:#38bdf8; box-shadow: 0 0 0 4px rgba(56,189,248,.15); }

.gdg-select {
  border-color: #10b981 !important;
  color: #047857 !important;
  background: #f0fdf4 !important;
}

.input-main {
  width: 260px;
  padding: 12px 44px 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: all .2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.input-main:focus { border-color:#6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,.12); }
.input-wrapper { position:relative; display:flex; align-items:center; }
.input-wrapper kbd {
  position:absolute; right:10px; top:50%; transform:translateY(-50%);
  font-size:10px; font-weight:700; color:#64748b; background:#f1f5f9;
  border:1px solid #e2e8f0; border-bottom-width:2px; padding:3px 6px; border-radius:6px;
}

/* Autocomplete barang — search by item */
.autocomplete-wrapper { position:relative; min-width: 280px; }
.input-with-icon { position:relative; display:flex; align-items:center; }
.input-icon { position:absolute; left:12px; font-size:14px; pointer-events:none; opacity:.7; }
.input-modern {
  width:100%; padding:11px 36px 11px 36px;
  border:1.5px solid #e2e8f0; border-radius:12px; font-size:13.5px;
  background:white; outline:none; font-weight:500; color:#1e293b;
  transition: all .2s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.input-modern:focus { border-color:#f59e0b; box-shadow: 0 0 0 4px rgba(245,158,11,.12); }
.input-modern::placeholder { color:#94a3b8; }
.clear-icon {
  position:absolute; right:10px; background:#f1f5f9; border:1px solid #e2e8f0;
  width:22px; height:22px; border-radius:999px; display:flex; align-items:center; justify-content:center;
  font-size:14px; line-height:1; color:#64748b; cursor:pointer;
}
.clear-icon:hover { background:#e2e8f0; }
.suggestions-dropdown {
  position:absolute; top:calc(100% + 6px); left:0; right:0;
  background:white; border:1px solid #e2e8f0; border-radius:12px;
  box-shadow: 0 16px 30px -12px rgba(15,23,42,.18); overflow:hidden; z-index:30;
  max-height: 260px; overflow-y:auto;
}
.suggestion-item {
  padding:10px 12px; display:flex; gap:8px; align-items:center;
  font-size:13px; color:#334155; cursor:pointer; border-bottom:1px solid #f1f5f9;
}
.suggestion-item:last-child { border-bottom:none; }
.suggestion-item:hover { background:#fffbeb; }
.sug-code { font-weight:800; color:#0f172a; font-size:12px; background:#f1f5f9; padding:2px 6px; border-radius:6px; white-space:nowrap; }
.sug-name { color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* ==========================================================================
   3. Table / List Styling (PENYEBAB TIDAK RAPI)
   ========================================================================== */
.history-panel {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Base struktur untuk Header dan Row agar sejajar lurus */
.table-header,
.history-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
}

.table-header {
  background: #f8fafc;
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  border-radius: 8px;
  margin-bottom: 5px;
}

/* Kolom Status (Icon Bulat) - Dibuat Fixed Width */
.th-status,
.card-status {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

/* Kolom Barcode & Name - Dibuat Flexible */
.th-barcode,
.card-left {
  flex: 1; /* Mengambil sisa ruang */
  display: flex;
  flex-direction: column;
  min-width: 0; /* Mencegah overflow */
}

/* Kolom Qty / Stok - Dibuat Fixed Width */
.th-qty,
.card-right {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

/* Row Styling — lebih premium, hover lift */
.history-card {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  margin-bottom: 8px;
  background: white;
  transition: all .18s ease;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
}
.history-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px -10px rgba(15,23,42,.12);
  border-color:#e2e8f0;
}

.history-card.is-active {
  background: linear-gradient(135deg,#eff6ff 0%, #f8fafc 100%);
  border-color:#bfdbfe;
  border-left: 4px solid #3b82f6;
  box-shadow: 0 8px 18px -12px rgba(59,130,246,.35);
}

.history-card.is-scanned {
  background: linear-gradient(135deg,#f0fdf4 0%, #ffffff 100%);
  border-color:#bbf7d0;
  border-left: 4px solid #10b981;
}

/* Text Styling di dalam list */
.history-barcode {
  font-family: monospace;
  font-weight: bold;
  color: #1e293b;
  font-size: 14px;
}

.history-name {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.txt-gdg {
  color: #10b981;
  font-weight: bold;
  font-size: 10px;
  margin-left: 4px;
}

.stok-tag {
  background: #dcfce7;
  color: #15803d;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 13px;
  min-width: 65px;
  text-align: center;
}

/* ==========================================================================
   4. Detail Panel (Highlight) — lebih menarik, glow + stats
   ========================================================================== */
.card-highlight {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #334155 100%);
  color: white;
  padding: 26px;
  border-radius: 20px;
  box-shadow: 0 16px 30px -16px rgba(15,23,42,.35), 0 8px 16px -10px rgba(15,23,42,.2);
  position: sticky;
  top: 20px;
  border: 1px solid rgba(255,255,255,.08);
  overflow:hidden;
}
.card-highlight::before{
  content:""; position:absolute; inset:-1px; border-radius:20px; padding:1px;
  background: linear-gradient(135deg, rgba(56,189,248,.35), rgba(99,102,241,.25), transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
}

.badge-gdg {
  background: #fbbf24;
  color: #78350f;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

/* ==========================================================================
   5. Buttons & Utilities
   ========================================================================== */
.btn-reset-all {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}
.btn-reset-all:hover {
  opacity: 0.9;
}

.btn-history {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}
.btn-history:hover { opacity: 0.9; }

.btn-clear {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #475569;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
}
.load-more-wrap {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 4px; margin-top:8px; border-top:1px dashed #e2e8f0;
}
.load-more-info { font-size:12px; color:#64748b; }
.btn-load-more {
  background:white; border:1px solid #e2e8f0; padding:6px 12px; border-radius:8px;
  font-size:12px; font-weight:600; color:#334155; cursor:pointer;
}
.btn-load-more:hover { background:#f8fafc; border-color:#cbd5e1; }
.list-container { max-height: 62vh; overflow-y:auto; padding-right:4px; }

/* Animations */
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
