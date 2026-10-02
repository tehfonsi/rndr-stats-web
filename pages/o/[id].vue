<template>
  <div class="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
    <header class="py-6">
      <h1 class="text-3xl font-bold sm:text-4xl">RNDR Dashboard</h1>
    </header>

    <div v-if="!route.params.id">
      Add your operator id at the end of the current url to see your dashboard.
    </div>

    <template v-else>
      <!-- donation -->
      <DashboardCard class="mb-6">
        Please consider donating to support running the servers and keep the
        dashboard available.<br />You can donate RENDER to this Solana wallet:
        <a
          class="animated-gradient-text break-all hover:cursor"
          href="https://solscan.io/account/B5zXiU35tGvcJv5EZZ6fDn7cVHc8pDHqP2waanBU1Pj1"
          target="_blank"
          >B5zXiU35tGvcJv5EZZ6fDn7cVHc8pDHqP2waanBU1Pj1</a
        >
      </DashboardCard>

      <!-- sections in the order the viewer dragged them into -->
      <TransitionGroup tag="div" move-class="transition-transform duration-200" class="flex flex-col gap-6">
        <div v-for="section in sectionOrder" :key="section">
          <!-- income loads on its own, independent of the node requests -->
          <client-only v-if="section === 'income'">
            <DashboardPayouts :operator-id="id" />
          </client-only>

          <template v-else-if="section === 'activity'">
            <div v-if="loading" class="py-10 text-[var(--rs-muted)]">Loading...</div>
            <div v-else-if="!nodes.length" class="py-10 text-[var(--rs-secondary)]">
              No nodes reported in the last 7 days for this operator id.
            </div>
            <div v-else class="transition-opacity" :class="{ 'opacity-60': refreshing }">
              <DashboardSection title="Node activity" sort-key="activity">
                <template #actions>
                  <DashboardRangeSelector
                    :model-value="selectedDays"
                    @update:model-value="selectDays"
                  />
                </template>
                <div class="space-y-6">
                  <!-- KPIs -->
                  <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <DashboardStatTile
                      label="Utilization"
                      :value="(overview.utilization * 100).toFixed(2)"
                      unit="%"
                    >
                      <template v-if="overview.tier3_utilization && overview.tier2_utilization">
                        T3 {{ (overview.tier3_utilization * 100).toFixed(2) }}% ·
                        T2 {{ (overview.tier2_utilization * 100).toFixed(2) }}%
                      </template>
                      <template v-else>average across active nodes</template>
                    </DashboardStatTile>
                    <DashboardStatTile label="Jobs" :value="jobCount.toLocaleString()">
                      last {{ rangeLabel }}
                    </DashboardStatTile>
                    <DashboardStatTile label="Hours rendered" :value="renderHours.toFixed(1)">
                      all nodes, last {{ rangeLabel }}
                    </DashboardStatTile>
                    <DashboardStatTile label="Nodes" :value="nodes.length.toString()">
                      <span v-if="staleCount" class="warning">
                        {{ staleCount }} might be unresponsive
                      </span>
                      <template v-else>all reporting</template>
                    </DashboardStatTile>
                  </div>

                  <!-- charts -->
                  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <DashboardCard
                      title="Utilization"
                      :subtitle="`Share of time spent rendering, per ${bucketLabel}`"
                    >
                      <client-only>
                        <DashboardTimeChart
                          :points="utilizationSeries"
                          :bucket="history?.bucket || 3600"
                          :min-max="0.1"
                          :format="formatPercent"
                          aria-label="Utilization over time"
                        />
                      </client-only>
                    </DashboardCard>
                    <DashboardCard title="Jobs" :subtitle="`Jobs finished per ${bucketLabel}`">
                      <client-only>
                        <DashboardTimeChart
                          kind="bar"
                          :points="jobSeries"
                          :bucket="history?.bucket || 3600"
                          :format="formatJobs"
                          aria-label="Jobs over time"
                        />
                      </client-only>
                    </DashboardCard>
                  </div>

                  <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <DashboardCard
                      title="Utilization by node"
                      :subtitle="`Last ${rangeLabel}`"
                      class="lg:col-span-2"
                    >
                      <DashboardBarList :items="utilizationByNode" />
                    </DashboardCard>
                    <DashboardCard title="Node states" subtitle="Current state of every node">
                      <DashboardStateBar :nodes="nodes" />
                    </DashboardCard>
                  </div>
                </div>
              </DashboardSection>
            </div>
          </template>

          <div
            v-else-if="section === 'nodes' && !loading && nodes.length"
            class="transition-opacity"
            :class="{ 'opacity-60': refreshing }"
          >
              <DashboardSection title="Nodes" sort-key="nodes">
                <div class="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <client-only v-for="node in nodes" :key="node.id">
                    <DashboardNodeCard
                      :node="node"
                      :history="nodeHistory[node.id] || []"
                      :history-max="nodeHistoryMax"
                      :range-label="rangeLabel"
                      :range-hours="selectedDays * 24"
                    />
                  </client-only>
                </div>
              </DashboardSection>
          </div>
        </div>
      </TransitionGroup>
    </template>

    <div class="mt-8 text-[var(--rs-secondary)]">
      Questions? You might find answers in the <a href="/faq">FAQ</a>.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartPoint, JobHistory, NodeJobs, NodeType } from '../../src/types';

const route = useRoute();
const id = computed(() => route.params.id as string);
const selectedDays = ref<number>(1);
const nodeOverview = ref<NodeType[]>([]);
const jobOverview = ref<Record<number, NodeJobs[]>>({});
const jobHistory = ref<Record<number, JobHistory>>({});
const loading = ref(true);
const { order: sectionOrder } = useSectionOrder(['income', 'nodes', 'activity']);
const refreshing = ref(false);

function nodeSort(n1: NodeType, n2: NodeType): number {
  if (n1.name === n2.name) {
    return 0;
  } else if (!n1.name) {
    return 1;
  } else if (!n2.name) {
    return -1;
  }
  return n1.name.localeCompare(n2.name);
}

const nodes = computed<NodeType[]>(() => {
  if (!nodeOverview.value) return [];
  // hide nodes which did not update for 7 days
  const day = 1000 * 60 * 60 * 24;
  return nodeOverview.value.filter((n: NodeType) => {
    return Date.now() - new Date(n.since).getTime() < day * 7;
  });
});

const overview = computed(() => {
  const overview = {
    tier3_utilization: 0,
    tier2_utilization: 0,
    utilization: 0,
  };
  let tier3_count = 0;
  let tier2_count = 0;
  nodes.value.forEach((node: NodeType) => {
    if (!node.jobs?.utilization || !node.score) return;
    if (node.score < 301) {
      overview.tier3_utilization += node.jobs.utilization;
      tier3_count++;
    } else {
      overview.tier2_utilization += node.jobs.utilization;
      tier2_count++;
    }
  });
  overview.utilization =
    (overview.tier3_utilization + overview.tier2_utilization) /
    (tier3_count + tier2_count || 1);
  overview.tier3_utilization /= tier3_count || 1;
  overview.tier2_utilization /= tier2_count || 1;
  return overview;
});

const jobCount = computed(() =>
  nodes.value.reduce((sum, n) => sum + (n.jobs?.job_count || 0), 0)
);

const staleCount = computed(() => {
  const hourAgo = Date.now() - 1000 * 60 * 60;
  return nodes.value.filter((n) => n.updated && new Date(n.updated).getTime() < hourAgo).length;
});

const rangeLabel = computed(
  () => ({ 1: '24 hours', 7: '7 days', 28: '28 days' })[selectedDays.value] || `${selectedDays.value} days`
);

const nodeName = (n: NodeType) => n.name || (n.gpus || '').split(',')[0] || n.id;

const renderHours = computed(() =>
  nodes.value.reduce((sum, n) => sum + (n.jobs?.utilization || 0) * selectedDays.value * 24, 0)
);

const utilizationByNode = computed(() =>
  nodes.value.map((n) => ({
    key: n.id,
    label: nodeName(n),
    value: n.jobs?.utilization || 0,
    display: `${((n.jobs?.utilization || 0) * 100).toFixed(1)}%`,
  }))
);

// ---- time series ----

const history = computed<JobHistory | undefined>(() => jobHistory.value[selectedDays.value]);

const bucketLabel = computed(() => {
  const b = history.value?.bucket || 3600;
  if (b === 3600) return 'hour';
  if (b === 86400) return 'day';
  return `${b / 3600} hours`;
});

// all bucket starts in the range, so empty buckets render as 0
const buckets = computed<number[]>(() => {
  const h = history.value;
  if (!h) return [];
  const result: number[] = [];
  for (let t = Math.floor(h.start / h.bucket) * h.bucket; t < h.end; t += h.bucket) {
    result.push(t);
  }
  return result;
});

// seconds of a bucket that lie inside the selected range (first/last bucket are partial)
function coveredSeconds(t: number): number {
  const h = history.value!;
  return Math.max(1, Math.min(t + h.bucket, h.end) - Math.max(t, h.start));
}

const busyByNode = computed(() => {
  const map: Record<string, Record<number, number>> = {};
  history.value?.rows.forEach((r) => {
    (map[r.node] ||= {})[r.bucket] = r.busy;
  });
  return map;
});

const nodeHistory = computed(() => {
  const result: Record<string, number[]> = {};
  nodes.value.forEach((n) => {
    const busy = busyByNode.value[n.id] || {};
    result[n.id] = buckets.value.map((t) => Math.min(1, (busy[t] || 0) / coveredSeconds(t)));
  });
  return result;
});

// shared scale so node sparklines are comparable
const nodeHistoryMax = computed(() =>
  Math.max(0.05, ...Object.values(nodeHistory.value).flat())
);

const utilizationSeries = computed<ChartPoint[]>(() => {
  const count = nodes.value.length || 1;
  return buckets.value.map((t, i) => ({
    t,
    value: nodes.value.reduce((sum, n) => sum + (nodeHistory.value[n.id]?.[i] || 0), 0) / count,
  }));
});

const jobSeries = computed<ChartPoint[]>(() => {
  const ids = new Set(nodes.value.map((n) => n.id));
  return buckets.value.map((t) => ({
    t,
    value: (history.value?.rows || [])
      .filter((r) => r.bucket === t && ids.has(r.node))
      .reduce((sum, r) => sum + r.job_count, 0),
  }));
});

const formatPercent = (v: number, short?: boolean) =>
  `${(v * 100).toFixed(short ? 0 : 2)}%`;
const formatJobs = (v: number, short?: boolean) =>
  short ? v.toLocaleString() : `${v.toLocaleString()} ${v === 1 ? 'job' : 'jobs'}`;

// ---- data loading ----

async function fetchNodeOverview(): Promise<void> {
  if (!id.value) return;
  const data = await $fetch<NodeType[]>(`/api/node-overview?id=${id.value}`);

  if (data) {
    nodeOverview.value = [...data].sort(nodeSort);
  } else {
    nodeOverview.value = [];
  }
}

function rangeStart(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Math.floor(d.getTime() / 1000);
}

async function fetchJobOverview(days: number): Promise<void> {
  if (!id.value) return;
  const start = rangeStart(days);
  // charts fill in when the history arrives, it should not hold back the rest of the page
  if (!jobHistory.value[days]) {
    $fetch<JobHistory>(`/api/job-history?id=${id.value}&start=${start}`)
      .then((data) => {
        jobHistory.value[days] = data;
      })
      .catch((error) => console.error(error));
  }
  if (!jobOverview.value[days]) {
    const data = await $fetch<NodeJobs[]>(`/api/job-overview?id=${id.value}&start=${start}`);
    jobOverview.value[days] = data || [];
  }
}

function addJobsToNodes(days: number): void {
  const nodesArr = nodeOverview.value;
  if (jobOverview.value[days]) {
    nodesArr.forEach((node: NodeType) => {
      node.jobs = jobOverview.value[days].find((job: NodeJobs) => job.id === node.id);
    });
  }
  nodeOverview.value = JSON.parse(JSON.stringify(nodesArr));
  selectedDays.value = days;
}

// nodes and job stats load in parallel, then get merged
async function refresh(days: number): Promise<void> {
  await Promise.all([fetchNodeOverview(), fetchJobOverview(days)]);
  addJobsToNodes(days);
  saveSnapshot();
}

// ---- last loaded nodes, shown instantly on the next visit while fresh data loads ----

const snapshotKey = computed(() => `nodes:${id.value}`);

function saveSnapshot(): void {
  try {
    window.localStorage.setItem(
      snapshotKey.value,
      JSON.stringify({ days: selectedDays.value, nodes: nodeOverview.value })
    );
  } catch {}
}

function restoreSnapshot(days: number): boolean {
  try {
    const snapshot = JSON.parse(window.localStorage.getItem(snapshotKey.value) || 'null');
    if (!snapshot?.nodes?.length) return false;
    // job stats of another range would show the wrong numbers, keep only the node part then
    nodeOverview.value = snapshot.days === days
      ? snapshot.nodes
      : snapshot.nodes.map((n: NodeType) => ({ ...n, jobs: undefined }));
    return true;
  } catch {
    return false;
  }
}

async function selectDays(days: number): Promise<void> {
  refreshing.value = true;
  try {
    await fetchJobOverview(days);
    addJobsToNodes(days);
    window.localStorage.setItem('days', days.toString());
    saveSnapshot();
  } finally {
    refreshing.value = false;
  }
}

onMounted(async () => {
  const days = window.localStorage.getItem('days');
  if (days) {
    selectedDays.value = parseInt(days);
  }
  if (restoreSnapshot(selectedDays.value)) {
    loading.value = false;
    refreshing.value = true;
  }
  try {
    await refresh(selectedDays.value);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }

  document.addEventListener('visibilitychange', onVisibilityChanged);
});

// update job stats when tab/page becomes visible again
async function onVisibilityChanged(): Promise<void> {
  if (document.visibilityState !== 'visible') return;
  refreshing.value = true;
  try {
    jobOverview.value = {};
    jobHistory.value = {};
    await refresh(selectedDays.value);
  } finally {
    refreshing.value = false;
  }
}

onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChanged));
</script>

<style>
/* Custom CSS for the animated gradient text */
.animated-gradient-text {
  background-image: linear-gradient(
    to right,
    #ef4444,
    #f97316,
    #eab308,
    #22c55e,
    #3b82f6,
    #8b5cf6,
    #ec4899
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-decoration: none;
  animation: gradientMove 5s linear infinite;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
