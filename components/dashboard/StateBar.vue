<template>
  <div>
    <div class="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]">
      <div
        v-for="s in states"
        :key="s.state"
        class="h-full transition-[filter] hover:brightness-125"
        :style="{ flexGrow: s.count, backgroundColor: stateColor(s.state) }"
        :title="`${s.state}: ${s.count}`"
      />
    </div>
    <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <li v-for="s in states" :key="s.state" class="flex items-center gap-2">
        <span
          class="inline-block h-2.5 w-2.5 rounded-sm"
          :style="{ backgroundColor: stateColor(s.state) }"
        />
        <span class="text-[var(--rs-secondary)]">{{ s.state }}</span>
        <span class="font-semibold tabular-nums">{{ s.count }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { stateColor } from '../../src/state';

const props = defineProps<{ nodes: { state: string }[] }>();

const states = computed(() => {
  const counts = new Map<string, number>();
  props.nodes.forEach((n) => {
    const state = n.state || 'unknown';
    counts.set(state, (counts.get(state) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
});
</script>
