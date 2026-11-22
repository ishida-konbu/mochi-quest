// Original three-dimensional pen studies. Every flank, sleeve and flight feather
// carries its own UVs; moving parts from one species share an instanced draw.
import * as T from './vendor/three.module.min.js';
import { InkForm, surface } from './ryugu-ink.js';
import { brushWash } from './scroll-sculpt.js';
import { pullingOx, oxLeg } from './kyo-procession-art.js';
import { scrollPigment } from './kyo-scrollwork.js';

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
function mantle(f) {
  // A saddle-length brocade, with a curved top and weighted, fringed hems.
  const v=[],uv=[],ix=[],nz=17,na=24;
  const point=(u,t)=>{
    const z=-.58+u*.88,theta=t*1.91;
    return [sin(theta)*(.646+.021*cos((u*6+t)*PI)),1.20+cos(theta)*(.63+.036*sin(u*PI)),z+.024*sin(t*3+u*7)];
  };
  for(let i=0;i<=nz;i++)for(let j=0;j<=na;j++){
    const u=i/nz,t=2*j/na-1;v.push(...point(u,t));uv.push(u,(t+1)/2);
    if(i<nz && j<na){const k=i*(na+1)+j;ix.push(k,k+1,k+na+1,k+1,k+na+2,k+na+1);}
  }
  f.draw(surface(v,ix,uv),origin,unit,'#fdf6e1',origin,'lotus');
  for(const s of [-1,1]){
    line(f,Array.from({length:9},(_,i)=>point(i/8,s)),.019,ochre);
    for(let i=0;i<8;i++){
      const [x,y,z]=point((i+.35)/8,s);
      tube(f,[[x,y,z],[x+s*.012,y-.053,z],[x+s*.022,y-.11,z+.012]],[.009,.017,.005],i%2?ochre:'#a17756');
    }
  }
}
function elephant(){
  const parts=[part('body',origin,f=>{
    loft(f,'z',[[0,1.12,-1.13,.035,.15],[0,1.13,-1.02,.35,.47],[0,1.15,-.77,.54,.63],
      [0,1.16,-.32,.60,.64],[0,1.19,.12,.615,.63],[0,1.24,.55,.55,.62],[0,1.35,.79,.41,.50],[0,1.47,.95,.24,.36]],'hide');
    mantle(f);
    tube(f,[[0,1.48,-1.01],[-.065,1.20,-1.18],[-.13,.83,-1.20],[-.22,.54,-1.16]],[.056,.043,.031,.016],'#a59a87');
    blade(f,[[-.22,.63,-1.17],[-.23,.49,-1.16],[-.32,.39,-1.11]],[.027,.061,.005],[1,0,0],.004,'plume');
    for(const s of [-1,1]) {
      line(f,[[s*.46,1.56,.51],[s*.55,1.18,.55],[s*.45,.95,.65],[s*.27,.78,.65]],[.024,.029,.025,.018],'#985e4d');
      f.oval([s*.26,.743,.64],[.055,.079,.052],ochre);
    }
  }),part('head',[0,1.51,.80],f=>{
    loft(f,'z',[[0,.022,-.18,.19,.27],[0,.09,-.04,.36,.44],[0,.17,.15,.406,.48],
      [0,.188,.33,.35,.422],[0,.136,.46,.276,.36],[0,.09,.565,.174,.24]],'hide');
    for(const s of [-1,1]){
      eye(f,s,.313,.205,.343,.072);
      line(f,[[s*.345,.32,.22],[s*.315,.36,.325],[s*.26,.32,.433]],[.007,.016,.004]);
      tube(f,[[s*.207,-.056,.405],[s*.254,-.14,.565],[s*.286,-.173,.78],[s*.30,-.123,.956],[s*.291,-.071,1.01]],[.091,.089,.064,.026,.003],horn);
      for(let j=0;j<3;j++)line(f,[[s*.336,.11-j*.047,.13],[s*.355,.076-j*.039,.224],[s*.326,.065-j*.034,.301]],[.003,.010,.003],'#83796a');
    }
    for(let j=0;j<3;j++)line(f,[[-.093,.44-j*.069,.426+j*.048],[.014,.413-j*.069,.475+j*.039],[.10,.436-j*.071,.427+j*.048]],[.002,.010,.002],'#918572');
  }),part('trunk',[0,1.61,1.307],f=>{
    const p=[[0,.11,-.044],[.015,-.06,.059],[.042,-.33,.102],[.035,-.64,.121],[-.028,-.82,.221],[-.141,-.85,.365],[-.214,-.762,.429],[-.222,-.692,.385]];
    tube(f,p,[.178,.161,.134,.112,.092,.075,.059,.035],'#e5dfcc','hide');
    const contour=new T.CatmullRomCurve3(p.map(q=>new T.Vector3(...q)));
    const radii=[.178,.161,.134,.112,.092,.075,.059,.035];
    for(let k=0;k<10;k++){
      const u=.10+k*.045,at=contour.getPointAt(u),idx=u*7,j=Math.min(6,Math.floor(idx));
      const r=radii[j]+(radii[j+1]-radii[j])*(idx-j);
      const crease=Array.from({length:9},(_,i)=>{
        const a=-1.01+i*.255;return [at.x+r*sin(a),at.y-.013*cos(a),at.z+r*cos(a)+.001];
      });
      line(f,crease,[.002,.004,.005,.006,.007,.006,.005,.004,.002],'#827c70');
    }
  })];
  for(const s of [-1,1]){
    parts.push(part('ear'+s,[s*.333,1.84,.931],f=>{
      const rim=[[0,.14,.20],[s*.085,.19,.07],[s*.169,.155,-.172],[s*.219,.061,-.319],
        [s*.257,-.062,-.345],[s*.244,-.203,-.292],[s*.223,-.279,-.245],[s*.180,-.37,-.22],
        [s*.136,-.475,-.117],[s*.078,-.499,-.024],[s*.052,-.381,.108],[s*.027,-.21,.144],[0,.021,.19]];
      // A dished, fan-shaped pinna with a scalloped rim and radial folds.
      const pinna=[s*.151,-.11,.025],v=[...pinna],uv=[.51,.56],ix=[];
      rim.forEach((p,i)=>{v.push(...p);uv.push((p[2]+.35)/.56,(p[1]+.52)/.72);ix.push(0,i+1,(i+1)%rim.length+1);});
      f.draw(surface(v,ix,uv),origin,unit,'#dbd0bc',origin,'hide');
      line(f,[...rim,rim[0]],.010,'#857a69');
      for(const j of [2,4,6,8,10]){
        const q=rim[j],x=s*.154;
        line(f,[[s*.053,.058,.163],[x,-.054,.047],[s*.167+q[0]*.18,(q[1]-.07)*.57,q[2]*.56],
          [q[0],q[1],q[2]]],[.004,.012,.011,.003],'#9a8f7e');
      }
    }));
    for(const front of [-1,1])parts.push(part('leg'+s+','+front,[s*.36,.96,front===1?.55:-.69],f=>{
      loft(f,'y',[[-s*.07,.56,-front*.09,.046,.068],[-s*.055,.37,-front*.056,.149,.186],[-s*.034,.19,0,.199,.223],[0,-.019,0,.207,.216],[s*.01,-.24,-front*.041,.164,.174],
        [s*.014,-.40,-front*.044,.138,.154],[0,-.60,-.009,.137,.146],[0,-.80,.016,.143,.143],
        [0,-.90,.045,.158,.176],[0,-.947,.055,.142,.151]],'hide');
      for(let i=-1;i<=1;i++) f.oval([i*.077,-.91,.175-.021*Math.abs(i)],[.043,.044,.036],'#ccbfa6');
      for(let j=0;j<3;j++)line(f,[[s*.145,-.42+j*.050,-.105],[s*.154,-.405+j*.050,-.015],[s*.145,-.397+j*.050,.058]],
        [.002,.011,.003],'#968b79');
    }));
  }
  return parts;
}
function baku(){
  const parts=[part('body',origin,f=>{
    loft(f,'z',[[0,.94,-.91,.013,.08],[0,.96,-.80,.246,.361],[0,.95,-.58,.374,.497],
      [0,.91,-.22,.41,.47],[0,.92,.12,.377,.454],[0,1.04,.38,.395,.49],
      [0,1.13,.55,.316,.411],[0,1.20,.68,.189,.224],[0,1.20,.76,.086,.106]],'beast');
    for(let j=0;j<10;j++){
      const z=.50-j*.059,y=1.48-j*.012;
      blade(f,[[0,y-.064,z],[.012*sin(j),y+.057,z-.045],[0,y+.097+(j%3)*.022,z-.15]],
        [.033,.064,.003],[1,0,0],.021,'mane');
    }
    tube(f,[[0,1.19,-.78],[0,1.32,-.96],[.034,1.46,-1.10],[.09,1.48,-1.20]],[.076,.056,.035,.018],'#8a7862');
    for(let j=0;j<4;j++)blade(f,[[.082,1.46,-1.13],[.107+j*.012,1.53+j*.019,-1.23],[.12+j*.02,1.47+j*.036,-1.34]],
      [.018,.038,.002],[1,0,0],.013,'plume');
  }),part('head',[0,1.19,.56],f=>{
    loft(f,'z',[[0,.04,-.12,.155,.22],[0,.091,.014,.26,.32],[0,.12,.19,.268,.285],
      [0,.114,.33,.210,.199],[0,.071,.444,.128,.132],[0,.011,.504,.086,.086]],'mane');
    // Elephant snout, curling mane, paired tusks and soft-padded tiger feet.
    tube(f,[[0,.126,.351],[0,.044,.463],[0,-.141,.51],[.023,-.279,.56],[.08,-.30,.69],[.116,-.21,.731]],
      [.134,.116,.084,.062,.043,.022],'#ccbaa0','hide');
    for(const s of [-1,1]){
      eye(f,s,.224,.164,.236,.082);
      tube(f,[[s*.13,-.02,.347],[s*.19,-.117,.423],[s*.218,-.12,.505],[s*.23,-.079,.558]],
        [.050,.044,.024,.002],horn);
      blade(f,[[s*.19,.27,-.027],[s*.266,.389,-.05],[s*.299,.494,-.09],[s*.269,.545,-.112]],
        [.097,.133,.079,.004],[0,0,1],s*.036,'mane');
      blade(f,[[s*.238,.336,-.019],[s*.29,.417,-.049],[s*.299,.492,-.085]], [.047,.069,.009],[0,0,1],s*.012,'paper','#937860');
      // A hooked brow, the sweep of a whisker and a layered lion's ruff.
      line(f,[[s*.196,.286,.279],[s*.25,.277,.197],[s*.27,.235,.139],[s*.282,.257,.093]],[.009,.020,.014,.004],ink);
      line(f,[[s*.204,.018,.362],[s*.302,.038,.336],[s*.358,.087,.244],[s*.369,.16,.234]],[.014,.011,.007,.002],smoke);
      for(let j=0;j<5;j++)blade(f,[[s*.198,.211-j*.052,.021],[s*.299,.174-j*.066,-.084],[s*.317,.185-j*.071,-.185],
        [s*(.343+.014*sin(j)),.241-j*.091,-.327]], [.035,.086,.073,.002],[0,1,0],.016*s,'mane');
    }
  })];
  for(const s of [-1,1])for(const d of [-1,1])parts.push(part('leg'+s+','+d,[s*.25,.79,d===1?.42:-.57],f=>{
    const hock=d===1?-.038:-.139;
    loft(f,'y',[[-s*.08,.46,-d*.05,.027,.042],[-s*.049,.32,-d*.035,.128,.149],[-s*.016,.132,0,.164,.173],[s*.013,-.071,-.018,.146,.152],[s*.022,-.246,.036,.113,.123],
      [s*.032,-.424,hock,.086,.094],[s*.027,-.596,hock+.035,.063,.079],[s*.011,-.695,.011,.076,.108]],'mane');
    f.oval([0,-.704,.074],[.104,.068,.128],'#c5ad89');
    for(let j=-1;j<=1;j++){
      f.oval([j*.055,-.742,.144],[.044,.044,.071],'#b8a185');
      tube(f,[[j*.055,-.725,.182],[j*.055,-.739,.22],[j*.053,-.761,.239]],[.014,.011,.002],horn);
    }
  }));
  return parts;
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
function chicken(hen){
  const body=part('body',origin,f=>{
    loft(f,'z',[[0,.49,-.43,.029,.054],[0,.465,-.34,.153,.169],[0,.43,-.18,.214,.235],
      [0,.424,.027,.227,.229],[0,.475,.164,.174,.206],[0,.552,.212,.133,.164],[0,.605,.231,.111,.141],[0,.642,.24,.061,.099]],hen?'coverts':'bib');
    for(const s of [-1,1]){
      for(let i=0;i<6;i++){
        const y=.51-i*.020,z=.14-i*.028;
        blade(f,[[s*.184,y+.043,z],[s*.237,y+.020,z-.10],[s*(.254-.004*i),y-.021,z-.252],
          [s*(.194-.006*i),y-.064,z-.389]], [.014,.063,.058,.004],[0,1,0],.015*s,hen?'bib':'feather');
      }
      for(let j=0;j<(hen?4:6);j++){
        const x=s*(.01+j*.03),top=hen?.73-j*.027:1.04-j*.073;
        blade(f,[[x,.50,-.25],[x*1.17,.627,-.338],[x*1.3,top,-.475-j*.011],
          [x*1.38,top-(hen?.02:.072),-.579+j*.011],[x*1.43,top-(hen?.065:.245),-.638+j*.024]],
          [.017,.047,.053,.030,.002],[s*.34,.87,.34],.014,hen?'feather':j>3?'coverts':'plume');
      }
    }
  });
  const parts=[body,part('head',[0,.53,.17],f=>{
    loft(f,'y',[[0,.397,.103,.043,.05],[0,.357,.104,.107,.110],[0,.289,.115,.118,.139],
      [0,.218,.109,.109,.105],[0,.125,.097,.108,.107],[0,.056,.066,.128,.125],[0,-.012,.039,.141,.143],[0,-.103,-.01,.100,.121],[0,-.157,-.055,.045,.067]],
      hen?'bib':'mane');
    // Comb drawn as a single irregular edge; the two wattles hang independently.
    const w=hen?.55:1,corners=[[0,.338,.205],[0,.411,.197],[0,.461,.176],[0,.431,.11],
      [0,.497,.073],[0,.45,.029],[0,.48,-.021],[0,.415,-.04],[0,.434,-.086],[0,.372,-.062],[0,.344,-.005]];
    const curve=new T.CatmullRomCurve3(corners.map(p=>new T.Vector3(...p)),true,'catmullrom',.32);
    const outline=curve.getPoints(60).slice(0,-1).map(v=>v.toArray());
    const verts=[],uv=[],ix=[];
    for(const s of [-1,1]){
      verts.push(s*.039*w,.38,.076);uv.push(.5,.5);
      for(const [,y,z] of outline) {verts.push(s*.012*w,.34+(y-.34)*w,z*.82+.012);uv.push((z+.10)/.35,(y-.30)/.20);}
    }
    const m=outline.length+1;
    for(let i=0;i<outline.length;i++){const a=1+i,b=1+(i+1)%outline.length;ix.push(0,a,b,m,b+m,a+m,a,b,a+m,a+m,b,b+m);}
    f.draw(surface(verts,ix,uv),origin,unit,'#a95743',origin,'paper');
    tube(f,[[0,.257,.20],[0,.251,.252],[0,.23,.318]],[.059,.041,.002],ochre);
    for(const s of [-1,1]){
      eye(f,s,.103,.305,.153,.040);
      f.oval([s*.036,.191,.218],[.032,.079*w,.046],'#a75e4b',[-.22,0,s*.12]);
      line(f,[[s*.038,.237,.29],[s*.025,.231,.302],[0,.230,.312]],[.002,.005,.002]);
      for(let j=0;j<8;j++)blade(f,[[s*.100,.25-j*.031,.075],[s*(.112+j*.005),.182-j*.029,.042],[s*(.124+j*.005),.134-j*.031,-.048]],
        [.009,.032,.002],[0,0,1],.004,'feather');
    }
  })];
  for(const s of [-1,1])parts.push(part('foot'+s,[s*.087,.278,.005],f=>{
    tube(f,[[0,.014,-.023],[s*.012,-.064,-.049],[s*.017,-.139,-.023],[s*.018,-.24,.01]],
      [.039,.032,.019,.016],ochre);
    toes(f,false,[s*.018,-.259,.011]);
    for(let j=0;j<4;j++)line(f,[[-.005,-.22+j*.024,.019],[.017,-.22+j*.024,.031],[.030,-.22+j*.024,.023]],.003,'#8a795a');
  }));
  return parts;
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
  }),part('head',[0,1.53,.006],f=>{
    loft(f,'z',[[0,.178,-.329,.039,.087],[0,.179,-.26,.175,.238],[0,.184,-.14,.265,.285],
      [0,.172,.054,.281,.249],[0,.142,.227,.238,.192],[0,.103,.343,.164,.131],[0,.084,.419,.097,.071]],'scales');
    f.oval([0,.069,.421],[.125,.053,.05],'#d2b498');
    line(f,[[-.10,.073,.450],[-.009,.055,.472],[.059,.062,.466],[.10,.080,.449]],[.004,.014,.011,.003]);
    for(const s of [-1,1]){
      eye(f,s,.234,.235,.17,.083);
      line(f,[[s*.203,.345,.029],[s*.275,.275,-.028],[s*.291,.178,-.046],[s*.278,.102,-.049],[s*.215,.007,-.05]],[.006,.014,.018,.015,.003]);
      line(f,[[s*.217,.319,-.058],[s*.277,.257,-.109],[s*.282,.158,-.105]],[.003,.011,.003],smoke);
      tube(f,[[s*.084,.076,.402],[s*.156,.037,.415],[s*.209,-.002,.407],[s*.246,.007,.38]],[.014,.012,.009,.002],ochre);
      blade(f,[[s*.221,.152,-.169],[s*.319,.202,-.241],[s*.387,.239,-.315],[s*.418,.268,-.359]],
        [.045,.085,.064,.003],[0,1,0],.018*s,'feather');
    }
    // Soft black eboshi, pinched high above the carp's brow.
    loft(f,'y',[[0,.829,-.201,.019,.023],[.021,.796,-.18,.077,.069],[.034,.703,-.132,.102,.10],
      [.017,.574,-.09,.107,.123],[0,.493,-.057,.151,.149],[0,.401,-.037,.187,.172],[0,.375,-.035,.193,.17]],'plume','#807f73',.037);
    for(const s of [-1,1])line(f,[[s*.164,.406,-.023],[s*.237,.324,-.046],[s*.257,.234,-.073],[s*.246,.112,-.083]],
      [.013,.011,.008,.004],'#4d4c43');
  })];
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
function ox(batch) {
  const g=new T.Group(),mat=scrollPigment();
  const body=batch(g,b=>pullingOx(b,false)).geometry;body.translate(0,0,-3.02);
  const parts=[{name:'body',pivot:origin,geometry:body,material:mat}];
  for(const s of [-1,1])for(const d of [-1,1]){
    const shape=batch(g,b=>oxLeg(b,s,d===1)).geometry;
    parts.push({name:'leg'+s+','+d,pivot:[s*.28,.8,d===1?.44:-.62],geometry:shape,material:mat});
  }
  return parts;
}
export const faunaForms=['elephant','baku','hawk','ox','chicken','hen','fishfolk'];
export function faunaForm(n){return n.type==='chicken' && n.variant%4!==0?'hen':n.type;}
export function buildFaunaParts(kind,batch) {
  return kind==='ox'?ox(batch):kind==='chicken'||kind==='hen'?chicken(kind==='hen'):{elephant,baku,hawk,fishfolk}[kind]();
}
const elephantPivot=new T.Vector3(0,1.51,.80),headTurn=new T.Euler(),headQuat=new T.Quaternion();
export function poseFaunaPart(part,n,t,out) {
  const q=t*(n.type==='chicken'?6.5:3.2)+n.phase,walk=Math.min(1,n.speed*1.55),bow=n.gesture||0;
  const ack=Math.min(1,(n.flash||0)*2.2),key=part.name,s=key.endsWith('-1')?-1:1;
  out.position.fromArray(part.pivot);out.rotation.set(0,0,0,'XYZ');out.scale.setScalar(1);
  if(key.startsWith('leg')){
    const [side,fore]=key.slice(3).split(',').map(Number);
    out.rotation.x=side*fore*sin(q)*walk*(n.type==='elephant'?.18:.31);
  }else if(key.startsWith('foot'))out.rotation.x=s*.45*sin(q)*walk;
  else if(key==='head'){
    out.rotation.y=.12*sin(t*.77+n.phase)+.16*ack;
    out.rotation.z=.035*cos(t*1.2+n.phase);
    if(n.type==='chicken'){
      const peck=bow*(.5+.5*sin(q*1.6))**2;
      out.rotation.x=.15+.93*peck+.093*walk*sin(q);
      out.position.y-=.15*peck;out.position.z+=.078*peck;
    }else if(n.type==='hawk')out.rotation.y=n.perched?.68*sin(t*.73+n.phase):.06*cos(q);
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
