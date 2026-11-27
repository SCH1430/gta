'use strict';

const river = {
    door: { x: -5, z: 103.32, yaw: 0, zone: 'river-station', label: 'Речной вокзал' },
    centre: 258,
    dispatcher: { x: 258, z: -2.55 },
    display: { x: 258, z: -4.22 },
    bus: { x: -13.4, z: 105.7 },
    taxi: { x: 14.8, z: 104.1 },
    passengers: [
        { name: 'Вера', x: 255.3, z: .9, style: 5, route: 'bus', question: 'Я еду на рынок. Мне бы на автобус, на такси не хватит.', answer: 'Вера идёт к автобусу на рынок.' },
        { name: 'Марат', x: 261.4, z: .65, style: 14, route: 'taxi', question: 'К диспетчерской на смену. До начала 15 минут. На такси есть деньги.', answer: 'Марат вышел к стоянке такси.' },
        { name: 'Анна', x: 261.4, z: 2.5, style: 11, route: 'bus', question: 'Я обещала встретиться с Верой на рынке. Нужна та же остановка.', answer: 'Анна догоняет Веру у автобуса.' },
    ],
};
const metal = {
    door: { x: -95.75, z: 39.18, yaw: Math.PI, zone: 'metal-hall', label: 'ДК «Металлург»' },
    centre: 283,
    leader: { x: 283, z: -1.6 },
    stands: [{ x: 280.55, z: -1.15 }, { x: 285.45, z: -1.15 }],
    players: [{ x: 280.9, z: -3.4 }, { x: 285.05, z: -3.5 }],
    opens: 18 * 60,
    closes: 22 * 60,
};

const rehearsalOpen = minutes => minutes >= metal.opens && minutes < metal.closes;

module.exports = { river, metal, rehearsalOpen };
