<template>
  <div class="dashboard-layout-top font-body">
    <!-- Overlay latar belakang menu mobile -->
    <div
      v-if="isMobileMenuOpen"
      class="menu-overlay"
      @click="isMobileMenuOpen = false"
    ></div>

    <nav class="top-navbar" :class="{ 'scrolled-navbar': isScrolled }">
      <div class="navbar-left">
        <button
          class="mobile-toggle"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <component
            :is="isMobileMenuOpen ? IconX : IconMenu2"
            class="nav-icon"
          />
        </button>

        <router-link to="/" class="navbar-brand" @click="closeAllMenus">
          <img src="@/assets/logo.png" alt="Logo" class="brand-logo" />
        </router-link>
      </div>

      <!-- NAVBAR MENU (Desktop Horizontal / Mobile Vertical Drawer) -->
      <ul class="navbar-menu" :class="{ 'is-mobile-open': isMobileMenuOpen }">
        <!-- HEADER PROFILE UNTUK MOBILE -->
        <li class="mobile-profile-header">
          <div
            class="mobile-avatar-circle"
            :style="{ backgroundColor: userRoleConfig.color }"
          >
            <component
              :is="userRoleConfig.icon"
              class="mobile-avatar-icon"
              color="white"
            />
          </div>
          <div class="mobile-profile-info">
            <h3>{{ currentUser?.nmUser || "ADMINISTRATOR" }}</h3>
            <p>{{ currentUser?.bagian || "HO - EDP" }}</p>
          </div>
        </li>

        <!-- LOOPING GROUP MENU UTAMA -->
        <li
          v-for="group in menuGroups"
          v-show="group.items.some((i) => !i.isDisabled)"
          :key="group.name"
          class="dropdown"
          :class="{ 'is-active': activeMenu === group.name }"
        >
          <a class="dropdown-toggle" @click.prevent="toggleMenu(group.name)">
            <span class="menu-title-wrapper">
              <component :is="getGroupIcon(group.name)" class="menu-icon" />
              {{ group.name }}
            </span>
            <component :is="IconChevronDown" class="arrow-icon" />
          </a>

          <!-- DROPDOWN LEVEL 2 -->
          <ul class="dropdown-menu shadow-md">
            <template v-for="item in group.items" :key="item.name">
              <li
                v-if="item.isSubGroup"
                class="sub-dropdown"
                :class="{
                  'item-disabled': item.isDisabled,
                  'is-sub-active': activeSubMenu === item.name,
                }"
              >
                <a
                  v-if="!item.isDisabled"
                  class="sub-dropdown-toggle"
                  @click.prevent.stop="toggleSubMenu(item.name)"
                >
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <component
                    :is="IconChevronDown"
                    class="icon-arrow"
                    :class="{ rotate: activeSubMenu === item.name }"
                  />
                </a>

                <span v-else class="disabled-link">
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <component :is="IconLock" class="lock-icon" />
                </span>

                <!-- DROPDOWN LEVEL 3 -->
                <ul
                  v-if="!item.isDisabled && activeSubMenu === item.name"
                  class="sub-menu-popup shadow-md"
                >
                  <li
                    v-for="subItem in item.items"
                    :key="subItem.name"
                    class="card-item dynamic-sub"
                    :class="{ 'item-disabled': subItem.isDisabled }"
                  >
                    <template v-if="subItem.isSubGroup">
                      <a
                        v-if="!subItem.isDisabled"
                        class="sub-dropdown-toggle level-4-toggle"
                        @click.prevent.stop="
                          activeSubLevel4 =
                            activeSubLevel4 === subItem.name
                              ? null
                              : subItem.name
                        "
                      >
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <component
                          :is="IconChevronDown"
                          class="icon-arrow"
                          :class="{
                            rotate: activeSubLevel4 === subItem.name,
                          }"
                        />
                      </a>

                      <span v-else class="disabled-link">
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <component :is="IconLock" class="lock-icon" />
                      </span>

                      <!-- DROPDOWN LEVEL 4 -->
                      <ul
                        v-if="
                          !subItem.isDisabled &&
                          activeSubLevel4 === subItem.name
                        "
                        class="sub-menu-popup level-4-popup shadow-md"
                      >
                        <li
                          v-for="deepItem in subItem.items"
                          :key="deepItem.name"
                          class="card-item"
                          :class="{ 'item-disabled': deepItem.isDisabled }"
                        >
                          <router-link
                            v-if="!deepItem.isDisabled"
                            :to="deepItem.path || '#'"
                            @click="closeAllMenus"
                          >
                            <span class="menu-title-wrapper">
                              <component
                                :is="getItemIcon(deepItem.name)"
                                class="sub-menu-icon"
                              />
                              {{ deepItem.name }}
                            </span>
                          </router-link>
                          <span v-else class="disabled-link">
                            <span class="menu-title-wrapper">
                              <component
                                :is="getItemIcon(deepItem.name)"
                                class="sub-menu-icon"
                              />
                              {{ deepItem.name }}
                            </span>
                            <component :is="IconLock" class="lock-icon" />
                          </span>
                        </li>
                      </ul>
                    </template>

                    <template v-else>
                      <router-link
                        v-if="!subItem.isDisabled"
                        :to="subItem.path || '#'"
                        @click="closeAllMenus"
                      >
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                      </router-link>
                      <span v-else class="disabled-link">
                        <span class="menu-title-wrapper">
                          <component
                            :is="getItemIcon(subItem.name)"
                            class="sub-menu-icon"
                          />
                          {{ subItem.name }}
                        </span>
                        <component :is="IconLock" class="lock-icon" />
                      </span>
                    </template>
                  </li>
                </ul>
              </li>

              <li v-else :class="{ 'item-disabled': item.isDisabled }">
                <router-link
                  v-if="!item.isDisabled"
                  :to="item.path || '#'"
                  @click="closeAllMenus"
                >
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                </router-link>
                <span v-else class="disabled-link">
                  <span class="menu-title-wrapper">
                    <component
                      :is="getItemIcon(item.name)"
                      class="sub-menu-icon"
                    />
                    {{ item.name }}
                  </span>
                  <component :is="IconLock" class="lock-icon" />
                </span>
              </li>
            </template>
          </ul>
        </li>

        <!-- BOTTOM ACTION UNTUK MOBILE MENU -->
        <li class="mobile-actions-footer">
          <router-link
            to="/file/ganti-password"
            class="mobile-foot-btn text-muted"
            @click="closeAllMenus"
          >
            <component :is="IconLock" class="foot-icon" />
            <span>Ganti Password</span>
          </router-link>
          <button @click="handleLogout" class="mobile-foot-btn text-danger">
            <component :is="IconLogout" class="foot-icon" />
            <span>Logout</span>
          </button>
        </li>
      </ul>

      <!-- USER MENU DESKTOP (Gaya Referensi) -->
      <div class="navbar-user hide-mobile">
        <v-menu location="bottom end" transition="fade-transition">
          <template #activator="{ props }">
            <button v-bind="props" class="user-btn">
              <v-avatar
                :color="userRoleConfig.color"
                size="27"
                class="user-avatar"
              >
                <component
                  :is="userRoleConfig.icon"
                  :size="15"
                  :stroke-width="1.6"
                  color="white"
                />
              </v-avatar>
              <span class="user-name">{{
                currentUser?.nmUser || "UserAdmin"
              }}</span>
              <IconChevronDown
                :size="12"
                :stroke-width="2.2"
                class="user-chev"
              />
            </button>
          </template>

          <v-card class="user-dropdown" elevation="6">
            <v-list class="user-list">
              <div class="user-profile">
                <v-avatar
                  :color="userRoleConfig.color"
                  size="32"
                  class="user-avatar up-avatar"
                >
                  <component
                    :is="userRoleConfig.icon"
                    :size="17"
                    :stroke-width="1.5"
                    color="white"
                  />
                </v-avatar>
                <div>
                  <div class="up-name">
                    {{ currentUser?.nmUser || "UserAdmin" }}
                  </div>
                  <div class="up-sub">
                    {{
                      [currentUser?.cab, currentUser?.bagian || "STAFF"]
                        .filter(Boolean)
                        .join(" · ")
                    }}
                  </div>
                </div>
              </div>
              <v-divider class="ud-divider" />
              <v-list-item to="/file/ganti-password" class="ud-item">
                <template #prepend>
                  <IconLock :size="15" :stroke-width="1.5" class="ud-ic" />
                </template>
                <v-list-item-title class="nav-item-title"
                  >Ganti Password</v-list-item-title
                >
              </v-list-item>
              <v-divider class="ud-divider" />
              <v-list-item class="ud-item ud-logout" @click="handleLogout">
                <template #prepend>
                  <IconLogout :size="15" :stroke-width="1.5" class="ud-ic" />
                </template>
                <v-list-item-title class="nav-item-title"
                  >Logout</v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>
    </nav>

    <!-- MULTI-TAB NAVIGATION BAR (Gaya Multi-Tab / Desktop App) -->
    <div class="sub-tab-bar d-flex align-center px-3 border-bottom">
      <!-- Tab Dashboard Default -->
      <router-link
        to="/"
        class="tab-item"
        :class="{ active: route.path === '/' }"
      >
        <v-icon size="small" class="mr-1">mdi-view-dashboard</v-icon>
        <span>Dashboard</span>
      </router-link>

      <!-- Loop Tab Dinamis yang Sedang Dibuka -->
      <div
        v-for="tab in tabStore.tabs"
        :key="tab.path"
        class="tab-item d-flex align-center px-3 py-1"
        :class="{ active: route.path === tab.path }"
        @click="openTab(tab)"
      >
        <span class="text-caption font-weight-medium mr-2">{{
          tab.title
        }}</span>
        <v-icon
          size="x-small"
          class="close-icon"
          @click.stop="tabStore.removeTab(tab.path, router)"
        >
          mdi-close
        </v-icon>
      </div>
    </div>

    <div class="main-content-top" ref="mainContentRef">
      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useTabStore } from "@/stores/tabStore";

import {
  IconMenu2,
  IconX,
  IconChevronDown,
  IconLogout,
  IconLock,
  IconShield,
  IconSpeakerphone,
  IconBuildingWarehouse,
  IconTie,
  IconFolder,
  IconLayoutList,
  IconShoppingCart,
  IconReport,
  IconSettings,
  IconTexture,
  IconFileText,
  IconDeviceDesktopAnalytics,
  IconShirt,
  IconReceipt,
  IconTool,
  IconFlask,
  IconUsers,
  IconSandbox,
} from "@tabler/icons-vue";

const authStore = useAuthStore();
const tabStore = useTabStore();
const currentUser = authStore.user;
const router = useRouter();
const route = useRoute();

const isMobileMenuOpen = ref(false);
const activeMenu = ref<string | null>(null);
const activeSubMenu = ref<string | null>(null);
const activeSubLevel4 = ref<string | null>(null);
const scrolled = ref(false);
const mainContentRef = ref<HTMLElement | null>(null);

const isScrolled = computed(() => scrolled.value);
const handleScroll = () => {
  const el = mainContentRef.value;
  scrolled.value = (el ? el.scrollTop : window.scrollY) > 10;
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const toggleMenu = (menuName: string) => {
  if (activeMenu.value !== menuName) {
    activeSubMenu.value = null;
    activeSubLevel4.value = null;
  }
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
};

const toggleSubMenu = (subName: string) => {
  if (activeSubMenu.value !== subName) {
    activeSubLevel4.value = null;
  }
  activeSubMenu.value = activeSubMenu.value === subName ? null : subName;
};

const closeAllMenus = () => {
  activeMenu.value = null;
  activeSubMenu.value = null;
  activeSubLevel4.value = null;
  isMobileMenuOpen.value = false;
};

// Fungsi Navigasi Klik Tab di Tab Bar
const openTab = (tab: any) => {
  router.push({ name: tab.name, params: tab.params });
};

// Watcher untuk mencatat halaman yang dibuka ke Tab Store secara otomatis
watch(
  () => route.path,
  () => {
    if (route.path !== "/" && route.name) {
      tabStore.addTab({
        name: String(route.name),
        title: (route.meta?.title as string) || String(route.name),
        path: route.path,
        params: route.params,
      });
    }
  },
  { immediate: true },
);

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".dropdown") && !target.closest(".mobile-toggle")) {
    activeMenu.value = null;
    activeSubMenu.value = null;
    activeSubLevel4.value = null;
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("click", handleClickOutside);
  mainContentRef.value?.addEventListener("scroll", handleScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("click", handleClickOutside);
  mainContentRef.value?.removeEventListener("scroll", handleScroll);
});

const getGroupIcon = (name: string) => {
  switch (name) {
    case "File":
      return IconFolder;
    case "Daftar":
      return IconLayoutList;
    case "Spanduk":
      return IconSandbox;
    case "Transaksi":
      return IconShoppingCart;
    case "Laporan":
      return IconReport;
    default:
      return IconSettings;
  }
};

const getItemIcon = (name: string) => {
  if (name.includes("Bahan")) return IconTexture;
  if (name.includes("LHK") || name.includes("SPK")) return IconFileText;
  if (name.includes("Lap.") || name.includes("Laporan"))
    return IconDeviceDesktopAnalytics;
  if (name.includes("Garmen") || name.includes("Tekstil")) return IconShirt;
  if (name.includes("Finance") || name.includes("Invoice")) return IconReceipt;
  if (name.includes("Spare Part")) return IconTool;
  if (name.includes("Obat")) return IconFlask;
  if (
    name.includes("User") ||
    name.includes("Operator") ||
    name.includes("Supplier")
  )
    return IconUsers;
  return IconSettings;
};

const userRoleConfig = computed(() => {
  const name = currentUser?.nmUser?.toUpperCase() || "";
  const bagian = currentUser?.bagian?.toUpperCase() || "";
  if (name.includes("ADMIN") || name === "DEVELOPER")
    return { icon: IconShield, color: "#c62828" }; // red-darken-2
  if (bagian === "MARKETING")
    return { icon: IconSpeakerphone, color: "#ef6c00" }; // orange-darken-3
  if (bagian.includes("GUDANG"))
    return { icon: IconBuildingWarehouse, color: "#00897b" }; // teal-darken-1
  return { icon: IconTie, color: "#3949ab" }; // indigo-darken-2
});

const rolePermissions = {
  1: [
    "Daftar",
    "Master Bahan",
    "Mesin Produksi",
    "Daftar Permintaan Pembelian",
    "Purchase Request (PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Barcode",
    "BAST-MAP",
    "Relationship Map",
    "Create Barcode",
    "Search Barcode",
    "Koreksi Stok",
    "Pengajuan Koreksi Stok",
    "Memo Approval Produk (MAP)",
    "SO TO SPK (Surat Perintah Kerja)",
    "Planning Produksi",
    "Komitmen Kirim",
    "Mutasi Bahan",
    "Stok Opname",
    "Surat Jalan",
    "Surat Jalan Approve",
    "Retur Beli",
    "Retur Produksi",
    "STBJ",
    "Jadwal Kirim",
    "LHK",
    "LHK Cetak (Mesin)",
    "LHK Approval Cetak",
    "LHK Tekstil",
    "LHK Approval Tekstil",
    "LHK Finishing",
    "LHK Proof",
    "LHK Paperprint",
    "LHK Sublim",
    "LHK Layout",
    "PO Internal",
    "Laporan",
    "Produksi MMT",
    "Stok & Bahan MMT",
    "Monitoring & Dokumen",
    "Lap. Monitoring Divisi",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Kartu Stok Produksi",
    "Laporan SPK MMT",
    "Laporan LHK",
    "Lap. Monitoring Kurang Produksi MMT",
    "Lap. Pemakaian Bahan",
    "Lap. Mon BS",
    "Lap. Mon Kiriman",
    "Lap. Mon Cetak",
    "Lap. Mon Finishing",
    "Lap. Mon Tekstil",
    "Lap. Mon Proof",
    "Lap. Mon Paperprint",
    "Lap. Mon Sublim",
    "Lap. BS & Sisa Digital Printing",
    "Mutasi Internal",
    "Penerimaan PO External",
  ],
  2: ["File", "Ganti Password", "Customer", "Sales", "Laporan", "Penjualan"],
  4: [
    "Daftar",
    "Daftar Permintaan Pembelian",
    "Purchase Request (PR)",
    "Penerimaan Bahan",
    "Permintaan Produksi",
    "Realisasi Produksi",
    "Barcode",
    "Create Barcode",
    "Search Barcode",
    "Stok Opname",
    "Koreksi Stok",
    "Pengajuan Koreksi Stok",
    "Komitmen Kirim",
    "LHK",
    "LHK Cetak (Mesin)",
    "LHK Approval Cetak",
    "LHK Tekstil",
    "LHK Approval Tekstil",
    "LHK Finishing",
    "LHK Proof",
    "LHK Sublim",
    "LHK RTR",
    "Laporan",
    "Produksi MMT",
    "Stok & Bahan MMT",
    "Monitoring & Dokumen",
    "Lap. Monitoring Divisi",
    "LS Bahan Utama",
    "LS Bahan Penolong",
    "Kartu Stok Produksi",
    "Laporan SPK MMT",
    "Laporan LHK",
    "Lap. Monitoring Kurang Produksi MMT",
    "Lap. Pemakaian Bahan",
    "Lap. Mon Cetak",
    "Lap. Mon Finishing",
    "Lap. Mon Tekstil",
    "Lap. Mon Proof",
    "Lap. Mon Sublim",
    "Lap. BS & Sisa Digital Printing",
  ],
};

const allMenuGroups = [
  {
    name: "File",
    items: [
      { name: "User", path: "/mmt/manage-user" },
      { name: "Identitas Perusahaan", path: "/file/perusahaan" },
      { name: "Ganti Password", path: "/file/ganti-password" },
    ],
  },
  { name: "Daftar", items: [{ name: "Supplier", path: "/daftar/supplier" }] },
  {
    name: "Spanduk",
    items: [
      {
        name: "Penerimaan Bahan Penolong",
        path: "/spanduk/penerimaan-bahan-penolong",
      },
    ],
  },
  {
    name: "Transaksi",
    items: [
      {
        name: "Daftar",
        isSubGroup: true,
        items: [
          { name: "Master Bahan", path: "/mmt/daftar/bahan" },
          { name: "Mesin Produksi", path: "/mmt/daftar/mesin-produksi" },
          { name: "Operator", path: "/mmt/daftar/operator" },
          { name: "Bahan Sisa", path: "/mmt/daftar/bahan-sisa" },
        ],
      },
      {
        name: "Finance",
        isSubGroup: true,
        items: [
          { name: "PO Bahan MMT", path: "/mmt/po-bahan-mmt" },
          { name: "PO External MMT", path: "/mmt/po-external-mmt" },
          { name: "Invoice", path: "/mmt/invoice" },
          { name: "Retur Beli", path: "/mmt/retur-beli" },
          { name: "Voucher Pelunasan", path: "/mmt/voucher-pembelian" },
          { name: "Laporan Outstanding", path: "/laporan/mmt/lap-hutang" },
        ],
      },
      {
        name: "Bahan Baku & Produksi",
        isSubGroup: true,
        items: [
          {
            name: "Daftar Permintaan Pembelian",
            path: "/mmt/pengajuan-permintaan",
          },
          { name: "Purchase Request (PR)", path: "/mmt/permintaan-bahan" },
          { name: "Penerimaan Bahan", path: "/mmt/penerimaan-bahan" },
          { name: "Retur Produksi", path: "/mmt/retur-produksi" },
          { name: "Retur Beli", path: "/mmt/retur-beli" },
          { name: "Mutasi Bahan", path: "/mmt/mutasi-gudang" },
          { name: "Koreksi Stok", path: "/mmt/koreksi-stok" },
          {
            name: "Pengajuan Koreksi Stok",
            path: "/mmt/pengajuan-koreksi-stok",
          },
          { name: "Stok Opname", path: "/mmt/stok-opname" },
          { name: "Permintaan Produksi", path: "/mmt/permintaan-produksi" },
          { name: "Realisasi Produksi", path: "/mmt/realisasi-produksi" },
          {
            name: "Barcode",
            isSubGroup: true,
            items: [
              { name: "Create Barcode", path: "/mmt/create-barcode" },
              { name: "Search Barcode", path: "/mmt/search-barcode" },
            ],
          },
        ],
      },
      {
        name: "LHK",
        isSubGroup: true,
        items: [
          { name: "LHK Cetak (Mesin)", path: "/mmt/lhk/cetak" },
          { name: "LHK Approval Cetak", path: "/mmt/lhk/cetak-mmt" },
          { name: "LHK Tekstil", path: "/mmt/lhk/tekstil" },
          { name: "LHK Approval Tekstil", path: "/mmt/lhk/tekstil/approve" },
          { name: "LHK Finishing", path: "/mmt/lhk/finishing" },
          { name: "LHK Proof", path: "/mmt/lhk/proof" },
          { name: "LHK Paperprint", path: "/mmt/lhk/paperprint" },
          { name: "LHK Sublim", path: "/mmt/lhk/sublim" },
          { name: "LHK Layout", path: "/mmt/lhk/layout" },
        ],
      },
      { name: "Planning Produksi", path: "/mmt/planning-produksi" },
      { name: "Komitmen Kirim", path: "/mmt/komitmen-kirim" },
      { name: "Memo Approval Produk (MAP)", path: "/mmt/map" },
      { name: "BAST-MAP", path: "/mmt/bast-map" },
      { name: "Relationship Map", path: "/mmt/relationship-map" },
      { name: "SO TO SPK (Surat Perintah Kerja)", path: "/mmt/so-spk" },
      { name: "BS & Sisa Digital Print", path: "/mmt/bs-digital" },
      { name: "BS & Sisa Tekstil", path: "/mmt/bs-tekstil" },
      { name: "STBJ", path: "/mmt/stbj" },
      { name: "Surat Jalan", path: "/mmt/surat-jalan" },
      { name: "Surat Jalan Approve", path: "/mmt/surat-jalan/approve" },
      { name: "Jadwal Kirim", path: "/mmt/jadwal-kirim" },
      { name: "PO Internal", path: "/mmt/po-paperprint" },
      { name: "Mutasi Internal", path: "/mmt/mutasi-internal" },
      { name: "Penerimaan PO External", path: "/mmt/penerimaan-po-external" },
    ],
  },
  {
    name: "Laporan",
    items: [
      {
        name: "Garmen",
        isSubGroup: true,
        items: [
          { name: "Mutasi Bahan", path: "/laporan/garmen/mutasi-bahan" },
          {
            name: "Kartu Stok Bahan Baku",
            path: "/laporan/garmen/kartu-stok-bahan",
          },
          { name: "Stok Barang", path: "/laporan/garmen/stok-barang" },
          { name: "SPK vs STBJ vs SJ", path: "/laporan/garmen/spk-stbj-sj" },
          { name: "Proses Produksi", path: "/laporan/garmen/proses-produksi" },
          {
            name: "Lap Outstanding SPK",
            path: "/laporan/garmen/outstanding-spk",
          },
        ],
      },
      {
        name: "Penjualan",
        isSubGroup: true,
        items: [
          {
            name: "Penawaran vs SPK",
            path: "/laporan/penjualan/penawaran-vs-spk",
          },
          {
            name: "Realisasi Pengiriman SPK",
            path: "/laporan/penjualan/realisasi-kirim-spk",
          },
          {
            name: "SPK vs SJ vs Invoice",
            path: "/laporan/penjualan/spk-sj-invoice",
          },
          {
            name: "Rekap Penawaran",
            path: "/laporan/penjualan/rekap-penawaran",
          },
        ],
      },
      {
        name: "Hutang",
        isSubGroup: true,
        items: [
          { name: "PPN Masukan", path: "/laporan/hutang/ppn-masukan" },
          { name: "PO vs BPB", path: "/laporan/hutang/po-vs-bpb" },
          { name: "Daftar Hutang", path: "/laporan/hutang/daftar-hutang" },
          {
            name: "PO Bahan vs Realisasi",
            path: "/laporan/hutang/po-bahan-vs-realisasi",
          },
        ],
      },
      {
        name: "Piutang",
        isSubGroup: true,
        items: [
          {
            name: "Rekap Mutasi Piutang",
            path: "/laporan/piutang/rekap-mutasi",
          },
          { name: "Daftar Piutang", path: "/laporan/piutang/daftar-piutang" },
          { name: "Saldo Piutang", path: "/laporan/piutang/saldo-piutang" },
        ],
      },
      {
        name: "Spanduk",
        isSubGroup: true,
        items: [
          { name: "Laporan Persediaan", path: "/laporan/spanduk/persediaan" },
          { name: "Laporan Kartu Stok", path: "/laporan/spanduk/kartu-stok" },
          {
            name: "Laporan In Out Gudang",
            path: "/laporan/spanduk/in-out-gudang",
          },
          { name: "Stok Barang Jadi", path: "/laporan/spanduk/stok-jadi" },
        ],
      },
      {
        name: "Produksi MMT",
        isSubGroup: true,
        items: [
          {
            name: "Monitoring & Dokumen",
            isSubGroup: true,
            items: [
              {
                name: "Lap. Monitoring Kurang Produksi MMT",
                path: "/laporan/mmt/lap-mon-lmkp-mmt",
              },
              { name: "Lap. Mon BS", path: "/laporan/mmt/lap-mon-bs" },
              { name: "Lap. Mon Kiriman", path: "/laporan/mmt/lap-kiriman" },
              { name: "Lap. Mon Cetak", path: "/laporan/mmt/lap-mon-cetak" },
              {
                name: "Lap. Mon Finishing",
                path: "/laporan/mmt/lap-mon-finishing",
              },
              {
                name: "Lap. Mon Tekstil",
                path: "/laporan/mmt/lap-mon-tekstil",
              },
              {
                name: "Lap. Mon Paperprint",
                path: "/laporan/mmt/lap-mon-paperprint",
              },
              { name: "Lap. Mon Proof", path: "/laporan/mmt/lap-mon-proof" },
              { name: "Lap. Mon Sublim", path: "/laporan/mmt/lap-mon-sublim" },
            ],
          },
          { name: "LS Bahan Utama", path: "/laporan/mmt/ls-bahan-utama" },
          { name: "LS Bahan Penolong", path: "/laporan/mmt/ls-bahan-penolong" },
          {
            name: "Lap. Pemakaian Bahan",
            path: "/laporan/mmt/lap-pemakaian-bahan",
          },
          { name: "Laporan SPK MMT", path: "/laporan/mmt/lap-spk-mmt" },
          { name: "Laporan LHK", path: "/laporan/mmt/lap-lhk" },
        ],
      },
      {
        name: "Marketing",
        isSubGroup: true,
        items: [
          {
            name: "Target vs Realisasi",
            path: "/laporan/marketing/target-vs-realisasi",
          },
          {
            name: "Proyeksi vs Realisasi",
            path: "/laporan/marketing/proyeksi-vs-realisasi",
          },
        ],
      },
    ],
  },
];

const menuGroups = computed(() => {
  const menus = JSON.parse(JSON.stringify(allMenuGroups));
  const zdivisi = authStore.user?.divisi as keyof typeof rolePermissions;
  const allowedTitles = rolePermissions[zdivisi];
  if (!allowedTitles) return menus;
  return menus.map((group: any) => {
    return {
      ...group,
      items: group.items.map((item: any) => {
        let canAccess = allowedTitles.includes(item.name);
        if (item.isSubGroup && item.items) {
          item.items = item.items.map((subItem: any) => {
            if (subItem.isSubGroup && subItem.items) {
              subItem.items = subItem.items.map((deepItem: any) => ({
                ...deepItem,
                isDisabled: !allowedTitles.includes(deepItem.name),
              }));
              const anyDeepAllowed = subItem.items.some(
                (deep: any) => !deep.isDisabled,
              );
              return {
                ...subItem,
                isDisabled:
                  !anyDeepAllowed && !allowedTitles.includes(subItem.name),
              };
            }
            return {
              ...subItem,
              isDisabled: !allowedTitles.includes(subItem.name),
            };
          });
          const anySubAllowed = item.items.some((sub: any) => !sub.isDisabled);
          if (anySubAllowed) canAccess = true;
        }
        return { ...item, isDisabled: !canAccess };
      }),
    };
  });
});
</script>

<style scoped>
/* ==================== DESKTOP VARIABLES & BASE STYLE ==================== */
.dashboard-layout-top {
  --color-primary: #1e78c8;
  --color-primary-dark: #155a9b;
  --color-primary-light: #f0f7ff;
  --color-text-main: #1e293b;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --radius-md: 10px;
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --navbar-height: 60px;

  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #f8fafc;
}

/* Sembunyikan elemen mobile secara default di desktop */
.mobile-profile-header,
.mobile-actions-footer {
  display: none;
}

.top-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0 12px;
  height: var(--navbar-height);
  border-bottom: 1px solid var(--color-border);
  z-index: 1100;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.top-navbar.scrolled-navbar {
  background-color: rgba(255, 255, 255, 0.99);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.07);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.brand-logo {
  height: 34px;
  width: auto;
  object-fit: contain;
}

.navbar-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}
.navbar-brand:hover {
  background: rgba(30, 120, 200, 0.05);
}

/* ==================== MULTI-TAB BAR STYLING (Gaya ERP Desktop) ==================== */
.sub-tab-bar {
  height: 40px;
  background-color: #edf2f7;
  overflow-x: auto;
  white-space: nowrap;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
  gap: 4px;
  padding-left: 16px;
}

.tab-item {
  height: 32px;
  background: #e2e8f0;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  text-decoration: none;
  color: #475569;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  transition: background 0.2s;
  border: 1px solid #cbd5e1;
  border-bottom: none;
}

.tab-item:hover {
  background: #cbd5e1;
}

.tab-item.active {
  background: #ffffff;
  color: var(--color-primary);
  border-top: 3px solid var(--color-primary);
  font-weight: 600;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
}

.close-icon {
  margin-left: 8px;
  border-radius: 50%;
  padding: 2px;
}
.close-icon:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* ==================== LANJUTAN NAVBAR MENU & DROPDOWN ==================== */
.navbar-menu {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 100%;
  flex: 1;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.dropdown {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  padding: 0 7px;
  border: none;
  background: transparent;
  border-radius: 7px;
  color: var(--color-text-main);
  font-weight: 600;
  font-size: 0.78rem;
  font-family: inherit;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s;
  cursor: pointer;
  gap: 5px;
}

.menu-title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dropdown-toggle:hover,
.dropdown.is-active .dropdown-toggle {
  background-color: rgba(30, 120, 200, 0.08);
  color: var(--color-primary);
}

.nav-icon {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
}

.menu-icon,
.sub-menu-icon {
  width: 15px;
  height: 15px;
  stroke-width: 1.6;
  color: var(--color-text-muted);
  opacity: 0.65;
  flex-shrink: 0;
}
.dropdown-toggle:hover .menu-icon,
.dropdown.is-active .menu-icon {
  color: var(--color-primary);
  opacity: 1;
}

.arrow-icon {
  width: 12px;
  height: 12px;
  stroke-width: 2.2;
  opacity: 0.45;
  transition: transform 0.2s ease;
}

.dropdown.is-active .arrow-icon {
  transform: rotate(180deg);
  opacity: 0.7;
}

.dropdown-menu {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  top: 100%;
  left: 0;
  list-style: none;
  margin: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  min-width: 280px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow:
    0 31px 61px -7px rgba(0, 0, 0, 0.15),
    0 46px 116px -14px rgba(0, 0, 0, 0.2);
  transform: translateY(8px);
  transition: var(--transition);
  z-index: 1200;

  /* BATAS TINGGI + SCROLL (agar tidak keluar layar) */
  max-height: calc(100vh - var(--navbar-height) - 16px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.dropdown-menu::-webkit-scrollbar {
  width: 8px;
}
.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}
.dropdown-menu::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
  background-clip: padding-box;
}

.dropdown:hover > .dropdown-menu,
.dropdown.is-active > .dropdown-menu {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-menu li a,
.sub-dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 32px;
  padding: 4px 8px;
  color: var(--color-text-main);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
  cursor: pointer;
  /* Teks menu satu baris — tidak bertumpuk seperti MAP/SPK */
  white-space: nowrap;
}

.dropdown-menu li a:hover,
.is-sub-active > .sub-dropdown-toggle {
  background-color: rgba(30, 120, 200, 0.09);
  color: var(--color-primary);
}

.dropdown-menu li a:hover .sub-menu-icon,
.is-sub-active > .sub-dropdown-toggle .sub-menu-icon {
  color: var(--color-primary);
  opacity: 1;
}

.sub-dropdown {
  position: relative;
}

/* SUBMENU LEVEL 3 — inline, turun ke bawah (akordeon), bukan flyout kanan */
.sub-menu-popup {
  position: static;
  list-style: none;
  margin: 0;
  padding: 2px 0 6px 18px;
  min-width: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  z-index: auto;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.card-item a {
  display: flex !important;
  align-items: center;
  min-height: 32px;
  padding: 4px 8px !important;
  color: var(--color-text-main) !important;
  background-color: transparent !important;
  font-size: 0.82rem;
  font-weight: 500;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}

.card-item a:hover {
  background-color: rgba(30, 120, 200, 0.09) !important;
  color: var(--color-primary) !important;
}

.card-item a:hover .sub-menu-icon {
  color: var(--color-primary) !important;
  opacity: 1;
}

.level-4-toggle {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* SUBMENU LEVEL 4 — juga inline, indent lebih dalam */
.level-4-popup {
  position: static;
  padding-left: 18px;
  z-index: auto;
}

.item-disabled {
  pointer-events: none;
  opacity: 0.5;
}

.disabled-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 32px;
  padding: 4px 8px;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  background-color: transparent;
  border-radius: 6px;
  cursor: not-allowed;
}

.lock-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
}

.navbar-user {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 4px;
}

.user-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 9px;
  border: none;
  background: transparent;
  border-radius: 20px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  flex-shrink: 0;
}
.user-btn:hover {
  background: rgba(30, 120, 200, 0.07);
}

.user-avatar {
  color: #fff;
}

.user-name {
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--color-text-main);
  max-width: clamp(80px, 15vw, 200px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-chev {
  color: var(--color-text-muted);
}

/* Dropdown menu user */
.user-dropdown {
  min-width: 230px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.user-list {
  padding: 5px;
}
.user-profile {
  display: flex;
  align-items: center;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(30, 120, 200, 0.05);
  margin-bottom: 2px;
}
.up-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}
.up-name {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-main);
}
.up-sub {
  font-size: 0.73rem;
  color: var(--color-text-muted);
}
.ud-divider {
  margin: 4px 0;
}
.ud-item {
  min-height: 33px;
  border-radius: 6px;
}
.ud-item:hover {
  background: rgba(30, 120, 200, 0.08);
  color: var(--color-primary);
}
.nav-item-title {
  font-size: 0.82rem;
}
.ud-ic {
  color: var(--color-text-muted);
}
.ud-logout,
.ud-logout:hover {
  color: #dc2626;
}
.ud-logout:hover {
  background: #fee2e2;
}
.ud-logout .ud-ic {
  color: #dc2626;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 1080;
  backdrop-filter: blur(4px);
}

.mobile-toggle {
  display: none;
}

.main-content-top {
  flex-grow: 1;
  overflow-y: auto;
  padding: 24px;
}

.icon-arrow {
  transition: transform 0.3s;
  display: inline-block;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-muted);
}
.icon-arrow.rotate {
  transform: rotate(180deg);
}
.is-sub-active > .sub-dropdown-toggle .icon-arrow {
  color: var(--color-primary);
}

/* ==================== ANDROID / TABLET RESPONSIVE STYLE ==================== */
@media (max-width: 1024px) {
  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: none;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    color: var(--color-text-main);
    transition: background 0.15s;
  }
  .mobile-toggle:hover {
    background: rgba(30, 120, 200, 0.08);
    color: var(--color-primary);
  }

  .hide-mobile {
    display: none !important;
  }

  .navbar-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 300px;
    height: 100vh;
    background: #ffffff;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 0;
    padding: 0;
    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 8px 0 30px rgba(15, 23, 42, 0.15);
    display: flex;
    overflow-y: auto;
    z-index: 1200;
  }

  .navbar-menu.is-mobile-open {
    left: 0;
  }

  .mobile-profile-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background-color: rgba(30, 120, 200, 0.04);
    border-bottom: 1px solid var(--color-border);
    min-height: 62px;
    width: 100%;
    flex-shrink: 0;
  }

  .mobile-avatar-circle {
    width: 34px;
    height: 34px;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .mobile-avatar-icon {
    width: 18px;
    height: 18px;
  }

  .mobile-profile-info h3 {
    margin: 0;
    font-size: 0.87rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
    letter-spacing: 0;
  }
  .mobile-profile-info p {
    margin: 3px 0 0 0;
    font-size: 0.73rem;
    color: #64748b;
  }

  .dropdown {
    display: block;
    width: 100%;
    height: auto;
    border-bottom: 1px solid #f1f5f9;
  }

  .dropdown-toggle {
    width: 100%;
    height: auto;
    min-height: 40px;
    padding: 8px 14px;
    font-size: 0.875rem;
    border-radius: 0;
    background: transparent;
  }

  .menu-title-wrapper {
    font-size: 0.875rem;
    color: #334155;
    font-weight: 500;
    gap: 10px;
  }

  .menu-title-wrapper .menu-icon {
    color: #94a3b8;
    opacity: 1;
  }

  .dropdown-menu {
    position: static;
    visibility: visible;
    opacity: 1;
    display: none;
    box-shadow: none;
    border: none;
    padding: 2px 0 8px 14px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    transform: none;
    border-radius: 0;
    min-width: 0;
    /* drawer sudah scroll sendiri — jangan buat scroll bersarang */
    max-height: none;
    overflow: visible;
    overscroll-behavior: auto;
  }

  .dropdown.is-active > .dropdown-menu {
    display: block;
  }

  .dropdown-menu li a,
  .sub-dropdown-toggle {
    min-height: 38px;
    padding: 8px 14px;
    font-size: 0.85rem;
    background-color: transparent !important;
    color: var(--color-text-main) !important;
    /* Drawer mobile sempit (300px) — biarkan teks wrap */
    white-space: normal;
  }

  .dropdown-menu li a:hover,
  .is-sub-active > .sub-dropdown-toggle {
    color: var(--color-primary) !important;
    background-color: rgba(30, 120, 200, 0.07) !important;
  }

  .sub-menu-popup {
    position: static;
    box-shadow: none;
    border: none;
    margin-left: 14px;
    border-left: 2px solid var(--color-primary);
    border-radius: 0;
    background: transparent !important;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    padding: 0;
    min-width: 0;
  }

  .level-4-popup {
    border-left: 2px dashed #cbd5e1;
    margin-left: 14px;
  }

  .mobile-actions-footer {
    display: flex;
    flex-direction: column;
    margin-top: auto;
    position: sticky;
    bottom: 0;
    padding: 8px;
    background-color: #ffffff;
    border-top: 1px solid var(--color-border);
    gap: 2px;
    width: 100%;
    flex-shrink: 0;
  }

  .mobile-foot-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 38px;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition:
      background 0.15s,
      color 0.15s;
  }

  .mobile-foot-btn.text-muted {
    background: transparent;
    color: var(--color-text-main);
  }
  .mobile-foot-btn.text-muted:hover {
    background-color: rgba(30, 120, 200, 0.08);
    color: var(--color-primary);
  }

  .mobile-foot-btn.text-danger {
    background: transparent;
    color: #dc2626;
  }
  .mobile-foot-btn.text-danger:hover {
    background-color: #fee2e2;
  }

  .foot-icon {
    width: 17px;
    height: 17px;
  }
}
</style>
