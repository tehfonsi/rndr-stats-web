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
    </div>
  </section>
</template>

<script>
  export default {};
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
