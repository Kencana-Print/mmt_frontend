<template>
  <div
    class="dashboard-shell min-h-screen p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800"
  >
    <!-- TOP APP BAR -->
    <header class="mx-auto mb-6 max-w-[1440px]">
      <div
        class="flex flex-col gap-4 rounded-3xl bg-white/90 p-5 shadow-xs backdrop-blur-md ring-1 ring-slate-200/70 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20"
          >
            <i class="mdi mdi-factory text-2xl"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1
                class="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
              >
                Production & Waste Operations
              </h1>
              <span
                class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                LIVE
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Monitoring Realisasi SPK, Arus Bahan Baku, Efisiensi Waste, &
              Komitmen Pengiriman
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto">
          <div class="text-right hidden sm:block">
            <div
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Sinkronisasi Terakhir
            </div>
            <div class="font-mono text-xs font-semibold text-slate-700">
              {{ lastUpdate }} WIB
            </div>
          </div>
          <button
            @click="refreshAllData"
            :disabled="isLoading"
            class="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-95 disabled:pointer-events-none disabled:opacity-50 transition-all duration-200"
          >
            <i
              :class="[
                'mdi mdi-refresh text-base leading-none text-sky-400',
                { 'animate-spin': isLoading },
              ]"
            ></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ROW 1: 4 TOP KPI CARDS -->
    <section
      class="mx-auto mb-6 grid max-w-[1440px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <!-- 1. Total Stock -->
      <div
        class="relative overflow-hidden rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200/70"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >Total Stock Roll</span
          >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600"
          >
            <i class="mdi mdi-archive-outline text-lg"></i>
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="font-mono text-3xl font-black tracking-tight text-slate-900"
            >{{ stats.totalStock }}</span
          >
          <span class="text-xs font-medium text-slate-400">Roll Terdaftar</span>
        </div>
        <div
          class="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100"
        >
          <span>Kapasitas Gudang</span>
          <span class="font-semibold text-sky-600">Aktif & Siap Pakai</span>
        </div>
      </div>

      <!-- 2. Kasus BS -->
      <div
        class="relative overflow-hidden rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200/70"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >Insiden Afal / BS</span
          >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600"
          >
            <i class="mdi mdi-alert-circle-outline text-lg"></i>
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="font-mono text-3xl font-black tracking-tight text-slate-900"
            >{{ stats.totalKasusBs }}</span
          >
          <span class="text-xs font-medium text-slate-400">Kasus Tercatat</span>
        </div>
        <div
          class="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100"
        >
          <span>Periode Cetak</span>
          <span class="font-semibold text-amber-600">Bulan Berjalan</span>
        </div>
      </div>

      <!-- 3. Panjang Sisa BS -->
      <div
        class="relative overflow-hidden rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200/70"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >Panjang Sisa BS</span
          >
          <div
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"
          >
            <i class="mdi mdi-ruler text-lg"></i>
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="font-mono text-3xl font-black tracking-tight text-slate-900"
            >{{ formatNumber(stats.totalPanjangBs, 2) }}</span
          >
          <span class="text-xs font-medium text-slate-400">Meter Lari</span>
        </div>
        <div
          class="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100"
        >
          <span>Akumulasi Bahan</span>
          <span class="font-semibold text-indigo-600">Reject Mesin</span>
        </div>
      </div>

      <!-- 4. Total Luas Waste M2 -->
      <div
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-rose-50/40 p-5 shadow-xs ring-1 ring-rose-200/80"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-rose-500 uppercase tracking-wider"
            >Luas Waste M²</span
          >
          <span
            :class="[
              bsGrowth >= 0
                ? 'bg-rose-100/70 text-rose-700'
                : 'bg-emerald-100/70 text-emerald-700',
              'rounded-full px-2 py-0.5 text-[10px] font-bold font-mono',
            ]"
          >
            {{ bsGrowth >= 0 ? "+" : "" }}{{ bsGrowth }}% MoM
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="font-mono text-3xl font-black tracking-tight text-rose-600"
            >{{ formatNumber(stats.totalLuasBsM2, 2) }}</span
          >
          <span class="text-xs font-medium text-slate-400">M² Terbuang</span>
        </div>
        <div
          class="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-rose-100"
        >
          <span>Rata-rata/Bulan</span>
          <span class="font-mono font-bold text-slate-700"
            >{{ formatNumber(avgMonthlyBs, 2) }} M²</span
          >
        </div>
      </div>
    </section>

    <!-- ROW 2: SPK MONITORING OVERVIEW BANNER -->
    <section class="mx-auto mb-6 max-w-[1440px]">
      <div class="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4"
        >
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-slate-900">
                Status Deadline SPK Berjalan (P05)
              </h2>
              <span
                class="rounded-lg bg-sky-50 px-2 py-0.5 font-mono text-xs font-bold text-sky-700"
              >
                {{ formatNumber(spkAktif.total, 0) }} Dokumen Aktif
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Pemantauan progres jatuh tempo produksi untuk mencegah
              keterlambatan order
            </p>
          </div>

          <div
            v-if="spkAktif.tunggakanLama > 0"
            class="flex items-center gap-2 rounded-2xl bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20"
          >
            <i class="mdi mdi-alert-circle text-amber-600"></i>
            <span
              >{{ formatNumber(spkAktif.tunggakanLama, 0) }} SPK >90 hari butuh
              evaluasi closing</span
            >
          </div>
          <div
            v-if="spkAktif.selesaiFisik > 0"
            title="Sudah ada LHK produksi dan SJ pengiriman, tapi flag close masih terbuka"
            class="flex items-center gap-2 rounded-2xl bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
          >
            <i class="mdi mdi-check-decagram text-emerald-600"></i>
            <span
              >{{ formatNumber(spkAktif.selesaiFisik, 0) }} selesai fisik (flag
              belum close)</span
            >
          </div>
        </div>

        <!-- Mini Metric Boxes -->
        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div
            class="rounded-2xl bg-slate-50/80 p-3.5 text-center ring-1 ring-slate-200/60"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
              >Total Berjalan</span
            >
            <div class="mt-1 font-mono text-xl font-bold text-slate-800">
              {{ formatNumber(spkAktif.total, 0) }}
            </div>
          </div>
          <div
            class="rounded-2xl bg-rose-50/60 p-3.5 text-center ring-1 ring-rose-200/70"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-rose-600"
              >Lewat Dateline</span
            >
            <div class="mt-1 font-mono text-xl font-bold text-rose-600">
              {{ formatNumber(spkAktif.lewat, 0) }}
            </div>
          </div>
          <div
            class="rounded-2xl bg-amber-50/60 p-3.5 text-center ring-1 ring-amber-200/70"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-amber-600"
              >Mendesak (&le;90 Hari)</span
            >
            <div class="mt-1 font-mono text-xl font-bold text-amber-600">
              {{ formatNumber(spkAktif.lewatMendesak, 0) }}
            </div>
          </div>
          <div
            class="rounded-2xl bg-sky-50/60 p-3.5 text-center ring-1 ring-sky-200/70"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-sky-600"
              >Sisa Waktu &le; H-7</span
            >
            <div class="mt-1 font-mono text-xl font-bold text-sky-700">
              {{ formatNumber(spkAktif.segera, 0) }}
            </div>
          </div>
          <div
            class="rounded-2xl bg-emerald-50/60 p-3.5 text-center ring-1 ring-emerald-200/70"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-emerald-600"
              >Deadline Hari Ini</span
            >
            <div class="mt-1 font-mono text-xl font-bold text-emerald-700">
              {{ formatNumber(spkAktif.hariIni, 0) }}
            </div>
          </div>
        </div>

        <!-- Table antrean (P05) -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-600"
              >Daftar Antrean Paling Mendesak</span
            >
            <span class="text-[11px] text-slate-400"
              >Diurutkan berdasarkan sisa waktu</span
            >
          </div>
          <div class="overflow-hidden rounded-2xl border border-slate-200/70">
            <table class="w-full text-left text-xs">
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
              >
                <tr>
                  <th class="py-2.5 px-3">Nomor SPK</th>
                  <th class="py-2.5 px-3">Nama Produk</th>
                  <th class="py-2.5 px-2 text-center">Cabang</th>
                  <th class="py-2.5 px-3">Dateline</th>
                  <th class="py-2.5 px-3 text-right">Status Sisa</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="s in spkAktif.top"
                  :key="s.Nomor"
                  class="hover:bg-slate-50/60 transition-colors"
                >
                  <td
                    class="py-2.5 px-3 font-mono font-semibold text-slate-900"
                  >
                    {{ s.Nomor }}
                  </td>
                  <td
                    class="py-2.5 px-3 max-w-[220px] truncate font-medium text-slate-700"
                    :title="s.Nama"
                  >
                    {{ s.Nama }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600"
                      >{{ s.Cabang || "-" }}</span
                    >
                  </td>
                  <td class="py-2.5 px-3 font-mono text-slate-500">
                    {{ formatDate(s.Dateline) }}
                  </td>
                  <td
                    class="py-2.5 px-3 text-right font-mono font-bold"
                    :class="
                      Number(s.SisaHari) < 0
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    "
                  >
                    {{
                      Number(s.SisaHari) < 0
                        ? "−" + Math.abs(Number(s.SisaHari)) + " Hari"
                        : "+" + Number(s.SisaHari) + " Hari"
                    }}
                  </td>
                </tr>
                <tr v-if="!spkAktif.top || spkAktif.top.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-400">
                    Tidak ada SPK mendesak saat ini.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 3: GRAFIK MATERIAL FLOW & GRAFIK AFAL/BS -->
    <section class="mx-auto mb-6 grid max-w-[1440px] grid-cols-12 gap-6">
      <!-- Left: Material Flow -->
      <div class="col-span-12 lg:col-span-7">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 pb-3"
          >
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                Arus Perputaran Bahan Utama (6 Bulan)
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Komparasi pasokan masuk (Incoming) vs terpakai produksi
                (Outgoing)
              </p>
            </div>
            <span
              class="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
              >LOGISTIK</span
            >
          </div>
          <div class="relative mt-4 h-[280px]">
            <canvas id="stockFlowChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Right: Waste BS Trend & Ratio -->
      <div class="col-span-12 lg:col-span-5">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 pb-3"
          >
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                Rekapitulasi Luas Waste (M²)
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                Tren afal produksi per divisi cetak
              </p>
            </div>
            <span
              class="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20"
              >TARGET &lt; 50 M²</span
            >
          </div>

          <div class="relative mt-3 h-[200px]">
            <canvas id="bsMonthlyChart"></canvas>
          </div>

          <!-- Bottom Badges -->
          <div
            v-if="bsRateBadges.length > 0"
            class="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/50"
          >
            <div
              class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Rasio Efisiensi Bahan ({{ bsRateMonthLabel }})
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="b in bsRateBadges"
                :key="b.label"
                class="rounded-xl bg-white p-2 text-center shadow-2xs ring-1 ring-slate-200/60"
              >
                <div class="text-[10px] font-bold text-slate-400">
                  {{ b.label }}
                </div>
                <div class="text-sm font-extrabold font-mono text-slate-900">
                  {{ b.text }}
                </div>
                <div class="truncate text-[9px] text-slate-400" :title="b.sub">
                  {{ b.sub }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 4: TABEL OPERASIONAL CEPAT (ANTREAN CETAK & PERMINTAAN GUDANG) -->
    <section class="mx-auto mb-6 grid max-w-[1440px] grid-cols-12 gap-6">
      <!-- 1. Top 10 SPK Cetak -->
      <div class="col-span-12 lg:col-span-6">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div>
            <div
              class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  Antrean Prioritas Produksi Cetak
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Top 10 order terdekat jadwal cetak mesin
                </p>
              </div>
              <button
                @click="openDetailModal('deadline')"
                class="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200/70">
              <table class="w-full text-left text-xs table-fixed">
                <thead
                  class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
                >
                  <tr>
                    <th class="py-2.5 px-3 w-10 text-center">No</th>
                    <th class="py-2.5 px-3 w-32">No. SPK</th>
                    <th class="py-2.5 px-3">Produk / File</th>
                    <th class="py-2.5 px-3 text-right w-24">Sisa Cetak</th>
                    <th class="py-2.5 px-3 text-center w-28">Sisa Waktu</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(item, index) in topDeadlineCetak"
                    :key="index"
                    @click="openDetailModal('deadline')"
                    class="cursor-pointer hover:bg-sky-50/50 transition-colors"
                  >
                    <td
                      class="py-2.5 px-3 text-center font-mono text-slate-400"
                    >
                      {{ index + 1 }}
                    </td>
                    <td
                      class="py-2.5 px-3 font-mono font-bold text-sky-700 truncate"
                    >
                      {{ item.no_spk }}
                    </td>
                    <td
                      class="py-2.5 px-3 truncate text-slate-700 font-medium"
                      :title="item.nama_produk"
                    >
                      {{ item.nama_produk }}
                    </td>
                    <td
                      class="py-2.5 px-3 text-right font-mono font-bold text-slate-900"
                    >
                      {{ item.qty }} {{ item.unit }}
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <span
                        :class="[
                          item.menit_sisa <= 60
                            ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                            : 'bg-amber-50 text-amber-700 ring-amber-600/20',
                          'inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono ring-1 ring-inset',
                        ]"
                      >
                        {{ item.sisa_waktu }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="topDeadlineCetak.length === 0">
                    <td colspan="5" class="py-8 text-center text-slate-400">
                      Tidak ada antrean cetak kritis.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Permintaan Bahan Pending -->
      <div class="col-span-12 lg:col-span-6">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div>
            <div
              class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  Bon Permintaan Bahan Pending
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Pengajuan bahan dari produksi yang belum direalisasi
                </p>
              </div>
              <button
                @click="openDetailModal('bahan')"
                class="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200/70">
              <table class="w-full text-left text-xs table-fixed">
                <thead
                  class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
                >
                  <tr>
                    <th class="py-2.5 px-3 w-10 text-center">No</th>
                    <th class="py-2.5 px-3">Bahan / Material</th>
                    <th class="py-2.5 px-2 text-center w-24">Divisi</th>
                    <th class="py-2.5 px-3 text-right w-24">Qty Diminta</th>
                    <th class="py-2.5 px-3 text-center w-32">
                      Status Approval
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(item, index) in permintaanBahanPending"
                    :key="index"
                    @click="openDetailModal('bahan')"
                    class="cursor-pointer hover:bg-sky-50/50 transition-colors"
                  >
                    <td
                      class="py-2.5 px-3 text-center font-mono text-slate-400"
                    >
                      {{ index + 1 }}
                    </td>
                    <td
                      class="py-2.5 px-3 truncate text-slate-800 font-semibold"
                      :title="item.nama_bahan"
                    >
                      {{ item.nama_bahan }}
                    </td>
                    <td class="py-2.5 px-2 text-center">
                      <span
                        class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                        >{{ item.divisi }}</span
                      >
                    </td>
                    <td
                      class="py-2.5 px-3 text-right font-mono font-bold text-slate-900"
                    >
                      {{ item.qty_minta }} {{ item.unit }}
                    </td>
                    <td class="py-2.5 px-3 text-center">
                      <span
                        v-if="item.status_permintaan === 'PENDING'"
                        class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                        ></span>
                        Pending Finance
                      </span>
                      <span
                        v-else
                        class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {{ item.status_permintaan }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="permintaanBahanPending.length === 0">
                    <td colspan="5" class="py-8 text-center text-slate-400">
                      Seluruh permintaan bahan sudah dipenuhi.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 5: PLANNING BELUM LHK -->
    <section class="mx-auto mb-6 max-w-[1440px]">
      <div class="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70">
        <div
          class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
        >
          <div>
            <h3 class="text-sm font-bold text-slate-900">
              Top 5 SPK Terencana Belum Terealisasi (Belum Buat LHK)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Order planning mesin yang belum dimasukkan laporan hasil kerja
              oleh operator
            </p>
          </div>
          <button
            @click="openDetailModal('planning_idle')"
            class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
          >
            Buka Seluruh Planning &rarr;
          </button>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200/70">
          <table class="w-full text-left text-xs table-fixed">
            <thead
              class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
            >
              <tr>
                <th class="py-2.5 px-3 w-12 text-center">No</th>
                <th class="py-2.5 px-3 w-36">No. SPK</th>
                <th class="py-2.5 px-3 text-center w-28">Mesin Target</th>
                <th class="py-2.5 px-3">Nama Order / File</th>
                <th class="py-2.5 px-3 w-48">Spesifikasi Material</th>
                <th class="py-2.5 px-3 text-right w-24">Plan Qty</th>
                <th class="py-2.5 px-3 text-right w-28">Plan Luas (M²)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(item, index) in topPlanningBelumLhk"
                :key="index"
                @click="openDetailModal('planning_idle')"
                class="cursor-pointer hover:bg-sky-50/50 transition-colors"
              >
                <td class="py-2.5 px-3 text-center font-mono text-slate-400">
                  {{ index + 1 }}
                </td>
                <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
                  {{ item.NomorSPK }}
                </td>
                <td class="py-2.5 px-3 text-center">
                  <span
                    class="rounded bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-700 ring-1 ring-inset ring-sky-600/20"
                  >
                    {{ item.Mesin }}
                  </span>
                </td>
                <td
                  class="py-2.5 px-3 truncate text-slate-700 font-medium"
                  :title="item.NamaSPK"
                >
                  {{ item.NamaSPK }}
                </td>
                <td
                  class="py-2.5 px-3 truncate text-slate-500"
                  :title="item.Bahan"
                >
                  {{ item.Bahan }}
                </td>
                <td
                  class="py-2.5 px-3 text-right font-mono font-bold text-slate-900"
                >
                  {{ item.Plan_Qty }}
                </td>
                <td
                  class="py-2.5 px-3 text-right font-mono font-bold text-sky-700"
                >
                  {{ item.Plan_M2 }} m²
                </td>
              </tr>
              <tr v-if="topPlanningBelumLhk.length === 0">
                <td colspan="7" class="py-8 text-center text-slate-400">
                  Semua planning telah memiliki LHK realisasi produksi.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ROW 6: ALUR FUNNEL PRODUKSI BULAN INI -->
    <section class="mx-auto mb-6 max-w-[1440px]">
      <div class="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3"
        >
          <div>
            <h3 class="text-sm font-bold text-slate-900">
              Alur Funnel Konversi Produksi — {{ funnelMonthLabel }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Penurunan angka berurutan mengindikasikan bottleneck penumpukan
              dokumen
            </p>
          </div>
          <span
            v-if="funnelStages.worstIdx >= 0"
            class="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20"
          >
            Kendala Terbesar:
            {{ funnelStages.stages[funnelStages.worstIdx].label }} (−{{
              formatNumber(funnelStages.worstDrop, 0)
            }})
          </span>
          <span
            v-else
            class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          >
            Alur Konversi Lancar
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div
            v-for="(s, i) in funnelStages.stages"
            :key="s.label"
            class="relative rounded-2xl p-4 text-center ring-1 ring-inset transition-all"
            :class="
              i === funnelStages.worstIdx
                ? 'bg-rose-50/50 ring-rose-200'
                : 'bg-slate-50/80 ring-slate-200/70'
            "
          >
            <div
              class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              {{ s.label }}
            </div>
            <div class="mt-1 font-mono text-2xl font-black text-slate-900">
              {{ formatNumber(s.value, 0) }}
            </div>
            <div
              v-if="i > 0"
              class="mt-1 font-mono text-[11px] font-bold"
              :class="
                funnelStages.stages[i - 1].value - s.value > 0
                  ? 'text-rose-600'
                  : 'text-slate-400'
              "
            >
              {{ funnelStages.stages[i - 1].value - s.value > 0 ? "−" : "+"
              }}{{
                formatNumber(
                  Math.abs(funnelStages.stages[i - 1].value - s.value),
                  0,
                )
              }}
            </div>
          </div>
        </div>

        <div
          class="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100"
        >
          <span class="text-xs font-bold text-slate-500 mr-2"
            >Rincian LHK per Divisi:</span
          >
          <span
            v-for="b in funnelLhkBreakdown"
            :key="b.label"
            class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {{ b.label }}:
            <strong class="font-mono text-slate-900">{{
              formatNumber(b.value, 0)
            }}</strong>
          </span>
        </div>
      </div>
    </section>

    <!-- ROW 7: KOMITMEN & JADWAL TERLAMBAT -->
    <section class="mx-auto mb-6 grid max-w-[1440px] grid-cols-12 gap-6">
      <!-- Komitmen Kirim -->
      <div class="col-span-12 lg:col-span-7">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div>
            <div
              class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  Komitmen Pengiriman Periode Aktif
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  Evaluasi pemenuhan target kirim ke cabang
                </p>
              </div>
            </div>

            <div
              v-if="
                !komitmenAktif.periodes || komitmenAktif.periodes.length === 0
              "
              class="py-12 text-center text-sm text-slate-400"
            >
              Tidak ada periode komitmen berjalan minggu ini.
            </div>

            <div v-else class="flex flex-col gap-3">
              <div
                v-for="p in komitmenAktif.periodes"
                :key="p.Nomor"
                class="rounded-2xl border border-slate-200/70 p-3.5"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-900">
                    {{ p.Nomor }}
                    <span class="font-normal text-slate-400"
                      >({{ p.Cabang }})</span
                    >
                  </span>
                  <span class="font-mono font-bold text-slate-700">
                    {{ formatNumber(p.Realisasi, 0) }} /
                    {{ formatNumber(p.Rencana, 0) }} ({{ p.Persen }}%)
                  </span>
                </div>
                <div
                  class="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="komitmenPersenColor(p.Persen)"
                    :style="{ width: Math.min(100, p.Persen) + '%' }"
                  ></div>
                </div>
              </div>

              <!-- Top Kurang -->
              <div
                v-if="komitmenAktif.kurang && komitmenAktif.kurang.length > 0"
                class="mt-2"
              >
                <span class="text-xs font-bold text-slate-700 block mb-2"
                  >Selisih Order Kurang Terbesar:</span
                >
                <div
                  class="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 px-3"
                >
                  <div
                    v-for="k in komitmenAktif.kurang"
                    :key="k.Nomor + k.Periode"
                    class="flex items-center justify-between py-2 text-xs"
                  >
                    <span class="font-mono font-bold text-slate-800">{{
                      k.Nomor
                    }}</span>
                    <span
                      class="flex-1 truncate mx-3 text-slate-500"
                      :title="k.Nama"
                      >{{ k.Nama || "-" }}</span
                    >
                    <span class="font-mono font-bold text-rose-600"
                      >−{{ formatNumber(k.Kurang, 0) }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Jadwal Terlambat -->
      <div class="col-span-12 lg:col-span-5">
        <div
          class="flex h-full flex-col justify-between rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70"
        >
          <div>
            <div
              class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
            >
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  Jadwal Kirim Lewat Tanggal
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">
                  {{ formatNumber(jadwalTerlambat.total, 0) }} pengiriman
                  tertunggak dalam 6 bulan
                </p>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200/70">
              <table class="w-full text-left text-xs">
                <thead
                  class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
                >
                  <tr>
                    <th class="py-2.5 px-3">Nomor Jadwal</th>
                    <th class="py-2.5 px-2">Tanggal</th>
                    <th class="py-2.5 px-2 text-right">Kurang</th>
                    <th class="py-2.5 px-3 text-right">Telat</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="j in jadwalTerlambat.items"
                    :key="j.Nomor"
                    class="hover:bg-slate-50/60 transition-colors"
                  >
                    <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {{ j.Nomor }}
                    </td>
                    <td class="py-2.5 px-2 font-mono text-slate-500">
                      {{ formatDate(j.Tanggal) }}
                    </td>
                    <td
                      class="py-2.5 px-2 text-right font-mono font-bold text-rose-600"
                    >
                      {{ formatNumber(j.Kurang, 0) }}
                    </td>
                    <td
                      class="py-2.5 px-3 text-right font-mono font-semibold text-slate-600"
                    >
                      {{ j.HariTerlambat }}h
                    </td>
                  </tr>
                  <tr
                    v-if="
                      !jadwalTerlambat.items ||
                      jadwalTerlambat.items.length === 0
                    "
                  >
                    <td colspan="4" class="py-8 text-center text-slate-400">
                      Semua jadwal pengiriman tepat waktu.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 8: STOK MENIPIS -->
    <section class="mx-auto max-w-[1440px]">
      <div class="rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-200/70">
        <div
          class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"
        >
          <div>
            <h3 class="text-sm font-bold text-slate-900">
              Peringatan Stok Menipis & Kritis (Kartu Stok Live)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Bahan baku bersaldo saldo fisik terendah yang memerlukan pemesanan
              ulang
            </p>
          </div>
          <span
            :class="[
              stokMenipis.total > 0
                ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
              'rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset',
            ]"
          >
            {{ formatNumber(stokMenipis.total, 0) }} Item Perlu Restock
          </span>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200/70">
          <table class="w-full text-left text-xs">
            <thead
              class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
            >
              <tr>
                <th class="py-2.5 px-3 w-40">Kode Material</th>
                <th class="py-2.5 px-3">Nama Bahan Baku</th>
                <th class="py-2.5 px-3 text-center w-28">Satuan</th>
                <th class="py-2.5 px-4 text-right w-36">Sisa Saldo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="s in stokMenipis.items"
                :key="s.Kode"
                class="hover:bg-slate-50/60 transition-colors"
              >
                <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
                  {{ s.Kode }}
                </td>
                <td class="py-2.5 px-3 font-medium text-slate-700">
                  {{ s.Nama || "-" }}
                </td>
                <td class="py-2.5 px-3 text-center text-slate-500">
                  {{ s.Satuan || "-" }}
                </td>
                <td
                  class="py-2.5 px-4 text-right font-mono font-bold text-sm"
                  :class="
                    Number(s.Stok) <= 0 ? 'text-rose-600' : 'text-amber-600'
                  "
                >
                  {{ formatNumber(s.Stok, 0) }}
                </td>
              </tr>
              <tr v-if="!stokMenipis.items || stokMenipis.items.length === 0">
                <td colspan="4" class="py-8 text-center text-slate-400">
                  Seluruh stok bahan aman.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- POPUP MODAL DETAIL -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div
        class="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 max-h-[85vh] flex flex-col"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4"
        >
          <div>
            <h3 class="text-base font-bold text-slate-900">
              {{
                modalType === "deadline"
                  ? "Seluruh Antrean Cetak Berdasarkan Deadline"
                  : modalType === "bahan"
                    ? "Daftar Total Permintaan Bahan Belum Realisasi"
                    : "Daftar Lengkap SPK Terencana Belum LHK"
              }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Menampilkan seluruh data record tanpa limitasi tampilan dashboard
            </p>
          </div>
          <button
            @click="closeModal"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-2xs ring-1 ring-slate-200 hover:text-slate-700"
          >
            <i class="mdi mdi-close text-lg"></i>
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="isLoadingTotal" class="py-16 text-center text-slate-400">
            <i class="mdi mdi-refresh animate-spin text-3xl"></i>
            <span class="block mt-2 text-xs font-semibold"
              >Mengambil data dari database...</span
            >
          </div>

          <div
            v-else
            class="overflow-hidden rounded-2xl border border-slate-200/70"
          >
            <!-- Modal: Deadline -->
            <table
              v-if="modalType === 'deadline'"
              class="w-full text-left text-xs table-fixed"
            >
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
              >
                <tr>
                  <th class="py-2.5 px-3 w-10 text-center">No</th>
                  <th class="py-2.5 px-3 w-32">No. SPK</th>
                  <th class="py-2.5 px-3">Nama Produk / File</th>
                  <th class="py-2.5 px-2 text-right w-24">Qty Order</th>
                  <th class="py-2.5 px-2 text-right w-24">Cetak</th>
                  <th class="py-2.5 px-2 text-right w-24">Sisa</th>
                  <th class="py-2.5 px-3 text-center w-28">Tgl SPK</th>
                  <th class="py-2.5 px-3 text-center w-28">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="hover:bg-slate-50"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-slate-400">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-3 font-mono font-bold text-sky-700">
                    {{ item.no_spk }}
                  </td>
                  <td
                    class="py-2.5 px-3 truncate text-slate-800"
                    :title="item.nama_produk"
                  >
                    {{ item.nama_produk }}
                  </td>
                  <td class="py-2.5 px-2 text-right font-mono text-slate-600">
                    {{ item.qty_order }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right font-mono text-emerald-600 font-semibold"
                  >
                    {{ item.sudah_cetak }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right font-mono font-bold text-slate-900"
                  >
                    {{ item.qty }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-slate-500">
                    {{ formatDate(item.tanggal_spk) }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span
                      :class="[
                        item.sisa_waktu &&
                        item.sisa_waktu.toLowerCase().includes('lewat')
                          ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                          : 'bg-amber-50 text-amber-700 ring-amber-600/20',
                        'inline-block px-2 py-0.5 rounded text-[11px] font-bold ring-1 ring-inset',
                      ]"
                    >
                      {{ item.sisa_waktu }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Modal: Bahan Pending -->
            <table
              v-if="modalType === 'bahan'"
              class="w-full text-left text-xs table-fixed"
            >
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
              >
                <tr>
                  <th class="py-2.5 px-3 w-10 text-center">No</th>
                  <th class="py-2.5 px-3 w-36">No. Bon Ref</th>
                  <th class="py-2.5 px-3">Bahan / Material</th>
                  <th class="py-2.5 px-2 text-center w-28">Divisi</th>
                  <th class="py-2.5 px-3 text-right w-28">Qty Minta</th>
                  <th class="py-2.5 px-3 text-center w-28">Tanggal</th>
                  <th class="py-2.5 px-3 text-center w-32">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="hover:bg-slate-50"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-slate-400">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-3 font-mono font-medium text-slate-700">
                    {{ item.nomor_bon }}
                  </td>
                  <td
                    class="py-2.5 px-3 truncate font-bold text-slate-900"
                    :title="item.nama_bahan"
                  >
                    {{ item.nama_bahan }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      class="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700"
                      >{{ item.divisi }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-3 text-right font-mono font-bold text-sky-700"
                  >
                    {{ item.qty_minta }} {{ item.unit }}
                  </td>
                  <td class="py-2.5 px-3 text-center font-mono text-slate-500">
                    {{ formatDate(item.created_at) }}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"
                      ></span>
                      Pending Finance
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Modal: Planning Idle -->
            <table
              v-if="modalType === 'planning_idle'"
              class="w-full text-left text-xs table-fixed"
            >
              <thead
                class="bg-slate-50 text-slate-500 border-b border-slate-200/70 font-semibold"
              >
                <tr>
                  <th class="py-2.5 px-3 w-10 text-center">No</th>
                  <th class="py-2.5 px-3 w-32">No. SPK</th>
                  <th class="py-2.5 px-2 text-center w-24">Mesin</th>
                  <th class="py-2.5 px-3">Nama Order / File</th>
                  <th class="py-2.5 px-3 w-40">Bahan</th>
                  <th class="py-2.5 px-2 text-center w-24">Dimensi</th>
                  <th class="py-2.5 px-2 text-right w-24">Plan Qty</th>
                  <th class="py-2.5 px-3 text-right w-24">Plan (M²)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(item, index) in totalModalData"
                  :key="index"
                  class="hover:bg-slate-50"
                >
                  <td class="py-2.5 px-3 text-center font-mono text-slate-400">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {{ item.NomorSPK }}
                  </td>
                  <td class="py-2.5 px-2 text-center">
                    <span
                      class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700"
                      >{{ item.Mesin }}</span
                    >
                  </td>
                  <td
                    class="py-2.5 px-3 truncate font-medium text-slate-800"
                    :title="item.NamaSPK"
                  >
                    {{ item.NamaSPK }}
                  </td>
                  <td
                    class="py-2.5 px-3 truncate text-slate-600"
                    :title="item.Bahan"
                  >
                    {{ item.Bahan }}
                  </td>
                  <td class="py-2.5 px-2 text-center font-mono text-slate-500">
                    {{ item.Lebar }}x{{ item.Panjang }}
                  </td>
                  <td
                    class="py-2.5 px-2 text-right font-mono font-semibold text-slate-900"
                  >
                    {{ item.Plan_Qty }}
                  </td>
                  <td
                    class="py-2.5 px-3 text-right font-mono font-bold text-sky-700"
                  >
                    {{ item.Plan_M2 }} m²
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              v-if="totalModalData.length === 0 && !isLoadingTotal"
              class="py-12 text-center text-xs text-slate-400"
            >
              Tidak ada data ditemukan.
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5 text-xs text-slate-500"
        >
          <div>
            Total baris:
            <strong class="font-mono text-slate-900">{{
              totalModalData.length
            }}</strong>
          </div>
          <button
            @click="closeModal"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Chart from "chart.js/auto";
import { format } from "date-fns";
import api from "@/services/api";

/* ================= ENDPOINT API ================= */
const ENDPOINT_SUMMARY = "/mmt/laporan-ls-bahan-utama/total-roll";
const ENDPOINT_FLOW = "/mmt/laporan-ls-bahan-utama/flow-6-bulan";
const ENDPOINT_BS_MONTHLY = "/mmt/dashboard/grafik-bulanan";
const ENDPOINT_BS_RATE = "/mmt/dashboard/bs-rate";
const ENDPOINT_SPK_AKTIF = "/mmt/dashboard/spk-aktif";
const ENDPOINT_DEADLINE = "mmt/dashboard/top-10-deadline";
const ENDPOINT_DEADLINE_TOTAL = "mmt/dashboard/top-10-deadline-total";
const ENDPOINT_PENDING_BAHAN = "mmt/dashboard/permintaan-pending";
const ENDPOINT_PENDING_BAHAN_TOTAL = "mmt/dashboard/permintaan-pending-total";
const ENDPOINT_PLANNING_IDLE = "mmt/dashboard/planning-belum-lhk";
const ENDPOINT_PLANNING_IDLE_TOTAL = "mmt/dashboard/planning-belum-lhk-total";
const ENDPOINT_FUNNEL = "/mmt/dashboard/funnel-produksi";
const ENDPOINT_KOMITMEN = "/mmt/dashboard/komitmen-aktif";
const ENDPOINT_STOK_TIPIS = "/mmt/dashboard/stok-menipis";
const ENDPOINT_JADWAL_TELAT = "/mmt/dashboard/jadwal-terlambat";

/* ================= STATE DASHBOARD ================= */
const lastUpdate = ref(format(new Date(), "HH:mm:ss"));
const isLoading = ref(false);
const topDeadlineCetak = ref([]);
const permintaanBahanPending = ref([]);
const topPlanningBelumLhk = ref([]);
const monthlyBsData = ref([]);

/* ================= RASIO BS VS PRODUKSI ================= */
const bsRate = ref(null);

const bsRateMonthIdx = computed(() => {
  const d = bsRate.value?.divisions;
  if (!d) return -1;
  const n = bsRate.value.months?.length || 0;
  for (let i = n - 1; i >= 0; i--) {
    if (
      (d.MMT?.produksi?.[i] || 0) > 0 ||
      (d.FINISHING?.produksi?.[i] || 0) > 0 ||
      (d.TEKSTIL?.produksi?.[i] || 0) > 0
    )
      return i;
  }
  return -1;
});

const bsRateBadges = computed(() => {
  const i = bsRateMonthIdx.value;
  if (i < 0) return [];
  const d = bsRate.value.divisions;
  return [
    {
      label: "MMT",
      text: `${d.MMT.persen[i]}%`,
      sub: `${formatNumber(d.MMT.bs[i], 2)} / ${formatNumber(d.MMT.produksi[i], 2)} M²`,
    },
    {
      label: "Finishing",
      text: `${d.FINISHING.persen[i]}%`,
      sub: `${formatNumber(d.FINISHING.bs[i], 0)} / ${formatNumber(d.FINISHING.produksi[i], 0)} pcs`,
    },
    {
      label: "Tekstil",
      text: `${formatNumber(d.TEKSTIL.bs[i], 2)} M²`,
      sub: `dari ${formatNumber(d.TEKSTIL.produksi[i], 0)} pcs`,
    },
  ];
});

const bsRateMonthLabel = computed(() => {
  const i = bsRateMonthIdx.value;
  return i >= 0 ? bsRate.value.months[i].label : "";
});

const fetchBsRate = async () => {
  try {
    const response = await api.get(ENDPOINT_BS_RATE);
    const res = response.data;
    if (res.success && res.data) bsRate.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil rasio BS:", err);
  }
};

/* ================= STATE ANALISIS ================= */
const funnel = ref({
  spk: 0,
  spk_memo: 0,
  lhk_cetak: 0,
  lhk_tekstil: 0,
  lhk_proof: 0,
  lhk_sublim: 0,
  lhk_finishing: 0,
  stbj: 0,
  jadwal: 0,
  sj: 0,
});
const komitmenAktif = ref({ periodes: [], kurang: [] });
const stokMenipis = ref({ total: 0, items: [] });
const jadwalTerlambat = ref({ total: 0, items: [] });

const funnelMonthLabel = computed(() => {
  const d = new Date();
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
});

const funnelStages = computed(() => {
  const f = funnel.value || {};
  const lhkTotal =
    (f.lhk_cetak || 0) +
    (f.lhk_tekstil || 0) +
    (f.lhk_proof || 0) +
    (f.lhk_sublim || 0) +
    (f.lhk_finishing || 0);
  const stages = [
    { label: "SPK", value: (f.spk || 0) + (f.spk_memo || 0) },
    { label: "LHK", value: lhkTotal },
    { label: "STBJ", value: f.stbj || 0 },
    { label: "Jadwal", value: f.jadwal || 0 },
    { label: "SJ", value: f.sj || 0 },
  ];
  let worstIdx = -1;
  let worstDrop = 0;
  for (let i = 0; i < stages.length - 1; i++) {
    const drop = stages[i].value - stages[i + 1].value;
    if (drop > worstDrop) {
      worstDrop = drop;
      worstIdx = i + 1;
    }
  }
  return { stages, worstIdx, worstDrop };
});

const funnelLhkBreakdown = computed(() => {
  const f = funnel.value || {};
  return [
    { label: "Cetak", value: f.lhk_cetak || 0 },
    { label: "Tekstil", value: f.lhk_tekstil || 0 },
    { label: "Proof", value: f.lhk_proof || 0 },
    { label: "Sublim", value: f.lhk_sublim || 0 },
    { label: "Finishing", value: f.lhk_finishing || 0 },
  ];
});

const komitmenPersenColor = (p) => {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-amber-500";
  return "bg-rose-500";
};

const stats = ref({
  totalStock: 0,
  totalKasusBs: 0,
  totalPanjangBs: 0,
  totalLuasBsM2: 0,
});

/* ================= STATE MODAL ================= */
const isModalOpen = ref(false);
const isLoadingTotal = ref(false);
const modalType = ref("");
const totalModalData = ref([]);

let flowChartInstance = null;
let bsChartInstance = null;

const bsGrowth = computed(() => {
  if (monthlyBsData.value.length < 2) return 0;
  const current =
    monthlyBsData.value[monthlyBsData.value.length - 1]?.total_luas_m2 || 0;
  const prev =
    monthlyBsData.value[monthlyBsData.value.length - 2]?.total_luas_m2 || 0;
  if (prev === 0) return 0;
  return Number((((current - prev) / prev) * 100).toFixed(1));
});

const avgMonthlyBs = computed(() => {
  if (monthlyBsData.value.length === 0) return 0;
  const total = monthlyBsData.value.reduce(
    (acc, curr) => acc + Number(curr.total_luas_m2 || 0),
    0,
  );
  return total / monthlyBsData.value.length;
});

/* ================= API CALLS ================= */
const fetchSummary = async () => {
  try {
    const response = await api.get(ENDPOINT_SUMMARY);
    const res = response.data;
    if (res.success && res.data) {
      stats.value.totalStock = res.data.total_roll || 0;
    }
  } catch (err) {
    console.error("Gagal mengambil summary:", err);
  }
};

const fetchFlowData = async () => {
  try {
    const response = await api.get(ENDPOINT_FLOW);
    const res = response.data;
    if (res.success && res.data) {
      const labels = res.data.map((item) => item.bulan);
      const dataMasuk = res.data.map((item) => item.masuk);
      const dataKeluar = res.data.map((item) => item.keluar);
      renderFlowChart(labels, dataMasuk, dataKeluar);
    }
  } catch (err) {
    console.error("Gagal mengambil data flow:", err);
  }
};

const fetchBsMonthlyData = async () => {
  try {
    const response = await api.get(ENDPOINT_BS_MONTHLY);
    const res = response.data;
    if (res.success && res.data) {
      const { labels, datasets } = res.data;
      renderBsLineChart(labels, datasets);
    }
  } catch (err) {
    console.error("Gagal mengambil data grafik BS:", err);
  }
};

const renderBsLineChart = (labels, datasets) => {
  const ctx = document.getElementById("bsMonthlyChart");
  if (!ctx) return;
  if (bsChartInstance) bsChartInstance.destroy();

  bsChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "BS Tekstil",
          data: datasets["TEKSTIL"] || [],
          borderColor: "#ec4899",
          backgroundColor: "#ec4899",
          pointStyle: "triangle",
          pointRadius: 4,
          borderWidth: 2,
          tension: 0.15,
        },
        {
          label: "BS Finishing",
          data: datasets["FINISHING"] || [],
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          pointStyle: "rectRot",
          pointRadius: 4,
          borderWidth: 2,
          tension: 0.15,
        },
        {
          label: "BS MMT",
          data: datasets["MMT"] || [],
          borderColor: "#0284c7",
          backgroundColor: "#0284c7",
          pointStyle: "circle",
          pointRadius: 4,
          borderWidth: 2,
          tension: 0.15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            font: { size: 10, weight: "bold" },
            padding: 10,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) =>
              ` ${ctx.dataset.label}: ${formatNumber(ctx.raw, 2)} M²`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: "#64748b" },
        },
        y: {
          border: { dash: [4, 4], display: false },
          grid: { color: "#f1f5f9" },
          ticks: {
            font: { size: 9 },
            color: "#94a3b8",
            callback: (value) => `${value} m²`,
          },
        },
      },
    },
  });
};

const fetchDeadlineCetak = async () => {
  try {
    const response = await api.get(ENDPOINT_DEADLINE);
    const res = response.data;
    topDeadlineCetak.value = res.success && res.data ? res.data : [];
  } catch (err) {
    topDeadlineCetak.value = [];
  }
};

const fetchPermintaanPending = async () => {
  try {
    const response = await api.get(ENDPOINT_PENDING_BAHAN);
    const res = response.data;
    permintaanBahanPending.value = res.success && res.data ? res.data : [];
  } catch (err) {
    permintaanBahanPending.value = [];
  }
};

const fetchPlanningBelumLhk = async () => {
  try {
    const response = await api.get(ENDPOINT_PLANNING_IDLE);
    const res = response.data;
    topPlanningBelumLhk.value = res.success && res.data ? res.data : [];
  } catch (err) {
    topPlanningBelumLhk.value = [];
  }
};

const monthRangeParams = () => {
  const now = new Date();
  return {
    startDate: format(
      new Date(now.getFullYear(), now.getMonth(), 1),
      "yyyy-MM-dd",
    ),
    endDate: format(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
      "yyyy-MM-dd",
    ),
  };
};

const fetchFunnel = async () => {
  try {
    const response = await api.get(ENDPOINT_FUNNEL, {
      params: monthRangeParams(),
    });
    const res = response.data;
    if (res.success && res.data) funnel.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil funnel produksi:", err);
  }
};

const fetchKomitmenAktif = async () => {
  try {
    const response = await api.get(ENDPOINT_KOMITMEN);
    const res = response.data;
    if (res.success && res.data) komitmenAktif.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil komitmen aktif:", err);
  }
};

const fetchStokMenipis = async () => {
  try {
    const response = await api.get(ENDPOINT_STOK_TIPIS);
    const res = response.data;
    if (res.success && res.data) stokMenipis.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil stok menipis:", err);
  }
};

const fetchJadwalTerlambat = async () => {
  try {
    const response = await api.get(ENDPOINT_JADWAL_TELAT);
    const res = response.data;
    if (res.success && res.data) jadwalTerlambat.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil jadwal terlambat:", err);
  }
};

const openDetailModal = async (type) => {
  modalType.value = type;
  isModalOpen.value = true;
  isLoadingTotal.value = true;
  totalModalData.value = [];

  try {
    let response;
    if (type === "deadline") response = await api.get(ENDPOINT_DEADLINE_TOTAL);
    else if (type === "bahan")
      response = await api.get(ENDPOINT_PENDING_BAHAN_TOTAL);
    else if (type === "planning_idle")
      response = await api.get(ENDPOINT_PLANNING_IDLE_TOTAL);

    const res = response?.data;
    if (res && res.success && res.data) totalModalData.value = res.data;
  } catch (err) {
    console.error(`Gagal load modal (${type}):`, err);
  } finally {
    isLoadingTotal.value = false;
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  modalType.value = "";
  totalModalData.value = [];
};

const spkAktif = ref({
  total: 0,
  lewat: 0,
  lewatMendesak: 0,
  tunggakanLama: 0,
  hariIni: 0,
  segera: 0,
  tanpaDateline: 0,
  selesaiFisik: 0,
  top: [],
});

const fetchSpkAktif = async () => {
  try {
    const response = await api.get(ENDPOINT_SPK_AKTIF);
    const res = response.data;
    if (res.success && res.data) spkAktif.value = res.data;
  } catch (err) {
    console.error("Gagal mengambil SPK aktif:", err);
  }
};

const refreshAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      fetchSummary(),
      fetchFlowData(),
      fetchBsMonthlyData(),
      fetchBsRate(),
      fetchDeadlineCetak(),
      fetchPermintaanPending(),
      fetchPlanningBelumLhk(),
      fetchFunnel(),
      fetchKomitmenAktif(),
      fetchStokMenipis(),
      fetchJadwalTerlambat(),
      fetchSpkAktif(),
    ]);
    lastUpdate.value = format(new Date(), "HH:mm:ss");
  } catch (err) {
    console.error("Gagal sinkron data dashboard:", err);
  } finally {
    isLoading.value = false;
  }
};

const formatNumber = (val, dec = 2) => {
  if (val === null || val === undefined) return "0,00";
  const num = parseFloat(val);
  return isNaN(num)
    ? "0,00"
    : num.toLocaleString("id-ID", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const renderFlowChart = (labels, incomingData, outgoingData) => {
  const flowCtx = document.getElementById("stockFlowChart");
  if (!flowCtx) return;
  if (flowChartInstance) flowChartInstance.destroy();

  flowChartInstance = new Chart(flowCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Bahan Masuk",
          data: incomingData,
          backgroundColor: "#0284c7",
          borderRadius: 6,
          barPercentage: 0.6,
        },
        {
          label: "Bahan Terpakai",
          data: outgoingData,
          backgroundColor: "#bae6fd",
          borderRadius: 6,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: { boxWidth: 10, font: { size: 10, weight: "bold" } },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          border: { display: false },
          grid: { color: "#f1f5f9" },
          ticks: { font: { size: 9 }, color: "#94a3b8" },
        },
      },
    },
  });
};

onMounted(async () => {
  await refreshAllData();
});
</script>

<style scoped>
/* Dashboard polish: visual hierarchy, consistent spacing, and responsive tables */
.dashboard-shell {
  background:
    radial-gradient(
      ellipse at 8% 0%,
      rgba(14, 165, 233, 0.08),
      transparent 32%
    ),
    radial-gradient(
      ellipse at 100% 12%,
      rgba(99, 102, 241, 0.06),
      transparent 28%
    ),
    #f5f7fb;
}

.dashboard-shell :deep(header > div) {
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.055);
}

.dashboard-shell :deep(section > div) {
  border-color: rgba(226, 232, 240, 0.9);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.035);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dashboard-shell :deep(section > div:hover) {
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.055);
}

.dashboard-shell :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}

.dashboard-shell :deep(thead th) {
  letter-spacing: 0.025em;
  font-size: 10px;
  text-transform: uppercase;
  white-space: nowrap;
}

.dashboard-shell :deep(tbody tr) {
  transition: background-color 0.15s ease;
}

.dashboard-shell :deep(tbody td) {
  vertical-align: middle;
}

.dashboard-shell :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.dashboard-shell :deep(button) {
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.dashboard-shell :deep(button:focus-visible) {
  outline: 3px solid rgba(14, 165, 233, 0.35);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .dashboard-shell {
    padding: 12px;
  }

  .dashboard-shell :deep(section > div) {
    border-radius: 18px;
    padding: 16px;
  }

  .dashboard-shell :deep(table) {
    min-width: 620px;
  }

  .dashboard-shell :deep(.overflow-hidden.rounded-2xl) {
    overflow-x: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-shell :deep(*) {
    transition: none !important;
    animation-duration: 0.01ms !important;
  }
}

/* Keterbacaan tabel: baris lebih lega di semua tabel dashboard
   (antrean SPK, deadline, pending, planning, jadwal, stok, modal). */
.dashboard-shell :deep(table) th {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
  line-height: 1.45;
}
.dashboard-shell :deep(table) td {
  padding-top: 0.45rem !important;
  padding-bottom: 0.45rem !important;
  line-height: 1.45;
}
</style>
