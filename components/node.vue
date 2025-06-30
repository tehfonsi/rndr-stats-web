<template>
  <div v-if="node">
    <div v-if="edit">
      <input :value="node.name || ''" />
      <span v-on:click="hideInput" class="cursor-pointer primary">Cancel</span>
      or
      <span v-on:click="changeName" class="cursor-pointer primary">Change</span>
    </div>
    <span v-else v-on:click="showInput"
      >Node:
      <span class="primary">{{ node.name || node.gpus.split(',')[0] }}</span> /
      <span :class="{ warning: showObWarning }">{{ node.score }} OB</span></span
    >
    <div v-on:click="toggle">
      State: <span class="highlight px-2">{{ node.state }}</span
      >, since {{ fromNow(node.since) }}
      <div v-if="showWarning(node.updated)" class="warning">
        This node might be unresponsive, last updated
        {{ fromNow(latestDate(node)) }} ago
      </div>
    </div>
    <div v-if="expanded" v-on:click="toggle">
      <div>Total</div>
      <div class="ml-5">Jobs completed: {{ node.jobs_completed }}</div>
      <div class="ml-5">Previews sent: {{ node.previews_sent }}</div>
      <div class="ml-5">Thumbnails send: {{ node.thumbnails_sent }}</div>
      <div v-if="jobs">
        <div>Selected timeframe</div>
        <div class="ml-5">Jobs: {{ jobs.job_count }}</div>
        <div class="ml-5">
          Utilization: {{ (jobs.utilization * 100).toFixed(2) }} %
        </div>
        <div class="ml-5">
          Estimated income:
          {{ jobs.income.toFixed(2) }}
          RNDR
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fromNow } from '../src/utils';

interface NodeJobs {
  job_count: number;
  utilization: number;
  income: number;
}

interface Node {
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

const props = defineProps<{ node: Node }>();

const state = reactive({ expanded: true });
const edit = ref(false);

onMounted(() => {
  const savedState = window.localStorage.getItem(props.node.id);
  if (savedState) {
    Object.assign(state, JSON.parse(savedState));
  }
});

function latestDate(node: Node) {
  if (node.updated && node.updated > node.since) {
    return node.updated;
  }
  return node.since;
}

function showWarning(date: string | number | Date) {
  const hour = 1000 * 60 * 60;
  const anHourAgo = Date.now() - hour;
  return new Date(date).getTime() < anHourAgo;
}

function toggle() {
  state.expanded = !state.expanded;
  saveState();
}

function saveState() {
  window.localStorage.setItem(props.node.id, JSON.stringify(state));
}

function showInput() {
  edit.value = true;
  nextTick(() => {
    const input = (document.querySelector('input') as HTMLInputElement | null);
    if (input) input.focus();
  });
}

function hideInput() {
  edit.value = false;
}

async function changeName() {
  const password = prompt('Enter your password', '');
  const input = (document.querySelector('input') as HTMLInputElement | null);
  const name = input?.value || '';
  hideInput();
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

const jobs = computed(() => props.node.jobs);
const expanded = computed(() => state.expanded);
const showObWarning = computed(() => props.node.score > 300 && props.node.score < 400);
</script>
