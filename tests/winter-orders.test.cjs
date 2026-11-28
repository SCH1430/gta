const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Simulation } = require('../game/sim.js');
const { errands, createErrands } = require('../game/winter-errands.js');
const { createWinterShifts, guides, shiftState } = require('../game/winter-shifts.js');
const { createDistrictVenues } = require('../game/district-venues.js');
const { passengerPosition } = require('../game/venues-view.js');
const { river } = require('../game/venue-layout.js');
const { groundHeight, isBlocked } = require('../game/world-layout.js');
const { routeTo } = require('../game/ui-navigation.js');
const { clearDisc } = require('../game/collision.js');

test('three campaign orders use the relay, charged battery and audible shift recording', () => {
    let sim = new Simulation(undefined,'free-drive');
    const at = (point, dx=0,dz=0) => Object.assign(sim.hero,{x:point.x+dx,z:point.z+dz,y:0,speed:0});
    const action = label => {
        assert.ok(sim.interactionOptions().includes(label),label);
        sim.interact(label);
    };
    for (const [role,label] of [['vendor','Забрать реле у Инны'],['dispatcher','Передать реле путейцу']]) {
        const actor = sim.people.find(n=>n.role===role);
        at(actor,.75,.65);
        action(label);
        assert.equal(sim.exchange.role,role);
        sim.updateExchange(3);
    }
    sim.tramTime=7;
    sim.step(.025,{moveX:0,moveY:0,steer:0,throttle:0,cameraYaw:0});
    assert.equal(sim.mission,1);
    let van = sim.cars.find(c=>c.id==='service-van');
    at(van,1.6,0);
    sim.enter(van);
    assert.equal(sim.transition,null);
    action('Проверить стартер');
    const saved = sim.core();
    sim = new Simulation(saved);
    assert.equal(sim.stage,1);
    const old = {...saved}; delete old.winterOrders;
    assert.equal(new Simulation(old).stage,3);
    at(sim.target()); action('Забрать аккумулятор');
    van = sim.cars.find(c=>c.id==='service-van');
    at(van,1.6,0); action('Установить аккумулятор');
    assert.ok(van.health >= 72);
    Object.assign(van,sim.target(),{speed:0}); sim.driven=van.id;
    at(van); action('Сдать фургон');
    sim.driven=null;
    at(sim.target()); action('Забрать запись смены');
    assert.equal(sim.wanted,0);
    at(sim.target()); action('Прослушать переговоры');
    assert.ok(sim.events.some(event => event.clip === 'shift-siding'));
    assert.equal(sim.target().x,115);
    at(sim.target()); action('Сверить номер вагона');
    assert.equal(sim.mission,3);
    assert.equal(sim.money,7800);
});

function context() {
    const c = {zone:'street', player:{x:0,z:0},sim:{money:0,elapsed:0,cars:[]}, dt:.05,
        weather:{temperature:-5},minutes:1020,calendarMinutes:1020,notes:[],pins:[],messages:[],choices:[],
        record(t){this.notes.push(t);},addMapPin(...pin){this.pins.push(pin);},notify(t){this.messages.push(t);},
        choose(_title,options,body){this.choices=options;this.body=body;},persist(){},
        waitUntil(n){this.calendarMinutes += (1440+n-this.minutes)%1440; this.minutes=n; return true;} };
    return c;
}
test('all seven errands survive reload at each step and reward once after local actions', () => {
    let winter = createWinterShifts();
    const c = context();
    for (const job of errands) {
        for (const [i,s] of job.steps.entries()) {
            c.player={x:s.x,z:s.z}; c.car=null;
            c.minutes=c.calendarMinutes=job.id==='post'?1270:1020;
            if (job.id==='glass' && i>=1) {
                c.car={id:'carry',kind:'van',speed:0,x:s.x,z:s.z};
                c.sim.cars=[c.car];
            }
            assert.ok(winter.actions(c).some(a=>a.id===job.id),s.label);
            winter.act(job.id,c);
            if (s.quiz) {
                c.choices.find(opt=>opt.label===s.quiz.wrong).run();
                assert.equal(winter.save().errands.stages[job.id],i);
                c.choices.find(opt=>opt.label===s.quiz.right).run();
            }
            const saved=winter.save();
            assert.equal(saved.errands.stages[job.id],i+1);
            winter=createWinterShifts(); winter.restore(JSON.parse(JSON.stringify(saved)));
            assert.deepEqual(winter.save(),saved);
        }
        winter.act(job.id,c);
        assert.ok(!winter.agenda(c).some(a=>a.title===job.title));
    }
    assert.equal(c.sim.money,errands.reduce((total,job)=>total+job.pay,0));
    assert.ok(c.pins.length>10);
});

test('winter errands have reachable approaches and the sample expires at the next shift', () => {
    for(const [label,x,z] of [...guides,...errands.flatMap(j=>j.steps.map(s=>[s.label,s.x,s.z]))]) {
        const target = routeTo({x:-32,z:28},{x,z},'walk').path.at(-1);
        assert.ok(target && Math.hypot(x-target.x,z-target.z)<1.55,label);
        assert.equal(isBlocked(x,z,.30,false,groundHeight(x,z)+.12),false,label);
    }
    const c=context(), winter=createWinterShifts(), [start,end]=errands.find(j=>j.id==='water').steps;
    c.player=start; winter.act('water',c);
    c.minutes=1140;c.calendarMinutes=1140;c.player=end;
    winter.act('water',c);
    assert.equal(winter.save().errands.stages.water,0);
    assert.equal(c.sim.money,0);
});

test('winter schedules alter service, shift traffic, board results and the physical thaw barrier', () => {
    const c=context(), errands=createErrands(), wt=createWinterShifts();
    const schedule = (day,minute) => {
        c.minutes=minute;c.calendarMinutes=day*1440+minute;
        return shiftState(c,errands,{keys:0,barrierUntil:0});
    };
    assert.equal(schedule(0,540).shuttlePhase,0);
    assert.equal(schedule(1,540).shuttlePhase,null);
    assert.equal(schedule(1,420).shuttlePhase,0);
    assert.equal(schedule(1,400).shopOpens,360);
    assert.equal(schedule(0,400).shopOpens,420);
    assert.equal(schedule(0,500).port,'unload');
    assert.equal(schedule(0,800).port,'weigh');
    assert.equal(schedule(0,1300).port,'closed');
    assert.match(schedule(0,1220).matchTitle,/ИТОГ/);
    assert.equal(schedule(0,1105).detour,true);
    const streets=c.sim.cars, spot={x:-30.5,z:16.6};
    assert.equal(clearDisc(spot,.3,groundHeight(spot.x,spot.z),streets),true);
    c.weather.temperature=2; wt.update(c);
    assert.equal(clearDisc(spot,.3,groundHeight(spot.x,spot.z),streets),false);
    c.weather.temperature=-3;c.calendarMinutes+=91;wt.update(c);
    assert.equal(clearDisc(spot,.3,groundHeight(spot.x,spot.z),streets),true);
    c.player={x:10.5,z:-38.25};wt.act('board-keys',c);c.choices[0].run();
    c.player={x:-40.7,z:41.4};wt.act('board-news',c);c.choices[0].run();
    wt.act('board-news',c);
    assert.ok(c.sim.depotKeysReturned);
    assert.match(c.body,/вернулись владельцу/);
});

test('river passengers independently approach the cashier and reach the replacement bus', () => {
    const c=context(), venues=createDistrictVenues();
    c.zone=river.door.zone;c.minutes=c.calendarMinutes=1105;c.sim.elapsed=120;
    venues.update(c);
    const route=venues.save().station.routes[0], person=river.passengers[0];
    assert.equal(route.cashier,true);
    assert.ok(passengerPosition(person,route,route.at+4,0,true).z < 0);
    const arrived=passengerPosition(person,route,route.at+25,0,false);
    assert.ok(Math.hypot(arrived.x-river.bus.x,arrived.z-river.bus.z)<1);
});
