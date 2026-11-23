import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { fieldCast, courier } from '../two/mochiyori-field-cast.js';
import { performedScenes } from '../two/mochiyori-scenes.js';
import { createStoryStillLife } from '../two/story-crafts.js';
import { createFieldwork } from '../two/mochiyori-fieldwork.js';
import { connectStoryHands, storyGrip } from '../two/story-hands.js';
import { CHAPTERS, CAST } from '../two/mochiyori-story.js';
import { STORY_SITES } from '../two/story-sites.js';
import { locationFor, peopleAt } from '../two/mochiyori-world.js';

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
  const cake=scene.getObjectByName('合わせ餅'),basket=scene.getObjectByName('花筏餅');
  assert.ok(span>0 && cake && basket);
  const position=node=>node.getWorldPosition(new Vector3());
  const rest=position(cake),other=position(basket),fingers=position(storyGrip(actor));
  for(let i=0;i<=18;i++)work.update(100+i*.1);
  const rising=position(cake);
  assert.ok(rising.y>rest.y+.06);
  assert.ok(position(storyGrip(actor)).distanceTo(fingers)>.01);
  assert.ok(position(basket).distanceTo(other)<1e-6);
  work.update(103.36);
  const underside=cake.localToWorld(new Vector3(0,-1,0)).sub(position(cake));
  assert.ok(underside.y>0);
  assert.ok(work.focus.distanceTo(position(cake))<.15);
  work.update(105);
  work.update(106);
  assert.equal(work.playing,false);
  assert.ok(scene.getObjectByName('合わせ餅'), 'the revealed underside can still be inspected');
  work.stop();assert.equal(scene.children.length,1);
  // Even a distant folding stand borrows the exhibit from the real counter.
  const counter=createStoryStillLife(1);
  counter.position.set(10,7,-102);scene.add(counter);
  const basketOnCounter=counter.children.find(o=>o.userData.storyEvidence==='basket');
  for(let i=0;i<2;i++){
    assert.equal(work.start('clue/joined-cake',speaker,[speaker],counter),span);
    assert.equal(basketOnCounter.visible,false);
    work.stop();assert.equal(work.focus,null);assert.equal(basketOnCounter.visible,true);
  }
});
