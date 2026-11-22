import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { RETREATS, nearbyRetreat, reservedScenery, sitePoint } from '../two/retreat-layout.js';
import { BUILDINGS, canOccupy, groundHeight, staticVolumeAt, terrainHeight } from '../two/terrain.js';
import { RINSING_HALL, RINSING_SEATS, SUZURI_COURT, SUZURI_WALLS } from '../two/kyo-bath-layout.js';
import { karahafu,wallCoping,washHallRoof } from '../two/kyo-bath-roofs.js';

const bath=RETREATS.find(b=>b.shape==='suzuri');
const point=(u,v)=>sitePoint(bath,u,v);

test('the Kyoto bath encloses the inkstone and the former dyer behind a single walkable street gate',()=>{
  assert.ok(!BUILDINGS.some(b=>b.x===214 && b.z===-838));
  assert.equal(nearbyRetreat(214,-838),bath);
  assert.ok(reservedScenery(214,-838));
  for(const [u,v,x,z] of SUZURI_WALLS){
    for(const t of [.05,.29,.60,.93]){
      const q=point(u+(x-u)*t,v+(z-v)*t);
      assert.ok(staticVolumeAt(...q,terrainHeight(...q)+.36,.15,1.18),'solid perimeter at '+q);
    }
  }
  const entry=point(0,SUZURI_COURT.front);
  assert.ok(canOccupy(...entry,groundHeight(...entry),.42,1.76),'passage under the gate');
  for(const u of RINSING_SEATS){
    const bay=point(u,-.72),stool=point(u,-1.92),bowl=point(u,-3.35);
    assert.ok(canOccupy(...bay,groundHeight(...bay),.26,1.66));
    assert.ok(staticVolumeAt(...stool,terrainHeight(...stool)+.25,.12,.95));
    assert.ok(staticVolumeAt(...bowl,terrainHeight(...bowl)+.45,.12,.95));
  }
  const sideDoor=point(RINSING_HALL.u-RINSING_HALL.w/2,-.65);
  assert.ok(canOccupy(...sideDoor,groundHeight(...sideDoor),.26,1.66),'open pool-facing bay');
});

test('a visitor walks from the avenue to all four washing stations, bathes, and returns to the street',()=>{
  const game=createGame(),p=game.state.player,street=point(0,9.35);
  Object.assign(p,{x:street[0],z:street[1],y:groundHeight(...street),grounded:true});
  function walk(u,v){
    const [x,z]=point(u,v);
    for(let i=0;i<210;i++){
      const dx=x-p.x,dz=z-p.z,range=Math.hypot(dx,dz);
      if(range<.12)return;
      game.step(1/60,{x:dx/range,z:dz/range});
    }
    assert.fail('blocked on the route to '+[u,v]+' at '+[p.x,p.z]);
  }
  for(const [u,v] of [[0,4.05],[3.2,4.06],[5.94,3.97],[9,3.10],[10.63,1.86],
      ...RINSING_SEATS.map(u=>[u,-.72]),[16.25,2.7],[7,3.90],[4.5,4.05],[0,4.05],[0,0]])walk(u,v);
  assert.equal(game.nearest()?.target.retreat,bath);
  assert.ok(game.act('interact'));
  for(let i=0;i<38;i++)game.step(.1);
  walk(0,4.05);walk(0,9.35);
  assert.ok(!p.inWater);
});

test('the gate, tile-coped walls and hipped washing hall have finite curved roofing and repeated low-poly tile ends',()=>{
  for(const [g,limit] of [[karahafu(),23000],[washHallRoof(11.57,6.44,1.62),55000],[wallCoping(18.77),21000]]){
    assert.ok(g.index.count/3>1200 && g.index.count/3<limit,'roof triangle budget '+g.index.count/3);
    for(const key of ['position','normal','color'])assert.ok(g.attributes[key].array.every(Number.isFinite),key);
  }
});

test('a journal saved on the new wall returns at the gate and resumes normally on the next load',()=>{
  const save=createGame().save(),[x,z]=point(4,SUZURI_COURT.front);
  Object.assign(save.player,{x,z,y:terrainHeight(x,z),h:0,grounded:true});
  save.score=267;
  const back=createGame(save),p=back.state.player,entry=point(0,SUZURI_COURT.front+1.86);
  assert.ok(back.restored);
  assert.deepEqual([p.x,p.z],entry);
  assert.ok(canOccupy(p.x,p.z,p.y,.26,1.66));
  assert.equal(back.state.score,267);
  const again=createGame(back.save()).state.player;
  assert.deepEqual([again.x,again.z],entry);
});
