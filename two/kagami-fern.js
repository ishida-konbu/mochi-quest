import * as T from './vendor/three.module.min.js';

// Two forked sprigs: turn the front spray silver-side out and leave the green
// companions visible behind it. Each pinna has its own cut margin and midrib.
export function addKagamiFern(stack) {
  const leaves = { positions: [], colors: [], indices: [] };
  const stems = { positions: [], colors: [], indices: [] };
  const point = (x, y, z) => new T.Vector3(x, y, z);

  function vertex(batch, p, shade) {
    batch.positions.push(p.x, p.y, p.z);
    batch.colors.push(shade, shade, shade);
    return batch.positions.length / 3 - 1;
  }

  function stalk(curve, startWidth, endWidth, segments) {
    const frames = curve.computeFrenetFrames(segments, false);
    const first = stems.positions.length / 3;
    const sides = 6;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const center = curve.getPointAt(u);
      const radius = T.MathUtils.lerp(startWidth, endWidth, u);
      for (let j = 0; j < sides; j++) {
        const a = j * 2 * Math.PI / sides;
        const p = center.clone().addScaledVector(frames.normals[i], radius * Math.cos(a))
          .addScaledVector(frames.binormals[i], radius * Math.sin(a));
        vertex(stems, p, .72 + .24 * u);
        if (!i) continue;
        const k = first + (i - 1) * sides + j;
        const next = first + (i - 1) * sides + (j + 1) % sides;
        stems.indices.push(k, next, k+sides, next, next+sides, k+sides);
      }
    }
  }

  function pinna(root, direction, surfaceNormal, width, silver, seed) {
    const cross = direction.clone().cross(surfaceNormal).normalize();
    const length = direction.length();
    const n = Math.max(4, Math.round(44 * length));
    const first = leaves.positions.length / 3;
    function axis(u) {
      return root.clone().addScaledVector(direction,u)
        .addScaledVector(surfaceNormal, length*(.09*Math.sin(Math.PI*u)-.10*u*u))
        .addScaledVector(cross, length*.042*Math.sin(Math.PI*u)*Math.sin(seed));
    }
    function quad(k) {
      if (silver) leaves.indices.push(k,k+3,k+1, k+1,k+3,k+4);
      else leaves.indices.push(k,k+1,k+3, k+1,k+4,k+3);
    }
    // A slender midrib joins the paired, forward-pointing lobes. The incision
    // reaches almost to the rib; the small curved tips remain visibly distinct.
    for (let i=0; i<=n; i++) {
      const u=i/n, center=axis(u);
      const radius = width*.16*(1-u)+.00015;
      for (const edge of [-1,0,1]) {
        vertex(leaves,center.clone().addScaledVector(cross,edge*radius)
          .addScaledVector(surfaceNormal,edge===0 ? radius*.32 : 0),edge===0 ? 1.17 : .83);
      }
      if(i) { quad(first+(i-1)*3); quad(first+(i-1)*3+1); }
    }
    for (let i=0;i<n;i++) {
      for (const edge of [-1,1]) {
        const u=(i+.18+(edge===1?.31:0))/n;
        const center=axis(u);
        const arc=Math.pow(Math.sin(Math.PI*(.06+.92*u)),.65);
        const halfBlade=width*arc;
        const reach=length/n;
        const tip=cross.clone().multiplyScalar(edge*halfBlade)
          .addScaledVector(direction, reach/length*(.78+.50*u));
        const broad=tip.clone().cross(surfaceNormal).normalize();
        const shade = .80 + .06*Math.cos(seed+i*1.7+edge);
        const ridge = vertex(leaves,center.clone().addScaledVector(tip,.48)
          .addScaledVector(surfaceNormal,.11*halfBlade+.0016),shade+.20);
        const rim = [[0,-.18],[0,.18],[.28,.70],[.63,.64],[1,0],[.77,-.36],[.53,-.70],[.25,-.61]];
        const firstRim = leaves.positions.length/3;
        for (const [v,w] of rim) {
          const margin = center.clone().addScaledVector(tip,v)
            .addScaledVector(broad,reach*.49*w)
            .addScaledVector(surfaceNormal,halfBlade*(.11*Math.sin(Math.PI*v)-.12*v*v));
          vertex(leaves,margin,shade+.055*v);
        }
        for(let j=0;j<rim.length;j++) {
          const a=firstRim+j, b=firstRim+(j+1)%rim.length;
          if (silver) leaves.indices.push(ridge,b,a);
          else leaves.indices.push(ridge,a,b);
        }
      }
    }
  }

  function frond(curve, side, silver) {
    stalk(curve,.004,.0015,24);
    const count = silver ? 16 : 13;
    for (let rank = 0; rank < count; rank++) {
      for (const flank of [-1,1]) {
        const u = .065 + .90 * (rank + (flank===side ? .22 : 0))/count;
        const root = curve.getPointAt(u), along = curve.getTangentAt(u);
        const lateral = point(0,1,.12).cross(along).normalize();
        const roll = side * ((silver ? -.14 : .12) + .15*Math.sin(3.8*u) + .16*u*u);
        lateral.applyAxisAngle(along,roll);
        const normal = along.clone().cross(lateral).normalize();
        const fan = Math.sin(Math.PI*(.14+.86*u))**.65;
        const length = (silver ? .20 : .185)*fan*(1+.09*Math.sin(rank*3+side));
        const direction = lateral.multiplyScalar(flank*length)
          .addScaledVector(along, length*(.40+.54*u));
        pinna(root, direction, normal, (.031 - .011*u)*fan, silver, rank*1.3+flank);
      }
    }
  }

  for (const side of [-1,1]) {
    const skew = side < 0 ? .018 : 0;
    // The compressed stalk sits in the gap above the paper (y=.012) and
    // below the flat foot of the lower cake (y=.020). The lamina spreads
    // horizontally once clear of the foot, curling gently above the sheet.
    const fork = point(side*.31,.024,.36);
    stalk(new T.CatmullRomCurve3([
      point(side*.04,.016,.125),point(side*.18,.017,.24),fork,
    ]),.003,.004,7);
    frond(new T.CatmullRomCurve3([
      fork, point(side*.37,.041,.52), point(side*.47,.076,.72),
      point(side*.56,.103,.89), point(side*(.66+skew),.099,1.04),
      point(side*(.79+skew),.071+skew,1.17),
    ]), side, true);
    frond(new T.CatmullRomCurve3([
      fork, point(side*.49,.041,.39), point(side*.72,.087,.43),
      point(side*.94,.113,.49), point(side*1.11,.107,.52),
      point(side*1.30,.083+skew,.53),
    ]), side, false);
  }

  function geometry(batch) {
    if (batch === leaves) {
      // The soft inner pinnae rest on the paper instead of poking through it;
      // gradually release the fold as the free tip rises off the stock.
      for (let i=0;i<batch.positions.length;i+=3) {
        const radius = Math.hypot(batch.positions[i],batch.positions[i+2]);
        const support = .016 + .018*T.MathUtils.smoothstep(radius,.70,1);
        const rise = batch.positions[i+1]-support;
        batch.positions[i+1] = support + .5*(rise+Math.hypot(rise,.006));
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(batch.positions,3));
    geo.setAttribute('color', new T.Float32BufferAttribute(batch.colors,3));
    geo.setIndex(batch.indices);
    geo.computeVertexNormals();
    return geo;
  }

  const group = new T.Group();
  group.name = '裏白・二股の葉';
  // The two faces of a cut leaflet share its geometry. Switching the pigment
  // and roughness in the same draw leaves the white powder visible as it curls.
  const material = new T.MeshStandardMaterial({ vertexColors:true, side:T.DoubleSide });
  material.onBeforeCompile = shader => {
    shader.uniforms.fernGreen = { value:new T.Color('#43783c') };
    shader.uniforms.fernSilver = { value:new T.Color('#b2c9ad') };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>','#include <common>\nuniform vec3 fernGreen, fernSilver;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= gl_FrontFacing ? fernGreen : fernSilver;')
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor = gl_FrontFacing ? .51 : .86;');
  };
  const blade = new T.Mesh(geometry(leaves),material);
  const axis = new T.Mesh(geometry(stems), new T.MeshStandardMaterial({
    color:'#76854d', roughness:.70, vertexColors:true,
  }));
  blade.castShadow = axis.castShadow = true;
  blade.receiveShadow = axis.receiveShadow = true;
  group.add(axis, blade);
  stack.add(group);
  return group;
}
