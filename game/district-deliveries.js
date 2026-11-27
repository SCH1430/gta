"use strict";
const { approach, depot, routes } = require("./district-delivery-routes.js");
const { createDistrictDeliveryView } = require("./district-delivery-view.js");
const { groundHeight } = require("./world-layout.js");
const { hullFits, moveHull } = require("./collision.js");
const { dist } = require("./sim-navigation.js");

const post = { x: 141.3, z: -18.2 };
const cafe = { x: -98.7, z: 38.84 };
const nightStarts = 21 * 60;
const deliveryTime = 7 * 60;
const dayLength = 24 * 60;
const vanId = 'district-shift-van';
const followDistance = 35;
const envelopes = [
    { bin: 'east', address: 'Станция Восточная · путевая служба. В конверте заявка на освещение платформы.' },
    { bin: 'west', address: 'Западный терминал · Таможенный склад. В конверте ведомость ночной смены.' },
    { bin: 'foundry', address: 'Литейная · кафе «Горячий лёд». В конверте график завтраков для утренней смены.' }
];
const mailBags = [
    { bin: 'foundry', label: 'В мешок «Литейная / кафе Горячий лёд»' },
    { bin: 'east', label: 'В мешок «Станция Восточная / путевая служба»' },
    { bin: 'west', label: 'В мешок «Западный терминал / Таможенный склад»' }
];
const guides = [
    ['Вагонный мост · выезд смены', approach.x, approach.z, 'Подъедьте с юга на машине. Нужен водитель сопровождения'],
    ['Почта 87 · ночное окно', post.x, post.z, 'Западная стена почты у станции Восточной. Сортировка с 21:00 до полуночи']
];

function bridgeRestriction(c) {
    const icy = c.weather.roadIce >= .65 && c.weather.wind > .55;
    if (c.weather.snow >= .66 || icy)
        return icy ? 'наледь на Вагонном мосту' : 'снежные заносы на Вагонном мосту';
    const debris = c.sim.streetIncidents.debris(c.sim.brokenFixtures, c.sim.elapsed);
    if (debris.some(p => Math.abs(p.x + 942) < 3.4 + p.radius && p.z > 51 && p.z < 99))
        return 'препятствие на Вагонном мосту';
    return '';
}

function vanAt(pose) {
    return {
        ...pose, y: groundHeight(pose.x, pose.z), id: vanId, kind: 'van', color: '#bc7b43',
        districtEscort: true, health: 100, lights: true, speed: 0, steer: 0, wheel: 0,
        braking: true, police: false, auto: false, lane: 0, s: 0, vx: 0, vz: 0
    };
}

function attachVan(c, route, trip, offsets) {
    for (const offset of offsets) {
        const s = Math.max(0, Math.min(route.length, trip.distance + offset));
        const van = vanAt(route.at(s));
        if (!hullFits(van, van, c.sim.cars, c.sim.streetBodies()))
            continue;
        trip.distance = s;
        c.sim.cars.push(van);
        return van;
    }
    return null;
}

function detachVan(sim, van) {
    const index = sim.cars.indexOf(van);
    if (index >= 0) {
        sim.cars.splice(index, 1);
        sim.impactSliding.delete(van);
        sim.populationRevision++;
    }
}

function stopVan(van) {
    van.speed = van.vx = van.vz = 0;
    van.braking = true;
}

function advanceVan(c, van, trip, route, gap) {
    const limit = Math.min(route.speedLimit(trip.distance), 14 - c.weather.snow * 6 - c.weather.roadIce * 3.5);
    const pace = limit * Math.min(1, (followDistance - gap) / 11);
    const speed = Math.min(pace, van.speed + 4.6 * c.dt);
    const braking = speed < van.speed - .06;
    const distance = Math.min(trip.distance + speed * c.dt, route.length);
    const target = route.at(distance), dx = target.x - van.x, dz = target.z - van.z;
    const fraction = Math.min(1, (speed * c.dt + .0001) / Math.max(.0001, Math.hypot(dx, dz)));
    const moved = moveHull(van, dx * fraction, dz * fraction, target.yaw, c.sim.cars, c.sim.streetBodies());
    if (moved.hit) {
        stopVan(van);
        return;
    }
    van.vx = (moved.x - van.x) / c.dt;
    van.vz = (moved.z - van.z) / c.dt;
    van.speed = Math.hypot(van.vx, van.vz);
    van.braking = braking;
    van.wheel += van.speed * c.dt / .375;
    Object.assign(van, { x: moved.x, z: moved.z, yaw: moved.yaw, y: groundHeight(moved.x, moved.z) });
    if (fraction >= .999)
        trip.distance = distance;
}

function createDistrictDeliveries(scene) {
    const view = scene ? createDistrictDeliveryView(scene) : null;
    let trip = null, escorted = '', sorted = null, mailCount = 0, parked = false, warned = false;
    const vanById = c => c.sim.cars.find(car => car.id === vanId);
    const atNight = c => c.minutes >= nightStarts;
    const announce = (c, message) => { c.notify(message); c.record(message); };
    function start(c, name) {
        if (name === 'direct') {
            const restriction = bridgeRestriction(c);
            if (restriction) {
                c.notify('Диспетчер закрыл прямой выезд · ' + restriction + '. Выберите объезд.');
                return;
            }
        }
        const state = { route: name, distance: 0 };
        const van = attachVan(c, routes[name], state, [0, 2.5, 5]);
        if (!van) {
            c.notify('Выезд занят. Освободите полосу и попробуйте снова.');
            return;
        }
        trip = state;
        warned = false;
        c.ui.clearRoute(approach);
        c.addMapPin(depot.x, depot.z, 'Таможенный склад · приём смены');
        announce(c, 'Сменный фургон тронется первым. Держите оранжевый маяк в поле зрения и держитесь в 5–30 м за ним.');
    }
    function cancel(c) {
        const van = vanById(c);
        if (van)
            detachVan(c.sim, van);
        trip = null;
        announce(c, 'Сопровождение снято. Новый рейс можно взять на южном подходе к Вагонному мосту.');
    }
    function actions(c) {
        const rows = [];
        if (c.zone !== 'street' || c.sim.wanted || c.sim.transition || c.sim.tramRider.onboard)
            return rows;
        const stopped = Math.abs(c.player.speed) < .45;
        const atApproach = dist(c.player, approach) < 18;
        if (!escorted && !trip && c.car && atApproach && Math.abs(c.car.speed) < 1.4)
            rows.push({ id: 'escort', label: 'Сменный фургон · согласовать маршрут' });
        if (trip && stopped) {
            const van = vanById(c), route = routes[trip.route];
            if (trip.distance >= route.length && dist(c.player, depot) < 12)
                rows.push({ id: 'escort-finish', label: 'Таможенный склад · сдать путевой лист' });
            else if (atApproach || van && dist(c.player, van) < 14)
                rows.push({ id: 'escort-status', label: 'Сменный фургон · связаться с диспетчером' });
        }
        if (!c.car && dist(c.player, post) < 3.6) {
            if (!sorted && atNight(c))
                rows.push({ id: 'post-sort', label: mailCount ? 'Почта 87 · продолжить сортировку' : 'Почта 87 · разложить ночную почту' });
            else if (!sorted && stopped)
                rows.push({ id: 'post-night', label: 'Почта 87 · дождаться 21:00' });
            else if (sorted && !sorted.delivered)
                rows.push({ id: 'post-status', label: 'Почта 87 · проверить мешок утренней развозки' });
        }
        if (!c.car && sorted && dist(c.player, cafe) < 3.2) {
            if (sorted.delivered)
                rows.push({ id: 'cafe-board', label: 'Кафе «Горячий лёд» · прочитать новый график' });
            else if (stopped)
                rows.push({ id: 'post-morning', label: 'У кафе · дождаться утренней развозки' });
        }
        return rows;
    }
    function sortAtWindow(c) {
        const letter = envelopes[mailCount];
        c.choose('Конверт ' + (mailCount + 1) + ' из ' + envelopes.length + ' · ' + letter.address, mailBags.map(bag => ({
            label: bag.label,
            run() {
                if (bag.bin !== letter.bin) {
                    c.notify('Сортировщица вернула конверт. Проверьте район на адресной строке.');
                    return;
                }
                mailCount++;
                if (mailCount < envelopes.length) {
                    c.notify('Конверт в нужном мешке. Разложено ' + mailCount + ' из ' + envelopes.length + '.');
                    return;
                }
                sorted = { due: (Math.floor(c.calendarMinutes / dayLength) + 1) * dayLength + deliveryTime, delivered: false, seen: false };
                c.sim.money += 120;
                c.addMapPin(cafe.x, cafe.z, 'Кафе «Горячий лёд» · новый график');
                announce(c, 'Три конверта отсортированы. После 07:00 новый график появится у кафе «Горячий лёд». +120 ₽');
            }
        })));
    }
    function act(id, c) {
        if (!actions(c).some(row => row.id === id))
            return false;
        if (id === 'escort') {
            const restriction = bridgeRestriction(c);
            c.choose(restriction ? 'Сводка диспетчера · ' + restriction : 'Маршрут сменного фургона', [
                { label: restriction ? 'Прямой рейс временно закрыт' : 'Прямо · через Вагонный мост · 500 м', run: () => start(c, 'direct') },
                { label: 'Объезд · Карьерный мост и Сортировочное шоссе · 1,25 км', run: () => start(c, 'detour') }
            ]);
        } else if (id === 'escort-status') {
            c.choose('Водитель ждёт, если машина сопровождающего отстала или вышла из строя.', [
                { label: 'Продолжить рейс', run: () => c.notify('Держитесь за оранжевым маяком.') },
                { label: 'Отменить сопровождение', run: () => cancel(c) }
            ]);
        } else if (id === 'escort-finish') {
            const route = routes[trip.route];
            c.sim.money += route.reward;
            escorted = trip.route;
            trip = null;
            parked = true;
            announce(c, 'Таможенный склад принял смену. Маршрут · ' + route.title + '. +' + route.reward + ' ₽');
        } else if (id === 'post-night') {
            if (c.waitUntil(nightStarts))
                c.notify('21:00. Ставни поднялись, ночная сортировка началась.');
        } else if (id === 'post-sort') {
            sortAtWindow(c);
        } else if (id === 'post-status') {
            c.notify('Мешок для Литейной запечатан. Развозка прибудет к 07:00.');
        } else if (id === 'post-morning') {
            if (c.waitUntil(deliveryTime))
                c.notify('07:00. У кафе заканчивают утреннюю развозку.');
        } else if (id === 'cafe-board') {
            if (!sorted.seen)
                c.record('У «Горячего льда» висит новый график завтраков. Кафе открыто с 06:30.');
            sorted.seen = true;
            c.notify('«Завтрак для смены. Кафе открыто с 06:30». Конверт из «Почты 87» доставлен.');
        }
        return true;
    }
    function update(c) {
        if (sorted && !sorted.delivered && c.calendarMinutes >= sorted.due) {
            sorted.delivered = true;
            announce(c, 'Почтальон вывесил новый график завтраков у кафе «Горячий лёд».');
            c.persist?.();
        }
        view?.post(atNight(c), sorted?.delivered ?? false);
        let van = vanById(c);
        if (trip) {
            const route = routes[trip.route];
            if (!van && c.zone === 'street' && dist(c.player, route.at(trip.distance)) < 140)
                van = attachVan(c, route, trip, trip.distance >= route.length ? [0] : [0, 2.5, 5]);
            if (van && !c.sim.impactSliding.has(van)) {
                const gap = dist(c.player, van);
                const following = c.car && c.zone === 'street' && !c.sim.wanted && !c.sim.transition && c.dt > 0;
                if (following && gap >= 5 && gap < followDistance && trip.distance < route.length) {
                    warned = false;
                    advanceVan(c, van, trip, route, gap);
                    if (trip.distance >= route.length) {
                        stopVan(van);
                        announce(c, 'Фургон у Таможенного склада. Остановитесь рядом и сдайте путевой лист.');
                    }
                } else {
                    stopVan(van);
                    if (!warned && following && gap >= followDistance && gap < 85 && trip.distance < route.length) {
                        warned = true;
                        c.notify('Сменный фургон остановился. Подъедьте ближе к оранжевому маяку.');
                    }
                }
            }
        } else if (van && (!parked || dist(c.player, van) > 90)) {
            detachVan(c.sim, van);
            parked = false;
            van = null;
        }
        view?.van(van && c.zone === 'street' && dist(c.player, van) < 145 ? van : null, c.sim.elapsed);
    }
    function agenda() {
        const rows = [];
        if (trip) {
            const route = routes[trip.route];
            rows.push({ title: 'Сменный фургон · ' + route.title, goal: trip.distance >= route.length ?
                'Сдать путевой лист у Таможенного склада.' :
                'Следовать за фургоном с оранжевым маяком. До склада ' + Math.ceil(route.length - trip.distance) + ' м.' });
        }
        if (sorted && !sorted.seen)
            rows.push({ title: 'Почта 87', goal: sorted.delivered ?
                'Новый график висит у входа в «Горячий лёд» на Литейной.' :
                'После 07:00 следующего дня проверить доску у кафе «Горячий лёд».' });
        else if (!sorted && mailCount)
            rows.push({ title: 'Почта 87', goal: 'Разложено ' + mailCount + ' из ' + envelopes.length + '. Вернуться к ночному окну с 21:00 до полуночи.' });
        return rows;
    }
    function save() {
        return { trip: trip && { ...trip }, escorted, mailCount, sorted: sorted && { ...sorted } };
    }
    function restore(raw) {
        escorted = typeof raw?.escorted === 'string' && Object.hasOwn(routes, raw.escorted) ? raw.escorted : '';
        const saved = raw?.trip;
        trip = !escorted && typeof saved?.route === 'string' && Object.hasOwn(routes, saved.route) && Number.isFinite(saved.distance) ?
            { route: saved.route, distance: Math.max(0, Math.min(routes[saved.route].length, saved.distance)) } : null;
        const letter = raw?.sorted;
        sorted = Number.isSafeInteger(letter?.due) && letter.due >= dayLength + deliveryTime ?
            { due: letter.due, delivered: letter.delivered === true, seen: letter.delivered === true && letter.seen === true } : null;
        mailCount = sorted ? envelopes.length : Number.isInteger(raw?.mailCount) ? Math.max(0, Math.min(envelopes.length - 1, raw.mailCount)) : 0;
        parked = warned = false;
        view?.post(false, sorted?.delivered ?? false);
        view?.van(null, 0);
    }
    return { actions, act, update, agenda, save, restore };
}

exports.guides = guides;
exports.createDistrictDeliveries = createDistrictDeliveries;
