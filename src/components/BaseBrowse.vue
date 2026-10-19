<template>
  <PageLayout :title="title" :icon="icon">
    <!-- Header Action Buttons -->
    <template #header-actions>
      <v-btn size="x-small" color="success" @click="$emit('action:new')">
        <v-icon start>mdi-plus</v-icon> Baru
      </v-btn>
      <v-btn
        size="x-small"
        color="warning"
        :disabled="!isSingleSelected"
        @click="$emit('action:edit')"
      >
        <v-icon start>mdi-pencil</v-icon> Ubah
      </v-btn>
      <v-btn
        size="x-small"
        color="error"
        :disabled="!isSingleSelected"
        @click="$emit('action:delete')"
      >
        <v-icon start>mdi-trash-can</v-icon> Hapus
      </v-btn>

      <!-- Slot untuk Tombol Ekstra (ACC, Rekap, Export, dll) -->
      <slot
        name="extra-actions"
        :isSingleSelected="isSingleSelected"
        :selected="selected"
      ></slot>

      <v-divider vertical class="mx-2" v-if="hasPrint" />

      <v-btn
        v-if="hasPrint"
        size="x-small"
        color="info"
        :disabled="!isSingleSelected"
        @click="$emit('action:print')"
      >
        <v-icon start>mdi-printer</v-icon> Cetak
      </v-btn>

      <!-- Tombol Reset Urutan Kolom jika ada kustomisasi -->
      <v-btn
        v-if="colOrder.length > 0"
        size="x-small"
        color="blue-grey"
        variant="tonal"
        @click="resetColOrder"
        title="Reset urutan kolom ke default"
        class="ml-2"
      >
        <v-icon start>mdi-refresh</v-icon> Reset Kolom
      </v-btn>
    </template>

    <div class="browse-content">
      <!-- Section Toolbar Filter -->
      <v-card flat class="mb-1 filter-card">
        <v-card-text class="pa-2">
          <div class="filter-section d-flex align-center flex-wrap ga-4">
            <template v-if="hasDateFilter">
              <DateRangeFilter
                :start-date="startDateVal"
                :end-date="endDateVal"
                @update:start-date="onStartDateChange"
                @update:end-date="onEndDateChange"
              />
            </template>

            <v-btn
              variant="text"
              size="x-small"
              @click="$emit('refresh')"
              :loading="loading"
            >
              <v-icon>mdi-refresh</v-icon> Refresh
            </v-btn>

            <!-- Slot untuk Filter Tambahan -->
            <slot name="filter-fields"></slot>

            <v-spacer />
          </div>
        </v-card-text>
      </v-card>

      <!-- Tabel Data Utama -->
      <div class="table-container">
        <v-data-table
          ref="tableWrapRef"
          :model-value="selected"
          @update:model-value="$emit('update:selected', $event)"
          :expanded="expanded"
          @update:expanded="$emit('update:expanded', $event)"
          :headers="internalHeaders"
          :items="filteredItems"
          :loading="loading"
          :search="search"
          :item-value="itemValue"
          density="compact"
          class="desktop-table elevation-1"
          fixed-header
          return-object
          :show-expand="computedShowExpand"
          :row-props="mergedRowProps"
          @scroll.passive="onTableScroll"
        >
          <template #headers="{ columns, isSorted, getSortIcon, toggleSort }">
            <tr>
              <template v-for="header in internalHeaders" :key="header.key">
                <th
                  :data-col-key="header.key"
                  :style="{ width: header.width, minWidth: header.minWidth }"
                  :class="[
                    'base-th position-relative',
                    header.align ? `text-${header.align}` : '',
                    dragOverKey === header.key && dragSrcKey !== header.key
                      ? 'col-drag-over'
                      : '',
                    dragSrcKey === header.key ? 'col-dragging' : '',
                  ]"
                  @pointerdown="onColPointerDown(header.key, $event)"
                  @pointermove="onColPointerMove($event)"
                  @pointerup="onColPointerUp"
                  @pointercancel="onColPointerUp"
                >
                  <div class="d-flex align-center justify-space-between w-100">
                    <div class="d-flex align-center overflow-hidden w-100">
                      <!-- Handle Drag Khusus (⠿) -->
                      <span
                        v-if="header.key && header.key !== 'data-table-expand'"
                        class="col-drag-handle mr-1"
                        title="Geser untuk memindahkan kolom"
                        >⠿</span
                      >

                      <span
                        class="font-weight-bold text-truncate mr-1 header-drag-title flex-grow-1"
                        :class="{ 'cursor-pointer': header.sortable !== false }"
                        @click="header.sortable !== false && toggleSort(header)"
                      >
                        {{ header.title }}
                      </span>
                    </div>

                    <div class="d-flex align-center flex-shrink-0">
                      <!-- Menu Filter Excel per Kolom -->
                      <v-menu
                        v-if="header.key !== 'data-table-expand'"
                        v-model="menuStates[header.key]"
                        :close-on-content-click="false"
                        location="bottom start"
                      >
                        <template #activator="{ props: menuProps }">
                          <v-btn
                            icon
                            variant="text"
                            density="compact"
                            size="x-small"
                            v-bind="menuProps"
                            @click.stop
                            @mousedown.stop
                            :color="
                              isColumnFilterActive(header.key)
                                ? 'primary'
                                : 'grey-darken-1'
                            "
                          >
                            <v-icon size="16">
                              {{
                                isColumnFilterActive(header.key)
                                  ? "mdi-filter"
                                  : "mdi-filter-variant"
                              }}
                            </v-icon>
                          </v-btn>
                        </template>

                        <v-card
                          min-width="280"
                          max-width="320"
                          class="pa-2 border shadow-2 rounded-lg"
                        >
                          <v-text-field
                            v-model="columnSearch[header.key]"
                            density="compact"
                            variant="outlined"
                            hide-details
                            clearable
                            autofocus
                            placeholder="Cari..."
                            class="mb-1"
                          />

                          <div
                            class="text-caption text-grey-darken-1 my-1 px-1"
                          >
                            {{ getFilteredPopupOptions(header.key).length }}
                            dari
                            {{ (uniqueValuesMap[header.key] || []).length }}
                            nilai ditampilkan
                          </div>

                          <div
                            class="d-flex ga-2 px-1 mb-2 text-caption font-weight-medium"
                          >
                            <a
                              href="#"
                              class="text-primary text-decoration-none"
                              @click.prevent="selectAllFiltered(header.key)"
                            >
                              Tampilkan Semua
                            </a>
                            <span class="text-grey-lighten-1">|</span>
                            <a
                              href="#"
                              class="text-error text-decoration-none"
                              @click.prevent="deselectAllFiltered(header.key)"
                            >
                              Sembunyikan Semua
                            </a>
                          </div>

                          <v-divider />

                          <div
                            style="max-height: 220px; overflow-y: auto"
                            class="my-1 px-1"
                          >
                            <v-checkbox
                              v-for="opt in getFilteredPopupOptions(header.key)"
                              :key="opt"
                              :label="opt"
                              :model-value="isOptionSelected(header.key, opt)"
                              density="compact"
                              hide-details
                              color="primary"
                              @update:model-value="
                                toggleOption(header.key, opt)
                              "
                            />
                            <div
                              v-if="
                                getFilteredPopupOptions(header.key).length === 0
                              "
                              class="text-caption text-grey text-center py-4"
                            >
                              Tidak ada data
                            </div>
                          </div>

                          <v-divider class="mb-2" />

                          <div
                            class="d-flex justify-space-between align-center"
                          >
                            <v-btn
                              size="x-small"
                              variant="text"
                              color="grey-darken-1"
                              @click="resetColumnFilter(header.key)"
                            >
                              Reset
                            </v-btn>
                            <v-btn
                              size="small"
                              color="primary"
                              variant="flat"
                              class="px-4 font-weight-bold"
                              @click="menuStates[header.key] = false"
                            >
                              OK
                            </v-btn>
                          </div>
                        </v-card>
                      </v-menu>

                      <!-- Slot Suffix Kustom jika ada -->
                      <slot
                        :name="`header-suffix.${header.key}`"
                        :column="header"
                      />

                      <!-- Garis Resizer Handle di Ujung Kanan Header -->
                      <div
                        v-if="header.key !== 'data-table-expand'"
                        class="column-resizer"
                        @mousedown.stop.prevent="
                          startResize($event, header.key)
                        "
                      ></div>
                    </div>
                  </div>
                </th>
              </template>
            </tr>
          </template>

          <!-- Handle Slot #expanded-row bawaan Vuetify 3 -->
          <template #expanded-row="slotProps" v-if="$slots['expanded-row']">
            <slot name="expanded-row" v-bind="slotProps" />
          </template>

          <!-- Fallback/Forward untuk Slot #expanded-content -->
          <template
            #expanded-row="slotProps"
            v-else-if="$slots['expanded-content']"
          >
            <tr>
              <td
                :colspan="slotProps.columns?.length || internalHeaders.length"
                class="pa-3 bg-grey-lighten-4"
              >
                <div
                  class="expanded-container ml-0 pa-3 bg-white rounded-lg elevation-2 border"
                  style="width: 80%; border-left: 4px solid #1976d2 !important"
                >
                  <div class="d-flex align-center mb-2 px-1">
                    <v-icon size="small" color="primary" class="mr-2"
                      >mdi-package-variant-closed</v-icon
                    >
                    <span
                      class="text-caption font-weight-bold text-grey-darken-3"
                    >
                      Detail Items:
                      {{ slotProps.item?.raw?.Nomor || slotProps.item?.Nomor }}
                    </span>
                  </div>

                  <slot name="expanded-content" v-bind="slotProps" />
                </div>
              </td>
            </tr>
          </template>

          <!-- Footer Total (Grand Total) Dinamis -->
          <template #body.append>
            <tr
              v-if="summaryFields && summaryFields.length > 0"
              class="summary-row"
            >
              <td
                v-for="(header, index) in internalHeaders"
                :key="'summary-' + header.key"
                :class="[
                  header.align === 'end' || header.align === 'right'
                    ? 'text-right'
                    : header.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                ]"
              >
                <!-- Menampilkan teks GRAND TOTAL di kolom pertama data -->
                <template
                  v-if="
                    index ===
                    (internalHeaders[0]?.key === 'data-table-expand' ? 1 : 0)
                  "
                >
                  <span class="font-weight-black text-primary"
                    >GRAND TOTAL</span
                  >
                </template>
                <!-- Menampilkan Hasil Kalkulasi Sum -->
                <template v-else-if="summaryFields.includes(header.key)">
                  <span class="font-weight-black text-primary">{{
                    formatTotal(calculateTotal(header.key))
                  }}</span>
                </template>
              </td>
            </tr>
          </template>

          <!-- Forward Semua Dynamic Custom Slots Lainnya -->
          <template
            v-for="(_, slotName) in customSlots"
            #[slotName]="slotProps"
            :key="slotName"
          >
            <slot :name="slotName" v-bind="slotProps ?? {}" />
          </template>
        </v-data-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, useSlots } from "vue";
import PageLayout from "./PageLayout.vue";
import DateRangeFilter from "./DateRangeFilter.vue";

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: "mdi-factory" },
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },

  // Dukungan Fleksibel untuk Date Filter
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  filters: { type: Object, default: null },
  hasDateFilter: { type: Boolean, default: true },

  selected: { type: Array, default: () => [] },
  expanded: { type: Array, default: () => [] },
  filteredItems: { type: Array, default: () => [] },
  search: { type: String, default: "" },
  itemValue: { type: String, default: "Nomor" },
  showExpand: { type: Boolean, default: false },
  hasPrint: { type: Boolean, default: false },
  rowProps: { type: Function, default: () => ({}) },
  summaryFields: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:startDate",
  "update:endDate",
  "update:filters",
  "update:selected",
  "update:expanded",
  "update:filteredItems",
  "refresh",
  "action:new",
  "action:edit",
  "action:delete",
  "action:print",
  "row-click",
]);

const slots = useSlots();

// --- STATE & PERSISTENCE UNTUK URUTAN KOLOM (LOCALSTORAGE) ---
const colOrderKey = computed(
  () => `mmt_browse_colorder_${props.title.replace(/\s+/g, "_")}`,
);

const loadColOrder = (): string[] => {
  try {
    const raw = localStorage.getItem(colOrderKey.value);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveColOrder = (order: string[]) => {
  try {
    localStorage.setItem(colOrderKey.value, JSON.stringify(order));
  } catch {}
};

const colOrder = ref<string[]>(loadColOrder());
const internalHeaders = ref<any[]>([]);

watch(
  () => props.headers,
  (newHeaders) => {
    if (!newHeaders) return;
    let baseHeaders = JSON.parse(JSON.stringify(newHeaders));

    if (colOrder.value.length > 0) {
      const map = new Map(baseHeaders.map((h: any) => [h.key, h]));
      const ordered: any[] = [];
      for (const key of colOrder.value) {
        if (map.has(key)) ordered.push(map.get(key));
      }
      for (const h of baseHeaders) {
        if (!colOrder.value.includes(h.key)) ordered.push(h);
      }
      baseHeaders = ordered;
    }

    internalHeaders.value = baseHeaders;
  },
  { immediate: true, deep: true },
);

const resetColOrder = () => {
  colOrder.value = [];
  localStorage.removeItem(colOrderKey.value);
  internalHeaders.value = JSON.parse(JSON.stringify(props.headers));
};

// --- STATE POINTER DRAG & DROP KOLOM ---
const dragSrcKey = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);
const isDragging = ref(false);

let pointerDragKey: string | null = null;
let autoScrollTimer: number | null = null;
const tableWrapRef = ref<any>(null);

const onColPointerDown = (key: string | null | undefined, e: PointerEvent) => {
  if (!key || key === "data-table-expand") return;
  const target = e.target as HTMLElement;
  if (!target.classList.contains("col-drag-handle")) return; // Hanya dari handle ⠿

  pointerDragKey = key;
  dragSrcKey.value = key;
  isDragging.value = true;

  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
};

const onColPointerMove = (e: PointerEvent) => {
  if (!isDragging.value || !pointerDragKey) return;

  const els = document.elementsFromPoint(e.clientX, e.clientY);
  const th = els.find(
    (el) => el.tagName === "TH" && el.hasAttribute("data-col-key"),
  ) as HTMLElement | undefined;

  if (th) {
    const key = th.getAttribute("data-col-key");
    if (key && key !== pointerDragKey) {
      dragOverKey.value = key;
    }
  }

  // Auto-scroll horizontal wrapper tabel saat pointer di tepi
  const wrapper = tableWrapRef.value?.$el?.querySelector(
    ".v-table__wrapper",
  ) as HTMLElement | null;
  if (!wrapper) return;

  const rect = wrapper.getBoundingClientRect();
  const EDGE = 60;
  const SPEED = 12;

  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }

  if (e.clientX < rect.left + EDGE) {
    autoScrollTimer = window.setInterval(() => {
      wrapper.scrollLeft -= SPEED;
    }, 16);
  } else if (e.clientX > rect.right - EDGE) {
    autoScrollTimer = window.setInterval(() => {
      wrapper.scrollLeft += SPEED;
    }, 16);
  }
};

const onColPointerUp = () => {
  if (!isDragging.value) return;

  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }

  if (
    pointerDragKey &&
    dragOverKey.value &&
    pointerDragKey !== dragOverKey.value
  ) {
    const currentOrder = internalHeaders.value
      .map((h) => h.key)
      .filter((k) => k && k !== "data-table-expand");

    const srcIdx = currentOrder.indexOf(pointerDragKey);
    const tgtIdx = currentOrder.indexOf(dragOverKey.value);

    if (srcIdx !== -1 && tgtIdx !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(srcIdx, 1);
      newOrder.splice(tgtIdx, 0, pointerDragKey);
      colOrder.value = newOrder;
      saveColOrder(newOrder);

      // Re-order internalHeaders
      const map = new Map(internalHeaders.value.map((h: any) => [h.key, h]));
      const reordered: any[] = [];
      for (const k of newOrder) {
        if (map.has(k)) reordered.push(map.get(k));
      }
      internalHeaders.value.forEach((h) => {
        if (!newOrder.includes(h.key)) reordered.push(h);
      });
      internalHeaders.value = reordered;
    }
  }

  pointerDragKey = null;
  dragSrcKey.value = null;
  dragOverKey.value = null;
  isDragging.value = false;
};

// Kosongkan fungsi drag lama HTML5 agar tidak konflik
const onTableScroll = () => {};

// State Resizing
const resizingKey = ref<string | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent, key: string) => {
  resizingKey.value = key;
  startX.value = e.clientX;

  const targetHeader = internalHeaders.value.find((h) => h.key === key);
  let w = parseInt(targetHeader?.width || targetHeader?.minWidth || "120", 10);
  if (isNaN(w)) w = 120;
  startWidth.value = w;

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!resizingKey.value) return;
  const diff = e.clientX - startX.value;
  const newWidth = Math.max(50, startWidth.value + diff);

  const idx = internalHeaders.value.findIndex(
    (h) => h.key === resizingKey.value,
  );
  if (idx !== -1) {
    internalHeaders.value[idx] = {
      ...internalHeaders.value[idx],
      width: `${newWidth}px`,
      minWidth: `${newWidth}px`,
    };
  }
};

const onMouseUp = () => {
  resizingKey.value = null;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
};

// --- EXCEL FILTER CORE LOGIC ---
const columnSearch = ref<Record<string, string>>({});
const selectedValues = ref<Record<string, string[]>>({});
const menuStates = ref<Record<string, boolean>>({});

const formatCellDate = (val: any) => {
  if (
    !val ||
    val === "-" ||
    val === "null" ||
    String(val).startsWith("0000-00-00")
  )
    return "-";
  const str = String(val).trim();

  // Jika sudah format dd/mm/yyyy
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(str)) {
    return str.substring(0, 10).replace(/-/g, "/");
  }

  // Tangkap pola yyyy-mm-dd atau datetime ISO
  const matchYmd = str.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (matchYmd) {
    const [, year, month, day] = matchYmd;
    return `${day}/${month}/${year}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
};

const getCellValue = (item: any, key: string): string => {
  if (!item) return "-";
  let val = item[key];
  if (val === null || val === undefined || val === "") return "-";

  // OTOMATIS FORMAT TANGGAL UNTUK SEMUA HALAMAN YANG PAKAI BASEBROWSE
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes("tanggal") ||
    lowerKey.includes("tgl") ||
    lowerKey.includes("dateline") ||
    lowerKey.includes("deadline")
  ) {
    return formatCellDate(val);
  }

  return String(val);
};

const filterableHeaders = computed(() => {
  return internalHeaders.value.filter((h) => h.key !== "data-table-expand");
});

const uniqueValuesMap = computed(() => {
  const map: Record<string, string[]> = {};
  filterableHeaders.value.forEach((h: any) => {
    const key = h.key;
    const set = new Set<string>();
    (props.items ?? []).forEach((item: any) => {
      set.add(getCellValue(item, key));
    });
    map[key] = Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  });
  return map;
});

const universalDateSort = (valA: any, valB: any) => {
  const parseToNum = (val: any) => {
    if (!val || val === "-") return 0;
    const strVal = String(val).trim();

    // Cek format DD/MM/YYYY
    const partsSlash = strVal.split("/");
    if (partsSlash.length === 3) {
      const day = parseInt(partsSlash[0], 10) || 0;
      const month = parseInt(partsSlash[1], 10) || 0;
      const year = parseInt(partsSlash[2], 10) || 0;
      return year * 10000 + month * 100 + day;
    }

    // Cek format YYYY-MM-DD
    const partsDash = strVal.substring(0, 10).split("-");
    if (partsDash.length === 3) {
      const year = parseInt(partsDash[0], 10) || 0;
      const month = parseInt(partsDash[1], 10) || 0;
      const day = parseInt(partsDash[2], 10) || 0;
      return year * 10000 + month * 100 + day;
    }

    return 0;
  };

  return parseToNum(valA) - parseToNum(valB);
};

const getFilteredPopupOptions = (key: string) => {
  const options = uniqueValuesMap.value[key] || [];
  const search = columnSearch.value[key]?.trim().toLowerCase();
  if (!search) return options;
  return options.filter((opt) => opt.toLowerCase().includes(search));
};

const isOptionSelected = (key: string, option: string) => {
  const sel = selectedValues.value[key];
  if (!sel) return true;
  return sel.includes(option);
};

const toggleOption = (key: string, option: string) => {
  if (!selectedValues.value[key]) {
    selectedValues.value[key] = [...(uniqueValuesMap.value[key] || [])];
  }
  const index = selectedValues.value[key].indexOf(option);
  if (index > -1) {
    selectedValues.value[key].splice(index, 1);
  } else {
    selectedValues.value[key].push(option);
  }
};

const selectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  const newSet = new Set([...currentSelected, ...visibleOptions]);
  selectedValues.value[key] = Array.from(newSet);
};

const deselectAllFiltered = (key: string) => {
  const visibleOptions = getFilteredPopupOptions(key);
  const currentSelected = selectedValues.value[key] || [
    ...(uniqueValuesMap.value[key] || []),
  ];
  selectedValues.value[key] = currentSelected.filter(
    (opt) => !visibleOptions.includes(opt),
  );
};

const isColumnFilterActive = (key: string) => {
  const search = columnSearch.value[key]?.trim();
  if (search) return true;

  const sel = selectedValues.value[key];
  if (!sel) return false;
  const all = uniqueValuesMap.value[key] || [];
  return sel.length < all.length;
};

const resetColumnFilter = (key: string) => {
  delete selectedValues.value[key];
  columnSearch.value[key] = "";
};

const filteredItems = computed(() => {
  const rawItems = props.items ?? [];
  return rawItems.filter((item: any) => {
    return filterableHeaders.value.every((h: any) => {
      const key = h.key;
      const cellValue = getCellValue(item, key);

      const searchText = columnSearch.value[key]?.trim().toLowerCase();
      if (searchText && !cellValue.toLowerCase().includes(searchText)) {
        return false;
      }

      const selectedArr = selectedValues.value[key];
      if (selectedArr) {
        return selectedArr.includes(cellValue);
      }

      return true;
    });
  });
});

// Sinkronkan hasil filter tabel ke parent (v-model:filteredItems).
// Tanpa ini, parent yang mengandalkan v-model:filteredItems (mis. SoToSpkView
// untuk Export Excel) selalu menerima array kosong.
watch(
  filteredItems,
  (val) => {
    emit("update:filteredItems", val);
  },
  { immediate: true },
);

watch(
  () => props.headers,
  (newHeaders) => {
    if (!newHeaders) return;
    let baseHeaders = JSON.parse(JSON.stringify(newHeaders));

    // OTOMATIS BERI CUSTOM SORT UNTUK KOLOM TANGGAL
    baseHeaders = baseHeaders.map((h: any) => {
      const lowerKey = h.key?.toLowerCase() || "";
      // Jika key mengandung kata tanggal, tgl, dateline, deadline, dll dan belum punya customSort
      if (
        (lowerKey.includes("tanggal") ||
          lowerKey.includes("tgl") ||
          lowerKey.includes("dateline") ||
          lowerKey.includes("deadline")) &&
        !h.customSort
      ) {
        return { ...h, customSort: universalDateSort };
      }
      return h;
    });

    if (colOrder.value.length > 0) {
      const map = new Map(baseHeaders.map((h: any) => [h.key, h]));
      const ordered: any[] = [];
      for (const key of colOrder.value) {
        if (map.has(key)) ordered.push(map.get(key));
      }
      for (const h of baseHeaders) {
        if (!colOrder.value.includes(h.key)) ordered.push(h);
      }
      baseHeaders = ordered;
    }

    internalHeaders.value = baseHeaders;
  },
  { immediate: true, deep: true },
);

// --- SUMMARY / GRAND TOTAL CALCULATIONS ---
const calculateTotal = (key: string) => {
  return filteredItems.value.reduce((sum, item) => {
    const val = Number(item[key]);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
};

const formatTotal = (val: number) => {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
};

const computedShowExpand = computed(() => {
  return (
    props.showExpand || !!slots["expanded-row"] || !!slots["expanded-content"]
  );
});

const customSlots = computed(() => {
  const {
    "extra-actions": _,
    "filter-fields": __,
    "expanded-row": ___,
    "expanded-content": ____,
    ...rest
  } = slots;
  return rest;
});

const startDateVal = computed(
  () => props.filters?.startDate ?? props.startDate,
);
const endDateVal = computed(() => props.filters?.endDate ?? props.endDate);

const onStartDateChange = (val: string) => {
  if (props.filters) {
    emit("update:filters", { ...props.filters, startDate: val });
  } else {
    emit("update:startDate", val);
  }
};

const onEndDateChange = (val: string) => {
  if (props.filters) {
    emit("update:filters", { ...props.filters, endDate: val });
  } else {
    emit("update:endDate", val);
  }
};

const isSingleSelected = computed(() => props.selected.length === 1);

const activeRowId = ref<any>(null);

const mergedRowProps = (data: any) => {
  const parentResult: any = props.rowProps ? (props.rowProps(data) as any) || {} : {};
  const id = data.item?.[props.itemValue];
  const parentClass = parentResult.class;

  // Cek apakah baris ini ada di selected (untuk background multi-select)
  const isSelected = Array.isArray(props.selected) && props.selected.some((s: any) => String(s?.[props.itemValue] ?? s?.Nomor) === String(id));

  const classes: any[] = [];
  if (parentClass !== undefined && parentClass !== null && parentClass !== "") {
    classes.push(parentClass);
  }
  // Tambahkan row-selected otomatis jika ter-select tapi parent belum menambahkannya
  if (isSelected) {
    let hasSelected = false;
    if (typeof parentClass === "string") hasSelected = parentClass.includes("row-selected");
    else if (Array.isArray(parentClass)) hasSelected = parentClass.some((c: any) => (typeof c === "string" && c.includes("row-selected")) || (typeof c === "object" && c?.["row-selected"]));
    else if (typeof parentClass === "object" && parentClass) hasSelected = !!parentClass["row-selected"];
    if (!hasSelected) classes.push("row-selected");
  }
  // Fallback single-active: tetap sinkronkan highlight dengan selected,
  // bukan dengan activeRowId saja — agar deselect multi-select tidak meninggalkan highlight
  // (row-active legacy tetap didukung via parent rowProps jika diperlukan)

  return {
    ...parentResult,
    class: classes.length ? classes : parentResult.class,
    onClick: (e: MouseEvent) => {
      activeRowId.value = id;
      if (typeof parentResult.onClick === "function") parentResult.onClick(e);
      emit("row-click", e, data);
    },
  };
};
</script>

<style scoped>
:deep(.v-data-table) {
  font-size: 11px !important;
  display: flex !important;
  flex-direction: column !important;
  /* Tinggi tetap = mengisi area tabel yang tersedia. min-height: 0 mencegah
     tabel memanjang mengikuti jumlah baris (mis. saat items-per-page = 100),
     sehingga hanya isi tabel yang scroll. */
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
}

:deep(.v-table__wrapper) {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  max-height: none !important;
  min-height: 0 !important;
}

:deep(.v-data-table-header th) {
  font-size: 11px !important;
  height: 36px !important;
  font-weight: bold !important;
  background-color: #f8f9fa !important;
  color: #333 !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 5 !important;
  user-select: none;
}

:deep(.v-data-table td) {
  font-size: 11px !important;
  height: 32px !important;
}

:deep(.v-data-table__tr) {
  cursor: pointer;
}

.browse-content {
  padding-top: 4px;
  /* Buat area browse mengisi tinggi konten yang tersedia, sehingga hanya
     bagian tabel (isi) yang scroll — toolbar filter & tombol tetap diam. */
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* Toolbar filter tidak boleh ikut menyusut / ter-scroll */
.filter-card {
  flex-shrink: 0;
}

/* Wadah tabel mengambil sisa tinggi yang tersedia lalu scroll di dalamnya */
.table-container {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.filter-section {
  padding: 4px 8px;
}

:deep(.expanded-container .v-data-table-header th) {
  background-color: #eceff1 !important;
  color: #37474f !important;
  font-weight: 700 !important;
  font-size: 11px !important;
  height: 30px !important;
}
:deep(.expanded-container .v-data-table td) {
  height: 28px !important;
}

/* --- STYLING DRAG & DROP POINTER --- */
.col-dragging {
  opacity: 0.5;
  background-color: #cfd8dc !important;
}
.col-drag-over {
  background-color: rgba(25, 118, 210, 0.15) !important;
  box-shadow: inset 3px 0 0 #1976d2;
}
.col-drag-handle {
  cursor: grab;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}
.col-drag-handle:active {
  cursor: grabbing;
}

.column-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 3;
  transition: background-color 0.2s;
}

.column-resizer:hover,
.base-th:hover .column-resizer {
  background-color: rgba(0, 0, 0, 0.15);
}

.summary-row td {
  position: sticky !important;
  bottom: 0 !important;
  z-index: 4 !important;
  background-color: #e3f2fd !important;
  border-top: 2px solid #90caf9 !important;
  font-size: 12px !important;
  padding: 6px 8px !important;
}

:deep(.v-data-table__tr.row-active) {
  background-color: #e8f4fd !important; /* Warna biru muda lembut */
}
:deep(.v-data-table__tr.row-selected),
:deep(.row-selected td) {
  background-color: #d8efff !important;
}
</style>
