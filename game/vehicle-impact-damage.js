"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clampDamage = exports.bodyPanels = void 0;
exports.impactPanel = impactPanel;
exports.impactImpression = impactImpression;
exports.cleanImpressions = cleanImpressions;
exports.deepenImpression = deepenImpression;
exports.legacyImpressions = legacyImpressions;
exports.impactBodyPoint = impactBodyPoint;
exports.bodyPanels = ['frontLeft', 'frontRight', 'rearLeft', 'rearRight', 'leftSide', 'rightSide'];
const maxImpressions = 12;
const clampDamage = (value) => Math.max(0, Math.min(1, value));
exports.clampDamage = clampDamage;
function between(value, lo, hi) { return Math.min(hi, Math.max(lo, value)); }
function impactPanel(spec, x, z) {
    const front = (spec.front + spec.fw) * .5, rear = (spec.rear + spec.rw) * .5;
    if (z < front)
        return x < 0 ? 'frontLeft' : 'frontRight';
    if (z > rear)
        return x < 0 ? 'rearLeft' : 'rearRight';
    return x < 0 ? 'leftSide' : 'rightSide';
}
function normal(panel) {
    if (panel.startsWith('front'))
        return { x: 0, z: 1 };
    if (panel.startsWith('rear'))
        return { x: 0, z: -1 };
    return { x: panel === 'leftSide' ? 1 : -1, z: 0 };
}
function impactImpression(spec, x, z, strength, direction) {
    const panel = impactPanel(spec, x, z), inward = normal(panel);
    const length = Math.hypot(direction?.x ?? 0, direction?.z ?? 0);
    let dx = inward.x, dz = inward.z;
    if (direction && Number.isFinite(length) && length > .001 &&
        (direction.x * inward.x + direction.z * inward.z) / length > -.22) {
        dx += direction.x / length * 1.66;
        dz += direction.z / length * 1.66;
        const magnitude = Math.hypot(dx, dz);
        dx /= magnitude;
        dz /= magnitude;
    }
    return {
        x: between(x, -spec.w - .1, spec.w + .1), z: between(z, spec.front - .09, spec.rear + .09),
        dx, dz, strength: (0, exports.clampDamage)(strength), panel
    };
}
function cleanImpressions(raw, spec) {
    if (!Array.isArray(raw))
        return [];
    return raw.slice(-maxImpressions).flatMap((hit) => {
        if (!hit || !Number.isFinite(hit.x) || !Number.isFinite(hit.z) || !Number.isFinite(hit.strength) || hit.strength <= 0)
            return [];
        const data = impactImpression(spec, hit.x, hit.z, hit.strength);
        const len = Math.hypot(hit.dx ?? 0, hit.dz ?? 0), inward = normal(data.panel);
        if (len > .001 && Number.isFinite(len) && (hit.dx * inward.x + hit.dz * inward.z) / len > .11) {
            data.dx = hit.dx / len;
            data.dz = hit.dz / len;
        }
        return [data];
    });
}
function deepenImpression(impressions, hit) {
    const at = impressions.findIndex(old => old.panel === hit.panel && Math.hypot(old.x - hit.x, old.z - hit.z) < .32);
    const next = impressions.slice();
    if (at >= 0) {
        const prior = next[at];
        const depth = 1 - (1 - prior.strength) * (1 - hit.strength * .80);
        const dx = prior.dx * prior.strength + hit.dx * hit.strength, dz = prior.dz * prior.strength + hit.dz * hit.strength;
        const length = Math.hypot(dx, dz);
        next.splice(at, 1);
        next.push({ ...prior, dx: dx / length, dz: dz / length, strength: depth });
    }
    else
        next.push(hit);
    return next.slice(-maxImpressions);
}
function legacyImpressions(spec, dents) {
    return exports.bodyPanels.flatMap(panel => {
        const strength = dents[panel] ?? 0;
        if (strength <= 0)
            return [];
        const end = panel.startsWith('front') ? 'front' : panel.startsWith('rear') ? 'rear' : null;
        const left = panel.startsWith('left') || panel.endsWith('Left');
        return [{
                x: (left ? -1 : 1) * spec.w * (end ? .58 : 1), z: end ? spec[end] : 0,
                dx: normal(panel).x, dz: normal(panel).z, strength, panel
            }];
    });
}
function impactBodyPoint(spec, marks, x, y, z, out) {
    let across = 0, lift = 0, along = 0;
    for (const mark of marks) {
        const front = mark.panel.startsWith('front'), rear = mark.panel.startsWith('rear'), end = front || rear;
        const strength = mark.strength;
        const radiusX = end ? .62 + strength * .22 : .50 + strength * .20;
        const radiusZ = end ? .76 + strength * .33 : .49 + strength * .38;
        const radiusY = end ? .45 + strength * .23 : .35 + strength * .14;
        const centerY = end ? spec.belt * .73 : spec.belt * .65;
        const dx = (x - mark.x) / radiusX, dz = (z - mark.z) / radiusZ, dy = (y - centerY) / radiusY;
        const squared = dx * dx + dz * dz + dy * dy;
        if (squared >= 1)
            continue;
        const envelope = (1 - squared) ** 2 * strength;
        const ripple = .77 + .23 * Math.cos((end ? dx : dz) * 9 - (y - centerY) * 11);
        const push = envelope * (end ? .38 : .30) * ripple;
        const buckle = front && y > spec.belt - .225
            ? .21 * envelope * Math.sin(Math.PI * between((y - (spec.belt - .225)) / .34, 0, 1))
            : -envelope * (end ? .075 : .035) * (1 + .43 * Math.cos(dz * 8 + dx * 9));
        across += mark.dx * push;
        along += mark.dz * push;
        lift += buckle;
    }
    out.x = x + between(across, -.31, .31);
    out.y = y + between(lift, -.17, .18);
    out.z = z + between(along, -.39, .39);
}
