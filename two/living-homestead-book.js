import { nearestTimberTree, transferStorage, transferBatchStorage, nearBuildStructure } from './living-build.js';
import { RESOURCES } from './living-resources.js';
import { wrapDelta } from './terrain.js';

const treeNames={pine:'松',maple:'楓',willow:'柳',oak:'樫',bamboo:'竹',moso:'孟宗竹','black-pine':'黒松',
  'red-pine':'赤松',ginkgo:'銀杏',plum:'梅',cypress:'檜',birch:'白樺',zelkova:'欅','silver-fir':'樅',
  larch:'落葉松',cherry:'桜',cedar:'杉',peach:'桃','cliff-pine':'岩場の松','shrine-bamboo':'竹','lake-willow':'湖畔の柳'};
const openGround = [
  {name:'桜川の里はずれ',x:20,z:87}, {name:'棚田の畦の外',x:158,z:131}, {name:'蔵町のはずれ',x:31,z:-54},
];
export function createHomesteadBook({game,save,el,button,section,field,select,number,details,route,choose}) {
  const world=game.state.livingWorld,p=game.state.player;
  const dist=s=>Math.hypot(wrapDelta(s.x-p.x),wrapDelta(s.z-p.z));
  function result(r) {
    if (r.ok) save();
    choose('materials',r.message || r.reason);
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
    forest.append(el('p','木のそばでEキーを押すか、「手斧で木を伐る」をタップします。ひと押しで三度斧を入れ、木材が六本手に入ります。'));
    const tree=nearestTimberTree(world,p);
    if(tree){
      const name=treeNames[tree.kind]??'立木';
      forest.append(route({...tree,name},'近くの'+name+'へ道しるべ　'+Math.round(tree.distance)+' m'));
    }
    forest.append(el('p','旅の中で丸一日たつと、木はまた生えてきます。木が建物にぶつかる場所では、切り株のまま残ります。'));
    forest.append(el('p','棚田の米売り場と蔵町の菜の露店では、木材四本を六文で買えます。'));
  }
  return {render};
}
