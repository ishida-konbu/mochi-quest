import * as THREE from './vendor/three.module.min.js';
import { SilkPanels, silkMaterial } from './kosode.js';
import { wrapDelta } from './terrain.js';
import { SEA_ENSEMBLES, updateRyuguResident } from './ryugu-residents.js';
import { InkForm, surface, fin, pigment, seaPrint, INK, SOOT, PAPER, WARM, RED } from './ryugu-ink.js';

const {sin,cos,PI}=Math,tau=2*PI,ivory='#e9dcbf',moss='#9c9b75',aqua='#858d76',umber='#766451';
const v=(a,b,c)=>[a,b,c];
function part(name,pivot,draw) {
  const form=new InkForm();draw(form);
  return {name,pivot,geometry:form.geometry()};
}
function eye(f,x,y,z,side,r,forward=.48) {
  // The raised upper lid and displaced pupil lend the face an intent gaze.
  f.oval([x,y,z],[r*.59,r,r*.96],SOOT,[0,side*forward,0]);
  f.oval([x+side*r*.13,y+.006,z+.013],[r*.58,r*.87,r*.87],'#f3e7c8',[0,side*forward,0]);
  f.oval([x+side*r*.52,y+r*.01,z+r*.34],[r*.26,r*.56,r*.40],INK,[0,side*forward,0]);
  f.oval([x+side*r*.59,y+r*.19,z+r*.53],[r*.10,r*.15,r*.13],'#faf1d5');
  f.stroke([[x+side*r*.08,y+r*.78,z+r*.73],[x+side*r*.45,y+r*1.02,z+r*.17],
    [x+side*r*.09,y+r*.92,z-r*.88]],[.007,.023,.006],INK,'paper',7);
}
const breamSections=[[-.89,.028,.048,-.12],[-.68,.11,.19,-.09],[-.48,.22,.34,-.04],[-.20,.31,.45,0],
    [.12,.36,.48,.04],[.40,.324,.43,.078],[.62,.24,.32,.105],[.785,.14,.18,.09],[.87,.055,.072,.075]];
// The court players dress around their anatomy: the dancer's mantle clears
// each ray, the drummer's short coat leaves the shell exposed, and a scribe
// knots the indigo cloth above the roots of the eight working arms.
function courtGarb(kind,pivot) {
  const silk=new SilkPanels();
  if(kind==='bream'){
    // Two suspended shoulder panels flex over the flanks. The red underside
    // appears along their turned trail and the short pleats beneath the knot.
    for(const side of [-1,1]){
      const panel=(u,v,lift=0)=>{
        const peak=sin(Math.PI*u),z=-.63+.92*u-.043*v;
        const index=breamSections.findIndex(r=>r[0]>=z),lower=breamSections[index-1],upper=breamSections[index];
        const t=(z-lower[0])/(upper[0]-lower[0]);
        const [width,height,center]=[1,2,3].map(i=>THREE.MathUtils.lerp(lower[i],upper[i],t));
        const a=.40+.15*u+(.67+.69*peak)*v,fold=.010+.016*peak*v*cos(14*u-v);
        return [side*(width+fold+lift)*sin(a),center+(height+.015+lift)*cos(a),z];
      };
      silk.cut(15,26,panel,3);
      silk.cut(2,26,(u,v)=>panel(u,.928+.053*v,.006),4,'#af765b');
    }
  }else if(kind==='seaTurtle'){
    for(const side of [-1,1]){
      // The short open happi drapes from the neck over each shell margin;
      // leave the central scutes and the breast carrying the drum uncovered.
      const panel=(u,v,d=0)=>{
        const a=side*(.63+2.04*u),arc=sin(v*Math.PI);
        const y=.45-.81*v-.10*sin(Math.PI*u)*v;
        const radius=Math.sqrt(Math.max(.13,1-(y/.72)**2));
        return [sin(a)*(.565*radius+.012*arc+.020*cos(12*u-v)*v+d),
          y+.036*cos(5*u)*v, -.075+cos(a)*(.57*radius+d)];
      };
      silk.cut(19,24,panel,0);
      silk.cut(12,4,(u,v)=>panel(.015+.060*u,v,.008),4,'#e3c69f');
      silk.cut(3,24,(u,v)=>panel(u,.921+.057*v,.006),4,'#bd9d77');
    }
  }else{
    const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.19,0,.05));
    const q=new THREE.Vector3();
    const sash=(u,v,d=0)=>{
      const a=tau*u,lat=.42+.225*v+.054*sin(a),r=cos(lat);
      q.set((.443+d)*r*sin(a),.604*sin(lat),(.414+d)*r*cos(a)).applyQuaternion(tilt);
      return [q.x,.33+q.y,-.055+q.z];
    };
    silk.cut(6,42,sash,1);
    silk.cut(2,42,(u,v)=>sash(u,.065+.082*v,.004),4,'#dcc99f');
    const knot=sash(.715,.51);
    for(const side of [-1,1]){
      silk.cut(16,8,(u,v)=>{
        return [knot[0]-.10*v-.07*sin(v*Math.PI)+(u-.5)*.078,
          knot[1]+side*.043*v-.245*v*v+.014*cos(tau*u),
          knot[2]-(side<0?.217:.115)*v+(u-.5)*.060];
      },1);
    }
  }
  return {name:kind+'-silk',pivot,geometry:silk.finish(),material:silkMaterial()};
}
function breamBody(f) {
  // The artwork is mapped once to each flank. The lateral line and operculum
  // run nose to tail on both sides around a continuous, spindle-shaped body.
  const positions=[],uv=[],indices=[],sides=32;
  breamSections.forEach(([z,w,h,lift],i)=>{
    for(let j=0;j<=sides;j++) {
      const a=j*tau/sides;
      positions.push(w*sin(a),lift+h*cos(a),z);
      uv.push((z+.89)/1.76,.5+.5*(lift+h*cos(a))/.56);
      if(i<breamSections.length-1 && j<sides){
        const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
      }
    }
  });
  f.draw(surface(positions,indices,uv),[0,0,0],[1,1,1],'#fffaec',[0,0,0],'scales');
  const top=[v(0,.13,-.74),v(0,.27,-.63),v(0,.26,-.58),v(0,.43,-.53),v(0,.40,-.45),
    v(0,.54,-.39),v(0,.49,-.32),v(0,.62,-.25),v(0,.54,-.17),v(0,.66,-.1),
    v(0,.57,-.02),v(0,.66,.06),v(0,.55,.15),v(0,.59,.25),v(0,.48,.36),v(0,.37,.45)];
  fin(f,top,'#ad8874',[0,.25,-.16],false);
  for(let i=2;i<top.length-1;i+=2){
    const [,y,z]=top[i]; f.stroke([[0,y*.76,z+.085],top[i+1]],[.011,.0035],SOOT,'paper',6);
  }
  fin(f,[v(.01,-.34,-.42),v(.01,-.48,-.54),v(.01,-.50,-.43),v(.01,-.43,-.18),v(.01,-.27,-.13)],'#ae8974',[0,-.26,-.19]);
  for(const s of [-1,1]){
    eye(f,s*.226,.205,.63,s,.099,.47);
    f.stroke([[s*.258,.268,.56],[s*.244,.304,.64],[s*.193,.295,.731]],[.009,.027,.008],SOOT);
    f.stroke([[s*.165,.049,.789],[s*.111,-.015,.838],[s*.057,-.003,.88]],[.006,.016,.007],SOOT);
    for(let j=0;j<5;j++)f.stroke([[s*.263,.245-j*.064,.48],[s*(.30+.009*cos(j)),.20-j*.06,.45]],[.009,.003],'#96745c');
  }
  f.oval([0,.079,.871],[.104,.049,.044],'#c7a18a');f.stroke([[-.08,.062,.901],[0,.049,.915],[.075,.066,.90]],[.005,.017,.006],INK);
  // A short tenugui tied beneath the dorsal spine, with an indigo knot.
  for (const s of [-1,1]) {
    f.stroke([[s*.01,.432,.32],[s*.185,.409,.31],[s*.293,.27,.34]],[.047,.052,.032],ivory);
    f.stroke([[s*.03,.457,.32],[s*.162,.434,.30],[s*.273,.337,.321]],[.006,.010,.005],'#778179');
  }
  f.oval([-.232,.365,.29],[.064,.056,.060],'#7b8073');
}
function bream() {
  const rigs=[part('bream-body',[0,.93,0],breamBody),courtGarb('bream',[0,.93,0])];
  rigs.push(part('bream-tail',[0,.815,-.78],f=>{
    const tail=[v(0,.055,.065),v(0,.15,-.13),v(.012,.31,-.36),v(.018,.33,-.49),
      v(.014,.15,-.42),v(0,-.011,-.33),v(-.012,-.26,-.53),v(0,-.27,-.43),v(0,-.18,-.18),v(0,-.055,.065)];
    fin(f,tail,'#b88771',v(0,0,.027));
  }));
  for(const s of [-1,1])rigs.push(part(s<0?'bream-fan':'bream-fin',[s*.283,.94,.17],f=>{
    const a=v(0,.02,.026);
    fin(f,[a,v(s*.18,.009,.06),v(s*.43,.21,-.01),v(s*.47,.18,-.11),v(s*.45,.07,-.15),v(s*.31,-.062,-.19),v(s*.095,-.1,-.12)],'#d1b697',a);
    if(s<0){
      const outer=[[-.99,.69,-.32],[-.94,.84,-.22],[-.81,.94,-.085],[-.64,.96,.04],[-.47,.89,.16],[-.32,.80,.24]];
      const hand=[-.43,.13,-.11],stem=[-.52,.32,-.11];
      f.stroke([hand,stem],[.035,.029],umber);
      fin(f,[stem,...outer],'#fff1cf',stem,false,'fan');
      for(let j=0;j<outer.length;j++)f.stroke([stem,outer[j]],[.012,.005],SOOT,'paper',6);
      f.oval(hand,[.062,.05,.055],WARM);
    }
  }));
  return rigs;
}
function turtle() {
  const rigs=[part('turtle-shell',[0,.85,-.14],f=>{
    f.oval([0,0,0],[.506,.59,.388],moss,[-.27,0,0]);
    // A single domed carapace and its upturned marginal scutes. Each plate
    // turns around the same rim, so a rim never cuts through the back.
    const shell=(a,r)=>{
      const outline=1+.017*sin(11*a+.2)*r**7,x=r*cos(a)*outline,y=r*sin(a);
      return [.554*x,.068+.675*y,-.083+.145*y-.387*Math.sqrt(Math.max(0,1-r*r))];
    };
    const p=[],uv=[],ix=[],n=56,rows=15;
    for(let j=0;j<=rows;j++)for(let i=0;i<=n;i++){
      const r=sin(.5*PI*j/rows),a=tau*i/n;
      p.push(...shell(a,r));uv.push(.5+.485*r*cos(a),.5+.485*r*sin(a));
      const k=j*(n+1)+i;if(j<rows&&i<n)ix.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);
    }
    f.draw(surface(p,ix,uv),[0,0,0],[1,1,1],'#fff7e2',[0,0,0],'shell');
    for(const r of [.885,.995]){
      const points=Array.from({length:65},(_,i)=>shell(i*tau/64,r));
      f.stroke(points,r>.9?.026:.012,r>.9?'#9a8966':'#73664e','paper',6);
    }
    for(let j=0;j<22;j++){
      const a=j*tau/22;
      f.stroke([shell(a,.888),shell(a+.025,.94),shell(a+.043,.991)],[.004,.009,.005],SOOT,'paper',5);
    }
    f.oval([0,.004,.207],[.425,.544,.23],'#d1c394',[-.24,0,0]);
    f.stroke([[0,.48,.28],[.015,.17,.45],[0,-.23,.40],[0,-.43,.30]],[.007,.014,.013,.005],umber);
    for(const s of [-1,1])for(let j=0;j<3;j++){
      const y=.31-.177*j;
      f.stroke([[s*.34,y+.06,.318],[s*.215,y,.405],[s*.045,y-.051,.435]],[.004,.015,.007],umber);
    }
    // Red plaited drum cord travels from the nape to the opposite hip.
    f.stroke([[-.35,.43,.16],[-.23,.25,.39],[0,.12,.47],[.33,-.15,.33]],[.031,.026,.028,.032],RED);
    f.oval([0,-.44,-.32],[.105,.21,.093],moss,[-.55,0,0]);
  }),part('turtle-head',[0,1.39,.095],f=>{
    f.stroke([[0,-.13,-.10],[0,.019,.08],[0,.096,.29]],[.148,.175,.169],moss);
    f.oval([0,.105,.306],[.268,.232,.319],moss,[-.16,0,0]);
    f.oval([0,.043,.487],[.208,.137,.216],'#c6bd91');
    for(const s of [-1,1]){
      eye(f,s*.208,.181,.404,s,.089,.5);
      f.stroke([[s*.105,.112,.646],[s*.035,.105,.676]],[.009,.015],INK);
      f.stroke([[s*.18,.03,.567],[s*.112,.015,.643],[s*.028,.027,.687]],[.005,.016,.006],SOOT);
      for(let j=0;j<3;j++)f.stroke([[s*.15,.244-j*.034,.209],[s*.211,.223-j*.034,.283]],[.012,.002],'#78795c');
    }
    f.oval([0,.285,.24],[.19,.092,.16],'#8d9080',[-.22,0,0],'cloth');
    f.stroke([[-.18,.27,.255],[-.27,.303,.171],[-.345,.25,.074]],[.048,.035,.009],'#949785');
  })];
  for(const s of [-1,1]){
    rigs.push(part(s<0?'turtle-left':'turtle-right',[s*.34,1.02,.084],f=>{
      f.stroke([[0,0,0],[s*.16,-.113,.04],[s*.29,-.09,.22],[s*.39,-.01,.35]],[.148,.136,.093,.054],moss);
      f.oval([s*.41,-.008,.36],[.087,.072,.093],'#a7a37d');
      // Each short mallet has a tapered boxwood handle and rice-white head.
      f.stroke([[s*.415,-.061,.37],[s*.43,.28,.50]],[.026,.019],umber);
      f.oval([s*.433,.303,.507],[.07,.078,.074],PAPER);
      for(let j=0;j<3;j++)f.stroke([[s*(.14+j*.054),-.005,.103+j*.035],[s*(.20+j*.045),-.073,.147+j*.040]],[.008,.004],SOOT,'paper',6);
    }));
    rigs.push(part(s<0?'turtle-paddle-l':'turtle-paddle-r',[s*.235,.427,-.16],f=>{
      f.oval([s*.089,-.09,-.073],[.11,.16,.23],moss,[.34,s*.43,0]);
      const toe=[s*.33,-.21,-.33];
      fin(f,[[s*.049,-.078,-.10],[s*.257,-.102,-.12],[s*.371,-.185,-.26],toe,[s*.16,-.26,-.32],[s*.061,-.15,-.21]],'#a19c75',[s*.086,-.12,-.14]);
    }));
  }
  rigs.push(courtGarb('seaTurtle',[0,.85,-.14]));
  rigs.push(part('turtle-drum',[0,.835,.47],f=>{
    const r=.294,z=.14;
    f.draw(new THREE.CylinderGeometry(r,r,.27,32),[0,0,z],[1,1,1],RED,[PI/2,0,0]);
    for(const sign of [-1,1]){
      f.oval([0,0,z+sign*.13],[r*1.03,r*1.03,.037],INK);
      f.oval([0,0,z+sign*.151],[r*.93,r*.93,.034],ivory);
    }
    for(let j=0;j<10;j++){
      const a=tau*j/10,b=a+tau/20;
      f.stroke([[r*cos(a),r*sin(a),.255],[r*cos(b),r*sin(b),.12],[r*cos(a+tau/10),r*sin(a+tau/10),.025]],.012,WARM,'paper',6);
    }
    f.oval([.055,-.019,.322],[.073,.069,.008],RED);
  }));
  return rigs;
}
const armRoot=i=>[sin(tau*i/8+.18)*.24,.843,cos(tau*i/8+.18)*.18];
const writingHand=armRoot(1), paperHand=armRoot(7);
const paperCorners=[[-.76,-.22,.42],[-.26,-.06,.48],[-.20,-.36,.58],[-.65,-.49,.55]];
function writtenPoint(line,u) {
  const row=.32+line*.19, column=.23+.05*(line%2)+u*(.53-.10*(line%2));
  const [a,b,c,d]=paperCorners;
  return a.map((v,i)=>(v+(b[i]-v)*column)*(1-row)+(d[i]+(c[i]-d[i])*column)*row+.012*(i===2));
}
function octopus() {
  const rigs=[part('octopus-mantle',[0,.86,0],f=>{
    f.oval([0,.33,-.055],[.432,.603,.401],'#fff9ed',[-.19,0,.05],'mantle');
    f.oval([0,.015,.079],[.384,.264,.352],'#c3967e');
    for(const s of [-1,1]){
      const x=s*.187;
      f.oval([x,.201,.330],[.091,.111,.059],SOOT,[0,s*.21,0]);
      f.oval([x,.208,.351],[.083,.097,.052],'#f2e4c4',[0,s*.21,0]);
      f.oval([x-s*.018,.216,.396],[.037,.058,.021],INK);
      f.oval([x-s*.028,.236,.414],[.012,.016,.008],'#fcf0cd');
      f.stroke([[s*.09,.274,.366],[s*.175,.32,.365],[s*.278,.305,.285]],[.008,.026,.005],INK);
      for(let j=0;j<4;j++)f.oval([s*(.328+.013*sin(j)),.09-j*.045,.156+.028*j],[.013,.024,.018],'#9d715e');
    }
    // The projecting siphon reads as an open, slightly pursed mouth.
    f.oval([0,.016,.367],[.137,.114,.153],'#b58271',[-.21,0,0]);
    f.oval([0,.026,.496],[.088,.076,.031],SOOT,[-.21,0,0]);
    f.oval([0,.037,.515],[.057,.045,.016],INK);
  })];
  rigs.push(courtGarb('octopus',[0,.86,0]));
  for(let i=0;i<8;i++){
    const angle=tau*i/8+.18,s=sin(angle),c=cos(angle), pivot=armRoot(i);
    const brush=i===1, paper=i===7;
    rigs.push(part('octopus-arm-'+i,pivot,f=>{
      // Each of the eight arms follows a different taper, including the two
      // short working wrists. Suckers run along their softer, inward face.
      const points=brush?[
        [0,0,0],[.19,-.14,.14],[.39,-.05,.23],[.49,.16,.18],[.46,.28,.13],[.39,.29,.16],
      ]:paper?[
        [0,0,0],[-.17,-.26,.16],[-.37,-.30,.36],[-.48,-.17,.43],[-.40,-.13,.47],
      ]:[
        [0,0,0],[s*.19,-.20,c*.20],[s*.39,-.48,c*.38],[s*.56,-.57,c*.49],
        [s*.66,-.51+sin(i)*.14,c*.54],[s*.67,-.36+sin(i)*.13,c*.47],
        [s*.57,-.33+sin(i)*.13,c*.42],
      ];
      const radii=points.map((_,j)=>.145*(1-(j/(points.length-1))*.94));
      f.stroke(points,radii,'#bd927c','paper',12);
      const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
      for(let j=0;j<7;j++){
        const u=(j+1)/8,pos=curve.getPointAt(u),r=.13*(1-u*.9);
        const side=s<0?-1:1;
        const button=[pos.x+side*r*.24,pos.y-r*.54,pos.z+r*.56];
        f.oval(button,[r*.38,r*.30,r*.29],'#e4d2ae');
        f.oval([button[0],button[1]-.012,button[2]+r*.22],[r*.23,r*.14,r*.11],'#a27d65');
      }
      if(brush){
        f.stroke([[.41,.055,.17],[.37,.48,.165],[.32,.87,.14]],[.034,.039,.037],WARM);
        f.stroke([[.32,.865,.14],[.304,.934,.137]],.049,INK);
        f.stroke([[.301,.929,.137],[.282,1.015,.131],[.213,1.155,.135]],[.061,.041,.004],INK);
        f.stroke([[.41,.059,.17],[.417,-.07,.17]],[.033,.017],umber);
      }else if(paper){
        fin(f,paperCorners,PAPER,paperCorners[0],false);
        f.oval([-.583,-.363,.55],[.028,.031,.017],RED);
      }
    }));
  }
  for(let line=0;line<3;line++){
    const start=writtenPoint(line,0),end=writtenPoint(line,1).map((v,i)=>v-start[i]);
    rigs.push(part('scribe-stroke-'+line,start.map((v,i)=>v+paperHand[i]),f=>{
      const middle=end.map((v,i)=>v*.55+(i===1?.012:0));
      f.stroke([[0,0,0],middle,end],[.004,.013,.005],INK,'paper',7);
    }));
  }
  return rigs;
}
function acknowledgement(){
  return part('letter',[0,1.76,.06],f=>{
    const sheet=[[-.17,-.10,.015],[.14,-.11,.021],[.18,.15,0],[-.13,.17,-.013]];
    fin(f,sheet,'#fff1d1',sheet[0],false);
    for(let j=0;j<2;j++)f.stroke([[.078-j*.068,.091,.018],[.069-j*.068,.057,.020],[.08-j*.068,.029,.026]],[.003,.011,.003],INK,'paper',6);
    f.oval([-.083,-.052,.025],[.027,.025,.006],RED);
  });
}
const illustrations=new Map();
export function seaPortrait(type) {
  if(!illustrations.has(type))illustrations.set(type,seaPrint(type).toDataURL());
  return illustrations.get(type);
}
const rotationTo=(from,to)=>new THREE.Quaternion().setFromUnitVectors(
  new THREE.Vector3(...from).normalize(),new THREE.Vector3(...to).normalize());
const strikes={};
for(const side of [-1,1]) {
  const mallet=[side*.433,.303,.507];
  strikes[side]=[rotationTo(mallet,[side*.41,.50,.35]),rotationTo(mallet,[-side*.155,-.14,.683])];
}
const nib=new THREE.Vector3(.213,1.155,.135),nibDirection=nib.clone().normalize();
const scratchTip=new THREE.Vector3(),touchPaper=new THREE.Quaternion();
const readyBrush=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.18,0,.15));
function movement(rig,n,t,d) {
  const beat=n.beat,accent=n.gesture,answer=Math.min(1,(n.flash||0)*2.5),name=rig.name;
  d.position.fromArray(rig.pivot);d.scale.setScalar(1);d.rotation.set(0,0,0);
  if(name==='letter'){
    d.position.y+=.21*(1-answer);d.rotation.z=-.18+.08*sin(t*6);
    d.scale.setScalar(answer);
  }else if(name==='bream-tail'){
    d.rotation.y=.42*sin(beat*2.15)*(.56+.44*accent);
  }else if(name==='bream-fan'){
    d.rotation.z=-.12-(.21+.26*sin(beat))*accent-.25*answer;
    d.rotation.y=.21*sin(beat*.52);d.rotation.x=.15*cos(beat);
  }else if(name==='bream-fin'){
    d.rotation.z=.15+accent*.31*cos(beat);d.rotation.y=.30*sin(beat*1.8);
  }else if(name==='turtle-head'){
    d.rotation.x=.07+.14*cos(beat)+answer*.35;
    d.rotation.y=.23*sin(beat*.26);
  }else if(name==='turtle-left'||name==='turtle-right'){
    const s=name==='turtle-left'?-1:1;
    const strike=Math.pow(.5+.5*cos(beat+s*PI/2),3)*accent;
    const [raised,contact]=strikes[s];
    d.quaternion.copy(raised).slerp(contact,strike);
  }else if(name.startsWith('turtle-paddle')){
    d.rotation.x=.30*sin(beat*.6+(name.endsWith('l')?0:2.8));
  }else if(name==='octopus-mantle'||name==='octopus-silk'){
    d.rotation.z=.06*sin(beat)+.12*answer;
    d.scale.set(.99+.022*sin(beat),1.01-.030*sin(beat),1);
  }else if(name==='octopus-arm-1' || name.startsWith('scribe-stroke')){
    // Crossing the sheet from left to right, the nib keeps its point on the
    // same ruled position as the growing ink. It lifts between characters.
    const phrase=((t+n.phase*.31)%7.4)/7.4;
    const work=THREE.MathUtils.clamp((phrase-.14)/.69*3,0,3);
    const line=Math.min(2,Math.floor(work)),progress=work-line;
    const stroke=THREE.MathUtils.smoothstep(progress,.12,.88);
    if(name.startsWith('scribe-stroke')){
      const written=Number(name.slice(-1));
      d.scale.setScalar(written<line?1:written===line?stroke:0);
    }else{
      const point=writtenPoint(line,stroke);
      scratchTip.fromArray(point);
      scratchTip.x+=paperHand[0]-writingHand[0];scratchTip.z+=paperHand[2]-writingHand[2];
      scratchTip.y+=.105*(1-Math.sin(PI*progress)**.35);
      const reach=scratchTip.length()/nib.length();
      touchPaper.setFromUnitVectors(nibDirection,scratchTip.normalize());
      const lean=THREE.MathUtils.smoothstep(phrase,.025,.14)*(1-THREE.MathUtils.smoothstep(phrase,.83,.97))*(1-.77*answer);
      d.quaternion.copy(readyBrush).slerp(touchPaper,lean);
      d.scale.setScalar(THREE.MathUtils.lerp(1,reach,lean));
    }
  }else if(name.startsWith('octopus-arm') && name!=='octopus-arm-7'){
    const i=Number(name.slice(-1));
    d.rotation.z=.16*sin(beat+i*1.1);d.rotation.x=.09*cos(beat*.81+i);d.rotation.y=.07*cos(beat+i*.6);
  }
}
export function createRyuguPerformers(scene) {
  const root=new THREE.Group();root.name='竜宮の舞楽と書会';scene.add(root);
  const rigs={},material=pigment(),base=new THREE.Object3D(),limb=new THREE.Object3D(),combined=new THREE.Matrix4(),pose={};
  for(const [kind,make] of Object.entries({bream,seaTurtle:turtle,octopus})) {
    rigs[kind]=[...make(),acknowledgement()].map(r=>{
      const mesh=new THREE.InstancedMesh(r.geometry,r.material||material,SEA_ENSEMBLES);
      mesh.name=kind+' / '+r.name;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled=false;mesh.count=0;root.add(mesh);
      return {...r,mesh};
    });
  }
  const counts={bream:0,seaTurtle:0,octopus:0};
  return (time,player,camera,nearbyNpcs)=>{
    root.visible=!!player.diveDepth;
    if(!root.visible)return;
    counts.bream=counts.seaTurtle=counts.octopus=0;
    for(const resident of nearbyNpcs) {
      if(!resident.seaResident)continue;
      // During the portrait camera the live clock pauses. Advance a temporary
      // pose so a photographed musician continues to play without moving a hit volume.
      const n=Math.abs(resident.sampleTime-time)>.02 ? updateRyuguResident(Object.assign(pose,resident),time) : resident;
      const dx=wrapDelta(n.x-player.x),dz=wrapDelta(n.z-player.z),dy=n.y-player.y;
      if(dx*dx+dz*dz+dy*dy>68**2)continue;
      const index=counts[n.type]++,answer=Math.min(1,(n.flash||0)*2.5);
      base.position.set(player.x+dx,n.y,player.z+dz);
      base.rotation.set(n.type==='bream'?-.12+.075*sin(n.beat):.04*cos(n.beat*.61)+.10*answer,n.heading,
        n.type==='bream'?.115*sin(n.beat)*n.gesture:.041*sin(n.beat*.84));
      base.scale.setScalar(n.stature);base.updateMatrix();
      for(const r of rigs[n.type]){
        movement(r,n,time,limb);limb.updateMatrix();
        combined.multiplyMatrices(base.matrix,limb.matrix);r.mesh.setMatrixAt(index,combined);
      }
    }
    for(const [type,parts] of Object.entries(rigs)) for(const r of parts) {
      r.mesh.count=counts[type];r.mesh.visible=counts[type]>0;
      if(r.mesh.visible) r.mesh.instanceMatrix.needsUpdate=true;
    }
  };
}
