"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Raster = exports.pack = void 0;
exports.readPixels = readPixels;
const T = require("../engine/three.module.min.js");
function readPixels(texture, max = 2048) {
    const im = texture.image;
    if (!im?.width || !im.height)
        return;
    const repeatU = texture.wrapS === T.RepeatWrapping, repeatV = texture.wrapT === T.RepeatWrapping;
    if (ArrayBuffer.isView(im.data))
        return { data: im.data, w: im.width, h: im.height, flip: texture.flipY, repeatU, repeatV };
    try {
        const ratio = Math.min(1, max / im.width, max / im.height);
        const w = Math.max(1, Math.round(im.width * ratio)), h = Math.max(1, Math.round(im.height * ratio));
        let ctx = null;
        if (w === im.width && h === im.height && im instanceof HTMLCanvasElement)
            ctx = im.getContext('2d');
        if (!ctx) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            ctx = c.getContext('2d', { willReadFrequently: true });
            if (!ctx)
                return;
            ctx.drawImage(im, 0, 0, w, h);
        }
        return { data: ctx.getImageData(0, 0, w, h).data, w, h, flip: texture.flipY, repeatU, repeatV };
    }
    catch {
        return;
    }
}
const pack = (r, g, b) => (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
exports.pack = pack;
// Nearest-neighbour sampling for ordinary triangles, in source-pixel coordinates.
function sampleCoordinate(value, size, repeat) {
    if (value >= 0 && value < size) return value | 0;
    if (!repeat) return value < 0 ? 0 : size - 1;
    return Math.floor(value - Math.floor(value / size) * size);
}
class Raster {
    width;
    height;
    img;
    color;
    depth;
    constructor(width, height, ctx) {
        this.width = width;
        this.height = height;
        this.img = ctx.createImageData(width, height);
        this.color = new Uint32Array(this.img.data.buffer);
        this.depth = new Float32Array(width * height);
    }
    triangle(a, b, c, style) {
        if (a.y > b.y)
            [a, b] = [b, a];
        if (b.y > c.y)
            [b, c] = [c, b];
        if (a.y > b.y)
            [a, b] = [b, a];
        const maxY = Math.min(this.height, Math.ceil(c.y - .5)), minY = Math.max(0, Math.ceil(a.y - .5));
        if (maxY <= minY)
            return;
        const x10 = b.x - a.x, x20 = c.x - a.x, y10 = b.y - a.y, y20 = c.y - a.y, area = x10 * y20 - x20 * y10;
        if (Math.abs(area) < .045)
            return;
        const inv = 1 / area, dq1 = b.q - a.q, dq2 = c.q - a.q, du1 = b.u - a.u, du2 = c.u - a.u, dv1 = b.v - a.v, dv2 = c.v - a.v;
        const qx = (dq1 * y20 - dq2 * y10) * inv, qy = (dq2 * x10 - dq1 * x20) * inv, ux = (du1 * y20 - du2 * y10) * inv, uy = (du2 * x10 - du1 * x20) * inv, vx = (dv1 * y20 - dv2 * y10) * inv, vy = (dv2 * x10 - dv1 * x20) * inv;
        const edge = x20 / y20, high = y10 > 0 ? x10 / y10 : 0, low = c.y > b.y ? (c.x - b.x) / (c.y - b.y) : 0;
        const data = this.color, depth = this.depth, W = this.width, t = style.texture, tx = t?.data, tw = t?.w ?? 1, th = t?.h ?? 1;
        const { r, g, b: bb, fogR, fogG, fogB, alpha, add, write } = style;
        const solid = (0, exports.pack)(Math.min(255, (r + fogR) | 0), Math.min(255, (g + fogG) | 0), Math.min(255, (bb + fogB) | 0));
        const opaque = alpha > .997 && !add;
        const mr = r / 255, mg = g / 255, mb = bb / 255;
        for (let y = minY; y < maxY; y++) {
            const dy = y + .5 - a.y, xA = a.x + dy * edge, xB = y + .5 < b.y ? a.x + dy * high : b.x + (y + .5 - b.y) * low;
            const x0 = Math.max(0, Math.ceil(Math.min(xA, xB) - .5)), x1 = Math.min(W, Math.ceil(Math.max(xA, xB) - .5));
            if (x1 <= x0)
                continue;
            const dx = x0 + .5 - a.x, start = y * W + x0, end = y * W + x1;
            let q = a.q + qx * dx + qy * dy;
            if (!tx && opaque) {
                for (let j = start; j < end; j++, q += qx) {
                    if (q <= depth[j])
                        continue;
                    data[j] = solid;
                    if (write)
                        depth[j] = q;
                }
                continue;
            }
            let u = a.u + ux * dx + uy * dy, v = a.v + vx * dx + vy * dy;
            if (tx && opaque && write && style.opaqueMap) {
                for (let first = start; first < end;) {
                    const size = Math.min(8, end - first), next = first + size;
                    const invQ = 1 / q, nextQ = q + qx * size, nU = u + ux * size, nV = v + vx * size;
                    let U = u * invQ, V = v * invQ;
                    const nextInv = 1 / nextQ, dU = (nU * nextInv - U) / size, dV = (nV * nextInv - V) / size;
                    for (let j = first; j < next; j++, q += qx, U += dU, V += dV) {
                        if (q <= depth[j])
                            continue;
                        const uu = sampleCoordinate(U, tw, t.repeatU), vv = sampleCoordinate(V, th, t.repeatV), k = (vv * tw + uu) << 2;
                        data[j] = (0, exports.pack)(Math.min(255, tx[k] * mr + fogR), Math.min(255, tx[k + 1] * mg + fogG), Math.min(255, tx[k + 2] * mb + fogB));
                        depth[j] = q;
                    }
                    first = next;
                    q = nextQ;
                    u = nU;
                    v = nV;
                }
                continue;
            }
            for (let j = start; j < end; j++, q += qx, u += ux, v += vx) {
                if (q <= depth[j])
                    continue;
                let rr = solid & 255, gg = (solid >>> 8) & 255, bl = (solid >>> 16) & 255, al = alpha;
                if (tx) {
                    const z = 1 / q;
                    const U = sampleCoordinate(u * z, tw, t.repeatU), V = sampleCoordinate(v * z, th, t.repeatV);
                    const k = (V * tw + U) * 4;
                    rr = Math.min(255, (tx[k] * mr + fogR) | 0);
                    gg = Math.min(255, (tx[k + 1] * mg + fogG) | 0);
                    bl = Math.min(255, (tx[k + 2] * mb + fogB) | 0);
                    al *= tx[k + 3] / 255;
                }
                if (al <= .015)
                    continue;
                if (al < .997 || add) {
                    const old = data[j], other = add ? 1 : 1 - al;
                    rr = Math.min(255, (rr * al + (old & 255) * other) | 0);
                    gg = Math.min(255, (gg * al + ((old >>> 8) & 255) * other) | 0);
                    bl = Math.min(255, (bl * al + ((old >>> 16) & 255) * other) | 0);
                }
                data[j] = (0, exports.pack)(rr, gg, bl);
                if (write)
                    depth[j] = q;
            }
        }
    }
    humanTriangle(a, b, c, st, visibility) {
        if (a.y > b.y)
            [a, b] = [b, a];
        if (b.y > c.y)
            [b, c] = [c, b];
        if (a.y > b.y)
            [a, b] = [b, a];
        const y0 = Math.max(0, Math.ceil(a.y - .5)), y1 = Math.min(this.height, Math.ceil(c.y - .5));
        if (y1 <= y0)
            return;
        const bx = b.x - a.x, cx = c.x - a.x, by = b.y - a.y, cy = c.y - a.y, area = bx * cy - cx * by;
        if (Math.abs(area) < .045)
            return;
        const dbdx = cy / area, dcdx = -by / area, dbdy = -cx / area, dcdy = bx / area;
        const mainSlope = cx / cy, topSlope = by > 0 ? bx / by : 0, bottomSlope = c.y > b.y ? (c.x - b.x) / (c.y - b.y) : 0;
        const qb = b.q - a.q, qc = c.q - a.q, rb = b.rq - a.rq, rc = c.rq - a.rq, gb = b.gq - a.gq, gc = c.gq - a.gq, bb = b.bq - a.bq, bc = c.bq - a.bq;
        const ub = b.u - a.u, uc = c.u - a.u, vb = b.v - a.v, vc = c.v - a.v;
        const sq = dbdx * qb + dcdx * qc, sr = dbdx * rb + dcdx * rc, sg = dbdx * gb + dcdx * gc, sb = dbdx * bb + dcdx * bc, su = dbdx * ub + dcdx * uc, sv = dbdx * vb + dcdx * vc;
        const t = st.texture, tx = t?.data, tw = t?.w ?? 1, th = t?.h ?? 1, depth = this.depth, buffer = this.color;
        for (let y = y0; y < y1; y++) {
            const dy = y + .5 - a.y, left = a.x + dy * mainSlope, right = y + .5 < b.y ? a.x + dy * topSlope : b.x + (y + .5 - b.y) * bottomSlope;
            const x0 = Math.max(0, Math.ceil(Math.min(left, right) - .5)), x1 = Math.min(this.width, Math.ceil(Math.max(left, right) - .5));
            if (x1 <= x0)
                continue;
            const dx = x0 + .5 - a.x, wb = dbdx * dx + dbdy * dy, wc = dcdx * dx + dcdy * dy;
            let q = a.q + wb * qb + wc * qc, r = a.rq + wb * rb + wc * rc, g = a.gq + wb * gb + wc * gc, bv = a.bq + wb * bb + wc * bc;
            let u = a.u + wb * ub + wc * uc, v = a.v + wb * vb + wc * vc;
            for (let j = y * this.width + x0, end = y * this.width + x1; j < end; j++, q += sq, r += sr, g += sg, bv += sb, u += su, v += sv) {
                if (q <= depth[j])
                    continue;
                const z = 1 / q, factor = visibility * z;
                let red = r * factor, green = g * factor, blue = bv * factor, alpha = st.alpha;
                if (tx) {
                    let U = u * z, V = v * z;
                    U = t.repeatU ? U - Math.floor(U / tw) * tw : Math.max(0, Math.min(tw - 1, U));
                    V = t.repeatV ? V - Math.floor(V / th) * th : Math.max(0, Math.min(th - 1, V));
                    const x = U | 0, ty = V | 0, k = (ty * tw + x) * 4;
                    const dx = x + 1 < tw ? 4 : t.repeatU ? 4 * (1 - tw) : 0, dy = ty + 1 < th ? tw * 4 : t.repeatV ? 4 * tw * (1 - th) : 0;
                    const right = k + dx, down = k + dy, diagonal = down + dx;
                    const fu = U - x, fv = V - ty, w00 = (1 - fu) * (1 - fv) / 255, w10 = fu * (1 - fv) / 255, w01 = (1 - fu) * fv / 255, w11 = fu * fv / 255;
                    red *= tx[k] * w00 + tx[right] * w10 + tx[down] * w01 + tx[diagonal] * w11;
                    green *= tx[k + 1] * w00 + tx[right + 1] * w10 + tx[down + 1] * w01 + tx[diagonal + 1] * w11;
                    blue *= tx[k + 2] * w00 + tx[right + 2] * w10 + tx[down + 2] * w01 + tx[diagonal + 2] * w11;
                    if (!st.opaqueMap)
                        alpha *= tx[k + 3] * w00 + tx[right + 3] * w10 + tx[down + 3] * w01 + tx[diagonal + 3] * w11;
                }
                if (alpha <= .015 || alpha < (st.alphaTest ?? 0))
                    continue;
                red = Math.min(255, red + st.fogR);
                green = Math.min(255, green + st.fogG);
                blue = Math.min(255, blue + st.fogB);
                if (alpha < .997 || st.add) {
                    const old = buffer[j], other = st.add ? 1 : 1 - alpha;
                    red = Math.min(255, red * alpha + (old & 255) * other);
                    green = Math.min(255, green * alpha + ((old >>> 8) & 255) * other);
                    blue = Math.min(255, blue * alpha + ((old >>> 16) & 255) * other);
                }
                buffer[j] = (0, exports.pack)(red, green, blue);
                if (st.write)
                    depth[j] = q;
            }
        }
    }
}
exports.Raster = Raster;
