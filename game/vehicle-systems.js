"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotorPool = exports.equipment = void 0;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const region_layout_js_1 = require("./region-layout.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
Object.defineProperty(exports, "equipment", { enumerable: true, get: function () { return vehicle_road_js_1.equipment; } });
const collision_js_1 = require("./collision.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const vehicle_towing_js_1 = require("./vehicle-towing.js");
const vehicle_snow_js_1 = require("./vehicle-snow.js");
const towRoads = [...world_expansion_layout_js_1.expansionRoads, ...region_layout_js_1.regionRoads];
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
class MotorPool {
    props = (0, vehicle_road_js_1.streetFurniture)();
    towing = new vehicle_towing_js_1.VehicleTowing();
    snow = new vehicle_snow_js_1.SnowRoutes();
    cockpit = false;
    vault = null;
    trial = null;
    records = {};
    towQuote = null;
    road(x, z, sim) { return (0, vehicle_road_js_1.roadProfile)(x, z, sim.brokenFixtures); }
    save() { return { props: this.props.map(({ id, x, z, broken, vx, vz }) => ({ id, x, z, broken, vx, vz })), cockpit: this.cockpit, tow: this.towing.save(), snow: this.snow.patches, vault: this.vault, trial: this.trial, records: this.records }; }
    restore(s, cars) {
        this.props = (0, vehicle_road_js_1.streetFurniture)();
        for (const car of cars)
            if (car.systems)
                (0, vehicle_road_js_1.restoreEquipment)(car);
        for (const p of this.props) {
            const q = s?.props?.find(v => v.id === p.id);
            if (q && [q.x, q.z, q.vx, q.vz].every(Number.isFinite))
                Object.assign(p, { x: q.x, z: q.z, broken: !!q.broken, vx: q.vx, vz: q.vz });
        }
        this.cockpit = s?.cockpit === true;
        this.vault = s?.vault ?? null;
        this.trial = s?.trial ?? null;
        this.records = { ...s?.records };
        this.towQuote = null;
        (0, collision_js_1.bindStreetProps)(cars, this.props);
        this.towing.restore(s?.tow, cars);
        this.snow.restore(s?.snow);
    }
    linkedCar(sim) {
        if (sim.home.inside)
            return null;
        return sim.activeCar() ?? sim.cars.filter(c => !c.police && !c.carriedBy && Math.abs(c.speed) < .35 && distance(sim.hero, c) < 4.9).sort((a, b) => distance(a, sim.hero) - distance(b, sim.hero))[0] ?? null;
    }
    rearNear(c, p) {
        const rear = (0, collision_js_1.toWorld)(c, 0, vehicle_cabin_js_1.specs[c.kind].rear + .29);
        return distance(rear, p) < 1.65;
    }
    quote(sim, c) {
        let best = null, gap = Infinity;
        for (const r of towRoads) {
            const vertical = r.x1 === r.x2, u = vertical ? c.z : c.x, lo = vertical ? r.z1 : r.x1, hi = vertical ? r.z2 : r.x2;
            const origin = Math.max(lo + 4, Math.min(hi - 4, u));
            for (const d of [0, 4, -4, 8, -8, 14, -14, 22, -22])
                for (const side of [-1, 1]) {
                    const along = Math.max(lo + 4, Math.min(hi - 4, origin + d)), offset = side * (r.width / 2 - .95);
                    const x = vertical ? r.x1 + offset : along, z = vertical ? along : r.z1 + offset, yaw = vertical ? 0 : Math.PI / 2;
                    const dist = distance(c, { x, z });
                    if (dist < 4.2 || dist >= gap || !(0, collision_js_1.hullFits)(c, { x, z, yaw }, sim.cars, sim.people))
                        continue;
                    best = { car: c.id, x, z, yaw, fee: 100 + Math.ceil(dist / 10) * 5, street: r.name };
                    gap = dist;
                }
        }
        this.towQuote = best;
        return best;
    }
    strike(p, c, impact) {
        if (p.kind === 'picket') {
            if (impact < 3.1)
                return false;
            p.broken = true;
            return true;
        }
        if ((p.kind === 'box' || p.kind === 'cart') && impact > .4) {
            const gain = p.kind === 'box' ? .88 : .62;
            p.vx = c.vx * gain;
            p.vz = c.vz * gain;
            return true;
        }
        return false;
    }
    pushOnFoot(sim, dx, dz) {
        const h = sim.hero, x = h.x + dx, z = h.z + dz;
        for (const p of this.props) {
            if (p.kind !== 'box' && p.kind !== 'cart' || h.y > .35 || Math.abs(x - p.x) > p.w * .5 + .31 || Math.abs(z - p.z) > p.d * .5 + .31)
                continue;
            const contactX = Math.max(p.x - p.w / 2, Math.min(p.x + p.w / 2, x)), contactZ = Math.max(p.z - p.d / 2, Math.min(p.z + p.d / 2, z));
            if (Math.hypot(x - contactX, z - contactZ) > .32 || (p.x - h.x) * dx + (p.z - h.z) * dz <= 0)
                continue;
            const amount = p.kind === 'cart' ? .80 : .53, px = p.x + dx * amount, pz = p.z + dz * amount;
            p.broken = true;
            const clear = (0, collision_js_1.clearDisc)({ x: px, z: pz }, Math.max(p.w, p.d) * .5, .01, sim.cars);
            p.broken = false;
            if (clear) {
                p.x = px;
                p.z = pz;
            }
        }
    }
    beginLoad(sim, truck, target) { return this.towing.load(sim, truck, target); }
    syncTowed(sim) { this.towing.update(sim, 0); }
    tick(sim, dt) {
        (0, collision_js_1.bindStreetProps)(sim.cars, this.props);
        (0, collision_js_1.settledFeet)(sim.cars, sim.brokenFixtures, sim.elapsed);
        for (const p of this.props) {
            if (Math.abs(p.vx) + Math.abs(p.vz) < .035)
                continue;
            const nx = p.x + p.vx * dt, nz = p.z + p.vz * dt, r = Math.max(p.w, p.d) * .49;
            p.broken = true;
            const clear = (0, collision_js_1.clearDisc)({ x: nx, z: nz }, r, .01, sim.cars, sim.activeCar() ?? undefined);
            p.broken = false;
            if (clear) {
                p.x = nx;
                p.z = nz;
            }
            const drag = clear ? Math.exp(-dt * (p.kind === 'cart' ? 1.05 : 2.9)) : 0;
            p.vx *= drag;
            p.vz *= drag;
        }
        for (const c of sim.cars)
            if (c.systems?.plugged) {
                const s = c.systems;
                if (distance(c, vehicle_road_js_1.chargingPost) > 7.3) {
                    s.plugged = false;
                    continue;
                }
                s.charge = Math.min(100, s.charge + dt * .48);
            }
        this.towing.update(sim, dt);
        this.snow.step(sim.activeCar(), sim.elapsed);
        const car = sim.activeCar(), tr = this.trial;
        if (car && tr && tr.car === car.id && !tr.finish) {
            const gate = vehicle_road_js_1.courseGates[tr.gate];
            if (gate && distance(car, { x: gate[0], z: gate[1] }) < 2.45)
                tr.gate++;
            if (tr.gate === vehicle_road_js_1.courseGates.length && Math.abs(car.speed) < .35) {
                const t = sim.elapsed - tr.start;
                this.records[car.kind] = Math.min(this.records[car.kind] ?? Infinity, t);
                tr.finish = true;
            }
        }
    }
}
exports.MotorPool = MotorPool;
