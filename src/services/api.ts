import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { getDataMode } from "@/services/dataMode";

// Baca URL backend dari file .env (VITE_API_BASE_URL atau VITE_API_URL).
// Fallback ke server jika tidak didefinisikan.
const rawEnvUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ""
).trim();

const resolveBaseUrl = (url: string) => {
  if (!url) return "https://103.94.238.252/api";
  // Perbaiki otomatis jika ada typo http// atau https// tanpa titik dua
  let cleanUrl = url
    .replace(/^http\/\//i, "http://")
    .replace(/^https\/\//i, "https://")
    .replace(/\/+$/, "");

  // Pastikan berakhiran /api jika belum ada
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(rawEnvUrl),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }

  // Kirim mode data aktif ke backend (real / trial).
  // Autentikasi selalu memakai DB real.
  const url = String(config.url || "");
  const isAuthRequest = url.startsWith("/auth") || url.includes("/auth/");
  if (!isAuthRequest) {
    config.headers["X-Data-Mode"] = getDataMode();
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }
    return Promise.reject(err);
  },
);

export default api;
