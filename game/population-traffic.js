"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrafficPopulation = exports.populationCar = void 0;
const population_profile_js_1 = require("./population-profile.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const world_layout_js_1 = require("./world-layout.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const city_timetables_js_1 = require("./city-timetables.js");
const carId = /^population-car-(\d{1,7})$/;
const stockId = /^(?:traffic-[1-4]|outer-\d+|region-[a-z]+-(?:in|out))$/;
const colors = ['#5d7987', '#97836a', '#a06159', '#556e62', '#8a969e', '#6c647e'];
const kinds = ['hatch', 'sedan', 'van', 'hatch', 'taxi', 'wagon', 'sedan', 'van', 'hatch', 'sedan'];
const loads = [world_layout_js_1.places.market, world_layout_js_1.places.depot, { x: -23, z: 103 }, { x: -782, z: -89 }, { x: 167, z: 684 }];
const servicePhases = ['approach', 'pull-in', 'unload', 'merge', 'done'];
const serviceValid = (s, l) => s && servicePhases.includes(s.phase) &&
    [s.s, s.merge, s.until, s.bay?.x, s.bay?.z, s.bay?.yaw].every(Number.isFinite) && s.s >= 0 && s.s < l.length && s.merge >= 0 && s.merge < l.length;
const populationCar = (car) => carId.test(car.id);
exports.populationCar = populationCar;
function ordinaryStock(car) { return stockId.test(car.id); }
function protectedCar(car, at) {
    const gear = car.systems;
    return car.police || !car.auto || car.health < 99.99 || car.carriedBy !== undefined || car.returning || car.impactRecovery ||
        car.bypass || car.siding || car.yielding || (car.trafficStalledUntil ?? 0) > at || (car.trafficHazardUntil ?? 0) > at ||
        (car.scrapes?.length ?? 0) > 0 || (gear?.patina?.length ?? 0) > 0 || Object.keys(gear?.dents ?? {}).length > 0 || !!gear?.punctures ||
        (!!gear && (!gear.leftLamp || !gear.rightLamp || gear.leftMirror || gear.rightMirror));
}
function serviceBay(c, l, entry, exit, fits) {
    const market = require("./canal-walk.js").marketBay;
    const stop = l.nearest({ x: market.stopX, z: market.centreZ });
    if (stop.d < 5 && l.wrap(stop.s - entry) > 14 && l.wrap(stop.s-entry) < l.wrap(exit-entry)-14) {
        const at = l.wrap(stop.s-3.8), start = l.at(at), merge = l.wrap(stop.s+5.5), end = l.at(merge);
        const bay = { x:market.stopX, z:market.centreZ, yaw:-Math.PI/2 };
        if (Math.abs(start.yaw-bay.yaw)<.15 && [start,end].every(p=>[.2,.45,.7,1].every(t=>
            fits(c,{x:p.x+(bay.x-p.x)*t,z:p.z+(bay.z-p.z)*t,yaw:bay.yaw}))))
            return {s:at,merge,bay,phase:'approach',until:0};
    }
    for (const load of loads) {
        const at = l.nearest(load), progress = l.wrap(at.s - entry), journey = l.wrap(exit - entry);
        if (at.d > 18 || progress < 12 || progress > journey - 12)
            continue;
        for (const shift of [0, -7, 8, -14, 15]) {
            const s = l.wrap(at.s + shift), from = l.at(s), end = l.at(s + 9);
            if (Math.abs((0, sim_navigation_js_1.wrapAngle)(end.yaw - from.yaw)) > .18 || Math.abs((0, sim_navigation_js_1.wrapAngle)(l.at(s - 5).yaw - from.yaw)) > .18)
                continue;
            if (world_layout_js_1.signalPositions.some(p => (0, sim_navigation_js_1.dist)(from, p) < 18) || cargo_rail_js_1.cargoCrossings.some(p => Math.abs(from.x - p.x) < 8 && Math.abs(from.z - cargo_rail_js_1.cargoTrack.z) < 22))
                continue;
            const co = Math.cos(from.yaw), si = Math.sin(from.yaw);
            for (const side of [1, -1]) {
                const bay = { x: from.x - si * 3 + side * co * 3.45, z: from.z - co * 3 - side * si * 3.45, yaw: from.yaw };
                if (![from, end].every(p => [.24, .52, .78, 1].every(t => fits(c, { x: (0, sim_navigation_js_1.lerp)(p.x, bay.x, t), z: (0, sim_navigation_js_1.lerp)(p.z, bay.z, t), yaw: from.yaw }))))
                    continue;
                return { s, merge: l.wrap(s + 9), bay, phase: 'approach', until: 0 };
            }
        }
    }
}
function portals(frame, cars, serial, kind) {
    const occupied = new Map();
    for (const c of cars)
        if (c.auto && (0, sim_navigation_js_1.dist)(c, frame) < frame.radius + 35)
            occupied.set(c.lane, (occupied.get(c.lane) ?? 0) + 1);
    const candidates = [];
    for (let index = 0; index < sim_navigation_js_1.lanes.length; index++) {
        const lane = sim_navigation_js_1.lanes[index], local = lane.nearest(frame);
        if (local.d >= frame.radius * .96)
            continue;
        const ranks = kind === 'taxi' ? city_timetables_js_1.taxiRanks.filter(rank => (0, sim_navigation_js_1.dist)(rank, frame) < frame.radius + 35).map(rank => lane.nearest(rank)).filter(rank => rank.d < .85) : [];
        for (const offset of [43, 53, 66, 80, 94, 109]) {
            const approach = offset + serial % 8;
            if (approach + 49 > lane.length * .85)
                continue;
            const s = lane.wrap(local.s - approach), pose = lane.at(s);
            if (!(0, population_profile_js_1.populationCanEnter)(frame, pose, 36, 124))
                continue;
            if (cars.some(c => (c.x - pose.x) ** 2 + (c.z - pose.z) ** 2 < 8.5 ** 2))
                continue;
            if (world_layout_js_1.signalPositions.some(p => (0, sim_navigation_js_1.dist)(p, pose) < 13) || cargo_rail_js_1.cargoCrossings.some(p => Math.abs(p.x - pose.x) < 8 && Math.abs(pose.z - cargo_rail_js_1.cargoTrack.z) < 18))
                continue;
            const central = (frame.district === 'Рынок «Спектр»' || frame.district === 'Трамвайное депо') && index < 2;
            const rankDistance = ranks.reduce((closest, rank) => {
                const progress = lane.wrap(rank.s - s);
                return progress > 12 && progress < Math.min(278, lane.length * .88) ? Math.min(closest, progress) : closest;
            }, Infinity);
            const ordinaryLength = lane.wrap(local.s + frame.radius + 8 + serial % 13 - s);
            const rankOnTrip = Number.isFinite(rankDistance);
            const exit = lane.wrap(s + (rankOnTrip ? Math.max(ordinaryLength, rankDistance + 17) : ordinaryLength));
            candidates.push({ lane: index, s, exit, pose, score: offset + local.d * .73 + (occupied.get(index) ?? 0) * 8 + (central ? -10 : 0) - (rankOnTrip ? 104 : 0) });
        }
    }
    return candidates.sort((a, b) => a.score - b.score);
}
class TrafficPopulation {
    dormantStock = new Set();
    nextUpdate = 0;
    nextID = 1;
    lastLimit = -1;
    save() {
        return this.dormantStock.size ? { stock: [...this.dormantStock] } : undefined;
    }
    restore(saved) {
        this.dormantStock = new Set(Array.isArray(saved?.stock) ? saved.stock.filter(id => typeof id === 'string' && stockId.test(id)).slice(0, 90) : []);
        this.nextUpdate = 0;
        this.nextID = 1;
        this.lastLimit = -1;
    }
    restoreStock(car, saved) {
        return !this.dormantStock.has(car.id) || !!saved;
    }
    restoreVehicles(source) {
        const result = [];
        const ids = new Set();
        for (const c of source) {
            const serial = typeof c?.id === 'string' ? carId.exec(c.id) : null;
            if (!serial || ids.has(c.id) || !Object.hasOwn(vehicle_cabin_js_1.specs, c.kind) ||
                ![c.x, c.y, c.z, c.yaw, c.vx, c.vz, c.speed, c.s].every(Number.isFinite))
                continue;
            const lane = sim_navigation_js_1.lanes[c.lane];
            if (!lane)
                continue;
            const trip = c.populationTrip;
            if (trip && (trip.lane !== c.lane || ![trip.entry, trip.exit, trip.entered].every(Number.isFinite) ||
                (trip.service && !serviceValid(trip.service, lane))))
                delete c.populationTrip;
            c.s = lane.wrap(c.s);
            c.police = false;
            ids.add(c.id);
            result.push(c);
            this.nextID = Math.max(this.nextID, Number(serial[1]) + 1);
        }
        return result;
    }
    update(frame, cars, create, fits, linked, deferred) {
        if (frame.traffic === this.lastLimit && frame.elapsed < this.nextUpdate)
            return false;
        this.lastLimit = frame.traffic;
        this.nextUpdate = frame.elapsed + [.75, 1.20, 2.30][frame.pressure];
        const local = (c) => !c.police && !c.carriedBy && (c.auto || c.returning) && (0, sim_navigation_js_1.dist)(c, frame) < frame.radius;
        let count = cars.filter(local).length, dynamic = cars.filter(exports.populationCar).length, changed = false;
        let removed = 0;
        for (let i = cars.length - 1; i >= 0; i--) {
            const car = cars[i], generated = (0, exports.populationCar)(car), distance = (0, sim_navigation_js_1.dist)(car, frame), trip = car.populationTrip;
            if (!generated && !ordinaryStock(car) || protectedCar(car, frame.elapsed) || linked(car) || this.servicing(car))
                continue;
            const lane = trip && trip.lane === car.lane ? sim_navigation_js_1.lanes[trip.lane] : undefined;
            const arrived = !!(trip && lane && lane.wrap(car.s - trip.entry) >= lane.wrap(trip.exit - trip.entry));
            const over = count > frame.traffic && distance < frame.radius;
            const spent = generated && (distance > 176 || (distance > frame.radius + 5 && arrived && frame.elapsed - trip.entered > 7));
            if (!spent && !over || !(0, population_profile_js_1.populationCanLeave)(frame, car, spent ? 51 : 38))
                continue;
            if (!spent && car.braking && Math.abs(car.speed) < .75)
                continue;
            if (local(car))
                count--;
            if (generated)
                dynamic--;
            else
                this.dormantStock.add(car.id);
            cars.splice(i, 1);
            changed = true;
            if (++removed >= 2)
                break;
        }
        if (frame.traffic <= count || dynamic >= 38 || cars.length >= 170)
            return changed;
        count += cars.filter(c => {
            const trip = c.populationTrip, lane = sim_navigation_js_1.lanes[c.lane];
            if (!trip || !lane || !c.auto || local(c) || (0, sim_navigation_js_1.dist)(c, frame) > 125 || frame.elapsed - trip.entered > 25)
                return false;
            const target = lane.nearest(frame);
            return target.d < frame.radius && lane.wrap(target.s - c.s) < 116;
        }).length;
        if (count >= frame.traffic)
            return changed;
        const serial = this.nextID, kind = kinds[(serial - 1) % kinds.length];
        for (const p of portals(frame, cars, serial, kind)) {
            if (deferred(p.lane, p.s, p.pose))
                continue;
            const car = create('population-car-' + serial, kind, p.lane, p.s, colors[serial % colors.length]);
            if (!fits(car, p.pose) || !fits(car, sim_navigation_js_1.lanes[p.lane].at(p.s + 2.4)))
                continue;
            this.nextID++;
            car.speed = 3.2;
            car.y = (0, world_layout_js_1.groundHeight)(car.x, car.z);
            car.populationTrip = { lane: p.lane, entry: p.s, exit: p.exit, entered: frame.elapsed };
            if (car.kind === 'van') {
                const service = serviceBay(car, sim_navigation_js_1.lanes[p.lane], p.s, p.exit, fits);
                if (service) {
                    car.populationTrip.service = service;
                    const kit = (0, vehicle_road_js_1.equipment)(car);
                    kit.cargo = 'crate';
                    kit.load = 65;
                }
            }
            cars.push(car);
            return true;
        }
        return changed;
    }
    servicing(car) {
        const phase = car.populationTrip?.service?.phase;
        return phase === 'pull-in' || phase === 'unload' || phase === 'merge';
    }
    speedLimit(car, _elapsed) {
        const trip = car.populationTrip, job = trip?.service;
        if (!trip || !job || job.phase !== 'approach' || trip.lane !== car.lane)
            return Infinity;
        const gap = sim_navigation_js_1.lanes[car.lane].difference(car.s, job.s);
        return gap >= 0 && gap <= 16 ? Math.sqrt(Math.max(.36, 3.1 * (gap - .44))) : Infinity;
    }
    stepService(car, elapsed, dt, fits) {
        const trip = car.populationTrip, job = trip?.service;
        if (!job || !trip || job.phase === 'done')
            return false;
        if (trip.lane !== car.lane) {
            job.phase = 'done';
            return false;
        }
        const lane = sim_navigation_js_1.lanes[trip.lane];
        if (job.phase === 'approach') {
            const gap = lane.difference(car.s, job.s);
            if (gap > .75 || gap < -1 || car.speed > 1.35)
                return false;
            const { x, z, yaw } = job.bay, start = lane.at(car.s);
            if (![.28, .55, .78, 1].every(t => fits((0, sim_navigation_js_1.lerp)(start.x, x, t), (0, sim_navigation_js_1.lerp)(start.z, z, t), yaw))) {
                job.phase = 'done';
                return false;
            }
            job.phase = 'pull-in';
        }
        if (job.phase === 'unload') {
            if (elapsed < job.until)
                return true;
            const kit = (0, vehicle_road_js_1.equipment)(car);
            kit.boot = false;
            kit.cargo = 'empty';
            kit.load = 0;
            job.phase = 'merge';
        }
        const leaving = job.phase === 'merge', target = leaving ? lane.at(job.merge) : job.bay;
        const gap = (0, sim_navigation_js_1.dist)(car, target), moving = Math.min(gap, 2 * dt), t = gap > .001 ? moving / gap : 1;
        const yaw = target.yaw + (0, sim_navigation_js_1.clamp)((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(car, target) - target.yaw), -.38, .38) * Math.min(1, gap / 1.7);
        const x = (0, sim_navigation_js_1.lerp)(car.x, target.x, t), z = (0, sim_navigation_js_1.lerp)(car.z, target.z, t);
        car.speed = car.vx = car.vz = 0;
        car.braking = true;
        if (!fits(x, z, yaw))
            return true;
        Object.assign(car, { x, z, yaw, y: (0, world_layout_js_1.groundHeight)(x, z), speed: moving / dt });
        car.wheel += moving / vehicle_cabin_js_1.specs[car.kind].r;
        if (gap <= .055) {
            car.speed = 0;
            if (leaving) {
                car.s = job.merge;
                job.phase = 'done';
            }
            else {
                job.phase = 'unload';
                job.until = elapsed + 9.5;
                (0, vehicle_road_js_1.equipment)(car).boot = true;
            }
        }
        return true;
    }
}
exports.TrafficPopulation = TrafficPopulation;
