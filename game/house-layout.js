"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.housePlan = exports.furnishings = exports.houseSteps = exports.houseUpper = exports.houseSpawn = exports.houseOutside = exports.houseEntry = void 0;
exports.canEnterHouse = canEnterHouse;
exports.canExitHouse = canExitHouse;
exports.houseDoorGrip = houseDoorGrip;
exports.houseFloor = houseFloor;
exports.houseRoom = houseRoom;
exports.moveInHouse = moveInHouse;
exports.houseClearance = houseClearance;
const campusMotion = require("./campus-movement.js");
const interior_layout_js_1 = require("./interior-layout.js");
exports.houseEntry = { x: -34.96, z: 15.80 };
exports.houseOutside = { x: -34.96, z: 17.0, yaw: Math.PI };
exports.houseSpawn = { x: -.85, z: 5.90, yaw: 0 };
exports.houseUpper = 3.06;
exports.houseSteps = { x1: -3.18, x2: 1.64, z1: -2.7, z2: 4.5, count: 18 };
const boundary = { minX: -3.30, maxX: 11.20, minZ: -6.9, maxZ: 7.06 };
const wall = (x1, z1, x2, z2) => ({ x1, z1, x2, z2 });
const walls = [
    wall(-3.30, -6.9, 11.20, -6.9), wall(11.20, -6.9, 11.20, 7.06), wall(11.20, 7.06, -3.30, 7.06), wall(-3.30, 7.06, -3.30, -6.9),
    wall(1.65, -6.90, 1.65, -5.94), wall(1.65, -3.90, 1.65, 7.06),
    wall(1.65, -2.94, 3.12, -2.94), wall(5.40, -2.94, 8.43, -2.94), wall(10.52, -2.94, 11.20, -2.94),
    wall(7.52, -2.94, 7.52, -.98), wall(7.52, 1.16, 7.52, 7.06)
];
function furnishing(kind, x, z, w, d, h, base = exports.houseUpper) { return { kind, x, z, w, d, h, base }; }
exports.furnishings = [
    furnishing('mail', -3.05, 5.58, .35, 1.67, 1.54, 0),
    furnishing('meter', -3.04, -4.85, .34, 1.18, 1.72),
    furnishing('openDoor', 2.42, -6.16, 1.48, .078, 2.18),
    furnishing('shoes', 4.75, -6.43, 2.14, .62, .57),
    furnishing('wardrobe', 7.48, -6.45, 1.68, .61, 2.18),
    furnishing('sofa', 2.48, 2.62, 1.25, 2.72, 1.05),
    furnishing('table', 4.51, 3.10, 1.23, .77, .46),
    furnishing('record', 6.99, 3.87, .67, 2.26, 1.22),
    furnishing('palm', 6.70, 6.21, .68, .66, 1.7),
    furnishing('radiator', 5, 6.84, 2.56, .26, .68),
    furnishing('kitchen', 10.74, 1.33, .72, 3.75, .94),
    furnishing('fridge', 10.67, -1.17, .81, .86, 1.92),
    furnishing('dining', 9.38, 4.57, 1.32, .94, .81),
    furnishing('chairA', 8.47, 4.64, .44, .46, .91),
    furnishing('chairB', 10.27, 4.64, .44, .46, .91)
];
exports.housePlan = {
    bounds: boundary, walls, furniture: exports.furnishings, stairs: exports.houseSteps,
    entrance: { x: -.85, z: 6.91 }, apartment: { x: 1.65, z: -4.92 },
    labels: [{ x: -.75, z: 5.64, name: 'Выход' }, { x: 4.52, z: -4.86, name: 'Прихожая' }, { x: 4.66, z: 1.30, name: 'Гостиная' }, { x: 9.30, z: .10, name: 'Кухня' }]
};
const wallThickness = .16;
const solids = [
    ...walls.map(a => ({ x: (a.x1 + a.x2) / 2, z: (a.z1 + a.z2) / 2, w: Math.abs(a.x2 - a.x1) + wallThickness,
        d: Math.abs(a.z2 - a.z1) + wallThickness, bottom: -.20, top: 6.42 })),
    ...exports.furnishings.map(f => ({ ...f, bottom: f.base, top: f.base + f.h }))
];
const overhead = [
    { x: -.82, z: 5.96, w: 4.80, d: 2.22, bottom: 3.02, top: 3.14 },
    { x: 4, z: 0, w: 14.60, d: 14.1, bottom: 6.34, top: 6.65 },
    { x: 1.65, z: -4.92, w: wallThickness, d: 2.12, bottom: exports.houseUpper + 2.33, top: 6.42 },
    { x: 4.26, z: -2.94, w: 2.44, d: wallThickness, bottom: exports.houseUpper + 2.36, top: 6.42 },
    { x: 9.47, z: -2.94, w: 2.20, d: wallThickness, bottom: exports.houseUpper + 2.36, top: 6.42 }
];
function canEnterHouse(x, z) {
    return Math.abs(x - exports.houseEntry.x) < 1.18 && z > exports.houseEntry.z - .15 && z < exports.houseEntry.z + 1.88;
}
function canExitHouse(x, z) {
    return Math.abs(x + .85) < 1.12 && z > 5.54 && z < 7.16;
}
function houseDoorGrip(inside, open) {
    const a = Math.max(0, Math.min(1, open)) * 1.48;
    if (inside)
        return { x: -.16 - 1.12 * Math.cos(a) - .075 * Math.sin(a), y: 1.04, z: 6.89 + 1.12 * Math.sin(a) - .075 * Math.cos(a) };
    return { x: exports.houseEntry.x - .70 + 1.12 * Math.cos(a) - .075 * Math.sin(a), y: 1.04, z: exports.houseEntry.z + 1.12 * Math.sin(a) + .075 * Math.cos(a) };
}
function houseFloor(x, z, referenceY = 0) {
    if (campusMotion.isCampusX(x)) {
        const floor = campusMotion.floorAt(x, z, referenceY);
        return Number.isFinite(floor) ? floor : referenceY;
    }
    const annex = (0, interior_layout_js_1.annexAt)(x);
    if (annex)
        return (0, interior_layout_js_1.annexFloor)(annex, x, z);
    if (x >= 1.65 || z <= exports.houseSteps.z1)
        return exports.houseUpper;
    if (z >= exports.houseSteps.z2)
        return 0;
    const tread = (exports.houseSteps.z2 - exports.houseSteps.z1) / exports.houseSteps.count;
    return Math.min(exports.houseSteps.count, Math.ceil((exports.houseSteps.z2 - z) / tread - 1e-9)) * exports.houseUpper / exports.houseSteps.count;
}
function houseRoom(x, z, y = 0) {
    if (campusMotion.isCampusX(x)) return campusMotion.roomName(x, z, y);
    const annex = (0, interior_layout_js_1.annexAt)(x);
    if (annex)
        return interior_layout_js_1.annexes[annex].name;
    if (x < 1.65)
        return z >= 4.5 ? 'Подъезд № 1' : z > exports.houseSteps.z1 ? 'Лестница' : 'Площадка второго этажа';
    if (z < -2.94)
        return 'Прихожая · кв. 7';
    return x < 7.52 ? 'Гостиная · кв. 7' : 'Кухня · кв. 7';
}
function separate(x, z, s, r) {
    const lx = s.x - s.w * .5, hx = s.x + s.w * .5, lz = s.z - s.d * .5, hz = s.z + s.d * .5;
    if (x <= lx - r || x >= hx + r || z <= lz - r || z >= hz + r)
        return { x, z };
    const nx = Math.max(lx, Math.min(hx, x)), nz = Math.max(lz, Math.min(hz, z));
    const dx = x - nx, dz = z - nz, n2 = dx * dx + dz * dz;
    if (n2 >= r * r)
        return { x, z };
    if (n2 > .00000001) {
        const k = r / Math.sqrt(n2);
        return { x: nx + dx * k, z: nz + dz * k };
    }
    const nearest = Math.min(x - lx, hx - x, z - lz, hz - z);
    if (nearest === x - lx)
        x = lx - r;
    else if (nearest === hx - x)
        x = hx + r;
    else if (nearest === z - lz)
        z = lz - r;
    else
        z = hz + r;
    return { x, z };
}
function moveInHouse(x, z, dx, dz, radius = .31, y = 0) {
    if (campusMotion.isCampusX(x)) return campusMotion.move(x, z, y, dx, dz, radius);
    const annex = (0, interior_layout_js_1.annexAt)(x);
    if (annex)
        return (0, interior_layout_js_1.moveInAnnex)(annex, x, z, dx, dz, radius);
    const slices = Math.max(1, Math.ceil(Math.hypot(dx, dz) / Math.max(.075, radius * .55)));
    for (let i = 0; i < slices; i++) {
        x += dx / slices;
        z += dz / slices;
        for (const s of solids)
            ({ x, z } = separate(x, z, s, radius));
    }
    return { x, z };
}
function rayBox(p, v, length, r, s) {
    let near = 0, far = length;
    const a = [p.x - s.x, p.y - (s.bottom + s.top) / 2, p.z - s.z], d = [v.x, v.y, v.z], half = [s.w * .5 + r, (s.top - s.bottom) * .5 + r, s.d * .5 + r];
    for (let j = 0; j < 3; j++) {
        if (Math.abs(d[j]) < 1e-8) {
            if (Math.abs(a[j]) > half[j])
                return length;
            continue;
        }
        const lo = (-half[j] - a[j]) / d[j], hi = (half[j] - a[j]) / d[j];
        near = Math.max(near, Math.min(lo, hi));
        far = Math.min(far, Math.max(lo, hi));
        if (near > far)
            return length;
    }
    return Math.max(0, near - .016);
}
function houseClearance(start, dir, length, radius) {
    if (campusMotion.isCampusX(start.x)) return campusMotion.clearance(start, dir, length, radius);
    const annex = (0, interior_layout_js_1.annexAt)(start.x);
    if (annex)
        return (0, interior_layout_js_1.annexClearance)(annex, start, dir, length, radius);
    let end = length;
    for (const s of solids)
        end = rayBox(start, dir, end, radius, s);
    for (const s of overhead)
        end = rayBox(start, dir, end, radius, s);
    for (let t = .12; t < end + .12; t += .12) {
        const at = Math.min(end, t);
        if (start.y + at * dir.y < houseFloor(start.x + at * dir.x, start.z + at * dir.z) + radius) {
            return Math.max(0, at - .12);
        }
    }
    return end;
}
