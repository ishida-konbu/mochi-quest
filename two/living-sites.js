import { groundHeight, terrainHeight, MARKET_STALLS, wrapCoord, wrapDelta, staticVolumeAt } from './terrain.js';
import { WORKTOPS, HERB_PATCH, RICE_BASKET, RICE_SHOP, worktopPoint } from './living-layout.js';
import { GATHER_NODES, SHOP_STOCK } from './living-resources.js';

function site(id,region,kind,name,point,label) {
  const {x,z}=point;
  return Object.freeze({id,region,kind,name,label,x,z,y:groundHeight(x,z,terrainHeight(x,z)+.29),
    ...(GATHER_NODES[id]||{}), ...(SHOP_STOCK[id]?{stock:SHOP_STOCK[id]}:{})});
}
function stall(index) {
  const [x,z,yaw]=MARKET_STALLS[index];
  return worktopPoint({x,z,yaw},0,1.62);
}

export const LIVING_SITES=Object.freeze([
  site('river-mortar','river','workshop','桜川の共同臼',worktopPoint(WORKTOPS['river-mortar'],0,1.22),'共同臼で餅を作る'),
  site('river-yomogi','river','gather','渡し場のよもぎ原',HERB_PATCH,'よもぎを摘む'),
  site('terraces-mortar','terraces','workshop','棚田の共同臼',worktopPoint(WORKTOPS['terraces-mortar'],0,1.22),'共同臼で餅を作る'),
  site('terraces-farmer','terraces','shop','稲架の米売り場',{x:RICE_SHOP.x,z:RICE_SHOP.z+1.12},'棚田の米を買う'),
  site('terraces-share','terraces','gather','棚田の分け米籠',{x:RICE_BASKET.x,z:RICE_BASKET.z+1.05},'分け米をいただく'),
  site('market-grocer','market','shop','蔵町の菜の露店',stall(0),'餅の材料を買う'),
  site('market-share','market','gather','茶の露店の振る舞い豆',stall(5),'炒り大豆を分けてもらう'),
  site('market-mortar','market','workshop','蔵町の団子屋',stall(4),'団子屋で餅を作る'),
]);
function onFoot(p) {
  return p.grounded && !p.activity && !p.inWater && !p.mount && !p.skiff && !p.vessel;
}
// Sweep from waist to hand height, including counters lower than the
// outstretched hand. A thin screen must not fit between samples.
export function clearHandReach(from,to,storyCollisions) {
  const dx=wrapDelta(to.x-from.x), dz=wrapDelta(to.z-from.z);
  const steps=Math.ceil(Math.hypot(dx,dz)/.12);
  for (let i=1;i<steps;i++) {
    const t=i/steps, x=wrapCoord(from.x+dx*t), z=wrapCoord(from.z+dz*t);
    const y=from.y+(to.y-from.y)*t+.40;
    if (staticVolumeAt(x,z,y,.075,.62) || storyCollisions?.penetration(x,z,y,.62,.075)>0) return false;
  }
  return true;
}

export function nearLivingSite(player,site) {
  return !!site && onFoot(player) && Math.abs(site.y-player.y)<.9
    && Math.hypot(wrapDelta(player.x-site.x),wrapDelta(player.z-site.z))<=1.57 && clearHandReach(player,site);
}

// Only local travellers who are free to stop for a bite. The short sightline
// keeps another floor, a wall or a counter from becoming a gift recipient.
export function nearGiftRecipient(state,storyCollisions) {
  const p=state.player;
  if (!onFoot(p)) return null;
  let best=null;
  for (const n of state.nearbyNpcs) {
    if (!['porter','wander'].includes(n.role) || !['rabbit','frog'].includes(n.type) || n.mounted || n.waterHare || n.rider || n.carrier) continue;
    const dx=wrapDelta(n.x-p.x), dz=wrapDelta(n.z-p.z), distance=Math.hypot(dx,dz);
    if (Math.abs(n.y-p.y)>.68 || distance>2.7 || distance>=(best?.distance ?? Infinity)) continue;
    if (clearHandReach(p,n,storyCollisions)) best={id:n.id, name:n.role==='porter'?(n.type==='frog'?'荷を運ぶ蛙':'荷を運ぶ兎'):(n.type==='frog'?'旅の蛙':'旅の兎'),distance};
  }
  return best;
}
