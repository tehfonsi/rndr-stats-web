<template>
  <section class="container">
    <div>
      <h1 class="highlight">rndr-stats <sup>beta</sup></h1>
      <div class="w-60 text-left mt-5">
        <span>How to get started:</span>
        <ul>
          <li>
            Download
            <a href="https://github.com/tehfonsi/rndr-watchdog" target="_blank"
              >RNDR watchdog</a
            >
            (modified version)
          </li>
          <li>
            Configure RNDR watchdog
          </li>
          <li>
            Start RNDR watchdog
          </li>
          <li>
            Copy your operator id (keep it secret)
          </li>
          <li>Go to your <a href="/o/">RNDR dashboard</a></li>
        </ul>
        <br />
        <span
          ><i>Warning</i>: Your ETH address is sent and needed to identify your
          nodes</span
        >
        <br />
        <br />
        <span
          ><i>Disclaimer</i>: This is a non-official community project and is
          not associated with OTOY.</span
        >
      </div>
      <div class="w-full h-64 text-left mt-5" v-if="utilization">
        <div>
          Network utilization for the past 7 days
        </div>
        <div class="mt-1">
          <span class="inline-block w-32 font-bold">OB Range</span>
          <span class="inline-block w-16 font-bold">Tier</span>
          <span class="font-bold">Utilization</span>
        </div>
        <div v-for="range in utilization" :key="range.from">
          <span class="inline-block w-32">{{range.from + ' - '+  range.to}}</span>
          <span class="inline-block w-16">{{range.tier}}</span>
          <span>{{range.utilization}} %</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
  export default {
    data: () => {
      return {
        utilization: null
      };
    },
    mounted() {
      // this.getUtilization();
    },
    methods: {
      getUtilization: async function() {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        endDate.setUTCHours(23,59,59,999);
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        startDate.setUTCHours(0,0,0,0);
        const start = parseInt(startDate.getTime() / 1000);
        const end = parseInt(endDate.getTime() / 1000);
        const result = await this.$axios.$get(
          `/api/utilization?start=${start}&end=${end}`
        );
        const data = result.map((u) => {
          const object = {};
          const range = u.score_range.split('-').map((value) => parseInt(value.trim()));
          object.from = range[0];
          object.to = range[1];
          object.utilization = (u.utilization * 100).toFixed(2);
          if (object.from >= 300) {
            object.tier = 2;
          } else {
            object.tier = 3;
          }
          return object;
        });
        data.sort((e1, e2) => e1.from - e2.from);
        this.utilization = data;
      },
    },
  }
</script>

<style>
  /* Sample `apply` at-rules with Tailwind CSS
.container {
  @apply min-h-screen flex justify-center items-center text-center mx-auto;
}
*/
  .container {
    margin: 0 auto;
    padding: 0 3rem;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .title {
    font-family: 'Quicksand', 'Source Sans Pro', -apple-system,
      BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
      sans-serif;
    display: block;
    font-weight: 300;
    font-size: 100px;
    color: #35495e;
    letter-spacing: 1px;
  }

  .subtitle {
    font-weight: 300;
    font-size: 42px;
    color: #526488;
    word-spacing: 5px;
    padding-bottom: 15px;
  }

  .links {
    padding-top: 15px;
  }
</style>
