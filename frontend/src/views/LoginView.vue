<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { PackageSearch, Loader2, TriangleAlert } from "@lucide/vue";

const email = ref("admin@inventrack.dev");
const password = ref("");
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

async function onSubmit() {
  const ok = await auth.login(email.value, password.value);
  if (ok) router.push(route.query.redirect || "/dashboard");
}
</script>

<template>
  <div class="min-h-screen bg-ink-950 text-ink-100 flex items-center justify-center px-4 relative overflow-hidden">
    <!-- ambient crate-grid backdrop -->
    <div class="pointer-events-none absolute inset-0 opacity-[0.07]"
      style="background-image: linear-gradient(var(--color-ink-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-400) 1px, transparent 1px); background-size: 42px 42px;">
    </div>
    <div class="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"></div>

    <div class="relative w-full max-w-sm">
      <div class="flex items-center gap-2.5 mb-8 justify-center">
        <div class="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
          <PackageSearch :size="20" class="text-amber-400" />
        </div>
        <span class="font-display text-3xl font-bold tracking-tight">INVEN<span class="text-amber-400">TRACK</span></span>
      </div>

      <div class="bg-ink-900 border border-ink-700 rounded-xl p-7 shadow-2xl">
        <p class="stencil-badge text-ink-400 text-[10px] mb-1">Akses Sistem</p>
        <h1 class="font-display text-2xl font-semibold mb-6">Masuk ke akun kamu</h1>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="nama@perusahaan.com"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-ink-400 mb-1.5">Kata sandi</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full rounded-lg bg-ink-800 border border-ink-600 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 focus:border-amber-500 focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div v-if="auth.error" class="flex items-center gap-2 text-rust-400 text-sm bg-rust-500/10 border border-rust-600/40 rounded-lg px-3 py-2.5">
            <TriangleAlert :size="15" class="shrink-0" />
            {{ auth.error }}
          </div>

          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-ink-950 font-semibold text-sm py-2.5 transition-colors"
          >
            <Loader2 v-if="auth.loading" :size="16" class="animate-spin" />
            {{ auth.loading ? "Memproses..." : "Masuk" }}
          </button>
        </form>
      </div>

      <div class="mt-5 bg-ink-900/60 border border-ink-800 rounded-lg px-4 py-3 text-xs text-ink-400 leading-relaxed">
        <span class="text-ink-300 font-medium">Akun demo</span> — admin@inventrack.dev / manager.jkt@inventrack.dev / staff.jkt@inventrack.dev, kata sandi <span class="font-mono text-ink-300">password123</span>
      </div>
    </div>
  </div>
</template>
