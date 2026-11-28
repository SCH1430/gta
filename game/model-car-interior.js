"use strict";

const T = require("../engine/three.module.min.js");
const { Batch, glass, lit, tube, ring, stencil } = require("./model-geometry.js");
const { carCabin, specs } = require("./vehicle-cabin.js");

const upholsteries = {
    hatch: ['#576771', '#394951', '#9baea8', 'cloth'],
    sedan: ['#656054', '#413c38', '#887c69', 'cloth'],
    van: ['#525d58', '#373f41', '#a1a392', 'vinyl'],
    patrol: ['#445464', '#343e50', '#84929a', 'cloth'],
    suv: ['#656854', '#454b41', '#9e997b', 'cloth'],
    pickup: ['#736455', '#51493e', '#b4a088', 'vinyl'],
    coupe: ['#59403d', '#3d2c31', '#b67a65', 'sport'],
    taxi: ['#64696c', '#40464a', '#b8a47b', 'vinyl'],
    wagon: ['#555b64', '#424653', '#8e9ba6', 'cloth'],
    towtruck: ['#6e5c48', '#4b4239', '#a88d6e', 'vinyl'],
    utility: ['#585b4e', '#3f453e', '#a6a482', 'vinyl']
};
const instruments = {
    hatch: ['#b9d3b1', '#e8a362', 'classic'],
    sedan: ['#aad3d0', '#e7ad83', 'twin'],
    van: ['#a9ece1', '#dec280', 'charge'],
    patrol: ['#87bfaa', '#f29769', 'twin'],
    suv: ['#c2d29e', '#eed17b', 'twin'],
    pickup: ['#dcbe83', '#e89e71', 'classic'],
    coupe: ['#87e3d4', '#ed9878', 'digital'],
    taxi: ['#e4cf9a', '#e5a677', 'digital'],
    wagon: ['#99c6a7', '#ebb273', 'classic'],
    towtruck: ['#e2bb7c', '#81c4a7', 'service'],
    utility: ['#d5d3a0', '#ffb96c', 'plough']
};
const seatCloth = new T.MeshStandardMaterial({ vertexColors: true, roughness: .96, side: T.DoubleSide });
const seatVinyl = new T.MeshStandardMaterial({ vertexColors: true, roughness: .49, side: T.DoubleSide });
const seatSport = new T.MeshStandardMaterial({ vertexColors: true, roughness: .61, side: T.DoubleSide });

function seatMaterial(kind) {
    const style = upholsteries[kind][3];
    return style === 'cloth' ? seatCloth : style === 'vinyl' ? seatVinyl : seatSport;
}

function addSeat(body, kind, side, z, y, series) {
    const [cloth, shell, stitch, style] = upholsteries[kind];
    const x = side * carCabin(kind).seatX, sport = style === 'sport', fabric = style === 'cloth';
    const height = sport ? .405 : .473;
    const width = sport ? .236 : .249;
    const main = kind === 'hatch' && series ? '#626d63' : cloth;
    const bolster = sport ? .074 : .038;
    body.ball(x, y - .080, z, width, .082, .249, shell);
    body.ball(x, y - .042, z - .022, width * .74, .051, .219, main);
    body.ball(x, y + .175, z + .202, width * .96, .229, .098, shell, [-.132, 0, 0]);
    body.ball(x, y + .173, z + .123, width * .67, .190, .041, main, [-.132, 0, 0]);
    for (const s of [-1, 1]) {
        body.rod([x + s * .174, y - .008, z - .185], [x + s * .176, y + (sport ? .035 : -.006), z + .156], bolster, main);
        body.rod([x + s * .153, y + .044, z + .088], [x + s * .185, y + .344, z + .157], bolster * .83, main);
        body.rod([x + s * .171, y + .022, z + .066], [x + s * .176, y + .339, z + .129], .003, stitch);
        body.rod([x + s * .069, y + .329, z + .236], [x + s * .069, y + height, z + .236], .010, '#8a9697');
    }
    body.ball(x, y + height, z + .221, .133, .078, .068, main, [-.12, 0, 0]);
    const seams = fabric ? 7 : 3;
    for (let i = 0; i < seams; i++) {
        const t = i / (seams - 1), tip = Math.abs(t - .5) * .020, yy = y + .069 + .213 * t, zz = z + .080 + .035 * t + tip;
        body.rod([x - .118, yy, zz], [x, yy - .007, zz - .011], fabric ? .003 : .002, stitch);
        body.rod([x, yy - .007, zz - .011], [x + .118, yy, zz], fabric ? .003 : .002, stitch);
    }
    if (!fabric)
        for (const s of [-1, 1])
            body.box(x + s * .213, y - .107, z + .023, .023, .034, .305, '#283339');
}

function meter(body, lights, x, y, z, r, tint, label) {
    body.add(tube, [x, y, z], [r * 2, .025, r * 2], '#272d30', [Math.PI / 2, 0, 0]);
    body.add(ring, [x, y, z + .015], [r * .83, r * .83, .016], '#65726c');
    for (let i = 0; i < 9; i++) {
        const angle = -2.27 + i * .5675;
        const s = Math.sin(angle), c = Math.cos(angle);
        lights.rod([x + r * .61 * s, y + r * .61 * c, z + .013],
            [x + r * .75 * s, y + r * .75 * c, z + .018], i % 2 === 0 ? .0023 : .0014, tint, true);
    }
    stencil(lights, label, [x, y - r * .31, z + .018], r * .063, tint);
}

function dashboard(kind, series) {
    const s = specs[kind], c = carCabin(kind), body = new Batch(), lights = new Batch();
    const [tint, accent, layout] = kind === 'hatch' && series ? ['#a7dacc', '#dbbc80', 'digital'] : instruments[kind];
    const x = -c.seatX, y = s.belt + .075, z = s.a + .398;
    const digital = layout === 'digital';
    const charge = layout === 'charge';
    const work = layout === 'service' || layout === 'plough';
    body.box(0, y - .089, z - .119, s.w * 1.72, .129, .327, '#344045');
    body.box(0, y - .151, z + .006, s.w * 1.58, .057, .032, '#4e5a5d');
    body.box(0, y - .198, z + .102, .279, .201, .196, '#293237');
    for (const side of [-1, 1]) {
        const ax = side * s.w * .687;
        body.box(ax, y - .092, z + .039, .117, .059, .016, '#263138');
        for (let i = 0; i < 4; i++)
            body.box(ax, y - .113 + .014 * i, z + .051, .102, .004, .004, '#64726d');
    }
    const panelW = charge ? .481 : work ? .484 : digital ? .428 : .448;
    body.box(x, y, z - .018, panelW, .174, .077, '#202c33');
    body.box(x, y + .090, z - .005, panelW + .019, .024, .071, '#374349');
    const dialX = charge ? x - .135 : x - .107;
    if (digital) {
        body.box(x, y, z + .031, .382, .119, .024, '#16292e');
        for (let i = 0; i < 9; i++)
            lights.box(x - .154 + i * .025, y + .023 + i * .0008, z + .044, .018, .010, .004, i > 5 ? accent : tint);
        stencil(lights, 'КМ', [x + .134, y - .022, z + .044], .004, tint);
    } else {
        meter(body, lights, dialX, y, z + .029, .073, tint, 'КМ');
        if (charge) {
            const px = x + .060;
            body.box(px, y - .002, z + .037, .265, .103, .026, '#18282b');
            lights.box(px - .077, y + .029, z + .052, .054, .021, .006, '#879575');
            body.box(px - .043, y + .029, z + .052, .010, .011, .005, '#879575');
            stencil(lights, 'ЗАРЯД', [px + .053, y + .029, z + .051], .0041, tint);
            stencil(lights, '%', [px + .063, y - .020, z + .057], .0067, tint);
        } else {
            meter(body, lights, x + .084, y, z + .029, layout === 'classic' ? .073 : .061, accent, work ? 'Т' : 'В');
        }
    }
    const consoleZ = z + .066;
    body.box(.091, y - .124, consoleZ, work ? .289 : .219, .097, .032, '#252f32');
    if (work) {
        for (let i = 0; i < 3; i++) {
            const px = -.007 + i * .088;
            body.box(px, y - .137, consoleZ + .028, .050, .043, .018, '#4d5551');
            body.rod([px, y - .133, consoleZ + .038], [px, y - .097, consoleZ + .064], .010, i ? tint : accent, true);
            if (layout === 'plough')
                stencil(lights, ['ОТВ', 'СВЕТ', 'НАС'][i], [px, y - .077, consoleZ + .019], .0033, i ? tint : accent);
        }
        if (layout !== 'plough')
            stencil(lights, 'Т4', [.086, y - .077, consoleZ + .019], .005, accent);
    } else {
        lights.box(.059, y - .112, consoleZ + .018, .105, .027, .005, '#779b81');
        for (const px of [.139, .173])
            body.add(tube, [px, y - .119, consoleZ + .026], [.026, .013, .026], '#798684', [Math.PI / 2, 0, 0]);
    }
    // A clipped parking slip, heater controls and the equipment used on shift.
    body.box(.33, s.roof - .123, s.a + .29, .18, .012, .10, '#e1d4ab', [.12, 0, .04]);
    for (const knob of [-.08, 0, .08]) {
        body.add(tube, [knob, y - .192, consoleZ + .060], [.039, .019, .039], '#545555', [Math.PI / 2, 0, 0]);
        body.box(knob, y - .181, consoleZ + .073, .004, .012, .004, '#d7cfac');
    }
    if (work || kind === 'van' || kind === 'taxi') {
        body.box(.30, y - .18, consoleZ + .055, .21, .072, .105, '#333a39');
        body.box(.29, y - .17, consoleZ + .11, .08, .019, .003, '#acb39b');
        for (let i = 0; i < 4; i++) body.box(.35, y - .198 + i * .012, consoleZ + .11, .046, .003, .004, '#131916');
        body.add(tube, [.14, c.seatY + .05, c.seatZ - .15], [.080, .22, .080], '#677c69');
        body.add(tube, [.14, c.seatY + .173, c.seatZ - .15], [.078, .035, .078], '#c2bca4');
    }
    const arrow = new Batch();
    arrow.rod([0, -.013, 0], [0, .054, 0], .0031, '#ea9660', true);
    arrow.add(tube, [0, 0, .003], [.013, .006, .013], '#aab1a4', [Math.PI / 2, 0, 0]);
    const needle = arrow.mesh(lit);
    needle.position.set(dialX, y, z + .052);
    const marks = digital || charge ? ['0','1','2','3','4','5','6','7','8','9'].map(digit => {
        const b = new Batch();
        stencil(b, digit, [0, 0, 0], .008, tint);
        return b.mesh(lit);
    }) : [];
    let indicator;
    if (work) {
        const status = new Batch();
        status.box(.168, y - .087, consoleZ + .022, .019, .009, .007, accent);
        indicator = status.mesh(lit);
    }
    const board = body.mesh(), symbols = lights.mesh(lit);
    return function createDashboard() {
        const root = new T.Group();
        root.name = 'instrument-panel';
        root.add(board.clone(), symbols.clone());
        const needleMesh = needle.clone(), digitalGroups = [];
        if (!digital)
            root.add(needleMesh);
        const digitsY = y - .020, digitsZ = z + .056;
        if (digital || charge) {
            for (let i = 0; i < 3; i++) {
                const place = new T.Group();
                place.position.set((digital ? x - .087 : x + .010) + i * .035, digitsY, digitsZ);
                digitalGroups.push(place);
                root.add(place);
            }
        }
        const status = indicator?.clone();
        if (status)
            root.add(status);
        let previous;
        return { root, update(speed, systems) {
            if (!digital)
                needleMesh.rotation.z = 2.27 - T.MathUtils.clamp(Math.abs(speed) * .0375, 0, 1) * 4.54;
            if (status)
                status.visible = layout === 'plough' ? !!systems?.plough : !!systems?.bedMoving || !!systems?.bedDrop;
            if (digitalGroups.length) {
                const value = Math.round(T.MathUtils.clamp(digital ? Math.abs(speed) * 3.6 : systems?.charge ?? 82, 0, digital ? 199 : 100));
                if (value !== previous) {
                    previous = value;
                    const text = String(value).padStart(3, ' ');
                    digitalGroups.forEach((place, i) => {
                        place.clear();
                        if (text[i] !== ' ')
                            place.add(marks[Number(text[i])].clone());
                    });
                }
            }
        } };
    };
}

function belt(batch, path, color) {
    const edges = path.map((p, i) => {
        const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], span = Math.hypot(dx, dy) || 1;
        const tx = .022 * dy / span, ty = -.022 * dx / span;
        return [[p[0] - tx, p[1] - ty, p[2]], [p[0] + tx, p[1] + ty, p[2]]];
    });
    for (let i = 1; i < edges.length; i++) {
        const a = edges[i - 1], b = edges[i];
        batch.quad(a[0], b[0], b[1], a[1], color, [0, 0, -1]);
    }
}

function beltTemplates(kind) {
    const { c, w, roof, belt: waist } = specs[kind], cabin = carCabin(kind);
    const [h, z, sx] = [cabin.drivingPose.hipY, cabin.seatZ, cabin.seatX];
    const frame = new Batch(), empty = new Batch(), driver = new Batch();
    for (const side of [-1, 1]) {
        const upper = [side * w * .866, Math.min(roof - .144, waist + .319), Math.min(c, z + .285)];
        const lower = [side * w * .894, cabin.sillY + .075, z + .274];
        const latch = [side * (sx - .232), h + .029, z + .043];
        frame.box(...upper, .066, .074, .040, '#485258');
        frame.box(upper[0], upper[1] - .004, upper[2] - .024, .042, .032, .012, '#a2a59a');
        frame.box(...lower, .054, .063, .065, '#53605d');
        frame.box(...latch, .050, .067, .046, '#253032');
        frame.box(latch[0], latch[1] + .033, latch[2], .035, .009, .034, '#b56351');
        const rest = [upper[0] - side * .020, upper[1] - .265, upper[2] - .027];
        const hanging = side < 0 ? empty : frame;
        belt(hanging, [upper, rest, lower], '#31383a');
        hanging.box(...rest, .034, .049, .012, '#90978f');
        if (side < 0) {
            const shoulder = [-sx - .159, h + .421, z - .073];
            const chest = [-sx + .040, h + .298, z - .164];
            const pelvis = [latch[0] - .063, h + .113, z - .129];
            const hip = [-sx - .193, h + .061, z - .141];
            belt(driver, [upper, shoulder, chest, pelvis, latch, hip, lower], '#383d3c');
            driver.box(...pelvis, .039, .042, .013, '#9b9c8b', [0, .08, .49]);
        }
    }
    const full = driver.mesh(), anchored = frame.mesh(), rest = empty.mesh();
    full.name = 'fastened-driver-belt';
    rest.name = 'resting-seat-belts';
    return () => {
        const root = new T.Group(), emptyBelts = rest.clone(), driverBelt = full.clone();
        driverBelt.visible = false;
        root.add(anchored.clone(), emptyBelts, driverBelt);
        return { root, update(occupied) { emptyBelts.visible = !occupied; driverBelt.visible = !!occupied; } };
    };
}

function partition(kind) {
    if (kind !== 'patrol')
        return null;
    const s = specs[kind], c = carCabin(kind), cage = new Batch(), transparent = new Batch();
    const y0 = c.seatY + .044, y1 = s.roof - .085, z = c.seatZ + .365, w = s.w * .775;
    cage.box(0, (y0 + y1) * .5 - .096, z, w * 2, .178, .067, '#3a4b53');
    for (const x of [-w, w])
        cage.box(x, (y0 + y1) * .5, z, .052, y1 - y0, .080, '#56625f');
    cage.rod([-w, y1, z], [w, y1, z], .023, '#556260', true);
    const y2 = (y0 + y1) * .5;
    transparent.quad([-w + .044, y2, z], [w - .044, y2, z], [w - .044, y1 - .027, z],
        [-w + .044, y1 - .027, z], '#ffffff', [0, 0, -1]);
    for (const x of [-w * .48, w * .48])
        cage.rod([x, y2, z - .020], [x, y1, z - .020], .013, '#485654', true);
    const radioZ = c.seatZ - .35, radioY = c.seatY + .106;
    cage.box(.09, radioY, radioZ, .224, .103, .185, '#242e33', [.14, 0, 0]);
    cage.box(.05, radioY + .018, radioZ + .092, .100, .018, .007, '#90b298');
    for (const x of [.116, .153])
        cage.add(tube, [x, radioY, radioZ + .102], [.023, .015, .023], '#7b8782', [Math.PI / 2, 0, 0]);
    cage.box(.233, radioY + .042, radioZ + .031, .049, .035, .132, '#2e3f47', [0, .15, .27]);
    for (let i = 0; i < 6; i++)
        cage.rod([.228, radioY - .012 - i * .014, radioZ + .041], [.254, radioY - .020 - i * .014, radioZ + .062], .005, '#59635d');
    const root = new T.Group();
    root.name = 'patrol-radio-and-partition';
    root.add(cage.mesh(), transparent.mesh(glass));
    return root;
}

module.exports = { addSeat, seatMaterial, beltTemplates, dashboard, partition };
