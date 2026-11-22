import * as THREE from './vendor/three.module.min.js';
import { TREES, terrainHeight, wrapDelta } from './terrain.js';
import { TREE_FORM_COUNT } from './forest-forms.js';
import { forestGeometry, forestMaterial, forestTexture } from './forest-mesh.js';

const NEAR = 28, FAR = 42, RANGE = 314, STEP = 3;
const phaseDeclaration = 'varying float forestDistance;\n';
const dither = 'float screenSeed=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))));';
function fade(shader, far) {
  shader.fragmentShader = phaseDeclaration+shader.fragmentShader.replace('#include <alphatest_fragment>',
    '#include <alphatest_fragment>\n'+dither+
    'float transition=smoothstep('+NEAR+'.0,'+FAR+'.0,forestDistance);'+
    (far?'if(screenSeed >= transition) discard;':'if(screenSeed < transition) discard;'));
}
export function* prepareForest(scene, clock) {
  const trees = TREES.filter(t=>t.form!==undefined);
  const totals = new Uint16Array(TREE_FORM_COUNT);
  const records = trees.map(t=>{
    totals[t.form]++;
    return {tree:t, ground:terrainHeight(t.x,t.z), rotation:t.seed*2.39996323,
      tint:.86+(t.seed%131)*.0019};
  });
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
    shader.vertexShader=phaseDeclaration+'uniform float forestClock; varying vec3 canopyView;\n'+shader.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       vec3 root=instanceMatrix[3].xyz;
       forestDistance=distance(root,cameraPosition);
       transformed.x+=.0055*pow(max(0.,position.y),1.6)*sin(root.x*.18+root.z*.12+forestClock*1.25+position.y*2.);
      `);
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\ncanopyView=mvPosition.xyz;');
    fade(shader,false);
    // Perspective-project the branch fragment onto the plane of the hero. Only
    // fragments in front of the body enter the softly feathered viewing cone.
    shader.fragmentShader='uniform vec3 heroView; uniform vec2 heroRadius; varying vec3 canopyView;\n'+
      shader.fragmentShader.replace('#include <opaque_fragment>', `
        float foreground=smoothstep(-.03,.33,canopyView.z-heroView.z);
        if(foreground>0. && heroView.z<0.) {
          vec2 offset=canopyView.xy*(heroView.z/min(-.001,canopyView.z))-heroView.xy;
          float contour=length(offset/heroRadius);
          float clearSight=(1.-smoothstep(.91,1.68,contour))*foreground;
          if(screenSeed<clearSight) discard;
        }
        #include <opaque_fragment>
      `);
  };
  const near = [];
  for (let i=0; i<TREE_FORM_COUNT; i++) {
    const mesh=new THREE.InstancedMesh(forestGeometry(i),denseMaterial,totals[i]);
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
  roots.setUsage(THREE.DynamicDrawUsage);forms.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('rootHeight',roots);
  geo.setAttribute('treeForm',forms);
  const farMaterial=new THREE.MeshLambertMaterial({map:read('forest-crowns'),alphaTest:.30,side:THREE.FrontSide});
  farMaterial.onBeforeCompile=shader=>{
    shader.vertexShader=phaseDeclaration+'attribute vec4 rootHeight; attribute vec3 treeForm; varying float forestTint;\n'+
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
        forestTint=treeForm.z;
      `);
    shader.fragmentShader='varying float forestTint;\n'+shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\ndiffuseColor.rgb*=forestTint;');
    fade(shader,true);
  };
  const distant = new THREE.Mesh(geo,farMaterial);
  distant.frustumCulled=false;distant.name='Distant tree crowns';scene.add(distant);
  const transform=new THREE.Object3D(), tint=new THREE.Color();
  let lastX=Infinity,lastY=Infinity,lastZ=Infinity;
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
    if ((eye.x-lastX)**2+(eye.y-lastY)**2+(eye.z-lastZ)**2<STEP*STEP) return;
    lastX=eye.x;lastY=eye.y;lastZ=eye.z;
    for (const mesh of near) mesh.count=0;
    let used=0;
    for(const {tree, ground, rotation, tint:brightness} of records) {
      const dx=wrapDelta(tree.x-eye.x), dz=wrapDelta(tree.z-eye.z);
      const d2=dx*dx+dz*dz+(ground-eye.y)**2;
      if(d2>RANGE*RANGE) continue;
      const x=eye.x+dx,z=eye.z+dz;
      if(d2<(FAR+STEP+1)**2) {
        const mesh=near[tree.form], idx=mesh.count++;
        transform.position.set(x,ground,z);transform.rotation.y=rotation;transform.scale.setScalar(tree.h);
        transform.updateMatrix();mesh.setMatrixAt(idx,transform.matrix);
        mesh.setColorAt(idx,tint.setRGB(brightness,brightness,brightness));
      }
      if(d2>(NEAR-STEP-1)**2) {
        roots.setXYZW(used,x,ground,z,tree.h);
        forms.setXYZ(used,tree.form,rotation%(Math.PI*2),brightness);used++;
      }
    }
    for(const mesh of near) {
      mesh.visible=mesh.count>0;
      if(!mesh.visible) continue;
      mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,16*mesh.count);
      mesh.instanceMatrix.needsUpdate=true;
      mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,3*mesh.count);
      mesh.instanceColor.needsUpdate=true;
    }
    geo.instanceCount=used;
    for(const attribute of [roots,forms]){
      attribute.clearUpdateRanges();attribute.addUpdateRange(0,attribute.itemSize*used);
      attribute.needsUpdate=true;
    }
  };
}
