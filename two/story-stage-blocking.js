// Stage coordinates are metres. Reserve each traveller's space while another
// moves to the prop, including the broad cheeks and the land guests' basins.
import { MathUtils, Vector3 } from './vendor/three.module.min.js';
import { shortRoute, workshopDetour } from './mochiyori-blocking.js';

const widths = {'象':.69,'牛':.56,'亀':.55,'海亀':.49,'蛸':.51,'鯛':.43,'猪':.44,'鹿':.36,'丹頂':.28,'老婆餅':.45,'僧侶餅':.45};
const deltaYaw=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function girth(person){return person.name==='配達人のお餅'?.79:widths[person.species] || .32;}
function benchClearance(person){return person.species==='猪'?1.12:girth(person);}
function planarRect(point,table){
  const dx=point.x-table.x,dz=point.z-table.z;
  const co=Math.cos(table.yaw),si=Math.sin(table.yaw);
  const x=Math.abs(dx*co-dz*si)-table.width/2,z=Math.abs(dx*si+dz*co)-table.depth/2;
  return Math.hypot(Math.max(0,x),Math.max(0,z))+Math.min(0,Math.max(x,z));
}

// Collect an article at the edge where it actually lies, before turning
// toward its recipient. A fixed basin or stool can turn on the same mark.
export function stagePickup(person,center,contact,tables,people,previous,guardMuzzle=false){
  const index=people.indexOf(person),start=previous?.[index]?.point,r=girth(person);
  const foot=person.group.position,initial=foot.clone(),yaw=person.group.rotation.y;
  const hand=person.hand('right'),pad=person.group.worldToLocal(hand.getWorldPosition(new Vector3()));
  const clear=(x,z)=>{
    if(tables.some(table=>planarRect({x,z},table)<Math.min(benchClearance(person)+.025,start?planarRect(start,table)-.001:Infinity)))return NaN;
    if(previous && people.some((other,i)=>other!==person && dist({x,z},previous[i].point)<
      Math.min(r+girth(other)+.045,dist(start,previous[i].point)-.001)))return NaN;
    return initial.y;
  };
  const around=start?workshopDetour(start,clear):null;
  let best;
  function poseAt(angle,bend,height){
    person.group.rotation.set(bend,angle,0,'YXZ');person.group.scale.y=person.group.scale.x*height;
    let palm=hand.getWorldPosition(new Vector3());
    for(let i=0;i<3;i++){person.grasp(contact.nearest(palm),null,false);palm=hand.getWorldPosition(new Vector3());}
    const patch=contact.nearest(palm),gap=palm.distanceTo(patch);
    const cost=gap*30+(start?dist(foot,start):dist(foot,initial))*.05+Math.abs(deltaYaw(yaw,angle))*.009+Math.abs(bend)*.10;
    if(guardMuzzle && (person.headroom?.depth() || 0)>.001)return Infinity;
    if((!best || cost<best.cost) && ((!bend && person.species!=='猪') || (person.headroom?.depth()||0)<.018))
      best={goal:foot.clone(),angle,cost,gap,patch,bend,height};
    return gap;
  }
  function check(x,z,detour=false){
    const to={x,z,y:initial.y};
    if(!Number.isFinite(clear(x,z)) || start && !shortRoute(start,to,clear,7) && !(detour && around(to)))return;
    foot.set(x,initial.y,z);
    const facing=Math.atan2(center.x-x,center.z-z)-Math.atan2(pad.x,pad.z);
    for(const turn of [0,-.32,.32,-.68,.68,-1.10,1.10,1.55,-1.55]){
      const angle=facing+turn;person.group.rotation.y=angle;
      for(const [bend,height] of [[0,1],[.24,.97],[.42,.90],[-.18,1],[-.36,1],[-.53,1],[.55,.81]]){
        const gap=poseAt(angle,bend,height);
        if(gap<.009)break;
      }
      person.group.scale.y=person.group.scale.x;person.group.rotation.x=0;
    }
  }
  if(start)check(start.x,start.z);
  if(!start || !person.onStand){
    check(initial.x,initial.z);
    for(const table of tables){
      const sin=Math.sin(table.yaw),cos=Math.cos(table.yaw),dx=center.x-table.x,dz=center.z-table.z;
      const u=MathUtils.clamp(dx*cos-dz*sin,-table.width/2,table.width/2);
      const v=MathUtils.clamp(dx*sin+dz*cos,-table.depth/2,table.depth/2);
      for(const across of [0,.32,-.32,.63,-.63])for(const side of [-1,1]){
        for(const [x,z] of [[u+across,side*(table.depth/2+r+.05)],[side*(table.width/2+r+.05),v+across]]){
          check(table.x+x*cos+z*sin,table.z-x*sin+z*cos);
        }
        if(best?.gap<.006)break;
      }
    }
    if(!best || best.gap>.025)for(const reach of [.80,1.08,1.39,.62,1.64])for(let j=0;j<24;j++){
      const angle=j*Math.PI/12;
      check(center.x+Math.sin(angle)*reach,center.z+Math.cos(angle)*reach,true);
      if(best?.gap<.010)break;
    }
    for(const stride of [.16,.08,.038,.018]){
      if(!best || best.gap<.014)break;
      const origin=best.goal;
      for(let j=0;j<12;j++){
        const angle=j*Math.PI/6;
        check(origin.x+Math.sin(angle)*stride,origin.z+Math.cos(angle)*stride,true);
      }
    }
  }
  if(best)for(const step of [.17,.08,.038,.018]){
    if(best.gap<.012)break;
    const base=best;foot.copy(base.goal);
    for(const angle of [-step,0,step])for(const bend of [-step,0,step])for(const compression of [-.05,0,.05]){
      poseAt(base.angle+angle,MathUtils.clamp(base.bend+bend,-.58,.62),MathUtils.clamp(base.height+compression,.74,1));
    }
  }
  person.grasp(null,null,false);foot.copy(best?.goal || initial);
  person.group.rotation.set(0,best?.angle ?? yaw,0,'YXZ');person.group.scale.y=person.group.scale.x;
  return best;
}

// The stage dresser supplies a preferred mark for the hands. A bystander
// keeps their mark between beats. A worker can use either end of the bench
// and goes around those already present. Routes run one at a time so that
// a free destination cannot lead to two bodies crossing en route.
export function stageWalks(people, active, receiver, previous, tables, handoff){
  const occupied=new Map(),moves=new Map();
  if(previous)for(const [i,a] of people.entries())occupied.set(a,previous[i].point);
  const order=[...new Set([active,receiver,...people].filter(Boolean))];
  let elapsed=0;
  for(const person of order){
    const saved=previous?.[people.indexOf(person)],from=saved?.point;
    const planted=!!from && (person!==active && person!==receiver || person.onStand);
    const wanted=planted?from:person.group.position.clone(),radius=girth(person);
    const partner=person===active?receiver:person===receiver?active:null;
    if(handoff && !handoff.tryingMarks && partner && !planted && (moves.has(partner) || partner.onStand && previous)){
      const there=occupied.get(partner),dx=wanted.x-there.x,dz=wanted.z-there.z,d=Math.hypot(dx,dz);
      if(d>.001){
        const spacing=radius+girth(partner)+.10;
        wanted.x=there.x+dx*spacing/d;wanted.z=there.z+dz*spacing/d;
      }
    }
    const facing=person.group.rotation.y;
    const clear=(x,z)=>{
      const p={x,z};
      if(tables.some(table=>planarRect(p,table)<Math.min(benchClearance(person)+.025,from?planarRect(from,table)-.001:Infinity)))return NaN;
      for(const [other,at] of occupied){
        if(other!==person && dist(p,at)<Math.min(radius+girth(other)+.045,from?dist(from,at)-.001:Infinity))return NaN;
      }
      return wanted.y;
    };
    let best=null;
    const detour=from?workshopDetour(from,clear):null;
    const check=(x,z)=>{
      if(!Number.isFinite(clear(x,z)))return;
      const goal=new Vector3(x,wanted.y,z);
      if(best && dist(goal,wanted)*2.5>=best.cost)return;
      const path=from?shortRoute(from,goal,clear,6.4) || detour(goal):[goal];
      if(!path)return;
      const points=from?[from,...path.map(p=>new Vector3(p.x,wanted.y,p.z))]:[goal,goal];
      const lengths=points.slice(1).map((p,i)=>dist(points[i],p));
      const length=lengths.reduce((sum,v)=>sum+v,0),cost=dist(goal,wanted)*2.5+length;
      if(!best || cost<best.cost)best={goal,points,lengths,length,cost};
    };
    if(planted)best={goal:from,points:[from,from],lengths:[0],length:0,cost:0};
    else check(wanted.x,wanted.z);
    if(!best || dist(best.goal,wanted)>.02){
      for(let d=.12;d<=4;d+=.12){
        if(best && d*2.5>best.cost)break;
        for(let n=0;n<16;n++){
          const angle=n*Math.PI/8;
          check(wanted.x+d*Math.sin(angle),wanted.z-d*Math.cos(angle));
        }
      }
    }
    // All previous marks were surveyed on the same stage. If the approach
    // is now occupied, the performer can still address it from that mark.
    if(!best){
      const mark=from || wanted;
      best={goal:mark,points:[mark,mark],lengths:[0],length:0};
    }
    occupied.set(person,best.goal);
    person.group.position.copy(best.goal);
    const turn=saved?deltaYaw(saved.yaw,facing):0;
    const span=previous?Math.max(best.length/1.40,Math.abs(turn)/3.5):0;
    moves.set(person,{person,...best,start:elapsed,span,yaw:facing-turn,turn});
    if(span>.001)elapsed+=span;
  }
  let handoffPoint=null,handoffGap=null;
  if(handoff && active!==receiver && receiver){
    const meeting=sharedReach(active,receiver,handoff,tables);
    handoffPoint=meeting.point;handoffGap=meeting.gap;
    elapsed=0;
    for(const move of moves.values()){
      if(meeting.yaws.has(move.person)){
        const yaw=meeting.yaws.get(move.person);
        move.turn=deltaYaw(move.yaw,yaw);move.person.group.rotation.y=yaw;
        if(previous)move.span=Math.max(move.length/1.40,Math.abs(move.turn)/3.5);
      }
      move.start=elapsed;elapsed+=move.span;
    }
  }
  // Reaching across a broad bowl shifts the centre of weight. Stop the
  // step at the same edge used for the approach before solving the wrist.
  function shiftWeight(person,offset){
    if(person.onStand)return;
    const from=person.group.position,r=girth(person);
    const clear=p=>tables.every(q=>planarRect(p,q)>=benchClearance(person)+.01) &&
      people.every(other=>other===person || dist(p,other.group.position)>=r+girth(other)+.015);
    let fraction=1;
    for(let i=0;i<8;i++){
      const next=from.clone().addScaledVector(offset,fraction);
      if(clear(next)){from.copy(next);return;}
      fraction*=.5;
    }
  }
  let plan={moves:[...moves.values()],span:elapsed,shiftWeight,handoffPoint,handoffGap};
  if(handoff && !handoff.tryingMarks && handoffGap>.030){
    const original=people.map(person=>({point:person.group.position.clone(),yaw:person.group.rotation.y}));
    let cost=handoffGap+elapsed*.002;
    const restore=()=>people.forEach((person,i)=>{
      person.group.position.copy(original[i].point);person.group.rotation.y=original[i].yaw;
    });
    // A broad article may fit between two sleeves only after one owner
    // steps around to its other edge. Recheck the route and the actual load.
    search:for(const person of [receiver,active]){
      if(person.onStand && previous)continue;
      const partner=person===receiver?active:receiver;
      const pivot=original[people.indexOf(partner)].point,here=original[people.indexOf(person)].point;
      const bearing=Math.atan2(here.x-pivot.x,here.z-pivot.z),spacing=girth(person)+girth(partner);
      for(const extra of [.25,.51,.09,.76])for(const turn of [.50,-.50,1.05,-1.05,1.65,-1.65,2.35,-2.35]){
        restore();
        const angle=bearing+turn,r=spacing+extra,goal=person.group.position;
        goal.x=pivot.x+Math.sin(angle)*r;goal.z=pivot.z+Math.cos(angle)*r;
        if(tables.some(table=>planarRect(goal,table)<benchClearance(person)+.025) ||
          people.some(other=>other!==person && dist(other.group.position,goal)<girth(person)+girth(other)+.045))continue;
        const option=stageWalks(people,active,receiver,previous,tables,{...handoff,tryingMarks:true});
        const effort=option.handoffGap+option.span*.002;
        if(effort<cost){cost=effort;plan=option;}
        if(plan.handoffGap<.012)break search;
      }
    }
    for(const move of plan.moves){move.person.group.position.copy(move.goal);move.person.group.rotation.y=move.yaw+move.turn;}
  }
  return plan;
}

// Test the two articulated hands at the same place. A right-hand pad on the
// side of a rice cake and a bird's forward beak need different body bearings.
function sharedReach(a,b,{stage,top,seat},tables){
  const v=()=>new Vector3(),arms=[a,b].map(person=>{
    const hand=person.hand('right'),palm=person.group.worldToLocal(hand.getWorldPosition(v()));
    return {person,hand,foot:person.group.position,initial:person.group.rotation.y,
      restY:stage.worldToLocal(hand.getWorldPosition(v())).y,angle:Math.atan2(palm.x,palm.z)};
  });
  const [one,two]=arms,dx=two.foot.x-one.foot.x,dz=two.foot.z-one.foot.z,gap=Math.hypot(dx,dz)||1;
  const heights=[(one.restY+two.restY)/2,one.restY,two.restY,top+.15,top+.38,top+.58,top-.15];
  let best;
  function test(x,height,z){
    const local=new Vector3(x,height,z);
    const floor=tables.some(table=>planarRect(local,table)<.24)?top+.08:.25;
    if(height<floor)return;
    const point=stage.localToWorld(local.clone());
    const yaws=new Map();let cost=0,widest=0;
    for(const arm of arms){
      const heading=Math.atan2(x-arm.foot.x,z-arm.foot.z)-arm.angle;
      let bestCost=Infinity,bearing,miss=Infinity;
      for(const off of [0,.55,-.55,1.05,-1.05]){
        const yaw=heading+off;arm.person.group.rotation.y=yaw;
        arm.person.grasp(point,null,false);
        const distance=arm.hand.getWorldPosition(v()).distanceTo(point);
        const score=distance+.004*Math.abs(deltaYaw(arm.initial,yaw));
        if(score<bestCost){bestCost=score;bearing=yaw;miss=distance;}
      }
      yaws.set(arm.person,bearing);cost=Math.max(cost,bestCost);widest=Math.max(widest,miss);
    }
    cost+=.003*(dist(one.foot,local)+dist(two.foot,local)-gap);
    if(best && cost>=best.cost)return;
    if(seat){
      for(const arm of arms){arm.person.group.rotation.y=yaws.get(arm.person);arm.person.grasp(point,null,false);}
      const displacement=seat(point);
      cost+=displacement;widest=Math.max(widest,displacement);
    }
    if(!best || cost<best.cost)best={cost,point,local,yaws,gap:widest};
  }
  marks:for(const fraction of [.5,.34,.66,.20,.80])for(const aside of [0,.24,-.24,.48,-.48,.70,-.70,.85,-.85])for(const height of heights){
    test(one.foot.x+dx*fraction-dz/gap*aside,height,one.foot.z+dz*fraction+dx/gap*aside);
    if(best?.gap<.005)break marks;
  }
  for(const step of [.18,.085,.038,.018]){
    if(best.gap<.005)break;
    const at=best.local;
    for(const x of [-step,0,step])for(const y of [-step,0,step])for(const z of [-step,0,step]){
      test(at.x+x,at.y+y,at.z+z);
    }
  }
  for(const {person} of arms){person.grasp(null,null,false);person.group.rotation.y=best.yaws.get(person);}
  return best;
}

export function poseStageWalk(move,time){
  const u=move.span?MathUtils.clamp((time-move.start)/move.span,0,1):1;
  // Ease over a short fraction of each end, retaining foot speed on the long
  // part of a crossing. Walkers keep the recipient or the exhibit in sight.
  const t=u<.12?u*u/.2112:u>.88?1-(1-u)**2/.2112:(u-.06)/.88;
  let d=move.length*t,i=0;
  while(i<move.lengths.length-1 && d>move.lengths[i])d-=move.lengths[i++];
  const group=move.person.group;
  group.position.lerpVectors(move.points[i],move.points[i+1],Math.min(1,d/(move.lengths[i] || 1)));
  group.rotation.y=move.yaw+move.turn*t;
  return u>0 && u<1 && move.length>.02?Math.min(1.4,move.length/move.span):0;
}
