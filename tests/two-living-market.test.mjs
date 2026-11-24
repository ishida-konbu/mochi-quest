import test from 'node:test';
import assert from 'node:assert/strict';
import { createHoldings, buyResource, shopOffer } from '../two/living-resources.js';
import { BASIC_RECIPE, craftState, craftRecipe, useBatch } from '../two/living-craft.js';
import { createMarketState, validMarketState, settleMarket, listMochi, withdrawMochi, repriceMochi, collectSales,
  marketTraffic, suggestedPrice, purchaseWeight, forgetMarketStand, marketRemovalReason, SHELF_CAPACITY } from '../two/living-market.js';

const anchors = { river: [4.6,55.9], terraces: [146.5,90.6], market: [17,-64] };
function stand(regionId,id) {
  const [x,z] = anchors[regionId];
  return { id, kind:'stand', x, z, regionId };
}
function fixture(seed = 1717) {
  return { ...createHoldings(), ...craftState(), ...createMarketState(480,seed), worldMinute:480,
    structures:['river','terraces','market'].map((region,i) => stand(region,'build-'+(i+1))),
    inventory:{rice:4000, brownRice:1200, sugar:240, bambooLeaf:120}, costs:{rice:320} };
}
const craft = (s,draft=BASIC_RECIPE) => craftRecipe(s,draft,{regionId:'market'}).batch;
function put(s,id,batch,n=4,price=suggestedPrice(batch)) {
  const result=listMochi(s,id,batch.id,n,price);
  assert.ok(result.ok,result.reason);
}
function advance(s,minute) { s.worldMinute=minute; settleMarket(s); }

test('a lot stays identifiable in hand, storage and two shelves; recall, reprice and removal conserve ownership',()=>{
  const s=fixture(), b=craft(s), cost=b.cost, id=b.id;
  assert.equal(cost,8);
  put(s,'build-1',b,1);
  put(s,'build-2',b,1);
  const chest = { id:'build-4', kind:'chest', batches:[{...b,quantity:1}] };
  s.structures.push(chest); b.quantity--;
  assert.equal(validMarketState(s),true);
  const copied = structuredClone(s); copied.structures.at(-1).batches[0].quantity++;
  assert.equal(validMarketState(copied),false);
  const forged = structuredClone(s); forged.market.stands['build-1'].stock[0].cost++;
  assert.equal(validMarketState(forged),false);
  assert.ok(useBatch(s,id,{player:{hp:50,mp:50}}).ok);
  assert.ok(marketRemovalReason(s,'build-1')); forgetMarketStand(s,'build-1');
  assert.ok(s.market.stands['build-1']);
  assert.ok(repriceMochi(s,'build-1',id,9).ok);
  assert.ok(withdrawMochi(s,'build-1',id).ok);
  assert.equal(withdrawMochi(s,'build-1',id).ok,false);
  assert.equal(s.batches[0].quantity,1);assert.equal(s.batches[0].cost,cost);
  assert.equal('unitPrice' in s.batches[0],false);
  assert.equal(marketRemovalReason(s,'build-1'),'');
  forgetMarketStand(s,'build-1'); s.structures.shift();
  assert.equal(validMarketState(s),true);
});

test('three village stands sell between active clock ticks; reloading, waiting and repeated collection cannot mint coins',()=>{
  const fast=fixture(), expected=new Map(), starting=fast.wallet;
  for(const stand of fast.structures) {
    const batch=craft(fast), price=suggestedPrice(batch);
    put(fast,stand.id,batch,4);
    expected.set(stand.id,price*4);
  }
  const slow=structuredClone(fast);
  advance(fast,480+1440*3);
  for(let minute=481; minute<=480+1440*3; minute++) advance(slow,minute);
  assert.deepEqual(slow,fast);
  const reload=JSON.parse(JSON.stringify(fast)), snapshot=structuredClone(reload);
  for(let i=0;i<100;i++) settleMarket(reload);
  assert.deepEqual(reload,snapshot);
  for(const stand of reload.structures) {
    const a=reload.market.stands[stand.id];
    assert.equal(a.cashbox,expected.get(stand.id));
    assert.equal(a.costQuarters/4,8);
    assert.ok(marketRemovalReason(reload,stand.id));
    assert.ok(collectSales(reload,stand.id).ok);
    assert.equal(collectSales(reload,stand.id).ok,false);
    assert.equal(marketRemovalReason(reload,stand.id),'');
  }
  assert.equal(reload.wallet,starting+[...expected.values()].reduce((a,b)=>a+b));
  const before=reload.inventory.rice;
  assert.ok(buyResource(reload,{id:'terraces-farmer'},'rice').ok);
  assert.equal(reload.inventory.rice,before+100);
  assert.equal(validMarketState(reload),true);
});

test('customers are finite across competing stands; closed hours, excessive prices and depleted stock yield zero',()=>{
  const s=fixture();
  s.structures=[stand('market','build-1'),stand('market','build-2')];
  for(const shelf of s.structures) for(let i=0;i<4;i++) put(s,shelf.id,craft(s));
  assert.equal(listMochi(s,'build-1',craft(s).id,1,6).ok,false);
  assert.equal(s.market.stands['build-1'].stock.reduce((n,b)=>n+b.quantity,0),SHELF_CAPACITY);
  const pricey=structuredClone(s);
  for(const [id,a] of Object.entries(pricey.market.stands)) for(const b of a.stock) assert.ok(repriceMochi(pricey,id,b.id,99).ok);
  advance(pricey,480+100000000*1440);
  assert.equal(pricey.market.sales.length,0);
  const closed=structuredClone(s);closed.worldMinute=21*60;closed.market.lastBucket=closed.worldMinute/15;
  advance(closed,24*60+6*60);assert.equal(closed.market.sales.length,0);
  for(let slot=33;slot<=55;slot++) {
    const before=s.market.sales.length;
    advance(s,slot*15);
    assert.ok(s.market.sales.length-before <= marketTraffic('market',slot));
  }
  assert.ok(s.market.sales.length>0 && s.market.sales.length<=32);
  assert.equal(s.market.sales.length + Object.values(s.market.stands).flatMap(a=>a.stock).reduce((n,b)=>n+b.quantity,0),32);
});

test('site, daylight and recipe influence demand at the same price; remote shelves have lower footfall',()=>{
  const showy={...BASIC_RECIPE,shape:'flower',finish:'grill',seasoning:'sugar',seasoningAmount:10};
  const packed={...BASIC_RECIPE,shape:'flat',technique:'wrap',seasoning:'salt',seasoningAmount:8};
  const results={};
  for(const regionId of Object.keys(anchors)) {
    for(const [recipe,draft] of Object.entries({showy,packed})) {
      for(const offset of [0,115]) {
        let sold=0;
        for(let seed=0;seed<40;seed++){
          const s=fixture(seed),sh=stand(regionId,'build-1');sh.x+=offset;s.structures=[sh];s.inventory.salt=120;
          const lot=craft(s,draft);put(s,sh.id,lot,4,8);
          advance(s,525);
          sold+=s.market.stands[sh.id].sold;
        }
        results[[regionId,recipe,offset]]=sold;
      }
    }
  }
  assert.ok(results[['river','packed',0]] > results[['river','showy',0]],JSON.stringify(results));
  assert.ok(results[['market','showy',0]] > results[['market','packed',0]],JSON.stringify(results));
  assert.ok(results[['market','showy',0]] > results[['terraces','showy',0]],JSON.stringify(results));
  for(const regionId of Object.keys(anchors)) for(const recipe of ['showy','packed'])
    assert.ok(results[[regionId,recipe,0]] > results[[regionId,recipe,115]]);
});

test('mutating an offer first settles the old terms; no retrospective trade or sales in an unsupported region',()=>{
  const s=fixture();
  advance(s,12*60);
  const b=craft(s);
  const before=structuredClone(s);
  for(const [id,qty,price] of [['build-1',0,5],['build-1',5,5],['build-1',1,0],['build-1',1,NaN],['other',1,5]]) {
    assert.equal(listMochi(s,id,b.id,qty,price).ok,false);
    assert.deepEqual(s,before);
  }
  s.structures[0].regionId='peach';
  assert.equal(listMochi(s,'build-1',b.id,4,5).ok,false);
  put(s,'build-3',b,4,99);
  s.worldMinute+=1500;
  assert.ok(repriceMochi(s,'build-3',b.id,1).ok);
  assert.equal(s.market.sales.length,0);
  advance(s,s.worldMinute+1440);
  assert.equal(s.market.sales.length,4);
  assert.ok(s.market.sales.every(s=>s.price===1));
});

test('morning deliveries replenish each shop independently; receipts survive reopening and never debit a failed sale',()=>{
  const s=fixture(), city={id:'market-grocer'}, farm={id:'terraces-farmer'};
  s.wallet=500;
  const order=shopOffer(s,city.id,'rice');
  assert.equal(order.price,9); assert.equal(shopOffer(s,farm.id,'rice').price,8);
  for (let i=0;i<order.left;i++) assert.ok(buyResource(s,city,'rice').ok);
  const before=structuredClone(s);
  assert.equal(buyResource(s,city,'rice').ok,false); assert.deepEqual(s,before);
  assert.ok(buyResource(s,farm,'rice').ok);
  const copy=JSON.parse(JSON.stringify(s));
  advance(copy,24*60+359); assert.equal(shopOffer(copy,city.id,'rice').left,0);
  advance(copy,24*60+360); assert.equal(shopOffer(copy,city.id,'rice').left,order.left);
  assert.ok(buyResource(copy,city,'rice').ok);
  assert.ok(validMarketState(copy));
  copy.market.shopPurchases[city.id].counts.rice=100;
  assert.equal(validMarketState(copy),false);
});

test('harbour, roadside and capital customer fixtures favour provisions, filling meals and decorated sweets', () => {
  const s=fixture();
  s.inventory.salt=120;s.inventory.soy=40;
  const portable=craft(s,{...BASIC_RECIPE,shape:'flat',technique:'wrap',seasoning:'salt',seasoningAmount:8});
  const sweet=craft(s,{...BASIC_RECIPE,shape:'flower',finish:'grill',seasoning:'sugar',seasoningAmount:10});
  const meal=craft(s,{...BASIC_RECIPE,base:'brownRice',fillings:[{id:'soy',amount:40,placement:'mixed'}]});
  // Reference customer groups for later districts exercise the same choice
  // rule as a live sale without opening their protected plots for trade.
  const groups=[
    {needs:['keeping','travel','salty'],preferred:portable,other:sweet},
    {needs:['fullness','chewy','travel'],preferred:meal,other:sweet},
    {needs:['beauty','aroma','sweet'],preferred:sweet,other:portable},
  ];
  for(const {needs,preferred,other} of groups){
    const location={needs,visibility:1};
    assert.ok(purchaseWeight(location,preferred,7,0)>purchaseWeight(location,other,7,0),needs.join(' '));
    assert.equal(purchaseWeight(location,preferred,99,0),0);
  }
});
