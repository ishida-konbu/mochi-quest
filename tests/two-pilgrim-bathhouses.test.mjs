import { createGame } from '../two/game.js';
import { pilgrimPools,steamRoom } from '../two/pilgrim-bathing-plan.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { bathEnclosure } from '../two/bath-enclosures.js';
import { hasPilgrimBathhouse,pilgrimRoofPoint,yardFixture } from '../two/pilgrim-lodge-plan.js';
import { SNOW_SPRING,springLevel,waterDepth,groundHeight,canOccupy,staticVolumeAt } from '../two/terrain.js';

const sites=[...RETREATS.filter(hasPilgrimBathhouse),SNOW_SPRING];

test('the curved roof surfaces support landings at their painted eaves and slopes',()=>{
  for(const s of sites){
    const winter=s===SNOW_SPRING;
    const r=winter?{u:0,v:-8.9,w:8.74,d:3.54,eave:3.56,rise:1.46}:bathEnclosure(s).room;
    const level=winter?s.level+.52:springLevel(s);
    for(const [u,v] of [[.61,.64],[-.64,.67],[.86,.73],[-.75,-.41]]){
      const [a,y,b]=pilgrimRoofPoint(s.kind,(r.w+.66)/2,(r.d+.65)/2,r.eave,r.rise,u,v);
      const [x,z]=sitePoint(s,r.u+a,r.v+b);
      assert.ok(Math.abs(groundHeight(x,z,level+y+.14)-level-y)<.001,s.name+' at '+[u,v]);
    }
    // A passenger can still stand on the open floor beneath that roof.
    const [x,z]=sitePoint(s,r.u+.5,r.v+.28*r.d);
    assert.ok(canOccupy(x,z,groundHeight(x,z),.24),s.name+' washing bay');
  }
});

test('the firing yard fuel rack and votive light have solid footings outside the walk-in beach',()=>{
  for(const s of sites.filter(q=>['temple','sakai'].includes(q.kind))){
    const p=bathEnclosure(s),q=yardFixture(s.kind,p),level=springLevel(s);
    const [x,z]=sitePoint(s,p.room.u+q.x,p.room.v+q.z);
    assert.ok(staticVolumeAt(x,z,level+.27,.18),s.name+' yard furniture');
    const [a,b]=sitePoint(s,0,s.rz*.78);
    assert.ok(canOccupy(a,b,groundHeight(a,b),.24),s.name+' walk-in entry');
  }
});


function follow(game,s,u,v){
  const [x,z]=sitePoint(s,u,v),p=game.state.player;
  for(let i=0;i<340;i++){
    const dx=x-p.x,dz=z-p.z,len=Math.hypot(dx,dz);
    if(len<.14)return;
    game.step(1/60,{x:dx/len,z:dz/len});
  }
  assert.fail(s.name+' cannot reach local '+[u,v]+' from world '+[p.x,p.z]);
}
function startAt(s,u,v){
  const game=createGame(),p=game.state.player,[x,z]=sitePoint(s,u,v);
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vy:0,vz:0,grounded:true});
  game.step(1/60);return game;
}
test('both fruit casks and the three lotus cups can be entered, used and left on foot',()=>{
  for(const s of sites.filter(q=>q.kind==='peach'||q.kind==='temple'))for(const pool of pilgrimPools(s)){
    const v=pool.v+pool.rz+1.75;
    const game=startAt(s,pool.u,v);
    follow(game,s,pool.u,pool.v);
    for(let i=0;i<25;i++)game.step(1/60);
    assert.equal(game.nearest()?.place?.id,pool.id);
    assert.ok(game.act('interact'));
    for(let i=0;i<235;i++)game.step(1/60);
    assert.equal(game.state.player.activity,null);
    follow(game,s,pool.u,v);
    assert.equal(waterDepth(game.state.player.x,game.state.player.z),0);
  }
});
test('the steam-room gate and both dry benches work from the street',()=>{
  const s=sites.find(q=>q.kind==='sakai');
  for(const side of [-1,1]){
    const game=startAt(s,0,6.2);
    follow(game,s,0,steamRoom.seatV);
    follow(game,s,side*1.10,steamRoom.seatV);
    assert.equal(game.nearest()?.place?.action,'steam');
    assert.ok(game.act('interact'));
    for(let i=0;i<100;i++)game.step(1/60);
    const pose=game.state.player.bathPose;
    assert.equal(pose.wet,false);
    assert.equal(pose.seatY,springLevel(s)+steamRoom.seatTop);
    assert.equal(waterDepth(pose.x,pose.z),0);
    for(let i=0;i<136;i++)game.step(1/60);
    follow(game,s,0,steamRoom.seatV+.43);
    follow(game,s,0,4.5);
  }
});

test('Sakai journals saved under the former bath name reopen in the dry steam room',()=>{
  const s=sites.find(q=>q.kind==='sakai');
  const g=startAt(s,-1.10,steamRoom.seatV);
  assert.ok(g.act('interact'));
  for(let i=0;i<71;i++)g.step(1/60);
  const journal=g.save();
  assert.equal(journal.lastBath,'onsen-sakai-tsuboguchi');
  assert.equal(s.name,'堺の陶室蒸し湯');
  for(const old of [journal,{...journal,lastBathPlace:undefined}]){
    const resumed=createGame(old);
    assert.equal(resumed.save().lastBath,journal.lastBath);
    assert.equal(resumed.state.player.bathPose.action,'steam');
    assert.equal(resumed.state.player.bathPose.wet,false);
  }
});
