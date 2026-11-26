"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUI = createUI;
const radio_stations_js_1 = require("./radio-stations.js");
const ui_icons_js_1 = require("./ui-icons.js");
const ui_map_js_1 = require("./ui-map.js");
const ui_layout_js_1 = require("./ui-layout.js");
const ui_touch_js_1 = require("./ui-touch.js");
const ui_navigation_js_1 = require("./ui-navigation.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const interior_archive_js_1 = require("./interior-archive.js");
const sound_mix_js_1 = require("./sound-mix.js");
const population_profile_js_1 = require("./population-profile.js");
const defaults = {
    battery:false, toggleHolds:false, freeOrbit:false, keyboardLook:1, cameraStep:0, carFollow:1, bindings:{}, cameraDistance: 'normal', steerStick: false, radioStation: 'district', soundProfile: 'headphones',
    pedestrianDensity: population_profile_js_1.defaultPopulation.pedestrians, trafficDensity: population_profile_js_1.defaultPopulation.traffic,
    sensitivity: 1, buttonSize: 1, volume: .65, minimap: true, radio: true, carSensitivity: 1, cabinSensitivity: .8, shoulder: 1, haptics: .5, impactMotion: .7, autoSprint: true, compactHud: false, leftHanded: false, subtitleSize: 1, goalSize: 1, layouts: (0, ui_layout_js_1.newLayouts)(), marks: []
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const money = (value) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;
const garageColors = {
    '#4e8491': 'Синяя', '#d78c35': 'Янтарная', '#a43e44': 'Вишнёвая',
    '#718469': 'Зелёная', '#c7c5ac': 'Светлая', '#39404c': 'Графитовая'
};
const metres = (distance) => distance >= 1000 ? `${(distance / 1000).toFixed(1).replace('.', ',')} км` : `${Math.round(distance)} м`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const key = (name) => `<kbd data-key-name="${name}">${name}</kbd>`;
const iconButton = (act, icon, label) => `<button type="button" class="k-icon-button" data-action="${act}" aria-label="${label}" title="${label}">${(0, ui_icons_js_1.ico)(icon)}</button>`;
const panelRow = (act, icon, title, after = '', value) => `<button type="button" class="k-panel-row" data-action="${act}"${value === undefined ? '' : ` data-value="${escape(value)}"`}>${(0, ui_icons_js_1.ico)(icon)}<span>${title}</span>${after || (0, ui_icons_js_1.ico)('chevron', 16)}</button>`;
const touch = (act, icon, label, hold = false) => `<button type="button" aria-label="${label}" title="${label}" ${hold ? `data-hold="${act}"` : `data-action="${act}"`} class="k-touch k-${act}">${(0, ui_icons_js_1.ico)(icon, 23)}<span>${label}</span></button>`;
const campaign = ['Последний рейс', 'Холодный пуск', 'Чужая частота'];
const briefs = [
    'Семён, диспетчер депо: «Последний трамвай уже на линии. Забери блок на рынке, пока вагон не дошёл до стрелки».',
    'Мастер гаража: «Фургон встал у депо. Довези его до мастерской, пока аккумулятор ещё держит заряд».',
    'Лёша: «Забери кассету на рынке. Если заметишь патруль, оторвись от него до встречи во дворах».',
];
function createUI(host, onAction) {
    const root = document.createElement('div');
    root.className = 'k-ui';
    root.classList.toggle('k-hardware-input', matchMedia('(pointer: fine) and (hover: hover)').matches);
    host.appendChild(root);
    const bookStyle = document.createElement('style');
    bookStyle.textContent = '.k-city-book h3{margin:14px 0 5px;color:var(--k-mint);font:600 14px K77Body,system-ui}.k-city-book .k-book-row{min-height:40px;white-space:normal;justify-content:space-between;text-align:left}.k-city-book .k-book-row small{display:block;font-size:.85em;color:var(--k-muted);margin-top:2px}.k-city-book .k-book-row b{color:var(--k-amber)}.k-city-book p{margin:3px 0 8px}.k-pin-menu input{max-width:100%;font:inherit}';
    const cameraNames = { near: 'Ближняя', normal: 'Обычная', far: 'Дальняя' };
    const q = (selector) => root.querySelector(selector);
    const setText = (node, value) => {
        if (node.textContent !== value)
            node.textContent = value;
    };
    root.innerHTML = `<div class="k-look" aria-label="Поворот камеры"></div><div class="k-top-shade"></div><div class="k-bottom-shade"></div>
    <header class="k-brand"><span class="k-emblem">${ui_icons_js_1.logo}</span><span class="k-title">КОНТУР<span>–77</span></span><time class="k-clock" aria-label="Игровое время" hidden></time></header>
    <button class="k-mission" type="button" data-action="phone" title="Открыть журнал заказов">
      <span class="k-mission-top"><span class="k-mission-kind">Заказ</span><span class="k-step">1 / 3</span></span>
      <strong class="k-mission-title">Последний рейс</strong>
      <span class="k-objective"><span class="k-diamond" aria-hidden="true"></span><span class="k-objective-text">Заберите блок на рынке</span><span class="k-objective-distance" title="До цели по прямой" hidden></span></span>
    </button>
    <aside class="k-right-rail">
      <div class="k-tools"><div class="k-wallet" aria-label="Баланс"><span class="k-money">0 ₽</span></div>${iconButton('phone', 'phone', 'Телефон · J')}${iconButton('pause', 'pause', 'Пауза · Esc')}</div>
      <div class="k-wanted" hidden>
        ${(0, ui_icons_js_1.ico)('warn', 16)}<span class="k-wanted-text" role="status"></span>
        <span class="k-alert-level" role="img" aria-label="Уровень розыска"><i></i><i></i><i></i></span>
        <span class="k-alert-progress" aria-hidden="true" hidden><i></i></span><span class="k-pursuit-evidence" hidden><i></i><b></b></span>
      </div>
    </aside>
    <div class="k-nav">
      <button type="button" data-action="map" class="k-mapcard" aria-label="Открыть карту района"><div class="k-map-frame">${(0, ui_map_js_1.mapTemplate)()}<i class="k-north">С</i><span class="k-map-key">${key('M')}</span></div></button>
      <div class="k-map-place">${(0, ui_icons_js_1.ico)('mapPin', 13)}<span></span><small class="k-nav-distance" hidden></small></div>
    </div>
    <div class="k-offline" role="status" hidden><i></i><span></span><div class="k-offline-line"><b></b></div></div>
    <div class="k-waypoint" aria-hidden="true" hidden>${(0, ui_icons_js_1.ico)('waypoint', 29)}<span></span></div>
    <div class="k-drive-status" hidden>
      <div class="k-drive-readout"><span class="k-gear" title="Направление движения">N</span><b class="k-speed">0</b><small>км/ч</small><span class="k-lamps" title="Включены фары" aria-label="Включены фары" role="img" hidden>${(0, ui_icons_js_1.ico)('light', 15)}</span></div>
      <span class="k-vehicle-name"></span><div class="k-condition" role="progressbar" aria-label="Состояние машины" aria-valuemin="0" aria-valuemax="100"><i></i></div>
    </div>
    <div class="k-desktop-keys"><span class="k-onfoot">${key('WASD')} Движение</span><span class="k-onfoot">${key('SHIFT')} Бег</span><span class="k-onfoot">${key('SPACE')} Прыжок</span><span class="k-vehicle-keys">${key('WASD')} Вождение</span><span class="k-vehicle-keys">${key('SPACE')} Ручник</span><span class="k-vehicle-keys">${key('F')} Фары</span><span class="k-vehicle-keys">${key('X')} Выйти</span><span class="k-mouse-key" title="Потяните мышью или проведите двумя пальцами по трекпаду">${(0, ui_icons_js_1.ico)('mouse', 13)} Обзор</span></div>
    <button type="button" data-action="interact" class="k-interact" hidden><span class="k-interact-icon">${(0, ui_icons_js_1.ico)('action', 19)}</span><strong></strong>${key('E')}</button>
    <div class="k-touch-controls">
      <div class="k-stick" role="group" aria-label="Джойстик движения"><div class="k-stick-guides" aria-hidden="true"></div><div class="k-stick-knob"></div></div>
      <div class="k-steer">${touch('left', 'left', 'Влево', true)}${touch('right', 'right', 'Вправо', true)}</div>
      <div class="k-foot-actions">${touch('run', 'run', 'Бег')}${touch('jump', 'jump', 'Прыжок')}</div>
      <div class="k-foot-tools">${iconButton('camera-distance', 'arrows', 'Дистанция камеры')}<button type="button" class="k-icon-button k-rear" data-hold="rear" aria-label="Оглядеться назад" title="Удерживать для взгляда назад">${(0, ui_icons_js_1.ico)('mirror')}</button></div>
      <div class="k-pedals">${touch('handbrake', 'hand', 'Ручник', true)}${touch('brake', 'brake', 'Тормоз', true)}${touch('gas', 'gas', 'Газ', true)}</div>
      <div class="k-car-tools"><button type="button" class="k-icon-button k-rear" data-hold="rear" aria-label="Оглядеться назад" title="Удерживать для взгляда назад">${(0, ui_icons_js_1.ico)('mirror')}</button>${iconButton('leaveCar', 'action', 'Выйти из машины')}${iconButton('horn', 'horn', 'Сигнал')}${iconButton('light', 'light', 'Фары')}</div>
    </div>
    <div class="k-toast" role="status" aria-live="polite" hidden><i></i><span></span></div><div class="k-modal" hidden><div class="k-dialog" role="dialog" aria-modal="true" aria-labelledby="k-dialog-title"><div class="k-dialog-head"><div><span class="k-dialog-section"></span><h2 id="k-dialog-title"></h2></div>${iconButton('close', 'cross', 'Закрыть')}</div><div class="k-dialog-scroll"></div></div></div>`;
    root.appendChild(bookStyle);
    const view = {
        x: -34,
        z: 42,
        heading: 0,
        district: 'Канальные гаражи',
        money: 0,
        wanted: 0,
        driving: false,
        missionIndex: 0,
        missionTitle: 'Последний рейс',
        objective: 'Заберите блок на рынке',
    };
    const settings = { ...defaults, impactMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : defaults.impactMotion,
        soundProfile: window.matchMedia('(pointer: coarse)').matches ? 'speaker' : 'headphones', marks: [], layouts: (0, ui_layout_js_1.newLayouts)() };
    const externalPanels = new Map();
    const positioning = (0, ui_layout_js_1.mobileLayout)(root);
    let editMode = 'foot', markPending = null, focusIndex = -1;
    let atlasZoom = 0, atlasCenter = null, atlasPick = null;
    let pan = null;
    let navEnd = null, navMode = 'walk', navOrigin = null;
    let navLeg = null, mapRoute;
    const hasRoute = () => navLeg?.available ?? !!navLeg?.path.length;
    const atlasState = () => ({ ...view, marks: settings.marks, route: mapRoute, destination: navEnd });
    const modes = ['foot', 'car'];
    let tapHold = null;
    let skipClickUntil = 0;
    let outerStick = false, reverseLast = false;
    const laptop = require('./laptop-controls.js');
    let quarterReport = '';
    let pendingBinding = null, toggledRun = false, toggledRear = false;
    const builtIn = new Set(['laptop','phone', 'garage', 'settings', 'pause', 'map', 'layout', 'alternatives']);
    const panelLinks = () => panelRow('laptop','settings','Ноутбук и клавиши') + [...externalPanels].filter(([,o])=>!o.hidden).map(([id, o]) => panelRow(id, 'chevron', escape(o.title))).join('');
    let panel = null;
    let showArchive = false;
    const pressed = new Set(), held = new ui_touch_js_1.TouchButtons();
    const gasContacts = new Map();
    let sx = 0, sy = 0, lookX = 0, lookY = 0, running = false;
    let cameraPointer = null, stickPointer = null;
    let lastDraw = -Infinity, toastTimer = 0, offlineTimer = 0;
    let offlineLabel = 'Подготовка офлайн-версии';
    let garagePaint = '#4e8491';
    const modal = q('.k-modal'), dialogContent = q('.k-dialog-scroll'), mapMini = q('.k-map-frame').querySelector('svg'), kStick = q('.k-stick'), knob = q('.k-stick-knob'), gasLabel = q('.k-gas span'), look = q('.k-look');
    const mission = q('.k-mission'), missionTitle = q('.k-mission-title'), missionKind = q('.k-mission-kind'), missionObjective = q('.k-objective-text'), missionDistance = q('.k-objective-distance'), hintButton = q('.k-interact'), wp = q('.k-waypoint'), toast = q('.k-toast'), off = q('.k-offline');
    const mapCard = q('.k-mapcard'), navDistance = q('.k-nav-distance'), wanted = q('.k-wanted'), wantedText = q('.k-wanted-text'), wantedLevel = q('.k-alert-level'), wantedProgress = q('.k-alert-progress'), driveStatus = q('.k-drive-status'), place = q('.k-map-place span'), wallet = q('.k-money'), clock = q('.k-clock'), speed = q('.k-speed'), gear = q('.k-gear'), lamps = q('.k-lamps'), vehicle = q('.k-vehicle-name'), conditionMeter = q('.k-condition'), condition = q('.k-condition i'), step = q('.k-step');
    const input = { moveX: 0, moveY: 0, steer: 0, gas: 0, brake: 0, handbrake: false, run: false, rear: false, analog: false };
    function cancelHold() {
        if (tapHold) {
            clearTimeout(tapHold.timer);
            tapHold = null;
        }
    }
    function startHold(kind, e) {
        if (tapHold)
            return;
        const { clientX: x, clientY: y, pointerId: id } = e;
        tapHold = { kind, x, y, id, timer: window.setTimeout(() => {
                tapHold = null;
                if (kind === 'interact') {
                    if (panel || (view.actions?.length ?? 0) < 2)
                        return;
                    skipClickUntil = performance.now() + 700;
                    buzz('mark');
                    open('alternatives');
                    return;
                }
                if (panel !== 'map')
                    return;
                const svg = q('.k-big-map').querySelector('svg'), matrix = svg.getScreenCTM();
                if (!matrix)
                    return;
                const p = new DOMPoint(x, y).matrixTransform(matrix.inverse());
                if (p.x < world_expansion_layout_js_1.cityLimits.minX || p.x > world_expansion_layout_js_1.cityLimits.maxX || p.y < world_expansion_layout_js_1.cityLimits.minZ || p.y > world_expansion_layout_js_1.cityLimits.maxZ)
                    return;
                markPending = { x: Math.round(p.x * 10) / 10, z: Math.round(p.y * 10) / 10 };
                buzz('mark');
                skipClickUntil = performance.now() + 550;
                drawPanel();
            }, 470) };
    }
    function routeTarget() {
        if (atlasPick)
            return atlasPick;
        const chosen = (0, ui_map_js_1.atlasPlaces)(atlasState())[focusIndex];
        if (chosen && focusIndex !== 0)
            return chosen;
        return navEnd ?? (view.target ? { ...view.target, label: view.target.label ?? 'Цель заказа' } : null);
    }
    function atlasControls() {
        if (view.inside)
            return '';
        if (markPending)
            return `<div class="k-pin-menu"><label>Подпись <input type="text" data-pin-label maxlength="64" placeholder="Название места"></label>${Object.keys(ui_navigation_js_1.markNames).map(k => `<button type="button" data-action="pin-add" data-value="${k}">${ui_navigation_js_1.markNames[k]}</button>`).join('')}<button type="button" data-action="pin-cancel" aria-label="Отмена">×</button></div>`;
        const selected = (0, ui_map_js_1.atlasPlaces)(atlasState())[focusIndex];
        const mark = selected && settings.marks.find(m => m.x === selected.x && m.z === selected.z);
        const end = routeTarget();
        const summary = navEnd && navLeg ? (hasRoute() ? `${escape(navEnd.label)} · ${navMode === 'drive' ? 'на машине' : navMode === 'tram' ? 'трамвай 07' : 'пешком'} ${navLeg.metres} м${navLeg.walkMetres ? ' + ' + navLeg.walkMetres + ' м пешком' : ''}` : 'Нет доступного пути') : '';
        return `<div class="k-map-options">${end ? `<div class="k-route-actions"><span>Маршрут · ${escape(end.label)}</span><button type="button" data-action="nav-walk">Пешком</button><button type="button" data-action="nav-drive">На машине</button><button type="button" data-action="nav-tram">Трамваем</button></div>` : ''}<div class="k-pin-info"><button type="button" data-action="pin-here">Подписать точку</button><span>${summary || 'I J K L — сдвинуть точку. Удержание пальцем — поставить метку.'}</span>${mark ? `<button type="button" data-action="pin-remove" data-value="${mark.id}">Удалить метку</button>` : ''}${navEnd ? '<button type="button" data-action="nav-clear">Сбросить путь</button>' : ''}</div></div>`;
    }
    function updateRoute(along = false) {
        navOrigin = { x: view.x, z: view.z };
        if (!navEnd) {
            navLeg = null;
        } else if (navMode === 'tram') {
            navLeg = laptop.tramRoute(navOrigin, navEnd, view.tramTime, along ? navLeg : null);
        } else {
            const advanced = along && navLeg ? (0, ui_navigation_js_1.advanceRoute)(navLeg, navOrigin, navMode) : null;
            navLeg = advanced ?? (0, ui_navigation_js_1.routeTo)(navOrigin, navEnd, navMode);
        }
        mapRoute = navLeg ? { mode: navMode, path: navLeg.path, tram:navLeg.tram, lastMile: navLeg.lastMile } : undefined;
    }
    function atlasAction(id, value) {
        if (panel !== 'map' || view.inside)
            return;
        if (id === 'pin-add' && markPending && value && Object.hasOwn(ui_navigation_js_1.markNames, value)) {
            const point = markPending, kind = value;
            const marks = kind === 'car' ? settings.marks.filter(m => m.kind !== 'car') : settings.marks;
            const id = 'pin-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
            const label = q('[data-pin-label]')?.value.trim().slice(0,64);
            changed({ marks: [...marks, { ...point, id, kind, label }] });
            markPending = null;
            atlasCenter = { ...point };
            atlasZoom = ui_map_js_1.zoomWidths.length - 1;
            focusIndex = (0, ui_map_js_1.atlasPlaces)(atlasState()).findIndex(p => 'id' in p && p.id === id);
        }
        else if (id === 'pin-here') markPending = atlasPick ?? (0, ui_map_js_1.atlasPlaces)(atlasState())[focusIndex] ?? {x:view.x,z:view.z};
        else if (id === 'pin-cancel')
            markPending = null;
        else if (id === 'pin-remove') {
            const p = settings.marks.find(m => m.id === value);
            if (p && navEnd?.x === p.x && navEnd?.z === p.z) {
                navEnd = null;
                updateRoute();
            }
            changed({ marks: settings.marks.filter(m => m.id !== value) });
            focusIndex = -1;
        }
        else if (id === 'nav-clear') {
            navEnd = null;
            updateRoute();
        }
        else if (id === 'nav-walk' || id === 'nav-drive' || id === 'nav-tram') {
            const p = routeTarget();
            if (!p)
                return;
            navMode = id.slice(4);
            navEnd = { ...p };
            updateRoute();
        }
        drawPanel();
    }
    function refreshInput() {
        const has = (...keys) => keys.some((k) => pressed.has(k));
        const touch = held.input();
        input.moveX = clamp(sx + Number(has('KeyD', 'ArrowRight')) - Number(has('KeyA', 'ArrowLeft')), -1, 1);
        input.moveY = clamp((view.driving ? 0 : sy) + Number(has('KeyW', 'ArrowUp')) - Number(has('KeyS', 'ArrowDown')), -1, 1);
        input.steer = clamp(input.moveX + touch.steer, -1, 1);
        input.gas = has('KeyW', 'ArrowUp') ? 1 : touch.gas;
        input.analog = stickPointer !== null;
        input.rear = (settings.toggleHolds ? toggledRear : has('KeyV')) || touch.rear;
        input.brake = Number(has('KeyS', 'ArrowDown') || touch.brake);
        input.handbrake = has('Space') || touch.handbrake;
        input.run = !view.driving && (running || settings.autoSprint && outerStick || (settings.toggleHolds ? toggledRun : has('ShiftLeft', 'ShiftRight')));
        root.classList.toggle('k-throttle-on', gasContacts.size > 0);
        if (gasContacts.size) {
            const percent = Math.round(touch.gas * 100) + '%';
            root.style.setProperty('--k-throttle', percent);
            setText(gasLabel, percent);
        }
        else
            setText(gasLabel, 'Газ');
        kStick.classList.toggle('k-stick-active', stickPointer !== null);
        kStick.classList.toggle('k-stick-sprint', input.run && outerStick);
        root.classList.toggle('k-run-on', input.run);
    }
    function resetInput() {
        toggledRun = toggledRear = false;
        cancelHold();
        gasContacts.clear();
        outerStick = false;
        sx = sy = lookX = lookY = 0;
        pressed.clear();
        const pointers = [...held.touches()].map(([id, { source }]) => ({ id, source }));
        if (cameraPointer)
            pointers.push({ id: cameraPointer.id, source: look });
        if (stickPointer)
            pointers.push({ id: stickPointer.id, source: kStick });
        held.clear();
        cameraPointer = null;
        stickPointer = null;
        for (const { id, source } of pointers)
            if (source.hasPointerCapture(id))
                source.releasePointerCapture(id);
        knob.style.transform = 'translate(-50%, -50%)';
        root.querySelectorAll('.k-pressed').forEach((e) => e.classList.remove('k-pressed'));
        running = false;
        refreshInput();
    }
    function notify(message) {
        if (!message)
            return;
        window.clearTimeout(toastTimer);
        q('.k-toast span').textContent = message;
        toast.hidden = false;
        toastTimer = window.setTimeout(() => (toast.hidden = true), 4600);
    }
    function buzz(pattern) {
        if (!navigator.vibrate || settings.haptics <= 0)
            return;
        navigator.vibrate(Math.max(5, Math.round((pattern === 'reverse' ? 35 : 20) * settings.haptics)));
    }
    function buzzImpact(strength) {
        if (!navigator.vibrate || settings.haptics <= 0 || strength < .12)
            return;
        navigator.vibrate(Math.max(5, Math.round((20 + 95 * strength) * settings.haptics)));
    }
    function setSettings(next) {
        for (const k of ['keyboardLook','carFollow','cameraStep'])
            if (Number.isFinite(next[k])) settings[k] = clamp(next[k],k==='keyboardLook'?.2:0,k==='keyboardLook'?2:1);
        for (const k of ['battery','toggleHolds','freeOrbit'])
            if (typeof next[k]==='boolean') settings[k] = next[k];
        if (next.bindings) settings.bindings = laptop.cleanBindings(next.bindings);
        if (next.cameraDistance === 'near' || next.cameraDistance === 'normal' || next.cameraDistance === 'far')
            settings.cameraDistance = next.cameraDistance;
        if (typeof next.steerStick === 'boolean')
            settings.steerStick = next.steerStick;
        root.classList.toggle('k-steer-stick', settings.steerStick);
        kStick.setAttribute('aria-label', view.driving ? 'Джойстик руления' : 'Джойстик движения');
        if ((0, radio_stations_js_1.isRadioStation)(next.radioStation))
            settings.radioStation = next.radioStation;
        if ((0, sound_mix_js_1.isSoundProfile)(next.soundProfile))
            settings.soundProfile = next.soundProfile;
        if ((0, population_profile_js_1.isPopulationDensity)(next.pedestrianDensity))
            settings.pedestrianDensity = next.pedestrianDensity;
        if ((0, population_profile_js_1.isPopulationDensity)(next.trafficDensity))
            settings.trafficDensity = next.trafficDensity;
        if (Number.isFinite(next.impactMotion))
            settings.impactMotion = clamp(next.impactMotion, 0, 1);
        for (const name of ['carSensitivity', 'cabinSensitivity', 'haptics', 'subtitleSize', 'goalSize']) {
            const v = next[name];
            if (typeof v === 'number' && Number.isFinite(v))
                settings[name] = clamp(v, name === 'haptics' ? 0 : name.endsWith('Sensitivity') ? .3 : .8, name === 'haptics' ? 1 : name.endsWith('Sensitivity') ? 2.5 : 1.8);
        }
        for (const k of ['autoSprint', 'compactHud', 'leftHanded'])
            if (typeof next[k] === 'boolean')
                settings[k] = next[k];
        if (next.shoulder === 1 || next.shoulder === -1)
            settings.shoulder = next.shoulder;
        if (next.layouts)
            settings.layouts = (0, ui_layout_js_1.safeLayouts)(next.layouts);
        if (next.marks)
            settings.marks = (0, ui_navigation_js_1.validMarks)(next.marks);
        root.classList.toggle('k-compact-hud', settings.compactHud);
        root.style.setProperty('--k-caption', String(settings.subtitleSize));
        root.style.setProperty('--k-goal', String(settings.goalSize));
        if (Number.isFinite(next.sensitivity))
            settings.sensitivity = clamp(next.sensitivity, 0.3, 2.5);
        if (Number.isFinite(next.buttonSize))
            settings.buttonSize = clamp(next.buttonSize, 0.75, 1.4);
        if (Number.isFinite(next.volume))
            settings.volume = clamp(next.volume, 0, 1);
        if (typeof next.minimap === 'boolean')
            settings.minimap = next.minimap;
        if (typeof next.radio === 'boolean')
            settings.radio = next.radio;
        root.style.setProperty('--k-size', String(settings.buttonSize));
        mapCard.hidden = !settings.minimap;
        paintKeyNames();
        positioning.draw(panel === 'layout' ? editMode : view.driving ? 'car' : 'foot', settings.layouts, settings.leftHanded);
    }
    function changed(next) {
        setSettings(next);
        onAction('settings', JSON.stringify(settings));
    }
    function paintKeyNames() {
        const label = k => laptop.keyName(settings.bindings?.[k] ?? k);
        for (const el of root.querySelectorAll('kbd[data-key-name]')) {
            const n=el.dataset.keyName;
            el.textContent = n==='WASD' ? ['KeyW','KeyA','KeyS','KeyD'].map(label).join('') :
                n.toUpperCase()==='SHIFT' ? label('ShiftLeft') : n.toUpperCase()==='SPACE' ? label('Space') :
                /^[A-Z]$/.test(n) ? label('Key'+n) : n;
        }
    }
    function desktopHelp() {
        return `<div class="k-help"><span>${key('WASD')} или стрелки · движение</span><span>${key('E')} сесть / действие</span><span>${key('ЛКМ')} тянуть для обзора</span><span>Два пальца по трекпаду · обзор</span><span>${key('X')} выйти из машины</span><span>${key('Space')} ручник</span><span>${key('H')} сигнал</span><span>${key('C')} радио</span></div>`;
    }
    function settingsRow(name, title, min, max, step) {
        const value = Number(settings[name]);
        return `<label class="k-range"><span>${title}<output>${Math.round(value * 100)}%</output></span><input type="range" data-setting="${name}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
    }
    function toggleRow(name, title) {
        return `<label class="k-toggle"><span>${title}</span><input type="checkbox" data-setting="${name}" ${settings[name] ? 'checked' : ''}><i></i></label>`;
    }
    function populationRows() {
        const status = view.population;
        const totals = status?.actual;
        const summary = totals ? `<p class="k-panel-status">Рядом · Люди ${totals.pedestrians} · Поток ${totals.traffic} · Парковка ${totals.parked}</p>` : '';
        return `<div class="k-list" role="group" aria-label="Населённость района">${panelRow('pedestrian-density', 'arrows', 'Пешеходы · ' + population_profile_js_1.densityNames[settings.pedestrianDensity])}${panelRow('traffic-density', 'car', 'Трафик · ' + population_profile_js_1.densityNames[settings.trafficDensity])}</div>` + summary;
    }
    function drawGarage() {
        const parts = view.garageParts;
        const title = parts ? escape(view.vehicleName) : 'Поставьте машину у ворот';
        const heading = `<div class="k-garage-over"><span>${(0, ui_icons_js_1.ico)('car', 32)}</span><div><small>АВТОМОБИЛЬ</small><strong>${title}</strong></div><b>${money(view.money)}</b></div>`;
        const journal = panelRow('garage-log', 'garage', 'Гаражный журнал');
        if (!parts)
            return heading + `<div class="k-list">${journal}</div>`;
        const full = view.repairCost ? panelRow('repair', 'tool', 'Полный ремонт', `<b>${money(view.repairCost)}</b>`) : '';
        const jobs = parts.map(({ id, label, price }) => panelRow('repairPart', 'tool', escape(label), `<b>${money(price)}</b>`, id)).join('');
        const body = `<div class="k-garage-line"><span>Кузов</span><strong>${Math.round((1 - (view.damage ?? 0)) * 100)}%</strong></div>`;
        const swatches = Object.entries(garageColors).map(([color, label]) => `<button type="button" data-color="${color}" class="${color === garagePaint ? 'selected' : ''}" style="--paint:${color}" aria-label="${label}"></button>`).join('');
        return heading + body +
            `<div class="k-list">${full}${jobs}${panelRow('saveCar', 'save', 'Сохранить машину')}${journal}</div>` +
            `<div class="k-paint"><span>Окраска кузова</span><div class="k-swatches">${swatches}</div>${panelRow('paint', 'car', 'Нанести окраску', '<b>150 ₽</b>')}</div>`;
    }
    function panelBody() {
        if (panel === 'laptop') {
            const rows = Object.entries(laptop.bindings).map(([k,name]) => panelRow('bind-key','action',name,
                '<kbd>'+escape(pendingBinding===k?'Нажмите клавишу':laptop.keyName(settings.bindings[k]??k))+'</kbd>',k)).join('');
            return `<div class="k-list">${quarterReport}${toggleRow('battery','Питание от батареи · 30 кадров/с')}${toggleRow('toggleHolds','Бег и взгляд назад одним нажатием')}${settingsRow('keyboardLook','Скорость ручного обзора',.2,2,.1)}${settingsRow('cameraStep','Покачивание камеры при ходьбе',0,1,.1)}${settingsRow('carFollow','Автодоворот камеры за машиной',0,1,.1)}${panelRow('quarter-trial','camera','Проехать контрольный квартал')}${rows}${panelRow('bind-reset','refresh','Вернуть исходные клавиши')}</div>`;
        }
        if (panel && externalPanels.has(panel))
            return externalPanels.get(panel).render();
        if (panel === 'alternatives')
            return `<div class="k-list">${(view.actions ?? []).map((a, i) => panelRow('choice-' + i, 'action', escape(a.label))).join('')}</div>`;
        if (panel === 'layout')
            return `<div class="k-layout-toolbar"><div role="group" aria-label="Раскладка">${modes.map(m => `<button type="button" data-action="edit-${m}" aria-pressed="${editMode === m}">${m === 'foot' ? 'Пешком' : 'За рулём'}</button>`).join('')}</div><button data-action="edit-mirror">Отразить</button><button data-action="edit-reset">Сбросить</button><button data-action="settings">Готово</button></div><p class="k-layout-tip">Перетащите кнопку на нужное место.</p>`;
        if (panel === 'pause')
            return `<div class="k-list">${panelRow('close', 'play', 'Продолжить игру')}${panelRow('phone', 'phone', 'Журнал заказов')}${panelRow('map', 'map', 'Карта района')}${view.atGarage ? panelRow('garage', 'garage', 'Открыть гараж') : ''}${panelLinks()}${panelRow('settings', 'settings', 'Настройки')}${panelRow('restart', 'checkpoint', 'С контрольной точки')}${document.fullscreenEnabled ? panelRow('full', 'full', document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран') : ''}</div>${desktopHelp()}<div class="k-panel-status">${(0, ui_icons_js_1.ico)('signal', 15)}<span class="k-offline-status">${escape(offlineLabel)}</span></div>`;
        if (panel === 'settings')
            return `<div class="k-list">${panelRow('layout', 'arrows', 'Расстановка кнопок')}${panelRow('close', 'play', 'Проверить в игре')}</div>${populationRows()}${settingsRow('sensitivity', 'Камера пешком', 0.3, 2.5, 0.05)}${settingsRow('carSensitivity', 'Камера за машиной', .3, 2.5, .05)}${settingsRow('cabinSensitivity', 'Камера в салоне', .3, 2.5, .05)}${settingsRow('haptics', 'Сила вибрации', 0, 1, .05)}${settingsRow('impactMotion', 'Отдача камеры при ударе', 0, 1, .05)}${settingsRow('subtitleSize', 'Размер субтитров', .8, 1.8, .05)}${settingsRow('goalSize', 'Подписи целей', .8, 1.8, .05)}${panelRow('camera-distance', 'arrows', 'Дистанция камеры · ' + cameraNames[settings.cameraDistance])}${toggleRow('steerStick', 'Руление джойстиком')}${panelRow('next-station', 'signal', 'Радиостанция · ' + radio_stations_js_1.radioStations[settings.radioStation])}${toggleRow('autoSprint', 'Бег за внешним кольцом джойстика')}${toggleRow('leftHanded', 'Леворукая раскладка')}${toggleRow('compactHud', 'Свернуть баланс и приборы')}${settingsRow('buttonSize', 'Размер сенсорных кнопок', 0.75, 1.4, 0.05)}${settingsRow('volume', 'Громкость', 0, 1, 0.05)}${panelRow('sound-profile', 'signal', 'Звуковой режим · ' + sound_mix_js_1.soundProfileNames[settings.soundProfile])}${toggleRow('minimap', 'Мини-карта')}${toggleRow('radio', 'Автомобильное радио')}<div class="k-list">${panelRow('pause', 'left', 'В меню паузы')}</div>`;
        if (panel === 'map' && showArchive && view.archiveMap)
            return (0, interior_archive_js_1.archiveFigure)() + panelRow('archive-toggle', 'map', 'Вернуться к навигации');
        if (panel === 'map')
            return `<div class="k-atlas-body"><div class="k-big-map">${(0, ui_map_js_1.mapTemplate)(true)}<span class="k-north">С</span>${view.inside ? '' : `<div class="k-atlas-zoom"><button type="button" data-action="atlas-out" aria-label="Отдалить карту" ${atlasZoom === 0 ? 'disabled' : ''}>−</button><button type="button" data-action="atlas-in" aria-label="Приблизить карту" ${atlasZoom === ui_map_js_1.zoomWidths.length - 1 ? 'disabled' : ''}>+</button></div>`}</div><nav class="k-atlas-index" aria-label="Ориентиры"><button type="button" data-map-focus="-1" aria-pressed="true">${view.inside ? (view.interiorPlan?.number ? 'Весь этаж' : 'Весь дом') : 'Весь город'}</button>${(0, ui_map_js_1.atlasPlaces)(atlasState()).map((p, i) => `<button type="button" data-map-focus="${i}" aria-pressed="false">${p.area ? `<small>${escape(p.area)}</small>` : ''}${escape(p.label)}</button>`).join('')}</nav></div>${atlasControls()}${view.archiveMap ? panelRow('archive-toggle', 'map', 'Архивная схема дворов') : ''}<div class="k-legend"><span><i class="k-you"></i>Вы</span><span><i class="k-goal"></i>Цель</span>${view.wanted ? '<span><i class="k-scan"></i>Патруль</span>' : ''}<strong>${escape(view.district)}</strong></div>`;
        if (panel === 'garage')
            return drawGarage();
        const idx = view.missionIndex;
        const campaignOrder = view.campaignObjective ?? { title: view.missionTitle, goal: view.objective, reward: view.reward };
        return `<div class="k-list k-phone-services">${panelLinks()}</div><div class="k-phone-location">${(0, ui_icons_js_1.ico)('signal', 14)}<span>ДИСПЕТЧЕРСКАЯ СЕТЬ</span><b>77</b></div><div class="k-orders">${campaign
            .map((name, i) => {
            const active = i === idx, done = i < (view.completed ?? idx);
            return `<div class="k-order ${active ? 'active' : ''} ${done ? 'done' : ''}"><span class="k-order-icon">${(0, ui_icons_js_1.ico)(done ? 'check' : i === 0 ? 'route' : i === 1 ? 'car' : 'mapPin', 23)}</span><div><small>${done ? 'ЗАВЕРШЁН' : active ? 'АКТИВНЫЙ ЗАКАЗ' : 'В ОЧЕРЕДИ'}</small><strong>${escape(active ? campaignOrder.title : name)}</strong>${active ? `<p>${escape(briefs[i])}</p><p class="k-phone-goal">${escape(campaignOrder.goal)}</p>` : ''}</div>${active && campaignOrder.reward ? `<b>+${money(campaignOrder.reward)}</b>` : ''}</div>`;
        })
            .join('')}</div>${idx < 3 ? `<div class="k-list">${panelRow('map', 'map', 'Показать на карте')}${panelRow('restart', 'checkpoint', 'С контрольной точки')}</div>` : ''}`;
    }
    function drawPanel() {
        if (!panel)
            return;
        const info = {
            pause: ['КОНТУР-77 · ВЕРСИЯ 3.3', 'Пауза'],
            layout: ['УПРАВЛЕНИЕ', 'Расстановка кнопок'], alternatives: ['РЯДОМ', 'Выбор действия'],
            laptop:['УПРАВЛЕНИЕ','Ноутбук и клавиши'], settings: ['СИСТЕМА', 'Настройки'],
            map: ['НАВИГАЦИЯ', view.inside ? (view.interiorId && view.interiorId !== 'house' ? (view.interiorPlan?.name ?? view.district) : 'План дома № 23') : 'Карта города'],
            phone: ['ТЕЛЕФОН', 'Журнал заказов'],
            garage: ['КАНАЛЬНЫЕ ГАРАЖИ', 'Мастерская'],
        };
        q('.k-dialog').classList.toggle('k-atlas', panel === 'map');
        const registeredTitle = externalPanels.get(panel)?.title;
        const title = info[panel] ?? [panel==='district-choice' || panel==='district-book' ? 'КАНАЛЬНАЯ' : 'ТЕЛЕФОН',
            typeof registeredTitle === 'function' ? registeredTitle() : registeredTitle ?? 'Меню'];
        root.classList.toggle('k-layout-mode', panel === 'layout');
        root.classList.toggle('k-driving', panel === 'layout' ? editMode === 'car' : view.driving);
        q('.k-dialog-section').textContent = title[0];
        q('#k-dialog-title').textContent = title[1];
        const indexScroll = dialogContent.querySelector('.k-atlas-index')?.scrollTop ?? 0;
        const workshopScroll = panel === 'garage' ? dialogContent.scrollTop : 0;
        dialogContent.innerHTML = panelBody();
        paintKeyNames();
        if (panel === 'garage')
            dialogContent.scrollTop = workshopScroll;
        if (panel === 'map' && !showArchive) {
            const svg = q('.k-big-map').querySelector('svg'), state = atlasState();
            (0, ui_map_js_1.paintMap)(svg, state);
            (0, ui_map_js_1.focusAtlas)(svg, state, focusIndex, atlasZoom, atlasCenter);
            if (atlasPick && !view.inside) {
                const cursor=document.createElementNS('http://www.w3.org/2000/svg','path');
                cursor.setAttribute('d','M-3 0H3 M0 -3V3'); cursor.setAttribute('fill','none');
                cursor.setAttribute('stroke','#fff3bb'); cursor.setAttribute('stroke-width','1.5');
                cursor.setAttribute('vector-effect','non-scaling-stroke'); cursor.setAttribute('pointer-events','none');
                cursor.setAttribute('transform','translate('+atlasPick.x+' '+atlasPick.z+')'); svg.appendChild(cursor);
            }
            const index = dialogContent.querySelector('.k-atlas-index');
            if (index)
                index.scrollTop = indexScroll;
            for (const btn of dialogContent.querySelectorAll('[data-map-focus]'))
                btn.setAttribute('aria-pressed', String(Number(btn.dataset.mapFocus) === focusIndex && (focusIndex >= 0 || view.inside || atlasZoom === 0)));
        }
        if (panel === 'layout') {
            if (!hintButton.textContent?.trim() || !view.hint)
                hintButton.querySelector('strong').textContent = 'Действие';
            positioning.draw(editMode, settings.layouts, settings.leftHanded);
        }
    }
    function open(name) {
        resetInput();
        if (name === 'map') {
            focusIndex = -1;
            markPending = null;
            showArchive = false;
            atlasZoom = 0;
            atlasCenter = null;
            atlasPick = null;
            pan = null;
        }
        if (name === 'layout')
            editMode = view.driving ? 'car' : 'foot';
        if (name === 'garage' && panel !== name)
            dialogContent.scrollTop = 0;
        if (panel!==name) pendingBinding=null;
        panel = name;
        modal.hidden = false;
        root.classList.add('k-modal-on');
        drawPanel();
        if (root.classList.contains('k-hardware-input')) dialogContent.querySelector('button:not([disabled]),input')?.focus({preventScroll:true});
    }
    function close() {
        panel = null;
        pendingBinding=null;
        modal.hidden = true;
        root.classList.remove('k-modal-on', 'k-layout-mode');
        root.classList.toggle('k-driving', view.driving);
        positioning.draw(view.driving ? 'car' : 'foot', settings.layouts, settings.leftHanded);
        resetInput();
    }
    function act(a, value) {
        if (a === 'free-orbit') { changed({freeOrbit:!settings.freeOrbit}); notify(settings.freeOrbit?'Свободный обзор зафиксирован':'Камера следует за движением'); return; }
        if (a === 'bind-key') { pendingBinding=value; drawPanel(); return; }
        if (a === 'bind-reset') { pendingBinding=null; changed({bindings:{}}); drawPanel(); return; }
        if ((a === 'atlas-in' || a === 'atlas-out') && panel === 'map' && !view.inside) {
            atlasZoom = clamp(atlasZoom + (a === 'atlas-in' ? 1 : -1), 0, ui_map_js_1.zoomWidths.length - 1);
            if (atlasZoom === 0) {
                focusIndex = -1;
                atlasCenter = null;
            }
            drawPanel();
            return;
        }
        if (a === 'archive-toggle' && panel === 'map' && view.archiveMap) {
            showArchive = !showArchive;
            drawPanel();
            return;
        }
        if (a.startsWith('choice-') && panel === 'alternatives') {
            const choice = view.actions?.[Number(a.slice(7))];
            if (choice) {
                close();
                onAction(choice.id, choice.value);
            }
            return;
        }
        if (a === 'interact' && view.actions?.length) {
            const choice = view.actions[0];
            if (choice.choiceLabel) {
                open('alternatives');
                return;
            }
            onAction(choice.id, choice.value);
            return;
        }
        if (a === 'shoulder') {
            changed({ shoulder: -settings.shoulder });
            return;
        }
        if (a === 'camera-distance') {
            const rows = Object.keys(cameraNames);
            const choice = rows[(rows.indexOf(settings.cameraDistance) + 1) % rows.length];
            changed({ cameraDistance: choice });
            if (panel)
                drawPanel();
            else
                notify('Камера · ' + cameraNames[choice]);
            return;
        }
        if (a === 'next-station') {
            const stations = Object.keys(radio_stations_js_1.radioStations);
            const station = stations[(stations.indexOf(settings.radioStation) + 1) % stations.length];
            changed({ radio: true, radioStation: station });
            if (panel)
                drawPanel();
            else
                notify(radio_stations_js_1.radioStations[station]);
            return;
        }
        if (a === 'sound-profile') {
            const profile = sound_mix_js_1.soundProfiles[(sound_mix_js_1.soundProfiles.indexOf(settings.soundProfile) + 1) % sound_mix_js_1.soundProfiles.length];
            const position = dialogContent.scrollTop;
            changed({ soundProfile: profile });
            drawPanel();
            dialogContent.scrollTop = position;
            dialogContent.querySelector('[data-action="sound-profile"]')?.focus({ preventScroll: true });
            return;
        }
        if (a === 'pedestrian-density' || a === 'traffic-density') {
            const key = a === 'pedestrian-density' ? 'pedestrianDensity' : 'trafficDensity';
            const mode = population_profile_js_1.densityModes[(population_profile_js_1.densityModes.indexOf(settings[key]) + 1) % population_profile_js_1.densityModes.length];
            const position = dialogContent.scrollTop;
            changed({ [key]: mode });
            drawPanel();
            dialogContent.scrollTop = position;
            dialogContent.querySelector('[data-action="' + a + '"]')?.focus({ preventScroll: true });
            return;
        }
        if (a.startsWith('edit-') && panel === 'layout') {
            if (a === 'edit-foot')
                editMode = 'foot';
            if (a === 'edit-car')
                editMode = 'car';
            if (a === 'edit-mirror')
                changed({ leftHanded: !settings.leftHanded });
            if (a === 'edit-reset')
                changed({ layouts: { ...settings.layouts, [editMode]: {} } });
            drawPanel();
            return;
        }
        if (a.startsWith('pin-') || a.startsWith('nav-')) {
            atlasAction(a, value);
            return;
        }
        if (a === 'close') {
            close();
            return;
        }
        if (builtIn.has(a) || externalPanels.has(a)) {
            if (panel === a)
                close();
            else
                open(a);
            return;
        }
        if (a === 'run') {
            running = !running;
            refreshInput();
            return;
        }
        if (a === 'radio') {
            changed({ radio: !settings.radio });
            notify(settings.radio ? 'Радио включено' : 'Радио выключено');
            return;
        }
        if (a === 'full') {
            ;
            (document.fullscreenElement
                ? document.exitFullscreen()
                : document.documentElement.requestFullscreen())
                .then(drawPanel)
                .catch(() => notify('Полный экран недоступен'));
            return;
        }
        if (a === 'restart')
            close();
        onAction(a, a === 'paint' ? garagePaint : value);
        if (panel === 'garage')
            drawPanel();
    }
    root.addEventListener('click', (event) => {
        const el = event.target;
        if (performance.now() < skipClickUntil && (hintButton.contains(el) || el.closest('.k-big-map')))
            return;
        if (panel === 'layout' && el.closest('[data-drag-control]'))
            return;
        const focus = el.closest('[data-map-focus],[data-map-place]');
        if (focus && panel === 'map') {
            const index = focus.dataset.mapPlace ? (0, ui_map_js_1.atlasPlaces)(atlasState()).findIndex(p => p.label === focus.dataset.mapPlace) : Number(focus.dataset.mapFocus);
            if (!Number.isFinite(index))
                return;
            focusIndex = index;
            atlasCenter = null;
            atlasPick = null;
            atlasZoom = index < 0 ? 0 : ui_map_js_1.atlasDistrictZoom;
            markPending = null;
            drawPanel();
            return;
        }
        const color = el.closest('[data-color]');
        if (color) {
            garagePaint = color.dataset.color;
            drawPanel();
            return;
        }
        const action = el.closest('[data-action]');
        if (action) {
            act(action.dataset.action, action.dataset.value);
            return;
        }
        if (el === modal)
            close();
    });
    root.addEventListener('input', (event) => {
        const el = event.target;
        const prop = el.dataset.setting;
        if (!prop)
            return;
        if (el.type === 'range') {
            changed({ [prop]: Number(el.value) });
            el.closest('label').querySelector('output').textContent = `${Math.round(+el.value * 100)}%`;
        }
        else
            changed({ [prop]: el.checked });
    });
    function lookSensitivity() {
        return view.driving ? (view.cockpit ? settings.cabinSensitivity : settings.carSensitivity) : settings.sensitivity;
    }
    look.addEventListener('wheel', e => {
        if (panel || e.ctrlKey || e.metaKey || e.altKey)
            return;
        if (e.cancelable)
            e.preventDefault();
        root.classList.add('k-hardware-input');
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? look.clientHeight : 1;
        const horizontal = e.shiftKey && e.deltaX === 0;
        const sensitivity = .75 * lookSensitivity();
        lookX += clamp((horizontal ? e.deltaY : e.deltaX) * unit, -100, 100) * sensitivity;
        if (!horizontal)
            lookY += clamp(e.deltaY * unit, -100, 100) * sensitivity;
    }, { passive: false });
    function cameraMove(e) {
        if (cameraPointer?.id !== e.pointerId)
            return;
        const sensitivity = lookSensitivity();
        lookX += (e.clientX - cameraPointer.x) * sensitivity;
        lookY += (e.clientY - cameraPointer.y) * sensitivity;
        cameraPointer.x = e.clientX;
        cameraPointer.y = e.clientY;
    }
    function updateStick(e) {
        if (!stickPointer)
            return;
        const { x, y, reach } = stickPointer;
        const drag = (0, ui_touch_js_1.thumbDrag)(e.clientX - x, e.clientY - y, reach, view.driving, outerStick);
        outerStick = drag.sprint;
        sx = drag.x;
        sy = drag.y;
        knob.style.transform = `translate(calc(-50% + ${drag.knobX.toFixed(1)}px), calc(-50% + ${drag.knobY.toFixed(1)}px))`;
        refreshInput();
    }
    root.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' || e.pointerType === 'mouse')
            root.classList.toggle('k-hardware-input', e.pointerType === 'mouse');
        const target = e.target;
        if (panel === 'layout' && positioning.down(e))
            return;
        if (panel === 'map' && target.closest('.k-big-map') && !view.inside && !target.closest('button')) {
            if (pan)
                return;
            const svg = q('.k-big-map').querySelector('svg'), box = svg.viewBox.baseVal, ctm = svg.getScreenCTM();
            if (atlasZoom && ctm) {
                pan = { id: e.pointerId, x: e.clientX, y: e.clientY, origin: { x: box.x + box.width / 2, z: box.y + box.height / 2 }, units: 1 / ctm.a, moved: false };
                svg.setPointerCapture(e.pointerId);
            }
            startHold('map', e);
            return;
        }
        if (panel)
            return;
        if (hintButton.contains(target) && (view.actions?.length ?? 0) > 1) {
            startHold('interact', e);
            return;
        }
        const button = target.closest('[data-hold]');
        if (button) {
            if (e.button !== 0)
                return;
            e.preventDefault();
            button.setPointerCapture(e.pointerId);
            button.classList.add('k-pressed');
            const action = button.dataset.hold;
            if (action === 'gas') {
                const { bottom, height } = button.getBoundingClientRect();
                gasContacts.set(e.pointerId, { bottom, height });
                held.start(e.pointerId, action, button, (0, ui_touch_js_1.gasPressure)(e.clientY, bottom, height));
            }
            else
                held.start(e.pointerId, action, button);
            refreshInput();
            return;
        }
        if (kStick.contains(target) && stickPointer === null) {
            if (e.button !== 0)
                return;
            e.preventDefault();
            const r = kStick.getBoundingClientRect();
            stickPointer = { id: e.pointerId, x: r.left + r.width * .5, y: r.top + r.height * .5, reach: r.width * .36 };
            kStick.setPointerCapture(e.pointerId);
            updateStick(e);
            return;
        }
        if (target === look &&
            cameraPointer === null &&
            (e.pointerType !== 'mouse' || e.button === 0 || e.button === 2)) {
            e.preventDefault();
            look.setPointerCapture(e.pointerId);
            cameraPointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }
    });
    root.addEventListener('pointermove', (e) => {
        if (panel === 'layout') {
            positioning.move(e);
            return;
        }
        if (tapHold?.id === e.pointerId && Math.hypot(e.clientX - tapHold.x, e.clientY - tapHold.y) > 9)
            cancelHold();
        if (pan?.id === e.pointerId && panel === 'map' && (pan.moved || Math.hypot(e.clientX - pan.x, e.clientY - pan.y) > 6)) {
            const svg = q('.k-big-map').querySelector('svg');
            cancelHold();
            pan.moved = true;
            skipClickUntil = performance.now() + 300;
            atlasCenter = { x: pan.origin.x - (e.clientX - pan.x) * pan.units, z: pan.origin.z - (e.clientY - pan.y) * pan.units };
            (0, ui_map_js_1.focusAtlas)(svg, atlasState(), focusIndex, atlasZoom, atlasCenter);
            return;
        }
        const pedal = gasContacts.get(e.pointerId);
        if (pedal) {
            held.update(e.pointerId, (0, ui_touch_js_1.gasPressure)(e.clientY, pedal.bottom, pedal.height));
            refreshInput();
        }
        if (e.pointerId === stickPointer?.id)
            updateStick(e);
        else
            cameraMove(e);
    });
    function pointerEnd(e) {
        if (pan?.id === e.pointerId)
            pan = null;
        if (panel === 'layout' && positioning.end(e)) {
            changed({ layouts: settings.layouts });
            return;
        }
        if (tapHold?.id === e.pointerId)
            cancelHold();
        gasContacts.delete(e.pointerId);
        if (cameraPointer?.id === e.pointerId)
            cameraPointer = null;
        if (e.pointerId === stickPointer?.id) {
            stickPointer = null;
            outerStick = false;
            sx = sy = 0;
            knob.style.transform = 'translate(-50%, -50%)';
        }
        const hold = held.end(e.pointerId);
        if (hold && !held.covers(hold.source))
            hold.source.classList.remove('k-pressed');
        refreshInput();
    }
    root.addEventListener('pointerup', pointerEnd);
    root.addEventListener('pointercancel', pointerEnd);
    root.addEventListener('lostpointercapture', pointerEnd);
    look.addEventListener('contextmenu', (e) => e.preventDefault());
    const actionKeys = {
        KeyL:'district:read', KeyP:'district-book', KeyT:'alternatives', KeyY:'free-orbit',
        KeyE: 'interact',
        KeyF: 'light',
        KeyH: 'horn',
        KeyX: 'leaveCar',
        KeyM: 'map',
        KeyJ: 'phone',
        KeyC: 'radio',
        KeyQ: 'shoulder',
        KeyB: 'camera-distance',
        KeyR: 'next-station',
        KeyG: 'street:strike',
        KeyN: 'street:dodge',
        KeyZ: 'street:cover',
    };
    function keyDown(e) {
        const code = laptop.resolveKey(settings.bindings,e.code);
        if (pendingBinding && panel==='laptop') {
            if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.code==='Tab') return;
            e.preventDefault();
            if (e.code!=='Escape') {
                const next=laptop.bindKey(settings.bindings,pendingBinding,e.code);
                if (!next) { notify('Выберите букву, цифру, знак, Shift или пробел'); return; }
                changed({bindings:next});
            }
            pendingBinding=null; drawPanel(); return;
        }
        if (e.target?.matches('input,textarea,select') && !['Escape','Tab'].includes(e.code)) return;
        if (panel==='map' && !view.inside && ['KeyI','KeyJ','KeyK','KeyL'].includes(e.code)) {
            e.preventDefault();
            const step=e.shiftKey ? 12 : 2, pos=atlasPick ?? atlasCenter ?? view;
            const limits=world_expansion_layout_js_1.cityLimits;
            const x=clamp(pos.x+(Number(e.code==='KeyL')-Number(e.code==='KeyJ'))*step,limits.minX,limits.maxX);
            const z=clamp(pos.z+(Number(e.code==='KeyK')-Number(e.code==='KeyI'))*step,limits.minZ,limits.maxZ);
            atlasPick={x,z,label:'Точка на карте'}; atlasCenter={x,z}; atlasZoom=ui_map_js_1.atlasDistrictZoom;
            focusIndex=-1; markPending=null; drawPanel(); return;
        }
        if (panel && e.code === 'Tab') {
            const elements=[...q('.k-dialog').querySelectorAll('button,input,select,textarea,summary,[tabindex="0"]')].filter(el=>el.offsetWidth&&!el.disabled);
            if (elements.length && (!q('.k-dialog').contains(document.activeElement) ||
                document.activeElement===elements[e.shiftKey?0:elements.length-1])) {
                e.preventDefault(); elements[e.shiftKey?elements.length-1:0].focus();
            }
            return;
        }
        if (panel && ['ArrowDown','ArrowUp'].includes(e.code)) {
            const buttons = [...q('.k-dialog').querySelectorAll('button,input,select,summary')].filter(el=>el.offsetWidth&&!el.disabled);
            if (buttons.length) { e.preventDefault(); const i=buttons.indexOf(document.activeElement); buttons[(i+(e.code==='ArrowUp'?-1:1)+buttons.length)%buttons.length].focus(); }
            return;
        }
        if (panel && (e.code==='Enter' || e.code==='Space') && !q('.k-dialog').contains(document.activeElement)) {
            e.preventDefault(); q('.k-dialog-scroll button')?.focus(); return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey)
            return;
        if (code === 'KeyE' && e.shiftKey && !panel && (view.actions?.length ?? 0) > 1) {
            e.preventDefault();
            if (!e.repeat)
                open('alternatives');
            return;
        }
        if (code === 'Escape') {
            if (!e.repeat) {
                if (panel)
                    close();
                else
                    open('pause');
            }
            e.preventDefault();
            return;
        }
        if (panel) {
            if (!e.repeat && ((code === 'KeyM' && panel === 'map') || (code === 'KeyJ' && panel === 'phone')))
                close();
            return;
        }
        if (![
            'KeyI','KeyK','KeyU','KeyO','Space', 'KeyV',
            'ShiftLeft',
            'ShiftRight',
            'KeyW',
            'KeyA',
            'KeyS',
            'KeyD',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            ...Object.keys(actionKeys),
        ].includes(code))
            return;
        e.preventDefault();
        root.classList.add('k-hardware-input');
        if (!e.repeat && settings.toggleHolds) {
            if (code==='ShiftLeft'||code==='ShiftRight') toggledRun=!toggledRun;
            if (code==='KeyV') toggledRear=!toggledRear;
        }
        pressed.add(code);
        refreshInput();
        if (e.repeat)
            return;
        if (code === 'Space' && !view.driving)
            act('jump');
        else if (actionKeys[code])
            act(actionKeys[code]);
    }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', (e) => {
        pressed.delete(laptop.resolveKey(settings.bindings,e.code));
        refreshInput();
    });
    function interruption() {
        resetInput();
        if (!panel)
            open('pause');
    }
    window.addEventListener('blur', interruption);
    window.addEventListener('pagehide', interruption);
    matchMedia('(orientation: landscape)').addEventListener('change', resetInput);
    root.addEventListener('contextmenu', e => {
        if (e.target.closest('.k-big-map,.k-interact,[data-hold],.k-stick'))
            e.preventDefault();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden)
            interruption();
    });
    function setOffline(loaded, total, ready, failed = false, detail) {
        window.clearTimeout(offlineTimer);
        off.hidden = false;
        off.classList.toggle('ready', ready);
        off.classList.toggle('error', failed);
        const mb = (n) => n > 1024 * 1024 ? `${(n / 1048576).toFixed(1).replace('.', ',')} МБ` : `${Math.ceil(n / 1024)} КБ`;
        offlineLabel = ready
            ? 'Можно играть офлайн'
            : failed
                ? 'Офлайн-копия недоступна' + (detail ? ' · ' + detail : '')
                : total > 0
                    ? `Загрузка для офлайн · ${mb(loaded)} из ${mb(total)}`
                    : 'Подготовка офлайн-версии';
        q('.k-offline span').textContent = offlineLabel;
        q('.k-offline-line b').style.width = `${total ? (100 * loaded) / total : 0}%`;
        const line = root.querySelector('.k-offline-status');
        if (line)
            line.textContent = offlineLabel;
        if (ready || failed)
            offlineTimer = window.setTimeout(() => (off.hidden = true), 5200);
    }
    function update(data) {
        if (data.driving !== undefined && data.driving !== view.driving)
            resetInput();
        const garageStatus = () => JSON.stringify([view.money, view.vehicleName, view.damage, view.repairCost, view.garageParts]);
        const previousGarage = panel === 'garage' ? garageStatus() : '';
        const oldDriving = view.driving;
        Object.assign(view, data);
        if (view.driving && (view.speed ?? 0) < -.24 && !reverseLast)
            buzz('reverse');
        reverseLast = view.driving && (view.speed ?? 0) < -.24;
        if (oldDriving !== view.driving) {
            const mode = panel === 'layout' ? editMode : (view.driving ? 'car' : 'foot');
            root.classList.toggle('k-driving', mode === 'car');
            positioning.draw(mode, settings.layouts, settings.leftHanded);
        }
        if (navEnd && !view.inside) {
            const tram = navMode === 'tram';
            const boardingChanged = tram && (navLeg?.phase === 'ride') !== Number.isFinite(view.tramTime);
            if (boardingChanged || !navOrigin || Math.hypot(view.x - navOrigin.x, view.z - navOrigin.z) > (tram ? .5 : 12))
                updateRoute(true);
        }
        if (panel === 'garage' &&
            previousGarage !== garageStatus())
            drawPanel();
        const now = performance.now();
        if (now - lastDraw < 90)
            return;
        lastDraw = now;
        kStick.setAttribute('aria-label', view.driving ? 'Джойстик руления' : 'Джойстик движения');
        root.classList.toggle('k-driving', panel === 'layout' ? editMode === 'car' : view.driving);
        setText(wallet, money(view.money));
        clock.hidden = !view.clock;
        if (view.clock)
            setText(clock, view.clock);
        setText(place, view.district);
        navDistance.hidden = !navEnd || !!view.inside || !settings.minimap;
        if (navEnd && !view.inside) {
            const dist = hasRoute() ? (navLeg.metres + navLeg.walkMetres) : Math.hypot(view.x - navEnd.x, view.z - navEnd.z);
            setText(navDistance, metres(dist));
            navDistance.title = navEnd.label;
        }
        setText(missionTitle, view.missionTitle);
        setText(missionObjective, view.objective);
        missionDistance.hidden = !view.target || !!view.inside;
        if (view.target && !view.inside)
            setText(missionDistance, metres(Math.hypot(view.x - view.target.x, view.z - view.target.z)));
        const campaignActive = view.missionIndex < campaign.length;
        step.hidden = !view.sideStage && !campaignActive;
        setText(step, view.sideStage ? `Этап ${view.sideStage.step} / ${view.sideStage.total}` : `${view.missionIndex + 1} / ${campaign.length}`);
        mission.dataset.action = view.sidePanel ?? (view.sideStage ? 'district-jobs' : 'phone');
        mission.title = view.sidePanel === 'outer-tour' ? 'Открыть журнал объезда' : view.sideStage ? 'Открыть заказы района' : 'Открыть журнал заказов';
        setText(missionKind, view.sideStage ? 'Районный заказ' : campaignActive ? 'Заказ' : 'Свободная смена');
        const primary = view.actions?.[0];
        const label = primary?.choiceLabel ?? primary?.label ?? view.hint;
        hintButton.hidden = !label;
        if (label)
            setText(hintButton.querySelector('strong'), label);
        const choices = (view.actions?.length ?? 0) > 1;
        hintButton.classList.toggle('k-alternatives-available', choices);
        hintButton.title = primary?.choiceLabel ?? (choices ? 'Удерживайте для выбора действия' : 'Выполнить действие');
        if (settings.minimap)
            (0, ui_map_js_1.paintMap)(mapMini, atlasState());
        driveStatus.hidden = !view.driving;
        if (view.driving) {
            const movement = view.speed ?? 0, health = Math.round(clamp(1 - (view.damage ?? 0), 0, 1) * 100);
            setText(speed, String(Math.round(Math.abs(movement) * 3.6)));
            setText(gear, movement < -.24 ? 'ЗХ' : movement > .24 ? 'D' : 'N');
            setText(vehicle, view.vehicleName ?? '');
            lamps.hidden = !view.lights;
            condition.style.width = `${health}%`;
            conditionMeter.setAttribute('aria-valuenow', String(health));
            driveStatus.dataset.health = health <= 25 ? 'critical' : health <= 55 ? 'warning' : 'good';
        }
        root.classList.toggle('k-hot', view.wanted > 0);
        wanted.hidden = !view.wanted;
        const evidence = q('.k-pursuit-evidence'), memory = view.pursuitVehicle;
        evidence.hidden = !view.wanted || !memory && !view.pursuitOnFoot;
        if (!evidence.hidden) {
            evidence.querySelector('i').style.backgroundColor = memory?.color ?? '#c8866c';
            const type = memory ? memory.name + (memory.abandoned ? ' · оставлена' : '') : '';
            setText(evidence.querySelector('b'), [type, view.pursuitOnFoot ? 'Поиск пешком' : ''].filter(Boolean).join(' · '));
        }
        if (view.wanted) {
            const pursuit = view.pursuit, phase = pursuit?.phase ?? (view.search ? 'search' : 'pursuit');
            const pressure = pursuit?.pressure ?? 0;
            const progress = phase === 'search' && pursuit?.total ? pursuit.remaining / pursuit.total : pressure;
            wanted.dataset.phase = phase;
            wantedLevel.dataset.level = String(view.wanted);
            wantedLevel.setAttribute('aria-label', `Розыск. Уровень ${view.wanted} из 3`);
            setText(wantedText, phase === 'search' ? 'Зона поиска' : phase === 'uncertain' ? 'Потеря контакта' : pressure > .25 ? 'Вас окружили' : 'Погоня');
            wantedProgress.hidden = !(phase === 'search' && pursuit?.total) && pressure <= 0;
            wantedProgress.style.setProperty('--k-progress', `${clamp(progress, 0, 1) * 100}%`);
        }
        if (view.target)
            setText(q('.k-waypoint span'), metres(Math.hypot(view.x - view.target.x, view.z - view.target.z)));
        else
            wp.hidden = true;
    }
    function setWaypoint(x, y, visible) {
        wp.hidden = !visible || !view.target || panel !== null;
        if (wp.hidden)
            return;
        wp.style.left = `${x * 100}%`;
        wp.style.top = `${y * 100}%`;
    }
    function takeLook(dt = 1/60) {
        const yaw = Number(pressed.has('KeyO'))-Number(pressed.has('KeyU'));
        const pitch = Number(pressed.has('KeyK'))-Number(pressed.has('KeyI'));
        const result = { x: (lookX+yaw*dt*320)*settings.keyboardLook, y: (lookY+pitch*dt*210)*settings.keyboardLook };
        lookX = lookY = 0;
        return result;
    }
    setSettings(defaults);
    update({});
    return {
        input,
        registerPanel(id, title, render, hidden = false) {
            if (builtIn.has(id))
                throw Error('Занятое имя экрана: ' + id);
            externalPanels.set(id, { title, render, hidden });
            if (panel === 'phone' || panel === 'pause')
                drawPanel();
        },
        refreshPanel: drawPanel,
        getPanel: () => panel,
        update,
        notify,
        open,
        close,
        isPaused: () => panel !== null,
        takeLook,
        setWaypoint,
        chooseGraphicsReport(report) {
            quarterReport='<h3>Контрольный квартал</h3><p>'+report.fps+' кадров/с · '+escape(report.renderer)+' · медленнее всего: '+escape(report.worst)+'</p><div class="k-list">'+
                panelRow('graphics-set','camera','Чёткие вывески','','detail')+
                panelRow('graphics-set','road','Плавное движение','','smooth')+'</div>';
            open('laptop');
        },
        addMapPin(x,z,label) {
            if(!Number.isFinite(x)||!Number.isFinite(z)||!label) return;
            const text=String(label).trim().slice(0,64);
            if(settings.marks.some(p=>p.label===text && Math.hypot(p.x-x,p.z-z)<.5)) return;
            changed({marks:[...settings.marks,{id:'pin-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),kind:'place',x,z,label:text}]});
        },
        focusDestination(point) {
            if (panel !== 'map' || view.inside)
                return;
            focusIndex = (0, ui_map_js_1.atlasPlaces)(atlasState()).findIndex(p => p.x === point.x && p.z === point.z);
            atlasPick = { x: point.x, z: point.z, label: point.label };
            atlasCenter = { x: point.x, z: point.z };
            atlasZoom = ui_map_js_1.atlasDistrictZoom;
            drawPanel();
        },
        clearRoute(point) {
            if (navEnd && (point === undefined || point && navEnd.x === point.x && navEnd.z === point.z)) {
                navEnd = null;
                updateRoute();
            }
        },
        setOffline,
        setSettings,
        settings,
        buzzImpact,
    };
}
