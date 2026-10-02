<template>
  <div ref="root" class="relative w-full select-none">
    <svg
      v-if="width > 0"
      :width="width"
      :height="height"
      class="block outline-none"
      tabindex="0"
      role="img"
      :aria-label="ariaLabel"
      @pointermove="onPointer"
      @pointerleave="active = -1"
      @keydown="onKey"
      @blur="active = -1"
    >
      <!-- grid + y ticks -->
      <g>
        <template v-for="tick in yTicks" :key="tick">
          <line
            :x1="pad.left"
            :x2="width - pad.right"
            :y1="y(tick)"
            :y2="y(tick)"
            :stroke="tick === 0 ? 'var(--rs-axis)' : 'var(--rs-grid)'"
            stroke-width="1"
            shape-rendering="crispEdges"
          />
          <text
            :x="pad.left - 8"
            :y="y(tick)"
            text-anchor="end"
            dominant-baseline="middle"
            class="tabular-nums"
            fill="var(--rs-muted)"
            font-size="11"
          >
            {{ format(tick, true) }}
          </text>
        </template>
      </g>

      <!-- x labels -->
      <g>
        <text
          v-for="i in xLabelIndexes"
          :key="i"
          :x="cx(i)"
          :y="height - 6"
          text-anchor="middle"
          fill="var(--rs-muted)"
          font-size="11"
        >
          {{ timeLabel(points[i].t) }}
        </text>
      </g>

      <!-- bars -->
      <g v-if="kind === 'bar'">
        <g
          v-for="(p, i) in points"
          :key="p.t"
          :opacity="active === -1 || active === i ? 1 : 0.45"
        >
          <path
            v-for="seg in segments(i)"
            :key="seg.color"
            :d="seg.d"
            :fill="seg.color"
          />
        </g>
      </g>

      <!-- area + line -->
      <g v-else>
        <path :d="areaPath" fill="var(--rs-chart)" opacity="0.1" />
        <path
          :d="linePath"
          fill="none"
          stroke="var(--rs-chart)"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <line
          v-if="active !== -1"
          :x1="cx(active)"
          :x2="cx(active)"
          :y1="pad.top"
          :y2="height - pad.bottom"
          stroke="var(--rs-secondary)"
          stroke-width="1"
          shape-rendering="crispEdges"
        />
        <circle
          v-if="points.length"
          :cx="cx(dotIndex)"
          :cy="y(points[dotIndex].value)"
          r="4"
          fill="var(--rs-chart)"
          stroke="var(--rs-card)"
          stroke-width="2"
        />
      </g>
    </svg>

    <!-- tooltip -->
    <div
      v-if="active !== -1 && points[active]"
      class="pointer-events-none absolute top-0 z-10 rounded-lg border border-[var(--rs-border)] bg-[#232528] px-3 py-2 text-sm shadow-lg"
      :style="tooltipStyle"
    >
      <div class="font-semibold text-white">
        {{ format(points[active].value) }}
      </div>
      <div class="text-xs text-[var(--rs-secondary)]">
        {{ rangeLabel(points[active].t) }}
      </div>
      <ul v-if="series" class="mt-1.5 space-y-0.5 text-xs">
        <li v-for="(s, k) in series" :key="s.label" class="flex items-center gap-2 whitespace-nowrap">
          <span class="inline-block h-0.5 w-3 rounded" :style="{ backgroundColor: s.color }" />
          <span class="font-semibold text-white">{{ format(points[active].values?.[k] || 0) }}</span>
          <span class="text-[var(--rs-secondary)]">{{ s.label }}</span>
        </li>
      </ul>
    </div>

    <!-- table view for screen readers -->
    <div class="sr-only">
      <table>
        <caption>{{ ariaLabel }}</caption>
        <tr v-for="p in points" :key="p.t">
          <th scope="row">{{ rangeLabel(p.t) }}</th>
          <td>{{ format(p.value) }}</td>
          <td v-for="(s, k) in series" :key="s.label">{{ s.label }}: {{ format(p.values?.[k] || 0) }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartPoint } from '../../src/types';

const props = withDefaults(
  defineProps<{
    points: ChartPoint[];
    bucket: number; // seconds per point
    kind?: 'area' | 'bar';
    // stacked bars: one entry per value in ChartPoint.values, bottom to top
    series?: { label: string; color: string }[];
    height?: number;
    minMax?: number; // y axis shows at least up to this value
    format?: (value: number, short?: boolean) => string;
    ariaLabel?: string;
  }>(),
  {
    kind: 'area',
    height: 220,
    minMax: 0,
    format: (v: number) => v.toFixed(2),
    ariaLabel: 'Chart',
  }
);

const pad = { top: 12, right: 12, bottom: 26, left: 52 };
const root = ref<HTMLElement | null>(null);
const width = ref(0);
const active = ref(-1);

let observer: ResizeObserver | undefined;
onMounted(() => {
  if (!root.value) return;
  width.value = root.value.clientWidth;
  observer = new ResizeObserver(([entry]) => {
    width.value = entry.contentRect.width;
  });
  observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());

const plotW = computed(() => Math.max(0, width.value - pad.left - pad.right));
const plotH = computed(() => props.height - pad.top - pad.bottom);
const band = computed(() => plotW.value / Math.max(1, props.points.length));

function niceStep(raw: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

const yScale = computed(() => {
  const max = Math.max(props.minMax, ...props.points.map((p) => p.value));
  if (max <= 0) return { max: 1, step: 0.25 };
  const step = niceStep(max / 4);
  return { max: Math.ceil(max / step) * step, step };
});

const yTicks = computed(() => {
  const ticks: number[] = [];
  for (let v = 0; v <= yScale.value.max + 1e-9; v += yScale.value.step) {
    ticks.push(Number(v.toPrecision(10)));
  }
  return ticks;
});

const y = (v: number) => pad.top + plotH.value - (v / yScale.value.max) * plotH.value;
const cx = (i: number) => pad.left + band.value * (i + 0.5);

const xLabelIndexes = computed(() => {
  const n = props.points.length;
  if (!n) return [];
  const maxLabels = Math.max(2, Math.floor(plotW.value / 70));
  const every = Math.ceil(n / maxLabels);
  const idx: number[] = [];
  for (let i = 0; i < n; i += every) idx.push(i);
  return idx;
});

const linePath = computed(() =>
  props.points.map((p, i) => `${i ? 'L' : 'M'}${cx(i)},${y(p.value)}`).join('')
);
const areaPath = computed(() => {
  if (!props.points.length) return '';
  const base = y(0);
  const last = props.points.length - 1;
  return `${linePath.value}L${cx(last)},${base}L${cx(0)},${base}Z`;
});
const dotIndex = computed(() =>
  active.value === -1 ? props.points.length - 1 : active.value
);

// a bar from `from` up to `to` (data values); only the topmost segment gets rounded corners
function barPath(i: number, to: number, from = 0, rounded = true): string {
  const bottom = y(from);
  const top = y(to);
  const h = bottom - top;
  if (h <= 0) return '';
  const w = Math.min(24, Math.max(2, band.value - 2));
  const x = cx(i) - w / 2;
  if (!rounded) return `M${x},${bottom}V${top}H${x + w}V${bottom}Z`;
  const r = Math.min(4, w / 2, h);
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${bottom}Z`;
}

const GAP = 2; // px of surface between stacked segments

function segments(i: number): { d: string; color: string }[] {
  const p = props.points[i];
  if (!props.series || !p.values) {
    return [{ d: barPath(i, p.value), color: 'var(--rs-chart)' }];
  }
  const gapValue = (GAP / plotH.value) * yScale.value.max;
  const last = p.values.reduce((l, v, k) => (v > 0 ? k : l), -1);
  let base = 0;
  return p.values.map((v, k) => {
    const from = base;
    base += v;
    // leave a surface gap below every segment except the first one drawn
    const start = from > 0 ? from + gapValue : from;
    return {
      d: v > 0 && base > start ? barPath(i, base, start, k === last) : '',
      color: props.series![k].color,
    };
  });
}

function onPointer(e: PointerEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
  const x = e.clientX - rect.left - pad.left;
  const i = Math.floor(x / band.value);
  active.value = i >= 0 && i < props.points.length ? i : -1;
}

function onKey(e: KeyboardEvent) {
  const n = props.points.length;
  if (!n) return;
  if (e.key === 'ArrowRight') {
    active.value = active.value === -1 ? 0 : Math.min(n - 1, active.value + 1);
  } else if (e.key === 'ArrowLeft') {
    active.value = active.value === -1 ? n - 1 : Math.max(0, active.value - 1);
  } else {
    return;
  }
  e.preventDefault();
}

const tooltipStyle = computed(() => {
  const x = cx(active.value);
  const flip = x > width.value * 0.6;
  return flip
    ? { right: `${width.value - x + 10}px` }
    : { left: `${x + 10}px` };
});

const hourly = computed(() => props.bucket < 24 * 60 * 60);

function timeLabel(t: number): string {
  const d = new Date(t * 1000);
  if (props.bucket <= 60 * 60) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function rangeLabel(t: number): string {
  const from = new Date(t * 1000);
  const to = new Date((t + props.bucket) * 1000);
  if (props.bucket > 24 * 60 * 60) {
    const day = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${day(from)} – ${day(new Date(to.getTime() - 1000))}`;
  }
  if (!hourly.value) {
    return from.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  const date = from.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time(from)} – ${time(to)}`;
}
</script>
