importScripts('/_nuxt/workbox.4c4f5ca6.js')

workbox.precaching.precacheAndRoute([
  {
    "url": "/_nuxt/1fb4aca.js",
    "revision": "903e830b555210dfa3ff4b73be6fea3b"
  },
  {
    "url": "/_nuxt/b9da4ed.js",
    "revision": "87db669c9dcb8e2971683debcb6615b5"
  },
  {
    "url": "/_nuxt/c26aa6c.js",
    "revision": "b968d5283bfabd2a98c6c2448f9a8704"
  },
  {
    "url": "/_nuxt/e52ab0d.js",
    "revision": "6edffd5d276e8cc171cd9eaea73b1ff6"
  }
], {
  "cacheId": "rndr-stats-web",
  "directoryIndex": "/",
  "cleanUrls": false
})

workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(new RegExp('/_nuxt/.*'), workbox.strategies.cacheFirst({}), 'GET')

workbox.routing.registerRoute(new RegExp('/.*'), workbox.strategies.networkFirst({}), 'GET')
