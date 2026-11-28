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
const brows = new WeakMap();
const lipMaterials = new Map();
function lipMaterial(id, variant, amount, shape) {
    const base = (0, human_albedo_js_1.featureMaterial)(id, amount, shape);
    if (!variant)
        return base;
    const key = [id, variant, amount, shape].join('/');
    let mat = lipMaterials.get(key);
    if (!mat) {
        mat = base.clone();
        mat.color.copy((0, human_complexion_js_1.skinTint)(variant));
        lipMaterials.set(key, mat);
    }
    return mat;
}
function eyebrows(face, id, variant) {
    const source = face.geometry;
    let points = brows.get(source);
    let live, lastLift = 0;
    return (amount, glance) => {
        const lift = T.MathUtils.clamp(amount, 0, 1);
        if (Math.abs(lift - lastLift) < .035 && (lift || !lastLift))
            return;
        if (!live) {
            if (!points) {
                const eye = (0, human_head_shapes_js_1.eyesFor)(id, variant), rest = source.getAttribute('position');
                points = [];
                for (let i = 0; i < rest.count; i++) {
                    const x = rest.getX(i), y = rest.getY(i), z = rest.getZ(i);
                    if (z > -.049 || y < eye.y + .009 || y > eye.y + .042)
                        continue;
                    const weight = Math.exp(-(((Math.abs(x) - eye.x) / .018) ** 2 + ((y - (eye.y + .021)) / .010) ** 2));
                    if (weight > .03)
                        points.push({ i, x, y, z, weight });
                }
                brows.set(source, points);
            }
            face.geometry = source.clone();
            live = face.geometry.getAttribute('position');
            live.setUsage(T.DynamicDrawUsage);
        }
        const bias = Math.sin(glance) * .18;
        for (const { i, x, y, z, weight } of points) {
            const raise = weight * lift * (1 + Math.sign(x) * bias);
            live.setXYZ(i, x, y + raise * .0055, z - raise * .0015);
        }
        live.needsUpdate = true;
        lastLift = lift;
    };
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
    const brow = eyebrows(face, id, form);
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
    let lastOpen = -1, lastMouth = -1, lastShape = 0;
    return (glance, pitch, blink, mouth, mouthShape = 0, browLift = 0) => {
        gaze(glance, pitch, blink);
        brow(browLift, glance);
        const t = T.MathUtils.clamp(mouth, 0, 1), open = Math.round(t * 5);
        const shape = Math.abs(mouthShape) < .27 ? 0 : Math.sign(mouthShape), changedShape = shape !== lastShape;
        if (lastOpen !== open || changedShape) {
            lips.visible = open !== 0;
            if (lips.visible)
                lips.material = lipMaterial(id, form, open, shape);
            lastOpen = open;
        }
        lastShape = shape;
        if (!open || !changedShape && Math.abs(t - lastMouth) < .035)
            return;
        lastMouth = t;
        for (let i = 0; i < rest.count; i++) {
            const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
            const influence = Math.exp(-((x / .023) ** 2 + ((y - .088) / .011) ** 2));
            live.setXYZ(i, x, y - .0027 * t * influence, z - (.0015 - .0011 * shape) * t * influence);
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
