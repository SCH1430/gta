"use strict";
const T = require("../engine/three.module.min.js");
const { snowRoofAt } = require("./camera-volume.js");
const { groundHeight } = require("./world-layout.js");
const { bridges, canal } = require('./world-expansion-layout.js');
const { specs } = require("./vehicle-cabin.js");

function softFlake() {
    const size = 32, pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = (x + .5) / size * 2 - 1, v = (y + .5) / size * 2 - 1;
            // A small aggregate of ice grains, with an asymmetric, feathered edge.
            const a = Math.exp(-5.5 * ((u + .18) ** 2 * 1.6 + (v - .05) ** 2));
            const b = .75 * Math.exp(-8.2 * ((u - .24) ** 2 + (v + .23) ** 2 * .85));
            const c = .58 * Math.exp(-10 * ((u - .15) ** 2 + (v - .33) ** 2));
            const i = (y * size + x) * 4;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
            pixels[i + 3] = Math.round(255 * Math.min(1, a + b + c) * Math.min(1, Math.max(0, (1 - u*u - v*v) * 4)));
        }
    }
    const map = new T.DataTexture(pixels, size, size);
    map.minFilter = map.magFilter = T.LinearFilter;
    map.needsUpdate = true;
    return map;
}
exports.softFlake = softFlake;

const wrap = (value, span) => value - span * Math.floor(value / span + .5);
function underVehicle(x,y,z,cars) {
    for (const car of cars) {
        const bx=x-car.x, bz=z-car.z, body=specs[car.kind];
        if (y>car.y+body.roof || Math.abs(bx)>3.5 || Math.abs(bz)>3.5) continue;
        const co=Math.cos(car.yaw), si=Math.sin(car.yaw);
        const lx=bx*co-bz*si, lz=bx*si+bz*co;
        if (Math.abs(lx)<body.w && lz>body.front && lz<body.rear) return true;
    }
    return false;
}
function createSnowfall(scene, budget) {
    const nearCapacity = Math.ceil(budget * .44);
    const texture = softFlake();
    const near = new T.InstancedMesh(new T.PlaneGeometry(1, 1),
        new T.MeshBasicMaterial({ map:texture, transparent:true, depthWrite:false, toneMapped:false }),
        nearCapacity);
    const geo = new T.BufferGeometry(), farCapacity = budget - nearCapacity + 1;
    const cloud = new T.BufferAttribute(new Float32Array(farCapacity * 3),3).setUsage(T.DynamicDrawUsage);
    const inks = new T.BufferAttribute(new Float32Array(farCapacity * 3),3).setUsage(T.DynamicDrawUsage);
    geo.setAttribute('position',cloud); geo.setAttribute('color',inks);
    const far = new T.Points(geo,new T.PointsMaterial({ map:texture, vertexColors:true, size:.083,
        transparent:true, depthWrite:false, toneMapped:false }));
    near.name = 'Ближние снежные хлопья'; far.name = 'Дальний снег';
    near.instanceMatrix.setUsage(T.DynamicDrawUsage);
    near.frustumCulled = far.frustumCulled = false;
    near.renderOrder = 5; far.renderOrder = 4;
    near.count = 0; geo.setDrawRange(0,0);
    scene.add(far,near);
    let state = 7719;
    function random() {
        state = (Math.imul(state,1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    }
    const particles = Array.from({length:budget},(_,i) => {
        const span = i < nearCapacity ? 13 : 33, height = i < nearCapacity ? 7 : 15;
        return {span,height,x:random()*span,y:random()*height,z:random()*span,phase:random()*Math.PI*2,
            fall:.42 + .68*random(),sail:.67 + .7*random(),frequency:.95 + random()*1.5,
            size:.060 + .09*random()};
    });
    const pose = new T.Object3D(), forward = new T.Vector3(), ink = new T.Color();
    const shade = new T.Color(), shadeNight = new T.Color('#aab8cc'), shadeDay = new T.Color('#e2e9ee');
    const streetInk = new T.Color('#ffdfa4'), crossingInk = new T.Color('#eeeae1');
    const nearbyCars = [];
    let driftX = 0, driftZ = 0, drop = 0;
    return function update(dt, now, camera, weather, limits, daylight, lamps, cars) {
        const eye = camera.position;
        const crossing = eye.z >= canal.north && eye.z <= canal.south && bridges.some(b => Math.abs(eye.x - b.x) < 8);
        const courtyard = eye.x > -42 && eye.x < 0 && eye.z > -17 && eye.z < 18;
        const windExposure = crossing ? 1.35 : courtyard ? .55 : 1;
        const total = weather.snow > .015 ? Math.min(budget,Math.ceil(limits.flakes * weather.snow * windExposure)) : 0;
        if (!total) { near.visible = far.visible = false; return; }
        const nearTarget = Math.ceil(total*.44);
        const wet = Math.min(1,Math.max(0,weather.wetSnow ?? 0));
        driftX += weather.gustX*windExposure*3.65*dt; driftZ += weather.gustZ*windExposure*3.65*dt;
        drop += dt*(1+wet*.70);
        shade.copy(shadeNight).lerp(shadeDay,daylight);
        near.material.opacity = .72 + .16 * weather.snow;
        far.material.opacity = .44 + weather.snow * .28;
        far.material.size = .083 + .031 * wet;
        camera.getWorldDirection(forward);
        nearbyCars.length = 0;
        for (const car of cars) {
            if (Math.abs(car.x-eye.x)<32 && Math.abs(car.z-eye.z)<32 && specs[car.kind])
                nearbyCars.push(car);
        }
        let close = 0, distant = 0;
        for (let k = 0; k < total; k++) {
            const front = k < nearTarget, f = particles[front ? k : nearCapacity+k-nearTarget];
            const phase = now*f.frequency+f.phase, flutter = Math.sin(phase);
            const centerX = eye.x + forward.x * f.span*.25, centerZ = eye.z + forward.z * f.span*.25;
            const centerY = eye.y + f.height * .19;
            // Wrap an advecting world-space cloud. Camera translation changes its edges, not the trajectories.
            const x = centerX + wrap(f.x+driftX*f.sail+.22*flutter-centerX,f.span);
            const y = centerY + wrap(f.y-drop*f.fall+.045*Math.cos(phase)-centerY,f.height);
            const z = centerZ + wrap(f.z+driftZ*f.sail+.16*Math.cos(phase*.81+f.phase)-centerZ,f.span);
            const dx = x-eye.x, dy = y-eye.y, dz = z-eye.z, distance2 = dx*dx+dy*dy+dz*dz;
            if (distance2<.27 || y<groundHeight(x,z)+.025 || y<snowRoofAt(x,z)) continue;
            if (underVehicle(x,y,z,nearbyCars)) continue;
            let strongest=0, light=streetInk;
            for (const lamp of lamps) {
                const depth=lamp.y-y;
                if (depth<=0 || depth>7.8) continue;
                const t=Math.min(1,depth/5.4), grid=lamp.grid;
                const lx=lamp.x+(grid.crosswalk ? (grid.crosswalk.x-lamp.x)*t : 0);
                const lz=lamp.z+(grid.crosswalk ? (grid.crosswalk.z-lamp.z)*t : 0);
                const reach=.65+depth*.66;
                const exposure=1-((x-lx)**2+(z-lz)**2)/(reach*reach);
                if (exposure>strongest) { strongest=exposure; light=grid.crosswalk ? crossingInk : streetInk; }
            }
            ink.copy(shade).lerp(light,strongest*(1-daylight)).multiplyScalar(.86+strongest*.35);
            if (front) {
                const scale=f.size*(1+wet*.48)*T.MathUtils.smoothstep(distance2,.27,1.4);
                pose.position.set(x,y,z); pose.quaternion.copy(camera.quaternion);
                pose.rotateZ(f.phase + .42*flutter);
                pose.scale.set(scale*(.72+.24*Math.abs(flutter)),scale,1); pose.updateMatrix();
                near.setMatrixAt(close,pose.matrix); near.setColorAt(close++,ink);
            } else {
                cloud.setXYZ(distant,x,y,z); inks.setXYZ(distant++,ink.r,ink.g,ink.b);
            }
        }
        near.count=close; near.visible=close>0; far.visible=distant>0;
        near.instanceMatrix.needsUpdate=true;
        if (near.instanceColor) near.instanceColor.needsUpdate=true;
        geo.setDrawRange(0,distant); cloud.needsUpdate=true; inks.needsUpdate=true;
    };
}
exports.createSnowfall = createSnowfall;
