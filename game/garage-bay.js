"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGarageBay = createGarageBay;
const T = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const world_batch_js_1 = require("./world-batch.js");
const x = world_layout_js_1.buildings.garage.x + world_layout_js_1.buildings.garage.w / 2, z = world_layout_js_1.buildings.garage.z - world_layout_js_1.buildings.garage.d * .27;
function glow() {
    const size = 32, data = new Uint8Array(size * size * 4);
    for (let j = 0; j < size; j++)
        for (let i = 0; i < size; i++) {
            const radial = Math.hypot((i + 0.5) / 16 - 1, (j + 0.5) / 16 - 1);
            const index = (j * size + i) * 4;
            data[index] = data[index + 1] = data[index + 2] = 255;
            data[index + 3] = Math.round(Math.pow(Math.max(0, 1 - radial), 1.7) * 255);
        }
    const texture = new T.DataTexture(data, size, size);
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearFilter;
    texture.needsUpdate = true;
    return texture;
}
function createGarageBay(scene) {
    const lamps = new T.Group(), tools = new T.Group(), map = glow();
    scene.add(lamps, tools);
    const b = new world_batch_js_1.Batches(lamps);
    for (const off of [-1.25, 1.25])
        b.lamp(x + .29, 2.72, z + off, .045, .142, .63, '#ffc983');
    b.lamp(x + .195, 2.82, z, .035, .052, 2.20, '#eed2a0');
    b.lamp(x + .291, 3.20, z, .19, .055, 2.12, '#ffe0a3');
    b.flush();
    const mat = new T.MeshBasicMaterial({ map, color: '#ffb375', transparent: true, opacity: .37, depthWrite: false, blending: T.AdditiveBlending });
    const light = new T.Mesh(new T.PlaneGeometry(7.8, 5.1), mat);
    light.rotation.x = -Math.PI / 2;
    light.position.set(x + 3, .032, z);
    lamps.add(light);
    const toolMat = new T.MeshBasicMaterial({ map, color: '#ffca78', transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    const pulse = new T.Mesh(new T.PlaneGeometry(1.3, 1.3), toolMat);
    tools.add(pulse);
    let change = null;
    return {
        flash(point, time, mode) {
            change = { point: new T.Vector3(point.x, point.y + .71, point.z), time, mode };
            toolMat.color.set(mode === 'paint' ? '#a3dfcd' : '#ffd085');
        },
        update(time, lightOn, camera, daylight = 0) {
            lamps.visible = lightOn;
            mat.opacity = .09 + .42 * T.MathUtils.smoothstep(1 - daylight, .12, .84);
            const age = change ? time - change.time : 0;
            tools.visible = !!change && age >= 0 && age < 1.8;
            if (!tools.visible || !change)
                return;
            pulse.position.copy(change.point);
            pulse.position.x += Math.sin(age * 4) * .7;
            pulse.position.y += Math.sin(age * 9) * .08;
            pulse.quaternion.copy(camera.quaternion);
            pulse.scale.setScalar(change.mode === 'paint' ? 1 + age * .25 : .55 + .20 * Math.cos(age * 24));
            toolMat.opacity = (1 - age / 1.8) * (change.mode === 'paint' ? .44 : .64 + .29 * Math.cos(age * 45));
        },
        clear() { change = null; tools.visible = false; },
    };
}
