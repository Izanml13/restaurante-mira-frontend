/**
 * Service worker de MIRA (T06/T07).
 * - Sin caché: la web siempre va a la red, así no se sirven versiones viejas.
 * - push / notificationclick: listos para Web Push (T07). Entiende el formato
 *   de FCM ({ notification, data }) y uno plano ({ titulo, cuerpo, data }).
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Chrome necesita un manejador de fetch para ofrecer la instalación.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (e) => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch { p = { cuerpo: e.data?.text() }; }
  const n = p.notification || {};
  const data = p.data || {};
  const titulo = n.title || p.titulo || 'MIRA';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: n.body || p.cuerpo || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data,
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  // data.ruta llega como en la app móvil ("/reservas") → hash de la web (#/reservas).
  const ruta = e.notification.data?.ruta;
  const destino = typeof ruta === 'string' && ruta.startsWith('/') ? `/#${ruta}` : '/';
  e.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abiertas) {
      if ('focus' in c) { await c.navigate(destino).catch(() => {}); return c.focus(); }
    }
    return self.clients.openWindow(destino);
  })());
});
