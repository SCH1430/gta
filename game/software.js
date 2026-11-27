"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftwareRenderer = void 0;
const T = require("../engine/three.module.min.js");
const software_raster_js_1 = require("./software-raster.js");
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const lookup = Uint8Array.from({ length: 4097 }, (_, i) => { const v = i / 4096; return Math.round(255 * (v <= .0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - .055)); });
const gamma = (n) => lookup[Math.min(4096, Math.max(0, (n * 4096) | 0))];
const vertex = () => ({ x: 0, y: 0, q: 0, u: 0, v: 0, cx: 0, cy: 0, cz: 0 });
const geometryCache = new WeakMap();
const versionOf = (attribute) => 'data' in attribute ? attribute.data.version : attribute.version;
function triples(attribute, target) {
    if (!('data' in attribute) && !attribute.normalized && attribute.itemSize === 3 && attribute.array instanceof Float32Array)
        return attribute.array;
    target ??= new Float32Array(attribute.count * 3);
    for (let i = 0, j = 0; i < attribute.count; i++, j += 3) {
        target[j] = attribute.getX(i);
        target[j + 1] = attribute.getY(i);
        target[j + 2] = attribute.getZ(i);
    }
    return target;
}
function refreshHumanSurface(g) {
    const h = g.human;
    const pv = versionOf(h.positions), nv = versionOf(h.normals);
    if (pv !== h.positionVersion) {
        g.coords = triples(h.positions, g.coords);
        h.positionVersion = pv;
    }
    if (nv !== h.normalVersion) {
        g.norm = triples(h.normals, g.norm);
        h.normalVersion = nv;
    }
    const color = h.vertexColors;
    if (color && h.colorVersion !== versionOf(color)) {
        for (let i = 0; i < color.count; i++)
            g.colors[i] = (0, software_raster_js_1.pack)(gamma(color.getX(i)), gamma(color.getY(i)), gamma(color.getZ(i)));
        h.colorVersion = versionOf(color);
    }
    const texcoords = h.textureUV;
    if (texcoords && h.uvVersion !== versionOf(texcoords)) {
        for (let i = 0; i < texcoords.count; i++) {
            g.uv[i * 2] = texcoords.getX(i);
            g.uv[i * 2 + 1] = texcoords.getY(i);
        }
        h.uvVersion = versionOf(texcoords);
    }
}
function humanGeometry(g) {
    const p = g.getAttribute('position'), uv = g.getAttribute('uv'), index = g.index;
    const faces = new Uint32Array(index?.count ?? p.count);
    for (let i = 0; i < faces.length; i++)
        faces[i] = index ? index.getX(i) : i;
    const texcoords = new Float32Array(p.count * 2);
    if (!g.boundingSphere)
        g.computeBoundingSphere();
    const sphere = g.boundingSphere;
    const result = {
        human: { positions: p, normals: g.getAttribute('normal'), vertexColors: g.getAttribute('color'), textureUV: uv,
            positionVersion: -1, normalVersion: -1, colorVersion: -1, uvVersion: -1 },
        coords: triples(p), norm: triples(g.getAttribute('normal')),
        colors: new Uint32Array(p.count), uv: texcoords, faces, projected: Array.from({ length: p.count }, () => ({ ...vertex(), rq: 0, gq: 0, bq: 0 })),
        cx: sphere.center.x, cy: sphere.center.y, cz: sphere.center.z, radius: sphere.radius
    };
    refreshHumanSurface(result);
    return result;
}
function geometry(g) {
    const pose = g.userData.deformingSurface ? versionOf(g.getAttribute('position')) : undefined;
    let cached = geometryCache.get(g);
    if (cached && cached.pose === pose) {
        if (cached.human)
            refreshHumanSurface(cached);
        return cached;
    }
    if (g.userData.humanSurface && g.hasAttribute('normal')) {
        cached = humanGeometry(g);
        geometryCache.set(g, cached);
        return cached;
    }
    const p = g.getAttribute('position'), uv = g.getAttribute('uv'), col = g.getAttribute('color'), ix = g.index, n = ix ? ix.count : p.count;
    const points = [], coords = [], norm = [], colors = [], indices = [], lookup = new Map();
    const vi = (j) => {
        const k = ix ? ix.getX(j) : j, x = p.getX(k), y = p.getY(k), z = p.getZ(k), u = uv ? uv.getX(k) : 0, v = uv ? uv.getY(k) : 0;
        const tag = x + ',' + y + ',' + z + ',' + u + ',' + v;
        let i = lookup.get(tag);
        if (i === undefined) {
            i = points.length / 3;
            lookup.set(tag, i);
            points.push(x, y, z);
            coords.push(u, v);
        }
        return i;
    };
    for (let j = 0; j + 2 < n; j += 3) {
        const a = vi(j), b = vi(j + 1), c = vi(j + 2), aa = a * 3, bb = b * 3, cc = c * 3;
        const x1 = points[bb] - points[aa], y1 = points[bb + 1] - points[aa + 1], z1 = points[bb + 2] - points[aa + 2], x2 = points[cc] - points[aa], y2 = points[cc + 1] - points[aa + 1], z2 = points[cc + 2] - points[aa + 2];
        let x = y1 * z2 - z1 * y2, y = z1 * x2 - x1 * z2, z = x1 * y2 - y1 * x2;
        const l = Math.hypot(x, y, z);
        if (l < 1e-13)
            continue;
        indices.push(a, b, c);
        norm.push(x / l, y / l, z / l);
        const k = ix ? ix.getX(j) : j;
        colors.push(col ? (0, software_raster_js_1.pack)(gamma(col.getX(k)), gamma(col.getY(k)), gamma(col.getZ(k))) : 0xffffffff);
    }
    if (!g.boundingSphere)
        g.computeBoundingSphere();
    const bounds = g.boundingSphere;
    cached = { pose, coords: Float32Array.from(points), uv: Float32Array.from(coords), faces: Uint32Array.from(indices), norm: Float32Array.from(norm), colors: Uint32Array.from(colors), projected: Array.from({ length: points.length / 3 }, vertex), cx: bounds.center.x, cy: bounds.center.y, cz: bounds.center.z, radius: bounds.radius };
    geometryCache.set(g, cached);
    return cached;
}
class SoftwareRenderer {
    info = { render: { calls: 0, triangles: 0 } };
    domElement;
    isSoftwareRenderer = true;
    outputColorSpace = T.SRGBColorSpace;
    ctx;
    buffer;
    ratio = 1;
    cpuScale = 1;
    requestedWidth = 0;
    requestedHeight = 0;
    measured = 0;
    samples = 0;
    adjustAt = 0;
    resizeNext = false;
    frustum = new T.Frustum();
    projectionView = new T.Matrix4();
    bound = new T.Sphere();
    displacement = new T.Vector3();
    images = new WeakMap();
    width = 1;
    height = 1;
    fx = 1;
    fy = 1;
    near = .09;
    far = 300;
    skyPixels = new Uint32Array(1);
    skyKey = '';
    skySource;
    skyTint = 1;
    skyTexels;
    skyColumns = new Int32Array(0);
    m = new T.Matrix4();
    local = new T.Matrix4();
    mv = new T.Matrix4();
    normal = new T.Matrix3();
    clipped = [vertex(), vertex()];
    polygon = [];
    color = new T.Color();
    fogNear = 75;
    fogFar = 205;
    fogColor = [142, 158, 176];
    localExposure = 1;
    crossingLight;
    crossingAim = new T.Vector3();
    incidentLight = new T.Vector3();
    style = { r: 255, g: 255, b: 255, fogR: 0, fogG: 0, fogB: 0, alpha: 1, add: false, write: true };
    late = [];
    dots = [];
    staticRoots = new WeakSet();
    staticMeshes = [];
    dynamicRoots = [];
    indexedScene;
    staticColor = new Uint32Array(0);
    staticZ = new Float32Array(0);
    lastCamera = new Float64Array(16);
    lastProjection = 0;
    lastSky = '';
    lastFog = '';
    hasSnapshot = false;
    sceneryCells = [];
    indexScenery(scene) {
        this.indexedScene = scene;
        this.indexedZone = scene.userData.interiorZone;
        this.indexedCampusRevision = scene.userData.campusRevision;
        this.staticRoots = new WeakSet();
        this.staticMeshes = [];
        this.dynamicRoots = [];
        this.sceneryCells = [];
        this.hasSnapshot = false;
        const isGround = (m) => m.userData.groundSurface === true || (m.geometry.type === 'PlaneGeometry' && Math.abs(m.rotation.x) > 1.4) || m.name === 'Промышленный район — покрытие и лёд';
        const visit = (o, inside, cell) => {
            if (o.userData.schoolFloor && !o.visible) return;
            if (o.userData.dynamicScenery && inside) {
                this.dynamicRoots.push(o);
                return;
            }
            if (o.userData.staticScenery) {
                this.staticRoots.add(o);
                inside = true;
            }
            if (inside && o.userData.regionalCell) {
                cell = { ancestors: [...(cell?.ancestors ?? []), o], props: [], ground: [], visible: true };
                this.sceneryCells.push(cell);
            }
            if (inside && o.isMesh) {
                const mesh = o;
                if (cell)
                    (isGround(mesh) ? cell.ground : cell.props).push(mesh);
                else
                    this.staticMeshes.push(mesh);
            }
            for (const child of o.children)
                visit(child, inside, cell);
        };
        visit(scene, false);
        this.staticMeshes.sort((a, b) => Number(isGround(a)) - Number(isGround(b)));
    }
    renderScenery(camera) {
        for (const cell of this.sceneryCells) {
            cell.visible = cell.ancestors.every(group => group.visible);
            if (cell.visible)
                for (const m of cell.props)
                    if (m.visible)
                        this.mesh(m, camera);
        }
        for (const m of this.staticMeshes)
            if (m.visible)
                this.mesh(m, camera);
        for (const cell of this.sceneryCells)
            if (cell.visible)
                for (const m of cell.ground)
                    if (m.visible)
                        this.mesh(m, camera);
    }
    moving(o, camera) {
        if (!o.visible || this.staticRoots.has(o))
            return;
        if (o.isLOD) {
            const lod = o;
            lod.update(camera);
            const levels = lod.levels;
            if (levels.length === 2 && levels[1].distance >= 20) {
                this.displacement.setFromMatrixPosition(lod.matrixWorld).sub(camera.position);
                if (this.displacement.lengthSq() > Math.max(10, levels[1].distance * .63) ** 2) {
                    levels[0].object.visible = false;
                    levels[1].object.visible = true;
                    lod.prepareFarPose?.();
                }
            }
        }
        const mesh = o;
        if (mesh.isMesh) {
            const mat = mesh.material;
            if (mat.transparent)
                this.late.push(mesh);
            else
                this.mesh(mesh, camera);
        }
        else if (o.isPoints)
            this.dots.push(o);
        for (let i = 0; i < o.children.length; i++)
            this.moving(o.children[i], camera);
    }
    constructor(canvas) {
        this.domElement = canvas;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx)
            throw Error('Canvas 2D недоступен');
        this.ctx = ctx;
    }
    setPixelRatio(r) { this.ratio = r; }
    setSize(w, h, updateStyle = true) {
        this.requestedWidth = w;
        this.requestedHeight = h;
        const aspect = w / Math.max(1, h), edge = Math.min(624, w * .85), scale = Math.min(1, this.ratio) * this.cpuScale;
        const width = Math.max(16, Math.round(edge * scale)), height = Math.max(16, Math.round(width / aspect));
        if (this.buffer && width === this.width && height === this.height)
            return;
        this.width = width;
        this.height = height;
        this.domElement.width = width;
        this.domElement.height = height;
        if (updateStyle) {
            this.domElement.style.width = w + 'px';
            this.domElement.style.height = h + 'px';
        }
        this.buffer = new software_raster_js_1.Raster(width, height, this.ctx);
        this.skyPixels = new Uint32Array(width * height);
        this.skyColumns = new Int32Array(width);
        this.skyKey = '';
        this.staticColor = new Uint32Array(width * height);
        this.staticZ = new Float32Array(width * height);
        this.hasSnapshot = false;
    }
    getContext() { return { isContextLost: () => false }; }
    pixels(t) {
        if (!t)
            return;
        let d = this.images.get(t);
        if (!d) {
            d = (0, software_raster_js_1.readPixels)(t);
            if (d)
                this.images.set(t, d);
        }
        return d;
    }
    sky(scene, cam) {
        const bg = scene.background, tex = bg?.isTexture ? this.pixels(bg) : undefined;
        const step = Math.round((scene.backgroundIntensity ?? 1) * 24) / 24;
        const intensity = Math.max(.24, step) ** .48;
        if (bg instanceof T.Color) {
            const key = 'solid' + bg.getHex() + '/' + step;
            if (this.skyKey !== key) {
                this.skyPixels.fill((0, software_raster_js_1.pack)(Math.min(255, gamma(bg.r) * intensity), Math.min(255, gamma(bg.g) * intensity), Math.min(255, gamma(bg.b) * intensity)));
                this.skyKey = key;
            }
            return;
        }
        const e = cam.matrixWorld.elements, yaw = Math.atan2(-e[10], -e[8]), pitch = Math.asin(Math.max(-1, Math.min(1, -e[9])));
        const id = [tex ? 1 : 0, (yaw * 270) | 0, (pitch * 220) | 0, (this.fx * 10) | 0, step].join('.');
        if (id === this.skyKey && this.skySource === tex)
            return;
        this.skyKey = id;
        const W = this.width, H = this.height, sky = this.skyPixels;
        if (!tex) {
            this.skySource = undefined;
            for (let y = 0; y < H; y++) {
                const t = y / H;
                sky.fill((0, software_raster_js_1.pack)((110 + 54 * t) * intensity, (131 + 38 * t) * intensity, (156 + 31 * t) * intensity), y * W, (y + 1) * W);
            }
            return;
        }
        if (this.skySource !== tex || this.skyTint !== step) {
            this.skySource = tex;
            this.skyTint = step;
            const bytes = tex.data;
            if (step === 1 && bytes.byteOffset % 4 === 0)
                this.skyTexels = new Uint32Array(bytes.buffer, bytes.byteOffset, tex.w * tex.h);
            else {
                const packed = this.skyTexels = new Uint32Array(tex.w * tex.h);
                for (let i = 0, j = 0; i < packed.length; i++, j += 4)
                    packed[i] = (0, software_raster_js_1.pack)(Math.min(255, bytes[j] * intensity), Math.min(255, bytes[j + 1] * intensity), Math.min(255, bytes[j + 2] * intensity));
            }
        }
        const X = this.skyColumns, packed = this.skyTexels;
        for (let x = 0; x < W; x++) {
            let d = (yaw + Math.atan((x + .5 - W * .5) / this.fx)) / (Math.PI * 2) + .5;
            d -= Math.floor(d);
            X[x] = Math.min(tex.w - 1, (d * tex.w) | 0);
        }
        for (let y = 0; y < H; y++) {
            const angle = pitch + Math.atan((H * .5 - y - .5) / this.fy), row = Math.max(0, Math.min(tex.h - 1, ((.5 - angle / Math.PI) * tex.h) | 0)), base = row * tex.w, yw = y * W;
            for (let x = 0; x < W; x++)
                sky[yw + x] = packed[base + X[x]] | 0xff000000;
        }
    }
    render(scene, camera) {
        if (!this.buffer)
            this.setSize(this.domElement.clientWidth || 640, this.domElement.clientHeight || 360, false);
        if (this.resizeNext) {
            this.resizeNext = false;
            this.setSize(this.requestedWidth, this.requestedHeight, false);
        }
        const started = performance.now();
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        this.projectionView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.projectionView);
        const cp = camera.projectionMatrix.elements;
        this.fx = this.width * .5 * cp[0];
        this.fy = this.height * .5 * cp[5];
        this.near = camera.near;
        this.far = camera.far;
        const fog = scene.fog;
        if (fog instanceof T.Fog) {
            this.fogNear = fog.near;
            this.fogFar = fog.far;
            this.fogColor[0] = gamma(fog.color.r);
            this.fogColor[1] = gamma(fog.color.g);
            this.fogColor[2] = gamma(fog.color.b);
        }
        else {
            this.fogNear = camera.far;
            this.fogFar = camera.far + 1;
        }
        this.localExposure = Math.round(clamp01(scene.userData.localExposure ?? 1) * 48) / 48;
        this.crossingLight = scene.userData.crossingLight;
        if (this.crossingLight?.visible)
            this.crossingAim.subVectors(this.crossingLight.position, this.crossingLight.target.position).normalize();
        this.sky(scene, camera);
        this.info.render.calls = 0;
        this.info.render.triangles = 0;
        this.late.length = 0;
        this.dots.length = 0;
        if (this.indexedScene !== scene || this.indexedZone !== scene.userData.interiorZone || this.indexedCampusRevision !== scene.userData.campusRevision)
            this.indexScenery(scene);
        const fogKey = [Math.round(this.fogNear), Math.round(this.fogFar), ...this.fogColor, this.localExposure].join('/');
        const cw = camera.matrixWorld.elements;
        let reuse = this.hasSnapshot && this.lastProjection === this.fx && this.lastSky === this.skyKey && this.lastFog === fogKey;
        for (let i = 0; i < 16 && reuse; i++)
            if (Math.abs(this.lastCamera[i] - cw[i]) > (i >= 12 ? .001 : .000035))
                reuse = false;
        if (reuse) {
            this.buffer.color.set(this.staticColor);
            this.buffer.depth.set(this.staticZ);
        }
        else {
            this.buffer.color.set(this.skyPixels);
            this.buffer.depth.fill(0);
            this.renderScenery(camera);
            this.lastCamera.set(cw);
            this.lastProjection = this.fx;
            this.lastSky = this.skyKey;
            this.lastFog = fogKey;
            this.staticColor.set(this.buffer.color);
            this.staticZ.set(this.buffer.depth);
            this.hasSnapshot = true;
        }
        this.moving(scene, camera);
        for (const o of this.dynamicRoots)
            this.moving(o, camera);
        this.late.sort((a, b) => { const e = camera.matrixWorldInverse.elements, aa = a.matrixWorld.elements, bb = b.matrixWorld.elements; return (aa[12] - bb[12]) * e[2] + (aa[13] - bb[13]) * e[6] + (aa[14] - bb[14]) * e[10]; });
        for (const m of this.late)
            this.mesh(m, camera);
        for (const p of this.dots)
            this.points(p, camera);
        this.ctx.putImageData(this.buffer.img, 0, 0);
        if (!reuse) {
            const cost = Math.min(120, performance.now() - started);
            this.measured = this.samples ? this.measured * .78 + cost * .22 : cost;
            this.samples++;
            if (this.samples > 3 && started >= this.adjustAt) {
                const previous = this.cpuScale;
                if (this.measured > 24)
                    this.cpuScale = Math.max(.52, this.cpuScale * .82);
                else if (this.samples > 18 && this.measured < 12)
                    this.cpuScale = Math.min(1, this.cpuScale + .075);
                if (previous !== this.cpuScale) {
                    this.adjustAt = started + 1000;
                    this.samples = 0;
                    this.resizeNext = true;
                }
            }
        }
    }
    points(p, cam) {
        const pos = p.geometry.getAttribute('position');
        if (!pos)
            return;
        const mat = p.material, m = this.mv.multiplyMatrices(cam.matrixWorldInverse, p.matrixWorld).elements;
        const { start, count } = p.geometry.drawRange, end = Math.min(pos.count, start + count);
        const inkR = gamma(mat.color.r), inkG = gamma(mat.color.g), inkB = gamma(mat.color.b), alpha = mat.opacity * .75;
        const additive = mat.blending === T.AdditiveBlending, rain = !!p.userData.rainStreak, pixels = this.buffer.color, depth = this.buffer.depth;
        for (let i = start; i < end; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), q = -(m[2] * x + m[6] * y + m[10] * z + m[14]);
            if (q < this.near || q > this.far)
                continue;
            const k = 1 / q, px = (this.width * .5 + (m[0] * x + m[4] * y + m[8] * z + m[12]) * this.fx * k) | 0, py = (this.height * .5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) * this.fy * k) | 0;
            if (px < 0 || py < 0 || px >= this.width || py >= this.height)
                continue;
            const length = rain ? Math.min(7, Math.max(1, Math.round(mat.size * this.fy * k))) : 1;
            for (let n = 0; n < length; n++) {
                const sx = px - (n >> 2), sy = py + n;
                if (sx < 0 || sy >= this.height)
                    break;
                const j = sy * this.width + sx;
                if (k <= depth[j])
                    continue;
                const ink = rain ? alpha * (1 - n / length) * .68 : alpha, destination = additive ? 1 : 1 - ink;
                const old = pixels[j];
                pixels[j] = (0, software_raster_js_1.pack)(Math.min(255, (old & 255) * destination + inkR * ink), Math.min(255, ((old >>> 8) & 255) * destination + inkG * ink), Math.min(255, ((old >>> 16) & 255) * destination + inkB * ink));
            }
        }
    }
    mesh(obj, cam) {
        const mat = (Array.isArray(obj.material) ? obj.material[0] : obj.material);
        if (!mat?.visible || !obj.geometry.getAttribute('position'))
            return;
        const multi = obj, isMulti = multi.isInstancedMesh;
        if ((isMulti && multi.count === 0) || mat.opacity < .005)
            return;
        if (!isMulti && obj.frustumCulled) {
            const g = obj.geometry;
            if (!g.boundingSphere)
                g.computeBoundingSphere();
            if (!this.frustum.intersectsSphere(this.bound.copy(g.boundingSphere).applyMatrix4(obj.matrixWorld)))
                return;
        }
        const geom = geometry(obj.geometry);
        if (!geom.faces.length)
            return;
        const t = this.pixels(mat.map), count = isMulti ? multi.count : 1;
        for (let i = 0; i < count; i++) {
            const world = multi.isInstancedMesh ? (multi.getMatrixAt(i, this.local), this.m.multiplyMatrices(obj.matrixWorld, this.local)) : obj.matrixWorld;
            this.mv.multiplyMatrices(cam.matrixWorldInverse, world);
            const m = this.mv.elements;
            const Cx = m[0] * geom.cx + m[4] * geom.cy + m[8] * geom.cz + m[12], Cy = m[1] * geom.cx + m[5] * geom.cy + m[9] * geom.cz + m[13], Cz = -(m[2] * geom.cx + m[6] * geom.cy + m[10] * geom.cz + m[14]);
            const rx = m[0] * m[0] + m[1] * m[1] + m[2] * m[2], ry = m[4] * m[4] + m[5] * m[5] + m[6] * m[6], rz = m[8] * m[8] + m[9] * m[9] + m[10] * m[10];
            const rad = geom.radius * Math.sqrt(Math.max(rx, ry, rz));
            if (Cz + rad < this.near || Cz - rad > this.far || Math.abs(Cx) > Math.max(0, Cz) * this.width / (2 * this.fx) + rad * 2.0 || Math.abs(Cy) > Math.max(0, Cz) * this.height / (2 * this.fy) + rad * 1.65 || rad * this.fy < Math.max(0, Cz - rad) * .55)
                continue;
            if (isMulti && !t && Cz > 12) {
                const longest = Math.max(rx, ry, rz), second = Math.max(Math.min(rx, ry), Math.min(ry, rz), Math.min(rx, rz));
                if (longest < 9 && second * this.fy * this.fy < Cz * Cz * .60)
                    continue;
            }
            this.color.copy(mat.color);
            if (multi.instanceColor) {
                multi.getColorAt(i, this.instanceColor);
                this.color.multiply(this.instanceColor);
            }
            this.draw(geom, world, m, mat, t);
        }
    }
    instanceColor = new T.Color();
    draw(g, world, m, mat, tex) {
        const pos = g.coords, uv = g.uv, verts = g.projected, ix = g.faces, norm = g.norm, colors = g.colors, nz = this.near;
        const W = this.width, H = this.height, hw = W * .5, hh = H * .5, fx = this.fx, fy = this.fy, human = g.human, tW = (tex?.w ?? 1) - (human || tex?.repeatU ? 0 : 1), tH = (tex?.h ?? 1) - (human || tex?.repeatV ? 0 : 1), offset = human ? .5 : 0, flip = tex?.flip;
        for (let i = 0, j = 0; i < verts.length; i++, j += 3) {
            const x = pos[j], y = pos[j + 1], z = pos[j + 2], v = verts[i];
            v.cx = m[0] * x + m[4] * y + m[8] * z + m[12];
            v.cy = m[1] * x + m[5] * y + m[9] * z + m[13];
            v.cz = -(m[2] * x + m[6] * y + m[10] * z + m[14]);
            const q = 1 / (Math.abs(v.cz) < 1e-9 ? 1e-9 : v.cz);
            v.q = q;
            v.x = hw + v.cx * q * fx;
            v.y = hh - v.cy * q * fy;
            v.u = (uv[i * 2] * tW - offset) * q;
            v.v = ((flip ? 1 - uv[i * 2 + 1] : uv[i * 2 + 1]) * tH - offset) * q;
        }
        const unlit = mat.isMeshBasicMaterial, two = mat.side === T.DoubleSide, back = mat.side === T.BackSide;
        const exposure = unlit ? 1 : this.localExposure, red = gamma(this.color.r) * exposure, green = gamma(this.color.g) * exposure, blue = gamma(this.color.b) * exposure;
        const nm = this.normal.getNormalMatrix(world).elements, st = this.style;
        st.texture = tex;
        st.opaqueMap = !mat.transparent && !mat.alphaTest;
        st.alpha = mat.opacity;
        st.add = mat.blending === T.AdditiveBlending;
        st.write = mat.depthWrite;
        if (human) {
            st.alphaTest = mat.alphaTest;
            const useColor = mat.vertexColors && !!human.vertexColors;
            const shaded = verts;
            const lamp = this.crossingLight, incident = this.incidentLight;
            let fill = 0;
            if (lamp?.visible && !unlit) {
                incident.set(g.cx, g.cy, g.cz).applyMatrix4(world).sub(lamp.position).negate();
                const d2 = incident.lengthSq();
                if (d2 < lamp.distance * lamp.distance) {
                    incident.multiplyScalar(1 / Math.sqrt(Math.max(.001, d2)));
                    const cone = T.MathUtils.smoothstep(incident.dot(this.crossingAim), Math.cos(lamp.angle), Math.cos(lamp.angle * (1 - lamp.penumbra)));
                    fill = cone * Math.min(.75, lamp.intensity / Math.max(1, d2) * .42);
                }
            }
            for (let i = 0, j = 0; i < shaded.length; i++, j += 3) {
                const v = shaded[i];
                let lighting = 1, side = 0;
                if (!unlit) {
                    const x = norm[j], y = norm[j + 1], z = norm[j + 2];
                    const nx = nm[0] * x + nm[3] * y + nm[6] * z, ny = nm[1] * x + nm[4] * y + nm[7] * z, nz = nm[2] * x + nm[5] * y + nm[8] * z;
                    const inv = (back ? -1 : 1) / Math.max(.00001, Math.sqrt(nx * nx + ny * ny + nz * nz));
                    lighting = .77 + .10 * ny * inv + .31 * Math.max(0, (.71 * nx + .62 * ny - .32 * nz) * inv) + .09 * Math.max(0, (-.58 * nx + .5 * ny + .64 * nz) * inv);
                    if (fill)
                        side = fill * Math.max(0, (incident.x * nx + incident.y * ny + incident.z * nz) * inv);
                }
                const color = useColor ? colors[i] : 0xffffff, factor = v.q / 255;
                v.rq = red * (color & 255) * factor * (lighting + .66 * side);
                v.gq = green * ((color >>> 8) & 255) * factor * (lighting + .84 * side);
                v.bq = blue * ((color >>> 16) & 255) * factor * (lighting + side);
            }
        }
        this.info.render.calls++;
        for (let j = 0; j < ix.length; j += 3) {
            const a = verts[ix[j]], b = verts[ix[j + 1]], c = verts[ix[j + 2]], min = Math.min(a.cz, b.cz, c.cz), max = Math.max(a.cz, b.cz, c.cz);
            if (max < nz || min > this.far)
                continue;
            const clipped = min < nz;
            let winding = 0;
            if (!clipped) {
                if ((a.x < 0 && b.x < 0 && c.x < 0) || (a.x > W && b.x > W && c.x > W) || (a.y < 0 && b.y < 0 && c.y < 0) || (a.y > H && b.y > H && c.y > H))
                    continue;
                winding = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
                if (Math.abs(winding) < (min > 12 ? .42 : .13) || (!two && (back ? winding < 0 : winding > 0)))
                    continue;
            }
            let f = clamp01((Math.max(0, min) + Math.min(18, Math.max(0, max - min)) * .38 - this.fogNear) / (this.fogFar - this.fogNear));
            f = f * f * (3 - 2 * f);
            st.fogR = f * this.fogColor[0];
            st.fogG = f * this.fogColor[1];
            st.fogB = f * this.fogColor[2];
            if (human) {
                if (clipped)
                    this.clip(a, b, c, two, back, 1 - f);
                else {
                    this.buffer.humanTriangle(a, b, c, st, 1 - f);
                    this.info.render.triangles++;
                }
                continue;
            }
            let shade = 1;
            if (!unlit) {
                const x = norm[j], y = norm[j + 1], z = norm[j + 2], nx = nm[0] * x + nm[3] * y + nm[6] * z, ny = nm[1] * x + nm[4] * y + nm[7] * z, nzz = nm[2] * x + nm[5] * y + nm[8] * z, L = (winding > 0 ? -1 : 1) / Math.max(.00001, Math.sqrt(nx * nx + ny * ny + nzz * nzz));
                shade = .77 + .10 * ny * L + .31 * Math.max(0, (.71 * nx + .62 * ny - .32 * nzz) * L) + .09 * Math.max(0, (-.58 * nx + .5 * ny + .64 * nzz) * L);
            }
            const vc = colors[j / 3], factor = shade * (1 - f) / 255;
            st.r = red * (vc & 255) * factor;
            st.g = green * ((vc >>> 8) & 255) * factor;
            st.b = blue * ((vc >>> 16) & 255) * factor;
            if (clipped) {
                this.clip(a, b, c, two, back);
                continue;
            }
            this.buffer.triangle(a, b, c, st);
            this.info.render.triangles++;
        }
    }
    clip(a, b, c, two, back, visibility) {
        const poly = this.polygon, n = this.near;
        poly.length = 0;
        let k = 0;
        let prev = c;
        for (let i = 0; i < 3; i++) {
            const cur = i === 0 ? a : i === 1 ? b : c, inside = cur.cz >= n;
            if (inside !== (prev.cz >= n)) {
                const t = (n - prev.cz) / (cur.cz - prev.cz), v = this.clipped[k++];
                v.cx = prev.cx + (cur.cx - prev.cx) * t;
                v.cy = prev.cy + (cur.cy - prev.cy) * t;
                v.cz = n;
                v.q = 1 / n;
                v.x = this.width * .5 + v.cx * v.q * this.fx;
                v.y = this.height * .5 - v.cy * v.q * this.fy;
                v.u = (prev.u * prev.cz * (1 - t) + cur.u * cur.cz * t) * v.q;
                v.v = (prev.v * prev.cz * (1 - t) + cur.v * cur.cz * t) * v.q;
                if (visibility !== undefined) {
                    const from = prev, to = cur, cut = v;
                    const p = prev.cz * (1 - t) * v.q, q = cur.cz * t * v.q;
                    cut.rq = from.rq * p + to.rq * q;
                    cut.gq = from.gq * p + to.gq * q;
                    cut.bq = from.bq * p + to.bq * q;
                }
                poly.push(v);
            }
            if (inside)
                poly.push(cur);
            prev = cur;
        }
        for (let i = 1; i + 1 < poly.length; i++) {
            const a = poly[0], b = poly[i], c = poly[i + 1], w = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
            if (!two && (back ? w < 0 : w > 0))
                continue;
            if (visibility !== undefined)
                this.buffer.humanTriangle(a, b, c, this.style, visibility);
            else
                this.buffer.triangle(a, b, c, this.style);
            this.info.render.triangles++;
        }
    }
}
exports.SoftwareRenderer = SoftwareRenderer;
