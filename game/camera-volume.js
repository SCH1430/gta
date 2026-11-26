"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cameraClearance = cameraClearance;
exports.snowRoofAt = snowRoofAt;
const static_box_index_js_1 = require("./static-box-index.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const fixtures_js_1 = require("./fixtures.js");
const collision_js_1 = require("./collision.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const volume = (o, bottom, top) => ({ ...o, bottom, top, fixtureId: (0, fixtures_js_1.fixtureAt)(o.x, o.z)?.id });
const overhead = (x, z, w, d, bottom, top) => ({ x, z, w, d, bottom, top });
const buildingsByHeight = new Map([
    ...world_layout_js_1.apartments.map(a => [a, a.h + .15]),
    [world_layout_js_1.buildings.garage, 4.39], [world_layout_js_1.buildings.garage2, 4.39], [world_layout_js_1.buildings.shed, 7.75],
    [world_layout_js_1.buildings.power, 4.97], [world_layout_js_1.buildings.dispatcher, 3.49],
    ...[world_layout_js_1.buildings.kiosk, world_layout_js_1.buildings.booth, world_layout_js_1.buildings.booth2, world_layout_js_1.buildings.booth3].map(a => [a, 2.88])
]);
function height(o) {
    const h = buildingsByHeight.get(o);
    if (h !== undefined)
        return h;
    if (o.h !== undefined)
        return o.h;
    if (world_layout_js_1.benches.some(p => p.x === o.x && p.z === o.z))
        return .95;
    if (o.z === 13)
        return 5.84;
    if (o.x === -21.6 || o.x === -17.5)
        return 4.46;
    if (o.z === 20.47)
        return 1.38;
    if (o.z === 57)
        return 1.5;
    return o.z === 42.3 ? 2.03 : 2.65;
}
const solids = [
    ...world_expansion_layout_js_1.expansionOverheads,
    ...[world_layout_js_1.buildings.garage, world_layout_js_1.buildings.garage2].flatMap(world_layout_js_1.garageRoofSections),
    ...market_quarter_layout_js_1.quarterFloors, ...market_quarter_layout_js_1.quarterRoofs, ...market_quarter_layout_js_1.quarterSupports, ...market_quarter_layout_js_1.quarterWalls,
    ...world_layout_js_1.obstacles.map(o => volume(o, -.1, height(o))), ...world_layout_js_1.lowBarriers.map(o => volume(o, -.1, .63)),
    overhead(-8.15, 16.47, 8.79, 1.33, 3.37, 4.075), overhead(-46.1, 38.83, 1.32, .23, 1.915, 3.14),
    overhead(-19.56, 10, 4.35, 7.16, 4.10, 6.27), overhead(63, 13, 102, 7.83, 5.64, 7.70),
    overhead(13.8, 22, 5.37, 2.58, 2.62, 2.98),
    ...world_layout_js_1.apartments.map(a => overhead(a.x - a.w * .22, a.z + a.d * .5 + .57, 2.97, 1.43, 2.47, 2.76)),
    world_layout_js_1.spektrCanopy, world_layout_js_1.spektrBlade,
    ...[world_layout_js_1.buildings.booth2, world_layout_js_1.buildings.booth3].map(a => overhead(a.x, a.z + a.d * .5 + .78, a.w + .62, 2.12, 2.44, 2.99))
];
const nearCamera = (0, static_box_index_js_1.indexStaticBoxes)(solids, world_layout_js_1.bounds, s => ({ minX: s.x - s.w / 2, maxX: s.x + s.w / 2, minZ: s.z - s.d / 2, maxZ: s.z + s.d / 2 }), 24, 16);
// Use the same canopy and bridge spans as camera collision. Open-sided roofs shelter the space below.
function snowRoofAt(x,z) {
    let roof = -Infinity;
    for (const box of nearCamera(x,z,x,z)) {
        if (box.w < 1 || box.d < 1 || box.top < 1.9 || box.fixtureId) continue;
        if (Math.abs(x-box.x) < box.w*.5 && Math.abs(z-box.z) < box.d*.5)
            roof = Math.max(roof,box.top);
    }
    return roof;
}
function boxHit(x, y, z, dx, dy, dz, hx, hy, hz, length) {
    let near = 0, far = length;
    if (Math.abs(dx) < 1e-8) {
        if (Math.abs(x) > hx)
            return length;
    }
    else {
        const a = (-hx - x) / dx, b = (hx - x) / dx;
        near = Math.max(near, Math.min(a, b));
        far = Math.min(far, Math.max(a, b));
    }
    if (Math.abs(dy) < 1e-8) {
        if (Math.abs(y) > hy)
            return length;
    }
    else {
        const a = (-hy - y) / dy, b = (hy - y) / dy;
        near = Math.max(near, Math.min(a, b));
        far = Math.min(far, Math.max(a, b));
    }
    if (Math.abs(dz) < 1e-8) {
        if (Math.abs(z) > hz)
            return length;
    }
    else {
        const a = (-hz - z) / dz, b = (hz - z) / dz;
        near = Math.max(near, Math.min(a, b));
        far = Math.min(far, Math.max(a, b));
    }
    return far >= near ? Math.max(0, near - .018) : length;
}
function cameraClearance(start, dir, range, radius, cars, ignore, tram) {
    let end = range;
    const dx = dir.x, dy = dir.y, dz = dir.z;
    const finishX = start.x + dx * range, finishZ = start.z + dz * range;
    for (const s of nearCamera(Math.min(start.x, finishX) - radius, Math.min(start.z, finishZ) - radius, Math.max(start.x, finishX) + radius, Math.max(start.z, finishZ) + radius)) {
        const hx = s.w * .5 + radius, hz = s.d * .5 + radius, x = start.x - s.x, z = start.z - s.z;
        if (Math.abs(x) > hx + end || Math.abs(z) > hz + end)
            continue;
        if (s.fixtureId && (0, collision_js_1.fixtureBrokenFor)(cars, s.fixtureId))
            continue;
        end = boxHit(x, start.y - (s.bottom + s.top) * .5, z, dx, dy, dz, hx, (s.top - s.bottom) * .5 + radius, hz, end);
    }
    for (const gate of (0, collision_js_1.closedCityGates)(cars)) {
        if (Math.abs(start.x - gate.x) > end + gate.w || Math.abs(start.z - gate.z) > end + gate.d)
            continue;
        const floor = (0, world_layout_js_1.groundHeight)(gate.x, gate.z);
        end = boxHit(start.x - gate.x, start.y - floor - gate.h * .5, start.z - gate.z, dx, dy, dz, gate.w * .5 + radius, gate.h * .5 + radius, gate.d * .5 + radius, end);
    }
    for (const c of cars) {
        if (c.id === ignore)
            continue;
        const x = start.x - c.x, z = start.z - c.z;
        if (x * x + z * z > (end + 3.5) ** 2)
            continue;
        const s = vehicle_cabin_js_1.specs[c.kind], co = Math.cos(c.yaw), si = Math.sin(c.yaw);
        end = boxHit(x * co - z * si, start.y - c.y - s.roof * .5, x * si + z * co - (s.front + s.rear) * .5, dx * co - dz * si, dy, dx * si + dz * co, s.w + radius, s.roof * .5 + radius, (s.rear - s.front) * .5 + radius, end);
    }
    if (tram?.visible) {
        const x = start.x - tram.x, z = start.z - tram.z;
        if (x * x + z * z < (end + 5.8) ** 2) {
            const co = Math.cos(tram.yaw), si = Math.sin(tram.yaw);
            end = boxHit(x * co - z * si, start.y - 1.67, x * si + z * co, dx * co - dz * si, dy, dx * si + dz * co, 1.26 + radius, 1.65 + radius, 5.37 + radius, end);
        }
    }
    for (let t = .16; t < end + .16; t += .16) {
        const at = Math.min(t, end);
        if (start.y + dy * at < (0, world_layout_js_1.groundHeight)(start.x + dx * at, start.z + dz * at) + radius) {
            end = Math.max(0, at - .16);
            break;
        }
    }
    return end;
}
