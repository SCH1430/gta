"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distantWalker = distantWalker;
exports.distantAppearance = distantAppearance;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_complexion_js_1 = require("./human-complexion.js");
const human_wardrobe_js_1 = require("./human-wardrobe.js");
const human_head_shapes_js_1 = require("./human-head-shapes.js");
const human_head_js_1 = require("./human-head.js");
const human_headwear_js_1 = require("./human-headwear.js");
const locomotion_poses_js_1 = require("./locomotion-poses.js");
const torso = 0, leftLeg = 1, rightLeg = 4, leftArm = 7, rightArm = 9, pelvis = 11, head = 12;
const boneCount = 13;
const steps = 16;
const atlases = new Map();
function distanceMaterial(id) {
    const existing = atlases.get(id);
    if (existing)
        return existing;
    const source = (0, human_complexion_js_1.complexion)(id).map.image, w = 96, h = 96;
    const bytes = new Uint8Array(w * 2 * h * 4).fill(255), pixels = source.data;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const sx = Math.floor((x + .5) * source.width / w), sy = Math.floor((y + .5) * source.height / h);
            const at = 4 * (sy * source.width + sx);
            bytes.set(pixels.subarray(at, at + 4), 4 * (y * w * 2 + x));
        }
    const mat = new T.MeshLambertMaterial({ map: (0, human_albedo_js_1.rgbaTexture)(bytes, w * 2, h), vertexColors: true, side: T.DoubleSide });
    atlases.set(id, mat);
    return mat;
}
function distantWalker(role, variant, look, shoulderWidth, fit) {
    const tailoring = fit ?? (0, human_wardrobe_js_1.appearance)(role, variant);
    const { feminine: female, hipWidth: hips, cut: outfit, style: { kit }, build, thick: heavy, parka, long } = tailoring;
    const pos = [], colors = [], index = [], bones = [], uv = [];
    const ink = new T.Color();
    function loft(bone, color, sections, sides = 8, rounding = 1) {
        const start = pos.length / 3;
        ink.set(color);
        for (const [y, rx, rz, z = 0, x = 0] of sections) {
            for (let i = 0; i < sides; i++) {
                const angle = i * Math.PI * 2 / sides;
                const c = Math.cos(angle), s = Math.sin(angle);
                pos.push(x + rx * Math.sign(c) * Math.abs(c) ** rounding, y, z + rz * Math.sign(s) * Math.abs(s) ** rounding);
                colors.push(ink.r, ink.g, ink.b);
                bones.push(bone);
                uv.push(.85, .50);
            }
        }
        const last = start + (sections.length - 1) * sides;
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            for (let row = start; row < last; row += sides) {
                index.push(row + i, row + i + sides, row + next, row + next, row + i + sides, row + next + sides);
            }
            if (i > 0 && i < sides - 1) {
                if (bone === pelvis || bone === torso || bone === head || bone === leftLeg + 2 || bone === rightLeg + 2 || bone === leftArm + 1 || bone === rightArm + 1)
                    index.push(start, start + i, start + i + 1);
                if (bone === torso || bone === head)
                    index.push(last, last + i + 1, last + i);
            }
        }
    }
    const hem = .929 + (0, human_wardrobe_js_1.coatLength)(role, tailoring), trim = outfit === 'windbreaker', wool = outfit === 'wool';
    const { waist, acrossHip, chest, depth } = tailoring;
    const profile = [[hem, acrossHip + (long ? .025 : parka ? .023 : .016), long ? .173 : parka ? .165 : .150, .011],
        [.966, acrossHip, long ? .152 : .142, .010], [1.105, waist, depth - (heavy ? .001 : .014), -.002],
        [1.202, chest - .027, depth + (parka ? .020 : .010), -.003], [1.284, chest + .003, depth + (parka ? .032 : .024), .003],
        [1.326, chest + .005, depth + .015, .010], [1.357, shoulderWidth + .002, depth + .003, .012],
        [1.386, shoulderWidth - .034, .108, .009], [1.410, .112, .089, .010], [1.429, .076, .074, .008]];
    const clothRound = .84;
    loft(torso, look.main, profile, 12, clothRound);
    loft(torso, look.shade, [[hem + .006, profile[0][1] + .001, profile[0][2] + .002, .011],
        [hem + (trim ? .035 : .023), profile[0][1] + .001, profile[0][2] + .002, .011]], 12, clothRound);
    function panel(color, rows, back = false, sections = 0, rise = .007) {
        ink.set(color);
        const first = pos.length / 3;
        const columns = sections || (rows.some(([, a, b]) => Math.abs(b - a) > .14) ? 5 : 2);
        const sampled = [rows[0]];
        for (let j = 1; j < rows.length; j++) {
            const [y0, a0, b0] = rows[j - 1], [y1, a1, b1] = rows[j];
            if (y1 - y0 > .10)
                for (const [y] of profile) {
                    if (y - y0 > .035 && y1 - y > .035) {
                        const t = (y - y0) / (y1 - y0);
                        sampled.push([y, T.MathUtils.lerp(a0, a1, t), T.MathUtils.lerp(b0, b1, t)]);
                    }
                }
            sampled.push(rows[j]);
        }
        for (const [y, a, b] of sampled) {
            let j = 1;
            while (j < profile.length - 1 && profile[j][0] < y)
                j++;
            const lo = profile[j - 1], hi = profile[j], u = T.MathUtils.clamp((y - lo[0]) / (hi[0] - lo[0]), 0, 1);
            const width = T.MathUtils.lerp(lo[1], hi[1], u), depth = T.MathUtils.lerp(lo[2], hi[2], u);
            const z = T.MathUtils.lerp(lo[3] ?? 0, hi[3] ?? 0, u);
            for (let col = 0; col < columns; col++) {
                const x = T.MathUtils.lerp(a, b, col / (columns - 1));
                const cross = Math.max(.015, 1 - Math.abs(x / width) ** (2 / clothRound));
                pos.push(x, y, z + (back ? 1 : -1) * (depth * cross ** (clothRound / 2) + rise));
                colors.push(ink.r, ink.g, ink.b);
                uv.push(.85, .5);
                bones.push(torso);
            }
        }
        for (let row = 1; row < sampled.length; row++)
            for (let col = 0; col < columns - 1; col++) {
                const a = first + (row - 1) * columns + col, b = a + columns;
                if (back)
                    index.push(a, a + 1, b, b, a + 1, b + 1);
                else
                    index.push(a, b, a + 1, b, b + 1, a + 1);
            }
    }
    function hood(color, width, depth, y, columns = 10) {
        ink.set(color);
        const start = pos.length / 3;
        for (let i = 0; i <= columns; i++) {
            const t = i / columns, a = -.45 + t * (Math.PI + .9), shape = y + .084 * Math.sin(Math.PI * t) ** .60;
            for (const [w, d, h] of [[width - .025, depth - .034, shape - .053], [width, depth, shape - .029], [width - .025, depth - .025, shape]]) {
                pos.push(w * Math.cos(a), h, .024 + d * Math.sin(a));
                colors.push(ink.r, ink.g, ink.b);
                uv.push(.85, .50);
                bones.push(torso);
            }
            if (i)
                for (let col = 0; col < 2; col++) {
                    const p = start + (i - 1) * 3 + col;
                    index.push(p, p + 1, p + 4, p, p + 4, p + 3);
                }
        }
    }
    panel(look.shade, [[hem + .014, -.007, .007], [1.08, -.007, .007], [1.245, -.007, .007], [1.405, -.005, .005]]);
    if (role === 'hero') {
        panel(look.main, [[1.257, -.171, .170], [1.281, -.178, .176], [1.337, -.154, .152], [1.385, -.096, .097]], true, 5);
        panel(look.accent, [[1.269, .107, .149], [1.286, .104, .151]], true, 3, .015);
        panel(look.shirt, [[1.181, -.004, .006], [1.285, -.025, .027], [1.389, -.062, .060], [1.426, -.054, .055]], false, 5, .012);
        for (const side of [-1, 1]) {
            const collar = (height, inside, outside) => [height, side < 0 ? -outside : inside, side < 0 ? -inside : outside];
            panel(look.shade, [collar(1.233, .011, .020), collar(1.331, .038, .083), collar(1.407, .064, .111), collar(1.429, .053, .079)], false, 3, .014);
            panel(look.shirt, [collar(1.345, .065, .069), collar(1.402, .027, .082), collar(1.431, .047, .060)], false, 3, .019);
        }
        panel('#434e49', [[1.050, .129, .153], [1.11, .074, .104], [1.19, -.020, .012], [1.270, -.094, -.061], [1.340, -.144, -.111], [1.391, -.151, -.125]]);
    }
    else if (tailoring.style.workJacket) {
        panel(look.shirt, [[1.182, -.008, .010], [1.254, -.035, .039], [1.339, -.062, .059], [1.398, -.070, .069]], false, 5, .012);
        for (const [y, width] of [[1.266, .033], [1.335, .049]])
            panel(look.shade, [[y, -width, width], [y + .009, -width, width]], false, 3, .016);
        for (const side of [-1, 1]) {
            const x = side * .104;
            panel(look.shade, [[.990, x - .041, x + .042], [1.012, x - .046, x + .044], [1.113, x - .046, x + .043]], false, 3, .010);
        }
        panel(look.shade, [[1.190, -.150, -.083], [1.210, -.156, -.078], [1.268, -.153, -.078]], false, 3, .010);
    }
    else if (role === 'mechanic' || outfit === 'workwear') {
        panel(look.pants, [[.966, -.131, .131], [1.060, -.131, .131], [1.171, -.108, .108], [1.261, -.088, .088]]);
        for (const sign of [-1, 1])
            panel(look.pants, [[1.257, sign * .07 - .014, sign * .07 + .014], [1.34, sign * .096 - .014, sign * .096 + .014], [1.39, sign * .094 - .014, sign * .094 + .014]]);
        for (const side of [-1, 1]) {
            panel(look.pants, [[.992, -side * .110 - .014, -side * .110 + .014], [1.182, -side * .010 - .014, -side * .010 + .014], [1.355, side * .098 - .014, side * .098 + .014]], true);
        }
        if (kit === 'garage') {
            panel(look.accent, [[1.245, -.148, .148], [1.270, -.150, .151]], true, 4);
            panel(look.pants, [[1.104, -.092, .095], [1.164, -.106, .104], [1.199, -.073, .074]], true, 3);
        }
        if (kit === 'worksite')
            for (const back of [false, true]) {
                panel(look.accent, [[1.055, -.147, .147], [1.072, -.149, .149]], back, 4);
                for (const side of [-1, 1])
                    panel(look.accent, [[1.077, side * .128 - .014, side * .128 + .014], [1.209, side * .120 - .014, side * .120 + .014], [1.308, side * .129 - .014, side * .129 + .014]], back);
            }
    }
    else if (outfit === 'wool' || role === 'dispatcher') {
        panel(look.shade, [[1.249, -.151, .151], [1.304, -.172, .172], [1.373, -.130, .130]], true);
        for (const sign of [-1, 1])
            panel(look.shade, [[1.160, sign * .005 - .005, sign * .005 + .005], [1.263, sign * .055 - .023, sign * .055 + .023], [1.377, sign * .097 - .016, sign * .097 + .016]]);
        if (kit === 'commuter')
            panel(look.shirt, [[1.103, -.041, .025], [1.212, -.050, .032], [1.353, -.061, .058], [1.418, -.069, .060]], false, 3);
        if (kit === 'dispatch') {
            panel(look.accent, [[1.222, -.125, -.086], [1.256, -.126, -.086]]);
            panel(look.shade, [[1.021, -.128, .127], [1.047, -.126, .129]], true, 3);
        }
    }
    else if (outfit === 'quilted') {
        for (const y of [1.03, 1.109, 1.188, 1.268])
            panel(look.shade, [[y, -.108, .108], [y + .009, -.110, .110]], false, 3);
        if (tailoring.style.scarf) {
            const scarf = tailoring.style.scarf;
            loft(torso, scarf, [[1.367, .104, .096], [1.388, .119, .105], [1.410, .097, .089],
                [1.428, .106, .092], [1.456, .070, .064]], 10, .85);
            panel(scarf, [[1.150, .036, .088], [1.174, .029, .093], [1.260, .009, .076],
                [1.330, -.005, .065], [1.398, -.034, .062]], false, 3, .016);
        }
        else
            hood(look.shade, kit === 'polar' ? .163 : .152, kit === 'polar' ? .191 : .180, 1.383);
        if (kit === 'repair') {
            panel('#3b4945', [[1.012, -.131, .133], [1.095, -.142, .141], [1.218, -.098, .094]], false, 4);
            panel('#675e50', [[1.104, .075, .087], [1.201, -.016, -.004], [1.343, -.129, -.117]], true);
            panel('#675e50', [[1.104, -.087, -.075], [1.201, .004, .016], [1.343, .117, .129]], true);
        }
    }
    else if (tailoring.style.openKnit) {
        panel(look.shade, [[1.170, -.005, .007], [1.328, -.058, .056], [1.423, -.083, .080]], false, 5, .009);
        panel(look.shirt, [[1.191, -.004, .006], [1.329, -.047, .045], [1.425, -.065, .066]], false, 5, .014);
    }
    else if (outfit === 'windbreaker') {
        for (const back of [false, true]) {
            panel(look.shade, [[1.215, -.139, .140], [1.240, -.149, .151], [1.264, -.152, .152]], back);
            panel(look.accent, [[1.150, .088, .114], [1.236, .117, .154], [1.324, .129, .152]], back);
        }
        if (kit === 'messenger') {
            for (const back of [false, true])
                panel(look.accent, [[1.091, .120, .141], [1.238, -.032, -.011], [1.331, -.122, -.101]], back);
            panel('#736959', [[1.003, .054, .133], [1.105, .054, .143], [1.133, .061, .134]], true);
        }
    }
    else if (kit === 'rail') {
        for (const back of [false, true]) {
            panel(look.shade, [[1.197, -.154, .154], [1.275, -.154, .154]], back, 4);
            panel(look.accent, [[1.197, -.154, .154], [1.216, -.154, .154]], back, 4);
        }
    }
    else if (kit === 'canal') {
        loft(torso, look.accent, [[1.367, .123, .103, .008], [1.401, .106, .092, .007], [1.431, .086, .075, .006]], 8);
    }
    loft(torso, look.shirt, [[1.380, .100, .088, .007], [1.421, .092, .082, .007], [1.463, .071, .065, .005]]);
    loft(torso, look.skin, [[1.443, .058, .053, .008], [1.48, .050, .048, .002], [1.522, .052, .055]]);
    const id = (0, human_head_shapes_js_1.identity)(role, variant), form = (0, human_head_shapes_js_1.faceVariant)(role, variant), neckY = 1.439, skin = (0, human_complexion_js_1.skinTint)(form);
    const face = (0, human_head_shapes_js_1.facialGeometry)(id, form, 'distant'), faceStart = pos.length / 3;
    const facePosition = face.getAttribute('position'), faceColor = face.getAttribute('color'), faceUV = face.getAttribute('uv');
    for (let v = 0; v < facePosition.count; v++) {
        pos.push(facePosition.getX(v), neckY + facePosition.getY(v), facePosition.getZ(v) - .008);
        colors.push(faceColor.getX(v) * skin.r, faceColor.getY(v) * skin.g, faceColor.getZ(v) * skin.b);
        uv.push(.5 * faceUV.getX(v), faceUV.getY(v));
        bones.push(head);
    }
    const faceTriangles = face.getIndex();
    for (let i = 0; i < faceTriangles.count; i++)
        index.push(faceStart + faceTriangles.getX(i));
    const angles = [-Math.PI, -2.23, -1.56, -1.06, -.59, -.27, 0, .27, .59, 1.06, 1.56, 2.23, Math.PI];
    const ear = (0, human_head_shapes_js_1.earsFor)(id, form);
    for (const side of [-1, 1]) {
        ink.set(look.skin);
        const c = pos.length / 3;
        const outline = [[0, 0], [-.81, .63], [-.24, .98], [.55, .84], [.97, .19], [.65, -.59], [.06, -.97], [-.62, -.65]];
        for (let j = 0; j < outline.length; j++) {
            const [u, v] = outline[j], y = ear.height + ear.size * (.027 * v + .0022 * u + .0012 * u * v);
            const z = ear.depth + ear.size * ((.0148 + .0028 * v) * u + ear.slope * v - .0029 * v * v);
            const x = (0, human_head_shapes_js_1.skull)(id, side * (Math.PI / 2 + (z - .006) * 10.2), y, form).x;
            pos.push(x + side * (j === 0 ? .003 : .0043 + .48 * ear.flare * u), neckY + y, z - .008);
            const shade = j === 0 ? .67 : 1;
            colors.push(ink.r * shade, ink.g * shade, ink.b * shade);
            uv.push(.85, .50);
            bones.push(head);
        }
        for (let j = 0; j < outline.length - 1; j++) {
            const b = c + 1 + j, e = c + 1 + (j + 1) % (outline.length - 1);
            if (side < 0)
                index.push(c, b, e);
            else
                index.push(c, e, b);
        }
    }
    const hair = role === 'courier' ? '#483b34' : role === 'resident' ? look.hair : ['#322821', '#47372c', '#9b948a', '#38251e'][id];
    const hairStyle = (0, human_head_js_1.haircut)(id, form), hat = (0, human_headwear_js_1.wearableHeadwear)(role, form);
    ink.set(hair);
    const hairRows = 4;
    const hairEnd = hat && hat.cut !== 'earband' ? .72 : 1;
    for (let j = 0; j < hairRows; j++)
        for (let i = 0; i < angles.length; i++) {
            const a = angles[i], t = j / (hairRows - 1) * hairEnd, p = (0, human_head_js_1.hairForm)(id, form, a, t, hat?.cut), k = pos.length / 3;
            pos.push(p.x, neckY + p.y, p.z - .008);
            const sheen = .88 + .23 * t + .092 * Math.sin(a + .4);
            colors.push(ink.r * sheen, ink.g * sheen, ink.b * sheen);
            uv.push(.85, .50);
            bones.push(head);
            if (i && j)
                index.push(k - angles.length - 1, k - 1, k, k - angles.length - 1, k, k - angles.length);
        }
    if (hairStyle === 'knot' || hairStyle === 'tail') {
        const h = neckY + (hairStyle === 'knot' ? .161 : .133), knot = hairStyle === 'knot';
        loft(head, hair, [[h - .031, .014, .016, .099], [h - .012, knot ? .030 : .022, .028, .106], [h + .018, knot ? .034 : .024, .029, .113], [h + .039, .012, .012, .098]], 7);
    }
    const hatGeometry = (0, human_headwear_js_1.headwearGeometry)(role, id, form, false);
    if (hatGeometry) {
        const position = hatGeometry.getAttribute('position'), color = hatGeometry.getAttribute('color'), start = pos.length / 3;
        for (let v = 0; v < position.count; v++) {
            pos.push(position.getX(v), neckY + position.getY(v), position.getZ(v) - .008);
            colors.push(color.getX(v), color.getY(v), color.getZ(v));
            uv.push(.85, .50);
            bones.push(head);
        }
        const triangles = hatGeometry.getIndex();
        for (let i = 0; i < triangles.count; i++)
            index.push(start + triangles.getX(i));
    }
    const scale = (0, human_head_shapes_js_1.headScale)(role, form);
    for (let v = 0; v < bones.length; v++)
        if (bones[v] === head) {
            const j = v * 3;
            pos[j] *= scale.x;
            pos[j + 1] = neckY + (pos[j + 1] - neckY) * scale.y;
            pos[j + 2] = -.008 + (pos[j + 2] + .008) * scale.z;
        }
    if (role === 'hero') {
        panel('#48554f', [[1.049, .142, .167], [1.135, .064, .092], [1.236, -.024, .005], [1.324, -.102, -.073], [1.392, -.153, -.128]], true);
        loft(torso, '#5e6356', [[.954, .073, .033, .141, .143], [.977, .105, .047, .154, .140],
            [1.096, .104, .047, .153, .137], [1.135, .081, .039, .145, .136]], 8, .62);
        loft(torso, '#454d46', [[1.002, .081, .012, .197, .142], [1.015, .100, .015, .199, .141],
            [1.094, .095, .014, .199, .137]], 8, .65);
    }
    else if (kit === 'transit') {
        loft(torso, look.shade, [[1.008, .078, .048, .153], [1.048, .118, .064, .165], [1.223, .119, .058, .170], [1.302, .083, .036, .155]], 6);
    }
    const { leg: legSize, arm: armSize } = (0, human_wardrobe_js_1.limbFit)(role, tailoring);
    loft(pelvis, look.pants, [[.810, .084, .061, .014], [.838, hips + .052, .085, .014],
        [.882, hips + .074, .113, .015], [.940, hips + .075, .108, .010], [.975, hips + .049, .091, .007]], 10, .84);
    for (const [side, leg, arm] of [[-1, leftLeg, leftArm], [1, rightLeg, rightArm]]) {
        const hip = side * hips, sx = side * shoulderWidth;
        const fitRings = (rows, scale) => rows.map(([y, w, d, z, x]) => [y, w * scale, d * scale, z, x]);
        const work = role === 'mechanic' ? .013 : outfit === 'workwear' || role === 'hero' ? .009 : wool ? .005 : 0;
        const straight = role === 'hero' || wool || outfit === 'waxed' || kit === 'worksite';
        const cuffWidth = straight ? .064 : role === 'vendor' || trim ? .049 : .055;
        const cuffY = straight ? .106 : .137;
        loft(leg, look.pants, fitRings([[cuffY, cuffWidth, cuffWidth + .016, .004, hip],
            [cuffY + .023, cuffWidth + .004, cuffWidth + .016, -.001, hip + side * .002],
            [.257, .055 + work, .068 + work, .024, hip + side * .004], [.334, .065 + work, .075 + work, .024, hip + side * .004],
            [.401, .061 + work, .069 + work, .008, hip + side * .002], [.461, .058 + work, .065 + work, -.005, hip],
            [.513, .063 + work, .072 + work, -.012, hip], [.568, .063 + work, .074 + work, -.009, hip],
            [.655, .073 + work, .087 + work, -.005, hip + side * .002], [.776, .086, .110, .005, hip + side * .003],
            [.866, .092, .113, .014, hip + side * .003], [.953, .077, .092, .015, hip]], legSize), 8, straight ? .76 : .93);
        const field = role === 'hero', worker = outfit === 'workwear' || kit === 'rail';
        const soleTop = field ? .038 : wool ? .024 : .032;
        const shoeWidth = ((female ? .93 : 1) + build * .061) * (wool ? .91 : trim ? .96 : worker ? 1.065 : 1);
        const sole = [[.000, .048 * shoeWidth, .119, -.044, hip], [soleTop * .68, .055 * shoeWidth, .124, -.044, hip],
            [soleTop, .054 * shoeWidth, .123, -.044, hip]];
        loft(leg + 2, '#30332f', sole.slice(0, 2), 8, .65);
        loft(leg + 2, field ? '#9d8468' : wool ? '#6f5f57' : '#776c56', sole.slice(1), 8, .65);
        const bootColor = tailoring.style.bootColor ?? (field ? '#66564a' : worker ? '#816748' : wool ? '#474247' : trim ? '#4c605e' : '#666452');
        loft(leg + 2, bootColor, [sole[2], [.070, .051 * shoeWidth, .110, -.045, hip - side * .003],
            [.111, .048 * shoeWidth, .070, -.003, hip], [.162, .043 * shoeWidth, .052, .005, hip]], 8, .79);
        const elbow = sx, wrist = elbow + side * .002;
        const sleeve = fitRings([[.879, .033, .039, -.009, wrist], [.930, .041, .048, -.003, wrist],
            [1.001, .053, .056, .006, elbow], [1.054, .050, .054, .011, elbow], [1.090, .049, .054, .014, elbow],
            [1.136, .051, .058, .010, elbow], [1.210, .060, .068, .008, sx + side * .003],
            [1.296, .070, .077, .006, sx + side * .004], [1.334, .065, .069, .002, sx],
            [1.363, .042, .052, .001, sx - side * .009], [1.377, .013, .024, .002, sx - side * .017]], armSize);
        loft(arm, look.main, sleeve, 7);
        if (role === 'hero')
            loft(arm, look.accent, [[.906, .039, .044, -.006, wrist], [.918, .041, .047, -.005, wrist]], 7);
        const hand = role === 'vendor' || (role === 'resident' && (outfit === 'windbreaker' || outfit === 'workwear')) ? look.skin : outfit === 'workwear' ? '#875c3e' : '#44413c';
        loft(arm + 1, hand, [[.765, .010, .019, -.024, wrist], [.790, .017, .037, -.019, wrist],
            [.821, .023, .040, -.016, wrist], [.856, .022, .034, -.012, wrist], [.888, .017, .027, -.010, wrist]], 6);
    }
    const base = new T.BufferGeometry();
    base.setIndex(index);
    base.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    base.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
    base.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    base.userData.humanSurface = true;
    base.computeVertexNormals();
    base.computeBoundingSphere();
    const smooth = T.MathUtils.smoothstep;
    const vertexPalette = new Uint16Array(bones.length);
    const blends = [];
    const blendKeys = new Map();
    function blendIndex(first, second, weight) {
        const amount = Math.round(weight * 255);
        if (amount === 0)
            return first;
        if (amount === 255)
            return second;
        const key = (first * boneCount + second) * 256 + amount;
        let slot = blendKeys.get(key);
        if (slot === undefined) {
            slot = boneCount + blends.length;
            blendKeys.set(key, slot);
            blends.push({ first, second, weight: amount / 255 });
        }
        return slot;
    }
    for (let v = 0; v < bones.length; v++) {
        const bone = bones[v], y = pos[v * 3 + 1];
        let slot = bone;
        if (bone === leftLeg || bone === rightLeg) {
            slot = y > .875 ? blendIndex(bone, pelvis, .30 * smooth(y, .875, .965)) :
                blendIndex(bone + 1, bone, smooth(y, .459, .568));
        }
        else if (bone === leftArm || bone === rightArm) {
            slot = y > 1.295 ? blendIndex(bone, torso, .65 * smooth(y, 1.295, 1.379)) :
                blendIndex(bone + 1, bone, smooth(y, 1.035, 1.130));
        }
        else if (bone === torso && y < 1.12) {
            if (y < .923) {
                // The skirt of the coat follows the passing thigh. The centre seam stays on the pelvis.
                const x = pos[v * 3], thigh = x < 0 ? leftLeg : rightLeg;
                const follow = .62 * (1 - smooth(y, .706, .923)) * smooth(Math.abs(x), .012, .086);
                slot = blendIndex(pelvis, thigh, follow);
            }
            else
                slot = blendIndex(pelvis, torso, smooth(y, .923, 1.12));
        }
        vertexPalette[v] = slot;
    }
    const sourcePositions = base.getAttribute('position').array;
    const sourceNormals = base.getAttribute('normal').array;
    const totalMatrices = boneCount + blends.length;
    function skinMatrices(matrices, output, normals) {
        for (let i = 0; i < blends.length; i++) {
            const { first, second, weight } = blends[i], a = matrices[first].elements, b = matrices[second].elements;
            const out = matrices[boneCount + i].elements;
            for (let j = 0; j < 16; j++)
                out[j] = a[j] + (b[j] - a[j]) * weight;
        }
        for (let v = 0, j = 0; v < vertexPalette.length; v++, j += 3) {
            const m = matrices[vertexPalette[v]].elements;
            const x = sourcePositions[j], y = sourcePositions[j + 1], z = sourcePositions[j + 2];
            output[j] = m[0] * x + m[4] * y + m[8] * z + m[12];
            output[j + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
            output[j + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
            const nx = sourceNormals[j], ny = sourceNormals[j + 1], nz = sourceNormals[j + 2];
            normals[j] = m[0] * nx + m[4] * ny + m[8] * nz;
            normals[j + 1] = m[1] * nx + m[5] * ny + m[9] * nz;
            normals[j + 2] = m[2] * nx + m[6] * ny + m[10] * nz;
        }
    }
    const frames = new Map();
    const matrices = Array.from({ length: totalMatrices }, () => new T.Matrix4());
    const pivot = new T.Vector3(), point = new T.Vector3();
    const rotation = new T.Matrix4();
    function joint(i, parent, x, y, z, angle) {
        rotation.makeRotationX(angle);
        pivot.set(x, y, z);
        rotation.setPosition(point.copy(pivot).sub(pivot.applyMatrix4(rotation)));
        matrices[i].multiplyMatrices(matrices[parent], rotation);
    }
    function bake(key, frame, running, seat) {
        const cycle = frame / steps;
        const pace = running ? 1 : 0, body = (0, locomotion_poses_js_1.cyclePose)(cycle, pace), stance = running ? .265 : .61, stride = running ? .34 : .224;
        const feet = [0, .5].map(offset => {
            const t = (cycle + offset) % 1, grounded = t <= stance;
            const u = grounded ? t / stance : (t - stance) / (1 - stance);
            const wave = (0, locomotion_poses_js_1.swingArc)(u, pace);
            const z = grounded ? (2 * u - 1) * stride : stride * (1 - 2 * (u * u * (3 - 2 * u))) + wave.trail;
            const pitch = grounded ? (0, locomotion_poses_js_1.supportPitch)(u, pace) : wave.pitch;
            const sin = Math.sin(pitch);
            const y = .088 * Math.cos(pitch) + Math.max(locomotion_poses_js_1.heelPivot * sin, locomotion_poses_js_1.toePivot * sin) + (grounded ? 0 : wave.up);
            return { z, y, pitch };
        });
        const bob = seat ? -.275 : Math.min(body.height, ...feet.map(f => f.y + Math.sqrt(Math.max(0, .810 ** 2 - f.z ** 2)) - .904));
        matrices[torso].makeTranslation(seat ? 0 : body.weight, bob, 0);
        matrices[pelvis].copy(matrices[torso]);
        matrices[head].copy(matrices[torso]);
        for (const [i, side, leg, arm] of [[0, -1, leftLeg, leftArm], [1, 1, rightLeg, rightArm]]) {
            const foot = feet[i], vertical = .904 + bob - foot.y, forward = .004 - foot.z;
            const flex = Math.acos(T.MathUtils.clamp((vertical ** 2 + forward ** 2 - 2 * .406 ** 2) / (2 * .406 ** 2), -1, 1));
            const hip = seat ? 2.03 : Math.atan2(forward, vertical) + .5 * flex;
            const knee = seat ? .74 - hip : -flex;
            const x = side * hips, sx = side * shoulderWidth;
            joint(leg, torso, x, .904, .004, hip);
            joint(leg + 1, leg, x, .498, -.002, knee);
            joint(leg + 2, leg + 1, x, .092, .012, (seat ? 0 : foot.pitch) - hip - knee);
            const pose = (0, locomotion_poses_js_1.armPose)(cycle + i * .5, pace);
            joint(arm, torso, sx, 1.333, .004, seat ? 1.04 : pose.swing);
            joint(arm + 1, arm, sx + side * .034, 1.085, .008, seat ? 1.15 : pose.elbow);
        }
        const out = new Float32Array(pos.length), norm = new Float32Array(pos.length);
        skinMatrices(matrices, out, norm);
        const geometry = new T.BufferGeometry();
        geometry.userData.humanSurface = true;
        geometry.setIndex(base.index);
        geometry.setAttribute('color', base.getAttribute('color'));
        geometry.setAttribute('uv', base.getAttribute('uv'));
        geometry.setAttribute('position', new T.BufferAttribute(out, 3));
        geometry.setAttribute('normal', new T.BufferAttribute(norm, 3));
        geometry.computeBoundingSphere();
        frames.set(key, geometry);
        return geometry;
    }
    const coatColors = new Map();
    const garmentFrames = new WeakMap();
    function painted(pose, coat) {
        const tint = Math.max(0, Math.min(2, Math.trunc(coat || 0)));
        if (role !== 'hero' || !tint)
            return pose;
        let variants = garmentFrames.get(pose);
        if (!variants) {
            variants = new Map();
            garmentFrames.set(pose, variants);
        }
        const existing = variants.get(tint);
        if (existing)
            return existing;
        let ink = coatColors.get(tint);
        if (!ink) {
            const src = base.getAttribute('color'), target = src.clone();
            const dyes = require("./human-kits.js").heroCoats[tint].dyes;
            const colors = [look.main, look.shade, look.accent].map((hex, i) => [new T.Color(hex), new T.Color(dyes[i])]);
            for (let i = 0; i < src.count; i++)
                for (const [from, to] of colors) {
                    if (Math.abs(src.getX(i) - from.r) + Math.abs(src.getY(i) - from.g) + Math.abs(src.getZ(i) - from.b) < .001)
                        target.setXYZ(i, to.r, to.g, to.b);
                }
            ink = new T.BufferAttribute(target.array, 3);
            coatColors.set(tint, ink);
        }
        const g = new T.BufferGeometry();
        g.setIndex(pose.index);
        g.setAttribute('position', pose.getAttribute('position'));
        g.setAttribute('normal', pose.getAttribute('normal'));
        g.setAttribute('color', ink);
        g.setAttribute('uv', base.getAttribute('uv'));
        g.boundingSphere = pose.boundingSphere;
        g.userData.humanSurface = true;
        variants.set(tint, g);
        return g;
    }
    const rest = new T.Mesh(base, distanceMaterial(id));
    function cached(frame, running, seat = false) {
        const key = seat ? steps * 2 : (running ? steps : 0) + frame;
        return frames.get(key) ?? bake(key, frame, running, seat);
    }
    function geometry(phase, moving, run = 0, seated = 0, coat = 0) {
        const seat = seated > .52;
        if (!moving && !seat)
            return painted(base, coat);
        const frame = seat ? 0 : Math.round(((phase % 1 + 1) % 1) * steps) % steps;
        return painted(cached(frame, run > .52, seat), coat);
    }
    function rigAnimator(rig) {
        const joints = [rig.spine, rig.hips[0], rig.knees[0], rig.ankles[0],
            rig.hips[1], rig.knees[1], rig.ankles[1], rig.shoulders[0], rig.elbows[0],
            rig.shoulders[1], rig.elbows[1], rig.pelvis, rig.neck];
        const parents = [pelvis, pelvis, leftLeg, leftLeg + 1, pelvis, rightLeg, rightLeg + 1,
            torso, leftArm, torso, rightArm, -1, torso];
        const order = [pelvis, torso, head, leftLeg, leftLeg + 1, leftLeg + 2, rightLeg, rightLeg + 1,
            rightLeg + 2, leftArm, leftArm + 1, rightArm, rightArm + 1];
        const localBind = joints.map(() => new T.Vector3());
        for (const i of order) {
            localBind[i].copy(joints[i].position);
            if (parents[i] >= 0)
                localBind[i].add(localBind[parents[i]]);
        }
        const current = joints.map(() => new T.Matrix4());
        const delta = Array.from({ length: totalMatrices }, () => new T.Matrix4());
        let dynamic;
        function allocate() {
            const geo = new T.BufferGeometry();
            geo.userData.humanSurface = true;
            geo.setIndex(base.index);
            geo.setAttribute('color', base.getAttribute('color'));
            geo.setAttribute('uv', base.getAttribute('uv'));
            for (const key of ['position', 'normal']) {
                geo.setAttribute(key, new T.BufferAttribute(new Float32Array(pos.length), 3).setUsage(T.DynamicDrawUsage));
            }
            geo.boundingSphere = new T.Sphere(new T.Vector3(0, .85, 0), 1.22);
            return geo;
        }
        return (coat = 0) => {
            dynamic ??= allocate();
            for (const i of order) {
                const node = joints[i], p = parents[i], matrix = current[i], bind = localBind[i];
                matrix.compose(node.position, node.quaternion, node.scale);
                if (p >= 0)
                    matrix.premultiply(current[p]);
                const m = delta[i].copy(matrix).elements;
                m[12] -= m[0] * bind.x + m[4] * bind.y + m[8] * bind.z;
                m[13] -= m[1] * bind.x + m[5] * bind.y + m[9] * bind.z;
                m[14] -= m[2] * bind.x + m[6] * bind.y + m[10] * bind.z;
            }
            const positions = dynamic.getAttribute('position');
            const normals = dynamic.getAttribute('normal');
            skinMatrices(delta, positions.array, normals.array);
            positions.needsUpdate = normals.needsUpdate = true;
            return painted(dynamic, coat);
        };
    }
    return { rest, geometry, rigAnimator };
}
const distantOutfits = new Map();
function distantAppearance(role, variant = 0) {
    const n = role === 'resident' ? Math.abs(variant) % 15 : 0, key = role + ':' + n;
    let outfit = distantOutfits.get(key);
    if (!outfit) {
        const fit = (0, human_wardrobe_js_1.appearance)(role, n);
        outfit = distantWalker(role, n, fit.look, fit.shoulderWidth, fit);
        distantOutfits.set(key, outfit);
    }
    return outfit;
}
