"use strict";

const T = require("../engine/three.module.min.js");
const { crashRadius, leavesDebris, streetCrashLifetime, streetCrashLimit } = require("./street-incidents.js");
const { groundHeight } = require("./world-layout.js");

const rough = new T.IcosahedronGeometry(1, 0);
const sliver = new T.TetrahedronGeometry(1, 0);
const strip = new T.BoxGeometry(2, 2, 2);
const paint = new T.MeshLambertMaterial({ color: 0xffffff });
const ice = new T.MeshPhongMaterial({ color: 0xffffff, shininess: 95, specular: '#b4d9de', emissive: '#0a191c' });
const powder = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .66, depthWrite: false });
const styles = [
    { type: 'plastic', name: 'Пластик кузова', geometry: rough, material: paint, colors: ['#4d585e', '#7c888c', '#36505d', '#6e8a8d'], count: 7, flight: .26, reach: .96, height: .13, size: [.067, .015, .103] },
    { type: 'wood', name: 'Деревянные щепки', geometry: strip, material: paint, colors: ['#a67b53', '#d0a179', '#835d40'], count: 6, flight: .43, reach: .78, height: .24, size: [.022, .013, .115] },
    { type: 'glass', name: 'Стеклянные осколки', geometry: sliver, material: ice, colors: ['#a6c5c7', '#a3c2cd', '#b7cfcd'], count: 6, flight: .32, reach: 1.08, height: .19, size: [.049, .015, .070] },
    { type: 'snow', name: 'Снежная пыль от удара', geometry: rough, material: powder, colors: ['#d5dee1', '#bbc7cd', '#9bacb5'], count: 4, flight: .52, reach: .64, height: .17, size: [.11, .067, .10] }
].map(style => ({ ...style, colors: style.colors.map(color => new T.Color(color)) }));

function createCrashDebris(scene) {
    const meshes = styles.map(style => {
        const mesh = new T.InstancedMesh(style.geometry, style.material, streetCrashLimit * style.count);
        mesh.name = style.name;
        mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
        mesh.count = 0;
        mesh.visible = false;
        scene.add(mesh);
        return mesh;
    });
    const transform = new T.Object3D(), tint = new T.Color(), counts = styles.map(() => 0);
    return (crashes, now, focus) => {
        counts.fill(0);
        for (const crash of crashes) {
            if (!leavesDebris(crash) || (crash.x - focus.x) ** 2 + (crash.z - focus.z) ** 2 > 57 ** 2)
                continue;
            const age = now - crash.at;
            if (age < 0 || age >= streetCrashLifetime)
                continue;
            const data = crash.debris, seed = crash.x * .78 + crash.z * 1.31;
            const heading = data && (data.dx || data.dz) ? Math.atan2(data.dz, data.dx) : seed;
            for (let layer = 0; layer < styles.length; layer++) {
                const style = styles[layer], mesh = meshes[layer], glass = style.type === 'glass', snow = style.type === 'snow';
                if (glass ? !data?.glass : snow ? !data?.snow : style.type !== (data?.material ?? 'plastic'))
                    continue;
                const time = snow ? age - .18 : age;
                if (time < 0 || snow && time > style.flight)
                    continue;
                const fade = snow ? Math.sin(Math.PI * time / style.flight) : Math.min(1, (streetCrashLifetime - age) / 1.1);
                for (let i = 0; i < style.count && counts[layer] < mesh.instanceMatrix.count; i++) {
                    const scatter = (i / (style.count - 1) - .5) * (glass ? 1.75 : 1.31), angle = heading + scatter + .17 * Math.sin(seed + i * 3.7);
                    const flight = style.flight + .025 * (i % 4), airborne = Math.min(1, time / flight), land = Math.max(0, time - flight);
                    const glide = 1 - Math.exp(-land * (style.type === 'plastic' ? 3.1 : 7));
                    const distance = crashRadius(crash) * style.reach * (.68 + i * .072) * (airborne * .74 + glide * .26);
                    const x = crash.x + Math.cos(angle) * distance, z = crash.z + Math.sin(angle) * distance;
                    const bounce = Math.max(0, Math.sin(land * 27)) * Math.exp(-land * 14) * (style.type === 'wood' ? .095 : .04);
                    const lift = Math.sin(airborne * Math.PI) * style.height * (.83 + i * .09) + bounce;
                    const blur = snow ? .62 + airborne * .73 : .73 + (i % 4) * .14;
                    const spin = airborne * (style.type === 'wood' ? Math.PI * 2 : 2.7), [sx, sy, sz] = style.size;
                    transform.position.set(x, groundHeight(x, z) + lift + sy, z);
                    transform.rotation.set(style.type === 'wood' ? spin : Math.sin(spin) * (1 - airborne), angle + spin * .47, Math.sin(i * 2.3 + spin) * (1 - airborne));
                    transform.scale.set(sx * fade * blur, sy * fade * blur, sz * fade * blur);
                    transform.updateMatrix();
                    const index = counts[layer]++;
                    mesh.setMatrixAt(index, transform.matrix);
                    tint.copy(style.colors[i % style.colors.length]);
                    if (glass)
                        tint.lerp(glint, (1 - airborne) * Math.pow(Math.max(0, Math.sin(time * 49 + seed + i * 4.1)), 7));
                    mesh.setColorAt(index, tint);
                }
            }
        }
        meshes.forEach((mesh, layer) => {
            mesh.count = counts[layer];
            mesh.visible = mesh.count > 0;
            if (mesh.visible) {
                mesh.instanceMatrix.needsUpdate = true;
                mesh.instanceColor.needsUpdate = true;
            }
        });
    };
}

const glint = new T.Color('#f0ffff');
module.exports = { createCrashDebris };
