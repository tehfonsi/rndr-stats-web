<template>
  <div>
    <h1 class="m-5">RNDR Dashboard <sup>beta</sup></h1>
    <div class="m-5" v-if="!$route.params.id">
      Add your operator id at the end of the current url to see your dashboard.
    </div>
    <ul v-else>
      <li v-for="node in nodes" :key="node.id" class="my-2">
        <span>Node: {{ node.gpus.split(',')[0] }} / {{ node.score }} OB</span>
        <div>
          State: <span class="highlight px-2">{{ node.state }}</span
          >, since {{ fromNow(node.since) }}
        </div>
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
            {{
              (
                (24 * node.jobs.utilization * node.score) /
                (node.score > 300 ? 50 : 200)
              ).toFixed(2)
            }}
            RNDR
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
  import { fromNow } from '../../src/utils';

  export default {
    layout: 'operator',
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
          node.jobs = jobs.find((job) => job.id === node.id) || undefined;
        });
        return { nodes };
      } catch (error) {
        console.error(error);
      }
      return { nodes: null };
    },
    methods: {
      fromNow: (date) => {
        return fromNow(new Date(date));
      },
    },
  };
</script>
