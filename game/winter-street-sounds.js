'use strict';
const {metal} = require('./venue-layout.js');
const {vehicleRattleSample,vehicleRattleRate} = require('./vehicle-audio.js');
const {serviceSites} = require('./new-city-services-layout.js');
const waste = serviceSites.find(s=>s.id==='city-side-loader').body;
const site = (key,kind,x,z,range,gain,period,length,hours,offset=0) => ({key,kind,x,z,range,gain,period,length,hours,offset});
const shopSounds = [
    site('thermal-turbines','substation',-38,-89,228,.43,1,1),
    site('ferry-cable','winch',-161.8,81.6,26,.86,8.5,1.1,[360,1290]),
    site('waste-pump','hydraulic',waste.x,waste.z,22,.67,11.86,1.1),
    site('yard-door','door',-34.9,16,18,.70,18,.52,[340,1420],3.4),
    site('kitchen','dishes',-31,13.6,15,.66,9,.69,[390,1380],2.3),
    site('garage-dog','dog',-49,45.5,29,.56,21,.77,undefined,7),
    site('old-minivan','vanStarter',-10,42,19,.72,155,.40,undefined,127),
    site('garage-gate','chain',-37.7,41,23,.63,24,.99,[420,1280],11),
    site('garage-receiver','receiver',-42,42,15,.42,9.2,1.45,[420,1330]),
    site('canal-player','accordion',-24.2,17.5,19,.71,3.2,1.27,[540,1260],.6),
    site('club-practice','practice',metal.door.x,metal.door.z,22,.67,4.5,1.48,[metal.opens,metal.closes])
];
const tau=Math.PI*2;
const music = { practice:[196,247,294,277,247], accordion:[294,330,370,330,294], receiver:[220,262,294,330,247] };
function streetSample(kind,rate) {
    if (kind==='vanStarter') {
        const starter=vehicleRattleSample('starter-diesel');
        const data=new Float32Array(Math.floor(starter.length*rate/vehicleRattleRate));
        for(let i=0;i<data.length;i++)data[i]=starter[Math.floor(i*vehicleRattleRate/rate)];
        return data;
    }
    const notes=music[kind], length=notes?1.43:kind==='hydraulic'||kind==='winch'?1.02:.77;
    const data=new Float32Array(Math.round(rate*length));
    let seed=31981, low=0;
    for(let i=0;i<data.length;i++){
        const t=i/rate;
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const noise=seed/2147483648-1;
        low+=.12*(noise-low);
        const attack=Math.min(1,t*90), fade=Math.min(1,(length-t)*15);
        let v=0;
        if(notes){
            const n=Math.min(4,Math.floor(t/.285)), age=t-n*.285, hz=notes[n];
            const env=Math.min(1,age*23)*Math.exp(-age*(kind==='accordion'?2.8:5.7));
            v=env*(Math.sin(t*tau*hz)*.29 + Math.sin(t*tau*hz*2)*.11 + Math.sin(t*tau*hz*1.005)*.078);
        } else if(kind==='dishes'||kind==='chain'||kind==='joints'||kind==='door'){
            const strikes=kind==='chain'?.078:kind==='joints'?.185:kind==='door'?.47:.225;
            const age=t%strikes, nth=Math.floor(t/strikes);
            const hz=kind==='dishes'?1380+nth*217:kind==='chain'?661:kind==='door'?74:158;
            v=(.32*Math.sin(t*tau*hz)+.17*Math.sin(t*tau*hz*2.71)+.35*noise)*Math.exp(-age*(kind==='chain'?45:30))*Math.exp(-t*(kind==='chain'?.7:2.4));
        } else if(kind==='dog'){
            const age=t%.34, hz=116+125*Math.exp(-age*7);
            v=Math.max(0,Math.sin(age*11))*Math.exp(-age*8)*(.62*Math.sin(t*tau*hz)+.20*Math.sin(t*tau*hz*2.9)+.25*low);
        } else if(kind==='flanges'){
            v=(.24*Math.sin(t*tau*898+2*Math.sin(t*21))+.12*Math.sin(t*tau*1348)+low*.48)*Math.sin(Math.PI*t/length);
        } else {
            const hz=kind==='hydraulic'?118:74;
            v=(.24*Math.sin(t*tau*hz+3*Math.sin(t*8))+.15*Math.sin(t*tau*hz*2)+low*.46)*(.58+.42*Math.cos(t*(kind==='winch'?29:5)));
        }
        data[i]=v*attack*fade;
    }
    return data;
}
module.exports={shopSounds,streetSample};
