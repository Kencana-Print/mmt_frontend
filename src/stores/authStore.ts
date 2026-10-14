import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  const router = useRouter();

  // Payload user backend memakai kdUser/nmUser (bukan kode/nama ala
  // Manksi) — normalisasi alias di sini agar seluruh konsumen
  // (presence socket, cek admin, myUserKode) konsisten.
  const normalizeUser = (u: any) => {
    if (!u || typeof u !== "object") return u;
    return {
      ...u,
      kode: u.kode ?? u.kdUser ?? u.username ?? "",
      nama: u.nama ?? u.nmUser ?? u.username ?? "",
    };
  };

  const token = ref(localStorage.getItem("authToken"));
  const user = ref(normalizeUser(JSON.parse(localStorage.getItem("userData") || "null")));
  const permissions = ref([]);

  const isTokenExpired = computed(() => {
    if (!token.value) return true;
    try {
      const decoded = jwtDecode(token.value);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  });

  const isAuthenticated = computed(() => {
    return !!token.value && !isTokenExpired.value;
  });

  async function login(username, password) {
    try {
      const { data } = await api.post("/auth/login", {
        username,
        password,
      });

      token.value = data.token;
      user.value = normalizeUser(data.user);
      permissions.value = data.permissions || [];

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(user.value));
      localStorage.setItem("userPermissions", JSON.stringify(data.permissions || []));

      router.replace("/");
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Gagal login ke server"
      );
    }
  }

  async function register(username) {
    try {
      const { data } = await api.post("/auth/register", { username });
      return data.message;
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Gagal registrasi"
      );
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    permissions.value = [];

    localStorage.clear();
    router.replace("/login");
  }

  // Dipanggil router guard saat token kedaluwarsa.
  // Hanya bersihkan sesi; redirect ke Login dilakukan oleh guard.
  function handleSessionExpired() {
    token.value = null;
    user.value = null;
    permissions.value = [];

    localStorage.clear();
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    isTokenExpired,
    login,
    register,
    logout,
    handleSessionExpired,
  };
});
