"use strict";

const tea = { x: -1, z: -34, w: 2.78, d: 10.6 };
const house = { x: -11, z: -94, w: 6.8, d: 9.6 };
const court = { x: -23.2, z: 2.1, w: 10.4, d: 1.48 };
const shops = { x: 60.1, z: 89.6, w: 12, d: 4.7 };
const crane = { x: 80, z: 100.4, cabin: { x: 80.8, y: 16.92, z: 95.69 } };
const wall = (site, x, z, w, d, h) => ({ x: site.x + x, z: site.z + z, w, d, h });
const placeRoofs = [
    { x: tea.x, z: tea.z, w: 2.88, d: 10.60, bottom: 2.407, top: 2.675 },
    { x: house.x, z: house.z, w: house.w, d: house.d, bottom: 2.60, top: 3.57 },
    { x: shops.x - 3.8, z: shops.z - 1.43, w: 19.62, d: 4.29, bottom: 3.05, top: 3.625 }
];

const placeWalls = [
    wall(tea, -1.36, 0, .14, 10.6, 2.62),
    ...[-1, 1].flatMap(side => [
        wall(tea, 1.36, side * 3.02, .14, 4.55, 2.62),
        wall(tea, 0, side * 5.25, 2.78, .18, 2.62)
    ]),
    ...[-3.8, -1.98, 2.52].map(z => wall(tea, -.79, z, .91, .60, .86)),
    ...[-1, 1].flatMap(side => [
        wall(house, side * 3.34, 0, .16, 9.6, 2.75),
        wall(house, side * 2.17, 4.72, 2.49, .16, 2.75),
        wall(house, side * 2.28, -.83, 1.24, 5.80, 1.18)
    ]),
    wall(house, 0, -4.72, 6.8, .16, 2.75),
    wall(shops, 0, -2.28, 12, .16, 2.75),
    ...[-5.93, -1.98, 1.98, 5.93].map(x => wall(shops, x, 0, .15, 4.7, 2.75)),
    ...[-4, 0, 4].map(x => wall(shops, x, -1.61, 2.4, .72, 1.03))
];

function warmSurfaceAt(x, z) {
    return Math.abs(x - court.x) < court.w * .5 && Math.abs(z - court.z) < court.d * .5;
}

module.exports = { tea, house, court, shops, crane, placeWalls, placeRoofs, warmSurfaceAt };
