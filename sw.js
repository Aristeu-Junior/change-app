const CACHE_NAME = 'change-workout-v20';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Deixa chamadas ao Supabase irem direto pela rede sem interceptação
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // version.json sempre busca na rede
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navegação de página (HTML): busca sempre a versão mais recente da rede
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais recursos: network-first com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
