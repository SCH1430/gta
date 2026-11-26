"use strict";
const T = require("../engine/three.module.min.js");
const nav = require("./world-layout.js");
const clearance = require("./camera-volume.js");
const { houseClearance } = require("./house-layout.js");
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const guides = [
    ['Канальные гаражи', -40, 42, 'Машины, инструмент и мастерская'],
    ['Поворот у «Спектра»', 38.35, 36.35, 'Кнопка пешеходного перехода'],
    ['Прилавок Инны', 30, 25.3, 'Ремонт, очередь и обмен'],
    ['Остановка линии 07', 17.1, 22.6, 'Билеты, пассажиры и рейсы'],
    ['Подъезд № 23', -34.96, 16.6, 'Соседи, объявления и двор'],
    ['Скамья у № 31', -35.4, .4, 'Встречи и дворовые дела'],
    ['Трамвайное депо', 12, -39, 'Мастерские и дежурная смена'],
    ['Кафе «Горячий лёд»', -101, 38.84, 'Столярные работы'],
    ['Шлюзовой съезд', 14.1, 57.7, 'Обмен у лодки'],
    ['Лесозавод', 191, 677, 'Весовая площадка']
];
function aimedSign(scene, camera, sim) {
    if (!scene) return null;
    let best = null, score = Infinity;
    const centre = new T.Vector3(), direction = new T.Vector3(), normal = new T.Vector3(), screen = new T.Vector3();
    camera.updateMatrixWorld();
    scene.traverseVisible(group => {
        const signs = group.userData?.readableSigns;
        if (!signs) return;
        for (const s of signs) {
            centre.set(s.x, s.y, s.z).applyMatrix4(group.matrixWorld);
            direction.copy(centre).sub(camera.position);
            const distance = direction.length();
            if (distance < .15 || distance > 52) continue;
            direction.multiplyScalar(1 / distance);
            normal.set(Math.sin(s.angle), 0, Math.cos(s.angle)).transformDirection(group.matrixWorld);
            if (normal.dot(direction) > -.07) continue;
            screen.copy(centre).project(camera);
            if (screen.z < -1 || screen.z > 1 || Math.abs(screen.x) > .9 || Math.abs(screen.y) > .8) continue;
            const miss = Math.hypot(Math.max(0, Math.abs(screen.x) * camera.aspect - s.w / distance * .68),
                Math.max(0, Math.abs(screen.y) - s.h / distance * .7));
            const rank = miss + distance * .0024;
            if (rank >= score || miss > .45) continue;
            const hit = sim.home.inside ? houseClearance(camera.position, direction, distance, .015) :
                clearance.cameraClearance(camera.position, direction, distance, .015, sim.cars, sim.driven);
            if (hit + .72 < distance) continue;
            best = s.text;
            score = rank;
        }
    });
    return best;
}
exports.createDistrictPlay = function(scene, ui, context, persist) {
    const modules = {
        city: require("./city-additions.js").createCityAdditions(scene),
        mobility: require("./mobility-additions.js").createMobilityAdditions(scene),
        culture: require("./culture-additions.js").createCultureAdditions(scene)
    };
    let notes, parking, driven, selection, menuTitle;
    function restore(data) {
        notes = Array.isArray(data?.notes) ? data.notes.filter(n => typeof n === 'string').slice(-64).map(n=>n.slice(0,320)) : [];
        parking = data?.parking && Number.isFinite(data.parking.x) && Number.isFinite(data.parking.z) ? data.parking : null;
        driven = null; selection = []; menuTitle = '';
        for (const [key, mod] of Object.entries(modules)) mod.restore?.(data?.[key]);
    }
    function record(text) {
        const clean = String(text ?? '').trim().slice(0, 320);
        if (clean && notes.at(-1) !== clean) { notes.push(clean); if (notes.length > 64) notes.shift(); }
    }
    function choose(title, items) {
        menuTitle = String(title);
        selection = items.filter(item => item && typeof item.run === 'function');
        ui.open('district-choice');
    }
    function ctx(dt = 0, weather) {
        return Object.assign(context(dt, weather), { notify: ui.notify, choose, record, addMapPin: ui.addMapPin });
    }
    function here(c) {
        if (c.sim.transition || c.sim.home.door) return [];
        return Object.entries(modules).flatMap(([key, mod]) => (mod.actions(c) || []).map(a => ({...a, id:'district:' + key + ':' + a.id})));
    }
    function guide(pin) {
        ui.addMapPin(pin[1], pin[2], pin[0]);
        if (ctx().sim.home.inside) {
            ui.notify('Метка «'+pin[0]+'» сохранена. На улице выберите её на карте.');
            return;
        }
        ui.open('map');
        ui.focusDestination({x:pin[1], z:pin[2], label:pin[0]});
    }
    function notebook() {
        const c = ctx(), goal = c.jobs.current() ?? c.sim.objective();
        const obligations = Object.values(modules).flatMap(mod=>mod.agenda?.(c) ?? []);
        const nearby = here(c), button = (action,label,sub='') => '<button type="button" class="k-panel-row k-book-row" data-action="'+escape(action)+'"><span>'+escape(label)+(sub?'<small>'+escape(sub)+'</small>':'')+'</span><b aria-hidden="true">›</b></button>';
        return '<div class="k-list k-city-book"><h3>Открытое дело</h3><p>'+escape(goal?.title)+' · '+escape(goal?.goal ?? c.sim.objective().goal)+'</p>'+
            (obligations.length ? '<h3>Договорённости</h3>'+obligations.map(o=>'<p><strong>'+escape(o.title)+'</strong><br>'+escape(o.goal)+'</p>').join('') : '')+
            (notes.length ? '<h3>Последняя запись</h3><p>'+escape(notes.at(-1))+'</p>' : '')+
            (parking ? '<p>Последняя стоянка · '+escape(nav.districtAt(parking.x,parking.z))+'</p>'+button('district:park','Показать машину') : '')+
            '<h3>Рядом</h3>'+ (nearby.map(a=>button(a.id,a.label)).join('') || '<p>Здесь пока нет дворовых дел.</p>')+
            '<h3>Куда пойти</h3>'+guides.map((p,i)=>button('district:guide:'+i,p[0],p[3])).join('')+
            (notes.length>1 ? '<details><summary>Предыдущие записи</summary>'+notes.slice(0,-1).reverse().map(n=>'<p>'+escape(n)+'</p>').join('')+'</details>' : '')+'</div>';
    }
    ui.registerPanel('district-book','Городской блокнот',notebook);
    ui.registerPanel('district-choice',() => menuTitle.length <= 42 ? menuTitle : 'Городской блокнот',
        () => '<div class="k-list k-city-book">'+(menuTitle.length>42?'<p>'+escape(menuTitle)+'</p>':'')+
            selection.map((a,i)=>'<button type="button" class="k-panel-row k-book-row" data-action="district:pick:'+i+'"><span>'+escape(a.label)+'</span><b aria-hidden="true">›</b></button>').join('')+'</div>', true);
    return {restore, save() {
        return {notes:notes.slice(),parking,...Object.fromEntries(Object.entries(modules).map(([key,mod])=>[key,mod.save?.()]))};
    }, actions:()=>here(ctx()), update(dt, weather) {
        const c = ctx(dt, weather);
        if (driven && !c.car && !c.sim.transition) {
            const last = c.sim.cars.find(v=>v.id===driven);
            if (last) parking = {x:last.x, z:last.z, id:last.id};
            driven = null;
        }
        if (c.car) driven = c.car.id;
        for (const mod of Object.values(modules)) mod.update(c);
    }, act(id) {
        if (!id.startsWith('district:')) return false;
        const rest = id.slice(9), sep = rest.indexOf(':'), key = sep < 0 ? rest : rest.slice(0,sep), local = rest.slice(sep+1);
        if (key === 'pick') { const item = selection[Number(local)]; if (item) { ui.close(); selection=[]; item.run(); } }
        else if (key === 'guide') { if (guides[Number(local)]) guide(guides[Number(local)]); }
        else if (key === 'park' && parking) {
            const car = ctx().sim.cars.find(v=>v.id===parking.id) ?? parking;
            guide(['Последняя стоянка',car.x,car.z,'']);
        }
        else if (key === 'read') {
            const c=ctx(), text=aimedSign(c.sim.home.inside ? c.indoorScene : scene,c.camera,c.sim);
            if (text) choose(text,[{label:'Записать в блокнот',run:()=>record(text)}, {label:'Закрыть',run:()=>{}}]);
            else ui.notify('Посмотрите на лицевую сторону вывески.');
        }
        else if (modules[key]) {
            const c = ctx();
            if (!here(c).some(row => row.id === id)) { ui.notify('Действие уже недоступно'); return true; }
            if (ui.isPaused()) ui.close();
            modules[key].act(local,c);
        }
        persist();
        return true;
    }};
};
