const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ShiftJournal, orders, documentSheet } = require('../game/shift-journal.js');
const { views, approach } = require('../game/notebook-atlas.js');
const { schoolOutside } = require('../game/school-site.js');
const { routeTo } = require('../game/ui-navigation.js');
const { marketOpen } = require('../game/market-hours.js');

test('school exit, tram corner and market give one opening sequence across reloads', () => {
    const sim = { home: { inside:true }, player:{ ...schoolOutside }, stage:0, mission:0 };
    let journal = new ShiftJournal();
    assert.ok(journal.order(0,1065));
    assert.equal(journal.walk(sim,1065), undefined);
    sim.home.inside = false;
    assert.ok(journal.walk(sim,1066).route);
    const path = routeTo(sim.player,{x:30,z:26},'walk').path;
    assert.ok(path.length > 2 && Math.hypot(path.at(-1).x-30,path.at(-1).z-26)<1.6);
    journal = new ShiftJournal(JSON.parse(JSON.stringify(journal.save())));
    assert.equal(journal.order(0,1067),false);
    assert.deepEqual(journal.walk(sim,1067), { route:true });
    assert.equal(journal.walk(sim,1067),undefined);
    sim.player = {x:15,z:26};
    assert.ok(journal.walk(sim,1075).bell);
    sim.player = {x:30,z:26};
    assert.ok(journal.walk(sim,1076).arrived);
    assert.equal(journal.walk(sim,1077),undefined);
    assert.deepEqual(journal.messages.map(m=>m.from), ['Семён','Инна']);
    assert.equal(marketOpen(1076),true);
    assert.equal(marketOpen(1080),false);
    assert.equal(marketOpen(6*60+5),false);
    assert.equal(marketOpen(1440+6*60+5),true);
});

test('orders carry shift paperwork and photographed places have navigable addresses', () => {
    const journal=new ShiftJournal();
    for (let index=0; index<3; index++) {
        assert.ok(journal.order(index,1065+index));
        assert.ok(documentSheet(index,'Заказ',1800,false,String).includes(orders[index].form));
        assert.equal(new ShiftJournal(journal.save()).order(index,1069),false);
    }
    for (const view of views) {
        const [x,z]=view.eye;
        assert.ok(approach({x,z}).length>10);
    }
});

test('a late first shift can pick up the relay outside the shutter after saving', () => {
    const { Simulation } = require('../game/sim.js');
    const source = new Simulation();
    source.home.avatar = null;
    source.elapsed = 330;
    Object.assign(source.hero, { x:30, z:26, y:0 });
    const sim = new Simulation(source.snapshot());
    assert.equal(marketOpen(sim.cityCalendarMinutes),false);
    const journal = new ShiftJournal({opening:2});
    assert.ok(journal.walk(sim,sim.cityCalendarMinutes).route);
    assert.match(journal.walk(sim,sim.cityCalendarMinutes).text,/Выдача/);
    const label = 'Забрать реле у Инны';
    assert.ok(sim.interactionOptions().includes(label));
    sim.interact(label);
    assert.equal(sim.exchange?.role,'vendor');
    sim.updateExchange(5);
    assert.equal(sim.stage,1);
});
