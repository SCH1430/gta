"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVehicle = createVehicle;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_assemblies_js_1 = require("./vehicle-assemblies.js");
const model_car_doors_js_1 = require("./model-car-doors.js");
const model_cockpit_js_1 = require("./model-cockpit.js");
const model_car_motion_js_1 = require("./model-car-motion.js");
const model_service_body_js_1 = require("./model-service-body.js");
const model_vehicle_wear_js_1 = require("./model-vehicle-wear.js");
const winter_light_js_1 = require("./winter-light.js");
const model_fleet_body_js_1 = require("./model-fleet-body.js");
const { addSeat, seatMaterial, beltTemplates, dashboard, partition } = require("./model-car-interior.js");
const { splitFrontShell, buildHood } = require("./model-car-hood.js");
const { buildCarExterior } = require("./model-car-exterior.js");
const { buildWheel } = require("./model-car-wheel.js");
;
const dark = '#19222b', rubber = '#23272c', edge = '#424952', trim = '#839496', silver = '#b1c1bc', amber = '#ffa849';
function pressedBody(kind, s, cab, coat, trimBatch, distant, hood) {
    const { w, front, rear, belt, r, fw, rw } = s;
    const hatch = kind === 'hatch', van = kind === 'van', coupe = kind === 'coupe';
    const frontHeight = belt - (hatch ? .17 : coupe ? .10 : .12), deck = (0, vehicle_cabin_js_1.rearDeckStart)(kind);
    const nose = hatch ? .83 : coupe ? .69 : van ? .90 : kind === 'wagon' ? .81 : .74;
    const tail = van ? .94 : hatch || kind === 'wagon' ? .91 : .79;
    const frontBreak = Math.min(front + (hatch || van ? .16 : coupe ? .34 : .30), fw - .02);
    const stations = [[front, w * nose, frontHeight], [frontBreak, w * .966, frontHeight + .040],
        [cab.hingeZ, w, belt], [Math.min(s.d, rear - .30), w, belt], [rear - .26, w * .977, belt - .012], [rear, w * tail, belt - .067]];
    const archRadius = r + (van ? .078 : .055), lower = .33;
    const cuts = new Set(stations.map(row => row[0]));
    if (!distant) {
        cuts.add(cab.hingeZ + cab.doorLength);
        cuts.add(deck);
    }
    const subdivisions = distant ? 4 : 10;
    for (const axle of [fw, rw])
        for (let i = 0; i <= subdivisions; i++)
            cuts.add(axle + archRadius * Math.cos(Math.PI * i / subdivisions));
    const positions = [...cuts].filter(z => z >= front && z <= rear).sort((a, b) => a - b);
    const sections = positions.map(z => {
        let j = 0;
        while (j + 2 < stations.length && z > stations[j + 1][0]) j++;
        const p = stations[j], q = stations[j + 1], t = (z - p[0]) / (q[0] - p[0]);
        const width = p[1] + t * (q[1] - p[1]), top = p[2] + t * (q[2] - p[2]);
        const offset = Math.min(Math.abs(z - fw), Math.abs(z - rw));
        const bottom = offset <= archRadius + .00001 ? r + Math.sqrt(Math.max(0, archRadius ** 2 - offset ** 2)) : lower;
        return { z, width, top, bottom };
    });
    const crown = coupe ? .049 : hatch ? .022 : van ? .016 : .035;
    function skin(row, side) {
        const { z, width, top, bottom } = row;
        const overWheel = T.MathUtils.clamp((bottom - lower) / .33, 0, 1);
        const rake = Math.max(0, 1 - (z - front) / .28) * .082 - Math.max(0, 1 - (rear - z) / .30) * .100;
        return [[side * width * (.905 + .077 * overWheel), bottom, z + rake], [side * width, Math.max(bottom + .018, top - .143), z + rake * .24],
            [side * width * .951, top - .043, z], [side * width * .785, top + .009, z], [0, top + crown, z]];
    }
    for (let i = 1; i < sections.length; i++) {
        const a = sections[i - 1], b = sections[i], z = (a.z + b.z) * .5;
        if (b.z - a.z < .00001) continue;
        const frontPanel = z < cab.hingeZ, openDoor = !distant && !frontPanel && z < cab.hingeZ + cab.doorLength;
        const isArch = Math.min(Math.abs(z - fw), Math.abs(z - rw)) < archRadius;
        for (const side of [-1, 1]) {
            const u = skin(a, side), v = skin(b, side);
            if (distant) {
                coat.quad(u[0], v[0], v[2], u[2], '#edf0ef', [side, 0, 0]);
                continue;
            }
            if (!openDoor) {
                for (let k = 0; k < 3; k++) {
                    const tint = k === 0 ? '#d8dee0' : k === 1 ? '#f3f4f2' : '#ffffff';
                    coat.quad(u[k], v[k], v[k + 1], u[k + 1], tint, [side, k === 2 ? .7 : .03, 0]);
                }
                if (isArch) {
                    const inner = p => [p[0] - side * .145, p[1] + .003, p[2]];
                    trimBatch.quad(u[0], v[0], inner(v[0]), inner(u[0]), '#353a3d', [side * .1, -1, 0]);
                }
            }
            if (frontPanel && hood) {
                const edgeA = [u[3][0] - side * .010, u[3][1] + .001, u[3][2]];
                const edgeB = [v[3][0] - side * .010, v[3][1] + .001, v[3][2]];
                hood.quad(edgeA, edgeB, v[4], u[4], '#ffffff', [0, 1, 0]);
                const inset = p => [p[0], p[1] - .010, p[2]];
                trimBatch.quad(inset(u[3]), inset(v[3]), inset(edgeB), inset(edgeA), '#3a4143', [0, 1, 0]);
            }
            else if (frontPanel || (van && z > deck))
                coat.quad(u[3], v[3], v[4], u[4], '#ffffff', [0, 1, 0]);
        }
    }
    if (distant) {
        const crownRows = stations.map(([z, width, top]) => ({ z, width, top, bottom: lower }));
        for (let j = 1; j < crownRows.length; j++)
            for (const side of [-1, 1]) {
                const a = skin(crownRows[j - 1], side), b = skin(crownRows[j], side);
                coat.quad(a[2], b[2], b[4], a[4], '#ffffff', [side * .1, 1, 0]);
            }
    }
    for (const [row, facing] of [[sections[0], -1], [sections[sections.length - 1], 1]]) {
        const left = skin(row, -1), right = skin(row, 1);
        for (let k = 0; k < 3; k++)
            coat.quad(left[k], right[k], right[k + 1], left[k + 1], k ? '#f1f3f1' : '#d8dee0', [0, 0, facing]);
        coat.tri(left[3], right[3], left[4], '#ffffff', [0, 0, facing]);
    }
}
function pressedRoof(batch, s, roofW, distant = false) {
    const { b, c, roof } = s, rows = [[b - .030, .963, -.025], [b + .105, 1.018, .013], [c - .11, 1.016, .015], [c + .035, .963, -.022]];
    for (const side of [-1, 1]) {
        const section = ([z, width, dy]) => [[side * roofW * width, roof + dy - .029, z], [side * roofW * width * .95, roof + dy + .003, z],
            [side * roofW * width * .69, roof + dy + .025, z], [0, roof + dy + .035, z]];
        for (let i = 1; i < rows.length; i++) {
            const a = section(rows[i - 1]), b = section(rows[i]);
            const facets = distant ? [0, 2, 3] : [0, 1, 2, 3];
            for (let j = 1; j < facets.length; j++) {
                const k = facets[j - 1], next = facets[j];
                batch.quad(a[k], b[k], b[next], a[next], k === 0 ? '#e2e5e3' : '#ffffff', [side * (2 - k) * .20, 1, 0]);
            }
        }
    }
}
function screenFrame(kind, s, roofW, batch) {
    const baseW = s.w * .94, hatch = kind === 'hatch', slab = kind === 'van';
    for (const side of [-1, 1]) {
        for (const rear of [false, true]) {
            const foot = rear ? s.d : s.a, head = rear ? s.c : s.b, dir = rear ? 1 : -1;
            const jamb = rear ? (hatch ? .32 : slab ? .088 : .255) : .096;
            const post = rear ? (hatch ? .146 : slab ? .066 : .123) : .069;
            // The quarter panel turns the corner from the side window onto
            // the screen. Its folded edge meets the roof skin and the scuttle.
            const corner = rear && hatch ? .145 : .017;
            const low = [[side * (baseW + .012), s.belt + .005, foot - dir * jamb],
                [side * (baseW + .016), s.belt + .008, foot + dir * corner],
                [side * (baseW - (rear ? .098 : .064)), s.belt + .010, foot + dir * (corner + .006)]];
            const high = [[side * (roofW + .011), s.roof - .005, head - dir * post],
                [side * roofW, s.roof - .001, head + dir * .021],
                [side * (roofW - (rear ? .077 : .047)), s.roof, head + dir * .026]];
            batch.quad(low[0], low[1], high[1], high[0], '#f5f6f4', [side, .2, 0]);
            batch.quad(low[1], low[2], high[2], high[1], '#ffffff', [side * .26, .25, dir]);
        }
    }
}
function wrapBumper(batch, s, end, height, chrome, distant = false) {
    const z = end < 0 ? s.front : s.rear, y = end < 0 ? .46 : .495;
    for (const side of [-1, 1]) {
        const points = distant ? [[0, .062], [.77, .048], [.96, -.22]] : [[0, .062], [.70, .057], [.878, .018], [.95, -.120], [.970, -.34]];
        for (let i = 1; i < points.length; i++) {
            const at = ([width, offset], dy) => [side * width * s.w, y + dy, z + end * offset];
            const a = points[i - 1], b = points[i];
            const corner = (i - 1) / (points.length - 2);
            const normal = [side * corner, 0, end * (1 - corner)];
            batch.quad(at(a, -height * .5), at(b, -height * .5), at(b, height * .5), at(a, height * .5), '#384147', normal);
            const hi = at(a, height * .5), hj = at(b, height * .5);
            batch.quad(hi, hj, [hj[0] * .936, hj[1] + .018, hj[2] - end * .131], [hi[0] * .936, hi[1] + .018, hi[2] - end * .131], chrome ? '#91a09d' : '#596367', [0, 1, 0]);
        }
    }
}
function streetLamps(kind, s, trimBatch, lamps, tails, frontHeight) {
    const van = kind === 'van', hatch = kind === 'hatch', w = s.w;
    for (const side of [-1, 1]) {
        const front = (x, y, setback = 0) => [side * w * x, frontHeight + y, s.front - .046 + setback];
        const lens = lamps[side < 0 ? 0 : 1], outward = [0, 0, -1];
        trimBatch.quad(front(.39, -.195), front(.86, -.17), front(.90, -.025), front(.41, -.004), '#29353b', outward);
        trimBatch.quad(front(.90, -.025), front(.86, -.17), front(.912, -.152, .118), front(.927, -.041, .145), '#63716f', [side, 0, -.3]);
        trimBatch.quad(front(.41, -.004), front(.90, -.025), front(.927, -.041, .145), front(.415, .003, .063), '#838e89', [0, 1, 0]);
        if (hatch || van) {
            const pane = (x, y) => front(x, y, -.009);
            trimBatch.quad(pane(.433, -.166), pane(.783, -.148), pane(.806, -.042), pane(.449, -.030), '#bcc8c2', outward);
            lens.quad(front(.45, -.138, -.016), front(.77, -.126, -.016), front(.787, -.055, -.016), front(.458, -.044, -.016), '#fff2ce', outward);
            trimBatch.quad(pane(.802, -.151), pane(.845, -.146), pane(.865, -.042), pane(.821, -.043), amber, outward);
        }
        else {
            for (const center of [.535, .747])
                for (let j = 0; j < 10; j++) {
                    const circle = (a, radius, z) => front(center + Math.cos(a) * radius / w, -.103 + Math.sin(a) * radius, z);
                    const a = j * Math.PI / 5, b = (j + 1) * Math.PI / 5;
                    trimBatch.tri(circle(a, 0, -.008), circle(a, .079, -.008), circle(b, .079, -.008), '#aabbb8', outward);
                    lens.tri(circle(a, 0, -.014), circle(a, .061, -.014), circle(b, .061, -.014), '#fff3cb', outward);
                }
        }
        (0, model_service_body_js_1.rearCluster)(kind, s, side, trimBatch, tails);
    }
}
function trafficWheel(batch, s, side, z, alloy) {
    const point = (width, r, a) => [side * (s.w - .073 + width), s.r + s.r * r * Math.sin(a), z + s.r * r * Math.cos(a)];
    for (let j = 0; j < 8; j++) {
        const a = j * Math.PI / 4, b = (j + 1) * Math.PI / 4;
        batch.quad(point(-.094, 1, a), point(-.094, 1, b), point(.098, 1, b), point(.098, 1, a), rubber, [0, Math.sin((a + b) / 2), Math.cos((a + b) / 2)]);
        batch.quad(point(.098, 1, a), point(.098, 1, b), point(.123, .65, b), point(.123, .65, a), '#2b2e30', [side, 0, 0]);
        batch.tri(point(.154, 0, a), point(.124, .65, a), point(.124, .65, b), alloy ? '#a1aba9' : '#79817f', [side, 0, 0]);
    }
}
function vanCargoDetail(trim, paint, spec, far) {
    const { w } = spec;
    const slideStart = -.07, slideEnd = 1.21, slideTop = 2.063, slideFoot = 1.142;
    const right = (w * .991 + .007);
    const run = (x, y, z, length, height, depth, color) => trim.box(x, y, z, depth, height, length, color);
    const edge = '#36454a', rail = '#707d7b';
    for (const side of [-1, 1]) {
        const x = side * (right + .018);
        for (const z of [slideStart, slideEnd])
            run(x, (slideTop + slideFoot) / 2, z, .020, slideTop - slideFoot, .012, edge);
        for (const y of [slideFoot, slideTop])
            run(x, y, (slideStart + slideEnd) / 2, slideEnd - slideStart, .020, .012, edge);
    }
    run(right + .029, 1.291, 1.115, 1.62, .055, .040, edge);
    run(right + .051, 1.308, 1.113, 1.58, .010, .011, rail);
    run(right + .058, 1.292, .530, .150, .033, .033, '#a1aba1');
    run(right + .049, 1.652, .965, .141, .055, .034, edge);
    run(right + .069, 1.659, .972, .109, .014, .012, '#a7b2a8');
    trim.box(w + .029, .389, .26, .229, .086, 1.00, '#28343b');
    trim.box(w + .083, .434, .26, .152, .026, .98, '#758280');
    far.box(w + .040, .409, .26, .220, .093, 1.02, '#3d4d52');
    far.box(right + .021, 1.3, 1.11, .033, .057, 1.62, edge);
    for (const side of [-1, 1]) {
        const x = side * (right + .022);
        for (const [z0, z1] of [[.012, 1.174], [1.31, 2.18]]) {
            const y0 = 1.567, y1 = 1.997, bevel = .043, gap = .027;
            const point = (dx, y, z) => [x + side * dx, y, z];
            const p = [point(0, y0, z0 + bevel), point(0, y0, z1 - bevel), point(0, y0 + bevel, z1),
                point(0, y1 - bevel, z1), point(0, y1, z1 - bevel), point(0, y1, z0 + bevel),
                point(0, y1 - bevel, z0), point(0, y0 + bevel, z0)];
            const midY = (y0 + y1) / 2, midZ = (z0 + z1) / 2;
            const inner = p.map(([, y, z]) => point(.022, y + Math.sign(midY - y) * gap, z + Math.sign(midZ - z) * gap));
            for (let i = 0; i < p.length; i++) {
                const j = (i + 1) % p.length;
                paint.quad(p[i], p[j], inner[j], inner[i], i < 4 ? '#aab2a9' : '#d9ded3', [side, 0, 0]);
            }
            for (let i = 1; i < inner.length - 1; i++)
                paint.tri(inner[0], inner[i], inner[i + 1], '#dce1d7', [side, 0, 0]);
            far.box(side * (right + .020), midY, midZ, .017, y1 - y0, z1 - z0, '#879894');
        }
    }
    for (let i = 0; i < 7; i++)
        trim.box(w + .085, .45, -.125 + i * .127, .111, .007, .031, '#414d51');
}
function buildBody(kind, series) {
    const s = vehicle_cabin_js_1.specs[kind], van = kind === 'van', hatch = kind === 'hatch', patrol = kind === 'patrol';
    const paint = new model_geometry_js_1.Batch(), body = new model_geometry_js_1.Batch(), windows = new model_geometry_js_1.Batch(), lamps = [new model_geometry_js_1.Batch(), new model_geometry_js_1.Batch()], tails = new model_geometry_js_1.Batch(), scrapes = new model_geometry_js_1.Batch(), frontGlass = new model_geometry_js_1.Batch(), lowTrim = new model_geometry_js_1.Batch();
    const hoodSkin = new model_geometry_js_1.Batch(), hoodTrim = new model_geometry_js_1.Batch(), seats = new model_geometry_js_1.Batch();
    const { w, front: f, rear: r, belt: h, roof: H, a, b, c, d } = s, topW = (0, vehicle_cabin_js_1.roofWidth)(kind), sideW = w * .94;
    const frontH = h - (hatch ? .17 : kind === 'coupe' ? .10 : .12);
    const custom = (0, model_fleet_body_js_1.tailoredBody)(kind), service = (0, model_service_body_js_1.serviceBody)(kind), flat = kind === 'pickup' || kind === 'towtruck' || kind === 'utility';
    const cabin = (0, vehicle_cabin_js_1.carCabin)(kind), endZ = cabin.hingeZ + cabin.doorLength;
    const deckZ = (0, vehicle_cabin_js_1.rearDeckStart)(kind);
    const pressed = !flat && kind !== 'suv';
    if (pressed)
        pressedBody(kind, s, cabin, paint, body, false, hoodSkin);
    else
        splitFrontShell(paint, hoodSkin, [[f, w * .78, .40, frontH - .08, frontH], [f + .14, w * .95, .34, frontH - .032, frontH + .014],
            [Math.min(s.fw, cabin.hingeZ - .12), w, .34, h - .04, h], [cabin.hingeZ, w, .34, h - .04, h]]);
    if (flat) {
        const top = kind === 'towtruck' ? .515 : kind === 'utility' ? .596 : .766;
        (0, model_geometry_js_1.shell)(paint, [[deckZ, w, .405, top - .022, top], [s.rw + .08, w, .396, top - .025, top], [r - .09, w * .95, .41, top - .026, top - .012]], '#ffffff', 'rear');
    }
    else if (!pressed) {
        const rearWidth = kind === 'wagon' ? .95 : kind === 'suv' ? .91 : kind === 'coupe' ? .89 : .82;
        (0, model_geometry_js_1.shell)(paint, [[deckZ, w, .34, h - .045, h - .006], [Math.max(deckZ + .02, s.rw + .08), w, .34, h - .025, h + .013], [r - .12, w * .96, .36, h - .07, h - .03], [r, w * rearWidth, .43, h - .10, h - .06]], '#ffffff', van ? undefined : 'top');
    }
    body.box(0, .33, 0, w * 1.62, .17, (r - f) * .88, dark);
    if (pressed) {
        const back = cabin.hingeZ - .03;
        body.quad([-w * .89, .41, back], [w * .89, .41, back], [sideW, h - .012, back], [-sideW, h - .012, back], '#394245', [0, 0, 1]);
    }
    body.box(0, cabin.sillY - .025, (cabin.hingeZ + deckZ) / 2, w * 1.85, .080, deckZ - cabin.hingeZ, '#343e44');
    for (const side of [-1, 1]) {
        const fixedX = side * w;
        body.box(side * (w - .05), cabin.sillY, (cabin.hingeZ + deckZ) * .5, .11, .089, deckZ - cabin.hingeZ, '#41494c');
        body.box(side * (w - .01), cabin.sillY + .042, (cabin.hingeZ + endZ) * .5, .10, .018, cabin.doorLength, '#91a3a0');
        if (!pressed && deckZ > endZ) {
            paint.quad([fixedX, cabin.sillY, endZ], [fixedX, cabin.sillY, deckZ], [fixedX, h - .04, deckZ], [fixedX, h - .04, endZ], '#ffffff', [side, 0, 0]);
            paint.quad([fixedX, h - .04, endZ], [fixedX, h - .04, deckZ], [side * sideW, h, deckZ], [side * sideW, h, endZ], '#ffffff', [side, .4, 0]);
        }
    }
    const fl = [-sideW, h, a], fr = [sideW, h, a], tl = [-topW, H, b], tr = [topW, H, b];
    windows.quad(fl, fr, tr, tl, '#ffffff', [0, .4, -1]);
    if (!hatch)
        windows.quad([-sideW, h, d], [sideW, h, d], [topW, H, c], [-topW, H, c], '#ffffff', [0, .3, 1]);
    if (pressed) {
        pressedRoof(paint, s, topW);
        screenFrame(kind, s, topW, paint);
    }
    else
        (0, model_geometry_js_1.shell)(paint, [[b - .035, topW * .99, H - .043, H - .008, H + .008], [b + .085, topW * 1.034, H - .035, H + .025, H + .041], [c - .075, topW * 1.038, H - .035, H + .027, H + .043], [c + .045, topW * .99, H - .044, H - .007, H + .005]], '#ffffff');
    for (const side of [-1, 1]) {
        const lo = side * sideW, hi = side * topW;
        const pillar = (0, vehicle_cabin_js_1.doorRoofEdge)(kind, endZ - .024);
        if (d - endZ > .08) {
            const outer = [lo, h + .025, d - .023], upper = [side * pillar.x, pillar.y - .025, endZ - .016];
            if (endZ >= c)
                windows.tri([lo, h + .025, endZ + .035], outer, upper, '#ffffff', [side, .1, 0]);
            else
                windows.quad([lo, h + .025, endZ + .035], outer, [hi, H - .025, c - .02], upper, '#ffffff', [side, .1, 0]);
        }
        if (!pressed) {
            body.rod([lo, h, a], [hi, H, b], .042, dark, true);
            body.rod([lo, h, d], [hi, H, c], .048, dark, true);
            paint.rod([lo, h + .025, a], [hi, H + .005, b], .024, '#ffffff', true);
            paint.rod([lo, h + .028, d], [hi, H, c], .061, '#ffffff', true);
        }
        body.rod([lo, cabin.sillY + .04, endZ + .017], [lo, h + .023, endZ + .017], .026, dark, true);
        body.rod([lo, h + .025, endZ + .017], [side * pillar.x, pillar.y - .01, endZ - .024], pressed ? .023 : .036, '#35424a', true);
        if (!van && d > endZ + .12) {
            body.rod([lo, h + .018, endZ + .03], [lo, h + .018, d], .020, trim, true);
            body.box(side * (w + .014), h - .10, d - .29, .028, .040, .154, dark);
            body.box(side * (w + .009), h - .248, (deckZ + endZ) * .5, .014, patrol ? .180 : .033, deckZ - endZ, patrol ? '#304958' : dark);
        }
        const sillLength = s.rw - s.fw - 2 * (s.r + .080), sillCentre = (s.rw + s.fw) * .5;
        body.box(side * (w - .026), .374, sillCentre, .053, .075, sillLength, dark);
        body.box(side * (w + .002), .407, sillCentre, .015, .014, sillLength, edge);
        if (!pressed) for (const z of [s.fw, s.rw]) {
            const radius = s.r + ((0, vehicle_cabin_js_1.highCab)(kind) ? .090 : .058);
            for (let i = 0; i < 9; i++) {
                const u = (i / 9) * Math.PI, v = (i + 1) / 9 * Math.PI, x = side * (w + .018);
                const point = (an, rr) => [x, s.r + Math.sin(an) * rr, z + Math.cos(an) * rr];
                body.quad(point(u, radius - .050), point(v, radius - .050), point(v, radius + .018), point(u, radius + .018), dark, [side, 0, 0]);
            }
        }
        addSeat(seats, kind, side, cabin.seatZ, cabin.seatY, series);
        if (!van && !flat && kind !== 'coupe')
            addSeat(seats, kind, side, .72, kind === 'suv' ? .89 : .66, series);
        if (van)
            body.box(side * (w - .117), .43, cabin.seatZ, .175, .067, .61, '#363f46');
    }
    body.box(0, cabin.seatY - .022, cabin.seatZ - .012, .18, .25, .52, '#384248');
    body.rod([-cabin.seatX, h + .135, a + .46], [-cabin.seatX, h + .03, a + .31], .033, edge);
    for (const side of [-1, 1])
        body.rod([side * .41, h + .041, a + .044], [side * .41 - .24, h + .026, a + .026], .009, dark);
    const bumpers = [-1, 1].map(end => {
        const bright = kind === 'sedan' || kind === 'taxi' || patrol;
        const height = van || kind === 'suv' ? .205 : .158, bumper = new model_geometry_js_1.Batch();
        wrapBumper(bumper, s, end, height, bright);
        wrapBumper(lowTrim, s, end, height, bright, true);
        return bumper.mesh();
    });
    body.box(0, frontH - .13, f - .016, w * (hatch && series ? 1.08 : 1.22), .15, .042, '#202b30');
    const vanes = hatch && series ? 6 : 3;
    for (let i = 0; i < vanes; i++)
        body.box(0, frontH - .174 + i * (vanes === 3 ? .041 : .019), f - .04, w * (hatch ? series ? 1.02 : .74 : .81),
            vanes === 3 ? .010 : .008, .018, hatch && !series ? '#a6aca4' : edge);
    if (hatch) {
        lowTrim.box(0, frontH - .118, f - .039, w * (series ? 1.04 : .81), .105, .025, series ? '#29373d' : '#8a9794');
        for (const b of [body, lowTrim])
            b.box(0, frontH - .123, f - .061, series ? .102 : .055, .047, .010, '#c4b18a');
        for (const side of [-1, 1])
            lowTrim.box(side * (w + (series ? .132 : .106)), h + (series ? .14 : .104), cabin.hingeZ + .156, series ? .20 : .15,
                series ? .117 : .106, series ? .209 : .127, series ? '#566569' : '#283a41');
    }
    if (!custom && !service)
        streetLamps(kind, s, body, lamps, tails, frontH);
    for (const end of [-1, 1]) {
        const z = end < 0 ? f - .061 : r + .066, y = end < 0 ? .557 : .66;
        body.box(0, y, z, .471, .121, .014, '#191f25');
        body.box(0, y, z + end * .009, .444, .095, .010, '#bdc7b6');
        (0, model_geometry_js_1.stencil)(body, s.number, [0, y, z + end * .016], .014, '#1b2a33', end);
    }
    let serviceBeacon;
    if (custom) {
        const kit = { paint, body, lamps, tails };
        (0, model_fleet_body_js_1.dressFleet)(kind, kit);
        (0, model_fleet_body_js_1.fleetSignals)(kind, kit);
    }
    else if (service)
        serviceBeacon = (0, model_service_body_js_1.addServiceBody)(kind, paint, body, lamps, tails, lowTrim);
    else if (van) {
        const vh = H + .08, start = -.242, stop = r - .03;
        (0, model_geometry_js_1.shell)(paint, [[start, w * .92, h - .1, vh - .10, vh - .025], [start + .13, w * .99, h - .1, vh - .08, vh + .015], [stop - .11, w * .98, h - .1, vh - .08, vh + .012], [stop, w * .932, h - .10, vh - .11, vh - .02]], '#ffffff', 'rear');
        for (const side of [-1, 1]) {
            const X = side * (w * .991 + .007);
            body.box(X, 1.72, 1.08, .012, .712, 2.31, '#a4aea0');
            body.box(X + side * .015, 1.488, 1.07, .014, .044, 2.27, '#d19c6d');
        }
        vanCargoDetail(body, paint, s, lowTrim);
        for (const side of [-1, 1]) {
            body.box(side * w * .93, 1.61, r - .025, .063, 1.10, .08, '#83978a');
        }
        body.box(0, vh + .079, 1.30, .95, .143, 1.03, '#91a39d');
        for (let i = 0; i < 7; i++)
            body.box(0, vh + .156, .98 + i * .097, .72, .014, .038, edge);
    }
    else if (hatch) {
        for (const side of [-1, 1]) {
            body.rod([side * w * .72, H + .040, b + .09], [side * w * .72, H + .059, c - .12], .021, dark, true);
        }
        for (let i = 0; i < 4; i++)
            hoodTrim.box(w * .50, h - .005 - i * .012, -1.14 - i * .06, .25, .013, .024, dark);
    }
    else {
        for (const side of [-1, 1])
            hoodTrim.rod([side * .575, frontH + .044, f + .41], [side * .512, h + .025, a - .03], .009, '#485862', true);
        hoodTrim.rod([0, frontH + .043, f + .22], [0, h + .035, a - .09], .012, trim, true);
        if (kind !== 'sedan')
            body.box(0, h + .048, 1.84, w * 1.26, .026, .085, edge);
        frontGlass.box(0, h - .073, r + .041, w * .72, .034, .016, '#985259');
        if (patrol) {
            body.box(0, H + .091, .085, 1.15, .10, .285, dark);
            body.box(0, H + .152, .085, 1.05, .044, .256, trim);
            body.rod([w * .65, h + .01, 1.93], [w * .68, 1.98, 2.14], .014, dark);
        }
    }
    const hit = [-.32, h + (H - h) * .42, a + (b - a) * .42 - .019];
    for (const [x, t] of [[-.46, .74], [-.13, .51], [-.25, .16], [-.52, .22]])
        scrapes.rod(hit, [x, h + (H - h) * t, a + (b - a) * t - .022], .006, '#c9d9d0');
    const farPaint = new model_geometry_js_1.Batch();
    const deckHeight = kind === 'towtruck' ? .69 : kind === 'utility' ? .59 : h;
    const afterCab = flat ? [[deckZ, w, .35, deckHeight - .06, deckHeight]] : [];
    if (pressed)
        pressedBody(kind, s, cabin, farPaint, lowTrim, true);
    else
        (0, model_geometry_js_1.shell)(farPaint, [[f, w * .78, .36, frontH - .03, frontH], [s.fw, w, .33, h - .05, h], ...afterCab, [s.rw, w, .33, deckHeight - .04, deckHeight], [r, w * .88, .39, deckHeight - .09, deckHeight - .056]], '#ffffff');
    if (van) {
        (0, model_geometry_js_1.shell)(farPaint, [[-.24, w * .96, h - .03, H - .05, H + .06], [r - .04, w * .96, h - .05, H - .05, H + .06]], '#ffffff');
        for (const side of [-1, 1]) {
            const doorX = side * w * .46;
            lowTrim.box(doorX, h + .52, r - .014, w * .86, .98, .062, '#b6c0ae');
            lowTrim.box(doorX, h + .70, r + .023, w * .69, .40, .025, '#425e66');
            lowTrim.box(side * (w + .23), h + .26, cabin.hingeZ + .18, .20, .32, .19, '#52666b');
            lowTrim.rod([side * sideW, h + .03, cabin.hingeZ + .12], [side * (w + .23), h + .23, cabin.hingeZ + .18], .032, dark);
        }
    }
    if (kind === 'pickup') {
        for (const side of [-1, 1]) {
            lowTrim.box(side * w * .225, h + .552, .74, .087, .086, .54, '#32403d');
            farPaint.box(side * w * .843, h - .056, (.56 + r) * .50, .245, .155, r - .56, '#ffffff');
        }
        lowTrim.box(0, h + .525, .67, 1.65, .078, .077, '#31433e');
    }
    if (kind === 'suv') {
        for (const side of [-1, 1])
            lowTrim.box(side * w * .76, H + .091, .39, .084, .12, 1.99, '#2c3535');
        lowTrim.add(model_geometry_js_1.tube, [.145, h + .129, r + .004], [.619, .195, .619], '#303b38', [Math.PI / 2, 0, 0]);
    }
    if (kind === 'coupe') {
        lowTrim.box(0, .904, r - .21, 1.51, .062, .132, '#383837');
        lowTrim.box(0, .713, r + .075, 1.414, .031, .030, '#b04e3d');
    }
    const backScreen = hatch ? d + .145 : d, glassW = w * .925;
    lowTrim.quad([-glassW, h, a], [glassW, h, a], [topW, H, b], [-topW, H, b], '#586d76', [0, .4, -1]);
    lowTrim.quad([-glassW, h, backScreen], [glassW, h, backScreen], [topW, H, c], [-topW, H, c], '#536770', [0, .4, 1]);
    for (const side of [-1, 1])
        lowTrim.quad([side * glassW, h, a], [side * glassW, h, backScreen], [side * topW, H, c], [side * topW, H, b], '#465b64', [side, .2, 0]);
    if (pressed) {
        pressedRoof(farPaint, s, topW, true);
        screenFrame(kind, s, topW, farPaint);
        for (const side of [-1, 1]) {
            const pillar = (z, x, y) => [side * x, y, z];
            const mid = (0, vehicle_cabin_js_1.doorRoofEdge)(kind, endZ);
            lowTrim.quad(pillar(endZ - .032, w * .945, h + .018), pillar(endZ + .045, w * .945, h + .018), pillar(endZ + .015, mid.x * 1.01, mid.y - .016), pillar(endZ - .062, mid.x * 1.01, mid.y - .016), '#35434b', [side, .1, 0]);
        }
    }
    else
        (0, model_geometry_js_1.shell)(farPaint, [[b - .025, topW, H - .037, H, H + .012], [b + .075, topW * 1.03, H - .030, H + .021, H + .041], [c - .07, topW * 1.03, H - .030, H + .021, H + .041], [c + .025, topW, H - .037, H, H + .012]], '#ffffff');
    for (const side of [-1, 1])
        for (const axle of [s.fw, s.rw])
            trafficWheel(lowTrim, s, side, axle, kind === 'sedan' || kind === 'coupe');
    for (const lens of lamps) {
        // A single recessed reflector keeps each vehicle's lamp spacing at distance.
        const bounds = new T.Box3().setFromArray(lens.pos);
        if (!bounds.isEmpty()) {
            const y = (bounds.min.y + bounds.max.y) * .5;
            lowTrim.box((bounds.min.x + bounds.max.x) * .5, y, bounds.min.z + .025, bounds.max.x - bounds.min.x + .035, Math.max(.09, bounds.max.y - bounds.min.y + .025), .035, '#9caaa4');
        }
    }
    const panel = paint.mesh();
    const exterior = buildCarExterior(kind, s, topW, panel, lamps);
    return { industrial: (0, model_service_body_js_1.buildServiceGear)(kind), serviceBeacon, bumpers, exterior,
        hood: buildHood(kind, s, cabin, hoodSkin, hoodTrim), dash: dashboard(kind, series), belts: beltTemplates(kind), partition: partition(kind), seats: seats.mesh(seatMaterial(kind)),
        doors: [(0, model_car_doors_js_1.buildDoor)(kind, -1, series), (0, model_car_doors_js_1.buildDoor)(kind, 1, series)], cockpit: (0, model_cockpit_js_1.buildSteering)(kind), paint: panel, body: body.mesh(), windows: (0, model_car_doors_js_1.glazedMesh)(windows, h, H), equipment: (0, vehicle_assemblies_js_1.rearEquipment)(kind), lamps: lamps.map(b => b.mesh(model_geometry_js_1.lit)), tails: tails.mesh(model_geometry_js_1.lit), scrapes: scrapes.mesh(), trim: frontGlass.mesh(), farPaint: farPaint.mesh(), lowTrim: lowTrim.mesh(), wheels: [buildWheel(s.r, -1, kind), buildWheel(s.r, 1, kind)] };
}
const types = new Map();
const damagedLensTemplates = new WeakMap();
function crackedLens(light) {
    const geometry = light.geometry, previous = damagedLensTemplates.get(geometry);
    if (previous)
        return previous.clone();
    if (!geometry.boundingBox)
        geometry.computeBoundingBox();
    const bounds = geometry.boundingBox, size = bounds.getSize(new T.Vector3()), center = bounds.getCenter(new T.Vector3());
    const b = new model_geometry_js_1.Batch(), z = bounds.min.z - .005, x0 = center.x - size.x * .49, x1 = center.x + size.x * .49, y0 = center.y - size.y * .49, y1 = center.y + size.y * .49;
    const centerCrack = [center.x + size.x * .10, center.y - size.y * .12, z - .006];
    const lower = [x0, y0, z], upper = [x0, y1, z - .002], corner = [x1, y1, z], end = [x1, y0, z - .004];
    b.tri(lower, upper, centerCrack, '#27343a', [0, 0, -1]);
    b.tri(upper, corner, centerCrack, '#394851', [0, 0, -1]);
    b.tri(corner, end, centerCrack, '#212b32', [0, 0, -1]);
    b.tri(end, lower, centerCrack, '#445057', [0, 0, -1]);
    for (const edge of [upper, corner, end])
        b.rod(centerCrack, edge, .0043, '#687b82');
    const mesh = b.mesh();
    damagedLensTemplates.set(geometry, mesh);
    return mesh.clone();
}
const indicatorTemplates = new Map();
function indicatorLenses(kind) {
    let templates = indicatorTemplates.get(kind);
    if (!templates) {
        const s = vehicle_cabin_js_1.specs[kind];
        templates = [-1, 1].map(side => {
            const lens = new model_geometry_js_1.Batch(), x = side * s.w * .82;
            lens.box(x, s.belt - .205, s.front - .080, .16, .060, .031, '#ffc266');
            lens.box(x, s.belt - .179, s.rear + .083, .18, .061, .034, '#ffb04b');
            const mesh = lens.mesh(model_geometry_js_1.lit);
            mesh.name = side < 0 ? 'indicator-left' : 'indicator-right';
            return mesh;
        });
        indicatorTemplates.set(kind, templates);
    }
    return templates.map(mesh => mesh.clone());
}
const lacquer = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, metalness: .31, roughness: .32, envMapIntensity: .82 });
let beamMat;
const beamPlane = new T.PlaneGeometry(3.3, 10.5);
function makeBeams(s) {
    if (!beamMat) {
        const width = 32, height = 64, data = new Uint8Array(width * height * 4);
        for (let j = 0; j < height; j++)
            for (let i = 0; i < width; i++) {
                const v = j / (height - 1), u = Math.abs((i / (width - 1) - .5) * 2), ix = (j * width + i) * 4, k = Math.max(0, 1 - u / (.17 + .83 * v));
                data.set([255, 227, 170, Math.round(85 * k * k * (1 - v) ** 1.5 * Math.min(v * 9, 1))], ix);
            }
        const tex = new T.DataTexture(data, width, height);
        tex.magFilter = T.LinearFilter;
        tex.minFilter = T.LinearFilter;
        tex.needsUpdate = true;
        beamMat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1 });
    }
    const g = new T.Group();
    for (const sign of [-1, 1]) {
        const m = new T.Mesh(beamPlane, beamMat);
        m.rotation.x = -Math.PI / 2;
        m.rotation.z = sign * .035;
        m.position.set(sign * s.w * .65, .065, s.front - 5.15);
        g.add(m);
    }
    return g;
}
function createVehicle(kind, color, propBeams = false, id) {
    const series = kind === 'hatch' ? vehicle_cabin_js_1.ladogaSeries(id) : 0;
    const key = series ? 'hatch-late' : kind;
    const s = vehicle_cabin_js_1.specs[kind], template = types.get(key) ?? buildBody(kind, series);
    types.set(key, template);
    const root = new T.Group(), lod = new T.LOD(), near = new T.Group(), far = new T.Group(), paint = lacquer.clone();
    paint.color.set(color ?? s.color);
    const chassis = new T.Group();
    chassis.name = 'sprung-chassis';
    near.add(chassis);
    const platform = new T.Group(), equipmentModel = template.industrial?.clone();
    let updateHydraulics;
    if (equipmentModel) {
        platform.name = kind === 'towtruck' ? 'tow-platform' : 'snow-plough';
        platform.position.set(0, kind === 'towtruck' ? .835 : .05, kind === 'towtruck' ? -.78 : s.front - .25);
        platform.add(equipmentModel);
        chassis.add(platform);
        if (kind === 'utility') {
            platform.position.y = .32;
            platform.rotation.y = -.16;
            updateHydraulics = (0, model_service_body_js_1.buildPloughHydraulics)(chassis, platform, s.front);
            updateHydraulics();
        }
    }
    if (template.serviceBeacon)
        chassis.add(template.serviceBeacon.clone());
    const body = template.paint.clone(), farBody = template.farPaint.clone(), trimBody = template.body.clone(), farTrim = template.lowTrim.clone();
    body.material = paint;
    body.name = 'body-panel-skin';
    farBody.material = paint;
    farBody.name = 'low-panel-skin';
    trimBody.name = 'body-panel-hardware';
    const lamps = template.lamps.map((l, i) => { const lamp = l.clone(); lamp.name = i === 0 ? 'left-headlamp' : 'right-headlamp'; return lamp; }), tail = template.tails.clone(), scratch = template.scrapes.clone();
    const tailMat = model_geometry_js_1.lit.clone();
    tail.material = tailMat;
    tail.name = 'tail-lights';
    const farTail = tail.clone(), farLamps = lamps.map(lamp => lamp.clone());
    const brokenLenses = lamps.map((l, i) => { const damaged = crackedLens(l); damaged.name = i === 0 ? 'cracked-left-headlamp' : 'cracked-right-headlamp'; damaged.visible = false; return damaged; });
    chassis.add(body, trimBody, template.windows.clone(), template.trim.clone(), ...lamps, ...brokenLenses, tail, scratch);
    const exterior = template.exterior, opticalLenses = exterior.optics.map(optics => optics.lens.clone());
    const exteriorParts = [...exterior.detail.map(part => part.clone()), ...exterior.optics.map(optics => optics.reflector.clone()), ...opticalLenses];
    chassis.add(...exteriorParts, exterior.undercarriage.clone());
    if (exterior.suspension)
        chassis.add(exterior.suspension.clone());
    if (exterior.cap) {
        const cap = exterior.cap.clone();
        cap.material = paint;
        chassis.add(cap);
        exteriorParts.push(cap);
    }
    const bumpers = template.bumpers.map((mesh, i) => {
        const pivot = new T.Group(), piece = mesh.clone();
        pivot.name = i === 0 ? 'front-bumper' : 'rear-bumper';
        pivot.position.set(0, i === 0 ? .46 : .495, i === 0 ? s.front : s.rear);
        piece.position.copy(pivot.position).negate();
        pivot.add(piece);
        chassis.add(pivot);
        return pivot;
    });
    far.add(farBody, farTrim, farTail, ...farLamps);
    const doors = template.doors.map(t => t.create(paint));
    chassis.add(...doors);
    const gear = template.equipment(paint);
    chassis.add(gear.root);
    const cockpit = template.cockpit();
    chassis.add(cockpit.root);
    const hood = template.hood(paint), dash = template.dash(), belts = template.belts();
    const seats = template.seats.clone();
    seats.name = 'model-specific-seats';
    chassis.add(hood.root, dash.root, belts.root, seats);
    if (template.partition)
        chassis.add(template.partition.clone());
    const pivots = [], rollers = [], treadDetails = [];
    for (const z of [s.fw, s.rw])
        for (const side of [-1, 1]) {
            const pivot = new T.Group();
            pivot.name = z === s.fw ? 'steered-wheel' : 'rear-wheel';
            pivot.position.set(side * (s.w - .073), s.r, z);
            const { roller: wheel, caliper } = template.wheels[side < 0 ? 0 : 1];
            const roller = wheel.clone();
            treadDetails.push(roller.getObjectByName('tyre-tread-and-marking'));
            pivot.add(roller, caliper.clone());
            near.add(pivot);
            pivots.push(pivot);
            rollers.push(roller);
        }
    const beams = propBeams ? makeBeams(s) : undefined;
    root.add(lod);
    if (beams)
        root.add(beams);
    lod.addLevel(near, 0);
    lod.addLevel(far, 32, .10);
    const blue = [];
    if (kind === 'patrol') {
        for (const sign of [-1, 1]) {
            const mat = new T.MeshBasicMaterial({ color: sign < 0 ? 0x66beff : 0xff5552, toneMapped: false });
            const m = new T.Mesh(model_geometry_js_1.box, mat);
            m.scale.set(.46, .13, .24);
            m.position.set(sign * .277, s.roof + .23, .085);
            chassis.add(m);
            blue.push(m);
        }
    }
    const motion = (0, model_car_motion_js_1.makeVehicleMotion)(kind, root, chassis, pivots, doors, bumpers);
    let indicators;
    const doorFinish = kind === 'hatch' ? (0, model_vehicle_wear_js_1.applyLadogaDoorFinish)(paint, doors, far) : undefined;
    const doorPanels = doors.flatMap(door => door.children.filter(part => part.isMesh && part.name !== 'side-window'));
    const roadFilm = (0, model_vehicle_wear_js_1.applyRoadFilm)(kind, [body, ...doors.map(door => door.children[0])]);
    const wear = (0, model_vehicle_wear_js_1.applyVehicleWear)(kind, paint, [body, hood.surface, trimBody, ...lamps, ...brokenLenses, tail, ...bumpers.map(p => p.children[0]),
        ...doorPanels, ...roadFilm.parts, ...exteriorParts],
        [farBody, farTrim, ...(doorFinish?.plates ?? [])], pivots, color ?? s.color);
    let auxiliary, auxiliaryMaterial;
    if (kind !== 'patrol') {
        auxiliary = new T.Group();
        auxiliary.name = 'auxiliary-lights';
        auxiliary.visible = false;
        auxiliaryMaterial = new T.MeshBasicMaterial({ color: '#fff0be', toneMapped: false });
        for (const x of [-.28, .28]) {
            const lamp = new T.Mesh(model_geometry_js_1.box, auxiliaryMaterial);
            lamp.position.set(x, .555, s.front - .104);
            lamp.scale.set(.226, .087, .038);
            auxiliary.add(lamp);
        }
        chassis.add(auxiliary);
    }
    let spin = 0, time = 0, disposed = false;
    function setLights(headlights, brake, systems) {
        lamps.forEach((lamp, i) => {
            const working = (i === 0 ? systems?.leftLamp : systems?.rightLamp) !== false;
            lamp.visible = farLamps[i].visible = !!headlights && working;
            opticalLenses[i].visible = working;
            brokenLenses[i].visible = !working;
            if (beams)
                beams.children[i].visible = working;
        });
        if (beams)
            beams.visible = !!headlights && near.visible;
        tailMat.color.setScalar(brake ? 1 : headlights ? .42 : .15);
    }
    setLights(false, false);
    scratch.visible = false;
    if (beams)
        beams.visible = false;
    root.name = kind;
    if (kind === 'hatch')
        root.userData.ladogaSeries = series;
    return { root, setColor: wear.setColor, setLights, dispose() {
            if (disposed)
                return;
            disposed = true;
            root.removeFromParent();
            wear.dispose();
            doorFinish?.dispose();
            roadFilm.dispose();
            cockpit.dispose();
            paint.dispose();
            tailMat.dispose();
            auxiliaryMaterial?.dispose();
            for (const light of blue)
                light.material.dispose();
        }, update(dt, speed, steer, headlights, brake, damage = 0, visual = {}) {
            motion(dt, speed, steer, visual);
            wear.update(visual.systems);
            roadFilm.update(visual.systems?.dirt);
            farTail.geometry = tail.geometry;
            doorFinish?.update(visual.systems);
            if (auxiliary)
                auxiliary.visible = !!visual.systems?.auxLights && headlights;
            if (kind === 'towtruck')
                platform.rotation.x = (visual.systems?.bedDrop ?? 0) * .155;
            if (updateHydraulics) {
                const target = visual.systems?.plough ? .04 : .32;
                const lift = visual.snapshotPose || Math.abs(target - platform.position.y) < .001
                    ? target : T.MathUtils.damp(platform.position.y, target, 8, dt);
                if (lift !== platform.position.y) {
                    platform.position.y = lift;
                    updateHydraulics();
                }
            }
            if (near.visible) {
                dash.update(speed, visual.systems);
                belts.update(visual.occupied || visual.npcDriver);
                cockpit.update(dt, speed, steer, visual.occupied ? 'hero' : visual.npcDriver ? 'npc' : null, visual.hasBlock, visual.coat, visual.cameraDistance);
                if (visual.occupied) {
                    const skull = cockpit.root.getObjectByName('driver-head');
                    if (skull)
                        skull.visible = !visual.cockpit;
                }
            }
            hood.update(dt, visual, !visual.occupied && Math.abs(speed) < .4);
            spin = (spin - speed * dt / s.r) % (Math.PI * 2);
            time += dt;
            for (let i = 0; i < 4; i++) {
                rollers[i].rotation.x = spin;
                treadDetails[i].visible = (visual.cameraDistance ?? 0) < 14;
                if (i < 2)
                    pivots[i].rotation.y = -T.MathUtils.clamp(steer, -1, 1) * .48;
            }
            gear.update(dt, time, visual.systems);
            if (visual.indicator && !indicators) {
                indicators = indicatorLenses(kind);
                root.add(...indicators);
            }
            if (indicators) {
                const flash = (visual.patrolClock ?? time) % 1.02 < .53;
                indicators.forEach((m, i) => m.visible = flash && (visual.indicator === 'hazard' || visual.indicator === (i === 0 ? 'left' : 'right')));
            }
            for (let i = 0; i < lamps.length; i++)
                farLamps[i].geometry = lamps[i].geometry;
            setLights(headlights, brake, visual.systems);
            scratch.visible = damage > .43;
            if (blue.length) {
                const flash = (0, winter_light_js_1.patrolFlash)(visual.patrolClock ?? time);
                blue.forEach((m, i) => { m.visible = !!visual.patrolActive; m.material.color.setHex(i === 0 ? (flash === 'blue' ? 0x83caff : 0x29485f) : flash === 'red' ? 0xff6153 : 0x64302d); });
            }
        } };
}
