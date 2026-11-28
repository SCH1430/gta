"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictJobs = void 0;
const { schoolFloors } = require("./school-layout.js");
const story_catalog_js_1 = require("./story-catalog.js");
const story_map_js_1 = require("./story-map.js");
const story_city_catalog_js_1 = require("./story-city-catalog.js");
const story_city_js_1 = require("./story-city.js");
const story_night_js_1 = require("./story-night.js");
const story_night_layout_js_1 = require("./story-night-layout.js");
const cargo_job_js_1 = require("./cargo-job.js");
const copy = (v) => structuredClone(v);
const say = (message, radio) => radio ? { message, radio } : { message };
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sameSpot = (at, f) => at.space === f.space && Math.hypot(at.x - f.x, at.z - f.z) <= at.radius;
const frameAngle = (f, n) => Math.atan2(Math.sin(f.yaw - story_map_js_1.oldPhotos[n].heading), Math.cos(f.yaw - story_map_js_1.oldPhotos[n].heading));
const valvePlaces = ['pipe', 'pipeB', 'pipeC'];
const tapes = ['mic', 'tapeStall', 'lounge'];
const savedMarksFor = (id) => id === 64 ? story_catalog_js_1.passengerStops : id === 65 ? tapes : id === 66 ? valvePlaces : id === 67 ? ['nearGauge', 'iceGauge'] : undefined;
const sockets = ['2 кВт', '2 кВт', '1 кВт'];
const drives = (f) => !!f.car && Math.abs(f.car.speed) < 1.75;
const emptyRun = (id) => ({ id, stage: 0, marks: [], order: [], quality: 100, carId: '', fault: 0, power: 0 });
const recordingLabel = (id) => (0, story_catalog_js_1.districtJob)(id)?.title ?? 'Запись';
const waiting = (s, k) => !s.marks.includes(k);
const freightJobId = 93;
const tracksCityState = (id) => (0, story_city_js_1.isCityJob)(id) || id === freightJobId || (0, story_night_js_1.isNightJob)(id);
class DistrictJobs {
    receipts = [];
    active = null;
    checkpoint = null;
    selected = story_night_layout_js_1.chaseNightId;
    lastMessage = '';
    motion = null;
    constructor(data) { this.restore(data); }
    validActivity(raw) {
        if (!raw || typeof raw !== 'object')
            return null;
        const r = raw, job = (0, story_catalog_js_1.districtJob)(Number(r.id));
        if (!job || typeof r.stage !== 'number' || !Number.isInteger(r.stage) || r.stage < 0 || r.stage >= job.steps.length)
            return null;
        const a = emptyRun(job.id);
        a.stage = r.stage;
        a.marks = Array.isArray(r.marks) ? [...new Set(r.marks.filter(m => typeof m === 'string' && m.length <= 32))].slice(0, 24) : [];
        a.order = Array.isArray(r.order) ? r.order.filter(i => Number.isInteger(i) && i >= 0 && i < 100).slice(0, 4) : [];
        a.quality = Number.isFinite(r.quality) ? clamp(r.quality, 0, 100) : 100;
        a.carId = typeof r.carId === 'string' ? r.carId : '';
        a.fault = clamp(Math.trunc(Number(r.fault) || 0), 0, 2);
        a.power = (Number(r.power) || 0) & 7;
        if (tracksCityState(job.id))
            a.city = (0, story_city_js_1.restoreCityProgress)(r.city) ?? (0, story_city_js_1.emptyCityProgress)();
        const savedMarks = savedMarksFor(job.id);
        if (savedMarks)
            a.marks = a.marks.filter(k => savedMarks.includes(k));
        if (job.id === 70) {
            a.order = [...new Set(a.order.filter(i => this.recorded.includes(i)))].slice(0, 2);
            a.marks = [...new Set(a.marks.filter(k => this.recorded.includes(Number(k))))].slice(0, 2);
            if (a.stage === 1 && a.marks.length !== 2)
                return null;
        }
        if ((job.id === 62 || job.id === 64) && a.stage === 1 && !a.carId)
            return null;
        const p = r.anchor;
        if (p && [p.x, p.z, p.yaw].every(Number.isFinite) && ['street', 'house', 'dispatch', 'workshop', 'basement', 'roof', 'stairs', 'lift', ...Object.keys(story_city_catalog_js_1.cityPortalPoints)].includes(p.space)) {
            a.anchor = { x: p.x, z: p.z, yaw: p.yaw, space: p.space, carId: typeof p.carId === 'string' ? p.carId : undefined,
                ...(typeof p.y === 'number' && Number.isFinite(p.y) ? { y: clamp(p.y, -2, 26) } : {}) };
        }
        return a;
    }
    restore(raw) {
        this.receipts = [];
        this.active = null;
        this.checkpoint = null;
        this.motion = null;
        this.lastMessage = '';
        if (!raw || typeof raw !== 'object')
            return;
        const data = raw;
        if (data.v !== 1)
            return;
        if (Array.isArray(data.receipts))
            for (const v of data.receipts) {
                if (!v || !(0, story_catalog_js_1.districtJob)(v.id) || this.receipts.some(r => r.id === v.id) || !Number.isFinite(v.paid))
                    continue;
                this.receipts.push({ id: v.id, paid: clamp(Math.round(v.paid), 0, 6000), detail: String(v.detail ?? '').slice(0, 320), outcome: typeof v.outcome === 'string' && ['radio', 'archive', 'dock', 'permit', 'friend', 'crew', 'stairs', 'vehicle', 'solo'].includes(v.outcome) ? v.outcome : undefined,
                    seconds: typeof v.seconds === 'number' && Number.isFinite(v.seconds) ? clamp(v.seconds, 0, 600) : undefined,
                    mask: Number.isFinite(v.mask) ? Number(v.mask) & 7 : undefined, mix: Array.isArray(v.mix) ? v.mix.filter(id => Number.isInteger(id) && story_catalog_js_1.broadcastClips[id]).slice(0, 2) : undefined });
            }
        const a = this.validActivity(data.active);
        if (a && !this.receipt(a.id)) {
            this.active = a;
            this.selected = a.id;
            const cp = this.validActivity(data.checkpoint);
            this.checkpoint = cp?.id === a.id ? cp : copy(a);
        }
    }
    save() { return copy({ v: 1, receipts: this.receipts, active: this.active, checkpoint: this.checkpoint }); }
    receipt(id) { return this.receipts.find(r => r.id === id); }
    get archive() { return !!this.receipt(65); }
    get recorded() { return this.receipts.filter(r => story_catalog_js_1.broadcastClips[r.id]).map(r => r.id); }
    get harbourDecision() {
        const outcome = this.receipt(79)?.outcome;
        return outcome === 'dock' || outcome === 'archive' ? outcome : null;
    }
    get blackoutPhase() { return (0, story_night_js_1.blackoutPhase)(this.active); }
    get carryFinale() { return this.active?.id === story_night_layout_js_1.finaleNightId && this.active.stage >= 2; }
    get carryNightTape() { return this.active?.id === story_night_layout_js_1.chaseNightId && this.active.stage >= 1; }
    get broadcast() {
        const mix = this.receipt(70)?.mix, news = (0, story_night_js_1.harbourRadio)(this.harbourDecision);
        return mix?.length ? ['fm-intro', ...mix.flatMap(i => i === 65 ? story_catalog_js_1.tapeCodes : [story_catalog_js_1.broadcastClips[i]]), 'fm-end', ...news] : news;
    }
    get effects() {
        const basePower = this.receipt(68)?.mask ?? (this.active?.id === 68 ? 0 : 7);
        const power = this.active?.id === 91 ? basePower & ~4 : basePower;
        return { heatRepaired: !!this.receipt(66), recordFiled: this.receipt(61)?.outcome ?? null, harbourDecision: this.harbourDecision,
            blackoutPhase: this.blackoutPhase,
            finaleStage: this.active?.id === story_night_layout_js_1.finaleNightId ? this.active.stage : -1,
            finaleCoil: this.active?.id === story_night_layout_js_1.finaleNightId ? this.active.marks.includes('coil') : false,
            marketPower: { workshop: !!(power & 1), fridge: !!(power & 2), crossing: !!(power & 4) }, souvenirs: this.receipts.map(r => recordingLabel(r.id)), broadcast: this.broadcast };
    }
    reputation(region) { return Math.min(3, story_city_js_1.cityJobReputation[region].filter(id => this.receipt(id)).length); }
    requirements(id) { return (0, story_city_js_1.difficultUnlock)(id).filter(j => !this.receipt(j)).map(j => (0, story_catalog_js_1.districtJob)(j).title); }
    canAccept(id, f) {
        return !!(0, story_catalog_js_1.districtJob)(id) && !this.receipt(id) && (!this.active || this.active.id === id) &&
            (id !== 70 || this.recorded.length >= 2) && (id !== story_night_layout_js_1.finaleNightId || (f?.campaignMission ?? 0) >= 3) &&
            !this.requirements(id).length && (!(0, story_city_js_1.isEvent)(id) || !!f && (0, story_city_js_1.canStartEvent)(id, f));
    }
    cityRuntime(s, f) {
        return {
            next: (message) => { s.anchor = this.anchor(f); return this.advance(s, message); },
            done: (message, extra) => this.finish(s, message, extra),
            notice: (message) => this.note(say(message)),
            checkpoint: () => { s.anchor = this.anchor(f); this.checkpointNow(); },
        };
    }
    note(result) { this.lastMessage = result.message; return result; }
    restart() {
        if (!this.active || !this.checkpoint)
            return say('Нет активного районного заказа.');
        this.active = copy(this.checkpoint);
        this.motion = null;
        const cargo = this.active.id === 62 && this.active.stage === 1 ? { carId: this.active.carId, loaded: true } : undefined;
        const night = this.active.id === story_night_layout_js_1.chaseNightId && this.active.stage > 0;
        const patrol = night || this.active.id === story_catalog_js_1.dockContractId && this.active.stage === 2 ? 'begin' : this.active.id === story_night_layout_js_1.chaseNightId ? 'reset' : undefined;
        const patrolReason = night ? 'Перехват кассеты под эстакадой' : undefined;
        return this.note({ ...say('Восстановлен последний этап. ' + this.current().goal), resume: this.active.anchor, cargo, patrol, patrolReason });
    }
    checkpointNow() {
        if (this.active)
            this.checkpoint = copy(this.active);
    }
    advance(s, message, radio) {
        s.stage++;
        s.order = [];
        this.checkpointNow();
        return this.note(say(message, radio));
    }
    finish(s, detail, extra = {}, radio) {
        const j = (0, story_catalog_js_1.districtJob)(s.id), paid = extra.paid ?? j.pay;
        this.receipts.push({ id: s.id, paid, detail, ...extra });
        this.active = null;
        this.checkpoint = null;
        this.motion = null;
        const unlockGates = [];
        if ((s.id === 72 || s.id === 75 || s.id === 80) && this.reputation('Терминал') >= 2)
            unlockGates.push('cargo');
        if (s.id === 80 && this.reputation('Лесная') >= 1)
            unlockGates.push('timber');
        if (s.id === 79)
            radio = (0, story_night_js_1.harbourRadio)(this.harbourDecision);
        const gateNote = unlockGates.length ? ' Сменный мастер открыл служебный проезд.' : '';
        return this.note({ ...say(detail + gateNote + '  +' + paid.toLocaleString('ru-RU') + ' ₽', radio), reward: paid, unlockGates: unlockGates.length ? unlockGates : undefined });
    }
    tick(f) {
        const s = this.active, c = f.car, dt = f.dt ?? 0;
        if (s && (0, story_night_js_1.isNightJob)(s.id))
            return (0, story_night_js_1.nightTick)(s, f, this.cityRuntime(s, f));
        if (s?.id === freightJobId)
            return (0, cargo_job_js_1.trainTick)(s, f, this.cityRuntime(s, f));
        if (s && (0, story_city_js_1.isCityJob)(s.id))
            return (0, story_city_js_1.cityTick)(s, f, this.cityRuntime(s, f));
        if (s?.id === story_catalog_js_1.dockContractId && s.stage === 2 && f.wanted === 0 && !f.busy) {
            s.anchor = this.anchor(f);
            return this.advance(s, 'Рада · Пост закончил поиск. У Дома рыбаков тебя встретит Ян. Подойди пешком со стороны улицы.', ['dock-clear']);
        }
        if (!s || s.id !== 62 || s.stage !== 1 || !c || c.id !== s.carId || dt <= 0 || dt > .5) {
            this.motion = null;
            return;
        }
        if (this.motion) {
            const m = this.motion, accel = Math.abs(c.speed - m.speed) / dt;
            const turn = Math.abs(Math.atan2(Math.sin(c.yaw - m.yaw), Math.cos(c.yaw - m.yaw))) * Math.abs(c.speed) / dt;
            const shock = Math.max(0, m.health - c.health) * 1.6 + dt * (Math.max(0, accel - 6.5) * .22 + Math.max(0, turn - 4.8) * .75);
            s.quality = clamp(s.quality - shock, 0, 100);
        }
        this.motion = { speed: c.speed, yaw: c.yaw, health: c.health };
    }
    current() {
        const s = this.active;
        if (!s)
            return null;
        const j = (0, story_catalog_js_1.districtJob)(s.id);
        let goal = j.steps[s.stage];
        if (s.id === 62 && s.stage === 1)
            goal += ' · точность ' + Math.round(s.quality) + '%';
        if (s.id === 64 && s.stage === 1)
            goal += ' · осталось ' + (3 - s.marks.length);
        if ((s.id === 65 && s.stage === 0) || (s.id === 66 && s.stage === 1))
            goal += ' · ' + s.marks.length + '/3';
        if (s.id === 67 && s.stage === 0)
            goal += ' · ' + s.marks.length + '/2';
        if ((0, story_city_js_1.isCityJob)(s.id))
            goal = (0, story_city_js_1.cityGoal)(s, goal);
        return { title: j.title, goal, reward: j.pay + (s.id === 62 ? Math.round(s.quality * 12) : s.id === 76 ? Math.round(s.quality * 9) : 0), stage: s.stage, index: story_catalog_js_1.districtCatalog.indexOf(j) };
    }
    nextPlaces(s) {
        switch (s.id) {
            case 40: return [story_map_js_1.oldPhotos[s.stage].at];
            case 61: return [['kitchen'], ['pipe'], ['desk'], ['desk', 'mic']][s.stage];
            case 62: return [s.stage ? 'garage' : 'loading'];
            case 63: return ['wagons'];
            case 64: return s.stage ? story_catalog_js_1.passengerStops.filter(k => waiting(s, k)) : ['shift'];
            case 65: return s.stage ? ['mic'] : tapes.filter(k => waiting(s, k));
            case 66: return s.stage === 0 ? ['kitchen'] : s.stage === 1 ? valvePlaces.filter(k => waiting(s, k)) : valvePlaces;
            case 67: return s.stage ? ['portOffice'] : ['nearGauge', 'iceGauge'].filter(k => waiting(s, k));
            case 68: return ['generator'];
            case 69: return [['foyer', 'station', 'recipient'][s.stage]];
            case 70: return [s.stage ? 'kitchen' : 'mic'];
            case story_catalog_js_1.dockContractId: return [['dockManifest', 'bridgeRelay', 'alleyShelter', 'fisherHandoff'][s.stage]];
        }
        return [];
    }
    target(f) {
        const s = this.active;
        if (!s)
            return null;
        if ((s.id === 62 || s.id === 64) && s.stage && s.carId !== f.car?.id && f.space === 'street') {
            const parked = f.vehicles?.find(c => c.id === s.carId);
            if (parked)
                return { x: parked.x, z: parked.z, label: s.id === 62 ? 'Вернуться к машине с калибратором' : 'Вернуться к пассажирам' };
        }
        const targets = (0, story_night_js_1.isNightJob)(s.id) ? (0, story_night_js_1.nightTargets)(s, f) : s.id === freightJobId ? (0, cargo_job_js_1.trainTargets)(s, f) : (0, story_city_js_1.isCityJob)(s.id) ? (0, story_city_js_1.cityTargets)(s, f) : this.nextPlaces(s).map(k => story_map_js_1.jobPlaces[k]);
        const nearby = targets.filter(p => p.space === f.space);
        const closest = (rows) => rows.reduce((a, b) => Math.hypot(f.x - a.x, f.z - a.z) < Math.hypot(f.x - b.x, f.z - b.z) ? a : b);
        let t;
        if (nearby.length)
            t = closest(nearby);
        else if (f.space === 'street' && targets.length)
            t = closest(targets.map(p => story_city_catalog_js_1.cityPortalPoints[p.space] ?? story_map_js_1.portals[p.space] ?? p));
        else {
            const first = targets[0], floor = schoolFloors[f.space];
            if (floor)
                return require('./campus-layout.js').wayOutFrom(floor, f.x, f.z);
            if (story_city_catalog_js_1.cityPortalPoints[f.space]) {
                const room = { taxipark: 126, cafe: 153, terminal: 180, hydro: 207, passage: 234 }[f.space];
                if (room !== undefined)
                    return { x: room, z: 3.45, label: 'Выйдите на улицу' };
            }
            if (f.space === 'house' && first?.space === 'basement')
                return f.z < 1 || f.x > 2 ? { x: -2.40, z: -5.68, label: 'Лифт · выберите подвал' } : { x: -2.36, z: 6.31, label: 'Лифт · выберите подвал' };
            if (f.space === 'house')
                return { x: -.85, z: 6.31, label: 'Выйдите во двор' };
            if (f.space === 'basement')
                return { x: 34.2, z: 2.88, label: 'Поднимитесь в подъезд' };
            if (f.space === 'dispatch' || f.space === 'workshop')
                return { x: f.space === 'dispatch' ? 95 : 66, z: 2.97, label: 'Выйдите на улицу' };
            if (f.space === 'roof')
                return { x: -92, z: 3.58, label: 'Лифт · спуститесь в подъезд' };
            if (f.space === 'stairs')
                return { x: -49, z: 3.40, label: 'Служебная лестница · спуститесь на второй этаж' };
            if (f.space === 'lift')
                return { x: -65, z: 0, label: first?.space === 'basement' ? 'На панели лифта · −1, тепловой узел' : first?.space === 'house' ? 'На панели лифта · 2, квартира 7' : 'На панели лифта · 1, выход во двор' };
            return null;
        }
        return { x: t.x, z: t.z, label: t.name };
    }
    actions(f) {
        if (f.busy)
            return [];
        const s = this.active;
        const notice = this.harbourDecision && !f.car && [story_city_catalog_js_1.cityPlaces.arcHandoff, story_night_layout_js_1.finaleNightPlaces.board].some(p => sameSpot(p, f)) ?
            [{ id: 'job-harbour-notice', label: 'Прочитать объявление смены' }] : [];
        if (!s) {
            const openDockContract = this.canAccept(story_catalog_js_1.dockContractId) && !f.car && sameSpot(story_map_js_1.jobPlaces.dockManifest, f);
            return [...(openDockContract ? [{ id: 'job-accept-' + story_catalog_js_1.dockContractId, label: 'Взять «Чёрную накладную»' }] : []), ...(0, story_city_js_1.cityEventActions)(f, id => !!this.receipt(id)), ...notice];
        }
        if ((0, story_night_js_1.isNightJob)(s.id) || s.id === freightJobId) {
            const found = (0, story_night_js_1.isNightJob)(s.id) ? (0, story_night_js_1.nightActions)(s, f) : (0, cargo_job_js_1.trainActions)(s, f);
            return [...found.map(item => ({ id: 'job-do-' + s.id + '-' + item.key, label: item.label })), ...notice];
        }
        if ((0, story_city_js_1.isCityJob)(s.id))
            return (0, story_city_js_1.cityActions)(s, f).map(item => ({ id: 'job-do-' + s.id + '-' + item.key, label: item.label }));
        const here = (id) => sameSpot(story_map_js_1.jobPlaces[id], f), actions = [];
        const add = (key, label) => actions.push({ id: 'job-do-' + s.id + '-' + key, label });
        const at = (id, key, label) => {
            if (here(id) && !f.car)
                add(key, label);
        };
        switch (s.id) {
            case 40: {
                const i = s.stage;
                if (here(story_map_js_1.oldPhotos[i].at) && !f.car)
                    add('photo', 'Совместить кадр · ' + story_map_js_1.oldPhotos[i].year);
                break;
            }
            case 61:
                if (s.stage === 0)
                    at('kitchen', 'signature', 'Попросить подпись');
                if (s.stage === 1)
                    at('pipe', 'meter', 'Снять запись журнала');
                if (s.stage === 2)
                    at('desk', 'card', 'Найти карточку дома');
                if (s.stage === 3) {
                    at('desk', 'archive', 'Подать в городской архив');
                    at('mic', 'radio', 'Огласить в эфире');
                }
                break;
            case 62:
                if (drives(f)) {
                    if (!s.stage && here('loading')) {
                        const cargo = f.car.systems?.cargo;
                        if (cargo && cargo !== 'empty')
                            add('full', 'Проверить свободное место');
                        else
                            add('load', 'Загрузить калибратор');
                    }
                    if (s.stage && f.car.id === s.carId && here('garage'))
                        add('unload', 'Сдать калибратор');
                }
                break;
            case 63:
                ['wagonA', 'wagonB', 'wagonC'].forEach((k, i) => at(k, 'wagon' + i, 'Сверить вагон ' + ['А', 'Б', 'В'][i]));
                break;
            case 64:
                if (!drives(f) || !['hatch', 'sedan', 'suv'].includes(f.car.kind))
                    break;
                if (!s.stage && here('shift'))
                    add('board', 'Посадить ночную смену');
                if (s.stage && s.carId === f.car.id)
                    story_catalog_js_1.passengerStops.forEach((k, i) => {
                        if (waiting(s, k) && here(k))
                            add('off' + i, 'Высадить · ' + story_catalog_js_1.passengerNames[i]);
                    });
                break;
            case 65:
                if (!s.stage)
                    tapes.forEach((p, i) => {
                        if (waiting(s, p))
                            at(p, 'tape' + i, 'Взять запись · ' + story_catalog_js_1.tapeNames[i]);
                    });
                else if (here('mic') && !f.car)
                    story_catalog_js_1.tapeNames.forEach((name, i) => {
                        if (!s.order.includes(i))
                            add('splice' + i, 'Вклеить · ' + name);
                    });
                break;
            case 66:
                if (!s.stage)
                    at('kitchen', 'thermo', 'Считать датчик батареи');
                else
                    valvePlaces.forEach((p, i) => {
                        if (s.stage === 1 && waiting(s, p))
                            at(p, 'test' + i, 'Измерить стояк ' + (i + 1));
                        if (s.stage === 2)
                            at(p, 'open' + i, 'Пустить обратку · стояк ' + (i + 1));
                    });
                break;
            case 67:
                if (!s.stage)
                    ['nearGauge', 'iceGauge'].forEach((p, i) => {
                        if (waiting(s, p))
                            at(p, 'read' + i, 'Прочитать водомерную рейку');
                    });
                else
                    ['+18 см в порту', '+18 см у Литейного', 'Уровни равны'].forEach((t, i) => at('portOffice', 'report' + i, t));
                break;
            case 68:
                if (here('generator') && !f.car) {
                    story_catalog_js_1.powerLines.forEach((label, i) => add('line' + i, ((s.power & (1 << i)) ? 'Отключить · ' : 'Подключить · ') + label + ' ' + sockets[i]));
                    add('connect', 'Завести генератор');
                }
                break;
            case 69:
                if (!s.stage)
                    at('foyer', 'map', 'Сверить план 1995 года');
                if (s.stage === 1)
                    at('station', 'ask', 'Расспросить кондуктора');
                if (s.stage === 2)
                    ['Анна Рябова · машинист', 'Анна Рубцова · почтальон', 'Анна Рыжова · медик'].forEach((n, i) => at('recipient', 'letter' + i, n));
                break;
            case 70:
                if (s.stage === 0 && here('mic') && !f.car)
                    this.recorded.forEach(id => {
                        if (!s.order.includes(id))
                            add('mix' + id, 'В эфир · ' + recordingLabel(id));
                    });
                if (s.stage === 1)
                    at('kitchen', 'listen', 'Включить кухонный приёмник');
                break;
            case story_catalog_js_1.dockContractId:
                if (s.stage === 0)
                    at('dockManifest', 'manifest', 'Забрать накладную');
                if (s.stage === 1 && here('bridgeRelay') && drives(f))
                    add(f.wanted ? 'hold' : 'relay', f.wanted ? 'Проверить Озёрный пост' : 'Подтвердить накладную');
                if (s.stage === 3 && !f.wanted)
                    at('fisherHandoff', 'handoff', 'Передать накладную Яну');
                break;
        }
        return actions;
    }
    anchor(f) { return { x: f.x, z: f.z, space: f.space, yaw: f.car?.yaw ?? f.yaw, carId: f.car?.id, ...(typeof f.heroY === 'number' && Number.isFinite(f.heroY) ? { y: f.heroY } : {}) }; }
    act(id, f) {
        if (id === 'job-harbour-notice' && this.harbourDecision && this.actions(f).some(a => a.id === id)) {
            const notice = (0, story_night_js_1.harbourNotice)(this.harbourDecision);
            return this.note(say(notice.message, (0, story_night_js_1.harbourRadio)(this.harbourDecision)));
        }
        if (id.startsWith('job-show-')) {
            const i = Number(id.slice(9));
            if ((0, story_catalog_js_1.districtJob)(i))
                this.selected = i;
            return say('');
        }
        if (id.startsWith('job-accept-')) {
            const n = Number(id.slice(11)), j = (0, story_catalog_js_1.districtJob)(n);
            if (!j || !this.canAccept(n, f))
                return this.note(say(this.active ? 'Сначала закончите или отложите текущий районный заказ.' : 'Этот заказ пока недоступен.'));
            if (this.active?.id === n)
                return say(this.current().goal);
            this.active = emptyRun(n);
            if (tracksCityState(n))
                this.active.city = (0, story_city_js_1.emptyCityProgress)();
            this.active.fault = (this.receipts.length + Math.round(Math.abs(f.x))) % 3;
            this.selected = n;
            this.active.anchor = this.anchor(f);
            this.checkpointNow();
            return this.note(say(j.client + ' · ' + j.steps[0]));
        }
        if (id === 'job-restart')
            return this.restart();
        if (id === 'job-cancel') {
            const c = this.active?.id === 62 && this.active?.carId ? this.active.carId : null;
            const patrol = this.active?.id === story_night_layout_js_1.chaseNightId || this.active?.id === story_catalog_js_1.dockContractId && this.active.stage === 2 ? 'reset' : undefined;
            this.active = null;
            this.checkpoint = null;
            this.motion = null;
            return this.note({ ...say('Заказ отложен. Можно вернуться к нему позднее и начать заново.'), patrol, ...(c ? { cargo: { carId: c, loaded: false } } : {}) });
        }
        const s = this.active;
        if (!s || !this.actions(f).some(a => a.id === id))
            return say('Подойдите к указанному месту и остановитесь.');
        const key = id.slice(('job-do-' + s.id + '-').length), idx = Number(key.match(/\d+$/)?.[0]);
        if (tracksCityState(s.id) && key === 'retry')
            return this.restart();
        s.anchor = this.anchor(f);
        if ((0, story_night_js_1.isNightJob)(s.id))
            return this.note((0, story_night_js_1.nightAct)(s, key, f, this.cityRuntime(s, f), { has: id => !!this.receipt(id), harbour: this.harbourDecision }));
        if (s.id === freightJobId)
            return this.note((0, cargo_job_js_1.trainAct)(s, key, f, this.cityRuntime(s, f)));
        if ((0, story_city_js_1.isCityJob)(s.id))
            return (0, story_city_js_1.cityAct)(s, key, f, this.cityRuntime(s, f));
        switch (s.id) {
            case 40: {
                const i = s.stage;
                if (Math.abs(frameAngle(f, i)) > .19)
                    return this.note(say('Точка верная. Поверните камеру ' + (frameAngle(f, i) > 0 ? 'вправо' : 'влево') + ' к контуру на карточке.'));
                return i === 0 ? this.advance(s, story_map_js_1.oldPhotos[0].story) : this.finish(s, story_map_js_1.oldPhotos[1].story);
            }
            case 61: {
                if (key === 'signature')
                    return this.advance(s, 'Надежда Ильинична · Вот подписи семи квартир. Сверь расход тепла в подвале.');
                if (key === 'meter')
                    return this.advance(s, 'В журнале есть сегодняшнее показание. Архивный экземпляр лежит у Семёна.');
                if (key === 'card')
                    return this.advance(s, 'Найдена карточка расселения без подписи. Оформи жалобу у шкафа или передай её у микрофона.');
                return this.finish(s, key === 'radio' ? 'Голоса жильцов вышли в прямой эфир.' : 'Архив зарегистрировал исправление адреса.', { outcome: key }, key === 'radio' ? ['fm-ledger'] : undefined);
            }
            case 62:
                if (key === 'full')
                    return this.note(say('Инна · Отсек занят. Открой багажник у рынка и выгрузи прежний груз либо подгони другую машину.'));
                if (key === 'load') {
                    s.carId = f.car.id;
                    return { ...this.advance(s, 'Инна · Ампула закреплена. Калибровку берегут плавным рулём и тормозом. В гараже примет Тоня.'), cargo: { carId: s.carId, loaded: true } };
                }
                return { ...this.finish(s, 'Тоня · Стенд показал ' + Math.round(s.quality) + '% точности.', { paid: 1200 + Math.round(s.quality * 12) }), cargo: { carId: s.carId, loaded: false } };
            case 63:
                if (idx !== 1)
                    return this.note(say(idx === 0 ? 'На борту заводская вертикальная заплата. Ищи наклонный двойной шов.' : 'Двойная полоса здесь прямая. На снимке шов поднимается к лесенке.'));
                return this.finish(s, 'Совпали шов и две градирни. Платформу отцепили до сортировки.');
            case 64:
                if (key === 'board') {
                    s.carId = f.car.id;
                    return this.advance(s, 'Дина · Я в порт. Алексею к Литейной, Юре на Канальную. Решай, кто первый.');
                }
                s.marks.push(story_catalog_js_1.passengerStops[idx]);
                if (s.marks.length === 3)
                    return this.finish(s, story_catalog_js_1.passengerNames[idx] + ' · Последний дома. Город сегодня спит спокойно. Маршрут: ' + s.marks.map(k => story_catalog_js_1.passengerNames[story_catalog_js_1.passengerStops.indexOf(k)]).join(' → ') + '.');
                this.checkpointNow();
                {
                    const aboard = story_catalog_js_1.passengerStops.map((p, i) => waiting(s, p) ? story_catalog_js_1.passengerNames[i] : '').filter(Boolean);
                    const chat = aboard.length === 1 ? { Алексей: 'Алексей · Завтра принесу тебе свежий хлеб с проходной.', Дина: 'Дина · Давай через мост, там от воды светло.', Юра: 'Юра · В окне кухни ещё горит. Ждут.' }[aboard[0]] :
                        idx === 0 ? 'Дина и Юра тихо спорят, что раньше замерзает: река или канал.' :
                            idx === 1 ? 'Юра · Лёш, забери свой термос, он по полу катается.' : 'Дина · Лёш, помнишь первый ночной пуск котла?';
                    return this.note(say(story_catalog_js_1.passengerNames[idx] + (idx === 1 ? ' вышла' : ' вышел') + '. ' + chat));
                }
            case 65:
                if (key.startsWith('tape')) {
                    s.marks.push(tapes[idx]);
                    this.checkpointNow();
                    if (s.marks.length === 3)
                        return this.advance(s, 'Три фрагмента у тебя. У микрофона сначала поставь позывной, потом посадку, затем прощание.', [story_catalog_js_1.tapeCodes[idx]]);
                    return this.note(say('В архиве · ' + story_catalog_js_1.tapeNames[idx] + '. Собрано ' + s.marks.length + '/3.', [story_catalog_js_1.tapeCodes[idx]]));
                }
                if (idx !== s.order.length) {
                    s.order = [];
                    return this.note(say('Стыки не совпали. Начни с позывного дежурного, затем платформа и прощание.'));
                }
                s.order.push(idx);
                if (s.order.length === 3)
                    return this.finish(s, 'Объявление восстановлено. Его можно услышать в автомобильном радио.', {}, [...story_catalog_js_1.tapeCodes]);
                return this.note(say('Записан фрагмент ' + s.order.length + '/3.', [story_catalog_js_1.tapeCodes[idx]]));
            case 66:
                if (key === 'thermo')
                    return this.advance(s, 'На датчике +13°. В подвале сравните подачу и обратку каждого стояка.');
                if (key.startsWith('test')) {
                    s.marks.push(valvePlaces[idx]);
                    this.checkpointNow();
                    const msg = 'Стояк ' + (idx + 1) + ' · ' + story_catalog_js_1.roomTemps[s.fault][idx] + '.';
                    return s.marks.length === 3 ? this.advance(s, msg + ' Восстановите обратку с самым большим перепадом.') : this.note(say(msg));
                }
                if (idx !== [1, 0, 2][s.fault])
                    return this.note(say('В этой ветви нормальная циркуляция. Сравните записанные температуры в телефоне.'));
                return this.finish(s, 'Обратка потеплела. В квартире № 7 восстановлено отопление.');
            case 67:
                if (key.startsWith('read')) {
                    s.marks.push(idx ? 'iceGauge' : 'nearGauge');
                    this.checkpointNow();
                    const msg = idx ? 'Литейная рейка · 3,16 м.' : 'Портовая рейка · 3,34 м.';
                    return s.marks.length === 2 ? this.advance(s, msg + ' Обе отметки сняты. Ответ ждут на посту в порту.') : this.note(say(msg));
                }
                return idx === 0 ? this.finish(s, 'Смотритель · Перепад восемнадцать сантиметров. Отметки приняты.') : this.note(say('Проверьте журнал. Портовая рейка показывает 3,34 м, Литейная — 3,16 м.'));
            case 68:
                if (key.startsWith('line')) {
                    s.power ^= 1 << idx;
                    return this.note(say('Подключены · ' + story_catalog_js_1.powerLines.filter((_, i) => s.power & (1 << i)).join(', ') + '. Нагрузка ' + this.loadKW() + '/4 кВт.'));
                }
                if (this.loadKW() > 4) {
                    s.power = 0;
                    return this.note(say('Защита сняла нагрузку. Подключите две ветви и заведите генератор снова.'));
                }
                if (story_catalog_js_1.powerLines.filter((_, i) => s.power & (1 << i)).length !== 2)
                    return this.note(say('Для пуска требуются две линии. Остатка топлива хватит до утра.'));
                return this.finish(s, 'На резерв переведены · ' + story_catalog_js_1.powerLines.filter((_, i) => s.power & (1 << i)).join(', ') + '.', { mask: s.power });
            case 69:
                if (key === 'map')
                    return this.advance(s, 'Под исправленным названием проступает «Фабричная». Это современная Канальная. Кондуктор помнит путевой дом.');
                if (key === 'ask')
                    return this.advance(s, 'Лидия · Двадцать третий, квартира семь. Анна водила первый вагон. Звоните той, кто была машинистом.');
                return idx === 0 ? this.finish(s, 'Анна Рябова узнала почерк матери. Письмо дошло спустя сорок лет.') : this.note(say('Она покачала головой. Письмо для женщины, водившей первый вагон.'));
            case 70:
                if (key.startsWith('mix')) {
                    s.order.push(idx);
                    if (s.order.length === 2) {
                        s.marks = s.order.map(String);
                        return this.advance(s, 'Выпуск поставлен в сетку. Послушай премьеру дома, на кухне.');
                    }
                    return this.note(say('Первый сюжет · ' + recordingLabel(idx) + '. Теперь выберите второй.'));
                }
                else {
                    const mix = s.marks.map(Number), result = this.finish(s, 'Сегодня весь район услышал твой выпуск.', { mix });
                    return { ...result, radio: this.broadcast };
                }
            case story_catalog_js_1.dockContractId:
                if (key === 'manifest')
                    return this.advance(s, 'Рада · Утренний состав увозит детали с рабочей ветки. Покажи штамп на Озёрном посту. Остановись у шкафа с жёлтой полосой.', ['dock-manifest']);
                if (key === 'hold')
                    return this.note(say('На посту уже дежурит патруль. Вернись, когда розыск снимут.'));
                if (key === 'relay')
                    return { ...this.advance(s, 'Пост узнал номер накладной и поднял тревогу. Оторвись от патруля. Тополиная аллея сужается до пешеходной тропы.'), patrol: 'begin' };
                return this.finish(s, 'Ян · Копия дошла. Утром смена сверит вагоны и остановит погрузку.', {}, ['dock-receipt']);
        }
        return say('');
    }
    loadKW() { const p = this.active?.power ?? 0; return (p & 1 ? 2 : 0) + (p & 2 ? 2 : 0) + (p & 4 ? 1 : 0); }
}
exports.DistrictJobs = DistrictJobs;
