const APP_PREFIX = 'iBudget-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = "data-cache-" + VERSION;
const FILES_TO_CACHE = [
    "./index.html",
    "./css/styles.css",
    "./js/idb.js",
    "./js/index.js",
    "./manifest.json",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
];


// install service-worker and cache resources as per FILES_TO_CACHE above
self.addEventListener('install', function (e) {
    // wait until files have been cached
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('Preparing cache: ' + CACHE_NAME + "!")
            return cache.addAll(FILES_TO_CACHE)
        })
    )
})

// Delete caches that have been superceded
self.addEventListener('activate', function (e) {
    // wait until chache has been updated to current
    e.waitUntil(
        // get array of caches by name
        caches.keys().then(function (keyList) {
            // store keys that match this app prefix from total keylist in new variable - cacheKeepList
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            });
            // push or add name of current cache to keeplist
            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(
                // process keylist
                keyList.map(function (key, i) {
                    // remove any cache that does not exist in cacheKeepList
                    if (cacheKeeplist.indexOf(key) === -1) {
                        // log the cache being removed to the console
                        console.log('Removing unnecessary cache: ' + keyList[i] + "!");
                        // delete the unnecessary cache
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

// intercept and cache successful responses to api calls
self.addEventListener("fetch", function (e) {
    // store all successful get requests made to the server at /api in DATA_CACHE_NAME
    if (e.request.url.includes("/api/")) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(e.request)
                    .then(response => {
                        // if the fetch was successful, store a copy and forward to client
                        if (response.status === 200) {
                            cache.put(e.request.url, response.clone());
                        }

                        return response;
                    })
                    .catch(err => {
                        // since there was an issue getting request from server, attempt to provide from cache
                        return cache.match(e.request);
                    });
            })
                .catch(err => console.log(err))
        );
        // don't run below code if code above was called - DUH. I need to remember this.
        return;
    }

    // intercept and cache successful responses for static files from server
    e.respondWith(
        // request the requested static file from the server
        fetch(e.request).catch(function () {
            // if the response was succesfull store the file in the cache and forward it to client ELSE forward file from cache
            return caches.match(e.request).then(function (response) {
                if (response) {
                    return response;
                } else if (e.request.headers.get("accept").includes("text/HTML")) {
                    return cache.match("/");
                }
            })
        })
    )
})