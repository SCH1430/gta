"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoadLights = createRoadLights;
const THREE = require("../engine/three.module.min.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const world_layout_js_1 = require("./world-layout.js");
const winter_light_js_1 = require("./winter-light.js");
function reflectedLightTexture() {
    const width = 32, height = 64, data = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
        const v = 2 * (row + .5) / height - 1;
        const ripple = .61 + .23 * Math.sin(row * 1.87) + .15 * Math.sin(row * 3.19);
        for (let col = 0; col < width; col++) {
            const u = 2 * (col + .5) / width - 1, index = (row * width + col) * 4;
            const penumbra = Math.max(0, 1 - u * u - v * v) ** 2;
            const reflected = penumbra * (.29 + .71 * Math.exp(-5 * u * u) * ripple);
            data[index] = data[index + 1] = data[index + 2] = 255;
            data[index + 3] = Math.round(reflected * 112);
        }
    }
    const map = new THREE.DataTexture(data, width, height);
    map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    return map;
}
const brakeInk = new THREE.Color('#ff432c');
const rearInk = new THREE.Color('#b12e27');
const policeBlue = new THREE.Color('#55b3ff');
const policeRed = new THREE.Color('#ff4c40');
const tungsten = new THREE.Color('#ffe0aa');
const led = new THREE.Color('#cedfff');
function dippedLightTexture() {
    const width = 32, height = 32, data = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++)
        for (let col = 0; col < width; col++) {
            const x = (col + .5) * 2 / width - 1, z = (row + .5) * 2 / height - 1, i = (row * width + col) * 4;
            const shape = Math.max(0, 1 - x * x - z * z);
            const alpha = shape * shape * (.67 + shape * .33);
            data.set([255, 255, 255, Math.round(alpha * 76)], i);
        }
    const map = new THREE.DataTexture(data, width, height);
    map.colorSpace = THREE.SRGBColorSpace;
    map.minFilter = map.magFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    return map;
}
const dippedBeam = [
    { distance: 1.55, width: 1.47, length: 3.22, gain: .62 },
    { distance: 4.65, width: 2.12, length: 5.70, gain: .87 },
    { distance: 8.95, width: 3.02, length: 7.70, gain: .61 },
    { distance: 13.4, width: 4.14, length: 8.10, gain: .32 }
];
function createRoadLights(scene) {
    const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ map: reflectedLightTexture(), transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const reflections = new THREE.InstancedMesh(geometry, material, 24);
    reflections.name = 'Блики машин на мокрой дороге';
    reflections.count = 0;
    reflections.frustumCulled = false;
    reflections.renderOrder = 2;
    reflections.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(reflections);
    const beamMaterial = new THREE.MeshBasicMaterial({ map: dippedLightTexture(), transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const beams = new THREE.InstancedMesh(geometry, beamMaterial, dippedBeam.length * 2 * 6);
    beams.name = 'Ближний свет по профилю дороги';
    beams.count = 0;
    beams.frustumCulled = false;
    beams.renderOrder = 2;
    beams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(beams);
    const pose = new THREE.Object3D();
    const ink = new THREE.Color();
    const nearby = [];
    const selected = [];
    function stamp(car, offsetX, offsetZ, width, length, color) {
        const sin = Math.sin(car.yaw), cos = Math.cos(car.yaw);
        const x = car.x + offsetX * cos + offsetZ * sin, z = car.z - offsetX * sin + offsetZ * cos;
        const surface = (0, world_layout_js_1.surfaceAt)(x, z);
        if (surface === 'snow')
            return;
        const grade = (0, world_layout_js_1.groundHeight)(x + sin * .54, z + cos * .54) - (0, world_layout_js_1.groundHeight)(x - sin * .54, z - cos * .54);
        const bank = (0, world_layout_js_1.groundHeight)(x + cos * .45, z - sin * .45) - (0, world_layout_js_1.groundHeight)(x - cos * .45, z + sin * .45);
        if (Math.abs(grade) > .27 || Math.abs(bank) > .20)
            return;
        pose.position.set(x, (0, world_layout_js_1.groundHeight)(x, z) + .057, z);
        pose.rotation.set(-Math.atan(grade / 1.08), car.yaw, Math.atan(bank / .9), 'YXZ');
        pose.scale.set(width, 1, length);
        pose.updateMatrix();
        reflections.setMatrixAt(reflections.count, pose.matrix);
        reflections.setColorAt(reflections.count++, ink.copy(color).multiplyScalar(surface === 'concrete' ? .61 : .92));
    }
    function spill(car) {
        if (car.carriedBy)
            return;
        const spec = vehicle_cabin_js_1.specs[car.police ? 'patrol' : car.kind], color = car.kind === 'van' || car.kind === 'coupe' || car.police ? led : tungsten;
        const sin = Math.sin(car.yaw), cos = Math.cos(car.yaw);
        for (const side of [-1, 1]) {
            if ((side === -1 ? car.systems?.leftLamp : car.systems?.rightLamp) === false)
                continue;
            let lastY = (0, world_layout_js_1.groundHeight)(car.x, car.z);
            for (const { distance, width, length, gain } of dippedBeam) {
                const lateral = side * (spec.w * .65 + distance * .038), ahead = spec.front - distance;
                const x = car.x + lateral * cos + ahead * sin, z = car.z - lateral * sin + ahead * cos, y = (0, world_layout_js_1.groundHeight)(x, z);
                const grade = (0, world_layout_js_1.groundHeight)(x + sin * .72, z + cos * .72) - (0, world_layout_js_1.groundHeight)(x - sin * .72, z - cos * .72);
                const bank = (0, world_layout_js_1.groundHeight)(x + cos * .43, z - sin * .43) - (0, world_layout_js_1.groundHeight)(x - cos * .43, z + sin * .43);
                if (Math.abs(y - lastY) > .68 || Math.abs(grade) > .33 || Math.abs(bank) > .23)
                    break;
                lastY = y;
                const surface = (0, world_layout_js_1.surfaceAt)(x, z);
                pose.position.set(x, y + .067, z);
                pose.rotation.set(-Math.atan(grade / 1.44), car.yaw, Math.atan(bank / .86), 'YXZ');
                pose.scale.set(width, 1, length);
                pose.updateMatrix();
                beams.setMatrixAt(beams.count, pose.matrix);
                beams.setColorAt(beams.count++, ink.copy(color).multiplyScalar(gain * (surface === 'snow' ? .35 : surface === 'asphalt' ? 1 : .76)));
            }
        }
    }
    return (cars, camera, elapsed, quality, isPatrolActive, wet = .72, daylight = 0, focus) => {
        nearby.length = 0;
        selected.length = 0;
        material.opacity = .35 + .65 * Math.max(0, Math.min(1, wet));
        for (const car of cars) {
            const distance = (car.x - camera.position.x) ** 2 + (car.z - camera.position.z) ** 2;
            const own = focus !== undefined && (car.x - focus.x) ** 2 + (car.z - focus.z) ** 2 < 3;
            if (car.lights && (own || distance < (quality === 0 ? 28 : 48) ** 2))
                selected.push({ car, distance: own ? -1 : distance });
            if (distance > (quality === 0 ? 30 : 48) ** 2)
                continue;
            const police = car.police && !!isPatrolActive?.(car);
            if (police || car.lights || car.braking)
                nearby.push({ car, distance, police });
        }
        nearby.sort((a, b) => a.distance - b.distance);
        const flash = (0, winter_light_js_1.patrolFlash)(elapsed);
        reflections.count = 0;
        const limit = Math.min(nearby.length, quality === 0 ? 3 : 8);
        for (let i = 0; i < limit; i++) {
            const { car, police } = nearby[i];
            if (car.lights || car.braking) {
                const spec = vehicle_cabin_js_1.specs[car.police ? 'patrol' : car.kind], color = car.braking ? brakeInk : rearInk;
                for (const side of [-1, 1])
                    stamp(car, side * spec.w * .67, spec.rear + 1.25, .59, car.braking ? 3.36 : 1.9, color);
            }
            if (police && flash)
                stamp(car, 0, .19, 4.1, 5.9, flash === 'blue' ? policeBlue : policeRed);
        }
        reflections.visible = reflections.count > 0;
        if (reflections.count) {
            reflections.instanceMatrix.needsUpdate = true;
            if (reflections.instanceColor)
                reflections.instanceColor.needsUpdate = true;
        }
        beams.count = 0;
        beamMaterial.opacity = (1 - .65 * daylight) * (.76 + .24 * wet);
        selected.sort((a, b) => a.distance - b.distance);
        const beamLimit = Math.min(selected.length, quality === 0 ? 3 : 6);
        for (let i = 0; i < beamLimit; i++)
            spill(selected[i].car);
        beams.visible = beams.count > 0;
        if (beams.count) {
            beams.instanceMatrix.needsUpdate = true;
            if (beams.instanceColor)
                beams.instanceColor.needsUpdate = true;
        }
    };
}
