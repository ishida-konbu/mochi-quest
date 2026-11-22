import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, terrainHeight, solidHeightAt } from '../two/terrain.js';
import { DISTRICTS } from '../two/geography.js';
import { KYO_LOOKOUTS } from '../two/higashiyama.js';
import { canopyHeight } from '../two/village-paths.js';
import { kyoInfluence, kyoNight } from '../two/kyo-layout.js';
import { houseCandles, houseFrontLamps, COURT_CANDLES } from '../two/lamp-layout.js';
import { pagodaPlan } from '../two/architecture.js';

test('each mountain summit has a genuine view across the illuminated ward',()=>{
  for(const [i,s] of KYO_LOOKOUTS.entries()){
    const eye=terrainHeight(s.x,s.z)+1.83;
    assert.ok(kyoInfluence(s.x,s.z)>.94);
    for(const side of [-46,0,46]){
      const x=DISTRICTS.kyo.x+(i===1?side:0),z=DISTRICTS.kyo.z+(i===1?0:side);
      const dx=x-s.x,dz=z-s.z,wick=terrainHeight(x,z)+1.65;
      for(let d=1;d<Math.hypot(dx,dz);d+=1.2){
        const t=d/Math.hypot(dx,dz),xx=s.x+t*dx,zz=s.z+t*dz;
        assert.ok(eye+(wick-eye)*t>Math.max(terrainHeight(xx,zz),canopyHeight(xx,zz,0)),
          'blocked view of street lamps at '+[s.x,s.z,xx,zz]);
      }
    }
  }
  assert.ok(kyoInfluence(510,-717)>.96);
  assert.equal(kyoNight(144,{}),1);
  assert.equal(kyoNight(0,{}),0);
});

test('the town has lit fixtures on actual floors, including all five landings and both shop floors',()=>{
  for(const b of BUILDINGS){
    const candles=houseCandles(b);
    assert.ok(candles.length>0,b.kind);
    if(b.kind==='pagoda'){
      for(const {y} of pagodaPlan(b).storeys)
        assert.equal(candles.filter(q=>q.y===y).length,2);
    }
    if(b.kind==='wardShop' && b.wall>5)assert.deepEqual(candles.map(q=>q.y),[.48,3.38]);
    for(const q of candles){
      const x=b.x+q.u*b.cos+q.v*b.sin,z=b.z-q.u*b.sin+q.v*b.cos;
      assert.ok(solidHeightAt(x,z,.02,b.y+q.y) >= b.y+q.y+q.scale-.001);
    }
    if(b.kind==='wardShop')assert.equal(houseFrontLamps(b).length,1);
  }
  assert.equal(COURT_CANDLES.length,6);
});
