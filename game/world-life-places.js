"use strict";

const T = require("../engine/three.module.min.js");
const { Batch, lit } = require("./model-geometry.js");
const { signTexture } = require("./world-textures.js");
const { softFlake } = require("./airborne-snow.js");
const { createPerson } = require("./model-people.js");
const { createVehicle } = require("./model-cars.js");
const { groundHeight } = require("./world-layout.js");
const { tea, house, court, shops, crane } = require("./world-life-place-layout.js");

const glass = new T.MeshBasicMaterial({ color: '#e5c19a', vertexColors: true, transparent: true, opacity: .38, depthWrite: false, side: T.DoubleSide });
const snow = '#b9c6ca', windowFrame = '#556d6b', teal = '#547973', rust = '#987168', steel = '#53656b', timber = '#9a795d';
const clamp = T.MathUtils.clamp;
const dayAt = ctx => Math.floor(ctx.calendarMinutes / 1440);
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const hour = minute => String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0');

function sceneAt(parent, name, point) {
    const group = new T.Group();
    group.name = name;
    group.userData.dynamicScenery = true;
    group.position.set(point.x, groundHeight(point.x, point.z), point.z);
    parent.add(group);
    return group;
}

function sign(group, title, subtitle, x, y, z, w, h, yaw = 0, back = '#3d5658') {
    if (typeof document === 'undefined') return;
    const map = signTexture(title, subtitle, '#f1d7a9', back, w / h);
    const mesh = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map, toneMapped: false }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = yaw;
    group.add(mesh);
}

function mug(batch, x, y, z, color) {
    batch.rod([x, y, z], [x, y + .086, z], .046, color);
    batch.rod([x, y + .086, z], [x, y + .091, z], .038, '#684f3d');
    batch.box(x + .047, y + .053, z, .033, .036, .016, color);
}

function retiredTram(parent) {
    const group = sceneAt(parent, 'Чайная в списанном трамвае', tea);
    const body = new Batch(), lamps = new Batch(), panes = new Batch();
    body.box(0, .075, 0, 2.71, .14, 10.42, '#52605c');
    body.box(0, 2.51, 0, 2.88, .205, 10.60, '#8d9c97');
    body.box(0, 2.64, .12, 2.49, .07, 10.32, snow);
    body.box(0, 1.08, -5.24, 2.70, 2.01, .17, teal);
    body.box(0, 1.08, 5.24, 2.70, 2.01, .17, teal);
    for (const side of [-1, 1]) {
        for (let i = -4; i <= 4; i++) {
            if (side === 1 && !i) continue;
            const z = i * 1.16, x = side * 1.36;
            body.box(x, .54, z, .14, .93, 1.16, teal);
            body.box(x, .89, z, .156, .10, 1.16, '#c2ad87');
            body.box(x, 1.11, z, .16, .16, 1.16, '#698379');
            body.box(x, 2.265, z, .14, .325, 1.16, '#9bad9e');
            body.box(x, 1.72, z + .556, .13, 1.09, .061, windowFrame);
            panes.box(x, 1.67, z, .021, .91, 1.078, '#e0bf90');
            for (const line of [-.30, -.20, .17])
                panes.box(x + side * .017, 1.39 + line * .25, z + line, .008, .36, .052, '#dbe3d6');
        }
        body.rod([side * .91, 2.27, -4.82], [side * .91, 2.27, 4.82], .027, '#c4ad6e');
        for (const z of [-4.2, -2.6, 2.24, 3.73])
            body.rod([side * .91, 2.26, z], [side * .91, 2.06, z], .014, '#d5bd80');
        for (const z of [-3.8, 3.8]) {
            body.rod([side * .97, .21, z], [side * 1.30, .21, z], .23, '#484d4b');
            body.rod([side * 1.25, .22, z], [side * 1.33, .22, z], .11, '#737978');
        }
    }
    for (const z of [-3.8, -1.98, 2.52]) {
        body.box(-.79, .80, z, .91, .088, .60, timber);
        body.rod([-.79, .12, z], [-.79, .76, z], .056, steel);
        body.box(-.81, .49, z + .56, .74, .089, .43, rust);
        body.box(-.81, .48, z - .56, .74, .09, .43, rust);
        body.box(-.81, .67, z + .78, .74, .40, .09, '#936b62');
        body.box(-.81, .67, z - .78, .74, .40, .09, '#936b62');
        mug(body, -.84, .847, z + .11, '#c7c9ab');
        mug(body, -.63, .847, z - .13, '#b36e5c');
    }
    for (const z of [-3.2, -1.2, .76, 2.71, 4.48])
        lamps.box(0, 2.405, z, .34, .038, .38, '#f3d49f');
    body.box(1.56, .06, 0, .49, .10, 1.36, '#7c8c8a');
    body.box(1.43, 2.41, 0, .32, .25, 1.58, windowFrame);
    body.box(0, 2.18, 5.35, 1.94, .42, .10, '#444e49');
    group.add(body.mesh(), lamps.mesh(lit), panes.mesh(glass));
    sign(group, 'ЧАЙНАЯ 07', 'ВАГОН СНЯТ С МАРШРУТА', 0, 2.18, 5.404, 1.88, .39);
    sign(group, 'ЧАЙ · ПИРОГ', '', 1.596, 2.415, 0, 1.52, .20, Math.PI / 2);

    let drivers;
    return { group, update(ctx) {
        if (!drivers) {
            drivers = [createPerson('resident', 13), createPerson('resident', 18)];
            drivers.forEach((driver, i) => {
                driver.root.position.set(-.79, .13, 2.52 + (i ? -.58 : .58));
                driver.root.rotation.y = i ? Math.PI : 0;
                group.add(driver.root);
            });
        }
        const speaker = Math.floor(ctx.elapsed / 7) % 2;
        drivers.forEach((driver, i) => driver.update(ctx.dt, 0, false, {
            seated: 1, seatHeight: .49, conversation: true, glance: i ? -.17 : .18,
            speech: i === speaker ? Math.max(0, Math.sin(ctx.elapsed * 11) * .44) : 0
        }));
    }};
}

function greenhouse(parent) {
    const group = sceneAt(parent, 'Оранжерея при Северной ТЭЦ', house);
    const body = new Batch(), panes = new Batch(), lamps = new Batch(), sprouts = new Batch(), produce = new Batch();
    body.box(0, .013, 0, house.w, .032, house.d, '#687b72');
    for (const side of [-1, 1]) {
        body.box(side * 3.37, .36, 0, .15, .68, house.d, '#526c62');
        body.box(side * 3.37, 2.57, 0, .17, .153, house.d, windowFrame);
        for (const z of [-4.5, -2.3, 0, 2.3, 4.5]) {
            body.box(side * 3.37, 1.64, z, .12, 2.02, .10, windowFrame);
            body.rod([0, 3.57, z], [side * 3.41, 2.60, z], .055, windowFrame, true);
        }
        panes.box(side * 3.37, 1.64, 0, .021, 1.88, 9.49, '#c9c9a3');
        panes.quad([0, 3.57, -4.8], [side * 3.41, 2.60, -4.8], [side * 3.41, 2.60, 4.8], [0, 3.57, 4.8], '#a0afa7');
        panes.box(side * 2.15, 1.63, 4.72, 2.46, 1.85, .021, '#d3cd9e');
        body.box(side * 2.15, .355, 4.72, 2.50, .68, .13, teal);
        body.box(side * .93, 1.31, 4.72, .10, 2.59, .12, windowFrame);
        body.box(side * 2.28, .98, -.83, 1.24, .14, 5.8, timber);
        body.box(side * 2.28, 1.052, -.83, 1.11, .055, 5.51, '#514c36');
        for (const z of [-3.53, -1.78, .14, 1.85]) {
            body.box(side * 2.28, .47, z, .12, .89, .12, windowFrame);
            lamps.box(side * 2.28, 2.33, z, .34, .044, .51, '#ffe5a9');
        }
    }
    body.box(0, 1.69, -4.72, house.w, 3.27, .14, '#4c6861');
    body.box(0, 2.50, 4.72, house.w, .16, .14, windowFrame);
    body.box(0, 3.55, 0, .14, .10, house.d, windowFrame);
    body.rod([-3.34, .48, -3.1], [-6.1, .48, -3.1], .145, '#9b745b');
    body.rod([-6.1, .17, -3.1], [-6.1, .48, -3.1], .148, '#9b745b');
    body.box(0, .028, 5.03, 2.2, .047, .64, '#8d8b74');
    for (let i = 0; i < 5; i++) {
        const z = -3.24 + i * 1.06;
        body.rod([2.26, 1.02, z], [2.26, 1.74, z], .03, '#746d42');
        body.ball(2.26, 1.86, z, .65, .55, .62, i % 2 ? '#527544' : '#627443');
        for (const [x, y, dz] of [[2.47, 1.76, .13], [2.06, 1.93, .11], [2.42, 2.02, -.12]])
            body.ball(x, y, z + dz, .11, .14, .112, '#c7a84b');
    }
    for (let i = 0; i < 21; i++) {
        const z = -3.43 + i * .253, x = -2.28 + Math.sin(i * 2.7) * .29;
        for (const side of [-1, 1]) {
            const width = .069 + .018 * (1 + Math.cos(i * 3.2));
            sprouts.tri([x, .014, z], [x + width * side, .18 + .06 * Math.sin(i), z - .07],
                [x + width * .55 * side, .16, z + .08], i % 2 ? '#6e9253' : '#87a559');
        }
    }
    for (let i = 0; i < 3; i++) {
        const x = -1.16 - i * .71;
        produce.box(x, .17, 5.36, .58, .28, .48, timber);
        produce.box(x, .319, 5.36, .53, .028, .42, '#739052');
    }
    const herbs = sprouts.mesh(), crates = produce.mesh();
    herbs.position.y = 1.069;
    group.add(body.mesh(), panes.mesh(glass), lamps.mesh(lit), herbs, crates);
    sign(group, 'ТЕПЛИЦА № 08', 'ЛИМОНЫ · ЗЕЛЕНЬ · ТЭЦ', 0, 2.55, 4.815, 2.74, .52, 0, '#3a5c55');

    let porter, van;
    return { group, update(ctx, watered) {
        const dispatch = ctx.minutes >= 350 && ctx.minutes < 390;
        const progress = clamp((ctx.minutes - 350) / 40, 0, 1);
        herbs.scale.y = .46 + .49 * (ctx.minutes / 1440) + (watered === dayAt(ctx) ? .20 : 0);
        crates.visible = dispatch;
        crates.scale.x = 1 - progress * .30;
        if (dispatch && !porter) {
            porter = createPerson('resident', 8);
            van = createVehicle('van', '#899775');
            van.root.name = 'Фургон утренней развозки';
            van.root.rotation.y = Math.PI / 2;
            group.add(porter.root, van.root);
        }
        if (!porter) return;
        porter.root.visible = dispatch;
        van.root.visible = dispatch;
        if (!dispatch) return;
        const trip = (ctx.minutes - 350 + (ctx.elapsed * .5) % 1) % 13, leaving = clamp((ctx.minutes - 382) / 8, 0, 1);
        const out = trip < 7, along = out ? trip / 7 : (13 - trip) / 6;
        const travelZ = 4.65 + 5.0 * along, travelX = -.50 - along * 2.6;
        porter.root.position.set(travelX, groundHeight(house.x + travelX, house.z + travelZ), travelZ);
        porter.root.rotation.y = out ? 2.66 : -.478;
        porter.update(ctx.dt, .40, false, { carry: out ? 'crate' : undefined });
        porter.root.visible = leaving === 0;
        van.root.position.set(-5.25 - leaving * 13, 0, 10.1);
        van.update(ctx.dt, leaving > 0 ? .82 : 0, 0, true, false, 0, { npcDriver: leaving > 0 });
    }};
}

function heatedCourtyard(parent) {
    const group = sceneAt(parent, 'Тёплый двор над теплотрассой', court);
    const pavement = new Batch(), catBody = new Batch();
    for (let i = 0; i < 21; i++) {
        const x = (i - 10) * .48, shift = Math.sin(i * .64) * .08;
        pavement.box(x, .013, shift, .488, .031, 1.47, i % 3 ? '#7c817a' : '#848682');
        for (const side of [-1, 1])
            pavement.box(x, .024, shift + side * (.70 + .06 * Math.sin(i * .76)), .49, .045, .18, i % 2 ? snow : '#9facb1');
    }
    pavement.rod([0, .028, 0], [0, .089, 0], .60, '#535a57');
    for (let i = -3; i <= 3; i++) {
        pavement.box(i * .128, .091, .08, .019, .008, .59, '#363f41');
        pavement.box(i * .128, .092, -.30, .035, .01, .071, '#879087');
    }
    pavement.box(3.3, .40, 1.05, 1.46, .13, .32, timber);
    for (const x of [2.66, 3.95]) pavement.box(x, .19, 1.05, .09, .39, .31, steel);
    catBody.ball(-.025, .097, 0, .31, .18, .42, '#8d6952');
    catBody.ball(.074, .141, -.171, .151, .139, .142, '#a57b57');
    for (const dx of [.018, .104])
        catBody.tri([dx - .026, .174, -.165], [dx + .026, .174, -.174], [dx, .233, -.152], '#775c4d');
    catBody.rod([-.10, .082, .148], [-.213, .086, .115], .043, '#6f5343');
    catBody.rod([-.213, .086, .115], [-.204, .083, -.065], .032, '#6f5343');
    catBody.rod([-.204, .083, -.065], [-.144, .083, -.145], .027, '#7c5c46');
    const cat = catBody.mesh();
    cat.position.set(.14, .09, -.03);
    const geo = new T.BufferGeometry(), points = new T.BufferAttribute(new Float32Array(30), 3);
    geo.setAttribute('position', points);
    const steam = new T.Points(geo, new T.PointsMaterial({ map: softFlake(), color: '#cee0e1', size: .51, transparent: true, opacity: .29, depthWrite: false }));
    steam.frustumCulled = false;
    group.add(pavement.mesh(), cat, steam);
    let walker;
    return { group, update(ctx) {
        cat.scale.y = 1 + Math.sin(ctx.elapsed * 1.8) * .045;
        const cold = clamp((2 - (ctx.weather?.temperature ?? 0)) / 6, 0, 1);
        steam.visible = cold > .025;
        steam.material.opacity = .17 + .27 * cold;
        for (let i = 0; steam.visible && i < points.count; i++) {
            const t = (ctx.elapsed * .62 + i / points.count) % 1;
            const wx = (ctx.weather?.gustX ?? 0) * t;
            const wz = (ctx.weather?.gustZ ?? 0) * t;
            points.setXYZ(i, Math.sin(i * 17 + t * 3) * (.14 + .25 * t) + wx, .18 + 1.62 * t, Math.cos(i * 13) * (.17 + .26 * t) + wz);
        }
        points.needsUpdate = steam.visible;
        const cycle = Math.floor(ctx.elapsed / 34), step = (ctx.elapsed % 34) / 16;
        if (!walker && step < 1) {
            walker = createPerson('resident', 7);
            walker.root.name = 'Пешеход на тёплой дорожке';
            group.add(walker.root);
        }
        if (!walker) return;
        walker.root.visible = step < 1;
        if (walker.root.visible) {
            const direction = cycle % 2 ? -1 : 1;
            walker.root.position.set((step - .5) * 10.4 * direction, .025, .47);
            walker.root.rotation.y = -Math.PI / 2 * direction;
            walker.update(ctx.dt, .65);
        }
    }};
}

const repairRows = [
    { x: -4, title: 'КОНЬКИ', back: '#4a6878', color: '#b9d9eb', description: 'Точильщик ставит полоз на шаблон, потом делает один ровный проход. На гвоздях за станком висят коньки, которые заберут после смены.' },
    { x: 0, title: 'РАДИО', back: '#495d53', color: '#bbd4a2', description: 'Мастер поворачивает ручку настройки. Из динамика сначала идёт шорох, потом сквозь него проступает чистый тон. Обещает оставить приёмник включённым до утра.' },
    { x: 4, title: 'КУРТКИ', back: '#715b59', color: '#f1c89c', description: 'На столе лежат обрезки брезента. Швея подшивает светоотражающую полосу на рукаве, пока старый ножной привод мерно стучит.' }
];

function workshopSound(ctx, i, amount = 1) {
    const a = ctx.audio;
    if (a?.ctx?.state !== 'running' || a.paused) return;
    const output = a.mix?.world ?? a.master;
    if (i === 0) {
        a.burst(1480, .22, .07 * amount, 0, 1.8, output);
        a.burst(2230, .10, .034 * amount, .06, 1.8, output);
    }
    if (i === 1) {
        a.burst(760, .19, .04 * amount, 0, .7, output);
        a.tone(370, 476, .29, .045 * amount, 'triangle', .11, output);
    }
    if (i === 2)
        for (let step = 0; step < 4; step++)
            a.tone(138 + 13 * step, 85, .06, .070 * amount, 'triangle', step * .078, output);
}

function workshops(parent) {
    const group = sceneAt(parent, 'Мастерские у устоя Портового моста', shops);
    const body = new Batch(), lamps = new Batch();
    body.box(0, .028, 0, 12.05, .061, 4.77, '#717777');
    body.box(-3.8, 3.29, -1.43, 19.62, .48, 4.29, '#758184');
    body.box(-3.8, 3.58, -1.43, 19.62, .087, 4.30, snow);
    body.box(-3.8, 3.064, .58, 19.53, .22, .19, '#68767a');
    body.box(0, 1.38, -2.30, 12.05, 2.76, .17, '#58666a');
    for (const x of [-5.93, -1.98, 1.98, 5.93])
        body.box(x, 1.39, 0, .15, 2.79, 4.70, '#697574');
    repairRows.forEach((row, i) => {
        const x = row.x;
        body.box(x, 2.66, 2.30, 3.55, .38, .18, row.back);
        body.box(x, 1.02, -1.61, 2.40, .11, .72, timber);
        for (const dx of [-1.05, 1.05]) body.box(x + dx, .51, -1.61, .12, .94, .59, steel);
        lamps.box(x, 2.68, .31, .98, .041, .17, row.color);
        sign(group, row.title, 'ПОРТОВЫЕ МАСТЕРСКИЕ', x, 2.66, 2.403, 3.43, .33, 0, row.back);
        if (i === 0) {
            body.box(x + .43, 1.18, -1.59, .59, .27, .34, '#497480');
            body.rod([x + .72, 1.25, -1.59], [x + .88, 1.25, -1.59], .126, '#adb5b2');
            for (const offset of [-.77, -.92, -1.09])
                body.box(x + offset, 1.72, -2.14, .11, .26, .26, '#8d9b9e', [.11, 0, -.19]);
        } else if (i === 1) {
            body.box(x + .48, 1.24, -1.63, .72, .38, .35, '#6f765b');
            lamps.box(x + .48, 1.30, -1.443, .64, .075, .026, '#acc775');
            body.rod([x + .76, 1.42, -1.71], [x + 1.05, 1.93, -1.82], .012, '#a6afb0');
        } else {
            body.box(x + .43, 1.19, -1.61, .57, .27, .29, '#8a6456');
            body.box(x + .56, 1.40, -1.68, .33, .18, .28, '#a28874');
            body.box(x - .44, 1.10, -1.58, .54, .058, .29, '#caaf77');
            for (const offset of [.20, .64, 1.11]) body.box(x + offset, 1.73, -2.14, .31, .67, .098, '#899175');
        }
    });
    group.add(body.mesh(), lamps.mesh(lit));
    const workers = [], beats = [0, 0, 0];
    let lastUpdate = -1;
    return { group, update(ctx) {
        if (ctx.elapsed < lastUpdate) beats.fill(0);
        lastUpdate = ctx.elapsed;
        if (!workers.length)
            repairRows.forEach((row, i) => {
                const worker = createPerson(i === 1 ? 'mechanic' : 'resident', 2 + i * 5);
                worker.root.position.set(row.x + .10, .01, -.83);
                group.add(worker.root);
                workers.push(worker);
            });
        workers.forEach((worker, i) => {
            const phase = (ctx.elapsed + i * 1.2) % 4.8;
            worker.update(ctx.dt, 0, false, { working: phase < 3.5 ? .88 : .25, glance: Math.sin(ctx.elapsed * .71) * .18 });
            const distance = Math.hypot(ctx.x - shops.x - repairRows[i].x, ctx.z - shops.z);
            if (!ctx.car && distance < 9 && ctx.elapsed >= beats[i] && ctx.audio?.ctx?.state === 'running' && !ctx.audio.paused) {
                beats[i] = ctx.elapsed + 2.7 + i * .41;
                workshopSound(ctx, i, clamp(1 - distance / 10, 0, 1));
            }
        });
    }};
}

function portView(parent) {
    const group = sceneAt(parent, 'Подъём к кабине крана К-14', crane);
    const body = new Batch(), light = new Batch();
    const ladderX = -1.18, ladderZ = -1.27;
    for (const dx of [-.25, .25]) body.rod([ladderX + dx, .22, ladderZ], [ladderX + dx, 16.11, ladderZ], .037, steel);
    for (let y = .4; y < 16.11; y += .28)
        body.rod([ladderX - .24, y, ladderZ], [ladderX + .24, y, ladderZ], .022, '#99a4a3');
    body.box(-1.10, .11, -.84, 1.18, .16, .89, steel);
    body.box(0, .72, -.30, 1.14, 1.31, .14, '#607675');
    light.box(0, 1.31, -.201, .84, .065, .076, '#d9bd8c');
    group.add(body.mesh(), light.mesh(lit));
    sign(group, 'КРАН К-14', 'КАБИНА · ПОСЛЕ СМЕНЫ', 0, .94, -.204, 1.06, .48);

    const harbor = sceneAt(parent, 'Стоянка трамвая и буксир у причала', { x: 72, z: 100.4 });
    const boats = new Batch(), signals = new Batch();
    boats.box(.62, .34, -17.02, 7.17, .62, 2.43, '#77584e');
    boats.box(.68, .65, -17.02, 7.10, .13, 2.39, '#a3a48d');
    boats.box(-.21, 1.21, -17.0, 2.53, 1.14, 1.74, '#8e9b8f');
    boats.box(-.30, 1.83, -17.0, 2.76, .15, 1.96, snow);
    boats.rod([.44, 1.73, -17.0], [.44, 2.53, -17.0], .15, '#585c56');
    boats.rod([-3.08, .55, -17.17], [-2.13, 2.22, -17.02], .038, steel);
    boats.tri([4.17, .04, -18.24], [4.17, .04, -15.82], [5.04, .45, -17.04], '#77584e');
    boats.tri([4.17, .70, -18.24], [5.04, .45, -17.04], [4.17, .70, -15.82], '#a3a48d');
    for (const z of [-17.90, -16.10]) signals.box(-.22, 1.46, z, 1.97, .36, .041, '#e4d3a2');
    for (const z of [2.11, 3.48]) boats.box(-4.20, .036, z, 11.43, .062, .08, '#899591');
    boats.box(-4.3, 1.19, 2.80, 8.01, 1.81, 2.25, teal);
    boats.box(-4.3, 2.15, 2.80, 8.10, .20, 2.31, '#8b9a91');
    for (const x of [-7.42, -6.13, -4.84, -3.54, -2.25, -.99])
        for (const z of [1.66, 3.94])
            boats.box(x, 1.57, z, 1.12, .64, .066, '#62777a');
    harbor.add(boats.mesh(), signals.mesh(lit));
    return { group, harbor };
}

function createPlaces(scene) {
    const tram = retiredTram(scene), plants = greenhouse(scene), warm = heatedCourtyard(scene), repairs = workshops(scene), port = portView(scene);
    let watered = -1;
    const sites = [
        { id: 'retired-tram', label: 'Чайная «Вагон 07»', x: tea.x + 1.82, z: tea.z, radius: 4.25,
            note: 'Бывший трамвай у депо. Внутрь можно зайти через открытую боковую дверь.', act(ctx) {
                ctx.choose('Чайная «Вагон 07»', [
                    { label: 'Прочитать меню', run: () => ctx.show('Табло чайной', 'Чёрный чай с чабрецом · 12 ₽\nЛимон из теплицы ТЭЦ · 6 ₽\nКапустный пирог · 24 ₽') },
                    { label: 'Заказать чай с чабрецом · 12 ₽', run: () => {
                        if (ctx.sim.money < 12) { ctx.notify('Буфетчица просит двенадцать рублей за чай.'); return; }
                        ctx.sim.money -= 12;
                        ctx.notify('Буфетчица подаёт горячий чай в гранёном стакане.');
                        ctx.save();
                    } },
                    { label: 'Послушать старых водителей', run: () => ctx.show('За дальним столиком', 'Семёныч: «Седьмой шёл прямо к складу. В туман стрелку определяли по тому, как звенит рельс».\nЗоя: «Он сворачивал у башни. Мы с тобой сорок лет спорим об этой стрелке».') }
                ]);
            } },
        { id: 'chp-greenhouse', label: 'Оранжерея при ТЭЦ', x: house.x, z: house.z + 4.30, radius: 4.4,
            note: 'Стеклянный павильон у Северной ТЭЦ. Лимоны растут на отработанном тепле.', act(ctx) {
                ctx.choose('Оранжерея при ТЭЦ', [
                    { label: 'Полить ящики с зеленью', run: () => {
                        const day = dayAt(ctx);
                        if (watered === day) { ctx.notify('Земля ещё влажная после утреннего полива.'); return; }
                        watered = day;
                        ctx.notify('Вода пропитала землю вокруг молодых листьев.');
                        ctx.save();
                    } },
                    { label: 'Прочитать накладную на зелень', run: () => ctx.show('Утренняя развозка', '05:50 · Столовая турбинного зала, два ящика укропа.\n06:05 · Столовая депо, петрушка и салат.\n06:20 · Чайная «Вагон 07», ящик лимонов.') },
                    { label: 'Вернуться к развозке в 05:52', run: () => {
                        if (ctx.waitUntil?.(352)) ctx.notify('У теплицы готовят ящики к отправке.');
                        else ctx.notify('Развозка начинается в 05:50.');
                    } }
                ]);
            } },
        { id: 'heated-yard', label: 'Двор над теплотрассой', x: court.x, z: court.z, radius: 2.65,
            note: 'На тёплой полосе асфальта снег тает даже вечером. У люка свернулся дворовый кот.', act(ctx) {
                ctx.show('На тёплой дорожке', 'Кота зовут Сварщик. Жильцы оставили ему тёплый люк и поставили скамейку вдоль полосы, на которой первым тает снег.');
            } },
        { id: 'bridge-workshops', label: 'Мастерские под Портовым мостом', x: shops.x, z: shops.z + 2.95, radius: 5.1,
            note: 'У мостового устоя работают точильщик, радиомастер и швея.', act(ctx) {
                ctx.choose('Мастерские под мостом', repairRows.map((row, i) => ({ label: ['Посмотреть заточку коньков', 'Послушать настройку приёмника', 'Посмотреть ремонт куртки'][i], run: () => {
                    workshopSound(ctx, i);
                    ctx.show(row.title, row.description);
                } })));
            } },
        { id: 'port-crane', label: 'Кабина портового крана К-14', x: crane.x, z: crane.z, radius: 2.5,
            note: 'Крановщик открывает подъём после смены, с 17:30 до 21:30.', act(ctx) {
                if (!(ctx.minutes >= 1050 && ctx.minutes < 1290)) {
                    ctx.choose('Подъём к кабине К-14', [
                        { label: 'Прочитать табличку', run: () => ctx.show('Кран К-14', 'Крановщик открывает кабину с 17:30 до 21:30. Сейчас ' + hour(ctx.minutes) + '.') },
                        { label: 'Дождаться конца смены · 18:00', run: () => {
                            if (ctx.waitUntil?.(1080)) ctx.notify('Крановщик открыл лестницу в кабину.');
                            else ctx.notify('Кабина открывается в 17:30.');
                        } }
                    ]);
                    return;
                }
                const views = [
                    ['Посмотреть на отстой трамваев', { x: 68, y: 1.2, z: 103.2 }],
                    ['Посмотреть на буксир', { x: 72, y: .7, z: 83.1 }],
                    ['Посмотреть на огни города', { x: 22, y: 4, z: 21 }]
                ];
                ctx.choose('Кабина крана К-14', views.map(([label, aim]) => ({ label, run: () => {
                    const eye = { ...crane.cabin };
                    if (aim.z > eye.z) { eye.x = 79.52; eye.z = 98.39; }
                    ctx.lookout({ ...eye, aim, yaw: Math.atan2(eye.x - aim.x, eye.z - aim.z) });
                } })));
            } }
    ];
    const scenery = [[tram, tea, 53], [plants, house, 62], [warm, court, 34], [repairs, shops, 58]];

    return { sites,
        update(ctx) {
            const point = ctx.focus ?? ctx;
            for (const [part, site, range] of scenery) {
                part.group.visible = dist2(point, site) < range * range;
                if (part.group.visible) part.update(ctx, watered);
            }
            repairs.group.visible ||= dist2(point, shops) < 90 ** 2;
            port.group.visible = dist2(point, crane) < 103 ** 2;
            port.harbor.visible = port.group.visible;
        },
        save: () => ({ watered }),
        restore(data) {
            watered = Number.isInteger(data?.watered) ? data.watered : -1;
        }
    };
}

module.exports = { createPlaces };
