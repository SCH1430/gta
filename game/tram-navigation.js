"use strict";

const { routeTo, advanceRoute } = require('./ui-navigation.js');
const { tramStops, stopMetres, railAt, linePose } = require('./world-railway.js');

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
}

function planJourney(start, end, onboard) {
    const { depot, market } = tramStops;
    const forward = onboard
        ? distance(end, market) < distance(end, depot)
        : distance(start, depot) + distance(end, market) < distance(start, market) + distance(end, depot);
    const board = forward ? 'depot' : 'market';
    const exit = forward ? 'market' : 'depot';
    return { board, exit, finalWalk: routeTo(tramStops[exit], end, 'walk') };
}

function remainingWalk(at, end, previous) {
    if (distance(at, end) < 1)
        return { path: [end], metres: 0 };
    return (previous && advanceRoute(previous, at, 'walk')) ?? routeTo(at, end, 'walk');
}

function trackBetween(from, to) {
    const segments = Math.ceil(Math.abs(to - from) / 1.5);
    const path = [railAt(from)];
    for (let i = 1; i <= segments; i++)
        path.push(railAt(from + (to - from) * i / segments));
    return path;
}

function tramRoute(at, end, tramTime = null, previous = null) {
    const onboard = Number.isFinite(tramTime);
    const plan = previous?.plan ?? planJourney(at, end, onboard);
    const board = tramStops[plan.board], exit = tramStops[plan.exit];
    const exitMetres = stopMetres[plan.exit];
    if (onboard) {
        const current = linePose(tramTime).trackMetres;
        return { plan, phase: 'ride', path: [], tram: trackBetween(current, exitMetres), lastMile: plan.finalWalk.path,
            metres: Math.round(Math.abs(exitMetres - current)), walkMetres: plan.finalWalk.metres, available: !!plan.finalWalk.path.length };
    }

    // Stepping back onto the boarding platform keeps the original itinerary.
    const leftTram = previous?.phase === 'ride' && distance(at, board) > 2.75;
    if (previous?.phase === 'walk' || leftTram || distance(at, exit) <= 2.75 || distance(at, end) < 1) {
        const walk = remainingWalk(at, end, previous?.phase === 'walk' ? previous.walk : plan.finalWalk);
        return { plan, phase: 'walk', walk, path: [], tram: [], lastMile: walk.path,
            metres: 0, walkMetres: walk.metres, available: !!walk.path.length };
    }

    const walk = remainingWalk(at, board, previous?.phase === 'approach' ? previous.walk : null);
    const from = stopMetres[plan.board];
    const tram = previous?.phase === 'approach' ? previous.tram : trackBetween(from, exitMetres);
    return { plan, phase: 'approach', walk, path: walk.path, tram, lastMile: plan.finalWalk.path,
        metres: Math.round(Math.abs(exitMetres - from)), walkMetres: walk.metres + plan.finalWalk.metres,
        available: !!(walk.path.length && plan.finalWalk.path.length) };
}

exports.tramRoute = tramRoute;
