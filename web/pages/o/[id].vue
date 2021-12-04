<template>
  <div>
    {{ overview }}
  </div>
</template>

<script>
  export default {
    data: () => ({ overview: null }),
    async asyncData() {},
    async mounted() {
      const { id } = this.$route.params;
      const url = '/a/node-overview?id=' + id;
      this.overview = await $fetch(url);
    },
  };
</script>
