// The narrow end of the bath court faces the road (+v). The same carpenter's
// dimensions locate the screens in the picture, the graded earth and the walls.
import { regionalSpringLip } from './regional-springs.js';

const designs={
  sakura:  ['ferry','hip','reed', 1.3,3.00,1.15,'#615347','#745f52','#a35f70','桜筏'],
  bamboo:  ['grove','steep','bamboo',1.1,2.64,1.56,'#685d45','#807d58','#5c7357','笹舟'],
  earthen: ['town','tile','plaster',.6,3.09,1.42,'#635044','#685f58','#7f503e','甕'],
  sulfur:  ['crag','shake','split',1.3,2.56,1.02,'#695a48','#89816a','#8f7544','湯花'],
  paddy:   ['farm','steep','reed',1.05,2.64,1.32,'#705d48','#93805c','#947945','稲穂'],
  shore:   ['cove','shake','reed',1.1,2.72,.97,'#786a56','#827c6a','#4d7270','松浜'],
  maple:   ['crag','shake','split',1.15,2.65,1.22,'#624e40','#807764','#9c5746','楓'],
  susuki:  ['moor','hip','reed',1.0,2.78,1.26,'#75644f','#978465','#786885','弓月'],
  dawn:    ['dawn','hip','bamboo',1.0,2.89,1.18,'#7a624f','#8b7c69','#a76847','暁'],
  capital: ['town','tile','lattice',.68,3.20,1.49,'#605146','#615f59','#576878','硯'],
  peach:   ['farm','steep','woven',1.0,2.58,1.23,'#795e4b','#a18c67','#9b6175','花桃'],
  temple:  ['temple','hipTile','plaster',.66,3.18,1.50,'#644b3b','#73695a','#736573','蓮華'],
  inari:   ['grove','shake','bamboo',1.05,2.80,1.29,'#85513d','#726b55','#a05a43','稲荷'],
  tsuruga: ['harbor','shake','split',.62,3.00,1.34,'#655b4b','#706f65','#5d7480','船溜'],
  sakai:   ['town','tile','lattice',.66,3.12,1.34,'#5e5146','#716962','#4e756d','千鳥'],
};
const plans=new WeakMap();
export function bathEnclosure(s){
  if(plans.has(s))return plans.get(s);
  let plan=null;
  if(s.rank==='main' && designs[s.kind]){
    const [style,roof,wall,shift,eave,rise,wood,roofTint,dye,motif]=designs[s.kind];
    const closed=['town','harbor','temple'].includes(style);
    const width=closed?6.65:style==='moor'?5.94:5.02;
    const depth=closed?2.86:2.36;
    const w=s.rx*1.25+.91;
    const fore=s.rz*(closed?1.22:.95)+(closed?.94:0);
    const room={u:shift,v:-s.rz*1.17-depth/2-.49,w:width,d:depth,eave,rise};
    const back=room.v-room.d/2,segments=[];
    const panel=(u,v,length,angle,height)=>segments.push({u,v,length,angle,height});
    if(closed){
      for(const side of [-1,1]){
        panel(side*w,(fore+back)/2,fore-back,Math.PI/2,1.87);
        const door=1.42;
        panel(side*(w+door)/2,fore,w-door,0,1.82);
      }
      const left=room.u-room.w/2,right=room.u+room.w/2;
      panel((left-w)/2,back,left+w,0,1.86);
      panel((right+w)/2,back,w-right,0,1.86);
    }else{
      // The lee side shelters the washing stones. The view opens at the other
      // shoulder: reeds across the meadow, pilgrims on the hill, or the sea.
      const end=style==='crag'||style==='grove'?s.rz*.15:s.rz*.54;
      panel(-w,(end+room.v)/2,end-room.v,Math.PI/2,1.52);
      panel(w,room.v+1.30,2.6,Math.PI/2,1.39);
    }
    let annex;
    if(['inari','shore','dawn','tsuruga'].includes(s.kind)){
      const deep=Math.min(5.6,1.62*s.rz);
      annex={u:-w+.40,v:-.25*s.rz,w:1.52,d:deep,eave:s.kind==='inari'?2.55:2.22};
    }
    const trough=[];
    if(['paddy','sulfur','maple'].includes(s.kind)){
      const a=-Math.PI*.62,lip=regionalSpringLip(s.shape,a);
      const end=s.rx*lip*Math.cos(a),v=s.rz*lip*Math.sin(a)-.76;
      const start=-w+.03,n=s.kind==='paddy'?3:2,step=(end-start)/n;
      const lift=s.kind==='paddy'?.24:s.kind==='sulfur'?.71:.86;
      for(let i=0;i<n;i++)trough.push({u:start+(i+.5)*step,v,w:step,y:1.01+(n-i)*lift,i});
    }
    plan={style,roof,wall,wood,roofTint,dye,motif,closed,w,fore,room,segments,annex,trough};
  }else if(s.rank==='sub'){
    // A two-person lean-to sits beyond the small pool's upstream edge.
    const u=Math.min(1.35,s.rx*.39),v=-s.rz*1.25-1.42;
    plan={small:true,room:{u,v,w:2.56,d:1.32,eave:1.91,rise:.42},segments:[]};
  }
  plans.set(s,plan);return plan;
}
// Rocks wrap the side of the gorge; the washing stool behind the pool and
// the open entry in front must remain free when the basin is downsized.
export function waysideBankRocks(s){
  if(s.regional || !['slate','maple'].includes(s.kind))return [];
  return Array.from({length:5},(_,i)=>{
    const a=2.86+.32*i;
    return {u:(s.rx+.75)*Math.cos(a),v:(s.rz+.88)*Math.sin(a),
      w:.72+.19*Math.sin(i*.87),d:.65+.14*Math.cos(i*.64),
      h:(.61+.44*Math.sin(i*.81))*(s.kind==='slate'?1.4:1),yaw:.23*i,i};
  });
}
function rectEdge(u,v,x,z,w,d){
  return Math.max(Math.abs(u-x)-w/2,Math.abs(v-z)-d/2);
}
function apronEdge(plan,u,v){
  const r=plan.room;
  let edge=rectEdge(u,v,r.u,r.v,r.w+.64,r.d+.74);
  for(const panel of plan.segments){
    const across=panel.angle!==0;
    edge=Math.min(edge,rectEdge(u,v,panel.u,panel.v,across?.41:panel.length+.18,across?panel.length+.18:.41));
  }
  return edge;
}
export function bathEnclosureGround(s,u,v) {
  const plan=bathEnclosure(s);
  if(!plan)return 0;
  // The visible hillside is sampled every 2.5 metres. Give the floor joists
  // a full grid cell of level earth before the pad feathers into the slope.
  const r=plan.room;
  const shelter=rectEdge(u,v,r.u,r.v,r.w,r.d)-2.45;
  const edge=Math.min(shelter,apronEdge(plan,u,v)-.70);
  const t=Math.max(0,Math.min(1,edge/2.75));
  return 1-t*t*(3-2*t);
}
export function bathEnclosureReserved(s,u,v) {
  const plan=bathEnclosure(s);
  if(!plan)return false;
  if(plan.closed && Math.abs(u)<plan.w+.7 && v>plan.room.v-plan.room.d/2-.70 && v<plan.fore+.80)return true;
  return apronEdge(plan,u,v)<.94;
}
export function addBathEnclosureSolids(s,add) {
  const plan=bathEnclosure(s);
  if(!plan)return;
  const r=plan.room;
  if(plan.annex){
    const a=plan.annex;
    for(const side of [-1,1])for(const end of [-1,1])
      add(a.u+side*a.w*.46,a.v+end*a.d*.45,.16,.16,a.eave,'wall');
    if(s.kind==='inari'){
      for(const side of [-1,1])for(const z of [-.12,.18])
        add(a.u+side*a.w*.46,a.v+z*a.d,.142,.142,2.50,'wall');
      add(a.u,a.v,a.d+.36,a.w+.34,a.eave,'ceiling',false,Math.PI/2);
      add(a.u,a.v,a.d+.36,a.w+.34,a.eave+.03,'roof',true,Math.PI/2).roofRise=.62;
    }else{
      add(a.u,a.v,a.d+.36,a.w+.34,a.eave,'awning',true,Math.PI/2);
    }
  }
  for(const t of plan.trough||[])add(t.u,t.v,t.w,.44,t.y+.13,'box',true);
  if(plan.trough?.length){
    const t=plan.trough[0];
    add(t.u-t.w/2-.24,t.v-.09,1.72,1.32,t.y+.065,'oval',true);
  }
  if(plan.closed){
    for(const u of [-1.43,1.43])add(u,plan.fore,.16,.17,2.57,'wall');
    add(0,plan.fore,3.79,1.18,2.53,'ceiling');
    add(0,plan.fore,3.79,1.18,2.65,'roof',true).roofRise=.52;
  }
  for(const panel of plan.segments){
    add(panel.u,panel.v,panel.length+.15,.13,panel.height,'wall',false,panel.angle);
  }
  add(r.u,r.v-r.d/2,r.w,.12,r.eave-.25,'wall');
  for(const side of [-1,1]){
    add(r.u+side*r.w/2,r.v,.13,r.d,r.eave-.2,'wall');
    add(r.u+side*r.w/2,r.v+r.d/2,.14,.14,r.eave,'wall');
  }
  add(r.u,r.v,r.w+.15,r.d+.18,.18,'floor',true);
  add(r.u,r.v-.15,r.w*.57,.39,.60,'box',true);
  add(r.u,r.v,r.w+.66,r.d+.65,r.eave,'ceiling');
  const roof=add(r.u,r.v,r.w+.66,r.d+.65,r.eave,'roof',true);
  roof.roofRise=r.rise;
  if(plan.roof==='hip'||plan.roof==='hipTile')roof.form='hip';
  if(s.kind==='earthen'&&!plan.small)
    add(r.u,r.v,r.w*.50+.55,1.30,r.eave+r.rise+.41,'roof',true).roofRise=.43;
  if(s.kind==='temple'&&!plan.small){
    const cap=add(r.u,r.v,2.56,2.06,r.eave+r.rise-.09,'roof',true);
    cap.form='hip';cap.roofRise=.81;
  }
}
