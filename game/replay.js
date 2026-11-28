"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactSecond = exports.replayDuration = exports.ReplayRecorder = void 0;
exports.validReplay = validReplay;
exports.packReplay = packReplay;
exports.unpackReplay = unpackReplay;
exports.replayAt = replayAt;
const sim_types_js_1 = require("./sim-types.js");
const vehicle_road_js_1 = require("./vehicle-road.js");
const { fenceDamage, validFence } = require("./market-fence.js");
const { validCrashDebris } = require("./street-incidents.js");
const span = 30, step = .12, maxImpacts = 16, maxFrames = Math.ceil(span / step) + 2 + maxImpacts, maxImpressions = 12;
const roles = ['vendor', 'dispatcher', 'mechanic', 'courier', 'walker'];
const round = (n) => Math.round(n * 1000) / 1000;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pose = (p) => ({ x: round(p.x), y: round(p.y), z: round(p.z), speed: round(p.speed), yaw: round(p.yaw) });
const near = (p, q) => (p.x - q.x) ** 2 + (p.z - q.z) ** 2;
function actors(list, focus, max, radius, priority) {
    return list.filter(p => near(p, focus) < radius ** 2)
        .sort((a, b) => (priority ? Number(priority.has(b.id)) - Number(priority.has(a.id)) : 0) || near(a, focus) - near(b, focus)).slice(0, max);
}
function wearSnapshot(s) {
    if (!s)
        return;
    const wear = {};
    if ((s.dirt ?? 0) >= .02)
        wear.dirt = round(s.dirt);
    if (s.plough)
        wear.plough = true;
    if (s.hood)
        wear.hood = true;
    if (Number.isFinite(s.charge) && s.charge !== 82)
        wear.charge = round(s.charge);
    if (!s.leftLamp)
        wear.leftLamp = false;
    if (!s.rightLamp)
        wear.rightLamp = false;
    if (s.leftMirror)
        wear.leftMirror = true;
    if (s.rightMirror)
        wear.rightMirror = true;
    if (s.punctures)
        wear.punctures = s.punctures;
    if (s.dents && Object.keys(s.dents).length)
        wear.dents = { ...s.dents };
    if (s.impressions?.length)
        wear.impressions = s.impressions.slice(-maxImpressions).map(mark => ({
            ...mark, x: round(mark.x), z: round(mark.z), dx: round(mark.dx), dz: round(mark.dz), strength: round(mark.strength)
        }));
    if (s.wheelDamage?.some(value => value > 0))
        wear.wheelDamage = s.wheelDamage.slice(0, 4);
    if (s.patina?.length)
        wear.patina = s.patina.slice(-4).map(mark => ({ ...mark }));
    if (s.donorDoors && Object.keys(s.donorDoors).length)
        wear.donorDoors = { ...s.donorDoors };
    return Object.keys(wear).length ? wear : undefined;
}
const sameContact = (a, b) => near(a, b) < 1.35 ** 2 && (a.crash?.kind === 'fence') === (b.crash?.kind === 'fence') &&
    ((a.carId === b.carId && a.otherId === b.otherId) || (a.carId === b.otherId && a.otherId === b.carId));
class ReplayRecorder {
    frames = [];
    impacts = [];
    clear() { this.frames.length = 0; this.impacts.length = 0; }
    capture(source) {
        const { hero, time, clock, tram, wanted, power, freight, driven, patrol, signal, impactLean } = source;
        const sampleTime = round(time), last = this.frames.at(-1);
        if (last && (sampleTime < last.time || sampleTime - last.time > 2 || near(hero, last.hero) > 48 ** 2))
            this.clear();
        let newImpact = false;
        for (const mark of source.impacts ?? []) {
            if (!validImpact(mark) || mark.strength < .10 || near(mark, hero) > 36 ** 2 || time - mark.time > .40 || mark.time > time + .001)
                continue;
            const prior = this.impacts.find(other => Math.abs(mark.time - other.time) < .52 && sameContact(mark, other));
            if (prior) {
                prior.strength = Math.max(prior.strength, round(mark.strength));
                if (mark.crash && (!prior.crash || mark.crash.severity >= prior.crash.severity))
                    prior.crash = mark.crash;
                continue;
            }
            const { x, y, z, carId, otherId, crash } = mark;
            this.impacts.push({ time: round(mark.time), x: round(x), y: y === undefined ? undefined : round(y), z: round(z), strength: round(mark.strength), carId, otherId, crash });
            newImpact = true;
        }
        if (newImpact) {
            this.impacts.sort((a, b) => a.time - b.time);
            if (this.impacts.length > maxImpacts)
                this.impacts.splice(0, this.impacts.length - maxImpacts);
        }
        const previous = this.frames.at(-1);
        const tx = source.transfer, changedDoor = tx?.kind !== previous?.transfer?.kind || tx?.carId !== previous?.transfer?.carId;
        if (previous && (sampleTime <= previous.time || !newImpact && !changedDoor && sampleTime - previous.time < step - .001))
            return;
        const recent = new Set();
        for (let i = this.impacts.length - 1; i >= 0; i--) {
            const mark = this.impacts[i];
            if (time - mark.time > .40)
                break;
            recent.add(mark.carId);
            if (mark.otherId)
                recent.add(mark.otherId);
        }
        if (recent.size && driven)
            recent.add(driven);
        if (tx)
            recent.add(tx.carId);
        const cars = actors(source.cars, hero, 8, 42, recent.size ? recent : undefined).map(c => {
            const l = impactLean?.(c), lean = l && (Math.abs(l.pitch) > .001 || Math.abs(l.roll) > .001) ? { pitch: round(l.pitch), roll: round(l.roll) } : undefined;
            return {
                ...pose(c), id: c.id, kind: c.kind, color: c.color, steer: round(c.steer), health: round(c.health), lean,
                lights: c.lights, braking: c.braking, police: c.police, active: patrol(c), indicator: signal?.(c),
                wear: wearSnapshot(c.systems), scrapes: c.scrapes?.length ? c.scrapes.slice(-4).map(mark => ({ ...mark })) : undefined
            };
        });
        const people = actors(source.people.filter(p => !p.onboard), hero, 5, 28).map(p => ({ ...pose(p), id: p.id, role: p.role }));
        // Keep the working door in the shortened (four-car) version of the clip, too.
        const transferIndex = tx ? cars.findIndex(c => c.id === tx.carId) : -1;
        if (transferIndex > 0)
            cars.unshift(cars.splice(transferIndex, 1)[0]);
        const transfer = transferIndex >= 0 ? {
            carId: tx.carId, kind: tx.kind, side: tx.side, phase: round(tx.phase ?? 0), opening: round(tx.opening ?? 1),
            passengerSlide: round(tx.passengerSlide ?? 0), driverSeatWeight: round(tx.driverSeatWeight ?? 1)
        } : undefined;
        const fences = source.props?.filter(p => p.kind === 'picket' && (p.fence || p.broken)).map(p => ({
            id: p.id, x: round(p.x), z: round(p.z), broken: p.broken, fence: fenceDamage(p)
        }));
        this.frames.push({ time: sampleTime, clock, tram: round(tram), wanted, power: power === 'normal' ? undefined : power, freight, hero: pose(hero), driven, transfer, cars, people, fences });
        let first = 0;
        while (this.frames[first].time < time - span)
            first++;
        first = Math.max(first, this.frames.length - maxFrames);
        if (first)
            this.frames.splice(0, first);
        const firstImpact = this.impacts.findIndex(mark => mark.time >= this.frames[0].time);
        if (firstImpact < 0)
            this.impacts.length = 0;
        else if (firstImpact)
            this.impacts.splice(0, firstImpact);
    }
    get duration() { const f = this.frames; return f.length > 1 ? f.at(-1).time - f[0].time : 0; }
    clip() {
        if (this.duration < .8)
            return null;
        const impacts = this.impacts.filter(mark => mark.time <= this.frames.at(-1).time);
        return { v: 1, frames: this.frames.slice(), ...(impacts.length ? { impacts: impacts.map(mark => ({ ...mark })) } : {}) };
    }
}
exports.ReplayRecorder = ReplayRecorder;
const finite = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const validPose = (p) => p && finite(p.x, -1500, 1500) && finite(p.z, -1500, 1500) && finite(p.y, -20, 150) && finite(p.speed, -100, 100) && finite(p.yaw, -80, 80);
const name = (s) => typeof s === 'string' && s.length > 0 && s.length <= 96;
const validImpact = (m) => m && finite(m.time, 0, 365 * 86400) && finite(m.x, -1500, 1500) && finite(m.z, -1500, 1500) &&
    (m.y === undefined || finite(m.y, -20, 150)) && finite(m.strength, 0, 1) && name(m.carId) && (m.otherId === undefined || name(m.otherId)) &&
    (m.crash === undefined || m.crash && ['collision', 'fence'].includes(m.crash.kind) && finite(m.crash.severity, 0, 1) && validCrashDebris(m.crash.debris));
const validMarks = (value) => Array.isArray(value) && value.length <= 4 && value.every(m => m && finite(m.x, -4, 4) && finite(m.z, -5, 5) && finite(m.severity, 0, 1));
function validWear(e) {
    if (!e || typeof e !== 'object' || Array.isArray(e))
        return false;
    const lamps = ['leftLamp', 'rightLamp', 'leftMirror', 'rightMirror', 'plough', 'hood'];
    if (lamps.some(k => e[k] !== undefined && typeof e[k] !== 'boolean'))
        return false;
    if (e.dirt !== undefined && !finite(e.dirt, 0, 1))
        return false;
    if (e.charge !== undefined && !finite(e.charge, 0, 100))
        return false;
    if (e.punctures !== undefined && (!Number.isInteger(e.punctures) || e.punctures < 0 || e.punctures > 15))
        return false;
    if (e.dents !== undefined && (!e.dents || typeof e.dents !== 'object' || Array.isArray(e.dents) ||
        !Object.entries(e.dents).every(([key, v]) => vehicle_road_js_1.bodyPanels.includes(key) && finite(v, 0, 1))))
        return false;
    if (e.wheelDamage !== undefined && (!Array.isArray(e.wheelDamage) || e.wheelDamage.length > 4 || !e.wheelDamage.every(v => finite(v, 0, 1))))
        return false;
    if (e.impressions !== undefined && (!Array.isArray(e.impressions) || e.impressions.length > maxImpressions ||
        !e.impressions.every(p => p && vehicle_road_js_1.bodyPanels.includes(p.panel) && finite(p.x, -4, 4) && finite(p.z, -5, 5) && finite(p.dx, -1, 1) && finite(p.dz, -1, 1) && finite(p.strength, 0, 1))))
        return false;
    if (e.donorDoors !== undefined && (!e.donorDoors || typeof e.donorDoors !== 'object' ||
        !Object.entries(e.donorDoors).every(([key, v]) => ['leftSide', 'rightSide'].includes(key) && typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v))))
        return false;
    return e.patina === undefined || validMarks(e.patina);
}
function validReplay(value) {
    const clip = value;
    if (clip?.v !== 1 || !Array.isArray(clip.frames) || clip.frames.length < 2 || clip.frames.length > maxFrames)
        return false;
    let last = -1;
    for (const f of clip.frames) {
        if (!f || !finite(f.time, 0, 365 * 86400) || f.time <= last || !finite(f.clock, 0, 1439) || !finite(f.tram, -1, 365 * 86400) || !finite(f.wanted, 0, 3) || !validPose(f.hero) || !(f.driven === null || name(f.driven)))
            return false;
        if (f.power !== undefined && !['normal', 'search', 'bell', 'restore'].includes(f.power))
            return false;
        if (f.transfer !== undefined && (!f.transfer || !name(f.transfer.carId) || !['enter', 'exit'].includes(f.transfer.kind) ||
            ![-1, 1].includes(f.transfer.side) || !['phase', 'opening', 'passengerSlide', 'driverSeatWeight'].every(k => finite(f.transfer[k], 0, 1))))
            return false;
        if (f.freight && (!finite(f.freight.position, -1000, 500) || !finite(f.freight.speed, 0, 40) || !finite(f.freight.serial, 1, 999999) || !finite(f.freight.hold, 0, 60) || !finite(f.freight.next, 0, 3)))
            return false;
        if (!Array.isArray(f.cars) || f.cars.length > 8 || !f.cars.every(c => validPose(c) && name(c.id) && sim_types_js_1.vehicleKinds.includes(c.kind) && /^#[0-9a-f]{6}$/i.test(c.color) && finite(c.steer, -1.1, 1.1) && finite(c.health, 0, 100) &&
            (c.wear === undefined || validWear(c.wear)) && (c.scrapes === undefined || validMarks(c.scrapes)) &&
            (c.lean === undefined || c.lean && finite(c.lean.pitch, -.75, .75) && finite(c.lean.roll, -.75, .75)) &&
            (c.indicator === undefined || c.indicator === 'hazard' || c.indicator === 'left' || c.indicator === 'right')))
            return false;
        if (!Array.isArray(f.people) || f.people.length > 5 || !f.people.every(p => validPose(p) && name(p.id) && roles.includes(p.role)))
            return false;
        if (f.fences !== undefined && (!Array.isArray(f.fences) || f.fences.length > 5 || !f.fences.every(p =>
            p && /^fence-[0-4]$/.test(p.id) && finite(p.x, -1500, 1500) && finite(p.z, -1500, 1500) && typeof p.broken === 'boolean' && validFence(p.fence) && p.fence.at <= f.time + .001)))
            return false;
        last = f.time;
    }
    const first = clip.frames[0].time, impacts = clip.impacts;
    if (impacts !== undefined && (!Array.isArray(impacts) || impacts.length > maxImpacts || !impacts.every((mark, i) => validImpact(mark) && mark.time >= first && mark.time <= last && (!i || mark.time >= impacts[i - 1].time))))
        return false;
    return last - first <= span + .002;
}
const replayDuration = (clip) => clip.frames.at(-1).time - clip.frames[0].time;
exports.replayDuration = replayDuration;
const impactSecond = (clip, mark) => clamp(mark.time - clip.frames[0].time, 0, (0, exports.replayDuration)(clip));
exports.impactSecond = impactSecond;
const packedLimit = 125_000, expandedLimit = 710_000;
function trimForStorage(clip) {
    const retained = new Set();
    const { frames } = clip;
    let frame = 0;
    for (const mark of clip.impacts ?? []) {
        while (frame + 1 < frames.length && frames[frame + 1].time <= mark.time)
            frame++;
        retained.add(frame);
        if (frames[frame].time < mark.time && frame + 1 < frames.length)
            retained.add(frame + 1);
    }
    return { ...clip, frames: frames.filter((_, i) => i % 2 === 0 || i === frames.length - 1 || retained.has(i))
            .map(f => ({ ...f, cars: f.cars.slice(0, 4), people: f.people.slice(0, 2) })) };
}
async function packReplay(clip) {
    if (typeof CompressionStream === 'undefined')
        return trimForStorage(clip);
    const raw = new Blob([JSON.stringify(clip)]);
    if (raw.size > expandedLimit)
        return trimForStorage(clip);
    const stream = raw.stream().pipeThrough(new CompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    if (bytes.length * 4 / 3 > packedLimit - 4)
        return trimForStorage(clip);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x4000)
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x4000));
    return { gzip: btoa(binary) };
}
async function unpackReplay(data) {
    if (validReplay(data))
        return data;
    const zip = data?.gzip;
    if (typeof zip !== 'string' || zip.length > packedLimit || typeof DecompressionStream === 'undefined')
        return null;
    try {
        const stream = new Blob([Uint8Array.from(atob(zip), code => code.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream('gzip'));
        const reader = stream.getReader(), decoder = new TextDecoder();
        let size = 0, json = '';
        for (;;) {
            const { done, value } = await reader.read();
            if (done)
                break;
            size += value.length;
            if (size > expandedLimit) {
                await reader.cancel();
                return null;
            }
            json += decoder.decode(value, { stream: true });
        }
        const clip = JSON.parse(json + decoder.decode());
        return validReplay(clip) ? clip : null;
    }
    catch {
        return null;
    }
}
const lerp = (a, b, t) => a + (b - a) * t;
function move(first, second, t) {
    const angle = second.yaw - first.yaw;
    return { ...first, x: lerp(first.x, second.x, t), y: lerp(first.y, second.y, t), z: lerp(first.z, second.z, t),
        speed: lerp(first.speed, second.speed, t), yaw: first.yaw + Math.atan2(Math.sin(angle), Math.cos(angle)) * t };
}
function replayAt(clip, seconds) {
    const { frames } = clip, time = frames[0].time + clamp(seconds, 0, (0, exports.replayDuration)(clip));
    let left = 0, right = frames.length - 1;
    while (right - left > 1) {
        const mid = (right + left) >> 1;
        if (frames[mid].time <= time)
            left = mid;
        else
            right = mid;
    }
    const a = frames[left], b = frames[right], t = (time - a.time) / (b.time - a.time), closest = t < .5 ? a : b;
    const decode = (list, first, second) => list.map(actor => {
        const start = first.find(p => p.id === actor.id), end = second.find(p => p.id === actor.id);
        return start && end ? move({ ...actor, ...pose(start) }, end, t) : actor;
    });
    const cars = closest.cars.map(actor => {
        const start = a.cars.find(p => p.id === actor.id), end = b.cars.find(p => p.id === actor.id);
        if (!start || !end)
            return actor;
        const visual = t >= 1 ? end : start;
        const lean = start.lean || end.lean ? {
            pitch: lerp(start.lean?.pitch ?? 0, end.lean?.pitch ?? 0, t), roll: lerp(start.lean?.roll ?? 0, end.lean?.roll ?? 0, t)
        } : undefined;
        return move({ ...actor, ...pose(start), wear: visual.wear, scrapes: visual.scrapes, lean }, end, t);
    });
    const freight = a.freight && b.freight && a.freight.serial === b.freight.serial && closest.freight
        ? { ...closest.freight, position: lerp(a.freight.position, b.freight.position, t), speed: lerp(a.freight.speed, b.freight.speed, t) } : closest.freight;
    const from = a.transfer, to = b.transfer;
    let transfer = closest.transfer && { ...closest.transfer };
    if (from && to && from.carId === to.carId && from.kind === to.kind && from.side === to.side)
        transfer = { ...from, phase: lerp(from.phase, to.phase, t), passengerSlide: lerp(from.passengerSlide, to.passengerSlide, t), driverSeatWeight: lerp(from.driverSeatWeight, to.driverSeatWeight, t) };
    // The simulation switches the stored hero origin from the seat to the chassis centre on ownership change.
    const hero = a.driven === b.driven ? move(a.hero, b.hero, t) : { ...closest.hero };
    const fences = a.fences && b.fences ? b.fences.map(p => p.fence.at <= time ? p : a.fences.find(prior => prior.id === p.id)).filter(Boolean) : closest.fences;
    return { ...closest, time, freight, transfer, tram: a.tram < 0 || b.tram < 0 ? closest.tram : lerp(a.tram, b.tram, t), hero, cars, people: decode(closest.people, a.people, b.people), fences };
}
