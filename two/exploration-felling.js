import * as T from './vendor/three.module.min.js';
import { restWorkGrip } from './working-grips.js';
import { timberCut } from './homestead-timber-section.js';
import { createCookingPerformer } from './cooking-performer.js';
import { groundHeight, canOccupy, waterSurfaceAt } from './terrain.js';
import { InkForm, surface } from './ryugu-ink.js';
import { cookingAtlas } from './cooking-atlases.js';
import {axeEdges} from './timber-axe-mouth.js';
import { fallingTimber } from './falling-timber.js';

const pi=Math.PI,tau=2*pi,clamp=n=>Math.min(1,Math.max(0,n));
const ease=n=>{const k=clamp(n);return k*k*(3-2*k);};
const mix=(a,b,f)=>a+(b-a)*f;
const blend=(a,b,f)=>a.map((n,i)=>mix(n,b[i],f));
const arc=(a,b,f)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*f;

// Ash haft, forged cheek, bright bevel and the wood wedge which locks the
// head into the eye. The working edge lies in a vertical plane at the strike.
function handAxe(){
  const f=new InkForm({wood:0,iron:7,end:6,wrap:4},4,2);
  f.stroke([[0,-.11,.033],[.004,-.075,.032],[.009,.012,.023],[.008,.16,.006],[.004,.35,-.009],
    [.002,.49,-.002],[0,.546,0],[0,.618,.003]],[.033,.043,.037,.032,.031,.039,.035,.029],'#a88963','wood',14,25);
  for(let i=0;i<6;i++){
    const path=[];
    for(let j=0;j<=16;j++){const a=tau*j/16;path.push([.009+.038*Math.cos(a),-.051+.012*i+.003*j/16,.030+.036*Math.sin(a)]);}
    f.stroke(path,.0028,i%2?'#91795c':'#756348','wrap',5,12);
  }
  const outline=[[.073,.475],[.087,.586],[.021,.621],[-.048,.618],[-.120,.593],[-.191,.568],[-.216,.530],[-.217,.487],[-.203,.451],[-.178,.439],[-.082,.488],[-.023,.471]];
  const width=[.039,.040,.043,.046,.039,.021,.004,.003,.004,.017,.037,.041];
  const face=(points,tint)=>{
    const g=surface(points.flat(),[0,1,2],[.08,.12,.87,.19,.41,.89]);f.draw(g,[0,0,0],[1,1,1],tint,[0,0,0],'iron');g.dispose();
  };
  for(let i=0;i<outline.length;i++){
    const j=(i+1)%outline.length,[z,y]=outline[i],[zz,yy]=outline[j];
    for(const side of [-1,1]){
      const a=[side*width[i],y,z],b=[side*width[j],yy,zz];
      const bevel=i>=5 && i<=8,faceZ=-.045;
      face([a,b,[side*.046,.539,faceZ]],bevel?'#abae9c':i%3?'#5a605f':'#666c68');
    }
    const a=[-width[i],y,z],b=[width[i],y,z],c=[width[j],yy,zz],d=[-width[j],yy,zz];
    const crown=i>=5 && i<=8?'#ccd0bc':'#777970';face([a,b,c],crown);face([a,c,d],crown);
  }
  f.oval([0,.617,.006],[.030,.010,.041],'#b79970',[0,0,0],'end');
  f.oval([.001,.625,.009],[.006,.005,.030],'#5b5952',[0,-.13,0],'iron');
  const mat=new T.MeshStandardMaterial({vertexColors:true,map:cookingAtlas('materials'),side:T.DoubleSide,roughness:.68});
  const tool=new T.Mesh(f.geometry(),mat);tool.castShadow=tool.receiveShadow=true;tool.name='楔を打った手斧';
  return tool;
}
function bladeChips(parent,plan){
  const shards=new T.Group(),material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
  const grain=new T.Color(),parts=[];
  for(let i=0;i<5;i++){
    const wide=i===1?.055:.016+i*.003,long=.034+.009*(i%3);
    // A shaving has a feathered leading edge and a blunt, torn end.
    const g=surface([-wide,-.002,-long,wide*.72,0,-long*.84,wide*.61,.006,long*.57,
      -wide*.83,.009,long,0,.020,.63*long], [0,1,2,0,2,3,0,3,4,3,2,4,2,1,4,1,0,4], [0,0,1,0,.88,.74,0,1,.43,.70]);
    const colors=['#ae855c','#c79864','#dbb07b','#edc595','#856548'].flatMap(c=>grain.set(c).toArray());
    g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    const piece=new T.Mesh(g,material);parts.push(piece);shards.add(piece);
  }
  shards.visible=false;parent.add(shards);
  return {update(time,count){
    if(!count)return;
    const age=time-plan.impactTimes[count-1],size=Math.min(1.2,plan.stem.radius/.19);
    shards.visible=age<.45 && age>=0;
    if(!shards.visible)return;
    const at=plan.edges[count-1],length=(plan.front-at)*.24;
    for(const [i,m] of parts.entries()){
      m.visible=i<2+count;
      if(!m.visible)continue;
      const side=i%2?1:-1,spread=(i*.37)%1,travel=.58+.15*i;
      m.position.set(side*(.032*size+age*(.31+.18*i)),length*(.35+.36*spread)+age*(.65+.16*i)-3.8*age*age,
        plan.front-length*(.25+.55*spread)+age*travel);
      m.rotation.set(.3*i+age*(3+i),side*age*5,i*1.1+age*4);
      m.scale.setScalar((.48+.18*count)*size*(1-ease((age-.34)/.11)));
    }
  },dispose(){for(const piece of parts)piece.geometry.dispose();material.dispose();}};

}
export function fellingMotion(tree,player,canStand=()=>true,mouth,bearingOverride,fine=false){
  const cut=timberCut(tree),stem=tree.stem??cut;
  const initialBearing=Math.atan2(player.x-stem.x,player.z-stem.z);
  if(!mouth && bearingOverride===undefined){
    let best;
    for(const offset of [0,.58,-.58,1.15,-1.15,1.76,-1.76,2.35,-2.35,pi]){
      const plan=fellingMotion(tree,player,canStand,undefined,initialBearing+offset);
      if(!best || plan.footingError<best.footingError)best=plan;
      if(best.footingError<.024)break;
    }
    if(best.footingError>.03){
      for(let i=0;i<24;i++){
        const plan=fellingMotion(tree,player,canStand,undefined,initialBearing+i*tau/24,true);
        if(plan.footingError<best.footingError)best=plan;
        if(best.footingError<.03)break;
      }
    }
    return best;
  }
  const bearing=bearingOverride??initialBearing,c=Math.cos(bearing),s=Math.sin(bearing);
  const giant=player.buffs?.full>0?1.28:1,dist=Math.hypot(player.x-stem.x,player.z-stem.z);
  const start=[dist*Math.sin(initialBearing-bearing),dist*Math.cos(initialBearing-bearing)],initial=player.heading-bearing,reference=player.y;
  const world=(u,v)=>[stem.x+u*c+v*s,stem.z-u*s+v*c];
  const floor=(u,v)=>groundHeight(...world(u,v),reference)-stem.y;
  const saddle=player.mount==='bike'?.90:player.mount==='turtle'?1.04:0;
  const ground=groundHeight(player.x,player.z,reference);
  const landingY=!saddle && !player.inWater && !player.skiff && !player.grounded && reference-ground<1.6?ground:null;
  const grip=new T.Vector3(.014,.064,.024),edge=new T.Vector3(0,.51,-.215);
  const turn=new T.Euler(0,0,0,'YXZ'),offset=new T.Vector3();
  const front=mouth?.front??stem.radius,edges=mouth?.edges??axeEdges(front,-stem.radius);
  const targets=edges.map(z=>[0,.006,z]);
  const [nativeRight,nativeLeft]=[0,1].map(i=>restWorkGrip(player.mode,i,giant));
  const palmX=-nativeRight[0],palmY=nativeRight[1],palmZ=nativeRight[2];
  const hipRadius=.40*palmX/.785,heelWidth=.28*palmX/.785;
  const hipWind=-.35,waistWind=-.14;
  function footOffset(side,heading){
    const x=side*heelWidth,z=(.08+.045*side)*giant,c=Math.cos(heading),s=Math.sin(heading);
    return [x*c+z*s,z*c-x*s];
  }
  // Rotate the stance about the sole on the axe side. Applying the inverse
  // change in its offset to the hip keeps this foot in place throughout.
  function hipPivot(facing,heading){
    const dc=Math.cos(facing)-Math.cos(heading),ds=Math.sin(facing)-Math.sin(heading);
    return [-heelWidth*dc+.035*giant*ds,.035*giant*dc+heelWidth*ds];
  }
  // Keep the blade at the surveyed notch. Locate the feet around the
  // wrapped handle, trying other sides if a root, bank or wall occupies it.
  function reachAt(pitch,yaw,roll){
    return offset.copy(edge).sub(grip).applyEuler(turn.set(pitch,yaw,roll)).toArray();
  }
  const bitePitch=-.13,biteYaw=1.10;
  // Both rolls can put the edge at this height. Take the negative root so
  // the bright bevel leads the side swing and the square poll follows it.
  function biteRollFor(feetY){
    const x=edge.x-grip.x,y=edge.y-grip.y,z=edge.z-grip.z;
    const level=(.006-feetY-palmY+z*Math.sin(bitePitch))/Math.cos(bitePitch);
    const cosine=Math.min(1,Math.max(-1,level/Math.hypot(x,y)));
    return Math.max(-2.94,Math.min(-.42,Math.atan2(x,y)-Math.acos(cosine)));
  }
  let stance,workHeading,stepRange=1,footingError=Infinity;
  function landing(yaw,offset){
    let y=-.42,mark;
    for(let pass=0;pass<3;pass++){
      const off=reachAt(bitePitch,biteYaw,biteRollFor(y));
      mark=[-off[0]+palmX*Math.cos(yaw)-palmZ*Math.sin(yaw),
        edges[1]+offset-off[2]-palmX*Math.sin(yaw)-palmZ*Math.cos(yaw)];
      y=floor(...mark);
    }
    return mark;
  }
  function clearFoot(x,z,r){
    const [wx,wz]=world(x,z),y=floor(x,z)+stem.y;
    return y>=waterSurfaceAt(wx,wz)-.05 && canOccupy(wx,wz,y+.025,r,1.45*giant) && canStand(wx,wz,y+.025,r,1.45*giant);
  }
  const bearings=fine?Array.from({length:64},(_,i)=>i*tau/64):
    [0,.25,-.25,.53,-.53,.84,-.84,1.25,-1.25,1.65,-1.65,2.05,-2.05,2.5,-2.5,pi];
  candidates:for(const reach of (fine?[0,.12,.20,-.085]:[0]))for(const delta of bearings){
    const yaw=pi+delta,p=landing(yaw,reach);
    if(!clearFoot(...p,hipRadius))continue;
    const heels=[-1,1].map(side=>{const [x,z]=footOffset(side,yaw);return [p[0]+x,p[1]+z];});
    if(heels.some(([x,z])=>!clearFoot(x,z,.12*giant)))continue;
    const wound=yaw+hipWind,[dx,dz]=hipPivot(yaw,wound);
    const [leftX,leftZ]=footOffset(1,wound);
    if(!clearFoot(p[0]+dx,p[1]+dz,hipRadius) ||
      !clearFoot(p[0]+dx+leftX,p[1]+dz+leftZ,.12*giant))continue;
    const y0=floor(...heels[0]),y1=floor(...heels[1]),floorY=(y0+y1)/2;
    const biteVector=reachAt(bitePitch,biteYaw,biteRollFor(floorY));
    // Check room for the shuffle between cuts as well as the first footprint.
    // A narrow shelf may admit the two feet but not a full shuffle. The
    // steel can still work a little farther down the existing haft.
    const step=(fine?[1,.46,0]:[1]).find(range=>[edges[0],edges[2]].every(z=>
      clearFoot(p[0],p[1]+(z-edges[1])*range,.90*hipRadius)));
    if(step===undefined)continue;
    const heightError=Math.abs(floorY+palmY+biteVector[1]-.006);
    // Try another cutting face before turning the back on the tree merely
    // to find level toes. A marked right flank leaves space for the steel.
    const facingError=.16*Math.max(0,Math.acos(Math.cos(delta))-.6);
    const score=heightError+Math.max(0,Math.abs(y0-y1)-.14)*2+facingError;
    if(score<footingError){footingError=score;stance=p;workHeading=yaw;stepRange=step;}
    if(score<.022)break candidates;
  }
  // A blocked plan keeps a finite preview position while the caller tries
  // another cutting face. Only a plan with a checked footprint is played.
  stance??=start;workHeading??=pi;
  const joined=stance!==start;
  const seatedY=reference-stem.y+saddle,groundAtWork=joined?floor(...stance):seatedY;
  const biteRoll=biteRollFor(groundAtWork),biteOffset=reachAt(bitePitch,biteYaw,biteRoll);
  const startAngle=Math.atan2(start[0],start[1]),endAngle=Math.atan2(stance[0],stance[1]);
  const path=(f)=>{
    const a=arc(startAngle,endAngle,f),r=mix(dist,Math.hypot(...stance),f);
    return [r*Math.sin(a),r*Math.cos(a)];
  };
  const stride=Math.hypot(stance[0]-start[0],stance[1]-start[1]);
  const approach=.54+stride/.98,beat=.99,bite=.68,cutAt=approach+2*beat+bite;
  const impactTimes=[0,1,2].map(i=>approach+i*beat+bite),duration=cutAt+2.55;
  function sample(time){
    const t=Math.max(0,Math.min(duration,time));
    const fit=ease(t/approach),retreat=ease((t-cutAt-.48)/1.06);
    const walk=fit*(1-retreat),[baseX,near]=path(walk);
    const phase=Math.max(0,(t-approach)),cycle=Math.min(2,Math.floor(phase/beat)),within=Math.min(beat,phase-cycle*beat);
    // Set the next footprint under the grip while withdrawing the previous
    // stroke; the planted wrist need not reach farther as the notch deepens.
    const next=clamp((within-bite-.045)/(beat-bite-.045)),stepTo=edges[Math.min(cycle+1,2)];
    const shuffle=[clamp(2*next),clamp(2*next-1)];
    const shifts=shuffle.map(p=>(joined?walk*stepRange:0)*(mix(edges[cycle],stepTo,ease(p))-edges[1]));
    const wind=ease(within/.33),hit=ease((within-.35)/(bite-.35)),release=ease((within-bite-.065)/(beat-bite-.065));
    const releaseLast=cycle===2?ease((t-cutAt-.10)/.48):release;
    const take=ease((t-.14)/.32),sheathe=ease((t-cutAt-.53)/.48),grips=take*(1-sheathe);
    const coil=wind*(1-hit),drive=hit*(1-releaseLast);
    const facing=arc(initial,workHeading,walk),heading=facing+hipWind*grips*coil;
    const waistTurn=waistWind*grips*coil,[pivotX,pivotZ]=hipPivot(facing,heading);
    const u=baseX+pivotX,v=near+pivotZ+(shifts[0]+shifts[1])*.5;
    const feet=[-1,1].map((side,i)=>{
      const cycles=Math.max(1,Math.ceil(stride/.48)),a=walk*cycles,step=Math.min(cycles-1,Math.floor(a));
      const leg=clamp((a-step)*2-i),f=(step+ease(leg))/cycles;
      const [x,z]=path(f),[footX,footZ]=footOffset(side,heading);
      const fx=x+pivotX+footX,fz=z+pivotZ+shifts[i]+footZ;
      const y=mix(seatedY,joined?floor(fx,fz):seatedY,walk);
      const stepUp=.10*Math.sin(pi*leg)*Math.min(1,stride/.21)+Math.sin(pi*shuffle[i])*Math.abs(stepTo-edges[cycle])*.17*stepRange;
      return [fx,y+stepUp+(i?.024*giant*Math.sin(pi*coil):0),fz];
    });
    const hy=(feet[0][1]+feet[1][1])/2,hero=[u,hy,v];
    const at=targets[cycle],working=at.map((n,i)=>n-biteOffset[i]);
    // Wind the right shoulder around the waist, then unwind into the cut.
    // Both palms travel on that same circle. The empty left palm remains
    // open on its own cheek, counterbalancing the axe across the belly.
    const handHeading=heading+waistTurn,hc=Math.cos(handHeading),hs=Math.sin(handHeading);
    const restHands=[nativeRight,nativeLeft].map(([x,y,z])=>[u+x*hc+z*hs,hy+y,v-x*hs+z*hc]);
    const right=blend(restHands[0],working,grips*drive);
    right[1]+=.045*giant*grips*coil;
    function angle(neutral,loaded,struck,through=hit){
      const backswing=mix(neutral,loaded,wind);
      const swing=mix(backswing,struck,through);
      return mix(neutral,swing,grips*(1-releaseLast));
    }
    // The palm leads the steel out of the backswing. Let the head catch
    // up just before it bites, then keep the edge planted during the stop.
    const snap=hit-.15*Math.sin(pi*hit);
    const pitch=angle(-.30,.08,bitePitch),roll=angle(-.49,-1.27,biteRoll,snap);
    // A ledge can make the player turn across the notch. Carry the idle
    // and raised axe on the character's outside even on that footing.
    const carryYaw=heading-pi,loadedYaw=carryYaw-.88;
    const sweptYaw=arc(mix(carryYaw,loadedYaw,wind),biteYaw,snap);
    const toolYaw=arc(carryYaw,sweptYaw,grips*(1-releaseLast));
    turn.set(pitch,toolYaw,roll);
    offset.copy(grip).applyEuler(turn);
    const tool=[right[0]-offset.x,right[1]-offset.y,right[2]-offset.z];
    const blade=offset.copy(edge).applyEuler(turn);
    const from=cycle?edges[cycle-1]:front;
    // On a side swing the edge can already be level with the bark in Z
    // while still well outside it in X. Open the mouth as steel reaches it.
    const gap=Math.hypot(tool[0]+blade.x-at[0],tool[1]+blade.y-at[1],tool[2]+blade.z-at[2]);
    const biteDepth=cycle+(within>=bite?1:hit>.35?clamp(1-gap/(from-at[2])):0);
    const settle=ease((within-bite+.035)/.105)*(1-releaseLast);
    const palm=grips?{normal:offset.set(.85,0,.527).applyEuler(turn).toArray(),
      curl:offset.set(0,.61*coil-.80*drive,.16*settle).applyEuler(turn).toArray(),
      pressure:.28+.24*coil+.63*drive}:null;
    const weightShift=[grips*(-.068*coil+.032*settle),grips*(-.026*coil+.070*settle)];
    return {time:t,hero,heading,feet,biteDepth,restHands,handWork:[grips,0],palms:[palm,null],weightShift,
      hands:[right,restHands[1]],phase:'chop',waistTurn,twist:angle(0,-.045,.07),
      focus:at,lean:(.035+.035*drive)*grips,lift:(.035*wind*(1-hit)-.067*drive)*grips,effort:(.16+.68*drive)*grips,
      tool,pitch,toolYaw,roll,bladeContact:drive,draw:grips,cutAt,at};
  }
  return {bearing,stem,footingError,fine,sample,duration,impactTimes,cutAt,landingY,front,edges};
}
// Register the real wrapped haft to the GLB palm and the steel to its
// cutting arc. On sloping ground the palm may land higher on the same haft.
const steel=new T.Vector3(0,.51,-.215),wrapped=new T.Vector3(.014,.064,.024);
const target=new T.Vector3(),fromPalm=new T.Vector3(),socket=new T.Vector3(),inTool=new T.Vector3();
const adjust=new T.Quaternion(),identity=new T.Quaternion();
export function poseFellingAxe(axe,f,hand){
  axe.rotation.set(f.pitch,f.toolYaw,f.roll,'YXZ');
  socket.copy(wrapped);
  // Through the backswing, carry the same point of the wrapping with the
  // palm. Only register the bevel to the surveyed cut as it approaches it.
  if(f.bladeContact>0){
    target.copy(steel).applyQuaternion(axe.quaternion).add(inTool.fromArray(f.tool));
    fromPalm.copy(target).sub(inTool.fromArray(hand));
    const span=fromPalm.length(),lateral=Math.hypot(steel.x-wrapped.x,steel.z-wrapped.z);
    const y=steel.y-Math.sqrt(Math.max(0,span*span-lateral*lateral));
    socket.y=mix(wrapped.y,Math.max(-.073,Math.min(.33,y)),f.bladeContact);
    inTool.copy(steel).sub(socket).applyQuaternion(axe.quaternion);
    adjust.setFromUnitVectors(inTool.normalize(),fromPalm.normalize());
    adjust.slerp(identity,1-f.bladeContact);
    axe.quaternion.premultiply(adjust);
  }
  axe.position.fromArray(hand).sub(inTool.copy(socket).applyQuaternion(axe.quaternion));
}
export function createExplorationFelling({scene,player,hero,commit,impact,done,canStand}){
  let run=null;
  function finish(){
    if(!run)return;
    const r=run;run=null;r.performer.dispose();r.group.removeFromParent();r.top.dispose();
    r.chips.dispose();r.axe.geometry.dispose();r.axe.material.dispose();
    r.travelBody.visible=r.wasVisible;
    if(r.result)done?.(r.result);
  }
  function start(tree){
    if(run || !tree)return false;
    const approach=fellingMotion(tree,player,canStand);
    const noFooting=()=>{done?.({ok:false,reason:'木のまわりに足を置けません。別の側から近づいてください。'});return false;};
    if(!Number.isFinite(approach.footingError))return noFooting();
    const top=fallingTimber(scene,tree,player,canStand,approach.bearing);
    const plan=fellingMotion(tree,player,canStand,top.beginCut(),approach.bearing,approach.fine);
    if(!Number.isFinite(plan.footingError)){top.dispose();return noFooting();}
    const group=new T.Group();group.name='探索中の木こり';
    group.position.set(plan.stem.x,plan.stem.y,plan.stem.z);group.rotation.y=plan.bearing;
    scene.add(group);group.updateMatrixWorld(true);
    const performer=createCookingPerformer(group,player),axe=handAxe();
    const chips=bladeChips(group,plan);group.add(axe);
    const actor=hero(),travelBody=player.mount?(actor.getObjectByName('mochi')??actor):actor;
    run={group,performer,axe,chips,top,plan,tree,time:0,next:0,travelBody,wasVisible:travelBody.visible,result:null};
    update(0);return true;
  }
  function update(dt){
    if(!run)return;
    const r=run;r.time+=Math.max(0,Math.min(.13,dt));
    const f=r.plan.sample(r.time),actual=r.performer.update(f);r.travelBody.visible=false;
    poseFellingAxe(r.axe,f,actual[0]);
    r.axe.visible=f.draw>.045;
    while(r.next<3 && r.time>=r.plan.impactTimes[r.next]){
      impact?.(r.next+1);r.next++;
    }
    if(!r.result)r.top.bite(f.biteDepth);
    r.chips.update(r.time,r.next);
    if(r.next===3 && !r.result)r.result=commit(r.tree);
    else if(r.result?.ok)r.top.update((r.time-r.plan.cutAt)/2.20);
    if(r.time>=r.plan.duration){
      if(!player.mount && !player.skiff)player.heading=r.plan.bearing+f.heading;
      if(r.plan.landingY!==null)Object.assign(player,{y:r.plan.landingY,grounded:true,h:0,vy:0});
      finish();
    }
  }
  return {start,update,close:finish,get active(){return !!run;},
    get cut(){return run?.plan.stem;},
    get bearing(){return run?.plan.bearing;},
    get atTrunk(){
      if(!run)return 0;
      return ease(run.time/.95)*(1-ease((run.time-run.plan.cutAt-.08)/1.55));
    }};

}
