import * as T from './vendor/three.module.min.js';

const finishes = ['wood', 'bark', 'stone', 'metal', 'rope', 'paper', 'noren', 'rush', 'endGrain', 'washi', 'stumpBark'];
const axes = ['x', 'y', 'z'];

// Keep the original timber coordinates for UV projection, before rotating a
// piece into the building. Diagonal rafters thus carry grain along their span.
export function hokoraCarpentry() {
  const positions = [], normals = [], colors = [], uvs = [], finishIds = [], indices = [];
  const color = new T.Color(), vertex = new T.Vector3(), normal = new T.Vector3();
  const edgeA = new T.Vector3(), edgeB = new T.Vector3();
  function face(kind, tint, points, opts = {}, matrix, smoothNormals) {
    const start = positions.length / 3, id = finishes.indexOf(kind);
    const faceNormal = edgeA.fromArray(points[1]).sub(vertex.fromArray(points[0]))
      .cross(edgeB.fromArray(points[2]).sub(vertex.fromArray(points[0]))).normalize();
    const facing = [Math.abs(faceNormal.x), Math.abs(faceNormal.y), Math.abs(faceNormal.z)];
    const dominant = facing.indexOf(Math.max(...facing));
    const grain = axes.indexOf(opts.grain ?? 'x');
    const along = dominant === grain ? (grain + 1) % 3 : grain;
    const across = 3 - dominant - along;
    const seed = opts.seed ?? 0, du = .31 * Math.sin(54.17 * seed), dv = .48 * Math.sin(76.31 * seed);
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      vertex.fromArray(p);
      if (smoothNormals) normal.fromArray(smoothNormals[i]);
      else normal.copy(faceNormal);
      if (matrix) {
        vertex.applyMatrix4(matrix);
        normal.transformDirection(matrix);
      }
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
      color.set(opts.colors?.[i] ?? tint);
      colors.push(color.r, color.g, color.b);
      const uv = opts.uvs?.[i];
      uvs.push((uv ? uv[0] : p[along] / .72) + du, (uv ? uv[1] : p[across] / .48) + dv);
      finishIds.push(id);
    }
    for (let i = 1; i < points.length - 1; i++) indices.push(start, start + i, start + i + 1);
  }

  // Three flat faces meet across three narrow cut edges and a triangular
  // corner. The broad face stays flat under the grazing light at the spring.
  function timber(kind, tint, size, matrix, opts) {
    const half = size.map(d => d / 2);
    const b = Math.min(opts.bevel ?? 0, Math.min(...half) * .65);
    function panel(points) {
      const a = new T.Vector3().fromArray(points[0]);
      const outward = new T.Vector3().fromArray(points[1]).sub(a)
        .cross(new T.Vector3().fromArray(points[2]).sub(a));
      if (outward.dot(a) < 0) points.reverse();
      face(kind, tint, points, opts, matrix);
    }
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3, k = (i + 2) % 3;
      for (const sign of [-1, 1]) {
        panel([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v]) => {
          const p = [0,0,0];
          p[i] = sign * half[i]; p[j] = u * (half[j]-b); p[k] = v * (half[k]-b);
          return p;
        }));
      }
      if (b) for (const u of [-1,1]) for (const v of [-1,1]) {
        panel([[-1,0],[1,0],[1,1],[-1,1]].map(([end,edge]) => {
          const p = [0,0,0];
          p[i] = end * (half[i]-b); p[j] = u * (half[j]-b*edge); p[k] = v * (half[k]-b*(1-edge));
          return p;
        }));
      }
    }
    if (b) for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
      panel([0,1,2].map(axis => [x,y,z].map((sign, i) => sign * (half[i]-(i===axis ? 0 : b)))));
    }
  }

  return {
    face,
    box(kind, tint, center, size, opts = {}) {
      const rotation = new T.Euler(...(opts.rotation ?? [0,0,0]));
      const matrix = new T.Matrix4().makeRotationFromEuler(rotation).setPosition(...center);
      timber(kind,tint,size,matrix,opts);
    },
    beam(kind, tint, from, to, width, depth, opts = {}) {
      const start = new T.Vector3(...from), span = new T.Vector3(...to).sub(start);
      const length = span.length();
      const rotation = new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0), span.normalize());
      const matrix = new T.Matrix4().makeRotationFromQuaternion(rotation).setPosition(start.addScaledVector(span,length/2));
      timber(kind,tint,[width,length,depth],matrix,{...opts,grain:'y'});
    },
    add(kind, tint, geometry, opts = {}) {
      const pos = geometry.attributes.position, n = geometry.attributes.normal;
      const order = geometry.index?.array, count = order?.length ?? pos.count;
      for (let i = 0; i < count; i += 3) {
        const tri = [i,i+1,i+2].map(k => order ? order[k] : k);
        face(kind, tint, tri.map(k => [pos.getX(k),pos.getY(k),pos.getZ(k)]), opts, null,
          n && tri.map(k => [n.getX(k),n.getY(k),n.getZ(k)]));
      }
    },
    finish() {
      const geometry = new T.BufferGeometry();
      geometry.setIndex(indices);
      for (const [name,data,size] of [['position',positions,3],['normal',normals,3],['color',colors,3],
        ['uv',uvs,2],['finishId',finishIds,1]]) {
        geometry.setAttribute(name, new T.Float32BufferAttribute(data,size));
      }
      geometry.computeBoundingSphere();
      return geometry;
    },
  };
}
