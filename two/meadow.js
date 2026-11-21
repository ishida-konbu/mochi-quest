import * as THREE from './vendor/three.module.min.js';
import { BOUND } from './terrain.js';
import { MEADOW_TILE, MEADOW_TILES, meadowExclusions, visitMeadowTile } from './meadow-layout.js';

function leafFans() {
  const points=[],uv=[],indices=[],normal=[];
  // Two folded fans cross at the crown. Both have a ridge and a flexible upper half.
  for (let k=0;k<2;k++) {
    const a=k*Math.PI*.47, c=Math.cos(a),s=Math.sin(a), base=points.length/3;
    for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
      const u=col*.5, v=row*.5, x=u-.5, depth=(1-Math.abs(x)*2)*.085*v+.075*v*v;
      points.push(x*c-depth*s,v,x*s+depth*c); normal.push(0,1,0);uv.push(u,v);
    }
    for (let j=0;j<2;j++) for(let i=0;i<2;i++){
      const n=base+j*3+i;indices.push(n,n+1,n+3,n+1,n+4,n+3);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));g.setIndex(indices);
  return g;
}

export function createMeadow(scene,objects,coarse) {
  const clearings=meadowExclusions(objects), shape=leafFans(), cache=new Map();
  const time={value:0}, traveller={value:new THREE.Vector2()}, range=coarse?42:54;
  const atlas=new THREE.TextureLoader().load(new URL('./assets/world/meadow-herbs.webp',import.meta.url).href);
  atlas.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshLambertMaterial({map:atlas,alphaTest:.29,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{meadowTime:time,meadowTraveller:traveller});
    shader.vertexShader='attribute vec3 planting; attribute vec4 habit; attribute vec2 tint; uniform float meadowTime; uniform vec2 meadowTraveller; varying vec3 vHerbTint;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
      float plate=habit.w;
      vMapUv=(vec2(mod(plate,8.),7.-floor(plate/8.))+uv)*.125;
      vec2 plot=modelMatrix[3].xz+planting.xz;
      float lod=1.-smoothstep(${range-15}.,${range}.,length(plot-cameraPosition.xz));
      float age=tint.y;
      vHerbTint=mix(vec3(.93,1.,.9),vec3(1.35,1.07,.75),min(age*2.,1.));
      vHerbTint=mix(vHerbTint,vec3(1.40,1.41,1.40),smoothstep(.48,.96,age));
      vHerbTint*=mix(.68,1.06,uv.y)*tint.x;`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
      float sn=sin(habit.z),cs=cos(habit.z);
      vec2 fan=vec2(cs*position.x-sn*position.z,sn*position.x+cs*position.z);
      vec2 delta=plot-meadowTraveller;float trample=1.-smoothstep(.12,1.05,length(delta));
      float tip=uv.y*uv.y;
      vec2 wind=vec2(sin(dot(plot,vec2(.21,.14))+meadowTime*1.58),cos(plot.y*.23+meadowTime*1.13));
      vec2 offset=fan*habit.x+tip*habit.y*(vec2(.09,.035)*wind+trample*.31*delta/max(.12,length(delta)));
      transformed=planting+lod*vec3(offset.x,position.y*habit.y*(1.-.36*trample),offset.y);`);
    shader.fragmentShader='varying vec3 vHerbTint;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= vHerbTint;')
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n normal=normalize(mat3(viewMatrix)*vec3(0.,1.,0.));');
  };
  function makeTile(i,j) {
    const canonical=v=>((v%MEADOW_TILES)+MEADOW_TILES)%MEADOW_TILES;
    const ci=canonical(i),cj=canonical(j),x0=ci*MEADOW_TILE-BOUND,z0=cj*MEADOW_TILE-BOUND;
    const positions=[],habits=[],tints=[];let low=Infinity,high=-Infinity;
    const count=visitMeadowTile(ci,cj,clearings,(x,y,z,w,h,angle,plate,shade,hue)=>{
      positions.push(x-x0,y,z-z0);habits.push(w,h,angle,plate);tints.push(shade,hue);
      low=Math.min(low,y);high=Math.max(high,y+h);
    });
    if(!count)return null;
    const g=new THREE.InstancedBufferGeometry();
    // Each tile owns its attributes so retiring it also releases the GPU buffers.
    g.setIndex(shape.index.clone());
    for (const [name,attr] of Object.entries(shape.attributes)) g.setAttribute(name,attr.clone());
    g.setAttribute('planting',new THREE.InstancedBufferAttribute(new Float32Array(positions),3));
    g.setAttribute('habit',new THREE.InstancedBufferAttribute(new Float32Array(habits),4));
    g.setAttribute('tint',new THREE.InstancedBufferAttribute(new Float32Array(tints),2));
    g.instanceCount=count;
    g.boundingBox=new THREE.Box3(new THREE.Vector3(-1,low,-1),new THREE.Vector3(MEADOW_TILE+1,high,MEADOW_TILE+1));
    g.boundingSphere=g.boundingBox.getBoundingSphere(new THREE.Sphere());
    const m=new THREE.Mesh(g,material);m.name='道端の草花';m.receiveShadow=true;
    m.position.set(i*MEADOW_TILE-BOUND,0,j*MEADOW_TILE-BOUND);m.updateMatrix();m.matrixAutoUpdate=false;
    scene.add(m);return m;
  }
  let oldX=Infinity,oldZ=Infinity,pending=[];
  return (now,p,camera)=>{
    time.value=now;traveller.value.set(p.x,p.z);
    const x=camera.position.x,z=camera.position.z;
    if(Math.abs(x-oldX)>4 || Math.abs(z-oldZ)>4){
      oldX=x;oldZ=z;
      const kept=new Set(),wanted=[];
      const limit=range+MEADOW_TILE*.72;
      for(let i=Math.floor((x+BOUND-limit)/MEADOW_TILE);i<=Math.floor((x+BOUND+limit)/MEADOW_TILE);i++)
        for(let j=Math.floor((z+BOUND-limit)/MEADOW_TILE);j<=Math.floor((z+BOUND+limit)/MEADOW_TILE);j++){
          const d=(x+BOUND-(i+.5)*MEADOW_TILE)**2+(z+BOUND-(j+.5)*MEADOW_TILE)**2;
          if(d>limit**2)continue;
          const key=i+','+j;kept.add(key);
          if(!cache.has(key))wanted.push({i,j,key,d});
        }
      for(const [key,m] of cache)if(!kept.has(key)){
        if(m){scene.remove(m);m.geometry.dispose();} cache.delete(key);
      }
      pending=wanted.sort((a,b)=>b.d-a.d);
    }
    const start=performance.now();
    while(pending.length) {
      const t=pending.pop();cache.set(t.key,makeTile(t.i,t.j));
      if(performance.now()-start>2.5)break;
    }
  };
}
