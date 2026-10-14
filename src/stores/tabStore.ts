import { defineStore } from "pinia";
import { ref } from "vue";

export interface TabItem {
  name: string;
  title: string;
  path: string;
  params?: Record<string, any>;
  // Timestamp pembukaan — dipakai sebagai bagian key KeepAlive
  // (pola Manksi Web TabView) agar tiap tab punya cache sendiri dan
  // filter/state tidak hilang saat pindah tab.
  timestamp: number;
  // Ditandai true bila tab lama dibuka ulang — views boleh memakai ini
  // untuk refresh data (filter tetap dipertahankan).
  needsReset?: boolean;
}

const MAX_TABS = 10;

export const useTabStore = defineStore("tab", () => {
  const tabs = ref<TabItem[]>([]);
  const activeTabPath = ref<string>("");

  const addTab = (tab: Omit<TabItem, "timestamp">) => {
    const existing = tabs.value.find((t) => t.path === tab.path);
    if (!existing) {
      tabs.value.push({ ...tab, timestamp: Date.now() });
      if (tabs.value.length > MAX_TABS) {
        // Prune tab terlama SELAIN yang baru dibuka (Dashboard tak ada
        // di daftar ini sehingga tak ikut terprune). Selaras max KeepAlive.
        const pruneIdx = tabs.value.findIndex((t) => t.path !== tab.path);
        if (pruneIdx !== -1) tabs.value.splice(pruneIdx, 1);
      }
    } else if (activeTabPath.value !== existing.path) {
      existing.needsReset = true;
    }
    activeTabPath.value = tab.path;
  };

  const removeTab = (path: string, router: any) => {
    closeTab(path, router);
  };

  const closeTab = (path: string, router?: any) => {
    const index = tabs.value.findIndex((t) => t.path === path);
    if (index === -1) return;
    tabs.value.splice(index, 1);
    if (activeTabPath.value === path) {
      const nextTab = tabs.value[index - 1] || tabs.value[0];
      if (nextTab) {
        activeTabPath.value = nextTab.path;
        if (router) router.push(nextTab.path).catch(() => {});
      } else if (router) {
        router.push("/");
        activeTabPath.value = "/";
      }
    }
  };

  const setActiveTab = (path: string) => {
    if (tabs.value.some((t) => t.path === path)) {
      activeTabPath.value = path;
    }
  };

  return { tabs, activeTabPath, addTab, removeTab, closeTab, setActiveTab };
});
