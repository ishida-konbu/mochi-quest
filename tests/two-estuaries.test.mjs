import test from 'node:test';
import assert from 'node:assert/strict';
import { WATER_Y, BRIDGES, bridgeHeight, riverZ, shoreDistance, terrainMeshHeight, waterDepth, waterSurfaceAt } from '../two/terrain.js';
import { BOATS } from '../two/shoreline.js';
import { RIVER_SKIFFS, RIVER_TRADE_PERIOD, SKIFF_SCALE, merchantPose } from '../two/traveller-positions.js';
import { createGame } from '../two/game.js';

const outlets=[
  {name:'桜川西口',start:-199,end:-254,centre:riverZ,channel:5},
  {name:'桜川東口',start:340,end:397,centre:riverZ,channel:5},
  {name:'楓峡の出口',start:340,end:397,centre:x=>-130+3.3*Math.sin((x-292)/15),channel:2},
];

test('each tidal outlet has a navigable bed in both physics and the painted terrain',()=>{
  for(const {name,start,end,centre,channel} of outlets){
    assert.ok(shoreDistance(end,centre(end))< -12,name);
    for(let x=Math.min(start,end);x<=Math.max(start,end);x+=.6){
      for(let across=-channel;across<=channel;across+=.5){
        const z=centre(x)+across;
        assert.equal(waterSurfaceAt(x,z),WATER_Y,name);
        assert.ok(waterDepth(x,z)>1 && WATER_Y-terrainMeshHeight(x,z)>1,name+' at '+[x,z]);
      }
    }
  }
});

test('a swimmer can leave each river mouth for the open sea without coming ashore',()=>{
  for(const {name,start,end,centre} of outlets){
    const game=createGame(), p=game.state.player, sign=Math.sign(end-start);
    Object.assign(p,{x:start,z:centre(start),y:WATER_Y-.57,h:0,inWater:true,grounded:true});
    for(let step=0;step<1200 && (end-p.x)*sign>0;step++){
      game.step(1/30,{x:sign,z:(centre(p.x+sign*2)-p.z)/2});
      assert.ok(p.inWater && !p.mount,name+' at '+[p.x,p.z]);
    }
    assert.ok((p.x-end)*sign>=0,name);
  }
});

test('loaded skiffs travel both directions through the bridges, clear the tied ferry, and turn offshore',()=>{
  const ferry=BOATS[0], routeSides=new Set(), bridgePasses=new Set();
  for(let t=0;t<RIVER_TRADE_PERIOD;t+=.28){
    const p=merchantPose(2,t), c=Math.cos(p.yaw), s=Math.sin(p.yaw);
    for(const [along,beam] of [[-2.98,.045],[-1.5,.69],[0,.86],[1.5,.69],[2.98,.045]]){
      for(const across of [-beam,beam]){
        const x=p.x+SKIFF_SCALE*(along*s+across*c),z=p.z+SKIFF_SCALE*(along*c-across*s);
        assert.ok(WATER_Y-terrainMeshHeight(x,z)>1,'shoal at '+[x,z]);
        const dx=x-ferry.x,dz=z-ferry.z;
        const side=dx*Math.cos(ferry.yaw)-dz*Math.sin(ferry.yaw),ends=dx*Math.sin(ferry.yaw)+dz*Math.cos(ferry.yaw);
        assert.ok(Math.abs(side)>ferry.width/2+.15 || Math.abs(ends)>ferry.length/2+.15,'tied ferry');
        for(const b of BRIDGES){
          if(b.maple || Math.abs(x-b.x)>b.halfWidth+.4)continue;
          bridgePasses.add(b.x+':'+Math.sign(s));
          // The transverse girders and the five sets of piles in bridge().
          assert.ok(bridgeHeight(b,z)-.55>p.y+2.1*SKIFF_SCALE+.30,'headroom');
          if(Math.abs(Math.abs(x-b.x)-(b.halfWidth-.13))<.30)
            for(const row of [1,4,7,10,13])
              assert.ok(Math.abs(z-b.z-b.length*(row/14-.5))>.7,'bridge pile');
        }
      }
    }
    for(let i=1;i<RIVER_SKIFFS.length;i++){
      const q=merchantPose(2+i,t);
      assert.ok(Math.hypot(q.x-p.x,q.z-p.z)>5.5,'passing hulls');
    }
    if(shoreDistance(p.x,p.z)< -12)routeSides.add(Math.sign(p.x));
  }
  assert.equal(bridgePasses.size,6);
  assert.equal(routeSides.size,2);
});
