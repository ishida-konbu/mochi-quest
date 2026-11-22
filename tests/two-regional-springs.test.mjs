import { kilnSteamBath,steamRoom } from '../two/pilgrim-bathing-plan.js';
import { bathPools,bathStations,poolLip,isDryTreatment } from '../two/bath-places.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { Group } from '../two/vendor/three.module.min.js';
import { regionalSpringBank } from '../two/regional-bath-art.js';
import { addSpringSurface } from '../two/spring-water.js';
import { bankSculpture } from '../two/main-bath-art.js';
import { tableauFooting } from '../two/main-bath-rims.js';
import { KYO_SCREENS } from '../two/kyo-layout.js';
import { SAZAE_SPRING,SAZAE_POOL } from '../two/ryugu-shell-bath.js';
import { WAYSIDE_HUTS } from '../two/wayside-hut-layout.js';
import { REGIONS, SNOW_SPRING, groundHeight, regionAt, staticVolumeAt, terrainHeight, terrainMeshHeight, springLevel,waterSurfaceAt } from '../two/terrain.js';
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

const retiredIds=new Set([0,6,12,18,24,30,36,58,64].map(i=>'onsen-'+i));
test('walk from the upper palace boards into the shell, resume the soak, and step back out',()=>{
  const s=SAZAE_SPRING,game=createGame(),p=game.state.player;
  const [x,z]=sitePoint(s,0,4);
  Object.assign(p,{x,z,y:s.level,h:0,grounded:true,hp:16,mp:12});
  game.step(1/60);
  assert.equal(p.inWater,false);
  walk(game,[s.x,s.z],'nacre treads to the bath seat');
  assert.ok(p.inWater && p.grounded);
  assert.equal(game.nearest()?.place,SAZAE_POOL);
  assert.equal(p.activity,null);
  assert.ok(game.act('interact'));
  game.step(.1);
  const reopened=createGame(game.save()),bather=reopened.state.player;
  assert.ok(reopened.restored);
  assert.equal(bather.bathPose.id,'sazae-mouth');
  assert.equal(bather.bathPose.action,'jar');
  assert.equal(bather.bathWaterY,waterSurfaceAt(bather.x,bather.z,0,bather.y));
  assert.notEqual(bather.bathWaterY,waterSurfaceAt(bather.x,bather.z,0,s.level-5));
  for(let i=0;i<36;i++)reopened.step(.1);
  assert.equal(bather.hp,100);assert.equal(bather.mp,100);
  walk(reopened,[x,z],'shell treads back to the dry upper gallery');
  assert.equal(bather.inWater,false);
  assert.equal(bather.y,s.level);
  assert.equal(reopened.save().lastBath,null);
});

test('the spring inventory preserves the historical IDs around the retired trail baths',()=>{
  const {objects}=createGame().state;
  const old=objects.filter(o=>historicIds.includes(o.id));
  assert.deepEqual(old.map(o=>o.id),historicIds.filter(id=>!retiredIds.has(id)));
  const springs=objects.filter(o=>o.type==='onsen' && !o.goemon);
  const mains=springs.filter(o=>o.rank==='main'),subs=springs.filter(o=>o.rank==='sub');
  assert.equal(mains.length,17);
  assert.deepEqual(new Set(mains.map(o=>o.region)),new Set(REGIONS.map(r=>r.id)));
  assert.equal(subs.length,11);
  for(const s of subs){
    assert.ok(mains.every(m=>Math.hypot(s.x-m.x,s.z-m.z)>60),s.id+' away from main baths');
    assert.ok(s.retreat.rx<=3.5 && s.retreat.rz<2.7,s.id+' small pool');
  }
  assert.equal(springs.length,mains.length+subs.length);
  assert.equal(objects.filter(o=>o.goemon).length,WAYSIDE_HUTS.length);
  const added=springs.filter(o=>o.retreat?.regional);
  for(const o of added)assert.equal(o.id,'onsen-'+o.retreat.id);
  assert.deepEqual(new Set(added.map(o=>o.retreat)),new Set(regional()));
  assert.equal(new Set(objects.map(o=>o.id)).size,objects.length);
  const names=new Set(added.map(o=>o.retreat.name));
  assert.ok(!names.has(undefined) && !names.has('') && names.size===added.length);
});

test('the Kyoto inkstone opens to the east-west avenue in front of the dumpling screen',()=>{
  const s=regional().find(q=>q.id==='capital-suzuri');
  const screen=KYO_SCREENS.find(q=>q.picture===1);
  const dx=s.x-screen.x,dz=s.z-screen.z,c=Math.cos(screen.yaw),k=Math.sin(screen.yaw);
  const across=dx*c-dz*k,forward=dx*k+dz*c;
  assert.ok(Math.abs(across)<screen.width/2,'the inkstone sits in front of the screen');
  assert.ok(forward>s.rz+.8 && forward<12,'the screen and bath share the town lot');
  const game=createGame(),avenue=REGIONS.find(r=>r.id==='kyo').z;
  arrive(game,s.x,avenue);
  walk(game,[s.x,s.z],'main avenue to the inkstone');
  assert.ok(game.state.player.inWater);
  assert.equal(game.nearest()?.target.retreat,s);
  assert.ok(game.act('interact'));
});

test('a Kyoto soak follows the inkstone into the city, while other visitors keep their footing',()=>{
  const original=createGame(),s=regional().find(q=>q.id==='capital-suzuri');
  const destination='onsen-'+s.id;
  const x=122.14,z=-910.97; // Inside the former inkstone, off its centre.
  for(const edition of [11,12]){
    const old=original.save();
    Object.assign(old.player,{x,z,y:groundHeight(x,z),activity:'bath',activityTime:1.85,hp:38,mp:47});
    Object.assign(old,{version:edition,lastBath:destination,score:360});
    const resumed=createGame(old),p=resumed.state.player;
    assert.ok(resumed.restored);
    assert.deepEqual([p.x,p.z,p.activity,p.activityTime,p.hp,p.mp,resumed.state.score],
      [s.x,s.z,'bath',1.85,38,47,360]);
    assert.equal(p.bathWaterY,waterSurfaceAt(s.x,s.z));
    assert.equal(resumed.save().lastBath,destination);
    const again=createGame(resumed.save());
    assert.deepEqual([again.state.player.x,again.state.player.z],[s.x,s.z]);
    for(let i=0;i<20;i++)again.step(.1);
    assert.equal(again.state.player.activity,null);
    assert.deepEqual([again.state.player.hp,again.state.player.mp],[100,100]);
    for(const [activity,lastBath] of [[null,destination],['bath',null],['bath','onsen-shrine-sasafune']]){
      const other=createGame({...old,player:{...old.player,activity},lastBath}).state.player;
      assert.deepEqual([other.x,other.z],[x,z]);
      assert.equal(other.activity,null);
    }
  }
});

test('regional basins have distinct shorelines, continuous water and a dry approach',()=>{
  const sites=regional(),regions=new Set(),profiles=new Set();
  for(const s of sites){
    const level=springLevel(s);
    const region=REGIONS[regionAt(s.x,s.z)].id;
    assert.equal(s.region,region,s.name+' belongs to its map district');
    regions.add(region);
    const lip=Array.from({length:24},(_,i)=>springLip(s.index,i*Math.PI/12));
    profiles.add(lip.map(r=>r.toFixed(2)).join(','));
    const pools=bathPools(s);
    if(pools){
      for(const p of pools)for(let i=0;i<32;i++){
        const a=i*Math.PI/16,r=.66*poolLip(p,a);
        const wet=sitePoint(s,p.u+r*p.rx*Math.cos(a),p.v+r*p.rz*Math.sin(a));
        assert.equal(waterSurfaceAt(...wet),level+p.y,p.name+' surveyed water level');
        assert.ok(terrainHeight(...wet)<level+p.y-.15,p.name+' depth');
        assert.ok(terrainMeshHeight(...wet)<level+p.y,p.name+' unobscured surface');
      }
      if(!pools.length)assert.ok(waterSurfaceAt(s.x,s.z)<terrainHeight(s.x,s.z),s.name+' dry room');
    }else for(let j=0;j<lip.length;j++){
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

test('each main bath has its own shoreline and a sculpted, solid scene above the water',()=>{
  const sites=[...regional().filter(s=>s.rank==='main'),SNOW_SPRING],profiles=new Set();
  for(const s of sites){
    const radii=Array.from({length:80},(_,i)=>{
      const angle=i*Math.PI/40;
      return (s.lip?s.lip(angle):springLip(s.index,angle)).toFixed(3);
    }).join(',');
    assert.ok(!profiles.has(radii),s.name+' has its own basin silhouette');
    profiles.add(radii);
    if(kilnSteamBath(s)){
      const level=springLevel(s),back=steamRoom.v-steamRoom.d/2;
      const hearth=sitePoint(s,0,back+.62),aisle=sitePoint(s,0,.30);
      assert.ok(staticVolumeAt(...hearth,level+.63),s.name+' solid steam furnace');
      assert.ok(waterSurfaceAt(...aisle)<level-.04,s.name+' dry brick floor');
      const old=tableauFooting(s,terrainHeight);
      assert.ok(!staticVolumeAt(old.x,old.z,level+.64),s.name+' retired outdoor jar footing is clear');
      continue;
    }
    const art=bankSculpture(s.kind);
    const {position,normal,color}=art.attributes;
    assert.ok(art.index.count && position.count===normal.count && position.count===color.count,s.name);
    for(const a of [position,normal,color])assert.ok(a.array.every(Number.isFinite),s.name+' renderable geometry');
    const footing=tableauFooting(s,terrainHeight);
    assert.ok(footing.ground>waterSurfaceAt(footing.x,footing.z),s.name+' carved scene is on the dry bank');
    assert.ok(staticVolumeAt(footing.x,footing.z,footing.ground),s.name+' carving has a physical footprint');
  }
});

test('the visible bank meets the water at every vertex and beds into the hillside',()=>{
  for(const s of regional()){
    const level=waterSurfaceAt(s.x,s.z),pool=new Group();
    addSpringSurface(pool,s.rx,s.rz,0,s);
    const pools=bathPools(s);
    if(pools){
      const water=pool.children.filter(q=>q.geometry.getAttribute('springInflow'));
      assert.equal(water.length,pools.length,s.name+' separate water surfaces');
      for(const [i,mesh] of water.entries()){
        const p=pools[i],points=mesh.geometry.attributes.position;
        assert.deepEqual(mesh.position.toArray(),[p.u,p.y,p.v]);
        for(let k=1;k<points.count;k++){
          const u=points.getX(k),v=points.getZ(k),a=Math.atan2(v,u);
          assert.ok(Math.abs(Math.hypot(u,v)-poolLip(p,a))<1e-5,p.name+' rendered water meets vessel');
        }
      }
      continue;
    }
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
      // The front opening gets walked and viewed at eye level. A vertical
      // cut face here makes a sunken spring look like a tub on a pedestal.
      if(Math.abs(i-segments/4)<=segments/20){
        for(let row=1;row<4;row++){
          const a=row*stride+i,b=a+stride;
          const run=Math.hypot(bank.getX(b)-bank.getX(a),bank.getZ(b)-bank.getZ(a));
          assert.ok(bank.getY(a)-bank.getY(b)<run*.38,s.name+' gently bedded front shore');
        }
      }
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
    const pools=bathPools(s),dest=pools?.[0];
    const end=dest?sitePoint(s,dest.u,dest.v):[s.x,s.z];
    const turn=dest?sitePoint(s,dest.u,s.rz+1):entry;
    walk(game,turn,s.name+' approach');
    walk(game,end,s.name+' entrance');
    for(let i=0;i<18;i++)game.step(1/60);
    assert.equal(p.inWater,pools?.length!==0,s.name+' wet or steam');
    assert.equal(game.nearest()?.target.retreat,s,s.name+' marked pool');
    const id=game.nearest().target.id;
    p.hp=17;p.mp=26;
    assert.ok(game.act('interact'),s.name);
    assert.equal(p.activity,'bath');
    game.step(.1);
    const snapshot=game.save(),back=createGame(snapshot);
    assert.ok(back.restored,s.name+' journal');
    assert.equal(snapshot.lastBath,id);
    assert.equal(p.bathWaterY,pools?.length===0?springLevel(s):waterSurfaceAt(...end,game.state.time));
    assert.equal(back.state.player.bathWaterY,p.bathWaterY);
    assert.ok(!Object.hasOwn(snapshot.player,'bathWaterY'));
    assert.equal(back.state.player.activity,'bath');
    assert.equal(back.save().lastBath,id);
    const remaining=back.state.player.activityTime;
    for(let i=0;i<=Math.ceil(remaining*10);i++)back.step(.1);
    assert.equal(back.state.player.activity,null);
    assert.equal(back.state.player.bathWaterY,undefined);
    assert.equal(back.state.player.hp,100);assert.equal(back.state.player.mp,100);
    assert.ok(back.state.player.buffs.warm>0);
    assert.notEqual(back.nearest()?.target.id,id,s.name+' no repeated bath while still seated');
    walk(back,turn,s.name+' exit aisle');
    walk(back,entry,s.name+' exit');
    assert.equal(back.save().lastBath,null);
    walk(back,turn,s.name+' return aisle');
    walk(back,end,s.name+' return');
    for(let i=0;i<18;i++)back.step(1/60);
    assert.equal(back.nearest()?.target.id,id);
    assert.ok(back.act('interact'));assert.equal(back.state.player.activity,'bath');
  }
});

test('running through any bath only offers the named action; legacy village soaks resume on dry ground',()=>{
  const g=createGame(),p=g.state.player;
  for(const o of g.state.objects.filter(o=>o.type==='onsen')){
    const pool=o.retreat && bathPools(o.retreat)?.[0];
    const [x,z]=pool?sitePoint(o.retreat,pool.u,pool.v):[o.x,o.z];
    Object.assign(p,{x,z,y:groundHeight(x,z,o.y),activity:null,invulnerable:2,grounded:true,h:0});
    g.step(1/60);
    assert.equal(p.activity,null,o.id+' waits for E');
    const choice=g.nearest();
    assert.equal(choice?.target,o,o.id+' offers an action');
    if(o.rank)assert.match(choice.label,o.rank==='main'?/主湯/:/脇湯/);
  }
  for(const [id,x,z] of [['onsen-0',-10,44],['onsen-18',131,-116],['onsen-36',-91,-299],['onsen-67',145.5,425.3]]){
    const journal=g.save();
    Object.assign(journal.player,{x,z,y:groundHeight(x,z),activity:'bath',activityTime:2});
    journal.lastBath=id;
    const restored=createGame(journal);
    assert.ok(restored.restored);
    assert.equal(restored.state.player.activity,null);
    assert.equal(restored.save().lastBath,null);
    assert.deepEqual([restored.state.player.x,restored.state.player.z],[x,z]);
  }
});

test('an original v11 inventory and an in-progress Goemon bath retain their meaning on a round trip',()=>{
  const game=createGame(),snap=game.save(),hut=game.state.objects.find(o=>o.id==='onsen-71');
  assert.equal(historicIds.length,72);
  assert.ok(hut.goemon);
  snap.version=11;
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

test('each treatment remembers the chosen vessel or seat and applies the appropriate recovery',()=>{
  const game=createGame(),empty=game.save(),p=game.state.player;
  for(const site of [...regional().filter(s=>s.rank==='main'),SNOW_SPRING]){
    for(const q of [...(bathPools(site)||[]),...bathStations(site)]){
      const [x,z]=sitePoint(site,q.u,q.v);
      arrive(game,x,z);p.hp=21;p.mp=12;p.buffs.warm=0;
      assert.equal(game.nearest()?.place,q,q.id+' selection');
      assert.equal(p.inWater,!isDryTreatment(q),q.id+' walking in water');
      assert.ok(game.act('interact'),q.id);
      game.step(.1);
      const saved=game.save(),back=createGame(saved);
      assert.equal(saved.lastBathPlace,q.id);
      assert.equal(back.state.player.bathPose.id,q.id);
      for(let i=0;i<16;i++)back.step(.1);
      const pose=back.state.player.bathPose;
      assert.equal(pose.action,q.action);
      assert.equal(pose.wet,!isDryTreatment(q));
      assert.ok([pose.x,pose.z,back.state.player.bathWaterY].every(Number.isFinite));
      if(['rinse','steam','deep','jar','seat','cascade','bamboo'].includes(q.action)){
        assert.equal(pose.recline,0);assert.ok(Number.isFinite(pose.seatY));
      }
      for(let i=0;i<26;i++){back.step(.1);game.step(.1);}
      for(let i=0;i<14;i++)game.step(.1);
      assert.equal(back.state.player.activity,null,q.id);
      assert.equal(back.state.player.hp,q.action==='rinse'?21:100,q.id+' recovery');
      assert.equal(back.state.player.buffs.warm>0,q.action!=='rinse');
      assert.ok(Math.hypot(x-back.state.player.x,z-back.state.player.z)<.01,q.id+' returns to original footing');
    }
  }
  const peach=regional().find(s=>s.kind==='peach' && s.rank==='main');
  const x=peach.x,z=peach.z,y=groundHeight(x,z);
  arrive(game,x,z);
  assert.equal(game.nearest()?.target.retreat,undefined,'between casks is dry');
  empty.lastBath='onsen-'+peach.id;Object.assign(empty.player,{x,y,z,activity:'bath',activityTime:1.45});
  const restored=createGame(empty);
  assert.ok(restored.state.player.bathPose.id.startsWith('orchard-'));
  assert.equal(restored.state.player.activityTime,1.45);
});

test('the harbor lock raises the bathing water and carries the floating body with the tide',()=>{
  const s=regional().find(q=>q.kind==='tsuruga' && q.rank==='main');
  const q=bathStations(s)[0],[x,z]=sitePoint(s,q.u,q.v);
  const game=createGame(),p=game.state.player;
  arrive(game,x,z);assert.ok(game.act('interact'));
  for(let i=0;i<18;i++)game.step(.1);
  game.state.time=0;
  const ebb=p.bathPose,low=waterSurfaceAt(x,z,0);
  game.state.time=Math.PI/.36;
  const flood=p.bathPose,high=waterSurfaceAt(x,z,game.state.time);
  assert.ok(high-low>.09 && high-low<.10);
  assert.equal(p.bathWaterY,high);
  assert.ok(Math.hypot(flood.x-ebb.x,flood.z-ebb.z)>.34);
  assert.deepEqual([p.x,p.z],[x,z]);
});
