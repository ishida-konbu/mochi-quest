import { timberWood } from './terrain.js';

const sections=new WeakMap();
export const isBambooStock=kind=>['moso','bamboo','shrine-bamboo'].includes(kind);

// Intersect the planted collision survey, including the hand-painted trunks
// and the separate culms whose feet have been lowered onto a hillside.
export function timberCut(tree) {
  const source=tree.source??tree;
  if(sections.has(source))return sections.get(source);
  const solid=timberWood(source), height=.42, y=tree.ground+height;
  const rings=[];
  if(solid) {
    const {scale,c,s,wood,culmFeet}=solid, level=height/scale;
    for(const part of culmFeet ? [...culmFeet,...wood] : wood) {
      if(part.dy<=0 || level<part.y || level>=part.y+part.dy)continue;
      const t=(level-part.y)/part.dy, u=(part.x+part.dx*t)*scale,v=(part.z+part.dz*t)*scale;
      if(!isBambooStock(tree.kind) && Math.hypot(u,v)>tree.h*.13)continue;
      rings.push({x:tree.x+u*c+v*s,z:tree.z-u*s+v*c,radius:part.r*scale,y});
    }
  }
  if(!rings.length)rings.push({x:tree.x+(source.sx??0)*height/tree.h,z:tree.z+(source.sz??0)*height/tree.h,
    radius:source.radius??tree.h*.031,y});
  const extent=k=>(Math.min(...rings.map(p=>p[k]-p.radius))+Math.max(...rings.map(p=>p[k]+p.radius)))/2;
  const x=extent('x'),z=extent('z');
  const cut={x,y,z,radius:Math.max(...rings.map(p=>Math.hypot(p.x-x,p.z-z)+p.radius))};
  if(isBambooStock(tree.kind))cut.culms=rings;
  sections.set(source,cut);
  return cut;
}
