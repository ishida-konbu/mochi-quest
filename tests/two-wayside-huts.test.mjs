import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sculpture } from '../two/pilgrimage-pigment.js';
import { dressFoundry } from '../two/goemon-foundry.js';
import { createGame } from '../two/game.js';
import { WAYSIDE_HUTS,KETTLE,GOEMON_SCREEN } from '../two/wayside-hut-layout.js';
import { sitePoint } from '../two/retreat-layout.js';
import { createPickupContacts } from '../two/pickup-contacts.js';
import { TREES, REGIONS, riverZ, riverHalfWidth, shoreDistance, nearRoad, terrainHeight, groundHeight, waterSurfaceAt, staticVolumeAt } from '../two/terrain.js';

function walk(game,[x,z]){
  const p=game.state.player;
  for(let i=0;i<160;i++){
    const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
    if(d<.12)break;
    game.step(1/60,{x:dx/d,z:dz/d});
  }
  assert.ok(Math.hypot(p.x-x,p.z-z)<.13,'walk to '+[x,z]+' from '+[p.x,p.z]);
}
function arrive(p,[x,z]){
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vz:0,vy:0,speed:0,activity:null,mount:null,grounded:true,hp:30,mp:20});
}

test('sparse rural clearings have walk-in huts in woodland and on dry beaches',()=>{
  const g=createGame(),p=g.state.player;
  for(const hut of WAYSIDE_HUTS){
    assert.ok(TREES.every(t=>Math.hypot(t.x-hut.x,t.z-hut.z)>8));
    assert.ok(REGIONS.every(r=>Math.hypot(r.x-hut.x,r.z-hut.z)>55));
    const shore=shoreDistance(hut.x,hut.z);
    assert.ok(hut.bath,'Every working hut shares its kettle: '+hut.name);
    if(hut.bank==='river'){
      const bank=Math.abs(hut.z-riverZ(hut.x))-riverHalfWidth(hut.x);
      assert.ok(bank>6 && bank<22,hut.name);
    }else if(hut.kind==='fisher')assert.ok(shore>6 && shore<22);
    else assert.ok(shore>30 && TREES.some(t=>Math.hypot(t.x-hut.x,t.z-hut.z)<25));
    assert.equal(nearRoad(hut.x,hut.z,4),false);
    arrive(p,sitePoint(hut,0,3.65));walk(g,sitePoint(hut,0,.5));
    assert.ok(Math.abs(p.y-terrainHeight(hut.x,hut.z)-(hut.kind==='fisher'?.52:.08))<.02);
    walk(g,sitePoint(hut,0,3.65));
  }
});

test('each iron bath admits a walker via its steps and restores a saved bather who can walk out again',()=>{
  const g=createGame(),p=g.state.player;
  for(const hut of WAYSIDE_HUTS.filter(site=>site.bath)){
    const b=hut.bath,approach=sitePoint(b,0,4.15),base=terrainHeight(hut.x,hut.z);
    arrive(p,approach);g.step(.02);
    assert.notEqual(g.nearest()?.target.goemon,hut);
    walk(g,[b.x,b.z]);assert.equal(g.nearest()?.target.goemon,hut);
    assert.ok(Math.abs(p.y-base-KETTLE.board)<.01);
    assert.ok(Math.abs(waterSurfaceAt(b.x,b.z)-base-KETTLE.water)<.01);
    g.act('interact');assert.equal(p.activity,'bath');
    const resumed=createGame(g.save());assert.ok(resumed.restored);
    const bather=resumed.state.player;
    for(let i=0;i<37;i++)resumed.step(.1);
    assert.equal(bather.activity,null);assert.equal(bather.hp,100);assert.equal(bather.mp,100);
    walk(resumed,approach);assert.ok(Math.abs(bather.y-groundHeight(...approach))<.05);
    for(let i=0;i<37;i++)g.step(.1);
    walk(g,approach);
  }
});

test('a journal with the original 64-item inventory keeps its progress when the iron baths are added',()=>{
  const g=createGame(),save=g.save();
  save.version=10;save.items.length=64;save.score=420;
  const resumed=createGame(save);assert.ok(resumed.restored);
  assert.equal(resumed.state.score,420);
  assert.ok(resumed.state.objects.filter(o=>o.goemon).every(o=>o.active));
});

test('the cauldron has a solid lip around an open well and no freestanding spring furniture',()=>{
  const {objects}=createGame().state;
  for(const o of objects.filter(o=>o.goemon)){
    const {bath}=o.goemon,base=terrainHeight(o.goemon.x,o.goemon.z);
    assert.ok(staticVolumeAt(...sitePoint(bath,KETTLE.radius*KETTLE.widthScale,0),base+KETTLE.board+.02,.04,.18));
    assert.equal(staticVolumeAt(bath.x,bath.z,base+KETTLE.board+.02,.24,1.66),false);
    const contacts=createPickupContacts([o]);
    for(const [u,v] of [[-1.98,-1.1],[-.93,-1.1],[1.64,-.60]]){
      assert.equal(contacts(...sitePoint(bath,u,v),o.y+.02,1.66,.24),0,o.goemon.name);
    }
  }
  assert.ok(objects.filter(o=>o.type==='onsen').every(o=>o.grand||o.retreat||o.goemon));
});

// The furled sail and woven screens have a bent plan. Sample each bay on
// both sides to catch an inverted rotation or a scaled-twice footprint.
test('the kettle windbreak has two solid bays and a free path to the firemouth',()=>{
  for(const hut of WAYSIDE_HUTS){
    const feet=terrainHeight(hut.x,hut.z)+.72,scale=KETTLE.widthScale;
    for(let i=1;i<GOEMON_SCREEN.length;i++){
      const [a,b]=GOEMON_SCREEN.slice(i-1,i+1);
      for(const t of [.22,.5,.78]){
        const u=a[0]+t*(b[0]-a[0]),v=a[1]+t*(b[1]-a[1]);
        const solid=offset=>staticVolumeAt(...sitePoint(hut.bath,(u+offset)*scale,v*scale),feet,.04,.28);
        assert.equal(solid(0),true,hut.name+' screen');
        assert.equal(solid(-.29),false,hut.name+' kettle side');
        assert.equal(solid(.29),false,hut.name+' outer side');
      }
    }
    assert.equal(staticVolumeAt(...sitePoint(hut.bath,-1.65*scale,.02),feet,.22,.6),false,hut.name+' hearth');
  }
});


test('each fitted hearth has its own casting, its fire below the arch and its cover clear of the open well',()=>{
  const models=new Set();
  for(const site of WAYSIDE_HUTS){
    const art=sculpture(),fire=sculpture();
    dressFoundry(art,fire,site.id,site.kind,site.bank,site.variant);
    const geo=art.finish(),flame=fire.finish().getAttribute('position'),points=geo.getAttribute('position');
    assert.ok(geo.index.count/3<19000,site.name);
    assert.ok(geo.getAttribute('normal').array.every(Number.isFinite),site.name);
    models.add(createHash('sha256').update(points.array).digest('hex'));
    for(let i=0;i<flame.count;i++){
      assert.ok(flame.getX(i)<-.69 && Math.abs(flame.getZ(i))<.47 && flame.getY(i)<.47,site.name);
    }
    for(let i=0;i<points.count;i++)if(points.getY(i)>1.22){
      assert.ok(Math.hypot(points.getX(i),points.getZ(i))>.91,site.name+' covered the central bathing well');
    }
  }
  assert.equal(models.size,WAYSIDE_HUTS.length);
});
