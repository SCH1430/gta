"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPatrolView = createPatrolView;
const T = require("../engine/three.module.min.js");
const models_js_1 = require("./models.js");
function patrolSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#182a42';
    ctx.fillRect(0, 0, 128, 40);
    ctx.strokeStyle = '#a2b4ba';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 126, 38);
    ctx.font = 'bold 23px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dfe9e6';
    ctx.fillText('ПАТРУЛЬ', 64, 28);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    return new T.MeshBasicMaterial({ map, side: T.DoubleSide });
}
function createPatrolView(scene) {
    const live = new Map();
    const wool = new T.MeshLambertMaterial({ color: '#253c58' }), reflector = new T.MeshLambertMaterial({ color: '#bbd1d2', emissive: '#2d4348' });
    const patch = new T.PlaneGeometry(.234, .073);
    const shoulderTrim = new T.BoxGeometry(.136, .018, .128);
    let sign;
    function actorFor(unit) {
        let value = live.get(unit.id);
        if (value)
            return value;
        value = (0, models_js_1.createPerson)('resident', unit.side === 1 ? 7 : 4);
        const spine = value.root.getObjectByName('spine');
        if (spine) {
            sign ??= patrolSign();
            for (const direction of [-1, 1]) {
                const badge = new T.Mesh(patch, sign);
                badge.position.set(0, .329, direction * (direction === 1 ? .143 : .149));
                if (direction === -1)
                    badge.rotation.y = Math.PI;
                spine.add(badge);
            }
            for (const key of ['left-shoulder', 'right-shoulder']) {
                const shoulder = value.root.getObjectByName(key);
                if (!shoulder)
                    continue;
                const trim = new T.Mesh(shoulderTrim, reflector);
                trim.position.y = -.113;
                shoulder.add(trim);
            }
        }
        const neck = value.root.getObjectByName('neck');
        if (neck) {
            const band = new T.Mesh(new T.CylinderGeometry(.103, .101, .048, 12), wool);
            band.position.set(0, .196, -.007);
            neck.add(band);
        }
        live.set(unit.id, value);
        return value;
    }
    return { update(dt, units, hero, outside) {
            const current = new Set();
            if (outside)
                for (const unit of units) {
                    if ((unit.x - hero.x) ** 2 + (unit.z - hero.z) ** 2 > 102 ** 2)
                        continue;
                    current.add(unit.id);
                    const actor = actorFor(unit);
                    if (!actor.root.parent) {
                        scene.add(actor.root);
                        actor.resetMotion();
                    }
                    actor.root.position.set(unit.x, unit.y, unit.z);
                    actor.root.rotation.y = unit.yaw;
                    const gaze = Math.atan2(unit.x - hero.x, unit.z - hero.z) - unit.yaw;
                    actor.update(dt, unit.speed, false, {
                        glance: unit.phase === 'intercept' ? Math.atan2(Math.sin(gaze), Math.cos(gaze)) : 0,
                        strike: unit.action, getUp: unit.getUp,
                    });
                }
            for (const [id, actor] of live)
                if (!current.has(id))
                    actor.root.removeFromParent();
        } };
}
