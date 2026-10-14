// PWA online: nenhum dado ou página é armazenado para uso offline.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('diagrama-shell-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
