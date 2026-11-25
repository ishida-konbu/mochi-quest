// Panel artwork is rendered from the same timber kits used in the world.
import {BUILD_MODULES} from './living-build-state.js';

const order=['camp','stand','hut','chest','floor','posts','wall','roof','fence'];
const icons={
  build:'<path d="m4 12 8-7 8 7M6 10v10h12V10M10 20v-6h4v6"/>',
  select:'<path d="m6 3 12 10-6 1-3 6z"/>',
  grid:'<path d="M3 7h18M3 16h18M8 3v18M16 3v18"/>',
  range:'<path stroke-dasharray="3 3" d="M3.5 4.5h17v15h-17z"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>',
  move:'<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3M19 9l3 3-3 3"/>',
  turn:'<path d="M5 10a8 8 0 1 1 1 9M5 4v6h6"/>',
  materials:'<path d="M4 10h16v9H4zM7 10V7h10v3M3 14h18M10 14v2h4v-2"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3M12 17h.01"/>',
};
function icon(name){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+icons[name]+'</svg>';
}
const short={camp:'野営地の寝床',stand:'餅売り棚',hut:'板張りの小屋',chest:'道具櫃',floor:'板床',posts:'四本柱',wall:'板壁',roof:'板葺き屋根',fence:'竹垣'};
export const buildName=kind=>short[kind]??BUILD_MODULES[kind]?.name??'部材';

export function createBuildPanel(onAction){
  const shell=document.createElement('section');
  shell.className='build-editor';
  shell.innerHTML=`
    <div class="build-board" role="group" aria-label="建築の編集領域" tabindex="0"></div>
    <div class="build-palette">
      <header class="build-title"><h2 id="build-mode-title">建てる</h2><button data-act="close" title="探索に戻る" aria-label="建てるモードを終了">${icon('close')}</button></header>
      <div class="build-tabs"><button data-act="new">${icon('build')}新築する</button><button data-act="manage">${icon('select')}建てたもの</button></div>
      <div class="build-cards" role="group" aria-label="建てるもの"></div>
      <div class="build-owned"><label for="build-owned-list">建てたものから選ぶ</label><select id="build-owned-list"><option value="">建物・部材を選択</option></select><button data-act="range">${icon('range')}範囲選択</button></div>
      <div class="build-ticket">
        <h3></h3>
        <table aria-label="材料の見積もり"><thead><tr><th scope="col">材料</th><th scope="col" data-needed>必要</th><th scope="col">手持ち</th><th scope="col" data-balance>不足</th></tr></thead>
          <tbody><tr><th scope="row">木材<span>（本）</span></th><td></td><td></td><td></td></tr><tr><th scope="row">銭<span>（文）</span></th><td></td><td></td><td></td></tr></tbody></table>
        <p class="build-ground"></p>
        <p class="build-verdict" role="status" aria-live="polite"></p>
        <div class="build-choice-actions"><button data-act="move">${icon('move')}${icon('turn')}移動・回転</button><button data-act="remove">${icon('close')}撤去</button></div>
        <div class="build-confirm"><button data-act="cancel">戻る</button><button data-act="confirm"></button></div>
        <button data-act="mark-tree" hidden>敷地の木へ道しるべ</button>
      </div>
      <button class="build-stock-link" data-act="materials">${icon('materials')}木材・収納を開く</button>
    </div>
    <span class="build-board-hint" aria-hidden="true"></span>
    <div class="build-tools"><button data-act="grid" title="グリッドガイド">${icon('grid')}<span>グリッド</span></button><button data-act="help" aria-expanded="false" aria-label="建てるモードの操作説明">${icon('help')}</button></div>
    <section class="build-help" hidden><h3>配置のしかた</h3><p>枠をドラッグして移動。丸い矢印をドラッグすると15度ずつ回せます。背景をドラッグすると見回せます。</p><p>矢印キーで半歩ずつ移動、Q・Eで回転、Shift＋↑↓で高さを調整します。タッチでは＋と−で高さを変え、二本指で視点の移動・拡大縮小ができます。</p><p>「建てたもの」で建物を選びます。まとめて扱うときは「範囲選択」を押し、建物を囲んでください。</p><button data-act="help">閉じる</button></section>
    <div class="build-adjust" aria-label="向きと基礎の高さ">
      <div><button data-act="turn-left" aria-label="左へ15度回転">${icon('turn')}</button><output data-angle></output><button data-act="turn-right" aria-label="右へ15度回転">${icon('turn')}</button></div>
      <div><button data-act="lower" aria-label="基礎を一段下げる">−</button><output data-height></output><button data-act="raise" aria-label="基礎を一段上げる">＋</button></div>
    </div>`;
  const find=s=>shell.querySelector(s),surface=find('.build-board'), cards=find('.build-cards');
  const act=name=>find('[data-act="'+name+'"]');
  for(const kind of order){
    const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('strong'),cost=document.createElement('small');
    b.type='button';b.dataset.kind=kind;b.setAttribute('aria-label',kind==='camp'?buildName(kind):BUILD_MODULES[kind].name);
    img.alt='';img.width=160;img.height=96;img.draggable=false;img.src=new URL('./assets/build-cards/'+kind+'.webp',import.meta.url).href;
    const d=BUILD_MODULES[kind],onFoundation=!['posts','wall','roof'].includes(kind);
    label.textContent=buildName(kind);cost.textContent='木材'+d.wood+(onFoundation?'本〜':'本')+(d.coins?'・'+d.coins+'文':'');
    b.setAttribute('aria-description','本体は木材'+d.wood+'本、銭'+d.coins+'文。'+(onFoundation?'土地と基礎の高さで木材が増えます。':''));
    b.append(img,label,cost);cards.append(b);
  }
  const help=find('.build-help'),owned=find('#build-owned-list');
  const setHelp=show=>{help.hidden=!show;act('help').setAttribute('aria-expanded',String(show));};
  shell.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.act==='help'){setHelp(help.hidden);return;}
    if(b.dataset.kind)onAction('kind',b.dataset.kind);
    else if(b.dataset.act)onAction(b.dataset.act);
  });
  owned.onchange=()=>{if(owned.value)onAction('pick',owned.value);};
  let listed=null;
  function update(data){
    const {tool,kind,ids,structures,wood,coins,needWood,needCoins,title,status,grounds,allowed,grid,range,angle,height,canLower,canRaise,busy}=data;
    const isNew=tool==='new', moving=tool==='move',removing=tool==='remove', editing=isNew||moving, selected=ids.length>0;
    shell.dataset.tool=tool;
    const hint=find('.build-board-hint');hint.textContent=editing?'枠をドラッグして移動':range?'ドラッグで建物を囲む':removing?'撤去する範囲を確認':'建物を選択';
    cards.hidden=!isNew;find('.build-owned').hidden=isNew;
    for(const b of cards.children)b.setAttribute('aria-pressed',String(b.dataset.kind===kind));
    act('new').setAttribute('aria-pressed',String(isNew));act('manage').setAttribute('aria-pressed',String(!isNew));
    act('range').setAttribute('aria-pressed',String(range));act('grid').setAttribute('aria-pressed',String(grid));
    act('range').disabled=tool!=='select';
    if(structures!==listed){
      listed=structures;owned.length=1;
      for(const s of listed)owned.add(new Option(buildName(s.kind)+'　'+s.id.slice(6)+'番',s.id));
    }
    owned.value=ids.length===1?ids[0]:'';owned.disabled=tool!=='select'||!structures.length;
    find('.build-ticket h3').textContent=title;
    const table=find('table');table.hidden=tool==='select';
    const refund=removing || moving && needWood<0;
    find('[data-needed]').textContent=refund?'返却':moving?'追加':'必要';
    find('[data-balance]').textContent=refund?'返却後':'不足';
    for(const [i,n,have] of [[0,needWood,wood],[1,needCoins,coins]]){
      const cells=table.tBodies[0].rows[i].cells,shortBy=Math.max(0,n-have);
      const balance=refund?have+Math.abs(n):shortBy;
      cells[1].textContent=data.unpriced?'—':Math.abs(n).toLocaleString('ja');
      cells[2].textContent=have.toLocaleString('ja');
      cells[3].textContent=data.unpriced || !Number.isSafeInteger(balance)?'—':balance.toLocaleString('ja');
      cells[3].classList.toggle('short',!refund && shortBy>0);
    }
    find('.build-ground').textContent=grounds;find('.build-ground').hidden=!grounds;
    const verdict=find('.build-verdict');if(verdict.textContent!==status)verdict.textContent=status;
    verdict.dataset.invalid=String(!allowed && tool!=='select');
    find('.build-choice-actions').hidden=tool!=='select'||!selected;
    find('.build-confirm').hidden=tool==='select';
    act('cancel').hidden=isNew;act('confirm').disabled=!allowed||busy;
    act('confirm').textContent=isNew?'ここに建てる':moving?'ここに移す':'撤去を確定';
    act('mark-tree').hidden=!data.blockingTree;
    find('.build-adjust').hidden=!editing;
    find('[data-angle]').textContent=angle+'°';find('[data-height]').textContent='高さ '+height;
    act('lower').disabled=!canLower;act('raise').disabled=!canRaise;
  }
  return {shell,surface,update,hideHelp:()=>{const was=!help.hidden;setHelp(false);return was;},
    focusKind(kind){cards.querySelector('[data-kind="'+kind+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'});}};
}
