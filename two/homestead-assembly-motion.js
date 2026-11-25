// The action takes place in the same +Z-front joinery frame as the finished
// building. Only terrain, already-built contacts and people use world space.
import { BUILD_MODULES } from './living-build-state.js';
import { makeAssemblyLoadField } from './homestead-assembly-clearance.js';
import { assemblyParts } from './homestead-assembly-parts.js';
import { planAssemblyStock } from './homestead-assembly-stock.js';
import { Box3,Euler,Quaternion,Triangle,Vector3 } from './vendor/three.module.min.js';
import { canOccupy, terrainContactHeight, waterSurfaceAt, wrapDelta } from './terrain.js';

const pi=Math.PI, clamp=v=>Math.max(0,Math.min(1,v)), ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t, blend=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const add=(p,n,d)=>[p[0]+n[0]*d,p[1]+n[1]*d];
const horizontal=([x,,z])=>[x,z];
const zero=[0,0,0], identity={offset:zero,rotation:zero};
function turn(v,a) {return [v[0]*Math.cos(a)+v[1]*Math.sin(a),v[1]*Math.cos(a)-v[0]*Math.sin(a)];}
function bodyPoint(center,yaw,x,y,z) {
  const [u,v]=turn([x,z],yaw);return [center[0]+u,center[1]+y,center[2]+v];
}
function around(v,r) {
  // Same XYZ Euler transform as the fieldwork material mesh.
  const x=v[0]*Math.cos(r[2])-v[1]*Math.sin(r[2]), y=v[1]*Math.cos(r[2])+v[0]*Math.sin(r[2]);
  const u=x*Math.cos(r[1])+v[2]*Math.sin(r[1]), w=v[2]*Math.cos(r[1])-x*Math.sin(r[1]);
  return [u,y*Math.cos(r[0])-w*Math.sin(r[0]),y*Math.sin(r[0])+w*Math.cos(r[0])];
}
const up=new Vector3(0,1,0),euler=new Euler(),partQ=new Quaternion(),yawQ=new Quaternion();
function carryRotation(r,face) {
  partQ.setFromEuler(euler.set(...r,'XYZ')).premultiply(yawQ.setFromAxisAngle(up,face));
  euler.setFromQuaternion(partQ,'XYZ');return [euler.x,euler.y,euler.z];
}
// Long timbers travel narrow end first. The shoulder is near the bearing
// end, so turning the far end upwards clears walls without raising the hands
// above the carpenter's reach. At the receiving joint it is lowered onto
// the opposite bearing before the near end is seated.
function transportAttitude(s) {
  if(s.id==='roof.ridge'||s.id==='roof.ridge-cap')return [0,0,-pi*.49];
  if(s.id.startsWith('roof.trestle-'))return [-pi*.48,0,0];
  // Each framed roof panel is carried on its eave edge; the upper shingle
  // edge stays above the carpenter before rolling down onto the ridge.
  if(s.id.startsWith('roof.back-'))return [-pi*.33,0,0];
  if(s.id.startsWith('roof.front-'))return [pi*.33,0,0];
  if(s.id==='posts.left-plate'||s.id==='posts.right-plate')return [pi*.49,0,0];
  if(s.id==='fence.left-stake'||s.id==='fence.right-stake')return zero;
  return null;
}
const pinsJoint=s=>s.method==='raise' || (s.method==='seat' && /sill|bent|plate|joist|trestle|deck-|ridge|front-|back-|lattice/.test(s.id));
const collisionMeshes=new WeakMap();
function hitsPiece(step,p,y,size) {
  const {min,max}=step.bounds, r=.43*size,lo=y+.30,hi=y+1.5*size;
  if(max[1]<lo||min[1]>hi||p[0]<min[0]-r||p[0]>max[0]+r||p[1]<min[2]-r||p[1]>max[2]+r)return false;
  if(!step.geometry)return true;
  let mesh=collisionMeshes.get(step.geometry);
  if(!mesh){
    mesh=new Map();collisionMeshes.set(step.geometry,mesh);
    const geo=step.geometry, pos=geo.getAttribute('position'),ix=geo.getIndex();
    const vertex=i=>new Vector3().fromBufferAttribute(pos,ix?ix.getX(i):i);
    for(let i=0;i<(ix?.count??pos.count);i+=3) {
      const t=new Triangle(vertex(i),vertex(i+1),vertex(i+2)),b=new Box3().setFromPoints([t.a,t.b,t.c]);
      for(let x=Math.floor(b.min.x*2);x<=Math.floor(b.max.x*2);x++)
        for(let z=Math.floor(b.min.z*2);z<=Math.floor(b.max.z*2);z++){
          const k=x+','+z;if(!mesh.has(k))mesh.set(k,[]);mesh.get(k).push(t);
        }
    }
  }
  const box=new Box3(new Vector3(p[0]-r,lo,p[1]-r),new Vector3(p[0]+r,hi,p[1]+r));
  for(let x=Math.floor(box.min.x*2);x<=Math.floor(box.max.x*2);x++)
    for(let z=Math.floor(box.min.z*2);z<=Math.floor(box.max.z*2);z++)
      if(mesh.get(x+','+z)?.some(t=>box.intersectsTriangle(t)))return true;
  return false;
}
function onPlatform(p,b) {
  const dx=p[0]-b.center[0],dz=p[1]-b.center[2],n=b.normal;
  const cross=dx*n[1]-dz*n[0],side=Math.abs(cross),out=dx*n[0]+dz*n[1];
  if(side>b.width/2 || out < -b.depth/2)return -Infinity;
  const tread=Math.max(0,Math.ceil((out-b.depth/2)/b.run));
  if(tread>0 && Math.abs(cross-(b.stairOffset||0))>(b.stairWidth??b.width)/2)return -Infinity;
  return tread<b.count ? b.center[1]+b.height*(1-tread/b.count) : -Infinity;
}
function heightField(site,size,canStand) {
  const {yaw}=site,terrain=new Map(), solids=new Map();
  const toWorld=p=>add(turn(p,yaw),[site.x,site.z],1);
  const land=p=>{
    const key=Math.round(p[0]*120)+','+Math.round(p[1]*120);
    if(!terrain.has(key)){
      const [x,z]=toWorld(p);let feet=terrainContactHeight(x,z);
      for(const f of site.structures||[]) {
        if(f.kind!=='floor')continue;
        const [u,v]=turn([x-f.x,z-f.z],-f.yaw);
        if(Math.abs(u)<=1.60 && Math.abs(v)<=1.40)feet=Math.max(feet,f.y+.18);
      }
      terrain.set(key,feet-site.y);
    }return terrain.get(key);
  };
  const free=(p,y)=>{
    const key=Math.round(p[0]*60)+','+Math.round(p[1]*60)+','+Math.round(y*50);
    if(!solids.has(key)){
      const [x,z]=toWorld(p),foot=site.y+y;
      solids.set(key,foot-waterSurfaceAt(x,z)>.15 &&
        canOccupy(x,z,foot+.025,.57*size,1.53*size) && canStand(x,z,foot+.025,.57*size,1.53*size));
    }return solids.get(key);
  };
  return {land,free,toWorld};
}
// A direct walk is usual. If a chest, neighbour or already-erected wall
// blocks it, use a local visibility graph, then remove every redundant bend.
function findPath(a,b,ground,free,portals) {
  const line=(p,q)=>{
    const count=Math.max(1,Math.ceil(distance(p,q)/.19));
    let prev=ground(p);
    for(let j=0;j<=count;j++){
      const xy=blend(p,q,j/count),h=ground(xy);
      if(Math.abs(h-prev)>.32 || !free(xy,h))return false;
      prev=h;
    }return true;
  };
  if(line(a,b))return [a,b];
  const nearby=portals.map(p=>({p,cost:distance(p,a)+distance(p,b)})).sort((p,q)=>p.cost-q.cost).slice(0,27);
  const nodes=[a,b,...nearby.map(v=>v.p).filter(p=>free(p,ground(p)))],links=new Map();
  const dist=nodes.map(()=>Infinity),from=[],seen=new Set();dist[0]=0;
  while(true){
    let i=-1,best=Infinity;
    for(let j=0;j<nodes.length;j++)if(!seen.has(j) && dist[j]<best){best=dist[j];i=j;}
    if(i<0)break;
    if(i===1)break;
    seen.add(i);
    for(let j=1;j<nodes.length;j++){
      if(seen.has(j)||j===i)continue;
      const d=distance(nodes[i],nodes[j]);
      if(dist[i]+d>=dist[j])continue;
      const key=Math.min(i,j)+':'+Math.max(i,j);
      if(!links.has(key))links.set(key,line(nodes[i],nodes[j]));
      if(links.get(key)){dist[j]=dist[i]+d;from[j]=i;}
    }
  }
  if(!Number.isFinite(dist[1])){
    // A partly framed hut may have only a narrow passage between a post and
    // a trestle. Search that local passage before giving up on the building.
    const grid=.30, radius=Math.max(6,Math.abs(a[0])+2,Math.abs(a[1])+2,Math.abs(b[0])+2,Math.abs(b[1])+2);
    const key=(x,z)=>x+','+z;
    const ix=Math.round(a[0]/grid),iz=Math.round(a[1]/grid);
    const origin={x:ix,z:iz,p:a,cost:0,score:distance(a,b),parent:null};
    const queue=[origin],best=new Map([[key(ix,iz),0]]);
    while(queue.length){
      let k=0;for(let j=1;j<queue.length;j++)if(queue[j].score<queue[k].score)k=j;
      const cur=queue[k];queue[k]=queue.at(-1);queue.pop();
      if(cur.cost>best.get(key(cur.x,cur.z)))continue;
      if(distance(cur.p,b)<.85 && line(cur.p,b)){
        const raw=[b];for(let node=cur;node;node=node.parent)raw.unshift(node.p);
        const path=[raw[0]];let next=1;
        while(next<raw.length){
          let j=raw.length-1;while(j>next && !line(path.at(-1),raw[j]))j--;
          path.push(raw[j]);next=j+1;
        }return path;
      }
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const x=cur.x+dx,z=cur.z+dz,p=[x*grid,z*grid];
        const cost=cur.cost+distance(cur.p,p),id=key(x,z);
        if(Math.max(Math.abs(p[0]),Math.abs(p[1]))>radius || (best.get(id)??Infinity)<=cost || !line(cur.p,p))continue;
        best.set(id,cost);queue.push({x,z,p,cost,score:cost+distance(p,b),parent:cur});
      }
    }return null;
  }
  const path=[];for(let i=1;i!==undefined;i=from[i])path.unshift(nodes[i]);
  return path;
}
function routeSampler(path,from,to,size,ground,carrying=false) {
  const d=[0];for(let i=1;i<path.length;i++)d.push(d[i-1]+distance(path[i-1],path[i]));
  const len=d.at(-1);
  const knots=[{d:0,yaw:from}];
  if(!carrying)for(let i=1;i<path.length;i++){
    const middle=(d[i]+d[i-1])/2;
    if(middle-knots.at(-1).d<.55 || len-middle<.55)continue;
    const direction=Math.atan2(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);
    knots.push({d:middle,yaw:angle(knots.at(-1).yaw,direction,1)});
  }
  knots.push({d:len,yaw:angle(knots.at(-1).yaw,to,1)});
  const at=q=>{
    q=clamp(q);const along=q*len;
    let i=1;while(i<path.length-1 && along>d[i])i++;
    const f=d[i]===d[i-1]?q:clamp((along-d[i-1])/(d[i]-d[i-1]));
    const p=blend(path[i-1],path[i],f);
    let j=1;while(j<knots.length-1 && along>knots[j].d)j++;
    const a=knots[j-1],b=knots[j];
    return {p,yaw:mix(a.yaw,b.yaw,ease(b.d>a.d?(along-a.d)/(b.d-a.d):q))};
  };
  // A loaded worker takes shorter steps up a stair. The travel time includes
  // the climb, so the feet do not scurry while the body floats between treads.
  let climb=0,prior=ground(path[0]);
  for(let i=1;i<path.length;i++){
    const count=Math.max(1,Math.ceil(distance(path[i-1],path[i])/.16));
    for(let j=1;j<=count;j++){const next=ground(blend(path[i-1],path[i],j/count));climb+=Math.abs(next-prior);prior=next;}
  }
  const strides=Math.max(1,Math.ceil(len/(.73*size)+climb/.27+.34*Math.abs(angle(from,to,1)-from)));
  function support(k,s){
    const target=add(k.p,turn([s*.29*size,.06*size],k.yaw),1),y=ground(k.p);
    for(const reach of [1,.83,.66,.49,.32,0]){
      const xy=blend(k.p,target,reach);
      if(Math.abs(ground(xy)-y)<.32)return xy;
    }
    return k.p;
  }
  const feetAt=Array.from({length:strides+1},(_,j)=>[-1,1].map(side=>support(at(j/strides),side)));
  const sample=q=>{
    const {p,yaw}=at(q);
    const step=Math.min(strides-1,Math.floor(q*strides));
    const feet=[-1,1].map((s,i)=>{
      const hop=clamp((q*strides-step)*2-i);
      const f0=feetAt[step][i],f1=feetAt[step+1][i],footXY=blend(f0,f1,ease(hop));
      const floor=mix(ground(f0),ground(f1),ease(hop));
      return [footXY[0],floor+.11*size*Math.sin(pi*hop),footXY[1]];
    });
    return {hero:[p[0],(feet[0][1]+feet[1][1])*.5,p[1]],feet,heading:yaw};
  };
  sample.climb=climb;return sample;
}
function makePlatforms(steps,ground,size,variant) {
  const platforms=[];
  for(const s of steps) {
    const n=s.normal,base=horizontal(s.grip),xy=add(base,n,1.08*size);
    const reach=s.grip[1]-ground(xy)-1.45*size;
    if(reach<=.20)continue;
    const top=s.grip[1]-1.26*size;
    // A single run of staging serves adjacent bays at the same working height.
    let p=platforms.find(b=>b.normal[0]===n[0] && b.normal[1]===n[1] &&
      Math.abs(b.top-top)<.38 && Math.abs((xy[0]-b.center[0])*n[0]+(xy[1]-b.center[2])*n[1])<.58);
    const t=[n[1],-n[0]],side=xy[0]*t[0]+xy[1]*t[1];
    if(!p){
      const out=xy[0]*n[0]+xy[1]*n[1];
      p={normal:n,center:[...base,0],depth:1.10,run:.34,top,out,lo:side,hi:side};platforms.push(p);
    }
    p.lo=Math.min(p.lo,side);p.hi=Math.max(p.hi,side);
    const middle=(p.lo+p.hi)/2;
    const center=add([n[0]*p.out,n[1]*p.out],t,middle);
    const floor=ground(center);
    p.center=[center[0],floor,center[1]];p.width=p.hi-p.lo+1.03*size;
    p.height=p.top-floor;p.count=Math.ceil(p.height/.205);
  }
  // Move the joiner's top towards a usable shoulder if the first run is
  // pinched against a permanent post, trunk or rock at this compass bearing.
  if(variant)for(const p of platforms){
    const dx=(variant===1?.40:-.40)*size;
    p.center[0]+=p.normal[1]*dx;p.center[2]-=p.normal[0]*dx;
    p.width+=.25*size;p.center[1]=ground(horizontal(p.center));p.height=p.top-p.center[1];
    p.count=Math.ceil(p.height/.205);
  }
  return platforms;
}
export function planAssembly(player,site,steps,canStand=()=>true){
  for(let variant=0;variant<3;variant++) {
    const plan=makeJob(player,site,steps,canStand,variant);
    if(plan)return plan;
  }
  return null;
}
function makeJob(player,site,steps,canStand,variant) {
  if(!player || !site || ![player.x,player.y,player.z,site.x,site.y,site.z,site.yaw].every(Number.isFinite) ||
     !steps?.length || player.grounded===false || player.mount || player.skiff || player.vessel || player.activity || player.inWater)return null;
  const size=player.buffs?.full>0?1.28:1,field=heightField(site,size,canStand);
  const start=turn([wrapDelta(player.x-site.x),wrapDelta(player.z-site.z)],-site.yaw);
  if(Math.hypot(...start)>13 || Math.abs(field.land(start)+site.y-player.y)>.34)return null;
  const facing=(player.heading||0)-site.yaw;
  const platforms=makePlatforms(steps,field.land,size,variant);
  const siteFloor=(p)=>Math.max(field.land(p),...platforms.map(b=>onPlatform(p,b)));
  const completedGround=index=>{
    const deck=steps.slice(0,index).filter(s=>s.id.startsWith('floor.deck-'));
    return p=>{
      let y=siteFloor(p);
      for(const {bounds:b} of deck)if(p[0]>=b.min[0] && p[0]<=b.max[0] && p[1]>=b.min[2] && p[1]<=b.max[2])y=Math.max(y,b.max[1]);
      return y;
    };
  };
  let ground=completedGround(0);
  // Scaffolds must leave a landing for the actual traveller. If the start is
  // on a future top, shift that trestle a tread length away from the traveller.
  for(const b of platforms){
    if(onPlatform(start,b)>field.land(start)+.09) {
      const cross=[b.normal[1],-b.normal[0]],d=(start[0]-b.center[0])*cross[0]+(start[1]-b.center[2])*cross[1];
      const out=(start[0]-b.center[0])*b.normal[0]+(start[1]-b.center[2])*b.normal[1];
      if(out>b.depth/2 && b.width>1.55){
        b.stairWidth=Math.min(1.14*size,b.width*.48);
        b.stairOffset=(d<0?1:-1)*(b.width-b.stairWidth)/2;
      }else if(out>b.depth/2){
        // The top is clear. Shorten the run when its lower tread would start
        // under the traveller; higher rises use the existing number of steps.
        b.run=Math.max(.18,Math.min(b.run,(out-b.depth/2-.06)/(b.count-1)));
      }else{
        const displace=(d<0?1:-1)*(b.width/2+.34-Math.abs(d));
        b.center[0]+=cross[0]*displace;b.center[2]+=cross[1]*displace;
      }
    }
  }
  const portals=[...[-4.05,-2.42,0,2.42,4.05].flatMap(x=>[-4.05,-2.42,2.42,4.05].map(z=>[x,z]))];
  for(const b of platforms){
    const n=b.normal,t=[n[1],-n[0]],center=horizontal(b.center);
    for(const side of [-1,0,1])for(const out of [0,b.depth*.5+(b.count-1)*b.run+.28]){
      portals.push(add(add(center,t,(b.stairOffset||0)+side*((b.stairWidth??b.width)/2-.23)),n,out));
    }
  }
  const staging=planAssemblyStock(steps,{kind:site.kind,variant,size,land:field.land,free:field.free,platforms,start});
  if(!staging)return null;
  for(const pile of staging){
    const {min,max}=pile.bounds;
    for(const x of [min[0]-.66*size,max[0]+.66*size])for(const z of [min[2]-.66*size,max[2]+.66*size])
      portals.push([x,z]);
  }
  const actions=[],operations=[];
  let current=start,heading=facing,clock=0;
  function walk(path,endYaw,index,carrying=false) {
    const len=path.reduce((sum,p,i)=>sum+(i?distance(p,path[i-1]):0),0);
    const turnAmount=Math.abs(angle(heading,endYaw,1)-heading);
    const pose=routeSampler(path,heading,endYaw,size,ground,carrying);
    const duration=Math.max(.34,len/(carrying?1.52:1.92)+pose.climb/1.12,Math.min(turnAmount,pi)*.42);
    actions.push({index,type:carrying?'carry':'walk',start:clock,end:clock+duration,pose});
    clock+=duration;current=path.at(-1);heading=endYaw;
  }
  function pause(index,type,duration) {
    const pose=routeSampler([current,current],heading,heading,size,ground);
    actions.push({index,type,start:clock,end:clock+duration,pose});clock+=duration;
  }
  function bodyClear(p,y) {return field.free(p,y);}
  function ways(a,b,clear) {return findPath(a,b,ground,clear,portals);}
  for(let index=0;index<steps.length;index++){
    ground=completedGround(index);
    const s=steps[index],g=s.grip,goal=horizontal(g);
    const fitted=steps.slice(0,index), pile=staging[index];
    const future=staging.slice(index+1);
    const stockFree=(p,y)=>!future.some(({bounds:b})=>b.max[1]>y+.12 &&
      Math.hypot(Math.max(b.min[0]-p[0],p[0]-b.max[0],0),Math.max(b.min[2]-p[1],p[1]-b.max[2],0))<.43*size);
    const pick=add(horizontal(pile.grip),pile.normal,1.12*size),py=ground(pick);
    const pickYaw=Math.atan2(-pile.normal[0],-pile.normal[1]);
    const avoidFittings=(p,y)=>{
      if(!bodyClear(p,y) || !stockFree(p,y))return false;
      // Only reserve the structure at body height. Floorboards and thin
      // entrance beams remain walkable underneath or across their surface.
      return !fitted.some(prev=>prev.bounds && hitsPiece(prev,p,y,size));
    };
    let op;
    const routeClear=(p,y)=>avoidFittings(p,y) && (pile.bounds.max[1]<y+.11 ||
      Math.hypot(Math.max(pile.bounds.min[0]-p[0],p[0]-pile.bounds.max[0],0),Math.max(pile.bounds.min[2]-p[1],p[1]-pile.bounds.max[2],0))>.40*size);
    const route=ways(current,pick,routeClear);
    if(!route)return null;
    // Choose a workable shoulder rather than sending the player through a
    // finished wall. Low pieces can be fitted from inside an unfinished bay.
    for(const a of [0,.47,-.47,.91,-.91,1.48,-1.48,pi]){
      const n=turn(s.normal,a),station=add(goal,n,1.12*size);
      const sy=ground(station),gap=g[1]-sy;
      if(gap<(s.id.startsWith('wall.')?-.26:-.015) || gap>1.94*size || !avoidFittings(station,sy) || (s.bounds && hitsPiece(s,station,sy,size)))continue;
      const fixedYaw=Math.atan2(-n[0],-n[1]);
      let carryPath;
      if(s.id==='stand.rafters'){
        // Keep the laid-over shade assembly outboard of the counter until
        // both feet are in front of the steps. The upright staves then travel
        // over their sockets from above, clear of the cash box and tray.
        const hand=pick[0]<0?-1:1,corner=[hand*Math.max(3.12,Math.abs(pick[0])),3.40*size];
        const landing=add(station,n,2.25*size);
        const wide=(p,y)=>avoidFittings(p,y) && (pick[1]>1.5 || Math.abs(p[0])>=Math.min(2.74,Math.abs(pick[0])) || p[1]>2.72);
        const outer=ways(pick,corner,wide),front=outer && ways(corner,landing,avoidFittings);
        const approach=front && ways(landing,station,avoidFittings);
        if(approach)carryPath=[...outer,...front.slice(1),...approach.slice(1)];
      }else if(s.id.startsWith('roof.') || /posts\.(left|right)-plate/.test(s.id)){
        // The traveller alone fits through an open bay, but not with a long
        // rafter above the shoulder. First clear the nearest outer face,
        // skirt the building, then ascend the stair on the receiving face.
        if(a!==0)continue;
        const margin=3.62*size,tangent=[n[1],-n[0]];
        const leave=Math.abs(pick[0])/1.85>Math.abs(pick[1])/1.65?[Math.sign(pick[0]),0]:[0,Math.sign(pick[1])];
        const dot=(p,v)=>p[0]*v[0]+p[1]*v[1];
        const entry=add(pick,leave,Math.max(0,margin+.42-dot(pick,leave)));
        const gate=add(station,n,Math.max(.7,margin+.42-dot(station,n)));
        const escape=(p,y)=>avoidFittings(p,y) && dot(p,leave)>=dot(pick,leave)-.18;
        const outboard=(p,y)=>avoidFittings(p,y) && Math.max(Math.abs(p[0]),Math.abs(p[1]))>=margin;
        const approach=(p,y)=>avoidFittings(p,y) && dot(p,n)>=dot(station,n)-.20 &&
          Math.abs(dot(p,tangent)-dot(station,tangent))<2.55*size;
        const lead=ways(pick,entry,escape),around=lead && ways(entry,gate,outboard);
        const inward=around && ways(gate,station,approach);
        if(inward)carryPath=[...lead,...around.slice(1),...inward.slice(1)];
      }else if(s.id.startsWith('wall.')){
        // A full-width panel only clears the two pillar rebates when both
        // ends are squared to the opening. Take it around the rear outside
        // corner, square the panel, then slide it straight into its rebates.
        if(a!==0)continue;
        const apron=add(station,n,1.53*size),side=pick[0]<0?-1:1;
        const corner=[side*Math.max(Math.abs(pick[0]),3.72*size),apron[1]];
        const outside=(p,y)=>avoidFittings(p,y) && (pick[1]<=-2.25 || Math.abs(p[0])>=Math.min(3.25*size,Math.abs(pick[0])) || p[1]<=-2.9);
        const lead=ways(pick,corner,outside),square=lead && ways(corner,apron,avoidFittings);
        const final=square && ways(apron,station,avoidFittings);
        if(final)carryPath=[...lead,...square.slice(1),...final.slice(1)];
      }else carryPath=ways(pick,station,avoidFittings);
      if(!carryPath)continue;
      op={n,g,station,pick,sy,py,stock:pile.grip,rotation:pile.rotation,transport:transportAttitude(s),fixedYaw,pickYaw,route,carryPath,step:s};break;
    }
    if(!op)return null;
    op.pickY=routeSampler([op.pick,op.pick],op.pickYaw,op.pickYaw,size,ground)(0).hero[1];
    op.standY=routeSampler([op.station,op.station],op.fixedYaw,op.fixedYaw,size,ground)(0).hero[1];
    operations.push(op);
    walk(op.route,op.pickYaw,index);pause(index,'grasp',op.transport?1.05:.64);
    walk(op.carryPath,op.fixedYaw,index,true);pause(index,'seat',op.transport?1.72:s.method==='spread'?.99:.71);
    pause(index,'fasten',pinsJoint(s)?1.94:s.method==='lash'?1.16:.68);pause(index,'release',.36);
  }
  // End on the nearest clear piece of earth with a view back to the finished
  // work. Cancellation never sends the authoritative traveller to this mark.
  ground=completedGround(steps.length);
  const returnClear=(p,y)=>{
    if(!bodyClear(p,y))return false;
    return !steps.some(step=>step.bounds && hitsPiece(step,p,y,size));
  };
  const {width,depth}=BUILD_MODULES[site.kind];
  const endCandidates=[];
  for(const radius of [.35,.82,1.35,2,2.8])for(let j=0;j<20;j++){
    const a=j*pi/10,p=add(current,[Math.sin(a),Math.cos(a)],radius);
    if(Math.abs(p[0])<width/2+.58*size && Math.abs(p[1])<depth/2+.58*size)continue;
    if(platforms.some(b=>onPlatform(p,b)>field.land(p)+.025))continue;
    if(!returnClear(p,ground(p)))continue;
    endCandidates.push(p);
  }
  let home;
  for(const p of [...endCandidates,start]){
    const route=ways(current,p,returnClear);
    if(route && route.slice(1).reduce((d,p,i)=>d+distance(p,route[i]),0)<(home?.length??Infinity)){
      home={path:route,length:route.slice(1).reduce((d,p,i)=>d+distance(p,route[i]),0)};
      if(home.length<1.40)break;
    }
  }
  if(!home)return null;
  const finish=home.path.at(-1),endYaw=Math.atan2(-finish[0],-finish[1]);
  walk(home.path,endYaw,steps.length);const duration=clock;
  const [endX,endZ]=field.toWorld(finish);
  const endPose={x:endX,y:site.y+field.land(finish),z:endZ,heading:site.yaw+endYaw};
  function sample(t) {
    const time=Math.max(0,Math.min(duration,t));
    const act=actions.find(a=>time<a.end) || actions.at(-1);
    const q=clamp((time-act.start)/(act.end-act.start)),e=ease(q);
    const ramp=Math.min(.23,.30/(act.end-act.start));
    const pace=q<ramp?q*q/(2*ramp):q>1-ramp?1-ramp-(1-q)**2/(2*ramp):q-ramp/2;
    const f=act.pose(act.type==='walk' || act.type==='carry' ? clamp(pace/(1-ramp)):0);
    const index=Math.min(act.index,steps.length-1),op=operations[index],s=op.step,g=op.g,n=op.n;
    const finished=act.index===steps.length,action=finished?'finish':act.type;
    const [hx,hy,hz]=f.hero;
    const loose=[-1,1].map(side=>bodyPoint(f.hero,f.heading,side*.78*size,.75*size,.54*size));
    const held=bodyPoint(f.hero,f.heading,0,.83*size,1.12*size);
    const hanging=s.method==='hang',panel=s.id.startsWith('wall.'),nose=hanging?.48:panel?.40:0;
    const lateralFit=hanging||panel;
    const liftAtJoint=lateralFit ? g[1]+(hanging?-.07:0) : Math.max(op.standY+.83*size,g[1]+(s.id==='stand.rafters'?.43:.21));
    const picked=[op.stock[0],op.pickY+.83*size,op.stock[2]],near=[g[0]+n[0]*nose,liftAtJoint,g[2]+n[1]*nose];
    const envelope=op.clearance;
    const clearance=v=>{
      if(!envelope)return 0;
      const at=clamp(v)*(envelope.length-1),i=Math.min(envelope.length-2,Math.floor(at));
      return mix(envelope[i],envelope[i+1],at-i);
    };
    const extra=s.method==='spread'?.045:s.method==='raise'?.085:.068;
    let grip=op.stock,rot=op.rotation,engage=0,work=0;
    if(action==='grasp'){
      engage=ease(q/.58);const k=ease((q-.54)/.46);
      grip=blend(op.stock,picked,k);grip[1]+=clearance(0)*k;rot=op.transport?blend(op.rotation,op.transport,k):op.rotation.map(v=>v*(1-.16*k));
    }else if(action==='carry'){
      engage=1;
      const align=ease((q-.34)/.55),lift=ease((q-.43)/.42);
      grip=held;grip[0]+=n[0]*nose*lift;grip[2]+=n[1]*nose*lift;
      grip[1]+=(liftAtJoint-op.standY-.83*size)*lift+clearance(q);
      rot=op.transport || carryRotation(op.rotation.map(v=>v*.84*(1-align)),(angle(op.pickYaw,f.heading,1)-op.pickYaw)*(1-align));
    }else if(action==='seat'){
      engage=1;work=e;grip=blend(near,g,e);grip[1]+=extra*Math.sin(pi*e)+(1-e)*clearance(1);
      if(op.transport){
        const lower=ease(q/.78),seat=ease((q-.65)/.35);
        grip=blend(near,g,seat);
        grip[1]+=(1-seat)*clearance(1);
        rot=op.transport.map(v=>v*(1-lower));
      }else rot=zero;
    }else if(action==='fasten' || action==='release' || finished){
      work=1;grip=g;rot=zero;engage=finished?0:action==='release'?1-e:1;
    }
    const tangent=[-n[1],n[0]];
    const hands=[-1,1].map((side,i)=>{
      const w=.14*size;
      const localHold=s.handholds?.[i] || [g[0]+side*w*tangent[0],g[1]+.009,g[2]+side*w*tangent[1]];
      const delta=around(localHold.map((v,j)=>v-g[j]),rot);
      let x=grip[0]+delta[0],y=grip[1]+delta[1],z=grip[2]+delta[2];
      if(action==='fasten' && ['lash','hang','spread'].includes(s.method)){
        const arc=Math.sin(pi*q), tightening=arc*(s.method==='lash'?.115:.06);
        x+=side*tangent[0]*tightening;z+=side*tangent[1]*tightening;y+=arc*(i?.043:-.029);
      }
      return blend(loose[i],[x,y,z],engage);
    });
    const belt=bodyPoint(f.hero,f.heading,-.82*size,.69*size,.23*size),toolYaw=op.fixedYaw+pi;
    const mallet={position:belt,rotation:[1.20,f.heading,0]};
    const pin=pinsJoint(s);
    if(action==='release' && pin)hands[0]=loose[0];
    let cue=null;
    if(action==='fasten'){
      if(pin){
        // Take the tool by its handle, then drive the joint with one blow
        // while the other palm keeps the member registered. Rehang it before
        // either hand goes looking for the next part.
        const grasp=ease(q/.16),eng=ease((q-.14)/.24)*(1-ease((q-.70)/.19));
        const swing=ease((q-.30)/.20)*(1-ease((q-.50)/.13));
        const target=[g[0],g[1]+.066+.24*swing,g[2]];
        mallet.position=blend(belt,target,eng);mallet.rotation=[mix(1.2,-.42*swing,eng),angle(f.heading,toolYaw,eng),0];
        const [pitch,yaw]=mallet.rotation;
        const pad=bodyPoint(mallet.position,yaw,0,-.235*Math.sin(pitch),.235*Math.cos(pitch));
        hands[0]=blend(blend(hands[0],pad,grasp),loose[0],ease((q-.88)/.12));
        if(q>=.63 && q<.76)cue='knock';
      }else if(q>=.46 && q<.69)cue=s.method==='lash'?'lash':s.method==='spread'?'spread':'seat';
    }
    const crouch=clamp((.72*size-(grip[1]-hy))/(.72*size))*engage;
    return {...f,hands,focus:engage>0?grip:bodyPoint(f.hero,f.heading,0,1.0*size,1.2),
      lean:engage*(.09+.19*crouch),lift:-.35*crouch,effort:engage*(.26+.17*crouch),
      action,phase:finished?'finish':'build',time,index,installedCount:finished?steps.length:index,
      method:s.method,label:finished?'道具を収めて足場を離れる':s.label,work,cue,mallet,
      offset:finished?identity.offset:grip.map((v,i)=>v-g[i]),rotation:rot};
  }
  // Sample the carried surface against the stacked kit and earlier joinery
  // before playback. Start lifting ahead of an obstruction and ease the load
  // down past it, instead of snapping a board upward at a single frame.
  const prior=(site.structures||[]).filter(s=>Math.hypot(s.x-site.x,s.z-site.z)<.015 &&
    Math.abs(s.y-site.y)<.035 && Math.cos(s.yaw-site.yaw)>.999).flatMap(s=>assemblyParts(s.kind,s.terrain));
  const required=makeAssemblyLoadField([...prior,...steps],[...prior.map(s=>({grip:s.grip,rotation:zero})),...staging],field.land);
  for(const act of actions.filter(a=>a.type==='carry')){
    const op=operations[act.index],n=Math.max(5,Math.ceil((act.end-act.start)/.18)),extra=[],cap=[];
    for(let i=0;i<=n;i++){
      const t=mix(act.start,act.end,i/n),f=sample(t),grip=op.g.map((v,j)=>v+f.offset[j]);
      cap.push(Math.max(0,f.hero[1]+1.79*size-grip[1]));
      extra.push(Math.min(cap[i],Math.max(0,required(prior.length+act.index,grip,f.rotation)-grip[1])));
    }
    const dt=(act.end-act.start)/n;
    for(let i=n-1;i>=0;i--)extra[i]=Math.min(cap[i],Math.max(extra[i],extra[i+1]-.80*dt));
    for(let i=1;i<=n;i++)extra[i]=Math.min(cap[i],Math.max(extra[i],extra[i-1]-.87*dt));
    op.clearance=extra;
  }
  return {duration,sample,platforms,staging,actions,endPose};
}
