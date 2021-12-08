<template>
  <div>
    <h1 class="m-5">RNDR Dashboard <sup>beta</sup></h1>
    <div class="m-5" v-if="!$route.params.id">
      Add your operator id at the end of the current url to see your dashboard.
    </div>
    <ul v-else>
      <div v-if="nodes">
        Last 24 hours: {{ overview.income.toFixed(2) }} RNDR /
        {{ (overview.utilization * 100).toFixed(2) }}%
        {{
          overview.tier3_utilization && overview.tier2_utilization
            ? `(T3: ${(overview.tier3_utilization * 100).toFixed(2)}%, T2: ${(
                overview.tier2_utilization * 100
              ).toFixed(2)}%)`
            : ''
        }}
      </div>
      <li v-for="node in nodes" :key="node.id" class="my-2">
        <client-only placeholder="Loading...">
          <Node v-if="node" :node="node" />
        </client-only>
      </li>
    </ul>
  </div>
</template>

<script>
  import Node from '../../components/node.vue';

  export default {
    data: () => {
      return {
        nodes: null,
        jobs: null,
      };
    },
    async asyncData({ params, $axios }) {
      const { id } = params;
      try {
        const results = await Promise.all([
          $axios.$get('/api/node-overview?id=' + id),
          $axios.$get('/api/job-overview?id=' + id),
        ]);
        const nodes = results[0];
        const jobs = results[1];
        nodes.forEach((node) => {
          const job = jobs.find((job) => job.id === node.id) || undefined;
          if (job) {
            job.income =
              (24 * job.utilization * node.score) /
              (node.score < 300 ? 200 : 50);
          }
          node.jobs = job;
        });
        return { nodes };
      } catch (error) {
        console.error(error);
      }
      return { nodes: null };
    },

    computed: {
      overview: function() {
        const overview = {
          income: 0,
          tier3_utilization: 0,
          tier2_utilization: 0,
        };
        let tier3_count = 0;
        let tier2_count = 0;
        this.nodes.forEach((node) => {
          overview.income += node.jobs.income || 0;
          if (node.score < 300) {
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
    methods: {},
    components: { Node },
  };
</script>
