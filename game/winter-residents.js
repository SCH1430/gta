'use strict';
const T = require('../engine/three.module.min.js');
const { Batch, tube, ring } = require('./model-geometry.js');
const { createPerson } = require('./model-people.js');
const { groundHeight } = require('./world-layout.js');
const { schoolOutside } = require('./school-site.js');
const { marketHours } = require('./market-hours.js');
const smooth=(v,a,b)=>T.MathUtils.smoothstep(v,a,b);
function mesh(parent,name,draw) {
    const batch=new Batch();
    draw(batch);
    const part=batch.mesh();
    part.name=name;
    parent.add(part);
    return part;
}
function resident(parent,variant,label) {
    const actor=createPerson('resident',variant);
    actor.root.name=label;
    parent.add(actor.root);
    return actor;
}
function schoolEntrance(group) {
    const actor=resident(group,11,'Посетитель у входа в школу');
    const neck=actor.root.getObjectByName('neck'), spine=actor.root.getObjectByName('spine');
    const boot=actor.root.getObjectByName('right-knee');
    const hood=mesh(neck,'Капюшон на шнурке',b=>{
        b.ball(0,.17,.079,.22,.20,.18,'#615e60');
        for(const side of [-1,1]) b.ball(side*.099,.13,.014,.059,.137,.12,'#726b68');
    });
    const glasses=mesh(neck,'Очки в проволочной оправе',b=>{
        for(const side of [-1,1]) b.add(ring,[side*.045,.128,-.112],[.039,.024,.018],'#756c60');
        b.rod([-.017,.133,-.112],[.017,.133,-.112],.003,'#766c60');
    });
    const cloth=mesh(spine,'Платок для очков',b=>b.box(0,0,0,.085,.019,.077,'#abb3ae',[.12,.22,0]));
    return c=>{
        const t=c.elapsed%43;
        actor.root.visible=t<28;
        if(!actor.root.visible)return;
        const walkIn=smooth(t,0,4), walkAway=smooth(t,17,28);
        actor.root.position.set(.82,0,2.1-1.72*walkIn+8*walkAway);
        actor.root.rotation.y=walkAway>0?Math.PI:0;
        const lowerHood=smooth(t,8,10)-smooth(t,15,17);
        hood.position.set(0,-.33*lowerHood,.087*lowerHood);
        const wiping=smooth(t,10,11)-smooth(t,14,15);
        glasses.position.set(0,-.25*wiping,-.095*wiping);
        cloth.visible=wiping>.10;
        cloth.position.set(.023*Math.sin(t*7),.43,-.196);
        const reaching=lowerHood>.06;
        actor.update(c.dt,t<4||t>17?.73:0,false,{handTargets: reaching?[[.015,.44,-.19],[.12*Math.cos(t*6),.45,-.21]]:undefined, duck:t>=4&&t<8?.13:0});
        if(t>=4 && t<8) boot.rotation.x-=.33*Math.abs(Math.sin(t*5));
    };
}
function driver(group) {
    const actor=resident(group,0,'Водитель с зимней щёткой');
    const brush=mesh(actor.root.getObjectByName('right-elbow'),'Скребок и длинная щётка',b=>{
        b.rod([0,-.25,-.02],[0,-.67,-.06],.014,'#796c55');
        b.box(0,-.68,-.06,.218,.05,.085,'#4d5856');
        for(let i=0;i<12;i++)b.box(-.096+i*.017,-.71,-.06,.007,.052,.066,'#b9b199');
    });
    const roofSnow=mesh(group,'Снег на левой стороне крыши',b=>{
        for(let j=0;j<5;j++)b.ball(-.53+j*.14,1.994,-.65,.155,.049,.56,'#d5dcdb');
    });
    const windshield=mesh(group,'Наледь в углу стекла',b=>{
        b.quad([-.86,1.22,-1.92],[-.46,1.22,-1.92],[-.45,1.66,-1.61],[-.82,1.66,-1.61],'#becbca',[0,1,-1]);
    });
    const schedule=mesh(actor.root.getObjectByName('spine'),'Путевой лист за поясом',b=>{
        b.box(.105,.025,-.173,.093,.144,.012,'#dad2b6',[-.04,0,-.13]);
        for(let j=0;j<5;j++) b.box(.103,.061-j*.016,-.182,.060,.003,.004,'#817f72');
    });
    return c=>{
        const t=c.elapsed%155;
        actor.root.visible=t<41;
        roofSnow.visible=t<12;
        windshield.visible=t<24;
        if(!actor.root.visible)return;
        const along=smooth(t,10,16)-smooth(t,28,33);
        actor.root.position.set(-1.38,0,-.58-along*1.02);
        actor.root.rotation.y=-Math.PI/2;
        const clearing=t<24, stroke=.5+.5*Math.sin(t*(t<12?2.5:4.6));
        const y=t<12?.52:.34;
        actor.update(c.dt,0,false,{handTargets:clearing?[null,[.20-.27*stroke,y+.09*stroke,-.34]]:undefined});
        brush.visible=clearing;
        brush.rotation.x=-1.45+.35*stroke;
        schedule.visible=!clearing;
        if(t<12)roofSnow.scale.x=Math.max(.08,1-t/12);
        const scraped=smooth(t,12,24);
        windshield.scale.y=1-.64*scraped;
        windshield.position.y=1.22*(1-windshield.scale.y);
    };
}
function marketStall(group) {
    const actor=resident(group,3,'Продавщица торговых рядов');
    actor.root.position.set(.86,0,-.30);
    actor.root.rotation.y=1.1;
    mesh(group,'Прилавок с ящиками радиодеталей',b=>{
        b.box(0,.63,0,1.12,.12,.61,'#87745c');
        for(const x of [-.47,.47])for(const z of [-.22,.22])b.box(x,.32,z,.066,.64,.066,'#6e6656');
        for(const x of [-.54,.54])b.box(x,1.13,-.28,.042,2.26,.042,'#666962');
        b.rod([-.56,2.25,-.28],[.56,2.25,-.28],.04,'#6d6961');
        b.box(-.23,.83,0,.42,.26,.39,'#866e55');
        b.box(.39,.74,.12,.22,.07,.19,'#5c605c');
    });
    const canopy=mesh(group,'Сворачиваемый навес',b=>{
        for(let i=0;i<10;i++)b.box(-.54+i*.12,0,.43,.12,.048,.86,i%2?'#b7b09b':'#895e51');
    });
    canopy.position.set(0,2.23,-.28);
    const stock=mesh(group,'Лоток предохранителей',b=>{
        b.box(0,0,0,.30,.06,.21,'#596966');
        for(let j=0;j<4;j++)b.box(-.090+j*.06,.054,0,.035,.047,.088,'#b09e78');
    });
    return c=>{
        const h=marketHours(c.calendarMinutes), m=c.minutes;
        const opened=smooth(m,h.open-7,h.open+2)-smooth(m,h.close-3,h.close+6);
        canopy.scale.z=.055+.945*opened;
        stock.position.set(-.23+opened*.36,.85-.04*opened,.01);
        actor.root.visible=(m>=h.open-8 && m<h.open+18)||(m>=h.close-15 && m<h.close+8);
        if(!actor.root.visible)return;
        const cash=m>=h.close-15 && m<h.close-3;
        const lifting=m>=h.close-3;
        const handY=lifting?.55:cash?.16:.08+.105*Math.sin(c.elapsed*2.3);
        actor.update(c.dt,0,false,{handTargets:[[-.11,handY,-.29],[.12+.055*Math.sin(c.elapsed*4),handY,-.31]],
            duck: cash?.18:.12});
    };
}
function powerShift(group){
    const employees=[5,0,10,8].map((style,i)=>resident(group,style,i<2?'Ночная смена ТЭЦ':'Дневная смена ТЭЦ'));
    return c=>{
        const shift=c.minutes%720;
        const active=shift>=345&&shift<368; // 05:45–06:08 and 17:45–18:08
        employees.forEach((actor,i)=>{
            actor.root.visible=active;
            if(!active)return;
            const side=i<2?-1:1, colleague=i%2;
            const arrive=smooth(shift,345+colleague,352+colleague), depart=smooth(shift,359+colleague,367);
            const x=side*(8-7*arrive-9*depart);
            actor.root.position.set(x,0,colleague*.82-side*.48);
            actor.root.rotation.y=side*Math.PI/2;
            actor.update(c.dt,(arrive>0&&arrive<1||depart>0&&depart<1)?.75:0,false,{conversation:shift>=353&&shift<360});
        });
    };
}
function createWinterResidents(parent) {
    const scenes=[
        {x:schoolOutside.x,z:schoolOutside.z,make:schoolEntrance},
        {x:-10,z:42,make:driver},
        {x:39.5,z:20.9,make:marketStall},
        {x:-27,z:-82,make:powerShift}
    ];
    return (ctx,focus)=>{
        for(const site of scenes) {
            const near=Math.hypot(focus.x-site.x,focus.z-site.z)<32;
            if(!site.group && near) {
                site.group=new T.Group();
                site.group.position.set(site.x,groundHeight(site.x,site.z),site.z);
                parent.add(site.group);
                site.update=site.make(site.group);
            }
            if(site.group) {
                site.group.visible=near;
                if(near)site.update(ctx);
            }
        }
    };
}
module.exports={createWinterResidents};
