// A portable pair of shear legs, guyed on the far side of the joint. The
// descending fall and its two bridles follow the timber into its socket.
import { DoubleSide,Group,Mesh,MeshBasicMaterial,Raycaster,Vector3 } from './vendor/three.module.min.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';

const surveyMaterial=new MeshBasicMaterial({side:DoubleSide});

// Collision witnesses stay in the same metre frame as the animated kit.
// Permanently fitted floors and roofs can carry the temporary shear legs.
export function slingSurface(geometry,x=0,y=0,z=0,yaw=0){
  const mesh=new Mesh(geometry,surveyMaterial);
  mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.updateMatrixWorld(true);
  return mesh;
}

export function planSling(step,stock,land,installed=[],worker) {
  const g=step.grip,n=stock.normal,t=[n[1],-n[0]];
  const {min,max}=step.bounds,position=step.geometry.attributes.position;
  const middle=[(min[0]+max[0])/2,(min[2]+max[2])/2],ties=[];
  for(const side of [-1,1]){
    const target=[middle[0]+side*t[0]*(max[0]-min[0])*.26,
      max[1],middle[1]+side*t[1]*(max[2]-min[2])*.26];
    let best=null,score=Infinity;
    for(let i=0;i<position.count;i++){
      const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
      const d=(x-target[0])**2+(y-target[1])**2+(z-target[2])**2;
      if(d<score){score=d;best=[x,y,z];}
    }
    ties.push(new Vector3(...best));
  }
  const hook=ties[0].clone().lerp(ties[1],.5);
  hook.y=Math.max(ties[0].y,ties[1].y,g[1])+.91;
  const caster=new Raycaster(),direction=new Vector3(),hits=[];
  function firstHit(from,to,meshes){
    direction.subVectors(to,from);const length=direction.length();
    caster.set(from,direction.normalize());caster.near=.006;caster.far=length;
    hits.length=0;caster.intersectObjects(meshes,false,hits);return hits[0];
  }
  const loose=[0,.25,.5,.75,1].map(f=>slingSurface(step.geometry,...stock.offset.map(v=>v*f)));

  function bearing(head,x,z){
    const ground=land([x,z]),top=new Vector3(x,head.y+.01,z);
    const hit=firstHit(top,new Vector3(x,ground-.2,z),installed);
    const raised=hit && hit.point.y>ground+.035;
    const foot=new Vector3(x,raised?hit.point.y:ground,z);
    // A higher sill can lie across a splayed leg whose toe would otherwise
    // be on the floor. Seat it on that sill or turn the frame to a clear bay.
    const across=firstHit(head,foot,installed);
    let face=raised?hit.face.normal.y:1;
    if(across && across.point.distanceTo(foot)>.035){
      foot.copy(across.point);face=across.face.normal.y;
    }
    return {foot,head,mounted:foot.y>land([foot.x,foot.z])+.035,face};
  }
  function candidate(a,spread,overhang){
    const back=.76*spread/1.10;
    const o=[n[0]*Math.cos(a)+n[1]*Math.sin(a),n[1]*Math.cos(a)-n[0]*Math.sin(a)],side=[o[1],-o[0]];
    const crown=hook.clone().add(new Vector3(-o[0]*overhang,overhang>0?.37:0,-o[1]*overhang));
    const point=(u,v,dy)=>new Vector3(crown.x+side[0]*u-o[0]*v,crown.y+dy,crown.z+side[1]*u-o[1]*v);
    const legs=[-1,1].map(k=>{
      const toe=point(k*spread,back,0),head=point(-k*.09,0,.14);
      return bearing(head,toe.x,toe.z);
    });
    // The backstay balances the pair on the other side of the vertical fall.
    const peg=point(.20,-back*1.8,0),guy=bearing(crown,peg.x,peg.z);
    let score=.13*Math.abs(a)+.05*overhang+.035*(spread-1.1);
    // Where a broad roof panel occupies the space below the fall, lash a
    // small projecting jib above it and plant the shear legs outboard.
    const jib=overhang ? point(0,.15,-.34) : null;
    if(jib && (firstHit(jib,hook,installed) || firstHit(crown,hook,installed)))score+=24;
    for(const leg of [...legs,guy]){
      const {foot,head}=leg,run=Math.hypot(foot.x-crown.x,foot.z-crown.z);
      score+=20*Math.max(0,.45-run)+20*Math.max(0,.28-(head.y-foot.y));
      if(leg!==guy && leg.face<.5)score+=12;
      if(firstHit(head,foot,loose))score+=24;
      if(worker){
        const dx=head.x-foot.x,dz=head.z-foot.z;
        const u=Math.max(0,Math.min(1,((worker.x-foot.x)*dx+(worker.z-foot.z)*dz)/(dx*dx+dz*dz||1)));
        const y=foot.y+(head.y-foot.y)*u;
        if(y>worker.y+.05 && y<worker.y+1.60*worker.size &&
           Math.hypot(foot.x+dx*u-worker.x,foot.z+dz*u-worker.z)<.84*worker.size)score+=24;
      }
    }
    return {legs,guy,crown,jib,score};
  }
  let best;
  for(const overhang of [0,.65,1.35,2.15]){
    for(const spread of [1.10,1.72,2.40]){
      for(let j=0;j<16;j++){
        const a=Math.ceil(j/2)*(Math.PI/8)*(j%2?-1:1),v=candidate(a,spread,overhang);
        if(!best || v.score<best.score)best=v;
        if(best.score<.02)break;
      }
      if(best.score<1.0)break;
    }
    if(best.score<1.0)break;
  }
  return {hook,ties,...best};
}

export function makeLiftingSling(step,stock,land,installed,worker) {
  const {crown,hook,jib,ties,legs,guy}=planSling(step,stock,land,installed,worker);
  const timber=hokoraCarpentry(),apex=crown.toArray();
  for(const [i,leg] of legs.entries()){
    const toe=leg.foot.clone();
    if(!leg.mounted)toe.y-=.065;
    else timber.box('wood','#aa926f',toe.clone().add(new Vector3(0,.027,0)).toArray(),[.15,.052,.14],
      {grain:'x',bevel:.008,seed:i});
    timber.beam('wood','#af9974',toe.toArray(),leg.head.toArray(),.073,.083,{bevel:.015,seed:i+3});
  }
  if(jib){
    timber.beam('wood','#b09c76',jib.toArray(),hook.toArray(),.086,.105,{bevel:.012,seed:4});
    timber.beam('rope','#94764e',apex,hook.toArray(),.028,.028,{bevel:.005});
  }
  const anchor=guy.foot.clone();
  if(guy.mounted){
    timber.box('rope','#a88c5f',anchor.clone().add(new Vector3(0,.014,0)).toArray(),[.135,.028,.075],
      {bevel:.012});
    anchor.y+=.033;
  }else{
    const buried=anchor.clone();buried.y-=.09;anchor.y+=.16;
    timber.beam('wood','#8b7454',buried.toArray(),anchor.toArray(),.060,.073,{bevel:.009});
  }
  timber.beam('rope','#b29462',anchor.toArray(),apex,.024,.024,{bevel:.005});
  for(let i=0;i<4;i++)timber.box('rope','#94754d',[apex[0],apex[1]-.012+i*.02,apex[2]],
    [.14,.022,.125],{bevel:.009,seed:i});
  const rope=hokoraCarpentry();
  rope.beam('rope','#987e56',[0,0,0],[0,1,0],.021,.021,{bevel:.004});
  const group=new Group(),frame=new Mesh(timber.finish(),homesteadFinish()),lineGeometry=rope.finish();
  frame.castShadow=true;group.add(frame);
  const lines=Array.from({length:3},()=>new Mesh(lineGeometry,homesteadFinish()));
  group.add(...lines);group.name='材を受ける二又と揚げ綱';
  const up=new Vector3(0,1,0),axis=new Vector3(),delta=new Vector3(),a=new Vector3(),b=new Vector3(),knot=new Vector3();
  function line(mesh,from,to){
    axis.subVectors(to,from);mesh.position.copy(from);mesh.scale.y=axis.length();
    mesh.quaternion.setFromUnitVectors(up,axis.normalize());
  }
  function update(offset){
    delta.fromArray(offset);a.copy(ties[0]).add(delta);b.copy(ties[1]).add(delta);
    knot.copy(a).lerp(b,.5);knot.y=Math.max(a.y,b.y)+.22;
    line(lines[0],knot,hook);line(lines[1],a,knot);line(lines[2],b,knot);
  }
  return {group,geometries:[frame.geometry,lineGeometry],update};
}
