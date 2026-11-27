"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStreetDetail = addStreetDetail;
const THREE = require("../engine/three.module.min.js");
const world_batch_js_1 = require("./world-batch.js");
const world_layout_js_1 = require("./world-layout.js");
const world_textures_js_1 = require("./world-textures.js");
const steel = '#4d5661';
const dark = '#303740';
const snow = '#b8c1c5';
const ads = {
    oil: { icon: 'oil', name: 'СЕВЕР-ОЙЛ', title: 'ЗАВЕДЁТСЯ', line: 'ДАЖЕ В МИНУС СОРОК', tag: 'МОТОРНОЕ МАСЛО 5W', paint: '#354f4c', paper: '#d7d7af', ink: '#f0bd77' },
    tram: { icon: 'tram', name: 'КАНАЛЬНЫЙ ТРАНСПОРТ', title: 'НОЧНОЙ 07', line: 'ДО ПОСЛЕДНЕЙ ОСТАНОВКИ', tag: 'ЭЛЕКТРОТРАНСПОРТ', paint: '#584147', paper: '#ead5a9', ink: '#e9a070' },
    radio: { icon: 'radio', name: 'ГОРОДСКОЙ ЭФИР', title: 'КАНАЛ 77', line: 'ГОЛОСА НОЧНОЙ СМЕНЫ', tag: '88.7 FM', paint: '#293e55', paper: '#c9d9ce', ink: '#83c6b9' },
    rivers: { icon: 'rivers', name: 'РЕЧНОЙ ФЛОТ', title: 'ЗИМНИЙ ПОРТ', line: 'СОХРАНИМ БЕРЕГА ЧИСТЫМИ', tag: 'СЛУЖБА НАБЕРЕЖНЫХ', paint: '#344955', paper: '#d6d9bf', ink: '#b9a77f' }
};
function posterFace(ad) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 224;
    const c = canvas.getContext('2d'), rnd = (0, world_textures_js_1.random)(77 + ad.tag.length * 3);
    c.fillStyle = ad.paint;
    c.fillRect(0, 0, 512, 224);
    c.fillStyle = ad.paper;
    c.fillRect(13, 14, 486, 3);
    c.fillRect(13, 179, 486, 1);
    c.fillRect(13, 212, 486, 2);
    c.font = 'bold 18px K77Body, sans-serif';
    c.fillText(ad.name, 24, 44, 304);
    c.font = 'bold 66px K77Display, sans-serif';
    c.fillText(ad.title, 21, 121, 316);
    c.font = 'bold 21px K77Body, sans-serif';
    c.fillText(ad.line, 24, 157, 301);
    c.font = 'bold 15px K77Body, sans-serif';
    c.fillText(ad.tag, 24, 201, 464);
    c.save();
    c.translate(414, 101);
    c.strokeStyle = ad.ink;
    c.fillStyle = ad.ink;
    c.lineWidth = 4;
    c.strokeRect(-53, -53, 106, 106);
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    switch (ad.icon) {
        case 'oil':
            c.moveTo(0, -40);
            c.bezierCurveTo(-11, -19, -34, -2, -34, 15);
            c.bezierCurveTo(-34, 52, 34, 52, 34, 15);
            c.bezierCurveTo(34, -2, 11, -19, 0, -40);
            c.fill();
            c.strokeStyle = ad.paint;
            c.beginPath();
            c.moveTo(-20, 16);
            c.quadraticCurveTo(-17, 28, -7, 28);
            c.stroke();
            break;
        case 'tram':
            c.strokeRect(-29, -31, 58, 57);
            c.strokeRect(-21, -22, 42, 25);
            c.fillRect(-18, 12, 7, 7);
            c.fillRect(12, 12, 7, 7);
            c.moveTo(-14, -32);
            c.lineTo(14, -43);
            c.moveTo(-18, 26);
            c.lineTo(-28, 40);
            c.moveTo(18, 26);
            c.lineTo(28, 40);
            c.stroke();
            break;
        case 'radio':
            for (const r of [16, 30, 43]) {
                c.moveTo(r * .68, -r * .74);
                c.arc(0, 0, r, -.83, .83);
                c.moveTo(-r * .68, r * .74);
                c.arc(0, 0, r, Math.PI - .83, Math.PI + .83);
            }
            c.stroke();
            c.beginPath();
            c.arc(0, 0, 7, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.moveTo(0, 10);
            c.lineTo(-16, 37);
            c.lineTo(16, 37);
            c.lineTo(0, 10);
            c.stroke();
            break;
        case 'rivers':
            c.moveTo(-35, 10);
            c.lineTo(35, 10);
            c.lineTo(24, 26);
            c.lineTo(-24, 26);
            c.closePath();
            c.fill();
            c.fillRect(-17, -7, 33, 15);
            c.fillRect(-10, -26, 8, 17);
            c.beginPath();
            c.moveTo(-37, 35);
            c.bezierCurveTo(-26, 22, -18, 47, -7, 35);
            c.bezierCurveTo(5, 22, 12, 47, 24, 35);
            c.quadraticCurveTo(32, 27, 38, 34);
            c.stroke();
            break;
    }
    c.restore();
    for (let i = 0; i < 870; i++) {
        c.fillStyle = i % 5 ? 'rgba(21,28,32,.12)' : 'rgba(244,223,185,.15)';
        c.fillRect(rnd() * 512, rnd() * 224, 1 + rnd() * 5, .5 + rnd() * 2.5);
    }
    return (0, world_textures_js_1.texture)(canvas);
}
function mountPoster(batch, labels, ad, p, standBase) {
    const { x, y, z, width, height, angle } = p;
    const c = Math.cos(angle), s = Math.sin(angle);
    const pos = (side, depth = 0) => [x + c * side + s * depth, z - s * side + c * depth];
    batch.box(x, y, z, width + .15, height + .15, .16, dark, angle);
    const [faceX, faceZ] = pos(0, .085);
    labels.place('placard-' + ad.icon, () => posterFace(ad), faceX, y, faceZ, width, height, angle);
    const [rimX, rimZ] = pos(0, .03);
    batch.box(rimX, y + height * .52, rimZ, width + .30, .09, .25, snow, angle);
    if (standBase !== undefined) {
        const sill = y - height * .5;
        for (const side of [-.34, .34]) {
            const [footX, footZ] = pos(side * width, -.56), [topX, topZ] = pos(side * width);
            batch.beam(footX, standBase, footZ, topX, sill + .05, topZ, .18, steel, true);
            batch.box(topX, (sill + standBase) / 2, topZ, .19, sill - standBase + .12, .22, steel, angle);
        }
        for (const side of [-.33, .33]) {
            const [lampX, lampZ] = pos(width * side, .26);
            batch.lamp(lampX, sill + .04, lampZ, .4, .095, .2, ad.ink, angle);
        }
    }
}
function shopFront(b, labels, x, wall, width, title, sub, tint, angle) {
    const face = Math.cos(angle);
    const depth = (value) => wall + value * face;
    b.box(x, 1.46, depth(.07), width, 2.92, .14, '#35464c');
    b.box(x, .25, depth(.14), width - .18, .38, .17, '#69737a');
    for (const offset of [-.33, -.02, .29]) {
        const pane = width * .285, xx = x + offset * width;
        b.box(xx, 1.47, depth(.19), pane, 1.91, .15, '#52666b');
        b.lamp(xx, 1.53, depth(.273), pane - .15, 1.73, .022, tint);
        b.box(xx, 2.14, depth(.290), pane - .13, .084, .047, '#787871');
        b.box(xx, 1.51, depth(.288), .046, 1.35, .041, '#53646a');
        b.box(xx - .24, 1.03, depth(.285), pane * .42, .69, .021, '#5d6769');
        b.box(xx + .3, .95, depth(.285), pane * .27, .52, .022, '#7b7b75');
    }
    b.box(x, 2.86, depth(.16), width + .18, .69, .33, '#3f555f');
    b.box(x, 3.251, depth(.16), width + .24, .095, .41, snow);
    labels.place('shop-' + title, () => (0, world_textures_js_1.signTexture)(title, sub, '#d9cbab', '#3b5056', (width - .48) / .52), x, 2.87, depth(.334), width - .48, .52, angle);
    b.lamp(x, 2.51, depth(.30), width - .59, .048, .074, tint);
}
function overheadLine(batch, from, to, y, sag, color = dark) {
    let lastX = from.x, lastY = y, lastZ = from.z;
    for (let n = 1; n <= 12; n++) {
        const t = n / 12;
        const x = THREE.MathUtils.lerp(from.x, to.x, t), z = THREE.MathUtils.lerp(from.z, to.z, t), h = y - 4 * sag * t * (1 - t);
        batch.beam(lastX, lastY, lastZ, x, h, z, .052, color, true);
        lastX = x;
        lastY = h;
        lastZ = z;
    }
}
function asphaltRepairs(dst, cuts) {
    const positions = [], colors = [], color = new THREE.Color(), rnd = (0, world_textures_js_1.random)(871);
    const point = (x, y, z) => { positions.push(x, y, z); colors.push(color.r, color.g, color.b); };
    for (const { x, z, w, d, angle, paint } of cuts) {
        const y = (0, world_layout_js_1.groundHeight)(x, z) + .011, ca = Math.cos(angle), sa = Math.sin(angle);
        const shape = Array.from({ length: 9 }, (_, j) => {
            const t = j / 8 * Math.PI * 2, jag = .76 + rnd() * .24;
            const u = w * .5 * Math.cos(t) * jag, v = d * .5 * Math.sin(t) * jag;
            return { x: x + u * ca - v * sa, z: z + u * sa + v * ca };
        });
        shape[8] = shape[0];
        for (let j = 0; j < 8; j++) {
            color.set(paint).multiplyScalar(.82 + rnd() * .28);
            point(x, y, z);
            point(shape[j + 1].x, y, shape[j + 1].z);
            point(shape[j].x, y, shape[j].z);
        }
    }
    const pavement = new THREE.BufferGeometry();
    pavement.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    pavement.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(pavement, new THREE.MeshBasicMaterial({ vertexColors: true }));
    mesh.userData.groundSurface = true;
    mesh.name = 'Уличные заплаты асфальта';
    dst.add(mesh);
}
function addStreetDetail(parent) {
    const sectors = [];
    function place(name, compose) {
        const group = new THREE.Group();
        group.name = name;
        group.userData.regionalCell = true;
        const b = new world_batch_js_1.Batches(group), labels = new world_batch_js_1.Panels(group);
        compose(b, labels, group);
        b.flush();
        labels.flush();
        parent.add(group);
        sectors.push({ mesh: group, extent: new THREE.Box3().setFromObject(group) });
    }
    place('Улица у гаража', (b, labels, g) => {
        mountPoster(b, labels, ads.oil, { x: -50.65, y: 7.54, z: 43.7, width: 8.6, height: 3.76, angle: Math.PI / 2 }, 4.37);
        for (const z of [38.48, 52.89]) {
            b.box(-46.89, 2.61, z, .15, .84, .72, steel);
            b.box(-46.78, 2.58, z, .17, .64, .60, '#6c7b78');
            for (let j = 0; j < 4; j++)
                b.box(-46.683, 2.38 + j * .11, z, .03, .038, .45, '#414b52');
            b.lamp(-46.67, 2.83, z + .16, .04, .079, .062, '#c49358');
        }
        shopFront(b, labels, -7.38, 46, 6.24, 'ПРИЧАЛ', 'СТОЛОВАЯ · 06—23', '#a5936f', Math.PI);
        shopFront(b, labels, .04, 46, 5.92, 'ТЕПЛОСЕТЬ', 'ПРИЁМ ЗАЯВОК', '#7d9b92', Math.PI);
        asphaltRepairs(g, [{ x: -32, z: 30.9, w: 2.8, d: .61, angle: -.09, paint: '#263440' },
            { x: -41, z: 31.9, w: 2.2, d: 1.02, angle: -.15, paint: '#46515d' },
            { x: -36.8, z: 40.1, w: 1.68, d: .65, angle: .54, paint: '#333a42' }]);
    });
    place('Улицы панельного квартала', (b, labels) => {
        mountPoster(b, labels, ads.tram, { x: -29.5, y: 1.76, z: 15.74, width: 2.63, height: 1.15, angle: 0 });
        mountPoster(b, labels, ads.radio, { x: -38.57, y: 4.39, z: -5.65, width: 4.17, height: 1.82, angle: -Math.PI / 2 });
        for (const x of [-11.17, -10.89]) {
            overheadLine(b, { x, z: 15.55 }, { x, z: 46.05 }, 10.59, 1.91, '#31343b');
            b.box(x, 10.57, 15.65, .23, .20, .30, steel);
            b.box(x, 10.57, 45.86, .23, .19, .29, steel);
        }
        for (const z of [6.43, 13.56]) {
            for (const y of [4.32, 5.94])
                b.box(-19.56, y, z, 4.19, .12, .14, '#535e62');
            for (const x of [-21.42, -17.72]) {
                b.box(x, 5.12, z, .12, 1.58, .15, '#535e62');
                for (const y of [4.57, 5.16, 5.72])
                    b.box(x, y, z + (z > 10 ? .09 : -.09), .043, .051, .045, '#819397');
            }
        }
        for (const [x, z] of world_layout_js_1.streetBins) {
            b.cyl(x, 1.231, z, .52, .026, '#6e746e');
            for (const dy of [.25, .97])
                b.cyl(x, dy, z, .68, .052, '#465961');
        }
    });
    place('Под эстакадой рынка', (b, labels, g) => {
        for (let x = 18; x < 109; x += 5.4) {
            b.box(x, 5.82, 13, .27, .23, 7.48, steel);
            if (Math.round((x - 18) / 5.4) % 2 === 0) {
                b.box(x, 5.64, 15.47, 1.15, .15, .26, dark);
                b.lamp(x, 5.55, 15.47, .97, .047, .17, '#e0b179');
                b.box(x, 5.66, 10.62, .84, .13, .22, dark);
                b.lamp(x, 5.58, 10.62, .74, .04, .14, '#9eb9ad');
            }
        }
        for (const z of [10.15, 15.85])
            b.box(63, 5.78, z, 100, .20, .13, '#606670');
        for (const x of [17, 39, 57, 78, 100]) {
            b.box(x, 1.75, 13.93, 1.18, .38, .12, '#64564a');
            for (const offset of [-.39, 0, .39]) {
                b.piece('box', x + offset, 1.75, 13.995, .10, .34, .024, '#b49967', 0, -.44);
            }
        }
        mountPoster(b, labels, ads.radio, { x: 79.6, y: 6.38, z: 16.93, width: 5.05, height: 2.20, angle: 0 });
        mountPoster(b, labels, ads.tram, { x: 28.6, y: 6.47, z: 9.045, width: 4.75, height: 2.08, angle: Math.PI });
        labels.place('delivery-bay', () => (0, world_textures_js_1.signTexture)('ВЫГРУЗКА', 'ТОРГОВЫЙ СЕКТОР В', '#e6ccac', '#49575f', 4.6), 49.50, 5.43, 13.83, 3.62, .79, -Math.PI / 2);
        b.box(49.61, 5.45, 13.83, .19, .84, 3.72, dark);
        for (const z of [12.23, 15.43])
            b.box(49.61, 5.91, z, .11, .23, .13, steel);
        shopFront(b, labels, 65.63, 4.5, 4.75, 'КАССЫ', 'РЕЧНЫЕ БИЛЕТЫ', '#a88d78', 0);
        mountPoster(b, labels, ads.rivers, { x: 72, y: 2.89, z: 4.59, width: 3.56, height: 1.56, angle: 0 });
        asphaltRepairs(g, [{ x: 43.2, z: 8.3, w: 1.9, d: .55, angle: 1.47, paint: '#343a40' },
            { x: 47.9, z: 20.5, w: 2.37, d: .68, angle: 1.61, paint: '#3d4955' },
            { x: 59.8, z: 30.9, w: 3.5, d: 1.5, angle: .2, paint: '#2d3843' }]);
    });
    place('Теплотрасса у депо', (b, labels, g) => {
        const north = -59.1, south = -31.9, height = 8.73;
        for (const x of [21.67, 27.03]) {
            const radius = x < 23 ? .89 : .67;
            b.beam(x, height, north, x, height, south, radius, x < 23 ? '#776552' : '#757c72');
            for (const z of [north, south]) {
                b.box(x, 4.32, z, .31, 8.64, .30, steel);
                b.box(x, 8.11, z, .80, .47, .68, '#545d5e');
            }
            for (let z = -57.5; z < -32; z += 3.45) {
                b.piece('round', x, height, z, radius * 1.12, .21, radius * 1.12, '#4f5b61', 0, 0, Math.PI / 2);
                b.box(x, height + radius * .53, z - 1.2, radius * .44, .051, 2.76, snow);
            }
        }
        for (let z = -57.5; z < -32; z += 3.45) {
            b.box(24.35, 8.06, z, 6.09, .20, .19, '#515e65');
            b.beam(21.75, 7.87, z, 26.97, 7.87, z + 2.9, .10, '#697376', true);
        }
        mountPoster(b, labels, ads.tram, { x: 21.12, y: 8.91, z: -46.7, width: 5.19, height: 2.27, angle: -Math.PI / 2 });
        b.lamp(24.30, 7.92, -43.7, 2.14, .083, .17, '#f8bc73');
        b.lamp(24.30, 7.92, -50.93, 2.14, .083, .17, '#e0a570');
        asphaltRepairs(g, [{ x: 19.6, z: -44.9, w: 3.37, d: 2.17, angle: -.13, paint: '#3b4753' },
            { x: 10.4, z: -47.9, w: 1.75, d: .56, angle: -.11, paint: '#26343e' },
            { x: 29.3, z: -49.1, w: 2.42, d: .72, angle: .1, paint: '#303c44' }]);
    });
    const frustum = new THREE.Frustum(), projection = new THREE.Matrix4(), eye = new THREE.Vector3();
    return (camera) => {
        frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        eye.setFromMatrixPosition(camera.matrixWorld);
        for (const { mesh, extent } of sectors)
            mesh.visible = extent.distanceToPoint(eye) < 145 && frustum.intersectsBox(extent);
    };
}
