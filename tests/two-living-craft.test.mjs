import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRAFT_OPTIONS, BASIC_RECIPE, STARTER_RECIPES, craftState, craftRecipe, evaluateRecipe, normalizeRecipe,
  useBatch, validCraftState, renameRecipe } from '../two/living-craft.js';
import { RESOURCES, createHoldings } from '../two/living-resources.js';

const stocked = () => ({
  ...createHoldings(), ...craftState(), worldMinute: 480,
  inventory: Object.fromEntries(Object.keys(RESOURCES).map(id=>[id,300])),
  costs: { rice:24, azuki:17 }
});
test('a tray preserves the exact preview, shares acquired cost, and has a single confirmation token',()=>{
  const s=stocked();
  for(const entry of STARTER_RECIPES){
    const {regionId,name,draft}=entry, p=evaluateRecipe(s,draft,regionId), next=s.nextBatchId;
    assert.equal(p.name,name); assert.equal(p.traditionalRegion,regionId);
    assert.equal(p.ok,true);
    const r=craftRecipe(s,draft,{regionId,expectedBatchId:next});
    assert.equal(r.recipe.name,name); assert.deepEqual(r.batch.attributes,p.attributes);
    assert.equal(r.batch.appearanceKey,p.key);assert.equal(r.batch.cost,p.cost);
    assert.equal(r.batch.quantity,4);assert.equal(s.inventory.rice,300-next*100);
    const before=structuredClone(s);
    assert.equal(craftRecipe(s,draft,{regionId,expectedBatchId:next}).ok,false);
    assert.deepEqual(s,before);
  }
  assert.equal(validCraftState(JSON.parse(JSON.stringify(s))),true);
});
test('changing quantity, forming and charcoal affect the resulting pastry; material order and naming do not',()=>{
  const s=stocked(), recipe={...BASIC_RECIPE,fillings:[
    {id:'herb',amount:12,placement:'mixed'}, {id:'sesame',amount:10,placement:'top'}]};
  const p=evaluateRecipe(s,recipe,'market');
  const reverse=evaluateRecipe(s,{...recipe,fillings:recipe.fillings.toReversed()},'market');
  assert.equal(p.key,reverse.key);assert.deepEqual(p.attributes,reverse.attributes);
  const double=evaluateRecipe(s,{...recipe,fillings:[
    ...recipe.fillings,{id:'herb',amount:12,placement:'mixed'}]},'market');
  const merged=evaluateRecipe(s,{...recipe,fillings:[{id:'herb',placement:'mixed',amount:24},recipe.fillings[1]]},'market');
  assert.equal(double.key,merged.key);assert.ok(double.attributes.aroma>p.attributes.aroma);
  const grilled=evaluateRecipe(s,{...recipe,finish:'grill',shape:'flower'},'market');
  assert.ok(grilled.attributes.aroma>p.attributes.aroma);
  assert.ok(grilled.attributes.travel<p.attributes.travel);
  const lot=craftRecipe(s,recipe,{regionId:'market',name:'山の緑餅'}).batch;
  const snapshot=structuredClone(lot);
  renameRecipe(s,lot.recipeId,'　里の\u0000緑餅　','　米と胡麻。　');
  assert.equal(s.recipes[0].name,'里の緑餅');assert.deepEqual(lot,snapshot);
  const second=craftRecipe(s,recipe,{regionId:'terraces',name:'里の緑餅',description:'米と胡麻。'}).batch;
  assert.equal(lot.recipeId,second.recipeId);assert.notEqual(lot.id,second.id);
  assert.equal(validCraftState(s),true);
});
test('unusable station, leaf wrapping with garnish, overfilling, invalid dose and shortage leave the world intact',()=>{
  const s=stocked();
  s.inventory.brownRice=0;
  const cases=[
    [BASIC_RECIPE,null],
    [{...BASIC_RECIPE,finish:'grill'},'river'],
    [{...BASIC_RECIPE,technique:'wrap',fillings:[{id:'sakura',amount:5,placement:'top'}]},'river'],
    [{...BASIC_RECIPE,shape:'flat',fillings:[{id:'azuki',amount:39,placement:'inside'}]},'river'],
    [{...BASIC_RECIPE,base:'brownRice'},'terraces'],
    [{...BASIC_RECIPE,seasoning:'sugar',seasoningAmount:Infinity},'river'],
    [{...BASIC_RECIPE,fillings:[{id:'pearl',amount:20,placement:'inside'}]},'market']
  ];
  for(const [r,regionId] of cases){
    const before=structuredClone(s), result=craftRecipe(s,r,{regionId});
    assert.equal(result.ok,false);assert.ok(result.reason);assert.deepEqual(s,before);
  }
});
test('tastes and gifts use only crafted lots; no depleted lot, spoiled stock, or borrowed parcel remains consumable',()=>{
  const s=stocked(), parcel={id:'basket',quantity:7};
  const {batch}=craftRecipe(s,BASIC_RECIPE,{regionId:'river'});
  const player={hp:96.5,mp:80};
  const recipient={id:'character_01_02',name:'おはな'};
  assert.equal(useBatch(s,parcel.id,{player}).ok,false);
  assert.equal(useBatch(s,batch.id,{recipient:{name:'おはな'}}).ok,false);
  assert.equal(batch.quantity,4);
  useBatch(s,batch.id,{player});
  assert.equal(player.hp,100);assert.ok(player.mp>80 && player.mp<=100);
  assert.match(useBatch(s,batch.id,{recipient}).message,/おはな/);
  for(let i=0;i<2;i++) useBatch(s,batch.id,{player});
  assert.equal(useBatch(s,batch.id,{player}).ok,false);
  assert.equal(s.batches.length,0);assert.equal(s.recipes.length,1);assert.equal(s.tastings.length,4);
  assert.equal(validCraftState(s),true);
});
test('save validation catches dangling references, forged counts, invalid recipes and future dates',()=>{
  const s=stocked();craftRecipe(s,BASIC_RECIPE,{regionId:'terraces'});
  for(const mutate of [
    x=>{ x.batches[0].recipeId='missing'; }, x=>{ x.batches[0].quantity=4.5; },
    x=>{ x.recipes[0].draft.technique='unlearned'; },x=>{ x.recipes[0].createdMinute=x.worldMinute+1; },
    x=>{ x.batches[0].attributes.chewy=101; },x=>{ x.nextBatchId=1; },x=>{ x.recipes.push(x.recipes[0]); }
  ]) {
    const copy=structuredClone(s);mutate(copy);assert.equal(validCraftState(copy),false);
  }
  for(const category of ['base','filling','seasoning']){
    for(const id of Object.keys(CRAFT_OPTIONS[category]).filter(id=>id!=='none')) assert.ok(RESOURCES[id]);
  }
  assert.equal(normalizeRecipe({...BASIC_RECIPE,base:'__proto__'}),null);
});
