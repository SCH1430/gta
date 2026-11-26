"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parkingBays = void 0;
exports.restoreParking = restoreParking;
exports.fillParking = fillParking;
const collision_js_1 = require("./collision.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const world_layout_js_1 = require("./world-layout.js");
exports.parkingBays = [
    { id: 'parking-canal-1', kind: 'hatch', x: -42.3, z: 52.9, yaw: 0, color: '#718f93' },
    { id: 'parking-canal-2', kind: 'sedan', x: -38.6, z: 52.9, yaw: 0, color: '#a98d78' },
    { id: 'parking-canal-3', kind: 'wagon', x: -34.7, z: 52.9, yaw: 0, color: '#6f7b69' },
    { id: 'parking-market-1', kind: 'hatch', x: 53.1, z: 10.2, yaw: 0, color: '#777393' },
    { id: 'parking-market-2', kind: 'hatch', x: 65.1, z: 10.7, yaw: 0, color: '#ba7651' },
    { id: 'parking-market-3', kind: 'wagon', x: 69, z: 10.7, yaw: 0, color: '#83969d' },
    { id: 'parking-market-4', kind: 'van', x: 72.8, z: 10.7, yaw: 0, color: '#958167' },
    { id: 'parking-market-5', kind: 'sedan', x: 75.3, z: 16.4, yaw: 0, color: '#677d80' },
    { id: 'parking-court-1', kind: 'hatch', x: -41.5, z: -19.5, yaw: 0, color: '#976b74' },
    { id: 'parking-court-2', kind: 'wagon', x: -37.6, z: -25.8, yaw: 0, color: '#788e8a' },
    { id: 'parking-court-3', kind: 'hatch', x: -39.8, z: 1, yaw: 0, color: '#8d939d' },
    { id: 'parking-court-4', kind: 'wagon', x: -26.1, z: 1.5, yaw: 0, color: '#7e8d66' },
    { id: 'parking-depot-1', kind: 'sedan', x: 18.3, z: -20.2, yaw: Math.PI, color: '#7d869d' },
    { id: 'parking-depot-2', kind: 'van', x: 26, z: -20.2, yaw: Math.PI, color: '#92978b' },
    { id: 'parking-depot-3', kind: 'sedan', x: 34, z: -20.2, yaw: Math.PI, color: '#a27c66' },
];
function parkedCar(bay) {
    return { ...bay, y: (0, world_layout_js_1.groundHeight)(bay.x, bay.z), speed: 0, steer: 0, health: 100, lights: false, braking: false,
        police: false, wheel: 0, vx: 0, vz: 0, auto: false, lane: 0, s: 0 };
}
function restoreParking(cars, saved) {
    for (const bay of exports.parkingBays) {
        const car = saved.get(bay.id);
        if (!car || ![car.x, car.z, car.yaw].every(Number.isFinite) || cars.some(candidate => candidate.id === bay.id))
            continue;
        cars.push({ ...parkedCar(bay), ...car, id: bay.id, kind: bay.kind, police: false, auto: false, lane: 0 });
    }
}
function fillParking(cars, people) {
    const present = new Set(cars.map(car => car.id));
    for (const bay of exports.parkingBays) {
        if (present.has(bay.id))
            continue;
        const car = parkedCar(bay);
        if (!(0, collision_js_1.hullFits)(car, car, cars, people))
            continue;
        const cabin = (0, vehicle_cabin_js_1.carCabin)(car.kind);
        const door = (0, collision_js_1.toWorld)(car, -cabin.halfWidth - .53, cabin.handleZ + .10);
        if (!(0, collision_js_1.clearDisc)(door, .32, car.y, cars))
            continue;
        const exit = (0, collision_js_1.toWorld)(car, 0, -2.6);
        const advance = (0, collision_js_1.moveHull)(car, exit.x - car.x, exit.z - car.z, car.yaw, cars);
        if (Math.hypot(exit.x - advance.x, exit.z - advance.z) > .03)
            continue;
        cars.push(car);
    }
}
