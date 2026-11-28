"use strict";

const T = require('../engine/three.module.min.js');
const { Batch } = require('./model-geometry.js');

const polymer = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .83, metalness: .035, envMapIntensity: .43 });
const metal = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .39, metalness: .62, envMapIntensity: .94 });
const clear = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: .13, metalness: .10,
    envMapIntensity: 1, transparent: true, opacity: .23, depthWrite: false });
const windshieldRim = '#28333a', heating = '#ad8059';

function named(batch, name, material) {
    const result = batch.mesh(material);
    result.name = name;
    return result;
}

function glassEdge(corners, side) {
    const rim = new Batch(), tint = '#a2c1c5';
    for (let i = 0; i < corners.length; i++) {
        const a = corners[i], b = corners[(i + 1) % corners.length];
        const inset = p => [p[0] - side * .009, p[1] - .001, p[2]];
        rim.quad(a, b, inset(b), inset(a), i === 2 ? tint : '#657d85');
    }
    return named(rim, 'side-glass-thickness', clear);
}

function heatingGrid(batch, surface, low, high, halfWidth) {
    for (let line = 0; line < 9; line++) {
        const v = low + (high - low) * (line + .5) / 9;
        batch.quad(surface(-halfWidth, v), surface(halfWidth, v), surface(halfWidth, v + .0023), surface(-halfWidth, v + .0023), heating);
    }
    for (const side of [-1, 1])
        batch.quad(surface(side * halfWidth, low), surface(side * (halfWidth + .013), low),
            surface(side * (halfWidth + .013), high), surface(side * halfWidth, high), '#6a503b');
}

function screenTrim(kind, s, roofWidth) {
    const body = new Batch();
    const windshield = (u, t) => [u * (s.w * .94 + (roofWidth - s.w * .94) * t),
        s.belt + (s.roof - s.belt) * t + .001, s.a + (s.b - s.a) * t - .004];
    for (const side of [-1, 1]) {
        body.quad(windshield(side * .997, .015), windshield(side * .927, .015),
            windshield(side * .941, .986), windshield(side * .997, .986), windshieldRim);
        for (let i = 0; i < 22; i++) {
            const t = .047 + i * .041;
            const column = i % 2 ? .907 : .922;
            body.quad(windshield(side * column, t), windshield(side * (column - .009), t),
                windshield(side * (column - .009), t + .008), windshield(side * column, t + .008), '#435159');
        }
    }
    for (const [edge, inner] of [[.006, .048], [.998, .965]])
        body.quad(windshield(-.997, edge), windshield(.997, edge), windshield(.995, inner), windshield(-.995, inner), windshieldRim);
    if (kind !== 'hatch') {
        const back = (u, t) => [u * (roofWidth + (s.w * .94 - roofWidth) * t),
            s.roof + (s.belt - s.roof) * t, s.c + (s.d - s.c) * t - .006];
        heatingGrid(body, back, .157, .842, .888);
    }
    return named(body, 'window-frit-and-demister', polymer);
}

function headlampOptics(kind, emission, side) {
    const bounds = new T.Box3().setFromArray(emission.pos);
    const center = bounds.getCenter(new T.Vector3()), extent = bounds.getSize(new T.Vector3());
    const silver = new Batch(), glazing = new Batch();
    const round = kind === 'suv', lensW = Math.max(.055, extent.x * .50 + .017), lensH = Math.max(.028, extent.y * .50 + .014);
    const slope = kind === 'coupe' ? side * extent.z / Math.max(.06, extent.x) * .77 : 0;
    const level = kind === 'coupe' ? center.z - .018 : bounds.min.z;
    const contour = round ? Array.from({ length: 14 }, (_, i) => [Math.cos(i * Math.PI / 7), Math.sin(i * Math.PI / 7)])
        : [[-.84, -1], [.83, -1], [1, -.68], [1, .62], [.84, 1], [-.81, 1], [-1, .62], [-1, -.64]];
    const p = (u, v, inset, z) => [center.x + u * lensW * inset, center.y + v * lensH * inset, level + u * lensW * slope + z];
    const outward = [0, 0, -1];
    for (let i = 0; i < contour.length; i++) {
        const [u, v] = contour[i], [x, y] = contour[(i + 1) % contour.length];
        silver.quad(p(u, v, 1.05, -.026), p(x, y, 1.05, -.026), p(x, y, .95, -.023), p(u, v, .95, -.023), '#353f42', outward);
        silver.quad(p(u, v, .95, -.023), p(x, y, .95, -.023), p(x, y, .57, .012), p(u, v, .57, .012),
            i % 2 ? '#bdc5bf' : '#828f8d', outward);
        silver.quad(p(u, v, .83, -.015), p(x, y, .83, -.015), p(x, y, .75, -.006), p(u, v, .75, -.006),
            i % 2 ? '#9baaa6' : '#717c7d', outward);
        const aged = kind === 'hatch' || kind === 'wagon';
        glazing.tri(p(0, 0, 1, -.045), p(u, v, .953, -.026), p(x, y, .953, -.026),
            aged ? (i % 3 === 1 ? '#e1dac2' : '#b9b49d') : (i % 3 === 1 ? '#d4e7e4' : '#a8c4c8'), outward);
        glazing.quad(p(u, v, .95, -.026), p(x, y, .95, -.026), p(x, y, .95, -.018), p(u, v, .95, -.018), '#7f9ca0', outward);
    }
    const projectors = kind === 'sedan' || kind === 'patrol' || kind === 'towtruck' || kind === 'utility' || kind === 'pickup' ? [-.43, .43] : [0];
    for (const spot of projectors) {
        const pupil = p(spot, 0, 1, .003);
        silver.ball(...pupil, Math.min(.062, lensW * .60), Math.min(.048, lensH * .65), .027, '#e9d5a1');
    }
    return { reflector: named(silver, 'headlamp-reflector', metal), lens: named(glazing, 'headlamp-clear-shell', clear) };
}

function chargingFlap(kind, s, skin) {
    // Sample the outermost sheet so the gasket sits on the actual body profile.
    const ray = new T.Raycaster(), origin = new T.Vector3(), direction = new T.Vector3(-1, 0, 0);
    const ax = s.w + .25, width = .124, height = .096;
    const boundary = [[-.86, -1], [.86, -1], [1, -.79], [1, .79], [.86, 1], [-.86, 1], [-1, .79], [-1, -.79]];
    const front = [s.front + .32, s.belt - .245], rear = [s.rear - .39, s.belt - .135];
    const centers = kind === 'towtruck' || kind === 'utility' ? [front, rear] : [rear, front, [s.rw + .42, .73]];
    const found = [];
    const point = (z, y, setback = 0) => {
        ray.set(origin.set(ax, y, z), direction);
        found.length = 0;
        const hit = ray.intersectObject(skin, false, found)[0];
        return hit && hit.point.x > s.w * .69 ? [hit.point.x + setback, y, z] : null;
    };
    for (const [z, y] of centers) {
        const edges = (scale, rise) => boundary.map(([u, v]) => point(z + u * width * scale, y + v * height * scale, rise));
        const gasket = edges(1, .008), bevel = edges(.87, .019), panel = edges(.79, .022);
        const middle = point(z, y, .022);
        if (!middle || [...gasket, ...bevel, ...panel].some(p => p === null))
            continue;
        const bottom = new Batch(), cap = new Batch();
        const normal = [1, 0, 0];
        for (let i = 0; i < boundary.length; i++) {
            const j = (i + 1) % boundary.length;
            bottom.quad(gasket[i], gasket[j], bevel[j], bevel[i], '#263338', normal);
            cap.quad(bevel[i], bevel[j], panel[j], panel[i], '#bdc5c3', normal);
            cap.tri(panel[i], panel[j], middle, '#edf0ed', normal);
        }
        return { frame: named(bottom, 'charging-flap-gasket', polymer), cap: named(cap, 'charging-flap-paint') };
    }
    return {};
}

function suspensionSpring(batch, side, x, y, z) {
    const divisions = 30, faces = 5;
    function along(i, j) {
        const turn = i * Math.PI * 11 / divisions, profile = j * Math.PI * 2 / faces;
        const radius = .061 + Math.cos(profile) * .012;
        return [x - side * .030 * i / divisions + radius * Math.cos(turn),
            y + i * .257 / divisions + Math.sin(profile) * .012, z + radius * Math.sin(turn)];
    }
    for (let i = 0; i < divisions; i++)
        for (let j = 0; j < faces; j++)
            batch.quad(along(i, j), along(i + 1, j), along(i + 1, j + 1), along(i, j + 1), '#8c9c94');
}

function wheelWells(kind, s) {
    const liner = new Batch(), runningGear = new Batch();
    const high = kind === 'suv' || kind === 'pickup' || kind === 'utility' || kind === 'towtruck';
    const arch = s.r + (high ? .086 : kind === 'van' ? .075 : .052);
    for (const side of [-1, 1])
        for (const z of [s.fw, s.rw]) {
            const outside = s.w * .957, inside = s.w * .653;
            const point = (x, r, a) => [side * x, s.r + Math.sin(a) * r, z + Math.cos(a) * r];
            for (let i = 0; i < 12; i++) {
                const start = i * Math.PI / 12, next = (i + 1) * Math.PI / 12, center = (start + next) * .5;
                const outward = [0, -Math.sin(center), -Math.cos(center)];
                liner.quad(point(inside, arch, start), point(outside, arch, start), point(outside, arch, next), point(inside, arch, next),
                    i % 3 === 1 ? '#3b4346' : '#2d3538', outward);
                liner.quad(point(inside, arch, start), point(inside, arch, next), point(inside, .09, next), point(inside, .09, start), '#232b2d', [side, 0, 0]);
            }
            if (!high)
                continue;
            liner.box(side * (s.w - .105), .426, z + arch * .99, .154, .276, .036, '#313a3a', [-.13, 0, 0]);
            const x = side * (s.w - .261), y = s.r + .147, q = z + (z === s.fw ? -.149 : .104);
            runningGear.rod([x, y, q], [x - side * .044, y + .338, q], .027, '#899592');
            runningGear.rod([x - side * .022, y + .141, q], [x - side * .045, y + .339, q], .044, '#4e6061');
            suspensionSpring(runningGear, side, x, y + .064, q);
            runningGear.rod([side * s.w * .60, s.r - .09, z + .198], [side * (s.w - .233), s.r - .036, z], .033, '#69736e');
        }
    return { liners: named(liner, 'wheel-arch-liners', polymer),
        suspension: runningGear.pos.length ? named(runningGear, 'visible-suspension', metal) : null };
}

function underside(kind, s) {
    const frame = new Batch();
    const heavy = kind === 'utility' || kind === 'towtruck' || kind === 'pickup';
    const span = s.rw - s.fw, center = (s.fw + s.rw) * .5;
    const clearance = .24;
    for (const side of [-1, 1]) {
        const x = side * s.w * (heavy ? .54 : .66);
        frame.box(x, clearance - .017, center, heavy ? .135 : .089, .106, span + .40, '#3e4848');
        frame.box(x, clearance - .065, center, heavy ? .102 : .071, .013, span + .30, '#636c65');
        for (const z of [s.fw + .10, center, s.rw - .20])
            frame.box(x * .96, clearance - .070, z, .116, .032, .16, '#747f77');
    }
    if (heavy) {
        frame.rod([0, clearance - .040, s.fw + .08], [0, clearance - .054, s.rw], .059, '#636e69');
        frame.ball(0, clearance - .009, s.rw, .325, .20, .44, '#505d5a');
        for (const axle of [s.fw, s.rw])
            frame.rod([-s.w * .68, clearance + .025, axle], [s.w * .68, clearance + .025, axle], .057, '#697671');
        frame.box(-s.w * .36, clearance - .026, center - .42, .385, .091, span * .49, '#5e6e69');
    } else {
        const width = s.w * (kind === 'van' ? 1.39 : 1.18), length = span * (kind === 'van' ? .76 : .64);
        frame.box(0, clearance - .032, center, width, .078, length, '#4b5c5d');
        frame.box(0, clearance - .071, center, width * .94, .024, length * .96, '#6b7875');
        for (let i = -2; i <= 2; i++) {
            const z = center + i * length * .177;
            frame.box(0, clearance - .089, z, width * .87, .017, .047, '#87928a');
            for (const x of [-width * .43, width * .43])
                frame.box(x, clearance - .092, z + .03, .028, .015, .032, '#354140');
        }
        for (const side of [-1, 1])
            frame.rod([side * width * .494, clearance - .082, center - length * .48],
                [side * width * .494, clearance - .065, center + length * .54], .011, '#a28156');
    }
    for (const end of [-1, 1]) {
        const axle = end < 0 ? s.fw : s.rw, nose = end < 0 ? s.front + .20 : s.rear - .26;
        frame.box(0, clearance - .024, (axle + nose) * .5, s.w * 1.14, .089, Math.abs(nose - axle), '#465358');
        for (let i = -1; i <= 1; i++)
            frame.box(i * s.w * .32, clearance - .073, (axle + nose) * .5, .088, .032, Math.abs(nose - axle) * .68, '#74817d');
    }
    return named(frame, 'undercarriage-and-protection', metal);
}

function buildCarExterior(kind, s, roofWidth, body, lights) {
    const optics = lights.map((lamp, i) => headlampOptics(kind, lamp, i === 0 ? -1 : 1));
    const { liners, suspension } = wheelWells(kind, s);
    const { frame, cap } = chargingFlap(kind, s, body);
    const glass = screenTrim(kind, s, roofWidth);
    return { optics, cap, detail: [frame, glass, liners].filter(Boolean), undercarriage: underside(kind, s), suspension };
}

module.exports = { buildCarExterior, glassEdge, heatingGrid };
