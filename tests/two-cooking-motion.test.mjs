import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from '../two/vendor/three.module.min.js';
import { BASIC_RECIPE, STARTER_RECIPES } from '../two/living-craft.js';
import { createCookingScore, SERVING_POINT } from '../two/cooking-motion.js';

const riceWithEverything={...BASIC_RECIPE,finish:'grill',technique:'wrap',seasoning:'salt',seasoningAmount:2,
  fillings:[{id:'azuki',amount:20,placement:'inside'},{id:'herb',amount:12,placement:'mixed'},{id:'sakura',amount:4,placement:'top'}]};
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`expected ${a} to be within ${tol} of ${b}`);

test('one cake is shaped and plated once with every treatment selected by the recipe',()=>{
  for(const r of [BASIC_RECIPE,...STARTER_RECIPES.map(s=>s.draft),riceWithEverything]){
    const score=createCookingScore(r),last=score.sample(Infinity),ids=score.chapters.map(c=>c.id);
    for(const id of ['approach','steam','prep','transfer','pound','knead','shape','plate','finish'])assert.ok(ids.includes(id));
    for(const [phase,requested] of [['grill',r.finish==='grill'],['garnish',r.fillings.some(f=>f.placement==='top')],['wrap',r.technique==='wrap']])
      assert.equal(ids.includes(phase),requested);
    assert.equal(score.cues.filter(c=>c.name==='plate').length,1);
    assert.equal(score.cues.filter(c=>c.name==='sizzle').length,Number(r.finish==='grill'));
    assert.equal(score.sample(0).piece.visible,false);
    const p=last.piece;
    near(p.size,1);near(p.shape,1);assert.ok(p.visible);
    near(p.toast,Number(r.finish==='grill'));near(p.flip,r.finish==='grill'?2*Math.PI:0);
    near(p.wrap,Number(r.technique==='wrap'));near(p.fill,Number(r.fillings.some(f=>f.placement==='inside')));
    near(p.top,Number(r.fillings.some(f=>f.placement==='top')));
    assert.deepEqual(p.position,SERVING_POINT);
    near(last.focus[0],p.position[0]);near(last.focus[2],p.position[2]);
    let previousSize=0, plated=false;
    for(let t=0;t<=score.duration;t+=1/30){
      const f=score.sample(t),food=f.food;
      near(food.bowlRice+food.steamerRice+food.clothRice+food.mortarRice+food.paddleDough+food.boardDough+f.piece.size,1);
      assert.ok(f.piece.size>=previousSize);
      previousSize=f.piece.size;
      const onTray=dist(f.piece.position,SERVING_POINT)<1e-6;
      if(plated)assert.ok(onTray,'the cook left the tray to repeat the serving movement');
      plated=onTray;
    }
    assert.ok(plated);
    if(r.finish==='grill'){
      const grill=score.chapters.find(c=>c.id==='grill');
      const turn=score.cues.find(c=>c.name==='sizzle');
      const flipped=score.sample(turn.time).piece;
      assert.deepEqual(flipped.position,[1.36,.949,0]);
      near(flipped.flip,Math.PI);assert.ok(flipped.toast>0 && flipped.toast<1);
      near(score.sample(grill.end-.001).piece.toast,1);
    }
    for(const ch of score.chapters){
      const t=ch.start+(ch.end-ch.start)*.64;
      const f=score.sample(t);
      score.sample(score.duration);assert.deepEqual(score.sample(t),f);
    }
  }
});

test('the cook brings the rice to the mortar once and readies the mallet and paddle within reach',()=>{
  for(const recipe of [BASIC_RECIPE, ...STARTER_RECIPES.map(r=>r.draft)]) {
    const score=createCookingScore(recipe), initial=score.sample(0);
    const transfer=score.chapters.find(c=>c.id==='transfer');
    const pound=score.chapters.find(c=>c.id==='pound');
    const knead=score.chapters.find(c=>c.id==='knead');
    for(let t=transfer.start;t<pound.end;t+=1/60) {
      const f=score.sample(t);
      if(t<pound.start) {
        assert.deepEqual(f.tools.mallet,initial.tools.mallet,'the rice can reach the empty mortar without moving the mallet');
        if(f.hero[0]<-.28)near(f.food.clothRice+f.food.mortarRice,1);
      }
      if(f.food.mortarRice>.99) {
        assert.ok(f.hero[0]<.05,'the cook returns to the steamer after emptying the rice');
        if(t>=pound.start)assert.ok(f.tools.cloth.position[0]<0,'the empty cloth stayed on the steamer side');
      }
    }
    if(recipe.seasoning==='none' && !recipe.fillings.some(f=>f.placement==='mixed')) {
      for(let t=knead.start;t<knead.end;t+=1/60) {
        const f=score.sample(t);
        if(f.food.mortarRice>.999)assert.ok(f.hero[0]<-.25,'the cook left the mortar just to fetch the paddle');
      }
    }
  }
});

test('the cook approaches the fire once with cake and paddle, then takes the cake to its next work surface',()=>{
  const plain={...BASIC_RECIPE,finish:'grill'};
  const garnish={...plain,fillings:[{id:'sakura',placement:'top',amount:4}]};
  for(const recipe of [plain,garnish,{...plain,technique:'wrap'},STARTER_RECIPES.find(r=>r.regionId==='market').draft]) {
    const score=createCookingScore(recipe),grill=score.chapters.find(c=>c.id==='grill');
    const board=score.sample(grill.start).piece.position;
    const needsBoard=recipe.technique==='wrap'||recipe.fillings.some(f=>f.placement==='top');
    const visits=[];
    let atFire=false;
    for(let t=grill.start;t<score.duration;t+=1/60) {
      const f=score.sample(t),p=f.piece.position,paddle=f.tools.paddle;
      if(!atFire && f.hero[0]>.80) {atFire=true;visits.push('fire');}
      if(atFire && f.hero[0]<.38) {atFire=false;visits.push('worktop');}
      // Midway between the forming board and fire, check both the blade
      // under the cake and the hand actually holding its rotated handle.
      const pastSteamer=p[0]>.25 && p[0]<.95;
      const crossingToTray=f.phase==='plate' && p[0]<-.24 && p[0]>-1.17;
      if(pastSteamer || crossingToTray) {
        const angles=new Euler(...paddle.rotation), origin=new Vector3(...paddle.position);
        const grip=new Vector3(0,.01,.18).applyEuler(angles).add(origin);
        near(dist(f.hands[0],grip.toArray()),0);
        const blade=new Vector3(0,.016,0).applyEuler(angles).add(origin);
        assert.ok(dist(p,blade.toArray())<.025,'the transported cake has slipped off or lifted clear of the blade');
      }
      if(needsBoard && (f.phase==='garnish'||f.phase==='wrap')) {
        near(dist(p,board),0);
      } else if(!needsBoard && f.piece.toast===1) {
        assert.ok(dist(p,board)>.12,'plain grilled cake was set back on the forming board on its way to the tray');
      }
    }
    assert.deepEqual(visits,['fire','worktop']);
    assert.deepEqual(score.sample(Infinity).piece.position,SERVING_POINT);
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
    assert.ok(dist(f.piece.position,previous.piece.position)<.14,`cake popped at ${t}`);
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
