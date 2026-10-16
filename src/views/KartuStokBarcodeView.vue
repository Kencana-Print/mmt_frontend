<template>
  <div class="kartu-container">
    <div class="kartu-header">
      <div class="brand">
        <div class="icon-circle">🧾</div>
        <div>
          <h1>Kartu Stok Barcode</h1>
          <p class="subtitle">
            Riwayat pergerakan satu roll: masuk gudang, mutasi, pemakaian LHK, dan sisa berjalan (meter)
          </p>
        </div>
      </div>
      <div class="search-box">
        <div class="input-wrapper">
          <input
            v-model="scanInput"
            @keyup.enter="fetchHistory"
            ref="barcodeInput"
            placeholder="Scan / ketik barcode..."
            class="input-main"
            autofocus
          />
          <kbd>ENTER</kbd>
        </div>
        <button @click="fetchHistory" class="btn-go" :disabled="isLoading">
          {{ isLoading ? "..." : "Tampilkan" }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error-box">{{ errorMsg }}</div>

    <div v-if="data" class="kartu-body">
      <div class="info-card">
        <div class="info-main">
          <div class="badge-status">BARCODE</div>
          <h2 class="barcode-title">{{ data.info.Barcode }}</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nama Bahan</label>
              <span>{{ data.info.Nama_Bahan || "-" }}</span>
            </div>
            <div class="info-item">
              <label>Kode</label>
              <span>{{ data.info.Kode || "-" }}</span>
            </div>
            <div class="info-item">
              <label>Satuan</label>
              <span>{{ data.info.Satuan || "-" }}</span>
            </div>
            <div class="info-item">
              <label>Sisa Total</label>
              <span class="qty-focus">{{ fmtM(data.saldoTotalM) }} m</span>
            </div>
          </div>
        </div>
        <div class="saldo-list">
          <div class="saldo-title">Sisa per Gudang</div>
          <div
            v-for="s in data.saldoPerGudang"
            :key="s.Gudang"
            class="saldo-row"
          >
            <span class="badge-gdg">{{ s.Gudang }}</span>
            <span class="saldo-val">{{ fmtM(s.SaldoM) }} m</span>
          </div>
          <div v-if="!data.saldoPerGudang.length" class="muted">-</div>
        </div>
      </div>

      <div class="panel">
        <h3>
          Riwayat Pergerakan
          <span class="count-badge">{{ data.moves.length }} baris</span>
        </h3>
        <div class="table-wrap">
          <table class="ledger">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Gudang</th>
                <th>Jenis</th>
                <th>Referensi</th>
                <th>Keterangan</th>
                <th class="tr">Masuk (m)</th>
                <th class="tr">Keluar (m)</th>
                <th class="tr">Sisa (m)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(m, i) in data.moves" :key="i">
                <td class="mono">{{ m.Tanggal }}</td>
                <td>
                  <span class="badge-gdg sm">{{ m.Gudang }}</span>
                  <span class="muted">{{ m.GudangNama }}</span>
                </td>
                <td>{{ m.RefJenis }}</td>
                <td class="mono">{{ m.Referensi }}</td>
                <td>{{ m.Keterangan || "-" }}</td>
                <td class="tr num-in">{{ fmtM(m.MasukM) }}</td>
                <td class="tr num-out">{{ fmtM(m.KeluarM) }}</td>
                <td class="tr fw">{{ fmtM(m.SaldoM) }}</td>
              </tr>
              <tr v-if="!data.moves.length">
                <td colspan="8" class="empty">Tidak ada pergerakan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h3>
          Pemakaian di LHK
          <span class="count-badge">{{ data.lhkUsage.length }} baris</span>
        </h3>
        <p class="hint">
          Informatif saja (tidak menggerakkan saldo kartu). Baru Proof & Mesin
          Cetak yang mencatat barcode roll; Tekstil/Sublim/Finishing merujuk
          bahan/SPK sehingga tak bisa dikaitkan ke roll ini.
        </p>
        <div class="table-wrap">
          <table class="ledger">
            <thead>
              <tr>
                <th>Dokumen LHK</th>
                <th>Jenis</th>
                <th>Tanggal</th>
                <th>SPK</th>
                <th class="tr">Jumlah (m)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(u, i) in data.lhkUsage" :key="i">
                <td class="mono">{{ u.Lhk }}</td>
                <td>{{ u.Jenis }}</td>
                <td class="mono">{{ u.Tanggal }}</td>
                <td class="mono">{{ u.Spk || "-" }}</td>
                <td class="tr">{{ fmtM(u.Jumlah) }}</td>
              </tr>
              <tr v-if="!data.lhkUsage.length">
                <td colspan="5" class="empty">
                  Belum ada pemakaian LHK tercatat untuk barcode ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="!isLoading && !errorMsg" class="empty-detail-state">
      <p>Scan barcode untuk melihat riwayat pergerakannya</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const scanInput = ref("");
const barcodeInput = ref(null);
const isLoading = ref(false);
const errorMsg = ref("");
const data = ref(null);

const fmtM = (v) =>
  v || v === 0 ? Number(v).toLocaleString("id-ID") : "-";

const fetchHistory = async () => {
  const barcode = (scanInput.value || "").trim();
  if (!barcode) return;
  isLoading.value = true;
  errorMsg.value = "";
  try {
    const res = await api.get("/mmt/search-barcode/history", {
      params: { barcode },
    });
    data.value = res.data.data;
  } catch (e) {
    data.value = null;
    errorMsg.value =
      e.response?.data?.message || "Gagal memuat riwayat barcode.";
  } finally {
    isLoading.value = false;
    if (barcodeInput.value) barcodeInput.value.focus();
  }
};

onMounted(() => {
  const q = route.query.barcode || route.query.nomor;
  if (q) {
    scanInput.value = String(q);
    fetchHistory();
  }
});
</script>

<style scoped>
.kartu-container {
  padding: 28px;
  background: #f4f7fb;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
}
.kartu-header {
  background: #fff;
  padding: 22px 26px;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border: 1px solid #e2e8f0;
  margin-bottom: 22px;
  flex-wrap: wrap;
  box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.12);
}
.brand { display: flex; align-items: center; gap: 14px; }
.icon-circle {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
}
.brand h1 { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
.brand .subtitle { font-size: 12.5px; color: #64748b; margin: 2px 0 0; }
.search-box { display: flex; gap: 10px; align-items: center; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-main {
  width: 260px; padding: 12px 44px 12px 14px;
  border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px;
  outline: none;
}
.input-main:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99,102,241,.12); }
.input-wrapper kbd {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9;
  border: 1px solid #e2e8f0; border-bottom-width: 2px; padding: 3px 6px; border-radius: 6px;
}
.btn-go {
  padding: 12px 18px; border-radius: 12px; border: none; cursor: pointer;
  background: #4f46e5; color: #fff; font-weight: 700;
}
.btn-go:disabled { opacity: 0.6; cursor: default; }
.error-box {
  background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
  padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; font-size: 13px;
}
.kartu-body { display: flex; flex-direction: column; gap: 18px; }
.info-card {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #334155 100%);
  color: #fff; padding: 26px; border-radius: 20px;
  display: grid; grid-template-columns: 1.6fr 1fr; gap: 24px;
}
.badge-status {
  display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  background: rgba(255,255,255,.12); padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;
}
.barcode-title { font-size: 22px; margin: 0 0 14px; font-family: monospace; }
.info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.info-item label { display: block; font-size: 10px; opacity: 0.65; margin-bottom: 2px; }
.info-item span { font-size: 14px; font-weight: 600; }
.qty-focus { font-size: 20px !important; color: #fbbf24; }
.saldo-list { background: rgba(255,255,255,.06); border-radius: 14px; padding: 16px; align-self: start; }
.saldo-title { font-size: 11px; font-weight: 800; opacity: 0.7; margin-bottom: 10px; }
.saldo-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; }
.saldo-val { font-weight: 800; font-family: monospace; }
.badge-gdg {
  background: #fbbf24; color: #78350f; padding: 3px 10px;
  border-radius: 6px; font-weight: bold; font-size: 12px;
}
.badge-gdg.sm { font-size: 10px; padding: 2px 8px; }
.muted { color: #94a3b8; font-size: 11px; }
.panel { background: #fff; border-radius: 15px; padding: 20px; border: 1px solid #eef2f7; }
.panel h3 { margin: 0 0 4px; font-size: 15px; color: #0f172a; }
.count-badge {
  background: #3b82f6; color: #fff; padding: 2px 8px;
  border-radius: 5px; font-size: 11px; vertical-align: middle;
}
.hint { font-size: 11.5px; color: #94a3b8; margin: 0 0 12px; }
.table-wrap { overflow-x: auto; }
table.ledger { width: 100%; border-collapse: collapse; font-size: 12.5px; }
table.ledger th {
  text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b;
  padding: 8px 10px; background: #f8fafc; white-space: nowrap;
}
table.ledger td { padding: 8px 10px; border-top: 1px solid #f1f5f9; color: #334155; }
table.ledger .tr { text-align: right; }
table.ledger .mono { font-family: monospace; font-size: 12px; }
table.ledger .fw { font-weight: 800; }
.num-in { color: #15803d; font-weight: 700; }
.num-out { color: #b91c1c; font-weight: 700; }
.empty { text-align: center; color: #94a3b8; padding: 18px; }
.empty-detail-state { text-align: center; color: #94a3b8; padding: 40px; }
</style>
