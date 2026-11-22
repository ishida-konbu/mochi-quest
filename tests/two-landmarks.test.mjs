import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { BUILDINGS, terrainHeight, groundHeight, solidHeightAt, constrainMove, SNOW_SPRING, TSUKIMI, waterDepth, waterSurfaceAt } from '../two/terrain.js';

import { RASHOMON, GATE_STONE, GATE_STEPS, GATE_WING, GATE_LEAF, gateStoneRise } from '../two/kyo-layout.js';

function stand(game,x,z,y=groundHeight(x,z)) {
  Object.assign(game.state.player,{x,z,y,h:0,vy:0,vx:0,vz:0,speed:0,grounded:true});
}
test('both five-storey pagodas can be climbed, saved and descended entirely on foot',()=>{
  for(const b of BUILDINGS.filter(b=>b.kind==='pagoda')) {
    const g=createGame(),p=g.state.player;
    const point=(u,v)=>[b.x+u*b.cos+v*b.sin,b.z-u*b.sin+v*b.cos];
    stand(g,...point(0,b.d/2+2));
    function walk(u,v) {
      const [x,z]=point(u,v);
      for(let i=0;i<290;i++) {
        const dx=x-p.x,dz=z-p.z,length=Math.hypot(dx,dz);
        if(length<.072) return;
        p.invulnerable=2;g.step(1/60,{x:.66*dx/length,z:.66*dz/length});
      }
      assert.fail('Stairs blocked at '+[u,v,p.y-b.y]);
    }
    walk(0,2.23);walk(-.85,2.23);
    for(let i=1;i<5;i++){
      walk(-.85,-2.23);walk(.85,-2.23);walk(.85,2.23);
      assert.ok(Math.abs(p.y-b.y-.48-i*3.52*(b.roof/14.5))<.03);
      const restored=createGame(g.save());
      assert.equal(restored.restored,true);assert.equal(restored.state.player.y,p.y);
      if(i<4)walk(-.85,2.23);
    }
    for(let i=3;i>=0;i--){
      walk(.85,-2.23);walk(-.85,-2.23);walk(-.85,2.23);
      assert.ok(Math.abs(p.y-b.y-.48-i*3.52*(b.roof/14.5))<.04);
      if(i)walk(.85,2.23);
    }
    walk(0,2.23);walk(0,b.d/2+2);
  }
});
test('the Rashomon gate chamber and shops on either side of the street can be climbed on foot',()=>{
  const twoStoreys=BUILDINGS.filter(b=>b.kind==='wardShop'&&b.wall>5);
  const shops=[twoStoreys.find(b=>b.yaw===0),twoStoreys.find(b=>b.yaw!==0)];
  const trips=shops.map(shop=>{
    const stair=-shop.w/2+1.02, front=shop.d/2,back=-front+.52;
    return {site:shop,level:3.38,steps:[[0,front+1.25],[0,front-.28],[stair,front-.4],[stair,back],[0,back],[0,0]]};
  });
  trips.push({site:RASHOMON,level:GATE_STONE.height+RASHOMON.base,steps:[[0,15],[0,5.2],[9.52,5.2],[9.52,-4.12],[5.35,-4.03],[5.05,-3.25],[5.02,-.85],[-2.58,-.15]]});
  for(const {site,level,steps} of trips){
    const g=createGame(),p=g.state.player,angle=site.yaw||0,c=Math.cos(angle),s=Math.sin(angle);
    const point=([u,v])=>[site.x+u*c+v*s,site.z-u*s+v*c];
    stand(g,...point(steps[0]));
    for(const way of steps.slice(1)){
      const [x,z]=point(way);
      for(let i=0;i<450;i++){
        const dx=x-p.x,dz=z-p.z,dist=Math.hypot(dx,dz);
        if(dist<.055)break;
        p.invulnerable=2;g.step(1/60,{x:.56*dx/dist,z:.56*dz/dist});
      }
      assert.ok(Math.hypot(x-p.x,z-p.z)<.055,'blocked at '+[x,z]);
    }
    assert.ok(Math.abs(p.y-terrainHeight(site.x,site.z)-level)<.04);
    assert.equal(createGame(g.save()).state.player.y,p.y);
  }
});
test('both faces of the stone gate admit walkers and full-speed dango; the lateral lane crosses its own flights',()=>{
  const {x,z}=RASHOMON,s=GATE_STONE,ground=terrainHeight(x,z);
  for(const direction of [-1,1])for(const sideways of [false,true])for(const mode of ['normal','dango']){
    const g=createGame(),p=g.state.player,extent=sideways?22:20;
    const point=along=>sideways?[x+along,z+s.sideZ]:[x,z+along];
    stand(g,...point(-direction*extent));
    p.mode=mode;
    let reached=false,highest=-Infinity,topSpeed=0;
    for(let frame=0;frame<600;frame++){
      p.invulnerable=2;g.step(1/60,sideways?{x:direction}:{z:direction});
      const along=sideways?p.x-x:p.z-z;
      if(Math.abs(along)<2){highest=Math.max(highest,p.y);topSpeed=Math.max(topSpeed,p.speed);}
      if(along*direction>=extent-.2){reached=true;break;}
    }
    assert.ok(reached,[mode,sideways,direction,p.x,p.z].join(','));
    assert.ok(Math.abs(highest-ground-s.height)<.02);
    if(mode==='dango')assert.ok(topSpeed>18);
    assert.ok(p.grounded && Math.abs(p.y-groundHeight(p.x,p.z))<.02);
  }
  // The deck has vertical retaining walls beside the stone flights. The
  // graphic top, default spawn surface and every physical tread agree.
  for(const step of [-1,1])for(let j=0;j<s.count;j++){
    const v=step*(s.depth/2+(j+.5)*s.going);
    assert.ok(Math.abs(groundHeight(x,z+v)-ground-gateStoneRise(0,v))<1e-8);
  }
  const near=z+s.depth/2+.42;
  assert.ok(constrainMove(x+10,near,x+10,z+s.depth/2-.5,0,ground).z>z+s.depth/2);
  assert.ok(Math.abs(groundHeight(x+9.52,z+5)-ground-s.height)<1e-8);
});

test('older gate journeys reopen on the same wooden stair or upstairs floor above the new plinth',()=>{
  const {x,z,base}=RASHOMON,ground=terrainHeight(x,z),rise=GATE_STONE.height;
  const room=[-2.58,-.15,base],landing=[5.35,-4.03,base];
  const step=GATE_STEPS[16],wood=[step.x,step.z,step.top];
  for(const edition of [7,8,9])for(const [u,v,level] of [room,landing,wood,[0,0,12.26],[0,0,0]]){
    const old=createGame().save();old.version=edition;
    Object.assign(old.player,{x:x+u,z:z+v,y:ground+level,h:0,grounded:true});
    const play=createGame(old),p=play.state.player;
    assert.ok(play.restored);assert.deepEqual([p.x,p.z],[x+u,z+v]);
    assert.ok(Math.abs(p.y-ground-level-rise)<1e-6,'level '+[edition,u,v,p.y]);
    const same=createGame(play.save());
    assert.equal(same.state.player.y,p.y);
  }
  for(const wall of [GATE_WING,GATE_LEAF])for(const side of [-1,1]){
    const old=createGame().save();old.version=9;
    Object.assign(old.player,{x:x+side*wall.x,z:z+wall.z,y:ground,h:0,grounded:true});
    const g=createGame(old),p=g.state.player;
    assert.ok(solidHeightAt(p.x,p.z,.25,p.y)<p.y+.3);
    assert.ok(solidHeightAt(x+side*wall.x,z+wall.z,.25,p.y)>p.y+1.5);
  }
});
test('the open-air snow bath can be waded across and used away from the centre',()=>{
  const game=createGame(),{x,z,rx,level}=SNOW_SPRING,p=game.state.player;
  stand(game,x-rx*1.12,z);
  for(let i=0;i<83;i++)game.step(1/60,{x:1});
  assert.ok(p.inWater);assert.ok(p.x<x-3);assert.ok(waterDepth(p.x,p.z)>.4);
  assert.equal(waterSurfaceAt(p.x,p.z),level);
  const pos=[p.x,p.z];
  assert.equal(game.nearest().target.grand,true);
  p.hp=10;p.mp=25;
  assert.equal(game.act('interact'),true);assert.equal(p.activity,'bath');
  assert.deepEqual([p.x,p.z],pos);
  for(let i=0;i<216;i++)game.step(1/60);
  assert.equal(p.hp,100);assert.equal(p.mp,100);
  for(let i=0;i<360;i++)game.step(1/60,{x:1});
  assert.equal(p.inWater,false);
});
test('moon offerings can be eaten from the tray, restore vitals and return after a cooldown',()=>{
  const game=createGame(),p=game.state.player;
  stand(game,TSUKIMI.x,TSUKIMI.z+1.5);
  p.hp=20;p.mp=8;
  assert.equal(game.nearest().label,'月見団子を食べる');
  assert.equal(game.act('interact'),true);
  const saved=game.save(),resumed=createGame(saved);
  assert.ok(resumed.restored);assert.equal(resumed.state.player.activity,'tsukimi');
  for(let i=0;i<180;i++)resumed.step(1/60);
  assert.equal(resumed.state.player.hp,40);
  assert.ok(resumed.state.player.mp>=43);
  const tray=resumed.state.objects.find(o=>o.type==='tsukimi');
  assert.equal(tray.active,false);
  for(let i=0;i<660;i++)resumed.step(.1);
  assert.equal(tray.active,true);
  saved.version=3; saved.items.length=48; saved.bikes.length=10;
  const legacy=createGame(saved);
  assert.ok(legacy.restored);assert.equal(legacy.state.objects.at(-1).active,true);
});
