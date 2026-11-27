import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] ?? 8080);
const base = '/' + (process.argv[3] ?? '').split('/').filter(Boolean).join('/');
const prefix = base.endsWith('/') ? base : base + '/';
const types = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8',
    css: 'text/css; charset=utf-8', json: 'application/json', mp3: 'audio/mpeg',
    wav: 'audio/wav', svg: 'image/svg+xml', woff2: 'font/woff2', webp: 'image/webp' };

await stat(path.join(root, 'index.html')).catch(() => { throw Error('Сначала выполните node scripts/build.mjs'); });
const server = createServer(async (req, res) => {
    try {
        const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (url === base && url !== prefix) {
            res.writeHead(308, { Location: prefix }).end();
            return;
        }
        if (!url.startsWith(prefix) || !['GET', 'HEAD'].includes(req.method)) {
            res.writeHead(404).end();
            return;
        }
        const filename = path.resolve(root, url.slice(prefix.length) || 'index.html');
        const rel = path.relative(root, filename);
        if (path.isAbsolute(rel) || rel.split(path.sep).includes('..')) throw Error();
        const info = await stat(filename);
        if (!info.isFile()) throw Error();
        res.writeHead(200, { 'Content-Type': types[path.extname(filename).slice(1)] ?? 'text/plain',
            'Content-Length': info.size, 'Cache-Control': 'no-cache' });
        if (req.method === 'HEAD') res.end();
        else createReadStream(filename).on('error', () => res.destroy()).pipe(res);
    } catch {
        res.writeHead(404).end();
    }
});
server.listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + server.address().port + prefix));
