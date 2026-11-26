"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoRail = exports.cargoFootbridge = exports.cargoTargetWagon = exports.cargoWagons = exports.cargoShedSides = exports.cargoShed = exports.cargoCutsBridge = exports.cargoCrossingSigns = exports.cargoCrossings = exports.cargoTrack = void 0;
exports.cargoGrade = cargoGrade;
exports.cargoFootbridgeFloor = cargoFootbridgeFloor;
exports.cargoTrack = { west: -535, east: 121, z: 59.25 };
exports.cargoCrossings = [
    { x: -444, name: 'Карьерный переезд', look: { x: -434.7, z: 54.9 }, roadWidth: 11.4 },
    { x: -126, name: 'Литейный переезд', look: { x: -116.7, z: 54.9 }, roadWidth: 10.4 },
    { x: 46, name: 'Портовый переезд', look: { x: 55.4, z: 54.9 }, roadWidth: 10.4 }
];
exports.cargoCrossingSigns = [...exports.cargoCrossings, { x: 14.1, name: 'Шлюзовой спуск', roadWidth: 3.55 }];
const cargoCutsBridge = (x) => exports.cargoCrossings.some(c => c.x === x);
exports.cargoCutsBridge = cargoCutsBridge;
exports.cargoShed = { west: exports.cargoTrack.east, east: 157.1, halfWidth: 2.05, height: 4.48 };
exports.cargoShedSides = [-1, 1].map(s => ({ x: (exports.cargoShed.west + exports.cargoShed.east) / 2, z: exports.cargoTrack.z + s * exports.cargoShed.halfWidth,
    w: exports.cargoShed.east - exports.cargoShed.west, d: .22, h: exports.cargoShed.height }));
exports.cargoWagons = [
    { id: 'ТМ‑07', style: 'engine', offset: 0, length: 11.7, width: 2.61, height: 3.41, color: '#477a72' },
    { id: 'А‑109', style: 'box', offset: 11.8, length: 10.7, width: 2.63, height: 3.48, color: '#876761' },
    { id: 'Е‑274', style: 'container', offset: 23.4, length: 10.8, width: 2.64, height: 3.58, color: '#437482' },
    { id: 'Б‑418', style: 'hopper', offset: 34.95, length: 10.7, width: 2.61, height: 3.2, color: '#68746b' },
    { id: 'Н‑506', style: 'tank', offset: 46.88, length: 11.5, width: 2.61, height: 3.31, color: '#b1a99c' }
];
exports.cargoTargetWagon = exports.cargoWagons[2];
const lookOffset = 7.8, dwell = 12, cruise = 10.4, acceleration = 1.75, brake = 2.05;
const stopAt = (index) => exports.cargoCrossings[index].x + lookOffset + exports.cargoTargetWagon.offset;
const firstGap = exports.cargoWagons[0].length * .5, lastGap = exports.cargoWagons.at(-1).offset + exports.cargoWagons.at(-1).length * .5;
const start = exports.cargoTrack.west + lastGap + 8, finish = exports.cargoTrack.east + lastGap + 4;
exports.cargoFootbridge = { x: 58.4, halfWidth: 1.13, north: 49.0, up: 57.25, down: 61.6, south: 72.24, deck: 4.68 };
const bound = (n, a, b) => Math.min(b, Math.max(a, n));
const smooth = (v) => { const a = bound(v, 0, 1); return a * a * (3 - 2 * a); };
const finite = (n, other) => typeof n === 'number' && Number.isFinite(n) ? n : other;
function cargoGrade(x) {
    for (const crossing of exports.cargoCrossings) {
        const d = Math.abs(x - crossing.x);
        if (d < 15.8)
            return .80 * (1 - smooth((d - 7.21) / 8.59));
    }
    return 0;
}
function cargoFootbridgeFloor(x, z) {
    const b = exports.cargoFootbridge;
    if (Math.abs(x - b.x) > b.halfWidth || z < b.north || z > b.south)
        return null;
    if (z < b.up)
        return b.deck * (z - b.north) / (b.up - b.north);
    if (z <= b.down)
        return b.deck;
    return b.deck - (b.deck + .72) * (z - b.down) / (b.south - b.down);
}
const gates = exports.cargoCrossingSigns.map(c => [-1, 1].map(side => ({ x: c.x + side * c.roadWidth * .25, z: exports.cargoTrack.z + side * 5.15, w: c.roadWidth * .5, d: .20, top: 1.70 })));
const blank = { serial: 0, active: false, position: start, speed: 0, next: 0, hold: 0 };
class CargoRail {
    state = { ...blank };
    lastPosition = Infinity;
    bodies = [];
    closed = [];
    closedCrossings = [false, false, false, false];
    get position() { return this.state.position; }
    get speed() { return this.state.speed; }
    get poses() { return this.bodies; }
    get barriers() { return this.closed; }
    get passage() {
        const s = this.state;
        const waiting = s.active && s.hold > 0 && s.next > 0 && Math.abs(s.position - stopAt(s.next - 1)) < .06 ? s.next - 1 : -1;
        const tie = (i) => !s.active || i < s.next ? waiting === i ? 0 : -1 :
            Math.ceil(Math.max(0, stopAt(i) - s.position) / cruise + s.hold + (i - s.next) * (dwell + 3.5) + 2.3);
        return { serial: s.serial, active: s.active, stop: waiting, next: s.active ? s.next : -1, eta: [tie(0), tie(1), tie(2)] };
    }
    save() { return { ...this.state }; }
    restore(raw) {
        this.state = raw?.active ? {
            serial: Math.round(bound(finite(raw.serial, 1), 1, 999999)), active: true,
            position: bound(finite(raw.position, start), start, finish), speed: bound(finite(raw.speed, 0), 0, cruise),
            next: Math.round(bound(finite(raw.next, 0), 0, exports.cargoCrossings.length)), hold: bound(finite(raw.hold, 0), 0, dwell)
        } : { ...blank, serial: Math.round(bound(finite(raw?.serial, 0), 0, 999999)) };
        this.sync();
    }
    launch(from = 0) {
        if (this.state.active)
            return false;
        const next = bound(Math.trunc(finite(from, 0)), 0, exports.cargoCrossings.length - 1);
        this.state = { serial: this.state.serial + 1, active: true, position: next ? stopAt(next) - 63 : start, speed: 0, next, hold: 2.5 };
        this.sync();
        return true;
    }
    tick(dt, cars, people) {
        if (!this.state.active || !Number.isFinite(dt) || dt <= 0)
            return;
        const s = this.state, step = Math.min(dt, .1);
        if (s.hold > 0) {
            s.hold = Math.max(0, s.hold - step);
            return;
        }
        const target = s.next < exports.cargoCrossings.length ? stopAt(s.next) : finish, remaining = target - s.position;
        const nose = s.position + firstGap;
        const vehicle = cars.some(c => !c.carriedBy && c.x < exports.cargoShed.west + 2 && c.x >= nose - 2 && c.x <= nose + 38 && Math.abs(c.z - exports.cargoTrack.z) < 3.6 && Math.abs(c.y ?? 0) < 2.35);
        const pedestrian = people.some(p => p.x < exports.cargoShed.west + 2 && p.x >= nose - .42 && p.x <= nose + 38 && Math.abs(p.z - exports.cargoTrack.z) < 1.75 && (p.y ?? 0) < 4.16);
        const stopIn = vehicle || pedestrian ? Math.min(remaining, 2.5) : remaining;
        const goal = Math.min(cruise, Math.sqrt(Math.max(0, 2 * brake * stopIn)));
        s.speed = vehicle || pedestrian ? Math.max(0, s.speed - step * 13) : s.speed + bound(goal - s.speed, -brake * step, acceleration * step);
        const advance = Math.min(remaining, s.speed * step);
        if (advance > 0)
            s.position += advance;
        if (remaining <= .03 || advance === remaining) {
            s.position = target;
            s.speed = 0;
            if (s.next < exports.cargoCrossings.length) {
                s.next++;
                s.hold = dwell;
            }
            else
                s.active = false;
        }
        if (advance > 0 || !s.active)
            this.sync();
    }
    blocksTraffic(c) {
        if (!this.state.active || Math.abs(Math.cos(c.yaw)) < .66)
            return false;
        const along = -Math.cos(c.yaw) * (exports.cargoTrack.z - c.z);
        return along > 4.2 && along < 14 && exports.cargoCrossingSigns.some((q, i) => this.closedCrossings[i] && Math.abs(c.x - q.x) < q.roadWidth * .5 + .35);
    }
    hazard(p) {
        const s = this.state, side = p.z < exports.cargoTrack.z ? -1 : 1;
        if (!s.active || p.x > exports.cargoShed.west || Math.abs(p.z - exports.cargoTrack.z) > 5 || (p.y ?? 0) > 3.75 || p.x < s.position - lastGap - 1.6 || p.x > s.position + firstGap + 9.3)
            return null;
        return { x: p.x, z: exports.cargoTrack.z + 3.85 * side };
    }
    soundAt(p) {
        const s = this.state;
        if (!s.active || Math.abs(p.z - exports.cargoTrack.z) > 85)
            return null;
        const x = bound(p.x, s.position - lastGap, s.position + firstGap), z = exports.cargoTrack.z;
        const distance = Math.hypot(x - p.x, z - p.z);
        if (distance >= 83)
            return null;
        const yaw = p.yaw ?? 0, pan = bound(((x - p.x) * Math.cos(yaw) - (z - p.z) * Math.sin(yaw)) / Math.max(5, distance), -1, 1);
        const crossing = exports.cargoCrossingSigns.some((c, i) => this.closedCrossings[i] && Math.hypot(c.x - p.x, z - p.z) < 36);
        return { x, z, speed: s.speed, distance, pan, crossing, position: s.position };
    }
    sync() {
        const s = this.state;
        if (!s.active) {
            this.lastPosition = Infinity;
            this.bodies = [];
            this.closed = [];
            this.closedCrossings.fill(false);
            return;
        }
        const x = s.position;
        if (x === this.lastPosition)
            return;
        this.lastPosition = x;
        this.bodies = exports.cargoWagons.map(w => {
            const at = x - w.offset, left = cargoGrade(at - w.length * .34), right = cargoGrade(at + w.length * .34);
            return { x: at, y: (left + right) / 2 + .105, z: exports.cargoTrack.z, pitch: Math.atan2(right - left, w.length * .68), w: w.length + .15, d: w.width, top: Math.max(left, right) + w.height + .20, inShed: at - w.length * .5 > exports.cargoTrack.east + .24 };
        });
        this.closed = [];
        exports.cargoCrossingSigns.forEach((c, i) => {
            const blocked = c.x >= x - lastGap - 8 && c.x <= x + firstGap + 43;
            this.closedCrossings[i] = blocked;
            if (blocked)
                this.closed.push(...gates[i]);
        });
    }
}
exports.CargoRail = CargoRail;
