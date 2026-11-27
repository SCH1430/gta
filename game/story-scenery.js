"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStoryScenery = createStoryScenery;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const story_map_js_1 = require("./story-map.js");
const story_photos_js_1 = require("./story-photos.js");
const story_catalog_js_1 = require("./story-catalog.js");
const model_people_js_1 = require("./model-people.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const story_dock_js_1 = require("./story-dock.js");
const story_city_view_js_1 = require("./story-city-view.js");
const story_night_view_js_1 = require("./story-night-view.js");
function buildFreight(b, sign) {
    const x = world_layout_js_1.freightWagons[0].x;
    for (const side of [-.78, .78])
        b.box(x + side, .065, -6, .09, .13, 40, '#948b82');
    for (let z = -26; z <= 14; z += .77)
        b.box(x, .028, z, 2.17, .056, .19, '#645d50');
    for (const [index, w] of world_layout_js_1.freightWagons.entries()) {
        const { x, z } = w, body = ['#7c7562', '#788077', '#767365'][index], trim = '#535c58', steel = '#5d6565';
        for (const wheelZ of [-3.34, -2.31, 2.31, 3.34]) {
            b.beam(x - 1.06, .40, z + wheelZ, x + 1.06, .40, z + wheelZ, .147, trim);
            for (const signX of [-1, 1]) {
                b.beam(x + signX * .88, .405, z + wheelZ, x + signX * 1.12, .405, z + wheelZ, .75, '#48565c');
                b.beam(x + signX * 1.10, .405, z + wheelZ, x + signX * 1.155, .405, z + wheelZ, .43, '#79868a');
            }
        }
        b.box(x, .96, z, 2.50, .25, 9.62, trim);
        b.box(x, 1.96, z, 2.47, 1.81, 9.03, body);
        b.box(x, 2.91, z, 2.52, .10, 9.06, '#b7c2c2');
        for (const dx of [-1, 1]) {
            const local = x + dx * 1.26;
            for (let dz = -4.34; dz < 4.4; dz += 1.38)
                b.box(local, 1.99, z + dz, .06, 1.73, .092, '#5b655f');
            b.box(local, 1.16, z, .07, .07, 9.0, '#a09d88');
            b.box(local, 2.78, z, .076, .108, 9.02, '#969a89');
            for (const d of [-.09, .09]) {
                const z1 = index === 0 ? -.46 : -1.29, z2 = index === 0 ? -.46 : 1.30;
                const y1 = index === 2 ? 1.98 : 1.48, y2 = index === 2 ? 1.98 : 2.45;
                b.beam(local + dx * .045, y1 + d, z + z1 + (index === 0 ? d : 0), local + dx * .045, y2 + d, z + z2 + (index === 0 ? d : 0), .056, '#b1a589');
            }
            b.box(local + dx * .09, 2.14, z + 3.65, .065, 1.72, .06, steel);
            b.box(local + dx * .09, 2.14, z + 4.18, .065, 1.72, .06, steel);
            for (let y = 1.4; y < 3; y += .32)
                b.box(local + dx * .09, y, z + 3.92, .065, .04, .59, steel);
            const letter = ['А', 'Б', 'В'][index];
            sign.place('story-wagon-' + letter, () => (0, world_textures_js_1.signTexture)('СЕКЦИЯ ' + letter, 'СОРТИРОВКА  /  ВОСТОЧНАЯ', '#f2d9a8', '#636e64', 2.8), local + dx * .042, 2.18, z - 2.8, 1.78, .64, dx * Math.PI / 2);
        }
        for (const end of [-1, 1])
            b.box(x, .89, z + end * 4.94, .39, .22, .48, '#5a5d57');
    }
}
function makeGauge(b, labels, p, value, ink) {
    const z = p.z + .85, x = p.x, base = (0, world_layout_js_1.groundHeight)(x, z);
    b.box(x, base + 1.02, z, .32, 2.14, .22, '#5d6c73');
    b.box(x, base + 1.02, z - .16, .326, 2.1, .11, '#e2d6b5');
    for (let i = 0; i < 21; i++)
        b.box(x + .07, base + .085 + .096 * i, z - .223, i % 5 === 0 ? .18 : .095, i % 5 === 0 ? .033 : .018, .015, ink);
    b.box(x, base + 1.32, z - .235, .32, .025, .02, '#ba6c52');
    labels.place('water-' + value, () => (0, world_textures_js_1.signTexture)(value, 'УРОВЕНЬ КАНАЛА', '#fff0c4', '#5e746b', 2.6), x, base + 1.83, z - .226, 1.06, .4, Math.PI);
}
function generator(b, labels) {
    const x = 35.9, z = 24.83;
    b.box(x, .60, z, 1.2, .90, .59, '#526a60');
    b.box(x, 1.08, z, 1.27, .08, .68, '#a4a799');
    for (const dx of [-.47, .47])
        for (const dz of [-.18, .18])
            b.box(x + dx, .12, z + dz, .14, .24, .14, '#394c4c');
    for (let k = 0; k < 6; k++)
        b.box(x - .35 + k * .13, .48, z - .31, .065, .36, .035, '#2f4444');
    labels.place('reserve-gen', () => (0, world_textures_js_1.signTexture)('РЕЗЕРВ 04', '4 кВт  /  ТРИ ЛИНИИ', '#f9dc9b', '#384e46', 3.0), x, .90, z - .311, .92, .306, Math.PI);
    for (let k = 0; k < 3; k++)
        b.box(x - .33 + k * .33, .72, z - .324, .21, .07, .045, '#ccae7e');
}
function lamps(scene) {
    const lamps = [
        { x: 28, y: 2.82, z: 15.98, w: 2.8, color: '#f5bd70' },
        { x: 34.4, y: 1.63, z: 20.04, w: 1.1, color: '#a3d8dc' },
        { x: 40.6, y: 2.97, z: 25.0, w: .65, color: '#f4cf8f' }
    ];
    const group = new T.Group();
    group.name = 'Резервное освещение рынка';
    group.userData.dynamicScenery = true;
    scene.add(group);
    const dark = new T.MeshLambertMaterial({ color: '#586260' });
    const strips = lamps.map(l => {
        const on = new T.MeshBasicMaterial({ color: l.color }), mesh = new T.Mesh(new T.BoxGeometry(l.w, .085, .16), on);
        mesh.position.set(l.x, l.y, l.z);
        group.add(mesh);
        return { mesh, on };
    });
    const maker = new world_batch_js_1.Batches(group);
    maker.box(40.6, 1.45, 25.11, .08, 2.90, .08, '#627274');
    maker.box(34.4, 1.14, 20.00, 1.18, 1.1, .18, '#566e70');
    maker.box(34.4, 1.15, 20.106, .94, .65, .042, '#738689');
    maker.flush();
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d'), g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,247,.59)');
    g.addColorStop(.38, 'rgba(255,245,220,.26)');
    g.addColorStop(1, 'rgba(254,237,211,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new T.CanvasTexture(glowCanvas);
    const pools = lamps.map((l, i) => {
        const m = new T.Mesh(new T.PlaneGeometry(3 + i * .36, 3.8 + i * .42), new T.MeshBasicMaterial({ map: texture, color: l.color, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
        m.rotation.x = -Math.PI / 2;
        m.position.set(l.x, (0, world_layout_js_1.groundHeight)(l.x, l.z + .76) + .048, l.z + .76);
        group.add(m);
        return m;
    });
    return (jobs) => {
        const p = jobs.effects.marketPower;
        for (const [i, lit] of [p.workshop, p.fridge, p.crossing].entries()) {
            strips[i].mesh.material = lit ? strips[i].on : dark;
            pools[i].visible = lit;
        }
    };
}
function photoGuide() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('k-photo-camera');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    svg.appendChild(path);
    const host = document.querySelector('#game') ?? document.body;
    host.appendChild(svg);
    svg.style.display = 'none';
    const ref = new T.PerspectiveCamera(), v = new T.Vector3(), rot = new T.Quaternion(), axis = new T.Vector3(0, 1, 0);
    let last = -1;
    return (jobs, f, camera) => {
        const s = jobs.active, n = s?.id === 40 ? s.stage : -1;
        const photo = story_map_js_1.oldPhotos[n], site = photo && story_map_js_1.jobPlaces[photo.at];
        if (!site || !camera || f.space !== 'street' || f.car || Math.hypot(f.x - site.x, f.z - site.z) > 4.8) {
            svg.style.display = 'none';
            return;
        }
        svg.style.display = '';
        const now = performance.now();
        if (now - last < 75)
            return;
        last = now;
        ref.copy(camera, false);
        rot.setFromAxisAngle(axis, photo.heading - f.yaw);
        ref.position.sub(v.set(f.x, 0, f.z)).applyQuaternion(rot).add(v.set(site.x, 0, site.z));
        ref.quaternion.premultiply(rot);
        ref.updateMatrixWorld();
        const d = story_photos_js_1.linesByPhoto[n].map(line => {
            let str = '';
            for (const pt of line) {
                v.set(...pt).project(ref);
                if (v.z < 0 || v.z > 1)
                    return '';
                str += (str ? 'L' : 'M') + ((v.x + 1) * 50).toFixed(2) + ' ' + ((1 - v.y) * 50).toFixed(2);
            }
            return str;
        }).join('');
        path.setAttribute('d', d);
    };
}
function createStoryScenery(scene) {
    const group = new T.Group();
    group.name = 'Сортировочная площадка и гидропосты';
    group.userData.staticScenery = true;
    scene.add(group);
    const b = new world_batch_js_1.Batches(group), labels = new world_batch_js_1.Panels(group);
    buildFreight(b, labels);
    generator(b, labels);
    makeGauge(b, labels, story_map_js_1.jobPlaces.nearGauge, '3,34 м', '#704f48');
    makeGauge(b, labels, story_map_js_1.jobPlaces.iceGauge, '3,16 м', '#456775');
    (0, story_dock_js_1.buildDockContract)(b, labels);
    b.flush();
    labels.flush();
    const power = lamps(scene), photo = photoGuide(), dockContact = (0, story_dock_js_1.trackDockContact)(scene), city = (0, story_city_view_js_1.createCityStoryVisuals)(scene), night = (0, story_night_view_js_1.createNightStoryVisuals)(scene);
    const riders = [];
    let mask = -1;
    return { update(jobs, f, camera) {
            const s = jobs.active, effects = jobs.effects.marketPower;
            const newMask = Number(effects.workshop) + 2 * Number(effects.fridge) + 4 * Number(effects.crossing);
            if (newMask !== mask) {
                power(jobs);
                mask = newMask;
            }
            photo(jobs, f, camera);
            dockContact(jobs, f);
            city(jobs, f);
            night(jobs, f);
            const nearShift = Math.hypot(f.x - story_map_js_1.jobPlaces.shift.x, f.z - story_map_js_1.jobPlaces.shift.z) < 60;
            const transport = s?.id === 64 && s.stage === 1 ? (f.vehicles?.find(c => c.id === s.carId) ?? (s.carId === f.car?.id ? { ...f.car, x: f.x, z: f.z } : null)) : null;
            const waiting = s?.id === 64 && s.stage === 0 && nearShift;
            const nearCar = !!transport && Math.hypot(transport.x - f.x, transport.z - f.z) < 65;
            for (const [i, stop] of story_catalog_js_1.passengerStops.entries()) {
                const onboard = nearCar && !!s && !s.marks.includes(stop);
                if (f.space !== 'street' || (!onboard && !waiting)) {
                    riders[i]?.root.removeFromParent();
                    continue;
                }
                const r = riders[i] ??= (0, model_people_js_1.createPerson)('resident', i + 8);
                if (!r.root.parent)
                    scene.add(r.root);
                if (onboard && transport) {
                    const c = transport, cabin = (0, vehicle_cabin_js_1.carCabin)(c.kind);
                    const x = cabin.seatX * (i === 1 ? -1 : 1), z = i === 0 ? cabin.seatZ : cabin.seatZ + .79;
                    r.root.position.set(c.x + x * Math.cos(c.yaw) + z * Math.sin(c.yaw), (0, world_layout_js_1.groundHeight)(c.x, c.z), c.z - x * Math.sin(c.yaw) + z * Math.cos(c.yaw));
                    r.root.rotation.y = c.yaw;
                    r.update(f.dt ?? 0, 0, false, { seated: 1, seatHeight: cabin.seatY });
                }
                else {
                    const x = -56.4 + i * 1.2, z = -108.4 + (i % 2) * .5;
                    r.root.position.set(x, (0, world_layout_js_1.groundHeight)(x, z), z);
                    r.root.rotation.y = -.3 + i * .74;
                    r.update(f.dt ?? 0, 0, false, {});
                }
            }
        } };
}
