"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehiclePanel = vehiclePanel;
exports.vehicleAction = vehicleAction;
exports.canInspectHood = canInspectHood;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const collision_js_1 = require("./collision.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const start = { x: vehicle_road_js_1.courseGates[0][0], z: vehicle_road_js_1.courseGates[0][1] };
const titles = vehicle_cabin_js_1.vehicleNames;
const goods = { empty: 'Пусто', tools: 'Инструменты', crate: 'Высокий ящик', calibrator: 'Калибратор' };
function button(id, label) { return '<button type="button" class="k-panel-row" data-action="motor-' + id + '"><span>' + label + '</span></button>'; }
const moving = (car) => Math.abs(car.speed) > .4 || Math.hypot(car.vx, car.vz) > .6;
function canInspectHood(sim, c) {
    return !!c && !sim.transition && !sim.home?.inside && c.id !== sim.driven && !c.carriedBy && !moving(c) &&
        distance(c, world_layout_js_1.places.garage) < 10 && distance(c, sim.hero) < 5.6;
}
const fittings = {
    'winter-tyres': { field: 'winterTyres', fee: 480, title: 'Зимняя резина' },
    'underbody': { field: 'underbody', fee: 370, title: 'Защита картера' },
    'aux-lights': { field: 'auxLights', fee: 280, title: 'Дополнительный свет' },
    'suspension': { field: 'reinforcedSuspension', fee: 540, title: 'Усиленная подвеска' }
};
function isFitting(id) { return Object.hasOwn(fittings, id); }
function cargoDepot(c) { return distance(c, world_layout_js_1.places.garage) < 10 || distance(c, world_layout_js_1.places.market) < 11 || distance(c, { x: 60, z: 24 }) < 12; }
function vehiclePanel(sim) {
    const pool = sim.motorPool, c = pool.linkedCar(sim);
    const records = Object.entries(pool.records).map(([k, v]) => titles[k] + ' ' + Number(v).toFixed(1) + ' с').join(' · ');
    if (!c)
        return '<p>Подойдите к припаркованной машине. Зарядка и склад находятся у ворот канального гаража. Учебная площадка — к западу от депо, за Деповской улицей.</p>' + (records ? '<p>' + records + '</p>' : '');
    const s = (0, vehicle_road_js_1.equipment)(c), active = sim.activeCar() === c, nearBoot = !active && pool.rearNear(c, sim.hero), quote = pool.towQuote;
    const tailgate = c.kind === 'pickup', tow = c.kind === 'towtruck', service = tow || c.kind === 'utility';
    const jammed = (s.dents.rearLeft ?? 0) > .55 || (s.dents.rearRight ?? 0) > .55;
    const trial = pool.trial, garage = distance(c, world_layout_js_1.places.garage) < 10, needs = c.kind === 'van' && !s.plugged;
    const route = sim.target(), range = s.charge / .0037 / (1 + s.load / 1120);
    let html = '<h3>' + titles[c.kind] + '</h3><p>Кузов ' + Math.round(c.health) + '% · Фары ' + (Number(s.leftLamp) + Number(s.rightLamp)) + '/2 · Износ шин ' + Math.round(s.tyreWear * 100) + '%' + (s.punctures ? ' · Есть прокол' : '') + '</p>';
    if (active) {
        html += button('manoeuvre', s.manoeuvre ? 'Выключить точный ход' : 'Точный ход · до 7 км/ч');
        html += button('camera', pool.cockpit ? 'Камера снаружи' : 'Вид из салона') + button('wipers', s.wipers ? 'Выключить дворники' : 'Включить дворники');
        html += button('window', s.windowsOpen ? 'Поднять боковые стёкла' : 'Опустить боковые стёкла');
        if (c.kind === 'utility')
            html += button('plough', s.plough ? 'Поднять отвал' : 'Опустить отвал');
        if (tow) {
            const carried = pool.towing.active;
            if (carried?.truck === c.id) {
                const vehicle = sim.cars.find(v => v.id === carried.car);
                html += '<p>' + ({ loading: 'Машина поднимается', loaded: 'На платформе', unloading: 'Машина спускается' })[carried.phase] + (vehicle ? ' · ' + titles[vehicle.kind] : '') + '</p>';
                if (carried.phase === 'loaded')
                    html += button('unload-car', 'Опустить машину на дорогу');
            }
            else {
                const candidate = pool.towing.candidate(sim, c);
                html += candidate ? button('load-car', 'Поднять на платформу · ' + titles[candidate.kind]) : '<p>Для погрузки поставьте машину за задним краем платформы, по оси эвакуатора.</p>';
            }
        }
    }
    if (s.leftMirror || s.rightMirror)
        html += button('mirrors', 'Развернуть сложенные зеркала');
    if (garage) {
        if (canInspectHood(sim, c))
            html += button('hood', s.hood ? 'Закрыть капот' : 'Поднять капот');
        if (!s.leftLamp)
            html += button('left', 'Левая фара · 35 ₽');
        if (!s.rightLamp)
            html += button('right', 'Правая фара · 35 ₽');
        if (Math.abs(s.tyre) > .001)
            html += button('align', 'Сход-развал · 95 ₽');
        if (s.punctures || s.tyreWear > .15)
            html += button('spare', 'Заменить повреждённые и изношенные шины · 105 ₽');
        if (s.dirt > .02)
            html += button('wash', 'Смыть соль и грязь · 45 ₽');
        html += '<h3>Доработки</h3>';
        for (const [id, p] of Object.entries(fittings))
            html += s[p.field] ? '<p>' + p.title + ' · установлено</p>' : button(id, p.title + ' · ' + p.fee + ' ₽');
    }
    if (!service) {
        html += '<p>Грузовой отсек · ' + goods[s.cargo] + ' · ' + s.load + ' кг</p>';
        if (nearBoot && !moving(c)) {
            html += jammed ? '<p>Замок повреждён · нужно выправить заднюю панель в гараже.</p>' : button('boot', tailgate ? (s.boot ? 'Поднять задний борт' : 'Опустить задний борт') : (s.boot ? 'Закрыть багажник' : 'Открыть багажник'));
            if (s.boot && s.cargo === 'empty' && cargoDepot(c))
                html += button('tools', 'Загрузить инструменты · 70 кг') + button('crate', 'Загрузить высокий ящик · 320 кг');
            if (s.boot && s.cargo !== 'empty' && s.cargo !== 'calibrator')
                html += button('unload', 'Выгрузить груз');
        }
        else
            html += '<p>Чтобы открыть багажник, встаньте у заднего бампера. Получить груз можно у гаража и на рынке.</p>';
    }
    if (c.kind === 'van') {
        html += '<p>Заряд ' + s.charge.toFixed(1) + '% · запас хода ' + Math.floor(range) + ' м' + (route ? ' · до цели по прямой ' + Math.ceil(distance(c, route)) + ' м' : '') + '</p>';
        html += distance(c, vehicle_road_js_1.chargingPost) < 7.3 ? button('charge', needs ? 'Подключить к станции' : 'Отключить кабель') : '<p>До зарядки у гаража ' + Math.round(distance(c, vehicle_road_js_1.chargingPost)) + ' м</p>';
    }
    if (quote?.car === c.id)
        html += '<p>' + quote.street + ' · ' + Math.round(distance(c, quote)) + ' м</p>' + button('tow-confirm', 'Подтвердить буксировку · ' + quote.fee + ' ₽') + button('tow-cancel', 'Отменить вызов');
    else
        html += button('tow', 'Рассчитать эвакуацию');
    html += '<h3>Учебная восьмёрка</h3>';
    if (trial?.car === c.id && !trial.finish)
        html += '<p>' + (trial.gate < vehicle_road_js_1.courseGates.length ? 'Ворота ' + (trial.gate + 1) + '/' + vehicle_road_js_1.courseGates.length : 'Остановитесь у финиша') + ' · ' + (sim.elapsed - trial.start).toFixed(1) + ' с</p>' + button('trial-stop', 'Отменить заезд');
    else if (active && distance(c, start) < 6)
        html += button('trial', 'Начать заезд');
    else
        html += '<p>Старт на площадке к западу от депо · ' + Math.ceil(distance(c, start)) + ' м</p>';
    return html + (records ? '<p>Личные рекорды · ' + records + '</p>' : '');
}
function vehicleAction(sim, id) {
    if (!id.startsWith('motor-'))
        return { handled: false, message: '' };
    const done = (message) => ({ handled: true, message }), pool = sim.motorPool, key = id.slice(6);
    const c = key === 'garage-hood' ? sim.garageCar() : pool.linkedCar(sim);
    if (!c || sim.transition)
        return done('Подойдите к неподвижной машине');
    const s = (0, vehicle_road_js_1.equipment)(c), active = sim.activeCar() === c;
    if (key === 'hood' || key === 'garage-hood') {
        if (!canInspectHood(sim, c))
            return done('Остановите машину у канального гаража и подойдите к ней пешком');
        s.hood = !s.hood;
        return { ...done(s.hood ? 'Капот поднят' : 'Капот закрыт'), inspectHood: true };
    }
    if (key === 'manoeuvre' && active) {
        s.manoeuvre = !s.manoeuvre;
        return done(s.manoeuvre ? 'Точный ход включён' : 'Обычный привод');
    }
    if (key === 'camera' && active) {
        pool.cockpit = !pool.cockpit;
        return done(pool.cockpit ? 'Камера водителя' : 'Внешняя камера');
    }
    if (key === 'wipers' && active) {
        s.wipers = !s.wipers;
        return done(s.wipers ? 'Дворники включены' : 'Дворники выключены');
    }
    if (key === 'window' && active) {
        s.windowsOpen = !s.windowsOpen;
        return done(s.windowsOpen ? 'Боковые стёкла опущены' : 'Боковые стёкла подняты');
    }
    if (key === 'plough' && active && c.kind === 'utility') {
        s.plough = !s.plough;
        return done(s.plough ? 'Отвал опущен · остаётся расчищенная колея' : 'Отвал поднят');
    }
    if (key === 'trial-stop') {
        pool.trial = null;
        return done('Заезд завершён');
    }
    if (moving(c))
        return done('Полностью остановите машину');
    if (s.bedMoving)
        return done('Платформа движется');
    if (key === 'load-car')
        return done(pool.beginLoad(sim, c) ? 'Лебёдка поднимает машину' : 'Подведите эвакуатор задним ходом к свободной стороне машины');
    if (key === 'unload-car')
        return done(pool.towing.unload(sim, c) ? 'Лебёдка спускает машину' : 'Освободите место за платформой');
    if (distance(c, world_layout_js_1.places.garage) < 10) {
        if (isFitting(key)) {
            const p = fittings[key];
            if (s[p.field])
                return done('Доработка уже установлена');
            if (sim.money < p.fee)
                return done('Недостаточно рублей');
            sim.money -= p.fee;
            s[p.field] = true;
            if (key === 'winter-tyres') {
                s.tyreWear = 0;
                s.punctures = 0;
            }
            return done(p.title + ' · установлено');
        }
        if (key === 'wash' || key === 'spare') {
            const fee = key === 'wash' ? 45 : 105;
            if (sim.money < fee)
                return done('Недостаточно рублей');
            if (key === 'wash' && s.dirt <= .02 || key === 'spare' && !s.punctures && s.tyreWear <= .15)
                return done('Услуга сейчас не требуется');
            sim.money -= fee;
            if (key === 'wash')
                s.dirt = 0;
            else {
                s.punctures = 0;
                s.tyreWear = 0;
            }
            return done(key === 'wash' ? 'Кузов вымыт' : 'Шины заменены');
        }
    }
    if (key === 'trial' && active && distance(c, start) < 6) {
        pool.trial = { car: c.id, gate: 1, start: sim.elapsed, finish: false };
        return done('Старт! Проезжайте через янтарные ворота');
    }
    if (key === 'mirrors') {
        s.leftMirror = false;
        s.rightMirror = false;
        return done('Зеркала развёрнуты');
    }
    if (key === 'tow-cancel') {
        pool.towQuote = null;
        return done('Вызов отменён');
    }
    if (key === 'tow') {
        const q = pool.quote(sim, c);
        return done(q ? q.street + ' · ' + q.fee + ' ₽' : 'Свободной площадки поблизости нет');
    }
    if (key === 'tow-confirm') {
        const q = pool.towQuote;
        if (!q || q.car !== c.id)
            return done('Сначала рассчитайте стоимость вызова');
        if (!(0, collision_js_1.hullFits)(c, q, sim.cars, active ? sim.people : [...sim.people, sim.hero])) {
            pool.towQuote = null;
            return done('Место занято. Выберите новое место');
        }
        if (sim.money < q.fee)
            return done('Недостаточно рублей');
        sim.money -= q.fee;
        Object.assign(c, { x: q.x, z: q.z, yaw: q.yaw, y: (0, world_layout_js_1.groundHeight)(q.x, q.z), speed: 0, vx: 0, vz: 0, auto: false, returning: false });
        if (active)
            Object.assign(sim.hero, { x: c.x, y: c.y, z: c.z, yaw: c.yaw, speed: 0 });
        s.plugged = false;
        pool.towQuote = null;
        return done('Машина на обочине · ' + q.street + ' · −' + q.fee + ' ₽');
    }
    if (key === 'charge' && c.kind === 'van' && distance(c, vehicle_road_js_1.chargingPost) < 7.3) {
        s.plugged = !s.plugged;
        c.auto = false;
        return done(s.plugged ? 'Зарядка началась' : 'Кабель отключён');
    }
    if (['left', 'right', 'align'].includes(key) && distance(c, world_layout_js_1.places.garage) < 10) {
        const fee = key === 'align' ? 95 : 35;
        if (key === 'left' && s.leftLamp || key === 'right' && s.rightLamp || key === 'align' && Math.abs(s.tyre) < .001)
            return done('Деталь исправна');
        if (sim.money < fee)
            return done('Недостаточно рублей');
        sim.money -= fee;
        if (key === 'align')
            s.tyre = 0;
        else if (key === 'left')
            s.leftLamp = true;
        else
            s.rightLamp = true;
        return done('Работа выполнена · −' + fee + ' ₽');
    }
    if (active || !pool.rearNear(c, sim.hero))
        return done('Встаньте у заднего бампера');
    if (key === 'boot' && ((s.dents.rearLeft ?? 0) > .55 || (s.dents.rearRight ?? 0) > .55))
        return done('Задняя панель помята. Замок зажат');
    if (key === 'boot') {
        s.boot = !s.boot;
        return done(c.kind === 'pickup' ? (s.boot ? 'Задний борт опущен' : 'Задний борт поднят') : (s.boot ? 'Багажник открыт' : 'Багажник закрыт'));
    }
    if (!s.boot)
        return done('Сначала откройте багажник');
    if (key === 'unload' && s.cargo !== 'calibrator') {
        s.cargo = 'empty';
        s.load = 0;
        s.high = false;
        return done('Груз выгружен');
    }
    if ((key === 'tools' || key === 'crate') && s.cargo === 'empty' && cargoDepot(c)) {
        s.cargo = key;
        s.load = key === 'tools' ? 70 : 320;
        s.high = key === 'crate';
        return done('Груз закреплён · ' + s.load + ' кг');
    }
    return done('Действие сейчас недоступно');
}
