import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name, encoding) => readFile(path.join(root, name), encoding);
const hash = data => createHash('sha256').update(data).digest('hex');
const output = new Map();
const packed = {};
const integrity = {};
const modules = new Map();
const types = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const standalone = process.argv.includes('--standalone');

async function list(dir) {
    const result = [];
    for (const item of await readdir(path.join(root, dir), { withFileTypes: true })) {
        const name = dir + '/' + item.name;
        if (item.isDirectory()) result.push(...await list(name));
        else if (item.isFile()) result.push(name);
    }
    return result.sort();
}

for (const dir of ['engine', 'game']) {
    const factories = [];
    for (const name of await list(dir)) {
        if (!name.endsWith('.js')) continue;
        const source = await read(name, 'utf8');
        modules.set(name, source);
        factories.push(JSON.stringify(name) + ': function(require, module, exports) {\n' + source + '\n}');
    }
    let bundle = 'KonturModules.register({\n' + factories.join(',\n') + '\n});\n';
    if (dir === 'game') bundle += 'KonturModules.load("game/main.js");\n';
    output.set(dir + '.js', bundle);
}
for (const [id, source] of modules) {
    for (const [, ref] of source.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) {
        const resolved = path.posix.join(path.posix.dirname(id), ref);
        if (!ref.startsWith('.') || !modules.has(resolved)) throw Error(id + ': отсутствует ' + ref);
    }
}
for (const name of await list('assets')) {
    const data = await read(name);
    output.set(name, data);
    if (standalone) {
        const key = name.slice('assets/'.length);
        const type = types[path.extname(key)];
        if (!type) throw Error('Неизвестный тип ресурса: ' + name);
        packed[key] = 'data:' + type + ';base64,' + data.toString('base64');
        integrity[key] = { bytes: data.length, hash: hash(data) };
    }
}
for (const name of await list('licenses')) output.set(name, await read(name));
for (const name of ['index.html', 'runtime.js', 'game.css', 'ui.css', 'story-ui.css']) {
    output.set(name, await read('site/' + name, 'utf8'));
}

if (standalone) {
    const notices = [...output].filter(([name]) => name.startsWith('licenses/')).map(([, text]) => text.toString()).join('\n');
    const json = (id, data) => '<script type="application/json" id="' + id + '">' + JSON.stringify(data).replaceAll('<', '\\u003c') + '</script>';
    const inlineAssets = (css) => css.replace(/url\('\.\/assets\/([^']+)'\)/g, (_, name) => "url('" + packed[name] + "')");
    const html = output.get('index.html')
        .replace(/content="default-src [^"]+"/, 'content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; media-src blob: data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'"')
        .replace('href="./assets/icons/mark.svg"', () => 'href="' + packed['icons/mark.svg'] + '"')
        .replace(/<link rel="stylesheet" href="\.\/([^"]+)">/g, (_, name) => '<style>\n' + inlineAssets(output.get(name)) + '\n</style>')
        .replace(/<script src="\.\/([^"]+)"><\/script>/g, (_, name) => {
            const prefix = name === 'runtime.js' ? '<!-- ' + notices + ' -->\n' + json('k77-local-assets', packed) + '\n' + json('k77-local-integrity', integrity) + '\n' : '';
            return prefix + '<script>\n' + output.get(name).replace(/<\/script/gi, '<\\/script') + '\n</script>';
        });
    const target = path.join(root, 'Kontur-77-3.3.html');
    const tmp = target + '.' + process.pid + '.tmp';
    await writeFile(tmp, html);
    await rename(tmp, target);
    console.log('Автономная версия: ' + target);
} else {
    const files = [...output].map(([path, data]) => ({ path, bytes: Buffer.byteLength(data), hash: hash(data) }));
    const manifest = { files, total: files.reduce((sum, item) => sum + item.bytes, 0) };
    const worker = await read('site/sw.js', 'utf8');
    const version = hash(worker + JSON.stringify(manifest));
    output.set('offline-pack.json', JSON.stringify(manifest));
    output.set('sw.js', 'const VERSION = ' + JSON.stringify(version) + ';\nconst PACK = ' + JSON.stringify(manifest) + ';\n' + worker);
    for (const [name, data] of output) {
        const target = path.join(root, 'dist', name);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, data);
    }
    console.log('GitHub Pages: dist/ (' + output.size + ' файлов, ' + modules.size + ' модулей).');
}
