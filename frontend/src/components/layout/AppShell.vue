<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowRightLeft,
  Users,
  LogOut,
  PackageSearch,
} from "@lucide/vue";

const auth = useAuthStore();
const router = useRouter();

const navItems = computed(() =>
  [
    { name: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { name: "products", label: "Produk", icon: Package },
    { name: "stock", label: "Stok & Mutasi", icon: ArrowRightLeft },
    { name: "warehouses", label: "Gudang", icon: Warehouse, roles: ["ADMIN"] },
    { name: "users", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  ].filter((item) => !item.roles || item.roles.includes(auth.user?.role))
);

const roleLabel = computed(
  () => ({ ADMIN: "Admin", MANAGER: "Manager", STAFF: "Staff" }[auth.user?.role] || "")
);

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-ink-950 text-ink-100 flex font-sans">
    <!-- Sidebar -->
    <aside class="w-60 shrink-0 bg-ink-900 border-r border-ink-800 flex flex-col">
      <div class="h-16 flex items-center gap-2.5 px-5 border-b border-ink-800">
        <div class="w-8 h-8 rounded-md bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
          <PackageSearch :size="16" class="text-amber-400" />
        </div>
        <span class="font-display text-xl font-bold tracking-tight leading-none">
          INVEN<span class="text-amber-400">TRACK</span>
        </span>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-0.5">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2"
          active-class="!bg-ink-800 !border-amber-400 !text-ink-100"
          :class="'border-transparent text-ink-400 hover:bg-ink-800/60 hover:text-ink-200'"
        >
          <component :is="item.icon" :size="17" />
          {{ item.label }}
        </router-link>
      </nav>

      <div class="p-3 border-t border-ink-800">
        <div v-if="auth.user?.warehouse" class="mb-2 px-3">
          <p class="text-[10px] uppercase tracking-wider text-ink-500 mb-1">Gudang ditugaskan</p>
          <span class="stencil-badge text-teal-400 text-[10px]">{{ auth.user.warehouse.code }}</span>
        </div>
        <div class="flex items-center gap-2.5 px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-ink-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium truncate leading-tight">{{ auth.user?.name }}</p>
            <p class="text-[11px] text-ink-500 leading-tight">{{ roleLabel }}</p>
          </div>
          <button @click="logout" title="Keluar" class="text-ink-500 hover:text-rust-400 transition-colors shrink-0">
            <LogOut :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 min-w-0 overflow-y-auto">
      <router-view />
    </div>
  </div>
</template>
