"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobBoard = jobBoard;
const story_catalog_js_1 = require("./story-catalog.js");
const story_map_js_1 = require("./story-map.js");
const story_photos_js_1 = require("./story-photos.js");
const story_city_catalog_js_1 = require("./story-city-catalog.js");
const story_city_js_1 = require("./story-city.js");
const story_night_js_1 = require("./story-night.js");
const story_night_layout_js_1 = require("./story-night-layout.js");
const branchNames = { permit: 'Допуск дежурного', friend: 'Подсказка мастера', crew: 'Встреча с ночной сменой' };
const esc = (v) => v.replace(/[&<>"']/g, k => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[k]));
const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
function button(id, label, main = false) { return `<button type="button" class="k-job-btn${main ? ' is-main' : ''}" data-action="${esc(id)}">${esc(label)}</button>`; }
function evidence(jobs) {
    const s = jobs.active;
    if (!s)
        return '';
    const datum = (d) => `<li>${esc(d)}</li>`, lines = [];
    if (s.id === 61)
        lines.push(...['Подпись жильцов квартиры № 7', 'Показания теплового узла', 'Архивная карточка расселения'].slice(0, s.stage));
    if (s.id === 62 && s.stage)
        lines.push('Прибор в машине · ' + s.carId, 'Остаток калибровки · ' + Math.round(s.quality) + '%');
    if (s.id === 64 && s.stage)
        story_catalog_js_1.passengerStops.forEach((p, i) => lines.push(story_catalog_js_1.passengerNames[i] + ' · ' + story_map_js_1.jobPlaces[p].name + (s.marks.includes(p) ? ' · дома' : ' · в салоне')));
    if (s.id === 65)
        story_catalog_js_1.tapeNames.forEach((t, i) => lines.push((s.stage || s.marks.includes(['mic', 'tapeStall', 'lounge'][i]) ? '✓ ' : '○ ') + t));
    if (s.id === 66 && s.stage)
        story_catalog_js_1.roomTemps[s.fault].forEach((t, i) => {
            if (s.marks.includes(['pipe', 'pipeB', 'pipeC'][i]))
                lines.push('Стояк ' + (i + 1) + ' · подача / обратка ' + t);
        });
    if (s.id === 67) {
        if (s.marks.includes('nearGauge'))
            lines.push('Портовая рейка · 3,34 м');
        if (s.marks.includes('iceGauge'))
            lines.push('Литейная рейка · 3,16 м');
    }
    if (s.id === 68)
        lines.push('Нагрузка ' + jobs.loadKW() + ' из 4 кВт', ...story_catalog_js_1.powerLines.map((l, i) => l + ' · ' + ((s.power & (1 << i)) ? 'включено' : 'выключено')));
    if (s.id === 69 && s.stage)
        lines.push('«Фабричная» — старое название Канальной');
    if (s.id === 69 && s.stage === 2)
        lines.push('Дом № 23 · квартира 7 · адресат водила трамвай');
    if (s.id === 70)
        lines.push(...(s.stage ? s.marks.map(Number) : s.order).map((i, k) => (k + 1) + '. ' + (0, story_catalog_js_1.districtJob)(i).title));
    if (s.id === 72 && s.stage)
        lines.push(branchNames[s.marks[0]] ?? 'Получен допуск');
    if (s.id === 75 && s.stage)
        lines.push('Смена указала контейнер № 314 с синей биркой.');
    if (s.id === 76)
        lines.push(...s.marks.map(name => name + ' · прибыл'), 'Комфорт пассажиров · ' + Math.round(s.quality) + '%');
    if (s.id === 78)
        lines.push(...['Журнал. Последний звонок слышали на рыночной остановке.',
            'Звонок. Слышен со стороны Восточной.', 'Стрелка. Переведена на путевой тупик.'].slice(0, s.stage));
    if (s.id === 80)
        story_city_catalog_js_1.archiveSpots.forEach((key, i) => {
            if (s.marks.includes(key))
                lines.push(story_city_catalog_js_1.archiveNames[i]);
        });
    if (s.id === 81 && s.stage)
        lines.push('Место · «Север-8»', ...(s.stage > 1 ? ['Красное купе, тёмная крыша'] : []));
    if (s.id === story_night_layout_js_1.chaseNightId && s.stage > 2)
        lines.push(s.marks.includes('walk') ? 'Маршрут · по лестнице' : s.marks.includes('drive') ? 'Маршрут · на машине' : 'Выберите лестницу или дорогу.');
    if (s.id === story_night_layout_js_1.finaleNightId && s.stage) {
        for (const [key, line] of Object.entries(story_night_js_1.finaleContacts))
            if (s.marks.includes(key))
                lines.push(line);
        if (s.stage >= 2)
            lines.push('Переносной передатчик получен.');
    }
    if ((0, story_city_catalog_js_1.isCourse)(s.id) && s.stage && s.city)
        lines.push('Время · ' + s.city.timer.toFixed(1) + ' с из ' + story_city_catalog_js_1.cityCourses[s.id].limit + ' с', 'Створы · ' + s.city.leg + ' из ' + (story_city_catalog_js_1.cityCourses[s.id].gates.length - 1), 'Чистота · ' + Math.round(s.quality) + '%');
    if (s.id === story_catalog_js_1.dockContractId) {
        if (s.stage >= 1)
            lines.push('Копия накладной получена.');
        if (s.stage >= 2)
            lines.push('Озёрный пост подтвердил номер вагона.');
    }
    return lines.length ? `<ul class="k-job-evidence">${lines.map(datum).join('')}</ul>` : '';
}
function wagonPhoto() {
    return '<svg class="k-job-photo" viewBox="0 0 220 110" aria-label="Архивный снимок платформы. Двойной шов поднимается к лестнице."><rect width="220" height="110" fill="#c3b79b"/><path d="M0 68h220v42H0" fill="#8e8777"/><path d="M117 52q8-19 4-35h12q-3 16 5 35m11 0q6-16 4-29h10q-2 13 5 29" fill="#8c8575"/><path d="M20 45l17-10h128l20 10v31H20z" fill="#777967" stroke="#494a3d"/><path d="M31 58h137m-130-8v22m21-22v22m62-22v22m23-22v22m19-24v26m7-26v26m-7-17h7m-7 7h7" fill="none" stroke="#aaa28c"/><path d="m79 70 34-19m-32 21 34-19" stroke="#dec8a0" stroke-width="2"/><g fill="#4b4d41"><circle cx="47" cy="80" r="6"/><circle cx="61" cy="80" r="6"/><circle cx="144" cy="80" r="6"/><circle cx="158" cy="80" r="6"/></g><text x="8" y="103" fill="#e2dcc7" font-size="8" font-family="monospace">ВОСТОЧНАЯ  /  РЕМОНТ 2078</text></svg>';
}
function jobBoard(jobs, f) {
    const j = (0, story_catalog_js_1.districtJob)(jobs.selected) ?? story_catalog_js_1.districtCatalog[0], a = jobs.active, r = jobs.receipt(j.id), isActive = a?.id === j.id, target = isActive ? jobs.target(f) : null;
    const activeNum = jobs.save().receipts.filter(x => x.id !== 40).length;
    const eligible = story_catalog_js_1.districtCatalog.filter(d => !(0, story_city_js_1.isEvent)(d.id) || jobs.receipt(d.id) || a?.id === d.id || jobs.canAccept(d.id, f));
    const list = eligible.map(d => {
        const done = !!jobs.receipt(d.id), selected = d.id === j.id, running = d.id === a?.id;
        return `<button type="button" data-action="job-show-${d.id}" class="k-job-link" aria-pressed="${selected}"><span>${esc(d.title)}</span><em>${done ? '✓' : running ? '●' : d.id === 70 && jobs.recorded.length < 2 ? '○' : ''}</em></button>`;
    }).join('');
    const picture = j.id === 63 ? wagonPhoto() : j.id === 40 ? (0, story_photos_js_1.oldPhotoGraphic)(isActive ? a.stage : 0) : '';
    let controls = '', goal = '';
    if (r)
        goal = `<div class="k-job-goal"><b>Выполнено · ${rub(r.paid)}</b><p>${esc(r.detail)}</p>${j.id === 79 && jobs.harbourDecision ? `<p>${esc((0, story_night_js_1.harbourNotice)(jobs.harbourDecision).message)}</p>` : ''}</div>`;
    else if (isActive) {
        goal = `<div class="k-job-goal"><b>${esc(jobs.current().goal)}</b>${target ? `<small>${esc(target.label)}</small>` : ''}</div>`;
        controls = jobs.actions(f).map(item => button(item.id, item.label, true)).join('') + button('job-restart', 'С контрольной точки') + button('job-cancel', 'Отложить заказ');
    }
    else if (jobs.canAccept(j.id, f))
        controls = button('job-accept-' + j.id, 'Взять ' + (j.id === 40 ? 'снимки' : 'заказ'), true);
    else {
        const locked = jobs.requirements(j.id);
        const reason = a ? 'Сначала завершите или отложите «' + (0, story_catalog_js_1.districtJob)(a.id).title + '».' :
            locked.length ? 'Сначала завершите заказы · ' + locked.join(', ') + '.' :
                (0, story_city_js_1.isEvent)(j.id) ? 'Выйдите к месту происшествия.' : j.id === story_night_layout_js_1.finaleNightId ? 'Сначала завершите три основных заказа из телефона.' :
                    'Для редакции нужны два записанных сюжета. Подойдут дела о доме, ночной смене, тепле, свете, воде, письме или старом объявлении.';
        goal = `<p class="k-job-requirement">${esc(reason)}</p>`;
    }
    const trust = Object.keys(story_city_js_1.cityJobReputation).map(name => `<li>${esc(name)} · ${jobs.reputation(name)}/3</li>`).join('');
    const record = r?.seconds !== undefined ? `<p>Результат заезда · ${r.seconds.toLocaleString('ru-RU')} с</p>` : '';
    const options = isActive && a.id === 72 && !a.stage ? (0, story_city_js_1.cityTargets)(a, f).map(p => `<li>${esc(p.name)}</li>`).join('') : '';
    return `<div class="k-job-layout"><nav class="k-job-list" aria-label="Районные заказы"><small>ВЫПОЛНЕНО ${activeNum} / ${story_catalog_js_1.districtCatalog.length - 1}</small>${list}</nav><section class="k-job-sheet"><small>${esc(j.client)} · ${rub(j.pay)}${[62, 76, 77, 83, 84].includes(j.id) ? ' + премия' : ''}</small><h3>${esc(j.title)}</h3><p>${esc(j.brief)}</p>${picture}${j.id === 40 && isActive ? `<p>${esc(story_map_js_1.oldPhotos[a.stage].clue)}</p>` : ''}${goal}${record}${options ? `<ul class="k-job-evidence">${options}</ul>` : ''}${isActive ? evidence(jobs) : ''}${jobs.lastMessage ? `<div class="k-job-note" role="status">${esc(jobs.lastMessage)}</div>` : ''}<div class="k-job-choices">${controls}</div><details class="k-job-trust"><summary>Доверие районов</summary><ul>${trust}</ul></details></section></div>`;
}
