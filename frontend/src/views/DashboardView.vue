<script setup>
import { ref, onMounted, computed } from "vue";
import { Line, Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
} from "chart.js";
import { dashboardService } from "@/services/resources";
import { useAuthStore } from "@/stores/auth";
import {
  Package,
  Warehouse,
  Wallet,
  TriangleAlert,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Settings2,
} from "@lucide/vue";
import StatCard from "@/components/ui/StatCard.vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler);

const auth = useAuthStore();
const loading = ref(true);
const data = ref(null);

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const movementTypeMeta = {
  IN: { icon: ArrowDown, color: "text-teal-400", label: "Masuk" },
  OUT: { icon: ArrowUp, color: "text-rust-400", label: "Keluar" },
  TRANSFER: { icon: ArrowRightLeft, color: "text-amber-400", label: "Transfer" },
  ADJUSTMENT: { icon: Settings2, color: "text-ink-300", label: "Penyesuaian" },
};

const trendChartData = computed(() => {
  const trend = data.value?.movementTrend || [];
  return {
    labels: trend.map((t) =>
      new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    ),
    datasets: [
      {
        label: "Masuk",
        data: trend.map((t) => t.in),
        borderColor: "#4FA88A",
        backgroundColor: "rgba(79, 168, 138, 0.12)",
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "Keluar",
        data: trend.map((t) => t.out),
        borderColor: "#D1554A",
        backgroundColor: "rgba(209, 85, 74, 0.08)",
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
});

const trendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, labels: { color: "#B4C2CC", boxWidth: 10, font: { size: 11 } } } },
  scales: {
    x: { ticks: { color: "#5C7286", font: { size: 10 } }, grid: { display: false } },
    y: { ticks: { color: "#5C7286", font: { size: 10 } }, grid: { color: "#1E2A38" }, beginAtZero: true },
  },
};

const warehouseChartData = computed(() => {
  const rows = data.value?.stockByWarehouse || [];
  const palette = ["#E8A33D", "#4FA88A", "#D1554A", "#5C7286", "#8598A8", "#F0B75E"];
  return {
    labels: rows.map((r) => r.warehouse),
    datasets: [
      {
        data: rows.map((r) => r.quantity),
        backgroundColor: rows.map((_, i) => palette[i % palette.length]),
        borderColor: "#161F2B",
        borderWidth: 2,
      },
    ],
  };
});

const warehouseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right", labels: { color: "#B4C2CC", boxWidth: 10, font: { size: 11 }, padding: 12 } } },
};

async function load() {
  loading.value = true;
  try {
    data.value = await dashboardService.summary();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="mb-7">
      <p class="stencil-badge text-ink-500 text-[10px] mb-1.5">Ringkasan</p>
      <h1 class="font-display text-3xl font-bold">Dashboard</h1>
      <p class="text-ink-400 text-sm mt-1">
        Selamat datang kembali, {{ auth.user?.name }} — berikut kondisi inventory
        {{ auth.isAdmin ? "di semua gudang" : "di gudang kamu" }} hari ini.
      </p>
    </div>

    <div v-if="loading" class="text-ink-500 text-sm">Memuat data dashboard...</div>

    <template v-else-if="data">
      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Produk Aktif" :value="data.totalProducts" :icon="Package" accent="ink" />
        <StatCard
          label="Total Gudang"
          :value="data.totalWarehouses"
          :icon="Warehouse"
          accent="ink"
        />
        <StatCard label="Nilai Stok" :value="rupiah(data.totalStockValue)" :icon="Wallet" accent="teal" />
        <StatCard
          label="Stok Menipis"
          :value="data.lowStockCount"
          :icon="TriangleAlert"
          accent="rust"
          :sub="data.lowStockCount > 0 ? 'perlu restock' : 'semua aman'"
        />
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="lg:col-span-2 bg-ink-900 border border-ink-800 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-ink-200 mb-4">Mutasi Stok — 30 Hari Terakhir</h3>
          <div class="h-64">
            <Line v-if="data.movementTrend.length" :data="trendChartData" :options="trendOptions" />
            <div v-else class="h-full flex items-center justify-center text-ink-500 text-sm">Belum ada data mutasi.</div>
          </div>
        </div>
        <div class="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-ink-200 mb-4">Stok per Gudang</h3>
          <div class="h-64">
            <Doughnut v-if="data.stockByWarehouse.length" :data="warehouseChartData" :options="warehouseChartOptions" />
            <div v-else class="h-full flex items-center justify-center text-ink-500 text-sm">Belum ada data stok.</div>
          </div>
        </div>
      </div>

      <!-- Lists -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-ink-200 mb-4 flex items-center gap-2">
            <TriangleAlert :size="15" class="text-rust-400" /> Perlu Restock
          </h3>
          <div v-if="!data.lowStockItems.length" class="text-ink-500 text-sm py-6 text-center">
            Semua produk stoknya aman.
          </div>
          <ul v-else class="divide-y divide-ink-800">
            <li v-for="item in data.lowStockItems" :key="item.sku + item.warehouse" class="py-2.5 flex items-center justify-between text-sm">
              <div class="min-w-0">
                <p class="font-medium text-ink-200 truncate">{{ item.productName }}</p>
                <p class="text-xs text-ink-500 font-mono">{{ item.sku }} · {{ item.warehouse }}</p>
              </div>
              <span class="text-rust-400 font-mono font-semibold shrink-0 ml-3">{{ item.quantity }}/{{ item.reorderPoint }}</span>
            </li>
          </ul>
        </div>

        <div class="bg-ink-900 border border-ink-800 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-ink-200 mb-4">Aktivitas Terbaru</h3>
          <div v-if="!data.recentMovements.length" class="text-ink-500 text-sm py-6 text-center">
            Belum ada mutasi tercatat.
          </div>
          <ul v-else class="divide-y divide-ink-800">
            <li v-for="m in data.recentMovements" :key="m.id" class="py-2.5 flex items-center gap-3 text-sm">
              <component :is="movementTypeMeta[m.type].icon" :size="15" :class="movementTypeMeta[m.type].color" class="shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-ink-200 truncate">{{ m.product.name }}</p>
                <p class="text-xs text-ink-500">{{ m.warehouse.name }} · {{ m.user.name }}</p>
              </div>
              <span class="font-mono text-xs shrink-0" :class="movementTypeMeta[m.type].color">
                {{ m.type === "OUT" || m.type === "TRANSFER" ? "-" : m.quantity > 0 ? "+" : "" }}{{ Math.abs(m.quantity) }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
