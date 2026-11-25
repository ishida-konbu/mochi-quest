import { Box3, Raycaster, Vector3 } from './vendor/three.module.min.js';
import { BUILDINGS,staticVolumeAt,terrainContactHeight } from './terrain.js';

const up=new Vector3(0,1,0), fov=39, tan=Math.tan(fov*Math.PI/360);
const point=a=>new Vector3().fromArray(a);
const clamp=x=>Math.max(0,Math.min(1,x)), smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const mix=(a,b,u)=>a+(b-a)*u;

// Use a common viewing side across neighbouring joints. Only the walk to a
// new station can move the eye. Once a hand touches the work the tripod is
// locked, from taking the weight all the way through fastening and release.
export function makeAssemblyCamera(group,parts,plan,size,setPieces,rig=[]) {
  const matrix=group.matrixWorld.clone(), inverse=matrix.clone().invert();
  const visibleMeshes=[];
  const origin=new Vector3().setFromMatrixPosition(matrix);
  const neighbours=BUILDINGS.filter(b=>Math.hypot(b.x-origin.x,b.z-origin.z)<18+Math.hypot(b.w,b.d));
  function eaveClearance(eye) {
    let clearance=Infinity;
    for(const b of neighbours) {
      if(eye.y>b.y+b.wall+b.roof+1 || eye.y<b.y-.8)continue;
      const dx=eye.x-b.x,dz=eye.z-b.z;
      const x=Math.abs(dx*b.cos-dz*b.sin)-b.w*.62,z=Math.abs(dx*b.sin+dz*b.cos)-b.d*.64;
      clearance=Math.min(clearance,Math.hypot(Math.max(0,x),Math.max(0,z)));
    }
    return clearance;
  }
  const whole=[], jobs=parts.map(()=>({points:[],supply:[],probes:[],walk:null,carry:null})), ray=new Raycaster();
  const sampleAt=(action,u)=>plan.sample(mix(action.start,action.end,u));
  function figure(bounds,f) {
    const foot=point(f.hero);
    for(const x of [-.86,.86])for(const z of [-.66,.66]){
      bounds.push(foot.clone().add(new Vector3(x*size,1.69*size,z*size)),
        foot.clone().add(new Vector3(x*size,.12,z*size)));
    }
    bounds.push(...f.feet.map(point),...f.hands.map(point));
  }
  function corners(mesh,cb) {
    const geo=mesh.geometry;
    if(!geo.boundingBox)geo.computeBoundingBox();
    const {min,max}=geo.boundingBox;
    for(const x of [min.x,max.x])for(const z of [min.z,max.z])
      for(const y of [Math.max(-.08,min.y),max.y])
        cb(new Vector3(x,y,z).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse));
  }
  for(const t of [0,plan.duration]){
    const f=plan.sample(t);
    setPieces(f);group.updateMatrixWorld(true);figure(whole,f);
    for(const p of parts)if(p.mesh.parent.visible)corners(p.mesh,v=>whole.push(v));
  }
  let returnWalk;
  const endpoints=new Map();
  for(const act of plan.actions){
    if(act.type==='walk' || act.type==='carry')endpoints.set(act,[sampleAt(act,0).hero,sampleAt(act,1-1e-5).hero]);
    if(act.type==='walk'){
      if(act.index>=jobs.length)returnWalk=act;
      else jobs[act.index].walk=act;
      for(const q of [.25,.5,.75])figure(whole,sampleAt(act,q));
      continue;
    }
    const f=sampleAt(act,act.type==='fasten'?.64:.70),job=jobs[f.index];
    if(act.type==='carry'){job.carry=act;continue;}
    if(act.type==='grasp'){
      job.pickHero=point(f.hero);figure(job.supply,f);
    }else{
      job.joinHero=point(f.hero);figure(job.points,f);
      if(act.type==='seat' || act.type==='fasten')job.probes.push(f);
      if(act.type==='fasten')job.probes.push(sampleAt(act,.40));
    }
  }
  for(let i=0;i<jobs.length;i++) {
    const job=jobs[i],g=point(parts[i].step.grip);
    // Long beams leave the edge of a portrait close shot. Keep the working
    // end, both palms and the supporting joint, then show the whole roof
    // again when the carpenter stands back.
    job.points.push(g.clone().add(new Vector3(-.48,-.12,-.48)),g.clone().add(new Vector3(.48,.28,.48)));
  }

  function sight(a,b,world) {
    const origin=a.clone().applyMatrix4(matrix),eye=b.clone().applyMatrix4(matrix);
    const dist=eye.distanceTo(origin);
    if(!world){
      // Start on the camera side: a screen can be thinner than a hand.
      // Leave only the final contact patch inside the member out of the ray.
      ray.set(eye,origin.sub(eye).normalize());ray.near=.04;ray.far=dist-.024;
      return !ray.intersectObjects(visibleMeshes,false).length;
    }
    const n=Math.ceil(dist/.24);
    for(let i=1;i<=n;i++){
      const u=i/n;
      const x=mix(origin.x,eye.x,u),z=mix(origin.z,eye.z,u),y=mix(origin.y,eye.y,u);
      if(y<terrainContactHeight(x,z)+.035 || staticVolumeAt(x,z,y-.022,.035,.05))return false;
    }
    return true;
  }
  const angles=Array.from({length:24},(_,i)=>(i+.3)*Math.PI/12-Math.PI);
  function fit(width,height,visibleHeight) {
    const aspect=width/height,open=clamp(visibleHeight/height);
    const fitPoints=(points,angle,rise)=>{
      const focus=new Box3().setFromPoints(points).getCenter(new Vector3());
      const dir=new Vector3(Math.sin(angle),rise,Math.cos(angle)).normalize();
      const right=up.clone().cross(dir).normalize(),vertical=dir.clone().cross(right);
      let distance=3.25;
      for(const p of points){
        const v=p.clone().sub(focus),d=v.dot(dir);
        distance=Math.max(distance,d+(Math.abs(v.dot(right))+.045)/(tan*aspect*.91),
          d+(Math.abs(v.dot(vertical))+.08)/(tan*open*.88));
      }
      const eye=focus.clone().addScaledVector(dir,distance);
      const globalEye=eye.clone().applyMatrix4(matrix);
      const ground=terrainContactHeight(globalEye.x,globalEye.z);
      // Keep the lens and its near field out of banks, the thickness of an
      // eave and porch posts that would otherwise fill a side of the frame.
      const crowded=globalEye.y<ground+.42 || staticVolumeAt(globalEye.x,globalEye.z,globalEye.y-.38,.58,.76);
      eye.y+=Math.max(0,ground+.32-globalEye.y);
      const roofAtEdge=Math.max(0,1.45-eaveClearance(globalEye));
      return {focus,eye,angle,rise,distance,dir,score:(crowded?-100:0)-48*roofAtEdge};
    };
    // Work rays towards the hands must also clear the mochi's rounded body.
    // Scale the viewing segment into an ellipsoid and test the nearest
    // point; a hand on the far side should not count as visible.
    function behindBody(hand,eye,f) {
      const height=size*(1+f.lift*.58-.045*f.effort);
      const dx=.12*size*Math.sin(f.heading),dz=.12*size*Math.cos(f.heading);
      const center=[f.hero[0]+dx,f.hero[1]+height*.88+f.lift*.40,f.hero[2]+dz];
      const local=p=>new Vector3((p.x-center[0])/(size*.82),
        (p.y-center[1])/(height*.80),(p.z-center[2])/(size*.82));
      const start=local(hand),axis=local(eye).sub(start);
      const u=clamp(-start.dot(axis)/axis.lengthSq());
      return start.addScaledVector(axis,u).lengthSq()<.96;
    }
    const sites=jobs.map(job=>angles.flatMap(a=>[.12,.34,.63,.96].map(r=>fitPoints(job.points,a,r))));
    for(let i=0;i<jobs.length;i++)for(const f of jobs[i].probes){
      setPieces(f); group.updateMatrixWorld(true);
      visibleMeshes.length=0;
      for(const {mesh} of parts)if(mesh.parent.visible)visibleMeshes.push(mesh);
      for(const root of rig)root.traverseVisible(o=>{if(o.isMesh)visibleMeshes.push(o);});
      // The rice model's mouth is low on the front curve. Probing above it
      // can incorrectly put the carpenter's eyes behind a purlin or curtain.
      const forward=new Vector3(Math.sin(f.heading),0,Math.cos(f.heading));
      const face=point(f.hero).addScaledVector(forward,.86*size).addScaledVector(up,(.83+f.lift*.4)*size);
      const h=f.hands.map(point),right=new Vector3(forward.z,0,-forward.x);
      const cheeks=[-1,1].map(side=>face.clone().addScaledVector(right,side*.28*size));
      // A palm rests against the surface. Its wrist is still visible when
      // that small contact point is recessed in a post or a panel rebate.
      const wrists=h.map((p,j)=>{
        const shoulder=point(f.hero).addScaledVector(up,.84*size).addScaledVector(forward,.37*size)
          .addScaledVector(right,(j?1:-1)*.62*size);
        return p.clone().lerp(shoulder,.16);
      });
      for(const c of sites[i]){
        const look=c.eye.clone().sub(face).setY(0).normalize();
        const forward=look.x*Math.sin(f.heading)+look.z*Math.cos(f.heading);
        // Looking towards the eyes and the near shoulder reads much better
        // than looking down the back of an almost spherical rice cake.
        c.score+=7-8*Math.abs(.60-forward)-14*Math.max(0,-forward)-1.8*c.rise;
        const contact=f.action==='fasten'?2:1;
        const clear=p=>sight(p,c.eye,false) && sight(p,c.eye,true);
        const hands=h.map((p,j)=>{
          const wrist=!behindBody(wrists[j],c.eye,f) && clear(wrists[j]);
          return (wrist?1:0)+(!behindBody(p,c.eye,f) && clear(p)?1:0);
        });
        c.score+=contact*(5*(hands[0]+hands[1])+4*Math.min(...hands)-(hands[0]+hands[1]===0?24:0));
        // On a terrace a narrow ray to the top of the mallet can clear the
        // crest while the panel, wrists and lower body vanish behind it.
        // A visible foothold gives the hillside work a readable silhouette.
        if(f.action==='fasten'){
          const footing=point(f.hero).addScaledVector(up,.23*size);
          c.score+=sight(footing,c.eye,true)?7:-9;
        }
        const eyes=cheeks.reduce((n,p)=>n+Number(clear(p)),0);
        c.score+=eyes===2?13:eyes===1?6:-10;
      }
    }
    // Charge a real cost for dragging the viewer round a site. A second view
    // is worthwhile when a newly hung curtain or a rear wall hides the joint.
    const parents=[];
    let values=sites[0].map(c=>c.score);
    for(let i=1;i<sites.length;i++){
      const prev=sites[i-1],map=[],walk=jobs[i].walk;
      const haste=Math.max(1,1.7/(walk.end-walk.start));
      values=sites[i].map(c=>{
        let high=-Infinity,id=0;
        for(let j=0;j<prev.length;j++){
          const arc=Math.abs(turn(prev[j].angle,c.angle));
          // Even a two-step walk must not whip the camera from one shoulder
          // to the other. The same bearing is always an available solution.
          if(!walk.cut && prev[j].dir.angleTo(c.dir)>.50*(walk.end-walk.start))continue;
          const transition=walk.cut ? .35 : haste;
          const score=values[j]-transition*(2.6*arc+2.3*Math.abs(prev[j].rise-c.rise)+(arc>.05?2.0:0));
          if(score>high){high=score;id=j;}
        }
        map.push(id);return high+c.score;
      });parents[i]=map;
    }
    const chosen=[];
    let ix=values.indexOf(Math.max(...values));
    for(let i=sites.length-1;i>=0;i--){chosen[i]=sites[i][ix];if(i)ix=parents[i][ix];}
    const intro=fitPoints(whole,chosen[0].angle,chosen[0].rise);
    const last=chosen.at(-1);
    const outro=returnWalk && returnWalk.end-returnWalk.start>1.2?fitPoints(whole,last.angle,last.rise):last;
    const supply=chosen.map((c,i)=>fitPoints(jobs[i].supply,c.angle,c.rise));
    return {chosen,supply,intro,outro,width,height,offset:(height-visibleHeight)/2};
  }
  const target=new Vector3(),eye=new Vector3(),right=new Vector3(),vertical=new Vector3(),v=new Vector3();
  function apply(camera,shot,frame) {
    const index=frame.index,job=jobs[index],home=frame.action==='finish';
    const pickup=frame.action==='walk' || frame.action==='grasp';
    const to=home?shot.outro:pickup?shot.supply[index]:shot.chosen[index];
    const walk=home?returnWalk:pickup?job.walk:job.carry;
    const from=home?shot.chosen.at(-1):pickup?(shot.chosen[index-1]??shot.intro):shot.supply[index];
    const progress=walk?(frame.time-walk.start)/(walk.end-walk.start):1;
    const u=walk?.cut ? Number(progress>=.5) : smooth(progress);
    target.lerpVectors(from.focus,to.focus,u);
    // If a load has to go round a wall, follow the actual footpath instead
    // of panning straight through the wall between endpoint compositions.
    if(u>0 && u<1 && walk) {
      const [lead,trail]=endpoints.get(walk);
      target.x+=frame.hero[0]-mix(lead[0],trail[0],u);
      target.z+=frame.hero[2]-mix(lead[2],trail[2],u);
    }
    const a=from.angle+turn(from.angle,to.angle)*u;
    const rise=mix(from.rise,to.rise,u);
    let distance=mix(from.distance,to.distance,u);
    eye.set(Math.sin(a),rise,Math.cos(a)).normalize();
    if(walk && u>0 && u<1){
      right.copy(up).cross(eye).normalize();vertical.copy(eye).cross(right);
      const open=1-2*shot.offset/shot.height,aspect=shot.width/shot.height;
      for(const p of [...frame.feet,...frame.hands,[frame.hero[0],frame.hero[1]+1.68*size,frame.hero[2]]]){
        v.fromArray(p).sub(target);const d=v.dot(eye);
        distance=Math.max(distance,d+(Math.abs(v.dot(right))+.06)/(tan*aspect*.92),
          d+(Math.abs(v.dot(vertical))+.08)/(tan*open*.91));
      }
    }
    eye.multiplyScalar(distance).add(target).applyMatrix4(matrix);
    eye.y=Math.max(eye.y,terrainContactHeight(eye.x,eye.z)+.32);
    target.applyMatrix4(matrix);
    camera.position.copy(eye);camera.lookAt(target);camera.fov=fov;
    camera.setViewOffset(shot.width,shot.height,0,shot.offset,shot.width,shot.height);camera.updateMatrixWorld();
  }
  return {fit,apply};
}
