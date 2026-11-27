"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTram = addTram;
const THREE = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_textures_js_1 = require("./world-textures.js");
const world_layout_js_1 = require("./world-layout.js");
const tram_interior_js_1 = require("./tram-interior.js");
const world_railway_js_1 = require("./world-railway.js");
function addTram(scene, b) {
    for (let m = 0; m < world_railway_js_1.trackLength - .01; m += 1.6) {
        const a = (0, world_railway_js_1.railAt)(m), c = (0, world_railway_js_1.railAt)(Math.min(world_railway_js_1.trackLength, m + 1.6)), vx = c.x - a.x, vz = c.z - a.z, ln = Math.hypot(vx, vz);
        const embedded = (a.z >= -52 && a.z <= -40) || a.z > -18;
        if (!embedded)
            b.box(a.x, .043, a.z, 2.5, .086, .25, '#665f60', Math.atan2(vx, vz));
        const railHeight = embedded ? .017 : .105;
        for (const offset of [-.8, .8]) {
            const dx = vz / ln * offset, dz = -vx / ln * offset;
            b.beam(a.x + dx, railHeight, a.z + dz, c.x + dx, railHeight, c.z + dz, embedded ? .040 : .088, '#afb9bb', true);
        }
    }
    for (const offset of [-.8, .8]) {
        let lx = 5 + offset, lz = -31;
        for (let j = 1; j <= 12; j++) {
            const x = 5 + offset - j * .48, z = -31 + j * 1.35;
            b.beam(lx, .15, lz, x, .15, z, .085, '#969fa7', true);
            lx = x;
            lz = z;
        }
    }
    const switchBlade = new THREE.Group();
    switchBlade.userData.dynamicScenery = true;
    switchBlade.position.set(5, .16, -31);
    scene.add(switchBlade);
    const points = new world_batch_js_1.Batches(switchBlade);
    points.beam(-.8, 0, 0, -.64, 0, 2.30, .07, '#c5ccd1', true);
    points.beam(.8, 0, 0, .64, 0, 2.30, .07, '#c5ccd1', true);
    points.flush();
    b.box(7.04, .31, -30.2, .64, .62, .67, '#637177');
    b.box(7.04, .65, -30.2, .70, .08, .73, '#a8b8bd');
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(.31, .18, .13), new THREE.MeshBasicMaterial({ color: 0xf8a658 }));
    indicator.userData.dynamicScenery = true;
    indicator.position.set(7.04, .50, -30.58);
    scene.add(indicator);
    for (const s of world_layout_js_1.tramSupports) {
        b.cyl(s.x, 2.92, s.z, .17, 5.84, '#647580');
        b.beam(s.x, 5.52, s.z, s.wireX, 5.52, s.wireZ, .095, '#748591');
        b.beam(s.x, 4.45, s.z, s.wireX, 5.52, s.wireZ, .065, '#697c88');
    }
    for (let m = 0; m < world_railway_js_1.trackLength; m += 5.5) {
        const a = (0, world_railway_js_1.railAt)(m), c = (0, world_railway_js_1.railAt)(Math.min(m + 5.5, world_railway_js_1.trackLength));
        b.beam(a.x, 5.42, a.z, c.x, 5.42, c.z, .039, '#3d4c5b');
    }
    b.box(7.62, .027, -39.4, 2.05, .052, 10, '#879699');
    for (let z = -44; z < -34.5; z += .42)
        b.box(6.79, .058, z, .19, .012, .20, '#dcc18c');
    b.box(8.92, 1.16, -34.72, .09, 2.32, .09, '#657b7a');
    const boards = new world_batch_js_1.Panels(scene);
    boards.place('depotstop', () => (0, world_textures_js_1.signTexture)('07  КАНАЛЬНЫЙ', 'ПОСАДКА · ДО РЫНКА', '#ffdb97', '#324952', 2.25), 8.92, 2.08, -34.72, 1.13, .49, Math.PI);
    boards.flush();
    b.box(24.20, .32, 24.95, .23, .58, 2.15, '#687a81');
    b.lamp(24.07, .52, 24.95, .028, .115, 1.8, '#e1a06f');
    const vehicle = new THREE.Group();
    vehicle.userData.dynamicScenery = true;
    scene.add(vehicle);
    const exterior = new THREE.Group();
    vehicle.add(exterior);
    const interior = (0, tram_interior_js_1.tramInterior)(vehicle);
    const car = new world_batch_js_1.Batches(exterior), panels = new world_batch_js_1.Panels(exterior);
    const doors = [];
    const headlights = new THREE.InstancedMesh(new THREE.BoxGeometry(.36, .12, .06), new THREE.MeshBasicMaterial(), 4);
    const transform = new THREE.Matrix4();
    for (let i = 0; i < 4; i++) {
        transform.makeTranslation(i % 2 ? .83 : -.83, 1.34, i < 2 ? 5.35 : -5.35);
        headlights.setMatrixAt(i, transform);
    }
    exterior.add(headlights);
    const forwardLamps = new THREE.Color('#fff1be'), rearLamps = new THREE.Color('#df7059');
    let reversed;
    function direction(returning) {
        if (returning === reversed)
            return;
        reversed = returning;
        for (let i = 0; i < 4; i++)
            headlights.setColorAt(i, (i < 2) !== returning ? forwardLamps : rearLamps);
        if (headlights.instanceColor)
            headlights.instanceColor.needsUpdate = true;
    }
    direction(false);
    car.box(0, .74, 0, 2.28, .92, 10.4, '#244b58');
    car.box(0, 1.3, 0, 2.40, .67, 10.55, '#cb7550');
    car.box(0, 1.63, 0, 2.43, .17, 10.55, '#e9c797');
    car.box(0, 2.11, 0, 2.27, 1.06, 10.1, '#243c49');
    car.box(0, 2.8, 0, 2.41, .28, 10.35, '#bfcdc9');
    car.box(0, 2.97, 0, 2.03, .15, 9.9, '#d9ded8');
    car.box(0, 3.13, -1.1, 1.6, .26, 2.1, '#657784');
    for (const side of [-1, 1]) {
        car.box(side * 1.17, 2.1, 0, .06, 1.05, 10.2, '#72838c');
        for (let i = 0; i < 9; i++) {
            const z = -4.44 + i * 1.12;
            const door = i === 1 || i === 7;
            car.box(side * 1.207, door ? 1.77 : 2.15, z, .06, door ? 1.77 : .93, 1.03, door ? '#334b56' : '#223648');
            if (door && side === 1) {
                car.box(1.236, 1.14, z, .032, .073, .86, '#c49d67');
                for (const sign of [-1, 1]) {
                    const panel = new THREE.Group(), leaf = new world_batch_js_1.Batches(panel), center = z + sign * .232;
                    panel.position.z = center;
                    exterior.add(panel);
                    doors.push({ panel, z: center, sign });
                    leaf.box(1.258, 1.75, 0, .047, 1.69, .45, '#53727a');
                    leaf.box(1.288, 2.13, 0, .022, .60, .355, '#91b3b5');
                    leaf.box(1.29, 1.31, sign * .14, .025, .65, .035, '#c5b39a');
                    leaf.flush();
                }
            }
            else {
                car.box(side * 1.247, 2.16, z, .03, .66, .81, door ? '#6d989f' : (i % 3 === 0 ? '#e0bb82' : '#829da1'));
                car.box(side * 1.269, 2.17, z, .03, .70, .038, '#566a74');
                if (door)
                    car.box(side * 1.266, 1.29, z, .03, .9, .047, '#a79e84');
            }
        }
        for (const z of [-3.5, -2.8, 2.8, 3.5])
            car.piece('round', side * 1.02, .46, z, .72, .24, .72, '#303844', 0, Math.PI / 2);
        car.box(side * 1.2, .76, 0, .08, .15, 9.8, '#89a5a4');
        panels.place('line', () => (0, world_textures_js_1.signTexture)('ЛИНИЯ 07', 'ДЕПО · РЫНОК', '#ffce76', '#363d41', 5.1), side * 1.274, 2.13, 0, 1.35, .31, side * Math.PI / 2);
    }
    for (const f of [-1, 1]) {
        car.box(0, 2.14, f * 5.10, 2.23, .94, .11, '#1f3443');
        car.box(0, 1.28, f * 5.27, 2.24, .54, .10, '#b65d41');
        car.box(0, 2.22, f * 5.18, .07, .9, .05, '#788588');
        car.box(0, .66, f * 5.31, 1.85, .2, .16, '#4a5862');
    }
    panels.place('front', () => (0, world_textures_js_1.signTexture)('07  КАНАЛЬНЫЙ', '', '#ffd078', '#352e29', 5.8), 0, 2.58, 5.18, 1.55, .27, 0);
    panels.place('back', () => (0, world_textures_js_1.signTexture)('07  КАНАЛЬНЫЙ', '', '#ffd078', '#352e29', 5.8), 0, 2.58, -5.18, 1.55, .27, Math.PI);
    car.beam(-.34, 3.01, 1.7, -.34, 4.11, .3, .072, '#445864');
    car.beam(.34, 3.01, 1.7, .34, 4.11, .3, .072, '#445864');
    car.beam(-.34, 4.11, .3, -.34, 5.30, 1.6, .068, '#566979');
    car.beam(.34, 4.11, .3, .34, 5.30, 1.6, .068, '#566979');
    car.box(0, 5.33, 1.6, 1.36, .08, .13, '#53616c');
    car.flush();
    panels.flush();
    let lastActive = false;
    return {
        setCabin(inside) { exterior.visible = !inside; interior.group.visible = inside; },
        getPosition() { return vehicle.position; },
        update(seconds) {
            const pose = (0, world_railway_js_1.linePose)(seconds), active = seconds >= 0;
            vehicle.visible = pose.visible;
            vehicle.position.set(pose.x, 0, pose.z);
            vehicle.rotation.y = pose.yaw;
            if (active !== lastActive) {
                indicator.material.color.setHex(active ? 0x96dec2 : 0xf8a658);
                lastActive = active;
            }
            switchBlade.rotation.y = (Math.max(0, Math.min(1, seconds * 2.4)) - 1) * .12;
            interior.update(pose.doors,pose.line);
            direction(pose.phase === 'returning' || pose.phase === 'finished');
            for (const door of doors)
                door.panel.position.z = door.z + pose.doors * door.sign * .40;
            return pose;
        }
    };
}
