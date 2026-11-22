import * as THREE from './vendor/three.module.min.js';
import { kyoRidgeHeight } from './higashiyama.js';
import { BOUND, TREES, terrainHeight, wrapDelta } from './terrain.js';
import { TREE_FORM_COUNT } from './forest-forms.js';
import { forestGeometry, forestMaterial, forestTexture } from './forest-mesh.js';

const NEAR = 28, FAR = 42, RANGE = 314, STEP = 3;
const KYOTO_NEAR = 21, KYOTO_FAR = 30;
const phaseDeclaration = 'varying float forestDistance;\n';
const dither = 'float screenSeed=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))));';
function fade(shader, far) {
  shader.fragmentShader = phaseDeclaration+shader.fragmentShader.replace('#include <alphatest_fragment>',
    '#include <alphatest_fragment>\n'+dither+
    `float transition=smoothstep(mix(${NEAR}.,${KYOTO_NEAR}.,inkTree),
      mix(${FAR}.,${KYOTO_FAR}.,inkTree),forestDistance);`+
    (far?'if(screenSeed >= transition) discard;':'if(screenSeed < transition) discard;'));
}
export function* prepareForest(scene, clock) {
  const trees = TREES.filter(t=>t.form!==undefined);
  // Count the largest group of near trees a camera cell can actually see.
  // The reserve includes neighbouring cells and the camera's update stride.
  const width=64,cellsAcross=2*BOUND/width,nearRadius=FAR+STEP+1;
  const cellAt=v=>Math.floor((v+BOUND)/width);
  const wrapped=i=>(i%cellsAcross+cellsAcross)%cellsAcross;
  const key=(i,j)=>wrapped(i)*cellsAcross+wrapped(j);
  const totals=new Uint16Array(TREE_FORM_COUNT),cameraCells=new Map(),groves=new Map();
  for(const t of trees){
    const col=cellAt(t.x),row=cellAt(t.z),k=key(col,row);
    if(!groves.has(k))groves.set(k,{x:(col+.5)*width-BOUND,z:(row+.5)*width-BOUND,
      floor:Infinity,top:-Infinity,reach:0,range:0,trees:[]});
    const grove=groves.get(k), kyoto=Boolean(t.kyotoRidge || kyoRidgeHeight(t.x,t.z)>.5);
    const range=kyoto?640:RANGE;
    const ground=t.ground ?? terrainHeight(t.x,t.z);
    grove.floor=Math.min(grove.floor,ground);
    grove.top=Math.max(grove.top,ground+t.h);
    grove.reach=Math.max(grove.reach,t.h*1.2);
    // The wet wash joins neighbouring crowns into stands. Leave broken light
    // on the outward shoulders and a deeper pool where two groves overlap.
    const folds=kyoto ? .52*Math.sin(.047*t.x+.015*t.z)+.32*Math.cos(.057*t.z-.021*t.x)
      +.16*Math.sin(.112*t.x-.058*t.z) : 0;
    const tint=(.86+(t.seed%131)*.0019)*(kyoto ? .77+.34*folds : 1);
    grove.trees.push({tree:t,ground,rotation:t.seed*2.39996323,range,kyoto,tint});
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
    shader.vertexShader=phaseDeclaration+'uniform float forestClock; attribute float inkGrove; varying float inkTree; varying vec3 canopyView;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       vec3 root=instanceMatrix[3].xyz;
       inkTree=inkGrove;
       forestDistance=distance(root,cameraPosition);
       transformed.x+=.0055*pow(max(0.,position.y),1.6)*sin(root.x*.18+root.z*.12+forestClock*1.25+position.y*2.);
      `);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\ncanopyView=mvPosition.xyz;');
    fade(shader,false);
    // Perspective-project the branch fragment onto the plane of the hero. Only
    // fragments in front of the body enter the softly feathered viewing cone.
    shader.fragmentShader='uniform vec3 heroView; uniform vec2 heroRadius; varying float inkTree; varying vec3 canopyView;\n'+
      shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        if(inkTree>.5) {
          // Near the footpath each folded spray carries a wash. Bark and the
          // broken margins of the foliage take the darkest brush pressure.
          float tone=dot(diffuseColor.rgb,vec3(.28,.56,.16));
          float lift=smoothstep(.025,.27,tone);
          vec3 ink=vec3(.020,.026,.016), leaf=vec3(.235,.266,.156);
          vec3 wash=mix(ink,leaf,.09+.83*lift);
          float fringe=1.-smoothstep(.36,.80,diffuseColor.a);
          vec3 bark=mix(vec3(.026,.024,.020),vec3(.30,.25,.17),lift);
          diffuseColor.rgb=mix(bark, wash*(1.-.52*fringe),treeLeaf);
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
    shape.setAttribute('inkGrove',new THREE.InstancedBufferAttribute(new Uint8Array(totals[i]),1)
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
  const forms = new THREE.InstancedBufferAttribute(new Float32Array(trees.length*4),4);
  roots.setUsage(THREE.DynamicDrawUsage);forms.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('rootHeight',roots);
  geo.setAttribute('treeForm',forms);
  const farMaterial=new THREE.MeshLambertMaterial({map:read('forest-crowns'),alphaTest:.30,side:THREE.FrontSide});
  const inkCrowns=read('kyo-ink-crowns');
  farMaterial.onBeforeCompile=shader=>{
    shader.uniforms.inkCrowns={value:inkCrowns};
    shader.vertexShader=phaseDeclaration+'attribute vec4 rootHeight; attribute vec4 treeForm; varying float forestTint,inkTree;\n'+
      shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=vec3(0.,1.,0.);').replace('#include <begin_vertex>',`
        vec3 root=rootHeight.xyz;
        forestDistance=distance(cameraPosition,root);
        vec2 ray=normalize(cameraPosition.xz-root.xz+vec2(.0001));
        vec3 right=vec3(ray.y,0.,-ray.x);
        vec3 transformed=root+(right*(position.x*1.8)+vec3(0.,position.y*1.50+.58,0.))*rootHeight.w;
        float quarter=floor((atan(ray.x,ray.y)-treeForm.y)*.63661977+.5);
        float aspect=mod(quarter,2.);
        float u=mod(quarter,4.)>1.5 ? 1.-uv.x : uv.x;
        vMapUv=(vec2(mod(treeForm.x,8.)+aspect*8.,7.-floor(treeForm.x/8.))+vec2(u,uv.y))/vec2(16.,8.);
        forestTint=treeForm.z;inkTree=treeForm.w;
      `);
    shader.fragmentShader='uniform sampler2D inkCrowns; varying float forestTint,inkTree;\n'+
      shader.fragmentShader.replace('#include <map_fragment>', `
        if(inkTree>.5) diffuseColor*=texture2D(inkCrowns,vMapUv);
        else diffuseColor*=texture2D(map,vMapUv);
      `).replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb*=forestTint;');
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
      for(const {tree, ground, rotation, range, kyoto, tint:brightness} of grove.trees) {
        const dx=wrapDelta(tree.x-eye.x), dz=wrapDelta(tree.z-eye.z);
        const d2=dx*dx+dz*dz+(ground-eye.y)**2;
        if(d2>range*range) continue;
        const x=eye.x+dx,z=eye.z+dz;
        crown.center.set(x,ground+.58*tree.h,z);
        // Include the whole baked crown, a camera stride, and the permitted
        // turn between updates. A newly visible branch cannot pop at the edge.
        crown.radius=tree.h*1.2+STEP+1+Math.sqrt(d2)*.031;
        if(!view.intersectsSphere(crown))continue;
        if(d2<((kyoto?KYOTO_FAR:FAR)+STEP+1)**2) {
          const mesh=near[tree.form], idx=mesh.count++;
          transform.position.set(x,ground,z);transform.rotation.y=rotation;transform.scale.setScalar(tree.h);
          transform.updateMatrix();mesh.setMatrixAt(idx,transform.matrix);
          mesh.setColorAt(idx,tint.setRGB(brightness,brightness,brightness));
          mesh.geometry.attributes.inkGrove.setX(idx,Number(kyoto));
        }
        if(d2>((kyoto?KYOTO_NEAR:NEAR)-STEP-1)**2) {
          roots.setXYZW(used,x,ground,z,tree.h);
          forms.setXYZW(used,tree.form,rotation%(Math.PI*2),brightness,Number(kyoto));used++;
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
      const ink=mesh.geometry.attributes.inkGrove;
      ink.clearUpdateRanges();ink.addUpdateRange(0,mesh.count);ink.needsUpdate=true;
    }
    geo.instanceCount=used;
    for(const attribute of [roots,forms]){
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,attribute.itemSize*used);
      attribute.needsUpdate=true;
    }
  };
}
