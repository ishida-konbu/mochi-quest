import test from 'node:test';
import assert from 'node:assert/strict';
import {seeded} from '../two/terrain.js';
import {districtPoint} from '../two/geography.js';
import {dressRoadGravel} from '../two/world.js';

test('Kyoto avenues and their crossroads are free of loose gravel while the dirt lanes keep theirs',()=>{
  const stones=[];
  dressRoadGravel({part(shape,x,y,z,sx,sy,sz,color,yaw){ stones.push({x,z,sx,sz,yaw}); }},seeded(4321));
  const [cx,cz]=districtPoint('kyo',120,-424);
  for(const s of stones){
    const radius=Math.max(s.sx,s.sz), u=s.x-cx, v=s.z-cz;
    if(v>-54 && v<47) assert.ok(Math.abs(u)>4+radius,'loose rock on the north–south avenue');
    if(u>-58 && u<55) assert.ok(Math.abs(v)>3.5+radius,'loose rock on the east–west avenue');
  }
  // A dirt-lane stone generated after the main avenues retains the old
  // position, diameter and orientation even when intervening stones are culled.
  const laneStone=stones.find(s=>Math.abs(s.x-216.907118)<.00001 && Math.abs(s.z+863.45)<.00001);
  assert.ok(laneStone);
  assert.ok(Math.abs(laneStone.sx-.3182175)<.00001 && Math.abs(laneStone.yaw-3.1514981)<.00001);
  assert.ok(stones.filter(s=>Math.abs(s.x-cx)<100 && Math.abs(s.z-cz)<85).length>200);
});
