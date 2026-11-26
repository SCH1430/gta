"use strict";
// Metres in the district map. The east branch follows the back of the tram shelter.
const court = [[-19.55,17.45],[-17.7,18.05],[-12,19.4],[-7.2,20.15],[-2.4,20.6],
    [2.25,20.4],[4.65,19.55],[7.25,18.95],[10.4,18.65],[15.9,19.45],[17.35,20.35],[17.35,22.59]];
const fromCrossing = [[-20,22.72],[-19.85,20.46],[-19.55,17.45]];
const fromDoor = [[-34.96,15.92],[-34.96,17.66],[-32.5,18.92],[-28.4,19.8],[-23.7,19.35],[-19.55,17.45]];
const walks = [court, fromCrossing, fromDoor];
exports.courtCrossing = [-21.4, -18.6];
exports.marketCrossing = [36.05, 38.95];
// Southern kerb recedes into the block. Both ends meet the original road edge.
const bay = exports.marketBay = {
    edge: 35.46, stripe: 34.38, parkedX: 26.65, stopX: 32.9, centreZ: 35.65,
    profile: [[18.4, 0], [20.5, .52], [22.8, 1.94], [24.15, 2.39],
        [33.85, 2.39], [34.8, 2.09], [35.4, 1.48], [exports.marketCrossing[0], 0]]
};
function bayOffset(x) {
    const p = bay.profile;
    if (x <= p[0][0] || x >= p[p.length - 1][0]) return 0;
    for (let i = 1; i < p.length; i++) {
        const [b, end] = p[i];
        if (x <= b) {
            const [a, start] = p[i - 1];
            return start + (end - start) * ((x - a) / (b - a));
        }
    }
    return 0;
}
exports.bayOffset = bayOffset;
exports.snowOverBay = function(x, z, width, depth, yaw) {
    const halfX = (width * Math.cos(yaw) + depth * Math.sin(yaw)) * .5;
    const halfZ = (width * Math.sin(yaw) + depth * Math.cos(yaw)) * .5;
    const p = bay.profile, lo = Math.max(p[0][0], x - halfX), hi = Math.min(p[p.length - 1][0], x + halfX);
    if (lo >= hi || z + halfZ < bay.stripe) return false;
    let offset = Math.max(bayOffset(lo), bayOffset(hi));
    for (const [k, m] of p) if (lo < k && k < hi) offset = Math.max(offset, m);
    return z - halfZ <= bay.edge + offset;
};
exports.paintMarketBay = function(c, rnd) {
    const p = bay.profile, start = p[0][0], end = p[p.length - 1][0];
    c.save();
    c.beginPath();
    c.moveTo(start, bay.stripe - .12);
    c.lineTo(end, bay.stripe - .12);
    for (let i = p.length - 1; i >= 0; i--) c.lineTo(p[i][0], bay.edge + p[i][1] + .04);
    c.closePath();
    c.clip();
    const asphalt = c.createLinearGradient(0, bay.stripe - .12, 0, bay.edge + 2.39);
    asphalt.addColorStop(0, '#394450');
    asphalt.addColorStop(.6, '#454f58');
    asphalt.addColorStop(1, '#39464f');
    c.fillStyle = asphalt;
    c.fillRect(start, bay.stripe - .12, end - start, 4);
    for (let i = 0; i < 340; i++) {
        c.fillStyle = i % 3 ? 'rgba(153,168,170,.21)' : 'rgba(29,42,53,.32)';
        c.fillRect(start + rnd() * (end - start), bay.stripe + 3.54 * rnd(), .08 + rnd() * .32, .04 + rnd() * .08);
    }
    c.setLineDash([1.0, .85]);
    stroke(c, [[22.2, bay.stripe], [34.95, bay.stripe]], '#a0a9a6', .11);
    c.setLineDash([]);
    for (const x of [bay.parkedX - 2.9, (bay.parkedX + bay.stopX) * .5, bay.stopX + 2.45]) {
        const z = bay.edge + bayOffset(x) - .24;
        stroke(c, [[x, z - .64], [x, z]], '#b1b4a8', .12);
        stroke(c, [[x - .25, z], [x + .25, z]], '#b1b4a8', .12);
    }
    c.restore();
};
const walkRadius = .82;
exports.onWalk = function(x, z) {
    if (x < -36 || x > 18.3 || z < 15 || z > 23.6) return false;
    for (const points of walks) {
        for (let i = 1; i < points.length; i++) {
            const [ax, az] = points[i - 1], [bx, bz] = points[i];
            if (x < Math.min(ax, bx) - walkRadius || x > Math.max(ax, bx) + walkRadius ||
                z < Math.min(az, bz) - walkRadius || z > Math.max(az, bz) + walkRadius) continue;
            const dx = bx - ax, dz = bz - az;
            const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
            if ((x - ax - t * dx) ** 2 + (z - az - t * dz) ** 2 <= walkRadius * walkRadius) return true;
        }
    }
    return false;
};
function stroke(c, points, color, width) {
    c.beginPath();
    points.forEach(([x, z], i) => i ? c.lineTo(x, z) : c.moveTo(x, z));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
}
exports.paintWalk = function(c, rnd) {
    c.save();
    c.lineCap = c.lineJoin = 'round';
    for (const [ink, width] of [['rgba(156,170,175,.86)',2.20],['#899699',1.88],['#737f84',walkRadius * 2]]) {
        for (const points of walks) stroke(c, points, ink, width);
    }
    for (const points of walks) {
        let stride = 0;
        for (let i = 1; i < points.length; i++) {
            const [x, z] = points[i - 1], dx = points[i][0] - x, dz = points[i][1] - z, length = Math.hypot(dx, dz);
            const tx = dx / length, tz = dz / length;
            for (let a = .13; a < length; a += .17) {
                const offset = (rnd() - .5) * 2.26;
                c.fillStyle = Math.abs(offset) > .80 ? 'rgba(206,216,215,.49)' : 'rgba(63,76,81,.30)';
                c.fillRect(x + tx * a - tz * offset, z + tz * a + tx * offset, .09 + .15 * rnd(), .05 + .08 * rnd());
            }
            for (let a = .29; a < length; a += .69) {
                const offset = (stride++ % 2 ? .25 : -.16) + (rnd() - .5) * .24, px = x + tx * a - tz * offset, pz = z + tz * a + tx * offset;
                stroke(c, [[px,pz],[px+.17*tx,pz+.17*tz]], 'rgba(53,66,72,.38)', .11);
            }
        }
    }
    c.restore();
};
// Two continuous tracks turn out of the actual garage throat towards the eastbound lane.
exports.paintExitTracks = function(c) {
    const path = [[-46.2,42.05],[-43.8,42.05],[-42,41.83],[-40.45,41.1],[-39.24,39.82],
        [-38.64,38.51],[-38.43,37.16],[-38.37,35.85],[-38.18,34.72],[-37.63,33.75],
        [-36.73,33.13],[-35.4,32.8],[-33.76,32.74],[-31.62,32.74]];
    c.save();
    c.lineCap = c.lineJoin = 'round';
    for (const side of [-.76,.76]) {
        const tyre = path.map(([x,z], i) => {
            const a = path[Math.max(0,i-1)], b = path[Math.min(path.length-1,i+1)], dx = b[0]-a[0], dz = b[1]-a[1], l = Math.hypot(dx,dz);
            return [x - dz * side / l,z + dx * side / l];
        });
        stroke(c, tyre, 'rgba(34,47,55,.44)', .31);
        stroke(c, tyre, 'rgba(128,140,142,.41)', .15);
        c.setLineDash([.14,.13]);
        stroke(c, tyre, 'rgba(37,48,54,.47)', .18);
        c.setLineDash([]);
    }
    c.restore();
};
