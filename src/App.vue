<template>
  <v-app>
    <router-view />

    <!-- Banner Notifikasi Update di Bawah Layar (Tema Terang / Putih) -->
    <v-snackbar
      v-model="showUpdateSnackbar"
      :timeout="-1"
      location="bottom"
      color="white"
      elevation="6"
      rounded="lg"
      min-width="360"
      max-width="500"
      class="mb-3 update-snackbar"
    >
      <div
        class="d-flex align-center justify-space-between pb-1 mb-1 border-b"
        style="border-color: #e2e8f0 !important"
      >
        <div class="d-flex align-center">
          <v-icon color="primary" size="20" class="mr-2">
            mdi-cloud-download-outline
          </v-icon>
          <span class="text-subtitle-2 font-weight-bold text-grey-darken-4">
            Pembaruan Tersedia
          </span>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            color="primary"
            variant="flat"
            size="x-small"
            class="text-none font-weight-bold px-3 text-white"
            prepend-icon="mdi-refresh"
            @click="handleUpdate"
          >
            Update
          </v-btn>
          <v-btn
            color="grey-darken-1"
            variant="text"
            size="x-small"
            class="text-none font-weight-medium"
            @click="remindMeLater"
          >
            Nanti
          </v-btn>
        </div>
      </div>

      <!-- Keterangan kecil changelog di bawahnya -->
      <div
        v-if="serverChangelog && serverChangelog.length"
        class="changelog-container mt-1"
      >
        <div
          class="text-caption text-grey-darken-2 font-weight-bold mb-1"
          style="font-size: 11px"
        >
          Perubahan baru:
        </div>
        <ul class="changelog-list pl-4 ma-0 text-caption text-grey-darken-3">
          <li
            v-for="(item, idx) in serverChangelog"
            :key="idx"
            class="changelog-item"
          >
            <template v-if="typeof item === 'object'">
              <span
                v-if="item.type"
                :class="['tag-badge', `tag-${item.type}`]"
              >
                {{
                  item.type === 'fixed'
                    ? 'Perbaikan'
                    : item.type === 'added'
                      ? 'Baru'
                      : 'Update'
                }}
              </span>
              <span>{{ item.text }}</span>
            </template>
            <template v-else>
              <span>{{ item }}</span>
            </template>
          </li>
        </ul>
      </div>
      <div v-else class="text-caption text-grey-darken-1 mt-1">
        Harap perbarui aplikasi agar fitur terbaru aktif.
      </div>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

interface ChangelogItem {
  type?: "added" | "fixed" | "changed" | string;
  text?: string;
}

const router = useRouter();
const showUpdateSnackbar = ref(false);
const serverChangelog = ref<(string | ChangelogItem)[]>([]);
const currentServerHash = ref("");

const ACTIVE_HASH_KEY = "mmt_active_changelog_hash";
const DISMISSED_HASH_KEY = "mmt_dismissed_changelog_hash";

// Fungsi hash sederhana untuk membandingkan isi changelog
const computeHash = (content: any): string => {
  const str = typeof content === "string" ? content : JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

const checkForUpdates = async () => {
  try {
    const response = await fetch(
      `${window.location.origin}/version.json?t=${Date.now()}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) return;

    let text = await response.text();
    // Bersihkan komentar style JS jika ada (// atau /* */) agar JSON.parse tetap aman
    text = text.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1").trim();
    if (!text.startsWith("{")) return;

    const data = JSON.parse(text);
    const changelog = Array.isArray(data.changelog) ? data.changelog : [];
    const serverHash = computeHash(changelog.length ? changelog : data);

    currentServerHash.value = serverHash;
    serverChangelog.value = changelog;

    const activeHash = localStorage.getItem(ACTIVE_HASH_KEY);

    console.log(
      `[Update Check] Lokal Hash: ${activeHash} | Server Hash: ${serverHash}`,
    );

    // Kunjungan pertama: inisialisasi hash lokal tanpa memunculkan popup
    if (!activeHash) {
      localStorage.setItem(ACTIVE_HASH_KEY, serverHash);
    } else if (activeHash !== serverHash) {
      // Isi changelog berubah -> ada pembaruan!
      const dismissedHash = localStorage.getItem(DISMISSED_HASH_KEY);
      if (dismissedHash !== serverHash) {
        showUpdateSnackbar.value = true;
      }
    }
  } catch (error) {
    console.error("Gagal cek update aplikasi:", error);
  }
};

const handleUpdate = () => {
  if (currentServerHash.value) {
    localStorage.setItem(ACTIVE_HASH_KEY, currentServerHash.value);
    localStorage.removeItem(DISMISSED_HASH_KEY);
  }
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

const remindMeLater = () => {
  showUpdateSnackbar.value = false;
  if (currentServerHash.value) {
    localStorage.setItem(DISMISSED_HASH_KEY, currentServerHash.value);
  }
};

onMounted(() => {
  checkForUpdates();
  setInterval(checkForUpdates, 300000);

  router.afterEach(() => {
    checkForUpdates();
  });
});

window.addEventListener("vite:preloadError", () => {
  window.location.reload();
});
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f9;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.v-card {
  border-radius: 12px !important;
}

/* =========================================================
   STYLE BANNER UPDATE & CHANGELOG (TEMA TERANG / PUTIH)
========================================================= */
.update-snackbar :deep(.v-snackbar__wrapper) {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12),
    0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
}

.update-snackbar :deep(.v-snackbar__content) {
  padding: 10px 14px !important;
  width: 100%;
  color: #0f172a !important;
}

.changelog-container {
  max-height: 120px;
  overflow-y: auto;
}

.changelog-list {
  font-size: 11.5px;
  line-height: 1.5;
  color: #334155 !important;
}

.changelog-item {
  margin-bottom: 2px;
}

.tag-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 6px;
  line-height: 1.2;
}

.tag-fixed {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.tag-added {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.tag-changed,
.tag-update {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

/* =========================================================
   PENGAMAN HALAMAN CETAK (PRINT SAFETY)
   Mencegah style global App.vue merusak halaman cetak
========================================================= */
@media print {
  body {
    background-color: #ffffff !important;
    height: auto !important;
    overflow: visible !important;
  }

  #app {
    height: auto !important;
    width: 100% !important;
    overflow: visible !important;
  }

  /* Jika ada v-card yang digunakan di halaman cetak, kembalikan ke normal */
  .v-card {
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
</style>
