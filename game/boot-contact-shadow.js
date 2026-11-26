"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBootContactShadow = createBootContactShadow;
const T = require("../engine/three.module.min.js");
const locomotion_poses_js_1 = require("./locomotion-poses.js");
function createBootContactShadow() {
    const size = 32, pixels = new Uint8Array(size * size * 4).fill(255);
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const dx = (x + .5) / size * 2 - 1, dy = (y + .5) / size * 2 - 1;
            pixels[(y * size + x) * 4 + 3] = Math.round(255 * Math.max(0, 1 - dx * dx - dy * dy) ** 2);
        }
    const texture = new T.DataTexture(pixels, size, size);
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearFilter;
    texture.needsUpdate = true;
    const plane = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const root = new T.Group();
    root.name = 'Тени под подошвами';
    const spots = Array.from({ length: 4 }, () => {
        const material = new T.MeshBasicMaterial({ map: texture, color: 0x101721, transparent: true,
            depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
        const patch = new T.Mesh(plane, material);
        patch.renderOrder = 2;
        root.add(patch);
        return patch;
    });
    function update(boots, scale, floor) {
        for (let leg = 0; leg < 2; leg++) {
            const foot = boots[leg];
            const sinYaw = Math.sin(foot.yaw), cosYaw = Math.cos(foot.yaw);
            const sinPitch = Math.sin(foot.pitch), cosPitch = Math.cos(foot.pitch);
            for (let end = 0; end < 2; end++) {
                const patch = spots[leg * 2 + end];
                const soleZ = end ? locomotion_poses_js_1.toePivot * .75 : locomotion_poses_js_1.heelPivot * .72;
                const forward = (soleZ * cosPitch + locomotion_poses_js_1.soleHeight * sinPitch) * scale;
                const x = foot.x + forward * sinYaw, z = foot.z + forward * cosYaw;
                const y = floor(x, z);
                const clearance = Math.max(0, foot.y + (locomotion_poses_js_1.soleHeight * cosPitch - soleZ * sinPitch) * scale - y);
                const strength = 1 - T.MathUtils.smoothstep(clearance / scale, .008, .23);
                patch.visible = strength > .015;
                if (!patch.visible)
                    continue;
                patch.position.set(x, y + .012, z);
                patch.rotation.y = foot.yaw;
                const spread = scale * (1.0 + .60 * (1 - strength));
                patch.scale.set((end ? .255 : .208) * spread, 1, (end ? .307 : .236) * spread);
                patch.material.opacity = .61 * strength;
            }
        }
    }
    return { root, update };
}
