/* TOEIC S/A Drill — オフライン用 Service Worker
   キャッシュ優先で配信し、更新があれば裏で取得して次回起動時に反映する。 */

const CACHE = 'toeic-drill-v109';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './bg-home.webp',
  './splash-1125x2436.png',
  './splash-1170x2532.png',
  './splash-1179x2556.png',
  './splash-1206x2622.png',
  './splash-1242x2208.png',
  './splash-1242x2688.png',
  './splash-1290x2796.png',
  './splash-1320x2868.png',
  './splash-640x1136.png',
  './splash-750x1334.png',
  './splash-828x1792.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // 1つでも取得に失敗すると addAll は全体が失敗するため、個別に入れる
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      // 裏で最新版を取りに行き、成功したらキャッシュを差し替える
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
