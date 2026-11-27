"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tramInterior = tramInterior;
exports.rideView = rideView;
const THREE = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_railway_js_1 = require("./world-railway.js");
function breathGlass() {
    const canvas = document.createElement('canvas');
    canvas.width = 192;
    canvas.height = 112;
    const g = canvas.getContext('2d'), im = g.createImageData(192, 112);
    let seed = 1287;
    for (let y = 0; y < 112; y++)
        for (let x = 0; x < 192; x++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const edge = Math.min(x / 19, (191 - x) / 19, y / 14, (111 - y) / 22);
            const n = seed / 4294967296, i = 4 * (192 * y + x);
            im.data[i] = 185;
            im.data[i + 1] = 211;
            im.data[i + 2] = 215;
            im.data[i + 3] = Math.round(3 + Math.max(0, 1 - edge) * 72 * (.48 + .52 * n) + (n > .997 ? 78 : 0));
        }
    g.putImageData(im, 0, 0);
    g.strokeStyle = 'rgba(137,179,191,.35)';
    g.lineWidth = .9;
    for (let i = 0; i < 8; i++) {
        const x = (i * 43 + 7) % 192, y = (i * 19 + 30) % 101;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x - .36, y + 2);
        g.lineTo(x + .5, y + 6 + i % 3);
        g.stroke();
    }
    return (0, world_textures_js_1.texture)(canvas);
}
function tramInterior(parent) {
    const group = new THREE.Group();
    group.name = 'Салон городского трамвая';
    parent.add(group);
    group.visible = false;
    const b = new world_batch_js_1.Batches(group);
    const boards = new THREE.MeshBasicMaterial({color:0xffffff}), boardShape = new THREE.PlaneGeometry(1.20,.24);
    const routeTitles = {'07':'07   ДЕПО — РЫНОК','17Д':'17Д   ДЕПО — МАСТЕРСКИЕ','17Р':'17Р   МАСТЕРСКИЕ — РЫНОК'};
    const textures = new Map();
    let shownLine = '';
    const steel = '#859696', trim = '#40585c', ochre = '#e5b65c';
    b.box(0, .79, 0, 2.34, .16, 10.14, '#707c79');
    b.box(0, 2.79, 0, 2.37, .14, 10.13, '#cdcbb6');
    for (let z = -4.9; z < 5; z += .30)
        b.box(0, .878, z, .67, .008, .016, '#9c9a87');
    const mat = new THREE.MeshBasicMaterial({ map: breathGlass(), transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const pane = new THREE.PlaneGeometry(1.055, .83);
    const doors = [];
    for (const side of [-1, 1]) {
        const x = side * 1.14;
        b.box(x, 2.62, 0, .082, .21, 10.05, '#bad0c6');
        b.beam(side * .78, 2.53, -4.48, side * .78, 2.53, 4.50, .046, ochre);
        for (let i = 0; i < 9; i++) {
            const z = -4.44 + i * 1.12, door = side === 1 && (i === 1 || i === 7);
            if (!door) {
                b.box(x, 1.22, z, .065, .72, 1.115, '#8fa9a4');
                b.box(x, 1.68, z, .093, .07, 1.12, trim);
                const window = new THREE.Mesh(pane, mat);
                window.position.set(x, 2.12, z);
                window.rotation.y = Math.PI / 2;
                group.add(window);
            }
            else {
                for (const dir of [-1, 1]) {
                    const leaf = new THREE.Group(), profiles = new world_batch_js_1.Batches(leaf), at = z + dir * .251;
                    leaf.position.set(x, 0, at);
                    group.add(leaf);
                    doors.push({ leaf, at, side: dir });
                    profiles.box(0, 1.33, 0, .075, .93, .50, '#668e8d');
                    profiles.box(0, 2.12, dir * .232, .075, .72, .047, trim);
                    profiles.box(0, 2.50, 0, .075, .08, .48, trim);
                    profiles.box(-.049, 1.31, dir * .18, .036, .46, .039, ochre);
                    profiles.flush();
                }
            }
            b.box(x, 2.09, z - .557, .080, .89, .061, '#718487');
            if (door || i % 2 !== 1)
                continue;
            const sx = side * .784;
            b.box(sx, .991, z, .27, .25, .34, trim);
            b.box(sx, 1.13, z, .58, .084, .57, steel);
            b.box(sx, 1.21, z, .57, .10, .52, side > 0 ? '#a27554' : '#6c998d');
            b.box(sx, 1.43, z - .253, .56, .42, .078, side > 0 ? '#ab7858' : '#729b91');
            b.box(sx, 1.66, z - .253, .48, .036, .078, trim);
            b.beam(side * .49, .87, z + .29, side * .49, 2.54, z + .29, .036, ochre);
        }
        for (const z of [-3.85, -1.42, .73, 2.94, 4.13]) {
            b.box(side * .78, 2.42, z, .022, .18, .049, steel);
            b.box(side * .78, 2.30, z, .13, .035, .044, ochre);
        }
        b.lamp(side * .48, 2.69, 0, .085, .025, 7.74, '#ffe9bf');
    }
    for (const end of [-1, 1]) {
        const z = end * 5;
        b.box(0, 1.18, z, 2.30, .72, .10, '#72928f');
        b.box(0, 2.54, z, 2.30, .26, .13, trim);
        b.box(0, 2.05, z, .05, .82, .10, '#7a999a');
        b.box(-1.11, 2.03, z, .09, .83, .15, trim);
        b.box(1.11, 2.03, z, .09, .83, .15, trim);
        const board = new THREE.Mesh(boardShape,boards);
        board.position.set(0,2.53,z - end * .09);
        board.rotation.y = end > 0 ? Math.PI : 0;
        group.add(board);
    }
    b.flush();
    return { group, update(value,line = '07') {
            if (!group.visible) return;
            for (const d of doors)
                d.leaf.position.z = d.at + d.side * .43 * value;
            if (line !== shownLine) {
                if (!textures.has(line))
                    textures.set(line,(0, world_textures_js_1.signTexture)(routeTitles[line], 'СЛУЖБА ГОРОДСКИХ ЛИНИЙ', '#ffc678', '#273b3d', 5));
                boards.map = textures.get(line);
                boards.needsUpdate = true;
                shownLine = line;
            }
        } };
}
function rideView(camera, seconds, yaw, pitch = 0, rider) {
    const rail = (0, world_railway_js_1.linePose)(seconds), progress = rider?.entryProgress ?? 1, t = progress * progress * (3 - 2 * progress);
    const door = rider?.entryDoor ?? 3.3, seated = rider?.seat;
    const x = 1.6 + ((seated ? -.78 : -.55) - 1.6) * t, z = door + ((seated ? 1.16 : door < 0 ? -2.1 : 1.22) - door) * t;
    const point = (0, world_railway_js_1.tramLocal)(rail, x, z), height = 1.65 + (seated ? .03 : .39) * t;
    camera.position.set(point.x, height + Math.min(1, Math.abs(rail.speed) / 4) * Math.sin(seconds * 8) * .013, point.z);
    const heading = yaw + rail.yaw - (rider?.boardingYaw ?? rail.yaw);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(-pitch, heading, 0, 'YXZ');
    camera.updateMatrixWorld();
}
