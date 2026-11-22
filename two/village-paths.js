// Plan the whole trip before an animal sets out. A traveller can be streamed
// out or restored at any point on the circuit without jumping across a trunk.
import { BUILDINGS, BRIDGES, GATES, MARKET_STALLS, REGIONS, TREES, SHRINE_BAMBOO, regionAt, solidHeightAt, terrainHeight, waterDepth, groundHeight, nearRoad } from './terrain.js';
import { buildingCraft, roomPlan } from './architecture.js';
import { POUNDING } from './festival.js';
import { CHAYA_SITES, WAYSIDE_HUTS } from './wayside-hut-layout.js';
import { SEAPORTS } from './seaport-layout.js';
import { sitePoint } from './retreat-layout.js';
import { predatorRange, patrolAt } from './predator-trails.js';

const tau=Math.PI*2, stepSize=16;
const cellKey=(x,z)=>Math.floor(x/stepSize)*128+Math.floor(z/stepSize);
const fixtures=new Map(), crowns=new Map();
function indexDisc(index,x,z,radius,top=0) {
  const disc={x,z,radius,top}, reach=radius+6.8;
  for(let i=Math.floor((x-reach)/stepSize);i<=Math.floor((x+reach)/stepSize);i++)
    for(let j=Math.floor((z-reach)/stepSize);j<=Math.floor((z+reach)/stepSize);j++) {
      const key=i*128+j;
      if(!index.has(key)) index.set(key,[]);
      index.get(key).push(disc);
    }
}
for(const tree of TREES) {
  const {x,z,h,kind,form}=tree;
  // Hand-painted trunks bend at shin height. Bamboo grows as a clump
  // of offset culms. The generated trees include leaning and forked forms.
  const bamboo=kind==='bamboo' || kind==='moso';
  const trunk=form===undefined ? bamboo?1.74:h*(tree===TREES[0]?.145:.102)
    : bamboo?h*.14:h*(form%4===1 || form%4===3 ? .124 : .087);
  indexDisc(fixtures,x,z,trunk);
  const crown=(kind==='cedar'?.36:bamboo?.37:.56)*h;
  indexDisc(crowns,x,z,crown,terrainHeight(x,z)+h);
}
for(const t of SHRINE_BAMBOO) {
  indexDisc(crowns,t.x+t.sx,t.z+t.sz,1.5,terrainHeight(t.x,t.z)+t.height);
}
for(const g of GATES) for(const side of [-1,1]) indexDisc(fixtures,g.x+side*g.w*.57,g.z+1.6,.54);
for(const b of BRIDGES) for(const side of [-1,1]) indexDisc(fixtures,b.x+side*(b.halfWidth+.94),b.z+b.length*.5+.48,.49);
for(const [x,z] of MARKET_STALLS) indexDisc(fixtures,x,z,2.0);
indexDisc(fixtures,POUNDING.x,POUNDING.z,2.2);

export function canopyHeight(x,z,pad) {
  let top=-Infinity;
  for(const tree of crowns.get(cellKey(x,z))||[]) {
    const d=Math.hypot(x-tree.x,z-tree.z)-pad;
    if(d<tree.radius) top=Math.max(top,tree.top-Math.max(d,0)*.44);
  }
  return top;
}
function registerVillageObjects(objects) {
  for(const o of objects) {
    if(o.grand) continue;
    indexDisc(fixtures,o.x,o.z,o.type==='onsen'?2.65:o.type==='tsukimi'?1.55:o.type==='port'?1.42:.61);
  }
}
// A turning animal sweeps its entire silhouette, including muzzle or tail.
// Padding each route sample by half its spacing covers the connecting arc.
// Measured in each rig's local metres over its walking and resting actions.
const footprints={rabbit:1.22,frog:.84,monkey:.68,fox:1.49,tiger:1.70,deer:2.14,boar:1.29,shishi:2.20,turtle:1.65,elephant:1.90,baku:1.25,ox:1.52,chicken:.66};
export function animalRadius(n) {
  let radius=footprints[n.type] || .84;
  if(n.area) radius=n.role==='fisher' ? 1.72 : Math.max(radius,1.12);
  else if(n.type==='frog' && n.role==='wander') radius=1.46;
  return radius*(n.stature||1)*Math.max(1,n.build||1);
}
export function openGround(x,z,pad) {
  for(const prop of fixtures.get(cellKey(x,z))||[]) {
    if((x-prop.x)**2+(z-prop.z)**2<(prop.radius+pad)**2) return false;
  }
  // Using the bare earth rejects the top of a rock or a stall as a spawn.
  const earth=terrainHeight(x,z);
  return waterDepth(x,z)<=.065 && solidHeightAt(x,z,pad)<=earth+.16;
}

export function walkCircuit(n,angle,out) {
  if(n.trail) return patrolAt(n.trail,n.homeX,n.homeZ,angle,out);
  const r=n.radius;
  out.x=n.homeX+r*(Math.sin(angle)-Math.sin(n.phase));
  out.z=n.homeZ+r*.66*(Math.cos(angle)-Math.cos(n.phase));
  return out;
}
function routeFits(x,z,r,phase,clearance,feeding=false) {
  const cx=x-r*Math.sin(phase),cz=z-r*.66*Math.cos(phase);
  if(feeding && nearRoad(cx,cz,clearance+r+1))return false;
  const samples=Math.max(8,Math.ceil(tau*r/.52));
  const pad=clearance+Math.PI*r/samples;
  for(let j=0;j<samples;j++) {
    const a=tau*j/samples;
    const tx=x+r*(Math.sin(a)-Math.sin(phase)),tz=z+r*.66*(Math.cos(a)-Math.cos(phase));
    if(!openGround(tx,tz,pad)) return false;
    if(feeding) {
      const dx=terrainHeight(tx+1,tz)-terrainHeight(tx-1,tz);
      const dz=terrainHeight(tx,tz+1)-terrainHeight(tx,tz-1);
      if(Math.hypot(dx,dz)>1.14)return false;
    }
  }
  return true;
}
const workshops={
  ink:['scribe','scribe'], tea:['tea','tea'], lodge:['tea','tea'], brew:['tea','ladle'],
  dye:['scribe','loom'], rice:['rake','winnow'], net:['fisher','mend']
};
function seatWorkers(npcs) {
  for(const [i,b] of BUILDINGS.entries()) {
    const style=workshops[buildingCraft(b)];
    if(!style) continue;
    const workers=npcs.filter(n=>n.area===REGIONS[regionAt(b.x,b.z)].id && n.room===undefined);
    const preference=n=>(n.role===style[0]?0:1000)+Math.hypot(n.x-b.x,n.z-b.z);
    workers.sort((a,c)=>preference(a)-preference(c));
    if (!workers.length) continue;
    const n=workers[0], plan=roomPlan(b), bench=plan.workbench;
    // The working paw is on the doorway side, above the near vat,
    // writing paper or net frame. This leaves the demonstration in profile.
    const targetV=({ink:.03,net:0,rice:.20,dye:.19,brew:.19,tea:.26,lodge:.26})[plan.craft];
    const u=bench.u-bench.width*.5-.38*n.stature;
    const pawOffset=plan.craft==='brew'||plan.craft==='dye' ? .45 : .30;
    const v=bench.v+bench.depth*targetV-pawOffset*n.stature;
    n.x=n.homeX=b.x+b.cos*u+b.sin*v; n.z=n.homeZ=b.z-b.sin*u+b.cos*v;
    n.y=b.y+plan.floor+.006;
    n.heading=n.facing=b.yaw+Math.PI*.45;
    n.craft=style[1];n.room=i;
  }
}
// Small scenes on the longer walks use the same working animals, clothes,
// tools and delivery entries as the ten original village processions.
function seatWaysideTravellers(npcs) {
  const workers=npcs.filter(n=>n.area && n.room===undefined);
  const scenes=[
    ...CHAYA_SITES.map((site,i)=>({site,u:-6,v:3,roles:i%2?['flute','fan']:['tea','flowers']})),
    ...WAYSIDE_HUTS.filter(s=>s.kind==='fisher').map(site=>({site,u:6.7,v:3.6,roles:['fisher','scribe']})),
    ...SEAPORTS.map(site=>({site,u:46,v:-5,roles:['fisher','scribe','lantern']})),
  ];
  for(const {site,u,v,roles} of scenes) {
    const cast=[];
    for(const [i,role] of roles.entries()) {
      const [du,dv]=[[0,0],[3.8,.7],[1.4,3.1]][i];
      const [x,z]=sitePoint(site,u+du,v+dv);
      let best=-1,gap=Infinity;
      for(const [index,n] of workers.entries()) {
        if(n.role!==role)continue;
        const distance=Math.hypot(n.x-x,n.z-z);
        if(distance<gap){gap=distance;best=index;}
      }
      if(best<0)continue;
      const [n]=workers.splice(best,1);
      n.x=n.homeX=x;n.z=n.homeZ=z;
      n.area=n.habitat=REGIONS[regionAt(x,z)].id;
      cast.push(n);
    }
    for(const [i,n] of cast.entries()) {
      const partner=cast[i===0?1:0];
      n.facing=n.heading=n.role==='fisher'?site.yaw:partner?Math.atan2(partner.x-n.x,partner.z-n.z):site.yaw;
    }
  }
}
function findSite(n,accept,wild=false) {
  const originX=n.homeX,originZ=n.homeZ;
  for(let i=0;i<(wild?3800:800);i++) {
    const angle=i*2.39996323+n.phase;
    const distance=i<800 ? .85*Math.sqrt(i) : Math.sqrt(24**2+(i-800)*7);
    const x=originX+Math.cos(angle)*distance,z=originZ+Math.sin(angle)*distance;
    if(!accept(x,z)) continue;
    n.x=n.homeX=x;n.z=n.homeZ=z;n.y=groundHeight(x,z);
    return;
  }
  throw new Error('No clear village site for '+n.id);
}
function settlePredator(n, workers, objects) {
  const trail=predatorRange(n), pad=animalRadius(n);
  // Cover the whole animal at the outside of the bend. A clear centre alone
  // would allow the flank or tail to swing out onto a road.
  const reach=trail.radius*1.15+pad;
  const sampleCount=Math.ceil(tau*trail.radius*1.35/.48);
  const point={}, clearance=pad+.24;
  n.homeX=trail.x; n.homeZ=trail.z;
  findSite(n,(x,z)=>{
    if(n.type==='tiger' && REGIONS[regionAt(x,z)].id!==n.habitat)return false;
    if(nearRoad(x,z,24+reach))return false;
    if(BUILDINGS.some(b=>Math.hypot(x-b.x,z-b.z)<47+reach+.72*Math.hypot(b.w,b.d)))return false;
    if(REGIONS.some(r=>Math.hypot(x-r.x,z-r.z)<59+reach))return false;
    if(GATES.some(g=>Math.hypot(x-g.x,z-g.z)<43+reach+g.w*.63))return false;
    if(objects.some(o=>Math.hypot(x-o.x,z-o.z)<50+reach) ||
       workers.some(w=>Math.hypot(x-w.homeX,z-w.homeZ)<31+reach))return false;
    for(let i=0;i<sampleCount;i++){
      patrolAt(trail,x,z,tau*i/sampleCount,point);
      const {x:px,z:pz}=point;
      if(!openGround(px,pz,clearance) ||
        Math.abs(terrainHeight(px+1,pz)-terrainHeight(px-1,pz))>1.22 ||
        Math.abs(terrainHeight(px,pz+1)-terrainHeight(px,pz-1))>1.22)return false;
    }
    return true;
  },true);
  n.trail=trail;
  n.radius=trail.radius;
  n.cruise=(n.type==='shishi'?.89:1.18)/n.radius;
  n.habitat=REGIONS[regionAt(n.homeX,n.homeZ)].id;
}
let villagePlan;
export function prepareVillageRoutes(npcs,objects) {
  if(villagePlan) {
    for(const n of npcs) Object.assign(n,villagePlan.get(n.id));
    return;
  }
  registerVillageObjects(objects);
  seatWorkers(npcs);
  seatWaysideTravellers(npcs);
  const workers=npcs.filter(n=>n.area);
  const occupied=[];
  for(const n of npcs) {
    if(n.room!==undefined || n.atMortar || ['bird','dragon','kirin'].includes(n.type)) continue;
    if(n.type==='tiger' || n.type==='shishi') {
      settlePredator(n,workers,objects);
      continue;
    }
    const pad=animalRadius(n);
    if(n.area) {
      const sweep=pad+.46;
      findSite(n,(x,z)=>openGround(x,z,sweep) && !nearRoad(x,z,1.9) &&
        objects.every(o=>(o.x-x)**2+(o.z-z)**2>=5.6**2) &&
        occupied.every(o=>Math.hypot(o.x-x,o.z-z)>=o.pad+sweep));
      occupied.push({x:n.x,z:n.z,pad:sweep});
    } else if(n.role==='sumo' || n.type==='turtle') {
      // The two wrestlers share a ring, and the turtle follows its own
      // shelter route, with clearance checked on each subsequent step.
      if(!openGround(n.x,n.z,pad)) findSite(n,(x,z)=>openGround(x,z,pad+.05));
    } else {
      n.radius??=n.role==='porter'?2.5:3.4;
      const feeding=n.role==='roam';
      const reach=pad+n.radius;
      const offsetX=n.radius*Math.sin(n.phase), offsetZ=n.radius*.66*Math.cos(n.phase);
      findSite(n,(x,z)=>{
        if(feeding && occupied.some(o=>(o.x-x+offsetX)**2+(o.z-z+offsetZ)**2<(o.pad+reach)**2))return false;
        return routeFits(x,z,n.radius,n.phase,pad,feeding);
      },feeding);
      if(feeding) {
        n.habitat=REGIONS[regionAt(n.x,n.z)].id;
        occupied.push({x:n.x-offsetX,z:n.z-offsetZ,pad:reach});
      }
    }
  }
  // The flautist plays towards a drummer or fan dancer, and the server
  // presents the tray to a neighbour. Keep their working circle off the road.
  const performers=npcs.filter(n=>n.area && n.room===undefined);
  for(const n of performers) {
    const companions={flute:['drum','fan'],drum:['fan','flute'],fan:['flute','drum'],tea:['scribe','flowers']};
    const roles=companions[n.role];
    if(!roles) continue;
    let best=10**2, partner;
    for(const other of performers) {
      const d=(other.x-n.x)**2+(other.z-n.z)**2;
      if(roles.includes(other.role) && d<best) {partner=other;best=d;}
    }
    if(partner) n.heading=n.facing=Math.atan2(partner.x-n.x,partner.z-n.z);
  }
  // Only immutable starting positions and tool assignments are shared.
  villagePlan=new Map(npcs.map(n=>[n.id,Object.fromEntries(
    ['x','z','y','homeX','homeZ','radius','heading','facing','room','craft','area','habitat','trail','cruise'].filter(k=>k in n).map(k=>[k,n[k]]))]));
}
