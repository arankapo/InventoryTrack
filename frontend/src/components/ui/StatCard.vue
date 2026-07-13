<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: [Object, Function], required: true },
  accent: { type: String, default: "amber" }, // amber | teal | rust | ink
  sub: { type: String, default: "" },
});

const accentClasses = {
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  teal: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  rust: "bg-rust-500/15 text-rust-400 border-rust-500/30",
  ink: "bg-ink-700/60 text-ink-300 border-ink-600",
};
</script>

<template>
  <div class="bg-ink-900 border border-ink-800 rounded-xl p-5 flex items-start justify-between">
    <div class="min-w-0">
      <p class="text-xs font-medium text-ink-400 mb-1.5">{{ label }}</p>
      <p class="font-display text-3xl font-bold text-ink-100 leading-none">{{ value }}</p>
      <p v-if="sub" class="text-xs text-ink-500 mt-1.5">{{ sub }}</p>
    </div>
    <div class="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0" :class="accentClasses[accent]">
      <component :is="icon" :size="18" />
    </div>
  </div>
</template>
