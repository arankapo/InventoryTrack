<script setup>
import { ref, reactive, onMounted } from "vue";
import { warehouseService } from "@/services/resources";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import { Plus, Pencil, Trash2, MapPin, Users, Boxes } from "@lucide/vue";

const toast = useToastStore();
const warehouses = ref([]);
const loading = ref(true);
const modalOpen = ref(false);
const editing = ref(null);
const saving = ref(false);

const form = reactive({ name: "", code: "", address: "" });

async function load() {
  loading.value = true;
  try {
    warehouses.value = await warehouseService.list();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: "", code: "", address: "" });
  modalOpen.value = true;
}

function openEdit(wh) {
  editing.value = wh;
  Object.assign(form, { name: wh.name, code: wh.code, address: wh.address || "" });
  modalOpen.value = true;
}

async function submitForm() {
  saving.value = true;
  try {
    if (editing.value) {
      await warehouseService.update(editing.value.id, form);
      toast.success("Gudang diperbarui.");
    } else {
      await warehouseService.create(form);
      toast.success("Gudang ditambahkan.");
    }
    modalOpen.value = false;
    await load();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menyimpan gudang.");
  } finally {
    saving.value = false;
  }
}

async function removeWarehouse(wh) {
  if (!confirm(`Hapus gudang "${wh.name}"? Gudang dengan data stok tidak bisa dihapus.`)) return;
  try {
    await warehouseService.remove(wh.id);
    toast.success("Gudang dihapus.");
    await load();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menghapus gudang.");
  }
}

onMounted(load);
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <p class="stencil-badge text-ink-500 text-[10px] mb-1.5">Lokasi</p>
        <h1 class="font-display text-3xl font-bold">Gudang</h1>
      </div>
      <button @click="openCreate" class="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 text-sm font-semibold px-3.5 py-2 transition-colors">
        <Plus :size="16" /> Tambah Gudang
      </button>
    </div>

    <div v-if="loading" class="text-ink-500 text-sm">Memuat gudang...</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="wh in warehouses" :key="wh.id" class="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div class="flex items-start justify-between mb-3">
          <span class="stencil-badge text-amber-400">{{ wh.code }}</span>
          <div class="flex gap-1">
            <button @click="openEdit(wh)" class="p-1.5 rounded text-ink-500 hover:text-amber-400 hover:bg-ink-800">
              <Pencil :size="14" />
            </button>
            <button @click="removeWarehouse(wh)" class="p-1.5 rounded text-ink-500 hover:text-rust-400 hover:bg-ink-800">
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <h3 class="font-display text-xl font-semibold mb-1.5">{{ wh.name }}</h3>
        <p v-if="wh.address" class="text-xs text-ink-500 flex items-start gap-1.5 mb-3">
          <MapPin :size="13" class="shrink-0 mt-0.5" /> {{ wh.address }}
        </p>
        <div class="flex gap-4 text-xs text-ink-400 pt-3 border-t border-ink-800">
          <span class="flex items-center gap-1.5"><Users :size="13" /> {{ wh._count?.users ?? 0 }} pengguna</span>
          <span class="flex items-center gap-1.5"><Boxes :size="13" /> {{ wh._count?.stocks ?? 0 }} jenis stok</span>
        </div>
      </div>

      <div v-if="!warehouses.length" class="col-span-full py-16 text-center text-ink-500 text-sm">
        Belum ada gudang. Tambahkan gudang pertama kamu.
      </div>
    </div>

    <Modal :open="modalOpen" :title="editing ? 'Edit Gudang' : 'Tambah Gudang'" size="sm" @close="modalOpen = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Nama Gudang</label>
          <input v-model="form.name" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Kode Gudang</label>
          <input v-model="form.code" required placeholder="WH-JKT" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none font-mono uppercase" />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Alamat (opsional)</label>
          <textarea v-model="form.address" rows="2" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none resize-none"></textarea>
        </div>
        <button type="submit" :disabled="saving" class="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm py-2.5 transition-colors">
          {{ saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Gudang" }}
        </button>
      </form>
    </Modal>
  </div>
</template>
