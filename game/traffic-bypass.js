"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueBypasses = exports.stalledTraffic = void 0;
exports.trafficDebrisAhead = trafficDebrisAhead;
exports.debrisInPath = debrisInPath;
exports.trafficRoadblock = trafficRoadblock;
exports.queueApproachSpeed = queueApproachSpeed;
exports.trafficIndicator = trafficIndicator;
exports.restoreTrafficManeuver = restoreTrafficManeuver;
const cargo_rail_js_1 = require("./cargo-rail.js");
const collision_js_1 = require("./collision.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const world_layout_js_1 = require("./world-layout.js");
const laneChange = 3.9, stopGap = 9.2, elapsedToSignal = .64, speedLimit = 3.2;
const lightRadius = 14;
const tramCrossings = [{ x: 5, z: -46 }, { x: 10.5, z: 28.05 }];
function protectedRoad(p) {
    if (p.z > 55 && p.z < 93)
        return true;
    if (Math.abs(p.z - cargo_rail_js_1.cargoTrack.z) < 17 && cargo_rail_js_1.cargoCrossingSigns.some(q => Math.abs(p.x - q.x) < q.roadWidth * .5 + 4))
        return true;
    return world_layout_js_1.signalPositions.some(q => Math.abs(p.x - q.x) < lightRadius && Math.abs(p.z - q.z) < lightRadius) ||
        tramCrossings.some(q => Math.abs(p.x - q.x) < 13 && Math.abs(p.z - q.z) < 8);
}
const stalledTraffic = (car, now) => car.trafficStalledUntil !== undefined && car.trafficStalledUntil > now;
exports.stalledTraffic = stalledTraffic;
function trafficDebrisAhead(car, debris, lane) {
    if (!debris.length)
        return null;
    let nearest, gap = 17;
    const width = vehicle_cabin_js_1.specs[car.kind].w;
    const along = (piece) => {
        if (lane) {
            const nearest = lane.nearest(piece);
            return nearest.d < width + piece.radius + .24 ? lane.difference(car.s, nearest.s) : Infinity;
        }
        const local = (0, collision_js_1.toLocal)(car, piece);
        return Math.abs(local.x) < width + piece.radius + .24 ? -local.z : Infinity;
    };
    for (const piece of debris) {
        if (Math.abs(piece.x - car.x) > 18 || Math.abs(piece.z - car.z) > 18 || Math.abs(piece.y - car.y) > .9)
            continue;
        const ahead = along(piece);
        if (ahead > -1.2 && ahead < gap) {
            nearest = piece;
            gap = ahead;
        }
    }
    if (!nearest)
        return null;
    let end = gap + nearest.radius;
    for (const piece of debris)
        if (piece.id === nearest.id) {
            const ahead = along(piece);
            if (Number.isFinite(ahead))
                end = Math.max(end, ahead + piece.radius);
        }
    return { id: nearest.id, gap, length: end - gap };
}
function debrisInPath(car, pose, debris) {
    if (!debris.length)
        return false;
    const y = (0, world_layout_js_1.groundHeight)(pose.x, pose.z), body = vehicle_cabin_js_1.specs[car.kind];
    for (const piece of debris) {
        if (Math.abs(piece.x - pose.x) > 5 || Math.abs(piece.z - pose.z) > 5 || Math.abs(piece.y - y) > .9)
            continue;
        const p = (0, collision_js_1.toLocal)(pose, piece);
        if (Math.abs(p.x) < body.w + piece.radius && p.z > body.front - piece.radius && p.z < body.rear + piece.radius)
            return true;
    }
    return false;
}
function trafficRoadblock(car, cars, driven, now, loose = null) {
    if (car.police || protectedRoad(car))
        return null;
    let nearest, gap = 14;
    for (const other of cars) {
        if (other === car || other.carriedBy || Math.abs(other.x - car.x) > 14 || Math.abs(other.z - car.z) > 14)
            continue;
        const { x, z } = (0, collision_js_1.toLocal)(car, other), ahead = -z;
        if (ahead > 1.5 && ahead < gap && Math.abs(x) < 1.42) {
            nearest = other;
            gap = ahead;
        }
    }
    if (loose && (!nearest || loose.gap < gap))
        return loose;
    if (!nearest || nearest.id === driven || nearest.police || nearest.siding || Math.abs(nearest.speed) > .25 ||
        (nearest.auto && !(0, exports.stalledTraffic)(nearest, now)) || Math.cos(nearest.yaw - car.yaw) < -.54)
        return null;
    const body = vehicle_cabin_js_1.specs[nearest.kind];
    return { id: nearest.id, car: nearest, gap, length: Math.max(-body.front, body.rear) };
}
function queueApproachSpeed(block) {
    return Math.max(0, (block.gap - stopGap) * 1.45);
}
function trafficIndicator(car, now) {
    if ((0, exports.stalledTraffic)(car, now) || !car.auto && !car.police && car.health <= 36 && Math.abs(car.speed) < .22)
        return 'hazard';
    const move = car.bypass;
    if (!move)
        return car.auto && (car.trafficHazardUntil ?? 0) > now ? 'hazard' : undefined;
    if (move.reverse || move.progress > move.merge - .2)
        return 'right';
    if (move.progress < move.change + .5)
        return 'left';
}
function restoreTrafficManeuver(car, lane, now) {
    const bypass = car.bypass;
    if (!Number.isFinite(car.trafficStalledUntil) || !(0, exports.stalledTraffic)(car, now) || (car.trafficStalledUntil ?? 0) > now + 60)
        delete car.trafficStalledUntil;
    if (!Number.isFinite(car.trafficHazardUntil) || (car.trafficHazardUntil ?? 0) <= now || (car.trafficHazardUntil ?? 0) > now + 2)
        delete car.trafficHazardUntil;
    if (!bypass)
        return;
    if (!lane || !car.auto || car.police || typeof bypass.blocker !== 'string' ||
        ![bypass.entry, bypass.progress, bypass.change, bypass.merge, bypass.end, bypass.readyAt, bypass.held].every(Number.isFinite) ||
        bypass.entry < 0 || bypass.entry >= lane.length || bypass.progress < 0 || bypass.progress > bypass.end ||
        bypass.change < 5.6 || bypass.change > 9 || bypass.merge < bypass.change || bypass.merge > 23 ||
        Math.abs(bypass.merge + bypass.change - bypass.end) > .001 || bypass.readyAt > now + 1.2 ||
        bypass.held < 0 || typeof bypass.reverse !== 'boolean' || (0, sim_navigation_js_1.dist)(car, bypassPose(lane, bypass, bypass.progress)) > .28)
        delete car.bypass;
}
function bypassPose(lane, move, distance) {
    const p = lane.at(move.entry + distance);
    const returning = distance > move.merge;
    const t = (0, sim_navigation_js_1.clamp)(returning ? (move.end - distance) / move.change : distance / move.change, 0, 1);
    const offset = -laneChange * t * t * (3 - 2 * t);
    const slope = -laneChange * 6 * t * (1 - t) / move.change * (returning ? -1 : 1);
    return { ...(0, collision_js_1.toWorld)(p, offset, 0), yaw: p.yaw - Math.atan(slope) };
}
function oncoming(p, c, cars, end, duration) {
    const reach = end + duration * 16 + 8;
    return cars.some(other => {
        if (other === c || other.carriedBy || Math.abs(other.x - p.x) > reach || Math.abs(other.z - p.z) > reach)
            return false;
        const against = -Math.cos(other.yaw - p.yaw) * (other.speed < -.35 ? -1 : 1);
        if (against < .64)
            return false;
        const q = (0, collision_js_1.toLocal)(p, other), along = -q.z;
        const velocity = other.auto ? Math.max(5, Math.abs(other.speed)) : Math.abs(other.speed);
        return along > -5 && along < end + duration * velocity * against + 7 && Math.abs(q.x + laneChange) < 2.05;
    });
}
function pavedPath(lane, move, car, fit, ice) {
    const origin = lane.at(move.entry), body = vehicle_cabin_js_1.specs[car.kind];
    const count = Math.ceil(move.end / .65);
    for (let sample = 1; sample <= count; sample++) {
        const distance = move.end * sample / count, p = bypassPose(lane, move, distance);
        if (Math.abs((0, sim_navigation_js_1.wrapAngle)(lane.at(move.entry + distance).yaw - origin.yaw)) > .04 || protectedRoad(p) ||
            (0, world_layout_js_1.surfaceAt)(p.x, p.z) !== 'asphalt' || ice(p.x, p.z) > .42 || !fit(p.x, p.z, p.yaw))
            return false;
        for (const side of [-body.w, body.w]) {
            const wheel = (0, collision_js_1.toWorld)(p, side, body.fw);
            if ((0, world_layout_js_1.surfaceAt)(wheel.x, wheel.z) !== 'asphalt')
                return false;
        }
    }
    return true;
}
class QueueBypasses {
    waiting = new WeakMap();
    tryStart(car, lane, block, cars, now, fit, ice) {
        if (!block || car.speed > .35 || block.gap < 7.6 || block.gap > 10.7) {
            this.waiting.delete(car);
            return false;
        }
        let wait = this.waiting.get(car);
        if (!wait || wait.blocker !== block.id) {
            wait = { blocker: block.id, from: now, retry: now };
            this.waiting.set(car, wait);
        }
        if (now - wait.from < 2.3 || now < wait.retry)
            return false;
        wait.retry = now + 1.25;
        const origin = lane.at(car.s);
        if ((0, sim_navigation_js_1.dist)(car, origin) > .12 || Math.abs((0, sim_navigation_js_1.wrapAngle)(car.yaw - origin.yaw)) > .15 || cars.some(other => other !== car && other.bypass && (0, sim_navigation_js_1.dist)(car, other) < 28))
            return false;
        const change = (0, sim_navigation_js_1.clamp)(block.gap - 2.3, 5.6, 8.4), merge = block.gap + vehicle_cabin_js_1.specs[car.kind].rear + block.length + 1.6;
        const plan = { blocker: block.id, entry: lane.wrap(car.s), progress: 0, change, merge, end: merge + change, readyAt: now + elapsedToSignal, reverse: false, held: 0 };
        const duration = plan.end / speedLimit + 2;
        if (block.car?.auto && (block.car.trafficStalledUntil ?? 0) - now < duration + 1 || oncoming(origin, car, cars, plan.end, duration) || !pavedPath(lane, plan, car, fit, ice))
            return false;
        car.bypass = plan;
        this.waiting.delete(car);
        return true;
    }
    step(car, lane, cars, now, dt, fit, ice) {
        const plan = car.bypass;
        if (!plan)
            return false;
        if (now < plan.readyAt) {
            car.speed = car.vx = car.vz = 0;
            car.braking = true;
            return true;
        }
        if (!plan.reverse && plan.progress < plan.change * .76) {
            const origin = lane.at(plan.entry + plan.progress), remaining = plan.end - plan.progress;
            if (oncoming(origin, car, cars, remaining, remaining / speedLimit + 1))
                plan.reverse = true;
        }
        const sign = plan.reverse ? -1 : 1, target = (plan.reverse ? 1.65 : speedLimit) * (1 - ice(car.x, car.z) * .34);
        const current = sign * car.speed, pace = current < 0 ? Math.min(0, current + dt * 5) : Math.min(target, current + dt * 1.75);
        const next = (0, sim_navigation_js_1.clamp)(plan.progress + sign * pace * dt, 0, plan.end), p = bypassPose(lane, plan, next);
        if (!fit(p.x, p.z, p.yaw)) {
            car.speed = car.vx = car.vz = 0;
            car.braking = true;
            plan.held += dt;
            if (plan.held > 1.2 && plan.progress < plan.change * .92)
                plan.reverse = true;
            return true;
        }
        car.vx = (p.x - car.x) / dt;
        car.vz = (p.z - car.z) / dt;
        car.speed = Math.hypot(car.vx, car.vz) * Math.sign(next - plan.progress);
        car.wheel += car.speed * dt / vehicle_cabin_js_1.specs[car.kind].r;
        car.braking = current < 0;
        car.steer = (0, sim_navigation_js_1.clamp)(-(0, sim_navigation_js_1.wrapAngle)(p.yaw - car.yaw) / dt * .8, -1, 1);
        Object.assign(car, p, { s: lane.wrap(plan.entry + next), y: (0, world_layout_js_1.groundHeight)(p.x, p.z) });
        plan.progress = next;
        plan.held = 0;
        if (next >= plan.end || plan.reverse && next === 0) {
            delete car.bypass;
            if (plan.reverse)
                car.speed = car.vx = car.vz = 0;
        }
        return true;
    }
}
exports.QueueBypasses = QueueBypasses;
