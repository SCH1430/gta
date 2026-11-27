"use strict";
const cabin = require("./vehicle-cabin.js");
const { toWorld } = require("./collision.js");
const unit = x => Math.max(0, Math.min(1, x));
const smooth = (x, a, b) => { const t = unit((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hold = (p, a, b, c, d) => smooth(p, a, b) * (1 - smooth(p, c, d));
exports.seatCrossingTime = .63;
exports.duration = (c, entering) => (entering ? 1.88 : 1.74) + Math.max(0, c.sillY - .39) * .90;
// Work from one reversible doorway phase: zero is standing outside, one is behind the wheel.
function cycle(tx, phase) {
    const entry = tx.kind === 'enter', p = entry ? phase : 1 - phase;
    tx.phase = phase;
    tx.doorOpen = tx.opening * hold(p, .105, .34, .755, .94);
    tx.insideHandle = p >= .57;
    tx.reach = tx.insideHandle ? hold(p, .66, .755, .938, 1) : hold(p, .01, .095, .24, .37);
    tx.seated = smooth(p, .43, .725);
    tx.doorDuck = hold(p, .28, .425, .595, .755);
    tx.doorStep = entry ? unit((p - .325) / .425) : unit((.750 - p) / .425);
    tx.doorPivot = hold(p, .235, .37, .48, .65);
    tx.doorBrace = hold(p, .345, .495, .57, .69);
    tx.doorPlantWeight = hold(p, .035, .14, .47, .655);
    tx.doorInsideWeight = hold(p, .32, .49, .64, .77);
}
exports.cycle = cycle;
function stand(car, side, open) {
    const s = cabin.carCabin(car.kind), angle = Math.abs(cabin.doorAngle(side, open));
    // A half-step beside the rear edge of the swinging door keeps the body out of its arc.
    return toWorld(car, side * (s.halfWidth + .40 + .39 * Math.sin(angle)), s.handleZ + .33 - .32 * (1 - Math.cos(angle)));
}
exports.stand = stand;
function passage(car, tx, p) {
    const s = cabin.carCabin(car.kind), side = tx.side;
    const t = smooth(p, .326, .746), u = 1 - t;
    const angle = Math.abs(cabin.doorAngle(side, tx.opening));
    const edgeX = s.halfWidth + .40 + .39 * Math.sin(angle);
    const edgeZ = s.handleZ + .33 - .32 * (1 - Math.cos(angle));
    const reachOut = .084 * hold(p, .66, .75, .79, .94);
    const x = u*u*u*edgeX + 3*u*u*t*(s.halfWidth + .52) + 3*u*t*t*(s.halfWidth - .07) + t*t*t*s.seatX;
    const z = u*u*u*edgeZ + 3*u*u*t*(s.seatZ + .28) + 3*u*t*t*(s.seatZ + .13) + t*t*t*s.seatZ;
    return toWorld(car, side * (x + reachOut), z);
}
exports.passage = passage;
function actorPose(car, tx, floor) {
    if (!car || !tx)
        return {};
    const s = cabin.carCabin(car.kind), side = tx.side, entry = tx.kind === 'enter';
    const phase = tx.phase ?? (entry ? tx.seated : 1 - tx.seated);
    const p = entry ? phase : 1 - phase;
    const plant = toWorld(car, side * (s.halfWidth + .49), s.handleZ + .32);
    plant.y = floor(plant.x, plant.z);
    const highStep = smooth(s.sillY, .40, .58);
    const tuck = smooth(p, .38 + .03 * highStep, .65 + .035 * highStep);
    const inside = toWorld(car, side * ((1 - tuck) * (s.halfWidth + .065) + tuck * (s.seatX - .13)), s.seatZ + .13 - tuck * .705);
    inside.y = car.y + s.sillY + .055 + .115 * Math.sin(tuck * Math.PI) - .155 * tuck;
    const brace = toWorld(car, side * (s.halfWidth - .025), s.seatZ + .145);
    brace.y = car.y + Math.min(cabin.specs[car.kind].roof - .17, s.seatY + .45 - .10 * smooth(s.sillY, .39, .60));
    return { seated: tx.seated, passengerSlide: tx.passengerSlide, doorReach: tx.reach, doorSide: side,
        doorDuck: tx.doorDuck, doorStep: tx.doorStep, doorLeadSide: entry ? -side : side,
        doorClosing: entry ? tx.insideHandle : !tx.insideHandle,
        doorEntry: entry, doorCabinKind: car.kind, doorOpen: tx.doorOpen, driverSeatWeight: tx.driverSeatWeight,
        doorPivot: tx.doorPivot, doorBrace: tx.doorBrace, doorBraceTarget: brace,
        doorPlant: plant, doorPlantWeight: tx.doorPlantWeight, doorInsideFoot: inside, doorInsideWeight: tx.doorInsideWeight,
        seatHeight: s.seatY, sillHeight: s.sillY, roofHeight: cabin.specs[car.kind].roof,
        doorTarget: cabin.doorHandleWorld(car.kind, car, side, tx.doorOpen, tx.insideHandle) };
}
exports.actorPose = actorPose;
