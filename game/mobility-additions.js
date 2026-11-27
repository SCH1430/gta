"use strict";
const { specs, carCabin }=require("./vehicle-cabin.js");
const { equipment }=require("./vehicle-road.js");
const { lanes, wrapAngle }=require("./sim-navigation.js");
const { hullFits, moveHull }=require("./collision.js");
const { linePose }=require("./world-railway.js");
const { createMobilityView, location }=require("./mobility-view.js");
const { transitRows, nearStop }=require("./mobility-transit.js");
const { workRows, sites, loadKg, loadingCar, openRear }=require("./mobility-work.js");
const near=(p,point,r)=>Math.hypot(p.x-point[0],p.z-point[1])<r;
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const neutral=()=>({
    days:0,lastMinutes:-1,tool:null,spool:'',shopLamp:false,chairs:0,chairJob:false,lastChair:-1,chairReady:false,
    customers:0,repairQuote:null,deliveries:{},strapped:{},weigh:null,lift:false,contributed:0,fund:0,fitting:false,
    sign:'',signBlank:false,ticket:null,routeNotes:{},returnedBag:false,traced:false,driverMessage:false,windowSecret:false,
    used:{cold:false,under:false,metres:0,bought:false,fixed:false},noteCar:'',noteDue:0,noteCalled:false,
    reverseLesson:'',reversed:0,reverseDone:false,passenger:null,fans:{},manualSignals:{},
    courtesy:null,courtesyDone:false,heldThisStop:false,holdUntil:0
});
function cash(c,amount){c.sim.money+=amount;}
function roadSignal(car,elapsed,s){
    const override=s.manualSignals[car.id];
    if(override&&override.until>elapsed)return override.side;
    if(!car.auto)return 0;
    const lane=lanes[car.lane];if(!lane)return 0;
    const job=car.populationTrip?.service;
    if(job&&job.phase!=='done'){
        const gap=lane.difference(car.s,job.s);
        if(job.phase==='merge'||job.phase==='pull-in'||job.phase==='approach'&&gap>=0&&gap<Math.max(12,Math.abs(car.speed)*3.8)){
            const dx=job.bay.x-car.x,dz=job.bay.z-car.z;
            return job.phase==='merge'?-1:Math.sign(dx*Math.cos(car.yaw)-dz*Math.sin(car.yaw))||1;
        }
    }
    const future=lane.at(car.s+Math.max(7,Math.abs(car.speed)*2.7));
    const delta=wrapAngle(future.yaw-car.yaw);
    return Math.abs(delta)>.24?-Math.sign(delta):0;
}
const destinations={market:[32.9,35.65],depot:[12,-42.2]};
const siteNames={market:'У прилавка Инны',loading:'Накладные в рыночном кармане',garage:'Наряды и инструментальная',depot:'Стол приёмки депо',cafe:'Заказы «Горячего льда»','cafe-inside':'Заказы у стойки кафе',yard:'Складчина на фонарь',mill:'Весовая лесозавода',dock:'Рыбак у лодки'};
const { vehicleNames }=require("./vehicle-cabin.js");
const arrows={[-1]:'левый',[1]:'правый'};
function streetSite(c) {
    if(c.zone==='cafe')return 'cafe-inside';
    if(c.zone!=='street')return '';
    if(near(c.player,sites.park,4.4))return 'loading';
    if(!c.car&&near(c.player,sites.market,3.5))return 'market';
    for(const [k,range] of [['garage',8.2],['depot',6.3],['yard',4],['mill',10],['dock',6.2],['cafe',5.5]])
        if(near(c.player,sites[k],range))return k;
    return '';
}
function preparedCar(sim,car){
    return car&&!car.carrying&&!car.carriedBy&&!sim.transition&&Math.abs(car.speed)<.35;
}
function yardCar(sim,s,make){
    let c=sim.cars.find(v=>v.id==='yard-instructor');
    if(!c&&s.courtesy&&make){
        const p=s.courtesy;
        const pose={x:p.x,z:p.z,y:0,yaw:p.yaw,kind:'hatch'};
        const copy={...pose,id:'yard-instructor',color:'#798778',health:100,lights:true,speed:0,steer:0,wheel:0,braking:false,police:false,auto:false,s:0,lane:0,vx:0,vz:0};
        if(!hullFits(copy,copy,sim.cars,sim.streetPeople))return null;
        sim.cars.push(copy);c=copy;
    }
    return c;
}
function doorClear(c,car){
    if(!preparedCar(c.sim,car)||!c.sim.door(car,1,false))return false;
    const seat=carCabin(car.kind),door=c.sim.gripStand(car,1,0).stand;
    return !c.sim.cars.some(other=>{
        if(other===car||Math.abs(other.speed)<.7)return false;
        for(const t of [0,.4,.85,1.25]){
            const px=other.x-Math.sin(other.yaw)*other.speed*t,pz=other.z-Math.cos(other.yaw)*other.speed*t;
            if(Math.hypot(px-door.x,pz-door.z)<specs[other.kind].w+seat.halfWidth+.75)return true;
        }
        return false;
    });
}
function bootNear(c,car){
    if(c.car) return false;
    const at=location(car,0,0,specs[car.kind].rear+.61);
    return Math.hypot(c.player.x-at[0],c.player.z-at[2])<2.1;
}
function fleetRows(s,c,site,car) {
    const rows=[],add=(label,run)=>rows.push({label,run});
    const sim=c.sim,driving=c.car,usedCar=sim.cars.find(v=>v.id==='fleet-taiga');
    if(driving){
        for(const side of [-1,1])add('Включить '+arrows[side]+' поворотник',()=>{
            s.manualSignals[driving.id]={side,until:sim.elapsed+8};c.audio?.effect?.('switch');c.notify('Включён '+arrows[side]+' поворотник на 8 секунд.');
        });
        add(s.fans[car.id]?'Выключить обдув стекла':'Включить обдув лобового стекла',()=>{
            s.fans[car.id]=!s.fans[car.id];c.notify(s.fans[car.id]?'Тёплый воздух поступает к нижней кромке стекла.':'Обдув выключен.');
        });
        if(Math.abs(car.speed)<.3&&!s.passenger&&(site==='loading'||site==='depot'))add('Подвезти пассажирку до '+(site==='loading'?'депо':'рынка'),()=>{
            if(!doorClear(c,car)){c.notify('У пассажирской двери занято. Подъедьте ближе к свободному краю.');return;}
            s.passenger={car:car.id,to:site==='loading'?'depot':'market',phase:'board',t:0};
            car.mobilityPassengerBusy=true;
            c.addMapPin(...destinations[s.passenger.to],s.passenger.to==='market'?'Высадка у рынка':'Высадка у депо');
            c.notify('Пассажирка садится справа. У конечной она дождётся вашего разрешения.');
        });
        if(s.passenger?.car===car.id&&s.passenger.phase==='ride'&&near(car,destinations[s.passenger.to],9)&&Math.abs(car.speed)<.4){
            add('Пассажирка спрашивает, можно ли выйти',()=>c.choose('Она держится за ручку пассажирской двери',[
                {label:'Подождите, я проверю зеркало',run:()=>{sim.motorPool.cockpit=true;c.notify('Посмотрите в правое зеркало. Дверь пока закрыта.');}},
                {label:'Можно выходить',run:()=>{if(!doorClear(c,car)){c.notify('Рядом машина или препятствие. Пассажирка остаётся в салоне.');return;}s.passenger.phase='leave';s.passenger.t=0;car.mobilityPassengerBusy=true;}}
            ]));
        }
        if(site==='garage'&&car.kind==='van'&&!s.reverseDone)add('Урок парковки по правому зеркалу',()=>{
            s.reverseLesson=car.id;s.reversed=0;sim.motorPool.cockpit=true;c.addMapPin(-43.7,46.08,'Въезд в бокс по полосе');
            c.notify('Встаньте носом на восток. Сдайте назад к светлой полосе: правая сторона кузова рядом с линией, бампер не касается ворот.');
        });
    }
    if(car&&bootNear(c,car)&&(loadKg(s,car.id)>0||equipment(car).load>0)){
        add(s.strapped[car.id]?'Проверить ремень груза':'Открыть багажник и закрепить груз',()=>{
            if(!preparedCar(sim,car)||!openRear(c,car))return;
            s.strapped[car.id]=true;c.notify('Ремень натянут поперёк ящика.');
        });
    }
    if(!c.car&&car&&!s.noteCar&&(near(car,sites.garage,12)||near(car,sites.market,14)))add('Оставить номер под дворником',()=>{
        s.noteCar=car.id;s.noteDue=sim.elapsed+28;s.noteCalled=false;c.notify('Записка осталась под дворником.');
    });
    if(!c.car&&car&&s.noteCar===car.id)add('Забрать записку с лобового стекла',()=>{s.noteCar='';s.noteDue=0;s.noteCalled=false;c.notify('Записка снята.');});
    if(site==='garage'&&!s.courtesy&&!s.courtesyDone)add('Встречный разъезд • позвать второго водителя',()=>{
        s.courtesy={x:-38.3,z:37.15,yaw:Math.PI,progress:0,blink:0};
        if(!yardCar(sim,s,true)){s.courtesy=null;c.notify('Место у горловины гаража занято. Освободите его и попробуйте ещё раз.');return;}
        c.notify('Хетч ждёт в горловине. Медленно подайте к нему со стороны боксов.');
    });
    if(usedCar&&((!c.car&&d2(c.player,usedCar)<5)||(c.car===usedCar&&near(usedCar,sites.garage,25)))){
        if(!s.used.bought){
            if(!s.used.cold)add('Холодный пуск выставленной «Тайги»',()=>{s.used.cold=true;c.audio?.effect?.('switch');c.notify('На холодном моторе крышка термоса дребезжит: изношена опора.');});
            if(!s.used.under&&!c.car)add('Осмотреть подвеску и опоры снизу',()=>{s.used.under=true;c.record('У «Тайги» надорвана правая опора двигателя.');});
            add('Обсудить цену пробеговой «Тайги»',()=>{
                const price=Math.max(95,180-(s.used.cold?18:0)-(s.used.under?39:0)-(s.used.metres>=45?28:0));
                c.choose('Осмотр и пробная поездка влияют на цену',[
                    {label:'Проехать испытательные 45 метров · '+Math.min(45,Math.floor(s.used.metres))+'/45',run:()=>c.notify('Сядьте за руль и пройдите небольшой круг. Для сделки вернитесь к гаражу.')},
                    {label:'Купить за '+price+' ₽',run:()=>{
                        if(s.used.bought)return;
                        if(sim.money<price){c.notify('Недостаточно денег.');return;}
                        if(c.garage?.canAdd && !c.garage.canAdd(usedCar.id)){c.notify('Для оформления освободите место в гараже.');return;}
                        cash(c,-price);s.used.bought=true;
                        if(c.garage&&!c.garage.has(usedCar.id))c.garage.add(usedCar.id);
                        c.notify('Техпаспорт «Тайги» оформлен.');c.record('«Тайга» куплена за '+price+' ₽.');
                    }}
                ]);
            });
        } else {
            add('Прочесть свой техпаспорт на «Тайгу»',()=>c.notify('Владелец: герой • Канальные гаражи • '+(s.used.fixed?'опора двигателя заменена.':'опора двигателя отмечена в карте осмотра.')));
            if(site==='garage'&&!s.used.fixed)add('Заменить опору двигателя · 25 ₽',()=>{
                if(s.used.fixed)return;
                if(c.sim.money<25){c.notify('На новую опору нужно 25 ₽.');return;}
                cash(c,-25);s.used.fixed=true;c.notify('Опора заменена. Проверьте крышку термоса на холостых.');
            });
        }
    }
    return rows;
}
function nearbyVehicle(c){
    return c.car||loadingCar(c);
}
function recordSafe(v){
    if(!v||typeof v!=='object'||Array.isArray(v))return {};
    return Object.fromEntries(Object.entries(v).slice(0,256).filter(([k])=>/^[\w-]{1,80}$/.test(k)));
}
exports.createMobilityAdditions=function(scene){
    let s=neutral();
    const draw=scene?createMobilityView(scene):null, signals=[], cargoHistory=new Map();
    let lastStop='';
    function update(c){
        if(!c.sim||!c.player)return;
        const sim=c.sim,dt=Math.max(0,Math.min(.25,c.dt||0)),t=sim.elapsed,car=c.car;
        const r=linePose(sim.tramTime);
        if(s.lastMinutes>=0&&c.minutes+720<s.lastMinutes)s.days++;
        s.lastMinutes=c.minutes;
        if(!r.stop||lastStop!==r.stop){s.heldThisStop=false;s.holdUntil=0;} lastStop=r.stop;
        signals.length=0;
        for(const item of sim.cars){
            if(!specs[item.kind])continue;
            item.mobilityCargoKg=loadKg(s,item.id);
            if(d2(item,c.player)>65)continue;
            const side=roadSignal(item,t,s);if(side)signals.push([item,side]);
        }
        if(s.noteCar&&!s.noteCalled&&t>=s.noteDue){
            const noted=sim.cars.find(v=>v.id===s.noteCar);
            if(noted&&(near(noted,sites.garage,12)||near(noted,sites.market,14))){
                const message='Звонок по записке: «Мне нужно выехать. Отгоните автомобиль, пожалуйста».';
                s.noteCalled=true;c.notify(message);c.record(message);
                c.audio?.effect?.('switch');
            }else{s.noteCar='';s.noteDue=0;}
        }
        if(car){
            const passenger=s.passenger?.car===car.id;
            const occupiedRate=(passenger||car.kind==='taxi') ? .015 : .006;
            const fogRate=s.fans[car.id]?-.09:occupiedRate;
            const sys=equipment(car);
            car.mobilityMist=Math.max(0,Math.min(.92,(car.mobilityMist||0)+dt*(sys.windowsOpen?-.02:fogRate)));
            const previous=cargoHistory.get(car.id);
            if(previous){
                const moved=Math.min(.8,d2(previous,car));
                if(car.id==='fleet-taiga'&&!s.used.bought)s.used.metres=Math.min(1000,s.used.metres+moved);
                if(s.reverseLesson===car.id&&car.speed<-.05)s.reversed+=moved;
                const turn=Math.abs(wrapAngle(car.yaw-previous.yaw));
                if((car.mobilityCargoKg>0||sys.load>0)&&!s.strapped[car.id]&&Math.abs(car.speed)>3&&turn*Math.abs(car.speed)>.7*dt&&t-previous.clunk>5){
                    c.audio?.tone?.(90,44,.12,.15,'triangle');c.notify('Ящик ударился о стенку багажника. Затяните ремень у задней двери.');previous.clunk=t;
                }
            }
            cargoHistory.set(car.id,{x:car.x,z:car.z,yaw:car.yaw,clunk:previous?.clunk??-10});
            if(s.reverseLesson===car.id&&s.reversed>2.5&&near(car,[-43.7,46.08],1.05)&&Math.abs(wrapAngle(car.yaw+Math.PI/2))<.22&&Math.abs(car.speed)<.3){
                s.reverseDone=true;s.reverseLesson='';cash(c,32);c.record('Парковка принята: полоса в правом зеркале, фургон стоит ровно. +32 ₽');
            }
        }
        const pass=s.passenger;
        if(pass){
            const ride=sim.cars.find(v=>v.id===pass.car);
            if(!ride){s.passenger=null;}
            else if(pass.phase!=='ride'){
                ride.mobilityPassengerBusy=true;
                pass.t=Math.min(1,pass.t+dt/2.25);
                equipment(ride).mobilityDoor=Math.min(1,pass.t*5,(1-pass.t)*5)*.83;
                if(pass.t>=1){ride.mobilityPassengerBusy=false;if(pass.phase==='board'){pass.phase='ride';pass.t=0;}
                    else{s.passenger=null;cash(c,38);c.notify('Пассажирка вышла. +38 ₽');}}
            }
        }
        if(s.courtesy){
            const npc=yardCar(sim,s,near(c.player,sites.garage,50));
            if(npc&&npc!==car&&car&&d2(npc,car)<9&&Math.abs(wrapAngle(car.yaw-npc.yaw))>1.8&&Math.abs(car.speed)<3){
                if(!s.courtesy.blink){s.courtesy.blink=1;c.notify('Встречный водитель моргнул: он сдаёт к расширению.');}
                const f=s.courtesy.progress,n=Math.min(1,f+dt*.29),x=-38.3-2.1*n*n,z=37.15-2.72*n,yaw=Math.PI+.45*Math.sin(n*Math.PI);
                const a=moveHull(npc,x-npc.x,z-npc.z,yaw,sim.cars,sim.streetPeople);
                if(!a.hit){Object.assign(npc,{x:a.x,z:a.z,yaw:a.yaw});Object.assign(s.courtesy,{x:a.x,z:a.z,yaw:a.yaw,progress:n});npc.wheel-=dt*2.2;}
                npc.lights=Math.floor(t*4)%2===0;
                if(n>.999&&!a.hit){s.courtesyDone=true;npc.lights=true;c.record('Водители разъехались у гаражной горловины.');}
            }
            if(s.courtesyDone&&npc&&npc!==car&&!sim.transition&&d2(c.player,npc)>65){
                const i=sim.cars.indexOf(npc);if(i>=0)sim.cars.splice(i,1);s.courtesy=null;
            }
        }
        draw?.(c,s,r,signals);
    }
    function actions(c){
        if(!c.sim||!c.player||c.sim.transition||c.sim.home?.door)return [];
        const rows=[],site=streetSite(c),stop=nearStop(c),car=nearbyVehicle(c),onboard=c.sim.tramRider.onboard;
        if(!onboard&&site&&workRows(s,c,site).length)rows.push({id:'work',label:siteNames[site]});
        if(c.zone==='street'&&!onboard&&(c.car||site==='garage'||car)&&fleetRows(s,c,site,car).length)rows.push({id:'fleet',label:c.car?'Приборы и рейс':'Машина и мастерская'});
        if(onboard||stop)rows.push({id:'tram',label:onboard?'Талон и действия в вагоне':'Платформа • билеты и рейсы'});
        return rows;
    }
    function act(id,c){
        const site=streetSite(c),stop=nearStop(c);
        if(!actions(c).some(a=>a.id===id))return false;
        if(id==='work')c.choose(siteNames[site],workRows(s,c,site));
        if(id==='fleet')c.choose('Машина и рейс',fleetRows(s,c,site,nearbyVehicle(c)));
        if(id==='tram')c.choose('Городской транспорт',transitRows(s,c,stop));
        return true;
    }
    function agenda(c) {
        const rows=[],now=s.days*1440+c.minutes;
        const add=(title,goal)=>rows.push({title,goal});
        const plate=id=>{const car=c.sim.cars.find(v=>v.id===id);return car?'«'+vehicleNames[car.kind]+'», '+specs[car.kind].number:'машине с отметкой погрузки';};
        if(s.deliveries.beam)add('Попутная доставка в депо','Приёмка у диспетчерской до 22:00. Направляющая в '+plate(s.deliveries.beam)+'.');
        if(s.deliveries.chairs)add('Столярный ящик для кафе','Доставить ящик в «Горячий лёд» до 23:00. Груз в '+plate(s.deliveries.chairs)+'.');
        if(s.repairQuote)add('Смета на приёмник',now>=s.repairQuote.due?'Выдать готовый приёмник у Инны за '+s.repairQuote.fee+' ₽.':'Вернуться к прилавку через '+(s.repairQuote.due-now)+' игровых минут. Согласовано '+s.repairQuote.fee+' ₽.');
        if(s.tool)add('Инструмент из проката',now>s.tool.due?'Срок вышел. Другой мастер ждёт ключ в Канальном гараже.':'Вернуть ключ в инструментальную через '+(s.tool.due-now)+' игровых минут.');
        if(s.spool==='full'||s.spool==='empty')add('Залог за бобину',s.spool==='full'?'Кабель для фонаря у арки. За бобину внесено 18 ₽.':'Вернуть пустую бобину Инне за 18 ₽ или оставить в гараже для удлинителя.');
        if(s.chairJob&&s.chairs<7)add('Семь стульев для кафе',s.chairReady?'Готовый стул ждут в «Горячем льде».':(s.lastChair===s.days?'Следующий стул можно чинить завтра.':'Взять ключ и починить стул в гараже.')+' Принято '+s.chairs+' из семи.');
        if(s.fund>0&&s.fund<3)add('Складчина на фонарь','У арки дома №23 готовы '+s.fund+' из трёх частей. Ещё нужны '+[!(s.contributed&1)&&'25 ₽',!(s.contributed&2)&&'плафон Инны',!(s.contributed&4)&&'кабель'].filter(Boolean).join(' и ')+'.');
        if(s.passenger)add('Пассажирская поездка',s.passenger.to==='market'?'Высадить пассажирку в кармане у «Спектра».':'Подвезти пассажирку к депо и проверить правую дверь.');
        if(s.reverseLesson)add('Парковка по правому зеркалу','Сдать фургоном задним ходом к светлой метке на стене гаража.');
        if(s.weigh)add('Весовая лесозавода',s.weigh.corrected?'Сдать согласованную партию 180 кг на весовой.':s.weigh.loaded?'Взвесить машину с палетой и сверить разницу с накладной.':'Пустая машина взвешена. Принять палету на 180 кг по накладной.');
        if(s.signBlank)add('Указатель из депо','Привезти снятую табличку в гараж и выбрать надпись.');
        if(s.driverMessage===true)add('Записка для смены','Забрать ответ водителя во время стоянки на рыночной конечной.');
        return rows;
    }
    return {update,actions,act,agenda,save:()=>structuredClone(s),restore(input){
        const base=neutral();s=base;signals.length=0;cargoHistory.clear();lastStop='';
        if(!input||typeof input!=='object')return;
        for(const [key,val] of Object.entries(base)) {
            const raw=input[key];if(raw===undefined||raw===null)continue;
            if(typeof val==='number'){if(Number.isFinite(raw))s[key]=raw;}
            else if(typeof val==='string'){if(typeof raw==='string')s[key]=raw.slice(0,100);}
            else if(typeof val==='boolean'){if(typeof raw==='boolean'||key==='driverMessage'&&raw==='delivered')s[key]=raw;}
            else if(typeof raw==='object'&&!Array.isArray(raw))s[key]=structuredClone(raw);
        }
        for(const key of ['deliveries','strapped','routeNotes','fans','manualSignals'])s[key]=recordSafe(s[key]);
        if(s.ticket&&!Array.isArray(s.ticket.lines))s.ticket=null;
        if(s.passenger&&(!['board','ride','leave'].includes(s.passenger.phase)||!destinations[s.passenger.to]||!Number.isFinite(s.passenger.t)))s.passenger=null;
        if(s.courtesy&&![s.courtesy.x,s.courtesy.z,s.courtesy.yaw,s.courtesy.progress].every(Number.isFinite))s.courtesy=null;
        s.chairs=Math.max(0,Math.min(7,Math.floor(s.chairs)));s.used={...neutral().used,...recordSafe(s.used)};
    }};
};
