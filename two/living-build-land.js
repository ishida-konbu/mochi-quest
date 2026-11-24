import { BOUND, REGIONS, TREES, BUILDINGS, nearRoad, terrainContactHeight, waterSurfaceAt, staticVolumeAt, treeGround, regionAt, wrapDelta } from './terrain.js';
import { BUILD_MODULES, CAMP_REGIONS, MARKET_REGIONS, CAMP_RADIUS, ATTACHMENTS, chestOnFloor } from './living-build-state.js';
import { LIVING_SITES } from './living-sites.js';
import { STORY_SITES } from './story-sites.js';
import { WAYSIDE_SITES } from './wayside-hut-layout.js';
import { portReserved } from './seaport-layout.js';
import { reservedScenery } from './retreat-layout.js';
import { animalRadius } from './village-paths.js';
import { buildContacts, frameTouchesPlayer } from './living-build-contacts.js';
import { timberId, isTimberPerch } from './living-build-trees.js';

const failure = reason => ({ok:false,reason});
export const buildDistance = (a,b)=>Math.hypot(wrapDelta(a.x-b.x),wrapDelta(a.z-b.z));
export function localPoint(p,u,v) {
  const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  return {x:p.x+u*c+v*s,z:p.z-u*s+v*c};
}
const treeMap=new Map(), woods=new Map(), cellSize=12;
const cell=(x,z)=>Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
for(const tree of TREES) {
  const key=cell(tree.x,tree.z);
  if(!woods.has(key))woods.set(key,[]);
  woods.get(key).push(tree);
  if(tree.form===undefined || tree.kind==='moso' || !MARKET_REGIONS.includes(REGIONS[regionAt(tree.x,tree.z)].id))continue;
  // Fruiting and flowering trees along the old paths keep their canopies.
  if (['plum','cherry','ginkgo','maple','willow'].includes(tree.kind) || nearRoad(tree.x,tree.z,3.6))continue;
  if(reservedScenery(tree.x,tree.z) || portReserved(tree.x,tree.z) ||
      STORY_SITES.some(s=>buildDistance(tree,s)<11) || WAYSIDE_SITES.some(s=>buildDistance(tree,s)<8) ||
      LIVING_SITES.some(s=>buildDistance(tree,s)<5))continue;
  treeMap.set(timberId(tree),tree);
}
function nearbyTrees(p,r) {
  const result=[];
  for(let x=Math.floor((p.x-r)/cellSize);x<=Math.floor((p.x+r)/cellSize);x++)
    for(let z=Math.floor((p.z-r)/cellSize);z<=Math.floor((p.z+r)/cellSize);z++)
      result.push(...(woods.get(x+','+z)||[]));
  return result;
}
export function timberTree(id) {
  const tree=treeMap.get(id);
  return tree && !isTimberPerch(tree) ? {id,x:tree.x,z:tree.z,kind:tree.kind,h:tree.h,seed:tree.seed,form:tree.form,ground:treeGround(tree)} : null;
}
export function nearestTimberTree(world,p,range=3) {
  let best=null;
  for(const tree of nearbyTrees(p,range)) {
    const distance=buildDistance(p,tree);
    if(distance>range || distance>=(best?.distance??Infinity))continue;
    const id=timberId(tree), candidate=timberTree(id);
    if(candidate && !world.felledTrees.includes(id))best={...candidate,distance};
  }
  return best;
}
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
  return world.structures.some(s=>!s.parentId &&
    inRectangle(tree,s,BUILD_MODULES[s.kind].width,BUILD_MODULES[s.kind].depth,.08));
}
function occupiedRoots(a,kind,b) {
  // Reserve the future eaves when the first floor is laid.
  const da=BUILD_MODULES[kind==='floor'?'hut':kind],db=BUILD_MODULES[b.kind==='floor'?'hut':b.kind];
  const dx=a.x-b.x,dz=a.z-b.z,ang=a.yaw-b.yaw,co=Math.abs(Math.cos(ang)),sn=Math.abs(Math.sin(ang));
  function overlaps(p,w,d,otherW,otherD) {
    const c=Math.cos(p.yaw),s=Math.sin(p.yaw);
    return Math.abs(dx*c-dz*s)<(w+co*otherW+sn*otherD)*.5+.12 &&
      Math.abs(dx*s+dz*c)<(d+sn*otherW+co*otherD)*.5+.12;
  }
  return overlaps(a,da.width,da.depth,db.width,db.depth) && overlaps(b,db.width,db.depth,da.width,da.depth);
}
function routeBlocked(state,p,r) {
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
function groundSurvey(world,kind,p,state) {
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
    if(timberTree(id))return {ok:false,treeId:id,reason:'敷地に用材木があります。幹のそばで伐ってから設置できます。'};
    return failure('残しておく木が敷地にかかります。幹と枝から離してください。');
  }
  let lo=Infinity,hi=-Infinity,bank=false;
  // Sample the entire foundation including eaves and a handspan of clearance.
  const nx=Math.ceil(def.width/.52), nz=Math.ceil(def.depth/.52);
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
    const q=localPoint(p,(i/nx-.5)*def.width,(j/nz-.5)*def.depth);
    if(portReserved(q.x,q.z) || reservedScenery(q.x,q.z))return failure('船着き場と湯場の敷地を空けてください。');
    const y=terrainContactHeight(q.x,q.z), freeboard=y-waterSurfaceAt(q.x,q.z);
    if(freeboard<.30)return failure('水が近すぎて足元が安定しません。岸の高い場所へ移してください。');
    lo=Math.min(y,lo);hi=Math.max(y,hi);bank ||= freeboard<1.4;
    if(staticVolumeAt(q.x,q.z,y+.05,.38,3.7,true))return failure('岩や建物、木の枝がかかっています。何もない地面を探してください。');
  }
  if(hi-lo>.52)return failure('傾斜がきつく、基礎が届きません。もう少し平らな場所を選んでください。');
  const terrain=region.id==='snow'?'snow':bank?'bank':hi-lo>.18?'slope':'plain';
  return {ok:true,...p,y:hi+(bank?.09:.015),regionId:region.id,terrain};
}
export function surveySite(world,kind,pose,{excludeId,state}={}) {
  if(!Object.hasOwn(BUILD_MODULES,kind) || !pose || ![pose.x,pose.z,pose.yaw??0].every(Number.isFinite))return failure('地面を選んでください。');
  const p={x:pose.x,z:pose.z,yaw:Math.atan2(Math.sin(pose.yaw||0),Math.cos(pose.yaw||0))};
  const existing=world.structures.filter(s=>s.id!==excludeId && (!excludeId || s.parentId!==excludeId));
  if(kind==='chest') {
    const floor=nearest(existing.filter(s=>s.kind==='floor'),p,1.7);
    if(floor) {
      if(existing.some(s=>s.parentId===floor.id && s.kind==='chest'))return failure('この板床にはすでに道具櫃があります。');
      const anchor=chestOnFloor(floor);
      if(state?.player && inRectangle(state.player,anchor,1.12,.70,.43))return failure('道具櫃を置く隅から少し離れてください。');
      return {ok:true,...anchor};
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
    return {ok:true,x:floor.x,z:floor.z,y:floor.y,yaw:floor.yaw,regionId:floor.regionId,terrain:floor.terrain,parentId:floor.id,campId:floor.campId};
  }
  const site=groundSurvey(world,kind,p,state);
  if(!site.ok)return site;
  const camp=nearest(existing.filter(s=>s.kind==='camp'),p,CAMP_RADIUS);
  if(kind!=='camp' && kind!=='stand' && !camp)return failure('近くに野営地がありません。先に野営地を設け、その周り24 m以内を選んでください。');
  if(existing.some(s=>!s.parentId && occupiedRoots(p,kind,s)))return failure('別の設備と重なります。少し離して置いてください。');
  if(state?.player && inRectangle(state.player,p,BUILD_MODULES[kind].width,BUILD_MODULES[kind].depth,.43))
    return failure('自分の足元にかかります。少し先を選んでください。');
  if(kind!=='camp' && kind!=='stand')site.campId=camp.id;
  return site;
}
