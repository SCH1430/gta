"use strict";
const {places,stories,familyLine}=require('./culture-stories.js');
const {createWorld}=require('./culture-world.js');
const {acoustics,quotes}=require('./culture-sound.js');
const {slopes,passengerListen}=require('./culture-paths.js');
const {clearDisc,clearPath,walkSlide}=require('./collision.js');
const {groundHeight}=require('./world-layout.js');
const T=require('../engine/three.module.min.js');
const initial=()=>({progress:{},day:0,lastMinute:null,returnDay:0,sand:-1,sandDay:-1,worksDay:-1,closure:false,
    take:-1,broadcastDay:-1,photo:'',postcard:null,request:null,missingSignal:true,shadow:false,testCar:'',seatTest:0,driveMetres:0,foundKnock:false,heard:null});
const finite=(v,lo,hi,fallback)=>Number.isFinite(v)?Math.min(hi,Math.max(lo,v)):fallback;
const inRange=(c,p,r=p.r)=>c.zone===p.zone && Math.hypot(c.player.x-p.x,c.player.z-p.z)<r;
const current=(s,story)=>story.steps[s.progress[story.id]||0];
function viewPhoto(data) {
    if(!data || typeof document==='undefined')return;
    const d=document.createElement('dialog'),img=document.createElement('img'),close=document.createElement('button');
    d.setAttribute('aria-label','Семейный альбом');d.style.cssText='max-width:min(90vw,630px);background:#e7dcbe;padding:12px;color:#222;border:2px solid #6a5a48';
    img.src=data;img.alt='Семья у скамейки на Канальной';img.style.cssText='width:100%;display:block';close.textContent='Закрыть альбом';
    d.append(img,close);document.body.append(d);close.onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal();
}
function takePhoto(c,save) {
    const subjects=familyLine;
    if(c.camera && subjects.some(([x,z])=>{const v=new T.Vector3(x,1.20,z).project(c.camera);return v.z< -1||v.z>1||Math.abs(v.x)>.94||Math.abs(v.y)>.89;})){
        c.notify('Отойди от лавки и поверни камеру так, чтобы трое соседей попали в кадр.');return false;
    }
    const canvas=document.querySelector('#city');
    if(!canvas)return false;
    requestAnimationFrame(()=>{
        const copy=document.createElement('canvas');
        copy.width=380;copy.height=Math.round(copy.width*canvas.height/canvas.width);
        const brush=copy.getContext('2d');
        try{brush.drawImage(canvas,0,0,copy.width,copy.height);save(copy.toDataURL('image/jpeg',.66));}
        catch{save(null);c.notify('Снимок сделать не удалось. Попробуй ещё раз у лавки.');}
    });
    return true;
}
function createCultureAdditions(scene){
    const visuals=createWorld(scene),sound=acoustics();let s=initial();
    let hold=0,revision=0,photoPending=false,lastCar=null,passengerCar=null,searchVisitAt=0;
    const visiblePoint=new T.Vector3(),behind=new T.Vector3();
    function save(){return {...structuredClone(s),roofSnow:visuals.saveRoofSnow()};}
    function restore(raw={}){
        if(passengerCar)passengerListen.delete(passengerCar);
        passengerCar=null;s=initial();hold=0;searchVisitAt=0;revision++;photoPending=false;lastCar=null;sound.clear();visuals.clear(raw?.roofSnow);
        if(!raw||typeof raw!=='object')return;
        for(const story of stories){const p=raw.progress?.[story.id];if(Number.isInteger(p)&&p>0)s.progress[story.id]=Math.min(p,story.steps.length);}
        for(const k of ['day','returnDay','sandDay','worksDay','broadcastDay'])s[k]=Math.floor(finite(raw[k],-1,10000,s[k]));
        if(Number.isInteger(raw.lastMinute))s.lastMinute=finite(raw.lastMinute,0,1439,null);
        s.sand=[0,1].includes(raw.sand)?raw.sand:-1;s.take=[0,1,2].includes(raw.take)?raw.take:-1;
        s.preview=[0,1,2].includes(raw.preview)?raw.preview:-1;
        s.missingSignal=raw.missingSignal!==false;s.shadow=raw.shadow===true;s.hasRecorder=raw.hasRecorder===true;
        if(typeof raw.photo==='string'&&raw.photo.length<130000&&raw.photo.startsWith('data:image/jpeg;base64,'))s.photo=raw.photo;
        if(typeof raw.postcard?.data==='string'&&raw.postcard.data.length<=108000&&/^[A-Za-z0-9+/]*={0,2}$/.test(raw.postcard.data))
            s.postcard={data:raw.postcard.data,place:String(raw.postcard.place||'Канальная').slice(0,50),seconds:finite(raw.postcard.seconds,0,10,10)};
        if(['жителей дома №23','ночной смены','водителей линии 07'].includes(raw.request?.who))
            s.request={who:raw.request.who,at:finite(raw.request.at,0,1e9,0)};
        s.testCar=typeof raw.testCar==='string'?raw.testCar.slice(0,75):'';
        s.seatTest=finite(raw.seatTest,0,1,0);s.driveMetres=finite(raw.driveMetres,0,400,0);s.foundKnock=raw.foundKnock===true;
        s.previousCockpit=raw.previousCockpit===true;
        if(raw.reunion && s.progress[70]>=2 && Number.isFinite(raw.reunion.x) && Number.isFinite(raw.reunion.z) &&
            [places.garage,places.court,places.stop,places.market].some(p=>Math.hypot(raw.reunion.x-p.x,raw.reunion.z-p.z)<46)) {
            s.reunion={x:raw.reunion.x,z:raw.reunion.z,yaw:finite(raw.reunion.yaw,-Math.PI,Math.PI,0),speed:0};
        }
    }
    function journal(c){
        const items=stories.map(story=>{
            const n=s.progress[story.id]||0,step=current(s,story);
            return {label:(step?n?'◐ ':'○ ':'✓ ')+story.title,run:()=>{
                if(!step){if(story.id===63&&s.photo)viewPhoto(s.photo);else c.notify(story.steps.at(-1).text);return;}
                const p=places[step.at]; c.record(story.title+' · '+step.label+' — '+p.name+'.');
                c.notify(p.name+' · '+step.label+(step.mode==='car'?' · за рулём':''));
            }};
        });
        if(s.photo)items.push({label:'Открыть семейный альбом',run:()=>viewPhoto(s.photo)});
        c.choose('Тетрадь Канальной',items);
    }
    function ready(c,step,allowTime=true) {
        if(step?.later && s.day>=s.returnDay && s.reunion && !c.car && c.zone==='street' &&
            Math.hypot(c.player.x-s.reunion.x,c.player.z-s.reunion.z)<2.25)return true;
        if(!step||!inRange(c,places[step.at],step.family?6:places[step.at].r))return false;
        if(step.mode==='car' ? !c.car : !!c.car)return false;
        if(step.hour && allowTime) {
            const h=c.minutes/60,[a,b]=step.hour;
            if(!(a>b ? h>=a||h<b : h>=a&&h<b))return false;
        }
        return true;
    }
    function progress(c,story,step){
        if(current(s,story)!==step)return;
        s.progress[story.id]=(s.progress[story.id]||0)+1;
        if(step.sound)sound.sound(c,step.sound);
        if(step.voice!==undefined)sound.quote(c,step.voice);
        if(step.returnDays)s.returnDay=s.day+step.returnDays;
        const next=current(s,story);
        c.notify(step.text);
        c.record((next?story.title:'Завершено · '+story.title)+' — '+(next?next.label+' · '+places[next.at].name:step.text));
    }
    function meetAgain(c) {
        if(s.progress[70]<2 || !s.progress[70] || s.day<s.returnDay)return;
        const p=c.player, nearDistrict=c.zone==='street' && [places.garage,places.court,places.stop,places.market].some(a=>Math.hypot(p.x-a.x,p.z-a.z)<19);
        if(!nearDistrict || c.car || c.sim.tramRider?.onboard) {s.reunion=null;return;}
        if(s.progress[70]===3) {
            if(s.reunion && Math.hypot(p.x-s.reunion.x,p.z-s.reunion.z)>29)s.reunion=null;
            return;
        }
        if(c.sim.transition||c.sim.home.door||Math.abs(p.speed)>3)return;
        // Choose an unoccupied approach out of camera view, with an unobstructed walk to the player.
        if(!s.reunion){
            if(c.sim.elapsed<searchVisitAt)return;
            searchVisitAt=c.sim.elapsed+1.25;
            const camera=c.camera;
            if(camera){camera.getWorldDirection(behind);behind.multiplyScalar(-1);}
            else behind.set(Math.sin(p.yaw||0),0,Math.cos(p.yaw||0));
            const away=Math.atan2(behind.x,behind.z);
            for(const len of [12,9,7,5])for(let i=0;i<36;i++) {
                if(s.reunion)break;
                const delta=Math.ceil(i/2)*(i%2?1:-1)*Math.PI/18;
                const x=p.x+Math.sin(away+delta)*len,z=p.z+Math.cos(away+delta)*len,y=groundHeight(x,z);
                if(Math.abs(z-30)<4.8 || (Math.abs(x-46)<4.6&&z<35) || Math.abs(y-(p.y||0))>.28)continue;
                if(camera){
                    visiblePoint.set(x,y+1.25,z).project(camera);
                    if(visiblePoint.z>=-1&&visiblePoint.z<=1 && Math.abs(visiblePoint.x)<1.28&&Math.abs(visiblePoint.y)<1.28)continue;
                }
                const q={x,z};
                if(!clearDisc(q,.34,y,c.sim.cars)||!clearPath(q,p,.32,y,c.sim.cars))continue;
                if(c.sim.people.some(n=>!n.onboard&&Math.hypot(n.x-x,n.z-z)<1.05))continue;
                s.reunion={x,z,yaw:Math.atan2(x-p.x,z-p.z),speed:0};
            }
        }
        const v=s.reunion;if(!v)return;
        const dx=p.x-v.x,dz=p.z-v.z,d=Math.hypot(dx,dz);
        v.yaw=Math.atan2(-dx,-dz);
        if(d<1.78 && clearPath(v,p,.28,groundHeight(v.x,v.z),c.sim.cars)){
            v.speed=0;const story=stories.find(a=>a.id===70),last=story.steps[2];
            c.sim.emit?.('speech',last.text,'Знакомый пассажир');
            progress(c,story,last);return;
        }
        const stride=Math.min(d,1.20*c.dt);
        if(d>.001 && stride>0){
            const q=walkSlide(v,dx/d*stride,dz/d*stride,.29,groundHeight(v.x,v.z),c.sim.cars,c.sim.streetPeople||c.sim.people);
            v.speed=Math.hypot(q.x-v.x,q.z-v.z)/c.dt;v.x=q.x;v.z=q.z;
        }
    }
    function chooseBroadcast(c,story,step){
        const items=quotes.map((line,i)=>({label:'Прослушать · '+line,run:()=>{s.preview=i;sound.quote(c,i);c.notify('Послушай запись. Ещё раз используй пульт для выбора выпуска.');}}));
        if([0,1,2].includes(s.preview)) {
            const i=s.preview;
            items.push({label:'Передать в эфир · '+['Инна','мастер','пассажирка'][i],run:()=>{
                if(current(s,story)!==step)return;
                s.take=i;s.broadcastDay=s.day+1;sound.quote(c,i);progress(c,story,step);
            }});
        }
        c.choose('Монтаж выпуска у пульта',items);
    }
    function advance(c,id){
        const story=stories.find(st=>st.id===id),step=story&&current(s,story);
        if(!step||!ready(c,step,false))return;
        if(step.hour&&!ready(c,step)){
            const target=(step.family?18:21)*60;
            c.choose('Дождаться нужного часа?',[
                {label:'Подождать у этого места',run:()=>{c.garage.setTime(target,c.minutes);c.notify('Время встречи наступило.');}},
                {label:'Вернуться позже',run:()=>{}}
            ]);return;
        }
        if(step.later&&s.day<s.returnDay){
            c.choose('Попутчик обещал вернуться через несколько дней',[
                {label:'Продолжить свои дела',run:()=>{}},
                {label:'Вернуться в утро встречи',run:()=>{s.day=s.returnDay;c.garage.setTime(370,c.minutes);s.lastMinute=370;c.notify('Утро встречи. Знакомый пассажир снова на остановке.');}}
            ]);return;
        }
        if(step.later && (!s.reunion || Math.hypot(c.player.x-s.reunion.x,c.player.z-s.reunion.z)>2.25)){
            c.notify('Останься у павильона. Знакомый пассажир сам подойдёт, когда увидит тебя.');return;
        }
        if(step.quiz){const q=step.quiz;
            c.choose(q.prompt,q.answers.map((label,i)=>({label,run:()=>i===q.correct?progress(c,story,step):c.notify(q.again)})));return;
        }
        if(step.edit){chooseBroadcast(c,story,step);return;}
        if(step.wait!==undefined){
            c.choose(step.label,[
                {label:'Остаться и дождаться',run:()=>{
                    if(current(s,story)!==step)return;
                    if(step.wait<c.minutes)s.day++;s.lastMinute=step.wait;
                    c.garage.setTime(step.wait,c.minutes);progress(c,story,step);
                }},
                {label:'Сейчас уйти',run:()=>{}}
            ]);return;
        }
        if(step.family){
            if(!visuals.posed()){c.notify('Подойди ближе к лавке, когда соберутся соседи.');return;}
            if(photoPending)return;const token=revision;
            photoPending=takePhoto(c,data=>{
                if(token!==revision)return;
                photoPending=false;if(!data||current(s,story)!==step)return;
                s.photo=data;progress(c,story,step);
            });
            return;
        }
        progress(c,story,step);
    }
    function actions(c){
        const options=[], add=(id,label)=>options.push({id,label});
        for(const story of stories){
            const step=current(s,story);
            if(ready(c,step,false))add('story-'+story.id,story.title+' · '+step.label);
        }
        if(!c.car&&(inRange(c,places.board,3.7)||inRange(c,places.depot)||inRange(c,places.market,2.8)))add('journal','Тетрадь Канальной · 10 историй');
        if(!c.car && (s.hasRecorder || inRange(c,places.stop,3.7)||inRange(c,places.garage)||inRange(c,places.market)||inRange(c,places.court)||inRange(c,places.signal)))
            add('card','Звуковая открытка');
        if(!c.car&&inRange(c,places.bench))add('decks','Кассетная · сравнить три аппарата');
        if(!c.car&&(inRange(c,places.market)||inRange(c,places.studio)))add('dj','Передать музыкальный привет');
        if(!c.car&&c.zone==='house'&&inRange(c,places.mail,3.7))add('hold','Придержать дверь · услышать разговор');
        if(!c.car&&inRange(c,places.hatch))add('heat','Осмотреть след теплотрассы');
        if(!c.car&&inRange(c,places.garage,6.2))add('shadow','Встретиться по тени трубы');
        if(!c.car&&c.zone==='street')slopes.forEach((pt,i)=>{
            if(Math.hypot(c.player.x-pt.x,c.player.z-pt.z)<2.4&&s.sandDay!==s.day)add('sand-'+i,'Рассыпать дневной мешок песка на спуске');
        });
        if(s.progress[68]>=5 && s.day>=s.broadcastDay&&!c.car&&inRange(c,places.market))add('discuss','Обсудить вчерашний эфир');
        if(s.missingSignal&&!c.car&&inRange(c,places.signal))add('speaker','Проверить третий рупор переклички');
        if(!c.car&&inRange(c,places.garage,5.7)&&s.postcard)add('guess','Дать мастеру угадать район по записи');
        if(c.car && !s.foundKnock) {
            if(!s.testCar&&inRange(c,places.garage,7.8)&&Math.abs(c.car.speed)<.45)add('test','Подключить два микрофона для дорожной пробы');
            if(c.car.id===s.testCar&&s.driveMetres>=12&&Math.abs(c.car.speed)<.8)
                add(s.seatTest?'locate':'mic',s.seatTest?'Определить источник стука':'Послушать из правого кресла');
        }
        return options;
    }
    function act(id,c){
        if(!actions(c).some(a=>a.id===id))return false;
        if(id.startsWith('story-'))advance(c,Number(id.slice(6)));
        else if(id==='journal')journal(c);
        else if(id==='card'){
            const choices=[{label:sound.isRecording()?'Идёт запись…':'Записать десять секунд здесь',run:()=>{
                if(sound.isRecording())return;s.hasRecorder=true;const token=revision;
                sound.startCard(c,card=>{if(token===revision){s.postcard=card;c.record('Звуковая открытка · '+card.place+' · '+card.seconds.toFixed(0)+' с');c.notify('Открытка готова к прослушиванию.');}});
            }}];
            if(s.postcard)choices.push({label:'Послушать открытку · '+s.postcard.place,run:()=>sound.card(c,s.postcard,'field')});
            c.choose('Звуковая открытка',choices);
        } else if(id==='decks'){
            if(!s.postcard){c.notify('Сначала запиши открытку у рынка, гаража, остановки или во дворе.');return true;}
            c.choose('Как звучит одна кассета?', [['Карманный приёмник','pocket'],['Магнитола мастера','bench'],['Контрольная колонка','monitor']].map(([label,mode])=>({label,run:()=>sound.card(c,s.postcard,mode)})));
        } else if(id==='guess'){
            sound.card(c,s.postcard,'pocket');
            const place=s.postcard.place, choices=[...new Set([places.stop.name,places.court.name,places.garage.name,place])];
            if(!choices.slice(0,3).includes(place))choices[1]=place;
            c.choose('Передай наушники другу · где сделана запись?',choices.slice(0,3).map(label=>({label,run:()=>{
                if(label!==place){c.notify('Мастер · «Прислушайся к фону, попробуем ещё раз».');return;}
                c.record('Угадана звуковая открытка · '+place);c.notify('Место угадано · '+place);
            }})));
        } else if(id==='dj'){
            c.choose('Для кого заказать мелодию линии 07?', ['жителей дома №23','ночной смены','водителей линии 07'].map(who=>({label:'Для '+who,run:()=>{s.request={at:c.sim.elapsed+16,who};c.notify('Редакция поставила заявку в очередь эфира.');}})));
        } else if(id==='hold'){hold=5.1;sound.voice(c,'door','door',true);c.notify('С улицы · «В субботу принеси приёмник к последнему вагону…»');}
        else if(id==='heat')c.notify(c.weather.temperature>-.8||c.weather.rain>.05?'Под полосой тёмного снега проходит обратная труба. У крышки она поворачивает во двор.':'Шов виден слабо. Во время оттепели проталины проступят от крыльца до люка.');
        else if(id==='shadow'){
            if(c.minutes>=855 && c.minutes<=885){s.shadow=true;c.record('Встреча у трубы · мастер отметил время разгрузки по тени.');c.notify('Мастер пришёл ровно тогда, когда конец тени коснулся метки.');}
            else c.choose('Мастер придёт, когда тень трубы дойдёт до полосы',[
                {label:'Дождаться у ворот',run:()=>{c.garage.setTime(870,c.minutes);c.notify('Половина третьего. Проверь метку у ворот.');}},
                {label:'Посмотреть позже',run:()=>{}}
            ]);
        } else if(id.startsWith('sand-')){s.sand=Number(id.slice(-1));s.sandDay=s.day;c.record('Посыпан '+(s.sand?'южный':'северный')+' спуск у «Спектра».');}
        else if(id==='discuss'){sound.quote(c,s.take);c.notify('У прилавка вспоминают вчерашний эфир · «'+quotes[s.take]+'»');}
        else if(id==='speaker'){s.missingSignal=false;sound.sound(c,'signals');c.record('Портовая перекличка · окислившийся контакт очищен. В полдень зазвучат все три сигнала.');}
        else if(id==='test'){
            s.testCar=c.car.id;s.driveMetres=0;s.seatTest=0;s.previousCockpit=!!c.sim.motorPool?.cockpit;
            if(c.sim.motorPool)c.sim.motorPool.cockpit=true;
            c.notify('Проба · проедь 12 м и остановись, чтобы сравнить два микрофона.');
        }
        else if(id==='mic'){
            s.seatTest=1;s.driveMetres=0;if(c.sim.motorPool)c.sim.motorPool.cockpit=true;
            sound.sound(c,'knock',1.15);c.notify('Камера и микрофон в правом кресле. Повтори проезд и остановись.');
        }
        else if(id==='locate'){c.choose('С какой стороны дребезжит крепление?', ['Передняя панель справа','Полка багажника','Левая задняя дверь'].map((label,i)=>({label,run:()=>{if(i){c.notify('На пассажирской записи стук оказался ближе.');return;}s.foundKnock=true;s.testCar='';if(c.sim.motorPool?.cockpit)c.sim.motorPool.cockpit=s.previousCockpit;c.record('Дорожная проба · подтянуто крепление передней панели справа.');}})));}
        return true;
    }
    function update(c){
        if(s.lastMinute!==null && c.minutes<s.lastMinute-30)s.day++;
        s.lastMinute=c.minutes;
        if(s.sandDay!==s.day)s.sand=-1;
        if(s.worksDay!==s.day && c.weather.rain>.33 && c.weather.temperature>.55)s.worksDay=s.day;
        s.closure=s.worksDay===s.day && c.weather.rain>.33;
        c.sim.cultureWeather={rain:c.weather.rain,ice:c.weather.roadIce,sand:s.sand,closed:s.closure};
        hold=Math.max(0,hold-c.dt);
        c.sim.home.cultureHold=Math.max(0,Math.min(.83,hold,.83-(Math.max(0,hold-4.5))));
        meetAgain(c);
        const seat=c.car?.id===s.testCar && s.seatTest===1 ? c.car : null;
        if(seat!==passengerCar){
            if(passengerCar)passengerListen.delete(passengerCar);
            if(seat)passengerListen.add(seat);passengerCar=seat;
        }
        if(c.car && c.car.id===s.testCar) {
            if(lastCar && lastCar.id===c.car.id)s.driveMetres+=Math.min(Math.hypot(c.car.x-lastCar.x,c.car.z-lastCar.z),Math.max(1,c.dt*60));
            lastCar={id:c.car.id,x:c.car.x,z:c.car.z};
        } else lastCar=null;
        visuals.update(c,s);sound.update(c,s);
    }
    function agenda() {
        return stories.filter(story=>s.progress[story.id]>0 && current(s,story)).map(story=>{
            const step=current(s,story);
            return {title:story.title,goal:step.later && s.day>=s.returnDay?'Знакомый пассажир ищет тебя на Канальной':step.label+' · '+places[step.at].name};
        });
    }
    return {update,actions,act,save,restore,agenda};
}
exports.createCultureAdditions=createCultureAdditions;
