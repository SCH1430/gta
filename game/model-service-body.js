"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceBody = void 0;
exports.addServiceBody = addServiceBody;
exports.rearCluster = rearCluster;
exports.buildServiceGear = buildServiceGear;
exports.buildPloughHydraulics = buildPloughHydraulics;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const serviceBody = (kind) => kind === 'taxi' || kind === 'wagon' || kind === 'towtruck' || kind === 'utility';
exports.serviceBody = serviceBody;
const slate = '#34464c', rubber = '#21262c', alloy = '#8a9997', amber = '#ffb94f', steel = '#60716f';
function rearCluster(kind, s, side, hardware, lit) {
    const van = kind === 'van', hatch = kind === 'hatch';
    const bottom = s.belt - (van ? .337 : hatch ? .274 : .245);
    const height = van ? .271 : hatch ? .188 : .146;
    const stations = [[van ? .745 : hatch ? .55 : .385, .035, 1], [.818, .039, 1],
        [van || hatch ? .927 : .887, -.032, .94], [.976, van ? -.205 : -.197, .70]];
    for (let j = 1; j < stations.length; j++) {
        const a = stations[j - 1], b = stations[j], normal = [side * (j - 1) * .45, 0, 1 - (j - 1) * .39];
        const at = ([x, z, scale], level, offset) => [side * s.w * x + normal[0] * offset, bottom + (.5 + (level - .5) * scale) * height, s.rear + z + normal[2] * offset];
        const band = (batch, y0, y1, offset, tint) => batch.quad(at(a, y0, offset), at(b, y0, offset), at(b, y1, offset), at(a, y1, offset), tint, normal);
        band(hardware, -.065, 1.065, 0, '#3d4142');
        band(hardware, .02, .97, .003, '#873b36');
        if (hatch) {
            band(lit, .69, .88, .008, '#ff5947');
            band(lit, .42, .56, .008, '#e64139');
            band(hardware, .57, .67, .009, '#3c292b');
            band(hardware, .08, .27, .008, j === 1 ? '#bbc3ad' : '#c98a50');
        }
        else {
            band(lit, .36, .88, .006, '#ff5646');
            band(hardware, .075, .28, .006, j === 3 || van ? '#c98a50' : '#b9594b');
        }
    }
}
function addServiceBody(kind, paint, trim, lamps, tail, far) {
    const spec = vehicle_cabin_js_1.specs[kind], { w, front: f, rear: r, belt: h, roof } = spec;
    const truck = kind === 'towtruck' || kind === 'utility';
    let beacon;
    if (kind === 'taxi') {
        const sign = new model_geometry_js_1.Batch();
        trim.box(0, roof + .073, .14, .73, .072, .30, rubber);
        sign.box(0, roof + .182, .14, .65, .17, .235, '#efb249');
        (0, model_geometry_js_1.stencil)(trim, '77', [0, roof + .182, .018], .021, '#252d2c', -1);
        (0, model_geometry_js_1.stencil)(trim, '77', [0, roof + .182, .262], .021, '#252d2c', 1);
        far.box(0, roof + .073, .14, .73, .072, .30, rubber);
        far.box(0, roof + .182, .14, .65, .17, .235, '#efb249');
        for (const side of [-1, 1]) {
            trim.box(side * w * .92, h + .048, r - .236, .026, .048, .20, steel);
            for (let i = 0; i < 7; i++)
                for (let row = 0; row < 2; row++) {
                    if ((i + row) % 2 === 0)
                        trim.box(side * (w + .01), h - .185 + row * .037, .51 + i * .036, .019, .037, .036, slate);
                }
        }
        trim.box(0, .725, f - .025, 1.05, .105, .042, '#374b50');
        for (let i = 0; i < 7; i++)
            trim.box(i * .133 - .395, .731, f - .047, .019, .086, .022, alloy);
        beacon = sign.mesh(model_geometry_js_1.lit);
    }
    if (kind === 'wagon') {
        for (const side of [-1, 1]) {
            trim.rod([side * w * .70, roof + .128, -.55], [side * w * .70, roof + .128, 1.87], .031, steel, true);
            for (const z of [-.43, 1.57])
                trim.box(side * w * .70, roof + .072, z, .082, .104, .12, slate);
            trim.box(side * w * .89, h + .017, r - .04, .025, .080, .147, '#818777');
        }
        for (const z of [-.24, .75, 1.50])
            trim.box(0, roof + .119, z, 1.51, .041, .115, alloy);
        far.box(0, roof + .113, .54, 1.43, .071, 1.89, '#5b6967');
        trim.box(0, h + .074, r + .027, 1.43, .164, .052, slate);
        trim.box(0, h + .021, r + .051, 1.19, .016, .014, alloy);
    }
    if (truck) {
        const rear = kind === 'towtruck' ? -.75 : -.13, middle = (r + rear) * .5, deck = r - rear;
        trim.box(0, kind === 'towtruck' ? .49 : .62, middle, 1.61 * w, .095, deck, rubber);
        for (const side of [-1, 1]) {
            trim.box(side * w * .72, .474, middle, w * .18, .16, deck - .1, steel);
            trim.box(side * w * .91, .51, spec.a + .67, .25, .08, .837, slate);
            trim.box(side * w * .88, .34, spec.a + .66, .23, .055, .62, slate);
            trim.box(side * w * .956, .57, spec.a + .67, .024, .021, .72, alloy);
            trim.rod([side * w * .78, 1.39, f + .10], [side * w * .86, 1.70, f + .48], .019, alloy, true);
            trim.box(side * .36, roof + .089, spec.b + .25, .238, .137, .266, '#725437');
            for (let i = 0; i < 3; i++)
                trim.box(side * w * .89, .573, r - .76 - i * .62, .050, .062, .118, '#b38f50');
        }
        far.box(0, roof + .115, spec.b + .25, 1.03, .199, .17, '#d5a34f');
        trim.box(0, .79, f - .032, 1.46, .269, .123, rubber);
        for (let i = 0; i < 6; i++)
            trim.box(0, .704 + i * .035, f - .105, 1.29, .009, .018, alloy);
        if (kind === 'towtruck') {
            trim.box(0, .779, -.794, 1.94, .18, .093, slate);
            for (const side of [-1, 1])
                trim.rod([side * .86, .76, -.76], [side * .86, 1.41, -.76], .038, steel, true);
            trim.rod([-.92, 1.41, -.76], [.92, 1.41, -.76], .051, steel, true);
        }
        else {
            paint.box(0, 1.08, 1.75, 1.94, .48, 2.74, '#e6d0a4');
            trim.box(0, 1.350, 1.73, 1.93, .242, 2.78, '#7f8776');
            trim.box(0, 1.490, 1.76, 1.56, .063, 2.61, '#abb1a1');
            far.box(0, 1.13, 1.69, 1.94, .64, 2.73, '#a2a18b');
            for (const side of [-1, 1])
                for (let i = 0; i < 7; i++) {
                    trim.box(side * w * .862, 1.102, .67 + i * .35, .035, .229, .022, steel);
                }
            for (const x of [-.39, .39])
                trim.box(x, .73, r + .11, .25, .16, .15, slate);
        }
    }
    for (const side of [-1, 1]) {
        const plate = lamps[side < 0 ? 0 : 1], y = truck ? 1.03 : kind === 'wagon' ? .84 : .82;
        const x = side * w * .73, z = f - .036;
        trim.box(x, y, z, .406, .222, .082, rubber);
        trim.box(x, y, z - .046, .361, .167, .054, '#8c9e92');
        if (truck) {
            plate.box(x - .075, y, z - .080, .123, .091, .012, '#fff3d3');
            plate.box(x + .075, y, z - .080, .123, .091, .012, '#fff3d3');
            tail.box(side * w * .79, .623, r + .085, .187, .064, .020, '#ff603f');
            tail.box(side * .36, roof + .158, spec.b + .25, .226, .030, .228, amber);
        }
        else {
            plate.box(x, y + .030, z - .078, .306, .043, .013, '#fff4d4');
            plate.box(x, y - .030, z - .078, .267, .027, .013, '#ffeac0');
            if (kind === 'wagon') {
                trim.box(side * w * .87, h - .017, r + .040, .15, .35, .082, '#73463f');
                tail.box(side * w * .87, h + .055, r + .085, .104, .15, .013, '#ff4f40');
                tail.box(side * w * .87, h - .102, r + .085, .105, .065, .013, '#ff8647');
            }
            else
                rearCluster(kind, spec, side, trim, tail);
        }
    }
    return beacon;
}
function buildServiceGear(kind) {
    if (kind !== 'towtruck' && kind !== 'utility')
        return null;
    const spec = vehicle_cabin_js_1.specs[kind], batch = new model_geometry_js_1.Batch();
    if (kind === 'towtruck') {
        const h = .067, w = spec.w * .94, length = 4.52;
        batch.box(0, 0, length * .5, w * 2, h, length, slate);
        for (const side of [-1, 1]) {
            batch.box(side * w, .064, length * .5, .085, .115, length, steel);
            for (let i = 0; i < 7; i++) {
                const z = .22 + i * .62;
                batch.box(side * w * .64, .037, z, .589, .010, .033, alloy);
                batch.box(side * w * .89, .103, z, .034, .030, .12, amber);
            }
        }
        batch.box(0, .092, .11, .902, .18, .24, slate);
        batch.add(model_geometry_js_1.tube, [0, .18, .22], [.145, .38, .145], alloy, [0, 0, Math.PI / 2]);
        for (const side of [-1, 1]) {
            batch.add(model_geometry_js_1.tube, [side * .195, .18, .22], [.262, .034, .262], slate, [0, 0, Math.PI / 2]);
            for (const z of [1.18, 2.62, 4.10]) {
                const x = side * w * .84;
                batch.box(x, .049, z, .101, .035, .102, slate);
                batch.rod([x - .037, .062, z], [x - .022, .139, z], .012, alloy);
                batch.rod([x - .022, .139, z], [x + .031, .139, z], .012, alloy);
                batch.rod([x + .031, .139, z], [x + .041, .062, z], .012, alloy);
            }
        }
        for (let i = 0; i < 13; i++)
            batch.add(model_geometry_js_1.tube, [-.153 + i * .0255, .18, .22], [.182, .017, .182], i % 2 ? '#8c8576' : '#b0a691', [0, 0, Math.PI / 2]);
        batch.rod([0, .105, .40], [0, .085, 4.36], .018, '#aba28d', true);
    }
    else {
        batch.quad([-.96, .11, -.08], [.98, .11, -.08], [1.13, .60, .13], [-1.11, .60, .13], '#c59960', [0, 0, -1]);
        const lip = (x, height, inset = 0) => [x, .032 + height * .078, .005 - .087 * height - inset];
        batch.quad(lip(-.94, 0), lip(.92, 0), lip(.98, 1), lip(-.96, 1), '#6c7472', [0, 0, -1]);
        batch.quad(lip(-.94, 0, .001), lip(.92, 0, .001), lip(.928, .18, .001), lip(-.944, .18, .001), '#c2c6b9', [0, 0, -1]);
        for (let i = 0; i < 11; i++) {
            const x = -.87 + .165 * i;
            const a = lip(x, .08), b = lip(x + .100 + .012 * (i % 3), .105), c = lip(x + .028, .32 + .10 * (i % 4));
            a[2] -= .002;
            b[2] -= .002;
            c[2] -= .002;
            batch.tri(a, b, c, i % 3 === 0 ? '#9c8470' : '#b2b7ac', [0, 0, -1]);
            batch.box(x + .051, .085, -.057, .032, .023, .020, '#464e4e');
        }
        for (const side of [-1, 1]) {
            batch.rod([side * .93, .13, -.057], [side * 1.11, .60, .10], .024, steel, true);
            batch.rod([side * .74, .14, -.036], [side * .78, .53, .088], .018, slate, true);
            batch.rod([side * .39, .23, .14], [side * .42, .41, .71], .047, alloy, true);
            batch.rod([side * 1.06, .53, .12], [side * 1.08, .91, .16], .013, alloy, true);
            batch.box(side * 1.08, .916, .16, .057, .081, .065, amber);
        }
    }
    return batch.mesh();
}
const hydraulicBody = new T.MeshLambertMaterial({ color: '#475552' });
const hydraulicRod = new T.MeshStandardMaterial({ color: '#bac8c4', roughness: .31, metalness: .56 });
const up = new T.Vector3(0, 1, 0);
function buildPloughHydraulics(chassis, blade, front) {
    const delta = new T.Vector3(), tip = new T.Vector3(), end = new T.Vector3();
    const cylinders = [-1, 1].map(side => {
        const body = new T.Mesh(model_geometry_js_1.tube, hydraulicBody);
        const rod = new T.Mesh(model_geometry_js_1.tube, hydraulicRod);
        body.name = 'plough-hydraulic-cylinder';
        rod.name = 'plough-hydraulic-rod';
        chassis.add(body, rod);
        return { body, rod, anchor: new T.Vector3(side * .81, .94, front - .023),
            bladeAnchor: new T.Vector3(side * .76, .37, .105) };
    });
    return () => {
        blade.updateMatrix();
        for (const { body, rod, anchor, bladeAnchor } of cylinders) {
            tip.copy(bladeAnchor).applyMatrix4(blade.matrix);
            delta.subVectors(tip, anchor);
            const stroke = delta.length();
            delta.divideScalar(stroke);
            const bodyLength = .245;
            body.position.copy(anchor).addScaledVector(delta, bodyLength * .5);
            body.quaternion.setFromUnitVectors(up, delta);
            body.scale.set(.099, bodyLength, .099);
            end.copy(anchor).addScaledVector(delta, bodyLength - .024);
            rod.position.copy(end).lerp(tip, .5);
            rod.quaternion.copy(body.quaternion);
            rod.scale.set(.043, Math.max(.025, stroke - bodyLength + .024), .043);
        }
    };
}
