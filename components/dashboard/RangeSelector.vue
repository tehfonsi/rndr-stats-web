<template>
  <div
    class="inline-flex rounded-lg border border-[var(--rs-border)] bg-[var(--rs-card)] p-1"
    role="radiogroup"
    aria-label="Time range"
  >
    <button
      v-for="option in options"
      :key="option.days"
      type="button"
      role="radio"
      :aria-checked="modelValue === option.days"
      class="rounded-md px-3 py-1.5 text-sm transition-colors"
      :class="
        modelValue === option.days
          ? 'highlight font-semibold text-white'
          : 'text-[var(--rs-secondary)] hover:bg-white/5 hover:text-white'
      "
      @click="emit('update:modelValue', option.days)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number }>();
const emit = defineEmits<{ 'update:modelValue': [days: number] }>();

const options = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
  { days: 28, label: '28 days' },
];
</script>
