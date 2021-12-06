<template>
  <div>{{ nodes }}</div>
</template>

<script>
  export default {
    async asyncData({ params, $axios }) {
      const { id } = params;
      try {
        const nodes = await $axios.$get('/api/node-overview?id=' + id);
        console.log(nodes);
        return { nodes };
      } catch (error) {
        console.error(error);
      }
      return { nodes: null };
    },
  };
</script>
