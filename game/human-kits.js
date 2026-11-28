"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.civilians = exports.jobs = void 0;
exports.streetWardrobe = streetWardrobe;
exports.addKit = addKit;
exports.jobs = {
    hero: { cut: 'field', kit: 'courier', main: '#705447', shade: '#503e39', accent: '#c7a36b', shirt: '#c2cbc7', pants: '#89867b', scale: 1, build: .16 },
    vendor: { cut: 'quilted', kit: 'repair', main: '#356763', shade: '#243f44', accent: '#a9b8a1', shirt: '#758779', pants: '#494852', scale: .939, build: -.42 },
    dispatcher: { cut: 'wool', kit: 'dispatch', main: '#465865', shade: '#313e4b', accent: '#d6b679', shirt: '#77726b', pants: '#414b4c', scale: 1.051, build: .68 },
    mechanic: { cut: 'workwear', kit: 'garage', main: '#884c43', shade: '#59363a', accent: '#d1a477', shirt: '#3e4f59', pants: '#304651', scale: .995, build: .36 },
    courier: { cut: 'quilted', kit: 'messenger', scarf: '#8a7566', main: '#667564', shade: '#3e4941', accent: '#c1a37b', shirt: '#836e57', pants: '#393d3e', scale: 1.025, build: -.56 }
};
const heroJacket = exports.jobs.hero;
exports.heroCoats = [
    { name: 'Табачная куртка', dyes: [heroJacket.main, heroJacket.shade, heroJacket.accent] },
    { name: 'Еловая куртка', dyes: ['#477a72', '#365b53', '#c4c892'] },
    { name: 'Синяя рабочая куртка', dyes: ['#4b627d', '#36475d', '#b7c3ba'] }
];
const rail = { cut: 'waxed', kit: 'rail', gait: 'patrol' }, commuter = { cut: 'wool', kit: 'commuter', gait: 'commuter' };
const polar = { cut: 'quilted', kit: 'polar', gait: 'careful' }, transit = { cut: 'windbreaker', kit: 'transit', gait: 'quick' };
const site = { cut: 'workwear', kit: 'worksite', gait: 'worker', reflective: '#e1e0bf', posture: .035 }, canal = { cut: 'waxed', kit: 'canal', gait: 'worker' };
exports.civilians = [
    { ...rail, main: '#876847', shade: '#504939', accent: '#e8b569', shirt: '#6f6051', pants: '#3f4248', scale: 1.035, build: .36 },
    { ...commuter, scarf: '#ce926e', main: '#526279', shade: '#353e52', accent: '#c08b70', shirt: '#af8971', pants: '#434652', scale: .898, build: -.36, hemOffset: -.045, posture: .025 },
    { ...polar, backpack: true, main: '#4d747e', shade: '#354f57', accent: '#b2c4b5', shirt: '#776a61', pants: '#383f49', scale: 1.056, build: .64, hemOffset: .075, posture: -.07 },
    { ...polar, scarf: '#c4aa91', main: '#725765', shade: '#51404e', accent: '#c5a6a0', shirt: '#a98b8b', pants: '#44494e', scale: .954, build: -.19, hemOffset: -.096, gait: 'commuter' },
    { ...transit, openKnit: true, main: '#456d69', shade: '#344f50', accent: '#b69c76', shirt: '#c8bca5', pants: '#434c59', scale: .992, build: -.53, bootColor: '#a39f89' },
    { ...site, main: '#ac843f', shade: '#674b35', accent: '#dfca85', shirt: '#5a543e', pants: '#424557', scale: 1.071, build: .53 },
    { ...commuter, main: '#605e58', shade: '#3e4242', accent: '#bf863f', shirt: '#a58663', pants: '#454446', scale: .967, build: .19, hemOffset: .065, gait: 'careful' },
    { ...transit, main: '#49676e', shade: '#313d52', accent: '#83afa6', shirt: '#5d6b75', pants: '#728184', scale: 1.021, build: -.45, gait: 'courier' },
    { ...canal, main: '#617266', shade: '#455549', accent: '#b8a37f', shirt: '#7b6d61', pants: '#455052', scale: .992, build: .36 },
    { ...polar, main: '#5b657c', shade: '#3b4758', accent: '#ccc4a8', shirt: '#b2a080', pants: '#454b59', scale: .933, build: .18 },
    { ...site, workJacket: true, main: '#546979', shade: '#394b57', accent: '#bb9875', shirt: '#a76e54', pants: '#52574f', scale: 1.018, build: .77, legEase: .11, hemOffset: -.028 },
    { ...transit, openKnit: true, main: '#784c54', shade: '#573b44', accent: '#c7ad8c', shirt: '#c3b7a2', pants: '#404853', scale: 1.031, build: -.24 },
    { ...rail, main: '#65535a', shade: '#4d4148', accent: '#ceb17e', shirt: '#756b64', pants: '#504649', scale: .982, build: .55 },
    { ...commuter, scarf: '#c8b18c', main: '#77616b', shade: '#4d454d', accent: '#cd9f8b', shirt: '#baa495', pants: '#484350', scale: .920, build: .24, hemOffset: -.035, posture: .043, bootColor: '#8c6552' },
    { ...polar, main: '#5c6850', shade: '#454c38', accent: '#b7b185', shirt: '#6f6545', pants: '#444c43', scale: 1.050, build: .70, legEase: .09, gait: 'worker' }
];
const outerWardrobe = {
    radio: [6, 11],
    quarry: [5, 2],
    water: [9, 4],
    dock: [8, 13],
    northpark: [1, 3],
    cargo: [0, 5],
    dam: [8, 10],
    mill: [14, 12]
};
const streetOrder = [0, 3, 4, 5, 1, 8, 2, 7, 6, 10, 9, 12, 11, 13, 14];
const regularWardrobe = {
    'shop-0': 4, 'shop-1': 5, 'shop-2': 6, 'pass-07': 7, 'pass-12': 8, 'pass-07m': 9,
    'pass-shift': 10, 'pass-shiftm': 11, 'call-cab-canal': 12, 'call-cab-port': 13, 'call-cab-north': 14, 'call-cab-cargo': 0
};
function streetWardrobe(id, fallback) {
    const region = /^region-([a-z]+)-walker-(0|2)$/.exec(id);
    if (region)
        return outerWardrobe[region[1]]?.[Number(region[2]) / 2] ?? fallback;
    const numbered = /^(ambient-walker|walker|local)-(\d+)$/.exec(id);
    if (numbered) {
        const start = numbered[1] === 'local' ? 6 : numbered[1] === 'walker' ? 3 : 0;
        return streetOrder[(Number(numbered[2]) + start) % streetOrder.length];
    }
    return Object.hasOwn(regularWardrobe, id) ? regularWardrobe[id] : fallback;
}
function addKit(surface, style, point, shoulder) {
    const human_cloth_js_1 = require("./human-cloth.js");
    const { kit, main, shade, accent, shirt, pants } = style;
    function patch(rows, color, back = false, rise = .007, tag = 0) {
        for (let col = 0; col < 4; col++) {
            surface.panel(rows.map(([y, left, right]) => {
                const depth = (i) => rise + .0025 * Math.sin(i * Math.PI / 4);
                const x = (i) => left + (right - left) * i / 4;
                return [point(x(col), y, depth(col), back), point(x(col + 1), y, depth(col + 1), back)];
            }), color, tag, back);
        }
    }
    function line(path, width, color, back = false, rise = .010, tag = 0) {
        surface.stroke(path.map(([x, y]) => point(x, y, rise, back)), width, color, tag, back);
    }
    function pouch(x, y, z, width, height, depth, color) {
        surface.loft([
            [y - height * .5, width * .78, depth * .76, depth * .76, x, z],
            [y - height * .38, width, depth, depth, x, z],
            [y + height * .34, width, depth, depth, x, z],
            [y + height * .5, width * .80, depth * .67, depth * .67, x, z]
        ], color, 0, 9, .63, undefined, true);
    }
    switch (kit) {
        case 'courier':
            patch([[.247, -.162, -.062], [.291, -.171, -.067], [.326, -.171, -.070], [.349, -.157, -.075]], (0, human_cloth_js_1.tint)(main, .76), true, .008, 1);
            patch([[.210, .021, .079], [.246, .046, .135], [.307, .066, .163], [.359, .077, .156], [.400, .075, .143]], '#626454', false, .018);
            patch([[.255, .061, .116], [.279, .077, .144], [.301, .084, .143]], '#596055', false, .027);
            line([[.063, .279], [.108, .289], [.140, .294]], .011, '#d1b483', false, .032);
            break;
        case 'messenger':
            surface.loft([[.462, .105, .099, .080, 0, .004], [.495, .097, .085, .077, 0, .005], [.524, .084, .075, .070, 0, .005], [.538, .074, .067, .062, 0, .006]], shirt, 0, 24, .82, (p, a) => { p[1] += .009 * Math.sin(2 * a + .43); p[2] += .004 * Math.sin(5 * a); }, false);
            for (const back of [false, true]) {
                line([[-.110, .417], [-.026, .336], [.053, .258], [.131, .177]], .024, '#635d48', back, .027);
                line([[-.114, .416], [-.030, .335], [.049, .257], [.128, .176]], .005, accent, back, .030);
            }
            pouch(.103, .147, .128, .073, .106, .043, '#736959');
            line([[.050, .155], [.098, .158], [.140, .166]], .012, accent, true, .046);
            break;
        case 'repair':
            patch([[.097, -.130, .133], [.127, -.142, .145], [.276, -.112, .104], [.316, -.082, .083]], '#3b4945', false, .013);
            line([[-.088, .291], [-.099, .355], [-.109, .428], [-.097, .468]], .022, '#aaa184', false, .016);
            line([[.075, .294], [.088, .365], [.103, .425], [.095, .463]], .020, '#aaa184', false, .016);
            pouch(.043, .185, -.137, .064, .086, .024, '#645b4c');
            line([[-.040, .244], [.024, .240], [.103, .237]], .013, accent, false, .037);
            line([[-.129, .390], [-.076, .292], [.004, .217], [.101, .172]], .012, '#675e50', true, .018);
            line([[.126, .391], [.077, .291], [-.006, .221], [-.099, .172]], .012, '#675e50', true, .018);
            break;
        case 'dispatch':
            pouch(-.107, .308, -.139, .040, .088, .022, '#2c353e');
            pouch(-.115, .370, -.141, .004, .060, .006, '#323638');
            patch([[.290, -.124, -.089], [.314, -.122, -.091]], '#c0aa83', false, .036);
            patch([[.316, -.124, -.092], [.328, -.124, -.092]], '#688b85', false, .034);
            line([[-.124, .389], [-.099, .415], [-.091, .456]], .016, '#6b6b62', false, .018);
            line([[.053, .355], [.082, .352], [.120, .348]], .018, accent, false, .018);
            break;
        case 'garage':
        case 'worksite':
            if (style.workJacket)
                break;
            for (const back of [false, true]) {
                const hi = kit === 'garage' ? '#a98872' : accent;
                patch([[.149, -.155, .155], [.169, -.157, .157]], shade, back, .012);
                patch([[.153, -.155, .155], [.165, -.155, .155]], hi, back, .016);
                if (kit === 'worksite') {
                    for (const s of [-1, 1])
                        patch([[.196, s * .123 - .014, s * .123 + .014], [.293, s * .113 - .016, s * .113 + .016], [.419, s * .129 - .013, s * .129 + .013]], accent, back, .016);
                }
            }
            pouch(.086, .119, -.144, .048, .079, .030, kit === 'garage' ? '#5d4c41' : pants);
            pouch(.099, .169, -.149, .011, .083, .013, '#82867c');
            pouch(.065, .172, -.151, .010, .060, .012, '#9f6451');
            if (kit === 'garage') {
                line([[-.150, .344], [-.081, .352], [-.016, .355], [.049, .346], [.150, .335]], .023, accent, true, .018);
                patch([[.273, -.071, .066], [.304, -.075, .071], [.323, -.060, .058]], shade, true, .019);
                for (let stroke = 0; stroke < 5; stroke++)
                    line([[-.047 + stroke * .022, .285], [-.045 + stroke * .022, .317]], .004, '#bc9b73', true, .024);
            }
            break;
        case 'commuter': {
            const rust = style.scarf ?? shirt;
            surface.loft([[.477, .092, .090, .080, 0, .006], [.502, .085, .082, .075, 0, .003], [.526, .076, .071, .069, 0, .002], [.543, .071, .066, .067, 0, .001]], (0, human_cloth_js_1.tint)(rust, .90), 0, 18, .96, (p, a) => { p[1] += .016 * Math.sin(a - .4); p[2] += .006 * Math.cos(a * 3); }, false);
            patch([[.187, -.042, .026], [.284, -.052, .030], [.377, -.055, .052], [.453, -.063, .067], [.488, -.071, .063]], rust, false, .033);
            for (let n = 0; n < 4; n++) {
                const x = -.039 + n * .019;
                line([[x, .184], [x - .004, .200], [x + .001, .219]], .004, (0, human_cloth_js_1.tint)(accent, .84), false, .039);
            }
            break;
        }
        case 'rail':
            for (const back of [true, false]) {
                patch([[.278, -shoulder + .019, shoulder - .019], [.321, -shoulder + .016, shoulder - .016], [.361, -shoulder + .018, shoulder - .018]], shade, back, .008);
                patch([[.284, -shoulder + .023, shoulder - .023], [.298, -shoulder + .022, shoulder - .022]], accent, back, .011);
            }
            pouch(-.108, .210, -.120, .041, .078, .022, '#564d45');
            break;
        case 'polar':
            for (const side of [-1, 1]) {
                line([[side * .068, .099], [side * .097, .127], [side * .143, .172]], .017, shade, false, .010);
                line([[side * .078, .107], [side * .110, .142], [side * .145, .178]], .004, accent, false, .013);
            }
            if (style.scarf) {
                const edge = (0, human_cloth_js_1.tint)(style.scarf, .72);
                patch([[.235, .036, .088], [.253, .030, .093], [.342, .009, .076], [.414, -.005, .065], [.481, -.034, .062]], style.scarf, false, .014);
                patch([[.245, .032, .090], [.253, .030, .092]], edge, false, .018);
                const wrap = (p, a) => { p[1] += .019 * Math.cos(a) - .012 * Math.max(0, -Math.sin(a)); };
                surface.loft([[.453, .104, .096, .096], [.473, .119, .106, .102], [.496, .099, .095, .089],
                    [.512, .105, .092, .086], [.538, .084, .073, .076], [.543, .064, .056, .061]], style.scarf, 0, 22, .86, wrap);
            }
            else
                patch([[.302, -.123, -.081], [.327, -.122, -.082]], (0, human_cloth_js_1.tint)(accent, .83), false, .016);
            break;
        case 'transit':
            if (style.openKnit)
                break;
            for (const back of [false, true]) {
                patch([[.234, -.122, -.092], [.289, -.163, -.113], [.353, -.168, -.134], [.402, -.157, -.130]], shade, back, .007);
                patch([[.228, .090, .108], [.286, .097, .132], [.342, .120, .158], [.396, .131, .152]], accent, back, .012);
            }
            break;
        case 'canal':
            surface.loft([[.450, .128, .106, .093, 0, .008], [.481, .104, .092, .092, 0, .006], [.511, .091, .074, .081, 0, .006]], accent, 0, 20, .75, (p, a) => { p[1] -= .014 * Math.max(0, -Math.sin(a)); p[2] += .005 * Math.cos(a * 5); }, false);
            for (const side of [-1, 1]) {
                patch([[.105, side * .080 - .050, side * .080 + .050], [.121, side * .080 - .055, side * .080 + .055], [.204, side * .080 - .050, side * .080 + .050]], (0, human_cloth_js_1.tint)(main, .79), false, .010);
                line([[side * .036, .200], [side * .090, .200], [side * .128, .196]], .013, shade, false, .014);
            }
            break;
    }
}
