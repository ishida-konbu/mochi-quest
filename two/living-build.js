import { BUILD_MODULES, ATTACHMENTS, CAMP_RADIUS, MAX_CAMPS, MAX_STRUCTURES, MAX_WOOD, chestOnFloor } from './living-build-state.js';
import { buildDistance, surveySite, stumpCovered, timberTree } from './living-build-land.js';
import { timberCut } from './homestead-timber-section.js';
import { buildContacts } from './living-build-contacts.js';
import { bindFelledTrees } from './living-build-trees.js';
import { clearHandReach } from './living-sites.js';
import { RESOURCES } from './living-resources.js';
import { forgetMarketStand, marketRemovalReason, settleMarket } from './living-market.js';
import { replaceBuildContacts, terrainContactHeight, wrapDelta } from './terrain.js';
export { BUILD_MODULES, buildState, validBuildState } from './living-build-state.js';
export { surveySite, nearestTimberTree, timberTree } from './living-build-land.js';

let active=null;
export function syncBuildTerrain(world) {
  active=world;
  const cleared=(world?.felledTrees??[]).map(timberTree).filter(Boolean);
  bindFelledTrees(cleared.map(tree=>tree.id));
  const contacts=buildContacts(world?.structures??[]);
  for(const tree of cleared) {
    if(stumpCovered(world,tree))continue;
    const cut=timberCut(tree);
    contacts.push({x:cut.x,z:cut.z,yaw:0,w:2*cut.radius,d:2*cut.radius,
      bottom:tree.ground-.15,top:cut.y,kind:'oval',support:true});
  }
  replaceBuildContacts(contacts);
}
export function withBuildTerrain(world,fn) {
  const prev=active;
  if(prev===world)return fn();
  syncBuildTerrain(world);
  try{return fn();}finally{syncBuildTerrain(prev);}
}
// A file can carry well-formed numbers for an impossible plot. Re-survey the
// old land, with this journey's verified trunks cleared, before accepting it.
export function validBuildLand(world,state) {
  if(world.felledTrees.some(id=>!timberTree(id)))return false;
  if(!world.structures.length)return true;
  return withBuildTerrain(world,()=>{
    const surveyState={npcs:state?.npcs,objects:state?.objects,restoringBuild:true};
    return world.structures.every(s=>{
      if(s.parentId)return true;
      const site=surveySite(world,s.kind,s,{excludeId:s.id,state:surveyState});
      return site.ok && Math.abs(site.y-s.y)<.025 && site.regionId===s.regionId && site.terrain===s.terrain;
    });
  });
}
function changed(world) {
  if(active===world)syncBuildTerrain(world);
}
const fail=reason=>({ok:false,reason});
const ok=message=>({ok:true,message});
const onFoot=p=>p?.grounded && !p.activity && !p.mount && !p.skiff && !p.vessel && !p.inWater && (p.h??0)<.2;
const hasStock=s=>Object.values(s.inventory).some(n=>n>0) || s.batches.length>0;
const transform=s=>({x:s.x,y:s.y,z:s.z,yaw:s.yaw,terrain:s.terrain,regionId:s.regionId});
const costText=(w,c)=>'木材'+w+'本'+(c?'と'+c+'文':'');
export function placeStructure(world,kind,pose,options={}) {
  const site=surveySite(world,kind,pose,{...options,excludeId:undefined});
  if(!site.ok)return site;
  const def=BUILD_MODULES[kind],parts=kind==='hut'?['floor','posts','wall','roof']:[kind];
  if(world.structures.length+parts.length>MAX_STRUCTURES || world.nextStructureId>Number.MAX_SAFE_INTEGER-parts.length)
    return fail('建てられる部材は全部で'+MAX_STRUCTURES+'点です。使わない部材を片付けてください。');
  if(kind==='camp' && world.structures.filter(s=>s.kind==='camp').length>=MAX_CAMPS)return fail('野営地は三か所までです。使わない野営地を片付けてください。');
  if(world.wood<def.wood || world.wallet<def.coins)return fail(def.name+'には'+costText(def.wood,def.coins)+'が要ります。');
  const floorId='build-'+world.nextStructureId;
  const structures=parts.map((part,i)=>({
    id:'build-'+(world.nextStructureId+i),kind:part,...transform(site),
    ...(site.campId?{campId:site.campId}:{}),
    ...(site.parentId || ATTACHMENTS.includes(part)?{parentId:site.parentId??floorId}:{}),
    ...(part==='chest'?{inventory:{},costs:{},batches:[]}:{}),
  }));
  world.wood-=def.wood;world.wallet-=def.coins;
  world.nextStructureId+=parts.length;
  world.structures=[...world.structures,...structures];
  changed(world);
  return {...ok(def.name+'を設けました。'),structure:structures[0]};
}
export function moveStructure(world,id,pose,options={}) {
  const source=world.structures.find(s=>s.id===id);
  if(!source)return fail('移す設備を選んでください。');
  if(source.parentId && source.kind!=='chest')return fail('取り付けた部材は板床と一緒に移せます。');
  const next=surveySite(world,source.kind,pose,{...options,excludeId:id});
  if(!next.ok)return next;
  if(source.kind==='camp' && world.structures.some(s=>s.campId===id && !s.parentId && buildDistance(s,next)>CAMP_RADIUS))
    return fail('この野営地の設備が遠くなりすぎます。先に設備を移すか片付けてください。');
  if(source.kind==='stand')settleMarket(world);
  const {parentId:oldParent,...detached}=source;
  const moved={...detached,...transform(next),...(next.campId?{campId:next.campId}:{}),...(next.parentId?{parentId:next.parentId}:{})};
  world.structures=world.structures.map(s=>{
    if(s.id===id)return moved;
    if(s.parentId!==id)return s;
    return s.kind==='chest'?{...s,...chestOnFloor(moved)}:{...s,...transform(next),campId:next.campId};
  });
  changed(world);
  return {...ok(BUILD_MODULES[source.kind].name+'を移しました。'),structure:world.structures.find(s=>s.id===id)};
}
export function removeStructure(world,id) {
  const source=world.structures.find(s=>s.id===id);
  if(!source)return fail('片付ける設備を選んでください。');
  if(source.kind==='camp' && world.structures.some(s=>s.campId===id))return fail('この野営地に設備が残っています。先に設備を片付けてください。');
  if(world.structures.some(s=>s.parentId===id) ||
    (source.kind==='posts' && world.structures.some(s=>s.parentId===source.parentId && ['wall','roof'].includes(s.kind))))
    return fail('この部材がほかの部材を支えています。屋根、壁、柱、板床の順で外してください。');
  if(source.kind==='chest' && hasStock(source))return fail('道具櫃の品をすべて取り出してから片付けてください。');
  if(source.kind==='stand') {
    const reason=marketRemovalReason(world,id);
    if(reason)return fail(reason);
  }
  const d=BUILD_MODULES[source.kind];
  if(world.wood+d.wood>MAX_WOOD || !Number.isSafeInteger(world.wallet+d.coins))return fail('木材か銭を受け取る空きが足りません。');
  if(source.kind==='stand')forgetMarketStand(world,id);
  world.wood+=d.wood;world.wallet+=d.coins;
  world.structures=world.structures.filter(s=>s.id!==id);
  changed(world);
  return ok(d.name+'を片付け、'+costText(d.wood,d.coins)+'を回収しました。');
}
// Check sight up to the near side of the object. Probing its centre would test
// the closed lid or the counter itself as a wall between the visitor and it.
function visibleEdge(p,s,edge) {
  const d=buildDistance(p,s), u=Math.min(1,edge/Math.max(d,.001));
  return clearHandReach(p,{x:s.x+u*wrapDelta(p.x-s.x),z:s.z+u*wrapDelta(p.z-s.z),y:s.y});
}
export function nearBuildStructure(world,p,kind) {
  if(!onFoot(p))return null;
  let best=null, distance=Infinity;
  for(const s of world.structures) {
    if((kind ? s.kind!==kind : !['camp','chest','stand'].includes(s.kind)) || Math.abs(p.y-s.y)>1.05)continue;
    const d=buildDistance(p,s),def=BUILD_MODULES[s.kind];
    if(d>=distance || d>Math.hypot(def.width,def.depth)*.5+1.6)continue;
    const c=Math.cos(s.yaw),sn=Math.sin(s.yaw),dx=wrapDelta(p.x-s.x),dz=wrapDelta(p.z-s.z);
    const u=Math.abs(dx*c-dz*sn),v=Math.abs(dx*sn+dz*c);
    // Stop just before the actual edge along the line to the traveller. A
    // circumscribed circle can skip the cabin's rear wall on the narrow side.
    const edge=d ? .09+d/Math.max(2*u/def.width,2*v/def.depth) : 0;
    if(d<=edge+1.6 && visibleEdge(p,s,edge)) {best=s;distance=d;}
  }
  return best;
}
export function buyTimber(world,site) {
  if(!['market-grocer','terraces-farmer'].includes(site?.id))return fail('棚田の米売り場か蔵町の菜の露店で買えます。');
  if(world.wallet<6 || world.wood+4>MAX_WOOD)return fail('木材四本を受け取る空きと六文を用意してください。');
  world.wood+=4;world.wallet-=6;
  return ok('木材四本を六文で買いました。');
}
export function fellTree(world,id,player) {
  const tree=timberTree(id);
  if(!tree || world.felledTrees.includes(id))return fail('この木からは木材を取れません。');
  if(!onFoot(player) || buildDistance(player,tree)>3 || Math.abs(player.y-terrainContactHeight(tree.x,tree.z))>1.2 ||
      !visibleEdge(player,{...tree,y:terrainContactHeight(tree.x,tree.z)},1.05))return fail('地面に降りて、幹の見えるところまで近づいてください。');
  if(world.wood+6>MAX_WOOD || world.felledTrees.length>=4096)return fail('これ以上木材を受け取れません。');
  world.felledTrees=[...world.felledTrees,id];world.wood+=6;
  changed(world);
  return ok('用材木を一本伐り、木材六本を取りました。');
}
export function transferStorage(world,chestId,id,grams,deposit) {
  const chest=world.structures.find(s=>s.id===chestId && s.kind==='chest');
  if(!chest || !Object.hasOwn(RESOURCES,id) || !Number.isSafeInteger(grams) || grams<=0 || typeof deposit!=='boolean')return fail('食材と分量を確かめてください。');
  const src=deposit?world:chest,dest=deposit?chest:world;
  const have=src.inventory[id]??0,to=dest.inventory[id]??0;
  if(have<grams || to+grams>RESOURCES[id].limit)return fail('分量が足りないか、受け取り先がいっぱいです。');
  const paid=src.costs[id]??0,cost=Math.floor(paid*grams/have);
  src.inventory[id]=have-grams;src.costs[id]=paid-cost;
  dest.inventory[id]=to+grams;dest.costs[id]=(dest.costs[id]??0)+cost;
  return ok(RESOURCES[id].name+grams+' gを'+(deposit?'預けました。':'取り出しました。'));
}
export function transferBatchStorage(world,chestId,id,quantity,deposit) {
  const chest=world.structures.find(s=>s.id===chestId && s.kind==='chest');
  if(!chest || !Number.isSafeInteger(quantity) || quantity<=0 || typeof deposit!=='boolean')return fail('餅と個数を確かめてください。');
  const src=deposit?world:chest,dest=deposit?chest:world;
  const b=src.batches.find(b=>b.id===id),existing=dest.batches.find(b=>b.id===id);
  if(!b || quantity>b.quantity || (existing?.quantity??0)+quantity>4)return fail('仕込みの残りの個数を確かめてください。');
  if(existing)existing.quantity+=quantity;
  else dest.batches.push({...b,quantity});
  b.quantity-=quantity;
  if(!b.quantity)src.batches.splice(src.batches.indexOf(b),1);
  return ok('餅'+quantity+'個を'+(deposit?'預けました。':'取り出しました。'));
}
