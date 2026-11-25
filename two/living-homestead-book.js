import { BUILD_MODULES, surveySite, constructionSite, finishConstruction, moveStructure, removeStructure, nearestTimberTree, fellTree,
  transferStorage, transferBatchStorage, nearBuildStructure } from './living-build.js';
import { marketLocation } from './living-market.js';
import { RESOURCES } from './living-resources.js';
import { REGIONS, wrapCoord, wrapDelta, terrainHeight } from './terrain.js';

const terrainNames = {plain:'平地', slope:'斜面・束柱の基礎', bank:'水辺・高床の基礎', snow:'雪国・雪を逃がす造り'};
const openGround = [
  {name:'桜川の里はずれ',x:20,z:87}, {name:'棚田の畦の外',x:158,z:131}, {name:'蔵町のはずれ',x:31,z:-54},
];
const onFoot = p => p.grounded && p.h < .15 && !p.inWater && !p.mount && !p.vessel && !p.skiff && !p.activity;
const price = d => [d.wood && '木材'+d.wood+'本', d.coins && d.coins+'文'].filter(Boolean).join('・');
const where = id => REGIONS.find(r=>r.id===id)?.name ?? '';

export function createHomesteadBook({game,dialog,body,heading,save,preview,bearing,saw,construct,returnToSite,el,button,section,field,select,number,details,route,choose}) {
  const world=game.state.livingWorld, p=game.state.player;
  let kind='camp', selectedId=null;
  const dist=s=>Math.hypot(wrapDelta(s.x-p.x),wrapDelta(s.z-p.z));
  function result(r) {
    if (r.ok) save();
    choose('build',r.message || r.reason);
  }
  function clearPreview() {
    if (dialog.hasAttribute('data-survey')) {
      delete dialog.dataset.survey;
      preview(null);
    }
  }
  function survey(type, existing, retry) {
    if (!onFoot(p)) {choose('build','地面に降りて足を止めると、土地を見立てられます。');return;}
    const angle=bearing(), sin=Math.sin(angle), cos=Math.cos(angle);
    let side=retry?.side ?? 0, forward=retry?.forward ?? 3.7, turn=retry?.turn ?? existing?.yaw ?? angle;
    if (existing) {
      const dx=wrapDelta(existing.x-p.x),dz=wrapDelta(existing.z-p.z);
      side=dx*cos-dz*sin;forward=-dx*sin-dz*cos;
    }
    dialog.dataset.survey='';
    heading.textContent=BUILD_MODULES[type].name+(existing?'の移設':'の場所選び');
    body.replaceChildren();
    const tip=el('p',undefined,'survey-verdict');
    tip.setAttribute('role','status');
    const nav=el('div',undefined,'survey-arrows');
    const footnote=el('span',undefined,'survey-cost');
    const actions=el('div',undefined,'survey-actions');
    const options={state:game.state,excludeId:existing?.id};
    let pose, viewYaw=angle;
    const commit=button(existing?'ここに移す':'ここで建て始める',()=>{
      if (existing) {
        const moved=moveStructure(world,existing.id,pose,options);
        if (!moved.ok) {tip.textContent=moved.reason;return;}
        selectedId=moved.structure.id;
        result(moved);
        return;
      }
      const site=constructionSite(world,type,pose,options);
      if (!site.ok) {tip.textContent=site.reason;return;}
      commit.disabled=true;
      for (const control of nav.querySelectorAll('button')) control.disabled=true;
      tip.textContent='材料をそろえ、作業の足場を確かめています。';
      // Let the status paint before planning routes for a whole house. The
      // traveller may still leave the survey while the browser is waiting.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if (dialog.open && commit.isConnected && dialog.hasAttribute('data-survey')) begin(site);
      }));
    },'jump-link');
    function begin(site) {
      clearPreview();
      construct({...site,kind:type,structures:world.structures},exit=>{
        const built=finishConstruction(world,type,pose,game.state,exit);
        if (built.ok) {
          selectedId=built.structure.id;
          save();
        }
        return built;
      },built=>{
        const nextStep={stand:'棚のそばで「商い」を開くと、餅を並べたり売上を受け取ったりできます。',camp:'寝床のそばで「ひと休み」を開くと、いつまで休むかを選べます。',chest:'櫃のそばで「家づくり」を開くと、食材や餅を預けられます。'};
        if (built.ok) returnToSite(built.message+(nextStep[type] ?? ''));
        else if (built.retrySite) survey(type,null,{side,forward,turn,reason:built.reason});
        else choose('build',built.reason);
      });
    }
    function refresh() {
      pose={x:wrapCoord(p.x+side*cos-forward*sin),z:wrapCoord(p.z-side*sin-forward*cos),yaw:turn};
      const site=surveySite(world,type,pose,options),def=BUILD_MODULES[type];
      const funds=existing || (world.wood>=def.wood && world.wallet>=def.coins);
      commit.disabled=!site.ok || !funds;
      if (!site.ok) tip.textContent=site.reason;
      else {
        const land=terrainNames[site.terrain] ?? '';
        const verdict=funds ? (existing?'移設できます。':'設置できます。') : '木材か銭が足りません。';
        tip.textContent=land+'。'+verdict+(site.parentId?'板床に位置を合わせました。':'');
        if (type==='stand') {
          const location=marketLocation(site);
          tip.textContent+='ここは'+location.footfall+'場所です。'+location.note;
        }
      }
      footnote.textContent=(existing ? '移設は無料' : '必要　'+price(def))+' ／ 手持ち　木材'+world.wood+'本・'+world.wallet+'文';
      viewYaw=preview({...pose,y:terrainHeight(pose.x,pose.z),...site,kind:type,ok:site.ok}) ?? angle;
    }
    function shift(dx,dz) {
      const a=viewYaw-angle;
      side=Math.max(-6,Math.min(6,side+dx*Math.cos(a)-dz*Math.sin(a)));
      forward=Math.max(-6,Math.min(7,forward+dx*Math.sin(a)+dz*Math.cos(a)));
      refresh();
    }
    for (const [name,dx,dz] of [['左',-.5,0],['奥',0,.5],['手前',0,-.5],['右',.5,0]]) {
      const move=button(name,()=>shift(dx,dz));
      move.setAttribute('aria-label',name+'へ半歩');nav.append(move);
    }
    nav.append(button('回す',()=>{turn=Math.atan2(Math.sin(turn+Math.PI/4),Math.cos(turn+Math.PI/4));refresh();}));
    actions.append(footnote,button('戻る',()=>choose('build')),commit);
    body.append(tip,nav,actions);dialog.scrollTop=0; refresh();
    if (retry) {tip.textContent=retry.reason;commit.disabled=true;}
    nav.firstElementChild.focus({preventScroll:true});
  }
  function storage(chest,area) {
    const stock=section('道具櫃の中身',area);
    for (const deposit of [true,false]) {
      const source=deposit ? world : chest, verb=deposit ? '預ける' : '取り出す';
      const items=Object.entries(source.inventory).filter(([,q])=>q>0).map(([id,q])=>({key:id,q,label:RESOURCES[id].name+'　'+q+' g',unit:'g'}));
      for(const b of source.batches)items.push({key:String(b.id),q:b.quantity,
        label:(world.recipes.find(r=>r.id===b.recipeId)?.name ?? '餅')+'　'+b.quantity+'個（仕込み'+b.id+'）',unit:'個'});
      if(!items.length) {stock.append(el('p',deposit?'素材袋は空です。':'櫃は空です。'));continue;}
      let item=items[0],quantity=item.q;
      const row=el('div',undefined,'living-storage-row');
      const qty=number(quantity,1,item.q,v=>{quantity=v;},verb+'数量');
      const qtyField=field('数量（'+item.unit+'）',qty);
      const which=select(Object.fromEntries(items.map(v=>[v.key,v.label])),item.key,key=>{
        item=items.find(v=>v.key===key);quantity=item.q;qty.value=qty.max=item.q;
        qtyField.firstChild.textContent='数量（'+item.unit+'）';
      },verb+'品物');
      row.append(field(deposit?'素材袋・手元の餅':'櫃にある品',which),qtyField,button(verb,()=>{
        if (nearBuildStructure(world,p,'chest')?.id!==chest.id) {choose('build','道具櫃のそばで開いてください。');return;}
        result(item.unit==='個' ? transferBatchStorage(world,chest.id,+item.key,quantity,deposit) :
          transferStorage(world,chest.id,item.key,quantity,deposit));
      }));
      stock.append(row);
    }
  }
  function render(area,preset) {
    if(Object.hasOwn(BUILD_MODULES,preset)) kind=preset;
    const chest=nearBuildStructure(world,p,'chest');
    if (chest) storage(chest,area);
    const setup=section('土地を見立てる',area);
    setup.append(el('p','野営地を設けると、寝床の周りに小屋や道具櫃（どうぐびつ）を置けます。桜川・棚田・蔵町には、野営地がなくても餅売り棚を出せます。'));
    const local=el('div',undefined,'living-build-picker');
    const summary=el('p',undefined,'living-note');
    const explain=()=>{
      const d=BUILD_MODULES[kind];
      summary.textContent='必要なもの　'+price(d)+'　／　手持ち　木材'+world.wood+'本・'+world.wallet+'文';
    };
    const picker=select(Object.fromEntries(Object.entries(BUILD_MODULES).map(([id,d])=>[id,d.name])),kind,v=>{kind=v;explain();},'建てるもの');
    local.append(field('建てるもの',picker),button('土地を見立てる',()=>survey(kind,null),'jump-link'));
    setup.append(local,summary);explain();
    const hints=details('空き地を探す',setup);
    hints.append(el('p','行き先を選び、道しるべを頼りに里の外へ歩いてみましょう。気に入った空き地に着いたら、もう一度この頁を開いて「土地を見立てる」を選んでください。'));
    const routes=el('div',undefined,'living-waypoints');
    for(const site of [...openGround].sort((a,b)=>dist(a)-dist(b))) routes.append(route(site));
    hints.append(routes);
    const forest=section('木材を集める',area);
    const tree=nearestTimberTree(world,p);
    if(tree) {
      forest.append(el('p','この木を伐ると、木材が六本手に入り、ここには切り株が残ります。'),
        button('この木を伐って木材を取る',()=>saw(tree,()=>{
          const cut=fellTree(world,tree.id,p);
          if(cut.ok) save();
          return cut;
        },r=>choose('build',r.message || r.reason))));
    } else {
      forest.append(el('p','桜川・棚田・蔵町の里山で、伐れる木の幹に近づいてこの頁を開いてください。木材は、棚田の「稲架の米売り場」と「蔵町の菜の露店」でも四本六文で買えます。'));
      const nearby=nearestTimberTree(world,p,85);
      if(nearby) forest.append(route({...nearby,name:'伐採できる木'}));
    }
    const owned=world.structures.slice().sort((a,b)=>dist(a)-dist(b));
    if(!owned.length)return;
    const manage=section('建てたもの',area);
    let s=owned.find(v=>v.id===selectedId) ?? owned[0];
    const label=v=>BUILD_MODULES[v.kind].name+'　'+where(v.regionId)+'・'+Math.round(dist(v))+' m';
    manage.append(field('建物・部材',select(Object.fromEntries(owned.map(v=>[v.id,label(v)])),s.id,id=>{selectedId=id;choose('build');},'建物・部材')));
    manage.append(route({...s,name:BUILD_MODULES[s.kind].name}));
    if (!onFoot(p) || dist(s)>7 || Math.abs(p.y-s.y)>3) {manage.append(el('p','移設や撤去は建物のそばで行えます。'));return;}
    const actions=el('div',undefined,'living-use');
    if(!s.parentId || s.kind==='chest')actions.append(button('移す場所を選ぶ',()=>survey(s.kind,s)));
    else actions.append(el('p','柱・壁・屋根は、取り付けた板床を選ぶと一緒に移せます。'));
    const take=details('撤去して材料を戻す',manage);
    const before=s.kind==='stand'?'棚の餅と銭箱の売上を先に回収してください。':
      s.kind==='chest'?'中の品を先に取り出してください。':'';
    take.append(el('p',before+'撤去すると、建てるときに使った'+price(BUILD_MODULES[s.kind])+'が戻ります。'),
      button('撤去する',()=>result(removeStructure(world,s.id))));
    manage.insertBefore(actions,take);
  }
  return {render,clearPreview};
}
