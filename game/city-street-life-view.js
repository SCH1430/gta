"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCityStreetLife = createCityStreetLife;
const T = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const exploration_layout_js_1 = require("./exploration-layout.js");
const city_life_layout_js_1 = require("./city-life-layout.js");
const city_timetables_js_1 = require("./city-timetables.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const city_clock_js_1 = require("./city-clock.js");
const collision_js_1 = require("./collision.js");
const model_people_js_1 = require("./model-people.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const steel = '#576e78', stone = '#707b79', snow = '#cad5dd', bar = '#72828c', brass = '#c4a579';
function collisionChecks(scene) {
    let model, inspecting, updated = -1;
    return (elapsed, traffic, cars = [], focus) => {
        let chosen, min = 48 ** 2, stage = 0;
        if (traffic && focus)
            for (const c of cars) {
                const range = (c.x - focus.x) ** 2 + (c.z - focus.z) ** 2;
                if (range >= min)
                    continue;
                const progress = traffic.inspectionProgress(c, elapsed);
                if (progress !== null) {
                    chosen = c;
                    min = range;
                    stage = progress;
                }
            }
        if (!chosen) {
            if (model)
                model.root.visible = false;
            inspecting = undefined;
            return;
        }
        const cabin = (0, vehicle_cabin_js_1.carCabin)(chosen.kind), z = cabin.front * .40;
        const stand = (0, collision_js_1.toWorld)(chosen, -cabin.halfWidth - .68, z);
        if (!(0, collision_js_1.clearDisc)(stand, .28, 0, cars, chosen)) {
            if (model)
                model.root.visible = false;
            return;
        }
        if (!model) {
            model = (0, model_people_js_1.createPerson)('resident', 6);
            model.root.name = 'Водитель осматривает автомобиль';
            scene.add(model.root);
        }
        if (inspecting !== chosen) {
            inspecting = chosen;
            model.resetMotion();
            updated = elapsed;
        }
        const out = T.MathUtils.smoothstep(stage, .02, .25), walk = T.MathUtils.smoothstep(stage, .20, .37);
        const back = T.MathUtils.smoothstep(stage, .70, .92), alpha = T.MathUtils.smoothstep(stage, .91, .99);
        const now = (0, collision_js_1.toWorld)(chosen, -cabin.halfWidth - .37 * out + .37 * alpha, z + (walk - back) * .96);
        const dt = Math.max(.001, Math.min(.11, elapsed - updated));
        updated = elapsed;
        const velocity = stage < .92 ? Math.hypot(now.x - model.root.position.x, now.z - model.root.position.z) / dt : 0;
        model.root.visible = stage > .055 && stage < .96;
        model.root.position.set(now.x, (0, world_layout_js_1.groundHeight)(now.x, now.z) + .24 * (1 - out + alpha), now.z);
        model.root.rotation.y = chosen.yaw - Math.PI * (stage < .21 ? .48 : stage < .38 ? .82 : .50);
        model.update(dt, Math.min(1.12, velocity), false, { glance: stage > .38 && stage < .7 ? .42 : 0, nod: stage > .4 && stage < .7 ? .6 : 0, wetness: .44 });
    };
}
function saltedSnow() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const g = canvas.getContext('2d'), image = g.createImageData(canvas.width, canvas.height);
    let seed = 317;
    for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            const noise = seed / 4294967296, i = (y * canvas.width + x) * 4, shade = Math.floor(noise * 36);
            const outline = Math.min(1, Math.min(x, 255 - x) * .19, Math.min(y, 63 - y) * .23);
            const ruts = Math.min(Math.abs(y - 19), Math.abs(y - 45)) < 4 ? .30 : .91;
            image.data.set([157 + shade, 179 + shade, 193 + shade, Math.floor(255 * outline * Math.min(1, ruts + noise * .20))], i);
        }
    g.putImageData(image, 0, 0);
    return (0, world_textures_js_1.texture)(canvas);
}
function relief(group, x, z, yaw, color, b, subtitle, sharedFront = false) {
    b.box(x, 1.17, z, 1.52, 2.31, .125, steel, yaw);
    const project = (u, d) => ({ x: x + u * Math.cos(yaw) + d * Math.sin(yaw), z: z - u * Math.sin(yaw) + d * Math.cos(yaw) });
    const box = (u, y, d, w, h, depth, c) => {
        const q = project(u, d);
        b.box(q.x, y, q.z, w, h, depth, c, yaw);
    };
    box(0, 1.08, .074, 1.30, 2.12, .06, color);
    box(0, 1.42, .111, .88, .61, .024, '#8da99e');
    box(.45, 1.01, .129, .064, .18, .043, brass);
    box(0, 2.27, .28, 1.61, .11, .66, bar);
    box(0, 2.34, .28, 1.64, .057, .66, snow);
    box(0, .024, .36, 1.55, .047, .69, stone);
    const tile = project(sharedFront ? .12 : 0, .08);
    const p = new world_batch_js_1.Panels(group);
    p.place('door-' + subtitle, () => (0, world_textures_js_1.signTexture)(subtitle, 'СЛУЖЕБНЫЙ ВХОД', '#f2ce87', '#344c51', 3.6), tile.x, sharedFront ? 3.10 : 2.56, tile.z, sharedFront ? 2.0 : 2.90, sharedFront ? .46 : .62, yaw);
    p.flush();
}
function createCityStreetLife(scene) {
    const root = new T.Group(), b = new world_batch_js_1.Batches(root);
    root.name = 'Открытые двери · проезды · остановки';
    root.userData.staticScenery = true;
    scene.add(root);
    const updateCheck = collisionChecks(scene);
    for (const id of [...exploration_layout_js_1.serviceEntries, 'passage']) {
        if (id === 'school1') continue; // The school has its own signed entrance.
        const e = exploration_layout_js_1.entrances[id], offset = id === 'passage' ? 1.11 : id === 'hydro' ? 1.17 : id === 'terminal' ? 1.37 : .82;
        const x = e.x - Math.sin(e.yaw) * offset, z = e.z - Math.cos(e.yaw) * offset;
        relief(root, x, z, e.yaw, id === 'cafe' ? '#995a48' : id === 'hydro' ? '#466e81' : '#527271', b, e.label.toUpperCase());
    }
    relief(root, exploration_layout_js_1.passageFront.x, exploration_layout_js_1.passageFront.z - 1.10, 0, '#617c77', b, 'СКВОЗНОЙ ПОДЪЕЗД', true);
    for (const s of city_life_layout_js_1.serviceFence) {
        b.box(s.x, 1.05, s.z, s.w, 2.10, s.d, stone);
        b.box(s.x, 2.13, s.z, s.w + .12, .07, s.d + .04, snow);
        for (const side of [-1, 1])
            b.box(s.x + .095, 1.04, s.z + side * s.d * .43, .052, 2.02, .095, steel);
    }
    const gateBodies = city_life_layout_js_1.serviceGates.map(g => {
        const group = new T.Group(), leaf = new T.Group(), sb = new world_batch_js_1.Batches(group), lb = new world_batch_js_1.Batches(leaf);
        group.position.set(g.x, 0, g.z);
        group.add(leaf);
        root.add(group);
        leaf.userData.dynamicScenery = true;
        for (const side of [-1, 1]) {
            sb.box(0, g.h * .5, side * (g.d * .5 + .14), .23, g.h, .24, steel);
            sb.box(0, .23, side * (g.d * .5 + .14), .45, .46, .49, stone);
            sb.box(.20, .94, side * (g.d * .5 + .16), .24, .46, .30, brass);
            sb.lamp(.249, 1.03, side * (g.d * .5 + .16), .09, .15, .113, '#f0b16e');
        }
        sb.box(0, g.h - .08, 0, .32, .16, g.d + .64, steel);
        sb.box(0, g.h + .017, 0, .36, .065, g.d + .70, snow);
        for (let i = 0; i < 12; i++) {
            const y = .15 + i * .195;
            lb.box(0, y, 0, .133, .181, g.d - .14, i % 3 === 0 ? '#73837f' : '#8c9a89');
            lb.box(.080, y + .074, 0, .028, .033, g.d - .25, '#5e7473');
        }
        lb.box(0, .072, 0, .175, .106, g.d - .11, brass);
        for (const dz of [-g.d * .21, 0, g.d * .21])
            lb.box(.091, .53, dz, .03, .12, .23, '#ab704f');
        sb.flush();
        lb.flush();
        return { g, leaf };
    });
    for (const stop of city_life_layout_js_1.roadStops) {
        const rootStop = new T.Group(), sb = new world_batch_js_1.Batches(rootStop), sign = new world_batch_js_1.Panels(rootStop);
        rootStop.position.set(stop.x, (0, world_layout_js_1.groundHeight)(stop.x, stop.z), stop.z);
        rootStop.rotation.y = stop.yaw;
        root.add(rootStop);
        sb.box(0, .008, 0, 6.1, .045, 3.16, stone);
        sb.box(0, 2.68, 0, 5.36, .16, 2.68, steel);
        sb.box(0, 2.78, 0, 5.42, .06, 2.73, snow);
        sb.box(0, .64, .86, 4.34, .12, .58, '#848473');
        sb.box(0, 1.46, 1.16, 4.84, 2.18, .16, '#59727a');
        sb.box(0, 1.87, 1.065, 3.37, .99, .039, '#7b9397');
        sb.lamp(0, 2.59, -1.11, 3.13, .04, .12, '#eac591');
        for (const s of [-1, 1]) {
            sb.box(s * 2.3, 1.36, 1.14, .26, 2.64, .25, steel);
            sb.box(s * 2.35, 1.55, .27, .13, 1.42, 1.82, '#789097');
        }
        sign.place(stop.id, () => (0, world_textures_js_1.signTexture)(stop.title, stop.sub, '#efe1b9', '#3c575c', 4.3), 0, 2.56, -1.36, 4.79, .60, Math.PI);
        for (const side of [-1, 1]) {
            sb.box(side * 2.64, .25, -1.14, .22, .5, .23, '#9e845e');
            sb.lamp(side * 2.64, .443, -1.26, .13, .06, .056, '#ffd486');
        }
        sb.flush();
        sign.flush();
    }
    const signs = new world_batch_js_1.Panels(root);
    for (const rank of city_timetables_js_1.taxiRanks) {
        const x = rank.signX - .63, z = rank.signZ, y = (0, world_layout_js_1.groundHeight)(x, z);
        b.cyl(x, y + .87, z, .08, 1.74, steel);
        b.box(x, y + 1.83, z, 1.54, .65, .067, '#a78252');
        b.box(x, y + .052, z, .37, .11, .33, stone);
        const yaw = z < rank.z ? 0 : Math.PI;
        signs.place('taxi-' + rank.id, () => (0, world_textures_js_1.signTexture)('ТАКСИ', rank.name.toUpperCase(), '#ffe1a0', '#4d5151', 2.35), x, y + 1.83, z + .047 * Math.cos(yaw), 1.46, .572, yaw);
    }
    for (const cross of city_timetables_js_1.pedestrianCrossings) {
        const half = Math.min(cross.length * .5 - .76, 6.3);
        for (const z of [-1.07, -.54, 0, .54, 1.07]) {
            const x = cross.x + z, y = (0, world_layout_js_1.groundHeight)(x, cross.z);
            b.box(x, y + .019, cross.z, .27, .009, 2 * half, '#a9b3ac');
        }
    }
    const map = saltedSnow(), snowMeshes = city_life_layout_js_1.winterYards.map(yard => {
        const material = new T.MeshBasicMaterial({ map, opacity: 0, transparent: true, depthWrite: false });
        const mesh = new T.Mesh(new T.PlaneGeometry(yard.w, yard.d), material);
        const pose = new T.Group();
        pose.position.set(yard.x, (0, world_layout_js_1.groundHeight)(yard.x, yard.z) + .042, yard.z);
        pose.rotation.y = yard.yaw;
        mesh.rotation.x = -Math.PI * .5;
        mesh.visible = false;
        mesh.renderOrder = 1;
        pose.add(mesh);
        root.add(pose);
        return mesh;
    });
    b.flush();
    signs.flush();
    return (open, elapsed, traffic, minutes = (0, city_clock_js_1.districtMinutes)(elapsed), cars, focus) => {
        for (const g of gateBodies) {
            const target = Number(open.has(g.g.id));
            g.leaf.position.y = target * g.g.h;
        }
        snowMeshes.forEach((mesh, index) => {
            const cover = traffic?.yardCover(index, elapsed, minutes) ?? 0;
            mesh.visible = cover > .025;
            mesh.material.opacity = cover * .88;
        });
        updateCheck(elapsed, traffic, cars, focus);
    };
}
