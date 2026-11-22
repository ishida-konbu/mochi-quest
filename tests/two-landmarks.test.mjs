import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { BUILDINGS, terrainHeight, groundHeight, SNOW_SPRING, TSUKIMI, waterDepth, waterSurfaceAt } from '../two/terrain.js';

import { RASHOMON } from '../two/kyo-layout.js';

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
  trips.push({site:RASHOMON,level:RASHOMON.base,steps:[[9.52,5.2],[9.52,-4.12],[5.35,-4.03],[5.05,-3.25],[5.02,-.85],[-2.58,-.15]]});
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
