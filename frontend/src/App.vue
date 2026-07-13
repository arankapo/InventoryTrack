<script setup>
import { storeToRefs } from "pinia";
import { useToastStore } from "@/stores/toast";
import { CheckCircle2, XCircle, X } from "@lucide/vue";

const toastStore = useToastStore();
const { items } = storeToRefs(toastStore);
</script>

<template>
  <router-view />

  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
    <transition-group name="toast">
      <div
        v-for="t in items"
        :key="t.id"
        class="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-lg backdrop-blur"
        :class="t.type === 'success'
          ? 'bg-ink-900/95 border-teal-600 text-ink-100'
          : 'bg-ink-900/95 border-rust-600 text-ink-100'"
      >
        <CheckCircle2 v-if="t.type === 'success'" :size="18" class="text-teal-400 shrink-0 mt-0.5" />
        <XCircle v-else :size="18" class="text-rust-400 shrink-0 mt-0.5" />
        <p class="text-sm leading-snug flex-1">{{ t.message }}</p>
        <button @click="toastStore.dismiss(t.id)" class="text-ink-400 hover:text-ink-100 shrink-0">
          <X :size="15" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateY(8px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
