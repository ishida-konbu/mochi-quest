import { drawMap } from './map.js';
import { atlasHit } from './atlas-marks.js';
import { atlasView, bindAtlasViewport, maxAtlasZoom } from './atlas-viewport.js';
import { mapPoint } from './wayfinding.js';
import { WORLD_BOUND, wrapWorld } from './geography.js';

function travelNotes(coarse) {
  return {
    snow: '花の京から北東の峠を越えると、雪灯りの街です。参道の五重塔に登り、北を向くと冬の海。御朱印所の東には雪見の大露天風呂があります。',
    autumn: '楓の枝が重なる谷道。紅葉をくぐって峡へ。',
    moon: '北の空には十五夜の月。薄のそばの三方に近づくと、月見団子を食べられます。',
    dawn: '東の海から昇る初日。浜では臼を囲んで餅をつく。',
    kyo: '南の石段を上り、羅生門をくぐって京へ。門の東脇の木階段は老婆が暮らす楼上へ、西の大路は評定所へ通じます。夕暮れには衛士が辻の篝火を灯し、軒の提灯と家々の行燈が浮かびます。大路から東を望めば「福」、北には「大」の送り火。都の南東、地図の「清」が清水寺です。舞台から西を望むと京が一望できます。鐘楼の梵鐘には三条通知が届きます。',
    peach: '竹隠れの社から西へ、尾根の間を縫う谷道をたどってください。山あいを抜けると桃林が開けます。里には花桃の瓢湯が湧き、木陰の土俵では兎と蛙が相撲を取っています。',
    ryugu: '海風の松原から西へ泳ぎ、'+(coarse?'「潜る」':'Space＋↓')+'を長押しして海底へ。真珠灯籠をたどり、楼門の先の御朱印所へ。御殿の水門をくぐると内海に出ます。正面の段から板間へ上がり、二つの階段をたどると三階の「栄螺の壺湯」です。',
    todaiji: '回廊の先に、蓮の座に鎮まる大餅仏。参道で鹿が兎に一礼し、脇では猿と兎が筆を運びます。',
    tsuruga: '京から北山の麓をたどった先、北の入り江に開いた敦賀の津。昆布や塩を扱う家の先に、大船をつなぐ桟橋があります。甲板の船梯子を下ると荷の積まれた船倉です。',
    sakai: '京の南西の湊町。陶器や染布を荷造りする商家を抜けると、外洋をめぐる大船が出入りする波止場です。',
    inari: '京から南の街道をたどり、朱塗りの千本鳥居をくぐって雲上の奥社へ。日が差す雨の参道には、狐の嫁入りの行列が現れます。'
  };
}

const bearings = ['北','北東','東','南東','南','南西','西','北西'];
function directions(player,place) {
  const dx = wrapWorld(place.x-player.x), dz = wrapWorld(place.z-player.z);
  const distance = Math.round(Math.hypot(dx,dz));
  const bearing = bearings[(Math.round(Math.atan2(dx,-dz)/(Math.PI/4))+8)%8];
  return distance < 3 ? '現在地のすぐそば' : '現在地から'+bearing+' '+distance+' m';
}
function samePlace(a,b) {
  return a && b && a.kind === b.kind && (a.id ? a.id === b.id : a.x === b.x && a.z === b.z);
}

export function openAtlas(body, {state,yaw,destinations,initialRegion,goal,recipient,recipientName,coarse,
  setGoal,close,canDeliver,deliver,openBook,teleport}) {
  const player = state.player, regions = destinations.filter(place=>place.kind === 'region');
  const notes = travelNotes(coarse);
  let selection = goal || regions.find(region=>region.id===initialRegion) || regions[0];
  let tab = selection.kind === 'region' || selection.kind === 'point' ? 'scenes' : 'stops';
  let district = selection.region, marks = [];
  const centre = goal || recipient || selection;
  body.innerHTML = `<div class="atlas-layout">
    <section class="atlas-sheet" aria-label="地図">
      <div class="atlas-tools"><div class="atlas-zoom" role="group" aria-label="地図の縮尺">
        <button id="atlas-out" aria-label="地図を縮小">−</button><output id="atlas-ratio" aria-label="地図の倍率" aria-live="off"></output><button id="atlas-in" aria-label="地図を拡大">＋</button>
      </div><div class="atlas-locate"><button id="atlas-fit">全図</button><button id="atlas-here">現在地</button></div></div>
      <div class="atlas-frame"><canvas id="atlas" width="540" height="540" tabindex="0" aria-label="十七景の地図。矢印キーで印を移動、Shiftで微調整、Enterで道しるべを設定。プラスとマイナスで拡大縮小。"></canvas>
        <span class="atlas-north" aria-hidden="true">北<i></i></span><span class="atlas-scale" aria-hidden="true"></span></div>
      <p class="atlas-instruction"><span>${coarse?'タップで道しるべ、二本指で拡大縮小。':'クリックで道しるべ、ドラッグで移動、ホイールで拡大縮小。'}</span><span>矢印キーで印を動かし、Enterで道しるべに。Shiftで1 mずつ微調整。</span></p>
    </section>
    <section class="atlas-index" aria-label="行き先">
      <div class="atlas-tabs" role="group" aria-label="行き先の種類"><button data-tab="scenes">十七景</button><button data-tab="stops">立ち寄り処</button></div>
      <label class="atlas-district">景を選ぶ<select id="atlas-district"></select></label>
      <div class="atlas-entries" aria-label="行き先の一覧"></div>
      <div class="atlas-detail" aria-live="polite" aria-atomic="true"><span class="atlas-detail-seal" aria-hidden="true"></span><div>
        <small class="atlas-category"></small><h3></h3><p class="atlas-distance"></p></div></div>
      <div class="atlas-commands"><button class="jump-link" id="set-goal"></button><button class="choice" id="clear-goal">道しるべを外す</button><button class="choice" id="map-jump" hidden>この印へ瞬間移動</button></div>
      <p class="atlas-status" role="status"></p>
      <details class="atlas-notes"><summary>この景の見どころ</summary><p></p></details>
      <div class="atlas-links"><button id="local-animal">この景の動物に届ける</button><button id="atlas-book">配達帳を開く</button></div>
    </section></div>`;
  const find = selector => body.querySelector(selector), canvas = find('#atlas');
  const districtSelect = find('#atlas-district'), entries = find('.atlas-entries');
  for (const region of regions) districtSelect.add(new Option(region.glyph+'　'+region.name,region.id));
  function updateEntries() {
    find('.atlas-district').hidden = tab !== 'stops';
    districtSelect.value = district;
    for (const button of body.querySelectorAll('[data-tab]')) button.setAttribute('aria-pressed',button.dataset.tab===tab);
    const items = tab === 'scenes' ? regions : destinations.filter(place=>place.kind!=='region' && place.region===district);
    entries.dataset.tab = tab;
    entries.replaceChildren(...items.map(place=>{
      const row = document.createElement('button');
      row.dataset.id = place.id;
      row.innerHTML = '<i aria-hidden="true"></i><span></span>';
      row.querySelector('i').textContent = place.glyph;
      row.querySelector('span').textContent = place.kind === 'port' ? '電動自転車ポート' : place.name;
      if (place.kind === 'port') {
        const count = document.createElement('small'); count.textContent = place.object.bikes+'台'; row.append(count);
      }
      row.onclick = () => {
        select(place);
        viewport.focus(place,place.kind === 'region' ? 4 : 12);
      };
      return row;
    }));
    entries.scrollTop = 0;
    updateDetail();
  }
  function updateDetail() {
    for (const row of entries.children) row.setAttribute('aria-pressed',String(selection.id === row.dataset.id));
    const region = regions.find(r=>r.id === selection.region), active = samePlace(goal,selection);
    const category = selection.category || '任意の地点';
    find('.atlas-category').textContent = (selection.kind === 'region' ? '名所' : region.name+'　·　'+category)+(active?'　／　案内中':'');
    find('.atlas-detail-seal').textContent = selection.glyph || '印';
    find('.atlas-detail').dataset.active = String(Boolean(active));
    find('.atlas-detail h3').textContent = selection.kind === 'port' ? '電動自転車ポート' : selection.name;
    let distance = directions(player,selection);
    if (selection.kind === 'region') distance += '　·　'+(state.visited.includes(selection.id)?'御朱印あり':'未訪問');
    if (selection.kind === 'port') distance += '　·　貸出 '+selection.object.bikes+'台';
    find('.atlas-distance').textContent = distance;
    find('#set-goal').textContent = active ? 'この道しるべで旅を続ける' : 'ここを道しるべにする';
    find('#clear-goal').hidden = !goal && !recipient;
    find('#local-animal').hidden = !canDeliver(selection.region);
    find('.atlas-notes').hidden = !notes[selection.region];
    find('.atlas-notes p').textContent = notes[selection.region] || '';
  }
  function select(place) {
    const nextTab = place.kind === 'point' ? tab : place.kind === 'region' ? 'scenes' : 'stops';
    const rebuild = nextTab !== tab || (nextTab === 'stops' && district !== place.region);
    if (place.region !== selection.region) find('.atlas-notes').open = false;
    selection = place; district = place.region; tab = nextTab;
    find('.atlas-status').textContent = '';
    if (rebuild) updateEntries(); else updateDetail();
  }
  function pin() {
    goal = selection; recipient = null;
    setGoal(selection); updateDetail(); viewport.render();
  }
  const viewport = bindAtlasViewport(canvas,atlasView(centre.x,centre.z,selection.kind === 'region' ? 4 : 10),{
    draw(view,pixelRatio) {
      marks = drawMap(canvas,state,yaw,selection.id,true,selection.kind === 'point' ? selection : null,
        recipient,recipientName,{...view,pixelRatio,destinations,selection,activeGoal:goal});
      find('#atlas-ratio').textContent = Number(view.zoom.toFixed(1))+'×';
      find('#atlas-in').disabled = view.zoom >= maxAtlasZoom;
      find('#atlas-out').disabled = find('#atlas-fit').disabled = view.zoom <= 1;
      const metresPerPixel = 2*WORLD_BOUND/(view.zoom*canvas.clientWidth);
      const scale = [1,2,5,10,20,50,100,200,500,1000].filter(m=>m <= metresPerPixel*75).at(-1) || 1;
      const bar = find('.atlas-scale'); bar.style.width = (scale/metresPerPixel)+'px'; bar.textContent = scale+' m';
    },
    pick(world,at) {
      const place = atlasHit(marks,at.u*canvas.clientWidth,at.v*canvas.clientHeight) || mapPoint(world.x,world.z);
      if (place) { select(place); pin(); }
    },
    moveMark(dx,dz) {
      select(mapPoint(wrapWorld(selection.x+dx),wrapWorld(selection.z+dz)));
      return selection;
    },
    commitMark:pin,
  });
  find('#atlas-in').onclick = () => viewport.zoomBy(1.5);
  find('#atlas-out').onclick = () => viewport.zoomBy(1/1.5);
  find('#atlas-fit').onclick = viewport.fit;
  find('#atlas-here').onclick = () => viewport.focus(player,10);
  for (const button of body.querySelectorAll('[data-tab]')) button.onclick = () => {tab=button.dataset.tab; updateEntries();};
  districtSelect.onchange = () => {
    const next = destinations.find(place=>place.region===districtSelect.value && place.kind!=='region');
    select(next);
    viewport.focus(next,6);
  };
  find('#set-goal').onclick = () => { if (!samePlace(goal,selection)) pin(); close(); };
  find('#clear-goal').onclick = () => { setGoal(null); close(); };
  if (player.mode === 'kagami') {
    const jump = find('#map-jump'); jump.hidden = false;
    jump.onclick = () => { if (!teleport(selection)) find('.atlas-status').textContent='近くに降りられる場所を選んでください。'; };
  }
  find('#local-animal').onclick = () => deliver(selection.region);
  const dialog = body.closest('dialog');
  function dispose() { viewport.dispose(); dialog.removeEventListener('close',dispose); }
  dialog.addEventListener('close',dispose);
  find('#atlas-book').onclick = () => { dispose(); openBook(); };
  updateEntries(); viewport.render();
}
