"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tailoredBody = void 0;
exports.dressFleet = dressFleet;
exports.fleetSignals = fleetSignals;
const model_geometry_js_1 = require("./model-geometry.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const bumper = '#243137', rubber = '#263137', steel = '#88968f', warmMetal = '#aa9d88';
const tailoredBody = (kind) => kind === 'suv' || kind === 'pickup' || kind === 'coupe';
exports.tailoredBody = tailoredBody;
function dressFleet(kind, { paint, body, lamps, tails }) {
    const s = vehicle_cabin_js_1.specs[kind], w = s.w, f = s.front, r = s.rear, h = s.belt;
    if (kind === 'coupe') {
        body.box(0, .383, f - .038, 1.74 * w, .05, .202, '#242b2d');
        body.box(0, .524, f - .011, w * .92, .159, .085, '#242c31');
        for (const x of [-1, 1]) {
            body.box(x * w * .66, .559, f - .026, .280, .108, .099, bumper);
            for (let j = 0; j < 4; j++)
                body.box(x * w * .66, .52 + j * .022, f - .082, .265, .007, .015, '#798789');
            body.rod([x * w * .78, .431, f + .12], [x * w * .99, .498, f + .59], .025, '#372f2d', true);
            body.rod([x * .24, .75, r - .18], [x * .60, .79, r - .15], .031, '#343c3c', true);
            body.box(x * .61, .435, r + .025, .459, .065, .138, '#23292b');
            for (const offset of [-.13, .13])
                body.add(model_geometry_js_1.tube, [x * .62 + offset, .434, r + .085], [.09, .148, .09], steel, [Math.PI / 2, 0, 0]);
        }
        body.rod([-.76, .882, r - .21], [.76, .882, r - .21], .035, '#293137', true);
        body.box(0, .699, r + .075, .818, .052, .029, '#543434');
        tails.box(0, .709, r + .092, .812, .014, .012, '#ff5348');
        for (const x of [-.22, .22])
            paint.rod([x, h - .035, f + .25], [x * .72, h + .028, s.a - .1], .014, '#c6c1a8', true);
    }
    else if (kind === 'pickup') {
        const floor = .742, front = .55, back = r - .12, length = back - front;
        body.box(0, floor, (front + back) * .5, 1.63 * w, .054, length, bumper);
        for (let i = -6; i <= 6; i++)
            body.box(i * .116, floor + .034, (front + back) * .5, .017, .010, length - .10, '#465354');
        body.box(0, floor + .208, front + .023, 1.66 * w, .40, .074, rubber);
        for (const side of [-1, 1]) {
            const x = side * w * .849;
            paint.box(x, floor + .217, (front + back) * .5, .285, h - floor - .035, length, '#ffffff');
            body.box(side * w * .702, floor + .228, (front + back) * .5, .030, .370, length - .035, '#3a484a');
            body.box(side * w * .855, h - .016, (front + back) * .5, .281, .047, length + .020, '#384343');
            body.box(side * w * .765, floor + .085, s.rw, .290, .161, .97, bumper);
            body.rod([side * .762, h, front + .11], [side * .762, h + .57, front + .16], .045, bumper);
            body.rod([side * .762, h + .57, front + .16], [side * .762, h + .19, front + .81], .038, bumper);
            body.box(side * w * .88, .460, (f + r) * .5, .179, .077, 2.39, bumper);
            body.rod([side * w * .943, .499, -.88], [side * w * .943, .499, .89], .015, steel, true);
            body.box(side * w * .928, h - .181, r - .214, .038, .101, .170, '#ab854b');
        }
        body.rod([-.767, h + .567, front + .16], [.767, h + .567, front + .16], .039, bumper);
        body.box(0, h + .506, front + .126, .456, .059, .049, '#b1a58c');
        body.box(0, .453, r + .032, .50, .103, .22, '#303937');
        body.ball(0, .478, r + .172, .063, .056, .053, steel);
        body.box(0, .52, f - .052, 1.161, .137, .108, '#72827a');
        for (let i = 0; i < 8; i++)
            body.box(-.414 + i * .12, .571, f - .115, .033, .085, .028, bumper);
    }
    else {
        for (const side of [-1, 1]) {
            const x = side * w * .77;
            body.box(x, s.roof + .082, .404, .071, .073, 1.97, bumper);
            for (const z of [-.38, .32, 1.18])
                body.box(x, s.roof + .043, z, .095, .064, .124, bumper);
            body.box(side * w * .91, .514, .002, .20, .074, 1.99, bumper);
            body.box(side * w * .990, .533, .002, .019, .020, 1.86, steel);
            body.rod([side * w * .74, .575, f - .061], [side * w * .58, .732, f - .128], .041, bumper);
            body.rod([side * w * .58, .732, f - .128], [side * .32, .751, f - .131], .042, bumper);
            body.rod([side * .32, .751, f - .131], [0, .751, f - .131], .042, bumper);
        }
        for (const z of [-.19, 1.018])
            body.box(0, s.roof + .13, z, w * 1.53, .033, .078, steel);
        body.box(.28, s.roof + .163, .60, .68, .077, .95, '#556158');
        for (let j = 0; j < 5; j++)
            body.box(.28, s.roof + .205, .30 + j * .14, .595, .013, .031, '#929f85');
        body.box(0, .502, f - .071, 1.38, .107, .164, '#465950');
        for (const x of [-.4, .4])
            body.box(x, .497, f - .151, .096, .047, .026, '#aab29e');
    }
}
function fleetSignals(kind, { body, lamps, tails }) {
    const s = vehicle_cabin_js_1.specs[kind], w = s.w, f = s.front, r = s.rear, h = s.belt;
    for (const side of [-1, 1]) {
        const lamp = lamps[side < 0 ? 0 : 1], x = side * w * .72;
        if (kind === 'suv') {
            body.add(model_geometry_js_1.tube, [x, .975, f - .033], [.301, .078, .301], '#2b3532', [Math.PI / 2, 0, 0]);
            body.add(model_geometry_js_1.tube, [x, .975, f - .080], [.231, .038, .231], steel, [Math.PI / 2, 0, 0]);
            lamp.add(model_geometry_js_1.tube, [x, .975, f - .101], [.158, .018, .158], '#fff3cc', [Math.PI / 2, 0, 0]);
            body.box(x, 1.054, r + .021, .159, .346, .071, bumper);
            body.box(x, .996, r + .064, .123, .218, .022, '#7b3f38');
            tails.box(x, 1.029, r + .079, .095, .152, .014, '#f25943');
        }
        else if (kind === 'pickup') {
            for (const offset of [-.058, .058]) {
                body.box(x + offset, .975, f - .039, .102, .132, .070, '#364349');
                lamp.box(x + offset, .984, f - .082, .076, .085, .020, '#fff0c5');
            }
            body.box(side * w * .809, h - .247, r + .026, .130, .297, .095, '#343638');
            body.box(side * w * .809, h - .227, r + .082, .086, .22, .019, '#733d35');
            for (let j = 0; j < 3; j++)
                tails.box(side * w * .809, h - .283 + j * .058, r + .097, .071, .021, .020, '#ff5e49');
        }
        else {
            const z = f - .034, y = .722;
            const p = (q, v, u) => [side * q * w, y + v, z + u];
            body.quad(p(.42, 0, -.012), p(.93, .082, .103), p(.87, -.006, .076), p(.46, -.050, -.008), bumper, [0, 0, -1]);
            lamp.rod(p(.47, -.009, -.028), p(.89, .059, .068), .014, '#f3ecdd', true);
            lamp.rod(p(.52, -.024, -.020), p(.85, .031, .060), .009, '#fff1c6', true);
            body.box(side * w * .688, h - .16, r + .036, .298, .095, .074, '#522f35');
            tails.box(side * w * .688, h - .156, r + .079, .277, .025, .015, '#fd514c');
            body.box(side * w * .78, y - .089, f - .06, .087, .026, .029, warmMetal);
        }
    }
}
