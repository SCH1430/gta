"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultFreeSelection = exports.times = exports.startLocations = void 0;
exports.createFreeDrive = createFreeDrive;
exports.freeDrivePanel = freeDrivePanel;
const sim_js_1 = require("./sim.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const collision_js_1 = require("./collision.js");
const world_layout_js_1 = require("./world-layout.js");
exports.startLocations = [
    { name: 'Канальные гаражи', x: -32, z: 28, yaw: Math.PI / 2 },
    { name: 'Северный посёлок', x: -14, z: -659, yaw: Math.PI / 2 },
    { name: 'Западный терминал', x: -806, z: -105, yaw: Math.PI / 2 },
    { name: 'Белая плотина', x: 782, z: -156, yaw: Math.PI / 2 },
    { name: 'Лесная промзона', x: 183, z: 684, yaw: Math.PI / 2 },
];
exports.times = [{ label: 'Вечер', hour: 17.75 }, { label: 'Ночь', hour: 23.3 }, { label: 'Утро', hour: 7.15 }];
exports.defaultFreeSelection = { kind: 'hatch', location: 0, time: 0 };
function createFreeDrive(selection) {
    const place = exports.startLocations[selection.location], time = exports.times[selection.time];
    if (!place || !time)
        return null;
    const { checkpoint: _, ...snapshot } = new sim_js_1.Simulation(undefined, 'free-drive').snapshot();
    const car = snapshot.cars.find(c => c.kind === selection.kind && !c.police && !c.auto);
    if (!car)
        return null;
    const spots = [0, 4, -4, 7, -7, 11, -11, 15, -15, 21, -21];
    const others = snapshot.cars.filter(other => other.id !== car.id);
    const pose = [0, 2, -2, 3.5, -3.5].flatMap(lateral => spots.map(offset => ({ x: place.x + offset, z: place.z + lateral, yaw: place.yaw }))).find(at => [0, 2, 4, 6, 8, 10, 12].every(ahead => (0, collision_js_1.hullFits)(car, { ...at, x: at.x - ahead * Math.sin(at.yaw), z: at.z - ahead * Math.cos(at.yaw) }, others, snapshot.people)));
    if (!pose)
        return null;
    const y = (0, world_layout_js_1.groundHeight)(pose.x, pose.z);
    Object.assign(car, pose, { y, speed: 0, vx: 0, vz: 0, auto: false, returning: false });
    Object.assign(snapshot, { hero: { ...snapshot.hero, ...pose, y, speed: 0 }, driven: car.id, mission: 3, stage: 0, wanted: 0, search: null, money: 10000, tramTime: 30 });
    return { sim: new sim_js_1.Simulation(snapshot), hour: time.hour };
}
const button = (id, value, name, selected = false) => `<button class="k-job-btn${selected ? ' is-main' : ''}" type="button" aria-pressed="${selected}" data-action="free-${id}" data-value="${value}">${name}</button>`;
function freeDrivePanel(selection, playing) {
    if (playing)
        return '<div class="k-tour"><p>Свободная поездка идёт в отдельной сессии.</p><button type="button" class="k-job-btn is-main" data-action="free-return">Вернуться к кампании</button></div>';
    return `<div class="k-tour"><p>Выберите машину, район и время для отдельной свободной поездки.</p>
    <h3>Машина</h3><div class="k-job-choices">${Object.entries(vehicle_cabin_js_1.vehicleNames).map(([id, name]) => button('car', id, name, selection.kind === id)).join('')}</div>
    <h3>Место старта</h3><div class="k-job-choices">${exports.startLocations.map((point, i) => button('place', String(i), point.name, selection.location === i)).join('')}</div>
    <h3>Время</h3><div class="k-job-choices">${exports.times.map((time, i) => button('time', String(i), time.label, selection.time === i)).join('')}</div>
    <button type="button" class="k-job-btn is-main" data-action="free-start">Начать поездку</button></div>`;
}
