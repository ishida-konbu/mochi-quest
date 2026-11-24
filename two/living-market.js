// A stand holds portions of the original four-piece cooking lot. The lot's
// cost always describes the whole tray, including after a gift or a split.
import { ATTRIBUTE_NAMES, validCraftState } from './living-craft.js';
import { validShopPurchases } from './living-resources.js';
import { wrapWorld } from './geography.js';
import { RICE_SHOP } from './living-layout.js';
import { FERRY_CURTAIN } from './festival.js';
import { DAY_MINUTES, INITIAL_WORLD_MINUTE } from './world-clock.js';

export const MARKET_INTERVAL = 15;
export const SHELF_CAPACITY = 16;
export const PRICE_LIMIT = 99;
const bucketsPerDay = DAY_MINUTES / MARKET_INTERVAL;
const profiles = {
  river: { name: '桜川の渡し', place: '渡し場', anchor: FERRY_CURTAIN, salt: 149,
    needs: ['travel','keeping','salty'], note: '舟の出る朝夕は、日持ちのする餅や、包んで持ち歩ける餅が喜ばれます。' },
  terraces: { name: '月見の棚田', place: '田の畦道', anchor: RICE_SHOP, salt: 389,
    needs: ['fullness','chewy','savory'], note: '田仕事の合間、とりわけ昼どきには、食べ応えのある腹持ちのよい餅が人気です。' },
  market: { name: '蔵町の市', place: '市の通り', anchor: { x: 17, z: -64 }, salt: 743,
    needs: ['beauty','aroma','sweet'], note: '朝から夕方にかけて市がにぎわいます。花形の餅や、香りのよい焼き餅が目を引きます。' }
};
const stockTotal = stock => stock.reduce((sum, item) => sum + item.quantity, 0);
const natural = n => Number.isSafeInteger(n) && n >= 0;
const whole = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const validPrice = price => whole(price, 1, PRICE_LIMIT);
const fail = reason => ({ ok: false, reason });
const supportsTrade = stand => stand?.kind === 'stand' && Object.hasOwn(profiles, stand.regionId);

export function createMarketState(minute = INITIAL_WORLD_MINUTE, seed = 1717) {
  return { market: { seed, lastBucket: Math.floor(minute / MARKET_INTERVAL), stands: {}, sales: [], shopPurchases: {} } };
}
export function marketLocation(stand) {
  const profile = profiles[stand.regionId];
  const distance = Math.hypot(wrapWorld(stand.x - profile.anchor.x), wrapWorld(stand.z - profile.anchor.z));
  const visibility = Math.max(.27, 1 - distance / 150);
  return { ...profile, visibility, footfall: visibility > .72 ? '人通りが多い' : visibility > .42 ? 'ときどき人が通る' : '人通りが少ない' };
}

export function suggestedPrice(batch) {
  const a = batch.attributes;
  return 5 + Math.round((a.aroma + a.beauty + a.fullness + a.keeping) / 64);
}

export function purchaseWeight(location, batch, price, sold) {
  const a = batch.attributes;
  const [first, second, third] = location.needs;
  const match = (a[first] * .48 + a[second] * .34 + a[third] * .18) / 100;
  const priceFactor = Math.max(0, 1.65 - .65 * price / suggestedPrice(batch));
  const reputation = 1 + Math.min(sold, 40) / 200;
  return Math.min(.97, (.28 + match) * priceFactor * location.visibility * reputation);
}

function getStand(world, id) {
  return world.structures.find(s => s.id === id && supportsTrade(s));
}
function newAccount() {
  return { stock: [], cashbox: 0, sold: 0, revenue: 0, costQuarters: 0 };
}

export function listMochi(world, standId, batchId, quantity, price) {
  if (!getStand(world, standId)) return fail('販売棚を選んでください。');
  const batch = world.batches.find(b => b.id === batchId);
  if (!batch || !whole(quantity, 1, batch.quantity)) return fail('手元にある餅の数を確かめてください。');
  if (!validPrice(price)) return fail('値札は一個につき1〜99文で付けてください。');
  settleMarket(world);
  const account = world.market.stands[standId] ?? newAccount();
  if (stockTotal(account.stock) + quantity > SHELF_CAPACITY) return fail('棚がいっぱいです。並べる数を減らしてください。');
  const entry = account.stock.find(item => item.id === batchId);
  if (entry && entry.unitPrice !== price) return fail('同じ仕込みの餅が棚にあります。先に棚の値札を付け替えてください。');
  if (entry) entry.quantity += quantity;
  else account.stock.push({ ...batch, quantity, unitPrice: price });
  world.market.stands[standId] = account;
  batch.quantity -= quantity;
  if (!batch.quantity) world.batches.splice(world.batches.indexOf(batch), 1);
  return { ok: true, message: '餅を' + quantity + '個並べ、一個' + price + '文の値札を付けました。' };
}
export function repriceMochi(world, standId, batchId, price) {
  if (!validPrice(price)) return fail('値札は一個につき1〜99文で付けてください。');
  settleMarket(world);
  const item = world.market.stands[standId]?.stock.find(item => item.id === batchId);
  if (!item) return fail('この餅はもう棚にありません。');
  item.unitPrice = price;
  return { ok: true, message: '一個' + price + '文に値札を付け替えました。' };
}
export function withdrawMochi(world, standId, batchId) {
  settleMarket(world);
  const stock = world.market.stands[standId]?.stock;
  const item = stock?.find(item => item.id === batchId);
  if (!item) return fail('この餅はもう棚にありません。');
  const { unitPrice, ...batch } = item;
  const hand = world.batches.find(b => b.id === batchId);
  if (hand) hand.quantity += batch.quantity;
  else world.batches.push(batch);
  stock.splice(stock.indexOf(item), 1);
  return { ok: true, message: '売れ残りの餅' + batch.quantity + '個を手元に戻しました。' };
}
export function collectSales(world, id) {
  settleMarket(world);
  const account = world.market.stands[id];
  if (!account?.cashbox) return fail('銭箱は空です。');
  const amount = Math.min(account.cashbox, Number.MAX_SAFE_INTEGER - world.wallet);
  if (!amount) return fail('銭入れがいっぱいです。買い物をしてから受け取ってください。');
  world.wallet += amount;
  account.cashbox -= amount;
  return { ok: true, message: '銭箱から' + amount + '文を受け取りました。' };
}
export function marketRemovalReason(world, id) {
  const account = world.market.stands[id];
  if (account?.stock.length || account?.cashbox) return '棚の餅を手元に戻し、銭箱を空にしてから片づけてください。';
  return '';
}
export function forgetMarketStand(world, id) {
  if (!marketRemovalReason(world, id)) delete world.market.stands[id];
}

// The simulated boat crossings, field breaks and market hours repeat daily.
// Every stall in one region competes for the same finite stream of customers.
export function marketTraffic(regionId, bucket) {
  const slot = bucket % bucketsPerDay, hour = slot / 4;
  if (regionId === 'river') {
    if (hour < 5 || hour >= 20) return 0;
    const crossings = hour < 10 || hour >= 16 ? 2 : 1;
    return slot % 4 === 0 ? crossings + 1 : Number(slot % 2 === 1);
  }
  if (regionId === 'terraces') return hour >= 6 && hour < 18 ? (hour >= 11 && hour < 14 ? 2 : Number(slot % 2 === 0)) : 0;
  if (regionId === 'market') return hour >= 7 && hour < 19 ? (hour >= 9 && hour < 16 ? 3 : 1) : 0;
  return 0;
}
function draw(seed, regionId, bucket, visitor, drawIndex) {
  let h = (seed ^ profiles[regionId].salt) >>> 0;
  h = Math.imul(h ^ (bucket % bucketsPerDay), 0x85ebca6b);
  h = Math.imul(h ^ (visitor * 2 + drawIndex), 0xc2b2ae35);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function buyOne(world, stands, bucket, visitor) {
  const regionId = stands[0].regionId, offers = [];
  let sum = 0, best = 0;
  for (const stand of stands) {
    const account = world.market.stands[stand.id], location=marketLocation(stand);
    for (const item of account.stock) {
      const weight = purchaseWeight(location, item, item.unitPrice, account.sold);
      if (!weight || !Number.isSafeInteger(account.revenue + item.unitPrice) ||
          !Number.isSafeInteger(account.costQuarters + item.cost)) continue;
      sum += weight;
      best = Math.max(best, weight);
      offers.push({ stand, account, item, end: sum });
    }
  }
  if (draw(world.market.seed, regionId, bucket, visitor, 0) >= best) return false;
  const choice = draw(world.market.seed, regionId, bucket, visitor, 1) * sum;
  const { stand, account, item } = offers.find(offer => offer.end > choice);
  account.sold++;
  account.revenue += item.unitPrice;
  account.cashbox += item.unitPrice;
  account.costQuarters += item.cost;
  item.quantity--;
  if (!item.quantity) account.stock.splice(account.stock.indexOf(item), 1);
  world.market.sales.push({ minute: bucket * MARKET_INTERVAL, standId: stand.id, regionId, recipeId: item.recipeId,
    price: item.unitPrice, costQuarters: item.cost });
  if (world.market.sales.length > 64) world.market.sales.shift();
  return true;
}
export function settleMarket(world) {
  const market = world.market, until = Math.floor(world.worldMinute / MARKET_INTERVAL);
  if (until <= market.lastBucket) return;
  const from = market.lastBucket + 1;
  const regions = new Map();
  for (const stand of world.structures) {
    if (!supportsTrade(stand) || !market.stands[stand.id]?.stock.length) continue;
    if (!regions.has(stand.regionId)) regions.set(stand.regionId, []);
    regions.get(stand.regionId).push(stand);
  }
  for (const stands of regions.values()) stands.sort((a,b) => a.id.localeCompare(b.id, 'en', {numeric:true}));
  let lastSale = from - 1;
  for (let bucket = from; regions.size && bucket <= until && bucket - lastSale <= bucketsPerDay; bucket++) {
    for (const [regionId, stands] of regions) {
      for (let visitor = 0; visitor < marketTraffic(regionId, bucket); visitor++) {
        if (buyOne(world, stands, bucket, visitor)) lastSale = bucket;
      }
      if (stands.every(s => !market.stands[s.id].stock.length)) regions.delete(regionId);
    }
  }
  // No purchase during an entire cycle means these same offers will stay
  // unsold. A price, stock or location change starts a new evaluation.
  market.lastBucket = until;
}

function sameLot(a, b) {
  return a.recipeId === b.recipeId && a.appearanceKey === b.appearanceKey && a.cost === b.cost &&
    a.craftedMinute === b.craftedMinute && Object.keys(ATTRIBUTE_NAMES).every(k => a.attributes?.[k] === b.attributes?.[k]);
}
export function validMarketState(world) {
  const m = world?.market;
  if (!m || !validShopPurchases(world) || !whole(m.seed, 0, 0xffffffff) || !whole(m.lastBucket, 0, Math.floor(world.worldMinute / MARKET_INTERVAL)) ||
      !m.stands || typeof m.stands !== 'object' || Array.isArray(m.stands) || !Array.isArray(world.structures) ||
      !Array.isArray(m.sales) || m.sales.length > 64) return false;
  const all = new Map(), seenRecipes = new Set(world.recipes.map(r => r.id));
  function remember(item) {
    if (!item || !whole(item.quantity, 1, 4)) return false;
    const other = all.get(item.id);
    if (!other) all.set(item.id, { ...item });
    else {
      if (!sameLot(other, item) || other.quantity + item.quantity > 4) return false;
      other.quantity += item.quantity;
    }
    return true;
  }
  for (const item of world.batches) if (!remember(item)) return false;
  for (const chest of world.structures.filter(s => s.kind === 'chest')) {
    if (!Array.isArray(chest.batches) || !chest.batches.every(remember)) return false;
  }
  for (const [id, account] of Object.entries(m.stands)) {
    if (!getStand(world, id) || !account || !natural(account.sold) || !natural(account.cashbox) || !natural(account.revenue) ||
        account.cashbox > account.revenue || !natural(account.costQuarters) || !Array.isArray(account.stock) ||
        account.stock.length > SHELF_CAPACITY) return false;
    const ids = new Set();
    for (const item of account.stock) {
      if (!item || !validPrice(item.unitPrice) || ids.has(item.id) || !remember(item)) return false;
      ids.add(item.id);
    }
    if (stockTotal(account.stock) > SHELF_CAPACITY) return false;
  }
  if (!validCraftState({ ...world, batches: [...all.values()] })) return false;
  return m.sales.every(s => s && whole(s.minute, 0, m.lastBucket * MARKET_INTERVAL) && s.minute % MARKET_INTERVAL === 0 &&
    typeof s.standId === 'string' && s.standId.length > 0 && s.standId.length < 80 && Object.hasOwn(profiles, s.regionId) &&
    seenRecipes.has(s.recipeId) && validPrice(s.price) && natural(s.costQuarters));
}
