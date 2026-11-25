import { closestTimberTrees, fellTree, transferStorage, transferBatchStorage, nearBuildStructure } from './living-build.js';
import { RESOURCES } from './living-resources.js';
import { wrapDelta } from './terrain.js';

const treeNames={pine:'松',maple:'楓',willow:'柳',oak:'樫',bamboo:'竹',moso:'孟宗竹','black-pine':'黒松',
  'red-pine':'赤松',ginkgo:'銀杏',plum:'梅',cypress:'檜',birch:'白樺',zelkova:'欅','silver-fir':'樅',
  larch:'落葉松',cherry:'桜',cedar:'杉',peach:'桃','cliff-pine':'岩場の松','shrine-bamboo':'竹','lake-willow':'湖畔の柳'};
const openGround = [
  {name:'桜川の里はずれ',x:20,z:87}, {name:'棚田の畦の外',x:158,z:131}, {name:'蔵町のはずれ',x:31,z:-54},
];
export function createHomesteadBook({game,save,saw,el,button,section,field,select,number,details,route,choose}) {
  const world=game.state.livingWorld,p=game.state.player;
  const dist=s=>Math.hypot(wrapDelta(s.x-p.x),wrapDelta(s.z-p.z));
  function result(r) {
    if (r.ok) save();
    choose('materials',r.message || r.reason);
  }
  function cutTree(tree,done) {
    saw(tree,()=>{
      const cut=fellTree(world,tree.id);
      if(cut.ok)save();
      return cut;
    },done);
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
        if (nearBuildStructure(world,p,'chest')?.id!==chest.id) {choose('materials','道具櫃のそばで開いてください。');return;}
        result(item.unit==='個' ? transferBatchStorage(world,chest.id,+item.key,quantity,deposit) :
          transferStorage(world,chest.id,item.key,quantity,deposit));
      }));
      stock.append(row);
    }
  }
  function render(area) {
    const chest=nearBuildStructure(world,p,'chest');
    if(chest)storage(chest,area);
    const setup=section('木材と収納',area);
    setup.append(el('p','小屋や道具櫃は野営地の周りに建てられます。桜川・棚田・蔵町には、野営地がなくても餅売り棚を出せます。'),
      button('建てるモードを開く',()=>choose('build'),'jump-link'));
    const hints=details('空き地を探す',setup);
    hints.append(el('p','行き先を選び、道しるべを頼りに里の外へ歩いてみましょう。気に入った空き地に着いたら、「建てる」モードを開いてください。'));
    const routes=el('div',undefined,'living-waypoints');
    for(const site of [...openGround].sort((a,b)=>dist(a)-dist(b))) routes.append(route(site));
    hints.append(routes);
    const forest=section('木材を集める',area);
    const pageSize=8;
    let skip=0;
    const choices=el('div');
    const forestNote=el('p');
    forest.append(forestNote,choices);
    function showTrees(){
      const batch=closestTimberTrees(world,p,pageSize+1,Infinity,skip),trees=batch.slice(0,pageSize);
      choices.replaceChildren();
      if(!trees.length){
        forestNote.textContent='島の木はすべて伐り終えました。棚田の米売り場と蔵町の菜の露店でも、木材四本を六文で買えます。';
        return;
      }
      forestNote.textContent=(skip || batch.length>pageSize?'近い木から八本ずつ選べます。':'近い木から順に選べます。')+'一本伐ると木材六本が手に入り、切り株が残ります。';
      const label=tree=>{
        const angle=Math.atan2(wrapDelta(tree.x-p.x),-wrapDelta(tree.z-p.z));
        const bearing=['北','北東','東','南東','南','南西','西','北西'][(Math.round(angle/(Math.PI/4))+8)%8];
        return (treeNames[tree.kind]??'立木')+'　'+bearing+' '+tree.distance.toFixed(1)+' m';
      };
      let selected=trees[0];
      const picker=select(Object.fromEntries(trees.map(t=>[t.id,label(t)])),selected.id,
        id=>{selected=trees.find(t=>t.id===id);},'伐る木');
      choices.append(field('伐る木',picker),
        button('この木を伐って木材を取る',()=>cutTree(selected,r=>choose('materials',r.message||r.reason))));
      if(skip || batch.length>pageSize){
        const nav=el('div',undefined,'living-waypoints');
        function turnPage(delta){skip+=delta;showTrees();choices.querySelector('select').focus({preventScroll:true});}
        if(skip)nav.append(button('前の木を見る',()=>turnPage(-pageSize)));
        if(batch.length>pageSize)nav.append(button('次の木を見る',()=>turnPage(pageSize)));
        choices.append(nav);
      }
    }
    showTrees();
  }
  return {render};
}
