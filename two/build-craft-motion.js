// The joiner prepares a small number of actual components on one portable
// bench. Coordinates are metres in the bench frame; its near edge faces +Z.
import { restWorkGrip } from './working-grips.js';
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

export const BENCH_LEGS=[[-.69,-.47],[-.69,.16],[.69,-.47],[.69,.47]];
// Working stock sits at the near end of a narrow shooting board. The
// projecting board is beside the belly with a fixed stop behind its toe.
export const PLANING_BOARD={x:.430,width:.124,far:-.125,near:.785,hookEnd:.835,start:.396,end:.756};
export const PLANE_HALF_WIDTH=.175;
export const JOINT={x:.467,z:.51,braceX:-.112,braceZ:.547};
const sawX=.320;
// Two contact points on opposite sides of the rattan, one hand just ahead
// of the other. Both are behind the rivet, well clear of the blade.
const sawPads=[[.030,-.004,.432],[-.037,-.003,.357]];

function planeSocketTurns(player,size){
  return [0,1].map(i=>{
    const [x,,z]=restWorkGrip(player.mode,i,size);
    return Math.min(.90,Math.atan2(Math.abs(x),z)-Math.asin((PLANE_HALF_WIDTH-.003)/Math.hypot(x,z)));
  });
}
export function carpenterStance(player,tool='saw'){
  const size=player.buffs?.full>0?1.28:1;
  const height=restWorkGrip(player.mode,0,size)[1]-.16;
  let x,z,turns,faces;
  if(tool==='plane'){
    turns=planeSocketTurns(player,size);
    x=PLANING_BOARD.x;
    z=PLANING_BOARD.end+.01+restWorkGrip(player.mode,0,size,turns[0])[2];
    if(player.mode==='kagami')z=Math.max(z,PLANING_BOARD.hookEnd+.83*size);
  }else if(tool==='saw'){
    turns=[.785,.745];faces=['inside','inside'];x=sawX;
    z=.55+.395+restWorkGrip(player.mode,0,size,turns[0],faces[0])[2];
  }else{
    const driveX=JOINT.x-.266*Math.sin(.78)+.015;
    x=(driveX+JOINT.braceX)/2;faces=['bottom','bottom'];
    // The broad travelling cake rolls each root further round its breast.
    // Put the two pads above their own marks before the lift begins.
    turns=[driveX,JOINT.braceX].map((mark,i)=>{
      let low=.30,high=.95;
      for(let j=0;j<10;j++){
        const mid=(low+high)/2;
        const lateral=Math.abs(restWorkGrip(player.mode,i,size,mid,faces[i])[0]);
        if(lateral>Math.abs(mark-x))low=mid;else high=mid;
      }
      return (low+high)/2;
    });
    const depths=turns.map((angle,i)=>restWorkGrip(player.mode,i,size,angle,faces[i])[2]);
    z=(JOINT.z+.266*Math.cos(.78)+JOINT.braceZ+depths[0]+depths[1])/2+.035;
    if(player.mode==='kagami')z=Math.max(z,JOINT.z+.095+.84*size);
  }
  return {x,z,height,turns,faces,feet:[[x+.30*size,z-.05*size],[x-.30*size,z+.05*size]]};
}
export const benchHeight=(height,cut)=>height+(cut.tool==='plane'?.062:cut.tool==='mallet'?-.15:0);
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
  const cuts=constructionCuts(site);
  const tools=[...new Set(cuts.map(c=>c.tool))];
  const stances=tools.map(tool=>carpenterStance(player,tool));
  const lowBench=Math.min(...cuts.map(cut=>benchHeight(stances[0].height,cut)));
  for(const extra of [1.22,2.55,4.15])for(const angle of [0,.55,-.55,1.10,-1.10,1.65,-1.65,2.28,-2.28,pi]){
    const yaw=direction+angle;
    const frame={x:site.x+Math.sin(yaw)*(radius+extra),z:site.z+Math.cos(yaw)*(radius+extra),yaw};
    const world=p=>benchPoint(frame,...p);
    const level=p=>{const [x,z]=world(p);return groundHeight(x,z,terrainContactHeight(x,z)+.20);};
    const pads=stances.map(s=>s.feet.map(level)),legsY=legs.map(level);
    const activePads=pads.flat();
    const y=activePads.reduce((a,b)=>a+b,0)/activePads.length;
    if(Math.max(...activePads)-Math.min(...activePads)>.22 || Math.max(...legsY)>y+lowBench-.14 || Math.min(...legsY)<y-1.50)continue;
    if(stances.some(s=>[-.15,.12].some(dz=>!clear(...world([s.x,s.z+dz]),y,.65*size,1.65*size))))continue;
    const spots=[...legs,[0,0],[-.74,0],[.74,0],[.57,.59],[PLANING_BOARD.x,PLANING_BOARD.near],[0,-.58]];
    if(spots.some(p=>{const xy=world(p),h=level(p);return h>y+lowBench-.095 || h-waterSurfaceAt(...xy)<.12 || !clear(...xy,h,.23,1.3*size);}))continue;
    const feetByTool=Object.fromEntries(tools.map((tool,i)=>[tool,pads[i].map(v=>v-y)]));
    return {...frame,y,feet:feetByTool[tools[0]],feetByTool,legs:legsY.map(v=>v-y),detail:false};
  }
  return {x:0,y:0,z:0,yaw:0,feet:[0,0],legs:[0,0,0,0],detail:true};
}

export function craftMotion(site,player,bench) {
  const cuts=constructionCuts(site);
  const stances=cuts.map(c=>carpenterStance(player,c.tool)),height=stances[0].height,heading=pi;
  const size=player.buffs?.full>0?1.28:1;
  const duration=cuts.reduce((s,c)=>s+c.duration,0);
  function sample(time){
    time=Math.max(0,Math.min(duration,time));
    let index=0,t=time;
    while(index<cuts.length-1 && t>=cuts[index].duration){t-=cuts[index++].duration;}
    const cut=cuts[index],q=t/cut.duration;
    const stance=stances[index],hero=[stance.x,0,stance.z];
    const pads=bench.feetByTool?.[cut.tool]??bench.feet;
    const feet=stance.feet.map(([x,z],i)=>[x,pads[i],z]);
    let grasp=ease((q-.025)/.14),twist=0,planeReach=0,palms,weightShift;
    const phase=clamp((q-.17)/.65);
    let position,rotation=[0,0,0],holds,workTop=benchHeight(height,cut),effort=0,shave=0,shed=0,fall=0,pin=0,cue=null;
    if(cut.tool==='saw'){
      workTop+=cut.bamboo?.145:.142;
      // The teeth bite on each pull. On the return the blade follows the
      // existing kerf, with the next pull starting at exactly that depth.
      const strokes=phase*3,number=Math.floor(strokes),cycle=strokes-number;
      const wave=(1-Math.cos(cycle*2*pi))*.5;
      const cutProgress=(number+(cycle<.5?wave:1))/3;
      const back=ease((q-.82)/.14),z=.342+wave*.175+back*.065;
      // Mirror on the blade puts the teeth below the back after the quarter turn.
      const along=z/.91,teeth=-.020+.05+.052*Math.sin(along*pi*.69)+.012;
      position=[sawX,workTop+teeth-.002-cutProgress*((cut.bamboo?.145:.142)+.003)+back*.10,z];
      rotation=[0,0,pi/2];
      holds=sawPads.map(([x,y,dz])=>[sawX+x,position[1]+y,z+dz]);
      const draw=phase>0 && phase<1?Math.sin(2*pi*cycle):0;
      const pull=Math.max(0,draw),backward=Math.max(0,-draw);
      palms=[{normal:[1,0,0],curl:[0,.10*pull,.30*draw],pressure:.32+.47*pull},
        {normal:[-1,0,0],curl:[0,-.08*pull,-.22*draw],pressure:.27+.34*pull}];
      weightShift=[-.024*pull,.034*backward-.048*pull];
      effort=pull;
      // At the end of the third pull the end is free. Drop it the 59 mm to
      // the receiving board while the saw travels out of the cut.
      const secondsSinceCut=Math.max(0,phase-5/6)*cut.duration*.65;
      fall=clamp(.5*9.81*secondsSinceCut**2/.059);
      if(cycle<.5 && wave>.4)cue='saw-'+number;
    }else if(cut.tool==='plane'){
      workTop+=.080;
      // Take the plane at the near end. With the edge clear, send it to
      // the far end, settle the whole sole, then pull the shaving toward
      // the belly. A second lift frees the first curl before the return.
      const ramp=(a,b)=>ease((q-a)/(b-a));
      const send=ramp(.175,.305),first=ramp(.35,.515);
      const back=ramp(.566,.688),second=ramp(.738,.91);
      const float=ramp(.135,.175)-ramp(.305,.35)+ramp(.515,.566)-ramp(.688,.738);
      const reach=send-first+back-second;
      const pitch=-.19*float,cs=Math.cos(pitch),sn=Math.sin(pitch);
      rotation=[pitch,0,0];
      position=[PLANING_BOARD.x,workTop+.046*float,mix(PLANING_BOARD.end,PLANING_BOARD.start,reach)];
      const onCap=(x,z)=>[position[0]+x,position[1]+.044*cs-z*sn,position[2]+.044*sn+z*cs];
      const grip=PLANE_HALF_WIDTH-.003;
      holds=[onCap(grip,.152),onCap(-grip,.156)];
      const cutting=Math.sin(pi*first)+Math.sin(pi*second);
      const strokeLoad=cutting*.87,returning=Math.sin(pi*send)+Math.sin(pi*back);
      // Tip the toe on the unloaded return, then draw from the shoulder.
      // Keep the pad cocked on the far end. Roll onto the pull just as the
      // sole settles, then ease out of that grip at the end of the shaving.
      const cock=ramp(.135,.205)-ramp(.474,.53)+ramp(.55,.62)-ramp(.872,.93);
      const turn=ramp(.330,.380)-ramp(.465,.525)+ramp(.716,.766)-ramp(.861,.926);
      const wristRoll=-.54*cock+.66*turn;
      const normal=[0,cs,sn];
      palms=[{normal,wristRoll,curl:[.06*cutting,0,.86*cutting-.84*float],pressure:.24+.64*cutting+.15*reach},
        {normal,wristRoll:.66*wristRoll,curl:[0,0,.56*cutting-.52*float],pressure:.29+.43*cutting}];
      // Feet stay planted as the palms reach the far end. Soften the belly
      // briefly, then let it load the blade about a tenth of a second later.
      const followFirst=ramp(.375,.54),followSecond=ramp(.763,.935);
      const bodyReach=ramp(.201,.331)-followFirst+ramp(.592,.714)-followSecond;
      planeReach=.88*reach+.12*bodyReach;
      const check=ramp(.263,.305)-ramp(.305,.331)+ramp(.646,.688)-ramp(.688,.714);
      const bodyPull=Math.sin(pi*followFirst)+Math.sin(pi*followSecond);
      weightShift=[.023*(returning-cutting),.087*bodyReach-.024*check-.053*bodyPull];
      grasp=ease((q-.018)/.103)*(1-ramp(.933,.992));
      effort=strokeLoad;
      shave=q<=.515?first:second;
      shed=ramp(.515,.65);
      if(cutting>.36)cue='plane-'+Number(q>=.738);
    }else{
      workTop+=.20;
      const strokes=Math.min(3,phase*3),number=Math.min(2,Math.floor(strokes));
      const u=strokes-number;
      const lift=u<.55?ease(u/.55):1-ease((u-.55)/.27);
      pin=.027*(number+ease((u-.82)/.08));
      const ready=ease((q-.169)/.095),park=ease((q-.82)/.12);
      const swing=lift*ready*(1-park),handle=.266;
      // The head travels around the wrap in the palm. A short vertical
      // follow-through seats the peg while the other pad braces the rail.
      const rest=[JOINT.x+.06-handle*Math.sin(.78),workTop+.066,JOINT.z+.045+handle*Math.cos(.78)];
      const working=[JOINT.x-handle*Math.sin(.78)+.021*lift,workTop+.082-pin+.066+.008*lift,JOINT.z+handle*Math.cos(.78)+.015*lift];
      const hand=blend(blend(rest,working,ready),rest,park);
      hand[1]+=.07*Math.sin(pi*park);
      rotation=[1.02*swing,-.78-.38*swing,.15*swing];
      const [rx,ry]=rotation,c=Math.cos(ry);
      position=[hand[0]-handle*Math.sin(ry),hand[1]+handle*c*Math.sin(rx),hand[2]-handle*c*Math.cos(rx)];
      // Sit the lower surface of the driving pad against the wrap. The
      // handle itself stays below this point as it rolls into the strike.
      const sz=Math.sin(rotation[2]),cz=Math.cos(rotation[2]),sx=Math.sin(rx),cx=Math.cos(rx),sy=Math.sin(ry);
      const grip=[hand[0]-.024*c*sz,hand[1]+.024*(cx*cz-sx*sy*sz),hand[2]+.024*(sx*cz+cx*sy*sz)];
      holds=[grip,[JOINT.braceX,workTop,JOINT.braceZ]];
      twist=(-.085*swing+.038*(1-lift)*ready)*(1-park);
      const strike=ease((u-.56)/.26)*(1-ease((u-.87)/.13))*ready*(1-park);
      const follow=ease((u-.81)/.08)*(1-ease((u-.89)/.11))*ready*(1-park);
      palms=[{normal:[0,Math.cos(rx),Math.sin(rx)],curl:[.57*swing-.68*strike,.21*swing,.15*follow],
        pressure:.29+.31*swing+.56*strike},{normal:[0,1,0],curl:[0,0,0],pressure:.64+.18*strike}];
      weightShift=[-.059*swing+.032*follow,.012*ready-.025*swing+.055*follow];
      grasp*=1-ease((q-.94)/.06);
      effort=.50*lift;if(phase>0 && u>=.82 && u<=1 && q<=.82)cue='knock-'+number;
    }
    const brace=cut.tool==='mallet'?ease((q-.008)/.114)*(1-ease((q-.955)/.045)):grasp;
    const handWork=[grasp,brace],gripFace=stance.faces;
    const socketTurn=stance.turns.map((turn,i)=>handWork[i]*turn);
    const free=socketTurn.map((angle,i)=>{
      const [x,y,z]=restWorkGrip(player.mode,i,size,angle,gripFace?.[i]);
      return [stance.x-x,y,stance.z-z];
    });
    const hands=holds.map((target,i)=>blend(free[i],target,handWork[i]));
    if(cut.tool==='mallet'){
      hands[0][1]+=.15*Math.sin(pi*grasp);
      hands[1][1]+=.10*Math.sin(pi*brace);
    }
    palms=palms.map((p,i)=>handWork[i]?p:null);
    weightShift=weightShift.map(n=>n*grasp);
    const cutOpacity=Math.max(index>0?1-ease((t-.065)/.185):0,
      index<cuts.length-1?ease((t-cut.duration+.24)/.175):0);
    return {hero,heading,feet,hands,planeReach,restHands:free,socketTurn,handWork,gripFace,time,index,twist,palms,weightShift,label:cut.label,tool:cut.tool,t,workTop,position,rotation,cutOpacity,cue,
      focus:[position[0],workTop,cut.tool==='saw'?0:position[2]],lean:.018+grasp*(.034+.032*effort),lift:-.014*grasp,effort:grasp*(.29+.25*effort),
      phase:q>.94?'finish':'craft',grasp,fall,shave,shed,pin,progress:phase};
  }
  return {cuts,duration,height,sample};
}
