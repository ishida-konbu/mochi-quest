import * as T from './vendor/three.module.min.js';
import { wrapDelta } from './terrain.js';
import { timberTree, stumpCovered } from './living-build-land.js';
import { BUILD_MODULES } from './living-build-state.js';
import { timberCut } from './homestead-timber-section.js';
import { homesteadGeometry } from './homestead-carpentry.js';
import { plantedFootprints } from './homestead-groundcover.js';
import { makePriceTag } from './homestead-price-tags.js';
import { homesteadFinish } from './homestead-pigment.js';
import { makeCookingServing } from './living-craft-art.js';

const shared = new Map(), ranges = {building:100,stump:35,food:20};
const geometry = (kind,terrain,species) => {
  const key=kind==='stump' ? kind+'-'+species : kind+(terrain==='snow' && (kind==='roof' || kind==='hut')?'-snow':'');
  if(!shared.has(key))shared.set(key,homesteadGeometry(kind,terrain,species));
  return shared.get(key);
};
const previewColors = [0xa95139,0x63806c];
function surveyFrame(kind,ok,terrain) {
  const {width,depth}=BUILD_MODULES[kind];
  const w=width/2,d=depth/2,y=.052, coords=[];
  const line=(a,c)=>coords.push(...a,...c);
  for(const x of [-w,w])for(const z of [-d,d]){
    line([x,y,z],[x,.37,z]);
    line([x,y,z],[x-Math.sign(x)*Math.min(.24,w),y,z]);
    line([x,y,z],[x,y,z-Math.sign(z)*Math.min(.24,d)]);
  }
  const rectangle=(w,d,y)=>{
    for(const x of [-w,w])line([x,y,-d],[x,y,d]);
    for(const z of [-d,d])line([-w,y,z],[w,y,z]);
  };
  if(['floor','hut'].includes(kind))rectangle(1.6,1.4,.183);
  if(['posts','hut'].includes(kind))for(const x of [-1.44,1.44])for(const z of [-1.23,1.23])
    line([x,.18,z],[x,2.30,z]);
  if(['roof','hut'].includes(kind)){
    const top=terrain==='snow'?3.39:3.03;
    rectangle(1.85,1.65,2.23);
    line([-1.85,top,0],[1.85,top,0]);
    for(const x of [-1.85,1.85])for(const z of [-1.65,1.65])line([x,2.23,z],[x,top,0]);
  }
  if(kind==='wall')for(const y of [.18,2.23])line([-1.375,y,-1.23],[1.375,y,-1.23]);
  if(kind==='camp'){line([-.78,0,-.72],[-.78,1.79,-.72]);rectangle(.57,.86,.13);}
  if(kind==='stand'){rectangle(.86,.43,.88);rectangle(.89,.54,1.98);}
  if(kind==='chest'){rectangle(.56,.35,.78);}
  if(kind==='fence'){line([-.90,.79,0],[.90,.79,0]);}
  if(!ok){
    line([-w,y,-d],[w,y,d]);line([-w,y,d],[w,y,-d]);
  }
  const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(coords,3));
  const ink=new T.LineBasicMaterial({color:ok?0x243731:0x762619});
  return new T.LineSegments(g,ink);
}
function displayedStock(stock) {
  if(!stock?.length)return [];
  const first=stock[0];
  const other=stock.find(item=>item.recipeId!==first.recipeId) || stock[1] || (first.quantity>1 && first);
  return other?[first,other]:[first];
}
function removeGoods(mesh) {
  for(const group of [...mesh.children]){
    group.traverse(part=>part.geometry?.dispose());
    group.removeFromParent();
  }
}
function putGoods(mesh,world,stock,close) {
  const lots=close?displayedStock(stock):[];
  const previous=mesh.userData.samples;
  if(previous?.length===lots.length && lots.every((lot,i)=>
    lot.recipeId===previous[i].recipeId && lot.unitPrice===previous[i].unitPrice))return;
  removeGoods(mesh);
  mesh.userData.samples=lots.map(({recipeId,unitPrice})=>({recipeId,unitPrice}));
  const onePrice=lots.length===2 && lots[0].recipeId===lots[1].recipeId && lots[0].unitPrice===lots[1].unitPrice;
  for(const [i,lot] of lots.entries()){
    const recipe=world.recipes.find(r=>r.id===lot.recipeId);
    if(!recipe)continue;
    const x=lots.length===1?-.17:i===0?-.400:.057;
    const serving=makeCookingServing(recipe.draft);
    if(serving.skin.morphTargetInfluences)serving.skin.morphTargetInfluences[0]=1;
    serving.group.position.set(x,.914,.02);
    serving.group.scale.setScalar(.69);
    serving.group.rotation.y=i?.38:-.16;
    mesh.add(serving.group);
    if(!onePrice || i===0){
      const tag=makePriceTag(lot.unitPrice);
      tag.position.set(onePrice?-.17:x,.881,.365);
      mesh.add(tag);
    }
  }
}
function stumpKey(x,z) { return Math.floor(x/48)+','+Math.floor(z/48); }
export function createHomesteadWorld(scene,refreshCanopy,pruneUnderstory) {
  const group=new T.Group();
  group.name='旅人の野営地と餅売り棚';
  scene.add(group);
  const resident=new Map(),stumps=new Map(),cells=new Map();
  const chips=new T.Group();
  let planted;
  let world=null,knownCuts=null,count=0,preview=null,previewInk,burstAt=0;
  const chipD=new T.TetrahedronGeometry(.035),chipM=new T.MeshLambertMaterial({color:0xc9ab80});
  for(let i=0;i<7;i++){
    const chip=new T.Mesh(chipD,chipM);
    chip.scale.set(1.6,.24,.72);
    chips.add(chip);
  }
  chips.visible=false;group.add(chips);

  function clearResident() {
    for(const child of resident.values()){
      removeGoods(child);child.removeFromParent();
    }
    resident.clear();
  }
  function clearPreview() {
    if(!preview)return;
    const frame=preview.children[0];
    frame.geometry.dispose();frame.material.dispose();preview.removeFromParent();
    preview=null;
  }
  function setBuildingPreview(p) {
    clearPreview();
    if(!p || !Object.hasOwn(BUILD_MODULES,p.kind) || ![p.x,p.y,p.z].every(Number.isFinite))return;
    previewInk??=previewColors.map(color=>new T.MeshBasicMaterial({color,transparent:true,opacity:.51,
      side:T.FrontSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    preview=new T.Mesh(geometry(p.kind,p.terrain),previewInk[Number(Boolean(p.ok))]);
    preview.name='仮置き・'+BUILD_MODULES[p.kind].name;
    preview.position.set(p.x,p.y,p.z);preview.rotation.y=p.yaw||0;
    preview.add(surveyFrame(p.kind,p.ok,p.terrain));preview.renderOrder=2;group.add(preview);
  }
  function readCuts(showBurst) {
    const ids=world?.felledTrees || [];
    if(knownCuts===ids && ids.length===count)return;
    const previous=new Map(stumps);
    stumps.clear();cells.clear();
    const changed=[];
    for(const id of ids){
      let tree=previous.get(id);
      if(!tree){
        const standing=timberTree(id);
        if(!standing)continue;
        tree={...standing,cut:timberCut(standing)};
      }
      if(!previous.delete(id)){
        changed.push(tree);
        if(showBurst && ids.length===count+1){
          chips.position.set(tree.cut.x,tree.cut.y,tree.cut.z);
          chips.visible=true;burstAt=performance.now();
        }
      }
      stumps.set(id,tree);
      const key=stumpKey(tree.x,tree.z);
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(tree);
    }
    refreshCanopy?.([...changed,...previous.values()]);
    knownCuts=ids;count=ids.length;
  }
  function setLivingWorld(living) {
    if(world===living)return;
    clearResident();clearPreview();chips.visible=false;
    world=living;
    knownCuts=null;
    readCuts(false);
  }
  function draw(s,kind,viewer,visible) {
    const stump=kind==='stump',at=stump?s.cut:s;
    const dx=wrapDelta(at.x-viewer.x), dz=wrapDelta(at.z-viewer.z), d2=dx*dx+dz*dz;
    if(stump){
      if(s.checked!==world.structures){
        s.checked=world.structures;s.covered=stumpCovered(world,s);
      }
      if(s.covered)return;
    }
    if(d2>(stump?ranges.stump:ranges.building)**2)return;
    visible.add(s.id);
    let mesh=resident.get(s.id);
    if(!mesh){
      mesh=new T.Mesh(geometry(kind,s.terrain,stump?s.kind:undefined),homesteadFinish());
      mesh.castShadow=mesh.receiveShadow=true;
      mesh.name=stump?'木口の残る切り株':BUILD_MODULES[kind].name;
      group.add(mesh);resident.set(s.id,mesh);
      if(stump){
        const scale=s.cut.radius/.31;
        mesh.position.y=s.cut.y-.42;
        mesh.scale.set(scale,1,scale);
      }
    } else if(!stump) mesh.geometry=geometry(kind,s.terrain);
    mesh.position.x=viewer.x+dx;mesh.position.z=viewer.z+dz;
    if(!stump){mesh.position.y=s.y;mesh.rotation.y=s.yaw;}
    if(kind==='stand')putGoods(mesh,world,world.market?.stands[s.id]?.stock,d2<ranges.food**2);
  }
  function update(time,eye) {
    if(!world)return;
    if(planted!==world.structures){
      planted=world.structures;
      const plots=plantedFootprints(planted);
      scene.userData.homesteadPlots=plots;
      pruneUnderstory?.(plots);
    }
    readCuts(true);
    if(chips.visible){
      const age=Math.max(0,(performance.now()-burstAt)/1000);
      chips.visible=age<.46;
      for(let i=0;i<chips.children.length && chips.visible;i++){
        const a=i*2.40,s=.13+(.61+.11*(i%3))*age;
        const chip=chips.children[i];
        chip.position.set(Math.cos(a)*s,Math.max(-.40,(1.28+i*.09)*age-6*age*age),Math.sin(a)*s);
        chip.rotation.set(i+age*2.1,age*3.5,age*5.8);
      }
    }
    if(!world.structures.length && !stumps.size && !resident.size)return;
    const visible=new Set();
    for(const s of world.structures)draw(s,s.kind,eye,visible);
    // Eligible woods are inland, so their cell neighbourhood never straddles
    // the world seam. Wrap the eye before sampling the sparse stump index.
    if(stumps.size){
      const x=wrapDelta(eye.x),z=wrapDelta(eye.z);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
        for(const tree of cells.get(stumpKey(x+48*i,z+48*j)) || [])draw(tree,'stump',eye,visible);
      }
    }
    for(const [id,mesh] of resident){
      if(visible.has(id))continue;
      removeGoods(mesh);mesh.removeFromParent();resident.delete(id);
    }
  }
  return {setLivingWorld,setBuildingPreview,update};
}
