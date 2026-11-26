"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sculptHand = sculptHand;
exports.sculptBoot = sculptBoot;
const T = require("../engine/three.module.min.js");
const human_fabric_js_1 = require("./human-fabric.js");
const locomotion_poses_js_1 = require("./locomotion-poses.js");
const turn = Math.PI * 2;
const palette = (color) => new T.Color(color);
const mix = T.MathUtils.lerp;
const squareRound = (v, e = .84) => Math.sign(v) * Math.pow(Math.abs(v), e);
const skinMaterial = new T.MeshLambertMaterial({ vertexColors: true });
const gearMaterial = (0, human_fabric_js_1.wovenMaterial)().clone();
gearMaterial.side = T.FrontSide;
class Sculpt {
    side;
    pattern;
    positions = [];
    colors = [];
    uvs = [];
    indices = [];
    wrapPairs = [];
    constructor(side, pattern) {
        this.side = side;
        this.pattern = pattern;
    }
    point(p, color, u = .5, light = 1) {
        const index = this.positions.length / 3;
        this.positions.push(this.side * p[0], p[1], p[2]);
        this.colors.push(color.r * light, color.g * light, color.b * light);
        this.uvs.push(u, (0, human_fabric_js_1.clothV)(this.pattern, p[1]));
        return index;
    }
    triangle(a, b, c, reverse = false) {
        if ((this.side < 0) !== reverse)
            this.indices.push(a, c, b);
        else
            this.indices.push(a, b, c);
    }
    strip(rows, paint, closed = false, reverse = false, cap = false) {
        const count = rows[0].length, stride = closed ? count + 1 : count, start = this.positions.length / 3;
        for (let j = 0; j < rows.length; j++) {
            for (let i = 0; i < stride; i++) {
                const u = i / (closed ? count : count - 1), a = u * turn;
                this.point(rows[j][i % count], paint(j, a), u, .975 + .025 * Math.cos(a + .41 * j));
            }
            if (closed)
                this.wrapPairs.push([start + j * stride, start + j * stride + count]);
            if (!j)
                continue;
            for (let i = 0; i < stride - 1; i++) {
                const a = start + (j - 1) * stride + i, b = a + 1, c = b + stride, d = a + stride;
                this.triangle(a, b, c, reverse);
                this.triangle(a, c, d, reverse);
            }
        }
        const end = rows.length - 1;
        if (cap)
            for (const j of cap === 'first' ? [0] : cap === 'last' ? [end] : [0, end]) {
                const section = rows[j];
                const center = [0, 0, 0];
                for (const p of section) {
                    center[0] += p[0] / count;
                    center[1] += p[1] / count;
                    center[2] += p[2] / count;
                }
                const color = paint(j, 0), root = this.point(center, color);
                for (const p of section)
                    this.point(p, color);
                for (let i = 0; i < count; i++)
                    this.triangle(root, root + 1 + i, root + 1 + (i + 1) % count, reverse !== (j === 0));
            }
    }
    round(profiles, point, paint, segments, cap = true) {
        const rows = profiles.map(r => Array.from({ length: segments }, (_, i) => point(r, i * turn / segments)));
        this.strip(rows, paint, true, profiles[0][0] < profiles[profiles.length - 1][0], cap);
    }
    tube(path, radius, color, segments) {
        const rows = path.map(([x, y, z], j) => {
            const a = path[Math.max(0, j - 1)], b = path[Math.min(path.length - 1, j + 1)];
            const direction = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
            const up = Math.abs(direction.y) < .88 ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1);
            const normal = up.cross(direction).normalize(), bitangent = new T.Vector3().crossVectors(direction, normal);
            return Array.from({ length: segments }, (_, i) => {
                const angle = i * turn / segments, c = radius * Math.cos(angle), s = radius * Math.sin(angle);
                return [x + c * normal.x + s * bitangent.x, y + c * normal.y + s * bitangent.y, z + c * normal.z + s * bitangent.z];
            });
        });
        this.strip(rows, () => color, true);
    }
    mesh(name) {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
        geometry.setAttribute('uv', new T.Float32BufferAttribute(this.uvs, 2));
        geometry.setIndex(this.indices);
        geometry.computeVertexNormals();
        const normals = geometry.getAttribute('normal'), v = new T.Vector3(), w = new T.Vector3();
        for (const [a, b] of this.wrapPairs) {
            v.fromBufferAttribute(normals, a).add(w.fromBufferAttribute(normals, b)).normalize();
            normals.setXYZ(a, v.x, v.y, v.z);
            normals.setXYZ(b, v.x, v.y, v.z);
        }
        geometry.computeBoundingSphere();
        geometry.userData.humanSurface = true;
        const mesh = new T.Mesh(geometry, this.pattern ? gearMaterial : skinMaterial);
        mesh.name = name;
        return mesh;
    }
}
function sculptHand(side, fit, role) {
    const bare = role === 'vendor' || (role === 'resident' && (fit.cut === 'windbreaker' || fit.cut === 'workwear'));
    const work = fit.cut === 'workwear', courier = role === 'hero' || role === 'courier';
    const high = role !== 'resident';
    const size = (fit.feminine ? .93 : 1) + fit.build * .056;
    const skin = palette(fit.look.skin), leather = palette(work ? '#896442' : courier ? '#363d3e' : fit.cut === 'wool' ? '#493d38' : '#514942');
    const tone = bare ? skin : leather;
    const soft = tone.clone().lerp(palette(bare ? '#a96e61' : '#241e1a'), bare ? .25 : .22);
    const seam = tone.clone().multiplyScalar(bare ? .88 : .58);
    const raised = tone.clone().lerp(palette(bare ? '#dfaf97' : work ? '#ba946c' : '#7e8079'), .32);
    const blend = (j, a) => tone.clone().lerp(soft, .50 - .50 * Math.cos(a)).lerp(raised, j >= 3 ? .30 : .08);
    const s = new Sculpt(side, bare ? undefined : 'leather');
    const over = bare ? 1 : 1.086;
    const shape = ([y, w, d, x = 0, z = 0], a) => [
        x + size * over * w * squareRound(Math.cos(a), .87), y, z + size * over * d * squareRound(Math.sin(a), .97)
    ];
    const palm = [
        [-.179, .017, .024, 0, -.010], [-.198, .016, .025, -.002, -.010], [-.216, .019, .030, .001, -.011],
        [-.234, .021, .039, .003, -.012], [-.251, .020, .037, .006, -.010], [-.263, .016, .036, .005, -.010], [-.274, .010, .033, .003, -.010]
    ];
    const palmPoint = (r, a) => {
        const p = shape(r, a), y = r[0];
        const heel = Math.exp(-(((y + .235) / .026) ** 2)) * Math.max(0, -Math.sin(a)) ** 1.8;
        p[0] -= .006 * heel;
        if (y < -.255)
            p[1] += .006 * Math.max(0, Math.sin(a)) ** 2 - .003 * Math.max(0, -Math.sin(a));
        return p;
    };
    s.round(palm, palmPoint, blend, high ? 14 : 12, false);
    const widths = [.0106, .0110, .0102, .0085], ends = [-.317, -.327, -.316, -.301];
    for (let i = 0; i < 4; i++) {
        const z = -.040 + i * .0193 * size, y = ends[i], curl = .018 + i * .0026, w = widths[i];
        const hinge = mix(-.265, y, .48), middle = mix(-.265, y, .73), center = -.002 - curl * .51;
        const rows = [
            [-.253 + i * .002, w * 1.06, w * 1.01, .004, z], [-.267 + i * .002, w, w * 1.00, .006, z],
            [hinge + .004, w * .88, w * .88, .004 - curl * .16, z - .001],
            [hinge - .003, w * .94, w * .91, .001 - curl * .30, z - .002],
            [middle, w * .77, w * .79, center, z - .004],
            [y + .006, w * .75, w * .71, -curl, z - .006], [y, w * .43, w * .49, -curl - .002, z - .006],
            [y - .001, w * .15, w * .18, -curl - .001, z - .006]
        ];
        s.round(rows, shape, blend, high ? 8 : 6, 'last');
        if (bare) {
            const nail = skin.clone().lerp(palette('#dcad9b'), .42);
            const nailRows = [rows[5], rows[6]].map((r, i) => {
                const spread = i ? .36 : .47;
                return [-spread, 0, spread].map(a => { const p = shape(r, a); p[0] += .00065; return p; });
            });
            s.strip(nailRows, () => nail);
        }
        else if (high && courier) {
            const flex = hinge + .002;
            s.tube([[.006, flex, z - .006], [.010, flex - .002, z], [.005, flex, z + .006]], .00135, seam, 4);
        }
    }
    const thumb = [
        [-.219, .013, .011, -.005, -.032], [-.232, .015, .014, -.007, -.042],
        [-.244, .013, .013, -.013, -.051], [-.251, .011, .010, -.020, -.055],
        [-.259, .010, .010, -.026, -.052], [-.270, .007, .007, -.028, -.046], [-.275, .003, .004, -.027, -.044]
    ];
    s.round(thumb, shape, blend, high ? 10 : 8);
    if (bare && high) {
        const nail = skin.clone().lerp(palette('#e5b3a5'), .5);
        const nailRows = thumb.slice(-3).map((r, i) => [-.42 + i * .13, 0, .42 - i * .13].map(a => {
            const p = shape(r, a);
            p[0] += .0005;
            return p;
        }));
        s.strip(nailRows, () => nail);
    }
    if (!bare) {
        const rows = [[-.208, .019, .028, .001, -.010], [-.214, .021, .030, .001, -.010], [-.221, .021, .032, .002, -.011]];
        s.round(rows, shape, (j) => j === 1 ? raised : seam, high ? 12 : 10, false);
        const patch = [palm[2], palm[3], palm[4], palm[5]].map((r, i) => {
            const spread = [.51, .81, .73, .48][i];
            return Array.from({ length: 6 }, (_, j) => { const p = palmPoint(r, mix(-spread, spread, j / 5)); p[0] += .0032; return p; });
        });
        s.strip(patch, (j) => j === 0 || j === 3 ? seam : raised);
        for (const j of [1, 4])
            s.tube(patch.map(row => [row[j][0] + .001, row[j][1], row[j][2]]), .0011, soft, 4);
        if (high && work)
            s.tube([[.023, -.232, -.015], [.027, -.240, -.013], [.028, -.249, -.011]], .0025, palette(fit.style.accent), 4);
    }
    const mesh = s.mesh('winter-glove');
    mesh.userData.outfitDye = bare ? 'none' : 'gloves';
    return mesh;
}
const last = [
    [-.168, .009, -.013, .047], [locomotion_poses_js_1.toePivot, .028, -.013, .056], [-.149, .045, -.009, .068], [-.125, .054, -.006, .071],
    [-.096, .058, -.005, .078], [-.062, .055, -.003, .101], [-.026, .049, -.002, .139],
    [.010, .046, 0, .154], [.046, .044, .001, .146], [locomotion_poses_js_1.heelPivot, .030, .001, .118], [.081, .010, .001, .088]
];
function sectionAt(z) {
    const i = last.findIndex(q => z < q[0]), next = i < 0 ? last.length - 1 : Math.max(1, i), b = last[next], a = last[next - 1];
    const u = T.MathUtils.clamp((z - a[0]) / (b[0] - a[0]), 0, 1);
    return { width: mix(a[1], b[1], u), offset: mix(a[2], b[2], u), top: mix(a[3], b[3], u) };
}
function sculptBoot(side, fit, role) {
    const high = role !== 'resident', field = role === 'hero', worker = fit.cut === 'workwear' || fit.style.kit === 'rail', city = fit.cut === 'wool', sport = fit.cut === 'windbreaker', weather = !field && !city && !sport && !worker;
    const size = (fit.feminine ? .93 : 1) + fit.build * .061;
    const s = new Sculpt(side, 'boot');
    const rubber = palette('#30332f'), welt = palette(field ? '#9d8468' : city ? '#6f5f57' : sport ? '#8e8b7e' : '#776c56');
    const upper = palette(fit.style.bootColor ?? (field ? '#66564a' : worker ? '#816748' : city ? '#474247' : sport ? '#4c605e' : '#666452'));
    const toecap = upper.clone().lerp(palette('#333535'), worker ? .72 : .35);
    const quarter = upper.clone().lerp(palette('#23282a'), city ? .28 : .46);
    const trim = upper.clone().lerp(palette('#b4a489'), worker ? .48 : .31);
    const liner = palette(city ? '#40332f' : sport ? '#303938' : '#3d3731');
    const outsoleHeight = field ? .038 : city ? .024 : .032;
    const sideScale = city ? .91 : sport ? .96 : worker ? 1.065 : 1;
    function bottom(z) { return outsoleHeight + .004 * Math.max(0, (locomotion_poses_js_1.toePivot - z) / .006); }
    function uppers(z, angle, lift = 0) {
        const { width, offset, top } = sectionAt(z), flat = bottom(z), above = Math.sin(angle), cross = Math.cos(angle);
        const y = above >= 0 ? flat + (top - flat) * Math.pow(above, worker ? .67 : .85) : flat + above * .004;
        return [(offset + (width - .003) * sideScale * squareRound(cross, .85)) * size, y + lift, z];
    }
    const footOutline = [...last.map(r => [r, 1]), ...last.slice().reverse().map(r => [r, -1])];
    const soleLayers = [[.012, .91], [outsoleHeight * .64, 1], [outsoleHeight - (field ? .011 : .005), 1], [outsoleHeight - .002, 1], [outsoleHeight, .95]];
    s.strip(soleLayers.map(([height, scale]) => footOutline.map(([[z, w, offset], sideSign]) => [
        (offset + sideSign * w * sideScale * scale) * size, height + .005 * Math.max(0, (locomotion_poses_js_1.toePivot - z) / .006), z
    ])), j => j >= (field ? 2 : 3) ? welt : rubber, true, true, true);
    const contact = rubber.clone().multiplyScalar(.69);
    const tread = high ? [-.150, -.125, -.098, -.070, .010, .038, .063] : [-.143, -.112, -.081, .013, .043, .069];
    for (const [i, position] of tread.entries())
        for (const sign of [-1, 1]) {
            const length = i === 0 || i === tread.length - 1 ? .008 : city ? .014 : .017;
            const z = position - (sign > 0 ? .003 : 0), { width, offset } = sectionAt(z);
            const inner = (offset + sign * width * .28) * size, outer = (offset + sign * width * sideScale * 1.017) * size;
            const x0 = Math.min(inner, outer), x1 = Math.max(inner, outer);
            const treadOutline = [
                [x1, z - length * .26], [x1, z + length * .39], [x0 + (x1 - x0) * .20, z + length * .57],
                [x0, z + length * .19], [x0, z - length * .36], [x1 - (x1 - x0) * .32, z - length * .58]
            ];
            const footY = locomotion_poses_js_1.soleHeight + (city && i > 3 ? .001 : 0);
            s.strip([footY, .012 + .21 * outsoleHeight].map(y => treadOutline.map(([x, z]) => [x, y, z])), j => j ? rubber : contact, true, true, 'first');
        }
    for (const z of [locomotion_poses_js_1.toePivot, locomotion_poses_js_1.heelPivot]) {
        const { width, offset } = sectionAt(z), x = offset * size, w = width * size * .70;
        const end = z === locomotion_poses_js_1.toePivot ? -.166 : .080, start = z === locomotion_poses_js_1.toePivot ? -.155 : .068;
        const corners = [[x + w, end], [x + w * .94, start], [x - w * .94, start], [x - w, end]];
        s.strip([locomotion_poses_js_1.soleHeight, .015].map(y => corners.map(([x, z]) => [x, y, z])), () => rubber, true, z === locomotion_poses_js_1.toePivot, true);
    }
    const detail = high ? 16 : 12;
    const cover = last.map(([z]) => Array.from({ length: detail }, (_, i) => uppers(z, i * turn / detail)));
    s.strip(cover, (j, a) => (j < 3 ? toecap : j > 8 ? quarter : upper).clone().lerp(trim, .26 * (1 - Math.abs(Math.sin(a)))), true, false, true);
    const collar = [
        [.096, .047, .055, 0, .006], [.118, .046, .056, 0, .008], [.137, .043, .052, 0, .010],
        [.153, .0415, .050, 0, .011], [.166, .043, .049, 0, .011], [.176, .041, .046, 0, .010]
    ];
    if (sport) {
        collar[4][0] -= .012;
        collar[5][0] -= .010;
    }
    const collarPoint = ([y, w, d, x = 0, z = 0], a) => {
        const along = Math.sin(a), px = (x + w * squareRound(Math.cos(a), .90)) * size;
        return [px, y + (.005 * along + .003 * Math.cos(a * 2)), z + d * along];
    };
    s.round(collar, collarPoint, (j, a) => j >= 4 ? liner : Math.sin(a) > .44 ? quarter : upper, high ? 16 : 12);
    s.round(collar.slice(3, 5).map(([y, w, d, x, z]) => [y + .003, w + .002, d + .002, x, z]), collarPoint, j => j ? liner : trim, high ? 16 : 12, false);
    const arc = high ? 9 : 7;
    for (const [z, color] of [[-.117, worker ? trim : quarter], [.048, trim]]) {
        const seamArc = Array.from({ length: arc }, (_, i) => {
            const a = mix(.07, Math.PI - .07, i / (arc - 1));
            return uppers(z + .007 * Math.sin(a), a, .0024);
        });
        s.tube(seamArc, worker ? .00155 : .0012, color, 4);
    }
    const lace = palette(field ? '#c4b294' : city ? '#766b63' : sport ? '#b4ada0' : '#c3ac86'), eyelet = palette(city ? '#6b6060' : '#535a55');
    const eyeletSegments = 5;
    const span = high ? [-.114, -.094, -.075, -.056, -.041] : [-.111, -.087, -.060, -.040];
    const joins = span.map((z, i) => {
        const a = 1.10 + i * .034, edgeA = uppers(z, a, .005), edgeB = uppers(z, Math.PI - a, .005);
        return { right: edgeA, left: edgeB, y: uppers(z, Math.PI / 2, .007)[1], z };
    });
    for (const k of [-1, 1]) {
        const rows = joins.map(({ z }, i) => {
            const a = k > 0 ? 1.10 + i * .034 : Math.PI - 1.10 - i * .034;
            return [uppers(z, a + .17, .004), uppers(z, a - .17, .004)];
        });
        s.strip(rows, () => quarter, false, true);
        for (const q of joins) {
            const p = k > 0 ? q.right : q.left;
            const ring = [.0023, .0038].map(radius => Array.from({ length: eyeletSegments + 1 }, (_, i) => {
                const a = i * turn / eyeletSegments;
                return [p[0] + radius * Math.cos(a), p[1] + .0008 + radius * .52 * Math.sin(a), p[2] + radius * Math.sin(a)];
            }));
            s.strip(ring, () => eyelet);
        }
    }
    for (let i = 1; i < joins.length; i++) {
        const prev = joins[i - 1], q = joins[i];
        const bridge = uppers((prev.z + q.z) * .5, Math.PI / 2, .0055);
        const under = [bridge[0], bridge[1] - .0026, bridge[2] + .0005];
        s.tube([prev.left, bridge, q.right], sport ? .00145 : .0018, lace, 4);
        s.tube([prev.right, under, q.left], sport ? .00145 : .0017, lace, 4);
    }
    if (high && !city) {
        const q = joins[joins.length - 1], mid = (q.left[0] + q.right[0]) * .5;
        for (const k of [-1, 1])
            s.tube([[mid, q.y + .001, q.z + .001], [mid + k * .012, q.y + .004, q.z + .003],
                [mid + k * .019, q.y + .004, q.z - .002], [mid + k * .013, q.y + .002, q.z - .007], [mid, q.y + .001, q.z + .001]], .00155, lace, 4);
    }
    if (field || worker || weather || sport) {
        const tag = palette(field || worker || sport ? fit.style.accent : '#9a9477');
        s.tube([[-.014, .147, .063], [0, .153, .065], [.014, .147, .063]], high ? .003 : .0025, tag, 4);
    }
    const mesh = s.mesh('lace-up-winter-boot');
    mesh.userData.outfitDye = 'boots';
    return mesh;
}
