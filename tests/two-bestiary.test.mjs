import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { SPECIES, recipientContact } from '../two/bestiary.js';
import { groundHeight } from '../two/terrain.js';

test('the recipient ledger covers all 623 individuals and gives the two legends a hundredfold score',()=>{
  const {state}=createGame();
  assert.equal(state.recipientTotal,623);
  assert.equal(new Set(state.npcs.map(n=>n.id)).size,state.recipientTotal);
  assert.deepEqual(Object.fromEntries(Object.keys(SPECIES).map(type=>[type,state.npcs.filter(n=>n.type===type).length])),
    {monkey:90,bird:40,fox:40,tiger:10,dragon:1,kirin:1});
  assert.equal(SPECIES.monkey.points,SPECIES.bird.points);
  assert.ok(10<SPECIES.bird.points && SPECIES.bird.points<SPECIES.fox.points && SPECIES.fox.points<SPECIES.tiger.points);
  assert.equal(SPECIES.dragon.points,1000);assert.equal(SPECIES.kirin.points,1000);
});

test('notices intersect the actual airborne volume, and unique recipients and old scores survive save and transfer',()=>{
  for(const type of ['bird','dragon']){
    let game=createGame();
    const n=game.state.npcs.find(n=>n.type===type), p=game.state.player,scale=n.stature;
    const height=n.y+(type==='bird'?.13:1.02)*scale;
    Object.assign(p,{x:n.x,z:n.z-2,heading:0,y:n.y,h:n.y-groundHeight(n.x,n.z),grounded:false,mode:'habutae'});
    game.step(1/60);
    const wrongHeight=n.y-2;
    assert.equal(recipientContact(n,{x:n.x,y:wrongHeight,z:n.z-1},0,1,2),Infinity);
    const savedTime=game.state.time;
    function throwAtAltitude(){
      Object.assign(p,{x:n.x,z:n.z-2,y:height-.93,h:height-.93-groundHeight(n.x,n.z),grounded:false,heading:0,vy:0});
      assert.ok(game.act('throw'));
      for(let i=0;i<25;i++)game.step(1/60);
    }
    throwAtAltitude();
    assert.equal(game.state.delivered.has(n.id),true,type);
    assert.equal(game.state.score,SPECIES[type].points);
    throwAtAltitude();
    assert.ok(game.state.time>savedTime);
    assert.equal(game.state.delivered.size,1);
    assert.equal(game.state.score,2*SPECIES[type].points);
    const snap=game.save();game=createGame(snap);assert.ok(game.restored);assert.ok(game.state.delivered.has(n.id));
    delete snap.delivered;const legacy=createGame(snap);assert.ok(legacy.restored);assert.equal(legacy.state.score,snap.score);
    assert.equal(legacy.state.delivered.size,0);
  }
});

test('delivery to the last turtle unlocks Kagami once; duplicate and unknown IDs cannot unlock it',()=>{
  const base=createGame(),t=base.state.npcs.find(n=>n.type==='turtle'),snap=base.save();
  snap.delivered=base.state.npcs.filter(n=>n!==t).map(n=>n.id);
  snap.delivered.push(snap.delivered[0],'not-an-animal');
  const game=createGame(snap),p=game.state.player;
  assert.equal(game.state.delivered.size,622);assert.equal(game.state.kagamiUnlocked,false);
  Object.assign(p,{x:t.x,z:t.z-1.45,y:t.y,h:0,heading:0});
  assert.ok(game.act('throw'));for(let i=0;i<15;i++)game.step(1/60);
  assert.ok(game.state.delivered.has(t.id));assert.ok(game.state.kagamiUnlocked);
  assert.ok(game.state.events.some(e=>e.text?.includes('全員に三条通知')));
  const saved=game.save();assert.ok(createGame(saved).state.kagamiUnlocked);
});
