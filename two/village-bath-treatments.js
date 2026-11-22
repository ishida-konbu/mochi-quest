// Working fixtures for the eight village springs. Each has its own plumbing:
// the same local survey draws the vessels, their waterlines and their entry.
import * as T from './vendor/three.module.min.js';
import { matsuhamaWorks,matsuhamaApron } from './matsuhama-saltworks.js';
import { sculpture } from './pilgrimage-pigment.js';
import { surface,rod,dab,turning } from './village-bath-figures.js';
import { villagePools,villagePoolsPoint,villageCourseRim,villageTreads } from './village-bath-courses.js';
import { sitePoint } from './retreat-layout.js';
import { springLevel,terrainMeshHeight } from './terrain.js';
import { finishWaterworks } from './village-waterworks.js';
import { bathFinish } from './bath-material-study.js';
import { isVillageWorkshop } from './village-workshop-plan.js';
import { addBathFlowers,registerWaterMotion,treatmentFoam,thermalVapour } from './village-treatment-water.js';

const {PI,sin,cos}=Math,tau=2*PI;
const brown='#856a4c',rope='#b49e70',bronze='#71644d',silver='#d8cfaa',ash='#918572';
function stroke(s,tint,at,r,count=18){
  const p=Array.from({length:count+1},(_,i)=>at(i/count));
  s.stroke(tint,p,p.map(()=>r),count);
}
function basinFrame(pool,a){
  const p=villageCourseRim(pool,a),[ax,az]=villagePoolsPoint(pool,a-.005),[bx,bz]=villagePoolsPoint(pool,a+.005);
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
  return {...p,nx:dz/len,nz:-dx/len};
}
function waterRibbon(flow,a,b,width,endWidth=width*.72,bow=.22){
  const [x,h,z]=a,dx=b[0]-x,dz=b[2]-z,len=Math.hypot(dx,dz),u=len?dz/len:1,v=len?-dx/len:0;
  flow.add(surface(8,22,(i,t)=>{
    const side=(i-.5)*2,w=width+(endWidth-width)*t,th=t*t;
    const fluting=.012*sin(17*i+.84*t)*sin(PI*t);
    return [x+dx*t+u*w*side,h+(b[1]-h)*th+bow*sin(PI*t)+fluting,z+dz*t+v*w*side];
  }),'#a8bfaf');
  for(const side of [-.74,.20])stroke(flow,'#d9dfcc',t=>{
    const w=width+(endWidth-width)*t;
    return [x+dx*t+u*w*side,h+(b[1]-h)*t*t+bow*sin(PI*t)+.016,z+dz*t+v*w*side];
  },.010,17);
}
function culm(s,x,y,z,rad,len,tilt=.05,tint='#a4a277'){
  // Open split sections show a pale lip and the shadowed hollow behind it.
  const shape=(u,v,inside)=>{
    const a=tau*u,r=rad*(inside?.77:1);
    return [x+r*cos(a),y+r*sin(a)-tilt*len*v,z+len*v];};
  for(const inside of [false,true])
    s.add(surface(22,4,(u,v)=>shape(inside?1-u:u,v,inside)),inside?'#6c7053':tint);
  for(const end of [0,1])s.add(surface(22,1,(u,v)=>{
    const a=shape(u,end,false),b=shape(u,end,true);
    return a.map((q,j)=>q+(b[j]-q)*v);
  }),'#d0bd89');
  for(const f of [.19,.65])stroke(s,'#82825b',t=>shape(t,f,false),.020,20);
  const cap=[x,y-len*tilt*.84,z+len*.84];
  dab(s,'#55563e',...cap,rad*.77,rad*.77,.021);
}
function block(s,x,y,z,w,h,d,k,tone='#949384'){
  // Fracture a cut boulder into irregular bedding courses with a broken,
  // slightly domed crown. The lee face returns from a worn mineral arris.
  const rows=[[.75,0],[1,.17],[.973,.31],[1.022,.365],[.97,.56],[1,.61],[.93,.84],[.85,.94],[.59,1],[.0001,1.015]];
  const dark=new T.Color(tone),light=new T.Color('#d4c8ae');
  s.add(surface(28,rows.length-1,(u,v)=>{
    const a=-tau*u,co=cos(a),si=sin(a),[r,dy]=rows[Math.round(v*(rows.length-1))];
    const uneven=1+.065*sin(a*3+k)+.029*cos(7*a+dy+k);
    return [x+w*r*uneven*Math.sign(co)*Math.abs(co)**.73,y+h*(dy+.027*r*sin(3*a+k)),
      z+d*r*uneven*Math.sign(si)*Math.abs(si)**.74];
  },(u,v)=>dark.clone().lerp(light,.09+.24*v+.08*cos(v*26+k+1.7*sin(7*u)))),'#fff');
}
function jarBody(s,p){
  // Throwing rings continue around the pear-shaped belly. The raised foot,
  // neck, rolled lip, dark interior and glassy ash runs are continuous.
  const rows=[
    [-.17,-.57],[-.17,-.43],[.13,-.43],[.21,-.37],[.24,-.22],[.21,-.04],
    [.17,.10],[.084,.19],[.059,.24],[.085,.28],[.138,.31],[.15,.357],
    [.128,.39],[.087,.414],[.027,.407],[-.014,.386],[-.028,.34],[-.019,.25],
    [-.038,.15],[-.035,-.05],[-.096,-.32],[-.26,-.47],[-.43,-.50],
  ];
  const clay=new T.Color('#8d593f'),glaze=new T.Color(p.rim),pale=new T.Color('#ccad85'),inside=new T.Color('#675748');
  const q=(u,v)=>{
    const a=-tau*u,j=Math.round(v*(rows.length-1)),f=basinFrame(p,a),[w,h]=rows[j];
    // A lowered but watertight sill meets the removable front steps.
    const y=p.y+(h<0?h:h*(f.top-p.y)/.40);
    return [f.u+f.nx*w,y,f.v+f.nz*w];};
  s.add(surface(128,rows.length-1,q,(u,v)=>{
    const j=Math.round(v*(rows.length-1)),h=rows[j][1],a=-tau*u;
    if(j>=17)return inside.clone().lerp(glaze,.18+.36*Math.max(0,h)+.075*cos(27*h+2*a));
    const edge=.12+.05*sin(6*a+.8)+.04*cos(9*a+.5)-.14*Math.max(0,cos(11*a+.30))**5;
    return clay.clone().lerp(glaze,.18+.7*T.MathUtils.smoothstep(h,edge,edge+.048)).lerp(pale,
      Math.min(.59,Math.max(0,.08+.32*(j>=11&&j<16)+.07*cos(a*5+.5)+.036*sin(a*17+8*h))));
  }),'#fff');
  for(let j=0;j<4;j++){
    const h=-.16+j*.082;stroke(s,j%2?'#9a7457':'#795e4b',u=>{
      const a=-u*tau,f=basinFrame(p,a),w=.222-.10*(j/3);
      return [f.u+f.nx*w,p.y+h-.033*(1-f.gate),f.v+f.nz*w];
    },.013,80);
  }
  for(const [fraction,height] of [[.49,-.39],[.85,-.205]])block(s,p.u,p.y+height-.16,p.v+p.rz*fraction,.73,.16,.25,5*fraction,p.rim);
  for(let i=0;i<3;i++){
    const px=p.u,front=p.v+p.rz,stepY=p.y-.09-.10*i;
    block(s,px,stepY-.20,front+.25+.24*i,.77-.036*i,.20,.18+.028*i,9+i,'#a59d8b');
  }
}
function jarFeed(s,flow,p,id){
  const x=p.u,z=p.v-p.rz-.38,wood='#806947';
  block(s,x,-.24,z,.36,p.y+.75,.33,id+1,'#9b9383');
  const rings=[[.021,.00],[.19,.00],[.25,.10],[.301,.24],[.322,.34],[.26,.44],[.18,.48],[.16,.535],[.186,.56],[.171,.59],[.131,.59],[.118,.51],[.132,.47],[.01,.43]];
  turning(s,p.rim,x,p.y+.48,z,rings,30);
  const spout=(u,t,inner)=>{
    const a=u*tau,r=(inner?.074:.096)*(1+t*.10);
    return [x+r*cos(a),p.y+.82+r*sin(a)-.105*t+.042*sin(PI*t),z+.17+t*.62];};
  for(const inner of [false,true])s.add(surface(20,12,(u,t)=>spout(u,t,inner)),inner?'#69543d':p.rim);
  stroke(s,'#baa383',u=>spout(u,1,false),.014,20);
  for(let j=0;j<2;j++)rod(s,wood,[x+.22*j-.10,p.y+.29,z+.30],[x+.22*j-.10,p.y+.70,z+.32],.027);
  waterRibbon(flow,[x,p.y+.716,z+.795],[x,p.y+.013,z+1.03],.063,.042,0);
}
function mineralWall(s,p){
  // A stepped, scalloped sill encircles each basin with overhanging sinter
  // lips, returning vertical risers, a pale deposition line and a submerged toe.
  const band=p.shape==='shelf';
  const cuts=[[-.33,-.37],[-.24,.02],[-.22,.18],[-.29,.24],[-.27,.36],[-.09,.38],
    [-.04,.59],[-.11,.64],[-.10,.72],[.11,.76],[.14,.88],[.25,.96],[.66,1],[.81,.87],
    [.87,.60],[.72,.51],[1.06,.42],[1.10,.23],[.94,.14],[1.20,-.53]];
  const tan=new T.Color(band?'#8f886c':'#81877b'),calcite=new T.Color(band?'#e0d9ae':'#e0d2ad');
  s.add(surface(160,cuts.length-1,(u,v)=>{
    const a=-u*tau,r=basinFrame(p,a),j=Math.round(v*(cuts.length-1)),[w,y]=cuts[j];
    const displace=w*r.width+.056*sin(9*a+y*2.3)+.035*cos(18*a-y);
    return [r.u+r.nx*displace,y<0?p.y+y-.12:p.y-.095+y*(r.top-p.y+.095),r.v+r.nz*displace];
  },(u,v)=>{
    const j=Math.round(v*(cuts.length-1));
    return tan.clone().lerp(calcite,[3,5,8,10,11,15,17].includes(j)?.80+.10*sin(u*73):.23+.24*v+.11*cos(u*29+v*14));
  }),'#fff');
}
function cliffBath(s,flow,pools){
  for(const p of pools){
    mineralWall(s,p);
    // Inward-facing fractures let the pale sinter bridge one mass of rock
    // to the next. The front entry and the overflow retain their open channels.
    const pieces=p.shape==='shelf'?13:21;
    for(let i=0;i<pieces;i++){
      const a=tau*(i+.21+.09*sin(i*3.2))/pieces,f=basinFrame(p,a);
      if(f.gate<.69 || p.shape==='shelf'&&f.v>p.v+.62&&f.u>p.u-.48&&f.u<p.u+.94)continue;
      const w=.28+.22*(.5+.5*sin(i*7.31)),h=.26+.23*(.5+.5*cos(i*3.24));
      const xx=f.u+.33*f.nx,zz=f.v+.33*f.nz;
      block(s,xx,p.y-.15,zz,w,h+.13,w*.72,i+6,i%3?'#929283':'#737d76');
      if(i%3===1)block(s,xx+.066*f.nx,p.y+h-.13,zz+.043*f.nz,w*.77,.11,w*.59,i+9,'#c4b99a');
    }
  }
  for(const [i,[x,z,h]] of villageTreads('sulfur').entries())block(s,x,h-.21,z,.46,.21,.27,21+i,'#aca78f');
  for(let j=0;j<6;j++){
    const x=-2.48+j*.24,z=-3.91-.13*sin(j);
    block(s,x,.09,z,.42,.95+.38*sin(j*.71),.39,j,'#929280');
    block(s,x-.09,.75,z-.06,.30,.45+.22*sin(j*.77),.27,j+.41,'#b5ab8a');
  }
  waterRibbon(flow,[-1.83,1.16,-3.68],[-1.54,.575,-3.02],.26,.14,.04);
  // The head pool spills from a thin travertine beak over the dry divide
  // into the lower pool. Three sheets break around its mineral teeth.
  for(let j=0;j<3;j++){
    const x=-1.03+j*.26,lip=-1.79+.055*cos(j);
    block(s,x,.105,lip,.27,.47+.05*sin(j),.30,j+7,'#d0c6a3');
    waterRibbon(flow,[x,.605,lip-.11],[x+.04,.010,-1.02],.131,.102,.015);
  }
  for(const [x,z,r,k] of [[3.63,1.26,.74,1],[-3.07,1.63,.52,4],[-2.68,-1.96,.55,8],[2.29,-.69,.44,13]]){
    block(s,x,-.46,z,r,.52,r*.59,k,'#a6a28c');
  }
}
function levee(s,p){
  const soil=new T.Color('#827658'),moss=new T.Color('#b3aa75');
  const levels=[[-.080,-.43],[-.073,-.13],[-.052,.24],[.043,.81],[.12,.97],[.255,1],[.32,.82],[.38,.52],[.43,-.40]];
  s.add(surface(144,levels.length-1,(u,v)=>{
    const a=-u*tau,f=basinFrame(p,a),[r,y]=levels[Math.round(v*(levels.length-1))];
    const w=r+.016*sin(16*a+.3);
    return [f.u+f.nx*w,y<0?p.y+y:p.y-.095+y*(f.top+.095-p.y),f.v+f.nz*w];
  },(u,v)=>soil.clone().lerp(moss,.19+.36*sin(v*PI)**2+.17*cos(u*81+.53*sin(u*13)))),'#fff');
}
function sluices(s,flow,pools){
  for(const p of pools){
    levee(s,p);
    // The dry shoulder carries cut grass, and the uphill face is stacked
    // with individual fieldstones. Both stop for the sluice and stone stair.
    for(let j=0;j<39;j++){
      const a=tau*(j+.22)/39,f=basinFrame(p,a);
      if(f.gate<.9)continue;
      const x=f.u+.24*f.nx,z=f.v+.24*f.nz;
      if(j%3===0 && p.id==='upper-field')
        block(s,x,p.y-.25,z,.28,.36,.16,j+4,'#898d77');
      if(j%2===0)for(let n=0;n<4;n++){
        const st=tau*(.37*j+.24*n),h=.11+.065*cos(n*2.1+j);
        const start=[x+.064*cos(st),f.top-.014,z+.064*sin(st)];
        s.add(surface(2,4,(u,t)=>{
          const w=(u-.5)*.037*(1-t),l=.135*t;
          return [start[0]+l*cos(st)+w*sin(st),start[1]+h*sin(PI*t*.61),start[2]+l*sin(st)-w*cos(st)];
        }),n%2?'#9c9e6b':'#b9ab76');
      }
    }
  }
  const z=-1.33;
  for(const [i,[x,v,h]] of villageTreads('paddy').entries())block(s,x,h-.18,v,.46,.18,.26,44+i,'#9e9d85');
  for(const x of [-2.15,1.77]){
    for(const side of [-1,1]){
      s.box('#7b634b',x+.24*side,.31,z,.083,.67,.249);
      s.box('#a48f68',x+.24*side,.63,z,.113,.054,.266);
    }
    for(let j=0;j<3;j++)s.box(j%2?'#9c8764':'#937e5b',x,.29+j*.11,z,.42,.102,.087);
    s.box(brown,x,.64,z,.057,.28,.058);
    rod(s,'#bd9f71',[x-.17,.78,z],[x+.17,.78,z],.034);
    waterRibbon(flow,[x,.245,z-.12],[x,.006,z+.56],.158,.146,.018);
  }
  // One service crossing spans both sides of the wet furrow.
  for(const side of [-1,1])s.box(brown,side*.32,.143,z,.077,.087,1.12);
  for(let j=0;j<6;j++)s.box(j%2?'#ad9365':'#a18862',0,.21,z-.46+j*.18,.83,.069,.161);
  block(s,-3.71,.04,-3.91,.43,.79,.29,5,'#95927b');
  for(const side of [-1,1])s.box(brown,-3.71+side*.136,.86,-3.65,.057,.20,.64);
  s.box('#b29d75',-3.71,.772,-3.65,.296,.059,.65);
  waterRibbon(flow,[-3.71,.82,-3.34],[-3.68,.244,-2.97],.119,.079,.02);
}
function flowerInlet(s,flow){
  const x=-2.58,z=-2.97;
  for(const side of [-1,1])rod(s,brown,[x+side*.38,-.09,z],[x+side*.38,.76,z+.03],.069,.055);
  // A pierced wicker flower box strains the loose blossoms at the inflow.
  for(const st of [-1,1])for(let i=0;i<7;i++)
    s.box(i%2?'#aa936c':'#927b59',x+st*.396,.38+i*.048,z,.037,.031,.64);
  for(let i=0;i<12;i++)rod(s,'#a99369',[x+(i/11-.5)*.78,.66,z-.28],[x+(i/11-.5)*.78,.53,z+.32],.017);
  for(const side of [-1,1])s.box(brown,x,.70,z+side*.32,.86,.077,.065);
  waterRibbon(flow,[x,.58,z+.32],[x+.12,.011,z+1.04],.28,.17,.035);
}
function bambooJets(s,flow){
  for(const x of [-3,-.24]){
    block(s,x,-.32,-2.03,.20,.36,.19,x,'#828c75');
    s.post('#858c64',x,1.09,-2.03,.091,2.25,.093);
    for(let j=1;j<6;j++)s.post('#a5a77d',x,j*.37,-2.03,.097,.026,.098);
  }
  rod(s,'#a29d70',[-3.21,2.12,-2.03],[-.03,2.12,-2.03],.083,.071);
  for(let j=0;j<3;j++){
    const x=-2.28+j*.60,y=1.81+.16*(j%2);
    culm(s,x,y,-2.46,.102,1.09,.11,j===1?'#8f9c6b':'#acaa78');
    for(const dy of [0,.037])s.stroke(rope,[[x-.07,y+.03,-2.04],[x-.102,2.16+dy,-2.03],[x,2.20+dy,-2.04],[x+.10,2.15,-2.03],[x+.067,y+.025,-2.04]],[.014,.021,.019,.018,.011],9);
    waterRibbon(flow,[x,y-.122,-1.36],[x+.046*(j-1),.015,-.66],.068,.042,.028);
  }
  for(const side of [-1,1]){
    const x=-1.58+side*1.15;
    for(let k=0;k<2;k++)culm(s,x+side*.10*k,-.055-.064*k,-1.61,.097,2.64,.013,'#868b62');
  }
  for(let j=0;j<12;j++)s.box(j%2?'#8b8f68':'#a2a77c',-1.58,-.32,-1.39+j*.184,2.16,.081,.164);
}
function neckFalls(s,flow){
  for(const x of [-2.62,2.62]){
    block(s,x,-.34,-2.67,.39,.52,.35,x,'#71786b');
    s.box('#725c47',x,1.40,-2.67,.235,2.75,.25);
    for(const d of [-1,1])rod(s,brown,[x,2.05,-2.67],[x+d*.52,2.63,-2.68],.070);
  }
  s.box('#937c5b',0,2.67,-2.72,5.57,.21,.52);
  for(const side of [-1,1])s.box(brown,0,2.77,-2.72+side*.22,5.57,.21,.086);
  for(const [j,x] of [-1.53,1.54].entries()){
    for(const side of [-1,1])s.box(j?'#a08667':'#7b7662',x+side*.123,2.67,-2.44,.061,.13,.71,0,0,0);
    s.box('#9d9278',x,2.594,-2.44,.31,.055,.73);
    waterRibbon(flow,[x,2.61,-2.09],[x,.017,-1.22],j?.083:.145,j?.047:.109,.04);
    block(s,x,-.50,-1.22,.58,.26,.49,31+j,'#8c907e');
  }
}
function moonBed(s,flow){
  const x=-1.42,z=1.15;
  // A thin sheet moves across shallow, contiguous slabs. The soft curve
  // beneath the back and the rounded pillow hold a floating face upward.
  for(let j=0;j<5;j++){
    const px=x+(j-2)*.70;
    block(s,px,-.55,z,.385,.32+.07*cos(j*1.20),.66,j+3,'#999a8d');
  }
  block(s,.26,-.21,z,.20,.34,.65,12,'#bab59b');
  for(const side of [-1,1]){
    s.stroke('#8f8e7c',[[x-1.72,-.13,z+side*.58],[x-.62,.026,z+side*.69],[x+.66,.039,z+side*.67],[x+1.68,-.04,z+side*.54]], [.067,.052,.064,.073],13);
  }
  const xx=-3.29,zz=-1.40;
  block(s,xx,-.28,zz,.48,.59,.39,7,'#8c8d7b');
  culm(s,xx,.40,zz-.27,.102,.61,.06,'#a79c76');
  waterRibbon(flow,[xx,.36,zz+.36],[xx+.06,.004,zz+.68],.058,.044,.009);
}
const works={sakura:flowerInlet,bamboo:bambooJets,sulfur:cliffBath,paddy:sluices,maple:neckFalls,susuki:moonBed};
export function villageTreatmentGeometry(site){
  const fittings=sculpture(),flow=sculpture(),pools=villagePools(site);
  let timberwork;
  if(site.kind==='earthen'){
    for(const [i,p] of pools.entries()){jarBody(fittings,p);jarFeed(fittings,flow,p,i);}
  }else if(site.kind==='shore')timberwork=matsuhamaWorks(fittings,flow,pools,waterRibbon);
  else works[site.kind](fittings,flow,pools);
  if(site.kind==='sulfur'){
    // Fine grooves running along the upper source remain dry on one bank.
    for(let i=0;i<4;i++)stroke(fittings,silver,t=>[-2.47+t*.57,.99+.075*cos(PI*t),-3.83+i*.045],.015,10);
  }
  finishWaterworks(fittings,site.kind,pools);
  return {fittings:fittings.finish(),flow:flow.finish(),timberwork};
}
// A kiln yard drains between the vessels. Clip the old brick's actual top
// faces where the jar shoulders emerge; water can never show through an aisle.
function pottersCourt(site){
  const pools=villagePools(site),pos=[],colors=[],ix=[],level=springLevel(site);
  function distance(x,z){
    return Math.min(...pools.map(p=>{
      const a=Math.atan2((z-p.v)/p.rz,(x-p.u)/p.rx);
      const [px,pz]=villagePoolsPoint(p,a);
      return Math.hypot(x-p.u,z-p.v)-Math.hypot(px-p.u,pz-p.v)-.065;
    }));
  }
  const tones=['#9e8770','#a7977b','#aa9173','#918772','#af9a80'].map(c=>new T.Color(c));
  const clay=new T.Color('#807662');
  function tile(x,z,w,d,lift,tone){
    const corners=[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
    const cut=[];
    for(let i=0;i<4;i++){
      const a=corners[i],b=corners[(i+1)%4],da=distance(...a),db=distance(...b);
      if(da>=0)cut.push(a);
      if((da>=0)!==(db>=0)){
        let l=0,h=1;
        for(let k=0;k<9;k++){
          const t=(l+h)/2,keep=distance(a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]))>=0;
          if(keep===(da>=0))l=t;else h=t;
        }
        const t=(l+h)/2;cut.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
      }
    }
    const base=pos.length/3;
    if(cut.length<3)return;
    for(const [u,v] of cut){
      pos.push(u,terrainMeshHeight(...sitePoint(site,u,v))-level+lift,v);
      const stain=.96+.036*sin(u*4.17+v*4.92);colors.push(tone.r*stain,tone.g*stain,tone.b*stain);
    }
    for(let j=1;j<cut.length-1;j++)ix.push(base,base+j+1,base+j);
  }
  const d=.36,w=.74;
  for(let j=0;j<23;j++){
    const z=-4.06+j*d;
    for(let i=-1;i<19;i++){
      const x=-6.48+i*w+.5*w*(j%2),lo=Math.max(-6.48,x),hi=Math.min(6.48,x+w);
      if(hi-lo<.056)continue;
      tile(lo,z,hi-lo,d,.023,clay);
      tile(lo+.010,z+.012,hi-lo-.02,d-.023,.034,tones[Math.abs(i*23+j*11+j*i)%tones.length]);
    }
  }
  const g=new T.BufferGeometry();g.setIndex(ix);
  g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();return g;
}
export function dressVillageBath(p,f,site){
  if(!isVillageWorkshop(site))return;
  const {fittings,flow,timberwork}=villageTreatmentGeometry(site);
  if(timberwork){
    p.shapes.harborTimbers=timberwork;
    f.put('harborTimbers',0,0,0,1,1,1,'#fff',bathFinish('cedar'));
  }
  if(site.kind==='earthen'){
    p.shapes.jarYard=pottersCourt(site);f.put('jarYard',0,0,0,1,1,1,'#fff',p.stems);
  }
  if(site.kind==='shore'){
    const level=springLevel(site),height=(u,v)=>terrainMeshHeight(...sitePoint(site,u,v))-level;
    p.shapes.harborWalk=matsuhamaApron(height,villagePools(site));f.put('harborWalk',0,0,0,1,1,1,'#fff',p.stems);
  }
  const key='working-'+site.kind,pour=key+'-pour';
  p.shapes[key]=fittings;p.shapes[pour]=flow;
  const finish={earthen:'clay',sulfur:'slate',paddy:'cedar',sakura:'bamboo',bamboo:'bamboo',maple:'cedar',susuki:'slate'}[site.kind];
  f.put(key,0,0,0,1,1,1,'#fff',finish?bathFinish(finish):p.stems);
  const active=registerWaterMotion(p,site);
  f.put(pour,0,0,0,1,1,1,'#d6e4d4',active.flow);
  treatmentFoam(p,f,site,active);
  if(site.kind==='sakura')addBathFlowers(p,f,site,active);
  if(site.kind==='sulfur')thermalVapour(p,f,active);
}
