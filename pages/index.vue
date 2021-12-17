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
          Average network utilization for the past 7 days
        </div>
        <table class="w-full mt-1">
          <tr>
            <th>OB Range</th>
            <th>Tier</th>
            <th>Utilization</th>
            <th>Nodes</th>
          </tr>
          <tr v-for="range in utilization" :key="range.from">
            <td>{{range.from + ' - '+  range.to}}</td>
            <td>{{range.tier}}</td>
            <td>{{range.utilization}} %</td>
            <td>{{range.nodes}}</td>
          </tr>
        </table>
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
      this.getUtilization();
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
          u.range = u.from + ' - ' + u.to;
          if (u.nodes > 80) {
            u.nodes = '80+';
          } else if (u.nodes > 40) {
            u.nodes = '40+';
          } else if (u.nodes > 20) {
            u.nodes = '20+';
          } else if (u.nodes > 10) {
            u.nodes = '10+';
          } else {
            u.nodes = ''+u.nodes;
          }
          u.utilization = (u.utilization * 100).toFixed(2);
          return u;
        });
        data.sort((e1, e2) => e1.from - e2.from)
        this.utilization = data.filter((d) => d.utilization > 0);
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
