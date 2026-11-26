"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFrostSheets = createFrostSheets;
const T = require("../engine/three.module.min.js");
const world_layout_js_1 = require("./world-layout.js");
const weather_js_1 = require("./weather.js");
const slices = [[-1, -.44], [-.44, .44], [.44, 1]];
function glaze() {
    const w = 96, h = 160, data = new Uint8Array(w * h * 4);
    let seed = 28719;
    for (let v = 0; v < h; v++)
        for (let u = 0; u < w; u++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            const grain = seed / 4294967296, x = 2 * (u + .5) / w - 1, z = 2 * (v + .5) / h - 1;
            const ruts = Math.sin(22 * x + Math.sin(z * 7) * .65) * .40 + .55;
            const lapped = Math.sin(35 * z + 11 * x) + .7 * Math.cos(78 * z - 5 * x);
            const edge = Math.max(0, Math.min(1, 7.6 * (1 - Math.max(Math.abs(x), Math.abs(z))) - .18 + lapped * .12));
            const patch = .48 + ruts * .28 + lapped * .077 + grain * .16;
            const i = (v * w + u) * 4;
            data[i] = 99 + Math.round(patch * 47);
            data[i + 1] = 129 + Math.round(patch * 41);
            data[i + 2] = 151 + Math.round(patch * 38);
            data[i + 3] = Math.round(edge * (138 + patch * 90));
        }
    const map = new T.DataTexture(data, w, h);
    map.colorSpace = T.SRGBColorSpace;
    map.minFilter = map.magFilter = T.LinearFilter;
    map.needsUpdate = true;
    return map;
}
function frostedGlass(p, first, last, map) {
    const pos = [], uv = [], sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
    const subdivisions = 6, runs = 16;
    const append = (u, v) => {
        const width = u * p.across, length = v * p.along * Math.sqrt(Math.max(0, 1 - u * u));
        const x = p.x + width * cos + length * sin, z = p.z - width * sin + length * cos;
        pos.push(x, (0, world_layout_js_1.groundHeight)(x, z) + .041, z);
        uv.push((u + 1) / 2, (v + 1) / 2);
    };
    for (let col = 0; col < subdivisions; col++)
        for (let row = 0; row < runs; row++) {
            const a = first + (last - first) * col / subdivisions, b = first + (last - first) * (col + 1) / subdivisions;
            const c = -1 + 2 * row / runs, d = -1 + 2 * (row + 1) / runs;
            append(a, c);
            append(a, d);
            append(b, c);
            append(b, c);
            append(a, d);
            append(b, d);
        }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geometry.computeBoundingSphere();
    return new T.Mesh(geometry, new T.MeshBasicMaterial({ map, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
}
function createFrostSheets(scene) {
    const group = new T.Group();
    group.name = 'Наледь после мороси';
    scene.add(group);
    const map = glaze();
    const sheets = weather_js_1.frozenRoads.map(road => {
        const strips = slices.map(([a, b]) => frostedGlass(road, a, b, map));
        for (const strip of strips) {
            strip.name = road.name;
            strip.renderOrder = 1;
            group.add(strip);
        }
        return { road, strips };
    });
    return (weather, camera) => {
        group.visible = weather.roadIce > .07;
        if (!group.visible)
            return;
        for (const { road, strips } of sheets) {
            const near = Math.hypot(road.x - camera.position.x, road.z - camera.position.z) < 137;
            for (const [i, strip] of strips.entries()) {
                const strength = (i === 1 ? 1 - .94 * weather.clearedRoad : 1) * weather.roadIce * road.shade * .44;
                strip.visible = near && strength > .014;
                strip.material.opacity = strength;
            }
        }
    };
}
