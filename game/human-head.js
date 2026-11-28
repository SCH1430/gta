"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haircut = haircut;
exports.hairline = hairline;
exports.hairForm = hairForm;
exports.humanHead = humanHead;
const T = require("../engine/three.module.min.js");
const human_albedo_js_1 = require("./human-albedo.js");
const human_profile_data_js_1 = require("./human-profile-data.js");
const human_complexion_js_1 = require("./human-complexion.js");
const human_headwear_js_1 = require("./human-headwear.js");
const human_head_shapes_js_1 = require("./human-head-shapes.js");
const templates = new Map(), hairMaterials = new Map(), earMaterials = new Map(), earMaps = new Map();
const pi = Math.PI;
const gauss = (v) => Math.exp(-v * v);
let scalpStudy;
function makeHairMaterial(color, id, cut, variant) {
    const key = [color, id, cut, variant].join('/');
    let material = hairMaterials.get(key);
    if (material)
        return material;
    scalpStudy ??= atob(human_profile_data_js_1.scalpLuma64);
    const w = human_profile_data_js_1.scalpWidth, h = human_profile_data_js_1.scalpHeight, pixels = new Uint8Array(w * h * 4);
    const base = new T.Color(color).convertLinearToSRGB();
    const portrait = (0, human_complexion_js_1.complexion)(id).map.image;
    const dye = (0, human_complexion_js_1.skinTint)(variant).clone().convertLinearToSRGB();
    const natural = variant === 0;
    const roots = [new T.Color('#322821'), new T.Color('#47372c'), new T.Color('#9b948a'), new T.Color('#352720')][id].convertLinearToSRGB();
    const short = cut === 'buzz' || cut === 'fade';
    const contrast = short ? .58 : id === 2 ? .83 : 1;
    const channels = ['r', 'g', 'b'];
    const ratios = channels.map(c => T.MathUtils.clamp(base[c] / roots[c], .55, 1.6));
    for (let u = 0; u < w; u++) {
        const a = 2 * pi * u / w, theta = (u / (w - 1) - .5) * 2 * pi, rim = hairline(id, variant, theta);
        const ix = Math.round((0, human_head_shapes_js_1.headU)(theta) * (portrait.width - 1));
        const extent = .19 + .15 * Math.sin(theta) ** 2 + .13 * gauss((Math.abs(theta) - 1.26) / .39);
        const edge = 1.4 + 1.8 * Math.sin(28 * a + .5 * Math.sin(5 * a)) + .9 * Math.sin(61 * a);
        for (let v = 0; v < h; v++) {
            const t = v / (h - 1), grain = .5 + .5 * Math.sin(u * 57.21 + v * 29.78 + 1.9 * Math.cos(u * 13.7 - v));
            const photo = scalpStudy.charCodeAt(id * w * h + v * w + u) / 115;
            const direction = u * 2.7 + v * 1.37 * Math.sin(a + .8) + .9 * Math.cos(a * 7 + t * 5);
            const fiber = .023 * Math.cos(direction) + .014 * Math.cos(direction * 2.41);
            const strand = 1 + (photo - 1) * contrast + .03 * (grain - .5) + fiber;
            const nape = 1 - .11 * (1 - t) ** 3, at = 4 * (v * w + u), shift = Math.max(0, strand - 1);
            const py = rim + (.269 - rim) * Math.sin(t * pi * .5);
            const iy = Math.round(T.MathUtils.clamp((human_albedo_js_1.faceTop - py) / human_albedo_js_1.faceHeight, 0, 1) * (portrait.height - 1));
            const offset = 4 * (iy * portrait.width + ix);
            const shell = T.MathUtils.smoothstep(t, .014, extent);
            const tintStrength = natural ? 0 : T.MathUtils.smoothstep(py, rim - .003, rim + .028);
            for (let c = 0; c < 3; c++) {
                const channel = channels[c], raw = portrait.data[offset + c];
                const matched = raw * T.MathUtils.lerp(dye[channel], ratios[c], tintStrength);
                const groom = 255 * base[channel] * strand * nape + (5 - c) * shift;
                pixels[at + c] = Math.min(255, T.MathUtils.lerp(matched, groom, shell));
            }
            pixels[at + 3] = Math.round(255 * T.MathUtils.clamp(v - edge - .7 * grain, 0, 1));
        }
    }
    const map = (0, human_albedo_js_1.rgbaTexture)(pixels, w, h);
    map.wrapS = T.RepeatWrapping;
    material = new T.MeshLambertMaterial({ map, side: T.DoubleSide, alphaTest: .46 });
    hairMaterials.set(key, material);
    return material;
}
const hairlines = [[0, .220], [.23, .221], [.48, .222], [.66, .217], [.83, .207], [.99, .202],
    [1.10, .189], [1.18, .167], [1.24, .155], [1.29, .166], [1.37, .174], [1.51, .178],
    [1.63, .176], [1.75, .171], [1.86, .162], [1.96, .148], [2.07, .128], [2.26, .116], [2.64, .108], [pi, .103]];
const roleCuts = ['wave', 'knot', 'part', 'tail'];
const residentCuts = ['crop', 'bob', 'curl', 'knot', 'buzz', 'tail', 'part', 'slick', 'curl', 'knot', 'buzz', 'bob', 'fade', 'slick', 'part', 'curl'];
const styles = {
    fade: { height: .009, rim: .005, crest: -.01, sweep: .23, wave: .0013 },
    part: { height: .016, rim: .007, crest: -.48, sweep: .66, wave: .0017 },
    wave: { height: .019, rim: -.003, crest: .24, sweep: -.58, wave: .0035 },
    slick: { height: .010, rim: .008, crest: .29, sweep: .41, wave: .0012 },
    knot: { height: .011, rim: -.001, crest: -.26, sweep: .46, wave: .0014 },
    tail: { height: .010, rim: -.003, crest: .12, sweep: -.54, wave: .0013 },
    buzz: { height: .002, rim: .010, crest: 0, sweep: .025, wave: .0005 },
    curl: { height: .022, rim: -.002, crest: .13, sweep: -.15, wave: .0075 },
    crop: { height: .012, rim: .002, crest: -.25, sweep: .37, wave: .0021 },
    bob: { height: .016, rim: -.002, crest: .28, sweep: .43, wave: .0041 }
};
function haircut(id, variant) { return variant ? residentCuts[(variant - 1) % residentCuts.length] : roleCuts[id]; }
function hairline(id, variant, a) {
    const style = styles[haircut(id, variant)], m = Math.abs(a);
    let k = 1;
    while (k < hairlines.length - 1 && m > hairlines[k][0])
        k++;
    const l = hairlines[k - 1], r = hairlines[k];
    let rim = l[1] + (r[1] - l[1]) * (m - l[0]) / (r[0] - l[0]);
    const temple = gauss((m - .81) / .27);
    rim += style.rim * gauss(m / 1.03) + .006 * style.sweep * Math.sin(3 * a) * Math.max(0, Math.cos(a));
    rim += (haircut(id, variant) === 'part' ? .014 : haircut(id, variant) === 'buzz' ? .007 : .002) * temple;
    const sideburn = gauss((m - 1.24) / .16);
    if (haircut(id, variant) === 'knot' || haircut(id, variant) === 'tail')
        rim += .012 * sideburn + .0015 * gauss(m / .9);
    if (haircut(id, variant) === 'fade')
        rim += .008 * sideburn;
    if (haircut(id, variant) === 'bob')
        rim -= .058 * T.MathUtils.smoothstep(m, .91, 1.63);
    if (haircut(id, variant) === 'crop')
        rim -= .012 * gauss((a + .35) / .45);
    if (haircut(id, variant) === 'curl')
        rim -= .005 * (1 + .39 * Math.sin(a * 12 + .5)) * gauss(m / .82);
    if (haircut(id, variant) === 'wave' && !variant && id === 0)
        rim -= .009 * gauss((a - .23) / .54);
    rim += .0021 * Math.sin(5 * a + .6) * gauss(m / .85) + .0010 * Math.sin(17 * a + .5) + .0007 * Math.cos(31 * a);
    return rim;
}
function hairForm(id, variant, a, t, hat) {
    const cut = haircut(id, variant), style = styles[cut], rim = hairline(id, variant, a);
    const y = rim + (.269 - rim) * Math.sin(t * pi * .5), p = (0, human_head_shapes_js_1.skull)(id, a, y, variant);
    const sideFade = (cut === 'wave' || cut === 'fade' || cut === 'buzz' || cut === 'crop') ? gauss((Math.abs(a) - 1.62) / 1.01) : 0;
    const crest = Math.sin(pi * t) ** .72;
    const swept = .65 * Math.sin(3 * a + style.sweep * t * 4) + .35 * Math.sin(7 * a + 1.2 * t);
    const tuck = Math.min(1, t * 14 + .24), fade = (1 - t * t) * tuck;
    const strand = a + style.sweep * Math.sin(t * 1.6);
    const lock = Math.max(0, Math.sin(strand * 11 + 1.4 * Math.cos(a * 4) + .67 * Math.sin(t * 8)));
    const part = cut === 'part' ? .0057 * gauss((a - style.crest - .13 * Math.sin(t * 4)) / .067) * Math.sin(t * pi) : 0;
    const crown = style.height * ((.37 + .63 * gauss((a - style.crest) / 1.19)) * crest + .48 * t * t) - part;
    const wave = style.wave * (lock - .35) * Math.sin(pi * t);
    const bobThickness = cut === 'bob' ? .014 * T.MathUtils.smoothstep(Math.abs(a), .76, 1.70) * (1 - t * t) : 0;
    const lift = cut === 'wave' ? .0078 * gauss((a - .31 + .65 * t) / .57) * gauss((t - .38) / .21) : 0;
    const ridge = cut === 'curl' ? .0024 * Math.cos(17 * a + 4 * t) * crest : 0;
    const thick = (.0012 + style.height * (.40 + .23 * swept) * crest * (1 - .72 * sideFade)) * fade + bobThickness + .66 * lift + ridge;
    const x = p.x + thick * Math.sin(a) + .004 * style.sweep * crest - .35 * lift;
    const z = p.z - thick * Math.cos(a) + .0014 * swept * crest;
    const height = y + crown + wave + lift + .0027 * swept * crest * (cut === 'buzz' ? .10 : 1);
    if (!hat || hat === 'earband')
        return { x, y: height, z };
    const brim = hat === 'flat' ? .193 : hat === 'earflap' ? .151 : hat === 'rail' ? .178 : .172;
    const covered = T.MathUtils.smoothstep(height, brim + .002, brim + .052);
    const fit = hat === 'shell' || hat === 'rail' ? 1 : .69;
    return {
        x: x * (1 - .31 * fit * covered), y: height - covered * Math.max(0, height - .230) * (fit + .10),
        z: .010 + (z - .010) * (1 - .29 * fit * covered)
    };
}
const lockMaterial = new T.MeshPhongMaterial({ vertexColors: true, specular: '#282220', shininess: 26 });
function looseLocks(id, variant, cut, hat, color) {
    if (cut === 'buzz' || cut === 'fade' || hat === 'earflap')
        return;
    const b = new human_head_shapes_js_1.Surface(), ink = new T.Color(), base = new T.Color(color);
    const old = (0, human_head_shapes_js_1.facialAge)(id, variant), longer = cut === 'curl' || cut === 'bob';
    const across = cut === 'wave' || cut === 'crop' || cut === 'part' ? -.22 : .13;
    const starts = hat && hat !== 'earband' ? [1.10, 1.32, 1.89] : [.32, .66, 1.06, 1.39, 2.00];
    const sides = variant ? 4 : 6, rows = variant ? 4 : 5;
    for (const side of [-1, 1]) {
        for (let n = 0; n < starts.length; n++) {
            const theta = side * starts[n] + across * (n < 2 ? 1 : .28);
            const y0 = hairline(id, variant, theta) + .023 + (n % 2) * .006;
            const reach = (longer ? .032 : .020) + (n % 3) * .0035, bend = side * (.21 - .044 * n);
            const curl = cut === 'curl' ? .055 : .014;
            for (let row = 0; row <= rows; row++) {
                const t = row / rows, a = theta + bend * t + curl * Math.sin(1.3 * Math.PI * t), y = y0 - reach * t;
                const p = (0, human_head_shapes_js_1.skull)(id, a, y, variant), s = Math.sin(a), c = Math.cos(a);
                const flare = (.0011 + .0054 * Math.sin(Math.PI * t) + (longer ? .0022 * t : 0));
                const width = (.0026 + n % 3 * .00042) * (.20 + .80 * Math.sin(Math.PI * (.10 + .90 * t)));
                for (let i = 0; i <= sides; i++) {
                    const u = i / sides * Math.PI * 2, rise = flare + width * .52 * Math.cos(u), lateral = width * Math.sin(u);
                    const skin = .70 + .32 * (.5 + .5 * Math.cos(u)) + .050 * Math.cos(t * 9.8 + n);
                    ink.copy(base).lerp(old > .63 && (n === 1 || n === 3) ? silverHair : base, old > .75 ? .32 : .16).multiplyScalar(skin);
                    const k = b.vertex(p.x + s * rise + c * lateral, y, p.z - c * rise + s * lateral, i / sides, t, ink);
                    if (i && row)
                        b.quad(k - sides - 2, k - 1, k, k - sides - 1);
                }
            }
        }
    }
    const locks = new T.Mesh(b.build(), lockMaterial);
    locks.name = 'groomed-temple-and-nape-locks';
    return locks;
}
const silverHair = new T.Color('#c0b6a9');
let beardMaterial;
function beardFiber() {
    if (beardMaterial)
        return beardMaterial;
    const w = 96, h = 48, data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const offset = (y * w + x) * 4, row = y / (h - 1);
            const hash = Math.imul(x + 11, 1597334677) ^ Math.imul(y + 63, 1640531513);
            const hair = .51 + .34 * Math.cos(x * 2.76 + y * .66) + .15 * ((hash >>> 18) & 3) / 3;
            const edge = (1 - T.MathUtils.smoothstep(row, .73, .98)) * (.83 + .17 * Math.sin(x * 1.9));
            data[offset] = data[offset + 1] = data[offset + 2] = 150 + 91 * hair;
            data[offset + 3] = 255 * edge * (.53 + .47 * hair);
        }
    }
    const map = (0, human_albedo_js_1.rgbaTexture)(data, w, h);
    map.wrapS = T.RepeatWrapping;
    beardMaterial = new T.MeshPhongMaterial({ map, vertexColors: true, alphaTest: .34, side: T.DoubleSide, specular: '#211e1a', shininess: 16 });
    return beardMaterial;
}
function facialHair(id, variant, color) {
    const strength = (0, human_head_shapes_js_1.beardFor)(id, variant);
    if (strength < .20)
        return;
    const b = new human_head_shapes_js_1.Surface(), base = new T.Color(color), ink = new T.Color();
    const full = T.MathUtils.smoothstep(strength, .38, .87), old = (0, human_head_shapes_js_1.facialAge)(id, variant);
    const columns = variant ? 24 : 36, rows = variant ? 6 : 8;
    for (let j = 0; j <= rows; j++) {
        const t = j / rows;
        for (let i = 0; i <= columns; i++) {
            const theta = (i / columns * 2 - 1) * (1.56 + full * .31), a = Math.abs(theta), s = Math.sin(theta), c = Math.cos(theta);
            const upper = .077 + .066 * T.MathUtils.smoothstep(a, .20, 1.46) + .011 * full * T.MathUtils.smoothstep(a, .43, .90);
            const lower = .043 + .026 * T.MathUtils.smoothstep(a, .55, 1.73);
            const y = T.MathUtils.lerp(lower, upper, t), p = (0, human_head_shapes_js_1.skull)(id, theta, y, variant);
            const mane = gauss((a - .34) / .53) * (.31 + .68 * Math.sin(Math.PI * t));
            const grain = .75 + .23 * Math.cos(i * .92 + t * 3) ** 2;
            const coat = .0006 + full * (.0027 + .0069 * mane) * grain;
            const point = p.y - full * .0045 * (1 - t) ** 3 * gauss(a / .67);
            ink.copy(base).lerp(silverHair, .28 * T.MathUtils.smoothstep(old, .48, .85) * grain).multiplyScalar(.80 + .23 * grain);
            const k = b.vertex(p.x + s * coat, point, p.z - c * coat, i / columns * 2, t, ink);
            if (i && j)
                b.quad(k - columns - 2, k - 1, k, k - columns - 1);
        }
    }
    if (full > .55) {
        const n = 16;
        for (let j = 0; j <= 4; j++) {
            for (let i = 0; i <= n; i++) {
                const theta = (i / n * 2 - 1) * .48, t = j / 4, arch = 1 - Math.abs(theta) / .51;
                const y = .105 + .006 * arch + .002 * Math.sin(theta * 14) + t * (.0057 + .0015 * arch);
                const p = (0, human_head_shapes_js_1.skull)(id, theta, y, variant);
                const thick = .0007 + full * .0022 * arch * Math.sin(t * Math.PI);
                ink.copy(base).lerp(silverHair, .19 * old).multiplyScalar(.86 + .15 * arch);
                const k = b.vertex(p.x, y, p.z - thick, i / n, t, ink);
                if (i && j)
                    b.quad(k - n - 2, k - 1, k, k - n - 1);
            }
        }
    }
    const result = new T.Mesh(b.build(), beardFiber());
    result.name = full > .50 ? 'sculpted-beard-and-moustache' : 'textured-stubble';
    return result;
}
function hairSurface(role, id, variant, color) {
    const b = new human_head_shapes_js_1.Surface(), cut = haircut(id, variant), hat = (0, human_headwear_js_1.wearableHeadwear)(role, variant)?.cut;
    const covered = hat && hat !== 'earband', lead = role !== 'resident', rows = covered ? 8 : lead ? 15 : 10, cols = covered ? 42 : lead ? 68 : 46;
    for (let j = 0; j <= rows; j++)
        for (let i = 0; i <= cols; i++) {
            const a = (i / cols - .5) * 2 * pi, t = j / rows, p = hairForm(id, variant, a, t, hat);
            const off = b.vertex(p.x, p.y, p.z, i / cols, t);
            if (i && j)
                b.quad(off - cols - 2, off - 1, off, off - cols - 1);
        }
    const mat = makeHairMaterial(color, id, cut, variant), hair = new T.Mesh(b.build(), mat);
    hair.name = 'scalp-hair';
    const locks = looseLocks(id, variant, cut, hat, color);
    if (locks)
        hair.add(locks);
    if (cut === 'knot' || cut === 'tail') {
        const pinned = cut === 'knot', knot = new human_head_shapes_js_1.Surface(), cols = 20, rows = 14;
        for (let j = 0; j <= rows; j++)
            for (let i = 0; i <= cols; i++) {
                const a = i / cols * 2 * pi, t = j / rows, e = (t - .5) * pi, r = Math.cos(e), s = Math.sin(e);
                const twist = pinned ? 4.3 : 1.7;
                const n = 1 + .095 * Math.sin(5 * a + e * twist) * r + .035 * Math.cos(9 * a - e * 3);
                const tailRadius = r * (.48 + .63 * t + .42 * gauss((t - .61) / .16) - .32 * gauss((t - .80) / .08));
                const x = pinned ? .036 * r * Math.sin(a) * n : .021 * tailRadius * Math.sin(a) * n + .012 * (1 - t) ** 2;
                const y = pinned ? .161 + .028 * s : .079 + .093 * t;
                const z = pinned ? .108 + .032 * r * Math.cos(a) * n - .009 * s : .107 + .027 * tailRadius * Math.cos(a) * n + .009 * Math.sin(2 * pi * t);
                const k = knot.vertex(x, y, z, .20 + .57 * i / cols + .10 * Math.sin(e), .10 + .83 * t);
                if (i && j)
                    knot.quad(k - cols - 2, k - 1, k, k - cols - 1, true);
            }
        const bun = new T.Mesh(knot.build(), mat);
        bun.name = pinned ? 'pinned-chignon' : 'bound-ponytail';
        hair.add(bun);
    }
    return hair;
}
function earSurface(id, variant) {
    const key = id + '/' + variant;
    let mat = earMaterials.get(key);
    let map = earMaps.get(id);
    if (!map) {
        const rgb = atob(human_profile_data_js_1.sideEars64), rgba = new Uint8Array(32 * 64 * 4);
        for (let i = 0; i < 32 * 64; i++) {
            for (let c = 0; c < 3; c++)
                rgba[i * 4 + c] = rgb.charCodeAt((id * 32 * 64 + i) * 3 + c);
            rgba[i * 4 + 3] = 255;
        }
        map = (0, human_albedo_js_1.rgbaTexture)(rgba, 32, 64);
        earMaps.set(id, map);
    }
    if (!mat) {
        mat = new T.MeshLambertMaterial({ map, color: (0, human_complexion_js_1.skinTint)(variant), side: T.DoubleSide, vertexColors: true });
        earMaterials.set(key, mat);
    }
    const ear = new human_head_shapes_js_1.Surface();
    const ink = new T.Color();
    const radii = [.012, .16, .31, .44, .55, .66, .77, .86, .94, 1, .95, .79];
    const shell = [.0011, .0021, .0034, .0048, .0060, .0062, .0071, .0087, .0074, .0048, .0018, -.0039];
    for (const side of [-1, 1]) {
        const form = (0, human_head_shapes_js_1.earsFor)(id, variant, side);
        const n = 24;
        for (let j = 0; j < radii.length; j++)
            for (let i = 0; i <= n; i++) {
                const a = i / n * 2 * pi, r = radii[j], back = Math.sin(a), height = Math.cos(a);
                const u = r * back, v = r * height;
                const y = form.height + form.size * (.027 * v + .0022 * u + .0012 * u * v) - form.drop * Math.max(0, -v) ** 2;
                const z = form.depth + form.size * ((.0148 + .0028 * v) * u + form.slope * v - .0029 * v * v);
                const root = Math.abs((0, human_head_shapes_js_1.skull)(id, side * (pi / 2 + (z - .006) * 10.2), y, variant).x);
                const bowl = gauss((u + .14) / .27) * gauss((v + .13) / .35);
                const antihelix = gauss((u - .35 + .28 * v * v) / .15) * gauss((v - .16) / .59);
                const helix = gauss((r - .86) / .107) * T.MathUtils.smoothstep(v, -.98, .18);
                const tragus = gauss((u + .68) / .14) * gauss((v + .17) / .18);
                const lobule = gauss((u + .025) / .42) * gauss((v + .85) / .25);
                const relief = .0028 * antihelix + .0018 * helix + .0032 * tragus + .0039 * lobule - .0034 * bowl;
                const fold = j < radii.length - 2 ? relief : 0;
                const x = side * (root + form.size * (shell[j] + fold) + .48 * form.flare * u - .0017 * v * v);
                const occlusion = .21 * bowl + .075 * gauss((r - .71) / .105) * T.MathUtils.smoothstep(u, .23, .85);
                const flush = .12 * (helix + .67 * lobule) * (1 - .22 * Math.max(0, -u));
                ink.setRGB(1 - occlusion * .70 + .03 * flush, 1 - occlusion - flush, 1 - occlusion * .96 - .63 * flush);
                const k = ear.vertex(x, y, z, .51 - .43 * u, .50 - .445 * v, ink);
                if (j && i)
                    ear.quad(k - n - 2, k - 1, k, k - n - 1, side > 0);
            }
    }
    const ears = new T.Mesh(ear.build(), mat);
    ears.name = 'auricles';
    return ears;
}
function neckSurface(id, variant) {
    const b = new human_head_shapes_js_1.Surface(), n = 24;
    const fit = (0, human_head_shapes_js_1.neckFit)(id, variant), ink = new T.Color();
    const rings = [[-.073, .082, .060, .016], [-.054, .073, .055, .017], [-.034, .064, .051, .018], [-.015, .056, .047, .018],
        [.005, .051, .044, .018], [.026, .047, .043, .018], [.049, .044, .041, .019], [.075, .048, .049, .021], [.105, .052, .057, .020]];
    for (let j = 0; j < rings.length; j++)
        for (let i = 0; i <= n; i++) {
            const a = (i / n - .5) * 2 * pi, [y, w, d, c] = rings[j], s = Math.sin(a), f = Math.cos(a);
            const tendon = (.0036 + .0015 * fit.old - .0013 * fit.young) * gauss((Math.abs(s) - (.22 + .65 * j / (rings.length - 1))) / .17) * Math.max(0, f) * gauss((y - .026) / .076);
            const larynx = (id % 2 === 0 ? .0028 : .0011) * gauss(s / .24) * gauss((y - .034) / .013);
            const fold = fit.old * Math.max(0, f) * (.003 * gauss((y - .010) / .012) + .0015 * gauss((y - .039) / .009));
            const shape = 1 - T.MathUtils.smoothstep(Math.abs(y - .016), .063, .091);
            const x = s * (w + tendon) * T.MathUtils.lerp(1, fit.width, shape), z = c - f * (d * T.MathUtils.lerp(1, fit.depth, shape) + tendon + larynx + fold);
            const shade = 1 - fit.old * Math.max(0, f) * .14 * gauss((y - .024) / .008);
            ink.setRGB(shade, shade * (1 - .02 * fit.old), shade);
            const k = b.vertex(x, y + .0034 * Math.max(0, -f) * gauss((y - .054) / .036), z, i / n, (.11 - y) / .15, ink);
            if (i && j)
                b.quad(k - n - 2, k - 1, k, k - n - 1);
        }
    const material = (0, human_complexion_js_1.complexion)(id, true, variant).clone();
    material.vertexColors = true;
    const neck = new T.Mesh(b.build(), material);
    neck.name = 'cervical-muscles';
    return neck;
}
function humanHead(role, variant = 0, skin = '#be8f76', hair) {
    const id = (0, human_head_shapes_js_1.identity)(role, variant), v = (0, human_head_shapes_js_1.faceVariant)(role, variant);
    const tone = role === 'courier' ? '#483b34' : role === 'resident' && hair ? hair : ['#322821', '#47372c', '#9b948a', '#38251e'][id];
    const key = [role, v, skin, tone].join('/');
    let template = templates.get(key);
    if (!template) {
        const material = (0, human_complexion_js_1.complexion)(id, false, v, true).clone();
        material.vertexColors = true;
        const head = new T.Mesh((0, human_head_shapes_js_1.facialGeometry)(id, v, role === 'resident' ? 'street' : 'close'), material);
        head.name = 'anatomical-face';
        head.userData.faceStructure = id;
        const size = (0, human_head_shapes_js_1.headScale)(role, v);
        head.scale.set(size.x, size.y, size.z);
        head.add(neckSurface(id, v), earSurface(id, v), hairSurface(role, id, v, tone));
        const beard = facialHair(id, v, tone);
        if (beard)
            head.add(beard);
        const accessories = (0, human_headwear_js_1.workAccessories)(role, id, v);
        if (accessories)
            head.add(accessories);
        template = head;
        templates.set(key, head);
    }
    return template.clone();
}
