"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markColors = exports.markNames = void 0;
exports.route = route;
exports.routeTo = routeTo;
exports.advanceRoute = advanceRoute;
exports.validMarks = validMarks;
const world_layout_js_1 = require("./world-layout.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const region_layout_js_1 = require("./region-layout.js");
exports.markNames = { car: 'Машина', place: 'Интересное место', return: 'Вернуться позже' };
exports.markColors = { car: '#89c9f5', place: '#f5b96d', return: '#d8a5db' };
let work;
const pitch = 1.5, { minX, minZ, maxX, maxZ } = world_expansion_layout_js_1.cityLimits;
const originX = region_layout_js_1.innerLimits.minX + Math.floor((minX - region_layout_js_1.innerLimits.minX) / pitch) * pitch;
const originZ = region_layout_js_1.innerLimits.minZ + Math.floor((minZ - region_layout_js_1.innerLimits.minZ) / pitch) * pitch;
const nets = new Map();
function xy(i, w) { return { x: originX + i % w * pitch, z: originZ + Math.floor(i / w) * pitch }; }
function network(mode) {
    let net = nets.get(mode);
    if (net)
        return net;
    const width = Math.floor((maxX - originX) / pitch) + 1, height = Math.floor((maxZ - originZ) / pitch) + 1, open = new Uint8Array(width * height);
    const paint = (x, z, w, d, value) => {
        const x0 = Math.max(0, Math.ceil((x - w / 2 - originX) / pitch)), x1 = Math.min(width - 1, Math.floor((x + w / 2 - originX) / pitch));
        const z0 = Math.max(0, Math.ceil((z - d / 2 - originZ) / pitch)), z1 = Math.min(height - 1, Math.floor((z + d / 2 - originZ) / pitch));
        if (x0 > x1)
            return;
        for (let row = z0; row <= z1; row++)
            open.fill(value, row * width + x0, row * width + x1 + 1);
    };
    if (mode === 'walk')
        paint((minX + maxX) / 2, (minZ + maxZ) / 2, maxX - minX - 1, maxZ - minZ - 1, 1);
    else {
        for (const r of [...world_expansion_layout_js_1.expansionRoads, ...region_layout_js_1.regionRoads])
            paint((r.x1 + r.x2) / 2, (r.z1 + r.z2) / 2, Math.abs(r.x2 - r.x1) + r.width - 2.6, Math.abs(r.z2 - r.z1) + r.width - 2.6, 1);
        for (const apron of region_layout_js_1.regionAprons)
            paint(apron.x, apron.z, apron.w - 2.6, apron.d - 2.6, 1);
        for (const [x, z, w, d] of [[-41, 36, 17, 18], [39, -15, 13, 36], [30, 29, 19, 8], [13, -40, 14, 13]])
            paint(x, z, w, d, 1);
    }
    const pad = mode === 'walk' ? .80 : 1.75;
    for (const b of [...world_layout_js_1.obstacles, ...world_layout_js_1.lowBarriers])
        paint(b.x, b.z, b.w + pad * 2, b.d + pad * 2, 0);
    if (mode === 'drive')
        paint(world_layout_js_1.steps.x, (world_layout_js_1.steps.z1 + world_layout_js_1.steps.z2) / 2, world_layout_js_1.steps.width + 1, world_layout_js_1.steps.z2 - world_layout_js_1.steps.z1, 0);
    const root = nearest({ width, height, open }, { x: -50, z: 30 });
    if (root >= 0) {
        const queue = new Int32Array(open.length);
        let head = 0, tail = 1;
        queue[0] = root;
        open[root] = 2;
        const add = (i) => {
            if (open[i] === 1) {
                open[i] = 2;
                queue[tail++] = i;
            }
        };
        while (head < tail) {
            const i = queue[head++], column = i % width;
            if (column > 0)
                add(i - 1);
            if (column < width - 1)
                add(i + 1);
            add(i - width);
            add(i + width);
        }
        for (let i = 0; i < open.length; i++)
            open[i] = Number(open[i] === 2);
    }
    net = { width, height, open };
    nets.set(mode, net);
    return net;
}
function nearest(net, p) {
    const col = Math.max(0, Math.min(net.width - 1, Math.round((p.x - originX) / pitch))), row = Math.max(0, Math.min(net.height - 1, Math.round((p.z - originZ) / pitch)));
    let winner = -1, best = Infinity;
    const visit = (x, z) => {
        if (x < 0 || z < 0 || x >= net.width || z >= net.height)
            return;
        const i = z * net.width + x;
        if (!net.open[i])
            return;
        const dist = (originX + x * pitch - p.x) ** 2 + (originZ + z * pitch - p.z) ** 2;
        if (dist < best) {
            winner = i;
            best = dist;
        }
    };
    for (let r = 0; r <= Math.max(net.width, net.height); r++) {
        for (let x = col - r; x <= col + r; x++) {
            visit(x, row - r);
            if (r)
                visit(x, row + r);
        }
        for (let z = row - r + 1; z < row + r; z++) {
            visit(col - r, z);
            if (r)
                visit(col + r, z);
        }
        if (best < (Math.max(0, r - .72) * pitch) ** 2 || r === 0 && best === 0)
            break;
    }
    return winner;
}
class Queue {
    data = [];
    get count() { return this.data.length; }
    push(id, score) {
        const e = { id, score };
        let i = this.data.length;
        this.data.push(e);
        while (i > 0) {
            const j = (i - 1) >> 1;
            if (this.data[j].score <= score)
                break;
            this.data[i] = this.data[j];
            i = j;
        }
        this.data[i] = e;
    }
    pop() {
        const first = this.data[0].id, last = this.data.pop();
        if (this.data.length) {
            let i = 0;
            while (i * 2 + 1 < this.data.length) {
                let j = i * 2 + 1;
                if (j + 1 < this.data.length && this.data[j + 1].score < this.data[j].score)
                    j++;
                if (this.data[j].score >= last.score)
                    break;
                this.data[i] = this.data[j];
                i = j;
            }
            this.data[i] = last;
        }
        return first;
    }
}
const directions = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
function route(from, to, mode) {
    const net = network(mode), { width: w, height: h, open } = net;
    const a = nearest(net, from), b = nearest(net, to);
    if (a < 0 || b < 0)
        return [];
    work ??= { prev: new Int32Array(open.length), cost: new Float32Array(open.length), visited: new Uint32Array(open.length), round: 0 };
    if (work.round > 0xfffffffc) {
        work.visited.fill(0);
        work.round = 0;
    }
    const seen = work.round += 2, done = seen + 1, { prev, cost, visited } = work;
    visited[a] = seen;
    prev[a] = -1;
    const queue = new Queue();
    queue.push(a, 0);
    cost[a] = 0;
    const bx = b % w, bz = Math.floor(b / w);
    const weight = Math.hypot(a % w - bx, Math.floor(a / w) - bz) > 160 ? 1.12 : 1;
    while (queue.count) {
        const i = queue.pop();
        if (i === b)
            break;
        if (visited[i] === done)
            continue;
        visited[i] = done;
        const x = i % w, z = Math.floor(i / w);
        for (const [dx, dz] of directions) {
            const cx = x + dx, cz = z + dz, j = cz * w + cx;
            if (cx < 0 || cx >= w || cz < 0 || cz >= h || !open[j] || visited[j] === done)
                continue;
            if (dx && dz && (!open[i + dx] || !open[i + dz * w]))
                continue;
            const c = cost[i] + (dx && dz ? 1.414214 : 1);
            if (visited[j] === seen && c >= cost[j])
                continue;
            visited[j] = seen;
            cost[j] = c;
            prev[j] = i;
            const rx = Math.abs(bx - cx), rz = Math.abs(bz - cz);
            queue.push(j, c + (Math.max(rx, rz) + .4142135 * Math.min(rx, rz)) * weight);
        }
    }
    if (visited[b] !== seen && visited[b] !== done)
        return [];
    const nodes = [b];
    for (let i = b; i !== a;) {
        i = prev[i];
        nodes.push(i);
    }
    nodes.reverse();
    const result = [xy(a, w)];
    let lastDirection = 0;
    for (let k = 1; k < nodes.length; k++) {
        const delta = nodes[k] - nodes[k - 1];
        if (k > 1 && delta !== lastDirection)
            result.push(xy(nodes[k - 1], w));
        lastDirection = delta;
    }
    if (a !== b)
        result.push(xy(b, w));
    return result;
}
const length = (p) => p.reduce((sum, v, i) => i ? sum + Math.hypot(v.x - p[i - 1].x, v.z - p[i - 1].z) : 0, 0);
function routeTo(start, end, mode) {
    const path = route(start, end, mode);
    const parking = path.at(-1);
    const lastMile = mode === 'drive' && parking && Math.hypot(parking.x - end.x, parking.z - end.z) > 3 ? route(parking, end, 'walk') : [];
    return { path, lastMile, metres: Math.round(length(path)), walkMetres: Math.round(length(lastMile)) };
}
function advanceRoute(leg, at, mode) {
    if (leg.path.length < 2)
        return null;
    let best = (mode === 'drive' ? 5 : 3) ** 2, found = -1, point;
    for (let i = 1; i < leg.path.length; i++) {
        const a = leg.path[i - 1], b = leg.path[i], dx = b.x - a.x, dz = b.z - a.z, span = dx * dx + dz * dz;
        if (!span)
            continue;
        const t = Math.max(0, Math.min(1, ((at.x - a.x) * dx + (at.z - a.z) * dz) / span));
        const x = a.x + t * dx, z = a.z + t * dz, gap = (at.x - x) ** 2 + (at.z - z) ** 2;
        if (gap < best) {
            best = gap;
            found = i;
            point = { x, z };
        }
    }
    if (!point || found < 0)
        return null;
    const path = [point, ...leg.path.slice(found)];
    return { ...leg, path, metres: Math.round(length(path)) };
}
function validMarks(input) {
    if (!Array.isArray(input))
        return [];
    const saved = [], ids = new Set();
    for (const m of input) {
        if (!m || typeof m.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(m.id) || ids.has(m.id))
            continue;
        if (!Object.hasOwn(exports.markNames, m.kind) || !Number.isFinite(m.x) || !Number.isFinite(m.z))
            continue;
        if (m.x < minX || m.x > maxX || m.z < minZ || m.z > maxZ)
            continue;
        ids.add(m.id);
        saved.push({ id: m.id, kind: m.kind, x: m.x, z: m.z, ...(typeof m.label==='string' ? {label:m.label.trim().slice(0,64)} : {}) });
    }
    return saved.slice(-80);
}
