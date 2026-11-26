"use strict";
const { equipment }=require("./vehicle-road.js");
const { specs }=require("./vehicle-cabin.js");
const { clearDisc }=require("./collision.js");
const sites={
    market:[30,25.5],garage:[-43,43],depot:[10,-38],cafe:[-101,38.84],
    yard:[-34.96,17],mill:[191,677],dock:[14.1,57.7],park:[32.9,35.65]
};
exports.sites=sites;
const near=(p,a,r)=>Math.hypot(p.x-a[0],p.z-a[1])<r;
const carCapacity={hatch:[.95,70],coupe:[.88,50],sedan:[1.24,95],taxi:[1.2,75],wagon:[2.2,220],van:[2.65,570],pickup:[2.35,460],suv:[1.7,185],utility:[1.45,240],towtruck:[1.6,190]};
const parcels=[
    {id:'beam',label:'Направляющая для депо',length:1.85,kg:42,to:'depot',close:22,pay:92},
    {id:'chairs',label:'Столярный ящик для кафе',length:.82,kg:34,to:'cafe',close:23,pay:74}
];
const connectors=[
    {request:'У разъёма две круглые ножки, паза нет.',answer:'Двухконтактный круглый'},
    {request:'Три штырька треугольником, ключ снизу.',answer:'Трёхконтактный с ключом'},
    {request:'Пять контактов полукругом под металлическим кожухом.',answer:'Пятиконтактный полукруглый'}
];
const absTime=(s,c)=>s.days*1440+c.minutes;
function spend(c,n){if(c.sim.money<n){c.notify('Нужно '+n+' ₽. Средства можно заработать за прилавком.');return false;}c.sim.money-=n;return true;}
function payable(c,n,msg){c.sim.money+=n;c.notify(msg+'  +'+n+' ₽');}
function loadingCar(c){
    if(c.car)return Math.abs(c.car.speed)<.28?c.car:null;
    let best=null,gap=6;
    for(const car of c.sim.cars){if(car.auto||car.police||Math.abs(car.speed)>.28)continue;
        const d=Math.hypot(c.player.x-car.x,c.player.z-car.z);
        if(d<gap){best=car;gap=d;}
    }
    return best;
}
exports.loadingCar=loadingCar;
function availableRoom(c,car){
    const sp=specs[car.kind],sx=Math.sin(car.yaw),sz=Math.cos(car.yaw);
    const p={x:car.x+sx*(sp.rear+.76),z:car.z+sz*(sp.rear+.76)};
    return !car.carriedBy&&!car.carrying&&clearDisc(p,.35,car.y,c.sim.cars,car);
}
function openRear(c,car){
    const sys=equipment(car);
    if(!sys.boot&&Math.max(sys.dents.rearLeft||0,sys.dents.rearRight||0)>.55){c.notify('Задняя панель помята. Перед погрузкой нужно освободить замок.');return false;}
    if(!availableRoom(c,car)){c.notify('За задней дверью мало места. Остановитесь дальше от стены или другого автомобиля.');return false;}
    sys.boot=true;return true;
}
exports.openRear=openRear;
exports.workRows=function(s,ctx,site){
    const rows=[];
    const add=(label,run)=>rows.push({label,run});
    const c=ctx, day=s.days, now=absTime(s,c),car=loadingCar(c);
    if(site==='market'){
        if(!s.spool)add('Катушка с кабелем · залог 18 ₽',()=>{
            if(s.spool||!spend(c,18))return;
            s.spool='full';c.record('Катушка Инны: 18 ₽ залога. Кабель годится для дворового фонаря.');c.notify('Инна выдала кабель и записала залог.');
        });
        if(s.spool==='empty')add('Вернуть пустую катушку',()=>{if(s.spool!=='empty')return;s.spool='';payable(c,18,'Катушка принята. Возврат залога');});
        const customer=connectors[s.customers%connectors.length];
        add('Подменить Инну у лотка с разъёмами',()=>c.choose(customer.request,connectors.map(x=>({label:x.answer,run:()=>{
            if(x.answer!==customer.answer){c.notify('Клиент показывает старый штекер: форма или число ножек отличаются.');return;}
            if(customer!==connectors[s.customers%connectors.length])return;
            s.customers++;payable(c,12,'Штекер подошёл');
        }}))));
        if(!s.repairQuote)add('Согласовать смету на приёмник',()=>c.choose('Клиент может подождать или принять временный ремонт',[
            {label:'Перепаять контакт сейчас · оплата 18 ₽',run:()=>{if(s.repairQuote)return;s.repairQuote={due:now+3,fee:18};c.notify('Смета подписана. Вернитесь через три игровые минуты.');}},
            {label:'Заказать заводское гнездо · оплата 48 ₽',run:()=>{if(s.repairQuote)return;s.repairQuote={due:now+85,fee:48};c.notify('В квитанции записаны цена и срок — через 85 игровых минут.');}}
        ]));
        else if(now>=s.repairQuote.due)add('Выдать приёмник по смете',()=>{if(!s.repairQuote||now<s.repairQuote.due)return;const fee=s.repairQuote.fee;s.repairQuote=null;payable(c,fee,'Клиент забрал отремонтированный приёмник');});
        else add('Проверить квитанцию на ремонт',()=>c.notify('Осталось '+(s.repairQuote.due-now)+' игровых минут · цена '+s.repairQuote.fee+' ₽'));
        if(!s.fitting)add('Обменять работу на плафон для арки',()=>{if(s.fitting)return;s.fitting=true;c.notify('Вы рассортировали старые лампы. Инна отдала исправный плафон.');});
    }
    if(site==='loading'||site==='market'){
        add('Накладные на попутные заказы',()=>c.choose('Загрузка у кармана • часы получателей',parcels.map(p=>({
            label:p.label+' · '+p.length+' м · '+p.kg+' кг · до '+p.close+':00',run:()=>{
                if(s.deliveries[p.id]){c.notify('Этот заказ уже в кузове.');return;}
                if(site==='market'){
                    c.addMapPin(...sites.park,'Загрузка попутных заказов');
                    c.notify('Размер и срок сверены. Для погрузки подойдите к машине в кармане напротив зебры.');
                    return;
                }
                const truck=c.car||loadingCar(c);
                if(!truck||truck.auto||truck.police||Math.abs(truck.speed)>.2||!near(truck,sites.park,4.7)){c.notify('Поставьте машину в размеченный карман у зебры.');return;}
                const [length,kg]=carCapacity[truck.kind]||[1,60];
                const used=parcels.reduce((n,item)=>n+(s.deliveries[item.id]===truck.id?item.kg:0),0)+equipment(truck).load;
                if(p.length>length||p.kg+used>kg){c.notify('Не помещается. Полезная длина '+length+' м, свободно '+Math.max(0,Math.round(kg-used))+' кг.');return;}
                if(!openRear(c,truck))return;
                s.deliveries[p.id]=truck.id;s.strapped[truck.id]=false;
                c.addMapPin(...sites[p.to],p.label);c.record(p.label+' — до '+p.close+':00, оплата '+p.pay+' ₽.');
                c.notify('Ящик погружен. Подойдите к задней двери, чтобы затянуть ремень.');
            }
        }))));
    }
    for(const p of parcels)if(p.to===site&&s.deliveries[p.id])add('Разгрузить: '+p.label,()=>{
        const truck=c.sim.cars.find(v=>v.id===s.deliveries[p.id]);
        if(!truck||!near(truck,sites[site],12)||Math.abs(truck.speed)>.28){c.notify('Подгоните машину с этим грузом к получателю.');return;}
        if(c.minutes<7*60||c.minutes>=p.close*60){c.notify('Приёмка открыта с 07:00 до '+p.close+':00. Заказ остаётся в машине.');return;}
        if(!openRear(c,truck))return;
        delete s.deliveries[p.id];payable(c,p.pay,'Получатель расписался');
    });
    if(site==='garage'){
        if(!s.tool)add('Взять редкий ключ напрокат · залог 15 ₽',()=>{
            if(s.tool||!spend(c,15))return;s.tool={due:now+100};c.notify('Ключ выдан на 100 игровых минут. Затем его ждёт другой мастер.');
        });
        else add('Вернуть ключ в инструментальную',()=>{
            if(!s.tool)return;const late=now>s.tool.due;s.tool=null;payable(c,late?7:15,late?'Следующему мастеру пришлось ждать. Остаток залога':'Ключ вернулся вовремя');
        });
        if(s.chairJob&&s.chairs<7&&!s.chairReady&&s.lastChair!==day)add('Починить стул для «Горячего льда»',()=>{
            if(!s.tool){c.notify('Для старого крепежа нужен ключ из инструментальной.');return;}
            if(s.lastChair===day||s.chairReady)return;
            s.lastChair=day;s.chairReady=true;c.notify('Сиденье закреплено. Доставьте готовый стул в кафе.');
        });
        if(s.spool==='empty')add('Оставить бобину для проводки гаража',()=>{if(s.spool!=='empty')return;s.spool='kept';s.shopLamp=true;c.notify('Бобина стала розеткой-удлинителем. Мастер включил переноску у верстака.');});
        if(s.signBlank)add('Расписать списанный указатель',()=>c.choose('Что написать над воротами?', ['КАНАЛЬНЫЙ','ПОПУТНЫЙ ГРУЗ','РЕМОНТ РАДИО'].map(label=>({label,run:()=>{
            if(!s.signBlank)return;s.sign=label;s.signBlank=false;c.record('В гараже висит старый трамвайный указатель «'+label+'».');
        }}))));
        if(s.lift){add('Обменять талон на работу у подъёмника',()=>{if(!car){c.notify('Подгоните машину к воротам.');return;} if(!s.lift)return;s.lift=false;car.health=Math.min(100,car.health+18);c.notify('Мастер выделил подъёмник. Ходовая обслужена.');});}
    }
    if(site==='depot'&&!s.signBlank&&!s.sign)add('Забрать списанный трамвайный указатель',()=>{s.signBlank=true;c.addMapPin(...sites.garage,'Переоборудовать указатель');c.notify('Табличка снята. В гараже её можно превратить в вывеску.');});
    if(site==='cafe'||site==='cafe-inside'){
        if(!s.chairJob)add('Принять недельный заказ на семь стульев',()=>{s.chairJob=true;c.record('Кафе ждёт семь стульев, по одному в игровой день. Нужен столярный ключ в гараже.');});
        if(s.chairReady)add('Поставить готовый стул в зале',()=>{if(!s.chairReady)return;s.chairReady=false;s.chairs++;payable(c,18,'В кафе готовы '+s.chairs+' из 7 стульев');});
        if(s.chairJob&&!s.chairReady)add('Проверить график столярных работ',()=>c.notify('В зале '+s.chairs+' из семи. '+(s.chairs===7?'Заказ выполнен.':s.lastChair===day?'Следующий стул — завтра.':'Сегодня можно заняться новым стулом в гараже.')));
    }
    if(site==='yard'&&s.fund<3){
        if(!(s.contributed&1))add('Фонарь у арки · внести 25 ₽',()=>{if(s.contributed&1||!spend(c,25))return;s.contributed|=1;s.fund++;c.notify('Ведомость двора: '+s.fund+' из 3 частей.');});
        if(!(s.contributed&2))add('Фонарь у арки · поставить плафон',()=>{if(s.contributed&2)return;if(!s.fitting){c.notify('У Инны на рынке есть плафон.');return;}s.fitting=false;s.contributed|=2;s.fund++;c.notify('Плафон установлен.');});
        if(!(s.contributed&4))add('Фонарь у арки · провести кабель',()=>{if(s.contributed&4)return;if(s.spool!=='full'){c.notify('Возьмите у Инны катушку с кабелем.');return;}s.spool='empty';s.contributed|=4;s.fund++;c.notify('Кабель подведён. Пустую бобину можно вернуть.');});
    }
    if(site==='dock')add('Разобрать снасти в обмен на услугу',()=>c.choose('Рыбак предлагает расчёт',[
        {label:'Переправа на южный причал',run:()=>{if(c.car){c.notify('Оставьте автомобиль на берегу.');return;}const target={x:10.8,z:96};if(!clearDisc(target,.34,0,c.sim.cars)){c.notify('Причал занят.');return;}Object.assign(c.sim.hero,target,{y:0,speed:0});c.notify('Рыбак подвёз вас к южному причалу.');}},
        {label:'Талон на час у гаражного подъёмника',run:()=>{s.lift=true;c.notify('Получен талон. Подгоните автомобиль в Канальный гараж.');}}
    ]));
    if(site==='mill'&&car){
        const id=car.id, weight=Math.round((950+specs[car.kind].w*170+(car.kind==='van'?540:0)+equipment(car).load)/2)*2;
        if(!s.weigh)add('Весовая · записать массу до погрузки',()=>{s.weigh={id,tare:weight,loaded:false};c.notify('Тара в журнале: '+weight+' кг.');});
        else if(s.weigh.id!==id)add('Уточнить машину в журнале весовой',()=>c.notify('Эта партия записана на другую машину. Вернитесь на ней к весам.'));
        else if(!s.weigh.loaded)add('Принять партию по накладной 180 кг',()=>{s.weigh.loaded=true;c.notify('Палета на платформе машины. Проверьте вес по журналу.');});
        else if(s.weigh.corrected)add('Сдать сверенную партию 180 кг',()=>{if(!s.weigh?.corrected)return;s.weigh=null;payable(c,26,'Весовщик принял партию 180 кг по накладной');});
        else add('Весовая · сверить накладную с весами',()=>{const w=s.weigh.tare;c.choose('Тара '+w+' кг · брутто '+(w+222)+' кг · накладная 180 кг',[
            {label:'Принять без расхождений',run:()=>c.notify('Весовщик предлагает пересчитать разницу.')},
            {label:'Вернуть ошибочный ящик 42 кг',run:()=>{if(!s.weigh?.loaded)return;s.weigh.corrected=true;c.notify('Ящик снят. На платформе осталась партия 180 кг для приёмки.');}}
        ]);});
    }
    return rows;
};
exports.loadKg=(s,id)=>parcels.reduce((kg,p)=>kg+(s.deliveries[p.id]===id?p.kg:0),0)+(s.weigh?.id===id&&s.weigh.loaded?(s.weigh.corrected?180:222):0);
