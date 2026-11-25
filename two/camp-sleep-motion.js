import {groundHeight,canOccupy,overheadHeight,wrapDelta} from './terrain.js';

const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const phase=(t,a,b)=>smooth((t-a)/(b-a));
export const SLEEP_DURATION=12.4;

export function bedPoint(bed,x,z){
  const c=Math.cos(bed.yaw),s=Math.sin(bed.yaw);
  return {x:bed.x+x*c+z*s,z:bed.z+z*c-x*s};
}
function local(bed,x,z){
  const c=Math.cos(bed.yaw),s=Math.sin(bed.yaw),dx=wrapDelta(x-bed.x),dz=wrapDelta(z-bed.z);
  return [dx*c-dz*s,dx*s+dz*c];
}
// The real household contacts include posts, pillows, terrain and treads.
// A nearby visitor on the opposite side of a post goes round it. The
// original traveller stays in place until control returns after rising.
export function sleepSeat(indoors,full){
  // The broad belly enters between the doorpost and storage chest before
  // turning onto its back. Leave the open centre of the cot for the roll.
  return indoors && full?{x:-.413,z:-.146}:{x:0,z:.30};
}
export function sleepApproach(bed,player,clear=()=>true){
  const [sx,sz]=local(bed,player.x,player.z),start={x:sx,z:sz,y:player.y-bed.y};
  const size=player.buffs?.full>0?1.28:1;
  const lowLintel=!!bed.parentId && size>1,radius=.26*size;
  const walkHeight=(lowLintel?1.405:1.55)*size;
  const step=.23,visited=new Set(['0,0']),queue=[{i:0,j:0,p:start,last:null}];
  const reach=(x,z,from)=>{
    const at=bedPoint(bed,x,z),y=groundHeight(at.x,at.z,bed.y+from);
    if(Math.abs(y-bed.y-from)>.34 || !canOccupy(at.x,at.z,y,radius,walkHeight) || !clear(at.x,at.z,y,radius,walkHeight))return null;
    return {x,z,y:y-bed.y};
  };
  const goal=sleepSeat(!!bed.parentId,size>1);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  for(let k=0;k<queue.length;k++){
    const node=queue[k],p=node.p;
    if(Math.hypot(p.x-goal.x,p.z-goal.z)<.26){
      const end=reach(goal.x,goal.z,p.y);
      if(end && Math.abs(end.y-.13)<.11){
        const points=[end];for(let n=node;n;n=n.last)points.push(n.p);
        points.reverse();
        if(lowLintel){
          // Feel the lintel a shoulder-width before crossing it. Keep the
          // squeeze on until the back of the traveller is inside as well.
          const duck=points.map(p=>{
            const at=bedPoint(bed,p.x,p.z),feet=bed.y+p.y;
            const room=overheadHeight(at.x,at.z,feet,radius)-feet;
            return room>=1?clamp((1.74*size-room)/(.31*size)):0;
          });
          for(const [i,p] of points.entries()){
            p.duck=points.reduce((amount,q,j)=>{
              const reach=1-smooth((Math.hypot(p.x-q.x,p.z-q.z)-.27)/.61);
              return Math.max(amount,duck[j]*reach);
            },0);
          }
        }
        return points;
      }
    }
    for(const [i,j] of dirs){
      const ni=node.i+i,nj=node.j+j,key=ni+','+nj;
      if(visited.has(key))continue;
      const x=sx+ni*step,z=sz+nj*step;
      if(Math.abs(x)>3.8 || Math.abs(z)>3.8)continue;
      const middle=reach((p.x+x)/2,(p.z+z)/2,p.y),q=middle && reach(x,z,middle.y);
      if(!q)continue;
      visited.add(key);queue.push({i:ni,j:nj,p:q,last:node});
    }
  }
  return null;
}
export function sleepMotion(path,startHeading,bedYaw){
  let length=0;const travelled=[0];
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];length+=Math.hypot(b.x-a.x,b.z-a.z);travelled.push(length);}
  const turn=(from,to)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
  const playerAngle=startHeading-bedYaw,headings=[];
  let facing=playerAngle;
  for(let i=1;i<path.length;i++){
    const dx=path[i].x-path[i-1].x,dz=path[i].z-path[i-1].z;
    if(Math.hypot(dx,dz)>.001)facing+=turn(facing,Math.atan2(dx,dz));
    headings.push(facing);
  }
  const arrival=headings.at(-1),rest=arrival+turn(arrival,0);
  const departure=length>.001?rest+turn(rest,arrival+Math.PI):rest;
  const lastStep=headings[0]+departure-arrival,endFacing=lastStep+turn(lastStep,playerAngle);
  const walkTime=Math.max(.40,length/1.32+.17),ramp=Math.min(.17/walkTime,.25);
  const total=2*walkTime+SLEEP_DURATION;
  return {duration:total,sample(t){
    const localTime=t-walkTime,returning=localTime>SLEEP_DURATION;
    const q=clamp((returning?total-t:t)/walkTime);
    const acceleration=q<ramp ? q*q/(2*ramp) : q>1-ramp ? 1-ramp-(1-q)**2/(2*ramp) : q-.5*ramp;
    const distance=length*acceleration/(1-ramp);
    let k=1;while(k+1<path.length && travelled[k]<distance)k++;
    const a=path[k-1],b=path[k],u=clamp((distance-travelled[k-1])/Math.max(.001,travelled[k]-travelled[k-1]));
    // At a path corner the soles still follow the tested collision route.
    // The body turns across a short distance on either side of that corner.
    const i=k-1,angle=headings[i],width=Math.min(.16,(travelled[k]-travelled[i])*.48);
    const inAngle=i ? (headings[i-1]+angle)*.5 : angle;
    const outAngle=i+1<headings.length ? (headings[i+1]+angle)*.5 : angle;
    const nearStart=distance-travelled[i],nearEnd=travelled[k]-distance;
    let heading=angle;
    if(width>.001 && nearStart<width)heading=inAngle+(angle-inAngle)*smooth(nearStart/width);
    else if(width>.001 && nearEnd<width)heading=outAngle+(angle-outAngle)*smooth(nearEnd/width);
    const movingTime=returning?total-t:t;
    const startFade=phase(movingTime,0,Math.min(.40,walkTime));
    if(returning){
      heading+=departure-arrival;
      heading+=(endFacing-heading)*(1-startFade);
    }else{
      heading=playerAngle+(heading-playerAngle)*startFade;
      heading+=(rest-heading)*phase(localTime,-.20,.72);
      // While still on the mattress, turn to face the first step back to
      // the player. The return walk begins at exactly this heading.
      heading+=(departure-rest)*phase(localTime,11.48,SLEEP_DURATION);
    }
    const recline=phase(localTime,1.45,3.39)*(1-phase(localTime,9.45,11.48));
    const cover=phase(localTime,1.80,3.91)*(1-phase(localTime,8.22,10.07));
    const yawn=phase(localTime,.04,.49)*(1-phase(localTime,.68,1.19));
    const stretch=phase(localTime,.10,.65)*(1-phase(localTime,.79,1.32));
    const doze=phase(localTime,3.76,4.76)*(1-phase(localTime,7.65,8.52));
    const clock=phase(localTime,4.34,7.63);
    const afterContact=Math.max(0,localTime-3.17);
    const settle=Math.sin(afterContact*10)*Math.exp(-3.9*afterContact);
    const speed=Math.min(1,q/ramp,(1-q)/ramp)*length/(walkTime*(1-ramp));
    // Both hems are in the mitts before the roll onto the pillow. Pick them
    // up again on waking; release only once the folded textile is supported.
    const grip=phase(localTime,.83,1.58)*(1-phase(localTime,4.08,4.65))+
      phase(localTime,7.75,8.21)*(1-phase(localTime,10.09,10.62));
    const sit=phase(localTime,.71,1.55)*(1-phase(localTime,2.21,3.10))+
      phase(localTime,9.45,10.35)*(1-phase(localTime,10.67,11.42));
    const duck=((a.duck??0)+((b.duck??0)-(a.duck??0))*smooth(u))*
      (localTime<SLEEP_DURATION/2?1-phase(localTime,0,.7):phase(localTime,SLEEP_DURATION-.7,SLEEP_DURATION));
    return {time:t,duck,position:[a.x+u*(b.x-a.x),a.y+u*(b.y-a.y),a.z+u*(b.z-a.z)],heading,recline,stretch,yawn,cover,doze,clock,grip,sit,settle,
      speed,label:localTime<0?'寝床に上がる':localTime<1.18?'伸びをして、ひとあくび':localTime<4.28?'掛け物を引き寄せる':localTime<7.75?'すやすや眠っている':localTime<10.3?'目を覚まして掛け物を戻す':returning?'寝床を下りる':'寝床から起き上がる'};
  }};
}
