<script setup>
import { ref, onMounted } from "vue";
import { categoryService } from "@/services/resources";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import { Trash2, Plus } from "@lucide/vue";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close", "changed"]);
const toast = useToastStore();

const categories = ref([]);
const newName = ref("");
const saving = ref(false);

async function load() {
  categories.value = await categoryService.list();
}

async function addCategory() {
  if (!newName.value.trim()) return;
  saving.value = true;
  try {
    await categoryService.create({ name: newName.value.trim() });
    newName.value = "";
    await load();
    emit("changed");
    toast.success("Kategori ditambahkan.");
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menambah kategori.");
  } finally {
    saving.value = false;
  }
}

async function removeCategory(cat) {
  if (cat._count?.products > 0) {
    toast.error("Kategori ini masih dipakai produk lain.");
    return;
  }
  try {
    await categoryService.remove(cat.id);
    await load();
    emit("changed");
    toast.success("Kategori dihapus.");
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menghapus kategori.");
  }
}

onMounted(load);
</script>

<template>
  <Modal :open="open" title="Kelola Kategori" size="sm" @close="emit('close')">
    <form @submit.prevent="addCategory" class="flex gap-2 mb-4">
      <input
        v-model="newName"
        placeholder="Nama kategori baru"
        class="flex-1 rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
      />
      <button type="submit" :disabled="saving" class="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 px-3 disabled:opacity-60">
        <Plus :size="16" />
      </button>
    </form>

    <ul class="divide-y divide-ink-800 max-h-72 overflow-y-auto">
      <li v-for="cat in categories" :key="cat.id" class="py-2.5 flex items-center justify-between text-sm">
        <span>{{ cat.name }}</span>
        <div class="flex items-center gap-3">
          <span class="text-xs text-ink-500">{{ cat._count?.products ?? 0 }} produk</span>
          <button @click="removeCategory(cat)" class="text-ink-500 hover:text-rust-400">
            <Trash2 :size="14" />
          </button>
        </div>
      </li>
      <li v-if="!categories.length" class="py-4 text-center text-ink-500 text-sm">Belum ada kategori.</li>
    </ul>
  </Modal>
</template>
