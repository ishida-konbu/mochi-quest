import { REGIONS, terrainHeight, coastX, riverZ, riverHalfWidth, BRIDGES, ROADS } from './terrain.js';
const SIZE = 560,
  SPAN = 500,
  adj = SIZE / SPAN;
const labels = ['壱', '弐', '参', '肆', '伍', '陸'];
const toX = (x) => SIZE / 2 + x * adj;
let paper;
function baseMap() {
  if (paper) return paper;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');
  g.fillStyle = '#eae4cd';
  g.fillRect(0, 0, SIZE, SIZE);
  const step = 5;
  for (let z = -250; z < 250; z += step)
    for (let x = -250; x < 250; x += step) {
      const a = terrainHeight(x, z),
        b = terrainHeight(x + step, z + step),
        val = Math.min(1, Math.max(0, (a + 2) / 25));
      g.fillStyle = 'rgba(111,133,100,' + (val * 0.28 + Math.min(0.19, Math.max(0, b - a) * 0.04)) + ')';
      g.fillRect(toX(x), toX(z), step * adj + 1, step * adj + 1);
      if (Math.floor(a / 3) !== Math.floor(b / 3)) {
        g.fillStyle = '#909c792d';
        g.fillRect(toX(x), toX(z), step * adj, 1);
      }
    }
  g.beginPath();
  for (let x = -250; x <= 250; x += 2) {
    const y = toX(riverZ(x) - riverHalfWidth(x));
    if (x === -250) g.moveTo(0, y);
    else g.lineTo(toX(x), y);
  }
  for (let x = 250; x >= -250; x -= 2) g.lineTo(toX(x), toX(riverZ(x) + riverHalfWidth(x)));
  g.closePath();
  g.fillStyle = '#9bb7aa';
  g.fill();
  g.lineWidth = 1;
  g.strokeStyle = '#7d9a8c';
  g.stroke();
  g.beginPath();
  g.moveTo(0, 0);
  for (let z = -250; z <= 250; z += 2) g.lineTo(toX(coastX(z)), toX(z));
  g.lineTo(0, SIZE);
  g.closePath();
  g.fillStyle = '#a6bdb1';
  g.fill();
  g.strokeStyle = '#7e9e91';
  g.stroke();
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
export function drawMap(canvas, state, cameraYaw, goal, large = false) {
  const w = canvas.width,
    h = canvas.height,
    g = canvas.getContext('2d'),
    p = state.player,
    midX = large ? 0 : p.x,
    midZ = large ? 0 : p.z;
  const span = large ? 500 : 118,
    scale = large ? Math.min(w, h) / span : w / span;
  const sx = (x) => w / 2 + (x - midX) * scale,
    sy = (z) => h / 2 + (z - midZ) * scale;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#ece7d1';
  g.fillRect(0, 0, w, h);
  g.drawImage(baseMap(), sx(-250), sy(-250), 500 * scale, 500 * scale);
  for (const [i, r] of REGIONS.entries()) {
    const x = sx(r.x),
      y = sy(r.z),
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
  const scale = Math.min(canvas.width, canvas.height) / 500;
  return REGIONS.find(
    (r) => Math.hypot(canvas.width / 2 + r.x * scale - x, canvas.height / 2 + r.z * scale - z) < 25,
  );
}
