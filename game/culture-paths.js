"use strict";
exports.slopes = [{x:34.8,z:23.4},{x:37.4,z:36.1}];
exports.passengerListen = new WeakSet();
exports.works = {x:-12,z:18.55};
exports.insideWorks = (x,z) => Math.abs(x+12)<1.38 && Math.abs(z-18.55)<.69;
exports.grip = function(x,z,state) {
    if (!state || state.ice<.18) return 1;
    const i=exports.slopes.findIndex(p=>Math.abs(x-p.x)<1.85 && Math.abs(z-p.z)<1.05);
    return i<0 || i===state.sand ? 1 : 1-.48*state.ice;
};
exports.walkingGoal = function(p,goal,state) {
    if (!state || Math.abs(goal.x-p.x)<1.45) return goal;
    const lead=p.x+Math.sign(goal.x-p.x)*1.35;
    if (state.closed && Math.abs(p.x+12)<4.8 && Math.abs(p.z-18.55)<1.4 && Math.abs(goal.z-18.55)<2)
        return {x:lead,z:19.62};
    if (state.rain>.35 && p.x>24 && p.x<37.5 && p.z>20.9 && p.z<25.1 && Math.abs(goal.z-p.z)<2.8)
        return {x:lead,z:21.15};
    const at=exports.slopes[state.sand];
    if (at && Math.abs(p.x-at.x)<3.9 && Math.abs(p.z-at.z)<1.3 && Math.abs(goal.z-at.z)<1.4)
        return {x:lead,z:at.z};
    return goal;
};
