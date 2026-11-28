"use strict";

const T = require('../engine/three.module.min.js');
const { Batch, lit, oval, ring, tube, stencil } = require('./model-geometry.js');
const { groundHeight } = require('./world-layout.js');
const { transitSites } = require('./new-city-transit-layout.js');

const rubber = '#263039', dark = '#344550', steel = '#8da0a1', rim = '#b9b9aa';
const glazing = new T.MeshPhongMaterial({
    color: '#95b8be', side: T.DoubleSide, transparent: true, opacity: .43,
    shininess: 58, depthWrite: false
});
const carPaint = new T.MeshPhongMaterial({
    color: '#ffffff', vertexColors: true, side: T.DoubleSide, shininess: 21, specular: '#353e41'
});
const shadowInk = new T.MeshBasicMaterial({ color: '#16252d', transparent: true, opacity: .22, depthWrite: false });
const waterInk = new T.MeshLambertMaterial({ color: '#385767', vertexColors: true });
const lerp = T.MathUtils.lerp;

function layer(root, batch, name, material) {
    const mesh = batch.mesh(material);
    mesh.name = name;
    root.add(mesh);
    return mesh;
}

function phase(elapsed, cycle, rise, dwell) {
    const t = (elapsed % cycle + cycle) % cycle;
    return Math.min(1, Math.max(0, Math.min(t / rise, (rise * 2 + dwell - t) / rise)));
}

function wheel(batch, x, z, radius, width, rimColor = rim, height = radius) {
    const rotation = [0, 0, Math.PI / 2];
    batch.add(tube, [x, height, z], [radius * 2, width, radius * 2], rubber, rotation);
    batch.add(tube, [x, height, z], [radius * 1.82, width + .017, radius * 1.82], '#39454b', rotation);
    batch.add(tube, [x, height, z], [radius * 1.29, width + .020, radius * 1.29], rimColor, rotation);
    batch.add(tube, [x, height, z], [radius * .48, width + .035, radius * .48], dark, rotation);
    for (const side of [-1, 1])
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * .4;
            batch.add(tube, [x + side * (width * .5 + .018), height + radius * .34 * Math.cos(a), z + radius * .34 * Math.sin(a)],
                [radius * .17, .011, radius * .17], dark, rotation);
        }
}

function shadow(batch, half, front, rear) {
    batch.quad([-half, .013, front], [half, .013, front], [half, .013, rear], [-half, .013, rear], '#344752', [0, 1, 0]);
}

function profileAt(rows, z) {
    for (let i = 1; i < rows.length; i++) {
        const a = rows[i - 1], b = rows[i];
        if (z <= b[0]) {
            const t = (z - a[0]) / (b[0] - a[0]);
            return [z, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
        }
    }
    return rows.at(-1);
}

function pressedBody(paint, chassis, rows, axles, color, decked = true, openings = []) {
    const [front] = rows[0], [rear] = rows.at(-1), cuts = new Set(rows.map(row => row[0]));
    for (const [start, end] of openings) {
        cuts.add(start);
        cuts.add(end);
    }
    for (const [z, radius] of axles)
        for (let i = 0; i <= 10; i++) {
            const at = z + Math.cos(i * Math.PI / 10) * (radius + .052);
            if (at > front && at < rear)
                cuts.add(at);
        }
    const sections = [...cuts].sort((a, b) => a - b).map(z => {
        const [, w, sill, belt] = profileAt(rows, z);
        let bottom = sill;
        for (const [position, radius] of axles) {
            const arc = radius + .052, d = arc * arc - (z - position) ** 2;
            if (d >= -1e-10)
                bottom = Math.min(belt - .06, Math.max(bottom, radius + Math.sqrt(Math.max(0, d))));
        }
        return { z, w, bottom, belt };
    });
    const at = (row, x, y) => [row.w * x, row[y], row.z];
    for (let i = 1; i < sections.length; i++) {
        const a = sections[i - 1], b = sections[i];
        const middle = (a.z + b.z) * .5;
        for (const side of [-1, 1]) {
            if (side > 0 && openings.some(([start, end]) => middle > start && middle < end))
                continue;
            paint.quad(at(a, side, 'bottom'), at(b, side, 'bottom'), at(b, side * .94, 'belt'), at(a, side * .94, 'belt'), color, [side, .12, 0]);
            chassis.quad(at(b, side, 'bottom'), at(a, side, 'bottom'), at(a, side * .84, 'bottom'), at(b, side * .84, 'bottom'), dark, [0, -1, 0]);
        }
        if (decked)
            paint.quad(at(a, -.94, 'belt'), at(a, .94, 'belt'), at(b, .94, 'belt'), at(b, -.94, 'belt'), color, [0, 1, 0]);
    }
    for (const [end, section] of [[-1, sections[0]], [1, sections.at(-1)]]) {
        paint.quad(at(section, -1, 'bottom'), at(section, 1, 'bottom'), at(section, .94, 'belt'), at(section, -.94, 'belt'), color, [0, 0, end]);
        chassis.box(0, section.bottom + .04, section.z + end * .017, section.w * 1.89, .105, .076, dark);
    }
}

function cabin(body, pane, rows, color, panoramic = false) {
    const at = (r, side, high) => [side * r[high ? 2 : 1], r[high ? 4 : 3], r[0]];
    for (let i = 1; i < rows.length; i++) {
        const a = rows[i - 1], b = rows[i];
        for (const side of [-1, 1]) {
            pane.quad(at(a, side, false), at(b, side, false), at(b, side, true), at(a, side, true), '#ffffff', [side, .2, 0]);
            body.rod(at(a, side, true), at(b, side, true), .026, color, true);
            body.rod(at(a, side, false), at(b, side, false), .021, dark, true);
        }
        const window = i === 1 || i === rows.length - 1 || panoramic;
        (window ? pane : body).quad(at(a, -1, true), at(a, 1, true), at(b, 1, true), at(b, -1, true),
            window ? '#ffffff' : color, [0, 1, 0]);
    }
    for (const row of rows) {
        body.rod(at(row, -1, true), at(row, 1, true), .033, color, true);
        for (const side of [-1, 1])
            body.rod(at(row, side, false), at(row, side, true), .027, dark, true);
    }
}

function seat(batch, x, y, z, width, color) {
    batch.box(x, y, z, width, .11, .34, color);
    batch.box(x, y + .24, z + .116, width, .42, .11, color, [-.14, 0, 0]);
    batch.box(x, y + .43, z + .14, width * .65, .14, .108, '#414c53');
    batch.box(x, y + .04, z - .167, width * .88, .015, .010, '#a0aa9e');
}

const bodies = {
    microcar: {
        color: '#b0c3cc', trim: '#516e86', rims: '#cbd0b9',
        sides: [[-1.36, .67, .23, .79], [-1.25, .76, .23, .84], [-.78, .775, .23, .86], [.84, .775, .23, .88], [1.35, .69, .24, .84]],
        glass: [[-.97, .676, .676, .85, .85], [-.60, .728, .618, .86, 1.55], [.61, .733, .623, .88, 1.57], [1.09, .685, .685, .87, .87]],
        axles: [[-.83, .245, .64, .174], [.86, .245, .64, .174]],
        handles: [[.54, 1.10]], seats: [[0, .48, -.08, .49]]
    },
    liftback: {
        color: '#526d84', trim: '#354d61', rims: '#aeb9b2',
        sides: [[-2.44, .77, .32, .76], [-2.31, .91, .27, .88], [-1.33, .962, .27, .95], [.91, .966, .27, 1.04], [2.08, .91, .33, 1.11], [2.42, .82, .39, 1.03]],
        glass: [[-1.02, .89, .89, .963, .963], [-.46, .900, .70, .99, 1.49], [.38, .899, .72, 1.015, 1.49], [1.01, .888, .69, 1.05, 1.36], [2.11, .83, .83, 1.105, 1.105]],
        axles: [[-1.49, .346, .807, .228], [1.47, .346, .807, .228]],
        handles: [[.17, 1.07], [1.10, 1.10]], seats: [[-.49, .57, -.24, .42], [.49, .57, -.24, .42], [0, .58, .94, 1.2]]
    },
    minivan: {
        color: '#738c78', trim: '#567069', rims: '#aeb5a0', panoramic: true,
        sides: [[-2.73, .82, .38, 1.0], [-2.53, .991, .25, 1.12], [-1.67, 1.012, .25, 1.17], [1.91, 1.013, .26, 1.19], [2.69, .948, .31, 1.14]],
        glass: [[-1.96, .96, .96, 1.15, 1.15], [-1.39, .959, .855, 1.17, 1.96], [-.35, .963, .88, 1.18, 1.99], [.80, .966, .888, 1.19, 1.99], [1.85, .954, .887, 1.19, 1.97], [2.57, .919, .832, 1.16, 1.85], [2.65, .911, .911, 1.15, 1.15]],
        axles: [[-1.68, .375, .866, .21], [1.65, .375, .865, .21]],
        handles: [[-.72, .99], [.72, 1.00]], seats: [-.65, .54, 1.68].flatMap(z => [[-.53, .69, z, .44], [.53, .69, z, .44]])
    },
    limousine: {
        color: '#494755', trim: '#232e3a', rims: '#c8ba9e',
        sides: [[-3.83, .89, .37, 1.03], [-3.60, 1.004, .31, 1.12], [-2.34, 1.017, .31, 1.13], [1.93, 1.018, .32, 1.17], [3.71, .961, .39, 1.17], [3.83, .91, .41, 1.09]],
        glass: [[-1.77, .948, .948, 1.14, 1.14], [-1.22, .95, .802, 1.14, 1.65], [-.27, .966, .816, 1.15, 1.65], [.82, .967, .816, 1.16, 1.65], [1.68, .966, .819, 1.17, 1.65], [2.09, .96, .79, 1.17, 1.63], [2.73, .947, .947, 1.17, 1.17]],
        axles: [[-2.52, .405, .859, .232], [2.47, .405, .864, .232]],
        handles: [[-.61, 1.20], [1.51, 1.22]], seats: [[-.51, .64, -.65, .44], [.51, .64, -.65, .44], [0, .69, 1.76, 1.40]]
    }
};

function passengerCar(root, kind) {
    const b = new Batch(), trim = new Batch(), panes = new Batch(), lamps = new Batch(), shade = new Batch();
    const p = bodies[kind], [front, , , hood] = p.sides[0], [rear, , , deck] = p.sides.at(-1);
    pressedBody(b, trim, p.sides, p.axles, p.color);
    cabin(trim, panes, p.glass, p.trim, p.panoramic);
    for (const [z, radius, x, width] of p.axles)
        for (const side of [-1, 1])
            wheel(trim, side * x, z, radius, width, p.rims);
    shadow(shade, p.sides[2][1] * .98, front + .20, rear - .20);
    for (const [x, y, z, width] of p.seats)
        seat(trim, x, y, z, width, kind === 'limousine' ? '#786961' : '#596d75');
    const dashX = kind === 'microcar' ? 0 : -.46;
    trim.add(ring, [dashX, hood + .111, p.glass[0][0] + .24], [.141, .141, .133], '#28353c', [.42, 0, 0]);
    trim.box(0, hood - .035, p.glass[0][0] + .07, p.glass[0][1] * 1.82, .143, .19, '#364851');
    for (const side of [-1, 1]) {
        const x = p.sides[1][1] * .74 * side, headWidth = kind === 'liftback' ? .34 : .25;
        trim.box(x, hood - .095, front - .008, headWidth + .04, .145, .056, dark);
        lamps.box(x, hood - .095, front - .041, headWidth, kind === 'liftback' ? .065 : .092, .017, '#eadbc0');
        lamps.box(side * p.sides.at(-1)[1] * .76, deck - .080, rear + .022, kind === 'liftback' ? .29 : .20, .078, .035, '#a74f51');
        for (const [z, y] of p.handles) {
            const [, w] = profileAt(p.sides, z);
            trim.rod([side * w * .96, y - .07, z], [side * w * .99, y - .07, z + .16], .015, steel, true);
            trim.rod([side * w * .964, y - .135, z + .16], [side * w * .997, y - .45, z + .175], .009, dark);
        }
        const mirror = p.glass[1];
        trim.rod([side * mirror[1] * .97, mirror[3] + .04, mirror[0] + .06], [side * (mirror[1] + .117), mirror[3] + .04, mirror[0] + .07], .024, dark);
        trim.box(side * (mirror[1] + .117), mirror[3] + .055, mirror[0] + .084, .17, .093, .14, p.trim);
        trim.box(side * (mirror[1] + .117), mirror[3] + .055, mirror[0] + .157, .134, .071, .01, '#8c9d9e');
    }
    for (const side of [-1, 1]) {
        for (let index = 1; index < p.sides.length - 1; index++) {
            const [z0, w0, , y0] = p.sides[index - 1], [z1, w1, , y1] = p.sides[index];
            trim.rod([side * w0, y0 - .28, z0], [side * w1, y1 - .28, z1], .025, '#3f4140', true);
        }
    }
    if (kind === 'liftback') {
        const lo = -.80, hi = .38;
        const [, wl] = profileAt(p.sides, lo), [, wr] = profileAt(p.sides, hi);
        trim.quad([wl+.012,.58,lo], [wr+.012,.58,hi], [wr+.012,.94,hi], [wl+.012,.94,lo], '#989387', [1,0,0]);
        trim.box(wl+.021,.91,lo+.81,.023,.038,.15,'#bebcb1');
        for (let j=0; j<5; j++)
            trim.ball(wr+.017,.59+.008*(j%2),hi-.11*j,.009,.011,.033,'#825e42');
    }
    if (kind === 'limousine') {
        for (const side of [-1, 1]) {
            const r = p.glass[2], s = p.glass[3];
            trim.quad([side * r[1] * 1.006, r[3], r[0]], [side * s[1] * 1.006, s[3], s[0]], [side * s[2] * 1.008, s[4], s[0]], [side * r[2] * 1.008, r[4], r[0]], p.trim, [side, 0, 0]);
            trim.box(side * .829, 1.43, .30, .027, .039, .18, '#b5a388');
        }
        trim.box(0, 1.04, .77, 1.62, .64, .08, '#575552');
    }
    if (kind === 'minivan') {
        for (const side of [-1, 1])
            trim.rod([side * .78, 1.99, -1.40], [side * .78, 2.00, 2.04], .022, '#576364');
    }
    trim.box(0, deck - .175, rear + .035, .43, .091, .012, '#bac2af');
    stencil(trim, { microcar: '77', liftback: '10', minivan: '08', limousine: '06' }[kind], [0, deck - .175, rear + .043], .013, '#38454b');
    layer(root, shade, 'Контактная тень', shadowInk);
    layer(root, b, 'Кузов и арки', carPaint);
    layer(root, trim, 'Колёса, отделка и салон');
    layer(root, panes, 'Остекление', glazing);
    layer(root, lamps, 'Светотехника', lit);
}

function winterSidecar(root) {
    const b = new Batch(), lamps = new Batch(), glass = new Batch(), shade = new Batch();
    const bikeX = -.42, podX = .60, blue = '#547783';
    for (const z of [-.86, .815])
        wheel(b, bikeX, z, .346, .174, '#b1bdb6');
    wheel(b, 1.03, .28, .297, .183, '#abb2a0');
    for (const side of [-1, 1]) {
        b.rod([bikeX + side * .102, .37, -.88], [bikeX + side * .096, .93, -.56], .034, steel);
        b.rod([bikeX + side * .09, .43, .84], [bikeX + side * .09, .75, .28], .032, '#4a5d62');
        b.rod([bikeX, .99, -.49], [bikeX + side * .285, 1.038, -.45], .024, '#9aa79a');
        b.rod([bikeX + side * .222, 1.036, -.46], [bikeX + side * .295, 1.046, -.44], .038, rubber);
    }
    b.rod([bikeX + .06, .50, -.31], [podX + .24, .40, -.35], .054, '#58696c', true);
    b.rod([bikeX + .07, .48, .67], [podX + .27, .40, .46], .054, '#58696c', true);
    b.add(oval, [bikeX, .69, -.29], [.448, .415, .866], blue);
    b.box(bikeX, .49, .18, .46, .34, .62, '#3d545a');
    for (let i = 0; i < 5; i++)
        b.box(bikeX, .337 + i * .043, .08, .48, .016, .36, '#879893');
    b.box(bikeX, .849, .346, .37, .13, .61, '#3e4443', [.13, 0, 0]);
    b.add(oval, [bikeX, .655, -.83], [.295, .162, .65], blue);
    b.add(oval, [bikeX, .654, .78], [.29, .156, .66], blue);
    b.add(tube, [bikeX, .985, -.75], [.251, .204, .251], '#3d4d55', [Math.PI / 2, 0, 0]);
    lamps.add(tube, [bikeX, .985, -.863], [.196, .022, .196], '#f0ddbb', [Math.PI / 2, 0, 0]);
    glass.quad([bikeX - .262, .922, -.666], [bikeX + .262, .922, -.666], [bikeX + .193, 1.53, -.405], [bikeX - .193, 1.53, -.405], '#ffffff');
    b.rod([bikeX - .193, 1.53, -.405], [bikeX + .193, 1.53, -.405], .018, '#657a7d');
    b.add(oval, [podX, .534, .077], [.795, .56, 2.01], '#6c8790');
    b.add(oval, [podX, .694, -.227], [.687, .286, 1.05], '#4e5a61');
    b.box(podX, .739, .413, .66, .196, .57, '#535f64', [.36, 0, 0]);
    for (const side of [-1, 1]) {
        const x = podX + side * .329;
        b.rod([x, .748, -.542], [x, .754, .602], .018, '#6e8286');
        for (const z of [-.47, -.19, .09, .36, .55])
            b.add(oval, [x, .760, z], [.029, .021, .022], '#b4bca9');
    }
    b.add(oval, [1.006, .608, .277], [.321, .22, .726], '#607984');
    lamps.box(podX + .206, .602, -.843, .152, .073, .056, '#f0ddbb');
    lamps.box(bikeX, .686, 1.104, .165, .078, .044, '#ab5652');
    shadow(shade, .86, -1.02, 1.11);
    layer(root, shade, 'Тень под мотоциклом', shadowInk);
    layer(root, b, 'Мотоцикл и крытая коляска');
    layer(root, glass, 'Ветровой щиток', glazing);
    layer(root, lamps, 'Фара и фонарь коляски', lit);
}

function cargoTricycle(root) {
    const b = new Batch(), lamps = new Batch(), lid = new Batch(), shade = new Batch();
    const green = '#61857b';
    for (const side of [-1, 1]) {
        wheel(b, side * .602, -.817, .286, .134);
        b.rod([side * .52, .39, -.817], [side * .506, .38, .27], .035, dark, true);
        b.rod([side * .11, .31, .22], [side * .08, .364, 1.015], .034, '#6f8c86');
        b.box(side * .579, .71, -.59, .089, .58, 1.38, green);
        for (const z of [-1.19, -.66, -.11])
            b.box(side * .628, .715, z, .032, .54, .034, '#95a495');
        lamps.box(side * .435, .55, -1.34, .13, .071, .048, '#edd9b9');
    }
    wheel(b, 0, 1.016, .328, .148);
    b.box(0, .454, -.595, 1.16, .097, 1.415, '#5a7a72');
    b.box(0, .734, -1.287, 1.17, .55, .069, '#789783');
    b.box(0, .729, .078, 1.17, .56, .087, green);
    b.box(0, .480, .401, .299, .26, .39, '#404e51');
    b.rod([0, .379, .216], [0, .838, .803], .055, '#62837d');
    b.rod([0, .493, .429], [0, 1.043, .385], .040, steel);
    b.rod([-.298, 1.061, .418], [.298, 1.061, .418], .030, steel);
    for (const side of [-1, 1])
        b.rod([side * .224, 1.062, .417], [side * .323, 1.076, .422], .036, dark);
    b.add(oval, [0, .895, .828], [.389, .14, .439], '#424c4b');
    b.box(0, .617, 1.214, .166, .064, .053, '#9d4044');
    for (const x of [-.274, .216])
        b.box(x, .607, -.694, .38, .22, .63, x < 0 ? '#bb925e' : '#b3aba3');
    lid.box(0, .026, -.697, 1.26, .10, 1.414, '#91ab99');
    lid.rod([-.60, .08, -1.39], [.60, .08, -1.39], .023, dark, true);
    const hinge = new T.Group();
    hinge.position.set(0, 1.02, .084);
    hinge.rotation.x = .53;
    layer(hinge, lid, 'Откидная крышка короба');
    root.add(hinge);
    shadow(shade, .695, -1.29, 1.25);
    layer(root, shade, 'Тень под коробом', shadowInk);
    layer(root, b, 'Трёхколёсное шасси и грузовой короб');
    layer(root, lamps, 'Передние фонари', lit);
}

function roadDoor(root, half, y, z, d, opening, color) {
    const leaves = [-1, 1].map(side => {
        const door = new T.Group(), frame = new Batch(), glass = new Batch(), axis = half * .91;
        const width = d * .49;
        frame.box(0, .31, 0, .072, .62, width, color);
        frame.box(0, 1.78, 0, .072, .17, width, color);
        for (const edge of [-1, 1])
            frame.box(0, 1.18, edge * (width * .5 - .023), .073, 1.18, .046, dark);
        frame.box(.041, .77, 0, .026, .048, width * .86, '#a99a6e');
        glass.quad([.023, .62, -width * .44], [.023, .62, width * .44], [.023, 1.69, width * .44], [.023, 1.69, -width * .44], '#ffffff');
        layer(door, frame, 'Дверная створка');
        layer(door, glass, 'Дверное стекло', glazing);
        root.add(door);
        return {
            door, side, axis,
            update(t) { door.position.set(axis + t * .105, y, z + side * (width * .51 + t * width * opening)); }
        };
    });
    leaves.forEach(leaf => leaf.update(0));
    return t => leaves.forEach(leaf => leaf.update(t));
}

function coach(root, config) {
    const { length, half, belt, roof, floor, paint, stripe, axles, doorZ, label, frontFace = true, rearFace = true } = config;
    const b = new Batch(), trim = new Batch(), glass = new Batch(), lamps = new Batch();
    const front = -length * .5, end = length * .5, d = 1.34;
    const openings = doorZ.map(z => [z - d / 2, z + d / 2]);
    pressedBody(b, trim, [[front, half * .91, floor + .03, belt], [front + .43, half, floor, belt],
        [end - .39, half, floor, belt], [end, half * .925, floor + .031, belt]], axles, paint, false, openings);
    trim.box(0, floor + .015, 0, half * 1.84, .10, length - .14, '#51656a');
    for (const [axle, radius] of axles)
        for (const side of [-1, 1])
            wheel(trim, side * (half - .160), axle, radius, .266, '#b8b7a4');
    const windowY = belt + .075, windowTop = roof - .45, windowX = half * .930, lip = roof - .24;
    const landmarks = [front + .11, end - .11, ...openings.flat()].sort((a, b) => a - b);
    for (const side of [-1, 1]) {
        for (let i = 1; i < landmarks.length; i++) {
            const a = landmarks[i - 1], c = landmarks[i];
            const middle = (a + c) * .5;
            const isDoor = side === 1 && openings.some(([start, end]) => middle > start && middle < end);
            const count = Math.max(1, Math.ceil((c - a) / 1.52));
            if (!isDoor)
                for (let k = 0; k < count; k++) {
                    const lo = lerp(a, c, k / count) + .045, hi = lerp(a, c, (k + 1) / count) - .045;
                    glass.quad([side * windowX, windowY, lo], [side * windowX, windowY, hi], [side * (windowX - .039), windowTop, hi], [side * (windowX - .039), windowTop, lo], '#ffffff');
                    trim.box(side * (windowX - .02), (windowY + windowTop) * .5, lo - .023, .058, windowTop - windowY + .11, .047, dark);
                    if (k > 0)
                        seat(trim, side * half * .535, floor + .46, lo + .42, .47, '#5c7275');
                }
            if (!isDoor)
                trim.box(side * half * .953, belt - .015, middle, .043, .105, c - a, stripe);
        }
        trim.rod([side * half * .94, lip, front + .08], [side * half * .94, lip, end - .07], .105, paint, true);
        trim.rod([side * half * .72, floor + 1.92, front + .78], [side * half * .72, floor + 1.92, end - .56], .021, '#a3ab96');
        for (const z of [front + .96, end - .67, ...doorZ])
            trim.rod([side * half * .71, floor + .095, z], [side * half * .71, floor + 1.94, z], .020, '#a4af9a');
    }
    trim.box(0, lip + .04, 0, half * 1.79, .21, length - .14, paint);
    for (const z of [front + 2.3, end - 2.2]) {
        trim.box(0, roof - .032, z, half * .79, .17, 1.02, '#768984');
        for (let i = 0; i < 5; i++)
            trim.box(0, roof + .058, z - .31 + .14 * i, half * .63, .021, .034, '#414f57');
    }
    for (const z of doorZ) {
        trim.rod([half*.71, floor+1.03, z-.06], [half*.71, floor+1.38, z-.06], .023, '#a69675');
        trim.box(half*.71, floor+1.21, z-.08, .073, .102, .041, '#cab17b');
        trim.box(half*.71, floor+1.21, z-.105, .043, .054, .013, '#ac4e40');
    }
    if (frontFace) {
        const { placard } = require('./fleet-placard.js');
        placard(root, ['СХЕМА ОСТАНОВОК', 'Депо  •  Канальная  •  рынок'], [0, belt+.45, front+1.40], [.75,.28]);
        const w = half * .865;
        glass.quad([-w, windowY, front + .044], [w, windowY, front + .044], [w - .055, windowTop + .126, front + .151], [-w + .055, windowTop + .126, front + .151], '#ffffff');
        trim.box(0, windowY + .06, front + .544, half * 1.63, .144, .41, '#344650');
        trim.rod([-w, windowY + .18, front + .034], [-.11, windowY + .43, front + .063], .013, dark, true);
        trim.rod([.066, windowY + .17, front + .031], [w * .96, windowY + .42, front + .060], .013, dark, true);
        trim.box(0, windowTop + .14, front + .09, half * 1.57, .247, .085, '#273a42');
        stencil(lamps, label, [0, windowTop + .14, front + .042], .031, '#e0c179', -1);
        seat(trim, -.61, floor + .63, front + 1.06, .53, '#596466');
        trim.add(ring, [-.60, floor + 1.18, front + .51], [.181, .181, .167], '#283a43', [.41, 0, 0]);
        for (const side of [-1, 1]) {
            lamps.box(side * half * .731, floor + .45, front - .016, .268, .139, .045, '#ecdfc0');
            trim.rod([side * half * .88, belt + .51, front + .38], [side * (half + .093), belt + .68, front + .31], .035, '#455861');
            trim.box(side * (half + .096), belt + .57, front + .32, .154, .229, .176, '#455861');
        }
    }
    if (rearFace) {
        const w = half * .852;
        glass.quad([-w, windowY, end - .042], [w, windowY, end - .042], [w - .048, windowTop, end - .115], [-w + .048, windowTop, end - .115], '#ffffff');
        for (const side of [-1, 1]) {
            lamps.box(side * half * .725, floor + .46, end + .012, .217, .103, .048, '#b84e53');
            lamps.box(side * half * .725, floor + .59, end + .013, .217, .073, .044, '#d29055');
        }
    }
    layer(root, b, 'Кузов с колёсными арками', carPaint);
    layer(root, trim, 'Салон, поручни и отделка');
    layer(root, glass, 'Ленточное остекление', glazing);
    layer(root, lamps, 'Маршрутное табло и фонари', lit);
    return doorZ.map(z => roadDoor(root, half, floor, z, 1.34, .88, paint));
}

function lowFloorBus(root) {
    const doors = coach(root, { length: 11.49, half: 1.272, belt: 1.46, roof: 3.08, floor: .35, paint: '#859b8f', stripe: '#537783',
        axles: [[-3.52, .435], [3.38, .435]], doorZ: [-4.77, .92, 4.75], label: 'К-12' });
    const apron = new T.Group(), plate = new Batch(), shade = new Batch();
    apron.position.set(1.12, .42, .92);
    plate.box(.33, 0, 0, .70, .065, 1.18, '#77888c');
    for (let i = 0; i < 6; i++)
        plate.box(.087 + i * .098, .034, 0, .023, .013, 1.12, '#a6aa97');
    layer(apron, plate, 'Складной пандус');
    root.add(apron);
    shadow(shade, 1.24, -5.39, 5.35);
    layer(root, shade, 'Тень под автобусом', shadowInk);
    return ({ elapsed }) => {
        const open = phase(elapsed + 8, 32, 1.6, 7.5);
        doors.forEach(move => move(open));
        apron.rotation.z = lerp(-Math.PI * .5, -.28, T.MathUtils.smoothstep(open, .37, .98));
    };
}

function articulatedTrolley(root) {
    const front = new T.Group(), rear = new T.Group(), bellows = new Batch(), poles = new Batch(), wire = new Batch();
    front.position.z = -4.12;
    rear.position.z = 5.06;
    root.add(front, rear);
    const doors = [
        ...coach(front, { length: 9.60, half: 1.275, belt: 1.40, roof: 3.18, floor: .36, paint: '#466f7b',
            stripe: '#d1ab72', axles: [[-2.68, .438], [2.81, .437]], doorZ: [-3.99, 1.93], label: '17', rearFace: false }),
        ...coach(rear, { length: 7.87, half: 1.271, belt: 1.40, roof: 3.14, floor: .37, paint: '#466f7b',
            stripe: '#d1ab72', axles: [[1.37, .438]], doorZ: [2.72], label: '', frontFace: false })
    ];
    const start = front.position.z + 4.80, end = rear.position.z - 3.935;
    for (let j = 0; j <= 8; j++) {
        const z = lerp(start - .022, end + .022, j / 8), inner = j % 2 === 1, w = inner ? 1.157 : 1.254;
        const tint = inner ? '#2e4047' : '#47575c';
        bellows.box(0, 2.918, z, w * 1.90, .226, .050, tint);
        for (const side of [-1, 1])
            bellows.box(side * w * .943, 1.682, z, .115, 2.47, .050, tint);
    }
    bellows.box(0, .452, (start + end) / 2, 2.28, .149, end - start + .12, '#45535a');
    for (const side of [-1, 1]) {
        const x = side * .38;
        poles.box(x, 3.229, 2.04, .23, .145, .46, '#465962');
        poles.rod([x, 3.35, 2.11], [x * .86, 4.23, 5.42], .030, '#7f948f');
        poles.rod([x * .86, 4.23, 5.42], [x * .82, 4.34, 6.57], .024, '#8d9f9c');
        poles.rod([x, 3.31, 2.11], [x, 3.79, 3.57], .022, '#576d71');
        poles.box(x * .82, 4.358, 6.55, .099, .046, .234, '#525f61');
        wire.rod([x * .82, 4.36, -10], [x * .82, 4.36, 10.3], .011, '#4d6774');
    }
    layer(root, bellows, 'Резиновая гармошка сочленения');
    layer(root, poles, 'Токосъёмные штанги');
    layer(root, wire, 'Провода над стоянкой');
    return ({ elapsed }) => {
        const open = phase(elapsed + 4, 27, 1.8, 5.7);
        doors.forEach(move => move(open));
    };
}

function track(batch, minimum, maximum, gauge = .719) {
    for (const side of [-1, 1]) {
        const x = side * gauge, z = (minimum + maximum) / 2;
        batch.box(x, .082, z, .10, .113, maximum - minimum, '#8b9a99');
        batch.box(x, .144, z, .056, .031, maximum - minimum, '#afbab4');
    }
    for (let z = minimum + .31; z < maximum; z += .68)
        batch.box(0, .039, z, gauge * 2 + .797, .071, .199, '#6f6b54');
}

function railWheel(b, z, half) {
    for (const side of [-1, 1]) {
        wheel(b, side * half, z, .317, .145, '#6d7d7d', .466);
        b.box(side * half * .94, .565, z, .23, .195, .23, '#394b53');
    }
    b.rod([-half, .457, z], [half, .457, z], .077, dark);
}

function serviceTram(root) {
    const b = new Batch(), cabinBody = new Batch(), panes = new Batch(), light = new Batch(), rails = new Batch();
    const red = '#aa6a4c';
    const front = -3.79, end = 3.83;
    track(rails, front - .80, end + .66);
    for (const wheelZ of [-2.41, -1.89, 1.89, 2.41])
        railWheel(b, wheelZ, .719);
    b.box(0, .734, 0, 2.58, .24, 7.55, red);
    b.box(0, .893, .754, 2.40, .143, 5.83, '#868067');
    for (let i = 0; i < 17; i++)
        b.box(0, .968, -1.93 + i * .327, 2.22, .017, .019, '#9d977e');
    b.box(0, 1.163, -2.927, 2.34, .49, 1.66, red);
    cabin(cabinBody, panes, [[-3.79, 1.105, 1.105, 1.36, 1.36], [-3.37, 1.166, .979, 1.37, 2.62],
        [-2.47, 1.166, .998, 1.39, 2.62], [-2.02, 1.090, 1.090, 1.42, 1.42]], red);
    b.box(0, 1.897, -2.187, 2.21, .951, .098, '#985e4c');
    b.box(0, 2.643, -2.918, 1.94, .143, 1.22, '#6c8585');
    for (const side of [-1, 1]) {
        b.box(side * 1.165, 1.091, .76, .065, .25, 5.78, red);
        b.rod([side * 1.154, 1.48, -1.89], [side * 1.154, 1.48, 3.55], .025, '#a5ad97');
        for (const z of [-1.85, -.88, .12, 1.11, 2.11, 3.14, 3.56])
            b.rod([side * 1.154, 1.053, z], [side * 1.154, 1.485, z], .024, steel);
        b.box(side * 1.164, .630, 2.79, .25, .077, .536, '#657571');
        light.box(side * .78, 1.127, front - .03, .19, .126, .043, '#eedfc4');
    }
    b.box(-.58, 1.547, -1.60, 1.17, 1.22, .512, '#58737b');
    b.box(-.58, 1.553, -1.301, 1.02, 1.09, .081, '#69838a');
    for (const z of [-.42, .42])
        b.box(-.575, 1.55 + z, -1.253, .27, .022, .025, steel);
    b.box(.48, 1.153, -.72, .83, .374, .79, '#908469');
    b.box(.51, 1.265, .236, .84, .612, .83, '#aa8862');
    for (let turn=0; turn<5; turn++)
        b.add(ring, [-.56,1.0+turn*.033,1.86],[.36,.36,.19],'#404447',[Math.PI/2,0,0]);
    for (const x of [.25,.65]) {
        b.box(x,1.03,1.30,.23,.14,.41,'#77624c',[.14,0,0]);
        b.box(x,1.00,2.18,.18,.06,.33,'#454d4c');
        b.rod([x,1.03,2.03],[x,1.24,2.19],.026,'#7d8786');
        b.rod([x,1.24,2.19],[x,1.03,2.34],.026,'#7d8786');
    }
    stencil(b,'М4',[.51,1.29,.662],.015,'#e6dab5');
    b.rod([-.27, 2.729, -2.88], [-.20, 3.27, -2.44], .024, steel);
    b.rod([.27, 2.729, -2.88], [.20, 3.27, -2.44], .024, steel);
    b.rod([-.33, 3.279, -2.44], [.33, 3.279, -2.44], .025, dark, true);
    stencil(light, 'Т-03', [0, 1.263, front - .017], .021, '#e5d1a1', -1);
    layer(root, rails, 'Деповской путь');
    layer(root, b, 'Открытая грузовая площадка и шкаф');
    layer(root, cabinBody, 'Каркас кабины');
    layer(root, panes, 'Стёкла кабины', glazing);
    layer(root, light, 'Фонари и номер', lit);
}

function doubleDeckTrain(root) {
    const b = new Batch(), paint = new Batch(), glass = new Batch(), light = new Batch(), rails = new Batch();
    const front = -10.46, end = 10.40, half = 1.53, color = '#598096';
    track(rails, front - 1.13, end + 1.04);
    for (const z of [-7.26, -5.53, 5.49, 7.22])
        railWheel(b, z, .718);
    pressedBody(paint, b, [[front, 1.12, .600, 1.36], [front + .49, 1.445, .55, 1.47], [front + 1.60, half, .55, 1.53],
        [end - .20, half, .55, 1.53], [end, 1.445, .62, 1.53]], [], color, false);
    for (const [x, y, d, h, tint] of [[0, 1.241, 20.5, .098, '#718287'], [0, 2.597, 18.9, .196, '#aeb5a2'], [0, 4.339, 18.95, .369, '#cad1c4']])
        b.box(x, y, .42, half * 1.812, h, d, tint);
    for (const side of [-1, 1]) {
        const x = side * 1.444, upperX = side * 1.354;
        b.rod([side * 1.422, 2.651, front + 1.57], [side * 1.422, 2.651, end], .18, color, true);
        b.rod([upperX, 4.166, front + 1.46], [upperX, 4.166, end], .121, color, true);
        for (let i = 0; i < 9; i++) {
            const z = -8.08 + i * 1.91;
            const entrance = i === 1 || i === 8;
            if (entrance) {
                b.box(x * 1.026, 2.06, z, .088, 2.08, 1.53, '#4a6776');
                for (const part of [-1, 1]) {
                    glass.quad([x * 1.055, 1.65, z + part * .354 - .258], [x * 1.055, 1.65, z + part * .354 + .258],
                        [x * 1.055, 2.52, z + part * .354 + .258], [x * 1.055, 2.52, z + part * .354 - .258], '#ffffff');
                    b.box(x * 1.064, 1.53, z + part * .185, .025, .13, .066, '#b3b998');
                }
                b.box(x * 1.066, 2.03, z, .018, 2.02, .036, '#293f4a');
            } else {
                glass.quad([x, 1.545, z - .722], [x, 1.545, z + .722], [x, 2.405, z + .722], [x, 2.405, z - .722], '#ffffff');
                b.box(x, 1.961, z - .845, .11, 1.026, .247, color);
                seat(b, side * .81, 1.60, z + .28, .60, '#627c7b');
                seat(b, side * .81, 3.11, z + .28, .60, '#6f826e');
            }
            glass.quad([upperX, 2.81, z - .734], [upperX, 2.81, z + .734], [upperX * .974, 3.987, z + .734],
                [upperX * .974, 3.987, z - .734], '#ffffff');
            b.box(upperX, 3.38, z - .85, .125, 1.23, .24, color);
        }
        b.box(x, 2.25, 9.36, .081, 1.42, 1.92, color);
        for (let step = 0; step < 7; step++) {
            b.box(side * .76, 1.338 + step * .193, -6.23 + .20 * step, .784, .079, .214, '#7d9394');
            b.box(side * .76, 1.376 + step * .193, -6.32 + .20 * step, .741, .016, .031, '#bfae78');
        }
        const bottom = [side * 1.057, 1.36, front + .18], lower = [side * 1.394, 1.54, front + 1.56], upper = [side * 1.34, 3.97, front + 1.43];
        const nose = [side * .83, 3.38, front + .98];
        paint.quad(bottom, lower, upper, nose, color, [side, 0, -.34]);
        light.box(side * .807, 1.266, front + .021, .343, .144, .038, '#ebddbb');
        light.box(side * .711, 1.45, end + .02, .193, .089, .043, '#be4d57');
    }
    const [bottomLeft, bottomRight, topRight, topLeft] = [[-1.04, 1.41, front + .16], [1.04, 1.41, front + .16],
        [.83, 3.39, front + .98], [-.83, 3.39, front + .98]];
    const [glassLeft, glassRight, glassTopRight, glassTopLeft] = [[-.772, 2.06, front + .429], [.772, 2.06, front + .429],
        [.681, 3.245, front + .920], [-.681, 3.245, front + .920]];
    paint.quad(bottomLeft, bottomRight, glassRight, glassLeft, color, [0, 0, -1]);
    paint.quad(bottomRight, topRight, glassTopRight, glassRight, color, [0, 0, -1]);
    paint.quad(topRight, topLeft, glassTopLeft, glassTopRight, color, [0, 0, -1]);
    paint.quad(topLeft, bottomLeft, glassLeft, glassTopLeft, color, [0, 0, -1]);
    glass.quad(glassLeft, glassRight, glassTopRight, glassTopLeft, '#ffffff', [0, 0, -1]);
    b.box(0, 1.955, front + .86, 1.48, .236, .433, '#425962');
    b.box(-.34, 2.127, front + .86, .335, .126, .153, '#50676b', [.35, 0, 0]);
    paint.quad([-.83, 3.39, front + .98], [.83, 3.39, front + .98], [1.32, 4.35, front + 1.58], [-1.32, 4.35, front + 1.58], color, [0, 1, -1]);
    b.box(0, 2.683, end - .056, half * 1.883, 3.13, .125, color);
    b.box(0, 2.24, end + .032, .834, 1.381, .043, '#455b66');
    b.box(0, 2.476, end + .059, .681, .541, .013, '#728b90');
    b.box(0, 4.528, 3.58, 1.082, .149, 2.16, '#738d93');
    for (let z = 2.75; z < 4.52; z += .165)
        b.box(0, 4.612, z, .915, .026, .051, dark);
    stencil(light, '77', [0, 1.842, front + .304], .024, '#e3d4a2', -1);
    layer(root, rails, 'Путь возле платформы');
    layer(root, paint, 'Двухъярусный кузов с кабиной', carPaint);
    layer(root, b, 'Верхний салон, тамбур и лестницы');
    layer(root, glass, 'Два ряда пассажирских окон', glazing);
    layer(root, light, 'Номер секции и фонари', lit);
}

function cableFerry(root) {
    const frame = new Batch(), edges = new Batch(), glass = new Batch(), lights = new Batch(), rampBatch = new Batch(), water = new Batch();
    const deck = new T.Group(), ramp = new T.Group(), blue = '#516e7c';
    // The berth has a visibly cleared strip in the ice and a fixed shore anchor.
    for (let i = 0; i < 6; i++) {
        const a = 74.8 + i * 1.81, b = a + 1.81;
        const x = -161.8, z = 81.6, y = groundHeight(x, z);
        const corner = (side, at) => [side * (2.68 + .20 * Math.sin(at * 2.48)), groundHeight(x, at) - y + .018, at - z];
        water.quad(corner(-1, a), corner(1, a), corner(1, b), corner(-1, b), '#849a9d', [0, 1, 0]);
    }
    layer(root, water, 'Прорубь вдоль паромного причала', waterInk);
    const shore = new Batch();
    shore.box(3.28,1.17,6.93,1.41,1.91,1.19,'#82918a');
    shore.box(3.28,2.17,6.93,1.62,.14,1.39,'#526361');
    shore.box(3.28,1.49,6.313,1.04,.49,.031,'#3d5356');
    shore.box(3.28,1.20,6.24,1.09,.059,.25,'#b3a487');
    for (const z of [3.92,4.91]) shore.box(2.32,.42,z,.24,.44,.87,'#89735b');
    shore.rod([2.49,.48,4.63],[2.49,1.92,4.63],.037,steel);
    shore.rod([2.49,1.92,4.63],[2.19,1.92,4.63],.025,steel);
    shore.ball(2.21,1.82,4.63,.135,.148,.135,'#aa915f');
    layer(root,shore,'Билетная будка, колокол и причальные отбойники');
    require('./fleet-placard.js').placard(root,['КАССА ПАРОМА','Последний рейс 21:30'],[3.28,1.91,6.32],[1.11,.28],Math.PI);
    const nose = [[-3.88, 1.75, .16, .54], [-3.54, 2.12, .11, .58], [2.94, 2.12, .11, .59], [3.72, 1.88, .16, .59]];
    pressedBody(frame, edges, nose, [], blue);
    frame.box(0, .662, -.038, 3.97, .13, 7.35, '#788e8c');
    for (const side of [-1, 1]) {
        const x = side * 2.03;
        frame.box(x, .749, -.14, .13, .149, 7.33, '#657d7f');
        frame.rod([x, 1.45, -3.37], [x, 1.45, 3.28], .032, '#b8c1af');
        for (let z = -3.37; z < 3.4; z += .95)
            frame.rod([x, .735, z], [x, 1.45, z], .027, '#99a7a0');
        for (const z of [-2.65, .18, 2.70])
            frame.add(tube, [x * 1.064, .578, z], [.258, .23, .258], '#374b53', [0, 0, Math.PI / 2]);
    }
    for (let i = 0; i < 13; i++) {
        const z = -2.81 + i * .439;
        frame.box(.12, .738, z, 2.45, .021, .046, '#8ca09a');
    }
    for (const x of [-.919, .919]) {
        frame.rod([x, .741, -3.10], [x, .741, 3.18], .014, '#b1af83', true);
        frame.rod([x, .817, -2.98], [x, .817, -2.19], .026, '#9ca99e');
    }
    frame.box(-1.38, 1.185, -.96, .896, .864, 1.65, '#81a19a');
    frame.box(-1.38, 2.229, -.96, .956, .185, 1.72, '#adc4b3');
    frame.box(-1.38, 1.88, -1.745, .867, .241, .071, '#698888');
    for (const side of [-1, 1]) {
        const x = -1.38 + side * .437;
        for (const z of [-1.721, -.948, -.189])
            frame.box(x, 1.854, z, .061, .637, .047, '#637f81');
        glass.box(x, 1.877, -.939, .033, .582, 1.565, '#ffffff');
    }
    glass.box(-1.38, 1.888, -.160, .806, .561, .031, '#ffffff');
    glass.box(-1.38, 1.924, -1.779, .806, .403, .031, '#ffffff');
    frame.add(ring, [-1.35, 1.817, -1.52], [.126, .125, .100], '#3b5056', [.63, 0, 0]);
    frame.rod([-1.38, 2.325, -.84], [-1.38, 2.66, -.84], .023, steel);
    lights.box(-1.38, 2.647, -.84, .099, .091, .119, '#e5d3ab');
    frame.add(tube, [1.31, .881, -.267], [.401, .575, .405], '#667c7f', [0, 0, Math.PI / 2]);
    frame.add(tube, [1.31, .884, -.266], [.326, .583, .329], '#879289', [0, 0, Math.PI / 2]);
    for (let i = 0; i < 4; i++)
        frame.add(tube, [1.112 + i * .131, .885, -.267], [.332, .034, .333], '#384e55', [0, 0, Math.PI / 2]);
    frame.rod([1.30, .870, -3.81], [1.30, .928, 3.54], .015, '#3f5359');
    const line = new Batch(), y = groundHeight(-161.8, 81.6);
    line.rod([1.30, .872, -3.82], [1.03, .796 - y, -20.75], .021, '#445f65');
    line.rod([1.30, .927, 3.54], [1.01, .796 - y, 5.26], .021, '#445f65');
    line.box(1.01, .396 - y, 5.26, .141, .800, .167, '#6a817f');
    line.box(1.03, .396 - y, -20.75, .145, .800, .149, '#6a817f');
    layer(root, line, 'Канат и береговые опоры');
    ramp.position.set(0, .722, 3.60);
    rampBatch.box(0, 0, .798, 3.33, .120, 1.61, '#768d8c');
    for (let i = 0; i < 9; i++)
        rampBatch.box(0, .063, .139 + i * .157, 3.18, .020, .040, '#a3ad9e');
    for (const side of [-1, 1]) {
        rampBatch.box(side * 1.665, .08, .80, .101, .172, 1.61, '#b2a583');
        rampBatch.rod([side * 1.64, .07, .074], [side * 1.64, .60, .161], .028, steel);
    }
    layer(ramp, rampBatch, 'Откидная аппарель');
    deck.add(ramp);
    ramp.rotation.x = .12;
    layer(deck, frame, 'Палуба, кабина и лебёдка');
    layer(deck, edges, 'Бортовые отбойники');
    layer(deck, glass, 'Остекление рубки', glazing);
    layer(deck, lights, 'Огонь над рубкой', lit);
    root.add(deck);
    return ({ elapsed }) => {
        deck.position.y = Math.sin(elapsed * .68) * .026;
        deck.rotation.z = Math.sin(elapsed * .52) * .004;
        ramp.rotation.x = lerp(-.62, -.02, phase(elapsed + 5, 39, 2.3, 12.0));
    };
}

const models = {
    microcar: ['Микрокар «Иней»', 'Канальные гаражи. Четыре небольших колеса, одноместная кабина и широкая дверь.', root => passengerCar(root, 'microcar')],
    liftback: ['Лифтбек «Рубеж»', 'Канальные гаражи. Короткая корма, покатая остеклённая дверь и узкие задние фонари.', root => passengerCar(root, 'liftback')],
    minivan: ['Минивэн «Смена»', 'Площадка на Канальной. Шесть кресел в три ряда и высокое панорамное остекление.', root => passengerCar(root, 'minivan')],
    limousine: ['Представительский лимузин', 'Портовая гостиница. Широкая вставка между дверями отделяет задний салон.', root => passengerCar(root, 'limousine')],
    sidecar: ['Зимний мотоцикл с коляской', 'Канальные гаражи. Ветровой щиток водителя, пристёгнутый чехол и отдельный фонарь коляски.', winterSidecar],
    tricycle: ['Грузовой электротрицикл', 'Служебный ряд рынка. Грузовой короб стоит между передними колёсами, крышка откинута.', cargoTricycle],
    bus: ['Автобус «Канал-12»', 'Стоянка на Канальной. В широкой средней двери виден складной пандус, который водитель проверяет перед рейсом.', lowFloorBus],
    trolleybus: ['Троллейбус «Линия»', 'Площадка у Восточной станции. Две секции с гармошкой, штанги и рабочие посадочные двери.', articulatedTrolley],
    'service-tram': ['Служебный трамвай', 'Деповской путь. В шкафу за кабиной хранят инструменты, а ящики ставят на открытую платформу.', serviceTram],
    'double-decker': ['Двухэтажная электричка', 'Восточная станция. Из второго ряда окон виден верхний салон, лестница находится за дверью тамбура.', doubleDeckTrain],
    ferry: ['Канатный паром', 'Южный порт, у Причала 01. У трапа виден канат лебёдки, а на открытой палубе есть место для велосипедов.', cableFerry]
};

function createCityTransit(scene) {
    const network = new T.Group();
    network.name = 'Частный транспорт, автобусы и паром';
    scene.add(network);
    const fleet = transitSites.map(pose => {
        const [label, note, build] = models[pose.kind], root = new T.Group();
        const id = 'new-city-transport-' + pose.kind;
        root.name = label;
        root.userData.cityModel = id;
        root.position.set(pose.x, groundHeight(pose.x, pose.z), pose.z);
        root.rotation.y = pose.yaw;
        root.visible = false;
        network.add(root);
        return {
            build, root, animate: null,
            site: { id, label, x: pose.viewX, z: pose.viewZ, note }
        };
    });
    return {
        sites: fleet.map(vehicle => vehicle.site),
        update(ctx) {
            const focus = ctx.focus ?? ctx;
            for (const vehicle of fleet) {
                const { root } = vehicle, dx = focus.x - root.position.x, dz = focus.z - root.position.z;
                root.visible = ctx.zone === 'street' && dx * dx + dz * dz < 95 ** 2;
                if (!root.visible)
                    continue;
                if (vehicle.build) {
                    vehicle.animate = vehicle.build(root);
                    vehicle.build = null;
                }
                vehicle.animate?.(ctx);
            }
        }
    };
}

module.exports = { createCityTransit };
