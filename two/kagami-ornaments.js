import * as T from './vendor/three.module.min.js';
import { addKagamiPaper } from './kagami-paper.js';

// The longitudinal UV follows the length of each strand. This makes the spiral
// left by winding foil or dyed paper the same size on a petal and on the sash.
function woundFinish(shades, foil) {
  const size = 128;
  const colorData = new Uint8Array(size * size * 4);
  const reliefData = new Uint8Array(colorData.length);
  const colors = shades.map(shade => new T.Color(shade));
  const sample = new T.Color();
  const tau = Math.PI * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const warp = .045 * Math.sin(tau * (u + v)) + .018 * Math.cos(tau * (2 * u - v));
      const helix = 4 * u - v + warp;
      const roll = .5 - .5 * Math.cos(helix * tau);
      const seam = Math.exp(-Math.pow((roll - .055) / .09, 2));
      const glint = Math.pow(roll, 4) * (.62 + .38 * Math.cos(tau * (u + v + warp)));
      const grain = .5 + .5 * Math.sin(x * 1.21 + y * 7.03) * Math.cos(y * .87 - x * .65);
      const fiber = Math.pow(.5 + .5 * Math.sin(tau * (helix * 6 + .25 * Math.sin(tau * v))), 6);
      const tone = T.MathUtils.clamp(.30 + .38 * roll - .26 * seam
        + (foil ? .46 : .21) * glint + .09 * fiber + .05 * grain, 0, 1);
      sample.copy(tone < .55 ? colors[0] : colors[1])
        .lerp(tone < .55 ? colors[1] : colors[2], tone < .55 ? tone / .55 : (tone - .55) / .45)
        .convertLinearToSRGB();
      const i = (y * size + x) * 4;
      colorData[i] = sample.r * 255;
      colorData[i + 1] = sample.g * 255;
      colorData[i + 2] = sample.b * 255;
      colorData[i + 3] = 255;
      // Red carries the raised wrap, green the roughness of paper or foil.
      reliefData[i] = 38 + 136 * roll + 45 * fiber + 21 * grain;
      reliefData[i + 1] = foil ? 161 - 119 * glint + 26 * seam : 216 - 63 * roll + 18 * grain;
      reliefData[i + 2] = reliefData[i + 3] = 255;
    }
  }
  function tile(data) {
    const map = new T.DataTexture(data, size, size);
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.minFilter = T.LinearMipmapLinearFilter;
    map.magFilter = T.LinearFilter;
    map.generateMipmaps = true;
    map.anisotropy = 4;
    map.needsUpdate = true;
    return map;
  }
  const map = tile(colorData);
  map.colorSpace = T.SRGBColorSpace;
  const relief = tile(reliefData);
  return {
    positions: [], normals: [], uvs: [], shade: [], indices: [],
    material: new T.MeshStandardMaterial({ map, bumpMap: relief, roughnessMap: relief,
      roughness: 1, metalness: foil ? .66 : .03, bumpScale: foil ? .00095 : .00072,
      vertexColors: true, envMapIntensity: foil ? 1.45 : .8 }),
  };
}

function mizuhiki() {
  const bow = new T.Group();
  bow.name = '紅白金の梅結び';
  const red = woundFinish(['#88182c', '#bc2437', '#e6524e'], false);
  const white = woundFinish(['#c6b69a', '#f3e8d1', '#fff9e8'], false);
  const gold = woundFinish(['#b27933', '#ebbf75', '#fff4c7'], true);

  // Collect the swept strands by finish. Even the five-ply knot is drawn in
  // three batches with continuous lighting and texture around each bend.
  function cord(points, finish, radius, closed = false, segments = 32, interlaced = false) {
    const curve = new T.CatmullRomCurve3(points, closed);
    const tube = new T.TubeGeometry(curve, segments, radius, 8, closed);
    const { position, normal, uv } = tube.attributes;
    const offset = finish.positions.length / 3;
    const wraps = Math.max(1, Math.round(curve.getLength() / .096));
    for (let i = 0; i < position.count; i++) {
      finish.positions.push(position.getX(i), position.getY(i), position.getZ(i));
      finish.normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
      finish.uvs.push(uv.getX(i) * wraps, uv.getY(i));
      // In each petal one end dives below the next bundle. Occlusion from
      // that crossing stays visible even at the game's small shadow-map scale.
      const phase = (uv.getX(i) * 5) % 1;
      const shade = interlaced ? 1 - .44 * Math.exp(-Math.pow((phase - .925) / .056, 2)) : 1;
      finish.shade.push(shade, shade, shade);
    }
    for (const index of tube.index.array) finish.indices.push(index + offset);
    tube.dispose();
  }

  // The sash follows the slight asymmetry in the cake's upper shoulder.
  const sash = [[.399,.832,gold], [.411,.820,red], [.423,.806,white],
    [.435,.790,red], [.447,.774,gold]];
  for (const [y, r, finish] of sash) {
    const ring = [];
    for (let i = 0; i < 48; i++) {
      const angle = 2 * Math.PI * i / 48;
      const radius = r * (1 + .010 * Math.cos(3 * angle + y * 7) + .006 * Math.sin(5 * angle - y * 4));
      ring.push(new T.Vector3(radius * Math.sin(angle), y, .94 * radius * Math.cos(angle)));
    }
    cord(ring, finish, .0085, true, 80);
  }

  // The cranes' wing shapes behind the plum are open loops of varying
  // heights. Both the loops and the unknotted tips bend back around the cake.
  for (const side of [-1, 1]) {
    const main = side < 0 ? red : white;
    const sprays = [
      [[.046,.445], [.171,.550], [.353,.619], [.464,.599], [.367,.527], [.170,.482], [.053,.440]],
      [[.068,.439], [.231,.497], [.422,.515], [.498,.487], [.388,.458], [.214,.449], [.074,.430]],
    ];
    for (const points of sprays) {
      for (const [strand, finish] of [[0,main], [1,gold]]) {
        const loop = points.map(([x,y]) => new T.Vector3(
          side * x * (1 - .036 * strand), y - .012 * strand,
          .828 - .74 * x * x - .18 * (y - .43) + strand * .003));
        cord(loop, finish, strand ? .005 : .009);
      }
    }

    const ends = [[.044,.418], [.145,.341], [.257,.293], [.349,.277], [.424,.234]];
    for (let j = 0; j < 4; j++) {
      const tail = ends.map(([x,y], i) => new T.Vector3(
        side * (x + i * .004 * j), y + i * .004 * j,
        .843 - .655 * x * x - .008 * j));
      cord(tail, [gold,main,main,gold][j], .0065);
    }
  }

  // A single circuit visits every second petal. The five parallel cords pass
  // over and under themselves near the middle instead of meeting at a hub.
  const design = [];
  const centerY = .438;
  for (let lobe = 0; lobe < 5; lobe++) {
    const angle = lobe * Math.PI * 4 / 5;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const petal = [[-.037,.068,.012], [-.073,.122,.008], [-.066,.166,.004],
      [-.030,.191,.001], [.013,.194,0], [.058,.171,.001],
      [.075,.131,.002], [.055,.088,.007], [.021,.051,.023]];
    for (const [across, along, rise] of petal) {
      const x = across * cos + along * sin;
      const y = centerY + along * cos - across * sin;
      design.push(new T.Vector3(x, y, .850 + rise - .15 * (y - centerY) - .35 * x * x));
    }
  }
  const weave = new T.CatmullRomCurve3(design, true);
  const colors = [gold, red, white, red, gold];
  for (let j = 0; j < colors.length; j++) {
    const strand = [];
    const offset = (j - 2) * .009;
    for (let i = 0; i < 185; i++) {
      const u = i / 185;
      const p = weave.getPointAt(u);
      // Lift the emerging bundle enough to clear all five cords below it.
      const phase = (u * 5) % 1;
      p.z += .025 * Math.exp(-Math.pow((phase - .819) / .059, 2))
        - .009 * Math.exp(-Math.pow((phase - .925) / .055, 2));
      const tangent = weave.getTangentAt(u);
      const planarLength = Math.hypot(tangent.x, tangent.y);
      p.x -= tangent.y / planarLength * offset;
      p.y += tangent.x / planarLength * offset;
      strand.push(p);
    }
    cord(strand, colors[j], .0055, true, 210, true);
  }

  for (const finish of [red, white, gold]) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.Float32BufferAttribute(finish.positions, 3));
    geometry.setAttribute('normal', new T.Float32BufferAttribute(finish.normals, 3));
    geometry.setAttribute('uv', new T.Float32BufferAttribute(finish.uvs, 2));
    geometry.setAttribute('color', new T.Float32BufferAttribute(finish.shade, 3));
    geometry.setIndex(finish.indices);
    const mesh = new T.Mesh(geometry, finish.material);
    mesh.castShadow = mesh.receiveShadow = true;
    bow.add(mesh);
  }
  return bow;
}

export function addKagamiOrnaments(stack) {
  stack.add(mizuhiki());
  return addKagamiPaper(stack);
}
