const CACHE_VERSION = 1;
const CURRENT_CACHES = {
   images: 'image-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', (event) => {
   const expectedCacheNamesSet = new Set(Object.values(CURRENT_CACHES));
   event.waitUntil(
      caches.keys().then((cacheNames) => {
         return Promise.all(cacheNames.map((cacheName) => {
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
      event.respondWith(caches.open(CURRENT_CACHES.images).then(async cache => {
         return cache.match(event.request).then(cacheResponse => {
            if(!cacheResponse){console.log("attempting to fetch", event.request.clone())}
            return cacheResponse || fetch(event.request.clone()).then(fetchResponse => {
               console.log("succesfully fetched", event.request.url, "putting in cache")
               cache.put(event.request, fetchResponse.clone())
               console.log("returning", fetchResponse)
               console.log("fetch response after console log", fetchResponse)
               return fetchResponse
            })
         })
      }))
      // event.respondWith(
      //    caches.open(CURRENT_CACHES.images).then(async cache => {
      //       const response = await cache.match(event.request).then(response => {
      //          console.log(event.request.url.slice(-8), "cache match response", response)
      //          return response || fetch(event.request).then(fetchResponse => {
      //             console.log(event.request.url.slice(-8), "fetching from network, no response found in cache")
      //             if(fetchResponse.status < 400){
      //                console.log(event.request.url.slice(-8), "putting response in cache", fetchResponse)
      //                cache.put(event.request, fetchResponse)
      //             }
      //             return fetchResponse
      //          })
      //       })
      //       console.log(event.request.url.slice(-8), "returning from awaiting cache.match", response)
      //       return response
      //    }).catch(error => {
      //       console.error(error)
      //       throw error
      //    })
      // )
   }
});
