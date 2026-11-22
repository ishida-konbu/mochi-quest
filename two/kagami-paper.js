import * as T from './vendor/three.module.min.js';

// The same softly mottled kozo stock runs through the shide and the printed mount.
let stock;
function washi() {
  if (stock) return stock;
  const size = 256, count = size * size;
  let seed = 0x18a63bf;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const pulp = new Float32Array(count);
  const cells = Float32Array.from({ length: 16 * 16 }, random);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const col = x >> 4, row = y >> 4, u = (x % 16) / 16, v = (y % 16) / 16;
      const cell = (i, j) => cells[((row + j) % 16) * 16 + (col + i) % 16];
      const soft = (1-v) * ((1-u)*cell(0,0) + u*cell(1,0)) + v * ((1-u)*cell(0,1) + u*cell(1,1));
      pulp[y*size+x] = 151 + (soft - .5) * 35 + (random() - .5) * 13;
    }
  }
  // Long, gently curved fibres catch the light both above and under the printed ink.
  for (let strand = 0; strand < 3600; strand++) {
    const x0 = random()*size, y0 = random()*size, angle = random()*Math.PI*2;
    const length = 2 + random()**2 * 21, bend = random()-.5;
    const contrast = random() < .72 ? 21 : -19;
    for (let i = 0; i <= length; i++) {
      const arc = bend * Math.sin(i/length*Math.PI) * 3;
      const x = Math.round(x0 + i*Math.cos(angle) - arc*Math.sin(angle)) & 255;
      const y = Math.round(y0 + i*Math.sin(angle) + arc*Math.cos(angle)) & 255;
      pulp[y*size+x] += contrast*Math.sin(Math.PI*(i+.5)/(length+1));
    }
  }
  function texture(bytes, width, color) {
    const map = new T.DataTexture(bytes, width, width);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.magFilter = T.LinearFilter;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = 4;
    if (color) map.colorSpace = T.SRGBColorSpace;
    map.needsUpdate = true;
    return map;
  }
  const relief = new Uint8Array(count * 4);
  for (let i = 0; i < count; i++) {
    const h = Math.round(T.MathUtils.clamp(pulp[i], 0, 255));
    relief.set([h, h, h, 255], 4*i);
  }
  const side = 512, printed = new Uint8Array(side*side*4);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      const edge = Math.min(x, y, side-1-x, side-1-y);
      const fibre = pulp[(y % size)*size + x % size]-151;
      const border = edge + fibre*.042;
      let r = 248, g = 241, b = 222;
      if (border < 24) {
        // A vermilion brush pass leaves a lighter ruled line inside the rim.
        const thin = Math.max(0, 1-Math.abs(border-18.5)/1.35);
        r = 176 + thin*40; g = 43 + thin*61; b = 39 + thin*34;
      }
      const k = (border<24 ? .46 : .36)*fibre;
      const i = (y*side+x)*4;
      printed[i] = Math.min(255,r+k); printed[i+1] = Math.min(255,g+k);
      printed[i+2] = Math.min(255,b+k*.94); printed[i+3] = 255;
    }
  }
  stock = { relief: texture(relief, size, false), printed: texture(printed, side, true) };
  return stock;
}

function shihobeni() {
  const { relief, printed } = washi();
  const n = 28, xyz = [], uv = [], index = [];
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const u = 2*i/n-1, v = 2*j/n-1;
      const tip = Math.max(0, (Math.abs(u)+Math.abs(v)-1.13)/.87);
      const height = .012 + tip*tip*(.071+.024*u-.016*v);
      xyz.push(.91*u, height, .91*v);
      uv.push(i/n,j/n);
      if (i<n && j<n) {
        const a = j*(n+1)+i, b = a+n+1;
        index.push(a,b,b+1,a,b+1,a+1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  const sheet = new T.Mesh(geometry, new T.MeshStandardMaterial({
    map: printed, bumpMap: relief, bumpScale: .0045, roughness: .95, side: T.DoubleSide,
  }));
  sheet.name = '四方紅';
  sheet.rotation.y = .20*Math.PI;
  sheet.castShadow = sheet.receiveShadow = true;
  return sheet;
}

function gohei(side, wood, thread) {
  const group = new T.Group();
  group.name = side < 0 ? '右手の御幣' : '左手の御幣';
  // Put this prop's origin in the grip. The hand samples in poseRice carry
  // it through skeletal poses as well as the dough's airborne shape key.
  const grip = new T.Vector3(side*.454, .494, .591);
  const positions = [], uvs = [], colors = [];
  const windOffsets = [[], [], []];
  function streamer(side, start, originalScale, white, tint) {
    // The same cut, enlarged about its attachment. Fan the longer white strip
    // out past the shorter red one so neither needs to drag on the ground.
    const scale = 3 * originalScale;
    const cant = white ? .62 : .34;
    const facing = white ? .25 : -.20;
    const mount = new T.Quaternion().setFromEuler(new T.Euler(0, side*facing, side*cant, 'YXZ'));
    const sections = [
      [-.036, .004, .046,  .022, .000],
      [-.008,-.102, .084, -.074, .046],
      [ .039,-.077, .136, -.046, .021],
      [ .055,-.179, .150, -.147, .060],
      [ .110,-.153, .200, -.126, .037],
      [ .127,-.293, .221, -.253, .083],
    ];
    const rgb = new T.Color(tint);
    const edgeTwist = [.004,-.008,.014,-.012,.016,.002];
    const anchor = new T.Vector3(side*start.x, start.y, start.z);
    // Use the existing attachment at the middle of the tied edge as a pivot.
    function mountPoint(x,y,z) {
      const turn = white ? 1 : -1;
      return new T.Vector3(side*(x-.005), y-.013+side*.076*(x-.005),
        z-.002-.23*turn*(x-.005)-.13*(y-.013))
        .multiplyScalar(scale).applyQuaternion(mount).add(anchor);
    }
    const folds = sections.map(([lx,ly,rx,ry,z],i) => [
      mountPoint(lx,ly,z), mountPoint(rx,ry,z+edgeTwist[i]),
    ]);
    const rows = [folds[0]];
    const shade = [];
    for (let i=1; i<folds.length; i++) {
      const lip = folds[i-1].map((p,j) => {
        const ridge = p.clone().lerp(folds[i][j],.16);
        ridge.z += .004*scale;
        return ridge;
      });
      rows.push(lip,folds[i]);
      const tucked = i%2===0, face = tucked ? .75 : 1;
      shade.push([tucked ? .68 : i===1 ? .95 : .73, face], [face,face]);
    }

    // Hinge a connected chain of cross sections, preserving the width at
    // each crease. Integrating each bent segment from the one before it
    // keeps both sides of a folded edge together even at full deflection.
    const centers = rows.map(([l,r]) => l.clone().lerp(r,.5));
    const lengths = [0];
    for (let i=1; i<rows.length; i++)
      lengths.push(lengths[i-1] + centers[i].distanceTo(centers[i-1]));
    function bent(mode) {
      let center = centers[0].clone();
      const rotations = lengths.map(length => {
        const u = length / lengths.at(-1);
        const phase = (white ? 0 : .94) + side*.50 + 3.9*u;
        const attenuation = Math.sin(u*Math.PI/2);
        let pitch, yaw, lift;
        if (mode===0) {
          pitch = .27*attenuation;
          yaw = side*.51*attenuation;
          lift = side*.14*attenuation;
        } else {
          const cycle = mode===1 ? phase : phase+Math.PI/2;
          const sweep = attenuation*Math.cos(cycle);
          const curl = attenuation*Math.sin(cycle);
          pitch = .46*sweep;
          yaw = side*.23*curl;
          lift = side*(.30*sweep+.13*curl);
        }
        return new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,lift,'YXZ'));
      });
      return rows.map((row,i) => {
        if (i) {
          const midpointRotation = rotations[i-1].clone().slerp(rotations[i], .5);
          center.add(centers[i].clone().sub(centers[i-1]).applyQuaternion(midpointRotation));
        }
        return row.map(point => point.clone().sub(centers[i])
          .applyQuaternion(rotations[i]).add(center).sub(point));
      });
    }
    const poses = windOffsets.map((_,mode) => bent(mode));
    function vertex(row,edge,value) {
      const p = rows[row][edge];
      positions.push(p.x,p.y,p.z);
      for (let mode=0;mode<poses.length;mode++) {
        const d = poses[mode][row][edge];
        windOffsets[mode].push(d.x,d.y,d.z);
      }
      uvs.push(p.x*1.9,p.y*1.9);
      colors.push(rgb.r*value,rgb.g*value,rgb.b*value);
    }
    for (let i=1; i<rows.length; i++) {
      const [top,low]=shade[i-1];
      vertex(i-1,0,top); vertex(i,0,low); vertex(i,1,low);
      vertex(i-1,0,top); vertex(i,1,low); vertex(i-1,1,top);
    }
  }
  function wandPiece(a,b,width,material) {
    const direction = new T.Vector3().subVectors(b,a);
    const rod = new T.Mesh(new T.CylinderGeometry(width,width*.96,direction.length(),8), material);
    rod.position.copy(a).lerp(b,.5).sub(grip);
    rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
    rod.castShadow = true;
    group.add(rod);
  }
  const base = new T.Vector3(side*.376,.323,.634);
  const head = new T.Vector3(side*.60,.815,.51);
  wandPiece(base,head,.016,wood);
  for (const t of [.055,.802,.842]) {
    wandPiece(base.clone().lerp(head,t),base.clone().lerp(head,t+.021),.018,thread);
  }
  streamer(side,new T.Vector3(.554,.726,.537),.69,false,'#bb4037');
  streamer(side,new T.Vector3(.57,.757,.551),1,true,'#fffdf4');
  const geo = new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geo.morphTargetsRelative = true;
  geo.computeVertexNormals();
  geo.morphAttributes.position = windOffsets.map(values => new T.Float32BufferAttribute(values,3));
  // Store the folded normals of each pose so the paper catches light as it turns.
  const baseNormals = geo.attributes.normal.array;
  geo.morphAttributes.normal = windOffsets.map(offsets => {
    const deformed = new T.BufferGeometry();
    const points = positions.map((v,i) => v+offsets[i]);
    deformed.setAttribute('position', new T.Float32BufferAttribute(points,3));
    deformed.computeVertexNormals();
    const normals = deformed.attributes.normal.array.map((v,i) => v-baseNormals[i]);
    deformed.dispose();
    return new T.BufferAttribute(normals,3);
  });
  const strips = new T.Mesh(geo,new T.MeshStandardMaterial({
    vertexColors:true, color:new T.Color().setScalar(1.62), map:washi().relief,
    bumpMap:washi().relief, bumpScale:.0018, roughness:.91, side:T.DoubleSide,
  }));
  strips.name='折り紙垂';
  strips.position.copy(grip).negate();
  strips.castShadow = strips.receiveShadow = true;
  group.add(strips);
  return { group, strips };
}

export function addKagamiPaper(stack) {
  stack.add(shihobeni());
  const wood = new T.MeshStandardMaterial({color:'#d1ab79',roughness:.72});
  const thread = new T.MeshStandardMaterial({color:'#97372d',roughness:.62});
  const wands = [-1,1].map(side => gohei(side,wood,thread));
  for (const wand of wands) stack.add(wand.group);
  return wands;
}
