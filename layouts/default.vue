<template>
  <Html>
    <Head>
      <Title>RNDR Stats</Title>
      <Script
        async
        src="https://umami.tehfonsi.com/script.js"
        data-website-id="9f317854-b13f-41fb-a0e4-7f81d0fb86ab"
      ></Script>
    </Head>
    <Body>
      <div>
        <slot />
      </div>
      <Footer />
    </Body>
  </Html>
</template>

<style>
.highlight {
  background: #b41e2d;
}

a {
  color: #b41e2d;
  text-decoration: underline;
}

.primary {
  color: #b41e2d;
}

.warning {
  color: #ffa500;
}

html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  line-height: 1.2;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  background: #151617;
  color: #f0f0f0;
}

body {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}

.button--green:hover {
  color: #fff;
  background-color: #3b8070;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
  margin-left: 15px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}
</style>
