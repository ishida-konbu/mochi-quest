import * as T from './vendor/three.module.min.js';
import { wrapDelta } from './terrain.js';
import { timberTree, stumpCovered } from './living-build-land.js';
import { BUILD_MODULES } from './living-build-state.js';
import { timberCut } from './homestead-timber-section.js';
import { homesteadGeometry } from './homestead-carpentry.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { foundationMembers, drawFoundationMember } from './homestead-foundation.js';
import { plantedFootprints } from './homestead-groundcover.js';
import { makePriceTag } from './homestead-price-tags.js';
import { campCover } from './camp-cover.js';
import { homesteadFinish } from './homestead-pigment.js';
import { makeCookingServing } from './living-craft-art.js';

const shared = new Map(), ranges = {building:100,stump:35,food:20};
const geometry = (kind,terrain,species) => {
  const key=kind==='stump' || (kind==='camp' && species) ? kind+'-'+species : kind+(terrain==='snow' && (kind==='roof' || kind==='hut')?'-snow':'');
  if(!shared.has(key))shared.set(key,homesteadGeometry(kind,terrain,species));
  return shared.get(key);
};
const previewColors = [0xc57561,0xc1d9c2];
function surveyFrame(kind,ok,terrain,indoors) {
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
  if(kind==='camp'){
    if(!indoors)line([-.78,0,-.72],[-.78,1.79,-.72]);
    rectangle(.57,.86,.13);
  }
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
function fitFoundation(mesh,kind,site){
  if(mesh.userData.foundationSite===site)return;
  mesh.userData.foundationSite=site;
  const key=[kind,site.parentId,site.x,site.y,site.z,site.yaw,site.foundationWood,site.entryBay].join('/');
  if(mesh.userData.foundationKey===key)return;
  removeFoundation(mesh);
  mesh.userData.foundationKey=key;
  const members=foundationMembers(kind,site);
  if(!members.length)return;
  const b=hokoraCarpentry();
  for(const member of members)drawFoundationMember(b,member);
  const frame=new T.Mesh(b.finish(),mesh.material);
  frame.name='地形に合わせた束基礎';frame.castShadow=mesh.castShadow;frame.receiveShadow=mesh.receiveShadow;
  frame.renderOrder=mesh.renderOrder;
  mesh.userData.foundation=frame;
  mesh.add(frame);
}
function removeFoundation(mesh){
  const base=mesh.userData.foundation;
  if(base){base.geometry.dispose();base.removeFromParent();delete mesh.userData.foundation;}
}
function displayedStock(stock) {
  if(!stock?.length)return [];
  const first=stock[0];
  const other=stock.find(item=>item.recipeId!==first.recipeId) || stock[1] || (first.quantity>1 && first);
  return other?[first,other]:[first];
}
function removeGoods(mesh) {
  for(const group of [...mesh.children]){
    if(group===mesh.userData.foundation || group===mesh.userData.cover)continue;
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
  let planted, worksite=null, clearedGround;
  function setConstructionSite(site) {
    worksite=site && !site.parentId ? {...site,kind:site.kind==='hut'?'floor':site.kind} : null;
    planted=null;
  }
  let occupiedBed=null;
  function setOccupiedBed(id){
    occupiedBed=id;
    for(const [key,mesh] of resident)if(mesh.userData.cover)mesh.userData.cover.visible=key!==id;
  }
  let world=null,knownCuts=null,count=0,previewInk,burstAt=0;
  const previews=[];
  let editorHidden=new Set();
  const chipD=new T.TetrahedronGeometry(.035),chipM=new T.MeshLambertMaterial({color:0xc9ab80});
  for(let i=0;i<7;i++){
    const chip=new T.Mesh(chipD,chipM);
    chip.scale.set(1.6,.24,.72);
    chips.add(chip);
  }
  chips.visible=false;group.add(chips);

  function clearResident() {
    for(const child of resident.values()){
      removeFoundation(child);removeGoods(child);child.removeFromParent();if(child.isInstancedMesh)child.dispose();
    }
    resident.clear();
  }
  function dropPreview(preview) {
    removeFoundation(preview);
    const frame=preview.children[0];
    frame.geometry.dispose();frame.material.dispose();preview.removeFromParent();
  }
  function clearPreview() {
    previews.splice(0).forEach(dropPreview);
  }
  function setBuildingPreviews(sites) {
    if(!previewInk){
      const finish=homesteadFinish();
      previewInk=previewColors.map(color=>{
        const material=finish.clone();
        material.onBeforeCompile=finish.onBeforeCompile;
        material.color.setHex(color);material.transparent=true;material.opacity=.73;
        material.side=T.FrontSide;material.depthWrite=false;material.polygonOffset=true;material.polygonOffsetFactor=-1;
        return material;
      });
    }
    let count=0;
    for(const p of sites){
      if(!p || !Object.hasOwn(BUILD_MODULES,p.kind) || ![p.x,p.y,p.z].every(Number.isFinite))continue;
      const form=[p.kind,p.terrain,Boolean(p.ok),Boolean(p.parentId)].join('/');
      let mesh=previews[count];
      if(mesh?.userData.previewForm!==form){
        if(mesh)dropPreview(mesh);
        mesh=new T.Mesh(geometry(p.kind,p.terrain,p.parentId?'indoors':undefined),previewInk[Number(Boolean(p.ok))]);
        mesh.name='仮置き・'+BUILD_MODULES[p.kind].name;
        mesh.userData.previewForm=form;
        mesh.add(surveyFrame(p.kind,p.ok,p.terrain,Boolean(p.parentId)));mesh.renderOrder=2;
        previews[count]=mesh;group.add(mesh);
      }
      mesh.position.set(p.x,p.y,p.z);mesh.rotation.y=p.yaw||0;
      fitFoundation(mesh,p.kind,p);
      count++;
    }
    previews.splice(count).forEach(dropPreview);
    return previews;
  }
  function setBuildingPreview(site) {setBuildingPreviews(site?[site]:[]);}
  function setBuildEditorHidden(ids) {
    editorHidden=new Set(ids);
    for(const s of world?.structures??[]){
      const mesh=resident.get(s.id);
      if(mesh)mesh.visible=!editorHidden.has(s.id);
    }
  }
  function getBuildEditorObjects(){
    const objects=[];
    for(const s of world?.structures??[]){
      const mesh=resident.get(s.id);
      if(mesh?.visible)objects.push({id:s.id,kind:s.kind,mesh});
    }
    return objects;
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
      if(s.checked!==clearedGround){
        s.checked=clearedGround;s.covered=stumpCovered(clearedGround,s);
      }
      if(s.covered)return;
    }
    if(d2>(stump?ranges.stump:ranges.building)**2)return;
    visible.add(s.id);
    let mesh=resident.get(s.id);
    if(!mesh){
      const stock=geometry(kind,s.terrain,stump?s.kind:s.parentId?'indoors':undefined);
      if(stump && s.cut.culms){
        mesh=new T.InstancedMesh(stock,homesteadFinish(),s.cut.culms.length);
        const stem=new T.Object3D();
        s.cut.culms.forEach((ring,i)=>{
          stem.position.set(ring.x-s.cut.x,0,ring.z-s.cut.z);
          stem.scale.set(ring.radius/.28,1,ring.radius/.28);
          stem.updateMatrix();mesh.setMatrixAt(i,stem.matrix);
        });
        mesh.computeBoundingSphere();
      } else mesh=new T.Mesh(stock,homesteadFinish());
      mesh.castShadow=mesh.receiveShadow=true;
      mesh.name=stump?'木口の残る切り株':BUILD_MODULES[kind].name;
      group.add(mesh);resident.set(s.id,mesh);
      if(stump){
        const scale=s.cut.culms?1:s.cut.radius/.31;
        mesh.position.y=s.cut.y-.42;
        mesh.scale.set(scale,1,scale);
      }
    } else if(!stump) mesh.geometry=geometry(kind,s.terrain,s.parentId?'indoors':undefined);
    mesh.position.x=viewer.x+dx;mesh.position.z=viewer.z+dz;
    if(!stump){mesh.visible=!editorHidden.has(s.id);mesh.position.y=s.y;mesh.rotation.y=s.yaw;fitFoundation(mesh,kind,s);}
    if(kind==='camp'){
      if(!mesh.userData.cover || mesh.userData.beddingGrade!==(s.beddingGrade??0)){
        mesh.userData.cover?.removeFromParent();
        mesh.userData.beddingGrade=s.beddingGrade??0;mesh.userData.cover=campCover(mesh.userData.beddingGrade);mesh.add(mesh.userData.cover);
      }
      mesh.userData.cover.visible=s.id!==occupiedBed;
    }
    if(kind==='stand')putGoods(mesh,world,world.market?.stands[s.id]?.stock,d2<ranges.food**2);
  }
  function update(time,eye) {
    if(!world)return;
    if(planted!==world.structures){
      planted=world.structures;
      clearedGround={structures:worksite ? [...planted,worksite] : planted};
      const plots=plantedFootprints(clearedGround.structures);
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
      removeFoundation(mesh);removeGoods(mesh);mesh.removeFromParent();if(mesh.isInstancedMesh)mesh.dispose();resident.delete(id);
    }
  }
  return {setOccupiedBed,setLivingWorld,setBuildingPreview,setBuildingPreviews,getBuildEditorObjects,setBuildEditorHidden,setConstructionSite,update};
}
