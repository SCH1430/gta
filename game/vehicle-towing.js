"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleTowing = void 0;
const collision_js_1 = require("./collision.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
const deckHeight = .882;
const ease = (p) => p * p * (3 - 2 * p);
const clamp = (a) => Math.min(1, Math.max(0, a));
const atRest = (vehicle) => Math.abs(vehicle.speed) < .35 && Math.hypot(vehicle.vx, vehicle.vz) < .55;
const angular = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const validPose = (p) => !!p && [p.x, p.y, p.z, p.yaw].every(Number.isFinite);
const chaseMass = { hatch: 960, sedan: 1450, van: 1870, suv: 1790, pickup: 1930, coupe: 1150, taxi: 1370, wagon: 1430, towtruck: 2950, utility: 3550 };
function fitsFlatbed(car) {
    const s = vehicle_cabin_js_1.specs[car.kind];
    return !car.police && car.kind !== 'towtruck' && car.kind !== 'utility' && s.w < 1.095 && s.rear - s.front < 5.28;
}
function endOnBed(truck, parts, backwards) {
    const z = 1.40 + (.5 * (backwards ? parts.rear + parts.front : -parts.rear - parts.front));
    return { ...(0, collision_js_1.toWorld)(truck, 0, z), yaw: truck.yaw + (backwards ? Math.PI : 0), y: truck.y + deckHeight };
}
function exposedPeople(sim) {
    return sim.activeCar() ? sim.people : [...sim.people, sim.hero];
}
class VehicleTowing {
    state = null;
    get active() { return this.state; }
    save() { return this.state; }
    restore(save, cars) {
        this.state = null;
        for (const car of cars) {
            delete car.carriedBy;
            if (car.systems) {
                car.systems.towedMass = 0;
                car.systems.bedDrop = 0;
                car.systems.bedMoving = false;
            }
        }
        if (!save || !validPose(save.start) || !validPose(save.end) || !['loading', 'loaded', 'unloading'].includes(save.phase) || !Number.isFinite(save.t))
            return;
        const truck = cars.find(c => c.id === save.truck && c.kind === 'towtruck'), car = cars.find(c => c.id === save.car);
        if (!truck || !car || !fitsFlatbed(car))
            return;
        this.state = { ...save, t: clamp(save.t), backwards: !!save.backwards };
        this.place(truck, car, 0);
    }
    candidate(sim, truck, target) {
        if (this.state || truck.kind !== 'towtruck' || !atRest(truck) || sim.activeCar() !== truck)
            return null;
        const max = vehicle_cabin_js_1.specs.towtruck.rear + 4.85;
        const min = vehicle_cabin_js_1.specs.towtruck.rear;
        const matches = (c) => {
            if (!fitsFlatbed(c) || c.carriedBy || !atRest(c) || c.auto)
                return false;
            const p = (0, collision_js_1.toLocal)(truck, c), aligned = Math.abs(Math.cos(c.yaw - truck.yaw)) > .88;
            const slope = Math.abs(truck.y - (0, world_layout_js_1.groundHeight)(c.x, c.z));
            return p.z >= min && p.z <= max && Math.abs(p.x) < 1.4 && aligned && slope < .49;
        };
        if (target)
            return sim.cars.includes(target) && matches(target) ? target : null;
        let best = Infinity, car = null;
        for (const c of sim.cars) {
            if (!matches(c))
                continue;
            const d = (truck.x - c.x) ** 2 + (truck.z - c.z) ** 2;
            if (d < best) {
                best = d;
                car = c;
            }
        }
        return car;
    }
    load(sim, truck, target) {
        const car = this.candidate(sim, truck, target);
        if (!car)
            return false;
        const backwards = Math.cos(car.yaw - truck.yaw) < 0, end = endOnBed(truck, vehicle_cabin_js_1.specs[car.kind], backwards);
        const contact = (0, collision_js_1.toWorld)(truck, 0, vehicle_cabin_js_1.specs.towtruck.rear + (backwards ? vehicle_cabin_js_1.specs[car.kind].rear : -vehicle_cabin_js_1.specs[car.kind].front));
        const people = exposedPeople(sim);
        for (const p of [{ x: (car.x + contact.x) / 2, z: (car.z + contact.z) / 2 }, contact, end]) {
            if (!(0, collision_js_1.hullFits)(car, { ...p, yaw: end.yaw }, sim.cars, people, truck))
                return false;
        }
        this.state = { truck: truck.id, car: car.id, phase: 'loading', t: 0, start: { x: car.x, y: car.y, z: car.z, yaw: car.yaw }, end, backwards };
        this.place(truck, car, 0);
        return true;
    }
    unload(sim, truck) {
        const state = this.state;
        if (!state || state.phase !== 'loaded' || state.truck !== truck.id || !atRest(truck) || sim.activeCar() !== truck)
            return false;
        const car = sim.cars.find(c => c.id === state.car);
        if (!car)
            return false;
        const parts = vehicle_cabin_js_1.specs[car.kind], leading = state.backwards ? parts.rear : -parts.front;
        const p = (0, collision_js_1.toWorld)(truck, 0, vehicle_cabin_js_1.specs.towtruck.rear + leading + .66), yaw = truck.yaw + (state.backwards ? Math.PI : 0);
        const end = { ...p, yaw, y: (0, world_layout_js_1.groundHeight)(p.x, p.z) };
        if (Math.abs(truck.y - end.y) > .5)
            return false;
        const people = exposedPeople(sim), start = endOnBed(truck, parts, state.backwards);
        const midpoint = { x: (start.x + end.x) / 2, z: (start.z + end.z) / 2, yaw };
        if (!(0, collision_js_1.hullFits)(car, midpoint, sim.cars, people, truck) || !(0, collision_js_1.hullFits)(car, end, sim.cars, people))
            return false;
        Object.assign(state, { phase: 'unloading', t: 0, start, end });
        this.place(truck, car, 0);
        return true;
    }
    place(truck, car, dt) {
        const state = this.state;
        const system = (0, vehicle_road_js_1.equipment)(truck), moving = state.phase !== 'loaded';
        system.bedMoving = moving;
        system.towedMass = chaseMass[car.kind] + (0, vehicle_road_js_1.equipment)(car).load;
        car.carriedBy = truck.id;
        car.auto = false;
        car.returning = false;
        Object.assign(car, { speed: 0, vx: 0, vz: 0, steer: 0 });
        if (!moving) {
            Object.assign(car, endOnBed(truck, vehicle_cabin_js_1.specs[car.kind], state.backwards));
            system.bedDrop = 0;
            return;
        }
        state.t = Math.min(1, state.t + dt / 3.4);
        const progress = ease(clamp((state.t - .19) / .75));
        const { start, end } = state;
        const x = start.x + (end.x - start.x) * progress, z = start.z + (end.z - start.z) * progress;
        const y = start.y + (end.y - start.y) * ease(clamp((state.t - .30) / .64));
        const yaw = start.yaw + angular(end.yaw - start.yaw) * progress;
        Object.assign(car, { x, y, z, yaw });
        system.bedDrop = ease(clamp(state.t / .18)) * ease(clamp((1 - state.t) / .24));
        if (state.t < 1)
            return;
        system.bedDrop = 0;
        system.bedMoving = false;
        if (state.phase === 'loading') {
            state.phase = 'loaded';
            Object.assign(car, endOnBed(truck, vehicle_cabin_js_1.specs[car.kind], state.backwards));
        }
        else {
            delete car.carriedBy;
            system.towedMass = 0;
            this.state = null;
        }
    }
    update(sim, dt) {
        const state = this.state;
        if (!state)
            return;
        const truck = sim.cars.find(c => c.id === state.truck), car = sim.cars.find(c => c.id === state.car);
        if (!truck || !car) {
            if (car)
                delete car.carriedBy;
            if (truck)
                Object.assign((0, vehicle_road_js_1.equipment)(truck), { bedMoving: false, bedDrop: 0, towedMass: 0 });
            this.state = null;
            return;
        }
        this.place(truck, car, dt);
    }
}
exports.VehicleTowing = VehicleTowing;
