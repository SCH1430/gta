'use strict';
const { marketHours } = require('./market-hours.js');
const { createErrands, guides: errandGuides } = require('./winter-errands.js');
const { createWinterShiftView } = require('./winter-shift-view.js');
const { river } = require('./venue-layout.js');
const { bindThawBarrier } = require('./collision.js');

const boards = [
    ['workers','Автобус проходной ТЭЦ',-55,-117,'Рейсы рабочего автобуса по дням недели.'],
    ['bread','Привоз хлеба у дома № 19',35.8,55.55,'Фургон приезжает к служебному входу перед открытием магазина.'],
    ['yard','Уборка двора',-38.8,17.18,'Дворник расчищает проход от подъезда к улице.'],
    ['thaw','Обход под карнизом',-30.5,17.4,'Дворовой проход у оттепельного ограждения.'],
    ['port','Весовая причала 01',-146,103.5,'График приёмки и окно взвешивания ящиков.'],
    ['reroute','Доска объездов автобуса 12',16.5,24.5,'При переносе остановки указано место посадки.'],
    ['rink','Афиши и счёт у арены',-66.3,-607,'Афиша сегодняшнего матча и результаты прошлой встречи.'],
    ['news','Объявления гаражного кооператива',-40.7,41.4,'Потерянные ключи, график отключений и дата собрания.'],
    ['keys','Бюро находок депо',10.5,-38.25,'У диспетчера лежат найденные на линии вещи.']
];
const guides = [...errandGuides, ...boards.map(([,label,x,z,desc]) => [label,x,z,desc])];
const weekdayTimes = [420,540,900,1020,1380], weekendTimes = [420,900,1380];
const teams = ['Литейщик','Канал','Полярник','Вагоностроитель'];
const near = (p,x,z) => Math.hypot(p.x-x,p.z-z) < 2.8;
const clock = n => String(Math.floor(n/60)).padStart(2,'0') + ':' + String(n%60).padStart(2,'0');
const match = day => teams[(day+4)%4] + ' — ' + teams[(day+5)%4];
const score = day => (2+(day+3)%3) + ':' + ((day+4)%3);
function shiftState(c, errands, state) {
    const day = Math.floor(c.calendarMinutes/1440), minute = c.minutes;
    const weekend = (day+4)%7 >= 5;
    const departures = weekend ? weekendTimes : weekdayTimes;
    const departure = departures.find(t => minute >= t-5 && minute < t+7);
    const nowPlaying = minute >= 1140, posted = minute >= 1215;
    const resultDay = posted ? day : day-1;
    const ownerMoved = errands.complete('plough');
    return {
        day, weekend, departures, shuttlePhase: departure === undefined ? null : minute-departure,
        shopOpens: marketHours(c.calendarMinutes).open, ownerMoved,
        cleared: Math.max(ownerMoved ? 1 : 0, Math.min(1, Math.max(0,(minute-380)/140))),
        thaw: c.calendarMinutes < state.barrierUntil,
        port: minute < 360 || minute >= 1200 ? 'closed' : minute < 620 ? 'unload' : 'weigh',
        detour: minute >= 1100 && minute < 1160,
        busPhase: minute >= 360 && minute < 1320 ? (minute+5)%20 : -1,
        matchTitle: posted ? 'ИТОГ МАТЧА · '+score(day) : (nowPlaying ? 'МАТЧ ИДЁТ' : 'СЕГОДНЯ В 19:00'),
        matchLine: match(day) + (posted ? ' · '+score(day) : ' · Прошлый матч '+match(resultDay)+' '+score(resultDay)),
        notice: (day < 1 ? 'Вода · отключение в субботу' : 'Отключение перенесли на понедельник')
            + (errands.complete('gate') ? ' · Рабочие встречаются у хлебного окна' : day < 1 ? ' · Собрание ожидает даты' : ' · Собрание в среду в 19:00'),
        keysReturned: state.keys === 2, mittenStage: errands.stage('mitten'), trackStage: errands.stage('track'),
        glassStage: errands.stage('glass'), glassVehicle: errands.glassVehicle, trackAt: errands.trackAt
    };
}
function createWinterShifts(scene) {
    const errands = createErrands(), view = createWinterShiftView(scene);
    let state = { keys:0, barrierUntil:0 };
    function actions(c) {
        const local = errands.actions(c);
        if (c.zone !== 'street' || c.car || c.sim.tramRider?.onboard) return local;
        for (const [id,label,x,z] of boards)
            if (near(c.player,x,z)) local.push({ id: 'board-'+id, label });
        return local;
    }
    function act(id,c) {
        if (!id.startsWith('board-')) return errands.act(id,c);
        const entry = boards.find(([key]) => id === 'board-'+key);
        if (!entry || !actions(c).some(row => row.id === id)) return;
        const [key,label] = entry, s = shiftState(c,errands,state);
        const lines = {
            workers: (s.weekend ? 'Выходной день. Рейсы для дежурной смены' : 'Будний день. Выходы заводских смен') + ' · '+s.departures.map(clock).join(', '),
            bread: 'Доставка к '+clock(s.shopOpens-20)+'. Магазин открывается в '+clock(s.shopOpens)+'.',
            yard: s.cleared >= 1 ? 'Проход к дороге расчищен. Снег сдвинут к бордюру.' : 'Утреннюю дорожку от подъезда чистят с 06:20 до 08:40.',
            thaw: s.thaw ? 'С карниза падает лёд. Дворник оградил проход. Обойдите через двор вдоль скамейки.' : 'Дворовой тротуар открыт.',
            port: {closed:'Ворота склада закрыты до 06:00. Дежурит охрана.',unload:'У причала принимают ящики до 10:20.',weigh:'Весовая принимает машины до 20:00.'}[s.port],
            reroute: s.detour ? 'Канальная закрыта для автобуса на час вечерней разгрузки. До 19:20 посадка у Речного вокзала. Идите к набережной и поверните направо у касс. Отправления в 18:35, 18:55 и 19:15.' : 'Остановка действует. В часы вечерней разгрузки посадку переносят к Речному вокзалу с 18:20 до 19:20.',
            rink: s.matchTitle+' · '+s.matchLine+(errands.complete('mitten') ? '. Варежку вернули секции 07.' : '. Утеряна синяя варежка секции 07.'),
            news: (s.keysReturned ? 'Ключи в зелёном чехле вернулись владельцу. ' : 'Ключи в зелёном чехле ждут хозяина в депо. ') + s.notice,
            keys: state.keys === 0 ? 'На брелоке телефон кооператива. Диспетчер просит занести ключи сторожу Канальных гаражей.' : state.keys === 1 ? 'Сторож ждёт у доски гаражного кооператива.' : 'Сторож вернул связку хозяину.'
        };
        const choices = [];
        if (key === 'keys' && state.keys === 0) choices.push({ label:'Взять ключи для сторожа', run() {
            state.keys=1; c.addMapPin(-40.7,41.4,'Вернуть ключи сторожу'); c.record('Ключи из депо нужно вернуть сторожу Канальных гаражей.'); c.persist();
        } });
        if (key === 'news' && state.keys === 1) choices.push({ label:'Отдать зелёный чехол с ключами', run() {
            state.keys=2; c.sim.depotKeysReturned = true; c.record('Сторож вернул ключи владельцу и снял объявление.'); c.persist();
        } });
        if (key === 'reroute' && s.detour) choices.push({label:'Отметить временную остановку',run() { c.addMapPin(river.bus.x,river.bus.z,'Автобус 12 · пересадка у вокзала'); }});
        let wait;
        if (key === 'workers') wait = s.departures.find(t=>t>c.minutes+5) ?? s.departures[0];
        if (key === 'bread') wait = s.shopOpens-20;
        if (key === 'port') wait = s.port === 'closed' ? 360 : s.port === 'unload' ? 620 : 1200;
        if (key === 'rink' && c.minutes < 1215) wait = c.minutes < 1140 ? 1140 : 1215;
        if (Number.isInteger(wait)) choices.push({label:'Подождать до '+clock(wait),run() {
            if (!c.waitUntil(wait)) c.notify('Остановитесь в безопасном месте.');
        }});
        choices.push({ label:'Закрыть',run(){} });
        c.choose(label, choices, lines[key]);
    }
    function update(c) {
        if ((c.weather?.temperature??-1) > .7 && c.calendarMinutes >= state.barrierUntil)
            state.barrierUntil = c.calendarMinutes + 90;
        c.sim.depotKeysReturned = state.keys === 2;
        errands.update(c);
        const shift = shiftState(c,errands,state);
        // Give anyone standing on the line enough time to leave before placing the rail.
        if (c.sim.cars) bindThawBarrier(c.sim.cars,shift.thaw,
            c.zone === 'street' && Math.abs(c.player.x+30.5)<1.75 && Math.abs(c.player.z-16.6)<.4);
        view(c,shift);
    }
    return {
        act, actions, update, agenda: () => errands.agenda(),
        save: () => ({...state, errands:errands.save()}),
        restore(data) {
            state = { keys:[1,2].includes(data?.keys) ? data.keys : 0,
                barrierUntil:Number.isSafeInteger(data?.barrierUntil) ? data.barrierUntil : 0 };
            errands.restore(data?.errands);
        }
    };
}

module.exports = { createWinterShifts, guides, shiftState };
