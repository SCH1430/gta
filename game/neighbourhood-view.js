"use strict";
const T = require("../engine/three.module.min.js");
const { Batches, Panels } = require("./world-batch.js");
const { signTexture } = require("./world-textures.js");
const { groundHeight } = require("./world-layout.js");
const { createPerson } = require("./model-people.js");
const gate = exports.gate = { x:-254, z:10.2, half:1.75 };
const signs = exports.signs = [
    {x:-23.6,y:3.45,z:15.61,text:'КАНАЛЬНАЯ 23–31',sub:'ДВОР ЧЕРЕЗ АРКУ  ›',w:3.42,h:.71},
    {x:-18.15,y:2.23,z:13.68,text:'ПОДЪЕЗДЫ',sub:'23  ‹   ›  24, 31',w:1.02,h:.43},
    {x:-3.80,y:2,z:15.85,text:'РЕМОНТ КОЛЯСОК',sub:'БЫВШАЯ КОЛЯСОЧНАЯ',w:2.0,h:.42},
    {x:gate.x+2.35,y:1.63,z:gate.z+.10,text:'ШКОЛЬНЫЙ ДВОР',sub:'ПРОХОД 15–21 · ОБХОД С ВОСТОКА',w:2.42,h:.58},
    {x:19.9,y:3.19,z:20.58,text:'ЧАСЫ ДЕПО',sub:'ВСТРЕЧИ У ЦИФЕРБЛАТА',w:1.55,h:.36},
    {x:34.65,y:2.39,z:20.08,text:'ВЫДАЧА ДЕТАЛЕЙ',sub:'ПОЛКА МАСТЕРА',w:1.6,h:.35},
    {x:-37.8,y:2.19,z:-1.91,text:'ЛЕСЕНКА',sub:'ДВОРОВОЕ ДОМИНО',w:1.08,h:.37}
];
function layer(parent,name,dynamic=false) {
    const group=new T.Group();group.name=name;
    if(dynamic) group.userData.dynamicScenery=true;
    else group.userData.staticScenery=true;
    parent.add(group);
    return group;
}
function makeView(scene) {
    const root=layer(scene,'Двор и рыночная улица',true);
    const stat=layer(root,'Уличные ориентиры'),b=new Batches(stat),p=new Panels(stat);
    const trim='#50626c', white='#d0d3c4', blue='#567881', wood='#896e58';
    function sign(board, parent=p) {
        const {x,y,z,text,sub,w,h,angle=0}=board;
        parent.place(text,()=>signTexture(text,sub,'#e3e1bf','#394f56',w/h),x,y,z,w,h,angle);
    }
    signs.forEach(s=>{b.box(s.x,s.y,s.z-.04,s.w+.07,s.h+.07,.07,trim);sign(s)});
    // New balcony glazing on no. 23 and a former pram room on the matching block.
    for(const y of [5.85,8.68,11.51]) {
        b.box(-37.6,y-.55,15.80,3.14,.13,.59,trim);
        b.box(-37.6,y,16.02,3.04,1.02,.065,'#78929a');
        for(const dx of [-1.50,-.50,.53,1.50]) b.box(-37.6+dx,y,16.067,.059,1.12,.064,'#c2ccc7');
    }
    b.box(-3.8,1.24,15.54,2.44,2.22,.12,'#536461');
    b.box(-4.2,1.52,15.62,1.34,.80,.06,'#b1a488');
    for(const x of [-4.51,-4.09,-3.75]) b.beam(x,1.60,15.67,x+.08,1.28,15.67,.07,'#3a4844');
    // A neighbouring building left its roofline and tiled kitchen on the blind end wall.
    b.beam(-21.94,3.52,5,-21.94,5.12,8.4,.104,'#a78c76',true);
    b.beam(-21.94,5.12,8.4,-21.94,3.52,11.8,.104,'#a78c76',true);
    for(let i=0;i<9;i++) for(let j=0;j<3;j++) b.box(-21.927,.69+j*.31,6.18+i*.32,.04,.29,.30,(i+j)%5?'#9aada5':'#827c68');
    b.box(-21.924,1.16,10.23,.04,2.22,1.08,'#8c817a');
    for(let i=0;i<9;i++)b.box(-21.891,.19+i*.23,10.23,.018,.025,1.09,'#615e58');
    // School side gate leaves the main entrance unaffected.
    for(const side of [-1,1]){
        const x=gate.x+side*(gate.half+2.64);
        b.box(x,.84,gate.z,5.28,.12,.095,trim);
        for(let i=-2.52;i<=2.54;i+=.35)b.box(x+i,.79,gate.z,.065,1.58,.065,trim);
        b.box(gate.x+side*gate.half,.89,gate.z,.16,1.78,.16,blue);
    }
    const leaf=layer(root,'Калитка школьного двора',true),lb=new Batches(leaf);
    leaf.position.set(gate.x-gate.half,0,gate.z);
    lb.box(gate.half,.89,0,gate.half*2,.10,.09,blue);
    for(let i=.1;i<gate.half*2;i+=.31)lb.box(i,.75,0,.06,1.50,.07,blue);
    lb.flush();
    // A clock with a broken minute hand, also recognisable across the road.
    b.box(19.9,2.13,20.45,.13,4.26,.16,trim);
    b.piece('round',19.9,3.98,20.53,1.25,.16,1.25,trim,0,0,Math.PI/2);
    b.piece('round',19.9,3.98,20.63,1.10,.045,1.10,'#d6cdb2',0,0,Math.PI/2);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;b.box(19.9+.45*Math.sin(a),3.98+.45*Math.cos(a),20.666,.055,.074,.02,trim)}
    b.beam(19.9,3.98,20.687,19.68,4.12,20.687,.052,trim,true);
    b.beam(19.9,3.98,20.69,20.04,3.75,20.69,.045,trim,true);
    b.beam(20.04,3.75,20.69,20.01,3.62,20.69,.041,trim,true);
    for(const z of [24.8,36.2]){
        b.box(39.10,.91,z,.105,1.82,.12,trim);
        b.box(39.1,1.13,z,.22,.29,.17,'#c9a654');
        b.box(39.1,1.72,z,.32,.36,.20,trim);
    }
    const signalNodes=['#65747c','#f3b94d','#82dfad'].map(color=>{
        const group=layer(root,'Линзы пешеходного перехода',true),gb=new Batches(group);
        for(const z of [24.8,36.2]){
            gb.lamp(39.1,1.73,z,.215,.22,.213,color);
            gb.lamp(39.1,1.14,z,.092,.073,.179,color);
        }
        gb.flush();return group;
    });
    const bench={x:-28,z:17.1},tableX=-36.65,tableZ=1.84;
    b.box(tableX,.74,tableZ,1.30,.095,.89,'#798777');
    for(const side of [-1,1])b.box(tableX+side*.49,.34,tableZ,.085,.68,.66,trim);
    for(let i=0;i<7;i++)b.box(tableX-.28+i*.09,.797,tableZ,.074,.026,.15,i%3?'#c6be9e':'#505551');
    for(const z of [tableZ-.70,tableZ+.70]) b.box(tableX,.44,z,1.20,.105,.31,wood);
    // A high shelf that can be approached from the public side of the stall.
    b.box(35.65,1.74,20.38,1.63,.087,.51,wood);
    b.box(35.31,3.69,18.0,.84,.12,.72,'#57879a');
    b.box(35.31,3.77,18.0,.27,.045,.095,'#729292');
    for(const x of [35.04,36.26])b.box(x,1.34,20.17,.07,.8,.09,trim);
    const sets={};
    function variant(key,maker) {const g=layer(root,key,true),gb=new Batches(g),gp=new Panels(g);maker(gb,gp,g);gb.flush();gp.flush();sets[key]=g;return g}
    variant('shelf',(d)=>{d.box(35.66,1.956,20.43,.58,.36,.35,'#a88862');d.box(35.66,1.96,20.44,.078,.37,.36,'#d3bd89')});
    variant('packet',d=>d.box(35.03,1.86,20.43,.25,.16,.20,'#a7afa1'));
    for(const phase of ['morning','playing','ready'])variant(phase,(d,l)=>{
        const x=27.30,z=20.83;d.box(x,1.57,z,.55,.39,.22,wood);
        d.box(x-.10,1.58,z+.116,.24,.24,.027,phase==='morning'?'#3c4448':'#aaa28b');
        for(let i=0;i<4;i++)d.box(x-.18+i*.054,1.59,z+.14,.017,.18,.024,trim);
        if(phase==='morning')d.box(x+.47,1.39,z,.31,.035,.22,trim);
        if(phase==='playing')d.lamp(x+.19,1.65,z+.13,.053,.045,.02,'#ffe4a1');
        if(phase==='ready')sign({x:x+.40,y:1.53,z:z+.15,text:'ГОТОВО',sub:'К ВЫДАЧЕ',w:.36,h:.20},l);
    });
    for(const fixture of ['domino','racks','line'])variant(fixture,d=>{
        const x=-25.9,z=20.96;
        if(fixture==='domino'){d.box(x,.76,z,1.72,.12,1.10,wood);d.box(x,.36,z,.32,.72,.42,trim);for(let i=0;i<5;i++)d.box(x-.26+i*.12,.834,z,.095,.025,.19,white);}
        if(fixture==='racks')for(let i=0;i<4;i++){const a=x-.72+i*.48;d.box(a,.42,z,.065,.84,.065,trim);d.box(a,.84,z+.22,.065,.07,.49,trim);d.box(a,.42,z+.44,.065,.84,.065,trim)}
        if(fixture==='line'){for(const side of [-1,1])d.box(x+side*1.35,1,z,.08,2,.08,trim);d.box(x,1.95,z,2.7,.025,.025,white);for(let i=0;i<3;i++)d.box(x-.76+i*.71,1.59,z,.51,.70,.035,i%2?blue:white)}
    });
    variant('bag',d=>d.box(bench.x+.46,.16,bench.z+.51,.28,.32,.24,'#986950'));
    variant('rail',d=>d.box(34.63,1.59,20.40,.11,.12,1.26,'#a5b9be'));
    const umbrella=variant('umbrella',d=>{d.piece('taper',0,1.19,0,.53,.18,.53,'#806264');d.box(0,.69,0,.035,.96,.035,trim);d.box(.096,1.211,.13,.116,.043,.145,'#d4b888')});
    const pram=variant('pram',d=>{
        d.box(0,.60,-.33,.41,.32,.62,'#687c76');
        d.box(0,.83,-.48,.42,.23,.25,'#947961');
        d.beam(-.17,.51,-.13,-.17,1.00,.08,.035,trim);d.beam(.17,.51,-.13,.17,1.00,.08,.035,trim);
        d.box(0,1.00,.08,.37,.035,.042,trim);
        for(const x of [-.23,.23])for(const z of [-.55,-.15])d.piece('round',x,.16,z,.27,.04,.27,'#455057',0,Math.PI/2,0);
    });
    const windows=[];
    for(const [i,x] of [-38.6,-6.4].entries()){
        const g=variant('window'+i,d=>{
            d.box(x,7.3,15.76,1.05,1.38,.04,i?'#e3bd86':'#c4bd98');
            d.box(x,7.60,15.802,.17,.19,.045,trim);d.box(x,7.28,15.803,.22,.46,.04,trim);
        });const limb=layer(root,'Силуэт в окне',true),ab=new Batches(limb);ab.box(.17,0,0,.35,.07,.05,trim);ab.flush();limb.position.set(x,7.42,15.85);
        let lamp;
        if(i){
            lamp=layer(root,'Починенная настольная лампа',true);const light=new Batches(lamp);
            light.lamp(x+.39,7.18,15.83,.19,.10,.04,'#ffe4a0');light.flush();
        }
        windows.push([g,limb,lamp]);
    }
    b.flush();p.flush();
    const actors=new Map();
    let indoorHelper;
    function actor(id,at,ctx,pose={}){
        const dist=Math.hypot(at.x-ctx.player.x,at.z-ctx.player.z);
        let model=actors.get(id);
        if(!root.visible||dist>29){if(model)model.root.visible=false;return}
        if(!model){
            const variant={guide:9,neighbour:15,foreman:2,driver:6,bench:11,crosser:7,dayGuest:5,nightGuest:8}[id]??3;
            model=createPerson('resident',variant);root.add(model.root);actors.set(id,model);
        }
        model.root.visible=true;model.root.position.set(at.x,groundHeight(at.x,at.z),at.z);model.root.rotation.y=at.yaw||0;
        const since=model.civicPoseAt===undefined?ctx.dt:ctx.sim.elapsed-model.civicPoseAt;
        if(since>=0&&since<(dist>18?.10:dist>9?.05:0))return;
        model.civicPoseAt=ctx.sim.elapsed;model.update(Math.min(.14,Math.max(ctx.dt,since)),at.speed||0,false,{ground:groundHeight,...pose});
    }
    return {actor,indoor(ctx,visible,stop){
        if(!visible||!ctx.indoorScene){if(indoorHelper)indoorHelper.root.visible=false;return}
        if(!indoorHelper){indoorHelper=createPerson('resident',15);ctx.indoorScene.add(indoorHelper.root)}
        const upper=stop==='landing';
        indoorHelper.root.visible=true;indoorHelper.root.position.set(upper?-1.56:-1.52,upper?3.06:0,upper?-5.65:6.26);
        indoorHelper.root.rotation.y=upper?.58:2.68;
        indoorHelper.update(ctx.dt,0,false,{conversation:true,nod:.48});
    },update(ctx,s,rt){
        root.visible=ctx.zone==='street';
        if(!root.visible)return;
        const remaining=rt.holdEnd-ctx.sim.elapsed,t=Math.max(0,Math.min(1,(3.7-remaining)/3.1));
        pram.visible=!s.favour||remaining>0;
        if(pram.visible)pram.position.set(s.favour?-34.58-.30*t:-33.68,0,s.favour?18.60-2.95*t:18.44);
        leaf.rotation.y=ctx.minutes>=900&&ctx.minutes<1260?-Math.PI*.49:0;
        signalNodes.forEach((g,i)=>g.visible=i===rt.signal);
        const phase=ctx.minutes<660?'morning':ctx.minutes<1080?'playing':'ready';
        for(const k of ['morning','playing','ready'])sets[k].visible=k===phase;
        for(const k of ['domino','racks','line'])sets[k].visible=s.yard===k;
        const reaching=rt.poseMode==='shelf'&&ctx.sim.elapsed<rt.itemTime+(rt.poseEnd-rt.itemTime)*.40;
        sets.bag.visible=s.item==='bag-ground';sets.rail.visible=s.item!=='rail'||reaching;
        sets.shelf.visible=s.item!=='box'||reaching;sets.packet.visible=s.item!=='packet'||reaching;
        umbrella.visible=s.umbrella!=='held';umbrella.position.set(s.umbrella==='returned'?27.9:15.86,0,s.umbrella==='returned'?21.55:21.82);
        for(const [i,[g,limb,lamp]] of windows.entries()){
            g.visible=limb.visible=ctx.minutes>=1080&&ctx.minutes<1395;
            if(limb.visible)limb.rotation.z=i?(s.night<2?-.48+.20*Math.sin(ctx.sim.elapsed*2):-.26):Math.sin(ctx.sim.elapsed*(s.night>1?2.2:1.2))*.72;
            if(lamp)lamp.visible=g.visible&&(s.night>=2||ctx.sim.elapsed%7.20<.45);
        }
    },hideActor(id){const m=actors.get(id);if(m)m.root.visible=false},root};
}
exports.makeView=makeView;
