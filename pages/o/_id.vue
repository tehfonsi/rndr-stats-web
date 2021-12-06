<template>
  <div>
    <h1>Alpha version</h1>
    <ul>
      <li v-for="node in nodes" :key="node.id" class="my-2">
        <span>Node: {{ node.gpus.split(',')[0] }} / {{ node.score }} OB</span
        ><br />
        State: <span class="highlight px-2">{{ node.state }}</span
        >, since {{ new Date(node.since).toLocaleString() }}
      </li>
    </ul>
  </div>
</template>

<script>
  export default {
    layout: 'operator',
    data: () => {
      return {
        nodes: null,
      };
    },
    async asyncData({ params, $axios }) {
      const { id } = params;
      try {
        const nodes = await $axios.$get('/api/node-overview?id=' + id);
        return { nodes };
      } catch (error) {
        console.error(error);
      }
      return { nodes: null };
    },
  };
</script>

<style scoped>
  h1 {
    margin: 1rem;
  }
</style>
