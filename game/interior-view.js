"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extraInterior = extraInterior;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const house_layout_js_1 = require("./house-layout.js");
const interior_layout_js_1 = require("./interior-layout.js");
const interior_fixtures_js_1 = require("./interior-fixtures.js");
const interior_prints_js_1 = require("./interior-prints.js");
const interior_residents_js_1 = require("./interior-residents.js");
const model_people_js_1 = require("./model-people.js");
const world_railway_js_1 = require("./world-railway.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const service_interiors_js_1 = require("./service-interiors.js");
const story_night_view_js_1 = require("./story-night-view.js");
const box = new T.BoxGeometry(1, 1, 1);
function object(parent, x, y, z, w, h, d, color) {
    const material = new T.MeshBasicMaterial({ color }), m = new T.Mesh(box, material);
    m.scale.set(w, h, d);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
}
function cluster(parent, x, y, z, yaw = 0) {
    const group = new T.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    parent.add(group);
    return group;
}
function liftDoors(parent, x, y, z, yaw, stop) {
    const g = cluster(parent, x, y, z, yaw), b = new world_batch_js_1.Batches(g), p = new world_batch_js_1.Panels(g), sg = (0, interior_fixtures_js_1.letters)(p), width = 1.24;
    b.box(0, 1.11, 0, width + .16, 2.22, .039, '#3a4a4c');
    for (const s of [-1, 1]) {
        b.box(s * (width / 2 + .073), 1.14, .057, .115, 2.27, .143, '#7e8982');
        b.box(s * (width / 2 + .076), .96, .146, .036, .55, .016, '#adb19a');
    }
    b.box(0, 2.28, .06, width + .245, .14, .15, '#83928b');
    b.box(0, .025, .08, width + .15, .049, .23, '#9f9e88');
    const dir = stop === 'cab' ? -1 : 1;
    b.box(dir * .87, 1.18, .066, .16, .31, .078, '#a3a794');
    b.box(dir * .87, 1.17, .117, .095, .089, .035, '#c2b99c');
    b.lamp(dir * .87, 1.187, .141, .056, .036, .012, '#e4c08b');
    sg('ЛИФТ', stop === 'cab' ? 'КАБИНА' : 'КАНАЛЬНАЯ, 23', 0, 2.47, .074, .77, .24);
    const doors = [-1, 1].map(s => {
        const d = cluster(g, s * width / 4, 0, .04), db = new world_batch_js_1.Batches(d);
        db.box(0, 1.08, .012, width / 2 - .01, 2.14, .055, '#909c93');
        for (const yy of [.15, 1.13, 2.02])
            db.box(0, yy, .043, width / 2 - .045, .018, .014, '#b5b7a1');
        db.box(-s * .277, 1.07, .046, .018, 2.09, .017, '#64776f');
        db.flush();
        return d;
    });
    const light = object(g, 0, 2.26, .153, .18, .047, .023, '#f5b679');
    b.flush();
    p.flush();
    return ({ home }) => {
        const lift = home.lift, active = stop === 'cab' || stop === lift.car, op = active ? lift.open : 0;
        for (let i = 0; i < 2; i++) {
            const sign = i === 0 ? -1 : 1;
            doors[i].scale.x = Math.max(.04, 1 - op);
            doors[i].position.x = sign * width / 4 * (1 + op);
        }
        light.material.color.set(lift.phase === 'moving' ? '#cf9671' : active ? '#cce1a3' : '#596e6c');
    };
}
function windowBay(parent, p, kind) {
    const home = kind === 'yard', x = home ? 9.47 : 89.802, y = home ? house_layout_js_1.houseUpper + 1.89 : 1.70, z = home ? 6.83 : -2.12, w = home ? 2.20 : 2.87, h = home ? 1.60 : 1.36;
    const angle = home ? Math.PI : Math.PI / 2;
    p.place('survey-view-' + kind, () => (0, interior_prints_js_1.cityWindow)(kind), x, y, z, w, h, angle);
    const g = cluster(parent, x + Math.sin(angle) * .008, y, z + Math.cos(angle) * .008, angle);
    const lights = [];
    function carShadow() {
        const g2 = cluster(g, 0, 0, 0);
        const body = object(g2, 0, 0, 0, 1, .23, .1, '#718c8b'), glass = object(g2, -.07, .15, .004, .58, .19, .09, '#597582');
        const lamp = object(g2, .40, .034, .069, .12, .067, .018, '#ecdba9'), rear = object(g2, -.42, .026, .07, .09, .045, .018, '#b96b5f');
        return { g: g2, body, glass, lamp, rear };
    }
    const frame = new world_batch_js_1.Batches(g);
    if (!home) {
        for (const s of [-1, 1]) {
            frame.box(s * w / 2, 0, .028, .06, h + .12, .06, '#8b9e96');
            frame.box(0, s * h / 2, .028, w + .12, .06, .06, '#a0ac9e');
        }
        frame.box(0, 0, .035, .049, h, .062, '#a0ac9e');
        frame.flush();
    }
    return ({ cars, tram }) => {
        const rail = (0, world_railway_js_1.linePose)(tram), vehicles = home ? cars : [...cars, ...(rail.visible ? [{ ...rail, y: 0, color: '#b88d60', kind: 'tram', lights: true }] : [])];
        while (lights.length < vehicles.length)
            lights.push(carShadow());
        lights.forEach((a, i) => {
            const v = vehicles[i];
            if (!v) {
                a.g.visible = false;
                return;
            }
            const chassis = v.kind === 'tram' ? null : vehicle_cabin_js_1.specs[v.kind];
            const q = (0, interior_prints_js_1.projectVista)(kind, v.x, v.y + .54, v.z), length = chassis ? chassis.rear - chassis.front : 14.3, width = chassis ? chassis.w * 2 : 2.46;
            const e = home ? Math.PI : Math.PI * .55, dw = (Math.abs(Math.sin(v.yaw - e)) * length + Math.abs(Math.cos(v.yaw - e)) * width) * .48 / q.depth;
            a.g.visible = q.depth > 1.9 && q.depth < 125 && q.u > dw * .5 && q.u < 1 - dw * .5 && q.v > .11 && q.v < .94;
            if (!a.g.visible)
                return;
            a.g.position.set((q.u - .5) * w, (.5 - q.v) * h, .005 + i * .000013);
            a.g.scale.set(dw * w, Math.min(h * .26, (chassis ? chassis.roof * 1.34 : 4.10) / q.depth * h * 2.8), .018);
            a.body.material.color.set(v.color);
            a.lamp.visible = v.lights;
            a.rear.visible = v.lights;
            a.glass.visible = true;
        });
    };
}
function dwelling(g, b, p, steps) {
    const sg = (0, interior_fixtures_js_1.letters)(p), f = house_layout_js_1.houseUpper;
    b.box(-3.136, 1.93, 4.76, .096, .78, 1.19, '#897e66');
    p.place('old-map', interior_prints_js_1.surveyPrint, -3.077, 1.93, 4.76, 1.12, .71, Math.PI / 2);
    sg('В ПОДВАЛ', 'ТЕПЛОВОЙ УЗЕЛ', .64, .96, 6.939, .82, .30, Math.PI);
    steps.push(liftDoors(g, -2.39, 0, 6.895, Math.PI, 'foyer'), liftDoors(g, -2.34, f, -6.76, 0, 'landing'));
    const nook = cluster(g, .87, f, -6.75);
    nook.rotation.y = 0;
    const db = new world_batch_js_1.Batches(nook);
    db.box(0, 1.09, 0, 1.12, 2.18, .074, '#68796d');
    db.box(0, 1.42, .055, .85, .90, .028, '#8e9580');
    db.box(-.39, 1.01, .083, .13, .042, .047, '#bda884');
    db.flush();
    sg('12', 'КВАРТИРА', .88, f + 1.76, -6.64, .29, .27);
    sg('НА КРОВЛЮ', 'СЛУЖЕБНАЯ ЛЕСТНИЦА', -.43, f + 2.25, -6.70, 1.25, .30);
    steps.push(({ home }) => { nook.rotation.y = -home.privacy * .38; });
    const keeps = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => {
        const x = 4.07 + (k % 5) * .21, z = 2.82 + Math.floor(k / 5) * .185;
        const q = cluster(g, x, f + .48, z, k * .43), kb = new world_batch_js_1.Batches(q);
        if (k % 3 === 0) {
            kb.box(0, .012, 0, .19, .019, .135, '#cfc5a8');
            kb.box(0, .023, 0, .16, .012, .086, '#849b9f');
        }
        else if (k % 3 === 1) {
            kb.box(0, .023, 0, .16, .046, .105, '#81887a');
            for (const s of [-1, 1])
                kb.cyl(s * .042, .047, 0, .034, .006, '#dbd3b4');
        }
        else {
            kb.cyl(0, .022, 0, .102, .043, '#b39970');
            kb.cyl(0, .049, 0, .076, .014, '#d2ba86');
        }
        kb.flush();
        return q;
    });
    steps.push(({ home, effects, mission }) => { home.setMementos(mission, effects.souvenirs ?? []); const n = Math.min(keeps.length, Math.max(0, mission) + (effects.souvenirs?.length ?? 0)); keeps.forEach((q, i) => q.visible = i < n); });
    steps.push(windowBay(g, p, 'yard'));
}
function finishShell(g, p, zone) {
    if (zone === 'stairs')
        return;
    const a = interior_layout_js_1.annexes[zone], r = a.bounds, w = r.maxX - r.minX, d = r.maxZ - r.minZ, x = (r.minX + r.maxX) / 2, z = (r.minZ + r.maxZ) / 2;
    const floor = new T.Mesh(new T.PlaneGeometry(w - .17, d - .17), new T.MeshBasicMaterial({ map: (0, interior_prints_js_1.utilityFinish)(zone, 'floor', 1492) }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(x, a.floor + .016, z);
    g.add(floor);
    if (zone === 'roof')
        return;
    const y = a.floor + a.ceiling / 2;
    for (const [i, [xx, zz, angle, span]] of [[x, r.minZ + .097, 0, w], [r.maxX - .097, z, -Math.PI / 2, d], [x, r.maxZ - .097, Math.PI, w], [r.minX + .097, z, Math.PI / 2, d]].entries()) {
        p.place('utility-wall-' + i, () => (0, interior_prints_js_1.utilityFinish)(zone, 'wall', 259 + i), xx, y, zz, span - .16, a.ceiling - .044, angle);
    }
}
function makeZone(scene, zone) {
    if (zone === 'campus') {
        const view = require("./campus-view.js").createCampus(scene);
        scene.userData.campusView = view;
        return { g: view.root, steps: [] };
    }
    const g = new T.Group(), b = new world_batch_js_1.Batches(g), p = new world_batch_js_1.Panels(g), sg = (0, interior_fixtures_js_1.letters)(p), steps = [];
    scene.add(g);
    g.name = 'Помещение · ' + zone;
    if (zone === 'house')
        dwelling(g, b, p, steps);
    else {
        (0, interior_fixtures_js_1.shell)(zone, b, sg);
        finishShell(g, p, zone);
        if ((0, service_interiors_js_1.isServiceRoom)(zone)) {
            (0, service_interiors_js_1.addServiceInterior)(b, sg, zone);
            if (zone === 'hydro') {
                const main = object(g, 207.78, 1.64, -3.25, .34, .067, .045, '#a5d5e1');
                steps.push(({ home }) => { main.material.color.set(home.hydroPower ? '#a5d5e1' : '#e2a466'); });
            }
        }
        if (zone === 'lift')
            steps.push(liftDoors(g, -65, 0, -1.16, 0, 'cab'));
        if (zone === 'roof')
            steps.push(liftDoors(g, -92, interior_layout_js_1.annexes.roof.floor, 5.15, Math.PI, 'roof'));
        if (zone === 'basement') {
            (0, interior_fixtures_js_1.basement)(b, sg);
            steps.push(liftDoors(g, 36, -2.75, 3.89, Math.PI, 'basement'));
            const led = object(g, 40.733, -1.74, .16, .032, .070, .09, '#cd9467');
            steps.push(({ effects }) => { led.material.color.set(effects.heatRepaired ? '#b4e2a4' : '#d8965d'); });
        }
        if (zone === 'workshop') {
            (0, interior_fixtures_js_1.workshop)(b, sg);
            const person = [(0, model_people_js_1.createPerson)('resident', 7), (0, model_people_js_1.createPerson)('resident', 13)];
            const finaleActors = (0, story_night_view_js_1.createFinaleRoomActors)(g, 'workshop');
            for (const n of person)
                g.add(n.root);
            const led = object(g, 67.76, 1.51, -3.24, .31, .036, .18, '#e2d3a1'), dial = object(g, 67.47, 1.20, -3.410, .062, .066, .032, '#7d967f');
            const receiver = cluster(g, 63.85, .90, -3.72), rb = new world_batch_js_1.Batches(receiver);
            rb.box(0, .12, 0, .40, .24, .17, '#a38064');
            rb.box(0, .15, .097, .29, .11, .012, '#b9b294');
            rb.beam(.14, .20, 0, .25, .5, .052, .014, '#aaaca1');
            rb.flush();
            steps.push(({ home, dt, effects }) => {
                finaleActors(dt, effects.finaleStage, effects.finaleCoil);
                const pair = (0, interior_residents_js_1.doorwayPair)(home.indoorClock);
                pair.forEach((q, i) => { const n = person[i]; n.root.position.set(q.x, 0, q.z); const yaw = n.root.rotation.y; n.root.rotation.y += Math.atan2(Math.sin(q.yaw - yaw), Math.cos(q.yaw - yaw)) * (1 - Math.exp(-dt * 9)); n.update(dt, q.speed, false, { nod: q.nod, glance: q.glance, ground: () => 0 }); });
                led.material.color.set(effects.marketPower?.workshop ? '#ffc983' : '#929d90');
                dial.material.color.set(home.moduleTested ? '#a6eea2' : '#738679');
                receiver.visible = home.loan === 'none';
            });
        }
        if (zone === 'dispatch') {
            (0, interior_fixtures_js_1.dispatch)(b, p, sg);
            steps.push(windowBay(g, p, 'rail'));
            const finaleActors = (0, story_night_view_js_1.createFinaleRoomActors)(g, 'dispatch');
            steps.push(({ dt, effects }) => finaleActors(dt, effects.finaleStage));
            const led = object(g, 92.76, 1.81, -3.784, .095, .074, .052, '#f4cf85'), file = object(g, 98.62, 1.41, -3.035, .52, .094, .017, '#d0b486');
            steps.push(({ tram, effects }) => { led.position.x = 92.63 + ((0, world_railway_js_1.linePose)(tram).z + 105) / 131 * 2.43; file.visible = !!effects.recordFiled; });
        }
    }
    b.flush();
    p.flush();
    return { g, steps };
}
function extraInterior(scene, rooms) {
    const base = [];
    rooms.traverse(o => {
        if (o.isMesh)
            base.push(o);
    });
    const cache = new Map();
    let active;
    return (dt, home, cars, mission, elapsed, tram, effects = {}) => {
        const current = home.zone;
        const zone = current === 'street' ? 'house' : interior_layout_js_1.annexes[current]?.areas ? 'campus' : current;
        if (zone !== active) {
            if (active)
                cache.get(active).g.visible = false;
            if (!cache.has(zone))
                cache.set(zone, makeZone(scene, zone));
            cache.get(zone).g.visible = true;
            base.forEach(m => m.visible = zone === 'house');
            rooms.visible = zone === 'house';
            scene.background = new T.Color(zone === 'roof' ? '#94a4b1' : zone === 'basement' ? '#767b73' : '#777c79');
            scene.userData.interiorZone = zone;
            active = zone;
        }
        const f = { dt, home, cars, mission, elapsed, tram, effects };
        for (const step of cache.get(zone).steps)
            step(f);
    };
}
