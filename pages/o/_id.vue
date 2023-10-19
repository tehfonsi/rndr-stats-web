<template>
  <div>
    <h1 class="m-5">RNDR Dashboard <sup>beta</sup></h1>
    <div class="m-5" v-if="!$route.params.id">
      Add your operator id at the end of the current url to see your dashboard.
    </div>
    <ul v-else>
      <div v-if="nodes">
        <div class="my-5 mr-5">
          Please consider donating to support running the servers and keep the
          dashboard available.<br />You can donate RNDR to this MetaMask wallet:
          <span class="primary"
            >0xF34913F977a2f4630339a76955Baa859614f6dDb</span
          >
        </div>
        <div>
          Last
          <span
            v-bind:class="{ 'font-bold': selectedDays === 1 }"
            class="24hours cursor-pointer primary"
            v-on:click="selectDays(1)"
            >24 hours</span
          >
          /
          <span
            v-bind:class="{ 'font-bold': selectedDays === 7 }"
            class="7days cursor-pointer primary"
            v-on:click="selectDays(7)"
            >7 days</span
          >
          /
          <span
            v-bind:class="{ 'font-bold': selectedDays === 28 }"
            class="28days cursor-pointer primary"
            v-on:click="selectDays(28)"
            >28 days</span
          >:
        </div>
        <div>
          {{ overview.income.toFixed(2) }} RNDR /
          {{
            overview.utilization ? (overview.utilization * 100).toFixed(2) : 0
          }}%
          {{
            overview.tier3_utilization && overview.tier2_utilization
              ? `(T3: ${(overview.tier3_utilization * 100).toFixed(2)}%, T2: ${(
                  overview.tier2_utilization * 100
                ).toFixed(2)}%)`
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

<script>
import Node from '../../components/node.vue';

const nodeSort = (n1, n2) => {
  if (n1.name === n2.name) {
    return 0;
  } else if (!n1.name) {
    return 1;
  } else if (!n2.name) {
    return -1;
  }
  return n1.name.localeCompare(n2.name);
};

export default {
  data: () => {
    return {
      id: null,
      nodeOverview: null,
      jobOverview: {},
      selectedDays: 1,
    };
  },
  async asyncData({ params, $axios }) {
    const { id } = params;
    try {
      const nodes = await $axios.$get('/api/node-overview?id=' + id);
      nodes.sort(nodeSort);
      return { id, nodeOverview: nodes };
    } catch (error) {
      console.error(error);
    }
    return { id, nodeOverview: null };
  },
  mounted() {
    const days = window.localStorage.getItem('days');
    if (days) {
      this.selectedDays = parseInt(days);
    }
    this.getJobOverview(this.selectedDays);

    // update job stats when tab/page becomes visible again
    const onVisibilityChanged = async () => {
      if (document.visibilityState === 'visible') {
        await this.getNodeOverview();
        this.jobOverview = {};
        await this.getJobOverview(this.selectedDays);
      }
    };
    document.addEventListener(
      'visibilitychange',
      onVisibilityChanged.bind(this)
    );
  },
  computed: {
    nodes: function() {
      if (!this.nodeOverview) {
        return [];
      }
      // hide nodes which did not update for 7 days
      return this.nodeOverview.filter((n) => {
        const day = 1000 * 60 * 60 * 24;
        return Date.now() - new Date(n.since).getTime() < day * 7;
      });
      // // filter nodes with no jobs in this timeframe
      // return this.nodeOverview.filter((n) => !!n.jobs);
    },
    overview: function() {
      const overview = {
        income: 0,
        tier3_utilization: 0,
        tier2_utilization: 0,
      };
      let tier3_count = 0;
      let tier2_count = 0;
      this.nodes.forEach((node) => {
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
        (tier3_count + tier2_count);
      overview.tier3_utilization /= tier3_count;
      overview.tier2_utilization /= tier2_count;
      return overview;
    },
  },
  methods: {
    selectDays: function(days) {
      this.getJobOverview(days);
    },
    getNodeOverview: async function() {
      const nodes = await this.$axios.$get('/api/node-overview?id=' + this.id);
      nodes.sort(nodeSort);
      this.nodeOverview = nodes;
    },
    getJobOverview: async function(days) {
      if (!this.jobOverview[days]) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        const start = parseInt(d.getTime() / 1000);
        const jobs = await this.$axios.$get(
          `/api/job-overview?id=${this.id}&start=${start}`
        );
        this.jobOverview[days] = jobs;
      }
      window.localStorage.setItem('days', days);
      this.addJobsToNodes(days);
    },
    addJobsToNodes: function(days) {
      const nodes = this.nodeOverview;
      if (this.jobOverview[days]) {
        nodes.forEach((node) => {
          const job =
            this.jobOverview[days].find((job) => job.id === node.id) ||
            undefined;
          if (job) {
            job.income =
              (days * 24 * job.utilization * node.score) /
              (node.score < 301 ? 200 : 100);
          }
          node.jobs = job;
        });
      }
      this.nodeOverview = JSON.parse(JSON.stringify(nodes));
      this.selectedDays = days;
    },
  },
  components: { Node },
};
</script>
