"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCargoRailView = createCargoRailView;
const THREE = require("../engine/three.module.min.js");
const cargo_rail_js_1 = require("./cargo-rail.js");
const cargo_job_js_1 = require("./cargo-job.js");
const world_batch_js_1 = require("./world-batch.js");
const world_layout_js_1 = require("./world-layout.js");
const world_textures_js_1 = require("./world-textures.js");
const frame = '#3b454b', rust = '#72584d', steel = '#73808a', snow = '#c4d4da', light = '#ffda95';
const box = new THREE.BoxGeometry(1, 1, 1);
const ring = new THREE.CylinderGeometry(.34, .34, .105, 18);
ring.rotateX(Math.PI * .5);
const wheelMetal = new THREE.MeshLambertMaterial({ color: '#46494a' });
const wheelFace = new THREE.MeshLambertMaterial({ color: '#808077' });
const armPaint = new THREE.MeshLambertMaterial({ color: '#d1c9ae' });
const armRed = new THREE.MeshLambertMaterial({ color: '#9c4740' });
const lampRed = new THREE.MeshBasicMaterial({ color: '#fa6653' });
const lampIdle = new THREE.MeshBasicMaterial({ color: '#502d2c' });
const lampCase = new THREE.MeshLambertMaterial({ color: '#38444c' });
const cube = (mat, x, y, z, w, h, d) => {
    const m = new THREE.Mesh(box, mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    return m;
};
function bogies(b, root, length, width) {
    const results = [];
    for (const end of [-1, 1]) {
        const x = end * length * .308;
        b.box(x, .51, 0, 2.82, .26, 2.36, frame);
        for (const side of [-1, 1]) {
            b.box(x, .57, side * 1.02, 2.82, .32, .18, '#545759');
            for (const i of [-1, 0, 1])
                b.cyl(x + i * .38, .63, side * 1.09, .21, .34, '#857670');
        }
        for (const axle of [-.82, .82]) {
            const pivot = new THREE.Group();
            pivot.position.set(x + axle, .355, 0);
            root.add(pivot);
            results.push(pivot);
            for (const side of [-1, 1]) {
                const hub = new THREE.Mesh(ring, wheelMetal);
                hub.position.z = side * .76;
                pivot.add(hub);
                pivot.add(cube(wheelFace, 0, 0, side * .82, .38, .074, .035), cube(wheelFace, 0, 0, side * .82, .074, .38, .035));
                b.box(x + axle, .36, side * 1.21, .26, .26, .20, '#575d5c');
            }
        }
    }
    for (const side of [-1, 1])
        b.box(0, .90, side * width * .445, length, .36, .12, rust);
    return results;
}
function rollingStock(meta) {
    const root = new THREE.Group(), b = new world_batch_js_1.Batches(root), numbers = new world_batch_js_1.Panels(root);
    root.name = 'Грузовой вагон ' + meta.id;
    const { length: l, width: w, color, style } = meta, end = l * .5, side = w * .5;
    const wheels = bogies(b, root, l, w);
    b.box(0, .85, 0, l - .05, .28, w - .06, frame);
    for (const x of [-end, end]) {
        b.box(x, .89, 0, .24, .24, .42, '#453f3c');
        b.box(x + (x < 0 ? -.17 : .17), .79, 0, .28, .13, .23, '#282f34');
        for (const z of [-.88, .88])
            b.box(x, .94, z, .17, .12, .29, '#8a7b71');
    }
    if (style === 'engine') {
        b.box(.87, 1.83, 0, 8.08, 1.67, 2.35, color);
        b.box(.75, 2.78, 0, 8.57, .22, 2.49, steel);
        b.box(2.74, 2.51, 0, 3.02, 1.51, 2.61, color);
        b.box(2.72, 3.34, 0, 3.30, .17, 2.56, '#596c73');
        b.box(-3.50, 1.47, 0, 2.01, .95, 2.13, color);
        b.box(-3.63, 2.08, 0, 1.32, .23, 1.27, frame);
        b.box(4.43, 2.69, 0, .10, .70, 2.33, '#273e4d');
        b.box(4.495, 2.70, 0, .045, .69, .094, '#728992');
        for (const z of [-.92, .92])
            b.lamp(end - .68, 1.39, z, .14, .20, .22, light);
        b.lamp(4.49, 3.10, 0, .09, .23, .40, '#fff3bb');
        for (const s of [-1, 1]) {
            b.box(2.60, 2.72, s * (side - .04), 1.83, .64, .041, '#274254');
            b.box(3.08, 2.72, s * (side - .009), .057, .65, .035, '#82a3ac');
            b.lamp(2.19, 2.63, s * (side - .005), .49, .20, .022, '#7c7865');
            b.box(.36, 1.38, s * side, 10.2, .105, .06, '#bb905b');
            for (let i = 0; i < 13; i++)
                b.box(-3.10 + i * .168, 2.18, s * 1.19, .045, .56, .05, '#475b5d');
        }
    }
    else if (style === 'tank') {
        b.piece('round', 0, 1.99, 0, 2.36, l - .58, 2.36, color, 0, Math.PI * .5);
        for (const x of [-end + .53, -l * .26, l * .26, end - .53])
            b.piece('round', x, 1.99, 0, 2.40, .13, 2.40, steel, 0, Math.PI * .5);
        b.cyl(1.03, 3.202, 0, 1.04, .24, '#6f7776');
        b.box(.91, 3.25, -.04, 2.44, .19, .62, '#726c62');
        for (const s of [-1, 1])
            for (let k = 0; k < 7; k++)
                b.box(1.59, 1.21 + k * .29, s * 1.22, .32, .063, .095, steel);
    }
    else {
        const height = style === 'container' ? 2.28 : style === 'hopper' ? 1.66 : 2.11, bodyBase = 1.05, cy = bodyBase + height * .5;
        b.box(0, cy, 0, l - .34, height, w - .049, color);
        b.box(0, bodyBase + height + .065, 0, l - .33, .115, w + .04, style === 'hopper' ? '#70695c' : '#839193');
        for (const x of [-end + .20, end - .20])
            for (const z of [-side + .066, side - .066])
                b.box(x, cy, z, .102, height, .12, steel);
        for (const s of [-1, 1]) {
            const ribs = style === 'container' ? 25 : style === 'hopper' ? 7 : 10;
            for (let i = 0; i < ribs; i++)
                b.box(-end + .41 + i * (l - .82) / (ribs - 1), cy, s * (side - .01), style === 'container' ? .059 : .12, height - .07, .071, style === 'container' ? '#547e8c' : style === 'hopper' ? '#849087' : '#9d7c6e');
            b.box(0, bodyBase + .055, s * (side + .011), l - .31, .10, .07, frame);
            b.box(0, bodyBase + height - .092, s * (side + .011), l - .31, .082, .075, steel);
            if (style === 'box') {
                b.box(.02, cy, s * (side + .07), 2.29, height - .13, .12, '#755b57');
                for (const dx of [-1.17, 1.17])
                    b.box(dx, cy, s * (side + .17), .059, height - .18, .11, '#b09380');
                b.box(.66, cy - .26, s * (side + .17), .42, .073, .10, '#bc9e7b');
            }
            if (style === 'hopper')
                for (const x of [-2.8, 0, 2.8]) {
                    b.beam(x - .68, .99, s * (side + .03), x + .31, 2.64, s * (side + .03), .145, steel, true);
                    b.beam(x + .78, .99, s * (side + .03), x + .31, 2.64, s * (side + .03), .09, '#788477', true);
                }
            if (style === 'container') {
                b.beam(-2.22, 1.20, s * (side + .048), -1.03, 3.23, s * (side + .048), .235, '#ddba65', true);
                b.beam(-1.92, 1.20, s * (side + .05), -.73, 3.23, s * (side + .05), .085, '#e2bf6d', true);
            }
        }
    }
    for (const s of [-1, 1]) {
        const edge = side + (style === 'box' ? .15 : style === 'tank' ? .003 : .067);
        const title = style === 'engine' ? 'КАНАЛЬНАЯ ТЯГА' : meta.id, sub = style === 'container' ? 'КОНТЕЙНЕР · 2022' : style === 'tank' ? 'ТЕПЛОНОСИТЕЛЬ' : style === 'engine' ? meta.id : 'ГРУЗОВАЯ ВЕТКА';
        const x = style === 'engine' ? -.26 : 1.65, y = style === 'engine' ? 1.71 : 2.27;
        b.box(x, y, s * (edge - .022), 1.92, .66, .071, '#3f5052');
        numbers.place(meta.id, () => (0, world_textures_js_1.signTexture)(title, sub, '#fff0bb', '#33454b', 3.0), x, y, s * (edge + .014), 1.79, .60, s > 0 ? 0 : Math.PI);
    }
    if (style === 'tank')
        b.lamp(-end - .045, 1.39, 0, .09, .15, .15, '#d5674a');
    b.flush();
    numbers.flush();
    return { root, wheels };
}
function railChunk(parent, west, east) {
    const root = new THREE.Group(), b = new world_batch_js_1.Batches(root);
    const z = cargo_rail_js_1.cargoTrack.z;
    for (let x = west + .27; x < east - .10; x += .72) {
        const grade = (0, cargo_rail_js_1.cargoGrade)(x);
        b.box(x, grade + .016, z, .78, .079, 3.11, '#626467');
        b.box(x, grade + .061, z, .28, .075, 2.58, Math.round(x / .72) % 5 === 0 ? '#786958' : '#4c4d4b');
    }
    for (let westEdge = west; westEdge < east; westEdge += 2.9) {
        const next = Math.min(east, westEdge + 2.9), a = (0, cargo_rail_js_1.cargoGrade)(westEdge), n = (0, cargo_rail_js_1.cargoGrade)(next);
        for (const side of [-1, 1]) {
            const lateral = z + side * .77;
            b.beam(westEdge, a + .108, lateral, next, n + .108, lateral, .12, '#596066', true);
            b.beam(westEdge, a + .181, lateral, next, n + .181, lateral, .048, '#aeb9b7', true);
        }
    }
    b.flush();
    parent.add(root);
    return { root, x: (west + east) * .5 };
}
function railingFrame(b) {
    const bridge = cargo_rail_js_1.cargoFootbridge, x = bridge.x, w = bridge.halfWidth;
    const sections = [bridge.north, bridge.up, bridge.down, bridge.south];
    const height = (z) => (0, cargo_rail_js_1.cargoFootbridgeFloor)(x, z);
    for (let i = 1; i < sections.length; i++) {
        const a = sections[i - 1], end = sections[i], steps = Math.ceil((end - a) / .32);
        for (let k = 0; k < steps; k++) {
            const z = a + (k + .5) * (end - a) / steps, span = (end - a) / steps;
            b.box(x, height(z) - .080, z, w * 2, .19, span + .016, k % 5 === 0 ? '#677d89' : '#788b92');
            b.box(x, height(z) + .025, z, w * 1.96, .026, .032, k % 5 === 0 ? '#b7b7aa' : '#8e9999');
        }
        for (const side of [-1, 1]) {
            const edge = x + side * (w + .06);
            b.beam(edge, height(a) - .24, a, edge, height(end) - .24, end, .22, steel, true);
            b.beam(edge, height(a) + .97, a, edge, height(end) + .97, end, .098, '#bba46d', true);
            b.beam(edge, height(a) + .51, a, edge, height(end) + .51, end, .062, steel, true);
            for (let z = a + .18; z < end; z += 1.05)
                b.box(edge, height(z) + .46, z, .073, .98, .073, steel);
        }
    }
    for (const z of [55.9, 64.9])
        for (const side of [-1, 1]) {
            const y = height(z), edge = x + side * (w + .09), foot = z < 61 ? 0 : -.68;
            b.box(edge, (foot + y) / 2 - .15, z, .193, y - foot - .27, .19, '#607582');
            b.box(edge, foot + .17, z, .37, .39, .41, '#74838a');
        }
    for (const z of [52.9, 56.2, 63.4, 67.4])
        b.lamp(x + .86, height(z) + .66, z, .055, .074, .27, light);
}
function shelter(b, p, index) {
    const site = cargo_rail_js_1.cargoCrossings[index], x = site.look.x, z = site.look.z;
    b.box(x, -.055, z, 4.48, .12, 3.18, '#869396');
    b.box(x, 2.17, z - .76, 3.67, .13, 1.17, '#637984');
    b.box(x, 2.255, z - .76, 3.73, .065, 1.24, snow);
    b.lamp(x, 2.09, z - .50, 1.68, .058, .15, light);
    for (const dx of [-1.74, 1.74])
        b.box(x + dx, 1.10, z - 1.25, .13, 2.21, .13, steel);
    b.box(x, 1.03, z-1.30, 3.53, 2.03, .11, '#9a9a83');
    b.box(x - 1.71, .48, z-.76, .12, .96, 1.19, '#8b8e7c');
    b.box(x - 1.71, 1.47, z-.76, .10, .94, 1.18, '#96a8aa');
    b.box(x - 1.71, 1.45, z-.76, .13, 1.02, .05, '#b6b59e');
    const signs = new world_batch_js_1.Panels(p);
    signs.place(site.name, () => (0, world_textures_js_1.signTexture)(site.name.toUpperCase(), 'ГРУЗОВОЙ ПОСТ · СМОТРОВАЯ', '#f0dcad', '#3f5662', 4.6), x, 1.89, z - 1.176, 3.34, .73, 0);
    signs.flush();
}
function crossing(parent, index) {
    const site = cargo_rail_js_1.cargoCrossingSigns[index], root = new THREE.Group(), b = new world_batch_js_1.Batches(root), boards = new world_batch_js_1.Panels(root);
    parent.add(root);
    if (index < 3)
        shelter(b, root, index);
    const deckY = cargo_rail_js_1.cargoGrade(site.x) + .102, trackZ = cargo_rail_js_1.cargoTrack.z;
    const panels = Math.max(1, Math.ceil(site.roadWidth/1.2)), width = site.roadWidth / panels;
    for(let i=0;i<panels;i++) {
        const dx=site.x - site.roadWidth/2 + (i+.5)*width;
        for(const [offset,depth] of [[-1.39,1.15],[0,1.25],[1.39,1.15]])
            b.box(dx,deckY,trackZ+offset,width-.024,.08,depth,'#565957');
    }
    const arms = [-1, 1].map(side => {
        const x = site.x + side * (site.roadWidth * .5 + .095), z = cargo_rail_js_1.cargoTrack.z + side * 5.15, y = (0, world_layout_js_1.groundHeight)(x, z);
        b.box(x, y + .52, z, .43, 1.09, .53, steel);
        b.box(x, y + 1.58, z - .50, .102, 3.10, .107, steel);
        b.box(x, y + 2.75, z - .50, .79, .069, .142, '#d3c187');
        b.beam(x - .32, y + 2.50, z - .45, x + .30, y + 2.96, z - .45, .09, steel, true);
        b.beam(x + .32, y + 2.50, z - .45, x - .30, y + 2.96, z - .45, .09, steel, true);
        const lights = [];
        for (const dx of [-.214, .214]) {
            root.add(cube(lampCase, x + dx, y + 2.32, z - .50, .30, .30, .23));
            const bulb = cube(lampIdle, x + dx, y + 2.32, z - .57, .203, .17, .286);
            root.add(bulb);
            lights.push(bulb);
        }
        const pivot = new THREE.Group();
        pivot.position.set(x, y + .99, z);
        root.add(pivot);
        const width = site.roadWidth * .5 + .17;
        pivot.add(cube(armPaint, -side * width * .50, 0, 0, width, .105, .118));
        for (let at = .30; at < width - .20; at += .65)
            pivot.add(cube(armRed, -side * at, 0, 0, .30, .116, .128));
        pivot.rotation.z = -side * Math.PI * .49;
        return { pivot, lights, side };
    });
    if (index === 2) {
        const { x, z } = cargo_job_js_1.cargoDispatch;
        b.box(x + 1.08, 1.07, z - .75, .11, 2.18, .13, steel);
        b.box(x - 1.07, 1.07, z - .75, .11, 2.18, .13, steel);
        b.box(x, 1.74, z - .75, 2.38, .83, .15, '#38505a');
        boards.place('Грузовой пост 77', () => (0, world_textures_js_1.signTexture)('ГРУЗОВОЙ ПОСТ 77', 'ВЕДОМОСТЬ · МОСТОК НА ЛЁД →', '#fad893', '#354b56', 3.0), x, 1.74, z - .852, 2.30, .76, Math.PI);
        b.box(x + .405, .74, z - .128, .66, 1.05, .37, frame);
        b.box(x + .405, 1.28, z - .13, .73, .09, .51, steel);
        b.lamp(x + .342, 1.001, z + .076, .043, .041, .035, '#a4bd94');
    }
    b.flush();
    boards.flush();
    return { root, arms, x: site.x, value: 0 };
}
function createCargoRailView(scene) {
    const decor = new THREE.Group(), stock = new THREE.Group();
    decor.name = 'Северная грузовая ветка';
    stock.name = 'Состав ТМ‑07';
    scene.add(decor, stock);
    const chunks = [];
    for (let x = cargo_rail_js_1.cargoTrack.west; x < cargo_rail_js_1.cargoShed.west + 4; x += 31)
        chunks.push(railChunk(decor, x, Math.min(cargo_rail_js_1.cargoShed.west + 4, x + 31)));
    const crossings = cargo_rail_js_1.cargoCrossingSigns.map((_, i) => crossing(decor, i));
    const bridgeRoot = new THREE.Group(), b = new world_batch_js_1.Batches(bridgeRoot);
    decor.add(bridgeRoot);
    railingFrame(b);
    b.flush();
    const shed = new THREE.Group(), shedParts = new world_batch_js_1.Batches(shed), shedSigns = new world_batch_js_1.Panels(shed);
    decor.add(shed);
    for (const f of cargo_rail_js_1.cargoShedSides)
        shedParts.box(f.x, f.h * .5, f.z, f.w, f.h, f.d, '#6d797d');
    const x = (cargo_rail_js_1.cargoShed.west + cargo_rail_js_1.cargoShed.east) * .5, z = cargo_rail_js_1.cargoTrack.z, l = cargo_rail_js_1.cargoShed.east - cargo_rail_js_1.cargoShed.west;
    for (let xx = cargo_rail_js_1.cargoShed.west; xx < cargo_rail_js_1.cargoShed.east; xx += 3.15)
        for (const side of [-1, 1])
            shedParts.box(xx, 2.30, z + side * 2.12, .13, 4.59, .19, steel);
    shedParts.box(x, 4.52, z, l + .30, .19, 4.64, frame);
    shedParts.box(x, 4.67, z, l + .36, .11, 4.75, snow);
    shedParts.box(cargo_rail_js_1.cargoShed.west + .042, 4.18, z, .15, .45, 4.48, steel);
    shedParts.box(cargo_rail_js_1.cargoShed.west + 3.4, 2.05, z, .17, 4.05, 3.99, '#263741');
    shedSigns.place('ЦЕХ 77', () => (0, world_textures_js_1.signTexture)('ЦЕХ 77', 'ГРУЗОВАЯ ВЕТКА', '#e1d5ae', '#4d5a61', 4.2), cargo_rail_js_1.cargoShed.west - .059, 4.21, z, 2.48, .59, -Math.PI * .5);
    shedParts.flush();
    shedSigns.flush();
    const vehicles = cargo_rail_js_1.cargoWagons.map(meta => { const v = rollingStock(meta); v.root.visible = false; stock.add(v.root); return v; });
    let last = NaN;
    return { update(rail, elapsed, focus) {
            const dt = bound01((elapsed - last) * 8);
            last = elapsed;
            const near = Math.abs(focus.z - cargo_rail_js_1.cargoTrack.z) < 185;
            for (const p of chunks)
                p.root.visible = near && Math.abs(p.x - focus.x) < 198;
            bridgeRoot.visible = near && Math.abs(focus.x - cargo_rail_js_1.cargoFootbridge.x) < 160;
            shed.visible = near && Math.abs(focus.x - x) < 178;
            crossings.forEach((c, i) => {
                c.root.visible = near && Math.abs(c.x - focus.x) < 146;
                const closed = rail.closedCrossings[i];
                c.value = Number.isNaN(dt) ? Number(closed) : THREE.MathUtils.lerp(c.value, Number(closed), dt);
                c.arms.forEach(a => {
                    a.pivot.rotation.z = -a.side * Math.PI * .49 * (1 - c.value);
                    a.lights.forEach((bulb, j) => bulb.material = closed && (Math.floor(elapsed * 3.6) & 1) === j ? lampRed : lampIdle);
                });
            });
            vehicles.forEach(({ root, wheels }, i) => {
                const p = rail.poses[i];
                root.visible = !!p && !p.inShed && near && Math.abs(focus.x - p.x) < 160;
                if (!root.visible)
                    return;
                root.position.set(p.x, p.y, p.z);
                root.rotation.z = p.pitch;
                for (const w of wheels)
                    w.rotation.z = -rail.position / .34;
            });
        } };
}
const bound01 = (x) => Math.min(1, Math.max(0, x));
