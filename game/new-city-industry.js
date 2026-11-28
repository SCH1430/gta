"use strict";

const T = require('../engine/three.module.min.js');
const { Batch, shell, lit, glass } = require('./model-geometry.js');
const { groundHeight } = require('./world-layout.js');
const { industryPlacements } = require('./new-city-industry-layout.js');

const rubber = '#252b2d', shield = '#39484a', steel = '#6d8281', bright = '#b8c3b7';
const rimMesh = new T.CylinderGeometry(1, 1, 1, 16);
const lens = new T.CylinderGeometry(1, 1, 1, 12);
const cylinder = new T.CylinderGeometry(1, 1, 1, 12);
const wheelRotation = [0, 0, Math.PI / 2];
const deck = '#626964';

function add(root, batch, name, material) {
    const part = batch.mesh(material);
    part.name = name;
    root.add(part);
    return part;
}

function wheel(batch, side, x, z, radius, width, rim, shallow = false) {
    batch.add(rimMesh, [x, radius, z], [radius, width, radius], rubber, wheelRotation);
    batch.add(rimMesh, [x + side * (width / 2 + .012), radius, z], [radius * .58, .061, radius * .58], rim, wheelRotation);
    batch.add(lens, [x + side * (width / 2 + .051), radius, z], [radius * .25, .068, radius * .25], shield, wheelRotation);
    const count = shallow ? 8 : 12;
    for (let i = 0; i < count; i++) {
        const a = i * Math.PI * 2 / count;
        const y = radius + Math.sin(a) * radius * .98, pz = z + Math.cos(a) * radius * .98;
        batch.box(x, y, pz, width * .95, radius * (shallow ? .11 : .16), .047 + radius * .03, '#363e3f', [a - Math.PI / 2, 0, 0]);
    }
}

function cab(body, windows, { x = 0, z, floor, width, length, height, color, stripe = '#d4bc81' }) {
    const front = z - length * .5, back = z + length * .5, half = width * .5, roof = floor + height;
    body.box(x, floor + height * .22, z, width, height * .44, length, color);
    body.box(x, roof - .061, z + .04, width + .062, .122, length * .97, color);
    body.box(x, floor + height * .39, front - .012, width * .96, .055, .041, stripe);
    body.box(x, floor + height * .66, back - .025, width, height * .44, .09, color);
    windows.box(x, floor + height * .68, front + .055, width * .92, height * .48, .036, '#819a9a');
    for (const side of [-1, 1]) {
        const sx = x + side * (half - .017);
        windows.box(sx, floor + height * .69, z + .03, .026, height * .49, length * .90, '#8caaa9');
        for (const pz of [front + .061, back - .073])
            body.rod([sx, floor + height * .40, pz], [sx, roof - .048, pz + .049], .033, color, true);
        body.box(sx, floor + height * .39, z, .060, .045, length * .98, shield);
        body.box(sx + side * .037, floor + height * .29, z + .14, .055, .039, .19, bright);
    }
    body.rod([x, floor + height * .43, front + .035], [x, roof - .057, front + .065], .021, shield, true);
    body.box(x, floor + height * .53, z + length * .20, width * .56, .12, .21, '#344043');
}

function stepLadder(batch, x, z, bottom, top, width) {
    for (const side of [-1, 1])
        batch.rod([x + side * width * .5, bottom, z], [x + side * width * .5, top, z], .028, bright);
    for (let y = bottom + .12; y < top; y += .22)
        batch.rod([x - width * .5, y, z], [x + width * .5, y, z], .022, steel, true);
}

function terminalShunter(root) {
    const body = new Batch(), windows = new Batch(), lights = new Batch();
    const paint = '#496f68', trim = '#aabda8';
    body.box(0, .85, .10, 2.50, .27, 5.27, shield);
    body.box(0, .64, -2.57, 2.76, .28, .38, '#52616a');
    body.box(0, .54, 2.58, 2.83, .27, .31, '#516467');
    body.box(0, 1.0, 1.20, 2.26, .18, 2.55, '#656d67');
    body.box(.69, 1.25, -.47, .83, .57, 2.36, paint);
    body.box(.69, 1.56, -.47, .85, .10, 2.40, trim);
    cab(body, windows, { x: -.45, z: -1.45, floor: 1.04, width: 1.32, length: 1.83, height: 2.05, color: paint });
    body.add(cylinder, [0, 1.20, 1.35], [.68, .31, .68], '#363f40');
    body.add(cylinder, [0, 1.40, 1.35], [.59, .14, .59], '#8a9186');
    for (const side of [-1, 1]) {
        body.box(side * .26, 1.45, 1.64, .099, .08, .55, '#465154', [0, side * .37, 0]);
        body.box(side * .96, 1.11, 1.52, .61, .074, 1.81, '#757b73');
        for (const z of [-1.69, 1.57]) wheel(body, side, side * 1.08, z, .595, .43, darkRim, true);
        const x = side * .96;
        body.box(x, .91, -2.75, .35, .24, .10, shield);
        lights.box(x, .925, -2.809, .234, .105, .021, '#dbe9da');
        lights.box(x, .85, 2.75, .193, .086, .025, '#b84c45');
    }
    stepLadder(body, -1.27, -.95, .39, 1.1, .34);
    add(root, body, 'short-elevated-fifth-wheel');
    add(root, windows, 'offset-cab-windows', glass);
    add(root, lights, 'terminal-marker-lights', lit);
}

const darkRim = '#819288';
function striped(batch, x, y, z, span) {
    for (let i = 0; i < 6; i++)
        batch.box(x + (i - 2.5) * span / 6, y, z, span * .074, .132, .024, i % 2 ? '#303b3d' : '#d5a153', [0, 0, -.38]);
}

function portStraddle(root) {
    const body = new Batch(), windows = new Batch(), lights = new Batch(), load = new Batch();
    const orange = '#bb8849', orangeShade = '#826344', width = 2.26, length = 3.31;
    for (const side of [-1, 1]) {
        for (const end of [-1, 1]) {
            const x = side * width, z = end * length;
            wheel(body, side, x, z, .86, .47, darkRim);
            body.box(x, 1.07, z, .82, .55, .95, orangeShade);
            body.box(x, 3.54, z, .47, 5.55, .55, orange);
            for (let i=0;i<8;i++) {
                const y=1.39+i*.28;
                body.rod([x+side*.238,y,z-.18],[x+side*.238,y+.18,z+.08],.012,i%3?'#827a69':'#a9a89c',true);
            }
            body.rod([x, 3.84, z], [x, 6.09, z - end * 2.40], .16, orangeShade, true);
            lights.box(x, 6.38, z, .22, .087, .20, '#f4be72');
        }
        body.box(side * width, 6.37, 0, .59, .58, 7.80, orange);
        body.box(side * width, 7.00, -2.48, .52, .068, 1.37, shield);
        body.rod([side * 2.46, 7.44, -3.10], [side * 2.46, 7.44, -1.80], .022, bright);
        for (const z of [-3.06, -2.32, -1.85]) body.rod([side * 2.46, 7.0, z], [side * 2.46, 7.44, z], .022, bright);
    }
    for (const z of [-3.13, .78, 3.03])
        body.box(0, 6.25, z, 4.74, .49, .44, orangeShade);
    cab(body, windows, { x: 1.62, z: -2.09, floor: 6.57, width: 1.43, length: 1.89, height: 1.53, color: orange, stripe: '#e0bf78' });
    stepLadder(body, 2.39, -3.66, .53, 6.66, .39);
    const spreader = new Batch();
    spreader.box(0, 2.72, 0, 2.81, .25, 6.37, '#b99054');
    for (const z of [-2.83, 2.83]) spreader.box(0, 2.84, z, 2.87, .155, .20, orangeShade);
    const spread = add(root, spreader, 'suspended-spreader');
    const cableParts = new Batch();
    for (const x of [-.98, .98])
        for (const z of [-2.59, 2.59]) cableParts.rod([x, 2.81, z], [x, 6.24, z], .025, '#394547');
    const cable = add(root, cableParts, 'lifting-cables');
    load.box(0, 1.53, 0, 2.39, 2.24, 6.05, '#557b7c');
    for (const side of [-1, 1]) {
        for (let i = 0; i < 15; i++) load.box(side * 1.196, 1.52, -2.76 + i * .393, .037, 2.11, .118, '#61888a');
        for (const y of [.42, 2.63]) load.box(side * 1.203, y, 0, .073, .106, 6.16, '#3d5b5e');
        load.rod([side * .56, .48, 3.06], [side * .56, 2.55, 3.06], .031, '#a3aea3');
        load.box(side * .55, 1.39, 3.07, .33, .071, .046, '#8d9d94');
    }
    striped(load, 0, 2.57, 3.066, 2.22);
    const box = add(root, load, 'suspended-corrugated-container');
    add(root, body, 'four-corner-gantry');
    add(root, windows, 'raised-gantry-cab', glass);
    add(root, lights, 'gantry-marker-lights', lit);
    return (c) => {
        const lift = .18 + .18 * Math.sin(c.elapsed * .29);
        spread.position.y = box.position.y = lift;
        cable.scale.y = 1 - lift / 3.43;
        cable.position.y = (1 - cable.scale.y) * 6.24;
    };
}

function logGrapple(root) {
    const body = new Batch(), windows = new Batch(), lights = new Batch(), boom = new Batch();
    const yellow = '#b69453', darkYellow = '#86633c';
    body.box(0, .92, .52, 2.78, .54, 5.20, shield);
    body.box(0, 1.54, 1.73, 2.71, 1.21, 1.83, yellow);
    body.box(0, 2.16, 1.69, 2.67, .055, 1.66, '#a8aca0');
    for (let i = 0; i < 7; i++) body.box(0, 1.34 + i * .105, 2.665, 1.61, .041, .025, '#666450');
    cab(body, windows, { z: -.36, floor: 1.73, width: 1.81, length: 1.47, height: 1.67, color: yellow });
    body.box(0, 3.44, -.37, 1.97, .084, 1.63, '#727568');
    for (let i = 0; i < 6; i++) {
        const x = -.76 + i * .30;
        body.rod([x, 2.38, -1.136], [x, 3.30, -1.14], .022, shield, true);
    }
    for (let i = 0; i < 4; i++) body.rod([-.87, 2.52 + i * .21, -1.15], [.87, 2.52 + i * .21, -1.15], .023, shield, true);
    for (const side of [-1, 1]) {
        for (const z of [-1.19, 1.71]) wheel(body, side, side * 1.34, z, .83, .67, darkRim);
        body.box(side * 1.14, 1.67, -1.47, .55, .18, 2.03, darkYellow);
        lights.box(side * .69, 3.12, -1.174, .195, .098, .034, '#e2dcca');
        boom.rod([side * .64, .26, .26], [side * .59, .46, -1.62], .115, yellow, true);
        boom.rod([side * .59, .46, -1.61], [side * .65, .145, -2.65], .119, yellow, true);
        boom.rod([side * .54, -.36, .36], [side * .51, .31, -1.98], .069, '#99a29a');
    }
    const linkage = new T.Group();
    linkage.name = 'forestry-lifting-boom';
    linkage.position.set(0, 1.53, -.87);
    root.add(linkage);
    add(linkage, boom, 'forklift-hydraulic-linkage');
    const jaws = new Batch(), cargo = new Batch();
    const arc = [[0, .62, -.08], [0, .63, -.50], [0, .38, -.71], [0, .02, -.74], [0, -.27, -.49], [0, -.32, -.19]];
    for (const x of [-.87, .87]) {
        for (let i = 1; i < arc.length; i++) {
            const a = arc[i - 1], b = arc[i];
            jaws.rod([x, a[1], a[2]], [x, b[1], b[2]], .093, darkYellow, true);
            jaws.rod([x, -a[1] * .54, -a[2] * .57], [x, -b[1] * .54, -b[2] * .57], .081, '#6c6855', true);
        }
    }
    jaws.rod([-.94, .33, .02], [.94, .33, .02], .089, shield);
    for (const [i, at] of [[0, [-.09, -.05, -.31]], [1, [.04, .16, -.23]], [2, [-.17, .04, -.65]]]) {
        const len = 3.26 + i * .19, r = .23 - i * .024;
        cargo.add(cylinder, at, [r, len, r], '#69523d', wheelRotation);
        for (const side of [-1, 1]) {
            const x = at[0] + side * (len / 2 + .013);
            cargo.add(cylinder, [x, at[1], at[2]], [r * .88, .019, r * .88], '#b69369', wheelRotation);
            cargo.add(cylinder, [x + side * .013, at[1], at[2]], [r * .48, .015, r * .48], '#95764d', wheelRotation);
        }
    }
    const head = new T.Group();
    head.position.set(0, .31, -2.13);
    linkage.add(head);
    add(head, jaws, 'curved-log-grapple');
    add(head, cargo, 'crosswise-logs-with-cut-ends');
    add(root, body, 'reinforced-forest-loader');
    add(root, windows, 'protected-forest-cab-glass', glass);
    add(root, lights, 'forest-loader-work-lights', lit);
    return (c) => { linkage.rotation.x = -.065 - .063 * Math.sin(c.elapsed * .43); };
}

function quarryHauler(root) {
    const base = new Batch(), windows = new Batch(), lights = new Batch(), tipper = new Batch(), piston = new Batch();
    const tan = '#b89860', deep = '#6a5b43';
    base.box(0, 1.84, -.06, 4.93, .51, 8.63, deep);
    base.box(0, 1.73, -4.56, 5.70, .61, .58, '#545b56');
    base.box(0, 2.75, -3.18, 4.91, 1.47, 2.33, tan);
    base.box(.81, 2.68, -4.36, 2.95, .81, .048, shield);
    for (let y = 2.34; y < 2.98; y += .13) base.box(.81, y, -4.415, 2.87, .069, .022, '#64726d');
    cab(base, windows, { x: -1.49, z: -2.46, floor: 2.13, width: 1.88, length: 2.15, height: 1.55, color: tan });
    stepLadder(base, -1.99, -4.88, .72, 3.11, .60);
    base.box(-1.98, 2.28, -4.65, .72, .143, .48, shield);
    for (const x of [-2.53, 2.53]) base.rod([x, 2.32, -4.49], [x, 3.31, -4.49], .038, bright);
    for (const side of [-1, 1]) {
        const x = side * 2.69;
        for (const z of [-2.87, 2.82]) wheel(base, side, x, z, 1.53, 1.16, '#837b68');
        lights.box(side * 2.03, 2.16, -4.894, .415, .245, .026, '#e9d7aa');
        lights.box(side * 2.23, 1.91, 4.45, .24, .16, .04, '#c35954');
    }
    striped(base, 0.22, 1.73, -4.875, 4.56);
    const bed = new T.Group();
    bed.position.set(0, 2.65, 3.56);
    bed.name = 'quarry-tipping-body';
    root.add(bed);
    tipper.box(0, .19, -2.15, 5.13, .22, 6.91, deep);
    tipper.box(0, 1.20, -5.14, 5.52, 2.19, .29, tan, [-.26, 0, 0]);
    tipper.quad([-2.76, 1.81, -5.52], [2.76, 1.81, -5.52], [2.87, 1.65, -7.95], [-2.87, 1.65, -7.95], '#a97f49', [0, 1, 0]);
    tipper.box(0, 1.65, -7.82, 5.71, .135, .33, '#c5a770');
    for (const side of [-1, 1]) {
        const outer = side * 2.72, inner = side * 2.45;
        tipper.quad([inner, .22, .89], [inner, .32, -4.89], [outer, 1.87, -5.02], [outer, 1.79, .73], tan, [side, 0, 0]);
        tipper.rod([outer, 1.85, -4.92], [outer, 1.78, .90], .075, '#8e704c', true);
        for (let j = 0; j < 7; j++) {
            const z = -4.43 + j * .78;
            tipper.rod([inner, .32, z], [outer, 1.78, z + .14], .052, '#8a704e', true);
        }
        piston.rod([side * .73, 1.33, 1.75], [side * .73, 2.58, -.68], .095, '#aeb5ad');
        piston.rod([side*.73,1.41,1.60],[side*.73,1.55,1.32],.106,'#474b40');
        piston.rod([side*.73,1.57,1.30],[side*.73,1.61,1.22],.10,'#615f50');
    }
    add(root, base, 'oversized-hauler-with-ladder');
    add(root, windows, 'quarry-cab-glass', glass);
    add(root, lights, 'quarry-truck-lights', lit);
    add(root, piston, 'tipper-hydraulic-cylinders');
    add(bed, tipper, 'canopied-dump-bed');
    return c => { bed.rotation.x = .028 + .021 * Math.sin(c.elapsed * .26); };
}

function snowmobile(root) {
    const body = new Batch(), screen = new Batch(), lamps = new Batch(), tracks = new Batch();
    const paint = '#a36551';
    shell(body, [[-1.50, .17, .39, .47, .60], [-1.16, .32, .39, .63, .85], [-.62, .43, .42, .74, 1.03], [-.18, .40, .45, .58, .83], [.37, .32, .43, .60, .71], [1.29, .24, .36, .51, .58]], paint);
    body.box(0, .71, .42, .58, .21, 1.24, shield);
    body.box(0, .56, 1.23, .68, .11, .53, '#657271');
    body.rod([-.30, .67, 1.04], [-.30, .75, 1.51], .024, bright);
    body.rod([.30, .67, 1.04], [.30, .75, 1.51], .024, bright);
    body.rod([-.28, .73, 1.05], [.26, .73, 1.41], .041, '#8ca5a0');
    body.box(.24, .73, 1.40, .13, .10, .12, '#aa875a');
    body.rod([0, .71, -.63], [0, 1.04, -.45], .037, '#2d3539');
    body.rod([-.41, 1.10, -.34], [.41, 1.10, -.34], .024, '#303a3d');
    screen.quad([-.33, .98, -.62], [.33, .98, -.62], [.25, 1.39, -.41], [-.25, 1.39, -.41], '#b2c9c2', [0, 0, -1]);
    lamps.box(0, .66, -1.274, .26, .117, .026, '#ebe9b5');
    lamps.box(0, .55, 1.52, .21, .081, .032, '#c05448');
    for (const side of [-1, 1]) {
        const x = side * .55;
        body.rod([side * .22, .56, -1.05], [x, .16, -.97], .034, '#a2aeaa');
        body.rod([side * .22, .47, -.36], [x, .16, -.85], .029, shield);
        body.box(x, .055, -1.01, .235, .073, 1.07, '#515c5b');
        body.box(x, .091, -1.65, .228, .057, .29, '#a3b4af', [.37, 0, 0]);
        body.rod([x, .091, -.56], [x, .106, -1.68], .021, '#b6c2b6');
    }
    tracks.box(0, .18, .55, .58, .24, 1.71, rubber);
    for (let i = 0; i < 12; i++) tracks.box(0, .052, -.19 + i * .134, .61, .059, .068, '#56645e');
    for (const side of [-1, 1])
        for (const z of [-.08, .51, 1.13]) tracks.add(lens, [side * .285, .182, z], [.116, .048, .116], '#879992', wheelRotation);
    add(root, body, 'snow-scooter-with-survey-kit');
    add(root, tracks, 'snow-scooter-track-and-rollers');
    add(root, screen, 'snow-scooter-windshield', glass);
    add(root, lamps, 'snow-scooter-lights', lit);
}

function tramHaulage(root) {
    const tractor = new Batch(), windows = new Batch(), trailer = new Batch(), railBody = new Batch(), railWindows = new Batch(), lights = new Batch();
    const blue = '#576f7d', red = '#875b50', cream = '#a99d83';
    tractor.box(0, .77, -5.97, 2.41, .31, 5.24, shield);
    cab(tractor, windows, { z: -7.53, floor: .96, width: 2.57, length: 2.21, height: 2.18, color: blue });
    tractor.box(0, .63, -8.67, 2.63, .23, .25, steel);
    tractor.box(0, 1.03, -5.38, 2.33, .184, 2.16, deck);
    for (const side of [-1, 1]) {
        for (const z of [-7.73, -5.74, -4.94]) wheel(tractor, side, side * 1.07, z, .53, .39, steel, true);
        lights.box(side * 1.04, .755, -8.81, .285, .133, .024, '#e0e9d7');
        lights.box(side * 1.43, .42, 8.52, .21, .129, .022, '#c46550');
        lights.box(side * 1.54, .58, 2.04, .025, .080, .114, '#e5b46d');
    }
    trailer.box(0, .27, 1.44, 2.97, .16, 10.11, '#8d795a');
    trailer.box(0, .41, 6.85, 3.10, .21, 3.22, '#6c6861');
    trailer.box(0, .74, -3.67, 2.81, .39, 1.14, '#776b59');
    trailer.box(0, .43, -2.70, 2.83, .175, 1.46, '#726b5c', [0, 0, 0]);
    for (const side of [-1, 1]) {
        trailer.box(side * 1.45, .40, .38, .09, .17, 10.03, '#504e48');
        for (const [i, z] of [5.48, 6.26, 7.03, 7.82].entries()) {
            const swivel = new Batch();
            wheel(swivel, side, 0, 0, .38, .285, armRim, true);
            const bogie = add(root, swivel, 'steered-trailer-wheel');
            bogie.position.set(side * 1.34, 0, z);
            bogie.rotation.y = .035 + i * .028;
        }
        trailer.rod([side * .56, .43, -3.07], [side * .56, .43, 5.53], .046, '#a8adaa', true);
        for (const z of [-2.81, .51, 4.07]) {
            trailer.rod([side * 1.38, .422, z - .44], [side * 1.01, 1.025, z], .036, '#b99260', true);
            trailer.box(side * 1.39, .51, z - .42, .111, .15, .24, '#545449');
        }
    }
    const profile = [[-2.99, .89, .81, 2.74, 2.89], [-2.67, 1.12, .67, 2.84, 3.19], [4.32, 1.13, .67, 2.84, 3.19], [4.57, .98, .85, 2.78, 3.04]];
    shell(railBody, profile, cream);
    railBody.box(0, 1.01, .84, 2.32, .61, 7.57, red);
    railBody.box(0, 3.21, .49, 2.08, .093, 6.63, '#7b8984');
    for (const side of [-1, 1]) {
        for (let j = 0; j < 6; j++) {
            const z = -2.14 + j * 1.13;
            railBody.box(side * 1.13, 2.27, z, .020, .86, .99, shield);
            railWindows.box(side * 1.147, 2.28, z, .016, .731, .87, '#769495');
            railBody.box(side * 1.168, 2.61, z, .018, .024, .84, bright);
        }
        railBody.box(side * 1.166, 1.46, .83, .020, .11, 7.04, '#b6a689');
    }
    railWindows.box(0, 2.27, -2.999, 1.58, .81, .022, '#829f9a');
    railBody.box(0, 2.82, -2.978, .80, .24, .053, shield);
    railBody.box(0, 2.79, -3.013, .68, .107, .011, '#b5ab8b');
    striped(trailer, 0, .51, 8.535, 2.64);
    add(root, tractor, 'haulage-tractor');
    add(root, windows, 'haulage-tractor-glass', glass);
    add(root, trailer, 'multi-axle-tram-trailer-with-rails');
    add(root, railBody, 'tied-down-tram-section');
    add(root, railWindows, 'tram-section-windows', glass);
    add(root, lights, 'haulage-marker-lights', lit);
}

const armRim = '#818a81';
const builders = [terminalShunter, portStraddle, logGrapple, quarryHauler, snowmobile, tramHaulage];

function createCityIndustry(scene) {
    const group = new T.Group();
    group.name = 'Портовая и промышленная техника';
    scene.add(group);
    const sites = industryPlacements.map(({ id, label, lookX, lookZ, note }) => ({ id, label, x: lookX, z: lookZ, note, radius: 2.5 }));
    const views = industryPlacements.map((position, i) => ({ position, build: builders[i], root: null, update: null }));
    return { sites, update(c) {
        for (const view of views) {
            const { position } = view, point = c.focus ?? c;
            const visible = c.zone === 'street' && Math.hypot(point.x - position.x, point.z - position.z) < 145;
            if (visible && !view.root) {
                view.root = new T.Group();
                view.root.name = position.label;
                view.root.userData.cityModel = position.id;
                view.root.position.set(position.x, groundHeight(position.x, position.z), position.z);
                view.root.rotation.y = position.yaw ?? 0;
                view.update = view.build(view.root);
                group.add(view.root);
            }
            if (view.root) view.root.visible = visible;
            if (visible) view.update?.(c);
        }
    } };
}

module.exports = { createCityIndustry };
