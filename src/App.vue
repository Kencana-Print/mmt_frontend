<template>
  <v-app>
    <router-view />

    <!-- Banner Notifikasi Update di Bawah Layar -->
    <v-snackbar
      v-model="showUpdateSnackbar"
      :timeout="-1"
      location="bottom"
      color="#1e2327"
      elevation="8"
      rounded="lg"
      min-width="360"
      max-width="500"
      class="mb-3 update-snackbar"
    >
      <div
        class="d-flex align-center justify-space-between pb-1 mb-1 border-b-sm"
        style="border-color: rgba(255, 255, 255, 0.12) !important"
      >
        <div class="d-flex align-center">
          <v-icon color="amber-accent-3" size="20" class="mr-2">
            mdi-cloud-download-outline
          </v-icon>
          <span class="text-subtitle-2 font-weight-bold text-white">
            Pembaruan Tersedia
          </span>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            color="amber-accent-3"
            variant="flat"
            size="x-small"
            class="text-none font-weight-bold text-black px-3"
            prepend-icon="mdi-refresh"
            @click="handleUpdate"
          >
            Update
          </v-btn>
          <v-btn
            color="grey-lighten-2"
            variant="text"
            size="x-small"
            class="text-none"
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
        <div class="text-caption text-grey-lighten-2 font-weight-medium mb-1">
          Perubahan baru:
        </div>
        <ul class="changelog-list pl-4 ma-0 text-caption text-grey-lighten-1">
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
      <div v-else class="text-caption text-grey-lighten-1 mt-1">
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

    const text = await response.text();
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
   STYLE BANNER UPDATE & CHANGELOG
========================================================= */
.update-snackbar :deep(.v-snackbar__content) {
  padding: 10px 14px !important;
  width: 100%;
}

.changelog-container {
  max-height: 120px;
  overflow-y: auto;
}

.changelog-list {
  font-size: 11.5px;
  line-height: 1.5;
}

.changelog-item {
  margin-bottom: 2px;
}

.tag-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 6px;
  line-height: 1.2;
}

.tag-fixed {
  background: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.tag-added {
  background: rgba(34, 197, 94, 0.25);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.tag-changed,
.tag-update {
  background: rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.35);
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
