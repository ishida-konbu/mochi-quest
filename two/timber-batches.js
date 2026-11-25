import { isTimberFelled } from './living-build-trees.js';

// The landmark painter batches many trees and nearby fittings in one mesh.
// Preserve that draw call, masking only the recorded index or matrix spans.
export function timberBatchMask(attribute,spans,clear) {
  const hidden=new Map();
  return ()=>{
    for(const [tree,ranges] of spans){
      const cut=isTimberFelled(tree);
      if(cut===hidden.has(tree))continue;
      if(cut) {
        const saved=[];
        for(const [start,end] of ranges){
          saved.push(attribute.array.slice(start,end));
          clear(attribute.array,start,end);
          attribute.addUpdateRange(start,end-start);
        }
        hidden.set(tree,saved);
      } else {
        const saved=hidden.get(tree);
        ranges.forEach(([start,end],i)=>{
          attribute.array.set(saved[i],start);
          attribute.addUpdateRange(start,end-start);
        });
        hidden.delete(tree);
      }
      attribute.needsUpdate=true;
    }
  };
}
export function recordTreeSpan(spans,tree,start,end) {
  if(start===end)return;
  if(!spans.has(tree))spans.set(tree,[]);
  const ranges=spans.get(tree),last=ranges.at(-1);
  if(last?.[1]===start)last[1]=end;
  else ranges.push([start,end]);
}
