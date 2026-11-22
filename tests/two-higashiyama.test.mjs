import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../two/geography.js';
import { HIGASHIYAMA, KITAYAMA, KYO_LOOKOUTS, eastRidgeHeight, northRidgeHeight, westRidgeHeight, fukuFirebeds, daiFirebeds, FIRE_DRAWINGS, FIRE_TRAILS, inFireMeadow, fireTrailDistance } from '../two/higashiyama.js';
import { CONNECTING_ROADS, TREES, nearRoad, shoreDistance, solidHeightAt, terrainHeight, terrainMeshHeight } from '../two/terrain.js';
import { canopyHeight } from '../two/village-paths.js';
import { createGame } from '../two/game.js';

for(const east of [true,false]){
  const name=east?'Higashiyama':'Kitayama',summit=east?HIGASHIYAMA:KITAYAMA;
  const height=east?eastRidgeHeight:northRidgeHeight;
  const point=(forward,across)=>[summit.x+(east?forward:across),summit.z+(east?across:-forward)];
  test(name+' rises gradually from a broad skirt into a high, wooded divide',()=>{
    const heightAt=(forward,across=0)=>terrainHeight(...point(forward,across));
    assert.ok(Math.hypot(summit.x-DISTRICTS.kyo.x,summit.z-DISTRICTS.kyo.z)>350);
    const cityFloor=terrainHeight(DISTRICTS.kyo.x,DISTRICTS.kyo.z);
    const relief=heightAt(0)-cityFloor;
    assert.ok(east ? relief>149 && relief<155 : relief>137 && relief<142);
    assert.ok(heightAt(-263)<18);
    assert.ok(heightAt(-210)>22 && heightAt(-210)<52);
    assert.ok(heightAt(-135)>61 && heightAt(-135)<80);
    for(const v of [-162,158])assert.ok(heightAt(0,v)>78,'outer spur '+v);
    for(let d=-266;d<0;d+=4){
      assert.ok(Math.abs(heightAt(d+4)-heightAt(d))/4<1.06,'sudden escarpment at '+d);
      assert.ok(shoreDistance(...point(d,0))>20,'interrupted apron at '+d);
    }
    assert.ok(TREES.filter(t=>height(t.x,t.z)>10).length>175);
  });
}

test('the western divide rises over Kyoto and leaves the Sakai pass at its surveyed grade',()=>{
  const {x,z}=KYO_LOOKOUTS[2],city=DISTRICTS.kyo;
  const relief=terrainHeight(x,z)-terrainHeight(city.x,city.z);
  assert.ok(relief>90 && relief<94);
  assert.ok(TREES.filter(t=>westRidgeHeight(t.x,t.z)>10).length>300);
  for(const road of CONNECTING_ROADS)for(const [x,z] of road.points){
    assert.equal(westRidgeHeight(x,z),0,road.destination);
  }
});

test('the 福 and 大 firebeds make complete brushstrokes on terrain visible from street level',()=>{
  const city=DISTRICTS.kyo,eyeY=terrainHeight(city.x,city.z)+1.85;
  for(const east of [true,false]){
    const beds=(east?fukuFirebeds:daiFirebeds)(terrainHeight);
    const drawing=east?FIRE_DRAWINGS.east:FIRE_DRAWINGS.north;
    assert.ok(beds.length>(east?190:90));
    const chart=beds.map(([x,y,z])=>{
      assert.ok(Math.abs(terrainHeight(x,z)+.38-y)<1e-8);
      assert.ok(Math.abs(terrainMeshHeight(x,z)+.38-y)<.05,'hearth sits on the painted triangles');
      const depth=east?x-city.x:city.z-z,side=east?z-city.z:x-city.x;
      return [side/depth/drawing.width+.5,((y-.38-eyeY)/depth-drawing.foot)/drawing.height];
    });
    const nearest=(u,v)=>Math.min(...chart.map(([a,b])=>Math.hypot(u-a,v-b)));
    const ink=east?[[.095,.961],[.16,.56],[.17,.08],[.65,.931],[.65,.811],[.65,.64],[.65,.32],[.65,.10]]:
      [[.528,.977],[.14,.645],[.855,.658],[.35,.312],[.06,.05],[.677,.275],[.95,.053]];
    const gaps=east?[[.61,.72],[.50,.42],[.78,.42],[.50,.20],[.79,.21],[.32,.72]]:
      [[.28,.84],[.73,.83],[.67,.48],[.49,.15]];
    for(const [u,v] of ink)assert.ok(nearest(u,v)<.030,'missing brush at '+[east,u,v]);
    for(const [u,v] of gaps)assert.ok(nearest(u,v)>.058,'blocked opening at '+[east,u,v]);
    for(const offset of [-40,-20,0,22,44,66]){
      const ex=city.x+(east?offset:0),ez=city.z-(east?0:offset),ey=terrainHeight(ex,ez)+1.85;
      for(const [x,y,z] of beds){
        const length=Math.hypot(x-ex,z-ez);
        for(let d=1;d<length-.8;d+=1.25){
          const f=d/length,xx=ex+(x-ex)*f,zz=ez+(z-ez)*f,alt=ey+f*(y+.6-ey);
          assert.ok(alt>Math.max(terrainHeight(xx,zz),canopyHeight(xx,zz,.03),solidHeightAt(xx,zz,.03)),
            'obstructed view from '+[ex,ez]+' to '+[x,z]);
        }
      }
    }
  }
});

test('the mown banks hug the hearths, leaving the approach and the ridge behind them wooded',()=>{
  const city=DISTRICTS.kyo;
  for(const east of [true,false]){
    const hearths=(east?fukuFirebeds:daiFirebeds)(terrainHeight);
    for(const [x,,z] of hearths)assert.ok(inFireMeadow(x,z,-1),'unmown hearth '+[x,z]);
    const drawing=east?FIRE_DRAWINGS.east:FIRE_DRAWINGS.north;
    const ratio=drawing.width/(east?.34:.31);
    assert.ok(ratio>.84 && ratio<.89);
    assert.ok(Math.abs(drawing.height/(east?.226:.222)-ratio)<.006);
    for(let forward=96;forward<375;forward+=4)for(let side=-88;side<=88;side+=4){
      const x=city.x+(east?forward:side),z=city.z+(east?side:-forward);
      if(inFireMeadow(x,z))assert.ok(hearths.some(([hx,,hz])=>Math.hypot(hx-x,hz-z)<20),
        'mown ground too far from a firebed at '+[x,z]);
    }
  }
});

test('both narrow trails can be walked from an existing street to the fires in normal mochi mode',()=>{
  for(const [direction,line] of Object.entries(FIRE_TRAILS)){
    assert.ok(nearRoad(...line[0],.4) && inFireMeadow(...line.at(-1)));
    const game=createGame(),p=game.state.player,[x,z]=line[0];
    Object.assign(p,{x,z,y:terrainHeight(x,z),h:0,vx:0,vz:0,grounded:true});
    for(const [tx,tz] of line){
      assert.ok(fireTrailDistance(tx,tz)<1e-8);
      for(let j=0;j<100;j++){
        const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);
        if(d<.18)break;
        game.step(1/60,{x:dx/d,z:dz/d});
      }
      assert.ok(Math.hypot(tx-p.x,tz-p.z)<.19,direction+' footpath blocked at '+[tx,tz]);
    }
  }
});
