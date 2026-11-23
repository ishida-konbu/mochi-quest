import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { SPECIES, legendDeliveryPoint, recipientContact } from '../two/bestiary.js';
import { BUILDINGS, GATES, nearRoad, groundHeight } from '../two/terrain.js';
import { animalRadius, openGround, walkCircuit } from '../two/village-paths.js';
import { batchActorParts } from '../two/actors.js';
import { kirinTouchdowns } from '../two/handscroll-beasts.js';
import { buildBeast, beastRig, poseBeast } from '../two/beast-art.js';
import { Euler, Group, MeshBasicMaterial, Vector3 } from '../two/vendor/three.module.min.js';
import { dragonLengthScale, dragonPhase, dragonPitch, dragonWave } from '../two/animal-motion.js';

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
      const dragon=type==='dragon', range=dragon?3.5:2;
      const bearing=dragon?n.heading+side*Math.PI/2:0, heading=Math.atan2(Math.sin(bearing),Math.cos(bearing));
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

test('the guide leads a winged player to a reachable point on each enlarged legend',()=>{
  const snapshot={...createGame().save(),flightSeed:32495,time:47};
  for(const [type,oldScale,factor] of [['dragon',4.2,2],['kirin',1.75,3]]) {
    const game=createGame(snapshot), n=game.state.npcs.find(n=>n.type===type), p=game.state.player;
    assert.ok(Math.abs(n.stature/oldScale-factor)<1e-8);
    const aim=legendDeliveryPoint(n,{});
    assert.equal(recipientContact(n,aim,1,0,0),0);
    const bearing=n.heading+Math.PI/2, heading=Math.atan2(Math.sin(bearing),Math.cos(bearing));
    const range=n.stature*.65+3;
    const along=n.speed*.28;
    const x=aim.x+along*Math.sin(n.heading)-range*Math.sin(heading);
    const z=aim.z+along*Math.cos(n.heading)-range*Math.cos(heading);
    const y=aim.y+(n.verticalSpeed||0)*.28-.93, h=y-groundHeight(x,z);
    assert.ok(h>0 && h<180);
    Object.assign(p,{x,y,z,h,grounded:false,heading,vy:0,mode:'habutae'});
    assert.equal(recipientContact(n,{x,y:y+.93,z},1,0,0),Infinity,'start outside the silhouette');
    assert.ok(game.act('throw'));
    for(let frame=0;frame<80 && !game.state.delivered.has(n.id);frame++)game.step(1/60);
    assert.ok(game.state.delivered.has(n.id),type);
    const resume=createGame(game.save());
    assert.ok(resume.state.delivered.has(n.id));
    assert.equal(resume.state.npcs.find(animal=>animal.id===n.id).stature,n.stature);
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

// Measure the same loft, ornamental brushes and articulated joints as the game.
function sculptedBeast(n) {
  const mesh=new Group(),ink=new MeshBasicMaterial();
  buildBeast(mesh,n.type,{
    group(parent,name,x=0,y=0,z=0) {
      const joint=new Group();
      joint.name=name;joint.position.set(x,y,z);parent.add(joint);
      return joint;
    },
    batch(...args) {
      const part=batchActorParts(...args);
      part.material=ink; // the geometry measurement needs no browser texture loader
      return part;
    },
  });
  const joints=beastRig(mesh,n), skin=mesh.getObjectByName(n.type==='dragon'?'龍の胴':'絵巻の一枚皮');
  mesh.updateMatrixWorld(true);
  return {mesh,joints,skin};
}

test('the first distant kirin steps onto the same four clouds as its articulated hooves',()=>{
  const distant=kirinTouchdowns.map(sole=>sole.clone());
  assert.equal(distant.length,4);
  sculptedBeast({type:'kirin',stature:SPECIES.kirin.stature});
  for(let leg=0;leg<4;leg++)
    assert.ok(distant[leg].distanceTo(kirinTouchdowns[leg])<1e-5,'touchdown of leg '+leg);
});

function drawnRings(skin) {
  const vertices=skin.geometry.attributes.position, rings=[];
  for(let start=0;start<vertices.count;start+=33) {
    const surface=Array.from({length:32},(_,k)=>skin.localToWorld(new Vector3().fromBufferAttribute(vertices,start+k)));
    const center=surface.reduce((sum,p)=>sum.add(p),new Vector3()).divideScalar(surface.length);
    const radius=Math.max(...surface.map(p=>p.distanceTo(center)));
    rings.push({center,radius,surface});
  }
  return rings;
}

function hindRing(joints,rings) {
  const hip=joints['hindClaw-1'].getWorldPosition(new Vector3());
  return rings.reduce((best,r,i)=>r.center.distanceTo(hip)<rings[best].center.distanceTo(hip)?i:best,0);
}

test('the modeled hide tapers smoothly over two thirds of the published hip-to-tip arc',()=>{
  const {joints,skin}=sculptedBeast({type:'dragon',stature:SPECIES.dragon.stature});
  const rings=drawnRings(skin), hip=hindRing(joints,rings), attachment=joints['hindClaw-1'].getWorldPosition(new Vector3());
  // Published hind attachment and centerline length, sampled in world metres
  // on the preceding production sculpt at t=.407. Measure the actual new mesh.
  assert.ok(attachment.distanceTo(new Vector3(-1.23575,8.48580,-20.20372))<.02);
  assert.ok(rings[hip].center.distanceTo(attachment)<.18);
  const uv=skin.geometry.attributes.uv;
  let length=0, previous, minInkSpacing=Infinity, maxInkSpacing=0;
  for(let i=1;i<=hip;i++) {
    const span=rings[i].center.clone().sub(rings[i-1].center), step=span.length();
    assert.ok(step>.01 && step<1.1,'distance between adjacent transverse sections: '+step);
    length+=step;
    const inkSpacing=(uv.getX(i*33)-uv.getX((i-1)*33))/step;
    minInkSpacing=Math.min(minInkSpacing,inkSpacing);maxInkSpacing=Math.max(maxInkSpacing,inkSpacing);
    if(i>3 && i<hip-12) {
      const tangent=rings[i+1].center.clone().sub(rings[i-1].center).normalize();
      for(const p of rings[i].surface) {
        const spoke=p.clone().sub(rings[i].center).normalize();
        assert.ok(Math.abs(tangent.dot(spoke))<.12,'the physical cross-section follows the curved spine');
      }
    }
    if(previous)assert.ok(previous.angleTo(span)<.5,'the bend must meet its neighbour smoothly');
    previous=span;
  }
  assert.ok(Math.abs(length-71.1844543*2/3)<.20,'rendered hip-to-tip arc in metres: '+length);
  assert.ok(minInkSpacing>0 && maxInkSpacing/minInkSpacing<1.08,'ink rows keep their spacing through the bend');
  assert.ok(rings[0].radius<.14 && rings[hip].radius>1.9);
  for(const [a,b] of [[0,.25],[.25,.5],[.5,.75],[.75,1]])
    assert.ok(rings[Math.round(hip*a)].radius<rings[Math.round(hip*b)].radius,'the posterior narrows toward the brush tip');
  const hipTangent=rings[hip].center.clone().sub(rings[hip-1].center);
  assert.ok(hipTangent.angleTo(rings[hip+1].center.clone().sub(rings[hip].center))<.3,'smooth join under the claws');
});

test('letters reach the moving hide up to its fine tip with clear air beyond the new tail',()=>{
  const n={type:'dragon',x:415.2,y:38,z:91,heading:.97,stature:SPECIES.dragon.stature,speed:5,phase:.23};
  const {mesh,joints,skin}=sculptedBeast(n), hip=hindRing(joints,drawnRings(skin));
  mesh.position.set(n.x,n.y,n.z);mesh.rotation.y=n.heading;
  const heading=n.heading+Math.PI/2, dx=Math.sin(heading), dz=Math.cos(heading);
  for(const rise of [-4,0,4]) for(const time of [0,1.37,2.9,4.4]) {
    n.verticalSpeed=rise;n.wavePhase=dragonPhase(time,n);
    poseBeast(joints,n,time);mesh.updateMatrixWorld(true);
    const rings=drawnRings(skin);
    const plume=mesh.getObjectByName('尾先の筆毛'), hairs=plume.geometry.attributes.position;
    for(let j=0;j<hairs.count;j+=11) {
      const point=plume.localToWorld(new Vector3().fromBufferAttribute(hairs,j));
      assert.equal(recipientContact(n,point,dx,dz,0),0,'the painted terminal brush accepts the letter');
    }
    for(let i=0;i<=hip;i++) {
      const {center,surface}=rings[i];
      for(let j=0;j<surface.length;j+=4)
        assert.equal(recipientContact(n,surface[j],dx,dz,0),0,'the outer scales accept a letter');
      const shot={x:center.x-2*dx,y:center.y,z:center.z-2*dz};
      assert.ok(recipientContact(n,shot,dx,dz,2)<=2,'a letter reaches drawn ring '+i);
      if(i) {
        const between=center.clone().lerp(rings[i-1].center,.5);
        assert.equal(recipientContact(n,between,dx,dz,0),0,'no gap between transverse sections');
      }
    }
    const end=rings[0].center, beyond=end.clone().sub(rings[1].center).normalize().multiplyScalar(1.5).add(end);
    assert.equal(recipientContact(n,beyond,dx,dz,0),Infinity,'a letter beyond the fine point misses');
    // The lowest turn of the previous long tail was at (-.65,.65,-6.27306).
    const oldZ=-6.27306, oldWave=dragonWave(oldZ,n.wavePhase,{});
    const former=new Vector3(-.65+oldWave.x,.65+oldWave.y,oldZ*dragonLengthScale)
      .multiplyScalar(n.stature).applyEuler(new Euler(dragonPitch(n),n.heading,0,'YXZ')).add(mesh.position);
    assert.equal(recipientContact(n,former,dx,dz,0),Infinity,'the old bend is empty sky');
  }
});
