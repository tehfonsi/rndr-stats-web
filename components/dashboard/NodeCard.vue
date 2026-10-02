<template>
  <article
    class="flex flex-col rounded-xl border bg-[var(--rs-card)] p-4 transition-colors"
    :class="stale ? 'border-[#ffa500]/40' : 'border-[var(--rs-border)] hover:border-white/20'"
  >
    <!-- header -->
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <form v-if="edit" class="flex flex-wrap items-center gap-2" @submit.prevent="changeName">
          <input
            ref="input"
            v-model="draftName"
            class="min-w-0 flex-1 rounded-md border border-[var(--rs-border)] bg-[var(--rs-bg)] px-2 py-1 text-sm text-white outline-none focus:border-[var(--rs-chart)]"
            placeholder="Node name"
          />
          <button type="submit" class="text-sm primary">Change</button>
          <button type="button" class="text-sm text-[var(--rs-muted)]" @click="edit = false">
            Cancel
          </button>
        </form>
        <button
          v-else
          type="button"
          class="block max-w-full truncate text-left text-lg font-semibold hover:underline"
          title="Click to rename"
          @click="showInput"
        >
          {{ node.name || gpus[0] }}
        </button>
        <div class="mt-0.5 truncate text-xs text-[var(--rs-muted)]" :title="node.gpus">
          {{ gpuSummary }}
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <span
          class="rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums"
          :class="obWarning ? 'border-[#ffa500]/50 warning' : 'border-[var(--rs-border)] text-[var(--rs-secondary)]'"
          :title="`Tier ${node.score < 301 ? 3 : 2}`"
        >
          {{ node.score }} OB
        </span>
        <button
          type="button"
          class="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--rs-muted)] hover:bg-white/5 hover:text-white"
          :aria-expanded="!state.collapsed"
          :aria-controls="`node-${node.id}`"
          :title="state.collapsed ? 'Expand' : 'Collapse'"
          @click="toggleCollapsed"
        >
          <svg
            viewBox="0 0 16 16"
            class="h-3.5 w-3.5 transition-transform"
            :class="{ '-rotate-90': state.collapsed }"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- state -->
    <div class="mt-3 flex items-center gap-2 text-sm">
      <span class="relative flex h-2.5 w-2.5">
        <span
          v-if="/render/i.test(node.state)"
          class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          :style="{ backgroundColor: color }"
        />
        <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: color }" />
      </span>
      <span class="font-semibold capitalize">{{ node.state }}</span>
      <span class="text-[var(--rs-muted)]">since {{ fromNow(node.since) }}</span>
    </div>
    <div v-if="stale" class="mt-1 text-sm warning">
      Might be unresponsive, last update {{ fromNow(latest) }} ago
    </div>

    <div v-show="!state.collapsed" :id="`node-${node.id}`" class="flex flex-col">
    <!-- selected timeframe -->
    <div class="mt-4 grid grid-cols-3 gap-2 text-center">
      <div class="rounded-lg bg-white/[0.03] px-2 py-2">
        <div class="text-lg font-semibold">{{ jobs ? jobs.job_count : 0 }}</div>
        <div class="text-xs text-[var(--rs-muted)]">jobs</div>
      </div>
      <div class="rounded-lg bg-white/[0.03] px-2 py-2">
        <div class="text-lg font-semibold">
          {{ jobs ? (jobs.utilization * 100).toFixed(1) : '0.0' }}<span class="text-xs">%</span>
        </div>
        <div class="text-xs text-[var(--rs-muted)]">utilization</div>
      </div>
      <div class="rounded-lg bg-white/[0.03] px-2 py-2">
        <div class="text-lg font-semibold">{{ jobs ? (jobs.utilization * rangeHours).toFixed(1) : '0.0' }}</div>
        <div class="text-xs text-[var(--rs-muted)]">hours</div>
      </div>
    </div>

    <div v-if="history.length > 1" class="mt-4">
      <div class="mb-1 text-xs text-[var(--rs-muted)]">Utilization, {{ rangeLabel }}</div>
      <DashboardSparkline :points="history" :max="historyMax" />
    </div>

    <!-- totals -->
    <button
      type="button"
      class="mt-4 flex items-center gap-1 self-start text-xs text-[var(--rs-muted)] hover:text-white"
      :aria-expanded="state.expanded"
      @click="toggle"
    >
      <span class="inline-block transition-transform" :class="{ 'rotate-90': state.expanded }">▸</span>
      All-time totals
    </button>
    <dl v-if="state.expanded" class="mt-2 grid grid-cols-3 gap-2 text-sm">
      <div>
        <dt class="text-xs text-[var(--rs-muted)]">Jobs</dt>
        <dd class="tabular-nums">{{ node.jobs_completed.toLocaleString() }}</dd>
      </div>
      <div>
        <dt class="text-xs text-[var(--rs-muted)]">Previews</dt>
        <dd class="tabular-nums">{{ node.previews_sent.toLocaleString() }}</dd>
      </div>
      <div>
        <dt class="text-xs text-[var(--rs-muted)]">Thumbnails</dt>
        <dd class="tabular-nums">{{ node.thumbnails_sent.toLocaleString() }}</dd>
      </div>
    </dl>
    </div>
  </article>
</template>

<script setup lang="ts">
import { fromNow } from '../../src/utils';
import { stateColor } from '../../src/state';
import type { NodeType } from '../../src/types';

const props = withDefaults(
  defineProps<{
    node: NodeType;
    history?: number[];
    historyMax?: number;
    rangeLabel?: string;
    rangeHours?: number;
  }>(),
  { history: () => [], historyMax: 0, rangeLabel: '', rangeHours: 24 }
);

// saved per node in localStorage: `expanded` = all-time totals, `collapsed` = whole card body
const state = reactive({ expanded: true, collapsed: false });
const edit = ref(false);
const draftName = ref('');
const input = ref<HTMLInputElement | null>(null);

onMounted(() => {
  const savedState = window.localStorage.getItem(props.node.id);
  if (savedState) {
    Object.assign(state, JSON.parse(savedState));
  }
});

const jobs = computed(() => props.node.jobs);
const color = computed(() => stateColor(props.node.state));
const gpus = computed(() => (props.node.gpus || '').split(',').map((g) => g.trim()).filter(Boolean));
const gpuSummary = computed(() => {
  const counts = new Map<string, number>();
  gpus.value.forEach((g) => counts.set(g, (counts.get(g) || 0) + 1));
  return [...counts.entries()].map(([g, c]) => (c > 1 ? `${c}× ${g}` : g)).join(', ');
});
const obWarning = computed(() => props.node.score > 300 && props.node.score < 400);

const latest = computed(() => {
  const { updated, since } = props.node;
  if (updated && new Date(updated) > new Date(since)) {
    return updated;
  }
  return since;
});

const stale = computed(() => {
  if (!props.node.updated) return false;
  const hour = 1000 * 60 * 60;
  return new Date(props.node.updated).getTime() < Date.now() - hour;
});

function saveState() {
  try {
    window.localStorage.setItem(props.node.id, JSON.stringify(state));
  } catch {}
}

function toggle() {
  state.expanded = !state.expanded;
  saveState();
}

function toggleCollapsed() {
  state.collapsed = !state.collapsed;
  saveState();
}

function showInput() {
  draftName.value = props.node.name || '';
  edit.value = true;
  nextTick(() => input.value?.focus());
}

async function changeName() {
  const password = prompt('Enter your password', '');
  const name = draftName.value;
  edit.value = false;
  try {
    await $fetch('/api/node-name', {
      method: 'POST',
      body: { node_id: props.node.id, name, password },
    });

    props.node.name = name;
  } catch (error: any) {
    alert(
      `Error: ${error?.response?.status || ''} ${error?.response?.statusText || ''}\nWrong password! Make sure you set the same password in the .ini file of all nodes.`
    );
  }
}
</script>
