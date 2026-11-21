import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { REGIONS, nearRoad, waterDepth, solidHeightAt } from '../two/terrain.js';
import { DYES, TRADES } from '../two/procession.js';

test('the ten villages support ten times the original hares and frogs, with varied trades and clear roads',()=>{
  const game=createGame(), {npcs,objects}=game.state;
  for(const [species,count] of [['rabbit',190],['frog',250]]) {
    const residents=npcs.filter(n=>n.type===species);
    assert.equal(residents.length,count);
    const workers=residents.filter(n=>n.area);
    assert.deepEqual(new Set(workers.map(n=>n.role)),new Set(TRADES));
    assert.equal(new Set(workers.map(n=>n.dye)).size,DYES.length);
    assert.equal(new Set(workers.map(n=>n.dye+'-'+n.role)).size,TRADES.length*DYES.length);
  }
  for(const region of REGIONS) {
    const workers=npcs.filter(n=>n.area===region.id);
    assert.ok(workers.length>=39);
    for(const n of workers) {
      assert.ok(!nearRoad(n.x,n.z,1.9) && waterDepth(n.x,n.z)<=.06);
      assert.ok(solidHeightAt(n.x,n.z,1.15)<=n.y+.2);
      assert.ok(objects.every(o=>Math.hypot(o.x-n.x,o.z-n.z)>=5.6));
    }
  }
  assert.equal(npcs.filter(n=>n.type==='turtle').length,1);
});

test('a returning traveller can stand beside the local artisans and deliver a notice',()=>{
  const original=createGame();
  const shop=original.state.npcs.find(n=>n.area==='snow' && n.role==='scribe');
  const snap=original.save();
  Object.assign(snap.player,{x:shop.x,z:shop.z,y:shop.y,heading:0});
  const game=createGame(snap),p=game.state.player;
  const nearby=game.state.nearbyNpcs;
  assert.ok(nearby.some(n=>n.id===shop.id));
  assert.ok(nearby.length<game.state.npcs.length/2);
  game.step(1/60);
  assert.equal(p.hp,100);
  assert.equal(p.activity,null);
  assert.equal(game.act('throw'),true);
  for(let i=0;i<6;i++) game.step(1/60);
  assert.equal(game.state.score,10);
});
