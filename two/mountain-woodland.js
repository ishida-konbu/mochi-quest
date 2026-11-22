// Survey ellipses enclose individual watersheds, including their wooded skirts.
// Heights are the local foot and crest in world metres. Adjacent watersheds
// share a boundary so their populations can be counted without overlap.
import { DISTRICTS } from './geography.js';
import { HIGASHIYAMA, KITAYAMA, NISHIYAMA, eastRidgeHeight, northRidgeHeight, westRidgeHeight } from './higashiyama.js';
import { TREE_FAMILIES, TREE_FORMS_PER_FAMILY } from './forest-forms.js';

const peach=DISTRICTS.peach,inari=DISTRICTS.inari;
export const MOUNTAIN_WOODS=[
  ['peach',peach.x+9,peach.z-17,299,169,5,143,[6,7,12,3,1],[1,3,0]],
  ['inari',inari.x-71,inari.z+56,217,168,5,132,[2,2,3,3,13],[2,3,1]],
  ['higashi',HIGASHIYAMA.x-17,HIGASHIYAMA.z,235,263,5,174,[2,3,12,13,1],[1,1,2,0]],
  ['kita',KITAYAMA.x,KITAYAMA.z+10,255,240,5,157,[2,2,3,4,9],[4,2,1]],
  ['capital-pass',29,-592,197,105,5,29,[2,3,9,12,13],[1,2,3]],
  ['temple-pass',331,674,183,166,5,37,[2,3,12,13,1],[1,2,3]],
  ['snow',-84,-313,114,56,4,36,[4,4,9,5,2],[4,4,5]],
  ['maple',288,-154,84,83,4,42,[11,11,11,10,12,13],[11,5,1]],
  ['hot-spring',151,-147,84,77,4,32,[2,3,9,13,5],[1,3,5]],
  ['bamboo-pass',-139,-134,88,76,4,34,[3,2,13,12,7],[2,3,1]],
  ['rice-terraces',163,153,83,60,4,24,[6,12,13,1],[1,3,9]],
  ['moon-hill',-73,201,79,57,4,23,[12,13,9,1],[1,9,3]],
  ['nishi',NISHIYAMA.x-4,NISHIYAMA.z-24,178,154,5,116,[2,2,12,3,13],[2,1,3]],
].map(([id,x,z,rx,rz,foot,crest,lower,upper])=>({
  id,x,z,rx,rz,foot,crest,lower,upper,
  coppice:id==='kita' || id==='higashi' ? [1,13,2,12] : [],
}));

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
  if(tree.kyotoRidge)return tree.kyotoRidge==='nishi';
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

// A mature trunk leaves room for narrow younger stems under the dripline.
// Reserve the real boulders as well as trunks before surveying the new layer.
export function plantKyotoWoods(trees,rocks,height,canPlant,seeded){
  const grid=plantingGrid();
  for(const t of trees)grid.reserve(t.x,t.z,Math.max(1.95,t.h*.24));
  for(const r of rocks)grid.reserve(r.x,r.z,Math.max(r.rx,r.rz)+.85);
  // Advance from surveyed parent stands, following pockets of seed fall. The
  // open runs between stands survive; an occasional seed reaches the townward
  // toe below the last contour. The three independent seeds keep a change to
  // one mountain from moving trees on the other two.
  const ridges=[
    ['higashi',HIGASHIYAMA,eastRidgeHeight,1,0,0x467055],
    ['kita',KITAYAMA,northRidgeHeight,0,-1,0x64d416],
    ['nishi',NISHIYAMA,westRidgeHeight,-1,0,0x932671],
  ];
  const oldStands=trees.slice();
  for(const [id,summit,rise,outX,outZ,seed] of ridges){
    const range=MOUNTAIN_WOODS.find(r=>r.id===id),random=seeded(seed);
    const parents=oldStands.filter(t=>rise(t.x,t.z)>.5);
    const target=Math.round(parents.length*2.50);
    // Keep the short, exposed woodland below the skyline in proportion to
    // the previous crest population. Most seed fall settles lower down.
    const timberline=range.foot+.75*(range.crest-range.foot);
    const crestLimit=Math.ceil(parents.filter(t=>height(t.x,t.z)>timberline).length*2.25);
    let planted=0,crestTrees=0;
    for(let i=0;i<target*18 && planted<target;i++){
      const parent=parents[Math.floor(random()*parents.length)];
      const a=random()*Math.PI*2,r=Math.sqrt(random())*(i%5===0?53:19);
      const skirt=i%5===0 ? 13*random() : 0;
      const x=parent.x+Math.cos(a)*r-skirt*outX,z=parent.z+Math.sin(a)*r-skirt*outZ;
      if(grid.occupied(x,z))continue;
      const relief=rise(x,z);
      const townward=(x-summit.x)*outX+(z-summit.z)*outZ<0;
      if(relief<.5 && (!townward || i%5!==0))continue;
      const district=woodlandAt(x,z);
      if(district && district!==range)continue;
      const ground=height(x,z);
      if(ground<2 || (ground>timberline && crestTrees>=crestLimit))continue;
      const exposed=relief>range.crest*.63;
      const families=exposed ? range.upper : range.lower;
      // The same tree species often repeats in one copse. Seed from other
      // native families also takes root around its edge.
      const ancestor=Math.floor(parent.form/TREE_FORMS_PER_FAMILY);
      const family=random()<.61 && families.includes(ancestor) ? ancestor :
        families[Math.floor(random()*families.length)];
      const age=random();
      const growth=age<.32 ? 2.6+random()*3.0 : age>.91 ? 11.8+random()*3.2 : 6.0+random()*4.8;
      // Deep folds carry taller cohorts. A few old crowns rise above each
      // mass, with short wind-clipped pine and oak on the shoulders.
      const fold=Math.sin(x*.051+z*.034)+.75*Math.cos(z*.062-x*.018);
      const h=growth*(1+.085*fold)*(exposed ? .79 : 1);
      const form=family*TREE_FORMS_PER_FAMILY+Math.floor(random()*TREE_FORMS_PER_FAMILY);
      if(!canPlant(x,z,ground,h,form))continue;
      const tree={x,z,h,ground,kind:TREE_FAMILIES[family][0],kyotoRidge:id,
        form,seed:Math.floor(random()*1e8)};
      trees.push(tree);grid.reserve(x,z,Math.max(2.0,h*.25));planted++;
      if(ground>timberline)crestTrees++;
    }
  }
  // Surveyed pockets of red pine, evergreen oak and sugi run across the
  // fans below the two fires. The angled tufts overlap in the townward view
  // but leave open, walkable ground between their roots.
  const fans=[
    ['kita',[[106,3,9,8],[112,-15,8,10],[119,11,10,8],[125,-5,12,9],
      [133,-16,11,9],[137,7,12,11],[145,-6,12,9],[151,19,11,8],
      [156,-11,10,11],[162,2,10,8],[166,25,10,9]]],
    ['higashi',[[117,2,8,9],[127,-15,10,8],[132,10,11,10],[142,-5,12,10],
      [152,17,12,8],[159,-10,14,10],[166,5,12,10],[177,17,11,9],
      [182,-9,11,9],[187,6,10,10]]],
  ];
  for(const [id,pockets] of fans){
    const random=seeded(id==='kita'?0x131410:0x201847);
    const range=MOUNTAIN_WOODS.find(r=>r.id===id),east=id==='higashi';
    for(const [i,[depth,side,length,width]] of pockets.entries()){
      let added=0;
      for(let j=0;j<85 && added<18;j++){
        const a=random()*Math.PI*2,r=Math.sqrt(random());
        const along=Math.cos(a)*length*r,across=Math.sin(a)*width*r+(i%2?.38:-.29)*along;
        const d=depth+along,b=side+across;
        const x=DISTRICTS.kyo.x+(east?d:b),z=DISTRICTS.kyo.z+(east?b:-d);
        if(grid.occupied(x,z))continue;
        const ground=height(x,z),family=range.coppice[random()<.70 ? i%4 : Math.floor(random()*4)];
        const form=family*TREE_FORMS_PER_FAMILY+Math.floor(random()*TREE_FORMS_PER_FAMILY);
        // Narrow or short trees fit beneath more of the surveyed sightlines.
        // Check the candidate's actual grown height and crown at every step.
        let h=4.4+(1-r)*2.6+random()*2.4;
        while(h>=2.35 && !canPlant(x,z,ground,h,form))h*=.80;
        if(h<2.35)continue;
        trees.push({x,z,h,ground,form,kind:TREE_FAMILIES[family][0],kyotoRidge:id,seed:Math.floor(random()*1e8)});
        grid.reserve(x,z,2.1+.12*h);added++;
      }
    }
  }
}
