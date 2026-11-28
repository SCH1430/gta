"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBrokenFixtures = setBrokenFixtures;
exports.fixtureBrokenFor = fixtureBrokenFor;
exports.bindRepairRig = bindRepairRig;
exports.bindCargoRail = bindCargoRail;
exports.bindCityGates = bindCityGates;
exports.closedCityGates = closedCityGates;
exports.bindMarketTables = bindMarketTables;
exports.bindStreetProps = bindStreetProps;
exports.settledFeet = settledFeet;
exports.headRoom = headRoom;
exports.toWorld = toWorld;
exports.toLocal = toLocal;
exports.clearDisc = clearDisc;
exports.clearPath = clearPath;
exports.walkSlide = walkSlide;
exports.footFloor = footFloor;
exports.hullFits = hullFits;
exports.moveHull = moveHull;
exports.contactPoint = contactPoint;
exports.setTramBody = setTramBody;
exports.tramObstructed = tramObstructed;
exports.vaultRoute = vaultRoute;
exports.narrowGap = narrowGap;
const city_life_layout_js_1 = require("./city-life-layout.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const static_box_index_js_1 = require("./static-box-index.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const fixtures_js_1 = require("./fixtures.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
const vehicle_snow_js_1 = require("./vehicle-snow.js");
const { fenceDamage, fenceFootprint } = require("./market-fence.js");
const skin = .001;
function shape(points) {
    const normals = points.map((p, i) => {
        const q = points[(i + 1) % points.length], dx = q.x - p.x, dz = q.z - p.z, l = Math.hypot(dx, dz);
        return { x: dz / l, z: -dx / l };
    });
    const xs = points.map(p => p.x), zs = points.map(p => p.z);
    return { points, normals, minX: Math.min(...xs), minZ: Math.min(...zs), maxX: Math.max(...xs), maxZ: Math.max(...zs) };
}
function rect({ x, z, w, d }) {
    return shape([{ x: x - w / 2, z: z - d / 2 }, { x: x + w / 2, z: z - d / 2 }, { x: x + w / 2, z: z + d / 2 }, { x: x - w / 2, z: z + d / 2 }]);
}
const walls = world_layout_js_1.obstacles.map(box => {
    const s = rect(box);
    s.fixture = (0, fixtures_js_1.fixtureAt)(box.x, box.z);
    if (s.fixture || box.h !== undefined && box.h > 1.8 && Math.min(box.w, box.d) < .38)
        s.surface = 'metal';
    if (box.h !== undefined)
        s.top = (0, world_layout_js_1.groundHeight)(box.x, box.z) + box.h;
    return s;
});
const localWalls = (0, static_box_index_js_1.indexStaticBoxes)(walls, world_layout_js_1.bounds, s => s, 12, 8);
const quarterBoxes = [...market_quarter_layout_js_1.quarterVolumes.floors.map(s => ({ s, floor: true })), ...market_quarter_layout_js_1.quarterVolumes.solid.map(s => ({ s, floor: false }))].map(({ s, floor }) => ({
    ...rect(s), bottom: s.bottom, top: s.top, floor
}));
const localQuarter = (0, static_box_index_js_1.indexStaticBoxes)(quarterBoxes, world_layout_js_1.bounds, s => s, 7, 4);
const states = new WeakMap();
function setBrokenFixtures(cars, broken) { states.set(cars, broken); }
function fixtureBrokenFor(cars, id) { return !!states.get(cars)?.[id]; }
const repairBodies = new WeakMap();
function bindRepairRig(cars, pose) {
    if (!pose) {
        repairBodies.delete(cars);
        return;
    }
    const previous = repairBodies.get(cars);
    if (previous && previous.x === pose.x && previous.z === pose.z)
        return;
    const corners = [[-.93, -2.15], [.93, -2.15], [.93, 2.15], [-.93, 2.15]];
    repairBodies.set(cars, { x: pose.x, z: pose.z, body: shape(corners.map(([x, z]) => toWorld(pose, x, z))) });
}
const freightShapes = new WeakMap();
const freightGateCache = new WeakMap();
function bindCargoRail(cars, poses, gates) {
    if (!poses.length && !gates.length) {
        freightShapes.delete(cars);
        return;
    }
    if (freightShapes.get(cars)?.poseList === poses)
        return;
    const add = (b) => Object.assign(rect(b), { top: b.top, surface: 'metal' });
    const gateShape = (g) => {
        const known = freightGateCache.get(g);
        if (known)
            return known;
        const result = add(g);
        freightGateCache.set(g, result);
        return result;
    };
    freightShapes.set(cars, { poseList: poses, bodies: poses.filter(p => !p.inShed).map(add), gates: gates.map(gateShape) });
}
const gateShapes = new Map(city_life_layout_js_1.serviceGates.map(g => [g.id, { ...rect(g), surface: 'metal' }]));
const openedGateSets = new WeakMap();
const closedSets = Array.from({ length: 1 << city_life_layout_js_1.serviceGates.length }, (_, mask) => city_life_layout_js_1.serviceGates.filter((_, i) => !(mask & (1 << i))));
function bindCityGates(cars, open) { openedGateSets.set(cars, open); }
function closedCityGates(cars) {
    const open = openedGateSets.get(cars);
    if (!open?.size)
        return city_life_layout_js_1.serviceGates;
    let mask = 0;
    for (const [index, gate] of city_life_layout_js_1.serviceGates.entries())
        if (open.has(gate.id))
            mask |= 1 << index;
    return closedSets[mask];
}
const tables = new WeakMap();
const tableCache = new WeakMap();
function bindMarketTables(cars, layout) {
    let list = tableCache.get(layout);
    if (!list) {
        list = layout.map(b => { const s = rect(b); s.top = (0, world_layout_js_1.groundHeight)(b.x, b.z) + b.h; return s; });
        tableCache.set(layout, list);
    }
    tables.set(cars, list);
}
const contents = new WeakMap();
const fallenFeet = new WeakMap();
const padCache = new Map();
function bindStreetProps(cars, props) { contents.set(cars, props); }
function settledFeet(cars, broken, now) {
    const previous = fallenFeet.get(cars) ?? [], next = [];
    for (const [id, f] of Object.entries(broken)) {
        const pole = fixtures_js_1.fixturesById.get(id);
        if (!pole || now - f.at < 1)
            continue;
        let pad = padCache.get(id);
        if (!pad) {
            pad = rect({ x: pole.x, z: pole.z, w: .51, d: .51 });
            pad.top = (0, world_layout_js_1.groundHeight)(pole.x, pole.z) + .27;
            padCache.set(id, pad);
        }
        if (previous.includes(pad) || !cars.some(c => Math.abs(c.x - pole.x) < 3 && Math.abs(c.z - pole.z) < 3 && discDistance(pole, carShape(c)).distance < .38))
            next.push(pad);
    }
    fallenFeet.set(cars, next);
}
const propShapes = new WeakMap();
function propShape(p) {
    const cached = propShapes.get(p), damaged = p.kind === 'picket' && fenceDamage(p);
    if (cached && cached.x === p.x && cached.z === p.z && cached.damaged === damaged)
        return cached.s;
    const bounds = damaged ? fenceFootprint(p, damaged) : p;
    const s = rect(bounds);
    s.prop = p;
    s.surface = p.kind === 'cart' || p.kind === 'container' ? 'metal' : 'wood';
    s.top = (0, world_layout_js_1.groundHeight)(p.x, p.z) + bounds.h;
    propShapes.set(p, { x: p.x, z: p.z, damaged, s });
    return s;
}
function headRoom(x, z, y = 0) {
    if (Math.abs(x - vehicle_road_js_1.canopy.x) < vehicle_road_js_1.canopy.w / 2 + .02 && Math.abs(z - vehicle_road_js_1.canopy.z) < vehicle_road_js_1.canopy.d / 2 + .02)
        return vehicle_road_js_1.canopy.bottom;
    if (Math.abs(x + 19.55) < 2.17 && Math.abs(z - 10) < 3.58)
        return 4.1;
    let ceiling = Infinity;
    if (x >= -2.5 && x <= 14.45 && z >= -8.9 && z <= 92.42)
        for (const s of localQuarter(x, z, x, z)) {
            if (s.bottom > y + .06 && x > s.minX && x < s.maxX && z > s.minZ && z < s.maxZ)
                ceiling = Math.min(ceiling, s.bottom);
        }
    return ceiling;
}
const canopyPosts = [-1, 1].map(side => rect({ x: vehicle_road_js_1.canopy.x + side * (vehicle_road_js_1.canopy.w / 2 + .04), z: vehicle_road_js_1.canopy.z + .78, w: .085, d: .09 }));
const canopyRoof = rect(vehicle_road_js_1.canopy);
const midX = (world_layout_js_1.bounds.minX + world_layout_js_1.bounds.maxX) / 2, midZ = (world_layout_js_1.bounds.minZ + world_layout_js_1.bounds.maxZ) / 2;
const edgeW = world_layout_js_1.bounds.maxX - world_layout_js_1.bounds.minX + 16, edgeD = world_layout_js_1.bounds.maxZ - world_layout_js_1.bounds.minZ + 16;
const edges = [
    { x: world_layout_js_1.bounds.minX - 4, z: midZ, w: 8, d: edgeD }, { x: world_layout_js_1.bounds.maxX + 4, z: midZ, w: 8, d: edgeD },
    { x: midX, z: world_layout_js_1.bounds.minZ - 4, w: edgeW, d: 8 }, { x: midX, z: world_layout_js_1.bounds.maxZ + 4, w: edgeW, d: 8 }
].map(rect);
const barriers = world_layout_js_1.lowBarriers.map(rect);
const packedSnow = vehicle_snow_js_1.impactSnowbanks.map(b => ({ ...rect(b), surface: 'snow', top: (0, world_layout_js_1.groundHeight)(b.x, b.z) + b.h }));
const stair = rect({ x: -19.55, z: 10, w: 3.1, d: 14 });
const cargoStairs = rect({ x: cargo_rail_js_1.cargoFootbridge.x, z: (cargo_rail_js_1.cargoFootbridge.south + cargo_rail_js_1.cargoFootbridge.north) * .5,
    w: cargo_rail_js_1.cargoFootbridge.halfWidth * 2, d: cargo_rail_js_1.cargoFootbridge.south - cargo_rail_js_1.cargoFootbridge.north });
function toWorld(c, x, z) {
    const co = Math.cos(c.yaw), si = Math.sin(c.yaw);
    return { x: c.x + x * co + z * si, z: c.z - x * si + z * co };
}
function toLocal(c, p) {
    const co = Math.cos(c.yaw), si = Math.sin(c.yaw), dx = p.x - c.x, dz = p.z - c.z;
    return { x: dx * co - dz * si, z: dx * si + dz * co };
}
function footprint(c, pose = c) {
    const { halfWidth: w, front, rear } = (0, vehicle_cabin_js_1.carCabin)(c.kind), f = front - (c.kind === 'utility' ? .41 : .06), r = rear + .06;
    const hw = w + .03, corner = c.kind === 'van' || c.kind === 'pickup' || c.kind === 'towtruck' || c.kind === 'utility' ? .18 : c.kind === 'coupe' ? .38 : .31;
    const offsets = [[-hw + corner, f], [hw - corner, f], [hw, f + corner * 1.38], [hw, r - corner],
        [hw - corner, r], [-hw + corner, r], [-hw, r - corner], [-hw, f + corner * 1.38]];
    const s = shape(offsets.map(([x, z]) => toWorld(pose, x, z)));
    s.car = c;
    return s;
}
const carCache = new WeakMap();
function carShape(c) {
    const o = carCache.get(c);
    if (o && c.x === o.x && c.z === o.z && c.yaw === o.yaw)
        return o.s;
    const s = footprint(c);
    carCache.set(c, { x: c.x, z: c.z, yaw: c.yaw, s });
    return s;
}
function candidates(a, b, r, y, cars, ignore, vehicle = false, alsoIgnore) {
    const minX = Math.min(a.x, b.x) - r, maxX = Math.max(a.x, b.x) + r, minZ = Math.min(a.z, b.z) - r, maxZ = Math.max(a.z, b.z) + r;
    const list = [];
    const overlaps = (s) => s.maxX >= minX && s.minX <= maxX && s.maxZ >= minZ && s.minZ <= maxZ;
    for (const group of [localWalls(minX, minZ, maxX, maxZ), edges])
        for (const s of group)
            if (overlaps(s) && (!s.fixture || !fixtureBrokenFor(cars, s.fixture.id)) && (vehicle || s.top === undefined || y < s.top - .005))
                list.push(s);
    if (maxX >= -2.65 && minX <= 14.46 && maxZ >= -8.85 && minZ <= 92.48) {
        const base = vehicle ? Math.max((0, world_layout_js_1.groundHeight)(a.x, a.z), (0, world_layout_js_1.groundHeight)(b.x, b.z)) : y;
        const roof = base + (vehicle && ignore ? vehicle_cabin_js_1.specs[ignore.kind].roof + .14 : 1.42);
        for (const s of localQuarter(minX, minZ, maxX, maxZ)) {
            if (!overlaps(s) || s.bottom >= roof || s.top <= base + .004)
                continue;
            if (!vehicle && s.floor && s.top <= base + .232)
                continue;
            list.push(s);
        }
    }
    for (const gate of closedCityGates(cars)) {
        const s = gateShapes.get(gate.id);
        if (overlaps(s) && (vehicle || y < gate.h))
            list.push(s);
    }
    for (const s of canopyPosts)
        if (overlaps(s))
            list.push(s);
    for (const s of tables.get(cars) ?? [])
        if (overlaps(s) && (vehicle || y < s.top))
            list.push(s);
    for (const p of contents.get(cars) ?? []) {
        if (p.broken && p.kind !== 'picket' || p.x + p.w / 2 < minX || p.x - p.w / 2 > maxX || p.z + p.d / 2 + p.h < minZ || p.z - p.d / 2 - p.h > maxZ)
            continue;
        const s = propShape(p);
        if (overlaps(s) && (vehicle || y < s.top - .01))
            list.push(s);
    }
    if (vehicle)
        for (const foot of fallenFeet.get(cars) ?? [])
            if (overlaps(foot))
                list.push(foot);
    if (vehicle && ignore && (ignore.kind === 'hatch' ? 1.46 : vehicle_cabin_js_1.specs[ignore.kind].roof + (ignore.kind === 'suv' ? .21 : ignore.kind === 'van' ? .16 : .05)) > vehicle_road_js_1.canopy.bottom && Math.abs(a.x - vehicle_road_js_1.canopy.x) < 5 && Math.abs(a.z - vehicle_road_js_1.canopy.z) < 5) {
        if (overlaps(canopyRoof))
            list.push(canopyRoof);
    }
    const lift = repairBodies.get(cars)?.body;
    if (lift && overlaps(lift))
        list.push(lift);
    const tram = railBodies.get(cars)?.body;
    if (tram && y < 3.45 && overlaps(tram))
        list.push(tram);
    const freight = freightShapes.get(cars);
    if (freight && minZ < 66 && maxZ > 53) {
        for (const wagon of freight.bodies)
            if ((vehicle || y < wagon.top - .005) && overlaps(wagon))
                list.push(wagon);
        if (vehicle)
            for (const gate of freight.gates)
                if (overlaps(gate))
                    list.push(gate);
    }
    for (let i = 0; i < barriers.length; i++) {
        const p = world_layout_js_1.lowBarriers[i], s = barriers[i];
        if (overlaps(s) && (vehicle || y < (0, world_layout_js_1.groundHeight)(p.x, p.z) + .625))
            list.push(s);
    }
    if (vehicle && overlaps(stair))
        list.push(stair);
    if (vehicle && overlaps(cargoStairs))
        list.push(cargoStairs);
    for (const bank of packedSnow)
        if (overlaps(bank) && (vehicle || y < bank.top - .005))
            list.push(bank);
    for (const c of cars)
        if (c !== ignore && c !== alsoIgnore && !c.carriedBy && c.x + 4.1 >= minX && c.x - 4.1 <= maxX && c.z + 4.1 >= minZ && c.z - 4.1 <= maxZ) {
            if (!vehicle && y > c.y + vehicle_cabin_js_1.specs[c.kind].roof + .17)
                continue;
            const s = carShape(c);
            if (overlaps(s))
                list.push(s);
        }
    return list;
}
function discDistance(p, s) {
    let face = -Infinity, faceIndex = 0, d2 = Infinity, dx = 0, dz = 0;
    for (let i = 0; i < s.points.length; i++) {
        const a = s.points[i], b = s.points[(i + 1) % s.points.length], n = s.normals[i], ax = p.x - a.x, az = p.z - a.z;
        const sd = ax * n.x + az * n.z;
        if (sd > face) {
            face = sd;
            faceIndex = i;
        }
        const ex = b.x - a.x, ez = b.z - a.z, f = (0, sim_navigation_js_1.clamp)((ax * ex + az * ez) / (ex * ex + ez * ez), 0, 1);
        const x = ax - f * ex, z = az - f * ez, v = x * x + z * z;
        if (v < d2) {
            dx = x;
            dz = z;
            d2 = v;
        }
    }
    if (face <= 0 || d2 < 1e-14)
        return { distance: face, n: s.normals[faceIndex] };
    const length = Math.sqrt(d2);
    return { distance: length, n: { x: dx / length, z: dz / length } };
}
function sweepDisc(p, dx, dz, r, s) {
    const start = discDistance(p, s), speed2 = dx * dx + dz * dz;
    if (start.distance < r - 1e-6)
        return { t: 0, nx: start.n.x, nz: start.n.z, depth: r - start.distance };
    if (speed2 < 1e-12)
        return null;
    let t = 2, nx = 0, nz = 0;
    for (let i = 0; i < s.points.length; i++) {
        const a = s.points[i], b = s.points[(i + 1) % s.points.length], n = s.normals[i];
        const px = p.x - a.x, pz = p.z - a.z, into = dx * n.x + dz * n.z;
        if (into < -1e-8) {
            const f = (r - px * n.x - pz * n.z) / into;
            if (f >= -1e-8 && f <= 1 && f < t) {
                const ex = b.x - a.x, ez = b.z - a.z, along = (px + f * dx) * ex + (pz + f * dz) * ez;
                if (along >= 0 && along <= ex * ex + ez * ez) {
                    t = Math.max(0, f);
                    nx = n.x;
                    nz = n.z;
                }
            }
        }
        const dot = px * dx + pz * dz, discriminant = dot * dot - speed2 * (px * px + pz * pz - r * r);
        if (dot < 0 && discriminant >= 0) {
            const f = (-dot - Math.sqrt(discriminant)) / speed2;
            if (f >= 0 && f <= 1 && f < t) {
                t = f;
                nx = (px + f * dx) / r;
                nz = (pz + f * dz) / r;
            }
        }
    }
    return t <= 1 ? { t, nx, nz, depth: 0 } : null;
}
function clearDisc(p, r, y, cars, ignore) {
    return candidates(p, p, r, y, cars, ignore).every(s => discDistance(p, s).distance >= r - 1e-5);
}
function clearPath(a, b, r, y, cars, ignore) {
    return candidates(a, b, r, y, cars, ignore).every(s => !sweepDisc(a, b.x - a.x, b.z - a.z, r, s));
}
function sweepPerson(p, dx, dz, other, r) {
    const x = p.x - other.x, z = p.z - other.z, d2 = x * x + z * z;
    if (d2 < r * r) {
        const d = Math.sqrt(d2);
        return { t: 0, nx: d > .0001 ? x / d : 1, nz: d > .0001 ? z / d : 0, depth: r - d };
    }
    const dot = x * dx + z * dz, length2 = dx * dx + dz * dz;
    if (dot >= 0 || length2 < 1e-12)
        return null;
    const disc = dot * dot - length2 * (d2 - r * r);
    if (disc < 0)
        return null;
    const t = (-dot - Math.sqrt(disc)) / length2;
    return t >= 0 && t <= 1 ? { t, nx: (x + dx * t) / r, nz: (z + dz * t) / r, depth: 0 } : null;
}
function walkSlide(p, dx, dz, r, y, cars, people = []) {
    const pos = { x: p.x, z: p.z };
    for (let pass = 0; pass < 4; pass++) {
        let hit = null;
        const end = { x: pos.x + dx, z: pos.z + dz };
        for (const other of people) {
            if (other === p || other.y !== undefined && Math.abs(other.y - y) > 1.4 || Math.abs(other.x - pos.x) > 1 + Math.abs(dx) || Math.abs(other.z - pos.z) > 1 + Math.abs(dz))
                continue;
            const h = sweepPerson(pos, dx, dz, other, r + .27);
            if (h && (!hit || h.t < hit.t || (h.t === hit.t && h.depth > hit.depth)))
                hit = h;
        }
        for (const s of candidates(pos, end, r + skin, y, cars)) {
            const h = sweepDisc(pos, dx, dz, r, s);
            if (h && (!hit || h.t < hit.t || (h.t === hit.t && h.depth > hit.depth)))
                hit = h;
        }
        if (!hit)
            return end;
        const { t, nx, nz, depth } = hit;
        pos.x += t * dx + (depth + skin) * nx;
        pos.z += t * dz + (depth + skin) * nz;
        dx *= 1 - t;
        dz *= 1 - t;
        const into = Math.min(0, dx * nx + dz * nz);
        dx -= into * nx;
        dz -= into * nz;
        if (depth === 0 && Math.abs(dx) + Math.abs(dz) < 1e-6)
            break;
    }
    return pos;
}
function footFloor(p, y, r, cars) {
    let floor = (0, world_layout_js_1.groundHeight)(p.x, p.z);
    const broken = cars ? states.get(cars) : null;
    if (broken)
        floor += (0, vehicle_road_js_1.footprintHeight)(p.x, p.z, broken);
    floor = Math.max(floor, (0, market_quarter_layout_js_1.quarterFloor)(p.x, p.z, y, r));
    const freightDeck = (0, cargo_rail_js_1.cargoFootbridgeFloor)(p.x, p.z);
    if (freightDeck !== null && freightDeck <= y + .231)
        floor = Math.max(floor, freightDeck);
    for (const s of localWalls(p.x - r, p.z - r, p.x + r, p.z + r))
        if (s.top !== undefined && s.top <= 1.4 && y >= s.top - .015 && p.x > s.minX - r && p.x < s.maxX + r && p.z > s.minZ - r && p.z < s.maxZ + r && discDistance(p, s).distance < r)
            floor = Math.max(floor, s.top);
    for (let i = 0; i < barriers.length; i++) {
        const b = barriers[i], o = world_layout_js_1.lowBarriers[i], top = (0, world_layout_js_1.groundHeight)(o.x, o.z) + .63;
        if (y >= top - .015 && p.x > b.minX - r && p.x < b.maxX + r && p.z > b.minZ - r && p.z < b.maxZ + r && discDistance(p, b).distance < r)
            floor = Math.max(floor, top);
    }
    return floor;
}
function projection(s, n) {
    let low = Infinity, high = -Infinity;
    for (const v of s.points) {
        const k = v.x * n.x + v.z * n.z;
        low = Math.min(low, k);
        high = Math.max(high, k);
    }
    return [low, high];
}
function sweepHull(s, b, dx, dz) {
    let enter = -Infinity, exit = Infinity, nx = 0, nz = 0, depth = Infinity, px = 0, pz = 0;
    for (const group of [s.normals, b.normals])
        for (const n of group) {
            const [al, ah] = projection(s, n), [bl, bh] = projection(b, n), v = dx * n.x + dz * n.z;
            const right = bh - al, left = ah - bl;
            if (Math.min(left, right) < depth) {
                depth = Math.min(left, right);
                const sign = left < right ? -1 : 1;
                px = sign * n.x;
                pz = sign * n.z;
            }
            if (Math.abs(v) < 1e-10) {
                if (ah < bl || bh < al)
                    return null;
                continue;
            }
            let lo = (bl - ah) / v, hi = (bh - al) / v;
            if (lo > hi)
                [lo, hi] = [hi, lo];
            if (lo > enter) {
                enter = lo;
                const sign = v > 0 ? -1 : 1;
                nx = n.x * sign;
                nz = n.z * sign;
            }
            exit = Math.min(exit, hi);
            if (enter > exit || exit < 0 || enter > 1)
                return null;
        }
    if (enter < 0) {
        if (depth < .00002 && dx * px + dz * pz >= -1e-8)
            return null;
        return { t: 0, nx: px, nz: pz, depth: Math.max(0, depth), car: b.car, fixture: b.fixture, prop: b.prop, surface: b.surface };
    }
    return { t: enter, nx, nz, depth: 0, car: b.car, fixture: b.fixture, prop: b.prop, surface: b.surface };
}
function supportSpan(hull, nx, nz, face, tx, tz) {
    let lo = Infinity, hi = -Infinity;
    for (const p of hull.points) {
        if (Math.abs(p.x * nx + p.z * nz - face) > .017)
            continue;
        const along = p.x * tx + p.z * tz;
        lo = Math.min(lo, along);
        hi = Math.max(hi, along);
    }
    return [lo, hi];
}
function hullContact(hit, hull, other, pose, dx, dz) {
    const nx = hit.nx, nz = hit.nz, tx = -nz, tz = nx, n = { x: nx, z: nz };
    const a = projection(hull, n)[0], b = projection(other, n)[1];
    const [lo, hi] = supportSpan(hull, nx, nz, a, tx, tz), [loOther, hiOther] = supportSpan(other, nx, nz, b, tx, tz);
    const delta = (dx * tx + dz * tz) * hit.t;
    const along = (Math.max(lo + delta, loOther) + Math.min(hi + delta, hiOther)) * .5;
    return { ...hit, contact: { x: nx * b + tx * along, z: nz * b + tz * along },
        source: { x: pose.x + dx * hit.t, z: pose.z + dz * hit.t, yaw: pose.yaw } };
}
function peopleShapes(a, b, people, reach = 3.4, base = 0, roof = 2) {
    const list = [];
    for (const p of people) {
        if (p.y !== undefined && (p.y > base + roof + .15 || p.y + 1.4 < base))
            continue;
        if (p.x < Math.min(a.x, b.x) - reach || p.x > Math.max(a.x, b.x) + reach || p.z < Math.min(a.z, b.z) - reach || p.z > Math.max(a.z, b.z) + reach)
            continue;
        const points = [];
        for (let i = 0; i < 8; i++) {
            const a = i * Math.PI / 4;
            points.push({ x: p.x + .28 * Math.cos(a), z: p.z + .28 * Math.sin(a) });
        }
        list.push(shape(points));
    }
    return list;
}
const carReach = (c) => c.kind === 'towtruck' || c.kind === 'utility' ? 4.07 : 3.2;
// Restrict save recovery to solids added with the school, using the live collision shapes.
const schoolSite = require("./school-site.js");
const schoolWalls = [...schoolSite.schoolShell, schoolSite.schoolBench, schoolSite.schoolPlanter, schoolSite.relocatedQuarryLot]
    .map(box => ({ ...rect(box), top: box.h }));
function overlapsSchool(p, car) {
    const radius = car ? carReach(car) : .30;
    const close = wall => p.x + radius > wall.minX && p.x - radius < wall.maxX &&
        p.z + radius > wall.minZ && p.z - radius < wall.maxZ;
    return schoolWalls.some(wall => close(wall) && (car
        ? !!sweepHull(carShape(car), wall, 0, 0)
        : p.y < wall.top - .005 && discDistance(p, wall).distance < radius - .00001));
}
exports.overlapsSchool = overlapsSchool;
function hullFits(c, p, cars, people = [], alsoIgnore) {
    const s = footprint(c, p), reach = carReach(c);
    return candidates(p, p, reach, 0, cars, c, true, alsoIgnore).concat(peopleShapes(p, p, people, reach + .2, (0, world_layout_js_1.groundHeight)(p.x, p.z), vehicle_cabin_js_1.specs[c.kind].roof)).every(b => !sweepHull(s, b, 0, 0));
}
function moveHull(c, dx, dz, yaw, cars, people = []) {
    const delta = (0, sim_navigation_js_1.wrapAngle)(yaw - c.yaw), steps = Math.max(1, Math.ceil(Math.abs(delta) / .03)), reach = carReach(c);
    let pose = { x: c.x, z: c.z, yaw: c.yaw };
    let first = null;
    for (let i = 0; i < steps; i++) {
        let x = dx / steps, z = dz / steps;
        const nextYaw = pose.yaw + delta / steps;
        const end = { x: pose.x + x, z: pose.z + z };
        const nearby = candidates(pose, end, reach, 0, cars, c, true).concat(peopleShapes(pose, end, people, reach + .2, (0, world_layout_js_1.groundHeight)(pose.x, pose.z), vehicle_cabin_js_1.specs[c.kind].roof));
        if (!nearby.length) {
            pose = { x: pose.x + x, z: pose.z + z, yaw: nextYaw };
            continue;
        }
        const rotated = footprint(c, { ...pose, yaw: nextYaw });
        let turnHit = null;
        for (const b of nearby) {
            const h = sweepHull(rotated, b, 0, 0);
            if (h) {
                turnHit = hullContact(h, rotated, b, { ...pose, yaw: nextYaw }, 0, 0);
                break;
            }
        }
        if (!turnHit)
            pose.yaw = nextYaw;
        for (let pass = 0; pass < 3; pass++) {
            const hull = footprint(c, pose);
            let hit = null;
            for (const b of nearby) {
                const h = sweepHull(hull, b, x, z);
                if (h && (!hit || h.t < hit.t)) {
                    hit = hullContact(h, hull, b, pose, x, z);
                }
            }
            if (!hit) {
                pose.x += x;
                pose.z += z;
                break;
            }
            first ??= hit;
            pose.x += x * hit.t + hit.nx * (hit.depth + skin);
            pose.z += z * hit.t + hit.nz * (hit.depth + skin);
            x *= 1 - hit.t;
            z *= 1 - hit.t;
            const v = Math.min(0, x * hit.nx + z * hit.nz);
            x -= v * hit.nx;
            z -= v * hit.nz;
            if (Math.abs(x) + Math.abs(z) < 1e-7)
                break;
        }
        first ??= turnHit;
    }
    return { ...pose, hit: first };
}
function contactPoint(c, n, other) {
    const local = toLocal(c, { x: c.x + n.x, z: c.z + n.z }), s = (0, vehicle_cabin_js_1.carCabin)(c.kind);
    if (Math.abs(local.x) > Math.abs(local.z)) {
        const along = other ? toLocal(c, other).z : local.z * .8;
        return { x: -Math.sign(local.x) * s.halfWidth, z: (0, sim_navigation_js_1.clamp)(along, s.front + .18, s.rear - .18) };
    }
    const across = other ? toLocal(c, other).x : -local.x * .8;
    return { x: (0, sim_navigation_js_1.clamp)(across, -s.halfWidth + .12, s.halfWidth - .12), z: local.z > 0 ? s.front : s.rear };
}
const railBodies = new WeakMap();
function railShape(p) {
    const points = [[-.99, -5.35], [.99, -5.35], [1.22, -5.05], [1.22, 5.05], [.99, 5.35], [-.99, 5.35], [-1.22, 5.05], [-1.22, -5.05]];
    return { ...shape(points.map(([x, z]) => toWorld(p, x, z))), surface: 'metal' };
}
function setTramBody(cars, pose) {
    if (!pose.visible) {
        railBodies.delete(cars);
        return;
    }
    const prior = railBodies.get(cars)?.pose;
    if (prior && pose.x === prior.x && pose.z === prior.z && pose.yaw === prior.yaw)
        return;
    railBodies.set(cars, { pose, body: railShape(pose) });
}
function tramObstructed(pose, cars, people) {
    if (!pose.visible)
        return false;
    const tram = railShape(pose);
    for (const p of people) {
        if ((p.y ?? 0) > 3.45)
            continue;
        if (p.x < tram.minX - .37 || p.x > tram.maxX + .37 || p.z < tram.minZ - .37 || p.z > tram.maxZ + .37)
            continue;
        if (discDistance(p, tram).distance < .37)
            return true;
    }
    for (const c of cars) {
        if (c.carriedBy || c.x < tram.minX - 4.1 || c.x > tram.maxX + 4.1 || c.z < tram.minZ - 4.1 || c.z > tram.maxZ + 4.1)
            continue;
        if (sweepHull(tram, carShape(c), 0, 0))
            return true;
    }
    return false;
}
function vaultRoute(h, cars) {
    const fx = -Math.sin(h.yaw), fz = -Math.cos(h.yaw), probe = { x: h.x + fx * 1.12, z: h.z + fz * 1.12 };
    for (const s of candidates(h, probe, .24, h.y, cars)) {
        const top = s.top ?? (barriers.includes(s) ? (0, world_layout_js_1.groundHeight)(h.x, h.z) + .63 : 0);
        if (top - h.y < .38 || top - h.y > 1.02 || s.car)
            continue;
        const hit = sweepDisc(h, fx * 1.12, fz * 1.12, .23, s);
        if (!hit)
            continue;
        const [near, far] = projection(s, { x: fx, z: fz }).map(v => v - h.x * fx - h.z * fz);
        if (far - near > .71 || far > 2.1)
            continue;
        const end = { x: h.x + fx * (far + .47), z: h.z + fz * (far + .47) };
        if (!clearDisc(end, .30, (0, world_layout_js_1.groundHeight)(end.x, end.z), cars) || !clearPath(h, end, .25, top + .06, cars))
            continue;
        return { from: { x: h.x, z: h.z }, to: end, hand: { x: h.x + fx * (hit.t * 1.12 + .22) + fz * .18, y: top, z: h.z + fz * (hit.t * 1.12 + .22) - fx * .18 }, top, t: 0 };
    }
    return null;
}
function narrowGap(h, y, yaw, cars) {
    const co = Math.cos(yaw) * .42, si = -Math.sin(yaw) * .42;
    return !clearDisc({ x: h.x + co, z: h.z + si }, .12, y, cars) && !clearDisc({ x: h.x - co, z: h.z - si }, .12, y, cars);
}
