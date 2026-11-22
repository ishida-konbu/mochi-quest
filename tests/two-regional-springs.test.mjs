import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { Group } from '../two/vendor/three.module.min.js';
import { regionalSpringBank } from '../two/regional-bath-art.js';
import { addSpringSurface } from '../two/spring-water.js';
import { VILLAGE_WATER_HEIGHT } from '../two/village-baths.js';
import { REGIONS, groundHeight, regionAt, terrainHeight, terrainMeshHeight, waterSurfaceAt } from '../two/terrain.js';
import { RETREATS, bathRadius, sitePoint, springLip } from '../two/retreat-layout.js';

// The last v11 release stored these slots by index, including its eight outdoor
// iron cauldrons. Bath names and the new regional survey can change independently.
const historicTypes=[
  ...Array(6).fill(['onsen','manga','sake','ramen','haramaki','port']).flat(),
  'onsen','sake','port','manga','haramaki','port','sake','manga','port','ramen','haramaki','port',
  'onsen','tsukimi','port','port','port','port','kyoTea','mitarashi',
  ...Array(6).fill('onsen'),'port','port',...Array(8).fill('onsen'),
];
const historicIds=historicTypes.map((type,i)=>type+'-'+i);
const regional=()=>RETREATS.filter(s=>s.regional);

function arrive(game,x,z){
  const p=game.state.player;
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vy:0,vz:0,speed:0,grounded:true});
  game.step(1/60);
}
function walk(game,destination,label){
  const p=game.state.player;
  for(let i=0;i<300;i++){
    const dx=destination[0]-p.x,dz=destination[1]-p.z,range=Math.hypot(dx,dz);
    if(range<.14)return;
    game.step(1/60,{x:dx/range,z:dz/range});
  }
  assert.fail(label+' stopped at '+[p.x,p.z]+' heading to '+destination);
}

const retiredIds=new Set(['onsen-58','onsen-64']);
test('the spring inventory preserves the historical IDs around the retired trail baths',()=>{
  const {objects}=createGame().state;
  const old=objects.filter(o=>!o.retreat?.regional);
  assert.deepEqual(old.map(o=>o.id),historicIds.filter(id=>!retiredIds.has(id)));
  const oldSprings=old.filter(o=>o.type==='onsen'),springs=objects.filter(o=>o.type==='onsen');
  const added=springs.filter(o=>o.retreat?.regional);
  assert.equal(oldSprings.length,20);
  assert.equal(oldSprings.filter(o=>o.goemon).length,7);
  assert.equal(springs.length,41);
  assert.equal(added.length,21);
  for(const o of added)assert.equal(o.id,'onsen-'+o.retreat.id);
  assert.deepEqual(new Set(added.map(o=>o.retreat)),new Set(regional()));
  assert.equal(new Set(objects.map(o=>o.id)).size,objects.length);
  const names=new Set(added.map(o=>o.retreat.name));
  assert.ok(!names.has(undefined) && !names.has('') && names.size===added.length);
});

test('regional basins have distinct shorelines, continuous water and a dry approach',()=>{
  const sites=regional(),regions=new Set(),profiles=new Set();
  for(const s of sites){
    const level=waterSurfaceAt(s.x,s.z);
    const region=REGIONS[regionAt(s.x,s.z)].id;
    assert.equal(s.region,region,s.name+' belongs to its map district');
    regions.add(region);
    const lip=Array.from({length:24},(_,i)=>springLip(s.index,i*Math.PI/12));
    profiles.add(lip.map(r=>r.toFixed(2)).join(','));
    for(let j=0;j<lip.length;j++){
      const a=j*Math.PI/12, u=Math.cos(a)*s.rx*lip[j],v=Math.sin(a)*s.rz*lip[j];
      const rim=sitePoint(s,u,v), wet=sitePoint(s,u*.48,v*.48);
      assert.ok(Math.abs(bathRadius(s,...rim)-1)<1e-6,s.name+' rim');
      assert.ok(Math.abs(waterSurfaceAt(...wet)-level)<.01,s.name+' waterline');
      assert.ok(level-terrainHeight(...wet)>.13,s.name+' depth');
      // The rendering lattice is coarser than the analytic player footing.
      assert.ok(level>terrainMeshHeight(...wet),s.name+' water hidden under terrain mesh');
    }
    const path=sitePoint(s,0,s.rz*lip[6]+3.3);
    assert.ok(bathRadius(s,...path)>1.07,s.name+' entrance is outside the bathing area');
    assert.ok(terrainHeight(...path)>=waterSurfaceAt(...path)-.04,s.name+' dry approach');
  }
  assert.deepEqual(regions,new Set(REGIONS.filter(r=>r.id!=='ryugu').map(r=>r.id)));
  assert.ok(profiles.size>=10,'distinct shorelines across the island');
});

test('the visible bank meets the water at every vertex and beds into the hillside',()=>{
  for(const s of regional()){
    const level=waterSurfaceAt(s.x,s.z),pool=new Group();
    addSpringSurface(pool,s.rx,s.rz,0,s);
    const water=pool.children[0].geometry.attributes.position;
    const bank=regionalSpringBank(s,level).attributes.position;
    const segments=water.count-2,stride=segments+1;
    for(let i=0;i<segments;i++){
      const j=1+(segments-i)%segments,rim=stride+i,outer=bank.count-stride+i;
      const dx=bank.getX(rim)-s.rx*water.getX(j),dz=bank.getZ(rim)-s.rz*water.getZ(j);
      assert.ok(Math.hypot(dx,dz)<.001,s.name+' shared shoreline');
      assert.ok(bank.getY(i)<0 && bank.getY(rim)>0 && bank.getY(rim)<.01,s.name+' water contact');
      const ground=terrainMeshHeight(...sitePoint(s,bank.getX(outer),bank.getZ(outer)));
      assert.ok(Math.abs(level+bank.getY(outer)-ground+.05)<.001,s.name+' outside edge below ground');
    }
  }
});

test('a walker enters, bathes, resumes, leaves and bathes again at every regional spring',()=>{
  const sites=regional();
  assert.equal(sites.length,21);
  for(const s of sites){
    const game=createGame(),p=game.state.player;
    const entry=sitePoint(s,0,s.rz*springLip(s.index,Math.PI/2)+3.3);
    arrive(game,...entry);
    assert.notEqual(game.nearest()?.target.retreat,s,s.name+' interaction outside');
    walk(game,[s.x,s.z],s.name+' entrance');
    assert.ok(p.inWater,s.name+' swimming line');
    assert.equal(game.nearest()?.target.retreat,s,s.name+' marked pool');
    const id=game.nearest().target.id;
    p.hp=17;p.mp=26;
    assert.ok(game.act('interact'),s.name);
    assert.equal(p.activity,'bath');
    game.step(.1);
    const snapshot=game.save(),back=createGame(snapshot);
    assert.ok(back.restored,s.name+' journal');
    assert.equal(snapshot.lastBath,id);
    assert.equal(p.bathWaterY,waterSurfaceAt(s.x,s.z));
    assert.equal(back.state.player.bathWaterY,p.bathWaterY);
    assert.ok(!Object.hasOwn(snapshot.player,'bathWaterY'));
    assert.equal(back.state.player.activity,'bath');
    assert.equal(back.save().lastBath,id);
    for(let i=0;i<38;i++)back.step(.1);
    assert.equal(back.state.player.activity,null);
    assert.equal(back.state.player.bathWaterY,undefined);
    assert.equal(back.state.player.hp,100);assert.equal(back.state.player.mp,100);
    assert.ok(back.state.player.buffs.warm>0);
    assert.notEqual(back.nearest()?.target.id,id,s.name+' no repeated bath while still seated');
    walk(back,entry,s.name+' exit');
    assert.equal(back.save().lastBath,null);
    walk(back,[s.x,s.z],s.name+' return');
    assert.equal(back.nearest()?.target.id,id);
    assert.ok(back.act('interact'));assert.equal(back.state.player.activity,'bath');
  }
});

test('the original village baths still welcome walkers automatically and rearm on leaving',()=>{
  const game=createGame(),p=game.state.player;
  const villages=game.state.objects.filter(o=>o.type==='onsen' && !o.retreat && !o.goemon && !o.grand);
  assert.equal(villages.length,7);
  assert.equal(new Set(villages.map(o=>o.villageBath?.name)).size,7);
  assert.equal(new Set(villages.map(o=>o.villageBath?.shape)).size,7);
  const outlines=new Set();
  for(const o of villages){
    const tub=o.villageBath;
    assert.equal(tub.region,REGIONS[regionAt(o.x,o.z)].id,o.id);
    assert.ok(tub.rx>0 && tub.rz>0 && tub.name,o.id);
    const radii=Array.from({length:32},(_,i)=>tub.lip(i*Math.PI/16));
    assert.ok(radii.every(r=>Number.isFinite(r) && r>0),tub.name);
    outlines.add(radii.map(r=>r.toFixed(3)).join(','));
    const approach=[o.x,o.z+3.75];
    arrive(game,...approach);
    walk(game,[o.x,o.z],o.id);
    assert.equal(p.activity,'bath',o.id);
    assert.equal(p.bathWaterY,o.y+VILLAGE_WATER_HEIGHT,o.id);
    assert.equal(createGame(game.save()).state.player.bathWaterY,p.bathWaterY,o.id+' resumed tub');
    assert.equal(game.save().lastBath,o.id);
    for(let i=0;i<37;i++)game.step(.1);
    walk(game,approach,o.id+' exit');
    assert.equal(game.save().lastBath,null,o.id);
  }
  assert.equal(outlines.size,7,'the original village waters have seven locally drawn rims');
});

test('an original v11 inventory and an in-progress Goemon bath retain their meaning on a round trip',()=>{
  const game=createGame(),snap=game.save(),hut=game.state.objects.find(o=>o.id==='onsen-71');
  assert.equal(historicIds.length,72);
  assert.ok(hut.goemon);
  assert.equal(snap.version,11);
  assert.equal(snap.items.length,historicIds.length);
  const originalItems=historicTypes.map((t,i)=>['sake','ramen','manga','haramaki'].includes(t)?i*.65+.5:0);
  snap.items=originalItems.slice();snap.score=2130;snap.lastBath=hut.id;
  Object.assign(snap.player,{x:hut.x,z:hut.z,y:groundHeight(hut.x,hut.z),activity:'bath',activityTime:1.8,h:0});
  const restored=createGame(snap);
  assert.ok(restored.restored);assert.equal(restored.state.score,2130);
  assert.equal(restored.state.player.bathWaterY,waterSurfaceAt(hut.x,hut.z));
  for(const [i,id] of historicIds.entries()){
    const o=restored.state.objects.find(o=>o.id===id);
    if(retiredIds.has(id))assert.equal(o,undefined,id);
    else assert.equal(o.cooldown,originalItems[i],id);
  }
  assert.ok(restored.state.objects.filter(o=>o.retreat?.regional).every(o=>o.active && o.cooldown===0));
  const again=restored.save();
  assert.deepEqual(again.items,originalItems);
  assert.deepEqual(again.bikes,snap.bikes);
  assert.equal(again.lastBath,'onsen-71');
  assert.equal(again.player.activity,'bath');
  assert.equal(createGame(again).save().lastBath,'onsen-71');
});
