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

<script>
import { fromNow } from '../src/utils';
import { useRuntimeConfig } from '#app'; // Or 'nuxt/app' for Nuxt 3

export default {
  props: {
    node: Object,
  },
  data: () => {
    return {
      state: { expanded: true },
      edit: false,
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
    latestDate: function(node) {
      if (node.updated && node.updated > node.since) {
        return node.updated;
      }
      return node.since;
    },
    showWarning: function(date) {
      const hour = 1000 * 60 * 60;
      const anHourAgo = Date.now() - hour;

      return new Date(date) < anHourAgo;
    },
    toggle: function() {
      this.state.expanded = !this.state.expanded;
      this.saveState();
    },
    saveState: function() {
      window.localStorage.setItem(this.node.id, JSON.stringify(this.state));
    },
    showInput: function() {
      this.edit = true;
      this.$nextTick(() => {
        const input = this.$el.querySelector('input');
        input.focus();
      });
    },
    hideInput: function() {
      this.edit = false;
    },
    changeName: async function() {
      const password = prompt('Enter your password', '');
      if (password === null) return; // User cancelled prompt

      const input = this.$el.querySelector('input');
      const name = input.value;
      this.hideInput();

      const runtimeConfig = useRuntimeConfig();
      const apiBaseUrl = runtimeConfig.public.apiBaseUrl;

      try {
        // Using $fetch, which is Nuxt 3's global utility
        await $fetch(`${apiBaseUrl}/api/node-name`, { // Removed 'result =' as original didn't robustly use it for success
          method: 'POST',
          body: {
            node_id: this.node.id,
            name,
            password,
          }
        });
        // If $fetch completes without throwing, it's a success (2xx)
        this.node.name = name;
      } catch (error) {
        // $fetch throws an error for non-2xx responses
        // error.data often contains the parsed error body from the server
        if (error.response && error.response.status === 403) {
          alert('Wrong password! Make sure you set the same password in the .ini file of all nodes.');
        } else {
          console.error('Error changing name:', error);
          // Use error.data if available, otherwise a generic message
          alert(error.data?.error || error.data?.message || 'An error occurred while changing the node name.');
        }
      }
    },
  },
  computed: {
    jobs: function() {
      return this.node.jobs;
    },
    expanded: function() {
      return this.state.expanded;
    },
    showObWarning: function() {
      return this.node.score > 300 && this.node.score < 400;
    },
  },
};
</script>
