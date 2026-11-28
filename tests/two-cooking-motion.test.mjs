import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from '../two/vendor/three.module.min.js';
import { BASIC_RECIPE, STARTER_RECIPES } from '../two/living-craft.js';
import { benchPoint, benchLocal, COOKING_BENCH, MALLET_HANDLE_END, MARKET_GRILL_TOP, MARKET_GRILL_X, MARKET_GRILL_Z } from '../two/living-layout.js';
import { createCookingScore, FORMING_POINT, SERVING_POINT } from '../two/cooking-motion.js';

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
    assert.deepEqual(p.position,benchPoint(SERVING_POINT));
    near(last.focus[0],p.position[0]);near(last.focus[2],p.position[2]);
    let previousSize=0, plated=false;
    for(let t=0;t<=score.duration;t+=1/30){
      const f=score.sample(t),food=f.food;
      near(food.bowlRice+food.steamerRice+food.clothRice+food.mortarRice+food.paddleDough+food.boardDough+f.piece.size,1);
      assert.ok(f.piece.size>=previousSize);
      previousSize=f.piece.size;
      const onTray=dist(f.piece.position,benchPoint(SERVING_POINT))<1e-6;
      if(plated)assert.ok(onTray,'the cook left the tray to repeat the serving movement');
      plated=onTray;
    }
    assert.ok(plated);
    if(r.finish==='grill'){
      const grill=score.chapters.find(c=>c.id==='grill');
      const turn=score.cues.find(c=>c.name==='sizzle');
      const flipped=score.sample(turn.time).piece;
      assert.deepEqual(flipped.position,benchPoint([MARKET_GRILL_X,MARKET_GRILL_TOP,MARKET_GRILL_Z]));
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
        const [cx,,cz]=f.tools.cloth.position,[mx,,mz]=score.cookware.mortar;
        if(Math.hypot(cx-mx,cz-mz)<.35 && f.food.gather>.99)near(f.food.clothRice+f.food.mortarRice,1);
      }
      if(f.food.mortarRice>.99) {
        if(t>=pound.start)near(dist(f.tools.cloth.position,score.cookware.bowlRest),.026);
      }
    }
    for(let t=knead.start;t<knead.end;t+=1/60) {
      const f=score.sample(t);
      if(f.food.mixed>0 && f.food.mortarRice>.999 && f.food.compression>.5){
        const [mx,,mz]=score.cookware.mortar,[x,,z]=f.tools.paddle.position;
        assert.ok(Math.hypot(x-mx,z-mz)<.25,'the paddle folds the dough inside the mortar');
      }
    }
  }
});

test('the cook turns to the fire once with cake and paddle, then takes the cake to its next work surface',()=>{
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
      if(!atFire && benchLocal(p)[0]>.92) {atFire=true;visits.push('fire');}
      if(atFire && benchLocal(p)[0]<.38) {atFire=false;visits.push('worktop');}
      // Midway between the forming board and fire, check both the blade
      // under the cake and the hand actually holding its rotated handle.
      const [u]=benchLocal(p);
      const pastSteamer=u>.25 && u<.86;
      const crossingToTray=f.phase==='plate' && u<-.24 && u>SERVING_POINT[0]+.17;
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
    assert.deepEqual(score.sample(Infinity).piece.position,benchPoint(SERVING_POINT));
  }
});

test('all cooks share a level worktop and approach its stations on the ground',()=>{
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const score=createCookingScore(riceWithEverything,{}, {mode,full}),frame=score.sample(Infinity);
    assert.deepEqual(frame.worktops,[FORMING_POINT,[MARKET_GRILL_X,MARKET_GRILL_TOP,MARKET_GRILL_Z],SERVING_POINT].map(benchPoint));
    assert.ok(FORMING_POINT[1]-COOKING_BENCH.top<.04);
    assert.ok(SERVING_POINT[1]-COOKING_BENCH.top<.04);
    for(let t=0;t<score.duration;t+=1/30){
      const f=score.sample(t);
      assert.ok(f.feet.every(foot=>foot[1]<.085),'unexpected step up on the level apron');
      near(Math.min(...f.feet.map(foot=>foot[1])),0);
    }
  }
});

test('every cook prepares, pounds, turns to the bench and serves from the same standing spot',()=>{
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    for(const draft of [BASIC_RECIPE,...STARTER_RECIPES.map(r=>r.draft)]){
      const score=createCookingScore(draft,{}, {mode,full});
      const pound=score.sample(score.cues.find(c=>c.name==='pound').time);
      const forming=score.sample(score.chapters.find(c=>c.id==='shape').end-.02);
      assert.ok(Math.abs(Math.atan2(Math.sin(pound.heading-forming.heading),Math.cos(pound.heading-forming.heading)))>1.25,
        'pounding and shaping use distinct sides of the cook');
      const arrival=score.chapters.find(c=>c.id==='approach').end;
      const origin=score.sample(arrival).hero;
      for(let sec=arrival;sec<score.duration;sec+=1/30){
        const f=score.sample(sec);
        near(f.hero[0],origin[0]);near(f.hero[2],origin[2]);
        const [from,to]=f.contact;
        if((from?.tool==='bowl' || from?.tool==='cloth') && from.tool===to?.tool){
          const [x,,z]=f.tools[from.tool].position;
          const lead=(x-origin[0])*Math.sin(f.heading)+(z-origin[2])*Math.cos(f.heading);
          assert.ok(lead>.70,'the cook carries the load around the outside of the turning belly');
        }
      }
      if(draft!==BASIC_RECIPE)continue;
      const first=score.sample(0),prep=score.chapters.find(c=>c.id==='prep');
      assert.deepEqual(first.tools.paddle,score.sample(prep.end).tools.paddle,
        'plain rice does not need a trip to collect a mixing paddle');
    }
  }
});

test('both palms lift the same shaft over the grounded mortar and strike the rice from a planted stance',()=>{
  for(const technique of ['none','half'])for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const score=createCookingScore({...BASIC_RECIPE,technique},{},{mode,full});
    const impacts=score.cues.filter(c=>c.name==='pound'),[x,y,z]=score.cookware.mortar;
    assert.equal(impacts.length,technique==='half'?3:5);
    for(const {time} of impacts){
      const contact=score.sample(time),raised=score.sample(time-.29);
      const point=(frame,local)=>new Vector3(...local).applyEuler(new Euler(...frame.tools.mallet.rotation))
        .add(new Vector3(...frame.tools.mallet.position));
      for(let t=time-.60;t<=time+.13;t+=.02){
        const f=score.sample(t);
        assert.deepEqual(f.handWork,[1,1]);
        assert.deepEqual(f.feet,contact.feet);
        near(f.heading,contact.heading);
        for(const [i,hold] of [f.contact[1],f.supportContact[1]].entries()){
          assert.equal(hold.tool,'mallet');
          near(dist(point(f,hold.offset).toArray(),f.hands[i]),0);
        }
        assert.ok(dist(...f.hands)>.29);
      }
      const impact=point(contact,[.165,0,0]);
      near(impact.x,x);near(impact.z,z);
      near(impact.y,y+.337+.129*(.67+.33*contact.food.smooth)*.52);
      assert.ok(point(raised,[.165,0,0]).y-impact.y>.32);
      assert.ok(raised.hands.every((p,i)=>p[1]>contact.hands[i][1]+.09));
      near(contact.food.compression,1);
    }
  }
});

test('both palms cup opposite sides of the rice bowl as its load shifts and open after plating',()=>{
  const score=createCookingScore(BASIC_RECIPE),steam=score.chapters.find(c=>c.id==='steam');
  let laden,tilted;
  for(let t=steam.start;t<steam.end;t+=.02){
    const f=score.sample(t);
    if(!f.handWork.every(w=>w===1) || !f.palms.every(Boolean))continue;
    if(f.food.bowlRice===1 && f.tools.bowl.position[1]>score.cookware.bowlRest[1]+.10 && f.tools.bowl.rotation[0]===0)laden=f;
    if(f.food.bowlRice<.11 && f.tools.bowl.rotation[0]>1.4)tilted=f;
  }
  assert.ok(laden && tilted);
  for(const f of [laden,tilted]){
    const across=new Vector3(1,0,0).applyEuler(new Euler(...f.tools.bowl.rotation));
    assert.ok(across.dot(new Vector3(...f.palms[0].normal))>.80);
    assert.ok(across.dot(new Vector3(...f.palms[1].normal))<-.80);
    near(dist(...f.hands),.308);
    assert.ok(across.dot(new Vector3(...f.palms[0].curl))>0 && across.dot(new Vector3(...f.palms[1].curl))<0);
  }
  assert.ok(laden.palms[0].pressure>tilted.palms[0].pressure+.20);
  assert.deepEqual(score.sample(Infinity).palms,[null,null]);
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
    const dx=f.hero[0]-previous.hero[0],dz=f.hero[2]-previous.hero[2],distance=Math.hypot(dx,dz);
    if(distance>.002){
      const facing=dx*Math.sin(f.heading)+dz*Math.cos(f.heading);
      assert.ok(facing/distance>.93,`cook travelled across its own footsteps in ${f.phase} at ${t}`);
      const [from,to]=f.contact;
      if(from?.tool && from.tool===to?.tool || from?.piece && to?.piece){
        const load=from.piece?f.piece.position:f.hands[0];
        const lead=(load[0]-f.hero[0])*Math.sin(f.heading)+(load[2]-f.hero[2])*Math.cos(f.heading);
        assert.ok(lead>.30,`load trailed the turned shoulders in ${f.phase} at ${t}`);
      }
    }
    for(const [i,p] of f.hands.entries())assert.ok(dist(p,previous.hands[i])<.14,`hand popped at ${t}`);
    for(const [i,p] of f.feet.entries())assert.ok(dist(p,previous.feet[i])<.14,`foot popped at ${t}`);
    assert.ok(dist(f.piece.position,previous.piece.position)<.14,`cake popped at ${t}`);
    for(const [k,o] of Object.entries(f.tools))assert.ok(dist(o.position,previous.tools[k].position)<.14,`${k} popped at ${t}`);
    previous=f;
  }
});


test('the mallet clears the outside of the mortar as it descends to its rack and rises again',()=>{
  const score=createCookingScore(BASIC_RECIPE), tip=new Vector3(), rotation=new Euler();
  const {start,end}=score.chapters.find(ch=>ch.id==='pound');
  const [mx,my,mz]=score.cookware.mortar;
  for(let t=start;t<=end;t+=1/90){
    const {position,rotation:angles}=score.sample(t).tools.mallet;
    rotation.set(...angles);
    // Sample the full working shaft along its path from the rack. Its
    // diameter clears the upper wooden rim whenever it crosses the bowl.
    for(let d=.12;d<MALLET_HANDLE_END;d+=.018){
      tip.set(0,-.013,d).applyEuler(rotation).add(new Vector3(...position));
      const r=Math.hypot(tip.x-mx,tip.z-mz);
      if(r>.291 && r<.366)assert.ok(tip.y-my>.566,'shaft through rim at '+t);
    }
  }
});
