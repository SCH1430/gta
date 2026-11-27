"use strict";
const { linePose, tramStops, tramLocal, serviceCycle }=require("./world-railway.js");
const marks={'07':'● · ● / · ● ·','17Р':'● ● · / · · ●','17Д':'· ● ● / ● · ·'};
const title=id=>tramStops[id]?.title||'Депо';
function arrivals(t,stop) {
    const result=[];
    let old='';
    for(let step=0;step<serviceCycle+18&&result.length<3;step+=1){
        const p=linePose(t+step),key=p.stop===stop&&p.doors>.42?p.line:'';
        if(key&&key!==old)result.push(key+' → '+title(p.nextStop)+' · '+(step?'через '+step+' с':'у платформы'));
        old=key;
    }
    return result;
}
exports.nearStop=function(c){
    if(c.zone!=='street'||c.car)return '';
    const {x,z}=c.player,r=linePose(c.sim.tramTime);
    if(r.stop&&Math.hypot(x-r.x,z-r.z)<7.7)return r.stop;
    for(const [id,p] of Object.entries(tramStops))if(Math.hypot(x-p.x,z-p.z)<6.4)return id;
    return '';
};
exports.transitRows=function(s,c,stop){
    const rows=[],add=(label,run)=>rows.push({label,run});
    const sim=c.sim,r=linePose(sim.tramTime),rider=sim.tramRider,now=s.days*1440+c.minutes;
    if(!rider.onboard){
        add('Прочесть бумажную схему и ближайшие рейсы',()=>{
            if(sim.tramTime<0){c.notify('Движение откроют после ремонта стрелки. 07 — прямой. 17Д и 17Р соединяются у Мастерских.');return;}
            c.choose('07 без пересадки • 17 через ремонтный путь • Мастерские по требованию',arrivals(sim.tramTime,stop).map(label=>({label,run:()=>c.notify('На 17 закажите остановку до Мастерских. Для пересадки отметьте тот же талон.')})));
        });
        add(s.ticket&&s.ticket.until>now?'Проверить пересадочный талон':'Взять пересадочный талон на 60 минут',()=>{
            if(s.ticket&&s.ticket.until>now){c.notify('Осталось '+(s.ticket.until-now)+' мин • '+(s.ticket.lines.join(' + ')||'ещё без отметок'));return;}
            s.ticket={until:now+60,lines:[]};c.notify('Пробный пересадочный талон выдан. Компостер внутри вагона.');
        });
        if(r.stop===stop&&r.doors>.72){
            for(const door of [-3.3,3.3]){
                const at=tramLocal(r,2.05,door),d=Math.hypot(c.player.x-at.x,c.player.z-at.z);
                add((door<0?'Задняя':'Передняя')+' дверь · '+(d<2.7?'войти':'подойти '+Math.ceil(d)+' м'),()=>{
                    if(d>=2.7){c.addMapPin(at.x,at.z,door<0?'Задняя дверь трамвая':'Передняя дверь трамвая');c.notify('Подойдите к выбранной двери.');return;}
                    if((r.elapsedAtStop??6)<3.4){c.notify('Сначала дайте пассажирам выйти.');return;}
                    rider.onboard=true;rider.seat=false;rider.entryDoor=door;rider.boardingYaw=r.yaw;rider.entryProgress=0;rider.request=null;rider.last=r.stop;
                    rider.place(sim.hero,r);c.notify('Вы вошли через '+(door<0?'заднюю':'переднюю')+' дверь.');
                });
            }
        }
        if(stop==='depot'){
            add('Бюро находок · выдать сумку',()=>c.choose('«У моей ручка сшита зелёной ниткой»',[
                {label:'Серая сумка · новая пряжка',run:()=>c.notify('Пассажир не узнал сумку. Она остаётся в бюро.')},
                {label:'Серая сумка · зелёный шов на ручке',run:()=>{if(s.returnedBag){c.notify('Сумку уже забрали.');return;}s.returnedBag=true;c.record('Владелец забрал сумку с зелёным швом.');}},
                {label:'Синяя сумка · зелёная подкладка',run:()=>c.notify('Цвет подкладки совпал, а починка на ручке — нет.')}
            ]));
            add('Сверить найденный билет с журналом вагонов',()=>c.choose('Пробит рисунок «· ● ● / ● · ·». Журнал компостеров',Object.keys(marks).map(line=>({
                label:line+' • '+marks[line],run:()=>{if(line==='17Д'){s.traced=true;c.record('По рисунку компостера установлен вагон 17Д, Депо → Мастерские.');}else c.notify('Расположение отверстий отличается.');}
            }))));
            if(r.stop==='depot'&&r.elapsedAtStop<10&&!s.driverMessage)add('Передать следующей смене записку',()=>{
                s.driverMessage=true;c.record('Записка вошла в сменный журнал. Ответ будет на рыночной конечной.');c.notify('Водитель вложил её в журнал вместе с ключом от кабины.');
            });
        }
        if(stop==='market'&&s.driverMessage===true&&r.stop==='market')add('Забрать ответ следующей смены',()=>{s.driverMessage='delivered';c.record('Дежурный подтвердил сообщение, переданное с ключом в депо.');});
    } else {
        const line=r.line||'07';
        add(rider.seat?'Встать у прохода':'Сесть у левого окна',()=>{rider.seat=!rider.seat;rider.place(sim.hero,r);c.notify(rider.seat?'Вы у окна. У мастерских виден верх старой проходной.':'Вы стоите у прохода.');});
        if(!r.stop)add(rider.request?'Отменить запрос остановки':'Нажать кнопку выхода · '+title(r.nextStop),()=>{rider.request=rider.request?null:r.nextStop;c.notify(rider.request?'В салоне зажглась янтарная лампа «Выход».':'Запрос отменён.');});
        add('Вставить талон в компостер '+line,()=>{
            if(!s.ticket||s.ticket.until<=now){c.notify('Нужен действующий талон. Его выдают на платформах.');return;}
            if(!s.ticket.lines.includes(line))s.ticket.lines.push(line);
            c.record('Компостер '+line+' • '+marks[line]+' • '+(s.ticket.lines.length>1?'пересадка по одному талону':'первая отметка'));c.audio?.effect?.('switch');
        });
        if(r.stop&&r.doors>.72&&!s.heldThisStop)add('Попросить подождать опаздывающего',()=>{s.heldThisStop=true;s.holdUntil=sim.elapsed+4;sim.mobilityDoorHold=4;c.notify('Водитель держит двери ещё четыре секунды.');});
        if(rider.seat&&r.z>-21&&r.z<-3&&!s.windowSecret)add('Прочесть номер над старыми воротами',()=>{
            s.windowSecret=true;c.addMapPin(-3.43,-11.74,'Высотная отметка 77-Б');c.record('Из окна трамвая видна метка старой проходной «77-Б».');
        });
        const key=r.stop||r.nextStop;
        if(!s.routeNotes[key])add('Сделать пометку на схеме линии',()=>c.choose('Что отметить возле '+title(key)+'?', ['Вид на канал','Короткий путь во двор','Место встречи','Скамейка под навесом'].map(label=>({label,run:()=>{
            s.routeNotes[key]=label;c.addMapPin(tramStops[key].x,tramStops[key].z,label);c.record('Линия '+line+' · '+title(key)+': '+label);
        }}))));
        if(!r.stop&&r.nextStop==='works'&&rider.request!=='works')add('Заказать пересадку у Мастерских',()=>{rider.request='works';c.notify('Запрос принят. Выход на 17Д или 17Р у Мастерских.');});
    }
    return rows;
};
