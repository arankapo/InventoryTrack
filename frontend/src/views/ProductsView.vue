<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { productService, categoryService } from "@/services/resources";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import CategoryManagerModal from "@/components/ui/CategoryManagerModal.vue";
import { Plus, Search, Pencil, Archive, Tags, PackageX } from "@lucide/vue";

const auth = useAuthStore();
const toast = useToastStore();

const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const search = ref("");
const categoryFilter = ref("");

const modalOpen = ref(false);
const categoryModalOpen = ref(false);
const editing = ref(null);
const saving = ref(false);

const form = reactive({
  sku: "",
  name: "",
  description: "",
  unit: "pcs",
  price: 0,
  reorderPoint: 10,
  categoryId: "",
});

function resetForm() {
  Object.assign(form, { sku: "", name: "", description: "", unit: "pcs", price: 0, reorderPoint: 10, categoryId: "" });
}

async function loadProducts() {
  loading.value = true;
  try {
    products.value = await productService.list({
      search: search.value || undefined,
      categoryId: categoryFilter.value || undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function loadCategories() {
  categories.value = await categoryService.list();
}

let searchTimeout;
watch([search, categoryFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadProducts, 300);
});

function openCreate() {
  editing.value = null;
  resetForm();
  modalOpen.value = true;
}

function openEdit(product) {
  editing.value = product;
  Object.assign(form, {
    sku: product.sku,
    name: product.name,
    description: product.description || "",
    unit: product.unit,
    price: product.price,
    reorderPoint: product.reorderPoint,
    categoryId: product.categoryId || "",
  });
  modalOpen.value = true;
}

async function submitForm() {
  saving.value = true;
  const payload = { ...form, price: Number(form.price), reorderPoint: Number(form.reorderPoint) };
  if (!payload.categoryId) delete payload.categoryId;
  try {
    if (editing.value) {
      await productService.update(editing.value.id, payload);
      toast.success("Produk diperbarui.");
    } else {
      await productService.create(payload);
      toast.success("Produk ditambahkan.");
    }
    modalOpen.value = false;
    await loadProducts();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menyimpan produk.");
  } finally {
    saving.value = false;
  }
}

async function archiveProduct(product) {
  if (!confirm(`Arsipkan produk "${product.name}"? Produk tidak akan muncul lagi di daftar aktif.`)) return;
  try {
    await productService.remove(product.id);
    toast.success("Produk diarsipkan.");
    await loadProducts();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal mengarsipkan produk.");
  }
}

const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

onMounted(() => {
  loadProducts();
  loadCategories();
});
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <p class="stencil-badge text-ink-500 text-[10px] mb-1.5">Katalog</p>
        <h1 class="font-display text-3xl font-bold">Produk</h1>
      </div>
      <div v-if="auth.canManageCatalog" class="flex gap-2">
        <button @click="categoryModalOpen = true" class="flex items-center gap-1.5 rounded-lg border border-ink-700 hover:bg-ink-800 text-ink-300 text-sm font-medium px-3.5 py-2 transition-colors">
          <Tags :size="15" /> Kategori
        </button>
        <button @click="openCreate" class="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 text-sm font-semibold px-3.5 py-2 transition-colors">
          <Plus :size="16" /> Tambah Produk
        </button>
      </div>
    </div>

    <div class="flex gap-3 mb-4 flex-wrap">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          v-model="search"
          placeholder="Cari nama atau SKU..."
          class="w-full rounded-lg bg-ink-900 border border-ink-700 pl-9 pr-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
      <select v-model="categoryFilter" class="rounded-lg bg-ink-900 border border-ink-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-ink-800 text-left text-ink-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">SKU</th>
            <th class="px-4 py-3 font-medium">Nama Produk</th>
            <th class="px-4 py-3 font-medium">Kategori</th>
            <th class="px-4 py-3 font-medium text-right">Harga</th>
            <th class="px-4 py-3 font-medium text-right">Total Stok</th>
            <th v-if="auth.canManageCatalog" class="px-4 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-800">
          <tr v-for="p in products" :key="p.id" class="hover:bg-ink-800/40 transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-ink-400">{{ p.sku }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-ink-100">{{ p.name }}</p>
              <p class="text-xs text-ink-500">{{ p.unit }}</p>
            </td>
            <td class="px-4 py-3 text-ink-400">{{ p.category?.name || "—" }}</td>
            <td class="px-4 py-3 text-right font-mono text-ink-300">{{ rupiah(p.price) }}</td>
            <td class="px-4 py-3 text-right">
              <span
                class="font-mono font-semibold px-2 py-0.5 rounded"
                :class="p.lowStock ? 'text-rust-400 bg-rust-500/10' : 'text-ink-200'"
              >
                {{ p.totalQuantity }}
              </span>
            </td>
            <td v-if="auth.canManageCatalog" class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <button @click="openEdit(p)" class="p-1.5 rounded text-ink-500 hover:text-amber-400 hover:bg-ink-800">
                  <Pencil :size="14" />
                </button>
                <button v-if="auth.isAdmin" @click="archiveProduct(p)" class="p-1.5 rounded text-ink-500 hover:text-rust-400 hover:bg-ink-800">
                  <Archive :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && !products.length" class="py-16 text-center text-ink-500">
        <PackageX :size="28" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">Tidak ada produk ditemukan.</p>
      </div>
      <div v-if="loading" class="py-16 text-center text-ink-500 text-sm">Memuat produk...</div>
    </div>

    <Modal :open="modalOpen" :title="editing ? 'Edit Produk' : 'Tambah Produk'" @close="modalOpen = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">SKU</label>
            <input v-model="form.sku" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Satuan</label>
            <input v-model="form.unit" placeholder="pcs, box, kg..." class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Nama Produk</label>
          <input v-model="form.name" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Kategori</label>
          <select v-model="form.categoryId" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
            <option value="">Tanpa kategori</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Harga (Rp)</label>
            <input v-model="form.price" type="number" min="0" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Titik Reorder</label>
            <input v-model="form.reorderPoint" type="number" min="0" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Deskripsi (opsional)</label>
          <textarea v-model="form.description" rows="2" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"></textarea>
        </div>
        <button type="submit" :disabled="saving" class="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm py-2.5 transition-colors">
          {{ saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Produk" }}
        </button>
      </form>
    </Modal>

    <CategoryManagerModal :open="categoryModalOpen" @close="categoryModalOpen = false" @changed="loadCategories" />
  </div>
</template>
