<template>
  <section class="container">
    <div>
      <h1 class="highlight">rndr-stats <sup>beta</sup></h1>
      <br/>
        <span
          ><i>Disclaimer</i>: This is a non-official community project and is
          not associated with OTOY.</span
        >
      <div class="w-full text-left mt-5" v-if="utilization">
        <div>
          Average network utilization:
          <span
            v-bind:class="{ 'font-bold': selectedDays === 1 }"
            class="24hours cursor-pointer primary"
            v-on:click="selectDays(1)"
            >Yesterday</span
          >
          /
          <span
            v-bind:class="{ 'font-bold': selectedDays === 7 }"
            class="24hours cursor-pointer primary"
            v-on:click="selectDays(7)"
            >Last week</span
          >
        </div>
        <table class="w-full mt-1">
          <thead>
            <tr>
              <th>OB Range</th>
              <th>Tier</th>
              <th>Utilization</th>
              <th>Nodes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="range in utilization" :key="range.from">
              <td>{{range.from + ' - '+  range.to}}</td>
              <td>{{range.tier}}</td>
              <td>{{range.utilization}} %</td>
              <td>{{range.nodes}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="w-full text-left mt-5">
        <span>How to get the dashboard for your nodes:</span>
        <ul class="list-disc list-inside">
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
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">

interface UtilizationRange {
  from: number;
  to: number;
  tier: string;
  utilization: string; // as percentage string, e.g. '12.34'
  nodes: string; // e.g. '10+', '80+', etc
  range: string;
}

const utilization = ref<UtilizationRange[] | null>(null);
const selectedDays = ref<number>(7);

function selectDays(days: number): void {
  getUtilization(days);
}

async function getUtilization(days: number): Promise<void> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);
  endDate.setUTCHours(23,59,59,999);
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  startDate.setUTCHours(0,0,0,0);
  const start = Math.floor(startDate.getTime() / 1000);
  const end = Math.floor(endDate.getTime() / 1000);
  const data = await $fetch<any[]>(
    `/api/utilization?start=${start}&end=${end}`
  );

  if (!data) {
    utilization.value = null;
    return;
  }
  const result = data || [];
  const mapped: UtilizationRange[] = result.map((u) => {
    const range = u.from + ' - ' + u.to;
    let nodes: string;
    if (u.nodes > 80) {
      nodes = '80+';
    } else if (u.nodes > 40) {
      nodes = '40+';
    } else if (u.nodes > 20) {
      nodes = '20+';
    } else if (u.nodes > 10) {
      nodes = '10+';
    } else {
      nodes = ''+u.nodes;
    }
    return {
      from: u.from,
      to: u.to,
      tier: u.tier,
      utilization: (u.utilization * 100).toFixed(2),
      nodes,
      range,
    };
  });
  mapped.sort((e1, e2) => e1.from - e2.from)
  utilization.value = mapped.filter((d) => Number(d.utilization) > 0);
  selectedDays.value = days;
}

onMounted(() => {
  getUtilization(7);
});
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
