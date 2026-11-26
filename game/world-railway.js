"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TramRider = exports.tramStops = exports.serviceCycle = exports.serviceStart = exports.departureTime = exports.arrivalTime = exports.trackLength = void 0;
exports.railAt = railAt;
exports.tramPose = tramPose;
exports.linePose = linePose;
exports.tramLocal = tramLocal;
const alignment = [
    [5, -105], [5, -68], [5, -40], [5, -31], [5.25, -22], [4.35, -9],
    [2.72, 3.5], [2.8, 12.3], [4.2, 17.5], [6.36, 21.4], [8.2, 23.8],
    [10.55, 24.86], [11.65, 24.95], [12.55, 24.95], [14.20, 24.95], [19.2, 24.95], [24.5, 24.95]
];
const rail = [];
function coordinate(a, b, c, d, t) {
    return .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
for (let j = 0; j < alignment.length - 1; j++) {
    const a = alignment[Math.max(0, j - 1)], b = alignment[j], c = alignment[j + 1], d = alignment[Math.min(alignment.length - 1, j + 2)];
    const samples = Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / .45);
    for (let i = j ? 1 : 0; i <= samples; i++) {
        const t = i / samples, x = coordinate(a[0], b[0], c[0], d[0], t), z = coordinate(a[1], b[1], c[1], d[1], t);
        const last = rail[rail.length - 1];
        rail.push({ x, z, m: last ? last.m + Math.hypot(x - last.x, z - last.z) : 0 });
    }
}
exports.trackLength = rail[rail.length - 1].m;
function railAt(m) {
    let l = 0, r = rail.length - 1;
    while (l + 1 < r) {
        const k = (l + r) >> 1;
        if (rail[k].m <= m)
            l = k;
        else
            r = k;
    }
    const a = rail[l], b = rail[r], t = Math.min(1, Math.max(0, (m - a.m) / (b.m - a.m)));
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z), trackMetres: a.m + (b.m - a.m) * t };
}
const start = 50, platform = exports.trackLength - 10.65;
const brakeAt = 5 + (platform - start - 20 - 16) / 8;
exports.arrivalTime = brakeAt + 4, exports.departureTime = exports.arrivalTime + 14;
function tramPose(seconds) {
    let m = start, speed = 0, doors = 0, phase = 'delayed';
    if (seconds >= 0 && seconds < exports.arrivalTime) {
        phase = 'approaching';
        if (seconds <= 5) {
            m = start + .8 * seconds * seconds;
            speed = 1.6 * seconds;
        }
        else if (seconds <= brakeAt) {
            m = start + 20 + (seconds - 5) * 8;
            speed = 8;
        }
        else {
            const remain = exports.arrivalTime - seconds;
            m = platform - remain * remain;
            speed = 2 * remain;
        }
    }
    else if (seconds >= exports.arrivalTime && seconds < exports.departureTime) {
        phase = 'platform';
        m = platform;
        doors = Math.min(1, (seconds - exports.arrivalTime) / .85, (exports.departureTime - seconds) / .85);
    }
    else if (seconds >= exports.departureTime) {
        const t = seconds - exports.departureTime;
        m = platform - (t < 5 ? .8 * t * t : 20 + (t - 5) * 8);
        speed = -Math.min(8, t * 1.6);
        phase = m > 5 ? 'returning' : 'finished';
    }
    return { ...railAt(m), visible: phase !== 'finished', phase, doors, speed };
}
const depotMetres = 65, approachMetres = 5;
const approachTime = 17, dwell = 14, journey = 24;
exports.serviceStart = exports.departureTime + 5 + (platform - approachMetres - 20) / 8;
const worksMetres = 92;
const worksRail = railAt(worksMetres);
exports.serviceCycle = 6 * (dwell + journey);
exports.tramStops = {
    depot: { x: 7.58, z: -36.50, title: 'Трамвайное депо' },
    works: { x: worksRail.x + 3.5, z: worksRail.z + 3.1, title: 'Мастерские' },
    market: { x: 17.05, z: 22.59, title: 'Рынок «Спектр»' }
};
const termini = exports.stopMetres = { depot: depotMetres, works: worksMetres, market: platform };
const legs = [['depot','market','07'], ['market','depot','07'], ['depot','works','17Д'],
    ['works','market','17Р'], ['market','works','17Р'], ['works','depot','17Д']];
function siding(m) {
    const t = Math.max(0, Math.min(1, (m - 79) / 26)), curve = Math.sin(Math.PI * t), base = railAt(m);
    return { ...base, x: base.x + 1.18 * curve * curve,
        yaw: base.yaw + Math.atan(1.18 * Math.PI / 26 * Math.sin(2 * Math.PI * t)) };
}
exports.serviceSiding = siding;
function smoothRide(from, to, t, span) {
    const p = Math.max(0, Math.min(1, t / span));
    return { m: from + (to - from) * p * p * (3 - 2 * p), speed: (to - from) * 6 * p * (1 - p) / span };
}
function linePose(seconds) {
    let stop = null, nextStop = 'depot';
    if (seconds < exports.serviceStart)
        return { ...tramPose(seconds), stop, nextStop, service: false };
    const since = seconds - exports.serviceStart;
    if (since < approachTime) {
        const p = smoothRide(approachMetres, depotMetres, since, approachTime);
        return { ...railAt(p.m), visible: true, phase: 'approaching', doors: 0, speed: p.speed, stop, nextStop, service: true };
    }
    const half = dwell + journey, clock = (since - approachTime) % exports.serviceCycle;
    const [origin, destination, line] = legs[Math.floor(clock / half)];
    const elapsed = clock % half, from = termini[origin], to = termini[destination];
    const alignmentAt = line === '07' ? railAt : siding;
    nextStop = destination;
    if (elapsed < dwell) {
        stop = origin;
        return { ...alignmentAt(from), visible: true, phase: 'platform', speed: 0, doors: Math.min(1, elapsed / .95, (dwell - elapsed) / .95), stop, nextStop, line, elapsedAtStop: elapsed, service: true };
    }
    const p = smoothRide(from, to, elapsed - dwell, journey);
    return { ...alignmentAt(p.m), visible: true, phase: (to > from ? 'approaching' : 'returning'), speed: p.speed, doors: 0, stop, nextStop, line, service: true };
}
function tramLocal(p, x, z) {
    return { x: p.x + Math.cos(p.yaw) * x + Math.sin(p.yaw) * z, z: p.z - Math.sin(p.yaw) * x + Math.cos(p.yaw) * z };
}
class TramRider {
    onboard = false;
    request = null;
    last = null;
    entryProgress = 1;
    boardingYaw = 0;
    seat = false;
    entryDoor = 3.3;
    save() { return { onboard: this.onboard, request: this.request, last: this.last, boardingYaw: this.boardingYaw, entryProgress: this.entryProgress, seat: this.seat, entryDoor: this.entryDoor }; }
    restore(s) {
        this.onboard = !!s?.onboard;
        this.request = Object.hasOwn(exports.tramStops, s?.request) ? s.request : null;
        this.last = Object.hasOwn(exports.tramStops, s?.last) ? s.last : null;
        this.seat = this.onboard && !!s?.seat;
        this.entryDoor = s?.entryDoor < 0 ? -3.3 : 3.3;
        this.entryProgress = Math.max(0, Math.min(1, s?.entryProgress ?? 1));
        this.boardingYaw = s?.boardingYaw ?? 0;
    }
    stopName(seconds) { const p = linePose(seconds); return exports.tramStops[p.stop ?? p.nextStop].title; }
    nearPlatform(p) {
        for (const [id, s] of Object.entries(exports.tramStops))
            if (Math.hypot(s.x - p.x, s.z - p.z) < 2.75)
                return id;
        return null;
    }
    hint(hero, seconds) {
        const s = this.nearPlatform(hero);
        if (!s && !this.onboard)
            return '';
        const p = linePose(seconds);
        if (this.onboard) {
            if (p.stop && p.doors > .72)
                return 'Выйти из трамвая';
            return this.request ? 'Отменить заказ остановки' : 'Выход на следующей';
        }
        if (p.stop === s && p.doors > .72)
            return p.elapsedAtStop < 1.6 ? 'Пропустить выходящих пассажиров' : 'Войти в трамвай';
        return 'Расписание трамваев';
    }
    leave(hero, s, free, rail) {
        const place = exports.tramStops[s], p = rail ?? railAt(termini[s]);
        for (const offset of [0, .64, -.64, 1.26, -1.26]) {
            const x = place.x + Math.sin(p.yaw) * offset, z = place.z + Math.cos(p.yaw) * offset;
            if (!free(x, z))
                continue;
            Object.assign(hero, { x, z, y: 0, yaw: p.yaw - Math.PI * .5, speed: 0 });
            this.onboard = false;
            this.seat = false;
            this.request = null;
            this.last = null;
            return true;
        }
        return false;
    }
    act(hero, seconds, free) {
        const p = linePose(seconds), hint = this.hint(hero, seconds);
        if (hint === 'Пропустить выходящих пассажиров') return 'Сначала выход. Передняя дверь откроется для посадки через секунду.';
        if (hint === 'Войти в трамвай') {
            this.onboard = true;
            this.request = null;
            this.last = p.stop;
            this.entryProgress = 0;
            this.boardingYaw = p.yaw;
            this.place(hero, p);
            return 'Проходите в салон. Следующая — ' + exports.tramStops[p.nextStop].title + '.';
        }
        if (hint === 'Выйти из трамвая')
            return this.leave(hero, p.stop, free, p) ? 'Вы на остановке «' + exports.tramStops[p.stop].title + '».' : 'У двери занято. Попробуйте через секунду.';
        if (this.onboard) {
            this.request = this.request ? null : p.nextStop;
            return this.request ? 'Запрошен выход · ' + exports.tramStops[this.request].title : 'Заказ остановки отменён.';
        }
        if (seconds < 0)
            return 'Линия 07 задержана до ремонта стрелки. Диспетчер ждёт блок с рынка.';
        if (!p.service)
            return 'После последнего рейса откроется челночный маршрут Депо — Рынок.';
        const stop = this.nearPlatform(hero);
        for (let t = 1; t <= exports.serviceCycle + approachTime; t++) {
            const next = linePose(seconds + t);
            if (next.stop === stop && next.doors > .72)
                return 'Линия ' + next.line + ' до «' + exports.tramStops[next.nextStop].title + '» · до посадки примерно ' + t + ' с.';
        }
        return 'Ближайшие рейсы указаны на бумажной схеме платформы.';
    }
    place(hero, p) {
        const local = tramLocal(p, this.seat ? -.78 : -.56, this.seat ? 1.16 : this.entryDoor < 0 ? -2.1 : 1.22);
        Object.assign(hero, { x: local.x, z: local.z, y: 1.04, yaw: p.yaw, speed: 0 });
    }
    update(dt, hero, seconds, free) {
        if (!this.onboard)
            return null;
        const p = linePose(seconds);
        this.entryProgress = Math.min(1, this.entryProgress + dt / .82);
        this.place(hero, p);
        if (p.stop && p.doors > .74 && this.request === p.stop && this.leave(hero, p.stop, free, p))
            return { stop: p.stop, exited: true };
        if (p.stop && p.doors > .74 && this.last !== p.stop) {
            this.last = p.stop;
            return { stop: p.stop, exited: false };
        }
        if (!p.stop)
            this.last = null;
        return null;
    }
}
exports.TramRider = TramRider;
