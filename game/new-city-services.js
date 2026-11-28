"use strict";

const T = require('../engine/three.module.min.js');
const { Batch, tube, shell, stencil, lit } = require('./model-geometry.js');
const { groundHeight } = require('./world-layout.js');
const { serviceSites } = require('./new-city-services-layout.js');

const rubber = '#293038', metal = '#69777a', black = '#303d41', chrome = '#a0a8a2';
const glassTint = '#526b77', glassEdge = '#30434d';
const across = [0, 0, Math.PI / 2], lengthwise = [Math.PI / 2, 0, 0];

function cylinder(b, at, diameter, depth, color, axis = across) {
    b.add(tube, at, [diameter, depth, diameter], color, axis);
}

function subgroup(root, name, x = 0, y = 0, z = 0) {
    const part = new T.Group();
    part.name = name;
    part.position.set(x, y, z);
    root.add(part);
    return part;
}

function mesh(root, batch, name, material) {
    const part = batch.mesh(material);
    part.name = name;
    root.add(part);
    return part;
}

function axles(b, positions, { half = .87, radius = .39, tread = .24 } = {}) {
    for (const z of positions) {
        b.rod([-half, radius, z], [half, radius, z], .067, black);
        for (const side of [-1, 1]) {
            const x = side * half;
            cylinder(b, [x, radius, z], radius * 2, tread, rubber);
            cylinder(b, [x + side * tread * .51, radius, z], radius * 1.08, .030, metal);
            cylinder(b, [x + side * tread * .58, radius, z], radius * .50, .029, chrome);
            for (let i = 0; i < 7; i++) {
                const angle = i * 2 * Math.PI / 7;
                b.box(x + side * tread * .60, radius + radius * .36 * Math.sin(angle), z + radius * .36 * Math.cos(angle), .018, .039, .039, '#4b5557', [angle, 0, 0]);
            }
        }
    }
}

function cabin(b, lamps, { x = 0, y = .58, z, w, d, h, paint, grille = '#39484b' }) {
    const f = z - d / 2, r = z + d / 2, hw = w / 2;
    b.box(x, y + .29 * h, z + .008, w, h * .57, d, paint);
    b.box(x, y + .96 * h, z + .07 * d, w * .92, h * .09, d * .81, paint);
    const sill = y + .55 * h, top = y + .916 * h;
    const frontY = sill + .023, frontZ = f + .108 * d;
    b.quad([x - hw + .105, frontY, f - .008], [x + hw - .105, frontY, f - .008], [x + hw - .13, top, frontZ], [x - hw + .13, top, frontZ], glassTint);
    b.rod([x, frontY, f - .016], [x, top, frontZ - .007], .012, glassEdge, true);
    b.rod([x - hw + .16, frontY + .027, f - .020], [x - .047, frontY + .104, f + .023], .010, black, true);
    for (const side of [-1, 1]) {
        const edge = x + side * hw, roofEdge = x + side * hw * .92;
        b.quad([edge, sill, f], [edge, sill, r], [roofEdge, top, r - d * .10], [roofEdge, top, frontZ], glassTint);
        b.rod([edge, sill, f], [roofEdge, top, frontZ], .040, paint, true);
        b.rod([edge, sill, r], [roofEdge, top, r - d * .10], .055, paint, true);
        b.rod([edge, sill, z + d * .09], [roofEdge, top, z + d * .09], .016, glassEdge, true);
        b.box(edge, sill - .096, z + d * .14, .045, .035, .129, chrome);
        b.rod([edge, top - .19, f + .19], [edge + side * .139, top - .22, f + .23], .015, black);
        b.box(edge + side * .144, top - .27, f + .23, .103, .188, .074, black);
        b.box(x + side * (hw - .162), y + .19, f - .035, .279, .237, .063, black);
        lamps.box(x + side * (hw - .169), y + .221, f - .070, .194, .104, .011, '#eedabb');
        lamps.box(x + side * (hw - .214), y + .143, f - .070, .12, .033, .011, '#e3a45a');
    }
    b.box(x, y + .224, f - .042, w * .47, .275, .063, grille);
    for (let i = 0; i < 4; i++)
        b.box(x, y + .128 + i * .047, f - .077, w * .41, .014, .010, '#667578');
    b.box(x, y + .040, f - .059, w + .082, .134, .164, black);
    b.box(x, y + .39, r - .046, w * .90, .252, .083, paint);
}

function chassis(b, lamps, w, d, paint) {
    b.box(0, .61, 0, w * .86, .24, d - .13, '#3b4446');
    b.box(0, .55, d / 2 - .086, w * .91, .23, .18, '#4a5556');
    for (const s of [-1, 1]) {
        b.box(s * w * .36, .71, d / 2, .25, .14, .059, black);
        lamps.box(s * w * .36, .74, d / 2 + .039, .17, .061, .018, '#e87565');
        b.box(s * (w * .49), .64, d * .07, .055, .197, d * .35, paint);
    }
}

function serviceBox(b, { w, start, end, bottom = .75, roof = 3.07, color, inset = '#6d7777' }) {
    const mid = (start + end) / 2, depth = end - start;
    b.box(0, (bottom + roof) / 2, mid, w, roof - bottom, depth, color);
    b.box(0, roof + .01, mid, w - .10, .068, depth - .14, '#a1a9a4');
    for (const side of [-1, 1]) {
        const x = side * (w / 2 + .012);
        b.box(x, bottom + .16, mid, .045, .106, depth, '#adb0a2');
        for (const u of [.19, .51, .83]) {
            const z = start + depth * u, doorW = depth * .243;
            b.box(x, bottom + .74, z, .035, 1.02, doorW, black);
            b.box(x + side * .019, bottom + .74, z, .031, .948, doorW - .058, inset);
            b.box(x + side * .041, bottom + .56, z + doorW * .31, .022, .037, .122, chrome);
        }
    }
}

function amberBeacon(b, lamps, x, y, z, w = .41) {
    b.box(x, y, z, w + .04, .054, .128, black);
    lamps.box(x, y + .039, z, w, .044, .113, '#efab5c');
}

function striped(b, y, z, count, width = .09) {
    const start = (1 - count) * width / 2;
    for (let i = 0; i < count; i++)
        b.box(start + i * width, y, z, width * .63, .105, .019, i % 2 ? '#c39351' : black, [0, 0, -.34]);
}

function sweeper(root, b, lamps) {
    const paint = '#9b743e';
    chassis(b, lamps, 1.95, 4.29, paint);
    axles(b, [-1.22, 1.32], { half: .72, radius: .34, tread: .22 });
    cabin(b, lamps, { x: -.37, y: .56, z: -1.53, w: 1.12, d: 1.23, h: 1.61, paint });
    b.box(.57, .95, -1.52, .49, .53, 1.10, '#6c745e');
    shell(b, [[-.66, .86, .86, 1.90, 2.13], [-.46, .93, .80, 2.08, 2.29], [1.57, .89, .75, 2.00, 2.25], [2.13, .75, .87, 1.69, 2.05]], '#64858a');
    b.box(0, 2.245, .53, .77, .092, 1.31, '#8b9793');
    for (let j = 0; j < 7; j++)
        b.box(.89, 1.76, -.25 + j * .24, .045, .299, .027, '#8ba2a1');
    b.rod([.29, .25, -1.69], [.69, .52, -.72], .105, '#49575c');
    b.rod([.69, .52, -.72], [.92, 1.24, -.43], .106, '#49575c');
    b.box(0, .174, -1.72, .81, .187, .37, black);
    amberBeacon(b, lamps, -.37, 2.22, -1.55, .37);
    const brushes = [-1, 1].map(s => {
        const group = subgroup(root, 'Щётка подметальной машины', s * .61, .18, -2.15), bristles = new Batch();
        b.rod([s * .24, .48, -1.65], [s * .61, .25, -2.15], .042, metal, true);
        cylinder(bristles, [0, .058, 0], .584, .075, '#747867', [0, 0, 0]);
        for (let i = 0; i < 36; i++) {
            const a = i * Math.PI / 18;
            bristles.rod([.22 * Math.cos(a), .028, .22 * Math.sin(a)], [.34 * Math.cos(a + .12), -.134, .34 * Math.sin(a + .12)], .015, i % 3 ? '#8b7952' : '#b59563', true);
        }
        mesh(group, bristles, 'Вращающиеся щётки');
        return group;
    });
    return time => { brushes[0].rotation.y = time * 4.2; brushes[1].rotation.y = -time * 4.2; };
}

function rotarySnow(root, b, lamps) {
    const paint = '#b57440';
    chassis(b, lamps, 2.52, 4.75, paint);
    axles(b, [-1.02, 1.61], { half: 1.012, radius: .55, tread: .31 });
    cabin(b, lamps, { y: .77, z: -.74, w: 2.27, d: 1.70, h: 1.93, paint });
    shell(b, [[.21, 1.09, .83, 1.79, 2.16], [.49, 1.10, .83, 1.92, 2.30], [2.05, 1.01, .81, 1.92, 2.29], [2.34, .91, .87, 1.67, 2.14]], '#a17f54');
    for (let i = 0; i < 8; i++) b.box(.99, 1.59, .60 + .154 * i, .055, .47, .027, black);
    const z = -2.42;
    b.box(0, .71, z + .44, 2.64, .94, .17, '#6c6757');
    b.box(0, .31, z - .043, 2.73, .19, 1.21, '#999483');
    b.box(0, 1.21, z + .089, 2.69, .125, 1.01, '#aa7753');
    for (const s of [-1, 1]) {
        const x = s * 1.28;
        b.quad([x, .26, z - .64], [x, .26, z + .55], [x, 1.23, z + .55], [x, 1.16, z - .37], paint);
        b.box(x, .78, z - .15, .098, .79, .103, '#779092', [.26, 0, 0]);
    }
    b.box(0,.27,z-.657,2.70,.058,.04,'#c5c4af');
    for(let i=0;i<9;i++) b.box(-1.17+i*.28,.305,z-.658,.036,.019,.016,'#4f5149');
    striped(b, .39, z - .659, 21);
    const rotor = subgroup(root, 'Шнек роторного снегоочистителя', 0, .70, z - .035), spiral = new Batch();
    spiral.rod([-1.265, 0, 0], [1.265, 0, 0], .079, '#86908f');
    for (const side of [-1, 1]) {
        for (let i = 0; i < 28; i++) {
            const point = (j, r) => [side * (.076 + 1.155 * j / 28), r * Math.cos(j * .488), r * Math.sin(j * .488)];
            spiral.quad(point(i, .068), point(i + 1, .068), point(i + 1, .378), point(i, .378), i % 4 ? '#8c9290' : '#c7c6b9');
        }
    }
    mesh(rotor, spiral, 'Спиральные ножи');
    const chute = subgroup(root, 'Разгрузочный желоб', .37, 1.16, z + .41), arc = new Batch();
    cylinder(arc, [0, .036, 0], .72, .146, '#5f6967', [0, 0, 0]);
    arc.rod([0, .09, 0], [0, 1.71, .12], .25, paint, true);
    arc.rod([0, 1.71, .12], [0, 2.14, .37], .25, paint, true);
    arc.rod([0, 2.14, .37], [0, 2.25, .75], .247, paint, true);
    arc.box(0, 2.255, .763, .418, .373, .022, '#413c34', [-.29, 0, 0]);
    mesh(chute, arc, 'Поворотный желоб');
    amberBeacon(b, lamps, -.39, 2.73, -.68);
    return time => { rotor.rotation.x = time * 4.6; chute.rotation.y = .63 + .29 * Math.sin(time * .90); };
}

function iceResurfacer(root, b, lamps) {
    const paint = '#557b89';
    const ice = new Batch();
    ice.box(0, .015, 0, 3.26, .03, 7.1, '#8ea7b2');
    for (let i = 0; i < 18; i++) {
        const x = (i - 8.5) * .16;
        ice.box(x, .033, .10 + Math.sin(i * 2.4) * .12, .014, .006, 6.52 - .6 * Math.sin(i * 3.2) ** 2, i % 3 ? '#a4bcc4' : '#788f9c');
    }
    mesh(root.parent, ice, 'Служебная ледовая полоса');
    chassis(b, lamps, 2.27, 2.97, paint);
    axles(b, [-.93, 1.04], { half: .88, radius: .34 });
    shell(b, [[-1.60, .88, .40, .99, 1.13], [-1.38, 1.06, .38, 1.13, 1.35], [.80, 1.13, .42, 1.18, 1.38], [1.54, 1.00, .43, 1.07, 1.23]], paint);
    cylinder(b, [0, 1.09, .22], .88, 1.89, '#7c969f', across);
    cylinder(b, [.11, 1.57, .21], .47, .073, '#9faeaf', [0, 0, 0]);
    b.box(-.67, 1.42, 1.00, .44, .099, .41, black);
    b.box(-.67, 1.63, 1.16, .44, .48, .126, black);
    b.rod([-.67, 1.23, .68], [-.67, 1.61, .44], .030, metal);
    cylinder(b, [-.67, 1.61, .44], .302, .056, black, [0, 0, 0]);
    b.box(0, .245, 1.77, 2.28, .292, .61, '#59716f');
    b.box(0, .115, 2.07, 2.72, .100, .22, '#b0a799');
    for (const s of [-1, 1]) b.rod([s * .74, .65, 1.29], [s * 1.08, .24, 1.83], .070, chrome, true);
    const roller = subgroup(root, 'Вал ледозаливочной машины', 0, .19, 1.72), drum = new Batch();
    cylinder(drum, [0, 0, 0], .265, 2.14, black);
    for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        drum.rod([-1.065, .132 * Math.cos(a), .132 * Math.sin(a)], [1.065, .132 * Math.cos(a), .132 * Math.sin(a)], .012, '#a39886');
    }
    mesh(roller, drum, 'Вал и щётка');
    amberBeacon(b, lamps, .71, 1.39, .84, .24);
    return time => { root.position.z = .31 * Math.sin(time * 1.5); roller.rotation.x = time * 4; };
}

function wasteLoader(root, b, lamps) {
    const paint = '#748575';
    chassis(b, lamps, 2.40, 7.51, paint);
    axles(b, [-2.25, 1.86, 2.78], { half: .94, radius: .465, tread: .29 });
    cabin(b, lamps, { y: .70, z: -2.66, w: 2.30, d: 2, h: 1.95, paint });
    shell(b, [[-1.53, 1.11, .84, 2.59, 2.95], [-1.26, 1.17, .80, 2.72, 3.12], [2.89, 1.17, .81, 2.60, 3.06], [3.48, 1.03, .98, 2.34, 2.77]], '#596b58');
    for (const s of [-1, 1]) {
        for (let j = 0; j < 7; j++)
            b.rod([s * 1.178, 1.02, -.97 + j * .62], [s * 1.10, 2.60, -.84 + j * .62], .048, '#81917d', true);
        b.box(s * 1.175, 2.36, 1.19, .036, .126, 3.83, '#c4a679');
    }
    b.box(0, 2.95, .80, 1.13, .17, 1.24, '#4b5550');
    striped(b, .81, 3.756, 19);
    amberBeacon(b, lamps, 0, 2.71, -2.70, .91);
    const lift = subgroup(root, 'Боковой захват контейнера', 1.13, 1.10, .49), jaws = new Batch();
    for (const z of [-.49, .49]) {
        jaws.rod([0, 0, z], [.36, -.09, z], .079, metal, true);
        jaws.rod([.36, -.09, z], [.73, -.30, z], .070, '#a58253', true);
        jaws.rod([.73, -.30, z], [.88, -.34, z * .85], .056, black, true);
    }
    jaws.rod([.74, -.28, -.53], [.74, -.28, .53], .045, chrome, true);
    mesh(lift, jaws, 'Рычаг и зажимы');
    const bin = new Batch();
    shell(bin, [[-.40, .28, -.98, -.37, -.34], [-.33, .32, -1.00, -.30, -.27], [.33, .32, -1.00, -.30, -.27], [.40, .28, -.98, -.37, -.34]], '#516568');
    bin.box(0, -.283, 0, .682, .070, .849, '#747a69');
    for (const z of [-.24, .24]) cylinder(bin, [-.28, -1.022, z], .143, .066, rubber);
    const container = mesh(lift, bin, 'Дворовой контейнер');
    container.position.x = .99;
    return time => { lift.rotation.z = 1.5 * (.5 - .5 * Math.cos(time * .53)); };
}

function lampLift(root, b, lamps) {
    const paint = '#c49a57';
    chassis(b, lamps, 2.38, 6.52, paint);
    axles(b, [-2.01, 1.92], { half: .93, radius: .431, tread: .28 });
    cabin(b, lamps, { y: .70, z: -2.23, w: 2.17, d: 1.70, h: 1.94, paint });
    b.box(0, 1.044, 1.19, 2.27, .536, 3.68, '#65746d');
    for (const s of [-1, 1]) {
        b.box(s * .91, 1.275, .40, .23, .238, 2.76, '#869587');
        b.box(s * 1.147, 1.024, .65, .037, .348, .870, '#87978e');
        b.box(s*1.03,.66,.55,.28,.16,.20,'#636c66');
    }
    const stabilizers = [-1,1].map(side => {
        const leg = subgroup(root,'Выдвижная опора', side*1.10, .65, .55), steelwork = new Batch();
        steelwork.rod([0,0,0],[side*.20,-.54,0],.066,chrome,true);
        steelwork.box(side*.20,-.58,0,.29,.11,.37,black);
        mesh(leg,steelwork,'Опорная пята');
        return leg;
    });
    const worker = require('./model-people.js').createPerson('resident',5);
    worker.root.name='Электромонтёр Горсвета';
    root.add(worker.root);
    let previousTime;
    const cones = [-1, 1].map(side => {
        const cone = subgroup(root, 'Дорожный конус'), shape = new Batch();
        shape.box(0,.029,0,.28,.058,.28,'#4d4842');
        for (let i=0;i<3;i++) shape.add(new T.CylinderGeometry(.060-i*.023,.094-i*.024,.12,8),[0,.11+i*.12,0],[1,1,1],i===1?'#e8d9ba':'#bc5e38');
        mesh(cone,shape,'Сигнальные полосы');
        return cone;
    });
    amberBeacon(b, lamps, 0, 2.68, -2.17, .74);
    const turret = subgroup(root, 'Поворотная опора автовышки', 0, 1.39, 1.53), base = new Batch();
    cylinder(base, [0, .104, 0], 1.19, .231, '#555f51', [0, 0, 0]);
    base.box(0, .28, 0, .65, .46, .63, '#9d9566');
    mesh(turret, base, 'Поворотная платформа');
    const shoulder = subgroup(turret, 'Нижнее колено автовышки', 0, .39, 0), first = new Batch();
    first.rod([0, 0, .04], [0, 0, -2.37], .157, '#aa915b', true);
    first.rod([.11, -.14, -.12], [.11, -.07, -1.82], .047, chrome);
    cylinder(first, [0, .003, -2.37], .285, .34, '#b9b29b');
    mesh(shoulder, first, 'Первое колено');
    const elbow = subgroup(shoulder, 'Верхнее колено автовышки', 0, 0, -2.37), second = new Batch();
    second.rod([0, 0, 0], [0, 0, -1.91], .111, '#ba9d67', true);
    second.rod([-.09, -.082, -.24], [-.09, -.082, -1.28], .031, chrome);
    mesh(elbow, second, 'Второе колено');
    const basket = subgroup(elbow, 'Решётчатая люлька', 0, -.07, -1.91), frame = new Batch();
    frame.box(0, 0, 0, 1.03, .11, .89, '#555d58');
    for (const x of [-.51, .51]) {
        for (let j = 0; j < 6; j++)
            frame.rod([x, .02, (j - 2.5) * .159], [x, .82, (j - 2.5) * .159], .024, chrome, true);
        for (const y of [.44, .83]) frame.rod([x, y, -.44], [x, y, .44], .026, chrome, true);
    }
    for (const z of [-.44, .44]) for (const y of [.44, .83]) frame.rod([-.51, y, z], [.51, y, z], .028, chrome, true);
    frame.box(-.19, .234, -.11, .44, .34, .43, '#82928d');
    frame.box(-.19, .419, -.11, .47, .06, .48, '#c4b990');
    mesh(basket, frame, 'Люлька с ящиком ламп');
    return time => {
        const phase = (time % 44)/44;
        const smooth = (a,b) => T.MathUtils.smoothstep(phase,a,b);
        const extend = smooth(.05,.16)-smooth(.89,.98);
        stabilizers.forEach((leg,i) => {leg.position.x=(i?1:-1)*(1.10+.24*extend);leg.scale.y=.20+.80*extend;});
        cones.forEach((cone,i) => {
            const t=smooth(.17+i*.05,.22+i*.05)-smooth(.76+i*.05,.81+i*.05);
            cone.position.set((i?1:-1)*(.88+.81*t),.99*(1-t)+.32*Math.sin(t*Math.PI),2.33+t*.50);
        });
        const cross = smooth(.18,.24)-smooth(.71,.78);
        worker.root.position.set(-1.73+3.46*cross,0,2.92+.57*Math.sin(Math.PI*cross));
        worker.root.rotation.y=Math.PI*(.17+.66*cross);
        const bends = Math.sin(Math.PI*smooth(.155,.205)) + Math.sin(Math.PI*smooth(.225,.275)) +
            Math.sin(Math.PI*smooth(.73,.80)) + Math.sin(Math.PI*smooth(.81,.86));
        worker.update(previousTime==null?0:Math.max(0,Math.min(.1,time-previousTime)), 4*Math.sin(Math.PI*cross)*.65,false,
            {duck:bends*.68, handTargets:bends>.09?[[-.08,.11,-.27],[.13,.10,-.30]]:undefined});
        previousTime=time;
        const lift = smooth(.30,.48)-smooth(.62,.75);
        turret.rotation.y = -.18 + .18 * lift;
        shoulder.rotation.x = .48 + .53 * lift;
        elbow.rotation.x = -1.14 + .56 * lift;
        basket.rotation.x = -shoulder.rotation.x - elbow.rotation.x;
    };
}

function ladderSection(parent, name, width, span, tracks) {
    const rails = new Batch();
    for (const x of [-width / 2, width / 2]) {
        rails.rod([x, tracks ? .102 : .085, .05], [x, tracks ? .102 : .085, -span], .035, '#acafa5', true);
        rails.rod([x, -.07, .05], [x, -.07, -span], .028, '#827f73', true);
        for (let z = -.21; z > -span; z -= .34) {
            rails.rod([x, -.07, z], [x, .092, z - .16], .012, chrome, true);
            if (x > 0) rails.rod([-x, -.022, z], [x, -.022, z], .026, '#c4b99e', true);
        }
    }
    mesh(parent, rails, name);
}

function fireLadder(root, b, lamps) {
    const paint = '#a13e36';
    chassis(b, lamps, 2.56, 9.94, paint);
    axles(b, [-3.25, 1.87, 3.33], { half: 1.02, radius: .489, tread: .32 });
    cabin(b, lamps, { y: .79, z: -3.86, w: 2.42, d: 2.02, h: 2.11, paint });
    serviceBox(b, { w: 2.41, start: -2.82, end: 4.66, roof: 2.12, color: paint, inset: '#817e76' });
    for (const s of [-1, 1]) {
        b.box(s * 1.214, 1.975, .96, .06, .109, 7.33, '#cfc0a4');
        for (const z of [-1.71, 2.78]) {
            b.box(s * 1.151, .66, z, .325, .30, .69, '#686d64');
            b.box(s * 1.21, .44, z, .129, .245, .165, black);
            b.box(s * 1.21, .286, z, .252, .094, .351, '#878e88');
        }
    }
    stencil(b, '01', [0, .98, 4.994], .032, '#f0cfa4');
    amberBeacon(b, lamps, 0, 2.942, -3.85, 1.04);
    const pivot = subgroup(root, 'Поворотная автолестница', 0, 2.41, 2.66), mount = new Batch();
    cylinder(mount, [0, -.119, 0], 1.42, .33, '#6b7069', [0, 0, 0]);
    mount.box(0, .02, -.18, 1.07, .20, .79, '#717b70');
    mesh(pivot, mount, 'Станина автолестницы');
    const ladder = subgroup(pivot, 'Пакет телескопических секций', 0, .143, 0);
    ladderSection(ladder, 'Наружная секция', 1.06, 5.56, true);
    const extension = subgroup(ladder, 'Выдвижная средняя секция', 0, .13, -.26);
    ladderSection(extension, 'Средняя секция', .81, 4.82, false);
    const tip = subgroup(extension, 'Выдвижная верхняя секция', 0, .118, -.23);
    ladderSection(tip, 'Верхняя секция', .60, 4.34, false);
    return time => {
        const cycle = .5 - .5 * Math.cos(time * .40);
        ladder.rotation.x = .028 + .76 * cycle;
        extension.position.z = -.26 - 1.45 * cycle;
        tip.position.z = -.23 - 1.19 * cycle;
    };
}

function fieldLab(root, b, lamps) {
    const paint = '#7e928d';
    chassis(b, lamps, 2.47, 7.09, paint);
    axles(b, [-2.18, 1.89], { half: .925, radius: .458, tread: .266 });
    cabin(b, lamps, { y: .66, z: -2.63, w: 2.18, d: 1.69, h: 2.01, paint });
    serviceBox(b, { w: 2.39, start: -1.56, end: 3.26, roof: 3.08, color: '#9daaa2', inset: '#a5b0a8' });
    for (const side of [-1, 1]) {
        const x = side * 1.217;
        for (const z of [-.61, .64, 1.88]) {
            b.box(x, 2.42, z, .045, .37, .76, glassEdge);
            b.box(x + side * .027, 2.426, z, .017, .269, .647, glassTint);
        }
        b.box(x, 1.98, .83, .044, .147, 4.58, '#698785');
    }
    b.box(-.48, 1.79, 3.293, .85, 1.64, .063, '#798e8a');
    b.box(-.48, 2.31, 3.331, .62, .29, .015, glassTint);
    for (let z = 2.41; z < 3.26; z += .18) b.box(.76, 2.66, z, .238, .018, .033, '#7a8991');
    const reel = subgroup(root, 'Кабельный барабан', .67, 1.08, 3.31), winding = new Batch();
    cylinder(winding, [0, 0, 0], .47, .428, black);
    for (const x of [-.242, .242]) cylinder(winding, [x, 0, 0], .63, .057, '#827c68');
    for (let j = 0; j < 11; j++) cylinder(winding, [(j - 5) * .032, 0, 0], .51, .025, '#595447');
    mesh(reel, winding, 'Намотанный кабель');
    const mast = subgroup(root, 'Телескопическая мачта лаборатории', .58, 3.103, 1.34), mount = new Batch();
    cylinder(mount, [0, .39, 0], .186, .78, '#839691', [0, 0, 0]);
    mast.add(mount.mesh());
    const slide = subgroup(mast, 'Выдвижная приборная штанга'), antenna = new Batch();
    cylinder(antenna, [0, .764, 0], .107, 1.54, '#b8b9a4', [0, 0, 0]);
    antenna.rod([-.34, 1.39, 0], [.34, 1.39, 0], .022, metal);
    antenna.rod([0, 1.43, -.32], [0, 1.43, .32], .023, metal);
    for (const s of [-1, 1]) antenna.ball(s * .29, 1.436, .035, .131, .106, .134, '#7d8271');
    antenna.box(0, 1.574, 0, .124, .188, .136, '#c4b791');
    mesh(slide, antenna, 'Приборы метеостанции');
    amberBeacon(b, lamps, 0, 2.71, -2.62, .59);
    return time => { slide.position.y = .5 - .5 * Math.cos(time * .40); slide.rotation.y = time * .17; };
}

function tracks(b, mid) {
    const ring = [[-.17,-1.88],[.37,-1.88],[.52,-1.53],[.52,1.30],[.29,1.80],[-.13,1.82],[-.23,1.55],[-.23,-1.51]];
    for (const side of [-1, 1]) {
        const point = (x, [y, z]) => [side * x, y + .25, z + mid];
        for (let j = 0; j < ring.length; j++) {
            const a = ring[j], d = ring[(j + 1) % ring.length];
            b.quad(point(.77, a), point(1.38, a), point(1.38, d), point(.77, d), rubber);
        }
        for (let j = 0; j < 32; j++) {
            const z = -1.56 + .098 * j + mid;
            b.box(side * 1.078, .796, z, .64, .040, .078, j % 4 ? '#525953' : '#73817a');
            b.box(side * 1.078, .044, z, .64, .062, .069, '#4b5451');
        }
        for (let j = 0; j < 6; j++) cylinder(b, [side * 1.25, j === 0 || j === 5 ? .413 : .318, mid - 1.46 + j * .548], .472, .181, '#767d70');
    }
}

function medicalTracks(root, b, lamps) {
    const paint = '#879e91';
    tracks(b, -2.26);
    b.box(0, .90, -2.31, 2.56, .273, 4.02, '#4e6461');
    cabin(b, lamps, { y: 1.016, z: -3.03, w: 2.49, d: 2.48, h: 1.61, paint });
    b.box(0, 1.62, -1.04, 2.43, 1.30, 1.31, paint);
    b.rod([0, .87, -.53], [0, .87, .76], .154, '#65736e', true);
    amberBeacon(b, lamps, 0, 2.68, -3.20, .71);
    const rear = subgroup(root, 'Задний модуль санитарного вездехода', 0, 0, .64), body = new Batch(), rearLights = new Batch();
    tracks(body, 1.54);
    shell(body, [[-.22, 1.07, .81, 2.20, 2.44], [.12, 1.24, .81, 2.36, 2.62], [3.21, 1.24, .82, 2.36, 2.64], [3.80, 1.08, .93, 2.28, 2.55]], '#a8b5aa');
    body.box(0, 1.65, 3.817, 1.46, 1.49, .046, '#879e91');
    body.box(0, 2.09, 3.845, 1.14, .386, .032, glassEdge);
    body.box(0, 1.177, 3.871, .66, .237, .022, '#aec0b3');
    body.box(0, 1.017, 3.908, 1.95, .112, .285, black);
    body.box(0, 1.182, 3.884, .385, .156, .018, '#517973');
    stencil(body, 'М77', [0, 1.181, 3.896], .023, '#e9dfbf');
    for (const s of [-1, 1]) {
        const x = s * 1.258;
        body.box(x, 1.58, 1.81, .047, .182, 2.69, '#aa5b48');
        body.rod([x, 1.375, .16], [x, 1.375, 3.46], .026, chrome);
        body.rod([s * .86, 1.25, 3.889], [s * .86, 2.22, 3.889], .032, chrome);
        rearLights.box(s * .987, 1.119, 3.878, .211, .099, .027, '#e97154');
    }
    mesh(rear, body, 'Санитарный кузов и гусеницы');
    mesh(rear, rearLights, 'Кормовые огни', lit);
    return time => { rear.rotation.y = .035 * Math.sin(time * .56); };
}

const models = [sweeper, rotarySnow, iceResurfacer, wasteLoader, lampLift, fireLadder, fieldLab, medicalTracks];
const contactShadow = new T.MeshBasicMaterial({ color: '#21323a', transparent: true, opacity: .22, depthWrite: false });

function createCityServices(scene) {
    const entries = serviceSites.map(({ body, ...site }, i) => {
        const anchor = subgroup(scene, site.label, body.x, groundHeight(body.x, body.z), body.z);
        anchor.rotation.y = body.yaw;
        anchor.userData.cityModel = site.id;
        let animate;
        return { site, body, anchor, draw(time, distance) {
            if (!animate) {
                const model = subgroup(anchor, site.id), hull = new Batch(), lamps = new Batch();
                animate = models[i](model, hull, lamps);
                const offices=['Дорожная служба','Дорожная служба','Ледовая арена','Спецавтохозяйство','Горсвет','Пожарная часть','Гидропост','Медслужба'];
                const {placard}=require('./fleet-placard.js');
                for(const side of [-1,1]) placard(model,[offices[i]+'  /  '+(14+i),'Диспетчерская  77-04'],[side*(body.w/2+.025),1.48,i===5?-2.7:0],[1.12,.33],side*Math.PI/2);
                const shade = new T.Mesh(new T.CircleGeometry(1, 18), contactShadow);
                shade.rotation.x = -Math.PI / 2;
                shade.scale.set(body.w * .53, body.d * .43, 1);
                shade.position.y = i === 2 ? .045 : .014;
                anchor.add(shade);
                mesh(model, hull, 'Кузов и ходовая часть');
                mesh(model, lamps, 'Габаритные огни', lit);
            }
            if (distance < 40 || !anchor.userData.poseReady) {
                animate(time + i * 2);
                anchor.userData.poseReady = true;
            }
        } };
    });
    return { sites: entries.map(({ site }) => site), update(ctx) {
        const focus = ctx.focus ?? ctx;
        for (const { body, anchor, draw } of entries) {
            const distance = Math.hypot(focus.x - body.x, focus.z - body.z);
            anchor.visible = ctx.zone === 'street' && distance < 125;
            if (anchor.visible)
                draw(ctx.elapsed, distance);
        }
    } };
}

module.exports = { createCityServices };
