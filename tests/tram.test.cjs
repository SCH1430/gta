const test = require('node:test');
const assert = require('node:assert/strict');
const { tramRoute } = require('../game/tram-navigation.js');
const { TramRider, linePose, tramStops, serviceStart } = require('../game/world-railway.js');

function findRide(board, exit) {
    for (let time = Math.ceil(serviceStart); time < serviceStart + 260; time++) {
        const pose = linePose(time);
        if (pose.line === '07' && pose.stop === board && pose.nextStop === exit && pose.elapsedAtStop >= 2)
            return time;
    }
    throw new Error('Scheduled tram did not reach ' + board);
}

for (const [board, exit, start, end] of [
    ['depot', 'market', { x: 7.58, z: -55 }, { x: 17.05, z: 40 }],
    ['market', 'depot', { x: 17.05, z: 40 }, { x: 7.58, z: -55 }],
]) {
    test('Remaining walking and rail distance, ' + board + ' to ' + exit, () => {
        const hero = { ...tramStops[board] };
        const initial = tramRoute(start, end);
        assert.equal(initial.plan.board, board);
        let route = tramRoute(hero, end, null, initial);
        assert.equal(route.phase, 'approach');
        assert.ok(route.walkMetres < initial.walkMetres);
        assert.equal(route.metres, initial.metres);
        assert.ok(route.metres > 0);

        const rider = new TramRider();
        const departure = findRide(board, exit);
        rider.act(hero, departure, () => true);
        assert.equal(rider.onboard, true);
        route = tramRoute(hero, end, departure, route);
        assert.equal(route.phase, 'ride');
        assert.equal(route.metres, initial.metres);

        let sawIntermediateDistance = false;
        let lastDistance = route.metres;
        for (let time = departure + 1; time <= departure + 40; time++) {
            rider.update(1, hero, time, () => true);
            route = tramRoute(hero, end, time, route);
            assert.equal(route.plan, initial.plan);
            assert.ok(route.metres <= lastDistance);
            lastDistance = route.metres;
            if (route.metres > 0 && route.metres < initial.metres)
                sawIntermediateDistance = true;
            if (linePose(time).stop === exit && linePose(time).doors > .8) {
                rider.act(hero, time, () => true);
                break;
            }
        }
        assert.equal(sawIntermediateDistance, true);
        assert.equal(route.metres, 0);
        assert.equal(rider.onboard, false);

        route = tramRoute(hero, end, null, route);
        assert.equal(route.phase, 'walk');
        assert.equal(route.metres, 0);
        assert.ok(route.walkMetres > 0);
        const arrived = tramRoute(end, end, null, route);
        assert.equal(arrived.plan, initial.plan);
        assert.equal(arrived.metres + arrived.walkMetres, 0);
        assert.equal(arrived.available, true);
    });
}

test('A pedestrian near the rails keeps the chosen stops and can finish on foot', () => {
    const { depot, market } = tramStops;
    let route = tramRoute(depot, market);
    const plan = route.plan;
    route = tramRoute({ x: 5, z: -12 }, market, null, route);
    assert.equal(route.plan, plan);
    assert.equal(route.phase, 'approach');
    assert.ok(route.metres > 0);
    route = tramRoute(market, market, null, route);
    assert.equal(route.phase, 'walk');
    assert.equal(route.metres + route.walkMetres, 0);
});
