"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soleHeight = exports.toePivot = exports.heelPivot = void 0;
exports.cyclePose = cyclePose;
exports.armPose = armPose;
exports.supportPitch = supportPitch;
exports.swingArc = swingArc;
exports.swingTravel = swingTravel;
const walkArms = [-.405, -.31, -.07, .20, .37, .26, .05, -.24];
const runArms = [-1.02, -.88, -.29, .41, .80, .67, .13, -.51];
const walkElbows = [.22, .19, .20, .26, .33, .30, .23, .19];
const runElbows = [.95, .88, .99, 1.17, 1.38, 1.37, 1.25, 1.06];
const pelvisSweep = [-.117, -.084, -.008, .081, .117, .084, .008, -.081];
const chestSweep = [.113, .082, .014, -.072, -.113, -.082, -.014, .072];
const weightWalk = [-.005, -.033, -.044, -.022, .005, .033, .044, .022];
const pelvicRoll = [-.008, -.027, -.039, -.018, .008, .027, .039, .018];
// The pelvis yields just after contact and rises over the supporting leg.
const walkHeight = [-.004, -.016, .010, .004, -.004, -.016, .010, .004];
const runHeight = [-.006, -.033, .012, .029, -.006, -.033, .012, .029];
const walkPitch = [.023, .037, .010, -.012, .023, .037, .010, -.012];
const runPitch = [-.014, .045, .022, -.027, -.014, .045, .022, -.027];
const runWeight = [.001, -.011, -.017, -.007, -.001, .011, .017, .007];
exports.heelPivot = .075;
exports.toePivot = -.162;
exports.soleHeight = .004;
const slope = (a, b) => a * b <= 0 ? 0 : 2 * a * b / (a + b);
function sample(keys, phase) {
    const time = (phase - Math.floor(phase)) * 8, i = Math.floor(time), t = time - i, t2 = t * t, t3 = t2 * t;
    const a = keys[i], b = keys[(i + 1) % 8];
    const m = slope(a - keys[(i + 7) % 8], b - a), n = slope(b - a, keys[(i + 2) % 8] - b);
    return a + (b - a) * (3 * t2 - 2 * t3) + m * (t3 - 2 * t2 + t) + n * (t3 - t2);
}
const blend = (a, b, t) => a + (b - a) * t;
const emptyCycle = () => ({ weight: 0, pelvisYaw: 0, pelvisRoll: 0, chestYaw: 0, height: 0, pitch: 0 });
function cyclePose(phase, run, out = emptyCycle()) {
    out.weight = blend(sample(weightWalk, phase), sample(runWeight, phase), run);
    out.pelvisYaw = sample(pelvisSweep, phase) * (1 + .18 * run);
    out.pelvisRoll = sample(pelvicRoll, phase) * (1 - .35 * run);
    out.chestYaw = sample(chestSweep, phase) * (1 + .50 * run);
    out.pitch = blend(sample(walkPitch, phase), sample(runPitch, phase), run);
    out.height = blend(sample(walkHeight, phase), sample(runHeight, phase), run);
    return out;
}
function armPose(phase, run, out = { swing: 0, elbow: 0 }) {
    out.swing = blend(sample(walkArms, phase), sample(runArms, phase + .055), run);
    out.elbow = blend(sample(walkElbows, phase), sample(runElbows, phase + .085), run);
    return out;
}
const ease = (t) => t * t * (3 - 2 * t);
const unit = (t) => Math.max(0, Math.min(1, t));
function supportPitch(progress, run) {
    const heel = .24 * (1 - run * .94) * (1 - ease(unit(progress / .23)));
    const toe = (.34 + .23 * run) * ease(unit((progress - .54) / .46));
    return heel - toe;
}
function swingArc(u, run, out = { up: 0, trail: 0, pitch: 0 }) {
    const t = Math.max(0, Math.min(1, u)), fade = Math.sin(Math.PI * t);
    const heel = 6.75 * t * (1 - t) * (1 - t);
    const rise = 6.75 * t * t * (1 - t);
    out.up = blend(.039 * fade + .032 * rise, heel * .238 + fade * .071, run);
    out.trail = heel * blend(.041, .22, run);
    out.pitch = blend(-.34 - .23 * run, .24 * (1 - run * .94), ease(unit((t - .10) / .80))) - heel * (.06 + .14 * run);
    return out;
}
function hermite(a, b, m, n, t) {
    const t2 = t * t;
    return a + (b - a) * t2 * (3 - 2 * t) + m * t * (1 - t) * (1 - t) - n * t2 * (1 - t);
}
function swingTravel(u, stride, duty, leadPart) {
    const airDistance = (1 - duty) * stride;
    const rear = -(1 - leadPart) * duty * stride, front = leadPart * duty * stride;
    const backAt = .125, frontAt = .84;
    const back = rear - Math.min(.087, airDistance * backAt * .46);
    const reach = front + Math.min(.126, airDistance * (1 - frontAt) * .43);
    let forward;
    if (u < backAt)
        forward = hermite(rear, back, -airDistance * backAt, 0, u / backAt);
    else if (u < frontAt)
        forward = hermite(back, reach, 0, 0, (u - backAt) / (frontAt - backAt));
    else
        forward = hermite(reach, front, 0, -airDistance * (1 - frontAt), (u - frontAt) / (1 - frontAt));
    return unit((forward - rear + u * airDistance) / stride);
}
