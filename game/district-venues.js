'use strict';

const { river, metal, rehearsalOpen } = require('./venue-layout.js');
const { createVenueView } = require('./venues-view.js');
const { createRehearsalSound, metalTrack, metalTitle } = require('./venues-music.js');

const guides = [
    [river.door.label, river.door.x, river.door.z, 'Южный порт · зал ожидания и рейс в 18:20'],
    [metal.door.label, metal.door.x, metal.door.z, 'Литейный квартал · вечерняя репетиция с 18:00 до 22:00'],
];
const passengerShiftStart = 18 * 60;
const passengerShiftEnd = 19 * 60 + 20;
const recordingLength = 8.2;
const emptyRoutes = river.passengers.map(() => null);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const dayOf = c => Math.floor((c.calendarMinutes ?? c.minutes) / 1440);
const isTime = value => Number.isFinite(value) && value >= 0;

function initialStation(day = -1) {
    return { day, routes: [...emptyRoutes] };
}

function stationSchedule(acting, routed, finished) {
    if (finished)
        return ['РЕЙС 18:20 · ЗАМЕНА', '2 ПАССАЖИРА К АВТОБУСУ 12  ·  1 К ТАКСИ'];
    if (acting)
        return ['18:20 · РЕЙС ЗАДЕРЖАН', routed ? `ПЕРЕНАПРАВЛЕНО: ${routed} ИЗ 3` : 'ОБРАТИТЕСЬ К ДЕЖУРНОЙ У ТАБЛО'];
    return ['18:20 · РЕЙС НА НАБЕРЕЖНУЮ', 'ТАБЛО ОБНОВИТСЯ К НАЧАЛУ ВЕЧЕРНЕЙ СМЕНЫ'];
}

function createDistrictVenues(scene) {
    const view = createVenueView(scene);
    const rehearsalAudio = createRehearsalSound();
    let station = initialStation();
    let spoke = false, stands = [false, false], recordingAt = null, captured = false, broadcastAt = null;

    function stationState(c) {
        const routes = station.day === dayOf(c) ? station.routes : emptyRoutes;
        const routed = routes.filter(Boolean).length;
        const open = (c.minutes >= passengerShiftStart && c.minutes < passengerShiftEnd) || routed > 0;
        return { open, routes, routed };
    }

    function actions(c) {
        const result = [];
        const add = (id, label) => result.push({ id, label });
        if (c.car || c.sim.tramRider?.onboard)
            return result;
        if (c.zone === river.door.zone) {
            const shift = stationState(c);
            if (distance(c.player, river.display) < 6.5)
                add('schedule', 'Посмотреть табло рейсов');
            if (distance(c.player, river.dispatcher) < 2.30) {
                add('dispatcher', 'Поговорить с дежурной Мариной');
                if (!shift.open && c.waitUntil) add('station-wait', 'Дождаться вечернего рейса · 18:00');
            }
            if (shift.open) river.passengers.forEach((p, i) => {
                if (!shift.routes[i] && distance(c.player, p) < 1.75)
                    add('passenger-' + i, 'Подсказать маршрут · ' + p.name);
            });
        }
        if (c.zone === 'street' && distance(c.player, metal.door) < 2.5) {
            add('poster', 'Прочитать афишу ДК');
            if (c.waitUntil && !rehearsalOpen(c.minutes)) add('metal-wait', 'Дождаться репетиции · 18:00');
        }
        if (c.zone === metal.door.zone && rehearsalOpen(c.minutes)) {
            if (distance(c.player, metal.leader) < 2.0) {
                add('leader', 'Поговорить с руководителем ансамбля');
                if (spoke && stands.every(Boolean) && !captured && recordingAt === null)
                    add('record', 'Записать «' + metalTitle + '»');
                if (captured && broadcastAt === null)
                    add('send', 'Передать запись на Канальный FM');
            }
            if (spoke) metal.stands.forEach((p, i) => {
                if (!stands[i] && distance(c.player, p) < 1.42)
                    add('stand-' + i, 'Поставить пюпитр · ' + (i === 0 ? 'аккордеон' : 'контрабас'));
            });
        }
        return result;
    }

    function routePassenger(c, index, mode) {
        const passenger = river.passengers[index];
        if (station.day !== dayOf(c)) station = initialStation(dayOf(c));
        if (station.routes[index]) return;
        if (mode !== passenger.route) {
            c.notify(passenger.name + ': «' + passenger.question + '»');
            return;
        }
        station.routes[index] = { mode, at: c.sim.elapsed };
        c.addMapPin(river[mode].x, river[mode].z, mode === 'bus' ? 'Речной вокзал · автобус 12' : 'Речной вокзал · такси');
        if (station.routes.every(Boolean)) {
            c.record('Речной вокзал: из-за задержки рейса двое отправлены к автобусу 12, один к такси.');
            c.notify(passenger.answer + ' Марина обновила табло.');
        } else {
            c.notify(passenger.answer);
        }
    }

    function act(id, c) {
        if (!actions(c).some(action => action.id === id)) return;
        if (id.startsWith('passenger-')) {
            const index = Number(id.slice('passenger-'.length));
            const passenger = river.passengers[index];
            c.choose(passenger.name + ': «' + passenger.question + '»', [
                { label: 'Автобус 12 · на рынок', run: () => routePassenger(c, index, 'bus') },
                { label: 'Такси · к диспетчерской', run: () => routePassenger(c, index, 'taxi') },
            ]);
        } else if (id === 'schedule') {
            const { open, routed } = stationState(c);
            c.notify(stationSchedule(open, routed, routed === river.passengers.length).join(' · '));
        } else if (id === 'dispatcher') {
            const shift = stationState(c);
            if (shift.routed === river.passengers.length) c.notify('Марина: «Все нашли остановки. Спасибо, что предупредили каждого»');
            else if (shift.open) c.notify('Марина: «В тумане рейс задержан. Спросите троих в зале, куда они едут. К рынку идёт автобус 12, у входа справа стоянка такси»');
            else c.notify('Марина: «Рейс на набережную по расписанию в 18:20. Вечернюю смену начинаем в 18:00»');
        } else if (id === 'station-wait' || id === 'metal-wait') {
            if (!c.waitUntil(id === 'station-wait' ? passengerShiftStart : metal.opens)) {
                c.notify('Чтобы подождать, остановитесь в безопасном месте.');
                return;
            }
            c.notify(id === 'station-wait' ? 'Наступила вечерняя смена. Рейс задержан.' : '18:00. Дверь ДК открыта, изнутри слышна репетиция.');
        } else if (id === 'poster') {
            c.notify('ДК «Металлург» · репетиция ежедневно с 18:00 до 22:00. Вход со двора рядом с кафе.');
        } else if (id === 'leader') {
            spoke = true;
            if (broadcastAt !== null) c.notify('Руководитель: «Наш вальс включат на Канальном FM. Слушайте по дороге»');
            else if (captured) c.notify('Руководитель: «Хорошо записалось. Передай вальс на Канальный FM»');
            else if (stands.every(Boolean)) c.notify('Руководитель: «Пюпитры на месте. Запиши следующий проход!»');
            else c.notify('Руководитель: «Помоги поставить два пюпитра у сцены. Мы репетируем “Литейный вальс”»');
        } else if (id.startsWith('stand-')) {
            stands[Number(id.slice('stand-'.length))] = true;
            c.notify(stands.every(Boolean) ? 'Оба пюпитра на месте. Вернитесь к руководителю.' : 'Пюпитр на месте. Второй стоит у другого края сцены.');
        } else if (id === 'record') {
            recordingAt = c.sim.elapsed;
            c.audio?.unlock?.();
            c.notify('Запись «' + metalTitle + '». Останьтесь в зале до конца прохода.');
        } else if (id === 'send') {
            broadcastAt = c.sim.elapsed + 12;
            c.record('ДК «Металлург»: «Литейный вальс» записан и передан в эфир Канального FM.');
            c.notify('Канальный FM принял «' + metalTitle + '». Запись прозвучит в одном из следующих выпусков.');
        }
    }

    function update(c) {
        const shift = stationState(c);
        const rehearsal = rehearsalOpen(c.minutes);
        const inside = c.zone === metal.door.zone;
        if (recordingAt !== null) {
            if (!inside || !rehearsal) recordingAt = null;
            else if (c.sim.elapsed - recordingAt >= recordingLength) {
                recordingAt = null;
                captured = true;
                c.notify('Запись готова. Подойдите к руководителю, чтобы отправить её в эфир.');
            }
        }
        const outsideLevel = c.zone === 'street' ? Math.max(0, 1 - distance(c.player, metal.door) / 23) * .43 : 0;
        rehearsalAudio(c.audio, rehearsal ? (inside ? .86 : outsideLevel * (c.car ? .49 : 1)) : 0, inside);
        const text = stationSchedule(shift.open, shift.routed, shift.routed === river.passengers.length);
        view(c, shift, text, rehearsal, stands);
    }

    function agenda(c) {
        const { routed } = stationState(c);
        const items = [];
        if (routed > 0 && routed < river.passengers.length)
            items.push({ title: river.door.label, goal: `Подсказать пересадку оставшимся пассажирам · ${routed} из 3` });
        if (spoke && broadcastAt === null)
            items.push({ title: metal.door.label, goal: captured ? 'Передать запись на Канальный FM' : 'Подготовить и записать вечернюю репетицию' });
        return items;
    }

    function save() {
        return { station: { day: station.day, routes: station.routes.map(route => route && { ...route }) }, spoke, stands: [...stands], recordingAt, captured, broadcastAt };
    }

    function restore(raw) {
        station = initialStation(Number.isSafeInteger(raw?.station?.day) ? raw.station.day : -1);
        station.routes = river.passengers.map((passenger, i) => {
            const route = raw?.station?.routes?.[i];
            return route?.mode === passenger.route && isTime(route.at) ? { mode: route.mode, at: route.at } : null;
        });
        spoke = raw?.spoke === true;
        stands = [0, 1].map(i => spoke && raw?.stands?.[i] === true);
        captured = stands.every(Boolean) && raw?.captured === true;
        recordingAt = !captured && stands.every(Boolean) && isTime(raw?.recordingAt) ? raw.recordingAt : null;
        broadcastAt = captured && isTime(raw?.broadcastAt) ? raw.broadcastAt : null;
    }

    function radio(c) {
        return broadcastAt !== null && c.sim.elapsed >= broadcastAt
            ? [{ id: metalTrack, station: 'district', subtitle: 'Канальный FM · ДК «Металлург» — «' + metalTitle + '»' }]
            : [];
    }

    return { actions, act, update, agenda, save, restore, radio };
}

module.exports = { createDistrictVenues, guides };
