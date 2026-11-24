import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, PerspectiveCamera } from '../two/vendor/three.module.min.js';
import { terrainContactHeight } from '../two/terrain.js';
import { timberTree } from '../two/living-build-land.js';
import { timberCut } from '../two/homestead-timber-section.js';
import { planSawing } from '../two/homestead-sawing.js';

const tree=timberTree('birch:39941:2333:9507');
function visitor() {
  const x=tree.x,z=tree.z+2;
  return {x,z,y:terrainContactHeight(x,z),grounded:true,heading:Math.PI};
}
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('real birch has a cuttable bole, dry walk-in and clear sightlines in landscape and portrait',()=>{
  const p=visitor(),cut=timberCut(tree);
  assert.ok(cut.radius>.20 && cut.radius<.55);
  assert.equal(cut.y,tree.ground+.42);
  for(const ratio of [16/9,390/844]) {
    const plan=planSawing(p,tree,ratio);
    assert.ok(plan);
    const cam=new PerspectiveCamera(41,ratio,.04,250);
    cam.position.copy(plan.lens.eye);cam.lookAt(plan.lens.focus);cam.updateMatrixWorld();
    let previous;
    for(let t=0;t<plan.duration;t+=1/60) {
      const f=plan.sample(t);
      for(const point of [...f.feet,...f.hands,[f.hero[0],f.hero[1]+1.49,f.hero[2]]]) {
        const pos=new Vector3(...point).project(cam);
        assert.ok(Math.abs(pos.x)<.97 && Math.abs(pos.y)<.95);
      }
      if(previous) {
        for(let i=0;i<2;i++) assert.ok(distance(previous.hands[i],f.hands[i])<.15);
        assert.ok(distance(previous.hero,f.hero)<.06);
      }
      previous=f;
    }
    const start=plan.sample(0), end=plan.sample(plan.duration);
    assert.deepEqual(start.hero,end.hero);
    assert.deepEqual(start.hands,end.hands);
    assert.deepEqual(start.feet,end.feet);
    assert.equal(start.heading,end.heading);
  }
  assert.equal(planSawing({...p,mount:'bike'},tree),null);
  assert.equal(planSawing({...p,x:p.x+10},tree),null);
  assert.equal(planSawing(p,tree,1,()=>false),null);
});

test('the five pulls stay in the same kerf; planted soles, grip offsets and the blade stay connected',()=>{
  const plan=planSawing(visitor(),tree,1.6);
  let stance=null,pulls=0,last=0,lower=Infinity,upper=-Infinity;
  for(let t=0;t<=plan.duration;t+=.006) {
    const f=plan.sample(t);
    if(f.progress<=0 || f.progress>=1)continue;
    stance ??= f.feet;
    assert.deepEqual(f.feet,stance);
    assert.ok(f.pitch<1e-6);
    assert.ok(Math.abs(f.tool[1]-.42)<1e-6);
    for (const [index,grip] of [.16,.39].entries()) {
      assert.ok(Math.abs(f.hands[index][2]-f.tool[2]-grip)<1e-6);
      assert.ok(Math.abs(f.hands[index][1]-f.tool[1]-.010)<1e-6);
    }
    // The heel never enters the tree. Even at the far end of a pull, the tip
    // projects through the bark on the opposite side and cannot jump the kerf.
    assert.ok(f.tool[2]>plan.cut.radius);
    assert.ok(f.tool[2]-plan.bladeLength < -plan.cut.radius);
    lower=Math.min(lower,f.tool[0]);upper=Math.max(upper,f.tool[0]);
    const beat=(f.tool[2]-plan.cut.radius-.09)/.30;
    if(beat>=.95 && last<.95)pulls++;
    last=beat;
  }
  assert.equal(pulls,5);
  assert.ok(lower < -plan.cut.radius && upper>plan.cut.radius);
});
