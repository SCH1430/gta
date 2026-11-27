"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNightStoryVisuals = createNightStoryVisuals;
exports.createFinaleRoomActors = createFinaleRoomActors;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const model_people_js_1 = require("./model-people.js");
const story_city_catalog_js_1 = require("./story-city-catalog.js");
const story_night_layout_js_1 = require("./story-night-layout.js");
const story_night_js_1 = require("./story-night.js");
const near = (f, x, z, d) => f.space === 'street' && Math.hypot(x - f.x, z - f.z) < d;
function signalPanel(w, h) {
    const materials = new Map();
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: '#3a5053' }));
    return { mesh, choose(kind) {
            let material = materials.get(kind);
            if (!material) {
                const notice = (0, story_night_js_1.harbourNotice)(kind), dock = kind === 'dock';
                material = new T.MeshBasicMaterial({ map: (0, world_textures_js_1.signTexture)(notice.title, notice.subtitle, dock ? '#f7dfa9' : '#c9e6e5', dock ? '#504e43' : '#325962', w / h) });
                materials.set(kind, material);
            }
            mesh.material = material;
        } };
}
function receiver(parent, x, y, z, stand = false) {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    const b = new world_batch_js_1.Batches(g);
    b.box(0, .14, 0, .57, .28, .36, '#5d675d');
    b.box(0, .11, .184, .51, .175, .022, '#384749');
    b.box(-.135, .12, .203, .216, .088, .021, '#455f54');
    b.box(.168, .09, .202, .069, .075, .036, '#b39a73');
    b.lamp(-.132, .124, .220, .135, .049, .008, '#b2d393');
    b.lamp(.087, .163, .211, .046, .034, .013, '#e6a870');
    for (const a of [.116, .155, .193])
        b.box(.25, a, .186, .029, .016, .019, '#708084');
    b.beam(-.215, .21, -.095, -.29, .93, -.095, .031, '#a2a49a');
    b.box(0, .298, -.016, .30, .041, .038, '#434644');
    if (stand) {
        for (const side of [-1, 1])
            b.box(side * .265, -y * .50, 0, .061, y, .091, '#526063');
        b.box(0, -.019, 0, .66, .05, .44, '#697874');
    }
    b.flush();
    return g;
}
function harbourBoards(parent) {
    const market = signalPanel(1.10, .29), dock = signalPanel(1.55, .44);
    market.mesh.position.set(21.50, 1.2, 10.292);
    const p = story_city_catalog_js_1.cityPlaces.arcHandoff, x = p.x + .90, z = p.z - .89, base = (0, world_layout_js_1.groundHeight)(x, z);
    dock.mesh.position.set(x, base + 1.42, z + .06);
    const stand = new T.Group();
    stand.name = 'Доска Сухого дока';
    const b = new world_batch_js_1.Batches(stand);
    for (const offset of [-.72, .72])
        b.box(x + offset, base + .81, z, .075, 1.60, .075, '#596469');
    b.box(x, base + 1.41, z, 1.66, .54, .11, '#413f3b');
    b.box(x, base + 1.70, z, 1.72, .085, .23, '#8e8f80');
    b.flush();
    market.mesh.visible = false;
    stand.visible = false;
    stand.add(dock.mesh);
    parent.add(market.mesh, stand);
    let selected = null;
    return (jobs, f) => {
        const decision = jobs.harbourDecision;
        market.mesh.visible = !!decision && near(f, 21.5, 11.5, 56);
        stand.visible = !!decision && near(f, x, z, 55);
        if (!decision || selected === decision)
            return;
        selected = decision;
        market.choose(decision);
        dock.choose(decision);
    };
}
function createNightStoryVisuals(scene) {
    const group = new T.Group();
    group.name = 'Ночная связь';
    group.userData.dynamicScenery = true;
    scene.add(group);
    const updateBoards = harbourBoards(group);
    const material = new T.MeshBasicMaterial({ color: '#97dbf1', transparent: true, opacity: .57, depthWrite: false, side: T.DoubleSide });
    const ring = new T.Mesh(new T.RingGeometry(.87, 1, 40), material);
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    group.add(ring);
    const board = story_night_layout_js_1.finaleNightPlaces.board, dock = story_night_layout_js_1.finaleNightPlaces.dock;
    const tx = receiver(group, 22.60, .96, 10.39, true);
    const spare = receiver(group, dock.x - .72, .57, dock.z - .74, true);
    tx.visible = false;
    spare.visible = false;
    let contact;
    return (jobs, f) => {
        updateBoards(jobs, f);
        const active = jobs.active, night = active?.id === story_night_layout_js_1.chaseNightId;
        const actor = night && active.stage === 4 ? (active.marks.includes('walk') ? story_night_layout_js_1.chaseNightPlaces.shelter : story_night_layout_js_1.chaseNightPlaces.road) : null;
        const docContact = jobs.harbourDecision === 'dock' && active?.id === story_night_layout_js_1.finaleNightId && active.stage === 3 ? dock : null;
        const waypoint = night ? jobs.target(f) : null;
        ring.visible = !!waypoint && near(f, waypoint.x, waypoint.z, 45);
        if (waypoint && ring.visible) {
            const high = waypoint.label === story_night_layout_js_1.chaseNightPlaces.stairs.name || waypoint.label === story_night_layout_js_1.chaseNightPlaces.hiding.name;
            const radius = high ? .78 : active.stage === 2 ? 2.35 : 1.55;
            ring.position.set(waypoint.x, high ? 2.42 : (0, world_layout_js_1.groundHeight)(waypoint.x, waypoint.z) + .04, waypoint.z);
            ring.scale.set(radius, radius, 1);
            material.color.set(active.stage === 0 ? '#edbc7d' : '#a5dfec');
        }
        if (contact)
            contact.root.visible = false;
        const point = actor ?? docContact;
        if (point && near(f, point.x, point.z, 45)) {
            if (!contact) {
                contact = (0, model_people_js_1.createPerson)('courier');
                group.add(contact.root);
            }
            const x = point.x - .85, z = point.z - .66;
            contact.root.position.set(x, (0, world_layout_js_1.groundHeight)(x, z), z);
            contact.root.rotation.y = Math.atan2(x - f.x, z - f.z);
            contact.update(f.dt ?? 0, 0, false, { glance: .18 });
            contact.root.visible = true;
        }
        tx.visible = active?.id === story_night_layout_js_1.finaleNightId && active.stage >= 3 && near(f, board.x, board.z, 55);
        spare.visible = !!docContact && near(f, dock.x, dock.z, 46);
    };
}
function createFinaleRoomActors(parent, room) {
    const p = room === 'workshop' ? story_night_layout_js_1.finaleNightPlaces.bench : story_night_layout_js_1.finaleNightPlaces.dispatch;
    const activeStage = room === 'workshop' ? 1 : 2;
    let actor, radio, coil;
    return (dt, stage = -1, haveCoil = false) => {
        const visible = stage === activeStage;
        if (visible && !actor) {
            actor = (0, model_people_js_1.createPerson)(room === 'workshop' ? 'vendor' : 'dispatcher');
            actor.root.position.set(p.x + .55, 0, p.z - .84);
            actor.root.rotation.y = Math.PI - .38;
            radio = receiver(parent, p.x - .65, .91, p.z - .80);
            parent.add(actor.root);
            if (room === 'workshop') {
                coil = new T.Mesh(new T.TorusGeometry(.12, .029, 7, 14), new T.MeshLambertMaterial({ color: '#b88d66' }));
                coil.position.set(story_night_layout_js_1.finaleNightPlaces.coil.x + .18, .89, story_night_layout_js_1.finaleNightPlaces.coil.z - .52);
                parent.add(coil);
            }
        }
        if (actor)
            actor.root.visible = visible;
        if (radio)
            radio.visible = visible;
        if (coil)
            coil.visible = visible && !haveCoil;
        if (visible)
            actor?.update(dt, 0, false, { conversation: true, glance: .16 });
    };
}
