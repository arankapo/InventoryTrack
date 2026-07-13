<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { stockService, productService, warehouseService } from "@/services/resources";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import {
  Plus,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Settings2,
  Search,
  Boxes,
  History,
} from "@lucide/vue";

const auth = useAuthStore();
const toast = useToastStore();

const tab = ref("levels"); // levels | history
const stocks = ref([]);
const movements = ref([]);
const products = ref([]);
const warehouses = ref([]);
const loading = ref(true);
const warehouseFilter = ref("");

const modalOpen = ref(false);
const saving = ref(false);
const productQuery = ref("");
const showProductList = ref(false);

const MOVEMENT_TYPES = [
  { value: "IN", label: "Masuk", icon: ArrowDown, color: "teal" },
  { value: "OUT", label: "Keluar", icon: ArrowUp, color: "rust" },
  { value: "TRANSFER", label: "Transfer", icon: ArrowRightLeft, color: "amber" },
  { value: "ADJUSTMENT", label: "Penyesuaian", icon: Settings2, color: "ink" },
];

const typeColorClasses = {
  teal: "bg-teal-500/15 text-teal-400 border-teal-500/40",
  rust: "bg-rust-500/15 text-rust-400 border-rust-500/40",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  ink: "bg-ink-700/60 text-ink-300 border-ink-600",
};

const form = reactive({
  type: "IN",
  productId: "",
  warehouseId: "",
  destinationWarehouseId: "",
  quantity: "",
  note: "",
});

const selectedProduct = computed(() => products.value.find((p) => p.id === form.productId));
const filteredProducts = computed(() => {
  const q = productQuery.value.toLowerCase();
  if (!q) return products.value.slice(0, 8);
  return products.value
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 8);
});

async function loadAll() {
  loading.value = true;
  try {
    const [stockData, productData, warehouseData] = await Promise.all([
      stockService.levels({ warehouseId: warehouseFilter.value || undefined }),
      productService.list(),
      warehouseService.list(),
    ]);
    stocks.value = stockData;
    products.value = productData;
    warehouses.value = warehouseData;
  } finally {
    loading.value = false;
  }
}

async function loadMovements() {
  movements.value = await stockService.movements({ warehouseId: warehouseFilter.value || undefined, limit: 100 });
}

watch(warehouseFilter, () => {
  loadAll();
  if (tab.value === "history") loadMovements();
});

watch(tab, (t) => {
  if (t === "history" && !movements.value.length) loadMovements();
});

function openMovementModal() {
  Object.assign(form, {
    type: "IN",
    productId: "",
    warehouseId: auth.isAdmin ? warehouses.value[0]?.id || "" : "",
    destinationWarehouseId: "",
    quantity: "",
    note: "",
  });
  productQuery.value = "";
  modalOpen.value = true;
}

function pickProduct(p) {
  form.productId = p.id;
  productQuery.value = `${p.name} (${p.sku})`;
  showProductList.value = false;
}

async function submitMovement() {
  if (!form.productId) {
    toast.error("Pilih produk terlebih dahulu.");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      productId: form.productId,
      type: form.type,
      quantity: Number(form.quantity),
      note: form.note || undefined,
    };
    if (auth.isAdmin && form.warehouseId) payload.warehouseId = form.warehouseId;
    if (form.type === "TRANSFER") payload.destinationWarehouseId = form.destinationWarehouseId;

    await stockService.recordMovement(payload);
    toast.success("Mutasi stok berhasil dicatat.");
    modalOpen.value = false;
    await loadAll();
    if (tab.value === "history") await loadMovements();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal mencatat mutasi.");
  } finally {
    saving.value = false;
  }
}

function typeMeta(type) {
  return MOVEMENT_TYPES.find((t) => t.value === type);
}

const dateFmt = (d) => new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

onMounted(loadAll);
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <p class="stencil-badge text-ink-500 text-[10px] mb-1.5">Operasional</p>
        <h1 class="font-display text-3xl font-bold">Stok & Mutasi</h1>
      </div>
      <button @click="openMovementModal" class="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 text-sm font-semibold px-3.5 py-2 transition-colors">
        <Plus :size="16" /> Catat Mutasi
      </button>
    </div>

    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div class="flex gap-1 bg-ink-900 border border-ink-800 rounded-lg p-1">
        <button
          @click="tab = 'levels'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          :class="tab === 'levels' ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'"
        >
          <Boxes :size="14" /> Stok Saat Ini
        </button>
        <button
          @click="tab = 'history'"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          :class="tab === 'history' ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-200'"
        >
          <History :size="14" /> Riwayat Mutasi
        </button>
      </div>

      <select v-if="auth.isAdmin" v-model="warehouseFilter" class="rounded-lg bg-ink-900 border border-ink-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
        <option value="">Semua Gudang</option>
        <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} ({{ w.code }})</option>
      </select>
    </div>

    <!-- Current stock levels -->
    <div v-if="tab === 'levels'" class="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-ink-800 text-left text-ink-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Produk</th>
            <th class="px-4 py-3 font-medium">Gudang</th>
            <th class="px-4 py-3 font-medium text-right">Kuantitas</th>
            <th class="px-4 py-3 font-medium text-right">Titik Reorder</th>
            <th class="px-4 py-3 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-800">
          <tr v-for="s in stocks" :key="s.id" class="hover:bg-ink-800/40 transition-colors">
            <td class="px-4 py-3">
              <p class="font-medium text-ink-100">{{ s.product.name }}</p>
              <p class="text-xs text-ink-500 font-mono">{{ s.product.sku }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="stencil-badge text-ink-400 text-[10px]">{{ s.warehouse.code }}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono font-semibold" :class="s.lowStock ? 'text-rust-400' : 'text-ink-200'">
              {{ s.quantity }} <span class="text-ink-500 font-normal">{{ s.product.unit }}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono text-ink-500">{{ s.product.reorderPoint }}</td>
            <td class="px-4 py-3 text-right">
              <span v-if="s.lowStock" class="text-xs font-medium text-rust-400 bg-rust-500/10 px-2 py-0.5 rounded">Menipis</span>
              <span v-else class="text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">Aman</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && !stocks.length" class="py-16 text-center text-ink-500 text-sm">Belum ada data stok.</div>
      <div v-if="loading" class="py-16 text-center text-ink-500 text-sm">Memuat stok...</div>
    </div>

    <!-- Movement history -->
    <div v-else class="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-ink-800 text-left text-ink-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Waktu</th>
            <th class="px-4 py-3 font-medium">Tipe</th>
            <th class="px-4 py-3 font-medium">Produk</th>
            <th class="px-4 py-3 font-medium">Gudang</th>
            <th class="px-4 py-3 font-medium text-right">Jumlah</th>
            <th class="px-4 py-3 font-medium">Oleh</th>
            <th class="px-4 py-3 font-medium">Catatan</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-800">
          <tr v-for="m in movements" :key="m.id" class="hover:bg-ink-800/40 transition-colors">
            <td class="px-4 py-3 text-ink-500 text-xs whitespace-nowrap">{{ dateFmt(m.createdAt) }}</td>
            <td class="px-4 py-3">
              <span class="flex items-center gap-1.5 w-fit text-xs font-medium px-2 py-0.5 rounded border" :class="typeColorClasses[typeMeta(m.type).color]">
                <component :is="typeMeta(m.type).icon" :size="12" /> {{ typeMeta(m.type).label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <p class="text-ink-200">{{ m.product.name }}</p>
              <p class="text-xs text-ink-500 font-mono">{{ m.product.sku }}</p>
            </td>
            <td class="px-4 py-3 text-ink-400 text-xs">
              {{ m.warehouse.code }}<span v-if="m.destinationWarehouse"> → {{ m.destinationWarehouse.code }}</span>
            </td>
            <td class="px-4 py-3 text-right font-mono font-semibold" :class="typeColorClasses[typeMeta(m.type).color].split(' ')[1]">
              {{ m.type === "OUT" || m.type === "TRANSFER" ? "-" : m.quantity > 0 ? "+" : "" }}{{ Math.abs(m.quantity) }}
            </td>
            <td class="px-4 py-3 text-ink-400 text-xs">{{ m.user.name }}</td>
            <td class="px-4 py-3 text-ink-500 text-xs max-w-[160px] truncate">{{ m.note || "—" }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!movements.length" class="py-16 text-center text-ink-500 text-sm">Belum ada riwayat mutasi.</div>
    </div>

    <!-- Record movement modal -->
    <Modal :open="modalOpen" title="Catat Mutasi Stok" @close="modalOpen = false">
      <form @submit.prevent="submitMovement" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Tipe Mutasi</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="t in MOVEMENT_TYPES"
              :key="t.value"
              type="button"
              @click="form.type = t.value"
              class="flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors"
              :class="form.type === t.value ? typeColorClasses[t.color] : 'border-ink-700 text-ink-500 hover:border-ink-600'"
            >
              <component :is="t.icon" :size="15" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <div class="relative">
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Produk</label>
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              v-model="productQuery"
              @focus="showProductList = true"
              @input="form.productId = ''; showProductList = true"
              placeholder="Cari nama atau SKU produk..."
              class="w-full rounded-lg bg-ink-800 border border-ink-600 pl-8 pr-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div v-if="showProductList && filteredProducts.length" class="absolute z-10 mt-1 w-full bg-ink-800 border border-ink-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
            <button
              v-for="p in filteredProducts"
              :key="p.id"
              type="button"
              @click="pickProduct(p)"
              class="w-full text-left px-3 py-2 text-sm hover:bg-ink-700 flex items-center justify-between"
            >
              <span>{{ p.name }}</span>
              <span class="text-xs font-mono text-ink-500">{{ p.sku }}</span>
            </button>
          </div>
        </div>

        <div v-if="auth.isAdmin" class="grid" :class="form.type === 'TRANSFER' ? 'grid-cols-2 gap-3' : 'grid-cols-1'">
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">{{ form.type === "TRANSFER" ? "Dari Gudang" : "Gudang" }}</label>
            <select v-model="form.warehouseId" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div v-if="form.type === 'TRANSFER'">
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Ke Gudang</label>
            <select v-model="form.destinationWarehouseId" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option value="" disabled>Pilih tujuan</option>
              <option v-for="w in warehouses.filter((w) => w.id !== form.warehouseId)" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
        </div>
        <div v-else-if="form.type === 'TRANSFER'">
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Ke Gudang</label>
          <select v-model="form.destinationWarehouseId" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
            <option value="" disabled>Pilih tujuan</option>
            <option v-for="w in warehouses.filter((w) => w.id !== auth.user.warehouseId)" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">
            Kuantitas {{ form.type === "ADJUSTMENT" ? "(gunakan minus untuk pengurangan, mis. -5)" : "" }}
          </label>
          <input
            v-model="form.quantity"
            type="number"
            :step="1"
            required
            class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Catatan (opsional)</label>
          <input v-model="form.note" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>

        <button type="submit" :disabled="saving" class="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm py-2.5 transition-colors">
          {{ saving ? "Menyimpan..." : "Catat Mutasi" }}
        </button>
      </form>
    </Modal>
  </div>
</template>
