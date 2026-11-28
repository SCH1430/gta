"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appearance = appearance;
exports.coatLength = coatLength;
exports.limbFit = limbFit;
exports.garments = garments;
exports.satchelPlacement = { flap: { x: .158, y: .227, z: .184 }, contents: { x: .157, y: .211, z: .162 } };
const T = require("../engine/three.module.min.js");
const human_cloth_js_1 = require("./human-cloth.js");
const human_sleeve_js_1 = require("./human-sleeve.js");
const human_extremities_js_1 = require("./human-extremities.js");
const model_geometry_js_1 = require("./model-geometry.js");
const human_kits_js_1 = require("./human-kits.js");
const { ageFor } = require('./human-head-shapes.js');
const reflectorMaterial = new T.MeshPhongMaterial({
    vertexColors: true, specular: '#e9e5d2', shininess: 39,
    emissive: '#a3a28b', emissiveIntensity: .08
});
const complexions = [
    ['#be8f76', '#443530'], ['#c6997b', '#493632'], ['#bc937b', '#62615b'], ['#b88366', '#352c2e'],
    ['#a9775e', '#49392e'], ['#d4a487', '#675047'], ['#b08269', '#41322c'], ['#9d715d', '#352f2c'],
    ['#d2a58c', '#695852'], ['#bc8e73', '#38332d'], ['#a3735f', '#433937'], ['#c5957b', '#4d3b34']
];
function appearance(role, variant) {
    const n = Math.abs(variant) % human_kits_js_1.civilians.length;
    const style = role === 'resident' ? human_kits_js_1.civilians[n] : human_kits_js_1.jobs[role];
    const skinIndex = role === 'hero' ? 0 : role === 'vendor' ? 1 : role === 'dispatcher' ? 2 : role === 'mechanic' ? 3 : role === 'courier' ? 7 : 4 + (n * 5) % 8;
    const [skin, hair] = complexions[skinIndex], { main, shade, accent, shirt, pants, cut, scale, build } = style;
    const feminine = role === 'vendor' || role === 'mechanic' || (role === 'resident' && n % 2 === 1);
    const thick = build > .50, long = cut === 'wool' || cut === 'waxed', parka = cut === 'quilted';
    const shoulderWidth = role === 'hero' ? .202 : role === 'dispatcher' ? .202 : (feminine ? .165 : .186) + build * .024;
    const hipWidth = (feminine ? .095 : .084) + build * .009;
    const athletic = cut === 'windbreaker' && !style.openKnit;
    const waist = (feminine ? .128 : .147) + Math.max(-.009, build * .039) + (parka ? .036 : role === 'hero' ? .013 : athletic ? -.006 : 0);
    const acrossHip = (feminine ? .187 : .169) + Math.max(-.005, build * .027) + (parka ? .012 : athletic ? -.008 : 0);
    const chest = shoulderWidth + (parka ? .029 : role === 'hero' ? .022 : cut === 'wool' ? .019 : .009);
    const depth = (feminine ? .120 : .131) + build * .023;
    const variantId = role === 'resident' ? n : ['hero', 'vendor', 'dispatcher', 'mechanic', 'courier'].indexOf(role) + 15;
    const pocketSide = variantId % 2 ? -1 : 1, pocketLoad = [.016, .009, 0, .012, .005][variantId % 5];
    return { look: { main, shade, accent, shirt, pants, skin, hair }, style, build, shoulderWidth, hipWidth, waist, acrossHip, chest, depth, scale, feminine, thick, long, parka, cut,
        variant: variantId, age: ageFor(role, n), pocketSide, pocketLoad, packStraps: style.kit === 'transit' || style.backpack };
}
function coatLength(role, fit) {
    const { cut, style } = fit;
    const offset = style.hemOffset ?? 0;
    if (cut === 'wool')
        return (style.kit === 'commuter' ? -.313 : -.296) + offset;
    if (cut === 'waxed')
        return style.kit === 'canal' ? -.216 : -.174;
    if (cut === 'quilted')
        return -.159 + offset;
    if (cut === 'workwear')
        return -.075 + offset;
    return role === 'hero' ? -.120 : style.openKnit ? -.106 : -.035;
}
function limbFit(role, fit) {
    const { cut, feminine, build } = fit, utility = cut === 'workwear' || role === 'hero', trim = cut === 'windbreaker';
    return { arm: (feminine ? .91 : 1) + build * .086 + (cut === 'quilted' ? .08 : cut === 'wool' ? .035 : trim ? -.025 : 0),
        leg: (feminine ? .93 : 1) + build * .09 + (utility ? .045 : trim ? -.045 : 0) + (fit.style.legEase ?? 0) };
}
function foldedHood(surface, fit) {
    const { main, shade, shirt } = fit.look;
    const polar = fit.style.kit === 'polar';
    const width = polar ? .164 : .153, depth = polar ? .192 : .181;
    const outer = [], lining = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20, a = -.45 + t * (Math.PI + .90), s = Math.sin(a), c = Math.cos(a);
        const gathered = Math.sin(Math.PI * t) ** .55, back = Math.max(0, s);
        const y = .456 + .083 * gathered + (polar ? .021 : .015) * back + .006 * Math.sin(a * 5) * gathered;
        const crease = .006 * Math.sin(a * 7 + .8) * gathered;
        const p = (rx, rz, h) => [(rx + c * crease) * c, h, .024 + rz * s];
        const lip = p(width - .026, depth - .026, y);
        outer.push([p(width - .028, depth - .030, y - .061), p(width, depth, y - .039), p(width + .005 * gathered, depth - .003, y - .019), p(width - .008, depth - .011, y - .004), lip]);
        lining.push([lip, p(width - .045, depth - .048, y - .008), p(width - .053, depth - .057, y - .024), p(width - .045, depth - .070, y - .056)]);
    }
    surface.shell(outer, (0, human_cloth_js_1.tint)(main, .79), 1);
    surface.shell(lining, (0, human_cloth_js_1.tint)(shirt, .71));
    surface.shell(outer.map((row, i) => [row[4], lining[i][1]].map(([x, y, z]) => [x, y + .0025, z])), (0, human_cloth_js_1.tint)(shade, .66), 2);
}
function collarLining(fit) {
    const knit = new human_cloth_js_1.Surface('knit', -.516), { look, cut } = fit;
    const top = cut === 'quilted' ? .557 : .548;
    knit.loft([[.522, .070, .063, .069, 0, .007], [.532, .066, .060, .064, 0, .007], [top, .059, .055, .059, 0, .007]], look.shirt, 0, 20, .91);
    knit.loft([[top - .002, .060, .056, .060, 0, .007], [top, .056, .052, .056, 0, .007], [top - .007, .054, .050, .054, 0, .007]],
        (0, human_cloth_js_1.tint)(look.shirt, .66), 0, 20, .91);
    return knit.mesh('rib-knit-inner-collar');
}

function wornPocket(surface, fit, point) {
    const side = fit.pocketSide, { look, variant } = fit, x = side * (.098 + (variant % 3) * .007), y = .126 + (variant % 4) * .009;
    const color = (0, human_cloth_js_1.tint)(look.main, fit.cut === 'wool' ? 1.12 : 1.19);
    const patch = (y, width) => [x - width, x + width, y];
    const front = (x, y, rise) => point(x, y, rise);
    surface.fittedPatch([patch(y - .021, .018), patch(y - .012, .029), patch(y + .010, .028), patch(y + .015, .017)], front, color, 1, false, .010, .001);
    if (variant % 3 === 1 || variant === 15) {
        const repaired = (0, human_cloth_js_1.tint)(look.shade, 1.27);
        surface.fittedPatch([patch(y - .019, .011), patch(y - .013, .023), patch(y + .007, .021), patch(y + .012, .017)], front, repaired, 2, false, .012, .001);
        const thread = (0, human_cloth_js_1.tint)(look.accent, .77);
        for (let i = -2; i <= 2; i++) {
            const q = x + i * .007;
            surface.stroke([point(q - .002, y - .014, .015), point(q + .002, y - .010, .015)], .0014, thread);
        }
    }
}

function personalGear(role, fit, point) {
    const mesh = new model_geometry_js_1.Batch();
    const attach = role === 'dispatcher' ? [.093, .284] : role === 'hero' || role === 'courier' ? [-.112, .243] : [fit.pocketSide * .117, .330];
    const [x, y, z] = point(...attach, .015);
    if (role === 'dispatcher') {
        mesh.box(x, y + .008, z, .018, .020, .012, '#4b5559');
        const cord = Array.from({ length: 26 }, (_, i) => [x + Math.sin(i * .87) * .006, y - i * .0025, z - .008 + Math.cos(i * .87) * .004]);
        for (let i = 1; i < cord.length; i++)
            mesh.rod(cord[i - 1], cord[i], .0019, '#292f33');
        mesh.add(model_geometry_js_1.ring, [x, y - .068, z - .005], [.009, .009, .017], '#c4bd9d');
        mesh.box(x + .004, y - .086, z - .009, .013, .038, .004, '#a8a387', [0, .24, .19]);
    }
    else if (role === 'courier' || role === 'hero') {
        mesh.rod([x, y + .014, z + .002], [x, y - .022, z - .012], .007, '#555455', true);
        mesh.add(model_geometry_js_1.ring, [x - .007, y - .021, z - .014], [.017, .025, .022], '#b0a788', [0, -.23, .23]);
        mesh.box(x - .010, y - .066, z - .023, .048, .079, .028, '#4d484b', [0, -.12, .12]);
        mesh.box(x - .013, y - .070, z - .038, .038, .055, .005, '#7e6f58', [0, -.12, .12]);
    }
    else {
        const plate = fit.variant % 3 === 0 ? '#c9a66c' : fit.variant % 3 === 1 ? '#a9baae' : '#9cb5bb';
        mesh.box(x, y, z, .018, .027, .017, '#454b4b');
        mesh.box(x, y - .029, z - .012, .054, .038, .006, plate, [0, .15 * fit.pocketSide, .04]);
        mesh.box(x - .009, y - .028, z - .016, .013, .015, .002, '#746a54');
        for (const row of [-.037, -.030, -.023])
            mesh.box(x + .010, y + row, z - .016, .015, .002, .002, '#627273');
    }
    const part = mesh.mesh();
    part.name = 'personal-kit-with-fastener';
    return part;
}

function upperBody(role, fit) {
    const l = fit.look, hero = role === 'hero', mechanic = fit.cut === 'workwear';
    const { feminine, thick, parka, long, cut, shoulderWidth: shoulder, waist, acrossHip: hips, chest, depth } = fit;
    const trim = cut === 'windbreaker', polar = fit.style.kit === 'polar', structured = cut === 'wool';
    const backPleat = cut === 'waxed' ? .024 : 0;
    const coatStart = long ? -.025 : parka ? .006 : mechanic ? -.006 : .025;
    const shell = [
        [coatStart, hips, .122, depth + .014, 0, .012], [.057, hips + .006, .135, depth + .013 + backPleat, 0, .010],
        [.122, waist + .017, .127 + (thick ? .020 : 0), depth - .007 + backPleat * .6, 0, .004], [.192, waist, .114 + (thick ? .030 : 0), depth - .015, 0, -.002],
        [.244, (waist + chest) * .49, .120 + (parka ? .008 : 0), depth - .005, 0, -.002], [.287, chest - .029, depth + (feminine ? .020 : .009), depth + .002],
        [.337, chest - .008, depth + (feminine ? .038 : .026), depth + .010, 0, .001],
        [.375, chest + .003, depth + .019, depth + .024, 0, .006], [.407, chest + .005, depth - .003, depth + .029, 0, .010],
        [.438, shoulder + .005, depth - .018, depth + .017, 0, .011], [.460, shoulder - .025, .101, .119, 0, .010],
        [.479, structured ? .129 : .116, .085, .103, 0, .010], [.503, .091, .071, .087, 0, .010], [.515, .071, .061, .073, 0, .009]
    ];
    if (parka)
        for (let row = 0; row < 10; row++) {
            const ring = shell[row], fill = (row % 2 === 0 ? .011 : .019) * (polar ? 1.38 : 1);
            ring[1] += fill * .48;
            ring[2] += fill;
            ring[3] += fill * 1.12;
        }
    const textile = cut === 'wool' || fit.style.openKnit ? 'wool' : cut === 'quilted' || cut === 'waxed' ? cut : 'outerwear';
    const surface = new human_cloth_js_1.Surface(textile), tail = new human_cloth_js_1.Surface(textile), strap = new human_cloth_js_1.Surface('leather'), flap = new human_cloth_js_1.Surface('leather');
    const { point, atAngle, armhole, sculpt, light, cut: cutSocket } = (0, human_sleeve_js_1.tailor)(shell, cut, fit);
    const finish = name => {
        const torso = surface.mesh(name);
        torso.add(collarLining(fit), personalGear(role, fit, point));
        return torso;
    };
    if (hero) {
        surface.loft(shell.slice(0, 8), l.main, 1, 28, .87, sculpt, false, cutSocket, light);
        surface.loft(shell.slice(7), (0, human_cloth_js_1.tint)(l.main, .92), 1, 28, .87, sculpt, false, (row, k) => cutSocket(row + 7, k), light);
    }
    else
        surface.loft(shell, l.main, 1, 28, .87, sculpt, false, cutSocket, light);
    surface.loft([[.514, .071, .067, .077, 0, .008], [.522, .061, .053, .063, 0, .009], [.519, .055, .047, .056, 0, .009]], l.shirt, 0, 28, .95, (p, a) => { p[1] -= .003 * Math.max(0, -Math.sin(a)); });
    if (parka && !fit.style.scarf)
        foldedHood(surface, fit);
    for (const side of parka ? [] : [-1, 1]) {
        const sections = [];
        for (let j = 0; j <= 15; j++) {
            const t = j / 15, s = Math.sin(t * Math.PI / 2), a = Math.PI / 2 - side * t * Math.PI * (long ? .80 : .82);
            const tip = T.MathUtils.smoothstep(t, .67, 1), y = .470 + .011 * Math.cos(t * Math.PI * 2) - (long ? .057 : .033) * tip;
            const bandY = .537 - .043 * tip + (structured ? .009 : 0);
            const inner = [(.064 + .033 * tip) * Math.cos(a), bandY, .008 + (.065 + .025 * tip) * Math.sin(a)];
            const outer = atAngle(y, a, .004), ridge = atAngle(y + .012, a, .008);
            const roll = [inner[0] * .73 + ridge[0] * .27, inner[1] * .64 + ridge[1] * .36 + .004, inner[2] * .73 + ridge[2] * .27];
            sections.push([inner, roll, outer]);
            if (!j)
                continue;
            const prev = sections[j - 1], back = Math.sin(a) > 0;
            surface.panel([[prev[0], inner], [prev[1], roll]], (0, human_cloth_js_1.tint)(l.shade, 1.06), 2, back);
            surface.panel([[prev[1], roll], [prev[2], outer]], l.shade, 2, back);
        }
    }
    const end = coatLength(role, fit);
    const hemWidth = hips + (long ? .028 : parka ? .025 : .013), hemFront = long ? .164 : parka ? .160 : .143, hemBack = depth + (long ? .043 : parka ? .048 : .037);
    const lower = [[end, hemWidth - .002, hemFront - .002, hemBack - .002, 0, .004], [end + .012, hemWidth, hemFront, hemBack, 0, .004],
        [(end + .048) / 2, hips + .013, hemFront - .007, hemBack - .008, 0, .005], [.052, hips + .004, .124, depth + .005, 0, .005]];
    const drape = (p, a, j) => {
        if (j < 2) {
            const front = -Math.sin(a);
            const vent = long ? .068 * Math.max(0, -front) ** 20 : 0;
            const opening = hero || structured ? .040 * Math.max(0, front) ** 16 : 0;
            p[1] += .010 * front + .006 * Math.cos(2 * a) + .004 * Math.sin(3 * a + .7) + vent + opening;
            p[2] += .004 * Math.sin(7 * a + .5);
        }
    };
    tail.loft(lower, l.main, 1, 28, .77, drape, true);
    const rolledEnd = hero ? .015 : trim ? .037 : parka ? .025 : .015;
    const rolled = [[end + .010, hemWidth + .004, hemFront + .004, hemBack + .004, 0, .004], [end + rolledEnd, hemWidth + .005, hemFront + .005, hemBack + .005, 0, .004]];
    tail.loft(rolled, (0, human_cloth_js_1.tint)(l.shade, .82), 2, 28, .77, drape);
    tail.loft([[end + .010, hemWidth - .006, hemFront - .008, hemBack - .008, 0, .004], [end + .020, hemWidth - .010, hemFront - .011, hemBack - .010, 0, .004],
        [end + .045, hemWidth - .009, hemFront - .014, hemBack - .013, 0, .004]], (0, human_cloth_js_1.tint)(l.shirt, .68), 0, 28, .77, drape);
    if (role === 'vendor') {
        const apron = lower.map(([y, w, f, b, x, z]) => [y + .013, w - .005, f + .003, b, x, z]);
        tail.loft(apron, '#354b47', 0, 28, .77, (p, a, j) => { drape(p, a, j); p[2] -= .009; }, false, (_, k) => Math.sin((k + .5) * Math.PI / 14) > -.72);
    }
    const seam = (coords, w, col, tag = 0, back = false, off = .003) => surface.stroke(coords.map(([x, y]) => point(x, y, off, back)), w, col, tag, back);
    const panel = (rows, col, tag = 0, back = false, off = .004, relief = .003) => surface.fittedPatch(rows, (x, y, rise) => point(x, y, rise, back), col, tag, back, off, relief);
    wornPocket(surface, fit, point);
    for (const s of [-1, 1]) {
        seam([[s * .080, .493], [s * .119, .462], [s * .154, .435], [s * (shoulder - .014), .397], [s * (chest - .012), .348]], .0033, l.shade, 2);
        seam([[s * .088, .488], [s * .141, .453], [s * (shoulder - .008), .419], [s * (chest - .002), .377]], .005, l.shade, 2, true);
        if (!long)
            seam([[s * .119, .069], [s * .139, .139], [s * .151, .207], [s * (chest - .020), .307]], .003, l.shade, 2);
        if (!parka)
            seam([[s * .041, .171], [s * .084, .166], [s * .134, .152]], .0024, (0, human_cloth_js_1.tint)(l.main, .77), 1);
    }
    if (cut === 'wool') {
        panel([[.036, .078, .039], [.034, .073, .192], [.036, .078, .302], [.023, .071, .366]], (0, human_cloth_js_1.tint)(l.main, .86), 1, false, .012, .002);
        panel([[-.010, .011, .317], [-.027, .028, .358], [-.050, .052, .419], [-.068, .070, .468], [-.050, .052, .504]], (0, human_cloth_js_1.tint)(l.shirt, .71), 0, false, .010, .009);
        for (let i = -2; i <= 2; i++)
            seam([[i * .011, .365], [i * .018, .432], [i * .017, .472]], .0022, (0, human_cloth_js_1.tint)(l.shirt, .91), 0, false, .023);
        seam([[.047, .047], [.049, .181], [.046, .286], [.024, .365]], .005, l.shade, 2, false, .018);
        for (const s of [-1, 1]) {
            panel([[.012, .020, .306], [.031, .073, .354], [.046, .108, .405], [.056, .126, .428], [.058, .096, .438], [.064, .114, .450], [.073, .099, .480], [.076, .085, .495]]
                .map(([lo, hi, y]) => [s * lo, s * hi, y]), (0, human_cloth_js_1.tint)(l.main, .76), 2, false, .025, .007);
            seam([[s * .013, .314], [s * .033, .363], [s * .048, .408], [s * .070, .470]], .0028, (0, human_cloth_js_1.tint)(l.main, 1.25), 1, false, .032);
            seam([[s * .084, .147], [s * .132, .163], [s * .151, .172]], .013, l.shade, 2);
            for (const y of [.115, .204, .290]) {
                const p = point(s * .073, y, .020);
                surface.loft([[p[1] - .006, .004, .003, .004, p[0], p[2]], [p[1], .008, .005, .005, p[0], p[2]], [p[1] + .006, .005, .002, .003, p[0], p[2]]], '#b59b70', 0, 8);
            }
        }
        seam([[0, .05], [0, .198], [0, .335], [0, .443]], .003, l.shade, 2, true);
        panel([[-.143, .143, .365], [-.157, .157, .386], [-.144, .142, .426], [-.093, .098, .474]], (0, human_cloth_js_1.tint)(l.shade, .90), 2, true, .009, .004);
        seam([[-.145, .382], [-.076, .377], [0, .370], [.078, .378], [.144, .382]], .003, (0, human_cloth_js_1.tint)(l.main, 1.25), 1, true, .013);
        panel([[-.129, .131, .101], [-.133, .135, .112], [-.128, .132, .136]], (0, human_cloth_js_1.tint)(l.shade, .75), 2, true, .019, .003);
        panel([[-.025, .029, .108], [-.025, .029, .130]], '#868379', 0, true, .025, .003);
        panel([[-.019, .023, .113], [-.019, .023, .126]], (0, human_cloth_js_1.tint)(l.shade, .62), 2, true, .030, .002);
        for (const side of [-1, 1]) {
            seam([[0, .304], [side * .052, .323], [side * .103, .343], [side * .150, .372]], .009, (0, human_cloth_js_1.tint)(l.shade, .90), 2, true, .005);
        }
    }
    else {
        const openFront = hero || fit.style.openKnit || fit.style.workJacket;
        const zipY = openFront ? .267 : trim ? .402 : .489;
        seam([[0, coatStart + .006], [.001, .13], [0, .235], [.002, zipY]], .013, l.shade, 2);
        seam([[.001, coatStart + .006], [.002, .13], [.001, .235], [.003, zipY]], .0033, '#ac9c86', 0, false, .006);
        for (const s of [-1, 1]) {
            seam([[s * .075, .091], [s * .100, .123], [s * .132, .165], [s * .145, .187]], hero || cut === 'waxed' ? .017 : .012, l.shade, 2);
            if (cut === 'waxed') {
                panel([[s * .050, s * .133, .109], [s * .052, s * .126, .124], [s * .053, s * .122, .158]], (0, human_cloth_js_1.tint)(l.main, .83), 1, false, .008);
                seam([[s * .053, .155], [s * .113, .155], [s * .129, .149]], .009, l.shade, 2, false, .010);
                seam([[s * .125, .124], [s * .088, .107], [s * .052, .110]], .0025, l.accent, 3, false, .010);
            }
        }
        if (openFront) {
            // Broad inset and raised edges remain distinct in the street camera.
            panel([[-.010, .012, .266], [-.031, .034, .317], [-.062, .066, .403], [-.069, .071, .465], [-.043, .045, .513]], l.shirt, 0, false, .015, .004);
            seam([[0, .272], [.001, .344], [0, .410], [.001, .458]], .006, (0, human_cloth_js_1.tint)(l.shirt, .72), 0, false, .021);
            if (fit.style.workJacket) {
                for (const [y, width] of [[.337, .034], [.394, .054], [.452, .065]])
                    seam([[-width, y], [0, y + .002], [width, y]], .007, (0, human_cloth_js_1.tint)(l.shirt, .59), 0, false, .023);
                for (const s of [-1, 1])
                    seam([[s * .024, .312], [s * .024, .386], [s * .024, .472]], .005, (0, human_cloth_js_1.tint)(l.shirt, 1.27), 0, false, .025);
            }
            for (const side of [-1, 1]) {
                const mirror = rows => rows.map(([lo, hi, y]) => [side * lo, side * hi, y]);
                panel(mirror([[.047, .055, .428], [.043, .080, .454], [.003, .071, .494], [.037, .059, .515]]), (0, human_cloth_js_1.tint)(l.shirt, 1.12), 0, false, .027, .006);
                const border = hero ? [[.010, .021, .265], [.032, .068, .330], [.058, .110, .407], [.070, .116, .438], [.074, .097, .447], [.067, .108, .462], [.062, .080, .484]] :
                    [[.009, .023, .263], [.032, .048, .317], [.063, .079, .403], [.068, .084, .461], [.053, .069, .490]];
                panel(mirror(border), (0, human_cloth_js_1.tint)(hero ? l.main : l.shade, hero ? 1.16 : 1.05), hero ? 1 : 2, false, .029, .007);
            }
        }
        if (hero) {
            panel([[-.175, .175, .343], [-.180, .180, .369], [-.157, .157, .419], [-.096, .097, .470]], (0, human_cloth_js_1.tint)(l.main, .84), 1, true, .011, .002);
            seam([[-.162, .346], [-.091, .337], [0, .334], [.093, .338], [.162, .347]], .0045, (0, human_cloth_js_1.tint)(l.main, 1.19), 1, true, .015);
            panel([[.107, .149, .353], [.104, .151, .366], [.106, .149, .372]], l.accent, 3, true, .020, .002);
            panel([[-.151, -.085, .284], [-.153, -.081, .297]], (0, human_cloth_js_1.tint)(l.main, .80), 1, false, .005, .002);
            seam([[-.152, .298], [-.120, .297], [-.082, .300]], .0028, (0, human_cloth_js_1.tint)(l.main, 1.17), 1, false, .009);
            const bag = new human_cloth_js_1.Surface('leather');
            bag.loft([[.140, .097, .046, .048, .035, .151], [.151, .130, .064, .073, .033, .157], [.171, .146, .074, .084, .032, .168], [.203, .148, .071, .087, .032, .166],
                [.287, .147, .065, .085, .031, .169], [.335, .138, .061, .077, .032, .159], [.364, .109, .054, .065, .036, .151], [.378, .086, .044, .045, .035, .149]], '#5e6356', 0, 20, .66, (p) => { p[1] += (p[0] - .03) * .10; }, true);
            bag.loft([[.158, .122, .037, .019, .031, .218], [.168, .132, .037, .027, .031, .225], [.195, .138, .034, .032, .030, .227],
                [.259, .135, .030, .027, .029, .229], [.274, .126, .028, .022, .027, .230]], '#454d46', 0, 18, .68, (p) => { p[1] += (p[0] - .03) * .10; }, true);
            bag.stroke([[-.076, .182, .253], [.028, .188, .259], [.131, .201, .253]], .0032, '#9f9581', 0, true);
            bag.stroke([[-.067, .258, .251], [.051, .271, .255], [.120, .280, .251]], .006, '#303c3c', 0, true);
            bag.panel([[[-.080, .229, .253], [-.023, .234, .259]], [[-.080, .245, .253], [-.023, .251, .259]]], '#ada184', 0, true);
            bag.stroke([[-.071, .237, .256], [-.041, .241, .261]], .0026, '#47483e', 0, true);
            const bagMesh = bag.mesh('courier-canvas-bag');
            bagMesh.scale.set(.84, .84, .80);
            bagMesh.position.set(.0874, -.0914, .0032);
            bagMesh.rotation.z = -.14;
            const rear = [[-.108, .472], [-.110, .449], [-.088, .422], [-.053, .387], [-.015, .346], [.032, .302], [.075, .263], [.116, .220], [.145, .195]];
            for (const [w, col, off] of [[.040, '#343e3a', .010], [.029, '#686b57', .013]]) {
                strap.stroke(rear.map(([x, y]) => { const p = point(x, y, off, true); p[1] -= .39; return p; }), w, col, 0, true);
            }
            const saddle = [[-.123, .457, -.064], [-.120, .474, -.031], [-.116, .489, .009], [-.109, .481, .051], [-.108, .469, .081]];
            strap.panel(saddle.map(([x, y, z]) => [[x - .016, y - .39, z], [x + .016, y - .39 + .006, z]]), '#555c50', 0, true);
            strap.stroke([[.144, -.250, -.070], [.163, -.265, -.015], [.177, -.277, .040], [.191, -.280, .098], [.203, -.273, .137]], .027, '#48534a', 0, true);
            strap.panel([[[.044, -.099, .142], [.064, -.116, .151]], [[.052, -.090, .141], [.073, -.108, .152]]], '#b4a781', 0, true);
            const flapRows = [[-.143, .093, .008, .012, 0, .026], [-.132, .121, .013, .017, 0, .030], [-.105, .136, .017, .021, 0, .027], [-.052, .139, .018, .025, 0, .019], [-.014, .130, .025, .021, 0, -.004], [.001, .111, .020, .012, 0, -.017]];
            flap.loft(flapRows, '#847e67', 0, 20, .62, (p) => {
                p[1] += .15 * p[0] + .012 * (p[0] / .145) ** 2;
                p[2] += .004 * Math.sin(p[0] * 42) - .003 * Math.cos(17 * p[1]);
            }, true);
            flap.stroke([[-.114, -.112, .040], [-.077, -.122, .050], [-.032, -.125, .053], [.021, -.119, .053], [.073, -.108, .048], [.114, -.093, .040]], .0042, '#b1a68a', 0, true);
            for (const x of [-.078, .080]) {
                const y = x * .15;
                flap.panel([[[x - .009, -.149 + y, .042], [x + .009, -.149 + y, .042]], [[x - .011, -.102 + y, .050], [x + .010, -.102 + y, .050]], [[x - .011, -.062 + y, .044], [x + .010, -.062 + y, .044]]], '#41443b', 0, true);
                flap.panel([[[x - .013, -.112 + y, .052], [x + .013, -.112 + y, .052]], [[x - .013, -.097 + y, .052], [x + .013, -.097 + y, .052]]], '#a1977b', 0, true);
                flap.panel([[[x - .008, -.108 + y, .053], [x + .008, -.108 + y, .053]], [[x - .008, -.101 + y, .053], [x + .008, -.101 + y, .053]]], '#494c40', 0, true);
            }
            flap.panel([[[-.048, -.043, .044], [-.001, -.039, .044]], [[-.048, -.030, .044], [-.001, -.026, .044]]], '#d0b68c', 0, true);
            const strapPts = [[-.128, .465], [-.119, .416], [-.091, .378], [-.038, .32], [.012, .269], [.062, .220], [.115, .17], [.157, .140]];
            for (const [width, col, off] of [[.032, '#343f3c', .010], [.021, '#555b4f', .013]])
                strap.stroke(strapPts.map(([x, y]) => { const p = point(x, y, off); p[1] -= .39; return p; }), width, col);
            const m = finish('courier-field-jacket');
            m.add(bagMesh);
            const lid = flap.mesh('bag-lid');
            lid.scale.copy(bagMesh.scale);
            lid.position.copy(exports.satchelPlacement.flap);
            lid.rotation.z = bagMesh.rotation.z;
            return { armhole, torso: m, tail: tail.mesh('jacket-hem'), strap: strap.mesh('webbing'), flap: lid };
        }
        if (parka) {
            for (const back of [false, true])
                for (const side of [-1, 1])
                    for (const y of [.134, .211, .286, .351]) {
                        const line = [[side * .019, y], [side * .061, y - .005], [side * .107, y + .002], [side * (chest - .039), y + .015]];
                        seam(line, .005, (0, human_cloth_js_1.tint)(l.shade, .92), 2, back, .008);
                        seam(line.map(([x, a]) => [x, a + .004]), .0027, (0, human_cloth_js_1.tint)(l.main, 1.19), 1, back, .009);
                    }
            surface.loft([[.463, .101, .091, .088, 0, .003], [.493, .093, .087, .086, 0, .004], [.519, .082, .076, .076, 0, .003], [.531, .072, .064, .072, 0, .003]], l.shirt, 0, 20, .91, (p, a) => { p[1] += .008 * Math.sin(2 * a); });
        }
        if (fit.style.workJacket) {
            for (const s of [-1, 1]) {
                const welt = [[.054, .134, .075], [.051, .143, .092], [.055, .153, .177], [.057, .151, .198]];
                panel(welt.map(([lo, hi, y]) => [s * lo, s * hi, y]), (0, human_cloth_js_1.tint)(l.main, .87), 1, false, .006, .002);
                seam([[s * .056, .196], [s * .104, .192], [s * .151, .199]], .004, l.shade, 2, false, .012);
            }
            panel([[-.149, -.081, .272], [-.157, -.080, .289], [-.157, -.078, .353]], (0, human_cloth_js_1.tint)(l.main, .89), 1, false, .007, .003);
            seam([[-.155, .345], [-.111, .342], [-.079, .347]], .005, l.shade, 2, false, .012);
        }
        else if (mechanic) {
            panel([[-.133, .133, .049], [-.144, .144, .114], [-.135, .135, .189], [-.096, .096, .258]], l.pants, 0, true, .009);
            for (const s of [-1, 1])
                seam([[s * .091, .237], [s * .071, .295], [s * .018, .366], [-s * .057, .435], [-s * .095, .476]], .025, l.pants, 0, true, .016);
            panel([[-.150, .150, .047], [-.146, .146, .119], [-.111, .111, .228], [-.099, .099, .307], [-.080, .082, .349]], l.pants, 0, false, .015, .009);
            for (const s of [-1, 1]) {
                seam([[s * .071, .334], [s * .087, .384], [s * .100, .436], [s * .092, .478]], .032, l.pants, 0, false, .020);
                seam([[s * .078, .352], [s * .081, .371], [s * .087, .389]], .014, '#a79a83', 0, false, .024);
                seam([[s * .079, .361], [s * .084, .376]], .007, (0, human_cloth_js_1.tint)(l.pants, .61), 0, false, .026);
                seam([[s * .139, .065], [s * .132, .156], [s * .107, .236], [s * .092, .301]], .0028, (0, human_cloth_js_1.tint)(l.pants, 1.36), 0, false, .021);
            }
            panel([[-.051, .046, .235], [-.061, .061, .260], [-.059, .059, .313]], (0, human_cloth_js_1.tint)(l.pants, 1.22), 0, false, .030, .009);
            seam([[-.055, .303], [.009, .306], [.057, .302]], .0045, '#b0a084', 0, false, .040);
            panel([[-.148, .148, .106], [-.151, .151, .135]], (0, human_cloth_js_1.tint)(l.pants, .72), 0, false, .014);
            panel([[-.034, .032, .115], [-.034, .032, .136]], '#a49175', 0, false, .021);
            seam([[.116, .136], [.132, .2], [.141, .226]], .009, '#656a64', 0, false, .021);
            if (role === 'mechanic') {
                panel([[-.085, .084, .175], [-.110, .111, .207], [-.099, .100, .267], [-.069, .068, .290]], (0, human_cloth_js_1.tint)(l.pants, .91), 0, true, .023, .014);
                seam([[-.097, .261], [-.038, .270], [.029, .267], [.098, .253]], .009, '#9c856a', 0, true, .040);
                for (const s of [-1, 1])
                    seam([[s * .060, .181], [s * .087, .210], [s * .097, .248]], .004, (0, human_cloth_js_1.tint)(l.pants, 1.55), 0, true, .038);
            }
        }
        if (cut === 'windbreaker' && !fit.style.openKnit) {
            for (const back of [false, true])
                panel([[-.178, .179, .308], [-.187, .187, .329], [-.163, .162, .356]], l.shade, 2, back, .009);
            for (const s of [-1, 1])
                seam([[s * .036, .323], [s * .101, .330], [s * .169, .344]], .005, l.accent, 3, false, .015);
            if (role === 'courier') {
                panel([[-.106, .092, .099], [-.134, .120, .153], [-.137, .110, .196], [-.114, .084, .218]], (0, human_cloth_js_1.tint)(l.main, .66), 1, false, .013, .006);
                seam([[-.104, .212], [-.060, .196], [.012, .180], [.086, .178]], .014, l.shade, 2, false, .022);
                seam([[-.089, .207], [-.044, .192], [.020, .179], [.078, .179]], .003, l.accent, 3, false, .024);
                for (const back of [false, true])
                    panel([[-.134, .137, .062], [-.139, .141, .096], [-.136, .136, .117]], l.shade, 2, back, .012, .002);
            }
        }
    }
    (0, human_kits_js_1.addKit)(surface, fit.style, point, shoulder);
    let reflectors;
    if (fit.style.reflective) {
        const tape = new human_cloth_js_1.Surface('outerwear');
        for (const back of [false, true]) {
            for (const side of [-1, 1]) {
                const row = (y, inner, outer) => [side < 0 ? -outer : inner, side < 0 ? -inner : outer, y];
                const clothPoint = (x, y, rise) => point(x, y, rise, back);
                tape.fittedPatch([row(.308, .067, .173), row(.331, .067, .164)], clothPoint, fit.style.reflective, 0, back, .020, .001);
                tape.fittedPatch([row(.331, .076, .103), row(.423, .082, .109)], clothPoint, fit.style.reflective, 0, back, .020, .001);
            }
        }
        reflectors = tape.mesh('reflective-jacket-tape');
        reflectors.material = reflectorMaterial;
    }
    return { armhole, torso: finish('winter-outerwear'), tail: tail.mesh('coat-hem'), strap: null, flap: null, reflectors };
}
function limbs(side, fit, role, socket) {
    const l = fit.look, suit = fit.cut === 'wool', utility = fit.cut === 'workwear' || role === 'hero', trim = fit.cut === 'windbreaker';
    const { arm, leg } = limbFit(role, fit);
    const scale = (rows, factor) => rows.map(([y, w, f, b, x = 0, z = 0]) => [y, w * factor, f * factor, b * factor, x * side, z]);
    const arms = scale([[.042, .023, .032, .034, -.016, .001], [.034, .049, .054, .056, -.009, .002], [.015, .063, .070, .072, -.003, .002], [-.019, .072, .075, .076, .002, .004],
        [-.061, .068, .070, .077, .004, .006], [-.109, .061, .063, .071, .004, .010], [-.157, .054, .060, .068, .002, .011],
        [-.190, .052, .054, .063, 0, .013], [-.217, .049, .051, .060, 0, .014], [-.246, .048, .048, .058, 0, .015], [-.274, .049, .049, .059, 0, .012],
        [-.305, .051, .052, .056, 0, .009], [-.330, .053, .054, .055, 0, .005], [-.364, .048, .052, .048, 0, .001],
        [-.402, .041, .044, .044, 0, -.003], [-.429, .035, .041, .039, 0, -.007], [-.442, .034, .037, .036, 0, -.008]], arm);
    const thighs = scale([[.035, .071, .085, .091, -.002, .015], [.002, .084, .100, .112, -.001, .012], [-.055, .091, .109, .121, .002, .010],
        [-.113, .089, .111, .119, .003, .007], [-.176, .085, .107, .104, .003, .001], [-.246, .075, .096, .089, .003, -.004],
        [-.302, .068, .083, .078, .002, -.007], [-.337, .064, .076, .072, .001, -.008], [-.368, .062, .072, .068, 0, -.011], [-.401, .063, .073, .064, 0, -.013],
        [-.433, .060, .071, .063, 0, -.012], [-.469, .058, .064, .064, 0, -.007], [-.5, .058, .058, .068, .001, 0],
        [-.535, .065, .061, .077, .002, .008], [-.584, .069, .062, .083, .004, .014], [-.635, .064, .057, .077, .004, .016],
        [-.692, .058, .052, .065, .004, .014], [-.733, .054, .052, .060, .003, .010], [-.747, .057, .055, .062, .003, .010],
        [-.759, .053, .050, .057, .003, .009], [-.774, .058, .055, .064, .003, .009], [-.786, .058, .055, .065, .003, .009], [-.798, .057, .053, .064, .003, .008]], leg);
    const shift = (rows, offset) => rows.map(r => [r[0] + offset, ...r.slice(1)]);
    const aBend = new human_cloth_js_1.Surface('sleeves'), lower = new human_cloth_js_1.Surface('sleeves', -.251);
    const thigh = new human_cloth_js_1.Surface('trousers'), kBend = new human_cloth_js_1.Surface('trousers'), calf = new human_cloth_js_1.Surface('trousers', -.41);
    const upper = (0, human_sleeve_js_1.setInSleeve)(side, socket, side * fit.shoulderWidth, arms, l.main, role === 'hero' || role === 'dispatcher' ? l.accent : l.shirt, role === 'hero', fit.style.openKnit ? 'knit' : fit.cut);
    aBend.loft(arms.slice(7, 13), l.main, 1, 24, .90);
    lower.loft(shift(arms.slice(12), .251), l.main, 1, 24, .90, undefined, true);
    const cuff = scale([[-.172, .037, .041, .040, 0, -.006], [-.184, .037, .042, .039, 0, -.008], [-.196, .033, .037, .036, 0, -.008]], arm);
    lower.loft(cuff, role === 'mechanic' ? l.shirt : l.shade, role === 'mechanic' ? 0 : 2, 16, .91, undefined, true);
    if (role === 'hero')
        lower.loft(scale([[-.165, .040, .045, .043, 0, -.005], [-.175, .039, .044, .042, 0, -.007]], arm), l.accent, 3, 16, .91);
    const forePanels = (rows, color, back, rise) => lower.fittedPatch(rows, (x, y, d) => {
        const base = back ? Math.max(.038, .053 + (y + .07) * .14) : Math.max(.043, .053 + (y + .06) * .10);
        return [side * x * arm, y, (back ? 1 : -1) * ((base * Math.sqrt(1 - (x / .056) ** 2)) * arm + d)];
    }, color, 2, back, rise, .002);
    if (utility) {
        forePanels([[-.023, .025, -.163], [-.025, .032, -.136], [-.026, .033, -.079], [-.021, .026, -.063]], (0, human_cloth_js_1.tint)(l.shade, .84), true, .011);
        forePanels([[.004, .028, -.158], [.003, .027, -.143], [.006, .025, -.133]], (0, human_cloth_js_1.tint)(l.shade, .70), false, .009);
    }
    else if (suit) {
        for (const y of [-.134, -.155])
            lower.loft([[y - .004, .006, .005, .004, side * .024, .041], [y + .004, .006, .005, .004, side * .024, .041]], '#a69676', 0, 8, .92, undefined, true);
    }
    const straight = suit || role === 'hero' || fit.cut === 'waxed', work = fit.cut === 'workwear', loose = straight ? .013 : work ? .012 : trim ? .001 : .006;
    const trouserForm = (offset) => (p, a) => {
        const y = p[1] - offset, c = Math.cos(a), sn = Math.sin(a), outer = c * side;
        const bump = (centre, width) => Math.exp(-(((y - centre) / width) ** 2));
        const crease = (centre, width) => Math.exp(-(((sn - centre) / width) ** 2));
        const breakAtBoot = T.MathUtils.smoothstep(-y, .62, .79);
        const taper = (role === 'hero' ? .006 : role === 'vendor' ? -.010 : trim ? -.009 : 0) * breakAtBoot;
        const volume = role === 'mechanic' ? .016 * bump(-.29, .115) + .010 * bump(-.67, .105) : 0;
        const ease = volume + taper + loose * T.MathUtils.smoothstep(-y, .20, .62);
        const quadriceps = (work ? .012 : .009) * bump(-.186, .131) * Math.max(outer, 0);
        const calf = (straight ? .002 : trim ? .010 : .007) * bump(-.58, .099) * Math.max(sn, 0);
        const inner = .005 * bump(-.086, .061) * Math.max(-outer, 0);
        const fabric = (work ? .92 : straight ? .47 : .78) * (.008 * bump(-.358 + .024 * outer, .018) + .007 * bump(-.436 - .018 * c, .022)
            - .005 * bump(-.477 + .022 * c, .017) + .006 * bump(-.728 + .026 * c, .014) + .006 * bump(-.776 - .016 * c, .011));
        const pressed = (straight ? .007 : .003) * bump(-.267, .25) * crease(-1, .051);
        p[0] += c * (ease + quadriceps + inner + fabric);
        p[2] += sn * (ease * .78 + quadriceps * .65 + calf + fabric + pressed);
    };
    thigh.loft(thighs.slice(0, 8), l.pants, 0, 20, .91, trouserForm(0), true);
    kBend.loft(thighs.slice(7, 13), l.pants, 0, 20, .91, trouserForm(0));
    calf.loft(shift(thighs.slice(12), .410), l.pants, 0, 20, .91, trouserForm(.41), true);
    const pantCuff = shift(thighs.slice(-2), .410);
    for (const r of pantCuff) {
        r[1] += .0008;
        r[2] += .001;
        r[3] += .001;
    }
    calf.loft(pantCuff, (0, human_cloth_js_1.tint)(l.pants, .81), 0, 20, .91, trouserForm(.41));
    thigh.stroke([[side * .055, -.054, -.077], [side * .057, -.084, -.090], [side * .054, -.123, -.092]], .003, (0, human_cloth_js_1.tint)(l.pants, .63));
    calf.stroke([[side * .025, -.144, -.042], [side * .029, -.199, -.034], [side * .02, -.265, -.031]], .0034, (0, human_cloth_js_1.tint)(l.pants, .8));
    if (work) {
        const patch = (rows, col) => thigh.loft(scale(rows, leg), col, 0, 12, .72, undefined, true);
        const cloth = (0, human_cloth_js_1.tint)(l.pants, .75), seam = (0, human_cloth_js_1.tint)(l.pants, 1.17);
        patch([[-.277, .021, .032, .029, .075, .006], [-.263, .029, .052, .042, .079, .005], [-.202, .034, .060, .044, .081, .006],
            [-.147, .030, .055, .039, .083, .004], [-.137, .022, .035, .031, .078, .003]], cloth);
        patch([[-.158, .030, .058, .042, .085, .003], [-.149, .035, .061, .047, .085, .003], [-.140, .027, .054, .042, .081, .003]], seam);
        const face = role === 'mechanic' ? '#55544b' : (0, human_cloth_js_1.tint)(l.pants, 1.19);
        kBend.loft(thighs.slice(8, 12), face, 0, 20, .91, (p, a) => {
            trouserForm(0)(p, a);
            p[2] -= .004 + .005 * Math.max(0, -Math.sin(a));
            p[0] += .002 * Math.cos(a);
        }, false, (_, k) => Math.sin((k + .5) * Math.PI / 10) > -.53);
    }
    const fore = lower.mesh('forearm-sleeve');
    const innerCuff = new human_cloth_js_1.Surface('knit', .211);
    innerCuff.loft([[-.212, .025 * arm, .026 * arm, .032 * arm, side * .002, -.004], [-.194, .026 * arm, .028 * arm, .036 * arm, side * .002, -.004],
        [-.179, .030 * arm, .032 * arm, .039 * arm, side * .002, -.003]], (0, human_cloth_js_1.tint)(l.shirt, .82), 0, 14, .91);
    fore.add((0, human_extremities_js_1.sculptHand)(side, fit, role), innerCuff.mesh('rib-knit-cuff'));
    return { aUpper: upper, aLower: fore, armBends: aBend.mesh('sleeve-elbow-gusset'), lUpper: thigh.mesh('trouser-thigh'), lLower: calf.mesh('trouser-shin'), legBends: kBend.mesh('trouser-knee-gusset'), feet: (0, human_extremities_js_1.sculptBoot)(side, fit, role) };
}
function props() {
    const goods = new model_geometry_js_1.Batch(), tape = new model_geometry_js_1.Batch(), cup = new model_geometry_js_1.Batch(), block = new model_geometry_js_1.Batch();
    goods.box(0, 0, 0, .179, .18, .079, '#c7a178');
    goods.box(.012, 0, -.041, .024, .18, .006, '#a38c65');
    tape.box(0, 0, 0, .098, .063, .019, '#434e50');
    tape.box(0, 0, -.011, .084, .032, .004, '#b9a27f');
    cup.add(new T.CylinderGeometry(.042, .030, .11, 12), [0, 0, 0], [1, 1, 1], '#96795b');
    cup.add(new T.CylinderGeometry(.044, .044, .010, 12), [0, .054, 0], [1, 1, 1], '#d5c4a7');
    block.box(0, 0, 0, .18, .124, .10, '#3b535a');
    block.box(0, -.005, .053, .156, .083, .012, '#af8b58');
    block.box(0, .050, .053, .140, .012, .013, '#94bca9');
    for (const side of [-1, 1])
        block.box(side * .083, 0, 0, .015, .132, .101, '#778285');
    (0, model_geometry_js_1.stencil)(block, '77', [0, -.005, .061], .0033, '#40464b');
    return { goods: goods.mesh(), tape: tape.mesh(), cup: cup.mesh(), parcel: block.mesh() };
}
const belongings = props();
function garments(role, variant) {
    const fit = appearance(role, variant), t = upperBody(role, fit), pair = [limbs(-1, fit, role, t.armhole(-1)), limbs(1, fit, role, t.armhole(1))];
    const seat = new human_cloth_js_1.Surface();
    seat.loft([[-.113, .094, .057, .061, 0, .014], [-.085, fit.hipWidth + .054, .078, .091, 0, .013], [-.040, fit.hipWidth + .077, .096, .116, 0, .012], [.017, fit.hipWidth + .079, .103, .118, 0, .010], [.063, fit.hipWidth + .058, .096, .096, 0, .007]], fit.look.pants, 0, 22, .86, (p, a, j) => {
        if (j <= 1)
            p[1] += .024 * Math.abs(Math.sin(a));
    }, true);
    return { ...fit, ...t, ...belongings, seat: seat.mesh('trouser-seat'), aUpper: pair.map(p => p.aUpper), aLower: pair.map(p => p.aLower), armBends: pair.map(p => p.armBends),
        lUpper: pair.map(p => p.lUpper), lLower: pair.map(p => p.lLower), legBends: pair.map(p => p.legBends), feet: pair.map(p => p.feet) };
}
