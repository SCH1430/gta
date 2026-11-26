"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cargoDispatch = exports.trainJobCatalog = void 0;
exports.trainTargets = trainTargets;
exports.trainActions = trainActions;
exports.trainAct = trainAct;
exports.trainTick = trainTick;
const cargo_rail_js_1 = require("./cargo-rail.js");
exports.trainJobCatalog = {
    id: 93, title: 'Вагон на канале', client: 'Грузовой пост 77', pay: 3200,
    brief: 'На грузовой ветке работает состав из четырёх вагонов. Сверь описание груза у Портового переезда, выбери пост для встречи и запиши номер с борта. Когда опустятся шлагбаумы, на Портовой можно обойти переезд по пешеходному мостку.',
    steps: ['Сверить ведомость у Портового переезда', 'Опознать вагон у одного из трёх переездов', 'Передать номер вагонной пломбы на грузовом посту']
};
exports.cargoDispatch = { x: 56.3, z: 50.1, name: 'Ведомость · грузовой пост 77', space: 'street', radius: 2.75 };
const standing = (f) => f.space === 'street' && !f.busy && !f.car && Math.abs(f.heroSpeed ?? 0) < 2.5;
const near = (f, p, radius) => Math.hypot(f.x - p.x, f.z - p.z) < radius;
const platform = (f) => cargo_rail_js_1.cargoCrossings.findIndex(c => near(f, c.look, 3.1));
const order = [1, 3, 2, 4];
function trainTargets(s, f) {
    if (s.stage !== 1)
        return [{ ...exports.cargoDispatch, name: s.stage ? 'Грузовой пост · сдать номер' : exports.cargoDispatch.name }];
    const pass = f.cargo;
    const choices = cargo_rail_js_1.cargoCrossings.map((c, i) => ({ c, i, eta: pass?.eta[i] ?? -1 }));
    const upcoming = choices.filter(q => q.eta >= 0);
    return (upcoming.length ? upcoming : choices).map(({ c, i, eta }) => ({
        ...c.look, space: 'street', radius: 3.1,
        name: c.name + (pass?.stop === i ? ' · состав у поста' : eta > 0 ? ' · около ' + eta + ' с' : pass?.active ? '' : ' · ' + (pass?.serial ? 'повторная подача' : 'вызов состава'))
    }));
}
function trainActions(s, f) {
    if (!standing(f))
        return [];
    if (s.stage === 0)
        return near(f, exports.cargoDispatch, exports.cargoDispatch.radius) ? [{ key: 'cargo-read-ledger', label: 'Сверить грузовую ведомость' }] : [];
    if (s.stage === 2)
        return near(f, exports.cargoDispatch, exports.cargoDispatch.radius) ? [{ key: 'cargo-deliver-number', label: 'Передать номер на грузовом посту' }] : [];
    const i = platform(f);
    if (i < 0)
        return [];
    if (f.cargo?.stop === i)
        return order.map(n => ({ key: 'cargo-wagon-' + n, label: 'Записать ' + cargo_rail_js_1.cargoWagons[n].id }));
    if (f.cargo?.active)
        return [{ key: 'cargo-eta', label: 'Сверить время грузового поезда' }];
    return [{ key: 'cargo-call', label: f.cargo?.serial ? 'Запросить повторную подачу' : 'Запросить подачу состава' }];
}
function trainAct(s, key, f, engine) {
    if (!trainActions(s, f).some(a => a.key === key))
        return engine.notice('Подойдите пешком к отмеченному грузовому посту.');
    if (key === 'cargo-read-ledger')
        return engine.next('Ведомость: синий контейнер с жёлтой диагональю. Выберите один из трёх постов и вызовите состав с места. Номер указан на борту.');
    if (key === 'cargo-deliver-number') {
        const i = cargo_rail_js_1.cargoCrossings.findIndex((_, n) => s.marks.includes('cargo-post-' + n));
        return engine.done('Пломба ' + cargo_rail_js_1.cargoTargetWagon.id + ' сверена. ' + (i >= 0 ? cargo_rail_js_1.cargoCrossings[i].name + ' подтвердил подачу.' : 'Номер передан смене.'));
    }
    const i = platform(f), c = cargo_rail_js_1.cargoCrossings[i];
    if (key === 'cargo-call')
        return { ...engine.notice(c.name + ' · подача заказана. Дождитесь состава за ограждением.'), cargoTrain: 'launch', cargoCrossing: i };
    if (key === 'cargo-eta') {
        const eta = f.cargo?.eta[i] ?? -1;
        if (eta >= 0)
            return engine.notice(c.name + ' · состав ожидается примерно через ' + eta + ' с.');
        return engine.notice('Состав уже прошёл этот пост. Выберите следующий переезд или дождитесь повторной подачи.');
    }
    if (key !== 'cargo-wagon-2')
        return engine.notice('В ведомости указан синий контейнер с жёлтой диагональю. Сверьте борт ещё раз.');
    s.marks.push('cargo-post-' + i);
    return { ...engine.next('Записан номер ' + cargo_rail_js_1.cargoTargetWagon.id + '. Вернитесь к грузовому посту у Портового переезда.'), sound: 'switch' };
}
function trainTick(s, f, engine) {
    if (s.stage !== 1 || !s.city || !f.cargo?.active || f.cargo.stop < 0 || s.city.leg === f.cargo.stop + 1)
        return;
    const here = cargo_rail_js_1.cargoCrossings[f.cargo.stop];
    if (f.space === 'street' && near(f, here.look, 21)) {
        s.city.leg = f.cargo.stop + 1;
        return engine.notice(here.name + ' · состав у платформы. Прочитайте номер синего контейнера с жёлтой полосой.');
    }
}
