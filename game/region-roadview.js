"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oldAtlas = void 0;
exports.addRegionalBridgeDeck = addRegionalBridgeDeck;
exports.addRegionalGround = addRegionalGround;
const THREE = require("../engine/three.module.min.js");
const region_layout_js_1 = require("./region-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const world_textures_js_1 = require("./world-textures.js");
const shoulder = 1.65;
const tileSize = 256;
const groundTint = '#c9d2de';
exports.oldAtlas = { minX: -206, maxX: 206, minZ: -174, maxZ: 174 };
const outer = { x0: region_layout_js_1.regionLimits.minX - 8, x1: region_layout_js_1.regionLimits.maxX + 8, z0: region_layout_js_1.regionLimits.minZ - 8, z1: region_layout_js_1.regionLimits.maxZ + 8 };
function landscapeTexture() {
    const im = document.createElement('canvas');
    im.width = 1536;
    im.height = 1280;
    const ctx = im.getContext('2d'), rnd = (0, world_textures_js_1.random)(776132);
    const { x0, x1, z0, z1 } = outer;
    ctx.scale(im.width / (x1 - x0), im.height / (z1 - z0));
    ctx.translate(-x0, -z0);
    ctx.fillStyle = '#adbbc7';
    ctx.fillRect(x0, z0, x1 - x0, z1 - z0);
    for (let k = 0; k < 360; k++) {
        const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0), radius = 10 + rnd() * 46;
        const g = ctx.createRadialGradient(x, z, 0, x, z, radius);
        g.addColorStop(0, k % 3 ? 'rgba(213,224,227,.26)' : 'rgba(108,122,143,.20)');
        g.addColorStop(1, 'rgba(151,164,184,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - radius, z - radius, 2 * radius, 2 * radius);
    }
    for (let i = 0; i < 18600; i++) {
        const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
        ctx.fillStyle = i % 3 ? 'rgba(217,229,232,.21)' : 'rgba(68,87,106,.15)';
        ctx.fillRect(x, z, 1 + rnd() * 5.1, .35 + rnd() * .73);
    }
    const { paintWindCrust } = require('./graphics-pavement.js');
    for (let z = z0; z < z1; z += tileSize)
        for (let x = x0; x < x1; x += tileSize)
            paintWindCrust(ctx, x, z, tileSize, tileSize, (0, world_textures_js_1.random)(Math.round(517 + 31 * x + 19 * z)), 26);
    for (const s of [...region_layout_js_1.regionBuildings, ...region_layout_js_1.regionSites]) {
        const margin = 3.6, left = s.x - s.w / 2 - margin, top = s.z - s.d / 2 - margin, w = s.w + 2 * margin, h = s.d + 2 * margin;
        ctx.fillStyle = s.district === 'dock' ? '#78838b' : s.district === 'quarry' ? '#80818a' : '#838d99';
        ctx.fillRect(left, top, w, h);
        ctx.fillStyle = '#737f8a';
        ctx.fillRect(left + .7, top + .7, w - 1.4, h - 1.4);
        ctx.fillStyle = '#9ba7b2';
        ctx.fillRect(left + .55, top + .55, w - 1.1, .75);
        ctx.fillStyle = 'rgba(223,228,222,.24)';
        for (let p = 2; p < w - 1; p += 5.4)
            ctx.fillRect(left + p, top + 1, .30, 2.15);
        for (let p = 0; p < 15; p++) {
            ctx.fillStyle = p % 2 ? 'rgba(148,160,170,.45)' : 'rgba(67,79,88,.27)';
            ctx.fillRect(left + rnd() * w, top + rnd() * h, .5 + rnd() * 2.4, .38);
        }
    }
    const river = ctx.createLinearGradient(0, world_expansion_layout_js_1.canal.north, 0, world_expansion_layout_js_1.canal.south);
    for (const [stop, ink] of [[0, '#687a8b'], [.13, '#516a7c'], [.48, '#6e8d9d'], [.92, '#4e6878'], [1, '#748797']])
        river.addColorStop(stop, ink);
    ctx.fillStyle = river;
    ctx.fillRect(x0, world_expansion_layout_js_1.canal.north, x1 - x0, world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, world_expansion_layout_js_1.canal.north, x1 - x0, world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
    ctx.clip();
    for (let i = 0; i < 550; i++) {
        let x = x0 + rnd() * (x1 - x0), z = world_expansion_layout_js_1.canal.north + rnd() * (world_expansion_layout_js_1.canal.south - world_expansion_layout_js_1.canal.north);
        ctx.beginPath();
        ctx.moveTo(x, z);
        for (let k = 0; k < 4; k++) {
            x += 1 + rnd() * 4;
            z += (rnd() - .5) * 2.7;
            ctx.lineTo(x, z);
        }
        ctx.strokeStyle = i % 4 ? 'rgba(200,222,226,.44)' : 'rgba(61,89,111,.65)';
        ctx.lineWidth = .23;
        ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, z0, x1 - x0, world_expansion_layout_js_1.canal.north - z0);
    ctx.rect(x0, world_expansion_layout_js_1.canal.south, x1 - x0, z1 - world_expansion_layout_js_1.canal.south);
    ctx.clip();
    for (const r of region_layout_js_1.regionPaths) {
        ctx.beginPath();
        ctx.moveTo(r.x1, r.z1);
        ctx.lineTo(r.x2, r.z2);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#b1bdc6';
        ctx.lineWidth = r.width + .9;
        ctx.stroke();
        ctx.strokeStyle = '#83909c';
        ctx.lineWidth = r.width;
        ctx.stroke();
        ctx.strokeStyle = '#949fab';
        ctx.lineWidth = r.width * .62;
        ctx.stroke();
    }
    ctx.restore();
    for (const { x, z, w, d } of region_layout_js_1.regionAprons) {
        const left = x - w * .5, top = z - d * .5;
        ctx.fillStyle = '#a1afb4';
        ctx.fillRect(left - .6, top - .6, w + 1.2, d + 1.2);
        ctx.fillStyle = '#667780';
        ctx.fillRect(left, top, w, d);
        ctx.fillStyle = 'rgba(195,201,186,.8)';
        for (let i = 3; i < w - 1; i += 3.2)
            ctx.fillRect(left + i, top + d * .11, .16, d * .34);
        for (let i = 0; i < 86; i++) {
            ctx.fillStyle = i % 2 ? 'rgba(114,134,142,.36)' : 'rgba(45,59,74,.22)';
            ctx.fillRect(left + rnd() * w, top + rnd() * d, .8 + rnd() * 2.1, .12 + rnd() * .37);
        }
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(197,218,224,.36)';
    ctx.lineWidth = .8;
    ctx.setLineDash([.8, 1.45]);
    for (const p of region_layout_js_1.regionPaths)
        if (p.x1 === p.x2 && p.z1 < world_expansion_layout_js_1.canal.north && p.z2 > world_expansion_layout_js_1.canal.south) {
            for (const dx of [-.25, .25]) {
                ctx.beginPath();
                ctx.moveTo(p.x1 + dx, world_expansion_layout_js_1.canal.north);
                ctx.lineTo(p.x1 + dx, world_expansion_layout_js_1.canal.south);
                ctx.stroke();
            }
        }
    ctx.restore();
    return (0, world_textures_js_1.texture)(im);
}
function addMesh(parent, data, mat, name) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.position, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
    geo.setIndex(data.index);
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.userData.groundSurface = true;
    parent.add(mesh);
}
const data = () => ({ position: [], uv: [], index: [] });
function groundCell(parent, box, mat) {
    const { x0, x1, z0, z1 } = box, rows = [z0, ...[world_expansion_layout_js_1.canal.north, world_expansion_layout_js_1.canal.north + 4, world_expansion_layout_js_1.canal.south - 4, world_expansion_layout_js_1.canal.south].filter(z => z > z0 && z < z1), z1];
    const d = data();
    for (const z of rows) {
        const i = d.position.length / 3;
        for (const x of [x0, x1]) {
            d.position.push(x, (0, world_expansion_layout_js_1.shoreHeight)(z) - .038, z);
            d.uv.push((x - outer.x0) / (outer.x1 - outer.x0), 1 - (z - outer.z0) / (outer.z1 - outer.z0));
        }
        if (i)
            d.index.push(i - 2, i, i - 1, i - 1, i, i + 1);
    }
    addMesh(parent, d, mat, 'Снежное покрытие округа');
}
function ground(parent) {
    const mat = new THREE.MeshBasicMaterial({ map: landscapeTexture(), color: groundTint });
    const subdivide = (anchors) => anchors.slice(0, -1).flatMap((a, i) => {
        const b = anchors[i + 1], steps = Math.ceil((b - a) / 126);
        return Array.from({ length: steps }, (_, j) => a + (b - a) * j / steps);
    }).concat(anchors.at(-1));
    const columns = subdivide([outer.x0, exports.oldAtlas.minX, exports.oldAtlas.maxX, outer.x1]);
    const rows = subdivide([outer.z0, exports.oldAtlas.minZ, exports.oldAtlas.maxZ, outer.z1]);
    for (let i = 1; i < columns.length; i++)
        for (let j = 1; j < rows.length; j++) {
            const x0 = columns[i - 1], x1 = columns[i], z0 = rows[j - 1], z1 = rows[j];
            if (x0 >= exports.oldAtlas.minX && x1 <= exports.oldAtlas.maxX && z0 >= exports.oldAtlas.minZ && z1 <= exports.oldAtlas.maxZ)
                continue;
            groundCell(parent, { x0, x1, z0, z1 }, mat);
        }
    const horizon = data(), { x0, x1, z0, z1 } = outer;
    for (const [a, c, b, e] of [[x0 - 450, z0 - 420, x0, z1 + 420], [x1, z0 - 420, x1 + 450, z1 + 420], [x0, z0 - 420, x1, z0], [x0, z1, x1, z1 + 420]]) {
        const i = horizon.position.length / 3;
        horizon.position.push(a, -.10, c, b, -.10, c, a, -.10, e, b, -.10, e);
        horizon.index.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
        horizon.uv.push(0, 0, 1, 0, 0, 1, 1, 1);
    }
    addMesh(parent, horizon, new THREE.MeshBasicMaterial({ color: '#778598' }), 'Снежный горизонт за округом');
}
function stampAsphalt(c, l, t, type) {
    const rnd = (0, world_textures_js_1.random)(4781 + type * 78), s = tileSize;
    c.save();
    c.translate(l, t);
    c.fillStyle = type === 2 ? '#3c4753' : '#394552';
    c.fillRect(0, 0, s, s);
    for (let i = 0; i < 6500; i++) {
        c.fillStyle = i % 3 ? 'rgba(19,34,49,.20)' : 'rgba(136,153,166,.23)';
        c.fillRect(rnd() * s, rnd() * s, .5 + rnd() * 2, .5 + rnd() * 2.5);
    }
    if (type !== 2) {
        for (const x of [64, 88, 166, 188]) {
            const g = c.createLinearGradient(x - 8, 0, x + 8, 0);
            g.addColorStop(0, 'rgba(12,22,37,0)');
            g.addColorStop(.5, 'rgba(12,22,37,.29)');
            g.addColorStop(1, 'rgba(12,22,37,0)');
            c.fillStyle = g;
            c.fillRect(x - 8, 0, 16, s);
        }
        for (const side of [0, 1]) {
            c.save();
            if (side) {
                c.translate(s, 0);
                c.scale(-1, 1);
            }
            c.fillStyle = '#84919c';
            c.fillRect(0, 0, 28, s);
            c.fillStyle = '#b6c1c8';
            c.fillRect(0, 0, 10, s);
            c.fillRect(26, 0, 2, s);
            for (let y = 4; y < s; y += 51) {
                c.fillStyle = '#6c7b89';
                c.fillRect(10, y, 15, .8);
            }
            for (let i = 0; i < 635; i++) {
                const x = rnd() ** 2 * 28;
                c.fillStyle = i % 3 ? 'rgba(218,227,229,.61)' : 'rgba(87,105,122,.26)';
                c.fillRect(x, rnd() * s, 1 + rnd() * 5, .9 + rnd() * 3);
            }
            c.fillStyle = 'rgba(214,222,210,.79)';
            c.fillRect(34, 0, 2.6, s);
            c.restore();
        }
        if (type !== 3) {
            c.fillStyle = type === 0 ? '#d0cdb6' : '#bfc5b8';
            for (const y of [10, 138])
                c.fillRect(126, y, 4, 57);
        }
        else {
            c.fillStyle = '#d4d7c6';
            for (let x = 43; x < 215; x += 23)
                c.fillRect(x, 73, 10, 54);
        }
    }
    if (type !== 3) {
        c.strokeStyle = 'rgba(25,38,51,.70)';
        c.lineWidth = 1.25;
        c.beginPath();
        c.moveTo(39, 170);
        c.lineTo(72, 181);
        c.lineTo(79, 178);
        c.lineTo(91, 190);
        c.stroke();
    }
    c.restore();
}
let asphaltMap;
function pavementSheet() {
    if (asphaltMap)
        return asphaltMap;
    const im = document.createElement('canvas');
    im.width = im.height = tileSize * 2;
    const c = im.getContext('2d');
    for (let i = 0; i < 4; i++)
        stampAsphalt(c, i % 2 * tileSize, Math.floor(i / 2) * tileSize, i);
    asphaltMap = (0, world_textures_js_1.texture)(im);
    return asphaltMap;
}
function addRegionalBridgeDeck(parent, x) {
    const g = new THREE.BufferGeometry(), d = data(), zRows = [54, 63, 73.5, 84, 93];
    const left = 1 / (2 * tileSize), right = (tileSize - 1) / (2 * tileSize);
    for (let j = 1; j < zRows.length; j++) {
        const a = zRows[j - 1], b = zRows[j], ay = (0, world_expansion_layout_js_1.bridgeHeight)(x, a) + .007, by = (0, world_expansion_layout_js_1.bridgeHeight)(x, b) + .007;
        const i = d.position.length / 3;
        d.position.push(x - 7.15, ay, a, x + 7.15, ay, a, x - 7.15, by, b, x + 7.15, by, b);
        d.uv.push(left, 1 - left, right, 1 - left, left, 1 - right, right, 1 - right);
        d.index.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(d.position, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(d.uv, 2));
    g.setIndex(d.index);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: pavementSheet(), color: groundTint }));
    mesh.name = 'Асфальт мостового пролёта';
    parent.add(mesh);
}
function junctions() {
    const all = [...world_expansion_layout_js_1.expansionRoads, ...region_layout_js_1.regionRoads], vertical = all.filter(r => r.x1 === r.x2);
    const seen = new Map();
    for (const h of all)
        if (h.z1 === h.z2)
            for (const v of vertical) {
                if (!region_layout_js_1.regionRoads.includes(h) && !region_layout_js_1.regionRoads.includes(v))
                    continue;
                if (v.x1 < h.x1 || v.x1 > h.x2 || h.z1 < v.z1 || h.z1 > v.z2)
                    continue;
                const key = v.x1 + '/' + h.z1, j = seen.get(key);
                if (j) {
                    j.w = Math.max(j.w, v.width + shoulder * 2);
                    j.d = Math.max(j.d, h.width + shoulder * 2);
                }
                else
                    seen.set(key, { x: v.x1, z: h.z1, w: v.width + shoulder * 2, d: h.width + shoulder * 2 });
            }
    return [...seen.values()];
}
function roads(parent) {
    const mat = new THREE.MeshBasicMaterial({ map: pavementSheet(), color: groundTint });
    const cells = new Map();
    function quad(x0, z0, x1, z1, u0, v0, u1, v1, tile, horizontal) {
        const key = Math.floor((x0 + x1) / 210) + '/' + Math.floor((z0 + z1) / 210);
        let d = cells.get(key);
        if (!d) {
            d = data();
            cells.set(key, d);
        }
        const i = d.position.length / 3, y = -.009;
        d.position.push(x0, y, z0, x1, y, z0, x0, y, z1, x1, y, z1);
        d.index.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
        const atlas = (u, v) => { d.uv.push((tile % 2 + (1 + u * (tileSize - 2)) / tileSize) / 2, 1 - (Math.floor(tile / 2) + (1 + v * (tileSize - 2)) / tileSize) / 2); };
        if (horizontal) {
            atlas(u0, v0);
            atlas(u0, v1);
            atlas(u1, v0);
            atlas(u1, v1);
        }
        else {
            atlas(u0, v0);
            atlas(u1, v0);
            atlas(u0, v1);
            atlas(u1, v1);
        }
    }
    const junction = junctions();
    for (const j of junction)
        quad(j.x - j.w / 2, j.z - j.d / 2, j.x + j.w / 2, j.z + j.d / 2, 0, 0, 1, 1, 2, false);
    for (const r of region_layout_js_1.regionRoads) {
        const h = r.z1 === r.z2, axis = h ? r.z1 : r.x1, start = h ? r.x1 : r.z1, end = h ? r.x2 : r.z2;
        const cuts = junction.filter(j => (h ? j.z === axis && j.x >= start && j.x <= end : j.x === axis && j.z >= start && j.z <= end)).map(j => {
            const p = h ? j.x : j.z, half = .5 * (h ? j.w : j.d);
            return [p - half, p + half];
        });
        if (!h && world_expansion_layout_js_1.bridges.some(b => b.x === axis) && start < 93 && end > 54)
            cuts.push([54, 93]);
        cuts.sort((a, b) => a[0] - b[0]);
        let cursor = start;
        const signalled = region_layout_js_1.regionSignals.filter(s => h ? s.z === axis : s.x === axis).map(s => h ? s.x : s.z);
        function lay(lo, hi) {
            if (hi - lo < .008)
                return;
            const half = r.width * .5 + shoulder, motif = 11.4, count = Math.max(1, Math.round((hi - lo) / motif));
            for (let n = 0; n < count; n++) {
                const a = lo + n * (hi - lo) / count, b = lo + (n + 1) * (hi - lo) / count;
                const signalCrosswalk = (n === 0 && signalled.some(p => Math.abs(lo - p) < 10)) || (n === count - 1 && signalled.some(p => Math.abs(hi - p) < 10));
                const sideStreetCrosswalk = (n === 0 || n === count - 1) && count > 4 && r.width <= 10 && Math.abs(Math.round(lo + axis) % 3) === 0;
                const zebra = signalCrosswalk || sideStreetCrosswalk;
                const tile = zebra ? 3 : r.width >= 10 ? 0 : 1;
                if (h)
                    quad(a, axis - half, b, axis + half, 0, 0, 1, 1, tile, true);
                else
                    quad(axis - half, a, axis + half, b, 0, 0, 1, 1, tile, false);
            }
        }
        for (const [lo, hi] of cuts) {
            if (lo > cursor)
                lay(cursor, Math.min(lo, end));
            cursor = Math.max(cursor, hi);
        }
        if (cursor < end)
            lay(cursor, end);
    }
    for (const d of cells.values())
        addMesh(parent, d, mat, 'Окружные дороги — мокрый асфальт');
}
function addRegionalGround(parent) { ground(parent); roads(parent); }
