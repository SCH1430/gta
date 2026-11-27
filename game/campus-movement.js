"use strict";
const { campus } = require("./campus-layout.js");
const plans = Object.values(campus.floors).sort((a, b) => a.number - b.number);
const levelHeight = plans[1].floor - plans[0].floor;
const minX = Math.min(...plans.map(p => p.bounds.minX));
const maxX = Math.max(...plans.map(p => p.bounds.maxX));
const minZ = Math.min(...plans.map(p => p.bounds.minZ));
const maxZ = Math.max(...plans.map(p => p.bounds.maxZ));
const cell = 4, skin = .001, stepLimit = .24, bodyHeight = 1.72;
const originX = minX - cell, originZ = minZ - cell;
const nx = Math.ceil((maxX - originX) / cell) + 2, nz = Math.ceil((maxZ - originZ) / cell) + 2;
const ix = x => Math.floor((x - originX) / cell);
const iz = z => Math.floor((z - originZ) / cell);
const iy = y => Math.floor((y - plans[0].floor) / levelHeight);
const surfaces = new Map(), solids = new Map();
const bin = (x, y, z) => (y * nz + z) * nx + x;
let built = false, visit = 0;

function put(table, key, item) {
    let items = table.get(key);
    if (!items) table.set(key, items = []);
    items.push(item);
}
function height(s, x, z) { return s.y0 + s.sx * (x - s.x0) + s.sz * (z - s.z0); }
function surface(s) {
    for (let z = iz(s.z0 - skin); z <= iz(s.z1 + skin); z++)
        for (let x = ix(s.x0 - skin); x <= ix(s.x1 + skin); x++)
            put(surfaces, bin(x, 0, z), s);
}
function solid(x0, x1, z0, z1, y0, h, walk, overhead = false, sx = 0, sz = 0) {
    const s = { x0, x1, z0, z1, y0, h, sx, sz, walk, overhead, stamp: 0 };
    const riseX = sx * (x1 - x0), riseZ = sz * (z1 - z0);
    const lo = y0 + Math.min(0, riseX) + Math.min(0, riseZ);
    const hi = y0 + h + Math.max(0, riseX) + Math.max(0, riseZ);
    for (let y = iy(lo - skin); y <= iy(hi + skin); y++)
        for (let z = iz(z0 - skin); z <= iz(z1 + skin); z++)
            for (let x = ix(x0 - skin); x <= ix(x1 + skin); x++)
                put(solids, bin(x, y, z), s);
}
function build() {
    if (built) return;
    built = true;
    for (const p of plans) {
        const zone = 'school' + p.number;
        for (const a of p.areas) {
            const x0 = a.x - a.w / 2, x1 = a.x + a.w / 2, z0 = a.z - a.d / 2, z1 = a.z + a.d / 2;
            surface({ x0, x1, z0, z1, y0: p.floor, sx: 0, sz: 0, zone, area: a });
            solid(x0, x1, z0, z1, p.floor - .16, .16, false, true);
            if (!a.openAbove) solid(x0, x1, z0, z1, p.floor + p.ceiling, .14, false, true);
        }
        for (const w of p.walls) {
            const t = w.kind === 'rail' ? .045 : .08;
            solid(Math.min(w.x1, w.x2) - t, Math.max(w.x1, w.x2) + t,
                Math.min(w.z1, w.z2) - t, Math.max(w.z1, w.z2) + t,
                p.floor, w.h, true);
        }
        for (const f of p.furniture)
            solid(f.x - f.w / 2, f.x + f.w / 2, f.z - f.d / 2, f.z + f.d / 2, p.floor, f.h, true);
        for (const d of p.doors) {
            const w = d.axis === 'x' ? d.width / 2 : .08, depth = d.axis === 'z' ? d.width / 2 : .08;
            const opening = d.height ?? 2.48;
            if (p.ceiling > opening)
                solid(d.x - w, d.x + w, d.z - depth, d.z + depth, p.floor + opening, p.ceiling - opening, true, true);
            if (d.kind === 'entry')
                solid(d.x - w, d.x + w, d.z - depth, d.z + depth, p.floor, opening, true);
        }
    }
    const roof = campus.skylight;
    solid(roof.x - roof.w / 2, roof.x + roof.w / 2, roof.z - roof.d / 2, roof.z + roof.d / 2,
        roof.y, .13, false, true);
    const top = plans[plans.length - 1];
    for (const shaft of campus.shafts)
        solid(shaft.x - shaft.w / 2, shaft.x + shaft.w / 2, shaft.z - shaft.d / 2, shaft.z + shaft.d / 2,
            top.floor + top.ceiling, .14, false, true);
    for (const flight of campus.stairs) {
        const floor = campus.floors['school' + flight.from].floor, rise = campus.floors['school' + flight.to].floor - floor;
        const dx = flight.x2 - flight.x1, dz = flight.z2 - flight.z1, length2 = dx * dx + dz * dz;
        const sx = rise * dx / length2, sz = rise * dz / length2, across = flight.width / 2;
        const x0 = Math.min(flight.x1, flight.x2) - (dx ? 0 : across), x1 = Math.max(flight.x1, flight.x2) + (dx ? 0 : across);
        const z0 = Math.min(flight.z1, flight.z2) - (dz ? 0 : across), z1 = Math.max(flight.z1, flight.z2) + (dz ? 0 : across);
        const y0 = floor + sx * (x0 - flight.x1) + sz * (z0 - flight.z1);
        surface({ x0, x1, z0, z1, y0, sx, sz, flight, zone: 'school' + flight.from });
        solid(x0, x1, z0, z1, y0 - .15, .15, false, true, sx, sz);
        // The handrails slope with the flight. A level wall here would block its upper landing.
        for (const side of [-1, 1]) {
            const line = dx ? (side < 0 ? z0 : z1) : (side < 0 ? x0 : x1);
            solid(dx ? x0 : line - .038, dx ? x1 : line + .038,
                dz ? z0 : line - .038, dz ? z1 : line + .038, y0, 1.05, true, false, sx, sz);
        }
    }
}
function isCampusX(x) { return x >= minX - .75 && x <= maxX + .75; }
function support(x, z, reference) {
    const nearby = surfaces.get(bin(ix(x), 0, iz(z)));
    let best = null, high = -Infinity;
    if (nearby)
        for (const s of nearby) {
            if (x < s.x0 - skin || x > s.x1 + skin || z < s.z0 - skin || z > s.z1 + skin) continue;
            const y = height(s, x, z);
            if (y <= reference + stepLimit && (y > high + skin || Math.abs(y - high) <= skin && best?.flight && !s.flight)) {
                high = y;
                best = s;
            }
        }
    return best;
}
function floorAt(x, z, referenceY = 0) {
    build();
    const s = support(x, z, referenceY);
    return s ? height(s, x, z) : NaN;
}
function zoneFor(x, z, y = 0) {
    build();
    const s = support(x, z, y);
    if (!s) return 'school' + plans.reduce((a, b) => Math.abs(a.floor - y) <= Math.abs(b.floor - y) ? a : b).number;
    if (!s.flight) return s.zone;
    const f = s.flight, middle = (campus.floors['school' + f.from].floor + campus.floors['school' + f.to].floor) * .5;
    return 'school' + (height(s, x, z) < middle ? f.from : f.to);
}
function roomName(x, z, y) {
    build();
    const s = support(x, z, y), plan = campus.floors[zoneFor(x, z, y)];
    if (s?.flight) return plan.name + ' · Лестница';
    return s?.area?.name ? plan.name + ' · ' + s.area.name : plan.name;
}
function touchesDisc(s, x, z, r) {
    const dx = Math.max(s.x0 - x, 0, x - s.x1), dz = Math.max(s.z0 - z, 0, z - s.z1);
    return dx * dx + dz * dz < r * r;
}
function freeBody(x, z, base, feet, r) {
    const seen = ++visit;
    for (let by = iy(feet); by <= iy(feet + bodyHeight); by++)
        for (let bz = iz(z - r); bz <= iz(z + r); bz++)
            for (let bx = ix(x - r); bx <= ix(x + r); bx++) {
                const cells = solids.get(bin(bx, by, bz));
                if (!cells) continue;
                for (const s of cells) {
                    if (s.stamp === seen) continue;
                    s.stamp = seen;
                    const bottom = height(s, x, z), top = bottom + s.h;
                    // A slab or ramp supporting the feet must not become a horizontal obstacle.
                    if (!s.walk && bottom < base + .15) continue;
                    if (top <= feet + .015 || bottom >= feet + bodyHeight - skin) continue;
                    if (touchesDisc(s, x, z, r)) return false;
                }
            }
    return true;
}
function safeSupport(x, z, y, r, air) {
    const h = floorAt(x, z, y);
    if (!Number.isFinite(h) || Math.abs(h - y) > stepLimit) return NaN;
    // Check the rim of the feet as well as the centre. This seals open shaft and balcony edges.
    const tolerance = .12 + r * 1.30;
    const rim = (xx, zz) => Math.abs(floorAt(xx, zz, h + tolerance - stepLimit) - h) <= tolerance;
    if (!rim(x + r, z) || !rim(x - r, z) || !rim(x, z - r) || !rim(x, z + r)) return NaN;
    return freeBody(x, z, h, h + air, r) ? h : NaN;
}
function validSpawn(x, z, y, r = .30) {
    if (![x, z, y].every(Number.isFinite) || !isCampusX(x)) return false;
    const h = floorAt(x, z, y), air = y - h;
    return air >= -.06 && air <= .80 && Number.isFinite(safeSupport(x, z, h, r, Math.max(0, air)));
}
function move(x, z, y, dx, dz, r = .30) {
    let ground = floorAt(x, z, y);
    if (!Number.isFinite(ground)) return { x, z, y };
    const air = Math.max(0, y - ground), n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .085));
    const vx = dx / n, vz = dz / n;
    for (let i = 0; i < n; i++) {
        let h = safeSupport(x + vx, z + vz, ground, r, air);
        if (Number.isFinite(h)) { x += vx; z += vz; ground = h; continue; }
        if (vx && vz) {
            h = safeSupport(x + vx, z, ground, r, air);
            if (Number.isFinite(h)) { x += vx; ground = h; continue; }
            h = safeSupport(x, z + vz, ground, r, air);
            if (Number.isFinite(h)) { z += vz; ground = h; continue; }
        }
        break;
    }
    return { x, z, y: ground };
}
function headroom(x, z, feetY, r = .30) {
    build();
    const seen = ++visit;
    let best = Infinity;
    for (let by = iy(feetY); by <= plans.length; by++)
        for (let bz = iz(z - r); bz <= iz(z + r); bz++)
            for (let bx = ix(x - r); bx <= ix(x + r); bx++) {
                const cells = solids.get(bin(bx, by, bz));
                if (!cells) continue;
                for (const s of cells) {
                    if (!s.overhead || s.stamp === seen) continue;
                    s.stamp = seen;
                    if (!touchesDisc(s, x, z, r)) continue;
                    const bottom = height(s, x, z);
                    if (bottom > feetY + .12 && bottom < best) best = bottom;
                }
            }
    return best;
}
function rayHit(s, p, v, end, r) {
    let near = 0, far = end;
    const clip = (origin, direction, lo, hi) => {
        if (Math.abs(direction) < 1e-9) return origin >= lo && origin <= hi;
        const a = (lo - origin) / direction, b = (hi - origin) / direction;
        near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
        return far >= near;
    };
    if (!clip(p.x, v.x, s.x0 - r, s.x1 + r) || !clip(p.z, v.z, s.z0 - r, s.z1 + r)) return end;
    // In the coordinate normal to the slope, the top and underside become parallel planes.
    const radius = r * Math.sqrt(1 + s.sx * s.sx + s.sz * s.sz);
    if (!clip(p.y - height(s, p.x, p.z), v.y - s.sx * v.x - s.sz * v.z, -radius, s.h + radius)) return end;
    return Math.max(0, near - .014);
}
function clearance(start, dir, end, r) {
    build();
    const seen = ++visit, x1 = start.x + dir.x * end, y1 = start.y + dir.y * end, z1 = start.z + dir.z * end;
    for (let by = iy(Math.min(start.y, y1) - r); by <= iy(Math.max(start.y, y1) + r); by++)
        for (let bz = iz(Math.min(start.z, z1) - r); bz <= iz(Math.max(start.z, z1) + r); bz++)
            for (let bx = ix(Math.min(start.x, x1) - r); bx <= ix(Math.max(start.x, x1) + r); bx++) {
                const cells = solids.get(bin(bx, by, bz));
                if (!cells) continue;
                for (const s of cells) {
                    if (s.stamp === seen) continue;
                    s.stamp = seen;
                    end = rayHit(s, start, dir, end, r);
                    if (!end) return 0;
                }
            }
    return end;
}
module.exports = { isCampusX, zoneFor, floorAt, move, clearance, roomName, validSpawn, headroom };
