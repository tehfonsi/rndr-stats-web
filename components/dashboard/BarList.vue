<template>
  <ul class="space-y-2.5">
    <li
      v-for="item in sorted"
      :key="item.key"
      class="group grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]"
      :title="`${item.label}: ${item.display}`"
    >
      <span class="truncate text-[var(--rs-secondary)] group-hover:text-white">
        {{ item.label }}
      </span>
      <span class="h-3 rounded-r-[4px]">
        <span
          class="block h-full rounded-r-[4px] bg-[var(--rs-chart)] transition-[width,filter] duration-300 group-hover:brightness-125"
          :style="{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? '2px' : '0' }"
        />
      </span>
      <span class="tabular-nums text-right text-white">{{ item.display }}</span>
    </li>
    <li v-if="!items.length" class="text-sm text-[var(--rs-muted)]">No data</li>
  </ul>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: { key: string; label: string; value: number; display: string }[];
}>();

const sorted = computed(() => [...props.items].sort((a, b) => b.value - a.value));
const max = computed(() => Math.max(...props.items.map((i) => i.value), 0) || 1);
</script>
