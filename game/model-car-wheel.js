"use strict";

const T = require('../engine/three.module.min.js');
const { Batch, tube } = require('./model-geometry.js');

const rubber = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .91, metalness: .015, envMapIntensity: .29 });
const alloy = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .37, metalness: .66, envMapIntensity: .96 });

function tyreProfile(kind) {
    if (kind === 'suv' || kind === 'pickup')
        return { width: .130, crown: .86, shoulder: .990, rows: 4, steps: 25 };
    if (kind === 'towtruck' || kind === 'utility' || kind === 'van')
        return { width: kind === 'van' ? .126 : .143, crown: .76, shoulder: .977, rows: 4, steps: 28 };
    return { width: kind === 'coupe' ? .124 : .112, crown: .67, shoulder: .957, rows: 3, steps: 36 };
}

const stamp = [['101', '110', '101'], ['111', '001', '010'], ['111', '001', '010']];
function sidewallStamp(batch, point, side, width, radius) {
    const start = -.135, step = .027;
    stamp.forEach((glyph, digit) => glyph.forEach((row, y) => [...row].forEach((pixel, x) => {
        if (pixel === '0')
            return;
        const a = start + (digit * 4 + x) * step, r = .906 - y * .024;
        const stroke = step * .82, depth = Math.min(.0014, radius * .004);
        batch.quad(point(width + depth, r, a), point(width + depth, r, a + stroke),
            point(width + depth, r - .017, a + stroke), point(width + depth, r - .017, a), '#474c4c', [side, 0, 0]);
    })));
}

function buildWheel(radius, side, kind) {
    const tyre = new Batch(), rim = new Batch(), brake = new Batch(), mount = new Batch();
    const cast = kind === 'coupe' || kind === 'sedan', ladoga = kind === 'hatch';
    const count = cast ? 5 : ladoga ? 8 : 6, slices = 24;
    const ring = cast ? .735 : kind === 'suv' || kind === 'pickup' ? .57 : .64;
    const { width, crown, shoulder, steps, rows } = tyreProfile(kind);
    const sidewall = Math.max(width, .129), bead = sidewall - .006;
    const point = (x, r, a) => [side * x, radius * r * Math.sin(a), radius * r * Math.cos(a)];
    const rings = [[-width * .94, .83], [-width * .99, .94], [-width * .91, shoulder], [-width * crown, 1],
        [width * crown, 1], [width, shoulder], [sidewall, .82], [bead, ring + .027]];
    const bands = ['#2e3234', '#333839', '#292d2f', '#313537', '#383d3e', '#313637', '#282c2d'];
    for (let i = 0; i < slices; i++) {
        const a = i * Math.PI * 2 / slices, next = (i + 1) * Math.PI * 2 / slices;
        for (let j = 1; j < rings.length; j++) {
            const [x0, r0] = rings[j - 1], [x1, r1] = rings[j];
            const m = (a + next) * .5;
            tyre.quad(point(x0, r0, a), point(x0, r0, next), point(x1, r1, next), point(x1, r1, a), bands[j - 1],
                [side * (r0 - r1) * radius, (x1 - x0) * Math.sin(m), (x1 - x0) * Math.cos(m)]);
        }
        tyre.tri(point(-width * .92, 0, a), point(-width * .94, .83, a), point(-width * .94, .83, next), '#2e3234', [-side, 0, 0]);
        const edge = sidewall + .016, lip = ring - .079;
        rim.quad(point(bead, ring + .028, a), point(bead, ring + .028, next), point(edge, ring, next), point(edge, ring, a), cast ? '#bdc8c3' : '#949e99', [side, 0, 0]);
        rim.quad(point(edge, ring, a), point(edge, ring, next), point(.117, lip, next), point(.117, lip, a), '#677170', [side, 0, 0]);
        rim.tri(point(.165, 0, a), point(.154, .225, a), point(.154, .225, next), cast ? '#a3aca8' : '#a6ada5', [side, 0, 0]);
    }
    for (let j = 0; j < count; j++) {
        const a = j * 2 * Math.PI / count, span = Math.PI / count, skew = cast ? span * .26 : 0;
        const out = [side, 0, 0], at = (x, r, offset) => point(x, r, a + span * offset);
        if (ladoga) {
            rim.quad(at(.150, .213, -1), at(.150, .213, 1), at(.131, .382, 1), at(.131, .382, -1), '#7d8988', out);
            rim.quad(at(.131, .382, -1), at(.131, .382, -.49), at(.126, .565, -.42), at(.126, .565, -1), '#8a9592', out);
            rim.quad(at(.131, .382, .49), at(.131, .382, 1), at(.126, .565, 1), at(.126, .565, .42), '#8a9592', out);
            rim.quad(at(.131, .382, -.49), at(.131, .382, .49), at(.113, .426, .46), at(.113, .426, -.46), '#566063', out);
            rim.quad(at(.124, .528, -.46), at(.124, .528, .46), at(.126, .565, .42), at(.126, .565, -.42), '#a2aaa2', out);
        } else {
            const aOuter = a + skew - span * (cast ? .26 : .56), bOuter = a + skew + span * (cast ? .26 : .56);
            rim.quad(at(.155, .185, cast ? -.39 : -.91), at(.155, .185, cast ? .39 : .91),
                point(.136, ring - .055, bOuter), point(.136, ring - .055, aOuter), cast ? '#c4cdca' : '#869293', out);
        }
    }
    if (ladoga)
        for (let j = 0; j < 4; j++)
            rim.box(...point(.165, .163, (j + .5) * Math.PI / 2), .011, .023, .023, '#bbc0b0');

    const disc = radius * (cast ? .565 : .47), dir = [0, 0, -side * Math.PI / 2];
    brake.add(tube, [side * .087, 0, 0], [disc * 2.05, .031, disc * 2.05], '#454b4d', dir);
    brake.add(tube, [side * .106, 0, 0], [disc * 1.98, .011, disc * 1.98], cast ? '#8f9695' : '#5d6869', dir);
    brake.add(tube, [side * .114, 0, 0], [disc * .94, .019, disc * .94], '#555d60', dir);
    if (kind === 'coupe')
        for (let i = 0; i < 10; i++) {
            const a = (i + .19) * Math.PI / 5;
            for (const rr of [.392, .466]) {
                const center = point(.112, rr, a + rr * 3);
                brake.box(...center, .002, .009, .009, '#303a3b', [-a, 0, 0]);
            }
        }
    const position = point(.113, (disc / radius) * .93, .84);
    mount.box(...position, .026, disc * .43, disc * .55, kind === 'coupe' ? '#a55440' : '#626b65', [-.50, 0, 0]);
    mount.box(position[0] + side * .013, position[1], position[2], .007, disc * .31, disc * .32, kind === 'coupe' ? '#ca886b' : '#838b84', [-.50, 0, 0]);

    const engraving = new Batch();
    const surface = (x, a) => point(x, 1.001, a);
    const across = width * crown;
    for (let i = 0; i < steps; i++) {
        const a = i * Math.PI * 2 / steps;
        for (let j = 0; j < rows; j++) {
            const left = across * (2 * j / rows - 1) + .003, right = across * (2 * (j + 1) / rows - 1) - .003;
            const angle = a + (j % 2 ? .057 : 0), edge = angle + (rows === 3 ? .065 : .096);
            engraving.quad(surface(left, angle), surface(right, edge), surface(right, edge + .038), surface(left, angle + .038), '#151b1c');
        }
    }
    for (let j = 1; j < rows; j++) {
        const x = across * (2 * j / rows - 1);
        for (let i = 0; i < slices; i++) {
            const a = i * Math.PI * 2 / slices, next = (i + 1) * Math.PI * 2 / slices;
            engraving.quad(surface(x - .0034, a), surface(x + .0034, a), surface(x + .0034, next), surface(x - .0034, next), '#1c2222');
        }
    }
    sidewallStamp(engraving, point, side, sidewall, radius);
    const roller = new T.Group();
    roller.name = 'wheel-roller';
    const tireSkin = tyre.mesh(rubber), rimSkin = rim.mesh(alloy), tread = engraving.mesh(rubber), discMesh = brake.mesh(alloy), caliper = mount.mesh(alloy);
    tireSkin.name = 'wheel-rubber';
    tread.name = 'tyre-tread-and-marking';
    rimSkin.name = 'wheel-rim';
    discMesh.name = 'brake-rotor';
    caliper.name = 'brake-caliper';
    roller.add(tireSkin, tread, discMesh, rimSkin);
    return { roller, caliper };
}

module.exports = { buildWheel };
