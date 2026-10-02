// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    dbPassword: process.env.NUXT_DB_PASSWORD,
    // public RPC is heavily rate limited, set NUXT_SOLANA_RPC_URL to a dedicated endpoint in production
    solanaRpcUrl: 'https://api.mainnet-beta.solana.com'
  }
})