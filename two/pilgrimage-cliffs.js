import * as T from './vendor/three.module.min.js';
import { terrainHeight, BOUND } from './terrain.js';
import { CLIFF_PINES, PEACH } from './pilgrimage-layout.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';

const {sin,cos,PI,abs,hypot} = Math;
const ease=T.MathUtils.smoothstep;

function pine(i) {
  const s=sculpture(), spin=i*1.23, sign=i%2?-1:1;
  const wood=[[0,-.4,0],[.08,.35,.03],[.50,1.32,.14],[-.14,2.33,.13],
    [sign*.50,3.35,.26],[sign*1.19,4.12,.15],[sign*1.42,4.96,.10]];
  s.stroke('#565344',wood,[.32,.28,.24,.19,.134,.076,.028],16);
  const pad=new T.SphereGeometry(1,20,8), edge=pad.attributes.position;
  for(let j=0;j<edge.count;j++){
    const x=edge.getX(j),y=edge.getY(j),z=edge.getZ(j),a=Math.atan2(z,x);
    const jag=1+.08*sin(a*7+.7)+.12*sin(a*3-.43)+.055*sin(a*10);
    edge.setXYZ(j,x*jag,y*(y>0?1+y*.13:.48)-((.18+.19*sin(a*9.1))*(1-y*y)),z*jag);
  }
  pad.computeVertexNormals();
  for(let k=0;k<8;k++){
    const a=k*2.39+spin, start=wood[2+Math.floor(k*.55)],h=start[1]+(k%2?.74:.32);
    const len=(2.05-k*.139)*(.88+.31*cos(a)),x=start[0]+cos(a)*len,z=start[2]+sin(a)*len;
    s.stroke('#585746',[start,[start[0]+.62*cos(a),start[1]-.20,start[2]+.61*sin(a)],
      [x,h-.22,z],[x+.16*cos(a),h,z+.16*sin(a)]],[.112,.091,.062,.018],8);
    s.add(pad,'#526252',x,h,z,1.20+.23*sin(a),.34,1.02+.18*cos(a),.035,a);
    s.add(pad,'#71816b',x-.14,h+.16,z+.05,.88,.26,.76,-.04,a-.37);
  }
  return s.finish();
}
export function* paintPeachCliffs(p,map){
  // Reuse the ground mesh lattice exactly. The varnish sits directly on
  // the collidable stone even where a ledge has an almost vertical face.
  const n=480,span=2*BOUND/n, index=v=>Math.floor((v+BOUND)/span);
  const colMin=index(PEACH.x-131),colMax=index(PEACH.x+128)+1,rowMin=index(PEACH.z-117),rowMax=index(PEACH.z+118)+1;
  const surface=new T.MeshLambertMaterial({map,vertexColors:true,transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,emissiveMap:map,emissive:'#a0a28b',emissiveIntensity:.19});
  surface.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      vec4 impression=texture2D(map,vMapUv);
      float depth=smoothstep(.056,.60,dot(impression.rgb,vec3(.28,.61,.11)));
      diffuseColor.rgb*=mix(vec3(.068,.092,.096),vec3(.79,.82,.73),depth);
    `);
  };
  map.wrapS=map.wrapT=T.MirroredRepeatWrapping;
  const stone=new T.Color(),moss=new T.Color('#a8bca9');
  for(let row=rowMin;row<rowMax;row+=24)for(let col=colMin;col<colMax;col+=24){
    const nx=Math.min(24,colMax-col),nz=Math.min(24,rowMax-row),px=col*span-BOUND,pz=row*span-BOUND;
    const xyz=[],uv=[],colors=[],faces=[];let maxAlpha=0;
    for(let v=0;v<=nz;v++)for(let u=0;u<=nx;u++){
      const x=px+u*span,z=pz+v*span,y=terrainHeight(x,z),dx=(x-PEACH.x)/123,dz=(z-PEACH.z)/108;
      const r=hypot(dx,dz),a=(Math.atan2(dz,dx)+PI*2)%(PI*2);
      const slope=hypot((terrainHeight(x+1,z)-terrainHeight(x-1,z))*.5,(terrainHeight(x,z+1)-terrainHeight(x,z-1))*.5);
      const stripe=.5+.5*sin(a*18+.22*y+sin(a*9));
      const alpha=ease(y+2.4*stripe,11,20)*ease(r,.42,.61)*(1-ease(r,.99,1.12))*
        (.57+.41*ease(slope,.16,.92));
      maxAlpha=Math.max(maxAlpha,alpha);
      stone.set('#e5e5cf').lerp(moss,.49*(1-ease(slope,.39,.94)));
      xyz.push(u*span/12,(y+.024)/12,v*span/12);colors.push(stone.r,stone.g,stone.b,alpha);
      uv.push(a*1.79+.29*sin(a*3)+.006*y,y*.027+.18*cos(a*7)+.06*sin(a*14));
      if(u<nx&&v<nz){const j=v*(nx+1)+u,k=j+nx+1;faces.push(j,k,j+1,j+1,k,k+1);}
    }
    if(maxAlpha<.01)continue;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,4));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geo.setIndex(faces);geo.computeVertexNormals();
    const name='peachCliff'+row+'_'+col;p.shapes[name]=geo;
    p.part(name,px,0,pz,12,12,12,'#fff',0,0,0,surface,false,true);
    yield;
  }
  const bark=brushWash(new T.MeshLambertMaterial({vertexColors:true}),.34);
  for(let i=0;i<3;i++) p.shapes['cliffPine'+i]=pine(i);
  for(const t of CLIFF_PINES) p.part('cliffPine'+t.type,t.x,terrainHeight(t.x,t.z),t.z,
    t.scale,t.scale,t.scale,'#fff',t.yaw,0,0,bark,true,true);
}
