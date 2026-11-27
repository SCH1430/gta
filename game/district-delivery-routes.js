"use strict";
const { aim, dist, lerp } = require("./sim-navigation.js");

const point = (x, z) => ({ x, z });
const at = (a, b, t) => point(lerp(a.x, b.x, t), lerp(a.z, b.z, t));
const approach = point(-944, 116);
const depot = point(-754, -209.5);

function escortRoad(coordinates, title, reward) {
    const corners = coordinates.map(([x, z]) => point(x, z));
    const nodes = [corners[0]], turns = [];
    for (let i = 1; i < corners.length - 1; i++) {
        const prev = corners[i - 1], corner = corners[i], next = corners[i + 1];
        // A short bend stays inside the junction while keeping the van in its lane.
        const radius = Math.min(5.4, dist(corner, prev) * .65, dist(corner, next) * .65);
        const before = at(corner, prev, radius / dist(corner, prev));
        const after = at(corner, next, radius / dist(corner, next));
        const enter = nodes.length;
        for (let step = 0; step <= 8; step++) {
            const t = step / 8;
            nodes.push(at(at(before, corner, t), at(corner, after, t), t));
        }
        turns.push({ enter, exit: nodes.length - 1 });
    }
    nodes.push(corners.at(-1));
    const starts = [0];
    for (let i = 1; i < nodes.length; i++)
        starts.push(starts.at(-1) + dist(nodes[i - 1], nodes[i]));
    const length = starts.at(-1);
    function position(s) {
        const clamped = Math.max(0, Math.min(length, s));
        const i = Math.min(nodes.length - 2, starts.findLastIndex(start => start <= clamped));
        return at(nodes[i], nodes[i + 1], (clamped - starts[i]) / (starts[i + 1] - starts[i]));
    }
    return {
        title, reward, length,
        at(s) { return { ...position(s), yaw: aim(position(s - .45), position(s + .45)) }; },
        speedLimit(s) {
            const turn = turns.find(({ exit }) => s < starts[exit]);
            const distance = Math.min(length - s, turn ? starts[turn.enter] - s : Infinity);
            return Math.min(14, Math.sqrt(24 + Math.max(0, distance) * 5));
        }
    };
}

const routes = {
    direct: escortRoad([
        [-942.05, 107], [-942.05, -101.05], [-862.05, -101.05],
        [-862.05, -202.05], [-754, -202.05], [depot.x, depot.z]
    ], 'Вагонный мост', 850),
    detour: escortRoad([
        [-937, 113.95], [-442.05, 113.95], [-442.05, -271.95],
        [-717.95, -271.95], [-717.95, -205.95], [-754, -205.95], [depot.x, depot.z]
    ], 'Карьерный мост и Сортировочное шоссе', 1200)
};

exports.approach = approach;
exports.depot = depot;
exports.routes = routes;
