const CACHE_NAME = 'xinchuan-srs-v1';
const ASSETS = [
  './',
  './xinchuanwords.html',
  './manifest.json'
];

// 安装：缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求：缓存优先，离线可用
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // 只缓存 GET 请求
  if (req.method !== 'GET') return;
  // 跳过非 http(s) 请求
  if (!req.url.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      // 有缓存直接返回，同时后台更新
      const fetchPromise = fetch(req).then((resp) => {
        // 只缓存同源的成功响应
        if (resp && resp.status === 200 && new URL(req.url).origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return resp;
      }).catch(() => cached || caches.match('./xinchuanwords.html'));

      return cached || fetchPromise;
    })
  );
});
