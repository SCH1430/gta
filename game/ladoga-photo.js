"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LadogaPhoto = void 0;
const T = require("../engine/three.module.min.js");
const camera_volume_js_1 = require("./camera-volume.js");
class LadogaPhoto {
    camera = new T.PerspectiveCamera(58, 1, .09, 185);
    target = new T.Vector3();
    direction = new T.Vector3();
    best = new T.Vector3();
    frame(car, cars, aspect) {
        const turn = Math.sin(car.yaw), along = Math.cos(car.yaw);
        const prefer = car.systems?.donorDoors?.rightSide && !car.systems?.donorDoors?.leftSide ? 1 : -1;
        this.target.set(car.x, car.y + .82, car.z);
        let bestDistance = 0, bestScore = 0;
        for (const [x, z] of [[.86, -.66], [.87, .67], [-.86, -.66], [-.88, .68], [1, -.17], [-1, -.17]]) {
            const side = x * prefer;
            this.direction.set(side * along + z * turn, .33, -side * turn + z * along).normalize();
            const available = (0, camera_volume_js_1.cameraClearance)(this.target, this.direction, 6.8, .21, cars, car.id);
            const score = Math.min(6.75, available) + (x > 0 ? .38 : 0);
            if (available < 3.45 || score <= bestScore)
                continue;
            bestScore = score;
            bestDistance = available;
            this.best.copy(this.direction);
        }
        if (!bestDistance)
            return null;
        this.camera.position.copy(this.target).addScaledVector(this.best, bestDistance - .045);
        this.camera.lookAt(this.target);
        this.camera.aspect = aspect;
        this.camera.fov = Math.max(37, Math.min(70, 37 + (6.7 - bestDistance) * 7 + Math.max(0, 1.4 - aspect) * 23));
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();
        return this.camera;
    }
}
exports.LadogaPhoto = LadogaPhoto;
