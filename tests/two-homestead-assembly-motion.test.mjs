import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler,Vector3 } from '../two/vendor/three.module.min.js';
import { terrainContactHeight } from '../two/terrain.js';
import { assemblyParts } from '../two/homestead-assembly-parts.js';
import { planAssembly } from '../two/homestead-assembly-motion.js';

const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function job(kind,yaw=0,size=1){
  const site={x:28,z:96,y:terrainContactHeight(28,96)+.03,yaw,kind,terrain:'plain'};
  const player={x:28,z:99.7,y:terrainContactHeight(28,99.7),grounded:true,heading:Math.PI,buffs:{full:size>1?60:0}};
  const parts=assemblyParts(kind,site.terrain);
  return {site,player,parts,plan:planAssembly(player,site,parts)};
}

test('every build kit accepts a fieldwork route with a grounded exit, raised joinery has a stepped work stand',()=>{
  for(const kind of ['stand','camp','floor','posts','wall','roof','fence','chest','hut']){
    const {site,player,parts,plan}=job(kind,kind==='posts'?Math.PI/4:0,kind==='chest'?1.28:1);
    assert.ok(plan,kind);
    assert.equal(plan.staging.length,parts.length);
    const first=plan.sample(0),last=plan.sample(plan.duration);
    assert.ok(Math.abs(first.hero[1]+site.y-player.y)<.035);
    assert.equal(last.installedCount,parts.length);
    assert.ok(Math.abs(plan.endPose.y-terrainContactHeight(plan.endPose.x,plan.endPose.z))<.055);
    assert.ok(Number.isFinite(plan.endPose.heading));
    if(['roof','hut','posts'].includes(kind))assert.ok(plan.platforms.some(b=>b.count>1 && b.height>.55));
    for(const action of plan.actions.slice(1)){
      const a=plan.sample(action.start-.00001),b=plan.sample(action.start+.00001);
      for(const [l,r] of [[a.hero,b.hero],...a.feet.map((v,i)=>[v,b.feet[i]]),...a.hands.map((v,i)=>[v,b.hands[i]])])
        assert.ok(distance(l,r)<.045,kind+' '+action.index+' '+action.type+' '+distance(l,r));
    }
  }
});

test('during loaded travel both hands stay at the authored contacts and a wooden mallet meets its joint firmly',()=>{
  const {plan,parts,player,site}=job('stand');
  for(const action of plan.actions.filter(s=>s.type==='carry')){
    const part=parts[action.index];
    for(let i=0;i<=40;i++){
      const f=plan.sample(action.start+(action.end-action.start)*i/40);
      const rotation=new Euler(...f.rotation,'XYZ');
      for(let j=0;j<2;j++){
        const hand=new Vector3().fromArray(part.handholds[j]).sub(new Vector3(...part.grip)).applyEuler(rotation)
          .add(new Vector3(...part.grip)).add(new Vector3(...f.offset));
        assert.ok(distance(hand.toArray(),f.hands[j])<.001);
      }
    }
  }
  let strikes=0;
  for(const action of plan.actions.filter(s=>s.type==='fasten')){
    const f=plan.sample(action.start+(action.end-action.start)*.65);
    if(f.cue!=='knock')continue;
    const head=new Vector3(0,-.066,0).applyEuler(new Euler(...f.mallet.rotation,'YXZ')).add(new Vector3(...f.mallet.position));
    assert.ok(distance(head.toArray(),parts[f.index].grip)<.002);strikes++;
  }
  assert.ok(strikes>0);
  assert.equal(planAssembly({...player,mount:'bike'},site,parts),null);
  assert.equal(planAssembly(player,site,parts,()=>false),null);
});
