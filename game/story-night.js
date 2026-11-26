"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finaleContacts = exports.harbourNotice = exports.harbourRadio = exports.isNightJob = void 0;
exports.blackoutPhase = blackoutPhase;
exports.nightTargets = nightTargets;
exports.nightActions = nightActions;
exports.nightTick = nightTick;
exports.nightAct = nightAct;
const blackout_js_1 = require("./blackout.js");
const story_night_layout_js_1 = require("./story-night-layout.js");
const pace = (f) => Math.abs(f.car?.speed ?? f.heroSpeed ?? 0);
const reach = (f, p) => f.space === p.space && Math.hypot(f.x - p.x, f.z - p.z) <= p.radius;
const have = (s, mark) => s.marks.includes(mark);
const onlyFoot = (f) => !f.car && pace(f) < 2.1;
const isNightJob = (id) => id === story_night_layout_js_1.chaseNightId || id === story_night_layout_js_1.finaleNightId || id === story_night_layout_js_1.blackoutNightId;
exports.isNightJob = isNightJob;
function blackoutPhase(s) {
    if (s?.id !== story_night_layout_js_1.blackoutNightId)
        return 'normal';
    return ['normal', 'search', 'bell', 'restore'][s.stage] ?? 'normal';
}
const harbourRadio = (decision) => {
    if (decision === 'dock')
        return ['dock-receipt'];
    if (decision === 'archive')
        return ['fm-ledger'];
    return [];
};
exports.harbourRadio = harbourRadio;
const harbourNotice = (decision) => {
    if (decision === 'dock')
        return {
            title: 'СМЕНА ЗАДЕРЖАЛА ПОГРУЗКУ', subtitle: 'КОПИЯ ВЕДОМОСТИ У БРИГАДЫ',
            message: 'Ян · Смена оставила у шлюза рабочую линию. Если дело дойдёт до эфира, поможем.',
        };
    return {
        title: 'ВЕДОМОСТЬ В ГОРОДСКОМ АРХИВЕ', subtitle: 'ДОПУСК В ОТКРЫТЫЙ ШКАФ СВЯЗИ',
        message: 'Ян · Копия ушла в архив. Без экземпляра смена не откроет свой ящик. В депо есть открытый шкаф связи.',
    };
};
exports.harbourNotice = harbourNotice;
const chaseFinish = (s) => have(s, 'walk') ? story_night_layout_js_1.chaseNightPlaces.shelter : story_night_layout_js_1.chaseNightPlaces.road;
const finaleLine = (s) => have(s, 'dock') ? story_night_layout_js_1.finaleNightPlaces.dock : have(s, 'archive') ? story_night_layout_js_1.finaleNightPlaces.archive : story_night_layout_js_1.finaleNightPlaces.board;
exports.finaleContacts = {
    tonya: 'Тоня · подготовила машину',
    inna: 'Инна · настроила передатчик',
    semen: 'Семён · продлил остановку',
    dock: 'Докеры · оставили резервную линию у шлюза',
    archive: 'Депо · открыло архивную ветку связи',
};
function nightTargets(s, f) {
    if (s.id === story_night_layout_js_1.chaseNightId) {
        const p = story_night_layout_js_1.chaseNightPlaces;
        if (s.stage === 0)
            return [p.relay];
        if (s.stage === 1)
            return [p.quay];
        if (s.stage === 2)
            return [p.ice];
        if (s.stage === 3)
            return [f.car ? p.road : (f.heroY ?? 0) < .78 && !reach(f, p.stairEntry) ? p.stairEntry : p.stairs];
        return [have(s, 'walk') && f.wanted ? p.hiding : chaseFinish(s)];
    }
    if (s.id === story_night_layout_js_1.blackoutNightId) {
        if (s.stage === 1 || s.stage === 2) {
            const site = s.stage === 1 ? blackout_js_1.blackoutSite.generator : blackout_js_1.blackoutSite.bell;
            return reach(f, { ...site, radius: 4.8 }) ? [site] : [];
        }
        return [blackout_js_1.blackoutSite.breaker];
    }
    if (s.id === story_night_layout_js_1.finaleNightId) {
        const p = story_night_layout_js_1.finaleNightPlaces;
        if (s.stage === 0)
            return [p.garage];
        if (s.stage === 1)
            return have(s, 'inna') || have(s, 'coil') ? [p.bench] : [p.bench, p.coil];
        if (s.stage === 2)
            return [p.dispatch];
        return [s.stage === 3 ? finaleLine(s) : p.finish];
    }
    return [];
}
function nightActions(s, f) {
    const a = [], n = s.stage, p = story_night_layout_js_1.finaleNightPlaces;
    const offer = (position, key, label, foot = true) => {
        if (reach(f, position) && (foot ? onlyFoot(f) : pace(f) < 1.4))
            a.push({ key, label });
    };
    if (s.id === story_night_layout_js_1.chaseNightId) {
        if (n === 0 && f.car && !f.wanted)
            offer(story_night_layout_js_1.chaseNightPlaces.relay, 'launch', 'Принять кассету под эстакадой', false);
        if (n === 4) {
            const foot = have(s, 'walk'), label = f.wanted ? 'Проверить, закончился ли поиск' : f.car ? 'Передать кассету из окна' : 'Передать кассету';
            offer(chaseFinish(s), 'deliver', label, foot);
        }
    }
    if (s.id === story_night_layout_js_1.blackoutNightId) {
        if (n === 0)
            offer(blackout_js_1.blackoutSite.breaker, 'break', 'Осмотреть распределительный щит');
        if (n === 1)
            offer(blackout_js_1.blackoutSite.generator, 'generator', 'Проверить генератор');
        if (n === 2)
            offer(blackout_js_1.blackoutSite.bell, 'bell', 'Проверить аварийный звонок');
        if (n === 3)
            offer(blackout_js_1.blackoutSite.breaker, 'light', 'Вернуть свет под эстакадой');
    }
    if (s.id === story_night_layout_js_1.finaleNightId) {
        if (n === 0)
            offer(p.garage, 'plan', 'Обсудить план с Тоней', false);
        if (n === 1) {
            offer(p.bench, 'receiver', 'Взять передатчик у Инны');
            if (!have(s, 'inna') && !have(s, 'coil'))
                offer(p.coil, 'coil', 'Взять запасную катушку');
        }
        if (n === 2)
            offer(p.dispatch, 'tram', 'Сверить график с Семёном');
        if (n === 3)
            offer(finaleLine(s), 'line', have(s, 'dock') ? 'Подключить линию докеров' : have(s, 'archive') ? 'Подключить линию городского архива' : 'Включить местный резерв');
        if (n === 4)
            offer(p.finish, 'air', 'Отправить запись в эфир');
    }
    return a;
}
function nightTick(s, f, engine) {
    if (s.id !== story_night_layout_js_1.chaseNightId || f.busy || !Number.isFinite(f.dt) || (f.dt ?? 0) <= 0)
        return;
    const p = story_night_layout_js_1.chaseNightPlaces;
    if (s.stage === 1 && reach(f, p.quay))
        return engine.next('Съезд обозначен синей вехой. Проверь путь и пересекай канал по льду.');
    if (s.stage === 2 && reach(f, p.ice) && (f.heroY ?? -.54) < .45)
        return engine.next('На южном берегу два пути. Оставь машину у лестницы или продолжи до дорожного поста.');
    if (s.stage === 3) {
        if (f.car && reach(f, p.road)) {
            s.marks.push('drive');
            return engine.next('Подъезд к посту открыт. Уйди из поля зрения и вернись сюда, когда закончат поиск.');
        }
        if (!f.car && reach(f, p.stairs) && (f.heroY ?? 0) > 1.95) {
            s.marks.push('walk');
            return engine.next('За поворотом крытого прохода пережди поиск. После отбоя спустись по дальней лестнице к ящикам, там ждёт Лёша.');
        }
    }
}
function nightAct(s, key, f, engine, context) {
    if (s.id === story_night_layout_js_1.chaseNightId) {
        if (key === 'launch') {
            s.carId = f.car?.id ?? '';
            return { ...engine.next('Лёша · Кассета в салоне. Если патруль займёт улицу, сверни к синей вехе у шлюза.'), patrol: 'begin', patrolReason: 'Перехват кассеты под эстакадой' };
        }
        if (key === 'deliver') {
            if (f.wanted)
                return engine.notice('Патруль ещё ищет. Уезжай или укройся и вернись после отбоя.');
            const outcome = have(s, 'walk') ? 'stairs' : 'vehicle';
            return engine.done(outcome === 'stairs' ? 'Лёша принял кассету за шлюзовым проходом.' : 'Кассета передана у дорожного поста. Маршрут через лёд чист.', { outcome });
        }
    }
    if (s.id === story_night_layout_js_1.blackoutNightId) {
        if (key === 'break')
            return { ...engine.next('Щит обесточен. Под эстакадой кто-то крутит стартер. Следи за подписью звука и поворачивай к нему.'), sound: 'switch' };
        if (key === 'generator')
            return { ...engine.next('Генератор запущен. Аварийный звонок у платформы не замолкает: проверь его блок.'), sound: 'repair' };
        if (key === 'bell')
            return { ...engine.next('Разъём звонка стоит на месте. Осталось замкнуть обратную линию у щита.'), sound: 'tram' };
        if (key === 'light')
            return { ...engine.done('Аварийная линия восстановлена. Под эстакадой снова горит свет.'), sound: 'switch', radio: ['fm-power'] };
    }
    if (s.id === story_night_layout_js_1.finaleNightId) {
        if (key === 'plan') {
            const helpedGarage = [62, 74, 81].some(context.has), helpedInna = [65, 72, 95].some(context.has), helpedRail = [78, 93].some(context.has);
            if (helpedGarage)
                s.marks.push('tonya');
            if (helpedInna)
                s.marks.push('inna');
            if (helpedRail)
                s.marks.push('semen');
            if (context.harbour)
                s.marks.push(context.harbour);
            const result = engine.next(helpedGarage ?
                'Тоня · Помню, как ты помог с машиной. Проверила ходовую. За передатчиком заходи к Инне в мастерскую.' :
                'Тоня · Сегодня никого с подъёмника не снять. Транспорт выбери сам, а я сообщу Инне, что ты идёшь.');
            return { ...result, garageHelp: helpedGarage ? { carId: f.car?.id } : undefined };
        }
        if (key === 'coil') {
            if (!have(s, 'coil'))
                s.marks.push('coil');
            engine.checkpoint();
            return engine.notice('Катушка на месте. Отнеси её Инне на верстак.');
        }
        if (key === 'receiver') {
            if (!have(s, 'inna') && !have(s, 'coil'))
                return engine.notice('Инна · Запасную катушку я оставила на нижней полке. Принеси её, и передатчик заработает.');
            return { ...engine.next(have(s, 'inna') ? 'Инна · После твоего прошлого заказа у нас остался настроенный блок. Бери передатчик и иди к Семёну.' : 'Инна · Катушка подошла. Передатчик рабочий. Узнай у Семёна, какая линия сейчас свободна.'), sound: 'repair' };
        }
        if (key === 'tram') {
            const direction = have(s, 'dock') ? 'Докеры оставили резервный ящик за шлюзом.' : have(s, 'archive') ? 'Открытый шкаф связи стоит в этом же помещении.' : 'Резервная линия у рыночной доски ещё годится.';
            const hold = have(s, 'semen') ? ' Задержу следующий вагон у депо.' : ' Вагон работает по расписанию.';
            return { ...engine.next('Семён · ' + direction + hold), tramHold: have(s, 'semen') ? 18 : undefined };
        }
        if (key === 'line')
            return { ...engine.next('Передатчик держит частоту. Теперь отправь запись с пульта у рыночной доски.'), sound: 'switch' };
        if (key === 'air') {
            const decision = have(s, 'dock') ? 'dock' : have(s, 'archive') ? 'archive' : 'solo';
            const ending = decision === 'dock' ? 'Бригада задержала отправку. Утром смена сверит журнал с городом.' :
                decision === 'archive' ? 'Номер регистрации прозвучал в прямом эфире. Теперь у жителей есть доступ к журналу.' :
                    'Резерв выдержал. Ночную отправку услышали жители по обе стороны канала.';
            return { ...engine.done('Последняя ночь Канального. ' + ending, { outcome: decision }), sound: 'notify',
                radio: ['fm-intro', ...(0, exports.harbourRadio)(context.harbour), 'fm-end'] };
        }
    }
    return engine.notice('Сначала подойди к указанной точке.');
}
