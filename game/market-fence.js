"use strict";

const boardCount = 7;
const fallAngle = 1.48;
const legacyFall = { at: 0, from: -fallAngle, angle: fallAngle, side: -1, board: 3 };

function fenceDamage(prop) {
    return prop.fence ?? (prop.broken ? legacyFall : undefined);
}

function validFence(value) {
    return !!value && Number.isFinite(value.at) && value.at >= 0 &&
        Number.isFinite(value.from) && Math.abs(value.from) <= fallAngle &&
        Number.isFinite(value.angle) && value.angle >= .12 && value.angle <= fallAngle &&
        (value.side === -1 || value.side === 1) && Number.isInteger(value.board) && value.board > 0 && value.board < boardCount - 1;
}

function strikeFence(prop, normal, tangent, time, contact, inwardZ) {
    const strength = Math.max(normal, Math.min(2.4, tangent * .32));
    const broken = normal >= 3.1;
    if (prop.broken || strength < .62 || !broken && prop.fence && time - prop.fence.at < .4)
        return;
    const side = Math.sign(inwardZ) || 1;
    const previous = prop.fence, from = previous ? fenceLean(previous, false, time) : 0;
    const angle = broken ? fallAngle : Math.min(.41, Math.max(.13 + strength * .061, previous?.side === side ? previous.angle + .025 : 0));
    const board = Math.max(1, Math.min(boardCount - 2, Math.round(((contact.x - prop.x) / prop.w + .5) * (boardCount - 1))));
    prop.fence = { at: time, angle, side, board, from };
    prop.broken = broken;
}

function fenceLean(damage, broken, now) {
    const age = Math.max(0, now - damage.at), target = damage.side * damage.angle;
    if (!broken)
        return target + (damage.from - target) * Math.exp(-6.8 * age) * Math.cos(14 * age);
    const progress = Math.min(1, age / .48);
    const fall = damage.from + (target - damage.from) * progress * progress;
    const rebound = Math.max(0, age - .48);
    return fall - .085 * damage.side * Math.sin(rebound * 21) * Math.exp(-7.4 * rebound);
}

function fenceFootprint(prop, damage) {
    const span = Math.sin(damage.angle) * prop.h;
    return { x: prop.x, z: prop.z + damage.side * span / 2, w: prop.w, d: prop.d + span,
        h: Math.max(.16, Math.cos(damage.angle) * prop.h) };
}

module.exports = { boardCount, fenceDamage, validFence, strikeFence, fenceLean, fenceFootprint };
