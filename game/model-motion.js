"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animatePerson = animatePerson;
const T = require("../engine/three.module.min.js");
const model_gait_js_1 = require("./model-gait.js");
const { carCabin } = require("./vehicle-cabin.js");
const locomotion_poses_js_1 = require("./locomotion-poses.js");
const world_layout_js_1 = require("./world-layout.js");
const human_kits_js_1 = require("./human-kits.js");
const character_performance_js_1 = require("./character-performance.js");
const clamp = T.MathUtils.clamp, mix = T.MathUtils.lerp, smooth = T.MathUtils.smoothstep;
const down = new T.Vector3(0, -1, 0);
const forearmRest = new T.Vector3(0, -0.261, -0.033);
const forearmLength = forearmRest.length();
forearmRest.normalize();
const empty = {};
const U = 0.41, L = 0.425, sole = 0.09;
const unit = (n) => clamp(n, 0, 1);
function armSolver() {
    const axis = new T.Vector3(), pole = new T.Vector3(), elbow = new T.Vector3(), forearm = new T.Vector3();
    const currentElbow = new T.Vector3(), currentHand = new T.Vector3();
    const upperQ = new T.Quaternion(), lowerQ = new T.Quaternion(), forearmQ = new T.Quaternion();
    return (shoulder, joint, target, side, weight, trackHand = false) => {
        const humerus = 0.251, reach = forearmLength;
        axis.copy(target).sub(shoulder.position);
        const blendPoint = trackHand && weight > 0 && weight < 1;
        if (blendPoint) {
            // Interpolate the visible palm through space when it switches between the
            // wheel, handle and pillar. Rotating two joint angles separately arcs past them.
            currentElbow.copy(down).multiplyScalar(humerus).applyQuaternion(shoulder.quaternion);
            currentHand.copy(forearmRest).multiplyScalar(reach).applyQuaternion(joint.quaternion)
                .applyQuaternion(shoulder.quaternion).add(currentElbow);
            axis.copy(currentHand.lerp(axis, weight));
        }
        const length = clamp(axis.length(), 0.065, humerus + reach - 0.003);
        axis.normalize();
        const along = (humerus * humerus - reach * reach + length * length) / (2 * length);
        const out = Math.sqrt(Math.max(0, humerus * humerus - along * along));
        pole.set(0.72 * side, -0.63, 0.36);
        pole.addScaledVector(axis, -pole.dot(axis)).normalize();
        if (blendPoint) {
            currentElbow.addScaledVector(axis, -currentElbow.dot(axis));
            if (currentElbow.lengthSq() > .000001)
                pole.copy(currentElbow.normalize().lerp(pole, weight).normalize());
            weight = 1;
        }
        elbow.copy(axis).multiplyScalar(along).addScaledVector(pole, out);
        forearm.copy(axis).multiplyScalar(length).sub(elbow).normalize();
        upperQ.setFromUnitVectors(down, elbow.normalize());
        forearmQ.setFromUnitVectors(forearmRest, forearm);
        lowerQ.copy(upperQ).invert().multiply(forearmQ);
        shoulder.quaternion.slerp(upperQ, weight);
        joint.quaternion.slerp(lowerQ, weight);
    };
}
function animatePerson(role, variant, rig) {
    const { root, near, far, pelvis, spine, neck, shoulders, elbows, hips, knees, ankles, flap, parcel } = rig;
    const civicRig = require("./neighbourhood-rig.js");
    const updateCivicItems = role === 'hero' ? civicRig.heroProps(spine) : null;
    let farPoseDirty = true, farCoat = 0;
    rig.lod.prepareFarPose = () => {
        if (farPoseDirty) {
            far.geometry = rig.farPose(farCoat);
            farPoseDirty = false;
        }
    };
    const gait = new model_gait_js_1.Gait(), armTo = armSolver();
    const performance = new character_performance_js_1.CharacterPerformance(role);
    const satchelRest = rig.bag?.position.clone(), satchelRotation = rig.bag?.rotation.clone(), flapRest = flap?.position.clone();
    const satchelContents = require("./human-wardrobe.js").satchelPlacement.contents;
    const restQ = new T.Quaternion(), pelvisInverse = new T.Quaternion(), footEuler = new T.Euler(0, 0, 0, 'YXZ');
    const shoulderRest = shoulders.map(joint => joint.position.clone());
    const ankleTargets = [new T.Vector3(), new T.Vector3()];
    const snowSample = new T.Vector3();
    const fixedAnkle = new T.Vector3(), seatedBoot = new T.Quaternion();
    const pinned = [0, 0];
    const bootRotation = [new T.Quaternion(), new T.Quaternion()];
    const soleOffset = new T.Vector3(), localLeg = new T.Vector3(), hipPivot = new T.Vector3();
    const movement = (0, locomotion_poses_js_1.cyclePose)(0, 0), arm = (0, locomotion_poses_js_1.armPose)(0, 0);
    const halfStance = (Math.abs(hips[0].position.x) + Math.abs(hips[1].position.x)) * .5 + .008;
    const target = new T.Vector3(), stow = new T.Vector3(), palm = new T.Vector3(), bag = new T.Vector3();
    let clock = (variant % 29) * 0.32, jump = 0, flinch = 0, landingReach = 0;
    let supportShift = 0, pivotTwist = 0;
    let prevSeated = false;
    let nextSnowCheck = 0, snowEnds = -Infinity;
    let gripHand = -1, conversationWeight = 0, nodTime = 1, wasAddressed = false;
    const gripPoint = new T.Vector3(), gripWorld = new T.Vector3(), reachLean = new T.Vector3();
    let gaze = 0, headTurn = 0, chestTurn = 0, jaw = 0, mouthShape = 0, wetness = 0, hemSpring = 0, beltSpring = 0, pocket = 0;
    let fabricYaw = 0, bagPitch = 0, bagRoll = 0, passing = 0, cover = 0, lookDown = 0;
    let waitingFor = 0, warmHands = 0, readBoard = 0, holdHood = 0;
    const residentPosture = rig.style.posture ?? 0, hasHood = rig.style.cut === 'quilted' && !rig.style.scarf;
    const gaitStyle = role === 'resident'
        ? human_kits_js_1.civilians[Math.abs(variant) % human_kits_js_1.civilians.length].gait
        : character_performance_js_1.principalGaits[role] ?? 'normal';
    function resetMotion() {
        gait.reset();
        prevSeated = false;
        wasAddressed = false;
        conversationWeight = 0;
        nodTime = 1;
        gripHand = -1;
        jump = flinch = landingReach = supportShift = pivotTwist = 0;
        gaze = headTurn = chestTurn = jaw = mouthShape = hemSpring = beltSpring = 0;
        fabricYaw = bagPitch = bagRoll = passing = cover = lookDown = 0;
        waitingFor = warmHands = readBoard = holdHood = 0;
        nextSnowCheck = 0;
        snowEnds = -Infinity;
        performance.reset();
    }
    function update(dt, speed, airborne = false, pose = empty) {
        dt = Math.min(Math.max(dt, 0), 0.14);
        clock += dt;
        const yaw = root.rotation.y, scale = root.scale.x || 1, exchange = pose.handoff ?? -1;
        const receivingRole = pose.handoffRole ?? 'vendor';
        const hand = receivingRole === 'dispatcher' ? 1 - exchange : exchange;
        const counterpart = role === receivingRole;
        const hood = pose.neighbourhood;
        if (updateCivicItems) updateCivicItems(hood);
        const door = unit(pose.doorReach ?? 0), seat = unit(pose.seated ?? (hood?.seat ? 1 : 0));
        const cabin = pose.doorCabinKind && carCabin(pose.doorCabinKind);
        const driving = cabin?.drivingPose, seatedLegs = pose.seatedLegs, doorSide = pose.doorSide ?? -1;
        const doorPivot = unit(pose.doorPivot ?? 0), doorBrace = unit(pose.doorBrace ?? 0);
        const innerPull = driving && pose.doorTarget ? seat * door * (.14 + .86 * smooth(pose.doorOpen ?? 1, 0, .64)) : 0;
        const slide = unit(pose.passengerSlide ?? 0) * seat;
        const doorDuck = unit(pose.doorDuck ?? 0), doorStep = unit(pose.doorStep ?? 0);
        const seated = seat > 0.025, boarding = door > 0 || seated || doorDuck > 0;
        const sill = clamp(((pose.sillHeight ?? .41) - .41) / .13, 0, 1.2);
        const roofDuck = clamp((1.51 - (pose.roofHeight ?? 1.51)) / .23, 0, 1);
        const strikeProgress = unit(pose.strike ?? 0), dodgeProgress = unit(pose.dodge ?? 0), knocked = pose.getUp;
        const strike = smooth(strikeProgress, .04, .35) * (1 - smooth(strikeProgress, .47, .98));
        const dodge = Math.sin(Math.PI * dodgeProgress);
        const dodgeSide = pose.dodgeSide ?? 1;
        const fall = knocked ? smooth(knocked.phase, 0, .21) * (1 - smooth(knocked.phase, .48, .985)) : 0;
        const fallSide = knocked?.side ?? 1;
        const rise = knocked ? smooth(knocked.phase, .36, .62) * (1 - smooth(knocked.phase, .67, .98)) : 0;
        const push = unit(pose.pushDoor?.amount ?? 0);
        const hasBlock = !!pose.hasBlock, transferring = exchange >= 0 && exchange <= 1;
        if (prevSeated && !seated)
            gait.reset();
        prevSeated = seated;
        gait.update(dt, root.position.x, root.position.y, root.position.z, yaw, scale, airborne, pose.ground ?? world_layout_js_1.groundHeight, gaitStyle, halfStance);
        if (boarding || airborne || fall > .05)
            gait.footfall = null;
        if (gait.onReset) {
            jump = airborne ? 1 : 0;
            gripHand = -1;
        }
        jump = T.MathUtils.damp(jump, airborne ? 1 : 0, 15, dt);
        landingReach = T.MathUtils.damp(landingReach, airborne ? gait.approachingGround : 0, 11, dt);
        const impactAge = pose.impactAge ?? Infinity;
        const startled = smooth(impactAge, .04, .16) * (1 - smooth(impactAge, .35, .88));
        const watchingImpact = 1 - smooth(impactAge, 1.55, 2.9);
        const alert = Math.max(startled * .77, pose.reaction === 'flee' ? 1 : pose.reaction === 'step' ? .49 : 0);
        flinch = T.MathUtils.damp(flinch, alert, alert > flinch ? 13 : 5, dt);
        const move = smooth(gait.speed, 0, 1.15) * (1 - seat);
        const run = gait.run;
        const wave = Math.sin(gait.phase * Math.PI * 2);
        const breath = Math.sin(clock * 1.72 + variant * .35);
        const gaitWeight = move * (1 - jump) * (1 - fall);
        const free = (1 - seat) * (1 - Math.max(door, doorDuck, push, transferring ? 1 : 0));
        const swingWeight = gaitWeight * free;
        const forward = clamp(gait.forwardSpeed / Math.max(.25, gait.speed), -1, 1);
        const bank = clamp(gait.turn * gait.speed * .012 - gait.sideSpeed * .055, -.235, .235) * swingWeight;
        if (!near.visible && !far.visible && role !== 'hero' && !transferring)
            return;
        (0, locomotion_poses_js_1.cyclePose)(gait.phase, run, movement);
        const addressed = !!pose.conversation || (pose.nod ?? 0) > .1;
        if (addressed && !wasAddressed)
            nodTime = 0;
        wasAddressed = addressed;
        nodTime += dt;
        conversationWeight = T.MathUtils.damp(conversationWeight, pose.conversation ? 1 : 0, 10, dt);
        const nod = smooth(nodTime, .04, .23) * (1 - smooth(nodTime, .23, .48));
        const canWait = Number.isFinite(pose.boardAngle) && speed < .25 && !airborne && !boarding && !pose.reaction && !addressed && !watchingImpact;
        waitingFor = canWait ? waitingFor + dt : 0;
        const waitPhase = (waitingFor + (Math.abs(variant) % 5) * .31) % 9.4;
        const waiting = canWait ? smooth(waitingFor, .05, .38) * (1 - move) : 0;
        const habit = Math.abs(variant)%3;
        const glanceBoard = waiting * (habit===1 ? 1 : .56) * smooth(waitPhase, 3.5, 4.3) * (1 - smooth(waitPhase, 7, 7.8));
        readBoard = T.MathUtils.damp(readBoard, glanceBoard, 6, dt);
        const idleHands = waiting * (habit===2 ? 1 : .48) * smooth(waitPhase, .6, 1.4) * (1 - smooth(waitPhase, 3.4, 4.1));
        warmHands = T.MathUtils.damp(warmHands, pose.cold && !pose.carry ? idleHands : 0, 8, dt);
        const gust = hasHood && free > .95 && !pose.carry && !addressed && !pose.reaction ? pose.wind ?? 0 : 0;
        const windUp = smooth(gust, .48, .80) * (1 - jump) * (1 - run) * (1 - watchingImpact);
        holdHood = T.MathUtils.damp(holdHood, windUp, windUp > holdHood ? 6 : 4, dt);
        const turnTo = clamp(mix(pose.glance ?? 0, pose.boardAngle ?? 0, readBoard) * (1 - watchingImpact) +
            (pose.impactAngle ?? 0) * watchingImpact, -1.5, 1.5);
        gaze = T.MathUtils.damp(gaze, turnTo, 29, dt);
        headTurn = T.MathUtils.damp(headTurn, gaze * (.78 + .05 * watchingImpact), 6.8 + watchingImpact * 8, dt);
        const torsoResponse = smooth(impactAge, .16, .49);
        chestTurn = T.MathUtils.damp(chestTurn, headTurn * (.31 + .23 * watchingImpact + .17 * readBoard) * torsoResponse, 3.3 + watchingImpact * 2, dt);
        const blinkT = (clock + Math.sin(variant * .9) * 1.3) % (3.9 + Math.abs(variant % 4) * .38);
        const blink = 1 - smooth(Math.abs(blinkT - .132), .012, .10);
        jaw = T.MathUtils.damp(jaw, unit(pose.speech ?? 0), 24, dt);
        mouthShape = T.MathUtils.damp(mouthShape, pose.speechShape ?? 0, 20, dt);
        passing = T.MathUtils.damp(passing, clamp(pose.passing ?? 0, -1, 1) * move * free, 11, dt);
        cover = T.MathUtils.damp(cover, pose.covered ? 1 : 0, 9, dt);
        const standingAlert = pose.reaction === 'look' && Math.abs(turnTo) > .35 ? -.19 : 0;
        lookDown = T.MathUtils.damp(lookDown, standingAlert + (pose.carry === 'crate' ? -.11 : 0), 8, dt);
        if (near.visible)
            rig.face(gaze - headTurn, Math.sin(clock * .9) * .24 + lookDown + .5 * readBoard, Math.max(blink, .75 * startled), jaw, mouthShape, pose.closeFace ? jaw * .70 + .22 * nod : 0);
        wetness = T.MathUtils.damp(wetness, unit(pose.wetness ?? 0), .16, dt);
        if (near.visible) {
            rig.fabric(pose.coat ?? 0, wetness);
            if (clock >= nextSnowCheck) {
                nextSnowCheck = clock + .24;
                root.getWorldPosition(snowSample);
                if ((pose.wetness ?? 0) > .08 && !seated && !airborne && (0, world_layout_js_1.surfaceAt)(snowSample.x, snowSample.z) === 'snow')
                    snowEnds = clock + 3;
                rig.snowBoots(clock < snowEnds);
            }
        }
        const co = Math.cos(yaw), si = Math.sin(yaw);
        const idleWeight = (1 - move) * (1 - jump) * free;
        const supportSide = Number(gait.feet[1].planted) - Number(gait.feet[0].planted);
        const load = .023 * smooth(Math.abs(gait.acceleration), 1.4, 7) + .038 * gait.landing;
        supportShift = T.MathUtils.damp(gait.onReset ? 0 : supportShift, supportSide * load * free * (1 - fall) * (1 - gait.pivotAmount), 18, dt);
        const supportYaw = supportSide ? gait.feet[supportSide > 0 ? 1 : 0].yaw : yaw;
        const plantedTwist = clamp((0, model_gait_js_1.shortAngle)(supportYaw - yaw), -.65, .65);
        pivotTwist = T.MathUtils.damp(gait.onReset ? 0 : pivotTwist, plantedTwist * .32 * gait.pivotAmount * free, 16, dt);
        const waitingShift = Math.sin(waitPhase * 1.2 + variant * .8) * .032 * waiting;
        pelvis.position.x = movement.weight * swingWeight * (1 - gait.pivotAmount) + supportShift + .030 * gait.pivotLoad * free + (Math.sin(clock * .38 + variant) * .007 - .003) * idleWeight + fallSide * .22 * fall + doorSide * (.042 * doorPivot + .145 * innerPull) + waitingShift;
        pelvis.position.z = clamp(gait.acceleration * .0042, -.042, .042) * free * (1 - jump) + .064 * fall;
        pelvis.rotation.set(.14 * fall, movement.pelvisYaw * swingWeight * forward + pivotTwist + fallSide * .35 * rise + doorSide * .18 * doorPivot, movement.pelvisRoll * swingWeight - fallSide * 1.22 * fall, 'YXZ');
        pelvisInverse.copy(pelvis.quaternion).invert();
        // Let the planted ankle set the reach limit; extra lowering through the whole
        // cycle makes both legs look flexed even at heel strike and push-off.
        let hipHeight = .912 + (.009 + .012 * run + movement.height) * swingWeight + breath * .002 * idleWeight;
        for (let i = 0; i < 2; i++) {
            const f = gait.feet[i], dx = (f.x - root.position.x) / scale, dz = (f.z - root.position.z) / scale;
            const outside = f.side === doorSide;
            const anchor = outside ? pose.doorPlant : pose.doorInsideFoot;
            const pin = pinned[i] = driving && anchor ? unit((outside ? pose.doorPlantWeight : pose.doorInsideWeight) ?? 0) : 0;
            footEuler.set(f.pitch * (1 - seat) * (1 - pin), (0, model_gait_js_1.shortAngle)(f.yaw - yaw) * (1 - seat), 0, 'YXZ');
            bootRotation[i].setFromEuler(footEuler);
            if (driving && seat > 0) {
                seatedBoot.setFromEuler(footEuler.set(.12, 0, f.side * .065, 'ZXY'));
                bootRotation[i].slerp(seatedBoot, seat * (1 - pin));
            }
            soleOffset.set(0, sole, 0).applyQuaternion(bootRotation[i]);
            const ankle = ankleTargets[i];
            ankle.set(dx * co - dz * si, (f.y - root.position.y) / scale, dx * si + dz * co).add(soleOffset);
            if (hood && !boarding && !airborne && !f.planted) {
                ankle.z -= hood.slip * .11 + hood.curb * .055 * (1 + run);
                ankle.y += hood.curb * .030 * (1 - run);
            }
            const lead = f.side === pose.doorLeadSide;
            const step = lead ? smooth(doorStep, 0, .26) * (1 - smooth(doorStep, .38, .68)) :
                smooth(doorStep, .28, .58) * (1 - smooth(doorStep, .69, 1));
            ankle.y += (.12 + .13 * sill) * step;
            ankle.z -= (lead ? .09 : .055) * step;
            if (pin > 0) {
                const ax = (anchor.x - root.position.x) / scale, az = (anchor.z - root.position.z) / scale;
                fixedAnkle.set(ax * co - az * si, (anchor.y - root.position.y) / scale, ax * si + az * co).add(soleOffset);
                ankle.lerp(fixedAnkle, pin);
            }
            hipPivot.copy(hips[i].position).applyQuaternion(pelvis.quaternion);
            const horizontal = Math.hypot(ankle.x - pelvis.position.x - hipPivot.x, ankle.z - pelvis.position.z - hipPivot.z);
            const loadingFlex = f.planted ? f.loading * swingWeight * (1 - gait.pivotAmount) * (.010 + .022 * run) : 0;
            const maxDown = Math.sqrt(Math.max(.10, (U + L - .002 - loadingFlex) ** 2 - horizontal ** 2));
            if (!f.planted && !boarding && !airborne && gait.speed > .25) {
                const raised = Math.max(0, hipHeight + hipPivot.y - maxDown - ankle.y);
                ankle.y += raised;
                f.y += raised * scale;
            }
            hipHeight = Math.min(hipHeight, ankle.y + maxDown - hipPivot.y);
        }
        const gripCrouch = door * (1 - seat) * (pose.doorClosing ? .34 : 1);
        hipHeight = clamp(hipHeight - .25 * unit(pose.duck ?? 0) - 0.14 * gripCrouch - 0.05 * flinch - free * (.132 * gait.landing + .019 * gait.takeoff + .026 * gait.pivotAmount) - .14 * cover - .108 * dodge - doorDuck * (.058 + .084 * roofDuck), 0.55, 0.96);
        if (!gait.onReset && !boarding && !airborne)
            hipHeight = Math.min(hipHeight, pelvis.position.y + dt * (.74 + .37 * run));
        pelvis.position.y = mix(mix(hipHeight, .252, fall), driving?.hipY ?? ((pose.seatHeight ?? (hood?.seat ? .46 : .64)) + .028), seat) - .036 * slide;
        const travelLean = (.038 + run * .159 + movement.pitch) * swingWeight * forward;
        spine.position.set(0, driving ? 0 : -.052 * seat, -.013 * swingWeight * forward);
        const lowering = Math.sin(seat * Math.PI);
        const yawLead = clamp(gait.turn * 0.09, -0.3, 0.3);
        spine.rotation.set(-travelLean -
            0.014 * gait.acceleration * (1 - doorDuck) +
            breath * 0.007 * (1 - move) +
            0.09 * flinch -
            lowering * 0.48 +
            seat * (driving?.backAngle ?? -.19) -
            0.16 * gripCrouch - free * (gait.grade * .25 + gait.landing * .16 + gait.takeoff * .09) - doorDuck * (.24 + .31 * roofDuck) - .15 * cover - .20 * dodge - .25 * rise + .24 * fall, yawLead * free + (movement.chestYaw - movement.pelvisYaw) * swingWeight * forward - .58 * strike + dodgeSide * .25 * dodge, -movement.pelvisRoll * 1.42 * swingWeight + bank + gait.pivotLoad * .047 * free - (pose.doorSide ?? -1) * lowering * 0.13 + .16 * passing - fallSide * .21 * fall - dodgeSide * .12 * dodge, 'YXZ');
        if (canWait && habit===0) pelvis.rotation.z += Math.sin(clock*.87)*.036*waiting;
        const squeezing = unit(pose.squeeze ?? 0), duck = unit(pose.duck ?? 0);
        spine.rotation.y += chestTurn + (squeezing * .55) + passing * .47 - pivotTwist * .8 - doorSide * (.40 * doorPivot + .28 * innerPull);
        spine.rotation.z -= doorSide * (.11 * doorBrace + .48 * innerPull);
        if (hood) {
            spine.rotation.y += hood.queue * .55 + (hood.item === 'rail' ? hood.turn * .19 : 0);
            spine.rotation.z += hood.slip * .20 + hood.door * .14;
            spine.rotation.x -= hood.curb * .08 + (hood.action === 'shelf' ? Math.sin(Math.PI * hood.progress)*.14 : 0);
        }
        spine.rotation.x -= duck * .41;
        spine.rotation.x += residentPosture * free * (1 - fall) - .08 * holdHood - .06 * warmHands;
        spine.rotation.z += waitingShift * .70;
        spine.rotation.x -= slide * (.33 + .19 * roofDuck);
        spine.rotation.z -= .14 * slide;
        if (gaitStyle === 'limp') {
            spine.rotation.z += .052 * move * (.5 + .5 * wave);
            spine.rotation.x -= .08 * move;
        }
        if (gaitStyle === 'careful')
            spine.rotation.x -= move * .065;
        if (gaitStyle === 'worker') {
            spine.rotation.x -= move * .077;
            spine.rotation.z += wave * .030 * (1 - run) * move;
        }
        if (gaitStyle === 'patrol')
            spine.rotation.x += move * .032;
        if (gaitStyle === 'courier') {
            spine.rotation.x -= move * .045;
            spine.rotation.y += wave * move * .043;
        }
        hemSpring = T.MathUtils.damp(hemSpring, clamp(-gait.acceleration * .025 - gait.speed * .017, -.20, .17), 7, dt);
        beltSpring = T.MathUtils.damp(beltSpring, clamp(-gait.acceleration * .011, -.08, .11), 10, dt);
        const windup = clamp(-gait.turn * .052 - gait.sideSpeed * .045, -.24, .24) * move * (1 - seat) * (1 - fall);
        fabricYaw = T.MathUtils.damp(fabricYaw, windup, 7, dt);
        bagPitch = T.MathUtils.damp(bagPitch, clamp(-gait.acceleration * .010 - breath * .012 * move, -.112, .112) * free, 5, dt);
        bagRoll = T.MathUtils.damp(bagRoll, clamp(windup - fabricYaw * .40, -.14, .14), 6, dt);
        rig.hem.rotation.set(hemSpring + wave * .023 * move, fabricYaw, clamp(-bank * .6, -.16, .16));
        if (rig.strap) {
            rig.strap.rotation.x = beltSpring;
            rig.strap.scale.y = 1 + beltSpring * .32;
        }
        if (rig.bag && satchelRest && satchelRotation) {
            rig.bag.position.copy(satchelRest);
            rig.bag.position.x += bagRoll * .14;
            rig.bag.position.y += bagPitch * .055;
            rig.bag.rotation.set(satchelRotation.x + bagPitch, satchelRotation.y + bagRoll * .44, satchelRotation.z + bagRoll * .60);
        }
        neck.rotation.set(travelLean * .77 - breath * 0.012 + lowering * 0.2 + free * (gait.grade * .15 + gait.landing * .11), clamp(yawLead * .55 + headTurn - chestTurn - movement.chestYaw * .78 * swingWeight * forward, -1.18, 1.18) +
            Math.sin(clock * 0.49) * 0.045 * (1 - move) * (1 - conversationWeight) +
            (pose.reversing ? 0.49 : 0) * seat, wave * 0.014 * gaitWeight - bank * .65);
        neck.rotation.x -= nod * .10;
        if(root.userData.inspectFind){neck.rotation.x-=.27;spine.rotation.x-=.18;}
        if (hood) neck.rotation.y += hood.look;
        neck.rotation.x += lookDown * .40 - doorDuck * (.075 + .12 * roofDuck) + clamp(pose.boardPitch ?? 0, .08, .36) * readBoard - .045 * warmHands;
        neck.rotation.z += (pose.windSide ?? 1) * .12 * holdHood;
        neck.rotation.y -= passing * .29;
        if (driving) {
            neck.rotation.x += .16 * seat;
            neck.rotation.y -= doorSide * (.21 * doorPivot + .28 * innerPull);
        }
        const carry = pose.carry, carryBlock = carry === 'block' && hasBlock && !transferring;
        const pouchPoint = carry === 'tape' ? 1 : 0;
        pocket = T.MathUtils.damp(pocket, pouchPoint, 2.5, dt);
        const passengerEye = transferring ? (1 - smooth(hand, 0.74, 0.98)) * smooth(hand, 0, 0.16) : 0;
        neck.rotation.x -= passengerEye * 0.13;
        const available = (1 - move) * free * (1 - Math.max(jump, flinch, fall, cover, dodge, strike, carry ? 1 : 0));
        performance.tick(dt, pose, available);
        const { wipe, listen, show, shoulder, phase } = performance;
        const performed = Math.max(wipe, listen, show, shoulder);
        if (performed > .001) {
            neck.rotation.x -= .32 * wipe + .18 * show + .14 * shoulder;
            neck.rotation.y += .71 * listen - .23 * shoulder;
            neck.rotation.z += .16 * listen - .080 * show;
            spine.rotation.x -= .102 * wipe + .070 * show;
            spine.rotation.y += .13 * listen - .10 * shoulder;
        }
        const working = (1 - move) * (1 - gait.pivotAmount) * (1 - jump) * (1 - Math.max(passengerEye, flinch, conversationWeight, fall, cover, dodge, strike));
        if (role === 'vendor') {
            spine.rotation.x -= 0.055 * working;
            neck.rotation.x -= 0.13 * working;
            neck.rotation.z -= 0.045 * working;
        }
        else if (role === 'mechanic') {
            spine.rotation.z += 0.045 * working;
            neck.rotation.x -= (0.07 + 0.043 * Math.sin(clock * 0.7)) * working;
        }
        else if (role === 'dispatcher') {
            neck.rotation.y += 0.1 * Math.sin(clock * 0.52) * working;
        }
        const idle = working * (1 - jump) * free * (1 - clamp(gait.landing, 0, 1));
        const cycle = (clock + variant * 1.41) % (role === 'hero' ? 13 : 10.5);
        const gesture = idle * (1 - Math.max(performed, waiting, holdHood, watchingImpact)) * smooth(cycle, 2.05, 2.74) * (1 - smooth(cycle, 3.71, 4.52));
        const wrist = role === 'hero' || (role === 'resident' && variant % 2 === 0);
        if (gesture > .0001) {
            if (wrist) {
                neck.rotation.x -= gesture * .33;
                neck.rotation.y += gesture * .32;
                spine.rotation.y += gesture * .12;
            }
            else if (role === 'resident') {
                neck.rotation.x -= gesture * .16;
                spine.rotation.x -= gesture * .07;
            }
            else if (role === 'vendor') {
                neck.rotation.z += gesture * .105;
            }
            else if (role === 'dispatcher') {
                neck.rotation.y += gesture * .52;
                spine.rotation.y += gesture * .15;
            }
            else if (role === 'mechanic') {
                neck.rotation.x += gesture * .24;
            }
        }
        const handWeight = Math.max(door, push);
        if (handWeight > 0.001) {
            if (push && pose.pushDoor)
                gripWorld.copy(pose.pushDoor.target);
            else if (pose.doorTarget)
                gripWorld.copy(pose.doorTarget);
            else
                gripWorld.set((pose.doorSide ?? -1) * .42, .94, -.15).add(root.position);
            spine.worldToLocal(gripPoint.copy(gripWorld));
            if (gripHand < 0)
                gripHand = gripPoint.x < 0 ? 0 : 1;
            if (!seated) {
                spine.rotation.y += (gripHand === 0 ? -.2 : .2) * handWeight;
                spine.worldToLocal(gripPoint.copy(gripWorld));
            }
            reachLean.subVectors(gripPoint, shoulders[gripHand].position);
            const overreach = clamp(reachLean.length() - (.251 + forearmLength - .007), 0, push ? .21 : .145) * handWeight;
            if (overreach > 0) {
                reachLean.normalize().multiplyScalar(overreach).applyQuaternion(spine.quaternion);
                spine.position.add(reachLean);
                spine.worldToLocal(gripPoint.copy(gripWorld));
            }
        }
        else
            gripHand = -1;
        const braceHand = doorSide < 0 ? 1 : 0;
        for (let i = 0; i < 2; i++) {
            const side = gait.feet[i].side;
            localLeg.copy(ankleTargets[i]).sub(pelvis.position).applyQuaternion(pelvisInverse).sub(hips[i].position);
            const lateral = localLeg.x, yDown = -localLeg.y, lz = localLeg.z;
            const vertical = Math.hypot(lateral, yDown), length = clamp(Math.hypot(vertical, lz), 0.1, U + L - 0.001);
            const hx = Math.atan2(-lz, vertical) + Math.acos(clamp((U * U + length * length - L * L) / (2 * U * length), -1, 1));
            const kx = -Math.acos(clamp((length * length - U * U - L * L) / (2 * U * L), -1, 1));
            const bentKnee = side === fallSide ? 1 : .65;
            const legSeat = seat * (1 - pinned[i]);
            const seatedThigh = driving?.thigh ?? seatedLegs?.thigh ?? (1.87 - i * .018);
            const seatedShin = driving?.shins[i] ?? seatedLegs?.shin;
            const seatedKnee = seatedShin === undefined ? -1.075 + i * .014 : seatedShin - seatedThigh;
            hips[i].rotation.x = mix(mix(hx, 1.02 * bentKnee + .18 * rise, fall), seatedThigh, legSeat);
            hips[i].rotation.z = mix(mix(Math.atan2(lateral, yDown), side * .29 + fallSide * .23, fall), side * (driving ? .065 : .083), legSeat);
            knees[i].rotation.x = mix(mix(kx, -1.39 * bentKnee - .12 * rise, fall), seatedKnee, legSeat);
            restQ.copy(pelvis.quaternion).multiply(hips[i].quaternion).multiply(knees[i].quaternion).invert();
            ankles[i].quaternion.copy(restQ).multiply(bootRotation[i]);
            (0, locomotion_poses_js_1.armPose)(gait.phase + i * .5, run, arm);
            const relaxed = (i === 0 ? -.072 : .043) + breath * .014;
            const shoulderDrive = arm.swing * swingWeight * forward * (1 - gait.pivotAmount);
            shoulders[i].position.copy(shoulderRest[i]);
            shoulders[i].position.z -= shoulderDrive * (.014 + .012 * run);
            shoulders[i].position.y += Math.abs(shoulderDrive) * (.004 + .010 * run);
            shoulders[i].position.x -= side * shoulderDrive * .008;
            const driveArm = side !== gait.leadingSide;
            const jumpSwing = (driveArm ? 1.03 : -.49) * (1 - .69 * landingReach);
            shoulders[i].rotation.set(mix(relaxed, arm.swing * forward, swingWeight * (1 - gait.pivotAmount)) + side * gait.turn * .019 * gait.pivotAmount * free + jump * jumpSwing - gait.landing * .18 * free, side * (.028 + (.078 + .07 * arm.swing) * run * swingWeight), side * ((i === 0 ? .103 : .065) + (.060 + .06 * Math.max(0, -arm.swing)) * run * swingWeight + jump * (.15 + .23 * landingReach) + gait.landing * .085 * free) -
                gait.sideSpeed * .016 * swingWeight);
            elbows[i].rotation.set(mix(i === 0 ? .19 : .15, arm.elbow, swingWeight) + jump * (driveArm ? .66 : .36) * (1 - .52 * landingReach), 0, -side * .048);
            if (role === 'vendor' && i === 1) {
                target.set(0.165 + 0.028 * Math.sin(clock * 1.6), 0.26 + 0.017 * Math.sin(clock * 2.6), -0.285);
                armTo(shoulders[i], elbows[i], target, side, 0.88 * working);
            }
            if (role === 'dispatcher' && i === 1) {
                target.set(0.253, 0.115, -0.209 - 0.018 * breath);
                armTo(shoulders[i], elbows[i], target, side, 0.75 * working);
            }
            if (role === 'mechanic') {
                const swipe = Math.sin(clock * 2.8);
                target.set(i ? 0.04 : 0.047 + swipe * 0.044, 0.13 + (i ? 0 : swipe * 0.014), -0.256 + (i ? 0 : 0.02));
                armTo(shoulders[i], elbows[i], target, side, clamp(0.48 + 0.51 * Math.sin(clock * 0.7), 0, 1) * working);
            }
            if (gesture > .0001) {
                let act = false;
                if (wrist) {
                    target.set(side * (i ? .10 : .066), i ? .251 : .295, -.315 + (i ? .014 * Math.sin(clock * 8) : 0));
                    act = true;
                }
                else if (role === 'resident') {
                    target.set(side * .058, .38, -.275 + Math.sin(clock * 9) * side * .018);
                    act = true;
                }
                else if (role === 'vendor' && i === 0) {
                    target.set(-.107, .54, -.13);
                    act = true;
                }
                else if (role === 'dispatcher' && i === 1) {
                    target.set(.22, .29, -.321);
                    act = true;
                }
                else if (role === 'mechanic' && i === 0) {
                    target.set(-.119, .43, -.203);
                    act = true;
                }
                if (act)
                    armTo(shoulders[i], elbows[i], target, side, gesture);
            }
            if (wipe > .001) {
                const stroke = i ? Math.sin(phase * 24) : 0;
                target.set(-.014 + .038 * stroke + side * .022, i ? .207 + .010 * stroke : .202, i ? -.281 + .023 * stroke : -.286);
                armTo(shoulders[i], elbows[i], target, side, wipe);
            }
            else if (show > .001) {
                target.set(i ? .119 : -.018, i ? .298 : .281, i ? -.362 : -.335);
                armTo(shoulders[i], elbows[i], target, side, show * (i ? 1 : .76));
            }
            else if (listen > .001 && i === 1) {
                target.set(.229, .079, -.172);
                armTo(shoulders[i], elbows[i], target, side, listen * .88);
            }
            else if (shoulder > .001 && i === 1) {
                target.set(.109, .319, -.183);
                armTo(shoulders[i], elbows[i], target, side, shoulder);
            }
            if (warmHands > .001) {
                const rub = Math.sin(clock * 12 + i * 1.2) * .018;
                target.set(side * .041, .299 + rub, -.279 + rub * .52);
                armTo(shoulders[i], elbows[i], target, side, warmHands * (1 - holdHood), true);
            }
            if (holdHood > .001 && side === (pose.windSide ?? 1)) {
                target.set(side * .144, .545, .023);
                armTo(shoulders[i], elbows[i], target, side, holdHood, true);
            }
            if (flinch > 0.01) {
                const nearTraffic = side === Math.sign(pose.glance ?? 0);
                target.set(side * (nearTraffic ? 0.24 : 0.34), nearTraffic ? 0.405 : 0.22, nearTraffic ? -0.29 : -0.12);
                armTo(shoulders[i], elbows[i], target, side, flinch * 0.78);
            }
            if (carryBlock) {
                target.set(side * .109, .239 + breath * .005, -.353);
                armTo(shoulders[i], elbows[i], target, side, free);
            }
            else if (carry === 'crate') {
                target.set(side * .253, .144 + breath * .003, -.370);
                armTo(shoulders[i], elbows[i], target, side, free);
            }
            else if (carry === 'cup' && i === 1 || carry === 'parcel' && i === 1) {
                target.set(side * (carry === 'cup' ? .264 : .235), carry === 'cup' ? .24 : -.015, carry === 'cup' ? -.32 : -.235);
                armTo(shoulders[i], elbows[i], target, side, free);
            }
            else if (carry === 'tape' && i === 1 && pocket < .97) {
                target.set(.11, .18 + pocket * .20, -.29 + pocket * .14);
                armTo(shoulders[i], elbows[i], target, side, 1 - smooth(pocket, .80, .97));
            }
            if (squeezing > .015 && i === 1) {
                target.set(.215, .255, .13);
                armTo(shoulders[i], elbows[i], target, side, squeezing);
            }
            if ((pose.vault ?? 0) > 0 && pose.vaultHand && i === 0) {
                target.copy(pose.vaultHand);
                spine.worldToLocal(target);
                armTo(shoulders[i], elbows[i], target, side, Math.sin(Math.PI * unit(pose.vault)));
            }
            if (strike > .002 || dodge > .002 || cover > .002 || fall > .002) {
                const striking = side === 1 && strike > .002, balance = side === fallSide ? fall : rise * .65;
                target.set(side * (.15 + .14 * dodge + .30 * balance), .355 + .04 * strike - .08 * cover - .18 * balance, -.28 - (striking ? .27 * strike : 0) + .145 * dodge + .20 * balance);
                armTo(shoulders[i], elbows[i], target, side, Math.max(strike, dodge * .75, cover * .68, fall) * free);
            }
            if (hood && !boarding) {
                const weight = civicRig.poseArms(hood,i,side,target);
                if (weight) armTo(shoulders[i],elbows[i],target,side,weight);
            }
            if (seat > 0.001) {
                target.set(side * 0.158 + (pose.steer ?? 0) * 0.035, 0.33 - side * (pose.steer ?? 0) * 0.093, -0.346);
                if (driving) {
                    target.set(side * driving.gripX, driving.gripY, driving.gripZ);
                    reachLean.subVectors(target, shoulders[i].position);
                    const extend = clamp(reachLean.length() - (.251 + forearmLength - .008), 0, .082) * seat * (pose.driverSeatWeight ?? 1);
                    shoulders[i].position.addScaledVector(reachLean.normalize(), extend);
                }
                target.lerp(stow.set(side * .145, .045, -.19), Math.max(slide, 1 - (pose.driverSeatWeight ?? 1)));
                armTo(shoulders[i], elbows[i], target, side, seat, !!driving);
            }
            if (doorBrace && pose.doorBraceTarget && i === braceHand) {
                spine.worldToLocal(target.copy(pose.doorBraceTarget));
                const weight = doorBrace * (i === gripHand ? 1 - handWeight : 1);
                reachLean.subVectors(target, shoulders[i].position);
                const extend = clamp(reachLean.length() - (.251 + forearmLength - .008), 0, .065);
                shoulders[i].position.addScaledVector(reachLean.normalize(), extend * weight);
                armTo(shoulders[i], elbows[i], target, side, weight, true);
            }
            if (i === gripHand) {
                if (driving) {
                    reachLean.subVectors(gripPoint, shoulders[i].position);
                    const extension = clamp(reachLean.length() - (.251 + forearmLength - .008), 0, .048);
                    shoulders[i].position.addScaledVector(reachLean.normalize(), extension * handWeight);
                }
                armTo(shoulders[i], elbows[i], gripPoint, side, handWeight, !!driving);
            }
            const handing = (counterpart && i === 0) || (role === 'hero' && i === 1);
            if (transferring && handing) {
                if (pose.handTarget) {
                    target.copy(pose.handTarget);
                    spine.worldToLocal(target);
                }
                else
                    target.set(side * 0.055, 0.245, -0.39);
                const reach = counterpart
                    ? smooth(hand, 0, 0.35) * (1 - smooth(hand, 0.51, 0.8))
                    : smooth(hand, 0.09, 0.42) * (1 - smooth(hand, 0.9, 1));
                if (role === 'hero')
                    target.lerp(stow.set(satchelContents.x + .045, satchelContents.y + .047, satchelContents.z + .025), smooth(hand, 0.58, 0.87));
                armTo(shoulders[i], elbows[i], target, side, reach);
            }
            const handTarget = pose.handTargets?.[i];
            if (handTarget)
                armTo(shoulders[i], elbows[i], target.fromArray(handTarget), side, 1);
            if (near.visible) {
                const gripping = handTarget || (i === gripHand && handWeight > .51) || (seated && (pose.driverSeatWeight ?? 1) > .72) || carry === 'crate' || (transferring && handing && hand > .35 && hand < .77);
                rig.grip(i, carry === 'cup' && i === 1 && !seated ? 'cup' : gripping ? 'handle' : 'rest');
            }
        }
        farCoat = pose.coat ?? 0;
        farPoseDirty = true;
        if (far.visible)
            rig.lod.prepareFarPose();
        if (!near.visible && !transferring)
            return;
        rig.deform?.(seat);
        if (rig.tool) {
            rig.tool.visible = !transferring && !seated && !carry && fall < .25 && wipe < .07 && (role !== 'vendor' || working > .48 || show > .16);
            if (rig.tool.visible) {
                palm.set(0, -.261, -.033);
                elbows[1].localToWorld(palm);
                spine.worldToLocal(palm);
                rig.tool.position.copy(palm);
                rig.tool.position.z -= .025;
                rig.tool.rotation.set(-.62 * working - .44 * show, -.18 + .40 * show, -.44 * (1 - working) - .26 * show);
            }
        }
        if (rig.cloth) {
            rig.cloth.visible = wipe > .16 && !transferring && !boarding && !carry;
            if (rig.cloth.visible) {
                palm.set(0, -.270, -.044);
                elbows[0].localToWorld(palm);
                spine.worldToLocal(palm);
                rig.cloth.position.copy(palm);
                rig.cloth.rotation.set(.42 + Math.sin(phase * 24) * .13, .15, .2);
            }
        }
        for (const [item, prop] of Object.entries(rig.props)) {
            prop.visible = carry === item && !transferring && !seated && (item !== 'tape' || pocket < .93) && fall < .35;
            if (!prop.visible)
                continue;
            if (item === 'crate') {
                prop.position.set(0, .134 + breath * .003, -.365);
                prop.rotation.set(-spine.rotation.x * .46, 0, -spine.rotation.z * .32);
                continue;
            }
            palm.set(0, -.261, -.033);
            elbows[1].localToWorld(palm);
            spine.worldToLocal(palm);
            prop.position.copy(palm);
            prop.position.y += item === 'parcel' ? -.10 : item === 'cup' ? .035 : 0;
            prop.rotation.set(-spine.rotation.x, 0, -spine.rotation.z);
        }
        if (flap) {
            const opening = transferring ? smooth(hand, 0.48, 0.66) * (1 - smooth(hand, 0.87, 1)) : 0;
            flap.rotation.x = -(hasBlock ? .34 : 0) - opening * 1.24 + bagPitch;
            flap.rotation.z = -.14 + bagRoll * .60;
            if (flapRest) {
                flap.position.copy(flapRest);
                flap.position.x += bagRoll * .14;
                flap.position.y += bagPitch * .055;
            }
        }
        if (parcel) {
            const held = transferring && (counterpart ? hand < 0.48 : role === 'hero' && hand >= 0.48);
            parcel.visible = held || (role === 'hero' && hasBlock && !transferring);
            if (parcel.visible) {
                const isHero = role === 'hero';
                bag.copy(satchelContents);
                bag.x += bagRoll * .14;
                bag.y += bagPitch * .055;
                spine.localToWorld(bag);
                root.worldToLocal(bag);
                if (held) {
                    if (counterpart && pose.handTarget && hand > 0.395)
                        palm.copy(pose.handTarget);
                    else if (isHero && pose.handTarget && hand < 0.55)
                        palm.copy(pose.handTarget);
                    else {
                        palm.set(0, -0.261, -0.033);
                        elbows[isHero ? 1 : 0].localToWorld(palm);
                    }
                    root.worldToLocal(palm);
                    if (isHero)
                        palm.lerp(bag, smooth(hand, 0.76, 0.94));
                    parcel.position.copy(palm);
                }
                else if (carryBlock) {
                    palm.set(0, .235 + breath * .005, -.353);
                    spine.localToWorld(palm);
                    root.worldToLocal(palm);
                    parcel.position.copy(palm);
                }
                else
                    parcel.position.copy(bag);
                parcel.rotation.set(isHero && (!held || hand > 0.74) ? -0.12 : 0.03, 0, isHero ? 0.07 : -0.04);
            }
        }
    }
    update(0, 0);
    gait.reset();
    return {
        root,
        update,
        resetMotion,
        get footfall() {
            return gait.footfall;
        },
        getFootContacts: () => gait.feet
    };
}
