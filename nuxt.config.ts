import { defineNuxtConfig } from 'nuxt/config';

// Determine API Base URL based on NODE_ENV or a specific environment variable
const apiBaseUrl = process.env.NUXT_PUBLIC_API_BASE_URL ||
                   (process.env.NODE_ENV === 'production' ? 'https://rndr-stats.com' : 'http://localhost:8888');

export default defineNuxtConfig({
  app: {
    head: {
      title: 'rndr-stats-web', // From package.json name
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { hid: 'description', name: 'description', content: 'RNDR Statistics for the Render Network' } // Placeholder description
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ],
      script: [
        {
          "data-website-id": "9f317854-b13f-41fb-a0e4-7f81d0fb86ab", // From original config
          src: "https://umami.tehfonsi.com/script.js", // From original config
          async: true,
          defer: true // Added defer
        }
      ]
    }
  },
  css: [
    '~/assets/css/tailwind.css' // Retained from original config
  ],
  modules: [
    '@nuxtjs/tailwindcss' // Added as per previous subtask, replaces old Tailwind setup
    // Other modules can be added here if needed
  ],
  runtimeConfig: {
    public: {
      apiBaseUrl: apiBaseUrl
    }
  },
  // Nuxt DevTools are enabled by default in Nuxt 3.
  // You can explicitly enable or disable them if needed:
  // devtools: { enabled: true }
})
