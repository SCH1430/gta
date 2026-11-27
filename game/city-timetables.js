"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedestrianCrossings = exports.CityTraffic = exports.trafficDuties = exports.taxiPassengers = exports.taxiRanks = void 0;
exports.dutyLane = dutyLane;
exports.cityCrossingHold = cityCrossingHold;
const city_clock_js_1 = require("./city-clock.js");
const region_traffic_js_1 = require("./region-traffic.js");
const region_layout_js_1 = require("./region-layout.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const collision_js_1 = require("./collision.js");
const city_life_layout_js_1 = require("./city-life-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const world_layout_js_1 = require("./world-layout.js");
exports.taxiRanks = [
    { id: 'canal', x: -27, z: 31.95, signX: -29.1, signZ: 37.2, name: 'Канальная улица', at: 'depot' },
    { id: 'depot', x: 23, z: 31.95, signX: 21.4, signZ: 37.2, name: 'Трамвайное кольцо', at: 'canal' },
    { id: 'port', x: 13, z: 110.05, signX: 14.8, signZ: 104.1, name: 'Речной вокзал', at: 'embankment' },
    { id: 'embankment', x: -21, z: 110.05, signX: -19.1, signZ: 104.1, name: 'Южная набережная', at: 'port' },
    { id: 'north', x: -21, z: -655.05, signX: -22.6, signZ: -649.2, name: 'Северный посёлок', at: 'arena' },
    { id: 'arena', x: 15, z: -655.05, signX: 13.4, signZ: -649.2, name: 'Ледовая арена', at: 'north' },
    { id: 'cargo', x: -792, z: -101.05, signX: -793.6, signZ: -95.4, name: 'Красный перегон', at: 'sorting' },
    { id: 'sorting', x: -748, z: -101.05, signX: -749.6, signZ: -95.4, name: 'Сортировочная', at: 'cargo' }
];
exports.taxiPassengers = exports.taxiRanks.filter((_, index) => index % 2 === 0).map(rank => ({ id: 'call-cab-' + rank.id, x: rank.signX - .4, z: rank.signZ + .25 }));
exports.trafficDuties = [
    { id: 'dispatch-taxi-canal', kind: 'taxi', x: -44, z: 31.95, color: '#c0a85f', lane: 0 },
    { id: 'dispatch-taxi-port', kind: 'taxi', x: 33, z: 110.05, color: '#c8a969', lane: 7 },
    { id: 'dispatch-taxi-north', kind: 'taxi', x: -51, z: -655.05, color: '#bd9e63' },
    { id: 'dispatch-taxi-cargo', kind: 'taxi', x: -830, z: -101.05, color: '#c5a463' },
    { id: 'snow-utility-port', kind: 'utility', x: 42, z: 113.95, color: '#b88659' },
    { id: 'snow-utility-yard', kind: 'utility', x: -36, z: 30, color: '#b38861' },
    { id: 'snow-utility-forest', kind: 'utility', x: 229, z: 686, color: '#bf8c63' }
];
const taxiRankFor = new Map(exports.taxiPassengers.map((p, index) => [p.id, exports.taxiRanks[index * 2]]));
const shiftWalks = new Map(region_layout_js_1.regionSites.slice(4).map((site, index) => ['region-' + site.id + '-walker-0', region_traffic_js_1.regionalWalks[index + 4]]));
function dutyLane(pose) {
    if (pose.lane !== undefined)
        return { laneIndex: pose.lane, s: sim_navigation_js_1.lanes[pose.lane].nearest(pose).s };
    let laneIndex = 0, s = 0, d = Infinity;
    sim_navigation_js_1.lanes.forEach((lane, index) => {
        const q = lane.nearest(pose);
        if (q.d < d) {
            d = q.d;
            laneIndex = index;
            s = q.s;
        }
    });
    return { laneIndex, s };
}
class CityTraffic {
    taxis = new WeakMap();
    stops = new Map();
    hornEcho = new WeakMap();
    curbInspections = new WeakMap();
    bays = new Map();
    rides = new WeakMap();
    passengers = new WeakMap();
    waitingAt = new WeakMap();
    clearedUntil = new WeakMap();
    activeSnow = new Map();
    clearDay = -1;
    laneStops(index) {
        let stops = this.stops.get(index);
        if (!stops) {
            const lane = sim_navigation_js_1.lanes[index];
            stops = lane ? exports.taxiRanks.flatMap(rank => {
                const p = lane.nearest(rank);
                return p.d < .85 ? [{ rank, s: p.s }] : [];
            }) : [];
            this.stops.set(index, stops);
        }
        return stops;
    }
    speedLimit(car, time, minutes = (0, city_clock_js_1.districtMinutes)(time), repair) {
        let limit = Infinity;
        const midnight = minutes >= 21 * 60 || minutes < 6 * 60;
        if (car.kind === 'taxi') {
            const lane = sim_navigation_js_1.lanes[car.lane];
            for (const { rank, s } of this.laneStops(car.lane)) {
                const gap = lane.difference(car.s, s);
                if (gap < -4.5 || gap > 20)
                    continue;
                let state = this.taxis.get(car);
                if (!state || state.rank !== rank || state.released && gap > 3) {
                    state = { rank, since: 0, until: 0, released: false };
                    this.taxis.set(car, state);
                }
                if (state.released)
                    continue;
                if (state.until === 0 && gap <= .65 && Math.abs(car.speed) < .60) {
                    state.since = time;
                    state.until = time + (midnight ? 5.2 : minutes >= 6 * 60 && minutes < 9 * 60 ? 8.7 : 7.2);
                    this.bays.set(rank, { t: time, car });
                }
                if (state.until > time)
                    return 0;
                if (state.until > 0) {
                    state.released = true;
                    continue;
                }
                if (gap >= 0) {
                    limit = Math.min(limit, Math.sqrt(Math.max(0, 2.65 * (gap - .32))));
                    break;
                }
            }
        }
        const inspection = this.curbInspections.get(car);
        if ((inspection?.health ?? 100) - car.health > 1.1 && Math.abs(car.speed) < 1.15) {
            this.curbInspections.set(car, { health: car.health, until: time + 6.2 });
            limit = 0;
        }
        else if (inspection && inspection.until > time)
            limit = 0;
        if (car.kind === 'utility') {
            const last = this.clearedUntil.get(car) ?? -1;
            if (time - last > .18) {
                this.clearedUntil.set(car, time);
                this.plough(car, time, minutes);
            }
            limit = Math.min(limit, minutes >= 2 * 60 && minutes <= 7 * 60 ? 4.1 : 6.8);
        }
        if (repair && (0, sim_navigation_js_1.dist)(car, repair) < 15)
            limit = Math.min(limit, 2.6);
        return limit;
    }
    isInspecting(car, time) {
        const inspect = this.curbInspections.get(car);
        return !!inspect && inspect.until > time;
    }
    inspectionProgress(car, time) {
        const inspect = this.curbInspections.get(car);
        return inspect && inspect.until > time ? Math.max(0, 1 - (inspect.until - time) / 6.2) : null;
    }
    replyToHorn(car, source, honkedAt, elapsed) {
        if (!source || source === car || car.police || !car.auto || elapsed - honkedAt > 1.1 || (0, sim_navigation_js_1.dist)(car, source) > 16)
            return null;
        const dx = car.x - source.x, dz = car.z - source.z, along = -dx * Math.sin(source.yaw) - dz * Math.cos(source.yaw);
        if (along < .3 || Math.abs(dx * Math.cos(source.yaw) - dz * Math.sin(source.yaw)) > 3.8)
            return null;
        const temper = [...car.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3;
        if (temper === 0) {
            if (this.hornEcho.get(car) === honkedAt)
                return null;
            this.hornEcho.set(car, honkedAt);
            return 'reply';
        }
        return temper === 1 ? 'ease' : 'hold';
    }
    commuter(p, minutes, time, cars = []) {
        const rank = this.waitingAt.get(p) ?? taxiRankFor.get(p.id);
        if (rank) {
            const waiting = minutes < 9 * 60 || minutes >= 16 * 60 && minutes <= 22 * 60;
            const ride = this.rides.get(p);
            if (ride) {
                const stop = this.taxis.get(ride.car);
                const atStop = stop && stop.until > time && stop.rank !== ride.from && (stop.rank.id === ride.from.at || time - ride.boarded > 75);
                if (atStop || !ride.car.auto || ride.car.health <= 6 || cars.length && !cars.includes(ride.car)) {
                    const drop = (0, collision_js_1.toWorld)(ride.car, (0, vehicle_cabin_js_1.carCabin)('taxi').halfWidth + .47, vehicle_cabin_js_1.specs.taxi.rear * .50);
                    const dest = atStop ? stop.rank : ride.from;
                    p.x = drop.x;
                    p.z = drop.z;
                    p.y = (0, world_layout_js_1.groundHeight)(p.x, p.z);
                    p.cab = undefined;
                    p.onboard = false;
                    p.speed = 0;
                    p.againAt = time + 75;
                    this.rides.delete(p);
                    this.passengers.delete(ride.car);
                    this.waitingAt.set(p, dest);
                    return { x: dest.signX, z: dest.signZ };
                }
                p.x = ride.car.x;
                p.z = ride.car.z;
                p.y = ride.car.y + .52;
                p.yaw = ride.car.yaw;
                p.speed = 0;
                return p;
            }
            if (p.cab || p.onboard) {
                p.cab = undefined;
                p.onboard = false;
                p.x = rank.signX;
                p.z = rank.signZ;
                p.y = (0, world_layout_js_1.groundHeight)(p.x, p.z);
            }
            if ((p.againAt ?? 0) > time)
                return { x: rank.signX, z: rank.signZ };
            const arrival = this.bays.get(rank), state = arrival && this.taxis.get(arrival.car);
            if (waiting && arrival?.car.auto && state && state.until > time && state.rank === rank && !this.passengers.get(arrival.car)) {
                const door = (0, collision_js_1.toWorld)(arrival.car, (0, vehicle_cabin_js_1.carCabin)('taxi').halfWidth + .42, vehicle_cabin_js_1.specs.taxi.rear * .50);
                if ((0, sim_navigation_js_1.dist)(p, door) < .36) {
                    this.rides.set(p, { car: arrival.car, from: rank, boarded: time });
                    this.passengers.set(arrival.car, p);
                    p.cab = arrival.car.id;
                    p.onboard = true;
                    p.speed = 0;
                }
                return door;
            }
            return { x: rank.signX + (waiting ? -.4 : -2.6), z: rank.signZ + .25 };
        }
        const route = shiftWalks.get(p.id);
        if (!route)
            return null;
        const night = minutes >= 21 * 60 || minutes < 5 * 60, morning = minutes >= 5 * 60 && minutes < 9 * 60;
        if (morning)
            return { x: route[0].x + 3.9, z: route[0].z + 1.0 };
        if (night)
            return { x: route[1].x - 3.2, z: route[1].z + .90 };
        return null;
    }
    cabDoor(car, elapsed) {
        const stop = this.taxis.get(car);
        return !!stop && stop.until > elapsed && elapsed - stop.since < 5.6;
    }
    plough(car, time, minutes = (0, city_clock_js_1.districtMinutes)(time)) {
        if (Math.abs(car.speed) < 1.15 || !(car.systems?.plough || car.auto && minutes >= 2 * 60 && minutes < 7 * 60))
            return;
        const day = Math.floor((1065 + Math.floor(time / 2)) / 1440);
        this.resetSnowDay(day);
        const co = Math.cos(car.yaw), si = Math.sin(car.yaw), nose = vehicle_cabin_js_1.specs[car.kind].front;
        const x = car.x + nose * si, z = car.z + nose * co;
        for (const [index, yard] of city_life_layout_js_1.winterYards.entries()) {
            const q = yardFrame(x, z, yard);
            if (Math.abs(q.x) > yard.w * .5 + 1 || Math.abs(q.z) > yard.d * .5 + 1)
                continue;
            this.activeSnow.set(index, Math.max(this.activeSnow.get(index) ?? 0, 1));
        }
    }
    resetSnowDay(day) {
        if (day !== this.clearDay) {
            this.activeSnow.clear();
            this.clearDay = day;
        }
    }
    yardCover(index, time, minutes = (0, city_clock_js_1.districtMinutes)(time)) {
        this.resetSnowDay(Math.floor((1065 + Math.floor(time / 2)) / 1440));
        const scheduled = minutes >= 22 * 60 || minutes < 6 * 60 ? 1 : minutes < 9 * 60 ? Math.max(0, 1 - (minutes - 360) / 180) : 0;
        return Math.max(0, scheduled - (this.activeSnow.get(index) ?? 0));
    }
    snowGrip(p, time, minutes = (0, city_clock_js_1.districtMinutes)(time)) {
        for (const [i, yard] of city_life_layout_js_1.winterYards.entries()) {
            if ((p.x - yard.x) ** 2 + (p.z - yard.z) ** 2 > 350)
                continue;
            const q = yardFrame(p.x, p.z, yard);
            if (Math.abs(q.x) < yard.w * .5 && Math.abs(q.z) < yard.d * .5)
                return 1 - .30 * this.yardCover(i, time, minutes);
        }
        return 1;
    }
}
exports.CityTraffic = CityTraffic;
function yardFrame(x, z, yard) {
    const dx = x - yard.x, dz = z - yard.z, co = Math.cos(yard.yaw), si = Math.sin(yard.yaw);
    return { x: dx * co - dz * si, z: dx * si + dz * co };
}
exports.pedestrianCrossings = region_traffic_js_1.regionalWalks.flatMap((route, i) => {
    const { z } = region_layout_js_1.regionSites[i].stop;
    const other = route[2].z;
    return [route[0].x, route[1].x].map(x => ({ x, z: (z + other) / 2, length: Math.abs(z - other) }));
});
function cityCrossingHold(p, goal, cars) {
    if (Math.abs(goal.x - p.x) > 1.15 || Math.abs(goal.z - p.z) < .45)
        return false;
    for (const cross of exports.pedestrianCrossings) {
        if (Math.abs(p.x - cross.x) > .95 || Math.abs(p.z - cross.z) > cross.length * .54 || Math.abs(p.z - cross.z) < 2.55)
            continue;
        if ((goal.z - cross.z) * (p.z - cross.z) >= 0)
            continue;
        for (const car of cars) {
            if (Math.abs(car.z - cross.z) > 5.1 || Math.abs(car.x - cross.x) > 23)
                continue;
            const v = -Math.sin(car.yaw) * car.speed, gap = cross.x - car.x;
            if (Math.abs(v) > .55 && gap * v > 0 && Math.abs(gap / v) < 2.8)
                return true;
        }
    }
    return false;
}
