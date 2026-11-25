// Unfold the traveller's own mitt into a disk. Its boundary stays sewn to
// the cheek while the interior can be drawn out to an arbitrary work point.
// Welding is only for the solve: the separate UV islands survive on the GPU.
import {BufferGeometry,Float32BufferAttribute,DynamicDrawUsage,Vector3} from './vendor/three.module.min.js';

const tau=2*Math.PI;
const wrap=a=>(a+tau)%tau;
export function separateMitts(body,hands){
  const g=body.geometry,{position,skinIndex,skinWeight}=g.attributes;
  const handJoints=hands.map(b=>body.skeleton.bones.indexOf(b));
  const weights=handJoints.map(joint=>Array.from({length:position.count},(_,i)=>{
    let w=0;
    for(let k=0;k<4;k++)if(skinIndex.getComponent(i,k)===joint)w+=skinWeight.getComponent(i,k);
    return w;
  }));
  const leave=[],sides=[[],[]],index=g.index.array;
  const socket=Array.from({length:position.count},(_,i)=>{
    const x=position.getX(i),z=position.getZ(i),height=(position.getY(i)-.81)/.46;
    const latitude=(Math.atan2(Math.abs(x),z)-.99)/.56;
    return height*height+latitude*latitude;
  });
  for(let k=0;k<index.length;k+=3){
    const a=index[k],b=index[k+1],c=index[k+2];
    let hand=weights.findIndex(w=>w[a]+w[b]+w[c]>.036);
    if(hand<0 && socket[a]+socket[b]+socket[c]<3)hand=position.getX(a)<0?0:1;
    (hand<0?leave:sides[hand]).push(a,b,c);
  }
  // Replace the index alone. The travel mesh, morphs and skin remain shared.
  const torso=new BufferGeometry();
  for(const [name,attribute] of Object.entries(g.attributes))torso.setAttribute(name,attribute);
  torso.morphAttributes=g.morphAttributes;torso.morphTargetsRelative=g.morphTargetsRelative;
  torso.setIndex(leave);
  body.geometry=torso;
  return sides.map(indices=>unwrap(g,indices));
}
function unwrap(g,indices){
  const {position,normal,uv}=g.attributes,ids=[...new Set(indices)],skin=[],grain=[],map=[];
  const samples=[],coordinates=new Map(),nodes=[],local=new Map();
  for(const [i,id] of ids.entries()){
    local.set(id,i);
    const p=new Vector3().fromBufferAttribute(position,id),key=p.toArray().map(v=>Math.round(v*1e5)).join('/');
    if(!coordinates.has(key)){
      coordinates.set(key,nodes.length);
      nodes.push({id,p,links:new Set(),rim:false,u:0,v:0,point:new Vector3(),normal:new Vector3()});
    }
    samples.push(coordinates.get(key));
    skin.push(p.x,p.y,p.z);grain.push(normal.getX(id),normal.getY(id),normal.getZ(id));map.push(uv.getX(id),uv.getY(id));
  }
  let ix=indices.map(id=>local.get(id));
  const faces=ix.map(i=>samples[i]),edges=new Set(),n=nodes.length;
  for(let i=0;i<faces.length;i+=3)for(let j=0;j<3;j++){
    const a=faces[i+j],b=faces[i+(j+1)%3];
    nodes[a].links.add(b);nodes[b].links.add(a);
    if(!edges.delete(b*n+a))edges.add(a*n+b);
  }
  const next=new Map([...edges].map(e=>[Math.floor(e/n),e%n])),perimeter=[];
  let here=next.keys().next().value,distance=0;
  while(perimeter.length<next.size){
    const node=nodes[here],following=next.get(here);
    node.rim=true;node.arc=distance;perimeter.push(node);
    distance+=node.p.distanceTo(nodes[following].p);here=following;
  }
  for(const node of perimeter){
    const a=tau*node.arc/distance;node.u=Math.cos(a);node.v=Math.sin(a);
  }
  // A positive-weight harmonic map gives every native triangle its own
  // patch of skin, including those curling underneath the little round tip.
  const inside=nodes.filter(node=>!node.rim);
  for(const node of inside)node.neighbours=[...node.links].map(i=>nodes[i]);
  for(let sweep=0;sweep<330;sweep++){
    let change=0;
    for(const p of inside){
      let u=0,v=0;
      for(const q of p.neighbours){u+=q.u;v+=q.v;}
      u/=p.neighbours.length;v/=p.neighbours.length;
      change=Math.max(change,Math.abs(u-p.u),Math.abs(v-p.v));p.u=u;p.v=v;
    }
    if(change<.000008)break;
  }
  const tip=inside.reduce((a,b)=>a.u*a.u+a.v*a.v<b.u*b.u+b.v*b.v?a:b);
  const ox=tip.u,oy=tip.v;
  for(const node of nodes){
    // Move a real vertex to the pole with a disk automorphism. A tool
    // contact is then an exact point on the visible, indexed rice surface.
    const x=node.u-ox,y=node.v-oy,a=1-ox*node.u-oy*node.v,b=oy*node.u-ox*node.v;
    const k=a*a+b*b;
    const u=(x*a+y*b)/k,v=(y*a-x*b)/k;
    node.u=u;node.v=v;
  }
  // The travel mesh spends most of its triangles on its little palm. Split
  // the long intervening faces in disk space before they travel a metre.
  // Matching splits on both UV islands keep their seam closed.
  for(let pass=0;pass<5;pass++){
    const sides=new Map(),split=new Map(),nextFaces=[];
    function middle(a,b){
      const key=a<b?a+','+b:b+','+a;
      if(sides.has(key))return sides.get(key);
      const i=samples[a],j=samples[b],lo=nodes[i],hi=nodes[j];
      if(lo.rim && hi.rim || Math.hypot(lo.u-hi.u,lo.v-hi.v)<.095)return -1;
      const weld=i<j?i+','+j:j+','+i;
      if(!split.has(weld)){
        split.set(weld,nodes.length);
        const p={u:(lo.u+hi.u)/2,v:(lo.v+hi.v)/2,from:lo,to:hi,point:new Vector3(),normal:new Vector3()};
        nodes.push(p);inside.push(p);
      }
      const id=samples.length;samples.push(split.get(weld));sides.set(key,id);
      for(const [attr,size] of [[skin,3],[grain,3],[map,2]])
        for(let k=0;k<size;k++)attr.push((attr[a*size+k]+attr[b*size+k])/2);
      return id;
    }
    for(let k=0;k<ix.length;k+=3){
      const v=ix.slice(k,k+3),m=v.map((a,i)=>middle(a,v[(i+1)%3]));
      const count=m.filter(id=>id>=0).length;
      if(!count){nextFaces.push(...v);continue;}
      if(count===3){
        for(let i=0;i<3;i++)nextFaces.push(v[i],m[i],m[(i+2)%3]);
        nextFaces.push(...m);continue;
      }
      const i=count===1?m.findIndex(id=>id>=0):(m.findIndex(id=>id<0)+1)%3;
      const j=(i+1)%3,h=(i+2)%3;
      if(count===1)nextFaces.push(v[i],m[i],v[h],m[i],v[j],v[h]);
      else nextFaces.push(m[i],v[j],m[j],v[i],m[i],v[h],m[i],m[j],v[h]);
    }
    ix=nextFaces;if(!sides.size)break;
  }
  for(const p of nodes){
    p.native=new Vector3();p.angle=wrap(Math.atan2(p.v,p.u));p.r=p.rim?1:Math.min(1,Math.hypot(p.u,p.v));
  }
  for(const p of nodes){p.cos=Math.cos(p.angle);p.sin=Math.sin(p.angle);}
  const geometry=new BufferGeometry();
  geometry.setIndex(ix);
  geometry.setAttribute('uv',new Float32BufferAttribute(map,2));
  geometry.setAttribute('doughRest',new Float32BufferAttribute(skin,3));
  geometry.setAttribute('doughGrain',new Float32BufferAttribute(grain,3));
  for(const name of ['position','normal'])geometry.setAttribute(name,new Float32BufferAttribute(new Float32Array(skin.length),3).setUsage(DynamicDrawUsage));
  return {geometry,nodes,inside,perimeter,tip,samples,faces:ix.map(i=>samples[i])};
}
