const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Simulation } = require('../game/sim.js');
const { createDistrictDeliveries } = require('../game/district-deliveries.js');
const { approach, depot, routes } = require('../game/district-delivery-routes.js');
const { weatherAt } = require('../game/weather.js');

const controls = { moveX: 0, moveY: 0, accelerate: 0, brake: 0, steer: 0, handbrake: false, cameraYaw: 0, populationYaw: 0 };
const normalWeather = { snow: 0, roadIce: 0, wind: 0 };
const escortVan = simulation => simulation.cars.find(car => car.districtEscort);

function context() {
    const sim = new Simulation(undefined, 'free-drive');
    const c = {
        sim, car: null, player: sim.hero, zone: 'street', dt: .12,
        minutes: 17 * 60, calendarMinutes: 17 * 60, weather: normalWeather,
        notice: '', choices: [], pins: [], records: [], writes: 0,
        notify(message) { c.notice = message; },
        record(message) { c.records.push(message); },
        choose(title, choices) { c.choices = choices; },
        addMapPin(x, z, label) { c.pins.push({ x, z, label }); },
        persist() { c.writes++; },
        waitUntil(minutes) {
            c.calendarMinutes += (minutes - c.minutes + 1440) % 1440;
            c.minutes = minutes;
            return true;
        },
        ui: { clearRoute() {} }
    };
    return c;
}

function parkAtApproach(c) {
    c.car = c.sim.cars.find(car => car.id === 'garage-hatch');
    Object.assign(c.car, approach, { speed: 0 });
    c.sim.driven = c.car.id;
    c.player = c.car;
}

function placeBehind(c, route, distance, gap) {
    const behind = distance - gap;
    const pose = route.at(Math.max(0, behind));
    if (behind < 0) {
        pose.x -= Math.sin(pose.yaw) * behind;
        pose.z -= Math.cos(pose.yaw) * behind;
    }
    Object.assign(c.car, pose);
    Object.assign(c.sim.hero, pose);
}

for (const [name, choice] of [['direct', 0], ['detour', 1]]) {
    test('shift van drives the ' + name + ' route and the warehouse pays once', () => {
        const c = context();
        let play = createDistrictDeliveries();
        const route = routes[name], money = c.sim.money;
        parkAtApproach(c);
        if (name === 'detour') {
            c.weather = { ...normalWeather, snow: .85 };
            assert.equal(play.act('escort', c), true);
            c.choices[0].run();
            assert.match(c.notice, /заносы/);
            assert.equal(escortVan(c.sim), undefined);
        }
        assert.equal(play.act('escort', c), true);
        c.choices[choice].run();
        assert.equal(play.save().trip.route, name);
        assert.ok(escortVan(c.sim));

        for (let i = 0; i < 75; i++) {
            placeBehind(c, route, 0, 45);
            play.update(c);
        }
        assert.equal(play.save().trip.distance, 0);

        let reloaded = false;
        for (let frame = 0; frame < 2400; frame++) {
            const distance = play.save().trip.distance;
            if (distance >= route.length)
                break;
            placeBehind(c, route, distance, 12);
            c.sim.tick(c.dt, controls);
            c.weather = weatherAt(c.sim.elapsed, c.minutes);
            play.update(c);
            if (!reloaded && distance > 80) {
                reloaded = true;
                const next = createDistrictDeliveries();
                next.restore(JSON.parse(JSON.stringify(play.save())));
                c.sim = new Simulation(c.sim.snapshot());
                c.car = c.sim.activeCar();
                c.player = c.car;
                play = next;
                assert.equal(escortVan(c.sim), undefined);
            }
        }
        assert.equal(reloaded, true);
        assert.equal(play.save().trip.distance, route.length);
        assert.ok(Math.hypot(escortVan(c.sim).x - depot.x, escortVan(c.sim).z - depot.z) < .05);
        placeBehind(c, route, route.length, 8);
        c.car.speed = 0;
        assert.equal(play.act('escort-finish', c), true);
        assert.equal(play.act('escort-finish', c), false);
        assert.equal(c.sim.money, money + route.reward);
        assert.equal(play.save().escorted, name);
    });
}

test('night post saves progress through three addresses and posts the cafe notice the following morning', () => {
    const c = context();
    let play = createDistrictDeliveries();
    Object.assign(c.player, { x: 141.3, z: -18.2, speed: 0 });
    const money = c.sim.money;
    assert.equal(play.act('post-sort', c), false);
    assert.equal(play.act('post-night', c), true);
    assert.equal(c.minutes, 21 * 60);
    assert.equal(play.act('post-sort', c), true);
    c.choices[0].run();
    assert.equal(play.save().mailCount, 0);
    assert.match(c.notice, /вернула/);
    c.choices[1].run();
    assert.equal(play.save().mailCount, 1);

    const resumed = createDistrictDeliveries();
    resumed.restore(JSON.parse(JSON.stringify(play.save())));
    play = resumed;
    assert.equal(play.act('post-sort', c), true);
    c.choices[2].run();
    assert.equal(play.act('post-sort', c), true);
    c.choices[0].run();
    assert.equal(play.save().mailCount, 3);
    assert.equal(c.sim.money, money + 120);
    const queued = play.save();
    assert.equal(queued.sorted.due, 1440 + 7 * 60);
    assert.equal(queued.sorted.delivered, false);

    const morning = createDistrictDeliveries();
    morning.restore(queued);
    Object.assign(c.player, { x: -98.7, z: 38.84, speed: 0 });
    c.minutes = 6 * 60 + 59;
    c.calendarMinutes = 1440 + c.minutes;
    morning.update(c);
    assert.equal(morning.act('cafe-board', c), false);
    assert.equal(morning.act('post-morning', c), true);
    morning.update(c);
    assert.equal(morning.save().sorted.delivered, true);
    assert.equal(c.writes, 1);
    assert.equal(morning.act('cafe-board', c), true);
    assert.match(c.notice, /завтрак для смены/i);
    assert.equal(morning.save().sorted.seen, true);
    morning.update(c);
    assert.equal(c.writes, 1);
});
