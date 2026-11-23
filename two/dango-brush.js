import * as T from './vendor/three.module.min.js';
import { onDangoCourse } from './dango-roll.js';
import { wrapWorld } from './geography.js';

// Three sweeps of the brush describe a little plume of road dust. The paper
// shows through the middle and the second, dry hair breaks away at the tip.
function dustDrawing() {
  const vertices = [], colours = [], indices = [];
  const ink = new T.Color('#554c40'), wash = new T.Color('#bbab8f');
  function stroke(knots, width, opacity) {
    const curve = new T.CatmullRomCurve3(knots.map(([x,y,z]) => new T.Vector3(x,y,z)));
    const start = vertices.length / 3, segments = 18;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments, p = curve.getPoint(u), tangent = curve.getTangent(u);
      const girth = width * Math.sin(Math.PI*u)**.72 * (1.2-.48*u);
      const side = girth / Math.hypot(tangent.x, tangent.z);
      for (const edge of [-1, -.36, 1]) {
        vertices.push(p.x+edge*tangent.z*side, p.y, p.z-edge*tangent.x*side);
        const pigment = edge === 1 ? wash : ink;
        colours.push(pigment.r, pigment.g, pigment.b, opacity*(edge === 1 ? .20 : 1));
      }
      if (i < segments) {
        const k = start+3*i;
        indices.push(k,k+1,k+3, k+1,k+4,k+3, k+1,k+2,k+4, k+2,k+5,k+4);
      }
    }
  }
  stroke([[.16,.065,.02],[.26,.08,-.39],[.46,.16,-.91],[.74,.28,-1.24],
    [.90,.33,-1.24],[.94,.35,-1.10]], .078, .83);
  stroke([[.34,.075,-.25],[.40,.092,-.51],[.52,.14,-.73],[.63,.18,-.84]], .032, .64);
  stroke([[.84,.31,-1.39],[1.01,.36,-1.35],[1.07,.38,-1.23]], .034, .57);
  const geometry = new T.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colours, 4));
  return geometry;
}

export function createDangoBrush(root) {
  const capacity = 7;
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const geometry = dustDrawing();
  const pressure = new T.InstancedBufferAttribute(new Float32Array(capacity), 1);
  geometry.setAttribute('pressure', pressure.setUsage(T.DynamicDrawUsage));
  const material = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide });
  material.forceSinglePass = true;
  material.onBeforeCompile = shader => {
    // A signed pressure mirrors alternate flicks while all instances use
    // positive scales and share the same fogged, translucent drawing.
    shader.vertexShader = 'attribute float pressure;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x *= sign(pressure);')
      .replace('#include <color_vertex>', '#include <color_vertex>\nvColor.a *= abs(pressure);');
  };
  const mesh = new T.InstancedMesh(geometry, material, capacity);
  mesh.name = '団子の巻き上げる砂煙';
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.visible = mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  root.add(mesh);

  const marks = Array.from({length: capacity}, () => ({born: -Infinity}));
  const transform = new T.Object3D(), last = new T.Vector3();
  let lastTime = NaN, lastGrounded = false, stride = 0, serial = 0;
  return (p, t, photo) => {
    if (reduced?.matches || photo || !onDangoCourse(p)) {
      if (mesh.visible) for (const mark of marks) mark.born = -Infinity;
      mesh.visible = false;
      lastTime = NaN;
      stride = 0;
      return;
    }
    const dt = t-lastTime;
    const dx = wrapWorld(p.x-last.x), dz = wrapWorld(p.z-last.z), dy = p.y-last.y;
    const distance = Math.hypot(dx,dz);
    const strength = T.MathUtils.smoothstep(p.speed, 6.5, 22);
    const rolling = p.grounded && strength > 0;
    // Start at the contact actually traversed. A warp, a landing or a restored
    // journey starts a fresh stroke at its own height, including on bridges.
    if (!(dt >= 0 && dt < .2) || distance > Math.max(.1,dt*38) || Math.abs(dy) > 1.4) {
      for (const mark of marks) mark.born = -Infinity;
      stride = 0;
    } else if (rolling && distance > 0 && lastGrounded) {
      const interval = 1.72 + .64*strength;
      for (let along = (1-stride)*interval; along <= distance; along += interval) {
        const u = along/distance, mark = marks[serial % capacity];
        mark.x = last.x+dx*u; mark.y = last.y+dy*u; mark.z = last.z+dz*u;
        mark.yaw = Math.atan2(dx,dz);
        mark.pitch = -Math.atan2(dy,distance);
        mark.born = lastTime+dt*u;
        // Let the ink dry within a few metres, even under the speed charm.
        mark.lifetime = Math.min(.42, 6.4/p.speed);
        mark.pressure = (serial%2 ? -1 : 1) * (.18+.72*strength);
        mark.size = (.70+.48*strength)*(.93+.10*Math.sin(serial*2.4));
        serial++;
      }
      stride = (stride+distance/interval)%1;
    } else stride = 0;
    lastTime = t;
    lastGrounded = p.grounded;
    last.set(p.x,p.y,p.z);

    let count = 0;
    for (const mark of marks) {
      if (!Number.isFinite(mark.born)) continue;
      const age = (t-mark.born)/mark.lifetime;
      if (age < 0 || age >= 1) continue;
      const size = mark.size*(.76+.44*age);
      transform.position.set(p.x+wrapWorld(mark.x-p.x), mark.y+.16*age, p.z+wrapWorld(mark.z-p.z));
      transform.rotation.set(mark.pitch,mark.yaw,0,'YXZ');
      transform.scale.set(size,size,size);
      transform.updateMatrix();
      mesh.setMatrixAt(count,transform.matrix);
      pressure.setX(count++,mark.pressure*T.MathUtils.smoothstep(age,0,.16)*(1-age)**1.4);
    }
    mesh.count = count;
    mesh.visible = count > 0;
    if (count) mesh.instanceMatrix.needsUpdate = pressure.needsUpdate = true;
  };
}
