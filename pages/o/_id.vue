<template>
  <div>{{ nodes }}</div>
</template>

<script>
  export default {
    async asyncData({ params }) {
      const { id } = params;
      const nodes = await fetch(
        'https://rndr-stats.netlify.app/api/node-overview?id=' + id
      ).then((res) => res.json());
      return { nodes };
    },
  };
</script>
