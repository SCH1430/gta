"use strict";

const parked = [
    { kind: 'microcar', x: -33.2, z: 46.6, w: 1.62, d: 2.86, h: 1.64, yaw: -.12, viewX: -30.9, viewZ: 46.6 },
    { kind: 'liftback', x: -26, z: 50.4, w: 1.96, d: 5, h: 1.53, yaw: .12, viewX: -28.5, viewZ: 50.4 },
    { kind: 'minivan', x: -10, z: 42, w: 2.1, d: 5.58, h: 2.01, yaw: 0, viewX: -7.2, viewZ: 42 },
    { kind: 'limousine', x: -44, z: 126.7, w: 2.08, d: 7.9, h: 1.70, yaw: 0, viewX: -41.8, viewZ: 126.7 },
    { kind: 'sidecar', x: -18, z: 44.7, w: 1.97, d: 2.7, h: 1.57, yaw: 0, viewX: -16, viewZ: 44.7, offsetX: .19 },
    { kind: 'tricycle', x: 60.5, z: 13, w: 1.57, d: 2.94, h: 1.81, yaw: 0, viewX: 62.3, viewZ: 13 },
    { kind: 'bus', x: 74.2, z: 39.4, w: 2.82, d: 11.8, h: 3.29, yaw: Math.PI / 2, viewX: 74.2, viewZ: 36.8 },
    { kind: 'trolleybus', x: 116, z: -34.1, w: 2.9, d: 18.24, h: 3.48, yaw: -Math.PI / 2, viewX: 116, viewZ: -31.5 },
    { kind: 'service-tram', x: 12.4, z: -21.9, w: 2.82, d: 7.85, h: 3.40, yaw: 0, viewX: 9.6, viewZ: -21.8 },
    { kind: 'double-decker', x: 114.5, z: -10.5, w: 3.16, d: 21.1, h: 4.63, yaw: 0, viewX: 117.6, viewZ: -10.5 }
];
const ferry = { kind: 'ferry', x: -161.8, z: 81.6, yaw: 0, viewX: -158.5, viewZ: 87.9 };
const transitSolids = parked.map(({ x, z, yaw, w, d, h, offsetX = 0 }) => ({
    x: x + offsetX * Math.cos(yaw), z: z - offsetX * Math.sin(yaw), h,
    w: Math.abs(Math.cos(yaw)) * w + Math.abs(Math.sin(yaw)) * d,
    d: Math.abs(Math.sin(yaw)) * w + Math.abs(Math.cos(yaw)) * d
}));

module.exports = { transitSites: [...parked, ferry], transitSolids };
