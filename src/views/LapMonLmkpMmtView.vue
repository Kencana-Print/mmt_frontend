<template>
  <BaseReportLayout
    v-model:start-date="startDate"
    v-model:end-date="endDate"
    :items="filteredData"
    :loading="loading.report"
    :show-gudang-filter="false"
    :disable-sort="true"
    :disable-filter="true"
    :has-active-filter="hasActiveFilter"
    item-key="NOMOR"
    title="Laporan Monitoring LMKP"
    :excel-file-name="`Laporan_LMKP_${jenisLabel}_${startDate}_sd_${endDate}.xlsx`"
    :custom-export-excel="exportToExcel"
    @refresh="fetchReport"
    @reset-filter="resetAllFilters"
  >
    <!-- Slot Filter Tambahan: Dropdown Kategori & Pencarian SPK -->
    <template #extra-filters>
      <v-select
        v-model="jenisIndex"
        :items="[
          { title: 'MT', value: '0' },
          { title: 'MX', value: '1' },
          { title: 'PAPERPRINT', value: '2' },
          { title: 'SUBLIM', value: '3' },
        ]"
        label="Kategori"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 140px"
        @update:model-value="onJenisChange"
      />

      <v-text-field
        v-model="searchQuery"
        label="Cari SPK / Order / Finishing..."
        prepend-inner-icon="mdi-magnify"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 260px"
      />
    </template>

    <!-- Slot Header Tabel Berkelompok Custom dengan Support Drag & Drop -->
    <template #thead>
      <thead>
        <!-- Row 1: Header Utama & Grouping Header -->
        <tr class="header-main">
          <!-- 1. NOMOR SPK -->
          <th
            rowspan="2"
            :style="colStyles('NOMOR', '140px')"
            class="text-center sticky-col-1 cursor-pointer select-none position-relative"
            @click="toggleSort('NOMOR')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  NOMOR SPK {{ getSortIcon("NOMOR") }}
                </span>
              </div>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="columnFilters.NOMOR ? 'amber-accent-2' : 'white'"
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.NOMOR"
                    label="Filter Nomor SPK..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'NOMOR', 140)"
            ></div>
          </th>

          <!-- 2. NAMA ORDER -->
          <th
            rowspan="2"
            :style="colStyles('spk_nama', '220px')"
            class="text-left sticky-col-2 cursor-pointer select-none position-relative"
            @click="toggleSort('spk_nama')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  NAMA ORDER {{ getSortIcon("spk_nama") }}
                </span>
              </div>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon ml-1"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.spk_nama ? 'amber-accent-2' : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="220" class="pa-2 rounded-lg" @click.stop>
                  <v-text-field
                    v-model="columnFilters.spk_nama"
                    label="Filter Nama Order..."
                    density="compact"
                    hide-details
                    variant="outlined"
                    clearable
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_nama', 220)"
            ></div>
          </th>

          <!-- 3. TANGGAL -->
          <th
            rowspan="2"
            :style="colStyles('spk_tanggal', '110px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('spk_tanggal')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  TANGGAL {{ getSortIcon("spk_tanggal") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_tanggal', 110)"
            ></div>
          </th>

          <!-- 4. DEADLINE -->
          <th
            rowspan="2"
            :style="colStyles('deadline', '110px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('deadline')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  DEADLINE {{ getSortIcon("deadline") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'deadline', 110)"
            ></div>
          </th>

          <!-- 5. BAHAN -->
          <th
            rowspan="2"
            :style="colStyles('KAIN', '140px')"
            class="text-left border cursor-pointer select-none position-relative"
            @click="toggleSort('KAIN')"
          >
            <div
              class="d-flex align-center justify-space-between px-1 ga-1 w-100"
            >
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  BAHAN {{ getSortIcon("KAIN") }}
                </span>
              </div>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon
                    variant="text"
                    size="x-small"
                    class="btn-filter-icon"
                    @click.stop
                  >
                    <v-icon
                      size="14"
                      :color="
                        columnFilters.KAIN !== 'SEMUA'
                          ? 'amber-accent-2'
                          : 'white'
                      "
                    >
                      mdi-filter-variant
                    </v-icon>
                  </v-btn>
                </template>
                <v-card min-width="200" class="pa-2 rounded-lg" @click.stop>
                  <v-select
                    v-model="columnFilters.KAIN"
                    :items="kainOptions"
                    label="Pilih Bahan"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </v-card>
              </v-menu>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'KAIN', 140)"
            ></div>
          </th>

          <!-- 6. GRAMASI -->
          <th
            rowspan="2"
            :style="colStyles('spk_gramasi', '90px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('spk_gramasi')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  GRAMASI {{ getSortIcon("spk_gramasi") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'spk_gramasi', 90)"
            ></div>
          </th>

          <!-- 7. PANJANG -->
          <th
            rowspan="2"
            :style="colStyles('PANJANG', '90px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('PANJANG')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  PANJANG {{ getSortIcon("PANJANG") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'PANJANG', 90)"
            ></div>
          </th>

          <!-- 8. LEBAR -->
          <th
            rowspan="2"
            :style="colStyles('LEBAR', '90px')"
            class="text-center cursor-pointer select-none position-relative"
            @click="toggleSort('LEBAR')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  LEBAR {{ getSortIcon("LEBAR") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'LEBAR', 90)"
            ></div>
          </th>

          <!-- 9. FINISHING -->
          <th
            rowspan="2"
            :style="colStyles('FINISHING', '130px')"
            class="text-left cursor-pointer select-none position-relative"
            @click="toggleSort('FINISHING')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  FINISHING {{ getSortIcon("FINISHING") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'FINISHING', 130)"
            ></div>
          </th>

          <!-- GROUP PRODUKSI (PCS) -->
          <th
            :colspan="subPcs.length"
            class="text-center header-group bg-blue-header"
          >
            PRODUKSI (PCS)
          </th>

          <!-- CETAK LUAR -->
          <th
            rowspan="2"
            :style="colStyles('cetak_luarx', '90px')"
            class="text-right border-l border-r cursor-pointer select-none position-relative"
            @click="toggleSort('cetak_luarx')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  CTK L. {{ getSortIcon("cetak_luarx") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, 'cetak_luarx', 90)"
            ></div>
          </th>

          <th
            v-if="mesinColumns.length > 0"
            :colspan="mesinColumns.length"
            class="text-center header-group bg-cyan-header"
          >
            MESIN
          </th>

          <th colspan="3" class="text-center header-group bg-teal-header">
            PRODUKSI (METER)
          </th>
        </tr>

        <!-- Row 2: Sub Header Detail (Drag Target Utama) -->
        <tr class="header-sub">
          <!-- DINAMIS SUB HEADER PCS -->
          <th
            v-for="sub in subPcs"
            :key="sub.key"
            :style="colStyles(sub.key, '90px')"
            class="text-right bg-blue-sub cursor-pointer select-none position-relative draggable-th"
            @click="toggleSort(sub.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  {{ sub.label }} {{ getSortIcon(sub.key) }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, sub.key, 90)"
            ></div>
          </th>

          <!-- DINAMIS SUB HEADER MESIN -->
          <th
            v-for="m in mesinColumns"
            :key="m.key"
            :style="colStyles(m.key, '80px')"
            class="text-center bg-cyan-sub cursor-pointer select-none position-relative draggable-th"
            @click="toggleSort(m.key)"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  {{ m.label }} {{ getSortIcon(m.key) }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="startResize($event, m.key, 80)"
            ></div>
          </th>

          <!-- Produksi Meter -->
          <th
            :style="colStyles('krg_kirim_meter', '90px')"
            class="text-right bg-teal-sub cursor-pointer select-none position-relative draggable-th"
            @click="toggleSort('krg_kirim_meter')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  K-KRM {{ getSortIcon("krg_kirim_meter") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'krg_kirim_meter', 90)
              "
            ></div>
          </th>
          <th
            :style="colStyles('krg_Cetak_meter', '90px')"
            class="text-right bg-teal-sub cursor-pointer select-none position-relative draggable-th"
            @click="toggleSort('krg_Cetak_meter')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  K-CTK {{ getSortIcon("krg_Cetak_meter") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'krg_Cetak_meter', 90)
              "
            ></div>
          </th>
          <th
            :style="colStyles('krg_coly_meter', '90px')"
            class="text-right bg-teal-sub cursor-pointer select-none position-relative draggable-th"
            @click="toggleSort('krg_coly_meter')"
          >
            <div class="d-flex align-center justify-space-between px-1 w-100">
              <div class="d-flex align-center overflow-hidden w-100">
                <span class="col-drag-handle mr-1" title="Geser kolom">⠿</span>
                <span class="font-weight-bold text-truncate">
                  K-CLY {{ getSortIcon("krg_coly_meter") }}
                </span>
              </div>
            </div>
            <div
              class="column-resizer"
              @mousedown.stop.prevent="
                startResize($event, 'krg_coly_meter', 90)
              "
            ></div>
          </th>
        </tr>
      </thead>
    </template>

    <!-- Slot Row Baris Data Utama -->
    <template #row="{ item, formatNumber }">
      <tr class="table-row-item">
        <td
          :style="colStyles('NOMOR', '140px')"
          class="text-center sticky-col-1 font-weight-bold d-flex align-center justify-between"
        >
          <v-btn
            v-if="
              ['2', '3'].includes(jenisIndex) &&
              item.sizes &&
              item.sizes.length > 0
            "
            icon
            variant="text"
            size="x-small"
            class="mr-1"
            @click.stop="toggleExpand(item.NOMOR)"
          >
            <v-icon size="16">
              {{
                expanded.includes(item.NOMOR)
                  ? "mdi-chevron-down"
                  : "mdi-chevron-right"
              }}
            </v-icon>
          </v-btn>

          <span
            v-if="item.NOMOR && item.NOMOR !== '-'"
            class="text-primary cursor-pointer text-decoration-underline"
            @click.stop="handlePreview(item.NOMOR)"
          >
            {{ item.NOMOR }}
          </span>
          <span v-else>-</span>
        </td>
        <td
          :style="colStyles('spk_nama', '220px')"
          class="text-left sticky-col-2 text-truncate"
          :title="item.spk_nama"
        >
          {{ item.spk_nama || "-" }}
        </td>
        <td :style="colStyles('spk_tanggal', '110px')" class="text-center">
          {{ formatDateDisplay(item.spk_tanggal) }}
        </td>
        <td
          :style="colStyles('deadline', '110px')"
          class="text-center font-weight-bold text-error"
        >
          {{ formatDateDisplay(item.deadline) }}
        </td>
        <td
          :style="colStyles('KAIN', '140px')"
          class="text-left text-truncate"
          :title="item.KAIN"
        >
          {{ item.KAIN || "-" }}
        </td>
        <td :style="colStyles('spk_gramasi', '90px')" class="text-center">
          {{ item.spk_gramasi || "-" }}
        </td>
        <td :style="colStyles('PANJANG', '90px')" class="text-center">
          {{ formatNumber(item.PANJANG, 2) }}
        </td>
        <td :style="colStyles('LEBAR', '90px')" class="text-center">
          {{ formatNumber(item.LEBAR, 2) }}
        </td>
        <td
          :style="colStyles('FINISHING', '130px')"
          class="text-left text-truncate"
          :title="item.FINISHING"
        >
          {{ item.FINISHING || "-" }}
        </td>

        <!-- DINAMIS DATA PRODUKSI PCS -->
        <template v-for="sub in subPcs" :key="sub.key">
          <td
            :style="colStyles(sub.key, '90px')"
            class="text-right"
            :class="{
              'text-error font-weight-bold': sub.key === 'krg_Cetak',
              'text-success font-weight-bold': sub.key === 'spk_jumlah_kirim',
            }"
          >
            {{ formatNumber(item[sub.key], 0) }}
          </td>
        </template>

        <!-- Cetak Luar -->
        <td
          :style="colStyles('cetak_luarx', '90px')"
          class="text-right border-l border-r"
        >
          {{ formatNumber(item.cetak_luarx, 0) }}
        </td>

        <!-- DINAMIS DATA MESIN -->
        <td
          v-for="m in mesinColumns"
          :key="m.key"
          :style="colStyles(m.key, '80px')"
          class="text-center"
          :class="{ 'font-weight-bold text-primary': item[m.key] > 0 }"
        >
          {{ formatNumber(item[m.key] || 0, 0) }}
        </td>

        <!-- Produksi Meter -->
        <td :style="colStyles('krg_kirim_meter', '90px')" class="text-right">
          {{ formatNumber(item.krg_kirim_meter, 2) }}
        </td>
        <td
          :style="colStyles('krg_Cetak_meter', '90px')"
          class="text-right text-error font-weight-bold bg-red-lighten-5"
        >
          {{ formatNumber(item.krg_Cetak_meter, 2) }}
        </td>
        <td :style="colStyles('krg_coly_meter', '90px')" class="text-right">
          {{ formatNumber(item.krg_coly_meter, 2) }}
        </td>
      </tr>

      <!-- Expanded Row: Detail Ukuran & Komponen (Format Tabel) -->
      <tr
        v-if="['2', '3'].includes(jenisIndex) && expanded.includes(item.NOMOR)"
      >
        <td colspan="100" class="bg-grey-lighten-4 pa-3">
          <div
            class="detail-table-wrapper border rounded-lg bg-white elevation-1 pa-3"
          >
            <div
              class="text-subtitle-2 font-weight-bold text-primary mb-2 d-flex align-center"
            >
              <v-icon size="small" class="mr-2">mdi-table-large</v-icon>
              Rincian Detail Ukuran & Komponen — SPK: {{ item.NOMOR }}
            </div>

            <v-table density="compact" class="clean-detail-table border">
              <thead>
                <tr class="bg-blue-darken-2 text-white">
                  <th
                    class="text-center font-weight-bold"
                    style="width: 130px; color: white !important"
                  >
                    Ukuran (Size)
                  </th>
                  <th
                    class="text-right font-weight-bold"
                    style="width: 120px; color: white !important"
                  >
                    Qty Order
                  </th>
                  <th
                    class="text-right font-weight-bold"
                    style="width: 140px; color: white !important"
                  >
                    Kurang Cetak Size
                  </th>
                  <th
                    class="text-left font-weight-bold"
                    style="color: white !important"
                  >
                    Komponen Cetak & Rincian Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(sz, idx) in item.sizes"
                  :key="idx"
                  class="detail-row"
                >
                  <!-- Kolom Size -->
                  <td class="text-center align-middle font-weight-bold py-2">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="font-weight-bold px-3"
                    >
                      {{ sz.size_name }}
                    </v-chip>
                  </td>

                  <!-- Kolom Qty Order -->
                  <td class="text-right align-middle font-weight-medium">
                    {{ formatNumber(sz.size_qty, 0) }}
                  </td>

                  <!-- Kolom Kurang Cetak Size -->
                  <td
                    class="text-right align-middle font-weight-bold"
                    :class="
                      sz.size_krg_cetak > 0 ? 'text-error' : 'text-success'
                    "
                  >
                    {{ formatNumber(sz.size_krg_cetak, 0) }}
                  </td>

                  <!-- Kolom Rincian Komponen (Sub-Tabel Minimalis) -->
                  <td class="py-2 px-0">
                    <table class="w-100 inner-sub-table">
                      <thead>
                        <tr
                          class="text-grey-darken-1 text-caption bg-grey-lighten-4"
                        >
                          <th class="text-left py-1 px-2 font-weight-bold">
                            Nama Komponen
                          </th>
                          <th
                            class="text-right py-1 px-2 font-weight-bold"
                            style="width: 120px"
                          >
                            Sudah Dicetak
                          </th>
                          <th
                            class="text-right py-1 px-2 font-weight-bold"
                            style="width: 120px"
                          >
                            Kurang Cetak
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(comp, cIdx) in sz.components"
                          :key="cIdx"
                          class="sub-row"
                        >
                          <td
                            class="text-left py-1 px-2 font-weight-medium text-body-2"
                          >
                            {{ comp.komponen_nama }}
                          </td>
                          <td
                            class="text-right py-1 px-2 text-success font-weight-medium"
                          >
                            {{ formatNumber(comp.qty_cetak, 0) }}
                          </td>
                          <td
                            class="text-right py-1 px-2 font-weight-medium"
                            :class="
                              comp.kurang_cetak > 0 ? 'text-error' : 'text-grey'
                            "
                          >
                            {{ formatNumber(comp.kurang_cetak, 0) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </td>
      </tr>
    </template>

    <!-- Slot Total Footer -->
    <template #tfoot="{ formatNumber }">
      <tr class="table-footer-row">
        <td
          colspan="9"
          class="text-right font-weight-black text-uppercase sticky-footer-title"
        >
          TOTAL (FILTERED):
        </td>

        <template v-for="sub in subPcs" :key="sub.key">
          <td
            :style="colStyles(sub.key, '90px')"
            class="text-right font-weight-black"
            :class="{
              'text-error': sub.key === 'krg_Cetak',
              'text-success': sub.key === 'spk_jumlah_kirim',
            }"
          >
            {{ formatNumber(totals[sub.key], 0) }}
          </td>
        </template>

        <td
          :style="colStyles('cetak_luarx', '90px')"
          class="text-right font-weight-black border-l border-r"
        >
          {{ formatNumber(totals.cetak_luarx, 0) }}
        </td>

        <td
          v-for="m in mesinColumns"
          :key="m.key"
          :style="colStyles(m.key, '80px')"
          class="text-center font-weight-black"
        >
          {{ formatNumber(totals[m.key] || 0, 0) }}
        </td>

        <td
          :style="colStyles('krg_kirim_meter', '90px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals.krg_kirim_meter, 2) }}
        </td>
        <td
          :style="colStyles('krg_Cetak_meter', '90px')"
          class="text-right font-weight-black text-error bg-red-lighten-5"
        >
          {{ formatNumber(totals.krg_Cetak_meter, 2) }}
        </td>
        <td
          :style="colStyles('krg_coly_meter', '90px')"
          class="text-right font-weight-black"
        >
          {{ formatNumber(totals.krg_coly_meter, 2) }}
        </td>
      </tr>
    </template>
  </BaseReportLayout>

  <!-- Summary Card Tambahan -->
  <div class="d-flex justify-end mt-3 px-2">
    <v-card
      flat
      class="border rounded-lg overflow-hidden"
      style="min-width: 650px"
    >
      <v-table density="compact" class="summary-table">
        <tbody>
          <tr>
            <td class="sum-label" style="width: 20%">Kekurangan Meter:</td>
            <td
              class="sum-value text-error text-subtitle-2 font-weight-bold"
              style="width: 15%"
            >
              {{ formatNumber(totals.krg_Cetak_meter, 2) }}
            </td>
            <td class="sum-label text-center" style="width: 15%">
              Output / Hari:
            </td>
            <td
              class="sum-value text-center font-weight-bold bg-blue-lighten-5"
              style="width: 15%"
            >
              3.100,00
            </td>
            <td class="sum-label" style="width: 20%">Kekurangan Coly:</td>
            <td
              class="sum-value text-error text-subtitle-2 font-weight-bold"
              style="width: 15%"
            >
              {{ formatNumber(totals.krg_coly_meter, 2) }}
            </td>
            <td class="sum-label text-center" style="width: 15%">
              Output / Hari:
            </td>
            <td
              class="sum-value text-center font-weight-bold bg-teal-lighten-5"
              style="width: 15%"
            >
              2.700,00
            </td>
          </tr>
          <tr>
            <td class="sum-label">Waiting List (Meter):</td>
            <td colspan="3" class="sum-value text-primary font-weight-bold">
              {{ formatNumber(waitingListMeter, 2) }} Hari
              <span class="text-caption text-grey">(Krg Meter / 3.100)</span>
            </td>
            <td class="sum-label">Estimasi (Coly):</td>
            <td
              colspan="3"
              class="sum-value text-teal-darken-2 font-weight-bold"
            >
              {{ formatNumber(estimasiColy, 2) }} Hari
              <span class="text-caption text-grey">(Krg Coly / 2.700)</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- Preview Dialog -->
  <v-dialog
    v-model="showPreviewDialog"
    max-width="1200px"
    width="95vw"
    height="92vh"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column" style="height: 92vh; max-height: 92vh">
      <v-toolbar
        color="grey-darken-4"
        density="compact"
        class="flex-grow-0 flex-shrink-0"
      >
        <v-icon class="ml-3 mr-2" color="teal-lighten-2"
          >mdi-file-eye-outline</v-icon
        >
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">
          Preview SPK — {{ previewSpkNomor }}
        </v-toolbar-title>
        <v-chip
          color="error"
          size="x-small"
          label
          class="mr-3 font-weight-bold"
        >
          PREVIEW MODE (DILARANG DICETAK)
        </v-chip>
        <v-spacer />
        <v-btn icon variant="text" @click="showPreviewDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text
        class="pa-0 flex-grow-1 position-relative bg-grey-lighten-3 iframe-wrapper"
      >
        <div
          v-if="isIframeLoading"
          class="preview-loading-overlay d-flex flex-column align-center justify-center"
        >
          <v-progress-circular indeterminate color="primary" size="48" />
          <span class="text-caption text-grey-darken-2 mt-3 font-weight-medium">
            Memuat dokumen preview SPK...
          </span>
        </div>
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="preview-iframe"
          @load="handleIframeLoaded"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions
        class="bg-white py-2 px-4 justify-space-between flex-grow-0 flex-shrink-0"
      >
        <span class="text-caption text-grey-darken-1">
          * Mode preview untuk pengecekan data visual &amp; layout SPK.
        </span>
        <v-btn
          color="grey-darken-1"
          variant="tonal"
          size="small"
          class="px-4 font-weight-bold"
          @click="showPreviewDialog = false"
        >
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import BaseReportLayout from "@/components/BaseReportLayout.vue";
import api from "@/services/api";
import { format, parseISO, isValid } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx-js-style";

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endDate = ref(formatDate(new Date()));
const startDate = ref(formatDate(getStartOfMonth(new Date())));
const jenisIndex = ref("0");
const searchQuery = ref("");
const loading = reactive({ report: false });
const allData = ref<any[]>([]);
const summary = ref({ outputPerHari: "0", estimasiSelesaiHari: "0" });
const showPreviewDialog = ref<boolean>(false);
const previewUrl = ref<string>("");
const previewSpkNomor = ref<string>("");
const isIframeLoading = ref<boolean>(true);
const expanded = ref<string[]>([]);

// --- PERSISTENCE & LAYOUT STATE (Resizing) ---
const storageKey = computed(() => `mmt_report_layout_LMKP_${jenisIndex.value}`);
const loadColWidths = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(storageKey.value);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveColWidths = (widths: Record<string, string>) => {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(widths));
  } catch {}
};

const colWidths = ref<Record<string, string>>(loadColWidths());

const colStyles = (key: string, defaultWidth?: string) => {
  const w = colWidths.value[key] || defaultWidth;
  return w ? { width: w, minWidth: w, maxWidth: w } : {};
};

const resizingKey = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent, key: string, defaultWidthPx = 120) => {
  resizingKey.value = key;
  startX.value = e.clientX;
  const currentW = colWidths.value[key];
  let w = currentW ? parseInt(currentW, 10) : defaultWidthPx;
  if (isNaN(w)) w = defaultWidthPx;
  startWidth.value = w;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingKey.value) return;
  const diff = e.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diff);
  colWidths.value = {
    ...colWidths.value,
    [resizingKey.value]: `${newWidth}px`,
  };
};

const onMouseUp = () => {
  if (resizingKey.value) {
    saveColWidths(colWidths.value);
  }
  resizingKey.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
};

// --- HTML5 NATIVE DRAG & DROP REORDER SETUP ---
const setupTableReorder = () => {
  nextTick(() => {
    setTimeout(() => {
      const table = document.querySelector(".custom-modern-table table");
      if (!table) return;

      const thead = table.querySelector("thead");
      if (!thead) return;
      const headerRows = thead.querySelectorAll("tr");
      if (headerRows.length < 2) return;

      // Ambil baris sub-header bawah sebagai pemicu drag kolom individual
      const subHeaderRow = headerRows[headerRows.length - 1];
      const subThs = subHeaderRow.querySelectorAll("th");

      subThs.forEach((th: any, subIndex: number) => {
        th.setAttribute("draggable", "true");

        th.addEventListener("dragstart", (e: DragEvent) => {
          th.classList.add("col-dragging");
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(subIndex));
          }
          e.stopPropagation();
        });

        th.addEventListener("dragend", () => {
          th.classList.remove("col-dragging");
          table.querySelectorAll("th, td").forEach((el) => {
            el.classList.remove("col-drag-over");
          });
        });

        th.addEventListener("dragover", (e: DragEvent) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        });

        th.addEventListener("dragenter", () => {
          th.classList.add("col-drag-over");
        });

        th.addEventListener("dragleave", () => {
          th.classList.remove("col-drag-over");
        });

        th.addEventListener("drop", (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const srcIdxStr = e.dataTransfer?.getData("text/plain");
          if (srcIdxStr === undefined) return;
          const srcIdx = parseInt(srcIdxStr, 10);
          const targetIdx = subIndex;

          if (isNaN(srcIdx) || srcIdx === targetIdx) return;

          // Pindahkan sel secara serentak di semua baris tabel (header, tbody, tfoot)
          const allRows = table.querySelectorAll("tr");
          allRows.forEach((row) => {
            const cells = row.children;
            if (cells[srcIdx] && cells[targetIdx]) {
              if (srcIdx < targetIdx) {
                row.insertBefore(cells[srcIdx], cells[targetIdx].nextSibling);
              } else {
                row.insertBefore(cells[srcIdx], cells[targetIdx]);
              }
            }
          });
        });
      });
    }, 500);
  });
};

// --- SORTING & FILTERING STATE ---
const columnFilters = reactive({
  NOMOR: "",
  spk_nama: "",
  KAIN: "SEMUA",
});

const sortKey = ref("NOMOR");
const sortOrder = ref<"asc" | "desc">("asc");

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const getSortIcon = (key: string) => {
  if (sortKey.value !== key) return "⇅";
  return sortOrder.value === "asc" ? "▲" : "▼";
};

const hasActiveFilter = computed(() => {
  return (
    Boolean(searchQuery.value) ||
    Boolean(columnFilters.NOMOR) ||
    Boolean(columnFilters.spk_nama) ||
    (columnFilters.KAIN && columnFilters.KAIN !== "SEMUA")
  );
});

const handlePreview = (nomorSpk: string) => {
  if (!nomorSpk || nomorSpk === "-") {
    alert("SPK belum dibuat atau nomor SPK tidak valid.");
    return;
  }
  previewSpkNomor.value = nomorSpk;
  isIframeLoading.value = true;
  previewUrl.value = `/mmt/so-spk/print/${encodeURIComponent(nomorSpk)}?preview=1`;
  showPreviewDialog.value = true;
};

const handleIframeLoaded = () => {
  isIframeLoading.value = false;
};

const resetAllFilters = () => {
  searchQuery.value = "";
  columnFilters.NOMOR = "";
  columnFilters.spk_nama = "";
  columnFilters.KAIN = "SEMUA";
  sortKey.value = "NOMOR";
  sortOrder.value = "asc";
};

const kainOptions = computed(() => {
  const list = allData.value.map((x) => x.KAIN).filter(Boolean);
  return ["SEMUA", ...new Set(list)];
});

const jenisLabel = computed(() => {
  if (jenisIndex.value === "1") return "MX";
  if (jenisIndex.value === "2") return "PAPERPRINT";
  if (jenisIndex.value === "3") return "SUBLIM";
  return "MT";
});

const subPcs = computed(() => {
  if (jenisIndex.value === "1") {
    return [
      { label: "Order", key: "spk_jumlah" },
      { label: "K-Cetak", key: "krg_Cetak" },
      { label: "K-Jahit", key: "krg_Jahit" },
      { label: "K-Coly", key: "krg_coly" },
      { label: "K-Kirim", key: "krg_kirim" },
      { label: "Kirim", key: "spk_jumlah_kirim" },
    ];
  }
  if (jenisIndex.value === "2") {
    return [
      { label: "Order", key: "spk_jumlah" },
      { label: "K-Cetak", key: "krg_Cetak" },
    ];
  }
  if (jenisIndex.value === "3") {
    return [
      { label: "Order", key: "spk_jumlah" },
      { label: "K-Cetak", key: "krg_Cetak" },
      { label: "K-Mutasi P04", key: "krg_mutasi_p04" },
    ];
  }
  return [
    { label: "Order", key: "spk_jumlah" },
    { label: "K-Cetak", key: "krg_Cetak" },
    { label: "K-Seam", key: "krg_Seaming" },
    { label: "K-M.Ayam", key: "krg_mataayam" },
    { label: "K-Coly", key: "krg_coly" },
    { label: "K-Kirim", key: "krg_kirim" },
    { label: "Kirim", key: "spk_jumlah_kirim" },
  ];
});

const mesinColumns = computed(() => {
  if (jenisIndex.value === "1") {
    return [
      { label: "MX01", key: "mx01" },
      { label: "MX02", key: "mx02" },
      { label: "MX03", key: "mx03" },
      { label: "MX04", key: "mx04" },
      { label: "MX05", key: "mx05" },
    ];
  } else if (jenisIndex.value === "2") {
    return [
      { label: "SB01", key: "sb01" },
      { label: "SB02", key: "sb02" },
      { label: "SB03", key: "sb03" },
    ];
  } else if (jenisIndex.value === "3") {
    return [{ label: "RTR", key: "rtr" }];
  }
  return [];
});

const fetchReport = async () => {
  loading.report = true;
  try {
    const res = await api.get("mmt/monitoring/laporan-lmkp/lmkp", {
      params: {
        jenisIndex: jenisIndex.value,
        startDate: startDate.value,
        endDate: endDate.value,
      },
    });
    allData.value = res.data.data || [];
    summary.value = res.data.summary || summary.value;
    setupTableReorder();
  } catch (error) {
    console.error("Gagal memuat laporan LMKP:", error);
    allData.value = [];
  } finally {
    loading.report = false;
  }
};

const onJenisChange = () => {
  fetchReport();
  colWidths.value = loadColWidths();
};

const getTimestamp = (val: any): number => {
  if (!val) return 0;
  const strVal = String(val).trim();
  const parsedISO = parseISO(strVal);
  if (isValid(parsedISO)) return parsedISO.getTime();
  const fallbackDate = new Date(strVal).getTime();
  return isNaN(fallbackDate) ? 0 : fallbackDate;
};

const DATE_KEYS = ["spk_tanggal", "deadline"];
const NUMERIC_KEYS = [
  "PANJANG",
  "LEBAR",
  "spk_gramasi",
  "spk_jumlah",
  "spk_jumlah_kirim",
  "krg_kirim",
  "krg_Seaming",
  "krg_Jahit",
  "krg_mataayam",
  "krg_Cetak",
  "krg_coly",
  "cetak_luarx",
  "krg_kirim_meter",
  "krg_Cetak_meter",
  "krg_coly_meter",
  "mt01",
  "mt02",
  "mt03",
  "mt04",
  "mt05",
  "mi",
  "mx01",
  "mx02",
  "mx03",
  "mx04",
  "mx05",
  "sb01",
  "sb02",
  "sb03",
  "sb04",
  "sb05",
];

const filteredData = computed(() => {
  let result = [...allData.value];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item: any) => {
      return (
        item.NOMOR?.toLowerCase().includes(q) ||
        item.spk_nama?.toLowerCase().includes(q) ||
        item.KAIN?.toLowerCase().includes(q) ||
        item.FINISHING?.toLowerCase().includes(q)
      );
    });
  }

  if (columnFilters.NOMOR) {
    const q = columnFilters.NOMOR.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.NOMOR?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.spk_nama) {
    const q = columnFilters.spk_nama.toLowerCase().trim();
    result = result.filter((item: any) =>
      item.spk_nama?.toLowerCase().includes(q),
    );
  }

  if (columnFilters.KAIN && columnFilters.KAIN !== "SEMUA") {
    result = result.filter((item: any) => item.KAIN === columnFilters.KAIN);
  }

  if (sortKey.value) {
    const key = sortKey.value;
    const isAsc = sortOrder.value === "asc";

    result.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (DATE_KEYS.includes(key)) {
        const timeA = getTimestamp(valA);
        const timeB = getTimestamp(valB);
        return isAsc ? timeA - timeB : timeB - timeA;
      }

      if (NUMERIC_KEYS.includes(key)) {
        const numA =
          valA !== null && valA !== undefined && valA !== "" ? Number(valA) : 0;
        const numB =
          valB !== null && valB !== undefined && valB !== "" ? Number(valB) : 0;
        return isAsc ? numA - numB : numB - numA;
      }

      const strA = valA !== null && valA !== undefined ? String(valA) : "";
      const strB = valB !== null && valB !== undefined ? String(valB) : "";

      const res = strA.localeCompare(strB, "id", {
        numeric: true,
        sensitivity: "base",
      });

      return isAsc ? res : -res;
    });
  }

  return result;
});

const totals = computed(() => {
  return filteredData.value.reduce(
    (acc, item: any) => {
      acc.spk_jumlah += Number(item.spk_jumlah || 0);
      acc.spk_jumlah_kirim += Number(item.spk_jumlah_kirim || 0);
      acc.krg_kirim += Number(item.krg_kirim || 0);
      acc.krg_Seaming += Number(item.krg_Seaming || 0);
      acc.krg_Jahit += Number(item.krg_Jahit || 0);
      acc.krg_mataayam += Number(item.krg_mataayam || 0);
      acc.krg_Cetak += Number(item.krg_Cetak || 0);
      acc.krg_coly += Number(item.krg_coly || 0);
      acc.cetak_luarx += Number(item.cetak_luarx || 0);

      acc.mt01 += Number(item.mt01 || 0);
      acc.mt02 += Number(item.mt02 || 0);
      acc.mt03 += Number(item.mt03 || 0);
      acc.mt04 += Number(item.mt04 || 0);
      acc.mt05 += Number(item.mt05 || 0);
      acc.mi += Number(item.mi || 0);

      acc.mx01 += Number(item.mx01 || 0);
      acc.mx02 += Number(item.mx02 || 0);
      acc.mx03 += Number(item.mx03 || 0);
      acc.mx04 += Number(item.mx04 || 0);
      acc.mx05 += Number(item.mx05 || 0);

      acc.sb01 += Number(item.sb01 || 0);
      acc.sb02 += Number(item.sb02 || 0);
      acc.sb03 += Number(item.sb03 || 0);
      acc.sb04 += Number(item.sb04 || 0);
      acc.sb05 += Number(item.sb05 || 0);

      acc.krg_kirim_meter += Number(item.krg_kirim_meter || 0);
      acc.krg_Cetak_meter += Number(item.krg_Cetak_meter || 0);
      acc.krg_coly_meter += Number(item.krg_coly_meter || 0);
      return acc;
    },
    {
      spk_jumlah: 0,
      spk_jumlah_kirim: 0,
      krg_kirim: 0,
      krg_Seaming: 0,
      krg_Jahit: 0,
      krg_mataayam: 0,
      krg_Cetak: 0,
      krg_coly: 0,
      cetak_luarx: 0,
      mt01: 0,
      mt02: 0,
      mt03: 0,
      mt04: 0,
      mt05: 0,
      mi: 0,
      mx01: 0,
      mx02: 0,
      mx03: 0,
      mx04: 0,
      mx05: 0,
      sb01: 0,
      sb02: 0,
      sb03: 0,
      sb04: 0,
      sb05: 0,
      krg_kirim_meter: 0,
      krg_Cetak_meter: 0,
      krg_coly_meter: 0,
    },
  );
});

const outputMeterTarget = 3100;
const outputColyTarget = 2700;

const waitingListMeter = computed(() => {
  const krgMeter = Number(totals.value.krg_Cetak_meter || 0);
  return krgMeter <= 0 ? 0 : krgMeter / outputMeterTarget;
});

const estimasiColy = computed(() => {
  const krgColy = Number(totals.value.krg_coly_meter || 0);
  return krgColy <= 0 ? 0 : krgColy / outputColyTarget;
});

const toggleExpand = (nomor: string) => {
  const index = expanded.value.indexOf(nomor);
  if (index > -1) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(nomor);
  }
};

const formatNumber = (val: any, dec = 0) => {
  if (val === null || val === undefined || val === "") return "0";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, "dd/MM/yyyy") : dateStr;
};

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = parseISO(dateStr);
  if (!isValid(date)) return dateStr;
  return format(date, "dd MMMM yyyy", { locale: id });
};

// --- EXPORT TO EXCEL DENGAN DETAIL UKURAN & KOMPONEN MEMANJANG KE KANAN ---
const exportToExcel = (dataToExport: any[]) => {
  if (!dataToExport || dataToExport.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }
  const fileName = `Laporan_LMKP_${jenisLabel.value}_${startDate.value}_sd_${endDate.value}.xlsx`;
  const num = (value: any) => (isNaN(Number(value)) ? 0 : Number(value));
  const excelDate = (dateStr: any) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isValid(dateStr) ? dateStr : null;
    const str = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const parsed = parseISO(str);
      if (isValid(parsed)) return parsed;
    }
    const fallback = new Date(str);
    return isValid(fallback) ? fallback : null;
  };

  const borderThin = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const styleHeaderMain = {
    fill: { fgColor: { rgb: "1E3A8A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleHeaderSub = {
    fill: { fgColor: { rgb: "2563EB" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderThin,
  };

  const styleDataCell = {
    font: { sz: 9, color: { rgb: "0F172A" } },
    alignment: { vertical: "center" },
    border: borderThin,
  };

  const styleDetailHeader = {
    fill: { fgColor: { rgb: "DBEAFE" } },
    font: { bold: true, sz: 9, color: { rgb: "1E3A8A" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: borderThin,
  };

  const styleDetailCell = {
    fill: { fgColor: { rgb: "F8FAFC" } },
    font: { sz: 8.5, color: { rgb: "334155" } },
    alignment: { vertical: "center" },
    border: borderThin,
  };

  const styleFooterCell = {
    fill: { fgColor: { rgb: "c7ecfe" } },
    font: { bold: true, sz: 10, color: { rgb: "000000" } },
    border: {
      top: { style: "double", color: { rgb: "000000" } },
      bottom: { style: "thick", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  const formattedStart = formatDateFull(startDate.value);
  const formattedEnd = formatDateFull(endDate.value);

  const wsData: any[] = [
    [{ v: "LAPORAN MONITORING LMKP", s: { font: { bold: true, sz: 14 } } }],
    [{ v: `Periode : ${formattedStart} s/d ${formattedEnd}` }],
    [{ v: `Kategori: ${jenisLabel.value}` }],
    [],
  ];

  const headerRow1 = [
    { v: "NOMOR SPK", s: styleHeaderMain },
    { v: "NAMA ORDER", s: styleHeaderMain },
    { v: "TANGGAL", s: styleHeaderMain },
    { v: "DEADLINE", s: styleHeaderMain },
    { v: "BAHAN", s: styleHeaderMain },
    { v: "GRAMASI", s: styleHeaderMain },
    { v: "PANJANG", s: styleHeaderMain },
    { v: "LEBAR", s: styleHeaderMain },
    { v: "FINISHING", s: styleHeaderMain },
    { v: "PRODUKSI (PCS)", s: styleHeaderMain },
  ];

  for (let i = 1; i < subPcs.value.length; i++) {
    headerRow1.push({ v: "", s: styleHeaderMain });
  }

  headerRow1.push({ v: "CTK L.", s: styleHeaderMain });
  if (mesinColumns.value.length > 0) {
    headerRow1.push({ v: "MESIN", s: styleHeaderMain });
    for (let i = 1; i < mesinColumns.value.length; i++) {
      headerRow1.push({ v: "", s: styleHeaderMain });
    }
  }

  headerRow1.push({ v: "PRODUKSI (METER)", s: styleHeaderMain }, "", "");
  wsData.push(headerRow1);

  const subMeter = ["K-KRM", "K-CTK", "K-CLY"];
  const headerRow2 = Array(9).fill({ v: "", s: styleHeaderMain });
  subPcs.value.forEach((sub) =>
    headerRow2.push({ v: sub.label, s: styleHeaderSub }),
  );
  headerRow2.push({ v: "", s: styleHeaderMain });

  mesinColumns.value.forEach((m) => {
    headerRow2.push({ v: m.label, s: styleHeaderSub });
  });

  subMeter.forEach((h) => headerRow2.push({ v: h, s: styleHeaderSub }));
  wsData.push(headerRow2);

  dataToExport.forEach((item: any) => {
    const tglDate = excelDate(item.spk_tanggal);
    const deadlineDate = excelDate(item.deadline);

    const row = [
      {
        v: item.NOMOR || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.spk_nama || "", s: styleDataCell },
      {
        v: tglDate || "",
        t: "d",
        z: "dd/mm/yyyy",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: deadlineDate || "",
        t: "d",
        z: "dd/mm/yyyy",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.KAIN || "", s: styleDataCell },
      {
        v: item.spk_gramasi || "",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.PANJANG),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      {
        v: num(item.LEBAR),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      },
      { v: item.FINISHING || "", s: styleDataCell },
    ];

    subPcs.value.forEach((sub) => {
      row.push({
        v: num(item[sub.key]),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      });
    });

    row.push({
      v: num(item.cetak_luarx),
      t: "n",
      z: "#,##0",
      s: { ...styleDataCell, alignment: { horizontal: "right" } },
    });

    mesinColumns.value.forEach((m) => {
      row.push({
        v: num(item[m.key]),
        t: "n",
        z: "#,##0",
        s: { ...styleDataCell, alignment: { horizontal: "center" } },
      });
    });

    row.push(
      {
        v: num(item.krg_kirim_meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.krg_Cetak_meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
      {
        v: num(item.krg_coly_meter),
        t: "n",
        z: "#,##0.00",
        s: { ...styleDataCell, alignment: { horizontal: "right" } },
      },
    );

    wsData.push(row);

    // --- TAMBAHKAN BARIS DETAIL FORMAT TABEL MEMANJANG KE KANAN ---
    if (
      ["2", "3"].includes(jenisIndex.value) &&
      item.sizes &&
      item.sizes.length > 0
    ) {
      // Baris Header Sub-Tabel Detail
      wsData.push([
        { v: `   [DETAIL UKURAN]`, s: styleDetailHeader },
        { v: `Size`, s: styleDetailHeader },
        { v: `Qty Order`, s: styleDetailHeader },
        { v: `Krg Cetak`, s: styleDetailHeader },
        { v: `Nama Komponen`, s: styleDetailHeader },
        { v: `Sudah Dicetak`, s: styleDetailHeader },
        { v: `Kurang Cetak`, s: styleDetailHeader },
        ...Array(Math.max(0, headerRow1.length - 7)).fill({
          v: "",
          s: styleDetailHeader,
        }),
      ]);

      item.sizes.forEach((sz: any) => {
        if (sz.components && sz.components.length > 0) {
          sz.components.forEach((comp: any) => {
            wsData.push([
              { v: "", s: styleDetailCell },
              {
                v: sz.size_name,
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "center" },
                },
              },
              {
                v: num(sz.size_qty),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right" },
                },
              },
              {
                v: num(sz.size_krg_cetak),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right" },
                },
              },
              { v: comp.komponen_nama, s: styleDetailCell },
              {
                v: num(comp.qty_cetak),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right" },
                },
              },
              {
                v: num(comp.kurang_cetak),
                t: "n",
                z: "#,##0",
                s: {
                  ...styleDetailCell,
                  alignment: { horizontal: "right" },
                },
              },
              ...Array(Math.max(0, headerRow1.length - 7)).fill({
                v: "",
                s: styleDetailCell,
              }),
            ]);
          });
        } else {
          wsData.push([
            { v: "", s: styleDetailCell },
            {
              v: sz.size_name,
              s: { ...styleDetailCell, alignment: { horizontal: "center" } },
            },
            {
              v: num(sz.size_qty),
              t: "n",
              z: "#,##0",
              s: { ...styleDetailCell, alignment: { horizontal: "right" } },
            },
            {
              v: num(sz.size_krg_cetak),
              t: "n",
              z: "#,##0",
              s: { ...styleDetailCell, alignment: { horizontal: "right" } },
            },
            { v: "-", s: styleDetailCell },
            { v: 0, t: "n", z: "#,##0", s: styleDetailCell },
            { v: 0, t: "n", z: "#,##0", s: styleDetailCell },
            ...Array(Math.max(0, headerRow1.length - 7)).fill({
              v: "",
              s: styleDetailCell,
            }),
          ]);
        }
      });
    }
  });

  // Footer Total Excel
  const footerRow = [
    {
      v: "TOTAL (FILTERED)",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    },
    ...Array(8).fill({ v: "", s: styleFooterCell }),
  ];

  subPcs.value.forEach((sub) => {
    footerRow.push({
      v: num(totals.value[sub.key]),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    });
  });

  footerRow.push({
    v: num(totals.value.cetak_luarx),
    t: "n",
    z: "#,##0",
    s: { ...styleFooterCell, alignment: { horizontal: "right" } },
  });

  mesinColumns.value.forEach((m) => {
    footerRow.push({
      v: num(totals.value[m.key]),
      t: "n",
      z: "#,##0",
      s: { ...styleFooterCell, alignment: { horizontal: "center" } },
    });
  });

  footerRow.push(
    {
      v: num(totals.value.krg_kirim_meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.krg_Cetak_meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
    {
      v: num(totals.value.krg_coly_meter),
      t: "n",
      z: "#,##0.00",
      s: { ...styleFooterCell, alignment: { horizontal: "right" } },
    },
  );

  wsData.push(footerRow);

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LMKP");
  XLSX.writeFile(wb, fileName);
};

onMounted(fetchReport);
</script>

<style scoped>
/* Warna Teks Seluruh Header Menjadi Putih */
:deep(.custom-modern-table th),
:deep(.header-main th),
:deep(.header-sub th),
:deep(.header-group),
:deep(thead th),
:deep(thead span),
:deep(thead .v-icon) {
  color: #ffffff !important;
}

/* Pastikan ikon filter dan sorting di header juga putih */
:deep(thead .btn-filter-icon .v-icon) {
  color: #ffffff !important;
}

/* Penyesuaian Tabel Wrapper */
:deep(.v-table__wrapper),
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 280px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

:deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 12px !important;
}

:deep(th),
:deep(td) {
  font-size: 12px !important;
  white-space: nowrap !important;
  padding: 6px 8px !important;
}

:deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.header-main th {
  background: linear-gradient(180deg, #142f7b 0%, #3b82f6 100%) !important;
  border-right: 1px solid #3b82f6 !important;
}

.header-sub th {
  background: #2563eb !important;
  font-size: 11px !important;
  border-right: 1px solid #60a5fa !important;
}

.header-group {
  border-left: 1px solid #60a5fa !important;
  border-right: 1px solid #60a5fa !important;
}

:deep(tfoot) {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 10 !important;
}

.table-footer-row td {
  background-color: #c7ecfe !important;
  border-top: 2px solid #000 !important;
  border-bottom: 2px solid #000 !important;
  color: #0f172a !important;
}

:deep(.sticky-col-1) {
  position: sticky !important;
  left: 0px !important;
}

:deep(.sticky-col-2) {
  position: sticky !important;
  left: 140px !important;
  box-shadow: 3px 0px 5px -2px rgba(0, 0, 0, 0.15);
}

:deep(tbody .sticky-col-1),
:deep(tbody .sticky-col-2) {
  z-index: 5 !important;
  background-color: #ffffff !important;
}

:deep(thead .sticky-col-1),
:deep(thead .sticky-col-2) {
  z-index: 12 !important;
  background-color: #1e3a8a !important;
}

:deep(tfoot .sticky-col-1),
:deep(tfoot .sticky-col-2),
:deep(tfoot .sticky-footer-title) {
  z-index: 12 !important;
  background-color: #fef3c7 !important;
}

/* Komponen Detail Block */
.size-block {
  border-color: #e2e8f0 !important;
}
.component-chip {
  border-color: #cbd5e1 !important;
}

/* Styling Drag & Drop & Resizer */
:deep(.draggable-th) {
  cursor: grab !important;
}
:deep(.draggable-th:active) {
  cursor: grabbing !important;
}
:deep(.col-dragging) {
  opacity: 0.4;
  background-color: #cbd5e1 !important;
}
:deep(.col-drag-over) {
  background-color: rgba(25, 118, 210, 0.3) !important;
  box-shadow: inset 3px 0 0 #1976d2;
}
:deep(.col-drag-handle) {
  cursor: grab;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}
:deep(.col-drag-handle:active) {
  cursor: grabbing;
}

:deep(.column-resizer) {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 25;
}
:deep(.column-resizer:hover),
:deep(th:hover .column-resizer) {
  background-color: rgba(255, 255, 255, 0.4);
}

.bg-blue-header {
  background-color: #1d4ed8 !important;
  color: white !important;
}
.bg-cyan-header {
  background-color: #0891b2 !important;
  color: white !important;
}
.bg-teal-header {
  background-color: #0d9488 !important;
  color: white !important;
}

.bg-blue-sub {
  background-color: #1e40af !important;
  color: white !important;
}
.bg-cyan-sub {
  background-color: #0e7490 !important;
  color: white !important;
}
.bg-teal-sub {
  background-color: #0f766e !important;
  color: white !important;
}

.border-l {
  border-left: 1px solid #cbd5e1 !important;
}
.border-r {
  border-right: 1px solid #cbd5e1 !important;
}
.cursor-pointer {
  cursor: pointer;
}
.select-none {
  user-select: none;
}
.btn-filter-icon {
  opacity: 0.85;
}
.btn-filter-icon:hover {
  opacity: 1;
}

.summary-table td {
  padding: 6px 12px !important;
  font-size: 12px !important;
  border-bottom: 1px solid #e2e8f0;
}
.sum-label {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}
.sum-value {
  text-align: right;
  color: #0f172a;
}
.iframe-wrapper {
  height: calc(92vh - 100px) !important;
  min-height: 500px;
  overflow: hidden;
}
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.preview-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;
}

/* Styling Tambahan untuk Tabel Detail Clean */
.clean-detail-table th {
  background-color: #1e3a8a !important;
  font-size: 11px !important;
  letter-spacing: 0.3px;
}

.clean-detail-table td {
  border-bottom: 1px solid #e2e8f0 !important;
  vertical-align: middle !important;
}

.inner-sub-table {
  border-collapse: collapse !important;
  background: transparent !important;
}
.inner-sub-table th,
.inner-sub-table :deep(th) {
  background-color: #81afe8 !important; /* Warna latar header sub-tabel lebih kontras */
  color: #0f172a !important; /* Warna teks hitam gelap pekat */
  font-weight: 700 !important;
  font-size: 11px !important;
  opacity: 1 !important;
}

.inner-sub-table td {
  border-bottom: 1px dashed #e2e8f0 !important;
  font-size: 11px !important;
}

.sub-row:last-child td {
  border-bottom: none !important;
}
</style>
