import * as T from './vendor/three.module.min.js';
import { seatedGesture,rinsingPalms } from './bath-gestures.js';
import { GLTFLoader } from './vendor/GLTFLoader.min.js';
import { addKagamiOrnaments } from './kagami-ornaments.js';
import { addKagamiFern } from './kagami-fern.js';
import { addKagamiMochibana } from './kagami-mochibana.js';
import { daidai, riceFinish } from './kagami-surfaces.js';

const asset = name => new URL('./assets/actors/nikkori/' + name, import.meta.url).href;
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const riceScale = .708;
const pullExtension = 1.33 * riceScale;
const floatExtension = 3.08; // Hot spring float shape key, in the artist's model units.
// Seat the animated character into the shoulder of the wider, lower cake.
const kagamiUpperWidth = .51;
const kagamiUpperHeight = .32;
const kagamiUpperY = .34;
const kagamiCitrusY = kagamiUpperY + 2.32 * kagamiUpperHeight + .118;
let source, loading;

// All paint, the skin weights, the smile relief and the eight performances
// come from the supplied Blender files. Wait for the hero before opening play.
export function loadRiceModel() {
  if (!loading) loading = (async () => {
    const loader = new T.TextureLoader();
    const names = ['rice-color','rice-normal','bare-cheeks','expressions','rice-grain','eye-relief'];
    const [gltf, ...maps] = await Promise.all([
      new GLTFLoader().loadAsync(asset('nikkori.glb')+'?v=onsen-float'),
      ...names.map(name => loader.loadAsync(asset(name + '.webp'))),
    ]);
    for (const [i,map] of maps.entries()) {
      map.colorSpace = [0,2,3].includes(i) ? T.SRGBColorSpace : T.NoColorSpace;
      map.flipY = false;
      map.anisotropy = 4;
    }
    maps[4].wrapS = maps[4].wrapT = T.RepeatWrapping;
    source = { gltf, maps };
    return maps;
  })();
  return loading;
}

function skinMaterial(maps) {
  const [map,normalMap,bare,expressions,grain,eyeRelief] = maps;
  const material = new T.MeshPhysicalMaterial({
    map, normalMap, normalScale:new T.Vector2(.36,.36), roughness:.42,
    ior:1.41, clearcoat:.27, clearcoatRoughness:.34, specularIntensity:.56,
    sheen:.10, sheenColor:0xffe0c1, envMapIntensity:.70,
  });
  const uniforms = {
    riceBare:{value:bare}, riceFaces:{value:expressions}, riceGrain:{value:grain},
    riceEyes:{value:eyeRelief}, riceCell:{value:0}, riceSmile:{value:1},
    riceTint:{value:new T.Color(0xffffff)}, ricePull:{value:0}, mugwort:{value:0},
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRiceRest;\nvarying vec3 vRiceNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRiceRest=position; vRiceNormal=normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vRiceRest;
        varying vec3 vRiceNormal;
        uniform sampler2D riceBare, riceFaces, riceGrain, riceEyes;
        uniform float riceCell, riceSmile, ricePull, mugwort;
        uniform vec3 riceTint;
        float riceGrainAt(vec3 p) {
          // Tri-planar texture keeps the pressed grains continuous across the original UV seams.
          vec3 w=pow(abs(normalize(vRiceNormal)),vec3(4.));
          w/=max(dot(w,vec3(1.)),.001);
          vec3 q=p*vec3(3.0,3.4,3.2);
          return dot(w,vec3(texture2D(riceGrain,q.yz).r,texture2D(riceGrain,q.xz).r,texture2D(riceGrain,q.xy).r));
        }
        float herbFlecks(vec3 p) {
          // A cross section through thin slivers of leaf in the dough. Rest
          // coordinates keep them in place through the smile and stretch poses.
          vec3 at=p*10.3;
          vec3 seed=fract(floor(at)*vec3(.1031,.1030,.0973));
          seed+=dot(seed,seed.yxz+33.33);
          seed=fract((seed.xxy+seed.yzz)*seed.zyx);
          vec3 sliver=fract(at)-.5-(seed-.5)*.3;
          sliver.y+=sliver.x*(seed.x-.5)*1.5;
          sliver.z+=sliver.x*(seed.y-.5);
          float size=length(sliver*vec3(3.6,8.5,5.1));
          float aa=clamp(fwidth(size),.12,.70);
          return (1.-smoothstep(.82-aa,1.+aa,size))*(.38+.62*seed.z);
        }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        // Projection matches the Generated coordinates of the authored Blender face nodes.
        vec3 generated = (vRiceRest-vec3(-1.20950,0.,-1.07243))/vec3(2.420974,2.32001,2.14218);
        vec2 localFace=generated.xy*vec2(1.47622,2.148148)+vec2(-.237515,-.648148);
        float front = step(.68,generated.z)*step(0.,localFace.x)*step(localFace.x,1.)*step(0.,localFace.y)*step(localFace.y,1.);
        vec2 uvFace=clamp(vec2(localFace.x,1.-localFace.y),vec2(.002),vec2(.998));
        vec2 cell=(vec2(mod(riceCell,4.),floor(riceCell/4.))+uvFace)/vec2(4.,6.);
        vec4 bareSkin=texture2D(riceBare,uvFace);
        // The rig supplies the sculpted smile eyes. Around the lip, use the
        // smiling mouth painted for the reading performance on the smooth skin.
        float lip=1.-smoothstep(.69,1.,length((uvFace-vec2(.507,.57))/vec2(.15,.19)));
        float swap=max(1.-riceSmile,lip);
        float clean=front*bareSkin.a*swap;
        vec4 features=mix(texture2D(riceFaces,cell),
                          texture2D(riceFaces,(vec2(1.,5.)+uvFace)/vec2(4.,6.)),riceSmile);
        #ifdef RICE_BRUSH_PORTRAIT
        features=texture2D(riceFaces,uvFace);
        #endif
        float paint=front*features.a*swap;
        float mouthPaint=paint*(1.-smoothstep(.12,.20,abs(uvFace.x-.507)))
                              *smoothstep(.39,.46,uvFace.y);
        float grain=riceGrainAt(vRiceRest);
        float eye=texture2D(riceEyes,cell).r*front*(1.-riceSmile);
        vec3 dough=mix(diffuseColor.rgb,bareSkin.rgb,clean);
        float doughMask=smoothstep(.10,.53,dot(dough,vec3(.29,.59,.12)));
        float skinMask=doughMask*(1.-paint);
        dough=mix(dough,vec3(.99,.94,.86),.35*doughMask);
        dough*=mix(vec3(1.),riceTint,doughMask);
        dough*=1.+(grain-.5)*.07*doughMask;
        if(mugwort>.5) {
          float herbs=herbFlecks(vRiceRest);
          float kneaded=riceGrainAt(vRiceRest*.082);
          dough*=1.+skinMask*((kneaded-.52)*.31-.56*herbs);
        }
        diffuseColor.rgb=mix(dough,features.rgb,paint);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+(grain-.5)*.27*skinMask-.19*(1.-skinMask)+.055*ricePull,.23,.78);
        roughnessFactor=mix(roughnessFactor,.87,mouthPaint);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal=normalize(mix(normal,nonPerturbedNormal,clean));
        // Fade detail at distance through the mip chain. Derivatives are in view space.
        #ifdef KAGAMI_STARCH
          const float grainRelief=.00016;
        #else
          const float grainRelief=.00165;
        #endif
        float height=(grain-.5)*grainRelief*skinMask + .008*eye;
        vec3 qx=dFdx(-vViewPosition), qy=dFdy(-vViewPosition);
        vec3 rx=cross(qy,normal), ry=cross(normal,qx);
        float det=dot(qx,rx);
        normal=normalize(max(abs(det),1.e-10)*normal-sign(det)*(dFdx(height)*rx+dFdy(height)*ry));`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        // Keep the tongue and dark inner lip matte beneath the glossy skin.
        material.specularColor*=1.-.95*mouthPaint;
        material.specularF90*=1.-.95*mouthPaint;
        material.clearcoat*=1.-mouthPaint;`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.indirectDiffuse += diffuseColor.rgb*vec3(.12,.105,.087)*skinMask;`);
  };
  return { material, uniforms };
}

// Cut above the rigged hands and turn the unexposed underside into a rounded
// chin. Intersect the original triangles so the upper cheeks, UV seams and lip
// bed remain precisely those of the player, even in a close side portrait.
function riceBust(src) {
  const cut=1.075, ids=new Map(), xyz=[], uv=[], normals=[], indices=[];
  const pos=src.attributes.position, tex=src.attributes.uv, norm=src.attributes.normal;
  const va=new T.Vector3(),vb=new T.Vector3();
  function vertex(a,b=a,t=0){
    const key=a===b?a:Math.min(a,b)+'/'+Math.max(a,b);
    if(ids.has(key))return ids.get(key);
    const id=xyz.length/3;ids.set(key,id);
    for(const [array,attr] of [[xyz,pos],[normals,norm]]){
      va.fromBufferAttribute(attr,a).lerp(vb.fromBufferAttribute(attr,b),t);
      if(attr===norm)va.normalize();
      array.push(va.x,va.y,va.z);
    }
    uv.push(T.MathUtils.lerp(tex.getX(a),tex.getX(b),t),T.MathUtils.lerp(tex.getY(a),tex.getY(b),t));
    return id;
  }
  const rings=new Map(),levels=9;
  function ring(start){
    if(rings.has(start))return rings.get(start);
    const row=[],x=xyz[start*3],z=xyz[start*3+2];
    for(let j=0;j<=levels;j++){
      const a=j/levels*Math.PI*.5,r=Math.cos(a),y=-.64*Math.sin(a);
      row.push(xyz.length/3);xyz.push(x*r,cut+y,z*r);
      va.set(x*r/1.21**2,y/.64**2,z*r/1.08**2).normalize();
      normals.push(va.x,va.y,va.z);
      // Sample unprinted rice on the reverse of the albedo sheet. Projecting
      // the cut edge's UVs straight down would drag the painted mouth onto the collar.
      uv.push(.23+.13*x*r,.21+.15*z*r);
    }
    rings.set(start,row);return row;
  }
  const ix=src.index.array;
  for(let i=0;i<ix.length;i+=3){
    const clipped=[];let enter,leave;
    for(let k=0;k<3;k++){
      const a=ix[i+k],b=ix[i+(k+1)%3],ya=pos.getY(a),yb=pos.getY(b);
      if(ya>=cut)clipped.push(vertex(a));
      if((ya>=cut)===(yb>=cut))continue;
      const edge=vertex(a,b,(cut-ya)/(yb-ya));clipped.push(edge);
      if(ya>=cut)leave=edge;else enter=edge;
    }
    for(let k=1;k<clipped.length-1;k++)indices.push(clipped[0],clipped[k],clipped[k+1]);
    if(enter===undefined)continue;
    const left=ring(enter),right=ring(leave);
    for(let j=0;j<levels;j++){
      indices.push(left[j],right[j],right[j+1]);
      if(j<levels-1)indices.push(left[j],right[j+1],left[j+1]);
    }
  }
  const g=new T.BufferGeometry();
  for(const [name,data,n] of [['position',xyz,3],['normal',normals,3],['uv',uv,2]])
    g.setAttribute(name,new T.Float32BufferAttribute(data,n));
  g.setIndex(indices);g.computeBoundingSphere();return g;
}

let residentSkin;
const residentMaterials=new Map();
export function dressedRiceFace(kind,capacity=0,portrait=null) {
  const face=capacity ? new T.InstancedMesh(new T.BufferGeometry(),undefined,capacity) : new T.Mesh();
  face.name='にっこり餅の面相';face.castShadow=true;face.visible=false;
  if(capacity){face.frustumCulled=false;face.instanceMatrix.setUsage(T.DynamicDrawUsage);}
  function fit(){
    const original=source.gltf.scene.getObjectByName('Nikkori');
    residentSkin??=riceBust(original.geometry);
    const costume=portrait||kind;
    if(!residentMaterials.has(costume)){
      const {material,uniforms}=skinMaterial(source.maps);
      const gestures=['Warm','Read','Surprise','Normal','Warm','Read','Normal'];
      uniforms.riceSmile.value=0;
      uniforms.riceCell.value=original.userData.faceCues[gestures[kind]][0][1];
      uniforms.riceTint.value.set(kind===3?'#dce6ae':kind===4?'#f2d3a4':'#fff9ec');
      if(portrait){
        material.defines={...material.defines,RICE_BRUSH_PORTRAIT:1};
        uniforms.riceFaces.value=portrait;
        uniforms.riceTint.value.set(portrait.userData.riceTint ?? '#e4d7b7');
        material.roughness=.66;material.clearcoat=.09;
      }
      residentMaterials.set(costume,material);
    }
    face.material.dispose();
    face.geometry.dispose();
    face.geometry=residentSkin;face.material=residentMaterials.get(costume);face.visible=true;
  }
  if(source)fit();
  else loadRiceModel().then(fit,()=>{}); // The boot screen owns the shared loading error.
  return face;
}

function palmSamples(body, hand) {
  // Probe the front and back of the actual mitt. Their midpoint stays inside
  // the palm when the air-stretch morph pulls the skin away from its bone.
  const { position, skinIndex, skinWeight } = body.geometry.attributes;
  const joint = body.skeleton.bones.indexOf(hand);
  let front, back, top;
  for (let i = 0; i < position.count; i++) {
    if (skinIndex.getX(i) !== joint || skinWeight.getX(i) < .72) continue;
    if (front === undefined || position.getZ(i) > position.getZ(front)) front = i;
    if (back === undefined || position.getZ(i) < position.getZ(back)) back = i;
    if (top === undefined || position.getY(i) > position.getY(top)) top = i;
  }
  return { front, back, top };
}

// Locate the support on the deforming rice mitt. Its wrist bone can be well
// inside the cheek when the dough stretches or the traveller reaches first.
export function placeRiceGrip(r,side,marker){
  const samples=r.storyPalmSamples ??= [];
  const sample=samples[side] ??= palmSamples(r.body,r.hands[side]);
  if(sample.top===undefined)return;
  const work=r.storyPalmPoints ??= [new T.Vector3(),new T.Vector3()];
  const [p,q]=work;
  r.model.parent.updateWorldMatrix(true,false);
  r.model.updateMatrixWorld(true);
  r.body.getVertexPosition(sample.top,p);
  r.body.getVertexPosition(sample.front,q);
  p.lerp(q,.32);
  marker.position.copy(marker.parent.worldToLocal(r.body.localToWorld(p)));
  // The action director may solve the wrist again after the feet move or
  // the tray meets its rim. Start each solve from this frame's gait pose.
  const hand=r.hands[side];
  let workPose=marker.userData.storyWorkPose;
  if(!workPose){
    workPose={chest:r.chest.position.clone(),turn:r.chest.quaternion.clone(),wrist:hand.position.clone()};
    marker.userData.storyWorkPose=workPose;
    marker.userData.storyAim=reach=>{
      r.chest.position.copy(workPose.chest);r.chest.quaternion.copy(workPose.turn);hand.position.copy(workPose.wrist);
      reachRiceGrip(r,side,marker,reach);
      return marker.getWorldPosition(new T.Vector3());
    };
  }
  workPose.chest.copy(r.chest.position);workPose.turn.copy(r.chest.quaternion);workPose.wrist.copy(hand.position);
}

// Keep the feet planted when accepting a broad tray. The chest first leans
// towards the far rim, then the soft mitt covers the remaining handspan.
export function reachRiceGrip(r,side,marker,reach){
  const hand=r.hands[side],chest=r.chest;
  const point=new T.Vector3(),from=marker.getWorldPosition(new T.Vector3());
  if(reach.handoff){
    const rotation=chest.quaternion.clone(),parent=chest.parent;
    const delta=parent.worldToLocal(reach.point.clone()).sub(parent.worldToLocal(from.clone()));
    const unit=parent.getWorldScale(new T.Vector3()).x;
    // Stretch up from the planted feet at a high counter. The chest raises
    // the face and both mitts together before the working wrist unfolds.
    chest.position.y+=T.MathUtils.clamp(delta.y-.22/unit,0,.23/unit)*reach.strength;
    const shift=delta.clampLength(0,.20/unit).multiplyScalar(reach.strength);
    chest.position.addScaledVector(shift,.66);
    const lateral=Math.atan2(shift.x,Math.max(.01,.7/unit)),forward=Math.atan2(shift.z,Math.max(.01,.7/unit));
    chest.rotateZ(-lateral*.6);chest.rotateX(forward*.6);
    chest.updateWorldMatrix(true,true);
    // A sideways roll that would pull the near mitt away is unnecessary.
    if(marker.getWorldPosition(point).distanceTo(reach.point)>from.distanceTo(reach.point))chest.quaternion.copy(rotation);
  }
  const space=hand.parent,scale=space.getWorldScale(point).x;
  const residual=space.worldToLocal(reach.point.clone()).sub(space.worldToLocal(marker.getWorldPosition(point)));
  const upward=reach.handoff?T.MathUtils.clamp((reach.point.y-from.y-.18)*.40,0,.13):0;
  const length=reach.taste?.56:reach.handoff?.38+upward:.30;
  hand.position.addScaledVector(residual.clampLength(0,length/Math.max(.01,scale)),reach.strength);
}

// Seat the prop against the moving palm, including the rice skin's soft stretch.
export function gripChayaServing(r,item,cup){
  r.teaGrip ??= {sample:palmSamples(r.body,r.hands[1]),palm:new T.Vector3(),back:new T.Vector3()};
  const {sample,palm,back}=r.teaGrip;
  r.model.parent.updateWorldMatrix(true,false);
  r.model.updateMatrixWorld(true);
  r.body.getVertexPosition(sample.front,palm);
  r.body.getVertexPosition(sample.back,back);
  palm.lerp(back,.5);
  item.parent.worldToLocal(r.body.localToWorld(palm));
  // The cup rests on its foot in the mitt. The skewer is held by the bare end.
  back.set(cup?.075:-.14,cup?-.15:-.17,cup?-.035:0);
  item.position.copy(palm).sub(back.multiply(item.scale).applyQuaternion(item.quaternion));
}

// Read the actual mitt after the seated pose has compressed the belly. The
// wooden ladle follows the palm as it turns to pour over the other shoulder.
export function gripRinsingLadle(r,player){
  r.rinseGrip??={sample:palmSamples(r.body,r.hands[1]),palm:new T.Vector3(),back:new T.Vector3()};
  const {sample,palm,back}=r.rinseGrip;
  r.model.updateWorldMatrix(true,true);
  r.body.getVertexPosition(sample.front,palm);r.body.getVertexPosition(sample.back,back);
  r.body.localToWorld(palm.lerp(back,.5));
  rinsingPalms.set(player,palm);
}

function kagamiLayers(r) {
  const parent=r.model.parent;
  const stack = new T.Group();
  stack.name='鏡餅・福重ね';
  parent.add(stack);
  const points = [[0,.02],[.40,.025],[.67,.07],[.82,.17],[.86,.29],[.83,.39],[.72,.47],[.47,.52],[0,.53]];
  const profile=new T.SplineCurve(points.map(p=>new T.Vector2(...p))).getPoints(38);
  const base=new T.LatheGeometry(profile,72);
  const pos=base.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const angle=Math.atan2(x,z), ripple=1+.010*Math.cos(3*angle+y*7)+.006*Math.sin(5*angle-y*4);
    pos.setXYZ(i,x*ripple,y,z*ripple);
  }
  // Preserve the lathe's smooth normal across its UV seam.
  const bottom=new T.Mesh(base,riceFinish());
  bottom.receiveShadow=true;
  bottom.castShadow=true;
  bottom.scale.z=.94;
  stack.add(bottom);
  const ornaments=new T.Group();
  stack.add(ornaments);
  addKagamiFern(ornaments);
  addKagamiMochibana(ornaments);
  const wands=addKagamiOrnaments(ornaments);
  const citrus=daidai();
  citrus.scale.setScalar(.91);
  stack.add(citrus);
  stack.visible=false;
  return { stack, citrus, wands, ornaments, lower:bottom, lowerSkin:bottom.material, lowerColor:bottom.material.color.clone(),
    upperSkin:riceFinish(r.plainSkin), wind:0, windPhase:0,
    stroke:0, spread:0, toStack:new T.Matrix4(), palmBack:new T.Vector3() };
}

function poseGohei(r, speed, stride, step, beat, dt) {
  const kagami = r.kagami;
  // The steady load trails the paper behind the walker. The other two shapes
  // carry a wave from the tied edge to the free tip as that load rises or decays.
  const airflow = .65 * smooth(speed, .05, 4.5) + .35 * smooth(speed, 2, 19.2);
  const response = airflow > kagami.wind ? 5 : 3.8;
  kagami.wind = T.MathUtils.damp(kagami.wind, airflow, response, dt);
  if (airflow === 0 && kagami.wind < .001) kagami.wind = 0;
  kagami.windPhase = (kagami.windPhase + dt * (5.5 + 3.1 * kagami.wind)) % (4 * Math.PI);
  const gust = kagami.wind * (.90 + .10 * Math.sin(kagami.windPhase * .5));
  const angle = 2*Math.PI*(1-beat);
  const flutter = Math.sin(Math.PI*beat);
  // Apply the shape keys and four skin weights exactly as for the painted body.
  // Work in the stack's coordinates so ground, mount and camera transforms
  // cannot be counted twice or compress the rigid little wooden shafts.
  r.model.parent.updateWorldMatrix(true,false);
  r.model.updateMatrixWorld(true);
  kagami.toStack.copy(r.model.parent.matrixWorld).invert().multiply(r.body.matrixWorld);
  for (const [i,wand] of kagami.wands.entries()) {
    const side=i?1:-1;
    const palm=wand.group.position;
    wand.palm ??= palmSamples(r.body,r.hands[i]);
    r.body.getVertexPosition(wand.palm.front,palm);
    r.body.getVertexPosition(wand.palm.back,kagami.palmBack);
    palm.lerp(kagami.palmBack,.5).applyMatrix4(kagami.toStack);
    // Pivot the staff in the existing palm. A little forward pitch on the
    // upstroke lets the shaft clear the rising cheek without extending the arm.
    wand.group.rotation.set(side*step*stride*.09+.28*kagami.spread+.45*Math.max(0,kagami.stroke),0,
      side*(.06 + .26*kagami.spread + .97*kagami.stroke));
    const w=wand.strips.morphTargetInfluences;
    w[0]=Math.max(kagami.wind,.48*kagami.spread);
    w[1]=T.MathUtils.lerp(gust*Math.sin(kagami.windPhase),Math.sin(angle),flutter);
    w[2]=T.MathUtils.lerp(gust*Math.cos(kagami.windPhase),Math.cos(angle),flutter);
  }
}

export function makeRiceModel(parent) {
  const { gltf, maps } = source;
  const model = gltf.scene.clone(true);
  model.scale.setScalar(riceScale);
  parent.add(model);
  const body=model.getObjectByName('Nikkori');
  const skeleton=body.skeleton.clone();
  skeleton.bones=body.skeleton.bones.map(bone=>model.getObjectByName(bone.name));
  body.bind(skeleton,body.bindMatrix);
  const {material,uniforms}=skinMaterial(maps);
  body.material=material;
  body.castShadow=true;
  body.receiveShadow=false;
  body.frustumCulled=false;
  const mixer=new T.AnimationMixer(model);
  const actions = Object.fromEntries(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
  // Return the skeleton to its bind pose as the dough flows. The standing
  // bath gesture folds the hips, which would pinch the long reclining body.
  actions.Float=mixer.clipAction(new T.AnimationClip('Float',2,[]));
  const legs=['Foot_R','Foot_L'].map(name=>model.getObjectByName(name));
  const hands=['Hand_R','Hand_L'].map(name=>model.getObjectByName(name));
  const chest=model.getObjectByName('Chest');
  const head=model.getObjectByName('Head');
  // Locate the painted lip on the skinned surface using the face atlas
  // projection above, then bind the contact point to the moving head.
  const positions=body.geometry.attributes.position, point=new T.Vector3(), mouth=new T.Group();
  let closest=Infinity, lip=0;
  for(let i=0;i<positions.count;i++){
    if(positions.getZ(i)<.60)continue;
    const d=(positions.getX(i)-.012)**2+(positions.getY(i)-1.165)**2;
    if(d<closest){closest=d;lip=i;}
  }
  mouth.name='配達人の口元';
  point.fromBufferAttribute(positions,lip);point.z+=.025;
  mouth.position.copy(head.worldToLocal(body.localToWorld(point)));
  head.add(mouth);
  const bones=[...legs,...hands,chest,head];
  const samples=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
  return { model,body,uniforms,mixer,actions,legs,hands,chest,head,bones,samples,
    plainSkin:material, kagami:null, faceCues:body.userData.faceCues, clip:null,
    step:0,press:0,velocity:0,pull:0,pullV:0,smile:1 };
}

const poses = { curious:'Normal',calm:'Warm',sleepy:'Drowsy',bath:'Bathe',
  hurt:'Bump',determined:'Bump',calling:'Notify',surprise:'Surprise',blush:'Warm',eating:'Read' };
const tints = {normal:new T.Color(0xffffff),kusa:new T.Color('#acc58f'),kinako:new T.Color('#f1c38a')};
function playGesture(r,name,dt,face=name,sample) {
  for (let i=0;i<r.bones.length;i++){
    r.bones[i].position.copy(r.samples[i].p);
    r.bones[i].quaternion.copy(r.samples[i].q);
  }
  if(sample){
    // A replay can visit the same instant for the two lenses or for a wrist
    // solve. Evaluate its authored clock without advancing the mixer again.
    if(r.clip!==name){
      r.mixer.stopAllAction();r.actions.Normal.reset().play();
      if(name!=='Normal')r.actions[name].reset().play();
      r.clip=name;
    }
    const weight=name==='Normal'?1:sample.weight;
    const idle=r.actions.Normal,action=r.actions[name];
    idle.setEffectiveWeight(1-weight);idle.time=sample.time%idle.getClip().duration;
    action.setEffectiveWeight(weight);action.time=sample.time%action.getClip().duration;
    r.mixer.update(0);
  }else if (r.clip!==name) {
    const action=r.actions[name].reset().play();
    if(r.clip) action.crossFadeFrom(r.actions[r.clip],.19,false);
    r.clip=name;
  }
  if(!sample)r.mixer.update(dt);
  for(let i=0;i<r.bones.length;i++) {
    r.samples[i].p.copy(r.bones[i].position);
    r.samples[i].q.copy(r.bones[i].quaternion);
  }
  const time=r.actions[name].time;
  let cell=0;
  for (const cue of r.faceCues[face]) {
    if (cue[0]>time) break;
    cell=cue[1];
  }
  return cell;
}

export function poseRice(r,p,t,dt,mood,bath,carryGohei=true) {
  const grounded=p.grounded!==false, ride=!!p.mount, speed=p.speed||0;
  const rolling=p.mode==='dango', stack=p.mode==='kagami';
  const stride=grounded && !ride && !p.activity && !rolling ? smooth(speed,.04,4.5) : 0;
  const pullTarget=grounded ? 0 : clamp(p.airStretch||0,0,1);
  r.step+=dt*(2.4+Math.min(14,speed*1.34));
  const step=Math.sin(r.step), plant=Math.cos(r.step*2);
  const impact=p.impact||0, landing=p.landing||0;
  const locomotion=landing>.15 ? -.17-.17*impact : landing>.045 ? .12*impact :
    (grounded ? 0 : clamp((p.vy||0)*.009,-.05,.12)) + stride*plant*.042;
  const goal=locomotion+(p.workStrain??0);
  const frame=Math.min(.12,Math.max(0,dt)), steps=Math.ceil(frame/.009);
  for(let i=0;i<steps;i++){
    const h=frame/steps;
    r.velocity=(r.velocity+(goal-r.press)*235*h)*Math.exp(-12*h);
    r.press+=r.velocity*h;
    r.pullV=(r.pullV+(pullTarget-r.pull)*252*h)*Math.exp(-16*h);
    r.pull+=r.pullV*h;
  }
  const pull=clamp(r.pull,0,1.015);
  const tug=clamp(r.pullV*.22,-.7,1);
  const dip=grounded ? smooth(-r.press,.005,.22) : 0;
  const breath=.006*Math.sin(t*2.24);
  const stretch=clamp(1+r.press+breath+.045*pull,.67,1.32);
  const joy=mood==='joy' && p.activity!=='read';
  const name=p.activity==='read' ? 'Read' : (poses[mood]||'Normal');
  const seated=seatedGesture(bath,t,p.activityTime);
  const bathFace=seated && !p.emote && (bath.action==='steam' || bath.action==='seat')?'Warm':name;
  const cell=playGesture(r,bath?'Float':name,dt,bathFace,p.gestureSample);
  const melt=bath?.melt || 0, recline=bath?.recline || 0;
  r.smile=p.gestureSample?.smile??T.MathUtils.damp(r.smile,joy?1:0,42,dt);
  r.body.morphTargetInfluences[0]=r.smile;
  r.body.morphTargetInfluences[1]=pull;
  r.body.morphTargetInfluences[2]=dip;
  r.body.morphTargetInfluences[3]=melt;
  r.uniforms.riceSmile.value=r.smile;
  r.uniforms.riceCell.value=cell;
  r.uniforms.ricePull.value=pull;
  const tint=r.uniforms.riceTint.value.copy(tints[p.mode]||tints.normal);
  // The faint sakura wash cools with the last wisps from the warm dough.
  const warmth=smooth(p.buffs?.warm || 0,0,1.8);
  tint.g*=1-.14*warmth;
  tint.b*=1-.075*warmth;
  r.uniforms.mugwort.value=Number(p.mode==='kusa');
  const inFlight=stack && !grounded && !ride && !p.activity;
  const beat=inFlight ? clamp(p.flapBeat||0,0,1) : 0;
  if (stack) {
    r.kagami ??= kagamiLayers(r);
    r.kagami.lowerSkin.color.copy(r.kagami.lowerColor).multiply(tint);
    const pulse=Math.sin(2*Math.PI*beat)*Math.sin(Math.PI*beat)**.55;
    r.kagami.stroke=T.MathUtils.damp(r.kagami.stroke,pulse,29,frame);
    r.kagami.spread=T.MathUtils.damp(r.kagami.spread,inFlight?1:0,12,frame);
  }
  for(let i=0;i<2;i++) {
    const side=i?1:-1, phase=side*step;
    const foot=r.legs[i], hand=r.hands[i];
    const lift=Math.max(0,phase)*stride;
    foot.position.y+=lift*.155;
    foot.position.z+=stride*phase*.203;
    foot.rotateX(-phase*stride*.48);
    hand.rotateX(-phase*stride*.47);
    hand.rotateZ(side*(lift*.14+pull*.035));
    // The lift reaches the mitts before the heels. Let the impulse settle
    // while the player holds a long pull, then release it on the rebound.
    hand.position.x+=side*(.040*pull+.029*Math.max(0,tug));
    hand.position.y+=.047*pull+.055*Math.max(0,tug);
    if(bath){
      // Slide the palms up beside the cheeks and let the little toes surface.
      hand.position.x+=side*.065*recline;
      hand.position.y+=(.28+.025*Math.sin(t*1.9+side))*recline;
      hand.position.z+=.09*recline;
      foot.position.z+=(.13+.025*side*Math.cos(t*1.9))*recline;
    }
    if(seated){
      const {beat,reach,lift,wipe}=seated,q=bath.settle,action=bath.action;
      let forward=.18,toe=.24,spread=.02,handsUp=.035,handsIn=.10,handsAhead=.14;
      if(action==='rinse'){
        forward=.27;toe=.36;
        if(i===1){
          handsIn=.10*reach-.04*lift;handsUp=.025+.065*reach+.19*lift;
          handsAhead=.075+.16*reach+.065*lift;
        }else{handsIn=.11+.12*wipe;handsUp=.055+.12*wipe;handsAhead=.095+.073*wipe;}
      }else if(action==='jar'){
        // Crook the elbows over the narrow round ceramic rim.
        forward=.075;toe=.13;spread=-.08;handsIn=-.17;handsUp=.12+.027*beat;handsAhead=.13;
      }else if(action==='steam'){
        forward=.32;toe=.36;
        handsIn=i?.22+.20*wipe:.17;handsUp=i?.10+.42*wipe:.04;handsAhead=i?.20+.12*wipe:.22;
      }else if(action==='cascade' || action==='bamboo'){
        // Under the heavy fall one mitt kneads a shoulder. Under the three
        // light bamboo jets both palms open to the water and turn with it.
        const heavy=action==='cascade';
        forward=heavy?.11:.16;spread=heavy?.10:.05;toe=.20;
        handsIn=heavy?(i?.62:.13):.23;handsUp=heavy?(i?.34+.10*beat:.075):.20+.13*(i?beat:1-beat);
        handsAhead=heavy?(i?.26:.18):.28;
      }else if(action==='deep'){
        forward=.09;toe=.12;handsIn=.19;handsUp=.29+.05*beat;handsAhead=.19;
      }else{
        handsAhead=.18+.02*beat;handsIn=.14;
      }
      foot.position.x+=side*spread*q;foot.position.z+=forward*q;foot.rotateX(-toe*q);
      hand.position.x-=side*handsIn*q;hand.position.y+=handsUp*q;hand.position.z+=handsAhead*q;
      hand.rotateX(-(.08+handsAhead*.40)*q);hand.rotateZ(side*handsIn*.49*q);
    }
    if (!grounded || ride) {
      foot.position.y+=(ride ? .053 : .080);
      foot.position.z+=(ride ? .132 : .058);
      foot.rotateX(ride?-.23:.27);
    }
    if (p.skiff) {
      // Sit on the thwart with the heels forward and both mitts in the lap.
      foot.position.z+=.24;
      foot.position.x+=side*.035;
      foot.rotateX(-.29);
      hand.position.x-=side*.16;
      hand.position.z+=.17;
      hand.rotateX(-.16);
    }
    if (p.activity==='chaya') {
      foot.position.z+=.13;
      foot.rotateX(-.26);
      if(i===1){
        const lift=.5+.5*Math.sin(t*(mood==='joy'?4.3:3.7));
        hand.position.x-=.17+.12*lift;
        hand.position.y+=.17+.28*lift;
        hand.position.z+=.24+.1*lift;
      }
    }
    if (p.activity==='eat' || p.activity==='drink' || p.activity==='tsukimi') {
      const sip=.5+.5*Math.sin(t*4.2);
      hand.position.z+=.17+.07*sip;
      hand.position.x-=side*(side>0?.20:.09);
      hand.position.y+=side>0?.09*sip:0;
    }
    if (rolling) {
      foot.position.y+=.072*(1-pull);
      hand.position.x-=side*.085*(1-pull);
    }
  }
  r.chest.rotateZ(step*stride*.023+.034*pull*Math.sin(t*3.8));
  if(seated){
    const q=bath.settle;
    r.chest.rotateX(seated.bow*.62*q);
    r.head.rotateX((bath.action==='deep'?-.17:bath.action==='steam'?-.12+seated.wipe*.08:
      bath.action==='rinse'?seated.reach*.15-seated.lift*.12:seated.bow*.47)*q);
    r.head.rotateZ((seated.roll*.55+(bath.action==='rinse'?-.09*seated.wipe:0))*q);
  }
  if(stack){
    r.kagami.stack.visible=true;
    r.body.material=r.kagami.upperSkin;
    const upperHeight=kagamiUpperHeight+.26*recline;
    r.model.scale.set(kagamiUpperWidth+.10*recline,upperHeight,kagamiUpperWidth);
    r.model.position.y=kagamiUpperY;
    r.kagami.citrus.position.set(.013,kagamiCitrusY+2.32*(upperHeight-kagamiUpperHeight)+
      upperHeight*(1.33*pull+floatExtension*melt),-.01);
    r.kagami.citrus.rotation.z=.09+step*stride*.07;
    for(const wand of r.kagami.wands) wand.group.visible=carryGohei;
    if(carryGohei) poseGohei(r, !ride && !p.activity ? speed : 0, stride, step, beat, frame);
  }else{
    if(r.kagami && r.kagami.stack.visible) {
      r.kagami.stack.visible=false;
      r.kagami.wind=0;
      r.kagami.windPhase=0;
      r.kagami.stroke=0;
      r.kagami.spread=0;
    }
    r.body.material=r.plainSkin;
    r.model.position.y=0;
    r.model.scale.setScalar(riceScale);
  }
  const floatDraw=floatExtension*melt*r.model.scale.y;
  const floatLength=r.model.position.y+2.32*r.model.scale.y+floatDraw;
  return {stretch,width:1/Math.sqrt(stretch),pull,seated,extension:pullExtension*pull,floatDraw,floatLength,
    bob:Math.abs(step)*stride*.046,lean:-step*stride*.040-.028*tug,
    pitch:stride*(-.036+plant*.023)-.045*tug,breath};
}
