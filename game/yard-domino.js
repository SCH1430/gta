"use strict";
const numbers = tile => [Math.floor(tile / 7),tile % 7];
const weight = tile => Math.floor(tile / 7) + tile % 7;
exports.label = tile => numbers(tile).join(' | ');
exports.start = function(seed) {
    const tiles=[];
    for(let a=0;a<7;a++)for(let b=a;b<7;b++)tiles.push(7*a+b);
    let random=(Math.imul(71477,seed+1)+95113)>>>0;
    for(let j=tiles.length-1;j>0;j--) {
        random=(Math.imul(random,1664525)+1013904223)>>>0;
        const pos=Math.floor(random/4294967296*(j+1));
        [tiles[pos],tiles[j]]=[tiles[j],tiles[pos]];
    }
    const [left,right]=numbers(tiles.pop());
    return {left,right,player:tiles.splice(0,4),guest:tiles.splice(0,4),stock:tiles};
};
exports.valid = d => !!d && [d.left,d.right].every(x=>Number.isInteger(x)&&x>=0&&x<=6) &&
    [d.player,d.guest,d.stock].every(a=>Array.isArray(a)&&a.length<=28&&a.every(x=>Number.isInteger(x)&&x>=0&&x<=48&&Math.floor(x/7)<=x%7));
exports.moves = function(d,hand) {
    const choices=[];
    for(const tile of hand){
        const [a,b]=numbers(tile);
        for(const side of ['left','right']){
            if(side==='right'&&d.left===d.right)continue;
            if(a===d[side]||b===d[side])choices.push({tile,side});
        }
    }
    return choices;
};
exports.play = function(d,hand,move) {
    const pos=hand.indexOf(move.tile);
    if(pos<0)return false;
    const [a,b]=numbers(move.tile),end=d[move.side];
    if(end!==a&&end!==b)return false;
    d[move.side]=a===end?b:a;hand.splice(pos,1);return true;
};
exports.score = hand=>hand.reduce((total,tile)=>total+weight(tile),0);
