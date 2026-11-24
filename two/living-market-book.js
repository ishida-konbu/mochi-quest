import { nearBuildStructure } from './living-build.js';
import { evaluateRecipe } from './living-craft.js';
import { RESOURCES } from './living-resources.js';
import { worldClockLabel } from './world-clock.js';
import { marketLocation, suggestedPrice, listMochi, withdrawMochi, repriceMochi, collectSales, SHELF_CAPACITY, PRICE_LIMIT } from './living-market.js';

const pieces = stock => stock.reduce((total, b) => total + b.quantity, 0);
const shelfName = stand => marketLocation(stand).name + 'の販売棚（' + stand.id.slice(6) + '番）';
const lotLabel = (name, batch) => name + '（仕込み' + batch.id + '・' + batch.quantity + '個）';

export function renderMarket({ area, world, game, route, choose, save, el, button, section, field, details, select, number }) {
  const stands = world.structures.filter(s => s.kind === 'stand');
  const nearStand = () => nearBuildStructure(world, game.state.player, 'stand');
  const local = nearStand();
  const names = new Map(world.recipes.map(r => [r.id, r.name]));
  function atShelf(action) {
    if (!local || nearStand()?.id !== local.id) {
      choose('market', '値札や銭箱に手が届くところで、販売棚を開いてください。');
      return;
    }
    const result = action();
    if (result.ok) save();
    choose('market', result.message || result.reason);
  }
  if (!stands.length) {
    const intro = section('餅の無人販売', area);
    intro.append(el('p', '桜川の渡し、月見の棚田、蔵町の市で、自分の餅を売れます。「家づくり」で空いた土地に販売棚を置き、餅を持って棚のそばでこの頁を開いてください。'),
      button('販売棚を建てる', () => choose('build', '', 'stand'), 'jump-link'));
  }
  if (local) {
    const account = world.market.stands[local.id], stock = account?.stock || [];
    const location = marketLocation(local);
    const shop = section(shelfName(local), area);
    shop.append(el('p', 'この棚は' + location.footfall + '場所にあります。' + location.note));
    const cash = account?.cashbox || 0;
    const cashRow = el('div', undefined, 'actions');
    const collect = button(cash + '文を受け取る', () => atShelf(() => collectSales(world, local.id)));
    collect.disabled = !cash;
    cashRow.append(el('strong', '銭箱　' + cash + '文'), collect);
    shop.append(cashRow);

    const list = section('棚に並べる', area);
    if (!world.batches.length) {
      list.append(el('p', '手元に売れる餅がありません。公共工房で一仕込み作ると、ここで数と値札を決められます。'),
        button('餅作りを開く', () => choose('craft')));
    } else {
      const options = Object.fromEntries(world.batches.map(b => [b.id, lotLabel(names.get(b.recipeId), b)]));
      let batch = world.batches[0], amount, price;
      const controls = el('div', undefined, 'living-controls');
      const quote = el('p', undefined, 'living-note');
      const chooseLot = select(options, String(batch.id), id => {
        batch = world.batches.find(b => b.id === Number(id));
        update();
      }, '並べる仕込み');
      const quantity = number(1, 1, 4, value => { amount = value; }, '並べる数');
      const tag = number(1, 1, PRICE_LIMIT, value => { price = value; }, '一個の値札');
      const submit = button('この値札で並べる', () => atShelf(() => listMochi(world, local.id, batch.id, amount, price)), 'jump-link');
      function update() {
        amount = Math.min(batch.quantity, SHELF_CAPACITY - pieces(stock));
        price = stock.find(s => s.id === batch.id)?.unitPrice ?? suggestedPrice(batch);
        quantity.value = amount; quantity.max = amount; tag.value = price;
        submit.disabled = amount === 0;
        const recipe = world.recipes.find(r => r.id === batch.recipeId);
        const { requirements } = evaluateRecipe(world, recipe.draft, recipe.regionId);
        const ingredientPrice = Object.entries(requirements).reduce((n, [id, grams]) =>
          n + grams / RESOURCES[id].amount * RESOURCES[id].price, 0) / 4;
        quote.textContent = '値付けの目安は一個' + suggestedPrice(batch) + '文。' +
          '材料代は一個あたり' + batch.cost / 4 + '文。材料をすべて相場で買うと、一個あたり約' + ingredientPrice.toFixed(1) + '文です。';
      }
      list.append(field('手元の餅', chooseLot));
      controls.append(field('並べる数（個）', quantity), field('一個の値札（文）', tag));
      list.append(quote, controls, submit);
      update();
    }
    const shelf = section('棚の餅　' + pieces(stock) + '／' + SHELF_CAPACITY + '個', area);
    if (!stock.length) shelf.append(el('p', '棚は空です。'));
    for (const entry of stock) {
      const row = details(lotLabel(names.get(entry.recipeId), entry) + '　各' + entry.unitPrice + '文', shelf);
      let price = entry.unitPrice;
      const input = number(price, 1, PRICE_LIMIT, value => { price = value; }, '付け替える値札');
      row.append(field('一個の値札（文）', input),
        button('値札を付け替える', () => atShelf(() => repriceMochi(world, local.id, entry.id, price))),
        button('残り' + entry.quantity + '個を手元に戻す', () => atShelf(() => withdrawMochi(world, local.id, entry.id))));
    }
  }
  if (stands.length) {
    const summary = section('販売棚の控え', area);
    summary.append(el('p', '旅の時計で15分たつごとに、通りかかった客が餅を買うことがあります。棚を離れて旅をする間も、宿や野営地で休む間も商いは続きます。売上は各棚の銭箱で受け取れます。ゲームを閉じている間は時計も休みます。'));
    for (const stand of stands) {
      const account = world.market.stands[stand.id];
      const label = shelfName(stand);
      const row = el('div', undefined, 'living-station');
      row.append(el('strong', label),
        el('span', '棚に' + pieces(account?.stock || []) + '個、銭箱に' + (account?.cashbox || 0) + '文。これまでに' +
          (account?.sold || 0) + '個売れて' + (account?.revenue || 0) + '文。売れた餅の材料代を引くと' +
          ((account?.revenue || 0) - (account?.costQuarters || 0) / 4) + '文。'));
      if (stand.id !== local?.id) row.append(route({ ...stand, name: label }));
      summary.append(row);
    }
  }
  if (world.market.sales.length) {
    const history = details('売上帳を開く', area);
    history.append(el('p', '最近売れた餅を、新しい順に64個まで記録しています。'));
    for (const sale of [...world.market.sales].reverse()) {
      const caption = marketLocation({ regionId: sale.regionId, x: 0, z: 0 }).name;
      history.append(el('p', worldClockLabel(sale.minute) + '　' + caption + 'の' + sale.standId.slice(6) + '番棚　' + names.get(sale.recipeId) +
        ' 一個　売値' + sale.price + '文・原価' + sale.costQuarters / 4 + '文'));
    }
  }
}
