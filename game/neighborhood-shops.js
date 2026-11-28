'use strict';

const shops = {
    optician: { centre: 460, label: 'Городская оптика', x: -3.93, z: 17.57, yaw: 0 },
    grocery: { centre: 480, label: 'Продукты у дома № 19', x: 35.8, z: 55.55, yaw: 0 },
    canteen: { centre: 500, label: 'Столовая «Причал»', x: -6.0, z: 44.91, yaw: Math.PI },
    locker: { centre: 520, label: 'Раздевалка трамвайного депо', x: -4.08, z: -26.90, yaw: Math.PI / 2 }
};

function spectacleFrame(b, x, y, z, scale, finish) {
    const r = .04 * scale, offset = .053 * scale;
    for (const side of [-1, 1]) {
        const cx = x + side * offset;
        for (let i = 0; i < 10; i++) {
            const a = i * Math.PI / 5, next = a + Math.PI / 5;
            b.beam(cx + r * Math.cos(a), y + r * .72 * Math.sin(a), z,
                cx + r * Math.cos(next), y + r * .72 * Math.sin(next), z, .006 * scale, finish);
        }
        b.beam(cx + side * r, y, z, cx + side * r, y - .012 * scale, z - .11 * scale, .006 * scale, finish);
    }
    b.beam(x - offset + r, y, z, x + offset - r, y, z, .006 * scale, finish);
}

function shopInterior(b, sign, zone) {
    const x = shops[zone].centre, back = -3.845, paper = '#ede8d4', black = '#44473f';
    // Frost and a wiped patch on the double glazed pane by the door.
    const pane = x + 2.85;
    b.box(pane, 1.76, 3.86, 1.6, 1.5, .10, '#887c68');
    b.box(pane, 1.76, 3.79, 1.48, 1.38, .035, '#b7c6c5');
    b.piece('stone', pane - .07, 1.69, 3.759, .99, .89, .027, '#96a6a5');
    for (let i = 0; i < 15; i++) {
        const cx = pane - .68 + i * .095, len = .10 + (i * 7 % 11) * .021;
        b.beam(cx, 2.40, 3.75, cx + .048, 2.40 - len, 3.75, .012, '#e4e5d9');
    }
    if (zone === 'optician') {
        const shelf = x - 3.3;
        for (let row = 0; row < 3; row++) {
            const y = .92 + row * .30;
            b.box(shelf, y, -3.55, 2.25, .043, .48, '#adb2a1');
            for (let col = 0; col < 5; col++) {
                const cx = shelf + (col - 2) * .41;
                b.box(cx, y + .054, -3.5, .23, .060, .11, '#6e635a');
                spectacleFrame(b, cx, y + .136, -3.40, 1, col % 2 ? '#4c463a' : '#9a734c');
            }
        }
        sign('Ш  Б', 'М Н К  ·  Ы М Б Ш', x + 2.7, 1.9, back, .84, .97, 0, paper, black);
        b.box(x + .97, 1.44, -2.98, .42, .58, .052, '#777769');
        b.box(x + .97, 1.44, -2.94, .36, .51, .013, '#bdc9c8');
        b.cyl(x + 1.41, 1.14, -2.82, .24, .055, '#767969');
        b.beam(x + 1.41, 1.15, -2.82, x + 1.34, 1.55, -2.87, .028, '#777a6c');
        b.piece('taper',x + 1.31,1.53,-2.85,.22,.16,.22,'#c2a07c');
    } else if (zone === 'grocery') {
        b.box(x - 3.29, 1.04, -3.39, 1.49, 2.08, .92, '#c4c4b2');
        b.box(x - 3.29, 1.15, -2.90, 1.28, 1.52, .04, '#718182');
        for (let row = 0; row < 3; row++) {
            const y = .58 + row * .43;
            b.box(x - 3.29,y,-2.85,1.24,.037,.085,'#babfaf');
            for (let col = 0; col < 5; col++)
                b.box(x - 3.76 + col * .23,y + .155,-2.84,.17,.29,.064, col % 2 ? '#d3c39f' : '#b0b9a7');
        }
        for (let j = 0; j < 3; j++) {
            const y = .16 + j * .32;
            b.box(x + 3.38,y,-3.43,1.25,.30,.77,'#8b744f');
            for (let k=0;k<4;k++) b.piece('stone', x + 2.96 + k * .26, y + .16,-3.38,.21,.19,.48,'#bf9556');
        }
        b.piece('box',x+.65,1.14,-2.54,.13,.06,.21,'#45524d',0,0,-.14);
        b.box(x+.65,1.178,-2.56,.095,.014,.09,'#a3ad99');
        sign('ХЛЕБ СВЕЖИЙ', 'ПРИВОЗ УТРОМ',x+2.95,2.19,back,1.14,.39,0,paper,black);
    } else if (zone === 'canteen') {
        sign('ОБЕД 12—15', 'ЩИ · ГРЕЧКА С КОТЛЕТОЙ · КОМПОТ',x+2.88,1.72,back,1.68,.84,0,paper,black);
        for (let i = 0; i < 6; i++)
            b.box(x-.88,1.116+i*.031,-2.90,.59,.029,.42,i%2?'#9e6950':'#9ba086');
        for (let i = 0; i < 3; i++) {
            b.cyl(x+i*.37,1.24,-2.96,.31,.25,'#9daba4');
            b.cyl(x+i*.37,1.37,-2.96,.33,.032,'#c3c8ba');
        }
    } else {
        for (let i = 0; i < 8; i++) {
            const cx=x-2.80+i*.80;
            b.box(cx,1.0,-3.47,.76,2,.81,'#758375');
            b.box(cx,1.01,-3.045,.69,1.89,.031,i%3===0?'#8c9584':'#869284');
            b.box(cx+.21,1.12,-3.012,.032,.145,.036,black);
            sign(String(11+i),['ПУТЬ','ДЕПО','СМЕНА'][i%3],cx,1.55,-3.015,.32,.21,0,paper,black);
        }
        b.box(x,.037,.2,2.65,.035,1.29,'#51534b');
        for(let i=0;i<12;i++) b.box(x-1.2+i*.21,.063,.2,.025,.018,1.19,'#62645b');
        for(let i=0;i<4;i++){
            const cx=x+3.46,cz=-.8+i*.25;
            b.cyl(cx,.41,cz,.06,.74,'#99978a');
            b.piece('stone',cx,.80,cz,.14,.23,.11,i%2?'#998568':'#aa9472');
        }
        sign('СУШИЛКА', 'ДЕЖУРНАЯ СМЕНА',x+3.09,1.34,-.94,.64,.21,Math.PI/2,paper,black);
    }
}
module.exports = { shops, spectacleFrame, shopInterior };
