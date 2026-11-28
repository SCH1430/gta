const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPerson, cabinAppearance } = require('../game/model-people.js');
const { groundHeight, surfaceAt } = require('../game/world-layout.js');
const { seatedJacketGeometry } = require('../game/human-cloth.js');

test('hand geometry fits the cup and the handle, then switches back to the cached resting shape', () => {
    const person = createPerson('hero');
    const left = person.root.getObjectByName('left-elbow').getObjectByName('winter-glove');
    const right = person.root.getObjectByName('right-elbow').getObjectByName('winter-glove');
    const rest = right.geometry, leftRest = left.geometry;
    person.update(.04, 0, false, { carry: 'cup' });
    const cup = right.geometry;
    assert.notEqual(cup, rest);
    assert.equal(left.geometry, leftRest);
    person.update(.04, 0, false, { carry: 'crate' });
    assert.notEqual(right.geometry, cup);
    assert.notEqual(left.geometry, leftRest);
    person.update(.04, 0);
    assert.equal(right.geometry, rest);
    person.update(.04, 0, false, { carry: 'cup' });
    assert.equal(right.geometry, cup);
});

test('winter layers stay on the base model while seat folds and packed snow change with the pose', () => {
    const person = createPerson('hero'), jacket = cabinAppearance('hero').torso;
    assert.ok(jacket.getObjectByName('rib-knit-inner-collar'));
    assert.ok(jacket.getObjectByName('personal-kit-with-fastener'));
    assert.ok(person.root.getObjectByName('rib-knit-cuff'));
    const position = jacket.geometry.getAttribute('position');
    const seated = seatedJacketGeometry(jacket.geometry).getAttribute('position');
    assert.notDeepEqual(seated.array, position.array);
    assert.ok(seated.array.every(Number.isFinite));

    const x = -40, z = 55;
    assert.equal(surfaceAt(x, z), 'snow');
    person.root.position.set(x, groundHeight(x, z), z);
    for (let i = 0; i < 3; i++)
        person.update(.12, 0, false, { wetness: .8 });
    const frost = person.root.getObjectByName('snow-packed-sole');
    assert.equal(frost.visible, true);
    for (let i = 0; i < 30; i++)
        person.update(.12, 0);
    assert.equal(frost.visible, false);
});

test('street outerwear and loaded backpacks vary by wardrobe identity', () => {
    const wool = createPerson('resident', 1), waxed = createPerson('resident', 0);
    wool.update(.04, 0);
    waxed.update(.04, 0);
    assert.ok(waxed.root.getObjectByName('winter-outerwear').material.shininess > wool.root.getObjectByName('winter-outerwear').material.shininess);
    const pack = variant => createPerson('resident', variant).root.getObjectByName('commuter-backpack').geometry.boundingSphere.radius;
    const folded = pack(4), folder = pack(11), full = pack(7);
    assert.ok(folded < folder && folder < full);
});
