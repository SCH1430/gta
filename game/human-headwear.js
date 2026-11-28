"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wearableHeadwear = wearableHeadwear;
exports.headwearGeometry = headwearGeometry;
exports.workAccessories = workAccessories;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_head_shapes_js_1 = require("./human-head-shapes.js");
const hats = {
    0: { cut: 'rail', main: '#454e51', trim: '#30383c', badge: '#b8a474' },
    1: { cut: 'knit', main: '#815968', trim: '#6d4859', badge: '#c69d86' },
    3: { cut: 'earband', main: '#655479', trim: '#3e3b66', badge: '#9c8184' },
    4: { cut: 'knit', main: '#586873', trim: '#425560', badge: '#a1917a' },
    5: { cut: 'shell', main: '#bd873b', trim: '#493d41', badge: '#e6cf91' },
    6: { cut: 'earflap', main: '#665b56', trim: '#ad9c81', badge: '#817565' },
    7: { cut: 'earflap', main: '#64525a', trim: '#8d7770', badge: '#bc9c87' },
    9: { cut: 'knit', main: '#6f8281', trim: '#556467', badge: '#c8b9a2' },
    10: { cut: 'shell', main: '#546a70', trim: '#3c474a', badge: '#c59b52' },
    12: { cut: 'rail', main: '#576368', trim: '#3d4c4e', badge: '#c47953' },
    13: { cut: 'flat', main: '#78635c', trim: '#594944', badge: '#b79b83' },
    14: { cut: 'earband', main: '#647765', trim: '#415553', badge: '#a9a679' }
};
const serviceCap = { cut: 'flat', main: '#58656f', trim: '#35454f', badge: '#c0a787' };
const messengerCap = { cut: 'knit', main: '#745c3e', trim: '#534431', badge: '#daba7a' };
function wearableHeadwear(role, variant) {
    return role === 'dispatcher' ? serviceCap : role === 'courier' ? messengerCap : role === 'resident' ? hats[variant - 1] : undefined;
}
const threads = new Map();
function threadTrim(color, fleece = false) {
    const key = (color ?? 'fiber') + (fleece ? '/pile' : '');
    let material = threads.get(key);
    if (material)
        return material;
    const w = 80, h = 48, data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const ridges = 2 * Math.PI * x / 8 + Math.sin(2 * Math.PI * y / 8) * .80;
            const fur = .47 * Math.cos(x * 2.81 + y * 1.21) + .30 * Math.sin(x * 1.12 - y * 2.74) + .23 * Math.cos(x * .82 + y * 3.21);
            const light = fleece ? .87 + .12 * fur : .89 + .073 * Math.cos(ridges) + .014 * Math.cos(ridges * 2) + .024 * fur;
            const k = 4 * (y * w + x);
            data[k] = data[k + 1] = data[k + 2] = Math.round(light * 255);
            data[k + 3] = 255;
        }
    const texture = (0, human_albedo_js_1.rgbaTexture)(data, w, h);
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    material = new T.MeshLambertMaterial({ map: texture, color: color ?? '#ffffff', vertexColors: !color });
    threads.set(key, material);
    return material;
}
function addCrown(surface, hat, id, variant, detail) {
    const n = detail ? 36 : 12;
    const main = new T.Color(hat.main), trim = new T.Color(hat.trim), shade = new T.Color();
    const knitted = hat.cut === 'knit', flare = hat.cut === 'earflap', rail = hat.cut === 'rail', shell = hat.cut === 'shell';
    const width = flare ? .106 : rail ? .098 : shell ? .095 : .090;
    const from = flare ? .171 : rail ? .177 : shell ? .177 : knitted ? .179 : .204;
    const peak = flare ? .298 : rail ? .279 : shell ? .286 : knitted ? .288 : .279;
    const profile = [
        { y: from - .002, w: width - .012, d: .097, z: .010, lower: flare ? .052 : 0, front: .012, color: hat.trim },
        { y: from + .007, w: width - .005, d: .106, z: .009, lower: flare ? .046 : 0, front: .010, color: hat.trim },
        { y: from + .022, w: width - .004, d: .112, z: .009, lower: flare ? .016 : 0, front: .008, color: hat.trim, crease: .002 },
        { y: from + .030, w: width - .006, d: .108, z: .008, front: .007, color: rail ? hat.trim : undefined },
        { y: peak - .045, w: width - .003, d: .111, z: .006, front: rail ? .006 : 0 },
        { y: peak - .022, w: width * (rail ? .81 : .78), d: rail ? .097 : .094, z: .009, front: rail ? .007 : 0, crease: rail ? .002 : 0 },
        { y: peak - .007, w: width * (rail ? .55 : .46), d: .069, z: .014, front: rail ? .004 : 0 },
        { y: peak, w: .002, d: .003, z: .018 }
    ];
    const rows = detail ? profile : profile.filter((_, i) => i !== 1 && i !== 3 && i !== 6);
    for (let j = 0; j < rows.length; j++)
        for (let i = 0; i <= n; i++) {
            const a = (i / n - .5) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), row = rows[j];
            const cover = flare ? Math.exp(-(((Math.abs(a) - 1.72) / .57) ** 4)) * .83 + .27 * Math.max(0, -c) : 0;
            const hinge = (detail ? .0019 : 0) * Math.cos(a * 8) * Math.sin(Math.PI * j / (rows.length - 1));
            const slant = (id === 2 ? .0021 : .0018) * s, drape = (hat.cut === 'flat' ? -.007 * c : 0);
            const cuff = knitted ? (1 - j / (rows.length - 1)) * (.005 * Math.max(0, c) - .006 * Math.max(0, -c)) : 0;
            const y = row.y + (row.front ?? 0) * c - (row.lower ?? 0) * cover + slant + drape + cuff;
            const r = row.w + hinge + (row.crease ?? 0) * Math.cos(a * 4);
            const frontDepth = row.d + hinge + ((knitted || shell) ? .002 : 0) * Math.sin(3 * a);
            const p = (0, human_head_shapes_js_1.skull)(id, a, Math.min(.269, y), variant);
            const x = Math.sign(s) * Math.max(r * Math.abs(s), Math.abs(p.x) * 1.06 + Math.abs(s) * .004);
            const bridge = knitted ? .003 * Math.sin(a * 4) * Math.sin(Math.PI * j / (rows.length - 1)) : 0;
            const wrap = flare && j < 3 ? .0038 * cover * Math.cos(a * 19) : 0;
            const z = (row.z ?? 0) - Math.sign(c) * Math.abs(c) ** .85 * (frontDepth + bridge + wrap) - .008 * Math.max(0, -c) * (1 - j / (rows.length - 1));
            shade.copy(row.color ? trim : main);
            if (flare && j < 3)
                shade.multiplyScalar(.94 + .08 * Math.cos(5 * a));
            if (rail && j === 2)
                shade.lerp(main, .38);
            if (shell && j >= 3)
                shade.lerp(trim, .40 * Math.exp(-((s / .178) ** 2)));
            shade.multiplyScalar(.94 + .08 * c + .035 * Math.cos(7 * a));
            const k = surface.vertex(x, y, z, i / n * (knitted ? 9 : 5), j * .32, shade);
            if (i && j)
                surface.quad(k - n - 2, k - 1, k, k - n - 1);
        }
}
function addVisor(surface, hat, detail) {
    const base = hat.cut === 'rail' ? .199 : .209;
    const reach = hat.cut === 'rail' ? .038 : hat.cut === 'shell' ? .023 : .024;
    const n = detail ? 20 : 8, start = surface.p.length / 3;
    const cloth = new T.Color(hat.trim), edge = new T.Color(hat.main).lerp(cloth, .72);
    for (let j = 0; j < 4; j++)
        for (let i = 0; i <= n; i++) {
            const a = (i / n - .5) * 2.10, c = Math.cos(a), s = Math.sin(a);
            const outer = j === 1 || j === 2, extension = outer ? reach * Math.cos(a * Math.PI / 2.1) ** .65 : 0;
            const y = base + (j < 2 ? 0 : -.004) + (outer ? -.013 : 0) + .011 * s * s;
            const x = s * (.093 + extension * .52), z = -c * (.109 + extension) + .006;
            const k = surface.vertex(x, y, z, i / n * 3, j * .49, outer ? edge : cloth);
            if (i && j)
                surface.quad(k - n - 2, k - 1, k, k - n - 1, true);
            if (j === 3 && i)
                surface.quad(k - 1, start + i - 1, start + i, k);
        }
}
function addEarBand(surface, hat, id, variant, detail) {
    const n = detail ? 34 : 12, ink = new T.Color(hat.main), trim = new T.Color(hat.trim);
    const rows = [0, .15, .48, .84, 1];
    for (let j = 0; j < rows.length; j++)
        for (let i = 0; i <= n; i++) {
            const a = (i / n - .5) * Math.PI * 2, side = Math.sin(a), front = Math.cos(a), t = rows[j];
            const y = .172 + .023 * front - .011 * Math.sin(a) ** 2 + (.023 + .001 * Math.cos(2 * a)) * t;
            const p = (0, human_head_shapes_js_1.skull)(id, a, y, variant);
            const d = .0073 + .0056 * Math.sin(Math.PI * t) + .0048 * Math.abs(side) ** 3;
            const k = surface.vertex(p.x + d * side, y, p.z - d * front, i / n * 8, t, j === 0 || j === 4 ? trim : ink);
            if (i && j)
                surface.quad(k - n - 2, k - 1, k, k - n - 1);
        }
}
function addInsignia(surface, hat) {
    const square = (left, right, lower, upper, z, color) => {
        const c = new T.Color(color), a = surface.vertex(left, lower, z, 0, 0, c);
        surface.vertex(right, lower, z, 1, 0, c);
        surface.vertex(right, upper, z, 1, 1, c);
        surface.vertex(left, upper, z, 0, 1, c);
        surface.quad(a, a + 1, a + 2, a + 3, true);
    };
    const x = hat.cut === 'knit' ? .03 : 0, y = hat.cut === 'knit' ? .194 : hat.cut === 'rail' ? .213 : hat.cut === 'flat' ? .242 : .211;
    square(x - .015, x + .015, y - .007, y + .007, -.1135, hat.trim);
    square(x - .012, x + .011, y - .0046, y + .0046, -.114, hat.badge);
    if (hat.cut === 'rail' || hat.cut === 'shell')
        square(x - .006, x + .006, y - .0012, y + .0016, -.1141, hat.main);
}
function headwearGeometry(role, id, variant, detail = true) {
    const hat = wearableHeadwear(role, variant);
    if (!hat)
        return;
    const surface = new human_head_shapes_js_1.Surface();
    if (hat.cut === 'earband') {
        addEarBand(surface, hat, id, variant, detail);
    }
    else {
        addCrown(surface, hat, id, variant, detail);
        if (hat.cut === 'rail' || hat.cut === 'flat' || hat.cut === 'shell')
            addVisor(surface, hat, detail);
        if (hat.cut !== 'earflap')
            addInsignia(surface, hat);
    }
    return surface.build();
}
const lensMaterial = new T.MeshPhongMaterial({ color: '#9ebec0', transparent: true, opacity: .18,
    depthWrite: false, side: T.DoubleSide, shininess: 98, specular: '#c0d3cb' });
const glassesByVariant = { 2: 'wire', 5: 'oval', 9: 'heavy', 12: 'wire', 14: 'oval' };
const glassesDesigns = {
    heavy: { width: .022, height: .0115, radius: .00155, angle: .52, top: '#55483c', side: '#757b76' },
    wire: { width: .020, height: .0105, radius: .00084, angle: .88, top: '#a19b84', side: '#777c72' },
    oval: { width: .018, height: .0123, radius: .00112, angle: 1, top: '#566968', side: '#79695d' }
};
function spectacles(id, variant, design, name) {
    const spec = glassesDesigns[design], structure = new model_geometry_js_1.Batch(), glass = new human_head_shapes_js_1.Surface();
    const frameSurface = new human_head_shapes_js_1.Surface(), top = new T.Color(spec.top), sideColor = new T.Color(spec.side);
    const eye = (0, human_head_shapes_js_1.eyesFor)(id, variant), centre = Math.max(.031, eye.x + .0005), resolution = 18;
    const lensY = eye.y - .0021;
    const faceAt = (x, y) => (0, human_head_shapes_js_1.skull)(id, (0, human_head_shapes_js_1.faceTheta)(id, x, y, variant), y, variant).z;
    const rimAt = (side, a) => {
        const cos = Math.cos(a), sin = Math.sin(a);
        const x = side * (centre + spec.width * Math.sign(cos) * Math.abs(cos) ** spec.angle);
        const y = lensY + spec.height * Math.sign(sin) * Math.abs(sin) ** spec.angle - .0014 * cos;
        const z = Math.min(-.099 + (.0163 * .5) * (1 + cos), faceAt(x, y) - .0047);
        return [x, y, z];
    };
    const bridge = [0, lensY + .0067, Math.min(-.100, faceAt(0, lensY + .0067) - .0034)];
    for (const side of [-1, 1]) {
        const rim = Array.from({ length: resolution }, (_, i) => rimAt(side, i / resolution * Math.PI * 2));
        const x = side * centre, z = .5 * (rim[0][2] + rim[resolution / 2][2]) - .0022;
        const mid = glass.vertex(x, lensY, z, .5, .5);
        for (let i = 0; i < resolution; i++) {
            const a = rim[i];
            const k = glass.vertex(a[0], a[1], a[2] - .0004, .5 + .5 * Math.cos(i / resolution * Math.PI * 2), .5 + .5 * Math.sin(i / resolution * Math.PI * 2));
            const next = i === resolution - 1 ? mid + 1 : k + 1;
            if (side > 0)
                glass.index.push(mid, next, k);
            else
                glass.index.push(mid, k, next);
        }
        const ring = 6, first = frameSurface.p.length / 3;
        for (let i = 0; i < resolution; i++) {
            const [x, y, z] = rim[i], angle = i / resolution * Math.PI * 2;
            for (let j = 0; j < ring; j++) {
                const turn = j / ring * Math.PI * 2, offset = spec.radius * Math.cos(turn);
                const k = frameSurface.vertex(x + side * Math.cos(angle) * offset, y + Math.sin(angle) * offset,
                    z + spec.radius * Math.sin(turn), i / resolution, j / ring, y > lensY ? top : sideColor);
                const after = first + ((i + 1) % resolution) * ring + j, next = j === ring - 1 ? k - j : k + 1;
                frameSurface.quad(k, next, after + (j === ring - 1 ? -j : 1), after, side < 0);
            }
        }
        const corner = rim[1], ear = (0, human_head_shapes_js_1.earsFor)(id, variant, side);
        const earX = (0, human_head_shapes_js_1.skull)(id, side * Math.PI / 2, ear.height + .014, variant).x;
        const elbow = [earX + side * .005, ear.height + .016, ear.depth - .028];
        const clamp = [earX + side * .002, ear.height - .003, ear.depth + .015];
        structure.rod(corner, elbow, spec.radius * .89, spec.top);
        structure.rod(elbow, clamp, spec.radius * 1.05, '#4d4944');
        structure.rod(rim[resolution / 2 - 1], bridge, spec.radius * .94, spec.side);
        const [nx, ny, nz] = rim[resolution / 2];
        structure.box(nx + side * .0019, ny - .0006, nz + .0017, .0029, .0042, .0025, '#b4a293', [0, 0, side * .24]);
    }
    const frames = structure.mesh(), lenses = new T.Mesh(glass.build(), lensMaterial);
    const rims = new T.Mesh(frameSurface.build(), model_geometry_js_1.solid);
    frames.name = name;
    lenses.name = 'curved-clear-spectacle-lenses';
    lenses.renderOrder = 1;
    frames.add(rims, lenses);
    return frames;
}
function workAccessories(role, id, variant) {
    const hat = wearableHeadwear(role, variant);
    const residentGlasses = role === 'resident' ? glassesByVariant[variant] : undefined;
    if (hat) {
        const geometry = headwearGeometry(role, id, variant);
        const material = hat.cut === 'shell' ? new T.MeshLambertMaterial({ vertexColors: true }) : threadTrim(undefined, hat.cut === 'earflap');
        const cap = new T.Mesh(geometry, material);
        cap.name = 'headwear-' + hat.cut;
        if (role === 'dispatcher')
            cap.add(spectacles(id, variant, 'heavy', 'dispatch-reading-glasses'));
        if (residentGlasses)
            cap.add(spectacles(id, variant, residentGlasses, 'resident-' + residentGlasses + '-glasses'));
        return cap;
    }
    if (residentGlasses)
        return spectacles(id, variant, residentGlasses, 'resident-' + residentGlasses + '-glasses');
    if (role === 'vendor') {
        const mount = new model_geometry_js_1.Batch(), pivot = new T.Group();
        mount.rod([.076, .166, .019], [.075, .173, -.033], .0026, '#596865');
        mount.rod([.076, .173, -.033], [.065, .178, -.075], .0021, '#b3b7a1');
        mount.rod([.065, .178, -.075], [.061, .172, -.082], .0017, '#52615c');
        const rim = new T.Mesh(new T.TorusGeometry(.0126, .00125, 5, 24), new T.MeshLambertMaterial({ color: '#778d86' }));
        rim.position.set(.055, .167, -.083);
        rim.rotation.set(-.065, -.53, .14);
        const glass = new T.Mesh(new T.CircleGeometry(.0116, 24), new T.MeshLambertMaterial({ color: '#8bcac0', transparent: true, opacity: .25, depthWrite: false, side: T.DoubleSide }));
        rim.add(glass);
        const fixture = mount.mesh();
        pivot.add(fixture, rim);
        pivot.name = 'folding-bench-loupe';
        return pivot;
    }
    if (role === 'mechanic') {
        const trim = new T.Group(), n = 40, wrap = new human_head_shapes_js_1.Surface(), cloth = threadTrim('#895544');
        const fold = [0, .09, .24, .55, .83, 1], tuck = [0, .0008, -.0003, .0014, .0010, 0];
        for (let row = 0; row < fold.length; row++)
            for (let i = 0; i <= n; i++) {
                const a = (i / n - .5) * 2 * Math.PI, front = Math.cos(a), side = Math.sin(a);
                const width = .012 + .002 * side + .0023 * Math.cos(a + .6);
                const y = .202 + .0125 * front - .003 * side + .0019 * Math.sin(3 * a + .31) + width * fold[row];
                const pos = (0, human_head_shapes_js_1.skull)(id, a, y, variant), d = .0029 + .0021 * (1 - front) + tuck[row];
                const k = wrap.vertex(pos.x + side * d, y, pos.z - front * d, i / n * 5 + .15 * fold[row], fold[row] * .7);
                if (i && row)
                    wrap.quad(k - n - 2, k - 1, k, k - n - 1);
            }
        trim.add(new T.Mesh(wrap.build(), cloth));
        const tie = new T.Mesh(new T.SphereGeometry(1, 12, 8), cloth);
        tie.position.set(-.043, .196, .092);
        tie.scale.set(.022, .0055, .010);
        tie.rotation.z = .21;
        trim.add(tie);
        for (const side of [-1, 1]) {
            const ear = (0, human_head_shapes_js_1.earsFor)(id, variant, side);
            const piercingY = ear.height - .023 * ear.size - ear.drop, piercingZ = ear.depth - .0065;
            const earring = new T.Mesh(new T.TorusGeometry(.0062, .0012, 5, 18), new T.MeshLambertMaterial({ color: '#ceb280' }));
            const root = (0, human_head_shapes_js_1.skull)(id, side * Math.PI / 2, piercingY, variant).x;
            earring.position.set(root + side * .007, piercingY - .0054, piercingZ);
            earring.rotation.y = side * .87;
            trim.add(earring);
        }
        trim.name = 'work-headband-and-earrings';
        return trim;
    }
}
