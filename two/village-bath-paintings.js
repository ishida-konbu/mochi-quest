import * as T from './vendor/three.module.min.js';

const subjects=['sakura','bamboo','earthen','sulfur','paddy','shore','maple','susuki'];
const papers=new Map();
let sheet;
export function villageBathPainting(kind) {
  if(!papers.has(kind)){
    const index=subjects.indexOf(kind);
    if(index<0)throw new RangeError('Unknown village bath painting: '+kind);
    sheet??=new T.TextureLoader().load(new URL('./assets/world/village-bath-paintings.webp',import.meta.url).href);
    // Three uploads the common image once. Only the sampling transform varies.
    const map=sheet.clone();
    const bleed=.002;
    map.offset.set((index%2)/2+bleed,(3-Math.floor(index/2))/4+bleed);
    map.repeat.set(.5-2*bleed,.25-2*bleed);
    map.colorSpace=T.SRGBColorSpace;
    map.anisotropy=4;
    papers.set(kind,new T.MeshLambertMaterial({map,side:T.DoubleSide}));
  }
  return papers.get(kind);
}
