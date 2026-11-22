// Original three-dimensional pen studies. Every flank, sleeve and flight feather
// carries its own UVs; moving parts from one species share an instanced draw.
import * as T from './vendor/three.module.min.js';
import { skin as brushSkin, profile as brushProfile, eye as inkEye } from './ryugu-sculpt.js';
import { InkForm, surface, pigment as seaPigment } from './ryugu-ink.js';
import { courtFowl } from './court-fowl.js';
import { brushWash } from './scroll-sculpt.js';
import { otsuParts } from './otsu-beasts.js';

const {sin,cos,PI}=Math,tau=2*PI;
const ink='#403b34',smoke='#71685a',silk='#eee4c9',horn='#e9d9b8',ochre='#b39b6b';
const patches={paper:0,hide:1,beast:2,feather:3,bib:4,lotus:5,scales:6,wave:7,plume:8,coverts:9,mane:10,lining:11};
const origin=[0,0,0],unit=[1,1,1];
let material;
export function faunaPigment() {
  if(!material){
    const map=new T.TextureLoader().load(new URL('./assets/bestiary/scroll-fauna.webp',import.meta.url).href);
    map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    material=brushWash(new T.MeshLambertMaterial({map,vertexColors:true,side:T.DoubleSide}),.28);
  }
  return material;
}
function part(name,pivot,draw){
  const f=new InkForm(patches,4,3);draw(f);
  return {name,pivot,geometry:f.geometry()};
}
const line=(f,p,r=.012,c=ink)=>f.stroke(p,r,c,'paper',6);
const tube=(f,p,r,c,tile='paper')=>f.stroke(p,r,c,tile,12);
// Transverse sections, not overlapping ellipsoids. Interpolation eases the
// cheek into the muzzle and the round haunch into the sloping shoulders.
function loft(f,axis,rows,tile,tint='#fffdf2',fold=0,arc=tau,lift=0) {
  const a=new T.CatmullRomCurve3(rows.map(([p,q,r])=>new T.Vector3(p,q,r)),false,'catmullrom',.42);
  const b=new T.CatmullRomCurve3(rows.map(r=>new T.Vector3(r[3],r[4],0)),false,'catmullrom',.42);
  const v=[],uv=[],ix=[],long=4*(rows.length-1),sides=32;
  for(let i=0;i<=long;i++){
    const u=i/long,c=a.getPoint(u),r=b.getPoint(u);
    for(let j=0;j<=sides;j++){
      const t=arc===tau?j/sides*tau:(j/sides-.5)*arc,profile=1+fold*cos(9*t+u*.67)*(.32+.68*u);
      const w=Math.max(.002,r.x)*profile+lift,h=Math.max(.002,r.y)*profile+lift;
      if(axis==='z'){
        v.push(c.x+w*sin(t),c.y+h*cos(t),c.z);
        uv.push(u,.5+.49*cos(t));
      }else{
        v.push(c.x+w*sin(t),c.y,c.z+h*cos(t));
        uv.push(j/sides,1-u);
      }
      if(i<long && j<sides){const k=i*(sides+1)+j;ix.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const g=surface(v,ix,uv);
  // Glue normals across the UV seam.
  const n=g.attributes.normal,normal=new T.Vector3();
  if(arc===tau)for(let i=0;i<=long;i++){
    const k=i*(sides+1);normal.fromBufferAttribute(n,k).add(new T.Vector3().fromBufferAttribute(n,k+sides)).normalize();
    n.setXYZ(k,normal.x,normal.y,normal.z);n.setXYZ(k+sides,normal.x,normal.y,normal.z);
  }
  f.draw(g,origin,unit,tint,origin,tile);
}
function eye(f,s,x,y,z,size) {
  const p=[s*x,y,z],tilt=[0,s*.27,-s*.07];
  f.oval(p,[size*.49,size*.72,size],smoke,tilt);
  f.oval([s*(x+size*.16),y,z+size*.06],[size*.42,size*.53,size*.77],'#decb9b',tilt);
  f.oval([s*(x+size*.41),y,z+size*.17],[size*.22,size*.43,size*.39],ink,tilt);
  f.oval([s*(x+size*.56),y+size*.20,z+size*.28],[size*.10,size*.14,size*.13],'#fff6d7',tilt);
  line(f,[[s*x,y+size*.30,z-size*.88],[s*(x+size*.26),y+size*.75,z],[s*x,y+size*.40,z+size*1.12]],
    [size*.035,size*.18,size*.04]);
}
// Fold a surface around a raised rib. UVs on the vanes run root-to-tip
// even when the sickles curl backwards over the rump or an ear twists.
function blade(f,points,widths,across,depth,tile,tint='#fff9e8',rib=true) {
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),axis=new T.Vector3(...across);
  const v=[],ix=[],uv=[],rows=18,cols=7;
  for(let i=0;i<=rows;i++){
    const u=i/rows,center=path.getPoint(u),tangent=path.getTangent(u),cross=axis.clone().addScaledVector(tangent,-axis.dot(tangent)).normalize();
    const bulge=new T.Vector3().crossVectors(cross,tangent).normalize(),fidx=u*(widths.length-1),k=Math.min(widths.length-2,Math.floor(fidx));
    const w=widths[k]+(widths[k+1]-widths[k])*(fidx-k);
    for(let j=0;j<cols;j++){
      const t=j/(cols-1)*2-1;
      const p=center.clone().addScaledVector(cross,t*w).addScaledVector(bulge,depth*(1-t*t)*sin(PI*u));
      v.push(p.x,p.y,p.z);uv.push((1+t)/2,1-u);
      if(i<rows && j<cols-1){const a=i*cols+j;ix.push(a,a+1,a+cols,a+1,a+cols+1,a+cols);}
    }
  }
  f.draw(surface(v,ix,uv),origin,unit,tint,origin,tile);
  if(rib)line(f,points,points.map((_,i)=>i===points.length-1?.003:.009),'#80725b');
}
function toes(f,hawk,offset=origin){
  const bend=hawk?.074:.092;
  for(const j of [-1,0,1,2]){
    const back=j===2,x=back?.015:j*.058,z=back?-.115:.158-Math.abs(j)*.032;
    const points=[[0,.034,0],[x*.51,.018,z*.48],[x,.013,z],[x*1.13,hawk?-.027:.008,z+.015*(back?-1:1)]];
    for (const p of points)for(let i=0;i<3;i++)p[i]+=offset[i];
    tube(f,points,[.022,.019,.013,.007],ochre);
    tube(f,[points[3],[offset[0]+x*1.14,offset[1]+(hawk?-.049:.009),offset[2]+z+(back?-1:1)*.036],
      [offset[0]+x*1.09,offset[1]+(hawk?-.062:.002),offset[2]+z+(back?-1:1)*(hawk?.034:bend*.6)]],[.012,.009,.001],ink);
  }
}
function hawk(){
  const parts=[part('body',origin,f=>{
    loft(f,'z',[[0,.32,-.45,.032,.05],[0,.35,-.32,.13,.13],[0,.34,-.11,.184,.187],
      [0,.36,.10,.188,.21],[0,.44,.221,.154,.182],[0,.493,.267,.123,.157],[0,.535,.301,.084,.108]],'bib');
    for(let j=-3;j<=3;j++){
      blade(f,[[j*.025,.345,-.26],[j*.047,.323,-.44],[j*.056,.25,-.69],[j*.06,.19,-.80+.012*Math.abs(j)]],
        [.018,.059,.051,.008],[1,0,0],.009,'feather');
    }
    for(const s of [-1,1]){
      for(let j=0;j<3;j++)blade(f,[[s*.098,.542-j*.019,.194],[s*.130,.48-j*.016,.169],[s*.15,.438-j*.018,.156]], [.013,.033,.002],[0,0,1],.005,'bib');

    }
  }),part('head',[0,.454,.19],f=>{
    const skull=[[0,-.018,-.135,.051,.067],[0,.028,-.096,.104,.12],[0,.093,-.049,.127,.143],[0,.108,.05,.128,.13],
      [0,.086,.13,.098,.089],[0,.072,.17,.068,.056]];
    loft(f,'z',skull,'coverts');
    loft(f,'z',skull,'plume','#aca390',0,2.21,.004);
    tube(f,[[0,.081,.152],[0,.079,.199],[0,.059,.245],[0,.026,.262],[0,.008,.249]],
      [.063,.044,.031,.018,.002],ink);
    f.oval([0,.097,.164],[.065,.038,.043],ochre);
    for(const s of [-1,1]){
      eye(f,s,.107,.114,.096,.049);
      line(f,[[s*.066,.145,.156],[s*.119,.166,.090],[s*.129,.170,.006],[s*.112,.149,-.049]],
        [.006,.012,.016,.003],'#d8c8a7');
      line(f,[[s*.103,.144,.039],[s*.117,.151,.092],[s*.079,.131,.158]],[.009,.019,.006],'#514737');
      blade(f,[[s*.097,.09,.09],[s*.124,.039,.04],[s*.117,-.024,-.027]], [.016,.036,.002],[0,0,1],.009,'plume');
    }
  })];
  for(const s of [-1,1]){
    parts.push(part('mantle'+s,origin,f=>{
      // Scapulars and coverts drape against the flank when the long
      // primaries fold away. Their leading edge follows the shoulder girdle.
      loft(f,'z',[[s*.081,.259,-.535,.012,.014],[s*.116,.295,-.416,.039,.043],
        [s*.147,.343,-.281,.050,.083],[s*.163,.368,-.112,.062,.111],
        [s*.154,.392,.038,.064,.098],[s*.114,.413,.173,.044,.059],[s*.089,.417,.207,.016,.023]],'coverts');
      for(let j=0;j<5;j++){
        const x=s*(.180+j*.005),y=.439-j*.032;
        blade(f,[[x,y,.051-j*.012],[s*.222,y-.012,-.095],[s*.19,y-.027,-.257],
          [s*(.116+j*.003),y-.082,-.43+j*.019]], [.010,.036,.032,.003],[0,1,0],s*.010,'feather');
      }
    }),part('wing'+s,[s*.128,.405,.041],f=>{
      const outline=[[0,.008,.17],[s*.25,.074,.19],[s*.52,.082,.157],[s*.72,.047,.064],
        [s*.78,.018,-.047],[s*.65,-.008,-.198],[s*.36,-.027,-.235],[s*.055,-.029,-.211]];
      const v=[s*.36,.087,-.012],uv=[.5,.5],ix=[];
      outline.forEach((p,i)=>{v.push(...p);uv.push(Math.abs(p[0])/.8,(p[2]+.25)/.46);ix.push(0,i+1,(i+1)%outline.length+1);});
      f.draw(surface(v,ix,uv),origin,unit,'#e5d9bd',origin,'coverts');
      // Fingered primaries fan out from the wrist; secondaries overlap them from the elbow.
      for(let j=0;j<8;j++){
        const u=j/7,x=.48+.19*u,dx=.10+.53*u,back=.405-.30*u;
        blade(f,[[s*x,.037,.089*u],[s*(x+dx*.52),.030+.027*u,-back*.30],[s*(x+dx*.86),-.009,-back*.77],[s*(x+dx),-.043,-back]],
          [.023,.078-.023*u,.055-.017*u,.003],[0,0,1],.017*s,'feather');
      }
      for(let j=0;j<6;j++){
        const x=.09+j*.075;
        blade(f,[[s*x,.035,.061],[s*(x+.082),.038,-.076],[s*(x+.133),.011,-.243],[s*(x+.139),-.015,-.32]],
          [.017,.071,.056,.006],[1,0,0],.009,'feather');
      }
    }));
    parts.push(part('claw'+s,[s*.089,.230,.013],f=>{
      tube(f,[[0,.024,.004],[s*.006,-.073,-.037],[s*.009,-.149,-.003],[s*.005,-.204,.033]],
        [.052,.040,.021,.017],ochre);
      for(let j=0;j<3;j++)line(f,[[-.011,-.184+j*.018,.030],[.002,-.186+j*.018,.041],[.015,-.181+j*.018,.029]],
        .003,'#716245');
      toes(f,true,[s*.004,-.216,.037]);
    }));
  }
  return parts;
}
// The chamberlain's carp head has a high nape sloping into fleshy lips.
// Its barbels curl forward below the gill covers, clear of the hat cord.
function courtCarpHead(){
  const f=new InkForm({paper:0,scales:1,feather:0,plume:0},3,2);
  const section=brushProfile([
    [-.335,.021,.059,.167],[-.275,.156,.203,.181],[-.155,.255,.277,.195],
    [.035,.281,.258,.184],[.194,.247,.209,.155],[.323,.183,.151,.119],
    [.398,.121,.083,.090],[.444,.057,.044,.088],[.457,.005,.014,.079],
  ]);
  function cheek(z,a,lift=0){
    const [breadth,depth,centre]=section(z);
    return [(breadth+lift)*sin(a),centre+(depth+lift)*cos(a),z];
  }
  brushSkin(f,36,34,(u,v)=>{
    const z=-.335+.792*v,a=u*tau;
    return [...cheek(z,a),.23+.76*v,.5+.45*cos(a)];
  },'#fff9e8','scales',false,true);
  for(const side of [-1,1]){
    const q=(z,a,l)=>cheek(z,side*a,l);
    inkEye(f,(u,v,l)=>q(.196+.082*u,1.18-.30*v,.006+l),.91);
    const gill=[[-.014,.69],[-.067,.98],[-.091,1.41],[-.082,1.81],[-.025,2.16],[.075,2.37]];
    line(f,gill.map(([z,a])=>q(z,a,.004)),[.002,.009,.013,.011,.006,.001]);
    line(f,gill.slice(1,-1).map(([z,a])=>q(z-.027,a,.004)),[.001,.005,.004,.001],smoke);
    line(f,[[.368,1.62],[.39,1.78],[.415,1.94],[.44,1.78]].map(([z,a])=>q(z,a,.005)),
      [.002,.006,.009,.002]);
    const lip=q(.392,1.96);
    tube(f,[lip,[side*.16,.023,.443],[side*.231,-.021,.464],[side*.256,-.004,.442],
      [side*.259,.012,.434]],[.012,.013,.008,.005,.001],'#726756');
    blade(f,[q(-.156,1.83),[side*.30,.169,-.235],[side*.375,.205,-.305],[side*.415,.243,-.369]],
      [.038,.074,.057,.002],[0,1,0],.017*side,'feather','#c8c0a9');
  }
  // A pinched eboshi sits high behind the eyes. The ties follow the cheek.
  loft(f,'y',[[0,.829,-.201,.019,.023],[.021,.796,-.18,.077,.069],[.034,.703,-.132,.102,.10],
    [.017,.574,-.09,.107,.123],[0,.493,-.057,.151,.149],[0,.401,-.037,.187,.172],
    [0,.375,-.035,.193,.17]],'plume','#625e55',.037);
  for(const side of [-1,1])line(f,[[side*.164,.406,-.023],[side*.237,.324,-.046],
    [side*.271,.234,-.073],[side*.256,.112,-.083]],[.013,.011,.008,.004],'#4d4c43');
  return {name:'head',pivot:[0,1.53,.006],geometry:f.geometry(),material:seaPigment()};
}
function fishfolk(){
  const parts=[part('body',origin,f=>{
    // Underskirt and kosode leave a stepped hem and an open wrap at the ankle.
    loft(f,'y',[[0,.387,-.016,.25,.157],[0,.32,-.018,.274,.175],[0,.289,-.019,.288,.192],[0,.249,-.025,.32,.23],
      [0,.18,-.026,.342,.242]],'lining','#fff7dd',.065);
    loft(f,'y',[[0,1.49,-.015,.186,.139],[0,1.409,-.024,.34,.214],[0,1.27,-.025,.362,.241],
      [0,.996,.003,.284,.201],[0,.91,-.015,.283,.213],[0,.67,-.020,.318,.249],[0,.295,-.046,.36,.264]],
      'wave','#f5efdd',.083);
    for(const s of [-1,1]){
      const collar=[[s*.145,1.48,.036],[s*.129,1.391,.168],[s*.059,1.286,.222],
        [-s*.013,1.216,.230],[-s*.129,1.095,.194]];
      if(s<0)collar.splice(3,2,[-.005,1.233,.215]); // the underlap disappears beneath the upper panel
      blade(f,collar,collar.map(()=>.041),[1,0,0],.003,'paper',silk,false);
      line(f,collar.map(([x,y,z])=>[x+s*.036,y,z+.004]),.005,'#596355');
      blade(f,[[s*.196,.23,.10],[s*.223,.138,.12],[s*.228,.086,.21],[s*.227,.055,.302]],
        [.063,.076,.089,.014],[1,0,0],.016,'scales');
    }
    loft(f,'y',[[0,1.063,-.006,.311,.239],[0,1.039,-.006,.326,.251],[0,.934,-.006,.323,.247],[0,.908,-.006,.309,.235]],'lotus');
    f.oval([-.014,.985,-.238],[.165,.084,.07],'#c3a574',[0,0,-.12]);
    for(const s of [-1,1])blade(f,[[s*.036,.97,-.258],[s*.079,.84,-.281],[s*.081,.73,-.261]],
      [.043,.058,.028],[1,0,0],.019,'lotus');
  }),courtCarpHead()];
  for(const s of [-1,1])parts.push(part('sleeve'+s,[s*.28,1.346,-.011],f=>{
    loft(f,'y',[[0,.052,0,.084,.11],[s*.082,.008,.009,.133,.142],[s*.137,-.081,.04,.136,.159],
      [s*.164,-.209,.068,.15,.17],[s*.154,-.354,.084,.143,.182],[s*.131,-.426,.111,.141,.171]],'wave','#eee9d5',.055);
    f.oval([s*.13,-.425,.124],[.134,.026,.157],'#575b4e');
    blade(f,[[s*.122,-.392,.156],[s*.15,-.458,.22],[s*.16,-.478,.311],[s*.142,-.438,.363]],
      [.049,.071,.069,.012],[1,0,0],.02,'scales');
    if(s===1) {
      // Shaku, tapered ivory tablet, is carried in the right fin.
      blade(f,[[.14,-.532,.303],[.143,-.403,.316],[.145,-.22,.309],[.142,-.041,.279]],
        [.034,.047,.054,.035],[1,0,0],.011,'paper',horn,false);
      line(f,[[.097,-.401,.319],[.090,-.204,.311],[.111,-.043,.279]],[.005,.008,.004],ochre);
    }
  }));
  return parts;
}
export const faunaForms=['elephant','baku','hawk','ox','chicken','hen','fishfolk'];
export function faunaForm(n){return n.type==='chicken' && n.variant%4!==0?'hen':n.type;}
export function buildFaunaParts(kind) {
  if(kind==='elephant'||kind==='baku'||kind==='ox')return otsuParts(kind);
  return kind==='chicken'||kind==='hen'?courtFowl(kind==='hen'):{hawk,fishfolk}[kind]();
}
const fowlLateral=new T.Vector3(1,0,0);
const elephantPivot=new T.Vector3(0,1.51,.80),headTurn=new T.Euler(),headQuat=new T.Quaternion();
export function poseFaunaPart(part,n,t,out) {
  const q=t*(n.type==='chicken'?6.5:3.2)+n.phase,walk=Math.min(1,n.speed*1.55),bow=n.gesture||0;
  const ack=Math.min(1,(n.flash||0)*2.2),key=part.name,s=key.endsWith('-1')?-1:1;
  out.position.fromArray(part.pivot);out.rotation.set(0,0,0,'XYZ');out.scale.setScalar(1);
  if(n.type==='chicken'){
    const peck=bow*(.5+.5*sin(q*1.6))**2;
    const pitch=.082*walk*sin(q)+peck*.30;
    if(key==='head'){
      out.rotation.set(.042+1.40*peck+.060*walk*sin(q),.15*sin(t*.77+n.phase)+.22*ack,.045*cos(t*1.2+n.phase));
      out.position.y-=(n.variant%4===0?.28:.307)*peck;
      out.position.z+=.17*peck;
    }else if(key==='body'){
      out.rotation.x=pitch;
      out.position.y-=.044*peck;
    }else if(key==='sickles'){
      // Follow the rump around the same origin as the body before the plumes sway.
      out.position.applyAxisAngle(fowlLateral,pitch);
      out.position.y-=.044*peck;
      out.rotation.x=pitch+.065*sin(q-.55)*walk;
      out.rotation.z=.030*sin(q*.5);
    }else if(key.startsWith('foot')){
      out.rotation.x=s*.52*sin(q)*walk;
      out.position.y+=Math.max(0,s*cos(q))*.033*walk;
    }
    out.updateMatrix();
    return;
  }
  if(key.startsWith('leg')){
    const [side,fore]=key.slice(3).split(',').map(Number);
    out.rotation.x=side*fore*sin(q)*walk*(n.type==='elephant'?.18:.31);
  }else if(key==='head'){
    out.rotation.y=.12*sin(t*.77+n.phase)+.16*ack;
    out.rotation.z=.035*cos(t*1.2+n.phase);
    if(n.type==='hawk')out.rotation.y=n.perched?.68*sin(t*.73+n.phase):.06*cos(q);
    else if(n.type==='fishfolk')out.rotation.x=.13*sin(t*1.1+n.phase)+.22*ack;
    else out.rotation.x=.19*bow+.034*sin(q)*walk;
  }else if(key.startsWith('wing')){
    const spread=n.spread,flap=sin(t*6.2+n.phase)*(.42+.30*sin(t*.77+n.phase));
    out.rotation.order='YXZ';
    out.rotation.y=s*1.28*(1-spread);out.rotation.x=-.06-.24*(1-spread);
    out.rotation.z=s*(flap*spread-.33*(1-spread));
    const opening=Math.min(1,spread*1.86);
    out.scale.set((.53+.47*spread)*opening,(.83+.17*spread)*opening,(.65+.35*spread)*opening);
  }else if(key.startsWith('claw'))out.rotation.x=1.28*n.spread;
  else if(key==='trunk'){
    out.rotation.x=.089*sin(t*.89+n.phase)-.35*bow;
    out.rotation.z=.13*sin(t*1.21+n.phase)+.14*ack;
  }else if(key.startsWith('ear'))out.rotation.y=s*(.11+.19*sin(t*1.89+n.phase));
  else if(key.startsWith('sleeve')){
    out.rotation.x=-.17-.26*bow-.22*ack;out.rotation.z=s*.11*sin(t*.92+n.phase);
  }
  if(n.type==='elephant' && (key==='trunk' || key.startsWith('ear'))){
    headTurn.set(.19*bow+.034*sin(q)*walk,.12*sin(t*.77+n.phase)+.16*ack,.035*cos(t*1.2+n.phase));
    headQuat.setFromEuler(headTurn);
    out.position.sub(elephantPivot).applyQuaternion(headQuat).add(elephantPivot);
    out.quaternion.premultiply(headQuat);
  }
  out.updateMatrix();
}
