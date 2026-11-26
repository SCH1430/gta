"use strict";
const {tapes} = require('./culture-voices.js');
const {linePose} = require('./world-railway.js');
const {places} = require('./culture-stories.js');
const decode = Array.from({length:256},(_,i)=>(i>=128?1:-1)*(256**((i&127)/127)-1)/255);
const quoteIds=['inna','master','rider'];
exports.quotes=['Вещи держатся, пока их есть кому починить.','Молодые у нас учатся на настоящих моторах.','Последний вагон подождал. Значит, мы ещё соседи.'];
const melody=[293.66,349.23,392.0,349.23,440,392,329.63,293.66];
const dist=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
function acoustics(){
    let nextAmbient=0, oldClock, trainApproached=false, capture=null, playing=null, pendingVoice=null, voiceBus=null, voiceFilter=null, previousZone='street', testPan=null;
    const decoded=new Map();
    function available(c){const a=c.audio;return a?.ctx && !a.disposed && !a.paused && !document.hidden && a.ctx.state==='running' ? a : null;}
    function playBytes(c,raw,preset='field',gain=.72,rate=1,trackDoor=false) {
        const a=c.audio;
        if(!a?.ctx||!raw)return false;
        const ctx=a.ctx;
        let buf=decoded.get(raw);
        if(!buf) {
            const str=atob(raw), n=Math.min(82000,str.length);
            buf=ctx.createBuffer(1,n,8000);const data=buf.getChannelData(0);
            for(let i=0;i<n;i++)data[i]=decode[str.charCodeAt(i)];
            if(decoded.size>7)decoded.clear();decoded.set(raw,buf);
        }
        if(playing) {try{playing.stop();}catch{} }
        const src=ctx.createBufferSource(), filter=ctx.createBiquadFilter(), vol=ctx.createGain();
        src.buffer=buf;src.playbackRate.value=rate;
        filter.type='lowpass';filter.frequency.value={pocket:1100,bench:3100,monitor:3950,field:3800,door:510}[preset]??3400;
        vol.gain.value=gain;
        src.connect(filter).connect(vol).connect(a.mix?.voice??a.master);
        playing=src;
        if(trackDoor){voiceBus=vol;voiceFilter=filter;}
        src.onended=()=>{src.disconnect();filter.disconnect();vol.disconnect();if(playing===src)playing=null;if(voiceBus===vol){voiceBus=voiceFilter=null;}};
        src.start();return true;
    }
    function voice(c,id,preset,gesture=false) {
        if(gesture)c.audio?.unlock?.();
        if(!c.audio?.ctx)return;
        playBytes(c,tapes[id],preset??'field',id==='door'?.32:.68,id==='master'?.89:id==='rider'?1.02:1,id==='door');
    }
    function theme(c,colour='market',full=false,delay=0) {
        const a=available(c);if(!a)return;
        const type=colour==='whistle'?'sine':colour==='window'?'triangle':'triangle';
        const bus=a.mix?.media??a.master, octave=colour==='whistle'?2:1,count=full?8:4;
        for(let i=0;i<count;i++)a.tone(melody[i]*octave,melody[i]*octave*1.002,.38,i%4===0?.042:.030,type,i*.39+delay,bus);
        if(full)for(let i=0;i<4;i++)a.tone(melody[i*2]*.5,melody[i*2]*.5,.72,.020,'sine',i*.78+delay,bus);
    }
    function sound(c,name,amount=1) {
        const a=available(c); if(!a)return;const bus=a.mix?.world??a.master;
        if(name==='glass'){
            for(let i=0;i<4;i++)a.tone(1450+i*64,1250,.09,.030*amount,'sine',i*.082,bus);
        } else if(name==='tools'){
            a.burst(1200,.10,.080*amount,0,2,bus);a.burst(730,.15,.065*amount,.29,1.4,bus);
        } else if(name==='compressor'){
            a.tone(88,73,1.3,.042*amount,'triangle',0,bus);a.burst(980,1.4,.031*amount,.06,.5,bus);
        } else if(name==='knock'){
            if(!testPan && a.ctx.createStereoPanner){testPan=a.ctx.createStereoPanner();testPan.connect(bus);}
            if(testPan)testPan.pan.value=amount>.8?-.14:.85;
            for(let i=0;i<2;i++) a.tone(112,63,.12,.090*amount,'triangle',i*.17,testPan??bus);
        } else if(name==='signals'){
            [554.37,415.30,311.13].slice(0,amount===0?2:3).forEach((f,i)=>a.tone(f,f*.97,.52,.075,'triangle',i*1.35,bus));
        }
    }
    function stopCapture(keep=true){
        if(!capture)return;const item=capture;capture=null;
        try{item.audio.master.disconnect(item.tap);}catch{}
        item.tap.onaudioprocess=null;item.tap.disconnect();item.silent.disconnect();
        if(keep&&item.n>0){
            let bytes=''; for(let i=0;i<item.n;i+=8192)bytes+=String.fromCharCode(...item.data.subarray(i,Math.min(item.n,i+8192)));
            item.save({data:btoa(bytes),place:item.place,seconds:item.n/8000});
        }
    }
    function startCard(c,onSaved) {
        const a=c.audio;a?.unlock?.();
        if(!a?.ctx?.createScriptProcessor || !a.master){c.notify('Для звуковой открытки нужен включённый игровой звук.');return;}
        stopCapture(false);
        const ctx=a.ctx,tap=ctx.createScriptProcessor(2048,1,1),silent=ctx.createGain();
        silent.gain.value=0;const data=new Uint8Array(80000);
        let place = Object.values(places).find(p=>p.zone===c.zone&&dist(p,c.player)<3.8)?.name;
        if(!place)place=c.zone==='street'?c.sim.district():c.zone;
        const item=capture={tap,silent,audio:a,n:0,data,part:0,save:onSaved,place};
        tap.onaudioprocess=e=>{
            if(a.paused||document.hidden||capture!==item)return;
            const samples=e.inputBuffer.getChannelData(0);
            for(let i=0;i<samples.length && item.n<data.length;i++){
                item.part+=8000;
                if(item.part<ctx.sampleRate)continue;item.part-=ctx.sampleRate;
                const v=Math.max(-1,Math.min(1,samples[i]));
                data[item.n++]=(v>=0?128:0)+Math.min(127,Math.round(127*Math.log1p(255*Math.abs(v))/Math.log(256)));
            }
            if(item.n===data.length)stopCapture();
        };
        a.master.connect(tap);tap.connect(silent).connect(ctx.destination);
        c.notify('Запись открытки началась. Десять секунд можно идти, ехать или стоять на месте.');
    }
    function update(c,s) {
        const now=c.sim.elapsed,p=c.player;
        if(voiceBus&&c.audio?.ctx){
            const aperture=Math.max(c.sim.home.open||0,c.sim.home.cultureHold||0),at=c.audio.ctx.currentTime;
            voiceBus.gain.setTargetAtTime(.08+.65*aperture,at,.1);
            voiceFilter.frequency.setTargetAtTime(450+3100*aperture,at,.1);
        }
        if(c.zone==='house' && previousZone==='street' && !pendingVoice)pendingVoice=now+.5;
        previousZone=c.zone;
        if(pendingVoice!==null && now>=pendingVoice) {pendingVoice=null;if(c.zone==='house'&&dist(p,places.mail)<6)voice(c,'door','door');}
        if(c.zone==='street' && dist(p,places.stop)<19) {
            const rail=linePose(c.sim.tramTime),distance=dist(rail,places.stop);
            const approaching=rail.visible!==false&&rail.nextStop==='market'&&Math.abs(rail.speed)>.9&&distance>10&&distance<25;
            if(approaching&&!trainApproached)sound(c,'glass',.7);trainApproached=approaching;
        }else trainApproached=false;
        if(c.zone==='street'&&c.minutes===720&&oldClock!==720) {
            sound(c,'signals',s.missingSignal?0:1);
            if(s.missingSignal)c.record('В полдень прозвучали два сигнала из трёх. На портовом конце моста можно проверить рупор.');
        }
        oldClock=c.minutes;
        const hearRadio=c.audio?.radioEnabled!==false && ((c.car && c.zone==='street')||dist(p,places.market)<9&&c.zone==='street'||c.zone==='workshop');
        if(s.request && now>s.request.at && hearRadio && available(c) && !c.audio?.isSpeaking) {
            c.notify('Канальный FM · «Для '+s.request.who+' — мелодия линии 07».');voice(c,'dj');theme(c,'window',true,5.9);
            s.request=null;
        }
        if(now<nextAmbient)return;
        nextAmbient=now+5.6;
        if(c.zone==='street'){
            if(dist(p,places.shutter)<8 && dist(p,places.shutter)<dist(p,places.garage))theme(c,'whistle');
            else if(dist(p,places.garage)<9)sound(c,'compressor',.72);
            else if(dist(p,places.market)<8)theme(c,'market');
            else if(dist(p,places.school)<12)theme(c,'whistle');
            else if((c.minutes>1080||c.minutes<350)&&dist(p,places.entry)<9)theme(c,'window',true);
        }
        if(s.testCar && c.car?.id===s.testCar && Math.abs(c.car.speed)>2)sound(c,'knock',s.seatTest===1?.85:.52);
    }
    return {update,theme,sound,voice,quote:(c,i)=>voice(c,quoteIds[i],'field',true),startCard,isRecording:()=>!!capture,
        card:(c,card,preset)=>{c.audio?.unlock?.();return !!card&&playBytes(c,card.data,preset);},
        clear(){stopCapture(false);if(playing)try{playing.stop();}catch{}nextAmbient=0;previousZone='street';oldClock=undefined;pendingVoice=null;}};
}
exports.acoustics=acoustics;
