"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSteering = buildSteering;
const T = require("../engine/three.module.min.js");
const model_geometry_js_1 = require("./model-geometry.js");
const model_expression_js_1 = require("./model-expression.js");
const human_cloth_js_1 = require("./human-cloth.js");
const model_people_js_1 = require("./model-people.js");
const model_cabin_lower_js_1 = require("./model-cabin-lower.js");
const model_distance_js_1 = require("./model-distance.js");
const vehicle_cabin_js_1 = require("./vehicle-cabin.js");
const down = new T.Vector3(0, -1, 0);
const { gripX: rimX, gripY: rimY } = vehicle_cabin_js_1.steeringRim;
function atGrip(side, out, along, z) {
    return new T.Vector3(side * (rimX + .915 * out - .404 * along), rimY + .404 * out + .915 * along, z);
}
function grip(side, hero, skin) {
    const palm = new model_geometry_js_1.Batch(), leather = hero ? '#3e4645' : skin;
    const transform = (out, tangent, z) => atGrip(side, out, tangent, z);
    for (let i = 0; i < 4; i++) {
        const line = .031 - i * .018, reach = .005 - i * .0015, r = .0095 - i * .00065;
        const path = [transform(.008, line, .034), transform(.019, line + .001, .024),
            transform(.022 + reach, line, .003), transform(.018 + reach, line - .002, -.015),
            transform(.002 + reach, line - .003, -.018)];
        palm.add(new T.TubeGeometry(new T.CatmullRomCurve3(path), 6, r, 6, false), [0, 0, 0], [1, 1, 1], leather);
        const tip = path[path.length - 1];
        palm.ball(tip.x, tip.y, tip.z, r, r * .96, r * .84, leather);
    }
    const wrist = transform(.022, -.030, .059), base = transform(.016, -.007, .034);
    const ray = new T.Vector3().subVectors(base, wrist);
    palm.add(new T.CylinderGeometry(.026, .024, ray.length(), 10), wrist.clone().lerp(base, .5).toArray(), [1, 1, 1], leather, [0, 0, 0], new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), ray.normalize()));
    const center = transform(.008, -.001, .031);
    palm.ball(center.x, center.y, center.z, .029, .045, .026, leather, [.14, 0, side * .27]);
    const thumb = [transform(-.002, -.016, .045), transform(-.016, -.010, .032), transform(-.021, .006, .014), transform(-.014, .017, -.001)];
    palm.add(new T.TubeGeometry(new T.CatmullRomCurve3(thumb), 7, .011, 7, false), [0, 0, 0], [1, 1, 1], leather);
    const mesh = palm.mesh();
    mesh.geometry.userData.humanSurface = true;
    return { mesh, wrist };
}
const gripTemplates = new Map();
function buildSteering(kind) {
    const s = vehicle_cabin_js_1.specs[kind], c = (0, vehicle_cabin_js_1.carCabin)(kind), rim = new model_geometry_js_1.Batch();
    rim.add(model_geometry_js_1.ring, [0, 0, 0], [.166, .166, .15], '#27333b');
    for (const side of [-1, 1])
        rim.rod([side * .018, .002, 0], [side * .143, .038, 0], .016, '#6a7a7e', true);
    rim.rod([0, -.016, 0], [0, -.150, 0], .013, '#56696e', true);
    rim.box(0, 0, 0, .083, .058, .041, '#35414a');
    rim.box(0, .008, .022, .042, .009, .004, '#c6c0a6');
    const wheelTemplate = rim.mesh();
    let driverIndex = 0;
    return function create() {
        const cockpit = new T.Group(), socket = new T.Group(), wheel = new T.Group();
        cockpit.name = 'cockpit';
        socket.position.set(-c.seatX, c.drivingPose.wheelY, c.drivingPose.wheelZ);
        socket.rotation.x = vehicle_cabin_js_1.steeringRim.tilt;
        socket.add(wheel);
        wheel.add(wheelTemplate.clone());
        cockpit.add(socket);
        const variant = ({ hatch: 5, sedan: 2, van: 8, patrol: 4, suv: 11, pickup: 7, coupe: 13, taxi: 10, wagon: 12, towtruck: 9, utility: 8 }[kind] + 4 * driverIndex++) % 15;
        const hips = new T.Vector3(-c.seatX, c.drivingPose.hipY, c.seatZ);
        let medium, mediumRole = null, mediumCoat = -1, detail = 'close';
        let occupant = null, driver, head, spine;
        let flap, parcel;
        let face;
        let coatIndex = -1, gaze = 0, wheelAngle = 0, time = 0;
        const angles = [0, 0], regrip = [0, 0], fromAngle = [0, 0];
        const clothing = [];
        const arms = [];
        const privateGeometry = new Set();
        const shoulderPos = new T.Vector3(), elbowPos = new T.Vector3(), handPos = new T.Vector3(), direction = new T.Vector3(), bend = new T.Vector3(), lowerDirection = new T.Vector3();
        const orient = new T.Quaternion(), inverse = new T.Quaternion(), axis = new T.Vector3(0, 0, 1);
        function setDriver(role) {
            if (occupant === role)
                return;
            if (driver)
                cockpit.remove(driver);
            for (const { hand } of arms)
                socket.remove(hand);
            for (const geometry of privateGeometry)
                geometry.dispose();
            privateGeometry.clear();
            clothing.length = 0;
            arms.length = 0;
            angles.fill(0);
            regrip.fill(0);
            occupant = role;
            head = undefined;
            driver = undefined;
            spine = undefined;
            flap = undefined;
            parcel = undefined;
            face = undefined;
            coatIndex = -1;
            if (!role)
                return;
            const character = role === 'hero' ? 'hero' : 'resident', identity = role === 'hero' ? 0 : variant;
            const t = (0, model_people_js_1.cabinAppearance)(character, identity);
            driver = new T.Group();
            driver.name = role === 'hero' ? 'seated-player' : 'seated-resident';
            spine = new T.Group();
            spine.position.copy(hips);
            spine.rotation.x = c.drivingPose.backAngle;
            const jacket = t.torso.clone();
            jacket.geometry = (0, human_cloth_js_1.seatedJacketGeometry)(jacket.geometry, t.cut === 'quilted' ? 1.18 : t.cut === 'wool' ? .67 : .94);
            privateGeometry.add(jacket.geometry);
            spine.add(jacket);
            clothing.push({ mesh: jacket, original: jacket.geometry });
            const tail = t.tail.clone();
            tail.position.y = .008;
            spine.add(tail);
            clothing.push({ mesh: tail, original: tail.geometry });
            if (t.strap) {
                const strap = t.strap.clone();
                strap.position.set(0, .39, 0);
                spine.add(strap);
            }
            head = new T.Group();
            head.name = 'driver-head';
            head.position.y = .558;
            head.add(t.head.clone());
            spine.add(head);
            face = (0, model_expression_js_1.expression)(character, t.skin, head, identity);
            head.traverse(part => {
                if (part instanceof T.Mesh && ['animated-oral-skin', 'articulated-eyes', 'anatomical-eyelids', 'rounded-corneal-film'].includes(part.name))
                    privateGeometry.add(part.geometry);
            });
            if (t.flap) {
                flap = t.flap.clone();
                flap.name = 'satchel-flap';
                spine.add(flap);
            }
            if (role === 'hero' && t.parcel) {
                parcel = t.parcel.clone();
                parcel.name = 'switch-controller';
                parcel.position.copy(require("./human-wardrobe.js").satchelPlacement.contents);
                parcel.rotation.set(.07, 0, .07);
                spine.add(parcel);
            }
            const lowerBody = (0, model_cabin_lower_js_1.seatedLegs)(t, kind);
            lowerBody.position.copy(hips);
            driver.add(lowerBody, spine);
            for (let i = 0; i < 2; i++) {
                const sign = i ? 1 : -1;
                const shoulder = new T.Group(), elbow = new T.Group();
                shoulder.position.set(sign * t.shoulderWidth, .420, 0).applyQuaternion(spine.quaternion).add(hips);
                const upper = t.aUpper[i].clone(), lower = t.aLower[i].clone();
                const streetGlove = lower.getObjectByName('winter-glove');
                if (streetGlove)
                    streetGlove.removeFromParent();
                elbow.position.y = -.251;
                shoulder.add(upper, elbow);
                elbow.add(lower);
                driver.add(shoulder);
                const gusset = (0, human_cloth_js_1.attachBend)(t.armBends[i], shoulder, elbow);
                const cap = (0, human_cloth_js_1.fitShoulder)(upper, spine, shoulder, sign * t.shoulderWidth);
                privateGeometry.add(gusset.mesh.geometry);
                privateGeometry.add(upper.geometry);
                for (const mesh of [upper, lower, gusset.mesh])
                    clothing.push({ mesh, original: mesh === gusset.mesh ? t.armBends[i].geometry : mesh === upper ? t.aUpper[i].geometry : mesh.geometry });
                const key = character + t.skin + sign;
                const template = gripTemplates.get(key) ?? grip(sign, role === 'hero', t.skin);
                gripTemplates.set(key, template);
                const hand = template.mesh.clone();
                hand.name = i ? 'right-rim-grip' : 'left-rim-grip';
                socket.add(hand);
                arms.push({ origin: shoulder.position.clone(), shoulder, elbow, hand, wrist: template.wrist, update() { cap(); gusset.update(); } });
            }
            cockpit.add(driver);
        }
        function showDriver(role, distance, coat) {
            const next = distance > 34 ? 'hidden' : distance > (detail === 'medium' ? 10 : 12) ? 'medium' : 'close';
            if (next === 'close' || !role)
                setDriver(role);
            const close = next === 'close' && !!role;
            if (driver && driver.visible !== close) {
                driver.visible = close;
                for (const { hand } of arms)
                    hand.visible = close;
            }
            if (next === 'medium' && role) {
                const selectedCoat = role === 'hero' ? coat : 0;
                if (!medium || mediumRole !== role || mediumCoat !== selectedCoat) {
                    const t = (0, model_distance_js_1.distantAppearance)(role === 'hero' ? 'hero' : 'resident', role === 'hero' ? 0 : variant);
                    if (!medium || mediumRole !== role) {
                        if (medium)
                            cockpit.remove(medium);
                        medium = t.rest.clone();
                        medium.name = 'mid-distance-driver';
                        medium.position.set(-c.seatX, c.drivingPose.hipY + .022 - .64, c.seatZ);
                        cockpit.add(medium);
                        mediumRole = role;
                    }
                    medium.geometry = t.geometry(0, false, 0, 1, selectedCoat);
                    mediumCoat = selectedCoat;
                }
                medium.visible = true;
            }
            else if (medium)
                medium.visible = false;
            detail = next;
            return close;
        }
        return { root: cockpit, dispose() { setDriver(null); }, update(dt, speed, steer, role, hasBlock = false, coat = 0, cameraDistance = 0) {
                const close = showDriver(role, cameraDistance, coat);
                const oldAngle = wheelAngle;
                if (cameraDistance <= 34) {
                    wheelAngle += (-steer * 2.75 - wheelAngle) * (1 - Math.exp(-dt * 9));
                    wheel.rotation.z = wheelAngle;
                }
                if (!close)
                    return;
                if (role === 'hero' && coat !== coatIndex) {
                    for (const { mesh, original } of clothing) {
                        (0, human_cloth_js_1.paintCloth)(mesh, original, coat);
                        if (mesh.userData.articulated)
                            privateGeometry.add(mesh.geometry);
                    }
                    coatIndex = coat;
                }
                if (flap)
                    flap.rotation.x = hasBlock ? -.34 : 0;
                if (parcel)
                    parcel.visible = hasBlock;
                if (!head)
                    return;
                time += dt;
                gaze += ((speed < -.35 ? -1.37 : steer * .19) - gaze) * (1 - Math.exp(-dt * 5.5));
                head.rotation.y = gaze;
                head.rotation.z = -steer * .043;
                head.rotation.x = .16 + .018 * Math.sin(time * 1.53);
                const blink = ((time + variant * .59) % 4.87) / .14;
                face?.(steer * .30, 0, blink < 1 ? Math.sin(blink * Math.PI) : 0, 0);
                for (let i = 0; i < 2; i++) {
                    const sign = i ? 1 : -1, arm = arms[i];
                    let lift = 0;
                    if (regrip[i] <= 0) {
                        angles[i] += wheelAngle - oldAngle;
                        const limit = sign * Math.sign(angles[i]) > 0 ? 1.48 : 1.07;
                        if (Math.abs(angles[i]) > limit && regrip[1 - i] <= 0) {
                            regrip[i] = .30;
                            fromAngle[i] = angles[i];
                        }
                    }
                    if (regrip[i] > 0) {
                        regrip[i] = Math.max(0, regrip[i] - dt);
                        const u = 1 - regrip[i] / .30;
                        angles[i] = fromAngle[i] * (1 - u * u * (3 - 2 * u));
                        lift = .067 * Math.sin(u * Math.PI);
                    }
                    arm.hand.rotation.z = angles[i];
                    arm.hand.position.z = lift;
                    orient.setFromAxisAngle(axis, angles[i]);
                    handPos.copy(arm.wrist).applyQuaternion(orient);
                    handPos.z += lift;
                    handPos.applyQuaternion(socket.quaternion).add(socket.position);
                    shoulderPos.copy(arm.origin);
                    direction.copy(handPos).sub(shoulderPos);
                    const distance = Math.max(.01, direction.length());
                    direction.multiplyScalar(1 / distance);
                    const extension = Math.min(.082, Math.max(0, distance - .443));
                    const reach = distance - extension;
                    shoulderPos.addScaledVector(direction, extension);
                    bend.set(sign * .62, -1, .26).addScaledVector(direction, -bend.dot(direction)).normalize();
                    const uLen = .251, fLen = .198, along = T.MathUtils.clamp((uLen * uLen + reach * reach - fLen * fLen) / (2 * reach), .02, uLen);
                    const perpendicular = Math.sqrt(Math.max(0, uLen * uLen - along * along));
                    elbowPos.copy(shoulderPos).addScaledVector(direction, along).addScaledVector(bend, perpendicular);
                    arm.shoulder.quaternion.setFromUnitVectors(down, lowerDirection.subVectors(elbowPos, shoulderPos).normalize());
                    arm.shoulder.position.copy(shoulderPos);
                    arm.elbow.quaternion.setFromUnitVectors(down, lowerDirection.subVectors(handPos, elbowPos).normalize());
                    inverse.copy(arm.shoulder.quaternion).invert();
                    arm.elbow.quaternion.premultiply(inverse);
                    arm.update();
                }
            } };
    };
}
