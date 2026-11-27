"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteriorLife = void 0;
const house_layout_js_1 = require("./house-layout.js");
const interior_layout_js_1 = require("./interior-layout.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const city_clock_js_1 = require("./city-clock.js");
const city_life_layout_js_1 = require("./city-life-layout.js");
const { schoolFloors } = require("./school-layout.js");
const originalSouvenirs = ['билет последнего рейса', 'брелок из Канального гаража', 'кассета с переговоров'];
const stops = {
    basement: { x: 36, z: 2.75, label: '−1 · Тепловой узел', height: -2.75, yaw: 0 },
    foyer: { x: -2.36, z: 6.31, label: '1 · Выход во двор', height: 0, yaw: 0 },
    landing: { x: -2.40, z: -5.68, label: '2 · Квартира 7', height: 3.06, yaw: 0 },
    roof: { x: -92, z: 3.58, label: 'К · Крыша', height: 18.2, yaw: 0 }
};
const { rehearsalOpen } = require('./venue-layout.js');
const coats = require("./human-kits.js").heroCoats.map(coat => coat.name);
const initialLift = () => ({ car: 'landing', from: 'landing', to: 'landing', time: 0, total: 0, phase: 'shut', open: 0 });
const point = (x, z, yaw = 0) => ({ x, z, yaw, y: (0, house_layout_js_1.houseFloor)(x, z), speed: 0 });
const near = (p, q, r = 1.47) => Math.hypot(p.x - q.x, p.z - q.z) < r;
class InteriorLife {
    coat = 0;
    archiveMap = false;
    apartmentKnown = false;
    heardIlya = false;
    memorabilia = [];
    setMementos(mission, souvenirs) {
        const originals = originalSouvenirs.slice(0, Math.min(mission, 3));
        if (this.memorabilia.length !== originals.length + souvenirs.length || souvenirs.some((s, i) => s !== this.memorabilia[originals.length + i]))
            this.memorabilia = [...originals, ...souvenirs];
    }
    loan = 'none';
    leftAt = -1;
    finds = [];
    lift = initialLift();
    peek = null;
    entry = 'house';
    openedGates = new Set();
    hydroPower = true;
    privacy = 0;
    indoorClock = 0;
    moduleTested = false;
    avatar = null;
    get zone() { return this.avatar ? (0, interior_layout_js_1.zoneAt)(this.avatar.x, this.avatar.z, this.avatar.y) : 'street'; }
    radioAtWindow(elapsed) { return this.loan === 'left' && elapsed - this.leftAt >= 42; }
    get lookout() {
        if (!this.peek)
            return null;
        if (this.peek === 'yard')
            return { x: -28.8, y: 4.78, z: 16.21, yaw: Math.PI };
        if (this.peek === 'rail')
            return { x: 7.95, y: 2.55, z: -33.9, yaw: Math.PI * .55 };
        return { x: -31 + (this.avatar.x + 92), y: 19.91, z: 10 + this.avatar.z, yaw: this.avatar.yaw };
    }
    acoustics(outside, elapsed) {
        const a = this.avatar ?? outside, z = this.zone, level = (x, y, r) => Math.max(0, 1 - Math.hypot(x - a.x, y - a.z) / r);
        return { accordion: z === 'house' ? level(-.43, -5.91, 9) * (.45 + .55 * this.privacy) : 0,
            voices: z === 'house' ? level(1.50, -4.23, 5) : 0, clarity: .2 + this.privacy * .8,
            radio: this.radioAtWindow(elapsed) ? (z === 'street' ? level(-38, 17, 15) : z === 'house' ? level(8.0, 6, 6) : 0) : 0,
            pump: z === 'basement' ? .9 : 0, lift: this.lift.phase === 'moving' ? (z === 'lift' ? 1 : this.liftStop() ? .48 : 0) : 0,
            pan: z === 'house' ? (1.5 - a.x) / 4 : 0, hour: Math.floor((0, city_clock_js_1.districtMinutes)(elapsed) / 60), station: z === 'street' ? level(-25, -94, 115) : 0 };
    }
    domainSave() {
        const { coat, archiveMap, apartmentKnown, loan, leftAt, finds, lift, peek, entry, privacy, moduleTested } = this;
        return { coat, archiveMap, apartmentKnown, heardIlya: this.heardIlya, loan, leftAt, finds: [...finds], lift: { ...lift }, peek, entry, privacy, moduleTested, indoorClock: this.indoorClock, gates: [...this.openedGates], hydroPower: this.hydroPower };
    }
    domainRestore(v) {
        this.indoorClock = Math.max(0, Number(v?.indoorClock) || 0);
        this.coat = Math.max(0, Math.min(2, Math.floor(v?.coat ?? 0)));
        this.archiveMap = !!v?.archiveMap;
        this.apartmentKnown = !!v?.apartmentKnown;
        this.heardIlya = !!v?.heardIlya;
        this.moduleTested = !!v?.moduleTested;
        this.loan = v?.loan === 'left' || v?.loan === 'held' ? v.loan : 'none';
        this.leftAt = Number.isFinite(v?.leftAt) ? v.leftAt : -1;
        this.finds = Array.isArray(v?.finds) ? v.finds.filter(x => typeof x === 'string') : [];
        this.lift = v?.lift && Object.hasOwn(stops, v.lift.car) && Object.hasOwn(stops, v.lift.to) ? { ...v.lift } : initialLift();
        this.peek = this.avatar && ['rail', 'yard', 'roof'].includes(v?.peek ?? '') ? v.peek : null;
        this.entry = v?.entry && Object.hasOwn(exploration_layout_js_1.entrances, v.entry) ? v.entry : 'house';
        this.openedGates.clear();
        for (const g of city_life_layout_js_1.serviceGates)
            if (v?.gates?.includes(g.id))
                this.openedGates.add(g.id);
        this.hydroPower = v?.hydroPower !== false;
        this.privacy = Math.max(0, Math.min(1, v?.privacy ?? 0));
    }
    liftStop() {
        if (!this.avatar)
            return null;
        for (const [id, q] of Object.entries(stops))
            if (near(this.avatar, q, 1.56))
                return id;
        return null;
    }
    tickLife(dt) {
        this.indoorClock = (this.indoorClock + dt) % 24;
        this.privacy = Math.max(0, this.privacy - dt * .15);
        const d = this.lift;
        if (d.phase === 'closing') {
            d.open = Math.max(0, d.open - dt * 1.55);
            if (d.open <= 0) {
                d.phase = 'moving';
                d.time = 0;
            }
        }
        else if (d.phase === 'moving') {
            d.time = Math.min(d.total, d.time + dt);
            if (d.time >= d.total) {
                d.car = d.to;
                d.phase = 'opening';
            }
        }
        else if (d.phase === 'opening') {
            d.open = Math.min(1, d.open + dt * 1.55);
            if (d.open === 1)
                d.phase = 'open';
        }
    }
    callLift(stop) {
        const d = this.lift;
        if (d.phase === 'moving' || d.phase === 'closing' || d.phase === 'opening')
            return;
        if (d.car === stop) {
            d.phase = 'opening';
            return;
        }
        d.from = d.car;
        d.to = stop;
        d.time = 0;
        d.total = .8 + Math.abs(stops[d.car].height - stops[stop].height) * .16;
        d.phase = d.open > 0 ? 'closing' : 'moving';
    }
    options(outside, elapsed, minutes = (0, city_clock_js_1.districtMinutes)(elapsed)) {
        const p = this.avatar ?? outside, zone = this.zone;
        const a = [];
        const add = (id, label) => a.push({ id: 'home:' + id, label });
        if (this.peek) {
            add('back', 'Отойти от окна');
            return a;
        }
        if (zone === 'street') {
            if ((0, house_layout_js_1.canEnterHouse)(p.x, p.z))
                add('door-house', 'Войти в дом');
            if (near(p, exploration_layout_js_1.entranceIntercom, 1.28)) {
                add('bell7', 'Домофон · квартира 7');
                add('bell12', 'Домофон · квартира 12');
            }
            if (near(p, exploration_layout_js_1.entrances.workshop, 1.68))
                add('door-workshop', 'В мастерскую Инны');
            if (near(p, exploration_layout_js_1.entrances.dispatch, 1.64))
                add('door-dispatch', 'В диспетчерскую');
            for (const id of exploration_layout_js_1.serviceEntries) {
                const q = exploration_layout_js_1.entrances[id];
                if (id === 'metal-hall' && !rehearsalOpen(minutes))
                    continue;
                if (near(p, q, 1.62))
                    add('door-' + id, 'Войти · ' + q.label);
            }
            if (near(p, exploration_layout_js_1.passageFront, 1.35))
                add('passage-front', 'Войти в сквозной подъезд');
            if (near(p, exploration_layout_js_1.entrances.passage, 1.35))
                add('passage-back', 'Войти со стороны двора');
            for (const g of city_life_layout_js_1.serviceGates)
                if (!this.openedGates.has(g.id) && near(p, g, 3.3) && (p.x - g.x) * g.inside > .54)
                    add('gate-' + g.id, 'Открыть · ' + g.name);
            if (near(p, exploration_layout_js_1.swapCabinet, 1.5))
                add('swap', this.loan === 'held' ? 'Оставить приёмник' : 'Открыть шкаф обмена');
            for (const f of exploration_layout_js_1.bankFinds)
                if (near(p, f, 1.9))
                    add('find-' + f.id, f.name);
            if (near(p, { x: 69, z: 21.85 }, 2.5) && (0, exploration_layout_js_1.marketLayouts)(elapsed).length === 0)
                add('night', 'Обратиться в дежурный киоск');
            return a;
        }
        if (schoolFloors[zone]) {
            if (zone === 'school1' && near(p, schoolFloors.school1.entrance, 1.6))
                add('exit-annex', 'Выйти на улицу');
            return a;
        }
        if (zone === 'lift') {
            const d = this.lift;
            if (d.phase === 'open' || d.phase === 'shut') {
                add('lift-out', 'Выйти · ' + stops[d.car].label);
                for (const [id, q] of Object.entries(stops))
                    if (id !== d.car)
                        add('lift-' + id, q.label);
            }
            return a;
        }
        const liftStop = this.liftStop();
        if (liftStop && this.lift.phase !== 'moving' && this.lift.phase !== 'closing' && this.lift.phase !== 'opening')
            add(this.lift.phase === 'open' && this.lift.car === liftStop ? 'lift-in' : 'call', this.lift.phase === 'open' && this.lift.car === liftStop ? 'Войти в лифт' : 'Вызвать лифт');
        if (zone === 'house') {
            if ((0, house_layout_js_1.canExitHouse)(p.x, p.z))
                add('exit-house', 'Выйти на улицу');
            if (near(p, { x: .85, z: 5.2 }, 1.48)) {
                add('board61', 'Объявление · дом № 23');
                add('board66', 'Объявление · отопление');
            }
            if (near(p, { x: -2.20, z: 4.81 }, 1.6))
                add('map', 'Прочитать схему 2060 года');
            if (near(p, { x: -.43, z: -5.98 }, 1.42))
                add('stairs', 'По лестнице на крышу');
            if (near(p, { x: -1.10, z: 5.67 }, 1.13))
                add('basement', 'Спуститься в подвал');
            if (near(p, { x: 7.49, z: -5.54 }, 1.66))
                add('coat', 'Переодеться · ' + coats[(this.coat + 1) % 3]);
            if (near(p, { x: 4.49, z: 2.0 }, 1.18))
                add('desk', 'Рассмотреть памятные вещи');
            if (near(p, { x: 9.43, z: 6.10 }, 1.46))
                add('yard', 'Посмотреть из окна кухни');
            if (near(p, { x: -.42, z: -5.0 }, 2))
                add('listen', 'Прислушаться за дверью № 12');
        }
        else if (zone === 'stairs') {
            if (near(p, { x: interior_layout_js_1.stairBaseX, z: 3.40 }, 1.06))
                add('landing', 'На второй этаж');
            if (near(p, { x: interior_layout_js_1.stairBaseX + 4 * interior_layout_js_1.laneWidth, z: -3.42 }, 1.08))
                add('roof', 'Открыть выход на крышу');
        }
        else if (zone === 'roof') {
            if (near(p, { x: -98, z: .80 }, 1.52))
                add('stairs-down', 'На лестницу');
            add('vista', 'Осмотреть город с крыши');
        }
        else if (zone === 'basement') {
            if (near(p, { x: 34.2, z: 2.88 }, 1.64))
                add('foyer', 'Подняться в подъезд');
        }
        else if (zone === 'passage') {
            if (p.z > 3.55)
                add('passage-exit-front', 'Выйти на Канальную');
            if (p.z < -3.55)
                add('passage-exit-back', 'Выйти в панельный двор');
        }
        else {
            if (near(p, interior_layout_js_1.annexes[zone].entrance, 1.60))
                add('exit-annex', 'Выйти на улицу');
            if (zone === 'workshop') {
                if (near(p, { x: 64, z: -2.1 }, 1.52) && this.loan === 'none')
                    add('borrow', 'Взять приёмник для соседки');
                if (near(p, { x: 67, z: -1.76 }, 1.48))
                    add('bench', 'Проверить модуль на стенде');
            }
            else if (zone === 'dispatch' && near(p, { x: 90.77, z: -2.2 }, 1.60))
                add('rail', 'Посмотреть на стрелку');
            if (zone === 'taxipark' && near(p, { x: 126, z: -1.6 }, 1.55))
                add('taxilog', 'Посмотреть журнал вызовов');
            if (zone === 'taxipark' && near(p, { x: 129.8, z: .48 }, 1.4)) {
                add('wait-am', 'Дождаться утра · 06:00');
                add('wait-pm', 'Дождаться смены · 22:00');
            }
            if (zone === 'cafe' && near(p, { x: 153, z: -1.6 }, 1.55))
                add('cafe-radio', 'Послушать разговор у стойки');
            if (zone === 'terminal') {
                if (near(p, { x: 180, z: -1.6 }, 1.55)) {
                    if (!this.openedGates.has('cargo'))
                        add('gate-cargo', 'Открыть таможенный проезд');
                    add('cargo-register', 'Читать ведомость грузов');
                }
            }
            if (zone === 'hydro' && near(p, { x: 207, z: -1.6 }, 1.55)) {
                add('hydro-power', this.hydroPower ? 'Переключить на резерв' : 'Подать основное питание');
                add('hydro-gauge', 'Проверить уровнемер');
            }
        }
        return a;
    }
    enterAnnex(entry) {
        const room = interior_layout_js_1.annexes[entry], door = room.entrance;
        this.entry = entry;
        this.avatar = point(door.x, door.z, door.yaw);
        this.peek = null;
        return room.name;
    }
    operate(key, outside, elapsed, exitSafe) {
        const to = (x, z, yaw = 0) => { this.avatar = point(x, z, yaw); this.peek = null; };
        const result = (text, sound) => ({ text, sound });
        if (key === 'back') {
            this.peek = null;
            return result('');
        }
        if (key.startsWith('door-')) {
            const entry = key.slice(5);
            if (Object.hasOwn(exploration_layout_js_1.entrances, entry) && Object.hasOwn(interior_layout_js_1.annexes, entry)) {
                return result(this.enterAnnex(entry), 'hinge');
            }
        }
        if (key === 'passage-front' || key === 'passage-back') {
            this.entry = 'passage';
            const back = key.endsWith('back');
            to(234, back ? -4.48 : 4.48, back ? Math.PI : 0);
            return result('Сквозной подъезд · Канальная, 23', 'hinge');
        }
        if (key === 'exit-annex' || key === 'passage-exit-front' || key === 'passage-exit-back') {
            const e = key === 'passage-exit-front' ? exploration_layout_js_1.passageFront : key === 'passage-exit-back' ? exploration_layout_js_1.entrances.passage : exploration_layout_js_1.entrances[this.entry];
            const spots = [0, -.55, .55, -1.1, 1.1].map(dx => ({ x: e.x + dx, z: e.z }));
            const landing = spots.find(exitSafe);
            if (!landing)
                return result('У выхода стоит машина. Освободите проход.');
            Object.assign(outside, { ...landing, y: 0, yaw: e.yaw, speed: 0 });
            this.avatar = null;
            this.entry = 'house';
            return result('', 'hinge');
        }
        const gate = city_life_layout_js_1.serviceGates.find(g => key === 'gate-' + g.id);
        if (gate) {
            this.openedGates.add(gate.id);
            return result('Открыт служебный проезд · ' + gate.name, 'hinge');
        }
        if (key === 'taxilog')
            return result('Журнал таксопарка: пересменка в шесть утра и в десять вечера. Пассажиров ждут у бокового выезда.');
        if (key === 'wait-am' || key === 'wait-pm')
            return { text: 'Время до начала смены прошло.', untilHour: key === 'wait-am' ? 6 : 22, sound: 'notify' };
        if (key === 'cafe-radio')
            return result('У стойки обсуждают груз с испорченным номером: вчера его разгрузили на Западном терминале.');
        if (key === 'cargo-register')
            return result('Ведомость: секция 8, контейнер КН-327. Учётное окно с 22:00 до 06:00.');
        if (key === 'hydro-power') {
            this.hydroPower = !this.hydroPower;
            return result(this.hydroPower ? 'Основное питание восстановлено.' : 'Плотина переведена на резервное питание.', 'notify');
        }
        if (key === 'hydro-gauge')
            return result('Уровнемер: северный бьеф 3,48 м, перепад 0,72 м.');
        if (key === 'bell7') {
            const known = this.apartmentKnown;
            this.apartmentKnown = true;
            return result(known ? 'Галина: узнала голос! Заходи. Посылки оставляем в шкафу у подъезда.' : 'Галина: сосед с седьмой? Запомнила голос. Добро пожаловать домой.', 'notify');
        }
        if (key === 'bell12') {
            const known = this.heardIlya;
            this.heardIlya = true;
            const m = (0, city_clock_js_1.districtMinutes)(elapsed);
            return result(m >= 20 * 60 || m < 8 * 60 ? 'Илья: все уже спят. Я только тихонько перебираю кнопки.' : known ? 'Илья: опять ты? Поднимайся, сыграю припев до конца.' : 'Илья, квартира 12: репетиция до восьми. Если потеряли ключ, спросите в мастерской.', 'notify');
        }
        if (key === 'swap') {
            if (this.loan === 'held') {
                this.loan = 'left';
                this.leftAt = elapsed;
                return result('Приёмник оставлен для соседки. Загляните в это окно немного позже.');
            }
            return result(this.radioAtWindow(elapsed) ? 'На полке записка: «Спасибо! Теперь новости слышны и у нас».' : this.loan === 'left' ? 'Приёмник дожидается соседку на верхней полке.' : '«Берите, что нужно». Соседка ищет радиоприёмник. В мастерской Инны есть запасной.');
        }
        if (key.startsWith('find-')) {
            const f = exploration_layout_js_1.bankFinds.find(x => key === 'find-' + x.id);
            if (!this.finds.includes(f.id))
                this.finds.push(f.id);
            return result(f.description);
        }
        if (key === 'night')
            return { text: 'Дежурная смена. Ищем старые записи для утреннего эфира.', bulletin: 'job-accept-65' };
        if (key === 'map') {
            this.archiveMap = true;
            return result('Схема 2060 года: Канальная тогда называлась Фабричной. За прачечной у дома 23 сквозной проход на улицу Мастеров.');
        }
        if (key.startsWith('board')) {
            const id = key.slice(5);
            return { text: id === '61' ? 'Дом исчез из ведомости. Галина собирает свидетельства жильцов.' : 'В квартирах холодно. Смотритель оставил ключ от теплового узла.', bulletin: 'job-accept-' + id };
        }
        if (key === 'stairs') {
            to(interior_layout_js_1.stairBaseX, 3.45);
            return result('Служебная лестница · выход на кровлю');
        }
        if (key === 'stairs-down') {
            to(interior_layout_js_1.stairBaseX + 4 * interior_layout_js_1.laneWidth, -3.48, Math.PI);
            return result('Лестница · спуск');
        }
        if (key === 'roof') {
            to(-98, .82);
            return result('Кровля · Канальная, 23', 'hinge');
        }
        if (key === 'landing') {
            to(-.43, -5.86, Math.PI);
            return result('Второй этаж');
        }
        if (key === 'foyer') {
            to(-1.05, 5.63);
            return result('Подъезд № 1');
        }
        if (key === 'basement') {
            to(34.18, 2.87);
            return result('Подвал · тепловой узел', 'hinge');
        }
        if (key === 'call') {
            const s = this.liftStop();
            if (s)
                this.callLift(s);
            return result('Кабина вызвана', 'notify');
        }
        if (key === 'lift-in') {
            to(-65, .21);
            return result('Выберите этаж на панели лифта');
        }
        if (key === 'lift-out') {
            const s = stops[this.lift.car];
            to(s.x, s.z, s.yaw);
            return result(s.label);
        }
        if (key.startsWith('lift-')) {
            const s = key.slice(5);
            if (Object.hasOwn(stops, s))
                this.callLift(s);
            return result('Лифт · ' + stops[s].label, 'notify');
        }
        if (key === 'coat') {
            this.coat = (this.coat + 1) % coats.length;
            return result(coats[this.coat]);
        }
        if (key === 'desk')
            return result(this.memorabilia.length ? 'На столе: ' + this.memorabilia.join(', ') + '.' : 'Пока здесь только записная книжка. Вещи, полученные за заказы, герой складывает на этот стол.');
        if (key === 'yard' || key === 'rail' || key === 'vista') {
            this.peek = key === 'vista' ? 'roof' : key;
            return result('');
        }
        if (key === 'listen') {
            this.privacy = 1;
            return result('Дверь приоткрывается. Илья разучивает на баяне «Вечер у канала».');
        }
        if (key === 'borrow') {
            this.loan = 'held';
            return result('Инна передала приёмник для шкафа обмена у дома № 23.');
        }
        if (key === 'bench') {
            this.moduleTested = true;
            return result('Стенд: питание 12,1 В. Импульс прошёл по трём дорожкам. Модуль исправен.', 'notify');
        }
        return result('');
    }
}
exports.InteriorLife = InteriorLife;
