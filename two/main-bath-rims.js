import { regionalSpringLip } from './regional-springs.js';

const tau=2*Math.PI;
// Section width and height are measured from the wet inner face. The colours
// run from the submerged wash through the body, edge, and incised decoration.
export const basinFinishes={
  sakura: ['lashing',.42,.43,'#554738','#947252','#c5a47a','#dcc2a0'],
  bamboo: ['leaf',.35,.48,'#454f36','#737f4d','#a5ac73','#d0b87b'],
  earthen:['rolled',.49,.57,'#613f31','#a26449','#c78d66','#684b3b'],
  sulfur: ['ledge',.71,.62,'#827762','#bdad83','#e0cfaa','#efdfbd'],
  paddy:  ['bund',.69,.41,'#5d553c','#8c7d52','#96a16d','#b0a26d'],
  shore:  ['flute',.57,.55,'#6c7065','#c3b5a1','#e1d4bc','#ad9884'],
  maple:  ['leaf',.37,.45,'#654f41','#a36850','#bc8c63','#d5ad73'],
  susuki: ['bead',.41,.40,'#575756','#797879','#b4a67e','#dac181'],
  dawn:   ['fan',.40,.46,'#6b4b3d','#a96f52','#cca57b','#ead09a'],
  capital:['slab',.60,.48,'#2b3033','#414549','#67686b','#a89369'],
  peach:  ['rolled',.43,.49,'#6e4e3e','#af875c','#d0ab79','#8b5e48'],
  temple: ['petal',.59,.64,'#626e5f','#9a9488','#c6afa6','#d2c7ac'],
  inari:  ['bead',.46,.37,'#514c43','#925e4b','#b98263','#62564a'],
  tsuruga:['lashing',.47,.57,'#49453c','#826a50','#ad9772','#bdab88'],
  sakai:  ['rolled',.48,.56,'#3c5957','#6e8f83','#a5b6a0','#b29566'],
};

const clamp=x=>Math.max(0,Math.min(1,x));
export function rimPoint(s,a){
  const lip=regionalSpringLip(s.shape,a);
  return [s.rx*lip*Math.cos(a),s.rz*lip*Math.sin(a)];
}

export function rimSection(s,a){
  const [type,width,height]=basinFinishes[s.kind], [u,v]=rimPoint(s,a);
  // The front of the lip sweeps under the surface as a broad, walk-in shelf.
  const t=v>0?clamp((Math.abs(u)-1.16)/.94):1;
  const bank=t*t*(3-2*t);
  const wave=.5+.5*Math.cos(a*(type==='petal'?8:16) + (type==='petal'?0:.46));
  let h=height;
  if(type==='petal')h+=.34*wave**2;
  if(type==='flute')h+=.21*wave**2;
  if(type==='ledge'||type==='bund')h+=.095*Math.sin(3*a+.5)+.07*Math.sin(7*a-.65);
  if(type==='fan')h+=.10*Math.max(0,-Math.sin(a))*(.3+.7*wave);
  if(type==='leaf')h+=.13*Math.cos(2*a);
  // Widen the inkstone's grinding land towards the back, where the animal
  // calligrapher works. Leave the side facing the crossroads low and narrow.
  const extra=type==='slab'?.69*Math.max(0,-Math.sin(a))**2:0;
  return {u,v,top:-.14+bank*(.14+h),width:width+extra,bank,wave};
}

// Contact follows the same middle row as the top of the sculpted rim. Short
// faces follow the inside turns on the gourd and the maple leaf.
export function addMainRimSolids(s,add){
  const count=72;
  for(let i=0;i<count;i++){
    const a=i*tau/count,b=(i+1)*tau/count;
    const r=rimSection(s,(a+b)/2);
    if(r.top<.035)continue;
    const p=rimPoint(s,a),q=rimPoint(s,b),dx=q[0]-p[0],dz=q[1]-p[1];
    const len=Math.hypot(dx,dz),shift=r.width*.28;
    add(r.u+dz/len*shift,r.v-dx/len*shift,len+.045,r.width*.88,r.top,'box',true,-Math.atan2(dz,dx));
  }
}

// View the tableau across the water on the right shoulder, clear of the
// inlet and front threshold. The city screen remains visible just behind it.
function surveyTableau(s){
  if(s.kind==='snow')return {u:-9.8,v:-7.45,yaw:.64,scale:1.55};
  const angle=(s.kind==='inari'?-.025:-.21)*Math.PI,[x,z]=rimPoint(s,angle);
  const length=Math.hypot(x,z);
  const setback=s.kind==='inari'?1.38:1.13;
  return {u:x+setback*x/length,v:z+setback*z/length,yaw:-.60,scale:s.kind==='capital'?1.04:1};
}

const tableaus=new WeakMap();
export function bathTableau(s){
  if(!tableaus.has(s))tableaus.set(s,surveyTableau(s));
  return tableaus.get(s);
}
export function tableauGround(s,u,v,ground,level){
  const t=bathTableau(s),dx=u-t.u,dz=v-t.v;
  if(Math.abs(dx)>3.6 || Math.abs(dz)>3.6)return ground;
  const c=Math.cos(t.yaw),k=Math.sin(t.yaw);
  const edge=Math.max(Math.abs(dx*c-dz*k)-1.58*t.scale,Math.abs(dx*k+dz*c)-.72*t.scale);
  const blend=clamp(1-edge/.65);
  return ground+(level+.17-ground)*blend*blend*(3-2*blend);
}
export function tableauFooting(s,height){
  const t=bathTableau(s),c=Math.cos(s.yaw),k=Math.sin(s.yaw);
  const x=s.x+t.u*c+t.v*k,z=s.z-t.u*k+t.v*c;
  return {x,z,ground:height(x,z),yaw:s.yaw+t.yaw,scale:t.scale};
}
