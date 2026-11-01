// READY STATE or DIE offline cache. Bump CACHE when you change index.html.
// Tree JSON updates don't need a bump: they're refreshed in the background on every load.
const CACHE = 'rsod-v3';
const SHELL = ['./', './index.html', './trees/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    try {
      const m = await (await fetch('./trees/manifest.json', { cache: 'no-store' })).json();
      await c.addAll((m.trees || []).concat(m.fleet ? [m.fleet] : []).map(f => './trees/' + f));
    } catch (err) { /* trees get cached on first successful fetch instead */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Network first with a short timeout (fresh trees when there's signal),
// fall back to cache when the truck has none.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500))
      ]);
      if (res && res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req, { ignoreSearch: true });
      return hit || new Response('Offline and not cached', { status: 503 });
    }
  })());
});
