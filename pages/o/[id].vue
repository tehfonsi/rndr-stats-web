<template>
  <div>
    <h1 class="m-5 text-4xl font-bold">RNDR Dashboard <sup>beta</sup></h1>
    <div class="m-5" v-if="!route.params.id">
      Add your operator id at the end of the current url to see your dashboard.
    </div>
    <ul v-else class="m-8 list-disc">
      <div v-if="nodes.length">
        <div class="my-5 mr-5">
          Please consider donating to support running the servers and keep the
          dashboard available.<br />You can donate RENDER to this Solana wallet:
          <a
            class="animated-gradient-text hover:cursor"
            href="https://solscan.io/account/B5zXiU35tGvcJv5EZZ6fDn7cVHc8pDHqP2waanBU1Pj1"
            target="_blank"
            >B5zXiU35tGvcJv5EZZ6fDn7cVHc8pDHqP2waanBU1Pj1</a
          >
        </div>
        <div>
          Last
          <span
            :class="{ 'font-bold': selectedDays === 1 }"
            class="24hours cursor-pointer primary"
            @click="selectDays(1)"
            >24 hours</span
          >
          /
          <span
            :class="{ 'font-bold': selectedDays === 7 }"
            class="7days cursor-pointer primary"
            @click="selectDays(7)"
            >7 days</span
          >
          /
          <span
            :class="{ 'font-bold': selectedDays === 28 }"
            class="28days cursor-pointer primary"
            @click="selectDays(28)"
            >28 days</span
          >:
        </div>
        <div>
          {{ overview.income.toFixed(2) }} RNDR /
          {{ overview.utilization ? (overview.utilization * 100).toFixed(2) : 0 }}%
          {{
            overview.tier3_utilization && overview.tier2_utilization
              ? `(T3: ${(overview.tier3_utilization * 100).toFixed(2)}%, T2: ${(overview.tier2_utilization * 100).toFixed(2)}%)`
              : ''
          }}
        </div>
      </div>
      <li v-for="node in nodes" :key="node.id" class="my-2">
        <client-only placeholder="Loading...">
          <Node :node="node" />
        </client-only>
      </li>
    </ul>
    <div class="m-5">
      Questions? You might find answers in the <a href="/faq">FAQ</a>.
    </div>
  </div>
</template>

<script setup lang="ts">

interface NodeJobs {
  id: string;
  job_count: number;
  utilization: number;
  income: number;
}

interface NodeType {
  id: string;
  name?: string;
  gpus: string;
  score: number;
  state: string;
  since: string | number | Date;
  updated?: string | number | Date;
  jobs_completed: number;
  previews_sent: number;
  thumbnails_sent: number;
  jobs?: NodeJobs;
}

const route = useRoute();
const id = computed(() => route.params.id as string);
const selectedDays = ref<number>(1);
const nodeOverview = ref<NodeType[]>([]);
const jobOverview = ref<Record<number, NodeJobs[]>>({});

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
    income: 0,
    tier3_utilization: 0,
    tier2_utilization: 0,
    utilization: 0,
  };
  let tier3_count = 0;
  let tier2_count = 0;
  nodes.value.forEach((node: NodeType) => {
    if (!node.jobs?.income) return;
    overview.income += node.jobs.income || 0;
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

async function fetchNodeOverview(): Promise<void> {
  if (!id.value) return;
  const data = await $fetch<NodeType[]>(`/api/node-overview?id=${id.value}`);

  if (data) {
    nodeOverview.value = [...data].sort(nodeSort);
  } else {
    nodeOverview.value = [];
  }
}

async function fetchJobOverview(days: number): Promise<void> {
  if (!id.value) return;
  if (!jobOverview.value[days]) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const start = Math.floor(d.getTime() / 1000);
    const data = await $fetch<NodeJobs[]>(`/api/job-overview?id=${id.value}&start=${start}`);
    if (data) {
      jobOverview.value[days] = data;
    } else {
      jobOverview.value[days] = [];
    }
  }
  window.localStorage.setItem('days', days.toString());
  addJobsToNodes(days);
}

function addJobsToNodes(days: number): void {
  const nodesArr = nodeOverview.value;
  if (jobOverview.value[days]) {
    nodesArr.forEach((node: NodeType) => {
      const job = jobOverview.value[days].find((job: NodeJobs) => job.id === node.id);
      if (job) {
        job.income = (days * 24 * job.utilization * node.score) / (node.score < 301 ? 200 : 100);
      }
      node.jobs = job;
    });
  }
  nodeOverview.value = JSON.parse(JSON.stringify(nodesArr));
  selectedDays.value = days;
}

function selectDays(days: number): void {
  fetchJobOverview(days);
}

onMounted(() => {
  const days = window.localStorage.getItem('days');
  if (days) {
    selectedDays.value = parseInt(days);
  }
  fetchNodeOverview().then(() => fetchJobOverview(selectedDays.value));

  // update job stats when tab/page becomes visible again
  const onVisibilityChanged = async () => {
    if (document.visibilityState === 'visible') {
      await fetchNodeOverview();
      jobOverview.value = {};
      await fetchJobOverview(selectedDays.value);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChanged);
});
</script>

<style>
/* Custom CSS for the animated gradient text */
.animated-gradient-text {
  /* Set the background to a gradient */
  background-image: linear-gradient(
    to right,
    #ef4444,
    /* red-500 */ #f97316,
    /* orange-500 */ #eab308,
    /* yellow-500 */ #22c55e,
    /* green-500 */ #3b82f6,
    /* blue-500 */ #8b5cf6,
    /* violet-500 */ #ec4899 /* pink-500 */
  );
  /* Set the background size to be larger than the text */
  /* This allows the gradient to move */
  background-size: 200% auto;
  /* Clip the background to the text */
  -webkit-background-clip: text;
  background-clip: text;
  /* Make the text color transparent so the background shows through */
  color: transparent;
  /* Animate the background position */
  animation: gradientMove 5s linear infinite;
}

/* Keyframes for the gradient movement */
@keyframes gradientMove {
  0% {
    background-position: 0% 50%; /* Start position */
  }
  50% {
    background-position: 100% 50%; /* Middle position */
  }
  100% {
    background-position: 0% 50%; /* End position (loops back to start) */
  }
}
</style>
