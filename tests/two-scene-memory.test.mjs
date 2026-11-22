import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, CAST, SCENES } from '../two/mochiyori-story.js';
import { createNotebook, memoryKeys } from '../two/mochiyori-progress.js';
import { performedScenes, memoryScene, sceneLocation } from '../two/mochiyori-scenes.js';
import { storySite } from '../two/story-sites.js';

test('every playable mystery, resident and local specialty has a located performance with valid cues',()=>{
  const expected=CHAPTERS.reduce((n,ch)=>n+ch.clues.length+ch.proofs.length+1,0)+CAST.length+SCENES.length+7;
  assert.equal(performedScenes.size,expected);
  assert.deepEqual(new Set(memoryKeys),new Set(performedScenes.keys()));
  const gestures=new Set(['present','point','lift','turn','open','compare','fit','divide','stack','write','tie','pass','set','pour']);
  for(const [key,s] of performedScenes){
    assert.ok(s.title && s.site && s.beats.length>=2,key);
    for(const b of s.beats){
      assert.ok(s.cast[b.actor] && s.props[b.prop] && b.caption && gestures.has(b.gesture),key);
      if(b.target!=null)assert.ok(s.props[b.target],key);
      if(b.partner!=null)assert.ok(s.cast[b.partner],key);
    }
  }
});

test('an observed scene is recalled at its original worktable before the note has been entered',()=>{
  const b=createNotebook(),k='clue/joined-cake',site=storySite('river');
  assert.equal(b.seen(k),false);
  assert.equal(b.remember(k,sceneLocation(site)),true);
  const loaded=createNotebook(b.save());
  assert.ok(loaded.seen(k));assert.equal(loaded.has('joined-cake'),false);
  assert.equal(memoryScene(loaded,k).site,site);
  assert.ok(loaded.leads().some(c=>c.id==='joined-cake'));
  const visitor='talk/'+CAST[0].id,destination=storySite('kyo','court');
  loaded.remember(visitor,sceneLocation(destination));
  assert.equal(memoryScene(createNotebook(loaded.save()),visitor).site,destination);
  assert.equal(loaded.remember('not-a-scene',0),false);
  assert.equal(loaded.remember(k,999),false);
});

test('a pre-performance notebook recovers only its recorded findings, solved questions and completed chapters',()=>{
  const first=CHAPTERS[0],b=createNotebook();
  while(b.leads().length)b.record(b.leads()[0].id);
  const shot=b.save();shot.proof=1;
  const old=createNotebook(shot);
  assert.ok(old.seen('clue/'+first.clues[0].id));
  assert.ok(old.seen('proof/'+first.id+'/0'));
  assert.equal(old.seen('end/'+first.id),false);
  assert.equal(old.seen('clue/'+CHAPTERS[1].clues[0].id),false);
  const next=createNotebook({...shot,chapter:1,proof:0});
  assert.ok(next.seen('end/'+first.id));
  assert.deepEqual(next.save().notes,shot.notes);
});

test('the bamboo artisan remembers his workshop and his rest in the peach grove separately', () => {
  const artisan = CAST.find(person => person.name === '弥平');
  const work = 'talk/' + artisan.id;
  const rest = 'rest/' + artisan.id;
  const workshop = storySite('shrine');
  const grove = storySite('peach');
  const notebook = createNotebook();

  notebook.remember(work, sceneLocation(workshop));
  assert.equal(notebook.seen(rest), false);
  notebook.remember(rest, sceneLocation(grove));

  const loaded = createNotebook(notebook.save());
  const workScene = memoryScene(loaded, work);
  const restScene = memoryScene(loaded, rest);
  assert.equal(workScene.site, workshop);
  assert.equal(restScene.site, grove);
  assert.notEqual(workScene.title, restScene.title);
  assert.ok(workScene.props.some(prop => prop.variant === 'artisan-steamer'));
  assert.ok(restScene.beats.every(beat => beat.part === '湯呑み'));
});
