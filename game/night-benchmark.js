"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chaseTrialStops = exports.chaseDuration = void 0;
exports.nightChasePoint = nightChasePoint;
exports.createNightBenchmark = createNightBenchmark;
const T = require("../engine/three.module.min.js");
const model_cars_js_1 = require("./model-cars.js");
const sim_navigation_js_1 = require("./sim-navigation.js");
const world_layout_js_1 = require("./world-layout.js");
const camera_volume_js_1 = require("./camera-volume.js");
const lane = sim_navigation_js_1.lanes[6];
const start = lane.nearest({ x: 46, z: 102 }).s;
const names = ['Экстренный выезд', 'Погоня вдоль канала', 'Литейный мост'];
exports.chaseDuration = 32;
const chaseSections = [
    { name: names[0], seconds: 9, eye: [0, 0, 0], end: [0, 0, 0], look: [0, 0, 0] },
    { name: names[1], seconds: 13, eye: [0, 0, 0], end: [0, 0, 0], look: [0, 0, 0] },
    { name: names[2], seconds: 10, eye: [0, 0, 0], end: [0, 0, 0], look: [0, 0, 0] }
];
exports.chaseTrialStops = chaseSections;
const scenarios = [
    ['coupe', '#6e9aab', 0, 0, false], ['sedan', '#bdd0c4', -8.6, -.35, true],
    ['sedan', '#ded4bb', -16.6, -.60, true], ['taxi', '#cfab4a', 14.2, -3.5, false],
    ['van', '#588783', 29, -3.5, false], ['wagon', '#777d86', 43.5, -3.5, false]
];
function chaseDistance(time) {
    const t = Math.max(0, time);
    return t * 12.2 - 4.4 * (1 - Math.exp(-t * .51)) + .88 * Math.sin(t * 1.03);
}
function nightChasePoint(seconds, offset = 0, side = 0) {
    const s = start + chaseDistance(seconds) + offset;
    const center = lane.at(s), before = lane.at(s - 1.1), after = lane.at(s + 1.1);
    const yaw = Math.atan2(before.x - after.x, before.z - after.z);
    const x = center.x + side * Math.cos(yaw), z = center.z - side * Math.sin(yaw);
    return { x, z, y: (0, world_layout_js_1.groundHeight)(x, z), yaw, speed: 12.2 - 2.24 * Math.exp(-seconds * .51) + .907 * Math.cos(seconds * 1.03) };
}
function createNightBenchmark(scene) {
    const group = new T.Group();
    group.name = 'Контрольная поездка · Ночная погоня';
    scene.add(group);
    const players = scenarios.map(([kind, color, offset, side, police], i) => {
        const p = nightChasePoint(0, offset, side);
        const car = { ...p, id: 'benchmark-' + i, kind, color, steer: 0, health: 100, lights: true, braking: false,
            police, lane: 6, s: 0, auto: false, wheel: 0, vx: 0, vz: 0 };
        const model = (0, model_cars_js_1.createVehicle)(police ? 'patrol' : kind, color);
        group.add(model.root);
        return { car, model, offset, side };
    });
    const cars = players.map(({ car }) => car);
    const direction = new T.Vector3(), center = new T.Vector3(), target = new T.Vector3(), ahead = new T.Vector3();
    const projection = new T.Vector3();
    function update(seconds, dt, camera) {
        for (const { car, model, offset, side } of players) {
            const p = nightChasePoint(seconds, offset, side), later = nightChasePoint(seconds + .30, offset, side);
            Object.assign(car, p);
            const turn = Math.atan2(Math.sin(later.yaw - p.yaw), Math.cos(later.yaw - p.yaw));
            car.steer = T.MathUtils.clamp(turn * 3, -1, 1);
            car.braking = Math.abs(turn) > .17;
            model.root.position.set(p.x, p.y, p.z);
            model.root.rotation.y = p.yaw;
            model.update(dt, p.speed, car.steer, true, car.braking, 0, { patrolActive: car.police, patrolClock: seconds,
                cameraDistance: camera.position.distanceTo(model.root.position) });
        }
        const focus = cars[0], trail = nightChasePoint(seconds, -6.6, .77), look = nightChasePoint(seconds, 10);
        center.set(focus.x, focus.y + 1.23, focus.z);
        target.set(trail.x, trail.y + 3.03, trail.z);
        direction.subVectors(target, center);
        const distance = direction.length();
        direction.divideScalar(distance);
        const arm = (0, camera_volume_js_1.cameraClearance)(center, direction, distance, .19, cars, focus.id);
        camera.position.copy(center).addScaledVector(direction, arm);
        camera.lookAt(look.x, look.y + .93, look.z);
        camera.updateMatrixWorld();
        let visible = 0;
        const widths = [-.95, 0, .95], depths = [8, 14, 23, 31];
        for (const offset of depths)
            for (const side of widths) {
                const road = nightChasePoint(seconds, offset, side);
                ahead.set(road.x, road.y + .09, road.z);
                projection.copy(ahead).project(camera);
                if (Math.abs(projection.x) >= .98 || projection.y < -.95 || projection.y > .86 || Math.abs(projection.z) > 1)
                    continue;
                direction.subVectors(ahead, camera.position);
                const range = direction.length();
                if ((0, camera_volume_js_1.cameraClearance)(camera.position, direction.divideScalar(range), range, .05, cars, focus.id) >= range - .35)
                    visible++;
            }
        return { focus, cars, visibility: visible / (widths.length * depths.length) };
    }
    return { update, dispose() {
            group.removeFromParent();
            for (const { model } of players)
                model.dispose();
        } };
}
