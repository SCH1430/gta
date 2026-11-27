const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Scene } = require('../engine/three.module.min.js');
const { createDistrictOutskirts, guides, hockey, scoreBoard, dam, waterSchedule, waterPhase } = require('../game/district-outskirts.js');

function outing(place, minutes) {
    const messages = [], notes = [], pins = [];
    const frame = {
        player: { ...place, speed: 0 }, zone: 'street', minutes, dt: 0,
        sim: { wanted: false },
        choose(title, items) { this.menu = { title, items }; },
        notify: text => messages.push(text),
        record: text => notes.push(text),
        addMapPin: (...pin) => pins.push(pin),
        waitUntil(next) { this.minutes = next; return true; },
        persist() { this.saved = true; }
    };
    return { frame, messages, notes, pins };
}

test('The rink signs lead to a three-shot evening session and results survive a reload', () => {
    const activity = createDistrictOutskirts();
    const { frame, messages, notes, pins } = outing({ x: guides[0][1], z: guides[0][2] }, 17 * 60 + 50);
    assert.equal(activity.act('hockey-sign', frame), true);
    assert.deepEqual(pins, [[hockey.x, hockey.z + hockey.launch, guides[1][0]]]);

    frame.player = { x: hockey.x, z: hockey.z + hockey.launch, speed: 0 };
    assert.equal(activity.act('hockey-start', frame), true);
    assert.match(frame.menu.title, /18:00/);
    frame.menu.items[0].run();
    assert.equal(frame.minutes, 18 * 60);
    assert.equal(activity.act('hockey-start', frame), true);
    frame.menu.items[0].run();

    // The first right-hand shot meets the moving blocker; the next two score.
    const lanes = [hockey.lanes[2], hockey.lanes[1], hockey.lanes[2]];
    for (let i = 0; i < lanes.length; i++) {
        frame.player.x = hockey.x + lanes[i];
        assert.match(activity.actions(frame)[0].label, new RegExp(`${i + 1}/3`));
        assert.equal(activity.act('hockey-shot', frame), true);
        assert.equal(activity.act('hockey-shot', frame), false);
        activity.update({ ...frame, dt: .4 });
        assert.equal(activity.act('hockey-shot', frame), false);
        activity.update(Object.assign(frame, { dt: .4 }));
    }
    assert.match(messages[1], /Щит отбил шайбу/);
    assert.match(notes.at(-1), /2 из 3/);
    assert.equal(frame.saved, true);
    const saved = activity.save();
    assert.deepEqual(saved.scores, [2]);
    assert.equal(saved.round, null);

    const reloaded = createDistrictOutskirts();
    reloaded.restore({ ...saved, scores: [1, ...saved.scores, 3, 4, '0', -1] });
    assert.deepEqual(reloaded.save().scores, [3, 2, 1]);
    frame.player = { ...scoreBoard };
    assert.equal(reloaded.act('hockey-scores', frame), true);
    assert.match(frame.menu.title, /3\/3 · 2\/3 · 1\/3/);
});

test('The dam has a published schedule, warns before discharge and opens a viewing action on foot', () => {
    assert.deepEqual(waterSchedule, [1110, 1230, 1350]);
    assert.equal(waterPhase(1101), 'idle');
    assert.equal(waterPhase(1102), 'warning');
    assert.equal(waterPhase(1110), 'running');
    assert.equal(waterPhase(1122), 'idle');

    const scene = new Scene();
    const activity = createDistrictOutskirts(scene);
    const pool = scene.getObjectByName('water pool');
    const { frame, notes } = outing(dam, 1102);
    activity.update(frame);
    assert.equal(pool.visible, false);
    const bulletin = activity.radio()[0];
    assert.equal(bulletin.station, 'dispatch');
    assert.match(bulletin.subtitle, /18:30, 20:30, 22:30/);
    assert.equal(activity.act('water-radio', frame), true);
    frame.menu.items[0].run();
    assert.equal(notes.at(-1), bulletin.subtitle);

    assert.equal(activity.act('water-wait', frame), true);
    assert.equal(frame.minutes, 1110);
    activity.update(frame);
    assert.equal(pool.visible, true);
    assert.equal(activity.act('water-watch', { ...frame, car: {} }), false);
    assert.equal(activity.act('water-watch', frame), true);
    assert.equal(activity.act('water-watch', frame), true);
    assert.equal(notes.length, 2);
    assert.equal(activity.save().waterSeen, true);
    frame.minutes = 1122;
    activity.update(frame);
    assert.equal(pool.visible, false);
});
