const CACHE_NAME = 'v1_profile_add_cache';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/js/main.js',
  '/js/src/components/app-link/app-link.js',
  '/js/src/components/app-link/styles.css',
  '/js/src/components/app-link/template.js',
  '/js/src/components/app-router/app-router.js',
  '/js/src/components/app-router/styles.css',
  '/js/src/components/app-router/template.js',
  '/js/src/components/profile-directory/profile-directory.js',
  '/js/src/components/profile-directory/styles.css',
  '/js/src/components/profile-directory/template.js',
  '/js/src/components/profile-form/profile-form.js',
  '/js/src/components/profile-form/styles.css',
  '/js/src/components/profile-form/template.js',
  '/js/src/components/profile-list/profile-list.js',
  '/js/src/components/profile-list/styles.css',
  '/js/src/components/profile-list/tepmplate.js',
  '/js/src/components/profile-search/profile-search.css',
  '/js/src/components/profile-search/profile-search.js',
  '/js/src/components/profile-search/tepmplate.js',
  '/js/src/components/validation-message/template.js',
  '/js/src/components/validation-message/validation-message.css',
  '/js/src/components/validation-message/validation-message.js',
  '/js/src/metadata/constants.js',
  '/js/src/metadata/dataSource.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: Caching interface ...');
      return cache.addAll(ASSETS_TO_CACHE); 
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`PWA: Removing old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith(self.location.origin))
    return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request);
    })
  )
});
