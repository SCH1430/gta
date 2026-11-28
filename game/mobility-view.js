"use strict";
const T = require("../engine/three.module.min.js");
const { Batches, Panels } = require("./world-batch.js");
const { signTexture } = require("./world-textures.js");
const { groundHeight } = require("./world-layout.js");
const { specs, carCabin } = require("./vehicle-cabin.js");
const { tramStops, tramLocal, serviceSiding } = require("./world-railway.js");
const { createPerson } = require("./model-people.js");
function makeInstances(parent, glowing, count) {
    const Material = glowing ? T.MeshBasicMaterial : T.MeshLambertMaterial;
    const mesh = new T.InstancedMesh(new T.BoxGeometry(1,1,1), new Material({ color: 0xffffff }), count);
    mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    parent.add(mesh);
    const o = new T.Object3D(), ink = new T.Color();
    return { mesh, clear() {mesh.count = 0;}, box(x,y,z,w,h,d,angle,color) {
        if (mesh.count >= count) return;
        o.position.set(x,y,z); o.scale.set(w,h,d); o.rotation.set(0,angle,0); o.updateMatrix();
        mesh.setColorAt(mesh.count, ink.set(color)); mesh.setMatrixAt(mesh.count++, o.matrix);
    }, finish() {mesh.visible = mesh.count > 0; if (mesh.count) {mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;}} };
}
function location(car,x,y,z) {
    const co=Math.cos(car.yaw), si=Math.sin(car.yaw);
    return [car.x+x*co+z*si, car.y+y, car.z-x*si+z*co];
}
exports.location=location;
exports.createMobilityView=function(scene) {
    const group=new T.Group(); group.name='Рейсы и мастерские Канальной'; group.userData.dynamicScenery=true; scene.add(group);
    const light=makeInstances(group,true,200), parts=makeInstances(group,false,40);
    const railGroup=new T.Group(), rail=new Batches(railGroup), signs=new Panels(railGroup);
    railGroup.name='Посадка по требованию у мастерских'; railGroup.userData.staticScenery=true; scene.add(railGroup);
    const stop=tramStops.works;
    rail.box(stop.x+.65,.095,stop.z-2.7,.97,.19,8.4,'#7d8889');
    rail.box(stop.x+1.15,1.42,stop.z+.52,.075,2.84,.075,'#456774');
    const { board } = stop;
    signs.place('mobility-works-stop',()=>signTexture('МАСТЕРСКИЕ','17Д / 17Р • ПО ТРЕБОВАНИЮ','#f4d494','#344d57',3.7),board.x,board.y,board.z,1.55,.51,Math.PI/2);
    for(let m=79;m<105;m+=.65){
        const a=serviceSiding(m),b=serviceSiding(Math.min(105,m+.65));
        for(const side of [-.74,.74])
            rail.beam(a.x+side*Math.cos(a.yaw),.024,a.z-side*Math.sin(a.yaw),b.x+side*Math.cos(b.yaw),.024,b.z-side*Math.sin(b.yaw),.055,'#99a5a1',true);
    }
    // Alignment stripe on the garage wall also appears in the actual right-hand mirror.
    rail.box(-46.95,1.23,47.24,.045,2.35,.23,'#f4e6ad');
    rail.box(-3.475,4.75,-11.74,.072,.58,1.54,'#3b5756');
    signs.place('mobility-window-mark',()=>signTexture('77-Б','СТАРАЯ ПРОХОДНАЯ','#f2d3a2','#3b5756',3.3),-3.43,4.75,-11.74,1.48,.54,Math.PI/2);
    signs.place('mobility-workshop-book',()=>signTexture('НАРЯДЫ','РЕЙСЫ • ПРОКАТ • СМЕТЫ','#f4d6a2','#405a60',3.5),-46.9,1.8,44.25,1.18,.45,Math.PI/2);
    rail.flush(); signs.flush();
    const permanentSigns=new Map();
    function madeSign(text) {
        if (!text) { for(const node of permanentSigns.values()) node.visible=false; return; }
        let node=permanentSigns.get(text);
        if(!node){
            node=new T.Group(); const panels=new Panels(node);
            panels.place(text,()=>signTexture(text,'КАНАЛЬНЫЙ ГАРАЖ','#f7c879','#34515b',4.2),-46.6,3.88,43.7,2.9,.66,Math.PI/2);
            panels.flush(); permanentSigns.set(text,node);group.add(node);
        }
        for(const item of permanentSigns.values())item.visible=item===node;
    }
    let lastSign, chairs, cafeCount=-1, riderActor, shiftActors=[], lastRiderPosition=null, walkAway=0;
    function personInCar(ctx, state) {
        const pass=state.passenger, car=pass && ctx.sim.cars.find(v=>v.id===pass.car);
        if(car && Math.hypot(car.x-ctx.player.x,car.z-ctx.player.z)<45) {
            if(!riderActor){riderActor=createPerson('resident',21);group.add(riderActor.root);}
            const cabin=carCabin(car.kind), entry=pass.phase==='board'?pass.t:pass.phase==='leave'?1-pass.t:1;
            const t=T.MathUtils.smoothstep(entry,.12,.86);
            const stand=cabin.halfWidth+.65, at=location(car,stand+(cabin.seatX-stand)*t,0,cabin.seatZ+.14*(1-t));
            riderActor.root.position.set(...at);
            riderActor.root.rotation.y=car.yaw+(1-t)*Math.PI/2;
            riderActor.root.visible=true;riderActor.update(ctx.dt,0,false,{seated:t, seatHeight:cabin.seatY, doorDuck:.27*Math.sin(Math.PI*t)});
            if(pass.phase==='leave'){lastRiderPosition={x:at[0],y:at[1],z:at[2],yaw:car.yaw};walkAway=2.4;}
        } else if(riderActor && walkAway>0 && lastRiderPosition) {
            walkAway=Math.max(0,walkAway-ctx.dt);
            riderActor.root.visible=true;riderActor.root.position.y=lastRiderPosition.y;
            riderActor.root.rotation.y=lastRiderPosition.yaw-Math.PI/2;
            riderActor.update(ctx.dt,0,false,{conversation:walkAway>1});
        } else if(riderActor)riderActor.root.visible=false;
    }
    function showChairs(ctx, count) {
        if(!ctx.indoorScene)return;
        if(!chairs){chairs=new T.Group();chairs.userData.dynamicScenery=true;ctx.indoorScene.add(chairs);}
        if(count!==cafeCount){
            const pieces=new Batches(chairs);
            for(let i=Math.max(cafeCount,0);i<count;i++){
                const x=151.6+(i%4)*.86,z=i<4?2.9:3.65;
                pieces.box(x,.48,z,.49,.08,.49,'#b58a55');pieces.box(x,.79,z+.19,.45,.44,.07,'#738d7b');
                for(const dx of [-.17,.17])for(const dz of [-.16,.16])pieces.box(x+dx,.22,z+dz,.045,.44,.055,'#526462');
            }
            if(count<cafeCount){for(const child of [...chairs.children])chairs.remove(child);cafeCount=0;return showChairs(ctx,count);}
            pieces.flush();cafeCount=count;
        }
        chairs.visible=count>0&&ctx.zone==='cafe';
    }
    let tramSign, passengerModels=[];
    const signCache=new Map();
    function drawTram(ctx,r,s) {
        if(tramSign)tramSign.visible=false;
        for(const model of passengerModels)model.root.visible=false;
        for(const model of shiftActors)model.root.visible=false;
        const rider=ctx.sim.tramRider, near=Math.hypot(ctx.player.x-r.x,ctx.player.z-r.z)<48;
        if(!r.visible||!near)return;
        if(r.stop==='depot' && r.elapsedAtStop<9.4 && !rider.onboard){
            for(let i=0;i<2;i++){
                if(!shiftActors[i]){shiftActors[i]=createPerson(i?'dispatcher':'resident',i+12);group.add(shiftActors[i].root);}
                const model=shiftActors[i],progress=T.MathUtils.smoothstep(r.elapsedAtStop,1,4);
                const p=tramLocal(r,2.7+i*.28,i?5.1-progress*.8:3.1+progress*.45);
                model.root.visible=true;model.root.position.set(p.x,0,p.z);model.root.rotation.y=r.yaw+(i?0:Math.PI);
                model.update(ctx.dt,0,false,{conversation:true,handoff:progress*1.2,handoffRole:i?'dispatcher':'resident'});
            }
            const book=tramLocal(r,2.83,4.05);
            parts.box(book.x,1.05,book.z,.24,.044,.18,r.yaw,'#8a6447');
            light.box(book.x+.10,1.08,book.z,.075,.012,.024,r.yaw,'#e7c976');
        }
        if(r.line && r.line!=='07'){
            const key=r.line;
            if(!signCache.has(key)){
                const n=new T.Group(),panels=new Panels(n);
                for(const side of [-1,1])panels.place('notice',()=>signTexture(key==='17Д'?'17Д  ДЕПО':'17Р  РЫНОК','ЧЕРЕЗ МАСТЕРСКИЕ','#242f30','#e1cf9d',4.6),side*1.281,2.11,0,1.4,.34,side*Math.PI/2);
                panels.place('front',()=>signTexture(key,'ЧЕРЕЗ МАСТЕРСКИЕ','#292d31','#e1cf9d',4.3),0,2.58,5.187,1.62,.29,0);
                panels.flush();group.add(n);signCache.set(key,n);
            }
            tramSign=signCache.get(key);tramSign.visible=!rider.onboard;tramSign.position.set(r.x,0,r.z);tramSign.rotation.y=r.yaw;
        }
        if(rider.onboard && rider.request){
            const p=tramLocal(r,.99,3.05);light.box(p.x,2.39,p.z,.07,.095,.2,r.yaw,'#ffc063');
        }
        if(rider.onboard && rider.seat && r.z>-21 && r.z<-3)
            light.box(-3.39,5.06,-11.74,.07,.044,.98,0,'#ffd27b');
        if(!r.stop || !r.service || r.doors<.03 || rider.onboard&&rider.entryProgress<.8) return;
        const step=r.elapsedAtStop||0, leaving=step<3.6;
        if(step>11.6 && !s.holdUntil)return;
        for(let i=0;i<2;i++){
            if(!passengerModels[i]){const person=createPerson('resident',17+i);group.add(person.root);passengerModels[i]=person;}
            const m=passengerModels[i],progress=Math.max(0,Math.min(1,(step-.55-i*.45)/2.12));
            const across=leaving?1.10+progress*2.05:2.94-Math.min(1,(step-3.6)/3.8)*1.9;
            const p=tramLocal(r,across,leaving?-3.31+i*.49:3.3+i*.46);
            m.root.visible=leaving||step<7.9; m.root.position.set(p.x,Math.max(0,(1.65-across)*1.46),p.z);
            m.root.rotation.y=r.yaw+(leaving?-.5:.5)*Math.PI;
            if(m.root.visible)m.update(ctx.dt,1.1,false,{});
        }
    }
    return function(ctx,s,r,signals){
        const exterior=ctx.zone==='street';group.visible=exterior;
        light.clear();parts.clear();showChairs(ctx,s.chairs);
        if(s.sign!==lastSign){madeSign(s.sign);lastSign=s.sign;}
        if(exterior){
            const t=ctx.sim.elapsed;
            personInCar(ctx,s);
            if(s.shopLamp){
                parts.box(-46.55,1.55,43.84,.08,.22,.17,0,'#687673');
                light.box(-46.48,1.55,43.84,.06,.16,.12,0,'#ffe0a2');
            }
            for(const [car,side] of signals){
                if((Math.floor(t*2.8)%2)===1)continue;
                const spec=specs[car.kind];if(!spec)continue;
                for(const z of [spec.front-.033,spec.rear+.033]){
                    const [x,y,wz]=location(car,side*(spec.w-.105),spec.belt-.10,z);
                    light.box(x,y,wz,.185,.095,.085,car.yaw,'#ffb038');
                }
            }
            const car=ctx.car;
            if(car){
                const cabin=carCabin(car.kind),wear=Math.max(1-Math.min(100,car.health)/100,(car.id==='fleet-taiga'&&!s.used.fixed) ? .78 : 0);
                const shake=wear*.025*Math.sin(t*31);
                const cup=location(car,.07,cabin.seatY+.24,cabin.seatZ-.51);
                parts.box(...cup,.078,.18,.078,car.yaw,'#718d86');
                parts.box(cup[0]+shake,cup[1]+.10,cup[2],.083,.026,.083,car.yaw,'#d1be93');
            }
            if(s.noteCar){
                const c=ctx.sim.cars.find(v=>v.id===s.noteCar);
                if(c&&Math.hypot(c.x-ctx.player.x,c.z-ctx.player.z)<40) {
                    const b=specs[c.kind],p=location(c,.28,b.belt+.085,b.a-.01);
                    parts.box(...p,.22,.045,.14,c.yaw-.18,'#e7d7aa');
                }
            }
            if(s.fund>=3) {
                parts.box(-22.36,1.85,17.9,.12,3.7,.12,0,'#5b6e70');
                parts.box(-22.1,3.65,17.9,.60,.12,.24,0,'#788a85');
                if(ctx.minutes>1020||ctx.minutes<390)light.box(-21.99,3.565,17.9,.38,.055,.19,0,'#ffd796');
            }
            drawTram(ctx,r,s);
        }
        light.finish();parts.finish();
    };
};
