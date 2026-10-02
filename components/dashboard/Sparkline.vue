<template>
  <svg
    :viewBox="`0 0 ${points.length - 1 || 1} 100`"
    preserveAspectRatio="none"
    class="block h-10 w-full overflow-visible"
    aria-hidden="true"
  >
    <path :d="area" fill="var(--rs-chart)" opacity="0.1" />
    <path
      :d="line"
      fill="none"
      stroke="var(--rs-chart)"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ points: number[]; max?: number }>(), {
  max: 0,
});

const top = computed(() => Math.max(props.max, ...props.points) || 1);
const y = (v: number) => 100 - (v / top.value) * 96;
const line = computed(() =>
  props.points.map((v, i) => `${i ? 'L' : 'M'}${i},${y(v)}`).join('')
);
const area = computed(() =>
  props.points.length
    ? `${line.value}L${props.points.length - 1},100L0,100Z`
    : ''
);
</script>
