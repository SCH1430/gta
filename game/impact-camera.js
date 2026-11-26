"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpactCamera = void 0;
class ImpactCamera {
    x = 0;
    z = 0;
    force = 0;
    age = 0;
    kick(x, z, strength) {
        if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(strength) || strength <= 0 || strength < this.force * Math.exp(-this.age * 12))
            return;
        this.x = x;
        this.z = z;
        this.force = Math.min(1, strength);
        this.age = 0;
    }
    clear() { this.force = 0; }
    update(camera, dt, yaw, scale, cockpit) {
        if (!this.force)
            return;
        const t = this.age;
        this.age += dt;
        if (t > .39) {
            this.clear();
            return;
        }
        if (scale <= 0)
            return;
        const response = this.force * scale * (cockpit ? .76 : 1) * (1 - 2.35 * t) * Math.exp(-t * 10);
        const lateral = this.x * Math.cos(yaw) - this.z * Math.sin(yaw);
        const lengthwise = -this.x * Math.sin(yaw) - this.z * Math.cos(yaw);
        camera.rotateY(.022 * lateral * response);
        camera.rotateX((.010 + .020 * lengthwise) * response);
        camera.rotateZ(-.017 * lateral * response);
        camera.updateMatrixWorld();
    }
}
exports.ImpactCamera = ImpactCamera;
