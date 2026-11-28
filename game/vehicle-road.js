"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canopy = exports.courseGates = exports.testIce = exports.course = exports.chargingPost = exports.panelRepairCost = exports.alignmentRepairCost = exports.lampRepairCost = exports.isLacquer = exports.donorDoorSides = exports.bodyPanels = void 0;
exports.equipment = equipment;
exports.restoreEquipment = restoreEquipment;
exports.hasWear = hasWear;
exports.clearPanelImpressions = clearPanelImpressions;
exports.wheelSteeringFault = wheelSteeringFault;
exports.wheelRepairCost = wheelRepairCost;
exports.garageRepairCost = garageRepairCost;
exports.recordBodyScratch = recordBodyScratch;
exports.repairEquipment = repairEquipment;
exports.recordImpact = recordImpact;
exports.underbodyContact = underbodyContact;
exports.updateSurfaceWear = updateSurfaceWear;
exports.streetFurniture = streetFurniture;
exports.footprintHeight = footprintHeight;
exports.roadProfile = roadProfile;
exports.gripAt = gripAt;
exports.tyreGrip = tyreGrip;
const world_layout_js_1 = require("./world-layout.js");
const weather_js_1 = require("./weather.js");
const fixtures_js_1 = require("./fixtures.js");
const world_expansion_layout_js_1 = require("./world-expansion-layout.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const vehicle_impact_damage_js_1 = require("./vehicle-impact-damage.js");
Object.defineProperty(exports, "bodyPanels", { enumerable: true, get: function () { return vehicle_impact_damage_js_1.bodyPanels; } });
exports.donorDoorSides = ['leftSide', 'rightSide'];
const isLacquer = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
exports.isLacquer = isLacquer;
const fresh = () => ({ leftLamp: true, rightLamp: true, leftMirror: false, rightMirror: false, manoeuvre: false, wipers: false, boot: false, cargo: 'empty', load: 0, high: false, wet: 0, glassWet: 0, tyre: 0, shock: 0, charge: 82, plugged: false,
    dents: {}, punctures: 0, tyreWear: 0, winterTyres: false, underbody: false, auxLights: false,
    reinforcedSuspension: false, dirt: 0, windowsOpen: false, plough: false, hood: false, bedDrop: 0, bedMoving: false, towedMass: 0 });
function equipment(c) { return c.systems ??= fresh(); }
function restoreEquipment(c) {
    const raw = c.systems, clean = fresh();
    if (raw) {
        for (const k of ['leftLamp', 'rightLamp', 'leftMirror', 'rightMirror', 'manoeuvre', 'wipers', 'boot', 'high', 'plugged', 'winterTyres', 'underbody', 'auxLights', 'reinforcedSuspension', 'windowsOpen', 'plough', 'hood'])
            if (typeof raw[k] === 'boolean')
                clean[k] = raw[k];
        for (const [k, lo, hi] of [['wet', 0, 1], ['glassWet', 0, 1], ['load', 0, 1400], ['tyre', -1, 1], ['shock', 0, 30], ['charge', 0, 100], ['tyreWear', 0, 1], ['dirt', 0, 1]])
            if (Number.isFinite(raw[k]))
                clean[k] = Math.max(lo, Math.min(hi, raw[k]));
        if (!Number.isFinite(raw.glassWet))
            clean.glassWet = clean.wet;
        if (['empty', 'tools', 'crate', 'calibrator'].includes(raw.cargo))
            clean.cargo = raw.cargo;
        if (Number.isInteger(raw.punctures))
            clean.punctures = raw.punctures & 15;
        for (const key of vehicle_impact_damage_js_1.bodyPanels) {
            const damage = raw.dents?.[key];
            if (Number.isFinite(damage) && damage > 0)
                clean.dents[key] = Math.min(1, damage);
        }
        const impressions = (0, vehicle_impact_damage_js_1.cleanImpressions)(raw.impressions, vehicle_cabin_js_1.specs[c.kind]);
        if (impressions.length)
            clean.impressions = impressions;
        if (Array.isArray(raw.wheelDamage)) {
            const wheels = Array.from({ length: 4 }, (_, i) => Number.isFinite(raw.wheelDamage?.[i]) ? (0, vehicle_impact_damage_js_1.clampDamage)(raw.wheelDamage[i]) : 0);
            if (wheels.some(Boolean))
                clean.wheelDamage = wheels;
        }
        if (c.kind === 'hatch') {
            const donors = {};
            for (const side of exports.donorDoorSides) {
                const paint = raw.donorDoors?.[side];
                if ((0, exports.isLacquer)(paint))
                    donors[side] = paint.toLowerCase();
            }
            if (Object.keys(donors).length)
                clean.donorDoors = donors;
        }
        const marks = cleanPatina(raw.patina);
        if (marks.length)
            clean.patina = marks;
    }
    c.systems = clean;
}
function hasWear(c) {
    const s = equipment(c);
    return Boolean(c.health < 99.99 || c.scrapes?.length || s.punctures || s.tyre || !s.leftLamp || !s.rightLamp || s.leftMirror || s.rightMirror ||
        s.impressions?.length || s.wheelDamage?.some(Boolean) || Object.values(s.dents).some(value => value > 0));
}
function clearPanelImpressions(s, panel) {
    if (!s.impressions)
        return;
    const retained = s.impressions.filter(mark => mark.panel !== panel);
    if (retained.length)
        s.impressions = retained;
    else
        delete s.impressions;
}
function wheelSteeringFault(s) {
    const [fl = 0, fr = 0, rl = 0, rr = 0] = s.wheelDamage ?? [];
    return s.tyre * .012 + (fl - fr) * .018 + (rl - rr) * .007;
}
function wheelRepairCost(s, index) {
    const damage = s.wheelDamage?.[index] ?? 0;
    return s.punctures & (1 << index) ? 60 : damage > .01 ? Math.max(35, Math.ceil(60 * damage)) : 0;
}
exports.lampRepairCost = 35;
const alignmentRepairCost = (s) => s.tyre ? Math.max(20, Math.ceil(Math.abs(s.tyre) * 48)) : 0;
exports.alignmentRepairCost = alignmentRepairCost;
const panelRepairCost = (dent) => dent > 0 ? 25 + Math.ceil(dent * 40) : 0;
exports.panelRepairCost = panelRepairCost;
function garageRepairCost(c) {
    const s = equipment(c);
    const panels = Object.values(s.dents).reduce((total, dent) => total + (0, exports.panelRepairCost)(dent), 0);
    const wheels = [0, 1, 2, 3].reduce((cost, index) => cost + wheelRepairCost(s, index), 0);
    const body = Math.ceil(Math.max(0, 100 - c.health) * 5 - 1e-7);
    const parts = wheels + (Number(!s.leftLamp) + Number(!s.rightLamp)) * exports.lampRepairCost + (0, exports.alignmentRepairCost)(s);
    return Math.max(body, panels) + parts || ((s.leftMirror || s.rightMirror) ? 10 : 0);
}
const cleanPatina = (marks) => Array.isArray(marks) ? marks.slice(-16)
    .filter((m) => !!m && Number.isFinite(m.x) && Math.abs(m.x) < 4 && Number.isFinite(m.z) && Math.abs(m.z) < 5 && Number.isFinite(m.severity))
    .slice(-12).map(m => ({ x: m.x, z: m.z, severity: Math.min(1, Math.max(0, m.severity)) })) : [];
function recordBodyScratch(c, scratch) {
    const recent = c.scrapes ?? [], state = equipment(c);
    if (recent.length >= 4)
        state.patina = cleanPatina([...(state.patina ?? []), ...recent.slice(0, -3)]);
    c.scrapes = [...recent.slice(-3), scratch];
}
function repairEquipment(c, keepScrapes = false) {
    const systems = equipment(c);
    if (keepScrapes) {
        const marks = cleanPatina([...(systems.patina ?? []), ...(c.scrapes ?? [])]);
        if (marks.length)
            systems.patina = marks;
        else
            delete systems.patina;
    }
    else
        delete systems.patina;
    delete systems.impressions;
    delete systems.wheelDamage;
    c.health = 100;
    c.scrapes = [];
    Object.assign(systems, { leftLamp: true, rightLamp: true, tyre: 0, leftMirror: false, rightMirror: false, dents: {}, punctures: 0 });
}
function recordImpact(c, mark, severity, normalSpeed, direction) {
    if (!Number.isFinite(severity) || !Number.isFinite(normalSpeed) || !Number.isFinite(mark.x) || !Number.isFinite(mark.z))
        return;
    const spec = vehicle_cabin_js_1.specs[c.kind], right = mark.x >= 0;
    const s = equipment(c), rear = (spec.rw + spec.rear) * .50;
    const add = (0, vehicle_impact_damage_js_1.clampDamage)((severity - .145) * .96);
    const hit = (0, vehicle_impact_damage_js_1.impactImpression)(spec, mark.x, mark.z, add, direction);
    const panel = hit.panel;
    const vehicleSide = Math.abs(mark.x) > spec.w * .63;
    const frontWheel = Math.abs(mark.z - spec.fw) <= Math.abs(mark.z - spec.rw);
    const hitAxle = Math.abs(mark.z - (frontWheel ? spec.fw : spec.rw)) < spec.r * .78 + .13;
    if (add > .018) {
        s.impressions = (0, vehicle_impact_damage_js_1.deepenImpression)(s.impressions ?? (0, vehicle_impact_damage_js_1.legacyImpressions)(spec, s.dents), hit);
        s.dents[panel] = (0, vehicle_impact_damage_js_1.clampDamage)((s.dents[panel] ?? 0) + add);
    }
    if (mark.z > rear && normalSpeed > 5 && (s.dents[panel] ?? 0) > .55)
        s.boot = false;
    if (mark.z < spec.front + .36 && normalSpeed > 5 && severity > .29) {
        if (right)
            s.rightLamp = false;
        else
            s.leftLamp = false;
    }
    if ((direction?.tangentSpeed ?? 0) > 2.1 && vehicleSide && Math.abs(mark.z) < 1.75) {
        if (right)
            s.rightMirror = true;
        else
            s.leftMirror = true;
    }
    if (vehicleSide && hitAxle && normalSpeed > 4.5 && severity > .32) {
        const wheel = (frontWheel ? 0 : 2) + (right ? 1 : 0);
        const damage = (0, vehicle_impact_damage_js_1.clampDamage)((normalSpeed - 3.9) * .065 + severity * .32);
        const wheels = s.wheelDamage?.slice() ?? [0, 0, 0, 0];
        wheels[wheel] = 1 - (1 - (wheels[wheel] ?? 0)) * (1 - damage);
        s.wheelDamage = wheels;
        if (normalSpeed > 7.3 && severity > .48)
            s.punctures |= 1 << wheel;
    }
}
const clearance = {
    hatch: .154, sedan: .141, van: .218, suv: .278, pickup: .245, coupe: .086, taxi: .161, wagon: .193, towtruck: .219, utility: .258
};
function underbodyContact(c, height) {
    if (Math.abs(c.speed) < 2)
        return 0;
    const spec = vehicle_cabin_js_1.specs[c.kind], forward = c.speed > 0, side = Math.sin(c.yaw), along = Math.cos(c.yaw);
    const wheel = forward ? spec.fw : spec.rw, opposite = forward ? spec.rw : spec.fw;
    const end = forward ? spec.front + .06 : spec.rear - .06;
    const sample = (z) => height(c.x + z * side, c.z + z * along);
    const a = sample(wheel), b = sample(opposite);
    const slope = Math.max(-.2, Math.min(.2, (a - b) / (wheel - opposite)));
    const overhang = a + (end - wheel) * slope, gear = equipment(c);
    const freeHeight = clearance[c.kind] + (gear.reinforcedSuspension ? .032 : 0);
    return Math.max(0, sample(end) - overhang - freeHeight);
}
function updateSurfaceWear(c, dt) {
    const s = equipment(c), speed = Math.abs(c.speed);
    if (speed < .4)
        return;
    const surface = (0, world_layout_js_1.surfaceAt)(c.x, c.z), dust = surface === 'snow' ? .012 : surface === 'metal' ? .003 : .007;
    s.dirt = Math.min(1, s.dirt + dt * speed * (dust + (.001 * s.wet)) * .17);
    s.tyreWear = Math.min(1, s.tyreWear + speed * dt * (.000014 + Math.abs(c.steer) * .00001));
}
const prop = (id, kind, x, z, w, d, h) => ({ id, kind, x, z, w, d, h, vx: 0, vz: 0, broken: false });
exports.chargingPost = { x: -45.3, z: 41.5 };
exports.course = { x: -68, z: -60, w: 34, d: 18 };
exports.testIce = { x: -61, z: -61, w: 5.8, d: 9 };
exports.courseGates = [[-81, -61], [-76, -66], [-69, -61], [-63, -56], [-55, -61], [-62, -66], [-69, -61], [-76, -56], [-81, -61]];
exports.canopy = { x: 75, z: 22, w: 3.6, d: 2.2, bottom: 1.47 };
function streetFurniture() {
    return [
        ...Array.from({ length: 5 }, (_, i) => prop('fence-' + i, 'picket', 78 + i * 1.62, -15, 1.58, .18, .84)),
        prop('market-box', 'box', 57.5, 24.1, .72, .56, .51), prop('market-cart', 'cart', 61.7, 23.6, 1.23, .74, .95),
        prop('market-container', 'container', 65.6, 24, 2.75, 1.20, 1.48)
    ];
}
function footprintHeight(x, z, broken) {
    let h = 0;
    for (const [id, v] of Object.entries(broken)) {
        const f = fixtures_js_1.fixturesById.get(id);
        if (!f || Math.abs(x - f.x) > 7 || Math.abs(z - f.z) > 7)
            continue;
        const dx = x - f.x, dz = z - f.z, along = dx * v.dx + dz * v.dz, side = Math.abs(dx * v.dz - dz * v.dx);
        if (along >= -.08 && along <= (f.kind === 'lamp' ? 5.75 : 3.35) && side < .21)
            h = Math.max(h, .16 * Math.sqrt(1 - (side / .21) ** 2));
    }
    return h;
}
function roadProfile(x, z, broken) {
    let h = (0, world_layout_js_1.groundHeight)(x, z) + footprintHeight(x, z, broken);
    if (z > 54 && z < 93 && world_expansion_layout_js_1.bridges.some(b => Math.abs(x - b.x) < 5.3)) {
        const seam = Math.abs((z - 54) % 4.9 - 2.45);
        if (seam < .14)
            h += .041 * (1 - seam / .14);
    }
    if (x >= -77 && x <= -75.7 && z >= -57 && z <= -54.25)
        h += .24 * Math.min(1, (x + 77) / .13, (-75.7 - x) / .13, (z + 57) / .18, (-54.25 - z) / .40);
    return h;
}
function gripAt(x, z) {
    const ice = Math.abs(x - exports.testIce.x) < exports.testIce.w / 2 && Math.abs(z - exports.testIce.z) < exports.testIce.d / 2 ||
        z > world_expansion_layout_js_1.canal.north && z < world_expansion_layout_js_1.canal.south && world_expansion_layout_js_1.bridges.every(b => Math.abs(x - b.x) > 7);
    if (ice)
        return .26;
    if (Math.abs(x - exports.course.x) <= exports.course.w / 2 && Math.abs(z - exports.course.z) <= exports.course.d / 2)
        return 1;
    return (0, world_layout_js_1.surfaceAt)(x, z) === 'snow' ? .64 : 1;
}
function tyreGrip(c, cleared, weather) {
    const s = vehicle_cabin_js_1.specs[c.kind], systems = equipment(c), co = Math.cos(c.yaw), si = Math.sin(c.yaw);
    function contact(i, z) {
        const x = (i % 2 === 0 ? -1 : 1) * (s.w - .073), gx = c.x + co * x + si * z, gz = c.z - si * x + co * z;
        const ploughed = cleared?.(gx, gz);
        let grip = ploughed && (0, world_layout_js_1.surfaceAt)(gx, gz) === 'snow' ? .89 : gripAt(gx, gz);
        if (weather && grip > .88) {
            const ice = (0, weather_js_1.roadIceAt)(gx, gz, weather) * (ploughed ? .36 : 1);
            grip *= 1 - ice * .71;
        }
        if (systems.winterTyres)
            grip += .29 * (1 - grip);
        grip *= 1 - .18 * (systems.wheelDamage?.[i] ?? 0);
        if (systems.punctures & (1 << i))
            grip *= .55;
        return grip * (1 - .18 * systems.tyreWear) * (grip > .8 ? 1 - systems.wet * .056 : 1);
    }
    const left = (contact(0, s.fw) + contact(2, s.rw)) / 2, right = (contact(1, s.fw) + contact(3, s.rw)) / 2;
    return { mean: (left + right) / 2, difference: right - left };
}
