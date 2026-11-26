"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayPanel = void 0;
exports.createReplayView = createReplayView;
const T = require("../engine/three.module.min.js");
const models_js_1 = require("./models.js");
const human_kits_js_1 = require("./human-kits.js");
const camera_volume_js_1 = require("./camera-volume.js");
const vehicle_view_js_1 = require("./vehicle-view.js");
const world_layout_js_1 = require("./world-layout.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const replay_js_1 = require("./replay.js");
const lensNames = { cabin: 'Салон', street: 'Обочина', above: 'Сверху' };
const boarding = require("./vehicle-boarding.js");
const actorRole = (r) => r === 'walker' ? 'resident' : r;
function carState(car) {
    const state = { ...car, wheel: 0, vx: 0, vz: 0, auto: false, lane: 0, s: 0 };
    if (car.wear)
        Object.assign((0, vehicle_road_js_1.equipment)(state), car.wear);
    return state;
}
const replayPanel = (seconds, archive) => `<div class="k-tour">
  <p>Запись улицы идёт автоматически. Откройте недавнюю поездку, чтобы выбрать ракурс или сделать кадр.</p>
  <button class="k-job-btn is-main" data-action="replay-open" ${seconds < .8 ? 'disabled' : ''}>Последние ${Math.min(30, Math.ceil(seconds))} с</button>
  <button class="k-job-btn" data-action="replay-load" ${archive ? '' : 'disabled'}>Сохранённый повтор</button>
  ${seconds < .8 ? '<p>Повтор станет доступен после начала движения на улице.</p>' : ''}
</div>`;
exports.replayPanel = replayPanel;
const style = `
.k-replayer{position:fixed;z-index:60;left:max(env(safe-area-inset-left),14px);right:max(env(safe-area-inset-right),14px);bottom:max(env(safe-area-inset-bottom),14px);padding:12px 14px;margin:auto;max-width:850px;color:#e7edf3;background:#111b25ee;border:1px solid #728a9c;border-radius:12px;font:600 14px K77Body,system-ui;box-shadow:0 10px 30px #0009}
.k-replayer[hidden]{display:none}.k-replay-top,.k-replay-buttons{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.k-replay-top{justify-content:space-between;margin-bottom:7px}.k-replay-top output{font-variant-numeric:tabular-nums;color:#ffc381}.k-replayer input{width:100%;accent-color:#f3ad69;margin:6px 0 9px}
.k-replayer button{background:#263d4f;color:#edf3f6;border:1px solid #6c8191;border-radius:6px;padding:7px 10px;font:inherit;min-height:38px}.k-replayer button[aria-pressed=true]{color:#151e27;background:#ffc381;border-color:#ffc381}.k-replayer button:disabled{opacity:.45}.k-replay-status{margin:0 0 0 auto;color:#e2cabc;font-size:12px}
.k-replay-time{position:relative}.k-replay-ticks{position:absolute;pointer-events:none;inset:auto 7px 4px;height:3px}.k-replay-ticks span{position:absolute;height:4px;width:3px;background:#ff9c67;border-radius:1px;transform:translateX(-50%)}.k-replay-ticks .is-heavy{height:6px;bottom:0;background:#ff6959}
.k-replay-marks{display:flex;align-items:center;gap:6px;overflow-x:auto;white-space:nowrap;margin:0 0 8px;padding:2px;color:#e2cabc;scrollbar-width:thin}.k-replay-marks[hidden]{display:none}.k-replay-marks button{background:#352f34;border-color:#986c61;font-variant-numeric:tabular-nums}.k-replay-marks button.is-heavy{border-color:#de8770}
@media(max-height:440px){.k-replayer{padding:8px 10px}.k-replayer input{margin:1px 0 3px}.k-replayer button{padding:4px 8px;min-height:32px}.k-replay-top{margin-bottom:0}}
`;
function createReplayView(scene, events) {
    const stage = new T.Group(), actor = (0, models_js_1.createPerson)('hero'), camera = new T.PerspectiveCamera();
    stage.name = 'Повтор поездки';
    stage.add(actor.root);
    const cars = new Map();
    const people = new Map();
    const solid = (new T.Vector3()), eye = new T.Vector3(), view = new T.Vector3();
    const node = document.createElement('aside'), css = document.createElement('style');
    css.textContent = style;
    document.head.append(css);
    node.className = 'k-replayer';
    node.hidden = true;
    node.setAttribute('aria-label', 'Режиссёр повтора');
    node.innerHTML = `<div class="k-replay-top"><strong>Повтор поездки</strong><output></output></div>
  <div class="k-replay-time"><input type="range" min="0" max="30" step=".05" value="0" aria-label="Позиция в повторе">
    <div class="k-replay-ticks" aria-hidden="true"></div></div>
  <div class="k-replay-marks" role="group" aria-label="Столкновения в повторе" hidden><span>Удары</span></div>
  <div class="k-replay-buttons"><button type="button" data-replay="play">Пауза</button>${Object.entries(lensNames).map(([id, label]) => `<button type="button" data-replay="${id}" aria-pressed="false">${label}</button>`).join('')}
  <button type="button" data-replay="speed" aria-pressed="false">½ скорости</button><button type="button" data-replay="photo">Снять кадр</button>
  <button type="button" data-replay="save">Сохранить повтор</button><button type="button" data-replay="leave">К игре</button><p role="status" class="k-replay-status"></p></div>`;
    document.body.append(node);
    const seek = node.querySelector('input'), output = node.querySelector('output'), status = node.querySelector('.k-replay-status');
    const marks = node.querySelector('.k-replay-marks'), ticks = node.querySelector('.k-replay-ticks');
    const button = (id) => node.querySelector(`[data-replay="${id}"]`);
    let clip = null, seconds = 0, lens = 'street', slow = false, paused = false, requestPhoto = false, revision = 0;
    let selectedImpact, activeMark = null;
    function timeLabel(n) { return '0:' + Math.floor(n).toString().padStart(2, '0'); }
    function clearImpact() {
        selectedImpact = undefined;
        activeMark?.setAttribute('aria-pressed', 'false');
        activeMark = null;
    }
    function showImpacts(current) {
        marks.replaceChildren(document.createTextNode('Удары'));
        ticks.replaceChildren();
        marks.hidden = !current.impacts?.length;
        marks.scrollLeft = 0;
        const duration = (0, replay_js_1.replayDuration)(current);
        current.impacts?.forEach((mark, i) => {
            const when = (0, replay_js_1.impactSecond)(current, mark), heavy = mark.strength >= .55;
            const tick = document.createElement('span');
            tick.style.left = String(100 * when / duration) + '%';
            const item = document.createElement('button');
            item.type = 'button';
            item.dataset.replay = 'impact';
            item.dataset.mark = String(i);
            item.textContent = '0:' + when.toFixed(1).padStart(4, '0').replace('.', ',');
            item.setAttribute('aria-label', (heavy ? 'Сильный удар' : 'Столкновение') + ' · ' + item.textContent);
            item.setAttribute('aria-pressed', 'false');
            if (heavy) {
                tick.className = 'is-heavy';
                item.className = 'is-heavy';
            }
            ticks.append(tick);
            marks.append(item);
        });
    }
    function controls(driving) {
        seek.value = String(seconds);
        output.textContent = timeLabel(seconds) + ' / ' + timeLabel((0, replay_js_1.replayDuration)(clip));
        button('play').textContent = paused ? 'Смотреть' : 'Пауза';
        for (const id of Object.keys(lensNames))
            button(id).setAttribute('aria-pressed', String(id === lens));
        button('cabin').disabled = !driving;
        button('speed').setAttribute('aria-pressed', String(slow));
    }
    seek.addEventListener('input', () => { seconds = Number(seek.value); paused = true; clearImpact(); });
    node.addEventListener('click', e => {
        if (!clip)
            return;
        const target = e.target.closest('button'), id = target?.dataset.replay;
        switch (id) {
            case 'play':
                if (paused && seconds >= (0, replay_js_1.replayDuration)(clip) - .03)
                    seconds = 0;
                paused = !paused;
                break;
            case 'street':
            case 'cabin':
            case 'above':
                lens = id;
                break;
            case 'impact': {
                const mark = clip.impacts?.[Number(target?.dataset.mark)];
                if (!mark || !target)
                    break;
                clearImpact();
                selectedImpact = mark;
                activeMark = target;
                target.setAttribute('aria-pressed', 'true');
                seconds = (0, replay_js_1.impactSecond)(clip, mark);
                lens = 'street';
                paused = true;
                break;
            }
            case 'speed':
                slow = !slow;
                break;
            case 'photo':
                requestPhoto = true;
                break;
            case 'save': {
                const run = revision;
                target.disabled = true;
                void events.save(clip).then(() => {
                    if (run === revision)
                        status.textContent = 'Повтор сохранён в этом профиле.';
                }, () => {
                    if (run === revision)
                        status.textContent = 'Хранилище не приняло запись.';
                })
                    .finally(() => {
                    if (run === revision)
                        target.disabled = false;
                });
                break;
            }
            case 'leave':
                events.leave();
                break;
        }
    });
    document.addEventListener('keydown', e => {
        if (clip && e.key === 'Escape') {
            e.preventDefault();
            e.stopImmediatePropagation();
            events.leave();
        }
    }, true);
    function show(current) {
        clip = current;
        seconds = 0;
        paused = slow = requestPhoto = false;
        lens = 'street';
        revision++;
        status.textContent = '';
        actor.resetMotion();
        seek.max = String((0, replay_js_1.replayDuration)(current));
        button('save').disabled = false;
        clearImpact();
        showImpacts(current);
        scene.add(stage);
        node.hidden = false;
        controls(!!current.frames[0].driven);
        button('play').focus({ preventScroll: true });
    }
    function hide() {
        clip = null;
        revision++;
        stage.removeFromParent();
        node.hidden = true;
        clearImpact();
        for (const { model } of cars.values())
            model.dispose();
        for (const model of people.values())
            model.root.removeFromParent();
        cars.clear();
        people.clear();
    }
    function orbit(from, wanted, solids, id) {
        view.subVectors(wanted, from);
        const range = view.length();
        view.normalize();
        return (0, camera_volume_js_1.cameraClearance)(from, view, range, .15, solids, id);
    }
    return { get active() { return !!clip; }, show, hide, frame(dt, reference) {
            if (!clip)
                return null;
            const duration = (0, replay_js_1.replayDuration)(clip);
            const advance = paused ? 0 : Math.min(dt, .12) * (slow ? .5 : 1);
            seconds = Math.min(duration, seconds + advance);
            if (seconds >= duration)
                paused = true;
            const f = (0, replay_js_1.replayAt)(clip, seconds), follower = f.cars.find(c => c.id === f.driven);
            const cabin = lens === 'cabin' && !!follower;
            if (selectedImpact && Math.abs(f.time - selectedImpact.time) > 2.25)
                clearImpact();
            const impact = lens === 'street' ? selectedImpact : undefined;
            const impactCar = impact ? f.cars.find(c => c.id === impact.carId) : undefined;
            const impactOther = impact?.otherId ? f.cars.find(c => c.id === impact.otherId) : undefined;
            const focus = impact ? { x: impact.x, y: impact.y ?? (0, world_layout_js_1.groundHeight)(impact.x, impact.z), z: impact.z,
                speed: impactCar?.speed ?? 0, yaw: impactCar?.yaw ?? impactOther?.yaw ?? f.hero.yaw } : follower ?? f.hero;
            const targetId = impactCar?.id ?? f.driven ?? undefined;
            const solids = f.cars.map(carState);
            camera.aspect = reference.aspect;
            camera.fov = cabin ? 64 : reference.fov;
            camera.near = .09;
            camera.far = reference.far;
            camera.updateProjectionMatrix();
            if (cabin)
                (0, vehicle_view_js_1.applyCockpitCamera)(camera, carState(follower), follower.yaw);
            else {
                const lookHeight = impact ? (impact.y === undefined ? .72 : .24) : follower ? 1.15 : 1.4;
                solid.set(focus.x, focus.y + lookHeight, focus.z);
                const anchor = impact || lens === 'above' ? focus : (0, replay_js_1.replayAt)(clip, Math.floor(seconds / 4) * 4 + 2).hero;
                const co = Math.cos(anchor.yaw), si = Math.sin(anchor.yaw);
                const up = lens === 'above' ? 12.8 : impact ? 3.25 : 2.65, side = lens === 'above' ? 6.2 : impact ? 6.9 : 5.9, depth = lens === 'above' ? 8 : impact ? 3.0 : 4.5;
                const shotObstacles = impact ? solids.filter(car => car.id !== impact.carId && car.id !== impact.otherId) : solids;
                let length = orbit(solid, eye.set(anchor.x + co * side + si * depth, Math.max(anchor.y, (0, world_layout_js_1.groundHeight)(anchor.x + co * side, anchor.z - si * side)) + up, anchor.z - si * side + co * depth), shotObstacles, targetId);
                const best = view.clone();
                const other = orbit(solid, eye.set(anchor.x - co * side + si * depth, Math.max(anchor.y, (0, world_layout_js_1.groundHeight)(anchor.x - co * side, anchor.z + si * side)) + up, anchor.z + si * side + co * depth), shotObstacles, targetId);
                if (other > length * 1.24 && length < 4.5)
                    length = other;
                else
                    view.copy(best);
                camera.position.copy(solid).addScaledVector(view, Math.max(.34, length));
                camera.lookAt(solid);
                camera.updateMatrixWorld();
            }
            for (const record of cars.values())
                record.model.root.visible = false;
            for (const model of people.values())
                model.root.visible = false;
            const transfer = f.transfer;
            const transitionCar = transfer && f.cars.find(c => c.id === transfer.carId);
            if (transitionCar)
                boarding.cycle(transfer, transfer.phase);
            for (const [i, c] of f.cars.entries()) {
                let record = cars.get(c.id);
                if (!record) {
                    record = { model: (0, models_js_1.createVehicle)(c.police ? 'patrol' : c.kind, c.color), color: c.color };
                    cars.set(c.id, record);
                    stage.add(record.model.root);
                }
                if (c.color !== record.color) {
                    record.color = c.color;
                    record.model.setColor(c.color);
                }
                const model = record.model, driving = c.id === f.driven;
                model.root.visible = true;
                model.root.position.set(c.x, c.y, c.z);
                model.root.rotation.y = c.yaw;
                model.update(advance, c.speed, c.steer, c.lights, c.braking, 1 - c.health / 100, { cameraDistance: camera.position.distanceTo(model.root.position),
                    doorSide: c === transitionCar ? transfer.side : undefined, doorOpen: c === transitionCar ? transfer.doorOpen : 0,
                    npcDriver: !driving && c !== transitionCar && Math.abs(c.speed) > .2, occupied: driving && c !== transitionCar, cockpit: cabin && driving, patrolClock: f.time, patrolActive: c.active,
                    indicator: c.indicator, systems: solids[i].systems, scrapes: c.scrapes, impactLean: c.lean, snapshotPose: paused });
            }
            actor.root.visible = !f.driven;
            actor.root.position.set(f.hero.x, f.hero.y, f.hero.z);
            actor.root.rotation.y = f.hero.yaw;
            if (actor.root.visible)
                actor.update(advance, f.hero.speed, !transitionCar && f.hero.y > (0, world_layout_js_1.groundHeight)(f.hero.x, f.hero.z) + .27, boarding.actorPose(transitionCar, transfer, world_layout_js_1.groundHeight));
            for (const p of f.people) {
                let model = people.get(p.id);
                if (!model) {
                    model = (0, models_js_1.createPerson)(actorRole(p.role), (0, human_kits_js_1.streetWardrobe)(p.id, 0));
                    people.set(p.id, model);
                    stage.add(model.root);
                }
                model.root.visible = true;
                model.root.position.set(p.x, p.y, p.z);
                model.root.rotation.y = p.yaw;
                model.update(advance, p.speed, false, {});
            }
            controls(!!follower);
            return { frame: f, camera, cars: solids, focus };
        }, afterDraw() {
            if (requestPhoto) {
                requestPhoto = false;
                events.photo();
                status.textContent = 'Кадр подготовлен.';
            }
        } };
}
