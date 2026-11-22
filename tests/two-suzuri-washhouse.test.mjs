import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { groundHeight,waterSurfaceAt } from '../two/terrain.js';
import { RINSING_FLOOR,RINSING_SEATS,RINSING_TUB,rinseFloorHeight } from '../two/kyo-bath-layout.js';

import { Group } from '../two/vendor/three.module.min.js';
import { createSuzuriRinsing } from '../two/suzuri-bathing-art.js';

const court=RETREATS.find(site=>site.shape==='suzuri');
const point=(u,v)=>sitePoint(court,u,v);

test('both sides of the old dye hall drain down to a graded trench and a single inspection sump',()=>{
  const y=waterSurfaceAt(court.x,court.z),drain=RINSING_FLOOR.drain;
  for(const u of RINSING_SEATS){
    for(const v of [-.67,-1.08,drain+.22,drain,drain-.23]){
      const walkway=point(u+.55,v);
      assert.ok(Math.abs(groundHeight(...walkway)-y-rinseFloorHeight(u+.55,v))<.009,`flag at ${u},${v}`);
    }
    assert.ok(rinseFloorHeight(u,drain)<rinseFloorHeight(u,drain-.69));
    assert.ok(rinseFloorHeight(u,drain)<rinseFloorHeight(u,drain+.69));
  }
  assert.ok(rinseFloorHeight(RINSING_SEATS.at(-1),drain)<rinseFloorHeight(RINSING_SEATS[0],drain)-.020);
});

test('walk from the street, take four rinses on their own stools, and leave on foot',()=>{
  const game=createGame(),p=game.state.player,[sx,sz]=point(0,9.35);
  Object.assign(p,{x:sx,z:sz,y:groundHeight(sx,sz),grounded:true});
  function walk(u,v){
    const [x,z]=point(u,v);
    for(let i=0;i<360;i++){
      const dx=x-p.x,dz=z-p.z,r=Math.hypot(dx,dz);
      if(r<.10)return;
      game.step(1/60,{x:dx/r,z:dz/r});
    }
    assert.fail('blocked walking to '+[u,v]);
  }
  const access=[[0,4.05],[3.2,4.06],[5.94,3.97],[9,3.10],[10.63,1.86],[10.63,-.40]];
  for(const stop of access)walk(...stop);
  for(const [i,u] of RINSING_SEATS.entries()){
    const id='suzuri-rinse-'+(i+1);
    walk(u,-.40);walk(u,-.82);
    assert.equal(game.nearest()?.place?.id,id);
    assert.ok(game.act('interact'));
    assert.equal(p.bathPose.id,id);
    const saved=createGame(game.save());
    assert.equal(saved.state.player.bathPose.id,id);
    for(let j=0;j<36;j++)game.step(.1);
    walk(u,-.40);
  }
  for(const stop of access.reverse())walk(...stop);
  walk(0,9.35);
  assert.ok(!p.activity && !p.inWater);
});

test('the four empty dippers float with their bottoms in the buckets before the visitor picks one up',()=>{
  const room=new Group(),update=createSuzuriRinsing(room);
  update(0,{x:court.x,z:court.z});
  const ladles=room.getObjectByName('花京の掛け湯').children.filter(m=>m.name==='汲み柄杓');
  assert.equal(ladles.length,4);
  for(const vessel of ladles){
    const draft=RINSING_TUB.water-vessel.position.y;
    assert.ok(draft>.008 && draft<.02,'empty hinoki vessel draft '+draft);
  }
});
