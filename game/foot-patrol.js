"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FootPatrols = void 0;
const collision_js_1 = require("./collision.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const world_layout_js_1 = require("./world-layout.js");
const ui_navigation_js_1 = require("./ui-navigation.js");
const patrol_plan_js_1 = require("./patrol-plan.js");
function exitPoint(car, cars, people, preferred) {
    const { halfWidth, front, rear } = (0, vehicle_cabin_js_1.carCabin)(car.kind);
    const sides = preferred ? [preferred] : [1, -1];
    for (const side of sides) {
        for (const dz of [-.46, front - .3, rear + .3, 1.05]) {
            const point = (0, collision_js_1.toWorld)(car, side * (halfWidth + .46), dz), floor = (0, world_layout_js_1.groundHeight)(point.x, point.z);
            if ((0, collision_js_1.clearDisc)(point, .31, floor, cars, car) && !people.some(p => (0, sim_navigation_js_1.dist)(p, point) < .65))
                return { point, side };
        }
    }
    return null;
}
const footId = (id) => 'foot-' + id;
const cleanNumber = (v, fallback = 0) => typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const cleanColor = (value, fallback) => /^#[\da-f]{6}$/i.test(value) ? value : fallback;
class FootPatrols {
    roster = [];
    paths = new Map();
    reboard = new Map();
    vehicle = null;
    mode = 'walk';
    get units() { return this.roster; }
    has(carId) { return this.roster.some(p => p.carId === carId); }
    door(carId) {
        const officer = this.roster.find(unit => unit.carId === carId && unit.door > 0);
        return officer ? { side: officer.side, open: officer.door } : null;
    }
    observe(car) {
        this.mode = car ? 'drive' : 'walk';
        if (!car)
            return;
        this.vehicle = { id: car.id, kind: car.kind, color: cleanColor(car.color, '#56616e'), x: car.x, z: car.z, yaw: car.yaw, damage: Math.round(100 - car.health), abandoned: false };
    }
    recognizes(car, range, unseen, facing) {
        if (!car || !this.vehicle || car.id === this.vehicle.id || unseen < .55)
            return true;
        const matches = car.kind === this.vehicle.kind && car.color === this.vehicle.color;
        return matches ? facing && range < 24 : facing && range < 9 && Math.abs(car.speed) > 10.5;
    }
    recover(cars, saved) {
        this.paths.clear();
        this.reboard.clear();
        this.roster = [];
        this.mode = saved?.mode === 'drive' ? 'drive' : 'walk';
        const descriptor = saved?.vehicle;
        const car = cars.find(c => c.id === descriptor?.id && !c.police);
        this.vehicle = car && descriptor ? {
            id: car.id, kind: car.kind, color: cleanColor(descriptor.color, cleanColor(car.color, '#56616e')),
            x: cleanNumber(descriptor.x, car.x), z: cleanNumber(descriptor.z, car.z), yaw: cleanNumber(descriptor.yaw, car.yaw),
            damage: (0, sim_navigation_js_1.clamp)(cleanNumber(descriptor.damage), 0, 100), abandoned: !!descriptor.abandoned,
        } : null;
        const valid = new Set(cars.filter(c => c.police).map(c => c.id));
        if (!Array.isArray(saved?.officers))
            return;
        for (const unit of saved.officers.slice(0, 3)) {
            if (!unit || !valid.has(unit.carId) || this.has(unit.carId) || !['search', 'intercept', 'disabled', 'return'].includes(unit.phase))
                continue;
            if (!Number.isFinite(unit.x) || !Number.isFinite(unit.z) || unit.x < world_layout_js_1.bounds.minX || unit.x > world_layout_js_1.bounds.maxX || unit.z < world_layout_js_1.bounds.minZ || unit.z > world_layout_js_1.bounds.maxZ)
                continue;
            this.roster.push({
                id: footId(unit.carId), carId: unit.carId, phase: unit.phase, side: unit.side === -1 ? -1 : 1,
                y: (0, world_layout_js_1.groundHeight)(unit.x, unit.z), x: unit.x, z: unit.z, yaw: cleanNumber(unit.yaw), speed: (0, sim_navigation_js_1.clamp)(cleanNumber(unit.speed), 0, 5),
                at: cleanNumber(unit.at), disabledUntil: cleanNumber(unit.disabledUntil), attackReady: cleanNumber(unit.attackReady),
                door: 0, exitUntil: cleanNumber(unit.exitUntil), action: 0,
            });
        }
    }
    save() { return { vehicle: this.vehicle, mode: this.mode, officers: this.roster }; }
    standDown(now) {
        this.vehicle = null;
        this.mode = 'walk';
        for (const officer of this.roster) {
            officer.phase = 'return';
            officer.at = now;
            officer.attackStart = undefined;
            officer.action = 0;
            officer.door = 0;
            delete officer.getUp;
        }
        this.paths.clear();
    }
    near(hero, cars, covered) {
        return this.roster.filter(o => o.phase !== 'disabled' && o.phase !== 'return' && (0, sim_navigation_js_1.dist)(o, hero) < 1.9 && this.sees(o, hero, cars, covered, 1.9));
    }
    sees(officer, hero, cars, covered, radius = 25) {
        const range = (0, sim_navigation_js_1.dist)(officer, hero);
        if (officer.door > .01 || officer.phase === 'disabled' || officer.phase === 'return' || range > radius)
            return false;
        if (range > 2.5 && Math.abs((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(officer, hero) - officer.yaw)) > 1.68)
            return false;
        const target = covered ? { ...hero, y: hero.y - .99 } : hero;
        if (!(0, sim_navigation_js_1.visible)(officer, target))
            return false;
        return !covered || (0, collision_js_1.clearPath)(officer, hero, .018, hero.y + .52, cars);
    }
    stun(officer, now, hero) {
        const side = Math.sin((0, sim_navigation_js_1.wrapAngle)((0, sim_navigation_js_1.aim)(officer, hero) - officer.yaw)) < 0 ? -1 : 1;
        officer.phase = 'disabled';
        officer.at = now;
        officer.disabledUntil = now + 3.35;
        officer.attackReady = now + 4.7;
        officer.speed = 0;
        officer.attackStart = undefined;
        officer.action = 0;
        officer.getUp = { phase: .012, side };
        this.paths.delete(officer.id);
    }
    shouldLeaveCar(car, rank, order) {
        if (this.has(car.id) || this.roster.length >= Math.min(order.level, 2) || order.time < (this.reboard.get(car.id) ?? 0))
            return false;
        if (order.driving && !order.search || order.inside && !order.search || order.airborne)
            return false;
        if (rank >= 2)
            return false;
        const distance = (0, sim_navigation_js_1.dist)(car, order.contact);
        return distance < (order.search ? 16 : 10) && Math.abs(car.speed) < 2.8;
    }
    checkAbandoned(order, cars, active) {
        const evidence = this.vehicle;
        if (!order.search || !evidence || evidence.abandoned)
            return false;
        const car = cars.find(c => c.id === evidence.id);
        if (!car || Math.abs(car.speed) > 1.2 || order.driving && (0, sim_navigation_js_1.dist)(order.hero, car) < 3 || (0, sim_navigation_js_1.dist)(car, evidence) > 9)
            return false;
        const witnesses = [...active, ...this.roster.filter(o => o.phase === 'search')];
        if (!witnesses.some(o => (0, sim_navigation_js_1.dist)(o, car) < 9.5 && (0, sim_navigation_js_1.visible)(o, car)))
            return false;
        Object.assign(evidence, { x: car.x, z: car.z, abandoned: true });
        return true;
    }
    step(order, active, cars, people, dt, attack) {
        for (const [rank, car] of active.entries()) {
            if (!this.shouldLeaveCar(car, rank, order))
                continue;
            const slot = exitPoint(car, cars, [...people, ...this.roster, order.hero]);
            if (!slot)
                continue;
            this.roster.push({
                id: footId(car.id), carId: car.id,
                ...slot.point, y: (0, world_layout_js_1.groundHeight)(slot.point.x, slot.point.z), yaw: (0, sim_navigation_js_1.aim)(slot.point, order.contact), speed: 0,
                phase: order.search ? 'search' : 'intercept', side: slot.side,
                at: order.time, door: 0, exitUntil: order.time + .72, action: 0, disabledUntil: 0, attackReady: order.time + 1.75,
            });
        }
        const remaining = [], obstacles = [...people, ...this.roster, order.hero];
        for (const [rank, unit] of this.roster.entries()) {
            const car = cars.find(c => c.id === unit.carId);
            if (!car)
                continue;
            const age = order.time - unit.at;
            if (unit.phase === 'disabled') {
                if (order.time < unit.disabledUntil) {
                    unit.getUp = { phase: (0, sim_navigation_js_1.clamp)(age / 3.35, .012, .995), side: unit.getUp?.side ?? unit.side };
                    remaining.push(unit);
                    continue;
                }
                delete unit.getUp;
                unit.phase = !order.level ? 'return' : order.search ? 'search' : 'intercept';
                unit.at = order.time;
            }
            if (unit.phase !== 'return' && (!order.level || order.driving && !order.search && (0, sim_navigation_js_1.dist)(unit, order.hero) > 22)) {
                unit.phase = 'return';
                unit.at = order.time;
                unit.attackStart = undefined;
                unit.action = 0;
                unit.door = 0;
            }
            if (unit.phase === 'return') {
                const gate = exitPoint(car, cars, [], unit.side) ?? exitPoint(car, cars, []);
                if (!gate || (0, sim_navigation_js_1.dist)(unit, gate.point) < .48 || order.time - unit.at > 16) {
                    this.paths.delete(unit.id);
                    this.reboard.set(car.id, order.time + 4.5);
                    continue;
                }
                this.move(unit, gate.point, 2.0, cars, obstacles, order.time, dt);
                remaining.push(unit);
                continue;
            }
            if (order.time < unit.exitUntil) {
                unit.door = Math.sin(Math.PI * (1 - (0, sim_navigation_js_1.clamp)((unit.exitUntil - order.time) / .72, 0, 1)));
                remaining.push(unit);
                continue;
            }
            unit.door = 0;
            const sees = !order.inside && !order.driving && this.sees(unit, order.hero, cars, order.covered);
            unit.phase = order.search && !sees ? 'search' : 'intercept';
            const target = sees ? order.hero : (0, patrol_plan_js_1.patrolDestination)({ position: order.contact, motion: order.motion }, false, order.search, order.scanTime, rank + 1);
            const range = (0, sim_navigation_js_1.dist)(unit, target);
            if (unit.attackStart !== undefined) {
                const p = (order.time - unit.attackStart) / .66;
                unit.action = (0, sim_navigation_js_1.clamp)(p, 0, 1);
                unit.speed = 0;
                if (p >= .43 && p - dt / .66 < .43 && sees && range < 1.44)
                    attack(unit);
                if (p >= 1) {
                    unit.action = 0;
                    unit.attackStart = undefined;
                }
            }
            else if (sees && range < 1.25 && order.time >= unit.attackReady) {
                unit.attackStart = order.time;
                unit.attackReady = order.time + 2.2;
                unit.yaw = (0, sim_navigation_js_1.aim)(unit, target);
                unit.speed = 0;
            }
            else if (range > (sees ? .9 : .75)) {
                this.move(unit, target, sees ? 3.18 + order.level * .25 : 1.64, cars, obstacles, order.time, dt);
            }
            else {
                unit.speed = 0;
                if (unit.phase === 'search')
                    unit.yaw = (0, sim_navigation_js_1.wrapAngle)(unit.yaw + dt * .82);
            }
            remaining.push(unit);
        }
        this.roster = remaining;
    }
    move(unit, target, pace, cars, people, time, dt) {
        let goal = target;
        if (!(0, collision_js_1.clearPath)(unit, target, .32, unit.y, cars)) {
            let plan = this.paths.get(unit.id);
            if (!plan || time - plan.updated > .95 && (0, sim_navigation_js_1.dist)(plan.target, target) > 1.8 || time - plan.updated > 2.45) {
                plan = { target: { ...target }, path: (0, ui_navigation_js_1.route)(unit, target, 'walk'), next: 1, updated: time };
                this.paths.set(unit.id, plan);
            }
            while (plan.next + 1 < plan.path.length && (0, sim_navigation_js_1.dist)(unit, plan.path[plan.next]) < .76)
                plan.next++;
            goal = plan.path[plan.next] ?? target;
        }
        const walk = Math.min((0, sim_navigation_js_1.dist)(unit, goal), pace * dt);
        if (walk < 1e-6) {
            unit.speed = 0;
            return;
        }
        const yaw = (0, sim_navigation_js_1.aim)(unit, goal);
        const next = (0, collision_js_1.walkSlide)(unit, -Math.sin(yaw) * walk, -Math.cos(yaw) * walk, .29, unit.y, cars, people);
        unit.speed = (0, sim_navigation_js_1.dist)(unit, next) / dt;
        unit.x = next.x;
        unit.z = next.z;
        unit.y = (0, world_layout_js_1.groundHeight)(unit.x, unit.z);
        const look = (0, sim_navigation_js_1.wrapAngle)(yaw - unit.yaw);
        unit.yaw = (0, sim_navigation_js_1.wrapAngle)(unit.yaw + (0, sim_navigation_js_1.clamp)(look, -5.8 * dt, 5.8 * dt));
    }
}
exports.FootPatrols = FootPatrols;
