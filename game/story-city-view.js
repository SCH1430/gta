"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCityStoryVisuals = createCityStoryVisuals;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const model_cars_js_1 = require("./model-cars.js");
const model_people_js_1 = require("./model-people.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const story_city_catalog_js_1 = require("./story-city-catalog.js");
const story_city_js_1 = require("./story-city.js");
const near = (f, x, z, range = 135) => f.space === 'street' && Math.hypot(f.x - x, f.z - z) < range;
const plate = (labels, key, title, subtitle, x, y, z, w, h, yaw, color = '#c7dee1') => labels.place(key, () => (0, world_textures_js_1.signTexture)(title, subtitle, color, '#344c55', w / h), x, y, z, w, h, yaw);
function noteBoxes(withLabels) {
    const root = new T.Group(), b = new world_batch_js_1.Batches(root), p = new world_batch_js_1.Panels(root);
    b.box(0, .27, 0, .48, .42, .36, '#505b57');
    b.box(0, .48, 0, .51, .05, .40, '#688b85');
    b.lamp(.15, .512, .08, .035, .017, .046, '#d5b574');
    if (withLabels)
        plate(p, 'archive', 'АРХИВ', 'ГОД / СМЕНА', 0, .31, -.188, .39, .21, Math.PI);
    b.flush();
    p.flush();
    return root;
}
function terminalPlates() {
    const root = new T.Group(), b = new world_batch_js_1.Batches(root), p = new world_batch_js_1.Panels(root);
    for (const [i, k] of ['cargoA', 'cargoB', 'cargoC'].entries()) {
        const at = story_city_catalog_js_1.cityPlaces[k], x = at.x + .83, z = at.z - .8;
        b.box(x, .47, z, .10, .94, .11, '#62695e');
        b.box(x, 1.01, z, .67, .35, .095, '#444c48');
        b.lamp(x, 1.20, z, .64, .045, .11, i === 1 ? '#85bedc' : '#b49875');
        plate(p, 'terminal-code-' + i, '№ ' + [208, 314, 407][i], i === 1 ? 'СИНЯЯ ЛИНИЯ' : 'ГРУЗОВАЯ СМЕНА', x, 1.02, z + .050, .59, .30, 0);
    }
    b.flush();
    p.flush();
    return root;
}
function spareTram() {
    const root = new T.Group(), b = new world_batch_js_1.Batches(root), p = new world_batch_js_1.Panels(root);
    const x = 120.9, z = 14.8;
    const at = (0, world_layout_js_1.groundHeight)(x, z);
    b.box(x, at + .71, z, 2.25, .30, 6.65, '#4d5151');
    b.box(x, at + 1.20, z, 2.31, .77, 6.53, '#89594a');
    b.box(x, at + 1.83, z, 2.23, .72, 6.55, '#c6c6ad');
    b.box(x, at + 2.32, z, 2.28, .25, 6.65, '#a9bdbc');
    b.box(x, at + 2.46, z, 1.56, .06, 6.60, '#ced8d9');
    for (const dz of [-2.28, 1.99])
        for (const t of [-1, 1])
            b.beam(x + t * .75, at + .42, z + dz, x + t * 1.10, at + .42, z + dz, .67, '#515954');
    for (const side of [-1, 1]) {
        for (let j = 0; j < 4; j++) {
            const wx = x + side * 1.125, wz = z - 2.37 + j * 1.54;
            b.box(wx, at + 1.85, wz, .085, .52, 1.28, '#515e62');
            b.box(wx + side * .05, at + 1.85, wz, .023, .405, 1.13, j === 0 ? '#9bc7c3' : '#678c90');
            b.box(wx + side * .07, at + 1.85, wz, .022, .41, .033, '#647178');
        }
    }
    b.box(x, at + 1.86, z - 3.287, 1.75, .54, .057, '#699394');
    for (const xx of [-.70, .70])
        b.lamp(x + xx, at + 1.12, z - 3.31, .22, .17, .055, '#e0b988');
    plate(p, 'tram-side', '07', 'ПУТЕВОЙ РЕЗЕРВ', x - 1.18, 1.14, z - 1.82, .68, .30, -Math.PI / 2);
    b.flush();
    p.flush();
    return root;
}
function courseRing() {
    const root = new T.Group(), c = new T.MeshBasicMaterial({ color: 0x91efdf, transparent: true, opacity: .56, depthWrite: false, side: T.DoubleSide });
    const gate = new T.Mesh(new T.RingGeometry(.88, 1.0, 32), c);
    gate.rotation.x = -Math.PI / 2;
    root.add(gate);
    const rim = new T.Mesh(new T.RingGeometry(.72, .745, 32), c);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = .012;
    root.add(rim);
    return root;
}
function createCityStoryVisuals(scene) {
    const group = new T.Group();
    group.name = 'Сюжетные сцены';
    group.userData.dynamicScenery = true;
    scene.add(group);
    const ring = courseRing(), relay = noteBoxes(true), parcel = noteBoxes(false);
    let terminal, tram;
    const books = story_city_catalog_js_1.archiveSpots.map(k => {
        const box = relay.clone(true), at = story_city_catalog_js_1.cityPlaces[k];
        box.position.set(at.x + .65, (0, world_layout_js_1.groundHeight)(at.x, at.z), at.z + .5);
        group.add(box);
        return box;
    });
    relay.position.set(story_city_catalog_js_1.cityPlaces.relayBox.x + .70, 0, story_city_catalog_js_1.cityPlaces.relayBox.z + .40);
    parcel.position.set(story_city_catalog_js_1.cityPlaces.parcelFind.x + .65, 0, story_city_catalog_js_1.cityPlaces.parcelFind.z + .43);
    parcel.scale.setScalar(.68);
    group.add(ring, relay, parcel);
    let grey;
    let overheated;
    let runner;
    const staff = new Map();
    const passengers = new Map();
    let previousSubject = null;
    const standingStaff = (f, at, id) => {
        if (!near(f, at.x, at.z, 70))
            return;
        let worker = staff.get(id);
        if (!worker) {
            worker = (0, model_people_js_1.createPerson)('resident', id);
            staff.set(id, worker);
            group.add(worker.root);
        }
        worker.root.visible = true;
        const x = at.x + .84, z = at.waitingZ ?? at.z + .7;
        worker.root.position.set(x, (0, world_layout_js_1.groundHeight)(x, z), z);
        worker.root.rotation.y = Math.atan2(at.x - f.x, at.z - f.z);
        worker.update(f.dt ?? 0, 0, false, {});
    };
    return (jobs, f) => {
        const active = jobs.active;
        const course = active && (0, story_city_catalog_js_1.isCourse)(active.id) ? story_city_catalog_js_1.cityCourses[active.id] : null;
        const gate = course?.gates[active?.stage ? (active.city?.leg ?? 0) + 1 : 0];
        ring.visible = !!gate && !active?.city?.failed && near(f, gate.x, gate.z);
        if (gate && ring.visible) {
            ring.position.set(gate.x, (0, world_layout_js_1.groundHeight)(gate.x, gate.z) + .065, gate.z);
            ring.scale.set(Math.min(gate.radius, 4.3), 1, Math.min(gate.radius, 4.3));
        }
        const showTerminal = active?.id === 75 && near(f, story_city_catalog_js_1.cityPlaces.cargoBoard.x, story_city_catalog_js_1.cityPlaces.cargoBoard.z);
        if (showTerminal && !terminal) {
            terminal = terminalPlates();
            group.add(terminal);
        }
        if (terminal)
            terminal.visible = showTerminal;
        const showTram = active?.id === 78 && active.stage >= 3 && near(f, story_city_catalog_js_1.cityPlaces.railDepot.x, story_city_catalog_js_1.cityPlaces.railDepot.z, 90);
        if (showTram && !tram) {
            tram = spareTram();
            group.add(tram);
        }
        if (tram)
            tram.visible = showTram;
        relay.visible = active?.id === 72 && active.stage === 1 && active.marks.includes('friend') && near(f, relay.position.x, relay.position.z);
        const events = active ? [] : (0, story_city_js_1.nearCityEvent)(f, id => !!jobs.receipt(id)).map(e => e.id);
        parcel.visible = (events.includes(89) || active?.id === 89 && active.stage === 0) && near(f, parcel.position.x, parcel.position.z, 68);
        books.forEach((box, i) => { box.visible = active?.id === 80 && !active.marks.includes(story_city_catalog_js_1.archiveSpots[i]) && near(f, box.position.x, box.position.z, 62); });
        const suspect = (0, story_city_js_1.courierSubject)(active);
        if (grey)
            grey.root.visible = false;
        if (overheated)
            overheated.root.visible = false;
        if (runner)
            runner.root.visible = false;
        for (const actor of passengers.values())
            actor.root.visible = false;
        for (const actor of staff.values())
            actor.root.visible = false;
        if (suspect && near(f, suspect.x, suspect.z)) {
            const height = (0, world_layout_js_1.groundHeight)(suspect.x, suspect.z), dt = f.dt ?? 0;
            if (suspect.foot) {
                if (!runner) {
                    runner = (0, model_people_js_1.createPerson)('resident', 9);
                    group.add(runner.root);
                }
                const speed = previousSubject && dt > 0 ? Math.min(3.1, Math.hypot(previousSubject.x - suspect.x, previousSubject.z - suspect.z) / dt) : 0;
                runner.root.visible = true;
                runner.root.position.set(suspect.x, height, suspect.z);
                runner.root.rotation.y = suspect.yaw;
                runner.update(dt, speed, false, {});
            }
            else {
                if (!grey) {
                    grey = (0, model_cars_js_1.createVehicle)('sedan', '#637078', true);
                    group.add(grey.root);
                }
                grey.root.visible = true;
                grey.root.position.set(suspect.x, height, suspect.z);
                grey.root.rotation.y = suspect.yaw;
                grey.update(dt, suspect.ended ? 0 : 8.2, 0, true, suspect.ended, 0, {});
            }
        }
        previousSubject = suspect;
        if ((active?.id === 88 || events.includes(88)) && near(f, story_city_catalog_js_1.cityPlaces.roadsideHeat.x, story_city_catalog_js_1.cityPlaces.roadsideHeat.z, 65)) {
            if (!overheated) {
                overheated = (0, model_cars_js_1.createVehicle)('hatch', '#8b714e', true);
                group.add(overheated.root);
            }
            const at = story_city_catalog_js_1.cityPlaces.roadsideHeat;
            overheated.root.visible = true;
            overheated.root.position.set(at.x + 2.05, (0, world_layout_js_1.groundHeight)(at.x + 2.05, at.z), at.z);
            overheated.root.rotation.y = Math.PI / 2;
            overheated.update(f.dt ?? 0, 0, 0, true, false, .3, {});
            standingStaff(f, at, 0);
        }
        if (active?.id === 75 && active.stage === 0)
            standingStaff(f, story_city_catalog_js_1.cityPlaces.cargoBoard, 9);
        if (active?.id === 72 && active.stage === 1 && active.marks.includes('crew'))
            standingStaff(f, story_city_catalog_js_1.cityPlaces.night, 11);
        if (events.includes(90) || active?.id === 90 && active.stage === 0)
            standingStaff(f, story_city_catalog_js_1.cityPlaces.commuter, 0);
        const taxiLeg = active?.city?.leg ?? 0;
        const carries = active?.id === 76 && active.stage === 1 && taxiLeg > 0 || active?.id === 90 && active.stage === 1;
        const car = carries && f.vehicles?.find(v => v.id === active?.carId);
        if (car && near(f, car.x, car.z, 60)) {
            const actorId = active?.id === 90 ? 2 : [7, 10, 13][Math.max(0, taxiLeg - 1)] ?? 13;
            let taxiRider = passengers.get(actorId);
            if (!taxiRider) {
                taxiRider = (0, model_people_js_1.createPerson)('resident', actorId);
                passengers.set(actorId, taxiRider);
                group.add(taxiRider.root);
            }
            const c = (0, vehicle_cabin_js_1.carCabin)(car.kind), x = c.seatX, z = c.seatZ + .78;
            taxiRider.root.visible = true;
            taxiRider.root.position.set(car.x + x * Math.cos(car.yaw) + z * Math.sin(car.yaw), (0, world_layout_js_1.groundHeight)(car.x, car.z), car.z - x * Math.sin(car.yaw) + z * Math.cos(car.yaw));
            taxiRider.root.rotation.y = car.yaw;
            taxiRider.update(f.dt ?? 0, 0, false, { seated: 1, seatHeight: c.seatY });
        }
        else if (active?.id === 76 && active.stage === 1 && taxiLeg === 0)
            standingStaff(f, story_city_catalog_js_1.cityPlaces.taxiMarket, 7);
    };
}
