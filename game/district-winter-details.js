'use strict';

const carStops = [-37.4, -34.8, -32.2].map(x => ({ x, z: 18.75, w: .13, d: .13, h: .81 }));
const booth = { x: -157.8, z: 102.9, w: 2.45, d: 2.32, h: 2.54 };
const fence = { x: -162.8, z: 101.73, w: 7.5, d: .09, h: 2.08 };
const streetSolids = [...carStops, booth, fence];

function canalHouses(b, sign, layout) {
    for (const a of layout.apartments) {
        const e = layout.apartmentEntry(a), front = e.front, base = e.steps * e.rise;
        const panelX = e.x + .68;
        b.box(panelX, 1.41 + base, front + .40, .16, .30, .037, '#77796e');
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++)
                b.box(panelX + (col-1)*.036, 1.46 + base - row*.038, front + .424, .019, .019, .009, '#444940');
        }
        const drainX = a.x + a.w / 2 - .22;
        b.beam(drainX, .32, front+.12, drainX, .13, front+.47, .15, '#737973');
        const iceZ = front + .84, ground = layout.groundHeight(drainX, iceZ);
        b.piece('stone', drainX, ground+.021, iceZ, .97, .052, 1.48, '#a7b4b7');
        for (let j = 0; j < 4; j++)
            b.beam(drainX + j*.067-.10, .25, front+.46, drainX + j*.067-.10, .05 + (j%3)*.04, front+.48, .035, '#cdd6d5');
        if ([23,31,19].includes(a.id)) {
            const x = a.x + a.w*.31, z = front+.29;
            sign('ФАБРИЧНАЯ УЛ.',String(a.id-4), '#c6c3ad','#6f7769', x,2.38,z,1.12,.39);
            sign('КАНАЛЬНАЯ',String(a.id), '#ece7d1','#39546a', x,2.92,z,1.29,.43);
            b.box(e.x-1.47,1.52,front+.27,.81,.84,.083,'#806e57');
            for (const [i,title] of ['СОБРАНИЕ','ИЩУ КЛЮЧИ','САНТЕХНИК','КОТ'].entries()) {
                const cx=e.x-1.67+(i%2)*.40, y=1.70-Math.floor(i/2)*.34;
                sign(title,i===1?'КВ. 18':'ТЕЛ. 13-47', '#4e504a',i%2?'#d2c69f':'#e7e2cf', cx,y,front+.322,.35,.29);
            }
        }
    }
    for (const p of carStops) {
        const y = layout.groundHeight(p.x,p.z);
        b.cyl(p.x,y+.405,p.z,p.w,p.h,'#7c827b');
        b.cyl(p.x,y+.61,p.z,.14,.10,'#b9ad8f');
    }
    // A resident's folding barrier sits flat in the adjoining parking space.
    b.box(-29.3,.075,18.72,.90,.09,.42,'#787971');
    b.box(-29.3,.14,18.68,.80,.05,.06,'#ac8b52');
}

function entrances(b, sign) {
    b.box(35.8,1.14,54.69,1.12,2.24,.17,'#797763');
    b.box(35.8,1.55,54.789,.86,.94,.025,'#98a7a0');
    b.box(36.19,1.08,54.82,.033,.21,.045,'#dad1b7');
    sign('ПРОДУКТЫ','ХЛЕБ · МОЛОКО', '#f0e6c7','#5d715f',35.8,2.60,54.76,2.37,.56);
    sign('ПРОДУКТЫ →','ВХОД СО ДВОРА', '#e6ddbe','#666e58',39.7,1.97,43.43,1.56,.54,Math.PI);
    sign('ПРИЧАЛ','СТОЛОВАЯ · ВХОД', '#5f604d','#e4ddbd',-6,1.64,45.85,1.04,.43,Math.PI);
    b.box(-4.94,1.21,-26.90,.16,2.38,1.22,'#667369');
    b.box(-4.84,1.13,-26.49,.06,.24,.045,'#b0b6a9');
    sign('РАЗДЕВАЛКА','ДЕПО · II СМЕНА', '#ece7d2','#636e61',-4.84,2.61,-26.9,1.45,.43,Math.PI/2);
}

function quay(b,sign,layout) {
    const {x,z,w,d} = booth, base = layout.groundHeight(x,z);
    b.box(x,base+1.21,z,w,2.42,d,'#a09d88');
    b.box(x,base+2.48,z,w+.26,.12,d+.30,'#7d8174');
    b.box(x,base+2.56,z,w+.29,.08,d+.32,'#ccd0c9');
    b.box(x,base+1.53,z+d*.5+.02,1.62,.80,.04,'#6c8183');
    b.box(x,base+1.53,z+d*.5+.048,.041,.81,.022,'#b9b5a3');
    sign('ПРОХОДНАЯ','ПОРТ · ВЪЕЗД ПО ПРОПУСКАМ','#ede1bc','#676955',x,base+2.11,z+d*.5+.036,2.08,.31);
    for (let i=0; i<=4; i++) {
        const px=fence.x-fence.w*.5+i*fence.w/4;
        b.box(px,base+1.04,fence.z,.084,2.08,.09,'#676e68');
        if(i===4) continue;
        const next=px+fence.w/4;
        for(let k=0;k<6;k++) {
            const rise=k*.31, run=Math.min(1.85,1.90-rise);
            b.beam(px,.10+rise+base,fence.z,px+run,base+.10+rise+run,fence.z,.022,'#82887e');
            b.beam(next,.10+rise+base,fence.z,next-run,base+.10+rise+run,fence.z,.022,'#82887e');
        }
    }
    const sx=-137, sz=106, floor=layout.groundHeight(sx,sz);
    b.box(sx,floor+.035,sz,3.5,.06,9.2,'#767d77');
    for (const side of [-1,1]) {
        b.box(sx+side*1.64,floor+.073,sz,.09,.02,9.18,'#ddd1ac');
        b.box(sx+5.5+side*1.81,floor+.017,sz,.09,.02,9.65,'#d6cfb5');
    }
    for (let k=0;k<10;k++) b.box(sx,floor+.076,sz-4.05+k*.90,3.40,.016,.029,'#5f6663');
    sign('ВЕСОВАЯ','ОЖИДАНИЕ СПРАВА', '#e1dfc8','#505e58',x+w*.5+.015,base+1.72,z,1.42,.39,Math.PI/2);
    for (const px of [-41,-36.5,-32]) {
        const pz=61.03,y=layout.groundHeight(px,pz);
        b.box(px,y+.03,pz,.38,.055,.27,'#74766b');
        for(let k=0;k<8;k++) {
            const a=k*Math.PI/8, n=(k+1)*Math.PI/8;
            b.beam(px+.14*Math.cos(a),y+.065+.15*Math.sin(a),pz,px+.14*Math.cos(n),y+.065+.15*Math.sin(n),pz,.048,'#695f53');
        }
    }
}

function addDistrictDetails(b, sign, layout) {
    canalHouses(b, sign, layout);
    entrances(b, sign);
    quay(b, sign, layout);
}
module.exports = { addDistrictDetails, streetSolids };
