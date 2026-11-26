"use strict";
// An original campus for Kontur-77. All three storeys occupy the same world coordinates.
const heights = [0, 3.84, 7.68], ceiling = 3.60, hallHalf = 2.35, half = 12;
const wings = [
    {id:'west', name:'Западный корпус', x:960, north:-31, south:35},
    {id:'central', name:'Центральный корпус', x:1000, north:-35, south:37},
    {id:'east', name:'Восточный корпус', x:1040, north:-37, south:31}
];
const entry = {x:1000,z:35.2,yaw:0};
const skylight = {x:1000,z:0,w:8,d:6,y:11.28};
const shell = wings.map(wing => ({
    wing:wing.id, name:wing.name, kind:'wing',x:wing.x,z:(wing.north+wing.south)/2,w:2*half,d:wing.south-wing.north
}));
for (const cx of [980, 1020]) {
    for (const z of [-10.5, 10.5]) {
        shell.push({wing:cx<1000?'west':'east', kind:'bridge', name:z<0?'Северная галерея':'Южная галерея', x:cx,z,w:16,d:7});
    }
}
const shafts = [], stairs = [];
for (const [cx, side, key] of [[960,-1,'west'], [1040,1,'east']]) {
    const x = cx + side * (half + hallHalf) / 2, dir = side < 0 ? 1 : -1;
    shafts.push({id:key,x,z:0,w:half-hallHalf,d:9});
    for (let from=1; from<=2; from++) {
        const xMid = x + (from===1?-1:1)*1.83, z1 = (from===1?-4.5:4.5)*dir;
        stairs.push({id:key+'-'+from, wing:key, x1:xMid,z1,x2:xMid,z2:-z1,width:2.60,from,to:from+1});
    }
}
const programs = {
    gym:['Спортивный зал','gym'], stage:['Актовый зал','auditorium'], green:['Оранжерея','greenhouse'],
    food:['Столовая','canteen'], cafe:['Школьное кафе','canteen'], cloak:['Гардероб','lockers'],
    gallery:['Выставочный зал','gallery'], models:['Архитектурные макеты','gallery'], podium:['Сцена и речь','theatre'],
    lounge:['Рекреация','lounge'], meet:['Школьный клуб','lounge'], read:['Читальный зал','reading'],
    lib:['Библиотека','library'], media:['Медиатека','library'], craft:['Дизайн и технология','studio'],
    make:['Макетная мастерская','studio'], art:['Изостудия','studio'], clay:['Керамика','studio'],
    print:['Печатная графика','studio'], textile:['Текстиль','studio'], music:['Музыкальный класс','music'],
    choir:['Хоровая студия','music'], language:['Русский язык','language'], lit:['Литература','language'],
    foreign:['Иностранные языки','language'], debate:['Клуб дебатов','language'], math:['Математика','math'],
    geom:['Геометрия','math'], logic:['Логика','math'], project:['Проектный класс','studio'],
    nature:['Естествознание','science'], bio:['Биология','science'], eco:['Экология','science'],
    lab:['Опытная лаборатория','science'], optics:['Физика света','science'], astro:['Астрономия','science'],
    chem:['Химия','science'], labtech:['Лабораторный практикум','science'], terra:['География','science'],
    info:['Информатика','computer'], code:['Программирование','computer'], digital:['Цифровая графика','computer'],
    sound:['Студия звука','computer'], photo:['Фотолаборатория','computer'], mecha:['Механика','robotics'],
    robot:['Робототехника','robotics'], electronics:['Электроника','robotics'], design:['Конструкторское бюро','robotics'],
    archive:['Архив проектов','library'], history:['История','language'], news:['Редакция газеты','studio'],
    table:['Настольные игры','reading'], tutor:['Семинарская','language'], reading:['Книжный клуб','reading']
};
// Each wing has north and south teaching bays on either side of its central passage.
// A '+' joins adjacent bays into one full-length hall with a single wide entrance.
const timetable = [
    {
        west:[['gym','+','cloak','lounge'],['meet','table','read','media'],'music'],
        central:[['gallery','models','news','foyer'],['stage','+','podium','foyer'],'atrium'],
        east:[['green','eco','lib','tutor'],['food','+','cafe','cloak'],'art']
    },
    {
        west:[['math','geom','logic','tutor'],['lib','archive','lit','debate'],'history'],
        central:[['foreign','language','media','reading'],['lab','bio','terra','nature'],'atrium'],
        east:[['optics','chem','labtech','astro'],['eco','green','project','make'],'gallery']
    },
    {
        west:[['music','choir','sound','podium'],['art','print','textile','clay'],'read'],
        central:[['digital','photo','media','gallery'],['project','craft','models','news'],'atrium'],
        east:[['robot','mecha','design','electronics'],['info','code','logic','make'],'lab']
    }
];
function fillRoom(area, furniture) {
    const {x,z,w,d,type} = area;
    const add = (kind,dx,dz,fw,fd,h) => furniture.push({kind,x:x+dx,z:z+dz,w:fw,d:fd,h,room:area.id});
    const back = -d/2 + 1.0, front = d/2 - 1.10, lx = Math.min(2.62,w*.25);
    if (['math','language','science','computer','studio'].includes(type)) {
        const kind = {science:'specimen',computer:'computer',studio:'drafting'}[type] || 'desk';
        const row = Math.min(3.10,d*.24);
        for (const dz of [-row,row])
            for (const dx of [-lx,.08,lx])
                add(kind,dx,dz,1.42,1.48,kind==='computer'?1.35:.92);
        if (d >= 10.5) add('teacher',lx,back,1.50,.8,.77);
        if (type==='science') add('displayTable',-lx,back-.26,1.98,.78,1.49);
        return;
    }
    if (type==='gym') {
        for (const dz of [back,front]) add('sportsGoal',0,dz,3.1,.79,2.0);
        add('sportsBench',area.side*(w/2-.75),-d*.22,.65,3.15,.48);
    } else if (type==='auditorium' || type==='theatre' || type==='music') {
        const stageD = Math.min(3.4,d*.23);
        add('stage',0,-d/2+stageD*.5+.35,w*.79,stageD,.47);
        for (const dz of (type==='auditorium'?[d*.12,d*.28,d*.41]:[d*.27])) {
            for (const side of [-1,1]) add('auditoriumSeat',side*w*.24,dz,w*.30,.72,.91);
        }
        if (type==='music') add('piano',area.side*w*.32,-d*.10,1.52,.66,1.17);
    } else if (type==='canteen') {
        add('serving',0,back,w*.64,.88,1.31);
        for (const dx of [-lx,lx])
            for (const dz of [-d*.20,d*.26]) add('dining',dx,dz,2.02,1.75,.83);
    } else if (type==='lockers') {
        for (const dz of [back,front]) add('lockers',0,dz,w*.72,.65,1.81);
        add('bench',area.side*w*.18,-.82,2.40,.55,.44);
    } else if (type==='gallery') {
        add('buildingModel',-.61,-d*.23,2.62,1.35,1.22);
        add('geometry',lx,d*.25,1.72,1.05,1.35);
        add('bench',-lx,front,2.18,.56,.44);
    } else if (type==='robotics') {
        for (const dz of [back,front]) add('robotRack',lx*.42,dz,3.48,.63,2.38);
        add('rover',-1.0,-d*.20,2.04,1.12,1.36);
        add('manipulator',1.86,d*.22,1.64,1.02,1.58);
    } else if (type==='greenhouse') {
        for (const dz of [-d*.27,d*.27]) for (const dx of [-lx,0,lx]) add('plant',dx,dz,.82,.82,1.23);
        add('readingTable',area.side*lx,0,1.28,.75,.54);
    } else {
        if (['reading','library'].includes(type))
            for (const dx of [-lx,lx]) add('bookshelf',dx,back,2.68,.58,1.94);
        else add('sofa',.5,back+.35,2.65,.85,.9);
        add('sofa',-.46,d*.26,2.45,.85,.9);
        add('readingTable',.30,d*.09,1.22,.72,.54);
        add('pouf',lx,d*.16,.74,.74,.43);
        add('plant',area.side*(w/2-.88),front,.64,.64,1.1);
    }
}
function buildWalls(areas, doors, number) {
    // Split edges at every neighbouring slab, doorway and landing. This avoids duplicate
    // interior walls and keeps the geometry used for drawing and walking in agreement.
    const edges = new Map(), walls = [];
    const key = (axis, constant) => axis + ':' + constant.toFixed(3);
    const line = (axis, c) => {
        const id=key(axis,c);
        if (!edges.has(id)) edges.set(id,{axis,c,spans:[],cuts:[]});
        return edges.get(id);
    };
    const edge = (axis,c,a,b,area) => line(axis,c).spans.push({a,b,area});
    for (const area of areas) {
        const x1=area.x-area.w/2, x2=area.x+area.w/2, z1=area.z-area.d/2, z2=area.z+area.d/2;
        edge('x',z1,x1,x2,area); edge('x',z2,x1,x2,area);
        edge('z',x1,z1,z2,area); edge('z',x2,z1,z2,area);
    }
    const cut = (axis,c,centre,width) => line(axis,c).cuts.push([centre-width/2,centre+width/2]);
    for (const door of doors)
        cut(door.axis,door.axis==='x'?door.z:door.x,door.axis==='x'?door.x:door.z,door.width);
    for (const flight of stairs) {
        if (flight.from===number) cut('x',flight.z1,flight.x1,flight.width);
        if (flight.to===number) cut('x',flight.z2,flight.x2,flight.width);
    }
    const add = (axis,c,a,b,kind,wing) => {
        const h=kind==='rail'?1.05:ceiling;
        const w=axis==='x'?{x1:a,z1:c,x2:b,z2:c}:{x1:c,z1:a,x2:c,z2:b};
        walls.push({...w,kind,h,wing});
    };
    for (const {axis,c,spans,cuts} of edges.values()) {
        const ticks = Array.from(new Set([...spans.flatMap(s=>[s.a,s.b]),...cuts.flat()])).sort((a,b)=>a-b);
        let start, stop, finish, wing;
        const flush = () => {if(finish) add(axis,c,start,stop,finish,wing);finish=null;};
        for (let i=1;i<ticks.length;i++) {
            const a=ticks[i-1],b=ticks[i],mid=(a+b)/2;
            const hit=spans.filter(s=>mid>s.a&&mid<s.b);
            let kind=null;
            if (hit.length && !cuts.some(([s,e])=>mid>s&&mid<e)) {
                if (hit.length===1) {
                    const x=axis==='x'?mid:c, z=axis==='z'?mid:c;
                    const shaft=shafts.find(q=>Math.abs(x-q.x)<=q.w/2+.001&&Math.abs(z)<=4.501);
                    const openAtrium=number>1 && Math.abs(x-1000)<=4.001 && Math.abs(z)<=3.001;
                    kind=shaft||openAtrium?'rail':'outer';
                } else if (hit.some(s=>s.area.kind==='room')) {
                    kind='partition';
                }
            }
            const region=hit[0]?.area.wing;
            if (kind!==finish||region!==wing) {flush();start=a;finish=kind;wing=region;}
            stop=b;
        }
        flush();
    }
    for (const wing of [wings[0],wings[2]]) {
        const x=wing.x+(wing.id==='west'?-half:half);
        add('z',x,-4.5,4.5,'outer',wing.id);
    }
    return walls;
}
function buildFloor(number) {
    const areas=[],furniture=[],doors=[],labels=[], stairLandings=[];
    const addArea=(id,x1,z1,x2,z2,kind,name,wing,extra={})=>{
        const a={id,x:(x1+x2)/2,z:(z1+z2)/2,w:x2-x1,d:z2-z1,kind,name,wing,...extra};
        areas.push(a); return a;
    };
    const addLabel=(x,z,name) => labels.push({x,z,name});
    for (const wing of wings) {
        const cx=wing.x, id=wing.id, program=timetable[number-1][id];
        const bands=[[wing.north,-23],[-23,-14],[14,23],[23,wing.south]];
        const area=(tag,x1,z1,x2,z2,kind,name,extra)=>addArea(id+'-'+tag,x1,z1,x2,z2,kind,name,id,extra);
        for (let i=0; i<bands.length; i++) {
            const [z1,z2]=bands[i], endFoyer=id==='central'&&number===1&&i===3;
            if (endFoyer) {
                const f=area('start',cx-half,z1,cx+half,z2,'foyer','Входной вестибюль');
                addLabel(cx,f.z,f.name);
                furniture.push({kind:'sofa',x:cx-7,z:31.5,w:2.64,d:.85,h:.9,room:f.id},
                    {kind:'plant',x:cx+7,z:33.8,w:.68,d:.68,h:1.17,room:f.id},
                    {kind:'buildingModel',x:cx+6.40,z:27.10,w:2.62,d:1.35,h:1.22,room:f.id});
                doors.push({x:cx,z:z2,width:2.88,axis:'x',room:f.id,kind:'entry',side:1,name:'Главный вход'});
            } else area('hall-'+i,cx-hallHalf,z1,cx+hallHalf,z2,'corridor',wing.name);
        }
        const addRoom=(tag,code,side,z1,z2)=>{
            const [name,type]=programs[code], inner=cx+side*hallHalf, outer=cx+side*half;
            const a=area(tag,Math.min(inner,outer),z1,Math.max(inner,outer),z2,'room',name,{type,side});
            a.probe={x:inner+side*1.18,z:a.z};
            doors.push({x:inner,z:a.z,width:['gym','auditorium','canteen'].includes(type)?2.38:1.82,axis:'z',room:a.id,kind:'room',side,name});
            addLabel(a.x,a.z,name); fillRoom(a,furniture);
        };
        for (let sideIndex=0;sideIndex<2;sideIndex++) {
            const side=sideIndex?1:-1;
            for (let i=0;i<bands.length;i++) {
                const code=program[sideIndex][i];
                if (code==='+'||code==='foyer') continue;
                const joinsNext=program[sideIndex][i+1]==='+';
                addRoom('bay-'+sideIndex+'-'+i,code,side,bands[i][0],bands[joinsNext?i+1:i][1]);
            }
        }
        for (const z of [-10.5,10.5]) {
            const f=area('gallery-'+(z>0?'s':'n'),cx-half,z-3.5,cx+half,z+3.5,'foyer','Галерея · '+wing.name);
            if (id!=='central') addLabel(f.x,f.z,wing.name);
            // Keep both transverse bridge routes clear. Small rest islands sit along the edges.
            for (const side of [-1,1]) {
                furniture.push({kind:'bench',x:cx+side*6.4,z:z+2.64,w:2.30,d:.52,h:.44,room:f.id});
                furniture.push({kind:'plant',x:cx+side*9.8,z:z-2.77,w:.60,d:.60,h:1.10,room:f.id});
            }
        }
        if (id==='central') {
            area('atrium-n',cx-half,-7,cx+half,-3,'foyer','Атриум');
            area('atrium-s',cx-half,3,cx+half,7,'foyer','Атриум');
            area('atrium-w',cx-half,-3,cx-4,3,'foyer','Атриум');
            area('atrium-e',cx+4,-3,cx+half,3,'foyer','Атриум');
            if (number===1) area('atrium-floor',cx-4,-3,cx+4,3,'foyer','Атриум',{openAbove:true});
            addLabel(cx+7,0,number===1?'Атриум':'Балкон атриума');
            continue;
        }
        const outerSide=id==='west'?-1:1, inner=cx+outerSide*hallHalf, outer=cx+outerSide*half;
        area('hall-mid',cx-hallHalf,-7,cx+hallHalf,7,'corridor',wing.name);
        addRoom('middle',program[2],-outerSide,-7,7);
        for (const [z1,z2,side] of [[-7,-4.5,'n'],[4.5,7,'s']]) {
            const a=area('landing-'+side,Math.min(inner,outer),z1,Math.max(inner,outer),z2,'landing','Лестничная площадка');
            if (stairs.some(s=>s.wing===id&&((s.from===number&&Math.sign(s.z1)===Math.sign(a.z))||(s.to===number&&Math.sign(s.z2)===Math.sign(a.z)))))
                addLabel(a.x,a.z,'Лестница');
        }
    }
    for (const s of shell.filter(a=>a.kind==='bridge'))
        addArea('bridge-'+s.wing+'-'+(s.z>0?'s':'n'),s.x-s.w/2,s.z-s.d/2,s.x+s.w/2,s.z+s.d/2,'bridge',s.name,s.wing);
    for (const s of stairs) {
        const up=s.from===number;
        if (!up&&s.to!==number) continue;
        const z=up?s.z1:s.z2;
        stairLandings.push({id:s.id,wing:s.wing,up,x:s.x1,z:z+Math.sign(z)*.86,edgeZ:z,flight:s.id});
    }
    if (number === 1) addLabel(entry.x, entry.z, 'Выход');
    const walls=buildWalls(areas,doors,number), down=stairLandings.find(p=>!p.up);
    const wayOut=number===1?{...entry,label:'Выйдите на улицу'}:{x:down.x,z:down.z,label:'Спуститесь по лестнице'};
    return {number,name:'Школа № 1430 · этаж '+number,floor:heights[number-1],ceiling,
        bounds:{minX:948,maxX:1052,minZ:-37,maxZ:37},areas,walls,doors,furniture,labels,stairLandings,
        entrance:{...entry},wayOut};
}
exports.campus = {floors:Object.fromEntries([1,2,3].map(n=>['school'+n,buildFloor(n)])),stairs,shafts,heights,entry,shell,skylight};
// Choose the nearest descending flight in this connected campus.
exports.wayOutFrom = function(plan, x, z) {
    if (!plan?.stairLandings || plan.number === 1) return plan?.wayOut;
    let nearest = null, distance = Infinity;
    for (const landing of plan.stairLandings) {
        if (landing.up) continue;
        const d = (landing.x - x) ** 2 + (landing.z - z) ** 2;
        if (d < distance) { nearest = landing; distance = d; }
    }
    return nearest ? { x: nearest.x, z: nearest.z, label: 'Спуститесь по лестнице' } : plan.wayOut;
};
