"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expression = expression;
exports.recolorGarment = recolorGarment;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_eye_js_1 = require("./human-eye.js");
const human_head_shapes_js_1 = require("./human-head-shapes.js");
const human_complexion_js_1 = require("./human-complexion.js");
const parts = new WeakMap();
const lipMaterials = new Map();
function lipMaterial(id, variant, amount) {
    const base = (0, human_albedo_js_1.featureMaterial)(id, amount);
    if (!variant)
        return base;
    const key = [id, variant, amount].join('/');
    let mat = lipMaterials.get(key);
    if (!mat) {
        mat = base.clone();
        mat.color.copy((0, human_complexion_js_1.skinTint)(variant));
        lipMaterials.set(key, mat);
    }
    return mat;
}
function expression(role, _skin, head, variant = 0) {
    let face;
    head.traverse(object => {
        if (object.userData.faceStructure !== undefined)
            face = object;
    });
    if (!face)
        return () => { };
    const id = face?.userData.faceStructure ?? (0, human_head_shapes_js_1.identity)(role, variant);
    const form = (0, human_head_shapes_js_1.faceVariant)(role, variant), gaze = (0, human_eye_js_1.articulatedEyes)(face, id, form);
    let geometry = parts.get(face.geometry);
    if (!geometry) {
        geometry = (0, human_head_shapes_js_1.featureGeometry)(face.geometry);
        parts.set(face.geometry, geometry);
    }
    const lips = new T.Mesh(geometry.clone(), face.material);
    lips.name = 'animated-oral-skin';
    lips.visible = false;
    face.add(lips);
    const live = lips.geometry.getAttribute('position');
    const rest = geometry.getAttribute('position'), base = rest.array;
    live.setUsage(T.DynamicDrawUsage);
    let lastOpen = -1, lastMouth = -1;
    return (glance, pitch, blink, mouth) => {
        gaze(glance, pitch, blink);
        const t = T.MathUtils.clamp(mouth, 0, 1), open = Math.round(t * 5);
        if (lastOpen !== open) {
            lips.visible = open !== 0;
            if (lips.visible)
                lips.material = lipMaterial(id, form, open);
            lastOpen = open;
        }
        if (!open || Math.abs(t - lastMouth) < .035)
            return;
        lastMouth = t;
        for (let i = 0; i < rest.count; i++) {
            const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
            const influence = Math.exp(-((x / .023) ** 2 + ((y - .088) / .011) ** 2));
            live.setXYZ(i, x, y - .0027 * t * influence, z - .0015 * t * influence);
        }
        live.needsUpdate = true;
    };
}
const paletteCache = new WeakMap();
const colors = require("./human-kits.js").heroCoats.map(coat => coat.dyes.map(v => new T.Color(v)));
function recolorGarment(mesh, original, coat) {
    const n = Math.max(0, Math.min(2, Math.floor(coat || 0)));
    if (!n) {
        mesh.geometry = original;
        return;
    }
    let by = paletteCache.get(original);
    if (!by) {
        by = new Map();
        paletteCache.set(original, by);
    }
    let g = by.get(n);
    if (!g) {
        g = original.clone();
        const src = original.getAttribute('color'), dst = g.getAttribute('color');
        for (let i = 0; i < src.count; i++) {
            const index = colors[0].findIndex(c => Math.abs(c.r - src.getX(i)) + Math.abs(c.g - src.getY(i)) + Math.abs(c.b - src.getZ(i)) < .008);
            if (index < 0)
                continue;
            const c = colors[n][index];
            dst.setXYZ(i, c.r, c.g, c.b);
        }
        dst.needsUpdate = true;
        by.set(n, g);
    }
    mesh.geometry = g;
}
