import * as T from './vendor/three.module.min.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash, surfaceGrain } from './scroll-sculpt.js';

const { PI, sin, cos, exp, abs, min, max } = Math;
const TAU = PI * 2;
const plate = 1254;
const width = 12.77;
const height = 15.45;

// Stations are measured on the painted plate. Every ring has its own centre
// in depth and its own thickness. Front and back share the outline in space,
// but unfold onto two different paintings. Coordinates face the temple door.
function sample(stations, row) {
  const i = min(stations.length - 2, Math.floor(row));
  const t = row - i, a = stations[max(0, i-1)], b = stations[i];
  const c = stations[i+1], d = stations[min(stations.length-1, i+2)];
  return b.map((v,k) => {
    // Limit the tangent at a tight turn (especially the tips of the fingers).
    const span = c[k] - v;
    const tangent = s => Math.sign(s) === Math.sign(span) ? Math.sign(s)*min(abs(s),2*abs(span)) : 0;
    const m = tangent((c[k]-a[k])*.5), n = tangent((d[k]-v)*.5);
    return v + t*(m + t*(3*span-2*m-n + t*(m+n-2*span)));
  });
}

function oval(x,y,cx,cy,rx,ry) {
  return exp(-(((x-cx)/rx)**2 + ((y-cy)/ry)**2));
}

function faceDepth(x,y) {
  // Nose bridge, alae, sockets, lips, the weight of the jowls and the
  // projecting chin all change the profile as the viewer walks around it.
  let z = .39*oval(x,y,630,215,26,69) + .47*oval(x,y,629,256,30,19)
    + .12*oval(x,y,630,297,37,11) - .055*oval(x,y,629,285,39,8)
    + .28*oval(x,y,623,353,84,35) - .19*oval(x,y,626,380,99,13);
  for (const s of [-1,1]) {
    z += .21*oval(x,y,629+s*25,256,13,14) + .24*oval(x,y,626+s*106,273,49,52)
      - .19*oval(x,y,626+s*83,209,56,18) + .12*oval(x,y,630+s*83,179,58,13);
  }
  return z;
}

function torsoDepth(x,y,front) {
  const breast = .26*(oval(x,y,454,619,89,69)+oval(x,y,735,614,93,62));
  const knees = 1.13*(oval(x,y,185,1043,220,176)+oval(x,y,1063,1042,220,176));
  const feet = .37*(oval(x,y,430,1205,113,49)+oval(x,y,738,1206,96,46));
  if (!front) return .26*oval(x,y,624,769,309,208) + knees*.33;
  // Broad sweeping pleats converge at the dressed shoulder. At the lap
  // each pleat sinks between the knees before turning up the opposite shin.
  const chestY = 842-.00145*(x-349)**2;
  const lapY = 1070-.00085*(x-573)**2;
  return breast+knees+feet + .16*exp(-(((y-chestY)/17)**2))
    + .15*exp(-(((y-lapY)/18)**2)) - .21*oval(x,y,627,1022,120,162);
}

const head = [
  [3,604,651,-.06,.11],[13,581,675,-.06,.49],[38,551,701,-.04,.88],
  [55,529,720,-.04,1.13],[83,495,754,-.025,1.56],[113,461,783,-.02,1.84],
  [148,427,809,0,1.99],[190,402,835,0,2.07],[232,393,843,.035,2.12],
  [271,411,824,.09,2.12],[309,429,806,.14,2.08],[346,440,797,.19,1.97],
  [377,450,785,.22,1.8],[403,481,757,.28,1.52],[421,537,706,.32,1.09],
  [432,596,648,.36,.47],[434,617,629,.36,.12],
];
const torso = [
  [301,518,719,-.1,.78],[377,470,773,-.14,1.12],[404,405,828,-.16,1.29],
  [418,350,878,-.17,1.44],[438,306,918,-.19,1.62],[467,274,944,-.2,1.82],
  [504,247,978,-.22,1.91],[552,227,1014,-.23,2.05],[598,210,1017,-.22,2.15],
  [641,183,1035,-.21,2.21],[690,152,1046,-.17,2.24],[752,121,1054,-.12,2.29],
  [799,113,1077,-.08,2.30],[844,120,1116,-.03,2.36],[865,148,1145,.03,2.45],
  [888,108,1158,.09,2.64],[923,58,1198,.13,2.84],[968,29,1227,.17,3.0],
  [1015,12,1240,.17,3.10],[1071,5,1247,.16,3.18],[1115,10,1239,.16,3.24],
  [1161,28,1218,.17,3.20],[1192,23,1226,.19,3.12],[1221,28,1231,.20,3.04],
  [1234,41,1214,.18,2.9],[1243,141,1125,.14,2.65],
];
const raisedArm = [
  [546,239,286,1.19,.19],[578,217,311,1.30,.35],[636,206,330,1.38,.46],
  [674,192,307,1.34,.51],[714,161,302,1.15,.57],[770,127,296,.99,.65],
  [813,113,279,.92,.66],[844,131,258,.91,.54],[865,157,219,.88,.33],[870,183,200,.85,.12],
];
const raisedPalm = [
  [540,242,291,1.64,.20],[548,222,305,1.73,.28],[562,207,315,1.80,.29],
  [584,206,330,1.83,.31],[607,207,344,1.85,.32],[637,211,335,1.85,.33],
  [662,225,317,1.78,.28],[677,249,292,1.71,.19],[680,263,281,1.68,.07],
];
const fingers = [
  [[479,215,224],[489,207,231],[511,202,229],[537,200,226],[566,205,231],[579,213,226]],
  [[450,247,254],[457,238,261],[478,233,263],[515,230,261],[548,227,261],[558,238,255]],
  [[435,270,278],[442,264,286],[459,262,290],[499,260,288],[537,258,287],[553,263,281]],
  [[451,301,308],[460,292,317],[482,289,317],[510,287,314],[544,285,311],[557,292,305]],
  [[517,338,347],[524,328,355],[540,321,353],[561,314,350],[588,309,349],[611,308,344],[627,314,334]],
];
const offeredPalm = [
  [818,1029,1071,.82,.32],[826,1005,1095,1.01,.43],[840,987,1124,1.22,.50],
  [855,978,1145,1.42,.53],[871,977,1160,1.59,.53],[887,984,1154,1.68,.48],
  [904,1000,1138,1.69,.40],[918,1027,1110,1.64,.29],[923,1052,1075,1.55,.12],
];
const sleeve = [
  [425,848,863,-.20,.19],[444,836,914,-.18,.47],[489,830,959,-.13,.70],
  [552,828,1009,-.08,.85],[584,828,1016,-.05,.86],[644,832,1032,.02,.92],
  [699,836,1048,.13,.97],[748,839,1058,.24,.99],[785,842,1083,.39,1.04],
  [819,851,1111,.49,1.06],[848,866,1135,.58,1.03],[874,883,1141,.62,.94],
  [899,908,1106,.62,.86],[912,943,1064,.64,.66],[916,976,1025,.61,.39],
];

function paintedFigure() {
  const xyz=[],uv=[],sidePaint=[],ix=[],seams=[];
  function sectionAt(table,y){
    let hi=1;
    while(hi<table.length-1 && table[hi][0]<y)hi++;
    const a=table[hi-1],b=table[hi],t=T.MathUtils.clamp((y-a[0])/(b[0]-a[0]),0,1);
    return sample(table,hi-1+t);
  }
  function volume(stations,{sides=32,step=3,under=false,rear='plate',relief=null,cranial=false}={}) {
    const rows=(stations.length-1)*step, start=xyz.length/3;
    for (let half=0;half<2;half++) {
      const front=half===0, offset=xyz.length/3;
      for (let j=0;j<=rows;j++) {
        const [y,left,right,mid,depth]=sample(stations,j/step);
        const full=sectionAt(cranial?head:torso,y);
        for (let k=0;k<=sides;k++) {
          const a=PI*(k/sides+half-.5), side=sin(a), outward=cos(a);
          const x=left+(right-left)*(side+1)*.5;
          const distance=depth*abs(outward)+(relief?relief(x,y,front):0)*outward*outward;
          const z=mid+(front?distance:-distance);
          let wy=3.08+(1243-y)*height/plate,wz=z;
          if(cranial){
            // Tip the gaze towards the pilgrim. The neck stays anchored
            // where the jaw passes in front of the collar.
            const nod=.14,dy=wy-13.5;
            wy=13.5+dy*cos(nod)-z*sin(nod);
            wz=z*cos(nod)+dy*sin(nod);
          }
          xyz.push((x-627)*width/plate,wy,wz);
          const dressedSide=x>627, span=max(.001,full[4]);
          const depthRatio=(z-full[3])/span;
          const forward=depthRatio/(depthRatio>0?(cranial?1.12:1.15):1);
          const profileU=.5 + (dressedSide?-1:1)*T.MathUtils.clamp(forward,-.985,.985)*.5;
          const influence=1-T.MathUtils.smoothstep(abs(depthRatio),.29,.74);
          sidePaint.push(((dressedSide?1:0)+profileU)/2,1-max(2,min(1252,y*(cranial?1.028:1)))/plate,influence);
          let px=x,py=y,rearPage=!front, ground=under;
          if (!front) {
            if (rear==='skin') {
              // Hidden sides of each finger carry rice-paper tooth and the
              // knuckle wash. The palm creases belong on the outward surface.
              rearPage=false;ground=false;px=553+.15*(x-260);py=307+.11*(y-570);
            } else {
              px=plate-x;
            }
          }
          const margin=2, u=max(margin,min(plate-margin,px))/plate;
          const v=max(margin,min(plate-margin,py))/plate;
          uv.push(((rearPage?1:0)+u)*.5,1-((ground?1:0)+v)*.5);
          if(j<rows&&k<sides) {
            const n=offset+j*(sides+1)+k;
            ix.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);
          }
        }
      }
    }
    const strip=(rows+1)*(sides+1);
    for(let j=0;j<=rows;j++) {
      const k=start+j*(sides+1);
      seams.push([k,k+strip+sides],[k+sides,k+strip]);
    }
    // Close the smallest end sections; the wide lower drapery rests on its seat.
    for (const j of [0,rows]) {
      const first=start+j*(sides+1), ring=[];
      for(let h=0;h<2;h++)for(let k=0;k<sides;k++)ring.push(first+h*strip+k);
      const center=xyz.length/3;
      const firstFront=first+Math.floor(sides/2),firstBack=first+strip+Math.floor(sides/2);
      for(let axis=0;axis<3;axis++)xyz.push((xyz[firstFront*3+axis]+xyz[firstBack*3+axis])*.5);
      uv.push(...uv.slice(2*first,2*first+2));
      sidePaint.push(...sidePaint.slice(3*first,3*first+3));
      for(let k=0;k<ring.length;k++){
        const next=(k+1)%ring.length;
        if(j===0)ix.push(center,ring[k],ring[next]);
        else ix.push(center,ring[next],ring[k]);
      }
    }
  }
  // The main mass is continuous over the shoulders, back and both folded
  // legs. The knee lobes project much farther forward than the lower abdomen.
  volume(torso,{sides:47,step:3,under:true,relief:torsoDepth});
  volume(sleeve,{sides:21,step:3,rear:'skin',relief:(x,y,front)=>
    front?.18*sin((y+.53*x)*.064)*exp(-(((y-748)/152)**2)):0});
  volume(raisedArm,{sides:23,rear:'skin'});
  volume(raisedPalm,{sides:29,rear:'skin',relief:(x,y,front)=>front?.10*oval(x,y,319,613,30,45):0});
  for(const [i,stations] of fingers.entries()){
    const lift=i===4?1.87:1.65;
    volume(stations.map(([y,l,r],j)=>[y,l,r,lift+.02*j,max(.023,(r-l)*.0051)]),{sides:14,step:3,rear:'skin'});
  }
  volume(offeredPalm,{sides:31,rear:'skin',relief:(x,y,front)=>front?.11*oval(x,y,1071,867,52,30):0});
  volume(head,{sides:47,step:4,cranial:true,relief:(x,y,front)=>front?faceDepth(x,y):0});
  for(const side of [-1,1]) {
    const ear=[[234,414,429],[242,401,444],[269,392,453],[298,399,457],
      [330,405,452],[356,404,451],[393,394,456],[419,398,453],[432,407,444],[438,420,433]];
    volume(ear.map(([y,l,r],j)=>[y,side<0?l:1242-r,side<0?r:1242-l,
      -.03+.026*j,max(.03,min(.40,(r-l)*.009))]),{sides:16,step:3,cranial:true,
      relief:(x,y,front)=>front?-.09*oval(x,y,side<0?425:818,286,11,27):0});
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setAttribute('profileWash',new T.Float32BufferAttribute(sidePaint,3));
  g.setIndex(ix);g.computeVertexNormals();
  const normals=g.attributes.normal,a=new T.Vector3(),b=new T.Vector3();
  for(const [i,j] of seams){
    a.fromBufferAttribute(normals,i).add(b.fromBufferAttribute(normals,j)).normalize();
    normals.setXYZ(i,a.x,a.y,a.z);normals.setXYZ(j,a.x,a.y,a.z);
  }
  return g;
}

// A flat brush draws a ridge into the bronze as it turns. Its orientation
// stays in the xy picture plane; the narrow return behind it is solid in profile.
function repoussé(points,widths,steps,loop=false) {
  const path=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q)),loop);
  const xyz=[],indices=[],color=[],sides=6;
  for(let j=0;j<=steps;j++){
    const t=j/steps,q=path.getPoint(t),v=path.getTangent(t);
    const scale=Math.hypot(v.x,v.y)||1, wx=-v.y/scale,wy=v.x/scale;
    const f=t*(widths.length-1),k=min(Math.floor(f),widths.length-2);
    const w=widths[k]+(widths[k+1]-widths[k])*(f-k);
    for(let i=0;i<sides;i++){
      const a=TAU*i/sides, lip=cos(a)*w,shine=.52+.44*max(0,sin(a))+.07*cos(a);
      xyz.push(q.x+wx*lip,q.y+wy*lip,q.z+sin(a)*min(.12,w*.43));
      color.push(shine,shine,shine);
      if(j<steps){
        const n=j*sides+i,n2=j*sides+(i+1)%sides;
        indices.push(n,n+sides,n2,n2,n+sides,n2+sides);
      }
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setAttribute('color',new T.Float32BufferAttribute(color,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function aureole() {
  const s=sculpture(),z=-3.49;
  const ring=(rx,ry,cy,a)=>[rx*sin(a)*(1-.13*max(0,cos(a))**2),cy+ry*cos(a),z];
  for(const [w,h,y,r,tint] of [[7.67,8.9,10.34,.133,'#a98757'],[7.37,8.66,10.34,.054,'#dac08d'],
    [4.21,4.80,14.67,.108,'#a18255'],[3.98,4.55,14.67,.055,'#d8c393']]){
    const points=Array.from({length:88},(_,i)=>ring(w,h,y,i*TAU/88));
    s.add(repoussé(points,[r,r*1.12,r*.86,r],112,true),tint);
  }
  // Both arcs grow up from the lotus, then lean towards the crown. Open
  // spaces between their hooks reveal the offering procession on the screen.
  for(const side of [-1,1])for(let i=0;i<13;i++){
    const a=.134+i*.194+.011*sin(i*4.3+side), q=ring(7.62,8.90,10.34,a);
    const tall=1.10+.24*sin(i*2.13+.41*side)+.20*cos(a);
    const reach=.98+.19*sin(i*1.14);
    const p=(rad,tang,depth=0)=>[side*(q[0]+(sin(a)*rad+cos(a)*tang)*reach),
      q[1]+(cos(a)*rad-sin(a)*tang)*tall,z+depth];
    s.add(repoussé([p(-.04,.38),p(.23,.53),p(.53,.35),p(.63,.07),
      p(.85,-.11),p(1.23,-.13),p(1.49,-.42)],
      [.025,.096,.157,.126,.092,.068,.004],22),'#a38151');
    s.add(repoussé([p(.03,.54,.014),p(.21,.78,.014),p(.56,.69,.014),
      p(.79,.47,.014),p(.71,.20,.014),p(.79,.04,.014),p(1.06,-.15,.014)],
      [.014,.11,.124,.096,.08,.064,.004],20),'#c4a36b');
    if(i%2===0) {
      s.add(repoussé([p(-.10,.12,.04),p(-.35,.03,.04),p(-.35,-.27,.04),
        p(-.12,-.44,.04),p(.13,-.44,.04)], [.018,.064,.080,.047,.006],12),'#9a8159');
    }
  }
  const finial=[[0,19.14,z],[-.31,19.33,z],[-.50,19.73,z],[-.37,20.13,z],[.02,20.64,z],
    [.17,20.91,z],[.23,20.51,z],[.48,20.10,z],[.49,19.69,z],[.29,19.38,z],[0,19.14,z]];
  s.add(repoussé(finial,[.063,.122,.094,.046,.088,.121,.063],36),'#c4a16b');
  s.add(repoussé([[0,19.28,z+.03],[-.15,19.55,z+.03],[.06,19.83,z+.03],[.13,20.15,z+.03]],
    [.016,.088,.06,.005],13),'#d4bc8c');
  return s.finish();
}

// An engraved line on a petal only needs its painted top. Flush ribbon
// strokes retain the tapered margin with two vertices per station.
function chasedLine(knots,widths,steps){
  const curve=new T.CatmullRomCurve3(knots.map(q=>new T.Vector3(...q)));
  const xyz=[],ix=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t),dir=curve.getTangent(t);
    const side=new T.Vector3(-dir.y,dir.x,0).normalize();
    const f=t*(widths.length-1),k=min(Math.floor(f),widths.length-2);
    side.multiplyScalar(widths[k]+(widths[k+1]-widths[k])*(f-k));
    xyz.push(p.x+side.x,p.y+side.y,p.z+.012,p.x-side.x,p.y-side.y,p.z+.012);
    if(i){const j=2*i;ix.push(j-2,j-1,j,j-1,j+1,j);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(xyz,3));
  g.setIndex(ix);g.computeVertexNormals();return g;
}

function lotusSeat() {
  const s=sculpture(),motifs=[];
  // The section includes the rolled lip, the hollow between petals and a
  // narrow shadow around the foot. One lathed surface runs through all three.
  const profile=[[.10,5.96],[.17,6.31],[.24,6.46],[.34,6.50],[.44,6.43],[.49,6.21],
    [.55,6.19],[.61,6.31],[.72,6.34],[.78,6.10],[.85,5.91],[1.11,5.82],[1.51,5.77],
    [2.04,5.86],[2.41,6.03],[2.64,6.24],[2.73,6.29],[2.82,6.02],[2.90,6.27],
    [3.02,6.36],[3.11,6.27],[3.14,5.58],[3.14,.01]];
  const rim=new T.LatheGeometry(profile.map(([y,r])=>new T.Vector2(r,y)),82);
  const paint=[],pigment=new T.Color();
  for(let i=0;i<rim.attributes.position.count;i++){
    const y=rim.attributes.position.getY(i);
    pigment.set(y<.34||y>.88&&y<2.42?'#847861':y<.62||y>2.89?'#b7a380':'#716856');
    paint.push(pigment.r,pigment.g,pigment.b);
  }
  rim.setAttribute('color',new T.Float32BufferAttribute(paint,3));
  s.add(rim,'#fff',0,0,0,1,1,.785);
  for(let i=0;i<rim.attributes.position.count;i++)motifs.push(0,0,0);
  const petal=(u,t,ring)=>{
    const spread=.98*Math.pow(max(.0002,sin(PI*t)),.67)*(.80+.25*t);
    const up=ring===1, lip=1-u*u;
    return [u*spread+.14*t*t,up?1.38+t*1.52:1.65-t*.99,
      .07+.26*sin(t*PI)+.24*t*t + (.05+.22*sin(t*PI))*lip +.08*exp(-u*u*20)*sin(t*PI)];
  };
  for(const band of [0,1]){
    const geo=new T.BufferGeometry(),xyz=[],idx=[];
    for(let j=0;j<=9;j++)for(let i=0;i<=8;i++){
      const point=petal(i/4-1,j/9,band);xyz.push(...point);
      if(j<9&&i<8){const k=j*9+i;idx.push(k,k+1,k+9,k+1,k+10,k+9);}
    }
    geo.setAttribute('position',new T.Float32BufferAttribute(xyz,3));geo.setIndex(idx);geo.computeVertexNormals();
    const leaf=sculpture();leaf.add(geo,band?'#c1af8a':'#a49779');
    for(const side of [-1,1]){
      const edge=Array.from({length:11},(_,i)=>petal(side,.008+i*.098,band));
      leaf.add(chasedLine(edge,[.008,.024,.041,.025,.008],11),'#75644c');
      for(let j=0;j<(band?0:2);j++){
        const vein=Array.from({length:8},(_,k)=>{
          const t=k/7, pt=petal(side*(.02+.75*sin(t*1.37)),.16+.15*j+t*.49,band);
          pt[2]+=.014;return pt;
        });
        leaf.add(chasedLine(vein,[.006,.018,.014,.002],7),'#8d795b');
      }
    }
    const rib=Array.from({length:9},(_,j)=>{const p=petal(0,.06+j*.108,band);p[2]+=.010;return p;});
    if(!band)leaf.add(chasedLine(rib,[.005,.048,.033,.004],10),'#dacaa7');
    const form=leaf.finish(),count=band?23:25;
    for(let j=0;j<count;j++){
      const a=TAU*(j+.48*band)/count;
      s.add(form,'#fff',5.89*sin(a),.04*sin(j*2.61),4.62*cos(a),
        .98+.06*cos(j*1.33),1+.04*sin(j*3.15),1,0,a,.06*sin(j*2.1));
      // The little donors at the back of the hall also appear as chasing
      // on the upper lotus petals. Keep the incised border clear of the scene.
      const tile=(j+2)%6;
      for(let k=0;k<form.attributes.position.count;k++){
        if(!band||k>=geo.attributes.position.count){motifs.push(0,0,0);continue;}
        const u=(k%9)/8,v=Math.floor(k/9)/9;
        motifs.push((tile%3+.06+.88*u)/3,(1-Math.floor(tile/3)+.03+.94*v)/2,1);
      }
    }
  }
  const casting=s.finish();
  casting.setAttribute('votiveMotif',new T.Float32BufferAttribute(motifs,3));return casting;
}

function engravedBronze(loader) {
  const mat=surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.31),.53);
  // These are optical ink densities from the original offering procession.
  // Keep the aged bronze showing through the grooves.
  const votives=loader.load(new URL('./assets/world/daibutsu-lotus.webp',import.meta.url).href);
  votives.anisotropy=4;
  const prepare=mat.onBeforeCompile, key=mat.customProgramCacheKey();
  mat.onBeforeCompile=function(shader,renderer){
    prepare.call(this,shader,renderer);
    shader.uniforms.lotusVotives={value:votives};
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec3 votiveMotif; varying vec3 petalMotif;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\npetalMotif=votiveMotif;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nuniform sampler2D lotusVotives; varying vec3 petalMotif;')
      .replace('#include <color_fragment>',`#include <color_fragment>
        float incision=1.-texture2D(lotusVotives,petalMotif.xy).r;
        diffuseColor.rgb*=1.-.88*incision*petalMotif.z;`);
  };
  mat.customProgramCacheKey=()=>key+'-lotus-votives';return mat;
}

export function drawDaibutsu(p,f) {
  const loader=new T.TextureLoader();
  const map=loader.load(new URL('./assets/world/daibutsu-pigments.webp',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const profiles=loader.load(new URL('./assets/world/daibutsu-profiles.webp',import.meta.url).href);
  profiles.colorSpace=T.SRGBColorSpace;profiles.anisotropy=4;
  const pigment=brushWash(new T.MeshStandardMaterial({map,emissiveMap:map,emissive:'#e9d9be',
    emissiveIntensity:.29,roughness:1}),.025);
  const prepare=pigment.onBeforeCompile, key=pigment.customProgramCacheKey();
  pigment.onBeforeCompile=function(shader,renderer){
    prepare.call(this,shader,renderer);
    shader.uniforms.daibutsuProfiles={value:profiles};
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nattribute vec3 profileWash; varying vec3 strokeProfile;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nstrokeProfile=profileWash;');
    shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>','#include <common>\nuniform sampler2D daibutsuProfiles; varying vec3 strokeProfile;')
      .replace('#include <map_fragment>',`
        vec4 profilePigment=texture2D(daibutsuProfiles,strokeProfile.xy);
        vec4 paintedPigment=mix(texture2D(map,vMapUv),profilePigment,strokeProfile.z);
        diffuseColor*=paintedPigment;`)
      .replace('#include <emissivemap_fragment>','totalEmissiveRadiance*=paintedPigment.rgb;');
  };
  pigment.customProgramCacheKey=()=>key+'-four-portraits';
  const casting=surfaceGrain(brushWash(new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),.31),.53);
  for(const [name,g,material] of [['paintedMochiVairocana',paintedFigure(),pigment],
    ['chasedFlameAureole',aureole(),casting],['engravedLotusSeat',lotusSeat(),engravedBronze(loader)]]){
    // The painter derives the landmark's draw distance from the instance size.
    p.shapes[name]=g.scale(.1,.1,.1);
    f.part(name,0,0,0,10,10,10,'#fff',material);
  }
}
