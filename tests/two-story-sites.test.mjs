import assert from 'node:assert/strict';
import test from 'node:test';
import { createGame } from '../two/game.js';
import { REGIONS, canOccupy, groundHeight, waterSurfaceAt } from '../two/terrain.js';
import { STORY_SITES, storySite } from '../two/story-sites.js';
import { createStoryCollisions } from '../two/story-collisions.js';

test('the seventeen worktables and their satellite sites can be approached on the correct floor', () => {
  const game = createGame();
  for (const region of REGIONS) assert.ok(storySite(region.id), region.id);
  for (const site of STORY_SITES) {
    const {x,z,y,yaw,name} = site;
    const offsets = site.place==='rashomon' ? [[0,0]] : [[0,0],[-1,1.65],[0,1.65],[1,1.65]];
    for (const [u,v] of offsets) {
      const px=x+u*Math.cos(yaw)+v*Math.sin(yaw), pz=z-u*Math.sin(yaw)+v*Math.cos(yaw);
      const floor=groundHeight(px,pz,y+.4);
      assert.ok(Math.abs(floor-y)<.75 && canOccupy(px,pz,floor+.01,.27,1.65), name);
      assert.ok(waterSurfaceAt(px,pz,0,floor)<floor, name);
      Object.assign(game.state.player,{x:px,z:pz,y:floor});
      const original=game.nearest();
      assert.ok(!original || Math.hypot(u,v)<original.distance+.3, name+' '+original?.label);
    }
  }
  const ferry=storySite('river');
  assert.ok(Math.hypot(ferry.x,ferry.z-62)<4);
  assert.ok(storySite('ryugu').y< -30 && storySite('kyo','rashomon').y>10);
});

test('the hulls of the active display match its angle, height, and current inhabitants', () => {
  const bodies=createStoryCollisions();
  const table={x:4,y:-36,z:8,yaw:Math.PI/2,kind:'table'};
  const ox={x:12,y:2,z:6,yaw:0,kind:'person',species:'牛',name:'大吉'};
  bodies.update([table,ox]);
  assert.ok(bodies.penetration(4,9.1,-36,1.6,.25)>0);
  assert.equal(bodies.penetration(5,8,-36,1.6,.25),0);
  assert.equal(bodies.penetration(4,8,-34,1.6,.25),0);
  assert.equal(bodies.penetration(4,8,-39,1.6,.25),0);
  const notice={};
  assert.ok(bodies.penetration(12,6.9,2,1.6,.25,notice)>0);
  assert.equal(notice.person,'大吉');
  assert.equal(bodies.penetration(12.9,6,2,1.6,.25,notice),0);
  assert.equal(notice.person,null);
  assert.equal(bodies.penetration(12,6,5,1.6,.25),0);
  bodies.update([]);
  assert.equal(bodies.penetration(12,6,2,1.6,.25),0);
  assert.equal(bodies.penetration(4,8,-36,1.6,.25),0);
});
