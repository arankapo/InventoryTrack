import { defineStore } from "pinia";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("inventrack_token") || null,
    user: JSON.parse(localStorage.getItem("inventrack_user") || "null"),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === "ADMIN",
    isManager: (state) => state.user?.role === "MANAGER",
    isStaff: (state) => state.user?.role === "STAFF",
    canManageCatalog: (state) => ["ADMIN", "MANAGER"].includes(state.user?.role),
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post("/auth/login", { email, password });
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem("inventrack_token", this.token);
        localStorage.setItem("inventrack_user", JSON.stringify(this.user));
        return true;
      } catch (err) {
        this.error = err.response?.data?.message || "Gagal masuk. Coba lagi.";
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("inventrack_token");
      localStorage.removeItem("inventrack_user");
    },

    async fetchMe() {
      try {
        const { data } = await api.get("/auth/me");
        this.user = { ...this.user, ...data.data };
        localStorage.setItem("inventrack_user", JSON.stringify(this.user));
      } catch {
        // token invalid/expired — the axios interceptor already handles redirect
      }
    },
  },
});
