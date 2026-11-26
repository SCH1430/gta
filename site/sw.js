// VERSION and PACK are embedded by the build so each worker verifies its own release.
const scope = self.registration.scope;
const prefix = 'kontur77:' + new URL(scope).pathname + ':';
const cacheName = prefix + VERSION;
const byURL = new Map(PACK.files.map(file => [new URL(file.path, scope).href, file]));
const indexURL = new URL('index.html', scope).href;

async function matches(response, file) {
    if (!response?.ok) return false;
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength !== file.bytes) return false;
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return Array.from(digest, n => n.toString(16).padStart(2, '0')).join('') === file.hash;
}
async function download(cache, file) {
    const url = new URL(file.path, scope).href;
    const response = await fetch(url, { cache: 'reload' });
    if (!await matches(response.clone(), file)) throw Error('Не удалось проверить файл ' + file.path);
    await cache.put(url, response);
}
const state = (phase, loaded) => ({ tag: 'kontur-pack', phase, loaded, total: PACK.total });

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        const clients = (await self.clients.matchAll({ includeUncontrolled: true, type: 'window' }))
            .filter(client => client.url.startsWith(scope));
        // A failed install leaves the previous version in charge.
        let loaded = 0;
        try {
            for (let i = 0; i < PACK.files.length; i += 6) {
                const batch = PACK.files.slice(i, i + 6);
                await Promise.all(batch.map(file => download(cache, file)));
                loaded += batch.reduce((sum, file) => sum + file.bytes, 0);
                for (const client of clients) client.postMessage(state('loading', loaded));
            }
        } catch (error) {
            await caches.delete(cacheName);
            throw error;
        }
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) {
            if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
        }
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    url.search = '';
    const key = url.href === scope ? indexURL : url.href;
    if (!byURL.has(key)) return;
    event.respondWith((async () => {
        const cache = await caches.open(cacheName);
        return await cache.match(key) ?? fetch(event.request);
    })());
});
self.addEventListener('message', event => {
    const port = event.ports[0];
    if (!port) return;
    if (event.data?.type === 'VERIFY_PACK') {
        event.waitUntil((async () => {
            const cache = await caches.open(cacheName);
            const urls = new Set((await cache.keys()).map(request => request.url));
            let loaded = 0;
            for (const [url, file] of byURL) {
                if (urls.has(url)) loaded += file.bytes;
            }
            port.postMessage(loaded === PACK.total ? state('ready', loaded) :
                { ...state('error', loaded), error: 'Откройте диагностику и докачайте отсутствующие файлы.' });
        })().catch(error => port.postMessage({ ...state('error', 0), error: String(error) })));
    } else if (event.data?.type === 'AUDIT_PACK') {
        event.waitUntil((async () => {
            const cache = await caches.open(cacheName);
            const repair = new Set(event.data.repair);
            const bad = [];
            let fixed = 0;
            for (const file of PACK.files) {
                const response = await cache.match(new URL(file.path, scope).href);
                if (await matches(response, file)) continue;
                if (repair.has(file.path)) {
                    try { await download(cache, file); fixed++; continue; } catch {}
                }
                bad.push(file.path);
            }
            port.postMessage({ files: PACK.files.length, good: PACK.files.length - bad.length, total: PACK.total, fixed, bad });
        })().catch(error => port.postMessage({ error: String(error) })));
    }
});
