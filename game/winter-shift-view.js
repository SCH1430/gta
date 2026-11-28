'use strict';
const T = require('../engine/three.module.min.js');
const { Batch } = require('./model-geometry.js');
const { groundHeight } = require('./world-layout.js');
const { createPerson } = require('./model-people.js');
const { createVehicle } = require('./model-cars.js');
const { specs } = require('./vehicle-cabin.js');
const { river } = require('./venue-layout.js');
const { signTexture } = require('./world-textures.js');

const clamp = n => Math.max(0, Math.min(1, n));

function createWinterShiftView(scene) {
    if (!scene) return () => {};
    const root = new T.Group(), scenes = [];
    root.name = 'Городская зима · смены и поручения';
    scene.add(root);
    function exhibit(name, x, z, build) {
        const group = new T.Group();
        group.name = name;
        group.position.set(x, groundHeight(x,z), z);
        group.visible = false;
        root.add(group);
        let draw;
        scenes.push((c, state) => {
            group.visible = c.zone === 'street' && Math.hypot(c.player.x-x,c.player.z-z) < 55;
            if (!group.visible) return;
            if (!draw) draw = build(group);
            draw(c, state);
        });
    }
    function paint(group, draw) {
        const b = new Batch();
        draw(b);
        const mesh = b.mesh();
        group.add(mesh);
        return mesh;
    }
    function placard(group, x, y, z, w, h) {
        const card = new T.Mesh(new T.PlaneGeometry(w,h), new T.MeshLambertMaterial({ color: '#fffdfa', side: T.DoubleSide }));
        card.position.set(x,y,z);
        group.add(card);
        let last = '';
        return (title, sub) => {
            if (typeof document === 'undefined' || last === title + sub) return;
            last = title + sub;
            card.material.map?.dispose();
            card.material.map = signTexture(title, sub, '#373a34', '#dad5bd', w/h);
            card.material.needsUpdate = true;
        };
    }
    function vehicle(group, kind, color, x, z, yaw) {
        const model = createVehicle(kind, color), body = model.root;
        body.position.set(x,0,z);
        body.rotation.y = yaw;
        group.add(body);
        return body;
    }
    function walker(group, variant, job = 'resident') {
        let actor;
        return (c, visible, x, z, angle, walking, posture = {}) => {
            if (!visible) { if (actor) actor.root.visible = false; return; }
            if (!actor) { actor = createPerson(job, variant); group.add(actor.root); }
            actor.root.visible = true;
            actor.root.position.set(x,groundHeight(group.position.x+x,group.position.z+z)-group.position.y,z);
            actor.root.rotation.y = angle;
            actor.update(c.dt,walking ? .85 : 0,false,posture);
        };
    }
    function board(group, w = 1.75) {
        paint(group,b => {
            for (const side of [-1,1]) b.box(w*.38*side, .91, -.09, .08, 1.82, .08, '#64675c');
            b.box(0,1.68,0,w+.14,.87,.09,'#766951');
        });
        return placard(group,0,1.68,.053,w,.75);
    }
    exhibit('Расписание у проходной ТЭЦ',-55,-117,g => {
        const hours = board(g);
        const van = vehicle(g,'van','#beaa83',1,-2.9,Math.PI/2);
        const workers = [walker(g,4),walker(g,15),walker(g,8)];
        return (c,s) => {
            hours('ДО ПРОХОДНОЙ', s.weekend ? 'СБ–ВС   07:00 · 15:00 · 23:00' : 'ПН–ПТ   07:00 · 09:00 · 15:00 · 17:00 · 23:00');
            const phase = s.shuttlePhase;
            van.visible = phase !== null;
            if (van.visible) van.position.x = -1 + (phase < 0 ? -Math.min(phase+5,5)+5 : Math.max(0,phase-3)*3);
            workers.forEach((p,i) => p(c,phase !== null && phase < 4, -2.3+i*.6, 1.9 - 2.4*clamp(((phase??0)+2-i)/3),0,phase >= -2 && phase < 2));
        };
    });
    exhibit('Хлебный фургон у дома № 19',35.8,55.55,g => {
        const van = vehicle(g,'van','#dac39e',-3,2.5,-Math.PI/2);
        const queue = [walker(g,1),walker(g,5),walker(g,8),walker(g,17)];
        const crates = paint(g,b => {
            for(let i=0;i<3;i++) {
                b.box(1.05,.18+i*.25,.76,.68,.23,.39,'#a58660');
                for(const side of [-1,1]) b.box(1.05+side*.28,.20+i*.25,.76,.04,.28,.42,'#6f634b');
            }
        });
        return (c,s) => {
            const offset = c.minutes - s.shopOpens;
            van.visible = offset >= -22 && offset < 11;
            van.position.x = -3 - Math.max(0,-17-offset)*2 - Math.max(0,offset-6)*2;
            crates.visible = offset >= -16 && offset < 26;
            queue.forEach((p,i) => p(c,offset >= -12+i*3 && offset < 9+i*2,
                -.20+i*.46, .85+i*.70+.55*clamp((-offset-7+i*3)/3),0,false));
        };
    });
    exhibit('Расчистка у дома № 23',-38.8,17.18,g => {
        const snow = paint(g,b => b.box(0,.035,1.7,2.1,.07,3.2,'#d8d9cf'));
        const bank = paint(g,b => b.ball(1.48,.21,1.8,.91,.56,3.3,'#bfc2ba'));
        const car = vehicle(g,'wagon','#858985',-2.3,1.6,0);
        const worker = walker(g,6,'mechanic');
        return (c,s) => {
            car.visible = !s.ownerMoved;
            snow.scale.x = 1 - .96*s.cleared;
            bank.scale.y = .38 + 1.2*s.cleared;
            worker(c,c.minutes >= 380 && c.minutes < 520,-1,clamp((c.minutes-380)/140)*3.1,0,false);
        };
    });
    exhibit('Ограждение опасной наледи',-30.5,16.6,g => {
        const barrier = paint(g,b => {
            for(const side of [-1,1]) {
                b.box(side*1.35,.46,0,.06,.92,.06,'#a36e3c');
                b.box(side*1.35,.06,0,.42,.12,.32,'#79765e');
            }
            for(let i=0;i<12;i++) b.box(-1.25+i*.227,.74,0,.23,.088,.025,i%2?'#d4cdb2':'#a85648');
        });
        const porter = walker(g,6), passer = walker(g,10);
        return (c,s) => {
            barrier.visible = s.thaw;
            porter(c,s.thaw,-1.8, .48,1.5,false);
            const t = (c.sim.elapsed%12)/12;
            passer(c,s.thaw,-3+6*t,.5+Math.sin(t*Math.PI)*1.4,-Math.PI/2,true);
        };
    });
    exhibit('Погрузочное окно и весовая причала',-146,103.5,g => {
        const boardText = board(g);
        const shutters = paint(g,b => {
            for(let i=0;i<10;i++) b.box(0,1.1+i*.15,-1.45,2.65,.145,.13,'#727871');
        });
        const stock = paint(g,b => {
            for(let i=0;i<4;i++) {
                b.box(1.3+i*.48,.25,-.7,.44,.50,.55,'#a28861');
                b.box(1.3+i*.48,.25,-.416,.04,.52,.03,'#706350');
            }
        });
        const loader = walker(g,12,'mechanic');
        return (c,s) => {
            const t=(1+Math.sin(c.sim.elapsed*.33))*.5;
            stock.visible = s.port === 'unload';
            shutters.scale.y = s.port === 'closed' ? 1 : .16;
            shutters.position.y = s.port === 'closed' ? 0 : 1.95;
            loader(c,stock.visible,-1+t*2,-.1,Math.cos(c.sim.elapsed*.33)>0?-Math.PI/2:Math.PI/2,true,{carry:'parcel'});
            boardText('СКЛАД ПРИЧАЛА', s.port === 'closed' ? 'ЗАКРЫТО · ОХРАНА У ПРОХОДНОЙ' : s.port === 'unload' ? 'УТРЕННЯЯ ПРИЁМКА ЯЩИКОВ' : 'ВЕСОВАЯ ОТКРЫТА · ОКНО 2');
        };
    });
    exhibit('Объявление на остановке',17.1,22.6,g => {
        const sheet = board(g,1.35);
        return (c,s) => sheet(s.detour ? 'ОБЪЕЗД · АВТОБУС 12' : 'АВТОБУС 12', s.detour ? 'ПОСАДКА У РЕЧНОГО ВОКЗАЛА · ВОСТОЧНЫЙ ВХОД' : 'МЕСТО ПОСАДКИ · КАНАЛЬНАЯ');
    });
    for (const [alternate, x, z] of [[false,17.1,27.5],[true,river.bus.x,river.bus.z+2.4]]) {
        exhibit(alternate ? 'Рейс 12 на объезде' : 'Рейс 12 у рынка',x,z,g => {
            const bus = vehicle(g,'van','#c8ba91',0,0,-Math.PI/2);
            placard(bus,0,1.51,-2.39,.55,.24)('12','КАНАЛЬНАЯ');
            const rider = walker(g,4);
            return (c,s) => {
                const phase=s.busPhase;
                bus.visible = alternate === s.detour && (phase>=16 || phase>=0 && phase<3);
                bus.position.x = phase>=16 ? (phase-18)*1.6 : phase*2.1;
                const boarding = alternate === s.detour && phase>=10;
                rider(c,boarding,-.7+clamp((phase-17)/2),-2+clamp((phase-17)/2),Math.PI,phase>=17);
            };
        });
    }
    exhibit('Афиши у ледовой арены',-66.3,-607,g => {
        const sheet = board(g,1.62);
        return (c,s) => sheet(s.matchTitle,s.matchLine);
    });
    exhibit('Гаражные объявления',-40.7,41.4,g => {
        const sheet = board(g);
        return (c,s) => sheet(s.keysReturned ? 'КЛЮЧИ ПЕРЕДАНЫ ХОЗЯИНУ' : 'НАЙДЕНЫ КЛЮЧИ В ЗЕЛЁНОМ ЧЕХЛЕ',s.notice);
    });
    exhibit('Мастер на обходе',6.8,-4,g => {
        const master = walker(g,5,'mechanic');
        const stations = [[7.8,-38.4],[6.8,-32],[6.2,-9],[10.5,23.1]];
        return (c,s) => {
            const to = stations[s.trackStage], from = stations[s.trackStage-1];
            if (!to || !from) { master(c,false); return; }
            const dx = to[0]-from[0], dz = to[1]-from[1];
            const t = s.trackAt === null ? 1 : clamp((c.sim.elapsed-s.trackAt)*1.25 / Math.hypot(dx,dz));
            master(c,true,from[0]+dx*t-g.position.x+.65,from[1]+dz*t-g.position.z,
                t<1 ? Math.atan2(-dx,-dz) : 1.4,t<1);
        };
    });
    exhibit('Приёмная секции 07',-70,-634,g => {
        const coach = walker(g,13);
        return (c,s) => coach(c,s.mittenStage >= 1,.65,.3,2.4,false);
    });
    const glassCrate = paint(root,b => {
        b.box(0,.38,0,1.28,.68,.10,'#829b99');
        for (const side of [-1,1]) {
            b.box(side*.69,.38,0,.075,.76,.25,'#af916e');
            b.box(0,.38+side*.35,0,1.44,.072,.26,'#b19a78');
            b.box(side*.37,.38,0,.047,.79,.29,'#656358');
        }
        b.rod([-.68,.1,.16],[.68,.65,.16],.027,'#9f845e',true);
    });
    glassCrate.name = 'Стекло в транспортной раме';
    return (c,s) => {
        scenes.forEach(draw=>draw(c,s));
        const car = s.glassStage === 2 ? c.sim.cars.find(v => v.id === s.glassVehicle) : null;
        const x = car?.x ?? -39, z = car?.z ?? 43;
        glassCrate.visible = c.zone === 'street' && (s.glassStage === 1 || !!car) && Math.hypot(c.player.x-x,c.player.z-z)<65;
        if (glassCrate.visible) {
            glassCrate.position.set(x,car ? car.y+specs[car.kind].roof+.035 : groundHeight(x,z),z);
            glassCrate.rotation.y = car?.yaw ?? 0;
        }
    };
}

module.exports = { createWinterShiftView };
