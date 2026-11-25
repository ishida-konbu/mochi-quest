import { BOUND, REGIONS, TIMBER_TREES, timberWood, BUILDINGS, nearRoad, terrainContactHeight, waterSurfaceAt, staticVolumeAt, terrainMeshHeight, treeGround, regionAt, wrapDelta } from './terrain.js';
import { BUILD_MODULES, CAMP_REGIONS, MARKET_REGIONS, CAMP_RADIUS, ATTACHMENTS, chestOnFloor } from './living-build-state.js';
import { LIVING_SITES } from './living-sites.js';
import { STORY_SITES } from './story-sites.js';
import { WAYSIDE_SITES } from './wayside-hut-layout.js';
import { portReserved } from './seaport-layout.js';
import { reservedScenery } from './retreat-layout.js';
import { animalRadius } from './village-paths.js';
import { buildContacts, frameTouchesPlayer } from './living-build-contacts.js';
import { entryFlight,entryFlights,outsideTreads } from './homestead-foundation.js';
import { foundationPiers, foundationWood } from './living-foundation.js';
import { timberId } from './living-build-trees.js';

const failure = reason => ({ok:false,reason});
export const buildDistance = (a,b)=>Math.hypot(wrapDelta(a.x-b.x),wrapDelta(a.z-b.z));
export function localPoint(p,u,v) {
  const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  return {x:p.x+u*c+v*s,z:p.z-u*s+v*c};
}
const treeMap=new Map(), woods=new Map(), cellSize=12;
const cell=(x,z)=>Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
for(const tree of TIMBER_TREES) {
  const key=cell(tree.x,tree.z);
  if(!woods.has(key))woods.set(key,[]);
  woods.get(key).push(tree);
  treeMap.set(timberId(tree),tree);
}
function nearbyTrees(p,r) {
  const result=[];
  for(let x=Math.floor((p.x-r)/cellSize);x<=Math.floor((p.x+r)/cellSize);x++)
    for(let z=Math.floor((p.z-r)/cellSize);z<=Math.floor((p.z+r)/cellSize);z++)
      result.push(...(woods.get(x+','+z)||[]));
  return result;
}
const standingRecords=new WeakMap();
export function timberTree(id) {
  const source=treeMap.get(id);
  if(!source)return null;
  if(!standingRecords.has(source)){
    const {x,z,h,kind,seed,form}=source;
    const ground=timberWood(source)?.base ?? (kind==='lake-willow'?terrainMeshHeight(x,z):treeGround(source));
    standingRecords.set(source,{id,x,z,h,kind,seed,form,ground,source});
  }
  return standingRecords.get(source);
}
export function closestTimberTrees(world,p,count=8,range=Infinity,offset=0) {
  const removed=new Set(world.felledTrees), choices=[];
  for(const [id,tree] of treeMap) {
    if(removed.has(id))continue;
    const distance=buildDistance(p,tree);
    if(distance<=range)choices.push({id,distance});
  }
  choices.sort((a,b)=>a.distance-b.distance);
  return choices.slice(offset,offset+count).map(({id,distance})=>({...timberTree(id),distance}));
}
export const nearestTimberTree=(world,p,range=Infinity)=>closestTimberTrees(world,p,1,range)[0]??null;
const nearest=(list,p,limit)=>list.reduce((best,s)=>{
  const d=buildDistance(p,s);
  return d<=limit && (!best || d<buildDistance(p,best))?s:best;
},null);
// One maintained aisle follows the three existing paddies, racks and scarecrows.
const paddies={x:165.2,z:89.2,w:40,d:22};
function inRectangle(p,q,w,d,pad=0) {
  const dx=p.x-q.x,dz=p.z-q.z,c=Math.cos(q.yaw||0),s=Math.sin(q.yaw||0);
  return Math.abs(dx*c-dz*s)<w/2+pad && Math.abs(dx*s+dz*c)<d/2+pad;
}
export function stumpCovered(world,tree) {
  return world.structures.some(s=>{
    if(s.parentId || buildDistance(tree,s)>4)return false;
    if(inRectangle(tree,s,BUILD_MODULES[s.kind].width,BUILD_MODULES[s.kind].depth,.08))return true;
    return outsideTreads(s,entryFlight(s.kind,s)).some(r=>inRectangle(tree,r,r.w,r.d,.08));
  });
}
function footprint(s,kind) {
  const def=BUILD_MODULES[kind==='floor'?'hut':kind];
  return {...s,w:def.width,d:def.depth};
}
function overlap(a,b) {
  const dx=a.x-b.x,dz=a.z-b.z,ang=a.yaw-b.yaw,co=Math.abs(Math.cos(ang)),sn=Math.abs(Math.sin(ang));
  function overlaps(p,w,d,otherW,otherD) {
    const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
    return Math.abs(dx*c-dz*s)<(w+co*otherW+sn*otherD)*.5+.12 &&
      Math.abs(dx*s+dz*c)<(d+sn*otherW+co*otherD)*.5+.12;
  }
  return overlaps(a,a.w,a.d,b.w,b.d) && overlaps(b,b.w,b.d,a.w,a.d);
}
export function routeBlocked(state,p,r) {
  if(state?.objects?.some(o=>buildDistance(o,p)<r+(o.type==='onsen'?5:2.5)))return true;
  for(const n of state?.npcs??[]) {
    if(['dragon','kirin','bird','hawk'].includes(n.type))continue;
    const pad=r+animalRadius(n)+.6;
    if(!state.restoringBuild && buildDistance(n,p)<pad)return true;
    if(!Number.isFinite(n.homeX) || !Number.isFinite(n.homeZ))continue;
    const reach=(n.trail?1.24:2.06)*(n.radius||0)+pad;
    if(Math.hypot(p.x-n.homeX,p.z-n.homeZ)<reach)return true;
  }
  return false;
}
function groundSurvey(world,kind,p,state,legacyFoundation) {
  const def=BUILD_MODULES[kind==='floor'?'hut':kind], r=.5*Math.hypot(def.width,def.depth);
  const region=REGIONS[regionAt(p.x,p.z)];
  if(!CAMP_REGIONS.includes(region.id))return failure('この土地では野営や出店の許しがありません。桜川・棚田・蔵町の郊外などで探してください。');
  if(kind==='stand' && !MARKET_REGIONS.includes(region.id))return failure('餅の売り棚は桜川・棚田・蔵町に立てられます。');
  if(Math.abs(p.x)+r>=BOUND || Math.abs(p.z)+r>=BOUND)return failure('ここは海図の境です。島の内側を選んでください。');
  if(nearRoad(p.x,p.z,r+3.5))return failure('ここは街道と荷車の通り道です。道端からもう少し離れてください。');
  if(STORY_SITES.some(s=>buildDistance(p,s)<10+r) || WAYSIDE_SITES.some(s=>buildDistance(p,s)<8+r) ||
      LIVING_SITES.some(s=>buildDistance(p,s)<4+r) || buildDistance(region,p)<12+r ||
      (region.id==='shrine' && buildDistance(region,p)<35+r) ||
      (region.id==='autumn' && inRectangle(p,{x:279,z:-123},32,15,r)) ||
      BUILDINGS.some(b=>inRectangle(p,b,b.w,b.d,2+r)) ||
      inRectangle(p,paddies,paddies.w,paddies.d,r))
    return failure('ここは村の仕事場や旅人の立ち寄る場所です。外の空き地を探してください。');
  if(routeBlocked(state,p,r))return failure('住人や動物が使う場所です。歩く道を空けてください。');
  for(const tree of nearbyTrees(p,r+3)) {
    const id=timberId(tree);
    if(world.felledTrees.includes(id) || buildDistance(p,tree)>r+Math.min(2.0,tree.h*.19))continue;
    return {ok:false,treeId:id,reason:'敷地に木が生えています。一本伐ると土地を見直せます。'};
  }
  let lo=Infinity,hi=-Infinity,bank=false;
  const samples=[];
  // Sample the entire foundation including eaves and a handspan of clearance.
  const nx=Math.ceil(def.width/.52), nz=Math.ceil(def.depth/.52);
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
    const q=localPoint(p,(i/nx-.5)*def.width,(j/nz-.5)*def.depth);
    if(portReserved(q.x,q.z) || reservedScenery(q.x,q.z))return failure('船着き場と湯場の敷地を空けてください。');
    const y=terrainContactHeight(q.x,q.z), freeboard=y-waterSurfaceAt(q.x,q.z);
    if(freeboard<.30)return failure('水が近すぎて足元が安定しません。岸の高い場所へ移してください。');
    lo=Math.min(y,lo);hi=Math.max(y,hi);bank ||= freeboard<1.4;
    samples.push({...q,y});
  }
  // Include the actual post centres as well as the full envelope. High ground
  // sets one horizontal datum for every sill, even on a rotated footprint.
  // A saved plot from before individually fitted piers keeps its original
  // measurements when restored or selected again at precisely the same pose.
  for(const pier of legacyFoundation?[]:foundationPiers(kind,p)) {
    lo=Math.min(lo,pier.groundY);hi=Math.max(hi,pier.groundY);
  }
  const relief=hi-lo, y=hi+(bank?.09:.015);
  if(samples.some(q=>staticVolumeAt(q.x,q.z,q.y+.05,.38,3.7+(legacyFoundation?0:hi-q.y),true)))
    return failure('岩や建物、木の枝がかかっています。何もない地面を探してください。');
  const terrain=region.id==='snow'?'snow':bank?'bank':relief>.18?'slope':'plain';
  return {ok:true,...p,y,regionId:region.id,terrain,relief,
    foundationWood:legacyFoundation?0:foundationWood(kind,relief),...(legacyFoundation?{legacyFoundation:true}:{})};
}
export function surveySite(world,kind,pose,{excludeId,state}={}) {
  if(!Object.hasOwn(BUILD_MODULES,kind) || !pose || ![pose.x,pose.z,pose.yaw??0].every(Number.isFinite))return failure('地面を選んでください。');
  const p={x:pose.x,z:pose.z,yaw:Math.atan2(Math.sin(pose.yaw||0),Math.cos(pose.yaw||0))};
  const existing=world.structures.filter(s=>s.id!==excludeId && (!excludeId || s.parentId!==excludeId));
  const source=excludeId && world.structures.find(s=>s.id===excludeId);
  const quote=site=>({...site,foundationWoodDelta:site.foundationWood-(source?.foundationWood??0)});
  const legacyFoundation=source && !source.parentId && source.foundationWood===undefined &&
    buildDistance(source,p)<1e-7 && Math.abs(Math.sin((source.yaw-p.yaw)*.5))<1e-9;
  if(kind==='chest') {
    const floor=nearest(existing.filter(s=>s.kind==='floor'),p,1.7);
    if(floor) {
      if(existing.some(s=>s.parentId===floor.id && s.kind==='chest'))return failure('この板床にはすでに道具櫃があります。');
      const anchor=chestOnFloor(floor);
      if(state?.player && inRectangle(state.player,anchor,1.12,.70,.43))return failure('道具櫃を置く隅から少し離れてください。');
      return quote({ok:true,...anchor,relief:0,foundationWood:0});
    }
  }
  if(ATTACHMENTS.includes(kind)) {
    const floor=nearest(existing.filter(s=>s.kind==='floor'),p,2.65);
    if(!floor)return failure('板床のそばを選ぶと、部材が床の継ぎ手に合います。');
    const family=existing.filter(s=>s.parentId===floor.id);
    if(kind!=='posts' && !family.some(s=>s.kind==='posts'))return failure('板床に四本柱を立ててから取り付けてください。');
    if(family.some(s=>s.kind===kind))return failure('この板床には、すでに同じ部材があります。');
    if (state?.player && buildContacts([{...floor,kind}]).some(part=>frameTouchesPlayer(part,state.player)))
      return failure('部材が体にかかります。板床の空いているところへ移ってください。');
    return quote({ok:true,x:floor.x,z:floor.z,y:floor.y,yaw:floor.yaw,regionId:floor.regionId,terrain:floor.terrain,parentId:floor.id,campId:floor.campId,relief:0,foundationWood:0});
  }
  const site=groundSurvey(world,kind,p,state,legacyFoundation);
  if(!site.ok)return site;
  const camp=nearest(existing.filter(s=>s.kind==='camp'),p,CAMP_RADIUS);
  if(kind!=='camp' && kind!=='stand' && !camp)return failure('近くに野営地がありません。先に野営地を設け、その周り24 m以内を選んでください。');
  const root=footprint(site,kind), neighbours=[];
  for(const s of existing){
    if(s.parentId || buildDistance(s,site)>7)continue;
    const other=footprint(s,s.kind);
    const flight=entryFlight(s.kind,s);
    neighbours.push(other,...outsideTreads(s,flight));
  }
  if(neighbours.some(rect=>overlap(root,rect)))return failure('別の設備と重なります。少し離して置いてください。');
  const flights=entryFlights(kind,site);
  const same=source && buildDistance(source,site)<1e-7 && Math.abs(Math.sin((source.yaw-site.yaw)*.5))<1e-9;
  const wanted=same?source.entryBay:undefined;
  if(flights.length || wanted!==undefined){
    const flight=flights.find(f=>(wanted===undefined || wanted===f.bay) &&
      !outsideTreads(site,f).some(t=>neighbours.some(other=>overlap(t,other))));
    if(!flight)return failure('踏み段がほかの設備にかかります。少し離すか、向きを変えてください。');
    if(flight!==flights[0] || wanted!==undefined)site.entryBay=flight.bay;
    if(state?.player && outsideTreads(site,flight).some(r=>inRectangle(state.player,r,r.w,r.d,.26)))
      return failure('踏み段を掛けるところから少し離れてください。');
  }
  if(state?.player && inRectangle(state.player,p,BUILD_MODULES[kind].width,BUILD_MODULES[kind].depth,.43))
    return failure('自分の足元にかかります。少し先を選んでください。');
  if(kind!=='camp' && kind!=='stand')site.campId=camp.id;
  return quote(site);
}
