"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nightJobCatalog = exports.finaleNightPlaces = exports.chaseNightPlaces = exports.blackoutNightId = exports.finaleNightId = exports.chaseNightId = void 0;
const market_quarter_layout_js_1 = require("./market-quarter-layout.js");
exports.chaseNightId = 92, exports.finaleNightId = 94, exports.blackoutNightId = 95;
const at = (name, x, z, radius, space = 'street') => ({ name, x, z, radius, space });
const spot = (name, p, radius) => at(name, p.x, p.z, radius);
exports.chaseNightPlaces = {
    relay: spot('Эстакада · точка передачи', market_quarter_layout_js_1.marketCanalChase.start, 9),
    quay: at('Шлюзовой съезд · северный берег', market_quarter_layout_js_1.marketIceSlip, 55, 6),
    ice: spot('Синяя веха · ледовая переправа', market_quarter_layout_js_1.marketCanalChase.ice, 6),
    stairEntry: spot('Шлюзовая лестница · вход с набережной', market_quarter_layout_js_1.marketCanalChase.stairs, 2.4),
    stairs: spot('Служебный проход · поднимись по лестнице', market_quarter_layout_js_1.marketCanalChase.inside, 1.8),
    hiding: spot('За поворотом · переждать поиск', market_quarter_layout_js_1.marketCanalChase.turn, 1.1),
    road: spot('Южный берег · поворот к посту', market_quarter_layout_js_1.marketCanalChase.handoff, 4.5),
    shelter: spot('Укрытие за шлюзовым проходом', market_quarter_layout_js_1.marketCanalChase.shelter, 2.8),
};
exports.finaleNightPlaces = {
    garage: at('Гараж · подготовиться к ночному выезду', -42, 42, 6.7),
    bench: at('Мастерская Инны · верстак', 67, -1.8, 2.25, 'workshop'),
    coil: at('Нижняя полка · запасная катушка', 63.2, -.55, 1.65, 'workshop'),
    dispatch: at('Диспетчерская · график последнего вагона', 95, -1.95, 2.45, 'dispatch'),
    board: spot('Рынок · доска смены', market_quarter_layout_js_1.marketWalkway.listeningBoard, 2.9),
    dock: spot('Шлюз · резервный ящик докеров', market_quarter_layout_js_1.marketCanalChase.shelter, 2.95),
    archive: at('Депо · открытый шкаф связи', 98, -2.25, 2.35, 'dispatch'),
    finish: spot('Рынок · пульт у доски смены', market_quarter_layout_js_1.marketWalkway.listeningBoard, 2.9),
};
exports.nightJobCatalog = [
    {
        id: exports.chaseNightId, title: 'Три уровня', client: 'Ночная связь · Лёша', pay: 3900,
        brief: 'Перехвати контрольную кассету под эстакадой. До разворота патруля пройди по шлюзовому спуску и пересеки канал по льду. На южном берегу можно бросить машину и уйти через лестничный проход или продолжить за рулём к посту.',
        steps: ['Подать машину под эстакаду и принять кассету', 'Добраться до шлюзового съезда на северном берегу', 'Пересечь замёрзший канал мимо синей вехи', 'Пройти над шлюзом пешком или доехать до южного поста', 'Уйти от патруля и передать кассету'],
    },
    {
        id: exports.finaleNightId, title: 'Последняя ночь Канального', client: 'Инна, Тоня и Семён', pay: 5700,
        brief: 'Ночной приказ отключает диспетчерскую волну. Собери переносной передатчик и выведи журнал отправок в эфир. Кто поможет и где найдётся резервная линия, зависит от прошлых заказов.',
        steps: ['Заехать к гаражу и утвердить план с Тоней', 'Получить у Инны переносной передатчик', 'Сверить с Семёном график последнего трамвая', 'Включить резервную линию на доступном участке', 'Подать запись в эфир у рыночной доски смены'],
    },
    {
        id: exports.blackoutNightId, title: 'Город на слух', client: 'Дежурная рынка', pay: 1650,
        brief: 'Свет под эстакадой исчез. Начни у распределительного щита. Прислушайся к прерывистому стартеру, а затем проверь аварийный звонок на трамвайной остановке. Повороты и громкость подсказывает указатель звука.',
        steps: ['Осмотреть распределительный щит рынка', 'По треску стартера отыскать генератор', 'По звонку найти аварийный блок у платформы', 'Вернуться к распределительному щиту и вернуть свет'],
    },
];
