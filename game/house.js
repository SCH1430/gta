"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHouseDoor = createHouseDoor;
exports.createHouse = createHouse;
const THREE = require("../engine/three.module.min.js");
const interior_view_js_1 = require("./interior-view.js");
const world_batch_js_1 = require("./world-batch.js");
const house_paint_js_1 = require("./house-paint.js");
const world_textures_js_1 = require("./world-textures.js");
const house_furniture_js_1 = require("./house-furniture.js");
const house_layout_js_1 = require("./house-layout.js");
function groundPanel(parent, x, y, z, w, d, map) {
    const mat = new THREE.MeshBasicMaterial({ map });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    plane.position.set(x, y, z);
    plane.rotation.x = -Math.PI / 2;
    parent.add(plane);
}
function swingingDoor(parent, inside) {
    const leaf = new THREE.Group();
    leaf.userData.dynamicScenery = true;
    leaf.name = inside ? 'Дверь во двор' : 'Дверь подъезда № 1';
    const s = inside ? -1 : 1;
    leaf.position.set(inside ? -.16 : house_layout_js_1.houseEntry.x - .70, 0, inside ? 6.89 : house_layout_js_1.houseEntry.z);
    parent.add(leaf);
    const skin = new world_batch_js_1.Batches(leaf);
    const box = (x, y, z, w, h, d, col) => skin.box(s * x, y, s * z, w, h, d, col);
    box(.66, 1.12, 0, 1.32, 2.24, .070, '#3a565c');
    for (const x of [.045, 1.275])
        box(x, 1.12, .044, .058, 2.19, .025, '#607b79');
    for (const y of [.075, .70, 2.175])
        box(.66, y, .045, 1.27, .061, .026, '#657e7a');
    box(.66, 1.56, .046, 1.04, .92, .030, '#263d45');
    box(.66, 1.56, .067, .91, .81, .022, inside ? '#869a9c' : '#987f62');
    for (const x of [.46, .85])
        box(x, 1.55, .082, .026, .84, .022, '#425b5e');
    box(.66, 1.45, .086, .94, .028, .018, '#475e60');
    box(1.12, 1.04, .057, .12, .28, .035, '#a3aba0');
    box(1.12, 1.04, .075, .145, .038, .043, '#d0c8a9');
    box(.66, .35, .045, 1.08, .43, .018, '#82918a');
    for (const x of [.17, 1.15])
        for (const y of [.18, .51])
            box(x, y, .057, .021, .021, .011, '#596568');
    skin.flush();
    return (amount) => { leaf.rotation.y = (inside ? 1 : -1) * 1.48 * Math.max(0, Math.min(1, amount)); };
}
function createHouseDoor(parent) {
    const b = new world_batch_js_1.Batches(parent), p = new world_batch_js_1.Panels(parent), { x, z } = house_layout_js_1.houseEntry;
    b.box(x, 1.15, z - .105, 1.59, 2.38, .16, '#263842');
    p.place('doorway-depth', () => (0, house_paint_js_1.foyerPrint)('portal'), x, 1.13, z - .018, 1.32, 2.25, 0);
    for (const a of [-.736, .736])
        b.box(x + a, 1.17, z + .02, .088, 2.36, .12, '#b0b0a0');
    b.box(x, 2.32, z + .02, 1.55, .094, .12, '#bfc0a9');
    b.box(x, .030, z + .23, 1.75, .055, .57, '#87918a');
    b.box(x, .019, z + .80, 1.50, .029, .48, '#646e70');
    for (let k = 0; k < 7; k++)
        b.box(x, .038, z + .62 + k * .055, 1.40, .015, .016, '#99a3a0');
    b.box(x - 1.32, 1.75, z - .10, .84, .50, .15, '#4f6160');
    p.place('home-address', () => (0, world_textures_js_1.signTexture)('ПОДЪЕЗД 1', 'КАНАЛЬНАЯ, 23', '#f5d39c', '#465953', 1.8), x - 1.32, 1.75, z - .014, .77, .428, 0);
    b.lamp(x - 1.32, 2.04, z, .66, .035, .08, '#f5cf91');
    b.flush();
    p.flush();
    return { update: swingingDoor(parent, false) };
}
function createHouse() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#777c79');
    const sun = new THREE.DirectionalLight('#ffd8af', 1.16);
    sun.position.set(5.2, 7.8, 7.5);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight('#e3e1db', '#928879', 1.44));
    const kitchenLight = new THREE.PointLight('#ffddb1', 8.0, 8, 2);
    kitchenLight.position.set(8.8, 5.65, 1.95);
    scene.add(kitchenLight);
    const rooms = new THREE.Group();
    rooms.name = 'Канальная, 23 · квартира 7';
    rooms.userData.staticScenery = true;
    scene.add(rooms);
    const b = new world_batch_js_1.Batches(rooms), labels = new world_batch_js_1.Panels(rooms);
    const sign = (word, small, x, y, z, w, h, angle = 0, ink = '#d9dbc6', bg = '#46605d') => labels.place('flat-sign' + word + small, () => (0, world_textures_js_1.signTexture)(word, small, ink, bg, w / h), x, y, z, w, h, angle);
    const floor = house_layout_js_1.houseUpper;
    for (const a of house_layout_js_1.housePlan.walls) {
        const w = Math.abs(a.x2 - a.x1) + .16, d = Math.abs(a.z2 - a.z1) + .16, x = (a.x1 + a.x2) / 2, z = (a.z1 + a.z2) / 2;
        b.box(x, 3.12, z, w, 6.50, d, x < 1.66 ? '#cec6ac' : '#cdbda7');
    }
    b.box(3.95, 6.44, .08, 14.64, .20, 14.15, '#d9d4be');
    b.box(-.82, 3.08, 5.96, 4.80, .12, 2.22, '#c5c6b4');
    b.box(-.84, -.07, 5.76, 4.81, .14, 2.53, '#918f83');
    groundPanel(rooms, -.82, .006, 5.78, 4.80, 2.56, (0, house_paint_js_1.floorPrint)('terrazzo', 4.80, 2.56));
    b.box(-.82, floor / 2, -4.8, 4.8, floor, 4.2, '#b0aa92');
    groundPanel(rooms, -.82, floor + .008, -4.77, 4.8, 4.14, (0, house_paint_js_1.floorPrint)('terrazzo', 4.8, 4.14));
    b.box(6.38, floor - .095, .08, 9.52, .19, 13.98, '#a99c88');
    groundPanel(rooms, 6.36, floor + .006, -4.90, 9.46, 3.83, (0, house_paint_js_1.floorPrint)('parquet', 9.46, 3.83));
    groundPanel(rooms, 4.60, floor + .006, 2.06, 5.82, 10.04, (0, house_paint_js_1.floorPrint)('parquet', 5.82, 10.04));
    groundPanel(rooms, 9.33, floor + .006, 2.06, 3.64, 10.04, (0, house_paint_js_1.floorPrint)('tile', 3.64, 10.04));
    groundPanel(rooms, 4.38, floor + .014, 2.75, 3.24, 2.02, (0, house_paint_js_1.rugPrint)());
    const tread = (house_layout_js_1.houseSteps.z2 - house_layout_js_1.houseSteps.z1) / house_layout_js_1.houseSteps.count;
    for (let n = 0; n < house_layout_js_1.houseSteps.count; n++) {
        const z = house_layout_js_1.houseSteps.z2 - (n + .5) * tread, h = (n + 1) * floor / house_layout_js_1.houseSteps.count;
        b.box(-.82, h / 2, z, 4.81, h, tread, n % 3 === 0 ? '#a5a396' : '#acaa9a');
        b.box(-.82, h - .018, z + tread / 2 - .016, 4.75, .038, .046, '#d1c4a4');
        if (n === 0 || n === house_layout_js_1.houseSteps.count - 1)
            b.box(-.82, h + .006, z + tread / 2 - .081, 4.6, .009, .060, '#bd9b60');
    }
    const panel = (x, z, w, d, base) => {
        b.box(x, base + .597, z, w, 1.19, d, '#78968a');
        b.box(x, base + 1.20, z, w + .008, .040, d + .008, '#a5aa89');
        b.box(x, base + .051, z, w + .012, .102, d + .012, '#5f746d');
    };
    for (const x of [-3.205, 1.554]) {
        panel(x, 5.78, .034, 2.56, 0);
        for (let n = 0; n < house_layout_js_1.houseSteps.count; n++) {
            const z = house_layout_js_1.houseSteps.z2 - (n + .5) * tread;
            panel(x, z, .034, tread + .002, (0, house_layout_js_1.houseFloor)(0, z));
        }
        if (x < 0)
            panel(x, -4.77, .034, 4.14, floor);
        else {
            panel(x, -3.27, .034, 1.17, floor);
            panel(x, -6.39, .034, .89, floor);
        }
    }
    panel(-.82, -6.80, 4.81, .044, floor);
    for (const x of [-3.045, 1.39]) {
        b.beam(x, .93, 4.62, x, floor + .91, -2.78, .072, '#8e7051');
        b.beam(x, floor + .91, -2.78, x, floor + .91, -3.58, .072, '#8e7051');
        for (let n = 0; n < house_layout_js_1.houseSteps.count; n += 4) {
            const z = house_layout_js_1.houseSteps.z2 - (n + .5) * tread, h = (0, house_layout_js_1.houseFloor)(0, z);
            b.beam(x, h + .84, z, x + (x < 0 ? -.13 : .13), h + .74, z, .041, '#626b63');
        }
    }
    b.box(-3.05, .99, 5.58, .33, 1.03, 1.67, '#546b67');
    for (let k = 0; k < 4; k++)
        for (let s = 0; s < 2; s++) {
            const z = 5.00 + k * .386, y = .79 + s * .46;
            b.box(-2.87, y, z, .044, .42, .354, k % 3 === 2 ? '#83938a' : '#879b90');
            b.box(-2.84, y + .101, z, .029, .022, .235, '#384d4b');
            b.box(-2.833, y - .064, z + .081, .027, .037, .036, '#baa98c');
        }
    sign('ПОЧТА', '1–8', -2.852, 1.70, 5.55, .77, .24, Math.PI / 2);
    b.box(1.55, 1.50, 5.53, .094, 1.02, 1.30, '#725f48');
    labels.place('foyer-notes', () => (0, house_paint_js_1.foyerPrint)('notice'), 1.49, 1.49, 5.53, 1.17, .87, -Math.PI / 2);
    b.box(-3.04, floor + 1.01, -4.85, .34, 1.45, 1.18, '#81918a');
    for (const z of [-5.13, -4.60]) {
        b.box(-2.85, floor + 1.15, z, .03, .63, .44, '#a2a799');
        b.box(-2.827, floor + 1.26, z, .021, .17, .25, '#4b6566');
        for (let k = 0; k < 4; k++)
            b.lamp(-2.812, floor + .99, z - .135 + k * .082, .018, .029, .034, k === 1 ? '#e3b778' : '#91b7ad');
    }
    for (const x of [-2.98, -2.86])
        b.cyl(x, floor + 2.42, -4.84, .049, 1.46, '#9c9c89');
    for (const y of [1.21, 1.72, 2.17])
        b.box(-3.17, floor + y, -4.87, .043, .067, 1.27, '#74847b');
    function stairLamp(x, y, z) {
        b.box(x, y + .032, z, .78, .105, .28, '#687773');
        b.lamp(x, y - .030, z, .64, .049, .19, '#f4d8a1');
        for (const k of [-1, 1])
            b.box(x + k * .32, y - .014, z, .048, .074, .23, '#85918a');
    }
    stairLamp(-.83, 2.981, 5.99);
    stairLamp(-.81, 6.20, -4.69);
    sign('2', 'ЭТАЖ', -.66, floor + 1.60, -6.798, .79, .87, 0, '#eddbb3', '#506c67');
    sign('КВ. 7  ›', 'НАПРАВО', -.65, floor + .87, -6.79, 1.05, .37);
    b.box(-3.171, floor + 1.67, -3.23, .078, 1.51, .92, '#697d7b');
    b.lamp(-3.124, floor + 1.72, -3.23, .022, 1.34, .77, '#a6bbc3');
    for (const z of [-3.58, -3.23, -2.88])
        b.box(-3.105, floor + 1.71, z, .053, 1.38, .043, '#d4d0b8');
    b.box(-3.095, floor + 1.72, -3.23, .061, .045, .75, '#d2cfb6');
    b.box(-3.074, floor + 1.01, -3.23, .21, .081, .96, '#c4bca3');
    for (const [x, z, w, d] of [[1.65, -4.92, .17, 2.08], [4.26, -2.94, 2.3, .17], [9.47, -2.94, 2.1, .17]]) {
        b.box(x, floor + 2.80, z, w, .89, d, '#c8bba4');
        b.box(x, floor + 2.34, z, w + .074, .081, d + .074, '#9c846a');
    }
    const shades = document.createElement('canvas');
    shades.width = 64;
    shades.height = 64;
    const sh = shades.getContext('2d'), grad = sh.createRadialGradient(32, 32, 4, 32, 32, 32);
    grad.addColorStop(0, 'rgba(36,34,30,.54)');
    grad.addColorStop(.62, 'rgba(42,38,34,.28)');
    grad.addColorStop(1, 'rgba(42,38,34,0)');
    sh.fillStyle = grad;
    sh.fillRect(0, 0, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shades), transparent: true, depthWrite: false });
    const shadowGeo = new THREE.PlaneGeometry(1, 1);
    for (const f of house_layout_js_1.furnishings) {
        const m = new THREE.Mesh(shadowGeo, mat);
        m.position.set(f.x, f.base + .020, f.z);
        m.scale.set(f.w * 1.37, f.d * 1.38, 1);
        m.rotation.x = -Math.PI / 2;
        m.renderOrder = 1;
        rooms.add(m);
    }
    (0, house_furniture_js_1.furnishHouse)(b, labels);
    sign('ВЫХОД', 'КАНАЛЬНАЯ УЛИЦА', -.85, 2.51, 6.93, 1.17, .31, Math.PI, '#d7e8ce', '#4b7365');
    for (const x of [-1.56, -.15])
        b.box(x, 1.15, 6.94, .094, 2.32, .11, '#6d7972');
    b.box(-.85, 2.29, 6.94, 1.47, .09, .11, '#6d7972');
    b.box(-.85, 1.13, 6.963, 1.37, 2.24, .025, '#53616a');
    labels.place('outside-door-glow', () => (0, house_paint_js_1.foyerPrint)('portal'), -.85, 1.13, 6.94, 1.32, 2.23, Math.PI);
    b.flush();
    labels.flush();
    const door = swingingDoor(rooms, true);
    const updateRoom = (0, interior_view_js_1.extraInterior)(scene, rooms);
    return { scene, update(dt, doorOpen, home, cars = [], mission = 0, elapsed = 0, tram = -1, effects = {}) {
            door(doorOpen);
            if (home)
                updateRoom(dt, home, cars, mission, elapsed, tram, effects);
        } };
}
