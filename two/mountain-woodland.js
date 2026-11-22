// Survey ellipses enclose individual watersheds, including their wooded skirts.
// Heights are the local foot and crest in world metres. Adjacent watersheds
// share a boundary so their populations can be counted without overlap.
import { DISTRICTS } from './geography.js';
import { HIGASHIYAMA, KITAYAMA, NISHIYAMA, westRidgeHeight } from './higashiyama.js';
import { TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';

const peach=DISTRICTS.peach,inari=DISTRICTS.inari;
export const MOUNTAIN_WOODS=[
  ['peach',peach.x+9,peach.z-17,299,169,5,101,[6,7,12,3,1],[1,3,0]],
  ['inari',inari.x-71,inari.z+56,217,168,5,110,[2,2,3,3,13],[2,3,1]],
  ['higashi',HIGASHIYAMA.x-17,HIGASHIYAMA.z,235,263,5,164,[2,3,12,13,1],[1,1,2,0]],
  ['kita',KITAYAMA.x,KITAYAMA.z+10,255,240,5,145,[2,2,3,4,9],[4,2,1]],
  ['capital-pass',29,-592,197,105,5,93,[2,3,9,12,13],[1,2,3]],
  ['temple-pass',331,674,183,166,5,37,[2,3,12,13,1],[1,2,3]],
  ['snow',-84,-313,114,56,4,36,[4,4,9,5,2],[4,4,5]],
  ['maple',288,-154,84,83,4,44,[11,11,11,10,12,13],[11,5,1]],
  ['hot-spring',151,-147,84,77,4,35,[2,3,9,13,5],[1,3,5]],
  ['bamboo-pass',-139,-134,88,76,4,33,[3,2,13,12,7],[2,3,1]],
  ['rice-terraces',163,153,83,60,4,22,[6,12,13,1],[1,3,9]],
  ['moon-hill',-73,201,79,57,4,26,[12,13,9,1],[1,9,3]],
  ['nishi',NISHIYAMA.x-4,NISHIYAMA.z-24,178,154,5,96,[2,2,12,3,13],[2,1,3]],
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

// Index each crown by the cells it touches. The candidate brings its own
// radius, so a broad old oak shades out more seedlings than a young cypress.
function plantingGrid(){
  const buckets=new Map(),size=12;
  const key=(i,j)=>i*1024+j;
  function reserve(x,z,r){
    const crown={x,z,r};
    for(let i=Math.floor((x-r)/size);i<=Math.floor((x+r)/size);i++)
      for(let j=Math.floor((z-r)/size);j<=Math.floor((z+r)/size);j++){
        const k=key(i,j);
        if(!buckets.has(k))buckets.set(k,[]);
        buckets.get(k).push(crown);
      }
  }
  function occupied(x,z,r){
    for(let i=Math.floor((x-r)/size);i<=Math.floor((x+r)/size);i++)
      for(let j=Math.floor((z-r)/size);j<=Math.floor((z+r)/size);j++)
        if(buckets.get(key(i,j))?.some(t=>(t.x-x)**2+(t.z-z)**2<(t.r+r)**2))return true;
    return false;
  }
  return {reserve,occupied};
}

function crownRoom(family,height){
  const spread=TREE_FAMILIES[family]?.[3] ?? .50;
  return Math.max(2.2,.8*spread*height);
}

export function plantMountainWoods(trees,rocks,orchard,cliffPines,height,canPlant,seeded){
  const grid=plantingGrid();
  for(const t of trees)grid.reserve(t.x,t.z,crownRoom(Math.floor(t.form/TREE_FORMS_PER_FAMILY),t.h));
  for(const t of orchard)grid.reserve(t.x,t.z,3.8*t.size);
  for(const t of cliffPines)grid.reserve(t.x,t.z,3.5);
  for(const r of rocks)grid.reserve(r.x,r.z,Math.max(r.rx,r.rz)+.5);

  for(const [i,range] of MOUNTAIN_WOODS.entries()){
    const random=seeded(0x26d710+i*3571);
    // Seed rain scales with land area. The older orchard, cliff pines and
    // established woodland have already occupied much of the richer ground.
    const attempts=Math.ceil(4*range.rx*range.rz/16);
    for(let j=0;j<attempts;j++){
      const x=range.x+(2*random()-1)*range.rx,z=range.z+(2*random()-1)*range.rz;
      if(woodlandAt(x,z)!==range || grid.occupied(x,z,2.2))continue;
      const ground=height(x,z),ascent=(ground-range.foot)/(range.crest-range.foot);
      if(ascent<0 || ascent>1)continue;

      // Long copses break into glades at their edges. Higher up, a few
      // wind-shaped stems mark the ridgeline between the exposed shoulders.
      const fold=.5+.32*Math.sin(.064*x+.033*z+i)+.18*Math.sin(.031*x-.060*z-i);
      const cover=(.05+.92*fold*fold)*(.035+.965*(1-ascent)**2.4);
      if(random()>cover || !canPlant(x,z,ground))continue;
      const grade=Math.hypot(height(x+1,z)-ground,height(x,z+1)-ground);
      if(grade>1.1 || grade>.65 && random()<.55)continue;

      const familyPool=ascent>.58 ? range.upper : range.lower;
      const family=familyPool[Math.floor(random()*familyPool.length)];
      const h=(5.1+random()*5.4)*(1-.36*ascent),room=crownRoom(family,h);
      if(grid.occupied(x,z,room))continue;
      const form=family*TREE_FORMS_PER_FAMILY+Math.floor(random()*TREE_FORMS_PER_FAMILY);
      trees.push({x,z,h,form,kind:TREE_FAMILIES[family][0],seed:Math.floor(random()*1e8),woodland:range.id});
      grid.reserve(x,z,room);
    }
  }
}
