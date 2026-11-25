import * as T from './vendor/three.module.min.js';
import { timberCut } from './homestead-timber-section.js';
import { createCookingPerformer } from './cooking-performer.js';
import { groundHeight, canOccupy } from './terrain.js';
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
export function fellingMotion(tree,player,canStand=()=>true,mouth){
  const cut=timberCut(tree),stem=tree.stem??cut;
  const bearing=Math.atan2(player.x-stem.x,player.z-stem.z),c=Math.cos(bearing),s=Math.sin(bearing);
  const giant=player.buffs?.full>0?1.28:1,dist=Math.hypot(player.x-stem.x,player.z-stem.z);
  const start=[0,dist],initial=player.heading-bearing,reference=player.y;
  const world=(u,v)=>[stem.x+u*c+v*s,stem.z-u*s+v*c];
  const floor=(u,v)=>groundHeight(...world(u,v),reference)-stem.y;
  const desired=[.19*giant,stem.radius+1.49*giant];
  const saddle=player.mount==='bike'?.90:player.mount==='turtle'?1.04:0;
  const ground=groundHeight(player.x,player.z,reference);
  // Keep the shell, pedals, deck or waterline under the traveller. A low
  // jumper can settle onto the ground during the approach.
  const fixed=Boolean(saddle || player.skiff || player.inWater || (!player.grounded && reference-ground>1.6));
  const landingY=!fixed && !player.grounded?ground:null;
  let stance=start;
  for(let i=1;!fixed && i<=12;i++){
    const q=blend(start,desired,i/12),[x,z]=world(...q),y=groundHeight(x,z,reference);
    if(Math.abs(y-reference)>.34 || !canOccupy(x,z,y+.024,.34*giant,1.53*giant) ||
       !canStand(x,z,y+.024,.34*giant,1.53*giant))break;
    stance=q;
  }
  const stride=Math.hypot(stance[0],stance[1]-dist);
  const approach=.54+stride/.98,beat=.99,bite=.68,cutAt=approach+2*beat+bite;
  const impactTimes=[0,1,2].map(i=>approach+i*beat+bite),duration=cutAt+2.55;
  const toolYaw=.20;
  function onHandle(pos,pitch,u,y,v){
    const h=y*Math.cos(pitch)-v*Math.sin(pitch),d=y*Math.sin(pitch)+v*Math.cos(pitch);
    return [pos[0]+u*Math.cos(toolYaw)+d*Math.sin(toolYaw),pos[1]+h,pos[2]-u*Math.sin(toolYaw)+d*Math.cos(toolYaw)];
  }
  const bitePitch=-1.31,contact=onHandle([0,0,0],bitePitch,0,.51,-.215);
  const front=mouth?.front??stem.radius,edges=mouth?.edges??axeEdges(front,-stem.radius);
  const targets=edges.map(z=>[0,.006,z]);
  function sample(time){
    const t=Math.max(0,Math.min(duration,time));
    const fit=ease(t/approach),retreat=ease((t-cutAt-.48)/1.06);
    const walk=fit*(1-retreat),[u,v]=blend(start,stance,walk);
    const heading=arc(initial,pi,fit);
    const feet=[-1,1].map((side,i)=>{
      const cycles=Math.max(1,Math.ceil(stride/.48)),a=walk*cycles,step=Math.min(cycles-1,Math.floor(a));
      const leg=clamp((a-step)*2-i),f=(step+ease(leg))/cycles;
      const [x,z]=blend(start,stance,f),q=arc(initial,pi,fit);
      const heel=side*.29*giant,tip=(.08+.045*side)*giant;
      const fx=x+heel*Math.cos(q)+tip*Math.sin(q),fz=z-heel*Math.sin(q)+tip*Math.cos(q);
      const y=fixed?reference-stem.y+(player.mount==='bike'?.59:saddle):mix(reference-stem.y,floor(fx,fz),Math.min(1,fit*3));
      return [fx,y+.10*Math.sin(pi*leg)*Math.min(1,stride/.21),fz];
    });
    const hy=fixed?reference-stem.y+saddle:(feet[0][1]+feet[1][1])/2,hero=[u,hy,v];
    const phase=Math.max(0,(t-approach)),cycle=Math.min(2,Math.floor(phase/beat)),within=Math.min(beat,phase-cycle*beat);
    const at=targets[cycle],working=at.map((n,i)=>n-contact[i]);
    const raised=[u-.46*giant,hy+1.27*giant,v-.46*giant];
    const ready=[u-.48*giant,hy+.78*giant,v-.64*giant];
    const wind=ease(within/.33),hit=ease((within-.35)/(bite-.35)),release=ease((within-bite-.065)/(beat-bite-.065));
    // First two recoveries start the next upswing from the same ready grip.
    const releaseLast=cycle===2?ease((t-cutAt-.10)/.48):release;
    const swing=blend(blend(blend(ready,raised,wind),working,hit),ready,releaseLast);
    const swingPitch=mix(mix(mix(-.18,.40,wind),bitePitch,hit),-.18,releaseLast);
    const take=ease((t-.14)/.32),sheathe=ease((t-cutAt-.53)/.48),grips=take*(1-sheathe);
    const tool=blend([u-.13*giant,hy+.36*giant,v+.12*giant],swing,grips),pitch=mix(.63,swingPitch,grips);
    const right=onHandle(tool,pitch,.024,.095,.012),left=onHandle(tool,pitch,-.025,.235,.008);
    const idle=side=>[u+side*.76*giant*Math.cos(heading)+.42*giant*Math.sin(heading),hy+.67*giant,v-side*.76*giant*Math.sin(heading)+.42*giant*Math.cos(heading)];
    const blade=onHandle(tool,pitch,0,.51,-.215);
    const from=cycle?edges[cycle-1]:front;
    const biteDepth=cycle+(within>=bite?1:hit>.35?clamp((from-blade[2])/(from-at[2])):0);
    const restHands=[idle(-1),idle(1)];
    return {time:t,hero,heading,feet,biteDepth,restHands,handWork:[grips,grips],
      hands:[blend(restHands[0],right,grips),blend(restHands[1],left,grips)],phase:'chop',
      focus:at,lean:(.09+.14*hit*(1-releaseLast))*grips,lift:-.11*hit*(1-releaseLast)*grips,effort:(.21+.62*hit)*(1-releaseLast)*grips,
      tool,pitch,toolYaw,draw:grips,cutAt,at};
  }
  return {bearing,stem,sample,duration,impactTimes,cutAt,landingY,front,edges};
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
    const top=fallingTimber(scene,tree,player,canStand);
    const plan=fellingMotion(tree,player,canStand,top.beginCut());
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
    const f=r.plan.sample(r.time);r.performer.update(f);r.travelBody.visible=false;
    r.axe.rotation.set(f.pitch,f.toolYaw,0,'YXZ');r.axe.position.fromArray(f.tool);
    r.axe.visible=f.draw>.045;
    while(r.next<3 && r.time>=r.plan.impactTimes[r.next]){
      impact?.(r.next+1);r.next++;
    }
    if(!r.result)r.top.bite(f.biteDepth);
    r.chips.update(r.time,r.next);
    if(r.next===3 && !r.result)r.result=commit(r.tree);
    else if(r.result?.ok)r.top.update((r.time-r.plan.cutAt)/2.20);
    if(r.time>=r.plan.duration){
      if(!player.mount && !player.skiff)player.heading=Math.atan2(-Math.sin(r.plan.bearing),-Math.cos(r.plan.bearing));
      if(r.plan.landingY!==null)Object.assign(player,{y:r.plan.landingY,grounded:true,h:0,vy:0});
      finish();
    }
  }
  return {start,update,close:finish,get active(){return !!run;},
    get cut(){return run?.plan.stem;},
    get atTrunk(){
      if(!run)return 0;
      return ease(run.time/.95)*(1-ease((run.time-run.plan.cutAt-.08)/1.55));
    }};

}
