import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from '../two/vendor/three.module.min.js';
import { BASIC_RECIPE, STARTER_RECIPES } from '../two/living-craft.js';
import { createCookingScore } from '../two/cooking-motion.js';

const riceWithEverything={...BASIC_RECIPE,finish:'grill',technique:'wrap',seasoning:'salt',seasoningAmount:2,
  fillings:[{id:'azuki',amount:20,placement:'inside'},{id:'herb',amount:12,placement:'mixed'},{id:'sakura',amount:4,placement:'top'}]};
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`expected ${a} to be within ${tol} of ${b}`);

test('each portion goes from the dough to its own well, with every requested treatment',()=>{
  for(const r of [BASIC_RECIPE,...STARTER_RECIPES.map(s=>s.draft),riceWithEverything]){
    const score=createCookingScore(r),last=score.sample(Infinity),ids=score.chapters.map(c=>c.id);
    for(const id of ['approach','steam','prep','transfer','pound','knead','shape','plate','finish'])assert.ok(ids.includes(id));
    for(const [phase,requested] of [['grill',r.finish==='grill'],['garnish',r.fillings.some(f=>f.placement==='top')],['wrap',r.technique==='wrap']])
      assert.equal(ids.includes(phase),requested);
    near(last.food.mortarRice+last.food.boardDough+last.food.paddleDough,0);
    const xyz=last.pieces.map(p=>p.position);
    for(const [i,p] of last.pieces.entries()){
      near(p.size,1);near(p.shape,1);assert.ok(p.visible);
      near(p.toast,Number(r.finish==='grill'));near(p.flip,r.finish==='grill'?2*Math.PI:0);
      near(p.wrap,Number(r.technique==='wrap'));near(p.fill,Number(r.fillings.some(f=>f.placement==='inside')));
      near(p.top,Number(r.fillings.some(f=>f.placement==='top')));
      near(p.position[1],.803);assert.ok(p.position[0]<-1.30);
      for(let j=0;j<i;j++)assert.ok(dist(xyz[i],xyz[j])>=.17);
    }
    if(r.finish==='grill'){
      const grill=score.chapters.find(c=>c.id==='grill');
      for(const p of score.sample(grill.end-.0001).pieces){assert.ok(Math.abs(p.position[0])<.30);near(p.position[1],.798);}
    }
    for(const ch of score.chapters){
      const t=ch.start+(ch.end-ch.start)*.64;
      const f=score.sample(t);
      score.sample(score.duration);assert.deepEqual(score.sample(t),f);
    }
    for(let t=0;t<=score.duration;t+=.109){
      const f=score.sample(t),food=f.food;
      near(food.bowlRice+food.steamerRice+food.clothRice+food.mortarRice+
        food.paddleDough+food.boardDough+f.pieces.reduce((sum,p)=>sum+p.size/4,0),1);
    }
  }
});

test('both grips remain attached to the turned mallet and the food compresses at every impact',()=>{
  for(const technique of ['none','half']){
    const score=createCookingScore({...BASIC_RECIPE,technique});
    const impacts=score.cues.filter(c=>c.name==='pound');
    assert.equal(impacts.length,technique==='half'?3:5);
    for(const {time} of impacts){
      for(let t=time-.68;t<=time+.13;t+=.015){
        const f=score.sample(t),m=f.tools.mallet,rotation=new Euler(...m.rotation);
        for(const [i,local] of [[.012,0,.49],[-.012,0,.24]].entries()){
          const predicted=new Vector3(...local).applyEuler(rotation).add(new Vector3(...m.position));
          near(dist(predicted.toArray(),f.hands[i]),0);
        }
      }
      const contact=score.sample(time);
      near(contact.food.compression,1);
      near(contact.tools.mallet.position[1],1.308);
      assert.ok(score.sample(time-.23).tools.mallet.position[1]>1.90);
    }
  }
});

test('hands, tools and feet move continuously and the walking stride has a planted foot',()=>{
  const floor=(x,z)=>.12+.04*x-.011*z;
  const score=createCookingScore(riceWithEverything,{floor},{start:[-.67,-2,1.35],heading:2.61});
  let previous=score.sample(0);
  for(let t=.008;t<=score.duration;t+=.008){
    const f=score.sample(t);
    const heights=f.feet.map(([x,y,z])=>y-floor(x,z));
    assert.ok(Math.min(...heights)>=-1e-9);
    near(Math.min(...heights),0);
    for(const [i,p] of f.hands.entries())assert.ok(dist(p,previous.hands[i])<.14,`hand popped at ${t}`);
    for(const [i,p] of f.feet.entries())assert.ok(dist(p,previous.feet[i])<.14,`foot popped at ${t}`);
    for(const [k,o] of Object.entries(f.tools))assert.ok(dist(o.position,previous.tools[k].position)<.14,`${k} popped at ${t}`);
    previous=f;
  }
});


test('the mallet clears the outside of the mortar as it descends to its rack and rises again',()=>{
  const score=createCookingScore(BASIC_RECIPE), tip=new Vector3(), rotation=new Euler();
  const {start}=score.chapters.find(ch=>ch.id==='transfer');
  const {end}=score.chapters.find(ch=>ch.id==='pound');
  for(let t=start;t<=end;t+=1/60) {
    const {position,rotation:angles}=score.sample(t).tools.mallet;
    if(position[0]>-1.15 || position[1]>1.31)continue;
    rotation.set(...angles);
    // The front end of the 67 cm handle comes closest to the wall of the
    // mortar. Include its thickness and the full radius of the raised rim.
    tip.set(0,-.013,.672).applyEuler(rotation);
    assert.ok(Math.hypot(tip.x+position[0]+.68,tip.z+position[2])>.365+.026);
  }
});
