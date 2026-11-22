import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { SCROLL_FAUNA, moveScrollFauna } from '../two/scroll-fauna.js';
import { recipientContact } from '../two/bestiary.js';
import { BUILDINGS, REGIONS, TREES, WATER_Y, groundHeight, terrainHeight, solidHeightAt, regionAt } from '../two/terrain.js';
import { RYUGU, palaceSolid } from '../two/ryugu-layout.js';
import { updateRyuguResident } from '../two/ryugu-residents.js';
import { DAIBUTSU } from '../two/pilgrimage-layout.js';
import { animalRadius, openGround } from '../two/village-paths.js';
import { Triangle, Vector3 } from '../two/vendor/three.module.min.js';
import { forestGeometry } from '../two/forest-mesh.js';

test('all eighty-two new recipients remain inside their own habitats throughout a circuit',()=>{
  const {state}=createGame(),newcomers=state.npcs.slice(794);
  assert.deepEqual(Object.fromEntries(Object.entries(Object.groupBy(newcomers,n=>n.type)).map(([type,ns])=>[type,ns.length])),
    {elephant:2,baku:10,hawk:10,ox:10,chicken:40,fishfolk:10});
  const musicians=state.npcs.filter(n=>n.seaResident);
  for(const n of newcomers)for(let t=0;t<85;t+=1.7){
    moveScrollFauna(n,t);
    if(n.type==='hawk')continue;
    if(n.type==='fishfolk'){
      assert.ok(Math.hypot(n.x-RYUGU.x,n.z-RYUGU.z)<20 && n.y+2.5*n.stature<WATER_Y,n.id);
      for(const o of musicians){
        updateRyuguResident(o,t);
        assert.ok(Math.hypot(o.x-n.x,o.y-n.y,o.z-n.z)>2.1,n.id+' / '+o.id);
      }
      assert.ok(!palaceSolid(n.x,n.z,n.y,terrainHeight(RYUGU.x,RYUGU.z),2.4*n.stature,.55*n.stature),n.id);
    }else{
      assert.ok(openGround(n.x,n.z,animalRadius(n)),n.id);
      if(n.type==='elephant')assert.ok(Math.hypot(n.x-DAIBUTSU.x,n.z-DAIBUTSU.z)<43);
      if(n.type==='chicken')assert.equal(REGIONS[regionAt(n.x,n.z)].id,'kyo');
      if(n.type==='baku'){
        assert.ok(terrainHeight(n.x,n.z)<25,n.id);
        assert.ok(BUILDINGS.every(b=>Math.hypot(n.x-b.x,n.z-b.z)>29+Math.max(b.w,b.d)),n.id);
      }
    }
  }
});

function fullBoughClearance(form,toe) {
  const g=forestGeometry(form),positions=g.attributes.position,uv=g.attributes.uv;
  const point=new Vector3(toe.x,toe.y,toe.z),nearest=new Vector3(),tri=new Triangle();
  let wood=Infinity,leaf=Infinity;
  for(let i=0;i<g.index.count;i+=3){
    const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2);
    tri.a.fromBufferAttribute(positions,a);tri.b.fromBufferAttribute(positions,b);tri.c.fromBufferAttribute(positions,c);
    tri.closestPointToPoint(point,nearest);
    const distance=point.distanceTo(nearest);
    // The forest atlas reserves its lower-right cell for the modeled bark.
    if(uv.getX(a)>.75 && uv.getY(a)<.25)wood=Math.min(wood,distance);
    else leaf=Math.min(leaf,distance);
  }
  g.dispose();
  return {wood,leaf};
}

test('hawks fly between distinct trees, land on the modeled branches and stay there frequently',()=>{
  const hawks=createGame().state.npcs.filter(n=>n.type==='hawk');
  const districts=new Set(),boughs=new Map();
  for(const n of hawks) {
    let flying=0,resting=0;
    for(const leg of n.route){
      const {tree,x,y,z}=leg.a,local=forestGeometry(tree.form,true),yaw=tree.seed*2.39996323;
      assert.ok(TREES.includes(tree));
      if(!boughs.has(tree.form))boughs.set(tree.form,fullBoughClearance(tree.form,local));
      const {wood,leaf}=boughs.get(tree.form);
      assert.ok(wood*tree.h<.016 && leaf*tree.h>.045,n.id);
      assert.ok(Math.abs(x-tree.x-tree.h*(Math.cos(yaw)*local.x+Math.sin(yaw)*local.z))<1e-7);
      assert.ok(Math.abs(z-tree.z-tree.h*(-Math.sin(yaw)*local.x+Math.cos(yaw)*local.z))<1e-7);
      assert.ok(Math.abs(y-terrainHeight(tree.x,tree.z)-tree.h*local.y)<1e-7);
      assert.ok(Math.hypot(leg.b.x-x,leg.b.z-z)>25);
    }
    let prior;
    for(let t=0;t<n.cycle;t+=.25){
      moveScrollFauna(n,t);
      assert.ok(n.y-Math.max(terrainHeight(n.x,n.z),solidHeightAt(n.x,n.z,.36))>.30,n.id);
      if(n.perched){
        resting++;districts.add(n.habitat);
        assert.ok(n.route.some(({a})=>Math.hypot(a.x-n.x,a.y-n.y,a.z-n.z)<1e-6));
      }else flying++;
      if(prior)assert.ok(Math.hypot(prior.x-n.x,prior.z-n.z,prior.y-n.y)<13,n.id);
      prior={x:n.x,y:n.y,z:n.z};
    }
    assert.ok(flying>0 && resting>flying*.30,n.id);
  }
  assert.ok(districts.size>=9);
});

test('notices reach each of the six new animals through the live game and journal',()=>{
  for(const [type,spec] of Object.entries(SCROLL_FAUNA)){
    const game=createGame(),n=game.state.npcs.find(n=>n.type===type),p=game.state.player;
    const target=n.y+spec.center*n.stature-.93, sea=type==='fishfolk',x=n.x,z=n.z-1.6;
    Object.assign(p,{x,z,heading:0,y:target,h:sea?0:Math.max(0,target-groundHeight(x,z)),grounded:false,
      diveDepth:sea?WATER_Y-.57-target:0,inWater:sea,mode:'habutae',vy:0});
    game.step(1/60);assert.ok(game.act('throw'));
    for(let j=0;j<13;j++)game.step(1/60);
    assert.ok(game.state.delivered.has(n.id),type);
    assert.equal(game.state.score,spec.points);
    assert.ok(createGame(game.save()).state.delivered.has(n.id));
  }
  const hawk={type:'hawk',x:0,y:15,z:0,heading:0,stature:1,spread:1,bank:0};
  const wing={x:1.0,y:15.43,z:-.13};
  assert.equal(recipientContact(hawk,wing,0,1,.1),0);
  assert.equal(recipientContact({...hawk,spread:0},wing,0,1,.1),Infinity);
});

test('the complete fifth-edition scroll retains Kagami when opened with the new animals',()=>{
  const game=createGame(),snap=game.save();
  snap.version=5;snap.items.length=56;snap.bikes.length=14;
  snap.delivered=game.state.npcs.slice(0,794).map(n=>n.id);
  delete snap.kagamiUnlocked;
  const restored=createGame(snap);
  assert.ok(restored.restored);
  assert.ok(restored.state.kagamiUnlocked);
  assert.equal(restored.state.delivered.size,794);
  assert.equal(createGame({...snap,delivered:snap.delivered.slice(1)}).state.kagamiUnlocked,false);
});
