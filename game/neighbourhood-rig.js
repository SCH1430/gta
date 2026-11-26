"use strict";
const T=require("../engine/three.module.min.js");
const { Batches }=require("./world-batch.js");
exports.heroProps=function(spine){
    const root=new T.Group(),props={};spine.add(root);
    function item(name,build){const g=new T.Group(),b=new Batches(g);build(b);b.flush();root.add(g);g.visible=false;props[name]=g;}
    item('tea',b=>{b.cyl(0,0,0,.077,.121,'#ac7854');b.cyl(0,.067,0,.081,.009,'#dad3b9')});
    item('box',b=>{b.box(0,0,0,.47,.29,.32,'#ac8050');b.box(0,.004,0,.065,.298,.324,'#d4bd88')});
    item('packet',b=>b.box(0,0,0,.25,.16,.20,'#a7afa1'));
    item('rail',b=>b.box(0,0,0,.075,.086,1.35,'#96aaaf'));
    item('bag',b=>{b.box(0,-.10,0,.22,.25,.16,'#a17863');b.box(0,.073,0,.12,.075,.024,'#c2ab8c')});
    item('show',b=>b.box(0,0,0,.058,.025,.054,'#e2aa59'));
    item('umbrella',b=>{b.box(0,.25,0,.018,.55,.018,'#817b72');b.piece('taper',0,.55,0,.82,.21,.82,'#796267');b.box(.14,.56,.20,.117,.027,.14,'#cbaa82')});
    let old='';
    return hood=>{
        const kind=hood?.action==='shelf'&&hood.progress<.40?'':hood?.action==='show'?'show':hood?.item;
        if(kind!==old){if(props[old])props[old].visible=false;if(props[kind])props[kind].visible=true;old=kind}
        const g=props[kind];if(!g)return;
        const at=hood.progress, shelf=hood.action==='shelf',height=shelf?Math.sin(Math.PI*Math.min(at*1.28,1))*.31:0;
        if(kind==='tea')g.position.set(hood.oneHand?.20:.035,.24,-.32);
        if(kind==='box')g.position.set(0,.21+height,-.35-.07*height);
        if(kind==='packet')g.position.set(.19,.22+height,-.30);
        if(kind==='rail'){g.position.set(.20,.41+height,-.14);g.rotation.x=.12+hood.turn*.33}
        if(kind==='bag')g.position.set(.24-.11*hood.queue,-.02+.27*hood.queue,-.24);
        if(kind==='show')g.position.set(.15,.31,-.40);
        if(kind==='umbrella')g.position.set(.21,.26,-.24);
    }
};
exports.poseArms=function(h,i,side,target){
    const at=h.progress,shelf=h.action==='shelf';
    const height=shelf?Math.sin(Math.PI*Math.min(1,at*1.28))*.31:0;
    if(h.door>.02&&i===1){target.set(.32,.31,-.35);return h.door}
    if(h.action==='show'&&i===1){target.set(.15,.30,-.40);return 1}
    if(h.item==='box'){target.set(side*.226,.18+height,-.36-.07*height);return 1}
    if(h.item==='packet'&&i===1){target.set(.19,.22+height,-.30);return 1}
    if(h.item==='rail'){target.set(i?.19:.08,i?.38+height:.25,-.19+(i?.07:-.19));return i?1:.60}
    if(h.item==='tea'&&(!h.oneHand||i===1)){target.set(h.oneHand?.20:.035+side*.041,.24,-.32);return 1}
    if(h.item==='bag'&&i===1){target.set(.24-.11*h.queue,-.02+.27*h.queue,-.24);return 1}
    if(h.item==='umbrella'&&i===1){target.set(.21,.26,-.24);return 1}
    if(h.slip>.02){target.set(side*.43,.21,-.09);return h.slip}
    if(h.queue>.02){target.set(side*.15,.17,-.24);return h.queue*.76}
    return 0;
};
