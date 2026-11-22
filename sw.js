/* 오프라인에서도 앱 화면이 열리도록 파일을 저장해 두는 도우미 */
const CACHE = 'todo-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './vendor/firebase-app-compat.js', './vendor/firebase-auth-compat.js', './vendor/firebase-firestore-compat.js', './icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if(url.origin !== self.location.origin && !fonts) return;
  if(req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')){
    /* 화면은 항상 최신 버전을 먼저 받아오고, 인터넷이 없으면 저장본을 보여줘요 */
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if(r.ok || r.type === 'opaque'){ const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; });
    return hit ? (net.catch(() => {}), hit) : net;
  }));
});
