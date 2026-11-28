const { test } = require('node:test');
const assert = require('node:assert/strict');
const T = require('../engine/three.module.min.js');
const { createWorldLife } = require('../game/world-life.js');
const { groundHeight, isBlocked } = require('../game/world-layout.js');

function game(t) {
    const noop = () => {};
    const gradient = { addColorStop: noop };
    const painter = new Proxy({ measureText: text => ({ width: String(text).length * 12 }),
        createLinearGradient: () => gradient, createRadialGradient: () => gradient }, {
        get(target, field) { return target[field] ?? noop; }
    });
    const oldDocument = global.document;
    global.document = { createElement: () => ({ getContext: () => painter }) };
    t.after(() => { global.document = oldDocument; });
    const scene = new T.Scene(), indoorScene = new T.Scene(), world = createWorldLife(scene);
    world.restore();
    let menu, saved = 0;
    const c = {
        player: {}, sim: { elapsed: 1, money: 0, tramRider: {}, cars: [] }, follow: { yaw: 0 }, indoorScene,
        weather: { wind: .25, temperature: -2, snow: .1, daylight: .1 }, zone: 'street', dt: .05,
        choose(title, choices, body) { menu = { title, choices, body }; },
        notify() {}, persist() { saved++; }, waitUntil() { return true; }
    };
    function at(x, z, calendarMinutes, zone = 'street', y = groundHeight(x, z)) {
        c.zone = zone;
        c.player = { x, y, z, speed: 0 };
        c.minutes = calendarMinutes % 1440;
        c.calendarMinutes = calendarMinutes;
        world.update(c);
    }
    function act(id) {
        assert.ok(world.actions(c).some(action => action.id === id), 'locally available ' + id);
        world.act(id, c);
        return menu;
    }
    return { world, c, scene, at, act, saves: () => saved };
}

test('world activities have walkable guide points and the crane viewpoint can be entered and left', t => {
    const { world, at, act } = game(t);
    assert.ok(world.guides.length >= 20);
    for (const [label, x, z] of world.guides) {
        assert.ok(Number.isFinite(x) && Number.isFinite(z), label);
        assert.equal(isBlocked(x, z, .30, false, groundHeight(x, z) + .12), false, label);
    }
    const [, x, z] = world.guides.find(([label]) => label.includes('К-14'));
    at(x, z, 1080);
    act('site:port-crane').choices[0].run();
    assert.ok(world.lookout.y > 10);
    assert.ok(Number.isFinite(world.lookout.aim.x));
    at(x + 1.25, z, 1081);
    assert.equal(world.lookout, null);
    at(x, z, 1082);
    act('site:port-crane').choices[1].run();
    act('exit-lookout');
    assert.equal(world.lookout, null);
});

test('tea delivery spans midnight, pays once and resumes the next shift', t => {
    const { world, c, at, act, saves } = game(t);
    at(-99.5, 38.1, 1199);
    act('site:tea-shift').choices[0].run();
    at(10.5, -38.25, 1210);
    assert.match(act('site:tea-stop-0').body, /Спектра/);
    world.restore(JSON.parse(JSON.stringify(world.save())));
    at(42, 21.45, 1449);
    act('site:tea-stop-1');
    at(137, 122.2, 1490);
    assert.match(act('site:tea-stop-2').body, /135 ₽/);
    act('site:tea-stop-2');
    assert.equal(c.sim.money, 135);
    assert.equal(saves(), 4);
    at(-99.5, 38.1, 2599);
    assert.equal(act('site:tea-shift').choices[0].label, 'Взять три термоса');
});

test('the plant exchange, lights and chosen storefront return from a save', t => {
    const { world, scene, at, act } = game(t);
    at(-2.1, -3.30, 1200, 'house', 3.06);
    act('site:plant-shelf').choices[0].run();
    at(-33.2, 3.1, 1210);
    act('site:yard-kiosk').choices[2].run();
    at(20.1, 89.9, 1230);
    act('site:light-birds').choices[0].run();
    world.restore(JSON.parse(JSON.stringify(world.save())));
    assert.deepEqual(world.save().neighbors.plants, [0, null, null]);
    assert.equal(world.save().neighbors.assembled, true);
    assert.equal(world.save().neighbors.kiosk, 'skates');
    at(-34.96, 17, 4050);
    assert.equal(scene.getObjectByName('Подоконник с черенками').children.filter(mesh => mesh.visible).length, 2);
    at(-33.2, 3.1, 4092);
    assert.equal(act('site:yard-kiosk').title, 'Прокат коньков');
});
