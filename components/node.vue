<template>
  <div v-on:click="toggle" v-if="node">
    <span>Node: {{ node.gpus.split(',')[0] }} / {{ node.score }} OB</span>
    <div>
      State: <span class="highlight px-2">{{ node.state }}</span
      >, since {{ fromNow(node.since) }}
    </div>
    <div v-if="expanded">
      <div>Total</div>
      <div class="ml-5">Jobs completed: {{ node.jobs_completed }}</div>
      <div class="ml-5">Previews sent: {{ node.previews_sent }}</div>
      <div class="ml-5">Thumbnails send: {{ node.thumbnails_sent }}</div>
      <div v-if="node.jobs">
        <div>Last 24 hours</div>
        <div class="ml-5">Jobs: {{ node.jobs.job_count }}</div>
        <div class="ml-5">
          Utilization: {{ (node.jobs.utilization * 100).toFixed(2) }} %
        </div>
        <div class="ml-5">
          Estimated income:
          {{ node.jobs.income.toFixed(2) }}
          RNDR
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { fromNow } from '../src/utils';

  export default {
    props: {
      node: Object,
    },
    data: () => {
      return {
        state: { expanded: true },
      };
    },
    mounted() {
      const savedState = window.localStorage.getItem(this.node.id);
      if (savedState) {
        this.state = JSON.parse(savedState);
      }
    },
    methods: {
      fromNow: function(date) {
        return fromNow(new Date(date));
      },
      toggle: function() {
        this.state.expanded = !this.state.expanded;
        this.saveState();
      },
      saveState: function() {
        window.localStorage.setItem(this.node.id, JSON.stringify(this.state));
      },
    },
    watch: {
      node: function() {},
    },
    computed: {
      expanded: function() {
        return this.state.expanded;
      },
    },
  };
</script>
