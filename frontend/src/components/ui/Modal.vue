<script setup>
import { X } from "@lucide/vue";

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "" },
  size: { type: String, default: "md" }, // sm | md | lg
});
const emit = defineEmits(["close"]);

const sizeClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };
</script>

<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center px-4 bg-ink-950/70 backdrop-blur-sm" @click.self="emit('close')">
        <transition name="pop" appear>
          <div
            v-if="open"
            class="w-full bg-ink-900 border border-ink-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col"
            :class="sizeClass[size]"
          >
            <div class="flex items-center justify-between px-5 py-4 border-b border-ink-800 shrink-0">
              <h2 class="font-display text-xl font-semibold">{{ title }}</h2>
              <button @click="emit('close')" class="text-ink-500 hover:text-ink-100 transition-colors">
                <X :size="18" />
              </button>
            </div>
            <div class="px-5 py-4 overflow-y-auto">
              <slot />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-enter-from { opacity: 0; transform: scale(0.96) translateY(8px); }
</style>
