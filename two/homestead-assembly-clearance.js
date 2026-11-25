// Surfaces have to travel with the carpenter. A clearance query finds the
// next usable carrying height at this grip and attitude; hollow frames retain
// their openings, so a beam can travel beneath an already fitted eave.
import { Euler, Matrix4, Triangle, Vector3 } from './vendor/three.module.min.js';
import { makeAssemblyTextile } from './homestead-assembly-textile.js';

const cell=.115, skin=.035, clouds=new WeakMap();
const column=(x,z)=>(Math.floor(x/cell)+512)*1024+Math.floor(z/cell)+512;
function surfaceCloud(step,furled){
  let views=clouds.get(step);
  if(!views){views=new Map();clouds.set(step,views);}
  const key=Boolean(furled && step.unfurl);
  if(views.has(key))return views.get(key);
  const cloth=key?makeAssemblyTextile(step):null;
  cloth?.unroll(0);
  const geometry=cloth?.geometry??step.geometry,pos=geometry.attributes.position,idx=geometry.index.array;
  const tri=new Triangle(),points=new Map();
  function sample(x,y,z){
    x-=step.grip[0];y-=step.grip[1];z-=step.grip[2];
    const k=(Math.round(x/.079)+128)*65536+(Math.round(y/.079)+128)*256+Math.round(z/.079)+128;
    if(!points.has(k))points.set(k,[x,y,z]);
  }
  const borderA=new Vector3(),borderB=new Vector3();
  for(let i=0;i<idx.length;i+=3){
    tri.setFromAttributeAndIndices(pos,idx[i],idx[i+1],idx[i+2]);
    let {a,b,c}=tri;
    const ab=a.distanceTo(b),bc=b.distanceTo(c),ca=c.distanceTo(a),longest=Math.max(ab,bc,ca);
    if(longest===ab)[a,b,c]=[c,a,b];else if(longest===ca)[a,b,c]=[b,c,a];
    const rows=Math.max(1,Math.ceil(2*tri.getArea()/longest/.075));
    for(let j=0;j<=rows;j++){
      const t=j/rows;
      borderA.lerpVectors(a,b,t);borderB.lerpVectors(a,c,t);
      const spans=Math.max(1,Math.ceil(t*longest/.075));
      for(let k=0;k<=spans;k++){
        const u=k/spans;
        sample(borderA.x+u*(borderB.x-borderA.x),borderA.y+u*(borderB.y-borderA.y),borderA.z+u*(borderB.z-borderA.z));
      }
    }
  }
  cloth?.geometry.dispose();
  const result=Float32Array.from([...points.values()].flat());
  views.set(key,result);return result;
}
function transformed(cloud,grip,rotation,add){
  const e=new Matrix4().makeRotationFromEuler(new Euler(...rotation)).elements;
  for(let i=0;i<cloud.length;i+=3){
    const a=cloud[i],b=cloud[i+1],c=cloud[i+2];
    add(grip[0]+a*e[0]+b*e[4]+c*e[8],grip[1]+a*e[1]+b*e[5]+c*e[9],grip[2]+a*e[2]+b*e[6]+c*e[10]);
  }
}
function columnsOf(cloud,grip,rotation){
  const map=new Map();
  transformed(cloud,grip,rotation,(x,y,z)=>{
    const k=column(x,z),height=Math.round(y/.045);
    if(!map.has(k))map.set(k,new Set());
    map.get(k).add(height);
  });
  const bands=new Map();
  for(const [key,layers] of map){
    const sorted=[...layers].sort((a,b)=>a-b),list=[];
    for(const v of sorted){
      const y=v*.045,last=list.at(-1);
      if(last && y-last[1]<.13)last[1]=y;
      else list.push([y,y]);
    }
    bands.set(key,list);
  }return bands;
}
export function makeAssemblyLoadField(steps,staging,land){
  const fixed=[],stock=[],carry=[];
  for(const [i,step] of steps.entries()){
    fixed.push(columnsOf(surfaceCloud(step,false),step.grip,[0,0,0]));
    const cloud=surfaceCloud(step,true),pile=staging[i];
    stock.push(columnsOf(cloud,pile.grip,pile.rotation));carry.push(cloud);
  }
  const fields=new Map(),floor=new Map(),rotation=[0,0,0];
  function fieldFor(index){
    if(fields.has(index))return fields.get(index);
    const field=new Map();
    for(let i=0;i<steps.length;i++){
      if(i===index)continue;
      for(const [key,bands] of (i<index?fixed[i]:stock[i])){
        if(!field.has(key))field.set(key,[]);
        field.get(key).push(...bands);
      }
    }
    fields.set(index,field);return field;
  }
  function groundAt(key,x,z){
    if(!floor.has(key))floor.set(key,land([x,z]));
    return floor.get(key);
  }
  return function required(index,grip,attitude=rotation){
    const field=fieldFor(index),blocked=[],seen=new Set();
    let low=grip[1];
    transformed(carry[index],[grip[0],0,grip[2]],attitude,(x,y,z)=>{
      const key=column(x,z),iy=Math.round(y/.047);
      const sampleKey=key*512+iy+256;
      if(seen.has(sampleKey))return;
      seen.add(sampleKey);
      low=Math.max(low,groundAt(key,x,z)-y+.045);
      for(const [bottom,top] of field.get(key)??[]){
        const limit=top-y+skin;
        if(limit>=grip[1])blocked.push([bottom-y-skin,limit]);
      }
    });
    blocked.sort((a,b)=>a[0]-b[0]);
    for(const [from,to] of blocked){
      if(from>low)break;
      low=Math.max(to,low);
    }
    return low;
  };
}
