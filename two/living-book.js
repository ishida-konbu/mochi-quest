import { renderMarket } from './living-market-book.js';
import { createHomesteadBook } from './living-homestead-book.js';
import { buyTimber } from './living-build.js';
import { RESOURCES, buyResource, shopOffer } from './living-resources.js';
import { LIVING_SITES, nearLivingSite, nearGiftRecipient } from './living-sites.js';
import { REST_SITES } from './rest-sites.js';
import { WAIT_HOURS, DAY_MINUTES, waitTargetMinute, worldClockLabel } from './world-clock.js';
import { ATTRIBUTE_NAMES, BASIC_RECIPE, CRAFT_OPTIONS, STARTER_RECIPES, craftRecipe, evaluateRecipe, renameRecipe, useBatch } from './living-craft.js';
import { renderCraftPreview, disposeCraftPreview } from './living-craft-preview.js';
import { REGIONS, wrapDelta } from './terrain.js';

const tabs = { supplies:'素材袋', craft:'餅作り', book:'餅図鑑', market:'商い', build:'家づくり', rest:'ひと休み' };
const regionName = id => REGIONS.find(r => r.id === id)?.name ?? '';
const firstMochi = { ...BASIC_RECIPE, fillings:[{id:'sakura', amount:4, placement:'top'}], shape:'flat' };
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
function button(text, click, cls = 'choice') {
  const node = el('button', text, cls);
  node.type = 'button';
  node.onclick = click;
  return node;
}
function select(options, selected, changed, label) {
  const node = el('select');
  node.setAttribute('aria-label', label);
  for (const [value, name] of Object.entries(options)) node.add(new Option(name, value));
  node.value = selected;
  node.onchange = () => changed(node.value);
  return node;
}
function field(label, input) {
  const node = el('label', undefined, 'living-field');
  node.append(el('span', label), input);
  return node;
}
function number(value, min, max, changed, label) {
  const input = el('input');
  input.type = 'number';
  input.min = min;
  input.max = max;
  input.value = value;
  input.setAttribute('aria-label',label);
  input.oninput = () => changed(input.valueAsNumber);
  return input;
}
function entry(tag, value, max) {
  const input = el(tag);
  input.value = value;
  input.maxLength = max;
  return input;
}
function section(title, parent) {
  const node = el('section',undefined,'living-section');
  node.append(el('h3',title));
  parent.append(node);
  return node;
}
function details(label, parent) {
  const node = el('details', undefined, 'living-details');
  node.append(el('summary',label));
  parent.append(node);
  return node;
}
function attributes(parent, values, keys = Object.keys(ATTRIBUTE_NAMES)) {
  const dl = el('dl', undefined, 'living-attributes');
  for (const key of keys) {
    const row = el('div');
    row.append(el('dt', ATTRIBUTE_NAMES[key]), el('dd', String(values[key])));
    dl.append(row);
  }
  parent.append(dl);
}

export function createLivingBook({ dialog, body, heading, game, save, guide, cook, saw, preview, bearing }) {
  const world = game.state.livingWorld, player = game.state.player;
  let tab = 'supplies', recipeId, draft, preset, customName, customDescription, area, receipt;
  const near = kind => LIVING_SITES.find(site => site.kind === kind && nearLivingSite(player,site));
  const distance = site => Math.hypot(wrapDelta(site.x-player.x), wrapDelta(site.z-player.z));
  const nearest = sites => sites.reduce((a,b) => distance(a) < distance(b) ? a : b);
  function route(site, text) {
    return button(text || (site.name + 'へ　' + Math.round(distance(site)) + ' m'), () => guide(site), 'living-route');
  }
  const shared = {world,game,save,el,button,section,field,details,select,number,route,choose};
  const homestead = createHomesteadBook({...shared,dialog,body,heading,preview,bearing,saw});
  function updateReceipt(result) {
    receipt.textContent = result.message || result.reason;
    if (result.ok) save();
  }
  function choose(next, message = '', buildKind) {
    homestead.clearPreview();
    tab = next;
    // Keep the same renderer and orbit while comparing pages of the book.
    if (next !== 'craft' && next !== 'book') disposeCraftPreview();
    body.replaceChildren();
    heading.textContent = '暮らし帖';
    dialog.dataset.living = '';
    const meta = el('div',undefined,'living-meta');
    meta.append(el('span',regionName(game.state.regionId)),el('span', worldClockLabel(world.worldMinute)),el('strong','持ち銭　' + world.wallet + '文'));
    const nav = el('div', undefined, 'living-tabs');
    nav.setAttribute('aria-label','暮らし帖の見出し');
    for (const [key,text] of Object.entries(tabs)) {
      const b = button(text, () => choose(key));
      b.setAttribute('aria-pressed',String(key === tab));
      nav.append(b);
    }
    receipt = el('p',message,'living-receipt');
    receipt.setAttribute('role','status');
    area = el('div',undefined,'living-area');
    body.append(meta,nav,receipt,area);
    ({supplies, craft, book, market:()=>renderMarket({...shared,area}), build:()=>homestead.render(area,buildKind), rest}[tab])();
    dialog.scrollTop = 0;
  }
  function supplies() {
    const shop = near('shop');
    const stock = section('手持ちの食材', area);
    const list = el('dl',undefined,'living-stock');
    for (const {id,name} of Object.values(RESOURCES)) {
      if (!(world.inventory[id] > 0)) continue;
      const row = el('div');
      row.append(el('dt',name),el('dd',world.inventory[id]+' g'));
      list.append(row);
    }
    stock.append(list.childElementCount ? list : el('p','素材袋は空です。下の道しるべで材料を探せます。'));
    if (!world.recipes.length && !shop)
      stock.append(el('p','最初の餅は、支度の白もち米と桜の塩漬けで作れます。下の道しるべから共同臼を選んでみましょう。'));
    if (shop) {
      const stall = section(shop.name,area);
      const goods = el('div',undefined,'living-goods');
      for (const id of shop.stock) {
        const r = RESOURCES[id], offer = shopOffer(world,shop.id,id);
        const label = offer.left ? offer.price+'文（残り'+offer.left+'包）' : '売り切れ';
        const b = button(r.name+'　'+r.amount+' g　'+label, () => {
          if (!nearLivingSite(player,shop)) return;
          const result = buyResource(world,shop,id);
          if (result.ok) save();
          choose('supplies', result.message || result.reason);
          if (result.ok) area.querySelector('[data-food="'+id+'"]')?.focus({preventScroll:true});
        });
        b.disabled = !offer.left;
        b.dataset.food = id;
        goods.append(b);
      }
      goods.append(button('木材　4本　6文',()=>{
        if (!nearLivingSite(player,shop)) return;
        const r=buyTimber(world,shop);
        if(r.ok) save();
        choose('supplies',r.message || r.reason);
      }));
      stall.append(el('p','朝六時に新しい荷が届きます。'), goods);
    }
    const routes = section('材料と工房を探す',area);
    routes.append(el('p','行き先を選ぶと道しるべが付きます。着いたら画面に出る「餅を作る」「よもぎを摘む」などのボタンか E を押します。三条通知を初めて届けた相手からも、銭と食材をもらえます。'));
    for (const region of ['river','terraces','market']) {
      const group = el('div',undefined,'living-waypoints');
      group.append(el('h4',regionName(region)));
      for (const site of LIVING_SITES.filter(s=>s.region===region)) group.append(route(site));
      routes.append(group);
    }
  }
  function resetDraft(recipe, value) {
    draft = structuredClone(recipe);
    preset = value;
    customName = customDescription = '';
  }
  function craft() {
    const station = near('workshop');
    const recipes = Object.fromEntries(STARTER_RECIPES.map(s=>[s.regionId,s.name+'（'+regionName(s.regionId)+'）']));
    const options = { blossom:'桜をのせた平餅', plain:'白い丸餅', ...recipes, free:'自由に配合する' };
    if (!draft) resetDraft(firstMochi,'blossom');
    const stationInfo = el('div',undefined,'living-station');
    if (station) stationInfo.append(el('strong',station.name),el('span','実演では餅を一つ仕上げます。'));
    else {
      const dest = nearest(LIVING_SITES.filter(s=>s.kind==='workshop'));
      stationInfo.append(el('span','仕上がりを試せます。作るには公共工房へ。'), route(dest));
    }
    area.append(stationInfo);
    const picker = select(options,preset,id=>{
      resetDraft(STARTER_RECIPES.find(s=>s.regionId===id)?.draft || (id==='blossom' ? firstMochi : id==='free' ? draft : BASIC_RECIPE),id);
      choose('craft');
      area.querySelector('select').focus();
    },'配合の手本');
    area.append(field('配合の手本', picker));
    const layout = el('div',undefined,'living-layout');
    const sample = el('figure',undefined,'living-sample'), canvas = el('canvas');
    canvas.setAttribute('aria-label','餅の仕上がり見本');
    const title = el('figcaption');
    sample.append(canvas,title);
    const summary = el('div',undefined,'living-summary');
    layout.append(sample, summary);
    area.append(layout);
    const customize = details('材料・形・技法を変える',area);
    customize.open = preset === 'free';
    const controls = el('div',undefined,'living-controls');
    customize.append(controls);
    const opts = CRAFT_OPTIONS;
    function changed() { preset = 'free'; picker.value = 'free'; refresh(); }
    function option(key, label) {
      controls.append(field(label, select(opts[key],draft[key],v=>{
        draft[key] = v;
        if (key === 'seasoning') {
          draft.seasoningAmount = v === 'none' ? 0 : (draft.seasoningAmount || 5);
          grams.disabled = v === 'none'; grams.value = draft.seasoningAmount;
        }
        changed();
      },label)));
    }
    option('base','生地（100 g）');
    option('shape','形');
    option('finish','仕上げ');
    option('technique','技法');
    option('seasoning','味付け');
    const grams = number(draft.seasoningAmount,1,10,v=>{draft.seasoningAmount=v;changed();},'調味料の量');
    grams.disabled = draft.seasoning === 'none';
    controls.append(field('調味料（g）',grams));
    const slots = [...draft.fillings.map(f=>({...f}))];
    for (let i=0;i<3;i++) {
      slots[i] ??= {id:'none',amount:10,placement:'mixed'};
      const f = slots[i], row = el('div',undefined,'living-fill');
      const update = () => { draft.fillings = slots.filter(slot=>slot.id!=='none').map(slot=>({...slot})); changed(); };
      const quantity = number(f.amount,1,40,v=>{f.amount=v;update();},'具'+(i+1)+'の分量');
      const placement = select(opts.placement,f.placement,v=>{f.placement=v;update();},'具'+(i+1)+'の入れ方');
      quantity.disabled = placement.disabled = f.id==='none';
      row.append(field('具 '+(i+1), select({none:'なし',...opts.filling},f.id,v=>{
        f.id=v;quantity.disabled=placement.disabled=v==='none';update();
      },'具'+(i+1)+'の素材')),field('分量（g）',quantity),field('入れ方',placement));
      customize.append(row);
    }
    const naming = details('名前・説明を付ける',area);
    const name = entry('input',customName,36), desc = entry('textarea',customDescription,120);
    name.oninput = () => {customName=name.value;title.textContent=customName || name.placeholder;};
    desc.oninput = () => {customDescription=desc.value;};
    naming.append(field('餅の名前',name),field('餅の説明',desc));
    const footer = el('div',undefined,'living-confirm'), reason = el('p');
    const expectedBatchId = world.nextBatchId;
    const submit = button('調理を始める',()=>{
      const site = near('workshop');
      const preview = evaluateRecipe(world,draft,site?.region);
      if (!preview.ok) { updateReceipt(preview);return; }
      const name = customName, description = customDescription;
      disposeCraftPreview();
      const started = cook({
        site, draft:preview.recipe, name:name || preview.name,
        complete() {
          const result = craftRecipe(world,preview.recipe,{regionId:near('workshop')?.region,name,description,expectedBatchId});
          if (!result.ok) { choose('craft',result.reason);return; }
          recipeId = result.recipe.id;
          save();
          choose('book',result.message);
          area.querySelector('select')?.focus({preventScroll:true});
        },
        back() {
          choose('craft');
          area.querySelector('.living-confirm button')?.focus({preventScroll:true});
        },
      });
      if (!started) choose('craft','工房の景色を開けませんでした。もう一度お試しください。');
    },'jump-link');
    footer.append(reason,submit);
    area.append(footer);
    function refresh() {
      const v = evaluateRecipe(world,draft,station?.region);
      reason.textContent = v.reason || '';
      submit.disabled = !v.ok;
      submit.textContent = v.quantity ? v.quantity+'個分の調理を始める' : '調理を始める';
      if (!v.recipe) { summary.replaceChildren(); title.textContent = '分量を確かめてください'; canvas.hidden=true;return; }
      canvas.hidden=false;
      canvas.hidden = !renderCraftPreview(canvas,v.recipe);
      if (canvas.hidden) title.setAttribute('aria-label','立体見本を表示できません。配合と説明を確認してください。');
      title.textContent = customName || v.name;
      name.placeholder = v.name; desc.placeholder = v.description;
      summary.replaceChildren(el('h3','一仕込みの材料'),el('ul',undefined,'living-needs'));
      for (const [id,n] of Object.entries(v.requirements)) {
        const have=world.inventory[id] || 0, row=el('li');
        row.append(el('span',RESOURCES[id].name),el('strong',n+' g'));
        if (have<n) row.append(el('small','あと '+(n-have)+' g'));
        summary.lastElementChild.append(row);
      }
      const missing = Object.keys(v.requirements).filter(id => (world.inventory[id] || 0) < v.requirements[id]);
      if (missing.length) {
        const sources = new Set();
        for (const id of missing) {
          const gathered = LIVING_SITES.filter(s => s.resource === id);
          const shops = LIVING_SITES.filter(s => s.stock?.includes(id));
          if (gathered.length) sources.add(nearest(gathered));
          if (shops.length) sources.add(nearest(shops));
        }
        for (const site of sources) summary.append(route(site));
      }
      summary.append(el('p',v.description,'living-note'));
      attributes(summary,v.attributes,['aroma','chewy','travel']);
    }
    refresh();
  }
  function book() {
    if (!world.recipes.length) {
      const intro = section('最初の一枚',area);
      intro.append(el('p','餅を作ると、配合と仕上がりがここに残ります。支度の米と桜を使って、桜川の共同臼で一仕込みできます。'),
        button('餅作りを開く',()=>choose('craft'),'jump-link'));
      return;
    }
    const recipe = world.recipes.find(r=>r.id===recipeId) || world.recipes[world.recipes.length-1];
    recipeId = recipe.id;
    const selector = select(Object.fromEntries(world.recipes.map(r=>[r.id,r.name])),recipe.id,id=>{recipeId=id;choose('book');},'図鑑の餅');
    area.append(field('図鑑の餅',selector));
    const v = evaluateRecipe(world,recipe.draft,recipe.regionId);
    const layout = el('div',undefined,'living-layout');
    const sample = el('figure',undefined,'living-sample'), canvas = el('canvas');
    canvas.setAttribute('aria-label',recipe.name+'の仕上がり');
    sample.append(canvas,el('figcaption',recipe.name));
    const note = el('div',undefined,'living-summary');
    const batches = world.batches.filter(b=>b.recipeId===recipe.id);
    const remaining = batches.reduce((n,b)=>n+b.quantity,0);
    note.append(el('h3',v.traditionalRegion ? regionName(v.traditionalRegion)+'の郷土餅' : '創作餅'),el('p',recipe.description),
      el('p',worldClockLabel(recipe.createdMinute)+'　'+regionName(recipe.regionId)+'で初制作','living-note'),el('strong','手元に '+remaining+' 個'));
    layout.append(sample,note);area.append(layout);
    renderCraftPreview(canvas,recipe.draft);
    const uses = el('div',undefined,'actions living-use');
    if (remaining) {
      const target = nearGiftRecipient(game.state,game.storyCollisions);
      const consume = gift => {
        const recipient = gift && nearGiftRecipient(game.state,game.storyCollisions);
        if (gift && (!target || recipient?.id !== target.id)) { receipt.textContent='相手のそばで開き直してください。';return; }
        const result = useBatch(world,batches[0].id,gift?{recipient}:{player});
        if (result.ok) save();
        choose('book',result.message || result.reason);
      };
      uses.append(button('ひとつ味見する',()=>consume(false),'jump-link'));
      if (target) uses.append(button(target.name+'にひとつ贈る',()=>consume(true)));
      else uses.append(el('span','道を行く兎や蛙に歩いて近づき、餅図鑑を開くと贈れます。','living-note'));
    }
    uses.append(button('この配合で作る',()=>{resetDraft(recipe.draft,'free');customName=recipe.name;customDescription=recipe.description;choose('craft');}));
    area.append(uses);
    if (remaining) uses.append(button('商いを開く',()=>choose('market')));
    const spec = details('配合と持ち味',area);
    spec.append(el('p',Object.entries(v.requirements).map(([id,n])=>RESOURCES[id].name+' '+n+' g').join('、')));
    attributes(spec,batches[0]?.attributes || v.attributes);
    const notes = details('名前・説明を書き直す',area), name = entry('input',recipe.name,36), desc = entry('textarea',recipe.description,120);
    notes.append(field('名前',name),field('説明',desc),button('書き留める',()=>{
      const result=renameRecipe(world,recipe.id,name.value,desc.value);
      if (result.ok) save();
      choose('book',result.message || result.reason);
    }));
    const tastings = world.tastings.filter(t=>t.recipeId===recipe.id).slice(-5).reverse();
    if (tastings.length) {
      const history = section('味見と贈り物の記録',area);
      for (const t of tastings) history.append(el('p',t.message));
    }
  }
  function rest() {
    const name = game.restSite();
    const place = section(name || '休める場所',area);
    if (!name) {
      place.append(el('p','旅籠の入口や茶屋の腰掛け、自分の野営地の寝床で、朝・昼・夕方・夜まで休めます。'),route(nearest(REST_SITES)));
      const camps=world.structures.filter(s=>s.kind==='camp');
      if(camps.length) place.append(route({...nearest(camps),name:'自分の野営地'}));
      return;
    }
    place.append(el('p','休み終える時刻を選んでください。'));
    const times = el('div',undefined,'actions');
    for (const hour of WAIT_HOURS) {
      const nextDay = Math.floor(waitTargetMinute(world.worldMinute,hour)/DAY_MINUTES) > Math.floor(world.worldMinute/DAY_MINUTES);
      times.append(button((nextDay?'翌日 ':'今日 ')+hour+'時まで',()=>{
        const result = game.waitUntil(hour);
        if (result.ok) save();
        choose('rest',result.ok ? name+'で休みました。' : result.reason);
      }));
    }
    place.append(times);
  }
  return {
    open(section = 'supplies') {
      if (section === 'craft' && !draft) resetDraft(firstMochi,'blossom');
      choose(section);
    },
    close() { homestead.clearPreview();disposeCraftPreview();delete dialog.dataset.living; },
  };
}
