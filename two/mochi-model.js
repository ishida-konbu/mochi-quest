import * as T from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.min.js';

const asset = name => new URL('./assets/actors/nikkori/' + name, import.meta.url).href;
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const riceScale = .708;
const pullExtension = 1.33 * riceScale;
let source, loading;

// All paint, the skin weights, the smile relief and the eight performances
// come from the supplied Blender files. Wait for the hero before opening play.
export function loadRiceModel() {
  if (!loading) loading = (async () => {
    const loader = new T.TextureLoader();
    const names = ['rice-color','rice-normal','bare-cheeks','expressions','rice-grain','eye-relief'];
    const [gltf, ...maps] = await Promise.all([
      new GLTFLoader().loadAsync(asset('nikkori.glb')),
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
    riceTint:{value:new T.Color(0xffffff)}, ricePull:{value:0},
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
        uniform float riceCell, riceSmile, ricePull;
        uniform vec3 riceTint;
        float riceGrainAt(vec3 p) {
          // Tri-planar texture keeps the pressed grains continuous across the original UV seams.
          vec3 w=pow(abs(normalize(vRiceNormal)),vec3(4.));
          w/=max(dot(w,vec3(1.)),.001);
          vec3 q=p*vec3(3.0,3.4,3.2);
          return dot(w,vec3(texture2D(riceGrain,q.yz).r,texture2D(riceGrain,q.xz).r,texture2D(riceGrain,q.xy).r));
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
        diffuseColor.rgb=mix(dough,features.rgb,paint);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor=clamp(roughnessFactor+(grain-.5)*.27*skinMask-.19*(1.-skinMask)+.055*ricePull,.23,.78);
        roughnessFactor=mix(roughnessFactor,.87,mouthPaint);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal=normalize(mix(normal,nonPerturbedNormal,clean));
        // Fade detail at distance through the mip chain. Derivatives are in view space.
        float height=(grain-.5)*.00165*skinMask + .008*eye;
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

function kagamiLayers(parent, grain) {
  const stack = new T.Group();
  stack.name='鏡餅・福重ね';
  parent.add(stack);
  const rice = new T.MeshPhysicalMaterial({
    color:'#ebddcf',roughness:.45,clearcoat:.18,bumpMap:grain,bumpScale:.0019,
  });
  const points = [[0,.02],[.40,.025],[.67,.07],[.82,.17],[.86,.29],[.83,.39],[.72,.47],[.47,.52],[0,.53]];
  const profile=new T.SplineCurve(points.map(p=>new T.Vector2(...p))).getPoints(38);
  const base=new T.LatheGeometry(profile,72);
  const pos=base.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const angle=Math.atan2(x,z), ripple=1+.010*Math.cos(3*angle+y*7)+.006*Math.sin(5*angle-y*4);
    pos.setXYZ(i,x*ripple,y,z*ripple);
  }
  base.computeVertexNormals();
  const bottom=new T.Mesh(base,rice);
  bottom.castShadow=true;
  bottom.scale.z=.94;
  stack.add(bottom);
  const citrus=new T.Group();
  stack.add(citrus);
  const rind = new T.MeshPhysicalMaterial({
    color:'#e89024',roughness:.56,bumpMap:grain,bumpScale:.016,clearcoat:.12,
  });
  const orange=new T.Mesh(new T.SphereGeometry(.166,32,22),rind);
  orange.scale.set(1.04,.88,1);
  citrus.add(orange);
  const stem=new T.Mesh(new T.CylinderGeometry(.012,.020,.068,8),new T.MeshStandardMaterial({color:'#746443'}));
  stem.position.y=.144;
  citrus.add(stem);
  const leaf=new T.Shape();
  leaf.moveTo(0,0);leaf.bezierCurveTo(.06,.093,.19,.094,.255,.054);
  leaf.bezierCurveTo(.19,.034,.12,-.047,0,0);
  const blade=new T.Mesh(new T.ShapeGeometry(leaf,20),
    new T.MeshStandardMaterial({color:'#53682c',roughness:.54,side:T.DoubleSide}));
  blade.position.set(0,.165,.015);
  blade.rotation.set(-.69,.19,-.16);
  citrus.add(blade);
  const vein = new T.CatmullRomCurve3([
    new T.Vector3(.008,.007,.002),new T.Vector3(.104,.041,.002),new T.Vector3(.236,.055,.002),
  ]);
  blade.add(new T.Mesh(new T.TubeGeometry(vein,12,.002,4,false),new T.MeshStandardMaterial({color:'#88954a'})));
  stack.visible=false;
  return { stack, citrus };
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
  const legs=['Foot_R','Foot_L'].map(name=>model.getObjectByName(name));
  const hands=['Hand_R','Hand_L'].map(name=>model.getObjectByName(name));
  const chest=model.getObjectByName('Chest');
  const bones=[...legs,...hands,chest];
  const samples=bones.map(b=>({p:b.position.clone(),q:b.quaternion.clone()}));
  return { model,body,uniforms,mixer,actions,legs,hands,chest,bones,samples,
    kagami:kagamiLayers(parent,maps[4]), faceCues:body.userData.faceCues, clip:null,
    step:0,press:0,velocity:0,pull:0,pullV:0,smile:1 };
}

const poses = { curious:'Normal',calm:'Warm',sleepy:'Drowsy',bath:'Bathe',
  hurt:'Bump',determined:'Bump',calling:'Notify',surprise:'Surprise',blush:'Warm',eating:'Read' };
const tints = {normal:new T.Color(0xffffff),kusa:new T.Color('#bfd79c'),kinako:new T.Color('#f1c38a')};
function playGesture(r,name,dt) {
  for (let i=0;i<r.bones.length;i++){
    r.bones[i].position.copy(r.samples[i].p);
    r.bones[i].quaternion.copy(r.samples[i].q);
  }
  if (r.clip!==name) {
    const action=r.actions[name].reset().play();
    if(r.clip) action.crossFadeFrom(r.actions[r.clip],.19,false);
    r.clip=name;
  }
  r.mixer.update(dt);
  for(let i=0;i<r.bones.length;i++) {
    r.samples[i].p.copy(r.bones[i].position);
    r.samples[i].q.copy(r.bones[i].quaternion);
  }
  const time=r.actions[name].time;
  let cell=0;
  for (const cue of r.faceCues[name]) {
    if (cue[0]>time) break;
    cell=cue[1];
  }
  return cell;
}

export function poseRice(r,p,t,dt,mood) {
  const grounded=p.grounded!==false, ride=!!p.mount, speed=p.speed||0;
  const rolling=p.mode==='dango', stack=p.mode==='kagami';
  const stride=grounded && !ride && !p.activity && !rolling ? smooth(speed,.04,4.5) : 0;
  const pullTarget=grounded ? 0 : clamp(p.airStretch||0,0,1);
  r.step+=dt*(2.4+Math.min(14,speed*1.34));
  const step=Math.sin(r.step), plant=Math.cos(r.step*2);
  const impact=p.impact||0, landing=p.landing||0;
  const goal=landing>.15 ? -.17-.17*impact : landing>.045 ? .12*impact :
    (grounded ? 0 : clamp((p.vy||0)*.009,-.05,.12)) + stride*plant*.042;
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
  const cell=playGesture(r,name,dt);
  r.smile=T.MathUtils.damp(r.smile,joy?1:0,42,dt);
  r.body.morphTargetInfluences[0]=r.smile;
  r.body.morphTargetInfluences[1]=pull;
  r.body.morphTargetInfluences[2]=dip;
  r.uniforms.riceSmile.value=r.smile;
  r.uniforms.riceCell.value=cell;
  r.uniforms.ricePull.value=pull;
  r.uniforms.riceTint.value.copy(tints[p.mode]||tints.normal);
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
    if (!grounded || ride) {
      foot.position.y+=(ride ? .053 : .080);
      foot.position.z+=(ride ? .132 : .058);
      foot.rotateX(ride?-.23:.27);
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
  r.kagami.stack.visible=stack;
  if(stack){
    r.model.scale.setScalar(riceScale*.78);
    r.model.position.y=.32;
    r.kagami.citrus.position.set(.013,1.75+.78*pullExtension*pull,-.01);
    r.kagami.citrus.rotation.z=.09+step*stride*.07;
  }else{
    r.model.position.y=0;
    r.model.scale.setScalar(riceScale);
  }
  return {stretch,width:1/Math.sqrt(stretch),pull,extension:pullExtension*pull,
    bob:Math.abs(step)*stride*.046,lean:-step*stride*.040-.028*tug,
    pitch:stride*(-.036+plant*.023)-.045*tug,breath};
}
