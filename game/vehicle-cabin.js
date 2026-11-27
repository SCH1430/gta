"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doorHingeInset = exports.carCabin = exports.roofWidth = exports.highCab = exports.specs = exports.extraFleet = exports.vehicleNames = void 0;
exports.rearDeckStart = rearDeckStart;
exports.doorRoofEdge = doorRoofEdge;
exports.doorAngle = doorAngle;
exports.doorPullLocal = doorPullLocal;
exports.doorHandleWorld = doorHandleWorld;
exports.vehicleNames = { hatch: 'Ладога 04', sedan: 'Вектор С', van: 'Ток-6', suv: 'Тайга 8', pickup: 'Буревестник', coupe: 'Искра GT', taxi: 'Маяк 21', wagon: 'Волна 12', towtruck: 'Строп Э4', utility: 'Буран 62' };
exports.extraFleet = [
    ['fleet-mayak', 'taxi', -44, 20, Math.PI / 2, '#ddb450'],
    ['fleet-volna', 'wagon', 84, 39, Math.PI, '#8b9391'],
    ['fleet-strop', 'towtruck', 40, 141, 0, '#cd683f'],
    ['fleet-buran', 'utility', -802, -115, Math.PI / 2, '#b98b52']
];
exports.specs = {
    hatch: { w: .86, front: -1.89, rear: 1.82, belt: .94, roof: 1.52, a: -1.05, b: -.45, c: .83, d: 1.42, fw: -1.18, rw: 1.14, r: .325, color: '#d56535', number: 'М217К' },
    sedan: { w: .965, front: -2.56, rear: 2.51, belt: 1.00, roof: 1.47, a: -1.14, b: -.53, c: .88, d: 1.70, fw: -1.53, rw: 1.5, r: .37, color: '#496673', number: 'Т405М' },
    patrol: { w: .965, front: -2.56, rear: 2.51, belt: 1.00, roof: 1.47, a: -1.14, b: -.53, c: .88, d: 1.70, fw: -1.53, rw: 1.5, r: .37, color: '#d4ded5', number: 'А077К' },
    van: { w: 1.005, front: -2.39, rear: 2.5, belt: 1.10, roof: 2.18, a: -1.93, b: -1.4, c: -.30, d: -.21, fw: -1.43, rw: 1.59, r: .375, color: '#518f87', number: 'Р318К' },
    suv: { w: 1.00, front: -2.17, rear: 2.23, belt: 1.20, roof: 1.99, a: -1.13, b: -.70, c: 1.56, d: 1.96, fw: -1.37, rw: 1.39, r: .419, color: '#7f8970', number: 'Т808Р' },
    pickup: { w: 1.03, front: -2.63, rear: 2.67, belt: 1.19, roof: 1.86, a: -1.32, b: -.78, c: .30, d: .48, fw: -1.58, rw: 1.55, r: .402, color: '#b08553', number: 'А412Р' },
    coupe: { w: .995, front: -2.28, rear: 2.18, belt: .86, roof: 1.28, a: -1.10, b: -.37, c: .27, d: 1.43, fw: -1.48, rw: 1.26, r: .329, color: '#a65543', number: 'К623Т' },
    taxi: { w: .948, front: -2.37, rear: 2.39, belt: 1.02, roof: 1.60, a: -1.17, b: -.58, c: .91, d: 1.57, fw: -1.43, rw: 1.42, r: .355, color: '#ddb450', number: 'Т031К' },
    wagon: { w: .93, front: -2.21, rear: 2.44, belt: 1.05, roof: 1.74, a: -1.12, b: -.65, c: 1.89, d: 2.21, fw: -1.42, rw: 1.53, r: .374, color: '#959d96', number: 'В142М' },
    towtruck: { w: 1.14, front: -3.35, rear: 3.74, belt: 1.30, roof: 2.38, a: -2.96, b: -2.44, c: -.91, d: -.79, fw: -2.37, rw: 2.04, r: .447, color: '#cf6a40', number: 'М804Р' },
    utility: { w: 1.13, front: -2.95, rear: 3.15, belt: 1.34, roof: 2.31, a: -2.30, b: -1.82, c: -.37, d: -.18, fw: -1.82, rw: 1.86, r: .455, color: '#bd8b4f', number: 'А617К' }
};
const seatGeometry = {
    hatch: { latchZ: .35, seatZ: -.11, seatY: .64, sillY: .39 },
    sedan: { latchZ: .37, seatZ: -.11, seatY: .64, sillY: .39 },
    patrol: { latchZ: .37, seatZ: -.11, seatY: .64, sillY: .39 },
    van: { latchZ: -.36, seatZ: -.87, seatY: .81, sillY: .44 },
    suv: { latchZ: .29, seatZ: -.15, seatY: .92, sillY: .53 },
    pickup: { latchZ: .36, seatZ: -.26, seatY: .82, sillY: .50 },
    coupe: { latchZ: .63, seatZ: -.13, seatY: .51, sillY: .35 },
    taxi: { latchZ: .35, seatZ: -.13, seatY: .67, sillY: .39 },
    wagon: { latchZ: .22, seatZ: -.16, seatY: .72, sillY: .40 },
    towtruck: { latchZ: -.93, seatZ: -1.78, seatY: 1.01, sillY: .60 },
    utility: { latchZ: -.30, seatZ: -1.14, seatY: 1.015, sillY: .62 }
};
const highCab = (kind) => kind === 'van' || kind === 'suv' || kind === 'pickup' || kind === 'towtruck' || kind === 'utility';
exports.highCab = highCab;
const roofWidth = (kind) => exports.specs[kind].w * ((0, exports.highCab)(kind) ? kind === 'pickup' ? .83 : .87 : kind === 'wagon' ? .86 : .79);
exports.roofWidth = roofWidth;
function rearDeckStart(kind) {
    const s = exports.specs[kind];
    return kind === 'van' ? -.255 : kind === 'pickup' ? .53 : kind === 'towtruck' ? -.78 : kind === 'utility' ? -.13 : kind === 'suv' ? 1.76 : kind === 'wagon' ? 2.17 : Math.max(s.rw - .11, 1.1);
}
function doorRoofEdge(kind, end) {
    const s = exports.specs[kind], slope = Math.max(0, Math.min(1, (end - s.c) / (s.d - s.c)));
    return { x: (0, exports.roofWidth)(kind) + (s.w * .94 - (0, exports.roofWidth)(kind)) * slope, y: s.roof + (s.belt - s.roof) * slope };
}
const steeringRim = { gripX: .151, gripY: .067, tilt: -.4 };
exports.steeringRim = steeringRim;
function dimensions(kind) {
    const s = exports.specs[kind], { latchZ, seatZ, seatY, sillY } = seatGeometry[kind], hingeZ = s.a + .095;
    const hipY = seatY - (kind === 'coupe' ? .060 : .022), backAngle = -.20;
    const thigh = kind === 'van' || kind === 'towtruck' || kind === 'utility' ? 1.80 : kind === 'coupe' ? 2.04 : kind === 'suv' || kind === 'pickup' ? 1.92 : 2.065;
    const pedalAngle = kind === 'coupe' ? .28 : 0;
    const wheelY = s.belt + .13, wheelZ = s.a + .49;
    // Resting palm centre on the tilted rim, expressed in the seated spine's coordinates.
    const rimY = steeringRim.gripY + .404 * .008 - .915 * .001;
    const py = wheelY - hipY + rimY * Math.cos(steeringRim.tilt) - .031 * Math.sin(steeringRim.tilt);
    const pz = wheelZ - seatZ + rimY * Math.sin(steeringRim.tilt) + .031 * Math.cos(steeringRim.tilt);
    const drivingPose = { hipY, backAngle, thigh, shins: [.68 + pedalAngle, .77 + pedalAngle], wheelY, wheelZ,
        gripX: steeringRim.gripX + .915 * .008 + .404 * .001,
        gripY: py * Math.cos(backAngle) + pz * Math.sin(backAngle), gripZ: pz * Math.cos(backAngle) - py * Math.sin(backAngle) };
    return { halfWidth: s.w, hingeZ, handleZ: latchZ - .155, seatZ, seatX: s.w * .48, seatY, sillY, beltY: s.belt, handleY: s.belt - .095,
        front: s.front, rear: s.rear, doorLength: latchZ - hingeZ, drivingPose };
}
const cabins = Object.fromEntries(Object.keys(exports.specs).map(kind => [kind, dimensions(kind)]));
const carCabin = (kind) => cabins[kind];
exports.carCabin = carCabin;
exports.doorHingeInset = .068;
function doorAngle(side, open) {
    return side * Math.min(1, Math.max(0, open)) * 1.117;
}
function doorPullLocal(kind, side) {
    const c = (0, exports.carCabin)(kind);
    return { x: side * (c.halfWidth - .235), y: c.beltY - .174, z: c.hingeZ + c.doorLength * .44 };
}
function doorHandleWorld(kind, car, side, open, inside = false) {
    const c = (0, exports.carCabin)(kind), a = doorAngle(side, open), hingeX = side * (c.halfWidth - exports.doorHingeInset);
    const handle = inside ? doorPullLocal(kind, side) : { x: side * (c.halfWidth + .039), y: c.handleY + .010, z: c.handleZ - .006 };
    const gripX = handle.x - hingeX, gripZ = handle.z - c.hingeZ;
    const x = hingeX + Math.cos(a) * gripX + Math.sin(a) * gripZ;
    const z = c.hingeZ - Math.sin(a) * gripX + Math.cos(a) * gripZ;
    return {
        x: car.x + Math.cos(car.yaw) * x + Math.sin(car.yaw) * z,
        y: car.y + handle.y,
        z: car.z - Math.sin(car.yaw) * x + Math.cos(car.yaw) * z
    };
}
