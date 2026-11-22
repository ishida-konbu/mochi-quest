import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { SPECIES, recipientContact } from '../two/bestiary.js';
import { BUILDINGS, GATES, ORIGINAL_REGIONS, REGIONS, regionAt, nearRoad, groundHeight, terrainHeight } from '../two/terrain.js';
import { animalRadius, openGround, walkCircuit } from '../two/village-paths.js';
import { Euler, Vector3 } from '../two/vendor/three.module.min.js';
import { dragonPitch, dragonWave } from '../two/animal-motion.js';

test('the expanded recipient ledger preserves the original 691 entries and the two legends’ hundredfold score',()=>{
  const {state}=createGame();
  assert.equal(state.recipientTotal,861);
  const original=state.npcs.slice(0,691);
  assert.ok(original.every((n,i)=>n.id===n.type+'-'+i));
  assert.equal(new Set(state.npcs.map(n=>n.id)).size,state.recipientTotal);
  assert.deepEqual(Object.fromEntries(Object.keys(SPECIES).map(type=>[type,original.filter(n=>n.type===type).length])),
    {monkey:90,bird:40,fox:40,tiger:10,dragon:1,kirin:1,deer:32,boar:18,shishi:2});
  assert.equal(SPECIES.monkey.points,SPECIES.bird.points);
  assert.ok(10<SPECIES.bird.points && SPECIES.bird.points<SPECIES.fox.points && SPECIES.fox.points<SPECIES.tiger.points);
  assert.equal(SPECIES.dragon.points,1000);assert.equal(SPECIES.kirin.points,1000);
});

test('feeding circuits use gentle off-road ground from the river to both port hinterlands',()=>{
  const {npcs}=createGame().state;
  const grazers=npcs.filter(n=>!n.encounter && ['monkey','deer','fox','boar'].includes(n.type));
  assert.equal(grazers.length,180);
  const outer=grazers.filter(n=>ORIGINAL_REGIONS.every(r=>Math.hypot(n.homeX-r.x,n.homeZ-r.z)>55));
  assert.ok(outer.length>=135);
  for(const district of ['kyo','peach','inari','todaiji','tsuruga','sakai'])
    assert.ok(outer.some(n=>n.habitat===district),district);
  const point={};
  for(const n of grazers){
    assert.equal(n.habitat,REGIONS[regionAt(n.homeX,n.homeZ)].id);
    for(let j=0;j<16;j++){
      walkCircuit(n,j*Math.PI/8,point);
      const {x,z}=point;
      assert.ok(!nearRoad(x,z,animalRadius(n)),n.id);
      const dx=terrainHeight(x+1,z)-terrainHeight(x-1,z);
      const dz=terrainHeight(x,z+1)-terrainHeight(x,z-1);
      assert.ok(Math.hypot(dx,dz)<1.25,n.id);
    }
  }
});

test('notices intersect the actual airborne volume, and unique recipients and old scores survive save and transfer',()=>{
  // Replay a rising dragon and a faster level flight. Launches from the south
  // can chase a northbound dragon at almost the speed of the letter itself.
  for(const [type,flightSeed] of [['bird',1788458060],['dragon',3394068386],['dragon',3816266512]]){
    let game=createGame({...createGame().save(),flightSeed});
    const n=game.state.npcs.find(n=>n.type===type), p=game.state.player,scale=n.stature;
    Object.assign(p,{x:n.x,z:n.z-2,heading:0,y:n.y,h:n.y-groundHeight(n.x,n.z),grounded:false,mode:'habutae'});
    game.step(1/60);
    const wrongHeight=n.y-2;
    assert.equal(recipientContact(n,{x:n.x,y:wrongHeight,z:n.z-1},0,1,2),Infinity);
    const savedTime=game.state.time;
    function throwAtAltitude(side=1,missBy=0){
      const dragon=type==='dragon', range=dragon?3.5:2, heading=dragon?n.heading+side*Math.PI/2:0;
      const flightTime=dragon?(range-.65)/18:0;
      const x=n.x+Math.sin(n.heading)*n.speed*flightTime-range*Math.sin(heading);
      const z=n.z+Math.cos(n.heading)*n.speed*flightTime-range*Math.cos(heading);
      const height=n.y+(dragon?.54:.13)*scale+(n.verticalSpeed||0)*flightTime+missBy;
      Object.assign(p,{x,z,y:height-.93,h:height-.93-groundHeight(x,z),grounded:false,heading,vy:0});
      assert.ok(game.act('throw'));
      for(let i=0;i<25;i++)game.step(1/60);
    }
    throwAtAltitude(1,8);
    assert.equal(game.state.delivered.has(n.id),false,type+' missed above');
    assert.equal(game.state.score,0);
    throwAtAltitude();
    assert.equal(game.state.delivered.has(n.id),true,type);
    assert.equal(game.state.score,SPECIES[type].points);
    throwAtAltitude(-1);
    assert.ok(game.state.time>savedTime);
    assert.equal(game.state.delivered.size,1);
    assert.equal(game.state.score,2*SPECIES[type].points);
    const snap=game.save();game=createGame(snap);assert.ok(game.restored);assert.ok(game.state.delivered.has(n.id));
    delete snap.delivered;const legacy=createGame(snap);assert.ok(legacy.restored);assert.equal(legacy.state.score,snap.score);
    assert.equal(legacy.state.delivered.size,0);
  }
});

test('delivery to the last turtle unlocks Kagami once; duplicate and unknown IDs cannot unlock it',()=>{
  const base=createGame(),t=base.state.npcs.find(n=>n.type==='turtle'),snap=base.save();
  snap.delivered=base.state.npcs.filter(n=>n!==t).map(n=>n.id);
  snap.delivered.push(snap.delivered[0],'not-an-animal');
  const game=createGame(snap),p=game.state.player;
  assert.equal(game.state.delivered.size,game.state.recipientTotal-1);assert.equal(game.state.kagamiUnlocked,false);
  Object.assign(p,{x:t.x,z:t.z-1.45,y:t.y,h:0,heading:0});
  assert.ok(game.act('throw'));for(let i=0;i<15;i++)game.step(1/60);
  assert.ok(game.state.delivered.has(t.id));assert.ok(game.state.kagamiUnlocked);
  assert.ok(game.state.events.some(e=>e.text?.includes('全員に三条通知')));
  const saved=game.save();assert.ok(createGame(saved).state.kagamiUnlocked);
});

test('a completed historic delivery book retains the earned Kagami mode across new saves', () => {
  const game=createGame(), legacy=game.save();
  legacy.version=3;
  legacy.items.length=48; legacy.bikes.length=10;
  delete legacy.kagamiUnlocked;
  legacy.player.mode='kagami';
  legacy.delivered=game.state.npcs.slice(0,623).map(n=>n.id);
  const resumed=createGame(legacy);
  assert.equal(resumed.state.kagamiUnlocked,true);
  assert.equal(resumed.state.player.mode,'kagami');
  assert.equal(resumed.state.delivered.size,623);
  assert.equal(createGame(resumed.save()).state.kagamiUnlocked,true);
  assert.equal(createGame({...legacy,delivered:legacy.delivered.slice(1)}).state.kagamiUnlocked,false);
  assert.equal(createGame({...legacy,version:4}).state.kagamiUnlocked,false);
});

test('the mounted hare and its deer receive separate letters while travelling together', () => {
  const game=createGame(), hare=game.state.npcs.find(n=>n.ridesDeer), deer=hare.ridesDeer;
  const p=game.state.player;
  function deliverTo(n,height) {
    // Cross the saddle from the side, avoiding the deer's projecting neck.
    const dx=Math.cos(deer.heading),dz=-Math.sin(deer.heading);
    p.x=n.x-2*dx;p.z=n.z-2*dz;
    p.y=n.y+height-.93;
    p.h=p.y-groundHeight(p.x,p.z);
    p.heading=Math.atan2(dx,dz);p.vy=0;p.grounded=false;
    assert.ok(game.act('throw'));
    for(let i=0;i<24;i++) game.step(1/60);
  }
  deliverTo(deer,.69*deer.stature);
  assert.ok(game.state.delivered.has(deer.id));
  assert.ok(!game.state.delivered.has(hare.id));
  deliverTo(hare,1.39);
  assert.ok(game.state.delivered.has(hare.id));
  assert.ok(Math.hypot(deer.x-hare.x,deer.z-hare.z)<.14);
  assert.equal(deer.heading,hare.heading);
});

test('the ten tigers and two shishi patrol clear wild ranges away from roads, houses and shrine gates',()=>{
  const {state}=createGame();
  const cats=state.npcs.filter(n=>n.type==='tiger'||n.type==='shishi');
  const historicIds=[...Array.from({length:10},(_,i)=>'tiger-'+(611+i)),'shishi-673','shishi-674'];
  assert.deepEqual(cats.map(n=>n.id),historicIds);
  assert.equal(new Set(cats.filter(n=>n.type==='tiger').map(n=>n.habitat)).size,10);
  assert.deepEqual(cats.filter(n=>n.type==='shishi').map(n=>n.habitat),['snow','autumn']);
  for(const n of cats){
    const pad=animalRadius(n),point={};
    for(let j=0;j<120;j++){
      walkCircuit(n,2*Math.PI*j/120,point);
      const {x,z}=point;
      assert.ok(openGround(x,z,pad),n.id);
      assert.ok(!nearRoad(x,z,23+pad),n.id);
      for(const b of BUILDINGS){
        const dx=x-b.x,dz=z-b.z;
        const edgeX=Math.max(0,Math.abs(dx*b.cos-dz*b.sin)-b.w*.64);
        const edgeZ=Math.max(0,Math.abs(dx*b.sin+dz*b.cos)-b.d*.70);
        assert.ok(Math.hypot(edgeX,edgeZ)>47+pad,n.id);
      }
      assert.ok(GATES.every(g=>Math.hypot(x-g.x,z-g.z)>43+pad+g.w*.63),n.id);
      assert.ok(state.objects.every(o=>Math.hypot(x-o.x,z-o.z)>49+pad),n.id);
    }
  }
  const old=createGame().save();
  old.delivered=historicIds;
  assert.deepEqual([...createGame(old).state.delivered],historicIds);
});

test('a letter crosses the tilted dragon tail at its drawn height during a climb and a dive', () => {
  const n = { type:'dragon', x:415.2, y:38, z:91, heading:.97, stature:2.1, speed:5, wavePhase:1.7 };
  const sway = dragonWave(-2.86, n.wavePhase, {});
  for (const rise of [-4, 4]) {
    n.verticalSpeed = rise;
    const pitch = dragonPitch(n);
    assert.ok(pitch * rise < 0);
    const tail = new Vector3(-.59+sway.x, .60+sway.y, -2.86)
      .multiplyScalar(n.stature).applyEuler(new Euler(pitch, n.heading, 0, 'YXZ'));
    const target = { x:n.x+tail.x, y:n.y+tail.y, z:n.z+tail.z };
    for (const aim of [n.heading, n.heading+Math.PI/2]) {
      const dx=Math.sin(aim), dz=Math.cos(aim);
      const shot={x:target.x-3*dx, y:target.y, z:target.z-3*dz};
      assert.ok(recipientContact(n,shot,dx,dz,3) <= 3);
    }
    const level = { ...n, verticalSpeed:0 };
    assert.equal(recipientContact(level,target,1,0,0),Infinity);
  }
});
