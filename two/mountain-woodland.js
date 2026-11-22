// Survey ellipses enclose individual watersheds, including their wooded skirts.
// Heights are the local foot and crest in world metres. Adjacent watersheds
// share a boundary so their populations can be counted without overlap.
import { DISTRICTS } from './geography.js';
import { HIGASHIYAMA, KITAYAMA, NISHIYAMA, westRidgeHeight } from './higashiyama.js';
import { TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';

const peach=DISTRICTS.peach,inari=DISTRICTS.inari;
export const MOUNTAIN_WOODS=[
  ['peach',peach.x+9,peach.z-17,299,169,5,143,[6,7,12,3,1],[1,3,0]],
  ['inari',inari.x-71,inari.z+56,217,168,5,132,[2,2,3,3,13],[2,3,1]],
  ['higashi',HIGASHIYAMA.x-17,HIGASHIYAMA.z,235,263,5,174,[2,3,12,13,1],[1,1,2,0]],
  ['kita',KITAYAMA.x,KITAYAMA.z+10,255,240,5,157,[2,2,3,4,9],[4,2,1]],
  ['capital-pass',29,-592,197,105,5,29,[2,3,9,12,13],[1,2,3]],
  ['temple-pass',331,674,183,166,5,37,[2,3,12,13,1],[1,2,3]],
  ['lakeside',-84,-313,114,56,4,36,[4,4,9,5,2],[4,4,5]],
  ['maple',288,-154,84,83,4,42,[11,11,11,10,12,13],[11,5,1]],
  ['hot-spring',151,-147,84,77,4,32,[2,3,9,13,5],[1,3,5]],
  ['bamboo-pass',-139,-134,88,76,4,34,[3,2,13,12,7],[2,3,1]],
  ['rice-terraces',163,153,83,60,4,24,[6,12,13,1],[1,3,9]],
  ['moon-hill',-73,201,79,57,4,23,[12,13,9,1],[1,9,3]],
  ['nishi',NISHIYAMA.x-4,NISHIYAMA.z-24,178,154,5,116,[2,2,12,3,13],[2,1,3]],
].map(([id,x,z,rx,rz,foot,crest,lower,upper])=>({id,x,z,rx,rz,foot,crest,lower,upper}));

export function woodlandAt(x,z){
  let closest=1,range;
  for(const stand of MOUNTAIN_WOODS){
    const dx=(x-stand.x)/stand.rx,dz=(z-stand.z)/stand.rz,d=dx*dx+dz*dz;
    if(d<closest){range=stand;closest=d;}
  }
  return range;
}

// Where the skirts of two mountains meet, the surveyed stand owns its trees.
export function isNishiyamaTree(tree){
  return westRidgeHeight(tree.x,tree.z)>.5 || woodlandAt(tree.x,tree.z)?.id==='nishi';
}

export function growNishiyamaBamboo(trees){
  const stand=trees.filter(isNishiyamaTree);
  const candidates=stand.filter(t=>t.kind!=='bamboo' && t.kind!=='moso');
  const existing=stand.length-candidates.length;
  const target=Math.round(stand.length*.8)-existing;
  const moso=TREE_FAMILIES.findIndex(([kind])=>kind==='moso');
  // Neighbouring roots often belong to the same grove. A little seed-scale
  // variation breaks the edges where the groves meet the surviving trees.
  const groves=candidates.map(t=>({tree:t, score:
    Math.sin(.052*t.x+.033*t.z)+.74*Math.sin(.071*t.z-.028*t.x)
    +.38*Math.cos(.094*t.x-.064*t.z)+.85*((t.seed%997)/997-.5)}));
  groves.sort((a,b)=>a.score-b.score);
  for(let i=0;i<target;i++){
    const tree=groves[i].tree;
    tree.form=moso*TREE_FORMS_PER_FAMILY+tree.seed%TREE_FORMS_PER_FAMILY;
    tree.kind=TREE_FAMILIES[moso][0];
  }
}

// Small buckets keep both separation between living stems and the silhouettes
// of older boulders without an all-pairs search.
function plantingGrid(){
  const buckets=new Map(),size=9;
  const key=(i,j)=>i*1024+j;
  function reserve(x,z,r){
    for(let i=Math.floor((x-r)/size);i<=Math.floor((x+r)/size);i++)
      for(let j=Math.floor((z-r)/size);j<=Math.floor((z+r)/size);j++){
        const k=key(i,j);
        if(!buckets.has(k))buckets.set(k,[]);
        buckets.get(k).push({x,z,r2:r*r});
      }
  }
  function occupied(x,z){
    const group=buckets.get(key(Math.floor(x/size),Math.floor(z/size)));
    return group?.some(p=>(p.x-x)**2+(p.z-z)**2<p.r2);
  }
  return {reserve,occupied};
}

export function plantMountainWoods(trees,rocks,orchard,cliffPines,height,canPlant,seeded){
  const grid=plantingGrid(),counts=new Map();
  function census(tree,clearance){
    grid.reserve(tree.x,tree.z,clearance);
    const range=woodlandAt(tree.x,tree.z);
    if(range)counts.set(range,1+(counts.get(range)||0));
  }
  for(const t of trees)census(t,Math.max(3.3,.31*t.h));
  for(const t of orchard)census(t,4.1);
  for(const t of cliffPines)census(t,3.7);
  for(const r of rocks)grid.reserve(r.x,r.z,Math.max(r.rx,r.rz)+.8);

  for(const [i,range] of MOUNTAIN_WOODS.entries()){
    const random=seeded(0x26d710+i*3571),target=Math.round((counts.get(range)||0)*1.26);
    // A jittered survey samples each patch once. Sort by a weighted draw so the
    // first viable sites gather below the tree line without repeatedly testing
    // an already crowded peach shelf or a submerged corner of a headland.
    // In the peach valley the established orchard leaves only narrow pockets
    // between root systems; survey those shelves on a finer lattice.
    const sites=[],pitch=range.id==='peach'?1.3:3.25;
    for(let u=-range.rx;u<range.rx;u+=pitch)for(let v=-range.rz;v<range.rz;v+=pitch){
      const x=range.x+u+pitch*random(),z=range.z+v+pitch*random();
      if(woodlandAt(x,z)!==range || grid.occupied(x,z))continue;
      const ground=height(x,z),ascent=Math.max(0,(ground-range.foot)/(range.crest-range.foot));
      if(ground<range.foot || ascent>1)continue;
      const fold=Math.sin(.082*x+.047*z+i)+.7*Math.sin(.041*x-.079*z-i);
      const cover=(.012+.988*(1-ascent)**2.9)*(fold<-.76?.22:1);
      sites.push({x,z,ground,ascent,order:-Math.log(1-random())/cover});
    }
    sites.sort((a,b)=>a.order-b.order);
    let added=0,crestTrees=0;
    for(const {x,z,ground,ascent} of sites){
      if(added>=target)break;
      if(ascent>.75 && crestTrees>=Math.ceil(target*.017))continue;
      if(grid.occupied(x,z) || !canPlant(x,z,ground))continue;
      const grade=Math.hypot(height(x+1,z)-ground,height(x,z+1)-ground);
      if(grade>(range.id==='peach'?1.5:1.18) || grade>.73 && random()<.45)continue;
      const familyPool=ascent>.58 ? range.upper : range.lower;
      const family=familyPool[Math.floor(random()*familyPool.length)];
      const h=(5.1+random()*5.4)*(1-.36*ascent);
      const form=family*TREE_FORMS_PER_FAMILY+Math.floor(random()*TREE_FORMS_PER_FAMILY);
      trees.push({x,z,h,form,kind:TREE_FAMILIES[family][0],seed:Math.floor(random()*1e8),woodland:range.id});
      grid.reserve(x,z,Math.max(2.9,.36*h));added++;
      if(ascent>.75)crestTrees++;
    }
  }
}
