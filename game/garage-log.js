"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GarageLog = exports.wearOptions = void 0;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const ladoga_history_js_1 = require("./ladoga-history.js");
const limit = 4;
const coats = require("./human-kits.js").heroCoats.map(coat => coat.name);
exports.wearOptions = [
    { key: 'hat', label: 'Головной убор', names: ['Без головного убора', 'Графитовая шапка', 'Шапка смены'] },
    { key: 'gloves', label: 'Перчатки', names: ['Штатные', 'Кожаные рабочие', 'Тёмные утеплённые'] },
    { key: 'boots', label: 'Ботинки', names: ['Коричневые', 'Чёрные зимние', 'Светлые рабочие'] },
];
const finite = (x) => Number.isFinite(x) ? Math.max(0, x) : 0;
const action = (id, label, value = '') => `<button type="button" class="k-job-btn" data-action="${id}" data-value="${value}">${label}</button>`;
const metres = (n) => n < 1000 ? `${Math.round(n)} м` : `${(Math.round(n / 100) / 10).toLocaleString('ru-RU')} км`;
class GarageLog {
    state;
    ladoga;
    constructor(saved, first) {
        const stored = Array.isArray(saved?.cars) ? saved.cars.filter(id => typeof id === 'string' && /^[a-z0-9-]{1,64}$/.test(id)).slice(0, limit) : [];
        if (first && !stored.includes(first) && stored.length < limit)
            stored.push(first);
        const records = {};
        for (const kind of Object.keys(vehicle_cabin_js_1.vehicleNames)) {
            const old = saved?.records?.[kind];
            if (old)
                records[kind] = { metres: finite(old.metres), speed: finite(old.speed) };
        }
        const outfit = { hat: 0, gloves: 0, boots: 0 };
        for (const { key, names } of exports.wearOptions) {
            const value = saved?.outfit?.[key];
            if (Number.isInteger(value) && value >= 0 && value < names.length)
                outfit[key] = value;
        }
        this.state = { cars: [...new Set(stored)], records, walking: finite(saved?.walking ?? 0), outfit, wait: finite(saved?.wait ?? 0) % 1440, lights: saved?.lights !== false, shutter: typeof saved?.shutter === 'boolean' ? saved.shutter : undefined };
        this.ladoga = new ladoga_history_js_1.LadogaHistory(saved?.ladoga);
    }
    get outfit() { return this.state.outfit; }
    get wait() { return this.state.wait; }
    get lights() { return this.state.lights !== false; }
    get shutter() { return this.state.shutter; }
    toggleLights() { this.state.lights = !this.lights; }
    toggleShutter(current) { this.state.shutter = !(this.state.shutter ?? current > .54); }
    save() { return { ...structuredClone(this.state), ladoga: this.ladoga.save() }; }
    add(id) {
        if (this.state.cars.includes(id))
            return '';
        if (this.state.cars.length === limit)
            return 'Все четыре места заняты. Освободите место в журнале гаража.';
        this.state.cars.push(id);
        return 'Добавлено в гаражный журнал';
    }
    remove(id) { this.state.cars = this.state.cars.filter(car => car !== id); }
    has(id) { return this.state.cars.includes(id); }
    canAdd(id) { return this.has(id) || this.state.cars.length < limit; }
    setTime(target, current) { this.state.wait = (this.state.wait + target - current + 1440) % 1440; }
    pause(hours) { this.state.wait = (this.state.wait + hours * 60) % 1440; }
    cycle(key) {
        const option = exports.wearOptions.find(row => row.key === key);
        if (!option)
            return;
        const index = (this.outfit[option.key] + 1) % option.names.length;
        this.outfit[option.key] = index;
        return option.names[index];
    }
    travel(before, after, car, dt) {
        const distance = Math.hypot(after.x - before.x, after.z - before.z);
        if (distance < .0001 || distance > Math.max(.8, dt * 54))
            return;
        if (car) {
            const records = this.state.records, entry = records[car.kind] ??= { metres: 0, speed: 0 };
            entry.metres += distance;
            entry.speed = Math.max(entry.speed, Math.abs(car.speed));
        }
        else
            this.state.walking += distance;
    }
    draw(cars, player, rewarded, coat, canChange, atGarage) {
        const collection = this.state.cars.map(id => cars.find(car => car.id === id)).filter((car) => !!car);
        const favourite = Object.entries(this.state.records).sort((a, b) => b[1].metres - a[1].metres)[0]?.[0];
        const stats = Object.entries(this.state.records).map(([id, drive]) => `<li>${vehicle_cabin_js_1.vehicleNames[id]} · ${metres(drive.metres)} · ${Math.round(drive.speed * 3.6)} км/ч</li>`);
        const local = collection.map(car => `<article><h3>${vehicle_cabin_js_1.vehicleNames[car.kind]}</h3><p>Кузов ${Math.round(car.health)}% · ${metres(Math.hypot(player.x - car.x, player.z - car.z))} от вас</p><div class="k-job-choices">${action('garage-find', 'На карте', car.id)}${atGarage && Math.hypot(player.x - car.x, player.z - car.z) > 15 ? action('garage-recall', 'Подать к гаражу', car.id) : ''}${action('garage-forget', 'Освободить место', car.id)}</div></article>`);
        const clothes = canChange ? action('garage-coat', coats[coat] ?? coats[0]) + exports.wearOptions.map(item => action('garage-wear', item.label + ' · ' + item.names[this.outfit[item.key]], item.key)).join('') : '<p>Переодеться можно в квартире или у Канальных гаражей.</p>';
        return `<div class="k-tour"><div class="k-job-choices">${action(ladoga_history_js_1.ladogaPanel, 'История «Ладоги 04»')}</div><h3>Места в гараже · ${local.length} / ${limit}</h3>${local.length ? '<div class="k-fleet">' + local.join('') + '</div>' : '<p>Подъедьте к Канальным гаражам и выберите «Сохранить машину».</p>'}${atGarage ? `<div class="k-job-choices">${action('garage-light', this.lights ? 'Выключить свет бокса' : 'Включить свет бокса')}${action('garage-shutter', 'Роллета мастерской')}</div>` : ''}<h3>Гардероб</h3><div class="k-job-choices">${clothes}</div><h3>Статистика</h3><p>Пешком ${metres(this.state.walking)} · Заказов закрыто ${rewarded}${favourite ? ' · Чаще всего за рулём ' + vehicle_cabin_js_1.vehicleNames[favourite] : ''}</p>${stats.length ? '<ol>' + stats.join('') + '</ol>' : ''}</div>`;
    }
}
exports.GarageLog = GarageLog;
