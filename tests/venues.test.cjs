const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createDistrictVenues } = require('../game/district-venues.js');
const { Residence } = require('../game/residence.js');
const { clearDisc } = require('../game/collision.js');
const { groundHeight } = require('../game/world-layout.js');
const { river, metal } = require('../game/venue-layout.js');
const { passengerPosition } = require('../game/venues-view.js');
const { metalTrack, createMetalTheme } = require('../game/venues-music.js');

function fixture(zone, player, minutes = 18 * 60) {
    const notices = [], notes = [], pins = [];
    const context = {
        zone, player, minutes, calendarMinutes: minutes, sim: { elapsed: 24 }, dt: .05,
        notify: text => notices.push(text), record: text => notes.push(text), addMapPin: (...pin) => pins.push(pin),
        choose(_title, options) { this.choices = options; }
    };
    return { venues: createDistrictVenues(), context, notices, notes, pins };
}

test('the venue entrances, interior saves and exits work with real collision', () => {
    for (const venue of [river, metal]) {
        const residence = new Residence(), outside = { ...venue.door };
        const clear = p => clearDisc(p, .31, groundHeight(p.x, p.z), []);
        assert.equal(clear(outside), true);
        const enter = 'home:door-' + venue.door.zone;
        if (venue === metal) assert.equal(residence.act(enter, outside, 0, clear, metal.opens - 1), null);
        assert.equal(residence.act(enter, outside, 0, clear, metal.opens).text, venue.door.label);
        const reloaded = new Residence();
        reloaded.restore(residence.save());
        assert.equal(reloaded.zone, venue.door.zone);
        assert.ok(reloaded.act('home:exit-annex', outside, 0, clear, metal.closes));
        assert.equal(reloaded.zone, 'street');
        assert.equal(outside.x, venue.door.x);
        assert.equal(outside.z, venue.door.z);
    }
});

test('a delayed river service sends passengers to their actual replacement stops', () => {
    const { venues, context, notices, notes, pins } = fixture(river.door.zone, river.passengers[0]);
    venues.act('schedule', context);
    assert.match(notices.at(-1), /РЕЙС ЗАДЕРЖАН/);
    venues.act('passenger-0', context);
    context.choices[1].run();
    assert.equal(venues.save().station.routes[0], null);
    assert.equal(pins.length, 0);

    for (const [i, passenger] of river.passengers.entries()) {
        context.player = passenger;
        venues.act('passenger-' + i, context);
        context.choices[passenger.route === 'bus' ? 0 : 1].run();
    }
    assert.equal(notes.length, 1);
    assert.deepEqual(pins.map(pin => pin.slice(0, 2)), [[river.bus.x, river.bus.z], [river.taxi.x, river.taxi.z], [river.bus.x, river.bus.z]]);

    const restored = createDistrictVenues(), saved = venues.save();
    restored.restore(saved);
    assert.deepEqual(restored.save(), saved);
    const passenger = river.passengers[0], route = saved.station.routes[0];
    assert.ok(passengerPosition(passenger, route, route.at + 1, 0, true).speed > 0);
    assert.equal(passengerPosition(passenger, route, route.at + 12, 0, true), null);
    const atStop = passengerPosition(passenger, route, route.at + 12, 0, false);
    assert.ok(Math.hypot(atStop.x - river.bus.x, atStop.z - river.bus.z) < 1.2);

    context.calendarMinutes += 1440;
    assert.ok(restored.actions(context).some(action => action.id === 'passenger-2'));
});

test('a rehearsal recording becomes a radio piece after preparation and playback', () => {
    const { venues, context, notes } = fixture(metal.door.zone, metal.leader);
    venues.act('leader', context);
    for (const [i, position] of metal.stands.entries()) {
        context.player = position;
        venues.act('stand-' + i, context);
    }
    context.player = metal.leader;
    venues.act('record', context);
    context.sim.elapsed += 5;
    venues.update(context);
    assert.ok(!venues.actions(context).some(action => action.id === 'send'));
    context.sim.elapsed += 4;
    venues.update(context);
    venues.act('send', context);
    assert.equal(notes.length, 1);
    assert.deepEqual(venues.radio(context), []);

    const restored = createDistrictVenues();
    restored.restore(venues.save());
    context.sim.elapsed += 12;
    assert.equal(restored.radio(context)[0].id, metalTrack);
    const audio = { createBuffer(_channels, length) { const samples = new Float32Array(length); return { getChannelData: () => samples }; } };
    const hall = createMetalTheme(audio).getChannelData(0), radio = createMetalTheme(audio, 'radio').getChannelData(0);
    assert.ok(hall.some(sample => sample > .1));
    assert.equal(hall.length, radio.length);
    assert.ok(radio.some((sample, i) => Math.abs(sample - hall[i]) > .025));
});
