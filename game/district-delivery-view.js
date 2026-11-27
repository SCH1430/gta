"use strict";
const T = require("../engine/three.module.min.js");
const { Batches } = require("./world-batch.js");
const { signTexture } = require("./world-textures.js");
const { groundHeight } = require("./world-layout.js");
const { specs } = require("./vehicle-cabin.js");

function anchor(parent, name, x, z, yaw = 0) {
    const group = new T.Group();
    group.name = name;
    group.position.set(x, groundHeight(x, z), z);
    group.rotation.y = yaw;
    parent.add(group);
    return group;
}

function board(parent, title, subtitle, y, z, w, h, ink = '#f3d8a1', back = '#3c5559') {
    const map = signTexture(title, subtitle, ink, back, w / h);
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map }));
    mesh.position.set(0, y, z);
    parent.add(mesh);
    (parent.userData.readableSigns ??= []).push({ x: 0, y, z, w, h, angle: 0, text: map.userData.signText });
}

function sortingWindow(scene) {
    const group = anchor(scene, 'Ночное окно «Почты 87»', 143.48, -18.2, -Math.PI / 2);
    const trim = new Batches(group), paint = '#315158', steel = '#747f82';
    trim.box(0, 1.66, .11, 2.48, 1.39, .26, paint);
    trim.box(0, 1.04, .24, 2.58, .13, .46, steel);
    trim.box(0, 2.44, .32, 2.82, .12, .81, paint);
    trim.box(0, 2.515, .32, 2.78, .035, .73, '#c9d6d8');
    trim.box(0, 2.88, .105, 2.51, .59, .23, paint);
    trim.flush();
    board(group, 'ПОЧТА 87', 'НОЧНАЯ СОРТИРОВКА · 21:00–00:00', 2.88, .233, 2.42, .52);

    const shutter = new T.Group(), closed = new Batches(shutter);
    shutter.name = 'Почта 87 · ставни закрыты';
    closed.box(0, 1.67, .26, 2.23, 1.14, .09, '#596c70');
    for (let i = 0; i < 8; i++)
        closed.box(0, 1.16 + .143 * i, .314, 2.23, .028, .021, '#768b8b');
    closed.flush();
    group.add(shutter);

    const open = new T.Group(), window = new Batches(open);
    open.name = 'Почта 87 · окно открыто';
    window.lamp(0, 1.67, .235, 2.21, 1.15, .025, '#eab87d');
    window.box(0, 1.28, .28, 2.20, .39, .065, '#765d4d');
    window.box(0, 1.72, .29, .069, 1.02, .038, '#43575a');
    window.box(-.79, 1.34, .32, .38, .46, .09, '#cbc096');
    window.box(.72, 1.25, .37, .56, .25, .19, '#928c67');
    window.box(.28, 1.15, .44, .30, .023, .16, '#efe0b3');
    window.lamp(0, 2.36, .55, 1.86, .031, .080, '#ffe5aa');
    window.flush();
    open.visible = false;
    group.add(open);
    return { shutter, open };
}

function cafeBoard(scene) {
    const group = anchor(scene, 'График смены у кафе «Горячий лёд»', -98.7, 39.76, Math.PI);
    const frame = new Batches(group);
    frame.box(0, 1.63, .09, 1.80, .88, .19, '#47544e');
    frame.box(0, 1.16, .12, 1.85, .085, .23, '#b1c2bd');
    frame.flush();
    const pending = new T.Group(), delivered = new T.Group();
    pending.name = 'Доска кафе · старое объявление';
    delivered.name = 'Доска кафе · новый график';
    board(pending, 'ГОРЯЧИЙ ЛЁД', 'РАСПИСАНИЕ УТОЧНЯЕТСЯ', 1.63, .195, 1.66, .74, '#afc0b1', '#374747');
    board(delivered, 'ЗАВТРАК ДЛЯ СМЕНЫ', 'КАФЕ ОТКРЫТО С 06:30', 1.63, .195, 1.66, .74, '#281f1a', '#ffd297');
    const light = new Batches(delivered);
    light.lamp(0, 2.09, .16, 1.34, .054, .082, '#ffd08f');
    light.flush();
    delivered.visible = false;
    group.add(pending, delivered);
    return { pending, delivered };
}

function roadBoard(scene) {
    const group = anchor(scene, 'Сменный рейс · южный подход', -935.9, 119.45, Math.PI);
    const frame = new Batches(group);
    for (const x of [-.79, .79])
        frame.box(x, .98, 0, .095, 1.96, .095, '#566c70');
    frame.box(0, 1.88, 0, 2.16, .77, .11, '#435b5d');
    frame.flush();
    board(group, 'СМЕННЫЙ РЕЙС', 'ОТПРАВЛЕНИЕ У ВАГОННОГО МОСТА', 1.88, .061, 2.07, .70);
}

function createDistrictDeliveryView(scene) {
    const post = sortingWindow(scene), cafe = cafeBoard(scene);
    roadBoard(scene);
    const beacon = new T.Group(), base = new Batches(beacon), lamp = new T.Group(), lights = new Batches(lamp);
    beacon.name = 'Оранжевый маяк сменного фургона';
    base.box(0, specs.van.roof + .062, -.50, .56, .104, .21, '#a56d37');
    lights.lamp(0, specs.van.roof + .125, -.50, .53, .075, .19, '#ffbc4b');
    base.flush();
    lights.flush();
    beacon.add(lamp);
    scene.add(beacon);
    beacon.visible = false;
    return {
        post(open, delivered) {
            post.shutter.visible = !open;
            post.open.visible = open;
            cafe.pending.visible = !delivered;
            cafe.delivered.visible = delivered;
        },
        van(car, elapsed) {
            beacon.visible = !!car;
            if (car) {
                beacon.position.set(car.x, car.y, car.z);
                beacon.rotation.y = car.yaw;
                lamp.visible = Math.floor(elapsed * (car.braking ? 4 : 2.5)) % 2 === 0;
            }
        }
    };
}

exports.createDistrictDeliveryView = createDistrictDeliveryView;
