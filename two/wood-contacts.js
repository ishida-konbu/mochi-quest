import { isTimberFelled } from './living-build-trees.js';
// One reusable branch survey per instanced form. The cylinder sweep queries
// only woody strokes across its height, leaving the painted leaves permeable.
import {forestGeometry} from './forest-mesh.js';
import {inkTree,landmarkCulms} from './landmark-tree.js';
import {peachStrokes,cliffStrokes} from './pilgrimage-trees.js';
import {CatmullRomCurve3,Vector3} from './vendor/three.module.min.js';

const forms=new Map();
const brushOnly={sprays:{},part(){}};
const {min,max,abs,sqrt,hypot}=Math;

function segment(parts,a,b,r) {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  parts.push({x:a.x,y:a.y,z:a.z,dx,dy,dz,r,lengthSq:dx*dx+dz*dz,
    west:min(a.x,b.x)-r,east:max(a.x,b.x)+r,north:min(a.z,b.z)-r,south:max(a.z,b.z)+r,
    bottom:min(a.y,b.y)-r,top:max(a.y,b.y)+r});
}

export function groveWood(form) {
  if(forms.has(form))return forms.get(form);
  const parts=[],culms=[];
  forestGeometry(form,false,false,(points,radii,culm)=>{
    if(culm){
      // The renderer lowers only the bottom ring to meet all five corners
      // of the hillside. Keep those local corners for each planted instance.
      const root=points[0],axis=points[1].clone().sub(root).normalize();
      const side=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
      const cross=axis.clone().cross(side).normalize(),corners=[];
      for(let k=0;k<5;k++){
        const angle=2*Math.PI*k/5,r=radii[0]*(1+.25*Math.cos(3*angle));
        corners.push(root.clone().addScaledVector(side,r*Math.cos(angle)).addScaledVector(cross,r*Math.sin(angle)));
      }
      culms.push({root,next:points[1],r:(radii[0]+radii[1])*.5,corners});
    }
    for(let i=culm?2:1;i<points.length;i++){
      segment(parts,points[i-1],points[i],(radii[i-1]+radii[i])*.5);
      if(culms.length)parts.at(-1).culm=culms.length-1;
    }
  });
  if(culms.length)parts.culms=culms;
  measureWood(parts);
  forms.set(form,parts);
  return parts;
}
export function groundedCulms(parts,tree,base,yaw,soil){
  const result=[],c=Math.cos(yaw),s=Math.sin(yaw);
  for(const [slot,{root,next,r,corners}] of parts.culms.entries()){
    let drop=0;
    for(const q of corners){
      const x=tree.x+tree.h*(c*q.x+s*q.z),z=tree.z+tree.h*(-s*q.x+c*q.z);
      drop=min(drop,(soil(x,z)-.105-base)/tree.h-q.y);
    }
    segment(result,{x:root.x,y:root.y+drop,z:root.z},next,r);
    result.at(-1).culm=slot;
  }
  measureWood(result);
  return result;
}
export function landmarkWood(tree,random,height,elder,near) {
  const parts=[],ground=height(tree.x,tree.z);
  const local=q=>({x:q.x-tree.x,y:q.y-ground,z:q.z-tree.z});
  if(tree.kind==='bamboo'){
    for(const [slot,{x,z,high,lean}] of landmarkCulms(tree,random).stems.entries()){
      segment(parts,{x:x-tree.x,y:-.02,z:z-tree.z},{x:x+lean-tree.x,y:high-.02,z:z+.12-tree.z},.075);
      parts.at(-1).culm=slot;
    }
  }else{
    const brush={stroke(points,radii,sides,steps){
      // Sample the very same spline that carries the trunk and root rings.
      const curve=new CatmullRomCurve3(points,false,'centripetal');
      const n=min(steps,2*(points.length-1));
      let last=local(points[0]);
      for(let i=1;i<=n;i++){
        const along=(i-.5)*(radii.length-1)/n,lo=Math.floor(along);
        const r=radii[lo]+(radii[lo+1]-radii[lo])*(along-lo);
        const at=local(curve.getPoint(i/n));
        segment(parts,last,at,r);last=at;
      }
    }};
    inkTree(brush,brushOnly,tree,random,height,elder,near,false);
  }
  measureWood(parts);
  return parts;
}
export function pilgrimageWood(kind,form,seeded){
  const key=kind+form;
  if(forms.has(key))return forms.get(key);
  const parts=[],brush={stroke(tint,knots,widths,steps){
    const path=new CatmullRomCurve3(knots.map(p=>new Vector3(...p)));
    let last=path.getPointAt(0);
    for(let i=1;i<=steps;i++){
      const at=path.getPointAt(i/steps),t=(i-.5)*(widths.length-1)/steps,k=Math.floor(t);
      segment(parts,last,at,widths[k]+(widths[k+1]-widths[k])*(t-k));last=at;
    }
  }};
  if(kind==='peach')peachStrokes(brush,seeded(76231+form*3504));
  else cliffStrokes(brush,form);
  measureWood(parts);
  forms.set(key,parts);
  return parts;
}
function measureWood(parts) {
  let reach=0,bottom=Infinity,top=-Infinity;
  for(const q of parts){
    reach=max(reach,hypot(q.x,q.z)+q.r,hypot(q.x+q.dx,q.z+q.dz)+q.r);
    bottom=min(bottom,q.bottom);top=max(top,q.top);
  }
  Object.assign(parts,{reach,bottom,top});
}

// Return the surface inside this vertical search interval. floor asks for a
// top no higher than hi, ceiling for an underside above lo. The depth query
// clips the centreline to the body's height before measuring side clearance.
export function woodContact(tree,x,z,pad,lo,hi,kind) {
  let result=kind==='ceiling'?Infinity:kind==='depth'?0:-Infinity;
  if(tree.tree && isTimberFelled(tree.tree))return result;
  const dx=x-tree.x,dz=z-tree.z,scale=tree.scale;
  if(abs(dx)>tree.rx+pad || abs(dz)>tree.rz+pad ||
      lo>tree.top || hi<tree.bottom)return result;
  const u=(dx*tree.c-dz*tree.s)/scale,v=(dx*tree.s+dz*tree.c)/scale;
  pad/=scale;lo=(lo-tree.base)/scale;hi=(hi-tree.base)/scale;
  const extra=tree.culmFeet,wood=tree.wood;
  for(let i=-(extra?.length??0);i<wood.length;i++) {
    const q=i<0?extra[-1-i]:wood[i];
    if(u<q.west-pad || u>q.east+pad || v<q.north-pad || v>q.south+pad || lo>q.top || hi<q.bottom)continue;
    const ox=u-q.x,oz=v-q.z,r=q.r+pad;
    const near=q.lengthSq?(ox*q.dx+oz*q.dz)/q.lengthSq:0;
    const ex=ox-near*q.dx,ez=oz-near*q.dz,remain=r*r-ex*ex-ez*ez;
    if(remain<0)continue;
    const reach=q.lengthSq?sqrt(remain/q.lengthSq):Infinity;
    let a=max(0,near-reach),b=min(1,near+reach);
    if(a>b)continue;
    const ya=q.y+a*q.dy,yb=q.y+b*q.dy,bottom=min(ya,yb)-q.r,top=max(ya,yb)+q.r;
    if(top<lo || bottom>hi)continue;
    if(kind==='depth'){
      if(q.dy){
        const t1=(lo-q.r-q.y)/q.dy,t2=(hi+q.r-q.y)/q.dy;
        a=max(a,min(t1,t2));b=min(b,max(t1,t2));
      }
      const t=max(a,min(b,near));
      result=max(result,(r-hypot(ox-t*q.dx,oz-t*q.dz))*scale);
    }else if(kind==='ceiling'){
      // A low root on an uphill tread can be stepped onto. Its underside
      // only becomes an overhead obstruction above the ordinary step range.
      if(bottom>lo && top>lo+.34/scale)result=min(result,bottom*scale+tree.base);
    }else if(kind!=='floor' || top<=hi)result=max(result,top*scale+tree.base);
  }
  return result;
}
