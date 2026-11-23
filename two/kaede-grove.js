import * as THREE from './vendor/three.module.min.js';
import { REGIONS, ROADS, TREES, regionAt, seasonAt, hasAutumnLeaves, treeGround,
  seeded, terrainContactHeight, waterSurfaceAt, nearRoad } from './terrain.js';
import { MAPLE_BRIDGE, mapleDeckHeight } from './maple-crossing.js';
import { reservedScenery } from './retreat-layout.js';
import { autumnLeafGeometry, autumnLeafMaterial, autumnLeafPigments } from './autumn-leaf-art.js';
import { groundWindrows } from './kaede-ground-drifts.js';

const tau = 2*Math.PI;
const {sin,cos,hypot} = Math;
const shapes = {maple:'fallenMaple', ginkgo:'fallenGinkgo'};
const district = REGIONS.find(r=>r.id==='autumn');
const climate = {};
export const kaedeTrees = new Set(TREES.filter(t=>
  (t.kind==='maple' || t.kind==='ginkgo') && hasAutumnLeaves(t) &&
  seasonAt(t.x,t.z,climate).autumn>.06 && REGIONS[regionAt(t.x,t.z)]===district));

function pigment(tree,rng,weathered=false,kind=tree.kind) {
  const gold = kind==='ginkgo' || (kind===tree.kind && tree.form===undefined && tree.seed%4===1);
  if (weathered && rng()<.15) return gold?'#c08e37':'#a14832';
  const palette = autumnLeafPigments[gold?'ginkgo':'maple'];
  return palette[Math.floor(rng()*palette.length)];
}

// Rotate in the tangent plane. The stalk can point in any direction while the
// folded blade stays against both transverse and longitudinal grades.
function stampGroundLeaf(p,kind,x,y,z,width,yaw,slopeX,slopeZ,color) {
  const pitch=-Math.atan(slopeX*sin(yaw)+slopeZ*cos(yaw));
  const roll=Math.asin((slopeX*cos(yaw)-slopeZ*sin(yaw))/hypot(1,slopeX,slopeZ));
  p.part(shapes[kind],x,y,z,width,width,width,color,yaw,pitch,roll,autumnLeafMaterial(),false,40);
}

function scatterBridgeLeaves(p) {
  const rng=seeded(172824),bridge=MAPLE_BRIDGE;
  // Sheltered seams beside the rail catch little pockets of leaves; feet
  // and wind carry a few from each pocket across the worn boards.
  for(let pocket=0;pocket<23;pocket++) {
    const side=rng()<.62?1:-1;
    const centre=bridge.z+(rng()-.5)*(bridge.length+1.5);
    const count=3+Math.floor(9*rng()),gold=rng()*.63;
    for(let i=0;i<count;i++) {
      const z=centre+(rng()-rng())*1.35;
      const along=Math.abs(z-bridge.z)-bridge.length*.5;
      if(along>.86)continue;
      const x=bridge.x+side*(bridge.halfWidth-.31-rng()**2*1.9);
      const slope=along>0?0:(mapleDeckHeight(z+.10)-mapleDeckHeight(z-.10))/.20;
      const y=mapleDeckHeight(z)+(along>0?-.006:.009)+rng()*.004;
      const kind=rng()<gold?'ginkgo':'maple',washes=autumnLeafPigments[kind];
      stampGroundLeaf(p,kind,x,y,z,.16+.12*rng(),rng()*tau,0,slope,washes[Math.floor(rng()*washes.length)]);
    }
  }
}

export function* prepareKaedeGround(p,paths=[]) {
  for(const [kind,name] of Object.entries(shapes)) {
    p.shapes[name]=autumnLeafGeometry(kind);
    p.shapes[name].userData.range=48;
  }
  const windrows=groundWindrows(p);
  scatterBridgeLeaves(p);
  const ray=new THREE.Raycaster(),hits=[];
  ray.ray.direction.set(0,-1,0);
  function settle(tree,x,z,rng,thickness=0,mix=.16) {
    if (reservedScenery(x,z) || Math.abs(x-MAPLE_BRIDGE.x)<MAPLE_BRIDGE.halfWidth+.18 &&
        Math.abs(z-MAPLE_BRIDGE.z)<MAPLE_BRIDGE.length*.5+1.12) return;
    let y=terrainContactHeight(x,z);
    if (y<waterSurfaceAt(x,z)+.09) return;
    const half=.11;
    let clearance=.013;
    let sx=(terrainContactHeight(x+half,z)-terrainContactHeight(x-half,z))/(2*half);
    let sz=(terrainContactHeight(x,z+half)-terrainContactHeight(x,z-half))/(2*half);
    // The path is an independently triangulated ribbon, raised above the
    // survey. Use its rendered face wherever it covers the leaf's centre.
    if(hypot(x-district.x,z-district.z)<55 && nearRoad(x,z,1.1)){
      ray.ray.origin.set(x,100,z); hits.length=0;
      ray.intersectObjects(paths,false,hits);
      const face=hits[0];
      if(face && face.point.y>y){
        const n=face.face.normal;
        y=face.point.y;sx=-n.x/n.y;sz=-n.z/n.y;clearance=.007;
      }
    } else if(nearRoad(x,z,.20))return;
    if (sx*sx+sz*sz>2.25) return;
    const width=.17+.18*rng();
    // A few fans come to rest among the maple fingers, and red leaves cut
    // through the gold. The majority still belongs to the overhanging tree.
    const mixed=rng()<mix,kind=mixed?(tree.kind==='ginkgo'?'maple':'ginkgo'):tree.kind;
    stampGroundLeaf(p,kind,x,y+clearance+thickness*rng(),z,width,rng()*tau,sx,sz,pigment(tree,rng,true,kind));
  }
  for (const tree of kaedeTrees) {
    const rng=seeded(tree.seed+91263);
    const centre=Math.max(0,1-hypot(tree.x-district.x,tree.z-district.z)/90);
    // Loose individual blades beneath the boughs. Two lee-side banks of
    // overlapping leaves catch against the roots and stretch downwind.
    const sparse=11+Math.floor(centre*20);
    for(let i=0;i<sparse;i++) {
      const a=rng()*tau,r=(.13+.68*Math.sqrt(rng()))*tree.h;
      settle(tree,tree.x+cos(a)*r+.75,tree.z+sin(a)*r,rng);
    }
    for(let pile=0;pile<2;pile++) {
      const a=rng()*tau, r=(.16+.32*rng())*tree.h;
      const x=tree.x+cos(a)*r+.8, z=tree.z+sin(a)*r;
      const bearing=a*.3+.5, length=1.0+tree.h*.15;
      // The flat layer carries the mass of the drift. Curled leaves on top
      // break its silhouette at the traveller's feet.
      windrows.stamp(tree.kind,x,z,length*(1.43+centre*.65),length*(.80+.63*cos(a+pile)**2),bearing+pile*Math.PI);
      const count=6+Math.floor(centre*12);
      for(let i=0;i<count;i++) {
        const u=(rng()-rng())*length,v=(rng()-rng())*.81;
        settle(tree,x+u*cos(bearing)-v*sin(bearing),z+u*sin(bearing)+v*cos(bearing),rng,.014);
      }
    }
    yield;
  }
  // Where the two paths converge below the bridge, eddies of wind comb
  // the fallen leaves along the road margins, broken by stretches of soil.
  const rng=seeded(192200),nearby=[...kaedeTrees].filter(t=>hypot(t.x-district.x,t.z-district.z)<57);
  for(const road of ROADS) for(let i=3;i<road.points.length-3;i+=3) {
    const [x,z]=road.points[i];
    if ((x-district.x)**2+(z-district.z)**2>46**2) continue;
    yield;
    const before=road.points[i-1],after=road.points[i+1];
    const dx=after[0]-before[0],dz=after[1]-before[1],len=hypot(dx,dz);
    if(len<.001) continue;
    for(const hand of [-1,1]) {
      if(rng()<.26) continue;
      const offset=hand*(road.width*.5+.16+.76*rng());
      const px=x+dz/len*offset,pz=z-dx/len*offset;
      let source=null,nearest=17**2;
      for(const t of nearby) {
        const d2=(px-t.x)**2+(pz-t.z)**2;
        if(d2<nearest){source=t;nearest=d2;}
      }
      if(!source)continue;
      const outward=hand*1.16;
      windrows.stamp(source.kind,px+dz/len*outward,pz-dx/len*outward,5.1,1.95,Math.atan2(dz,dx));
      for(let j=0;j<24;j++){
        const along=(rng()-rng())*3.1,across=(rng()-rng())*1.18;
        settle(source,px+(along*dx+across*dz)/len,pz+(along*dz-across*dx)/len,rng,.012);
      }
    }
  }
  // Leaves blow off both banks and collect where the path turns onto the
  // bridge. Unequal streaks wind across the footway, with bare earth between.
  for(const [x,z,angle,span,count,mix] of [
    [285.2,-114.8,-.62,2.4,32,.47],[288.3,-116.4,.24,2.0,39,.32],
    [290.9,-114.9,-.67,1.6,24,.19],[294.5,-116.6,-.28,2.3,36,.51],
    [290.1,-144.8,.30,1.8,34,.28],[293.6,-145.8,-.89,2.2,36,.50],
  ]){
    let source=nearby[0];
    for(const tree of nearby)if(hypot(tree.x-x,tree.z-z)<hypot(source.x-x,source.z-z))source=tree;
    for(let i=0;i<count;i++){
      const along=(rng()-rng())*span,across=(rng()-rng())*(.35+.48*rng());
      settle(source,x+along*cos(angle)-across*sin(angle),z+along*sin(angle)+across*cos(angle),rng,.014,mix);
    }
  }
  // Sheltered hollows around the big maple, then broken crescents between
  // the bridge lanterns and the outside edges of the two approach paths.
  for(const [x,z,length,width,bearing] of [
    [278.6,-119.3,5.3,3.6,.66], [280.9,-117.9,3.6,2.8,-.33],
    [284.2,-117.4,4.6,2.8,.46], [287.3,-118.7,3.5,2.6,-.65],
    [294.6,-115.9,4.0,2.9,-.44], [297.5,-116.7,4.2,3.9,.72],
    [288.6,-144.2,4.3,2.7,.78], [295.4,-143.3,4.8,3.5,-.57],
  ]) windrows.stamp('maple',x,z,length,width,bearing);
  windrows.finish();
}

// The painters fill these with actual spray centres. Forest forms are drawn
// in normalised tree coordinates; individually inked landmark trees use metres.
export function kaedeBoughs() {
  return new Map([...kaedeTrees].map(t=>[t.form??t,[]]));
}

const LEAVES_PER_CROWN=10, MAX_CROWNS=20, REACH=47;
export function createKaedeLeafFall(scene,boughs) {
  const meshes={},dummy=new THREE.Object3D(),color=new THREE.Color();
  for(const kind of Object.keys(shapes)) {
    const mesh=new THREE.InstancedMesh(autumnLeafGeometry(kind),autumnLeafMaterial(),LEAVES_PER_CROWN*MAX_CROWNS);
    mesh.name=kind==='maple'?'楓峡・舞い楓':'楓峡・舞い銀杏';
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0,color); mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled=false; mesh.visible=false; mesh.receiveShadow=true; mesh.count=0;
    scene.add(mesh);meshes[kind]=mesh;
  }
  const batches=Object.values(meshes),flights=new WeakMap();
  function crownFlights(tree) {
    if(flights.has(tree))return flights.get(tree);
    const rng=seeded(tree.seed^0x523dd), origins=boughs.get(tree.form??tree);
    const slots=[];
    if(origins?.length) for(let i=0;i<LEAVES_PER_CROWN;i++){
      const b=origins[Math.floor(rng()*origins.length)];
      let x=b.x,y=b.y,z=b.z;
      if(tree.form!==undefined) {
        const a=tree.seed*2.39996323;
        x=tree.x+(b.x*cos(a)+b.z*sin(a))*tree.h;
        y=treeGround(tree)+b.y*tree.h;
        z=tree.z+(b.z*cos(a)-b.x*sin(a))*tree.h;
      }
      const dx=1.05+2.85*rng(),dz=(rng()-.47)*2.0;
      const end=Math.max(terrainContactHeight(x+dx,z+dz),waterSurfaceAt(x+dx,z+dz))+.035;
      if(y-end<.6)continue;
      slots.push({x,y,z,dx,dz,end,angle:rng()*tau,arc:.28+.42*rng(),turns:1.25+1.15*rng(),
        phase:rng(),period:Math.max(2.9,(y-end)/(.75+.56*rng()))+.6+rng(),
        size:.17+rng()*.14,tint:new THREE.Color(pigment(tree,rng))});
    }
    flights.set(tree,slots);
    return slots;
  }
  let near=[],lastX=Infinity,lastZ=Infinity,radius=REACH;
  return (time,player)=>{
    if((player.x-lastX)**2+(player.z-lastZ)**2>3**2) {
      lastX=player.x;lastZ=player.z;
      near=[];
      if(Math.abs(lastX-district.x)<175 && Math.abs(lastZ-district.z)<200) {
        for(const tree of kaedeTrees) {
          const distance=hypot(tree.x-lastX,tree.z-lastZ);
          if(distance<REACH+3)near.push({tree,distance});
        }
        near.sort((a,b)=>a.distance-b.distance);
      }
      radius=Math.min(REACH,near[MAX_CROWNS]?.distance??REACH);
      near.length=Math.min(near.length,MAX_CROWNS);
    }
    for(const mesh of batches)mesh.count=0;
    for(const {tree} of near){
      const distance=hypot(tree.x-player.x,tree.z-player.z);
      const visibility=1-THREE.MathUtils.smoothstep(distance,radius-10,radius);
      if(visibility<=0)continue;
      const mesh=meshes[tree.kind];
      for(const leaf of crownFlights(tree)) {
        const age=(time/leaf.period+leaf.phase)%1;
        const progress=Math.min(1,age/.96);
        const flutter=leaf.angle+progress*tau*leaf.turns;
        const envelope=sin(Math.PI*progress);
        const glide=progress+.032*envelope*sin(flutter*2);
        const wave=leaf.arc*envelope;
        dummy.position.set(leaf.x+leaf.dx*progress+wave*sin(flutter),
          leaf.y+(leaf.end-leaf.y)*glide,
          leaf.z+leaf.dz*progress+wave*cos(flutter*.88));
        dummy.rotation.set(.19+.81*sin(flutter*1.36)*envelope,
          leaf.angle+progress*4.0+.63*sin(flutter),.15+1.03*cos(flutter*.94)*envelope,'YXZ');
        const appear=THREE.MathUtils.smoothstep(age,0,.038)*(1-THREE.MathUtils.smoothstep(age,.94,1));
        dummy.scale.setScalar(leaf.size*appear*visibility);
        dummy.updateMatrix();
        mesh.setColorAt(mesh.count,leaf.tint);mesh.setMatrixAt(mesh.count++,dummy.matrix);
      }
    }
    for(const mesh of batches){
      mesh.visible=mesh.count>0;
      if(!mesh.visible)continue;
      for(const attr of [mesh.instanceMatrix,mesh.instanceColor]) {
        attr.clearUpdateRanges();attr.addUpdateRange(0,attr.itemSize*mesh.count);attr.needsUpdate=true;
      }
    }
  };
}
