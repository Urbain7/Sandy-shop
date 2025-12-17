const CACHE_NAME = 'sandyshop-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/produits.html',
  '/panier.html',
  '/contact.html',
  '/assets/style.css',
  '/js/utils.js',
  '/js/products.js',
  '/js/theme.js',
  '/js/theme-engine.js',
  '/data/produits.json',
  '/assets/favicon.png'
];

// Installation : On met en cache les fichiers essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Utilisation : On sert le cache si pas d'internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
