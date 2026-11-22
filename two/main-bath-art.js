import * as T from './vendor/three.module.min.js';
import { RETREATS } from './retreat-layout.js';
import { SNOW_SPRING,terrainHeight,terrainMeshHeight,wrapDelta } from './terrain.js';
import { scrollPigment } from './kyo-scrollwork.js';
import { sculpture } from './pilgrimage-pigment.js';
import { createVillageWorkshops } from './village-bath-workshops.js';
import { createPilgrimBathhouses } from './pilgrim-bathhouses.js';
import { villageBathArt } from './main-bath-village-art.js';
import { pilgrimageBathArt } from './main-bath-pilgrimage-art.js';
import { tableauFooting } from './main-bath-rims.js';

const village=new Set(['sakura','bamboo','earthen','sulfur','paddy','shore','maple','susuki']);
// Separate foundation stones follow the load-bearing parts of each carving.
// On the torii path each post has its own shoe, leaving the gaps between gates open.
// Per stone: centre X/Z, half-width/depth and the bedding height in sculpture metres.
const gateShoes=[];
for(let j=0;j<3;j++){
  const scale=1-j*.232, angle=-.17+j*.29;
  for(const side of [-1,1]){
    const spread=side*.505*scale;
    gateShoes.push([-.816+.16*j*j+spread*Math.cos(angle),.13-j*.291-spread*Math.sin(angle),
      .173*scale,.173*scale,.033*scale]);
  }
}
const foundationStones={
  capital:[[-.79,-.17,.48,.41,.087],[.26,.211,1.085,.51,.095]],
  inari:[...gateShoes,[.79,-.03,.69,.48,.026]],
  sulfur:[[-.32,-.08,1.24,.63,.024],[.93,-.045,.43,.33,.027]],
  paddy:[[-.42,.323,.41,.14,.018],[-.42,-.373,.41,.14,.021],[.85,.07,.49,.31,.024]],
  dawn:[[-.10,-.22,.64,.246,.02],[1,.34,.41,.32,.024]],
  peach:[[-1.21,-.37,.19,.18,.025],[.20,-.074,.36,.35,.085],[1.04,.27,.25,.22,.088]],
  temple:[[-.263,-.075,.48,.48,.024],[1.026,.10,.405,.35,.158]],
  sakai:[[.866,.207,.33,.25,.087]],
};
function bedStone(art,footing,[cx,cz,w,d,top]){
  const c=Math.cos(footing.yaw),k=Math.sin(footing.yaw),scale=footing.scale;
  const ground=(x,z)=>(terrainMeshHeight(footing.x+scale*(x*c+z*k),
    footing.z+scale*(z*c-x*k))-footing.ground)/scale;
  const edges=[],n=48;
  // A chipped, softly squared perimeter. The bottom follows the rendered
  // terrain triangles, including the short descent on the water-facing side.
  for(let i=0;i<n;i++){
    const a=i*2*Math.PI/n,co=Math.cos(a),si=Math.sin(a);
    const chip=1+.014*Math.sin(a*5+.8)+.012*Math.cos(a*9-cx);
    const x=w*chip*Math.sign(co)*Math.abs(co)**.73,z=d*chip*Math.sign(si)*Math.abs(si)**.73;
    edges.push({x,z,earth:ground(cx+x,cz+z)});
  }
  if(Math.min(ground(cx,cz),...edges.map(p=>p.earth))>top-.032)return;
  const rock=new T.Color('#757466'),cut=new T.Color('#aea58d');
  const positions=[],colors=[],indices=[];
  // The strata close against the underside of the prop. A small buried toe
  // keeps daylight out along a sloping mesh edge between surveyed points.
  for(const [i,p] of edges.entries()){
    const mottling=.041*Math.sin(i*1.09)+.03*Math.sin(i*.53+cz);
    const base=Math.min(top-.05,p.earth-.085);
    for(const [r,y,light] of [[.99,base,.16],[1.018,top-.040,.30],[1.015,top-.021,.54],
      [.969,top-.007,.77],[.86,top,.68]]){
      positions.push(cx+p.x*r,y,cz+p.z*r);
      const stain=rock.clone().lerp(cut,light+mottling);colors.push(stain.r,stain.g,stain.b);
    }
    const a=i*5,b=(i+1)%n*5;
    for(let j=0;j<4;j++)indices.push(a+j,a+j+1,b+j,b+j,a+j+1,b+j+1);
    indices.push(a+4,n*5,b+4);
  }
  positions.push(cx,top,cz);const crown=rock.lerp(cut,.65);colors.push(crown.r,crown.g,crown.b);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();art.add(g,'#fff');
}
export function bankSculpture(kind,footing){
  const art=sculpture();
  if(footing)for(const stone of foundationStones[kind]||[])bedStone(art,footing,stone);
  if(village.has(kind)) villageBathArt(art,kind);
  else pilgrimageBathArt(art,kind);
  return art.finish();
}

// Each handscroll scene is a single coloured mesh. Build only the ones on
// the traveller's route and reuse them on return visits and across map wraps.
export function createBathTableaux(scene){
  const sites=[...RETREATS.filter(s=>s.rank==='main'),SNOW_SPRING];
  const exhibits=sites.map(s=>({...tableauFooting(s,terrainHeight),kind:s.kind,name:s.name,mesh:null}));
  const updateVillages=createVillageWorkshops(scene),updatePilgrimage=createPilgrimBathhouses(scene);
  return player=>{
    updateVillages(player);updatePilgrimage(player);
    for(const e of exhibits){
      const dx=wrapDelta(e.x-player.x),dz=wrapDelta(e.z-player.z);
      if(dx*dx+dz*dz>110**2){if(e.mesh)e.mesh.visible=false;continue;}
      if(!e.mesh){
        e.mesh=new T.Mesh(bankSculpture(e.kind,e),scrollPigment());
        e.mesh.castShadow=e.mesh.receiveShadow=true;e.mesh.rotation.y=e.yaw;
        e.mesh.name=e.name;
        e.mesh.scale.setScalar(e.scale);
        scene.add(e.mesh);
      }
      e.mesh.position.set(player.x+dx,e.ground,player.z+dz);
      e.mesh.visible=true;
    }
  };
}
