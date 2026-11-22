import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {MAPLE_BRIDGE as bridge} from '../two/maple-crossing.js';
import {MAPLE_FOOTINGS,bridgeHeight,groundHeight,terrainMeshHeight,staticVolumeAt,waterDepth} from '../two/terrain.js';

test('stone bridgeheads meet the visible bank, and the piles carry the deck from the ravine floor',()=>{
  for(const sill of MAPLE_FOOTINGS.thresholds){
    const side=Math.sign(sill.z-bridge.z),edge=bridge.z+side*bridge.length/2;
    assert.ok(Math.abs(bridgeHeight(bridge,edge)-sill.top)<.02);
    for(const u of [-1.7,0,1.7]){
      assert.equal(groundHeight(sill.x+u,sill.z,sill.top),sill.top);
      assert.ok(Math.abs(sill.top-groundHeight(sill.x+u,sill.z+side*.52,sill.top))<.05);
      assert.ok(terrainMeshHeight(sill.x+u,sill.z)>sill.bottom);
    }
  }
  for(const p of MAPLE_FOOTINGS.piers){
    const beam=MAPLE_FOOTINGS.beams.find(s=>s.z===p.z);
    assert.equal(p.top,beam.bottom);
    assert.ok(Math.abs(bridgeHeight(bridge,p.z)-beam.top-.23)<1e-8);
    const ground=terrainMeshHeight(p.x,p.z);
    assert.ok(p.bottom<ground && ground<p.top);
    assert.ok(staticVolumeAt(p.x,p.z,(ground+p.top)/2,.07,.1));
  }
  assert.ok(waterDepth(bridge.x,bridge.z)>1);
  assert.ok(!staticVolumeAt(bridge.x,bridge.z,1,.35,1.5),'open channel below the timberwork');
});

test('a walking mochi can take either side of the uphill and downhill crossing',()=>{
  const game=createGame(),p=game.state.player,end=bridge.length/2+2.4;
  for(const side of [-1,1])for(const offset of [-1.15,0,1.15]){
    const x=bridge.x+offset,z=bridge.z+side*end,target=bridge.z-side*end;
    Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vy:0,vz:0,speed:0,grounded:true});
    for(let frame=0;frame<700 && side*(p.z-target)>.04;frame++){
      const old=p.y;
      game.step(1/60,{x:0,z:-side});
      assert.ok(Math.abs(p.y-old)<.055,'step at '+[x,p.z]);
      assert.ok(p.grounded && !p.inWater);
    }
    assert.ok(Math.abs(p.z-target)<.13,'blocked approach at '+[p.x,p.z]);
  }
  let previous=bridgeHeight(bridge,bridge.z-bridge.length/2);
  for(let i=1;i<=100;i++){
    const y=bridgeHeight(bridge,bridge.z+bridge.length*(i/100-.5));
    assert.ok(Math.abs(y-previous)/(bridge.length/100)<.29);
    previous=y;
  }
});
