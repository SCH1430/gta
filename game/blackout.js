"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blackoutFixture = exports.blackoutProps = exports.blackoutSite = void 0;
exports.blackoutField = blackoutField;
exports.soundDirection = soundDirection;
exports.blackoutCues = blackoutCues;
exports.soundDirectionLabel = soundDirectionLabel;
exports.soundCaption = soundCaption;
const world_railway_js_1 = require("./world-railway.js");
exports.blackoutSite = {
    breaker: { x: 40.3, z: 22.75, radius: 2.1, name: 'Распределительный щит рынка', space: 'street' },
    generator: { x: 63.1, z: 22.25, radius: 1.9, name: 'Генератор под эстакадой', space: 'street' },
    bell: { x: 17.1, z: 22.6, radius: 2.2, name: 'Звонок на остановке «Спектр»', space: 'street' },
};
exports.blackoutProps = {
    breaker: { x: 40.35, z: 21.8, w: .59, d: .43, h: 1.7 },
    generator: { x: 63.1, z: 20.90, w: 1.40, d: 1.24, h: 1.22 },
};
const cutCenter = { x: 42, z: 21 };
const rim = (n) => Math.max(0, Math.min(1, n));
const blackoutFixture = (phase, x, z) => phase !== 'normal' && x >= 7 && x <= 79 && z >= 12 && z <= 25;
exports.blackoutFixture = blackoutFixture;
function blackoutField(phase, x, z) {
    if (phase === 'normal')
        return 0;
    const scaled = Math.hypot((x - cutCenter.x) / 39, (z - cutCenter.z) / 21);
    const edge = rim((1.32 - scaled) / .52);
    return edge * edge * (3 - 2 * edge);
}
function soundDirection(kind, listener, source, range, gain = 1) {
    const x = source.x - listener.x, z = source.z - listener.z, dist = Math.hypot(x, z);
    const worldAngle = dist < .005 ? listener.yaw : Math.atan2(-x, -z);
    const angle = worldAngle - listener.yaw, bearing = -Math.atan2(Math.sin(angle), Math.cos(angle));
    const back = Math.cos(bearing) < -.35, offAxis = back ? .83 : 1;
    return { kind, bearing, pan: Math.sin(bearing), rear: back, distance: dist, strength: gain * offAxis * rim(1 - dist / range) ** 1.45 };
}
function blackoutCues(phase, listener, _elapsed, tramTime = -1, patrol) {
    const sources = [];
    if (phase === 'normal' || listener.space && listener.space !== 'street')
        return { primary: null, sources };
    if (phase === 'search')
        sources.push(soundDirection('generator', listener, exports.blackoutProps.generator, 70));
    if (phase === 'bell')
        sources.push(soundDirection('relay', listener, exports.blackoutSite.bell, 79));
    const primary = sources[0] ?? null;
    if (phase === 'bell' && tramTime >= 0) {
        const rail = (0, world_railway_js_1.linePose)(tramTime);
        if (rail.visible && Math.abs(rail.speed) > 1.5) {
            const tram = soundDirection('tram', listener, rail, 38, .73);
            if (tram.strength > .015)
                sources.push(tram);
        }
    }
    if (patrol) {
        const distant = soundDirection('patrol', listener, patrol, 38);
        if (distant.strength > .03)
            sources.push(distant);
    }
    return { primary, sources };
}
function soundDirectionLabel(bearing, distance, near = 2.6) {
    const absolute = Math.abs(bearing);
    return distance < near ? 'рядом' : absolute < Math.PI / 8 ? 'впереди' : absolute > 7 * Math.PI / 8 ? 'сзади' :
        bearing < 0 ? (absolute > 5 * Math.PI / 8 ? 'слева сзади' : 'слева') : (absolute > 5 * Math.PI / 8 ? 'справа сзади' : 'справа');
}
function soundCaption(signal) {
    const sounds = { generator: 'Гул стартера', relay: 'Звонок у остановки', tram: 'Слышен трамвай', patrol: 'Сирена патруля' };
    if (signal.strength <= .015)
        return 'Звук не слышен. Вернитесь под эстакаду.';
    return sounds[signal.kind] + ' · ' + soundDirectionLabel(signal.bearing, signal.distance);
}
