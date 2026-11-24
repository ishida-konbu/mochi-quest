// Prices are for one bundle, quantities are grams, and the wallet is in mon.
const foods = [
  ['rice', '白もち米', 100, 8, '#e9debd'],
  ['brownRice', '玄もち米', 100, 9, '#c4a37a'],
  ['azuki', '小豆', 40, 5, '#884c47'],
  ['soy', '炒り大豆', 40, 4, '#caa16c'],
  ['sakura', '桜の塩漬け', 20, 5, '#c9898d'],
  ['herb', 'よもぎ', 30, 3, '#819464'],
  ['sesame', '黒胡麻', 20, 4, '#51493d'],
  ['sugar', '砂糖', 30, 4, '#efe4cb'],
  ['salt', '塩', 20, 2, '#e3e1cb'],
  ['bambooLeaf', '笹の葉', 20, 3, '#6b8257'],
];
export const RESOURCES = Object.freeze(Object.fromEntries(foods.map(([id,name,amount,price,color]) =>
  [id, Object.freeze({id,name,amount,price,color,unit:'g',limit:20000})])));
export const GATHER_NODES = Object.freeze({
  'river-yomogi': {resource:'herb', amount:30, regrow:90},
  'terraces-share': {resource:'rice', amount:100, regrow:180},
  'market-share': {resource:'soy', amount:40, regrow:120},
});
export const SHOP_STOCK = Object.freeze({
  'market-grocer': Object.freeze(foods.map(food=>food[0])),
  'terraces-farmer': Object.freeze(['rice','brownRice','azuki','bambooLeaf']),
});

export function createHoldings() {
  return {wallet:24, inventory:{rice:200,sakura:20}, costs:{}, nodeReadyAt:{}};
}
const ledger = value => value !== null && typeof value==='object' && !Array.isArray(value);
const natural = n => Number.isSafeInteger(n) && n>=0;

export function validHoldings(living) {
  if (!living || !natural(living.wallet) || !ledger(living.inventory) || !ledger(living.costs) || !ledger(living.nodeReadyAt)) return false;
  return Object.entries(living.inventory).every(([id,n])=>Object.hasOwn(RESOURCES,id) && natural(n) && n<=RESOURCES[id].limit)
    && Object.entries(living.costs).every(([id,cost])=>Object.hasOwn(RESOURCES,id) && natural(cost)
      && cost<=(living.inventory[id] ?? 0))
    && Object.entries(living.nodeReadyAt).every(([id,t])=>Object.hasOwn(GATHER_NODES,id) && natural(t));
}

export function quoteIngredients(living, amounts) {
  if (!ledger(amounts) || !Object.keys(amounts).length) return {ok:false,reason:'使う材料を選んでください。'};
  let cost=0;
  const deductions={};
  for (const [id,grams] of Object.entries(amounts)) {
    if (!Object.hasOwn(RESOURCES,id) || !Number.isSafeInteger(grams) || grams<=0) return {ok:false,reason:'材料と分量を確かめてください。'};
    const have=living.inventory[id] ?? 0;
    if (grams>have) return {ok:false,reason:RESOURCES[id].name+'があと'+(grams-have)+'g必要です。'};
    const paid=living.costs[id] ?? 0;
    deductions[id]=Math.floor(paid*grams/have);
    cost+=deductions[id];
  }
  return {ok:true,cost,deductions};
}

export function consumeIngredients(living, amounts) {
  const quote=quoteIngredients(living,amounts);
  if (!quote.ok) return quote;
  for (const [id,grams] of Object.entries(amounts)) {
    living.inventory[id]-=grams;
    living.costs[id]=(living.costs[id] ?? 0)-quote.deductions[id];
  }
  return quote;
}

function fits(living,id,amount) {
  return (living.inventory[id] ?? 0)+amount<=RESOURCES[id].limit;
}

// The morning delivery is shared by all visits to a particular shop.
// A dated receipt is sufficient even after a long journey or overnight rest.
const supplyDay = minute => Math.floor((minute + 1080) / 1440);
const bundleLimit = (shopId, id) => shopId === 'terraces-farmer' && ['rice','brownRice'].includes(id) ? 12 : 6;

export function shopOffer(living, shopId, id) {
  if (!Object.hasOwn(SHOP_STOCK,shopId) || !SHOP_STOCK[shopId].includes(id)) return null;
  const food = RESOURCES[id], day = supplyDay(living.worldMinute);
  const receipt = living.market?.shopPurchases[shopId];
  const bought = receipt?.day === day ? (receipt.counts[id] || 0) : 0;
  // Bringing the rice down from the terraces adds one mon to its price at the market.
  const price = food.price + Number(shopId === 'market-grocer' && ['rice','brownRice'].includes(id));
  return {day, price, left:bundleLimit(shopId,id) - bought};
}

export function validShopPurchases(living) {
  const receipts = living.market?.shopPurchases;
  if (!ledger(receipts)) return false;
  return Object.entries(receipts).every(([shopId, receipt]) => Object.hasOwn(SHOP_STOCK,shopId) &&
    receipt && natural(receipt.day) && receipt.day <= supplyDay(living.worldMinute) && ledger(receipt.counts) &&
    Object.entries(receipt.counts).every(([id,n]) => SHOP_STOCK[shopId].includes(id) &&
      natural(n) && n <= bundleLimit(shopId,id)));
}

export function buyResource(living,site,id) {
  const offer=shopOffer(living,site?.id,id);
  if (!offer) return {ok:false,reason:'ここでは、その材料を扱っていません。'};
  if (!offer.left) return {ok:false,reason:'今日の分は売り切れです。朝六時に新しい荷が届きます。'};
  const food=RESOURCES[id];
  if (living.wallet<offer.price) return {ok:false,reason:'銭が足りません。三条通知を初めて届ける相手から、お礼をもらえます。'};
  if (!fits(living,id,food.amount)) return {ok:false,reason:food.name+'をこれ以上持てません。餅を作って空きを用意してください。'};
  if (living.market) {
    const receipts=living.market.shopPurchases, key=site.id;
    if (receipts[key]?.day !== offer.day) receipts[key]={day:offer.day, counts:{}};
    const counts=receipts[key].counts;
    counts[id]=(counts[id] || 0)+1;
  }
  living.inventory[id]=(living.inventory[id] ?? 0)+food.amount;
  living.costs[id]=(living.costs[id] ?? 0)+offer.price;
  living.wallet-=offer.price;
  return {ok:true,message:food.name+food.amount+'gを'+offer.price+'文で買いました。'};
}

export function gatherResource(living,nodeId,tool='hand') {
  const node=Object.hasOwn(GATHER_NODES,nodeId) && GATHER_NODES[nodeId];
  if (!node || tool!=='hand') return {ok:false,reason:'地面に降りて、手で取れるところまで近づいてください。'};
  const now=Math.floor(living.worldMinute);
  const remaining=(living.nodeReadyAt[nodeId] ?? 0)-now;
  if (remaining>0) return {ok:false,reason:'今は取り切ったところです。旅の時計であと'+remaining+'分たつと、また手に入ります。'};
  const food=RESOURCES[node.resource];
  if (!fits(living,food.id,node.amount)) return {ok:false,reason:food.name+'をこれ以上持てません。餅を作って空きを用意してください。'};
  living.inventory[food.id]=(living.inventory[food.id] ?? 0)+node.amount;
  living.nodeReadyAt[nodeId]=now+node.regrow;
  return {ok:true,message:food.name+node.amount+'gを素材袋に入れました。'};
}

// game.delivered is the existing persistent receipt, also for migrated journeys.
export function deliveryReward(living,recipientId) {
  let order=0;
  for (const ch of recipientId) order=(order*31+ch.codePointAt(0))>>>0;
  const resource=['rice','salt','sugar'][order%3];
  const food=RESOURCES[resource], amount=food.id==='rice'?50:10;
  const coins=Math.min(6,Number.MAX_SAFE_INTEGER-living.wallet);
  living.wallet+=coins;
  if (!fits(living,resource,amount)) return coins+'文';
  living.inventory[resource]=(living.inventory[resource] ?? 0)+amount;
  return coins+'文と'+food.name+amount+'g';
}
