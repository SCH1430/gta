"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lanes = exports.firstRegionalLane = exports.Lane = exports.lerp = exports.aim = exports.wrapAngle = exports.dist = exports.clamp = void 0;
exports.visible = visible;
exports.redAhead = redAhead;
exports.unsignalledApproach = unsignalledApproach;
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const region_traffic_js_1 = require("./region-traffic.js");
const static_box_index_js_1 = require("./static-box-index.js");
const fixtures_js_1 = require("./fixtures.js");
const world_layout_js_1 = require("./world-layout.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
exports.clamp = clamp;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
exports.dist = dist;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
exports.wrapAngle = wrapAngle;
const aim = (a, b) => Math.atan2(a.x - b.x, a.z - b.z);
exports.aim = aim;
const lerp = (a, b, t) => a + (b - a) * t;
exports.lerp = lerp;
const sightBlocks = (0, static_box_index_js_1.indexStaticBoxes)(world_layout_js_1.obstacles.filter(box => box.w >= .4 || box.d >= .4), world_layout_js_1.bounds, box => ({
    minX: box.x - box.w / 2, minZ: box.z - box.d / 2, maxX: box.x + box.w / 2, maxZ: box.z + box.d / 2
}), 24, 42);
function visible(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z;
    const eyeA = (a.y ?? (0, world_layout_js_1.groundHeight)(a.x, a.z)) + 1.52, eyeB = (b.y ?? (0, world_layout_js_1.groundHeight)(b.x, b.z)) + 1.52;
    if ((0, market_quarter_layout_js_1.quarterBlocksSight)(a.x, eyeA, a.z, b.x, eyeB, b.z))
        return false;
    for (const box of sightBlocks(Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z))) {
        let enter = 0, leave = 1;
        if (Math.abs(dx) < 1e-5) {
            if (Math.abs(a.x - box.x) > box.w / 2)
                continue;
        }
        else {
            const t1 = (box.x - box.w / 2 - a.x) / dx, t2 = (box.x + box.w / 2 - a.x) / dx;
            enter = Math.max(enter, Math.min(t1, t2));
            leave = Math.min(leave, Math.max(t1, t2));
        }
        if (Math.abs(dz) < 1e-5) {
            if (Math.abs(a.z - box.z) > box.d / 2)
                continue;
        }
        else {
            const t1 = (box.z - box.d / 2 - a.z) / dz, t2 = (box.z + box.d / 2 - a.z) / dz;
            enter = Math.max(enter, Math.min(t1, t2));
            leave = Math.min(leave, Math.max(t1, t2));
        }
        if (enter >= leave || leave <= 0.01 || enter >= 0.99)
            continue;
        const top = box.h === undefined ? Infinity : (0, world_layout_js_1.groundHeight)(box.x, box.z) + box.h;
        if (top >= Math.min((0, exports.lerp)(eyeA, eyeB, enter), (0, exports.lerp)(eyeA, eyeB, leave)))
            return false;
    }
    return true;
}
class Lane {
    nodes = [];
    starts = [];
    length = 0;
    constructor(clockwise, loop = world_layout_js_1.roadLoop) {
        const center = { x: (loop[0].x + loop[2].x) / 2, z: (loop[0].z + loop[2].z) / 2 };
        const shift = clockwise ? 1.95 : -1.95;
        const corners = loop.map(p => ({ x: p.x + Math.sign(p.x - center.x) * shift, z: p.z + Math.sign(p.z - center.z) * shift }));
        if (!clockwise)
            corners.reverse();
        const offset = (a, b, n) => { const f = n / (0, exports.dist)(a, b); return { x: (0, exports.lerp)(a.x, b.x, f), z: (0, exports.lerp)(a.z, b.z, f) }; };
        for (let i = 0; i < 4; i++) {
            const c = corners[i], before = offset(c, corners[(i + 3) % 4], 5.2), after = offset(c, corners[(i + 1) % 4], 5.2);
            for (let k = 0; k <= 6; k++) {
                const t = k / 6, u = 1 - t;
                this.nodes.push({ x: u * u * before.x + 2 * t * u * c.x + t * t * after.x, z: u * u * before.z + 2 * t * u * c.z + t * t * after.z });
            }
        }
        for (let i = 0; i < this.nodes.length; i++) {
            this.starts.push(this.length);
            this.length += (0, exports.dist)(this.nodes[i], this.nodes[(i + 1) % this.nodes.length]);
        }
    }
    wrap(s) { return (s % this.length + this.length) % this.length; }
    at(s) {
        s = this.wrap(s);
        let i = this.starts.length - 1;
        while (i > 0 && this.starts[i] > s)
            i--;
        const a = this.nodes[i], b = this.nodes[(i + 1) % this.nodes.length], f = (s - this.starts[i]) / (0, exports.dist)(a, b);
        return { x: (0, exports.lerp)(a.x, b.x, f), z: (0, exports.lerp)(a.z, b.z, f), yaw: (0, exports.aim)(a, b) };
    }
    nearest(p) {
        let s = 0, d2 = Infinity;
        for (let i = 0; i < this.nodes.length; i++) {
            const a = this.nodes[i], b = this.nodes[(i + 1) % this.nodes.length], dx = b.x - a.x, dz = b.z - a.z;
            const f = (0, exports.clamp)(((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
            const gap = (a.x + dx * f - p.x) ** 2 + (a.z + dz * f - p.z) ** 2;
            if (gap < d2) {
                d2 = gap;
                s = this.starts[i] + Math.sqrt(dx * dx + dz * dz) * f;
            }
        }
        return { s, d: Math.sqrt(d2) };
    }
    difference(from, to) {
        return this.wrap(to - from + this.length / 2) - this.length / 2;
    }
}
exports.Lane = Lane;
exports.firstRegionalLane = 2 + world_expansion_layout_js_1.expansionTrafficLoops.length * 2;
exports.lanes = [new Lane(true), new Lane(false), ...[...world_expansion_layout_js_1.expansionTrafficLoops, ...region_traffic_js_1.regionalCircuits].flatMap(loop => [new Lane(true, loop), new Lane(false, loop)])];
function redAhead(p, yaw, elapsed, dark) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (const junction of world_layout_js_1.signalPositions) {
        if (dark?.size && dark.has((0, fixtures_js_1.junctionKey)(junction)))
            continue;
        const dx = junction.x - p.x, dz = junction.z - p.z;
        const along = dx * fx + dz * fz, across = Math.abs(dz * fx - dx * fz);
        if (along > 4.6 && along < 9 && across < 3.3 && !(0, world_layout_js_1.signalGreen)(Math.abs(fx) > .7 ? 'x' : 'z', elapsed))
            return true;
    }
    return false;
}
function unsignalledApproach(car, dark, cars, pedestrians, now, dt) {
    let cross, circuit = '';
    if (dark.size)
        for (const p of world_layout_js_1.signalPositions) {
            const key = (0, fixtures_js_1.junctionKey)(p), dx = p.x - car.x, dz = p.z - car.z;
            if (!dark.has(key) || Math.abs(dx) > 14 || Math.abs(dz) > 14)
                continue;
            const ahead = -dx * Math.sin(car.yaw) - dz * Math.cos(car.yaw), side = Math.abs(dx * Math.cos(car.yaw) - dz * Math.sin(car.yaw));
            if ((ahead > 3.5 && ahead < 13.5 && side < 4.5) || (car.yielding?.circuit === key && dx * dx + dz * dz < 11.3 ** 2)) {
                cross = p;
                circuit = key;
                break;
            }
        }
    if (!cross) {
        if (car.yielding)
            delete car.yielding;
        return { hold: false, limit: Infinity };
    }
    if (car.yielding?.circuit !== circuit)
        car.yielding = { circuit, arrived: now, stopped: 0, released: false };
    const junction = cross, q = car.yielding;
    if (q.released)
        return { hold: false, limit: 3.25 };
    const range = Math.hypot(car.x - junction.x, car.z - junction.z);
    if (range > 8.1)
        return { hold: false, limit: 3.2 };
    if (Math.abs(car.speed) > .12)
        return { hold: true, limit: 0 };
    q.stopped += dt;
    if (q.stopped < .75)
        return { hold: true, limit: 0 };
    const walker = pedestrians.some(p => (p.x - junction.x) ** 2 + (p.z - junction.z) ** 2 < 4.6 ** 2);
    const vehicle = cars.some(o => {
        if (o === car)
            return false;
        const dx = o.x - junction.x, dz = o.z - junction.z;
        if (dx * dx + dz * dz > 10 ** 2)
            return false;
        if (dx * dx + dz * dz < 4.8 ** 2)
            return true;
        const other = o.auto ? o.yielding : undefined;
        if (other?.circuit === circuit)
            return other.released || other.arrived < q.arrived || other.arrived === q.arrived && o.id < car.id;
        const toward = dx * Math.sin(o.yaw) + dz * Math.cos(o.yaw);
        return Math.abs(o.speed) > 1 && toward > 0 && toward < 7;
    });
    q.released = !walker && !vehicle;
    return { hold: !q.released, limit: 3.25 };
}
