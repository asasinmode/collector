const CACHE_VERSION = 1;
const CURRENT_CACHES = {
   images: 'image-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', (event) => {
   const expectedCacheNamesSet = new Set(Object.values(CURRENT_CACHES));
   event.waitUntil(
      caches.keys().then((cacheNames) => {
         return Promise.all(
         cacheNames.map((cacheName) => {
            if (!expectedCacheNamesSet.has(cacheName)) {
               console.log('Deleting out of date cache:', cacheName);
               return caches.delete(cacheName);
            }
         })
         );
      })
   );
});

self.addEventListener('fetch', function(event) {
   if(event.request.destination === "image"){
      console.log('Handling fetch event for', event.request.url);
      event.respondWith(
         caches.open(CURRENT_CACHES.images).then(async cache => {
            const response = await cache.match(event.request).then(response => {
               return response || fetch(event.request).then(fetchResponse => {
                  console.log("fetching from network, no response found in cache")
                  if(fetchResponse.status < 400){
                     cache.put(event.request, fetchResponse)
                  }
                  return fetchResponse
               })
            })
            return response
         }).catch(error => {
            console.error(error)
            throw error
         })
      )
   }
});
