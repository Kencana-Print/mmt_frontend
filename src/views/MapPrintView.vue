<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const rawData = ref<any>(null);
const isLoading = ref(true);
const isError = ref(false);
const imageLoaded = ref(false);

const printNomor = route.params.nomor as string;
const layoutMode = (route.query.layout as string) || "vertikal";

const getVal = (key: string) => {
  if (!rawData.value) return "";
  const foundKey = Object.keys(rawData.value).find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );
  return foundKey ? rawData.value[foundKey] : "";
};

const resolvedImageUrl = ref("");

const MEDIA_SERVER = "https://manksi.com";
const getBaseUrl = () => api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";

const resolveDesignImage = () => {
  return new Promise<void>((resolve) => {
    if (!rawData.value) {
      resolve();
      return;
    }
    const nomor = getVal("mspk_nomor");
    const referensi = getVal("mspk_referensi");
    const mhNomor = getVal("mspk_mh_nomor");
    const cab = String(getVal("mspk_cab") || "HO-").trim();
    const base = getBaseUrl();

    const rawCandidates: string[] = [];
    const addPath = (subpath: string) => {
      if (!subpath) return;
      const clean = subpath.startsWith("/") ? subpath : `/${subpath}`;
      rawCandidates.push(`${MEDIA_SERVER}${clean}`);
      if (base && base !== MEDIA_SERVER) rawCandidates.push(`${base}${clean}`);
      rawCandidates.push(clean);
    };

    // 0. URL rekomendasi langsung dari backend
    if (rawData.value?.image_url) {
      addPath(rawData.value.image_url);
    }

    // 1. Gambar MAP di folder cabang & VPS lama
    if (nomor) {
      const enc = encodeURIComponent(nomor);
      addPath(`/images/${cab}/map/${enc}.jpg`);
      addPath(`/images/DEFAULT/map/${enc}.jpg`);
      addPath(`/images/map/${enc}.jpg`);
      addPath(`/file-gambar/map/${enc}.jpg`);
      addPath(`/file-gambar/${enc}.jpg`);
      addPath(`/images/${cab}/${enc}.jpg`);
      addPath(`/images/${enc}.jpg`);
    }

    // 2. Gambar MAP Referensi
    if (referensi) {
      const encRef = encodeURIComponent(referensi);
      addPath(`/images/${cab}/map/${encRef}.jpg`);
      addPath(`/images/DEFAULT/map/${encRef}.jpg`);
      addPath(`/images/map/${encRef}.jpg`);
      addPath(`/file-gambar/map/${encRef}.jpg`);
      addPath(`/file-gambar/${encRef}.jpg`);
      addPath(`/file-gambar/mintaharga/${encRef}.jpg`);
      addPath(`/images/${cab}/${encRef}.jpg`);
    }

    // 3. Gambar dari Minta Harga
    if (mhNomor) {
      const encMh = encodeURIComponent(mhNomor);
      addPath(`/file-gambar/mintaharga/${encMh}.jpg`);
      addPath(`/images/${cab}/map/${encMh}.jpg`);
      addPath(`/images/DEFAULT/map/${encMh}.jpg`);
      addPath(`/images/map/${encMh}.jpg`);
      addPath(`/file-gambar/map/${encMh}.jpg`);
      addPath(`/file-gambar/${encMh}.jpg`);
    }

    const candidates = Array.from(new Set(rawCandidates));
    if (candidates.length === 0) {
      resolve();
      return;
    }

    const tryNext = (idx: number) => {
      if (idx >= candidates.length) {
        resolvedImageUrl.value = "";
        resolve();
        return;
      }
      const img = new Image();
      img.onload = async () => {
        try {
          if ("decode" in img) await img.decode();
        } catch (_) {}
        resolvedImageUrl.value = candidates[idx];
        await nextTick();
        resolve();
      };
      img.onerror = () => tryNext(idx + 1);
      img.src = candidates[idx];
    };

    tryNext(0);
  });
};

const handlePrint = () => {
  window.print();
};

onMounted(async () => {
  try {
    const res = await api.get(
      `/mmt/map/${encodeURIComponent(printNomor)}/print`,
    );
    rawData.value = res.data.data;

    await nextTick();
    await resolveDesignImage();

    isLoading.value = false;
    await nextTick();

    const style = document.createElement("style");
    style.textContent = "@page { size: A4 landscape; margin: 10mm; }";
    document.head.appendChild(style);

    setTimeout(() => {
      window.print();
    }, 500);
  } catch (error: any) {
    isError.value = true;
    isLoading.value = false;
  }
});

// Gambar Tanda Tangan
const getSignatureUrl = (kodeUser: string) => {
  if (!kodeUser) return "";
  const cleanName = encodeURIComponent(kodeUser.trim().toUpperCase());
  return `${MEDIA_SERVER}/file-gambar/${cleanName}.jpg`;
};

const tglIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (d.getFullYear() <= 1900) return "";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
</script>

<template>
  <div v-if="isLoading" class="loading-state">Memuat dokumen cetak...</div>

  <div v-else-if="isError" class="error-state">
    Gagal memuat data cetak MAP. Pastikan nomor benar.
  </div>

  <div v-else-if="rawData" class="print-container" :class="[layoutMode]">
    <div class="no-print print-actions">
      <button @click="handlePrint">🖨️ Cetak MAP</button>
    </div>
    <table class="outer-table">
      <tbody>
        <tr>
          <td class="left-panel">
            <h2 class="form-title">MEMO APPROVAL PRODUK</h2>

            <table class="info-table">
              <tr>
                <td class="lbl">Nomor Memo</td>
                <td class="sep">:</td>
                <td class="val">
                  {{ getVal("mspk_nomor") }}
                  <span
                    v-if="
                      getVal('mspk_statuskerja') &&
                      getVal('mspk_statuskerja') !== 'Normal'
                    "
                    class="status-kerja"
                    >{{ getVal("mspk_statuskerja") }}</span
                  >
                </td>
              </tr>
              <tr>
                <td class="lbl">Tanggal</td>
                <td class="sep">:</td>
                <td class="val">
                  {{ tglIndo(getVal("mspk_tanggal")) }}
                  <span style="float: right"
                    >Nomer PO: {{ getVal("mspk_nomor_po") || "-" }}</span
                  >
                </td>
              </tr>
              <tr>
                <td class="lbl">Jenis Order</td>
                <td class="sep">:</td>
                <td class="val">{{ getVal("jo_nama") }}</td>
              </tr>
              <tr>
                <td class="lbl">Nama Desain</td>
                <td class="sep">:</td>
                <td class="val font-weight-bold">{{ getVal("mspk_nama") }}</td>
              </tr>
              <tr>
                <td class="lbl">Jumlah</td>
                <td class="sep">:</td>
                <td class="val">
                  {{
                    new Intl.NumberFormat("id-ID").format(
                      getVal("mspk_jumlah") || 0,
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td class="lbl">Ukuran</td>
                <td class="sep">:</td>
                <td class="val">
                  {{ getVal("mspk_ukuran") || getVal("mspk_rencana_size") }}
                </td>
              </tr>
              <tr>
                <td class="lbl">Gramasi</td>
                <td class="sep">:</td>
                <td class="val">{{ getVal("mspk_gramasi") }}</td>
              </tr>
              <tr>
                <td class="lbl">Kain</td>
                <td class="sep">:</td>
                <td class="val">{{ getVal("mspk_kain") }}</td>
              </tr>
              <tr>
                <td class="lbl">Finishing</td>
                <td class="sep">:</td>
                <td class="val">{{ getVal("mspk_finishing") }}</td>
              </tr>
              <tr>
                <td class="lbl">Date Line</td>
                <td class="sep">:</td>
                <td class="val">{{ tglIndo(getVal("mspk_dateline")) }}</td>
              </tr>
              <tr>
                <td class="lbl">Rencana Order</td>
                <td class="sep">:</td>
                <td class="val">
                  {{
                    new Intl.NumberFormat("id-ID").format(
                      getVal("mspk_rencana_order") || 0,
                    )
                  }}
                </td>
              </tr>
              <tr>
                <td class="lbl">Workshop</td>
                <td class="sep">:</td>
                <td class="val">
                  {{ getVal("mspk_cab") }} ( {{ getVal("mspk_workshop") }} )
                </td>
              </tr>
              <tr v-if="getVal('cus_perfect') === 'Y'">
                <td class="lbl">Status client</td>
                <td class="sep">:</td>
                <td class="val">
                  <span class="highlight-yellow">PERFECT</span>
                </td>
              </tr>
            </table>

            <div v-if="layoutMode === 'vertikal'" class="bottom-left-content">
              <div class="image-area">
                <img
                  v-if="resolvedImageUrl"
                  :src="resolvedImageUrl"
                  alt="Desain MAP"
                />
                <div v-else class="no-image-placeholder">
                  (Tidak ada gambar desain)
                </div>
              </div>
              <div class="details-area">
                <div v-if="getVal('ketkomponen')" class="komponen-box">
                  <div class="box-title">Keterangan Komponen :</div>
                  <pre>{{ getVal("ketkomponen") }}</pre>
                </div>
                <div v-if="getVal('size_detail')" class="size-box mt-2">
                  <div class="box-title">Size : LEBAR & PANJANG BADAN</div>
                  <pre>{{ getVal("size_detail") }}</pre>
                </div>
              </div>
            </div>

            <div v-if="layoutMode === 'horizontal'" class="horizontal-details">
              <div v-if="getVal('ketkomponen')" class="komponen-box w-50">
                <div class="box-title">Keterangan Komponen :</div>
                <pre>{{ getVal("ketkomponen") }}</pre>
              </div>
              <div v-if="getVal('size_detail')" class="size-box w-50 pl-2">
                <div class="box-title">Size : LEBAR & PANJANG BADAN</div>
                <pre>{{ getVal("size_detail") }}</pre>
              </div>
            </div>

            <div :class="layoutMode === 'horizontal' ? 'ttd-with-image' : ''">
              <img
                v-if="layoutMode === 'horizontal' && resolvedImageUrl"
                :src="resolvedImageUrl"
                alt=""
                class="img-horizontal-inline"
              />
              <table class="ttd-table">
                <tr>
                  <td class="ttd-box">
                    <div class="ttd-title">MO</div>
                    <img
                      :src="getSignatureUrl(getVal('user_create'))"
                      class="ttd-img"
                      @error="
                        (e) =>
                          ((e.target as HTMLImageElement).style.opacity = '0')
                      "
                    />
                    <div class="ttd-name">
                      {{ getVal("user_nama") || getVal("user_create") }}
                    </div>
                  </td>
                  <td class="ttd-box">
                    <div class="ttd-title">CMO</div>
                    <img
                      :src="getSignatureUrl(getVal('mspk_cmo'))"
                      class="ttd-img"
                      @error="
                        (e) =>
                          ((e.target as HTMLImageElement).style.opacity = '0')
                      "
                    />
                    <div class="ttd-name">{{ getVal("mspk_cmo") || "-" }}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" class="ttd-footer">
                    Dibuat Oleh:
                    {{ getVal("user_nama") || getVal("user_create") }}
                    {{
                      getVal("created_formatted")
                        ? getVal("created_formatted").substring(0, 11)
                        : ""
                    }}
                  </td>
                </tr>
              </table>
            </div>

            <div class="footer-note">
              Note : SETIAP MEMO WAJIB MEMBUAT 2 ALTERNATIF<br />PRINTING DALAM
              POTONGAN KAIN.
            </div>
          </td>

          <td class="right-panel">
            <div class="catatan-wrap">
              <div class="lbl">Catatan :</div>
              <div class="val">
                <!-- <span v-if="getVal('mspk_referensi')" class="font-weight-bold">
                  Memo {{ getVal("mspk_referensi") }} = PERMAK SAJA tidak usah
                  buat BARU !!<br />
                  <template v-if="getVal('mspk_revisi_note')">
                    {{ getVal("mspk_revisi_note") }}<br />
                  </template>
                  <br />
                </span> -->
                <pre class="catatan-text">{{ getVal("mspk_keterangan") }}</pre>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.print-actions {
  text-align: right;
  padding: 10px 15px;
  background-color: #f5f5f5;
  margin-bottom: 10px;
}
.print-actions button {
  padding: 8px 16px;
  font-size: 10px; /* Mengikuti ukuran font MAP */
  font-weight: bold;
  cursor: pointer;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
}
.print-actions button:hover {
  background-color: #1565c0;
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: Arial, sans-serif;
  font-size: 16px;
}
.error-state {
  color: red;
}

.print-container {
  width: 100%;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  font-size: 11px;
  color: #000;
  background: #fff;
  padding: 10px;
  box-sizing: border-box;
}

.print-container.vertikal,
.print-container.horizontal {
  max-width: 297mm;
}

.outer-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #000;
}

.outer-table > tbody > tr > td {
  border: 1px solid #000;
  vertical-align: top;
  padding: 8px;
}

.left-panel {
  width: 50%;
}
.right-panel {
  width: 50%;
}

.form-title {
  text-decoration: underline;
  font-size: 13px;
  font-weight: bold;
  margin: 0 0 12px 0;
  text-transform: uppercase;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;
  margin-bottom: 12px;
}
.info-table td {
  padding: 3px 0;
  vertical-align: top;
}
.info-table .lbl {
  width: 90px;
}
.info-table .sep {
  width: 10px;
  text-align: center;
}

.font-weight-bold {
  font-weight: bold;
}
.status-kerja {
  color: red;
  font-weight: bold;
  margin-left: 10px;
  text-transform: uppercase;
}
.highlight-yellow {
  background-color: yellow;
  padding: 2px 4px;
  font-weight: bold;
  border: 1px solid #000;
}

.bottom-left-content {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.image-area {
  width: 210px;
  max-height: 170px;
  flex-shrink: 0;
  overflow: hidden;
}
.image-area img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.no-image-placeholder {
  width: 100%;
  height: 100%;
  min-height: 140px;
  border: 1px dashed #777;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #777;
  font-style: italic;
  text-align: center;
  box-sizing: border-box;
}
.details-area {
  flex: 1;
  font-size: 9px;
  line-height: 1.3;
}

.horizontal-details {
  display: flex;
  font-size: 9px;
  line-height: 1.3;
  margin-bottom: 10px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 10px;
}
.w-50 {
  width: 50%;
}
.pl-2 {
  padding-left: 8px;
}

.ttd-with-image {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}
.img-horizontal-inline {
  max-width: 220px;
  max-height: 220px;
  object-fit: contain;
  flex-shrink: 0;
}

pre {
  font-family: inherit;
  font-size: 9px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 2px 0 0 0;
  line-height: 1.2;
}
.box-title {
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 3px;
  font-size: 9px;
}
.mt-2 {
  margin-top: 8px;
}

.ttd-table {
  width: 180px;
  border-collapse: collapse;
  text-align: center;
  margin-left: auto;
  border: 1px solid #000;
  margin-bottom: 10px;
}
.ttd-box {
  border: 1px solid #000;
  width: 50%;
  padding: 2px;
}
.ttd-img {
  height: 40px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.ttd-title,
.ttd-name {
  font-size: 10px;
  font-weight: bold;
}
.ttd-footer {
  font-size: 9px;
  text-align: left;
  padding: 2px 4px;
  border-top: 1px solid #000;
}

.footer-note {
  font-size: 9px;
  font-weight: bold;
  margin-top: 5px;
  font-style: italic;
}

.catatan-wrap {
  display: flex;
  font-size: 10px;
  line-height: 1.4;
}
.catatan-wrap .lbl {
  width: 55px;
  font-weight: bold;
}
.catatan-wrap .val {
  flex: 1;
}
.catatan-text {
  font-family: inherit;
  font-size: 10px;
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.4;
}
</style>

<style>
/* @page dikontrol via JS di onMounted — tidak ada di sini */

/* Wajib di style GLOBAL (non-scoped) — target "body" gak akan match
   kalau ditaruh di style scoped, karena <body> ada di luar template
   komponen ini sehingga tidak dapat atribut data-scoped Vue. */
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print {
    display: none !important;
  }
}
</style>
