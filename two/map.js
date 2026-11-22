import { REGIONS, terrainHeight, BRIDGES, ROADS, BOUND, WATER_Y, wrapDelta, seasonAt, regionAt } from './terrain.js';
const SIZE = 768, SPAN = 2 * BOUND, adj = SIZE / SPAN;
export const labels = ['壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖', '拾'];
const toX = (x) => SIZE / 2 + x * adj;
const pigments = [
  ['snow', [226, 231, 229]], ['autumn', [213, 177, 133]],
  ['moon', [175, 176, 186]], ['dawn', [232, 200, 163]]
];
let paper;
export function regionPort(state, id) {
  return state.objects.find(o => o.type === 'port' && REGIONS[regionAt(o.x, o.z)].id === id);
}

function drawPort(g, x, y, bikes, large) {
  const pinX = large ? x + 16 : x, pinY = y - (large ? 19 : 12);
  const radius = large ? 8 : 9;
  g.fillStyle = bikes > 0 ? '#295d50' : '#736c60';
  g.strokeStyle = '#faf0d8';
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(pinX - 4, pinY + 3);
  g.lineTo(pinX + 4, pinY + 3);
  g.closePath();
  g.stroke();
  g.fill();
  g.beginPath();
  g.arc(pinX, pinY, radius, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold ' + (large ? 12 : 15) + 'px sans-serif';
  g.fillStyle = '#fff8e9';
  g.fillText('P', pinX, pinY + .5);
}

function baseMap() {
  if (paper) return paper;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d'), step = 4;
  // Sample the same shores and ground as the playable world, including the outer sea.
  for (let z = -BOUND; z < BOUND; z += step) for (let x = -BOUND; x < BOUND; x += step) {
    const a = terrainHeight(x, z), b = terrainHeight(x + step, z + step);
    if (a < WATER_Y) {
      g.fillStyle = a < -1.1 ? '#97b7b6' : '#b0c7ba';
    } else {
      let r = 228, g1 = 222, blue = 191;
      const weights = seasonAt(x, z);
      for (const [key, rgb] of pigments) {
        const k = weights[key];
        r += (rgb[0] - r) * k; g1 += (rgb[1] - g1) * k; blue += (rgb[2] - blue) * k;
      }
      const relief = Math.min(26, a * .48) + Math.max(-10, Math.min(10, (b-a)*2));
      g.fillStyle = 'rgb(' + [r-relief,g1-relief*.85,blue-relief*.62].map(Math.round).join(',') + ')';
    }
    g.fillRect(toX(x), toX(z), step * adj + 1, step * adj + 1);
    if (a > 1 && Math.floor(a / 4) !== Math.floor(b / 4)) {
      g.fillStyle = '#78775b38';
      g.fillRect(toX(x), toX(z), step * adj, 1);
    }
  }
  for (const road of ROADS) {
    g.beginPath();
    road.points.forEach(([x, z], i) => (i ? g.lineTo(toX(x), toX(z)) : g.moveTo(toX(x), toX(z))));
    g.strokeStyle = '#aa9371';
    g.lineWidth = Math.max(2, road.width * adj);
    g.stroke();
    g.strokeStyle = '#e8d5ad';
    g.lineWidth = Math.max(1, road.width * adj - 1.5);
    g.stroke();
  }
  for (const b of BRIDGES) {
    g.fillStyle = '#9b7954';
    g.fillRect(toX(b.x - b.halfWidth), toX(b.z - b.length / 2), b.halfWidth * 2 * adj, b.length * adj);
  }
  paper = c;
  return paper;
}
export function drawMap(canvas, state, cameraYaw, goal, large = false, pin = null, recipient = null) {
  const w = canvas.width,
    h = canvas.height,
    g = canvas.getContext('2d'),
    p = state.player,
    midX = large ? 0 : p.x,
    midZ = large ? 0 : p.z;
  const span = large ? SPAN : 118,
    scale = large ? Math.min(w, h) / span : w / span;
  const sx = (x) => w / 2 + (x - midX) * scale,
    sy = (z) => h / 2 + (z - midZ) * scale;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#ece7d1';
  g.fillRect(0, 0, w, h);
  const map = baseMap();
  for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
    const left = sx(u * SPAN - BOUND), top = sy(v * SPAN - BOUND);
    const side = SPAN * scale;
    if (left < w && top < h && left + side > 0 && top + side > 0)
      g.drawImage(map, left, top, side, side);
  }
  for (const [i, r] of REGIONS.entries()) {
    const x = w / 2 + wrapDelta(r.x - midX) * scale,
      y = h / 2 + wrapDelta(r.z - midZ) * scale,
      on = state.visited.includes(r.id),
      rad = large ? 11 : 6;
    if (goal === r.id) {
      g.strokeStyle = '#a14832';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, rad + 4, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = on ? '#a94e38' : '#f4eed8';
    g.strokeStyle = on ? '#88462e' : '#87896b';
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    if (large) {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold 12px serif';
      g.fillStyle = on ? '#fff5da' : '#665945';
      g.fillText(labels[i], x, y);
      g.font = 'bold 12px serif';
      g.fillStyle = '#463d2c';
      g.lineWidth = 3;
      g.strokeStyle = '#f8f1db';
      g.strokeText(r.name, x, y + 22);
      g.fillText(r.name, x, y + 22);
    }
  }
  const selectedPort = large && regionPort(state, goal);
  for (const o of state.objects) {
    if (o.type !== 'port' || (large && o !== selectedPort)) continue;
    const x = w / 2 + wrapDelta(o.x - midX) * scale;
    const y = h / 2 + wrapDelta(o.z - midZ) * scale;
    if (x >= 0 && x <= w && y >= 0 && y <= h) drawPort(g, x, y, o.bikes, large);
  }
  if (recipient || pin) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [point, tint] of [[recipient, '#435e62'], [pin, '#ae452c']]) {
      if (!point) continue;
      const x = w/2+wrapDelta(point.x-midX)*scale, y = h/2+wrapDelta(point.z-midZ)*scale;
      g.save(); g.translate(x,y); g.rotate(Math.PI/4);
      g.strokeStyle = '#fff5db'; g.lineWidth=2; g.fillStyle=tint;
      g.fillRect(-6,-6,12,12); g.strokeRect(-6,-6,12,12);
      g.restore();
      g.fillStyle='#fff8df'; g.fillRect(x-1.5,y-1.5,3,3);
    }
  }
  g.save();
  g.translate(sx(p.x), sy(p.z));
  g.rotate(-cameraYaw);
  g.fillStyle = '#1e6359';
  g.strokeStyle = '#fff6dd';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -9);
  g.lineTo(6, 7);
  g.lineTo(0, 4);
  g.lineTo(-6, 7);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.font = 'bold ' + (large ? 13 : 17) + 'px Georgia';
  g.fillStyle = '#544231';
  g.fillText('N', large ? w - 17 : w / 2, large ? 10 : 5);
}
export function mapHit(canvas, e) {
  const b = canvas.getBoundingClientRect(),
    x = ((e.clientX - b.left) / b.width) * canvas.width,
    z = ((e.clientY - b.top) / b.height) * canvas.height;
  const scale = Math.min(canvas.width, canvas.height) / SPAN;
  return REGIONS.find(
    (r) => Math.hypot(canvas.width / 2 + r.x * scale - x, canvas.height / 2 + r.z * scale - z) < 25,
  );
}

export function mapCoordinates(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((event.clientX-rect.left)/rect.width-.5)*SPAN, z: ((event.clientY-rect.top)/rect.height-.5)*SPAN };
}
