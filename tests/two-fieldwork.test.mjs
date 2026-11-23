import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { shortRoute, visitorMark, conversationView, bodySightline, worktopMark, workshopDetour } from '../two/mochiyori-blocking.js';
import { fieldCast, courier } from '../two/mochiyori-field-cast.js';
import { performedScenes } from '../two/mochiyori-scenes.js';
import { createStoryStillLife, createStoryEvidence } from '../two/story-crafts.js';
import { createFieldwork } from '../two/mochiyori-fieldwork.js';
import { connectStoryHands, storyGrip } from '../two/story-hands.js';
import { CHAPTERS, CAST } from '../two/mochiyori-story.js';
import { STORY_SITES } from '../two/story-sites.js';
import { createStoryWorld, locationFor, peopleAt } from '../two/mochiyori-world.js';

// A real worker may walk around either end of the counter before an authored
// beat begins. Advance the same clock as the game and wait for that event.
function until(work,time,finished){
  for(let i=0;i<1800 && !finished();i++){time+=1/30;work.update(time);}
  assert.ok(finished(),'the resident completes the requested movement');
  return time;
}

test('a clear camera arm still looks around the courier to see the parcel at the end of the table',()=>{
  const middle=new Vector3(0,.85,0),paper=new Vector3(1,.78,.3);
  const courier=new Vector3(.50,.9,1.80);
  const sight=angle=>bodySightline(new Vector3(4*Math.sin(angle),1.45,4*Math.cos(angle)),paper,courier,.85,.9);
  assert.equal(sight(0),0);
  const heading=conversationView(middle,0,courier,()=>false,4,.45,0,()=>1,sight);
  assert.equal(sight(heading),1);
  const behind=paper.clone().add(new Vector3(0,0,-3));
  assert.equal(bodySightline(new Vector3(0,1.45,4),paper,behind,.85,.9),1);
});

test('every participant has one place in the world, including the tea stop and the two hearings', () => {
  for (let index=0;index<=CHAPTERS.length;index++) for (const ready of [false,true]) {
    const ch=CHAPTERS[index],book={index,current:()=>ch,ready:()=>!!ch && ready};
    const all=STORY_SITES.flatMap(s=>peopleAt(locationFor(s.region,s.place),book));
    assert.equal(new Set(all.map(s=>s.id)).size,all.length);
    assert.ok(CAST.every(p=>all.includes(p)));
    assert.ok(peopleAt(locationFor('peach','road-tea'),book).some(p=>p.id==='road-tea-host'));
    if (ready && ['mystery_06','mystery_07'].includes(ch?.id)){
      const names=peopleAt(locationFor('kyo','court'),book).map(p=>p.name);
      for (const name of ['お澄','八重','宗伯','勘兵衛','すずり'])assert.ok(names.includes(name));
    }
  }
});

test('on-site demonstrations always have a present witness for each role and each handoff', () => {
  for (const [index,chapter] of CHAPTERS.entries()) {
    const entries=[
      ...chapter.clues.map(c=>['clue/'+c.id,false]),
      ...chapter.proofs.map((_,i)=>['proof/'+chapter.id+'/'+i,true]),
      ['end/'+chapter.id,true]
    ];
    for(const [key,ready] of entries) {
      const score=performedScenes.get(key),site=locationFor(score.site.region,score.site.place);
      const present=peopleAt(site,{index,current:()=>chapter,ready:()=>ready}).map(p=>p.name);
      const roles=fieldCast(score);
      for(const b of score.beats) {
        assert.ok(roles[b.actor]===courier || present.includes(roles[b.actor]),key+' '+roles[b.actor]);
        if (b.partner==null)continue;
        assert.ok(roles[b.partner]===courier || present.includes(roles[b.partner]),key+' '+roles[b.partner]);
        if(b.gesture==='pass')assert.notEqual(roles[b.actor],roles[b.partner],key);
      }
    }
  }
});

test('the same articulated resident lifts and turns only the joined cake, in real time', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Group(),actor=new Group(),right=new Group(),left=new Group();
  scene.add(actor);actor.position.set(22,7,-105);actor.rotation.y=.52;
  right.position.set(.17,1,0);left.position.set(-.17,1,0);actor.add(right,left);
  connectStoryHands(actor,'frog',{arm1:right,'arm-1':left});
  const speaker={actor,person:{id:'character_01_02',name:'おはな',species:'蛙'},site:{key:'river/'}};
  const work=createFieldwork(scene);
  work.update(100);
  const span=work.start('clue/joined-cake',speaker,[speaker]);
  let time=until(work,100,()=>!!work.gesture);
  const cake=scene.getObjectByName('合わせ餅'),basket=scene.getObjectByName('花筏餅');
  assert.ok(span>0 && cake && basket);
  const position=node=>node.getWorldPosition(new Vector3());
  const rest=position(cake),other=position(basket),fingers=position(storyGrip(actor));
  for(let i=0;i<26;i++){time+=.1;work.update(time);}
  const rising=position(cake);
  assert.ok(rising.y>rest.y+.06);
  assert.ok(position(storyGrip(actor)).distanceTo(fingers)>.01);
  assert.ok(position(basket).distanceTo(other)<1e-6);
  time=until(work,time,()=>!work.playing);
  const underside=cake.localToWorld(new Vector3(0,-1,0)).sub(position(cake));
  assert.ok(underside.y>0);
  assert.ok(work.focus.distanceTo(position(cake))<.15);

  assert.equal(work.playing,false);
  assert.ok(scene.getObjectByName('合わせ餅'), 'the revealed underside can still be inspected');
  work.stop();
  const returning=position(cake);time+=.1;work.update(time);
  assert.ok(position(cake).distanceTo(returning)<.55,'the cook puts the cake away without a cut');
  time=until(work,time,()=>!work.tidyingSite);assert.equal(work.focus,null);
  // An exhibit in a distant, unrelated workshop remains in place.
  const counter=createStoryStillLife(1);
  counter.position.set(10,7,-102);scene.add(counter);
  const basketOnCounter=counter.children.find(o=>o.userData.storyEvidence==='basket');
  for(let i=0;i<2;i++){
    assert.ok(work.start('clue/joined-cake',speaker,[speaker],counter)>0);
    assert.equal(basketOnCounter.visible,true);assert.equal(basketOnCounter.parent,counter);
    work.stop();assert.equal(basketOnCounter.visible,true);time=until(work,time,()=>!work.tidyingSite);assert.equal(work.focus,null);
  }
});

test('a short approach skirts a post, rejects a drop and leaves room for the courier to turn', () => {
  const from={x:0,y:2,z:0},to={x:0,y:2,z:2};
  const footing=(x,z)=>Math.hypot(x,z-1)<.27?NaN:2;
  const route=shortRoute(from,to,footing);
  assert.equal(route.length,2);
  assert.ok(Math.abs(route[0].x)>.4);
  assert.equal(shortRoute(from,to,(_x,z)=>z>.45?0:2),null);
  const mark=visitorMark(from,{x:0,y:2,z:1},0,.5,()=>2,(x,z)=>z>2.8 && Math.abs(x)<.8?2:NaN);
  assert.ok(mark.to.z>2.8);
  const target={x:0,y:.9,z:0},courier={x:1,z:1};
  const angle=conversationView(target,0,courier,(x,y,z)=>x<0 && z>.25,3,.52);
  assert.ok(Math.sin(angle)>=0,'the camera stays on the clear side');
  const arrival=-.86;
  assert.equal(conversationView(target,0,courier,()=>false,3,.43,arrival),arrival,
    'a clear approach keeps the same screen direction');
  assert.ok(Math.sin(conversationView(target,0,courier,(x,y,z)=>x<0 && z>.25,3,.43,arrival))>=0,
    'a wall across the approach selects a clear side before the first line');
  const openSide=a=>Math.sin(a)>0?1:.25;
  const constrained=conversationView(target,0,courier,()=>false,3,.43,arrival,openSide);
  assert.equal(openSide(constrained),1,'the full camera arm clears a wall behind the counter');
});

test('a nearby receiving mark can be reached before surveying the far side of the workshop',()=>{
  const start={x:0,y:0,z:0};
  const open=(x,z)=>x<.85 || x>1.5 || z>.9;
  let probes=0;
  const routeTo=workshopDetour(start,(x,z)=>{probes++;return open(x,z)?0:NaN;});
  assert.deepEqual(routeTo({x:0,y:0,z:.34}).at(-1),{x:0,y:0,z:.34});
  assert.ok(probes<100);
  const far={x:2.4,y:0,z:.1},route=routeTo(far);
  assert.deepEqual(route.at(-1),far);
  let last=start;
  for(const stop of route){
    for(let step=0;step<=25;step++){
      const t=step/25;
      assert.ok(open(last.x+(stop.x-last.x)*t,last.z+(stop.z-last.z)*t));
    }
    last=stop;
  }
});

test('the visitor approaches with their near mitt and stays on the same floor',()=>{
  const visitor={x:2,y:1,z:1,heading:.5},edge={x:0,y:1.82,z:0},palm={x:-.55,y:.70,z:.54};
  const clear=(x,z)=>x>.58 && z>-.5?1:NaN;
  const mark=worktopMark(visitor,edge,palm,clear,clear);
  assert.ok(mark);
  const feet=mark.route.at(-1),c=Math.cos(mark.yaw),sn=Math.sin(mark.yaw);
  assert.ok(feet.x>.58);
  assert.ok(Math.hypot(feet.x+c*palm.x+sn*palm.z-edge.x,feet.y+palm.y-edge.y,feet.z-sn*palm.x+c*palm.z-edge.z)<.47);
  assert.equal(worktopMark(visitor,{...edge,y:4},palm,clear,clear),null);
});

test('a tasting leaves the plate on the worktop and takes the same pastry to the lip', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Group(),actor=new Group(),right=new Group(),left=new Group(),hero=new Group();
  scene.add(actor,hero);hero.position.set(1.2,0,1.1);hero.rotation.y=-1.9;
  right.position.set(.17,1,0);left.position.set(-.17,1,0);actor.add(right,left);
  connectStoryHands(actor,'frog',{arm1:right,'arm-1':left});
  const palm=new Group(),mouth=new Group();palm.name='配達人の受け手';mouth.name='配達人の口元';
  palm.position.set(-.7,.62,.36);mouth.position.set(0,.83,.76);hero.add(palm,mouth);
  const who={actor,person:{name:'おはな',species:'蛙'},site:{key:'river/',number:1}};
  const work=createFieldwork(scene);work.update(0);
  const score=performedScenes.get('food/river'),span=work.start(score.key,who,[who],null,hero);
  let time=until(work,0,()=>!!work.gesture);
  const root=scene.getObjectByName(score.title),pastry=root.getObjectByName('取り分ける餅');
  const plate=root.getObjectByName('花筏餅').children[0];
  const leaf=root.getObjectByName('桜餅に敷いた舟形の葉');
  const stationary=plate.getWorldPosition(new Vector3()),leafRest=leaf.getWorldPosition(new Vector3());
  time=until(work,time,()=>work.gesture==='pass');
  const hand=storyGrip(actor),bounds=new Box3(),point=new Vector3();
  let prior=pastry.getWorldPosition(new Vector3()),moving=0,together=0;
  while(work.gesture==='pass' && moving<1000){
    time+=1/60;work.update(time);
    if(work.gesture!=='pass')break;
    const here=pastry.getWorldPosition(new Vector3());
    const stride=here.distanceTo(prior);prior=here;
    assert.ok(stride<.07,'the serving cannot cross the counter in one frame');
    bounds.setFromObject(pastry);
    const giver=bounds.distanceToPoint(hand.getWorldPosition(point)),taker=bounds.distanceToPoint(palm.getWorldPosition(point));
    if(giver<.035 && taker<.035)together++;
    if(stride>.0001)moving++;
    assert.ok(time<140,'the serving reaches its guest');
  }
  assert.ok(moving>10);
  assert.ok(together>=3,'both paws steady the same serving before the guest takes its weight');
  time=until(work,time,()=>!work.playing);
  assert.equal(work.playing,false);
  assert.ok(plate.getWorldPosition(new Vector3()).distanceTo(stationary)<1e-6);
  assert.ok(leaf.getWorldPosition(new Vector3()).distanceTo(leafRest)<1e-6,'the serving leaf returns to the dish');
  assert.equal(leaf.parent.visible,true);
  assert.ok(work.focus.distanceTo(mouth.getWorldPosition(new Vector3()))<.40);
  assert.equal(pastry.parent.visible,false,'the bite disappears only at the mouth');
  assert.ok(hero.userData.storyReach.taste);
  work.stop();
  assert.equal(hero.userData.storyReach,undefined);
});

test('real leaf and basket keep their identity from countertop to hand, through a line and an interrupted return', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Group(),actor=new Group(),right=new Group(),left=new Group();
  scene.add(actor);actor.add(right,left);right.position.set(.17,1,.05);left.position.set(-.17,1,.05);
  connectStoryHands(actor,'frog',{arm1:right,'arm-1':left});
  const table=createStoryStillLife(1),leaf=createStoryEvidence('basket','ferry-leaf');
  leaf.userData.parcelId='ferry-leaf';leaf.position.set(.63,table.userData.worktop,.39);
  scene.add(table);table.add(leaf);
  const speaker={actor,person:{name:'おはな',species:'蛙'},site:{key:'river/',number:1}};
  const basket=table.children.find(o=>o.userData.storyEvidence==='basket'),stationary=table.children[2];
  const position=node=>node.getWorldPosition(new Vector3());
  const start=position(leaf),rack=position(stationary),origin=position(basket);
  let returns=0;
  const work=createFieldwork(scene,{
    parcelFor:(_key,spec)=>spec.variant==='ferry-leaf' && 'ferry-leaf',
    parcelObject:()=>leaf,claimParcel(){},releaseParcel(_id,model){
      assert.equal(model,leaf);scene.attach(model);returns++;return true;
    }
  });
  work.update(0);
  const key='clue/leaf-marks',span=work.start(key,speaker,[speaker],table);
  assert.ok(position(leaf).distanceTo(start)<1e-7);
  work.update(.04);assert.ok(position(leaf).distanceTo(start)<.06,JSON.stringify({before:start.toArray(),after:position(leaf).toArray()}));
  let count=0;scene.traverse(o=>{if(o.userData.parcelId==='ferry-leaf')count++;});assert.equal(count,1);
  for(let time=.08;time<span+.3;time+=.04)work.update(time);
  assert.equal(work.playing,false);work.pause();
  assert.ok(position(stationary).distanceTo(rack)<1e-6);
  const last=position(leaf),lastBasket=position(basket);
  work.update(span+1.3);assert.ok(position(leaf).distanceTo(last)<1e-6);
  work.stop();assert.equal(returns,1);assert.ok(position(leaf).distanceTo(last)<1e-6);
  assert.ok(position(basket).distanceTo(lastBasket)<1e-6,'closing a dialogue does not teleport the permanent basket');
  work.update(span+1.4);const interrupted=position(basket);
  work.start('clue/joined-cake',speaker,[speaker],table);
  assert.ok(position(basket).distanceTo(interrupted)<1e-6);
  work.clear();assert.equal(basket.parent,table);assert.ok(position(basket).distanceTo(origin)<1e-6);
});


test('a conclusion entered from the same conversation brings the summoned witness to the counter',t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const pen=new Proxy({},{get:()=>()=>pen});
  const canvas=globalThis.document,path=globalThis.Path2D;
  globalThis.document={createElement:()=>({getContext:()=>pen})};
  globalThis.Path2D=class {};
  t.after(()=>{
    if(canvas)globalThis.document=canvas;else delete globalThis.document;
    if(path)globalThis.Path2D=path;else delete globalThis.Path2D;
  });
  let ready=false;
  const book={index:0,current:()=>CHAPTERS[0],ready:()=>ready,inventory:()=>[],deliveredItems:()=>[],has:()=>false};
  const world=createStoryWorld(new Group(),book);
  const visitor={...STORY_SITES.find(s=>s.region==='river'),grounded:false,buffs:{}};
  world.update(0,visitor);
  const witness=()=>world.speakers().find(s=>s.person.name==='八重');
  const host=world.speakers().find(s=>s.person.name==='おはな');
  assert.equal(witness(),undefined);world.holdSpeaker(host.person.id);
  ready=true;world.invalidate();world.playAction('end/mystery_01',host.person.id);
  world.update(.03,visitor);
  assert.ok(witness());assert.equal(world.actionPlaying,true);
});

test('a worker fits each batten separately before seating the upper tray', t=>{
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const scene=new Group(),actor=new Group(),right=new Group(),left=new Group();
  actor.add(left,right);scene.add(actor);
  left.position.set(-.18,.9,.17);right.position.set(.18,.9,.17);
  connectStoryHands(actor,'frog',{'arm-1':left,arm1:right});
  const host={actor,person:{name:'留吉',species:'蛙'},site:{number:4,key:'spring/'}};
  const work=createFieldwork(scene),key='clue/steam-repair',score=performedScenes.get(key);
  work.update(0);work.start(key,host,[host]);
  let time=until(work,0,()=>work.gesture==='fit');
  const root=scene.getObjectByName(score.title);
  const bars=[0,1,2].map(i=>root.getObjectByName('取り外し桟'+i));
  const lower=root.getObjectByName('蒸し箱の下段').parent;
  const position=o=>o.getWorldPosition(new Vector3());
  const before=bars.map(position);
  for(let i=0;i<3;i++){
    const index=work.beat;
    time=until(work,time,()=>work.beat!==index);
    const seated=lower.localToWorld(new Vector3((i-1)*.213,.169,0));
    assert.ok(position(bars[i]).distanceTo(seated)<.002,'the fitted batten meets its own notch');
    for(let j=i+1;j<3;j++)assert.ok(position(bars[j]).distanceTo(before[j])<1e-6,'the other batten waits for the hand');
  }
  assert.equal(work.gesture,'stack');
  work.clear();
});
