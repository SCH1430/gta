'use strict';

const T = require('../engine/three.module.min.js');
const { Batches, Panels } = require('./world-batch.js');
const { createPerson } = require('./model-people.js');
const { groundHeight } = require('./world-layout.js');
const { signTexture } = require('./world-textures.js');
const { river, metal } = require('./venue-layout.js');

const exitWalk = 3.4;
const pace = 1.5;
const indoors = () => 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function walk(from, to, progress) {
    return { x: from.x + (to.x - from.x) * progress, z: from.z + (to.z - from.z) * progress,
        yaw: Math.atan2(from.x - to.x, from.z - to.z), speed: pace };
}

function passengerPosition(passenger, route, elapsed, index, inside) {
    const door = { x: river.centre, z: 3.65 };
    const waitingYaw = passenger.x < river.centre ? -Math.PI / 2 : Math.PI / 2;
    const travel = route ? Math.max(0, elapsed - route.at) : 0;
    const counter = { x: river.dispatcher.x + (index-1)*.48, z: river.dispatcher.z + .86 };
    const exitAt = route?.cashier ? 5.8 : 0;
    if (inside) {
        if (!route) return { ...passenger, yaw: waitingYaw, speed: 0 };
        if (route.cashier && travel < 3) return walk(passenger, counter, travel / 3);
        if (travel < exitAt) return {...counter, yaw: 0, speed: 0};
        return travel < exitAt + exitWalk ? walk(route.cashier ? counter : passenger, door, (travel-exitAt) / exitWalk) : null;
    }
    if (!route || travel < exitAt + exitWalk) return null;
    const stop = river[route.mode];
    const waiting = { x: stop.x + (index - 1) * .52, z: stop.z + .55 + index * .09 };
    const sidewalk = { x: river.door.x, z: river.door.z + 1.7 };
    const first = distance(river.door, sidewalk) / pace;
    const second = distance(sidewalk, waiting) / pace;
    const outside = travel - exitWalk - exitAt;
    if (outside < first) return walk(river.door, sidewalk, outside / first);
    if (outside < first + second) return walk(sidewalk, waiting, (outside - first) / second);
    return outside < first + second + 24 ? { ...waiting, yaw: Math.PI, speed: 0 } : null;
}

function busStop(scene) {
    const root = new T.Group(), b = new Batches(root), panels = new Panels(root);
    const { x, z } = river.bus, y = groundHeight(x, z);
    b.box(x, y + 1.18, z, .085, 2.36, .085, '#58767c');
    b.box(x, y + 2.14, z, 1.05, .47, .060, '#314c59');
    panels.place('river-replacement-bus', () => signTexture('АВТОБУС 12', 'КАНАЛЬНАЯ · РЫНОК', '#e9e2bd', '#314c59', 2.44), x, y + 2.14, z + .035, .99, .405, 0);
    b.flush();
    panels.flush();
    root.name = 'Временная автобусная остановка';
    scene.add(root);
}

function makeDisplay(scene) {
    const display = new T.Mesh(new T.PlaneGeometry(3.85, .85), new T.MeshBasicMaterial());
    display.name = 'Табло рейсов';
    display.position.set(river.display.x, 2.24, river.display.z);
    const notice = new T.Mesh(new T.PlaneGeometry(.96,.62),new T.MeshBasicMaterial({
        map:signTexture('РЕЙС ЗАДЕРЖАН','ЗАМЕНА — АВТОБУС 12','#4c4e45','#dfd7b8',1.55)
    }));
    notice.position.set(2.56,-.38,.013);
    notice.rotation.z=-.035;
    display.add(notice);
    scene.add(display);
    return display;
}

function instrument(model, player) {
    const detail = new T.Group(), b = new Batches(detail);
    if (player === 'accordion') {
        detail.position.set(0, 1.12, -.27);
        b.box(0, 0, 0, .42, .30, .16, '#6b4d46');
        for (const side of [-1, 1]) b.box(side * .24, 0, 0, .11, .34, .18, '#452e2e');
        for (let i = -3; i <= 3; i++) b.box(i * .052, 0, -.085, .013, .294, .026, '#c49869');
        for (let i = -3; i <= 3; i++) b.box(-.24, i * .040, -.098, .052, .018, .021, '#e1d2a7');
    } else {
        detail.position.set(-.29, .60, -.24);
        b.piece('round', 0, 0, 0, .50, .13, .65, '#b27d47', 0, 0, Math.PI / 2);
        b.box(0, .47, -.026, .056, .68, .046, '#665040');
        b.box(0, -.27, -.036, .025, .27, .025, '#665040');
        for (let i = -1; i <= 1; i++) b.box(i * .012, .19, -.083, .005, .90, .006, '#d8c090');
    }
    b.flush();
    model.root.add(detail);
    return detail;
}

function musicStand(scene, position) {
    const root = new T.Group(), b = new Batches(root);
    root.position.set(position.x, 0, position.z);
    b.cyl(0, .51, 0, .051, 1.02, '#544544');
    b.box(0, .045, 0, .40, .075, .34, '#544544');
    b.piece('box', 0, 1.06, 0, .44, .31, .055, '#64534d', 0, 0, -.48);
    b.piece('box', 0, 1.08, .012, .33, .23, .012, '#e3ce9e', 0, 0, -.48);
    b.flush();
    scene.add(root);
    return root;
}

function createVenueView(scene) {
    const actors = new Map();
    let display, displayText, stands, hasBusStop = false;
    function person(id, target, position, c, style, options = {}) {
        if (!target || !position) return;
        let model = actors.get(id);
        if (!model) {
            model = createPerson(id === 'dispatcher' ? 'dispatcher' : 'resident', style);
            target.add(model.root);
            actors.set(id, model);
        }
        model.root.visible = true;
        model.root.position.set(position.x, position.y ?? 0, position.z);
        model.root.rotation.y = position.yaw ?? Math.PI;
        model.update(c.dt, position.speed ?? 0, false, options);
        return model;
    }
    return function update(c, station, text, rehearsal, placed) {
        for (const model of actors.values()) model.root.visible = false;
        if (display) display.visible = c.zone === river.door.zone;
        stands?.forEach(stand => stand.visible = false);
        if (c.zone === river.door.zone && c.indoorScene) {
            display ??= makeDisplay(c.indoorScene);
            display.children[0].visible = station.open;
            const signature = text.join('\n');
            if (displayText !== signature) {
                display.material.map?.dispose();
                display.material.map = signTexture(text[0], text[1], '#edc678', '#353933', 3.85 / .85);
                display.material.needsUpdate = true;
                displayText = signature;
            }
            person('dispatcher', c.indoorScene, river.dispatcher, c, 3, { ground: indoors, nod: .15 });
            if (station.open) river.passengers.forEach((p, i) => {
                const position = passengerPosition(p, station.routes[i], c.sim.elapsed, i, true);
                person('waiting-' + i, c.indoorScene, position, c, p.style, { ground: indoors });
            });
        }
        if (c.zone === 'street' && scene && distance(c.player, river.door) < 85) {
            if (!hasBusStop) { busStop(scene); hasBusStop = true; }
            river.passengers.forEach((p, i) => {
                const position = passengerPosition(p, station.routes[i], c.sim.elapsed, i, false);
                if (position) position.y = groundHeight(position.x, position.z);
                person('walking-' + i, scene, position, c, p.style, { ground: groundHeight });
            });
        }
        if (c.zone !== metal.door.zone || !c.indoorScene || !rehearsal) return;
        stands ??= metal.stands.map(p => musicStand(c.indoorScene, p));
        stands.forEach((stand, i) => stand.visible = placed[i]);
        person('leader', c.indoorScene, metal.leader, c, 12, { ground: indoors, conversation: true });
        metal.players.forEach((p, i) => {
            const model = person('musician-' + i, c.indoorScene, { ...p, y: .412 }, c, 17 + i, { ground: () => .412, nod: .24 + Math.sin(c.sim.elapsed * 4.9 + i) * .16 });
            model.instrument ??= instrument(model, i === 0 ? 'accordion' : 'bass');
            if (i === 0) model.instrument.scale.x = .98 + .10 * Math.sin(c.sim.elapsed * 3.2);
        });
    };
}

module.exports = { createVenueView, passengerPosition };
