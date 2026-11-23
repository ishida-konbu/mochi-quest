// Stream centrelines come from the curves that draw the water. Only a stream
// beside the traveller asks for the current pose of the skinned rice surface.
import * as T from './vendor/three.module.min.js';
import { MOUNTAIN_STREAMS, waterfallSurface } from './mountain-streams.js';
import { nearbyRetreat } from './retreat-layout.js';
import { SNOW_SPRING, springLevel } from './terrain.js';

const courses = new WeakMap();
export function registerFallingWater(site, family, paths) {
  if (!courses.has(site)) courses.set(site, new Map());
  const c=Math.cos(site.yaw), s=Math.sin(site.yaw), level=site.level ?? springLevel(site);
  courses.get(site).set(family,paths.map(({points,width}) => {
    const head=points[0],end=points.at(-1),dx=end.x-head.x,dz=end.z-head.z,run=Math.hypot(dx,dz);
    const u=run>.04?dz/run:1,v=run>.04?-dx/run:0;
    return {width,floor:level+end.y,side:new T.Vector3(c*u+s*v,0,-s*u+c*v),
      points:points.map(p=>new T.Vector3(site.x+c*p.x+s*p.z,level+p.y,site.z-s*p.x+c*p.z))};
  }));
}

// Remove only the part of each falling sheet intercepted by the head or
// shoulder. The gaps can widen as the remaining strands spread downstream.
export const jetContacts = { value: Array.from({length:3},()=>new T.Vector4(0,0,0,0)) };
export const interceptedJetGLSL = `
  uniform vec4 jetContacts[3];
  float fallingCoverage(vec3 p){
    float cover=1.;
    for(int i=0;i<3;i++){
      vec4 hit=jetContacts[i];
      if(hit.w<=0. || p.y>hit.y)continue;
      float below=hit.y-p.y, r=hit.w+min(.23,.22*below);
      float edge=smoothstep(r*.68,r,distance(p.xz,hit.xz));
      cover*=mix(1.,edge,smoothstep(0.,.065,below));
    }
    return cover;
  }
`;

// Collapse nearby rest vertices onto an actual skin vertex. Keeping the
// original triangle connectivity preserves the cheeks, shoulders and bent
// crown. The samples then receive the same shape keys and bones as the art.
function contactSkin(body) {
  const geo=body.geometry, pos=geo.attributes.position, groups=new Map(), samples=[], remap=[];
  for(let i=0;i<pos.count;i++) {
    const x=pos.getX(i)*4.6,y=pos.getY(i)*4.6,z=pos.getZ(i)*4.6;
    const ix=Math.round(x),iy=Math.round(y),iz=Math.round(z), key=(ix+32)*4096+(iy+32)*64+iz+32;
    const d=(x-ix)**2+(y-iy)**2+(z-iz)**2;
    let g=groups.get(key);
    if(!g){g={index:samples.length,id:i,d};groups.set(key,g);samples.push(g);}
    if(d<g.d){g.id=i;g.d=d;}
    remap.push(g.index);
  }
  const triangles=[],unique=new Set(),index=geo.index?.array;
  const count=index?.length ?? pos.count;
  for(let i=0;i<count;i+=3){
    const a=remap[index?index[i]:i],b=remap[index?index[i+1]:i+1],c=remap[index?index[i+2]:i+2];
    if(a===b || b===c || a===c)continue;
    const [l,m,n]=[a,b,c].sort((p,q)=>p-q), code=(l*samples.length+m)*samples.length+n;
    if(!unique.has(code)){triangles.push(a,b,c);unique.add(code);}
  }
  return {samples,triangles,points:samples.map(()=>new T.Vector3()),projection:new Float32Array(triangles.length/3*6)};
}

export function createJetContact() {
  const skinCache=new WeakMap(), ray=new T.Ray(), cross=new T.Vector3(), edge=new T.Vector3();
  const hit=new T.Vector3(),normal=new T.Vector3(),segment=new T.Vector3(),edgeA=new T.Vector3(),edgeB=new T.Vector3();
  const lanes=Array.from({length:3},()=>({
    points:Array.from({length:18},()=>new T.Vector3()),width:.36,floor:0,
  }));
  return function trace(p,body,onHit){
    for(const v of jetContacts.value)v.w=0;
    if(!body || p.diveDepth>1.8)return;
    const pose=p.activity==='bath'?p.bathPose:null, x=pose?.x??p.x,z=pose?.z??p.z;
    let skin,count=0;
    function currentSkin(){
      skin=skinCache.get(body);
      if(!skin){skin=contactSkin(body);skinCache.set(body,skin);}
      body.parent.updateWorldMatrix(true,true);
      // A SkinnedMesh refreshes its attached bind inverse in updateMatrixWorld.
      body.updateMatrixWorld();
      for(let i=0;i<skin.samples.length;i++)
        body.getVertexPosition(skin.samples[i].id,skin.points[i]).applyMatrix4(body.matrixWorld);
    }
    // Cache the xz projection once per pose. A rivulet asks for many surface
    // heights along its course, all on that same set of small skin triangles.
    let projected=false;
    function surfaceY(x,z){
      const {triangles,points,projection}=skin;
      if(!projected){
        for(let i=0;i<triangles.length;i+=3){
          const a=points[triangles[i]],b=points[triangles[i+1]],c=points[triangles[i+2]],j=i*2;
          projection[j]=Math.min(a.x,b.x,c.x);projection[j+1]=Math.max(a.x,b.x,c.x);
          projection[j+2]=Math.min(a.z,b.z,c.z);projection[j+3]=Math.max(a.z,b.z,c.z);
          const d=(b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z);
          projection[j+4]=Math.abs(d)<.000001?0:1/d;
        }
        projected=true;
      }
      let top=-Infinity;
      for(let i=0;i<triangles.length;i+=3){
        const j=i*2;
        if(x<projection[j] || x>projection[j+1] || z<projection[j+2] || z>projection[j+3] || !projection[j+4])continue;
        const a=points[triangles[i]],b=points[triangles[i+1]],c=points[triangles[i+2]],dx=x-a.x,dz=z-a.z;
        const u=(dx*(c.z-a.z)-dz*(c.x-a.x))*projection[j+4];
        const v=(dz*(b.x-a.x)-dx*(b.z-a.z))*projection[j+4];
        if(u>=0 && v>=0 && u+v<=1)top=Math.max(top,a.y+u*(b.y-a.y)+v*(c.y-a.y));
      }
      return top;
    }
    function tracePath(path,offset=0) {
      const pts=path.points;
      for(let j=1;j<pts.length && count<3;j++){
        const a=offset?edgeA.copy(pts[j-1]).addScaledVector(path.side,offset):pts[j-1];
        const b=offset?edgeB.copy(pts[j]).addScaledVector(path.side,offset):pts[j];
        if(b.y>=a.y-.002 || Math.min(a.x,b.x)>x+2.4 || Math.max(a.x,b.x)<x-2.4 ||
          Math.min(a.z,b.z)>z+2.4 || Math.max(a.z,b.z)<z-2.4 ||
          b.y>p.y+4.2 || a.y<p.y-.8)continue;
        if(!skin)currentSkin();
        ray.origin.copy(a);segment.subVectors(b,a);let closest=segment.length();
        ray.direction.copy(segment).divideScalar(closest);
        let found=false;
        const {triangles,points}=skin;
        for(let i=0;i<triangles.length;i+=3){
          const u=points[triangles[i]],v=points[triangles[i+1]],w=points[triangles[i+2]];
          if(Math.min(u.y,v.y,w.y)>a.y+.005 || Math.max(u.y,v.y,w.y)<b.y-.005)continue;
          if(!ray.intersectTriangle(u,v,w,false,cross))continue;
          const distance=cross.distanceTo(a);
          if(distance>closest)continue;
          closest=distance;hit.copy(cross);found=true;
          normal.subVectors(v,u).cross(edge.subVectors(w,u)).normalize();
          if(normal.dot(ray.direction)>0)normal.negate();
        }
        if(found){
          jetContacts.value[count++].set(hit.x,hit.y,hit.z,Math.min(.59,Math.max(.21,path.width*1.3)));
          onHit(hit,normal,ray.direction,path.width-Math.abs(offset)*.65,path.floor,count-1,surfaceY);
          return true;
        }
      }
    }

    const site=Math.abs(x-SNOW_SPRING.x)<17 && Math.abs(z-SNOW_SPRING.z)<13 ? SNOW_SPRING : nearbyRetreat(x,z);
    if(site && courses.has(site))for(const paths of courses.get(site).values())for(const path of paths){
      const toe=path.points.at(-1),dx=x-toe.x,dz=z-toe.z;
      if(dx*dx+dz*dz>18)continue;
      if(!tracePath(path) && path.width>.055){
        const side=Math.sign(dx*path.side.x+dz*path.side.z);
        if(side)tracePath(path,side*path.width*.76);
      }
    }
    for(const stream of MOUNTAIN_STREAMS){
      const {lip,toe,run,fx,fz}=stream.fall,dx=x-lip.x,dz=z-lip.z;
      const across=dx*fz-dz*fx,along=dx*fx+dz*fz;
      if(along< -1.1 || along>run+1.2 || Math.abs(across)>lip.width*1.2+1 ||
         p.y>lip.y+1 || p.y<toe.y-3)continue;
      const v=T.MathUtils.clamp(along/run,0,1), width=T.MathUtils.lerp(lip.width,Math.min(toe.width*.89,lip.width*1.16),v);
      for(let k=0;k<3;k++){
        const u=(across+(k-1)*.42)/width;
        if(Math.abs(u)>.98)continue;
        const lane=lanes[k];lane.floor=toe.y;
        for(let j=0;j<lane.points.length;j++)waterfallSurface(stream,u,j/(lane.points.length-1),lane.points[j]);
        tracePath(lane);
      }
    }
  };
}
