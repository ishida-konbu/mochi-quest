import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {KAEDE_WATER_TREADS as treads} from '../two/kaede-water-steps.js';
import {groundHeight, terrainMeshHeight, waterSurfaceAt} from '../two/terrain.js';

test('a traveller walks from the south bridge approach to the dipping stone and back without jumping',()=>{
  const game=createGame(), p=game.state.player;
  const apron={x:292,z:-115.8}, approach={x:treads[0].x,z:apron.z};
  Object.assign(p,{...apron,y:groundHeight(apron.x,apron.z),h:0,vx:0,vy:0,vz:0,grounded:true});
  const hp=p.hp;
  for(const point of [approach,...treads,...treads.slice(0,-1).reverse(),approach,apron]){
    let distance=Math.hypot(point.x-p.x,point.z-p.z);
    for(let frame=0;distance>.035 && frame<180;frame++){
      const speed=Math.min(1,distance*5)/distance;
      game.step(1/60,{x:(point.x-p.x)*speed,z:(point.z-p.z)*speed});
      assert.ok(!p.inWater && p.activity!=='fall','dry footing on the bank');
      distance=Math.hypot(point.x-p.x,point.z-p.z);
    }
    assert.ok(distance<=.035,'blocked while approaching '+[point.x,point.z]);
    if(point.y!==undefined){
      assert.ok(Math.abs(p.y-point.y)<.10,'feet meet the painted stone');
      assert.ok(terrainMeshHeight(point.x,point.z)<point.y+.015,'a tread is buried');
    }
  }
  assert.equal(p.hp,hp);
  const stone=treads.at(-1);
  const lip=stone.y-waterSurfaceAt(stone.x,stone.z);
  assert.ok(lip>0 && lip<.35,'the bucket can reach the water from dry stone');
});

test('the original maple hare uses every tread with an empty pail going down and water on the return',()=>{
  const game=createGame(),{state}=game;
  const rabbit=state.npcs.find(n=>n.id==='rabbit-38');
  assert.ok(rabbit?.waterHare);
  // Keep the stairs in the active NPC cell while leaving the centreline free.
  Object.assign(state.player,{x:292,z:-115.8,y:groundHeight(292,-115.8),grounded:true});
  const used=[new Set(),new Set()];
  let scooped=false, poured=false;
  for(let time=0;time<160&&!poured;time+=.10){
    state.time=time;
    game.step(1/60,{});
    if(rabbit.waterDip>.80 && rabbit.pailLevel>.7){
      const foot=treads.at(-1);
      assert.ok(Math.hypot(rabbit.x-foot.x,rabbit.z-foot.z)<.8);
      scooped=true;
    }
    if(scooped && rabbit.waterPour>.80 && rabbit.pailLevel<.3)poured=true;
    for(const [i,t] of treads.entries()){
      if(Math.hypot(t.x-rabbit.x,t.z-rabbit.z)>.13)continue;
      if(rabbit.pailLevel===0 || rabbit.pailLevel===1)used[rabbit.pailLevel].add(i);
    }
  }
  assert.ok(scooped && poured,'bucket filled at the river and emptied at the bridgehead');
  assert.equal(used[0].size,treads.length);
  assert.equal(used[1].size,treads.length);
  const resumed=createGame(game.save()).state.npcs.find(n=>n.id===rabbit.id);
  assert.ok(Math.hypot(resumed.x-rabbit.x,resumed.z-rabbit.z)<.02);
});
