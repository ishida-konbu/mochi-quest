import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../two/vendor/three.module.min.js';
import { LID_REST } from '../two/cooking-motion.js';
import { createGame } from '../two/game.js';
import { buyResource, gatherResource, quoteIngredients, consumeIngredients, createHoldings, validHoldings, RESOURCES } from '../two/living-resources.js';
import { LIVING_SITES, nearLivingSite, nearGiftRecipient } from '../two/living-sites.js';
import { benchFrame, benchPoint, COOKING_BENCH, COOKING_MAT, COOKING_PIVOT, MARKET_GRILL_TOP, MARKET_GRILL_X, MARKET_GRILL_Z, MARKET_STOCK_TOP, MARKET_STOCK_Z, marketCooktop, WORKTOPS, worktopPoint } from '../two/living-layout.js';
import { cookingLayout } from '../two/cooking-stage.js';
import { dressLivingSites } from '../two/living-site-art.js';
import { groundHeight, terrainContactHeight, staticVolumeAt, MARKET_STALLS, terrainHeight, REGIONS, regionAt, canOccupy } from '../two/terrain.js';

test('each resource stop has open, dry footing and is operated from ground level in its own region',()=>{
  const game=createGame(), p=game.state.player;
  for (const site of LIVING_SITES) {
    Object.assign(p,{x:site.x,y:site.y,z:site.z});
    assert.equal(REGIONS[regionAt(p.x,p.z)].id,site.region);
    assert.ok(canOccupy(p.x,p.z,p.y),site.id);
    assert.ok(nearLivingSite(p,site));
    assert.equal(nearLivingSite({...p,grounded:false},site),false);
    assert.equal(nearLivingSite({...p,y:p.y+2},site),false);
    assert.equal(game.nearest()?.target.livingSite?.id,site.id);
    assert.ok(game.act('interact'));
    if (site.kind!=='gather') assert.equal(game.state.events.at(-1).siteId,site.id);
    else assert.ok(game.state.livingWorld.inventory[site.resource]>=site.amount);
  }
  const copy=createGame(game.save());
  assert.ok(copy.restored);
  assert.deepEqual(copy.state.livingWorld,game.state.livingWorld);
});

test('resource cooldown is per stable node, persists and releases exactly at the next harvest',()=>{
  const l={...createHoldings(),worldMinute:520.9}, id='river-yomogi';
  assert.ok(gatherResource(l,id).ok);
  assert.equal(l.inventory.herb,30);
  const saved=structuredClone(l);
  assert.equal(gatherResource(l,id).ok,false);
  assert.deepEqual(l,saved);
  saved.worldMinute=609.99;
  assert.equal(gatherResource(saved,id).ok,false);
  saved.worldMinute=610;
  assert.equal(gatherResource(saved,id,'axe').ok,false);
  assert.ok(gatherResource(saved,id).ok);
  assert.equal(saved.inventory.herb,60);
  saved.worldMinute+=100;
  saved.inventory.herb=RESOURCES.herb.limit;
  const before=structuredClone(saved);
  assert.equal(gatherResource(saved,id).ok,false);
  assert.deepEqual(saved,before);
});

test('spending, paid basis and harvested stock reconcile after partial and full consumption',()=>{
  const l={...createHoldings(),worldMinute:480}, shop=LIVING_SITES.find(s=>s.id==='terraces-farmer');
  assert.ok(buyResource(l,shop,'rice').ok);
  assert.ok(gatherResource(l,'terraces-share').ok);
  assert.deepEqual([l.inventory.rice,l.wallet,l.costs.rice],[400,16,8]);
  const before=structuredClone(l);
  assert.equal(buyResource(l,shop,'salt').ok,false);
  assert.equal(buyResource(l,shop,'__proto__').ok,false);
  assert.equal(consumeIngredients(l,{rice:100,herb:500}).ok,false);
  assert.deepEqual(quoteIngredients(l,{rice:100}),{ok:true,cost:2,deductions:{rice:2}});
  assert.deepEqual(l,before);
  assert.ok(consumeIngredients(l,{rice:100}).ok);
  assert.equal(consumeIngredients(l,{rice:300}).cost,6);
  assert.deepEqual([l.inventory.rice,l.costs.rice],[0,0]);
  l.wallet=0;
  assert.equal(buyResource(l,shop,'rice').ok,false);
  l.wallet=24;l.inventory.rice=RESOURCES.rice.limit;
  assert.equal(buyResource(l,shop,'rice').ok,false);
  assert.equal(l.wallet,24);
  assert.ok(validHoldings(l));
  assert.equal(validHoldings({...l,nodeReadyAt:{bad:1}}),false);
  assert.equal(validHoldings({...l,inventory:{rice:NaN}}),false);
});

test('first delivery grants a separate gratuity; the same recipient on a restored journey only scores',()=>{
  const game=createGame(), t=game.state.npcs.find(n=>n.type==='turtle');
  const aim=g=>{
    Object.assign(g.state.player,{x:t.x,z:t.z-1.45,y:t.y,h:0,heading:0});
    assert.ok(g.act('throw'));for(let i=0;i<15;i++)g.step(1/60);
  };
  aim(game);
  assert.ok(game.state.delivered.has(t.id));
  assert.equal(game.state.livingWorld.wallet,30);
  const save=game.save(), resumed=createGame(save);
  aim(resumed);
  assert.ok(resumed.state.score>save.score);
  assert.equal(resumed.state.livingWorld.wallet,30);
  assert.deepEqual(resumed.state.livingWorld.inventory,save.livingWorld.inventory);
});

test('gifts require a reachable free traveller',()=>{
  for(const table of Object.values(WORKTOPS)){
    const floor=terrainContactHeight(table.x,table.z);
    const bench=benchFrame(table),q=worktopPoint(bench,0,1.32), p={...q,grounded:true,y:groundHeight(q.x,q.z,floor+.3)};
    const n={id:'a',type:'rabbit',role:'porter',x:p.x+.74,z:p.z,y:p.y};
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[n]})?.id,'a');
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[{...n,y:p.y+4}]}),null);
    assert.equal(nearGiftRecipient({player:{...p,mount:'bike'},nearbyNpcs:[n]}),null);
    const far=worktopPoint(bench,0,-1.22);
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[{...n,...far,y:groundHeight(far.x,far.z)}]}),null);
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[n]},{penetration:()=>.1}),null);
  }
});


test('one square mat supports the compact worktop, mortar, stove and cook in each workshop',t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const sceneParts=[],shapes={};
  // Record the painter's actual geometries and placements in table coordinates.
  dressLivingSites({shapes},{sign:()=>null},(p,x,z,yaw,y)=>{
    const parts=[];
    sceneParts.push({x,y,z,yaw,parts});
    return {part:(...part)=>parts.push(part),post(){},line(){}};
  });
  for(const [i,id] of ['river-mortar','terraces-mortar','market-mortar'].entries()){
    const l=cookingLayout({id}),s=l.groundCookware,matSite=sceneParts[2*i],table=sceneParts[2*i+1];
    const parts=matSite.parts,bench=table.parts;
    const axes=table.yaw-matSite.yaw;
    assert.ok(Math.abs(Math.cos(axes))<1e-6,id+' work surfaces meet at a right angle');
    assert.deepEqual({x:table.x,z:table.z,yaw:table.yaw},benchFrame(l));
    const placed=(shape)=>parts.find(part=>part[0]===shape);
    assert.deepEqual(placed('livingMortar').slice(1,4),s.mortar);
    assert.deepEqual(placed('stoveBody').slice(1,4),[s.stove[0],s.stove[1]+.038,s.stove[2]]);
    const [sx,sy,sz]=s.stove;
    assert.deepEqual(placed('parkedLid').slice(1,4),[sx,sy+.416,sz]);
    assert.deepEqual(placed('parkedLidRest').slice(1,4),[sx+LID_REST[0],sy,sz+LID_REST[1]]);
    assert.equal(placed('parkedLidRest')[8],0);
    assert.deepEqual(placed('parkedMallet').slice(1,4),s.malletRack);
    assert.equal(placed('parkedMallet')[8],s.malletYaw);
    for(const shape of ['parkedLid','parkedLidRest','parkedMallet'])
      assert.equal(placed(shape)[11].userData.cookingTools,id);
    assert.ok(placed('riceSteamer') && placed('steamerHoop') && bench.some(part=>part[0]==='handWaterPot'));
    const mat=shapes['wovenMat-'+id].getAttribute('position');
    assert.ok(mat.count>4);
    for(let n=0;n<mat.count;n++){
      const x=mat.getX(n),z=mat.getZ(n);
      assert.ok(Math.abs(s.matHeight(x,z)-mat.getY(n))<.00001,id);
    }
    for(const [name,shape] of [['mortar','mortarSole'],['stove','stoveSole']]){
      const [x,y,z]=s[name], foot=shapes[shape+'-'+id].getAttribute('position');
      for(const [du,dv] of s[name+'Foot']){
        assert.ok(x+du>=COOKING_MAT.left && x+du<=COOKING_MAT.right,id+' appliance on the mat');
        assert.ok(z+dv>=COOKING_MAT.back && z+dv<=COOKING_MAT.front,id+' appliance on the mat');
      }
      for(let j=0;j<foot.count;j+=5)
        assert.ok(Math.abs(y+foot.getY(j)-s.matHeight(x+foot.getX(j),z+foot.getZ(j))+.005)<.00001);
    }
    for(const [pt,t] of [[s.mortar,.545],[s.stove,.46],[s.bowlRest,0]]){
      const [x,y,z]=pt,q=worktopPoint(l,x,z),top=l.y+y+t;
      assert.ok(staticVolumeAt(q.x,q.z,top-.015,.006,.008));
      assert.ok(Math.abs(groundHeight(q.x,q.z,top+.01)-top)<.00001,id);
    }
    for(const [x,z] of [[COOKING_MAT.left+.23,COOKING_MAT.back+.10],[COOKING_MAT.right-.10,COOKING_MAT.back+.15]]){
      const q=worktopPoint(l,x,z),feet=l.y+l.floor(x,z);
      assert.ok(Math.abs(feet-terrainContactHeight(q.x,q.z)-COOKING_MAT.thickness)<.00001,id);
      assert.ok(canOccupy(q.x,q.z,feet),id);
    }
    const slab=bench.filter(([shape,,,,width,,depth])=>shape==='box' && width>1 && depth>.60);
    assert.equal(slab.length,1,id);
    assert.ok(slab[0][4]>=1.4 && slab[0][4]<=1.65 && slab[0][6]<=.75,id+' compact top');
    const {left,front,back}=COOKING_BENCH;
    const [innerX,,endZ]=benchPoint([left,0,front]),[outerX]=benchPoint([left,0,back]);
    const matWidth=COOKING_MAT.right-COOKING_MAT.left,matDepth=COOKING_MAT.front-COOKING_MAT.back;
    assert.ok(Math.abs(matWidth-matDepth)<1e-6,id+' square rush mat');
    const onMat=(x,z)=>x>COOKING_MAT.left && x<COOKING_MAT.right && z>COOKING_MAT.back && z<COOKING_MAT.front;
    for(const u of [left,COOKING_BENCH.right])for(const v of [back,front]){
      const [x,,z]=benchPoint([u,0,v]);
      assert.ok(onMat(x,z),id+' entire tabletop within the woven edge');
    }
    const legs=bench.filter(([shape,,,,w,,d])=>shape==='box' && w===.108 && d===.108);
    assert.equal(legs.length,4);
    for(const [,u,h,v,w,dy,d] of legs)for(const du of [-w/2,w/2])for(const dv of [-d/2,d/2]){
      const [x,,z]=benchPoint([u+du,0,v+dv]);
      assert.ok(onMat(x,z));
      assert.ok(Math.abs(table.y+h-dy/2-(matSite.y+s.matHeight(x,z)))<.001,id+' foot on the rush');
    }
    const stoveRight=s.stove[0]+Math.max(...s.stoveFoot.map(p=>p[0]));
    const stoveLeft=s.stove[0]+Math.min(...s.stoveFoot.map(p=>p[0]));
    const stoveFront=s.stove[2]+Math.max(...s.stoveFoot.map(p=>p[1]));
    const stoneGap=Math.hypot(Math.max(0,innerX-stoveRight,stoveLeft-outerX),endZ-stoveFront);
    assert.ok(endZ>stoveFront && stoneGap<=.30,id+' stove and nearest worktop corner');
    const [px,pz]=COOKING_PIVOT;
    assert.ok(Math.atan2(Math.abs(px-s.mortar[0]),pz-s.mortar[2])<Math.PI/12 && innerX>px && endZ<pz,id+' mortar ahead and bench alongside');
    for(const [x,,z] of [s.mortar,s.stove,s.bowlRest,benchPoint([0,0,front])])
      assert.ok(Math.hypot(x-px,z-pz)<=1.62,id+' cooking surfaces around the same spot');
    assert.equal(slab[0][2]+slab[0][5]/2,COOKING_BENCH.top);
    if(!l.market){
      // Travellers may have saved beside the previous straight counter.
      const oldEntrance=worktopPoint(l,0,1.22);
      assert.ok(canOccupy(oldEntrance.x,oldEntrance.z,terrainContactHeight(oldEntrance.x,oldEntrance.z),.33,2.12));
    }
    assert.ok(Math.abs(slab[0][3]+slab[0][6]/2-front)<1e-9);
    for(const [u,v] of [[px,pz],[px-.31,pz],[px+.31,pz],[px,pz-.31],[px,pz+.31]]){
      const q=worktopPoint(l,u,v),feet=terrainContactHeight(q.x,q.z);
      assert.ok(Math.abs(l.floor(u,v))<.00001,id+' level rush mat');
      assert.ok(Math.abs(l.y-feet-COOKING_MAT.thickness)<.00001,id+' rush over the painted earth');
      assert.ok(canOccupy(q.x,q.z,feet,.36,1.47),id+' open inside corner');
    }
    for(const x of [-.68,.50]){
      const q=worktopPoint(table,x,0);
      assert.ok(staticVolumeAt(q.x,q.z,l.y+COOKING_BENCH.top-.02,.015,.015));
      assert.equal(staticVolumeAt(q.x,q.z,l.y+1.05,.015,.015),false,id);
    }
  }
});

test('the charcoal hearth stands beside the preparation bench and the tea stall still holds its bean basket',()=>{
  for (const [i,u,v,top] of [[4,MARKET_GRILL_X,MARKET_GRILL_Z,MARKET_GRILL_TOP],[5,-.91,.47,1.126]]) {
    const [x,z,yaw]=MARKET_STALLS[i], kitchen=marketCooktop(MARKET_STALLS[i]);
    const bench=i===4?benchFrame(kitchen):{x,z,yaw};
    const point=worktopPoint(bench,u,v);
    const shopFloor=terrainHeight(x,z),base=i===4?terrainContactHeight(kitchen.x,kitchen.z)+COOKING_MAT.thickness:shopFloor;
    if(i===4){
      const [gx,,gz]=benchPoint([u,top,v]);
      assert.ok(Math.hypot(gx-COOKING_PIVOT[0],gz-COOKING_PIVOT[1])<1.65,'grill reachable from the same turn');
      const shelf=worktopPoint({x,z,yaw},0,MARKET_STOCK_Z),aisle=worktopPoint({x,z,yaw},0,-.48);
      assert.equal(groundHeight(shelf.x,shelf.z,shopFloor+1),shopFloor+MARKET_STOCK_TOP);
      assert.ok(canOccupy(aisle.x,aisle.z,shopFloor,.20,1.42));
      assert.ok(staticVolumeAt(point.x,point.z,base+.20,.01,.05));
      const gap=worktopPoint(bench,(COOKING_BENCH.right+MARKET_GRILL_X-.185)/2,v);
      assert.equal(staticVolumeAt(gap.x,gap.z,base+COOKING_BENCH.top-.01,.003,.005),false);
    }
    assert.ok(staticVolumeAt(point.x,point.z,base+top-.04,.01,.025));
    assert.ok(Math.abs(groundHeight(point.x,point.z,base+top+.04)-(base+top))<1e-7);
  }
});
