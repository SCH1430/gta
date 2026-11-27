"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.articulatedEyes = articulatedEyes;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_complexion_js_1 = require("./human-complexion.js");
const human_head_shapes_js_1 = require("./human-head-shapes.js");
const apertures = [
    { width: .0142, upper: .0049, lower: .0029 },
    { width: .0147, upper: .0052, lower: .0032 },
    { width: .0141, upper: .0045, lower: .0028 },
    { width: .0149, upper: .0054, lower: .0032 }
];
const irises = [[101, 78, 59], [97, 106, 86], [85, 101, 111], [96, 72, 53]];
const sclera = [165, 153, 142], corners = [135, 103, 92], darkPupil = [38, 31, 28], light = [209, 198, 183];
const eyeMaterials = new Map();
const lidMaterials = new Map();
const mix = T.MathUtils.lerp;
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const globeWidth = .038, globeHeight = .021;
const cols = 16, line = cols + 1, eyeRows = 6;
const lidRows = [0, .10, .29, .56, 1];
function eyeMaterial(id) {
    let mat = eyeMaterials.get(id);
    if (mat)
        return mat;
    const colors = irises[id], tileWidth = 112, w = tileWidth * 2, h = 80, data = new Uint8Array(w * h * 4);
    const reference = (0, human_complexion_js_1.complexion)(id).map.image;
    for (let side = 0; side < 2; side++)
        for (let j = 0; j < h; j++)
            for (let i = 0; i < tileWidth; i++) {
                const x = (i / (tileWidth - 1) - .5) * globeWidth, y = (j / (h - 1) - .5) * globeHeight;
                const radius = Math.hypot(x, y), a = Math.atan2(y, x);
                const iris = 1 - smooth(radius, .0048, .0059), pupil = 1 - smooth(radius, .0020, .0026);
                const edge = smooth(radius, .00405, .0057);
                const rays = .54 * Math.sin(a * 37 + radius * 185) + .31 * Math.sin(a * 59 - radius * 340) + .15 * Math.cos(a * 81);
                const warmth = .80 * smooth(Math.abs(x), .0045, .016);
                const shade = .73 + .27 * smooth(y, -.0026, .0029);
                const highlight = (1 - smooth(Math.hypot((x + .00145) * .82, y + .0015), .00022, .00074)) * .51;
                const soft = (1 - smooth(Math.hypot(x - .0019, y + .0006), .00026, .00132)) * .12;
                const catchlight = Math.min(1, highlight + soft), p = (j * w + side * tileWidth + i) * 4;
                const [cx, cy] = human_complexion_js_1.eyeCenters[id][side];
                const px = cx + x * 2250, py = cy + y * 1250, ix = Math.floor(px), iy = Math.floor(py);
                const src = (iy * reference.width + ix) * 4, below = src + reference.width * 4;
                const photographic = .85 * (1 - smooth(Math.abs(y), .0018, .0041)) * (1 - smooth(Math.abs(x), .0063, .0108));
                for (let c = 0; c < 3; c++) {
                    const white = mix(sclera[c], corners[c], warmth) * shade;
                    const rim = mix(colors[c] + rays * 15, colors[c] * .66, edge) * shade;
                    const dark = mix(rim, darkPupil[c], pupil);
                    const surface = mix(mix(white, dark, iris), light[c], catchlight);
                    const photo = mix(mix(reference.data[src + c], reference.data[src + 4 + c], px - ix), mix(reference.data[below + c], reference.data[below + 4 + c], px - ix), py - iy);
                    data[p + c] = clamp(mix(surface, photo, photographic), 0, 255);
                }
                data[p + 3] = 255;
            }
    mat = new T.MeshLambertMaterial({ map: (0, human_albedo_js_1.rgbaTexture)(data, w, h), vertexColors: true });
    eyeMaterials.set(id, mat);
    return mat;
}
function eyelidMaterial(id, variant) {
    const key = id * 32 + variant;
    let mat = lidMaterials.get(key);
    if (!mat) {
        mat = (0, human_complexion_js_1.complexion)(id, false, variant, true).clone();
        mat.vertexColors = true;
        lidMaterials.set(key, mat);
    }
    return mat;
}
function articulatedEyes(face, id, variant) {
    const data = new human_head_shapes_js_1.Surface(), lids = new human_head_shapes_js_1.Surface();
    const eyes = [], tissue = [];
    const iris = (0, human_head_shapes_js_1.eyesFor)(id, variant), shape = apertures[id];
    const tint = new T.Color();
    function depth(x, y) { return (0, human_head_shapes_js_1.skull)(id, (0, human_head_shapes_js_1.faceTheta)(id, x, y, variant), y, variant).z; }
    const skew = (iris.slant + .00045) * .72;
    function contours(side, fraction) {
        const taper = Math.max(0, 1 - fraction * fraction) ** .70;
        const mid = iris.y - .00065 + side * clamp(fraction, -1, 1) * skew;
        const upper = mid + shape.upper * taper * (1 - side * fraction * .12);
        const lower = mid - shape.lower * taper * (1 + side * fraction * .08);
        return { lower, upper, taper, seam: mix(lower, upper, .19) };
    }
    for (const side of [-1, 1]) {
        const cx = side * iris.x;
        for (let row = 0; row <= eyeRows; row++)
            for (let i = 0; i <= cols; i++) {
                const across = i / cols * 2 - 1, dx = across * shape.width, x = cx + dx, t = row / eyeRows;
                const { lower, upper, taper, seam } = contours(side, across);
                const y = mix(lower, upper, t), center = iris.y - .0001;
                const dome = .00060 + .00115 * Math.sin(Math.PI * t) * taper;
                const z = depth(x, y) - dome, seamZ = depth(x, seam) - dome;
                const occlusion = 1 - .38 * t ** 4 - .15 * (1 - t) ** 4 - .25 * Math.abs(across) ** 3;
                tint.setRGB(occlusion, occlusion * .98, occlusion * .965);
                const u = .5 + side * .25 + dx / (2 * globeWidth);
                const k = data.vertex(x, y, z, u, .5 + (center - y) / globeHeight, tint);
                eyes.push({ x, u, y, center, z, seam, seamZ });
                if (i && row)
                    data.quad(k - line - 1, k - 1, k, k - line);
            }
        for (const direction of [-1, 1])
            for (let row = 0; row < lidRows.length; row++)
                for (let i = 0; i <= cols; i++) {
                    const f = (i / cols) * 2 - 1, t = lidRows[row];
                    const dx = f * (shape.width + .0090 * t), across = clamp(dx / shape.width, -1, 1), x = cx + dx;
                    const { lower, upper, taper, seam } = contours(side, across);
                    const edge = direction > 0 ? upper : lower, sideBlend = 1 - (1 - t) ** 2;
                    const y = edge + direction * (direction > 0 ? .0115 : .0090) * t;
                    const closed = mix(seam, edge, sideBlend) + direction * (direction > 0 ? .0115 : .0090) * t;
                    const pad = (direction > 0 ? .00060 : .00025) * Math.sin(t * Math.PI);
                    const raised = .00095 * (1 - t) + pad * taper;
                    const z = depth(x, y) - raised - .00022, closedZ = depth(x, closed) - raised - .00022;
                    const theta = (0, human_head_shapes_js_1.faceTheta)(id, x, y, variant);
                    (0, human_head_shapes_js_1.faceInk)(id, variant, theta, x, y, tint);
                    const shadow = taper * (direction > 0 ? 1 : .40) * (1 - smooth(t, 0, direction > 0 ? .18 : .27));
                    tint.r *= 1 - .52 * shadow;
                    tint.g *= 1 - .63 * shadow;
                    tint.b *= 1 - .65 * shadow;
                    const k = lids.vertex(x, y, z, (0, human_head_shapes_js_1.headU)(theta), (human_albedo_js_1.faceTop - y) / human_albedo_js_1.faceHeight, tint);
                    tissue.push({ x, y, z, seam: closed, seamZ: closedZ });
                    if (i && row)
                        lids.quad(k - line - 1, k - 1, k, k - line, direction < 0);
                }
    }
    const mesh = new T.Mesh(data.build(), eyeMaterial(id)), eyelids = new T.Mesh(lids.build(), eyelidMaterial(id, variant));
    mesh.name = 'articulated-eyes';
    eyelids.name = 'anatomical-eyelids';
    const pos = mesh.geometry.getAttribute('position'), uv = mesh.geometry.getAttribute('uv');
    const lidPos = eyelids.geometry.getAttribute('position');
    for (const attribute of [pos, uv, lidPos])
        attribute.setUsage(T.DynamicDrawUsage);
    face.add(mesh, eyelids);
    let lastX = 0, lastY = 0, lastBlink = 0;
    return (glance, pitch, blink) => {
        const x = clamp(Math.sin(glance) * .0041, -.0033, .0033);
        const y = clamp(pitch * .0039, -.00145, .00145), closed = clamp(blink, 0, 1);
        const moveLid = Math.abs(closed - lastBlink) > .018 || closed === 0 && lastBlink !== 0 || closed >= .98 && lastBlink < .98;
        if (!moveLid && Math.abs(x - lastX) < .00010 && Math.abs(y - lastY) < .00010)
            return;
        const shut = moveLid ? closed : lastBlink;
        mesh.visible = shut < .98;
        for (let i = 0; i < eyes.length; i++) {
            const p = eyes[i], py = mix(p.y, p.seam, shut);
            if (moveLid)
                pos.setXYZ(i, p.x, py, mix(p.z, p.seamZ, shut));
            uv.setXY(i, p.u - x / (2 * globeWidth), .5 + (p.center - py + y) / globeHeight);
        }
        if (moveLid) {
            for (let i = 0; i < tissue.length; i++) {
                const p = tissue[i];
                lidPos.setXYZ(i, p.x, mix(p.y, p.seam, shut), mix(p.z, p.seamZ, shut));
            }
            pos.needsUpdate = true;
            lidPos.needsUpdate = true;
            lastBlink = shut;
        }
        uv.needsUpdate = true;
        lastX = x;
        lastY = y;
    };
}
