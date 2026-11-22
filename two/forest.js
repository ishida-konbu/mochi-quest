import * as THREE from './vendor/three.module.min.js';
import { kyoRidgeHeight } from './higashiyama.js';
import { BOUND, TREES, terrainHeight, wrapDelta } from './terrain.js';
import { TREE_FORM_COUNT } from './forest-forms.js';
import { forestGeometry, forestMaterial, forestTexture } from './forest-mesh.js';

const FAR = 42, RANGE = 314, STEP = 3;
// Retain the full branch mesh while the crown still subtends a large angle.
// Bamboo's narrow profile needs a shorter distance on the densely planted western slope.
const fadeStart = 2/3, hillFadeStart=.80;
const phaseDeclaration = 'varying float forestDistance,forestFade,inkTree,inkBamboo; varying vec2 brushPoint;\n';
const crownVertex = `forestDistance=distance(root,cameraPosition);
  inkTree=crownStyle.x; inkBamboo=crownStyle.y;
  forestFade=smoothstep(crownStyle.z*mix(${fadeStart},${hillFadeStart},inkTree),crownStyle.z,forestDistance);`;
function brushProjection(height) {
  // Both silhouettes project the same brush marks around their common root.
  // Cancel perspective interpolation so a real branch and the baked view
  // at a different depth exchange coverage at the same screen position.
  return `#include <project_vertex>
    vec4 foot=projectionMatrix*viewMatrix*vec4(root,1.);
    brushPoint=(gl_Position.xy*foot.w-foot.xy*gl_Position.w)/
      (max(.01,${height})*vec2(projectionMatrix[0][0],projectionMatrix[1][1]));`;
}
const dither = 'float screenSeed=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))));';
function fade(shader, far) {
  shader.fragmentShader = phaseDeclaration+shader.fragmentShader.replace('#include <alphatest_fragment>',
    `#include <alphatest_fragment>
    ${dither}
    float baked=forestFade;
    if(inkTree>0. && baked>0. && baked<1.) {
      // Exchange small overlapping sprays. A screen-door fade across the
      // entire crown leaves a visible mesh of holes around unmatched twigs.
      vec2 p=brushPoint*gl_FragCoord.w*vec2(15.,24.);
      p.x+=.31*p.y;
      vec2 cell=floor(p), f=fract(p);
      f=f*f*(3.-2.*f);
      vec4 corners=fract(sin(dot(cell,vec2(63.13,27.79))+vec4(0.,63.13,27.79,90.92))*4375.61);
      float threshold=mix(mix(corners.x,corners.y,f.x),mix(corners.z,corners.w,f.x),f.y);
      baked=step(threshold,baked);
    } else if(baked>0. && baked<1.) baked=step(screenSeed,baked);
    ${far?'if(baked<.5) discard;':'if(baked>.5) discard;'}`);
}
export function* prepareForest(scene, clock) {
  const trees = TREES.filter(t=>t.form!==undefined);
  // Count the largest group of near trees a camera cell can actually see.
  // The reserve includes neighbouring cells and the camera's update stride.
  const width=64,cellsAcross=2*BOUND/width;
  const cellAt=v=>Math.floor((v+BOUND)/width);
  const wrapped=i=>(i%cellsAcross+cellsAcross)%cellsAcross;
  const key=(i,j)=>wrapped(i)*cellsAcross+wrapped(j);
  const totals=new Uint16Array(TREE_FORM_COUNT),cameraCells=new Map(),groves=new Map();
  for(const t of trees){
    const col=cellAt(t.x),row=cellAt(t.z),k=key(col,row);
    if(!groves.has(k))groves.set(k,{x:(col+.5)*width-BOUND,z:(row+.5)*width-BOUND,
      floor:Infinity,top:-Infinity,reach:0,range:0,trees:[]});
    const grove=groves.get(k), relief=kyoRidgeHeight(t.x,t.z);
    const wash=THREE.MathUtils.smoothstep(relief,0,3);
    const bamboo=t.kind==='moso';
    const hillReach=bamboo ? THREE.MathUtils.clamp(3.2*t.h,25,34) : THREE.MathUtils.clamp(5.4*t.h,30,58);
    const reach=THREE.MathUtils.lerp(FAR,hillReach,wash);
    const detailStart=THREE.MathUtils.lerp(fadeStart,hillFadeStart,wash)*reach;
    const nearRadius=reach+STEP+1;
    const range=relief>.5?640:RANGE;
    const ground=t.ground ?? terrainHeight(t.x,t.z);
    grove.floor=Math.min(grove.floor,ground);
    grove.top=Math.max(grove.top,ground+t.h);
    grove.reach=Math.max(grove.reach,t.h*1.2);
    // Closely related inks keep scattered crowns in the hillside palette.
    // Leave the deeper shadows to the branches and the local lighting.
    const variation=t.seed%131;
    const tint=THREE.MathUtils.lerp(.86+variation*.0019,.83+variation*.0010,wash);
    grove.trees.push({tree:t,ground,rotation:t.seed*2.39996323,range,wash,bambooWash:bamboo?wash:0,detailStart,reach,tint});
    grove.range=Math.max(grove.range,range);
    for(let i=cellAt(t.x-nearRadius);i<=cellAt(t.x+nearRadius);i++)
      for(let j=cellAt(t.z-nearRadius);j<=cellAt(t.z+nearRadius);j++){
        const cell=key(i,j);
        if(!cameraCells.has(cell))cameraCells.set(cell,new Uint16Array(TREE_FORM_COUNT));
        const count=++cameraCells.get(cell)[t.form];
        totals[t.form]=Math.max(totals[t.form],count);
      }
  }
  for(const grove of groves.values()){
    grove.centreY=(grove.floor+grove.top)*.5;
    grove.radius=Math.hypot(width*Math.SQRT1_2,(grove.top-grove.floor)*.5)
      +grove.reach+STEP+1+grove.range*.031;
  }
  const loader=new THREE.TextureLoader();
  function read(name) {
    const texture=loader.load(forestTexture(name));
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    return texture;
  }
  const denseMaterial=forestMaterial(read('forest-sprays'));
  const heroView = {value:new THREE.Vector3()}, heroRadius = {value:new THREE.Vector2()};
  const twoSidedFoliage = denseMaterial.onBeforeCompile;
  denseMaterial.onBeforeCompile = shader => {
    twoSidedFoliage(shader);
    shader.uniforms.forestClock=clock;
    shader.uniforms.heroView=heroView;
    shader.uniforms.heroRadius=heroRadius;
    shader.vertexShader=phaseDeclaration+'uniform float forestClock; attribute vec3 crownStyle; varying vec3 canopyView;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       vec3 root=instanceMatrix[3].xyz;
       ${crownVertex}
       transformed.x+=.0055*pow(max(0.,position.y),1.6)*sin(root.x*.18+root.z*.12+forestClock*1.25+position.y*2.);
      `);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      brushProjection('instanceMatrix[1].y')+`
        canopyView=mvPosition.xyz;
        // Align depth with the upright crown painting as it takes over.
        // Otherwise a metre of relief at one crossing reads as a false ink
        // outline inside the leaves in the depth-based finishing pass.
        float start=mix(${fadeStart},${hillFadeStart},inkTree);
        float flatten=.96*smoothstep(start-.09,start+.025,forestDistance/crownStyle.z);
        if(inkTree>0. && flatten>0.) {
          vec2 toFoot=root.xz-cameraPosition.xz;
          vec2 toBranch=(instanceMatrix*vec4(transformed,1.)).xz-cameraPosition.xz;
          float along=dot(toFoot,toBranch);
          if(along>.1) {
            float depth=mix(1.,dot(toFoot,toFoot)/along,flatten);
            gl_Position.z=-projectionMatrix[2].z*gl_Position.w+projectionMatrix[3].z/depth;
          }
        }`);
    fade(shader,false);
    // Perspective-project the branch fragment onto the plane of the hero. Only
    // fragments in front of the body enter the softly feathered viewing cone.
    shader.fragmentShader='uniform vec3 heroView; uniform vec2 heroRadius; varying vec3 canopyView;\n'+
      shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        if(inkTree>0.) {
          // Near the footpath each folded spray carries a wash. Bark and the
          // broken margins of the foliage take the darkest brush pressure.
          float tone=dot(diffuseColor.rgb,vec3(.28,.56,.16));
          float lift=smoothstep(.025,.27,tone);
          vec3 ink=vec3(.020,.026,.016), leaf=vec3(.235,.266,.156);
          vec3 wash=mix(ink,leaf,.09+.83*lift);
          float fringe=1.-smoothstep(.36,.80,diffuseColor.a);
          vec3 bark=mix(vec3(.026,.024,.020),vec3(.30,.25,.17),lift);
          // A dilute green wash follows the jointed bamboo culms under the leaves.
          vec3 culm=mix(vec3(.046,.064,.038),vec3(.35,.41,.22),lift);
          bark=mix(bark,culm,inkBamboo);
          vec3 pigment=mix(bark, wash*(1.-.52*fringe),treeLeaf);
          diffuseColor.rgb=mix(diffuseColor.rgb,pigment,inkTree);
        }
      `).replace('#include <opaque_fragment>', `
        // A low spray touching the chase camera dissolves before its leaf card
        // fills the screen. The trunk and the high canopy still frame the path.
        float cameraLeaf=inkTree*treeLeaf*(1.-smoothstep(.45,3.4,-canopyView.z));
        if(screenSeed<cameraLeaf) discard;
        float foreground=smoothstep(-.03,.33,canopyView.z-heroView.z);
        if(foreground>0. && heroView.z<0.) {
          vec2 offset=canopyView.xy*(heroView.z/min(-.001,canopyView.z))-heroView.xy;
          float contour=length(offset/heroRadius);
          float clearSight=(1.-smoothstep(.91,1.68+.32*inkTree,contour))*foreground;
          if(screenSeed<clearSight) discard;
        }
        #include <opaque_fragment>
      `);
  };
  const near = [];
  for (let i=0; i<TREE_FORM_COUNT; i++) {
    const shape=forestGeometry(i);
    shape.setAttribute('crownStyle',new THREE.InstancedBufferAttribute(new Float32Array(totals[i]*3),3)
      .setUsage(THREE.DynamicDrawUsage));
    const mesh=new THREE.InstancedMesh(shape,denseMaterial,totals[i]);
    mesh.name='Grove • '+i;
    mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(mesh);
    near.push(mesh);
    yield;
  }
  // Two orthogonal baked views of each 3D crown occupy a single atlas. Each
  // far tree costs two triangles and samples the same local weather lighting.
  const geo = new THREE.InstancedBufferGeometry();
  const plane = new THREE.PlaneGeometry(1,1);
  geo.index=plane.index;geo.attributes={...plane.attributes};
  const roots = new THREE.InstancedBufferAttribute(new Float32Array(trees.length*4),4);
  const forms = new THREE.InstancedBufferAttribute(new Float32Array(trees.length*3),3);
  const styles = new THREE.InstancedBufferAttribute(new Float32Array(trees.length*3),3);
  for(const attribute of [roots,forms,styles]) attribute.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('rootHeight',roots);
  geo.setAttribute('treeForm',forms);
  geo.setAttribute('crownStyle',styles);
  const farMaterial=new THREE.MeshLambertMaterial({map:read('forest-crowns'),alphaTest:.30,side:THREE.FrontSide});
  // Keep the full-resolution geometry bake for both styles. The small palette
  // translates its original highlights into dilute ink without blurring twigs
  // or allocating another full crown texture on a phone.
  const washes=read('kyo-crown-washes');
  washes.generateMipmaps=false;washes.minFilter=THREE.LinearFilter;washes.anisotropy=1;
  farMaterial.onBeforeCompile=shader=>{
    shader.uniforms.crownWashes={value:washes};
    shader.vertexShader=phaseDeclaration+'attribute vec4 rootHeight; attribute vec3 treeForm,crownStyle; varying float forestTint,washRow;\n'+
      shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=vec3(0.,1.,0.);').replace('#include <begin_vertex>',`
        vec3 root=rootHeight.xyz;
        ${crownVertex}
        vec2 ray=normalize(cameraPosition.xz-root.xz+vec2(.0001));
        vec3 right=vec3(ray.y,0.,-ray.x);
        vec3 transformed=root+(right*(position.x*1.8)+vec3(0.,position.y*1.50+.58,0.))*rootHeight.w;
        float quarter=floor((atan(ray.x,ray.y)-treeForm.y)*.63661977+.5);
        float aspect=mod(quarter,2.);
        float u=mod(quarter,4.)>1.5 ? 1.-uv.x : uv.x;
        vMapUv=(vec2(mod(treeForm.x,8.)+aspect*8.,7.-floor(treeForm.x/8.))+vec2(u,uv.y))/vec2(16.,8.);
        forestTint=treeForm.z;
        washRow=(treeForm.x+aspect*${TREE_FORM_COUNT}.)*2.;
      `).replace('#include <project_vertex>',brushProjection('rootHeight.w'));
    shader.fragmentShader='uniform sampler2D crownWashes; varying float forestTint,washRow;\n'+
      shader.fragmentShader.replace('#include <map_fragment>', `
        vec4 crown=texture2D(map,vMapUv);
        if(inkTree>0.) {
          float tone=sqrt(dot(crown.rgb,vec3(.28,.56,.16)));
          float leaf=smoothstep(.82,.99,(crown.g+.0001)/(crown.r+.0001));
          vec2 swatch=vec2((.5+255.*tone)/256.,1.-(washRow+leaf+.5)/${TREE_FORM_COUNT*4}.);
          vec3 wash=texture2D(crownWashes,swatch).rgb;
          crown.rgb=mix(crown.rgb,wash*(.89+.11*crown.a),inkTree);
        }
        diffuseColor*=crown;
      `).replace('#include <color_fragment>',
      `#include <color_fragment>
        diffuseColor.rgb*=forestTint;
        // At town scale, isolated crowns and bamboo sprays share a little of
        // the ground wash. The translucent ink still carries the branch shape.
        float distantInk=inkTree*smoothstep(75.,235.,forestDistance);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.206,.248,.17),
          distantInk*(.14+.085*inkBamboo));
      `);
    fade(shader,true);
  };
  const distant = new THREE.Mesh(geo,farMaterial);
  distant.frustumCulled=false;distant.name='Distant tree crowns';scene.add(distant);
  const transform=new THREE.Object3D(), tint=new THREE.Color();
  const view=new THREE.Frustum(),projection=new THREE.Matrix4(),crown=new THREE.Sphere();
  const lastRotation=new THREE.Quaternion();
  let lastX=Infinity,lastY=Infinity,lastZ=Infinity,lastZoom=0,lastAspect=0;
  return function updateForest(camera, player) {
    const eye=camera.position;
    const scale=player.buffs.full>0 ? 1.28 : 1;
    const ride=player.mount==='bike' ? .9 : player.mount==='turtle' ? .52 : 0;
    const pull=player.airStretch || 0;
    const height=scale*(.84+.57*pull)*(player.activity==='sleep' ? .74 : 1);
    const y=player.y+ride+height-(player.activity==='bath' ? .45 : 0);
    heroView.value.set(eye.x+wrapDelta(player.x-eye.x),y,eye.z+wrapDelta(player.z-eye.z))
      .applyMatrix4(camera.matrixWorldInverse);
    heroRadius.value.set(scale*(1.17-.18*pull),height+.29);
    const zoom=camera.projectionMatrix.elements[5],aspect=camera.projectionMatrix.elements[0];
    if ((eye.x-lastX)**2+(eye.y-lastY)**2+(eye.z-lastZ)**2<STEP*STEP &&
        Math.abs(lastRotation.dot(camera.quaternion))>.9999 && zoom===lastZoom && aspect===lastAspect)return;
    lastZoom=zoom;lastAspect=aspect;lastRotation.copy(camera.quaternion);
    view.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    lastX=eye.x;lastY=eye.y;lastZ=eye.z;
    for (const mesh of near) mesh.count=0;
    let used=0;
    for(const grove of groves.values()){
      const gx=wrapDelta(grove.x-eye.x),gz=wrapDelta(grove.z-eye.z);
      const edgeX=Math.max(0,Math.abs(gx)-width/2),edgeZ=Math.max(0,Math.abs(gz)-width/2);
      if(edgeX*edgeX+edgeZ*edgeZ>grove.range*grove.range)continue;
      // Reject whole hillside stands before checking thousands of individual
      // crowns. Include the same movement/rotation tolerance as the leaf test.
      crown.center.set(eye.x+gx,grove.centreY,eye.z+gz);
      crown.radius=grove.radius;
      if(!view.intersectsSphere(crown))continue;
      for(const {tree, ground, rotation, range, wash, bambooWash, detailStart, reach, tint:brightness} of grove.trees) {
        const dx=wrapDelta(tree.x-eye.x), dz=wrapDelta(tree.z-eye.z);
        const d2=dx*dx+dz*dz+(ground-eye.y)**2;
        if(d2>range*range) continue;
        const x=eye.x+dx,z=eye.z+dz;
        crown.center.set(x,ground+.58*tree.h,z);
        // Include the whole baked crown, a camera stride, and the permitted
        // turn between updates. A newly visible branch cannot pop at the edge.
        crown.radius=tree.h*1.2+STEP+1+Math.sqrt(d2)*.031;
        if(!view.intersectsSphere(crown))continue;
        if(d2<(reach+STEP+1)**2) {
          const mesh=near[tree.form], idx=mesh.count++;
          transform.position.set(x,ground,z);transform.rotation.y=rotation;transform.scale.setScalar(tree.h);
          transform.updateMatrix();mesh.setMatrixAt(idx,transform.matrix);
          mesh.setColorAt(idx,tint.setRGB(brightness,brightness,brightness));
          mesh.geometry.attributes.crownStyle.setXYZ(idx,wash,bambooWash,reach);
        }
        if(d2>(detailStart-STEP-1)**2) {
          roots.setXYZW(used,x,ground,z,tree.h);
          forms.setXYZ(used,tree.form,rotation%(Math.PI*2),brightness);
          styles.setXYZ(used,wash,bambooWash,reach);used++;
        }
      }
    }
    for(const mesh of near) {
      mesh.visible=mesh.count>0;
      if(!mesh.visible) continue;
      mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,16*mesh.count);
      mesh.instanceMatrix.needsUpdate=true;
      mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,3*mesh.count);
      mesh.instanceColor.needsUpdate=true;
      const style=mesh.geometry.attributes.crownStyle;
      style.clearUpdateRanges();style.addUpdateRange(0,3*mesh.count);style.needsUpdate=true;
    }
    geo.instanceCount=used;
    for(const attribute of [roots,forms,styles]){
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,attribute.itemSize*used);
      attribute.needsUpdate=true;
    }
  };
}
