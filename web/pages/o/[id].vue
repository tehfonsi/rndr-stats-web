<template>
  <div>
    {{ result }}
  </div>
</template>

<!-- <script setup>
  // const { data } = await useAsyncData('node-overview', () =>
  //   $fetch('http://localhost:8888/api/node-overview?id=' + $route.params.id)
  // );
  console.log(this);
</script> -->

<script>
  export default {
    data: () => ({ result: null }),
    async asyncData() {},
    async mounted() {
      const { id } = this.$route.params;
      // // const { data } = await useAsyncData('node-overview', () =>
      // //   $fetch('http://localhost:8888/api/node-overview?id=' + id)
      // // );
      // const url = '/api/node-overview?id=' + id;
      // console.log(url);
      // const { data } = await $fetch(url);
      // console.log(data.value);
      this.result = id;
    },
  };
</script>
