import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { updateScrollResident } from '../two/scroll-encounters.js';
import { SEA_SPECIES, updateRyuguResident } from '../two/ryugu-residents.js';
import { animalRadius, openGround } from '../two/village-paths.js';
import { groundHeight, terrainHeight, solidHeightAt, WATER_Y } from '../two/terrain.js';
import { KYO_SCREENS, screenFold } from '../two/kyo-layout.js';
import { RYUGU, palaceSolid } from '../two/ryugu-layout.js';

test('the five new districts have playable encounters on clear ground and at swimmable depths',()=>{
  const {state}=createGame();
  const cast=state.npcs.filter(n=>n.encounter || n.seaResident);
  assert.deepEqual(Object.fromEntries(Object.entries(Object.groupBy(cast,n=>n.habitat)).map(([k,v])=>[k,v.length])),
    {kyo:8,peach:16,todaiji:15,inari:28,ryugu:24});
  for(const type of Object.keys(SEA_SPECIES)) assert.equal(cast.filter(n=>n.type===type).length,8);
  for(const n of cast) {
    for(let t=0;t<36;t+=.75) {
      if(n.seaResident) {
        updateRyuguResident(n,t);
        assert.ok(n.y>=terrainHeight(n.x,n.z) && n.y+SEA_SPECIES[n.type].center*n.stature<WATER_Y,n.id);
        assert.equal(Boolean(palaceSolid(n.x,n.z,n.y,terrainHeight(RYUGU.x,RYUGU.z),1.65*n.stature,.56*n.stature)),false,n.id);
      } else {
        updateScrollResident(n,t);
        assert.ok(openGround(n.x,n.z,animalRadius(n)),n.id);
        assert.equal(n.y,groundHeight(n.x,n.z),n.id);
      }
    }
  }
  const foxes=cast.filter(n=>n.habitat==='inari' && n.type==='fox');
  assert.ok(foxes.length>=20 && Math.max(...foxes.map(n=>n.y))-Math.min(...foxes.map(n=>n.y))>65);
});

test('new land and sea recipients accept a thrown letter and survive a save alongside the earlier book',()=>{
  for(const id of ['kyo-tea-1','peach-bout-1','todaiji-steps-1','inari-foot-1',
    'ryugu-seaTurtle-0','ryugu-bream-1','ryugu-octopus-2']) {
    const game=createGame(),p=game.state.player, n=game.state.npcs.find(n=>n.id===id);
    const sea=SEA_SPECIES[n.type], y=sea ? n.y+sea.center*n.stature-.93 : n.y;
    Object.assign(p,{x:n.x,z:n.z-2.4,y,h:0,heading:0,
      diveDepth:sea?WATER_Y-.57-y:0,inWater:!!sea,grounded:!sea});
    game.step(1/60);
    assert.ok(game.act('throw'));
    for(let i=0;i<18;i++)game.step(1/60);
    assert.ok(game.state.delivered.has(n.id),id);
    if(sea) assert.equal(game.state.score,sea.points);
    assert.ok(createGame(game.save()).state.delivered.has(n.id),id);
  }
  const old=createGame(), saved=old.save();
  saved.delivered=old.state.npcs.slice(0,691).map(n=>n.id);
  saved.kagamiUnlocked=true;saved.player.mode='kagami';
  const resumed=createGame(saved);
  assert.equal(resumed.state.delivered.size,691);
  assert.equal(resumed.state.player.mode,'kagami');
  assert.ok(resumed.state.kagamiUnlocked);
});

test('all four Kyoto folding screens stop the camera ray at the painted leaves',()=>{
  assert.equal(KYO_SCREENS.length,4);
  for(const {x,z,yaw,width,height} of KYO_SCREENS) {
    const base=terrainHeight(x,z);
    for(const t of [.08,.25,.45,.7,.9]) {
      const u=(t-.5)*width,v=screenFold(t);
      const px=x+Math.cos(yaw)*u+Math.sin(yaw)*v, pz=z-Math.sin(yaw)*u+Math.cos(yaw)*v;
      assert.ok(solidHeightAt(px,pz,.2,base+2.1)>=base+height+.34);
    }
  }
});
