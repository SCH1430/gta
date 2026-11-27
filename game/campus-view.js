"use strict";
const T = require("../engine/three.module.min.js");
const { Batches } = require("./world-batch.js");
const { campus } = require("./campus-layout.js");
const { addFurniture } = require("./campus-assets.js");
const { schoolMark } = require("./school-view.js");
const { exhibitionPrint } = require("./school-exhibits.js");
const wings = {
    west: { name: 'Западный корпус', accent: '#568271', ink: '#345a50', base: '#b4c8b7' },
    central: { name: 'Центральный корпус', accent: '#507998', ink: '#365a74', base: '#b8cbd2' },
    east: { name: 'Восточный корпус', accent: '#ac775f', ink: '#7d574b', base: '#d5bcaa' }
};
function canvas(w,h) {
    const el = document.createElement('canvas'); el.width=w; el.height=h; return el;
}
function tileMaterial(key, ceilingGrid=false) {
    const source = campusSurfaces[key], size = 96;
    const c = canvas(size,size), g=c.getContext('2d'), image=g.createImageData(size,size);
    const pixels=atob(source.data), colors=source.colors, dst=image.data;
    for(let i=0;i<dst.length/4;i++) {
        const pair=pixels.charCodeAt(i>>1), index=((i&1) ? pair&15 : pair>>4)*3;
        dst[i*4]=colors[index]; dst[i*4+1]=colors[index+1]; dst[i*4+2]=colors[index+2]; dst[i*4+3]=255;
    }
    g.putImageData(image,0,0);
    if(ceilingGrid || key==='tile') {
        g.fillStyle=ceilingGrid?'rgba(116,131,126,.32)':'rgba(102,107,103,.25)';
        g.fillRect(0,0,size,1);g.fillRect(0,0,1,size);
        if(ceilingGrid){g.fillRect(48,0,1,size);g.fillRect(0,48,size,1);}
    }
    const map=new T.CanvasTexture(c); map.wrapS=map.wrapT=T.RepeatWrapping;
    map.colorSpace=T.SRGBColorSpace; map.anisotropy=4;
    return new T.MeshBasicMaterial({map,vertexColors:true});
}
function titleCard(title, sub, fg, bg, w=320, h=70) {
    const el=canvas(w,h),g=el.getContext('2d');
    g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.fillStyle=fg;g.fillRect(0,0,Math.max(4,w*.016),h);
    g.textBaseline='middle';
    const margin=Math.round(h*.21), maxW=w-2*margin;
    g.font='bold '+Math.round(h*(sub?.46:.54))+'px K77Body, sans-serif';
    g.fillText(title,margin,h*(sub?.36:.53),maxW);
    if(sub){g.font='bold '+Math.round(h*.22)+'px K77Body, sans-serif';g.fillText(sub,margin,h*.76,maxW);}
    return el;
}
function panorama(level, direction, variant=0) {
    const w=384,h=126,el=canvas(w,h),g=el.getContext('2d');
    const rnd=require("./world-textures.js").random(157 + 37*direction + 771*variant);
    const sky=g.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#96b5c7'); sky.addColorStop(.65,'#d6e1df');sky.addColorStop(1,'#eee5cf');
    g.fillStyle=sky;g.fillRect(0,0,w,h);
    const horizon=84-level*10, fill=(x,y,width,height,col)=>{g.fillStyle=col;g.fillRect(x,y,width,height);};
    for(let i=0;i<8;i++){
        const x=i*55-12+rnd()*9,bh=11+rnd()*23,bw=32+rnd()*28,y=horizon-bh;
        fill(x,y,bw,bh,i%3?'#99a8a6':'#b3a79b');fill(x-1,y-2,bw+2,3,'#e2e3da');
        for(let j=0;j<Math.floor(bh/7);j++)
            for(let k=0;k<Math.floor(bw/8);k++) fill(x+3+k*8,y+4+j*7,3.6,3,rnd()<.13?'#e6c492':'#71868d');
    }
    fill(0,horizon,w,h-horizon,'#d0dbdc');
    if(variant===0){
        g.fillStyle='#aebfc3';g.beginPath();g.moveTo(w*.59,horizon);g.lineTo(w*.62,horizon);g.lineTo(w*.32,h);g.lineTo(w*.12,h);g.fill();
    }else{
        fill(0,horizon+12,w,2,'#b9c8c9');
    }
    for(let j=0;j<18;j++){
        const x=j*24-6+rnd()*10,ground=horizon+4+rnd()*12, height=9+rnd()*19;
        fill(x,ground-7,1.8,7,'#7d8582');
        for(let layer=0;layer<3;layer++){
            const y=ground-height+layer*height*.19,hw=height*(.15+layer*.07);
            g.fillStyle=['#8eaaa0','#829f91','#759484'][layer];g.beginPath();g.moveTo(x,y-3);g.lineTo(x+hw,y+height*.47);g.lineTo(x-hw,y+height*.47);g.fill();
        }
    }
    g.fillStyle='rgba(227,237,231,.13)';
    g.beginPath();g.moveTo(w*.04,0);g.lineTo(w*.18,0);g.lineTo(w*.42,h);g.lineTo(w*.31,h);g.fill();
    return el;
}
function createAtlas(){
    const tiles=new Map(), sheets=[];
    function tile(key,make,w,h) {
        if(tiles.has(key)) return tiles.get(key);
        let sheet=sheets.at(-1);
        if(sheet && sheet.x+w+2>1024){sheet.x=1;sheet.y+=sheet.row+3;sheet.row=0;}
        if(!sheet || sheet.y+h+2>1024) {
            const el=canvas(1024,1024),map=new T.CanvasTexture(el);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
            sheet={x:1,y:1,row:0,g:el.getContext('2d'),mat:new T.MeshBasicMaterial({map})};
            sheets.push(sheet);
        }
        const im=make();sheet.g.drawImage(im.image??im,sheet.x,sheet.y,w,h);
        const uv=[(sheet.x+.58)/1024,1-(sheet.y+h-.58)/1024,(sheet.x+w-.58)/1024,1-(sheet.y+.58)/1024];
        const result={mat:sheet.mat,uv};tiles.set(key,result);
        sheet.x+=w+3;sheet.row=Math.max(sheet.row,h);return result;
    }
    return {tile};
}
function createCampus(scene) {
    const root=new T.Group(); root.name='Школа № 1430 · игровой кампус';
    root.userData.staticScenery=true;root.userData.regionalCell=true;scene.add(root);
    if(!scene.children.some(o=>o.isLight)) {
        const sky=new T.HemisphereLight('#f3f1e4','#a39b90',1.62),sun=new T.DirectionalLight('#fff2d8',1.15);
        sun.position.set(45,58,28);root.add(sky,sun);
    }
    const mats={lino:tileMaterial('lino'),plaster:tileMaterial('plaster'),wood:tileMaterial('wood'),tile:tileMaterial('tile')};
    const atlas=createAtlas(), cells=new Map(), roomCells=[];
    const colors=new Map();
    function color(value){if(!colors.has(value)) colors.set(value,new T.Color(value));return colors.get(value);}
    const plans=Object.values(campus.floors);
    function cellAt(x,z,floor) {
        const col=Math.floor(x/12),row=Math.floor(z/12),key=[floor,col,row].join('/');
        let cell=cells.get(key);
        if(!cell){
            const group=new T.Group();group.userData.regionalCell=true;group.name='Архитектура '+key;
            cell={group,b:new Batches(group),faces:new Map(),floor,minY:floor-.28,maxY:floor+3.84,
                box:new T.Box3(new T.Vector3(col*12-6,floor-.35,row*12-6),new T.Vector3(col*12+18,floor+4.10,row*12+18))};
            cells.set(key,cell);root.add(group);
        }
        return cell;
    }
    function quad(cell,mat,p,uv,tints){
        let face=cell.faces.get(mat);
        if(!face){face={pos:[],uv:[],rgb:[],idx:[]};cell.faces.set(mat,face);}
        const base=face.pos.length/3;
        for(let k=0;k<4;k++){
            face.pos.push(...p[k]);face.uv.push(...uv[k]);
            const value=Array.isArray(tints)?tints[k]:tints;const tint=value.isColor?value:color(value);face.rgb.push(tint.r,tint.g,tint.b);
        }
        face.idx.push(base,base+1,base+2,base,base+2,base+3);
    }
    function imageCard(cell,key,factory,x,y,z,nx,nz,w,h,tw,th){
        const tile=atlas.tile(key,factory,tw,th),ux=nz*w/2,uz=-nx*w/2;
        const [u0,v0,u1,v1]=tile.uv;
        quad(cell,tile.mat,[[x-ux,y-h/2,z-uz],[x+ux,y-h/2,z+uz],[x+ux,y+h/2,z+uz],[x-ux,y+h/2,z-uz]],
            [[u0,v0],[u1,v0],[u1,v1],[u0,v1]],'#ffffff');
    }
    function sign(cell,title,sub,wing,x,y,z,nx,nz,w,h,big=false){
        const back=big ? wing.ink : '#eeeae0',ink=big ? '#fff9ea' : wing.ink;
        imageCard(cell,title+'|'+sub+'|'+back,()=>titleCard(title,sub,ink,back),
            x,y,z,nx,nz,w,h,300,66);
    }
    function areaAt(plan,x,z){
        return plan.areas.find(a=>Math.abs(x-a.x)<a.w/2+.005&&Math.abs(z-a.z)<a.d/2+.005);
    }
    const floorSmudges = new Map();
    function floorTint(x,z,fy,base){
        const id=fy+'|'+x.toFixed(2)+'|'+z.toFixed(2)+'|'+base;
        if(floorSmudges.has(id))return floorSmudges.get(id);
        const plan=plans.find(p=>Math.abs(p.floor-fy)<.01);
        let edge=2.8;
        for(const w of plan.walls) {
            if(w.kind==='rail')continue;
            const dx=Math.max(Math.min(w.x1,w.x2)-x,0,x-Math.max(w.x1,w.x2));
            const dz=Math.max(Math.min(w.z1,w.z2)-z,0,z-Math.max(w.z1,w.z2));
            if(dx<edge && dz<edge)edge=Math.min(edge,Math.hypot(dx,dz));
        }
        const tint=color(base).clone().multiplyScalar(.75+.25*edge/2.8);
        floorSmudges.set(id,tint);return tint;
    }
    function horizontal(area,fy,mat,ceiling=false,topTint){
        const x0=area.x-area.w/2,z0=area.z-area.d/2,xn=Math.ceil(area.w/5),zn=Math.ceil(area.d/5);
        const f=ceiling?1.10:1.9;
        for(let i=0;i<xn;i++)for(let j=0;j<zn;j++){
            const l=x0+area.w*i/xn,r=x0+area.w*(i+1)/xn,n=z0+area.d*j/zn,s=z0+area.d*(j+1)/zn;
            const vertices=ceiling?[[l,fy,n],[r,fy,n],[r,fy,s],[l,fy,s]]:[[l,fy,s],[r,fy,s],[r,fy,n],[l,fy,n]];
            const cell=cellAt((l+r)/2,(n+s)/2,ceiling?Math.round((fy-3.60)*100)/100:fy);
            quad(cell,mat,vertices,vertices.map(v=>[(v[0]-960)/f,v[2]/f]),ceiling ? topTint : vertices.map(v=>floorTint(v[0],v[2],fy,topTint)));
        }
    }
    function lights(plan,a){
        const longX=a.w>a.d, across=longX?a.d:a.w, length=longX?a.w:a.d;
        const rows=across>8.5?2:1, count=Math.max(1,Math.round(length/(a.kind==='room'?5.4:5.2)));
        for(let i=0;i<count;i++)for(let j=0;j<rows;j++){
            const along=((i+.5)/count-.5)*length,side=((j+.5)/rows-.5)*across;
            const x=a.x+(longX?along:side),z=a.z+(longX?side:along);
            if(a.openAbove) continue;
            const c=cellAt(x,z,plan.floor),y=plan.floor+plan.ceiling;
            const w=longX?1.44:.53,d=longX?.53:1.44;
            c.b.box(x,y-.048,z,w+.08,.084,d+.08,'#9da8a6');
            c.b.lamp(x,y-.099,z,w,.027,d,'#fff9df');
        }
    }
    function archWall(plan,wall){
        const dx=wall.x2-wall.x1,dz=wall.z2-wall.z1,len=Math.hypot(dx,dz);
        if(len<.02)return;
        const ux=dx/len,uz=dz/len,nx=-uz,nz=ux;
        const midX=(wall.x1+wall.x2)/2,midZ=(wall.z1+wall.z2)/2;
        const rail=wall.kind==='rail',top=plan.floor+wall.h;
        const count=Math.ceil(len/(rail?2.8:6.2));
        for(let i=0;i<count;i++){
            const ax=wall.x1+dx*i/count,az=wall.z1+dz*i/count,bx=wall.x1+dx*(i+1)/count,bz=wall.z1+dz*(i+1)/count;
            const x=(ax+bx)/2,z=(az+bz)/2,c=cellAt(x,z,plan.floor);
            if(rail){
                // Reveal the slab thickness around the open atrium and stairwells.
                if(plan.number>1)c.b.box(x,plan.floor-.118,z,Math.abs(bx-ax)+.16,.238,Math.abs(bz-az)+.16,'#a4a79a');
                c.b.beam(ax,top,az,bx,top,bz,.09,'#a77e5c',true);
                c.b.beam(ax,plan.floor+.46,az,bx,plan.floor+.46,bz,.042,'#9ba8a6',true);
                for(const t of [.01,.51])c.b.box(ax+(bx-ax)*t,plan.floor+wall.h/2,az+(bz-az)*t,.058,wall.h,.058,'#788989');
                continue;
            }
            const width=len/count, alongX=Math.abs(dx)>Math.abs(dz), wx=alongX?width+.01:.16,wz=alongX?.16:width+.01;
            c.b.box(x,(top+plan.floor)/2,z,wx,wall.h,wz,'#d2cfc2');
            for(const side of [-1,1]){
                const xn=nx*side,zn=nz*side,inside=areaAt(plan,x+xn*.34,z+zn*.34);
                if(!inside)continue;
                const wing=wings[inside.wing]??wings.central;
                const lx=x-xn*.001, lz=z-zn*.001;
                function face(y0,y1,tint){
                    const px=lx+xn*.086,pz=lz+zn*.086,tx=zn*width/2,tz=-xn*width/2;
                    quad(c,mats.plaster,[[px-tx,y0,pz-tz],[px+tx,y0,pz+tz],[px+tx,y1,pz+tz],[px-tx,y1,pz-tz]],
                        [[0,y0/1.75],[width/1.75,y0/1.75],[width/1.75,y1/1.75],[0,y1/1.75]],tint);
                }
                face(plan.floor+.10,plan.floor+1.05,inside.kind==='room'?'#dedfd0':wing.base);
                face(plan.floor+1.05,top,'#f2ecdc');
                const trim=(height,thick,ink)=>c.b.box(lx+xn*.095,plan.floor+height,lz+zn*.095,
                    alongX?width:.052,thick,alongX?.052:width,ink);
                trim(.073,.145,'#667273');trim(1.054,.051,inside.kind==='room'?'#b4b7a6':wing.accent);
                const boardWall=inside.kind==='room' && zn>.9 && Math.abs(z-inside.z+inside.d/2)<.18 &&
                    ['math','science','computer','studio','language'].includes(inside.type);
                const galleryWall=inside.kind==='room' && -xn*inside.side>.9 && Math.abs(z-inside.z)<width/2+1.1 &&
                    ['reading','library','gallery','greenhouse','auditorium','theatre','robotics'].includes(inside.type);
                if(wall.kind==='outer' && width>2.50 && !boardWall && !galleryWall){
                    const view=alongX?(nz*side>0?0:2):(nx*side>0?1:3),w=Math.min(4.6,width-1.00);
                    const variant=Math.abs(Math.floor((alongX?x:z)/4.95))%3;
                    const y=plan.floor+2.10,h=1.78, fx=x+xn*.122,fz=z+zn*.122;
                    imageCard(c,'winter-'+plan.number+'-'+view+'-'+variant,()=>panorama(plan.number,view,variant),fx,y,fz,xn,zn,w,h,320,110);
                    const line=(u,dy,ww,hh,dd,ink)=>c.b.box(x+zn*u+xn*.154,y+dy,z-xn*u+zn*.154,alongX?ww:dd,hh,alongX?dd:ww,ink);
                    for(const off of [-w/2,0,w/2])line(off,0,.075,h+.10,.098,'#e4e3d5');
                    line(0,h*.18,w,.053,.089,'#d1d7cf');
                    line(0,-h/2,w+.20,.087,.29,'#d9d4c3');line(0,h/2,w+.16,.094,.12,'#deded1');
                }
            }
        }
    }
    function doorway(plan,d){
        const room=plan.areas.find(a=>a.id===d.room),wing=wings[room?.wing]??wings.central;
        const alongX=d.axis==='x',ux=alongX?1:0,uz=alongX?0:1;
        const nx=alongX?0:1,nz=alongX?1:0, fy=plan.floor, h=2.53,w=d.width;
        const c=cellAt(d.x,d.z,fy),b=c.b;
        for(const side of [-1,1]){
            const u=side*(w/2-.045);
            b.box(d.x+u*ux,fy+h/2,d.z+u*uz,alongX?.083:.205,h,alongX?.205:.083,wing.ink);
        }
        b.box(d.x,fy+h,d.z,alongX?w:.21,.10,alongX?.21:w,wing.ink);
        b.box(d.x,fy+(h+plan.ceiling)/2,d.z,alongX?w:.162,plan.ceiling-h,alongX?.162:w,'#dedace');
        const roomSide=room && (nx*(room.x-d.x)+nz*(room.z-d.z))>0?1:-1;
        const direction=d.kind==='entry' ? (areaAt(plan,d.x+nx*.36,d.z+nz*.36)?1:-1) : -roomSide;
        const tx=nx*direction,tz=nz*direction;
        const title=d.kind==='entry'?'ШКОЛА № 1430':(d.name??room?.name);
        if(title)sign(c,title,d.kind==='entry'?'ВЫХОД НА КАНАЛЬНУЮ УЛИЦУ':wing.name,wing,
            d.x+tx*.109,fy+2.90,d.z+tz*.109,tx,tz,Math.min(2.95,w+.72),.54,d.kind==='entry');
        if(d.kind==='entry'){
            b.box(d.x,fy+1.20,d.z,alongX?w-.18:.10,2.41,alongX?.10:w-.18,'#759097');
            b.box(d.x,fy+1.22,d.z,alongX?.07:.14,2.42,alongX?.14:.07,'#4e6063');
        }
    }
    function overhead(plan,x,z,text,sub,wing,axis='x',w=2.96){
        const c=cellAt(x,z,plan.floor),b=c.b, alongX=axis==='x';
        const y=plan.floor+2.85,nx=alongX?0:1,nz=alongX?1:0;
        b.box(x,y,z,alongX?w:.08,.47,alongX?.08:w,'#515c5e');
        for(const side of [-1,1]){
            b.box(x+nz*side*w*.32,y+.35,z+nx*side*w*.32,.024,.47,.024,'#7c8785');
            sign(c,text,sub,wing,x+nx*.045*side,y,z+nz*.045*side,nx*side,nz*side,w-.04,.44,true);
        }
    }
    function boardContent(type){
        const el=canvas(384,120),g=el.getContext('2d');
        g.fillStyle='#315751';g.fillRect(0,0,384,120);
        g.lineWidth=1.7;g.strokeStyle='#dfdfb9';g.fillStyle='#eee8c6';
        const lines={
            math:['Площади фигур','S = ½ · a · h','a² + b² = c²'],
            science:['Наблюдение','Гипотеза → опыт → вывод','Запишите результат'],
            computer:['Алгоритмы','for i in range(5):','    print(i)'],
            studio:['Композиция','Ритм     Форма     Цвет','Эскиз проекта'],
            language:['Слово и смысл','Тема  •  образ  •  идея','Прочитайте отрывок']
        }[type];
        g.font='italic 21px serif';g.fillText(lines[0],18,28);
        g.font='italic 15px serif';g.fillText(lines[1],19,60);g.fillText(lines[2],19,89);
        g.strokeRect(270,30,73,58);g.beginPath();g.moveTo(270,88);g.lineTo(307,30);g.lineTo(343,88);g.stroke();
        g.strokeStyle='#e5c59c';g.beginPath();g.arc(310,64,18,0,Math.PI*2);g.stroke();return el;
    }
    function roomArt(plan,a) {
        const fy=plan.floor,z=a.z-a.d/2+.13,x=a.x,c=cellAt(x,z,fy);
        if(['math','science','studio','language','computer'].includes(a.type)){
            c.b.box(x,fy+1.68,z,3.60,1.25,.08,'#8f9a94');
            imageCard(c,'board-'+a.type,()=>boardContent(a.type),x,fy+1.68,z+.05,0,1,3.49,1.15,305,101);
            c.b.box(x,fy+1.065,z+.07,3.55,.048,.13,'#c2c5b8');
        }else if(['reading','library','gallery','greenhouse','auditorium','theatre','robotics'].includes(a.type)){
            const id={library:'water',gallery:'school',greenhouse:'botanical',robotics:'geometry'}[a.type]??'geometry';
            const insideX=a.x+a.side*(a.w/2-.12),ctx=cellAt(insideX,a.z,fy);
            imageCard(ctx,'exhibit-'+id,()=>exhibitionPrint(id),insideX,fy+1.73,a.z,-a.side,0,1.38,1.61,135,158);
        }
        if(a.type==='gym'){
            const width=a.w*.78,depth=a.d*.78,b=c.b;
            for(const side of [-1,1]){
                b.box(x+side*width/2,fy+.009,a.z,.067,.012,depth,'#e7e3c3');
                b.box(x,fy+.009,a.z+side*depth/2,width,.012,.067,'#e7e3c3');
            }
            b.box(x,fy+.009,a.z,width,.012,.064,'#e7e3c3');
            for(let i=0;i<24;i++){
                const t=i*Math.PI/12,next=(i+1)*Math.PI/12,r=1.60;
                b.beam(x+r*Math.cos(t),fy+.014,a.z+r*Math.sin(t),x+r*Math.cos(next),fy+.014,a.z+r*Math.sin(next),.046,'#e7e3c3',true);
            }
        }
    }
    function welcome(plan,a){
        const z=a.z-a.d/2+.128,fy=plan.floor,x=a.x,wing=wings.central;
        const c=cellAt(x-6.65,z,fy), b=c.b;
        b.box(x-6.85,fy+1.77,z,7.82,3.14,.082,'#ad9071');
        for(let i=0;i<26;i++)
            b.box(x-10.58+i*.294,fy+1.77,z+.055,.094,3.14,.035,'#ccb391');
        imageCard(c,'identity',schoolMark,x-6.86,fy+1.95,z+.084,0,1,4.21,1.40,330,110);
        const right=cellAt(x+6.8,z,fy);
        for(const [i,id] of ['school','geometry','botanical'].entries()){
            const px=x+4.16+i*2.46;
            right.b.box(px,fy+1.77,z,1.60,1.84,.067,'#a98d6e');
            imageCard(right,'exhibit-'+id,()=>exhibitionPrint(id),px,fy+1.77,z+.037,0,1,1.45,1.69,135,158);
        }
        overhead(plan,x,a.z-5.7,'ГАЛЕРЕИ И УЧЕБНЫЕ КОРПУСА','ПРЯМО  ↑',wing,'x',3.53);
    }
    function fitOut(plan,a){
        const mat=a.type==='gym'||a.type==='auditorium'||a.type==='music'?mats.wood:a.kind==='room'?mats.lino:mats.tile;
        const tint=a.kind==='room'?'#eee9dc':a.wing==='central'?'#e8e4d7':a.wing==='west'?'#dce7d9':'#ece0d5';
        horizontal(a,plan.floor,mat,false,tint);
        if(!a.openAbove)horizontal(a,plan.floor+plan.ceiling,mats.ceiling,true,'#f6f3e7');
        lights(plan,a);
        if(a.kind==='room') roomArt(plan,a);
        if(a.id==='central-start'&&plan.number===1)welcome(plan,a);
        const wing=wings[a.wing]??wings.central, fy=plan.floor;
        if(a.kind==='corridor'||a.kind==='bridge'){
            const alongX=a.kind==='bridge', length=alongX?a.w:a.d, span=alongX?a.d:a.w;
            const count=Math.ceil(length/6);
            for(const side of [-1,1])for(let i=0;i<count;i++){
                const across=side*(span*.5-.32),along=((i+.5)/count-.5)*length;
                const x=a.x+(alongX?along:across),z=a.z+(alongX?across:along),c=cellAt(x,z,fy);
                c.b.box(x,fy+.007,z,alongX?length/count:.086,.009,alongX?.086:length/count,wing.accent);
            }
        }
        if(a.kind==='bridge'){
            overhead(plan,a.x,a.z,wing.name.toUpperCase(),'ГАЛЕРЕЯ  ·  ЭТАЖ '+plan.number,wing,'z',3.07);
        }
        if(a.kind==='landing'){
            // Wall-mounted direction signs, outside the open staircase and its top landing.
            const side=a.x<1000?-1:1,xx=a.x+side*(a.w/2-.12);
            const c=cellAt(xx,a.z,fy);
            sign(c,'ЭТАЖ '+plan.number,'ЛЕСТНИЦА  ·  '+wing.name.toUpperCase(),wing,xx,fy+1.65,a.z,-side,0,1.90,.67,true);
        }
    }
    function staircase(s){
        const base=campus.heights[s.from-1],top=campus.heights[s.to-1],dx=s.x2-s.x1,dz=s.z2-s.z1,len=Math.hypot(dx,dz);
        const ux=dx/len,uz=dz/len,count=24,step=(top-base)/count,yaw=Math.atan2(dx,dz);
        // No floor or ceiling crosses either flight, including the midpoint between storeys.
        const cell=cellAt((s.x1+s.x2)/2,(s.z1+s.z2)/2,base);
        cell.maxY=top+1.3;cell.box.max.y=cell.maxY; const b=cell.b;
        for(let i=0;i<count;i++){
            const t=(i+.5)/count,x=s.x1+dx*t,z=s.z1+dz*t,y=base+(i+1)*step;
            b.box(x,y-step/2,z,s.width,step,len/count+.006,'#b6b4a9',yaw);
            b.box(x-ux*.13,y+.003,z-uz*.13,s.width-.06,.013,.043,i===0||i===count-1?'#ccae75':'#87928d',yaw);
        }
        for(const side of [-1,1]){
            const ox=uz*side*(s.width/2-.035),oz=-ux*side*(s.width/2-.035);
            b.beam(s.x1+ox,base+.98,s.z1+oz,s.x2+ox,top+.98,s.z2+oz,.084,'#b69472',true);
            b.beam(s.x1+ox,base+.53,s.z1+oz,s.x2+ox,top+.53,s.z2+oz,.038,'#9aa4a1',true);
            b.beam(s.x1+ox,base-.06,s.z1+oz,s.x2+ox,top-.06,s.z2+oz,.18,'#888f89',true);
            for(let i=0;i<=8;i++){
                const t=i/8;
                b.box(s.x1+ox+dx*t,base+(top-base)*t+.46,s.z1+oz+dz*t,.053,.96,.053,'#83928f');
            }
        }
    }
    mats.ceiling=tileMaterial('plaster',true);
    for(const plan of plans){
        for(const area of plan.areas)fitOut(plan,area);
        for(const wall of plan.walls)archWall(plan,wall);
        for(const door of plan.doors)doorway(plan,door);
        const contents=new Map();
        for(const f of plan.furniture){
            const id=f.room??areaAt(plan,f.x,f.z)?.id;
            if(!contents.has(id))contents.set(id,[]);
            contents.get(id).push(f);
        }
        for(const [id,items] of contents){
            const area=plan.areas.find(a=>a.id===id);
            if(!area)continue;
            const group=new T.Group();group.name=area.name+' · обстановка';group.userData.regionalCell=true;group.visible=false;root.add(group);
            const box=new T.Box3(new T.Vector3(area.x-area.w/2-.25,plan.floor,area.z-area.d/2-.25),new T.Vector3(area.x+area.w/2+.25,plan.floor+plan.ceiling,area.z+area.d/2+.25));
            roomCells.push({box,group,area,items,plan,doors:plan.doors.filter(d=>d.room===id),ready:false});
        }
    }
    for(const s of campus.stairs)staircase(s);
    for(const s of [campus.skylight,...campus.shafts]){
        const at=campus.heights[2],top=at+plans[2].ceiling,c=cellAt(s.x,s.z,at);
        c.b.box(s.x,top+.145,s.z,s.w+.14,.22,s.d+.14,'#a9b6b2');
        c.b.lamp(s.x,top+.022,s.z,s.w-.10,.045,s.d-.10,'#dce9e5');
        for(let i=0;i<=4;i++)c.b.box(s.x-s.w/2+i*s.w/4,top-.06,s.z,.086,.14,s.d,'#839894');
        for(let j=0;j<=3;j++)c.b.box(s.x,top-.06,s.z-s.d/2+j*s.d/3,s.w,.14,.082,'#839894');
        if(s!==campus.skylight)cellAt(s.x,s.z,0).b.box(s.x,-.17,s.z,s.w,.16,s.d,'#969b91');
    }
    for(const cell of cells.values()){
        cell.b.flush();
        for(const [mat,f] of cell.faces){
            const geo=new T.BufferGeometry();
            geo.setAttribute('position',new T.Float32BufferAttribute(f.pos,3));
            geo.setAttribute('uv',new T.Float32BufferAttribute(f.uv,2));
            geo.setAttribute('color',new T.Float32BufferAttribute(f.rgb,3));geo.setIndex(f.idx);
            geo.computeBoundingSphere();const mesh=new T.Mesh(geo,mat);cell.group.add(mesh);
        }
        cell.faces=null;cell.b=null;
    }
    // One low-resolution contact texture serves every floor and every furniture mesh.
    const contact=canvas(48,48),ink=contact.getContext('2d'),gradient=ink.createRadialGradient(24,24,3,24,24,24);
    gradient.addColorStop(0,'rgba(44,39,35,.26)');gradient.addColorStop(.53,'rgba(44,39,35,.16)');gradient.addColorStop(1,'rgba(44,39,35,0)');
    ink.fillStyle=gradient;ink.fillRect(0,0,48,48);
    const shadowMap=new T.CanvasTexture(contact);shadowMap.colorSpace=T.SRGBColorSpace;
    const shadowMat=new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false});
    function addContact(cell){
        const pos=[],uv=[],indices=[],y=cell.plan.floor+.018;
        for(const item of cell.items){
            const w=item.w*.62,d=item.d*.62,i=pos.length/3;
            pos.push(item.x-w,y,item.z+d,item.x+w,y,item.z+d,item.x+w,y,item.z-d,item.x-w,y,item.z-d);
            uv.push(0,0,1,0,1,1,0,1);indices.push(i,i+1,i+2,i,i+2,i+3);
        }
        const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);
        const m=new T.Mesh(geo,shadowMat);m.renderOrder=1;cell.group.add(m);
    }
    const openings=[campus.skylight,...campus.shafts];
    function betweenFloors(box,cellFloor,eye,level){
        if(Math.abs(cellFloor-level)<.01)return true;
        const above=cellFloor>level, plane=above?level+3.60:level;
        if((above&&eye.y>=plane-.16)||(!above&&eye.y<=plane+.16))return true;
        // Project this cell onto the intervening slab. Only the atrium and staircase
        // openings can reveal the storey on the other side of that slab.
        const dy=plane-eye.y;
        const far=above?box.max.y:box.min.y,near=above?box.min.y:box.max.y;
        if((above&&far<=plane)||(!above&&far>=plane))return true;
        const t0=Math.max(0,Math.min(1,dy/(far-eye.y)));
        const t1=(above?near<=plane:near>=plane)?1:Math.max(0,Math.min(1,dy/(near-eye.y)));
        const minX=eye.x+Math.min((box.min.x-eye.x)*t0,(box.min.x-eye.x)*t1);
        const maxX=eye.x+Math.max((box.max.x-eye.x)*t0,(box.max.x-eye.x)*t1);
        const minZ=eye.z+Math.min((box.min.z-eye.z)*t0,(box.min.z-eye.z)*t1);
        const maxZ=eye.z+Math.max((box.max.z-eye.z)*t0,(box.max.z-eye.z)*t1);
        return openings.some(o=>maxX>o.x-o.w/2-.55&&minX<o.x+o.w/2+.55&&maxZ>o.z-o.d/2-.55&&minZ<o.z+o.d/2+.55);
    }
    const projection=new T.Matrix4(),frustum=new T.Frustum(),eye=new T.Vector3(),sphere=new T.Sphere(new T.Vector3(),2.0);
    function doorVisible(room,door){
        sphere.center.set(door.x,room.plan.floor+1.44,door.z);
        if(!frustum.intersectsSphere(sphere))return false;
        if(eye.y<room.plan.floor || eye.y>room.plan.floor+room.plan.ceiling)return true;
        // Test three points across the opening so oblique views retain furniture.
        const canSee = offset => {
            const x=door.x+(door.axis==='x'?offset:0),z=door.z+(door.axis==='z'?offset:0);
            const dx=x-eye.x,dz=z-eye.z;
            for(const w of room.plan.walls){
                if(w.kind==='rail')continue;
                const acrossX=Math.abs(w.x1-w.x2)<.01;
                const delta=acrossX?dx:dz;if(Math.abs(delta)<.00001)continue;
                const t=(acrossX?w.x1-eye.x:w.z1-eye.z)/delta;
                if(t<.002||t>.995)continue;
                const along=acrossX?eye.z+t*dz:eye.x+t*dx, a=acrossX?w.z1:w.x1, b=acrossX?w.z2:w.x2;
                if(along>Math.min(a,b)+.05 && along<Math.max(a,b)-.05)return false;
            }
            return true;
        };
        return canSee(0)||canSee(-door.width*.44)||canSee(door.width*.44);
    }
    return {root, update(player,camera){
        if(!root.visible)return;
        if(camera){
            eye.setFromMatrixPosition(camera.matrixWorld);projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
        } else eye.set(player.x,player.y+1.5,player.z);
        const level=campus.heights[Math.max(0,Math.min(2,Math.floor(eye.y/3.84)))];
        for(const c of cells.values()){
            const near=c.box.distanceToPoint(eye);
            c.group.visible=near<115 && betweenFloors(c.box,c.floor,eye,level) && (!camera||near<2||frustum.intersectsBox(c.box));
        }
        let revision=false;
        for(const cell of roomCells){
            const d=cell.box.distanceToPoint(eye);
            let visible=d<54 && betweenFloors(cell.box,cell.plan.floor,eye,level) && (!camera||d<2||frustum.intersectsBox(cell.box));
            if(visible&&cell.area.kind==='room' && cell.doors.length && camera && d>3.1){
                visible=cell.doors.some(door=>doorVisible(cell,door));
            }
            if(visible&&!cell.ready){
                const batch=new Batches(cell.group);
                addFurniture(cell.group,batch,cell.items,cell.plan.floor);
                batch.flush();addContact(cell);cell.ready=true;revision=true;
            }
            cell.group.visible=visible;
        }
        if(revision)scene.userData.campusRevision=(scene.userData.campusRevision??0)+1;
    }};
}
exports.createCampus=createCampus;

// 96 px colour tiles resampled from the Godot assets/materials directory.
// Poly Haven linoleum, white plaster and plywood (CC0); original school floor detail (CC0).
const campusSurfaces={"lino":{"colors":[195,190,184,196,191,185,196,191,184,197,191,185,197,192,185,197,192,185,197,193,185,198,193,186,198,193,186,198,193,186,199,194,187,199,194,187,199,194,187,199,194,187,200,195,187,200,195,188],"data":"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"},"wood":{"colors":[154,122,88,155,124,90,156,125,91,156,126,93,157,127,93,158,128,95,159,129,96,160,130,97,160,131,97,161,132,99,162,133,99,163,134,100,164,135,101,164,136,103,165,137,104,166,138,105],"data":"25iKqWaIqu//3Yirh4mKzuyoery9/tutyplmaKqZyqmpdTMQE1aJiJy7raqWIDR8ZCA0VIqZq87tyovNzcqpeJrLqJmrx3dpzLvO7//9/t+mVnd2Q0MhADM3iWaYd4V1lDVWhnZneJmHiJqpiZlzOMuWmqqXiKu8vsqa3szP6++5iHvN2qhEIEUjI0VkICN6ECVVVUNGaZiXRFeodomFRplVrLiamYiKl2aIaHmXebvN3cu+y7lXVImYeEAAAAACEQAjIQABABAEMBN5d2iImIqJyHiKq93KmJzLmavsre/5Vnhpzuu8qd39m6ZlQwAAuWRENEIQAAAAAAASMxQ1i//KY1h3aHiImpvKmInN3d7aiaqZq6zumpitzJiXVoic3KmYiHdmY0VlMQASUQAAWctmZDZ0RDV4dld4rKvO/v//qHiZeIh4aIeb3b3/2paKp3mZm5h3q8mpZRASIxAAABMxJEd1RDiKlSQkZnrLqarf/Kq8yqmJiarbzdzP/+qa3KvKp3ZpuquoiFRVaXZFQTVSN5m8qoiJq4aKmJp3VHZ3h3iXeIequ6q7mrvM7bm8ms7Lq5a/7KqIhnibundlZUmYeJmqqomYmFRneZuYiFZ3hmmYibmYq8uavN2Zh5Znee26mnV83tu73avLqnhmZ6rMmaqbupqoh2RnZYjcaL2q2qu5doZVVVaaeLqtloZGh5mZh5qZqYq7zcuoh2mJvLuqmJmqmJh3mYh4hVWKq7upya2oU3dCMneHjN293Kd5iKzKu8pURCQ1V2vbmYmKqYdCNnd4l2dmqYh4eJqXiZeMqbqqqpiYiKu5qZuJq7eKiph5mZumeHZDNTiom7ze/8pzRWd2ZHZUREZnWKmJmGeJiIqbqru6l5u4epeIaWNIVWdmV5mGqHmUR2ZkVmRHmnaJhmiIhlZTMxNDRUVnZ3d5qu/du6rMy826zcq5iFAjepd1JENnmHaIeHiZh4dZuWZmdmqGhlVFZlMyIzQzRlMTibqZd2erve7MvM7Ny4Nmre3YRnU2iHZUVXiGeYdpqYZWZGiHmIhlZjIhEjNCM0RjRVd3eJiJvbiqrO6HqIesvJird0EDZWZWZniHiGmZiGZnVWZmh1RWVUM0JTAxMgIlU1iIdlRXnKiszL/7i8iqrcvO2odkmplmZ2VURXmHZ1aJiJmImHVGeHVEVkIyIiRFZHd4dEVmaJeJmr3bm8qb3rmXrcuYZmhmZ1ZEd2VVM0Zniay7u6iamYhmZVRVMzZlRVeIdlZ2ZXZnZWiIiIqd3+/Id5eZeKdmZFdoqoh1JFWJmZeJeoaIioaHiZiHiXiqmIZUM0NCMiNmVXd1M1d6ebu4d3ZVd2VTWHaHV4eIZ3eIh3VoiaiHiL36mqzMyYmZlnZmZlZliIZohmaIZ3ZGh3eZiIZWiHh3eKmpioiauYi6iL3cuquombzcunirqXioYiNEhomJiHiHeGeId4VZdmeJh2ZGeImYvf/au7uauHrIvbuneLqs3suomomYiZi6p1ZGiGiZmXm5qrp1VnhXiHiDRTRYiYebzf/93v/93ImXvJd5l5nOzbvLqau7mauqqqmc3sq5h2mZiYmXZ2Vpu7l4ioh4vu7Kmr3Mupupqom8mImIhYqt/qmYvMh3aHm8yYl5mrq7uFeKmHiHiWaJh3h0NmWbzd3ZVneIiFVmiIi8qpmaqqdGeIpmiHd1R3iqrNupiIecqYZpqneZrKqqdUASI3WZqoeIZUWWeLqXaImpiHiKmIh2dmeKmXeXRmV5zLqrqpm7uYq6mYmadViaaXRFZ4iHaGZ3ZFZmqYhoeKq8zNqqmap0VlVVV5iImYi7zKiZmoiamHeIiaqYlohWVWVBFFeHermZd3eYdTM2d2aKqIh5d5dUM1dlZ2d4mHeZiqp2d0ZFaHdVZolkZ2U0Q1VDRURCJWZlVFeJl2hVNIialkWKiZdmZoiHeJqYdUipu8y6q7qId3d1Z3dVRDISV3dEVWVENDNENFV2iHdXd4qptUepmZiJqtyqyqiZhnm82ompd5iYZXmqq5dmVWQ1WKvKh3d1UxIwAiRohmZDSHd2vJzdubqXWaq7uZmKmZeZd5vKiHV4d1Z3mYiYVWeIN2ZmUyRBNDVCIAFWVFRUR6usuqzd3dymMliHhTWFRlRWhWRoZWVniHhTdWiIdUaGR2ZWZ2dnq4hjZBA1VEVCFFacuJq6d3d3eYiEQiRkVDElVmVodXZ4VENEVVVWdDNWebp4iGiIq93KplV3eIZHaKmYd5q6hpmId3ZmeoeYeGZ4RVUUh1U0VHdplmJHU0RneahVeJl1U3mYiamrqIdoh3hllhNnZ5ZkEQE0eGRndmeJioaHdlV3eZZ5upVWdqeIeKl4qYh0VEZlM0VmdVaKqpiZmJiGYzMi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"},"tile":{"colors":[198,198,198,200,200,200,202,202,202,204,204,204,206,206,206,209,209,209,211,211,211,213,213,213,215,215,215,217,217,217,220,220,220,222,222,222,224,224,224,226,226,226,228,228,228,231,231,231],"data":"2Ht3VnRId/h3YwAm/WhneId3e4a7aKd5u3fNd4cklod3iIhEh4h2d2+Wimd3jAiJhHdXlnMmmNpohXBmV2+3ZUZmeneFuYmniHd7h1nGl4h3dG+oaHZ3d4qWFZiHx3+ndaZndnmHlwyOmMOIZWlnyWmFaXeXp2iXd5vrNQe5dnenZbyHhnp2aVR1aZQnlHh4eadpqnd3yCZ2Z3eXdpUG6GaAHPibd3enhoqYnXZnnnVoI4Z5uHiHSFZ1h3ZokUanZ6ZIdkmIi9p5dHmnmpl3hXh2V7h3h7GZiHeIhXRnq3d3WXZHeWmZd4VoSXcvp3anZ3ZFZ3l3fNaGYnlneax5dnd3aEUDg4hpd4V2ZrdWaJdRd4doQ0yHKVSXWXZ4dniGdnaHeXdHZ2yWmJmnmGRZiImXlSaod5p1d0h3mjJ2N4lgmodfp4/XmXtVyCCXd3gAR3c1mXYnNHial4iHeWcJmHd3dmXpdmh2bch3h0eWNxd3y3aHh2h3iniagzZ3eWZgV2ZFl3eoUUKFebh4n3av1VhnZTWqkox3mteHZ3h3dcd4R3qmd6iDKZmseIl4aoSYeXmXqIeHisl3WJlb4GqNtTand22IaH6Hl4lneGd3eYeYDpmaiK6XWHiKeFd4ZGV0dbqHhwZ2Zzd1l3iYiHiZjlmI1+h3SVN4iXSei0d3eYhneXZtdCgRT8YpeZeZeZlzcbxHZYZ4czd1d5aHZ3d3mL2ryHdnd2mJV1J8d3l4ZnhC+HYYphcIp2l2d3d3eHm3ppt3dbprhzqGV5poZ5ZZ+CSpZYeHc0mJd3SYd3h2l2f4dHeHgVZH6niQZ5d3dkitl/lnm3gZl0hnymmVeXRqiAWHhqdFSVb6djb4h3aEl3iuwFiChXd4aHSZWHZ4m3d7d4BFqmYjm3eXmKeHeVOIbNqHd3dmdCaIhzOHQXZDd5lYp2xxnneXZoV5ZlWHiHRXd3VX2VOXiAJrZ3uneohWaLd3hnesZ7hWnFOahWVoeYkkyHeId3iJcnd4i0KHd3u3dzaHd1RzZ2yqZ3iHmnZnlHd3q4OLaJZXeT6IlldwWJh3hld2d1d5pEd5n5REdmmHnCaGE6l3d2xYR1l3eId3aXd2iUF4d0WInImakGRYl6YUh5Z4eVN4k0eYeIZFcng2aZeZibZzZ1dWFmh4d2d3Z3l2dnh3d4QIiGiHZZRHbYdrhmd22zOGdpmZdmZWZalFenZ3l3aGW5WldpOrhpVnZ5dndmSIh3knmF2ZZnNXund3eJd66WZcl+d4f3GWqft3emmGd3ToeVd3ffp4RHuXh4eXiZaLl4t3m5eb95x3aGd3rNd6qIVvRmecu7iGmYjLQ2eIh63od5pyWqJVZ4+oipZmiHuAZ1aIebeEiJm5Z6h3qLp2d32ZZpaNh6d2ZJjEl3dgd+eGd7iCRXjHN6h3Znd3amhViGlTd4dziJiJjYd4erdKe6uod5hc55l3h4Qk2ndFl4d3h4r4hnfJRpmXpjloeHaK+Rp3iXd3vIgTq3RYfaZXaIe6h4uXV2Z0SGVUmJVGiHd5hnqnZ5eHaXiJiGlmZ3aHR6qqmANndAm8dsZuiIdzdoiYd3eXV3mFh+iMd9dFR3lWknf/areIV3dcmph3ZUeTZlhjdkN79mePo1qKl3eYn7d1d0eYZ3dZd7d4l5eHeXgVuXipa5d4UGd5m5eXeAScmGc0l3yedFlUZ2V3d2eGO2d2a6hq2GYFd5eXiICne3aXZ3R3eFdpm5eWh0e3ykdwnXeZh3x2Qoymp3d3eIZka5d3ePd3mFhnV5Q4N3iHd3d3eJZ3h8UYbJd3epmGeHlAiGVZKXqVN5V4ynioV+dVfoiWN3bKZOp2Nnxkl4hnhVeJQ3eHUKeHV7d3Z3d8uMtEqJg0GHRwCphXiniWJY4weHmzB5uMkjhGiGidmnZpyYe6h2dWm1dnZ4Z3V3ruu4d2gWeJhRUEmXd1eHaJt3d4h5mHSZmaVQZmeFZ6nWdrh0Z3eFdFyHaXh3h3lXracGeJe5eJ6lZnipeHd3d4Zmd3h3h3r9WJVGeVdodHiWd/pXdq62V5qHi4doZ5d3iHd5d5iXdnqIhpdBd1Z4d3Jncpd1R1mHcysHeHd3lkeIVbmXeXi1iZaHd3RIh02peHVnaHd2aHd0l3ZFiTN3d3d3ZHevpmiWeHBno2d5mYlUWEiXdlmZidc4p3d3pH6JqXdpl4qJhneWenef10RXV3ZU3Yerh3d5dOd2Y1d5h7d2d1mHeYdoiatnl4d4h4eXl1d4VYx5noeneXvJhoZoeMR3iXl5eUeJqbqXcHOrZ5eZ9ZlIbGqHmHtXuGN3eZN8Zbd4iWd4h3iXh3dmeHmFSLmIeXaXY4d4ZVZXdnaslneIh6eXLHhpuJgGhnZmdpiJFqdpeGdnjH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"},"plaster":{"colors":[215,215,215,216,216,216,217,217,217,219,219,219,220,220,220,221,221,221,223,223,223,224,224,224,225,225,225,227,227,227,228,228,228,229,229,229,231,231,231,232,232,232,233,233,233,235,235,235],"data":"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qqmZqrmImYdVd3dniHeIeamGeIdnd3ZmZ3hnZnZlVlRSBEIAEzZ4mqrJvMuZuneamamYqZmKmHdnZniIh3doiZiZh3ZneGZnh3eIZndlVVZEIBABNFZomLuqzsu6mniqmZmph4mZmZh3ZleIdnd4hmeIiYh2dld3dniId3hlZVQ0RCIxJFeJiczNvcu6qqqqqZqqh5qrqpmHdlV4eZeId4mJiIiFdURoh3l4hndmZ1RGZDITRld5e+7d3Mu6uru7upu6iJu6q5mZh3ZniYeFaIiIl3Z4YzNXiYmIeHdUVmZUUyQjNEeJms7czLuqvMurmaqZmqu7y7qal4d2iZmImJmImHZphWZXqZqYl3h1ZFVERUQyM0V4rM7Zqbu6vMuriKmImpisqaqZqXeIh4eId3iHiHaJiIaJu7ypmZdld2dVVUVSAFN4q8uYmJq7u8qqh5mZmrmbmrq7mHhmZWeIiJmIh3h3mYV4m8yoqpeIeJh3ZlQhAmR4m7uZqpq7q7upmIqpqpqqu7qYh3dmREd3eJmpmHh3hmaJrMypqYiHibiJl1MlE3Z4iqq7qZqpqqqXh5uYm6qqu7mHh3dVEmZVaImZiYeId2eJzt26qoeHiquqq4ZpmnaImby7uqupmHiHeJqYmqvMvKiZiYZlRDZliHiYeJmZmGeb7t3LuqmXiKy73Lu+2oiYiauru7qZhkVoiJmqq7q6y2iqmIhmZkRWmHh3Z4qHiJmr/t3My9qYic3N7s2pzJqrupvMy6iIh2VneZqZu8zMyry6mIhWU0JGiIh4iImYiJnO7+3d3cuorM7+793K3by7uru9y7iZd3ZleZqIisvcy7u6mHiIQkRHmpmZiJmpmIrO/v3s3cuZzu3Nzc7u7s3M283dy7uph3h2iZhXnLzLq6q7qImYhmZ2iYp4eJiHiJv/3e3d78qs3u7Mvc3v///+zd3Lu7qqh4d3mpllequ7vNzMu5qZmIl3qap5ipeXq73+3d3t7tvM7t/s3e3v///t3d3czLq6mJh4ipqFSJiay8zcuou6qpqau7qaq6iazN7v7t3e3cvM3d7eze3t7t283My7y4rLqYdneJiFAjeazdy7y6q6u6uq3My7u6iby+/+/t3u3cqrze7/3dzM3LzNzKqLy6qqmYeHiJcjQ1Wazczc25m6vLzM7u3MqrvN3v///v7tzMzM3O/u7cy6uqvMy8u7vMqpiImXiXdneHSMqqzJq7u7rMzL3u3dzMze7//////93MzN3N7/7My7mZq7qbqJnMuql4mHh3qohmZomM27mr3Kq7vd3d7c3czd3///7u/tzMze3M7uzLm5iKqrqs26zbupmImJmaiburuJubyqqtvbu7zLms3czbvL3////+3dzNzO7e/dqqioiImpmsuYuaupmYd3iZirze7Nu8qZqsu6yru6mqm7u6nL3/7+/u3dzN3e3e7cq7mZd5qrmqqYuayqh2VWmbq87f3/y7qrvLvKu7u7qqqquHir3u7+3u3e3d3u3f/MzLqaqbq6eJuHqqmJh1NWeJu77f7u27vN+rqrvLzaq7qqqpmr7N3u3vzt7dve/v3c3Lqau7u6qtuZqqiJhiJHdpvc3v/t3Mzcy9u7vNzcy7qrqsy73e3NvM3tzaze/u3u7My7q7urvNq8mZibqGY0Z6vO7u/+3szNzMzKvd3c28u6vMzM3cy7u8vN3Lzv/c3t/dy6u5qZm6pqmHm8l3ZTV7ve7+3dvNysy8zLzd3NzdzMzd7e3cyay7y83O7v7u7t7+uqu6mIq7qIqYqql2NCN6zu/+3e3MvLvO3LzdvNvdzMzd7d3c28vMy7vO////7t39u8u5qoiaiHh3m6qXNEV7ze/t7f3tzM3e3M3d3MvNzMzLzuzIy8yqvczf//////3N3Ly7qqp4iIisu8uohoiK3u7+/u3tzNzOzO/d3Lq7zdy77tyqq82azN3v/////v6+y7u7vMqYmoq7vMypiJmM3u7/7///7MzPzf/szMury8y73cuqqL7N7e3v/////f7cy7maq7uqupyauszKuZm93u7/7v//3c297/7s67zLvLq83Nu8u+3c3v7/////7d3bqqmJqru9uriJu7y7uru97+/t7v/+u+/d79zN3Ku5rbu7zcy7qt3czsz+///by7u6mpl4mqzLzKurzMzKy8zO///e/+7szf7u7tzd26mqrMyr3buomsrczM7v7uy5q7qZmZmYmaqqvJupzNzLvb3N///N7bvLvd7e/szNzLqqq8qs27upisuqy73dzcqomIiIeYaZiamsmpeKvM3KrM3t7///7d27y8vO2L7czMupu8y8yZuqqru7zL3czKmoZ2Z3d4iJmaqaqaiYq73Lu8zLzv//7Nzduqe8273cu8qau6u7qJqpq6q8vMzLqZuoVlZ1dld4mZh4mqhoeZy7urzLzN7//J3dzKu7zbvMy7m8u7vMy6qomZqsubzcu4mYh1VVRjVniZmHenV1Z5vLzLu7u93u3MzKmsmq3MrMy7y8zKq9uch4ibq7qt7cu5mZeGVWVUZnmpmYmEVmeJq7vM26u8zcrNu6q9ub27rLrMu8y6q7uquoiZnLzM7Mu6q6hmRFVWd2ipiIlmVViKu7zc3czMu83NurzLqLmsy5i8ybzbnMeJm6qY3e3c3Mu5m7pXZUVmh3Z4h3l2ZVWMu7ze3MzcvLzczYmqmLq8u4q6vMzazNhnnJqKvu3dy6q4mqlYeHRWZWRXeJh4hoeavM3dzs3c3Ly8zIeah4uqmqu8y8zL3smom6qKzeyrq6mZl3h3dVZmVHVFaJhnZ4irvM7cvaze3dyrqrrLmZqoi6u728vL3Mu6eZmty7iYeHZWYlVXhkZmZoU1eJiGV4iazd3d3Lzdzfy4jLzbrJmYnczNzNvMyaqoeYmbrKiYhzE1ZCNVZTVURVQ1Zod0Rnh5zv7c26u87sqpiazKaah4rMzN3uurqpq5l3ebqqqqd1REVmVVZDNGZSNERkZjM2d5vf7czMy6vcunaqupaJp4q7y+7NzLzLy7uXiKq7u6eIhFV4dVVFNochNFRDRUMlZ6vd3N283L3KmYqIiIloeauMyc3MzN7e28p4maqqu7ial1dnZlZlVWUxE1VENTAkZpq7u7u7zMzcmauriIeIrLqqmbzIis//7cl4mJiry6qqhomXd2Z1ZWUyVmVVQzIjVpqqiImqqsqZesvKiZmKu7upm8qpm7z9urqImqqqzcupmZmHeId2VTI1VVVVRENEWJqZh3ebmrqpibq7urusmrq5rJrLu6zMuc2Ym7zc7dy7qZl4mXd2VCJGVURWVURFaKq6l3iJmbuLqamszMm5iamrqrytua67u7vKrb3c29q6upiIiIaGQjI0ZkRWZmZXiKu6mHiIrNvdyKu828yrqs3Ku6rMu7/u3Mq+3N7d3ampqoeIiIZ2UkVlZDVnmId3eKqqqYeImsy82prLq7yqmsyqmom5zd7e3N3v/N3tu6mYmpdnhlVlNDR1VERoiIiHiaq7mXh4qs2puYmrvLmomauniKirveze787szszNlod4mYdSU2ZVU2ZURVVXiYiZmqqpmHh4ib7azLmrqamoiImKqJisvc3s3t397/2rl5dmeGVTRFRUQlMzNFRod3d6maqod4dnec3u3tqqiIq4aGh6toqpvJzt7sv//vuquomVZmVVZENEEjIyIjV4iHiKmZmpiXeHeLzty5rMqImFdFQ2iIioubrO3M3N/c"}};
