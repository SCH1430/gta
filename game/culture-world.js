"use strict";
const T = require('../engine/three.module.min.js');
const {groundHeight} = require('./world-layout.js');
const {specs} = require('./vehicle-cabin.js');
const {createPerson} = require('./model-people.js');
const {slopes,works} = require('./culture-paths.js');
const {places,familyLine} = require('./culture-stories.js');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Rounded footprint tucked into the crowned steel roof. All nearby cars share this mesh geometry.
function snowCapGeometry() {
    const points=[0,1,0], indices=[], count=16;
    for (const [radius,high] of [[.65,.81],[.94,.22],[1,-.39]]) {
        for(let i=0;i<count;i++) {
            const theta=i*Math.PI*2/count, u=Math.cos(theta), v=Math.sin(theta);
            const uneven=radius*(.98+.02*Math.sin(theta*3+.6));
            points.push(uneven*Math.sign(u)*Math.abs(u)**.65,high,
                uneven*Math.sign(v)*Math.abs(v)**.65);
        }
    }
    for(let i=0;i<count;i++) {
        const j=(i+1)%count;
        indices.push(0,1+j,1+i);
        for(const start of [1,1+count]) {
            indices.push(start+i,start+j,start+count+j,start+i,start+count+j,start+count+i);
        }
    }
    const geom=new T.BufferGeometry();
    geom.setAttribute('position',new T.Float32BufferAttribute(points,3));
    geom.setIndex(indices);geom.computeVertexNormals();return geom;
}
function createRoofSnow() {
    const {snowRoofAt}=require('./camera-volume.js'), {roofWidth}=require('./vehicle-cabin.js');
    const geometry=snowCapGeometry(), material=new T.MeshLambertMaterial({color:'#d5dfe1'});
    const surface=new Map(), visible=new Map();
    function clear(){
        for(const record of visible.values()) record.cap.removeFromParent();
        visible.clear();surface.clear();
    }
    function restore(raw) {
        clear();
        if(!Array.isArray(raw)) return;
        for(const entry of raw.slice(0,256)) {
            if(Array.isArray(entry) && typeof entry[0]==='string' && entry[0].length<80 && Number.isFinite(entry[1]))
                surface.set(entry[0],{cover:Math.max(0,Math.min(1,entry[1])),stopped:150});
        }
    }
    function update(c,dt) {
        const weather=c.weather, cars=c.sim.cars||[], active=new Set(), candidates=[];
        const snow=weather.snow ?? 0, rain=weather.rain ?? 0, temperature=weather.temperature ?? 0;
        const freeze=1-T.MathUtils.smoothstep(temperature,.35,2.2);
        for(const car of cars) {
            const spec=specs[car.kind];if(!spec)continue;
            active.add(car.id);
            const roofY=car.y+spec.roof, middle=(spec.b+spec.c)*.5;
            const roofX=car.x+Math.sin(car.yaw)*middle, roofZ=car.z+Math.cos(car.yaw)*middle;
            const speed=Math.abs(car.speed), standing=speed<.25;
            const outdoors=(snow>.001 || rain>.001) && snowRoofAt(roofX,roofZ)<roofY;
            const exposed=standing && snow>.001 && freeze>0 && outdoors;
            let item=surface.get(car.id);
            if(!item) {
                item={cover:!car.auto && exposed ? .23*snow*freeze : 0, stopped:car.auto?0:48};
                surface.set(car.id,item);
            }
            item.stopped=standing ? item.stopped+dt : 0;
            const pickup=exposed ? .011*snow*freeze : 0;
            const melt=.0019*Math.max(0,temperature-.1)+(outdoors ? rain*.007 : 0);
            const shedding=.0016*Math.max(0,speed-.7)+.0011*Math.max(0,speed-9);
            item.cover=T.MathUtils.clamp(item.cover+(pickup-melt-shedding)*dt,0,1);
            const distance=(car.x-c.player.x)**2+(car.z-c.player.z)**2;
            if(c.zone==='street' && distance<36**2 && item.cover>.025)
                candidates.push({car,spec,distance,cover:item.cover});
        }
        for(const id of surface.keys()) if(!active.has(id))surface.delete(id);
        candidates.sort((a,b)=>a.distance-b.distance);
        const shown=new Set();
        for(const {car,spec,cover} of candidates) {
            if(shown.size>=8)break;
            const model=c.cars?.get(car.id)?.model?.root;
            if(!model?.parent) continue;
            let record=visible.get(car.id);
            if(record?.model!==model) {
                record?.cap.removeFromParent();
                const body=model.getObjectByName('sprung-chassis');
                if(!body)continue;
                const cap=new T.Mesh(geometry,material);
                cap.name='Снег на крыше';body.add(cap);
                visible.set(car.id,record={cap,model});
            }
            const cap=record.cap;
            const spread=Math.sqrt(cover), radius=.13+.86*spread;
            cap.position.set(0,spec.roof+.051-.024*spread,(spec.b+spec.c)*.5);
            cap.scale.set(roofWidth(car.kind)*.91*radius,.012+.065*cover,(spec.c-spec.b)*.46*radius);
            shown.add(car.id);
        }
        for(const [id,record] of visible) if(!shown.has(id)){record.cap.removeFromParent();visible.delete(id);}
    }
    return {update,restore,save:()=>Array.from(surface,([id,v])=>[id,v.cover]),
        justParked:id=>{const item=surface.get(id);return item && item.cover>.09 && item.stopped>0 && item.stopped<120;}};
}
function createWorld(scene) {
    const roofSnow=createRoofSnow();
    const root=new T.Group(), dummy=new T.Object3D(), ink=new T.Color();
    root.userData.dynamicScenery=true;
    root.name='Сезон Канальной улицы';
    scene.add(root);
    const box=new T.BoxGeometry(1,1,1), spot=new T.CircleGeometry(.5,10).rotateX(-Math.PI/2);
    const solid=new T.MeshLambertMaterial({color:0xffffff});
    function batch(geometry,material,limit,parent=root) {
        const mesh=new T.InstancedMesh(geometry,material,limit);
        mesh.count=0;
        mesh.frustumCulled=false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        parent.add(mesh);
        return mesh;
    }
    function put(mesh,x,y,z,w,h,d,angle,color,roll=0) {
        const i=mesh.count++;
        dummy.position.set(x,y,z);
        dummy.rotation.set(0,angle,roll,'YXZ');
        dummy.scale.set(w,h,d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
        mesh.setColorAt(i,ink.set(color));
    }
    function finish(mesh) {
        mesh.visible=mesh.count>0;
        mesh.instanceMatrix.needsUpdate=true;
        if(mesh.instanceColor) mesh.instanceColor.needsUpdate=true;
    }
    const marks=batch(spot,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.72,depthWrite:false}),240);
    const objects=batch(box,solid,96);
    const lights=batch(box,new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),52);
    const warming=[[-28.8,18.6],[-25.3,18.8],[-21.5,18.9],[-17.2,18.5],[-12.8,18.1],[-8.5,17.5]];
    const yardTracks=[], pedestrians=new Map(), indoorMarks=[];
    const actors=[];
    let previousZone, previousDay, previousStep, stepsLeft=0, turn=0, trailTime=0, interval=0, indoor, wetMesh, actorsAt='', tapeLength=0;
    function makeActors(n) {
        while(actors.length<n) {
            const a=createPerson('resident',[7,10,4][actors.length]);
            root.add(a.root); actors.push(a);
        }
    }
    function tableau(ctx,state) {
        let set='', points=[];
        const family=state.progress[63],garage=state.progress[64],quiet=state.progress[70];
        if(ctx.zone==='street' && !ctx.car && state.reunion && dist(ctx.player,state.reunion)<32) {
            set='visitor';points=[[state.reunion.x,state.reunion.z]];
        } else if(ctx.zone==='street' && dist(ctx.player,places.court)<23 && family>=3 && family<=4 && ctx.minutes>=17*60 && ctx.minutes<20*60) {
            set='family';
            points=familyLine;
        } else if(ctx.zone==='street' && garage>=2 && (ctx.minutes>=1200 || ctx.minutes<360) && dist(ctx.player,places.shutter)<22) {
            set='lesson'; points=[[-46.55,49.21],[-45.87,50.1]];
        } else if(ctx.zone==='street' && tapeLength>.005 && tapeLength<.995 && dist(ctx.player,works)<24) {
            set='worker';points=[[works.x-1.38+tapeLength*2.72,works.z+.92]];
        } else if(ctx.zone==='street' && (quiet||0)<2 && dist(ctx.player,places.stop)<16) {
            set='passenger'; points=[[13.05,21.78]];
        }
        if (points.length) makeActors(points.length);
        actors.forEach((a,i)=>{
            a.root.visible=i<points.length;
            if(!a.root.visible) return;
            const [x,z]=points[i]; a.root.position.set(x,groundHeight(x,z),z);
            a.root.rotation.y=set==='visitor'?state.reunion.yaw:set==='lesson'?(i?1.1:-1.6):Math.PI;
            a.update(ctx.dt,set==='visitor'?state.reunion.speed:set==='worker'?.42:0,false,{seated:set==='passenger'?1:0,seatHeight:.48,working:set==='lesson'||set==='worker'?1:0});
        });
        actorsAt=set;
    }
    function footfalls(ctx,state) {
        if(ctx.indoorScene && ctx.indoorScene!==indoor) {
            indoor=ctx.indoorScene;
            const group=new T.Group();group.userData.dynamicScenery=true;indoor.add(group);
            wetMesh=batch(spot,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.64,depthWrite:false}),8,group);
        }
        if(ctx.zone!==previousZone) {
            stepsLeft=ctx.zone==='house' && previousZone==='street' && (ctx.weather.wet>.38||ctx.weather.snow>.1)?7:0;
            previousStep={...ctx.player};previousZone=ctx.zone;
            indoorMarks.length=0;
        }
        if(stepsLeft && ctx.zone==='house' && dist(ctx.player,previousStep)>.37) {
            const p=ctx.player,side=(stepsLeft%2?1:-1)*.091;
            indoorMarks.push({x:p.x+Math.cos(p.yaw)*side,y:p.y+.012,z:p.z-Math.sin(p.yaw)*side,yaw:p.yaw,t:ctx.sim.elapsed,dark:stepsLeft/7});
            previousStep={x:p.x,z:p.z};stepsLeft--;
        }
        if(wetMesh) {
            wetMesh.count=0;
            if(ctx.zone==='house') for(const f of indoorMarks) {
                const age=ctx.sim.elapsed-f.t, fade=Math.max(0,1-age/40)*(.32+.68*f.dark);
                if(fade>.03)put(wetMesh,f.x,f.y,f.z,.108*fade,1,.24*fade,f.yaw,'#415054');
            }
            finish(wetMesh);
        }
        if(state.day!==previousDay) {yardTracks.length=0;pedestrians.clear();previousDay=state.day;}
        trailTime-=ctx.dt;
        if(trailTime>0 || ctx.zone!=='street')return;
        trailTime=.44;
        const walkers=ctx.sim.people||[];
        const track=(id,p)=>{
            if(Math.abs(p.x+20)>20||Math.abs(p.z-18.7)>3 || Math.abs(p.speed)<.2)return;
            const last=pedestrians.get(id);
            if(last && dist(last,p)<.65)return;
            pedestrians.set(id,{x:p.x,z:p.z});
            const side=(++turn%2?1:-1)*.10;
            yardTracks.push([p.x+Math.cos(p.yaw)*side,p.z-Math.sin(p.yaw)*side,p.yaw]);
            if(yardTracks.length>100)yardTracks.shift();
        };
        if(!ctx.car)track('hero',ctx.player);
        for(const p of walkers)if(!p.onboard)track(p.id,p);
    }
    function rebuild(ctx,state) {
        marks.count=objects.count=lights.count=0;
        if(ctx.zone!=='street') { [marks,objects,lights].forEach(finish); return; }
        const p=ctx.player,w=ctx.weather,t=ctx.sim.elapsed;
        function close(x,z,r=53){return (p.x-x)**2+(p.z-z)**2<r*r;}
        function stain(x,z,width,length,yaw,col,offset=.019) {
            put(marks,x,groundHeight(x,z)+offset,z,width,1,length,yaw,col);
        }
        if(close(-20,18)) {
            const thaw=w.temperature>-.8 || w.rain>.05;
            if(thaw)for(let i=0;i<warming.length;i++) {
                const [x,z]=warming[i];stain(x,z,1.2,3.65,1.52,'#657170');
                stain(x+.12,z,.42,2.8,1.48,'#4b565a',.024);
            }
            put(objects,-8.45,.025,17.46,.73,.05,.68,0,'#6a6d64');
            for(let k=0;k<4;k++)put(objects,-8.45,.056,17.22+k*.15,.56,.025,.035,0,'#383d3a');
            for(const f of yardTracks)stain(f[0],f[1],.115,.26,f[2],'#6b787d',.026);
            const icicles=w.temperature<3.3;
            if(icicles)for(let k=0;k<6;k++)put(objects,-13.14+k*.48,3.62-(k%3)*.084,15.58,.041,.27+k%3*.16,.045,.18,'#b4cdd6',.12);
            if(tapeLength>.005) {
                for(const x of [works.x-1.45,works.x+1.45])
                    for(const z of [works.z-.64,works.z+.64])put(objects,x,.47,z,.086,.94,.086,0,'#b1a16a');
                for(let i=0;i<Math.ceil(tapeLength*12);i++)put(objects,works.x-1.32+i*.24,.75,works.z+.64,.241,.095,.036,0,i%2?'#a65a50':'#dbcbb0');
                for(const x of [works.x-1.45,works.x+1.45])put(objects,x,.75,works.z,.035,.095,1.28,0,'#d9b9a0');
            }
            if(state.progress[66]>=4)for(let k=0;k<4;k++)put(objects,-34.18,1.13,-.36+k*.066,.12,.12,.028,0,'#e7ae63');
            const night=1-w.daylight;
            if(night>.15)for(let level=0;level<Math.min(7,state.day+1);level++){
                const col=level%4,row=Math.floor(level/4),x=-38+col*4.4,y=7.2+row*3.76;
                for(let k=0;k<5;k++)put(lights,x+k*.23,y-.13*Math.sin(Math.PI*k/4),15.55,.065,.072,.06,0,k%2?'#a3ddc3':'#ffd393');
            }
        }
        if(close(28,21)) {
            const minute=ctx.minutes;
            const open=minute<8*60||minute>=21*60?0:Math.min(1,(minute-480)/12+.09,(1260-minute)/12+.09);
            const height=Math.max(.10,1.11*(1-open));
            put(objects,27.28,2.42-height/2,20.14,2.15,height,.052,0,'#61757a');
            if(open>.05 && (!ctx.jobs?.blackoutPhase || ctx.jobs.blackoutPhase==='normal'))
                stain(27.28,21.3,2.65,Math.max(.12,2.4*open),0,'#b9a57b',.034);
        }
        if(close(-46,44)) {
            const sun=(ctx.minutes-9*60)/480;
            if(w.daylight>.18) {
                const angle=.42+Math.max(0,Math.min(1,sun))*1.9, reach=4.3;
                stain(-43.8+Math.sin(angle)*reach*.5,41.8+Math.cos(angle)*reach*.5,.26,reach,angle,'#454d58');
            }
            put(objects,-43.8,.95,41.8,.10,1.90,.10,0,'#665b4d');
            put(objects,-39.62,.026,41.38,.41,.02,.73,0,'#b8a57a');
            if(state.progress[64]>=2 && (ctx.minutes>=1200 || ctx.minutes<360))
                put(lights,-46.75,.103,49.66,.12,.081,3.62,0,'#f8c07a');
        }
        if(state.sand===0||state.sand===1){
            const a=slopes[state.sand];
            if(close(a.x,a.z))for(let i=0;i<26;i++)stain(a.x+1.38*Math.sin(i*32.7),a.z+.76*Math.cos(i*13.5),.10,.16,i,'#a48f66',.025);
        }
        for(const car of ctx.sim.cars||[]) {
            if(close(car.x,car.z,39) && roofSnow.justParked(car.id) && marks.count<230)
                stain(car.x+Math.cos(car.yaw)*1.13,car.z-Math.sin(car.yaw)*1.13,.20,.40,car.yaw,'#606d74');
        }
        [marks,objects,lights].forEach(finish);
    }
    return {
        update(ctx,state){
            tapeLength=Math.max(0,Math.min(1,tapeLength+(state.closure?1:-1)*ctx.dt/4));
            tableau(ctx,state);footfalls(ctx,state);interval-=ctx.dt;
            if(interval<=0){roofSnow.update(ctx,.22-interval);interval=.22;rebuild(ctx,state);}
        },
        posed(){return actorsAt==='family';},
        saveRoofSnow:roofSnow.save,
        clear(savedRoofSnow){roofSnow.restore(savedRoofSnow);pedestrians.clear();indoorMarks.length=yardTracks.length=0;previousZone=undefined;previousDay=undefined;interval=tapeLength=0;}
    };
}
exports.createWorld=createWorld;
