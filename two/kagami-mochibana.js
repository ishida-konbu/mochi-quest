import * as T from './vendor/three.module.min.js';
import { addMochibanaRice } from './mochibana-rice.js';

const v = (x, y, z) => new T.Vector3(x, y, z);
const tau = 2 * Math.PI;
const ivory = ['#fff8e9', '#fff2e1', '#f9eada'];
const beni = ['#eca5ad', '#da838e', '#c44862', '#e997a5', '#c95c70'];
const riceRadius = .038;

function randomSource(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

let willowBark;
// Thin willow bark has faint lengthwise fibres, broken by small transverse
// lenticels. Wrap the same physical length of bark along each switch.
function barkMaterial() {
  if (willowBark) return willowBark;
  const w = 128, h = 256, random = randomSource(0xe1a7);
  const scars = new Float32Array(w*h);
  for (let i=0; i<33; i++) {
    const cx = Math.floor(random()*w), cy = Math.floor(random()*h);
    const radius = 2.0 + random()*6.5, rise = 1.0+random(), slant=(random()-.5)*.55;
    for (let dy=-5;dy<=5;dy++) for (let dx=-9;dx<=9;dx++) {
      const across=dx/radius, along=(dy-slant*dx-.55*across**2)/rise;
      const r=across**2+along**2;
      // The raised cork line has a shallow, darker crease on its lower edge.
      if (r<1) scars[((cy+dy+h)%h)*w + (cx+dx+w)%w] += (1-r)*(along<-.25 ? -.70 : 1.65);
    }
  }
  const color = new Uint8Array(w*h*4), bump = new Uint8Array(w*h);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const u = tau*x/w, t = tau*y/h;
    const fibre = .53*Math.sin(13*u + .9*Math.sin(t))
      + .26*Math.sin(29*u - 1.1*Math.sin(2*t+u))
      + .21*Math.sin(43*u + .5*Math.sin(3*t-2*u));
    const cloud = .55*Math.sin(3*u+t) + .45*Math.sin(2*u-3*t);
    const i = y*w+x, tooth = random()-.5;
    const value = 201 + 17*cloud + 14*fibre + 8*tooth + 50*scars[i];
    color.set([Math.min(255,value+10), Math.min(255,value+2), Math.min(255,value-4), 255],i*4);
    bump[i] = Math.min(255,125 + 30*fibre + 12*tooth + 53*scars[i]);
  }
  function tiled(data, format) {
    const tex = new T.DataTexture(data,w,h,format);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.magFilter = T.LinearFilter;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }
  const map = tiled(color,T.RGBAFormat);
  map.colorSpace = T.SRGBColorSpace;
  willowBark = new T.MeshStandardMaterial({
    vertexColors:true, map, bumpMap:tiled(bump,T.RedFormat), bumpScale:.0011, roughness:.68,
  });
  return willowBark;
}

function bucket() {
  return { positions:[], normals:[], colors:[], uvs:[], indices:[] };
}

function batch(parent, data, material, name) {
  const geo = new T.BufferGeometry();
  for (const [attribute, values, width] of [
    ['position',data.positions,3], ['normal',data.normals,3],
    ['color',data.colors,3], ['uv',data.uvs,2],
  ]) geo.setAttribute(attribute,new T.Float32BufferAttribute(values,width));
  geo.setIndex(data.indices);
  const mesh = new T.Mesh(geo,material);
  mesh.name=name;
  mesh.castShadow=mesh.receiveShadow=true;
  parent.add(mesh);
}

function branch(path) { return new T.CatmullRomCurve3(path); }
function twigRadius(base,tip,u) {
  return T.MathUtils.lerp(tip,base,(1-u)**1.53);
}

export function addKagamiMochibana(stack) {
  const bouquet = new T.Group();
  bouquet.name = '背負い餅花';
  stack.add(bouquet);
  const bark = bucket(), bindings = bucket(), morsels = [];
  const random = randomSource(0x46bc3a2);

  // A rotated, slightly elliptical section has a low swelling at each node.
  // Analytic normals remain continuous across the duplicated bark UV seam.
  function sweep(data,curve,{base,tip,segments,sides=8,rootTint,tipTint,nodes=[],cut=false,bulge}) {
    const length = curve.getLength(), frames = curve.computeFrenetFrames(segments,curve.closed);
    const start = data.positions.length/3;
    const c0 = new T.Color(rootTint), c1 = new T.Color(tipTint), tint = new T.Color();
    const grain = random();
    function vertex(p,n,col,u,t,tone=1) {
      data.positions.push(p.x,p.y,p.z);
      data.normals.push(n.x,n.y,n.z);
      data.colors.push(col.r*tone,col.g*tone,col.b*tone);
      data.uvs.push(u,t);
    }
    for (let i=0;i<=segments;i++) {
      const u=i/segments, center=curve.getPointAt(u);
      const node=nodes.reduce((s,n)=>s+Math.max(0,1-Math.abs((u-n)*length/.036))**2,0);
      const radius=(bulge ? bulge(u) : twigRadius(base,tip,u))*(1+.16*node);
      tint.copy(c0).lerp(c1,.75*u+.18*u*u).multiplyScalar(1-.11*node);
      for (let j=0;j<=sides;j++) {
        const a=tau*j/sides;
        const b=frames.normals[i], c=frames.binormals[i];
        const outward=b.clone().multiplyScalar(Math.cos(a)).addScaledVector(c,.92*Math.sin(a));
        const p=center.clone().addScaledVector(outward,radius);
        const normal=outward.addScaledVector(frames.tangents[i],(base-tip)/length).normalize();
        vertex(p,normal,tint,j/sides+grain,u*length/.38+grain,.97+.03*Math.sin(a*3+u*4));
        if (i===segments||j===sides) continue;
        const k=start+i*(sides+1)+j;
        data.indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
      }
    }
    if (cut) {
      // Pale pith sits slightly inside a bark rim at the diagonal pruning cut.
      const center = curve.getPointAt(0), axis = frames.tangents[0].clone().negate();
      const rings = [1,.78,.23], tones = ['#886b4b','#deb983','#c9a56b'];
      const cap = bindings.positions.length/3;
      const color = new T.Color();
      for (let r=0;r<rings.length;r++) for (let j=0;j<sides;j++) {
        const a=tau*j/sides;
        const p=center.clone().addScaledVector(frames.normals[0],base*rings[r]*Math.cos(a))
          .addScaledVector(frames.binormals[0],.92*base*rings[r]*Math.sin(a));
        color.set(tones[r]); bindings.positions.push(p.x,p.y,p.z); bindings.normals.push(axis.x,axis.y,axis.z);
        bindings.colors.push(color.r,color.g,color.b); bindings.uvs.push(0,0);
        const k=cap+r*sides+j, next=cap+r*sides+(j+1)%sides;
        if(r<rings.length-1) bindings.indices.push(k,k+sides,next,next,k+sides,next+sides);
        else if (j>0&&j<sides-1) bindings.indices.push(cap+r*sides,k+1,k);
      }
    }
  }

  function dough(curve, stations, redPhase, base, tip, pinchDepth) {
    for (const [index,station] of stations.entries()) {
      const u=T.MathUtils.clamp(station+(random()-.5)*.021,.04,.96);
      const tangent=curve.getTangentAt(u);
      // Roll the same portion of rice for the main switches and their fine tips.
      const radius=riceRadius*(.995+.010*random());
      const rose=(index+redPhase)%5<2;
      const palette=rose?beni:ivory;
      morsels.push({center:curve.getPointAt(u),direction:tangent,roll:random()*tau,
        scale:v(radius*(.995+.010*random()),radius*(.995+.010*random()),radius*(.995+.010*random())),
        pinchDepth,
        color:new T.Color(palette[Math.floor(random()*palette.length)]),stemRadius:twigRadius(base,tip,u)});
    }
  }

  function bud(curve,u,side,radius) {
    const base=curve.getPointAt(u), along=curve.getTangentAt(u);
    const outward=v(along.y,-along.x,.28).normalize().multiplyScalar(side);
    // A close-set willow bud emerges from beneath the bark, pressed along it.
    const size=.0028+.16*radius;
    base.addScaledVector(outward,radius*.46);
    const shoulder=base.clone().addScaledVector(outward,radius*.57).addScaledVector(along,size*2.5);
    const tip=shoulder.clone().addScaledVector(outward,size*.54).addScaledVector(along,size*2.9);
    sweep(bark,branch([base,shoulder,tip]),{base:size,tip:.0006,segments:8,sides:7,
      rootTint:'#693e31',tipTint:'#bc8161',bulge:t=>.0006+size*Math.sin(Math.PI*t)**.82});
  }

  // The seven switches leave a single binding at different angles. Tall rear
  // strokes, a near-horizontal outer switch and returning tips break the fan up.
  const switches=[
    // azimuth, reach X/Z, crown height, hanging tip height, arc at crown, return, lean
    [-102,1.33,.39,1.22,.38,.74,.14,-.09], [-76,1.43,.61,1.70,.46,.65,.08,.08],
    [-43,1.03,.67,1.98,1.03,.62,.19,-.08], [-12,1.00,.87,1.49,.55,.74,.14,.20],
    [ 26,1.03,.74,1.79,.83,.54,.09,.10], [ 62,1.34,.62,1.57,.43,.62,.23,-.10],
    [ 97,1.37,.49,1.35,.81,.79,.08,.07],
  ];
  const dyes=[0,3,1,4,2,0,3];
  const barkTints=[
    ['#8a7151','#bc7253'], ['#7d6a4b','#ad604b'], ['#876b4f','#c48358'],
    ['#877555','#a76f52'], ['#8a6751','#b25f4a'], ['#7b674c','#a0634d'], ['#897655','#c07958'],
  ];
  for (let i=0;i<switches.length;i++) {
    const [degrees,width,depth,crown,end,crest,returning,drift]=switches[i];
    const a=degrees*Math.PI/180,lateral=Math.sin(a),rear=Math.cos(a);
    const phi=i*2.39996;
    const butt=v(.036*Math.cos(phi),.17+.065*random(),-.79+.028*Math.sin(phi));
    function fan(r,y,sweepSide=0) {
      return v(butt.x+lateral*width*r+rear*sweepSide,y,butt.z-rear*depth*r+lateral*sweepSide);
    }
    const spine=branch([butt,fan(.012,.47),fan(.095,crown*.49,drift*.20),
      fan(crest*.58,crown-.24,drift*.83),fan(crest,crown,drift),
      fan(.89,crown-(crown-end)*.18,drift*.58),
      fan(1,crown-(crown-end)*.60,drift*.04),
      fan(1-returning,end,drift*-.39)]);
    const radius=.021+random()*.008, tip=.0017;
    const nodes=[.19+random()*.06,.32+random()*.04,.48+random()*.08,.70+random()*.065];
    sweep(bark,spine,{base:radius,tip,segments:74,sides:9,nodes,cut:true,
      rootTint:barkTints[i][0],tipTint:barkTints[i][1]});
    const stations=i%3===0?[.32,.39,.57,.72,.80,.89]:i%3===1?[.36,.51,.61,.66,.79,.87]:[.33,.49,.57,.74,.84];
    dough(spine,stations,dyes[i],radius,tip,.030);
    for (const [j,node] of nodes.entries()) bud(spine,node, (i+j)%2 ? 1 : -1,twigRadius(radius,tip,node));

    // Lateral shoots join the main wood tangentially before peeling away. Some
    // trail almost parallel to their leader; others separate into open space.
    const forkCount=i===2||i===5?3:2;
    for (let j=0;j<forkCount;j++) {
      const u=nodes[j+(forkCount===3?0:1)];
      const root=spine.getPointAt(u), tangent=spine.getTangentAt(u);
      const sign=(j+i)%2 ? -1 : 1;
      const forkWidth=(.17+.19*random())*sign;
      const cross=v(rear*forkWidth,0,lateral*forkWidth);
      const reach=v(lateral*(.14+.22*random()),0,-rear*(.08+.08*random()));
      const lift=(j===0?.24:.12)+.10*random(), drop=.21+.22*random();
      const p=root.clone().addScaledVector(tangent,.105);
      const shoulder=p.clone().addScaledVector(cross,.58).addScaledVector(reach,.58);
      shoulder.y+=lift;
      const outer=p.clone().addScaledVector(cross,.95).addScaledVector(reach,1.16);
      outer.y+=lift*.75;
      const endPoint=outer.clone().addScaledVector(cross,.14).addScaledVector(reach,.09);
      endPoint.y-=drop;
      // Match tangents at the crown so a loaded twig rounds over in one stroke.
      const across=outer.clone().sub(p).multiplyScalar(.26);
      across.y=0;
      const shoot=new T.CurvePath();
      shoot.add(new T.CubicBezierCurve3(root,p,shoulder.clone().sub(across),shoulder));
      shoot.add(new T.CubicBezierCurve3(shoulder,shoulder.clone().add(across),
        endPoint.clone().addScaledVector(across,.12).add(v(0,drop*.76,0)),endPoint));
      const shootRadius=radius*(.42+.16*random()), shootTip=.0013;
      sweep(bark,shoot,{base:shootRadius,tip:shootTip,segments:35,sides:7,
        nodes:[.3,.64],rootTint:barkTints[i][0],tipTint:barkTints[i][1]});
      dough(shoot,j===0?[.31,.56,.77]:[.39,.74],dyes[i]+j+1,shootRadius,shootTip,.016+.012*random());
      bud(shoot,.83,sign,twigRadius(shootRadius,shootTip,.83));
    }
  }

  // The hemp lashing is continuous: two plies twist around each other even
  // as the tie crosses the bundle. The two short ends emerge from one knot.
  function cord(curve,radius,shade) {
    const length=curve.getLength(), n=Math.max(18,Math.ceil(length/.009));
    const frames=curve.computeFrenetFrames(n,false), twist=Math.max(2,Math.round(length/.040));
    for (let ply=0;ply<2;ply++) {
      const points=[];
      for (let i=0;i<=n;i++) {
        const u=i/n, a=tau*twist*u+Math.PI*ply;
        points.push(curve.getPointAt(u).addScaledVector(frames.normals[i],radius*.36*Math.cos(a))
          .addScaledVector(frames.binormals[i],radius*.36*Math.sin(a)));
      }
      sweep(bindings,branch(points),{base:radius*.68,tip:radius*.68,segments:n,sides:radius>=.010?5:4,
        rootTint:shade[ply],tipTint:shade[ply]});
    }
  }
  const straw=['#b58a5b','#d4b383'], red=['#a14f45','#be7260'];
  for(const s of [-1,1]) {
    cord(branch([v(s*.31,.422,-.70),v(s*.20,.395,-.764),
      v(s*.088,.345,-.814),v(-s*.044,.347,-.853)]),.009,red);
    cord(branch([v(s*.30,.427,-.70),v(s*.18,.447,-.770),
      v(s*.064,.475,-.824),v(-s*.036,.464,-.849)]),.009,straw);
  }
  for(const y of [.327,.448]) {
    const turns=[];
    for(let i=0;i<=39;i++) {
      const a=tau*i/13;
      turns.push(v(.065*Math.cos(a), y+.0009*i+.0025*Math.cos(a),-.790+.053*Math.sin(a)));
    }
    cord(branch(turns),.008,straw);
  }
  cord(branch([v(.019,.461,-.839),v(.038,.468,-.850),v(.035,.451,-.855),
    v(.061,.430,-.858),v(.067,.400,-.846)]),.010,red);
  batch(bouquet,bark,barkMaterial(),'柳枝と芽の節');
  batch(bouquet,bindings,new T.MeshStandardMaterial({vertexColors:true,roughness:.9}),'切り口と麻の背負い紐');
  addMochibanaRice(bouquet,morsels);
  return bouquet;
}
