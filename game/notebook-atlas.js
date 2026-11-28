"use strict";

const T = require('../engine/three.module.min.js');
const { apartments, apartmentEntry, groundHeight } = require('./world-layout.js');
const { expansionRoads } = require('./world-expansion-layout.js');
const { regionRoads, regionSites } = require('./region-layout.js');
const { tramStops } = require('./world-railway.js');
const { roadStops, serviceGates } = require('./city-life-layout.js');
const { entrances } = require('./exploration-layout.js');
const roads = [...expansionRoads, ...regionRoads].filter(r => r.name);
const landmarks = [
    ...Object.values(entrances),
    ...Object.values(tramStops).map(p => ({ x:p.x, z:p.z, label:'остановка «'+p.title+'»' })),
    ...roadStops.map(p => ({ x:p.x, z:p.z, label:'остановка «'+p.title+'»' })),
    ...serviceGates.map(p => ({ x:p.x, z:p.z, label:p.name })),
    ...regionSites.map(p => ({ ...p.stop, label:p.label })),
    ...apartments.map(a => ({ x: apartmentEntry(a).x, z: apartmentEntry(a).front + .8, label: 'подъезд дома № ' + a.id }))
];
function distanceToRoad(p, r) {
    const dx = r.x2 - r.x1, dz = r.z2 - r.z1;
    const along = Math.max(0, Math.min(1, ((p.x - r.x1) * dx + (p.z - r.z1) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(p.x - r.x1 - along * dx, p.z - r.z1 - along * dz);
}
function approach(p) {
    const nearest = landmarks.reduce((a, b) => Math.hypot(p.x-a.x,p.z-a.z) <= Math.hypot(p.x-b.x,p.z-b.z) ? a : b);
    const street = roads.reduce((a,b) => distanceToRoad(p,a) <= distanceToRoad(p,b) ? a : b);
    const dx = p.x - nearest.x, dz = p.z - nearest.z, distance = Math.round(Math.hypot(dx, dz));
    const bearing = ['восточнее','юго-восточнее','южнее','юго-западнее','западнее','северо-западнее','севернее','северо-восточнее'];
    const direction = bearing[(Math.round(Math.atan2(dz,dx) / (Math.PI / 4)) + 8) % 8];
    return distance < 4 ? street.name + ' · ' + nearest.label :
        street.name + ' · ' + nearest.label + ' · от ориентира ' + distance + ' м ' + direction;
}
const views = [
    { name:'Рынок «Спектр»', caption:'Прилавок Инны под навесом', eye:[30,29], aim:[28,19,2.3] },
    { name:'Школа № 1430', caption:'Главный вход со стороны Канальной', eye:[entrances.school1.x,entrances.school1.z+9], aim:[entrances.school1.x,entrances.school1.z,2.6] },
    { name:'Дом № 23', caption:'Дверь под козырьком со двора', eye:[-35,22], aim:[-34.96,15.5,1.7] },
    { name:'Диспетчерская', caption:'Вход с деповской стороны', eye:[11.1,-43], aim:[11.1,-35.8,1.8] },
    { name:'Канальные гаражи', caption:'Въезд с бетонной площадки', eye:[-41,42], aim:[-49,46,2.2] },
    { name:'Городская оптика', caption:'Дверь под панно с трамваем', eye:[-7,24], aim:[-5,16.6,3] },
    { name:'Продукты у дома № 19', caption:'Вход у торца дома', eye:[37,58], aim:[35.8,55.55,1.7] },
    { name:'Столовая «Причал»', caption:'Вход со стороны гаражной площадки', eye:[-6,39], aim:[-6,44.91,1.7] },
    { name:'Раздевалка депо', caption:'Служебная дверь со стороны путей', eye:[-.7,-27], aim:[-4.08,-26.90,1.7] }
];
function createGuidePhotos(renderer, canvas, scene, world, restoreCamera, restoreScene) {
    const cache = new Map();
    return index => {
        if (!views[index]) return null;
        if (cache.has(index)) return cache.get(index);
        const {eye, aim} = views[index], aspect = canvas.width / Math.max(1,canvas.height);
        const shot = new T.PerspectiveCamera(62, aspect, .1, 180);
        shot.position.set(eye[0], groundHeight(...eye)+1.65, eye[1]);
        shot.lookAt(aim[0], groundHeight(aim[0],aim[1])+aim[2], aim[1]);
        shot.updateMatrixWorld();
        const thumb = document.createElement('canvas');
        thumb.width = 320; thumb.height = 180;
        const painter = thumb.getContext('2d');
        if (!painter) return null;
        try {
            world.cull(shot);
            renderer.render(scene, shot);
            const w = Math.min(canvas.width,canvas.height * 16/9), h = w * 9/16;
            painter.drawImage(canvas, (canvas.width-w)/2, (canvas.height-h)/2, w, h, 0, 0, 320, 180);
            const src = thumb.toDataURL('image/jpeg',.82);
            cache.set(index,src);
            return src;
        } finally {
            world.cull(restoreCamera);
            renderer.render(restoreScene(), restoreCamera);
        }
    };
}
module.exports = { approach, views, createGuidePhotos };
