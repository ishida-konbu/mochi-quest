// Bedding is a furnishing choice of an individual bed. Regional teaching and
// its future unlock rules belong to the later island-wide progression design.
import {entryFlight} from './homestead-foundation.js';

export const BEDDING_NAMES=Object.freeze(['藁の掛けむしろ','端切れの掛け布','煎餅布団','ふかふかの布団']);
// Bed-local metres. The founding plot and the anchors under the cot stay put.
const field=Object.freeze({x:.12,width:1.78,head:-1,foot:1,pillowZ:-.78,pillowWidth:1.24});
const room=Object.freeze({x:-.06,width:1.54,head:-1.09,foot:1.25,pillowZ:-.87,pillowWidth:1.08});
const stepBeds={
  'left-step':Object.freeze({...field,x:.2175,width:1.565}),
  'right-step':Object.freeze({...field,x:-.2125,width:1.555,pillowWidth:1.02}),
};
const layouts=new WeakMap();
export function bedLayoutKey(site){
  if(site.parentId)return true;
  if(site.heightSteps)return false; // The raised landing meets the mat at deck height.
  if(!layouts.has(site)){
    const step=entryFlight('camp',site);
    // On a sloping plot the low side steps run alongside the bed. Span
    // towards the other rail, keeping the original stair and its bearings.
    layouts.set(site,step?(step.normal[0]<0?'left-step':'right-step'):false);
  }
  return layouts.get(site);
}
export function campMattress(key=false){
  if(typeof key==='object' && key)key=bedLayoutKey(key);
  return key===true || key==='indoors'?room:stepBeds[key]??field;
}
// The old hillside piling remains the bearing. A short knee and tie carry
// the staff out to the head-rail corner, still inside the founding plot.
export const campStaff=[
  [[-.78,-.205,-.72],[-.945,.040,-.955],.038],
  [[-.78,-.040,-.72],[-.948,.42,-.957],.030],
  [[-.945,.024,-.955],[-.962,1.98,-.974],.028],
  [[-.993,1.87,-.973],[-.426,1.87,-.973],.014]
];
export function campPennon(u,v){
  return [-.920+.453*u,1.867-v*(.35-.15*u)-.012*Math.sin(Math.PI*u),
    -.972+.010+.022*Math.sin(1.7*Math.PI*u+.9*v)*u];
}
// Slats round off at head and foot. Scribe the corner around the doorpost
// indoors and leave the pennant socket clear on the outdoor head rail.
export function matEdges(m,z){
  const end=Math.max(0,1-Math.min(z-m.head,m.foot-z)/.18);
  const corner=.066*end*end;
  let left=m.x-m.width/2+corner;
  if(m===room){
    const t=Math.min(1,Math.max(0,(z-(m.foot-.41))/.27));
    left+=.175*t*t*(3-2*t);
  }else{
    const gap=Math.abs(z+.72);
    if(gap<.29)left=Math.max(left,-1+.31*Math.cos(gap/.29*Math.PI/2)**2);
    if(z<-.72)left=Math.max(left,-.69-.17*Math.min(1,gap/.235));
  }
  return [left,m.x+m.width/2-corner];
}
export function setBeddingGrade(world,id,grade){
  const bed=world.structures.find(s=>s.kind==='camp' && s.id===id);
  if(!bed || !Number.isInteger(grade) || !BEDDING_NAMES[grade])return {ok:false,reason:'寝床と寝具を選んでください。'};
  world.structures=world.structures.map(s=>s===bed?{...s,beddingGrade:grade}:s);
  return {ok:true,message:BEDDING_NAMES[grade]+'をしつらえました。'};
}
