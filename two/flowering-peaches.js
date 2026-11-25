import { isTimberHidden,timberRevision } from './living-build-trees.js';
import {peachStrokes} from './pilgrimage-trees.js';
import * as T from './vendor/three.module.min.js';
import { PEACH_TREES } from './pilgrimage-layout.js';
import { terrainMeshHeight, seeded, wrapDelta } from './terrain.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';
import { DEFAULT_SCENERY_QUALITY, SCENERY_PROFILES } from './scenery-quality.js';
const {sin,cos,PI}=Math;
export const CROWN_SPAN=10,CROWN_MID=3.3;
// Each model has four azimuths at each elevation. Upper and lower slopes
// show opposite sides of the lifted boughs; a single horizon view loses them.
export const CROWN_ELEVATIONS=[-.56,-.08,.40,.94];
export const blossomGeometry=()=>new T.PlaneGeometry(1,1,4,3).translate(.46,.44,0);
const paints=new Map(),palettes=[];
function peachWash(filename){
  if(!paints.has(filename)){
    const url=new URL('./assets/world/'+filename+'.webp',import.meta.url);
    const map=new T.TextureLoader().load(url.href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    paints.set(filename,map);
  }
  return paints.get(filename);
}
export function peachMaterials(form=0){
  if(palettes[form])return palettes[form];
  // Single and double blossoms open at different times. Some crowns still
  // carry carmine buds, others have pale outer petals around rose centres.
  const bloom=[.18,.55,.08,.30,.73][form];
  function petals(filename){
    const map=peachWash(filename);
    const mat=new T.MeshLambertMaterial({map,side:T.DoubleSide,alphaTest:.30,
      emissiveMap:map,emissive:'#f9afc3',emissiveIntensity:.19});
    // A second pass of carmine in the petal veins. Leave the stamens,
    // leaf buds, white petal edges and ink drawing of the branch intact.
    mat.customProgramCacheKey=()=>String(bloom);
    mat.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        #include <map_fragment>
        vec3 petal=diffuseColor.rgb;
        float pink=smoothstep(.025,.20,petal.r-petal.g)*smoothstep(.60,.89,petal.b/max(.004,petal.g));
        float paper=1.-smoothstep(.58,.94,min(petal.g,petal.b));
        vec3 carmine=vec3(min(1.,petal.r*1.14+.045),petal.g*.38,petal.b*.74+.03);
        float openPetal=smoothstep(.09,.56,petal.r)*${bloom.toFixed(2)};
        vec3 blossom=mix(carmine,vec3(1.,.72,.73),openPetal);
        diffuseColor.rgb=mix(petal,blossom,pink*paper);
      `);
    };
    return mat;
  }
  return palettes[form]={bark:brushWash(new T.MeshLambertMaterial({vertexColors:true}),.29),ink:petals('peach-bough'),flowers:petals('peach-blossom-cloud')};
}
// Separate twig and flower impressions share a mesh across all the boughs
// in each tree. The same folded paintings and matrices also print its distant view.
export function peachModel(i){
  const bark=sculpture(),sprays=peachStrokes(bark,seeded(76231+i*3504)),sprig=blossomGeometry(),dummy=new T.Object3D();
  const xyz=sprig.getAttribute('position');
  for(let j=0;j<xyz.count;j++){
    const u=xyz.getX(j),v=xyz.getY(j);
    xyz.setZ(j,.13*sin((u+.04)*PI)*sin((v+.06)*PI)+.035*u*v);
  }
  sprig.computeVertexNormals();
  const batches=[[],[]],materials=peachMaterials(i);
  sprays.forEach(({q,a,length,pitch},j)=>{
    const w=length*(j%3===0?1.13:1.49);
    dummy.position.set(...q);dummy.scale.set(w,w*.78,1);
    dummy.rotation.set(pitch,-a,.08*sin(i+j),'YXZ');dummy.updateMatrix();
    batches[j%3===0?0:1].push(sprig.clone().applyMatrix4(dummy.matrix));
  });
  function gather(parts) {
    const g=new T.BufferGeometry(),indices=[];
    for(const k of ['position','normal','uv']){
      const values=[];for(const part of parts)values.push(...part.attributes[k].array);
      g.setAttribute(k,new T.Float32BufferAttribute(values,parts[0].attributes[k].itemSize));
    }
    let offset=0;
    for(const part of parts){for(const k of part.index.array)indices.push(k+offset);offset+=part.attributes.position.count;}
    g.setIndex(indices);g.computeBoundingSphere();return g;
  }
  return [[bark.finish(),materials.bark],[gather(batches[0]),materials.ink],[gather(batches[1]),materials.flowers]];
}
export function createPeachOrchard(scene) {
  const N=PEACH_TREES.length;
  const stands=new Map();
  const size=48, formCounts=new Array(5).fill(0);
  for(const tree of PEACH_TREES){
    const key=Math.floor(tree.x/size)*128+Math.floor(tree.z/size);
    if(!stands.has(key))stands.set(key,{trees:[],box:new T.Box3()});
    const stand=stands.get(key),y=terrainMeshHeight(tree.x,tree.z),extent=tree.size*CROWN_SPAN*.55;
    const at=new T.Vector3(tree.x,y,tree.z);
    stand.box.expandByPoint(at.clone().add(new T.Vector3(-extent,-1,-extent)));
    stand.box.expandByPoint(at.clone().add(new T.Vector3(extent,extent*1.7,extent)));
    const form=tree.form??tree.seed%5;
    stand.trees.push({...tree,form,y});
    formCounts[form]++;
  }
  for(const stand of stands.values())stand.sphere=stand.box.getBoundingSphere(new T.Sphere());
  const root=new T.Group();root.name='桃源郷の桃の林';scene.add(root);
  function batch(geo,mat,size,shadow){
    const mesh=new T.InstancedMesh(geo,mat,size);
    mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=shadow;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;
  }
  const crowns=formCounts.map((capacity,i)=>peachModel(i).map(([geo,mat],j)=>{
    const model=batch(geo,mat,capacity,j===0);
    model.userData.timberPeach=i;return model;
  }));
  const map=new T.TextureLoader().load(new URL('./assets/world/peach-crowns.webp?v=painted-boughs-426',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  // The crown impressions already contain directional light and twig shadows.
  const mat=new T.MeshBasicMaterial({map,alphaTest:.29});
  // Four bearings at four elevations preserve each leaning crown above the gorge.
  const plane=new T.PlaneGeometry(1,1),cells=new T.InstancedBufferAttribute(new Float32Array(3*N),3);
  plane.setAttribute('crownCell',cells.setUsage(T.DynamicDrawUsage));
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec3 crownCell; varying float horizonFade;\n'+shader.vertexShader.replace('#include <uv_vertex>',`
      #include <uv_vertex>
      vMapUv=(crownCell.xy+clamp(uv,.004,.996))/vec2(8.,10.);
      horizonFade=crownCell.z;
    `);
    shader.fragmentShader='varying float horizonFade;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`
      #include <alphatest_fragment>
      float grain=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(.06711056,.00583715))));
      if(grain<horizonFade)discard;
    `);
  };
  const distant=batch(plane,mat,N,false),dummy=new T.Object3D(),colour=new T.Color(),up=new T.Vector3();
  const tints=['#ffffff','#fff3f3','#ffe5eb','#fff3e0','#f7d5e4','#fff8f2'];
  const frustum=new T.Frustum(),projection=new T.Matrix4(),lastProjection=new T.Matrix4(),lastRotation=new T.Quaternion(),bounds=new T.Sphere();
  let lastX=Infinity,lastZ=Infinity,lastY=Infinity,lastRange=0,lastTimber;
  return (camera,profile=SCENERY_PROFILES[DEFAULT_SCENERY_QUALITY])=>{
    if(!camera)return;
    const {x,y,z}=camera.position,range=profile.treeRange;
    if(Math.hypot(x-lastX,y-lastY,z-lastZ)<.38 && Math.abs(lastRotation.dot(camera.quaternion))>.99995 &&
      lastProjection.equals(camera.projectionMatrix) && range===lastRange && lastTimber===timberRevision())return;
    lastTimber=timberRevision();
    lastRange=range;
    lastX=x;lastY=y;lastZ=z;lastRotation.copy(camera.quaternion);lastProjection.copy(camera.projectionMatrix);
    camera.updateWorldMatrix(true,false);
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    for(const m of root.children)m.count=0;
    for(const stand of stands.values()){
      bounds.copy(stand.sphere);
      const sx=wrapDelta(bounds.center.x-x),sz=wrapDelta(bounds.center.z-z);
      if(sx*sx+sz*sz>(range+bounds.radius)**2)continue;
      bounds.center.x=x+sx;bounds.center.z=z+sz;
      if(!frustum.intersectsSphere(bounds))continue;
      for(const tree of stand.trees){
        const dx=wrapDelta(tree.x-x),dz=wrapDelta(tree.z-z),dist=Math.hypot(dx,dz,y-tree.y-CROWN_MID*tree.size);
        if(dist>range || isTimberHidden(tree))continue;
        colour.set(tints[tree.seed%tints.length]);
        if(dist<(60+tree.size*8)){
          bounds.center.set(x+dx,tree.y+CROWN_MID*tree.size,z+dz);bounds.radius=CROWN_SPAN*.58*tree.size;
          if(!frustum.intersectsSphere(bounds))continue;
          dummy.position.set(x+dx,tree.y,z+dz);dummy.rotation.set(0,tree.turn,0);dummy.scale.setScalar(tree.size);dummy.updateMatrix();
          for(const [part,mesh] of crowns[tree.form].entries()){
            const index=mesh.count++;mesh.setMatrixAt(index,dummy.matrix);
            if(part)mesh.setColorAt(index,colour);
          }
        }else{
          const face=Math.atan2(-dx,-dz),index=distant.count++;
          const view=((Math.round((face-tree.turn)/(PI*.5))%4)+4)%4;
          const elevation=Math.atan2(y-tree.y-CROWN_MID*tree.size,Math.hypot(dx,dz));
          let band=0;
          while(band+1<CROWN_ELEVATIONS.length && elevation>(CROWN_ELEVATIONS[band]+CROWN_ELEVATIONS[band+1])*.5)band++;
          // Pin the image of the root to the same contact as its 3-D trunk.
          // Keep the card upright on a slope; gradually tilt for an aerial view.
          const tilt=Math.sign(elevation)*Math.max(0,Math.abs(elevation)-.49);
          const vertical=tree.size/Math.cos(elevation-tilt);
          dummy.rotation.set(-tilt,face,0,'YXZ');
          up.set(0,CROWN_MID*Math.cos(CROWN_ELEVATIONS[band])*vertical,0).applyQuaternion(dummy.quaternion);
          dummy.position.set(x+dx,tree.y,z+dz).add(up);
          dummy.scale.set(CROWN_SPAN*tree.size,CROWN_SPAN*vertical,1);dummy.updateMatrix();
          distant.setMatrixAt(index,dummy.matrix);distant.setColorAt(index,colour);
          cells.setXYZ(index,view+4*(band%2),9-tree.form*2-Math.floor(band/2),T.MathUtils.smoothstep(dist,.9*range,range));
        }
      }
    }
    for(const m of root.children)if(m.count){
      m.instanceMatrix.needsUpdate=true;
      if(m.instanceColor)m.instanceColor.needsUpdate=true;
    }
    root.visible=distant.count>0 || crowns.some(parts=>parts[0].count>0);
    cells.needsUpdate=true;
  };
}
