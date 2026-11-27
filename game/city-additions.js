"use strict";
const W=require("./world-layout.js");
const { walkSlide,clearDisc }=require("./collision.js");
const { makeView,gate }=require("./neighbourhood-view.js");
const { marketWalkway }=require("./market-quarter-layout.js");
const { roadIceAt }=require("./weather.js");
const { passageFront }=require("./exploration-layout.js");
const dominoRules=require("./yard-domino.js");
const route=[[17.15,22.63],[17.35,20.35],[15.9,19.45],[10.4,18.65],[7.25,18.95],[4.65,19.55],[2.25,20.4],[-2.4,20.6],[-7.2,20.15],[-12,19.4],[-17.7,18.05],[-19.55,17.45],[-23.7,19.35],[-28.4,19.8],[-32.5,18.92],[-34.96,17.66]];
const initial=()=>({yard:'',item:'',umbrella:'stand',night:0,lastMinute:-1,alias:false,guide:'stop',queue:'none',servedAt:0,
    carId:'',visits:0,visitDay:-1,favour:false,repaid:false,liftHelp:'',find:false,findShown:false,game:0,clockSeen:false,clockFound:false,upper:false,lower:false});
const within=(p,x,z,r)=>Math.hypot(p.x-x,p.z-z)<=r;
const smooth=(v)=>Math.max(0,Math.min(1,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const street=ctx=>ctx.zone==='street'&&!ctx.car&&!ctx.sim.transition&&!ctx.sim.tramRider?.onboard;
const evening=m=>m>=1080&&m<1395;
function trafficHold(c,phase) {
    if(!phase||Math.abs(c.z-30)>4.15||Math.abs(Math.sin(c.yaw))<.68)return false;
    const gap=(37.5-c.x)*-Math.sign(Math.sin(c.yaw));
    return gap>3.8&&gap<7.3+Math.min(13,Math.abs(c.speed||0)*.85);
}
exports.trafficHold=trafficHold;
exports.closedGate=(from,to,minutes)=>{
    if(minutes>=900&&minutes<1260)return false;
    const middle=(from.x+to.x)*.5;
    return Math.abs(middle-gate.x)<gate.half+5.28+.25 && (from.z-gate.z)*(to.z-gate.z)<=0 && Math.abs(to.z-from.z)>.000001;
};
function createCityAdditions(scene) {
    const view=makeView(scene);let s=initial(),gameTable=null;
    const newRuntime=()=>({signal:0,signalAt:0,phaseAt:0,walkerZ:35.94,walkerGoal:35.94,guideIndex:0,paired:false,
        guide:{x:route[0][0],z:route[0][1],yaw:0},itemTime:0,poseMode:'',poseEnd:0,holdEnd:0,
        sitting:false,slipAt:-30,slip:0,lastSpeed:0,scan:0,previousYaw:0,entered:false,outOfQueueAt:0});
    let r=newRuntime();
    function announce(ctx,line){ctx.notify(line)}
    const note=(ctx,line)=>{ctx.record?.(line);announce(ctx,line)};
    function mode(ctx,id,seconds){r.poseMode=id;r.poseEnd=ctx.sim.elapsed+seconds;r.itemTime=ctx.sim.elapsed}
    function guideStart(ctx,pair){
        r.paired=pair;s.guide='walking';r.guideIndex=1;
        r.guide={x:route[0][0],z:route[0][1],yaw:0,speed:0};
        announce(ctx,pair?'Клавдия берёт вас под руку. Любая клавиша движения отпустит руку.':'Клавдия пойдёт к дому № 23. На развилках она подождёт.');
    }
    function guideTick(ctx){
        const g=r.guide,walking=s.guide==='walking';let pose={};
        if(s.guide==='home'){g.x=passageFront.x-.77;g.z=passageFront.z+1.6}
        if(walking&&r.guideIndex<route.length){
            const [tx,tz]=route[r.guideIndex],dx=tx-g.x,dz=tz-g.z,len=Math.hypot(dx,dz);
            const wait=!within(ctx.player,g.x,g.z,4.5)||len<.36&&r.guideIndex%3===0&&!within(ctx.player,g.x,g.z,2);
            g.speed=0;
            if(!wait&&len>.10){
                const dt=Math.max(.001,ctx.dt),advance=Math.min(len,dt*.93),oldX=g.x,oldZ=g.z;
                const n=walkSlide({x:g.x,z:g.z,y:W.groundHeight(g.x,g.z)},dx/len*advance,dz/len*advance,.24,W.groundHeight(g.x,g.z),ctx.sim.cars,[]);
                g.x=n.x;g.z=n.z;g.speed=Math.hypot(n.x-oldX,n.z-oldZ)/dt;
                if(g.speed>.08)g.yaw=Math.atan2(-dx,-dz);
            }
            if(wait||g.speed<.04){g.yaw=Math.atan2(g.x-ctx.player.x,g.z-ctx.player.z);pose={conversation:true,nod:.75}}
            if(len<.26&&!wait){
                if(++r.guideIndex===route.length){
                    s.guide='home';r.paired=false;note(ctx,'Клавдия довела до № 23. Зелёная дверь рядом ведёт в сквозной подъезд.');
                }
            }
        }else g.speed=0;
        if(r.paired&&(!street(ctx)||ctx.sim.neighbourhoodReleasePair||!within(ctx.player,g.x,g.z,7)))r.paired=false;
        ctx.sim.neighbourhoodReleasePair=false;
        ctx.sim.neighbourhoodCompanion=r.paired?{x:g.x+.66,z:g.z+.21}:null;
        view.actor('guide',g,ctx,pose);
    }
    function signalTick(ctx){
        const now=ctx.sim.elapsed, cars=ctx.sim.cars;
        if(r.signal===1&&now-r.signalAt>1.4){
            const occupied=cars.some(c=>Math.abs(c.x-37.5)<3.8&&Math.abs(c.z-30)<4.45);
            if(!occupied){r.signal=2;r.phaseAt=now;r.walkerGoal=r.walkerZ>30?24.2:35.94}
            else if(now-r.signalAt>36){r.signal=0;if(within(ctx.player,37.5,30,12))announce(ctx,'Переход занят машиной. Запрос погашен, кнопку можно нажать снова.')}
        }
        if(r.signal===2&&Math.abs(r.walkerZ-r.walkerGoal)>.02){
            const sign=Math.sign(r.walkerGoal-r.walkerZ),delta=sign*Math.min(Math.abs(r.walkerGoal-r.walkerZ),1.43*ctx.dt);
            const next=walkSlide({x:38.43,z:r.walkerZ},0,delta,.26,W.groundHeight(38.43,r.walkerZ),cars,[]);
            r.walkerZ=next.z;
        }
        const enRoute=r.walkerZ>24.5&&r.walkerZ<35.6;
        if(r.signal===2&&now-r.phaseAt>10.5&&!enRoute)r.signal=0;
        if(r.signal===2&&now-r.phaseAt>27&&enRoute){
            // A vehicle left across the stripe blocks the reserved route. Return to the accessible side.
            r.walkerGoal=r.walkerZ>30?35.94:24.2;
            if(now-r.phaseAt>38){r.walkerZ=r.walkerGoal;r.signal=0}
        }
        ctx.sim.neighbourhoodSignal=r.signal;
        view.actor('crosser',{x:38.43,z:r.walkerZ,yaw:r.walkerGoal<r.walkerZ?0:Math.PI,speed:r.signal===2&&enRoute?1.43:0},ctx);
    }
    function update(ctx){
        const m=ctx.minutes,now=ctx.sim.elapsed,dt=Math.max(0,ctx.dt||0),p=ctx.player;
        if(s.lastMinute>=0&&s.lastMinute-m>360)s.night++;
        s.lastMinute=m;
        const outside=ctx.zone==='street';
        const vendor=ctx.people?.get('inna');
        if(vendor)vendor.root.userData.inspectFind=outside&&s.findShown&&r.poseMode==='show'&&r.poseEnd>now;
        const nearLift=ctx.zone==='house'&&s.favour&&s.item==='box'&&
            (within(p,-2.36,6.31,4.4)||within(p,-2.40,-5.68,4.4));
        view.indoor(ctx,nearLift,nearLift?(p.z<0?'landing':'foyer'):null);
        if(s.liftHelp&&ctx.zone==='house'&&s.item==='box'){
            const lift=ctx.sim.home.lift;
            if(lift.car===s.liftHelp&&lift.phase==='open'){
                s.repaid=true;s.liftHelp='';
                announce(ctx,'Кабина открыта. Соседка придерживает дверь для вашей коробки.');
            }else if(lift.phase==='open'||lift.phase==='shut')ctx.sim.home.callLift(s.liftHelp);
        }
        if(!outside){
            ctx.sim.neighbourhoodSignal=0;ctx.sim.neighbourhoodCompanion=null;
            ctx.sim.neighbourhoodPose=s.item&&s.item!=='bag-ground'?{item:s.item,action:'',progress:0,curb:0,look:0,slip:0,queue:0,turn:0,oneHand:true,door:0}:null;
            r.paired=false;r.sitting=false;ctx.sim.neighbourhoodSeated=false;ctx.sim.neighbourhoodShelf=false;
            ctx.sim.neighbourhoodDoor=0;ctx.sim.home.neighbourHold=0;ctx.sim.cityExtraGoals=null;view.update(ctx,s,r);return;
        }
        guideTick(ctx);signalTick(ctx);
        const byDoor=within(p,-34.96,17,3.1);
        const hold=Math.max(0,r.holdEnd-now);
        ctx.sim.neighbourhoodDoor=byDoor&&hold>0?Math.min(1,(3.7-hold)*3,hold*3):0;
        ctx.sim.home.neighbourHold=ctx.sim.neighbourhoodDoor;
        if(r.holdEnd>0&&hold===0&&!r.entered){
            r.entered=true;
            if(!ctx.sim.home.inside&&ctx.sim.home.hint(ctx.player)&&within(p,-34.96,17,1.55))
                ctx.sim.home.begin(ctx.player,point=>clearDisc(point,.31,0,ctx.sim.cars));
        }
        if(hold>0){const t=smooth((3.7-hold)/3.1);view.actor('neighbour',{x:-34.58-.30*t,z:18.60-2.95*t,yaw:0,speed:.90},ctx,{carry:'parcel'})}
        else if(!s.favour)view.actor('neighbour',{x:-33.68,z:18.44,yaw:.48,speed:0},ctx,{carry:'parcel'});
        else view.hideActor('neighbour');
        if(s.queue==='waiting'&&!within(p,28.7,23.9,5.1)){if(!r.outOfQueueAt)r.outOfQueueAt=now;else if(now-r.outOfQueueAt>2){s.queue='none';announce(ctx,'Очередь продвинулась. Ваше место заняли.')}}
        else r.outOfQueueAt=0;
        if(s.queue==='held'&&now>s.servedAt+90)s.queue='none';
        if(s.queue==='waiting'||s.queue==='held'){
            const remaining=s.servedAt-now;
            ctx.sim.cityExtraGoals={
                'shop-0':remaining>7?{x:27.4,z:21.96}:{x:24.1,z:23.01},
                'shop-2':remaining>7?{x:28.55,z:22.63}:remaining>0?{x:27.4,z:21.96}:{x:26.17,z:23.5}
            };
        }else ctx.sim.cityExtraGoals=null;
        const wet=ctx.weather?.wet>.48;
        view.actor('bench',{x:wet?14.7:-6,z:wet?21.88:17.39,yaw:Math.PI,speed:0},ctx,wet?{}:{seated:1,seatHeight:.43});
        view.actor('driver',{x:-42.15,z:45.81,yaw:1.86,speed:0},ctx,{conversation:within(p,-43.2,45.3,7),nod:.36});
        if(m>=420&&m<1080)view.actor('foreman',{x:-41.78,z:44.6,yaw:.68,speed:0},ctx);
        else view.hideActor('foreman');
        const dayShift=m>=420&&m<960;
        view.actor(dayShift?'dayGuest':'nightGuest',{x:-36.62,z:1.15,yaw:Math.PI,speed:0},ctx,{seated:1,seatHeight:.44});
        view.hideActor(dayShift?'nightGuest':'dayGuest');
        if(ctx.car&&within(p,30,28,16)&&evening(m)&&s.visitDay!==s.night){
            s.visits=s.carId===ctx.car.id?s.visits+1:1;s.carId=ctx.car.id;s.visitDay=s.night;
            if(s.visits>=2)announce(ctx,'Инна машет из-под навеса: «Твою машину я уже у поворота узнала!»');
        }
        if(!street(ctx)){r.sitting=false;r.poseMode=''}
        if(r.sitting&&!within(p,-28,17.52,1.1))r.sitting=false;
        ctx.sim.neighbourhoodSeated=r.sitting;ctx.sim.neighbourhoodShelf=r.poseEnd>now&&r.poseMode==='shelf';
        const signalDist=Math.min(Math.hypot(p.x-37.5,p.z-24.4),Math.hypot(p.x-37.5,p.z-35.65));
        const nearQueue=within(p,28.8,23.3,3.2)&&ctx.sim.people.some(n=>n.role!=='vendor'&&within(p,n.x,n.z,1.05));
        let roadLook=0;
        if(signalDist<2.5&&p.speed<2.6){
            const facing=-Math.cos(p.yaw),across=p.z>30?-1:1;
            if(facing*across>.38){
                const traffic=ctx.sim.cars.find(c=>Math.abs(c.z-(30+(p.z>30?1.95:-1.95)))<1.5&&
                    Math.abs(c.x-p.x)<17&&Math.abs(c.x-p.x)>1.4&&(p.x-c.x)*-Math.sin(c.yaw)>0);
                const towards=traffic?Math.atan2(p.x-traffic.x,p.z-traffic.z):Math.atan2(p.z>30?1:-1,0);
                roadLook=Math.max(-.91,Math.min(.91,wrap(towards-p.yaw)));
            }
        }
        r.scan+=(roadLook-r.scan)*(1-Math.exp(-dt*6));
        const curb=W.groundHeight(p.x,p.z)-W.groundHeight(p.x-Math.sin(p.yaw)*.55,p.z-Math.cos(p.yaw)*.55);
        const twist=Math.abs(wrap(p.yaw-r.previousYaw));r.previousYaw=p.yaw;
        if(street(ctx)&&p.speed>2.2&&now-r.slipAt>8&&(twist>.10||r.lastSpeed-p.speed>.30)&&ctx.weather&&roadIceAt(p.x,p.z,ctx.weather)>.36){r.slipAt=now;r.slip=Math.min(1,p.speed/5)}
        r.lastSpeed=p.speed;
        const turn=smooth(twist/Math.max(.015,dt)*.30),timed=r.poseEnd>now?r.poseMode:'';
        const item=ctx.parcels?.held?'':s.item||(s.umbrella==='held'?'umbrella':'');
        ctx.sim.neighbourhoodPose=street(ctx)?{item,action:timed,progress:timed?smooth((now-r.itemTime)/Math.max(.01,r.poseEnd-r.itemTime)):0,
            seat:r.sitting,door:ctx.sim.neighbourhoodDoor,queue:nearQueue?1:0,look:r.scan,
            curb:smooth(curb/.13),slip:r.slip*smooth(1-(now-r.slipAt)/.76),turn,oneHand:byDoor||!!ctx.sim.home.door}:null;
        view.update(ctx,s,r);
    }
    function actions(ctx){
        const a=[],p=ctx.player,now=ctx.sim.elapsed,m=ctx.minutes;
        const at=(x,z,d=2.4)=>within(p,x,z,d);
        const add=(id,label)=>a.push({id,label});
        if(ctx.zone==='house'&&s.favour&&!s.repaid&&!s.liftHelp&&s.item==='box'&&ctx.sim.home.liftStop?.()){add('repay','Попросить соседку придержать лифт');return a}
        if(!street(ctx))return a;
        if(at(39.1,24.8,2.35)||at(39.1,36.2,2.35))if(!r.signal)add('cross','Запросить пешеходную фазу');
        if(at(-19.5,17.6,2.8)&&!s.alias)add('alias','Спросить, где раньше была прачечная');
        if(at(-21.1,8.6,2.5))add('outline','Рассмотреть следы снесённого дома');
        if(at(27.15,21.17,2.15))add('radio','Осмотреть приёмник в витрине');
        if(at(-25.9,20.7,2.5))add('yard','Собрание жильцов · обустроить двор');
        if(at(-12.8,18.6,2.7)&&!s.clockFound)add('meet','Спросить, где встречаются после смены');
        if(s.clockSeen&&!s.clockFound&&at(19.85,21.50,2.9))add('clock','Встреча под сломанной стрелкой');
        if(at(marketWalkway.crossing.x,marketWalkway.crossing.z,3.8)&&p.y>5.5&&!s.upper)add('above','Сверить сверху номера секций рынка');
        if(s.upper&&!s.lower&&at(34.2,21.65,2.5))add('below','Найти секцию по схеме крыш');
        if(at(gate.x,gate.z,4))add('gate','Прочитать часы прохода');
        if(at(-34.96,17,2.1)&&!s.favour&&holdReady())add('door','Придержать дверь для соседки с коляской');
        if(at(27.95,22.9,2.4)&&!s.item&&s.umbrella!=='held'&&!ctx.parcels?.held)add('tea','Взять горячий чай у продавщицы');
        if(s.item==='tea')add('drink','Допить чай и убрать стакан');
        if(at(35.08,21.53,1.56)&&!s.item&&s.umbrella!=='held'&&!ctx.sim.neighbourhoodShelf&&!ctx.parcels?.held){
            add('packet','Снять с полки лёгкую посылку');add('box','Снять тяжёлую коробку с полки');add('rail','Взять длинную рейку с полки');
        }
        if(['rail','packet','box'].includes(s.item)&&at(35.08,21.53,2.4))add('return','Вернуть груз на полку');
        if(at(-28,17.54,1.85)&&(!s.item||s.item==='bag'||s.item==='bag-ground')){
            if(!r.sitting)add('sit',s.item==='bag'?'Поставить пакет и сесть':'Сесть на скамью');else add('stand','Встать со скамьи');
            if(s.item==='bag-ground'&&!r.sitting)add('bag','Забрать пакет между ботинками');
            if(s.item==='bag'&&!r.sitting)add('bagaway','Сложить покупки в сумку');
        }
        if(!s.find&&at(-35.42,.80,2))add('find','Поднять найденный эмалевый значок');
        if(s.find&&!s.findShown&&ctx.sim.people.some(n=>n.role==='vendor'&&within(p,n.x,n.z,2.4)))add('show','Показать Инне значок на ладони');
        if(at(28.7,23.9,3.15)){
            if(s.queue==='none')add('queue','Спросить, кто последний');
            if(s.queue==='waiting'&&now<s.servedAt)add('hold','Попросить придержать очередь');
            if(s.queue==='held')add('rejoin','Вернуться на своё место');
            if(s.queue==='waiting'&&now>=s.servedAt)add('serve','Забрать заказ, когда подошла очередь');
        }
        if(at(-36.65,1.84,2.6)||(s.yard==='domino'&&at(-25.9,20.96,2.5)))add('domino','Сыграть партию в дворовое домино');
        if(at(15.86,21.82,2.2)&&s.umbrella==='stand'&&!s.item)add('umbrella','Одолжить зонт с рыжей заплаткой');
        if(s.umbrella==='held'&&at(27.9,21.55,2.2))add('umbrella-return','Оставить зонт у рынка');
        if(s.umbrella==='returned'&&at(27.9,21.55,2.2))add('umbrella-look','Узнать зонт по заплатке');
        if(at(-43.2,45.3,4))add('chat','Послушать разговор у мастерской');
        if(s.guide==='stop'&&within(p,r.guide.x,r.guide.z,3)){add('guide','Попросить показать проход к дому № 23');add('pair','Идти под руку с Клавдией')}
        if(r.paired)add('release','Отпустить руку');
        if((at(-6,17.2,2.4)||at(13.8,21.58,2.4))&&s.guide!=='walking')add('bench-neighbour','Узнать, где сегодня ждут трамвая');
        if(evening(m)&&at(-6.4,18.45,4.1))add('window','Посмотреть, что чинит сосед у окна');
        return a;
    }
    function holdReady(){return r.holdEnd===0}
    function act(id,ctx){
        if(!actions(ctx).some(a=>a.id===id))return false;
        const now=ctx.sim.elapsed;
        switch(id){
            case 'cross':r.signal=1;r.signalAt=now;ctx.sim.neighbourhoodSignal=1;announce(ctx,'Запрос принят. Дождитесь зелёной линзы.');break;
            case 'alias':s.alias=true;ctx.addMapPin?.(-34.96,17,'Бывшая прачечная');note(ctx,'Двор зовут «Прачечной». В сквозной подъезд входили прачки со стороны Канальной.');break;
            case 'outline':note(ctx,'Низкая крыша упиралась в панельку. На месте синей плитки была кухня, за кирпичной кладкой — её дверь.');break;
            case 'radio':announce(ctx,ctx.minutes<660?'Инна сняла крышку: рядом с корпусом приёмника лежит плата.':ctx.minutes<1080?'Приёмник собран. Инна включила его для проверки.':'На собранном приёмнике висит бирка «Готово к выдаче».');if(ctx.minutes>=660&&ctx.minutes<1080)ctx.sim.emit?.('sound','notify');break;
            case 'yard':ctx.choose('Что поставить во дворе?', [['domino','Стол для домино'],['racks','Велостойку'],['line','Бельевую площадку']].map(([key,label])=>({label,run:()=>{s.yard=key;note(ctx,'Решение жильцов: '+label+'. Во дворе появилось новое оборудование.')}})));break;
            case 'meet':s.clockSeen=true;note(ctx,'После смены встречаемся у часов со сломанной минутной стрелкой. Ищи их рядом с остановкой.');break;
            case 'clock':s.clockFound=true;note(ctx,'Вы узнали часы без метки. Клавдия передала записку для соседей.');break;
            case 'above':s.upper=true;note(ctx,'Сверху видно секцию выдачи: второй навес, люк с синей крышкой. Внизу отыщите полку мастера.');break;
            case 'below':s.lower=true;note(ctx,'Полка мастера стоит под вторым навесом. Обзор с моста совпал с номером секции.');break;
            case 'gate':announce(ctx,ctx.minutes>=900&&ctx.minutes<1260?'Калитка открыта до девяти вечера.':'Калитка закрыта. Обойти ограду можно с востока. Работает с 15:00 до 21:00.');break;
            case 'door':s.favour=true;r.holdEnd=now+3.7;mode(ctx,'door',3.7);note(ctx,'Соседка проходит с коляской. Она запомнила вашу помощь.');break;
            case 'repay':s.liftHelp=ctx.sim.home.liftStop();ctx.sim.home.callLift(s.liftHelp);
                note(ctx,'Соседка нажала вызов: «Вы нам уже помогли. Держите коробку, я дождусь лифта».');break;
            case 'tea':s.item='tea';break;
            case 'drink':s.item='';announce(ctx,'Вы допили чай.');break;
            case 'box':case 'rail':case 'packet':
                s.item=id;mode(ctx,'shelf',id==='box'?2.15:id==='rail'?1.42:1.1);
                ctx.player.yaw=Math.atan2(ctx.player.x-35.45,ctx.player.z-20.43);break;
            case 'return':s.item='';r.poseEnd=0;break;
            case 'sit':if(s.item==='bag')s.item='bag-ground';r.sitting=true;Object.assign(ctx.player,{x:-28,z:17.48,yaw:Math.PI,speed:0});ctx.sim.pedestrian?.reset();break;
            case 'stand':r.sitting=false;Object.assign(ctx.player,{x:-28,z:17.95,speed:0});if(s.item==='bag-ground')announce(ctx,'Пакет остался у скамьи.');break;
            case 'bag':s.item='bag';break;
            case 'bagaway':s.item='';break;
            case 'find':s.find=true;note(ctx,'У ступеней найден значок с цифрой 07. Инна разбирается в старых знаках.');break;
            case 'show':s.findShown=true;mode(ctx,'show',3.1);note(ctx,'Инна наклоняется к значку: «Это знак первой смены трамвайного депо».');break;
            case 'queue':s.queue='waiting';s.servedAt=now+12;announce(ctx,'Перед вами два покупателя. Последняя женщина запомнила вас.');break;
            case 'hold':s.queue='held';announce(ctx,'«Запомнила. Идите, подожду немного».');break;
            case 'rejoin':s.queue='waiting';announce(ctx,'Соседка пропускает вас на прежнее место.');break;
            case 'serve':s.queue='none';if(!s.item)s.item='bag';announce(ctx,'Продавщица передала небольшой пакет с заказом.');break;
            case 'domino':domino(ctx);break;
            case 'umbrella':s.umbrella='held';announce(ctx,'На ручке зонта бирка «Вернуть на Спектр».');break;
            case 'umbrella-return':s.umbrella='returned';note(ctx,'Зонт с заплаткой теперь ждёт следующего человека у рынка.');break;
            case 'umbrella-look':announce(ctx,'Рыжая заплатка на том самом зонте. К ручке привязана записка «Спасибо».');break;
            case 'chat':{
                const late=ctx.minutes>=1080||ctx.minutes<420;
                announce(ctx,late?'Начальник ушёл. Водитель: «Я подменю тебя утром. Съезди к дочке».':'Начальник смены рядом. Механик: «По графику машина будет к семи». Подойдите вечером, когда останутся вдвоём.');break;}
            case 'guide':case 'pair':guideStart(ctx,id==='pair');break;
            case 'release':r.paired=false;break;
            case 'bench-neighbour':announce(ctx,ctx.weather?.wet>.48?'Скамья мокрая. Житель пережидает морось под крышей остановки.':'Скамья сухая. Сосед ждёт на привычном месте у дома № 24.');break;
            case 'window':announce(ctx,s.night>=2?'Починенная лампа загорается. У соседки напротив получается полный поворот.':'За одним стеклом учат поворот, за соседним мастер проверяет настольную лампу.');break;
        }
        return true;
    }
    function domino(ctx){
        const d=gameTable??=dominoRules.start(s.game);
        const guest=ctx.minutes<960?'Галина':'Петрович';
        const finish=()=>{
            const yours=dominoRules.score(d.player),other=dominoRules.score(d.guest);
            const outcome=yours<other?'Вы выиграли':yours>other?'Победа за соседом':'Ничья';
            s.game++;gameTable=null;
            note(ctx,outcome+' · осталось очков '+yours+':'+other+'. '+guest+': «У бывшей прачечной открыт проход к следующему двору».');
        };
        const reply=passed=>{
            if(!d.player.length){finish();return}
            let moves=dominoRules.moves(d,d.guest);
            while(!moves.length&&d.stock.length){d.guest.push(d.stock.pop());moves=dominoRules.moves(d,d.guest)}
            if(!moves.length&&passed){finish();return}
            if(moves.length){
                const m=moves.reduce((a,b)=>dominoRules.score([a.tile])>=dominoRules.score([b.tile])?a:b);
                dominoRules.play(d,d.guest,m);
                if(!d.guest.length){finish();return}
            }
            domino(ctx);
        };
        const choices=dominoRules.moves(d,d.player).map(m=>({label:dominoRules.label(m.tile)+' к '+d[m.side]+(m.side==='left'?' слева':' справа'),
            run:()=>{if(dominoRules.play(d,d.player,m))reply(false)}}));
        if(!choices.length)choices.push(d.stock.length?
            {label:'Взять кость с базара ('+d.stock.length+')',run:()=>{d.player.push(d.stock.pop());domino(ctx)}}:
            {label:'Пропустить ход',run:()=>reply(true)});
        ctx.choose(guest+' · на столе '+d.left+' … '+d.right+' · у вас '+d.player.map(dominoRules.label).join(', '),choices);
    }
    function agenda(ctx){
        const entries=[],add=(title,goal)=>entries.push({title,goal});
        if(s.umbrella==='held')add('Одолженный зонт','Оставить зонт с рыжей заплаткой у западного прилавка «Спектра».');
        if(s.clockSeen&&!s.clockFound)add('Встреча после смены','Найти у остановки часы со сломанной минутной стрелкой.');
        if(s.queue==='held')add('Место в очереди','Вернуться к покупателям у Инны, пока соседка держит ваше место.');
        if(s.queue==='waiting')add('Заказ у Инны',ctx.sim.elapsed>=s.servedAt?'Подойти к прилавку и забрать готовый заказ.':'Подождать у покупателей. Перед уходом можно попросить придержать очередь.');
        if(s.guide==='walking')add('Дорога с Клавдией','Идти за Клавдией к зелёному сквозному подъезду № 23.');
        if(s.upper&&!s.lower)add('Секция выдачи','Сойти с моста и найти полку под вторым рыночным навесом.');
        if(s.find&&!s.findShown)add('Значок 07','Показать Инне эмалевый значок, найденный у ступеней.');
        if(s.liftHelp)add('Помощь с коробкой','Дождаться соседки у вызванного лифта в доме № 23.');
        if(s.item==='bag-ground')add('Пакет у скамьи','Забрать оставленные покупки у скамьи во дворе № 23.');
        return entries;
    }
    return {update,actions,act,agenda,save:()=>({...s,domino:gameTable?structuredClone(gameTable):null,guideTrip:s.guide==='walking'?{index:r.guideIndex,x:r.guide.x,z:r.guide.z,yaw:r.guide.yaw}:null}),
        restore(raw){s=initial();r=newRuntime();gameTable=null;if(!raw||typeof raw!=='object')return;
            if(dominoRules.valid(raw.domino))gameTable=structuredClone(raw.domino);
            for(const [key,start] of Object.entries(s))if(typeof raw[key]===typeof start&&(typeof start!=='number'||Number.isFinite(raw[key])))s[key]=raw[key];
            if(!['none','held','waiting'].includes(s.queue))s.queue='none';
            if(s.guide==='walking'){
                const trip=raw.guideTrip;
                if(trip&&Number.isInteger(trip.index)&&trip.index>0&&trip.index<route.length&&
                    [trip.x,trip.z,trip.yaw].every(Number.isFinite)&&within(trip,...route[trip.index],6.8)){
                    r.guideIndex=trip.index;r.guide={x:trip.x,z:trip.z,yaw:trip.yaw,speed:0};
                }else s.guide='stop';
            }else if(!['home','stop'].includes(s.guide))s.guide='stop';
        }};
}
exports.createCityAdditions=createCityAdditions;
