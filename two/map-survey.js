import { ROADS, BRIDGES, BUILDINGS } from './terrain.js';

let roadPrints;
function traceRoads() {
  return ROADS.map(({ points, width, paved }) => {
    const path = new Path2D();
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const [i, [x, z]] of points.entries()) {
      if (i) path.lineTo(x, z);
      else path.moveTo(x, z);
      left = Math.min(left, x - width / 2);
      right = Math.max(right, x + width / 2);
      top = Math.min(top, z - width / 2);
      bottom = Math.max(bottom, z + width / 2);
    }
    return { path, width, paved, left, top, right, bottom };
  });
}

// The country scroll's printed roads are only a few texels wide. Trace the
// survey again at reading distance, including the open junctions and planks.
export function drawMapSurvey(g, cx, cz, w, h, scale) {
  if (scale <= 1.15) return;
  roadPrints ??= traceRoads();
  const rx = w / (2 * scale), rz = h / (2 * scale);
  const visible = roadPrints.filter(road => road.left < cx + rx && road.right > cx - rx &&
    road.top < cz + rz && road.bottom > cz - rz);
  g.save();
  g.translate(w / 2, h / 2);
  g.scale(scale, scale);
  g.translate(-cx, -cz);
  g.globalAlpha = Math.min(.90, (scale - 1.15) * 1.5);
  g.lineJoin = g.lineCap = 'round';
  g.strokeStyle = '#9d8567';
  for (const road of visible) {
    g.lineWidth = road.width;
    g.stroke(road.path);
  }
  for (const road of visible) {
    g.lineWidth = Math.max(.3, road.width - .7 - .7 / scale);
    g.strokeStyle = road.paved ? '#d1c5a9' : '#ead8b2';
    g.stroke(road.path);
  }
  for (const b of BRIDGES) {
    if (Math.abs(b.x - cx) > rx + b.halfWidth || Math.abs(b.z - cz) > rz + b.length / 2) continue;
    const left = b.x - b.halfWidth, right = b.x + b.halfWidth, top = b.z - b.length / 2;
    g.fillStyle = '#bba17a';
    g.fillRect(left, top, 2 * b.halfWidth, b.length);
    g.beginPath();
    for (let t = 1.6; t < b.length; t += 1.6) {
      g.moveTo(left, top + t);
      g.lineTo(right, top + t);
    }
    g.strokeStyle = '#8e765a';
    g.lineWidth = .52 / scale;
    g.stroke();
    g.strokeStyle = '#725e49';
    g.lineWidth = .38 + .48 / scale;
    g.strokeRect(left, top, b.halfWidth * 2, b.length);
  }
  for (const b of BUILDINGS) {
    const reach = (b.w + b.d) / 2;
    if (Math.abs(b.x - cx) > rx + reach || Math.abs(b.z - cz) > rz + reach) continue;
    const half = b.w / 2, eave = b.d / 2, ridge = Math.min(half * .68, Math.max(0, half - eave * .65));
    g.save();
    g.translate(b.x, b.z);
    g.rotate(-b.yaw);
    g.fillStyle = b.kind === 'temple' || b.kind === 'pagoda' ? '#956b54' : '#9f9178';
    g.fillRect(-half, -eave, b.w, b.d);
    g.lineWidth = .75 / scale;
    g.strokeStyle = '#645744';
    g.strokeRect(-half, -eave, b.w, b.d);
    g.beginPath();
    g.moveTo(-ridge, 0); g.lineTo(ridge, 0);
    for (const side of [-1, 1]) {
      g.moveTo(side * half, -eave);
      g.lineTo(side * ridge, 0);
      g.lineTo(side * half, eave);
    }
    g.strokeStyle = '#e8d6b5';
    g.stroke();
    g.restore();
  }
  g.restore();
}
