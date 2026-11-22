import { dressVillageBath } from './village-bath-treatments.js';
import { bathPools,hasOwnInlet,poolRadius } from './bath-places.js';
import * as T from './vendor/three.module.min.js';
import { basinMaterial,buildBasinVessel } from './main-bath-vessels.js';
import { bathTableau } from './main-bath-rims.js';
import { bathCraft,regionalBathFittings,inletImpactV } from './regional-bath-fittings.js';
import { springLip,sitePoint,retreatStones } from './retreat-layout.js';
import { terrainHeight, terrainMeshHeight } from './terrain.js';
import { sculpture } from './pilgrimage-pigment.js';
import { inscriptionMaterial } from './civic-art.js';

const {sin,cos,PI}=Math,tau=2*PI,wood='#a98c65',bark='#655340',rope='#c3ad80';
const tint=(base,next,t)=>new T.Color(base).lerp(new T.Color(next),t);
const seed=new T.SphereGeometry(1,8,5);
const profile=(rows,segments=32)=>new T.LatheGeometry(rows.map(r=>new T.Vector2(...r)),segments);

function patch(rows,cols,sample) {
  const xyz=[],uv=[],ix=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows;xyz.push(...sample(u,v));uv.push(u,v);
    if(i<cols&&j<rows){const a=j*(cols+1)+i,b=a+cols+1;ix.push(a,a+1,b,a+1,b+1,b);}
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(ix);g.computeVertexNormals();return g;
}

// Chisel faces, fissile strata and sinter terraces have different profiles.
// Their outside edge stays inside the surveyed rim stone's oval footprint.
function rimCut(kind) {
  const levels=kind==='sinter'?[[.20,-1],[.90,-.55],[1,-.19],[.98,-.08],[.85,0],[.90,.16],[.82,.25],
    [.73,.28],[.75,.44],[.61,.52],[.62,.66],[.45,.72],[.36,.89],[.057,1],[.001,1]]:
    kind==='slate'?[[.2,-1],[.77,-.64],[1,-.28],[.93,-.15],[.99,-.02],[.96,.24],
      [.88,.29],[.94,.47],[.82,.71],[.76,.78],[.66,.93],[.13,.995],[.001,1]]:
    [[.63,-.91],[.90,-.79],[.96,-.61],[.96,.56],[.90,.78],[.77,.90],[.49,.98],[.001,1]];
  const g=patch(levels.length-1,32,(u,v)=>{
    const i=Math.round(v*(levels.length-1)),[radius,y]=levels[i],a=-u*tau;
    const face=kind==='coping'?Math.min(1,.81/Math.max(Math.abs(cos(a)),Math.abs(sin(a)))):1;
    const split=1+.035*sin(3*a+.42)+.028*sin(7*a+i*.17);
    return [radius*split*face*cos(a),y+.048*radius*sin(2*a+.65),radius*split*face*sin(a)];
  });
  const pos=g.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){
    const y=pos.getY(i),u=Math.atan2(pos.getZ(i),pos.getX(i));
    const vein=kind==='coping'?0:.15*Math.max(0,cos(y*(kind==='sinter'?26:32)+.6*sin(3*u)))**4;
    const c=tint('#858070','#efead6',.36+.26*y+vein);
    colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;
}

function hollowBamboo(s,x,y,z,r,length) {
  const wall=profile([[r*.69,-length/2],[r,-length/2],[r,length/2],
    [r*.83,length/2],[r*.76,length*.27]],20);
  s.add(wall,'#ac9c6d',x,y,z,1,1,1,PI/2+.07);
  for(const f of [-.35,.17,.30]){
    s.post(f===.17?bark:'#887d55',x,y-f*.07*length,z+length*f,r*1.06,.033,r*1.06,PI/2+.07);
  }
  s.ball('#584f34',x,y-.02,z+length*.285,r*.78,r*.78,.008);
}
function ribbonTrough(s,boat) {
  const width=boat?.30:.23,length=1.56;
  // The inside of a hollow dugout tapers to an open lip; the split-board
  // channel has a flat bottom and bevelled staves held by wooden pegs.
  function stave(u,v,inside) {
    const z=-.60+length*v,a=PI*.06+.88*PI*u;
    const w=width*(boat?.70+.28*sin(PI*(.10+.85*v)):1);
    const shape=boat?sin(a):Math.min(1,3.3*Math.min(u,1-u));
    return [w*cos(a)*(inside?.84:1),1.06-.075*v-shape*(inside?.14:.20)-
      (boat?.055*sin(v*PI):0),z];
  }
  for(const inside of [false,true])s.add(patch(22,14,(u,v)=>stave(u,v,inside)),inside?'#b29b77':'#8d7354');
  for(const u of [0,1])s.add(patch(20,2,(j,v)=>{
    const a=stave(u,v,false),b=stave(u,v,true);return a.map((x,k)=>x+(b[k]-x)*j);
  }),'#d5c09a');
  s.add(patch(2,14,(u,v)=>{
    const a=stave(u,1,false),b=stave(u,1,true);return a.map((x,k)=>x+(b[k]-x)*v);
  }),'#8e795a');
  for(const v of [.22,.58])for(const side of [-1,1]){
    const a=stave(side<0?1:0,v,false);
    s.ball('#5c5647',a[0],a[1]-.036,a[2],.032,.032,.032);
  }
  if(boat)for(const z of [-.38,.34]){
    const line=[[-width*.87,1.04,z],[-width*.95,.91,z],[-width*.54,.79,z],[0,.76,z],[width*.70,.81,z],[width*.95,.93,z],[width*.87,1.04,z]];
    s.stroke(rope,line,[.022,.027,.025,.025,.026,.026,.021],17);
  }
}
function stoneInlet(s,kind,c) {
  if(kind==='cascade'){
    // Aprons tilt against the grain of their neighbour. Sinter is deposited
    // in thin returning shelves over the damp upstream face.
    for(let j=0;j<4;j++){
      const k=1-j*.12,z=-.18-.115*j,y=.30+j*.177;
      s.add(rimCut('sinter'),tint(c.base,'#dac9a5',j*.11),0,y,z,.73*k,.29,.65*k,0,.13*j);
    }
  }else{
    s.add(rimCut('coping'),c.base,0,.41,-.23,.68,.58,.70,0,.04);
    if(kind==='lotus'){
      const urn=profile([[.20,0],[.29,.045],[.27,.093],[.20,.128],[.178,.24],[.32,.32],[.365,.387],
        [.373,.451],[.325,.46],[.285,.383],[.20,.348],[.02,.328]],28);
      s.add(urn,c.accent,0,.77,-.22);
      for(let i=0;i<10;i++){
        const a=i*tau/10;
        s.add(patch(8,6,(u,v)=>{
          const w=sin(PI*v)**.74*(u-.5)*.15,r=.172+.165*v+.056*sin(PI*v);
          return [r*cos(a)-w*sin(a),.926+v*.257+.066*sin(PI*v)*cos((u-.5)*PI),-.22+r*sin(a)+w*cos(a)];
        }),i%2?'#9c9a7e':'#848d79');
      }
    }else{
      // A narrow haem of uncut rock above the channel reads as the brow of
      // a spring eye. Its throat is an actual recessed slot.
      s.add(rimCut('slate'),c.base,0,.96,-.31,.59,.30,.48,0,-.14);
    }
  }
  s.add(patch(12,16,(u,v)=>{
    const a=u*PI,r=.20+.043*sin(PI*v);
    return [r*cos(a),.976-.106*sin(a)-.056*v,-.21+1.16*v];
  }),kind==='lotus'?'#8b9a86':'#a9ac96');
  for(const side of [-1,1])s.stroke(c.base,[[side*.20,.972,-.22],[side*.237,.965,.13],[side*.23,.934,.52],[side*.196,.913,.95]],
    [.050,.047,.042,.032],12);
}

function jarInlet(s,c) {
  // Fired ovoid with a recessed neck, folded lip and potter's throwing rings.
  // The vessel rests in a cradle, with its mouth facing down the pool.
  const tilt=1.38;
  const form=profile([[.10,0],[.26,.055],[.32,.17],[.38,.39],[.365,.59],[.32,.72],[.206,.83],
    [.125,.93],[.130,1.02],[.162,1.05],[.162,1.10],[.126,1.10],[.113,1.03],[.092,.94]],38);
  s.add(form,c.accent,0,.72,-.15,1,1,1,tilt);
  for(let j=0;j<6;j++){
    const t=.20+j*.065,r=.330+.046*sin(PI*(j+.25)/6);
    const lathed=profile([[r,t],[r+.004,t+.006],[r,t+.010]],32);
    s.add(lathed,j%2?'#8f8270':'#a5967d',0,.72,-.15,1,1,1,tilt);
  }
  s.ball('#3f493f',0,.72+cos(tilt)*.97,-.15+sin(tilt)*.97,.115,.114,.014);
  for(const side of [-1,1]){
    s.stroke('#71634d',[[side*.46,.64,-.29],[side*.36,.60,.04],[side*.29,.65,.34]],
      [.05,.07,.045],8);
  }
}

function foxInlet(s,c) {
  // A low stone spring guardian, lying over the outlet. Its two ears and
  // tapered snout remain distinct from the passage for the water beneath.
  const skull=[[.45,.18,.14],[.37,.29,.22],[.17,.329,.26],[-.015,.32,.28]];
  const g=patch(15,26,(u,v)=>{
    const a=u*tau,t=v*(skull.length-1),i=Math.min(2,Math.floor(t)),q=t-i;
    const [z,w,h]=skull[i].map((x,k)=>x+(skull[i+1][k]-x)*q);
    return [w*sin(a),1.05+h*cos(a),z];
  });s.add(g,c.base);
  for(const side of [-1,1]){
    const a=.235*side;
    s.add(patch(7,12,(u,v)=>[a+.115*(1-v)*cos(tau*u)+side*.047*v,
      1.135+.202*v,.045+.081*(1-v)*sin(tau*u)-.035*v]),'#8c8979');
    s.stroke('#504e41',[[side*.245,1.111,.25],[side*.231,1.087,.308],[side*.204,1.081,.351]],
      [.002,.017,.003],8);
  }
  s.add(patch(18,22,(u,v)=>{
    const r=.145*(1-v)+.067,a=u*tau;return [r*cos(a),1.025-.101*v+r*.57*sin(a),.28+.59*v];
  }),c.base);
  s.ball('#514e41',0,.936,.856,.066,.044,.035);
  s.add(profile([[.24,0],[.31,.17],[.34,.25],[.26,.32]],20),c.accent,0,.66,.055,1,1,1,-.30);
}
// A celadon bird-shaped water dropper, enlarged to the scale of the bath.
// Its wing feathers are separately modelled; the water runs from the hollow
// lower bill and a vent remains open on the crown of the vessel.
function writingDropper(s){
  const celadon='#a3b7ac',pale='#cbd0ba',iron='#575f53',blue='#687d7c';
  s.ball(celadon,0,.68,-.11,.49,.39,.59,.16);
  s.ball(celadon,0,.96,.27,.30,.29,.31,-.19);
  s.add(profile([[.089,0],[.105,.022],[.101,.041],[.072,.052],[.063,.026]],26),pale,0,1.058,-.09);
  s.ball(iron,0,1.084,-.09,.066,.008,.066);
  for(const side of [-1,1]){
    for(let j=0;j<6;j++)s.ball(j%2?celadon:'#8caaa2',side*(.43-.028*j),.72+.034*j,-.18-.052*j,
      .075,.105,.37-.018*j,-.25,.27*side,-.07*side);
    s.stroke(blue,[[side*.35,.88,.11],[side*.46,.81,-.02],[side*.48,.80,-.23],[side*.40,.83,-.42]],[.002,.019,.014,.002],12);
    s.ball(pale,side*.233,1.015,.425,.047,.055,.059);
    s.ball('#393f39',side*.258,1.014,.455,.019,.035,.025);
    s.stroke(blue,[[side*.126,1.118,.475],[side*.21,1.097,.429],[side*.266,1.066,.369]],[.003,.017,.003],9);
  }
  for(let j=-2;j<=2;j++)s.ball(j%2?blue:celadon,j*.099,.79,-.60,.084,.098,.29,-.33,j*.17);
  s.add(patch(16,18,(u,v)=>{
    const a=u*PI,r=.12*(1-.21*v);
    return [r*cos(a),.975-.058*v-.063*sin(a),.45+.50*v];
  }),pale);
  for(const side of [-1,1])s.stroke(blue,[[side*.13,.98,.46],[side*.13,.963,.66],[side*.105,.927,.95]],
    [.023,.017,.011],9);
}
const suzuriCraft={...bathCraft.capital,spout:'dropper',base:'#535b59',accent:'#acb9a6'};
function inletForm(c) {
  const s=sculpture(),kind=c.spout;
  s.add(rimCut(c.rim==='coping'?'coping':'slate'),c.base,0,.24,-.205,.77,.45,.66,0,-.09);
  if(['rock','lotus','cascade'].includes(kind))stoneInlet(s,kind,c);
  else if(kind==='dropper')writingDropper(s);
  else if(kind==='fox')foxInlet(s,c);
  else if(kind==='jar')jarInlet(s,c);
  else {
    for(const side of [-1,1]){
      s.post(bark,side*.257,.55,-.11,.058,.79,.058,0,0,side*.10);
      s.stroke(rope,[[side*.32,.78,-.14],[side*.18,.79,-.10],[0,.75,-.06]],
        [.021,.024,.021],5);
    }
    s.box('#756048',0,.78,-.12,.69,.096,.18);
    if(kind==='bamboo')hollowBamboo(s,0,1.012,.14,.135,1.64);
    else ribbonTrough(s,kind==='boat');
  }
  return s.finish();
}

function leaf(s,col,x,y,z,length,width,a,lift=.38,dip=.12) {
  s.add(patch(4,2,(u,v)=>{
    const blade=sin(PI*v)**.74,across=(u-.5)*width*blade;
    return [x+length*v*cos(a)-across*sin(a),y+lift*v-dip*v*v+.032*blade*(1-2*Math.abs(u-.5)),
      z+length*v*sin(a)+across*cos(a)];
  }),col);
}
function blossoms(s,x,y,z,col,angle,size) {
  for(let j=0;j<5;j++){
    const a=angle+j*tau/5;
    s.add(patch(4,4,(u,v)=>{
      const split=.14*sin(PI*u)**6*v**4,r=size*v*(1-split);
      const side=size*.58*sin(PI*v*.81)*(u-.5);
      return [x+r*cos(a)-side*sin(a),y+.20*r+.21*size*sin(PI*v)-.13*size*cos(PI*(u-.5)),
        z+r*sin(a)+side*cos(a)];
    }),col);
  }
  s.add(seed,'#bf9b60',x,y+.009,z,.012,.008,.012);
}
function leafyBough(s,c) {
  const pine=c.plant==='pine',maple=c.plant==='maple';
  const snow=c.accent==='#e2e6de';
  const trunk=[[0,-.06,0],[-.073,.33,.02],[.034,.57,-.033],[.25,.77,-.12],[.34,.96,-.18]];
  s.stroke(bark,trunk,[.054,.05,.036,.022,.005],12);
  for(let j=0;j<8;j++){
    const a=j*2.399+.72,dy=.32+.081*j,start=[.06+.028*j,dy,-.018*j],l=.48-.018*j;
    const end=[start[0]+l*cos(a),dy+.20+.051*cos(j),start[2]+l*sin(a)];
    s.stroke('#77674e',[start,[start[0]+.41*l*cos(a),dy+.04,start[2]+.51*l*sin(a)],end],[.023,.014,.003],8);
    for(let k=0;k<4;k++){
      const t=.48+k*.153,dx=(.045+.05*(k%2))*sin(a);
      const x=start[0]+(end[0]-start[0])*t+dx,z=start[2]+(end[2]-start[2])*t-dx;
      const y=dy+(end[1]-dy)*t;
      if(pine){
        for(let n=0;n<7;n++)leaf(s,n%3?'#777e62':'#95987a',x,y,z,.11+.06*(n%2),.024,a+n*.76,.084,.018);
        if(snow&&k===3)s.ball('#e5e8db',x,y+.056,z,.11,.024,.075);
      }else if(maple){
        // Seven pointed lobes rise from one palmate leaf stalk.
        for(let n=-3;n<=3;n++)leaf(s,n%2?'#af7350':'#a36147',x,y,z,.123-.011*Math.abs(n),.057,a+.44*n,.08,.06);
      }else{
        const tone=k%3===0?'#e2d3bc':k%3===1?c.accent:'#d8acac';
        blossoms(s,x,y,z,tone,a+k,.069);
        if(k%3===0)s.add(seed,c.accent,x+.033,y+.041,z-.024,.031,.043,.028);
      }
    }
  }
}

function bankPlant(c) {
  const s=sculpture(),kind=c.plant;
  if(['pine','sakura','peach','maple'].includes(kind))leafyBough(s,c);
  else if(kind==='lotus'){
    for(let i=0;i<4;i++){
      const a=i*2.41,l=.19+.07*(i%2),x=l*cos(a),z=l*sin(a),y=.43+.09*i;
      s.stroke('#777e61',[[0,-.12,0],[x*.36,.20,z*.6],[x,y,z]],[.014,.012,.007],8);
      s.add(patch(6,25,(u,v)=>{
        const q=u*tau,r=v*(.21+.054*cos(q-a)+.016*sin(q*7+a));
        return [x+r*cos(q),y-.10*sin(PI*v*.82)+.025*v*sin(5*q+a),z+r*sin(q)];
      }),i%2?'#9b9e81':'#7d8b71');
    }
    blossoms(s,.08,.69,.07,'#d4b7ad',.15,.15);
  }else{
    for(let i=0;i<13;i++){
      const a=i*2.399+.35,span=.23+.38*(.5+.5*sin(3.18*i+.65)),x=.07*cos(a),z=.07*sin(a);
      const height=(kind==='susuki'?1.52:kind==='rice'?.97:.81)*(.69+.31*cos(i*.72)**2);
      leaf(s,i%3?'#88926c':'#a5a284',x,-.03,z,span,kind==='sasa'?.14:kind==='iris'?.10:.047,a,height,.32);
      if(i%2 || kind==='sedge')continue;
      const tip=[x+span*.51*cos(a),height,z+span*.51*sin(a)];
      s.stroke('#8a8863',[[x,-.08,z],[x+.064*cos(a),height*.66,z+.064*sin(a)],tip],[.014,.012,.005],7);
      if(kind==='iris'){
        // Three pendulous falls around the upright standards.
        for(let j=0;j<3;j++){
          const ang=a+j*tau/3;
          leaf(s,'#847c94',...tip,.116,.082,ang,.054,.123);
          leaf(s,'#ada3b3',...tip,.068,.046,ang+.8,.09,.022);
        }
      }else if(kind==='sasa'){
        for(let j=0;j<4;j++)leaf(s,'#929b71',tip[0],tip[1]-.087*j,tip[2],.24-.021*j,.079,a+j*2.38,.054,.087);
      }else{
        for(let j=0;j<8;j++){
          const k=j/8,dir=a+.39*sin(j),w=sin(PI*(.10+.81*k));
          const px=tip[0]+.19*k*cos(a),py=height+(kind==='rice'?-.17:.16)*k,pz=tip[2]+.19*k*sin(a);
          if(kind==='rice')s.add(seed,'#b79e64',px+.028*cos(dir),py-.025,pz+.024*sin(dir),.018,.047,.019,.16,dir);
          else s.stroke('#cbb895',[[px,py,pz],[px+.061*w*cos(dir-.3),py+.071*w,pz+.045*sin(dir)],
            [px+.19*w*cos(dir),py+.13*w,pz+.13*w*sin(dir)]],[.010,.017,.001],5);
        }
      }
    }
  }
  return s.finish();
}

const foliageCluster=[[-.71,-.64,.96],[-1.07,-.21,.83],[.66,-.78,1.05],
  [.86,-.72,.84],[.97,-.53,.92],[1.06,-.34,.72]];
function marker(p,f,s,spot,c) {
  f.put('box',spot.u,.62,spot.v-.07,.13,1.43,.13,'#6b5b47',p.wood);
  f.put('box',spot.u,spot.h-.25,spot.v,spot.w,.50,spot.d,c.base,p.wood);
  f.put('plane',spot.u,spot.h-.25,spot.v+.083,1.41,.454,1,'#fff',
    inscriptionMaterial(s.name,{ground:'#695e49',ink:'#f0e2bf'}));
}
function prepareShapes(p,c,kind,site) {
  const inlet='regionalInlet-'+kind,plant='regionalPlant-'+kind;
  const fitted=!hasOwnInlet(site);
  if(fitted)p.shapes[inlet]??=inletForm(c);
  p.shapes[plant]??=bankPlant(c);
  if(fitted && !p.shapes.regionalFall){
    p.shapes.regionalFall=patch(20,10,(u,v)=>{
      const w=.11-.042*sin(PI*v)+.051*v*v,flute=.014*sin(u*PI*4+.93*v);
      return [w*(.5-u)*2,.919*(1-v*v)-.004,.936+(inletImpactV-.936)*v+flute];
    });
  }
  if(site.rank!=='main' && c.rim!=='cobble'){
    const key='regionalRim-'+c.rim;
    p.shapes[key]??=rimCut(c.rim);
  }
}
// The regional water fan has eighty outer vertices. At each one, join the
// waterline to the drawn hillside, whose 2.5 m triangles may span the bank.
export function regionalSpringBank(site,level) {
  const shore=[];
  for(let i=0;i<=80;i++) {
    const a=(i%80)*tau/80,lip=springLip(site.index,a);
    const u=lip*site.rx*cos(a),v=lip*site.rz*sin(a),length=Math.hypot(u,v);
    const [x,z]=sitePoint(site,u,v);
    const spread=(.93+.12*cos(3*a)+.07*sin(7*a))*(1+Math.min(2.4,Math.max(0,level-terrainMeshHeight(x,z))));
    shore.push({u,v,dx:u/length,dz:v/length,spread});
  }
  // Carry the wet gravel into an irregular apron. A wide outside row may be
  // swallowed by the hillside; the shared lip still meets the water exactly.
  const offsets=[-.19,0,.28,.78,1.72],coverage=[.90,.96,.72,.23,0];
  const colors=[];
  const bank=patch(4,80,(turn,across)=>{
    const a=turn*tau,row=Math.round(across*4);
    const {u,v,dx,dz,spread}=shore[Math.round(turn*80)];
    const offset=offsets[row]*(row>1?spread:1);
    const px=u+dx*offset,pz=v+dz*offset;
    const [x,z]=sitePoint(site,px,pz),mesh=terrainMeshHeight(x,z)-level;
    const sand=.40+.16*sin(a*11+site.index)+.072*cos(a*29-row*1.3)+.11*row;
    const pigment=tint('#aa9b7e','#e5dbbd',sand);
    colors.push(pigment.r,pigment.g,pigment.b,coverage[row]);
    if(row<2)return [px,row===0?-.075:.006,pz];
    const beach=(.036+.028*row)*(.92+.08*sin(3*a+.5));
    const y=row===4?mesh-.05:Math.max(beach,mesh+.012)*(row===2?.76:1);
    return [px,y,pz];
  });
  bank.setAttribute('color',new T.Float32BufferAttribute(colors,4));
  const positions=bank.attributes.position,uv=bank.attributes.uv;
  for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i)*.67,positions.getZ(i)*.67);
  return bank;
}
export function dressRegionalBath(p,f,s,level) {
  const writingDesk=s.shape==='suzuri', key=writingDesk?'suzuri':s.kind;
  const c=writingDesk?suzuriCraft:bathCraft[s.kind],fixtures=regionalBathFittings(s,springLip);
  prepareShapes(p,c,key,s);
  const custom=bathPools(s)!==undefined;
  if(!custom){
    const bank='springBank-'+s.id;
    p.shapes[bank]??=regionalSpringBank(s,level);
    p.part(bank,s.x,level,s.z,1,1,1,'#fff',s.yaw,0,0,p.springGravel,false,true);
    // A half-submerged fringe of stream gravel marks the opening without
    // making a raised sill across the path down into the water.
    for(let j=0;j<21;j++){
      const across=(j%7-3)*.276+.09*sin(j*2.84+s.index);
      const a=PI*.5+across,lip=springLip(s.index,a);
      const offset=.08+.21*Math.floor(j/7)+.11*cos(j*3.27);
      const u=(s.rx*lip+offset)*cos(a),v=(s.rz*lip+offset)*sin(a);
      const levelAt=terrainMeshHeight(...sitePoint(s,u,v))-level;
      const size=.066+.039*(1+sin(j*2.67+s.index));
      f.put('springCrag'+(j%3),u,Math.max(.028,levelAt),v,size*1.24,size*.42,size,
        j%3?'#a09278':'#827962',p.stone,j*1.82);
    }
  }
  const tableau=s.rank==='main'?bathTableau(s):null;
  if(tableau && !custom){
    const vessel='basin-'+s.id;
    p.shapes[vessel]??=buildBasinVessel(s);
    f.put(vessel,0,0,0,1,1,1,'#fff',basinMaterial(p,s));
  }
  const stones=retreatStones(s);
  for(const q of stones){
    const scale=q.scanned?.64:1;
    const col=tint(c.base,q.i%3?'#b8ae93':'#606657',.09+.13*(.5+.5*sin(q.i*2.37+s.index)));
    const shape=c.rim==='cobble'?'springCrag'+(q.i%3):'regionalRim-'+c.rim;
    f.put(shape,q.u,.075,q.v,q.w*scale,q.h*scale,q.d*scale,col,p.stone,q.angle);
    if(s.kind==='snow'){
      f.put('springCrag'+((q.i+1)%3),q.u,.085+.80*q.h,q.v,
        q.w*.87,q.h*.215,q.d*.84,'#e5e7dd',p.fine,q.angle);
    }
  }
  const {inlet,sign}=fixtures;
  if(!hasOwnInlet(s)){
    f.put('regionalInlet-'+key,inlet.u,0,inlet.v,1,1,1,'#fff',p.stems);
    f.put('regionalFall',inlet.u,0,inlet.v,1,1,1,'#bcd4c3',p.springFlow);
  }
  for(let i=0;i<foliageCluster.length;i++){
    const [nx,nz,size]=foliageCluster[i],a=Math.atan2(nz,nx);
    const lip=springLip(s.index,a);
    const u=nx*(s.rx+.72)*lip,v=nz*(s.rz+.68)*lip;
    if(['earthen','paddy','sulfur'].includes(s.kind)&&bathPools(s)?.some(b=>poolRadius(b,u,v)<1.42))continue;
    if(Math.hypot(u-inlet.u,v-inlet.v)<1.30 || tableau && Math.hypot(u-tableau.u,v-tableau.v)<2)continue;
    const [x,z]=sitePoint(s,u,v),ground=terrainHeight(x,z)-level;
    const h=size*(s.kind==='susuki'?1.28:1);
    f.put('regionalPlant-'+key,u,ground-.028,v,h,h,h,'#fff',p.stems,i*2.40+s.index*.39);
  }
  dressVillageBath(p,f,s);
  if(!writingDesk)marker(p,f,s,sign,c);
}
