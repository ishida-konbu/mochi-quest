// Transient food and tools live in the same metric worktop frame as the hands.
// Only the resulting recipe and tray count go into the player's pack.
import * as T from './vendor/three.module.min.js';
import { cookingAtlas } from './cooking-atlases.js';
import { MORTAR_PROFILE } from './festival.js';
import { regionalVessel } from './story-tableware.js';
import { createStoryFood } from './story-crafts.js';
import { makeCookingServing } from './living-craft-art.js';
import { normalizeRecipe, traditionFor } from './living-craft.js';
import { createSteam, steamSource } from './steam.js';
import { makeMallet, makeLid, makeBowl, makePaddle, makeBoard, makePrepDish, ingredientStudy, makeSteamingCloth } from './cooking-prop-models.js';

const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp;
const mortar=[-.68,1.097,0], board=[-.04,.797,.27], plate=[-1.48,.785,.10];
const tint={azuki:'#a06b64',herb:'#829960',soy:'#caa577',sakura:'#cb9298',sesame:'#988e7f'};
const traditionalModels = new Map(), innerProfile=MORTAR_PROFILE.slice(10).reverse();
const jig=new T.Object3D(), point=new T.Vector3(), target=new T.Vector3();
let kernelGeometry;
const pi=Math.PI;
function kernel() {
  if(kernelGeometry) return kernelGeometry;
  // Short glutinous rice swells into a plump oval. The dimple at its germ
  // catches the light along one of the long sides.
  const g=new T.SphereGeometry(1,8,6), pos=g.attributes.position;
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const notch=Math.exp(-((x+.63)**2*12+(z-.52)**2*7));
    pos.setXYZ(i,x*(1-.07*z),y*(1-.17*notch),z+.045*x*x);
  }
  g.computeVertexNormals();
  return kernelGeometry=g;
}
function grainCloud(brown, cooked, count, width, height) {
  const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:cooked?.39:.79});
  const cloud=new T.InstancedMesh(kernel(),mat,count);
  const base=new T.Color(brown?'#ceb17e':cooked?'#fff9e9':'#f9f4e6'), col=base.clone();
  for(let i=0;i<count;i++) {
    // Concentric basal layers make the rice dense at the edge and at the crown.
    const layer=i%3, a=(i+.17)*2.39996, r=Math.sqrt(((i*.75487766+.07)%1))*(1-.11*layer);
    const y=height*(.38+.57*Math.sqrt(1-r*r))+(layer-1)*.0025;
    jig.position.set(width*r*Math.cos(a),.004+y,width*r*Math.sin(a));
    const size=(.83+.25*((i*.381966)%1))*(cooked?1.10:1);
    jig.scale.set(.0051*size,.00265*size,.00315*size);
    jig.rotation.set(.42*Math.sin(i*7),a+.46*Math.sin(i*13),.51*Math.cos(i*5));
    jig.updateMatrix();cloud.setMatrixAt(i,jig.matrix);
    col.copy(base).multiplyScalar(.88+.16*((i*.4142)%1));cloud.setColorAt(i,col);
  }
  cloud.computeBoundingSphere();
  cloud.castShadow=cloud.receiveShadow=true;
  return cloud;
}
function ricePaint(brown) {
  return new T.MeshStandardMaterial({map:cookingAtlas('ingredients'),color:brown?'#d4ad7d':'#fffdf6',roughness:.40});
}
function cavityRadius(y) {
  const rel=(y-.76)/.72;
  const inner=innerProfile;
  for(let i=1;i<inner.length;i++) {
    const [r0,h0]=inner[i-1],[r1,h1]=inner[i];
    if(rel<=h1)return .72*(r0+clamp((rel-h0)/(h1-h0),0,1)*(r1-r0));
  }
  return .29;
}
function makeDough(draft, radius, height, inMortar) {
  const geo=new T.SphereGeometry(1,48,26), p=geo.attributes.position, uv=geo.attributes.uv;
  const pressed=[], folded=[];
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i), h=(y+1)*.5;
    const wave=.025*Math.sin(5*x+4*z)+.017*Math.sin(11*z-3*x);
    const r=radius*(1+wave);
    const profile=(scale,hp)=>{
      const span=Math.hypot(x,z)*r*scale;
      const edge=inMortar && span>0? Math.min(1,Math.max(.008,cavityRadius(mortar[1]+hp)-.004)/span):1;
      return [x*r*scale*edge,hp,z*r*scale*edge];
    };
    const plain=profile(1,height*h+.0018*Math.sin(9*x+5*z)*Math.sin(pi*h));
    const c=Math.exp(-(x*x+z*z)*3);
    const dent=profile(1+.16*h,height*h*(1-.48*h*c)-.001*h);
    const fold=profile(1-.15*h,height*h*(1+.27*h));
    p.setXYZ(i,...plain);
    pressed.push(...dent);folded.push(fold[0],fold[1],fold[2]+.016*h*h);
    uv.setXY(i,(.52+.44*x)/4,(3.5+.44*z)/4);
  }
  geo.computeVertexNormals();
  geo.morphAttributes.position=[new T.Float32BufferAttribute(pressed,3),new T.Float32BufferAttribute(folded,3)];
  for(const attr of geo.morphAttributes.position) {
    const alternate=new T.BufferGeometry();alternate.setIndex(geo.index);alternate.setAttribute('position',attr);
    alternate.computeVertexNormals();
    (geo.morphAttributes.normal??=[]).push(alternate.attributes.normal);
  }
  const mesh=new T.Mesh(geo,ricePaint(draft.base==='brownRice'));
  mesh.castShadow=mesh.receiveShadow=true;
  return mesh;
}

// A small neck of wet rice follows the striking face before it tears free.
function stickyNeck(recipe) {
  const rows=10,sides=12,points=new Float32Array((rows+1)*(sides+1)*3),indices=[],uv=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){
    const k=j*(sides+1)+i;
    uv.push((.1+.8*i/sides)/4,(3.1+.8*j/rows)/4);
    if(i<sides && j<rows)indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);
  }
  const geometry=new T.BufferGeometry();geometry.setIndex(indices);
  const position=new T.BufferAttribute(points,3).setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',position);geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const mesh=new T.Mesh(geometry,ricePaint(recipe.base==='brownRice'));
  mesh.name='杵の端からのびる餅';mesh.frustumCulled=false;
  return {mesh,update(frame,tool,paste){
    const pull=frame.food.stretch??0;
    mesh.visible=pull>.015;if(!mesh.visible)return;
    const end=point.set(.162,-.003,0).applyMatrix4(tool.matrix);
    const r=clamp(Math.hypot(end.x-mortar[0],end.z-mortar[2])/.187,0,1);
    const h=(1+Math.sqrt(1-r*r))*.5;
    const surface=mortar[1]+.129*paste.scale.y*h*(1-.48*h*Math.exp(-3*r*r)*frame.food.compression);
    const height=end.y-surface;
    mesh.visible=height>.002 && height<.14;if(!mesh.visible)return;
    mesh.position.set(end.x-.012,surface,end.z-.008);
    mesh.material.color.copy(paste.material.color);
    const neck=.022*Math.sqrt(pull)*Math.min(1,(.14-height)/.045);
    for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){
      const t=j/rows,a=2*pi*i/sides,w=neck*(1-.78*Math.sin(pi*t)**.64);
      position.setXYZ(j*(sides+1)+i,.012*t+w*Math.cos(a),height*t,.008*t+w*.74*Math.sin(a));
    }
    position.needsUpdate=true;geometry.computeVertexNormals();
  }};
}

function prepDishes(draft,group) {
  const ingredients=[...draft.fillings];
  if(draft.seasoning!=='none') ingredients.push({id:draft.seasoning,amount:draft.seasoningAmount,placement:'mixed'});
  return ingredients.map((ingredient,index)=>{
    const raw=ingredientStudy(ingredient.id,ingredient.amount,false);
    const prepared=ingredientStudy(ingredient.id,ingredient.amount,true);
    const holder=new T.Group();
    holder.add(raw,prepared);
    const dish=makePrepDish(), home=[-.175+index*.107,.76,.045];
    dish.position.fromArray(home);
    const pinch=prepared.clone();
    pinch.name='指でつまんだ'+ingredient.id;
    group.add(holder,dish,pinch);
    return {ingredient,holder,raw,prepared,home,pinch,index};
  });
}
function servingParts(recipe) {
  const serving=makeCookingServing(recipe);
  const traditional=traditionFor(recipe);
  let cake;
  if(traditional) {
    if(!traditionalModels.has(traditional.number)) {
      const original=createStoryFood(traditional.number);
      const food=original.children[1];
      food.position.set(0,0,0);
      traditionalModels.set(traditional.number,food);
    }
    cake=traditionalModels.get(traditional.number);
  }
  const fillings=recipe.fillings.filter(f=>f.placement==='inside');
  const center=new T.Group();
  for(const [i,f] of fillings.entries()) {
    const filling=ingredientStudy(f.id,f.amount,true);
    filling.position.set((i-(fillings.length-1)*.5)*.032,0,0);
    center.add(filling);
  }
  return Array.from({length:4},(_,i)=>{
    const raw=i ? serving.group.clone() : serving.group, portion=new T.Group();
    if(i && recipe.finish==='grill') raw.children[0].material=serving.browningPaint(i);
    const canonical=cake?.clone();
    if(canonical) portion.add(canonical);
    const centerFilling=center.clone();
    portion.add(raw,centerFilling);
    portion.name='取り分けた餅・'+(i+1);
    portion.traverse(n=>{if(n.isMesh) n.castShadow=n.receiveShadow=true;});
    return {portion,raw,centerFilling,skin:raw.children[0],grains:raw.children[1],top:raw.children[2],leaf:raw.children[3],canonical};
  });
}

// A small cascade consists of distinguishable damp parcels. The foot of the
// arc lands in the receiving liner/bowl while the source is tilted above it.
function grainStream(draft) {
  const material=new T.MeshStandardMaterial({color:draft.base==='brownRice'?'#ceb78b':'#ede2c5',roughness:.52});
  const mesh=new T.InstancedMesh(kernel(),material,36);
  mesh.frustumCulled=false; mesh.castShadow=true;
  mesh.name='移し入れる米粒';
  return mesh;
}
function streamPose(mesh,start,end,time,amount,raw) {
  mesh.visible=amount>.012;
  if(!mesh.visible) return;
  mesh.count=Math.max(3,Math.round(36*Math.min(1,amount*1.8)));
  for(let i=0;i<mesh.count;i++) {
    const t=(time*2.6+i*.61803)%1, spread=.021*Math.sin(pi*t), a=i*2.4;
    jig.position.set(start.x+(end.x-start.x)*t+spread*Math.cos(a),
      start.y+(end.y-start.y)*t*t+.018*Math.sin(pi*t),
      start.z+(end.z-start.z)*t+spread*Math.sin(a));
    const l=raw?1:1.42;
    jig.scale.set(.0061*l,.0029*l,.0038*l);jig.rotation.set(a,time+i,2*t);jig.updateMatrix();
    mesh.setMatrixAt(i,jig.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
}
function pileMass(mesh,amount,shape=1) {
  mesh.visible=amount>.002;
  if(mesh.visible) {
    const width=Math.cbrt(Math.min(amount,1));
    mesh.scale.set(width,width*shape,width);
  }
}

export function createCookingProps(draft) {
  const recipe=normalizeRecipe(draft);
  if(!recipe)throw new TypeError('Invalid workshop recipe');
  const group=new T.Group(),clock={value:0};
  group.name='仕込みから盛り付けまで';
  const tools={lid:makeLid(),mallet:makeMallet(),bowl:makeBowl(),paddle:makePaddle(),cloth:makeSteamingCloth()};
  group.add(...Object.values(tools));
  const choppingBoard=makeBoard();choppingBoard.position.fromArray(board);group.add(choppingBoard);
  const tray=regionalVessel(recipe.finish==='grill'?3:5);
  tray.scale.set(.98,.018/tray.userData.floor,.99);tray.position.fromArray(plate);group.add(tray);
  const rawRice=grainCloud(recipe.base==='brownRice',false,630,.126,.042);
  const rawBed=makeDough(recipe,.126,.041,false);
  rawBed.material.roughness=.78;rawRice.add(rawBed);
  rawRice.position.y=.068;tools.bowl.add(rawRice);
  const steaming=grainCloud(recipe.base==='brownRice',true,825,.163,.076);
  const cloudBase=makeDough(recipe,.164,.076,false);
  steaming.add(cloudBase);
  cloudBase.position.y=.002;
  steaming.position.y=.052;tools.cloth.add(steaming);
  const paste=makeDough(recipe,.187,.129,true);
  paste.position.fromArray(mortar);group.add(paste);
  const unsplit=makeDough(recipe,.141,.073,false);
  unsplit.position.set(-.045,.798,.29);group.add(unsplit);
  const scoop=makeDough(recipe,.092,.081,false);scoop.position.y=.016;tools.paddle.add(scoop);
  const inMortar=grainCloud(recipe.base==='brownRice',true,740,.161,.119);
  inMortar.position.set(mortar[0],mortar[1]+.012,mortar[2]);group.add(inMortar);
  const rimSources=[-.55,.91,2.36,4.17].map(a=>steamSource('steamer',
    .50+.265*Math.cos(a),1.164,.02+.265*Math.sin(a),
    {width:.067,height:.21,count:1,rx:0,rz:0,alpha:.30,diffuse:true}));
  const rimSteam=createSteam(rimSources,clock,.84);
  const sourceSteam=createSteam([steamSource('steamer',0,0,0,{width:.148,height:.41,alpha:.38,diffuse:true})],clock,.4);
  const mortarSteam=createSteam([steamSource('food',mortar[0],1.20,mortar[2],{height:.29,width:.13,alpha:.36,diffuse:true})],clock,1.82);
  group.add(sourceSteam,rimSteam,mortarSteam);
  const neck=stickyNeck(recipe);group.add(neck.mesh);
  const portions=servingParts(recipe), dishes=prepDishes(recipe,group), stream=grainStream(recipe);
  group.add(stream,...portions.map(p=>p.portion));
  const initial=paste.material.color.clone(), mixed=initial.clone();
  for(const f of recipe.fillings.filter(f=>f.placement==='mixed'))
    mixed.lerp(new T.Color(tint[f.id]),Math.min(.82,.18+f.amount*.015));
  const ownedGeometry=new Set(), ownedMaterial=new Set();
  group.traverse(n=>{
    if(n.geometry && !n.geometry.userData.sharedCooking)ownedGeometry.add(n.geometry);
  });
  // Village vessels, original regional pastries, and rice grain instances
  // all refer to cached geometry shared by the active game and the notebook.
  function keepShared(object) {
    object?.traverse(part=>ownedGeometry.delete(part.geometry));
  }
  for(const piece of portions) keepShared(piece.canonical);
  ownedGeometry.delete(kernel());
  tray.traverse(n=>ownedGeometry.delete(n.geometry));
  for(const mesh of [rawRice,rawBed,steaming,inMortar,paste,cloudBase,unsplit,scoop,neck.mesh,stream,sourceSteam,rimSteam,mortarSteam,tools.cloth])
    ownedMaterial.add(mesh.material);

  function update(frame) {
    const f=frame.food;
    const time=frame.time;
    clock.value=time;
    for(const [key,obj] of Object.entries(tools)){
      const pose=frame.tools[key];
      if(!pose) continue;
      obj.position.fromArray(pose.position);obj.rotation.set(...pose.rotation);
      obj.visible=pose.visible!==false;
      obj.updateMatrix();
    }
    const gather=f.gather??0;
    tools.cloth.morphTargetInfluences[0]=gather;
    // Spent linen slumps to the inside of the empty receiving bowl.
    const parked=clamp((1.04-tools.cloth.position.y)/.25,0,1)*clamp((.26-tools.cloth.position.x)/.33,0,1);
    tools.cloth.scale.set(1-.31*parked,1-.57*parked,1-.33*parked);
    pileMass(rawRice,f.bowlRice);
    pileMass(steaming,Math.min(1,f.steamerRice+f.clothRice),.85+.22*f.doneness);
    const steamingSize=.86+.14*f.doneness;
    steaming.scale.multiplyScalar(steamingSize);
    steaming.scale.x*=1-.19*gather;steaming.scale.z*=1-.33*gather;
    pileMass(paste,f.mortarRice);
    pileMass(inMortar,f.mortarRice);
    const grainFinish=recipe.technique==='half'?.20:.048;
    inMortar.count=Math.round(740*(1-f.smooth*(1-grainFinish)));
    paste.morphTargetInfluences[0]=clamp(f.compression,0,1);
    paste.morphTargetInfluences[1]=frame.phase==='knead'?Math.max(0,1-f.compression)*.40:0;
    paste.scale.y*=.67+.33*f.smooth;
    inMortar.scale.y*=1-.37*f.compression;
    paste.material.color.copy(initial).lerp(mixed,f.mixed);
    paste.material.roughness=.63-.25*f.smooth;
    neck.update(frame,tools.mallet,paste);
    unsplit.material.color.copy(paste.material.color);scoop.material.color.copy(paste.material.color);
    pileMass(unsplit,f.boardDough);pileMass(scoop,f.paddleDough);
    const opening=clamp((Math.hypot(tools.lid.position.x-.5,tools.lid.position.y-1.166,tools.lid.position.z-.02)-.014)/.18,0,1);
    const breath=.55+.45*(.5+.5*Math.sin(time*1.62+.31*Math.sin(time*.94)));
    const rimWarmth=f.steam*(1-opening)*breath;
    rimSteam.visible=rimWarmth>.012;rimSteam.material.uniforms.warmth.value=rimWarmth;
    const exposed=f.steam*opening*(.22+.78*Math.min(1,f.steamerRice+f.clothRice));
    sourceSteam.visible=exposed>.012;sourceSteam.material.uniforms.warmth.value=exposed;
    sourceSteam.position.set(.50,1.14,.02);
    if(f.clothRice>.03 && tools.cloth.position.y>1.10){
      sourceSteam.position.set(0,.105,0).applyMatrix4(tools.cloth.matrix);
    }
    mortarSteam.visible=f.mortarRice>.03;
    mortarSteam.material.uniforms.warmth.value=.84*f.mortarRice;
    if(f.pourRice>.002){
      point.set(0,.108,.138).applyMatrix4(tools.bowl.matrix);
      target.set(.50,1.13,.02);
      streamPose(stream,point,target,time,f.pourRice,true);
    }else if(f.tipRice>.002) {
      point.set(0,.065,.115).applyMatrix4(tools.cloth.matrix);
      target.set(-.68,1.186,0);
      streamPose(stream,point,target,time,f.tipRice,false);
    }else stream.visible=false;
    const topUsed=frame.pieces.reduce((sum,p)=>sum+p.top,0)/4;
    const fillingUsed=frame.pieces.reduce((sum,p)=>sum+p.fill,0)/4;
    dishes.forEach(({holder,raw,prepared,ingredient,home,pinch},i)=>{
      const local=clamp(f.prep*recipe.fillings.length-i,0,1);
      const active=frame.phase==='prep' && i===f.prepIndex && i<recipe.fillings.length;
      const transport=active?f.prepCarry:0;
      const left=1-(ingredient.placement==='mixed'?f.mixed:ingredient.placement==='top'?topUsed:fillingUsed);
      const p=holder.position;
      p.set(lerp(home[0],.015,transport),lerp(.770,.798,transport)+.051*Math.sin(pi*transport),lerp(home[2],.270,transport));
      if(ingredient.placement==='mixed' && frame.phase==='knead'){
        if(f.mixed>0){
          const top=mortar[1]+.129*(.67+.33*f.smooth)*(1-.45*f.compression);
          p.set(mortar[0]+.029*Math.cos(i*2.4),top-.003,mortar[2]+.032*Math.sin(i*2.4));
        }
        point.set(.019*Math.cos(i*2.4),.015,.012*Math.sin(i*2.4)).applyMatrix4(tools.paddle.matrix);
        p.lerp(point,f.mixLoad);
      }
      const held=f.pinchIndex===i?(f.pinch??0):0;
      pinch.visible=held>.002;
      if(pinch.visible){
        pinch.position.fromArray(frame.hands[0]);
        pinch.position.y-=.033;
        pinch.scale.setScalar(.50*Math.cbrt(held));
      }
      holder.visible=left>.01;
      holder.scale.setScalar((.72+.28*transport)*Math.cbrt(Math.max(.001,left)));
      raw.visible=local<.999;prepared.visible=local>.001;
      raw.scale.setScalar(1-.92*local);prepared.scale.setScalar(Math.cbrt(local));
      prepared.position.x=.016*(1-local);
    });
    portions.forEach(({portion,raw,centerFilling,skin,grains,top,leaf,canonical},i)=>{
      const piece=frame.pieces[i];portion.visible=piece.visible;
      if(!piece.visible)return;
      portion.position.fromArray(piece.position);portion.rotation.set(...piece.rotation);
      const shape=clamp(piece.shape,0,1), size=.47*Math.cbrt(piece.size);
      const disk=centerFilling.children.length>0;
      portion.scale.setScalar(size);
      raw.scale.set(lerp(disk?1.18:.78,1,shape),lerp(disk?.30:1.19,1,shape),lerp(disk?1.1:.85,1,shape));
      centerFilling.visible=disk && piece.fill>.002 && shape<.87;
      centerFilling.scale.setScalar(1.15*(1-shape*.84));
      for(const [j,part] of centerFilling.children.entries()) {
        const arrived=clamp(piece.fill*centerFilling.children.length-j,0,1);
        part.visible=arrived>.002;
        part.scale.setScalar(Math.cbrt(arrived));
      }
      centerFilling.position.y=raw.scale.y*(recipe.shape==='round'?.156:recipe.shape==='square'?.128:.094)*(1-shape*.8);
      const ready=shape>=.999 && (recipe.finish!=='grill'||piece.toast>.99)
        && (recipe.technique!=='wrap'||piece.wrap>.99) &&
        (!recipe.fillings.some(f=>f.placement==='top')||piece.top>.99);
      if(canonical) {canonical.visible=ready;raw.visible=!ready;}
      if(skin.morphTargetInfluences)skin.morphTargetInfluences[0]=piece.toast;
      const flip=piece.flip??0;
      const half=(recipe.shape==='round'?.156:recipe.shape==='square'?.128:.094)*.5;
      for(const layer of [skin,grains]){
        layer.rotation.z=flip;
        layer.position.set(half*Math.sin(flip),half*(1-Math.cos(flip)),0);
      }
      top.visible=piece.top>.001;
      top.scale.setScalar(Math.max(.01,Math.cbrt(piece.top)));
      leaf.visible=piece.wrap>.001;
      leaf.scale.set(1,Math.max(.006,piece.wrap),1);
    });
  }
  return {group, update,dispose(){
    group.removeFromParent();
    for(const mesh of [rawRice,steaming,inMortar,stream])mesh.dispose();
    for(const g of ownedGeometry)g.dispose();
    for(const m of ownedMaterial)m.dispose();
  }};
}
