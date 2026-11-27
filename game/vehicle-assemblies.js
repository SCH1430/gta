"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rearEquipment = rearEquipment;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
function rearEquipment(kind) {
    if (kind === 'towtruck' || kind === 'utility')
        return (_paint) => ({ root: new T.Group(), update(_dt, _time, _e) { } });
    const s = vehicle_cabin_js_1.specs[kind], van = kind === 'van', hatch = kind === 'hatch', pickup = kind === 'pickup', suv = kind === 'suv', x = s.w * .92, r = s.rear, h = s.belt;
    const deck = (0, vehicle_cabin_js_1.rearDeckStart)(kind), bin = new model_geometry_js_1.Batch(), lid = new model_geometry_js_1.Batch(), liner = new model_geometry_js_1.Batch(), otherDoor = new model_geometry_js_1.Batch();
    const depth = r - deck - .10;
    let hatchGlass;
    bin.box(0, van ? 1.04 : .625, (r + deck) * .5, 1.65 * s.w, .045, depth, '#303d41');
    for (const side of [-1, 1])
        bin.box(side * s.w * .845, (h + .62) * .5, (r + deck) * .5, .035, h - .60, depth, '#475356');
    if (van) {
        for (const side of [-1, 1]) {
            const b = side < 0 ? liner : otherDoor, dx = -side * x * .50;
            b.box(dx, .24, 0, x * .985, 1.09, .057, '#43575a');
            b.box(dx, .25, .034, x * .92, .995, .018, '#b6c0ae');
            b.box(dx, .43, .047, x * .80, .44, .014, '#33474c');
            b.box(dx, .43, .056, x * .75, .40, .010, '#526c71');
            b.box(-side * x * .85, .10, .073, .078, .17, .050, '#26323a');
            for (const y of [-.12, .61])
                b.box(-side * .063, y, .023, .12, .06, .079, '#39484d');
        }
    }
    else if (hatch) {
        const window = new model_geometry_js_1.Batch(), slopeZ = s.d + .145 - s.c, slopeY = h - s.roof;
        const top = (0, vehicle_cabin_js_1.roofWidth)(kind) * .98, bottom = s.w * .935;
        const point = (u, t) => [u * (top + (bottom - top) * t), slopeY * t, slopeZ * t];
        const band = (mesh, u0, u1, t0, t1, color) =>
            mesh.quad(point(u0, t0), point(u1, t0), point(u1, t1), point(u0, t1), color, [0, .65, 1]);
        band(lid, -1, 1, 0, .096, '#ffffff');
        band(lid, -1, 1, .865, 1, '#ffffff');
        for (const side of [-1, 1]) {
            band(lid, side * .92, side, .096, .865, '#ffffff');
            band(liner, side * .89, side * .92, .096, .865, '#374247');
        }
        band(window, -.89, .89, .096, .865, '#ffffff');
        hatchGlass = require("./model-car-doors.js").glazedMesh(window, slopeY, 0);
        hatchGlass.name = 'liftgate-glass';
        lid.quad(point(-1, 1), point(1, 1), [s.w * .78, slopeY - .048, r - s.c], [-s.w * .78, slopeY - .048, r - s.c], '#ffffff', [0, 1, .1]);
        liner.box(0, -.008, .043, top * 1.78, .032, .105, '#43494a');
        liner.rod(point(-.53, .78), point(.18, .76), .012, '#354144', true);
    }
    else if (pickup) {
        lid.box(0, .225, 0, s.w * 1.68, .439, .093, '#ffffff');
        liner.box(0, .230, -.053, s.w * 1.59, .386, .021, '#4c5451');
        liner.box(0, .316, .051, .207, .065, .025, '#334040');
        liner.box(0, .322, .067, .119, .023, .019, '#a4aa97');
        for (let i = -5; i <= 5; i++)
            liner.box(i * .138, .194, -.067, .016, .324, .016, '#606b63');
    }
    else if (suv) {
        lid.box(-x * .78, .165, .002, x * 1.64, .375, .074, '#ffffff');
        liner.box(-x * .70, .177, -.05, x * 1.50, .311, .028, '#4c5450');
        liner.rod([-x * 1.47, .261, .048], [-x * 1.25, .261, .048], .026, '#88968f', true);
        for (const [width, depth, z, color] of [[.645, .172, .077, '#263137'], [.489, .032, .173, '#748175'], [.229, .021, .195, '#88968f']]) {
            liner.add(model_geometry_js_1.tube, [-x + .145, .318, z], [width, depth, width], color, [Math.PI / 2, 0, 0]);
        }
    }
    else {
        const len = r - deck;
        lid.quad([-s.w * .88, .004, 0], [s.w * .88, .004, 0], [s.w * .85, -.021, len * .81], [-s.w * .85, -.021, len * .81], '#ffffff', [0, 1, 0]);
        lid.quad([-s.w * .85, -.021, len * .81], [s.w * .85, -.021, len * .81], [s.w * .72, -.06, len], [-s.w * .72, -.06, len], '#ffffff', [0, 1, 0]);
        if (kind === 'sedan') {
            // Folded rear edge follows the boot hinge through its whole travel.
            lid.quad([-s.w * .72, -.06, len], [s.w * .72, -.06, len], [s.w * .72, -.108, len], [-s.w * .72, -.108, len], '#ffffff', [0, 0, 1]);
            liner.box(0, -.036, len * .90, s.w * 1.30, .026, .067, '#92a0a2');
        }
        liner.box(0, -.046, len * .47, s.w * 1.55, .043, len * .87, '#39454b');
        liner.box(0, -.063, len * .86, .18, .034, .080, '#788382');
    }
    const tools = new model_geometry_js_1.Batch(), crate = new model_geometry_js_1.Batch(), device = new model_geometry_js_1.Batch();
    tools.box(0, .083, 0, .54, .154, .285, '#a37444');
    tools.rod([-.11, .205, 0], [.11, .205, 0], .018, '#37474a', true);
    for (const xx of [-.105, .105])
        tools.rod([xx, .159, 0], [xx, .205, 0], .018, '#37474a', true);
    const H = van ? .71 : pickup ? .55 : .25, D = van || pickup ? .68 : Math.min(.42, depth * .7);
    crate.box(0, H * .50, 0, van || pickup ? .84 : .68, H, D, '#9f805d');
    for (const px of [-.24, .24]) {
        crate.box(px, H + .006, 0, .046, .02, D + .012, '#495c58');
        crate.box(px, H * .5, D * .5, .046, H, .018, '#495c58');
    }
    device.box(0, .102, 0, .50, .203, .27, '#4a7373');
    device.box(.05, .12, .14, .22, .075, .014, '#e2af63');
    const blades = new model_geometry_js_1.Batch();
    blades.rod([0, 0, 0], [.24, .053, 0], .009, '#313d40');
    blades.rod([.08, .054, 0], [.43, .054, 0], .012, '#242e35', true);
    const binM = bin.mesh(), lidM = lid.mesh(), linerM = liner.mesh(), otherM = otherDoor.mesh(), cargo = [tools.mesh(), crate.mesh(), device.mesh()], wiper = blades.mesh();
    return (paint) => {
        const root = new T.Group(), left = new T.Group(), right = new T.Group(), cargoRoot = new T.Group();
        left.name = van ? 'rear-left-door' : pickup ? 'tailgate' : 'boot-lid';
        right.name = 'rear-right-door';
        const skin = lidM.clone();
        skin.material = paint;
        left.add(skin, linerM.clone());
        if (hatchGlass)
            left.add(hatchGlass.clone());
        if (van)
            right.add(otherM.clone());
        left.position.set(van ? -x : suv ? x : 0, van ? h + .27 : pickup ? .746 : suv ? h - .185 : h, van || pickup ? r : suv ? r - .08 : deck);
        if (hatch)
            left.position.set(0, s.roof, s.c);
        right.position.set(x, h + .27, r);
        const items = cargo.map(c => c.clone());
        cargoRoot.add(...items);
        cargoRoot.position.set(0, van ? 1.075 : pickup ? .78 : .657, van ? r - .50 : (deck + r) * .5);
        root.add(binM.clone(), left, right, cargoRoot);
        const wipers = [-.53, .13].map(px => { const pivot = new T.Group(); pivot.name = 'windscreen-wiper'; pivot.position.set(px, s.belt + .021, s.a - .024); pivot.rotation.x = Math.atan2(s.b - s.a, s.roof - s.belt); pivot.add(wiper.clone()); root.add(pivot); return pivot; });
        let opening = 0;
        return { root, update(dt, time, e) {
                opening += ((e?.boot ? 1 : 0) - opening) * (1 - Math.exp(-dt * 8));
                if (van) {
                    left.rotation.y = -opening * 1.66;
                    right.rotation.y = opening * 1.66;
                }
                else if (suv)
                    left.rotation.y = opening * 1.25;
                else
                    left.rotation.x = (pickup ? 1.57 : -1.22) * opening;
                items.forEach((m, i) => m.visible = e?.cargo === (i === 0 ? 'tools' : i === 1 ? 'crate' : 'calibrator'));
                for (const m of wipers)
                    m.rotation.z = e?.wipers ? .02 + (1 - Math.cos(time * 5.6)) * .54 : .02;
            } };
    };
}
