const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FrameClock, GraphicsQuality } = require('../game/graphics-quality.js');
const { PopulationPerformance } = require('../game/population-performance.js');

const desktop = { coarse: false, software: false, ratio: 1, width: 800, height: 600 };

function runFrames(hz, seconds, onFrame) {
    const clock = new FrameClock(0);
    for (let tick = 1; tick <= hz * seconds; tick++) {
        const elapsed = clock.take(tick * 1000 / hz, true);
        if (elapsed !== null)
            onFrame(elapsed);
    }
}

test('battery mode averages 30 FPS and advances simulation by the actual elapsed time', () => {
    for (const hz of [30, 60, 72, 75, 90, 120, 144, 165]) {
        let frames = 0, seconds = 0;
        runFrames(hz, 120, elapsed => {
            frames++;
            seconds += elapsed;
        });
        assert.equal(frames, 3600, hz + ' Hz');
        assert.ok(Math.abs(seconds - 120) < .000001, hz + ' Hz');
    }
});

test('an uncapped session uses every tick and returning to battery mode starts a fresh interval', () => {
    const clock = new FrameClock(0);
    assert.equal(clock.take(16, true), null);
    assert.equal(clock.take(20, false), .020);
    assert.equal(clock.take(32, false), .012);
    assert.equal(clock.take(50, true), null);
    assert.equal(clock.take(66, true), .034);
    assert.equal(clock.take(1000, true), .934);
    assert.equal(clock.take(1001, true), null);
    clock.reset(5000);
    assert.equal(clock.take(5010, true), null);
    assert.equal(clock.take(5034, true), .034);
});

test('both effects and population recover after a temporary slowdown at the battery cap', () => {
    for (const hz of [60, 72, 75, 144]) {
        const graphics = new GraphicsQuality('auto', desktop);
        const population = new PopulationPerformance();
        function sample(seconds) {
            const stats = graphics.sample(seconds, 30);
            if (stats)
                population.measure(stats);
        }
        runFrames(18, 10, sample);
        assert.equal(graphics.quality, 0);
        assert.ok(graphics.scale < graphics.ceiling);
        assert.equal(population.pressure, 2);
        runFrames(hz, 120, sample);
        assert.equal(graphics.quality, graphics.effects, hz + ' Hz');
        assert.ok(graphics.scale >= graphics.ceiling - .025);
        assert.equal(population.pressure, 0, hz + ' Hz');
    }
});

test('30 FPS is insufficient for restoring effects while uncapped', () => {
    const graphics = new GraphicsQuality('auto', desktop);
    for (let frame = 0; frame < 180; frame++)
        graphics.sample(1 / 18, 30);
    for (let frame = 0; frame < 900; frame++)
        graphics.sample(1 / 30, 60);
    assert.equal(graphics.quality, 0);
    for (let frame = 0; frame < 7200; frame++)
        graphics.sample(1 / 60, 60);
    assert.equal(graphics.quality, graphics.effects);
});
