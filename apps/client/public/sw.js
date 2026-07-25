/**
 * Service worker do BarberSync.
 *
 * Estratégia conservadora, porque o app é autenticado e dinâmico:
 *  - Navegações  → rede primeiro (cache só como reserva offline). Evita servir
 *                  tela de outro usuário ou dados velhos.
 *  - Estáticos   → cache primeiro, revalidando em segundo plano.
 *  - API/terceiros → passam direto, nunca são cacheados.
 *
 * Suba o VERSION ao mudar as regras: o activate limpa os caches antigos.
 */
const VERSION = 'v1';
const STATIC_CACHE = `bs-static-${VERSION}`;
const PAGE_CACHE = `bs-pages-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // A API roda em outra origem — deixa passar (e nunca cacheia resposta autenticada).
  if (url.origin !== self.location.origin) return;

  // Navegação: rede primeiro, cache/offline como reserva.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }),
    );
    return;
  }

  // Assets do build e ícones: cache primeiro, atualizando em segundo plano.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
