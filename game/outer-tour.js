"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OuterTour = exports.tourReward = exports.tourTitle = void 0;
const region_layout_js_1 = require("./region-layout.js");
const stops = [
    { site: 'cargo', action: 'Сверить номер контейнера', detail: 'Сверьте маркировку у площадки перегрузки.' },
    { site: 'northpark', action: 'Записать показания метеопоста', detail: 'Запишите показания у остановки посёлка.' },
    { site: 'dam', action: 'Снять уровень воды', detail: 'Снимите показания на подъезде к плотине.' },
    { site: 'mill', action: 'Сдать журнал смены', detail: 'Передайте журнал у въезда на лесозавод.' },
];
exports.tourTitle = 'За внешним кольцом';
exports.tourReward = 4600;
class OuterTour {
    active = false;
    stage = 0;
    constructor(saved) {
        if (!saved || !Number.isInteger(saved.stage) || saved.stage < 0 || saved.stage > stops.length)
            return;
        this.stage = saved.stage;
        this.active = !!saved.active && !this.complete;
    }
    get complete() { return this.stage === stops.length; }
    get total() { return stops.length; }
    save() { return { active: this.active, stage: this.stage }; }
    start() {
        if (!this.complete)
            this.active = true;
    }
    suspend() { this.active = false; }
    get next() {
        if (!this.active)
            return null;
        const step = stops[this.stage];
        const site = region_layout_js_1.regionSites.find(s => s.id === step.site);
        return site ? { ...step, ...site.stop, label: site.label } : null;
    }
    canInteract(person) {
        const target = this.next;
        return !!target && !person.inside && !person.busy && Math.abs(person.speed) < .65 && Math.hypot(person.x - target.x, person.z - target.z) < 7;
    }
    advance(person) {
        if (!this.canInteract(person))
            return null;
        const step = this.next;
        this.stage++;
        if (this.complete)
            this.active = false;
        return { label: step.label, reward: this.complete ? exports.tourReward : 0 };
    }
    draw() {
        const visits = stops.map((step, index) => {
            const site = region_layout_js_1.regionSites.find(s => s.id === step.site);
            return `<li data-visited="${index < this.stage}"><span>${site?.label ?? ''}</span><small>${index < this.stage ? 'Отмечено' : step.detail}</small></li>`;
        }).join('');
        const buttons = this.complete ? '' : this.active
            ? '<button type="button" data-action="tour-route" class="k-job-btn is-main">Показать маршрут</button><button type="button" data-action="tour-pause" class="k-job-btn">Отложить заказ</button>'
            : `<button type="button" data-action="tour-start" class="k-job-btn is-main">${this.stage ? 'Продолжить объезд' : 'Начать объезд'}</button>`;
        return `<section class="k-tour"><p>${this.complete ? 'Диспетчерская приняла журнал. Выплачено 4 600 ₽.' : 'Диспетчерской нужны отметки четырёх постов. Доберитесь до каждого ориентира и подтвердите его на месте.'}</p><ol aria-label="Маршрут объезда">${visits}</ol><div class="k-job-choices">${buttons}</div></section>`;
    }
}
exports.OuterTour = OuterTour;
