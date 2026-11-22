import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { CHAYA_SITES,CHAYA_SEAT } from '../two/wayside-hut-layout.js';
import { sitePoint } from '../two/retreat-layout.js';
import { nearRoad,terrainHeight,groundHeight,staticVolumeAt,waterDepth } from '../two/terrain.js';

function walk(game,[x,z]){
  const p=game.state.player;
  for(let i=0;i<185;i++){
    const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
    if(d<.12)return;
    game.step(1/60,{x:dx/d,z:dz/d});
  }
  assert.fail('Could not reach '+[x,z]+' from '+[p.x,p.z]);
}
function arrive(p,[x,z]){
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vz:0,vy:0,speed:0,activity:null,mount:null,grounded:true,hp:32,mp:14});
}

test('all countryside tea houses face a walkable road and serve a complete, repeatable meal on the bench',()=>{
  const g=createGame(),p=g.state.player;
  assert.equal(CHAYA_SITES.length,9);
  for(const site of CHAYA_SITES){
    assert.ok(site.tea && site.dango && site.dye);
    const road=sitePoint(site,CHAYA_SEAT.x,10.8),front=sitePoint(site,CHAYA_SEAT.x,3.73);
    assert.ok(nearRoad(...road,1),site.name+' faces its road');
    assert.ok(waterDepth(...front)===0);
    arrive(p,road);walk(g,front);
    assert.equal(p.activity,null);
    assert.equal(g.nearest()?.target.chaya,site,site.name);
    assert.ok(g.act('interact'));
    assert.equal(p.activity,'chaya');
    const [x,z]=sitePoint(site,CHAYA_SEAT.x,CHAYA_SEAT.z);
    assert.deepEqual([p.x,p.z],[x,z]);
    assert.equal(p.y,terrainHeight(site.x,site.z)+CHAYA_SEAT.top);
    assert.equal(p.heading,site.yaw);
    assert.ok(p.hp<100 && p.mp<100);
    assert.equal(g.nearest(),null);
    for(let i=0;i<46;i++)g.step(.1);
    assert.deepEqual([p.activity,p.hp,p.mp],[null,100,100]);
    assert.equal(g.nearest()?.target.chaya,site);
    walk(g,road);
    arrive(p,sitePoint(site,1.5,1.25));
    assert.notEqual(g.nearest()?.target.chaya,site);
    const floor=terrainHeight(site.x,site.z);
    assert.ok(staticVolumeAt(...sitePoint(site,-1.45,2.3),floor+.02,.12,.9));
  }
});
test('a saved meal resumes on its bench and leaves journal inventories and notice recipients intact',()=>{
  const g=createGame(),site=CHAYA_SITES[0],p=g.state.player;
  arrive(p,sitePoint(site,CHAYA_SEAT.x,3.73));g.act('interact');
  for(let i=0;i<26;i++)g.step(.1);
  const save=g.save(),after=createGame(save),q=after.state.player;
  assert.ok(after.restored);assert.equal(q.activity,'chaya');
  assert.equal(q.activityTime,p.activityTime);assert.equal(q.y,p.y);
  assert.equal(save.items.length,72);
  assert.equal(after.state.recipientTotal,g.state.recipientTotal);
  assert.equal(after.state.delivered.size,0);
  for(let i=0;i<19;i++)after.step(.1);
  assert.deepEqual([q.hp,q.mp,q.activity],[100,100,null]);
});
