"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = void 0;
exports.intercomMount = intercomMount;
exports.createStreetDevices = createStreetDevices;
const THREE = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const world_textures_js_1 = require("./world-textures.js");
exports.stop = { x: 13.8, z: 22 };
function intercomMount(a) {
    return a.id === 24 ? { x: -4.46, y: 1.54, z: 16.70 }
        : { x: a.x - a.w * .22 + .95, y: 1.54, z: a.z + a.d / 2 + .31 };
}
const boardText = {
    delayed: ['Рейс задержан.', 'Обогрев включён'], approaching: ['07 · Прибывает', 'ЛИНИЯ · ВОСТОЧНАЯ'],
    platform: ['07 · Посадка', 'КОНЕЧНАЯ · ВОСТОЧНАЯ'], returning: ['07 · В депо', 'Обогрев включён'],
    finished: ['Рейсы окончены', 'УТРЕННИЙ РЕЙС · 05:40']
};
function boardFace(phase) {
    const [heading, sub] = boardText[phase];
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    c.fillStyle = '#252d2c';
    c.fillRect(0, 0, 512, 128);
    c.fillStyle = '#414239';
    for (let x = 3; x < 512; x += 6)
        for (let y = 3; y < 128; y += 6)
            c.fillRect(x, y, 2, 2);
    c.textBaseline = 'middle';
    c.fillStyle = phase === 'delayed' ? '#ffc76b' : '#ffe298';
    c.shadowBlur = 4;
    c.shadowColor = '#eb9c41';
    c.font = 'bold 51px K77Display';
    c.fillText(heading, 16, 43, 480);
    c.shadowBlur = 0;
    c.font = 'bold 25px K77Body';
    c.fillStyle = '#e8af74';
    c.fillText(sub, 17, 94, 475);
    return (0, world_textures_js_1.texture)(canvas);
}
function createStreetDevices(parent, b) {
    const group = new THREE.Group();
    group.userData.dynamicScenery = true;
    group.name = 'Уличная автоматика';
    parent.add(group);
    const sensors = world_layout_js_1.apartments.map(a => ({ ...intercomMount(a), id: a.id, yaw: 0, pitch: 0, acquired: false }));
    function optic(r, length, offset, color) {
        const geo = new THREE.CylinderGeometry(r, r * .91, length, 12);
        geo.rotateX(Math.PI / 2);
        geo.translate(0, 0, offset);
        const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color }), sensors.length);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.frustumCulled = false;
        group.add(mesh);
        return mesh;
    }
    const barrels = optic(.129, .206, .08, '#657680'), lenses = optic(.093, .030, .196, '#ffffff');
    const disc = document.createElement('canvas');
    disc.width = disc.height = 64;
    const face = disc.getContext('2d'), iris = face.createRadialGradient(32, 32, 2, 32, 32, 31);
    iris.addColorStop(0, '#102121');
    iris.addColorStop(.34, '#1b393c');
    iris.addColorStop(.4, '#e4fffa');
    iris.addColorStop(.69, '#80babc');
    iris.addColorStop(.76, '#c2eee6');
    iris.addColorStop(1, '#8bb8b4');
    face.fillStyle = iris;
    face.fillRect(0, 0, 64, 64);
    face.fillStyle = '#f3fff3';
    face.beginPath();
    face.arc(40, 21, 4, 0, Math.PI * 2);
    face.fill();
    lenses.material.map = (0, world_textures_js_1.texture)(disc);
    const idle = new THREE.Color('#387775'), active = new THREE.Color('#7af3e4');
    const transform = new THREE.Object3D();
    function pose(i) {
        const s = sensors[i];
        transform.position.set(s.x, s.y, s.z);
        transform.rotation.set(-s.pitch, s.yaw, 0, 'YXZ');
        transform.updateMatrix();
        barrels.setMatrixAt(i, transform.matrix);
        lenses.setMatrixAt(i, transform.matrix);
        lenses.setColorAt(i, s.acquired ? active : idle);
    }
    for (let i = 0; i < sensors.length; i++) {
        pose(i);
    }
    const { x, z } = exports.stop;
    const faces = new Map();
    faces.set('delayed', boardFace('delayed'));
    const display = new THREE.Mesh(new THREE.PlaneGeometry(3.10, .77), new THREE.MeshBasicMaterial({ map: faces.get('delayed') }));
    display.position.set(x + .59, 2.28, z - .926);
    display.name = 'Табло маршрута 07';
    group.add(display);
    const heaters = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#663d32' }), 4);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 3; i++) {
        matrix.makeScale(1.91, .037, .026);
        matrix.setPosition(x, .19 + i * .074, z - .082);
        heaters.setMatrixAt(i, matrix);
    }
    matrix.makeScale(2.13, .014, .056);
    matrix.setPosition(x, .040, z + .46);
    heaters.setMatrixAt(3, matrix);
    heaters.name = 'Нагреватели скамьи';
    group.add(heaters);
    b.box(x, .262, z - .112, 2.14, .304, .067, '#3f5058');
    b.box(x, .012, z + .31, 2.29, .024, .53, '#54636a');
    for (const dx of [-.97, -.50, 0, .50, .97])
        b.box(x + dx, .266, z - .058, .035, .295, .034, '#64737a');
    const cold = new THREE.Color('#663e34'), hot = new THREE.Color('#ffb160');
    let previousTime, previousTram;
    let boardPhase = 'delayed';
    let heat = 0, tracking = null, trackedYaw = 0, trackedPitch = 0;
    return {
        state: () => ({ intercom: tracking, intercomYaw: trackedYaw, intercomPitch: trackedPitch, heat,
            board: boardText[boardPhase][0], boardDetail: boardText[boardPhase][1], tramPhase: boardPhase }),
        update(t, tramTime, phase, subject) {
            const dt = previousTime === undefined ? .08 : Math.max(0, Math.min(.15, t - previousTime));
            previousTime = t;
            const response = 1 - Math.exp(-dt * 9);
            tracking = null;
            trackedYaw = 0;
            trackedPitch = 0;
            let nearest = Infinity, changed = false;
            for (let i = 0; i < sensors.length; i++) {
                const s = sensors[i], dx = (subject?.x ?? Infinity) - s.x, dz = (subject?.z ?? Infinity) - s.z;
                const distance = dx * dx + dz * dz;
                const acquired = !!subject && dz > .08 && distance < 38;
                let yaw = 0, pitch = 0;
                if (acquired) {
                    yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -1.15, 1.15);
                    pitch = THREE.MathUtils.clamp(Math.atan2((subject.y ?? 0) + 1.56 - s.y, Math.sqrt(distance)), -.49, .62);
                }
                const ny = s.yaw + (yaw - s.yaw) * response, np = s.pitch + (pitch - s.pitch) * response;
                if (Math.abs(ny - s.yaw) + Math.abs(np - s.pitch) > .00018 || s.acquired !== acquired) {
                    s.yaw = ny;
                    s.pitch = np;
                    s.acquired = acquired;
                    pose(i);
                    changed = true;
                }
                if (acquired && distance < nearest) {
                    nearest = distance;
                    tracking = s.id;
                    trackedYaw = s.yaw;
                    trackedPitch = s.pitch;
                }
            }
            if (changed) {
                barrels.instanceMatrix.needsUpdate = true;
                lenses.instanceMatrix.needsUpdate = true;
                if (lenses.instanceColor)
                    lenses.instanceColor.needsUpdate = true;
            }
            const near = subject ? Math.hypot(subject.x - x, subject.z - z) : Infinity;
            const target = THREE.MathUtils.clamp((6.1 - near) / 3.7, 0, 1);
            heat += (target - heat) * (1 - Math.exp(-dt * 4));
            heaters.material.color.lerpColors(cold, hot, heat);
            if (boardPhase !== phase) {
                boardPhase = phase;
                if (!faces.has(phase))
                    faces.set(phase, boardFace(phase));
                display.material.map = faces.get(phase);
            }
            const bell = previousTram !== undefined && previousTram < 3.7 && tramTime >= 3.7 && tramTime - previousTram <= .55;
            previousTram = tramTime;
            return { bell };
        }
    };
}
