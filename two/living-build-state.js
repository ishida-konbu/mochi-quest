import { RESOURCES } from './living-resources.js';
import { validCraftState } from './living-craft.js';
import { WORLD_BOUND } from './geography.js';

const module = (name,wood,coins,width,depth) => Object.freeze({name,wood,coins,width,depth});
export const BUILD_MODULES = Object.freeze({
  camp: module('旅の野営地',2,0,2,2),
  hut: module('板張りの小屋',10,4,3.7,3.3),
  floor: module('板床',3,0,3.2,2.8),
  posts: module('四本柱',2,0,3.2,2.8),
  wall: module('板壁',2,0,3.2,2.8),
  roof: module('板葺き屋根',3,4,3.7,3.3),
  fence: module('竹垣',1,0,1.80,.18),
  chest: module('道具櫃',2,4,1.12,.70),
  stand: module('無人の餅売り棚',2,6,1.78,1.08),
});
export const HEIGHT_STEP=.2, MAX_HEIGHT_STEPS=12;
export const CAMP_RADIUS = 24, MAX_STRUCTURES = 48, MAX_CAMPS = 3, MAX_WOOD = Number.MAX_SAFE_INTEGER;
export const MARKET_REGIONS = ['river','terraces','market'];
export const CAMP_REGIONS = [...MARKET_REGIONS,'coast','spring','snow','moon','autumn','dawn','shrine'];
export const ATTACHMENTS = ['posts','wall','roof'];
export function chestOnFloor(floor) {
  const c=Math.cos(floor.yaw), s=Math.sin(floor.yaw);
  return {x:floor.x+.69*c-.57*s,z:floor.z-.69*s-.57*c,y:floor.y+.18,yaw:floor.yaw,
    terrain:floor.terrain,regionId:floor.regionId,campId:floor.campId,parentId:floor.id};
}
// The bed occupies the opposite side of the room to the chest. Its claim
// remains identified by the camp's own id; only parentId carries geometry.
export function bedOnFloor(floor) {
  const c=Math.cos(floor.yaw),s=Math.sin(floor.yaw);
  return {x:floor.x-.64*c+.05*s,z:floor.z+.64*s+.05*c,y:floor.y+.18,yaw:floor.yaw,
    terrain:floor.terrain,regionId:floor.regionId,parentId:floor.id};
}
export function buildState() {
  return {structures:[],felledTrees:[],treeReadyAt:{},wood:8,nextStructureId:1};
}
const amount = (value,lo,hi) => Number.isSafeInteger(value) && value>=lo && value<=hi;
function validChest(s,world) {
  for (const ledger of [s.inventory,s.costs]) {
    if (!ledger || typeof ledger!=='object' || Array.isArray(ledger)) return false;
    for (const [id,n] of Object.entries(ledger)) {
      if (!Object.hasOwn(RESOURCES,id) || !amount(n,0,RESOURCES[id].limit)) return false;
    }
  }
  return Object.entries(s.costs).every(([id,n])=>n<=(s.inventory[id]??0)) &&
    Array.isArray(s.batches) && validCraftState({...world,batches:s.batches});
}
export function validBuildState(world) {
  if (!world || !amount(world.wood,0,MAX_WOOD) || !amount(world.nextStructureId,1,Number.MAX_SAFE_INTEGER) ||
      !Array.isArray(world.structures) || world.structures.length>MAX_STRUCTURES ||
      !Array.isArray(world.felledTrees) ||
      world.felledTrees.some(id=>typeof id!=='string' || !/^[a-zA-Z-]+:\d{1,10}:-?\d{1,6}:-?\d{1,6}$/.test(id)) ||
      new Set(world.felledTrees).size!==world.felledTrees.length) return false;
  if(world.treeReadyAt!==undefined){
    if(!world.treeReadyAt || Array.isArray(world.treeReadyAt) || typeof world.treeReadyAt!=='object')return false;
    const cut=new Set(world.felledTrees);
    if(Object.entries(world.treeReadyAt).some(([id,time])=>!cut.has(id) || !Number.isSafeInteger(time) || time<0))return false;
  }
  const byId=new Map(), occupied=new Set();
  let camps=0;
  for (const s of world.structures) {
    if (!s || typeof s.id!=='string' || !/^build-[1-9]\d*$/.test(s.id) ||
        !amount(Number(s.id.slice(6)),1,world.nextStructureId-1) || byId.has(s.id) ||
        !Object.hasOwn(BUILD_MODULES,s.kind) || s.kind==='hut' ||
        ![s.x,s.y,s.z,s.yaw].every(Number.isFinite) || Math.abs(s.x)>=WORLD_BOUND || Math.abs(s.z)>=WORLD_BOUND ||
        Math.abs(s.y)>1000 || Math.abs(s.yaw)>Math.PI*2 || !['plain','slope','bank','snow'].includes(s.terrain) ||
        !(s.kind==='stand'?MARKET_REGIONS:CAMP_REGIONS).includes(s.regionId)) return false;
    if (s.heightSteps!==undefined && (s.parentId || s.foundationWood===undefined || !amount(s.heightSteps,0,MAX_HEIGHT_STEPS)))return false;
    if (s.entryBay!==undefined) {
      const kinds=s.heightSteps?['floor','camp','stand','chest']:['floor','camp'];
      if(s.parentId || s.foundationWood===undefined || !kinds.includes(s.kind) ||
          !amount(s.entryBay,s.heightSteps?36:0,s.heightSteps?47:35))return false;
    }
    if (s.foundationWood!==undefined && (s.parentId || !amount(s.foundationWood,0,MAX_WOOD))) return false;
    if (s.kind==='chest' && !validChest(s,world)) return false;
    if (s.beddingGrade!==undefined && (s.kind!=='camp' || !amount(s.beddingGrade,0,3)))return false;
    if (s.kind==='camp') camps++;
    byId.set(s.id,s);
  }
  if(camps>MAX_CAMPS)return false;
  for(const s of world.structures) {
    if (s.kind==='camp' || s.kind==='stand') {
      if(s.campId)return false;
      if(s.parentId){
        const floor=byId.get(s.parentId),key=s.parentId+'/camp';
        if(s.kind!=='camp' || floor?.kind!=='floor' || occupied.has(key))return false;
        const at=bedOnFloor(floor);
        if(['x','y','z','yaw','terrain','regionId'].some(k=>s[k]!==at[k]))return false;
        occupied.add(key);
      }
      continue;
    }
    const camp=byId.get(s.campId);
    if (camp?.kind!=='camp' || (!s.parentId && Math.hypot(s.x-camp.x,s.z-camp.z)>CAMP_RADIUS+.001)) return false;
    if (!ATTACHMENTS.includes(s.kind) && !(s.kind==='chest' && s.parentId)) {
      if(s.parentId)return false;
      continue;
    }
    const floor=byId.get(s.parentId), key=s.parentId+'/'+s.kind;
    if (floor?.kind!=='floor' || floor.campId!==s.campId || occupied.has(key)) return false;
    const anchor=s.kind==='chest'?chestOnFloor(floor):floor;
    if (['x','y','z','yaw','terrain','regionId'].some(k=>s[k]!==anchor[k])) return false;
    occupied.add(key);
  }
  return world.structures.every(s=>(s.kind!=='roof' && s.kind!=='wall') || occupied.has(s.parentId+'/posts'));
}
