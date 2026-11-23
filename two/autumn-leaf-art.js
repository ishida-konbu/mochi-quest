import * as THREE from './vendor/three.module.min.js';

export const autumnLeafPigments = {
  maple: ['#d54529', '#b42e32', '#d92f27', '#d96226', '#ab3430', '#ec7136'],
  ginkgo: ['#edb632', '#efca45', '#d99a28', '#f1c850', '#dcac3a'],
};

const geometry = new Map();
let paint;

// The two washes share a sheet. Its top edge is the tip of the blade and its
// bottom edge is the stalk. A low, off-centre ridge catches light as it turns.
export function autumnLeafGeometry(kind) {
  if (geometry.has(kind)) return geometry.get(kind);
  const cell = kind === 'ginkgo' ? 1 : 0;
  const positions = [], uv = [], indices = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const u = col === 1 ? 0.46 : col / 2, v = row / 2;
      const lift = col === 1 ? [0.004, 0.041, 0.018][row] : (u + v) * 0.008;
      positions.push(u - 0.5, lift, v - 0.5);
      uv.push((cell + u) / 2, v);
      if (row && col) {
        const i = row * 3 + col;
        indices.push(i - 4, i - 1, i - 3, i - 3, i - 1, i);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  geometry.set(kind, g);
  return g;
}

export function autumnLeafMaterial() {
  if (paint) return paint;
  const map = new THREE.TextureLoader().load(new URL('./assets/world/autumn-leaves.webp', import.meta.url).href);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  paint = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, alphaTest: 0.30 });
  return paint;
}
