window.addEventListener('load', () => {
  const file_to_register = './workbox_sw.js'
  if(true) {
  //if(document.location.protocol.match(/^https:/) != null
  //   || document.location.hostname.match(/^localhost$/) != null) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(file_to_register).then( registration => {
        console.log('[SW] Registration Succeed. Scope: ', registration.scope)
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if(event.data.type == 'CACHE_UPDATED') {
            window.location.reload()
          }
        });
      }).catch(err => {
        console.error('[SW] Registration Failed.  Message: ', err);
      });
    }
  } else {
    console.warn('ServiceWorker disabled since your access is from HTTP. Use HTTPS to enable it.');
  }
})
