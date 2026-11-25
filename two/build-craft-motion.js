// The joiner prepares a small number of actual components on one portable
// bench. Coordinates are metres in the bench frame; its near edge faces +Z.
import { BUILD_MODULES } from './living-build-state.js';
import { terrainContactHeight,waterSurfaceAt,canOccupy,groundHeight,wrapDelta } from './terrain.js';

const pi=Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
const blend=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const saw=(label,bamboo=false)=>({tool:'saw',label,bamboo,duration:4.75});
const plane=label=>({tool:'plane',label,duration:4.05});
const peg=label=>({tool:'mallet',label,duration:3.90});
const foundation=saw('束柱を基礎の高さに合わせて挽く');
const work={
  camp:[saw('寝台の横竹を挽く',true),peg('旗竿の受けに木栓を打つ')],
  fence:[saw('竹垣の横竹を挽く',true)],
  chest:[plane('道具櫃の蓋板に鉋をかける')],
  floor:[plane('床板の表を鉋で整える')],
  hut:[saw('土台の材を寸法どおりに挽く'),plane('床板の表を鉋で整える'),peg('柱と桁の継ぎ手に木栓を打つ')],
  posts:[saw('柱を寸法どおりに挽く'),peg('柱と桁の継ぎ手に木栓を打つ')],
  wall:[plane('腰板の表を鉋で整える')],
  roof:[saw('屋根板の端を挽きそろえる'),peg('棟木の継ぎ手に木栓を打つ')],
  stand:[plane('売り棚の天板に鉋をかける'),peg('脚と横木の継ぎ手に木栓を打つ')],
};
export function constructionCuts(site){
  const cuts=work[site.kind];
  if(!cuts)throw new Error('未知の部材');
  if(site.kind==='camp' && site.parentId)return [cuts[0]];
  if(!(site.foundationWood>0))return cuts;
  return site.kind==='hut'?[foundation,...cuts.slice(1)]:[foundation,...cuts].slice(0,3);
}

export const BENCH_LEGS=[[-.69,-.47],[-.69,.47],[.69,-.47],[.69,.47]];
export function benchPoint(frame,x,z) {
  const c=Math.cos(frame.yaw),s=Math.sin(frame.yaw);
  return [frame.x+x*c+z*s,frame.z-x*s+z*c];
}

// Seat the carpenter's soles and all four bench legs separately. Buildings on
// tall piers still get worked at ground level; travel coordinates remain live
// only after the completion transaction.
export function findWorkBench(site,player,canStand=()=>true) {
  const size=player.buffs?.full>0?1.28:1,d=BUILD_MODULES[site.kind],radius=Math.hypot(d.width,d.depth)*.5;
  const direction=Math.atan2(wrapDelta(player.x-site.x),wrapDelta(player.z-site.z));
  const clear=(x,z,y,r,h)=>canOccupy(x,z,y+.025,r,h) && canStand(x,z,y+.025,r,h);
  const legs=BENCH_LEGS;
  const feet=[[.30*size,1.65*size-.085],[-.30*size,1.65*size+.085]];
  for(const extra of [1.22,2.55,4.15])for(const angle of [0,.55,-.55,1.10,-1.10,1.65,-1.65,2.28,-2.28,pi]){
    const yaw=direction+angle;
    const frame={x:site.x+Math.sin(yaw)*(radius+extra),z:site.z+Math.cos(yaw)*(radius+extra),yaw};
    const world=p=>benchPoint(frame,...p);
    const level=p=>{const [x,z]=world(p);return groundHeight(x,z,terrainContactHeight(x,z)+.20);};
    const pads=feet.map(level),y=(pads[0]+pads[1])*.5,legsY=legs.map(level);
    if(Math.abs(pads[0]-pads[1])>.22 || Math.max(...legsY)>y+.54*size-.21 || Math.min(...legsY)<y-1.50)continue;
    const stance=world([0,1.65*size]);
    if(!clear(...stance,y,.65*size,1.65*size))continue;
    const spots=[...legs,[0,0],[-.74,0],[.74,0],[0,.58],[0,-.58]];
    if(spots.some(p=>{const xy=world(p),h=level(p);return h>y+.54*size-.105 || h-waterSurfaceAt(...xy)<.12 || !clear(...xy,h,.23,1.3*size);}))continue;
    return {...frame,y,feet:pads.map(v=>v-y),legs:legsY.map(v=>v-y),detail:false};
  }
  return {x:0,y:0,z:0,yaw:0,feet:[0,0],legs:[0,0,0,0],detail:true};
}

export function craftMotion(site,player,bench) {
  const cuts=constructionCuts(site),size=player.buffs?.full>0?1.28:1;
  const height=.54*size,hero=[0,0,1.65*size],heading=pi;
  const feet=[[.30*size,bench.feet[0],hero[2]-.085],[-.30*size,bench.feet[1],hero[2]+.085]];
  const free=[[.65*size,.73*size,hero[2]-.45*size],[-.65*size,.73*size,hero[2]-.45*size]];
  const duration=cuts.reduce((s,c)=>s+c.duration,0);
  // Clearance beneath the whole soft mitt, in bench coordinates. Around a
  // board edge the clearance falls away gradually, so the hand can wrap
  // over the edge without acquiring a sharp crease.
  function workSurface(cut,x,z,tool,fall){
    const top=(l,r,n,f,y)=>y-1.5*Math.hypot(Math.max(0,l-x,x-r),Math.max(0,n-z,z-f));
    let h=top(-.88,.88,-.602,.602,height);
    if(cut.tool==='saw'){
      h=Math.max(top(-.88,.31,-.602,.602,height),top(.345,.88,-.602,.602,height-.059));
      if(cut.bamboo){
        const dz=Math.min(.0725,Math.abs(z)),crown=.0725+Math.sqrt(.0725**2-dz**2);
        return Math.max(h,top(-.79,.318,-.0725,.0725,height+crown),top(.322,.67,-.0725,.0725,height+crown-.059*fall));
      }
      return Math.max(h,top(-.79,.318,-.0825,.0825,height+.142),top(.322,.67,-.0825,.0825,height+.142-.059*fall));
    }
    if(cut.tool==='plane'){
      // The palm draws the toe while the other hand steadies the heel.
      const [tx,ty,tz]=tool;
      return Math.max(h,top(-.123,.123,-.64,.64,height+.080),top(-.127,.127,.642,.685,height+.046),
        top(tx-.0905,tx+.0905,tz-.169,tz+.165,ty+.080));
    }
    return Math.max(h,top(-.58,.58,-.11,.08,height+.20),top(-.035,.155,-.32,.34,height+.20));
  }
  function sample(time){
    time=Math.max(0,Math.min(duration,time));
    let index=0,t=time;
    while(index<cuts.length-1 && t>=cuts[index].duration){t-=cuts[index++].duration;}
    const cut=cuts[index],q=t/cut.duration,grasp=ease((q-.025)/.14);
    const phase=clamp((q-.17)/.65);
    let position,rotation=[0,0,0],holds,workTop=height,effort=0,shave=0,shed=0,fall=0,pin=0,cue=null;
    if(cut.tool==='saw'){
      workTop+=cut.bamboo?.145:.142;
      // The teeth bite on each pull. On the return the blade follows the
      // existing kerf, with the next pull starting at exactly that depth.
      const strokes=phase*3,number=Math.floor(strokes),cycle=strokes-number;
      const wave=(1-Math.cos(cycle*2*pi))*.5;
      const cutProgress=(number+(cycle<.5?wave:1))/3;
      const back=ease((q-.82)/.14),z=.37+wave*.31+back*.19;
      // Mirror on the blade puts the teeth below the back after the quarter turn.
      const along=z/.91,teeth=-.020+.05+.052*Math.sin(along*pi*.69)+.012;
      position=[.32,workTop+teeth-.002-cutProgress*(workTop-height+.003)+back*.19,z];
      rotation=[0,0,pi/2];
      holds=[[.32-.011,position[1]-.004,z+.22],[-.235,workTop+.0015,0]];
      effort=wave;
      // At the end of the third pull the end is free. Drop it the 59 mm to
      // the receiving board while the saw travels out of the cut.
      const secondsSinceCut=Math.max(0,phase-5/6)*cut.duration*.65;
      fall=clamp(.5*9.81*secondsSinceCut**2/.059);
      if(cycle<.5 && wave>.4)cue='saw-'+number;
    }else if(cut.tool==='plane'){
      workTop+=.080;
      // Japanese planes cut on the pull towards the body. Lift the sole off
      // the board on its single return. Leave the finished shaving at the toe.
      const back=ease((phase-.40)/.20),second=ease((phase-.60)/.40);
      const forward=ease(phase/.40);
      const raised=.067*Math.sin(pi*back);
      position=[0,workTop+raised,-.40+.74*(forward-back+second)];
      holds=[[.087,position[1]+.0815,position[2]+.118],[-.087,position[1]+.0815,position[2]-.055]];
      effort=(phase<.4?Math.sin(pi*forward):Math.sin(pi*second))*.8;
      shave=phase<.4?forward:phase<.6?0:second;
      shed=phase>=.40?ease((phase-.40)/.17):0;
      if(shave>.25 && shave<.83)cue='plane-'+Number(phase>=.6);
    }else{
      workTop+=.20;
      const strokes=Math.min(3,phase*3),number=Math.min(2,Math.floor(strokes));
      const u=strokes-number;
      const lift=u<.55?ease(u/.55):1-ease((u-.55)/.27);
      pin=.036*(number+ease((u-.82)/.08));
      const ready=ease((q-.169)/.095),withdraw=ease((q-.83)/.12);
      const rest=[.51,height+.067,.32],peak=.32*lift;
      const impact=[.06,workTop+.109-pin+.066+peak+withdraw*.16,-.015];
      position=blend(rest,impact,ready);rotation=[-.57*lift*ready,0,0];
      const [rx]=rotation;
      holds=[[position[0],position[1]-.223*Math.sin(rx),position[2]+.223*Math.cos(rx)],
        [-.24,workTop+.0015,.026]];
      effort=.50*lift;if(phase>0 && u>=.82 && u<=1)cue='knock-'+number;
    }
    const hands=holds.map((h,i)=>blend(free[i],h,grasp));
    const cutOpacity=Math.max(index>0?1-ease((t-.065)/.185):0,
      index<cuts.length-1?ease((t-cut.duration+.24)/.175):0);
    return {hero,heading,feet,hands,restHands:free,handWork:[grasp,grasp],time,index,supportHeight:(x,z)=>workSurface(cut,x,z,position,fall),label:cut.label,tool:cut.tool,t,workTop,position,rotation,cutOpacity,cue,
      focus:[0,workTop,0],lean:.018+grasp*(.034+.032*effort),lift:-.014*grasp,effort:grasp*(.29+.25*effort),
      phase:q>.94?'finish':'craft',grasp,fall,shave,shed,pin,progress:phase};
  }
  return {cuts,duration,height,sample};
}
