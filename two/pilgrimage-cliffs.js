import {cliffStrokes} from './pilgrimage-trees.js';
import * as T from './vendor/three.module.min.js';
import { TERRAIN_TILES,TERRAIN_SUBDIVISIONS } from './geography.js';
import { terrainHeight, terrainMeshHeight, BOUND } from './terrain.js';
import { PEACH_RANGE_BOUNDS } from './peach-range.js';
import { CLIFF_PINES, PEACH } from './pilgrimage-layout.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';

const {sin,cos,hypot} = Math;
const ease=T.MathUtils.smoothstep;

function pine(i) {
  const s=sculpture();
  const pad=new T.SphereGeometry(1,20,8), edge=pad.attributes.position;
  for(let j=0;j<edge.count;j++){
    const x=edge.getX(j),y=edge.getY(j),z=edge.getZ(j),a=Math.atan2(z,x);
    const jag=1+.08*sin(a*7+.7)+.12*sin(a*3-.43)+.055*sin(a*10);
    edge.setXYZ(j,x*jag,y*(y>0?1+y*.13:.48)-((.18+.19*sin(a*9.1))*(1-y*y)),z*jag);
  }
  pad.computeVertexNormals();
  cliffStrokes(s,i,(x,h,z,a)=>{
    s.add(pad,'#526252',x,h,z,1.20+.23*sin(a),.34,1.02+.18*cos(a),.035,a);
    s.add(pad,'#71816b',x-.14,h+.16,z+.05,.88,.26,.76,-.04,a-.37);
  });
  return s.finish();
}
export function* paintPeachCliffs(p,map){
  // Reuse the ground mesh lattice exactly. The varnish sits directly on
  // the collidable stone even where a ledge has an almost vertical face.
  const n=TERRAIN_TILES*TERRAIN_SUBDIVISIONS,span=2*BOUND/n, index=v=>Math.floor((v+BOUND)/span);
  const {west,east,north,south}=PEACH_RANGE_BOUNDS;
  const colMin=index(west),colMax=index(east)+1,rowMin=index(north),rowMax=index(south)+1;
  const stride=colMax-colMin+3, heights=new Float32Array(stride*(rowMax-rowMin+3));
  for(let row=rowMin-1;row<=rowMax+1;row++){
    const off=(row-rowMin+1)*stride;
    for(let col=colMin-1;col<=colMax+1;col++)
      heights[off+col-colMin+1]=terrainHeight(col*span-BOUND,row*span-BOUND);
    if((row-rowMin)%24===0)yield;
  }
  const surface=new T.MeshLambertMaterial({map,vertexColors:true,transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,emissive:'#655f4f',emissiveIntensity:.07});
  surface.onBeforeCompile=shader=>{
    // Project the painted rock onto the face it actually follows. A single
    // vertical projection stretches into horizontal streaks around a hairpin.
    const vary='varying vec3 cliffPoint; varying vec3 cliffNormal;\n';
    shader.vertexShader=vary+shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n cliffPoint=(instanceMatrix*vec4(position,1.)).xyz; cliffNormal=normal;');
    shader.fragmentShader=vary+shader.fragmentShader.replace('#include <map_fragment>',`
      vec3 blend=pow(abs(normalize(cliffNormal)),vec3(4.));
      blend/=max(.001,blend.x+blend.y+blend.z);
      vec3 p=cliffPoint;
      float seam=.09*sin(.049*p.x+.037*p.z)+.07*cos(.032*p.z-.024*p.x);
      vec3 impression=texture2D(map,vec2(.022*p.z+.003*p.y,.021*p.y+seam)).rgb*blend.x
        +texture2D(map,vMapUv+vec2(seam,-seam*.4)).rgb*blend.y
        +texture2D(map,vec2(.018*p.x-.002*p.y,.023*p.y+seam+.35)).rgb*blend.z;
      float depth=smoothstep(.056,.60,dot(impression,vec3(.28,.61,.11)));
      diffuseColor.rgb*=mix(vec3(.068,.092,.096),vec3(.79,.82,.73),depth);
    `);
  };
  map.wrapS=map.wrapT=T.MirroredRepeatWrapping;
  const stone=new T.Color(),moss=new T.Color('#a3b19a'),paper=new T.Color('#e2ddca');
  for(let row=rowMin;row<rowMax;row+=24)for(let col=colMin;col<colMax;col+=24){
    const nx=Math.min(24,colMax-col),nz=Math.min(24,rowMax-row),px=col*span-BOUND,pz=row*span-BOUND;
    const xyz=[],uv=[],colors=[],faces=[],normals=[];
    for(let v=0;v<=nz;v++)for(let u=0;u<=nx;u++){
      const x=px+u*span,z=pz+v*span,k=(row+v-rowMin+1)*stride+col+u-colMin+1,y=heights[k];
      const dx=(heights[k+1]-heights[k-1])/(2*span),dz=(heights[k+stride]-heights[k-stride])/(2*span);
      const slope=hypot(dx,dz),bare=ease(slope,.27,.95);
      // Wash gathers on the steeper faces. Keep islands of moss on shelves
      // and follow the turning beds of the rock through successive spurs.
      const seam=.5+.5*sin(y*.099+x*.023+z*.016+1.85*sin(z*.042-x*.014));
      const foothill=ease(y,14,38),shoulder=ease(y,36,86);
      const exposure=bare*(.50+.36*seam)+shoulder*(.08+.13*seam);
      const fade=ease(Math.min(x-west,east-x,z-north,south-z),0,30);
      const alpha=foothill*fade*Math.min(.92,exposure);
      stone.copy(paper).lerp(moss,(1-bare)*(.18+.46*seam));
      xyz.push(u*span/12,(y+.024)/12,v*span/12);colors.push(stone.r,stone.g,stone.b,alpha);
      const length=hypot(dx,1,dz);normals.push(-dx/length,1/length,-dz/length);
      uv.push((x-PEACH.x)*.019+(z-PEACH.z)*.006,(z-PEACH.z)*.023-(x-PEACH.x)*.007);
    }
    for(let v=0;v<nz;v++)for(let u=0;u<nx;u++){
      const j=v*(nx+1)+u,k=j+nx+1;
      if(Math.max(colors[j*4+3],colors[(j+1)*4+3],colors[k*4+3],colors[(k+1)*4+3])>.014)
        faces.push(j,k,j+1,j+1,k,k+1);
    }
    if(!faces.length)continue;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,4));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geo.setIndex(faces);geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    geo.userData.range=570;
    const name='peachCliff'+row+'_'+col;p.shapes[name]=geo;
    p.part(name,px,0,pz,12,12,12,'#fff',0,0,0,surface,false,true);
    yield;
  }
  const bark=brushWash(new T.MeshLambertMaterial({vertexColors:true}),.34);
  for(let i=0;i<3;i++) p.shapes['cliffPine'+i]=pine(i);
  for(const t of CLIFF_PINES) p.part('cliffPine'+t.type,t.x,terrainMeshHeight(t.x,t.z),t.z,
    t.scale,t.scale,t.scale,'#fff',t.yaw,0,0,bark,true,true);
}
