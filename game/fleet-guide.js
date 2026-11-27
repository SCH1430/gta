"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearestParked = nearestParked;
exports.fleetGuide = fleetGuide;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const profiles = {
    hatch: { category: 'Хетчбэк', description: 'Короткий кузов для дворов и узких проездов.' },
    sedan: { category: 'Седан', description: 'Тяжёлый кузов и устойчивая траектория на асфальте.' },
    van: { category: 'Электрофургон', description: 'Развозная машина с высокой крышей и просторным грузовым отсеком.' },
    suv: { category: 'Внедорожник', description: 'Высокая посадка для обочин и заснеженных подъездов.' },
    pickup: { category: 'Пикап', description: 'Открытая грузовая платформа. Длинная база требует места для разворота.' },
    taxi: { category: 'Такси', description: 'Седан с фонарём таксопарка и плавным ходом.' },
    wagon: { category: 'Универсал', description: 'Длинная крыша, вместительный багажник и спокойное руление.' },
    towtruck: { category: 'Эвакуатор', description: 'Заезжайте под нужным углом, чтобы загрузить машину на платформу.' },
    utility: { category: 'Коммунальная машина', description: 'Тяжёлая техника для зимней дороги и грузовых площадок.' },
    coupe: { category: 'Купе', description: 'Низкий кузов и быстрый разгон. На скользком повороте сбрасывайте скорость заранее.' }
};
const kinds = Object.keys(profiles);
function nearestParked(cars, from, kind, driven) {
    let closest, best = Infinity;
    for (const car of cars) {
        if (car.kind !== kind || car.auto || car.police || car.id === driven || Math.abs(car.speed) > .65)
            continue;
        const distance = (car.x - from.x) ** 2 + (car.z - from.z) ** 2;
        if (distance >= best)
            continue;
        closest = car;
        best = distance;
    }
    return closest;
}
function fleetGuide(cars, player, driven) {
    return `<div class="k-fleet">${kinds.map(kind => {
        const profile = profiles[kind], parked = nearestParked(cars, player, kind, driven);
        const range = parked ? Math.round(Math.hypot(parked.x - player.x, parked.z - player.z)) : 0;
        return `<article><small>${profile.category}</small><h3>${vehicle_cabin_js_1.vehicleNames[kind]}</h3><p>${profile.description}</p>${parked ? `<button type="button" class="k-job-btn" data-action="fleet-find" data-value="${kind}">На карте · ${range} м</button>` : '<small>Поблизости нет стоянки</small>'}</article>`;
    }).join('')}</div>`;
}
