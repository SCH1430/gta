"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LadogaHistory = exports.ladogaPanel = exports.ladogaId = void 0;
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const world_layout_js_1 = require("./world-layout.js");
exports.ladogaId = 'garage-hatch';
exports.ladogaPanel = 'ladoga-album';
const donorFee = 180;
const pictureLimit = 6;
const pictureBytes = 32_768;
const pageLimit = 16;
const title = {
    first: 'Первый выезд', chase: 'Первый розыск', escaped: 'Ушли от погони', oneKm: 'Первый километр', threeKm: 'Три километра вместе',
    order1: 'Последний рейс', order2: 'Холодный пуск', order3: 'Чужая частота',
    repair: 'Новая дверь', photo: 'Гаражный снимок'
};
const fixedMoments = ['first', 'chase', 'escaped', 'oneKm', 'threeKm', 'order1', 'order2', 'order3'];
const doorNames = { leftSide: 'Левая дверь', rightSide: 'Правая дверь' };
const colors = {
    original: ['В цвет кузова', ''],
    blue: ['Нефритовая', '#538487'],
    cream: ['Светло-серая', '#b0ad98'],
    green: ['Оливковая', '#6c785d'],
    slate: ['Синяя', '#5d6983']
};
const knownMoment = (value) => typeof value === 'string' && Object.hasOwn(title, value);
const number = (value, max = 1e9) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;
const label = (value) => typeof value === 'string' ? value.slice(0, 84) : '';
const image = (value) => typeof value === 'string' && value.length <= pictureBytes &&
    /^data:image\/jpeg;base64,\/9j\/[a-zA-Z0-9+/]+={0,2}$/.test(value);
const escape = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const money = (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const mileage = (n) => n < 1000 ? Math.round(n).toLocaleString('ru-RU') + ' м' : (n / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' км';
const button = (id, text, value = '', active) => `<button class="k-job-btn" type="button" data-action="${id}" data-value="${value}"${active === undefined ? '' : ` aria-pressed="${active}"`}>${text}</button>`;
const serviceReady = (car, playerAtGarage) => !!car && car.id === exports.ladogaId && playerAtGarage &&
    !car.carriedBy && Math.abs(car.speed) < 1.5 && distance(car, world_layout_js_1.places.garage) < 9;
class LadogaHistory {
    state;
    seen;
    pending = null;
    wanted = 0;
    getawayAt = null;
    chosen = 'leftSide';
    constructor(saved) {
        const pages = [];
        const seen = new Set();
        if (Array.isArray(saved?.stamps))
            for (const stamp of fixedMoments)
                if (saved.stamps.includes(stamp))
                    seen.add(stamp);
        let pictures = 0;
        if (Array.isArray(saved?.pages))
            for (const raw of saved.pages.slice(-pageLimit).reverse()) {
                if (!raw || !knownMoment(raw.moment) || !Number.isSafeInteger(raw.id) || raw.id < 1 || raw.id >= 1e9 || pages.some(page => page.id === raw.id))
                    continue;
                if (raw.moment !== 'photo' && raw.moment !== 'repair')
                    seen.add(raw.moment);
                const page = { id: raw.id, moment: raw.moment, at: number(raw.at), metres: number(raw.metres), district: label(raw.district) };
                if (pictures < pictureLimit && image(raw.image)) {
                    page.image = raw.image;
                    pictures++;
                }
                pages.unshift(page);
            }
        this.seen = seen;
        this.state = { v: 1, metres: number(saved?.metres), topSpeed: number(saved?.topSpeed, 50), keep: saved?.keep === true,
            serial: Math.max(Math.floor(number(saved?.serial, 1e9 - 100)), ...pages.map(page => page.id), 0), stamps: [], pages };
        if (saved?.pursuit && Number.isFinite(saved.pursuit.at) && saved.pursuit.at >= 0) {
            this.getawayAt = number(saved.pursuit.at);
            this.wanted = number(saved.pursuit.wanted, 3);
        }
    }
    get preservePatina() { return this.state.keep; }
    get pendingPhoto() { return this.pending !== null; }
    save() {
        return structuredClone({ ...this.state, stamps: fixedMoments.filter(m => this.seen.has(m)),
            pursuit: this.getawayAt === null ? undefined : { at: this.getawayAt, wanted: this.wanted } });
    }
    mark(moment, elapsed, district, photograph) {
        if (moment !== 'photo' && moment !== 'repair') {
            if (this.seen.has(moment))
                return false;
            this.seen.add(moment);
        }
        const id = ++this.state.serial;
        this.state.pages.push({ id, moment, at: number(elapsed), metres: this.state.metres, district: label(district) });
        if (this.state.pages.length > pageLimit)
            this.state.pages.shift();
        if (photograph)
            this.pending = id;
        return true;
    }
    step(car, before, after, dt, frame) {
        const driving = car?.id === exports.ladogaId;
        const photo = frame.canPhoto !== false;
        if (car && driving) {
            const metres = distance(before, after);
            if (Number.isFinite(metres) && metres > .0001 && metres <= Math.max(.8, dt * 54)) {
                this.state.metres += metres;
                this.state.topSpeed = Math.max(this.state.topSpeed, number(Math.abs(car.speed), 50));
            }
            if (this.state.metres >= 10)
                this.mark('first', frame.elapsed, frame.district, photo);
            if (this.state.metres >= 1000)
                this.mark('oneKm', frame.elapsed, frame.district, photo);
            if (this.state.metres >= 3000)
                this.mark('threeKm', frame.elapsed, frame.district, photo);
            if (frame.wanted > 0) {
                this.mark('chase', frame.elapsed, frame.district, photo);
                if (this.getawayAt === null)
                    this.getawayAt = frame.elapsed;
            }
        }
        if (frame.wanted === 0 && this.wanted > 0 && this.getawayAt !== null) {
            if (frame.elapsed >= this.getawayAt + 4)
                this.mark('escaped', frame.elapsed, frame.district, photo && driving);
            this.getawayAt = null;
        }
        this.wanted = frame.wanted;
    }
    complete(missionIndex, elapsed, carNearby) {
        const order = { 1: 'order1', 2: 'order2', 3: 'order3' }[missionIndex];
        return order ? this.mark(order, elapsed, 'Канальный район', carNearby) : false;
    }
    captureFrame(source) {
        if (this.pending === null || source.width < 2 || source.height < 2)
            return false;
        const id = this.pending;
        this.pending = null;
        const page = this.state.pages.find(p => p.id === id);
        if (!page)
            return false;
        try {
            const copy = source.ownerDocument.createElement('canvas');
            copy.width = 352;
            copy.height = 198;
            const ctx = copy.getContext('2d', { willReadFrequently: true });
            if (!ctx)
                return false;
            const ratio = copy.width / copy.height, w = Math.min(source.width, source.height * ratio), h = Math.min(source.height, source.width / ratio);
            ctx.drawImage(source, (source.width - w) / 2, (source.height - h) / 2, w, h, 0, 0, copy.width, copy.height);
            const pixels = ctx.getImageData(0, 0, copy.width, copy.height).data;
            if (!pixels.some((channel, i) => i % 4 !== 3 && channel > 17))
                return false;
            let good;
            for (const quality of [.79, .65, .48]) {
                const encoded = copy.toDataURL('image/jpeg', quality);
                if (image(encoded)) {
                    good = encoded;
                    break;
                }
            }
            if (!good)
                return false;
            page.image = good;
            const withPictures = this.state.pages.filter(p => p.image);
            for (const expired of withPictures.slice(0, Math.max(0, withPictures.length - pictureLimit)))
                delete expired.image;
            return true;
        }
        catch {
            return false;
        }
    }
    act(id, value, car, atGarage, available, elapsed) {
        if (id === 'ladoga-keep') {
            this.state.keep = !this.state.keep;
            return { message: this.state.keep ? 'При замене двери царапины перенесут' : 'Установят чистую дверь' };
        }
        if (!['ladoga-select', 'ladoga-skin', 'ladoga-shot'].includes(id))
            return;
        if (!car || !serviceReady(car, atGarage))
            return { message: 'Поставьте «Ладогу 04» у Канальных гаражей' };
        if (id === 'ladoga-select') {
            if (value === 'leftSide' || value === 'rightSide')
                this.chosen = value;
            return { message: '' };
        }
        if (id === 'ladoga-shot') {
            this.mark('photo', elapsed, 'Канальные гаражи', true);
            return { message: 'Снимок добавляется в альбом', capture: true };
        }
        if (typeof value !== 'string' || !Object.hasOwn(colors, value))
            return;
        const side = this.chosen, [colorName, color] = colors[value], coating = color !== car.color.toLowerCase() ? color : '';
        const systems = (0, vehicle_road_js_1.equipment)(car);
        const base = systems.donorDoors?.[side] ?? '', dent = systems.dents[side] ?? 0;
        if (base === coating && dent <= .05)
            return { message: 'Эта дверь уже установлена' };
        if (!Number.isFinite(available) || available < donorFee)
            return { message: 'Для замены двери нужно ' + money(donorFee) };
        const doors = { ...systems.donorDoors };
        if ((0, vehicle_road_js_1.isLacquer)(coating))
            doors[side] = coating;
        else
            delete doors[side];
        systems.donorDoors = Object.keys(doors).length ? doors : undefined;
        delete systems.dents[side];
        (0, vehicle_road_js_1.clearPanelImpressions)(systems, side);
        car.health = Math.min(100, car.health + dent * 9);
        const cabin = (0, vehicle_cabin_js_1.carCabin)('hatch');
        const intact = (mark) => !(mark.x * (side === 'leftSide' ? -1 : 1) > 0 && mark.z >= cabin.hingeZ && mark.z < cabin.hingeZ + cabin.doorLength);
        if (!this.state.keep) {
            car.scrapes = car.scrapes?.filter(intact);
            systems.patina = systems.patina?.filter(intact);
        }
        this.mark('repair', elapsed, doorNames[side] + ' · ' + colorName, false);
        return { message: doorNames[side] + ' заменена · −' + money(donorFee), cost: donorFee, service: 'paint' };
    }
    draw(car, atGarage, available) {
        const systems = car?.systems, coating = systems?.donorDoors?.[this.chosen];
        const base = (0, vehicle_road_js_1.isLacquer)(car?.color) ? car.color : '#c56742';
        const near = serviceReady(car, atGarage);
        const history = [...this.state.pages].reverse().map(page => `<article><h3>${title[page.moment]}</h3>${page.image ? `<img src="${page.image}" loading="lazy" width="352" height="198" style="width:100%;height:auto;border-radius:4px" alt="${title[page.moment]}">` : ''}<p>${escape(page.district)}${page.district ? ' · ' : ''}${mileage(page.metres)}</p></article>`).join('');
        return `<div class="k-tour">
      <div class="k-garage-line"><span>Пробег</span><strong>${mileage(this.state.metres)}</strong></div>
      <div class="k-garage-line"><span>Рекорд скорости</span><strong>${Math.round(this.state.topSpeed * 3.6)} км/ч</strong></div>
      <h3>Мастерская</h3>
      <div class="k-job-choices">${button('ladoga-keep', 'Оставлять царапины при замене двери', '', this.state.keep)}${near ? button('ladoga-shot', 'Сделать снимок') : ''}</div>
      ${near ? `<div class="k-job-choices">${Object.entries(doorNames).map(([key, name]) => button('ladoga-select', name, key, key === this.chosen)).join('')}</div>
      <div class="k-paint"><span>Выберите цвет донорской двери · ${money(donorFee)}${available < donorFee ? ' · недостаточно средств' : ''}</span>
      <div class="k-swatches">${Object.entries(colors).map(([key, [name, color]]) => `<button type="button" data-action="ladoga-skin" data-value="${key}" aria-label="${name}" title="${name}" class="${(coating ?? '') === color ? 'selected' : ''}" style="--paint:${color || base}"></button>`).join('')}</div></div>` : '<p>Для замены двери и снимка поставьте машину у Канальных гаражей.</p>'}
      <h3>Альбом</h3>${history ? '<div class="k-fleet">' + history + '</div>' : '<p>В альбоме появятся записи о выездах и выполненных заказах.</p>'}</div>`;
    }
}
exports.LadogaHistory = LadogaHistory;
