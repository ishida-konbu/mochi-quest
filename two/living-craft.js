// Quantities are grams per tray of four. Costs use whole mon per tray.
import { RESOURCES, consumeIngredients, quoteIngredients } from './living-resources.js';

export const CRAFT_OPTIONS = {
  base: { rice: '白もち米', brownRice: '玄もち米' },
  filling: Object.fromEntries(['azuki','soy','sakura','herb','sesame'].map(id => [id, RESOURCES[id].name])),
  placement: { mixed: '練り込む', inside: '中に包む', top: '上にのせる' },
  seasoning: { none: 'なし', sugar: '砂糖', salt: '塩' },
  finish: { steam: '蒸して搗く', grill: '搗いて炭火で焼く' },
  shape: { round: '丸餅', flat: '平餅', square: '角餅', flower: '花形餅' },
  technique: { none: 'なめらかに搗く', half: '半搗きで粒を残す', wrap: '笹の葉で包む' }
};
export const ATTRIBUTE_NAMES = {
  sweet: '甘み', salty: '塩味', savory: 'うま味', aroma: '香り', chewy: 'もちもち感',
  bite: '歯切れ', keeping: '日持ち', travel: '携帯しやすさ', beauty: '華やかさ', fullness: '腹持ち'
};
export const BASIC_RECIPE = {
  base: 'rice', fillings: [], seasoning: 'none', seasoningAmount: 0, finish: 'steam', shape: 'round', technique: 'none'
};
export const STARTER_RECIPES = [
  { regionId: 'river', number: 1, name: '花筏餅', draft: { ...BASIC_RECIPE, shape: 'flat', technique: 'half', seasoning: 'sugar', seasoningAmount: 5,
    fillings: [{ id: 'azuki', amount: 20, placement: 'inside' }, { id: 'sakura', amount: 4, placement: 'top' }] } },
  { regionId: 'terraces', number: 5, name: '穂の花餅', draft: { ...BASIC_RECIPE, technique: 'half', seasoning: 'sugar', seasoningAmount: 5,
    fillings: [{ id: 'azuki', amount: 20, placement: 'inside' }] } },
  { regionId: 'market', number: 3, name: '炒り豆の角餅', draft: { ...BASIC_RECIPE, shape: 'square', finish: 'grill',
    fillings: [{ id: 'soy', amount: 25, placement: 'mixed' }] } }
];
const stations = new Set(STARTER_RECIPES.map(recipe => recipe.regionId));
const amountIn = (n, lo, hi) => Number.isSafeInteger(n) && n >= lo && n <= hi;
const failure = reason => ({ ok: false, reason });
export const craftState = () => ({ recipes: [], batches: [], nextBatchId: 1, tastings: [] });

export function normalizeRecipe(draft) {
  if (!draft || !Array.isArray(draft.fillings) || draft.fillings.length > 3) return null;
  for (const key of ['base', 'seasoning', 'shape', 'finish', 'technique']) {
    if (!Object.hasOwn(CRAFT_OPTIONS[key], draft[key])) return null;
  }
  if (draft.seasoning !== 'none' && !amountIn(draft.seasoningAmount, 1, 10)) return null;
  const fillings = [];
  for (const filling of draft.fillings) {
    if (!filling || !Object.hasOwn(CRAFT_OPTIONS.filling, filling.id) ||
        !Object.hasOwn(CRAFT_OPTIONS.placement, filling.placement) || !amountIn(filling.amount, 1, 40)) return null;
    const same = fillings.find(f => f.id === filling.id && f.placement === filling.placement);
    if (same) {
      same.amount += filling.amount;
      if (same.amount > 40) return null;
    } else fillings.push({ id: filling.id, amount: filling.amount, placement: filling.placement });
  }
  fillings.sort((a,b) => a.id.localeCompare(b.id, 'en') || a.placement.localeCompare(b.placement, 'en'));
  return { base: draft.base, fillings, seasoning: draft.seasoning, seasoningAmount: draft.seasoning === 'none' ? 0 : draft.seasoningAmount,
    finish: draft.finish, shape: draft.shape, technique: draft.technique };
}

// A compact, lossless key also avoids collisions between a player's inventions.
function keyFor(r) {
  const fillings = r.fillings.map(f => [f.id, f.placement, f.amount].join('.'));
  return ['1', r.base, ...fillings, r.seasoning, r.seasoningAmount, r.finish, r.shape, r.technique].join('/');
}
const traditions = new Map(STARTER_RECIPES.map(starter => [keyFor(normalizeRecipe(starter.draft)), starter]));
export const traditionFor = recipe => traditions.get(keyFor(recipe));

// Intrinsic taste of 100 g of cooked ingredient. Seasoning is concentrated,
// so its dose is applied separately, after weighting the dough and inclusions.
const flavors = {
  rice: [11,1,23,24], brownRice: [13,2,35,48], azuki: [39,1,62,43], soy: [15,2,76,85],
  herb: [3,1,14,98], sesame: [12,1,64,90], sakura: [4,87,12,96]
};
function evaluateAttributes(r) {
  const values = flavors[r.base].map(n => n * 100);
  let grams = 100;
  for (const { id, amount } of r.fillings) {
    grams += amount;
    flavors[id].forEach((n, i) => { values[i] += n * amount; });
  }
  const [sweet, salty, savory, aroma] = values.map(n => n / grams);
  const grill = r.finish === 'grill', half = r.technique === 'half', wrap = r.technique === 'wrap';
  const attributes = {
    sweet: sweet + (r.seasoning === 'sugar' ? 5 * r.seasoningAmount : 0),
    salty: salty + (r.seasoning === 'salt' ? 7 * r.seasoningAmount : 0), savory,
    aroma: aroma + (grill ? 20 : 5) + (wrap ? 5 : 0), chewy: 85 - (grill ? 15 : 0) - (half ? 18 : 0) - (r.base === 'brownRice' ? 8 : 0),
    bite: 25 + (grill ? 18 : 0) + (half ? 22 : 0) + (r.base === 'brownRice' ? 8 : 0),
    keeping: 38 + (grill ? 10 : 0) + (wrap ? 6 : 0),
    travel: 66 + (r.shape === 'flat' ? 9 : 0) - (r.shape === 'flower' ? 16 : 0) + (wrap ? 13 : 0),
    beauty: 30 + (r.shape === 'flower' ? 24 : 0) + 14 * r.fillings.filter(f => f.placement === 'top').length,
    fullness: 32 + (grams - 100) * .39 + (r.base === 'brownRice' ? 6 : 0)
  };
  return Object.fromEntries(Object.entries(attributes).map(([k,v]) => [k, Math.min(100, Math.round(v))]));
}
function describe(r) {
  const steps = r.fillings.map(({ id, placement }) => {
    if (id === 'azuki' && placement === 'inside') return '炊いた小豆を餡にして包んだ';
    return CRAFT_OPTIONS.filling[id] + 'を' + ({ mixed: '練り込んだ', inside: '中に包んだ', top: '上にのせた' })[placement];
  });
  const first = r.fillings[0];
  let flavor = r.base === 'rice' ? '白い' : '玄米の';
  if (first) {
    const ingredient = first.id === 'sakura' ? '桜' : first.id === 'azuki' && first.placement === 'inside' ? '小豆餡' : CRAFT_OPTIONS.filling[first.id];
    const inside = r.technique === 'wrap' ? '入り' : 'を包んだ';
    flavor = ingredient + ({ mixed: '入りの', inside, top: 'をのせた' })[first.placement];
  }
  const name = flavor + CRAFT_OPTIONS.shape[r.shape] + (r.finish === 'grill' ? 'の炭火焼き' : '') +
    (r.technique === 'wrap' ? '（笹包み）' : '');
  const dough = CRAFT_OPTIONS.base[r.base] + 'を蒸して' + (r.technique === 'half' ? '半搗きにした' : 'なめらかに搗いた') + '生地';
  const seasoning = r.seasoning === 'sugar' ? '砂糖で甘みを添えた。' : r.seasoning === 'salt' ? '塩をきかせた。' : '';
  const description = dough + '。' + (steps.length ? steps.join('。') + '。' : '') + seasoning +
    (r.finish === 'grill' ? '炭火で両面を香ばしく焼いた。' : '') + (r.technique === 'wrap' ? '仕上げに笹の葉で包んだ。' : '');
  return { name, description };
}
function incompatibility(r) {
  if (r.technique === 'wrap' && r.fillings.some(f => f.placement === 'top')) return '笹で包むと上の具が崩れます。具を練り込むか、中に包んでください。';
  if (r.shape === 'flat' && r.fillings.filter(f => f.placement === 'inside').reduce((n,f) => n+f.amount,0) > 25)
    return '平餅の中に包める具は合わせて25 gまでです。具を減らすか、形を変えてください。';
  return '';
}
export function evaluateRecipe(living, draft, regionId) {
  const recipe = normalizeRecipe(draft);
  if (!recipe) return failure('材料と分量を見直してください。具は一種類につき一か所に1〜40 g、調味料は1〜10 gです。');
  const requirements = { [recipe.base]: 100 };
  for (const {id, amount} of recipe.fillings) requirements[id] = (requirements[id] || 0) + amount;
  if (recipe.seasoning !== 'none') requirements[recipe.seasoning] = recipe.seasoningAmount;
  if (recipe.technique === 'wrap') requirements.bambooLeaf = 8;
  const tradition = traditionFor(recipe), text = describe(recipe);
  const quote = quoteIngredients(living, requirements);
  const reason = incompatibility(recipe) || (!stations.has(regionId) ? '公共工房の作業台で作れます。' :
    recipe.finish === 'grill' && regionId !== 'market' ? '炭火の焼き台は蔵町の団子屋にあります。ここでは蒸し餅を作れます。' : '') || quote.reason || '';
  return { ok: !reason, reason, recipe, requirements, quantity: 4, key: keyFor(recipe), attributes: evaluateAttributes(recipe),
    traditionalRegion: tradition?.regionId || null, name: tradition?.name || text.name, description: text.description, cost: quote.cost || 0 };
}

const cleanText = (s, max) => [...String(s ?? '').replace(/[\p{Cc}\p{Cf}]/gu, '').trim()].slice(0,max).join('');
export function craftRecipe(living, draft, { regionId, name, description, expectedBatchId } = {}) {
  if (expectedBatchId !== undefined && expectedBatchId !== living.nextBatchId) return failure('この分はもう作りました。');
  const p = evaluateRecipe(living, draft, regionId);
  if (!p.ok) return p;
  const title = cleanText(name, 36) || p.name, note = cleanText(description, 120) || p.description;
  let recipe = living.recipes.find(r => r.key === p.key && r.name === title && r.description === note);
  const id = living.nextBatchId;
  if (!amountIn(id,1,Number.MAX_SAFE_INTEGER-1)) return failure('餅図鑑がいっぱいです。');
  const minute = Math.floor(living.worldMinute);
  if (!recipe) recipe = { id: 'recipe-' + id, key: p.key, draft: p.recipe, regionId, createdMinute: minute, name: title, description: note };
  const cost = consumeIngredients(living, p.requirements);
  if (!cost.ok) return cost;
  if (!living.recipes.includes(recipe)) living.recipes.push(recipe);
  const batch = { id, recipeId: recipe.id, quantity: p.quantity, attributes: p.attributes, appearanceKey: p.key, craftedMinute: minute, cost: cost.cost };
  living.batches.push(batch);
  living.nextBatchId++;
  return { ok: true, recipe, batch, message: title + 'が4個できました。' };
}
export function renameRecipe(living, id, name, description) {
  const recipe = living.recipes.find(r => r.id === id);
  if (!recipe) return failure('餅図鑑にこの餅が見当たりません。');
  const fallback = describe(recipe.draft);
  recipe.name = cleanText(name, 36) || traditionFor(recipe.draft)?.name || fallback.name;
  recipe.description = cleanText(description, 120) || fallback.description;
  return { ok: true, message: '餅図鑑に書き留めました。' };
}
export function useBatch(living, batchId, { player, recipient } = {}) {
  const batch = living.batches.find(b => b.id === batchId);
  if (!batch?.quantity) return failure('この餅はもう手元にありません。');
  const recipe = living.recipes.find(r => r.id === batch.recipeId);
  if (!recipe) return failure('餅図鑑にこの配合が見当たりません。');
  const a = batch.attributes;
  const taste = a.salty >= 30 ? '塩がきいて、米の甘みが引き立つ' : a.sweet >= 32 ? 'やさしい甘みが口に広がる' :
    a.aroma >= 48 ? '香りがふわっと広がる' : a.bite >= 42 ? '噛むたびに粒の食感が楽しめる' : 'なめらかな生地がよくのびる';
  let message;
  if (recipient) {
    if (typeof recipient.id !== 'string' || !/^[a-zA-Z0-9:_-]{1,80}$/.test(recipient.id) || !cleanText(recipient.name,36)) return failure('近くの住人を選んでください。');
    message = recipient.name + 'に餅をひとつ渡した。「' + taste + 'ね。ごちそうさま！」';
  } else {
    if (!player || !Number.isFinite(player.hp) || !Number.isFinite(player.mp)) return failure('いまは味見できません。');
    const hp = player.hp, mp = player.mp;
    player.hp = Math.min(100, hp + Math.max(1,Math.round(a.fullness*.32)));
    player.mp = Math.min(100, mp + Math.max(1,Math.round(a.chewy*.14)));
    message = recipe.name + 'をひと口。' + taste + '。';
  }
  batch.quantity--;
  if (!batch.quantity) living.batches.splice(living.batches.indexOf(batch),1);
  living.tastings.push({ recipeId: recipe.id, recipientId: recipient?.id ?? null, minute: Math.floor(living.worldMinute), message });
  if (living.tastings.length > 64) living.tastings.shift();
  return { ok: true, message };
}
export function validCraftState(s) {
  if (!s || !Array.isArray(s.recipes) || !Array.isArray(s.batches) || !Array.isArray(s.tastings) || s.tastings.length > 64 ||
      !amountIn(s.nextBatchId,1,Number.MAX_SAFE_INTEGER)) return false;
  const recipes = new Map(), ids = new Set();
  const minuteOK = n => amountIn(n,0,Math.floor(s.worldMinute));
  for (const r of s.recipes) {
    const draft = normalizeRecipe(r?.draft);
    if (!draft || !/^recipe-[1-9]\d*$/.test(r.id) || !amountIn(Number(r.id.slice(7)),1,s.nextBatchId-1) ||
        r.key !== keyFor(draft) || incompatibility(draft) || recipes.has(r.id) || !stations.has(r.regionId) ||
        !minuteOK(r.createdMinute) || !r.name || r.name !== cleanText(r.name,36) || !r.description || r.description !== cleanText(r.description,120)) return false;
    recipes.set(r.id,r);
  }
  for (const b of s.batches) {
    if (!b || !recipes.has(b.recipeId) || !amountIn(b.id,1,s.nextBatchId-1) || ids.has(b.id) ||
        !amountIn(b.quantity,1,4) || !minuteOK(b.craftedMinute) || !amountIn(b.cost,0,Number.MAX_SAFE_INTEGER) ||
        !b.attributes || !Object.keys(ATTRIBUTE_NAMES).every(k => amountIn(b.attributes[k],0,100)) ||
        b.appearanceKey !== recipes.get(b.recipeId).key) return false;
    ids.add(b.id);
  }
  return s.tastings.every(t => t && recipes.has(t.recipeId) && (t.recipientId === null || typeof t.recipientId === 'string' && /^[a-zA-Z0-9:_-]{1,80}$/.test(t.recipientId)) &&
    minuteOK(t.minute) && typeof t.message === 'string' && t.message.length <= 240);
}
