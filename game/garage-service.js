"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workshopJobs = workshopJobs;
exports.applyWorkshopJob = applyWorkshopJob;
const vehicle_road_js_1 = require("./vehicle-road.js");
const panelJobs = {
    frontLeft: 'Выправить кузов спереди слева',
    frontRight: 'Выправить кузов спереди справа',
    rearLeft: 'Выправить кузов сзади слева',
    rearRight: 'Выправить кузов сзади справа',
    leftSide: 'Выправить левый борт',
    rightSide: 'Выправить правый борт'
};
const lampJobs = { leftLamp: 'Заменить левую фару', rightLamp: 'Заменить правую фару' };
const wheels = [
    { id: 'wheel0', label: 'Починить переднее левое колесо' },
    { id: 'wheel1', label: 'Починить переднее правое колесо' },
    { id: 'wheel2', label: 'Починить заднее левое колесо' },
    { id: 'wheel3', label: 'Починить заднее правое колесо' }
];
function workshopJobs(car) {
    const state = (0, vehicle_road_js_1.equipment)(car), jobs = [];
    for (const side of ['leftLamp', 'rightLamp']) {
        if (!state[side])
            jobs.push({ id: side, label: lampJobs[side], price: vehicle_road_js_1.lampRepairCost });
    }
    for (const [index, wheel] of wheels.entries()) {
        const price = (0, vehicle_road_js_1.wheelRepairCost)(state, index);
        if (price)
            jobs.push({ ...wheel, price });
    }
    const alignment = (0, vehicle_road_js_1.alignmentRepairCost)(state);
    if (alignment)
        jobs.push({ id: 'alignment', label: 'Отрегулировать ходовую', price: alignment });
    for (const panel of vehicle_road_js_1.bodyPanels) {
        const price = (0, vehicle_road_js_1.panelRepairCost)(state.dents[panel] ?? 0);
        if (price)
            jobs.push({ id: panel, label: panelJobs[panel], price });
    }
    if ((car.scrapes?.length ?? 0) > 0 || (state.patina?.length ?? 0) > 0)
        jobs.push({ id: 'polish', label: 'Убрать царапины', price: 30 });
    return jobs;
}
function applyWorkshopJob(car, id, available) {
    const job = workshopJobs(car).find(option => option.id === id);
    if (!job)
        return null;
    if (!Number.isFinite(available) || available < job.price)
        return { job, done: false };
    const state = (0, vehicle_road_js_1.equipment)(car), part = job.id;
    if (part === 'leftLamp' || part === 'rightLamp')
        state[part] = true;
    else if (part === 'alignment')
        state.tyre = 0;
    else if (part === 'polish') {
        car.scrapes = [];
        delete state.patina;
    }
    else if (part in panelJobs) {
        const panel = part;
        car.health = Math.min(100, car.health + (state.dents[panel] ?? 0) * 9);
        delete state.dents[panel];
        (0, vehicle_road_js_1.clearPanelImpressions)(state, panel);
    }
    else {
        const wheel = wheels.findIndex(x => x.id === part);
        state.punctures &= ~(1 << wheel);
        if (state.wheelDamage) {
            state.wheelDamage[wheel] = 0;
            if (!state.wheelDamage.some(value => value > 0))
                delete state.wheelDamage;
        }
    }
    return { job, done: true };
}
