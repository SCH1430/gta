"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadStopAprons = exports.winterYards = exports.roadStopProps = exports.roadStops = exports.serviceFence = exports.serviceGates = void 0;
exports.serviceGates = [
    { id: 'cargo', name: 'Таможенный проезд', x: -775.1, z: -114.6, w: .22, d: 5.15, h: 3.15, inside: -1 },
    { id: 'timber', name: 'Весовая лесозавода', x: 204.7, z: 676.5, w: .22, d: 4.65, h: 2.75, inside: -1 },
];
exports.serviceFence = exports.serviceGates.flatMap(g => [-1, 1].map(side => ({
    x: g.x, z: g.z + side * (g.d * .5 + 1.58), w: .16, d: 3.16, h: 2.16
})));
exports.roadStops = [
    { id: 'canteen', x: -958, z: -525, yaw: Math.PI / 2, title: 'ТРАКТОВАЯ', sub: 'ЧАЙНАЯ · СТОЯНКА', ink: '#be8d59' },
    { id: 'north', x: -410, z: -771, yaw: 0, title: 'СЕВЕРНЫЙ ПОСТ', sub: 'ТЕПЛО · СВЯЗЬ · 07', ink: '#70908d' },
    { id: 'east', x: 956, z: 434, yaw: -Math.PI / 2, title: 'ВОСТОЧНАЯ', sub: 'СЪЕЗД 12 · СТОЯНКА', ink: '#699496' },
    { id: 'wood', x: -165, z: 773, yaw: Math.PI, title: 'ЛЕСНАЯ БУХТА', sub: 'ПЛОЩАДКА ОТДЫХА', ink: '#8a9b78' },
];
exports.roadStopProps = exports.roadStops.flatMap(p => {
    const sideX = Math.sin(p.yaw), sideZ = Math.cos(p.yaw), acrossX = sideZ, acrossZ = -sideX;
    return [-1, 1].map(sign => ({ x: p.x + acrossX * 2.30 * sign + sideX * 1.14, z: p.z + acrossZ * 2.30 * sign + sideZ * 1.14, w: .25, d: .25, h: 2.65 }));
});
exports.winterYards = [
    { x: -22, z: 44, w: 12, d: 4.5, yaw: 0 },
    { x: 138, z: 109, w: 12, d: 4.9, yaw: 0 },
    { x: 188, z: 680, w: 34, d: 2.4, yaw: 0 },
    { x: -347, z: -100, w: 4.4, d: 14, yaw: Math.PI / 2 },
];
exports.roadStopAprons = exports.roadStops.map(p => ({
    x: p.x + Math.sin(p.yaw) * 4.9, z: p.z + Math.cos(p.yaw) * 4.9,
    w: Math.abs(Math.sin(p.yaw)) > .1 ? 15.3 : 20.4, d: Math.abs(Math.sin(p.yaw)) > .1 ? 20.4 : 15.3,
}));
