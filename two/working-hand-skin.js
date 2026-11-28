// Both mitts are sculpted into one GLB. Keep the painted outer patches,
// and continue the round flank underneath each so a socket can travel.
import {addWorkingShapes} from './working-torso.js';
import {BufferAttribute,BufferGeometry,Float32BufferAttribute,ShapeUtils,Vector2,Vector3} from './vendor/three.module.min.js';

const cache=new WeakMap();
const socketRadius=(angle,y)=>(1.075+.13*Math.sin(angle)**2)*Math.sqrt(Math.max(.085,1-((y-1.14)/1.18)**2));

function triangulateFlank(rim,inner){
  const faces=ShapeUtils.triangulateShape(rim,[inner]),points=rim.concat(inner);
  const turn=(p,a,b)=>(a.x-p.x)*(b.y-p.y)-(a.y-p.y)*(b.x-p.x);
  const cot=(p,a,b)=>((a.x-p.x)*(b.x-p.x)+(a.y-p.y)*(b.y-p.y))/turn(p,a,b);
  // Ear clipping respects the notches, but its long internal diagonals
  // cut chords across the rounded skin. Keep the boundary constrained and
  // flip interior diagonals until their opposite angles sum to at most pi.
  let changed;
  do{
    changed=false;
    const neighbours=new Map(),retired=new Set();
    for(const face of faces){
      for(let k=0;k<3;k++){
        const a=face[k],b=face[(k+1)%3],p=face[(k+2)%3];
        const key=Math.min(a,b)*points.length+Math.max(a,b),other=neighbours.get(key);
        if(!other){neighbours.set(key,{face,p});continue;}
        if(retired.has(other.face))continue;
        const q=other.p,[A,B,P,Q]=[a,b,p,q].map(i=>points[i]);
        if(turn(P,A,Q)<=0 || turn(P,Q,B)<=0 || cot(P,A,B)+cot(Q,B,A)>=-1e-7)continue;
        face.splice(0,3,p,a,q);other.face.splice(0,3,p,q,b);
        retired.add(face);retired.add(other.face);changed=true;break;
      }
    }
  }while(changed);
  return faces;
}

function smoothPaintedMouth(skin,outer,verts,keys){
  // The GLB flattens the old carved lips for the painted mouth. Some
  // edges still double back in this patch. Relax those vertices on the
  // surrounding skin, pinning the boundary and keeping UV seams welded.
  const lip=new Map();
  for(const tri of outer)for(let j=0;j<3;j++){
    const id=tri[j],p=verts[id];
    if(p.z<.85 || Math.hypot((p.x-.006)/.16,(p.y-1.18)/.14)>=1)continue;
    const k=keys[id];
    if(!lip.has(k))lip.set(k,{ids:new Set(),neighbours:new Set(),point:new Vector3()});
    const v=lip.get(k);v.ids.add(id);v.neighbours.add(tri[(j+1)%3]);v.neighbours.add(tri[(j+2)%3]);
  }
  const sample=new Vector3();
  for(let pass=0;pass<12;pass++){
    for(const v of lip.values()){
      const mean=v.point.set(0,0,0);
      for(const id of v.neighbours)mean.add(sample.fromBufferAttribute(skin,id));
      mean.divideScalar(v.neighbours.size);
    }
    for(const {ids,point} of lip.values())for(const id of ids)skin.setXYZ(id,point.x,point.y,point.z);
  }
}

export function workingHandSkin(body){
  const original=body.geometry;
  if(cache.has(original))return cache.get(original);
  const {position}=original.attributes;
  const verts=Array.from({length:position.count},(_,i)=>new Vector3().fromBufferAttribute(position,i));
  const source=verts.map((_,i)=>i),overrides=new Map(),outer=[],patch=[[],[]],weights=new Map();
  const key=p=>[p.x,p.y,p.z].map(n=>Math.round(n*1e5)).join('/');
  const fills=[[],[]],rims=[[],[]];
  const keys=verts.map(key),ids=[new Set(),new Set()],anchors=[new Map(),new Map()];
  const relative=p=>Math.hypot((Math.atan2(Math.abs(p.x),p.z)-1.065)/.365,(p.y-.755)/.315);
  const count=original.index.count,shoulderBlend=new Map(),clipEdges=new Map(),blends=new Map();
  for(let i=0;i<count;i+=3){
    const tri=[0,1,2].map(j=>original.index.getX(i+j));
    const centre=verts[tri[0]].clone().add(verts[tri[1]]).add(verts[tri[2]]).divideScalar(3);
    if(relative(centre)>=1){outer.push(tri);continue;}
    const side=centre.x>0?1:0;
    patch[side].push(tri);
    for(const id of tri)ids[side].add(id);
  }
  const index=[],skinIndices=original.attributes.skinIndex;
  const belly=body.skeleton.bones.findIndex(b=>b.name==='Belly');
  const jointIds=names=>names.map(name=>body.skeleton.bones.findIndex(b=>b.name===name));
  const joints=jointIds(['Hand_R','Hand_L']);
  function add(src,pos,normal){
    const id=source.length;source.push(source[src]);verts.push(pos);
    overrides.set(id,{pos,normal});return id;
  }
  const outside=new Map(),mobile=[[],[]],handRims=[[],[]],wristCollars=[[],[]],wristCaps=[[],[]];
  // Duplicate the edge only. Its original vertices belong to the mobile
  // patch, while these copies carry the surrounding flank and its fill.
  for(const tri of outer)for(const id of tri){
    if(!ids[0].has(id)&&!ids[1].has(id)){index.push(id);continue;}
    if(!outside.has(id)){
      const copy=add(id,verts[id].clone(),null);outside.set(id,copy);
    }
    index.push(outside.get(id));
  }
  function boundary(triangles){
    const edges=new Map();
    for(const tri of triangles)for(let i=0;i<3;i++){
      const a=tri[i],b=tri[(i+1)%3],ka=keys[a],kb=keys[b];
      const key=ka<kb?ka+' '+kb:kb+' '+ka;
      if(edges.has(key))edges.delete(key);
      else edges.set(key,[a,b]);
    }
    return edges;
  }
  for(const side of [0,1]){
    const sign=side?1:-1,edges=boundary(patch[side]);
    rims[side]=[...new Map([...edges.values()].flat().map(id=>[keys[id],id])).values()];
    // The fill follows the curvature of the belly in both directions.
    // Polygon edges on UV seams have different indices but one position.
    const centreTheta=1.065,centreY=.755;
    // A cut through indexed triangles makes short notches in the rim.
    // Space the interior vertices by perimeter, so two corners lying on
    // the same ray do not create a line of sliver triangles to the centre.
    const next=new Map([...edges.values()].map(([a,b])=>[keys[a],b]));
    const rim=rims[side],phases=new Map();
    const chart=id=>[ (Math.atan2(sign*verts[id].x,verts[id].z)-centreTheta)/.365,(verts[id].y-centreY)/.315 ];
    let id=rim[0],area=0,perimeter=0;
    while(!phases.has(keys[id])){
      phases.set(keys[id],perimeter);
      const other=next.get(keys[id]),[x,y]=chart(id),[u,v]=chart(other);
      perimeter+=Math.hypot(x-u,y-v);area+=x*v-y*u;id=other;
    }
    let xFit=0,yFit=0;
    for(const id of rim){
      const d=phases.get(keys[id])/perimeter*2*Math.PI*Math.sign(area);
      const [x,y]=chart(id),angle=Math.atan2(y,x)-d;
      xFit+=Math.cos(angle);yFit+=Math.sin(angle);
      phases.set(keys[id],d);
    }
    const phase=Math.atan2(yFit,xFit);
    function ring(id,t){
      const k=keys[id]+' '+t;
      if(anchors[side].has(k))return anchors[side].get(k);
      const p=verts[id],theta0=Math.atan2(sign*p.x,p.z);
      const a=phase+phases.get(keys[id]);
      const theta=t===1?theta0:centreTheta+.365*t*Math.cos(a);
      const y=t===1?p.y:centreY+.315*t*Math.sin(a);
      const r=socketRadius(theta,y)+(Math.hypot(p.x,p.z)-socketRadius(theta0,p.y))*t*t;
      const pos=new Vector3(sign*r*Math.sin(theta),y,r*Math.cos(theta));
      const normal=new Vector3(sign*Math.sin(theta)/1.13,(y-1.14)/1.18**2,Math.cos(theta)/1.06).normalize();
      const n=add(id,t===1?p.clone():pos,t===1?null:normal);
      if(t<1)fills[side].push([n,id,t]);
      anchors[side].set(k,n);return n;
    }
    const first=edges.values().next().value[0],centre=ring(first,0);
    // The boundary follows the original triangles and has concave notches.
    // Triangulate the annulus in surface coordinates rather than pulling
    // each notch straight to a circle, which can cross the neighbouring face.
    const ordered=[first];
    for(let id=next.get(keys[first]);keys[id]!==keys[first];id=next.get(keys[id]))ordered.push(id);
    const flat=id=>new Vector2(...chart(id));
    const border=ordered.map(id=>ring(id,1)),inner=ordered.map(id=>ring(id,.62)),band=border.concat(inner);
    for(const [a,b,c] of triangulateFlank(border.map(flat),inner.map(flat))){
      if(sign>0)index.push(band[a],band[b],band[c]);
      else index.push(band[c],band[b],band[a]);
    }
    for(const [a,b] of edges.values()){
      let oldA=ring(a,.62),oldB=ring(b,.62);
      for(const t of [.47,.33,.20,.10]){
        const newA=ring(a,t),newB=ring(b,t);
        index.push(oldA,oldB,newB,oldA,newB,newA);oldA=newA;oldB=newB;
      }
      index.push(oldA,oldB,centre);
    }
    // Cut at the crease under the actual protruding hand. The stock on
    // the inside of that crease belongs to the flank, and stays behind.
    const normalAxis=new Vector3(sign*Math.sin(centreTheta),0,Math.cos(centreTheta));
    const across=new Vector3(sign*Math.cos(centreTheta),0,-Math.sin(centreTheta));
    // A flat plane can also slice the high, broad belly above the original
    // mitt and carry a sliver of that cheek away on top of the hand. This
    // curved cut follows the raised pad in both directions.
    function padRelief(p){
      return p.dot(normalAxis)-1.146-1.8*(p.y-.744)**2-.80*p.dot(across)**2;
    }
    function intersect(a,b,da,db){
      const edge=a<b?a+'/'+b:b+'/'+a;
      if(clipEdges.has(edge))return clipEdges.get(edge);
      const t=da/(da-db),p=verts[a].clone().lerp(verts[b],t);
      const normal=new Vector3().fromBufferAttribute(original.attributes.normal,a);
      normal.lerp(new Vector3().fromBufferAttribute(original.attributes.normal,b),t).normalize();
      const id=add(a,p,normal);keys[id]=key(p);blends.set(id,[a,b,t]);clipEdges.set(edge,id);
      return id;
    }
    for(const tri of patch[side]){
      const polygon=[];
      for(let k=0;k<3;k++){
        const a=tri[k],b=tri[(k+1)%3],da=padRelief(verts[a]),db=padRelief(verts[b]);
        if(da>=0)polygon.push(a);
        if((da<0)!==(db<0))polygon.push(intersect(a,b,da,db));
      }
      for(let k=1;k<polygon.length-1;k++)mobile[side].push([polygon[0],polygon[k],polygon[k+1]]);
      for(const i of polygon)weights.set(i,joints[side]);
    }
    // Graft each pad into a low, pear-shaped shoulder. The root rises
    // outward into the flank; the tip curves down onto the work. The
    // narrow end closes inside the skin even as the grip rolls.
    const palmCentre=new Vector3(),n=new Vector3(sign*Math.sin(centreTheta),0,Math.cos(centreTheta));
    const ends=[...boundary(mobile[side]).values()];
    for(const [a] of ends)palmCentre.add(verts[a]);
    palmCentre.divideScalar(ends.length);
    handRims[side]=ends.map(([a])=>a);
    const loops=ends.map(([a])=>a);
    let previous=new Map(loops.map(i=>[keys[i],i]));
    for(const [depth,width,rise,sweep,anchor] of [
      [.045,1.03,.023,.012,.06],[.115,1.05,.083,.051,.25],[.196,1.04,.163,.117,.52],
      [.291,.98,.253,.191,.79],[.403,.85,.327,.251,1],[.56,.25,.413,.25,1],
    ]){
      const ring=new Map();
      for(const i of loops){
        const rim=verts[i].clone().sub(palmCentre);
        const tangent=rim.dot(across);
        const p=palmCentre.clone().addScaledVector(n,rim.dot(n)-depth).addScaledVector(across,sweep+tangent*width);
        p.y+=rise+rim.y*width;
        // Continue the tangent of the painted cap through the first loop
        // and ease into the broad outer surface at the top of the root.
        const normal=overrides.get(i)?.normal?.clone()??new Vector3().fromBufferAttribute(original.attributes.normal,i).normalize();
        const toward=rim.clone().addScaledVector(n,-rim.dot(n)).normalize().addScaledVector(n,.32).normalize();
        normal.lerp(toward,Math.min(1,depth*6)).normalize();
        const id=add(i,p,normal);weights.set(id,joints[side]);shoulderBlend.set(id,[side,anchor]);
        ring.set(keys[i],id);
      }
      if(anchor===.79)wristCollars[side]=[...ring.values()];
      for(const [a,b] of ends){
        const u=previous.get(keys[a]),v=previous.get(keys[b]),i=ring.get(keys[a]),j=ring.get(keys[b]);
        mobile[side].push([v,u,i],[v,i,j]);
      }
      previous=ring;
    }
    const base=palmCentre.clone().addScaledVector(n,-.59).addScaledVector(across,.24);
    base.y+=.425;
    const tip=add(loops[0],base,n.clone().negate());
    weights.set(tip,joints[side]);shoulderBlend.set(tip,[side,1]);
    wristCaps[side]=[...previous.values(),tip];
    for(const [a,b] of ends)mobile[side].push([previous.get(keys[b]),previous.get(keys[a]),tip]);
  }
  const torsoCount=index.length;
  for(const tris of mobile)for(const tri of tris)index.push(...tri);
  const g=new BufferGeometry();
  function expand(attr){
    const array=new attr.array.constructor(source.length*attr.itemSize);
    for(let i=0;i<source.length;i++)for(let j=0;j<attr.itemSize;j++)array[i*attr.itemSize+j]=attr.array[source[i]*attr.itemSize+j];
    const copy=new BufferAttribute(array,attr.itemSize,attr.normalized);copy.name=attr.name;return copy;
  }
  for(const [name,attr] of Object.entries(original.attributes))g.setAttribute(name,expand(attr));
  for(const [name,attrs] of Object.entries(original.morphAttributes))g.morphAttributes[name]=attrs.map(expand);
  g.morphTargetsRelative=original.morphTargetsRelative;g.setIndex(index);
  // Unwrap the new flank as one piece on unprinted rice. The old socket
  // crossed atlas islands; interpolating those UVs dragged the baked hand
  // crease into fine dark streaks when the shoulder moved away.
  function riceUV(id){
    const p=verts[id],angle=Math.atan2(Math.abs(p.x),p.z);
    g.attributes.uv.setXY(id,.25+(angle-1.065)*.15,.23+(p.y-.755)*.15);
  }
  for(const flank of anchors)for(const id of flank.values())riceUV(id);
  // The new shoulder and its original round tip share that rice grain.
  // This also keeps the underside free of the old hand's baked crease.
  for(const id of weights.keys())riceUV(id);
  // Preserve the authored UVs and animation across the exact cut, including
  // both vertices where a UV seam crosses its circular boundary.
  for(const [id,[a,b,t]] of blends){
    const uv=g.attributes.uv;
    uv.setXY(id,(1-t)*uv.getX(a)+t*uv.getX(b),(1-t)*uv.getY(a)+t*uv.getY(b));
    for(const attrs of Object.values(g.morphAttributes))for(const attr of attrs)
      for(let k=0;k<3;k++)attr.setComponent(id,k,(1-t)*attr.getComponent(a,k)+t*attr.getComponent(b,k));
  }
  for(const [id,{pos,normal}] of overrides){
    g.attributes.position.setXYZ(id,pos.x,pos.y,pos.z);
    if(normal)g.attributes.normal.setXYZ(id,normal.x,normal.y,normal.z);
  }
  smoothPaintedMouth(g.attributes.position,outer,verts,keys);
  for(const [id,joint] of weights){
    // Its moving joint already carries the working shoulder. Preserve
    // the sculpted pad and its rounded underside through the torso bend.
    g.attributes.skinIndex.setXYZW(id,joint,0,0,0);
    g.attributes.skinWeight.setXYZW(id,1,0,0,0);
    // The original blended flank participates in the travelling spring and
    // smile. The detached working palm has its own fixed geometry.
    for(const attrs of Object.values(g.morphAttributes))for(const attr of attrs)attr.setXYZ(id,0,0,0);
  }
  // No residual hand weight should pull a crease out of the old flank.
  for(let i=0;i<source.length;i++)if(!weights.has(i)){
    for(let j=0;j<4;j++)if(joints.includes(skinIndices.getComponent(source[i],j)))
      g.attributes.skinIndex.setComponent(i,j,belly);
  }
  // Each concentric ring shares the skin and shape-key values of its rim
  // at the outside and the same averaged values at the centre. Copying
  // an individual rim weight into the centre would crease each fan blade.
  function jointWeights(id){
    const totals=new Map();
    for(let k=0;k<4;k++){
      const joint=skinIndices.getComponent(id,k),weight=original.attributes.skinWeight.getComponent(id,k);
      if(!weight)continue;
      const j=joints.includes(joint)?belly:joint;
      totals.set(j,(totals.get(j)??0)+weight);
    }
    return totals;
  }
  for(const [side,ring] of fills.entries()){
    const rim=rims[side],average=new Map();
    for(const id of rim)for(const [j,w] of jointWeights(id))average.set(j,(average.get(j)??0)+w/rim.length);
    for(const [id,edge,t] of ring){
      const totals=new Map([...average].map(([j,w])=>[j,w*(1-t)]));
      for(const [j,w] of jointWeights(edge))totals.set(j,(totals.get(j)??0)+w*t);
      const four=[...totals].sort((a,b)=>b[1]-a[1]).slice(0,4);
      const sum=four.reduce((total,[,w])=>total+w,0);
      for(let k=0;k<4;k++){
        g.attributes.skinIndex.setComponent(id,k,four[k]?.[0]??0);
        g.attributes.skinWeight.setComponent(id,k,(four[k]?.[1]??0)/sum);
      }
    }
    for(const [name,keys] of Object.entries(original.morphAttributes))for(const [i,src] of keys.entries()){
      const dst=g.morphAttributes[name][i],mean=new Vector3(),edgeValue=new Vector3();
      for(const id of rim)mean.add(edgeValue.fromBufferAttribute(src,id));
      mean.divideScalar(rim.length);
      for(const [id,edge,t] of ring){
        edgeValue.fromBufferAttribute(src,edge).lerp(mean,1-t);
        dst.setXYZ(id,edgeValue.x,edgeValue.y,edgeValue.z);
      }
    }
  }
  g.userData.travellingSkin=original;
  g.userData.handRims=handRims;g.userData.wristCollars=wristCollars;g.userData.wristCaps=wristCaps;
  g.userData.torsoIndexCount=torsoCount;
  // A short, high-rooted mitt fits the low upper kagami tier. Sculpt this
  // arch once in bind space so its shape stays the same as the wrist turns.
  const arch=new Float32BufferAttribute(new Float32Array(source.length*3),3);
  arch.name='kagamiShoulder';
  const buriedEnds=new Set(wristCaps.flat());
  for(const [id,joint] of weights){
    const [side,w]=shoulderBlend.get(id)??[joint===joints[1]?1:0,0];
    const sign=side?1:-1,y=g.attributes.position.getY(id);
    // The hidden end curves up into the standing belly. On the flatter
    // tier it sits lower so the back of the wrist stays under the cheek.
    const rise=buriedEnds.has(id)?.39:.54;
    const up=.14*Math.max(0,y-.63)+rise*w;
    arch.setXYZ(id,-sign*Math.sin(1.065)*.16*w,up,-Math.cos(1.065)*.16*w);
  }
  // Transport the painted normals by the change in the local surface normal.
  // The other shape keys still use the original smooth normals at their seams.
  const relief=new BufferGeometry(),relieved=g.attributes.position.clone();
  for(const id of weights.keys()){
    relieved.setXYZ(id,relieved.getX(id)+arch.getX(id),relieved.getY(id)+arch.getY(id),relieved.getZ(id)+arch.getZ(id));
  }
  relief.setIndex(g.index);
  relief.setAttribute('position',g.attributes.position);relief.computeVertexNormals();
  const before=relief.attributes.normal.clone();
  relief.setAttribute('position',relieved);relief.computeVertexNormals();
  const after=relief.attributes.normal,offset=new Float32BufferAttribute(new Float32Array(source.length*3),3);
  for(const id of weights.keys())offset.setXYZ(id,after.getX(id)-before.getX(id),after.getY(id)-before.getY(id),after.getZ(id)-before.getZ(id));
  g.morphAttributes.position.push(arch);g.morphAttributes.normal.push(offset);
  addWorkingShapes(g,body.skeleton,weights);
  cache.set(original,g);return g;
}
