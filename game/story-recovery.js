"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreJobPosition = restoreJobPosition;
const collision_js_1 = require("./collision.js");
const world_layout_js_1 = require("./world-layout.js");
const house_layout_js_1 = require("./house-layout.js");
const interior_layout_js_1 = require("./interior-layout.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
function candidates(at) {
    const points = [{ x: at.x, z: at.z, yaw: at.yaw }];
    for (const d of [1.3, 2.8, 4.6, 7.1, 10.2])
        for (let i = 0; i < 12; i++) {
            const a = i * Math.PI / 6;
            points.push({ x: at.x + d * Math.cos(a), z: at.z + d * Math.sin(a), yaw: at.yaw });
        }
    return points.filter(p => p.x > world_layout_js_1.bounds.minX + 1 && p.x < world_layout_js_1.bounds.maxX - 1 && p.z > world_layout_js_1.bounds.minZ + 1 && p.z < world_layout_js_1.bounds.maxZ - 1);
}
function restoreJobPosition(sim, at) {
    const home = sim.home.save(), car = at.space === 'street' && at.carId ? sim.cars.find(c => c.id === at.carId && !c.police) : undefined;
    const people = sim.people.filter(p => !p.onboard);
    if (at.space === 'street') {
        const points = candidates(at);
        if (car) {
            const p = points.find(p => (0, collision_js_1.hullFits)(car, p, sim.cars, people));
            if (!p)
                return false;
            sim.stopDistrictMotion();
            Object.assign(car, p, { y: (0, world_layout_js_1.groundHeight)(p.x, p.z), speed: 0, vx: 0, vz: 0, steer: 0, auto: false, returning: false, braking: true, siding: undefined });
            sim.driven = car.id;
            Object.assign(sim.hero, p, { y: car.y, speed: 0 });
        }
        else {
            const standing = (p) => (0, collision_js_1.footFloor)(p, at.y ?? (0, world_layout_js_1.groundHeight)(p.x, p.z), .29, sim.cars);
            const free = (p, y) => (0, collision_js_1.clearDisc)(p, .31, y, sim.cars) && people.every(n => Math.abs(n.y - y) > 1.4 || Math.hypot(n.x - p.x, n.z - p.z) > .63);
            const level = points.find(p => {
                const y = standing(p);
                return free(p, y) && (at.y === undefined || Math.abs(y - at.y) < .42);
            });
            const p = level ?? points.find(p => free(p, (0, world_layout_js_1.groundHeight)(p.x, p.z)));
            if (!p)
                return false;
            sim.stopDistrictMotion();
            Object.assign(sim.hero, p, { y: level ? standing(p) : (0, world_layout_js_1.groundHeight)(p.x, p.z), speed: 0 });
        }
        sim.home.restore({ ...home, avatar: null, peek: null, vertical: 0, door: null, entry: 'house' });
    }
    else {
        const floor = interior_layout_js_1.annexes[at.space];
        const campusFloor = floor?.areas ? floor : null;
        let x = at.x, z = at.z, y = at.y ?? floor?.floor ?? 0;
        if (campusFloor && !require('./campus-movement.js').validSpawn(x, z, y)) {
            x = floor.entrance.x; z = floor.entrance.z; y = floor.floor;
        }
        if ((0, interior_layout_js_1.zoneAt)(x, z, y) !== at.space)
            return false;
        const p = (0, house_layout_js_1.moveInHouse)(x, z, 0, 0, .31, y);
        const entry = campusFloor ? 'school1' : Object.hasOwn(exploration_layout_js_1.entrances, at.space) ? at.space : 'house';
        const e = exploration_layout_js_1.entrances[entry];
        sim.stopDistrictMotion();
        Object.assign(sim.hero, e, { y: (0, world_layout_js_1.groundHeight)(e.x, e.z), speed: 0 });
        sim.home.restore({ ...home, entry, peek: null, vertical: 0, door: null, avatar: { ...p, y: (0, house_layout_js_1.houseFloor)(p.x, p.z, y), yaw: at.yaw, speed: 0 } });
    }
    return true;
}
