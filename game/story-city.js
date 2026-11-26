"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEvent = exports.cityJobReputation = exports.isCityJob = void 0;
exports.emptyCityProgress = emptyCityProgress;
exports.restoreCityProgress = restoreCityProgress;
exports.difficultUnlock = difficultUnlock;
exports.courierSubject = courierSubject;
exports.nearCityEvent = nearCityEvent;
exports.cityEventActions = cityEventActions;
exports.canStartEvent = canStartEvent;
exports.cityTargets = cityTargets;
exports.cityActions = cityActions;
exports.cityTick = cityTick;
exports.cityAct = cityAct;
exports.cityGoal = cityGoal;
const city_clock_js_1 = require("./city-clock.js");
const story_city_catalog_js_1 = require("./story-city-catalog.js");
const story_map_js_1 = require("./story-map.js");
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const absent = (s, mark) => !s.marks.includes(mark);
const here = (f, p) => f.space === p.space && distance(f, p) <= p.radius;
const stopped = (f) => !!f.car && Math.abs(f.car.speed) < 1.6;
const arrived = (f, p) => here(f, p) && (!f.car ? Math.abs(f.heroSpeed ?? 0) < 2.1 : stopped(f));
const taxiRoute = ['taxiMarket', 'taxiFirst', 'taxiSecond', 'taxiLast'];
const riders = ['Соня · продавщица', 'Ринат · наладчик', 'Ася · лаборант'];
const riderDeadlines = [90, 80, 105];
const branches = ['permit', 'friend', 'crew'];
const busyCopy = 'Остановись у отмеченного места и попробуй снова.';
const resting = (f) => !f.car && Math.abs(f.heroSpeed ?? 0) < 2.4;
const isCityJob = (id) => id >= 72 && id <= 91;
exports.isCityJob = isCityJob;
function emptyCityProgress() {
    return { timer: 0, leg: 0, distance: 0, body: 100, speed: 0, yaw: 0, failed: false };
}
function restoreCityProgress(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const d = raw;
    const valid = (v, max) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, -max, max) : 0;
    return {
        timer: Math.max(0, valid(d.timer, 600)), leg: Math.max(0, Math.trunc(valid(d.leg, 30))), distance: Math.max(0, valid(d.distance, 500)),
        body: typeof d.body === 'number' && Number.isFinite(d.body) ? clamp(d.body, 0, 100) : 100, speed: valid(d.speed, 70), yaw: valid(d.yaw, 20), failed: d.failed === true
    };
}
exports.cityJobReputation = {
    Канальный: [61, 62, 72, 76, 78, 89, 91],
    Терминал: [72, 75, 80],
    Плотина: [67, 79, 80],
    'Сухой док': [71, 73, 79],
    Северный: [64, 77, 81, 83, 90],
    Лесная: [80, 84],
};
function difficultUnlock(id) { return id === 79 ? [71, 72, 75] : []; }
const info = (x, z, name, radius = 8) => ({ x, z, name, radius, space: 'street' });
function interpolate(points, meter) {
    let remaining = meter;
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], length = distance(a, b);
        if (remaining <= length)
            return { x: a.x + (b.x - a.x) * remaining / length, z: a.z + (b.z - a.z) * remaining / length, yaw: Math.atan2(a.x - b.x, a.z - b.z), ended: false };
        remaining -= length;
    }
    const a = points.at(-2), b = points.at(-1);
    return { ...b, yaw: Math.atan2(a.x - b.x, a.z - b.z), ended: true };
}
function courierSubject(s) {
    if (s?.id !== 73 || !s.stage)
        return null;
    return { foot: s.stage === 2, ...interpolate(s.stage === 2 ? story_city_catalog_js_1.courierWalk : story_city_catalog_js_1.courierRoad, s.city?.distance ?? 0) };
}
function legalMode(s, f) { return s.id !== 77 || f.car?.kind === 'coupe'; }
function towed(f) { return f.vehicles?.find(car => car.id === story_city_catalog_js_1.recoverCarId && car.carriedBy === f.car?.id); }
const roadMark = 'Въезд на отмеченный створ';
const hourOf = (f) => (f.clockMinutes ?? (0, city_clock_js_1.districtMinutes)(f.elapsed ?? 0)) / 60;
function racePoint(id, gate) {
    const goals = story_city_catalog_js_1.cityCourses[id].gates, t = goals[clamp(gate, 0, goals.length - 1)];
    return { ...t, space: 'street', name: gate ? roadMark + ' ' + gate + '/' + (goals.length - 1) : 'Старт · ' + story_city_catalog_js_1.cityCourses[id].criterion };
}
function evenSlot(id, f) {
    const availability = id === 88 ? [5, 20] : id === 90 ? [4, 13] : id === 91 ? [14, 26] : [0, 26];
    const hour = hourOf(f);
    return hour >= availability[0] && (availability[1] > 24 || hour < availability[1]);
}
function nearCityEvent(f, claimed) {
    if (f.space !== 'street' || f.busy)
        return [];
    return story_city_catalog_js_1.eventSpots.filter(e => evenSlot(e.id, f) && !claimed(e.id) && distance(f, story_city_catalog_js_1.cityPlaces[e.place]) < 48);
}
function cityEventActions(f, claimed) {
    return nearCityEvent(f, claimed).filter(e => arrived(f, story_city_catalog_js_1.cityPlaces[e.place])).map(e => ({ id: 'job-accept-' + e.id, label: e.label }));
}
const isEvent = (id) => story_city_catalog_js_1.eventSpots.some(e => e.id === id);
exports.isEvent = isEvent;
function canStartEvent(id, f) {
    return cityEventActions(f, () => false).some(a => a.id === 'job-accept-' + id);
}
function listPlaces(...places) { return places.map(place => story_city_catalog_js_1.cityPlaces[place]); }
function cityTargets(s, f) {
    const n = s.stage, q = s.city ?? emptyCityProgress();
    if ((0, story_city_catalog_js_1.isCourse)(s.id))
        return [racePoint(s.id, n === 0 ? 0 : q.leg + 1)];
    switch (s.id) {
        case 72:
            if (n === 0)
                return listPlaces('authorization', 'technician', 'night');
            if (n === 1)
                return listPlaces(s.marks.includes('permit') ? 'counter' : s.marks.includes('friend') ? 'relayBox' : 'night');
            return listPlaces('relayDelivery');
        case 73: {
            if (!n)
                return listPlaces('courierStart');
            const npc = courierSubject(s);
            return [info(npc.x, npc.z, npc.foot ? 'Курьер во дворе' : 'Серая машина')];
        }
        case 74: {
            if (n)
                return listPlaces('towGarage');
            if (f.car?.kind === 'towtruck') {
                const c = f.vehicles?.find(v => v.id === story_city_catalog_js_1.recoverCarId), goal = story_city_catalog_js_1.cityPlaces.towShoulder;
                return [c ? { ...goal, x: c.x, z: c.z } : goal];
            }
            const truck = f.vehicles?.find(v => v.kind === 'towtruck' && v.id === 'fleet-strop') ?? f.vehicles?.find(v => v.kind === 'towtruck');
            return truck ? [info(truck.x, truck.z, 'Стоянка эвакуатора «Строп»')] : listPlaces('towShoulder');
        }
        case 75: return n === 0 ? listPlaces('cargoBoard') : n === 1 ? listPlaces('cargoA', 'cargoB', 'cargoC') : listPlaces('cargoReceipt');
        case 76:
            if (n !== 1)
                return listPlaces('taxiPark');
            if (f.car?.id !== s.carId) {
                const cab = f.vehicles?.find(v => v.id === s.carId);
                if (cab)
                    return [info(cab.x, cab.z, 'Вернуться к такси')];
            }
            return listPlaces(taxiRoute[clamp(q.leg, 0, taxiRoute.length - 1)]);
        case 78: return listPlaces(['railOffice', 'railBell', 'railBlade', 'railDepot'][n]);
        case 79: return n === 0 ? listPlaces('arcGate') : n === 1 ? listPlaces('arcCounter') : listPlaces('arcHandoff', 'archiveEnd');
        case 80: return n === 0 ? listPlaces(...story_city_catalog_js_1.archiveSpots.filter(k => absent(s, k))) : listPlaces('archiveEnd');
        case 81: {
            if (n !== 2)
                return listPlaces(n ? 'rareInterview' : 'rarePoster');
            const car = f.vehicles?.find(v => v.id === story_city_catalog_js_1.rareCarId);
            return [car ? info(car.x, car.z, 'Красная «Искра GT»', 5.5) : story_city_catalog_js_1.cityPlaces.rareCar];
        }
        case 88: return n === 1 ? [story_map_js_1.jobPlaces.garage] : listPlaces('roadsideHeat');
        case 89: return listPlaces(n ? 'parcelReturn' : 'parcelFind');
        case 90: return listPlaces(n ? 'commuterEnd' : 'commuter');
        case 91: return listPlaces(n === 1 ? 'generatorSupply' : 'generatorStart');
    }
    return [];
}
function cityActions(s, f) {
    const actions = [], q = s.city ?? emptyCityProgress();
    const n = s.stage;
    const add = (key, label) => actions.push({ key, label });
    const foot = (p, key, label) => {
        if (resting(f) && here(f, p))
            add(key, label);
    };
    const drive = (p, key, label) => {
        if (stopped(f) && here(f, p))
            add(key, label);
    };
    if ((0, story_city_catalog_js_1.isCourse)(s.id)) {
        if (!n && legalMode(s, f) && !f.wanted)
            drive(racePoint(s.id, 0), 'begin', 'Начать заезд');
        if (n && q.failed)
            add('retry', 'Повторить заезд');
        return actions;
    }
    if (s.id === 72) {
        if (n === 0) {
            foot(story_city_catalog_js_1.cityPlaces.authorization, 'permit', 'Оформить пропуск у Семёна');
            foot(story_city_catalog_js_1.cityPlaces.technician, 'friend', 'Попросить Инну помочь');
            foot(story_city_catalog_js_1.cityPlaces.night, 'crew', 'Договориться о ночной выдаче');
        }
        if (n === 1) {
            const target = cityTargets(s, f)[0];
            const nightDelivery = s.marks.includes('crew'), hour = hourOf(f);
            const night = hour >= 20 || hour < 6;
            if (nightDelivery && !night)
                foot(target, 'night-wait', 'Проверить время смены');
            else
                foot(target, 'collect', s.marks.includes('permit') ? 'Получить реле по пропуску' : s.marks.includes('friend') ? 'Забрать реле из ящика мастера' : 'Забрать реле у ночной смены');
        }
        if (n === 2)
            foot(story_city_catalog_js_1.cityPlaces.relayDelivery, 'deliver', 'Передать реле диспетчеру');
    }
    if (s.id === 73) {
        if (n === 0 && f.car && (f.wanted ?? 0) === 0)
            drive(story_city_catalog_js_1.cityPlaces.courierStart, 'trail', 'Начать наблюдение');
        else if (n && q.failed)
            add('retry', 'Вернуться к началу этапа');
        else {
            const target = courierSubject(s);
            if (n === 2 && target && resting(f) && f.space === 'street' && distance(f, target) < 3.1)
                add('catch', 'Остановить курьера');
        }
    }
    if (s.id === 74 && f.car?.kind === 'towtruck' && !f.car.systems?.bedMoving) {
        if (!n && towed(f) && f.space === 'street' && stopped(f))
            add('secure', 'Подтвердить погрузку на платформу');
        if (n === 1 && towed(f))
            drive(story_city_catalog_js_1.cityPlaces.towGarage, 'deliver', 'Отметить прибытие в гараж');
        if (n === 2) {
            const damaged = f.vehicles?.find(car => car.id === story_city_catalog_js_1.recoverCarId);
            if (damaged && !damaged.carriedBy && distance(damaged, story_city_catalog_js_1.cityPlaces.towGarage) < 16)
                drive(story_city_catalog_js_1.cityPlaces.towGarage, 'release', 'Сдать машину механику');
        }
    }
    if (s.id === 75) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.cargoBoard, 'ask', 'Спросить грузчиков о номере');
        if (n === 1)
            for (const [key, label] of [['cargoA', '208'], ['cargoB', '314'], ['cargoC', '407']])
                foot(story_city_catalog_js_1.cityPlaces[key], key, 'Сверить контейнер № ' + label);
        if (n === 2)
            foot(story_city_catalog_js_1.cityPlaces.cargoReceipt, 'register', 'Отметить контейнер в ведомости');
    }
    if (s.id === 76 && f.car?.kind === 'taxi') {
        if (!n)
            drive(story_city_catalog_js_1.cityPlaces.taxiPark, 'start', 'Начать смену в такси');
        else if (s.carId === f.car.id) {
            if (n === 1)
                drive(story_city_catalog_js_1.cityPlaces[taxiRoute[clamp(q.leg, 0, taxiRoute.length - 1)]], 'ride', q.leg === 0 ? 'Посадить · ' + riders[0] : q.leg < 3 ? 'Высадить и взять следующего' : 'Высадить последнего пассажира');
            if (n === 2)
                drive(story_city_catalog_js_1.cityPlaces.taxiPark, 'return', 'Сдать смену');
        }
    }
    if (s.id === 78) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.railOffice, 'log', 'Прочитать журнал смены');
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.railBell, 'listen', 'Прислушаться к звонку');
        if (n === 2)
            foot(story_city_catalog_js_1.cityPlaces.railBlade, 'points', 'Проверить положение стрелки');
        if (n === 3)
            foot(story_city_catalog_js_1.cityPlaces.railDepot, 'found', 'Найти вагон на Восточной');
    }
    if (s.id === 79) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.arcGate, 'guard', 'Показать накладную дежурному');
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.arcCounter, 'evidence', 'Сопоставить три печати');
        if (n === 2) {
            foot(story_city_catalog_js_1.cityPlaces.arcHandoff, 'dock', 'Вернуть копию докерам');
            foot(story_city_catalog_js_1.cityPlaces.archiveEnd, 'archive', 'Подать копию в городской архив');
        }
    }
    if (s.id === 80) {
        if (n === 0)
            story_city_catalog_js_1.archiveSpots.forEach((p, i) => {
                if (absent(s, p))
                    foot(story_city_catalog_js_1.cityPlaces[p], p, 'Забрать · ' + story_city_catalog_js_1.archiveNames[i]);
            });
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.archiveEnd, 'file', 'Зарегистрировать три находки');
    }
    if (s.id === 81) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.rarePoster, 'poster', 'Прочитать объявление');
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.rareInterview, 'ask', 'Расспросить о красном купе');
        if (n === 2)
            foot(cityTargets(s, f)[0], 'photo', 'Опознать красную «Искру»');
    }
    if (s.id === 88) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.roadsideHeat, 'inspect', 'Поговорить с водителем');
        if (n === 1)
            foot(story_map_js_1.jobPlaces.garage, 'water', 'Взять канистру с водой');
        if (n === 2)
            foot(story_city_catalog_js_1.cityPlaces.roadsideHeat, 'fix', 'Оставить воду водителю');
    }
    if (s.id === 89) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.parcelFind, 'lift', 'Проверить адрес на посылке');
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.parcelReturn, 'deliver', 'Передать коробку консьержу');
    }
    if (s.id === 90) {
        if (n === 0)
            drive(story_city_catalog_js_1.cityPlaces.commuter, 'board', 'Взять мастера в салон');
        if (n === 1 && s.carId === f.car?.id)
            drive(story_city_catalog_js_1.cityPlaces.commuterEnd, 'alight', 'Высадить мастера');
    }
    if (s.id === 91) {
        if (n === 0)
            foot(story_city_catalog_js_1.cityPlaces.generatorStart, 'inspect', 'Осмотреть бак');
        if (n === 1)
            foot(story_city_catalog_js_1.cityPlaces.generatorSupply, 'fuel', 'Взять канистру топлива');
        if (n === 2)
            foot(story_city_catalog_js_1.cityPlaces.generatorStart, 'start', 'Залить топливо и запустить');
    }
    return actions;
}
function motion(s, f, dt) {
    const q = s.city, car = f.car;
    const accel = Math.abs(car.speed - q.speed) / dt;
    const turn = Math.abs(Math.atan2(Math.sin(car.yaw - q.yaw), Math.cos(car.yaw - q.yaw))) * Math.abs(car.speed) / dt;
    const bodyLoss = Math.max(0, q.body - car.health);
    s.quality = clamp(s.quality - (Math.max(0, accel - 6.5) * .32 + Math.max(0, turn - 3.9) * 1.16) * dt - bodyLoss * 3.1, 0, 100);
    q.speed = car.speed;
    q.yaw = car.yaw;
    q.body = car.health;
}
function cityTick(s, f, engine) {
    const q = s.city ?? (s.city = emptyCityProgress()), dt = f.dt ?? 0;
    if (dt <= 0 || dt > .5 || !s.stage || f.busy || q.failed)
        return;
    if ((0, story_city_catalog_js_1.isCourse)(s.id) && s.stage === 1) {
        const c = story_city_catalog_js_1.cityCourses[s.id], mode = s.id, qCar = f.car;
        q.timer += dt;
        if (q.timer > c.limit) {
            q.failed = true;
            return engine.notice('Время истекло. Повтори с линии старта.');
        }
        if (!qCar || qCar.id !== s.carId)
            return;
        motion(s, f, dt);
        if (f.space !== 'street' || !here(f, racePoint(mode, q.leg + 1)))
            return;
        q.leg++;
        if (q.leg < c.gates.length - 1)
            return engine.notice('Створ ' + q.leg + ' из ' + (c.gates.length - 1) + '.');
        const seconds = Math.round(q.timer * 10) / 10, clean = Math.round(s.quality);
        const bonus = mode === 77 && clean > 94 ? 600 : mode === 83 ? clean * 5 : mode === 84 ? clean * 6 : 0;
        const base = mode === 77 ? 2200 : mode === 82 ? 2000 : mode === 83 ? 2050 : 2100;
        return engine.done('Финиш · ' + seconds.toLocaleString('ru-RU') + ' с. Чистота ' + clean + '%.', { paid: base + bonus, seconds });
    }
    if (s.id === 73) {
        const target = courierSubject(s), gap = distance(f, target);
        if (!target.ended && f.space === 'street' && gap < 94)
            q.distance += dt * (s.stage === 1 ? 8.2 : 2.8);
        if (gap > 86 || f.space !== 'street')
            q.timer += dt;
        else
            q.timer = Math.max(0, q.timer - dt * 2);
        if (q.timer > 17) {
            q.failed = true;
            return engine.notice('Курьер потерян. Вернись к последней контрольной точке.');
        }
        const next = courierSubject(s);
        if (s.stage === 1 && next.ended && gap < 23) {
            s.city = emptyCityProgress();
            return engine.next('Курьер бросил автомобиль у Деповской. Остановись, выйди и сократи путь через двор.');
        }
    }
    if (s.id === 76 && s.stage === 1 && q.leg > 0) {
        q.timer += dt;
        if (f.car?.id === s.carId)
            motion(s, f, dt);
    }
    if (s.id === 90 && s.stage === 1)
        q.timer += dt;
}
function cityAct(s, key, f, engine) {
    const n = s.stage, q = s.city ?? (s.city = emptyCityProgress());
    if ((0, story_city_catalog_js_1.isCourse)(s.id) && key === 'begin' && f.car) {
        s.carId = f.car.id;
        s.quality = 100;
        s.city = { ...emptyCityProgress(), body: f.car.health, speed: f.car.speed, yaw: f.car.yaw };
        return engine.next('Время пошло. Ориентируйся по следующему створу.');
    }
    switch (s.id) {
        case 72:
            if (n === 0) {
                if (!branches.some(k => k === key))
                    return engine.notice(busyCopy);
                s.marks = [key];
                return engine.next(key === 'permit' ? 'Пропуск в журнале. На терминале зайди внутрь к стойке охраны.' : key === 'friend' ? 'Инна оставила реле в подписанном ящике у терминала.' : 'Мастер встретит тебя в кармане после 20:00. Время можно ждать в припаркованной машине.');
            }
            if (key === 'night-wait')
                return engine.notice('Смена выдаёт груз с 20:00 до 06:00. Дождись её или выбери другой путь после возобновления заказа.');
            if (n === 1)
                return engine.next('Реле при тебе. Возвращайся в Канальное депо.');
            return engine.done('Семён · Реле встало на место. Платформа может открыть путь.', { outcome: s.marks[0] });
        case 73:
            if (n === 0) {
                s.city = emptyCityProgress();
                return engine.next('Серая машина ушла к Деповской. Держись рядом с ней.');
            }
            return engine.done('Курьер отдал оригинал ведомости. Следом за ним никто не приехал.');
        case 74:
            if (!n)
                return engine.next('Хетчбэк закреплён. Через Портовую улицу доедь до Канального гаража.');
            if (n === 1)
                return engine.next('Открой бортовой журнал и спусти машину на свободное место за платформой.');
            return engine.done('Тоня приняла разгруженную машину. Съезд к мосту свободен.');
        case 75:
            if (n === 0)
                return engine.next('Мирон · Контейнер № 314. На бирке синяя полоса. Другие два сейчас не трогай.');
            if (n === 1)
                return key === 'cargoB' ? engine.next('Синяя бирка, номер 314. Отнеси подтверждение в шкаф у приёмки.') : engine.notice('Смена говорила о контейнере № 314. На этой бирке выбит другой номер.');
            return engine.done('Номер 314 внесён в ведомость. Терминал разрешил отправку.');
        case 76:
            if (n === 0 && f.car) {
                s.carId = f.car.id;
                return engine.next('Первая пассажирка ждёт в кармане рынка.');
            }
            if (n === 1) {
                const leg = q.leg;
                if (leg > 0) {
                    const expired = Math.max(0, q.timer - riderDeadlines[leg - 1]);
                    s.quality = clamp(s.quality - expired * .42, 0, 100);
                    s.marks.push(riders[leg - 1].split(' · ')[0]);
                }
                q.timer = 0;
                q.leg++;
                q.body = f.car?.health ?? 100;
                q.speed = f.car?.speed ?? 0;
                q.yaw = f.car?.yaw ?? 0;
                if (q.leg === taxiRoute.length)
                    return engine.next('Все пассажиры на месте. Верни машину на стоянку.');
                engine.checkpoint();
                return engine.notice(leg === 0 ? 'Соня · До Канальной, пожалуйста. По времени спокойно.' : leg === 1 ? 'Ринат · На ТЭЦ, меня ждут у проходной.' : 'Ася · К дому на Литейной. Если можно, без резких поворотов.');
            }
            return engine.done('Смена сдана. Оценка поездок ' + Math.round(s.quality) + '%.', { paid: 1500 + Math.round(s.quality * 9) });
        case 78:
            if (n === 0)
                return engine.next('В журнале · вагон № 07 слышали у рыночной остановки. Проверь звонок.');
            if (n === 1)
                return { ...engine.next('Один длинный звонок со стороны Восточной. У стрелки можно проверить, куда ушёл вагон.'), sound: 'tram' };
            if (n === 2)
                return engine.next('На стрелке индикатор «Восточная · тупик». Иди к сортировочной площадке.');
            return { ...engine.done('Вагон № 07 найден в тупике. Диспетчер получил точные координаты.'), sound: 'tram' };
        case 79:
            if (n === 0)
                return engine.next('Дежурный увидел печать Сухого дока и открыл журнал внутри гидроузла.');
            if (n === 1)
                return engine.next('Все три печати совпали. Можно показать документы мастеру дока или зарегистрировать их в городском архиве.');
            return engine.done(key === 'dock' ? 'Ян вывесил копии для всей смены. Спорный состав остановлен.' : 'Архив зарегистрировал все три документа. Груз снят с ведомости.', { outcome: key });
        case 80:
            if (n === 0) {
                s.marks.push(key);
                if (s.marks.length === 3)
                    return engine.next('Все три находки собраны. Архив ждёт в диспетчерской.');
                engine.checkpoint();
                return engine.notice('Находка в журнале · ' + story_city_catalog_js_1.archiveNames[story_city_catalog_js_1.archiveSpots.indexOf(key)] + '.');
            }
            return engine.done('Три записи внесены в архив внешнего кольца. В 2060-м метеопост измерял первый зимний ветер. Арена принимала Сменные игры 2073 года. Старый лесной путь открылся в 2059-м.');
        case 81:
            if (n === 0)
                return engine.next('В объявлении только размытый номер и слово «Север-8». Спроси местных.');
            if (n === 1)
                return engine.next('Житель · На стоянке красное купе с тёмной крышей. Ищи возле остановки. Машина видна на карте.');
            return engine.done('Это та самая красная «Искра GT». Тоня внесла машину в журнал поиска.');
        case 88:
            if (n === 0)
                return engine.next('Водитель · Бачок пуст. У Тони в гараже есть запас воды.');
            if (n === 1)
                return engine.next('Вода в канистре. Возвращайся к ТЭЦ.');
            return { ...engine.done('Водитель долил воду и вызвал техпомощь. Полоса свободна.'), sound: 'repair' };
        case 89: return n === 0 ? engine.next('На коробке указан дом № 23. Консьерж примет её у подъезда.') : engine.done('Консьерж забрал коробку. Получатель узнает о доставке.');
        case 90:
            if (n === 0 && f.car) {
                s.carId = f.car.id;
                return engine.next('Пассажир · До Северной ТЭЦ, пожалуйста.');
            }
            return engine.done(q.timer < 125 ? 'Мастер успел к проверке перед сменой.' : 'Мастер добрался до проходной, но проверка уже началась.', { paid: q.timer < 125 ? 750 : 420 });
        case 91:
            if (n === 0)
                return engine.next('Генератор цел, но топливо закончилось. У гаража есть канистра.');
            if (n === 1)
                return engine.next('Топливо получено. Генератор ждёт на рынке.');
            return { ...engine.done('Генератор запустился. У кассетного ряда снова свет.'), sound: 'switch' };
    }
    return engine.notice(busyCopy);
}
function cityGoal(s, goal) {
    const q = s.city;
    if (!q || !s.stage)
        return goal;
    if (q.failed)
        return 'Этап прерван · повтори с контрольной точки';
    if ((0, story_city_catalog_js_1.isCourse)(s.id))
        return goal + ' · ' + q.leg + '/' + (story_city_catalog_js_1.cityCourses[s.id].gates.length - 1) + ' · осталось ' + Math.max(0, Math.ceil(story_city_catalog_js_1.cityCourses[s.id].limit - q.timer)) + ' с';
    if (s.id === 76 && s.stage === 1)
        return goal + ' · ' + Math.max(0, q.leg - 1) + '/3 · комфорт ' + Math.round(s.quality) + '%';
    return goal;
}
