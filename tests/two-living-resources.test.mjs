import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { buyResource, gatherResource, quoteIngredients, consumeIngredients, createHoldings, validHoldings, RESOURCES } from '../two/living-resources.js';
import { LIVING_SITES, nearLivingSite, nearGiftRecipient } from '../two/living-sites.js';
import { WORKTOPS, worktopPoint } from '../two/living-layout.js';
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

test('mortar benches and tools have matching solid contacts; gifts require a reachable free traveller',()=>{
  for(const table of Object.values(WORKTOPS)){
    const floor=terrainContactHeight(table.x,table.z);
    for(const [u,v,y] of [[0,0,.70],[-.68,0,1],[.50,.02,1.05],[.98,.21,.84]]){
      const pt=worktopPoint(table,u,v);
      assert.ok(staticVolumeAt(pt.x,pt.z,floor+y,.02,.02));
    }
    const q=worktopPoint(table,0,1.22), p={...q,grounded:true,y:groundHeight(q.x,q.z,floor+.3)};
    const n={id:'a',type:'rabbit',role:'porter',x:p.x+.74,z:p.z,y:p.y};
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[n]})?.id,'a');
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[{...n,y:p.y+4}]}),null);
    assert.equal(nearGiftRecipient({player:{...p,mount:'bike'},nearbyNpcs:[n]}),null);
    const far=worktopPoint(table,0,-1.22);
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[{...n,...far,y:groundHeight(far.x,far.z)}]}),null);
    assert.equal(nearGiftRecipient({player:p,nearbyNpcs:[n]},{penetration:()=>.1}),null);
  }
});


test('the charcoal grill and sharing basket have solid tops above the market counter',()=>{
  for (const [i,u,v,top] of [[4,1.36,.42,1.13],[5,-.91,.47,1.126]]) {
    const [x,z,yaw]=MARKET_STALLS[i], point=worktopPoint({x,z,yaw},u,v);
    const base=terrainHeight(x,z);
    assert.ok(staticVolumeAt(point.x,point.z,base+1.01,.01,.05));
    assert.ok(Math.abs(groundHeight(point.x,point.z,base+top+.04)-(base+top))<1e-7);
  }
});
