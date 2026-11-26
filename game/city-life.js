"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityLife = exports.districtCallout = exports.railShiftRate = exports.addedResidents = void 0;
exports.repairPose = repairPose;
exports.pullAside = pullAside;
const city_clock_js_1 = require("./city-clock.js");
const fixtures_js_1 = require("./fixtures.js");
const region_layout_js_1 = require("./region-layout.js");
const region_traffic_js_1 = require("./region-traffic.js");
const world_layout_js_1 = require("./world-layout.js");
const world_railway_js_1 = require("./world-railway.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
function ease(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function repairPose(job, time) {
    const t = time - job.start, yaw = job.yaw + Math.PI / 2;
    const offset = 11 * (1 - ease(0, 8, t)) - 11 * ease(41, 49, t);
    return { x: job.x - Math.sin(job.yaw) * 1.80 + Math.sin(yaw) * offset, z: job.z - Math.cos(job.yaw) * 1.80 + Math.cos(yaw) * offset, yaw };
}
exports.addedResidents = [
    { id: 'shop-0', x: 27.35, z: 22.55 }, { id: 'shop-1', x: 28.50, z: 22.80 }, { id: 'shop-2', x: 29.65, z: 23.05 },
    { id: 'pass-07', x: 8.48, z: -37.35 }, { id: 'pass-12', x: 8.42, z: -38.72 }, { id: 'pass-07m', x: 16.25, z: 21.90 },
    { id: 'pass-shift', x: 11.15, z: -39.36 }, { id: 'pass-shiftm', x: 21.28, z: 20.94 }
];
const railShiftRate = (minutes) => minutes >= 5 * 60 + 40 && minutes < 9 * 60 + 20 ? 1.12 : 1;
exports.railShiftRate = railShiftRate;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const counter = { x: 27.35, z: 22.55 };
const exitLoop = [{ x: 26.35, z: 23.55 }, { x: 26.35, z: 24.15 }, { x: 32.85, z: 24.15 }, { x: 32.85, z: 23.02 }];
const mechanicWalk = [{ x: -43.2, z: 45.3 }, { x: -45.85, z: 41.66 }, { x: -41.2, z: 37.05 }, { x: -41.2, z: 32.7 }, { x: -41.2, z: 22.3 }, { x: -37.8, z: 17.1 }, { x: -31.26, z: 16.56 }];
const dispatcherWalk = [{ x: 13.35, z: -38.5 }, { x: 10.72, z: -39.35 }, { x: 9.10, z: -39.30 }, { x: 8.35, z: -39.28 }];
const alleyLookout = { x: world_layout_js_1.places.hideout.x - .88, z: world_layout_js_1.places.hideout.z - .10 };
const districtCallout = (x, z) => {
    const region = (0, region_layout_js_1.regionIdAt)(x, z);
    if (region)
        return { id: (0, region_traffic_js_1.hasRegionalVoice)(region) ? 'patrol-' + region : undefined, text: region_traffic_js_1.regionalSpeech[region].patrol };
    const d = (0, world_layout_js_1.districtAt)(x, z);
    const [id, line] = d.includes('порт') ? ['port', 'Южный порт. Осмотрите площадку речного вокзала.'] :
        d.includes('канал') || d.includes('гараж') ? ['bridge', 'Шлюзовой канал. Проверяем съезды у моста.'] :
            d.includes('ТЭЦ') ? ['plant', 'Северная ТЭЦ. Проверяем улицу у градирен.'] : d.includes('Литейный') ? ['foundry', 'Литейный квартал. Осмотрите ворота третьего цеха.'] :
                d.includes('станция') ? ['station', 'Грузовая станция. Проверяем Восточную проходную.'] : d.includes('Рынок') ? ['market', 'Всем постам. Осмотрите рынок под эстакадой.'] :
                    d.includes('депо') ? ['depot', 'Кольцо у депо. Проверяем трамвайное кольцо.'] : ['yard', 'Всем постам. Проверяем двор у двадцать третьего дома.'];
    return { id: 'patrol-' + id, text: line };
};
exports.districtCallout = districtCallout;
class CityLife {
    shutter = 1;
    incidents = [];
    witnesses = {};
    meetings = new Map();
    repair = null;
    nextInspection = 0;
    save() { return { shutter: this.shutter, incidents: this.incidents, repair: this.repair, witnesses: this.witnesses, meetings: Object.fromEntries(this.meetings) }; }
    restore(s) {
        this.shutter = Number.isFinite(s?.shutter) ? Math.max(0, Math.min(1, s.shutter)) : 1;
        this.incidents = (Array.isArray(s?.incidents) ? s.incidents : []).filter(e => e && typeof e.text === 'string' && Number.isFinite(e.t)).slice(-28);
        this.witnesses = {};
        for (const [id, e] of Object.entries(s?.witnesses ?? {}))
            if (e && Number.isFinite(e.t) && typeof e.reason === 'string')
                this.witnesses[id] = e;
        this.meetings = new Map(Object.entries(s?.meetings ?? {}).filter(([id, t]) => id.length < 100 && typeof t === 'number' && Number.isFinite(t) && t >= 0).slice(-64));
        this.repair = s?.repair && Number.isFinite(s.repair.start) && fixtures_js_1.fixturesById.has(s.repair.id) ? s.repair : null;
        this.nextInspection = 0;
    }
    note(t, text) {
        this.incidents.push({ t, text });
        if (this.incidents.length > 28)
            this.incidents.shift();
    }
    greet(id, t) {
        const previous = this.meetings.get(id);
        if (previous !== undefined && t - previous < 26)
            return false;
        this.meetings.delete(id);
        this.meetings.set(id, t);
        if (this.meetings.size > 64)
            this.meetings.delete(this.meetings.keys().next().value);
        return previous !== undefined;
    }
    witness(people, at, t, reason, visible) {
        let best, min = 20;
        for (const p of people) {
            const d = distance(p, at);
            if (!p.onboard && d < min && visible(p, at)) {
                min = d;
                best = p;
            }
        }
        if (!best)
            return;
        const previous = this.witnesses[best.id];
        if (previous && t - previous.t < 7)
            return;
        this.witnesses[best.id] = { t, x: at.x, z: at.z, reason, district: (0, world_layout_js_1.districtAt)(at.x, at.z) };
    }
    updateRepair(t, broken, safe, clearBase) {
        if (this.repair) {
            if (!broken[this.repair.id]) {
                this.repair = null;
                return;
            }
            const age = t - this.repair.start;
            const holdAt = broken[this.repair.id].raisedAt === undefined ? 13 : 40;
            if (age >= holdAt && clearBase && !clearBase(this.repair)) {
                this.repair.start = t - holdAt + .001;
                return;
            }
            if (age >= 49) {
                const id = this.repair.id;
                this.repair = null;
                this.note(t, 'Горсвет · ремонт завершён');
                return id;
            }
        }
        else if (t >= this.nextInspection) {
            this.nextInspection = t + 2;
            const first = Object.entries(broken).filter(([, b]) => t - b.at >= 270).sort((a, b) => a[1].at - b[1].at)[0];
            const f = first && fixtures_js_1.fixturesById.get(first[0]);
            if (!f)
                return;
            for (const angle of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
                const job = { id: f.id, x: f.x, z: f.z, yaw: f.face + angle, start: t };
                if (safe && ![0, 3, 5, 8, 48].every(step => safe(repairPose(job, t + step))))
                    continue;
                this.repair = job;
                break;
            }
            if (!this.repair)
                return;
            this.note(t, 'Горсвет · автовышка выехала в район «' + (0, world_layout_js_1.districtAt)(f.x, f.z) + '»');
        }
    }
    goal(p, people, t, dt, rail, minutes = (0, city_clock_js_1.districtMinutes)(t)) {
        if (p.id.startsWith('shop-')) {
            p.ticket ??= Number(p.id.slice(5));
            const closed = minutes < 7 * 60 || minutes >= 22 * 60;
            if (closed || p.purchase) {
                const last = exitLoop.length - 1, i = Math.min(p.leg ?? 0, last), dest = exitLoop[i];
                const target = i === last ? { x: dest.x + (Number(p.id.slice(5)) * .68), z: dest.z } : dest;
                if (distance(p, target) < .31) {
                    if (i < last)
                        p.leg = i + 1;
                    else if (!closed && t > (p.againAt ?? 0)) {
                        p.purchase = false;
                        p.leg = 0;
                        p.ticket = Math.max(...people.map(n => n.ticket ?? 0)) + 1;
                    }
                }
                return target;
            }
            const line = people.filter(n => n.id.startsWith('shop-') && !n.purchase).sort((a, b) => (a.ticket ?? +a.id.slice(5)) - (b.ticket ?? +b.id.slice(5)));
            const index = line.indexOf(p);
            const exiting = people.some(n => n !== p && n.purchase && n.leg === 0 && distance(n, counter) < 1.30);
            const slot = index + (exiting ? 1 : 0), dest = { x: counter.x + slot * 1.15, z: counter.z + slot * .25 + (exiting ? .20 : 0) };
            if (index === 0 && distance(p, dest) < .29) {
                p.served = (p.served ?? 0) + dt;
                if (p.served >= 4.5) {
                    p.purchase = true;
                    p.served = 0;
                    p.leg = 0;
                    p.againAt = t + 35;
                }
            }
            return dest;
        }
        if (p.id.startsWith('pass-')) {
            p.platform ??= p.id.endsWith('m') ? 'market' : 'depot';
            const commuter = p.id.startsWith('pass-shift'), peak = (0, exports.railShiftRate)(minutes) > 1;
            const eligible = p.id !== 'pass-12' && (!commuter || peak), n = p.id.endsWith('m') ? 1 : 0;
            const seat = (0, world_railway_js_1.tramLocal)(rail, commuter ? -.31 : .29, commuter ? (n ? -1.80 : .31) : n ? -.65 : 1.72), door = (0, world_railway_js_1.tramLocal)(rail, 1.13, 3.34);
            if (p.platformStep) {
                const step = p.platformStep;
                step.t = Math.min(1, step.t + dt / .98);
                const second = step.t > .43, u = second ? ease(.43, 1, step.t) : ease(0, .43, step.t);
                const threshold = { ...door, y: .76 }, from = second ? threshold : step.from, to = second ? step.to : threshold;
                p.x = from.x + (to.x - from.x) * u;
                p.z = from.z + (to.z - from.z) * u;
                p.y = from.y + (to.y - from.y) * u;
                p.yaw = Math.atan2(from.x - to.x, from.z - to.z);
                p.speed = .95;
                if (step.t === 1) {
                    p.platformStep = undefined;
                    p.speed = 0;
                    if (step.leaving) {
                        p.onboard = false;
                        p.againAt = t + 30;
                    }
                }
                return p;
            }
            if (p.onboard) {
                p.x = seat.x;
                p.z = seat.z;
                p.y = 1.03;
                p.yaw = rail.yaw;
                p.speed = 0;
                if (rail.stop && rail.stop !== p.platform && rail.doors > .93) {
                    p.platform = rail.stop;
                    const place = world_railway_js_1.tramStops[rail.stop], dest = rail.stop === 'depot' ? { x: place.x + .44, z: place.z - .70 } : { x: place.x + .64, z: place.z - .33 };
                    p.platformStep = { leaving: true, t: 0, from: { ...seat, y: 1.03 }, to: { ...dest, y: 0 } };
                }
                return p;
            }
            const stop = world_railway_js_1.tramStops[p.platform];
            if (commuter && !peak)
                return p.platform === 'depot' ? { x: 11.15, z: -39.36 } : { x: 21.28, z: 20.94 };
            if (eligible && rail.service && rail.stop === p.platform && rail.doors > .96 && t > (p.againAt ?? 0)) {
                if (distance(p, stop) < (p.platform === 'market' ? 1.20 : .58)) {
                    p.onboard = true;
                    p.speed = 0;
                    p.platformStep = { leaving: false, t: 0, from: { x: p.x, y: p.y, z: p.z }, to: { ...seat, y: 1.03 } };
                }
                return stop;
            }
            const k = eligible ? (commuter ? .85 : n ? .6 : 1.35) : 2.45;
            return p.platform === 'depot' ? { x: stop.x + .85, z: stop.z - k * 1.15 } : { x: stop.x - k * 1.04, z: stop.z - .68 };
        }
        if (p.role === 'mechanic' || p.role === 'dispatcher') {
            const mechanic = p.role === 'mechanic', path = mechanic ? mechanicWalk : dispatcherWalk;
            const work = mechanic ? minutes >= 8 * 60 && minutes < 19 * 60 : minutes >= 6 * 60 && minutes < 20 * 60;
            const end = work ? 0 : path.length - 1;
            const i = Math.min(path.length - 1, Math.max(0, p.leg ?? 0));
            if (i !== end && distance(p, path[i]) < .36) {
                if (mechanic && i === 1) {
                    const open = work ? 1 : 0;
                    this.shutter += Math.sign(open - this.shutter) * Math.min(Math.abs(open - this.shutter), dt * .26);
                    if (Math.abs(this.shutter - open) > .0001)
                        return path[i];
                }
                p.leg = i + Math.sign(end - i);
            }
            return path[p.leg ?? i];
        }
        if (p.role === 'courier' && p.lookUntil !== undefined) {
            const since = t - p.lookUntil;
            if (since > .18 && since < 2.7)
                return alleyLookout;
        }
        return null;
    }
}
exports.CityLife = CityLife;
function pullAside(car, cars, dt, fits) {
    if (!car.siding) {
        if (Math.abs(car.speed) > .55) {
            car.blockedFor = 0;
            return false;
        }
        const sin = Math.sin(car.yaw), cos = Math.cos(car.yaw);
        const other = cars.find(o => {
            if (o === car || Math.cos(o.yaw - car.yaw) > -.54)
                return false;
            const dx = o.x - car.x, dz = o.z - car.z, forward = -dx * sin - dz * cos;
            return forward > 1.8 && forward < 9 && Math.abs(dx * cos - dz * sin) < 1.72;
        });
        const deadEnd = (car.blockedGeometry ?? 0) > 1.35;
        if (!other && !deadEnd) {
            car.blockedFor = 0;
            return false;
        }
        car.blockedFor = (car.blockedFor ?? 0) + dt;
        if (car.blockedFor < 1.4 || other?.siding || other?.auto && car.id < other.id)
            return false;
        for (const side of [-1, 1]) {
            const x = car.x + sin * 3.6 + side * cos * 2.65, z = car.z + cos * 3.6 - side * sin * 2.65;
            if (![.3, .65, 1].every(f => fits(car.x + (x - car.x) * f, car.z + (z - car.z) * f, car.yaw)))
                continue;
            car.siding = { other: other?.id ?? 'wall', phase: 'reverse', x, z, sx: car.x, sz: car.z, yaw: car.yaw, wait: 0 };
            break;
        }
        if (!car.siding)
            return false;
    }
    const job = car.siding, other = cars.find(o => o.id === job.other);
    if (job.phase === 'wait') {
        car.speed = 0;
        car.braking = true;
        job.wait += dt;
        const obstructed = !!other && Math.hypot(other.x - job.sx, other.z - job.sz) < 8.8;
        if (job.wait > 1.2 && (job.other === 'wall' || obstructed && job.wait > 5)) {
            const alternatives = sim_navigation_js_1.lanes.map((lane, i) => ({ lane, i, near: lane.nearest(car) })).filter(e => e.i !== car.lane && e.near.d < 13);
            alternatives.sort((a, b) => a.near.d - b.near.d);
            for (const { lane, i, near } of alternatives) {
                const out = lane.at(near.s + 4.5);
                if (Math.cos(out.yaw - job.yaw) > -.48)
                    continue;
                if (![.25, .50, .75, 1].every(f => fits(car.x + (out.x - car.x) * f, car.z + (out.z - car.z) * f, out.yaw)))
                    continue;
                job.sx = out.x;
                job.sz = out.z;
                job.yaw = out.yaw;
                job.exitLane = i;
                job.exitS = lane.wrap(near.s + 4.5);
                job.phase = 'return';
                break;
            }
        }
        if (job.phase === 'wait' && job.wait > 1.2 && (!obstructed || job.wait > 10))
            job.phase = 'return';
        return true;
    }
    const reverse = job.phase === 'reverse', x = reverse ? job.x : job.sx, z = reverse ? job.z : job.sz, d = Math.hypot(x - car.x, z - car.z);
    const u = Math.min(1, dt * 1.65 / Math.max(d, .001)), nx = car.x + (x - car.x) * u, nz = car.z + (z - car.z) * u;
    const targetYaw = reverse ? Math.atan2(x - car.x, z - car.z) : Math.atan2(car.x - x, car.z - z);
    const yaw = car.yaw + Math.atan2(Math.sin(targetYaw - car.yaw), Math.cos(targetYaw - car.yaw)) * Math.min(1, dt * 2.4);
    car.speed = 0;
    car.braking = true;
    if (fits(nx, nz, yaw)) {
        car.x = nx;
        car.z = nz;
        car.yaw = yaw;
        car.speed = reverse ? -1.65 : 1.65;
        car.wheel += car.speed * dt / .34;
        car.steer = reverse ? .6 : -.5;
    }
    if (d < .13) {
        if (reverse) {
            job.phase = 'wait';
            car.speed = 0;
        }
        else {
            car.siding = undefined;
            car.blockedFor = 0;
            car.blockedGeometry = 0;
            car.speed = 0;
            car.yaw = job.yaw;
            if (job.exitLane !== undefined && job.exitS !== undefined) {
                car.lane = job.exitLane;
                car.s = job.exitS;
            }
        }
    }
    return true;
}
