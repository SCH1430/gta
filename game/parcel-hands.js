"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restPoints = exports.ParcelHands = void 0;
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
const parcels = [
    { id: 'tools', x: -38.7, z: 44.8, y: 0 },
    { id: 'market', x: 34, z: 25.8, y: 0 },
    { id: 'cargo', x: -791.5, z: -111.5, y: 0 },
    { id: 'mill', x: 196.5, z: 677, y: 0 },
];
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
class ParcelHands {
    boxes;
    held;
    constructor(saved) {
        this.boxes = parcels.map(def => {
            const stored = saved?.boxes?.find?.(item => item?.id === def.id);
            return stored && Number.isFinite(stored.x) && Number.isFinite(stored.z) && Math.abs(stored.x) < 1080 && stored.z > -885 && stored.z < 891 ?
                { ...def, x: stored.x, z: stored.z, y: (0, world_layout_js_1.groundHeight)(stored.x, stored.z), carrier: typeof stored.carrier === 'string' ? stored.carrier : undefined } :
                { ...def, y: (0, world_layout_js_1.groundHeight)(def.x, def.z) };
        });
        this.held = this.boxes.some(box => box.id === saved?.held && !box.carrier) ? saved.held : null;
    }
    save() { return { held: this.held, boxes: this.boxes.map(box => ({ ...box })) }; }
    get ground() { return this.boxes.filter(b => !b.carrier && b.id !== this.held); }
    availableCar(cars, hero, rear) {
        return cars.find(c => Math.abs(c.speed) < .4 && distance(c, hero) < 5.2 && rear(c, hero) && (0, vehicle_road_js_1.equipment)(c).boot);
    }
    actions(hero, cars, rear, storyBlock) {
        if (storyBlock)
            return [];
        const car = this.availableCar(cars, hero, rear);
        if (this.held) {
            const drop = { id: 'crate-drop', label: 'Поставить ящик' };
            if (!car || (0, vehicle_road_js_1.equipment)(car).cargo !== 'empty')
                return [drop];
            return [{ id: 'crate-load', label: 'Положить ящик в кузов', value: car.id }, drop];
        }
        const box = this.ground.find(b => distance(b, hero) < 1.58 && Math.abs(hero.y - b.y) < .70);
        if (box)
            return [{ id: 'crate-take', label: 'Поднять ящик', value: box.id }];
        if (car && this.boxes.some(item => item.carrier === car.id && (0, vehicle_road_js_1.equipment)(car).cargo === 'crate'))
            return [{ id: 'crate-unload', label: 'Вынуть ящик из кузова', value: car.id }];
        return [];
    }
    act(id, value, hero, cars, rear, storyBlock, free) {
        const choice = this.actions(hero, cars, rear, storyBlock).find(act => act.id === id && (!act.value || act.value === value));
        if (!choice)
            return '';
        const box = this.boxes.find(item => item.id === this.held);
        const car = choice.value ? cars.find(c => c.id === choice.value) : undefined;
        if (id === 'crate-take') {
            this.held = choice.value;
            return 'Ящик поднят';
        }
        if (id === 'crate-unload' && car) {
            const stored = this.boxes.find(item => item.carrier === car.id);
            delete stored.carrier;
            this.held = stored.id;
            Object.assign((0, vehicle_road_js_1.equipment)(car), { cargo: 'empty', load: 0, high: false });
            return 'Ящик вынут из кузова';
        }
        if (!box)
            return '';
        if (id === 'crate-load' && car) {
            box.carrier = car.id;
            box.x = car.x;
            box.z = car.z;
            this.held = null;
            Object.assign((0, vehicle_road_js_1.equipment)(car), { cargo: 'crate', load: 38, high: false });
            return 'Ящик закреплён · 38 кг';
        }
        const spot = { x: hero.x - Math.sin(hero.yaw) * .74, z: hero.z - Math.cos(hero.yaw) * .74 }, y = (0, world_layout_js_1.groundHeight)(spot.x, spot.z);
        if (!free(spot, y) || Math.abs(hero.y - y) > .40)
            return 'Подойдите к свободному месту на земле';
        Object.assign(box, spot, { y });
        this.held = null;
        return 'Ящик оставлен на земле';
    }
    reconcile(cars) {
        for (const box of this.boxes) {
            if (!box.carrier)
                continue;
            const car = cars.find(c => c.id === box.carrier);
            if (car && (0, vehicle_road_js_1.equipment)(car).cargo === 'crate') {
                box.x = car.x;
                box.z = car.z;
                continue;
            }
            delete box.carrier;
            box.y = (0, world_layout_js_1.groundHeight)(box.x, box.z);
        }
    }
}
exports.ParcelHands = ParcelHands;
exports.restPoints = [
    { ...world_layout_js_1.places.garage, title: 'Канальный гараж' },
    { x: -35.6, z: 23.2, title: 'Скамейка у дома' },
    { x: 13.6, z: -35, title: 'Остановка депо' },
    { x: -803, z: -110.3, title: 'Стоянка терминала' },
];
