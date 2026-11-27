const test = require('node:test');
const assert = require('node:assert/strict');
const { districtCalendarMinutes, districtMinutes } = require('../game/city-clock.js');
const { GarageLog } = require('../game/garage-log.js');

test('city clock keeps the same hour while tracking the next day for deliveries', () => {
    assert.equal(districtCalendarMinutes(748), 1439);
    assert.equal(districtCalendarMinutes(750), 1440);
    assert.equal(districtMinutes(750), 0);
});

test('skipped days persist without changing the clock offset used by existing systems', () => {
    const garage = new GarageLog({ wait: 1400 });
    const now = (districtMinutes(0) + garage.wait) % 1440;
    garage.setTime(60, now);
    assert.equal((districtMinutes(0) + garage.wait) % 1440, 60);
    assert.ok(garage.calendarWait > 1440);

    garage.pause(24);
    const restored = new GarageLog(garage.save());
    assert.equal(restored.wait, garage.wait);
    assert.equal(restored.calendarWait, garage.calendarWait);
    assert.equal(districtCalendarMinutes(0) + restored.calendarWait, 3 * 1440 + 60);
});
