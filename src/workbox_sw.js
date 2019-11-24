importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);

  workbox.setConfig({debug: false})

  // Updating SW lifecycle to update the app after user triggered refresh
  workbox.core.skipWaiting()
  workbox.core.clientsClaim()

  // for Google Analytics
  workbox.googleAnalytics.initialize();

  // procedure when recieved cache updated event
  const updatesChannel = new BroadcastChannel('data-asset-json-update');
  updatesChannel.addEventListener('message', async (event) => {

    // [Service Worker - Qiita]
    // https://qiita.com/propella/items/6500f76c9c1521878a6b
    // handler for when information is received regarding newer cache available
    //console.log(event)
    const { cacheName, updatedUrl } = event.data.payload
    self.clients.matchAll().then( clients => {
      clients.forEach( client => {
        client.postMessage(event.data)
      })
    });
  })

  // Cache the Google Fonts webfont files with a cache first strategy for 1 year.
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.cacheableResponse.Plugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.Plugin({
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    }),
  )

  // Cache the js and css
  workbox.routing.registerRoute(
    /\.(?:js|css|html?.*)$/,
    new workbox.strategies.StaleWhileRevalidate(),
  )

  // Cache the images
  workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|jpeg|svg)$/,
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.Plugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    }),
  )
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
