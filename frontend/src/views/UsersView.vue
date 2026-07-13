<script setup>
import { ref, reactive, onMounted } from "vue";
import { userService, warehouseService } from "@/services/resources";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/toast";
import Modal from "@/components/ui/Modal.vue";
import { Plus, Pencil, UserX, ShieldCheck } from "@lucide/vue";

const auth = useAuthStore();
const toast = useToastStore();

const users = ref([]);
const warehouses = ref([]);
const loading = ref(true);
const modalOpen = ref(false);
const editing = ref(null);
const saving = ref(false);

const form = reactive({ name: "", email: "", password: "", role: "STAFF", warehouseId: "" });

const roleBadge = { ADMIN: "bg-amber-500/15 text-amber-400", MANAGER: "bg-teal-500/15 text-teal-400", STAFF: "bg-ink-700 text-ink-300" };

async function load() {
  loading.value = true;
  try {
    const [u, w] = await Promise.all([userService.list(), warehouseService.list()]);
    users.value = u;
    warehouses.value = w;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: "", email: "", password: "", role: "STAFF", warehouseId: "" });
  modalOpen.value = true;
}

function openEdit(user) {
  editing.value = user;
  Object.assign(form, { name: user.name, email: user.email, password: "", role: user.role, warehouseId: user.warehouseId || "" });
  modalOpen.value = true;
}

async function submitForm() {
  saving.value = true;
  try {
    if (editing.value) {
      const payload = { name: form.name, role: form.role, warehouseId: form.warehouseId || null };
      if (form.password) payload.password = form.password;
      await userService.update(editing.value.id, payload);
      toast.success("Pengguna diperbarui.");
    } else {
      await userService.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        warehouseId: form.warehouseId || undefined,
      });
      toast.success("Pengguna ditambahkan.");
    }
    modalOpen.value = false;
    await load();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menyimpan pengguna.");
  } finally {
    saving.value = false;
  }
}

async function deactivate(user) {
  if (!confirm(`Nonaktifkan akun "${user.name}"?`)) return;
  try {
    await userService.remove(user.id);
    toast.success("Pengguna dinonaktifkan.");
    await load();
  } catch (err) {
    toast.error(err.response?.data?.message || "Gagal menonaktifkan pengguna.");
  }
}

onMounted(load);
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto">
    <div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <p class="stencil-badge text-ink-500 text-[10px] mb-1.5">Akses</p>
        <h1 class="font-display text-3xl font-bold">Pengguna</h1>
      </div>
      <button @click="openCreate" class="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-ink-950 text-sm font-semibold px-3.5 py-2 transition-colors">
        <Plus :size="16" /> Tambah Pengguna
      </button>
    </div>

    <div class="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-ink-800 text-left text-ink-500 text-xs uppercase tracking-wide">
            <th class="px-4 py-3 font-medium">Nama</th>
            <th class="px-4 py-3 font-medium">Email</th>
            <th class="px-4 py-3 font-medium">Role</th>
            <th class="px-4 py-3 font-medium">Gudang</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-800">
          <tr v-for="u in users" :key="u.id" class="hover:bg-ink-800/40 transition-colors">
            <td class="px-4 py-3 font-medium text-ink-100 flex items-center gap-1.5">
              {{ u.name }}
              <ShieldCheck v-if="u.id === auth.user?.id" :size="13" class="text-amber-400" title="Kamu" />
            </td>
            <td class="px-4 py-3 text-ink-400">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium px-2 py-0.5 rounded" :class="roleBadge[u.role]">{{ u.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span v-if="u.warehouse" class="stencil-badge text-ink-400 text-[10px]">{{ u.warehouse.code }}</span>
              <span v-else class="text-ink-600 text-xs">Semua gudang</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium px-2 py-0.5 rounded" :class="u.isActive ? 'text-teal-400 bg-teal-500/10' : 'text-ink-500 bg-ink-800'">
                {{ u.isActive ? "Aktif" : "Nonaktif" }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <button @click="openEdit(u)" class="p-1.5 rounded text-ink-500 hover:text-amber-400 hover:bg-ink-800">
                  <Pencil :size="14" />
                </button>
                <button v-if="u.id !== auth.user?.id" @click="deactivate(u)" class="p-1.5 rounded text-ink-500 hover:text-rust-400 hover:bg-ink-800">
                  <UserX :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="py-16 text-center text-ink-500 text-sm">Memuat pengguna...</div>
    </div>

    <Modal :open="modalOpen" :title="editing ? 'Edit Pengguna' : 'Tambah Pengguna'" size="sm" @close="modalOpen = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Nama</label>
          <input v-model="form.name" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div v-if="!editing">
          <label class="block text-xs font-medium text-ink-400 mb-1.5">Email</label>
          <input v-model="form.email" type="email" required class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-400 mb-1.5">
            {{ editing ? "Kata Sandi Baru (opsional)" : "Kata Sandi" }}
          </label>
          <input v-model="form.password" type="password" :required="!editing" minlength="6" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Role</label>
            <select v-model="form.role" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Gudang</label>
            <select v-model="form.warehouseId" class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none">
              <option value="">Semua (Admin)</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.code }}</option>
            </select>
          </div>
        </div>
        <button type="submit" :disabled="saving" class="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm py-2.5 transition-colors">
          {{ saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Pengguna" }}
        </button>
      </form>
    </Modal>
  </div>
</template>
