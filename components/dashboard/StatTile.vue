<template>
  <div
    class="flex flex-col justify-between rounded-xl border border-[var(--rs-border)] bg-[var(--rs-card)] p-4 sm:p-5"
  >
    <div class="text-sm text-[var(--rs-muted)]">{{ label }}</div>
    <div
      class="mt-2 font-semibold leading-none"
      :class="hero ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'"
    >
      {{ value }}<span
        v-if="unit"
        class="ml-1 text-base font-normal text-[var(--rs-secondary)]"
        >{{ unit }}</span
      >
    </div>
    <div v-if="$slots.default || sub" class="mt-3 text-sm text-[var(--rs-secondary)]">
      <slot>{{ sub }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  hero?: boolean;
}>();
</script>
